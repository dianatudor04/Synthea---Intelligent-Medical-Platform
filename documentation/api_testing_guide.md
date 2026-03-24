# Synthea API Testing Guide

> **Base URL:** `http://localhost:5000`  
> **Header for authenticated requests:** `Authorization: Bearer <accessToken>`  
> **Content-Type:** `application/json` (unless noted otherwise)

---

## 🔐 STEP 1 — Auth

### 1.1 Register a PATIENT
```
POST /api/auth/register
```
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+40712345678",
  "role": "PATIENT"
}
```
> 💾 Save `accessToken`, `refreshToken`, and `user.id` from the response.

---

### 1.2 Register an ADMIN
```
POST /api/auth/register
```
```json
{
  "email": "admin@synthea.com",
  "password": "Admin123!",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+40700000001",
  "role": "ADMIN"
}
```
> 💾 Save the admin `accessToken`.

---

### 1.3 Register a DOCTOR
```
POST /api/auth/register
```
```json
{
  "email": "dr.smith@synthea.com",
  "password": "Doctor123!",
  "firstName": "Emma",
  "lastName": "Smith",
  "phone": "+40700000002",
  "role": "DOCTOR"
}
```
> 💾 Save the doctor `user.id` — needed for DoctorProfile creation and appointments.

---

### 1.4 Login
```
POST /api/auth/login
```
```json
{
  "email": "john.doe@example.com",
  "password": "Password123!"
}
```
> 💾 Save `accessToken` (expires in 15 min) and `refreshToken` (expires in 7 days).

---

### 1.5 Refresh token
```
POST /api/auth/refresh
```
```json
{
  "refreshToken": "<refreshToken>"
}
```

---

### 1.6 Get my profile  *(authenticated)*
```
GET /api/auth/profile
Authorization: Bearer <accessToken>
```
*(no body — response includes `patientProfile` or `doctorProfile` if they exist)*

---

### 1.7 Change password  *(authenticated)*
```
PUT /api/auth/change-password
Authorization: Bearer <accessToken>
```
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

---

### 1.8 Logout  *(authenticated)*
```
POST /api/auth/logout
Authorization: Bearer <accessToken>
```
*(no body)*

---

## 🩺 STEP 2 — Doctor Profiles

> Must be done **before** creating appointments — `feeAtBooking` is snapshotted from the DoctorProfile at booking time.

### 2.1 Create a DoctorProfile  *(ADMIN only)*
```
POST /api/doctors/profile
Authorization: Bearer <adminToken>
```
```json
{
  "userId": "<doctor user.id from step 1.3>",
  "specialty": "Cardiologie",
  "bio": "Specialist in cardiovascular diseases with 10 years experience.",
  "yearsOfExperience": 10,
  "consultationFee": 250.00,
  "currency": "RON",
  "languages": ["RO", "EN"],
  "clinicAddress": "Str. Spitalului 1, Bucharest",
  "acceptsNewPatients": true
}
```
> 💾 Save the returned `id` as `doctorProfileId`.

---

### 2.2 Get all doctors  *(public — no auth)*
```
GET /api/doctors?specialty=Cardiologie&acceptsNewPatients=true&page=1&limit=10
```
*(no body)*

---

### 2.3 Get doctor by profile ID  *(public)*
```
GET /api/doctors/<doctorProfileId>
```
*(no body — response includes last 10 reviews)*

---

### 2.4 Get doctor by user ID  *(public)*
```
GET /api/doctors/by-user/<doctorUserId>
```
*(no body)*

---

### 2.5 Update DoctorProfile  *(ADMIN or own DOCTOR)*
```
PUT /api/doctors/<doctorProfileId>/profile
Authorization: Bearer <doctorToken>
```
```json
{
  "bio": "Updated bio text.",
  "consultationFee": 300.00,
  "acceptsNewPatients": false
}
```

---

## 👤 STEP 3 — Patient Profiles

> Use **ADMIN or DOCTOR token** for all write operations.

### 3.1 Create a PatientProfile
```
POST /api/patients
Authorization: Bearer <doctorToken>
```
```json
{
  "userId": "<patient user.id from step 1.1>",
  "dateOfBirth": "1990-05-15",
  "gender": "MALE",
  "address": "Str. Florilor 12",
  "city": "Bucharest",
  "country": "Romania",
  "bloodType": "A+",
  "allergies": ["penicillin", "pollen"],
  "cnp": "1900515123456",
  "insuranceNo": "INS-2024-001",
  "emergencyContact": "Jane Doe +40712000001"
}
```
> 💾 Save the returned `id` as `patientId`.

---

### 3.2 Get all patients
```
GET /api/patients?page=1&limit=10&search=john
Authorization: Bearer <doctorToken>
```
*(no body)*

---

### 3.3 Get patient by ID
```
GET /api/patients/<patientId>
Authorization: Bearer <accessToken>
```
*(no body)*

---

### 3.4 Update patient
```
PUT /api/patients/<patientId>
Authorization: Bearer <doctorToken>
```
```json
{
  "city": "Cluj-Napoca",
  "address": "Str. Republicii 5"
}
```

---

### 3.5 Create medical record
```
POST /api/patients/<patientId>/medical-records
Authorization: Bearer <doctorToken>
```
```json
{
  "diagnosis": "Acute bronchitis",
  "symptoms": ["cough", "fever", "fatigue"],
  "treatment": "Amoxicillin 500mg 3x/day for 7 days",
  "prescription": "Amoxicillin 500mg",
  "notes": "Patient should rest and stay hydrated",
  "isConfidential": false
}
```
> ⚠️ `doctorId` is **automatically injected** from the auth token — do not send it in the body.  
> 💾 Save the returned `id` as `recordId`.

---

### 3.6 Get all medical records for patient
```
GET /api/patients/<patientId>/medical-records
Authorization: Bearer <doctorToken>
```
*(no body)*

---

### 3.7 Get one medical record
```
GET /api/patients/<patientId>/medical-records/<recordId>
Authorization: Bearer <doctorToken>
```
*(no body)*

---

### 3.8 Delete patient  *(ADMIN only)*
```
DELETE /api/patients/<patientId>
Authorization: Bearer <adminToken>
```
*(no body)*

---

## 📅 STEP 4 — Appointments

### 4.1 Get available slots
```
GET /api/appointments/available-slots?doctorId=<doctorUserId>&date=2026-04-01
Authorization: Bearer <accessToken>
```
*(no body)*

---

### 4.2 Create appointment
```
POST /api/appointments
Authorization: Bearer <accessToken>
```
```json
{
  "patientId": "<patientId>",
  "doctorId": "<doctorUserId>",
  "scheduledAt": "2026-04-01T10:00:00.000Z",
  "duration": 30,
  "reason": "Follow-up consultation for bronchitis",
  "notes": "Patient requested morning slot",
  "roomNumber": "A12"
}
```
> 💾 Save the returned `id` as `appointmentId`.  
> ℹ️ `feeAtBooking` is automatically snapshotted from the DoctorProfile.

---

### 4.3 Get all appointments
```
GET /api/appointments?page=1&limit=10&status=PENDING&date=2026-04-01
Authorization: Bearer <accessToken>
```
*(no body — optional filters: `doctorId`, `patientId`, `status`, `date`)*

---

### 4.4 Get appointment by ID
```
GET /api/appointments/<appointmentId>
Authorization: Bearer <accessToken>
```
*(no body — response includes `medicalRecord` and `review` if they exist)*

---

### 4.5 Update appointment
```
PUT /api/appointments/<appointmentId>
Authorization: Bearer <accessToken>
```
```json
{
  "scheduledAt": "2026-04-01T11:00:00.000Z",
  "status": "CONFIRMED",
  "reason": "Rescheduled follow-up"
}
```
> ⚠️ `feeAtBooking` is protected and cannot be changed after booking.

---

### 4.6 Optimized schedule  *(ADMIN/DOCTOR)*
```
GET /api/appointments/optimized-schedule?doctorId=<doctorUserId>&date=2026-04-01
Authorization: Bearer <doctorToken>
```
*(no body)*

---

### 4.7 Cancel appointment
```
DELETE /api/appointments/<appointmentId>/cancel
Authorization: Bearer <accessToken>
```
*(no body)*

---

## ⭐ STEP 5 — Reviews

> Requires a **COMPLETED** appointment. Only the patient of that appointment can submit a review.

### 5.1 Submit a review  *(PATIENT only)*
```
POST /api/reviews
Authorization: Bearer <patientToken>
```
```json
{
  "appointmentId": "<appointmentId>",
  "rating": 5,
  "comment": "Very professional and thorough consultation."
}
```
> ℹ️ `DoctorProfile.avgRating` and `totalReviews` are **automatically recomputed** after submission.

---

### 5.2 Get reviews for a doctor
```
GET /api/reviews/doctor/<doctorProfileId>?page=1&limit=20
Authorization: Bearer <accessToken>
```
*(no body)*

---

### 5.3 Get review by ID
```
GET /api/reviews/<reviewId>
Authorization: Bearer <accessToken>
```
*(no body)*

---

## 💳 STEP 6 — Billing

> All write operations require **ADMIN** token.

### 6.1 Create invoice
```
POST /api/billing/invoices
Authorization: Bearer <adminToken>
```
```json
{
  "patientId": "<patientId>",
  "amount": 250.00,
  "currency": "RON",
  "dueDate": "2026-04-15",
  "notes": "Consultation + lab tests",
  "lineItems": [
    { "description": "Consultation", "unitPrice": 150, "quantity": 1 },
    { "description": "Blood panel", "unitPrice": 100, "quantity": 1 }
  ]
}
```
> ⚠️ Field is `lineItems`, **not** `items`.  
> 💾 Save the returned `id` as `invoiceId`.

---

### 6.2 Get all invoices
```
GET /api/billing/invoices?status=ISSUED&page=1&limit=10
Authorization: Bearer <adminToken>
```
*(no body — optional filters: `patientId`, `status`)*

---

### 6.3 Get invoice by ID
```
GET /api/billing/invoices/<invoiceId>
Authorization: Bearer <accessToken>
```
*(no body)*

---

### 6.4 Update invoice
```
PUT /api/billing/invoices/<invoiceId>
Authorization: Bearer <adminToken>
```
```json
{
  "notes": "Updated: includes imaging fee",
  "amount": 350.00
}
```

---

### 6.5 Process payment  *(Stripe stub)*
```
POST /api/billing/invoices/<invoiceId>/pay
Authorization: Bearer <accessToken>
```
```json
{
  "paymentMethod": "card"
}
```

---

### 6.6 Payment report  *(ADMIN only)*
```
GET /api/billing/report?startDate=2026-01-01&endDate=2026-12-31
Authorization: Bearer <adminToken>
```
*(no body)*

---

## 🤖 STEP 7 — AI

### 7.1 Chat with medical bot
```
POST /api/ai/chat
Authorization: Bearer <accessToken>
```
```json
{
  "message": "I have a sore throat and mild fever for 2 days. What should I do?"
}
```
> 💾 Save `sessionId` from response to continue the conversation.

---

### 7.2 Continue chat in same session
```
POST /api/ai/chat
Authorization: Bearer <accessToken>
```
```json
{
  "message": "Should I take antibiotics?",
  "sessionId": "<sessionId>",
  "medicalContext": { "age": 34, "knownAllergies": ["penicillin"] }
}
```

---

### 7.3 Get chat history
```
GET /api/ai/chat/history
Authorization: Bearer <accessToken>
```
*(no body)*

---

### 7.4 Triage symptoms
```
POST /api/ai/triage
Authorization: Bearer <accessToken>
```
```json
{
  "patientId": "<patientId>",
  "symptoms": ["chest pain", "shortness of breath", "dizziness"]
}
```

---

### 7.5 Clinical decision support  *(DOCTOR/ADMIN only)*
```
POST /api/ai/decision-support
Authorization: Bearer <doctorToken>
```
```json
{
  "symptoms": ["persistent cough", "night sweats", "weight loss"],
  "medicalHistory": "smoker for 10 years, diabetes type 2",
  "labResults": {
    "WBC": "12.5",
    "CRP": "45",
    "chest_xray": "infiltrate in right lower lobe"
  }
}
```

---

## 📄 STEP 8 — OCR Documents

> Requires **ADMIN or DOCTOR** role.

### 8.1 Upload a document
```
POST /api/ocr/upload
Authorization: Bearer <doctorToken>
Content-Type: multipart/form-data
```
| Field | Value |
|-------|-------|
| `document` | *(attach a JPG, PNG, TIFF, or PDF file — max 20MB)* |
| `patientId` | `<patientId>` |

> 💾 Save the returned `id` as `docId`. Processing happens asynchronously.

---

### 8.2 Get patient documents
```
GET /api/ocr/patient/<patientId>
Authorization: Bearer <doctorToken>
```
*(no body)*

---

### 8.3 Get document by ID
```
GET /api/ocr/<docId>
Authorization: Bearer <doctorToken>
```
*(no body — response includes `fileUrl`, `extractedText`, `structuredData`, `confidence`)*

---

### 8.4 Reprocess document
```
POST /api/ocr/<docId>/reprocess
Authorization: Bearer <doctorToken>
```
*(no body)*

---

## 🔑 STEP 9 — Admin

> All admin routes require **ADMIN** token.

### 9.1 Dashboard stats
```
GET /api/admin/dashboard
Authorization: Bearer <adminToken>
```
*(no body)*

---

### 9.2 Get all users
```
GET /api/admin/users?role=DOCTOR&page=1&limit=20
Authorization: Bearer <adminToken>
```
*(no body — valid `role` filter values: `ADMIN`, `DOCTOR`, `PATIENT`)*

---

### 9.3 Get user by ID
```
GET /api/admin/users/<userId>
Authorization: Bearer <adminToken>
```
*(no body — response includes `patientProfile` or `doctorProfile`)*

---

### 9.4 Update user
```
PUT /api/admin/users/<userId>
Authorization: Bearer <adminToken>
```
```json
{
  "firstName": "Emma",
  "lastName": "Johnson",
  "role": "DOCTOR",
  "isActive": true
}
```
> ⚠️ `passwordHash` is blocked — use `/api/auth/change-password` for passwords.  
> ⚠️ Valid roles: `ADMIN`, `DOCTOR`, `PATIENT` only.

---

### 9.5 Deactivate user  *(soft delete)*
```
DELETE /api/admin/users/<userId>
Authorization: Bearer <adminToken>
```
*(no body)*

---

### 9.6 Audit logs
```
GET /api/admin/audit-logs?page=1&limit=50&resource=MedicalRecord
Authorization: Bearer <adminToken>
```
*(no body — optional filters: `userId`, `resource`)*

---

## 🏥 Health Check

```
GET /health
```
*(no auth, no body)*

---

## 📋 Quick Reference — ID Dependency Chain

```
1. Register users (PATIENT, DOCTOR, ADMIN)       →  user.id
2. Login as each role                             →  accessToken
3. Create DoctorProfile (ADMIN, doctorUserId)     →  doctorProfileId
4. Create PatientProfile (doctorToken, userId)    →  patientId
5. Create appointment (patientId, doctorUserId)   →  appointmentId  [feeAtBooking auto-set]
6. Mark appointment COMPLETED (update status)     →  needed for Review
7. Submit review (PATIENT, appointmentId)         →  reviewId  [avgRating auto-updated]
8. Create invoice (ADMIN, patientId)              →  invoiceId
9. Upload OCR document (ADMIN/DOCTOR, patientId)  →  docId
10. Create medical record (DOCTOR, patientId)     →  recordId  [doctorId auto-set]
```

---

> **Valid role values:** `PATIENT` | `DOCTOR` | `ADMIN`  
> **Valid gender values:** `MALE` | `FEMALE` | `OTHER`  
> **Valid appointment statuses:** `PENDING` | `CONFIRMED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`  
> **Valid invoice statuses:** `DRAFT` | `ISSUED` | `PAID` | `OVERDUE` | `CANCELLED`  
> **Valid triage levels:** `CRITICAL` | `URGENT` | `SEMI_URGENT` | `NON_URGENT` | `ROUTINE`
