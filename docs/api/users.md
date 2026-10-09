# Users API

All endpoints require a Bearer token.

## Get current user

`GET /api/users/me`

Returns the authenticated user (password excluded).

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "id": "64f...",
    "name": "...",
    "email": "...",
    "role": "USER",
    "isVerified": false
  }
}
```

- `404 Not Found` — user no longer exists

## Update profile

`PATCH /api/users/me`

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 2–100 characters |

**Response `200 OK`**

```json
{
  "status": "success",
  "message": "Profile updated successfully",
  "data": {
    "id": "64f...",
    "name": "...",
    "email": "...",
    "role": "USER",
    "isVerified": false
  }
}
```

## List students

`GET /api/users/students`

Returns all users with role `STUDENT` (used when inviting teammates).

**Response `200 OK`**

```json
{
  "status": "success",
  "data": {
    "students": [
      { "_id": "64f...", "name": "...", "email": "...", "role": "STUDENT", "isVerified": false }
    ]
  }
}
```
