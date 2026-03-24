import { Router } from 'express';
import {
  createReview,
  getDoctorReviews,
  getReviewById,
} from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /api/reviews  — PATIENT only
router.post('/', authorize('PATIENT'), createReview);

// GET /api/reviews/doctor/:doctorId  — any authenticated user
router.get('/doctor/:doctorId', getDoctorReviews);

// GET /api/reviews/:id  — any authenticated user
router.get('/:id', getReviewById);

export default router;
