import { z } from 'zod';

export const createPoolSchema = z.object({
  tag: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  active: z.boolean().optional(),
});

export const updatePoolSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' });

export const createItemSchema = z.object({
  adviceText: z.string().min(1).max(2000),
  ctaLabel: z.string().max(120).optional(),
  ctaUrl: z.string().max(500).optional(),
  serviceId: z.string().max(100).optional(),
  active: z.boolean().optional(),
});

export const updateItemSchema = z
  .object({
    adviceText: z.string().min(1).max(2000).optional(),
    ctaLabel: z.string().max(120).nullable().optional(),
    ctaUrl: z.string().max(500).nullable().optional(),
    serviceId: z.string().max(100).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' });
