# Synthea — Architecture Recap & Run Guide

A full-stack, role-based medical platform. **Backend:** Express + TypeScript + Prisma + PostgreSQL (pgvector), with an async BullMQ/Redis worker. **Frontend:** React 18 + Vite + Tailwind 4 + shadcn/Radix. Four roles — **Patient, Doctor, Nurse, Admin**. Features a RAG health chatbot, an async OCR→embedding→signals→recommendations→email pipeline, a consent-gated recommendation engine, a drug-interaction checker, gap-fill discount offers, RustFS file storage, and bilingual (EN/RO) UI.

> For the deep-dive narrative see [ARCHITECTURE.md](ARCHITECTURE.md). This file is the fast reference + run guide.

---

## 1. Application Structure

```
Synthea---Intelligent-Medical-Platform/
├── backend/                          Express + TypeScript API + worker
│   ├── src/
│   │   ├── index.ts                  API entry: middleware chain, 17 routers, /health
│   │   ├── config/
│   │   │   ├── env.ts                Zod-validated env (fails fast at startup)
│   │   │   ├── database.ts           Prisma client singleton
│   │   │   ├── logger.ts             Winston logger (console + file)
│   │   │   └── queue.ts              BullMQ connection (no-op if REDIS_URL unset)
│   │   ├── controllers/              17 HTTP handlers
│   │   ├── services/                 20 business-logic modules (see §2)
│   │   ├── routes/                   17 Express routers (auth + Zod validation per route)
│   │   ├── middleware/               auth, error, gdpr (audit), consent (requireConsent)
│   │   ├── validators/               Zod schemas per endpoint (+ generic validate())
│   │   ├── jobs/                     job catalogue + typed payloads
│   │   └── workers/                  standalone BullMQ worker process
│   ├── prisma/
│   │   ├── schema.prisma             22 models, 7 enums, pgvector, indexed hot paths
│   │   ├── migrations/               10 migrations (see §2)
│   │   ├── seed.ts                   demo users + appointments / records / reviews / invoices
│   │   ├── seed-recommendations.ts   demo recommendation pools + items
│   │   └── import-ddinter.ts         loads the DDInter drug-interaction dataset
│   ├── Dockerfile
│   └── package.json                  Scripts: dev / worker / build / start / prisma:* / seed:reco / import:ddinter
│
├── frontend/                         React 18 + Vite 6 + Tailwind 4 + Radix/shadcn
│   ├── src/
│   │   ├── lib/                      api, auth, services, types, i18n, translations,
│   │   │                             events (telemetry), RequireAuth
│   │   ├── app/
│   │   │   ├── App.tsx               <LanguageProvider><AuthProvider><RouterProvider/>
│   │   │   ├── routes.tsx            React Router 7 tree (public, /patient, /doctor, /nurse, /admin)
│   │   │   ├── components/           Layout/PatientLayout/NurseLayout/AdminLayout,
│   │   │   │                         TelemetryRoot, LanguageToggle, patient/, ui/
│   │   │   └── pages/                One folder per role + shared doctor pages
│   │   └── styles/
│   └── .env.example                  VITE_API_URL=http://localhost:5000/api
│
├── docker-compose.yml                postgres(pgvector) + redis + rustfs + mailpit + backend + worker + frontend
├── ARCHITECTURE.md                   Full architecture & feature narrative
└── README.md
```

---

## 2. Architecture

### System overview

```
Frontend ──HTTPS/JWT──▶ Backend ──Prisma──▶ PostgreSQL 16 + pgvector
                          │ enqueue (BullMQ)
                          ▼
                        Redis ◀── Worker (separate process) ──▶ OCR / embeddings / LLM / email
                          │                                         │
              RustFS (S3) · OpenRouter (LLM+embed) · Tesseract.js · Mailpit/SMTP
```

### Request flow (a typical authenticated call)

```
Browser ── Authorization: Bearer <JWT> ──▶ Express (:5000)
  ├─ helmet / cors (FRONTEND_URL) / rateLimit (100/15min/IP) / express.json (10MB)
  ├─ gdprLogger → fire-and-forget audit log
  └─ /api/<area> router
       ├─ authenticate        → verify JWT, attach req.user
       ├─ authorize(roles)    → 403 if role not allowed
       ├─ requireConsent(flag)→ 403 if consent missing (personalization routes)
       ├─ validate(zod)       → 400 + field errors
       └─ controller → Prisma + services
                       └─ enqueue(job) → Redis → worker (OCR, embed, signals, recs, email)
```

All errors funnel to the centralized `errorHandler` (Winston + `ApiError`). `GET /health` pings Postgres. `SIGINT`/`SIGTERM` disconnect Prisma gracefully.

### Async pipeline (worker)

One BullMQ queue (`synthea-jobs`), dispatched by job name in a **separate worker process** (`npm run worker`). Chain after an upload:
`extractText` (OCR) → `embedDocument` (chunk+embed, profiling-gated) → `extractSignals` (LLM tags) → `generateRecommendations` → `sendEmail`. Plus a repeatable `weeklyDigest` (Mon 09:00). No `REDIS_URL` ⇒ `enqueue()` is a logged no-op and the API still runs.

### Service layer (`backend/src/services/`)

| Group | Services |
|---|---|
| Core HIS | `appointment` (slots), `billing` (invoices + Stripe stub), `storage` (RustFS + presigned URLs) |
| Documents / RAG | `ocr`, `ocr-pipeline`, `upload-context`, `chunking`, `embedding`, `document-embedding`, `retrieval` (pgvector) |
| Personalization | `signal` (LLM tags), `recommendation`, `digest`, `email`, `gap-offer` |
| Privacy / analytics | `consent`, `event`, `queue` |
| Clinical | `ai` (chat + triage/DSS stubs), `interaction` (drug-drug) |

### Auth model

| Token | TTL | Payload | localStorage | Sent as |
|---|---|---|---|---|
| Access | 15 m | `{ id, email, role }` | `synthea_access_token` | `Authorization: Bearer …` |
| Refresh | 7 d | `{ id }` | `synthea_refresh_token` | POST body to `/auth/refresh` |

[api.ts](frontend/src/lib/api.ts) intercepts `401`, calls `/auth/refresh` **once**, and retries. **Roles:** `ADMIN`, `DOCTOR`, `NURSE`, `PATIENT`. `/auth/register` **only ever creates `PATIENT`**. Hardening: bcrypt (12 rounds), Helmet, CORS whitelist, rate limiting, soft deletes (`isActive=false`), GDPR audit log, consent-gated personalization.

### Database (Prisma + Postgres 16 + pgvector)

**22 models** — User, PatientProfile, DoctorProfile, Appointment, MedicalService, Review, MedicalRecord, Invoice, OcrDocument, **DocumentChunk** (pgvector), TriageRecord, AiChatSession, AuditLog, **UserConsent**, **ConsentAudit**, **ActivityEvent**, **UserSignal**, **Pool**, **PoolItem**, **Recommendation**, **Drug**, **DrugInteraction**.

**7 enums** — `Role` (ADMIN/DOCTOR/PATIENT/NURSE), `Gender`, `AppointmentStatus`, `InvoiceStatus`, `TriageLevel`, `RecommendationStatus` (PENDING/DELIVERED/DISMISSED), `DeliveryChannel` (BALLOON/EMAIL).

**Notable** — `DocumentChunk.embedding vector(1536)` (HNSW cosine index, raw-SQL queried); `UserConsent` flags default `false`; `UserSignal.sourceDocId` cascade-deletes (right-to-erasure); `Appointment.originalFee/discountPct/discountReason` (gap-fill snapshot); `DrugInteraction.keyA/keyB` canonically ordered.

**Migrations** — `schema_alignment` → `add_nurse_role` → `add_medical_services` → `extend_ocr_document_for_uploads` → `add_drug_interactions` → `add_document_chunks` → `add_activity_events` → `add_pgvector_and_consent` → `add_user_signals` → `add_recommendation_pools` (10).

### AI subsystem (`/api/ai`)

**Provider:** OpenRouter — default LLM `openai/gpt-4o-mini`, embeddings `openai/text-embedding-3-small`. Absent key ⇒ chat stub / zero-vector embeddings / signal extraction skipped.

- **Chat** (`POST /ai/chat`) — **real, RAG-grounded**: for a patient, embeds the message and retrieves the top-5 nearest `document_chunks` (pgvector); injects them as context (falls back to recent OCR'd file text when embeddings are off or profiling not consented). Non-diagnostic EN/RO persona, prompt-injection-hardened, history in `AiChatSession`. *(No function-calling tools — single-shot retrieval-grounded completion.)*
- **Triage** (`POST /ai/triage`) — **stub**: keyword urgency → `TriageLevel`.
- **Decision support** (`POST /ai/decision-support`, DOCTOR/ADMIN) — **stub**.

### Route & page map (frontend)

```
Public:   /  ·  /auth/staff-login  ·  /patient/auth/{login,signup,forgot-password,profile-setup}
Patient:  /patient  /patient/{appointments,history,chat,notifications,blog,profile,settings}  /patient/doctors/:id
Doctor:   /doctor  /doctor/{patients[/:id],schedule,ai-assistant,billing}
Nurse:    /nurse  /nurse/{tasks,notifications}
Admin:    /admin  /admin/{staff,billing,content,settings}
```

---

## 3. API Reference (base path `/api`)

| Area | Endpoints |
|---|---|
| **Auth** `/auth` | `POST /register` · `/login` · `/refresh` · `/logout` · `GET\|PUT /profile` · `PUT /change-password` |
| **Patients** `/patients` | `GET\|POST /` (ADMIN/DOCTOR) · `GET\|PUT /:id` · `DELETE /:id` (ADMIN) · `GET\|POST /:id/medical-records` · `GET /:id/medical-records/:recordId` |
| **Doctors** `/doctors` | `GET /` · `GET /by-user/:userId` · `GET /:id` · `POST /profile` (ADMIN) · `PUT /:id/profile` (ADMIN/DOCTOR) |
| **Appointments** `/appointments` | `GET /` · `GET /available-slots` · `GET /gap-offer` · `GET /optimized-schedule` (ADMIN/DOCTOR) · `POST /` · `GET\|PUT /:id` · `DELETE /:id/cancel` |
| **Services** `/services` | `GET /` · `GET /specialties` · `GET /:id` |
| **Billing** `/billing` | `GET /invoices` · `GET /report` · `POST /invoices` (ADMIN) · `GET /invoices/:id` · `PUT /invoices/:id` (ADMIN) · `POST /invoices/:id/pay` |
| **AI** `/ai` | `POST /chat` · `GET /chat/history` · `POST /triage` · `POST /decision-support` (DOCTOR/ADMIN) |
| **Uploads** `/uploads` | `GET /` · `POST /` (stream) · `GET /:id/download` (presigned) · `DELETE /:id` |
| **OCR** `/ocr` | `POST /upload` · `GET /patient/:patientId` · `GET /:id` · `POST /:id/reprocess` |
| **Reviews** `/reviews` | `POST /` (PATIENT) · `GET /doctor/:doctorId` · `GET /:id` |
| **Interactions** `/interactions` | `GET /drugs` (autocomplete) · `POST /check` (DOCTOR/ADMIN/NURSE) |
| **Consent** `/consent` | `GET /` · `PUT /` (self-scoped; writes ConsentAudit) |
| **Events** `/events` | `POST /` (analytics-consent-gated; sendBeacon-friendly) |
| **Recommendations** `/recommendations` | `GET /pending` · `POST /generate` · `POST /:id/ack` · `POST /:id/dismiss` · `POST /digest` (ADMIN) |
| **Pools** `/pools` | `GET /` · `POST /` · `PATCH\|DELETE /:id` · `POST /:id/items` · `PATCH\|DELETE /items/:itemId` (all ADMIN) |
| **Email** `/email` | `GET /unsubscribe` (public, signed token) |
| **Admin** `/admin` | `GET /dashboard` · `GET /users` · `GET /users/:id` · `PUT /users/:id` · `DELETE /users/:id` · `GET /audit-logs` |

---

## 4. Running the application

Full stack needs Postgres (pgvector), Redis, RustFS, and SMTP (Mailpit in dev). Docker provides all four.

### One-time setup

```bash
git clone <this-repo> && cd Synthea---Intelligent-Medical-Platform

# Infra
docker compose up postgres redis rustfs mailpit -d
docker compose ps                 # wait until healthy

# Backend
cd backend
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET (≥32), JWT_REFRESH_SECRET (≥32).
# Optional: OPENROUTER_API_KEY (chat/embeddings/signals), REDIS_URL (async),
#           RUSTFS_* (uploads), SMTP_* (email).
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed                # demo accounts + generated doctors/patients/nurses
npm run seed:reco                 # demo recommendation pools (optional)
npm run import:ddinter            # drug-interaction dataset (optional)

# Frontend
cd ../frontend
cp .env.example .env              # VITE_API_URL=http://localhost:5000/api
npm install
```

Or run the **whole stack** (incl. worker + frontend): `docker compose up -d`.

### Run dev servers

```bash
# Terminal 1 — backend API (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — worker (async pipeline; needs Redis)
cd backend && npm run worker

# Terminal 3 — frontend (http://localhost:3000)
cd frontend && npm run dev
```

Mailpit UI (sent digest emails): `http://localhost:8025`. RustFS console: `http://localhost:9001`.

### Demo credentials (created by `prisma db seed`)

| Role    | Email                | Password       |
|---------|----------------------|----------------|
| Admin   | admin@synthea.ro     | `Admin@1234!`  |
| Doctor  | doctor@synthea.ro    | `Doctor@1234!` |
| Patient | patient@synthea.ro   | `Patient@1234!`|

Also generates extra doctors (`dr.*@synthea.ro`), patients (`pacient.*@synthea.ro`), and 10 nurses (`asistent.*@synthea.ro` / `Nurse@1234!`), plus demo appointments, records, reviews and invoices.

---

## 5. Quick smoke tests

```bash
curl http://localhost:5000/health        # → { status: "ok", database: "connected" }

curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doctor@synthea.ro","password":"Doctor@1234!"}'

TOKEN="paste-accessToken-here"
curl -s http://localhost:5000/api/auth/profile -H "Authorization: Bearer $TOKEN"

# Type-check / build (no DB required)
cd backend && npx tsc --noEmit
cd frontend && npm run build
```

### Frontend flow checklist

1. Open `http://localhost:3000` → role selection. Toggle EN/RO via the floating language button.
2. **Patient**: *Patient* → login (or sign up → profile setup → `/patient`).
3. **Doctor / Admin / Nurse**: pick the card → `/auth/staff-login` → seed credentials.
4. **Book Appointment** modal — live `/api/doctors`, `/api/appointments/available-slots`, `/api/appointments` (supports the discounted gap slot).
5. **Medical files** — drag-and-drop streams to RustFS; background worker runs OCR + (with profiling consent) embedding → the chatbot can answer about them via RAG.
6. **AI chatbot** — surfaces recommendation balloons + gap-slot offers; hits `/api/ai/chat`.
7. **Settings** → toggle GDPR consent flags. As **Admin**, `/admin/content` manages recommendation pools; `/admin` shows KPIs + audit logs.

---

## 6. Useful commands

| Task | Command (`backend/`) |
|------|----------------------|
| API dev (hot reload) | `npm run dev` |
| Worker dev (hot reload) | `npm run worker` |
| Production build / run | `npm run build && npm start` (worker: `npm run start:worker`) |
| Prisma Studio | `npx prisma studio` |
| New migration | `npx prisma migrate dev --name <name>` |
| Re-seed | `npx prisma db seed` · `npm run seed:reco` · `npm run import:ddinter` |
| Type-check only | `npx tsc --noEmit` |

| Task | Command (repo root) |
|------|---------------------|
| Bring up infra | `docker compose up postgres redis rustfs mailpit -d` |
| Bring up full stack | `docker compose up -d` |
| Tail logs | `docker compose logs -f` |
| Reset volumes (wipes DB + files!) | `docker compose down -v` |

---

## 7. Environment variables (`backend/.env`)

| Var | Required | Default | Notes |
|-----|----------|---------|-------|
| `DATABASE_URL` | yes | — | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | yes | — | ≥ 32 chars, validated at startup |
| `NODE_ENV` / `PORT` | no | `development` / `5000` | |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | no | `15m` / `7d` | |
| `FRONTEND_URL` | no | `http://localhost:3000` | CORS origin |
| `LOG_LEVEL` | no | `info` | |
| `REDIS_URL` | no | — | enables the async pipeline; absent ⇒ enqueue no-op |
| `OPENROUTER_API_KEY` | no | — | enables chat/embeddings/signals; absent ⇒ stub |
| `OPENROUTER_MODEL` | no | `openai/gpt-4o-mini` | chat LLM |
| `EMBEDDING_MODEL` | no | `openai/text-embedding-3-small` | 1536-dim |
| `OPENROUTER_REFERER` / `OPENROUTER_TITLE` | no | localhost / "Synthea Medical Platform" | |
| `SMTP_HOST` / `SMTP_PORT` | no | `localhost` / `1025` | Nodemailer (Mailpit in dev) |
| `SMTP_FROM` | no | `Synthea <no-reply@synthea.local>` | |
| `APP_PUBLIC_URL` / `API_PUBLIC_URL` | no | `:3000` / `:5000` | email CTA / unsubscribe links |
| `EMAIL_MARKETING_ENABLED` | no | `true` | |
| `SLOT_GAP_DISCOUNT_PCT` / `SLOT_GAP_START_HOUR` | no | `20` / `17` | gap-fill offers |
| `MAX_FILE_SIZE_MB` | no | `1024` | upload cap |
| `OCR_PROVIDER` | no | `tesseract` | tesseract \| gcp \| azure |
| `RUSTFS_ENDPOINT` | no | `http://localhost:9000` | internal S3 endpoint |
| `RUSTFS_PUBLIC_ENDPOINT` | no | — | host-reachable endpoint for presigned URLs |
| `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` | no | `synthea_rustfs_access` / `..._secret` | |
| `RUSTFS_BUCKET` / `RUSTFS_REGION` | no | `synthea-patient-uploads` / `us-east-1` | |
| `PRESIGNED_URL_TTL_SECONDS` | no | `300` | download URL expiry |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | no | — | billing (stub) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | no | — / `gpt-4-turbo` | legacy, unused |

The server **fails fast** at startup if any required value is missing or too short.

### `frontend/.env`

| Var | Required | Notes |
|-----|----------|-------|
| `VITE_API_URL` | yes | e.g. `http://localhost:5000/api` |
