# Production readiness

Date: 2026-11-19 (Asia/Calcutta). Status: **READY FOR DEPLOYMENT PREPARATION**. Reasonable local hardening, builds and regression verification are complete. Public production release remains gated by the manual setup and live staging checks below. The application is not deployed.

## Scope and preserved state

The existing application was inspected before modification, including git status, prior stabilization reports, authentication, environment configuration, media/solution authorization and frontend flows. There were already extensive modified/untracked files and historical deletions. Those changes were preserved; no baseline source/document file was deleted in this execution. No seed, push, real database/media mutation, IAM/Atlas change, credential rotation or deployment was performed. No runtime dependencies were added. The existing architecture and dark/purple design remain intact.

The working tree already had one-day HS256 tokens, database-backed role lookup, JSON 400/413 handling, production CORS validation, image metadata/signature verification, five-minute signed media URLs, idempotent problem attachments and AI timeout/stale-draft protection. Historical results (302 tests and prior builds) were not assumed current. The detailed before/after authentication audit is in [JWT_SECURITY_AUDIT.md](JWT_SECURITY_AUDIT.md); AWS steps, commands and rollback are in [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md). Prior reports remain historical records rather than current release evidence.

## Changes completed

| Area | Change and reason |
| --- | --- |
| JWT | Validate ObjectId, allowed role, issued-at, expiration, compact structure and maximum age; production issuer/audience and eight-hour maximum lifetime; keep HS256 signing/verification compatible. Prevent malformed, unscoped or overlong tokens from authorizing requests. |
| Current accounts | Add backward-compatible `isActive` and check current persisted role/activation on every request. Deleted/disabled accounts and stale ADMIN claims cannot retain privileged access. Keep existing role definitions and verification semantics. |
| Password/auth endpoints | Require stronger new passwords while retaining existing bcrypt login compatibility; enforce 72 UTF-8-byte registration maximum; equalize bcrypt work for absent accounts; generic credential/duplicate messages. Apply bounded per-IP login/registration throttling before body parsing. |
| Environment/startup | Validate NODE_ENV, port range, MongoDB URI format, HTTPS production CORS, strong secret/scope/lifetime, supported proxy/bind addresses, AWS region/bucket and credential pairs. Support EC2 instance roles/session credentials. Bound database startup and close HTTP/MongoDB on termination/fatal failure. |
| HTTP/logging | Explicit body limits; preserve safe malformed/oversized responses; remove powered-by; no-store API responses; query-free access logs and safe error classification. Add database-aware `/api/ready` beside liveness `/api/health`. |
| Media | Preserve authorized UUID/prefix generation and owner/team/admin download rules. Reject nested/traversal problem attachment keys before S3 access. Preserve signed type/size, 10-MiB limits and signature reads. Translate signer/storage outages to useful 503s; signed downloads request private/no-store caching. Document minimum IAM without DeleteObject. |
| Frontend | Keep localStorage persistence, clear invalid/expired sessions/context across tabs, prevent stale 401 logout races and offer Retry for transient session restoration errors. Require a configured production HTTPS API URL at build/runtime. Bound connection/body/image-transfer time and provide useful network/proxy errors. Align signup password minimum. |
| AI | Preserve private Ollama/model and bounded 60-second inference. Production defaults AI off; paired frontend flag hides the action. Backend returns a safe unavailable response without contacting Ollama when off. Existing draft/stale-suggestion and partial-upload retry protections remain. |
| AWS preparation | Add reviewed-placeholder systemd/Nginx, media IAM/CORS, private frontend OAC bucket policy and CloudFront SPA Function templates. Document account/billing/EC2/Atlas/TLS/secret management/hosting/CSP/monitoring and rollback. No infrastructure was provisioned. |

## Environment reference

Templates: `server/.env.example` and `web/.env.example`. Placeholders are intentionally unusable until replaced. No credentials were copied from `.env`.

| Variable | Requirement/default |
| --- | --- |
| `NODE_ENV` | development/test/production only; default development |
| `PORT` | integer 1–65535; default 5000 |
| `HOST` | production loopback (`127.0.0.1` default or `::1`); development default `0.0.0.0`; supplied Nginx uses IPv4 loopback |
| `TRUST_PROXY` | false default or loopback only; use loopback with the supplied Nginx header overwrite and private backend port |
| `MONGODB_URI` | required MongoDB URI; production uses the existing verified Atlas cluster with TLS |
| `JWT_SECRET` | required; production requires at least 32 random bytes and rejects obvious weak/template secrets; no automatic rotation |
| `JWT_ISSUER`, `JWT_AUDIENCE` | required nonempty production values, at most 200 characters; development defaults societal-platform / societal-platform-web |
| `JWT_ACCESS_TOKEN_TTL_SECONDS` | production default/max 28800; development default/max 86400; minimum 300 |
| `CORS_ORIGIN` | exact comma-separated HTTPS production origins; no wildcard/path/userinfo; development preserves existing permissive fallback |
| `AWS_REGION`, `AWS_S3_BUCKET_NAME` | required verified media region/private bucket with syntax validation |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | optional together; omit for EC2 instance role/default SDK credential chain |
| `AWS_SESSION_TOKEN` | optional for temporary static credentials |
| `AI_ENABLED` | true/false; default false production, true development/test |
| `OLLAMA_BASE_URL` | HTTP(S) origin; default http://127.0.0.1:11434; never expose publicly |
| `OLLAMA_MODEL` | default llama3.1:8b; no model download performed |
| `VITE_API_URL` | public build variable; production requires HTTPS URL ending `/api`; development defaults localhost:5000/api |
| `VITE_AI_ENABLED` | public true/false; default off in production, on in development; keep false for the initial AI-disabled release |

First hardened production release rejects legacy tokens without the configured scope or with an excessive lifetime; users sign in again. New registration passwords must have at least 12 characters and at most 72 UTF-8 bytes. Existing short/long bcrypt passwords remain usable at login within the previous 100-character input limit. No refresh-token/cookie/CSRF migration was introduced.

## Current verification

| Check executed | Result |
| --- | --- |
| Focused authentication regressions | PASS: 6 suites / 53 tests |
| Focused config/request/media/AI regressions | PASS: 8 suites / 75 tests |
| Frontend session/network/config helper tests | PASS: 9 tests using the existing backend tsx runtime and Node test runner |
| Backend `npm run build` | PASS after correcting a logger IncomingMessage/Express type mismatch found by the first build |
| Frontend `npm run build` | PASS in normal `web/dist`; historical output-cleanup permission issue did not recur |
| Full final backend suite, run once | PASS: 29 suites / 364 tests / 0 failures / 0 skipped; 26.946 seconds |
| Deployment template/bundle check | PASS: three JSON templates parse; media IAM has only GetObject/PutObject on intended prefixes; six SPA route/asset/method cases; configured HTTPS API URL bundled; backend credential variable names absent |
| Local unauthenticated browser smoke | PASS: `/problems` redirects to login, login/signup navigation, 390-pixel layouts without horizontal overflow, signup minimum 12/new-password autocomplete; no captured console errors |
| Production dependency audits, server and web | BLOCKED: npm advisory endpoint request failed; npm-cache log directory also unwritable. Vulnerability status UNKNOWN. No forced dependency updates or suppressed failures. |
| Live AWS/Atlas/S3/Ollama/systemd/Nginx integration | NOT EXECUTED; requires verified resources/host and manual setup |

Focused counts overlap the full suite; do not sum them. The backend suite uses database/storage mocks. Browser smoke checks were against a localhost production preview and made no authentication/account/data writes. The preview process was stopped and the temporary viewport override reset. This does not establish authenticated mobile workflows or live external integration.

Frontend verification build used the public placeholder `VITE_API_URL=https://api.example.invalid/api` and `VITE_AI_ENABLED=false`; the resulting local artifact must be rebuilt with the verified deployment API domain. The bundle retains the shared helper's dormant development fallback literal; production requires explicit HTTPS configuration in both Vite and the runtime helper. An initial one-off bundle assertion incorrectly treated that dormant literal as an active endpoint; it was corrected based on the passing production config tests, not bypassed as a product failure. The one-off checker first hit a Node AppData path permission restriction and was rerun successfully from ignored workspace output.

Nonblocking frontend warnings: approximately 598.03-kB JS (169.06-kB gzip), above Vite's chunk warning threshold; Vite's prospective native config loader warns about the existing CommonJS package/module combination. Current builds succeed. No broad code splitting/module migration was made for these warnings.

Commands used:

```sh
# server
npm run build
npm test -- --runInBand --json --outputFile=build/production-20261119-tests.json
# from repository root, no new test dependency
node server/node_modules/tsx/dist/cli.mjs --test web/tests/production-security.test.ts
# web (public verification placeholder only)
VITE_API_URL=https://api.example.invalid/api VITE_AI_ENABLED=false npm run build
```

Machine-readable final backend result: `server/build/production-20261119-tests.json`; output: `server/build/production-20261119-test-output.log`. Audit responses are retained in `server/build/production-20261119-audit.json` and `web/build/production-20261119-audit.json`. These are ignored generated artifacts, not release source. The one-off deployment verifier is retained under `server/build/production-20261119-verify-deployment.cjs`.

## Exact files changed in this execution

This list is relative to `D:\Coding\Be-Better\G1\societal-platform` and excludes generated build/test outputs. Other git changes predate this execution and were preserved. No package/lockfile changes were made here.

```text
deploy/aws/frontend-bucket-policy.json
deploy/aws/media-cors.json
deploy/aws/media-iam-policy.json
deploy/aws/nginx-api.conf
deploy/aws/societal-api.service
deploy/aws/spa-rewrite.js
docs/AWS_DEPLOYMENT_GUIDE.md
docs/JWT_SECURITY_AUDIT.md
docs/PRODUCTION_READINESS.md
server/.env.example
server/__tests__/ai.routes.test.ts
server/__tests__/auth-security.routes.test.ts
server/__tests__/setup.ts
server/__tests__/solution-evidence.routes.test.ts
server/__tests__/team-eligibility.routes.test.ts
server/src/app.ts
server/src/config/database.ts
server/src/config/env.test.ts
server/src/config/env.ts
server/src/controllers/ai.controller.ts
server/src/controllers/auth.controller.ts
server/src/controllers/media.controller.ts
server/src/controllers/solution.controller.ts
server/src/middleware/__tests__/auth-rate-limit.middleware.test.ts
server/src/middleware/__tests__/auth.middleware.test.ts
server/src/middleware/auth-rate-limit.middleware.ts
server/src/middleware/auth.middleware.ts
server/src/models/user.model.ts
server/src/server.ts
server/src/services/ai/ollama.provider.test.ts
server/src/services/auth.service.test.ts
server/src/services/auth.service.ts
server/src/services/media.service.ts
server/src/utils/jwt.ts
server/src/utils/log-error.ts
server/src/validators/auth.validator.ts
server/src/validators/jwt.validator.ts
web/.env.example
web/src/context/AuthContext.tsx
web/src/pages/Login.tsx
web/src/pages/Problems.tsx
web/src/pages/Signup.tsx
web/src/routes/ProtectedRoute.tsx
web/src/services/api.ts
web/src/services/auth.ts
web/src/services/config.ts
web/src/services/http.ts
web/tests/production-security.test.ts
web/vite.config.mts
```

## Remaining release gates and limitations

1. Review and capture the intended existing worktree into a release snapshot; this task did not commit or push. Deploy from a clean reviewed release so old emitted test files do not linger.
2. Run successful production dependency advisory audits and review findings when the registry is reachable. Passing tests are not a vulnerability audit.
3. Manually configure verified AWS account/region/billing alerts, EC2/instance role/security groups, Atlas restricted network access and required existing indexes, protected secrets, API DNS/TLS/Nginx/systemd, private S3/CloudFront OAC/CSP/SPA routing, frontend API build/CORS and monitoring. Render every template placeholder and run `nginx -t`/service verification on the actual Linux host.
4. Execute the full disposable multi-role staging journey with real Atlas transactions and S3 signed transfers. No external fixtures were created here. Confirm private evidence denial, role demotion/disabled account denial, map/media/CSP behavior, expired sessions and rollback.
5. Retain localStorage's documented XSS risk, bearer-token lifetime/revocation limitations and registration status enumeration. The process-local limiter resets on restart; multiple API processes require coordinated throttling. Existing concurrent team-creation uniqueness requires live verification (see the historical release report). Image signature validation is not malware scanning; signed uploads can be replayed until expiry and orphan objects require a separately approved retention review. No IAM DeleteObject permission was added.
6. Keep production AI disabled unless a private tested Ollama service is deliberately enabled with both flags. No public Ollama, cloud-provider fallback, model download or GPU provisioning is included.

## Release and rollback recommendation

Proceed with **deployment preparation**, following the linked AWS runbook. Do not publish based on mocked tests alone. Complete the manual setup, dependency audit and staging gates before public traffic. Retain previous backend release directories, frontend assets/HTML, protected configuration/secret versions and Nginx settings. Switch backend releases atomically via the runbook symlink procedure; restore frontend assets before HTML and invalidate index/root. Keep hashes/old assets and never use destructive seeds, media deletion or `s3 sync --delete` for rollback. Prefer a prior security-compatible backend and expect re-login across JWT scope changes.
