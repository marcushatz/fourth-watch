const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage(); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'chars_test.html'));
  const r = await p.evaluate(() => {
    const draw = (fn, st) => { const c = document.createElement('canvas'); c.width = 700; c.height = 800; const x = c.getContext('2d'); x.translate(350, 760); x.scale(1, 1); PP2[fn](x, Object.assign({}, st)); return c.toDataURL(); };
    const cases = [['samson', { pose: 'burst', brk: 0.5, t: 1.3 }], ['samson', { pose: 'walk', phase: 2 }], ['person', { v: 5, pose: 'cheer', t: 2 }], ['lion', { pose: 'thrown', t: 0.7 }], ['delilah', { pose: 'turn', k: 0.6 }]];
    return cases.map(([fn, st]) => fn + ' ' + (draw(fn, st) === draw(fn, st) ? 'same' : 'DIFF'));
  }); console.log(r.join('\n')); await b.close(); })();
