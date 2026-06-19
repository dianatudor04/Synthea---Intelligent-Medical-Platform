import { Router } from 'express';
import {
  listPools,
  createPool,
  updatePool,
  deletePool,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/pool.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import {
  createPoolSchema,
  updatePoolSchema,
  createItemSchema,
  updateItemSchema,
} from '../validators/pool.validator';

const router = Router();

// Curated pools are editorially controlled → admin only.
router.use(authenticate, authorize('ADMIN'));

router.get('/', listPools);
router.post('/', validate(createPoolSchema), createPool);
router.patch('/:id', validate(updatePoolSchema), updatePool);
router.delete('/:id', deletePool);

router.post('/:id/items', validate(createItemSchema), createItem);
router.patch('/items/:itemId', validate(updateItemSchema), updateItem);
router.delete('/items/:itemId', deleteItem);

export default router;
