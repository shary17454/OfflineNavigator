import CoreData
import Foundation

@objc(Chapter)
public final class Chapter: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var title: String
    @NSManaged public var body: String
    @NSManaged public var orderIndex: Int32
    @NSManaged public var wordCount: Int32
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var novel: Novel?
}

extension Chapter: Identifiable {}

extension Chapter {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Chapter> {
        let request = NSFetchRequest<Chapter>(entityName: "Chapter")
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Chapter.orderIndex, ascending: true)]
        return request
    }

    func refreshWordCount() {
        wordCount = Int32(TextStats.wordCount(in: body))
    }
}
