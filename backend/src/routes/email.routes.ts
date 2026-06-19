import { Router } from 'express';
import { unsubscribe } from '../controllers/email.controller';

const router = Router();

// Public on purpose — the unsubscribe link in an email must work without login.
// Security comes from the signed token, not a session.
router.get('/unsubscribe', unsubscribe);

export default router;
