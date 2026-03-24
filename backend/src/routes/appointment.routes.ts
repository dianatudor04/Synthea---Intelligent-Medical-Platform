import { Router } from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  getOptimizedSchedule,
} from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/appointments
router.get('/', getAllAppointments);

// GET /api/appointments/available-slots
router.get('/available-slots', getAvailableSlots);

// GET /api/appointments/optimized-schedule  (AI-powered ML scheduling)
router.get('/optimized-schedule', authorize('ADMIN', 'DOCTOR'), getOptimizedSchedule);

// POST /api/appointments
router.post('/', createAppointment);

// GET /api/appointments/:id
router.get('/:id', getAppointmentById);

// PUT /api/appointments/:id
router.put('/:id', updateAppointment);

// DELETE /api/appointments/:id/cancel
router.delete('/:id/cancel', cancelAppointment);

export default router;
