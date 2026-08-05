# Apps in this repository

> Engineering agents and contributors must start with [`AGENTS.md`](AGENTS.md), then use the indexed project documentation in [`docs/README.md`](docs/README.md).

| App | Path / Project | Notes |
| --- | --- | --- |
| **مدّل** | `OfflineNavigator.xcodeproj` | Offline coordinate navigator |
| **موروث (Codex platform)** | `rawayah/` | Rawaya heritage platform from `my-codex` — ASC app موروث / `com.shary17454.rawaya` |
| **رواية (SwiftUI offline companion)** | `Riwaya.xcodeproj` | Native iOS offline companion |

See [`docs/RAWAYA_MERGE.md`](docs/RAWAYA_MERGE.md), [`docs/RAWAYA_XCODE_CLOUD.md`](docs/RAWAYA_XCODE_CLOUD.md), and [`rawayah/README.md`](rawayah/README.md).

---

# Offline Navigator (مدّل)

Offline Navigator is a SwiftUI iOS app for saving, importing, exporting, sharing, and navigating to coordinates with minimal network dependence. It is designed for field use where users need a local coordinate database, a map view, a compass readout, GPX interoperability, and quick sharing through the native iOS share sheet.

## Features

- SwiftUI app structure with an adaptive `NavigationSplitView`.
- MapKit-backed Apple map plus a coordinate grid that remains available without downloaded map tiles.
- Large target guidance arrow and configurable proximity arrival alert.
- Optional iCloud key-value backup and restore for saved coordinates.
- CoreLocation integration for GPS position, location accuracy, and compass heading.
- CoreMotion integration for device motion fallback/orientation support.
- CoreData local persistence for saved coordinates.
- GPX import for:
  - `wpt` waypoint entries.
  - `rtept` route points.
  - `trkpt` track points.
- GPX export for saved coordinates.
- ShareSheet support for exporting GPX files and sharing map links through WhatsApp, AirDrop, Messages, Mail, and any installed share extension.
- Offline navigation readout showing distance and bearing from current GPS location to the selected saved coordinate.
- Privacy manifest declaring precise location use for app functionality.
- Unit tests for GPX parsing and navigation math.

## App Flow

1. The app requests location access.
2. The current GPS coordinate and horizontal accuracy appear in the sidebar.
3. The user can save the current coordinate with a name and optional note.
4. Saved coordinates appear in a local CoreData-backed list.
5. Selecting a coordinate focuses it on the map and shows distance plus bearing.
6. The user can share a Google Maps link, open Apple Maps navigation, import GPX, or export all saved points as GPX.

## Offline Behavior

The app stores saved coordinates locally using CoreData, so saved points remain available without a network connection. Distance and bearing calculations are performed on-device from GPS coordinates. Apple map tiles depend on system availability, but Offline Grid mode, the coordinate list, compass, bearing, distance, and arrival alert do not require online services.

## Project Structure

- `OfflineNavigator/ContentView.swift`: Main UI, import/export actions, coordinate saving, sharing, and offline navigation readout.
- `OfflineNavigator/Services/LocationMotionManager.swift`: CoreLocation and CoreMotion updates.
- `OfflineNavigator/Services/PersistenceController.swift`: CoreData stack.
- `OfflineNavigator/Services/GPXService.swift`: GPX import/export.
- `OfflineNavigator/Services/NavigationMath.swift`: Distance, bearing, and formatting helpers.
- `OfflineNavigator/Views/WaypointMapView.swift`: MapKit bridge for SwiftUI.
- `OfflineNavigator/Views/CompassView.swift`: Compass UI.
- `OfflineNavigatorTests/`: Unit tests.

## Build And Test

```sh
xcodebuild test \
  -project OfflineNavigator.xcodeproj \
  -scheme OfflineNavigator \
  -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath /tmp/OfflineNavigatorDerivedData
```

The latest local verification passed with all unit tests succeeding.

## iCloud Backup

iCloud backup is implemented with `NSUbiquitousKeyValueStore` and is optional in Settings. A paid Apple Developer Team must provision the included key-value-store entitlement before App Store distribution. CoreData remains the primary local store, so navigation does not depend on iCloud availability.

## Release Notes

Current version: `1.1`

- Added a full offline coordinate grid independent of map tiles.
- Added a large live guidance arrow and proximity arrival alert.
- Added optional iCloud backup and restore.
- Local CoreData coordinate storage.
- GPX import/export.
- ShareSheet map links and GPX sharing.
- Compass and bearing readout.
- Unit-tested GPX parser and navigation calculations.
