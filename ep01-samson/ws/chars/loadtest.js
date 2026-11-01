const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, 'index.html')); await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ pp2: typeof PP2, fns: Object.keys(PP2).join(','), samson: typeof PP2.samson }));
  console.log(JSON.stringify(r)); console.log(errs.filter((e) => /people2|PP2/.test(e)).join('\n') || 'no PP2 errors'); console.log('other errors:', errs.length); await b.close(); })();
