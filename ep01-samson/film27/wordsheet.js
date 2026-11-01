// Three wordmark options (WM.option A/B/C) at end-card size over the dark sea crop; each fits the end card's safe text zone
// (800 px wide: clear of the right-edge buttons). A frozen light sweep is shown on A and C.
(async function () {
  for (const [fam, file, w] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700'], ['Cinzel', 'fonts/cinzel-latin-900-normal.woff2', '900'], ['Inter', 'fonts/inter-latin-600-normal.woff2', '600']]) {
    const f = new FontFace(fam, `url(${file})`, { weight: w }); document.fonts.add(f); await f.load(); }
  const bg = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'out/wm_bg.png'; });
  const PW = 1080, PH = 440, LB = 46, W = PW, H = 3 * (PH + LB), out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d');
  x.fillStyle = '#0E0B09'; x.fillRect(0, 0, W, H);
  const names = { A: 'A  Gold foil, cross ornament', B: 'B  Stacked, star rule', C: 'C  Wide-spaced foil, frame + light sweep' };
  ['A', 'B', 'C'].forEach((id, k) => {
    const y0 = k * (PH + LB);
    x.fillStyle = '#8C8174'; x.font = '600 22px Inter'; x.textAlign = 'left'; x.fillText(names[id], 24, y0 + 31);
    const p = document.createElement('canvas'); p.width = PW; p.height = PH; const px = p.getContext('2d');
    px.drawImage(bg, 0, 0, PW, PH);
    const g = px.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, 'rgba(6,7,12,0.25)'); g.addColorStop(0.5, 'rgba(6,7,12,0.55)'); g.addColorStop(1, 'rgba(6,7,12,0.35)'); px.fillStyle = g; px.fillRect(0, 0, PW, PH);
    WM.option(px, PW, PH, id, { cx: PW / 2, cy: PH / 2, maxW: 780, scale: 1, sweep: id === 'B' ? null : PW * 0.42, sweepA: 0.85 });
    px.strokeStyle = 'rgba(255,80,80,0.35)'; px.setLineDash([6, 6]); px.strokeRect(150, 20, 780, PH - 40);   // the safe text zone (x 150-930)
    x.drawImage(p, 0, y0 + LB);
  });
  globalThis.frameAt = () => out; globalThis.__ready = true;
})().catch((e) => { console.error(e); globalThis.__err = String(e && e.stack || e); globalThis.__ready = true; });
