import { prisma } from '../config/database';

/**
 * Upload context for the AI chatbot.
 *
 * Used to feed the patient's own uploaded files (lab reports, imaging,
 * prescriptions, ...) into the AI prompt as context when they chat with
 * the assistant.
 *
 * Today this only returns the metadata + any `extractedText` we've already
 * persisted. The text-extraction pipeline (PDF parse, OCR for images,
 * structured-data extraction) is the follow-up that fills `extractedText`.
 */

export type UploadContextItem = {
  id: string;
  fileName: string | null;
  mimeType: string | null;
  category: string | null;
  uploadedAt: Date;
  /** Populated by a future OCR / parsing pipeline. Null until then. */
  extractedText: string | null;
};

/**
 * Return the patient's recent uploads with whatever extracted text we have.
 * The AI controller can join these into the system prompt.
 */
export async function getPatientUploadContext(
  patientProfileId: string,
  opts: { limit?: number; onlyWithText?: boolean } = {}
): Promise<UploadContextItem[]> {
  const limit = opts.limit ?? 20;

  const rows = await prisma.ocrDocument.findMany({
    where: {
      patientId: patientProfileId,
      source: 'PATIENT_UPLOAD',
      ...(opts.onlyWithText ? { extractedText: { not: null } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      category: true,
      createdAt: true,
      extractedText: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    fileName: r.fileName,
    mimeType: r.mimeType,
    category: r.category,
    uploadedAt: r.createdAt,
    extractedText: r.extractedText,
  }));
}
