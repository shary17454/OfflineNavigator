import CoreLocation
import XCTest
@testable import OfflineNavigator

final class NavigationMathTests: XCTestCase {
    func testBearingToEastIsNinetyDegrees() {
        let origin = CLLocationCoordinate2D(latitude: 0, longitude: 0)
        let destination = CLLocationCoordinate2D(latitude: 0, longitude: 1)

        XCTAssertEqual(NavigationMath.bearingDegrees(from: origin, to: destination), 90, accuracy: 0.001)
    }

    func testFormattedDistanceUsesMetersAndKilometers() {
        XCTAssertEqual(NavigationMath.formattedDistance(250), "250 m")
        XCTAssertEqual(NavigationMath.formattedDistance(1250), "1.25 km")
    }
}
