# Roadmap — Remaining Work

A concrete checklist for the last ~30%. The core loop is already working end-to-end: **report problem → admin verifies → challenge → students apply / form teams → admin reviews**. What remains is hardening, closing the loop, filling gaps, and quality.

## Already done (as of this doc)

- **Auth** — register, login, JWT access token, `authenticate` + `authorize` (RBAC) middleware
- **Problems** — report, list, status/priority transitions with audit history, media
- **Media** — AWS S3 presigned upload/download URLs
- **Challenges** — create from verified problem, lifecycle transitions, list/get/update
- **Teams & invitations** — create team, leader invites, accept/reject
- **Applications** — apply, list, admin review
- **Web** — role-protected React app (13+ pages)

---

## Step 2 — Production authentication (highest priority)

- [ ] Refresh tokens + rotation / revocation (today there is only a single 7-day access token)
- [ ] Logout endpoint (stateless JWT currently has no server-side logout)
- [ ] Email verification flow (`isVerified` is stored but nothing sets it)
- [ ] Password reset / forgot-password
- [ ] Rate limiting on auth endpoints (register/login)
- [ ] Account lockout after repeated failed logins

## Step 3 — Close the core workflow loop

- [ ] Problem → Challenge "promote" flow (currently an admin creates a challenge manually; no button converts a verified problem)
- [ ] Problem verification queue in the web app (the `Verification` page is a placeholder)
- [ ] Implement the `Reports` page (moderation dashboard) — placeholder
- [ ] Implement the `Analytics` page (impact metrics) — placeholder
- [ ] Solution / prototype submission stage
- [ ] Field implementation + impact measurement stages (later vision)

## Frontend gaps

- [ ] Wire `Reports`, `Verification`, `Analytics` pages to the API (they render static shells today)
- [ ] Remove orphaned `web/src/pages/Register.tsx` (unused — `Signup.tsx` is what the router uses)
- [ ] Mentor / University / Organization role experiences (roles are defined, but there is no dedicated UI yet)

## Quality & engineering

- [ ] Automated tests (Jest is configured, but `server/tests/` is empty)
- [ ] Add `server/.env.example` (referenced in Step 1 docs but the file is missing)
- [ ] Add a root `README.md`
- [ ] Mobile app (the `mobile/` folder is empty scaffolding)
- [ ] Fix the formatting/alignment bug in `server/src/models/problem.model.ts` (the `history` interface block)
- [ ] CI pipeline (lint + typecheck + tests)
- [ ] Commit outstanding work and keep the docs in sync as features land

## Suggested sequencing

1. **Step 2 (auth hardening)** — security foundation; do this before shipping anything real.
2. **Step 3 (close the loop)** — completes the "verify → challenge" vision end to end.
3. **Admin pages** (`Reports` / `Verification` / `Analytics`).
4. **Tests, README, cleanup, CI**.
