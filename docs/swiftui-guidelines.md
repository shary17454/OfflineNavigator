# SwiftUI guidelines

Applies to Madall and native Mawrooth. These guidelines preserve their current navigation and persistence models while addressing observed weaknesses. See [`swift-style.md`](swift-style.md) for language conventions and [`../AGENTS.md`](../AGENTS.md) for repository policy.

## State ownership

Use the narrowest wrapper that matches ownership:

| Wrapper/source | Use | Current example |
| --- | --- | --- |
| `@State` | View-owned transient value | `LibraryView.searchText`, sheet flags |
| `@StateObject` | View creates and owns an observable reference | Madall `LocationMotionManager`, `ICloudBackupService` |
| `@ObservedObject` | Parent/framework owns the reference | `NovelDetailView.novel`, `ReaderView.novel` |
| `@Environment` | Framework/application dependency | managed object context, dismiss |
| `@FetchRequest` | Small live Core Data query tied to a view | waypoints in `ContentView`, novels in `LibraryView` |
| `@AppStorage` | Small preference, never primary content | map mode, reader font/theme |
| Core Data | User-authored durable content | `Waypoint`, `Novel`, `Chapter` |

Do not put durable manuscripts or waypoint collections in `@State`/`@AppStorage`. Do not create an observable object in `body`.

## Product navigation

### Madall

Keep the adaptive `NavigationSplitView`: waypoint list/sidebar on one side and map/grid detail on the other. Selection is the live `Waypoint?`. New navigation actions must behave in compact and regular size classes.

### Mawrooth

Keep `NavigationStack(path: $path)` and stable `UUID` values for library-to-detail navigation. This protects navigation when a fetched object is deleted; the destination already shows “الرواية غير موجودة” if lookup fails.

Use sheets for short create/edit/settings flows already modeled as sheets. Use pushed destinations for reading and chapter hierarchy. Do not nest a second `NavigationStack` when a view is already pushed; `ChapterEditorView.embedsNavigation` exists to handle both contexts, though separate sheet/pushed wrappers would be clearer if the flow grows.

## View composition

A view’s `body` should describe layout and routing. Move calculations, parsing, I/O, and mutations into named methods or services.

Good existing boundaries:

- `NavigationGuidanceView` receives already formatted navigation values.
- `NovelCoverView` encapsulates cover presentation.
- `ShareSheet` wraps UIKit.
- `WaypointMapView` owns `MKMapView` coordination.

Extraction triggers (any one):

- the same component is used twice;
- a section has independent state/lifecycle;
- a view file exceeds roughly 300 lines and a cohesive unit can be named;
- logic needs unit testing without rendering;
- UIKit delegate/coordinator behavior is involved.

Do not split every `VStack` into a type. Madall `currentLocationSection` and `actionBar` are reasonable private computed subviews while they remain local and stateless.

## Side effects and lifecycle

- Start/stop sensor work in a lifecycle owner, as Madall currently does with `onAppear`/`onDisappear`; also account for scene phase when background behavior matters.
- Use `.task(id:)` for cancellable async loads tied to an input.
- Flush pending autosave before dismissal/backgrounding.
- Avoid duplicate work caused by repeated appearances.
- Check object existence after async suspension before mutating UI.

Current risks:

- `LocationMotionManager.start()` can be called from both `ContentView.onAppear` and authorization changes. Core Location tolerates repeated starts, but future lifecycle code should be idempotent.
- `ChapterEditorView` can have a delayed save pending when it disappears.
- Madall reads GPX `Data(contentsOf:)` from a user action on the main actor.

Measurable standard: every new async view task has a loading state, error state, cancellation path, and a test or deterministic service test.

## Persistence from views

Views may construct/edit Core Data objects for small forms, but write outcomes must be observable. Current calls to `PersistenceController.shared.save()` cannot report failure.

For new flows:

1. validate fields before mutation;
2. mutate one context;
3. call a throwing save boundary;
4. keep editor state until success;
5. present a localized error and retry option on failure.

Destructive actions need confirmation when loss is substantial. Mawrooth currently deletes a novel or chapter directly from context-menu/swipe actions with no confirmation; add confirmation before extending destructive behavior.

## RTL and localization

Mawrooth applies `.rightToLeft` and Arabic locale in `RiwayaApp`; preserve this global behavior.

- Use semantic `leading`/`trailing`, not left/right.
- Verify directional symbols. `ReaderView` deliberately uses forward/backward chevrons appropriate to its Arabic previous/next labels; test rather than swapping by intuition.
- Avoid embedding layout direction in reusable leaf views unless needed; `ReaderSettingsView` currently reapplies RTL because it is presented as a sheet.
- Keep strings in Arabic for Mawrooth. If localization catalogs are introduced, migrate a complete workflow rather than creating mixed lookup/literal behavior.
- Test Arabic, Latin, numbers, long titles, and mixed bidirectional text.

Madall is currently mostly English. Maintain language consistency within a changed flow and do not treat a partial translation as localization.

## Accessibility

Existing toolbar icon buttons generally add labels (`LibraryView` settings/new, `ReaderView` settings). Continue this for every icon-only control.

Required checks:

- [ ] Every icon-only button has an accessibility label and, when stateful, a value/hint.
- [ ] Dynamic Type does not clip primary actions or coordinates.
- [ ] Color is not the sole state indicator. The offline grid currently distinguishes points mostly by orange/blue/cyan; add shapes/labels for equivalent non-color identification when improving it.
- [ ] Canvas/MapKit content exposes meaningful waypoint/current-location information, not only one container label.
- [ ] Controls meet a 44×44-point hit target.
- [ ] VoiceOver order follows the visual/task order in RTL.
- [ ] Reduce Motion avoids nonessential animation.
- [ ] Text contrast is checked for `RiwayaTheme` opacity variants and reader themes.

Measurable standard: changed primary screens are exercised at an accessibility text size and with VoiceOver labels inspected; accessibility regressions receive a UI test where stable.

## Lists and identity

- Use stable domain IDs, as existing `ForEach(waypoints)`, `ForEach(filteredNovels)`, and chapter navigation do.
- Never use an array offset as persistent identity.
- Keep sort behavior explicit (`Waypoint.createdAt`, `Novel.updatedAt`, `Chapter.orderIndex`).
- Reindex reordered/deleted chapters transactionally.
- Avoid converting a large `FetchedResults` to `Array` repeatedly in hot update paths; both apps currently do this for map/filter/ordering convenience and should be measured before scale.

## UIKit bridges

`WaypointMapView` and both `ShareSheet` wrappers are legitimate representables.

- Keep delegate state in `Coordinator`.
- Make `updateUIView` incremental and idempotent; `WaypointMapView` compares annotation ID sets before replacement.
- Do not trigger unrelated presentation from `updateUIView`.
- Ensure UIKit object lifetimes do not retain the SwiftUI owner unexpectedly.
- Add focused wrapper tests or coordinator unit tests for nontrivial update rules.

## Previews and testability

One `#Preview` is currently checked in: `Riwaya/ContentView.swift` injects an in-memory `PersistenceController` and RTL layout. Add further previews only when they can use explicit fixtures/in-memory contexts without invoking production singletons, sensors, iCloud, or network.

Recommended seams:

- in-memory `PersistenceController(inMemory: true)` for Core Data views;
- value snapshots for map/grid and cover previews;
- injected error/success service implementations for write states;
- fixed Arabic sample strings and long Dynamic Type fixtures.

Do not let a preview seed or modify the production store.

## Performance

- `body` and computed view properties may run frequently; do not parse GPX, encode JSON, hash, fetch unbounded data, or write stores there.
- Keep `Canvas` drawing bounded to visible content.
- Debounce text-driven work and cancel stale tasks.
- Prefer fetched/paginated subsets over in-memory filtering when data becomes large.
- Measure sensor-driven redraws; Madall publishes heading/location/yaw frequently and can redraw its root composition.

## Screen change checklist

- [ ] State wrapper matches ownership and durability.
- [ ] Navigation style remains product-consistent.
- [ ] Loading, empty, error, and permission-denied states are distinct.
- [ ] Writes preserve user edits on failure.
- [ ] Async work cancels and autosave flushes.
- [ ] Arabic RTL and mixed text are checked where applicable.
- [ ] Icon controls, custom drawing, and maps are accessible.
- [ ] Dynamic Type and compact/regular layouts are checked.
- [ ] Heavy logic is outside `body`.
- [ ] Stable IDs—not indices or titles—drive lists/navigation.

## Mistakes to avoid

- Adding a view model solely to rename existing `@State`.
- Passing `NSManagedObjectContext` through many initializers when environment injection already defines the boundary.
- Calling a singleton persistence controller from previews/tests.
- Hiding errors by displaying an empty list.
- Relying on foreground color alone for selected waypoint/favorite state.
- Scheduling autosave without cancellation and final flush.
- Forcing LTR for coordinate strings by forcing the entire Arabic screen LTR.
- Replacing the native navigation style with a custom router without a concrete cross-screen requirement.
