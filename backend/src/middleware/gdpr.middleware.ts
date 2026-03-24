import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth.middleware';

/**
 * GDPR / HIPAA Audit Logging Middleware
 * Logs all API requests for compliance audit trails.
 * Only logs authenticated requests to PHI-sensitive endpoints.
 */
export const gdprLogger = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Only audit PHI-sensitive routes
  const sensitiveRoutes = ['/api/patients', '/api/appointments', '/api/billing', '/api/ocr'];
  const isSensitive = sensitiveRoutes.some((route) => req.path.startsWith(route));

  if (isSensitive && req.user) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: `${req.method}_${req.path.split('/')[2]?.toUpperCase() || 'UNKNOWN'}`,
          resource: req.path.split('/')[2] || 'unknown',
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    } catch {
      // Audit logging must not block the request
    }
  }

  next();
};
