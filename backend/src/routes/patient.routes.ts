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
} from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All patient routes require authentication
router.use(authenticate);

// GET /api/patients
router.get('/', authorize('ADMIN', 'DOCTOR'), getAllPatients);

// POST /api/patients
router.post('/', authorize('ADMIN', 'DOCTOR'), createPatient);

// GET /api/patients/:id
router.get('/:id', getPatientById);

// PUT /api/patients/:id
router.put('/:id', authorize('ADMIN', 'DOCTOR'), updatePatient);

// DELETE /api/patients/:id
router.delete('/:id', authorize('ADMIN'), deletePatient);

// ─── Medical Records ───────────────────────────────────

// GET /api/patients/:id/medical-records
router.get('/:id/medical-records', authorize('ADMIN', 'DOCTOR'), getPatientMedicalRecords);

// POST /api/patients/:id/medical-records  (DOCTOR authors via req.user.id)
router.post('/:id/medical-records', authorize('ADMIN', 'DOCTOR'), createMedicalRecord);

// GET /api/patients/:id/medical-records/:recordId
router.get('/:id/medical-records/:recordId', authorize('ADMIN', 'DOCTOR'), getMedicalRecordById);

export default router;
