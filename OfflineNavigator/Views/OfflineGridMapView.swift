import CoreLocation
import SwiftUI

struct OfflineGridMapView: View {
    let currentLocation: CLLocationCoordinate2D?
    let waypoints: [Waypoint]
    let selectedWaypoint: Waypoint?

    private var center: CLLocationCoordinate2D {
        selectedWaypoint?.coordinate ?? currentLocation ?? waypoints.first?.coordinate
            ?? CLLocationCoordinate2D(latitude: 0, longitude: 0)
    }

    var body: some View {
        GeometryReader { geometry in
            let points = projectedPoints(in: geometry.size)
            Canvas { context, size in
                drawGrid(context: &context, size: size, spacing: points.gridSpacing)
                drawCrosshair(context: &context, size: size)

                for point in points.waypoints {
                    let color: Color = point.isSelected ? .orange : .blue
                    context.fill(Path(ellipseIn: CGRect(x: point.position.x - 7, y: point.position.y - 7, width: 14, height: 14)), with: .color(color))
                    context.stroke(Path(ellipseIn: CGRect(x: point.position.x - 10, y: point.position.y - 10, width: 20, height: 20)), with: .color(color.opacity(0.35)), lineWidth: 2)
                }

                if let user = points.user {
                    context.fill(Path(ellipseIn: CGRect(x: user.x - 8, y: user.y - 8, width: 16, height: 16)), with: .color(.cyan))
                    context.stroke(Path(ellipseIn: CGRect(x: user.x - 12, y: user.y - 12, width: 24, height: 24)), with: .color(.white), lineWidth: 3)
                }
            }
            .background(Color(uiColor: .systemBackground))
            .overlay(alignment: .bottomLeading) {
                Label("\(Int(points.metersPerGrid.rounded())) m grid", systemImage: "square.grid.3x3")
                    .font(.caption.monospacedDigit())
                    .padding(8)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 6))
                    .padding(12)
            }
        }
        .accessibilityLabel("Offline coordinate grid")
    }

    private func projectedPoints(in size: CGSize) -> Projection {
        let coordinates = waypoints.map(\.coordinate) + (currentLocation.map { [$0] } ?? [])
        let maxDistance = coordinates.map { NavigationMath.distanceMeters(from: center, to: $0) }.max() ?? 0
        let visibleRadius = max(200, maxDistance * 1.25)
        let pixelsPerMeter = min(size.width, size.height) * 0.42 / visibleRadius
        let metersPerGrid = niceGridDistance(for: visibleRadius / 4)
        let gridSpacing = metersPerGrid * pixelsPerMeter

        func project(_ coordinate: CLLocationCoordinate2D) -> CGPoint {
            let latitudeMeters = (coordinate.latitude - center.latitude) * 110_540
            let longitudeMeters = (coordinate.longitude - center.longitude) * 111_320 * cos(center.latitude * .pi / 180)
            return CGPoint(
                x: size.width / 2 + longitudeMeters * pixelsPerMeter,
                y: size.height / 2 - latitudeMeters * pixelsPerMeter
            )
        }

        return Projection(
            user: currentLocation.map(project),
            waypoints: waypoints.map { ($0.id, project($0.coordinate), $0.id == selectedWaypoint?.id) },
            gridSpacing: gridSpacing,
            metersPerGrid: metersPerGrid
        )
    }

    private func niceGridDistance(for value: Double) -> Double {
        let candidates: [Double] = [10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000]
        return candidates.first(where: { $0 >= value }) ?? 100_000
    }

    private func drawGrid(context: inout GraphicsContext, size: CGSize, spacing: Double) {
        guard spacing > 8 else { return }
        var path = Path()
        var x = (size.width / 2).truncatingRemainder(dividingBy: spacing)
        while x < size.width {
            path.move(to: CGPoint(x: x, y: 0))
            path.addLine(to: CGPoint(x: x, y: size.height))
            x += spacing
        }
        var y = (size.height / 2).truncatingRemainder(dividingBy: spacing)
        while y < size.height {
            path.move(to: CGPoint(x: 0, y: y))
            path.addLine(to: CGPoint(x: size.width, y: y))
            y += spacing
        }
        context.stroke(path, with: .color(.secondary.opacity(0.18)), lineWidth: 1)
    }

    private func drawCrosshair(context: inout GraphicsContext, size: CGSize) {
        var path = Path()
        path.move(to: CGPoint(x: size.width / 2 - 12, y: size.height / 2))
        path.addLine(to: CGPoint(x: size.width / 2 + 12, y: size.height / 2))
        path.move(to: CGPoint(x: size.width / 2, y: size.height / 2 - 12))
        path.addLine(to: CGPoint(x: size.width / 2, y: size.height / 2 + 12))
        context.stroke(path, with: .color(.secondary), lineWidth: 1)
    }

    private struct Projection {
        let user: CGPoint?
        let waypoints: [(id: UUID, position: CGPoint, isSelected: Bool)]
        let gridSpacing: Double
        let metersPerGrid: Double
    }
}
