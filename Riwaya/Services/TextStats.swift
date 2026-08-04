import Foundation

enum TextStats {
    /// Counts Arabic/Latin word tokens separated by whitespace and punctuation.
    static func wordCount(in text: String) -> Int {
        let scalars = text.unicodeScalars
        var count = 0
        var inWord = false

        for scalar in scalars {
            let isWordChar =
                CharacterSet.letters.contains(scalar) ||
                CharacterSet.decimalDigits.contains(scalar)

            if isWordChar {
                if !inWord {
                    count += 1
                    inWord = true
                }
            } else {
                inWord = false
            }
        }

        return count
    }

    static func estimatedReadingMinutes(wordCount: Int, wordsPerMinute: Int = 180) -> Int {
        max(1, Int(ceil(Double(max(wordCount, 1)) / Double(wordsPerMinute))))
    }

    static func arabicCountLabel(_ count: Int, singular: String, dual: String, plural: String) -> String {
        switch count {
        case 0:
            return "لا يوجد"
        case 1:
            return singular
        case 2:
            return dual
        case 3...10:
            return "\(count) \(plural)"
        default:
            return "\(count) \(singular.replacingOccurrences(of: "فصل", with: "فصلًا").replacingOccurrences(of: "كلمة", with: "كلمة"))"
        }
    }

    static func chaptersLabel(_ count: Int) -> String {
        switch count {
        case 0: return "بدون فصول"
        case 1: return "فصل واحد"
        case 2: return "فصلان"
        case 3...10: return "\(count) فصول"
        default: return "\(count) فصلًا"
        }
    }

    static func wordsLabel(_ count: Int) -> String {
        switch count {
        case 0: return "بدون كلمات"
        case 1: return "كلمة واحدة"
        case 2: return "كلمتان"
        case 3...10: return "\(count) كلمات"
        default: return "\(count) كلمة"
        }
    }
}
