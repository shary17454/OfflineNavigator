import SwiftUI

struct NavigationGuidanceView: View {
    let waypointName: String
    let distance: String
    let bearingDegrees: Double
    let headingDegrees: Double

    private var relativeBearing: Double {
        NavigationMath.normalizedDegrees(bearingDegrees - headingDegrees)
    }

    var body: some View {
        HStack(spacing: 18) {
            ZStack {
                Circle()
                    .fill(.orange.opacity(0.16))
                Circle()
                    .stroke(.orange.opacity(0.45), lineWidth: 2)
                Image(systemName: "location.north.fill")
                    .font(.system(size: 52, weight: .bold))
                    .foregroundStyle(.orange)
                    .rotationEffect(.degrees(relativeBearing))
                    .animation(.smooth(duration: 0.2), value: relativeBearing)
            }
            .frame(width: 92, height: 92)

            VStack(alignment: .leading, spacing: 4) {
                Text(waypointName)
                    .font(.headline)
                    .lineLimit(1)
                Text(distance)
                    .font(.system(.title, design: .rounded, weight: .bold).monospacedDigit())
                Text("Bearing \(Int(bearingDegrees.rounded()))°")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(.regularMaterial)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(waypointName), \(distance), bearing \(Int(bearingDegrees.rounded())) degrees")
    }
}
