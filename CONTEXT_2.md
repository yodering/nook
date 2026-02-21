# nook.boo — CONTEXT_2: Infrastructure & Database

> Supplements CONTEXT.md. Covers Railway hosting, Postgres, Prisma schema, and API routes.
> Vercel is no longer used — Railway hosts everything.

---

## Architecture Overview

```
nook.boo (domain)
        │
        ▼
Railway Web Service (Next.js + Bun)
        ├── NextAuth → Google OAuth
        ├── Google Calendar API
        ├── /api/user/preferences ──► Railway Postgres (Prisma ORM)
        └── /api/auth/[...nextauth]
```

**Two Railway services, one project:**
- `web` — Next.js app
- `postgres` — Railway managed Postgres

Railway auto-injects `DATABASE_URL` when services are linked. Prisma picks it up automatically.

---

## Railway Project Structure

```
Railway Project: nook-boo
├── web (Next.js app, built with Bun)
│   ├── Dockerfile
│   └── linked to postgres via DATABASE_URL env var
└── postgres (Railway managed Postgres)
```

---

## Dockerfile

Place this at the root of the project:

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bunx prisma generate
RUN bun run build

EXPOSE 3000
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start"]
```

---

## Environment Variables

Set these in Railway's web service dashboard:

```env
# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_SECRET=           # generate with: openssl rand -base64 32
NEXTAUTH_URL=https://nook.boo

# Postgres (auto-injected by Railway when services are linked)
DATABASE_URL=              # set automatically, no action needed
```

---

## Prisma Setup

### Installation
```bash
bun add prisma @prisma/client
bunx prisma init
```

### Schema — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  googleId  String   @unique
  email     String   @unique
  createdAt DateTime @default(now())

  overrides CalendarOverride[]
  settings  UserSettings?
}

model CalendarOverride {
  id          String  @id @default(cuid())
  userId      String
  calendarId  String  // Google Calendar ID
  displayName String?
  color       String?
  sortOrder   Int     @default(0)
  hidden      Boolean @default(false)
  pinned      Boolean @default(false)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, calendarId])
}

model UserSettings {
  id           String  @id @default(cuid())
  userId       String  @unique
  weekStartsOn Int     @default(1) // 1 = Monday, 0 = Sunday
  sidebarOpen  Boolean @default(true)

  user User @relation(fields: [userId], references: [id])
}
```

### Migrations
```bash
bunx prisma migrate dev --name init     # local dev
bunx prisma migrate deploy              # production (Railway)
```

---

## Data Responsibilities

| Data | Source of Truth | Notes |
|---|---|---|
| Calendar IDs | Google Calendar | Never duplicated in DB |
| Timed events | Google Calendar | Read/write via API |
| All-day todos | Google Calendar | All-day events, CRUD via API |
| Display name override | Railway Postgres | Per-user, per-calendar |
| Color override | Railway Postgres | Overwrites Google's color |
| Sort order | Railway Postgres | User-defined list order |
| Hidden/pinned flags | Railway Postgres | UI visibility controls |
| User settings | Railway Postgres | Week start, sidebar state |

---

## API Routes

### Updated `app/api/` structure

```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts          # NextAuth handler (unchanged)
├── calendars/
│   └── route.ts              # GET /api/calendars — fetch Google calendars + merge overrides
├── events/
│   └── route.ts              # GET /api/events — fetch events for week range
└── user/
    ├── preferences/
    │   └── route.ts          # GET + PATCH /api/user/preferences — calendar overrides
    └── settings/
        └── route.ts          # GET + PATCH /api/user/settings — user settings
```

### `GET /api/calendars`
Fetches user's Google Calendars, merges with their Postgres overrides, returns unified list.

```ts
// Returns:
{
  id: string           // Google Calendar ID
  name: string         // override name ?? Google name
  color: string        // override color ?? our pastel mapping
  sortOrder: number
  hidden: boolean
  pinned: boolean
}[]
```

### `PATCH /api/user/preferences`
Upserts a CalendarOverride row for a given calendarId.

```ts
// Body:
{
  calendarId: string
  displayName?: string
  color?: string
  sortOrder?: number
  hidden?: boolean
  pinned?: boolean
}
```

### `GET + PATCH /api/user/settings`
Reads or updates the UserSettings row.

---

## `lib/` Updates

```
lib/
├── google-calendar.ts    # unchanged — all Google API calls
├── auth.ts               # NextAuth config — add user upsert on sign-in
├── prisma.ts             # Prisma client singleton (NEW)
└── utils.ts              # unchanged
```

### `lib/prisma.ts` — Prisma singleton

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### `lib/auth.ts` — upsert user on sign-in

Add a `signIn` callback to NextAuth config that creates a User row in Postgres the first time someone logs in:

```ts
callbacks: {
  async signIn({ user, account }) {
    await prisma.user.upsert({
      where: { googleId: account.providerAccountId },
      update: { email: user.email },
      create: {
        googleId: account.providerAccountId,
        email: user.email,
      },
    })
    return true
  }
}
```

---

## Updated File Structure (additions only)

```
nook.boo/
├── Dockerfile                        # NEW — Railway build config
├── prisma/
│   ├── schema.prisma                 # NEW — DB schema
│   └── migrations/                   # NEW — auto-generated by Prisma
├── app/api/
│   ├── calendars/route.ts            # NEW — merged calendar list
│   └── user/
│       ├── preferences/route.ts      # NEW — calendar overrides CRUD
│       └── settings/route.ts         # NEW — user settings CRUD
└── lib/
    └── prisma.ts                     # NEW — Prisma client singleton
```

---

## What to Defer (not in v1)

- User settings table — hardcode defaults for now, add later
- Offline caching of events
- Analytics or search on event bodies
- Multi-device push sync (Google Calendar handles this already)

---

## Cost Summary

| Service | Cost |
|---|---|
| Railway ($20/mo plan) | $20/mo — covers web + postgres |
| nook.boo domain | ~$0.90/mo ($10.81/yr) |
| Google Cloud (OAuth + Calendar API) | Free within normal usage |
| **Total** | **~$21/mo** |
