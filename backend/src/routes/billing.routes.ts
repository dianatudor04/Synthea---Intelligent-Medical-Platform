import { Router } from 'express';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  processPayment,
  getPaymentReport,
} from '../controllers/billing.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/billing/invoices
router.get('/invoices', authorize('ADMIN'), getAllInvoices);

// GET /api/billing/report
router.get('/report', authorize('ADMIN'), getPaymentReport);

// POST /api/billing/invoices
router.post('/invoices', authorize('ADMIN'), createInvoice);

// GET /api/billing/invoices/:id
router.get('/invoices/:id', getInvoiceById);

// PUT /api/billing/invoices/:id
router.put('/invoices/:id', authorize('ADMIN'), updateInvoice);

// POST /api/billing/invoices/:id/pay  (Stripe stub)
router.post('/invoices/:id/pay', processPayment);

export default router;
