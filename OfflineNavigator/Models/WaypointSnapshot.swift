import Foundation

struct WaypointSnapshot: Codable, Equatable {
    let id: UUID
    let name: String
    let latitude: Double
    let longitude: Double
    let note: String?
    let createdAt: Date
}
