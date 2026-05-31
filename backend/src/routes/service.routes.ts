import { Router } from 'express';
import { listServices, listSpecialties, getService } from '../controllers/service.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', listServices);
router.get('/specialties', listSpecialties);
router.get('/:id', getService);

export default router;
