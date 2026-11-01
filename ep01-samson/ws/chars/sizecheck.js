// draw every drawer/pose into its PP2.SIZES canvas and report clipping (opaque pixels on the canvas border) + timing
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  page.on('pageerror', (e) => console.log('PAGEERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'chars_test.html'));
  const res = await page.evaluate(() => {
    const cases = [];
    const SP = ['stand', 'walk', 'carry', 'point', 'lean', 'wake', 'strain', 'burst', 'grind', 'lookup', 'pray', 'push'];
    for (const p of SP) cases.push(['samson', { pose: p, phase: 1.2 }]);
    cases.push(['samson', { pose: 'strain', bonds: 'loom' }], ['samson', { pose: 'burst', bonds: 'rope', brk: 0.5 }], ['samson', { pose: 'burst', bonds: 'loom', brk: 0.4 }], ['samson', { pose: 'burst', bonds: 'bowstring', brk: 0.6 }]);
    cases.push(['samsonSleep', { pose: 'sleep' }], ['samsonCU', { pose: 'lookup' }], ['samsonCU', { pose: 'stand' }]);
    for (const p of ['stand', 'turn', 'call', 'sit', 'beckon']) cases.push(['delilah', { pose: p }]);
    for (const p of ['stand', 'jar']) cases.push(['bride', { pose: p }]);
    for (const p of ['stand', 'object', 'worried']) cases.push(['manoah', { pose: p }]);
    for (const p of ['stand', 'object', 'awe', 'worried']) cases.push(['mother', { pose: p }]);
    for (const p of ['stand', 'speak']) cases.push(['angel', { pose: p, glow: 1 }]);
    for (const p of ['crouch', 'leap', 'thrown']) cases.push(['lion', { pose: p }]);
    cases.push(['barber', { k: 0 }], ['barber', { k: 1 }]);
    for (const p of ['stand', 'laugh', 'fall']) cases.push(['lord', { pose: p, k: 1 }]);
    cases.push(['boy', { pose: 'lead' }]);
    for (const p of ['stand', 'raise', 'hold', 'kneel', 'cheer', 'fall']) for (let v = 0; v < 12; v++) cases.push(['person', { pose: p, v, item: ['scroll', 'chains', 'staff'][v % 3], k: 1 }]);
    cases.push(['soldierFall', { k: 1 }]);
    const out = [];
    for (const [name, st] of cases) {
      const S = PP2.SIZES[name]; const cv = document.createElement('canvas'); cv.width = S.cw; cv.height = S.ch; const ctx = cv.getContext('2d');
      const t0 = performance.now();
      for (let i = 0; i < 3; i++) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S.cw, S.ch); ctx.translate(S.cw / 2, S.ch - S.footPx); ctx.scale(S.scale, S.scale); PP2[S.fn](ctx, Object.assign({}, st)); }
      const ms = (performance.now() - t0) / 3;
      const d = ctx.getImageData(0, 0, S.cw, S.ch).data; const edge = { top: 0, bottom: 0, left: 0, right: 0 };
      for (let x = 0; x < S.cw; x++) { if (d[(x) * 4 + 3] > 40) edge.top++; if (d[((S.ch - 1) * S.cw + x) * 4 + 3] > 40) edge.bottom++; }
      for (let y = 0; y < S.ch; y++) { if (d[(y * S.cw) * 4 + 3] > 40) edge.left++; if (d[(y * S.cw + S.cw - 1) * 4 + 3] > 40) edge.right++; }
      const clip = Object.entries(edge).filter(([k, v]) => v > 0).map(([k, v]) => k + ':' + v).join(' ');
      out.push(`${name} ${JSON.stringify(st)} ${ms.toFixed(1)}ms ${clip ? 'CLIP ' + clip : ''}`);
    }
    return { out, anchor: PP2.ANCHOR };
  });
  console.log(res.out.filter((l) => /CLIP/.test(l) || /samson|delilah|lion|angel/.test(l)).join('\n'));
  console.log('ANCHOR', JSON.stringify(res.anchor));
  await b.close();
})();
