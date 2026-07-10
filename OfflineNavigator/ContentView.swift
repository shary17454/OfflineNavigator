import CoreData
import CoreLocation
import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(fetchRequest: Waypoint.fetchRequest()) private var waypoints: FetchedResults<Waypoint>
    @StateObject private var locationManager = LocationMotionManager()
    @StateObject private var iCloudBackup = ICloudBackupService()

    @AppStorage("mapDisplayMode") private var mapDisplayMode = MapDisplayMode.apple.rawValue
    @AppStorage("proximityDistance") private var proximityDistance = 50.0
    @AppStorage("iCloudBackupEnabled") private var iCloudBackupEnabled = false

    @State private var selectedWaypoint: Waypoint?
    @State private var showingAddWaypoint = false
    @State private var showingImporter = false
    @State private var showingSettings = false
    @State private var shareItems: [Any] = []
    @State private var alertMessage: String?
    @State private var alertedWaypointID: UUID?

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedWaypoint) {
                currentLocationSection

                Section("Saved coordinates") {
                    ForEach(waypoints) { waypoint in
                        NavigationLink(value: waypoint) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(waypoint.name)
                                    .font(.headline)
                                Text("\(waypoint.latitude, specifier: "%.6f"), \(waypoint.longitude, specifier: "%.6f")")
                                    .font(.footnote.monospacedDigit())
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .tag(waypoint)
                        .swipeActions {
                            Button(role: .destructive) {
                                delete(waypoint)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
            .navigationTitle("Offline Nav")
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        showingSettings = true
                    } label: {
                        Label("Settings", systemImage: "gearshape")
                    }

                    Button {
                        showingImporter = true
                    } label: {
                        Label("Import GPX", systemImage: "square.and.arrow.down")
                    }

                    Button {
                        exportGPX()
                    } label: {
                        Label("Export GPX", systemImage: "square.and.arrow.up")
                    }
                    .disabled(waypoints.isEmpty)
                }
            }
        } detail: {
            ZStack(alignment: .top) {
                mapContent
                .ignoresSafeArea()

                HStack(alignment: .top) {
                    Picker("Map type", selection: $mapDisplayMode) {
                        Image(systemName: "map").accessibilityLabel("Apple Map").tag(MapDisplayMode.apple.rawValue)
                        Image(systemName: "square.grid.3x3").accessibilityLabel("Offline Grid").tag(MapDisplayMode.offline.rawValue)
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 112)

                    Spacer(minLength: 12)

                    CompassView(
                        headingDegrees: compassDegrees,
                        yawRadians: locationManager.deviceYaw
                    )
                    .padding(10)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
                }
                .padding()
            }
            .safeAreaInset(edge: .bottom) {
                actionBar
            }
        }
        .onAppear {
            locationManager.start()
        }
        .onDisappear {
            locationManager.stop()
        }
        .onChange(of: selectedWaypoint?.id) {
            alertedWaypointID = nil
        }
        .onChange(of: iCloudBackupEnabled) {
            autoBackupIfEnabled()
        }
        .onReceive(locationManager.$currentLocation.compactMap { $0 }) { location in
            checkProximity(from: location)
        }
        .sheet(isPresented: $showingAddWaypoint) {
            AddWaypointView(location: locationManager.currentLocation) { name, note in
                addCurrentLocation(name: name, note: note)
            }
        }
        .sheet(isPresented: Binding(get: { !shareItems.isEmpty }, set: { if !$0 { shareItems = [] } })) {
            ShareSheet(items: shareItems)
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView(
                proximityDistance: $proximityDistance,
                iCloudBackupEnabled: $iCloudBackupEnabled,
                iCloudAvailable: iCloudBackup.isAvailable,
                lastBackupDate: iCloudBackup.lastBackupDate,
                onBackup: backupToICloud,
                onRestore: restoreFromICloud
            )
        }
        .fileImporter(isPresented: $showingImporter, allowedContentTypes: [.gpx, .xml, .data], allowsMultipleSelection: false) { result in
            importGPX(result)
        }
        .alert("Offline Navigator", isPresented: Binding(get: { alertMessage != nil }, set: { if !$0 { alertMessage = nil } })) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "")
        }
    }

    @ViewBuilder
    private var mapContent: some View {
        if mapDisplayMode == MapDisplayMode.offline.rawValue {
            OfflineGridMapView(
                currentLocation: locationManager.currentLocation?.coordinate,
                waypoints: Array(waypoints),
                selectedWaypoint: selectedWaypoint
            )
        } else {
            WaypointMapView(
                currentLocation: locationManager.currentLocation?.coordinate,
                waypoints: Array(waypoints),
                selectedWaypoint: selectedWaypoint
            )
        }
    }

    private var currentLocationSection: some View {
        Section("Current position") {
            if let location = locationManager.currentLocation {
                Text("\(location.coordinate.latitude, specifier: "%.6f"), \(location.coordinate.longitude, specifier: "%.6f")")
                    .font(.body.monospacedDigit())
                Text("Accuracy \(location.horizontalAccuracy, specifier: "%.0f") m")
                    .foregroundStyle(.secondary)
            } else {
                Text(locationManager.authorizationStatus == .denied ? "Location permission denied" : "Waiting for GPS")
                    .foregroundStyle(.secondary)
            }

            Button {
                showingAddWaypoint = true
            } label: {
                Label("Save Current", systemImage: "plus.circle.fill")
            }
            .disabled(locationManager.currentLocation == nil)

            Button {
                locationManager.requestAccess()
            } label: {
                Label("Enable Location", systemImage: "location")
            }
        }
    }

    private var compassDegrees: Double? {
        guard let heading = locationManager.heading else { return nil }
        return heading.trueHeading >= 0 ? heading.trueHeading : heading.magneticHeading
    }

    private var actionBar: some View {
        VStack(spacing: 10) {
            if let navigationReadout, let selectedWaypoint {
                NavigationGuidanceView(
                    waypointName: selectedWaypoint.name,
                    distance: navigationReadout.distance,
                    bearingDegrees: navigationReadout.bearingDegrees,
                    headingDegrees: compassDegrees ?? 0
                )
            }

            HStack(spacing: 12) {
                Button {
                    showingAddWaypoint = true
                } label: {
                    Label("Save Current", systemImage: "plus.circle.fill")
                }
                .buttonStyle(.borderedProminent)
                .disabled(locationManager.currentLocation == nil)

                Button {
                    shareSelectedMapsLink()
                } label: {
                    Label("Share Link", systemImage: "square.and.arrow.up")
                }
                .buttonStyle(.bordered)
                .disabled(selectedWaypoint == nil)

                Button {
                    openSelectedInMaps()
                } label: {
                    Label("Navigate", systemImage: "arrow.triangle.turn.up.right.circle")
                }
                .buttonStyle(.bordered)
                .disabled(selectedWaypoint == nil)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(.regularMaterial)
    }

    private var navigationReadout: (distance: String, bearingDegrees: Double)? {
        guard let origin = locationManager.currentLocation?.coordinate, let destination = selectedWaypoint?.coordinate else {
            return nil
        }

        let originLocation = CLLocation(latitude: origin.latitude, longitude: origin.longitude)
        let destinationLocation = CLLocation(latitude: destination.latitude, longitude: destination.longitude)
        let meters = originLocation.distance(from: destinationLocation)
        return (
            NavigationMath.formattedDistance(meters),
            NavigationMath.bearingDegrees(from: origin, to: destination)
        )
    }

    private func addCurrentLocation(name: String, note: String?) {
        guard let coordinate = locationManager.currentLocation?.coordinate else { return }
        let waypoint = Waypoint(context: viewContext)
        waypoint.id = UUID()
        waypoint.name = name.isEmpty ? "Dropped pin" : name
        waypoint.latitude = coordinate.latitude
        waypoint.longitude = coordinate.longitude
        waypoint.note = note
        waypoint.createdAt = Date()

        do {
            try viewContext.save()
            selectedWaypoint = waypoint
            autoBackupIfEnabled()
        } catch {
            viewContext.rollback()
            alertMessage = error.localizedDescription
        }
    }

    private func delete(_ waypoint: Waypoint) {
        viewContext.delete(waypoint)
        PersistenceController.shared.save()
        autoBackupIfEnabled()
    }

    private func importGPX(_ result: Result<[URL], Error>) {
        do {
            guard let url = try result.get().first else { return }
            guard url.startAccessingSecurityScopedResource() else {
                alertMessage = "Could not access GPX file."
                return
            }
            defer { url.stopAccessingSecurityScopedResource() }

            let data = try Data(contentsOf: url)
            let imported = try GPXService.parse(data: data)
            try GPXService.importWaypoints(imported, into: viewContext)
            autoBackupIfEnabled()
            alertMessage = "Imported \(imported.count) waypoint(s)."
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func exportGPX() {
        do {
            shareItems = [try GPXService.export(waypoints: Array(waypoints))]
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func shareSelectedMapsLink() {
        guard let waypoint = selectedWaypoint, let url = waypoint.googleMapsURL else { return }
        shareItems = [url]
    }

    private func openSelectedInMaps() {
        guard let url = selectedWaypoint?.appleMapsURL else { return }
        UIApplication.shared.open(url)
    }

    private func checkProximity(from location: CLLocation) {
        guard let waypoint = selectedWaypoint else { return }
        let distance = location.distance(from: CLLocation(latitude: waypoint.latitude, longitude: waypoint.longitude))

        if distance > proximityDistance * 1.5, alertedWaypointID == waypoint.id {
            alertedWaypointID = nil
        }

        guard distance <= proximityDistance, alertedWaypointID != waypoint.id else { return }
        alertedWaypointID = waypoint.id
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        alertMessage = "You are within \(Int(proximityDistance)) meters of \(waypoint.name)."
    }

    private func autoBackupIfEnabled() {
        guard iCloudBackupEnabled, iCloudBackup.isAvailable else { return }
        try? iCloudBackup.backup(currentWaypoints())
    }

    private func backupToICloud() {
        do {
            try iCloudBackup.backup(currentWaypoints())
            alertMessage = "iCloud backup completed."
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func restoreFromICloud() {
        do {
            let count = try iCloudBackup.restore(into: viewContext)
            alertMessage = count == 0 ? "All backed-up points are already on this device." : "Restored \(count) point(s) from iCloud."
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private func currentWaypoints() -> [Waypoint] {
        (try? viewContext.fetch(Waypoint.fetchRequest())) ?? []
    }
}

private enum MapDisplayMode: String {
    case apple
    case offline
}

extension UTType {
    static var gpx: UTType {
        UTType(filenameExtension: "gpx") ?? .xml
    }
}

struct AddWaypointView: View {
    let location: CLLocation?
    let onSave: (String, String?) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var note = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Coordinate") {
                    if let coordinate = location?.coordinate {
                        Text("\(coordinate.latitude, specifier: "%.6f"), \(coordinate.longitude, specifier: "%.6f")")
                            .font(.body.monospacedDigit())
                    }
                }

                Section("Details") {
                    TextField("Name", text: $name)
                    TextField("Note", text: $note, axis: .vertical)
                }
            }
            .navigationTitle("Save Coordinate")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(name, note.isEmpty ? nil : note)
                        dismiss()
                    }
                }
            }
        }
    }
}
