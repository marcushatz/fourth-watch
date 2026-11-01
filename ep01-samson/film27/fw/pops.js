// POPS: the pop-up layer (ENGINE_ROADMAP.md step 5). Marcus, Nov 1: today's reels keep something popping on screen,
// "we don't want to overdo it". So the limits are code, not advice: a governor drops what would crowd the frame.
//   shot.pops = [{ at: 'beat' | seconds, kind: 'label' | 'number' | 'ring' | 'arrow' | 'icon', text, icon, on, dur, side }]
//     on:   an actor id (the scene returns r.anchors = { id: [x, y, z] }), a world point [x, y, z], or { sx, sy } (frame fractions)
//     icon: 'bow' | 'tent' | 'bowl' | 'scroll' | 'crown' | 'x' | 'check' | 'q'
// Governor: one pop at a time; starts >= GOV.gap s apart; <= GOV.per10 in any 10 s; anchored inside GOV.yMin..yMax of the
// frame height (clear of the caption band and the bottom safe area). Dropped pops are logged once. Pure function of t.
(function () {
  const D = globalThis.DIRECT;
  const SERIF = '"Cinzel"', PARCH = '#F4EAD5', GOLD = '#F0C46A', INK = '#14100D';
  const GOV = { gap: 1.4, per10: 5, yMin: 0.3, yMax: 0.78, xPad: 70 };
  const cache = new WeakMap();
  function schedule(shot) {
    if (cache.has(shot)) return cache.get(shot);
    const list = (shot.pops || []).map((p) => Object.assign({ t0: typeof p.at === 'number' ? p.at : D.beat(shot, p.at, shot.t0) }, p)).sort((a, b) => a.t0 - b.t0);
    const kept = [], dropped = [];
    for (const p of list) {
      const last = kept[kept.length - 1];
      const in10 = kept.filter((k) => p.t0 - k.t0 < 10).length;
      if ((last && p.t0 - last.t0 < GOV.gap) || in10 >= GOV.per10) dropped.push(p); else kept.push(p);
    }
    kept.forEach((p, i) => { const next = kept[i + 1]; p.t1 = Math.min(p.t0 + (p.dur ?? 1.8), next ? next.t0 - 0.08 : Infinity, shot.t1); });
    if (dropped.length) console.warn(`POPS ${shot.id}: governor dropped ${dropped.length} pop(s) (gap ${GOV.gap} s, max ${GOV.per10}/10 s):`, dropped.map((p) => p.text || p.icon || p.kind).join(', '));
    cache.set(shot, kept); return kept;
  }
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const ICON = {
    bow(c) { c.beginPath(); c.arc(-6, 0, 30, -1.2, 1.2); c.stroke(); c.beginPath(); c.moveTo(5, -28); c.lineTo(5, 28); c.stroke(); c.beginPath(); c.moveTo(-26, 0); c.lineTo(30, 0); c.stroke(); c.beginPath(); c.moveTo(30, 0); c.lineTo(20, -7); c.moveTo(30, 0); c.lineTo(20, 7); c.stroke(); },
    tent(c) { c.beginPath(); c.moveTo(-30, 22); c.lineTo(0, -26); c.lineTo(30, 22); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-8, 22); c.lineTo(0, 6); c.lineTo(8, 22); c.stroke(); },
    bowl(c) { c.beginPath(); c.arc(0, 2, 28, 0, Math.PI); c.closePath(); c.stroke(); for (const x of [-12, 0, 12]) { c.beginPath(); c.moveTo(x, -6); c.bezierCurveTo(x - 7, -14, x + 7, -20, x, -28); c.stroke(); } },
    scroll(c) { rr(c, -24, -18, 48, 36, 6); c.stroke(); c.beginPath(); c.arc(-24, 0, 8, Math.PI / 2, -Math.PI / 2); c.arc(24, 0, 8, -Math.PI / 2, Math.PI / 2); c.stroke(); for (const y of [-6, 4]) { c.beginPath(); c.moveTo(-12, y); c.lineTo(12, y); c.stroke(); } },
    crown(c) { c.beginPath(); c.moveTo(-28, 18); c.lineTo(-28, -10); c.lineTo(-14, 4); c.lineTo(0, -20); c.lineTo(14, 4); c.lineTo(28, -10); c.lineTo(28, 18); c.closePath(); c.stroke(); },
    x(c) { c.beginPath(); c.moveTo(-20, -20); c.lineTo(20, 20); c.moveTo(20, -20); c.lineTo(-20, 20); c.stroke(); },
    check(c) { c.beginPath(); c.moveTo(-22, 2); c.lineTo(-6, 18); c.lineTo(24, -16); c.stroke(); },
    q(c) { c.font = `900 56px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = GOLD; c.fillText('?', 0, 4); },
  };
  function anchor(p, r, P, W, H) {
    let x, y;
    if (p.on && typeof p.on === 'object' && !Array.isArray(p.on)) { x = p.on.sx * W; y = p.on.sy * H; }
    else { const w = Array.isArray(p.on) ? p.on : (r.anchors && r.anchors[p.on]); if (!w) return null; [x, y] = P(w); }
    return [Math.max(GOV.xPad, Math.min(W - GOV.xPad, x)), y];
  }
  const clampY = (y, H) => Math.max(GOV.yMin * H, Math.min(GOV.yMax * H, y));
  function draw(ctx, t, shot, r, P, W, H) {
    for (const p of schedule(shot)) {
      if (t < p.t0 || t >= p.t1) continue;
      const a = anchor(p, r, P, W, H); if (!a) continue;
      const s = Math.max(0, D.act(t, p.t0, { pre: 0, dip: 0, rise: 0.2, over: 0.14, settle: 0.18 }).k);
      const fade = Math.min(1, (p.t1 - t) / 0.2, (t - p.t0) / 0.06);
      ctx.save(); ctx.globalAlpha = Math.max(0, fade);
      const side = p.side || 'up', [ax, ay] = a;
      let bx = side === 'left' ? ax - 150 : side === 'right' ? ax + 150 : ax; const by = clampY(side === 'up' ? ay - 120 : ay, H);
      ctx.font = `700 ${p.kind === 'label' ? 38 : 28}px ${SERIF}`; ctx.letterSpacing = '2px';
      const half = p.kind === 'label' ? (ctx.measureText(p.text || '').width + 60) / 2 : p.text ? Math.max(70, ctx.measureText(p.text).width / 2 + 10) : 70;
      bx = Math.max(half + 24, Math.min(W - half - 24, bx));   // the whole pop stays inside the frame
      if (p.kind === 'ring') {
        ctx.strokeStyle = GOLD; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(ax, clampY(ay, H), 78 * (0.6 + 0.4 * s), 0, Math.PI * 2); ctx.stroke();
      } else if (p.kind === 'arrow') {
        const fx = bx + (side === 'left' ? -60 : 60), fy = by - 90, e = Math.min(1, s);
        const tx = fx + (ax - fx) * e, ty = fy + (clampY(ay, H) - 40 - fy) * e;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx, ty, tx, ty); ctx.stroke();
        const ang = Math.atan2(ty - fy, tx - fx) * 0 + (tx > fx ? 0 : Math.PI); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx - 22 * Math.cos(ang - 0.5), ty - 22 * Math.sin(ang - 0.5)); ctx.moveTo(tx, ty); ctx.lineTo(tx - 22 * Math.cos(ang + 0.5), ty - 22 * Math.sin(ang + 0.5)); ctx.stroke();
      } else {
        ctx.translate(bx, by); ctx.scale(s, s);
        if (side === 'up' && p.kind !== 'number') { ctx.strokeStyle = 'rgba(240,196,106,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(0, Math.max(40, (clampY(ay, H) - by) / Math.max(0.01, s) - 10)); ctx.stroke(); }
        if (p.kind === 'label') {
          ctx.font = `700 38px ${SERIF}`; ctx.letterSpacing = '2px'; const w = ctx.measureText(p.text).width + 60;
          ctx.fillStyle = 'rgba(20,16,13,0.86)'; rr(ctx, -w / 2, -34, w, 68, 34); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.fillStyle = PARCH; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text, 0, 2);
        } else if (p.kind === 'number') {
          ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = INK; ctx.font = `900 58px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(p.text), 0, 4);
        } else if (p.kind === 'icon') {
          ctx.fillStyle = 'rgba(20,16,13,0.86)'; ctx.beginPath(); ctx.arc(0, 0, 66, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.stroke();
          ctx.save(); ctx.scale(1.25, 1.25); ctx.strokeStyle = PARCH; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; (ICON[p.icon] || ICON.q)(ctx); ctx.restore();
          if (p.text) { ctx.font = `700 28px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillStyle = PARCH; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(p.text, 0, 76); }
        }
      }
      ctx.restore();
    }
  }
  globalThis.POPS = { draw, schedule, GOV };
})();
