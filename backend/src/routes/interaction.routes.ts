import { Router } from 'express';
import { checkDrugInteractions, searchDrugNames } from '../controllers/interaction.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { checkInteractionsSchema } from '../validators/interaction.validator';

const router = Router();

router.use(authenticate);

router.get('/drugs', searchDrugNames);
router.post(
  '/check',
  authorize('DOCTOR', 'ADMIN', 'NURSE'),
  validate(checkInteractionsSchema),
  checkDrugInteractions,
);

export default router;
