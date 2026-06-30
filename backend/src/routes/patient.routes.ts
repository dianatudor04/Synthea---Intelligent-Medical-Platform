import { Router } from 'express';
import {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientMedicalRecords,
  createMedicalRecord,
  getMedicalRecordById,
  setTriageStatus,
} from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { createPatientSchema, updatePatientSchema, createMedicalRecordSchema, setTriageStatusSchema } from '../validators/patient.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize('ADMIN', 'DOCTOR', 'NURSE'), getAllPatients);
router.post('/', authorize('ADMIN', 'DOCTOR'), validate(createPatientSchema), createPatient);
router.get('/:id', getPatientById);
// Authenticated; controller enforces patient-self-update ownership.
router.put('/:id', validate(updatePatientSchema), updatePatient);
router.delete('/:id', authorize('ADMIN'), deletePatient);

// Manual triage status — staff only.
router.put('/:id/triage', authorize('DOCTOR', 'NURSE', 'ADMIN'), validate(setTriageStatusSchema), setTriageStatus);

// Medical Records
router.get('/:id/medical-records', authorize('ADMIN', 'DOCTOR'), getPatientMedicalRecords);
router.post('/:id/medical-records', authorize('ADMIN', 'DOCTOR'), validate(createMedicalRecordSchema), createMedicalRecord);
router.get('/:id/medical-records/:recordId', authorize('ADMIN', 'DOCTOR'), getMedicalRecordById);

export default router;
