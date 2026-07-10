import SwiftUI

struct CompassView: View {
    var headingDegrees: Double?
    var yawRadians: Double

    private var displayDegrees: Double {
        headingDegrees ?? yawRadians * 180 / .pi
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(.secondary.opacity(0.35), lineWidth: 2)
                ForEach(0..<36) { index in
                    Rectangle()
                        .fill(index % 3 == 0 ? .primary : .secondary)
                        .frame(width: 2, height: index % 3 == 0 ? 12 : 7)
                        .offset(y: -44)
                        .rotationEffect(.degrees(Double(index) * 10))
                }
                Image(systemName: "location.north.fill")
                    .font(.system(size: 34, weight: .semibold))
                    .foregroundStyle(.orange)
                    .rotationEffect(.degrees(-displayDegrees))
            }
            .frame(width: 112, height: 112)

            Text("\(Int(displayDegrees.rounded()))°")
                .font(.headline.monospacedDigit())
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Compass \(Int(displayDegrees.rounded())) degrees")
    }
}
