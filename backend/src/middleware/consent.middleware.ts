import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { hasConsent, ConsentFlag } from '../services/consent.service';

/**
 * Gate a route on a specific GDPR consent flag. Server-side enforcement —
 * the UI hiding a feature is not enough; the API must refuse without consent.
 * Responds 403 (with the missing flag) when the user has not opted in.
 */
export const requireConsent = (flag: ConsentFlag) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    try {
      if (!(await hasConsent(req.user.id, flag))) {
        res.status(403).json({ error: 'Consent required', flag });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
