import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { recordEvents } from '../services/event.service';

export const ingestEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { events } = req.body as { events: Parameters<typeof recordEvents>[1] };
    const accepted = await recordEvents(req.user!.id, events);
    // 202: accepted for storage; the client doesn't wait on anything downstream.
    res.status(202).json({ accepted });
  } catch (err) {
    next(err);
  }
};
