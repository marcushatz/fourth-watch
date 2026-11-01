// TRANS: transitions that carry motion (ENGINE_ROADMAP.md step 3; research/direction_rules.md §7.4).
//   shot.xin = { kind: 'fade' | 'whip' | 'push', dur, dir: 'left' | 'right' | 'up' | 'down' }
//     fade  a crossfade (0.3 s). Use it as a match-dissolve when both shots share a framing.
//     whip  the old shot flies out and the new one flies in, motion-blurred (0.26 s). Travel, time jumps.
//     push  the same slide without blur, slower (0.45 s). Lists, "next" beats.
// The outgoing shot keeps moving under the transition: it is drawn at the same t, so every frame stays a pure
// function of t. Only the picture body moves; the series header, the title and the captions are drawn once on top.
(function () {
  const DUR = { fade: 0.3, whip: 0.26, push: 0.45 };
  const io = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const dio = (k) => (k < 0.5 ? 12 * k * k : 3 * Math.pow(-2 * k + 2, 2));  // derivative of io
  const pool = [];
  const canvas = (i, W, H) => {
    if (!pool[i]) { pool[i] = document.createElement('canvas'); pool[i].width = W; pool[i].height = H; }
    const c = pool[i].getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.clearRect(0, 0, W, H); return pool[i];
  };
  function active(t, shot) {
    const x = shot.xin; if (!x || !shot.i) return null;
    const dur = x.dur ?? DUR[x.kind] ?? 0.3, d = t - shot.t0;
    return d >= 0 && d < dur ? { kind: x.kind || 'fade', dir: x.dir || 'left', k: d / dur, dur } : null;
  }
  // draw `img` shifted by (dx, dy), smeared over `len` px along the motion (progressive averaging of n copies)
  function smear(ctx, img, dx, dy, ux, uy, len) {
    const n = Math.min(20, Math.max(1, Math.ceil(len / 12)));   // ~12 px between copies, so the smear doesn't strobe
    for (let i = 0; i < n; i++) {
      const s = n === 1 ? 0 : (i / (n - 1) - 0.5) * len;
      ctx.globalAlpha = 1 / (i + 1); ctx.drawImage(img, dx + ux * s, dy + uy * s);
    }
    ctx.globalAlpha = 1;
  }
  function draw(ctx, t, shot, prev, body, W, H, tr) {
    const a = canvas(0, W, H), b = canvas(1, W, H);
    body(a.getContext('2d'), t, prev);
    body(b.getContext('2d'), t, shot);
    const e = io(tr.k);
    if (tr.kind === 'fade') {
      ctx.drawImage(a, 0, 0); ctx.globalAlpha = e; ctx.drawImage(b, 0, 0); ctx.globalAlpha = 1; return;
    }
    const [ux, uy] = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[tr.dir] || [-1, 0];
    const span = ux ? W : H, off = e * span;
    const len = tr.kind === 'whip' ? Math.min(320, (span * dio(tr.k)) / (30 * tr.dur)) : 0;
    ctx.fillStyle = '#0C0A0D'; ctx.fillRect(0, 0, W, H);
    smear(ctx, a, ux * off, uy * off, ux, uy, len);
    smear(ctx, b, ux * (off - span), uy * (off - span), ux, uy, len);
  }
  globalThis.TRANS = { active, draw, DUR };
})();
