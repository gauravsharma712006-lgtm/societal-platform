# Architecture — Overview

High-level design of the Societal Platform.

## System context

```text
┌─────────────────────────────────────────────────────────┐
│  Web (React + TypeScript + Vite + Tailwind)             │
│  AuthContext · ProtectedRoute · pages                    │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP / JSON (Bearer JWT)
┌───────────────────────────▼─────────────────────────────┐
│  Express API (Node + TypeScript)                        │
│  routes → controllers → services → models               │
│  middleware: authenticate · authorize · validate        │
└──────────────┬──────────────────────────┬───────────────┘
               │ Mongoose                 │ AWS SDK (S3)
┌──────────────▼──────────────┐  ┌────────▼───────────────┐
│  MongoDB Atlas              │  │  AWS S3 (media)         │
│  (users, problems, ...)     │  │  presigned URLs          │
└─────────────────────────────┘  └────────────────────────┘
```

## Repository layout

```text
societal-platform/
├── server/   # Node + TypeScript + Express + Mongoose + AWS SDK
├── web/      # React + TypeScript + Vite + Tailwind + react-router
├── mobile/   # scaffolding only — not yet implemented
└── docs/     # this documentation
```

## Core workflow

```text
Citizen reports problem
      ↓
Admin verifies problem
      ↓
Verified problem → challenge
      ↓
Students apply / form teams
      ↓
Admin reviews applications
      ↓
(planned) teams collaborate → solution → implementation → impact
```

**Implemented span today:** report → verify → challenge → apply / team → review.

## Documents

- [Backend](backend.md) — server layers, middleware, security, error handling
- [Frontend](frontend.md) — routing, auth context, pages
- [Data model](data-model.md) — collections, relationships, state machines
