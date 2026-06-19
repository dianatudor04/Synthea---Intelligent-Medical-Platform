import { JobsOptions } from 'bullmq';
import { getQueue } from '../config/queue';
import { JobName, JobPayloads } from '../jobs/types';
import { logger } from '../config/logger';

/**
 * Enqueue a job. The request path stays "fast and dumb" — controllers call
 * this and return immediately; all derivation happens in the worker.
 * No-op (with a warning) when the queue is disabled, so callers never need to
 * branch on whether Redis is configured.
 */
export async function enqueue<N extends JobName>(
  name: N,
  payload: JobPayloads[N],
  opts?: JobsOptions,
): Promise<void> {
  const queue = getQueue();
  if (!queue) {
    logger.warn(`[Queue] skipped "${name}" — queue disabled (no REDIS_URL)`);
    return;
  }
  const job = await queue.add(name, payload, opts);
  logger.info(`[Queue] enqueued "${name}" (job ${job.id})`);
}

/**
 * Register a repeatable (cron-like) job. Used for periodic work such as
 * re-running signal extraction, batch recommendation generation, and the
 * weekly email digest. Safe no-op when the queue is disabled.
 */
export async function scheduleRepeatable<N extends JobName>(
  name: N,
  payload: JobPayloads[N],
  pattern: string,
): Promise<void> {
  const queue = getQueue();
  if (!queue) {
    logger.warn(`[Queue] skipped repeatable "${name}" — queue disabled (no REDIS_URL)`);
    return;
  }
  await queue.add(name, payload, { repeat: { pattern }, jobId: `repeat:${name}` });
  logger.info(`[Queue] scheduled repeatable "${name}" (${pattern})`);
}
