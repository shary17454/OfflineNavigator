import CoreData
import SwiftUI

struct LibraryView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @FetchRequest(fetchRequest: Novel.fetchRequest()) private var novels: FetchedResults<Novel>

    @State private var searchText = ""
    @State private var showingComposer = false
    @State private var showingSettings = false
    @State private var novelToEdit: Novel?
    @State private var path: [UUID] = []

    private var filteredNovels: [Novel] {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !query.isEmpty else { return Array(novels) }
        return novels.filter {
            $0.title.localizedCaseInsensitiveContains(query) ||
            $0.authorName.localizedCaseInsensitiveContains(query) ||
            $0.genre.localizedCaseInsensitiveContains(query)
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                RiwayaTheme.libraryBackground

                if novels.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            header

                            if let featured = novels.first {
                                Button {
                                    path.append(featured.id)
                                } label: {
                                    NovelCoverView(novel: featured)
                                        .frame(height: 220)
                                }
                                .buttonStyle(.plain)
                            }

                            LazyVStack(spacing: 14) {
                                ForEach(filteredNovels) { novel in
                                    Button {
                                        path.append(novel.id)
                                    } label: {
                                        novelRow(novel)
                                    }
                                    .buttonStyle(.plain)
                                    .contextMenu {
                                        Button {
                                            novelToEdit = novel
                                        } label: {
                                            Label("تعديل", systemImage: "pencil")
                                        }

                                        Button {
                                            toggleFavorite(novel)
                                        } label: {
                                            Label(
                                                novel.isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة",
                                                systemImage: novel.isFavorite ? "star.slash" : "star"
                                            )
                                        }

                                        Button(role: .destructive) {
                                            delete(novel)
                                        } label: {
                                            Label("حذف", systemImage: "trash")
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 40)
                    }
                }
            }
            .navigationTitle("رواية")
            .navigationBarTitleDisplayMode(.large)
            .toolbarBackground(.hidden, for: .navigationBar)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .searchable(text: $searchText, prompt: "ابحث في مكتبتك")
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button {
                        showingSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("الإعدادات")
                }

                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        showingComposer = true
                    } label: {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel("رواية جديدة")
                }
            }
            .navigationDestination(for: UUID.self) { novelID in
                if let novel = novels.first(where: { $0.id == novelID }) {
                    NovelDetailView(novel: novel)
                } else {
                    Text("الرواية غير موجودة")
                        .foregroundStyle(.secondary)
                }
            }
            .sheet(isPresented: $showingComposer) {
                NovelEditorView(mode: .create)
            }
            .sheet(item: $novelToEdit) { novel in
                NovelEditorView(mode: .edit(novel))
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("مكتبتك الشخصية")
                .font(.system(.largeTitle, design: .serif).weight(.bold))
                .foregroundStyle(RiwayaTheme.mist)

            Text("دفتر محلي مكمّل لمنصة رواية التراثية: اكتب واقرأ مساهماتك دون اتصال.")
                .font(.subheadline)
                .foregroundStyle(RiwayaTheme.mist.opacity(0.75))
        }
        .padding(.top, 8)
    }

    private var emptyState: some View {
        VStack(spacing: 18) {
            Image(systemName: "book.closed.fill")
                .font(.system(size: 48))
                .foregroundStyle(RiwayaTheme.teal)

            Text("ابدأ روايتك الأولى")
                .font(.title2.weight(.bold))
                .foregroundStyle(RiwayaTheme.mist)

            Text("أنشئ عنوانًا، أضف فصولًا، واكتب بحرية. كل شيء يُحفظ على جهازك.")
                .font(.body)
                .foregroundStyle(RiwayaTheme.mist.opacity(0.75))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button {
                showingComposer = true
            } label: {
                Text("رواية جديدة")
                    .font(.headline)
                    .foregroundStyle(RiwayaTheme.ink)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(RiwayaTheme.mist, in: Capsule())
            }
            .padding(.top, 8)
        }
    }

    private func novelRow(_ novel: Novel) -> some View {
        HStack(spacing: 14) {
            NovelCoverView(novel: novel, compact: true)
                .frame(width: 92, height: 120)

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(novel.title)
                        .font(.headline)
                        .foregroundStyle(RiwayaTheme.mist)
                        .lineLimit(2)

                    if novel.isFavorite {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundStyle(.yellow)
                    }
                }

                Text(novel.authorName)
                    .font(.subheadline)
                    .foregroundStyle(RiwayaTheme.mist.opacity(0.7))

                Text("\(TextStats.chaptersLabel(novel.orderedChapters.count)) · \(TextStats.wordsLabel(novel.totalWordCount))")
                    .font(.caption)
                    .foregroundStyle(RiwayaTheme.mist.opacity(0.55))
            }

            Spacer(minLength: 0)

            Image(systemName: "chevron.left")
                .foregroundStyle(RiwayaTheme.mist.opacity(0.4))
        }
        .padding(12)
        .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private func toggleFavorite(_ novel: Novel) {
        novel.isFavorite.toggle()
        novel.updatedAt = Date()
        PersistenceController.shared.save()
    }

    private func delete(_ novel: Novel) {
        viewContext.delete(novel)
        PersistenceController.shared.save()
    }
}
