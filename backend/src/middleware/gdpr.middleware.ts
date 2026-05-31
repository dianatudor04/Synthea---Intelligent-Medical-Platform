import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from './auth.middleware';

const SENSITIVE_ROUTES = ['/api/patients', '/api/appointments', '/api/billing', '/api/ocr'];

/**
 * GDPR / HIPAA Audit Logging Middleware
 * Logs all API requests to PHI-sensitive endpoints.
 * Non-blocking: fires audit log asynchronously without awaiting.
 */
export const gdprLogger = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const isSensitive = SENSITIVE_ROUTES.some((route) => req.path.startsWith(route));

  if (isSensitive && req.user) {
    prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: `${req.method}_${req.path.split('/')[2]?.toUpperCase() || 'UNKNOWN'}`,
        resource: req.path.split('/')[2] || 'unknown',
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    }).catch(() => {
      // Audit logging must not block the request
    });
  }

  next();
};
