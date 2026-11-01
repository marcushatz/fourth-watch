const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, 'chars_test.html'));
  const r = await p.evaluate(() => {
    const draw = (f) => { const c = document.createElement('canvas'); c.width = 1300; c.height = 1640; const x = c.getContext('2d'); x.translate(650, 1580); x.scale(2.5, 2.5); f(x); return x.getImageData(0, 0, 1300, 1640).data; };
    const out = [];
    for (const [a, b2, lab] of [[(x) => PP.samson(x, {}), (x) => PP2.samson(x, { pose: 'stand' }), 'stand'], [(x) => PP.samson(x, { strain: 1, t: 0 }), (x) => PP2.samson(x, { pose: 'strain', t: 0 }), 'strain'], [(x) => PP.samson(x, { strain: 1, burst: 1, brk: 0.5, t: 0 }), (x) => PP2.samson(x, { pose: 'burst', brk: 0.5, t: 0 }), 'burst']]) {
      const A = draw(a), B = draw(b2); let diff = 0, tot = 0;
      for (let i = 3; i < A.length; i += 4) { if (A[i] > 20 || B[i] > 20) { tot++; if (Math.abs(A[i - 3] - B[i - 3]) + Math.abs(A[i - 2] - B[i - 2]) + Math.abs(A[i - 1] - B[i - 1]) + Math.abs(A[i] - B[i]) > 60) diff++; } }
      out.push(lab + ': ' + (100 * diff / tot).toFixed(2) + '% of figure pixels differ');
    }
    return out;
  }); console.log(r.join('\n')); await b.close(); })();
