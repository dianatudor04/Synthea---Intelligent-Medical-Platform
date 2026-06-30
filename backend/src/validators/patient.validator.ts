import { z } from 'zod';

export const createPatientSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  dateOfBirth: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date format'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  cnp: z.string().optional(),
  insuranceNo: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const updatePatientSchema = z.object({
  dateOfBirth: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date format').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  cnp: z.string().optional(),
  insuranceNo: z.string().optional(),
  emergencyContact: z.string().optional(),
});

export const setTriageStatusSchema = z.object({
  triageStatus: z.enum(['GOOD', 'INTERMEDIATE', 'CRITICAL']),
});

export const createMedicalRecordSchema = z.object({
  diagnosis: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  treatment: z.string().optional(),
  prescription: z.string().optional(),
  labResults: z.record(z.unknown()).optional(),
  notes: z.string().optional(),
  isConfidential: z.boolean().default(false),
  appointmentId: z.string().uuid().optional(),
});
