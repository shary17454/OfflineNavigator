# Networking

The repository has two deliberately offline-first native apps and one client/server platform:

- OfflineNavigator navigation works without HTTP, but Apple map tiles, iCloud KVS and external map links can use networks.
- Riwaya has no network client in current source.
- Rawaya Flutter calls the Nest API through Dio; Nest serves JSON under `/api` and static files under `/assets`.

Persistence/fallback rules are in [data-persistence.md](data-persistence.md), error semantics in [error-handling.md](error-handling.md), transport threats in [security.md](security.md), and latency budgets in [performance.md](performance.md).

## Current behavior

### OfflineNavigator

- Distance and bearing are local calculations in `NavigationMath`; GPS and compass sensors do not require an application HTTP request.
- `WaypointMapView` uses MapKit. Tiles and map detail depend on system cache/connectivity, but `OfflineGridMapView`, saved coordinates and guidance remain available.
- `Waypoint.googleMapsURL` creates `https://www.google.com/maps/search/?api=1&query=lat,lon` for sharing.
- `Waypoint.appleMapsURL` creates `https://maps.apple.com/?ll=lat,lon&q=name` and `UIApplication.open` hands navigation to the system.
- `ICloudBackupService` uses `NSUbiquitousKeyValueStore`; synchronization, conflicts, quota and reachability are managed by Apple and are not equivalent to an acknowledged synchronous upload.

Why: the product’s core field-navigation path must not depend on a server. Network-enhanced maps/sharing/backup are optional.

### Riwaya

There is no `URLSession`, API client, CloudKit or other sync layer in `Riwaya/`. Core Data and text export are local. Reader settings use `@AppStorage`.

Why: Riwaya is an offline companion. Do not document cross-device/server synchronization as existing behavior.

### Rawaya API

- `src/main.ts` listens on `PORT` or 4000, prefixes controllers with `/api`, exposes Swagger at `/api/docs`, and exposes `.rawaya-storage` at `/assets`.
- There is no health/readiness controller, CORS policy, compression, request timeout, body-size policy, rate limit or graceful shutdown configuration visible in current source.
- `PrismaService` connects on module initialization and disconnects on module destruction.
- Public list/search routes require no token. Authenticated routes use Bearer JWTs.
- The API returns Prisma-shaped JSON directly rather than versioned transport DTOs in many paths.

### Rawaya Flutter

- `ApiClient` reads `API_BASE_URL` from the build environment, requires a valid HTTPS URL, and configures 10-second connect and 12-second receive timeouts.
- Only `get` is wrapped; there is no shared provider, auth interceptor, refresh flow, retry policy, send timeout, cancellation, structured decoding or error mapping.
- The current App Store-facing `HomePage`, local notebook, and `SearchPage` do not call the API. Search reads `OfflineLibraryStore` and never fabricates a network result.
- Future connected features must inject one `ApiClient`, pass dynamic values via Dio `queryParameters`, and implement explicit error states.

## Endpoint and URL contract

Keep URL construction explicit:

| Surface | Development example | Production requirement |
| --- | --- | --- |
| Flutter API | `--dart-define=API_BASE_URL=https://dev.example/api` | `https://<api-host>/api`, injected at build time; non-HTTPS or missing values are rejected when the client is constructed. |
| Nest Swagger | `http://localhost:4000/api/docs` | Disabled or access-restricted unless intentionally public. |
| Media URL | `/assets/media/<random-name>` | Absolute URL derived from trusted public-base configuration or CDN; private media must not use public static URLs. |
| Apple/Google map link | HTTPS external URL with exact coordinate | User-initiated only, with clear privacy implications. |

Do not restore `10.0.2.2` or any cleartext default. Local-only release paths must remain independent of network configuration.

## Client policy

Create one injected Dio client per app scope:

- Configure environment-specific HTTPS base URL and reject missing production configuration.
- Use `queryParameters: {'query': value}`.
- Set connect, send and receive timeouts per operation. Upload/download timeouts may differ from search.
- Add request IDs and safe metrics; never log Authorization headers, refresh tokens, private manuscript bodies or full search queries.
- Attach the access token from secure storage.
- On one 401 caused by expiry, coordinate a **single-flight** refresh, persist rotated tokens atomically, and retry only eligible requests once.
- Never refresh on 403, validation 400, or repeated 401.
- Debounce search (for example, 250–400 ms if search-on-type is added) and cancel the prior request when query changes.
- Treat GET retry as safe only for transient transport/502/503/504 failures, with capped exponential backoff and jitter. Do not blindly retry writes.
- Assign idempotency keys to retriable creation/payment/upload-finalization operations when the server supports them.
- Validate response DTOs and handle missing/unknown fields.

Offline UX:

- Search: preserve prior valid results if appropriate, show “offline/unavailable” with retry, and never show fabricated results.
- Offline notebook: operate entirely from local storage; future sync must queue explicit operations rather than blocking edits.
- Media: show unavailable/download state; do not claim offline availability unless bytes and metadata are persisted and verified.

## Server policy

### Request lifecycle

1. Reverse proxy terminates TLS and applies connection/header/body limits.
2. Nest assigns/accepts a validated correlation ID.
3. Rate limiting and authentication run before expensive database/hash/media work.
4. `ValidationPipe` validates DTOs with whitelist and bounded values.
5. Service runs transactional database work.
6. Response maps to a stable DTO/error envelope.
7. Logs/metrics record route template, status, latency and safe identifiers.

Add:

- Liveness endpoint that proves the process/event loop is available.
- Readiness endpoint that checks required dependencies with a short timeout; do not expose credentials or detailed topology.
- Graceful shutdown hooks and load-balancer draining before Prisma disconnect.
- Explicit JSON/form/multipart size limits.
- Trusted-proxy configuration only for known proxies.
- An allowlist CORS policy for actual browser frontends. Flutter native is not governed by browser CORS.
- Compression only for appropriate content; avoid wasting CPU on already compressed media.

### API evolution

- Keep `/api` stable or introduce explicit `/api/v1` before incompatible changes.
- Return transport DTOs, not unrestricted Prisma models. List DTOs should omit full bodies and internal fields.
- Use stable error codes and pagination metadata.
- Prefer cursor pagination using `(createdAt,id)` or another unique stable order.
- Build absolute media URLs from trusted server configuration, never the request’s untrusted Host header.

### Timeouts and dependency failures

- Put a total request deadline around DB and service work.
- A PostgreSQL outage should make readiness fail and requests return a sanitized 503, not hang until infrastructure timeouts.
- Do not retry arbitrary Prisma writes inside the same request unless the failure is known transient and the operation is idempotent.
- Search analytics/view counters should not make content unavailable; decouple them with a bounded async mechanism as described in [performance.md](performance.md).

## iCloud KVS semantics

`store.synchronize()` does not provide a durable “server accepted this backup” guarantee. Current `backup` sets the local value/date and reports completion without observing remote propagation. Current restore is merge-by-ID: existing IDs win, and missing IDs are inserted.

Safe rules:

- Describe the feature as optional KVS synchronization/backup of a bounded snapshot, not guaranteed real-time backup.
- Subscribe to `NSUbiquitousKeyValueStore.didChangeExternallyNotification` for external updates and reason codes if cross-device behavior is required.
- Version payloads and define conflict behavior. Last writer wins for one full snapshot can lose changes from another device.
- Enforce payload limits before `set`.
- Keep navigation operational when identity, quota or network is unavailable.
- Never delete local Core Data merely because KVS is empty or temporarily unavailable.

## Failure matrix

| Failure | OfflineNavigator/Riwaya | Rawaya Flutter/API |
| --- | --- | --- |
| No network | Navigation, GPX, Core Data and Riwaya editing continue; MapKit/KVS/external links may not. | Local notebook continues; API views show explicit offline state. |
| DNS/TLS failure | External map/iCloud action reports failure if observable; local records remain. | Dio maps to a retryable connectivity error; no fake data. |
| Timeout | No local mutation is rolled back unless it depended on that network action. | Client may retry safe GET once; server uses 504/503 semantics where appropriate. |
| 401 | Not applicable to current native apps. | Single coordinated refresh then retry once; failure signs out/reauthenticates without deleting offline drafts. |
| 403 | Not applicable. | Show insufficient permission; never refresh-loop. |
| 409 | Local import conflict follows documented atomic policy. | Surface domain conflict; preserve user input. |
| 429 | Avoid repeated manual KVS attempts. | Honor `Retry-After`, back off, keep UI responsive. |
| 5xx/DB outage | Local functionality continues. | Sanitized service-unavailable UI; readiness fails; no fabricated results. |
| Response arrives out of order | N/A for current local operations. | Cancel/tag searches; only latest query may update state. |

## Measurable gates

- Production Flutter build contains no cleartext API base URL and no `10.0.2.2`.
- 100% of dynamic query values are passed through structured query parameters.
- No more than one active search request and one active token refresh per client.
- GET retries are capped (maximum two retries after the original) with jitter; writes have explicit idempotency before retry.
- Client timeout tests complete within configured bounds plus 1 second scheduling tolerance.
- API readiness changes to unhealthy within 5 seconds of required DB unavailability and recovers without restart.
- Graceful shutdown serves no new traffic after drain starts and completes in-flight requests within the configured deadline.
- p95/p99 route budgets meet [performance.md](performance.md).
- Offline device tests prove navigation/editing/local notebook paths with network disabled.
- KVS failure never deletes or blocks access to local waypoints.

## Checklist

- [ ] Is the feature truly local, network-enhanced, or network-required?
- [ ] Is base URL/environment behavior correct for emulator, simulator, device and production?
- [ ] Are all user values encoded as parameters/body fields?
- [ ] Are request, response and upload sizes bounded?
- [ ] Are timeout, cancellation, retry and idempotency explicit?
- [ ] Can stale responses overwrite newer state?
- [ ] Are 401, 403, 409, 422, 429 and 5xx distinct?
- [ ] Are tokens and sensitive fields redacted?
- [ ] Are health, readiness and graceful shutdown covered?
- [ ] Does offline behavior preserve user-created data?

## Common mistakes

- Calling Core Location “networking”; sensor location can work without the app making HTTP requests, while assisted GPS conditions still vary.
- Assuming MapKit tiles are guaranteed offline because coordinates are stored locally.
- Treating `NSUbiquitousKeyValueStore.synchronize()` as synchronous cloud durability.
- Shipping the Android-emulator URL to iOS or production.
- Concatenating a raw Arabic/user query into a URL.
- Retrying POST/payment/upload requests without idempotency.
- Refreshing on every 401 concurrently or refreshing a 403.
- Enabling `Access-Control-Allow-Origin: *` as a substitute for authentication.
- Exposing relative media URLs without defining API/CDN origin and privacy.
- Converting transport failures into fake success data.
