const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 20000 });
  await p.screenshot({ path: '../../docs/figures/_viability.png' });
  await b.close();
  console.log('VIABILITY OK');
})().catch(e => { console.error('VIABILITY FAIL:', e.message); process.exit(1); });
