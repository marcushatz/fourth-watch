const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const f of process.argv.slice(2)) {
    await p.setContent('<!doctype html><html><body style="margin:0;background:#000">' + fs.readFileSync(f, 'utf8') + '</body></html>');
    await p.waitForTimeout(150);
    await p.screenshot({ path: f.replace(/\.svg$/, '.jpg'), type: 'jpeg', quality: 93 });
    console.log(path.basename(path.dirname(f)), path.basename(f));
  }
  await b.close();
})();
