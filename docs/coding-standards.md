# Coding standards

These standards turn the repository policies in [`../AGENTS.md`](../AGENTS.md) into code-review checks. Language-specific Swift rules are in [`swift-style.md`](swift-style.md), SwiftUI rules in [`swiftui-guidelines.md`](swiftui-guidelines.md), and Rawaya details in [`rawayah-platform.md`](rawayah-platform.md).

## 1. Scope and ownership

Every change must name:

1. product: Madall, Mawrooth, or Rawaya;
2. authoritative state: Core Data, Prisma/PostgreSQL, `SharedPreferences`, `@AppStorage`, or iCloud KVS;
3. affected boundary: UI, service, persistence, API, or build configuration.

Do not couple products because names or sample content look similar. `Riwaya.Models.Novel` and Flutter `OfflineWork` have no synchronization contract.

## 2. Small, cohesive changes

- Keep pure calculations in focused services, following `NavigationMath` and `TextStats`.
- Keep transport parsing out of views, following `GPXService`.
- Keep HTTP validation/authorization at controllers and business/database orchestration in services.
- Avoid adding responsibilities to existing large files: Madall `ContentView.swift`, Mawrooth `NovelDetailView.swift`, Rawaya `content.service.ts`, and Flutter `offline_library_page.dart`.
- Do not perform repository-wide formatting during a feature fix.

Measurable review rule: a new file or extraction must remove a real responsibility from a large type, create a testable boundary, or be required by the framework. File count alone is not architecture.

## 3. Error handling

### Required

- Preserve the original error or map it to a typed/domain error.
- Give user-triggered failures an actionable localized state.
- Roll back partially mutated state or use a transaction.
- Distinguish “empty,” “not found,” “unauthorized,” “forbidden,” “offline,” and “server failure.”

### Existing patterns not to copy

- Both Swift `PersistenceController.save()` implementations silently roll back.
- Madall `autoBackupIfEnabled()` discards errors with `try?`.
- Rawaya web catches request failures and renders an empty list.
- Flutter `HomePage` catches every exception with `catch (_)`.
- Admin moderation actions ignore non-2xx response bodies.

No new bare `catch {}`/`catch (_)`, discarded promise, or `try?` is allowed around a write, auth operation, migration, import, export, payment, or backup.

## 4. Persistence and data safety

- Never change a Core Data or Prisma schema without a migration plan.
- Validate imported/external values before constructing persisted objects.
- Make multi-record state transitions atomic.
- Preserve backward decoding for versioned local payloads.
- Never erase a store as an error-recovery shortcut.

Examples:

- `ContentService.moderatePoem()` currently performs revision creation, poem update, and log creation separately; new equivalent flows must use `prisma.$transaction`.
- `GPXService.importWaypoints()` accepts parsed coordinates without explicit latitude/longitude range validation; import hardening should reject invalid ranges before save.
- Flutter’s `rawaya_offline_works_v1` payload has no embedded schema version; do not mutate its JSON shape without a migration decoder.

Measurable standard: a persisted-shape change includes a fixture from the immediately previous shape and an automated upgrade test.

## 5. Input, API, and security

- Validate at trust boundaries, not only in UI.
- Use DTO enums and constraints instead of `string` plus `as any`.
- Apply the same status/soft-delete policy to list and detail endpoints.
- Require explicit permission for privileged fields and transitions.
- Never commit production secrets or log credentials, tokens, precise locations, manuscript text, or personal data.
- Use bounded input sizes and pagination.

Rawaya API’s global `ValidationPipe({ whitelist: true, transform: true })` is a useful baseline, but inline body types such as the answer/report bodies are erased at runtime and receive no class-validator checks.

## 6. Types and naming

- Name by domain responsibility: `NavigationMath`, `NovelExportService`, `PermissionGuard`.
- Avoid generic names such as `Manager`, `Helper`, or `Utils` unless the type genuinely owns a lifecycle or a narrow utility domain.
- Replace `any`/dynamic-map decoding at external boundaries with checked models.
- Do not introduce abbreviations that obscure Arabic heritage concepts.
- Keep user-facing brand names separate from target/module identifiers.

TypeScript is configured with `strict: true`; do not suppress it with `any`. Dart’s `analysis_options.yaml` and `pubspec.yaml` include `flutter_lints`; every Dart change must pass `flutter analyze`.

## 7. Concurrency and performance

- Keep file I/O, large XML/JSON parsing, database batches, hashing, and network calls off the main UI thread.
- Cancel work when the owning screen/task disappears unless completion is intentionally detached.
- Debounce only when a final flush is guaranteed.
- Avoid O(all users) authentication paths and O(all content) client filtering.

Performance fixtures:

| Path | Minimum realistic fixture |
| --- | --- |
| Madall GPX import/grid | 10,000 points |
| Mawrooth editor/export | 100 chapters and a chapter of at least 100,000 Unicode scalars |
| Rawaya list/search | More records than one page; verify continuation |
| Flutter offline notebook | 1,000 works / 10,000 chapters before choosing storage |
| Auth logout/refresh | Many users and multiple active sessions per user |

Record wall time, memory, and UI responsiveness for changed hot paths; do not assert “fast” from a seed dataset.

## 8. Tests

Tests must execute behavior, not restate constants. Rawaya’s current API tests such as `expect(roles).toContain('ADMIN')` are smoke contracts only.

For changed logic:

- pure function: boundaries, invalid input, locale/Unicode cases;
- persistence: successful write, rollback/failure, migration;
- API: request validation, authn, authz, state transition, side effects;
- UI: loading, content, empty, and failure state;
- parser/importer: valid representative input, malformed input, size/range boundary.

Do not weaken an assertion to make a regression pass. Do not use “pass with no tests” as evidence of coverage.

### Relevant commands

```sh
# Madall (macOS/Xcode)
xcodebuild test -project OfflineNavigator.xcodeproj -scheme OfflineNavigator \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17 Pro'

# Mawrooth (macOS/Xcode; choose an installed simulator)
xcodebuild test -project Riwaya.xcodeproj -scheme Riwaya \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 16 Pro'

# Rawaya workspaces
cd rawayah
npm run lint
npm run build
npm run test

# Flutter
cd rawayah/apps/mobile
flutter analyze
flutter test
flutter build ios --release --no-codesign
```

Report commands not run because the environment lacks Xcode or Flutter. Do not repeat historical success as current verification.

## 9. Documentation and comments

- Comments explain intent, invariants, or framework workarounds—not syntax.
- Update docs when a route changes from placeholder to real, a source of truth changes, or a trust boundary is added.
- Keep Apple release procedures in existing release docs; do not duplicate them here.
- Link to [`../AGENTS.md`](../AGENTS.md) for operating protocol rather than copying it into each page.

## 10. Review checklist

- [ ] Product and source of truth are explicit.
- [ ] No unrelated target, bundle ID, signing, version, asset, or dependency changed.
- [ ] External input is validated and bounded.
- [ ] Write failures are observable and preserve user data.
- [ ] Privileged API behavior has authentication **and** authorization tests.
- [ ] Public content visibility is consistent.
- [ ] Heavy work is not performed in SwiftUI `body`, Flutter `build`, or the browser render path.
- [ ] Tests exercise behavior and failure paths.
- [ ] Tooling results are current and accurately reported.
- [ ] Documentation says “placeholder” or “stub” where that is the code’s actual state.

## Mistakes to avoid

- “Fixing” version/signing mismatches while implementing a feature.
- Treating a successful compile as proof that data migration is safe.
- Adding silent fallback data that hides production outages.
- Calling a payment row with `status: 'created'` and `paidAt` a completed payment.
- Using title, array order, or timestamp strings as cross-device identity.
- Caching or backing up sensitive data without defining deletion and conflict behavior.
- Moving code into a `shared` directory before two real consumers require the same contract.
