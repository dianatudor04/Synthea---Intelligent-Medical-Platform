import { Router } from 'express';
import {
  listUploads,
  createUpload,
  getDownloadUrl,
  deleteUpload,
} from '../controllers/upload.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('PATIENT'));

router.get('/', listUploads);
router.post('/', createUpload);
router.get('/:id/download', getDownloadUrl);
router.delete('/:id', deleteUpload);

export default router;
