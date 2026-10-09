# Backend Architecture

Node.js + TypeScript + Express, organized in clean layers.

## Layer stack

```text
routes/       → map HTTP endpoints to controllers, apply middleware
controllers/  → handle request/response, map service errors to status codes
services/     → business logic and domain rules
models/       → Mongoose schemas (database shape)
validators/   → Zod schemas (input validation)
middleware/   → authenticate (JWT), authorize (RBAC), validate (Zod)
config/       → environment + database connection
constants/    → shared enums (problem, challenge)
utils/        → jwt helpers
```

The web app talks only to the HTTP layer; it never touches models directly.

## Directory map (`server/src/`)

| Path | Responsibility |
|------|----------------|
| `app.ts` | Express app: helmet, CORS, JSON parsing, morgan, routes, 404 + error handlers |
| `server.ts` | entry point; connects MongoDB before starting Express |
| `config/database.ts` | Mongoose connection |
| `config/env.ts` | typed env access (PORT, MONGODB_URI, JWT_SECRET, CORS_ORIGIN, AWS_*) |
| `middleware/auth.middleware.ts` | verifies Bearer JWT, attaches `req.user` |
| `middleware/authorize.middleware.ts` | role check (`ADMIN`, `STUDENT`, …) |
| `middleware/validate.middleware.ts` | runs Zod schema over body + params |
| `routes/*.routes.ts` | 8 route modules (auth, users, problems, media, challenges, teams, team-invitations, applications) |
| `controllers/*.controller.ts` | request/response handling per domain |
| `services/*.service.ts` | business rules per domain |
| `models/*.model.ts` | Mongoose models |
| `validators/*.validator.ts` | Zod schemas |

## Middleware chain (typical)

```text
authenticate → authorize(ROLE) → validate(schema) → controller
```

## Security

- **bcrypt** password hashing with cost factor 12
- **JWT** access tokens (7-day expiry), payload `{ userId, role }`
- **RBAC** via `authorize(...roles)` (roles: `USER`, `STUDENT`, `UNIVERSITY`, `MENTOR`, `ORGANIZATION`, `ADMIN`)
- **Helmet** security headers + **CORS**

## Error handling

Services throw coded errors (e.g. `PROBLEM_NOT_FOUND`, `INVALID_STATUS_TRANSITION`). Controllers catch them and map to HTTP responses. A global error handler and a 404 handler live in `app.ts`.

## Configuration

`.env` (not committed) supplies:

```text
PORT, NODE_ENV, MONGODB_URI, JWT_SECRET, CORS_ORIGIN,
AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME
```

## Scripts (`server/package.json`)

```text
npm run dev     # tsx watch src/server.ts
npm run build   # tsc
npm start       # node dist/server.js
npm test        # jest (no tests written yet)
```
