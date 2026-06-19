import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { appointmentService } from '../services/appointment.service';
import { findGapOfferForPatient } from '../services/gap-offer.service';

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
          doctor: { select: { firstName: true, lastName: true, email: true, doctorProfile: { select: { id: true, specialty: true } } } },
          service: { select: { id: true, name: true, durationMin: true, basePrice: true } },
          review: { select: { id: true, rating: true } },
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
    const { patientId, doctorId, serviceId, scheduledAt, duration, reason, notes, roomNumber, applyGapDiscount } =
      req.body;

    let durationFinal = duration ?? 30;
    let feeAtBooking: number | null = null;

    if (serviceId) {
      const service = await prisma.medicalService.findUnique({ where: { id: serviceId } });
      if (!service || !service.active) throw new ApiError(400, 'Selected service is not available');
      durationFinal = service.durationMin;
      feeAtBooking = service.basePrice;
    } else {
      const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorId } });
      feeAtBooking = doctorProfile?.consultationFee ?? null;
    }

    // Gap-fill discount: only honored when the slot is genuinely in the late
    // discount window — the percent comes from config, never the client. This
    // ties the discount to off-peak slots and prevents abusing it for any time.
    let originalFee: number | null = null;
    let discountPct: number | null = null;
    let discountReason: string | null = null;
    const slotHour = new Date(scheduledAt).getHours();
    if (
      applyGapDiscount &&
      feeAtBooking != null &&
      env.SLOT_GAP_DISCOUNT_PCT > 0 &&
      slotHour >= env.SLOT_GAP_START_HOUR
    ) {
      originalFee = feeAtBooking;
      discountPct = env.SLOT_GAP_DISCOUNT_PCT;
      discountReason = 'GAP_FILL';
      feeAtBooking = Math.round(feeAtBooking * (1 - discountPct / 100) * 100) / 100;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        serviceId: serviceId ?? null,
        scheduledAt: new Date(scheduledAt),
        duration: durationFinal,
        reason,
        notes,
        roomNumber,
        feeAtBooking,
        originalFee,
        discountPct,
        discountReason,
      },
      include: {
        service: { select: { id: true, name: true, durationMin: true, basePrice: true } },
      },
    });
    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/gap-offer — a discounted off-peak slot for the caller
// (patient). Returns { offer: null } when none applies.
export const getGapOffer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== 'PATIENT') {
      res.json({ offer: null });
      return;
    }
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!profile) {
      res.json({ offer: null });
      return;
    }
    res.json({ offer: await findGapOfferForPatient(profile.id) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/appointments/:id
export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { scheduledAt, duration, status, reason, notes, roomNumber } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: {
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(duration !== undefined && { duration }),
        ...(status !== undefined && { status }),
        ...(reason !== undefined && { reason }),
        ...(notes !== undefined && { notes }),
        ...(roomNumber !== undefined && { roomNumber }),
      },
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

// GET /api/appointments/optimized-schedule
export const getOptimizedSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { doctorId, date } = req.query as Record<string, string>;
    const schedule = await appointmentService.getOptimizedSchedule(doctorId, date);
    res.json(schedule);
  } catch (err) {
    next(err);
  }
};
