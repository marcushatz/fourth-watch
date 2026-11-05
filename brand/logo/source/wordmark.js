// FOURTH WATCH wordmark: crafted gold-foil lettering for the end card, lockups and banners (canvas 2D, no external assets).
//   WM.foil(ctx, W, H, drawMask, o): builds a white mask with drawMask(maskCtx) and composes, back to front: a soft warm glow,
//     a drop shadow, a thin extruded edge (depth), the foil face (pale gold #F6E3B0 -> #E3B25C -> deep #A8742A, with a bright band
//     and reflected light), a bevel (a fine highlight on the upper edges, a dark line on the lower ones) and an optional light
//     sweep (o.sweep = x of the glint centre, o.sweepA its strength) that glints across the letters only.
//   WM.option(ctx, W, H, id, o): draws option 'A' | 'B' | 'C' centred at (o.cx, o.cy) fitted to o.maxW (px).
//   Ornaments (mask shapes): tapered rules, a slender cross, a four-point star, diamonds.
(function () {
  const WM = (globalThis.WM = {});
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  WM.measure = (ctx, txt, track) => [...txt].reduce((a, ch) => a + ctx.measureText(ch).width, 0) + track * (txt.length - 1);
  WM.spaced = (ctx, txt, cx, y, track) => { const w = WM.measure(ctx, txt, track); let x = cx - w / 2; for (const ch of txt) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + track; } return w; };
  // font size that makes txt exactly width w at tracking em*size
  WM.fit = (ctx, txt, w, family, weight, em) => { ctx.font = `${weight} 100px ${family}`; const w100 = WM.measure(ctx, txt, em * 100); return 100 * w / w100; };

  WM.foil = (ctx, W, H, drawMask, o = {}) => {
    const m = mk(W, H), mx = m.getContext('2d'); mx.fillStyle = '#fff'; mx.strokeStyle = '#fff'; drawMask(mx);
    const tint = (col) => { const c = mk(W, H), x = c.getContext('2d'); x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, W, H); return c; };
    const sc = o.scale || 1;
    ctx.save(); ctx.globalAlpha = o.glow ?? 0.42; ctx.filter = `blur(${Math.round(18 * sc)}px)`; ctx.drawImage(tint('#F0B45A'), 0, 0); ctx.restore();          // warm glow
    ctx.save(); ctx.globalAlpha = 0.75; ctx.filter = `blur(${Math.round(5 * sc)}px)`; ctx.drawImage(tint('#000'), 0, 4 * sc); ctx.restore();                   // drop shadow
    ctx.drawImage(tint('#5C3A12'), 0, 2.4 * sc);                                                                                                              // depth
    const face = mk(W, H), fx = face.getContext('2d'); fx.drawImage(m, 0, 0); fx.globalCompositeOperation = 'source-in';
    const g = fx.createLinearGradient(0, o.y0, 0, o.y1);
    [[0, '#FFF7DC'], [0.16, '#F6E3B0'], [0.42, '#E3B25C'], [0.54, '#C38A38'], [0.8, '#A8742A'], [1, '#D6A95C']].forEach(([k, c]) => g.addColorStop(k, c));
    fx.fillStyle = g; fx.fillRect(0, 0, W, H);
    const edge = (dy, col, a) => { const e = mk(W, H), ex = e.getContext('2d'); ex.drawImage(m, 0, 0); ex.globalCompositeOperation = 'destination-out'; ex.drawImage(m, 0, dy);
      ex.globalCompositeOperation = 'source-in'; ex.fillStyle = col; ex.fillRect(0, 0, W, H); fx.globalCompositeOperation = 'source-atop'; fx.globalAlpha = a; fx.drawImage(e, 0, 0); fx.globalAlpha = 1; };
    edge(1.7 * sc, '#FFFBEF', 0.95);     // bevel: the upper edges catch the light
    edge(-1.7 * sc, '#5A3910', 0.75);    // and the lower edges turn away
    ctx.drawImage(face, 0, 0);
    if (o.sweep != null && (o.sweepA ?? 1) > 0.01) {   // the light sweep: a slanted glint, only on the gold
      const s = mk(W, H), sx = s.getContext('2d'); sx.drawImage(m, 0, 0); sx.globalCompositeOperation = 'source-in';
      sx.save(); sx.translate(o.sweep, (o.y0 + o.y1) / 2); sx.rotate(0.38);
      const sg = sx.createLinearGradient(-70 * sc, 0, 70 * sc, 0); sg.addColorStop(0, 'rgba(255,250,235,0)'); sg.addColorStop(0.5, `rgba(255,250,235,${0.95 * (o.sweepA ?? 1)})`); sg.addColorStop(1, 'rgba(255,250,235,0)');
      sx.fillStyle = sg; sx.fillRect(-70 * sc, -H, 140 * sc, 2 * H); sx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s, 0, 0); ctx.restore();
    }
  };

  // ---- ornament shapes (filled into the mask) ----
  WM.taper = (x, xa, xb, y, th) => { x.beginPath(); x.moveTo(xa, y); x.quadraticCurveTo((xa + xb) / 2, y - th * 0.55, xb, y - th / 2); x.lineTo(xb, y + th / 2); x.quadraticCurveTo((xa + xb) / 2, y + th * 0.55, xa, y); x.fill(); };   // point at xa, th thick at xb
  WM.diamond = (x, cx, cy, r) => { x.beginPath(); x.moveTo(cx, cy - r); x.lineTo(cx + r * 0.7, cy); x.lineTo(cx, cy + r); x.lineTo(cx - r * 0.7, cy); x.closePath(); x.fill(); };
  WM.star4 = (x, cx, cy, r, k = 0.2) => { x.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 ? r * k : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fill(); };
  WM.cross = (x, cx, cy, h) => {   // a slender Latin cross with small flared ends
    const w = h * 0.11, arm = h * 0.3, yb = cy - h * 0.2;
    x.fillRect(cx - w / 2, cy - h / 2, w, h); x.fillRect(cx - arm, yb - w / 2, arm * 2, w);
    for (const [px, py] of [[cx, cy - h / 2], [cx, cy + h / 2], [cx - arm, yb], [cx + arm, yb]]) WM.diamond(x, px, py, w * 0.95);
  };
  WM.ruleOrn = (x, cx, y, half, gap, th, centre) => { WM.taper(x, cx - half, cx - gap, y, th); WM.taper(x, cx + half, cx + gap, y, th); if (centre) centre(x); };

  // ---- the three options ----
  WM.option = (ctx, W, H, id, o) => {
    const cx = o.cx, cy = o.cy, maxW = o.maxW, s = o.scale || 1, sweep = o.sweep, sweepA = o.sweepA;
    if (id === 'A') {   // gold foil, the name on one line; tapered rules either side of a slender cross beneath
      const fs = WM.fit(ctx, 'FOURTH WATCH', maxW, 'Cinzel', 700, 0.09), cap = fs * 0.7, base = cy + cap * 0.35;
      WM.foil(ctx, W, H, (x) => {
        x.font = `700 ${fs}px Cinzel`; WM.spaced(x, 'FOURTH WATCH', cx, base, fs * 0.09);
        const oy = base + cap * 0.74; WM.ruleOrn(x, cx, oy, maxW * 0.31, cap * 0.38, 4.6 * s, (q) => WM.cross(q, cx, oy, cap * 0.9));
        WM.diamond(x, cx - maxW * 0.31 - 10 * s, oy, 3.4 * s); WM.diamond(x, cx + maxW * 0.31 + 10 * s, oy, 3.4 * s);
      }, { y0: base - cap, y1: base + cap * 0.1, scale: s, sweep, sweepA });
      return { top: base - cap, bottom: base + cap * 1.12 };
    }
    if (id === 'B') {   // stacked: FOURTH wide-spaced and smaller, a rule with a four-point star, WATCH large
      const fsW = WM.fit(ctx, 'WATCH', maxW * 0.72, 'Cinzel', 900, 0.1), capW = fsW * 0.7;
      const fsF = WM.fit(ctx, 'FOURTH', maxW * 0.62, 'Cinzel', 700, 0.42), capF = fsF * 0.7;
      const gapR = capF * 1.35, baseF = cy - gapR / 2 - capW * 0.12, baseW = baseF + gapR + capW;
      WM.foil(ctx, W, H, (x) => {
        x.font = `700 ${fsF}px Cinzel`; WM.spaced(x, 'FOURTH', cx, baseF, fsF * 0.42);
        const ry = baseF + gapR * 0.5; WM.ruleOrn(x, cx, ry, maxW * 0.36, capF * 0.5, 2.8 * s, (q) => WM.star4(q, cx, ry, capF * 0.36));
        WM.diamond(x, cx - maxW * 0.36 - 9 * s, ry, 3.2 * s); WM.diamond(x, cx + maxW * 0.36 + 9 * s, ry, 3.2 * s);
        x.font = `900 ${fsW}px Cinzel`; WM.spaced(x, 'WATCH', cx, baseW, fsW * 0.1);
      }, { y0: baseF - capF, y1: baseW + capW * 0.1, scale: s, sweep, sweepA });
      return { top: baseF - capF, bottom: baseW };
    }
    if (id === 'C') {   // wide-spaced foil inside a fine chamfered frame; a star crowns the frame; a light sweep crosses it
      const fs = WM.fit(ctx, 'FOURTH WATCH', maxW * 0.86, 'Cinzel', 700, 0.3), cap = fs * 0.7, base = cy + cap / 2;
      const fw = maxW / 2, fh = cap * 1.25, ch = cap * 0.35, lw = 2.6 * s;
      WM.foil(ctx, W, H, (x) => {
        x.font = `700 ${fs}px Cinzel`; WM.spaced(x, 'FOURTH WATCH', cx, base, fs * 0.3);
        x.lineWidth = lw; x.lineJoin = 'miter';
        const L = cx - fw, R = cx + fw, T = cy - fh, Bm = cy + fh, sg = cap * 0.55;
        x.beginPath(); x.moveTo(cx - sg, T); x.lineTo(L + ch, T); x.lineTo(L, T + ch); x.lineTo(L, Bm - ch); x.lineTo(L + ch, Bm); x.lineTo(R - ch, Bm); x.lineTo(R, Bm - ch); x.lineTo(R, T + ch); x.lineTo(R - ch, T); x.lineTo(cx + sg, T); x.stroke();
        WM.star4(x, cx, T, cap * 0.44); WM.diamond(x, L, cy, 5 * s); WM.diamond(x, R, cy, 5 * s);
      }, { y0: base - cap, y1: base + cap * 0.1, scale: s, sweep, sweepA });
      return { top: cy - fh - cap * 0.44, bottom: cy + fh };
    }
  };
})();
