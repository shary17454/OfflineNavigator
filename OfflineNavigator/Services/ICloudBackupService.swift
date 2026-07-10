import CoreData
import Foundation

enum ICloudBackupError: LocalizedError {
    case unavailable
    case noBackup

    var errorDescription: String? {
        switch self {
        case .unavailable:
            return "iCloud is not available on this device. Sign in to iCloud and enable the app in iCloud settings."
        case .noBackup:
            return "No iCloud backup was found."
        }
    }
}

@MainActor
final class ICloudBackupService: ObservableObject {
    static let backupKey = "OfflineNavigator.Waypoints.v1"

    @Published private(set) var lastBackupDate: Date?

    private let store: NSUbiquitousKeyValueStore

    init(store: NSUbiquitousKeyValueStore = .default) {
        self.store = store
        lastBackupDate = store.object(forKey: Self.backupKey) == nil
            ? nil
            : store.object(forKey: "OfflineNavigator.LastBackupDate") as? Date
    }

    var isAvailable: Bool {
        FileManager.default.ubiquityIdentityToken != nil
    }

    func backup(_ waypoints: [Waypoint]) throws {
        guard isAvailable else { throw ICloudBackupError.unavailable }
        let snapshots = waypoints.map {
            WaypointSnapshot(
                id: $0.id,
                name: $0.name,
                latitude: $0.latitude,
                longitude: $0.longitude,
                note: $0.note,
                createdAt: $0.createdAt
            )
        }
        let data = try Self.encode(snapshots)
        let date = Date()
        store.set(data, forKey: Self.backupKey)
        store.set(date, forKey: "OfflineNavigator.LastBackupDate")
        store.synchronize()
        lastBackupDate = date
    }

    @discardableResult
    func restore(into context: NSManagedObjectContext) throws -> Int {
        guard isAvailable else { throw ICloudBackupError.unavailable }
        store.synchronize()
        guard let data = store.data(forKey: Self.backupKey) else { throw ICloudBackupError.noBackup }

        let snapshots = try Self.decode(data)
        let request = Waypoint.fetchRequest()
        let existing = try context.fetch(request)
        let existingIDs = Set(existing.map(\.id))
        var restoredCount = 0

        for snapshot in snapshots where !existingIDs.contains(snapshot.id) {
            let waypoint = Waypoint(context: context)
            waypoint.id = snapshot.id
            waypoint.name = snapshot.name
            waypoint.latitude = snapshot.latitude
            waypoint.longitude = snapshot.longitude
            waypoint.note = snapshot.note
            waypoint.createdAt = snapshot.createdAt
            restoredCount += 1
        }

        if context.hasChanges {
            try context.save()
        }
        return restoredCount
    }

    nonisolated static func encode(_ snapshots: [WaypointSnapshot]) throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(snapshots)
    }

    nonisolated static func decode(_ data: Data) throws -> [WaypointSnapshot] {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode([WaypointSnapshot].self, from: data)
    }
}
