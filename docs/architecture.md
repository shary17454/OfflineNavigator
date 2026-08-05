# Architecture

This is the implemented architecture, not a target diagram. Repository operating constraints are in [`../AGENTS.md`](../AGENTS.md); paths are indexed in [`project-structure.md`](project-structure.md).

## Repository boundary

There are three independent deployable products:

```text
OfflineNavigator.xcodeproj ── Madall iOS ── Core Data + optional iCloud KVS
Riwaya.xcodeproj           ── Mawrooth iOS ── Core Data
rawayah/                   ── Heritage platform
                              ├─ NestJS API ── Prisma ── PostgreSQL
                              ├─ Next.js web
                              ├─ Next.js admin
                              └─ Flutter mobile ── HTTP + SharedPreferences notebook
```

There is no shared library or synchronization protocol between the two Swift apps and `rawayah/`. The similar sample work “ظل على الرمال” in `Riwaya/Services/PersistenceController.swift` and `rawayah/apps/mobile/lib/features/offline/offline_models.dart` is duplicated seed content, not a shared model.

## Madall: native navigation

### Runtime flow

`OfflineNavigatorApp` creates `PersistenceController.shared` and injects its `viewContext` into `ContentView`.

`ContentView` is the composition root:

- `@FetchRequest(Waypoint.fetchRequest())` observes Core Data.
- `@StateObject LocationMotionManager` publishes `CLLocation`, `CLHeading`, and Core Motion yaw.
- `@StateObject ICloudBackupService` exposes optional KVS backup state.
- `@AppStorage` stores map mode, proximity threshold, and backup preference.
- `WaypointMapView` bridges `MKMapView`; `OfflineGridMapView` draws a tile-free `Canvas`.
- `NavigationMath` computes bearings and formats distance.
- `GPXService` parses `wpt`, `rtept`, and `trkpt`, and writes exported XML.

The primary state flow is:

```text
CoreLocation/CoreMotion → LocationMotionManager → ContentView
Core Data → @FetchRequest<Waypoint> → list/map/navigation readout
user action → ContentView/GPXService → NSManagedObjectContext.save()
waypoints → ICloudBackupService → JSON snapshots → NSUbiquitousKeyValueStore
```

Core Data remains authoritative. iCloud restore only inserts snapshot IDs not already present; it does not update or delete existing waypoints.

### Current strengths

- Pure navigation calculations are isolated in `NavigationMath` and unit tested.
- GPX parsing is isolated and tests cover all three accepted point element types plus malformed XML.
- `WaypointMapView.Coordinator` avoids resetting the map region on every SwiftUI update.
- File import correctly brackets security-scoped URL access.

### Current weaknesses and improvements

| Weakness in current code | Evidence | Proposed improvement | Measurable acceptance |
| --- | --- | --- | --- |
| Root view owns persistence, import/export, backup, location, proximity, sharing, and presentation. | `OfflineNavigator/ContentView.swift` is over 400 lines. | Extract cohesive action/state objects only when touching those flows; retain Core Data as source of truth. | No new feature adds more than one unrelated responsibility to `ContentView`; extracted logic has unit tests. |
| Some save failures are invisible. | `PersistenceController.save()` rolls back without returning or logging the error; `autoBackupIfEnabled()` uses `try?`. | Make mutating operations throw or return a result that the caller presents/records safely. | Every user-triggered write has a tested failure path; no new bare `try?` around persistence or backup. |
| GPX import reads the complete file and creates every object on the view context. | `Data(contentsOf:)` and a loop in `GPXService.importWaypoints`. | Add input limits and use a background context/batched saves for large tracks. | A test fixture with at least 10,000 points completes without blocking UI work; invalid coordinates are rejected. |
| Location errors are published but not shown. | `locationError` is set in `didFailWithError`; `ContentView` never reads it. | Map authorization and runtime failures to actionable UI state. | Denied, restricted, unavailable, and transient failure states each have a UI/test case. |
| KVS is a small preference store, not a general backup database. | Entire waypoint snapshot array is stored at `OfflineNavigator.Waypoints.v1`. | Enforce encoded-size limits or migrate backup to an appropriate iCloud store before growth. | Backup refuses oversize payloads with a visible error; restore compatibility is fixture-tested. |

## Mawrooth: native offline notebook

### Runtime flow

`RiwayaApp` injects the Core Data context, Arabic locale, and right-to-left layout. `ContentView` leads to `LibraryView`, whose `@FetchRequest` observes `Novel` objects sorted by `updatedAt`.

```text
Core Data Novel ↔ Chapter (cascade relationship)
       ↓
LibraryView → NovelDetailView → ChapterHubView
                                  ├─ ChapterEditorView
                                  └─ ReaderView
```

- `Novel.orderedChapters` sorts the relationship set by `orderIndex`.
- `ChapterEditorView` debounces autosave by 1.2 seconds on the main queue.
- `TextStats` counts Unicode letter/digit runs and calculates Arabic labels.
- `ReaderView` stores reading preferences in `@AppStorage` and writes `lastReadChapterID`.
- `NovelExportService` produces an atomic temporary UTF-8 text file.

### Current weaknesses and improvements

| Weakness | Evidence | Proposed improvement | Measurable acceptance |
| --- | --- | --- | --- |
| Persistence errors are silently rolled back. | Mawrooth `PersistenceController.save()` has no result. | Surface save state in editors and preserve dirty text on failure. | Simulated save failure leaves editor content intact and displays a localized message. |
| Autosave scheduling is ad hoc. | `DispatchQueue.main.asyncAfter` tokens in `ChapterEditorView`. | Use a cancellable task and flush on scene/background/disappear transitions. | Tests cover rapid edits, close-before-delay, and backgrounding without data loss. |
| Seeding is tied to “database has zero novels.” | `seedIfNeeded()` inserts demo content whenever count is zero. | Store an explicit seed/migration marker if demo recreation after user deletion is undesirable. | Deleting all novels and relaunching follows a documented, tested product decision. |
| Navigation contains a formatting defect and tightly coupled inline hub view. | `ChapterHubView` has a visibly misindented `NavigationLink` in `NovelDetailView.swift`. | Format touched code and split only if the hub gains independent behavior. | SwiftFormat/SwiftLint or review gate reports no indentation drift in changed Swift. |
| Core Data schema evolution is undocumented in code. | One `.xcdatamodel` version exists and no migration fixtures are present. | Add model versions and migration tests before changing persisted attributes. | Each schema change opens a store fixture from the immediately previous release. |

## Rawaya heritage platform

See [`rawayah-platform.md`](rawayah-platform.md) for endpoint and subsystem detail.

The API is a modular Nest application (`AuthModule`, `ContentModule`, `SearchModule`, `MediaModule`, `ReadingListsModule`, `PaymentsModule`, and others). `PrismaService` is the database adapter. Web/admin/mobile are API clients, but there is no generated or shared contract: web pages use local TypeScript types or `any`, while Flutter decodes dynamic maps.

### Important implemented boundaries

- Public content queries live mainly in `ContentService`.
- `JwtAuthGuard` authenticates selected endpoints; `PermissionGuard` resolves permissions from Prisma for handlers decorated with `@Permissions`.
- Local media uploads are written beneath `.rawaya-storage` and served at `/assets`.
- The Flutter offline notebook is independent from PostgreSQL and stores all works under `rawaya_offline_works_v1`.
- Redis is started by Docker Compose but no checked-in TypeScript service imports or uses a Redis client.
- `packages/ui`, `packages/types`, `packages/utils`, and `packages/config` have placeholder build scripts; they are not functioning shared architecture.

## Cross-product rules

- Never write a Prisma change to solve a `Waypoint` or `Novel` issue.
- Never assume Rawaya `ContentType` maps to Mawrooth `NovelGenre`.
- Do not introduce synchronization by matching titles or seed IDs.
- Any future bridge must define stable identifiers, conflict handling, deletion semantics, schema versioning, authentication, and an offline retry model before code is shared.

## Architecture change checklist

- [ ] Identify one product and one authoritative store.
- [ ] Draw the before/after data flow for any new boundary.
- [ ] Define failure, cancellation, retry, and rollback behavior.
- [ ] Keep framework objects at the edge (`NSManagedObject`, Prisma client, `Response<dynamic>`).
- [ ] Add contract tests where two processes communicate.
- [ ] Add migration compatibility tests where persisted shapes change.
- [ ] Measure heavy operations with realistic input: 10,000 GPX points, long chapters, or paginated content—not only seed data.
- [ ] Update this page only when the implemented boundary changes.

## Mistakes to avoid

- Calling either Swift app “MVVM”; no view-model layer is consistently implemented.
- Calling the npm `packages/*` shared modules; they currently contain placeholder package scripts.
- Calling Flutter fully Riverpod-managed; Riverpod currently provides the router, while screens such as `HomePage` and `OfflineLibraryPage` use local `State`.
- Treating Docker Compose Redis presence as runtime Redis integration.
- Treating historical build notes as current CI evidence.
