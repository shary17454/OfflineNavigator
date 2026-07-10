import CoreData
import Foundation

enum GPXService {
    static func parse(data: Data) throws -> [GPXWaypoint] {
        let parser = GPXParser(data: data)
        return try parser.parse()
    }

    static func export(waypoints: [Waypoint]) throws -> URL {
        let rows = waypoints.map { waypoint in
            """
              <wpt lat="\(waypoint.latitude)" lon="\(waypoint.longitude)">
                <name>\(escape(waypoint.name))</name>
                <desc>\(escape(waypoint.note ?? ""))</desc>
              </wpt>
            """
        }.joined(separator: "\n")

        let document = """
        <?xml version="1.0" encoding="UTF-8"?>
        <gpx version="1.1" creator="OfflineNavigator" xmlns="http://www.topografix.com/GPX/1/1">
        \(rows)
        </gpx>
        """

        let url = FileManager.default.temporaryDirectory.appendingPathComponent("OfflineNavigator-\(UUID().uuidString).gpx")
        try document.data(using: .utf8)?.write(to: url, options: .atomic)
        return url
    }

    static func importWaypoints(_ waypoints: [GPXWaypoint], into context: NSManagedObjectContext) throws {
        for item in waypoints {
            let waypoint = Waypoint(context: context)
            waypoint.id = UUID()
            waypoint.name = item.name.isEmpty ? "Imported waypoint" : item.name
            waypoint.latitude = item.latitude
            waypoint.longitude = item.longitude
            waypoint.note = item.note
            waypoint.createdAt = Date()
        }
        try context.save()
    }

    private static func escape(_ value: String) -> String {
        value
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&apos;")
    }
}

private final class GPXParser: NSObject, XMLParserDelegate {
    private let parser: XMLParser
    private var waypoints: [GPXWaypoint] = []
    private var currentLatitude: Double?
    private var currentLongitude: Double?
    private var currentName = ""
    private var currentNote = ""
    private var currentElement = ""
    private var routePointIndex = 0
    private var trackPointIndex = 0

    init(data: Data) {
        parser = XMLParser(data: data)
        super.init()
        parser.delegate = self
    }

    func parse() throws -> [GPXWaypoint] {
        if parser.parse() {
            return waypoints
        }

        throw parser.parserError ?? CocoaError(.fileReadCorruptFile)
    }

    func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String: String] = [:]) {
        currentElement = elementName
        if ["wpt", "rtept", "trkpt"].contains(elementName) {
            currentLatitude = Double(attributeDict["lat"] ?? "")
            currentLongitude = Double(attributeDict["lon"] ?? "")
            currentName = ""
            currentNote = ""
        }
    }

    func parser(_ parser: XMLParser, foundCharacters string: String) {
        switch currentElement {
        case "name":
            currentName += string
        case "desc", "cmt":
            currentNote += string
        default:
            break
        }
    }

    func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
        if ["wpt", "rtept", "trkpt"].contains(elementName), let latitude = currentLatitude, let longitude = currentLongitude {
            let name = currentName.trimmingCharacters(in: .whitespacesAndNewlines)
            let note = currentNote.trimmingCharacters(in: .whitespacesAndNewlines)
            waypoints.append(
                GPXWaypoint(
                    name: name.isEmpty ? fallbackName(for: elementName) : name,
                    latitude: latitude,
                    longitude: longitude,
                    note: note.isEmpty ? nil : note
                )
            )
        }
        currentElement = ""
    }

    private func fallbackName(for elementName: String) -> String {
        switch elementName {
        case "rtept":
            routePointIndex += 1
            return "Route point \(routePointIndex)"
        case "trkpt":
            trackPointIndex += 1
            return "Track point \(trackPointIndex)"
        default:
            return "Imported waypoint"
        }
    }
}
