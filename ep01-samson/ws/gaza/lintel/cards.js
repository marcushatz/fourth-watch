// 2D cards for Fourth Watch Ep 1: verse cards, labels, the shout stamp, numbered points, the open Bible, the map,
// the Hebrews 11 list, the bold statement, the question, the equation and the CTA. Fixed to the screen; pure
// functions of t. Palette: night, parchment, lamp gold, ember (series canon).
(function () {
  const S = globalThis.SCORE, W = S.W, H = S.H;
  const C = (globalThis.CARDS = {});
  const SERIF = '"Cinzel"', ITAL = '"Cormorant Garamond"', SANS = '"Inter"';
  const PARCH = '#F4EAD5', GOLD = '#F0C46A', EMBER = '#D2643C', NIGHT = '#14100D';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const pr = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const tryL = cur ? cur + ' ' + w : w; if (ctx.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL; }
    if (cur) lines.push(cur); return lines;
  }
  function shadowText(ctx, blur = 18) { ctx.shadowColor = 'rgba(6,6,18,0.65)'; ctx.shadowBlur = blur; ctx.shadowOffsetY = 3; }
  function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }

  // ---------------- background for 2D-only shots: night parchment, warm vignette, slow dust ----------------
  C.background = (ctx, t, shot) => {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.46, 80, W * 0.5, H * 0.5, H * 0.75);
    g.addColorStop(0, '#3A2B1F'); g.addColorStop(0.55, '#21170F'); g.addColorStop(1, '#0D0A08');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // faint paper grain + a few drifting motes
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const k = (hsh(i, 3) + t * 0.012 * (0.5 + hsh(i, 4))) % 1;
      const x = W * hsh(i, 1) + Math.sin(t * 0.3 + i) * 30, y = H * (1 - k), a = 0.18 * Math.sin(Math.PI * k) * (0.4 + 0.6 * hsh(i, 5));
      ctx.fillStyle = `rgba(255,214,150,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + 2.5 * hsh(i, 6), 0, 6.283); ctx.fill();
    }
    ctx.restore();
    // God's light from the upper left, faint
    const r = ctx.createRadialGradient(-80, -120, 10, -80, -120, H * 0.9); r.addColorStop(0, 'rgba(255,200,120,0.16)'); r.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  };

  // ---------------- verse card: a darkened band, italic serif quote, gold reference ----------------
  function verseCard(ctx, t, shot, v, y0 = 760) {
    const k = eo(pr(t, shot.t0 + 0.1, shot.t0 + 0.55)), out = 1 - pr(t, shot.t1 - 0.25, shot.t1 - 0.02);
    const a = k * out; if (a <= 0) return;
    const size = v.text.length > 90 ? 62 : v.text.length > 50 ? 70 : 82;
    ctx.save(); ctx.font = `600 italic ${size}px ${ITAL}`;
    const lines = wrap(ctx, '“' + v.text + '”', W - 200), lh = size * 1.18;
    const bh = lines.length * lh + 190, by = y0 - 70;
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgba(12,10,8,0)'); g.addColorStop(0.18, 'rgba(12,10,8,0.62)'); g.addColorStop(0.82, 'rgba(12,10,8,0.62)'); g.addColorStop(1, 'rgba(12,10,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, by, W, bh);
    ctx.strokeStyle = 'rgba(240,196,106,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 60, by + 40); ctx.lineTo(W / 2 + 60, by + 40); ctx.stroke();
    shadowText(ctx, 16); ctx.fillStyle = PARCH; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    lines.forEach((l, i) => { const la = eo(pr(t, shot.t0 + 0.15 + i * 0.12, shot.t0 + 0.6 + i * 0.12)); ctx.globalAlpha = a * la; ctx.fillText(l, W / 2, y0 + 50 + i * lh + (1 - la) * 12); });
    ctx.globalAlpha = a * eo(pr(t, shot.t0 + 0.5, shot.t0 + 0.9)); ctx.font = `700 34px ${SERIF}`; ctx.letterSpacing = '4px'; ctx.fillStyle = GOLD;
    ctx.fillText(v.ref + ' · ESV', W / 2, y0 + 50 + lines.length * lh + 26);
    ctx.restore();
  }

  // ---------------- label: a small pill with the quoted words and the reference ----------------
  function label(ctx, t, shot) {
    const at = shot.labelBeat && shot.beats[shot.labelBeat] ? shot.beats[shot.labelBeat] - 0.1 : shot.t0 + 0.3;
    const k = eo(pr(t, at, at + 0.4)), out = 1 - pr(t, shot.t1 - 0.25, shot.t1 - 0.02); const a = k * out; if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 italic 56px ${ITAL}`; const tw = ctx.measureText(shot.label).width;
    const pw = tw + 90, ph = 150, x = W / 2, y = H * 0.66;
    ctx.translate(x, y); ctx.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(20,16,13,0.88)'; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 30); ctx.fill(); noShadow(ctx);
    ctx.strokeStyle = 'rgba(240,196,106,0.6)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = PARCH; ctx.fillText(shot.label, 0, -18);
    ctx.font = `700 26px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.fillStyle = GOLD; ctx.fillText(shot.ref, 0, 40);
    ctx.restore();
  }

  // ---------------- the shout: the same words stamped four times ----------------
  function shout(ctx, t, shot) {
    const t0 = shot.beats.shout - 0.05, t1 = shot.t1 - 0.15, step = Math.max(0.45, (t1 - t0) / 4.4);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let n = 0; n < 4; n++) {
      const ts = t0 + n * step, k = pr(t, ts, ts + 0.22); if (k <= 0) continue;
      const pop = 1 + 0.35 * Math.pow(1 - eo(k), 2), y = H * 0.6 + (n - 1.5) * 150, rot = [-0.035, 0.03, -0.02, 0.04][n];
      ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(pop, pop); ctx.globalAlpha = Math.min(1, k * 2) * (n < 3 ? 0.55 + 0.45 * (n === Math.floor((t - t0) / step) ? 1 : 0.6) : 1);
      ctx.fillStyle = 'rgba(20,16,13,0.86)'; ctx.beginPath(); ctx.roundRect(-440, -54, 880, 108, 16); ctx.fill();
      ctx.strokeStyle = n === 3 ? EMBER : 'rgba(240,196,106,0.7)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = `900 33px ${SERIF}`; ctx.letterSpacing = '0px'; ctx.fillStyle = n === 3 ? '#FFD8C4' : PARCH;
      ctx.fillText('THE PHILISTINES ARE UPON YOU, SAMSON!', 0, 3);
      ctx.font = `700 30px ${SANS}`; ctx.fillStyle = n === 3 ? EMBER : GOLD; ctx.fillText(String(n + 1), -480, 2);
      ctx.restore();
    }
    const ka = eo(pr(t, t0 + 0.2, t0 + 0.6));
    if (ka > 0) { ctx.globalAlpha = ka; ctx.font = `700 28px ${SERIF}`; ctx.letterSpacing = '4px'; ctx.fillStyle = GOLD; ctx.fillText('JUDGES 16:9 · 16:12 · 16:14 · 16:20', W / 2, H * 0.6 + 2.5 * 150 + 40); }
    ctx.restore();
  }

  // ---------------- numbered point ----------------
  function num(ctx, t, shot) {
    const k = eo(pr(t, shot.t0, shot.t0 + 0.45)), out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02), a = k * out; if (a <= 0) return;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = a;
    // halo
    const hg = ctx.createRadialGradient(W / 2, H * 0.43, 10, W / 2, H * 0.43, 420); hg.addColorStop(0, 'rgba(240,196,106,0.22)'); hg.addColorStop(1, 'rgba(240,196,106,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H);
    shadowText(ctx, 30); ctx.font = `900 ${Math.round(440 + 40 * (1 - k))}px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText(String(shot.n), W / 2, H * 0.52);
    ctx.font = `900 64px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH;
    const lines = wrap(ctx, shot.head, W - 180), ka = eo(pr(t, shot.t0 + 0.2, shot.t0 + 0.65));
    ctx.globalAlpha = a * ka;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.63 + i * 76 + (1 - ka) * 16));
    // the "No." beat on point 3: a gold stroke under the heading
    if (shot.beats && shot.beats.no) { const kn = eo(pr(t, shot.beats.no, shot.beats.no + 0.35)); if (kn > 0) { ctx.globalAlpha = a * kn; ctx.font = `900 120px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText('NO.', W / 2, H * 0.29); } }
    ctx.restore();
  }

  // ---------------- open Bible (S05) ----------------
  function bible(ctx, t, shot) {
    const k = eo(pr(t, shot.t0, shot.t0 + 0.5)), out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02), a = k * out; if (a <= 0) return;
    const cx = W / 2, cy = H * 0.6, bw = 860, bh = 600;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy + (1 - k) * 40);
    // light from above left
    const lg = ctx.createRadialGradient(-200, -500, 20, -200, -500, 1100); lg.addColorStop(0, 'rgba(255,214,150,0.35)'); lg.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = lg; ctx.fillRect(-W, -H, 2 * W, 2 * H);
    // cover + pages
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
    ctx.fillStyle = '#4A2A1A'; ctx.beginPath(); ctx.roundRect(-bw / 2 - 24, -bh / 2 - 18, bw + 48, bh + 50, 18); ctx.fill(); noShadow(ctx);
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#EFE2C6'; ctx.beginPath();
      ctx.moveTo(0, -bh / 2 + 6); ctx.quadraticCurveTo(side * bw * 0.25, -bh / 2 - 18, side * bw / 2, -bh / 2 + 4); ctx.lineTo(side * bw / 2, bh / 2); ctx.quadraticCurveTo(side * bw * 0.25, bh / 2 - 16, 0, bh / 2 + 6); ctx.closePath(); ctx.fill();
      // text lines
      ctx.fillStyle = 'rgba(70,52,38,0.42)';
      for (let i = 0; i < 15; i++) { const y = -bh / 2 + 120 + i * 30, x0 = side < 0 ? -bw / 2 + 50 : 50, len = (bw / 2 - 100) * (0.75 + 0.25 * hsh(i, side + 3)); ctx.fillRect(x0, y, len, 5); }
    }
    ctx.fillStyle = 'rgba(60,40,26,0.35)'; ctx.fillRect(-3, -bh / 2, 6, bh);
    // page flip on "Bible"
    const fk = pr(t, shot.beats.bible - 0.15, shot.beats.bible + 0.35);
    if (fk > 0 && fk < 1) { const x = Math.cos(fk * Math.PI) * bw / 2; ctx.fillStyle = '#F6EBD3'; ctx.beginPath(); ctx.moveTo(0, -bh / 2 + 4); ctx.lineTo(x, -bh / 2 - 10 * Math.sin(fk * Math.PI)); ctx.lineTo(x, bh / 2 - 6); ctx.lineTo(0, bh / 2 + 4); ctx.closePath(); ctx.fill(); }
    // headings
    ctx.textAlign = 'center'; ctx.fillStyle = '#5A3A24'; ctx.font = `700 40px ${SERIF}`; ctx.letterSpacing = '6px';
    ctx.fillText('JUDGES', -bw / 4, -bh / 2 + 78); ctx.fillText('13–16', bw / 4, -bh / 2 + 78);
    ctx.restore();
  }

  // ---------------- map (S19): the five Philistine cities, Israel's hill country, Zorah and Timnah ----------------
  function map(ctx, t, shot) {
    const k = eo(pr(t, shot.t0, shot.t0 + 0.5)), out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02), a = k * out; if (a <= 0) return;
    const ox = 90, oy = 640, mw = W - 180, mh = 980;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,16,13,0.6)'; ctx.beginPath(); ctx.roundRect(ox - 10, oy - 10, mw + 20, mh + 20, 24); ctx.fill();
    ctx.beginPath(); ctx.roundRect(ox, oy, mw, mh, 18); ctx.clip();
    // land
    ctx.fillStyle = '#C9A774'; ctx.fillRect(ox, oy, mw, mh);
    // sea on the west (left), coastline running NNE
    ctx.fillStyle = '#5E7E92'; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + mw * 0.36, oy); ctx.bezierCurveTo(ox + mw * 0.3, oy + mh * 0.35, ox + mw * 0.2, oy + mh * 0.62, ox + mw * 0.06, oy + mh); ctx.lineTo(ox, oy + mh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(244,234,213,0.5)'; ctx.font = `600 italic 34px ${ITAL}`; ctx.textAlign = 'center'; ctx.fillText('Great Sea', ox + mw * 0.11, oy + mh * 0.35);
    // hill country (east), shaded
    const hg = ctx.createLinearGradient(ox + mw * 0.55, 0, ox + mw, 0); hg.addColorStop(0, 'rgba(110,82,52,0)'); hg.addColorStop(1, 'rgba(110,82,52,0.55)'); ctx.fillStyle = hg; ctx.fillRect(ox, oy, mw, mh);
    // Philistine territory wash
    ctx.fillStyle = 'rgba(178,74,50,0.28)'; ctx.beginPath(); ctx.moveTo(ox + mw * 0.36, oy); ctx.lineTo(ox + mw * 0.6, oy + mh * 0.05); ctx.bezierCurveTo(ox + mw * 0.6, oy + mh * 0.5, ox + mw * 0.5, oy + mh * 0.8, ox + mw * 0.4, oy + mh); ctx.lineTo(ox + mw * 0.06, oy + mh); ctx.bezierCurveTo(ox + mw * 0.2, oy + mh * 0.62, ox + mw * 0.3, oy + mh * 0.35, ox + mw * 0.36, oy); ctx.fill();
    const P = (u, v) => [ox + mw * u, oy + mh * v];
    const cities = [['ASHDOD', 0.36, 0.2], ['EKRON', 0.55, 0.13], ['ASHKELON', 0.27, 0.42], ['GATH', 0.55, 0.43], ['GAZA', 0.17, 0.78]];
    const isr = [['ZORAH', 0.77, 0.22], ['TIMNAH', 0.66, 0.27], ['HEBRON', 0.86, 0.8]];
    ctx.textAlign = 'left';
    cities.forEach(([n, u, v], i) => { const kk = eo(pr(t, shot.t0 + 0.3 + i * 0.12, shot.t0 + 0.6 + i * 0.12)); if (kk <= 0) return; const [x, y] = P(u, v); ctx.globalAlpha = a * kk; ctx.fillStyle = '#9E3B26'; ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.283); ctx.fill(); ctx.strokeStyle = PARCH; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#2A1E16'; ctx.font = `700 30px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillText(n, x + 22, y + 10); });
    isr.forEach(([n, u, v], i) => { const kk = eo(pr(t, shot.t0 + 0.9 + i * 0.12, shot.t0 + 1.2 + i * 0.12)); if (kk <= 0) return; const [x, y] = P(u, v); ctx.globalAlpha = a * kk; ctx.fillStyle = '#2A1E16'; ctx.beginPath(); ctx.arc(x, y, 10, 0, 6.283); ctx.fill(); ctx.font = `700 28px ${SERIF}`; ctx.textAlign = u > 0.8 ? 'right' : 'left'; ctx.fillText(n, x + (u > 0.8 ? -18 : 18), y - 12); ctx.textAlign = 'left'; });
    ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = `700 26px ${SERIF}`; ctx.letterSpacing = '5px'; ctx.fillStyle = 'rgba(42,30,22,0.7)'; ctx.fillText('PHILISTIA', ox + mw * 0.4, oy + mh * 0.62); ctx.fillText('ISRAEL', ox + mw * 0.82, oy + mh * 0.5);
    // gold arrow: from Zorah into Philistia ("begin to save Israel")
    const ka = eio(pr(t, shot.beats.plan - 0.6, shot.beats.plan + 0.2));
    if (ka > 0) { const [x0, y0] = P(0.77, 0.22), [x1, y1] = P(0.42, 0.3); const xe = x0 + (x1 - x0) * ka, ye = y0 + (y1 - y0) * ka; ctx.strokeStyle = GOLD; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(240,196,106,0.8)'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(xe, ye); ctx.stroke(); const an = Math.atan2(y1 - y0, x1 - x0); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(xe + Math.cos(an) * 26, ye + Math.sin(an) * 26); ctx.lineTo(xe + Math.cos(an + 2.5) * 26, ye + Math.sin(an + 2.5) * 26); ctx.lineTo(xe + Math.cos(an - 2.5) * 26, ye + Math.sin(an - 2.5) * 26); ctx.fill(); noShadow(ctx); }
    ctx.restore();
    // verdict chips under the map
    const k1 = eo(pr(t, shot.beats.plan - 0.1, shot.beats.plan + 0.3)), k2 = eo(pr(t, shot.beats.reward - 0.1, shot.beats.reward + 0.3));
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const chip = (txt, x, y, k2_, good) => { if (k2_ <= 0) return; ctx.globalAlpha = a * k2_; ctx.fillStyle = 'rgba(20,16,13,0.9)'; ctx.beginPath(); ctx.roundRect(x - 230, y - 44, 460, 88, 44); ctx.fill(); ctx.strokeStyle = good ? GOLD : EMBER; ctx.lineWidth = 2.5; ctx.stroke(); ctx.font = `700 34px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = good ? GOLD : '#E9B39C'; ctx.fillText(txt, x, y + 2); if (!good) { ctx.strokeStyle = EMBER; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 160, y + 2); ctx.lineTo(x + 160 * k2_, y + 2); ctx.stroke(); } };
    chip("GOD'S PLAN", W * 0.28, oy + mh + 90, k1, true); chip('A REWARD', W * 0.72, oy + mh + 90, k2, false);
    ctx.restore();
  }

  // ---------------- big question over a 3D shot (S20) ----------------
  function question(ctx, t, shot) {
    const k = eo(pr(t, shot.t0 + 0.05, shot.t0 + 0.5)), out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02), a = k * out; if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; shadowText(ctx, 26);
    ctx.font = `900 76px ${SERIF}`; ctx.letterSpacing = '2px';
    const lines = wrap(ctx, shot.q, W - 160);
    lines.forEach((l, i) => {
      const words = l.split(' '); const sp = ctx.measureText(' ').width; const ws = words.map((w) => ctx.measureText(w).width); let x = W / 2 - (ws.reduce((p, q) => p + q, 0) + sp * (words.length - 1)) / 2;
      words.forEach((w, j) => { ctx.textAlign = 'left'; ctx.fillStyle = /GIFT|PLEASED/.test(w) ? GOLD : PARCH; ctx.fillText(w, x, 360 + i * 84 + (1 - k) * 14); x += ws[j] + sp; });
    });
    ctx.restore();
  }

  // ---------------- MIGHTY WORKS ≠ KNOWING GOD (S24) ----------------
  function neq(ctx, t, shot) {
    const out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02);
    const k1 = eo(pr(t, shot.beats.works - 0.1, shot.beats.works + 0.35)) * out, k2 = eo(pr(t, shot.beats.knowing - 0.1, shot.beats.knowing + 0.35)) * out;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; shadowText(ctx, 24);
    const y = H * 0.66;
    if (k1 > 0) { ctx.globalAlpha = k1; ctx.font = `900 74px ${SERIF}`; ctx.fillStyle = PARCH; ctx.fillText('MIGHTY WORKS', W / 2, y - 120 + (1 - k1) * 14); }
    if (k2 > 0) { ctx.globalAlpha = k2; ctx.font = `900 96px ${SERIF}`; ctx.fillStyle = EMBER; ctx.fillText('≠', W / 2, y); ctx.font = `900 74px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText('KNOWING GOD', W / 2, y + 120 + (1 - k2) * 14); }
    ctx.restore();
  }

  // ---------------- Hebrews 11 (S31) ----------------
  function heb11(ctx, t, shot) {
    const k = eo(pr(t, shot.t0, shot.t0 + 0.5)), out = 1 - pr(t, shot.t1 - 0.25, shot.t1 - 0.02), a = k * out; if (a <= 0) return;
    const sx = 120, sy = 380, sw = W - 240, sh = 1120;
    ctx.save(); ctx.globalAlpha = a;
    // scroll
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#EADCBC'; ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh * eio(pr(t, shot.t0, shot.t0 + 0.7)), 10); ctx.fill(); noShadow(ctx);
    for (const yy of [sy - 18, sy + sh * eio(pr(t, shot.t0, shot.t0 + 0.7)) - 18]) { ctx.fillStyle = '#7A5236'; ctx.beginPath(); ctx.roundRect(sx - 30, yy, sw + 60, 36, 18); ctx.fill(); }
    const reveal = eio(pr(t, shot.t0 + 0.2, shot.t0 + 0.8)); if (reveal <= 0) { ctx.restore(); return; }
    ctx.globalAlpha = a * reveal; ctx.textAlign = 'center';
    ctx.font = `700 40px ${SERIF}`; ctx.letterSpacing = '6px'; ctx.fillStyle = '#6B4A33'; ctx.fillText('HEBREWS 11:32', W / 2, sy + 90);
    const names = ['GIDEON', 'BARAK', 'SAMSON', 'JEPHTHAH', 'DAVID', 'SAMUEL'];
    const hk = eo(pr(t, shot.beats.names - 0.15, shot.beats.names + 0.4));
    names.forEach((n, i) => {
      const y = sy + 190 + i * 92, isS = n === 'SAMSON';
      ctx.font = `900 ${isS ? Math.round(64 + 12 * hk) : 56}px ${SERIF}`; ctx.letterSpacing = '4px';
      if (isS && hk > 0) { ctx.fillStyle = `rgba(240,196,106,${0.35 * hk})`; ctx.beginPath(); ctx.roundRect(W / 2 - 260, y - 56, 520, 76, 38); ctx.fill(); }
      ctx.fillStyle = isS ? (hk > 0 ? '#8A5A12' : '#4A3424') : `rgba(74,52,36,${1 - 0.45 * hk})`; ctx.fillText(n, W / 2, y);
    });
    // the quote, built on its beats
    const q1 = eo(pr(t, shot.beats.faith - 0.1, shot.beats.faith + 0.35)), q2 = eo(pr(t, shot.beats.strong - 0.1, shot.beats.strong + 0.4));
    ctx.font = `600 italic 60px ${ITAL}`; ctx.letterSpacing = '0px';
    if (q1 > 0) { ctx.globalAlpha = a * q1; ctx.fillStyle = '#3A2A1E'; ctx.fillText('“through faith”', W / 2, sy + 790); }
    if (q2 > 0) { ctx.globalAlpha = a * q2; ctx.fillStyle = '#3A2A1E'; ctx.fillText('“were made strong', W / 2, sy + 880); ctx.fillText('out of weakness”', W / 2, sy + 950); ctx.font = `700 30px ${SERIF}`; ctx.letterSpacing = '4px'; ctx.fillStyle = '#8A5A12'; ctx.fillText('HEBREWS 11:33–34 · ESV', W / 2, sy + 1030); }
    ctx.restore();
  }

  // ---------------- the bold claim (S34) ----------------
  function statement(ctx, t, shot) {
    const out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02);
    const rows = [[['A'], ['GIFT*'], ['FROM'], ['GOD']], [['IS'], ['NOT'], ['A']], [['VERDICT*']], [['FROM'], ['GOD']]];
    const beats = [shot.t0 + 0.05, shot.beats.verdict - 0.6, shot.beats.verdict - 0.05, shot.beats.verdict + 0.2];
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; shadowText(ctx, 30);
    rows.forEach((row, ri) => {
      const k = eo(pr(t, beats[ri], beats[ri] + 0.4)) * out; if (k <= 0) return;
      const size = ri === 1 ? 64 : ri === 2 ? 120 : 88; ctx.font = `900 ${size}px ${SERIF}`; ctx.letterSpacing = '2px';
      const words = row.map((w) => w[0].replace('*', '')), sp = ctx.measureText(' ').width, ws = words.map((w) => ctx.measureText(w).width);
      let x = W / 2 - (ws.reduce((p, q) => p + q, 0) + sp * (words.length - 1)) / 2; const y = H * 0.36 + [0, 130, 290, 420][ri];
      ctx.globalAlpha = k;
      words.forEach((w, j) => { ctx.fillStyle = row[j][0].endsWith('*') ? GOLD : PARCH; ctx.fillText(w, x, y + (1 - k) * 18); x += ws[j] + sp; });
    });
    ctx.restore();
  }

  // ---------------- CTA + end card (S36) ----------------
  function cta(ctx, t, shot) {
    const k = eo(pr(t, shot.t0, shot.t0 + 0.5)); const endK = eo(pr(t, S.VO.voEnd + 0.3, S.VO.voEnd + 1.0));
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const a = k * (1 - endK);
    if (a > 0) {
      ctx.globalAlpha = a; shadowText(ctx, 24); ctx.font = `900 74px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH;
      ctx.fillText('WHICH HIT YOU', W / 2, 420); ctx.fillStyle = GOLD; ctx.fillText('HARDER?', W / 2, 505); noShadow(ctx);
      const opt = (x, y, title, sub, icon, kk) => {
        if (kk <= 0) return; ctx.save(); ctx.globalAlpha = a * kk; ctx.translate(x, y + (1 - kk) * 30);
        ctx.fillStyle = 'rgba(20,16,13,0.9)'; ctx.beginPath(); ctx.roundRect(-220, -270, 440, 560, 34); ctx.fill(); ctx.strokeStyle = 'rgba(240,196,106,0.7)'; ctx.lineWidth = 3; ctx.stroke();
        icon(ctx);
        ctx.fillStyle = PARCH; ctx.font = `900 40px ${SERIF}`; ctx.letterSpacing = '2px'; title.forEach((l, i) => ctx.fillText(l, 0, 110 + i * 48));
        ctx.fillStyle = GOLD; ctx.font = `700 24px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.fillText(sub, 0, 110 + title.length * 48 + 24);
        ctx.restore();
      };
      const scroll = (c) => { c.fillStyle = '#EADCBC'; c.beginPath(); c.roundRect(-90, -200, 180, 220, 8); c.fill(); c.fillStyle = '#7A5236'; c.beginPath(); c.roundRect(-110, -214, 220, 26, 13); c.fill(); c.beginPath(); c.roundRect(-110, 8, 220, 26, 13); c.fill(); c.fillStyle = '#8A5A12'; c.font = `900 30px ${SERIF}`; c.fillText('SAMSON', 0, -80); c.fillStyle = 'rgba(74,52,36,0.5)'; for (let i = 0; i < 4; i++) c.fillRect(-60, -150 + i * 0 + (i < 2 ? i * 24 : 40 + i * 24), 120, 6); };
      const light = (c) => { const g = c.createRadialGradient(0, -100, 5, 0, -100, 160); g.addColorStop(0, 'rgba(255,214,140,0.95)'); g.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g; c.fillRect(-200, -260, 400, 320); c.fillStyle = '#8E7C68'; c.fillRect(-80, -150, 34, 190); c.fillRect(46, -150, 34, 190); c.fillStyle = '#5E5044'; c.fillRect(-110, -170, 220, 28); };
      opt(W * 0.27, 1050, ['HEBREWS 11', 'NAMES HIM AMONG', 'THE FAITHFUL'], 'HEBREWS 11:32', scroll, eo(pr(t, shot.beats.heb - 0.1, shot.beats.heb + 0.4)));
      opt(W * 0.73, 1050, ['GOD STILL', 'ANSWERED HIM', 'AT THE END'], 'JUDGES 16:28–30', light, eo(pr(t, shot.beats.answered - 0.1, shot.beats.answered + 0.4)));
      const kc = eo(pr(t, shot.beats.comments - 0.3, shot.beats.comments + 0.2));
      if (kc > 0) { ctx.globalAlpha = a * kc; ctx.font = `700 40px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH; ctx.fillText('TELL US IN THE COMMENTS', W / 2, 1440); }
    }
    if (endK > 0) {
      ctx.globalAlpha = endK; globalThis.TX.mark(ctx, W / 2, H * 0.45, 5.2);
      ctx.font = `700 76px ${SERIF}`; ctx.letterSpacing = '10px'; ctx.fillStyle = PARCH; ctx.fillText('FOURTH WATCH', W / 2, H * 0.45 + 170);
      ctx.font = `600 italic 44px ${ITAL}`; ctx.letterSpacing = '0px'; ctx.fillStyle = GOLD; ctx.fillText('Ask the text.', W / 2, H * 0.45 + 240);
    }
    ctx.restore();
  }

  C.draw = (ctx, t, shot, r) => {
    switch (shot.card) {
      case 'verse': return verseCard(ctx, t, shot, S.VERSES[shot.verse]);
      case 'label': return label(ctx, t, shot);
      case 'shout': return shout(ctx, t, shot);
      case 'num': return num(ctx, t, shot);
      case 'bible': return bible(ctx, t, shot);
      case 'map': return map(ctx, t, shot);
      case 'question': return question(ctx, t, shot);
      case 'neq': return neq(ctx, t, shot);
      case 'heb11': return heb11(ctx, t, shot);
      case 'statement': return statement(ctx, t, shot);
      case 'cta': return cta(ctx, t, shot);
      default: return null;
    }
  };
})();
