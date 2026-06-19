import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { IncomingEvent } from '../validators/event.validator';

// A client timestamp is only honored if it lands within a sane window around
// "now" (1 day either side); otherwise we fall back to the server clock. Keeps
// a misconfigured or malicious client from poisoning the time index.
const MAX_SKEW_MS = 24 * 60 * 60 * 1000;

function resolveCreatedAt(ts: number | undefined, now: number): Date | undefined {
  if (!ts) return undefined; // let the DB default (now()) apply
  if (Math.abs(now - ts) > MAX_SKEW_MS) return undefined;
  return new Date(ts);
}

/**
 * Append a batch of activity events for a user. Intentionally minimal — a bulk
 * insert and nothing else. All derivation happens later in workers.
 */
export async function recordEvents(userId: string, events: IncomingEvent[]): Promise<number> {
  if (!events.length) return 0;
  const now = Date.now();

  const data: Prisma.ActivityEventCreateManyInput[] = events.map((e) => ({
    userId,
    type: e.type,
    payload: (e.payload ?? undefined) as Prisma.InputJsonValue | undefined,
    sessionId: e.sessionId ?? null,
    createdAt: resolveCreatedAt(e.ts, now),
  }));

  const result = await prisma.activityEvent.createMany({ data });
  return result.count;
}
