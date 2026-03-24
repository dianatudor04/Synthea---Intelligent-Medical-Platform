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

const router = Router();

router.use(authenticate, authorize('ADMIN'));

// GET /api/admin/dashboard
router.get('/dashboard', getDashboardStats);

// GET /api/admin/users
router.get('/users', getAllUsers);

// GET /api/admin/users/:id
router.get('/users/:id', getUserById);

// PUT /api/admin/users/:id
router.put('/users/:id', updateUser);

// DELETE /api/admin/users/:id
router.delete('/users/:id', deactivateUser);

// GET /api/admin/audit-logs
router.get('/audit-logs', getAuditLogs);

export default router;
