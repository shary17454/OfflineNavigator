import SwiftUI

struct ChapterEditorView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss

    @ObservedObject var novel: Novel
    var chapter: Chapter?
    var embedsNavigation: Bool = true

    @State private var title = ""
    @State private var bodyText = ""
    @State private var autosaveToken = UUID()
    @State private var draftChapterID: UUID?

    private let autosaveInterval: TimeInterval = 1.2

    var body: some View {
        Group {
            if embedsNavigation {
                NavigationStack {
                    editorBody
                        .navigationTitle(chapter == nil ? "فصل جديد" : "تحرير الفصل")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            if embedsNavigation {
                                ToolbarItem(placement: .cancellationAction) {
                                    Button("إغلاق") { save(close: true) }
                                }
                            }
                            ToolbarItem(placement: .confirmationAction) {
                                Button("حفظ") { save(close: embedsNavigation) }
                                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                            }
                        }
                }
            } else {
                editorBody
                    .navigationTitle(chapter == nil ? "فصل جديد" : "تحرير الفصل")
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .confirmationAction) {
                            Button("حفظ") { save(close: false) }
                                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                        }
                    }
            }
        }
        .onAppear(perform: load)
        .onChange(of: bodyText) { _, _ in scheduleAutosave() }
        .onChange(of: title) { _, _ in scheduleAutosave() }
    }

    private var editorBody: some View {
        VStack(spacing: 0) {
            TextField("عنوان الفصل", text: $title)
                .font(.title3.weight(.semibold))
                .padding(.horizontal, 16)
                .padding(.vertical, 12)

            Divider()

            TextEditor(text: $bodyText)
                .font(.body)
                .padding(.horizontal, 12)
                .scrollContentBackground(.hidden)
                .background(RiwayaTheme.page)

            HStack {
                Text(TextStats.wordsLabel(TextStats.wordCount(in: bodyText)))
                Spacer()
                Text("حفظ تلقائي")
                    .foregroundStyle(.secondary)
            }
            .font(.caption)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.bar)
        }
    }

    private var draftChapter: Chapter? {
        guard let draftChapterID else { return nil }
        return novel.orderedChapters.first(where: { $0.id == draftChapterID })
    }

    private func load() {
        if let chapter {
            title = chapter.title
            bodyText = chapter.body
        } else {
            title = "فصل \(novel.orderedChapters.count + 1)"
        }
    }

    private func scheduleAutosave() {
        let token = UUID()
        autosaveToken = token
        DispatchQueue.main.asyncAfter(deadline: .now() + autosaveInterval) {
            guard autosaveToken == token else { return }
            save(close: false)
        }
    }

    private func save(close: Bool) {
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else { return }

        let target: Chapter
        if let chapter {
            target = chapter
        } else if let existingDraft = draftChapter {
            target = existingDraft
        } else {
            let created = Chapter(context: viewContext)
            created.id = UUID()
            created.createdAt = Date()
            created.orderIndex = Int32(novel.orderedChapters.count)
            created.novel = novel
            draftChapterID = created.id
            target = created
        }

        target.title = trimmedTitle
        target.body = bodyText
        target.refreshWordCount()
        target.updatedAt = Date()
        novel.updatedAt = Date()
        PersistenceController.shared.save()

        if close {
            dismiss()
        }
    }
}
