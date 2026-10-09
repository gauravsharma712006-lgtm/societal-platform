# Problems API

Problems are reports submitted by citizens (any authenticated user). They move through a review lifecycle and, once `VERIFIED`, can be turned into a challenge.

## Enums

**Categories:** `INFRASTRUCTURE`, `HEALTH`, `EDUCATION`, `ENVIRONMENT`, `TRANSPORTATION`, `SANITATION`, `PUBLIC_SAFETY`, `OTHER`

**Priorities:** `LOW`, `MEDIUM` (default), `HIGH`, `CRITICAL`

**Statuses:** `REPORTED` (default), `UNDER_REVIEW`, `VERIFIED`, `REJECTED`

**Status transitions**

```
REPORTED      -> UNDER_REVIEW
UNDER_REVIEW  -> VERIFIED | REJECTED
REJECTED      -> UNDER_REVIEW
VERIFIED      -> (terminal)
```

## Create a problem

`POST /api/problems` — any authenticated user

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `title` | string | 5–150 characters |
| `description` | string | 20–5000 characters |
| `category` | enum | one of the categories |
| `location.address` | string | 2–300 characters |
| `location.city` | string | 2–100 characters |
| `location.state` | string | 2–100 characters |
| `location.coordinates.latitude` | number | -90..90 (optional) |
| `location.coordinates.longitude` | number | -180..180 (optional) |
| `priority` | enum | default `MEDIUM` |

**Response `201 Created`** — `{ "status": "success", "message": "Problem reported successfully", "data": <problem> }`

## List problems

`GET /api/problems` — any authenticated user

Returns all problems, newest first, with `reportedBy` populated as `{ name, email }`.

**Response `200 OK`** — `{ "status": "success", "data": [ ...problems ] }`

## Update status

`PATCH /api/problems/:problemId/status` — **ADMIN only**

| Field | Type | Rules |
|-------|------|-------|
| `status` | enum | `UNDER_REVIEW` \| `VERIFIED` \| `REJECTED` |
| `rejectionReason` | string | required when `status` is `REJECTED` |

**Responses**

- `200 OK`
- `400 Bad Request` — invalid transition, or rejection reason missing
- `404 Not Found` — problem not found

## Update priority

`PATCH /api/problems/:problemId/priority` — **ADMIN only**

| Field | Type |
|-------|------|
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL` |

**Response `200 OK`**

## Get history

`GET /api/problems/:problemId/history` — reporter or **ADMIN** only

Returns the audit trail of status and priority changes.

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "history": [
      {
        "action": "STATUS_CHANGED",
        "from": "REPORTED",
        "to": "UNDER_REVIEW",
        "changedBy": { "name": "...", "email": "...", "role": "ADMIN" },
        "reason": null
      }
    ]
  }
}
```

- `403 Forbidden` — not the reporter or an admin
- `404 Not Found` — problem not found

## Add media to a problem

`POST /api/problems/:problemId/media` — reporter only (see [Media](media.md) for the full flow)

Attaches an already-uploaded object to the problem.

| Field | Type | Rules |
|-------|------|-------|
| `key` | string | must start with `problems/<problemId>/` |
| `originalName` | string | 1–255 |
| `contentType` | enum | `image/jpeg` \| `image/png` \| `image/webp` |
| `size` | number | ≤ 10 MB |

**Response `200 OK`** — returns the updated problem.
