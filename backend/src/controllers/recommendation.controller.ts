import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getPendingForUser,
  generateForUser,
  markDelivered,
  dismiss,
} from '../services/recommendation.service';
import { enqueue } from '../services/queue.service';

// GET /api/recommendations/pending — undelivered recommendations for the caller.
export const getPending = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ data: await getPendingForUser(req.user!.id) });
  } catch (err) {
    next(err);
  }
};

// POST /api/recommendations/generate — regenerate the caller's recommendations
// on demand (normally driven by the async pipeline).
export const generate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const generated = await generateForUser(req.user!.id);
    res.json({ generated });
  } catch (err) {
    next(err);
  }
};

// POST /api/recommendations/:id/ack — mark a recommendation delivered (the
// balloon calls this when it shows the curated text). Default channel BALLOON.
export const ack = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const channel = req.body?.channel === 'EMAIL' ? 'EMAIL' : 'BALLOON';
    const ok = await markDelivered(req.user!.id, req.params.id, channel);
    res.json({ acknowledged: ok });
  } catch (err) {
    next(err);
  }
};

// POST /api/recommendations/:id/dismiss — user not interested.
export const dismissRecommendation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const ok = await dismiss(req.user!.id, req.params.id);
    res.json({ dismissed: ok });
  } catch (err) {
    next(err);
  }
};

// POST /api/recommendations/digest (ADMIN) — trigger the weekly digest now.
export const runDigest = async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await enqueue('weeklyDigest', {});
    res.status(202).json({ queued: true });
  } catch (err) {
    next(err);
  }
};
