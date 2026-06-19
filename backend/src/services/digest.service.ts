import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { enqueue } from './queue.service';
import { renderDigestEmail, unsubscribeUrl, sendMail, DigestItem } from './email.service';

const MAX_ITEMS_PER_EMAIL = 5;

/**
 * Weekly digest fan-out: for every user who opted in to marketing email AND has
 * pending recommendations, enqueue a sendEmail job. Marking-as-delivered happens
 * in the sendEmail handler (after a successful send) so a failed send doesn't
 * consume the recommendation.
 * Returns the number of digest emails enqueued.
 */
export async function runWeeklyDigest(): Promise<number> {
  const consents = await prisma.userConsent.findMany({
    where: { marketingEmail: true },
    select: { userId: true },
  });

  let enqueued = 0;
  for (const c of consents) {
    const pendingCount = await prisma.recommendation.count({
      where: { userId: c.userId, status: 'PENDING' },
    });
    if (pendingCount === 0) continue;

    const user = await prisma.user.findUnique({
      where: { id: c.userId },
      select: { email: true, firstName: true },
    });
    if (!user) continue;

    const recs = await prisma.recommendation.findMany({
      where: { userId: c.userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      take: MAX_ITEMS_PER_EMAIL,
      select: { id: true },
    });

    await enqueue('sendEmail', {
      to: user.email,
      subject: 'Your weekly health tips from Synthea',
      template: 'weekly_digest',
      userId: c.userId,
      recIds: recs.map((r) => r.id),
      firstName: user.firstName,
    });
    enqueued++;
  }

  logger.info(`[digest] enqueued ${enqueued} digest email(s)`);
  return enqueued;
}

/**
 * Render + send one user's digest, then mark the included recommendations
 * DELIVERED via EMAIL. Only operates on recs still PENDING (cross-channel cap:
 * a rec already shown in the balloon won't be re-sent). Called by the sendEmail
 * job handler.
 */
export async function sendDigestEmail(opts: {
  to: string;
  subject: string;
  userId: string;
  recIds: string[];
  firstName?: string | null;
}): Promise<boolean> {
  const recs = await prisma.recommendation.findMany({
    where: { id: { in: opts.recIds }, userId: opts.userId, status: 'PENDING' },
    include: { poolItem: { include: { pool: true } } },
  });
  if (!recs.length) {
    logger.info(`[digest] ${opts.userId}: no still-pending recs, skipping send`);
    return false;
  }

  const items: DigestItem[] = recs.map((r) => ({
    title: r.poolItem.pool.title,
    advice: r.poolItem.adviceText,
    ctaLabel: r.poolItem.ctaLabel,
    ctaUrl: r.poolItem.ctaUrl,
  }));

  const { html, text } = renderDigestEmail(opts.firstName ?? null, items, unsubscribeUrl(opts.userId));
  await sendMail({ to: opts.to, subject: opts.subject, html, text });

  await prisma.recommendation.updateMany({
    where: { id: { in: recs.map((r) => r.id) } },
    data: { status: 'DELIVERED', channel: 'EMAIL', deliveredAt: new Date() },
  });
  return true;
}
