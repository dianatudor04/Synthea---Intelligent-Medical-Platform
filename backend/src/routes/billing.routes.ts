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
import { validate } from '../validators/validate';
import { createInvoiceSchema, updateInvoiceSchema, processPaymentSchema } from '../validators/billing.validator';

const router = Router();

router.use(authenticate);

// Read-only access for ADMIN and DOCTOR; mutations stay ADMIN-only.
router.get('/invoices', authorize('ADMIN', 'DOCTOR'), getAllInvoices);
router.get('/report', authorize('ADMIN', 'DOCTOR'), getPaymentReport);
router.post('/invoices', authorize('ADMIN'), validate(createInvoiceSchema), createInvoice);
router.get('/invoices/:id', getInvoiceById);
router.put('/invoices/:id', authorize('ADMIN'), validate(updateInvoiceSchema), updateInvoice);
router.post('/invoices/:id/pay', validate(processPaymentSchema), processPayment);

export default router;
