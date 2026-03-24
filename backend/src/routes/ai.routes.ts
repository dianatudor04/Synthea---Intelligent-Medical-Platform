import { Router } from 'express';
import {
  chatWithBot,
  getChatHistory,
  triageSymptoms,
  getDecisionSupport,
} from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// POST /api/ai/chat  — Conversational chatbot (LLM)
router.post('/chat', chatWithBot);

// GET /api/ai/chat/history   — Chat session history
router.get('/chat/history', getChatHistory);

// POST /api/ai/triage  — Symptom triage classification
router.post('/triage', triageSymptoms);

// POST /api/ai/decision-support  — Clinical decision support for doctors
router.post('/decision-support', authorize('DOCTOR', 'ADMIN'), getDecisionSupport);

export default router;
