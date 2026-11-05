#!/usr/bin/env node
// Renders the storm through the real film27 page: film.js -> SCENES.storm_native -> LW.render.
// It uses the same Chrome and WebGL flags as engine/render.js and leaves film27's own files alone.
//   node render_native_storm.js stills <outDir> <t> [t ...]
//   node render_native_storm.js frames <outDir> <fromFrame> <toFrame> [--step N] [--scale S]
//   node render_native_storm.js video  <out.mp4> [--fps 30] [--from 0] [--to 48] [--scale 1] [--workers 2]
// Writes UNAPPROVED layout footage only. It never publishes and never uses a paid service.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), http = require('http'), os = require('os');
const { chromium } = require('playwright');

const FILM = path.resolve(__dirname, '..', '..', 'ep01-samson', 'film27');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const FLAGS = ['--disable-gpu', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows', '--force-device-scale-factor=1', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist', ...(process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : [])];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };

function serve() {
  const root = fs.realpathSync(FILM);
  const srv = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]), file = path.resolve(root, '.' + path.posix.normalize('/' + rel));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}
async function open(port, log) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: FLAGS });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) log.push(m.text()); });
  page.on('response', (r) => { if (r.status() >= 400 && !/favicon|brand\.json/.test(r.url())) log.push(`${r.status()} ${r.url()}`); });
  page.on('pageerror', (e) => log.push('pageerror: ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/storm_bridge.html`);
  await page.waitForFunction('window.READY === true', null, { timeout: 180000 });
  return { browser, page };
}
const shot = (page, t, fmt, scale) => page.evaluate(([a, b, c]) => window.renderAt(a, b, c), [t, fmt, scale]);
const bytes = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
const opt = (name, d) => { const i = process.argv.indexOf('--' + name); return i > 0 ? Number(process.argv[i + 1]) : d; };

async function main() {
  const [mode, out, ...rest] = process.argv.slice(2), log = [];
  const srv = await serve(), port = srv.address().port, scale = opt('scale', 1);
  if (mode === 'stills' || mode === 'frames') {
    fs.mkdirSync(out, { recursive: true });
    const { browser, page } = await open(port, log);
    const step = opt('step', 1), list = [];
    if (mode === 'stills') rest.filter((a, i) => !a.startsWith('--') && !(rest[i - 1] || '').startsWith('--')).forEach((a) => list.push(Math.round(Number(a) * 30)));
    else for (let f = Number(rest[0]); f < Number(rest[1]); f += step) list.push(f);
    for (const f of list) {
      const a = Date.now(), url = await shot(page, f / 30, 'png', scale);
      fs.writeFileSync(path.join(out, `f_${String(f).padStart(4, '0')}.png`), bytes(url));
      console.log(`frame ${f} ${Date.now() - a}ms`);
    }
    await browser.close();
  } else if (mode === 'video') {
    const fps = opt('fps', 30), from = opt('from', 0), to = opt('to', 48), n = opt('workers', 2);
    const frames = []; for (let i = Math.round(from * fps); i < Math.round(to * fps); i++) frames.push(Math.round((i * 30) / fps));
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'storm-')), parts = [];
    const chunk = Math.ceil(frames.length / n);
    await Promise.all(Array.from({ length: n }, async (_, k) => {
      const list = frames.slice(k * chunk, (k + 1) * chunk), part = path.join(dir, `part${k}.mp4`); parts[k] = part;
      const { browser, page } = await open(port, log);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), part], { stdio: ['pipe', 'inherit', 'inherit'] });
      const start = Date.now();
      for (let i = 0; i < list.length; i++) {
        const buf = bytes(await shot(page, list[i] / 30, 'jpeg', scale));
        if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once('drain', ok));
        if (i % 30 === 0) console.log(`worker ${k}: ${i}/${list.length} (${((Date.now() - start) / (i + 1) / 1000).toFixed(2)} s/frame)`);
      }
      ff.stdin.end(); await new Promise((ok, no) => ff.on('close', (c) => (c ? no(Error('ffmpeg ' + c)) : ok())));
      await browser.close();
    }));
    const listFile = path.join(dir, 'list.txt');
    fs.writeFileSync(listFile, parts.map((p) => `file '${p}'`).join('\n'));
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    await new Promise((ok, no) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' })
      .on('close', (c) => (c ? no(Error('concat ' + c)) : ok())));
    fs.rmSync(dir, { recursive: true, force: true });
  } else throw Error('usage: stills|frames|video');
  srv.close();
  if (log.length) { console.error(`console errors (${log.length}):\n` + [...new Set(log)].slice(0, 20).join('\n')); process.exitCode = 1; }
}
main().catch((e) => { console.error(e); process.exit(1); });
