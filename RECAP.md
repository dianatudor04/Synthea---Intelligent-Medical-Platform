# Synthea — Architecture Recap & Run Guide

A two-tier medical management platform: an Express + Prisma + PostgreSQL backend, and a React + Vite + Tailwind frontend with role-based portals (Patient, Doctor, Nurse, Admin).

---

## 1. Application Structure

```
Synthea---Intelligent-Medical-Platform/
├── backend/                          Express + TypeScript API
│   ├── src/
│   │   ├── index.ts                  Entry: middleware chain, routes, graceful shutdown
│   │   ├── config/
│   │   │   ├── env.ts                Zod-validated env vars (fails fast at startup)
│   │   │   ├── database.ts           Prisma client singleton
│   │   │   └── logger.ts             Winston logger (console + file transports)
│   │   ├── controllers/              HTTP handlers (auth, patient, appointment, billing,
│   │   │                             doctor, review, ai, ocr, admin)
│   │   ├── routes/                   Express routers, with auth + Zod validation per route
│   │   ├── services/                 Business logic (appointment slots, billing, AI, OCR)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    JWT verify + role guard
│   │   │   ├── error.middleware.ts   Centralized error handler + ApiError class
│   │   │   └── gdpr.middleware.ts    Audit log writer (fire-and-forget)
│   │   └── validators/               Zod schemas for every endpoint (+ generic validate())
│   ├── prisma/
│   │   ├── schema.prisma             10 models, 5 enums, indexes on hot paths
│   │   ├── migrations/               Prisma-generated SQL
│   │   └── seed.ts                   Demo Admin/Doctor/Patient (with profiles)
│   ├── Dockerfile                    Multi-stage build → dist + Prisma client
│   ├── package.json                  Scripts: dev / build / start / prisma:* / lint / test
│   └── .env.example                  All required env vars (JWT secrets ≥ 32 chars, etc.)
│
├── frontend/                         React 18 + Vite + Tailwind 4 + shadcn/ui
│   ├── src/
│   │   ├── main.tsx                  Mounts <App /> into #root
│   │   ├── lib/                      Backend integration layer
│   │   │   ├── api.ts                fetch wrapper, token storage, auto-refresh on 401
│   │   │   ├── auth.tsx              <AuthProvider> + useAuth(): login/register/logout
│   │   │   ├── services.ts           Domain helpers: patientsApi, doctorsApi, … aiApi
│   │   │   ├── types.ts              TS types mirroring backend response shapes
│   │   │   └── RequireAuth.tsx       Route guard with role allowlist
│   │   ├── app/
│   │   │   ├── App.tsx               <AuthProvider><RouterProvider /></AuthProvider>
│   │   │   ├── routes.tsx            React Router 7 tree (auth, /patient, /doctor,
│   │   │   │                         /nurse, /admin) — protected via RequireAuth
│   │   │   ├── components/
│   │   │   │   ├── Layout.tsx        Doctor sidebar (sidebar + bottom nav, logout)
│   │   │   │   ├── PatientLayout.tsx Patient bottom-nav layout
│   │   │   │   ├── NurseLayout.tsx   Nurse top+bottom nav (logout in header)
│   │   │   │   ├── AdminLayout.tsx   Admin sidebar with logout
│   │   │   │   ├── patient/          Booking modal, appointments list, calendar,
│   │   │   │   │                     medical files, blog cards, floating chatbot
│   │   │   │   └── ui/               shadcn/ui primitives
│   │   │   └── pages/                One folder per role + shared doctor pages
│   │   │       ├── RoleSelectionPage.tsx
│   │   │       ├── StaffLoginPage.tsx        (doctor/admin/nurse login)
│   │   │       ├── DashboardPage.tsx         (doctor home)
│   │   │       ├── PatientsPage.tsx          (doctor — patient list)
│   │   │       ├── PatientDetailPage.tsx
│   │   │       ├── SchedulePage.tsx
│   │   │       ├── AIAssistantPage.tsx
│   │   │       ├── BillingPage.tsx
│   │   │       ├── patient/                  signup / login / forgot-password /
│   │   │       │                             profile-setup / home / appointments /
│   │   │       │                             history / chat / profile / settings / blog
│   │   │       ├── nurse/                    patient list, tasks, notifications
│   │   │       └── admin/                    dashboard, staff, billing, settings
│   │   └── styles/
│   ├── package.json                  Vite + React + Tailwind 4 + Radix UI + react-router 7
│   └── .env.example                  VITE_API_URL=http://localhost:5000/api
│
├── docker-compose.yml                postgres + backend (frontend service stub exists)
├── documentation/api_testing_guide.md
├── report.md                          Full code review report
└── README.md
```

---

## 2. Architecture

### Request flow (a typical authenticated call)

```
Browser
  │  Authorization: Bearer <JWT>
  ▼
Express server (port 5000)
  ├─ helmet                 → security headers
  ├─ cors                   → only the configured FRONTEND_URL
  ├─ rateLimit              → 100 req / 15 min / IP
  ├─ express.json           → body parsing
  ├─ gdprLogger             → fire-and-forget audit log to AuditLog table
  └─ /api/<area> router
       ├─ authenticate      → verify JWT, load user, attach req.user
       ├─ authorize(roles)  → 403 if req.user.role ∉ roles
       ├─ validate(zod)     → reject bad body shape with 400 + field errors
       └─ controller        → orchestrates Prisma + services
            ├─ Prisma client  → typed Postgres queries (parameterized)
            └─ service layer  → AI, OCR, billing, appointment slots
                                (currently stubbed — ready for OpenAI / Stripe / Tesseract)
```

Errors converge on the `errorHandler` middleware, which logs via Winston and serializes
either an operational `ApiError` message or a generic 500.

### Auth model

| Token         | TTL  | Stored in localStorage | Sent as |
|---------------|------|------------------------|---------|
| Access token  | 15 m | `synthea_access_token` | `Authorization: Bearer …` |
| Refresh token | 7 d  | `synthea_refresh_token` | POST body to `/auth/refresh` |

The frontend's [api.ts](frontend/src/lib/api.ts) intercepts `401`, calls `/auth/refresh` once, and retries the original request. If refresh fails, it clears storage and the next render redirects to `/`.

Roles: `ADMIN`, `DOCTOR`, `PATIENT`. The `/auth/register` endpoint **only ever creates `PATIENT`**; staff accounts are provisioned by an admin (or via the seed).

### Database (Prisma + Postgres)

**Models** — User, PatientProfile, DoctorProfile, Appointment, MedicalRecord, Invoice, Review, OcrDocument, TriageRecord, AiChatSession, AuditLog.
**Indexes** — `appointments(doctorId, scheduledAt)`, `appointments(patientId)`, `appointments(status)`, `invoices(status)`, `invoices(patientId)`, `medical_records(patientId)`, `medical_records(doctorId)`, `reviews(doctorId)`, `reviews(patientId)`, `audit_logs(userId)`, `audit_logs(timestamp)`.
**Cascades** — Deleting a `User` cascades into their `PatientProfile` / `DoctorProfile`.
**Soft deletes** — `User.isActive = false` and the `deletePatient` controller deactivates the user instead of hard-deleting.

### Frontend integration

- Single source of truth: [auth.tsx](frontend/src/lib/auth.tsx) provider hydrates on mount by calling `GET /auth/profile`. Stale tokens are cleared automatically.
- All HTTP goes through one of the typed `*Api` helpers in [services.ts](frontend/src/lib/services.ts). No page calls `fetch` directly.
- Routes are protected by [RequireAuth](frontend/src/lib/RequireAuth.tsx) which checks role and redirects to the user's home page if they hit a forbidden URL.

---

## 3. Running the application

You need a running PostgreSQL. The easiest route is `docker compose up postgres -d`.

### One-time setup

```bash
# From the repo root
git clone <this-repo> && cd Synthea---Intelligent-Medical-Platform

# Backend
cd backend
cp .env.example .env
# Edit .env and set: DATABASE_URL, JWT_SECRET (≥32 chars), JWT_REFRESH_SECRET (≥32 chars)
npm install
npx prisma generate
npx prisma migrate deploy        # apply existing migrations
npx prisma db seed                # creates demo admin/doctor/patient (see below)

# Frontend
cd ../frontend
cp .env.example .env              # VITE_API_URL=http://localhost:5000/api
npm install
```

### Start Postgres (Docker)

```bash
# From repo root
docker compose up postgres -d
# wait until healthy
docker compose ps postgres
```

If you don't use Docker, install Postgres locally and create a database matching `DATABASE_URL` in `backend/.env`.

### Run dev servers (two terminals)

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:3000 by default)
cd frontend
npm run dev
```

Visit the URL Vite prints (typically `http://localhost:3000`).

### Demo credentials (created by `prisma db seed`)

| Role    | Email                  | Password      |
|---------|------------------------|---------------|
| Admin   | admin@synthea.ro       | `Admin@1234!` |
| Doctor  | doctor@synthea.ro      | `Doctor@1234!`|
| Patient | patient@synthea.ro     | `Patient@1234!` |

---

## 4. Quick smoke tests

### Backend health

```bash
# From any terminal
curl http://localhost:5000/health
# → { "status": "ok", "database": "connected", … }
```

### Login + authenticated call

```bash
# Login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doctor@synthea.ro","password":"Doctor@1234!"}'
# → { user: {...}, accessToken: "...", refreshToken: "..." }

# Use the accessToken in the next call
TOKEN="paste-accessToken-here"
curl -s http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Run the type checker / build (no DB required)

```bash
# Backend type-check
cd backend && npx tsc --noEmit

# Frontend production build
cd frontend && npm run build
```

### Frontend flow checklist

1. Open `http://localhost:3000` → role selection.
2. **Patient**: click *Patient* → `/patient/auth/login` (or *Sign up* → register a new patient → profile setup → `/patient`).
3. **Doctor / Admin / Nurse**: click their card → `/auth/staff-login?role=…` → log in with the seed credentials.
4. Try the **Book Appointment** modal on the patient home — it calls the live `/api/doctors`, `/api/appointments/available-slots`, and `/api/appointments` endpoints.
5. Talk to the AI assistant from the patient floating chatbot or the doctor's `/doctor/ai-assistant` — both hit `/api/ai/chat` (currently a stub response).
6. As **Admin**, visit `/admin` to see live KPIs + GDPR audit log entries.

---

## 5. Useful commands

| Task | Command (run in `backend/`) |
|------|-----------------------------|
| Start in dev (hot reload) | `npm run dev` |
| Production build | `npm run build && npm start` |
| Open Prisma Studio (DB GUI) | `npx prisma studio` |
| Create new migration after schema edit | `npx prisma migrate dev --name <name>` |
| Re-seed the database | `npx prisma db seed` |
| Type-check only | `npx tsc --noEmit` |

| Task | Command (run in `frontend/`) |
|------|------------------------------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| Preview built bundle | `npx vite preview` |

| Task | Command (run from repo root) |
|------|------------------------------|
| Bring up Postgres | `docker compose up postgres -d` |
| Tail Postgres logs | `docker compose logs -f postgres` |
| Bring everything down | `docker compose down` |
| Reset volumes (wipes DB!) | `docker compose down -v` |

---

## 6. Environment variables

### `backend/.env`

| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | yes | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | yes | ≥ 32 chars, validated at startup |
| `JWT_REFRESH_SECRET` | yes | ≥ 32 chars, validated at startup |
| `JWT_EXPIRES_IN` | no | default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | default `7d` |
| `PORT` | no | default `5000` |
| `FRONTEND_URL` | no | default `http://localhost:3000`; CORS origin |
| `OPENAI_API_KEY` | no | currently unused (stub) |
| `STRIPE_SECRET_KEY` | no | currently unused (stub) |
| `LOG_LEVEL` | no | default `info` |

The server **fails fast** at startup if any required value is missing or too short — check stdout for the Zod error.

### `frontend/.env`

| Var | Required | Notes |
|-----|----------|-------|
| `VITE_API_URL` | yes | e.g. `http://localhost:5000/api` |
