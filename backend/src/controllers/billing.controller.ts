import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { billingService } from '../services/billing.service';

// GET /api/billing/invoices
export const getAllInvoices = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ data: invoices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/billing/invoices/:id
export const getInvoiceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
    });
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

// POST /api/billing/invoices
export const createInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { patientId, amount, currency, lineItems, dueDate, notes } = req.body;
    if (!lineItems) throw new ApiError(400, 'lineItems is required');
    const invoice = await prisma.invoice.create({
      data: { patientId, amount, currency, lineItems, dueDate: dueDate ? new Date(dueDate) : undefined, notes },
    });
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
};

// PUT /api/billing/invoices/:id
export const updateInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(invoice);
  } catch (err) {
    next(err);
  }
};

// POST /api/billing/invoices/:id/pay  (Stripe stub)
export const processPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { paymentMethod } = req.body;
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'PAID') throw new ApiError(400, 'Invoice already paid');

    const result = await billingService.processPayment(invoice.id, invoice.amount, paymentMethod);

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID', paidAt: new Date(), stripePaymentId: result.paymentIntentId },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// GET /api/billing/report
export const getPaymentReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    const report = await billingService.generateReport(startDate, endDate);
    res.json(report);
  } catch (err) {
    next(err);
  }
};
