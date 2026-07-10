import XCTest
@testable import OfflineNavigator

final class GPXServiceTests: XCTestCase {
    func testParseWaypointsRoutesAndTracks() throws {
        let xml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1" creator="Tests">
          <wpt lat="24.7136" lon="46.6753">
            <name>Riyadh</name>
            <desc>Center</desc>
          </wpt>
          <rte>
            <rtept lat="21.4858" lon="39.1925" />
          </rte>
          <trk>
            <trkseg>
              <trkpt lat="26.4207" lon="50.0888" />
            </trkseg>
          </trk>
        </gpx>
        """

        let waypoints = try GPXService.parse(data: Data(xml.utf8))

        XCTAssertEqual(waypoints.count, 3)
        XCTAssertEqual(waypoints[0].name, "Riyadh")
        XCTAssertEqual(waypoints[0].note, "Center")
        XCTAssertEqual(waypoints[1].name, "Route point 1")
        XCTAssertEqual(waypoints[2].name, "Track point 1")
        XCTAssertEqual(waypoints[0].latitude, 24.7136, accuracy: 0.0001)
        XCTAssertEqual(waypoints[2].longitude, 50.0888, accuracy: 0.0001)
    }

    func testMalformedGPXThrows() {
        XCTAssertThrowsError(try GPXService.parse(data: Data("<gpx><wpt></gpx>".utf8)))
    }
}
