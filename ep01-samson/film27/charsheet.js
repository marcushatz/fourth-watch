// Character sheet: the new three-quarter Jesus (FWC.jesus5) on a neutral dark ground: ~1000 px tall, at end-card scale (~730 px,
// as in the 9:16 end card), 110 px tall, and in a 110 px circle at icon proportion. Small sizes are drawn big then scaled down,
// as the billboard pipeline does.
(async function () {
  const f = new FontFace('Inter', 'url(fonts/inter-latin-600-normal.woff2)', { weight: '600' }); document.fonts.add(f); await f.load();
  const q = new URLSearchParams(location.search), DRAW = q.get('fn') || 'jesus5';
  const W = 2400, H = 1260, out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1C2433'); bg.addColorStop(1, '#14100D'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
  // the figure, rendered once large (scale 2, as on the billboard)
  const FS = 2, fig = document.createElement('canvas'); fig.width = 900; fig.height = 1240; const fx = fig.getContext('2d');
  fx.translate(430, 1194); fx.scale(FS, FS); FWC[DRAW](fx, { s: 0.71, warm: 1 });
  const FOOT = [430, 1194], HT = 572 * FS;   // feet point and figure height on the big canvas
  const place = (cx, feetY, h) => { const k = h / HT; x.imageSmoothingQuality = 'high'; x.drawImage(fig, cx - FOOT[0] * k, feetY - FOOT[1] * k, fig.width * k, fig.height * k); };
  const glow = (cx, cy, r, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(255,196,110,${a})`); g.addColorStop(1, 'rgba(255,196,110,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); };
  const label = (t, cx, y) => { x.fillStyle = '#8C8174'; x.font = '600 22px Inter'; x.textAlign = 'center'; x.fillText(t, cx, y); };
  glow(480, 560, 520, 0.16); place(560, 1130, 1000); label('~1000 px tall', 560, 1200);
  glow(1300, 760, 380, 0.14); place(1370, 1130, 730); label('end-card scale (~730 px of 1920)', 1370, 1200);
  glow(1900, 1060, 90, 0.2); place(1910, 1130, 110); label('110 px tall', 1910, 1200);
  // 110 px circle, icon proportion (figure ~62% of the circle)
  { const cx = 2200, cy = 1060, r = 55, c = document.createElement('canvas'); c.width = c.height = 440; const cc = c.getContext('2d');
    const g = cc.createRadialGradient(150, 160, 10, 220, 220, 300); g.addColorStop(0, '#5A4630'); g.addColorStop(0.5, '#25283A'); g.addColorStop(1, '#141A28'); cc.fillStyle = g; cc.fillRect(0, 0, 440, 440);
    const k = 0.62 * 440 / HT; cc.drawImage(fig, 150 - FOOT[0] * k, 350 - FOOT[1] * k, fig.width * k, fig.height * k);
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip(); x.drawImage(c, cx - r, cy - r, 2 * r, 2 * r); x.restore(); label('110 px circle', cx, 1200); }
  globalThis.frameAt = () => out; globalThis.__ready = true;
})().catch((e) => { console.error(e); globalThis.__err = String(e && e.stack || e); globalThis.__ready = true; });
