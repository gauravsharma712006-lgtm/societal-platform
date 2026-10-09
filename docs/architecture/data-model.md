# Data Model

MongoDB collections (Mongoose models). All documents carry `createdAt` / `updatedAt` via `timestamps: true`.

## Entities

### User
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | 2–100 |
| `email` | string | unique, lowercased, trimmed |
| `password` | string | bcrypt hash (cost 12) |
| `role` | enum | `USER` (default) \| `STUDENT` \| `UNIVERSITY` \| `MENTOR` \| `ORGANIZATION` \| `ADMIN` |
| `isVerified` | boolean | default `false` |

### Problem
| Field | Type | Notes |
|-------|------|-------|
| `title` | string | 5–150 |
| `description` | string | 20–5000 |
| `category` | enum | 8 categories |
| `location.address` / `city` / `state` | string | required |
| `location.coordinates.latitude` / `longitude` | number | optional |
| `status` | enum | `REPORTED` (default) \| `UNDER_REVIEW` \| `VERIFIED` \| `REJECTED` |
| `priority` | enum | `LOW` \| `MEDIUM` (default) \| `HIGH` \| `CRITICAL` |
| `reportedBy` | ObjectId → User | |
| `media` | array | `{ key, originalName, contentType, size }` |
| `history` | array | `{ action, from, to, changedBy → User, reason }` |

### Challenge
| Field | Type | Notes |
|-------|------|-------|
| `title`, `description` | string | |
| `problem` | ObjectId → Problem | must be `VERIFIED` |
| `createdBy` | ObjectId → User | admin |
| `status` | enum | `DRAFT` (default) \| `OPEN` \| `CLOSED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |
| `deadline` | date | |
| `skills` | string[] | |
| `eligibility` | string | |

### Team
| Field | Type | Notes |
|-------|------|-------|
| `name`, `description` | string | |
| `challenge` | ObjectId → Challenge | |
| `createdBy` | ObjectId → User | |
| `status` | enum | `ACTIVE` (default) \| `COMPLETED` \| `CANCELLED` |

### TeamMember
| Field | Type | Notes |
|-------|------|-------|
| `team` | ObjectId → Team | |
| `user` | ObjectId → User | |
| `role` | enum | `LEADER` \| `MEMBER` |
| `joinedAt` | date | |

Unique index on `(team, user)`.

### TeamInvitation
| Field | Type | Notes |
|-------|------|-------|
| `team` | ObjectId → Team | |
| `invitedUser` | ObjectId → User | must be `STUDENT` |
| `invitedBy` | ObjectId → User | team leader |
| `status` | enum | `PENDING` (default) \| `ACCEPTED` \| `REJECTED` \| `CANCELLED` |
| `respondedAt` | date | optional |

### Application
| Field | Type | Notes |
|-------|------|-------|
| `challenge` | ObjectId → Challenge | |
| `applicant` | ObjectId → User | |
| `motivation` | string | 20–2000 |
| `skills` | string[] | |
| `status` | enum | `PENDING` (default) \| `ACCEPTED` \| `REJECTED` |
| `reviewedBy` | ObjectId → User | optional |
| `reviewNote` | string | optional |

Unique index on `(challenge, applicant)`.

## Relationships

```text
User 1─┬─n Problem   (reportedBy)
User 1─┬─n Challenge (createdBy)
User 1─┬─n Team      (createdBy)
User 1─┬─n Application (applicant)

Problem 1─1 Challenge (a verified problem may have one active challenge)

Challenge 1─n Team
Challenge 1─n Application

Team 1─n TeamMember
Team 1─n TeamInvitation
TeamMember n─1 User
TeamInvitation n─1 User (invitedUser / invitedBy)
```

## State machines

**Problem:** `REPORTED → UNDER_REVIEW → VERIFIED | REJECTED`; `REJECTED → UNDER_REVIEW`; `VERIFIED` terminal.

**Challenge:** `DRAFT → OPEN | CANCELLED`; `OPEN → CLOSED | CANCELLED`; `CLOSED → IN_PROGRESS → COMPLETED`.

**Application:** `PENDING → ACCEPTED | REJECTED`.

**TeamInvitation:** `PENDING → ACCEPTED | REJECTED`.
