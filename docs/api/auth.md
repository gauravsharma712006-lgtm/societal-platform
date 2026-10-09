# Auth API

Account creation and login.

## Register

`POST /api/auth/register`

Creates a new user account. The default role is `USER`.

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `name` | string | 2–100 characters |
| `email` | string | valid email; normalized to lowercase |
| `password` | string | 6–100 characters |

**Responses**

- `201 Created`

```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "id": "64f...",
    "name": "Gaurav Test",
    "email": "gauravtest@example.com",
    "role": "USER",
    "isVerified": false
  }
}
```

- `400 Bad Request` — validation failed (field errors in `errors`)
- `409 Conflict` — `{ "status": "error", "message": "User with this email already exists" }`

## Login

`POST /api/auth/login`

**Request body**

| Field | Type | Rules |
|-------|------|-------|
| `email` | string | valid email |
| `password` | string | required |

**Responses**

- `200 OK`

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "64f...",
      "name": "...",
      "email": "...",
      "role": "USER",
      "isVerified": false
    }
  }
}
```

- `401 Unauthorized` — `{ "status": "error", "message": "Invalid email or password" }`

The returned `accessToken` must be sent as `Authorization: Bearer <token>` on protected endpoints. It expires after 7 days.
