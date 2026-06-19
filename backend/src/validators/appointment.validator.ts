import { z } from 'zod';

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  doctorId: z.string().uuid('Invalid doctor ID'),
  serviceId: z.string().uuid('Invalid service ID').optional(),
  scheduledAt: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date format'),
  duration: z.number().int().min(15).max(240).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  roomNumber: z.string().optional(),
  // When true and the slot is in the late discount window, the server applies
  // the configured gap-fill discount (percent is never taken from the client).
  applyGapDiscount: z.boolean().optional(),
});

export const updateAppointmentSchema = z.object({
  scheduledAt: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date format').optional(),
  duration: z.number().int().min(15).max(240).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  roomNumber: z.string().optional(),
});
