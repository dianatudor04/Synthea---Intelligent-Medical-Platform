import { z } from 'zod';

export const checkInteractionsSchema = z.object({
  drugs: z.array(z.string().min(1)).min(1, 'At least one drug is required').max(50),
});
