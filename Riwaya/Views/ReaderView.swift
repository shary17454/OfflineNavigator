import SwiftUI

/// Reader that can move between chapters without relying on NavigationLink replacement.
struct ReaderView: View {
    @ObservedObject var novel: Novel
    let initialChapter: Chapter

    @AppStorage("readerFontSize") private var fontSize = 20.0
    @AppStorage("readerLineSpacing") private var lineSpacing = 8.0
    @AppStorage("readerTheme") private var readerThemeRaw = ReaderTheme.day.rawValue

    @State private var chapterID: UUID
    @State private var showingControls = true
    @State private var showingSettings = false

    init(novel: Novel, chapter: Chapter) {
        self.novel = novel
        self.initialChapter = chapter
        _chapterID = State(initialValue: chapter.id)
    }

    private var theme: ReaderTheme {
        ReaderTheme(rawValue: readerThemeRaw) ?? .day
    }

    private var chapters: [Chapter] {
        novel.orderedChapters
    }

    private var chapter: Chapter {
        chapters.first(where: { $0.id == chapterID }) ?? initialChapter
    }

    private var currentIndex: Int {
        chapters.firstIndex(where: { $0.id == chapterID }) ?? 0
    }

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text(chapter.title)
                        .font(.system(size: fontSize + 8, weight: .bold, design: .serif))
                        .foregroundStyle(theme.foreground)

                    Text(chapter.body.isEmpty ? "لا يوجد نص في هذا الفصل بعد." : chapter.body)
                        .font(.system(size: fontSize, design: .serif))
                        .foregroundStyle(theme.foreground.opacity(chapter.body.isEmpty ? 0.55 : 1))
                        .lineSpacing(lineSpacing)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.horizontal, 22)
                .padding(.vertical, 28)
                .id(chapterID)
            }
            .onTapGesture {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showingControls.toggle()
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(showingControls ? .visible : .hidden, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .principal) {
                VStack(spacing: 2) {
                    Text(novel.title)
                        .font(.caption.weight(.semibold))
                    Text(chapter.title)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingSettings = true
                } label: {
                    Image(systemName: "textformat.size")
                }
                .accessibilityLabel("إعدادات القراءة")
            }
        }
        .safeAreaInset(edge: .bottom) {
            if showingControls {
                HStack {
                    Button {
                        go(delta: -1)
                    } label: {
                        Label("السابق", systemImage: "chevron.forward")
                    }
                    .disabled(currentIndex == 0)

                    Spacer()

                    Text("\(currentIndex + 1) / \(max(chapters.count, 1))")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.secondary)

                    Spacer()

                    Button {
                        go(delta: 1)
                    } label: {
                        Label("التالي", systemImage: "chevron.backward")
                    }
                    .disabled(currentIndex >= chapters.count - 1)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
            }
        }
        .sheet(isPresented: $showingSettings) {
            ReaderSettingsView(
                fontSize: $fontSize,
                lineSpacing: $lineSpacing,
                themeRaw: $readerThemeRaw
            )
            .presentationDetents([.medium])
        }
        .onAppear(perform: persistProgress)
        .onChange(of: chapterID) { _, _ in
            persistProgress()
        }
    }

    private func go(delta: Int) {
        let next = currentIndex + delta
        guard chapters.indices.contains(next) else { return }
        withAnimation(.easeInOut(duration: 0.2)) {
            chapterID = chapters[next].id
        }
    }

    private func persistProgress() {
        novel.lastReadChapterID = chapterID
        novel.lastOpenedAt = Date()
        PersistenceController.shared.save()
    }
}

struct ReaderSettingsView: View {
    @Binding var fontSize: Double
    @Binding var lineSpacing: Double
    @Binding var themeRaw: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("حجم الخط") {
                    Slider(value: $fontSize, in: 14...34, step: 1)
                    Text("\(Int(fontSize))")
                        .foregroundStyle(.secondary)
                }

                Section("تباعد الأسطر") {
                    Slider(value: $lineSpacing, in: 2...16, step: 1)
                }

                Section("المظهر") {
                    Picker("المظهر", selection: $themeRaw) {
                        ForEach(ReaderTheme.allCases) { theme in
                            Text(theme.title).tag(theme.rawValue)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }
            .navigationTitle("القراءة")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("تم") { dismiss() }
                }
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
    }
}
