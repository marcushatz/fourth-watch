// node sheet.js <spec.json> <out.png>   (spec: {cols, cw, ch, cells:[...]}); optional crop "x,y,w,h" and zoom
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [specFile, out, crop, zoom] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'chars_test.html'));
  const t0 = Date.now();
  const r = await page.evaluate((s) => window.renderSheet(s), spec);
  console.log('render ms', Date.now() - t0, r.w + 'x' + r.h, r.errs.length ? r.errs : '');
  await page.setViewportSize({ width: r.w, height: r.h });
  let png = await page.locator('canvas').screenshot();
  fs.writeFileSync(out, png);
  await browser.close();
})();
