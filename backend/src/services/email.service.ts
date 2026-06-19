import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';

// In dev this points at Mailpit (SMTP 1025, web UI :8025). Swap SMTP_* for a
// real transactional provider in production.
const transport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
});

// ─── Unsubscribe tokens ──────────────────────────────────────────────
// Signed link so a user can unsubscribe from marketing email WITHOUT logging
// in (required for compliant marketing email).

export function buildUnsubscribeToken(userId: string): string {
  return jwt.sign({ userId, purpose: 'unsubscribe' }, env.JWT_SECRET, { expiresIn: '365d' });
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId?: string; purpose?: string };
    return decoded.purpose === 'unsubscribe' && decoded.userId ? decoded.userId : null;
  } catch {
    return null;
  }
}

export function unsubscribeUrl(userId: string): string {
  return `${env.API_PUBLIC_URL}/api/email/unsubscribe?token=${buildUnsubscribeToken(userId)}`;
}

// ─── Rendering ───────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// CTA URLs are stored relative (e.g. /patient/blog) — make them absolute to the
// frontend for email.
function absUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${env.APP_PUBLIC_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export type DigestItem = {
  title: string;
  advice: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export function renderDigestEmail(
  firstName: string | null,
  items: DigestItem[],
  unsubUrl: string,
): { html: string; text: string } {
  const cards = items
    .map(
      (it) => `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:12px 0;">
        <h3 style="margin:0 0 8px;color:#111827;font-size:16px;">${esc(it.title)}</h3>
        <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.5;">${esc(it.advice)}</p>
        ${
          it.ctaUrl
            ? `<a href="${esc(absUrl(it.ctaUrl))}" style="display:inline-block;background:#3A7BD5;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:13px;">${esc(it.ctaLabel || 'Learn more')}</a>`
            : ''
        }
      </div>`,
    )
    .join('');

  const html = `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#111827;">Hello${firstName ? ' ' + esc(firstName) : ''},</h2>
      <p style="color:#374151;font-size:14px;">Here are some health tips picked for you based on your records:</p>
      ${cards}
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;line-height:1.5;">
        You're receiving this because you opted in to marketing emails from Synthea.
        <br/><a href="${esc(unsubUrl)}" style="color:#6b7280;">Unsubscribe</a>
      </p>
    </div></body></html>`;

  const text = [
    `Hello${firstName ? ' ' + firstName : ''},`,
    '',
    'Here are some health tips picked for you based on your records:',
    '',
    ...items.map((it) => `• ${it.title}\n  ${it.advice}${it.ctaUrl ? `\n  ${it.ctaLabel || 'Learn more'}: ${absUrl(it.ctaUrl)}` : ''}`),
    '',
    `Unsubscribe: ${unsubUrl}`,
  ].join('\n');

  return { html, text };
}

// ─── Sending ─────────────────────────────────────────────────────────

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  logger.info(`[email] sent "${opts.subject}" to ${opts.to} (${info.messageId})`);
}
