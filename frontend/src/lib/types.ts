// Shared backend response shapes

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'NURSE';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type TriageStatus = 'GOOD' | 'INTERMEDIATE' | 'CRITICAL';

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
  accessToken: string;
  refreshToken: string;
};

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  createdAt: string;
  patientProfile?: PatientProfile | null;
  doctorProfile?: DoctorProfile | null;
};

export type PatientProfile = {
  id: string;
  userId: string;
  dateOfBirth: string;
  gender: Gender;
  bloodType?: string | null;
  allergies: string[];
  cnp?: string | null;
  insuranceNo?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  city?: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
  triageStatus?: TriageStatus | null;
  triagedAt?: string | null;
  triagedBy?: { firstName: string; lastName: string } | null;
  user?: { firstName: string; lastName: string; email: string; phone?: string };
};

export type DoctorProfile = {
  id: string;
  userId: string;
  specialty: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
  consultationFee: number;
  currency: string;
  avgRating?: number | null;
  totalReviews: number;
  languages: string[];
  clinicAddress?: string | null;
  acceptsNewPatients: boolean;
  user?: { firstName: string; lastName: string; email: string; avatarUrl?: string; phone?: string };
};

export type MedicalService = {
  id: string;
  specialty: string;
  name: string;
  description?: string | null;
  durationMin: number;
  basePrice: number;
  active: boolean;
};

export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId?: string | null;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  roomNumber?: string | null;
  feeAtBooking?: number | null;
  patient?: { triageStatus?: TriageStatus | null; user?: { firstName: string; lastName: string; email?: string } };
  doctor?: {
    firstName: string;
    lastName: string;
    email?: string;
    doctorProfile?: { id: string; specialty: string } | null;
  };
  service?: { id: string; name: string; durationMin: number; basePrice: number } | null;
  review?: { id: string; rating: number } | null;
};

export type MedicalRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  diagnosis?: string | null;
  symptoms: string[];
  treatment?: string | null;
  prescription?: string | null;
  notes?: string | null;
  isConfidential: boolean;
  createdAt: string;
  doctor?: { firstName: string; lastName: string; email?: string };
};

export type InteractionLevel = 'Major' | 'Moderate' | 'Minor' | 'Unknown';

export type DrugInteraction = {
  drugA: string;
  drugB: string;
  level: InteractionLevel;
};

// GDPR consent flags. Each gates a distinct capability server-side:
//  - analytics:      activity/event ingestion
//  - profiling:      embeddings + AI signal extraction (special-category data)
//  - marketingEmail: marketing/digest email (separate opt-in)
export type ConsentFlags = {
  analytics: boolean;
  profiling: boolean;
  marketingEmail: boolean;
  version: number;
};

// Editorial recommendation pools (admin-curated).
export type PoolItem = {
  id: string;
  poolId: string;
  adviceText: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  serviceId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pool = {
  id: string;
  tag: string;
  title: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  items: PoolItem[];
};

// A discounted off-peak slot the AI assistant proactively offers to fill a gap.
export type GapOffer = {
  doctorId: string;
  doctorName: string;
  specialty: string;
  slot: string;
  durationMin: number;
  currency: string;
  originalFee: number;
  discountPct: number;
  discountedFee: number;
};

// A ready-to-show curated recommendation (delivered via the chatbot balloon).
export type PendingRecommendation = {
  id: string;
  tag: string;
  basis: string | null;   // "why am I seeing this"
  title: string;
  advice: string;         // curated pool text — shown verbatim
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdAt: string;
};

export type Invoice = {
  id: string;
  patientId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
  dueDate?: string | null;
  paidAt?: string | null;
  stripePaymentId?: string | null;
  notes?: string | null;
  createdAt: string;
  patient?: { user?: { firstName: string; lastName: string; email?: string } };
};

export type Review = {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  patient?: { user?: { firstName: string; lastName: string } };
  appointment?: { scheduledAt: string; reason?: string };
};

export type AvailableSlot = { time: string; available: boolean };

export type DashboardStats = {
  totalPatients: number;
  totalAppointments: number;
  pendingInvoices: number;
  todayAppointments: number;
  totalRevenue: number;
};

export type AuditLog = {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: string;
  user?: { email: string; firstName: string; lastName: string };
};

export type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  patientProfile?: { id: string } | null;
  doctorProfile?: { id: string; specialty: string } | null;
};

export type ChatSession = {
  id: string;
  userId: string;
  messages: { role: string; content: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
};

export type TriageResult = {
  triage: {
    id: string;
    triageLevel: 'CRITICAL' | 'URGENT' | 'SEMI_URGENT' | 'NON_URGENT' | 'ROUTINE';
    recommendedSpecialty?: string | null;
    aiConfidence?: number | null;
  };
  reasoning: string;
};

export type UploadCategory = 'lab' | 'imaging' | 'prescription' | 'other';

export type PatientUpload = {
  id: string;
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  category: UploadCategory | string | null;
  uploadedAt: string;
  hasExtractedText: boolean;
};
