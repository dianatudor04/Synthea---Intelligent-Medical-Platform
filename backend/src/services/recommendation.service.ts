import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { hasConsent } from './consent.service';

// Only act on reasonably confident signals.
const SIGNAL_THRESHOLD = 0.6;
// Don't re-surface the same pool item within this window (frequency cap).
const FREQ_CAP_DAYS = 14;
// Cap how many fresh recommendations we generate per run.
const MAX_PER_RUN = 5;

/**
 * Generate pending recommendations for a user from their extracted signals.
 * The rule is deliberately simple and explainable:
 *   signal.tag with confidence ≥ threshold  →  eligible for the pool with that
 *   tag  →  pick active items not delivered/pending within the cap window.
 * Profiling-gated (recommendations derive from profiling-gated signals).
 * Returns the number of recommendations created.
 */
export async function generateForUser(userId: string): Promise<number> {
  if (!(await hasConsent(userId, 'profiling'))) {
    logger.info(`[reco] user ${userId}: no profiling consent — skipping`);
    return 0;
  }

  const signals = await prisma.userSignal.findMany({
    where: { userId, confidence: { gte: SIGNAL_THRESHOLD } },
    orderBy: { confidence: 'desc' },
  });
  if (!signals.length) return 0;

  // Highest-confidence signal per tag (for the "why" basis).
  const signalByTag = new Map<string, (typeof signals)[number]>();
  for (const s of signals) if (!signalByTag.has(s.tag)) signalByTag.set(s.tag, s);

  const pools = await prisma.pool.findMany({
    where: { tag: { in: [...signalByTag.keys()] }, active: true },
    include: { items: { where: { active: true } } },
  });
  if (!pools.length) return 0;

  // Frequency cap: exclude items already pending, or delivered within the window.
  const since = new Date(Date.now() - FREQ_CAP_DAYS * 24 * 60 * 60 * 1000);
  const recent = await prisma.recommendation.findMany({
    where: { userId, OR: [{ status: 'PENDING' }, { deliveredAt: { gte: since } }] },
    select: { poolItemId: true },
  });
  const excluded = new Set(recent.map((r) => r.poolItemId));

  const toCreate: Prisma.RecommendationCreateManyInput[] = [];
  for (const pool of pools) {
    const sig = signalByTag.get(pool.tag);
    for (const item of pool.items) {
      if (excluded.has(item.id)) continue;
      toCreate.push({
        userId,
        poolItemId: item.id,
        signalTag: pool.tag,
        signalBasis: sig?.basis ?? null,
        status: 'PENDING',
      });
    }
  }

  // Prefer higher-confidence tags first (pools came back unordered, so sort).
  toCreate.sort((a, b) => {
    const ca = signalByTag.get(a.signalTag)?.confidence ?? 0;
    const cb = signalByTag.get(b.signalTag)?.confidence ?? 0;
    return cb - ca;
  });
  const capped = toCreate.slice(0, MAX_PER_RUN);
  if (!capped.length) return 0;

  await prisma.recommendation.createMany({ data: capped });
  logger.info(`[reco] user ${userId}: generated ${capped.length} recommendation(s)`);
  return capped.length;
}

export type PendingRecommendation = {
  id: string;
  tag: string;
  basis: string | null;
  title: string;
  advice: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  createdAt: Date;
};

/**
 * Mark a recommendation delivered (default channel BALLOON). Only transitions
 * PENDING → DELIVERED and only for the owning user. Idempotent/no-op otherwise.
 * The single status field is the shared frequency-cap across channels.
 */
export async function markDelivered(
  userId: string,
  id: string,
  channel: 'BALLOON' | 'EMAIL' = 'BALLOON',
): Promise<boolean> {
  const result = await prisma.recommendation.updateMany({
    where: { id, userId, status: 'PENDING' },
    data: { status: 'DELIVERED', channel, deliveredAt: new Date() },
  });
  return result.count > 0;
}

/** Mark a recommendation dismissed (user not interested). */
export async function dismiss(userId: string, id: string): Promise<boolean> {
  const result = await prisma.recommendation.updateMany({
    where: { id, userId, status: 'PENDING' },
    data: { status: 'DISMISSED' },
  });
  return result.count > 0;
}

/** Pending recommendations for a user, ready for a delivery channel to read. */
export async function getPendingForUser(userId: string): Promise<PendingRecommendation[]> {
  const recs = await prisma.recommendation.findMany({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { poolItem: { include: { pool: true } } },
  });
  return recs.map((r) => ({
    id: r.id,
    tag: r.signalTag,
    basis: r.signalBasis,
    title: r.poolItem.pool.title,
    advice: r.poolItem.adviceText,
    ctaLabel: r.poolItem.ctaLabel,
    ctaUrl: r.poolItem.ctaUrl,
    createdAt: r.createdAt,
  }));
}
