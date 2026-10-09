# Applications API

Students apply to open challenges; admins review the applications.

## Statuses

`PENDING` (default), `ACCEPTED`, `REJECTED`

## Create

`POST /api/applications` — **STUDENT only**

| Field | Type | Rules |
|-------|------|-------|
| `challenge` | string (ObjectId) | must be `OPEN` and not past its deadline |
| `motivation` | string | 20–2000 characters |
| `skills` | string[] | optional, default `[]` |

A student may apply to a given challenge only once (unique index).

**Responses**

- `201 Created`
- `400 Bad Request` — challenge not accepting applications
- `404 Not Found` — challenge not found
- `409 Conflict` — already applied to this challenge

## My applications

`GET /api/applications` — **STUDENT only**

Returns the student's applications, newest first, populated with `challenge`.

**Response `200 OK`** — `{ "status": "success", "data": { "applications": [ ... ] } }`

## Applications for a challenge

`GET /api/applications/challenge/:challengeId` — **ADMIN only**

Returns all applications for a challenge, populated with `applicant` (`name`, `email`, `role`).

- `404 Not Found` — challenge not found

## Review

`PATCH /api/applications/:applicationId/review` — **ADMIN only**

| Field | Type | Rules |
|-------|------|-------|
| `status` | enum | `ACCEPTED` \| `REJECTED` |
| `reviewNote` | string | required when `status` is `REJECTED` |

**Responses**

- `200 OK`
- `400 Bad Request` — already reviewed, or review note missing on rejection
- `404 Not Found` — application not found
