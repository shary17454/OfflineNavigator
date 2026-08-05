# Security

The most sensitive assets are precise waypoint coordinates and notes, unpublished manuscripts, account credentials/tokens, moderation permissions, private media, payment/subscription state, and personal profile/search data. This document records current controls and gaps; it is not a claim of production readiness.

See [networking.md](networking.md) for transport policy, [data-persistence.md](data-persistence.md) for storage/retention, [error-handling.md](error-handling.md) for safe disclosures, and [testing-strategy.md](testing-strategy.md) for verification.

## Trust boundaries

1. User-entered/imported files cross into OfflineNavigator and Riwaya local stores.
2. OfflineNavigator optionally copies waypoint snapshots into Apple iCloud KVS.
3. Rawaya Flutter crosses an untrusted network into Nest endpoints.
4. Nest crosses into PostgreSQL and local `.rawaya-storage`.
5. Public content, authenticated user actions, reviewer/editor actions and administrator actions have different authorization requirements.
6. Shared/exported GPX, map links and manuscript text leave app-controlled storage and become the recipient’s responsibility.

## Current controls

### OfflineNavigator

- Location permission is “when in use”; `Info.plist` provides the purpose string.
- Core Data is the authoritative local store; no network is needed for navigation math.
- Imported files use security-scoped resource access and `XMLParser`, not ad-hoc XML string matching.
- GPX export escapes XML text and writes atomically to a random temporary filename.
- iCloud backup is opt-in and keyed as `OfflineNavigator.Waypoints.v1`.

### Riwaya

- Manuscripts are local Core Data records; the app has no server authentication or upload path.
- Text export writes atomically to a temporary file.
- Model relationships cascade Chapters when a Novel is deleted.

### Rawaya

- DTOs use `class-validator`; the global `ValidationPipe` whitelists declared fields.
- Passwords and refresh tokens are Argon2-hashed before database storage.
- Access tokens expire after 15 minutes; refresh tokens after 30 days.
- Passport rejects expired access JWTs.
- Protected routes use `JwtAuthGuard`; moderation/admin routes additionally use permission metadata and `PermissionGuard`.
- Prisma parameterizes queries, reducing classic SQL injection risk.
- Media filenames are randomized rather than directly using the client filename.

## Material weaknesses

### Local apps

- Core Data stores, `SharedPreferences`, KVS snapshots and temporary exports have no app-level encryption. Platform data protection may help when configured, but the source does not explicitly set file-protection classes or verify backup policy.
- Waypoint coordinates/names/notes are copied to iCloud KVS in clear JSON payload bytes from the app’s perspective. This expands the trust boundary and can expose sensitive field locations through the user’s cloud account.
- `GPXService` accepts any finite parsable `Double`; it does not enforce latitude `[-90, 90]`, longitude `[-180, 180]`, maximum text length, point count or input byte limit.
- GPX XML parsing has no application-level resource limit. Entity/DTD behavior should be explicitly tested and disabled/rejected if reachable.
- Temporary GPX/manuscript files are not explicitly cleaned up after sharing.
- Map-link sharing sends exact coordinates to Google Maps; “Navigate” sends them to Apple Maps. UI must make that disclosure clear.
- Flutter stores complete offline manuscripts in `SharedPreferences`, which is neither encrypted secret storage nor robust document storage.

### Rawaya authentication and authorization

- Startup does not fail fast when `JWT_SECRET` or `JWT_REFRESH_SECRET` is missing/weak. `docker-compose.yml` contains known development defaults (`change-me*`) that must never reach production.
- `JwtStrategy.validate` rejects `BANNED` but currently allows `SUSPENDED`, `DELETED`, and soft-deleted users.
- Registration checks then creates in separate operations; concurrent duplicate registration can surface a raw Prisma error.
- Refresh rotation updates the same row with `replacedBy: active.id`; it does not revoke the old token in a way that clearly prevents replay. Concurrent refreshes can both succeed.
- Logout scans every active refresh-token row in the database and Argon2-verifies user input. Besides performance, this is a denial-of-service amplification path.
- No rate limiting, login throttling, account lockout, abuse controls, CSRF/cookie policy, or security headers are configured in `src/main.ts`.
- `submitPoem` does not verify ownership; any user with `content:submit` can submit an arbitrary poem ID.
- `answerQuestion` accepts `isOfficial` directly from any authenticated caller, allowing privilege escalation in content labeling.
- Generic bodies use `as any` for content enums (`reportContent`, favorites, reading-list items, media) and several inline body types bypass class-validator DTOs.
- `subscribe` marks a payment `paidAt` immediately without verifying a provider callback. This is not a safe payment implementation.

### Rawaya content and media

- `getPoem` fetches by ID and increments views without requiring `PUBLISHED`/`deletedAt: null`; unpublished or deleted content may be exposed if an ID is known.
- `listPoets` does not filter publication/deletion state.
- Media upload has no configured byte limit, MIME allowlist, content-signature check, malware scan or image/audio/video processing isolation.
- `.rawaya-storage` is exposed wholesale by `useStaticAssets`. The `MediaFile.isPrivate` field is not enforced; a guessed/leaked URL is public.
- Client file extensions are retained, while the supplied MIME value is trusted. Active content could be served under dangerous types.
- Swagger is exposed at `/api/docs` in all environments.
- Search logs retain raw queries, which may contain personal or sensitive information; no retention/redaction policy is implemented.
- Audit models exist, but most sensitive actions do not produce `AuditLog` records.

## Safe improvement plan

### OfflineNavigator and Riwaya

1. Define the data classification in UI: saved coordinates and manuscripts are private user data; sharing and iCloud backup are explicit exports.
2. Validate GPX byte size, point count, coordinate finiteness/ranges, and field lengths before Core Data insertion. Reject atomically.
3. Apply an appropriate iOS file-protection class to persistent and temporary files; verify behavior on a locked device.
4. Delete temporary exports when the share lifecycle permits and on a later cleanup pass.
5. Keep KVS opt-in, display last backup scope/date, and offer deletion. For sensitive deployments, use an end-to-end encrypted archive with a documented recovery model or disable cloud backup.
6. Do not put secrets in `@AppStorage`, Core Data, KVS or `SharedPreferences`. Use Keychain/secure storage for future credentials.

### Rawaya API

1. Validate required production configuration at startup: strong independent JWT secrets, production `DATABASE_URL`, allowed origins, public base URL, upload store, environment and observability settings.
2. Add rate limits by IP/account/route, with stricter auth, refresh, search, report and upload policies.
3. Model refresh tokens with a random selector/`jti`, hash, family ID, expiry and revocation. On replay, revoke the family. Make rotation transactional.
4. Enforce all inactive user statuses in JWT validation and refresh.
5. Create DTOs for every body/query; use enum validation, string length limits and numeric bounds. Set `forbidNonWhitelisted: true` for strict APIs after compatibility review.
6. Add object-level authorization: owner or explicit moderator permission for submit/edit/delete; never accept `isOfficial` from ordinary users.
7. Filter public reads by status and soft-deletion consistently.
8. Make payment state change only from authenticated, signature-verified, idempotent provider webhooks. Never trust a client-supplied provider/result.
9. Configure upload limits and allowlists; verify magic bytes, rename without user extension when possible, scan/process in isolation, and store outside the web root. Serve private media through authorization or short-lived signed URLs.
10. Restrict Swagger and detailed diagnostics outside development.
11. Add audit events for login anomalies, role changes, moderation, publication, media access/admin upload, payment changes and destructive operations. Do not log secrets or full sensitive bodies.

### Rawaya Flutter

1. Production base URL must be HTTPS and supplied by build-time environment, not emulator localhost.
2. Keep access/refresh tokens in platform secure storage, not `SharedPreferences`; redact Dio logs.
3. Validate response schemas before display/persistence.
4. Remove the fake success fallback from search. Security monitoring cannot distinguish outages/tampering if failures become fabricated results.
5. Store offline manuscripts in a protected transactional database; support explicit erase/export and retention controls.

## Threat-focused examples

| Attack/failure | Expected behavior |
| --- | --- |
| GPX with `lat="999"`, one million points, huge `<desc>`, non-finite number | Rejected before any waypoint is committed; generic actionable message; security event contains no file contents. |
| User replays a rotated refresh token | Entire token family is revoked and request returns 401 without revealing which check failed. |
| Authenticated user posts `{isOfficial:true}` to an answer | Field is rejected; official status can only be set by a permission-protected workflow. |
| Request for draft poem by guessed ID | Public endpoint returns 404; authorized editorial endpoint is separate and audited. |
| Upload named `photo.jpg` containing HTML/script or an oversized file | Rejected before public storage; no public URL or orphan DB row is created. |
| Request for a private `MediaFile.url` | Static server cannot bypass authorization; signed/authorized delivery is required. |
| SUSPENDED user presents unexpired JWT | 401/403 consistently on all protected routes. |
| Search text contains an email/phone number | Retention/minimization policy applies; logs and traces do not duplicate the raw query. |

## Measurable release gates

- No production startup with missing, default or too-short JWT secrets.
- 100% of protected endpoints covered by anonymous, insufficient and sufficient permission tests.
- 100% of public content-detail endpoints prove published/not-deleted filtering.
- Refresh replay and concurrent rotation tests pass; logout performs constant-order token lookup.
- Auth/search/upload rate-limit tests return 429 under configured thresholds and recover correctly.
- Maximum upload and GPX limits are tested one byte/item below, at, and above the boundary.
- Dependency and secret scanning report no unresolved critical/high issues.
- No token, password, precise coordinate, manuscript body or payment payload appears in application logs.
- Private media cannot be fetched anonymously by ID or URL.
- Production traffic is HTTPS-only; cleartext mobile/API paths fail.
- Data deletion/export tests satisfy the policy in [data-persistence.md](data-persistence.md).

## Security review checklist

- [ ] Identify assets and trust-boundary changes.
- [ ] Validate type, size, count, range and authorization server-side.
- [ ] Check object ownership, not only route-level roles.
- [ ] Use atomic transactions for security state changes.
- [ ] Keep secrets out of source, images, logs and client storage.
- [ ] Verify inactive/deleted user behavior.
- [ ] Review public/static routes for accidental bypass.
- [ ] Add abuse limits before exposing expensive hash/search/upload work.
- [ ] Make error text useful without exposing internals.
- [ ] Add negative and replay/concurrency tests.

## Common mistakes

- Calling data “offline” and assuming it is encrypted.
- Treating iCloud KVS as a private backup vault or an unlimited database.
- Checking a GPX extension while trusting its contents.
- Equating JWT authentication with object-level authorization.
- Hashing refresh tokens but then scanning all hashes on attacker-controlled requests.
- Trusting MIME type, filename extension, `contentType`, `isOfficial`, payment status or user ID from a client.
- Exposing a static asset directory while expecting a database `isPrivate` flag to protect files.
- Returning framework/database errors directly to clients.
- Adding CORS permissively to fix development connectivity; CORS is not authentication and `*` is not a production origin policy.
