// Standalone worker process (separate from the API). Run with `npm run worker`.
// Loads env itself since it does not boot through src/index.ts.
import dotenv from 'dotenv';
dotenv.config();

import { Worker, Job } from 'bullmq';
import { connection, QUEUE_NAME } from '../config/queue';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { JOB, JobName } from '../jobs/types';
import { processPatientUpload } from '../services/ocr-pipeline.service';
import { embedDocument } from '../services/document-embedding.service';
import { extractSignalsForDocument } from '../services/signal.service';
import { generateForUser } from '../services/recommendation.service';
import { runWeeklyDigest, sendDigestEmail } from '../services/digest.service';
import { enqueue, scheduleRepeatable } from '../services/queue.service';
import { hasConsent } from '../services/consent.service';

// Job-name → handler. Stub handlers remain for jobs whose phase isn't built yet
// (extractSignals → generateRecommendations → sendEmail).
const handlers: Record<JobName, (data: unknown) => Promise<void>> = {
  [JOB.extractText]: async (data) => {
    const { documentId } = data as { documentId: string };
    // Run OCR (always — extracted text powers the patient's own chat/viewing).
    await processPatientUpload(documentId);

    // Embedding is special-category processing → gated on the owning patient's
    // profiling consent. Only enqueue when there's text AND consent.
    const doc = await prisma.ocrDocument.findUnique({
      where: { id: documentId },
      select: { extractedText: true, patient: { select: { userId: true } } },
    });
    if (!doc?.extractedText) return;
    const userId = doc.patient?.userId;
    if (userId && (await hasConsent(userId, 'profiling'))) {
      await enqueue('embedDocument', { documentId });
    } else {
      logger.info(`[worker] extractText ${documentId}: no profiling consent — skipping embedding`);
    }
  },
  [JOB.embedDocument]: async (data) => {
    const { documentId } = data as { documentId: string };
    const stored = await embedDocument(documentId);
    // Chain into signal extraction once the doc is embedded.
    if (stored > 0) {
      const doc = await prisma.ocrDocument.findUnique({
        where: { id: documentId },
        select: { patient: { select: { userId: true } } },
      });
      const userId = doc?.patient?.userId;
      if (userId) await enqueue('extractSignals', { userId, documentId });
    }
  },
  [JOB.extractSignals]: async (data) => {
    const { userId, documentId } = data as { userId: string; documentId?: string };
    if (documentId) await extractSignalsForDocument(userId, documentId);
    // Regenerate this user's recommendations from their (now updated) signals.
    await enqueue('generateRecommendations', { userId });
  },
  [JOB.generateRecommendations]: async (data) => {
    const { userId } = data as { userId: string };
    await generateForUser(userId);
  },
  [JOB.sendEmail]: async (data) => {
    const payload = data as {
      to: string;
      subject: string;
      template: string;
      userId: string;
      recIds: string[];
      firstName?: string | null;
    };
    if (payload.template === 'weekly_digest') {
      await sendDigestEmail(payload);
    } else {
      logger.warn(`[worker] sendEmail: unknown template "${payload.template}"`);
    }
  },
  [JOB.weeklyDigest]: async () => {
    await runWeeklyDigest();
  },
};

async function main(): Promise<void> {
  if (!connection) {
    logger.error('[worker] REDIS_URL not set — cannot start worker. Exiting.');
    process.exit(1);
  }

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const handler = handlers[job.name as JobName];
      if (!handler) {
        logger.warn(`[worker] no handler registered for job "${job.name}"`);
        return;
      }
      await handler(job.data);
    },
    { connection, concurrency: 5 },
  );

  worker.on('completed', (job) => logger.info(`[worker] completed "${job.name}" (${job.id})`));
  worker.on('failed', (job, err) =>
    logger.error(`[worker] failed "${job?.name}" (${job?.id}): ${err.message}`),
  );

  logger.info(`[worker] listening for jobs on "${QUEUE_NAME}" (concurrency 5)`);

  // Repeatable cron-like job: weekly digest, Mondays 09:00.
  await scheduleRepeatable('weeklyDigest', {}, '0 9 * * 1');

  const shutdown = async (signal: string) => {
    logger.info(`[worker] ${signal} received, closing`);
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('[worker] fatal startup error', { error: err });
  process.exit(1);
});
