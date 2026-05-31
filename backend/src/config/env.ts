import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(1024),
  OCR_PROVIDER: z.enum(['tesseract', 'gcp', 'azure']).default('tesseract'),
  LOG_LEVEL: z.string().default('info'),
  REDIS_URL: z.string().optional(),

  // ─── RustFS (S3-compatible object storage) ──────────────
  RUSTFS_ENDPOINT: z.string().default('http://localhost:9000'),
  RUSTFS_PUBLIC_ENDPOINT: z.string().optional(),               // host-reachable endpoint for presigned URLs
  RUSTFS_ACCESS_KEY: z.string().default('synthea_rustfs_access'),
  RUSTFS_SECRET_KEY: z.string().default('synthea_rustfs_secret'),
  RUSTFS_BUCKET: z.string().default('synthea-patient-uploads'),
  RUSTFS_REGION: z.string().default('us-east-1'),
  PRESIGNED_URL_TTL_SECONDS: z.coerce.number().default(300),

  // ─── OpenRouter (LLM provider for the patient chatbot) ──
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('google/gemini-2.0-flash-001'),
  OPENROUTER_REFERER: z.string().default('http://localhost:3000'),
  OPENROUTER_TITLE: z.string().default('Synthea Medical Platform'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
