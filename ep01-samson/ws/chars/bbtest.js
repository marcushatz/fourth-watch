const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => console.log('console', m.text()));
  await p.goto('file://' + path.resolve(__dirname, 'bbtest.html')); console.log((await p.evaluate(() => window.test())).join('\n')); await b.close(); })();
