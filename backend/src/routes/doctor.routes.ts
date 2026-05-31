import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  getDoctorByUserId,
  createDoctorProfile,
  updateDoctorProfile,
} from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { createDoctorProfileSchema, updateDoctorProfileSchema } from '../validators/doctor.validator';

const router = Router();

router.get('/', getAllDoctors);
router.get('/by-user/:userId', getDoctorByUserId);
router.get('/:id', getDoctorById);
router.post('/profile', authenticate, authorize('ADMIN'), validate(createDoctorProfileSchema), createDoctorProfile);
router.put('/:id/profile', authenticate, authorize('ADMIN', 'DOCTOR'), validate(updateDoctorProfileSchema), updateDoctorProfile);

export default router;
