// Domain-specific API helpers built on top of the api client.
import { api, apiBaseUrl, tokenStorage, ApiRequestError } from './api';
import {
  Appointment,
  AvailableSlot,
  DashboardStats,
  DoctorProfile,
  Invoice,
  MedicalRecord,
  MedicalService,
  Paginated,
  PatientProfile,
  PatientUpload,
  Review,
  ChatSession,
  TriageResult,
  AuditLog,
  AdminUser,
  UserProfile,
  UploadCategory,
  DrugInteraction,
  ConsentFlags,
  PendingRecommendation,
  Pool,
  PoolItem,
  GapOffer,
} from './types';

// ─── Patients ────────────────────────────────────────────────────────
export const patientsApi = {
  list: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<Paginated<PatientProfile>>('/patients', params),
  get: (id: string) => api.get<PatientProfile & { appointments: Appointment[]; medicalRecords: MedicalRecord[] }>(`/patients/${id}`),
  create: (input: {
    userId: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    address?: string;
    city?: string;
    country?: string;
    bloodType?: string;
    allergies?: string[];
    cnp?: string;
    insuranceNo?: string;
    emergencyContact?: string;
  }) => api.post<PatientProfile>('/patients', input),
  update: (id: string, input: Partial<PatientProfile>) => api.put<PatientProfile>(`/patients/${id}`, input),
  remove: (id: string) => api.del<{ message: string }>(`/patients/${id}`),
  medicalRecords: (id: string, params: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<MedicalRecord>>(`/patients/${id}/medical-records`, params),
  createMedicalRecord: (id: string, input: Partial<MedicalRecord>) =>
    api.post<MedicalRecord>(`/patients/${id}/medical-records`, input),
};

// ─── Drug interactions (DDInter) ─────────────────────────────────────
export const interactionsApi = {
  searchDrugs: (search: string, limit = 10) =>
    api.get<{ drugs: string[] }>('/interactions/drugs', { search, limit }),
  check: (drugs: string[]) =>
    api.post<{ interactions: DrugInteraction[]; count: number }>('/interactions/check', { drugs }),
};

// ─── Consent (GDPR flags) ────────────────────────────────────────────
export const consentApi = {
  get: () => api.get<ConsentFlags>('/consent'),
  update: (patch: Partial<Pick<ConsentFlags, 'analytics' | 'profiling' | 'marketingEmail'>>) =>
    api.put<ConsentFlags>('/consent', patch),
};

// ─── Recommendations (curated, delivered in the balloon) ─────────────
export const recommendationsApi = {
  pending: () => api.get<{ data: PendingRecommendation[] }>('/recommendations/pending'),
  ack: (id: string, channel: 'BALLOON' | 'EMAIL' = 'BALLOON') =>
    api.post<{ acknowledged: boolean }>(`/recommendations/${id}/ack`, { channel }),
  dismiss: (id: string) => api.post<{ dismissed: boolean }>(`/recommendations/${id}/dismiss`),
};

// ─── Recommendation pools (admin editorial CRUD) ─────────────────────
export const poolsApi = {
  list: () => api.get<{ data: Pool[] }>('/pools'),
  createPool: (input: { tag: string; title: string; description?: string; active?: boolean }) =>
    api.post<Pool>('/pools', input),
  updatePool: (id: string, input: Partial<{ title: string; description: string | null; active: boolean }>) =>
    api.patch<Pool>(`/pools/${id}`, input),
  deletePool: (id: string) => api.del<void>(`/pools/${id}`),
  createItem: (
    poolId: string,
    input: { adviceText: string; ctaLabel?: string; ctaUrl?: string; serviceId?: string; active?: boolean },
  ) => api.post<PoolItem>(`/pools/${poolId}/items`, input),
  updateItem: (
    itemId: string,
    input: Partial<{ adviceText: string; ctaLabel: string | null; ctaUrl: string | null; active: boolean }>,
  ) => api.patch<PoolItem>(`/pools/items/${itemId}`, input),
  deleteItem: (itemId: string) => api.del<void>(`/pools/items/${itemId}`),
};

// ─── Doctors ─────────────────────────────────────────────────────────
export const doctorsApi = {
  list: (params: { specialty?: string; acceptsNewPatients?: boolean; page?: number; limit?: number } = {}) =>
    api.get<Paginated<DoctorProfile>>('/doctors', params),
  get: (id: string) => api.get<DoctorProfile & { reviews: Review[] }>(`/doctors/${id}`),
  getByUserId: (userId: string) => api.get<DoctorProfile>(`/doctors/by-user/${userId}`),
  createProfile: (input: {
    userId: string;
    specialty: string;
    consultationFee: number;
    bio?: string;
    yearsOfExperience?: number;
    currency?: string;
    languages?: string[];
    clinicAddress?: string;
    acceptsNewPatients?: boolean;
  }) => api.post<DoctorProfile>('/doctors/profile', input),
  updateProfile: (id: string, input: Partial<DoctorProfile>) => api.put<DoctorProfile>(`/doctors/${id}/profile`, input),
};

// ─── Services ────────────────────────────────────────────────────────
export const servicesApi = {
  list: (params: { specialty?: string; includeInactive?: boolean } = {}) =>
    api.get<{ data: MedicalService[]; total: number }>('/services', params),
  specialties: () => api.get<{ data: string[] }>('/services/specialties'),
  get: (id: string) => api.get<MedicalService>(`/services/${id}`),
};

// ─── Appointments ────────────────────────────────────────────────────
export const appointmentsApi = {
  list: (params: { page?: number; limit?: number; doctorId?: string; patientId?: string; status?: string; date?: string } = {}) =>
    api.get<Paginated<Appointment>>('/appointments', params),
  get: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  create: (input: { patientId: string; doctorId: string; serviceId?: string; scheduledAt: string; duration?: number; reason?: string; notes?: string; roomNumber?: string; applyGapDiscount?: boolean }) =>
    api.post<Appointment>('/appointments', input),
  update: (id: string, input: Partial<Appointment>) => api.put<Appointment>(`/appointments/${id}`, input),
  cancel: (id: string) => api.del<Appointment>(`/appointments/${id}/cancel`),
  availableSlots: (doctorId: string, date: string) =>
    api.get<AvailableSlot[]>('/appointments/available-slots', { doctorId, date }),
  gapOffer: () => api.get<{ offer: GapOffer | null }>('/appointments/gap-offer'),
  optimizedSchedule: (params: { doctorId?: string; date?: string }) =>
    api.get<{ appointments: Appointment[]; optimization: Record<string, unknown> }>('/appointments/optimized-schedule', params),
};

// ─── Billing ─────────────────────────────────────────────────────────
export const billingApi = {
  list: (params: { patientId?: string; status?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<Invoice>>('/billing/invoices', params),
  get: (id: string) => api.get<Invoice>(`/billing/invoices/${id}`),
  create: (input: {
    patientId: string;
    amount: number;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    currency?: string;
    dueDate?: string;
    notes?: string;
  }) => api.post<Invoice>('/billing/invoices', input),
  update: (id: string, input: Partial<Invoice>) => api.put<Invoice>(`/billing/invoices/${id}`, input),
  pay: (id: string, paymentMethod: string) => api.post<Invoice>(`/billing/invoices/${id}/pay`, { paymentMethod }),
  report: (params: { startDate?: string; endDate?: string }) =>
    api.get<{ summary: { totalRevenue: number; paidInvoices: number; pendingInvoices: number; currency: string } }>('/billing/report', params),
};

// ─── AI ──────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (input: { message: string; sessionId?: string }) =>
    api.post<{ reply: string; sessionId: string }>('/ai/chat', input),
  history: () => api.get<ChatSession[]>('/ai/chat/history'),
  triage: (input: { patientId: string; symptoms: string[] }) => api.post<TriageResult>('/ai/triage', input),
  decisionSupport: (input: { symptoms: string[]; medicalHistory?: string; labResults?: Record<string, unknown> }) =>
    api.post<{
      possibleDiagnoses: { name: string; confidence: number }[];
      recommendedTests: string[];
      treatmentSuggestions: string[];
      warnings: string[];
      disclaimer: string;
    }>('/ai/decision-support', input),
};

// ─── Reviews ─────────────────────────────────────────────────────────
export const reviewsApi = {
  create: (input: { appointmentId: string; rating: number; comment?: string }) =>
    api.post<Review>('/reviews', input),
  byDoctor: (doctorId: string, params: { page?: number; limit?: number } = {}) =>
    api.get<Paginated<Review>>(`/reviews/doctor/${doctorId}`, params),
};

// ─── Admin ───────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get<DashboardStats>('/admin/dashboard'),
  users: (params: { role?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<AdminUser>>('/admin/users', params),
  user: (id: string) => api.get<AdminUser>(`/admin/users/${id}`),
  updateUser: (id: string, input: Partial<{ firstName: string; lastName: string; phone: string; role: string; isActive: boolean }>) =>
    api.put<AdminUser>(`/admin/users/${id}`, input),
  deactivate: (id: string) => api.del<{ message: string }>(`/admin/users/${id}`),
  auditLogs: (params: { userId?: string; resource?: string; page?: number; limit?: number } = {}) =>
    api.get<Paginated<AuditLog>>('/admin/audit-logs', params),
};

// ─── Auth profile ────────────────────────────────────────────────────
export const authApi = {
  profile: () => api.get<UserProfile>('/auth/profile'),
  updateProfile: (input: { firstName?: string; lastName?: string; phone?: string }) =>
    api.put<UserProfile>('/auth/profile', input),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    api.put<{ message: string }>('/auth/change-password', input),
};

// ─── Personal Uploads ────────────────────────────────────────────────
export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number; // 0..100
};

export const uploadsApi = {
  list: () => api.get<{ data: PatientUpload[] }>('/uploads').then((r) => r.data),

  remove: (id: string) => api.del<void>(`/uploads/${id}`),

  /**
   * Fetch a short-lived presigned URL. `inline` controls Content-Disposition:
   * true → open in browser (view), false → download attachment.
   */
  downloadUrl: (id: string, inline = false) =>
    api.get<{ url: string; expiresIn: number }>(`/uploads/${id}/download`, { inline: inline ? 1 : 0 }),

  /**
   * Upload using XHR so we get real upload progress events.
   * Returns the created PatientUpload record on success.
   */
  upload(opts: {
    file: File;
    category?: UploadCategory;
    onProgress?: (p: UploadProgress) => void;
    signal?: AbortSignal;
  }): Promise<PatientUpload> {
    const { file, category, onProgress, signal } = opts;
    const form = new FormData();
    form.append('file', file, file.name);
    if (category) form.append('category', category);

    return new Promise<PatientUpload>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${apiBaseUrl}/uploads`, true);

      const token = tokenStorage.getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (!onProgress) return;
        if (e.lengthComputable) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      };

      xhr.onload = () => {
        const status = xhr.status;
        let body: unknown = null;
        try {
          body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          body = null;
        }
        if (status >= 200 && status < 300) {
          resolve(body as PatientUpload);
        } else {
          const message =
            (body as { error?: string })?.error || `Upload failed: ${status}`;
          reject(new ApiRequestError(message, status, body));
        }
      };

      xhr.onerror = () => reject(new ApiRequestError('Network error during upload', 0));
      xhr.onabort = () => reject(new ApiRequestError('Upload cancelled', 0));

      if (signal) {
        if (signal.aborted) {
          xhr.abort();
        } else {
          signal.addEventListener('abort', () => xhr.abort(), { once: true });
        }
      }

      xhr.send(form);
    });
  },
};
