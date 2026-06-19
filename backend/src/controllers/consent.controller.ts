import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getConsent, setConsent } from '../services/consent.service';

export const getMyConsent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json(await getConsent(req.user!.id));
  } catch (err) {
    next(err);
  }
};

export const updateMyConsent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const updated = await setConsent(req.user!.id, req.body, req.ip);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
