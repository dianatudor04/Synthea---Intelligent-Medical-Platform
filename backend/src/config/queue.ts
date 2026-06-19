import { Queue, ConnectionOptions } from 'bullmq';
import { env } from './env';
import { logger } from './logger';

// All jobs live on one queue and are dispatched by job name in the worker.
export const QUEUE_NAME = 'synthea-jobs';

// Pass plain connection options (parsed from REDIS_URL) rather than an ioredis
// instance — BullMQ bundles its own ioredis, so handing it our top-level
// instance triggers a dual-package type clash. Letting BullMQ build the
// connection from options sidesteps that entirely.
function buildConnection(): ConnectionOptions | null {
  if (!env.REDIS_URL) return null;
  const u = new URL(env.REDIS_URL);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    username: u.username || undefined,
    password: u.password || undefined,
    // Required by BullMQ for blocking commands used by workers.
    maxRetriesPerRequest: null,
  };
}

// When REDIS_URL is unset the whole queue degrades to a no-op (mirrors how the
// OpenRouter/embedding clients degrade gracefully) so the API still runs in a
// bare dev setup without Redis.
export const connection = buildConnection();

if (!connection) {
  logger.warn('[Queue] REDIS_URL not set — job queue disabled (enqueue is a no-op).');
}

let queueSingleton: Queue | null = null;

/** Lazily-created shared producer queue, or null when Redis is not configured. */
export function getQueue(): Queue | null {
  if (!connection) return null;
  if (!queueSingleton) {
    queueSingleton = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return queueSingleton;
}

export const isQueueEnabled = (): boolean => connection !== null;
