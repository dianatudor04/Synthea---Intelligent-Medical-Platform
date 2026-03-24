import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// POST /api/reviews  — PATIENT submits a review after a COMPLETED appointment
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating) throw new ApiError(400, 'appointmentId and rating are required');
    if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5');

    // Verify appointment exists and is COMPLETED
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: { include: { doctorProfile: true } },
      },
    });
    if (!appointment) throw new ApiError(404, 'Appointment not found');
    if (appointment.status !== 'COMPLETED') throw new ApiError(400, 'Can only review completed appointments');

    // Verify the requester is the patient of this appointment
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user!.id },
    });
    if (!patientProfile || appointment.patientId !== patientProfile.id) {
      throw new ApiError(403, 'You can only review your own appointments');
    }

    // Check doctor has a DoctorProfile
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: appointment.doctorId },
    });
    if (!doctorProfile) throw new ApiError(404, 'Doctor profile not found');

    // Create review (unique constraint on appointmentId prevents duplicates)
    const review = await prisma.review.create({
      data: {
        patientId: patientProfile.id,
        doctorId: doctorProfile.id,
        appointmentId,
        rating,
        comment,
      },
    });

    // Recompute DoctorProfile avgRating and totalReviews
    const stats = await prisma.review.aggregate({
      where: { doctorId: doctorProfile.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.doctorProfile.update({
      where: { id: doctorProfile.id },
      data: {
        avgRating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/doctor/:doctorId  — list all reviews for a DoctorProfile ID
export const getDoctorReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { doctorId: req.params.doctorId },
        include: {
          patient: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          appointment: { select: { scheduledAt: true, reason: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { doctorId: req.params.doctorId } }),
    ]);

    res.json({ data: reviews, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/reviews/:id  — single review
export const getReviewById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!review) throw new ApiError(404, 'Review not found');
    res.json(review);
  } catch (err) {
    next(err);
  }
};
