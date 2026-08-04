import Foundation

enum NovelExportService {
    static func plainText(for novel: Novel) -> String {
        var lines: [String] = []
        lines.append(novel.title)
        lines.append("بقلم: \(novel.authorName)")
        if let synopsis = novel.synopsis, !synopsis.isEmpty {
            lines.append("")
            lines.append(synopsis)
        }
        lines.append("")
        lines.append(String(repeating: "―", count: 24))

        for chapter in novel.orderedChapters {
            lines.append("")
            lines.append(chapter.title)
            lines.append("")
            lines.append(chapter.body.trimmingCharacters(in: .whitespacesAndNewlines))
            lines.append("")
            lines.append(String(repeating: "―", count: 24))
        }

        return lines.joined(separator: "\n")
    }

    static func makeTemporaryFile(for novel: Novel) throws -> URL {
        let safeTitle = novel.title
            .replacingOccurrences(of: "/", with: "-")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        let fileName = (safeTitle.isEmpty ? "رواية" : safeTitle) + ".txt"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
        let data = Data(plainText(for: novel).utf8)
        try data.write(to: url, options: .atomic)
        return url
    }
}
