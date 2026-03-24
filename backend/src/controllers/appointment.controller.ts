import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { appointmentService } from '../services/appointment.service';

// GET /api/appointments
export const getAllAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', doctorId, patientId, status, date } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (date) {
      const d = new Date(date);
      where.scheduledAt = {
        gte: new Date(d.setHours(0, 0, 0, 0)),
        lte: new Date(d.setHours(23, 59, 59, 999)),
      };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          doctor: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({ data: appointments, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        doctor: { select: { firstName: true, lastName: true } },
        medicalRecord: true,
        review: true,
      },
    });
    if (!appointment) throw new ApiError(404, 'Appointment not found');
    res.json(appointment);
  } catch (err) {
    next(err);
  }
};

// POST /api/appointments
export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, doctorId, scheduledAt, duration, reason, notes, roomNumber } = req.body;

    // Snapshot the doctor's consultation fee at booking time
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
    const feeAtBooking = doctorProfile?.consultationFee ?? null;

    const appointment = await prisma.appointment.create({
      data: { patientId, doctorId, scheduledAt: new Date(scheduledAt), duration, reason, notes, roomNumber, feeAtBooking },
    });
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
};

// PUT /api/appointments/:id
export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { feeAtBooking, ...data } = req.body; // prevent feeAtBooking override
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data,
    });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/appointments/:id/cancel
export const cancelAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/available-slots
export const getAvailableSlots = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query as Record<string, string>;
    if (!doctorId || !date) throw new ApiError(400, 'doctorId and date are required');

    const slots = await appointmentService.getAvailableSlots(doctorId, new Date(date));
    res.json(slots);
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/optimized-schedule  (AI/ML stub)
export const getOptimizedSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query as Record<string, string>;
    const schedule = await appointmentService.getOptimizedSchedule(doctorId, date);
    res.json(schedule);
  } catch (err) {
    next(err);
  }
};
