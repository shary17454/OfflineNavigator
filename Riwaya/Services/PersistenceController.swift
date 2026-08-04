import CoreData

final class PersistenceController {
    static let shared = PersistenceController()

    let container: NSPersistentContainer

    init(inMemory: Bool = false) {
        container = NSPersistentContainer(name: "Riwaya")

        if inMemory {
            container.persistentStoreDescriptions.first?.url = URL(fileURLWithPath: "/dev/null")
        }

        container.loadPersistentStores { _, error in
            if let error {
                fatalError("تعذر تحميل قاعدة بيانات رواية: \(error.localizedDescription)")
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        seedIfNeeded()
    }

    func save() {
        let context = container.viewContext
        guard context.hasChanges else { return }

        do {
            try context.save()
        } catch {
            context.rollback()
        }
    }

    private func seedIfNeeded() {
        let context = container.viewContext
        let request = Novel.fetchRequest()
        request.fetchLimit = 1

        let existing = (try? context.count(for: request)) ?? 0
        guard existing == 0 else { return }

        let novel = Novel(context: context)
        novel.id = UUID()
        novel.title = "ظل على الرمال"
        novel.authorName = "مؤلف تجريبي"
        novel.synopsis = "رواية قصيرة للتجربة داخل التطبيق: رحلة باحث عن أثر قديم في نجد."
        novel.genre = NovelGenre.adventure.rawValue
        novel.coverHue = 0.48
        novel.createdAt = Date()
        novel.updatedAt = Date()
        novel.lastOpenedAt = nil
        novel.isFavorite = true

        let chapter1 = Chapter(context: context)
        chapter1.id = UUID()
        chapter1.title = "الخريطة"
        chapter1.orderIndex = 0
        chapter1.body = """
        قبل أن تشرق الشمس على الكثبان، وقف راشد يطوي خريطة بالية بين يديه. لم تكن الخريطة كاملة، لكن الخطوط القليلة التي بقيت عليها كانت كافية ليبدأ.

        قال لرفيقه بصوت خافت: «إن الأثر لا يُطلب بالعجلة، بل بالصبر.» ثم أشار نحو الأفق حيث يتمايل السراب كصفحةٍ لم تُكتب بعد.
        """
        chapter1.createdAt = Date()
        chapter1.updatedAt = Date()
        chapter1.wordCount = Int32(TextStats.wordCount(in: chapter1.body))
        chapter1.novel = novel

        let chapter2 = Chapter(context: context)
        chapter2.id = UUID()
        chapter2.title = "البئر الأولى"
        chapter2.orderIndex = 1
        chapter2.body = """
        عند البئر المهجورة وجدوا نقشًا صغيرًا على حجرٍ أسود. لم يكن الاسم واضحًا، لكن التاريخ كان أقدم مما توقعا.

        جلس راشد يقرأ النقش مرة بعد مرة، وكلما أعاد القراءة بدا له أن الرواية لم تبدأ من هنا… بل من ظلٍّ سبقهم بقرون.
        """
        chapter2.createdAt = Date()
        chapter2.updatedAt = Date()
        chapter2.wordCount = Int32(TextStats.wordCount(in: chapter2.body))
        chapter2.novel = novel

        save()
    }
}
