# Testing strategy

This repository contains three products with different risk profiles:

- **OfflineNavigator** (`OfflineNavigator/`): field navigation, GPX interoperability, Core Location/Motion, Core Data, and optional iCloud key-value backup.
- **Riwaya** (`Riwaya/`): an offline SwiftUI writing/reading app backed by Core Data, with derived Arabic text statistics.
- **Rawaya** (`rawayah/`): a NestJS/Prisma/PostgreSQL platform plus a Flutter client using Dio and `SharedPreferences`.

This document defines what must be tested and which evidence is required before release. Persistence details are in [data-persistence.md](data-persistence.md), threat-oriented cases in [security.md](security.md), network failure cases in [networking.md](networking.md), and latency budgets in [performance.md](performance.md).

## Current test baseline

### OfflineNavigator

Existing XCTest coverage:

- `OfflineNavigatorTests/NavigationMathTests.swift`: east bearing, degree normalization, and meter/kilometer formatting.
- `OfflineNavigatorTests/GPXServiceTests.swift`: one mixed `wpt`/`rtept`/`trkpt` document and malformed XML.
- `OfflineNavigatorTests/ICloudBackupServiceTests.swift`: JSON snapshot encode/decode only.

This is useful deterministic unit coverage, but it does **not** currently prove Core Data import behavior, duplicate handling, coordinate validation, KVS restore behavior, permission transitions, stale/invalid GPS handling, arrival-alert hysteresis, or map/grid rendering.

### Riwaya

`RiwayaTests/TextStatsTests.swift` covers Arabic, empty and mixed word counts, reading-minute boundaries, chapter labels, and a basic plain-text export. It creates an in-memory Core Data controller for export setup.

There is no current coverage for Core Data migration, cascade deletion, autosave debounce, failed saves, chapter ordering, read progress, or a large manuscript. `TextStats.wordsLabel` is also untested.

### Rawaya

The API has Jest files under `rawayah/apps/api/test/`, but most assert hard-coded arrays or strings rather than application behavior. For example, `auth.spec.ts` does not call `AuthService`, and `roles.spec.ts` does not exercise `PermissionGuard`. `app.e2e-spec.ts` manufactures `{status: 200}` rather than making a request to the Nest app. Treat these as scaffolding, not regression protection.

The Flutter test `rawayah/apps/mobile/test/widget_test.dart` only checks that the splash text renders. There are no tests for Dio requests, URL encoding, timeout/error UI, JSON decoding, or the `SharedPreferences` offline library.

## Test layers

### Fast deterministic tests on every change

OfflineNavigator:

- Table-test `NavigationMath` at cardinal directions, across the antimeridian, near the poles, identical points, negative input, and `NaN`/infinite rejection once validation exists.
- Parse GPX namespaces, split XML character callbacks, escaped text, missing attributes, invalid ranges, empty files, route/track fallback names, and large inputs.
- Use `PersistenceController(inMemory: true)` to verify import count, field mapping, rollback, and duplicate policy.
- Inject a KVS abstraction or test store; do not require a signed-in iCloud account for unit tests.

Riwaya:

- Table-test `TextStats` with Arabic diacritics, Arabic-Indic digits, punctuation, emoji, Latin text, line breaks, empty text, and very large strings.
- Verify `estimatedReadingMinutes` for invalid `wordsPerMinute` before accepting that parameter from user/config input.
- Use in-memory Core Data to test Novel–Chapter cascade deletion, ordering, stored `wordCount`, reader progress, and export order.
- Test autosave through an injectable clock/scheduler; sleeping 1.2 seconds in every test is slow and flaky.

Rawaya API:

- Instantiate services with typed Prisma/JWT fakes for branch-level unit tests.
- Use a disposable PostgreSQL database for repository and HTTP integration tests. SQLite is not equivalent for PostgreSQL case-insensitive filtering, enums, JSON, and constraints.
- Exercise the real Nest HTTP adapter with `supertest`, applying the same global prefix and `ValidationPipe` as `src/main.ts`.
- Test authorization as a matrix: anonymous, authenticated without permission, each required permission, suspended user, expired access token, revoked refresh token.
- Test Prisma unique/FK failures and map them to stable HTTP errors.

Rawaya Flutter:

- Inject `ApiClient` rather than constructing it inside `SearchPage`.
- Use a Dio mock adapter/fake transport for success, malformed payload, 4xx, 5xx, timeout, cancellation, and no connectivity.
- Mock `SharedPreferences` for seed/load/save/corrupt JSON/schema-version cases.
- Widget-test loading, empty, result, retry, and explicit error states. A failed request must never be asserted as a successful “sample” result.

### Integration tests before merge

| Flow | Required evidence |
| --- | --- |
| GPX import → Core Data → export | Imported valid coordinates survive a relaunch; exported XML reparses with equivalent names, notes and coordinates. |
| Offline navigation | With network disabled and simulated locations, distance/bearing update and one arrival alert fires per threshold entry. |
| iCloud restore | Duplicate IDs are not added; corrupt/oversized backup data yields a recoverable error and does not partially save. |
| Riwaya editing | Autosave survives relaunch; chapter delete/reorder and Novel cascade behavior are correct. |
| Rawaya auth | Register/login/refresh/logout use real DB rows; rotation invalidates replay according to the documented policy. |
| Rawaya permissions | Every `@Permissions` endpoint returns 401/403/2xx for the correct principal. |
| Rawaya search | Arabic variants, empty query, pagination, published/deleted filters, and query logging are verified against PostgreSQL. |
| Flutter offline store | A create/edit/save/relaunch sequence preserves all fields; corrupt local data produces recovery UI without reseeding over user data. |

### Manual/device checks before release

- OfflineNavigator on a physical device: denied/restricted/approximate location, heading unavailable, poor horizontal accuracy, background/foreground, airplane mode, and north-reference behavior.
- Confirm Apple Map may lose tiles while Offline Grid, saved waypoints, bearing, distance and GPX remain usable.
- Test GPX files from at least two external producers and files supplied through Files/iCloud Drive security-scoped URLs.
- Riwaya: Arabic RTL editing, long chapter input, keyboard dismissal, force-quit during autosave, Dynamic Type, VoiceOver, export/share.
- Rawaya Flutter: Android emulator/device base URL, iOS simulator/device base URL, TLS production endpoint, slow network, offline launch, app kill during save.
- Rawaya API: migrations on a production-like PostgreSQL snapshot, media upload limits/types, and graceful behavior when PostgreSQL is unavailable.

## Test data and isolation

- Keep canonical GPX fixtures in a future test-fixture directory: minimal valid, all point types, namespaces, malformed XML, invalid coordinate ranges, entities, and a size-limit case.
- Generate unique emails/slugs per test; never depend on seed row order.
- Reset the test database between suites or run each suite in a transaction that is guaranteed to roll back.
- Never point tests at developer or production KVS containers, PostgreSQL databases, or `.rawaya-storage`.
- Freeze time for token expiry, `updatedAt`, backup dates and autosave.
- Redact passwords, JWTs, refresh tokens, precise coordinates and manuscript bodies from failure output.

## Commands

Use an installed simulator name from `xcrun simctl list devices available`; README examples may not exist on every runner.

```sh
xcodebuild test -project OfflineNavigator.xcodeproj -scheme OfflineNavigator \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=<available device>' \
  -derivedDataPath /tmp/OfflineNavigatorDerivedData

xcodebuild test -project Riwaya.xcodeproj -scheme Riwaya \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=<available device>' \
  -derivedDataPath /tmp/RiwayaDerivedData

cd rawayah
npm run test:api
npm run build:api

cd apps/mobile
flutter test
flutter analyze
flutter build ios --release --no-codesign
```

Passing the current API suite is not a release gate until placeholder assertions have been replaced by real service/HTTP tests.

## Measurable release gates

- 100% pass rate, zero skipped tests unless linked to a tracked reason.
- Every changed branch in GPX parsing, navigation math, `TextStats`, auth rotation, permissions, persistence decoding, and error mapping has a regression test.
- At least one real PostgreSQL HTTP test for every public/authenticated/admin endpoint family.
- 100% of endpoints decorated with `@Permissions` covered by 401, 403 and allowed cases.
- GPX round-trip coordinate error no greater than `1e-6` degrees for supported points.
- Navigation bearing fixtures within `0.1°`; distance fixtures within Core Location’s documented computational tolerance.
- No partial rows after an intentionally failed multi-write operation.
- Offline relaunch tests preserve 100% of created records.
- Performance suites meet [performance.md](performance.md) budgets; security cases meet [security.md](security.md) gates.

## Change checklist

- [ ] Identify which product and data boundary changed.
- [ ] Add a deterministic unit regression test.
- [ ] Add an integration test when Core Data, KVS, Prisma, filesystem, Dio, or HTTP is crossed.
- [ ] Test success, empty, malformed, denied, timeout and interrupted-save paths.
- [ ] Verify Arabic and RTL behavior where text/UI changes.
- [ ] Assert user-visible error semantics, not localized framework strings.
- [ ] Run the narrow suite, then the product’s complete suite.
- [ ] Record device-only evidence for GPS, compass, iCloud or platform sharing changes.

## Common mistakes

- Treating simulator location as proof of field navigation accuracy.
- Testing `GPXService.parse` but not the subsequent Core Data transaction.
- Assuming an encode/decode unit test validates actual `NSUbiquitousKeyValueStore` synchronization.
- Using `/dev/null` Core Data tests as migration tests; migration needs an old on-disk store.
- Asserting hard-coded Nest route names instead of making HTTP requests.
- Mocking Prisma so deeply that schema constraints and PostgreSQL behavior never run.
- Allowing Flutter’s current fake search fallback to make outage tests look successful.
- Measuring line coverage alone; critical authorization and corruption branches matter more.
