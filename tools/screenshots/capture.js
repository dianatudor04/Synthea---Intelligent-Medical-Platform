// Captures the patient end-to-end flow as PNGs in docs/figures/.
// Mobile viewport (the patient UI is mobile-first; the bottom nav gives reliable
// in-app SPA navigation). Usage: node capture.js  (app must run on :3000/:5000)
const { chromium } = require('playwright');
const path = require('path');

const APP = 'http://localhost:3000';
const FIG = path.resolve(__dirname, '../../docs/figures');
const PDF = path.resolve(__dirname, '../../demo/scrisoare-medicala-cristina.pdf');
const USER = { email: 'demo.maria.popescu@synthea.ro', password: 'Patient@1234!' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const shot = async (n) => { await page.screenshot({ path: path.join(FIG, n) }); console.log('  ✓', n); };
  const step = async (label, fn) => { try { await fn(); } catch (e) { console.log(`  ! ${label}: ${e.message.split('\n')[0]}`); } };
  const balloonToggle = () => page.locator('button.fixed.bottom-6.right-6');
  const openBalloon = async (text) => {
    if (!(await page.getByText(text).first().isVisible().catch(() => false))) {
      await balloonToggle().click().catch(() => {});
      await sleep(800);
    }
  };

  // 1) Login
  await page.goto(`${APP}/patient/auth/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="email"]').fill(USER.email);
  await page.locator('input[type="password"]').fill(USER.password);
  await shot('01-login.png');

  // → dashboard
  await page.getByRole('button', { name: /login|sign in/i }).click();
  await page.waitForURL(/\/patient\/?$/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await sleep(2500);

  // 6) Gap-fill discounted offer (auto-opens on first navigation; priority)
  await step('gap-offer', async () => {
    await openBalloon(/Off-peak opening/i);
    await page.getByText(/Off-peak opening/i).waitFor({ timeout: 8000 });
    await shot('06-gap-offer.png');
  });

  // 4) Chatbot Q&A (Romanian) in the open balloon
  await step('chatbot', async () => {
    await page.getByPlaceholder(/type your message/i).fill('Ce alimente sunt bune pentru inimă?');
    await page.getByPlaceholder(/type your message/i).press('Enter');
    await sleep(6500);
    await shot('04-chatbot.png');
  });

  // 2) Clean dashboard (close balloon)
  await step('dashboard', async () => {
    if (await page.getByText('Health Assistant').isVisible().catch(() => false)) {
      await balloonToggle().click();
      await sleep(600);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot('02-dashboard.png');
  });

  // 5) Curated recommendation — SPA-navigate via the bottom nav so the gap offer
  // is deduped and the recommendation surfaces instead. Done while no modal is
  // open so the nav links are clickable.
  await step('recommendation', async () => {
    await page.getByRole('link', { name: /wellness/i }).click();
    await page.waitForURL(/\/patient\/blog/, { timeout: 10000 });
    await sleep(3000);
    await openBalloon(/A tip based on your records/i);
    const recCard = page.getByText(/A tip based on your records/i);
    await recCard.waitFor({ timeout: 10000 });
    await recCard.scrollIntoViewIfNeeded(); // newest card is below the fold
    await sleep(400);
    await shot('05-recommendation.png');
    // back to the dashboard (SPA); wait for the balloon to finish auto-opening,
    // then close it (no further navigation, so it stays closed).
    await page.getByRole('link', { name: /^home$/i }).click().catch(() => {});
    await page.waitForURL(/\/patient\/?$/, { timeout: 10000 }).catch(() => {});
    await sleep(3500);
    if (await page.getByText('Health Assistant').isVisible().catch(() => false)) {
      await balloonToggle().click();
      await sleep(600);
    }
  });

  // From here on we don't need the assistant balloon; hide it so it doesn't
  // overlap the upload/booking screenshots (it re-opens on every navigation).
  await page.addStyleTag({
    content: '.fixed.bottom-6.right-6,.fixed.bottom-24.right-6{display:none!important}',
  }).catch(() => {});

  // 3) Upload a document (OCR pipeline)
  await step('upload', async () => {
    await page.locator('input[type="file"]').first().setInputFiles(PDF);
    await sleep(2500);
    await page.getByText(/Personal Uploads|Medical Files|My (Files|Documents)/i).first()
      .scrollIntoViewIfNeeded().catch(() => {});
    await sleep(400);
    await shot('03-upload.png');
  });

  // 7) Booking modal (LAST — modal overlay would block later clicks)
  await step('booking', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('button', { name: /book an appointment/i }).first().click();
    await sleep(1500);
    await shot('07-booking.png');
  });

  await browser.close();
  console.log('done');
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
