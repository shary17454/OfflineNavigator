# Rawaya heritage platform

This page covers only [`../rawayah/`](../rawayah/), the “رواية التراث” platform. It is not the native Mawrooth app in `Riwaya/`. See [`architecture.md`](architecture.md) for repository boundaries and [`../rawayah/docs/`](../rawayah/docs/) for existing domain-specific design notes.

## Implemented stack

| Layer | Code and configuration | Current state |
| --- | --- | --- |
| API | NestJS 10, Prisma 5, PostgreSQL; `apps/api/src` | Modules for auth, users, roles, content, search suggestions, media, reading lists, and payments |
| Public web | Next.js Pages Router; `apps/web/src/pages` | Thin client-rendered pages using `fetch`; no checked-in tests |
| Admin | Next.js Pages Router; `apps/admin/src/pages` | Login/users/content/log pages; access token kept in `localStorage`; no checked-in tests |
| Mobile | Flutter, Dio, go_router, Riverpod; `apps/mobile/lib` | Home/search/auth and local notebook; most declared routes render `PlaceholderPage` |
| Database | `apps/api/prisma/schema.prisma` and `seed.ts` | Large PostgreSQL schema covering content, RBAC, moderation, social features, subscriptions, and logs؛ لا توجد migrations محفوظة في المستودع |
| Media | `StorageService` + Nest static assets | Local filesystem `.rawaya-storage`; no cloud/object-store implementation |
| Local mobile data | `SharedPreferences` | Entire offline notebook encoded at `rawaya_offline_works_v1` |
| Redis | Docker Compose only | Container and `REDIS_URL` exist, but checked-in application code does not use Redis |
| Workspace packages | `packages/config`, `types`, `ui`, `utils` | Placeholder package scripts; no usable shared contract/UI layer |

## API request path

`main.ts` sets the global `/api` prefix, enables a transforming/whitelisting `ValidationPipe`, serves `.rawaya-storage` at `/assets`, publishes Swagger at `/api/docs`, and listens on port 4000 by default.

For a protected moderation request:

```text
POST /api/poems/:id/review
  → JwtAuthGuard / JwtStrategy
  → PermissionGuard checks content:review from UserRole → RolePermission
  → ReviewDto validation
  → ContentService.moderatePoem()
  → Poem update + ContentRevision + ModerationLog
  → PostgreSQL through PrismaService
```

Public reads such as `GET /api/poems` filter to `PUBLISHED` and non-deleted poems. `GET /api/poems/:id` increments `viewCount`, but it does not explicitly constrain status or `deletedAt`; callers can potentially fetch any known poem ID. This is a current behavior, not a recommended policy.

## Data model

The Prisma schema is broader than the current user interfaces. Major groups include:

- identity/RBAC: `User`, `Profile`, `Role`, `Permission`, `UserRole`, `RolePermission`, `RefreshToken`;
- core heritage: `Poet`, `Poem`, `Story`, `Book`, `HistoricalEvent`, `Tribe`, `Place`, `Proverb`, `VocabularyTerm`;
- animals/hunting: `Horse`, `Camel`, `Falcon`, breed/article models;
- provenance/moderation: `Source`, `ContentSource`, `ContentRevision`, `ModerationLog`, `AuditLog`, reports;
- engagement: comments, favorites, follows, ratings, questions/answers, reading lists;
- commerce: `Plan`, `Subscription`, `Payment`;
- media: `MediaFile`, `AudioTrack`, `Video`.

Several polymorphic links use `contentType + contentId` without a database foreign key to the target record (`ContentTag`, `ContentSource`, `Favorite`, `ReadingListItem`, and others). Services must validate target existence and type; referential integrity cannot do it automatically.

### Schema change standard

- [ ] Add a named Prisma migration; never use an untracked production `db push`.
- [ ] State backfill behavior for required columns.
- [ ] Test the previous schema fixture upgrading to the new schema.
- [ ] Preserve enum compatibility or provide a data migration.
- [ ] Verify every polymorphic writer rejects unknown `contentType` and missing target IDs.
- [ ] Update API DTOs and clients in the same change when the wire shape changes.

## Authentication and authorization

`AuthService` hashes passwords and refresh tokens with Argon2. Access tokens last 15 minutes; refresh tokens last 30 days. `JwtStrategy` rejects missing users and `BANNED` users.

Current risks:

1. `JwtStrategy` only rejects `BANNED`; `SUSPENDED` and `DELETED` users pass validation.
2. `register()` throws `UnauthorizedException` for duplicate email rather than a conflict-class response.
3. Refresh rotation updates the same database row and sets `replacedBy` to its own ID. That field therefore does not identify a replacement token record.
4. `logout()` loads every non-revoked refresh token, then Argon2-verifies sequentially until one matches. Runtime grows with all users’ active sessions.
5. `answerQuestion()` trusts the caller-provided `isOfficial`; it has authentication but no permission guard, so any signed-in user can request an official/preferred answer.
6. Several DTOs and inline request bodies accept `string` then cast to Prisma enums with `as any`.
7. The admin browser persists its access token in `localStorage`, increasing impact from any XSS flaw.
8. Docker development secrets are literal `change-me` values and must never be copied into production.

### Proposed auth acceptance criteria

- User status policy is explicit and tested for all four `UserStatus` values.
- Refresh rotation creates/revokes records transactionally and replay of an old token fails.
- Logout finds only a bounded candidate set; no request scans all users’ tokens.
- “Official answer” requires a named permission and an integration test proving an ordinary user receives 403.
- Startup fails fast when JWT secrets are absent, default-like, equal, or too short outside tests.
- API integration tests run against a disposable PostgreSQL database and assert 401 vs 403 behavior.

## Content and moderation

The implemented poem workflow is:

```text
DRAFT → SUBMITTED → VERIFIED → PUBLISHED
                   ↘ NEEDS_REVISION / REJECTED
```

`moderatePoem()` writes a revision record and moderation log; `publishPoem()` allows both `VERIFIED` and `SUBMITTED` input. That means publication can bypass the verification state. Decide whether that is an editor override or a bug and encode the decision in a test and audit metadata.

Other inconsistencies:

- `listPoets()` returns all statuses, while poem/story/book/horse lists filter to `PUBLISHED`.
- `listBooks()` and `listHorses()` do not filter `deletedAt`; `listStories()` and `listPoems()` do.
- Search normalizes only Arabic alef variants and then searches normalized input against unnormalized database text. `SearchService.normalize()` implements more substitutions but is not used by `ContentService.search()`.
- Search DTO fields `section`, `poet`, `region`, `era`, and `sort` are accepted but ignored.
- `take: 50` or `take: 20` limits results without cursor/page metadata.

### Content endpoint checklist

- [ ] Public read filters status and soft deletion consistently.
- [ ] Detail endpoints apply the same visibility policy as list endpoints.
- [ ] Mutations verify ownership or a named permission.
- [ ] State transitions reject invalid source states.
- [ ] Multi-write moderation operations use `prisma.$transaction`.
- [ ] Lists use bounded cursor pagination and return a continuation cursor.
- [ ] Search behavior has Arabic normalization fixtures and documents ranking.
- [ ] Every accepted query field changes behavior or is removed.

## Media and payments

`StorageService.save()` writes the uploaded buffer directly under `.rawaya-storage/<folder>/<uuid><original-extension>`. The returned URL is local. Before production use, add MIME signature validation, maximum sizes, safe image/media processing, private-object authorization, malware handling, retention/deletion, and an object-store adapter.

`PaymentsService.subscribe()` immediately creates an active subscription and a payment marked `created` with `paidAt` set, without calling or verifying a payment provider. It is a data-flow stub, not payment processing. Production acceptance requires signed provider webhooks, idempotency keys, amount/currency verification, pending/paid/failed/refunded states, and transactional activation only after verified payment.

## Web and admin clients

The public site defines local payload types (`HomePayload`) but also uses `any[]` for poems. Errors commonly collapse to empty arrays or fallback text, making “no data” indistinguishable from outage.

The admin content page duplicates its own API base URL and raw `fetch` calls despite `apps/admin/src/lib/http.ts`. It does not inspect failed moderation responses before reloading. Improvements should:

- use one typed client per app;
- distinguish loading, empty, unauthorized, forbidden, and unavailable states;
- encode API errors in a stable response shape;
- replace `any` with generated or shared types once `packages/types` becomes real;
- add page tests for expired tokens and failed actions;
- use an authentication design that does not rely on long-lived browser `localStorage` tokens.

## Flutter mobile

`RawayaRoutes.list` contains 30 paths, but only `/home`, `/search`, `/auth`, and the nested `/offline` flow have dedicated pages. All other listed routes are generated as `PlaceholderPage`.

`ApiClient` only exposes GET and defaults to Android emulator loopback (`http://10.0.2.2:4000/api`). It has no environment selection, auth interceptor, refresh handling, structured error mapping, or TLS enforcement.

The offline notebook:

- uses mutable `OfflineWork`/`OfflineChapter` objects;
- reads and rewrites the complete JSON array for every save;
- seeds demo data when the key is absent;
- has no schema version inside the payload, migration, corruption recovery, conflict handling, export, or backup;
- uses millisecond timestamps as IDs;
- saves chapter edits only when the user taps save; navigating away can lose edits.

Before expanding notebook content, move to an indexed local database and define a versioned repository API. Acceptance should include 1,000 works/10,000 chapters, forced termination during a write, malformed legacy payload recovery, stable UUID IDs, and an explicit unsaved-change policy.

## Tests: actual baseline and target

The five API Jest files are scaffolding: three assert hard-coded arrays/strings، واثنان يهيئان Nest دون assertions ذات معنى على HTTP behavior. لا تختبر `AuthService` أو controllers أو guards أو Prisma فعليًا. Web/admin بلا test files وتستخدم scripts خيار `--passWithNoTests`. Flutter لديه splash widget test واحد.

Minimum target for a production-facing endpoint:

- one success integration test;
- validation test for every constrained field class;
- unauthenticated and unauthorized tests where applicable;
- not-found/invalid-transition test;
- database side-effect assertions, including audit/moderation records;
- client rendering test for success, empty, and error states.

Coverage percentage alone is not a sufficient gate. A measurable initial gate is: every changed service/controller branch has a behavioral test, and no changed workspace reports zero tests.

## Mistakes to avoid

- Do not describe Redis, shared packages, payments, or most mobile routes as implemented production features.
- Do not use `as any` to bypass Prisma enum or DTO mismatches.
- Do not return unpublished/soft-deleted records from public detail endpoints.
- Do not add a second normalization algorithm.
- Do not store new authentication tokens in Flutter `SharedPreferences`.
- Do not expose private media through the current static `/assets` path.
- Do not modify Apple/Xcode Cloud release settings from platform feature work; use [`RAWAYA_XCODE_CLOUD.md`](RAWAYA_XCODE_CLOUD.md).
