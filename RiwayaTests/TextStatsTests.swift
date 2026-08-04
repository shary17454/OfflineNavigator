import XCTest
@testable import Riwaya

final class TextStatsTests: XCTestCase {
    func testWordCountArabic() {
        let text = "هذا نصٌ عربي يحتوي على كلمات متعددة."
        XCTAssertEqual(TextStats.wordCount(in: text), 7)
    }

    func testWordCountEmpty() {
        XCTAssertEqual(TextStats.wordCount(in: ""), 0)
        XCTAssertEqual(TextStats.wordCount(in: "   \n\t"), 0)
    }

    func testWordCountMixed() {
        let text = "Hello عالم 123"
        XCTAssertEqual(TextStats.wordCount(in: text), 3)
    }

    func testReadingMinutes() {
        XCTAssertEqual(TextStats.estimatedReadingMinutes(wordCount: 0), 1)
        XCTAssertEqual(TextStats.estimatedReadingMinutes(wordCount: 180), 1)
        XCTAssertEqual(TextStats.estimatedReadingMinutes(wordCount: 181), 2)
    }

    func testChaptersLabel() {
        XCTAssertEqual(TextStats.chaptersLabel(0), "بدون فصول")
        XCTAssertEqual(TextStats.chaptersLabel(1), "فصل واحد")
        XCTAssertEqual(TextStats.chaptersLabel(2), "فصلان")
        XCTAssertEqual(TextStats.chaptersLabel(5), "5 فصول")
        XCTAssertEqual(TextStats.chaptersLabel(15), "15 فصلًا")
    }
}

final class NovelExportServiceTests: XCTestCase {
    func testPlainTextExportContainsTitleAndChapters() throws {
        let controller = PersistenceController(inMemory: true)
        let context = controller.container.viewContext

        let novel = Novel(context: context)
        novel.id = UUID()
        novel.title = "اختبار"
        novel.authorName = "كاتب"
        novel.genre = NovelGenre.drama.rawValue
        novel.coverHue = 0.2
        novel.createdAt = Date()
        novel.updatedAt = Date()
        novel.isFavorite = false
        novel.synopsis = "نبذة"

        let chapter = Chapter(context: context)
        chapter.id = UUID()
        chapter.title = "الفصل الأول"
        chapter.body = "كان يا مكان"
        chapter.orderIndex = 0
        chapter.createdAt = Date()
        chapter.updatedAt = Date()
        chapter.refreshWordCount()
        chapter.novel = novel

        let text = NovelExportService.plainText(for: novel)
        XCTAssertTrue(text.contains("اختبار"))
        XCTAssertTrue(text.contains("بقلم: كاتب"))
        XCTAssertTrue(text.contains("الفصل الأول"))
        XCTAssertTrue(text.contains("كان يا مكان"))

        let url = try NovelExportService.makeTemporaryFile(for: novel)
        XCTAssertTrue(FileManager.default.fileExists(atPath: url.path))
    }
}
