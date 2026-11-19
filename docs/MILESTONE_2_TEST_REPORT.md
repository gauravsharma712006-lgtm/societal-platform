# Milestone 2 Test Report

Date: 2026-11-17 (Asia/Calcutta)

## A. Overall result

### Passed

- Backend TypeScript production build.
- Frontend TypeScript and Vite production build.
- Final full backend regression run at that point: 17 suites, 239 tests passed, 0 failed.
- Additional focused tests added after the full regression: 21 passed, 0 product failures (11 problem lifecycle, 6 evidence workflow, 4 AI route).
- Current automated tests executed across the final code: 260 passing tests.
- Browser smoke checks: login page, signup navigation/page, unauthenticated protected-route redirect, mobile login layout, mobile signup layout, and console-error inspection.

### Failed during the audit and fixed

- Initial frontend build failed with four dynamic-category TypeScript errors in `Problems.tsx`.
- Initial backend regression had 17 failures because challenge/application route tests used invalid fake user IDs after authentication began verifying the current database user.
- Invalid login credentials returned HTTP 500 from the working tree instead of HTTP 401.
- Dynamic categories were only partially integrated in the frontend and reports still submitted legacy category strings.
- Team detail/member endpoints exposed team member information to any authenticated user.
- Problem media attachment only checked object existence and trusted submitted metadata/content type.

### Blocked

- The authenticated citizen-to-solution live scenario was not run because no isolated browser-test MongoDB database, disposable role accounts, isolated S3 bucket/prefix, and test credentials were provided. Using the configured real collections or services would violate the task safety rules.
- A real Ollama inference check was not run. Automated AI tests mocked Ollama responses and failure modes.

### Not executed

- Real MongoDB persistence through the browser.
- Real S3 presigned upload/download transfers.
- Real multi-account browser switching across USER, ADMIN, and STUDENT.
- Real Ollama model inference.
- Destructive or mutating tests against configured development/production data.

## B. Test coverage table

Counts below are conservative direct counts. Some integration tests cover more than one area and are intentionally not double-counted everywhere.

| Test area | Tests executed | Passed | Failed | Bugs identified | Fixes applied | Remaining issues |
|---|---:|---:|---:|---|---|---|
| 1. Authentication and user management | 13 automated + 3 browser | 16 | 0 | Invalid credentials returned 500; stale token could remain if `/users/me` failed after login; route-test tokens no longer matched database-backed authentication | Correct 401 response, generic credential message, token cleanup, current-user route mocks, student directory role guard | Live registration/login and refresh with an isolated DB were blocked |
| 2. Dynamic categories | 12 automated plus build/static audit | 12 | 0 | Frontend did not fetch category tree, `CategoryNode`/state were missing, legacy category was submitted, category service errors became 500 | Added category API call, nested selectable options, ObjectId submission, readable category display, client error mapping | Authenticated browser create/refresh was blocked by missing isolated data stack |
| 3. Citizen problem reporting | 8 direct route tests plus build/static audit | 8 | 0 | Frontend build and dynamic category submission blocked core report creation | Fixed category contract, map layout placement, duplicate-submit disabled state retained | Live persistence and refresh not executed |
| 4. Media upload, S3 and evidence | 7 problem-media route tests plus 15 solution-evidence controller tests | 22 | 0 | Problem attachment trusted submitted metadata and did not verify image bytes | Check stored content type/size and validate JPEG/PNG/WebP signatures before attachment | Real presigned transfer not executed; AWS calls remained mocked |
| 5. Admin problem review | 11 lifecycle service tests + 5 route authorization tests | 16 | 0 | Priority/history endpoints had no frontend integration | Added admin priority control and on-demand problem history UI/API calls | Authenticated admin browser flow blocked |
| 6. Additional evidence requests | 6 focused service tests | 6 | 0 | No new product defect reproduced; workflow lacked focused direct coverage | Added request, ownership, duplicate-response, same-problem media, and completion tests | Live upload/respond/admin-view scenario blocked |
| 7. Challenges | 9 route tests + 18 service transition/creation/edit tests | 27 | 0 | Route tests were broken by obsolete authentication fixtures | Updated fixtures to mock current user lookup without weakening production authentication | Live challenge creation from a persisted verified problem blocked |
| 8. Applications, teams and invitations | 10 application route + 13 application service + 10 team + 10 invitation tests | 43 | 0 | Any authenticated user could retrieve unrelated team details/member emails; admin team page unnecessarily requested student directory | Enforced member/admin reads; student-only directory; leader-only directory fetch in UI | Full multi-account invitation acceptance blocked |
| 9. Solutions and reviews | Service and controller suites covering submission, retrieval, membership, review and history | All relevant suite tests passed | 0 | No new P0/P1 defect reproduced | Existing authorization and review behavior preserved | Live team submission/admin review blocked |
| 10. Implementation milestones and impact | Service/controller tests for implementation status, milestones, impact and solution evidence | All relevant suite tests passed | 0 | No new P0/P1 defect reproduced | Existing implementation preserved | Live post-approval workflow blocked |
| 11. Local AI / Ollama | 9 provider/service + 4 route tests | 13 | 0 | No route-level AI coverage; frontend category compatibility needed protection | Added valid/invalid JSON, schema, timeout, HTTP, network, auth, validation and graceful-failure tests; AI apply does not overwrite database category | Real local model check not executed |
| 12. Frontend integration and regression | 2 builds + 6 browser smoke checks + endpoint audit | 8 | 0 final | Four compile errors, hardcoded API origin, missing category/priority/history integration, failed-login token residue | Environment-configurable API URL, integrations above, browser route/mobile verification | No automated component suite; authenticated pages not browser-tested |

## C. Files changed

Files changed during this audit (pre-existing unrelated working-tree changes were preserved):

- `server/src/controllers/auth.controller.ts` — return 401 for invalid credentials and handle duplicate registration races.
- `server/src/controllers/media.controller.ts` — verify stored metadata and image signatures before attaching problem evidence.
- `server/src/controllers/problem.controller.ts` — map dynamic-category service failures to correct client errors.
- `server/src/controllers/team.controller.ts` — return 403 for unauthorized team detail/member reads.
- `server/src/routes/user.routes.ts` — restrict student-directory access to STUDENT accounts.
- `server/src/services/team.service.ts` — require team membership or ADMIN for team/member retrieval.
- `server/src/services/team-invitation.service.ts` — remove diagnostic logging of invitation identifiers.
- `server/__tests__/application.routes.test.ts` — use valid current-user authentication mocks.
- `server/__tests__/challenge.routes.test.ts` — use valid current-user authentication mocks.
- `server/__tests__/problem.routes.test.ts` — cover dynamic categories and stronger media verification.
- `server/__tests__/auth.routes.test.ts` — add registration/login route regression tests.
- `server/__tests__/ai.routes.test.ts` — add AI authentication, validation, success and outage tests.
- `server/src/services/team.service.test.ts` — test team read authorization.
- `server/src/services/problem-lifecycle.service.test.ts` — test required status transitions, rejection reason and priority history.
- `server/src/services/problem-evidence.service.test.ts` — test the additional-evidence workflow.
- `server/src/services/ai/problem-assistant.service.test.ts` — test model suggestion parsing and validation.
- `server/src/services/ai/ollama.provider.test.ts` — test HTTP, response-shape, network and timeout behavior.
- `web/src/services/api.ts` — configurable API URL; category, priority and history API integration; dynamic category payload.
- `web/src/pages/Problems.tsx` — load/render dynamic category hierarchy, submit `categoryId`, display category names, and preserve AI/category separation.
- `web/src/pages/Verification.tsx` — readable dynamic categories, priority changes and problem history.
- `web/src/pages/Login.tsx` — remove diagnostic account logging and clear partial authentication state on failure.
- `web/src/pages/TeamDetails.tsx` — fetch invitation candidates only for a team leader.
- `docs/MILESTONE_2_TEST_REPORT.md` — this report.

## D. API integration findings

### Inventory

| Frontend area | Backend endpoints used | Result |
|---|---|---|
| Login/signup/session | `/api/auth/register`, `/api/auth/login`, `/api/users/me` | Matched after login error fix |
| Citizen problems | `/api/categories`, `/api/problems`, `/api/media/*`, `/api/problems/:id/media`, `/api/ai/improve-problem`, evidence-response endpoint | Dynamic category mismatch fixed |
| Admin verification | Problem list/status/priority/history/evidence-request/media download endpoints | Priority/history integration added |
| Challenges | Challenge list/detail/create/status endpoints | Paths and payloads matched |
| Applications | Create/mine/challenge-review endpoints | Paths and payloads matched |
| Teams/invitations | Team list/detail/members/create, student directory, invitation list/create/respond | Read authorization fixed |
| Solutions | Challenge list, detail, create, review, implementation, milestones, impact and evidence endpoints | Paths matched existing validators |

### Incorrect or incomplete integrations found

- `Problems.tsx` referenced undefined category types/state and still sent `category` instead of `categoryId`.
- Problem cards and admin verification would show a null/legacy category instead of the selected database category name.
- Admin priority and problem history backend routes were not wired to the frontend.
- The API client hardcoded `http://localhost:5000/api`; it now supports `VITE_API_URL` with the local URL as a development fallback.
- Failed login session restoration could leave a token in storage.
- `PATCH /api/users/me`, challenge edit, and category administration endpoints still have no dedicated frontend controls. These are not required to complete the verified core reporting journey and were not expanded into new interfaces.
- Solution mutation validators currently require URL identifiers to be duplicated in request bodies. The existing frontend satisfies this contract, but it is an API consistency item for later cleanup.

## E. End-to-end scenario results

### Broken streetlights scenario

| Stage | Result | Evidence |
|---|---|---|
| Citizen register/login | Partially executed | Public login/signup UI and protected redirect passed; live account mutation blocked |
| Citizen report + category + location + evidence | Blocked live; automated components passed | Dynamic category, problem creation validation, GeoJSON payload, media validation and ownership covered by tests/build |
| Admin review + evidence request | Blocked live; automated components passed | Status transitions, priority, history and evidence request tests passed |
| Reporter evidence response | Blocked live; automated components passed | Ownership, attachment, duplicate response and completion tests passed |
| Admin verification | Blocked live; automated components passed | Required transition tests passed |
| Challenge | Blocked live; automated components passed | Route and service suites passed |
| Student application/team/invitation | Blocked live; automated components passed | Application/team/invitation suites passed |
| Solution/review/implementation/milestone/impact | Blocked live; automated components passed | Solution service/controller suites passed |
| Refresh/persistence/console | Partially executed | Public UI refresh/navigation had no console errors; database persistence not executed |

The full connected scenario was **not completed** because performing it safely requires an isolated integration environment and disposable credentials.

## F. Remaining bugs and limitations

### P2

1. Vite reports that `vite.config.ts` uses ESM syntax while the package is configured as CommonJS.
   - Reproduction: run `npm run build` in `web`.
   - Impact: warning only today; future Vite native config loading may require configuration cleanup.

2. The frontend production bundle is approximately 592 kB minified and triggers Vite's 500 kB chunk warning.
   - Reproduction: run `npm run build` in `web`.
   - Impact: performance optimization opportunity, not an MVP blocker.

3. Solution URL identifiers are duplicated in JSON bodies for several mutation endpoints.
   - Reproduction: inspect solution validators and `web/src/services/api.ts`.
   - Impact: client and server currently agree, but the contract is unnecessarily coupled.

### P3 / deferred

1. `Reports.tsx` and `Analytics.tsx` remain placeholder pages.
2. No category-management UI exists; backend admin category operations are available and tested at the service level.
3. Profile editing and challenge editing have backend routes but no dedicated frontend controls.

### Verification limitations (not confirmed product bugs)

1. No isolated live MongoDB/S3/Ollama environment was available.
2. No automated React component/browser test suite exists.
3. Authenticated pages could not be safely exercised through a real multi-role browser journey.

## G. Build and test results

### Backend build

Command: `cd server; npm run build`

Result: **PASS** — TypeScript completed with no diagnostics.

### Frontend build

Initial result: **FAIL** — four `Problems.tsx` category integration errors.

Final command: `cd web; npm run build`

Final result: **PASS** — 98 modules transformed; output generated successfully. Non-blocking Vite config and chunk-size warnings remain.

### Backend tests

- Initial full run: 14 suites, 218 tests; 201 passed, 17 failed.
- Targeted repair run: 6 suites, 55 tests passed.
- Final full regression at that point: 17 suites, 239 tests passed, 0 failed.
- Additional focused tests after the full run:
  - Problem lifecycle: 11 passed.
  - Evidence workflow: 6 passed after correcting the new test's argument order.
  - AI route: 4 passed.
- Total current test cases executed successfully: **260**.

### Browser smoke testing

Passed:

- `/login` rendered.
- Login-to-signup navigation rendered `/signup`.
- Unauthenticated `/problems` redirected to `/login`.
- Login and signup rendered at a 390 × 844 mobile viewport.
- Browser console inspection found no application errors in the tested public pages.

## H. Milestone completion decision

**PARTIAL — SPECIFIC ITEMS REMAIN**

No confirmed P0 or P1 defect remains in the automated scope, and all builds/tests executed after the fixes pass. Milestone 2 cannot be marked PASS because the mandatory authenticated citizen-to-solution journey, real persistence, real S3 transfers, and real Ollama inference were not executed against a safe isolated integration environment.

Recommended handoff prerequisite for Milestone 3: provision an isolated integration database, disposable role accounts, isolated S3 test prefix/bucket, and an optional local Ollama model, then execute the documented connected scenario once without touching development or production records.
