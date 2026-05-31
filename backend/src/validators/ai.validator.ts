import { z } from 'zod';

export const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000),
  sessionId: z.string().uuid().optional(),
  medicalContext: z.record(z.unknown()).optional(),
});

export const triageSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
});

export const decisionSupportSchema = z.object({
  symptoms: z.array(z.string()).min(1, 'At least one symptom is required'),
  medicalHistory: z.string().optional(),
  labResults: z.record(z.unknown()).optional(),
});
