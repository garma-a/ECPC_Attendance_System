# Gemini CLI Context for attendanceACPC

## Project Overview
This project is a QR-Based Attendance System web application. The frontend is built using React, Vite, and TypeScript. While the original `README.md` references an Express backend, the codebase has been migrated to use Supabase as a Backend-as-a-Service (BaaS) for authentication, database, and Edge Functions.

The application features:
- **Authentication**: JWT-based authentication via Supabase Auth.
- **Dashboards**: Role-based dashboards for Students, Instructors, and Admins.
- **Attendance System**: Instructors generate auto-rotating QR codes, and students scan them to record attendance.
- **Bilingual UI**: Arabic and English support.
- **Visualization**: Charts for attendance breakdown using Recharts.

## Tech Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Backend/API**: Supabase (Database, Auth, and Edge Functions)
- **Testing**: Vitest & React Testing Library
- **QR Codes**: `html5-qrcode` for scanning, `qrcode.react` for generation

## Building and Running
To develop or build the application, use the following npm scripts:

- **Install dependencies:**
  ```bash
  npm install
  ```
- **Start development server:**
  ```bash
  npm run dev
  ```
  The dev server usually runs on `http://localhost:5173`. The `vite.config.js` is also configured to support exposing through a `Pinggy` tunnel.
- **Build for production:**
  ```bash
  npm run build
  ```
- **Preview production build:**
  ```bash
  npm run preview
  ```
- **Run tests:**
  ```bash
  npm run test
  ```

## Development Conventions
- **Supabase Integration**: All API calls should utilize the Supabase JS client (`src/supabaseClient.ts`). Supabase Edge Functions (found in `supabase/functions/`) are used for privileged actions like creating and deleting users.
- **State Management**: Zustand slices are located in `src/store/`. Add any new global state here (e.g. `authSlice.ts`, `languageSlice.ts`), and combine them in `src/store/index.ts`.
- **Type Safety**: Strictly define types and interfaces in `src/types/index.ts` to represent Supabase database structures.
- **Testing**: The project employs Vitest with `jsdom` and React Testing Library. Ensure tests run successfully without hydration or missing context errors when modifying UI components. Setup files are in `tests/setup.ts`.
- **Styling**: Tailwind CSS classes should be used for all component styling. The project supports RTL (Right-to-Left) languages, so layout considerations should respect bidirectional text.
