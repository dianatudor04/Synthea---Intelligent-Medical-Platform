import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { ocrService } from '../services/ocr.service';

// POST /api/ocr/upload
export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.body;
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    if (!patientId) throw new ApiError(400, 'patientId is required');

    // Create DB record — fileUrl stores the path/URL of the uploaded file
    const doc = await prisma.ocrDocument.create({
      data: {
        patientId,
        fileUrl: req.file.path,
        processed: false,
      },
    });

    // Process asynchronously (OCR stub)
    ocrService.processDocument(doc.id, doc.fileUrl).catch(() => {
      // Non-fatal — document will remain in pending state
    });

    res.status(202).json({ id: doc.id, status: 'processing', message: 'Document uploaded and queued for OCR processing' });
  } catch (err) {
    next(err);
  }
};

// GET /api/ocr/patient/:patientId
export const getPatientDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const documents = await prisma.ocrDocument.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (err) {
    next(err);
  }
};

// GET /api/ocr/:id
export const getDocumentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.ocrDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new ApiError(404, 'Document not found');
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

// POST /api/ocr/:id/reprocess
export const reprocessDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.ocrDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) throw new ApiError(404, 'Document not found');

    await prisma.ocrDocument.update({ where: { id: doc.id }, data: { processed: false, processedAt: null } });
    ocrService.processDocument(doc.id, doc.fileUrl).catch(() => {});

    res.json({ message: 'Document queued for reprocessing' });
  } catch (err) {
    next(err);
  }
};
