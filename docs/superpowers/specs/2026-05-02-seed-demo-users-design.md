Title: Seed demo users via create-user Edge Function
Date: 2026-05-02
Owners: OpenCode + project owner

## Goal
Provide a repeatable way to create real Supabase Auth users so the login flow works end-to-end with known credentials:

- student / student
- instructor / instructor
- admin / admin

The seed should work against the hosted Supabase project and rely on the already-deployed `create-user` Edge Function.

## Non-goals
- Seeding sessions, QR tokens, or attendance records.
- Modifying database schema or policies.
- Changing the login flow.

## Current Context
- The app normalizes usernames to emails using `username@system.local` in `src/services/api.ts`.
- The `create-user` Edge Function accepts `{ username, password, name, role, groupName }` and creates both Auth user and `User` table row.
- Local config uses `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## Proposed Approach
Create a Node script (`scripts/seed_users.js`) that calls the deployed `create-user` Edge Function for the three demo users.

### Architecture
- Script reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env` (reuse existing app env vars).
- For each user, POST JSON to `https://<project>.supabase.co/functions/v1/create-user` with `Authorization` and `apikey` headers.
- Script reports `created`, `already exists`, or `failed` per user and exits non-zero on unexpected failures.

### Data Flow
1. Load environment variables from `.env`.
2. Build a list of users:
   - student: role `student`, username `student`, name `Student`, password `student`, groupName `A`.
   - instructor: role `instructor`, username `instructor`, name `Instructor`, password `instructor`, groupName `null`.
   - admin: role `admin`, username `admin`, name `Admin`, password `admin`, groupName `null`.
3. For each user:
   - Send `POST` to `/functions/v1/create-user` with JSON body.
   - Include headers:
     - `Authorization: Bearer <anon-key>`
     - `apikey: <anon-key>`
     - `Content-Type: application/json`
   - Interpret response:
     - Success message -> mark created.
     - Error message containing "already exists" or "duplicate" -> mark as already exists.
     - Otherwise -> fail with error details.

### Error Handling
- If required env vars are missing, exit with a clear message.
- If the function returns 401/403, report that JWT verification failed (function requires a valid JWT).
- If any user fails for a non-duplicate reason, script exits with non-zero status.
- Never log plaintext passwords.

### Testing / Verification
- Update `.env` with the Supabase URL + anon key for the hosted project.
- Run `node scripts/seed_users.js`.
- Verify login in the app using:
  - username: `student`, password: `student`
  - username: `instructor`, password: `instructor`
  - username: `admin`, password: `admin`

## Risks / Mitigations
- If the Edge Function is not deployed or has `verify_jwt` without proper auth, the script will fail. The script will surface the error message so the operator can resolve deployment/configuration issues.

## Open Questions
- None (scope confirmed: users only).
