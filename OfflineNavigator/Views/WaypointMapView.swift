import MapKit
import SwiftUI

struct WaypointMapView: UIViewRepresentable {
    var currentLocation: CLLocationCoordinate2D?
    var waypoints: [Waypoint]
    var selectedWaypoint: Waypoint?

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.showsUserLocation = true
        mapView.userTrackingMode = .followWithHeading
        mapView.delegate = context.coordinator
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        let existing = mapView.annotations.compactMap { $0 as? WaypointAnnotation }
        mapView.removeAnnotations(existing)
        mapView.addAnnotations(waypoints.map(WaypointAnnotation.init))

        if let selectedWaypoint {
            mapView.setRegion(
                MKCoordinateRegion(
                    center: selectedWaypoint.coordinate,
                    latitudinalMeters: 800,
                    longitudinalMeters: 800
                ),
                animated: true
            )
        } else if let currentLocation, mapView.region.span.latitudeDelta > 40 {
            mapView.setRegion(
                MKCoordinateRegion(
                    center: currentLocation,
                    latitudinalMeters: 1200,
                    longitudinalMeters: 1200
                ),
                animated: true
            )
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    final class Coordinator: NSObject, MKMapViewDelegate {
        func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
            guard annotation is WaypointAnnotation else { return nil }

            let identifier = "WaypointAnnotation"
            let view = mapView.dequeueReusableAnnotationView(withIdentifier: identifier) as? MKMarkerAnnotationView
                ?? MKMarkerAnnotationView(annotation: annotation, reuseIdentifier: identifier)
            view.canShowCallout = true
            view.markerTintColor = .systemOrange
            view.glyphImage = UIImage(systemName: "mappin")
            return view
        }
    }
}

final class WaypointAnnotation: NSObject, MKAnnotation {
    let coordinate: CLLocationCoordinate2D
    let title: String?
    let subtitle: String?

    init(waypoint: Waypoint) {
        coordinate = waypoint.coordinate
        title = waypoint.name
        subtitle = "\(waypoint.latitude), \(waypoint.longitude)"
    }
}
