# LabCare frontend

Responsive React + Vite dashboard for the LabCare laboratory operations system. It communicates with the Express backend only through the Axios service in `src/services/api.js`; it does not connect to Supabase.

## Run locally

1. Install Node.js 20 or newer.
2. From this directory, install dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env` and set `VITE_API_URL` to the Express server origin (defaults to `http://localhost:5000`).
4. Start the frontend:

   ```sh
   npm run dev
   ```

5. In another terminal, configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the backend's `.env`, then start Express:

   ```sh
   cd ..\backend
   node server.js
   ```

   Visit the Vite URL printed in the frontend terminal.
6. To verify a production build, run `npm run build`.

## Implemented backend integration

The current backend (`backend/server.js`) exposes:

| Method | Path | Frontend use |
| --- | --- | --- |
| GET | `/` | Dashboard connection/health check |
| POST | `/api/users` | Registration with `name`, `email`, `phone`, `role`, and `department` |

The registration form sends only fields accepted by the implemented route. It validates required name/email/role and optional phone number. Password-based registration is not sent or implied because the backend endpoint has no password field.

## Backend APIs still needed

The following features show explicit API-unavailable states instead of fabricated records. Route paths and payloads must be agreed with the backend developer; no endpoints have been guessed in the frontend.

- Authentication: login, password verification, and a documented session/token strategy. The login form currently reports that sign-in is unavailable.
- Dashboard totals and recent-activity summaries.
- Laboratories: list, details, create, update, delete.
- Equipment: list, details, create, update, delete, and filters for laboratory/category/status.
- Equipment categories: list, create, update, delete.
- Complaints: list, details, create, status/priority filters.
- Technicians and complaint assignments: list, assign, and assignment status updates.
- Repairs: list, create, and update.
- Maintenance: list/search, create, and equipment history.

The isolated placeholders in `src/services/api.js` raise `BackendApiUnavailableError` for unsupported resource operations until real API contracts are added.

## Testing

- `npm run build` checks dependency resolution and compiles the frontend.
- Start the Express backend and Vite frontend to test the dashboard health check.
- Submit Registration with a name, valid email, and role to exercise `POST /api/users`; verify the resulting user in the backend/database.
- Visit each sidebar page and use “View API requirements” to confirm unsupported features are clearly identified.
- Visit `/login` to verify validation and the honest unavailable-auth message.
- Resize to mobile/tablet widths and verify the navigation drawer and card layouts.
