import { Router } from 'express';
import {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  getAvailableSlots,
  getOptimizedSchedule,
  getGapOffer,
} from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { createAppointmentSchema, updateAppointmentSchema } from '../validators/appointment.validator';

const router = Router();

router.use(authenticate);

router.get('/', getAllAppointments);
router.get('/available-slots', getAvailableSlots);
router.get('/gap-offer', getGapOffer);
router.get('/optimized-schedule', authorize('ADMIN', 'DOCTOR'), getOptimizedSchedule);
router.post('/', validate(createAppointmentSchema), createAppointment);
router.get('/:id', getAppointmentById);
router.put('/:id', validate(updateAppointmentSchema), updateAppointment);
router.delete('/:id/cancel', cancelAppointment);

export default router;
