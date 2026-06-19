import { Router } from 'express';
import {
  getPending,
  generate,
  ack,
  dismissRecommendation,
  runDigest,
} from '../controllers/recommendation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/pending', getPending);
router.post('/generate', generate);
router.post('/:id/ack', ack);
router.post('/:id/dismiss', dismissRecommendation);

// Admin: trigger the weekly digest fan-out immediately (for demos / testing).
router.post('/digest', authorize('ADMIN'), runDigest);

export default router;
