// Captures short doctor + admin flows (desktop viewport). PNGs → docs/figures/.
const { chromium } = require('playwright');
const path = require('path');

const APP = 'http://localhost:3000';
const FIG = path.resolve(__dirname, '../../docs/figures');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function login(page, email, password) {
  await page.goto(`${APP}/auth/staff-login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(3000); // token is stored on success; navigation persists in-context
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const shot = async (page, n) => { await page.screenshot({ path: path.join(FIG, n) }); console.log('  ✓', n); };
  const step = async (label, fn) => { try { await fn(); } catch (e) { console.log(`  ! ${label}: ${e.message.split('\n')[0]}`); } };

  // ── Doctor ──
  const docCtx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 });
  const doc = await docCtx.newPage();
  await login(doc, 'doctor@synthea.ro', 'Doctor@1234!');
  await step('doctor-dashboard', async () => {
    await doc.goto(`${APP}/doctor`, { waitUntil: 'networkidle' });
    await sleep(1500);
    await shot(doc, '08-doctor-dashboard.png');
  });
  await step('doctor-patient', async () => {
    await doc.goto(`${APP}/doctor/patients`, { waitUntil: 'networkidle' });
    await doc.locator('a[href^="/doctor/patients/"]').first().waitFor({ timeout: 10000 });
    await sleep(800);
    await doc.locator('a[href^="/doctor/patients/"]').first().click();
    await doc.waitForURL(/\/doctor\/patients\/.+/, { timeout: 10000 });
    await sleep(2000);
    await shot(doc, '09-doctor-patient.png');
    await doc.getByRole('button', { name: /new record|add record|create record/i }).first().click().catch(() => {});
    await sleep(1200);
    await shot(doc, '10-doctor-record.png');
  });
  await docCtx.close();

  // ── Admin ──
  const adCtx = await browser.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 });
  const ad = await adCtx.newPage();
  await login(ad, 'admin@synthea.ro', 'Admin@1234!');
  await step('admin-dashboard', async () => {
    await ad.goto(`${APP}/admin`, { waitUntil: 'networkidle' });
    await sleep(1800);
    await shot(ad, '11-admin-dashboard.png');
  });
  await step('admin-content', async () => {
    await ad.goto(`${APP}/admin/content`, { waitUntil: 'networkidle' });
    await sleep(2000);
    await shot(ad, '12-admin-content.png');
  });
  await adCtx.close();

  await browser.close();
  console.log('done');
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
