import { z } from 'zod';

export const updateConsentSchema = z
  .object({
    analytics: z.boolean().optional(),
    profiling: z.boolean().optional(),
    marketingEmail: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: 'At least one consent flag must be provided',
  });
