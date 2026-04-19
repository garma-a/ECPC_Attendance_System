# ECPC Attendance System

Role-based attendance platform for ECPC built with React, Vite, Supabase, and Edge Functions. Instructors generate rotating QR codes, students scan to register attendance, and admins manage users and records.

## Overview

This project is implemented as a frontend-first architecture backed by Supabase services (Auth, Postgres, and Edge Functions).

- Frontend: React + Vite + TypeScript
- Data/Auth: Supabase
- State management: Zustand
- Data fetching/cache: TanStack Query
- Charts and reporting: Recharts
- QR scanning and generation: `html5-qrcode`, `qrcode.react`

## Core Features

- Authentication with role-aware routing (`student`, `instructor`, `admin`)
- Session creation and management for instructors
- QR token generation and expiration flow
- Attendance recording with duplicate protection
- Student dashboard with attendance stats and weekly chart
- Instructor live attendance and CSV export
- Admin panel for users, attendance records, and sessions
- Announcements with threaded comments/replies
- Study resources management
- Arabic/English support with RTL handling

## Repository Structure

```text
.
|-- src/
|   |-- pages/                 # Role-based screens
|   |-- services/api.ts        # Supabase data access layer
|   |-- store/                 # Zustand slices
|   |-- components/            # Shared UI
|   `-- types/                 # App domain types
|-- supabase/
|   |-- config.toml
|   `-- functions/
|       |-- create-user/
|       `-- delete-user/
|-- tests/                     # Vitest setup helpers
`-- scripts/                   # Utility and integration scripts
```

## Roles and Main Pages

- Student
  - Dashboard with attendance KPIs and weekly breakdown
  - QR scan page
  - Announcements and study resources
- Instructor
  - Session creation and QR display/rotation
  - Live attendance table + CSV export
  - Announcements and student directory
- Admin
  - User management (create/update/delete)
  - Attendance record management
  - Sessions overview

## Tech Stack

- React 18 + TypeScript
- Vite 5
- Supabase JS SDK
- TanStack Query 5
- Zustand 5
- Tailwind CSS 3
- Vitest + Testing Library

## Prerequisites

- Node.js 18+
- npm
- A Supabase project (for Auth, database, and Edge Functions)

## Environment Variables

Create `.env` in the project root (or copy from `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

The app will fail fast at startup if either variable is missing.

## Local Development

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

```bash
cp .env.example .env
```

Fill in your Supabase values.

### 3) Run dev server

```bash
npm run dev
```

Open `http://localhost:5173`.

## Tunneling and Remote Device Testing

The Vite config includes optional Pinggy support for HMR over secure tunnels.

Example:

```bash
PINGGY=true npm run dev
```

This enables tunnel-friendly HMR settings in `vite.config.js`.

## Available Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run test` - run Vitest test suite

## Supabase Edge Functions

This project includes two Edge Functions used by admin workflows:

- `create-user` - creates auth user + profile row
- `delete-user` - deletes user with role checks and cleanup

Function source paths:

- `supabase/functions/create-user/index.ts`
- `supabase/functions/delete-user/index.ts`

## Testing

Run tests with:

```bash
npm run test
```

Tests are located in:

- `src/pages/*.test.tsx`
- `src/store/store.test.ts`

## Deployment Notes

- A production `vercel.json` is included for frontend deployment.
- Ensure Supabase project policies and function secrets are configured before production rollout.
- Use secure, project-specific Supabase keys and never expose service role keys in the frontend.

## License

No license file is currently defined in this repository.
