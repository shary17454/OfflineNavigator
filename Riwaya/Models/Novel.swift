import CoreData
import Foundation
import SwiftUI

@objc(Novel)
public final class Novel: NSManagedObject {
    @NSManaged public var id: UUID
    @NSManaged public var title: String
    @NSManaged public var authorName: String
    @NSManaged public var synopsis: String?
    @NSManaged public var genre: String
    @NSManaged public var coverHue: Double
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var lastOpenedAt: Date?
    @NSManaged public var isFavorite: Bool
    @NSManaged public var lastReadChapterID: UUID?
    @NSManaged public var lastReadOffset: Int32
    @NSManaged public var chapters: Set<Chapter>?
}

extension Novel: Identifiable {}

extension Novel {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<Novel> {
        let request = NSFetchRequest<Novel>(entityName: "Novel")
        request.sortDescriptors = [
            NSSortDescriptor(keyPath: \Novel.updatedAt, ascending: false)
        ]
        return request
    }

    var orderedChapters: [Chapter] {
        (chapters ?? []).sorted { $0.orderIndex < $1.orderIndex }
    }

    var totalWordCount: Int {
        orderedChapters.reduce(0) { $0 + Int($1.wordCount) }
    }

    var coverGradient: LinearGradient {
        let base = Color(hue: coverHue, saturation: 0.45, brightness: 0.42)
        let deep = Color(hue: coverHue, saturation: 0.55, brightness: 0.22)
        return LinearGradient(colors: [base, deep], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}
