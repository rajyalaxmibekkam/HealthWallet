# HealthWallet

India-first, secure, multilingual digital healthcare ecosystem for Patients, Doctors, Labs, Pharmacies, Hospitals & Admins.

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (port 5000)
- **Backend**: Express.js + TypeScript (port 3001)
- **Database**: Replit PostgreSQL (auto-provisioned)
- **Auth**: JWT (7-day expiry, stored in localStorage as `hw_token`)

## Project Structure

```
server/        Express API server (port 3001)
  index.ts     Entry point, DB schema init
  db.ts        PostgreSQL pool connection
  middleware/  JWT auth middleware
  routes/      auth, patients, doctors, appointments, admin
client/        React frontend (port 5000 via Vite)
  src/
    pages/     patient/, doctor/, admin/ dashboards
    context/   AuthContext (global user state)
    lib/api.ts Fetch wrapper (proxies /api → :3001)
```

## Running

```bash
npm run dev   # concurrently runs server (3001) + vite (5000)
```

## User Roles

- **patient** — health records, appointments, vitals, prescriptions
- **doctor** — manage appointments, patients, write records/prescriptions
- **admin** — user management, platform stats
- **lab / pharmacy / hospital** — accounts exist; dashboards to be built

## User Preferences

- Keep the existing project structure
- Build features incrementally without restructuring
