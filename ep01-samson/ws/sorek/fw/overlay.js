// Fourth Watch screen layer (2D, fixed to the screen, never moves with the camera):
// series tag, episode tag, hook title, captions, verse cards, callout tags, big number, timeline, end card.
(function () {
  const FW = globalThis.FW, P = FW.PAL;
  const O = (FW.O = {});
  const W = 1080, H = 1920;
  const SERIF = '"Cinzel"', ITAL = '"Cormorant Garamond"', SANS = '"Inter"';
  const clamp = FW.clamp;

  function spaced(ctx, text, x, y, spacing, align = 'left') {
    // letter-spaced text (canvas letterSpacing when available)
    if ('letterSpacing' in ctx) { ctx.letterSpacing = spacing + 'px'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.letterSpacing = '0px'; return ctx.measureText(text).width; }
    ctx.textAlign = align; ctx.fillText(text, x, y); return ctx.measureText(text).width;
  }
  O.spaced = spaced;

  // the series mark: a small lamp flame over a crescent (the fourth watch: the last hours before dawn)
  O.mark = (ctx, x, y, s = 1, col = P.gold) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = col; ctx.strokeStyle = col;
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.bezierCurveTo(9, -9, 8, 0, 0, 4); ctx.bezierCurveTo(-8, 0, -9, -9, 0, -20); ctx.fill(); // flame
    ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 4, 13, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); // bowl / crescent
    ctx.restore();
  };

  O.seriesTag = (ctx, a = 1, series = 'ASK THE TEXT', brand = 'FOURTH WATCH') => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 12;
    O.mark(ctx, 86, 168, 1.15);
    ctx.font = `700 30px ${SERIF}`; ctx.fillStyle = P.parchment; ctx.textBaseline = 'alphabetic';
    spaced(ctx, brand, 116, 178, 4);
    ctx.font = `700 26px ${SERIF}`; ctx.fillStyle = P.gold;
    const w = spaced(ctx, series, W - 66, 178, 4, 'right');
    ctx.fillStyle = 'rgba(227,178,92,0.7)'; ctx.fillRect(W - 66 - w, 190, w, 2);
    ctx.restore();
  };

  // the hook title, fully drawn at t = 0 (no fade-in)
  O.title = (ctx, text, a = 1, y = 560) => {
    if (a <= 0) return;
    const words = text.split(' ');
    // two balanced lines
    let best = [text], bestD = 1e9;
    for (let i = 1; i < words.length; i++) { const l1 = words.slice(0, i).join(' '), l2 = words.slice(i).join(' '); const d = Math.abs(l1.length - l2.length); if (d < bestD) { bestD = d; best = [l1, l2]; } }
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
    { ctx.save(); ctx.filter = 'blur(40px)'; ctx.fillStyle = 'rgba(10,6,16,0.45)'; ctx.beginPath(); ctx.ellipse(W / 2, y + 10, 520, 170, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    let size = 96; ctx.font = `900 ${size}px ${SERIF}`;
    while (Math.max(...best.map((l) => ctx.measureText(l).width)) > 900 && size > 60) { size -= 4; ctx.font = `900 ${size}px ${SERIF}`; }
    const lh = size * 1.12;
    best.forEach((line, li) => {
      const yy = y + li * lh; const lw = ctx.measureText(line).width; let x = W / 2 - lw / 2;
      for (const w of line.split(' ')) {
        const key = /STRENGTH/i.test(w);
        ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 24; ctx.fillStyle = key ? P.gold : P.parchment;
        ctx.textAlign = 'left'; ctx.fillText(w, x, yy); x += ctx.measureText(w + ' ').width;
      }
    });
    ctx.restore();
  };

  // captions: the current chunk, key word gold, a soft pop on arrival
  O.captions = (ctx, VO, t, hidden) => {
    const c = VO.captions.find((k) => t >= k.s - 0.03 && t < k.e);
    if (!c || hidden(c, t)) return;
    const age = t - c.s, a = clamp(age / 0.08 + 0.4), sc = 0.96 + 0.04 * FW.ease.out(clamp(age / 0.12));
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
    ctx.font = `600 62px ${SANS}`;
    const y = 1268, CX = 500, sp = ctx.measureText(' ').width;
    const widths = c.words.map((w) => ctx.measureText(w).width), total = widths.reduce((s, x) => s + x, 0) + sp * (c.words.length - 1);
    let size = 62; if (total > 820) { size = Math.floor((62 * 820) / total); ctx.font = `600 ${size}px ${SANS}`; }
    const k = size / 62, tw = total * k;
    // how bright is the picture under the caption? (brighter -> darker scrim)
    let lum = 0.3;
    try { const cs = ctx.canvas.width / W, px = ctx.getImageData(Math.round((CX - tw / 2) * cs), Math.round((y - size) * cs), Math.max(1, Math.round(tw * cs)), Math.max(1, Math.round(size * 1.3 * cs))).data; let sum = 0, n = 0; for (let i = 0; i < px.length; i += 16) { sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]; n++; } lum = sum / n / 255; } catch (e) {}
    const sa = clamp(0.5 + (lum - 0.25) * 1.2, 0.5, 0.88);
    ctx.translate(CX, y); ctx.scale(sc, sc); ctx.translate(-CX, -y);
    let x = CX - tw / 2;
    // soft feathered scrim so captions read over bright skies, lamps and beams
    ctx.save(); ctx.filter = 'blur(22px)'; ctx.fillStyle = `rgba(10,8,18,${sa.toFixed(3)})`;
    const pw = tw + 100, ph = size * 1.6;
    ctx.beginPath(); ctx.roundRect(CX - pw / 2, y - size * 1.08, pw, ph, ph / 2); ctx.fill(); ctx.restore();
    c.words.forEach((w, i) => {
      ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
      ctx.textAlign = 'left';
      ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(12,8,16,0.45)'; ctx.strokeText(w, x, y);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = i === c.key ? '#F0BE5E' : '#FBF5EA'; ctx.fillText(w, x, y);
      x += widths[i] * k + sp * k;
    });
    ctx.restore();
  };

  // wrap text into lines that fit maxW with the current font
  O.wrap = (ctx, words, maxW) => {
    const lines = []; let cur = [];
    for (const w of words) { const test = [...cur, w].join(' '); if (ctx.measureText(test).width > maxW && cur.length) { lines.push(cur); cur = [w]; } else cur.push(w); }
    if (cur.length) lines.push(cur); return lines;
  };

  // verse card: night-blue panel, gold rules, Cormorant italic; words brighten as they are read
  O.verseCard = (ctx, card, line, t, a, keyRe) => {
    if (a <= 0 || !card) return;
    ctx.save();
    ctx.globalAlpha = a * 0.42; ctx.fillStyle = '#05070C'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = a;
    const rise = (1 - FW.ease.out(a)) * 26;
    const x0 = 92, x1 = W - 92, cw = x1 - x0;
    ctx.font = `600 italic 66px ${ITAL}`;
    const raw = card.text.replace(/^["“]|["”]$/g, '');
    const words = raw.split(/\s+/);
    const lines = O.wrap(ctx, words, cw - 120);
    const lh = 80, th = lines.length * lh;
    const top = 760 - th / 2 - 90 + rise, bot = 760 + th / 2 + 120 + rise;
    // panel
    const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'rgba(20,28,46,0.94)'); g.addColorStop(1, 'rgba(12,16,28,0.96)');
    ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.fillRect(x0, top, cw, bot - top); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(227,178,92,0.75)'; ctx.lineWidth = 2; ctx.strokeRect(x0 + 16, top + 16, cw - 32, bot - top - 32);
    // header mark
    O.mark(ctx, W / 2, top + 64, 0.9);
    // text with per-word read highlight
    const spoken = line ? line.words : [];
    let wi = 0;
    lines.forEach((ln, li) => {
      const y = top + 140 + li * lh;
      const lw = ctx.measureText(ln.join(' ')).width; let x = W / 2 - lw / 2;
      for (const w of ln) {
        const sw = spoken[Math.min(spoken.length - 1, wi + (spoken.length - words.length))];
        const lit = sw ? clamp((t - sw.s + 0.05) / 0.18) : 1;
        const key = keyRe && keyRe.test(w.replace(/[^A-Za-z]/g, ''));
        ctx.fillStyle = key ? P.gold : P.parchment;
        ctx.globalAlpha = a * (0.42 + 0.58 * lit);
        if (key && lit > 0.5) { ctx.shadowColor = 'rgba(227,178,92,0.6)'; ctx.shadowBlur = 18 * lit; } else ctx.shadowBlur = 0;
        ctx.textAlign = 'left'; ctx.fillText(w, x, y); x += ctx.measureText(w + ' ').width; wi++;
      }
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = a;
    ctx.font = `700 28px ${SERIF}`; ctx.fillStyle = P.gold;
    spaced(ctx, `${card.ref} · ESV`, W / 2, bot - 52, 4, 'center');
    ctx.restore();
  };

  // callout tag pinned to a screen point (sx, sy): dark pill, gold hairline, Cinzel caps
  O.tag = (ctx, text, sx, sy, a = 1, { side = 'right', dy = -90, size = 32 } = {}) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(a);
    ctx.font = `700 ${size}px ${SERIF}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    if (ctx.measureText(text).width > W - 220 && text.includes(' · ')) { // two lines: what + where
      const i = text.lastIndexOf(' · '), l1 = text.slice(0, i), l2 = text.slice(i + 3);
      const w1 = ctx.measureText(l1).width; ctx.font = `700 ${size - 6}px ${SERIF}`; const w2 = ctx.measureText(l2).width; ctx.font = `700 ${size}px ${SERIF}`;
      const pw = Math.max(w1, w2) + 40, ph = size * 2 + 34;
      let bx = side === 'right' ? sx + 24 : side === 'left' ? sx - 24 - pw : sx - pw / 2, by = sy + dy - ph / 2;
      bx = clamp(bx, 64, W - 64 - pw - (by > H * 0.45 ? 90 : 0)); by = clamp(by, 300, 1500 - ph);
      ctx.strokeStyle = 'rgba(227,178,92,0.8)'; ctx.lineWidth = 2;
      const ax = clamp(sx, bx, bx + pw); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ax, by + ph > sy ? by : by + ph); ctx.stroke();
      ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(16,12,9,0.88)'; ctx.fillRect(bx, by, pw, ph);
      ctx.strokeStyle = 'rgba(227,178,92,0.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.75, by + 0.75, pw - 1.5, ph - 1.5);
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillStyle = P.parchment; ctx.fillText(l1, bx + 20, by + 17 + size / 2);
      ctx.font = `700 ${size - 6}px ${SERIF}`; ctx.fillStyle = P.gold; ctx.fillText(l2, bx + 20, by + ph - 17 - (size - 6) / 2);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.restore(); return;
    }
    const tw = ctx.measureText(text).width;
    const pw = tw + 40, ph = size + 28;
    let bx = side === 'right' ? sx + 24 : side === 'left' ? sx - 24 - pw : sx - pw / 2, by = sy + dy - ph / 2;
    bx = clamp(bx, 64, W - 64 - pw - (by > H * 0.45 ? 90 : 0)); by = clamp(by, 300, 1500 - ph);
    // leader line
    ctx.strokeStyle = 'rgba(227,178,92,0.8)'; ctx.lineWidth = 2;
    const ax = clamp(sx, bx, bx + pw), ay = by + ph;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ax, ay > sy ? by : ay); ctx.stroke();
    ctx.fillStyle = P.gold; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(16,12,9,0.86)'; ctx.fillRect(bx, by, pw, ph);
    ctx.strokeStyle = 'rgba(227,178,92,0.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.75, by + 0.75, pw - 1.5, ph - 1.5);
    ctx.fillStyle = P.parchment; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(text, bx + 18, by + ph / 2 + 1);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
  };

  // a small reference chip without a leader (e.g. JUDGES 16:30)
  O.ref = (ctx, text, x, y, a = 1, align = 'left') => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.font = `700 32px ${SERIF}`; ctx.textBaseline = 'middle';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
    const tw = ctx.measureText(text).width, pw = tw + 36, ph = 58;
    const bx = align === 'left' ? x : align === 'right' ? x - pw : x - pw / 2;
    ctx.fillStyle = 'rgba(16,12,9,0.8)'; ctx.fillRect(bx, y - ph / 2, pw, ph);
    ctx.fillStyle = P.gold; ctx.fillRect(bx, y - ph / 2, 4, ph);
    ctx.fillStyle = P.parchment; ctx.textAlign = 'left'; ctx.fillText(text, bx + 17, y + 1);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.restore();
  };

  O.bigNumber = (ctx, n, a, y = 520) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.font = `900 210px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(227,178,92,0.55)'; ctx.shadowBlur = 40; ctx.fillStyle = P.gold;
    ctx.fillText(n.toLocaleString('en-US'), W / 2, y);
    ctx.shadowBlur = 0; ctx.font = `700 36px ${SERIF}`;
    { const tw = 470; ctx.fillStyle = 'rgba(16,12,9,0.8)'; ctx.fillRect(W / 2 - tw / 2, y + 26, tw, 56); ctx.fillStyle = P.gold; ctx.fillRect(W / 2 - tw / 2, y + 26, 4, 56); }
    ctx.fillStyle = P.parchment; ctx.textBaseline = 'middle'; spaced(ctx, 'MEN · JUDGES 15:15', W / 2, y + 55, 5, 'center'); ctx.textBaseline = 'alphabetic';
    ctx.restore();
  };

  // timeline: markers [{label, sub, x(0..1), on(0..1), gold}] and an empty slot
  O.timeline = (ctx, marks, a, y = 640, draw = 1) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const x0 = 150, x1 = W - 150;
    { const g = ctx.createLinearGradient(0, y - 190, 0, y + 190); g.addColorStop(0, 'rgba(6,6,14,0)'); g.addColorStop(0.3, 'rgba(6,6,14,0.42)'); g.addColorStop(0.7, 'rgba(6,6,14,0.42)'); g.addColorStop(1, 'rgba(6,6,14,0)'); ctx.fillStyle = g; ctx.fillRect(0, y - 190, W, 380); }
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(242,230,207,0.85)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(FW.lerp(x0, x1, draw), y); ctx.stroke();
    // arrow head
    if (draw > 0.98) { ctx.beginPath(); ctx.moveTo(x1 + 10, y); ctx.lineTo(x1 - 16, y - 16); ctx.lineTo(x1 - 16, y + 16); ctx.closePath(); ctx.fillStyle = 'rgba(242,230,207,0.85)'; ctx.fill(); }
    for (const m of marks) {
      const x = FW.lerp(x0, x1, m.x), on = clamp(m.on);
      ctx.globalAlpha = a;
      ctx.strokeStyle = m.gold ? P.gold : 'rgba(242,230,207,0.9)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
      if (m.label && on <= 0) { ctx.globalAlpha = a * 0.75; ctx.font = `900 46px ${SERIF}`; ctx.fillStyle = P.parchment; ctx.textBaseline = 'alphabetic'; spaced(ctx, m.label, x, y - 50, 3, 'center'); ctx.font = `700 28px ${SERIF}`; m.sub.split(' · ').forEach((sl, si) => spaced(ctx, sl, x, y + 66 + si * 36, 2, 'center')); ctx.globalAlpha = a; }
      if (on > 0) {
        ctx.globalAlpha = a * on; ctx.fillStyle = m.gold ? P.gold : P.parchment;
        ctx.beginPath(); ctx.arc(x, y, 20 * FW.ease.outBack(on), 0, Math.PI * 2); ctx.fill();
        ctx.font = `900 46px ${SERIF}`; ctx.fillStyle = m.gold ? P.gold : P.parchment; ctx.textBaseline = 'alphabetic';
        spaced(ctx, m.label, x, y - 50, 3, 'center');
        ctx.font = `700 33px ${SERIF}`; ctx.fillStyle = 'rgba(250,240,220,1)';
        m.sub.split(' · ').forEach((sl, si) => spaced(ctx, sl, x, y + 70 + si * 40, 1.5, 'center'));
      } else if (m.empty) {
        ctx.font = `900 52px ${SERIF}`; ctx.fillStyle = 'rgba(242,230,207,0.7)'; ctx.textBaseline = 'alphabetic';
        spaced(ctx, '?', x, y - 50, 2, 'center');
        if (m.sub) { ctx.font = `700 28px ${SERIF}`; ctx.fillStyle = 'rgba(242,230,207,0.8)'; m.sub.split(' · ').forEach((sl, si) => spaced(ctx, sl, x - 40, y + 66 + si * 36, 2, 'center')); }
      }
    }
    ctx.restore();
  };

  O.endCard = (ctx, a) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(8,6,12,0.86)'); g.addColorStop(0.55, 'rgba(8,6,12,0.93)'); g.addColorStop(1, 'rgba(8,6,12,0.8)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = ctx.createRadialGradient(W / 2, 860, 20, W / 2, 860, 520); r.addColorStop(0, 'rgba(227,178,92,0.10)'); r.addColorStop(1, 'rgba(227,178,92,0)'); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H); }
    O.mark(ctx, 500, 600, 3.2);
    ctx.font = `900 74px ${SERIF}`; ctx.fillStyle = P.parchment; ctx.textBaseline = 'alphabetic';
    spaced(ctx, 'FOURTH WATCH', 500, 770, 8, 'center');
    ctx.fillStyle = P.gold; ctx.fillRect(500 - 120, 806, 240, 3);
    ctx.font = `600 italic 54px ${ITAL}`; ctx.fillStyle = 'rgba(242,230,207,0.95)';
    ctx.textAlign = 'center'; ctx.fillText('Read it for yourself:', 500, 890); ctx.fillStyle = P.gold; ctx.fillText('Judges 13–16', 500, 956);
    ctx.restore();
  };
})();
