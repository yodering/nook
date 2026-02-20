# nook.boo — Project Context

## Overview

**nook.boo** is a clean, minimal weekly calendar + todo web app inspired by Amie (amie.so). It uses Google Calendar as its sole data layer — no custom backend, no database. Users log in with Google, and their calendars and todos are loaded directly from the Google Calendar API.

This is the **web app phase** of a larger project. A native Swift iOS/macOS app will follow as a separate codebase using the same Google Calendar backend.

---

## Core Philosophy

- **No AI bloat.** Just a beautiful, fast calendar client.
- **Google Calendar is the database.** All reads and writes go through the Google Calendar API.
- **Todos are all-day events.** Checking off a todo marks the Google Calendar event as complete (or deletes it — TBD).
- **Modules = Google Calendars.** Each calendar (e.g. "CSC364", "PE", "Work") maps to a color-coded module in the UI.
- **Zero backend to maintain.** Auth and data are fully handled by Google. App is hosted statically on Vercel.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Runtime | Bun | Faster installs and dev server, drop-in Node replacement |
| Framework | Next.js 14 (App Router) | File-based routing, API routes for OAuth, Vercel deployment |
| Auth | NextAuth.js | Handles Google OAuth + token refresh automatically |
| Styling | Tailwind CSS | Fast, utility-first, works great with component libraries |
| Animations | Framer Motion | Spring-based animations, Amie-like feel |
| Language | TypeScript | Type safety for Calendar API responses |
| Hosting | Vercel | Free tier, automatic deploys from GitHub |
| Data | Google Calendar API v3 | Sole data source — no custom DB |

---

## Design Language

Inspired heavily by Amie. Key aesthetic principles:

- **Dark mode by default** — deep charcoal background (`#1a1a1e`), not pure black
- **Soft rounded corners** — 12–16px border radius everywhere
- **Pastel event blocks** — muted, transparent pastels (dusty rose, muted teal, soft lavender, sage green, warm amber) with frosted glass effect
- **Spring animations** — nothing linear, everything feels alive (use Framer Motion spring configs)
- **SF Pro / Inter** typography — 600 headers, 500 event titles, 400 body
- **Accent color** — soft pink or coral for interactive elements
- **Subtle hierarchy** — spacing and weight over heavy borders or shadows

---

## Project Structure

```
nook.boo/
├── app/
│   ├── page.tsx                  # Landing page — nook.boo
│   ├── login/
│   │   └── page.tsx              # Login page with Google OAuth button
│   ├── calendar/
│   │   └── page.tsx              # Main calendar view (protected route)
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts      # NextAuth handler
├── components/
│   ├── calendar/
│   │   ├── WeekGrid.tsx          # 7-day week grid with time slots
│   │   ├── EventBlock.tsx        # Individual event pill
│   │   ├── TimeColumn.tsx        # Left-side hour labels
│   │   ├── DayColumn.tsx         # Single day column
│   │   ├── AllDayRow.tsx         # Strip at top for all-day events/todos
│   │   └── CurrentTimeLine.tsx   # Accent-colored current time indicator
│   ├── sidebar/
│   │   ├── Sidebar.tsx           # Collapsible left sidebar wrapper
│   │   ├── TodoList.tsx          # Grouped todo list (Today / This Week / Later)
│   │   ├── TodoItem.tsx          # Single todo with checkbox + completion animation
│   │   ├── TodoInput.tsx         # Quick-add input at top of sidebar
│   │   └── MiniCalendar.tsx      # Small month calendar highlighting current week
│   ├── layout/
│   │   ├── Header.tsx            # Week label, nav arrows, mini calendar toggle
│   │   └── AppShell.tsx          # Sidebar + main area layout wrapper
│   └── ui/                       # Reusable primitives
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── ColorDot.tsx
├── lib/
│   ├── google-calendar.ts        # All Google Calendar API calls (fetch events, create, update, delete)
│   ├── auth.ts                   # NextAuth config + Google provider setup
│   └── utils.ts                  # Date helpers, color mapping, misc utilities
├── hooks/
│   ├── useCalendar.ts            # Fetches events for current week, manages state
│   ├── useTodos.ts               # Filters all-day events into todos, handles check-off
│   └── useModules.ts             # Loads user's Google Calendars, maps to module colors
├── types/
│   └── index.ts                  # TypeScript types for Event, Todo, Module, etc.
├── styles/
│   └── globals.css               # Tailwind base + any custom CSS variables
└── public/
    └── ...                       # Favicon, og image, etc.
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — app name, tagline, "Login with Google" CTA |
| `/login` | Login page (can redirect straight to Google OAuth) |
| `/calendar` | Main app — protected, redirects to `/login` if not authed |
| `/api/auth/[...nextauth]` | NextAuth catch-all route |

---

## Google Calendar API — Key Operations

All API calls live in `lib/google-calendar.ts` and are called from hooks.

```
GET  /calendars                     → load user's calendars (modules)
GET  /calendars/{id}/events         → fetch events for date range
POST /calendars/{id}/events         → create new event or todo (all-day)
PATCH /calendars/{id}/events/{id}   → update event (e.g. mark todo complete)
DELETE /calendars/{id}/events/{id}  → delete event
```

---

## Data Model

### Module (= Google Calendar)
```ts
type Module = {
  id: string           // Google Calendar ID
  name: string         // e.g. "CSC364", "PE", "Work"
  color: string        // Mapped pastel hex from our palette
}
```

### Event
```ts
type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  moduleId: string     // Which calendar it belongs to
  isAllDay: boolean
}
```

### Todo (= all-day CalendarEvent)
```ts
type Todo = {
  id: string
  title: string
  date: Date           // The all-day date
  moduleId: string
  completed: boolean
}
```

---

## Auth Flow

1. User hits `/` — sees landing page
2. Clicks "Login with Google" → NextAuth initiates Google OAuth
3. Google redirects back with token — NextAuth stores session
4. User redirected to `/calendar`
5. Session includes `access_token` for Google Calendar API calls
6. Token refresh handled automatically by NextAuth

**Required Google OAuth scopes:**
```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/userinfo.email
```

---

## Module Color Palette

Each Google Calendar gets assigned a pastel from this palette (cycle through if more than 6):

```ts
const MODULE_COLORS = [
  '#E8A0A0', // dusty rose
  '#A0C4BC', // muted teal
  '#B8A0D4', // soft lavender
  '#A8C4A0', // sage green
  '#D4B896', // warm amber
  '#A0B8D4', // soft blue
]
```

---

## Key UX Details

- **Todo grouping:** "Today", "This Week", "Later" — derived from all-day event dates
- **Checking off a todo:** Triggers strikethrough + fade-out animation, then deletes (or marks complete) the Google Calendar event
- **Sidebar collapse:** Fluid width animation, persisted in localStorage
- **Week navigation:** Arrow buttons in header, smooth slide transition between weeks
- **Current time line:** Updates every minute, accent color with small dot on left
- **Today highlight:** Subtle background tint on today's column
- **Event hover:** `translateY(-2px)` lift + shadow increase via Framer Motion

---

## Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## Setup Checklist (for Claude Code)

- [ ] `bunx create-next-app@latest nook-boo --typescript --tailwind --app`
- [ ] Install deps: `bun add framer-motion next-auth`
- [ ] Set up Google Cloud Console project, enable Calendar API, create OAuth credentials
- [ ] Configure NextAuth with Google provider in `lib/auth.ts`
- [ ] Build `AppShell` layout with sidebar + main area
- [ ] Implement `WeekGrid` with dummy data first
- [ ] Wire up `lib/google-calendar.ts` and replace dummy data
- [ ] Build `TodoList` sidebar with grouping logic
- [ ] Landing page at `/`
- [ ] Deploy to Vercel, connect nook.boo domain

---

## Out of Scope (v1)

- AI features of any kind
- Custom backend / database
- Android app
- Event drag-and-drop (nice to have v2)
- Multiple users / sharing
- Notifications

---

## Future Phases

- **v2 (iOS/macOS):** Native Swift app using SwiftUI, same Google Calendar backend, submitted to App Store via TestFlight
- **v3:** Lock screen + home screen widgets via WidgetKit (Swift only)
