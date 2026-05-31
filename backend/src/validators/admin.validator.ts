import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'DOCTOR', 'PATIENT']).optional(),
  isActive: z.boolean().optional(),
});
