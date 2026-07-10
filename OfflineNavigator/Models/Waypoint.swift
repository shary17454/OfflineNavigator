import CoreData
import CoreLocation
import Foundation

@objc(Waypoint)
public final class Waypoint: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var name: String
    @NSManaged public var latitude: Double
    @NSManaged public var longitude: Double
    @NSManaged public var note: String?
    @NSManaged public var createdAt: Date
}

extension Waypoint: Identifiable {
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var appleMapsURL: URL? {
        URL(string: "https://maps.apple.com/?ll=\(latitude),\(longitude)&q=\(name.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "Waypoint")")
    }

    var googleMapsURL: URL? {
        URL(string: "https://www.google.com/maps/search/?api=1&query=\(latitude),\(longitude)")
    }
}

extension Waypoint {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Waypoint> {
        let request = NSFetchRequest<Waypoint>(entityName: "Waypoint")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Waypoint.createdAt, ascending: false)]
        return request
    }
}
