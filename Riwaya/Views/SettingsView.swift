import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("readerFontSize") private var fontSize = 20.0
    @AppStorage("readerLineSpacing") private var lineSpacing = 8.0
    @AppStorage("readerTheme") private var readerThemeRaw = ReaderTheme.day.rawValue

    var body: some View {
        NavigationStack {
            Form {
                Section("إعدادات القراءة الافتراضية") {
                    HStack {
                        Text("حجم الخط")
                        Spacer()
                        Text("\(Int(fontSize))")
                            .foregroundStyle(.secondary)
                    }
                    Slider(value: $fontSize, in: 14...34, step: 1)

                    HStack {
                        Text("تباعد الأسطر")
                        Spacer()
                        Text("\(Int(lineSpacing))")
                            .foregroundStyle(.secondary)
                    }
                    Slider(value: $lineSpacing, in: 2...16, step: 1)

                    Picker("المظهر", selection: $readerThemeRaw) {
                        ForEach(ReaderTheme.allCases) { theme in
                            Text(theme.title).tag(theme.rawValue)
                        }
                    }
                }

                Section("حول التطبيق") {
                    LabeledContent("التطبيق", value: "رواية")
                    LabeledContent("الإصدار", value: "1.0")
                    Text("تطبيق شخصي لكتابة وقراءة الروايات محليًا على جهازك، دون حساب ودون اتصال.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("الإعدادات")
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
