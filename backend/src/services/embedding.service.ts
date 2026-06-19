import OpenAI from 'openai';
import { env } from '../config/env';
import { logger } from '../config/logger';

// text-embedding-3-small is 1536-dim and multilingual (handles Romanian).
// Keep this in sync with the vector(1536) column in the schema.
export const EMBEDDING_DIM = 1536;

// Max inputs per API call. text-embedding-3 accepts large batches; we cap
// conservatively to keep individual requests small and retryable.
const MAX_BATCH = 96;

// Embeddings run through OpenRouter (same key as the chatbot), which exposes
// an OpenAI-compatible /embeddings endpoint. Treat empty / placeholder keys as
// "not configured" → stub zero-vectors so the pipeline still runs in dev.
const rawKey = env.OPENROUTER_API_KEY;
const hasRealKey = !!rawKey && !rawKey.startsWith('sk-your');
const client = hasRealKey
  ? new OpenAI({
      apiKey: rawKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: { 'HTTP-Referer': env.OPENROUTER_REFERER, 'X-Title': env.OPENROUTER_TITLE },
    })
  : null;

if (!client) {
  logger.warn('[embed] No real OPENROUTER_API_KEY — embeddings disabled (stub zero-vectors).');
}

export function embeddingsEnabled(): boolean {
  return client !== null;
}

/**
 * Embed a list of texts into 1536-dim vectors. Batches large inputs.
 * Falls back to zero-vectors (with a warning) when no API key is configured,
 * so the pipeline still runs end-to-end in a bare dev setup — retrieval just
 * won't be meaningful until a real key is provided.
 */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (!client) {
    return texts.map(() => new Array(EMBEDDING_DIM).fill(0));
  }

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    const res = await client.embeddings.create({ model: env.EMBEDDING_MODEL, input: batch });
    // The API preserves input order.
    for (const item of res.data) out.push(item.embedding as number[]);
  }
  return out;
}

/** Format a vector for a pgvector literal: [0.1,0.2,...]. */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}
