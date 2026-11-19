# JWT security audit

Date: 2026-11-19 (Asia/Calcutta). Scope: existing bearer-token authentication and its production configuration. Existing worktree changes were inspected before editing and preserved. This audit supersedes authentication recommendations in the historical release reports; those reports remain evidence of prior work.

## Before this execution

The working tree already signed and verified HS256 tokens, issued one-day access tokens (the older seven-day lifetime was already gone), validated role names, and fetched the current MongoDB user/role on every authenticated request. Invalid credentials already returned a generic 401. Registration used bcrypt cost 12 and rejected passwords above 72 UTF-8 bytes; legacy login allowed up to 100 characters. Browser tokens lived in localStorage. Production secrets had a 32-character length check. Tokens did not require valid ObjectIds or issued-at/expiration claims, production scope was not validated, accounts had no disabling field, authentication had no application rate limit, and the browser did not invalidate sessions consistently after expiry/401.

## Changes and rationale

| Protection | Result |
| --- | --- |
| Signing and verification | Explicit HS256 only. Production requires the configured issuer and audience. Wrong scope, malformed compact tokens, signatures, expiry and algorithm failures return safe 401 responses. No internal JWT errors are returned. |
| Claims | `userId` must be a 24-hex MongoDB ObjectId; `role` must be an existing role. Positive integer `exp` and integer `iat` are mandatory. Reject future issued-at beyond 30 seconds, expiration before issuance and excessive lifetime. Verification also uses `maxAge`. Tokens contain only `userId`, `role`, `iat`, `exp`, `iss`, `aud`. |
| Current authorization | Every request loads `_id role isActive` from MongoDB. Authorization uses that role, regardless of the token's role. Missing users, invalid persisted roles and `isActive:false` fail closed. Database failures do not grant access. |
| Account compatibility | `isActive` defaults to true; existing documents with no field remain active. `isVerified:false` retains its existing meaning and does not disable users. No role definitions or management endpoints were added. An authorized database operator can disable an account by setting `isActive:false`; this task made no database changes. |
| Lifetime | Production defaults to eight hours and accepts configured lifetimes of 300–28800 seconds. Development defaults to the existing one day and accepts 300–86400 seconds. No refresh token system was introduced. An eight-hour working session and sign-in again after expiry form a complete, simple design. |
| Production secret | At least 32 UTF-8 bytes, diverse characters and no common template/test markers. This rejects obvious weak secrets; it cannot prove entropy. Generate random material as described below. No existing secret was read, printed, replaced or rotated. |
| Throttling | Login: 20 attempts/IP/15 minutes; registration: 10/IP/15 minutes, including malformed bodies. IPv6 addresses are grouped by /64. The store holds at most 10000 clients and fails closed at capacity. Responses use 429, retry time and rate-limit headers. The supplied Nginx configuration provides an independent perimeter limit. |
| Trusted proxy | Only `TRUST_PROXY=false` or `loopback` is accepted. Production binds to loopback. Nginx overwrites `X-Forwarded-For` with the actual remote address; the backend port must not be public. This combination prevents bypass by forged forwarding headers. |
| Passwords | New registration requires at least 12 characters and at most 72 UTF-8 bytes. Existing bcrypt hashes and legacy login input remain compatible. Registration cannot set role or activation state. Missing-account logins perform a bcrypt comparison too; disabled accounts use the generic credential error. |
| Logging | Authentication/startup/global/media/solution/AI errors record operation and error class, without raw documents/messages/stacks. Access logs omit query strings, bodies and authorization headers. API responses have `Cache-Control: no-store`. |
| Browser sessions | Retain localStorage for existing reload persistence. Expiry checks are UI checks only; the API remains the authority. Logout clears storage/context; other tabs synchronize via storage events. Expiry timers and 401 invalidate sessions. An old in-flight 401 cannot clear a later login. Transient restoration failures retain the token and show Retry. All JSON requests have bounded deadlines and safe network/proxy error messages. |

## Production settings

Set `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_ACCESS_TOKEN_TTL_SECONDS=28800`, `NODE_ENV=production`, `HOST=127.0.0.1`, `TRUST_PROXY=loopback` and an explicit HTTPS `CORS_ORIGIN`. Keep issuer/audience values stable across releases.

Generate a **new deployment secret only when required**, on a trusted machine. This command writes to a private file and prints no secret:

```sh
umask 077
node -e "require('fs').writeFileSync('jwt-secret.private', require('crypto').randomBytes(48).toString('base64url'), { mode: 0o600, flag: 'wx' })"
```

Transfer the value through your approved secret manager into the production environment. Never commit the file, paste it into logs or overwrite an existing JWT secret automatically. Do not use the placeholder in `.env.example`. Production now rejects legacy tokens without issuer/audience or with lifetimes above the configured maximum: users must sign in once after the first hardened production release. Development accepts previously issued scoped or unscoped HS256 tokens with valid claims and the permitted lifetime.

## Regression evidence

The focused authentication run passed 6 suites / 53 tests. It covers invalid, expired, tampered, unsigned and unsupported-algorithm tokens; missing authorization/claims; invalid identifiers/roles; future/overlong tokens; production issuer/audience; legitimate access; deleted/disabled accounts; stale ADMIN demotion; USER/STUDENT denials; database failures; password byte boundaries; legacy bcrypt login; generic credential errors; rate-limit reset, forged forwarding headers, IPv6 grouping and separate registration limits. Browser helper tests cover persistence/logout, expiry, 401/403 handling, a stale-response race, HTTPS configuration, network/proxy failure and connection/body deadlines. See `PRODUCTION_READINESS.md` for final suite/build results.

## Remaining limitations

- A stolen bearer token remains usable until expiry or account disabling/deletion. Logout clears the local session; there is no server-side token revocation list, password-change revocation or refresh-token flow.
- localStorage remains readable by injected scripts. CloudFront must apply the CSP and security headers in the deployment guide. Script policy avoids inline scripts; existing inline CSS requires `style-src 'unsafe-inline'`. Review dependencies and avoid rendering untrusted HTML. HttpOnly cookies would require a complete cookie/CSRF/auth contract change and were outside this task.
- Successful registration still returns 201 and duplicates 409 to preserve the existing API contract. The duplicate message is generic and bcrypt work/throttling reduce leakage, but response status still permits account enumeration. Fully indistinguishable enrollment requires a coherent out-of-band confirmation flow, which is outside the permitted product scope.
- The application limiter is process-local and resets on restart. Before adding multiple backend instances/processes, deploy coordinated rate limiting; distributed attacks require perimeter controls. Shared-IP users share a quota.
- Clock synchronization is required. Authorization reflects database state at the start of each request; an in-flight operation may already have passed its check when an administrator changes a role.
- These tests mock MongoDB and storage. They do not establish live credential handling or a complete multi-account browser journey.
