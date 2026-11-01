const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.resolve(__dirname, 'chars_test.html'));
  const url = await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1300; c.height = 820; const x = c.getContext('2d'); x.fillStyle = '#8E877E'; x.fillRect(0, 0, 1300, 820);
    const one = (dx, f) => { x.save(); x.translate(dx, 790); x.scale(1.35, 1.35); f(x); x.restore(); };
    one(220, (x) => PP.samson(x, {})); one(650, (x) => PP2.samson(x, { pose: 'stand' }));
    // overlay: original in red channel tint, new in cyan
    x.save(); x.translate(1080, 790); x.scale(1.35, 1.35); x.globalAlpha = 0.5; PP.samson(x, {}); x.globalCompositeOperation = 'difference'; x.globalAlpha = 1; PP2.samson(x, { pose: 'stand' }); x.restore();
    return c.toDataURL();
  });
  fs.writeFileSync('out/sheets/diff.png', Buffer.from(url.split(',')[1], 'base64')); await b.close(); })();
