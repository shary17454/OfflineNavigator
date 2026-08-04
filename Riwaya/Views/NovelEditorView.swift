import SwiftUI

enum NovelEditorMode: Identifiable {
    case create
    case edit(Novel)

    var id: String {
        switch self {
        case .create: return "create"
        case .edit(let novel): return novel.id.uuidString
        }
    }
}

struct NovelEditorView: View {
    @Environment(\.managedObjectContext) private var viewContext
    @Environment(\.dismiss) private var dismiss

    let mode: NovelEditorMode

    @State private var title = ""
    @State private var authorName = ""
    @State private var synopsis = ""
    @State private var genre = NovelGenre.drama.rawValue
    @State private var coverHue = 0.48
    @State private var isFavorite = false

    var body: some View {
        NavigationStack {
            Form {
                Section("الغلاف") {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(hue: coverHue, saturation: 0.45, brightness: 0.42),
                                    Color(hue: coverHue, saturation: 0.55, brightness: 0.22)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(height: 140)
                        .overlay(alignment: .bottomLeading) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(title.isEmpty ? "عنوان الرواية" : title)
                                    .font(.title3.weight(.bold))
                                    .foregroundStyle(.white)
                                Text(authorName.isEmpty ? "اسم المؤلف" : authorName)
                                    .font(.subheadline)
                                    .foregroundStyle(.white.opacity(0.85))
                            }
                            .padding(16)
                        }

                    Slider(value: $coverHue, in: 0...1)
                        .tint(RiwayaTheme.teal)
                }

                Section("التفاصيل") {
                    TextField("عنوان الرواية", text: $title)
                    TextField("اسم المؤلف", text: $authorName)

                    Picker("التصنيف", selection: $genre) {
                        ForEach(NovelGenre.allCases) { item in
                            Text(item.rawValue).tag(item.rawValue)
                        }
                    }

                    Toggle("مفضلة", isOn: $isFavorite)
                }

                Section("نبذة") {
                    TextField("اكتب نبذة قصيرة…", text: $synopsis, axis: .vertical)
                        .lineLimit(4...8)
                }
            }
            .navigationTitle(modeTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("إلغاء") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("حفظ") { save() }
                        .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .onAppear(perform: load)
        }
    }

    private var modeTitle: String {
        switch mode {
        case .create: return "رواية جديدة"
        case .edit: return "تعديل الرواية"
        }
    }

    private func load() {
        guard case .edit(let novel) = mode else {
            authorName = "أنا"
            return
        }

        title = novel.title
        authorName = novel.authorName
        synopsis = novel.synopsis ?? ""
        genre = novel.genre
        coverHue = novel.coverHue
        isFavorite = novel.isFavorite
    }

    private func save() {
        let novel: Novel
        switch mode {
        case .create:
            novel = Novel(context: viewContext)
            novel.id = UUID()
            novel.createdAt = Date()
        case .edit(let existing):
            novel = existing
        }

        novel.title = title.trimmingCharacters(in: .whitespacesAndNewlines)
        novel.authorName = authorName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "مجهول" : authorName.trimmingCharacters(in: .whitespacesAndNewlines)
        novel.synopsis = synopsis.trimmingCharacters(in: .whitespacesAndNewlines)
        novel.genre = genre
        novel.coverHue = coverHue
        novel.isFavorite = isFavorite
        novel.updatedAt = Date()

        PersistenceController.shared.save()
        dismiss()
    }
}
