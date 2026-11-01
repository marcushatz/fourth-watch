// Render frames of film27/endcard_anim.html with headless Chromium (software WebGL); the scene is built once.
// usage: node render_endcard.js <outdir> "<query>" <times>   times: "0.5,1.6,3,5.5" or "from:to:fps" (frame files f_0000.png...)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = '/home/claude/fourth-watch/ep01-samson/film27';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };
(async () => {
  const [outdir, qs, spec, startIdx] = process.argv.slice(2);
  fs.mkdirSync(outdir, { recursive: true });
  let jobs = [];
  if (spec.includes(':')) { const [a, b, fps] = spec.split(':').map(Number); const n0 = Math.round(a * fps), n1 = Math.round(b * fps); for (let n = n0; n < n1; n++) jobs.push({ t: n / fps, name: `f_${String(n).padStart(4, '0')}.png` }); }
  else jobs = spec.split(',').map((s) => ({ t: +s, name: `t_${(+s).toFixed(2)}.png` }));
  const srv = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
    page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
    const t0 = Date.now();
    await page.goto(`http://127.0.0.1:${srv.address().port}/${process.env.PAGE || "endcard_anim.html"}?${qs}`);
    await page.waitForFunction(() => globalThis.__ready === true, null, { timeout: 170000 });
    const err = await page.evaluate(() => globalThis.__err); if (err) throw new Error(err);
    console.log('built in', ((Date.now() - t0) / 1000).toFixed(1), 's');
    for (const j of jobs) {
      const out = path.join(outdir, j.name);
      if (fs.existsSync(out)) continue;
      const t1 = Date.now();
      const data = await page.evaluate((t) => globalThis.frameAt(t).toDataURL('image/png'), j.t);
      fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
      console.log(j.name, 't=' + j.t.toFixed(3), ((Date.now() - t1) / 1000).toFixed(1) + 's', JSON.stringify(await page.evaluate(() => globalThis.__proj)));
    }
  } finally { await browser.close(); srv.close(); }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
