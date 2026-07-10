import SwiftUI

struct SettingsView: View {
    @Binding var proximityDistance: Double
    @Binding var iCloudBackupEnabled: Bool
    let iCloudAvailable: Bool
    let lastBackupDate: Date?
    let onBackup: () -> Void
    let onRestore: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Arrival alert") {
                    HStack {
                        Label("Alert distance", systemImage: "bell")
                        Spacer()
                        Text("\(Int(proximityDistance)) m")
                            .foregroundStyle(.secondary)
                            .monospacedDigit()
                    }
                    Slider(value: $proximityDistance, in: 10...200, step: 10)
                        .accessibilityLabel("Arrival alert distance")
                }

                Section("iCloud backup") {
                    Toggle("Automatic backup", isOn: $iCloudBackupEnabled)
                        .disabled(!iCloudAvailable)

                    if iCloudAvailable {
                        Button("Back Up Now", systemImage: "icloud.and.arrow.up", action: onBackup)
                        Button("Restore Missing Points", systemImage: "icloud.and.arrow.down", action: onRestore)

                        if let lastBackupDate {
                            Text("Last backup: \(lastBackupDate.formatted(date: .abbreviated, time: .shortened))")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Text("Sign in to iCloud on this device to enable backup.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Offline navigation") {
                    Label("The offline grid, GPS distance, bearing, compass, and saved points work without map tiles or an internet connection.", systemImage: "wifi.slash")
                        .font(.footnote)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
