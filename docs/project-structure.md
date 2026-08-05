# Project structure

Use this map to place changes in the correct product. Repository-wide working rules are in [`../AGENTS.md`](../AGENTS.md); runtime relationships are in [`architecture.md`](architecture.md).

## Top level

```text
/workspace
├── AGENTS.md
├── README.md
├── OfflineNavigator.xcodeproj
├── OfflineNavigator/           # Madall iOS application target
├── OfflineNavigatorTests/      # Madall XCTest target
├── Riwaya.xcodeproj
├── Riwaya/                     # Mawrooth native iOS application target
├── RiwayaTests/                # Mawrooth XCTest target
├── rawayah/                    # Rawaya heritage platform monorepo
└── docs/                       # Cross-product engineering, support, and release docs
```

The two `.xcodeproj` files are separate native apps. `rawayah/apps/mobile/ios/Runner.xcodeproj` belongs only to the Flutter product.

## Madall (`OfflineNavigator/`)

| Path | Responsibility | Real types/examples |
| --- | --- | --- |
| `OfflineNavigatorApp.swift` | App entry and Core Data context injection | `OfflineNavigatorApp` |
| `ContentView.swift` | Root split view and current orchestration | `ContentView`, private `MapDisplayMode`, `AddWaypointView`, GPX/share/backup actions |
| `Models/` | Core Data and transport models | `Waypoint`, `WaypointSnapshot`, `GPXWaypoint` |
| `Services/NavigationMath.swift` | Pure geodesic helpers | `bearingDegrees`, `distanceMeters`, `formattedDistance` |
| `Services/GPXService.swift` | GPX parse/import/export | `GPXService`, private `GPXParser` |
| `Services/LocationMotionManager.swift` | Core Location/Core Motion adapter | `LocationMotionManager` |
| `Services/ICloudBackupService.swift` | KVS snapshot codec and restore | `ICloudBackupService`, `ICloudBackupError` |
| `Services/PersistenceController.swift` | Core Data stack | `PersistenceController` |
| `Views/WaypointMapView.swift` | UIKit MapKit bridge | `WaypointMapView`, `WaypointAnnotation`, coordinator |
| `Views/OfflineGridMapView.swift` | Tile-free projected grid | `Canvas`, private `Projection` |
| `Views/CompassView.swift`, `NavigationGuidanceView.swift` | Focused presentation components | Compass and target guidance |
| `Views/SettingsView.swift`, `ShareSheet.swift` | Settings and UIKit sharing bridge | `SettingsView`, `ShareSheet` |
| `OfflineNavigator.xcdatamodeld/` | Persisted waypoint schema | `Waypoint` entity |
| `PrivacyInfo.xcprivacy`, `Info.plist`, entitlements | Privacy, usage strings, capabilities | precise location and iCloud declarations |

Tests belong in `OfflineNavigatorTests/`, named after the production unit: `NavigationMathTests.swift`, `GPXServiceTests.swift`, and `ICloudBackupServiceTests.swift`.

### Placement decisions

- A new bearing formula belongs in `NavigationMath`, not in `CompassView`.
- A GPX field belongs in `GPXWaypoint`/`GPXService`; if persisted, it also requires a Core Data migration.
- A MapKit delegate behavior belongs in the `WaypointMapView` coordinator.
- A user workflow spanning location, persistence, and presentation may start in `ContentView`, but reusable logic should not be embedded in `body`.

## Mawrooth (`Riwaya/`)

| Path | Responsibility | Real types/examples |
| --- | --- | --- |
| `RiwayaApp.swift` | Entry, Core Data injection, global Arabic RTL environment | `RiwayaApp` |
| `ContentView.swift` | Root handoff | `ContentView` |
| `Models/Novel.swift` | Core Data novel plus derived presentation data | `Novel`, `orderedChapters`, `coverGradient` |
| `Models/Chapter.swift` | Core Data chapter and word-count refresh | `Chapter` |
| `Views/LibraryView.swift` | Search, list, create/edit/delete/favorite navigation | `LibraryView` |
| `Views/NovelDetailView.swift` | Metadata, chapter ordering, export entry | `NovelDetailView`, `ChapterHubView` |
| `Views/NovelEditorView.swift` | Novel create/edit form | `NovelEditorMode`, `NovelEditorView` |
| `Views/ChapterEditorView.swift` | Chapter editing and autosave | `ChapterEditorView` |
| `Views/ReaderView.swift` | Reading, chapter traversal, preferences | `ReaderView`, `ReaderSettingsView` |
| `Services/TextStats.swift` | Pure token counts and Arabic labels | `TextStats` |
| `Services/NovelExportService.swift` | Plain-text export | `NovelExportService` |
| `Services/PersistenceController.swift` | Core Data stack and demo seed | `PersistenceController` |
| `Theme/RiwayaTheme.swift` | Palette and small domain enums | `RiwayaTheme`, `NovelGenre`, `ReaderTheme` |
| `Riwaya.xcdatamodeld/` | Persisted novel/chapter schema | `Novel` ↔ `Chapter` |

Tests belong in `RiwayaTests/`. The current `TextStatsTests.swift` also contains `NovelExportServiceTests`; new substantial service suites should get their own file.

### Placement decisions

- Arabic word-token behavior belongs in `TextStats`, not a view extension.
- Export serialization belongs in `NovelExportService`; share-sheet presentation remains in the view.
- Reader preferences can remain `@AppStorage`; manuscript text must remain in Core Data.
- Palette values belong in `RiwayaTheme`; one-off layout constants should stay local unless reused.

## Rawaya platform (`rawayah/`)

```text
rawayah/
├── package.json                # npm workspaces and aggregate scripts
├── apps/
│   ├── api/
│   │   ├── prisma/             # schema + seed؛ لا توجد migrations محفوظة
│   │   ├── src/modules/        # Nest feature modules
│   │   ├── src/shared/         # Prisma, guards, media storage
│   │   └── test/               # Jest (currently contract-only)
│   ├── web/src/
│   │   ├── pages/              # public Next.js Pages Router
│   │   ├── lib/http.ts
│   │   └── styles/
│   ├── admin/src/              # admin Next.js Pages Router
│   └── mobile/
│       ├── lib/core/           # Dio client
│       ├── lib/features/       # home, auth, search, offline notebook
│       ├── lib/screens/        # PlaceholderPage
│       ├── ios/                # generated/native Flutter host and Xcode config
│       └── test/
├── packages/                   # placeholder npm packages, not active shared code
├── docs/                       # Rawaya-specific design/reference documents
└── docker-compose*.yml
```

### API module pattern

An implemented feature generally uses:

```text
modules/content/
├── content.module.ts
├── content.controller.ts       # HTTP/guards/DTO boundary
├── content.service.ts          # orchestration and Prisma queries
└── dto/content.dto.ts          # class-validator input DTOs
```

Shared infrastructure should be genuinely cross-module before entering `src/shared/`. Examples already there are `PrismaService`, `JwtAuthGuard`, `PermissionGuard`, and `StorageService`.

### Client placement

- Public browser pages go in `apps/web/src/pages`; admin-only flows go in `apps/admin/src/pages`.
- Shared HTTP behavior should be centralized in each client’s `lib/http.ts`; current admin pages sometimes bypass it with direct `fetch`.
- Flutter route screens belong under a named feature. A real implementation should replace the corresponding generated `PlaceholderPage` route in `main.dart`.
- Offline notebook persistence currently lives beside its models in `offline_models.dart`. If it grows, separate data source/repository/model files inside `features/offline/` rather than adding more to the 450+ line page file.

## Naming and identity traps

- `Riwaya/` and `rawayah/` are distinct products currently branded “موروث” in their UI; use their paths and Bundle IDs to disambiguate them. Historical documents use Riwaya/Rawaya/Mawrooth spellings.
- `OfflineNavigator` is the target/module name; the user-facing alert title is “مدّل.”
- Rawaya Flutter’s iOS bundle ID is `com.shary17454.rawaya`; the native Mawrooth bundle ID is `com.shary17454.Riwaya`.
- Do not rename targets, folders, bundle IDs, schemes, or Apple team settings as a cleanup.

## New-file checklist

- [ ] The file belongs to exactly one product and target/workspace.
- [ ] The type name matches the file name unless it is a small private helper.
- [ ] Persistence models are not reused as network DTOs by convenience.
- [ ] A new API feature has DTO validation, controller authorization, service tests, and Prisma migration if needed.
- [ ] A new Swift service with pure logic has an XCTest file in the matching test target.
- [ ] A new Flutter screen replaces a placeholder route and has at least one widget/state test.
- [ ] No generated iOS/Flutter file is manually forked without a documented need.

## Structural weaknesses to avoid extending

- Do not add more unrelated methods to Madall `ContentView`.
- Do not add another major type to `Riwaya/Views/NovelDetailView.swift`.
- Do not grow Rawaya `ContentService` into a universal service; new content domains need focused modules or explicitly shared query utilities.
- Do not add runtime imports from `packages/*` until those packages contain built source and their aggregate build/test scripts include them.
- Do not create a second HTTP client inside a page or widget.
