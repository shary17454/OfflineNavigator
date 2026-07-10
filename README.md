# Offline Navigator

Offline Navigator is a SwiftUI iOS app for saving, importing, exporting, sharing, and navigating to coordinates with minimal network dependence. It is designed for field use where users need a local coordinate database, a map view, a compass readout, GPX interoperability, and quick sharing through the native iOS share sheet.

## Features

- SwiftUI app structure with an adaptive `NavigationSplitView`.
- MapKit-backed map using `MKMapView` with saved coordinate annotations and user-location tracking.
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

The app stores saved coordinates locally using CoreData, so saved points remain available without a network connection. Distance and bearing calculations are performed on-device from GPS coordinates. Map tile availability still depends on MapKit caching and system map availability; the coordinate list, compass, bearing, and distance readout do not require online services.

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

iCloud/CloudKit backup is intentionally not enabled in source because it requires an Apple Developer Team, app entitlements, and a CloudKit container configured in Xcode. The app uses CoreData, so it is ready to be migrated to `NSPersistentCloudKitContainer` once signing and CloudKit capabilities are available.

## Release Notes

Current version: `1.0`

- Initial SwiftUI offline coordinate navigation app.
- Local CoreData coordinate storage.
- GPX import/export.
- ShareSheet map links and GPX sharing.
- Compass and bearing readout.
- Unit-tested GPX parser and navigation calculations.
