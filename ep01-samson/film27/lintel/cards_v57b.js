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
    const vs = (shot.verseAt ?? shot.t0) - 0.1;
    const k = eo(pr(t, vs + 0.1, vs + 0.55)), out = 1 - pr(t, shot.t1 - 0.25, shot.t1 - 0.02);
    const a = k * out; if (a <= 0) return;
    const size = v.text.length > 90 ? 62 : v.text.length > 50 ? 70 : 82;
    ctx.save(); ctx.font = `600 italic ${size}px ${ITAL}`;
    const lines = wrap(ctx, '“' + v.text + '”', v.maxW || W - 200), lh = size * 1.18;
    const bh = lines.length * lh + 190, by = y0 - 70;
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgba(12,10,8,0)'); g.addColorStop(0.18, 'rgba(12,10,8,0.62)'); g.addColorStop(0.82, 'rgba(12,10,8,0.62)'); g.addColorStop(1, 'rgba(12,10,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, by, W, bh);
    ctx.strokeStyle = 'rgba(240,196,106,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 60, by + 40); ctx.lineTo(W / 2 + 60, by + 40); ctx.stroke();
    shadowText(ctx, 16); ctx.fillStyle = PARCH; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    lines.forEach((l, i) => { const la = eo(pr(t, vs + 0.15 + i * 0.12, vs + 0.6 + i * 0.12)); ctx.globalAlpha = a * la; ctx.fillText(l, W / 2, y0 + 50 + i * lh + (1 - la) * 12); });
    ctx.globalAlpha = a * eo(pr(t, vs + 0.5, vs + 0.9)); ctx.font = `700 34px ${SERIF}`; ctx.letterSpacing = '4px'; ctx.fillStyle = GOLD;
    ctx.fillText(v.ref + ' · ESV', W / 2, y0 + 50 + lines.length * lh + 26);
    ctx.restore();
  }

  // ---------------- label: a small pill with the quoted words and the reference ----------------
  function label(ctx, t, shot) {
    const at = shot.labelBeat && shot.beats[shot.labelBeat] ? shot.beats[shot.labelBeat] - 0.1 : shot.t0 + 0.3;
    const k = eo(pr(t, at, at + 0.4)), out = 1 - pr(t, shot.t1 - 0.25, shot.t1 - 0.02); const a = k * out; if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 italic 56px ${ITAL}`; const tw = ctx.measureText(shot.label).width;
    const pw = tw + 90, ph = 150, x = W / 2, y = shot.labelY ? H * shot.labelY : shot.chapter ? H * 0.665 : H * 0.795;
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
    const N = shot.shoutN || 4;
    for (let n = 0; n < N; n++) {
      const ts = t0 + n * step, k = pr(t, ts, ts + 0.22); if (k <= 0) continue;
      const pop = 1 + 0.35 * Math.pow(1 - eo(k), 2), y = H * 0.6 + (n - (N - 1) / 2) * 150, rot = [-0.035, 0.03, -0.02, 0.04][n];
      ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot); ctx.scale(pop, pop); ctx.globalAlpha = Math.min(1, k * 2) * (n < 3 ? 0.55 + 0.45 * (n === Math.floor((t - t0) / step) ? 1 : 0.6) : 1);
      ctx.fillStyle = 'rgba(20,16,13,0.86)'; ctx.beginPath(); ctx.roundRect(-440, -54, 880, 108, 16); ctx.fill();
      ctx.strokeStyle = n === 3 ? EMBER : 'rgba(240,196,106,0.7)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = `900 33px ${SERIF}`; ctx.letterSpacing = '0px'; ctx.fillStyle = n === 3 ? '#FFD8C4' : PARCH;
      ctx.fillText('THE PHILISTINES ARE UPON YOU, SAMSON!', 0, 3);
      ctx.font = `700 30px ${SANS}`; ctx.fillStyle = n === 3 ? EMBER : GOLD; ctx.fillText(String(n + 1), -480, 2);
      ctx.restore();
    }
    const ka = eo(pr(t, t0 + 0.2, t0 + 0.6));
    if (ka > 0) { const ref = N === 3 ? 'JUDGES 16:9 · 16:12 · 16:14' : 'JUDGES 16:9 · 16:12 · 16:14 · 16:20', ry = H * 0.6 + ((N - 1) / 2) * 150 + 108; ctx.globalAlpha = ka; ctx.font = `700 28px ${SERIF}`; ctx.letterSpacing = '4px'; const rw = ctx.measureText(ref).width + 60; ctx.fillStyle = 'rgba(20,16,13,0.78)'; ctx.beginPath(); ctx.roundRect(W / 2 - rw / 2, ry - 26, rw, 52, 26); ctx.fill(); ctx.fillStyle = GOLD; ctx.fillText(ref, W / 2, ry + 2); }
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
    const cx = W / 2, cy = H * 0.565, bw = 860, bh = 600;
    const push = 1 + 0.035 * eio(pr(t, shot.t0, shot.t1));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy + (1 - k) * 40); ctx.scale(push, push);
    // the roadmap ("one story, then three truths"): three gold tabs rise out of the pages on "three", 1-2-3
    if (shot.beats.three) [0, 1, 2].forEach((i) => {
      const kk = eo(pr(t, shot.beats.three - 0.05 + i * 0.16, shot.beats.three + 0.3 + i * 0.16)); if (kk <= 0) return;
      const tx = 120 + i * 105, tw2 = 74, th2 = 96 * kk;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
      ctx.fillStyle = i === 0 ? '#E8B955' : i === 1 ? '#D9A846' : '#C99A3E'; ctx.beginPath(); ctx.roundRect(tx - tw2 / 2, -bh / 2 - 6 - th2, tw2, th2 + 20, [10, 10, 0, 0]); ctx.fill(); noShadow(ctx);
      ctx.globalAlpha = a * eo((kk - 0.4) / 0.6); ctx.fillStyle = '#2A1E16'; ctx.font = `600 44px ${SANS}`; ctx.letterSpacing = '0px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), tx, -bh / 2 - 6 - th2 + 46);
      ctx.restore();
    });
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
    // page flips on "Bible" and on "story"
    for (const fb of [shot.beats.bible, shot.beats.story].filter((x) => x != null)) { const fk = pr(t, fb - 0.15, fb + 0.35);
    if (fk > 0 && fk < 1) { const x = Math.cos(fk * Math.PI) * bw / 2; ctx.fillStyle = '#F6EBD3'; ctx.beginPath(); ctx.moveTo(0, -bh / 2 + 4); ctx.lineTo(x, -bh / 2 - 10 * Math.sin(fk * Math.PI)); ctx.lineTo(x, bh / 2 - 6); ctx.lineTo(0, bh / 2 + 4); ctx.closePath(); ctx.fill(); } }
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
    if (k1 > 0) { ctx.globalAlpha = k1; ctx.font = `900 74px ${SERIF}`; ctx.fillStyle = PARCH; ctx.fillText((shot.neq || ['MIGHTY WORKS'])[0], W / 2, y - 120 + (1 - k1) * 14); }
    if (k2 > 0) { ctx.globalAlpha = k2; noShadow(ctx); ctx.strokeStyle = EMBER; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(W / 2 - 46, y - 16); ctx.lineTo(W / 2 + 46, y - 16); ctx.moveTo(W / 2 - 46, y + 16); ctx.lineTo(W / 2 + 46, y + 16); ctx.moveTo(W / 2 + 26, y - 50); ctx.lineTo(W / 2 - 26, y + 50); ctx.stroke(); shadowText(ctx, 24); ctx.font = `900 74px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText((shot.neq || [0, 'KNOWING GOD'])[1], W / 2, y + 120 + (1 - k2) * 14); }
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


  // ---------------- idea pill: a dark pill near the bottom naming the idea of the scene (Lintel grammar) ----------------
  C.pill = (ctx, t, shot) => {
    const at = shot.pillBeat && shot.beats[shot.pillBeat] ? shot.beats[shot.pillBeat] - 0.05 : shot.t0 + 0.35;
    const k = eo(pr(t, at, at + 0.35)), out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02), a = k * out; if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 27px ${SANS}`; ctx.letterSpacing = '4px';
    const tw = ctx.measureText(shot.pill).width, pw = tw + 64, ph = 58, x = W / 2, y = H * 0.775;
    ctx.translate(x, y); ctx.scale(0.9 + 0.1 * k, 0.9 + 0.1 * k);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(20,16,13,0.9)'; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill(); noShadow(ctx);
    ctx.strokeStyle = 'rgba(240,196,106,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = PARCH; ctx.fillText(shot.pill, 2, 2);
    ctx.restore();
  };

  // ---------------- bar chart (S08): the Spirit of the LORD on Israel's judges ----------------
  function chart(ctx, t, shot) {
    const out = 1 - pr(t, shot.t1 - 0.15, shot.t1 - 0.01), k0 = eo(pr(t, shot.t0, shot.t0 + 0.3)) * out; if (k0 <= 0) return;
    const D = globalThis.CHART || { title: ['THE SPIRIT OF THE LORD', "ON ISRAEL'S JUDGES"], bars: [['OTHNIEL', 1, '3:10'], ['GIDEON', 1, '6:34'], ['JEPHTHAH', 1, '11:29'], ['SAMSON', 4, '13:25 · 14:6 · 14:19 · 15:14']] };
    ctx.save(); ctx.globalAlpha = k0; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `700 34px ${SERIF}`; ctx.letterSpacing = '4px'; ctx.fillStyle = 'rgba(244,234,213,0.85)';
    D.title.forEach((l, i) => ctx.fillText(l, W / 2, 650 + i * 46));
    const base = 1480, unit = 150, bw = 150, gap = 70, n = D.bars.length, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
    ctx.strokeStyle = 'rgba(244,234,213,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0 - 30, base); ctx.lineTo(x0 + n * bw + (n - 1) * gap + 30, base); ctx.stroke();
    D.bars.forEach(([name, v, ref], i) => {
      const isS = name === 'SAMSON', ts = isS ? shot.t0 + 0.55 : shot.t0 + 0.12 + i * 0.1, kk = eo(pr(t, ts, ts + (isS ? 0.6 : 0.35)));
      const x = x0 + i * (bw + gap), h = v * unit * kk;
      if (isS) { ctx.shadowColor = 'rgba(240,196,106,0.7)'; ctx.shadowBlur = 30 * kk; }
      if (isS && globalThis.CHART_SPLIT) {
        const h3 = Math.min(h, 3 * unit), h1 = Math.max(0, h - 3 * unit);
        ctx.fillStyle = GOLD; ctx.beginPath(); ctx.roundRect(x, base - h3, bw, h3, h1 > 0 ? 0 : [10, 10, 0, 0]); ctx.fill();
        if (h1 > 0) { ctx.fillStyle = '#F6DFA6'; ctx.beginPath(); ctx.roundRect(x, base - h3 - h1, bw, h1, [10, 10, 0, 0]); ctx.fill(); }
        noShadow(ctx);
        ctx.textBaseline = 'middle'; ctx.font = `700 19px ${SANS}`; ctx.letterSpacing = '1px'; ctx.fillStyle = '#2A1E16';
        if (h3 > 90) { ctx.fillText('\u201CRUSHED', x + bw / 2, base - h3 / 2 - 24); ctx.fillText('UPON\u201D', x + bw / 2, base - h3 / 2); ctx.font = `900 30px ${SERIF}`; ctx.fillText('\u00D73', x + bw / 2, base - h3 / 2 + 34); }
        if (h1 > 60) { ctx.font = `700 19px ${SANS}`; ctx.fillText('\u201CSTIRRED\u201D', x + bw / 2, base - h3 - h1 / 2); }
        ctx.textBaseline = 'alphabetic';
      } else if (isS) { ctx.fillStyle = GOLD; ctx.beginPath(); ctx.roundRect(x, base - h, bw, h, [10, 10, 0, 0]); ctx.fill(); noShadow(ctx); }
      else { ctx.fillStyle = 'rgba(244,234,213,0.55)'; ctx.beginPath(); ctx.roundRect(x, base - h, bw, h, [10, 10, 0, 0]); ctx.fill(); noShadow(ctx); }
      if (kk > 0.6) { ctx.globalAlpha = k0 * eo((kk - 0.6) / 0.4); ctx.font = `900 ${isS ? 72 : 56}px ${SERIF}`; ctx.fillStyle = isS ? GOLD : PARCH; ctx.fillText(String(v), x + bw / 2, base - h - 18); ctx.globalAlpha = k0; }
      ctx.font = `700 ${isS ? 28 : 24}px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = isS ? GOLD : 'rgba(244,234,213,0.8)'; ctx.fillText(name, x + bw / 2, base + 46);
      ctx.font = `600 18px ${SANS}`; ctx.letterSpacing = '1px'; ctx.fillStyle = 'rgba(244,234,213,0.55)';
      const refs = String(ref).split(' · '); refs.forEach((r, j) => ctx.fillText(r, x + bw / 2, base + 76 + j * 22));
    });
    ctx.font = `600 20px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillStyle = 'rgba(244,234,213,0.5)';
    ctx.fillText("EVERY \u201CSPIRIT OF THE LORD\u201D VERSE IN JUDGES \u00B7 ESV", W / 2, base + 150);
    ctx.restore();
  }

  // ---------------- two verdict chips (S32) ----------------
  function chips(ctx, t, shot) {
    const out = 1 - pr(t, shot.t1 - 0.2, shot.t1 - 0.02);
    const k1 = eo(pr(t, shot.beats.purpose - 0.1, shot.beats.purpose + 0.3)) * out, k2 = eo(pr(t, shot.beats.verdict - 0.1, shot.beats.verdict + 0.3)) * out;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const chip = (txt, y, kk, good) => {
      if (kk <= 0) return; ctx.globalAlpha = kk;
      ctx.font = `700 36px ${SERIF}`; ctx.letterSpacing = '2px'; const w = ctx.measureText(txt).width + 140;
      ctx.fillStyle = 'rgba(20,16,13,0.9)'; ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y - 46, w, 92, 46); ctx.fill();
      ctx.strokeStyle = good ? GOLD : EMBER; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = good ? GOLD : '#E9B39C'; ctx.fillText(txt, W / 2 + 20, y + 2);
      ctx.lineWidth = 6; ctx.lineCap = 'round'; const ix = W / 2 - w / 2 + 50;
      if (good) { ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.moveTo(ix - 12, y + 2); ctx.lineTo(ix - 2, y + 12); ctx.lineTo(ix + 16, y - 12); ctx.stroke(); }
      else { ctx.strokeStyle = EMBER; ctx.beginPath(); ctx.moveTo(ix - 12, y - 12); ctx.lineTo(ix + 12, y + 12); ctx.moveTo(ix + 12, y - 12); ctx.lineTo(ix - 12, y + 12); ctx.stroke();
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W / 2 - w / 2 + 90, y + 2); ctx.lineTo(W / 2 - w / 2 + 90 + (w - 130) * kk, y + 2); ctx.stroke(); }
    };
    chip("FOR GOD'S PURPOSE", H * 0.72, k1, true); chip('PROOF HE APPROVES', H * 0.79, k2, false);
    ctx.restore();
  }

  // ---------------- CTA (S36): the question, two answer buttons on their words, a comment being typed, end card ----------------
  function cta2(ctx, t, shot) {
    const k = eo(pr(t, shot.t0, shot.t0 + 0.5)), endK = 0;
    const a = k;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (a > 0) {
      ctx.globalAlpha = a; shadowText(ctx, 24); ctx.font = `900 80px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH;
      ctx.fillText('WHICH HIT YOU', W / 2, 560); ctx.fillStyle = GOLD; ctx.fillText('HARDER?', W / 2, 650); noShadow(ctx);
      // two icons, the two moments
      const ic = (x, kk, draw) => { if (kk <= 0) return; ctx.save(); ctx.globalAlpha = a * kk; ctx.translate(x, 930 + (1 - kk) * 20); draw(ctx); ctx.restore(); };
      const kH = eo(pr(t, shot.beats.heb - 0.1, shot.beats.heb + 0.35)), kG = eo(pr(t, shot.beats.god - 0.1, shot.beats.god + 0.35));
      ic(W * 0.29, kH, (c) => { c.fillStyle = '#EADCBC'; c.beginPath(); c.roundRect(-95, -130, 190, 230, 8); c.fill(); c.fillStyle = '#7A5236'; c.beginPath(); c.roundRect(-115, -146, 230, 28, 14); c.fill(); c.beginPath(); c.roundRect(-115, 88, 230, 28, 14); c.fill();
        c.fillStyle = 'rgba(74,52,36,0.45)'; for (let i = 0; i < 6; i++) c.fillRect(-60, -85 + i * 30, 120, 6); c.fillStyle = 'rgba(240,196,106,0.55)'; c.beginPath(); c.roundRect(-78, -12, 156, 34, 17); c.fill(); c.fillStyle = '#8A5A12'; c.font = `900 26px ${SERIF}`; c.textAlign = 'center'; c.fillText('SAMSON', 0, 14); });
      ic(W * 0.71, kG, (c) => { const g = c.createRadialGradient(0, -60, 5, 0, -60, 190); g.addColorStop(0, 'rgba(255,214,140,0.95)'); g.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = g; c.fillRect(-200, -250, 400, 380);
        c.fillStyle = '#8E7C68'; c.fillRect(-82, -110, 40, 210); c.fillRect(42, -110, 40, 210); c.fillStyle = '#5E5044'; c.fillRect(-120, -136, 240, 32); });
      // answer buttons, popping on their words
      const btn = (x, label, kk, fill, ink) => { if (kk <= 0) return; const pop = 1 + 0.18 * Math.pow(1 - kk, 2); ctx.save(); ctx.globalAlpha = a * Math.min(1, kk * 2); ctx.translate(x, 1160); ctx.scale(pop, pop);
        ctx.font = `700 34px ${SANS}`; ctx.letterSpacing = '2px'; const w = ctx.measureText(label).width + 80; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
        ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(-w / 2, -40, w, 80, 40); ctx.fill(); noShadow(ctx); ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.fillText(label, 2, 2); ctx.restore(); };
      btn(W * 0.29, 'HEBREWS 11', kH, '#C99A3E', '#1D1712'); btn(W * 0.71, 'GOD ANSWERED', eo(pr(t, shot.beats.answered - 0.1, shot.beats.answered + 0.3)), '#B5452B', '#FFF1E6');
      // the comment box, typing
      const kc = eo(pr(t, shot.beats.tell - 0.15, shot.beats.tell + 0.25));
      if (kc > 0) {
        ctx.globalAlpha = a * kc; const bx = W / 2, by = 1330, bw2 = 760, bh = 86;
        ctx.fillStyle = 'rgba(244,234,213,0.95)'; ctx.beginPath(); ctx.roundRect(bx - bw2 / 2, by - bh / 2, bw2, bh, bh / 2); ctx.fill();
        ctx.fillStyle = '#B5452B'; ctx.beginPath(); ctx.arc(bx - bw2 / 2 + 46, by, 18, 0, 6.283); ctx.fill();
        const msg = 'Honestly, that God still answered him…', n = Math.max(0, Math.floor((t - (shot.beats.tell + 0.3)) * 16));
        ctx.font = `600 italic 38px ${ITAL}`; ctx.letterSpacing = '0px'; ctx.fillStyle = '#2A1E16'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        const txt = msg.slice(0, Math.min(msg.length, n)); ctx.fillText(txt, bx - bw2 / 2 + 84, by + 2);
        if (Math.floor(t * 2.2) % 2 === 0) { const cw = ctx.measureText(txt).width; ctx.fillRect(bx - bw2 / 2 + 86 + cw, by - 20, 3, 40); }
        ctx.textAlign = 'center';
      }
    }
    if (endK > 0) {
      ctx.globalAlpha = endK; globalThis.TX.mark(ctx, W / 2, H * 0.45, 5.2);
      ctx.font = `700 76px ${SERIF}`; ctx.letterSpacing = '10px'; ctx.fillStyle = PARCH; ctx.fillText('FOURTH WATCH', W / 2, H * 0.45 + 170);
      ctx.font = `600 italic 44px ${ITAL}`; ctx.letterSpacing = '0px'; ctx.fillStyle = GOLD; ctx.fillText('Ask the text.', W / 2, H * 0.45 + 240);
    }
    ctx.restore();
  }



  // ---------------- question (v57): three answers pop on their words, then a comment types out ----------------
  function cta3(ctx, t, shot) {
    const a = eo(pr(t, shot.t0, shot.t0 + 0.5)); if (a <= 0) return;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = a;
    shadowText(ctx, 24); ctx.font = `900 76px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH;
    ctx.fillText('WHAT STANDS OUT', W / 2, 540); ctx.fillStyle = GOLD; ctx.fillText('MORE TO YOU?', W / 2, 628); noShadow(ctx);
    const btn = (y, label, kk, fill, ink) => { if (kk <= 0) return; const pop = 1 + 0.16 * Math.pow(1 - kk, 2); ctx.save(); ctx.globalAlpha = a * Math.min(1, kk * 2); ctx.translate(W / 2, y); ctx.scale(pop, pop);
      ctx.font = `700 40px ${SANS}`; ctx.letterSpacing = '3px'; const w = Math.max(520, ctx.measureText(label).width + 120); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(-w / 2, -48, w, 96, 48); ctx.fill(); noShadow(ctx); ctx.fillStyle = ink; ctx.textBaseline = 'middle'; ctx.fillText(label, 2, 2); ctx.restore(); };
    const kk = (b) => eo(pr(t, shot.beats[b] - 0.1, shot.beats[b] + 0.3));
    btn(800, 'HIS STRENGTH', kk('strength'), '#C99A3E', '#1D1712');
    btn(920, 'HIS FAILURES', kk('failures'), '#B5452B', '#FFF1E6');
    btn(1040, 'HIS PRAYER AT THE END', kk('prayer'), '#EADCBC', '#2A1E16');
    const kc = eo(pr(t, shot.beats.why - 0.15, shot.beats.why + 0.25));
    if (kc > 0) {
      ctx.globalAlpha = a * kc; ctx.font = `700 34px ${SANS}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH; ctx.fillText('TELL US IN THE COMMENTS', W / 2, 1190);
      const bx = W / 2, by = 1280, bw2 = 780, bh = 86;
      ctx.fillStyle = 'rgba(244,234,213,0.95)'; ctx.beginPath(); ctx.roundRect(bx - bw2 / 2, by - bh / 2, bw2, bh, bh / 2); ctx.fill();
      ctx.fillStyle = '#B5452B'; ctx.beginPath(); ctx.arc(bx - bw2 / 2 + 46, by, 18, 0, 6.283); ctx.fill();
      const msg = 'His prayer at the end, because…', n = Math.max(0, Math.floor((t - (shot.beats.why + 0.3)) * 27));
      ctx.font = `600 italic 38px ${ITAL}`; ctx.letterSpacing = '0px'; ctx.fillStyle = '#2A1E16'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const txt = msg.slice(0, Math.min(msg.length, n)); ctx.fillText(txt, bx - bw2 / 2 + 84, by + 2);
      if (Math.floor(t * 2.2) % 2 === 0) { const cw = ctx.measureText(txt).width; ctx.fillRect(bx - bw2 / 2 + 86 + cw, by - 20, 3, 40); }
    }
    ctx.restore();
  }

  // ---------------- numbered points (Lintel grammar): a stamp on the number word over the live scene, which then
  // settles into a chapter pill that stays at the bottom for the whole point ----------------
  const PILL_Y = H * 0.775;
  function chapterPill(ctx, ch, a, sc = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle';
    ctx.font = `600 36px ${SANS}`; ctx.letterSpacing = '0px'; const nw = ctx.measureText(String(ch.n)).width;
    ctx.font = `600 27px ${SANS}`; ctx.letterSpacing = '4px'; const lw = ctx.measureText(ch.label).width;
    const pw = 44 + nw + 30 + lw + 40, ph = 62;
    ctx.translate(W / 2, PILL_Y); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(20,16,13,0.92)'; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 12); ctx.fill(); noShadow(ctx);
    ctx.strokeStyle = 'rgba(240,196,106,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    let x = -pw / 2 + 44; ctx.textAlign = 'left';
    ctx.font = `600 36px ${SANS}`; ctx.letterSpacing = '0px'; ctx.fillStyle = GOLD; ctx.fillText(String(ch.n), x, 2); x += nw + 15;
    ctx.fillStyle = 'rgba(240,196,106,0.55)'; ctx.fillRect(x, -15, 2, 30); x += 15;
    ctx.font = `600 27px ${SANS}`; ctx.letterSpacing = '4px'; ctx.fillStyle = PARCH; ctx.fillText(ch.label, x, 2);
    ctx.restore();
  }
  C.chapter = (ctx, t, shot) => {
    const ch = shot.chapter; if (!ch) return;
    const L = S.VO.lines[ch.line], at = ch.at - 0.06;
    const m0 = Math.min(at + 1.75, L.end + 0.15), m1 = m0 + 0.45;           // stamp holds, then settles into the pill
    const out = 1 - pr(t, ch.end - 0.22, ch.end - 0.02);                      // the pill leaves with the chapter's last shot
    // the pill
    const kp = shot.stamp ? eio(pr(t, m0 + 0.15, m1)) : 1;
    if (shot.chapterPill !== false) chapterPill(ctx, ch, kp * out, 0.94 + 0.06 * kp);
    if (!shot.stamp || t >= m1) return;
    drawStamp(ctx, t, ch, at, eio(pr(t, m0, m1)), 1);
  };
  // "3 TRUTHS" before the points: the same stamp, held, then it fades with its shot
  C.introStamp = (ctx, t, shot) => {
    const ch = shot.intro, at = ch.at - 0.06, fade = 1 - pr(t, shot.t1 - 0.3, shot.t1 - 0.05);
    if (fade > 0) drawStamp(ctx, t, ch, at, 0, fade);
  };
  function drawStamp(ctx, t, ch, at, km, fade) {
    const kin = pr(t, at, at + 0.3); if (kin <= 0) return;
    const pop = 1 + 0.22 * Math.pow(1 - eo(kin), 2);
    const SY = H * 0.36, cy = SY + (PILL_Y - SY) * km, sc = pop * (1 - 0.55 * km);
    ctx.save(); ctx.globalAlpha = Math.min(1, kin * 2.5) * (1 - km) * fade; ctx.textBaseline = 'middle';
    let fs = 44; ctx.font = `700 ${fs}px ${SERIF}`; ctx.letterSpacing = '8px';
    let lw = ctx.measureText(ch.label).width; if (lw > 640) { fs = Math.floor(fs * 640 / lw); ctx.font = `700 ${fs}px ${SERIF}`; lw = ctx.measureText(ch.label).width; }
    ctx.font = `900 230px ${SERIF}`; ctx.letterSpacing = '0px'; const nw = ctx.measureText(String(ch.n)).width;
    const pw = 70 + nw + 44 + lw + 70, ph = 290;
    ctx.translate(W / 2, cy); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(16,13,11,0.64)'; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 18); ctx.fill(); noShadow(ctx);
    ctx.strokeStyle = 'rgba(240,196,106,0.45)'; ctx.lineWidth = 2; ctx.stroke();
    let x = -pw / 2 + 70; ctx.textAlign = 'left';
    // gold light behind the numeral (from the upper left)
    const hg = ctx.createRadialGradient(x + nw * 0.4, -40, 5, x + nw * 0.4, -40, 220); hg.addColorStop(0, 'rgba(240,196,106,0.28)'); hg.addColorStop(1, 'rgba(240,196,106,0)');
    ctx.fillStyle = hg; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.font = `900 230px ${SERIF}`; ctx.fillStyle = GOLD; shadowText(ctx, 20); ctx.fillText(String(ch.n), x, 14); noShadow(ctx); x += nw + 44;
    const kl = eo(pr(t, at + 0.12, at + 0.45));
    ctx.globalAlpha *= kl; ctx.font = `700 ${fs}px ${SERIF}`; ctx.letterSpacing = '8px'; ctx.fillStyle = PARCH; ctx.fillText(ch.label, x + (1 - kl) * 18, 4);
    ctx.restore();
  }

  // ---------------- end card: a hard cut to dark; the mark rises like first light, then the name ----------------
  C.endCard = (ctx, t) => {
    const e = t - S.END_T;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0E0B09'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.44, s = 7.2, glowK = eo(pr(e, 0.2, 1.2));
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 520); g.addColorStop(0, `rgba(240,196,106,${(0.13 * glowK).toFixed(3)})`); g.addColorStop(1, 'rgba(240,196,106,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.translate(cx, cy); ctx.scale(s, s); ctx.strokeStyle = GOLD; ctx.fillStyle = GOLD; ctx.lineCap = 'round';
    const kh = eio(pr(e, 0.0, 0.35)), ks = eo(pr(e, 0.12, 0.85)), kw = eo(pr(e, 0.3, 0.75)), kr = eo(pr(e, 0.6, 1.05));
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-17 * kh, 4); ctx.lineTo(17 * kh, 4); ctx.stroke();               // the horizon draws out
    ctx.save(); ctx.beginPath(); ctx.rect(-30, -40, 60, 42.7); ctx.clip();                                               // the sun rises above it
    ctx.beginPath(); ctx.arc(0, 2 + 13 * (1 - ks), 11, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.globalAlpha = kw; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 10); ctx.quadraticCurveTo(-6, 7, 0, 10); ctx.quadraticCurveTo(6, 13, 12, 10); ctx.stroke();
    [-2.4, -1.95, -1.57, -1.2, -0.75].forEach((a, i) => { const k = eo(pr(e, 0.6 + i * 0.06, 0.95 + i * 0.06)); if (k <= 0) return; ctx.globalAlpha = k; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 15, 2 + Math.sin(a) * 15); ctx.lineTo(Math.cos(a) * (15 + 4 * k), 2 + Math.sin(a) * (15 + 4 * k)); ctx.stroke(); });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const kn = eo(pr(e, 0.75, 1.3)); ctx.globalAlpha = kn;
    ctx.font = `700 78px ${SERIF}`; ctx.letterSpacing = '12px'; ctx.fillStyle = PARCH; ctx.fillText('FOURTH WATCH', cx + 6, cy + 210 + (1 - kn) * 14);
    ctx.globalAlpha = kn * 0.8; ctx.strokeStyle = 'rgba(240,196,106,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 60 * kn, cy + 252); ctx.lineTo(cx + 60 * kn, cy + 252); ctx.stroke();
    const kt = eo(pr(e, 1.05, 1.6)); ctx.globalAlpha = kt;
    ctx.font = `600 italic 46px ${ITAL}`; ctx.letterSpacing = '0px'; ctx.fillStyle = GOLD; ctx.fillText('Ask the text.', cx, cy + 320);
    ctx.restore();
  };

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
      case 'cta': return cta3(ctx, t, shot);
      case 'chart': return chart(ctx, t, shot);
      case 'chips': return chips(ctx, t, shot);
      default: return null;
    }
  };
})();
