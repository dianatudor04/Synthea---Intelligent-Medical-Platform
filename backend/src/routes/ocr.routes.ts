import { Router } from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocumentById,
  getPatientDocuments,
  reprocessDocument,
} from '../controllers/ocr.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'DOCTOR'));

// POST /api/ocr/upload  — Upload document for OCR processing
router.post('/upload', upload.single('document'), uploadDocument);

// GET /api/ocr/patient/:patientId  — Get all documents for a patient
router.get('/patient/:patientId', getPatientDocuments);

// GET /api/ocr/:id  — Get single document with extracted data
router.get('/:id', getDocumentById);

// POST /api/ocr/:id/reprocess  — Reprocess document with OCR/NLP
router.post('/:id/reprocess', reprocessDocument);

export default router;
