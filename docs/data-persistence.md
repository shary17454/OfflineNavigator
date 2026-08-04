# Data persistence

This repository currently uses four different persistence mechanisms:

- OfflineNavigator: Core Data for authoritative waypoints, `@AppStorage` for preferences, iCloud KVS for an optional snapshot, and temporary GPX exports.
- Riwaya: Core Data for novels/chapters, `@AppStorage` for reader settings, and temporary text exports.
- Rawaya API: PostgreSQL through Prisma plus local filesystem media.
- Rawaya Flutter: one JSON document in `SharedPreferences` for the offline notebook.

They are not interchangeable. Core Data/PostgreSQL are record stores; `SharedPreferences`, `@AppStorage` and KVS are small settings/key-value mechanisms. Error policy is in [error-handling.md](error-handling.md), security/retention in [security.md](security.md), performance limits in [performance.md](performance.md), and verification in [testing-strategy.md](testing-strategy.md).

## OfflineNavigator

### Current model and behavior

`OfflineNavigator/OfflineNavigator.xcdatamodeld/OfflineNavigator.xcdatamodel/contents` defines one `Waypoint`:

| Field | Type | Required |
| --- | --- | --- |
| `id` | UUID | yes |
| `name` | String | yes |
| `latitude`, `longitude` | Double | yes |
| `note` | String | no |
| `createdAt` | Date | yes |

`PersistenceController` creates `NSPersistentContainer(name: "OfflineNavigator")`, loads the default store, enables parent-change merging, and exposes the view context. Store-load failure calls `fatalError`. `save()` rolls the view context back on error but does not return/throw/log the failure.

`ContentView` directly inserts/saves new waypoints and displays save errors. Deletion instead calls the silent `PersistenceController.save()`, then triggers optional backup even if deletion was rolled back.

GPX:

- `GPXService.parse` maps `wpt`, `rtept` and `trkpt` to in-memory values.
- `importWaypoints` inserts all parsed points into the supplied context and saves once.
- There is no deduplication, validation, batching, limit or explicit rollback in `importWaypoints`.
- Export writes a temporary GPX containing all current waypoints.

iCloud KVS:

- Key `OfflineNavigator.Waypoints.v1` contains a JSON array of all `WaypointSnapshot` fields.
- `OfflineNavigator.LastBackupDate` is separate.
- Restore fetches all local IDs and inserts only snapshots whose IDs are absent. It never updates or deletes existing records.
- Core Data remains authoritative; KVS is currently a full snapshot with **no application-enforced byte or waypoint limit**، رغم أن KVS مناسب للبيانات الصغيرة فقط.
- Automatic backup errors are discarded by `try?`.

Preferences `mapDisplayMode`, `proximityDistance` and `iCloudBackupEnabled` use `@AppStorage`.

### Weaknesses and safe improvements

- Add a unique Core Data constraint on `id` in a **versioned model**, with a tested merge policy. The current Set-based restore check is not concurrency-safe by itself.
- Create the first model version before any schema change; test lightweight migration from an archived old store. An in-memory store is not a migration test.
- Validate an entire GPX before insertion. Import in a private context/transaction, roll back on any failure, then merge.
- Define duplicate semantics explicitly: reject, skip by UUID (GPX has no app UUID today), or deduplicate by normalized coordinate/name. Do not silently guess.
- Make `save()` throw or return a typed result. Only backup after confirmed local commit.
- Set context concurrency/debug rules and avoid large imports on `viewContext`.
- Add explicit KVS schema metadata, payload/waypoint limits, conflict policy and backup deletion. Existing-ID-wins restore means a newer cloud edit cannot update a local record.
- Treat temporary exports as ephemeral and clean them up.

Example invariant: a successful “Imported 25 waypoints” message means exactly 25 validated records committed, or the defined duplicate count is separately reported. A failed import leaves the pre-import store unchanged.

## Riwaya

### Current model and behavior

The Core Data model has:

- `Novel`: UUID, title, author, optional synopsis, genre, cover hue, created/updated/last-opened dates, favorite, last-read chapter UUID/offset, and a to-many Chapters relationship.
- `Chapter`: UUID, title, body, order index, cached `wordCount`, created/updated dates, and optional Novel relationship.
- Deleting a Novel cascades to Chapters. Deleting/nullifying the Chapter side does not delete the Novel.

`PersistenceController` uses object-trump merge policy, silently rolls back save errors, and seeds two Arabic chapters if `count(for:)` returns zero. A count error is converted to zero, so a store/query failure can incorrectly enter seeding logic.

`ChapterEditorView` autosaves after 1.2 seconds of inactivity, creates a draft once, updates body/title/cached count/timestamps, then calls the silent save helper. Reader progress also uses that helper. The UI can display “حفظ تلقائي” even when persistence failed.

`TextStats.wordCount` defines a word as a run of Unicode letters or decimal digits. The stored `Chapter.wordCount` is derived from that definition. `Novel.totalWordCount` sums cached counts, so stale Chapter counts produce stale totals.

Reader font size, line spacing and theme use `@AppStorage`. `NovelExportService` writes all ordered chapters to a temporary UTF-8 text file.

### Weaknesses and safe improvements

- Introduce explicit Core Data model versions and migration tests before adding/changing fields.
- Make saves observable and typed. Autosave needs `saving/saved/failed` state; retain dirty text and allow retry after failure.
- Seed only after a successful fetch proves the store is empty. Mark seed completion/version separately if seed evolution is needed.
- Define uniqueness for Novel/Chapter IDs and deterministic chapter ordering. `orderIndex` can collide; sort with an ID tie-breaker and normalize indices transactionally after reorder/delete.
- Centralize body mutation so `wordCount` and `updatedAt` cannot be skipped. Add a repair migration that recomputes cached counts if `TextStats` semantics change.
- Guard Int-to-Int32 conversion for exceptionally large counts/order values.
- Decide whether read progress offset is a character, Unicode scalar, UTF-16, or layout position before using `lastReadOffset`; current source stores it but does not update it.
- Clean up temporary exports and define whether files may enter device/cloud backups.

Example invariant: after every committed Chapter body change, `wordCount == TextStats.wordCount(in: body)`, and the parent Novel’s displayed total equals the sum of committed Chapters.

## Rawaya PostgreSQL and Prisma

### Current model and behavior

`rawayah/apps/api/prisma/schema.prisma` defines users/profiles/RBAC, many heritage content models, polymorphic content links, comments/questions, lists/favorites, media, subscriptions/payments, logs and refresh tokens. PostgreSQL is configured through `DATABASE_URL`.

Strengths:

- Primary keys and many natural identifiers (`email`, `slug`, role/permission codes) are unique.
- Many ownership relations cascade appropriately.
- Favorite/list membership and RBAC join rows have composite uniqueness.
- Soft deletion/status fields exist on several public content types.
- Polymorphic content lookup tables have `(contentType, contentId)` indexes.

Current repository weaknesses:

- No `prisma/migrations/` files are present. `docker-compose.yml` runs `prisma migrate deploy`, but there is nothing in source to deploy.
- Multi-write operations are often not transactional: registration creates user/profile, then role; moderation creates revision, updates poem, then logs; media writes a file and several DB rows; subscribe creates subscription then payment.
- Polymorphic `contentId` fields have no database foreign key to the target table, so application code must prevent orphans.
- Public filtering is inconsistent across models.
- Some important access/order paths lack composite indexes: e.g. active refresh tokens by user, reading lists by user/date, notifications by user/read/date, content by status/deleted/date.
- `MediaFile.isPrivate` is stored but not enforced by filesystem delivery.
- Local `.rawaya-storage` and PostgreSQL have separate durability/backup lifecycles; a DB restore can reference missing files and vice versa.
- There is no visible retention job for refresh tokens, search/view/audit logs, soft-deleted rows or orphan media.

### Safe schema and transaction practices

1. Commit an initial migration that matches the reviewed production schema; never use `db push` as production history.
2. Run `prisma migrate deploy` as a controlled release step with backups and rollback/forward-fix planning.
3. Prefer expand/migrate/contract for breaking changes: add nullable/new structures, backfill in bounded batches, switch code, then enforce/remove later.
4. Wrap logically atomic writes in `prisma.$transaction`.
5. For filesystem media, stage the file, create DB records transactionally, promote after commit, and run idempotent orphan reconciliation. Object storage with checksums/versioning is safer for multi-instance deployment.
6. Validate polymorphic target existence and content type in service code; add reconciliation queries.
7. Create indexes from real query plans, not every field. See [performance.md](performance.md).
8. Back up PostgreSQL with tested point-in-time recovery; back up media with matching retention. Encrypt backups and test restore.

Example transaction: registration should create User/Profile, resolve the required USER role, create UserRole and issue/persist refresh token as one defined outcome. If the role is mandatory and absent, no half-registered account should remain.

## Rawaya Flutter `SharedPreferences`

### Current behavior

`OfflineLibraryStore` stores the complete list under `rawaya_offline_works_v1`:

```text
SharedPreferences string
  -> JSON list of OfflineWork
     -> nested JSON list of OfflineChapter
```

On missing/empty value, it writes and returns a seed work. On valid load, it decodes all records and sorts them by `updatedAt`. Every save rewrites the full list. Editors load the full list, replace one in-memory work and rewrite it.

Weaknesses:

- `jsonDecode` or field type mismatches can throw; UI `FutureBuilder` checks only `hasData`, so an error can remain as a spinner.
- There is no envelope/schema version despite `_v1` being only in the key.
- Two overlapping read-modify-write operations can lose changes.
- Process death during platform persistence has no document-level transaction/recovery contract.
- IDs based on milliseconds can collide.
- Missing/invalid dates become `DateTime.now()`, silently changing sort/conflict semantics.
- Whole-library memory and write cost grows with all manuscript text.
- `SharedPreferences` is not confidential storage and may be backed up according to platform policy.

### Migration threshold and target

Use `SharedPreferences` only for small preferences and, temporarily, a bounded prototype notebook. Migrate to SQLite/Drift/Isar or another reviewed transactional database **before** any of these is true:

- offline data is a supported user-valuable feature rather than demo data;
- more than 100 works, 1,000 chapters, or 5 MB encoded data is supported;
- concurrent/background sync is introduced;
- per-record queries, attachments, migrations, conflict resolution or reliable recovery are required.

Migration must:

1. Read the old key without modifying it.
2. Strictly decode and validate to typed records.
3. Insert in one local DB transaction with UUIDs, schema version and constraints.
4. Verify counts/checksums.
5. Mark migration complete.
6. Keep the old blob for one successful app-version cycle or an explicit rollback window, then remove it.
7. Never seed over corrupt user data; preserve it for recovery/export and show a repair choice.

## Ownership, retention and backup

| Data | Authority | Backup/sync today | Required policy |
| --- | --- | --- | --- |
| OfflineNavigator waypoints | Local Core Data | Optional full KVS snapshot | User opt-in, bounded payload, conflict/deletion semantics. |
| Riwaya manuscripts | Local Core Data | None in app source | Explain device-loss risk; explicit export/backup choice. |
| Flutter notebook | `SharedPreferences` JSON | Platform-dependent preferences backup only | Move to transactional store; explicit export/delete/sync policy. |
| Rawaya accounts/content | PostgreSQL | Not implemented in source | Encrypted backup, PITR, retention and restore drills. |
| Rawaya media | Local filesystem | Not implemented in source | Durable shared/object store, checksum, backup and orphan reconciliation. |
| Search/audit/token logs | PostgreSQL | Same as DB | Purpose-specific retention and deletion/anonymization. |

## Measurable gates

- Every schema change has a checked-in migration and forward migration test from the previous release.
- Migration failure preserves the previous readable data; backup restore is exercised at least once per release process.
- 100% of multi-row security/content/payment writes pass fault-injection tests with either all or no intended rows.
- Core Data save failures are observable; UI never reports saved/backed-up after rollback.
- GPX import is atomic and validates size/count/ranges before commit.
- Riwaya cached word counts have 100% invariant agreement in repair/integration tests.
- No orphan media after injected failure at each upload stage.
- Flutter corrupt JSON yields recovery UI and preserves raw bytes; it does not spin or seed over data.
- Local store operations meet [performance.md](performance.md) limits.

## Change checklist

- [ ] Name the authoritative store and any derived copies/caches.
- [ ] Define schema version, migration, rollback/forward-fix and backup impact.
- [ ] Define uniqueness, relationships, deletion and conflict semantics.
- [ ] Make related writes atomic or reconcile them idempotently.
- [ ] Preserve user data on decode/migration errors.
- [ ] Update derived fields in the same transaction.
- [ ] Bound record, text, file and aggregate sizes.
- [ ] Test process interruption and dependency failure.
- [ ] Document retention/export/delete behavior.
- [ ] Verify restore, not only backup creation.

## Common mistakes

- Treating KVS or `SharedPreferences` as a document database.
- Adding Core Data attributes without a versioned model and old-store fixture.
- Swallowing save errors and then running backup or showing success.
- Seeding when a fetch failed rather than when a successful fetch returned zero.
- Updating a Chapter body without refreshing cached `wordCount`.
- Assuming Prisma calls in one service method are automatically transactional.
- Running `prisma migrate deploy` without checked-in migrations.
- Backing up PostgreSQL while ignoring filesystem media.
- Deleting an old local blob before verifying migration completeness.
