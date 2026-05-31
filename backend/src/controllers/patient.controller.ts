import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/patients
export const getAllPatients = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = search
      ? {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patientProfile.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patientProfile.count({ where }),
    ]);

    res.json({ data: patients, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/patients/:id
export const getPatientById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatarUrl: true } },
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 5 },
        medicalRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!patient) throw new ApiError(404, 'Patient not found');
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

// POST /api/patients
export const createPatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, dateOfBirth, gender, address, city, country, bloodType, allergies, cnp, insuranceNo, emergencyContact } = req.body;

    const existing = await prisma.patientProfile.findUnique({ where: { userId } });
    if (existing) throw new ApiError(409, 'Patient profile already exists for this user');

    const patient = await prisma.patientProfile.create({
      data: { userId, dateOfBirth: new Date(dateOfBirth), gender, address, city, country, bloodType, allergies, cnp, insuranceNo, emergencyContact },
    });
    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
};

// PUT /api/patients/:id
export const updatePatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const target = await prisma.patientProfile.findUnique({ where: { id: req.params.id } });
    if (!target) throw new ApiError(404, 'Patient not found');

    // Patients may only update their own profile; staff (ADMIN/DOCTOR) may update any.
    if (req.user!.role === 'PATIENT' && target.userId !== req.user!.id) {
      throw new ApiError(403, 'You can only update your own patient profile');
    }

    const { dateOfBirth, gender, address, city, country, bloodType, allergies, cnp, insuranceNo, emergencyContact } = req.body;

    const patient = await prisma.patientProfile.update({
      where: { id: req.params.id },
      data: {
        ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(bloodType !== undefined && { bloodType }),
        ...(allergies !== undefined && { allergies }),
        ...(cnp !== undefined && { cnp }),
        ...(insuranceNo !== undefined && { insuranceNo }),
        ...(emergencyContact !== undefined && { emergencyContact }),
      },
    });
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/patients/:id (soft delete — deactivate associated user)
export const deletePatient = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const patient = await prisma.patientProfile.findUnique({ where: { id: req.params.id } });
    if (!patient) throw new ApiError(404, 'Patient not found');

    await prisma.user.update({
      where: { id: patient.userId },
      data: { isActive: false },
    });

    res.json({ message: 'Patient deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/patients/:id/medical-records
export const getPatientMedicalRecords = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { patientId: req.params.id },
        include: {
          doctor: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.medicalRecord.count({ where: { patientId: req.params.id } }),
    ]);

    res.json({ data: records, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/patients/:id/medical-records
export const createMedicalRecord = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { diagnosis, symptoms, treatment, prescription, labResults, notes, isConfidential, appointmentId } = req.body;

    const record = await prisma.medicalRecord.create({
      data: {
        patientId: req.params.id,
        doctorId: req.user!.id,
        diagnosis,
        symptoms,
        treatment,
        prescription,
        labResults,
        notes,
        isConfidential,
        appointmentId,
      },
    });
    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

// GET /api/patients/:id/medical-records/:recordId
export const getMedicalRecordById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.medicalRecord.findFirst({
      where: { id: req.params.recordId, patientId: req.params.id },
      include: {
        doctor: { select: { firstName: true, lastName: true, email: true } },
      },
    });
    if (!record) throw new ApiError(404, 'Medical record not found');
    res.json(record);
  } catch (err) {
    next(err);
  }
};
