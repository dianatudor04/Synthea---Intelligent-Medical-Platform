import { Router } from 'express';
import { getMyConsent, updateMyConsent } from '../controllers/consent.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { updateConsentSchema } from '../validators/consent.validator';

const router = Router();

// Consent is always self-scoped — a user reads and edits only their own flags.
router.use(authenticate);

router.get('/', getMyConsent);
router.put('/', validate(updateConsentSchema), updateMyConsent);

export default router;
