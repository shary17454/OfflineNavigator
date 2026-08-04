import SwiftUI

struct NovelDetailView: View {
    @ObservedObject var novel: Novel
    @Environment(\.managedObjectContext) private var viewContext

    @State private var showingEditor = false
    @State private var showingChapterComposer = false
    @State private var chapterToEdit: Chapter?
    @State private var shareItems: [Any] = []
    @State private var showingShare = false
    @State private var alertMessage: String?

    var body: some View {
        List {
            Section {
                NovelCoverView(novel: novel)
                    .frame(height: 210)
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                    .listRowBackground(Color.clear)

                if let synopsis = novel.synopsis, !synopsis.isEmpty {
                    Text(synopsis)
                        .font(.body)
                        .foregroundStyle(.secondary)
                }

                LabeledContent("التصنيف", value: novel.genre)
                LabeledContent("الفصول", value: TextStats.chaptersLabel(novel.orderedChapters.count))
                LabeledContent("الكلمات", value: TextStats.wordsLabel(novel.totalWordCount))
                LabeledContent(
                    "وقت القراءة التقريبي",
                    value: "\(TextStats.estimatedReadingMinutes(wordCount: novel.totalWordCount)) د"
                )
            }

            Section("الفصول") {
                if novel.orderedChapters.isEmpty {
                    Text("لا توجد فصول بعد. أضف فصلًا لتبدأ الكتابة.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(novel.orderedChapters) { chapter in
                        NavigationLink {
                            ChapterHubView(novel: novel, chapter: chapter)
                        } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(chapter.title)
                                    .font(.headline)
                                Text(TextStats.wordsLabel(Int(chapter.wordCount)))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .swipeActions {
                            Button {
                                chapterToEdit = chapter
                            } label: {
                                Label("تحرير", systemImage: "pencil")
                            }

                            Button(role: .destructive) {
                                delete(chapter)
                            } label: {
                                Label("حذف", systemImage: "trash")
                            }
                        }
                    }
                    .onMove(perform: moveChapters)
                }
            }
        }
        .navigationTitle(novel.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                EditButton()

                Button {
                    showingChapterComposer = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("فصل جديد")

                Menu {
                    Button {
                        showingEditor = true
                    } label: {
                        Label("تعديل الرواية", systemImage: "pencil")
                    }

                    Button {
                        novel.isFavorite.toggle()
                        novel.updatedAt = Date()
                        PersistenceController.shared.save()
                    } label: {
                        Label(novel.isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة", systemImage: novel.isFavorite ? "star.slash" : "star")
                    }

                    Button {
                        exportNovel()
                    } label: {
                        Label("تصدير ومشاركة", systemImage: "square.and.arrow.up")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEditor) {
            NovelEditorView(mode: .edit(novel))
        }
        .sheet(isPresented: $showingChapterComposer) {
            ChapterEditorView(novel: novel, chapter: nil)
        }
        .sheet(item: $chapterToEdit) { chapter in
            ChapterEditorView(novel: novel, chapter: chapter)
        }
        .sheet(isPresented: $showingShare) {
            ShareSheet(items: shareItems)
        }
        .alert("موروث", isPresented: Binding(get: { alertMessage != nil }, set: { if !$0 { alertMessage = nil } })) {
            Button("حسنًا", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "")
        }
        .onAppear {
            novel.lastOpenedAt = Date()
            PersistenceController.shared.save()
        }
    }

    private func moveChapters(from source: IndexSet, to destination: Int) {
        var chapters = novel.orderedChapters
        chapters.move(fromOffsets: source, toOffset: destination)
        for (index, chapter) in chapters.enumerated() {
            chapter.orderIndex = Int32(index)
            chapter.updatedAt = Date()
        }
        novel.updatedAt = Date()
        PersistenceController.shared.save()
    }

    private func delete(_ chapter: Chapter) {
        viewContext.delete(chapter)
        let remaining = novel.orderedChapters
        for (index, item) in remaining.enumerated() {
            item.orderIndex = Int32(index)
        }
        novel.updatedAt = Date()
        PersistenceController.shared.save()
    }

    private func exportNovel() {
        do {
            let url = try NovelExportService.makeTemporaryFile(for: novel)
            shareItems = [url]
            showingShare = true
        } catch {
            alertMessage = "تعذر تصدير الرواية: \(error.localizedDescription)"
        }
    }
}

struct ChapterHubView: View {
    @ObservedObject var novel: Novel
    @ObservedObject var chapter: Chapter

    var body: some View {
        List {
            Section {
                Text(chapter.title)
                    .font(.title2.weight(.bold))
                Text(TextStats.wordsLabel(Int(chapter.wordCount)))
                    .foregroundStyle(.secondary)
            }

            Section {
                NavigationLink {
                    ReaderView(novel: novel, chapter: chapter)
                } label: {
                    Label("قراءة", systemImage: "book")
                }

NavigationLink {
                            ChapterEditorView(novel: novel, chapter: chapter, embedsNavigation: false)
                        } label: {
                            Label("تحرير النص", systemImage: "pencil.line")
                        }
            }
        }
        .navigationTitle("الفصل")
        .navigationBarTitleDisplayMode(.inline)
    }
}
