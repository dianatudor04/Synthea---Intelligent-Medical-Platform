import { z } from 'zod';

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('RON'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  dueDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date format').optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  lineItems: z.array(lineItemSchema).optional(),
  dueDate: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date format').optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'ISSUED', 'OVERDUE', 'CANCELLED']).optional(),
});

export const processPaymentSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
});
