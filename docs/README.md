# Engineering documentation

This directory documents the code that is currently checked into this multi-product repository. Start with [`../AGENTS.md`](../AGENTS.md) for repository-wide operating rules; the pages here add implementation detail and do not replace those rules.

## Products at a glance

| Product | Code | Current implementation |
| --- | --- | --- |
| **Madall / مدّل** | [`../OfflineNavigator/`](../OfflineNavigator/) and `OfflineNavigator.xcodeproj` | Native iOS 17+ SwiftUI coordinate navigator. Core Data owns waypoints; `LocationMotionManager` supplies location, heading, and device motion; `GPXService` imports/exports GPX; `ICloudBackupService` optionally mirrors snapshots to iCloud KVS. |
| **Mawrooth / موروث** | [`../Riwaya/`](../Riwaya/) and `Riwaya.xcodeproj` | Native iOS 17+ Arabic RTL notebook. Core Data owns `Novel` and `Chapter`; `LibraryView`, `ChapterEditorView`, and `ReaderView` implement local writing and reading. |
| **Rawaya heritage platform / موروث** | [`../rawayah/`](../rawayah/) | npm workspaces with a NestJS/Prisma API, two Next.js Pages Router clients, and a Flutter mobile MVP. Most Flutter routes are placeholders; the implemented offline notebook stores one JSON document in `SharedPreferences`. |

These products share a repository and Apple team, but not data models, runtime state, or release lifecycle. `Waypoint`, `Novel`, Prisma `Poem`, and Flutter `OfflineWork` are separate sources of truth.

## Documentation map

| Document | Use it for |
| --- | --- |
| [`architecture.md`](architecture.md) | Runtime boundaries, state flow, persistence, and architectural weaknesses |
| [`project-structure.md`](project-structure.md) | Where code lives and where a change belongs |
| [`rawayah-platform.md`](rawayah-platform.md) | NestJS, Prisma, Next.js, Flutter, auth, moderation, and platform gaps |
| [`coding-standards.md`](coding-standards.md) | Cross-language quality gates and review checklists |
| [`swift-style.md`](swift-style.md) | Swift naming, APIs, errors, Core Data, and concurrency conventions |
| [`swiftui-guidelines.md`](swiftui-guidelines.md) | State ownership, navigation, RTL, accessibility, and view decomposition |
| [`testing-strategy.md`](testing-strategy.md) | Existing test inventory, gaps, and product-specific test commands |
| [`performance.md`](performance.md) | Hot paths, budgets, and measurement checklists |
| [`security.md`](security.md) | Trust boundaries, privacy, auth, storage, and security review |
| [`networking.md`](networking.md) | Actual network clients, endpoints, offline behavior, and gaps |
| [`data-persistence.md`](data-persistence.md) | Core Data, Prisma, KVS, and SharedPreferences ownership |
| [`error-handling.md`](error-handling.md) | Current failure behavior and product-specific error contracts |
| [`accessibility.md`](accessibility.md) | Product-specific accessibility baseline and acceptance checks |
| [`ui-guidelines.md`](ui-guidelines.md) | Shared and product-specific UI conventions |
| [`maintenance.md`](maintenance.md) | Known debt and maintenance workflow |
| [`release-process.md`](release-process.md) | Cross-product release verification without replacing product release notes |
| [`app-store-readiness.md`](app-store-readiness.md) | Evidence-based App Store readiness gaps |
| [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md) | Existing Rawaya Xcode Cloud setup; release documentation, unchanged here |
| [`MAWROOTH_XCODE_CLOUD.md`](MAWROOTH_XCODE_CLOUD.md) | Existing compatibility pointer for Apple identity |
| [`RAWAYA_MERGE.md`](RAWAYA_MERGE.md) | Existing merge provenance |

Product-local references provide useful implementation context، لكن قد تحتوي أسماء/نتائج تاريخية. هوية المنتج الحالية تُحسم من `Info.plist` وBuild Settings، ونتائج البناء لا تُعد حديثة ما لم تُشغّل وتُسجّل:

- [`../README.md`](../README.md): current Madall feature and build overview.
- [`../Riwaya/README.md`](../Riwaya/README.md): Mawrooth feature and build overview.
- [`../rawayah/README.md`](../rawayah/README.md): Rawaya service startup.
- [`../rawayah/docs/`](../rawayah/docs/): platform API, database, security, moderation, and deployment notes.

## Current quality baseline

The checked-in test surface is small and uneven:

- Madall has `NavigationMathTests`, `GPXServiceTests`, and one iCloud snapshot codec test.
- Mawrooth has `TextStatsTests` plus `NovelExportServiceTests` in the same file.
- Rawaya API has five Jest files: three static-contract suites and two Nest-bootstrap scaffolds؛ لا توجد assertions ذات معنى على HTTP endpoints أو الخدمات/الحراس/Prisma.
- Rawaya mobile has one splash-screen widget test.
- No web or admin tests are present; their npm scripts deliberately pass when no tests exist.

Passing the current suite therefore does **not** establish persistence safety, authentication correctness, moderation authorization, UI navigation correctness, or migration compatibility.

## Definition of done for documentation-sensitive changes

Use the detailed rules in [`../AGENTS.md`](../AGENTS.md) and the relevant standards page. At minimum:

- [ ] Name the product and source-of-truth store affected.
- [ ] Keep the diff inside that product unless an explicit contract spans products.
- [ ] Add or update a deterministic test for changed pure logic.
- [ ] Exercise the relevant build/analyzer command; report unavailable Apple/Flutter tooling honestly.
- [ ] Record any persistence schema, API shape, route, privacy, signing, or deployment change in its existing specialist document.
- [ ] Do not claim placeholder routes, packages, or contract-only tests are production implementations.

## Known factual limits

This documentation describes repository code, project files, and checked-in configuration. It does not prove that App Store Connect workflows, production infrastructure, external storage, deployed databases, or signing profiles currently exist or are healthy. Existing release files contain historical verification statements; they are linked above but were not revalidated here.
