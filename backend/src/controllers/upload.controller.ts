import { Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import Busboy from 'busboy';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  uploadStream,
  presignDownload,
  deleteObject,
} from '../services/storage.service';
import { processPatientUpload } from '../services/ocr-pipeline.service';
import { enqueue } from '../services/queue.service';
import { isQueueEnabled } from '../config/queue';
import { ALLOWED_CATEGORIES } from '../validators/upload.validator';

const MAX_BYTES = env.MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Resolve the PatientProfile of the calling user.
 */
async function resolveSelfPatientProfile(req: AuthRequest) {
  if (!req.user) throw new ApiError(401, 'Unauthorized');
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!profile) throw new ApiError(404, 'Patient profile not found for current user');
  return profile;
}

/**
 * GET /api/uploads
 * List the current patient's uploads (Personal Uploads section).
 */
export const listUploads = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await resolveSelfPatientProfile(req);
    const rows = await prisma.ocrDocument.findMany({
      where: { patientId: profile.id, source: 'PATIENT_UPLOAD' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        category: true,
        createdAt: true,
        extractedText: true,
      },
    });
    res.json({
      data: rows.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        mimeType: r.mimeType,
        sizeBytes: r.sizeBytes !== null ? Number(r.sizeBytes) : null,
        category: r.category,
        uploadedAt: r.createdAt,
        hasExtractedText: Boolean(r.extractedText),
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/uploads
 * Multipart stream upload. One file per request; optional `category` field.
 * Streams straight to RustFS via multipart S3 upload — no buffering on disk.
 */
export const createUpload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await resolveSelfPatientProfile(req);

    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      throw new ApiError(400, 'Content-Type must be multipart/form-data');
    }

    // Disable the request timeout — 1GB uploads can take a while on slow links.
    req.setTimeout(0);

    const bb = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_BYTES },
    });

    const fields: Record<string, string> = {};
    let fileHandled = false;
    let aborted = false;

    const finish = (statusCode: number, payload: unknown) => {
      if (res.headersSent) return;
      res.status(statusCode).json(payload);
    };

    const fail = (statusCode: number, message: string) => {
      aborted = true;
      req.unpipe(bb);
      finish(statusCode, { error: message });
    };

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('file', (fieldname, fileStream, info) => {
      if (fileHandled) {
        // Drain extra files; only one allowed.
        fileStream.resume();
        return;
      }
      fileHandled = true;

      const { filename, mimeType } = info;
      const safeMime = mimeType || 'application/octet-stream';
      const key = `patients/${profile.id}/${Date.now()}-${randomUUID()}`;

      let byteCount = 0;
      let limitHit = false;

      fileStream.on('data', (chunk: Buffer) => {
        byteCount += chunk.length;
      });
      fileStream.on('limit', () => {
        limitHit = true;
        fail(413, `File exceeds maximum size of ${env.MAX_FILE_SIZE_MB} MB`);
      });

      uploadStream({ key, body: fileStream, mimeType: safeMime })
        .then(async () => {
          if (aborted || limitHit) return;
          try {
            const categoryRaw = fields.category?.trim();
            const category =
              categoryRaw && (ALLOWED_CATEGORIES as readonly string[]).includes(categoryRaw)
                ? categoryRaw
                : null;

            const row = await prisma.ocrDocument.create({
              data: {
                patientId: profile.id,
                fileName: filename,
                storageKey: key,
                mimeType: safeMime,
                sizeBytes: BigInt(byteCount),
                category,
                source: 'PATIENT_UPLOAD',
                processed: false,
              },
              select: {
                id: true,
                fileName: true,
                mimeType: true,
                sizeBytes: true,
                category: true,
                createdAt: true,
              },
            });

            finish(201, {
              id: row.id,
              fileName: row.fileName,
              mimeType: row.mimeType,
              sizeBytes: row.sizeBytes !== null ? Number(row.sizeBytes) : null,
              category: row.category,
              uploadedAt: row.createdAt,
              hasExtractedText: false,
            });

            // Hand off processing to the async worker: extractText runs OCR,
            // then (if the patient has profiling consent) enqueues embedDocument.
            // Falls back to inline OCR when no queue (Redis) is configured.
            if (isQueueEnabled()) {
              enqueue('extractText', { documentId: row.id }).catch((err) => {
                logger.warn(`Failed to enqueue extractText for ${row.id}`, { error: err });
              });
            } else {
              processPatientUpload(row.id).catch((err) => {
                logger.warn(`OCR pipeline rejected for ${row.id}`, { error: err });
              });
            }
          } catch (dbErr) {
            // DB write failed — try to clean up the orphaned object.
            await deleteObject(key);
            logger.error('DB write failed after upload, cleaned up object', { error: dbErr, key });
            fail(500, 'Failed to persist upload metadata');
          }
        })
        .catch((err) => {
          if (limitHit) return; // already responded
          logger.error('RustFS upload failed', { error: err, key });
          fail(500, 'Failed to store upload');
        });
    });

    bb.on('error', (err) => {
      logger.error('Multipart parse error', { error: err });
      fail(400, 'Malformed multipart payload');
    });

    bb.on('finish', () => {
      if (!fileHandled && !res.headersSent) {
        finish(400, { error: 'No file provided' });
      }
    });

    req.pipe(bb);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/uploads/:id/download
 * Returns a short-lived presigned URL for the browser to fetch.
 * Query: ?inline=1 → Content-Disposition: inline (for in-browser preview).
 */
export const getDownloadUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await resolveSelfPatientProfile(req);
    const row = await prisma.ocrDocument.findUnique({
      where: { id: req.params.id },
      select: { id: true, patientId: true, storageKey: true, fileName: true, mimeType: true },
    });
    if (!row || row.patientId !== profile.id) throw new ApiError(404, 'Upload not found');
    if (!row.storageKey) throw new ApiError(409, 'Upload has no storage object');

    const inline = req.query.inline === '1' || req.query.inline === 'true';
    const url = await presignDownload({
      key: row.storageKey,
      fileName: row.fileName,
      inline,
    });
    res.json({ url, expiresIn: env.PRESIGNED_URL_TTL_SECONDS });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/uploads/:id
 */
export const deleteUpload = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await resolveSelfPatientProfile(req);
    const row = await prisma.ocrDocument.findUnique({
      where: { id: req.params.id },
      select: { id: true, patientId: true, storageKey: true },
    });
    if (!row || row.patientId !== profile.id) throw new ApiError(404, 'Upload not found');

    if (row.storageKey) await deleteObject(row.storageKey);
    await prisma.ocrDocument.delete({ where: { id: row.id } });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
