import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/doctors
export const getAllDoctors = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { specialty, acceptsNewPatients, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (specialty) where.specialty = { contains: specialty, mode: 'insensitive' };
    if (acceptsNewPatients === 'true') where.acceptsNewPatients = true;

    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true, phone: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { avgRating: 'desc' },
      }),
      prisma.doctorProfile.count({ where }),
    ]);

    res.json({ data: doctors, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/:id
export const getDoctorById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true, phone: true } },
        reviews: {
          include: {
            patient: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!doctor) throw new ApiError(404, 'Doctor profile not found');
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/by-user/:userId
export const getDoctorByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.params.userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } },
      },
    });
    if (!doctor) throw new ApiError(404, 'Doctor profile not found');
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

// POST /api/doctors/profile
export const createDoctorProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, specialty, bio, yearsOfExperience, consultationFee, currency, languages, clinicAddress, acceptsNewPatients } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role !== 'DOCTOR') throw new ApiError(400, 'User must have role DOCTOR');

    const existing = await prisma.doctorProfile.findUnique({ where: { userId } });
    if (existing) throw new ApiError(409, 'Doctor profile already exists for this user');

    const profile = await prisma.doctorProfile.create({
      data: { userId, specialty, bio, yearsOfExperience, consultationFee, currency, languages, clinicAddress, acceptsNewPatients },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
};

// PUT /api/doctors/:id/profile
export const updateDoctorProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { specialty, bio, yearsOfExperience, consultationFee, currency, languages, clinicAddress, acceptsNewPatients } = req.body;

    const existing = await prisma.doctorProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new ApiError(404, 'Doctor profile not found');

    if (req.user!.role === 'DOCTOR' && existing.userId !== req.user!.id) {
      throw new ApiError(403, 'Doctors can only update their own profile');
    }

    const profile = await prisma.doctorProfile.update({
      where: { id: req.params.id },
      data: {
        ...(specialty !== undefined && { specialty }),
        ...(bio !== undefined && { bio }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience }),
        ...(consultationFee !== undefined && { consultationFee }),
        ...(currency !== undefined && { currency }),
        ...(languages !== undefined && { languages }),
        ...(clinicAddress !== undefined && { clinicAddress }),
        ...(acceptsNewPatients !== undefined && { acceptsNewPatients }),
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    res.json(profile);
  } catch (err) {
    next(err);
  }
};
