import { z } from 'zod';

export const createDoctorProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  specialty: z.string().min(1, 'Specialty is required'),
  bio: z.string().optional(),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  consultationFee: z.number().positive('Consultation fee must be positive'),
  currency: z.string().default('RON'),
  languages: z.array(z.string()).default(['RO']),
  clinicAddress: z.string().optional(),
  acceptsNewPatients: z.boolean().default(true),
});

export const updateDoctorProfileSchema = z.object({
  specialty: z.string().min(1).optional(),
  bio: z.string().optional(),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  consultationFee: z.number().positive().optional(),
  currency: z.string().optional(),
  languages: z.array(z.string()).optional(),
  clinicAddress: z.string().optional(),
  acceptsNewPatients: z.boolean().optional(),
});
