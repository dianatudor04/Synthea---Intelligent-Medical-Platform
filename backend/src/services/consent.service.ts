import { prisma } from '../config/database';
import { logger } from '../config/logger';

// The three GDPR consent flags. Each gates a distinct capability:
//  - analytics:      activity/event ingestion
//  - profiling:      embeddings + signal extraction (special-category health data)
//  - marketingEmail: marketing/digest email (separate opt-in, always revocable)
export const CONSENT_FLAGS = ['analytics', 'profiling', 'marketingEmail'] as const;
export type ConsentFlag = (typeof CONSENT_FLAGS)[number];

export interface ConsentFlags {
  analytics: boolean;
  profiling: boolean;
  marketingEmail: boolean;
  version: number;
}

// Everything is opt-out by default — nothing personalization-related runs
// until the user explicitly grants the relevant flag.
const DEFAULTS: ConsentFlags = {
  analytics: false,
  profiling: false,
  marketingEmail: false,
  version: 1,
};

/** Current consent for a user. Returns all-false defaults if no row exists yet. */
export async function getConsent(userId: string): Promise<ConsentFlags> {
  const row = await prisma.userConsent.findUnique({ where: { userId } });
  if (!row) return { ...DEFAULTS };
  return {
    analytics: row.analytics,
    profiling: row.profiling,
    marketingEmail: row.marketingEmail,
    version: row.version,
  };
}

/**
 * Apply a partial consent update. Upserts the consent row and writes an
 * append-only ConsentAudit entry for every flag whose value actually changed.
 */
export async function setConsent(
  userId: string,
  patch: Partial<Record<ConsentFlag, boolean>>,
  ipAddress?: string,
): Promise<ConsentFlags> {
  const current = await getConsent(userId);

  // Only the flags present in the patch and actually changing get audited.
  const changed = CONSENT_FLAGS.filter(
    (flag) => patch[flag] !== undefined && patch[flag] !== current[flag],
  );

  const next: Record<ConsentFlag, boolean> = {
    analytics: patch.analytics ?? current.analytics,
    profiling: patch.profiling ?? current.profiling,
    marketingEmail: patch.marketingEmail ?? current.marketingEmail,
  };

  const [row] = await prisma.$transaction([
    prisma.userConsent.upsert({
      where: { userId },
      create: { userId, ...next },
      update: { ...next },
    }),
    ...changed.map((flag) =>
      prisma.consentAudit.create({
        data: { userId, flag, value: next[flag], ipAddress: ipAddress ?? null },
      }),
    ),
  ]);

  if (changed.length) {
    logger.info(`[Consent] user ${userId} changed: ${changed.map((f) => `${f}=${next[f]}`).join(', ')}`);
  }

  return {
    analytics: row.analytics,
    profiling: row.profiling,
    marketingEmail: row.marketingEmail,
    version: row.version,
  };
}

/** Convenience predicate used by the requireConsent middleware. */
export async function hasConsent(userId: string, flag: ConsentFlag): Promise<boolean> {
  const consent = await getConsent(userId);
  return consent[flag] === true;
}
