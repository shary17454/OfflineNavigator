import Foundation
import XCTest
@testable import OfflineNavigator

final class ICloudBackupServiceTests: XCTestCase {
    func testSnapshotRoundTripPreservesAllFields() throws {
        let snapshot = WaypointSnapshot(
            id: UUID(uuidString: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE")!,
            name: "Camp",
            latitude: 24.7136,
            longitude: 46.6753,
            note: "North gate",
            createdAt: Date(timeIntervalSince1970: 1_700_000_000)
        )

        let data = try ICloudBackupService.encode([snapshot])

        XCTAssertEqual(try ICloudBackupService.decode(data), [snapshot])
    }
}
