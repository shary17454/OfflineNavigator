import SwiftUI

struct NovelCoverView: View {
    let novel: Novel
    var compact: Bool = false

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            novel.coverGradient

            GeometryReader { proxy in
                Path { path in
                    let w = proxy.size.width
                    let h = proxy.size.height
                    path.move(to: CGPoint(x: 0, y: h * 0.72))
                    path.addCurve(
                        to: CGPoint(x: w, y: h * 0.55),
                        control1: CGPoint(x: w * 0.35, y: h * 0.95),
                        control2: CGPoint(x: w * 0.7, y: h * 0.4)
                    )
                    path.addLine(to: CGPoint(x: w, y: h))
                    path.addLine(to: CGPoint(x: 0, y: h))
                    path.closeSubpath()
                }
                .fill(Color.white.opacity(0.08))
            }

            VStack(alignment: .leading, spacing: compact ? 6 : 10) {
                Text(novel.genre)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.85))

                Text(novel.title)
                    .font(compact ? .title3.weight(.bold) : .title.weight(.bold))
                    .foregroundStyle(.white)
                    .lineLimit(compact ? 2 : 3)

                Text(novel.authorName)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(compact ? 14 : 18)
        }
        .clipShape(RoundedRectangle(cornerRadius: compact ? 16 : 22, style: .continuous))
        .shadow(color: .black.opacity(0.25), radius: 12, y: 8)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(novel.title)، بقلم \(novel.authorName)")
    }
}
