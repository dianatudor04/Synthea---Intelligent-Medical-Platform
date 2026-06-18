import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();

import { rateLimit } from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { gdprLogger } from './middleware/gdpr.middleware';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { ensureBucket } from './services/storage.service';

// Routes
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import appointmentRoutes from './routes/appointment.routes';
import billingRoutes from './routes/billing.routes';
import aiRoutes from './routes/ai.routes';
import ocrRoutes from './routes/ocr.routes';
import adminRoutes from './routes/admin.routes';
import doctorRoutes from './routes/doctor.routes';
import reviewRoutes from './routes/review.routes';
import serviceRoutes from './routes/service.routes';
import uploadRoutes from './routes/upload.routes';
import interactionRoutes from './routes/interaction.routes';

const app = express();

// ─── Security Middleware ───────────────────────────────
app.use(helmet());

// Allow the configured FRONTEND_URL plus the localhost / 127.0.0.1 equivalents
// (Vite dev server can be reached on either, and browsers treat them as
// distinct origins for CORS purposes).
const allowedOrigins = new Set<string>([env.FRONTEND_URL]);
try {
  const url = new URL(env.FRONTEND_URL);
  if (url.hostname === 'localhost') allowedOrigins.add(`${url.protocol}//127.0.0.1:${url.port}`);
  if (url.hostname === '127.0.0.1') allowedOrigins.add(`${url.protocol}//localhost:${url.port}`);
} catch {
  // env validation already guarantees a valid URL — this catch is just a safeguard
}
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser tools (curl, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── Body Parsing ─────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── GDPR / HIPAA Audit Logging ───────────────────────
// Applied after auth resolves on protected routes (via route-level middleware)
// Also fires here for any authenticated request that reaches sensitive paths
app.use(gdprLogger);

// ─── Health Check ─────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      platform: 'Synthea Medical Platform',
      version: '1.0.0',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'error',
      platform: 'Synthea Medical Platform',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── API Routes ───────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/interactions', interactionRoutes);

// ─── 404 Handler ──────────────────────────────────────
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Centralized Error Handler ────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connected via Prisma');

    try {
      await ensureBucket();
    } catch (err) {
      logger.warn('RustFS bucket bootstrap failed — uploads will not work until storage is reachable', {
        error: err,
      });
    }

    app.listen(env.PORT, () => {
      logger.info(`Synthea Backend running on http://localhost:${env.PORT}`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

export default app;
