import { prisma } from '../config/database';
import { embed, toVectorLiteral, embeddingsEnabled } from './embedding.service';

export type RetrievedChunk = {
  content: string;
  documentId: string;
  similarity: number;
};

/**
 * Patient-scoped semantic retrieval: embed the query and return the top-k most
 * similar chunks (cosine distance via the pgvector HNSW index). This is the
 * shared retrieval layer for the chatbot and (later) signal extraction.
 */
export async function retrieveRelevantChunks(
  patientId: string,
  query: string,
  k = 5,
): Promise<RetrievedChunk[]> {
  if (!embeddingsEnabled() || !query.trim()) return [];

  const [queryVec] = await embed([query]);
  const vec = toVectorLiteral(queryVec);

  // `<=>` is cosine distance; similarity = 1 - distance. Ordering by distance
  // lets Postgres use the HNSW index.
  const rows = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT content, "documentId", 1 - (embedding <=> ${vec}::vector) AS similarity
    FROM document_chunks
    WHERE "patientId" = ${patientId} AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vec}::vector
    LIMIT ${k}
  `;
  return rows;
}
