import SwiftUI

enum RiwayaTheme {
    static let ink = Color(red: 0.06, green: 0.10, blue: 0.12)
    static let mist = Color(red: 0.91, green: 0.93, blue: 0.94)
    static let teal = Color(red: 0.12, green: 0.44, blue: 0.42)
    static let tealDeep = Color(red: 0.08, green: 0.25, blue: 0.24)
    static let slate = Color(red: 0.35, green: 0.42, blue: 0.44)
    static let page = Color(red: 0.96, green: 0.97, blue: 0.97)
    static let nightPage = Color(red: 0.09, green: 0.12, blue: 0.14)

    static var libraryBackground: some View {
        LinearGradient(
            colors: [tealDeep, ink],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
}

enum NovelGenre: String, CaseIterable, Identifiable {
    case drama = "دراما"
    case adventure = "مغامرة"
    case romance = "رومانسية"
    case history = "تاريخية"
    case mystery = "غموض"
    case fantasy = "خيال"
    case social = "اجتماعية"
    case other = "أخرى"

    var id: String { rawValue }
}

enum ReaderTheme: String, CaseIterable, Identifiable {
    case day
    case night
    case sepia

    var id: String { rawValue }

    var title: String {
        switch self {
        case .day: return "نهاري"
        case .night: return "ليلي"
        case .sepia: return "دافئ"
        }
    }

    var background: Color {
        switch self {
        case .day: return RiwayaTheme.page
        case .night: return RiwayaTheme.nightPage
        case .sepia: return Color(red: 0.94, green: 0.90, blue: 0.82)
        }
    }

    var foreground: Color {
        switch self {
        case .day: return RiwayaTheme.ink
        case .night: return RiwayaTheme.mist
        case .sepia: return Color(red: 0.22, green: 0.16, blue: 0.10)
        }
    }
}
