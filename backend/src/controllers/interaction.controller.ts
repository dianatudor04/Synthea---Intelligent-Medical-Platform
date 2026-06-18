import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { checkInteractions, searchDrugs } from '../services/interaction.service';

// POST /api/interactions/check
export const checkDrugInteractions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { drugs } = req.body as { drugs: string[] };
    const interactions = await checkInteractions(drugs);
    res.json({ interactions, count: interactions.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/interactions/drugs?search=&limit=
export const searchDrugNames = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const search = String(req.query.search ?? '');
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const drugs = await searchDrugs(search, Number.isNaN(limit) ? 10 : limit);
    res.json({ drugs });
  } catch (err) {
    next(err);
  }
};
