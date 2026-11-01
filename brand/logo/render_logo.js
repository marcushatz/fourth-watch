// Render the Fourth Watch logo scene (film27/logo.html) to PNG with headless Chromium (software WebGL).
// usage: node render_logo.js <out.png> "<query string>"     e.g. node render_logo.js a.png "mode=square&size=1024"
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = '/home/claude/fourth-watch/ep01-samson/film27';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };
(async () => {
  const [out, qs] = process.argv.slice(2);
  const srv = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 600 } });
    page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
    await page.goto(`http://127.0.0.1:${srv.address().port}/logo.html?${qs}`);
    await page.waitForFunction(() => globalThis.__done === true, null, { timeout: 170000 });
    const err = await page.evaluate(() => globalThis.__err); if (err) throw new Error(err);
    const data = await page.evaluate(() => globalThis.__out.toDataURL('image/png'));
    fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
    console.log('wrote', out, JSON.stringify(await page.evaluate(() => globalThis.__proj)));
  } finally { await browser.close(); srv.close(); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
