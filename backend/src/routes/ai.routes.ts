import { Router } from 'express';
import {
  chatWithBot,
  getChatHistory,
  triageSymptoms,
  getDecisionSupport,
} from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { chatSchema, triageSchema, decisionSupportSchema } from '../validators/ai.validator';

const router = Router();

router.use(authenticate);

router.post('/chat', validate(chatSchema), chatWithBot);
router.get('/chat/history', getChatHistory);
router.post('/triage', validate(triageSchema), triageSymptoms);
router.post('/decision-support', authorize('DOCTOR', 'ADMIN'), validate(decisionSupportSchema), getDecisionSupport);

export default router;
