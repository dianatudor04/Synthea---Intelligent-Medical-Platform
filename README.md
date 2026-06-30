# 🏥 Synthea — Intelligent Medical Platform

> **Platformă medicală inteligentă (HIS + AI)** pentru spitale și clinici. Combină funcționalitățile unui Hospital Information System clasic cu module moderne de Inteligență Artificială.

---

## 🚀 Stack Tehnologic

| Layer | Tehnologie |
|---|---|
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL + Prisma ORM |
| **Frontend** | Next.js 14 (App Router) |
| **AI / ML** | OpenAI API stubs (gpt-4-turbo) |
| **OCR / NLP** | Tesseract.js stubs |
| **Payments** | Stripe stubs |
| **Auth** | JWT (access 15min + refresh 7d) |
| **Security** | HIPAA/GDPR audit logging, Helmet, Rate limiting |
| **DevOps** | Docker + Docker Compose |

---

## 📁 Structura Proiectului

```
Synthea/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema: User, Patient, Appointment, etc.
│   │   └── seed.ts             # Date initiale (admin, doctor, patient)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts     # Prisma client singleton
│   │   │   └── logger.ts       # Winston logger
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── patient.controller.ts
│   │   │   ├── appointment.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── ocr.controller.ts
│   │   │   ├── billing.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT + RBAC
│   │   │   ├── error.middleware.ts  # Error handling
│   │   │   └── gdpr.middleware.ts   # Audit logging
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── patient.routes.ts
│   │   │   ├── appointment.routes.ts
│   │   │   ├── billing.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── ocr.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts        # OpenAI stubs (chatbot, triage, DSS)
│   │   │   ├── ocr.service.ts       # Tesseract/NLP stubs
│   │   │   ├── appointment.service.ts # ML scheduling stubs
│   │   │   └── billing.service.ts   # Stripe stubs
│   │   └── index.ts                 # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                        # Next.js 14 (de implementat)
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## ⚡ Quick Start (Development)

### 1. Cerințe
- Node.js 20+
- Docker + Docker Compose (pentru serviciile de backing)
- npm

Workflow-ul recomandat: serviciile de infrastructură (Postgres, Redis, RustFS,
Mailpit) rulează în Docker, iar backend / worker / frontend rulează pe host cu
hot-reload.

### 2. Setup (un singur pas)

```bash
git clone <repo> && cd Synthea---Intelligent-Medical-Platform

# Secrete pentru compose (JWT etc.) — valorile implicite merg pentru dev local
cp .env.example .env

# Config backend pentru serverele de dev de pe host
cp backend/.env.example backend/.env

# Pornește infra, instalează dependențele, migrează + seed
make setup
```

Apoi pornește cele trei servere, fiecare în terminalul lui:

```bash
make backend    # http://localhost:5000  (health: /health)
make worker     # procesoarele BullMQ
make frontend   # http://localhost:3000
```

> Frontend-ul rulează pe **:3000** ca să corespundă cu allow-list-ul CORS al
> backend-ului (`FRONTEND_URL`).

**Logins demo** (după seed):

| Rol     | Email                | Parolă        |
|---------|----------------------|---------------|
| Admin   | admin@synthea.ro     | `Admin@1234!`   |
| Doctor  | doctor@synthea.ro    | `Doctor@1234!`  |
| Patient | patient@synthea.ro   | `Patient@1234!` |

Email-urile trimise în dev pot fi văzute în Mailpit: **http://localhost:8025**

### 3. Tot stack-ul în Docker (opțional)

Construiește imagini de producție pentru backend, worker și frontend pe lângă
infra (profilul `full`):

```bash
cp .env.example .env
make stack
# echivalent: docker compose --profile full up -d --build
```

Un `docker compose up -d` simplu (fără profil) pornește **doar infrastructura** —
exact ce ai nevoie pentru workflow-ul de dev de mai sus.

---

## 📡 API Endpoints

| Method | Endpoint | Descriere | Roluri |
|---|---|---|---|
| `POST` | `/api/auth/register` | Înregistrare | Public |
| `POST` | `/api/auth/login` | Autentificare | Public |
| `POST` | `/api/auth/refresh` | Refresh token | Public |
| `GET` | `/api/auth/profile` | Profilul meu | Auth |
| `GET` | `/api/patients` | Lista pacienți | Doctor, Admin |
| `POST` | `/api/patients` | Creare pacient | Doctor, Admin |
| `GET` | `/api/patients/:id` | Detalii pacient | Auth |
| `GET` | `/api/patients/:id/medical-records` | Dosar medical | Doctor, Admin |
| `POST` | `/api/patients/:id/medical-records` | Adaugă înregistrare | Doctor |
| `GET` | `/api/appointments` | Lista programări | Auth |
| `POST` | `/api/appointments` | Creare programare | Auth |
| `GET` | `/api/appointments/available-slots` | Sloturi disponibile | Auth |
| `GET` | `/api/appointments/optimized-schedule` | 🤖 Program optimizat ML | Doctor, Admin |
| `POST` | `/api/ai/chat` | 🤖 Chatbot medical | Auth |
| `POST` | `/api/ai/triage` | 🤖 Triaj automat | Auth |
| `POST` | `/api/ai/decision-support` | 🤖 Suport clinic | Doctor |
| `POST` | `/api/ocr/upload` | Upload document OCR | Doctor, Nurse |
| `GET` | `/api/billing/invoices` | Lista facturi | Admin, Receptionist |
| `POST` | `/api/billing/invoices/:id/pay` | Procesare plată | Auth |
| `GET` | `/api/admin/dashboard` | Statistici | Admin |
| `GET` | `/api/admin/audit-logs` | Jurnale GDPR | Admin |

---

## 🤖 Module AI (Stubs — de implementat)

| Modul | Fișier | TODO |
|---|---|---|
| **Chatbot LLM** | `services/ai.service.ts` → `chat()` | Integrare OpenAI GPT-4 |
| **Triaj Automat** | `services/ai.service.ts` → `triage()` | Model ML clasificare simptome |
| **Suport Decizional** | `services/ai.service.ts` → `clinicalDecisionSupport()` | BioGPT / Med-PaLM RAG |
| **OCR Documente** | `services/ocr.service.ts` → `processDocument()` | Tesseract.js / Google Vision |
| **NLP Medical** | `services/ocr.service.ts` → `extractMedicalEntities()` | spaCy, scispaCy, medBERT |
| **Scheduling ML** | `services/appointment.service.ts` → `getOptimizedSchedule()` | Peak detection, no-show prediction |
| **Plăți** | `services/billing.service.ts` → `processPayment()` | Stripe PaymentIntents |

---

## 🔒 Securitate & Conformitate

- **JWT** cu access token de 15 minute + refresh token de 7 zile
- **RBAC** (Role-Based Access Control): `ADMIN`, `DOCTOR`, `NURSE`, `RECEPTIONIST`, `PATIENT`
- **GDPR/HIPAA Audit Log** — toate accesările la date sensibile sunt înregistrate
- **Rate Limiting** — 100 req/15min pe IP
- **Helmet** — HTTP security headers
- **bcrypt** (rounds=12) pentru hash-ul parolelor

---

## 👤 Utilizatori Demo (după seed)

| Email | Parolă | Rol |
|---|---|---|
| `admin@synthea.ro` | `Admin@1234!` | ADMIN |
| `doctor@synthea.ro` | `Doctor@1234!` | DOCTOR |
| `patient@synthea.ro` | `Patient@1234!` | PATIENT |

---

## 🗺️ Roadmap

- [ ] Implementare OpenAI chatbot medical
- [ ] Implementare OCR cu Tesseract.js
- [ ] Frontend Next.js (dashboard, EMR, programări, billing)
- [ ] Integrare Stripe Payments
- [ ] Model ML pentru triaj simptome
- [ ] Notificări email/SMS pentru programări
- [ ] Export PDF pentru documente medicale
- [ ] Portal pacient (mobile-friendly)
- [ ] Integrare HL7/FHIR pentru interoperabilitate

---

*Synthea — Built with ❤️ for Romanian Healthcare*