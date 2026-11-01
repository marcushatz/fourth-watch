// EXPLAIN: explainer cards that build on the words (ENGINE_ROADMAP.md step 4; direction_rules §5.2: logic as a
// diagram that builds). Data only, drawn over any shot (a 3D set or a card background):
//   shot.explain = [ { kind: 'tree' | 'timeline' | 'versus', y, ... } ]
//   tree      nodes: [{ id, text, sub, parent, at, mark: 'gold' | 'dim', markAt }]   levels from the parents
//   timeline  points: [{ text, sub, at }]   a line draws on; each point pops on its beat; a gold dot travels to the latest
//   versus    left: { text, sub, at }, right: { text, sub, at }, mid: '>' | 'VS' | '='
// `at` is a beat name from the shot (D.beat) or seconds. Everything stays inside the 28-60% band of the frame (clear of
// the title zone and the caption band) and inside the side margins. Pure function of t.
(function () {
  const D = globalThis.DIRECT;
  const SERIF = '"Cinzel"', PARCH = '#F4EAD5', GOLD = '#F0C46A', INK = 'rgba(20,16,13,0.88)', ASH = '#8C8174';
  const tOf = (shot, at) => (typeof at === 'number' ? at : D.beat(shot, at, shot.t0));
  const pop = (t, t0) => Math.max(0, D.act(t, t0, { pre: 0, dip: 0, rise: 0.18, over: 0.12, settle: 0.16 }).k);
  const prog = (t, t0, dur) => Math.max(0, Math.min(1, (t - t0) / dur));
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  let SC = 1.3, FW = 1080;   // the card scale for the current element, and the frame width (set in draw)
  function pill(ctx, x, y, text, sub, s, mark) {
    if (s <= 0) return;
    ctx.save(); ctx.font = `700 40px ${SERIF}`; ctx.letterSpacing = '2px';
    const w = Math.max(ctx.measureText(text).width + 64, sub ? (ctx.font = `700 24px ${SERIF}`, ctx.measureText(sub).width + 48) : 0);
    const half = (w / 2) * SC; x = Math.max(half + 40, Math.min(FW - half - 40, x));   // the whole card stays inside the frame
    ctx.translate(x, y); ctx.scale(s * SC, s * SC);
    const h = sub ? 104 : 72;
    ctx.fillStyle = mark === 'gold' ? 'rgba(64,44,14,0.94)' : INK; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill();
    ctx.strokeStyle = mark === 'dim' ? ASH : GOLD; ctx.lineWidth = mark === 'gold' ? 5 : 2.5; ctx.stroke();
    if (mark === 'gold') { ctx.shadowColor = 'rgba(240,196,106,0.7)'; ctx.shadowBlur = 26; ctx.stroke(); ctx.shadowBlur = 0; }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = mark === 'dim' ? '#BDB2A2' : PARCH;
    ctx.font = `700 40px ${SERIF}`; ctx.letterSpacing = '2px'; ctx.fillText(text, 0, sub ? -14 : 2);
    if (sub) { ctx.font = `700 24px ${SERIF}`; ctx.fillStyle = mark === 'dim' ? ASH : GOLD; ctx.fillText(sub, 0, 28); }
    ctx.restore();
    return w;
  }
  function line(ctx, pts, k, width = 4, col = GOLD) {   // draw a polyline on, k = 0..1 of its length
    if (k <= 0) return;
    const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let left = L * k; ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length && left > 0; i++) { const f = Math.min(1, left / seg[i - 1]); ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f); left -= seg[i - 1]; }
    ctx.stroke(); ctx.restore();
  }
  function tree(ctx, t, shot, e, W, H) {
    const byId = {}; e.nodes.forEach((n) => (byId[n.id] = n));
    const lvl = (n) => (n.parent && byId[n.parent] ? lvl(byId[n.parent]) + 1 : 0);
    const levels = []; e.nodes.forEach((n) => { const l = lvl(n); (levels[l] = levels[l] || []).push(n); });
    const y0 = (e.y ?? 0.32) * H, dy = e.dy ?? 250, xm = 150;
    levels.forEach((row, l) => row.forEach((n, i) => { n._x = xm + ((W - 2 * xm) * (i + 0.5)) / row.length; n._y = y0 + l * dy; }));
    for (const n of e.nodes) {   // connectors under the pills, drawn on as the child arrives
      const p = byId[n.parent]; if (!p) continue;
      const t0 = tOf(shot, n.at), ym = (p._y + n._y) / 2;
      line(ctx, [[p._x, p._y + 40 * SC], [p._x, ym], [n._x, ym], [n._x, n._y - 40 * SC]], ease(prog(t, t0 - 0.05, 0.35)), 6, n.mark === 'dim' && t >= tOf(shot, n.markAt ?? n.at) ? ASH : GOLD);
    }
    for (const n of e.nodes) {
      const mark = n.mark && t >= tOf(shot, n.markAt ?? n.at) ? n.mark : null;
      pill(ctx, n._x, n._y, n.text, n.sub, pop(t, tOf(shot, n.at) + (n.parent ? 0.15 : 0)), mark);
    }
  }
  function timeline(ctx, t, shot, e, W, H) {
    const y = (e.y ?? 0.42) * H, xa = 120, xb = W - 120, n = e.points.length;
    const xs = e.points.map((p, i) => (n === 1 ? W / 2 : xa + ((xb - xa) * i) / (n - 1)));
    const ts = e.points.map((p) => tOf(shot, p.at));
    line(ctx, [[xa - 40, y], [xb + 40, y]], ease(prog(t, ts[0] - 0.3, 0.6)), 7, 'rgba(240,196,106,0.85)');
    let last = -1; ts.forEach((ti, i) => { if (t >= ti) last = i; });
    e.points.forEach((p, i) => {
      const s = pop(t, ts[i]); if (s <= 0) return;
      ctx.save(); ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(xs[i], y, 16 * Math.min(1.2, s), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      pill(ctx, xs[i], y + (i % 2 ? 150 : -150), p.text, p.sub, s * 0.85, i === last ? 'gold' : null);
    });
    if (last > 0) {   // the travelling dot slides from the previous point to the latest one
      const k = ease(prog(t, ts[last], 0.5)), x = xs[last - 1] + (xs[last] - xs[last - 1]) * k;
      ctx.save(); ctx.fillStyle = PARCH; ctx.shadowColor = GOLD; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
  }
  function versus(ctx, t, shot, e, W, H) {
    const y = (e.y ?? 0.42) * H, tl = tOf(shot, e.left.at), tr = tOf(shot, e.right.at ?? e.left.at);
    pill(ctx, W * 0.28, y, e.left.text, e.left.sub, pop(t, tl), e.left.mark);
    pill(ctx, W * 0.72, y, e.right.text, e.right.sub, pop(t, tr), e.right.mark);
    const s = pop(t, Math.max(tl, tr) - 0.1);
    if (s > 0 && e.mid !== null) {
      ctx.save(); ctx.translate(W / 2, y); ctx.scale(s, s); ctx.font = `900 76px ${SERIF}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = GOLD; ctx.fillText(e.mid ?? '>', 0, 4); ctx.restore();
    }
  }
  const KIND = { tree, timeline, versus };
  // a soft dark band behind the card (dim: 0..1, default 0.5) so it reads over any set; it fades in with the first beat
  function band(ctx, t, shot, e, W, H) {
    const first = Math.min(...[].concat(e.nodes || [], e.points || [], e.left ? [e.left] : []).map((n) => tOf(shot, n.at)));
    const a = (e.dim ?? 0.5) * ease(prog(t, first - 0.35, 0.35)); if (a <= 0) return;
    const y = (e.y ?? 0.4) * H, top = y - 0.13 * H, bot = y + (e.kind === 'tree' ? 0.27 : 0.15) * H;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, 'rgba(10,8,12,0)'); g.addColorStop(0.18, `rgba(10,8,12,${a})`); g.addColorStop(0.82, `rgba(10,8,12,${a})`); g.addColorStop(1, 'rgba(10,8,12,0)');
    ctx.fillStyle = g; ctx.fillRect(0, top, W, bot - top);
  }
  function draw(ctx, t, shot, W, H) {
    FW = W;
    for (const e of shot.explain || []) {
      if (e.until != null && t >= tOf(shot, e.until)) continue;
      SC = e.scale ?? 1.3;
      ctx.save(); band(ctx, t, shot, e, W, H); (KIND[e.kind] || (() => {}))(ctx, t, shot, e, W, H); ctx.restore();
    }
  }
  globalThis.EXPLAIN = { draw };
})();
