import Foundation

struct GPXWaypoint: Identifiable, Hashable {
    let id = UUID()
    var name: String
    var latitude: Double
    var longitude: Double
    var note: String?
}
