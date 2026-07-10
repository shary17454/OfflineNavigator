import CoreData
import CoreLocation
import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(fetchRequest: Waypoint.fetchRequest()) private var waypoints: FetchedResults<Waypoint>
    @StateObject private var locationManager = LocationMotionManager()

    @State private var selectedWaypoint: Waypoint?
    @State private var showingAddWaypoint = false
    @State private var showingImporter = false
    @State private var shareItems: [Any] = []
    @State private var alertMessage: String?

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedWaypoint) {
                currentLocationSection

                Section("Saved coordinates") {
                    ForEach(waypoints) { waypoint in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(waypoint.name)
                                .font(.headline)
                            Text("\(waypoint.latitude, specifier: "%.6f"), \(waypoint.longitude, specifier: "%.6f")")
                                .font(.footnote.monospacedDigit())
                                .foregroundStyle(.secondary)
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
            ZStack(alignment: .topTrailing) {
                WaypointMapView(
                    currentLocation: locationManager.currentLocation?.coordinate,
                    waypoints: Array(waypoints),
                    selectedWaypoint: selectedWaypoint
                )
                .ignoresSafeArea()

                CompassView(
                    headingDegrees: compassDegrees,
                    yawRadians: locationManager.deviceYaw
                )
                .padding(12)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
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
        .sheet(isPresented: $showingAddWaypoint) {
            AddWaypointView(location: locationManager.currentLocation) { name, note in
                addCurrentLocation(name: name, note: note)
            }
        }
        .sheet(isPresented: Binding(get: { !shareItems.isEmpty }, set: { if !$0 { shareItems = [] } })) {
            ShareSheet(items: shareItems)
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
            if let navigationReadout {
                HStack(spacing: 16) {
                    Label(navigationReadout.distance, systemImage: "point.topleft.down.curvedto.point.bottomright.up")
                    Label(navigationReadout.bearing, systemImage: "safari")
                }
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
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

    private var navigationReadout: (distance: String, bearing: String)? {
        guard let origin = locationManager.currentLocation?.coordinate, let destination = selectedWaypoint?.coordinate else {
            return nil
        }

        let originLocation = CLLocation(latitude: origin.latitude, longitude: origin.longitude)
        let destinationLocation = CLLocation(latitude: destination.latitude, longitude: destination.longitude)
        let meters = originLocation.distance(from: destinationLocation)
        return (
            NavigationMath.formattedDistance(meters),
            "\(Int(NavigationMath.bearingDegrees(from: origin, to: destination).rounded()))°"
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
        } catch {
            viewContext.rollback()
            alertMessage = error.localizedDescription
        }
    }

    private func delete(_ waypoint: Waypoint) {
        viewContext.delete(waypoint)
        PersistenceController.shared.save()
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
