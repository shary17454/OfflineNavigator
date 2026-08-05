# Swift style

Applies to Madall (`OfflineNavigator/`) and native Mawrooth (`Riwaya/`). It describes conventions visible in this codebase and improvements required for new work. Repository policy is in [`../AGENTS.md`](../AGENTS.md); view-specific guidance is in [`swiftui-guidelines.md`](swiftui-guidelines.md).

## Language baseline

Both native projects target iOS 17. Use modern Swift syntax already present:

- shorthand optional binding: `if let selectedWaypoint`;
- multi-parameter `onChange` where the deployment target supports it;
- key paths such as `map(\.coordinate)`;
- structured value types and `enum` namespaces for stateless services.

Do not lower compatibility or introduce availability branches for older iOS unless the project target changes intentionally.

## Naming

| Kind | Convention | Existing example |
| --- | --- | --- |
| Types/protocols | `UpperCamelCase` | `NavigationMath`, `ICloudBackupService`, `ReaderTheme` |
| Methods/properties | `lowerCamelCase`, read as a phrase | `bearingDegrees(from:to:)`, `makeTemporaryFile(for:)` |
| Boolean | starts with `is`, `has`, `should`, `can`, or a clear state verb | `isAvailable`, `isFavorite`, `showingSettings` |
| View event method | action-oriented verb | `exportNovel()`, `restoreFromICloud()` |
| Core Data ordering | domain name, not UI index jargon | `orderedChapters`, `orderIndex` |
| Test | behavior under condition | `testNormalizedDegreesWrapsBothDirections()` |

Preserve framework-required spelling (`ICloudBackupService` is already public to the target), but prefer Apple’s conventional “iCloud” in user text and new prose.

## Type design

- Use `struct` for immutable values and SwiftUI views: `WaypointSnapshot`, `GPXWaypoint`, views.
- Use `enum` with static functions for stateless namespaces: `NavigationMath`, `TextStats`, `NovelExportService`, `GPXService`.
- Use `final class` for reference-identity/framework objects: Core Data entities, `LocationMotionManager`, map coordinator.
- Keep helpers `private` where used by one type, as with `GPXParser` and `MapDisplayMode`.
- Do not add a protocol until there is a test seam or a second implementation. A storage protocol would be justified when introducing a non-KVS backup implementation; a protocol around every static math function would not.

Avoid adding presentation-only values to persisted models. `Novel.coverGradient` and `Waypoint.appleMapsURL` currently mix some presentation/integration behavior into Core Data classes; do not expand this pattern. New formatting belongs in views/formatters, and external-link construction belongs in a focused adapter when it becomes complex.

## Functions

- Keep one primary responsibility.
- Prefer early `guard` for invalid preconditions.
- Use argument labels that communicate units and direction.
- Put units in names where the Swift type cannot express them: `proximityDistance` should become `proximityDistanceMeters` when touched consistently; `durationMs` equivalents should be explicit.
- Return a domain value instead of an unlabelled tuple when the value crosses files or gains behavior. Madall’s private `(distance: String, bearingDegrees: Double)` tuple is acceptable only while local.

Pure functions should remain deterministic. `TextStats.wordCount(in:)` and `NavigationMath.normalizedDegrees(_:)` are the model examples.

## Formatting

The current code generally uses four-space indentation, trailing commas in multiline argument/collection lists, and one declaration per line. Match that style.

- Wrap long argument lists and chained calls one semantic component per line.
- Keep multiline closures indented inside the call.
- Separate logical stages with one blank line.
- Do not align with runs of spaces that churn under renaming.
- Keep view modifier chains vertically aligned.

`ChapterHubView` in `Riwaya/Views/NovelDetailView.swift` contains a misindented `NavigationLink`; it is a current defect, not a style precedent.

Measurable standard: no changed Swift line should exceed 120 characters unless a URL or generated literal cannot reasonably wrap. Use an automated formatter/linter only after adding its checked-in configuration; do not format untouched files wholesale.

## Optionals and force operations

- Prefer `guard let`/`if let`.
- Do not add `!`, `try!`, `as!`, or `fatalError` in a user flow.
- A test fixture’s known UUID force unwrap (as in `ICloudBackupServiceTests`) is acceptable but `XCTUnwrap` gives a clearer failure.
- Core Data load failure currently calls `fatalError` in both `PersistenceController` types. Treat this as an existing startup policy; a future recovery change must be designed around data preservation, not replaced ad hoc.

Do not use default values to hide corrupt required persistence. The managed properties `Waypoint.id`, `Novel.title`, and `Chapter.body` are nonoptional; migration/validation should guarantee them.

## Errors

Use typed errors with localized descriptions at service boundaries, following `ICloudBackupError`. A throwing function should document or make obvious:

- invalid input;
- external/resource failure;
- persistence failure;
- partial side effects, if any.

Never add silent rollback behavior like the current `PersistenceController.save()`. Prefer:

```swift
func save() throws {
    let context = container.viewContext
    guard context.hasChanges else { return }
    do {
        try context.save()
    } catch {
        context.rollback()
        throw error
    }
}
```

Callers then map the error to UI state. Do not expose manuscript text, exact coordinates, or other sensitive payloads in error logs.

## Core Data

- Access a context only on its queue.
- Use `perform`/`performAndWait` for background contexts.
- Do not pass `NSManagedObject` across actors/queues; pass `NSManagedObjectID` or value snapshots.
- Use explicit sort descriptors for visible ordering.
- Set inverse relationships and deletion rules in the model.
- Batch large imports away from the view context.
- Add a model version and fixture migration test before changing stored attributes.

`ICloudBackupService` correctly converts `Waypoint` objects into `WaypointSnapshot` values before JSON encoding. Follow that boundary for exports/backups.

## Concurrency and UI isolation

`ICloudBackupService` is `@MainActor`; UI-observed service state should be main-actor isolated. For new asynchronous code:

- prefer `async/await` and cancellable `Task` over `DispatchQueue.asyncAfter`;
- perform CPU/file/database work off the main actor;
- return to `MainActor` only to publish UI state;
- capture `self` weakly only where a long-lived callback can outlive the owner;
- make cancellation behavior explicit.

`ChapterEditorView`’s token-based delayed autosave and `LocationMotionManager`’s main-queue motion callback are current implementations to improve, not templates for unrelated work.

## Imports and dependencies

- Import only modules used directly.
- Keep Apple frameworks near the boundary that uses them (`MapKit` in the map bridge, `CoreLocation` in navigation/location code).
- Do not add a package for functionality already small and correct in `NavigationMath` or `TextStats`.
- Dependency changes require a product-specific need and relevant build/test verification.

## Documentation and localization

- Use doc comments for reusable behavior whose contract is not obvious.
- Comments must state why/invariant, such as the reason a map region is changed only once.
- Madall currently mixes English UI strings with an Arabic brand alert; do not opportunistically translate only part of a workflow.
- Mawrooth is globally Arabic RTL. New user-visible strings must be Arabic and tested under right-to-left layout.
- Prefer locale-aware formatters for new user-facing dates/numbers/units; current `String(format:)` distance output is not locale-aware.

## Swift review checklist

- [ ] Names expose units and intent.
- [ ] New logic is outside `body`.
- [ ] No new force unwrap/cast/try in production code.
- [ ] Errors are propagated or visibly handled.
- [ ] Core Data objects remain on their context queue.
- [ ] Persisted-shape changes include migration tests.
- [ ] Async work is cancellable and main-actor boundaries are clear.
- [ ] Pure logic has boundary and invalid-input tests.
- [ ] Arabic/RTL behavior is preserved for Mawrooth.
- [ ] Changed code follows four-space/120-column formatting.

## Mistakes to avoid

- Creating `FooManager` as a dumping ground for unrelated methods.
- Making every helper an `ObservableObject`.
- Returning formatted strings from reusable domain math when callers also need raw values.
- Calling `PersistenceController.shared` from a reusable service when a context can be injected.
- Saving after each object in a large import.
- Adding `Equatable`/`Hashable` to live `NSManagedObject` subclasses to solve navigation identity.
- Conflating `@MainActor` with permission to do expensive work on the main thread.
