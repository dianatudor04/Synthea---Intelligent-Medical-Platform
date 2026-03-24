import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/admin/dashboard
export const getDashboardStats = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [totalPatients, totalAppointments, pendingInvoices, todayAppointments] = await Promise.all([
      prisma.patientProfile.count(),
      prisma.appointment.count(),
      prisma.invoice.count({ where: { status: 'ISSUED' } }),
      prisma.appointment.count({
        where: {
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    const revenueResult = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    });

    res.json({
      totalPatients,
      totalAppointments,
      pendingInvoices,
      todayAppointments,
      totalRevenue: revenueResult._sum.amount || 0,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          patientProfile: { select: { id: true } },
          doctorProfile: { select: { id: true, specialty: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        patientProfile: true,
        doctorProfile: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/users/:id
export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { passwordHash, ...data } = req.body; // Prevent direct password update
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id  (soft delete)
export const deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, resource, page = '1', limit = '50' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};
