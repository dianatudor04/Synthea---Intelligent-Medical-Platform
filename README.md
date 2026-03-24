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
- PostgreSQL (sau Docker)
- npm / yarn

### 2. Setup

```bash
# Clonează și intră în director
git clone <repo> && cd Synthea---Intelligent-Medical-Platform

# Configurează variabilele de mediu
cp .env.example .env
# Editează .env cu valorile tale

# Instalează dependențele backend
cd backend
npm install

# Generează Prisma client
npx prisma generate

# Rulează migrațiile
npx prisma migrate dev --name init

# Seed baza de date (users demo)
npm run prisma:seed

# Pornește backend-ul
npm run dev
```

> Backend rulează pe: **http://localhost:5000**
> Health check: **http://localhost:5000/health**

### 3. Docker (opțional — rulează tot)

```bash
cp .env.example .env
# Editează .env

docker-compose up -d
```

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