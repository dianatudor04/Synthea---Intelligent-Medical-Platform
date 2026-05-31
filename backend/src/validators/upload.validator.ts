import { z } from 'zod';

export const ALLOWED_CATEGORIES = ['lab', 'imaging', 'prescription', 'other'] as const;
export type UploadCategory = (typeof ALLOWED_CATEGORIES)[number];

export const uploadMetaSchema = z.object({
  category: z.enum(ALLOWED_CATEGORIES).optional(),
});

export const uploadIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listQuerySchema = z.object({
  source: z.enum(['PATIENT_UPLOAD', 'OCR', 'ALL']).optional().default('PATIENT_UPLOAD'),
});
