import { Request, Response, NextFunction } from 'express';
import { verifyUnsubscribeToken } from '../services/email.service';
import { setConsent } from '../services/consent.service';

function page(title: string, message: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family:Arial,sans-serif;background:#f3f4f6;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;">
    <div style="background:#fff;border-radius:16px;padding:32px 40px;max-width:440px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.06);">
      <h2 style="color:#111827;margin:0 0 8px;">${title}</h2>
      <p style="color:#374151;">${message}</p>
    </div></body></html>`;
}

// GET /api/email/unsubscribe?token=...  (no auth — link from an email)
export const unsubscribe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = String(req.query.token ?? '');
    const userId = verifyUnsubscribeToken(token);
    if (!userId) {
      res.status(400).send(page('Invalid link', 'This unsubscribe link is invalid or has expired.'));
      return;
    }
    await setConsent(userId, { marketingEmail: false }, req.ip);
    res
      .status(200)
      .send(page('Unsubscribed', 'You have been unsubscribed from Synthea marketing emails. You can re-enable them anytime in your settings.'));
  } catch (err) {
    next(err);
  }
};
