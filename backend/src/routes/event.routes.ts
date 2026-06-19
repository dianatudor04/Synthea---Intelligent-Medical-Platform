import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireConsent } from '../middleware/consent.middleware';
import { validate } from '../validators/validate';
import { eventBatchSchema } from '../validators/event.validator';
import { ingestEvents } from '../controllers/event.controller';

const router = Router();

// Event flushes are frequent, so this route gets its own generous bucket and is
// skipped by the global API limiter (see index.ts) — so beacons never lock a
// user out of the rest of the API.
const eventLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// navigator.sendBeacon delivers a text/plain blob (it deliberately avoids the
// CORS preflight it cannot satisfy). The global express.json() only parses
// application/json (the keepalive-fetch path), so capture the raw text here.
const textParser = express.text({ type: 'text/plain', limit: '64kb' });

function parseBeaconBody(req: Request, _res: Response, next: NextFunction): void {
  if (typeof req.body === 'string' && req.body.length) {
    try {
      req.body = JSON.parse(req.body);
    } catch {
      req.body = {};
    }
  }
  next();
}

// Authenticate from the Authorization header (fetch path) or a `token` field in
// the body (beacon path — sendBeacon cannot set headers). Mirrors the standard
// authenticate middleware otherwise.
async function authenticateEventIngest(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const bodyToken =
      typeof (req.body as { token?: unknown })?.token === 'string'
        ? (req.body as { token: string }).token
        : undefined;
    const token = headerToken ?? bodyToken;
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

router.post(
  '/',
  eventLimiter,
  textParser,
  parseBeaconBody,
  authenticateEventIngest,
  requireConsent('analytics'),
  validate(eventBatchSchema),
  ingestEvents,
);

export default router;
