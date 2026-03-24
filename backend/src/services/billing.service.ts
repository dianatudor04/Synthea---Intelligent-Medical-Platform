import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ─────────────────────────────────────────────────────────
//  Billing Service — Stripe Integration Stubs
//  TODO: npm install stripe
//  Set STRIPE_SECRET_KEY in .env
// ─────────────────────────────────────────────────────────

type PaymentResult = {
  paymentIntentId: string;
  status: string;
};

class BillingService {
  /**
   * Process a payment via Stripe
   * TODO: Replace stub with real Stripe PaymentIntent creation
   */
  async processPayment(invoiceId: string, amount: number, paymentMethod: string): Promise<PaymentResult> {
    logger.info(`[Billing] Processing payment for invoice ${invoiceId}, amount: ${amount} RON`);

    // TODO: Real Stripe integration
    // import Stripe from 'stripe';
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
    //
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Stripe uses cents
    //   currency: 'ron',
    //   payment_method: paymentMethod,
    //   confirm: true,
    //   automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    //   metadata: { invoiceId },
    // });
    //
    // return { paymentIntentId: paymentIntent.id, status: paymentIntent.status };

    // STUB
    const stubPaymentId = `pi_stub_${Date.now()}`;
    logger.info(`[Billing STUB] Payment processed: ${stubPaymentId}`);
    return { paymentIntentId: stubPaymentId, status: 'succeeded' };
  }

  /**
   * Generate financial report for a date range
   */
  async generateReport(startDate?: string, endDate?: string): Promise<Record<string, unknown>> {
    const where: Record<string, unknown> = { status: 'PAID' };

    if (startDate || endDate) {
      where.paidAt = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      };
    }

    const [paidInvoices, pendingCount, totalRevenue] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.count({ where: { status: 'ISSUED' } }),
      prisma.invoice.aggregate({ _sum: { amount: true }, where }),
    ]);

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue: totalRevenue._sum.amount || 0,
        paidInvoices,
        pendingInvoices: pendingCount,
        currency: 'RON',
      },
    };
  }
}

export const billingService = new BillingService();
