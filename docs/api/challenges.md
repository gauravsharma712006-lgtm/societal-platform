# Challenges API

A challenge is created by an admin from a **verified** problem. Students then apply and form teams around it.

## Statuses

`DRAFT` (default on create), `OPEN`, `CLOSED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

**Transitions**

```
DRAFT        -> OPEN | CANCELLED
OPEN         -> CLOSED | CANCELLED
CLOSED       -> IN_PROGRESS
IN_PROGRESS  -> COMPLETED
COMPLETED    -> (terminal)
CANCELLED    -> (terminal)
```

Only `OPEN` challenges accept applications and teams (and only before the deadline).

## Create

`POST /api/challenges` — **ADMIN only**

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 5–150 characters |
| `description` | string | 20–5000 characters |
| `problem` | string (ObjectId) | must reference a `VERIFIED` problem |
| `deadline` | date | must be in the future |
| `skills` | string[] | optional, default `[]` |
| `eligibility` | string | 5–1000 characters |

**Responses**

- `201 Created`
- `400 Bad Request` — problem not verified (`Challenge can only be created from a verified problem`)
- `404 Not Found` — problem not found
- `409 Conflict` — an active challenge already exists for this problem

New challenges are created with status `DRAFT`.

## List

`GET /api/challenges` — any authenticated user

Returns `OPEN`, `IN_PROGRESS`, and `COMPLETED` challenges (excludes `DRAFT` and `CANCELLED`), newest first, populated with `problem` and `createdBy`.

**Response `200 OK`** — `{ "status": "success", "data": { "challenges": [ ... ] } }`

## Get by id

`GET /api/challenges/:challengeId` — any authenticated user

- `404 Not Found` — missing, or status is `DRAFT`/`CANCELLED`

## Update status

`PATCH /api/challenges/:challengeId/status` — **ADMIN only**

| Field | Type |
|-------|------|
| `status` | enum (valid transition from the current status) |

**Responses**

- `200 OK`
- `400 Bad Request` — invalid transition
- `404 Not Found` — challenge not found

## Update challenge

`PATCH /api/challenges/:challengeId` — **ADMIN only**

Optional fields: `title`, `description`, `deadline`, `skills`, `eligibility`.

**Responses**

- `200 OK`
- `400 Bad Request` — challenge is `COMPLETED`/`CANCELLED` (not editable)
- `404 Not Found` — challenge not found
