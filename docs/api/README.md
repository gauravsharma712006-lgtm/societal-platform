# Societal Platform — API Reference

Base URL, authentication, and conventions for the Societal Platform backend API.

## Base URL

- Development: `http://localhost:5000/api`

## Authentication

Most endpoints require a JSON Web Token (JWT). Obtain one from `POST /auth/login` and send it as:

```
Authorization: Bearer <access-token>
```

The access token is valid for **7 days** and carries `{ userId, role }`.

## Roles

| Role | Meaning |
|------|---------|
| `USER` | Default account; can report problems |
| `STUDENT` | Applies to challenges, forms teams |
| `MENTOR` | Reserved for future mentor workflows |
| `UNIVERSITY` | Reserved for future university workflows |
| `ORGANIZATION` | Reserved for future organization workflows |
| `ADMIN` | Verifies problems, manages challenges, reviews applications |

## Response envelope

Successful responses:

```json
{
  "status": "success",
  "message": "optional message",
  "data": {}
}
```

Errors:

```json
{
  "status": "error",
  "message": "Human-readable message",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

`errors` is present only on validation (`400`) failures.

## Common status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation failed or invalid state transition |
| 401 | Missing, invalid, or expired token |
| 403 | Authenticated but not authorized for the role |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already exists) |
| 500 | Internal server error |

## Endpoints

- [Auth](auth.md) — `POST /auth/register`, `POST /auth/login`
- [Users](users.md) — `GET/PATCH /users/me`, `GET /users/students`
- [Problems](problems.md) — report, list, status/priority, history, media
- [Media](media.md) — S3 presigned upload/download URLs
- [Challenges](challenges.md) — create/list/get/update, status transitions
- [Teams](teams.md) — create teams, members
- [Team invitations](team-invitations.md) — invite, accept/reject
- [Applications](applications.md) — apply, review
