# Teams API

Students form teams for open challenges.

## Statuses

`ACTIVE` (default), `COMPLETED`, `CANCELLED`

## Create

`POST /api/teams` — **STUDENT only**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 3–100 characters |
| `description` | string | 10–1000 characters |
| `challenge` | string (ObjectId) | must reference an `OPEN` challenge |

The creator automatically becomes the team `LEADER` (a `TeamMember` with role `LEADER`).

**Responses**

- `201 Created`
- `400 Bad Request` — challenge not open
- `404 Not Found` — challenge not found
- `409 Conflict` — student already in a team for this challenge

## My teams

`GET /api/teams/my` — any authenticated student

Returns the teams the student belongs to (via membership), with `challenge` and `createdBy` populated.

**Response `200 OK`** — `{ "status": "success", "data": { "teams": [ ...memberships ] } }`

## Get team

`GET /api/teams/:teamId` — any authenticated user

Returns the team, populated with `challenge` and `createdBy`.

- `404 Not Found` — team not found

## Get members

`GET /api/teams/:teamId/members` — any authenticated user

Returns members with `{ user: { name, email, role }, role: LEADER|MEMBER }`.

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "members": [
      { "user": { "name": "...", "email": "...", "role": "STUDENT" }, "role": "LEADER" }
    ]
  }
}
```

- `404 Not Found` — team not found
