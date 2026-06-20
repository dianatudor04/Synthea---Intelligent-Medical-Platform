# Synthea — Intelligent Medical Platform

> Architecture & Implemented Features

A full-stack, role-based medical management platform: a classic Hospital Information System (patients, doctors, appointments, records, billing) augmented with an AI health assistant grounded in the patient's own documents (RAG over pgvector), an asynchronous document-processing pipeline, a privacy-gated personalized-recommendation engine, drug-interaction checking, OCR, S3-compatible file storage, a bilingual UI (EN/RO), and GDPR consent + audit logging.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Structure](#3-repository-structure)
4. [Backend Architecture](#4-backend-architecture)
5. [Asynchronous Pipeline (Queue + Workers)](#5-asynchronous-pipeline-queue--workers)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Data Model](#7-data-model)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [GDPR, Consent & Telemetry](#9-gdpr-consent--telemetry)
10. [AI Subsystem (Chat / RAG / Signals)](#10-ai-subsystem-chat--rag--signals)
11. [Recommendation Engine](#11-recommendation-engine)
12. [Drug-Interaction Checker](#12-drug-interaction-checker)
13. [Gap-Fill Discount Offers](#13-gap-fill-discount-offers)
14. [API Reference](#14-api-reference)
15. [Implemented Features](#15-implemented-features)
16. [Deployment & Infrastructure](#16-deployment--infrastructure)

---

## 1. System Overview

Synthea is a multi-tier application supporting four user roles — **PATIENT**, **DOCTOR**, **NURSE**, and **ADMIN** — each with a tailored interface and permission set. Beyond the synchronous request/response API, it runs an **asynchronous job pipeline** (BullMQ + Redis) in a separate worker process for everything slow or privacy-sensitive: OCR, embedding, LLM signal extraction, recommendation generation, and email.

```
┌──────────────┐  HTTPS / JWT  ┌──────────────┐   Prisma    ┌─────────────────┐
│  Frontend    │ ────────────▶ │   Backend    │ ──────────▶ │  PostgreSQL 16  │
│ React + Vite │ ◀──────────── │ Express + TS │ ◀────────── │  + pgvector     │
└──────────────┘               └──────┬───────┘             └─────────────────┘
                                      │ enqueue (BullMQ)
                                      ▼
                               ┌────────────┐   ┌──────────────┐
                               │   Redis    │ ◀ │   Worker     │  separate process
                               │  (queue)   │   │ (BullMQ jobs)│  `npm run worker`
                               └────────────┘   └──────┬───────┘
        ┌──────────┐  ┌────────────┐  ┌────────────┐   │
        │  RustFS  │  │ OpenRouter │  │Tesseract.js│ ◀─┘  (OCR, embeddings,
        │ (S3 obj) │  │ (LLM+embed)│  │   (OCR)    │       LLM, email)
        └──────────┘  └────────────┘  └─────┬──────┘
                                      ┌──────┴──────┐
                                      │  Mailpit /  │
                                      │  SMTP       │
                                      └─────────────┘
```

**Design principles**

- Strong typing end-to-end (TypeScript on both tiers)
- Runtime validation at the boundary (Zod schemas per endpoint)
- Role-based access control + **consent-based** access control enforced via middleware
- **Fast-and-dumb request path**: anything slow or special-category is enqueued and handled in the worker
- **Privacy by default**: every personalization capability is gated on an explicit, revocable consent flag (defaults `false`); enforcement is server-side
- Graceful degradation: missing `OPENROUTER_API_KEY`, `REDIS_URL`, or RustFS each degrade to a safe no-op/stub so the app still boots

---

## 2. Tech Stack

### Backend
| Concern | Technology |
|---|---|
| Runtime / Language | Node.js + TypeScript 5 |
| Web framework | Express.js 4.18 |
| Database | PostgreSQL 16 + **pgvector** extension |
| ORM | Prisma 5.10 (`postgresqlExtensions` preview) |
| Job queue | **BullMQ 5** on **Redis 7** (ioredis) |
| Auth | JWT (`jsonwebtoken`) — 15m access / 7d refresh |
| Validation | Zod 3.22 |
| Passwords | bcryptjs (12 salt rounds) |
| File upload | Busboy (streaming multipart) + AWS S3 SDK v3 |
| OCR | Tesseract.js 7 + `pdf-parse` |
| LLM + embeddings | **OpenRouter** (OpenAI-compatible) via `openai` SDK |
| Email | **Nodemailer** → Mailpit (dev) / any SMTP |
| Logging | Winston (console + file) |
| Security | Helmet, CORS, express-rate-limit |

### Frontend
| Concern | Technology |
|---|---|
| Library | React 18.3 |
| Build tool | Vite 6.3 |
| Styling | Tailwind CSS 4.1 |
| UI primitives | Radix UI + shadcn/ui patterns + MUI |
| Routing | React Router 7 |
| State | Context API (Auth, Language) |
| i18n | Custom Context provider (EN + RO) |
| Telemetry | `navigator.sendBeacon` event batching (consent-gated) |
| HTTP | Fetch wrapper with auto-refresh on 401 |

### Storage & Infra
- **PostgreSQL 16 + pgvector** (`pgvector/pgvector:pg16`) — relational data + 1536-dim embeddings
- **Redis 7** — BullMQ job backend
- **RustFS** — S3-compatible object storage for uploads (ports 9000 API / 9001 console)
- **Mailpit** — dev SMTP sink + web UI (ports 1025 SMTP / 8025 UI)
- **Docker Compose** — orchestrates postgres + redis + rustfs + mailpit + backend + worker + frontend

---

## 3. Repository Structure

```
Synthea---Intelligent-Medical-Platform/
├── backend/                 Express + TypeScript API + worker
│   ├── src/
│   │   ├── config/          env (Zod), database (Prisma), logger, queue (BullMQ)
│   │   ├── controllers/     17 HTTP handlers
│   │   ├── services/        20 business-logic modules
│   │   ├── middleware/      auth, error, gdpr (audit), consent
│   │   ├── routes/          17 Express routers
│   │   ├── validators/      Zod schemas per endpoint
│   │   ├── jobs/            job catalogue + typed payloads
│   │   ├── workers/         standalone BullMQ worker process
│   │   └── index.ts         API server bootstrap
│   └── prisma/
│       ├── schema.prisma    data model (22 models, 7 enums)
│       ├── migrations/      10 migrations
│       ├── seed.ts          demo users / appointments / records / reviews / invoices
│       ├── seed-recommendations.ts   demo pools + items
│       └── import-ddinter.ts         loads the DDInter drug-interaction dataset
├── frontend/                React + Vite SPA
│   └── src/
│       ├── lib/             api client, auth, services, i18n, events (telemetry), types
│       └── app/
│           ├── components/  layouts, patient widgets, TelemetryRoot, ui/
│           ├── pages/       page components per role
│           ├── App.tsx      providers + router
│           └── routes.tsx   route tree
├── docker-compose.yml       full stack (incl. redis, mailpit, worker)
├── RECAP.md                 quick-start, run guide & demo credentials
└── README.md
```

---

## 4. Backend Architecture

The backend follows a layered **Controller → Service → Prisma** pattern with cross-cutting middleware, plus an out-of-band worker for async work.

### Layers

**`config/`** — `env.ts` (Zod-validated env, fails fast at startup), `database.ts` (Prisma singleton), `logger.ts` (Winston), `queue.ts` (BullMQ connection + lazy producer; **no-op when `REDIS_URL` is unset**).

**`controllers/`** (17) — `auth`, `patient`, `doctor`, `appointment`, `service`, `billing`, `ai`, `ocr`, `upload`, `review`, `admin`, `consent`, `event`, `interaction`, `recommendation`, `pool`, `email`.

**`services/`** (20) — grouped by concern:
- *Core HIS*: `appointment` (slots + scheduling), `billing` (invoices + Stripe stub), `storage` (RustFS upload/download/delete + presigned URLs).
- *Documents & OCR*: `ocr` (Tesseract + extraction), `ocr-pipeline` (async OCR over an upload), `upload-context` (recent-file context for AI), `chunking` (split extracted text), `embedding` (OpenRouter embeddings client), `document-embedding` (chunk → embed → store), `retrieval` (pgvector semantic search).
- *Personalization (all consent-gated)*: `signal` (LLM health-interest extraction), `recommendation` (rule-based generation + delivery state), `digest` (weekly email fan-out), `email` (Nodemailer render/send + unsubscribe), `gap-offer` (discounted off-peak slot finder).
- *Privacy & analytics*: `consent` (flag read/write + `hasConsent`), `event` (activity ingestion).
- *Clinical tools*: `ai` (chatbot + triage/decision-support stubs), `interaction` (drug-drug interaction lookups), `queue` (typed `enqueue`/`scheduleRepeatable` wrappers).

**`middleware/`** — `auth` (`authenticate` + `authorize(...roles)`), `error` (`ApiError` + central handler), `gdpr` (fire-and-forget audit writer), **`consent`** (`requireConsent(flag)` → 403 if the user hasn't opted in).

**`validators/`** — one Zod schema module per area + a generic `validate()` factory.

### Request lifecycle

```
Request → Helmet → CORS → Rate limit (100/15min/IP) → JSON body (10MB) → GDPR audit log
        → authenticate() [verify JWT, attach req.user]
        → authorize(...roles)        [403 if role not allowed]
        → requireConsent(flag)       [403 if consent missing — on personalization routes]
        → validate(zodSchema)        [400 + field errors]
        → Controller → Service → Prisma → PostgreSQL
                              └─ enqueue(job) → Redis → Worker (async)
        (all errors funnel to the centralized error middleware; Winston logs)
```

`GET /health` pings Postgres; `SIGINT`/`SIGTERM` trigger a graceful Prisma disconnect.

---

## 5. Asynchronous Pipeline (Queue + Workers)

Anything slow, external, or special-category runs out of the request path. The API only ever **enqueues**; a **separate worker process** (`npm run worker`, or the `worker` Docker service) consumes one BullMQ queue (`synthea-jobs`) and dispatches by job name. If `REDIS_URL` is unset, `enqueue()` is a logged no-op and the API still runs (you just don't get async processing).

### The document → recommendation chain

```
upload (POST /uploads)
   └─ enqueue extractText
        worker: OCR via processPatientUpload()                       [always]
        ├─ no profiling consent → stop (OCR text still powers the patient's own chat)
        └─ profiling consent → enqueue embedDocument
             worker: chunk + embed → document_chunks (pgvector)
             └─ enqueue extractSignals
                  worker: LLM extracts health-interest tags → user_signals
                  └─ enqueue generateRecommendations
                       worker: rule-match signals → pools → recommendations (PENDING)
```

### Job catalogue (`jobs/types.ts`)

| Job | Handler | Purpose |
|---|---|---|
| `extractText` | `ocr-pipeline` | OCR an upload; chain to embedding **iff** profiling consent |
| `embedDocument` | `document-embedding` | Chunk + embed extracted text into `document_chunks` |
| `extractSignals` | `signal` | LLM → structured health-interest tags (profiling-gated) |
| `generateRecommendations` | `recommendation` | Match signals to curated pools, create `PENDING` recs |
| `sendEmail` | `digest` | Render + send one weekly-digest email, then mark recs `DELIVERED` |
| `weeklyDigest` | `digest` | **Repeatable** (Mon 09:00) — fan out digests to consented users |

Worker concurrency is 5; the weekly digest is registered as a BullMQ repeatable job at startup. Failed/unknown jobs are logged, not fatal.

---

## 6. Frontend Architecture

A single-page React app organized into an **integration layer** (`lib/`) and an **application layer** (`app/`).

### Integration layer (`lib/`)
- `api.ts` — fetch wrapper; injects `Authorization: Bearer`, auto-refreshes once on 401, retries; XHR upload with progress
- `auth.tsx` — `<AuthProvider>`, `useAuth()`, session hydration from localStorage
- `services.ts` — typed, domain-specific API helpers: `patientsApi`, `doctorsApi`, `appointmentsApi`, `servicesApi`, `billingApi`, `aiApi`, `uploadsApi`, `reviewsApi`, `adminApi`, `authApi`, **`interactionsApi`**, **`consentApi`**, **`recommendationsApi`**, **`poolsApi`**
- `events.ts` — client telemetry: batches activity events and flushes via `navigator.sendBeacon` (consent-aware)
- `types.ts` — interfaces mirroring backend responses
- `i18n.tsx` / `translations.ts` — `<LanguageProvider>`, `useT()`, flat EN/RO dictionaries
- `RequireAuth.tsx` — route guard (role check + redirect)

### Application layer (`app/`)
- `App.tsx` — `<LanguageProvider><AuthProvider><RouterProvider/>`
- `routes.tsx` — React Router 7 nested route tree
- `components/TelemetryRoot.tsx` — mounts the activity-event tracker app-wide

### Layouts
| Layout | Audience | Pattern |
|---|---|---|
| `PatientLayout` | Patient | Bottom navigation + floating language toggle |
| `Layout` | Doctor | Sidebar + mobile bottom nav |
| `NurseLayout` | Nurse | Top + bottom nav |
| `AdminLayout` | Admin | Sidebar with logout |

### Notable components
- **`patient/FloatingChatbot.tsx`** — AI widget: posts to `/ai/chat`, surfaces **pending recommendations** as dismissible balloons, and proactively offers **gap-fill discount slots**
- **`patient/MedicalFilesSection.tsx`** — drag-and-drop upload (category, progress), view/download via presigned URL, delete, background OCR
- **`patient/BookAppointmentModal.tsx`** — doctor + service + slot picker (supports the discounted gap slot)
- **`pages/PatientDetailPage.tsx`** (doctor) — clinical record editor with a **drug-interaction checker** and diagnosis UI
- **`pages/admin/AdminContentPage.tsx`** — editorial CRUD for recommendation **pools** and items
- **`pages/patient/PatientSettingsPage.tsx`** — GDPR **consent** toggles (analytics / profiling / marketing email)

---

## 7. Data Model

**22 models** and **7 enums**. Postgres `vector` extension enabled for embeddings.

### Enums
`Role` (ADMIN/DOCTOR/PATIENT/NURSE) · `Gender` · `AppointmentStatus` (PENDING/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW) · `InvoiceStatus` (DRAFT/ISSUED/PAID/OVERDUE/CANCELLED) · `TriageLevel` (CRITICAL→ROUTINE) · **`RecommendationStatus`** (PENDING/DELIVERED/DISMISSED) · **`DeliveryChannel`** (BALLOON/EMAIL)

### Core HIS entities

| Model | Purpose | Key fields |
|---|---|---|
| **User** | Auth & identity (all roles) | `email` (unique), `passwordHash`, `role`, `firstName/lastName`, `isActive` |
| **PatientProfile** | Patient clinical identity | `dateOfBirth`, `gender`, `bloodType`, `allergies[]`, `cnp` (RO national ID, unique), `insuranceNo`, address |
| **DoctorProfile** | Public doctor profile | `specialty`, `bio`, `consultationFee`, `avgRating`, `totalReviews`, `languages[]`, `acceptsNewPatients` |
| **Appointment** | Bookings | `scheduledAt`, `duration`, `status`, `reason`, `feeAtBooking`, **`originalFee`/`discountPct`/`discountReason`** (gap-fill snapshot) |
| **MedicalService** | Bookable services | `specialty`, `name`, `durationMin`, `basePrice`, `active` |
| **MedicalRecord** | Clinical notes | `diagnosis`, `symptoms[]`, `treatment`, `prescription`, `labResults` (JSON), `isConfidential` |
| **Invoice** | Billing | `amount`, `currency`, `status`, `lineItems` (JSON), `dueDate`, `paidAt`, `stripePaymentId` |
| **Review** | Doctor ratings | `rating` (1–5), `comment`, `appointmentId` (unique — one per visit) |
| **TriageRecord** | AI symptom triage | `symptoms[]`, `triageLevel`, `recommendedSpecialty`, `aiConfidence` |
| **AiChatSession** | Chat history | `messages` (JSON), `medicalContext` (JSON) |
| **AuditLog** | GDPR compliance (append-only) | `action`, `resource`, `resourceId`, `ipAddress`, `userAgent`, `timestamp` |

### Documents & RAG

| Model | Purpose | Key fields |
|---|---|---|
| **OcrDocument** | Patient files + extraction | `storageKey`, `mimeType`, `sizeBytes` (BigInt), `extractedText`, `structuredData`, `category`, `source` (`OCR`\|`PATIENT_UPLOAD`) |
| **DocumentChunk** | Embedded text slices (retrieval layer) | `chunkIndex`, `content`, `embedding vector(1536)` (HNSW cosine index, raw-SQL queried) |

### Personalization (consent-gated)

| Model | Purpose | Key fields |
|---|---|---|
| **UserConsent** | Per-user GDPR flags (default `false`) | `analytics`, `profiling`, `marketingEmail`, `version` |
| **ConsentAudit** | Append-only consent provenance | `flag`, `value`, `ipAddress`, `at` |
| **ActivityEvent** | Append-only activity stream | `type`, `payload` (JSON), `sessionId` |
| **UserSignal** | LLM-extracted health-interest tags | `tag`, `confidence`, `source`, `basis`, `sourceDocId` (cascade-deletes with the doc → right-to-erasure) |
| **Pool** | Admin-curated content keyed by tag | `tag` (unique, matches `UserSignal.tag`), `title`, `active` |
| **PoolItem** | One piece of curated advice | `adviceText`, `ctaLabel`, `ctaUrl`, `serviceId` |
| **Recommendation** | Generated + delivered content | `status`, `channel`, `signalTag`, `signalBasis` (the "why"), `deliveredAt` |

### Clinical reference

| Model | Purpose | Key fields |
|---|---|---|
| **Drug** | Drug master list (autocomplete) | `name` (id), `key` (lowercased) |
| **DrugInteraction** | Pairwise interactions (DDInter) | `keyA`/`keyB` (canonically ordered), `drugA`/`drugB`, `level` (Major/Moderate/Minor/Unknown) |

Hot paths are indexed (`appointments(doctorId, scheduledAt)`, `audit_logs(timestamp)`, `activity_events(userId,type,createdAt)`, `recommendations(userId,status)`, `document_chunks(patientId)`, …). Deleting a `User`/`OcrDocument` cascades to derived personalization data.

### Migrations (`prisma/migrations/`)
`schema_alignment` → `add_nurse_role` → `add_medical_services` → `extend_ocr_document_for_uploads` → `add_drug_interactions` → `add_document_chunks` → `add_activity_events` → `add_pgvector_and_consent` → `add_user_signals` → `add_recommendation_pools` (10 total).

---

## 8. Authentication & Authorization

### Tokens
| Token | TTL | Payload | Storage |
|---|---|---|---|
| Access | 15 min | `{ id, email, role }` | localStorage `synthea_access_token` |
| Refresh | 7 days | `{ id }` | localStorage `synthea_refresh_token` |

On a `401`, the API wrapper calls `/auth/refresh` **once** (coordinated to avoid a stampede), then retries; if refresh fails, tokens are cleared and the user is redirected to `/`.

### Roles & scope
| Role | Access |
|---|---|
| **ADMIN** | Everything: user management, audit logs, billing, dashboards, content pools, digest trigger |
| **DOCTOR** | Patients, schedule, medical records, drug-interaction check, AI decision support, billing (read) |
| **NURSE** | Patient list, tasks, notifications, drug-interaction check |
| **PATIENT** | Own profile, appointments, uploads, AI chat, reviews, consent, recommendations |

> Public registration (`/auth/register`) **always** creates a PATIENT. Staff accounts are provisioned by an admin or the seed.

Security hardening: bcrypt (12 rounds), Helmet, CORS whitelist, rate limiting, soft deletes (`isActive=false`), GDPR audit logging, and **consent-gated** personalization routes.

---

## 9. GDPR, Consent & Telemetry

Privacy is a first-class subsystem, not an afterthought.

- **`UserConsent`** holds three independent, revocable flags — `analytics`, `profiling`, `marketingEmail` — all defaulting to **`false`**. Nothing personalization-related runs without opt-in.
- **`requireConsent(flag)` middleware** enforces this server-side (403 with the missing flag). UI hiding is never the only gate.
- Each flag gates a distinct capability:
  - **analytics** → `ActivityEvent` ingestion (`POST /events`)
  - **profiling** → document embedding + signal extraction + recommendation generation (special-category data)
  - **marketingEmail** → weekly digest emails
- **`ConsentAudit`** is an append-only log of every grant/revoke (with IP), answering "when did this user consent, and from where".
- **Right to erasure**: `UserSignal.sourceDocId` cascades — deleting the source document removes the signals derived from it.
- **Telemetry path**: the frontend batches events and ships them with `navigator.sendBeacon` (a `text/plain` blob, parsed server-side). `/events` has its own rate-limit bucket (300/15min) and accepts the token in the body (beacons can't set headers), so analytics traffic never locks a user out of the API.

---

## 10. AI Subsystem (Chat / RAG / Signals)

**Provider:** OpenRouter (`OPENROUTER_API_KEY`) — default LLM `openai/gpt-4o-mini`, default embeddings `openai/text-embedding-3-small` (1536-dim). Absent/placeholder key ⇒ chat returns a stub, embeddings return zero-vectors, signal extraction is skipped — the app still boots.

### Patient chatbot (`POST /ai/chat`) — **real, RAG-grounded**
For a patient, the controller does **patient-scoped semantic retrieval**: it embeds the user's message and pulls the top-5 nearest `document_chunks` via the pgvector HNSW cosine index. Those excerpts are injected as system context (preferred path). If embeddings are off or the patient hasn't consented to profiling (so there are no chunks), it **falls back** to concatenating recent OCR'd file text. The system prompt enforces a non-diagnostic, empathetic, EN/RO, emergency-aware persona, and treats document text as **untrusted** (prompt-injection mitigation). History persists to `AiChatSession`.

> Note: the chat is a single-shot RAG completion. (Earlier iterations used `list_specialties`/`find_doctors` function-calling tools; the current implementation favors retrieval-grounded answers and surfaces doctor discovery through the booking UI instead.)

### Signal extraction (worker, profiling-gated) — **real**
A worker job feeds a document's embedded chunks to the LLM with a strict JSON schema, extracting non-identifying, snake_case health-interest tags with a confidence and a one-line basis (e.g. `{ tag: "lower_back_pain", confidence: 0.8 }`). Tags below 0.5 are dropped; results are normalized, deduped by tag, and written to `user_signals` (idempotent per document).

### Triage (`POST /ai/triage`) — **stub**
Keyword-based urgency → `TriageLevel` + recommended specialty + confidence; persists a `TriageRecord`.

### Clinical decision support (`POST /ai/decision-support`, DOCTOR/ADMIN) — **stub**
Mock diagnoses / tests / treatment with a "not a substitute for clinical judgment" disclaimer.

---

## 11. Recommendation Engine

A deliberately **simple, explainable, rule-based** (no-ML) personalization loop layered on top of signals:

```
UserSignal (tag, confidence ≥ 0.6)
   → Pool with that tag (admin-curated, active)
      → active PoolItems not already pending / delivered within 14 days
         → Recommendation (PENDING), capped at 5 per run, highest-confidence tags first
```

- **Generation** runs in the worker after signal extraction (or on-demand via `POST /recommendations/generate`). Profiling-gated.
- **Delivery** has two channels sharing one frequency cap (the `status` field): the **balloon** in the chatbot (`POST /:id/ack` → `DELIVERED` via `BALLOON`) and the **weekly email digest** (marketing-email-gated; marks `DELIVERED` via `EMAIL` only after a successful send). A user can `POST /:id/dismiss`.
- **Provenance**: every recommendation carries `signalTag` + `signalBasis` so the UI can explain *why am I seeing this*.
- **Editorial control**: admins manage pools/items via `/pools` (and the Admin → Content page). Demo content is loaded by `npm run seed:reco`.

---

## 12. Drug-Interaction Checker

Backed by the **DDInter** dataset (loaded with `npm run import:ddinter`):

- `Drug` is the master autocomplete list; `DrugInteraction` stores pairwise interactions with keys lowercased and canonically ordered (`keyA <= keyB`) so a pair matches regardless of input order.
- `GET /interactions/drugs?search=` — case-insensitive autocomplete (any authenticated user).
- `POST /interactions/check` (DOCTOR/ADMIN/NURSE) — given a medication list, returns every known pairwise interaction among them, sorted most-severe first (Major → Moderate → Minor → Unknown).
- Surfaced in the doctor's patient-detail / prescribing UI.

---

## 13. Gap-Fill Discount Offers

To fill schedule gaps, the assistant can proactively offer a **discounted off-peak slot**:

- `GET /appointments/gap-offer` finds the earliest open slot at/after `SLOT_GAP_START_HOUR` (default 17:00) on the next working day, preferring doctors the patient has seen before (continuity of care), then any doctor accepting new patients. Returns the discounted fee (`SLOT_GAP_DISCOUNT_PCT`, default 20%).
- When the patient books with `applyGapDiscount`, the server re-validates the slot is genuinely late and records `originalFee`, `discountPct`, and `discountReason: "GAP_FILL"` on the `Appointment` (fee snapshot is post-discount).
- The chatbot widget surfaces the offer inline. Discounts disable cleanly when `SLOT_GAP_DISCOUNT_PCT = 0`.

---

## 14. API Reference

Base path: `/api`. (Routers mounted in `index.ts`.)

<details open>
<summary><b>Auth</b> <code>/auth</code></summary>

```
POST /register          Create patient account
POST /login             Login (all roles)
POST /refresh           Refresh access token
POST /logout            Invalidate session
GET  /profile           Current user
PUT  /profile           Update name / phone
PUT  /change-password   Change password
```
</details>

<details>
<summary><b>Patients</b> <code>/patients</code></summary>

```
GET    /                                   List (ADMIN/DOCTOR, paginated)
POST   /                                   Create profile (ADMIN/DOCTOR)
GET    /:id                                Details
PUT    /:id                                Update
DELETE /:id                                Soft-delete (ADMIN)
GET    /:id/medical-records                List records
POST   /:id/medical-records                Create record
GET    /:id/medical-records/:recordId      Single record
```
</details>

<details>
<summary><b>Doctors</b> <code>/doctors</code></summary>

```
GET  /                    List (filter by specialty/availability)
GET  /by-user/:userId     Profile by user id
GET  /:id                 Details + reviews
POST /profile             Create profile (ADMIN)
PUT  /:id/profile         Update profile (ADMIN/DOCTOR)
```
</details>

<details>
<summary><b>Appointments</b> <code>/appointments</code></summary>

```
GET    /                       List (role-aware)
GET    /available-slots         Available times for a doctor
GET    /gap-offer               Discounted off-peak gap slot for the caller
GET    /optimized-schedule      Optimized schedule (ADMIN/DOCTOR)
POST   /                       Create (supports applyGapDiscount)
GET    /:id                     Single
PUT    /:id                     Update
DELETE /:id/cancel              Cancel
```
</details>

<details>
<summary><b>Services</b> <code>/services</code></summary>

```
GET /                 List services
GET /specialties      Distinct specialties
GET /:id              Service details
```
</details>

<details>
<summary><b>Billing</b> <code>/billing</code></summary>

```
GET  /invoices            List (ADMIN/DOCTOR)
GET  /report              Payment report (ADMIN/DOCTOR)
POST /invoices            Create (ADMIN)
GET  /invoices/:id        Single
PUT  /invoices/:id        Update (ADMIN)
POST /invoices/:id/pay    Process payment
```
</details>

<details>
<summary><b>AI</b> <code>/ai</code></summary>

```
POST /chat               RAG-grounded health assistant
GET  /chat/history       Chat sessions
POST /triage             Symptom triage (stub)
POST /decision-support   Clinical support (DOCTOR/ADMIN, stub)
```
</details>

<details>
<summary><b>Uploads</b> <code>/uploads</code> — personal medical files</summary>

```
GET    /                  List patient uploads
POST   /                  Stream upload (multipart) → enqueues extractText
GET    /:id/download      Presigned download URL
DELETE /:id               Delete file
```
</details>

<details>
<summary><b>OCR</b> <code>/ocr</code></summary>

```
POST /upload              Upload document for OCR
GET  /patient/:patientId  All documents for a patient
GET  /:id                 Extracted text + structured data
POST /:id/reprocess       Reprocess document
```
</details>

<details>
<summary><b>Reviews</b> <code>/reviews</code></summary>

```
POST /                    Create review (PATIENT, after appointment)
GET  /doctor/:doctorId    Doctor's reviews
GET  /:id                 Single review
```
</details>

<details>
<summary><b>Interactions</b> <code>/interactions</code></summary>

```
GET  /drugs               Drug-name autocomplete
POST /check               Pairwise interactions among a drug list (DOCTOR/ADMIN/NURSE)
```
</details>

<details>
<summary><b>Consent</b> <code>/consent</code> (self-scoped)</summary>

```
GET /                     My consent flags
PUT /                     Update my flags (writes a ConsentAudit row)
```
</details>

<details>
<summary><b>Events</b> <code>/events</code> (analytics consent required)</summary>

```
POST /                    Ingest a batch of activity events (sendBeacon-friendly)
```
</details>

<details>
<summary><b>Recommendations</b> <code>/recommendations</code></summary>

```
GET  /pending             My pending recommendations
POST /generate            Regenerate from my signals (profiling-gated)
POST /:id/ack             Mark delivered (BALLOON/EMAIL)
POST /:id/dismiss         Dismiss
POST /digest              Trigger weekly digest fan-out now (ADMIN)
```
</details>

<details>
<summary><b>Pools</b> <code>/pools</code> (ADMIN — editorial)</summary>

```
GET    /                  List pools + items
POST   /                  Create pool
PATCH  /:id               Update pool
DELETE /:id               Delete pool
POST   /:id/items         Add item
PATCH  /items/:itemId     Update item
DELETE /items/:itemId     Delete item
```
</details>

<details>
<summary><b>Email</b> <code>/email</code> (public, token-secured)</summary>

```
GET /unsubscribe          One-click unsubscribe (signed token, no login)
```
</details>

<details>
<summary><b>Admin</b> <code>/admin</code></summary>

```
GET    /dashboard         KPIs (patients, appointments, revenue)
GET    /users             List users
GET    /users/:id         User details
PUT    /users/:id         Update user
DELETE /users/:id         Deactivate user
GET    /audit-logs        GDPR audit log
```
</details>

---

## 15. Implemented Features

### Authentication & Identity
- Patient self-registration; login for all roles; JWT sessions with transparent refresh
- Role-based + consent-based access control; password hashing & change-password
- GDPR audit logging of sensitive actions

### Patient
- Profile setup (blood type, allergies, emergency contact, address)
- Book appointments (doctor + service + live slot availability; optional discounted gap slot)
- Medical files: drag-and-drop streaming upload, categorize, view/download (presigned), delete, **background OCR + embedding**
- **RAG health chatbot** grounded in the patient's own documents, EN/RO, with inline recommendation balloons and gap-slot offers
- **Personalized health-tip recommendations** (balloon + opt-in weekly email digest), each explainable
- **Granular GDPR consent** toggles (analytics / profiling / marketing email) with full audit trail
- Star reviews after appointments; notifications; health blog

### Doctor
- Patient list with search/filter and full detail (records, appointments, invoices)
- Schedule/calendar; create & edit medical records
- **Drug-interaction checker** with autocomplete and severity-ranked results
- AI clinical decision support (stub); billing visibility; editable public profile

### Nurse
- Patient list, task management, urgent-case notifications, drug-interaction check

### Admin
- Dashboard KPIs; user management & role assignment; billing/revenue reports
- GDPR audit-log viewer; **editorial CRUD for recommendation pools**; manual digest trigger

### Cross-cutting / Technical
- Bilingual UI + AI responses (EN + RO)
- **Async pipeline** (BullMQ/Redis): OCR → embedding → signals → recommendations → email
- **pgvector RAG** retrieval layer shared by the chatbot
- S3-compatible object storage (RustFS) with streaming uploads + presigned URLs
- Privacy by default: consent-gated, server-enforced, right-to-erasure cascades
- Centralized error handling + structured Winston logging; rate limiting/Helmet/CORS; soft deletes; indexed hot paths
- Graceful degradation when Redis / OpenRouter / RustFS are absent

---

## 16. Deployment & Infrastructure

### Docker Compose stack
- **postgres** (`pgvector/pgvector:pg16`) — database + embeddings (health-checked)
- **redis:7-alpine** — BullMQ job backend (health-checked)
- **rustfs/rustfs** — S3-compatible object storage (9000 API / 9001 console)
- **mailpit** — dev SMTP sink + web UI (1025 SMTP / 8025 UI)
- **backend** — Express API (depends on postgres + redis + rustfs)
- **worker** — BullMQ job processors (`dist/workers/index.js`)
- **frontend** — built React app

### Backend environment variables (selected)
```
DATABASE_URL              postgresql://user:pass@postgres:5432/db
JWT_SECRET                ≥32 chars (required)
JWT_REFRESH_SECRET        ≥32 chars (required)
REDIS_URL                 redis://redis:6379         (async pipeline; no-op if unset)
OPENROUTER_API_KEY        optional (chat/embeddings/signals; stub if missing)
OPENROUTER_MODEL          openai/gpt-4o-mini
EMBEDDING_MODEL           openai/text-embedding-3-small
SMTP_HOST / SMTP_PORT     mailpit / 1025             (Nodemailer)
SMTP_FROM                 Synthea <no-reply@synthea.local>
APP_PUBLIC_URL            http://localhost:3000      (email CTA links)
API_PUBLIC_URL            http://localhost:5000      (unsubscribe link)
EMAIL_MARKETING_ENABLED   true
SLOT_GAP_DISCOUNT_PCT     20        SLOT_GAP_START_HOUR  17
RUSTFS_ENDPOINT           http://rustfs:9000
RUSTFS_PUBLIC_ENDPOINT    http://localhost:9000      (browser presigned URLs)
RUSTFS_BUCKET             synthea-patient-uploads
PRESIGNED_URL_TTL_SECONDS 300
MAX_FILE_SIZE_MB          1024
```

### Useful scripts
```bash
# Backend
npm run dev              # API, hot reload (ts-node-dev)
npm run worker           # BullMQ worker, hot reload
npm run build            # compile to dist/
npm run prisma:migrate   # run migrations
npm run prisma:seed      # demo users / appointments / records / reviews / invoices
npm run seed:reco        # demo recommendation pools + items
npm run import:ddinter   # load the DDInter drug-interaction dataset

# Frontend
npm run dev              # Vite dev server (:3000)
npm run build            # production build
```
