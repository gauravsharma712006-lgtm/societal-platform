# Societal Platform v1 release readiness

Date: 2026-11-18 (Asia/Calcutta). Recommendation: **NOT READY** until the prerequisites and live checks below are completed.

This audit preserves the existing modified/untracked worktree and historical reports. No deployment, push, database seeding, live database mutation, real invitation or S3 fixture upload was performed. Previous test/build claims were not treated as current evidence.

## Initial prioritized issues

| Severity | Finding | Current state |
| --- | --- | --- |
| BLOCKER | Backend build attempted to emit colocated test files into permission-restricted output | Production compilation excludes tests; backend build passed |
| BLOCKER | Vite cannot replace existing `web/dist/assets` because of local permissions | Final production build passed using fresh `web/build-release`; default output remains blocked locally |
| BLOCKER | All three solution evidence routes reject valid requests after middleware removes the body copy of the URL identifier | Controllers use canonical route parameters; real Express route regressions added |
| BLOCKER | No explicitly verified disposable database and confirmed S3 test resources | Live connected workflow remains unverified |
| HIGH | Admin loses closed challenges from the list and cannot open draft details | Role-aware list/detail access fixed |
| HIGH | Team creation only checks the first membership for a duplicate challenge; expired challenges accept team/invitation mutations | Checks all memberships and enforces deadlines; existing transaction preserved |
| HIGH | Media verification reads storage before ownership checks; transfer size unsigned; full object downloaded for signature checks; outages treated as missing objects | Ownership checked first, size/type signed, bounded signature read, useful 503 errors |
| HIGH | Partial image failure after successful report creation permits duplicate report retries | Saved report ID and remaining files retained; uploads retry against the same report |
| HIGH | Shared application rejection note, successful team dialog staying open, and actions exposed to roles without write permission | Focused frontend guards and state fixes applied |
| HIGH | bcrypt silently truncates passwords beyond 72 UTF-8 bytes | Registration validator cap applied; legacy login compatibility retained; extra regression additions held by approval-review failure |
| MEDIUM | Stale AI results can be applied after edits; frontend request can remain pending | Draft edits invalidate suggestions; client deadline and useful offline errors added |
| MEDIUM | Malformed/oversized JSON returns server errors | Returns 400/413 with useful messages |
| MEDIUM | Production CORS configuration can be missing or wildcard; config templates missing | Production origin validation added; example-file additions left pending at user's request |
| DEFER | Notifications, analytics, additional AI, mobile expansion, refresh-token/email-verification systems, broad architecture changes | Outside this stabilization scope; placeholder analytics/report links removed |

## Completed local fixes and files

Backend:

- `server/tsconfig.json`: exclude tests from production compilation.
- `server/src/config/env.ts`, `server/src/config/env.test.ts`: explicit production HTTP(S) CORS origins; normalize/validate Ollama URL and model.
- `server/src/app.ts`, `server/__tests__/app.routes.test.ts`: malformed JSON and payload limit responses.
- `server/src/controllers/media.controller.ts`, `server/src/services/media.service.ts`, `server/src/services/media.service.test.ts`, `server/__tests__/problem.routes.test.ts`: media authorization, signed size/type, bounded signature reads, outage errors.
- `server/src/controllers/challenge.controller.ts`, `server/src/services/challenge.service.ts`, corresponding challenge tests: admin visibility, closed challenge availability and active duplicate protection.
- `server/src/services/problem.service.ts`, `server/src/services/problem-media.service.test.ts`: atomic idempotent attachment by key, including lost-response retries.
- `server/src/services/team.service.ts`, `server/src/services/team.service.test.ts`: check all existing memberships before creating another team in the same challenge; enforce deadline.
- `server/src/services/team-invitation.service.ts`, `server/src/controllers/team-invitation.controller.ts`, associated invitation tests and `server/__tests__/team-eligibility.routes.test.ts`: enforce deadlines and map eligibility errors to useful client responses.
- `docs/api/challenges.md`, `docs/api/teams.md`, `docs/api/team-invitations.md`: reflect actual visibility, ownership, eligibility and deadline rules.
- `server/src/controllers/solution.controller.ts`, `server/src/controllers/solution.controller.test.ts`, `server/__tests__/solution-evidence.routes.test.ts`: canonical evidence route IDs and authorization/storage failure regressions.
- `server/src/services/solution.service.ts`: submission allowed in existing OPEN/IN_PROGRESS challenge phases, while closed/terminal phases remain blocked.
- `server/src/validators/auth.validator.ts`: registration password byte cap.

Frontend:

- `web/vite.config.ts` renamed to `web/vite.config.mts`: compatible ESM config loading; `.gitignore` excludes the generated frontend release build.
- `web/src/services/api.ts`: bounded AI request and useful network/timeout errors.
- `web/src/pages/Problems.tsx`: partial upload retry, saved-report state, file limits, stale AI protection and form validation.
- `web/src/pages/Challenges.tsx`, `ChallengeDetails.tsx`: verified problem selection, existing lifecycle controls, role/loading guards.
- `web/src/pages/AdminApplications.tsx`: per-applicant rejection notes.
- `web/src/pages/Teams.tsx`, `TeamDetails.tsx`, `Invitations.tsx`: correct successful-dialog state, localized directory errors and serialized invitation responses.
- `web/src/pages/Solutions.tsx`, `SolutionDetails.tsx`: mutation permissions follow team membership; preserve successful creation when refresh fails.
- `web/src/pages/Signup.tsx`: validation aligned with registration.
- `web/src/pages/Dashboard.tsx`, `web/src/layouts/DashboardLayout.tsx`: link to existing workflows instead of unfinished analytics/report placeholders.

No new runtime dependencies were introduced. Existing dark/purple glass styling is preserved.

## Verification executed

| Check | Result |
| --- | --- |
| Initial backend `npm run build` | Failed only on permission-restricted emitted test files |
| Backend build after excluding tests | PASS |
| Initial frontend `npm run build` | TypeScript passed; Vite failed cleaning existing output |
| Frontend `npm run build -- --outDir build` | PASS; bundle size warning remains |
| Focused environment/request parsing/AI suites | 5 suites, 22 tests PASS |
| Focused problem routes/media safeguards | 2 suites, 27 tests PASS |
| Focused idempotent attachments and existing auth routes | 2 suites, 9 tests PASS |
| Focused challenge/solution controller/evidence routes | 3 suites, 53 tests PASS before later lifecycle adjustments |
| Final focused team/invitation/solution/eligibility routes | 4 suites, 114 tests PASS |
| Registration byte-limit source checks | 72/73 ASCII bytes and 72/75 Unicode bytes accept/reject correctly; legacy login accepts 100 characters |
| Frontend `npx tsc --noEmit` | PASS at multiple focused checkpoints |
| Read-only loopback Ollama `/api/tags` availability probe | Unavailable; no model downloaded or inference attempted |
| Production dependency audit (server and web) | Registry advisory endpoint unavailable; vulnerability status UNKNOWN |
| Final backend `npm run build` | PASS |
| Final frontend `npm run build -- --outDir build-release` | PASS; 595.32 kB JS, bundle-size warning remains |
| Final full backend suite | PASS: 26 suites, 302 tests, 0 failures; 179.267 seconds |
| Local fixture browser checks | BLOCKED: no browser surfaces available; no scenario passed; temporary mocked servers confirmed stopped |

Automated unit/route tests use mocks for database/authentication/storage. They do not establish real MongoDB transaction behavior, real signed S3 transfers, or a complete live multi-role journey.

Final suite command: `npm test -- --runInBand --json --outputFile=build/release-test-results.json` from `server`. Machine-readable results and full output are retained in `server/build/release-test-results.json` and `server/build/release-test-output.log` (ignored generated artifacts). The full suite was run once at the end; focused counts above overlap and must not be added together.

## Remaining release actions

1. Automated builds/regression are complete. Begin the remaining live verification only after the disposable resources below are explicitly confirmed.
2. Provide and explicitly verify a disposable database identity and disposable USER/ADMIN/STUDENT accounts. Confirm Atlas transaction support; do not assume the current configured database is disposable.
3. Confirm the private S3 test bucket/prefix, IAM identity and cleanup limitations. Validate bucket CORS and signed PUT/GET behavior before uploading fixtures. Previous DeleteObject permission limitations remain unverified; no destructive cleanup is authorized.
4. Execute citizen reporting/category/map/media, admin review/evidence response/verification, challenge/application/team/invitation, solution review, milestone/implementation/impact and refresh/persistence flows against that confirmed environment.
5. Configure HTTPS frontend/API URLs, `VITE_API_URL` at build time, strong production JWT secret, explicit CORS allowlist, valid MongoDB/AWS configuration and production NODE_ENV. Set perimeter throttling for login/register and rerun production dependency audits when the registry is reachable.
6. Use `npm run build -- --outDir build-release` in `web` or resolve the existing `web/dist` permissions before relying on the default local build command. Build deployment artifacts from a clean checkout: existing server output still contains stale test files from historical builds; new production compilation no longer emits them. A failed approval review prevented the attempted generated-output replacement; no permissions were changed.
7. Environment examples and additional password/timeout regression tests remain pending at the user's explicit request after approval-review failures. The review service reported it could not complete review, rather than declaring the changes unsafe; these held mutations were not retried after the user's decision.
8. Optionally verify the configured local Ollama model when the local service is available. Offline AI must continue showing a useful error and preserving the report draft; no cloud fallback is configured.

Real external resources and missing live verification prevent a release recommendation based solely on passing builds or mocked tests.

Concurrency limitation: separate team-creation transactions can still race because membership uniqueness is scoped to team/user, rather than challenge/user. Sequential duplicate protection was fixed; concurrent persistence needs verification in the disposable Atlas environment. No database migration or architecture change was performed.
