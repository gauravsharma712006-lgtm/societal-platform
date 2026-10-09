# Frontend Architecture

React 19 + TypeScript + Vite + Tailwind CSS v4 + react-router-dom v7.

## Routing

`src/routes/AppRouter.tsx` defines:

- **Public routes** — `/login`, `/signup`
- **Protected shell** — `ProtectedRoute` wraps `DashboardLayout`; unauthenticated users are redirected to `/login`
- **Role-gated routes** — nested `ProtectedRoute allowedRoles=[...]` for challenges, applications, teams, and admin pages

| Route | Access |
|-------|--------|
| `/dashboard`, `/profile`, `/problems` | any authenticated user |
| `/challenges`, `/challenges/:challengeId`, `/teams`, `/teams/:teamId` | STUDENT / MENTOR / ADMIN |
| `/applications`, `/invitations` | STUDENT |
| `/reports`, `/verification`, `/analytics` | ADMIN |

## Auth state

- `src/context/AuthContext.tsx` — holds `user`, `isAuthenticated`, `isLoading`; exposes login/logout
- `src/hooks/useAuth.ts` — convenience hook
- `src/routes/ProtectedRoute.tsx` — guards by authentication and optional role list
- Token is attached to API requests by the service layer

## Pages (`src/pages/`)

**Fully implemented:** `Login`, `Signup`, `Dashboard`, `Profile`, `Problems`, `Challenges`, `ChallengeDetails`, `Applications`, `Teams`, `TeamDetails`, `Invitations`

**Placeholders (UI shell only):** `Reports`, `Verification`, `Analytics`

## Services

`src/services/api.ts` and `src/services/auth.ts` centralize HTTP calls (base URL `http://localhost:5000/api`).

## Layout

`src/layouts/DashboardLayout.tsx` + `src/components/Sidebar.tsx` provide the authenticated app chrome.

## Scripts (`web/package.json`)

```text
npm run dev      # vite
npm run build    # tsc && vite build
npm run preview  # vite preview
```
