// In-page shot study for a playing <video> (YouTube Shorts): seeks through the clip at 10 fps, finds cuts,
// measures camera movement (zoom + pan, from a global motion search below the caption area) and on-screen motion
// (what still moves after the camera is taken out), then draws a contact sheet of every shot as a page overlay.
// Usage in the page: __fwProbe.run() -> poll __fwProbe.state; __fwProbe.sheet(page) draws sheet `page`;
// __fwProbe.beats() -> the beat clock (how often something visibly changes below the captions; see beatclock.py).
window.__fwProbe = (() => {
  const S = { progress: 0, done: false, shots: null, err: null };
  const W = 72, H = 128, FPS = 10, Y0 = Math.round(H * 0.28), Y1 = Math.round(H * 0.95);
  const vid = () => [...document.querySelectorAll('video')].find((x) => x.duration > 0);
  const seek = (v, t) => new Promise((res) => { const on = () => { v.removeEventListener('seeked', on); res(); }; v.addEventListener('seeked', on); v.currentTime = t; setTimeout(res, 4000); });
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
  const luma = (v) => { g.drawImage(v, 0, 0, W, H); const d = g.getImageData(0, 0, W, H).data, y = new Float32Array(W * H); for (let k = 0; k < W * H; k++) y[k] = 0.299 * d[4 * k] + 0.587 * d[4 * k + 1] + 0.114 * d[4 * k + 2]; return y; };
  // best similarity transform (scale about centre + shift) mapping prev -> cur, on the area below the captions
  function motion(p, c) {
    const cx = W / 2, cy = (Y0 + Y1) / 2;
    const err = (s, dx, dy) => { let e = 0, n = 0; for (let y = Y0 + 9; y < Y1 - 9; y += 2) for (let x = 10; x < W - 10; x += 2) { const xs = Math.round(cx + (x - cx) * s + dx), ys = Math.round(cy + (y - cy) * s + dy); if (xs < 0 || ys < 0 || xs >= W || ys >= H) continue; e += Math.abs(c[ys * W + xs] - p[y * W + x]); n++; } return e / n; };
    let best = { e: err(1, 0, 0), s: 1, dx: 0, dy: 0 };   // the still camera wins ties (nearest-pixel sampling makes tiny moves look identical)
    for (const s of [0.94, 0.96, 0.975, 0.99, 1, 1.01, 1.025, 1.04, 1.06]) for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) {
      let e = 0, n = 0;
      for (let y = Y0 + 9; y < Y1 - 9; y += 2) for (let x = 10; x < W - 10; x += 2) {
        const xs = Math.round(cx + (x - cx) * s + dx), ys = Math.round(cy + (y - cy) * s + dy);
        if (xs < 0 || ys < 0 || xs >= W || ys >= H) continue;
        e += Math.abs(c[ys * W + xs] - p[y * W + x]); n++;
      }
      e /= n; if (e < best.e * 0.97 - 0.05) best = { e, s, dx, dy };
    }
    // own motion: share of points still changing after the camera move is removed
    let m = 0, n = 0; const { s, dx, dy } = best;
    for (let y = Y0 + 9; y < Y1 - 9; y += 2) for (let x = 10; x < W - 10; x += 2) {
      const xs = Math.round(cx + (x - cx) * s + dx), ys = Math.round(cy + (y - cy) * s + dy);
      if (xs < 0 || ys < 0 || xs >= W || ys >= H) continue;
      if (Math.abs(c[ys * W + xs] - p[y * W + x]) > 14) m++; n++;
    }
    return { ...best, own: m / n };
  }
  async function run() {
    try {
      S.progress = 0; S.done = false; S.shots = null; S.err = null;
      const v = vid(); v.muted = true; v.pause();
      const N = Math.floor((v.duration - 0.05) * FPS), fr = [];
      let prev = null;
      for (let i = 0; i < N; i++) {
        await seek(v, i / FPS); const y = luma(v);
        const r = { t: i / FPS, diff: 0, s: 1, dx: 0, dy: 0, own: 0, e: 0 };
        if (prev) {
          let d = 0; for (let k = 0; k < W * H; k++) d += Math.abs(y[k] - prev[k]); r.diff = d / (W * H);
          let dl = 0; for (let k = Y0 * W; k < W * H; k++) dl += Math.abs(y[k] - prev[k]); r.low = dl / (W * (H - Y0));   // below the captions
          Object.assign(r, motion(prev, y));
        }
        fr.push(r); prev = y; S.progress = (i + 1) / N;
      }
      // cuts: a spike in raw change that the camera model can't explain
      const cuts = [0];
      for (let i = 1; i < fr.length; i++) {
        const loc = fr.slice(Math.max(1, i - 8), i + 8).map((f) => f.diff).sort((a, b) => a - b); const med = loc[loc.length >> 1] + 0.5;
        if (fr[i].diff > 10 && fr[i].diff > 3.5 * med && fr[i].e > 9 && i - cuts[cuts.length - 1] >= 2) cuts.push(i);
      }
      cuts.push(fr.length);
      S.shots = cuts.slice(0, -1).map((a, j) => {
        const b = cuts[j + 1], seg = fr.slice(a + 1, b);
        const zoom = seg.reduce((z, f) => z + Math.log(f.s), 0), pan = seg.reduce((z, f) => z + Math.hypot(f.dx, f.dy), 0) / H * 100;
        const own = seg.length ? seg.map((f) => f.own).sort((x, y) => x - y)[seg.length >> 1] : 0;
        return { t: +(a / FPS).toFixed(1), len: +((b - a) / FPS).toFixed(1), zoom: Math.round((Math.exp(zoom) - 1) * 100), pan: Math.round(pan), own: Math.round(own * 100) };
      });
      S.frames = fr.map((f) => [+f.diff.toFixed(1), f.s, f.dx, f.dy, Math.round(f.own * 100), +(f.low || 0).toFixed(2)]);
      S.dur = v.duration; S.done = true;
    } catch (e) { S.err = String(e); }
  }
  // contact sheet overlay: for each shot (flash transitions under 0.4 s skipped), three frames side by side:
  // just after the cut, the middle, just before the next cut, so camera moves and actions read left to right.
  // 2 shots per row, 3 rows per page (6 shots per page). Label: start time, length, zoom %, pan %, own-motion %.
  async function sheet(page = 0) {
    const v = vid(); let o = document.getElementById('__fwsheet');
    if (!o) { o = document.createElement('canvas'); o.id = '__fwsheet'; Object.assign(o.style, { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 2147483647, background: '#111' }); document.body.appendChild(o); }
    const vw = innerWidth, vh = innerHeight; o.width = vw * 2; o.height = vh * 2; const c = o.getContext('2d'); c.scale(2, 2); c.fillStyle = '#111'; c.fillRect(0, 0, vw, vh);
    const real = S.shots.filter((s) => s.len >= 0.4), per = 6, list = real.slice(page * per, page * per + per);
    const cw = vw / 2, ch = vh / 3, th = ch - 18, tw = Math.min((cw - 12) / 3, th * 9 / 16);
    for (let k = 0; k < list.length; k++) {
      const s = list[k], x0 = (k % 2) * cw + 4, y0 = Math.floor(k / 2) * ch;
      const ts = [s.t + 0.1, s.t + s.len / 2, s.t + s.len - 0.12];
      for (let j = 0; j < 3; j++) { await seek(v, Math.min(v.duration - 0.05, ts[j])); c.drawImage(v, x0 + j * (tw + 2), y0 + 16, tw, th); }
      c.fillStyle = '#ffd36b'; c.font = '12px sans-serif'; c.fillText(`#${page * per + k + 1}  ${s.t}s  len ${s.len}s  z${s.zoom} p${s.pan} m${s.own}`, x0, y0 + 12);
    }
    return { page, shown: list.length, pages: Math.ceil(real.length / per), shots: real.length };
  }
  const hide = () => { const o = document.getElementById('__fwsheet'); if (o) o.remove(); };
  // beat clock (after run): local peaks of the below-caption change above max(0.8, 1.8 x the 3 s rolling median), >= 0.5 s apart.
  // Same rule as tools/reference_study/beatclock.py and fw_check.py; the 72x128 frames make it approximate (within ~10%).
  function beats() {
    const md = S.frames.map((f) => f[5]), ev = [];
    for (let i = 1; i < md.length - 1; i++) {
      const w = md.slice(Math.max(0, i - 15), i + 15).sort((a, b) => a - b), loc = w[w.length >> 1] + 0.05;
      if (md[i] >= md[i - 1] && md[i] >= md[i + 1] && md[i] > Math.max(0.8, 1.8 * loc) && (!ev.length || i - ev[ev.length - 1] >= 5)) ev.push(i);
    }
    const t = ev.map((i) => i / FPS), dur = S.dur, edges = [0, ...t, dur], gaps = edges.slice(1).map((x, k) => x - edges[k]);
    const dead = gaps.filter((g) => g > 4).reduce((a, b) => a + b, 0) / dur;
    return { beats: t.length, every: +(dur / Math.max(1, t.length)).toFixed(2), deadShare: +dead.toFixed(2), longest: +Math.max(...gaps).toFixed(1),
             longGaps: gaps.map((g, k) => [+edges[k].toFixed(1), +g.toFixed(1)]).filter(([, g]) => g > 4) };
  }
  return { run, sheet, hide, beats, state: S };
})();
'ok'
