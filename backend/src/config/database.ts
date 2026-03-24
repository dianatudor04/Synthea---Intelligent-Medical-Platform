import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple Prisma instances in dev (hot-reload)
export const prisma: PrismaClient =
  global.__prisma ?? new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('warn', (e: unknown) => logger.warn('Prisma Warning:', e));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(prisma as any).$on('error', (e: unknown) => logger.error('Prisma Error:', e));

