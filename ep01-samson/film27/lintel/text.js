// Screen text for the Lintel-grade look, in Fourth Watch's own voice: a header row (our mark + series,
// topic on the right) with a hairline, the title, narration that builds word by word in italic serif with
// key words in gold caps, and name-tag pills on leader lines. Text is fixed to the screen.
(function () {
  const TX = (globalThis.TX = {});
  const SERIF = '"Cinzel"', ITAL = '"Cormorant Garamond"', SANS = '"Inter"';
  const PARCH = '#F4EAD5', GOLD = '#F0C46A', NIGHT = '#14100D';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const eo = (x) => 1 - Math.pow(1 - clamp(x), 3);

  TX.mark = (ctx, x, y, s = 1, col = GOLD) => { // a dawn over the water: a half sun on a horizon line, four wave strokes
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0, 2, 11, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-17, 4); ctx.lineTo(17, 4); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 10); ctx.quadraticCurveTo(-6, 7, 0, 10); ctx.quadraticCurveTo(6, 13, 12, 10); ctx.stroke();
    for (const a of [-2.4, -1.95, -1.57, -1.2, -0.75]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 15, 2 + Math.sin(a) * 15); ctx.lineTo(Math.cos(a) * 19, 2 + Math.sin(a) * 19); ctx.stroke(); }
    ctx.restore();
  };

  TX.header = (ctx, W, a = 1, o = {}) => {
    if (a <= 0) return;
    const y = o.y ?? 172;
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(8,8,20,0.45)'; ctx.shadowBlur = 10;
    TX.mark(ctx, 84, y - 12, 1.05);
    ctx.font = `700 25px ${SERIF}`; ctx.letterSpacing = '3px'; ctx.fillStyle = PARCH; ctx.textAlign = 'left';
    ctx.fillText('FOURTH WATCH', 116, y);
    const w1 = ctx.measureText('FOURTH WATCH').width;
    ctx.fillStyle = GOLD; ctx.fillText(o.series || 'ASK THE TEXT', 116 + w1 + 22, y);
    ctx.fillStyle = 'rgba(240,196,106,0.9)'; ctx.beginPath(); ctx.arc(116 + w1 + 11, y - 9, 2.6, 0, 6.283); ctx.fill();
    ctx.textAlign = 'right'; ctx.fillStyle = PARCH; ctx.fillText(o.topic || 'SAMSON', W - 64, y);
    ctx.shadowBlur = 0; ctx.letterSpacing = '0px';
    ctx.strokeStyle = 'rgba(244,234,213,0.42)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(64, y + 22); ctx.lineTo(W - 64, y + 22); ctx.stroke();
    ctx.restore();
  };

  // title: Cinzel caps, gold key word, centred; lines = [['WHY GIVE SAMSON'], ['THAT', 'STRENGTH?*']] (* = gold)
  TX.title = (ctx, W, lines, a = 1, y = 300, size = 80) => {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic'; ctx.font = `900 ${size}px ${SERIF}`; ctx.letterSpacing = '2px';
    ctx.shadowColor = 'rgba(6,6,18,0.6)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 3;
    lines.forEach((words, li) => {
      const ws = words.map((w) => w.replace('*', ''));
      const sp = ctx.measureText(' ').width, widths = ws.map((w) => ctx.measureText(w).width);
      const tot = widths.reduce((p, q) => p + q, 0) + sp * (ws.length - 1);
      let x = W / 2 - tot / 2;
      ws.forEach((w, i) => { ctx.fillStyle = words[i].endsWith('*') ? GOLD : PARCH; ctx.textAlign = 'left'; ctx.fillText(w, x, y + li * size * 1.06); x += widths[i] + sp; });
    });
    ctx.restore();
  };

  // narration: words [{w, s}] appear as spoken; keys = set of word indices drawn as gold caps
  TX.narration = (ctx, W, words, t, o = {}) => {
    const size = o.size ?? 50, keySize = Math.round(size * 0.8), y0 = o.y ?? 500, lh = o.lh ?? size * 1.18, breaks = o.breaks || [], keys = o.keys || new Set(), a0 = o.a ?? 1;
    if (a0 <= 0) return;
    ctx.save(); ctx.textBaseline = 'alphabetic';
    const fontW = (i) => (keys.has(i) ? `700 ${keySize}px ${SERIF}` : `600 italic ${size}px ${ITAL}`);
    const txt = (i) => (keys.has(i) ? words[i].w.toUpperCase() : words[i].w);
    // lay out lines
    const lines = []; let cur = [];
    words.forEach((w, i) => { if (breaks.includes(i) && cur.length) { lines.push(cur); cur = []; } cur.push(i); });
    if (cur.length) lines.push(cur);
    ctx.shadowColor = 'rgba(6,6,18,0.7)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 2;
    lines.forEach((ln, li) => {
      const ws = ln.map((i) => { ctx.font = fontW(i); ctx.letterSpacing = keys.has(i) ? '1.5px' : '0px'; return ctx.measureText(txt(i)).width; });
      ctx.font = `600 italic ${size}px ${ITAL}`; const sp = ctx.measureText(' ').width * 1.05;
      const tot = ws.reduce((p, q) => p + q, 0) + sp * (ln.length - 1);
      let x = W / 2 - tot / 2; const y = y0 + li * lh;
      ln.forEach((i, k) => {
        const w = words[i], ap = eo((t - w.s + 0.06) / 0.2) * a0;
        if (ap > 0) {
          ctx.globalAlpha = ap; ctx.font = fontW(i); ctx.letterSpacing = keys.has(i) ? '1.5px' : '0px';
          ctx.fillStyle = keys.has(i) ? GOLD : PARCH; ctx.textAlign = 'left';
          ctx.fillText(txt(i), x, y + (1 - ap) * 10 - (keys.has(i) ? 1 : 0));
        }
        x += ws[k] + sp;
      });
    });
    ctx.restore();
  };

  // name tag: a dark pill above (or beside) the anchor, joined to it by a thin leader line with a dot
  TX.tag = (ctx, text, ax, ay, k, o = {}) => {
    if (k <= 0) return;
    const dy = o.dy ?? -120, dx = o.dx ?? 0, sub = o.sub;
    const line = eo(k / 0.5), pop = eo((k - 0.25) / 0.5);
    const px = ax + dx, py = ay + dy;
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 3) * (o.a ?? 1);
    ctx.strokeStyle = 'rgba(244,234,213,0.95)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (px - ax) * line, ay + (py - ay) * line); ctx.stroke();
    ctx.fillStyle = PARCH; ctx.beginPath(); ctx.arc(ax, ay, 5.5, 0, 6.283); ctx.fill();
    if (pop > 0) {
      ctx.font = `600 27px ${SANS}`; ctx.letterSpacing = '3px';
      const tw = ctx.measureText(text).width; let sw = 0;
      if (sub) { ctx.font = `700 21px ${SERIF}`; ctx.letterSpacing = '2px'; sw = ctx.measureText(sub).width; }
      const pw = Math.max(tw, sw) + 44, ph = sub ? 82 : 52;
      ctx.translate(px, py - ph / 2); ctx.scale(0.85 + 0.15 * pop, 0.85 + 0.15 * pop); ctx.globalAlpha *= pop;
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      ctx.fillStyle = 'rgba(20,16,13,0.9)'; ctx.beginPath(); ctx.roundRect(-pw / 2, -ph / 2, pw, ph, 26); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(240,196,106,0.55)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `600 27px ${SANS}`; ctx.letterSpacing = '3px'; ctx.fillStyle = PARCH; ctx.fillText(text, 1.5, sub ? -13 : 1);
      if (sub) { ctx.font = `700 21px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = GOLD; ctx.fillText(sub, 1, 18); }
    }
    ctx.restore();
  };
})();
