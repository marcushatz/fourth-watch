// Flat 2D cartoon people for the low-poly world: clean shapes, thin dark outline, one cel shade on the side
// away from the light (light comes from the upper left: God's side), a warm rim on the lit edge.
// Design units: feet at (0, 0), y grows downward, head top at about -555 (5.5 heads tall).
(function () {
  const PP = (globalThis.PP = {});
  const LINE = '#24160F';
  const P2 = () => new Path2D();
  const mt = (m) => new DOMMatrix(m);
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
  PP.mix = mix;

  // fill a part: base colour, a cel shade crescent away from the light, a rim crescent on the lit edge, outline
  function part(ctx, path, base, o = {}) {
    ctx.fillStyle = base; ctx.fill(path);
    if (o.shade) {
      const d = o.sd ?? 7; ctx.save(); ctx.clip(path);
      const p = P2(); p.rect(-3000, -3000, 6000, 6000); p.addPath(path, mt([1, 0, 0, 1, -d, -d * 0.45]));
      ctx.fillStyle = o.shade; ctx.fill(p, 'evenodd'); ctx.restore();
    }
    if (o.rim && o.rimA > 0.01) {
      const d = o.rd ?? 3.5; ctx.save(); ctx.clip(path); ctx.globalAlpha = Math.min(1, o.rimA);
      const p = P2(); p.rect(-3000, -3000, 6000, 6000); p.addPath(path, mt([1, 0, 0, 1, d, d * 0.5]));
      ctx.fillStyle = o.rim; ctx.fill(p, 'evenodd'); ctx.restore();
    }
    if (o.line !== false) { ctx.lineWidth = o.lw ?? 2.6; ctx.strokeStyle = o.lineCol || LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(path); }
  }
  PP.part = part;
  // several parts that read as one shape: outline the union first (double width), then fill each part on top
  function group(ctx, parts, lw = 2.6) {
    ctx.save(); ctx.lineWidth = lw * 2; ctx.strokeStyle = LINE; ctx.lineJoin = 'round';
    for (const [path] of parts) ctx.stroke(path);
    ctx.restore();
    for (const [path, base, o] of parts) part(ctx, path, base, Object.assign({}, o, { line: false }));
  }
  PP.group = group;
  // a fist at the end of a forearm (wrist W, direction from elbow E)
  function fistPath(Wr, E, s) {
    const ang = Math.atan2(Wr[1] - E[1], Wr[0] - E[0]);
    const m = new DOMMatrix().translate(Wr[0], Wr[1]).rotate(ang * 180 / Math.PI);
    const p = P2(); p.roundRect(-2, -14, 28, 28, 10);
    const th = P2(); th.ellipse(10, s * 11, 9, 6, s * 0.3, 0, 6.283);
    const out = P2(); out.addPath(p, m); const tp = P2(); tp.addPath(th, m);
    return { body: out, thumb: tp, m };
  }
  PP.fistPath = fistPath;

  // a tapered limb from A to B (radii ra, rb) with a muscle bulge on one side
  function limb(A, B, ra, rb, bulge = 0, bulgeSide = 1) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const mA = Math.atan2(ny, nx);
    const p = P2();
    const mid = [A[0] + dx * 0.42, A[1] + dy * 0.42], rm = (ra + rb) / 2;
    const b1 = bulgeSide > 0 ? bulge : bulge * 0.35, b2 = bulgeSide > 0 ? bulge * 0.35 : bulge;
    p.moveTo(A[0] + nx * ra, A[1] + ny * ra);
    p.quadraticCurveTo(mid[0] + nx * (rm + b1), mid[1] + ny * (rm + b1), B[0] + nx * rb, B[1] + ny * rb);
    p.arc(B[0], B[1], rb, mA, mA + Math.PI, true);
    p.quadraticCurveTo(mid[0] - nx * (rm + b2), mid[1] - ny * (rm + b2), A[0] - nx * ra, A[1] - ny * ra);
    p.arc(A[0], A[1], ra, mA + Math.PI, mA, true);
    p.closePath();
    return p;
  }
  PP.limb = limb;
  const ell = (x, y, rx, ry, rot = 0) => { const p = P2(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
  const poly = (pts, close = true) => { const p = P2(); pts.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); if (close) p.closePath(); return p; };
  // smooth closed shape through points (Catmull-Rom -> bezier)
  function blob(pts, tension = 0.5) {
    const p = P2(), n = pts.length;
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2, p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2];
      const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2, p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2];
      p.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]);
    }
    p.closePath(); return p;
  }
  // open smooth curve through points
  function curve(pts) { const p = P2(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2; p.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc); } const L = pts[pts.length - 1]; p.lineTo(L[0], L[1]); return p; }
  PP.ell = ell; PP.poly = poly; PP.blob = blob; PP.curve = curve;
  const qb = (a, c, b, k) => [(1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * c[0] + k * k * b[0], (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * c[1] + k * k * b[1]];

  // a braid (lock) from a, bending through c, to b: a chain of overlapping lobes, tied at the end
  function braid(ctx, a, c, b, col, hi, w = 11, rimA = 0, rim = '#FFD58A') {
    const n = 15;
    for (let i = n; i >= 0; i--) {
      const k = i / n, q = qb(a, c, b, k), q2 = qb(a, c, b, Math.min(1, k + 0.02));
      const ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]);
      const ww = w * (1 - k * 0.28);
      const lobe = ell(q[0] + Math.cos(ang + Math.PI / 2) * (i % 2 ? 2.2 : -2.2), q[1] + Math.sin(ang + Math.PI / 2) * (i % 2 ? 2.2 : -2.2), ww * 0.62, ww * 0.95, ang + Math.PI / 2 + (i % 2 ? 0.5 : -0.5));
      part(ctx, lobe, col, { shade: '#140B07', sd: 2.5, rim: rimA > 0 ? rim : hi, rimA: rimA > 0 ? rimA : 0.8, rd: 2, lw: 1.8 });
    }
    // tie + tuft
    const e = b, e2 = qb(a, c, b, 0.97), ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
    const tuft = P2(); tuft.moveTo(e[0] - 5, e[1]); tuft.quadraticCurveTo(e[0] + Math.cos(ang) * 14, e[1] + Math.sin(ang) * 18, e[0] + 5, e[1]); tuft.closePath();
    part(ctx, tuft, col, { lw: 1.6 });
    part(ctx, ell(e[0], e[1] - 2, 6, 3.2, ang + Math.PI / 2), '#B88A55', { lw: 1.4 });
  }
  PP.braid = braid;

  // ---------------- faces ----------------
  // eyes: almond whites, iris, highlight; look = [x, y] in -1..1; squint 0..1; brows: furrow 0..1, lift
  function eyes(ctx, cx, cy, o = {}) {
    const sp = o.sp ?? 15, rx = o.rx ?? 8.5, ry = (o.ry ?? 5.6) * (1 - (o.squint || 0) * 0.35), look = o.look || [0, 0];
    for (const s of [-1, 1]) {
      const x = cx + s * sp, w = ell(x, cy, rx, ry);
      ctx.fillStyle = '#F6EEE2'; ctx.fill(w);
      ctx.save(); ctx.clip(w);
      ctx.fillStyle = o.iris || '#3A2414'; ctx.beginPath(); ctx.arc(x + look[0] * 3.2, cy + look[1] * 2 + 0.6, 4.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#120A06'; ctx.beginPath(); ctx.arc(x + look[0] * 3.2, cy + look[1] * 2 + 0.6, 2.3, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + look[0] * 3.2 - 1.5, cy + look[1] * 2 - 1.1, 1.35, 0, 6.283); ctx.fill();
      ctx.restore();
      // upper lid (heavier), lower lid (light)
      ctx.strokeStyle = LINE; ctx.lineCap = 'round';
      ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, Math.PI * 1.06, Math.PI * 1.94); ctx.stroke();
      ctx.lineWidth = 1.1; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(x, cy, rx * 0.9, ry, 0, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  function brows(ctx, cx, cy, o = {}) {
    const f = o.furrow || 0, lift = o.lift || 0, th = o.th ?? 5, col = o.col || '#24150D', sp = o.sp ?? 15;
    for (const s of [-1, 1]) {
      const ix = cx + s * (sp - 9 + f * 2), ox = cx + s * (sp + 11);
      const iy = cy + f * 3.5 - lift, oy = cy - 3 - lift * 0.6 - f * 0.5;
      const p = P2(); p.moveTo(ix, iy + th * 0.5); p.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) - th * 0.9, ox, oy + th * 0.25); p.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) - th * 0.1 + th * 0.6, ix, iy + th * 0.5 + th * 0.4); p.closePath();
      ctx.fillStyle = col; ctx.fill(p);
    }
  }
  PP.eyes = eyes; PP.brows = brows;

  // ---------------- SAMSON ----------------
  // st: { strain 0..1, burst 0..1 (arms up), burn 0..1 (ropes glow), brk 0..1 (ropes fly), rim 0..1 (gold light), t, look [x,y] }
  const SK = { base: '#C68A5E', shade: '#9E6A45', rim: '#F2C69A' };
  const HAIR = { base: '#2C1B12', hi: '#5A3C26' };
  const TUN = { base: '#4D6386', shade: '#384A68', trim: '#EADCC0', stripe: '#9B5A3A' };
  const ROPE = { base: '#CDB27E', dark: '#8E744A' };
  PP.samson = (ctx, st) => {
    const t = st.t || 0, strain = st.strain || 0, burst = st.burst || 0, burn = st.burn || 0, brk = st.brk || 0, gold = st.rim || 0;
    const tremble = strain * (1 - burst) * 1.6;
    const tr = [Math.sin(t * 61) * tremble, Math.cos(t * 47) * tremble * 0.6];
    const breath = Math.sin(t * 2.2) * 1.5 * (1 - strain * 0.5) + burst * 3;
    const rimCol = mix('#F7D7AE', '#FFD27A', gold), rimA = 0.55 + gold * 0.45;
    const skin = { shade: SK.shade, rim: mix(SK.rim, '#FFE29A', gold), rimA, sd: 8 };
    const shoulderUp = strain * 3 * (1 - burst) + burst * 4;
    ctx.save(); ctx.translate(tr[0], tr[1]);

    // ---- braids behind the body (3 of the seven) ----
    const sway = (i) => Math.sin(t * 1.6 + i * 1.3) * 2.2 * (1 + burst * 2);
    const sw2 = burst * 12;
    braid(ctx, [-40, -468], [-66 - sw2, -430], [-76 - sw2 + sway(0), -322 - burst * 8], HAIR.base, HAIR.hi, 11, gold * 0.9);
    braid(ctx, [42, -468], [66 + sw2, -432], [80 + sw2 + sway(1), -326 - burst * 8], HAIR.base, HAIR.hi, 11, gold * 0.9);
    braid(ctx, [36, -472], [54 + sw2, -440], [62 + sw2 + sway(2), -300 - burst * 8], HAIR.base, HAIR.hi, 10, gold * 0.9);
    // long hair mass behind the shoulders
    part(ctx, blob([[-46, -505], [-58, -455], [-62, -405], [-40, -392], [0, -398], [40, -392], [62, -405], [58, -455], [46, -505], [0, -540]]), HAIR.base, { shade: '#150C08', sd: 6 });

    // ---- legs + sandals ----
    for (const s of [-1, 1]) {
      const x = s * 25;
      const leg = blob([[x - 13, -176], [x + 13, -176], [x + 17 + s * 3, -122], [x + 10, -62], [x + 7, -18], [x - 7, -18], [x - 11, -62], [x - 17 + s * 2, -122]], 0.45);
      part(ctx, leg, SK.base, skin);
      // sandal + straps
      part(ctx, ell(x + s * 4, -7, 19, 8), '#6B4A33', { shade: '#4A3122', sd: 3 });
      ctx.strokeStyle = '#5A3C26'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 9, -16 - k * 14); ctx.lineTo(x + 9, -24 - k * 14); ctx.stroke(); }
      part(ctx, ell(x + s * 6, -10, 9, 5), SK.base, { lw: 1.6 });
    }

    // ---- arm geometry ----
    const deg = Math.PI / 180;
    const A = (8 + strain * 3) * deg + burst * 118 * deg, B = (-4 + burst * 42) * deg;
    const arms = [-1, 1].map((s) => {
      const J = [s * 68, -392 - shoulderUp];
      const d1 = [s * Math.sin(A), Math.cos(A)], d2 = [s * Math.sin(A + B), Math.cos(A + B)];
      const E = [J[0] + d1[0] * 104, J[1] + d1[1] * 104], Wr = [E[0] + d2[0] * 88, E[1] + d2[1] * 88], F = [Wr[0] + d2[0] * 14, Wr[1] + d2[1] * 14];
      return { s, J, E, Wr, F };
    });

    // ---- torso skin (shoulders, neck base) ----
    part(ctx, blob([[-24, -432], [-50, -410 - shoulderUp], [-88, -396 - shoulderUp], [-92, -368], [-62, -352], [0, -350], [62, -352], [92, -368], [88, -396 - shoulderUp], [50, -410 - shoulderUp], [24, -432]], 0.5), SK.base, skin);

    // ---- tunic ----
    const chest = breath;
    const tunic = blob([[-26, -414], [-50, -404 - shoulderUp], [-62, -364 - chest * 0.4], [-56 - chest * 0.3, -318], [-52, -296], [-60, -232], [-72, -170], [-36, -164], [0, -166], [36, -164], [72, -170], [60, -232], [52, -296], [56 + chest * 0.3, -318], [62, -364 - chest * 0.4], [50, -404 - shoulderUp], [26, -414], [0, -394]], 0.42);
    part(ctx, tunic, TUN.base, { shade: TUN.shade, sd: 12, rim: mix('#8FA6C8', '#FFD58A', gold), rimA: 0.55 + gold * 0.4, rd: 4 });
    // folds
    ctx.save(); ctx.clip(tunic); ctx.strokeStyle = TUN.shade; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    for (const [x0, x1] of [[-30, -40], [-6, -10], [18, 26], [40, 52]]) { ctx.beginPath(); ctx.moveTo(x0, -288); ctx.quadraticCurveTo((x0 + x1) / 2 + 4, -230, x1, -178); ctx.stroke(); }
    // hem trim + neckline trim
    ctx.fillStyle = TUN.trim; ctx.fillRect(-90, -186, 180, 14);
    ctx.fillStyle = TUN.stripe; for (let x = -84; x < 84; x += 14) { ctx.beginPath(); ctx.moveTo(x, -179); ctx.lineTo(x + 5, -184); ctx.lineTo(x + 10, -179); ctx.lineTo(x + 5, -174); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const neck = P2(); neck.moveTo(-26, -414); neck.quadraticCurveTo(0, -386, 26, -414); ctx.strokeStyle = TUN.trim; ctx.lineWidth = 7; ctx.stroke(neck); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(neck);
    // belt
    const belt = P2(); belt.moveTo(-55, -312); belt.quadraticCurveTo(0, -302, 55, -312); belt.lineTo(54, -296); belt.quadraticCurveTo(0, -286, -54, -296); belt.closePath();
    part(ctx, belt, '#6A4630', { shade: '#4B301F', sd: 4 });
    part(ctx, poly([[-16, -300], [-6, -298], [-2, -262], [-12, -258]]), '#6A4630', { shade: '#4B301F', sd: 3, lw: 2 });
    part(ctx, poly([[-6, -298], [4, -300], [10, -266], [1, -262]]), '#5E3E2A', { lw: 2 });
    part(ctx, ell(-6, -300, 8, 7), '#7A5238', { lw: 2 });

    // ---- arms ----
    const drawArm = (a) => {
      const { s, J, E, Wr } = a;
      const fp = fistPath(Wr, E, s);
      const sk = Object.assign({}, skin);
      group(ctx, [[ell(J[0] + s * 4, J[1] + 6, 24, 25), SK.base, sk], [limb(J, E, 20, 15, 7, s * (burst > 0.5 ? -1 : 1)), SK.base, sk], [limb(E, Wr, 16, 12, 5, s), SK.base, sk], [fp.body, SK.base, sk], [fp.thumb, SK.base, sk]]);
      // biceps line, knuckles, thin leather wrist cord
      ctx.strokeStyle = 'rgba(36,22,15,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const kx = (u, v) => { const q = fp.m.transformPoint(new DOMPoint(u, v)); return [q.x, q.y]; };
      for (const v of [-7, 0, 7]) { const a1 = kx(19, v - 3), a2 = kx(22, v + 2); ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); }
      const w1 = [E[0] + (Wr[0] - E[0]) * 0.8, E[1] + (Wr[1] - E[1]) * 0.8], w2 = [E[0] + (Wr[0] - E[0]) * 0.9, E[1] + (Wr[1] - E[1]) * 0.9];
    };
    arms.forEach(drawArm);

    // ---- the two new ropes (Judges 15:13): coils over upper arms + chest, and over forearms + waist ----
    const coilsA = [-372, -356, -340].map((y) => [y, 100]), coilsB = [-266, -251].map((y) => [y, 104]);
    const ropeCol = mix(mix(ROPE.base, '#FFC870', burn), '#FFE7A8', Math.max(0, burn - 0.6) * 1.6);
    const ropeBand = (x0, y0, x1, y1, sag, w) => { const p = P2(); const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag;
      const nx = 0, ny = w / 2; p.moveTo(x0, y0 - ny); p.quadraticCurveTo(mx, my - ny, x1, y1 - ny); p.lineTo(x1, y1 + ny); p.quadraticCurveTo(mx, my + ny, x0, y0 + ny); p.closePath(); return p; };
    const drawRope = (path, x0, y0, x1, y1, sag) => {
      if (burn > 0.05) { ctx.save(); ctx.shadowColor = `rgba(255,190,90,${0.9 * burn})`; ctx.shadowBlur = 26 * burn; ctx.fillStyle = ropeCol; ctx.fill(path); ctx.restore(); }
      part(ctx, path, ropeCol, { shade: mix(ROPE.dark, '#E08A3A', burn), sd: 3, lw: 2 });
      ctx.save(); ctx.clip(path); ctx.strokeStyle = mix(ROPE.dark, '#C2502E', burn); ctx.lineWidth = 1.6;
      const n = Math.round(Math.abs(x1 - x0) / 6);
      for (let i = 0; i <= n; i++) { const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k + sag * 4 * k * (1 - k); ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 3, y + 6); ctx.stroke(); }
      ctx.restore();
    };
    if (brk <= 0) {
      for (const [y, hw] of coilsA) drawRope(ropeBand(-hw, y - 2, hw, y - 2, 9, 11), -hw, y - 2, hw, y - 2, 9);
      drawRope(ropeBand(-82, -336, -86, -268, 0, 9), -82, -336, -86, -268, 0);
      drawRope(ropeBand(82, -336, 86, -268, 0, 9), 82, -336, 86, -268, 0);
      for (const [y, hw] of coilsB) drawRope(ropeBand(-hw, y - 2, hw, y - 2, 8, 11), -hw, y - 2, hw, y - 2, 8);
      // knot + hanging ends
      drawRope(ropeBand(8, -258, 16, -204, 4, 8), 8, -258, 16, -204, 4);
      drawRope(ropeBand(2, -258, -6, -214, -3, 8), 2, -258, -6, -214, -3);
      part(ctx, ell(5, -258, 12, 9), ropeCol, { shade: ROPE.dark, sd: 3, lw: 2 });
    } else {
      // pieces fly outward, burning away
      const pieces = [];
      for (const [y, hw] of coilsA) for (let i = 0; i < 4; i++) pieces.push({ x: -hw + (i + 0.5) * hw / 2, y: y - 2, len: hw / 2 - 2, seed: y * 7 + i });
      for (const [y, hw] of coilsB) for (let i = 0; i < 4; i++) pieces.push({ x: -hw + (i + 0.5) * hw / 2, y: y - 2, len: hw / 2 - 2, seed: y * 5 + i * 3 });
      const fly = 1 - Math.pow(1 - brk, 2.2);
      for (const pc of pieces) {
        const r1 = Math.abs(Math.sin(pc.seed * 12.9898) * 43758.5453) % 1, r2 = Math.abs(Math.sin(pc.seed * 78.233) * 12345.678) % 1;
        const dir = Math.sign(pc.x) || (r1 < 0.5 ? -1 : 1);
        const vx = dir * (60 + r1 * 120) + pc.x * 0.6, vy = -40 - r2 * 120;
        const x = pc.x + vx * fly, y = pc.y + vy * fly + 160 * fly * fly, rot = (r1 - 0.5) * 5 * fly;
        const a = Math.max(0, 1 - Math.pow(brk, 1.3)), L = pc.len * (1 - brk * 0.6);
        if (a <= 0.02) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
        const p = ropeBand(-L / 2, 0, L / 2, 0, 0, 10 * (1 - brk * 0.5));
        ctx.shadowColor = 'rgba(255,170,70,0.9)'; ctx.shadowBlur = 16; ctx.fillStyle = mix(mix(ROPE.base, '#FFB860', 0.6), '#7A4A2A', brk); ctx.fill(p); ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFE6A0'; for (const e of [-L / 2, L / 2]) { ctx.beginPath(); ctx.arc(e, 0, 5.5 * (1 - brk * 0.5), 0, 6.283); ctx.fill(); }
        ctx.strokeStyle = 'rgba(120,40,10,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(p);
        ctx.restore();
      }
    }

    // ---- head ----
    const H = [tr[0] * 0.3, -486 - shoulderUp * 0.6 - burst * 2];
    ctx.save(); ctx.translate(H[0], H[1]);
    const tilt = -burst * 0.05; ctx.rotate(tilt);
    // neck
    part(ctx, poly([[-17, 22], [17, 22], [21, 66], [-21, 66]]), SK.base, { shade: SK.shade, sd: 10 });
    // ears
    for (const s of [-1, 1]) part(ctx, ell(s * 37, -2, 7, 11), SK.base, { shade: SK.shade, sd: 3, lw: 2 });
    // face
    const face = blob([[-37, -18], [-36, 14], [-28, 38], [-12, 50], [0, 52], [12, 50], [28, 38], [36, 14], [37, -18], [26, -44], [0, -50], [-26, -44]], 0.5);
    part(ctx, face, SK.base, { shade: SK.shade, sd: 7, rim: skin.rim, rimA, rd: 3 });
    // cheek warmth
    ctx.save(); ctx.clip(face); ctx.fillStyle = 'rgba(200,90,60,0.16)'; ctx.beginPath(); ctx.ellipse(-22, 12, 9, 6, 0, 0, 6.283); ctx.ellipse(22, 12, 9, 6, 0, 0, 6.283); ctx.fill(); ctx.restore();
    // beard (full, dark), sideburns to chin, below the cheekbones
    const beard = blob([[-38, -8], [-36, 22], [-28, 50], [-14, 70], [0, 76], [14, 70], [28, 50], [36, 22], [38, -8], [30, 4], [22, 22], [12, 26], [0, 24], [-12, 26], [-22, 22], [-30, 4]], 0.45);
    part(ctx, beard, HAIR.base, { shade: '#150C08', sd: 5, rim: HAIR.hi, rimA: 0.9, rd: 2.5 });
    ctx.save(); ctx.clip(beard); ctx.strokeStyle = '#4A3020'; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 7, 32); ctx.quadraticCurveTo(i * 8, 50, i * 6 + (i > 0 ? 2 : -2), 68); ctx.stroke(); }
    ctx.restore();
    // mouth (inside beard): set lips, teeth gritted while straining
    const grit = strain * (1 - burst * 0.4);
    const mouthW = 10 + grit * 2;
    if (grit > 0.3) {
      const m = P2(); m.moveTo(-mouthW, 34); m.quadraticCurveTo(0, 30, mouthW, 34); m.lineTo(mouthW - 1, 39); m.quadraticCurveTo(0, 42, -mouthW + 1, 39); m.closePath();
      part(ctx, m, '#F3E9DA', { lw: 1.8 }); ctx.strokeStyle = 'rgba(36,22,15,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-mouthW + 1, 36.5); ctx.lineTo(mouthW - 1, 36.5); ctx.stroke();
    } else { part(ctx, (() => { const m = P2(); m.moveTo(-mouthW, 35); m.quadraticCurveTo(0, 38, mouthW, 35); m.quadraticCurveTo(0, 41, -mouthW, 35); m.closePath(); return m; })(), '#7A3E2C', { lw: 1.6 }); }
    // mustache
    const mus = P2(); mus.moveTo(-2, 22); mus.quadraticCurveTo(-14, 20, -21, 34); mus.quadraticCurveTo(-12, 30, -2, 29); mus.moveTo(2, 22); mus.quadraticCurveTo(14, 20, 21, 34); mus.quadraticCurveTo(12, 30, 2, 29);
    part(ctx, mus, HAIR.base, { lw: 1.6 });
    // nose
    const nose = P2(); nose.moveTo(-1, -6); nose.quadraticCurveTo(-3, 8, -7, 15); nose.quadraticCurveTo(0, 21, 8, 16); nose.quadraticCurveTo(5, 6, 3, -6); nose.closePath();
    ctx.fillStyle = SK.shade; ctx.globalAlpha = 0.55; ctx.fill(nose); ctx.globalAlpha = 1;
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(4, -4); ctx.quadraticCurveTo(7, 8, 9, 14); ctx.quadraticCurveTo(3, 20, -5, 16); ctx.stroke();
    // eyes + brows
    const look = st.look || [0, 0];
    eyes(ctx, 0, -6, { sp: 15, rx: 8.6, ry: 5.8, squint: strain * 0.5 * (1 - burst), look });
    brows(ctx, 0, -17, { furrow: strain * (1 - burst * 0.6), lift: burst * 2, th: 5.4, col: '#1E120B' });
    // hair: cap with a middle part and a heavy hairline
    const cap = blob([[-41, -6], [-42, -30], [-32, -50], [-12, -60], [0, -60], [12, -60], [32, -50], [42, -30], [41, -6], [36, -18], [28, -34], [12, -38], [0, -36], [-12, -38], [-28, -34], [-36, -18]], 0.5);
    part(ctx, cap, HAIR.base, { shade: '#150C08', sd: 5, rim: mix(HAIR.hi, '#FFD27A', gold), rimA: 0.9, rd: 3 });
    ctx.strokeStyle = '#4A3020'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(-2, -48, 0, -37); ctx.stroke();
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * (6 + k * 9), -54 + k * 2); ctx.quadraticCurveTo(s * (14 + k * 10), -46, s * (24 + k * 6), -30 + k * 6); ctx.stroke(); }
    ctx.restore();

    // ---- front braids: 4 of the seven, over the shoulders onto the chest ----
    const B4 = [[-34, -466, -58, -428, -48, -318], [-26, -462, -40, -420, -30, -330], [26, -462, 40, -420, 30, -332], [34, -466, 58, -428, 50, -320]];
    B4.forEach(([ax, ay, cx, cy, bx, by], i) => {
      const s = Math.sign(ax), up = burst * 6;
      braid(ctx, [ax + H[0], ay - shoulderUp * 0.6], [cx + s * sw2 * 0.6, cy - up], [bx + s * sw2 + sway(i + 3), by - up + Math.sin(t * 2 + i) * 1.2], HAIR.base, HAIR.hi, 10.5, gold * 0.9);
    });
    ctx.restore();
  };

  // ---------------- PHILISTINE SOLDIER (feathered crown, ribbed corselet, kilt, round shield, spear) ----------------
  PP.soldier = (ctx, o = {}) => {
    const skin = o.skin || '#C08458', sh = mix(skin, '#5A3424', 0.35);
    const kilt = o.kilt || '#E4D3B0', trim = o.trim || '#A8432C', shout = o.shout ?? 1, raise = o.raise ?? 0;
    const S = { shade: sh, sd: 7 };
    // legs
    for (const s of [-1, 1]) { part(ctx, blob([[s * 25 - 12, -200], [s * 25 + 12, -200], [s * 25 + 13, -110], [s * 25 + 7, -16], [s * 25 - 7, -16], [s * 25 - 12, -110]], 0.45), skin, S); part(ctx, ell(s * 29, -7, 18, 8), '#5A3C26', { lw: 2.4 }); }
    const sx = o.spearSide ?? 1;
    // torso skin + corselet bands
    part(ctx, blob([[-60, -400], [-84, -392], [-80, -350], [-58, -300], [58, -300], [80, -350], [84, -392], [60, -400], [0, -408]], 0.5), skin, S);
    const cors = blob([[-56, -392], [-58, -340], [-54, -296], [54, -296], [58, -340], [56, -392], [0, -384]], 0.45);
    part(ctx, cors, '#8A6646', { shade: '#5E4430', sd: 8 });
    ctx.save(); ctx.clip(cors); ctx.strokeStyle = '#4A3424'; ctx.lineWidth = 2.6; for (let y = -380; y < -296; y += 14) { ctx.beginPath(); ctx.moveTo(-70, y); ctx.quadraticCurveTo(0, y + 8, 70, y); ctx.stroke(); } ctx.restore();
    // kilt with tasselled front panel
    const k = blob([[-56, -304], [-66, -200], [-30, -192], [0, -196], [30, -192], [66, -200], [56, -304]], 0.35);
    part(ctx, k, kilt, { shade: mix(kilt, '#6B4A33', 0.35), sd: 10 });
    ctx.fillStyle = trim; ctx.fillRect(-64, -214, 128, 10); ctx.fillRect(-12, -300, 24, 100);
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5, -200); ctx.lineTo(i * 5, -180); ctx.stroke(); }
    // arms: the spear hand holds the spear upright (raised when shouting), the other hand carries the round shield
    const hands = {};
    const armParts = [];
    for (const s of [-1, 1]) {
      const spearArm = s === sx, up = spearArm ? raise : 0;
      const J = [s * 66, -388], a = (spearArm ? 14 + up * 120 : 16) * Math.PI / 180, b = (spearArm ? 40 - up * 30 : -55) * Math.PI / 180;
      const E = [J[0] + s * Math.sin(a) * 96, J[1] + Math.cos(a) * 96], Wd = [E[0] + s * Math.sin(a + b) * 80, E[1] + Math.cos(a + b) * 80];
      hands[s] = Wd;
      armParts.push([limb(J, E, 17, 13, 4, s), skin, S], [limb(E, Wd, 14, 11, 3, s), skin, S], [ell(Wd[0], Wd[1], 13, 12), skin, S]);
    }
    group(ctx, armParts);
    const hp = hands[sx], top = hp[1] - 300 - raise * 40, bot = hp[1] + 240 - raise * 140;
    ctx.strokeStyle = LINE; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hp[0], bot); ctx.lineTo(hp[0], top); ctx.stroke();
    ctx.strokeStyle = '#7A5A3E'; ctx.lineWidth = 5.5; ctx.beginPath(); ctx.moveTo(hp[0], bot - 2); ctx.lineTo(hp[0], top + 2); ctx.stroke();
    part(ctx, poly([[hp[0] - 9, top + 4], [hp[0], top - 50], [hp[0] + 9, top + 4]]), '#C9A066', { shade: '#8E6A3A', sd: 4 });
    part(ctx, ell(hp[0], hp[1], 13, 12), skin, S);
    const shp = hands[-sx], shx = shp[0] - sx * 6, shy = shp[1] - 10;
    part(ctx, ell(shx, shy, 58, 58), '#B8864B', { shade: '#7E5A2E', sd: 10, rim: '#F2D29A', rimA: 0.7 });
    ctx.strokeStyle = '#6E4E26'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(shx, shy, 44, 0, 6.283); ctx.stroke();
    part(ctx, ell(shx, shy, 13, 13), '#D9B278', { lw: 2.2 });
    // head: clean-shaven, open mouth (shouting, Judges 15:14)
    ctx.save(); ctx.translate(0, -470);
    part(ctx, poly([[-15, 30], [15, 30], [18, 70], [-18, 70]]), skin, { shade: sh, sd: 8 });
    const face = blob([[-34, -16], [-33, 14], [-24, 38], [0, 50], [24, 38], [33, 14], [34, -16], [24, -40], [0, -46], [-24, -40]], 0.5);
    part(ctx, face, skin, { shade: sh, sd: 7 });
    eyes(ctx, 0, -4, { sp: 13, rx: 7, ry: 4.6 });
    brows(ctx, 0, -14, { furrow: 1, th: 4.4 });
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(6, 10, 7, 14); ctx.quadraticCurveTo(2, 18, -4, 15); ctx.stroke();
    if (shout > 0.2) part(ctx, ell(0, 30, 8 * shout + 3, 6 * shout + 2), '#4A1E14', { lw: 2 });
    else { ctx.beginPath(); ctx.moveTo(-8, 30); ctx.lineTo(8, 30); ctx.stroke(); }
    // feathered crown: a red band and a row of upright feathers
    for (let i = -5; i <= 5; i++) {
      const fx = i * 7.2, a = i * 0.06;
      const f = P2(); f.moveTo(fx - 4, -34); f.quadraticCurveTo(fx - 6 + a * 40, -64, fx + a * 70, -84); f.quadraticCurveTo(fx + 6 + a * 40, -64, fx + 4, -34); f.closePath();
      part(ctx, f, i % 2 ? '#F1E8D6' : '#E2D6BE', { lw: 1.8 });
    }
    part(ctx, blob([[-36, -26], [-35, -40], [0, -44], [35, -40], [36, -26], [0, -30]], 0.4), trim, { lw: 2.2 });
    ctx.fillStyle = '#E8C27A'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 9, -35, 2.4, 0, 6.283); ctx.fill(); }
    ctx.restore();
  };

  // ---------------- MAN OF JUDAH (long robe, head cloth, beard) ----------------
  PP.judean = (ctx, o = {}) => {
    const skin = o.skin || '#B57B52', sh = mix(skin, '#4A2A1A', 0.35);
    const robe = o.robe || '#8A6A4A', robeSh = mix(robe, '#2A1E16', 0.35), cloth = o.cloth || '#DCCDAE', band = o.band || '#5C3F2A';
    const hand = o.hand ?? 0;
    for (const s of [-1, 1]) part(ctx, ell(s * 22, -8, 20, 9), '#4A3424', { lw: 2.2 });
    const body = blob([[-46, -404], [-70, -392], [-74, -300], [-80, -120], [-84, -18], [0, -12], [84, -18], [80, -120], [74, -300], [70, -392], [46, -404], [0, -398]], 0.42);
    part(ctx, body, robe, { shade: robeSh, sd: 14 });
    ctx.save(); ctx.clip(body); ctx.fillStyle = o.stripe || '#5E4430'; ctx.fillRect(-40, -400, 12, 400); ctx.fillRect(28, -400, 12, 400); ctx.restore();
    part(ctx, blob([[-60, -300], [0, -292], [60, -300], [60, -284], [0, -276], [-60, -284]], 0.3), band, { lw: 2.2 });
    // arms (sleeves) folded / one hand raised to the mouth
    for (const s of [-1, 1]) {
      const raised = s === -1 ? hand : 0;
      const J = [s * 62, -380], a = (8 + raised * 120) * Math.PI / 180, b = (-34 + raised * 84) * Math.PI / 180;
      const E = [J[0] + s * Math.sin(a) * 96, J[1] + Math.cos(a) * 96], Wd = [E[0] + s * Math.sin(a + b) * 78, E[1] + Math.cos(a + b) * 78];
      group(ctx, [[limb(J, E, 20, 17, 2, s), robe, { shade: robeSh, sd: 8 }], [limb(E, Wd, 17, 14, 1, s), robe, { shade: robeSh, sd: 6 }]]); part(ctx, ell(Wd[0], Wd[1], 11, 11), skin, { shade: sh, sd: 4 });
    }
    ctx.save(); ctx.translate(0, -470);
    const face = blob([[-33, -14], [-32, 14], [-24, 38], [0, 48], [24, 38], [32, 14], [33, -14], [24, -40], [0, -46], [-24, -40]], 0.5);
    part(ctx, face, skin, { shade: sh, sd: 7 });
    const beard = blob([[-33, 0], [-30, 30], [-14, 58], [0, 66], [14, 58], [30, 30], [33, 0], [22, 22], [0, 26], [-22, 22]], 0.45);
    part(ctx, beard, o.beard || '#3A2A1E', { shade: '#1E140D', sd: 4 });
    eyes(ctx, 0, -4, { sp: 13, rx: 7, ry: 4.8, look: o.look || [0.5, 0] });
    brows(ctx, 0, -14, { furrow: 0.2, lift: 3, th: 4.2 });
    ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(6, 10, 7, 14); ctx.quadraticCurveTo(2, 18, -4, 15); ctx.stroke();
    // head cloth falling to the shoulders, with a cord
    const hc = blob([[-40, 30], [-46, -10], [-40, -44], [0, -58], [40, -44], [46, -10], [40, 30], [58, 76], [30, 60], [36, 4], [26, -26], [0, -32], [-26, -26], [-36, 4], [-30, 60], [-58, 76]], 0.42);
    part(ctx, hc, cloth, { shade: mix(cloth, '#6B4A33', 0.4), sd: 8 });
    part(ctx, blob([[-38, -30], [0, -42], [38, -30], [38, -22], [0, -34], [-38, -22]], 0.35), band, { lw: 2 });
    ctx.restore();
  };
})();
