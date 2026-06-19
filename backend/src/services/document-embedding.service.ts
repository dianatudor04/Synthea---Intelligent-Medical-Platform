import { randomUUID } from 'crypto';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { chunkText } from './chunking.service';
import { embed, toVectorLiteral } from './embedding.service';

/**
 * Chunk an OcrDocument's extracted text, embed each chunk, and store the
 * vectors in pgvector. Idempotent — re-running replaces the document's chunks.
 * Written via raw SQL because Prisma can't yet bind the vector type.
 *
 * Returns the number of chunks stored.
 */
export async function embedDocument(documentId: string): Promise<number> {
  const doc = await prisma.ocrDocument.findUnique({
    where: { id: documentId },
    select: { id: true, patientId: true, extractedText: true },
  });
  if (!doc) {
    logger.warn(`[embedDocument] document ${documentId} not found`);
    return 0;
  }
  if (!doc.extractedText || !doc.extractedText.trim()) {
    logger.warn(`[embedDocument] document ${documentId} has no extracted text, skipping`);
    return 0;
  }

  const chunks = chunkText(doc.extractedText);
  if (!chunks.length) return 0;

  const vectors = await embed(chunks);

  // Clear existing chunks first so a re-run doesn't duplicate.
  await prisma.$executeRaw`DELETE FROM document_chunks WHERE "documentId" = ${documentId}`;

  for (let i = 0; i < chunks.length; i++) {
    const id = randomUUID();
    const vec = toVectorLiteral(vectors[i]);
    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, "documentId", "patientId", "chunkIndex", content, embedding, "createdAt")
      VALUES (${id}, ${documentId}, ${doc.patientId}, ${i}, ${chunks[i]}, ${vec}::vector, now())
    `;
  }

  logger.info(`[embedDocument] ${documentId}: stored ${chunks.length} chunks`);
  return chunks.length;
}
