import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/services?specialty=X
export const listServices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { specialty, includeInactive } = req.query as Record<string, string>;

    const where: Record<string, unknown> = {};
    if (specialty) where.specialty = specialty;
    if (includeInactive !== 'true') where.active = true;

    const services = await prisma.medicalService.findMany({
      where,
      orderBy: [{ specialty: 'asc' }, { basePrice: 'asc' }],
    });

    res.json({ data: services, total: services.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/services/specialties — distinct list of all specialties that have services
export const listSpecialties = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.medicalService.findMany({
      where: { active: true },
      distinct: ['specialty'],
      select: { specialty: true },
      orderBy: { specialty: 'asc' },
    });
    res.json({ data: rows.map((r) => r.specialty) });
  } catch (err) {
    next(err);
  }
};

// GET /api/services/:id
export const getService = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const service = await prisma.medicalService.findUnique({ where: { id: req.params.id } });
    if (!service) throw new ApiError(404, 'Service not found');
    res.json(service);
  } catch (err) {
    next(err);
  }
};
