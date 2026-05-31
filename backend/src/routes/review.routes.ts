import { Router } from 'express';
import {
  createReview,
  getDoctorReviews,
  getReviewById,
} from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { createReviewSchema } from '../validators/review.validator';

const router = Router();

router.use(authenticate);

router.post('/', authorize('PATIENT'), validate(createReviewSchema), createReview);
router.get('/doctor/:doctorId', getDoctorReviews);
router.get('/:id', getReviewById);

export default router;
