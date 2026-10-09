# Team Invitations API

Team leaders invite other students to join their team.

## Statuses

`PENDING` (default), `ACCEPTED`, `REJECTED`, `CANCELLED`

## Create

`POST /api/team-invitations` — team **LEADER** only

| Field | Type | Rules |
|-------|------|-------|
| `team` | string (ObjectId) | must be an `ACTIVE` team |
| `invitedUser` | string (ObjectId) | must be a `STUDENT` |

**Responses**

- `201 Created`
- `400 Bad Request` — team not active / challenge not open / invited user is not a student
- `403 Forbidden` — requester is not the team leader
- `404 Not Found` — team / challenge / user not found
- `409 Conflict` — user already a member, or a pending invitation already exists

## Respond

`PATCH /api/team-invitations/:invitationId` — the invited student only

| Field | Type |
|-------|------|
| `status` | `ACCEPTED` \| `REJECTED` |

Accepting adds the student as a `MEMBER` (after checking they are not already in a team for that challenge).

**Responses**

- `200 OK`
- `403 Forbidden` — not the invited student
- `404 Not Found` — invitation / team / challenge not found
- `409 Conflict` — already responded, or already in a team for this challenge

## My invitations

`GET /api/team-invitations/my` — any authenticated student

Returns invitations sent to the student, newest first, populated with `team` and `invitedBy`.

**Response `200 OK`** — `{ "status": "success", "data": { "invitations": [ ... ] } }`
