# Performance

Performance here means responsive offline navigation and editing, bounded memory/storage use, and predictable API latency under load. Correctness and safety take priority over speed. Test methodology is in [testing-strategy.md](testing-strategy.md); database/index guidance is in [data-persistence.md](data-persistence.md); network budgets are in [networking.md](networking.md).

## Current behavior and likely bottlenecks

### OfflineNavigator

- `LocationMotionManager` requests best accuracy, emits location updates every 3 m, heading changes every 1°, and device-motion updates every 0.2 s (`OfflineNavigator/Services/LocationMotionManager.swift`). These settings support live guidance but consume battery and drive frequent SwiftUI updates.
- `ContentView` recalculates distance/bearing and proximity on location publications. This is cheap for one selected waypoint.
- `OfflineGridMapView.projectedPoints` computes the maximum distance and projects **every** waypoint on every render. It then draws every point in one `Canvas`. This is linear in waypoint count and suitable only while the collection remains modest.
- `WaypointMapView` receives a newly materialized `Array(waypoints)` on render; MapKit annotation reconciliation may become expensive as records grow.
- GPX parsing is streaming at the XML parser layer but retains every parsed point, then creates every Core Data object on the view context before one save.
- GPX export builds all XML rows and the full document as `String`s before writing, temporarily duplicating memory.
- iCloud backup maps and JSON-encodes the full waypoint set on the main actor. KVS is intended for small preference-like data, not an unbounded coordinate archive.

### Riwaya

- `TextStats.wordCount` scans Unicode scalars in O(n), which is appropriate for a single calculation.
- `ChapterEditorView` recomputes the full body count while rendering and again on each autosave after 1.2 seconds. Long chapters can cause visible main-thread work.
- `Novel.orderedChapters` sorts the relationship every access. `totalWordCount` calls it and then reduces; library rows can repeat this work.
- `LibraryView.filteredNovels` materializes all fetched novels and filters title/author/genre in memory on every search update.
- Chapter bodies are regular Core Data strings and are loaded with their Chapter objects. There is no fetch batching or separate large-text strategy.

### Rawaya API and Flutter

- بعض قوائم المحتوى العامة (مثل الشعراء/القصائد/القصص/الكتب/الخيل) تستخدم حدودًا ثابتة 20 أو 50 بلا cursor. `GET /questions` وقوائم الإدارة `listAllPoems` و`listPendingPoems` غير محدودة.
- Search executes three PostgreSQL `contains` queries across title, summary and body. `%term%` matching cannot efficiently use ordinary B-tree indexes; current schema has no full-text/trigram indexes for these fields.
- Search returns full Prisma models, including poem/story bodies, then inserts a `SearchLog` synchronously before responding.
- `getPoem` increments `viewCount` on every read, turning a read path into a contended write.
- `PermissionGuard` loads roles and nested permissions from PostgreSQL for every protected request.
- Auth refresh scans all active tokens for one user and Argon2-verifies serially; logout scans **all active tokens in the database** and verifies each serially (`rawayah/apps/api/src/modules/auth/auth.service.ts`). This is a severe load-amplification path.
- Media uploads use Multer memory storage by default, then write the complete `Buffer`; no size limit is configured.
- Flutter `SearchPage` creates a new `ApiClient`/Dio instance per search, does not debounce, and interpolates the raw query into a URL.
- Flutter’s `OfflineLibraryStore` decodes, sorts and rewrites the entire JSON library for each operation. Editing a chapter therefore scales with total library size, not changed chapter size.

## Safe improvements, in order

### OfflineNavigator

1. Set an explicit supported waypoint/GPX limit before optimizing. Reject oversized imports before object creation.
2. Parse/import on a background context in batches; save only after validation, then merge to the view context.
3. Stream GPX export to an atomic file rather than assembling one large string.
4. Move KVS encode/decode off the main actor and enforce a conservative encoded-size limit. Keep Core Data authoritative.
5. Reduce location/heading/motion update rates when no waypoint is selected or app navigation is not active. Do not reduce active guidance accuracy without device tests.
6. For large collections, fetch/map only a viewport or cluster annotations. Avoid recomputing max distance over all waypoints for every sensor tick.

Do not cache bearing based only on destination: origin changes. Do not throttle so aggressively that arrival detection crosses the threshold without an update.

### Riwaya

1. Keep stored `Chapter.wordCount`, but calculate on the autosave debounce rather than synchronously for every keystroke/render.
2. Cache a transient editor count or update incrementally only if Unicode boundary correctness is retained.
3. Fetch/filter novels with Core Data predicates and `fetchBatchSize` once realistic library sizes require it.
4. Avoid repeated `orderedChapters` calls within one render; calculate once and pass the array.
5. Profile before externalizing bodies. Core Data can handle substantial text, and premature file splitting adds consistency risks.

Stored `wordCount` is derived data. Any import, migration, or direct body update must refresh it; see [data-persistence.md](data-persistence.md).

### Rawaya API

1. Make every collection cursor-paginated with an explicit maximum page size. Return list projections, not full bodies.
2. Add indexes based on measured `EXPLAIN (ANALYZE, BUFFERS)` output. Likely candidates include status/deleted/time composites, user/time lookups, active refresh-token lookup, and media content lookup.
3. Use PostgreSQL full-text or `pg_trgm` for Arabic search after defining normalization semantics. Keep the query and indexed representation consistent.
4. Decouple search analytics and view counting from the response path, or aggregate asynchronously with bounded loss acceptable to product requirements.
5. Put stable permission claims/version in a short-lived access-token/cache strategy, or cache RBAC lookups with explicit invalidation. Never cache indefinitely.
6. Replace refresh/logout token scans with a token identifier (`jti`/selector) that finds one row, followed by one hash verification.
7. Stream uploads to controlled storage, enforce request/file limits before buffering, and process media asynchronously.
8. Use Prisma transactions for multi-write flows; this improves correctness and avoids compensating work.

Redis exists in `docker-compose.yml`, but the current source does not use it. Adding caching before invalidation, observability and ownership rules are defined would create stale-data bugs.

### Rawaya Flutter

1. Provide one configured Dio instance through Riverpod, including connection reuse, base URL, interceptors and cancellation.
2. Pass query parameters through Dio (`queryParameters`) and debounce/cancel stale searches.
3. Request compact paginated DTOs; do not download full content bodies for result titles.
4. Replace whole-library `SharedPreferences` JSON with a transactional local database when data can exceed a small notebook. Migration criteria are in [data-persistence.md](data-persistence.md).
5. Move large JSON decoding/encoding off the UI isolate only as a temporary bridge; it does not fix full-rewrite durability or capacity.

## Measurement scenarios

Measure release builds on representative physical devices and a production-like PostgreSQL instance. Report p50/p95/p99, data size, device/server shape and sample count.

| Scenario | Dataset/load | Gate |
| --- | --- | --- |
| Navigation update | 1 selected waypoint, active GPS/heading | p95 UI processing under 16 ms per sensor publication; no sustained frame rate below 55 fps. |
| Offline grid | 1,000 waypoints | First meaningful render under 500 ms and pan/updates remain above 50 fps; otherwise lower the supported limit or implement clustering. |
| GPX import | 10,000 valid points, supported only after a limit decision | Peak app memory under 150 MB above baseline; progress/cancel available if over 2 s. |
| KVS backup | Maximum supported waypoint set | Encode work causes no main-thread stall over 50 ms and encoded payload stays below the documented app limit. |
| Riwaya editing | 100,000-character Arabic chapter | p95 keystroke frame under 16 ms; autosave completes under 500 ms without blocking input. |
| Riwaya library | 1,000 novels / 10,000 chapters | Search result update under 150 ms; scrolling above 55 fps. |
| API list | 1 million content rows, 100 concurrent clients | p95 under 300 ms, p99 under 800 ms, zero unbounded responses. |
| API search | same dataset, representative Arabic queries | p95 under 500 ms, p99 under 1 s; DB query p95 under 300 ms. |
| API auth refresh/logout | 20 active sessions/user, 100 requests/s | p95 under 300 ms and constant-order row lookup; no database-wide token scan. |
| Flutter search | warm connection, production-like RTT | UI acknowledges input immediately; one in-flight request per latest query; no stale result replacement. |
| Flutter offline save | 100 works / 1,000 chapters | save acknowledgment under 200 ms; for larger targets migrate storage rather than relaxing indefinitely. |

These are initial engineering gates, not claims about current performance. Capture baselines before and after each optimization.

## Profiling tools and evidence

- iOS: Instruments Time Profiler, Core Data, Allocations, Energy Log, SwiftUI and Core Animation hitches.
- Flutter: DevTools frame chart, CPU profiler, memory view and network view in profile/release mode.
- API: request histogram by route/status, event-loop lag, process RSS, Prisma query duration, PostgreSQL `pg_stat_statements`, slow-query logs and `EXPLAIN`.
- Load tests must use realistic response bodies and authentication, not a mocked controller.

## Review checklist

- [ ] Collection endpoints and local reads have explicit bounds.
- [ ] Main/UI thread performs no large parse, encode, sort or database import.
- [ ] Repeated operations are O(1) or indexed where user/database size can grow.
- [ ] New indexes correspond to measured queries and write cost was considered.
- [ ] A cache has TTL, key cardinality, invalidation and privacy rules.
- [ ] Pagination order is stable and has a deterministic tie-breaker.
- [ ] Upload and GPX limits are enforced before allocation.
- [ ] Benchmarks include cold/warm, success/error and low-end-device cases.
- [ ] Correctness tests pass after optimization.

## Common mistakes

- Optimizing navigation formulas while leaving all-waypoint redraws and main-thread GPX work untouched.
- Increasing KVS usage because serialization is fast; service quota and conflict semantics remain unsuitable for large archives.
- Incrementally counting words by spaces and breaking Arabic punctuation/diacritic behavior.
- Adding a B-tree index for `contains`/`%term%` and assuming PostgreSQL will use it.
- Caching authorization without invalidating role or user-status changes.
- Logging every search synchronously and then compensating with a larger DB pool.
- Moving Flutter JSON work to an isolate while still rewriting an unbounded library.
- Reporting averages only; field/navigation and API regressions appear in tail latency and frame hitches.
