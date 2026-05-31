import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getAuditLogs,
  getDashboardStats,
} from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../validators/validate';
import { updateUserSchema } from '../validators/admin.validator';

const router = Router();

router.use(authenticate);

// Dashboard stats are useful for both ADMIN and DOCTOR (read-only)
router.get('/dashboard', authorize('ADMIN', 'DOCTOR'), getDashboardStats);

// User management — ADMIN only
router.get('/users', authorize('ADMIN'), getAllUsers);
router.get('/users/:id', authorize('ADMIN'), getUserById);
router.put('/users/:id', authorize('ADMIN'), validate(updateUserSchema), updateUser);
router.delete('/users/:id', authorize('ADMIN'), deactivateUser);

// Audit log — ADMIN only
router.get('/audit-logs', authorize('ADMIN'), getAuditLogs);

export default router;
