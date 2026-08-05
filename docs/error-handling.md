# Error handling

Errors must preserve user data, identify whether retry is safe, and expose enough context to operate the system without leaking sensitive details. Current behavior is inconsistent across products; the target policy below is the standard for future changes.

See [networking.md](networking.md) for HTTP/retry behavior, [data-persistence.md](data-persistence.md) for transactional recovery, [security.md](security.md) for disclosure rules, and [testing-strategy.md](testing-strategy.md) for fault injection.

## Error classes

| Class | Examples | User action | Retry |
| --- | --- | --- | --- |
| Validation | invalid GPX coordinate, empty title, invalid enum | Correct input/file | No, until corrected |
| Permission/authentication | location denied, 401, 403, iCloud signed out | Enable permission/sign in/request access | Only after state changes |
| Conflict | duplicate email/slug, stale edit, duplicate list item | Resolve/refresh | Not blindly |
| Not found | deleted waypoint/content/chapter | Return to list/refresh | Usually no |
| Connectivity/transient | timeout, DNS, DB temporarily unavailable | Retry later; keep local data | Yes for safe/idempotent action |
| Capacity/resource | KVS quota, GPX/upload too large, disk full | Reduce/free space/change storage | Not unchanged |
| Corruption/migration | malformed GPX, corrupt local JSON/store | Preserve original; repair/export/reset choice | Only after recovery |
| Internal defect | invariant failure, unexpected exception | Safe generic message + correlation ID | At most once if operation is safe |

Framework-localized strings are not stable domain errors. Map underlying failures to typed app codes, then localize at the UI boundary.

## Current behavior

### OfflineNavigator

- Core Data store-load failure calls `fatalError` in `PersistenceController`.
- Direct waypoint save catches the error, rolls back, and displays `error.localizedDescription`.
- `PersistenceController.save()` silently rolls back; deletion can appear successful and trigger iCloud backup even if local save failed.
- GPX import catches file access/read/XML/Core Data errors in one block and displays the raw localized description. Successful import reports only parsed count.
- Auto-backup ignores every error with `try?`.
- Manual KVS actions use useful `ICloudBackupError.unavailable`/`.noBackup`, but encode/quota/save errors are not domain-mapped.
- `LocationMotionManager` stores `didFailWithError.localizedDescription`, but `ContentView` does not show `locationError`.
- Opening Apple Maps ignores the asynchronous success/failure callback.

### Riwaya

- Store-load failure calls `fatalError`.
- `PersistenceController.save()` silently rolls back.
- Autosave, favorite changes, deletes and reader progress call that helper, so UI has no reliable failed-save state. “حفظ تلقائي” is a static label, not confirmation.
- Seed fetch/count errors are converted to zero.
- Text export throws to callers, but broader save/export UI behavior should consistently preserve errors and retry state.

### Rawaya API

- Nest automatically formats validation/auth/forbidden exceptions.
- Several services throw `BadRequestException` for missing records where 404 is the correct semantic.
- `getPoem` catches **all** Prisma errors and rewrites them as “poem not found,” hiding database outages and constraint failures as client errors.
- Prisma uniqueness/FK errors are mostly unhandled and may become generic 500 responses.
- Some lookups return `null` with 200 (for example question details/media by ID).
- `PaymentsService.subscribe` returns `{ok:false}` with HTTP 200 for missing plans, while other domain failures throw.
- Multi-write partial failures have no compensation/transaction boundary in several flows.
- `bootstrap()` is invoked without a top-level rejection handler or structured startup logging.

### Rawaya Flutter

- Search catches every exception and displays a fabricated demo result. It cannot distinguish no connection, timeout, server validation, auth, not found, rate limiting or malformed data.
- Search does not guard `setState` before the success assignment; a disposed page can still mutate `_results` before `finally` checks `mounted`.
- Offline JSON decode/type errors escape `loadWorks`.
- `FutureBuilder` only tests `hasData`; when `snapshot.hasError`, it continues to show a progress indicator indefinitely.
- Save methods do not catch storage failure, preserve a dirty marker, or show retry. Chapter save shows “saved locally” only after awaited success, which is better, but uncaught failure gives no domain UI.

## Target local-app pattern

### Typed service errors

Define product-specific error types with stable cases, for example:

```text
GPXImportError
  fileUnavailable
  exceedsByteLimit(max)
  malformed
  invalidCoordinate(index)
  exceedsPointLimit(max)
  persistenceFailed(recoveryID)

PersistenceError
  storeUnavailable
  migrationFailed(recoveryURL)
  saveFailed(isRetryable)
  diskFull
```

Do not expose file paths, raw XML, store internals or user text in the localized message. Preserve the underlying error for private, redacted diagnostics.

### Atomic UI state

Use explicit states rather than a single alert string:

```text
idle -> validating -> saving -> saved
                         \-> failed(error, retryAction, dirtyData)
```

- Disable duplicate submissions while saving.
- Keep editor text/selected file after failure.
- Report saved only after durable local commit.
- Run optional backup **after** local commit; backup failure must not undo or mislabel the local save.
- Separate “saved locally, iCloud backup failed” from “save failed.”
- On store migration/load failure, present recovery/export/reset choices if possible instead of crashing. Never automatically delete a failed store.

### Product examples

OfflineNavigator GPX:

1. Security-scope/read fails → “The selected file could not be read”; no context mutation.
2. Validation fails at point 7 → “Waypoint 7 has an invalid latitude”; no insertion.
3. Core Data save fails → roll back entire import and report retry/storage action.
4. Import commits → show inserted/skipped counts; optional KVS failure is a separate warning.

Riwaya autosave:

1. Keep a dirty revision in memory while debounce runs.
2. Saving indicator changes to confirmed timestamp only after context save.
3. Failure leaves dirty content visible and offers retry/export; navigation away asks before losing unsaved data.

Flutter offline store:

1. Missing key may seed demo content.
2. Corrupt existing key must be copied/preserved and shown as a recoverable data error.
3. Storage write failure keeps current editing controllers dirty and must not show a success snackbar.

## Target API contract

Use HTTP status plus a stable body:

```json
{
  "error": {
    "code": "CONTENT_NOT_FOUND",
    "message": "المحتوى غير موجود",
    "requestId": "01...",
    "details": []
  }
}
```

`message` is safe/localized display text; clients branch on `code`, never parse the message. `details` contains bounded field errors only for validation.

### Status mapping

| Status | Use |
| --- | --- |
| 400 | Malformed syntax/request that is not a field validation case |
| 401 | Missing/invalid/expired authentication |
| 403 | Authenticated but insufficient permission/object access |
| 404 | Resource absent or intentionally concealed |
| 409 | Unique conflict, stale version, duplicate membership, token replay |
| 413 | Upload/request too large |
| 415 | Unsupported media type |
| 422 | Valid syntax but invalid fields/domain transition |
| 429 | Rate limited, with `Retry-After` |
| 500 | Unexpected internal failure |
| 503 | Required dependency unavailable/overloaded |

Map known Prisma error codes centrally without leaking query/schema details. Do not catch a broad error and relabel PostgreSQL unavailability as 404/400.

### Transactions and uncertain outcomes

- If register/moderate/upload/subscribe fails mid-flow, transaction/reconciliation rules in [data-persistence.md](data-persistence.md) apply.
- If the client times out after the server may have committed, the client must query by idempotency key/status rather than blindly repeat.
- Analytics/view-count failure should not fail a successful content read once decoupled.
- Include `requestId` in response and logs, but never secrets or full sensitive payloads.

## Target Flutter mapping

One repository/client layer maps Dio failures:

| Input | App error/UI |
| --- | --- |
| connect/DNS/TLS | `offlineOrUnreachable`, retry action |
| receive timeout | `timedOut`, retry safe query |
| 401 | coordinated refresh once, then `sessionExpired` |
| 403 | `notAllowed`, no refresh |
| 404 | `notFound`, return/refresh |
| 409/422 | field/domain message, preserve input |
| 429 | `rateLimited(retryAfter)` |
| 5xx | `serviceUnavailable(requestId)` |
| decode/schema mismatch | `invalidServerResponse(requestId)` and telemetry |
| cancellation | silent if superseded/navigation; not an error banner |

Search should show loading/empty/results/error states. Preserve the last confirmed result only if clearly labeled; never synthesize content on error.

## Diagnostics and observability

Record:

- product/version/build, operation/route template, stable error code;
- timestamp, duration, retry count and correlation ID;
- safe OS/network category and database error class;
- counts/sizes in coarse bounded form where useful.

Do not record:

- JWTs/refresh tokens/passwords;
- exact coordinates or waypoint notes by default;
- manuscript/chapter/media bodies;
- full search strings, emails, phone numbers, filesystem paths or provider payloads.

Crash reporting is appropriate for programmer invariants, not expected invalid input/offline states. User-facing messages need Arabic/English localization and accessibility announcements where applicable.

## Measurable gates

- No expected user/input/network/storage condition calls `fatalError` or terminates the app.
- 100% of local writes report success only after commit; injected save failure preserves dirty/user data.
- GPX and Flutter decode corruption produce recovery UI and no partial/overwriting writes.
- 100% of API error responses follow the stable envelope and include a request ID.
- Known not-found/conflict/validation/dependency cases map to 404/409/422/503 respectively.
- No broad catch converts database/service outages into client 4xx.
- Latest-search cancellation is silent; outages produce explicit errors, never fake results.
- Logs pass automated secret/PII redaction tests.
- Retry tests prove bounded attempts and no duplicate non-idempotent writes.

## Review checklist

- [ ] Is the error expected, transient, user-correctable, conflict, corruption or defect?
- [ ] Is user data retained and is partial state rolled back/reconciled?
- [ ] Is retry safe and bounded?
- [ ] Does UI distinguish local save from cloud/network follow-up?
- [ ] Is the error typed with a stable code?
- [ ] Is HTTP status semantically correct?
- [ ] Is underlying diagnostic context retained privately and redacted?
- [ ] Are cancellation and stale responses handled separately?
- [ ] Are loading, empty and error states all reachable and tested?
- [ ] Was a failure injected at every external boundary?

## Common mistakes

- Swallowing a Core Data error and continuing with backup/success UI.
- Displaying `localizedDescription` or Prisma internals directly.
- Crashing because the persistent store cannot load, which prevents recovery/export.
- Treating malformed input, missing content and dependency outage as the same “bad request.”
- Returning HTTP 200 with `{ok:false}` while other endpoints use status errors.
- Catching every Dio error and inventing a demo result.
- Retrying a write after an uncertain timeout without an idempotency key.
- Showing a spinner forever because `snapshot.hasError` was not handled.
- Logging the payload that caused the error and leaking coordinates, manuscripts or credentials.
