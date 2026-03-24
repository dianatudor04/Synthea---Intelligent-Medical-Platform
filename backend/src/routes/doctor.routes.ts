import { Router } from 'express';
import {
  getAllDoctors,
  getDoctorById,
  getDoctorByUserId,
  createDoctorProfile,
  updateDoctorProfile,
} from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// GET /api/doctors  — public, no auth required
router.get('/', getAllDoctors);

// GET /api/doctors/by-user/:userId — look up doctor profile by user ID
router.get('/by-user/:userId', getDoctorById);

// GET /api/doctors/:id
router.get('/:id', getDoctorById);

// POST /api/doctors/profile  — ADMIN only
router.post('/profile', authenticate, authorize('ADMIN'), createDoctorProfile);

// PUT /api/doctors/:id/profile  — ADMIN or the DOCTOR themselves
router.put('/:id/profile', authenticate, authorize('ADMIN', 'DOCTOR'), updateDoctorProfile);

export default router;
