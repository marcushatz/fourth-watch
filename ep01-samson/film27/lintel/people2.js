// PP2: the Ep 1 cast, drawn in exactly the style of lintel/people.js (PP.samson / PP.soldier / PP.judean) and reusing
// its helpers. Contract: lintel/PP2_API.md.
//
// Units: the same design units as PP.samson. Feet at the origin (0, 0), y up is negative, Samson's head top at about
// -546 (a 1.86 m man: 1 unit = PP2.U metres). The light comes from the upper left: one cel-shade crescent on the lower
// right of each part, a warm rim on the upper-left edge, dark warm outline (#24160F, 2.6 wide), mitten-like hands.
// Every drawer is a pure function of its state object (no randomness; any variation is hashed from the state).
//
// Billboards: PP2.SIZES[name] = { cw, ch, worldH, footPx, scale } and the draw callback is always
//   (ctx, st) => { ctx.translate(cw / 2, ch - footPx); ctx.scale(scale, scale); PP2[fn](ctx, st); }
// PP2.bill(name, base) builds exactly that with LW.billboard (bb.userData.update(key, st) merges st over base).
//
// Outputs written back onto the state object (handy for placing props): every Samson pose sets st.headX/headY (head
// centre) and st.hands ([[x, y], [x, y]] wrist points, screen-left first); PP2.delilah 'sit' sets st.lapX/lapY.
// PP2.samsonInfo(st) returns { head, hands } for a state without drawing (PP2.bill passes the drawer a copy of st).
// PP2.ANCHOR: lap (Delilah 'sit'), sleepHead, sleepOnLap (Samson 'sleep' origin relative to Delilah 'sit' origin, both
// on the same floor), prayHands (the pillar contact points for 'pray').
//
// State fields beyond the contract (all optional): st.t (seconds: breathing, tremble, cheer bob, sway), st.k (0..1 pose
// progress: Samson 'burst' arms up, 'wake' shoulder roll, 'push' effort; Delilah 'turn' 0 = facing away .. 1 = face
// turned to camera; barber stroke; lord / person / soldierFall 'fall' topple), st.dir (lord 'laugh' points -1 left /
// 1 right; 'fall' direction), st.incline (Samson 'sleep' torso lift, default 0.46 so his head lands on Delilah's lap),
// st.couch (false: Delilah 'sit' without her couch), st.burn (Samson rope glow, as PP.samson), st.strain (0..1).
// Samson defaults follow the story: 'grind' / 'lookup' / 'pray' / 'push' are blind (closed eyes + cloth band), 'grind'
// and 'wake' are shaved (16:19-21), 'lookup' / 'pray' / 'push' have short regrowth (16:22), 'grind' / 'lookup' are
// shackled. st.hair between 0.3 and 1 removes the seven locks one by one (for the shave in S13).
(function () {
  const PP = globalThis.PP;
  if (!PP) throw new Error('lintel/people2.js needs lintel/people.js loaded first');
  const PP2 = (globalThis.PP2 = {});
  const { part, group, limb, ell, poly, blob, braid, mix } = PP;
  const LINE = '#24160F';
  const P2 = () => new Path2D();
  const D = Math.PI / 180, TAU = Math.PI * 2;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const sm = (k) => { k = clamp(k); return k * k * (3 - 2 * k); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const tp = (M, p) => { const q = M.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; };
  const withM = (ctx, M, fn) => { ctx.save(); ctx.transform(M.a, M.b, M.c, M.d, M.e, M.f); fn(); ctx.restore(); };
  const SIMP = () => PP.simp || 0;   // character simplification level (visual spec v1): 0 full detail .. 3 minimal
  const U_M = 1.86 / 560;                     // metres per design unit (PP.samson: 1400 px at scale 2.5 = 1.86 m)
  PP2.U = U_M;

  // ================= shared geometry =================
  // smooth tapered tube through points (legs, tails): ws = half-widths at each point
  function chain(pts, ws, t = 0.45) {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      L.push([pts[i][0] - ty * ws[i], pts[i][1] + tx * ws[i]]);
      R.push([pts[i][0] + ty * ws[i], pts[i][1] - tx * ws[i]]);
    }
    return blob([...L, ...R.reverse()], t);
  }
  // two-bone IK: shoulder A, target T, bone lengths; the elbow bends toward the pole point
  function ik2(A, T, l1, l2, pole) {
    const dx = T[0] - A[0], dy = T[1] - A[1], d = Math.hypot(dx, dy) || 1e-6, ux = dx / d, uy = dy / d;
    const dd = clamp(d, Math.abs(l1 - l2) + 0.5, (l1 + l2) * 0.9995);
    const a = Math.acos(clamp((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), -1, 1));
    const sg = ux * (pole[1] - A[1]) - uy * (pole[0] - A[0]) >= 0 ? 1 : -1;
    const ang = Math.atan2(uy, ux) + sg * a;
    return [[A[0] + Math.cos(ang) * l1, A[1] + Math.sin(ang) * l1], [A[0] + ux * dd, A[1] + uy * dd]];
  }
  // the body bend: points above the waist follow the lean (rotation about the pivot), the skirt stays with the legs;
  // bt (-1..1) turns the torso a little toward screen right/left; bx/by move the whole body (by > 0: crouch/kneel)
  function mkBend(P) {
    const piv = P.pivot, y0 = piv + 30, y1 = piv - 80, bt = P.bt || 0, cx = 1 - 0.2 * Math.abs(bt), ox = bt * 6;
    const lean = P.lean || 0, bx = P.bx || 0, by = P.by || 0;
    return (x, y) => {
      const w = sm((y0 - y) / (y0 - y1)), a = lean * w, c = Math.cos(a), s = Math.sin(a), X = x * cx + ox, Y = y - piv;
      return [X * c - Y * s + bx, X * s + Y * c + piv + by];
    };
  }
  const upperM = (P) => new DOMMatrix().translate(P.bx || 0, P.pivot + (P.by || 0)).rotate((P.lean || 0) / D).translate(0, -P.pivot);
  const fm = (f, pts) => pts.map(([x, y]) => f(x, y));
  function pathF(f, cmds) {
    const p = P2();
    for (const c of cmds) {
      if (c[0] === 'M') { const a = f(c[1], c[2]); p.moveTo(a[0], a[1]); }
      else if (c[0] === 'L') { const a = f(c[1], c[2]); p.lineTo(a[0], a[1]); }
      else if (c[0] === 'Q') { const a = f(c[1], c[2]), b = f(c[3], c[4]); p.quadraticCurveTo(a[0], a[1], b[0], b[1]); }
      else p.closePath();
    }
    return p;
  }
  function strokeF(ctx, f, pts, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach((q, i) => { const a = f(q[0], q[1]); i ? ctx.lineTo(a[0], a[1]) : ctx.moveTo(a[0], a[1]); }); ctx.stroke(); }

  // ---- hands: mitten shapes in a frame at the wrist W pointing along ang; s = side (+1 screen right) ----
  function handPaths(W, ang, s, kind, k = 1) {
    const m = new DOMMatrix().translate(W[0], W[1]).rotate(ang / D).scale(k, k);
    const add = (p) => { const o = P2(); o.addPath(p, m); return o; };
    let ps;
    if (kind === 'open' || kind === 'cup') {
      const pa = P2(); pa.roundRect(-3, -12, 35, 24, 11);
      ps = [add(pa), add(ell(9, s * 12.5, 10, 5.5, s * 0.55))];
    } else if (kind === 'point') {
      const pa = P2(); pa.roundRect(-2, -14, 28, 28, 10);
      const fi = P2(); fi.roundRect(16, -s * 6 - 5, 30, 10, 5);
      ps = [add(pa), add(fi), add(ell(11, s * 11, 9, 6, s * 0.3))];
    } else {
      const pa = P2(); pa.roundRect(-2, -14, 28, 28, 10);
      ps = [add(pa), add(ell(10, s * 11, 9, 6, s * 0.3))];
    }
    return { paths: ps, m, kind, s };
  }
  function handDetail(ctx, h) {
    if (SIMP() >= 1) return;
    const kx = (u, v) => tp(h.m, [u, v]);
    ctx.strokeStyle = 'rgba(36,22,15,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    const seg = (a, b) => { const p = kx(a[0], a[1]), q = kx(b[0], b[1]); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
    if (h.kind === 'fist') for (const v of [-7, 0, 7]) seg([19, v - 3], [22, v + 2]);
    else if (h.kind === 'point') for (const v of [2, 9]) seg([19, h.s * v - 3], [22, h.s * v + 2]);
    else { seg([21, -4], [30, -4.5]); seg([21, 3.5], [30, 4]); if (h.kind === 'cup') seg([6, -6], [14, -2]); }
  }

  // ---- faces ----
  // one eye (as PP.eyes, per eye so a turned head can narrow the far eye). o: look, iris, closed ('happy' = laughing
  // arcs), lid 0..1 (upper lid lowered), lash (outer flick), kohl (heavier upper line), side
  function eye1(ctx, x, y, rx, ry, o = {}) {
    ctx.strokeStyle = LINE; ctx.lineCap = 'round';
    if (SIMP() >= 2) {   // a dark dot that looks where the figure looks; closed = a short arc
      const look = o.look || [0, 0], r = SIMP() >= 3 ? 2.9 : 3.6, ix = x + look[0] * 2.4, iy = y + look[1] * 1.6 + 0.5;
      if (o.closed) { ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x, y + 3, x + 4, y); ctx.stroke(); return; }
      ctx.fillStyle = '#1E120B'; ctx.beginPath(); ctx.ellipse(ix, iy, r * 0.9, r * 1.15, 0, 0, TAU); ctx.fill();
      if (SIMP() === 2) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ix - 0.9, iy - 1.2, 0.95, 0, TAU); ctx.fill(); }
      return;
    }
    if (o.closed) {
      ctx.lineWidth = 2.5; ctx.beginPath();
      if (o.closed === 'happy') { ctx.moveTo(x - rx, y + 1.5); ctx.quadraticCurveTo(x, y - ry * 1.4, x + rx, y + 1.5); }
      else { ctx.moveTo(x - rx, y - 0.5); ctx.quadraticCurveTo(x, y + ry * 1.05, x + rx, y - 0.5); }
      ctx.stroke();
      if (o.lash && o.closed !== 'happy') { const s = o.side || 1; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + s * rx * 0.95, y - 0.4); ctx.lineTo(x + s * (rx + 4), y + 2.5); ctx.stroke(); }
      return;
    }
    const look = o.look || [0, 0], w = ell(x, y, rx, ry);
    ctx.fillStyle = '#F6EEE2'; ctx.fill(w);
    ctx.save(); ctx.clip(w);
    const ir = o.ir ?? 4.6, ix = x + look[0] * Math.min(3.2, rx * 0.38), iy = y + look[1] * 2 + 0.6;
    ctx.fillStyle = o.iris || '#3A2414'; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.fill();
    ctx.fillStyle = '#120A06'; ctx.beginPath(); ctx.arc(ix, iy, ir * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(ix - 1.5, iy - 1.7, 1.35, 0, TAU); ctx.fill();
    const lid = o.lid || 0;
    if (lid > 0.01) { ctx.fillStyle = o.lidCol || '#B57B52'; ctx.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, ry * 2 * lid + 1); }
    ctx.restore();
    ctx.lineWidth = o.kohl ? 3.2 : 2.6;
    ctx.beginPath();
    if (lid > 0.01) { const ly = y - ry + ry * 2 * lid; ctx.moveTo(x - rx * 0.98, Math.min(y, ly + 1)); ctx.quadraticCurveTo(x, ly - 1.5, x + rx * 0.98, Math.min(y, ly + 1)); }
    else ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.06, Math.PI * 1.94);
    ctx.stroke();
    ctx.lineWidth = 1.1; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.ellipse(x, y, rx * 0.9, ry, 0, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); ctx.globalAlpha = 1;
    if (o.lash) { const s = o.side || 1; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x + s * rx * 0.9, y - ry * 0.45); ctx.quadraticCurveTo(x + s * (rx + 2.5), y - ry * 0.75, x + s * (rx + 5), y - ry * 1.25); ctx.stroke(); }
  }
  // one brow (as PP.brows); k narrows it for the far side of a turned head; furrow < 0 lifts the inner end (pleading)
  function brow1(ctx, cx, cy, s, o = {}) {
    if (SIMP() >= 3 || (SIMP() >= 2 && Math.abs(o.furrow || 0) < 0.5)) return;   // simplified: a brow only when it carries the expression
    if (SIMP() >= 2) o = Object.assign({}, o, { th: (o.th ?? 5) * 0.6 });
    const f = o.furrow || 0, lift = o.lift || 0, th = o.th ?? 5, sp = o.sp ?? 15, k = o.k ?? 1;
    const ix = cx + s * (sp - 9 + f * 2) * k, ox = cx + s * (sp + 11) * k;
    const iy = cy + f * 3.5 - lift, oy = cy - 3 - lift * 0.6 - f * 0.5 - (o.arch || 0);
    const p = P2(); p.moveTo(ix, iy + th * 0.5); p.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) - th * 0.9 - (o.arch || 0), ox, oy + th * 0.25); p.quadraticCurveTo((ix + ox) / 2, Math.min(iy, oy) - th * 0.1 + th * 0.6 - (o.arch || 0) * 0.7, ix, iy + th * 0.5 + th * 0.4); p.closePath();
    ctx.fillStyle = o.col || '#24150D'; ctx.fill(p);
  }
  // mouths: kind 'neutral' | 'flat' | 'smile' | 'half' | 'grin' | 'open' | 'laugh' | 'o' | 'part' | 'frown' | 'grit' | 'whisper'
  function mouthG(ctx, x, y, kind, o = {}) {
    if (SIMP() >= 3) return;
    if (SIMP() >= 2) {   // a mouth only when it is open (a cry, a shout, a gasp): a small dark shape, no lips or teeth
      if (['open', 'laugh', 'grin', 'o', 'part', 'whisper'].includes(kind)) { const w = (o.w ?? 9) * (kind === 'o' || kind === 'part' ? 0.45 : 0.6); ctx.fillStyle = '#4A2016'; ctx.beginPath(); ctx.ellipse(x, y + 2, w, kind === 'part' || kind === 'whisper' ? 2.2 : 4, 0, 0, TAU); ctx.fill(); }
      return;
    }
    const w = o.w ?? 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = LINE;
    const lips = o.lip;
    if (kind === 'open' || kind === 'laugh' || kind === 'grin') {
      const ww = kind === 'laugh' ? w * 1.25 : w, h = kind === 'laugh' ? 11 : kind === 'grin' ? 5.5 : (o.h ?? 8);
      const p = P2(); p.moveTo(x - ww, y - 1); p.quadraticCurveTo(x, y - (kind === 'open' ? 4 : 1), x + ww, y - 1); p.quadraticCurveTo(x + ww * 0.75, y + h * 1.5, x, y + h * 1.45); p.quadraticCurveTo(x - ww * 0.75, y + h * 1.5, x - ww, y - 1); p.closePath();
      ctx.fillStyle = '#4A1E14'; ctx.fill(p);
      ctx.save(); ctx.clip(p); ctx.fillStyle = '#F3E9DA'; ctx.fillRect(x - ww, y - 6, ww * 2, kind === 'grin' ? 9 : 5.5); if (kind !== 'grin') { ctx.fillStyle = '#9A4A3A'; ctx.beginPath(); ctx.ellipse(x, y + h * 1.5, ww * 0.6, h * 0.55, 0, 0, TAU); ctx.fill(); } ctx.restore();
      ctx.lineWidth = 2; ctx.stroke(p);
      if (lips) { ctx.strokeStyle = lips; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.6; ctx.stroke(p); ctx.globalAlpha = 1; }
      return;
    }
    if (kind === 'o') { const p = ell(x, y + 2, w * 0.42, w * 0.55); part(ctx, p, '#4A1E14', { lw: 1.8 }); return; }
    if (kind === 'part' || kind === 'whisper') { const p = ell(x, y + 1, kind === 'whisper' ? w * 0.38 : w * 0.6, kind === 'whisper' ? 3.6 : 2.6); part(ctx, p, '#5A2418', { lw: 1.6 }); return; }
    if (kind === 'grit') {
      const p = P2(); p.moveTo(x - w, y - 1); p.quadraticCurveTo(x, y - 5, x + w, y - 1); p.lineTo(x + w - 1, y + 4); p.quadraticCurveTo(x, y + 7, x - w + 1, y + 4); p.closePath();
      part(ctx, p, '#F3E9DA', { lw: 1.8 }); ctx.strokeStyle = 'rgba(36,22,15,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - w + 1, y + 1.5); ctx.lineTo(x + w - 1, y + 1.5); ctx.stroke(); return;
    }
    // closed mouths: optional coloured lips first
    const curve = kind === 'smile' ? 4.5 : kind === 'frown' ? -3.5 : kind === 'flat' ? 0 : 1.2;
    if (lips) {
      const p = P2(); p.moveTo(x - w, y); p.quadraticCurveTo(x - w * 0.45, y - 3.4, x, y - 1.6); p.quadraticCurveTo(x + w * 0.45, y - 3.4, x + w, y); p.quadraticCurveTo(x, y + 6 + curve * 0.4, x - w, y); p.closePath();
      ctx.fillStyle = lips; ctx.fill(p); ctx.strokeStyle = 'rgba(36,22,15,0.35)'; ctx.lineWidth = 1.1; ctx.stroke(p); ctx.strokeStyle = LINE;
    }
    ctx.lineWidth = 2.2; ctx.beginPath();
    if (kind === 'half') { ctx.moveTo(x - w * 0.8, y + 0.6); ctx.quadraticCurveTo(x + w * 0.15, y + 3.2, x + w, y - 3); }
    else { ctx.moveTo(x - w * (lips ? 0.9 : 0.85), y + (curve < 0 ? 2 : 0)); ctx.quadraticCurveTo(x, y + curve * 1.2 + (curve < 0 ? 1 : 0), x + w * (lips ? 0.9 : 0.85), y + (curve < 0 ? 2 : 0)); }
    ctx.stroke();
    if (kind === 'smile' && !lips) { ctx.lineWidth = 1.6; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + s * w * 0.95, y - 1.5); ctx.lineTo(x + s * w * 0.8, y + 1); ctx.stroke(); } }
  }

  // ================= SAMSON =================
  const SK = { base: '#C68A5E', shade: '#9E6A45', rim: '#F2C69A' };
  const HAIR = { base: '#2C1B12', hi: '#5A3C26' };
  const TUN = { base: '#4D6386', shade: '#384A68', trim: '#EADCC0', stripe: '#9B5A3A' };
  const ROPE = { base: '#CDB27E', dark: '#8E744A' };
  const BRONZE = { base: '#B07A3C', shade: '#76501F', hi: '#EAC27E', dark: '#5A3C18' };
  const BAND = { base: '#3A312B', shade: '#211B17' };
  // the seven locks: anchor on the head (head-local), mid + end at rest (body). 0-2 hang behind, 3-6 in front.
  const LOCKS = [
    { a: [-40, 18], c: [-66, -430], b: [-76, -322], back: 1, s: -1, w: 11 },
    { a: [42, 18], c: [66, -432], b: [80, -326], back: 1, s: 1, w: 11 },
    { a: [36, 14], c: [54, -440], b: [62, -300], back: 1, s: 1, w: 10 },
    { a: [-34, 20], c: [-58, -428], b: [-48, -318], s: -1, w: 10.5 },
    { a: [-26, 24], c: [-40, -420], b: [-30, -330], s: -1, w: 10.5 },
    { a: [26, 24], c: [40, -420], b: [30, -332], s: 1, w: 10.5 },
    { a: [34, 20], c: [58, -428], b: [50, -320], s: 1, w: 10.5 },
  ];
  const SHAVE_ORDER = [3, 6, 4, 5, 0, 1, 2];            // the order the razor takes the locks as st.hair goes 1 -> 0.3
  const BLIND_POSES = { grind: 1, lookup: 1, pray: 1, push: 1 };
  PP2.SAMSON_POSES = ['stand', 'walk', 'carry', 'point', 'lean', 'sleep', 'wake', 'strain', 'burst', 'grind', 'lookup', 'pray', 'push'];

  function samPose(st) {
    const pose = st.pose || 'stand', t = st.t || 0, ph = st.phase ?? t * 5.5;
    const P = {
      pose, t, pivot: -268, lean: 0, bx: 0, by: 0, bt: 0, shUp: 0, breath: Math.sin(t * 2.2) * 1.5, strain: 0, burst: 0, tremble: 0, bulge: 1,
      arms: { '-1': { A: 8, B: -4, hand: 'fist' }, '1': { A: 8, B: -4, hand: 'fist' } },
      feet: { '-1': [-25, 0], '1': [25, 0] }, knee: { '-1': 0, '1': 0 },
      head: { tilt: 0, turn: 0, pitch: 0, look: st.look || [0, 0], mouth: 'neutral', furrow: 0, lift: 0, squint: 0 },
    };
    const H = P.head;
    const walkLegs = (amp) => {
      const s1 = Math.sin(ph);
      for (const s of [-1, 1]) { const lift = Math.max(0, -s * s1) * amp; P.feet[s] = [s * 24, -lift]; P.knee[s] = s * lift * 0.42; }
      P.by += -Math.abs(s1) * 3 + 2; P.lean += s1 * 0.012;
      return s1;
    };
    switch (pose) {
      case 'walk': {
        const s1 = walkLegs(26);
        for (const s of [-1, 1]) { const fw = Math.max(0, s * s1); P.arms[s] = { A: 8 + fw * 3, B: -4 - fw * 24, l2k: 1 - fw * 0.1, hand: 'fist' }; }
        H.tilt = -s1 * 0.02; break;
      }
      case 'carry': {
        walkLegs(16); P.by += 7; P.shUp = 7;
        for (const s of [-1, 1]) P.arms[s] = { T: [s * 150, -446], pole: [s * 260, -250], hand: 'fist', hdir: -90 + s * 6 };
        Object.assign(H, { pitch: 0.14, furrow: 0.55, mouth: 'grit', squint: 0.25 }); break;
      }
      case 'point': {
        P.lean = 0.04; P.feet = { '-1': [-24, 0], '1': [38, 0] };
        P.arms[1] = { T: [292, -452], pole: [180, -300], hand: 'point', hdir: -6 };
        P.arms[-1] = { A: 12, B: -18, hand: 'fist' };
        Object.assign(H, { turn: 0.42, pitch: -0.22, tilt: 0.05, look: st.look || [1, -0.3], mouth: 'grin', lift: 3 }); break;
      }
      case 'lean': {
        P.lean = 0.17; P.bt = 0.25; P.feet = { '-1': [-30, 0], '1': [30, 0] };
        P.arms[-1] = { T: [-34, -412], pole: [-120, -200], hand: 'open', hdir: -80, front: 1, l1k: 0.6, l2k: 0.95 };
        P.arms[1] = { A: 14, B: -22, hand: 'fist' };
        Object.assign(H, { turn: 0.5, tilt: 0.14, pitch: 0.08, look: st.look || [1, 0.25], mouth: 'whisper', lift: 1 }); break;
      }
      case 'sleep': {
        P.lean = -(st.incline ?? 0.46); P.pivot = -250; P.breath = Math.sin(t * 1.4) * 1.2;
        P.feet = { '-1': [-36, -14], '1': [26, 0] }; P.knee = { '-1': -16, '1': 0 };
        P.arms[-1] = { T: [8, -300], pole: [-220, -300], hand: 'open' };
        P.arms[1] = { T: [34, -330], pole: [-120, -300], hand: 'open', behind: 1 };
        Object.assign(H, { closed: true, mouth: 'flat', tilt: 0.1, pitch: 0.05 }); break;
      }
      case 'wake': {
        const k = st.k ?? (0.5 + 0.5 * Math.sin(t * 1.6)), roll = Math.sin(k * Math.PI);
        P.shUp = roll * 9 - 2; P.breath += roll * 2.5; P.feet = { '-1': [-31, 0], '1': [31, 0] };
        for (const s of [-1, 1]) P.arms[s] = { A: 11 + roll * 6, B: -8 + roll * 5, hand: 'fist' };
        Object.assign(H, { pitch: -0.12, tilt: -0.05 * roll, mouth: 'half', lift: 2, look: st.look || [0.25, 0] }); break;
      }
      case 'strain': {
        const s0 = st.strain ?? 1; P.strain = s0; P.tremble = s0 * 1.6; P.shUp = 3 * s0;
        for (const s of [-1, 1]) P.arms[s] = { A: 8 + 3 * s0, B: -4, hand: 'fist' };
        Object.assign(H, { mouth: s0 > 0.3 ? 'grit' : 'neutral', furrow: s0, squint: s0 * 0.5 });
        if ((st.bonds || 'rope') === 'loom') H.pitch = -0.12 * (1 - (st.brk || 0));
        break;
      }
      case 'burst': {
        const k = st.k ?? 1; P.burst = k; P.strain = 1; P.shUp = 3 * (1 - k) + 4 * k; P.tremble = 1.6 * (1 - k); P.breath += k * 3;
        for (const s of [-1, 1]) P.arms[s] = { A: 11 + 118 * k, B: -4 + 42 * k, hand: 'fist' };
        Object.assign(H, { mouth: 'grit', furrow: 1 - k * 0.6, lift: k * 2, squint: 0.5 * (1 - k) }); break;
      }
      case 'grind': {
        P.lean = 0.36; P.bt = 0.45; P.pivot = -262; P.by = 20; P.bulge = 1.3;
        P.feet = { '-1': [-112, 0], '1': [64, 0] }; P.knee = { '-1': 0, '1': 20 };
        const sway = Math.sin(t * 2.4) * 4;
        P.arms[-1] = { Tw: [214 + sway, -300], pole: [100, -150], hand: 'fist', behind: 1 };
        P.arms[1] = { Tw: [230 + sway, -296], pole: [160, -150], hand: 'fist' };
        Object.assign(H, { turn: 0.55, pitch: 0.35, tilt: 0.04, mouth: 'frown', furrow: 0.7 }); break;
      }
      case 'lookup': {
        for (const s of [-1, 1]) P.arms[s] = { T: [s * 20, -262], pole: [s * 200, -250], hand: 'fist' };
        Object.assign(H, { pitch: -0.6, turn: -0.28, tilt: -0.12, mouth: 'part', lift: 2, furrow: -0.5 }); break;
      }
      case 'pray': {
        P.feet = { '-1': [-30, 0], '1': [30, 0] };
        for (const s of [-1, 1]) P.arms[s] = { T: [s * 176, -408], pole: [s * 120, -250], hand: 'open', hdir: -90 + s * 4 };
        Object.assign(H, { pitch: st.pitch ?? -0.5, turn: -0.12, tilt: -0.06, mouth: 'part', furrow: -0.6, lift: 2 }); break;
      }
      case 'push': {
        const e = st.k ?? 1;
        P.shUp = 10 * e; P.by = 16 * e; P.bulge = 1.6; P.tremble = 1.3 * e; P.strain = e;
        P.feet = { '-1': [-46, 0], '1': [46, 0] }; P.knee = { '-1': -16 * e, '1': 16 * e };
        for (const s of [-1, 1]) P.arms[s] = { T: [s * 184, -398 + 6 * e], pole: [s * 150, -200], hand: 'open', hdir: -90 + s * 12 };
        Object.assign(H, { pitch: 0.55 * e, tilt: 0.03, mouth: 'grit', furrow: 1, squint: 0.4 }); break;
      }
      default: { // 'stand'
        const sw = Math.sin(t * 1.1) * 0.8;
        for (const s of [-1, 1]) P.arms[s] = { A: 8 + sw * s * 0.5, B: -4, hand: 'fist' };
      }
    }
    // defaults: the blind poses are the prisoner (16:21-30)
    const blindPose = !!BLIND_POSES[pose];
    P.blind = st.blind ?? blindPose;
    P.hair = clamp(st.hair ?? (pose === 'grind' || pose === 'wake' ? 0 : blindPose ? 0.25 : 1));   // he wakes already shaved (16:19-20)
    P.shackles = st.shackles ?? (pose === 'grind' || pose === 'lookup');
    P.bonds = (pose === 'strain' || pose === 'burst') ? (st.bonds || 'rope') : 'none';
    P.brk = clamp(st.brk || 0);
    if (P.blind) H.closed = true;
    return P;
  }

  // Samson's head (port of PP.samson's, plus turn / pitch / blind band / hair length); head-local, centre (0, 0)
  function samHead(ctx, P, gold, rimA) {
    const H = P.head, tn = clamp(H.turn || 0, -1, 1), pc = clamp(H.pitch || 0, -1, 1), fx = tn * 13, fy = pc * 13;
    const skRim = mix(SK.rim, '#FFE29A', gold);
    part(ctx, poly([[-17, 22], [17, 22], [21, 66], [-21, 66]]), SK.base, { shade: SK.shade, sd: 10 });
    for (const s of [-1, 1]) if (s * tn > -0.5) part(ctx, ell(s * 37 - tn * 5, -2 + fy * 0.4, 7, 11), SK.base, { shade: SK.shade, sd: 3, lw: 2 });
    const face = blob([[-37, -18], [-36, 14], [-28, 38], [-12, 50], [0, 52], [12, 50], [28, 38], [36, 14], [37, -18], [26, -44], [0, -50], [-26, -44]], 0.5);
    part(ctx, face, SK.base, { shade: SK.shade, sd: 7, rim: skRim, rimA, rd: 3 });
    ctx.save(); ctx.clip(face); ctx.fillStyle = 'rgba(200,90,60,0.16)'; ctx.beginPath(); ctx.ellipse(-22 + fx, 12 + fy, 9, 6, 0, 0, TAU); ctx.ellipse(22 + fx, 12 + fy, 9, 6, 0, 0, TAU); ctx.fill(); ctx.restore();
    // beard: the opening round the mouth follows the turn / pitch
    const bpts = [[-38, -8], [-36, 22], [-28, 50], [-14, 70], [0, 76], [14, 70], [28, 50], [36, 22], [38, -8], [30, 4], [22, 22], [12, 26], [0, 24], [-12, 26], [-22, 22], [-30, 4]]
      .map(([x, y], i) => { const inner = i >= 9, k = inner ? 0.9 : clamp((y + 8) / 84) * 0.5, up = Math.min(0, pc) * 0.32 * clamp((y - 20) / 56); return [x + fx * k, y + fy * (inner ? 1 : 0.5 * clamp((y + 8) / 84)) + up * (y - 20)]; });
    const beard = blob(bpts, 0.45);
    part(ctx, beard, HAIR.base, { shade: '#150C08', sd: 5, rim: mix(HAIR.hi, '#FFD27A', gold * 0.6), rimA: 0.9, rd: 2.5 });
    ctx.save(); ctx.clip(beard); ctx.strokeStyle = '#4A3020'; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8;
    for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 7 + fx * 0.6, 32 + fy); ctx.quadraticCurveTo(i * 8 + fx * 0.4, 50, i * 6 + (i > 0 ? 2 : -2) + fx * 0.3, 68); ctx.stroke(); }
    ctx.restore();
    // mouth
    const mx = fx, my = fy;
    const m = H.mouth || 'neutral';
    if (m === 'grit') {
      const mw = 12; const p = P2(); p.moveTo(-mw + mx, 34 + my); p.quadraticCurveTo(mx, 30 + my, mw + mx, 34 + my); p.lineTo(mw - 1 + mx, 39 + my); p.quadraticCurveTo(mx, 42 + my, -mw + 1 + mx, 39 + my); p.closePath();
      part(ctx, p, '#F3E9DA', { lw: 1.8 }); ctx.strokeStyle = 'rgba(36,22,15,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-mw + 1 + mx, 36.5 + my); ctx.lineTo(mw - 1 + mx, 36.5 + my); ctx.stroke();
    } else if (m === 'neutral' || m === 'flat') {
      const mw = 10, p = P2(); p.moveTo(-mw + mx, 35 + my); p.quadraticCurveTo(mx, m === 'flat' ? 36.5 + my : 38 + my, mw + mx, 35 + my); p.quadraticCurveTo(mx, 40 + my, -mw + mx, 35 + my); p.closePath();
      part(ctx, p, '#7A3E2C', { lw: 1.6 });
    } else if (m === 'half') {
      const p = P2(); p.moveTo(-9 + mx, 36 + my); p.quadraticCurveTo(2 + mx, 39.5 + my, 12 + mx, 32.5 + my); p.quadraticCurveTo(3 + mx, 42 + my, -9 + mx, 36 + my); p.closePath();
      part(ctx, p, '#7A3E2C', { lw: 1.6 });
    } else if (m === 'grin') {
      const p = P2(); p.moveTo(-12 + mx, 33 + my); p.quadraticCurveTo(mx, 37 + my, 12 + mx, 33 + my); p.quadraticCurveTo(mx, 47 + my, -12 + mx, 33 + my); p.closePath();
      ctx.fillStyle = '#4A1E14'; ctx.fill(p); ctx.save(); ctx.clip(p); ctx.fillStyle = '#F3E9DA'; ctx.fillRect(-13 + mx, 31 + my, 26, 6.5); ctx.restore(); ctx.strokeStyle = LINE; ctx.lineWidth = 1.8; ctx.stroke(p);
    } else mouthG(ctx, mx, 34 + my, m, { w: 9 });
    // mustache
    const mus = P2(); mus.moveTo(-2 + mx, 22 + my); mus.quadraticCurveTo(-14 + mx, 20 + my, -21 + mx, 34 + my); mus.quadraticCurveTo(-12 + mx, 30 + my, -2 + mx, 29 + my); mus.moveTo(2 + mx, 22 + my); mus.quadraticCurveTo(14 + mx, 20 + my, 21 + mx, 34 + my); mus.quadraticCurveTo(12 + mx, 30 + my, 2 + mx, 29 + my);
    part(ctx, mus, HAIR.base, { lw: 1.6 });
    // nose
    const nx = fx * 1.1, ny = fy * 0.8, tip = tn * 4;
    const nose = P2(); nose.moveTo(-1 + nx, -6 + ny); nose.quadraticCurveTo(-3 + nx, 8 + ny, -7 + nx + tip, 15 + ny); nose.quadraticCurveTo(nx + tip, 21 + ny, 8 + nx + tip, 16 + ny); nose.quadraticCurveTo(5 + nx, 6 + ny, 3 + nx, -6 + ny); nose.closePath();
    ctx.fillStyle = SK.shade; ctx.globalAlpha = 0.55; ctx.fill(nose); ctx.globalAlpha = 1;
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(4 + nx, -4 + ny); ctx.quadraticCurveTo(7 + nx + tip, 8 + ny, 9 + nx + tip, 14 + ny); ctx.quadraticCurveTo(3 + nx + tip, 20 + ny, -5 + nx + tip, 16 + ny); ctx.stroke();
    // eyes + brows
    const look = H.look || [0, 0];
    for (const s of [-1, 1]) {
      const far = clamp(-s * tn), x = fx + s * 15 * (1 - 0.12 * Math.abs(tn));
      eye1(ctx, x, -6 + fy, 8.6 * (1 - 0.3 * far), 5.8 * (1 - (H.squint || 0) * 0.35), { look, closed: H.closed, side: s, lidCol: SK.base });
      brow1(ctx, fx, -17 + fy - (P.blind ? 4 : 0), s, { furrow: H.furrow || 0, lift: H.lift || 0, th: 5.4, col: '#1E120B', sp: 15, k: 1 - 0.3 * far });
    }
    // hair: full cap (long hair), or shaved scalp / short regrowth (st.hair <= 0.3)
    const hl = (pts) => pts.map(([x, y], i) => i >= 9 ? [x + fx * 0.5, y + fy * 0.8] : [x, y]);
    if (P.hair > 0.3) {
      const cap = blob(hl([[-41, -6], [-42, -30], [-32, -50], [-12, -60], [0, -60], [12, -60], [32, -50], [42, -30], [41, -6], [36, -18], [28, -34], [12, -38], [0, -36], [-12, -38], [-28, -34], [-36, -18]]), 0.5);
      part(ctx, cap, HAIR.base, { shade: '#150C08', sd: 5, rim: mix(HAIR.hi, '#FFD27A', gold), rimA: 0.9, rd: 3 });
      ctx.strokeStyle = '#4A3020'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(fx * 0.5, -58); ctx.quadraticCurveTo(-2 + fx * 0.5, -48, fx * 0.5, -37 + fy * 0.8); ctx.stroke();
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * (6 + k * 9) + fx * 0.5, -54 + k * 2); ctx.quadraticCurveTo(s * (14 + k * 10) + fx * 0.3, -46, s * (24 + k * 6) + fx * 0.15, -30 + k * 6); ctx.stroke(); }
    } else {
      const g = P.hair / 0.3;
      const scalp = blob(hl([[-40, -6], [-40, -29], [-31, -48], [-12, -56], [0, -57], [12, -56], [31, -48], [40, -29], [40, -6], [36, -18], [28, -34], [12, -38], [0, -36], [-12, -38], [-28, -34], [-36, -18]]), 0.5);
      const sc = mix(mix(SK.base, '#DCA680', 0.45), HAIR.base, g * 0.82);
      part(ctx, scalp, sc, { shade: mix(SK.shade, '#150C08', g * 0.85), sd: 5, rim: mix(skRim, HAIR.hi, g), rimA: rimA * (1 - g * 0.2), rd: 3, lw: 2.2 });
      ctx.save(); ctx.clip(scalp); ctx.fillStyle = HAIR.base; ctx.globalAlpha = 0.18 + 0.55 * g;
      const sz = 0.9 + g * 1.8;
      for (let i = 0; i < 90; i++) { const x = -40 + hash(i) * 80, y = -57 + hash(i + 77) * 50; ctx.beginPath(); ctx.arc(x, y, sz, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // the blind band (16:21): a strip of dark cloth over closed eyes, knotted on the far side. No wounds.
    if (P.blind) {
      const y = -6 + fy, cxm = fx * 0.6, kx = tn >= 0 ? -1 : 1;
      const band = P2(); band.moveTo(-43, y - 9); band.quadraticCurveTo(cxm, y - 14, 43, y - 9); band.lineTo(43, y + 8); band.quadraticCurveTo(cxm, y + 12, -43, y + 8); band.closePath();
      part(ctx, band, BAND.base, { shade: BAND.shade, sd: 4, lw: 2.2 });
      ctx.save(); ctx.clip(band); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-40, y + 1); ctx.quadraticCurveTo(cxm, y - 2, 40, y + 1); ctx.stroke(); ctx.restore();
      const tail = (dx, len) => { const p = P2(); p.moveTo(kx * 42, y); p.quadraticCurveTo(kx * (48 + dx), y + len * 0.5, kx * (46 + dx * 1.6), y + len); p.lineTo(kx * (40 + dx * 1.6), y + len - 2); p.quadraticCurveTo(kx * (42 + dx), y + len * 0.5, kx * 38, y + 2); p.closePath(); return p; };
      part(ctx, tail(4, 30), BAND.base, { shade: BAND.shade, sd: 2, lw: 1.8 });
      part(ctx, tail(10, 24), BAND.base, { shade: BAND.shade, sd: 2, lw: 1.8 });
      part(ctx, ell(kx * 42, y, 6.5, 8), BAND.base, { shade: BAND.shade, sd: 2, lw: 1.8 });
    }
  }

  function samArm(ctx, a, skin, P) {
    const { s, J, E, W } = a, o = a.a;
    const ang = o.hdir != null ? o.hdir * D : Math.atan2(W[1] - E[1], W[0] - E[0]);
    const h = handPaths(W, ang, s, o.hand || 'fist', 1);
    const b = P.bulge || 1, up = E[1] < J[1] - 20 ? -1 : 1;
    group(ctx, [[ell(J[0] + s * 4, J[1] + 6, 24, 25), SK.base, skin], [limb(J, E, 20, 15, 7 * b, s * up), SK.base, skin], [limb(E, W, 16, 12, 5 * b, s), SK.base, skin], ...h.paths.map((p) => [p, SK.base, skin])]);
    handDetail(ctx, h);
    if (P.shackles) a.ring = cuff(ctx, E, W, 13);
  }
  // bronze shackle round the wrist; returns the ring point the chain hangs from
  function cuff(ctx, E, W, r) {
    const ang = Math.atan2(W[1] - E[1], W[0] - E[0]), c = lerp2(E, W, 0.84);
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(ang);
    const p = P2(); p.roundRect(-7, -r - 4, 14, 2 * r + 8, 5);
    part(ctx, p, BRONZE.base, { shade: BRONZE.shade, sd: 3, rim: BRONZE.hi, rimA: 0.85, rd: 2, lw: 2.2 });
    ctx.strokeStyle = BRONZE.dark; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -r - 2); ctx.lineTo(0, r + 2); ctx.stroke();
    ctx.restore();
    return c;
  }
  // a short bronze chain: links along a sagging curve from A to B
  function chainLinks(ctx, A, B, sag) {
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + sag];
    const L = Math.hypot(B[0] - A[0], B[1] - A[1]) + Math.abs(sag), n = Math.max(3, Math.round(L / 9));
    for (let i = 0; i <= n; i++) {
      const k = i / n, q = [(1 - k) * (1 - k) * A[0] + 2 * (1 - k) * k * M[0] + k * k * B[0], (1 - k) * (1 - k) * A[1] + 2 * (1 - k) * k * M[1] + k * k * B[1]];
      const dq = [2 * (1 - k) * (M[0] - A[0]) + 2 * k * (B[0] - M[0]), 2 * (1 - k) * (M[1] - A[1]) + 2 * k * (B[1] - M[1])], an = Math.atan2(dq[1], dq[0]);
      if (i % 2) { ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(an); ctx.fillStyle = BRONZE.dark; ctx.fillRect(-5.5, -2, 11, 4); ctx.restore(); }
      else part(ctx, ell(q[0], q[1], 6.5, 4.4, an), BRONZE.base, { shade: BRONZE.shade, sd: 1.5, lw: 1.6 });
    }
  }
  function dangle(ctx, A, n, sway) { let p = A; for (let i = 0; i < n; i++) { const q = [p[0] + sway * (i + 1) * 0.6, p[1] + 9]; chainLinks(ctx, p, q, 0); p = q; } }

  function samLegs(ctx, P, f, skin) {
    for (const s of [-1, 1]) {
      const F = P.feet[s], kn = P.knee[s] || 0;
      const Hh = f(s * 24, -206), A = [F[0], F[1] - 18];
      const K = [lerp(Hh[0], A[0], 0.45) + s * 2.5 + kn, lerp(Hh[1], A[1], 0.45) - Math.abs(kn) * 0.15];
      const M1 = lerp2(Hh, K, 0.5), C1 = [lerp(K[0], A[0], 0.3) + s * 1.5, lerp(K[1], A[1], 0.3)], C2 = lerp2(K, A, 0.64);
      part(ctx, chain([Hh, M1, K, C1, C2, A], [14, 14.5, 16, 15, 10.5, 7.5]), SK.base, skin);
      const lifted = F[1] < -3, ft = lifted ? -s * 0.18 : 0;
      part(ctx, ell(F[0] + s * 4, F[1] - 7, 19, lifted ? 7 : 8, ft), '#6B4A33', { shade: '#4A3122', sd: 3 });
      // ankle straps follow the shin
      const sa = Math.atan2(C2[1] - A[1], C2[0] - A[0]) + Math.PI / 2;
      ctx.save(); ctx.translate(A[0], A[1]); ctx.rotate(sa); ctx.strokeStyle = '#5A3C26'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-9, 2 - k * 14); ctx.lineTo(9, -6 - k * 14); ctx.stroke(); }
      ctx.restore();
      part(ctx, ell(F[0] + s * 6, F[1] - 10, 9, 5, ft), SK.base, { lw: 1.6 });
    }
  }

  // bonds for strain / burst: 'rope' (as PP.samson), 'bowstring' (fresh sinew cords), 'loom' (hair woven into a web)
  function ropeBand(x0, y0, x1, y1, sag, w) { const p = P2(); const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag, ny = w / 2; p.moveTo(x0, y0 - ny); p.quadraticCurveTo(mx, my - ny, x1, y1 - ny); p.lineTo(x1, y1 + ny); p.quadraticCurveTo(mx, my + ny, x0, y0 + ny); p.closePath(); return p; }
  function drawRopes(ctx, P, st) {
    const brk = P.brk, burn = clamp(st.burn || 0);
    const coilsA = [-372, -356, -340].map((y) => [y, 100]), coilsB = [-266, -251].map((y) => [y, 104]);
    const ropeCol = mix(mix(ROPE.base, '#FFC870', burn), '#FFE7A8', Math.max(0, burn - 0.6) * 1.6);
    const drawRope = (path, x0, y0, x1, y1, sag) => {
      if (burn > 0.05) { ctx.save(); ctx.shadowColor = `rgba(255,190,90,${0.9 * burn})`; ctx.shadowBlur = 26 * burn; ctx.fillStyle = ropeCol; ctx.fill(path); ctx.restore(); }
      part(ctx, path, ropeCol, { shade: mix(ROPE.dark, '#E08A3A', burn), sd: 3, lw: 2 });
      ctx.save(); ctx.clip(path); ctx.strokeStyle = mix(ROPE.dark, '#C2502E', burn); ctx.lineWidth = 1.6;
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 6));
      for (let i = 0; i <= n; i++) { const k = i / n, x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k + sag * 4 * k * (1 - k); ctx.beginPath(); ctx.moveTo(x - 3, y - 6); ctx.lineTo(x + 3, y + 6); ctx.stroke(); }
      ctx.restore();
    };
    if (brk <= 0) {
      for (const [y, hw] of coilsA) drawRope(ropeBand(-hw, y - 2, hw, y - 2, 9, 11), -hw, y - 2, hw, y - 2, 9);
      drawRope(ropeBand(-82, -336, -86, -268, 0, 9), -82, -336, -86, -268, 0);
      drawRope(ropeBand(82, -336, 86, -268, 0, 9), 82, -336, 86, -268, 0);
      for (const [y, hw] of coilsB) drawRope(ropeBand(-hw, y - 2, hw, y - 2, 8, 11), -hw, y - 2, hw, y - 2, 8);
      drawRope(ropeBand(8, -258, 16, -204, 4, 8), 8, -258, 16, -204, 4);
      drawRope(ropeBand(2, -258, -6, -214, -3, 8), 2, -258, -6, -214, -3);
      part(ctx, ell(5, -258, 12, 9), ropeCol, { shade: ROPE.dark, sd: 3, lw: 2 });
      return;
    }
    const pieces = [];
    for (const [y, hw] of coilsA) for (let i = 0; i < 4; i++) pieces.push({ x: -hw + (i + 0.5) * hw / 2, y: y - 2, len: hw / 2 - 2, seed: y * 7 + i });
    for (const [y, hw] of coilsB) for (let i = 0; i < 4; i++) pieces.push({ x: -hw + (i + 0.5) * hw / 2, y: y - 2, len: hw / 2 - 2, seed: y * 5 + i * 3 });
    const fly = 1 - Math.pow(1 - brk, 2.2), glow = burn > 0.05;
    for (const pc of pieces) {
      const r1 = hash(pc.seed), r2 = hash(pc.seed + 31.7), dir = Math.sign(pc.x) || (r1 < 0.5 ? -1 : 1);
      const vx = dir * (60 + r1 * 120) + pc.x * 0.6, vy = -40 - r2 * 120;
      const x = pc.x + vx * fly, y = pc.y + vy * fly + 160 * fly * fly, rot = (r1 - 0.5) * 5 * fly;
      const a = Math.max(0, 1 - Math.pow(brk, 1.3)), L = pc.len * (1 - brk * 0.6);
      if (a <= 0.02) continue;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
      const p = ropeBand(-L / 2, 0, L / 2, 0, 0, 10 * (1 - brk * 0.5));
      if (glow) { ctx.shadowColor = 'rgba(255,170,70,0.9)'; ctx.shadowBlur = 16; ctx.fillStyle = mix(mix(ROPE.base, '#FFB860', 0.6), '#7A4A2A', brk); ctx.fill(p); ctx.shadowBlur = 0; ctx.fillStyle = '#FFE6A0'; for (const e of [-L / 2, L / 2]) { ctx.beginPath(); ctx.arc(e, 0, 5.5 * (1 - brk * 0.5), 0, TAU); ctx.fill(); } ctx.strokeStyle = 'rgba(120,40,10,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(p); }
      else { part(ctx, p, ROPE.base, { shade: ROPE.dark, sd: 2.5, lw: 1.8 }); ctx.strokeStyle = ROPE.dark; ctx.lineWidth = 1.6; for (const e of [-L / 2, L / 2]) { ctx.beginPath(); ctx.moveTo(e, -5); ctx.lineTo(e + Math.sign(e) * 5, -8); ctx.moveTo(e, 5); ctx.lineTo(e + Math.sign(e) * 5, 8); ctx.stroke(); } }
      ctx.restore();
    }
  }
  const SINEW = { base: '#D9C9A6', dark: '#9C8A66', hi: '#F4EAD2' };
  function drawBowstrings(ctx, P) {
    const brk = P.brk, loops = [[-374, 102, 7], [-354, 104, 8], [-336, 104, 9], [-268, 106, 7], [-252, 106, 8]];
    const cord = (pts, a) => {
      ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc); } const L = pts[pts.length - 1]; ctx.lineTo(L[0], L[1]); };
      path(); ctx.strokeStyle = LINE; ctx.lineWidth = 7.4; ctx.stroke();
      path(); ctx.strokeStyle = SINEW.base; ctx.lineWidth = 4.2; ctx.stroke();
      ctx.translate(-0.8, -0.9); path(); ctx.strokeStyle = SINEW.hi; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.restore();
    };
    if (brk <= 0) {
      loops.forEach(([y, hw, sag], i) => { cord([[-hw, y - 3], [-hw * 0.5, y + sag * 0.8], [0, y + sag], [hw * 0.5, y + sag * 0.8], [hw, y - 3]], 1); cord([[-hw + 4, y + 3], [0, y + sag + 6], [hw - 4, y + 3]], 1); });
      // the knot and two loose ends
      part(ctx, ell(22, -244, 8, 6), SINEW.base, { shade: SINEW.dark, sd: 2, lw: 2 });
      cord([[22, -240], [26, -222], [24, -206]], 1); cord([[20, -240], [14, -224], [16, -210]], 1);
      return;
    }
    // each string snaps at the front and the halves whip outward
    const fly = 1 - Math.pow(1 - brk, 2), a = 1 - Math.pow(brk, 1.6);
    loops.forEach(([y, hw, sag], i) => {
      for (const s of [-1, 1]) {
        const r = hash(i * 7 + s * 3), out = s * (70 + r * 60) * fly, up = -(30 + r * 70) * fly + 120 * fly * fly;
        const tip = [s * 10 + out * 1.4, y + sag + up * 1.2], mid = [s * hw * 0.6 + out * 0.6, y + sag * 0.7 + up * 0.5];
        cord([[s * hw * (1 + fly * 0.3), y - 3 + up * 0.25], mid, tip], a);
      }
    });
  }
  // the loom (16:13-14): his seven locks woven into the web on the loom behind his head, made tight with the pin
  const WOOD = { base: '#8A6440', shade: '#5E4228', hi: '#C4996A' };
  function loomGeom(P) { return { x0: -116, x1: 116, top: -628, beam: -540 }; }
  function drawLoom(ctx, P, front) {
    const brk = P.brk, G = loomGeom(P), fly = 1 - Math.pow(1 - brk, 2);
    const a = 1 - sm(brk * 1.5);
    if (a <= 0.02) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.translate(fly * 90, fly * 40 - 600); ctx.rotate(fly * 0.45); ctx.translate(0, 600);
    if (!front) {
      // posts + top beam + warp threads
      for (const x of [G.x0, G.x1]) part(ctx, poly([[x - 8, G.top - 12], [x + 8, G.top - 12], [x + 8, G.beam + 70], [x - 8, G.beam + 70]]), WOOD.base, { shade: WOOD.shade, sd: 4, rim: WOOD.hi, rimA: 0.6 });
      part(ctx, poly([[G.x0 - 18, G.top - 12], [G.x1 + 18, G.top - 12], [G.x1 + 18, G.top + 4], [G.x0 - 18, G.top + 4]]), WOOD.base, { shade: WOOD.shade, sd: 4, rim: WOOD.hi, rimA: 0.6 });
      ctx.strokeStyle = '#E9DDC2'; ctx.lineWidth = 1.6;
      for (let x = G.x0 + 12; x <= G.x1 - 12; x += 9) { ctx.beginPath(); ctx.moveTo(x, G.top + 4); ctx.lineTo(x, G.beam); ctx.stroke(); }
      // the woven web: cream weft bands, dark hair woven through
      const web = poly([[G.x0 + 8, G.top + 26], [G.x1 - 8, G.top + 26], [G.x1 - 8, G.beam], [G.x0 + 8, G.beam]]);
      part(ctx, web, '#E2D3B4', { shade: '#BFAE8C', sd: 5, lw: 2 });
      ctx.save(); ctx.clip(web);
      for (let y = G.top + 32, i = 0; y < G.beam; y += 9, i++) { ctx.strokeStyle = i % 3 === 1 ? HAIR.base : 'rgba(150,120,80,0.5)'; ctx.lineWidth = i % 3 === 1 ? 4.5 : 1.4; ctx.beginPath(); for (let x = G.x0; x <= G.x1; x += 9) { const yy = y + ((x / 9) % 2 ? 1.6 : -1.6); x === G.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      ctx.restore();
      // cloth beam
      part(ctx, poly([[G.x0 - 18, G.beam], [G.x1 + 18, G.beam], [G.x1 + 18, G.beam + 14], [G.x0 - 18, G.beam + 14]]), WOOD.base, { shade: WOOD.shade, sd: 4, rim: WOOD.hi, rimA: 0.6 });
    } else {
      // the pin across the web
      part(ctx, poly([[-70, G.beam - 18], [74, G.beam - 26], [78, G.beam - 18], [-68, G.beam - 10]]), '#A27A4E', { shade: WOOD.shade, sd: 2.5, rim: WOOD.hi, rimA: 0.7, lw: 2 });
      part(ctx, ell(80, G.beam - 22, 7, 7), '#A27A4E', { shade: WOOD.shade, sd: 2, lw: 2 });
    }
    ctx.restore();
  }

  function drawSamson(ctx, P, st) {
    const t = P.t, gold = clamp(st.gold ?? st.rim ?? 0), rimA = 0.55 + gold * 0.45;
    const skin = { shade: SK.shade, rim: mix(SK.rim, '#FFE29A', gold), rimA, sd: 8 };
    const f = mkBend(P), U = upperM(P), shUp = P.shUp, burst = P.burst;
    const cx = 1 - 0.2 * Math.abs(P.bt), ox = P.bt * 6;
    // arms
    const arms = [-1, 1].map((s) => {
      const a = P.arms[s], J = [s * 68 * cx + ox, -392 - shUp];
      let E, W; const l2 = 88 * (a.l2k || 1), l1 = 104 * (a.l1k || 1);
      if (a.T || a.Tw) { const T = a.Tw ? tp(U.inverse(), a.Tw) : a.T; [E, W] = ik2(J, T, l1, l2, a.pole || [J[0] + s * 160, J[1] + 80]); }
      else { const A = a.A * D, B = a.B * D; E = [J[0] + s * Math.sin(A) * l1, J[1] + Math.cos(A) * l1]; W = [E[0] + s * Math.sin(A + B) * l2, E[1] + Math.cos(A + B) * l2]; }
      return { s, J, E, W, a };
    });
    // head frame
    const H = [0, -486 - shUp * 0.6 - burst * 2 + Math.min(0, P.head.pitch || 0) * 6];
    const HM = U.translate(H[0], H[1]).rotate((P.head.tilt || 0) / D);
    const dH = [0, H[1] + 486];
    // the seven locks (world space): count by st.hair, gravity-corrected when leaning
    const nKeep = P.hair > 0.3 ? Math.round(clamp((P.hair - 0.3) / 0.7) * 7) : 0;
    const cut = new Set(SHAVE_ORDER.slice(0, 7 - nKeep));
    const sleep = P.pose === 'sleep', loom = P.bonds === 'loom', web = loom ? 1 - sm(P.brk * 1.6) : 0;
    const G = loomGeom(P);
    const locks = LOCKS.map((L, i) => {
      if (cut.has(i)) return null;
      const sway = Math.sin(t * 1.6 + i * 1.3) * 2.2 * (1 + burst * 2), sw2 = burst * 12, up = burst * (L.back ? 8 : 6);
      const a = tp(HM, L.a);
      let c = tp(U, [L.c[0] + L.s * sw2 * (L.back ? 1 : 0.6), L.c[1] - up + dH[1] * 0.6]);
      let b = tp(U, [L.b[0] + L.s * sw2 + sway, L.b[1] - up + dH[1] * 0.3 + (L.back ? 0 : Math.sin(t * 2 + i) * 1.2)]);
      const g = clamp(Math.abs(P.lean) * 2.5);
      if (g > 0 && !sleep) { b = [lerp(b[0], a[0] + (L.b[0] - L.a[0]) * 0.55, g), b[1]]; c = [lerp(c[0], (a[0] + b[0]) / 2 + L.s * 12, g * 0.7), c[1]]; }
      if (sleep) { const len = 100 + (i % 3) * 14; c = [a[0] + 30, a[1] + L.s * 10 - 18]; b = [a[0] + len, a[1] + L.s * 26 - 30 + (i - 3) * 6]; }
      if (web > 0) { // woven up into the web behind the head
        const wx = -54 + i * 18, wb = [wx, G.beam + 6], wc = [(a[0] + wx) / 2 + L.s * 14, (a[1] + G.beam) / 2 - 10];
        c = lerp2(c, wc, web); b = lerp2(b, wb, web);
      }
      return { i, a, c, b, w: L.w, back: L.back || web > 0.5 };
    }).filter(Boolean);
    const rimH = gold * 0.9;
    const drawLock = (L) => braid(ctx, L.a, L.c, L.b, HAIR.base, HAIR.hi, L.w, rimH);

    if (loom) drawLoom(ctx, P, false);
    for (const L of locks) if (L.back) drawLock(L);
    // long hair mass behind the shoulders (shrinks as the locks are cut)
    if (P.hair > 0.3) withM(ctx, U, () => {
      const k = 0.35 + 0.65 * nKeep / 7;
      const pts = [[-46, -505], [-58, -455], [-62, -405], [-40, -392], [0, -398], [40, -392], [62, -405], [58, -455], [46, -505], [0, -540]].map(([x, y]) => { const w = clamp((y + 392) / -148); return [x, lerp(-505 - (-505 - y) * k, y, 0) + dH[1] * w]; });
      part(ctx, blob(pts), HAIR.base, { shade: '#150C08', sd: 6 });
    });
    // arms drawn behind the body
    for (const a of arms) if (a.a.behind) withM(ctx, U, () => samArm(ctx, a, skin, P));
    // legs + sandals
    samLegs(ctx, P, f, skin);
    // torso skin (shoulders, neck base)
    part(ctx, blob(fm(f, [[-24, -432], [-50, -410 - shUp], [-88, -396 - shUp], [-92, -368], [-62, -352], [0, -350], [62, -352], [92, -368], [88, -396 - shUp], [50, -410 - shUp], [24, -432]]), 0.5), SK.base, skin);
    // tunic (the hem flares a little with a wide stride)
    const chest = P.breath, flL = Math.min(0, P.feet[-1][0] + 25) * 0.35, flR = Math.max(0, P.feet[1][0] - 25) * 0.35;
    const tunic = blob(fm(f, [[-26, -414], [-50, -404 - shUp], [-62, -364 - chest * 0.4], [-56 - chest * 0.3, -318], [-52, -296], [-60 + flL * 0.4, -232], [-72 + flL, -170], [-36 + flL * 0.5, -164], [0, -166], [36 + flR * 0.5, -164], [72 + flR, -170], [60 + flR * 0.4, -232], [52, -296], [56 + chest * 0.3, -318], [62, -364 - chest * 0.4], [50, -404 - shUp], [26, -414], [0, -394]]), 0.42);
    const tunCol = P.blind ? mix(TUN.base, '#6A6458', 0.22) : TUN.base, tunSh = P.blind ? mix(TUN.shade, '#4A453C', 0.22) : TUN.shade;
    part(ctx, tunic, tunCol, { shade: tunSh, sd: 12, rim: mix('#8FA6C8', '#FFD58A', gold), rimA: 0.55 + gold * 0.4, rd: 4 });
    ctx.save(); ctx.clip(tunic);
    for (const [x0, x1] of [[-30, -40], [-6, -10], [18, 26], [40, 52]]) { ctx.strokeStyle = tunSh; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke(pathF(f, [['M', x0, -288], ['Q', (x0 + x1) / 2 + 4, -230, x1 + (x1 < 0 ? flL : flR) * 0.6, -178]])); }
    ctx.fillStyle = TUN.trim; ctx.fill(pathF(f, [['M', -140, -186], ['L', 140, -186], ['L', 140, -172], ['L', -140, -172], ['Z']]));
    ctx.fillStyle = TUN.stripe;
    for (let x = -126; x < 126; x += 14) ctx.fill(pathF(f, [['M', x, -179], ['L', x + 5, -184], ['L', x + 10, -179], ['L', x + 5, -174], ['Z']]));
    ctx.restore();
    const neck = pathF(f, [['M', -26, -414], ['Q', 0, -386, 26, -414]]);
    ctx.strokeStyle = TUN.trim; ctx.lineWidth = 7; ctx.stroke(neck); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(neck);
    part(ctx, pathF(f, [['M', -55, -312], ['Q', 0, -302, 55, -312], ['L', 54, -296], ['Q', 0, -286, -54, -296], ['Z']]), '#6A4630', { shade: '#4B301F', sd: 4 });
    part(ctx, pathF(f, [['M', -16, -300], ['L', -6, -298], ['L', -2, -262], ['L', -12, -258], ['Z']]), '#6A4630', { shade: '#4B301F', sd: 3, lw: 2 });
    part(ctx, pathF(f, [['M', -6, -298], ['L', 4, -300], ['L', 10, -266], ['L', 1, -262], ['Z']]), '#5E3E2A', { lw: 2 });
    const bk = f(-6, -300); part(ctx, ell(bk[0], bk[1], 8, 7), '#7A5238', { lw: 2 });
    // arms
    withM(ctx, U, () => { for (const a of arms) if (!a.a.behind && !a.a.front) samArm(ctx, a, skin, P); });
    // bonds
    if (P.bonds === 'rope') withM(ctx, U, () => drawRopes(ctx, P, st));
    if (P.bonds === 'bowstring') withM(ctx, U, () => drawBowstrings(ctx, P));
    // head
    withM(ctx, HM, () => samHead(ctx, P, gold, rimA));
    // front locks
    for (const L of locks) if (!L.back) drawLock(L);
    if (loom) drawLoom(ctx, P, true);
    // arms in front of the face (whisper)
    withM(ctx, U, () => { for (const a of arms) if (a.a.front) samArm(ctx, a, skin, P); });
    // shackle chain (16:21)
    if (P.shackles) withM(ctx, U, () => {
      const [l, r] = arms; if (!l.ring || !r.ring) return;
      const d = Math.hypot(r.ring[0] - l.ring[0], r.ring[1] - l.ring[1]);
      if (d < 230) chainLinks(ctx, [l.ring[0], l.ring[1] + 10], [r.ring[0], r.ring[1] + 10], 26 + Math.max(0, 120 - d) * 0.25);
      else for (const a of arms) dangle(ctx, [a.ring[0], a.ring[1] + 10], 4, a.s * 0.6);
    });
    return { U, HM, arms };
  }

  PP2.samson = (ctx, st = {}) => {
    const P = samPose(st);
    const tr = P.tremble ? [Math.sin(P.t * 61) * P.tremble, Math.cos(P.t * 47) * P.tremble * 0.6] : [0, 0];
    ctx.save();
    let O = new DOMMatrix();
    if (P.pose === 'sleep') O = O.translate(SLEEP_O[0], SLEEP_O[1]).rotate(90);
    O = O.translate(tr[0], tr[1]);
    ctx.transform(O.a, O.b, O.c, O.d, O.e, O.f);
    const R = drawSamson(ctx, P, st);
    ctx.restore();
    // outputs for scene authors (design units, relative to this drawer's origin)
    const hc = tp(O.multiply(R.HM), [0, 0]); st.headX = hc[0]; st.headY = hc[1];
    st.hands = R.arms.map((a) => tp(O.multiply(R.U), a.W));
  };
  const SLEEP_O = [-268, -104];          // sleep: rotate the standing figure so the head points to screen right
  const NULL_CTX = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, transform() {}, fill() {}, stroke() {}, clip() {}, beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, arc() {}, ellipse() {}, fillRect() {}, closePath() {}, createRadialGradient() { return { addColorStop() {} }; } };
  PP2.samsonInfo = (st = {}) => { const o = Object.assign({}, st); PP2.samson(NULL_CTX, o); return { head: [o.headX, o.headY], hands: o.hands }; };

  // ================= the generic figure (everyone else) =================
  // C: costume / build; P: pose (same fields as Samson's pose: lean, pivot, bx, by, bt, shUp, arms, feet, knee, head)
  const FACES = {
    man: [[-34, -16], [-33, 14], [-24, 38], [0, 50], [24, 38], [33, 14], [34, -16], [24, -40], [0, -46], [-24, -40]],
    woman: [[-34, -15], [-33, 9], [-27, 29], [-14, 42], [0, 46], [14, 42], [27, 29], [33, 9], [34, -15], [25, -39], [0, -45], [-25, -39]],
    youth: [[-34, -15], [-34, 12], [-27, 33], [-13, 44], [0, 47], [13, 44], [27, 33], [34, 12], [34, -15], [25, -39], [0, -45], [-25, -39]],
  };
  function headG(ctx, H, E = {}) {
    const fw = H.fw ?? 33, k = fw / 34, tn = clamp(E.turn || 0, -1, 1), pc = clamp(E.pitch || 0, -1, 1);
    const fx = tn * fw * 0.38 * (E.turnK || 1), fy = pc * 12, sk = H.skin, sh = H.sh;
    const ro = H.rimA ? { rim: H.rim, rimA: H.rimA, rd: 3 } : {};
    if (H.hair) H.hair(ctx, 'back', E, fx, fy);
    part(ctx, poly([[-15 * k, 26], [15 * k, 26], [18 * k, 74], [-18 * k, 74]]), sk, { shade: sh, sd: 8 });
    if (H.ears !== false && SIMP() < 2) for (const s of [-1, 1]) if (s * tn > -0.5) part(ctx, ell(s * (fw + 1) - tn * 4, -1 + fy * 0.4, 6, 10), sk, { shade: sh, sd: 3, lw: 2 });
    const pts = FACES[H.shape || 'man'].map(([x, y]) => [x * k + (y > 25 ? fx * 0.22 : 0), y * (H.fh ?? 1)]);
    const face = blob(pts, 0.5);
    part(ctx, face, sk, Object.assign({ shade: sh, sd: 7 }, ro));
    ctx.save(); ctx.clip(face);
    if (SIMP() < 1) ctx.fillStyle = H.blush || 'rgba(200,90,60,0.15)'; else ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(fx + s * 19 * k + 8, 12 + fy); ctx.ellipse(fx + s * 19 * k, 12 + fy, 8, 5.5, 0, 0, TAU); } ctx.fill();
    if (H.wrinkles && SIMP() < 1) {
      ctx.strokeStyle = 'rgba(70,40,24,0.5)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      for (const y of [-28, -22]) { ctx.beginPath(); ctx.moveTo(fx - 12, y + fy * 0.5); ctx.quadraticCurveTo(fx, y - 2 + fy * 0.5, fx + 12, y + fy * 0.5); ctx.stroke(); }
      for (const s of [-1, 1]) { const ex = fx + s * (fw * 0.4 + 11); ctx.beginPath(); ctx.moveTo(ex, -6 + fy); ctx.lineTo(ex + s * 4, -8 + fy); ctx.moveTo(ex, -2 + fy); ctx.lineTo(ex + s * 4, -1 + fy); ctx.stroke(); }
      if (!H.beard) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx + s * 9, 16 + fy); ctx.quadraticCurveTo(fx + s * 14, 24 + fy, fx + s * 13, 32 + fy); ctx.stroke(); }
    }
    ctx.restore();
    // beard
    if (H.beard) {
      const bl = H.beard.len ?? 1;
      const bp = [[-33, 0], [-30, 30], [-14, 56 + 8 * bl], [0, 62 + 10 * bl], [14, 56 + 8 * bl], [30, 30], [33, 0], [22, 22], [0, 26], [-22, 22]].map(([x, y], i) => [x * k + (i >= 7 ? fx * 0.9 : fx * 0.35 * clamp(y / 60)), y + (i >= 7 ? fy : 0)]);
      const beard = blob(bp, 0.45);
      part(ctx, beard, H.beard.col, { shade: H.beard.sh || mix(H.beard.col, '#140B07', 0.5), sd: 4, rim: H.beard.hi, rimA: H.beard.hi ? 0.8 : 0, rd: 2.5 });
      if (SIMP() < 1) { ctx.save(); ctx.clip(beard); ctx.strokeStyle = H.beard.line || mix(H.beard.col, '#140B07', 0.35); ctx.lineWidth = 1.3; ctx.globalAlpha = 0.7;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 7 + fx * 0.6, 34 + fy); ctx.quadraticCurveTo(i * 8 + fx * 0.4, 50, i * 6 + fx * 0.3, 64 + 8 * bl); ctx.stroke(); }
      ctx.restore(); }
    }
    // nose
    const nk = H.noseK ?? 1, nx = fx * 1.1, ny = fy * 0.8, tip = tn * 4;
    const nose = P2(); nose.moveTo(nx - 1 * nk, -4 + ny); nose.quadraticCurveTo(nx - 3 * nk, 6 + ny, nx + (-6 * nk) + tip, 12 * nk + ny); nose.quadraticCurveTo(nx + tip, 16 * nk + ny, nx + 7 * nk + tip, 13 * nk + ny); nose.quadraticCurveTo(nx + 4 * nk, 4 + ny, nx + 2.5 * nk, -4 + ny); nose.closePath();
    if (SIMP() < 3) { ctx.fillStyle = sh; ctx.globalAlpha = SIMP() >= 2 ? 0.35 : 0.5; ctx.fill(nose); ctx.globalAlpha = 1; }
    if (SIMP() < 2) { ctx.strokeStyle = LINE; ctx.lineWidth = 2 * (PP.inkK ?? 1); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(nx + 3 * nk, -1 + ny); ctx.quadraticCurveTo(nx + 6 * nk + tip, 9 * nk + ny, nx + 7 * nk + tip, 13 * nk + ny); ctx.quadraticCurveTo(nx + 2 * nk + tip, 17 * nk + ny, nx - 4 * nk + tip, 14 * nk + ny); ctx.stroke(); }
    // mouth (+ mustache)
    const my = (H.my ?? 30) + fy;
    if (H.beard && H.beard.mus !== false && SIMP() < 2) {
      const mus = P2(); const mx = fx;
      mus.moveTo(-2 + mx, my - 10); mus.quadraticCurveTo(-13 + mx, my - 12, -19 + mx, my + 1); mus.quadraticCurveTo(-11 + mx, my - 3, -2 + mx, my - 4); mus.moveTo(2 + mx, my - 10); mus.quadraticCurveTo(13 + mx, my - 12, 19 + mx, my + 1); mus.quadraticCurveTo(11 + mx, my - 3, 2 + mx, my - 4);
      mouthG(ctx, fx, my + 2, E.mouth || 'neutral', { w: H.mw ?? 8, lip: H.lip });
      part(ctx, mus, H.beard.col, { lw: 1.5 });
    } else mouthG(ctx, fx, my + (H.beard && SIMP() >= 2 ? 4 : 0), E.mouth || 'neutral', { w: H.mw ?? 8, lip: H.lip });
    // eyes + brows
    const ey = (H.ey ?? -4) + fy, sp = H.sp ?? fw * 0.4;
    for (const s of [-1, 1]) {
      const far = clamp(-s * tn), x = fx + s * sp * (1 - 0.12 * Math.abs(tn));
      if (!(E.hideFar && far > 0.6)) eye1(ctx, x, ey, (H.erx ?? 7) * (1 - 0.3 * far), (H.ery ?? 4.8) * (1 - (E.squint || 0) * 0.35), { look: E.look || [0, 0], iris: H.iris, closed: E.closed, lid: E.lid ?? H.lid, lidCol: sk, lash: H.lash, kohl: H.kohl, side: s, ir: H.ir });
      brow1(ctx, fx, ey - 10 - (H.browUp || 0), s, { furrow: E.furrow ?? H.furrow ?? 0, lift: (E.lift || 0) + (H.lift || 0), th: H.bth ?? 4.4, col: H.bcol || '#24150D', sp, k: 1 - 0.3 * far, arch: H.arch || 0 });
    }
    if (H.hair) H.hair(ctx, 'front', E, fx, fy);
  }

  function armG(ctx, C, a, skin, P) {
    const { s, J, E, W } = a, o = a.a;
    const ang = o.hdir != null ? o.hdir * D : Math.atan2(W[1] - E[1], W[0] - E[0]);
    const hk = C.handK ?? 0.9;
    const h = o.hand === 'none' ? null : handPaths(C.sleeve === 'long' || !C.sleeve ? [W[0] + Math.cos(ang) * 3, W[1] + Math.sin(ang) * 3] : W, ang, s, o.hand || 'fist', hk);
    if (o.item && ITEMS[o.item]) ITEMS[o.item](ctx, 'back', W, ang, s, o, C);
    const [r0, r1, r2] = C.armR, sl = C.sleeve || 'long', sc = C.sleeveCol || C.g.col, ssh = C.sleeveSh || C.g.sh;
    const gc = { shade: ssh, sd: 7, rim: C.g.rim, rimA: C.g.rimA || 0 };
    const up = E[1] < J[1] - 20 ? -1 : 1;
    const d = [W[0] - E[0], W[1] - E[1]], dl = Math.hypot(d[0], d[1]) || 1, u = [d[0] / dl, d[1] / dl];
    if (sl === 'long') {
      // sleeve (with a cuff band) first, then the hand on top, clipped at the wrist so it comes out of the sleeve
      const rr = r2 + 3 + (C.bell || 0) * 0.6, We = [W[0] - u[0] * 3, W[1] - u[1] * 3];
      group(ctx, [[limb(J, E, r0 + 4, r1 + 3, 2, s), sc, gc], [limb(E, We, r1 + 3, rr, 1, s), sc, gc]]);
      part(ctx, limb([We[0] - u[0] * 8, We[1] - u[1] * 8], We, rr, rr), C.cuff || sc, { shade: ssh, sd: 3, lw: 2.2 });
      if (h) {
        ctx.save();
        const cl = P2(); const n = [-u[1], u[0]], b0 = [W[0] - u[0] * 4, W[1] - u[1] * 4];
        cl.moveTo(b0[0] + n[0] * 400, b0[1] + n[1] * 400); cl.lineTo(b0[0] - n[0] * 400, b0[1] - n[1] * 400); cl.lineTo(b0[0] - n[0] * 400 + u[0] * 400, b0[1] - n[1] * 400 + u[1] * 400); cl.lineTo(b0[0] + n[0] * 400 + u[0] * 400, b0[1] + n[1] * 400 + u[1] * 400); cl.closePath();
        ctx.clip(cl);
        group(ctx, h.paths.map((p) => [p, C.skin, skin]));
        handDetail(ctx, h);
        ctx.restore();
      }
    } else {
      const parts = [];
      if (h) for (const p of h.paths) parts.push([p, C.skin, skin]);
      parts.push([ell(J[0] + s * 3, J[1] + 5, r0 + 3, r0 + 4), C.skin, skin], [limb(J, E, r0, r1, C.bulge ?? 3, s * up), C.skin, skin], [limb(E, W, r1, r2, (C.bulge ?? 3) * 0.6, s), C.skin, skin]);
      group(ctx, parts);
      if (h) handDetail(ctx, h);
    }
    if (sl === 'long') { /* cuff drawn above */
    } else if (sl === 'short') { // sleeve cap over the upper arm
      const e2 = lerp2(J, E, 0.5);
      part(ctx, limb([J[0] - s * 2, J[1] - 4], e2, r0 + 6, r0 + 3.5, 1, s), sc, { shade: ssh, sd: 6, rim: C.g.rim, rimA: C.g.rimA || 0 });
      if (C.sleeveTrim) { ctx.strokeStyle = C.sleeveTrim; ctx.lineWidth = 3; const n = [-u[1], u[0]]; const ee = lerp2(J, E, 0.47); ctx.beginPath(); ctx.moveTo(ee[0] + n[0] * (r0 + 2), ee[1] + n[1] * (r0 + 2)); ctx.lineTo(ee[0] - n[0] * (r0 + 2), ee[1] - n[1] * (r0 + 2)); ctx.stroke(); }
    }
    if (C.bracelet) { // gold bracelets
      for (const kk of [12, 17]) { const c = [W[0] - u[0] * kk, W[1] - u[1] * kk], n = [-u[1], u[0]], rr = (sl === 'long' ? r2 + 5 : r2 + 1.5);
        ctx.strokeStyle = LINE; ctx.lineWidth = 4.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c[0] + n[0] * rr, c[1] + n[1] * rr); ctx.lineTo(c[0] - n[0] * rr, c[1] - n[1] * rr); ctx.stroke();
        ctx.strokeStyle = C.bracelet; ctx.lineWidth = 2.6; ctx.stroke(); }
    }
    if (o.item && ITEMS[o.item]) ITEMS[o.item](ctx, 'front', W, ang, s, o, C);
  }

  function legsG(ctx, C, P, f, skin) {
    for (const s of [-1, 1]) {
      const F = (P.feet && P.feet[s]) || [s * C.footX, 0];
      if (C.g.long) {
        if (P.kneel || P.seat) { if (P.seat) { part(ctx, ell(F[0] + s * 3, F[1] - 7, 17, 7.5), C.shoe || '#4A3424', { lw: 2.2 }); part(ctx, ell(F[0] + s * 6, F[1] - 9, 8, 4.5), C.skin, { lw: 1.4 }); } continue; }
        part(ctx, ell(F[0] + s * 3, F[1] - 7, C.footW ?? 18, 7.5), C.shoe || '#4A3424', { lw: 2.2 });
        part(ctx, ell(F[0] + s * 6, F[1] - 9, 8, 4.5), C.skin, { lw: 1.4 });
        continue;
      }
      // short garment: the whole leg, sandal and straps (as Samson's, slimmer)
      const kn = (P.knee && P.knee[s]) || 0, hipY = C.hipY ?? -200;
      const Hh = f(s * C.footX, hipY), A = [F[0], F[1] - 16];
      const K = (P.kneeAt && P.kneeAt[s]) || [lerp(Hh[0], A[0], 0.45) + s * 2 + (typeof kn === 'number' ? kn : 0), lerp(Hh[1], A[1], 0.45)];
      const lw = C.legW || [12, 12.5, 13.5, 12.5, 9, 6.5];
      const M1 = lerp2(Hh, K, 0.5), C1 = lerp2(K, A, 0.3), C2 = lerp2(K, A, 0.64);
      part(ctx, chain([Hh, M1, K, C1, C2, A], lw), C.skin, skin);
      if (P.hideFoot && P.hideFoot[s]) { part(ctx, ell(F[0] + 4, F[1] - 12, 7, 13, 0.35), C.shoe || '#6B4A33', { shade: '#4A3122', sd: 2, lw: 2.2 }); continue; }
      const lifted = F[1] < -3, ft = lifted ? -s * 0.18 : 0;
      part(ctx, ell(F[0] + s * 4, F[1] - 6, 16, lifted ? 6 : 7, ft), C.shoe || '#6B4A33', { shade: '#4A3122', sd: 3 });
      const sa = Math.atan2(C2[1] - A[1], C2[0] - A[0]) + Math.PI / 2;
      ctx.save(); ctx.translate(A[0], A[1]); ctx.rotate(sa); ctx.strokeStyle = '#5A3C26'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(-8, 2 - k * 13); ctx.lineTo(8, -5 - k * 13); ctx.stroke(); }
      ctx.restore();
      part(ctx, ell(F[0] + s * 5, F[1] - 9, 8, 4.5, ft), C.skin, { lw: 1.5 });
    }
  }

  function garment(ctx, C, P, f) {
    const g = C.g, shUp = P.shUp || 0, fl = { '-1': 0, '1': 0 };
    for (const s of [-1, 1]) { const F = (P.feet && P.feet[s]) || [s * C.footX, 0]; const d = F[0] - s * C.footX; fl[s] = (s < 0 ? Math.min(0, d) : Math.max(0, d)) * (g.long ? 0.7 : 0.4); }
    let hemY = g.hemY, hw = g.hw, hipw = g.hipw;
    if (P.kneel) { hemY = -3 - (P.by || 0); hw = g.hw * 1.2 + 14; hipw = g.hipw + 8; }
    if (P.seat) hemY = -12 - (P.by || 0);
    const by0 = P.by || 0;
    const body = P.seat ? blob(fm(f, [[-g.nw, g.neckY], [-g.sw * 0.78, g.shY - 3 - shUp], [-g.sw, g.shY + 16 - shUp * 0.5], [-g.cw, g.shY + 64], [-g.ww, g.waistY], [-g.hipw - 14, -128 - by0], [-g.hipw - 8, -108 - by0], [-46, -92 - by0], [-50, hemY], [0, hemY + 5], [50, hemY], [46, -92 - by0], [g.hipw + 8, -108 - by0], [g.hipw + 14, -128 - by0], [g.ww, g.waistY], [g.cw, g.shY + 64], [g.sw, g.shY + 16 - shUp * 0.5], [g.sw * 0.78, g.shY - 3 - shUp], [g.nw, g.neckY], [0, g.neckY + 10]]), 0.42) : blob(fm(f, [[-g.nw, g.neckY], [-g.sw * 0.78, g.shY - 3 - shUp], [-g.sw, g.shY + 16 - shUp * 0.5], [-g.cw, g.shY + 64], [-g.ww, g.waistY], [-hipw + fl[-1] * 0.3, g.hipY], [-hw + fl[-1], hemY], [-hw * 0.45 + fl[-1] * 0.5, hemY + 4], [0, hemY + 5], [hw * 0.45 + fl[1] * 0.5, hemY + 4], [hw + fl[1], hemY], [hipw + fl[1] * 0.3, g.hipY], [g.ww, g.waistY], [g.cw, g.shY + 64], [g.sw, g.shY + 16 - shUp * 0.5], [g.sw * 0.78, g.shY - 3 - shUp], [g.nw, g.neckY], [0, g.neckY + 10]]), 0.42);
    part(ctx, body, g.col, { shade: g.sh, sd: g.sd ?? 13, rim: g.rim, rimA: g.rimA || 0, rd: 4 });
    if (P.seat) hw = 50;
    ctx.save(); ctx.clip(body);
    const yTop = g.shY - 40, yBot = hemY + 20;
    const vline = (x, col, w, y0 = yTop, y1 = yBot) => { const pts = []; for (let y = y0; y <= y1 + 0.1; y += (y1 - y0) / 8) pts.push([x + (y > g.hipY ? (x < 0 ? fl[-1] : fl[1]) * clamp((y - g.hipY) / (hemY - g.hipY)) : 0), y]); strokeF(ctx, f, pts, col, w); };
    if (g.stripes && SIMP() < 3) for (const sd of g.stripes) vline(sd.x, sd.col, sd.w);
    if (g.panel) vline(0, g.panel.col, g.panel.w, g.panel.y0 ?? g.waistY, yBot);
    if (g.folds && SIMP() < 1) for (const x of g.folds) vline(x, g.foldCol || g.sh, 2.2, g.waistY + 20, hemY);
    if (g.band) { // patterned band above the hem
      const by = hemY - (g.band.off ?? 10), W2 = hw + 30;
      strokeF(ctx, f, [[-W2 + fl[-1], by], [0, by + 4], [W2 + fl[1], by]], g.band.col, g.band.h);
      if (g.band.pat && SIMP() < 2) { ctx.fillStyle = g.band.pat; for (let x = -W2; x < W2; x += 14) { const xx = x + (x < 0 ? fl[-1] : fl[1]) * 0.9, yy = by + 4 * (1 - Math.abs(x) / W2); ctx.fill(pathF(f, [['M', xx, yy], ['L', xx + 5, yy - g.band.h * 0.36], ['L', xx + 10, yy], ['L', xx + 5, yy + g.band.h * 0.36], ['Z']])); } }
    }
    if (g.yoke && SIMP() < 2) strokeF(ctx, f, [[-g.sw, g.shY + 30], [0, g.shY + 44], [g.sw, g.shY + 30]], g.yoke.col, g.yoke.w);
    ctx.restore();
    if (g.neckTrim && SIMP() < 2) { const nk = pathF(f, [['M', -g.nw, g.neckY], ['Q', 0, g.neckY + 24, g.nw, g.neckY]]); ctx.strokeStyle = g.neckTrim; ctx.lineWidth = 6; ctx.stroke(nk); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(nk); }
    if (g.belt) {
      const b = g.belt, y = b.y, w = g.ww + 5;
      part(ctx, pathF(f, [['M', -w, y - b.h / 2], ['Q', 0, y - b.h / 2 + 8, w, y - b.h / 2], ['L', w - 1, y + b.h / 2], ['Q', 0, y + b.h / 2 + 8, -w + 1, y + b.h / 2], ['Z']]), b.col, { shade: b.sh || mix(b.col, '#24160F', 0.35), sd: 4, lw: 2.2 });
      if (b.tails && SIMP() < 2) { part(ctx, pathF(f, [['M', b.tx - 6, y + 2], ['L', b.tx + 4, y + 2], ['L', b.tx + 8, y + b.tails], ['L', b.tx - 4, y + b.tails + 3], ['Z']]), b.col, { shade: b.sh || mix(b.col, '#24160F', 0.35), sd: 3, lw: 2 }); const kn = f(b.tx, y + 4); part(ctx, ell(kn[0], kn[1], 7, 6), b.knot || b.col, { lw: 2 }); }
    }
  }

  function solveArms(C, P, U) {
    const cx = 1 - 0.2 * Math.abs(P.bt || 0), ox = (P.bt || 0) * 6;
    return [-1, 1].map((s) => {
      const a = (P.arms && P.arms[s]) || { A: 8, B: -6 }, J = [s * C.shX * cx + ox, C.shY - (P.shUp || 0)];
      let E, W; const l1 = C.l1 * (a.l1k || 1), l2 = C.l2 * (a.l2k || 1);
      if (a.T || a.Tw) { const T = a.Tw ? tp(U.inverse(), a.Tw) : a.T; [E, W] = ik2(J, T, l1, l2, a.pole || [J[0] + s * 150, J[1] + 120]); }
      else { const A = (a.A ?? 8) * D, B = (a.B ?? -6) * D; E = [J[0] + s * Math.sin(A) * l1, J[1] + Math.cos(A) * l1]; W = [E[0] + s * Math.sin(A + B) * l2, E[1] + Math.cos(A + B) * l2]; }
      return { s, J, E, W, a };
    });
  }
  function drawFig(ctx, C, P) {
    P.pivot = P.pivot ?? C.pivot ?? -250;
    const f = mkBend(P), U = upperM(P);
    const skin = { shade: C.skinSh, sd: 7, rim: C.skinRim, rimA: C.skinRim ? (C.rimA ?? 0.5) : 0, rd: 3 };
    const arms = solveArms(C, P, U);
    const E = P.head || {};
    const hk = SIMP() >= 3 ? 0.84 : SIMP() >= 2 ? 0.92 : 1;   // simplified figures: smaller heads, longer bodies
    const HM = U.translate(E.dx || 0, C.headY + (1 - hk) * 40 - (P.shUp || 0) * 0.6 + (E.dy || 0)).rotate((E.tilt || 0) / D).scale(hk, hk);
    ctx.save();
    if (P.rot) { const o = P.rotO || [0, 0]; ctx.translate(o[0], o[1]); ctx.rotate(P.rot); ctx.translate(-o[0], -o[1]); }
    if (C.aura) C.aura(ctx, P);
    if (C.under) C.under(ctx, C, P, f, U, arms);
    if (C.head.hair) withM(ctx, HM, () => C.head.hair(ctx, 'back0', E, 0, 0, P));
    for (const a of arms) if (a.a.behind) withM(ctx, U, () => armG(ctx, C, a, skin, P));
    legsG(ctx, C, P, f, skin);
    garment(ctx, C, P, f);
    if (C.over) C.over(ctx, C, P, f, U, arms);
    withM(ctx, U, () => { for (const a of arms) if (!a.a.behind && !a.a.front) armG(ctx, C, a, skin, P); });
    if (C.collar) C.collar(ctx, C, P, f, U);
    withM(ctx, HM, () => headG(ctx, C.head, E));
    withM(ctx, U, () => { for (const a of arms) if (a.a.front) armG(ctx, C, a, skin, P); });
    if (C.after) C.after(ctx, C, P, f, U, arms, HM);
    ctx.restore();
    return { U, HM, arms };
  }

  // ---- items held in a hand (drawn 'back' before the hand, 'front' after) ----
  const ITEMS = {
    bowl(ctx, ph, W, ang, s) {   // an offering bowl held in the hands
      if (ph !== 'front') return;
      ctx.save(); ctx.translate(W[0] + 18 * s, W[1] - 6);
      const b = P2(); b.moveTo(-38, -6); b.quadraticCurveTo(0, 40, 38, -6); b.closePath(); part(ctx, b, '#9A6A3E', { shade: '#6E4A2A', sd: 5, rim: '#C8946A', rimA: 0.5, lw: 2.4 });
      part(ctx, ell(0, -6, 38, 8), '#E6D2A0', { lw: 2 }); ctx.restore();
    },
    hammer(ctx, ph, W, ang, s) {   // a mallet: handle along the hand's direction, a stone/bronze head at the end
      if (ph !== 'front') return;
      const ux = Math.cos(ang), uy = Math.sin(ang), L = 150, hx = W[0] + ux * L, hy = W[1] + uy * L, b = [W[0] - ux * 30, W[1] - uy * 30];
      ctx.lineCap = 'round'; ctx.strokeStyle = LINE; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.strokeStyle = '#7A5A3E'; ctx.lineWidth = 8; ctx.stroke();
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang + Math.PI / 2); const hd = P2(); hd.roundRect(-44, -22, 88, 44, 8);
      part(ctx, hd, '#6E6A64', { shade: '#45423E', sd: 6, rim: '#B8B2A8', rimA: 0.6, lw: 3 }); ctx.restore();
    },
    tablets(ctx, ph, W, ang, s) {   // two stone tablets with rounded tops, held up between both hands (drawn from the right hand, centred)
      if (ph !== 'front') return;
      ctx.save(); ctx.translate(W[0] - 58, W[1] - 70);
      for (const dx of [-40, 40]) { const t = P2(); t.moveTo(dx - 36, 60); t.lineTo(dx - 36, -30); t.quadraticCurveTo(dx - 36, -66, dx, -66); t.quadraticCurveTo(dx + 36, -66, dx + 36, -30); t.lineTo(dx + 36, 60); t.closePath();
        part(ctx, t, '#B9AE98', { shade: '#8E846E', sd: 7, rim: '#E4DCC8', rimA: 0.6, lw: 3 });
        ctx.strokeStyle = 'rgba(70,56,40,0.55)'; ctx.lineWidth = 2.2; for (let y = -34; y <= 44; y += 13) { ctx.beginPath(); ctx.moveTo(dx - 24, y); ctx.lineTo(dx + 24, y); ctx.stroke(); } }
      ctx.restore();
    },
    rod(ctx, ph, W, ang, s) {   // a staff gripped near one end and swung (the 'swing' pose): it follows the hand's direction
      if (ph !== 'front') return;
      const ux = Math.cos(ang), uy = Math.sin(ang), a = [W[0] - ux * 40, W[1] - uy * 40], b = [W[0] + ux * 330, W[1] + uy * 330];
      ctx.lineCap = 'round'; ctx.strokeStyle = LINE; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.strokeStyle = '#7A5A3E'; ctx.lineWidth = 7; ctx.stroke();
    },
    staff(ctx, ph, W, ang, s) {
      if (ph !== 'back') return;
      const top = [W[0] + 4 * s, W[1] - 150], bot = [W[0] - 2 * s, W[1] + 230];
      ctx.lineCap = 'round'; ctx.strokeStyle = LINE; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(bot[0], bot[1]); ctx.lineTo(top[0], top[1]); ctx.quadraticCurveTo(top[0] + s * 4, top[1] - 26, top[0] + s * 22, top[1] - 22); ctx.stroke();
      ctx.strokeStyle = '#7A5A3E'; ctx.lineWidth = 6.5; ctx.stroke();
      ctx.strokeStyle = '#A88460'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bot[0] - 1.5, bot[1]); ctx.lineTo(top[0] - 1.5, top[1]); ctx.stroke();
    },
    scroll(ctx, ph, W, ang, s) {
      if (ph !== 'front') return;
      ctx.save(); ctx.translate(W[0] + 14 * Math.cos(ang), W[1] + 14 * Math.sin(ang)); ctx.rotate(-0.25 * s);
      const sheet = P2(); sheet.roundRect(-34, -16, 68, 30, 4);
      part(ctx, sheet, '#EFE3C6', { shade: '#CDBB94', sd: 5, rim: '#FFF6DE', rimA: 0.7 });
      ctx.strokeStyle = 'rgba(80,50,30,0.55)'; ctx.lineWidth = 1.4; for (const y of [-7, -1, 5]) { ctx.beginPath(); ctx.moveTo(-22, y); ctx.lineTo(22, y); ctx.stroke(); }
      for (const x of [-38, 38]) { const r = P2(); r.roundRect(x - 6, -24, 12, 46, 6); part(ctx, r, '#C9B48E', { shade: '#9C8660', sd: 3, lw: 2.2 }); for (const y of [-27, 25]) part(ctx, ell(x, y, 4, 4), '#7A5A3E', { lw: 1.6 }); }
      ctx.restore();
    },
    chains(ctx, ph, W, ang, s) {
      if (ph !== 'back') return;
      ctx.save(); ctx.translate(W[0], W[1]); ctx.scale(2, 2); ctx.translate(-W[0], -W[1]);
      const A = [W[0] + 6 * Math.cos(ang), W[1] + 6 * Math.sin(ang)];
      let p = A; for (let i = 0; i < 6; i++) { const q = [p[0] + s * (i < 2 ? 10 : 2), p[1] + (i < 1 ? 4 : 11)]; chainLinks(ctx, p, q, 0); p = q; }
      // the broken shackle at the end
      const r = P2(); r.arc(p[0], p[1] + 14, 13, Math.PI * 1.35, Math.PI * 0.95); part(ctx, r, 'rgba(0,0,0,0)', { lw: 6.5, lineCol: LINE }); ctx.strokeStyle = BRONZE.base; ctx.lineWidth = 3.5; ctx.stroke(r);
      let q = A; for (let i = 0; i < 3; i++) { const z = [q[0] - s * 8, q[1] + 8]; chainLinks(ctx, q, z, 0); q = z; }
      ctx.restore();
    },
    razor(ctx, ph, W, ang, s) {
      if (ph !== 'back') return;
      ctx.save(); ctx.translate(W[0], W[1]); ctx.rotate(ang);
      const hd = P2(); hd.roundRect(14, -4, 30, 8, 3); part(ctx, hd, '#7A5A3E', { shade: '#5A3C26', sd: 2, lw: 2 });
      const bl = P2(); bl.moveTo(40, -5); bl.quadraticCurveTo(66, -22, 74, 2); bl.quadraticCurveTo(62, 12, 40, 5); bl.closePath();
      part(ctx, bl, '#C9934E', { shade: '#8E6230', sd: 3, rim: '#FFE2A8', rimA: 0.9, rd: 2, lw: 2 });
      ctx.restore();
    },
  };

  // ---- head styles ----
  function hairCap(col, sh, hi, extra = {}) { // short hair cap (men / youths); curls = lobed edge
    return (ctx, layer, E, fx, fy) => {
      if (layer !== 'front') return;
      const pts = [[-36, -4], [-37, -28], [-28, -47], [-10, -55], [0, -55], [10, -55], [28, -47], [37, -28], [36, -4], [32, -14], [26, -30], [10, -34], [0, -32], [-10, -34], [-26, -30], [-32, -14]].map(([x, y], i) => i >= 9 ? [x + fx * 0.5, y + fy * 0.8] : [x, y]);
      const cap = blob(pts, 0.5);
      part(ctx, cap, col, { shade: sh, sd: 5, rim: hi, rimA: 0.8, rd: 2.5 });
      if (extra.curls) { ctx.save(); ctx.clip(cap); ctx.strokeStyle = sh; ctx.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const x = -28 + i * 7, y = -48 + Math.abs(i - 4) * 2.4; ctx.beginPath(); ctx.arc(x, y + 8, 4.5, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke(); } ctx.restore(); }
      if (extra.band) { part(ctx, blob([[-37, -24], [0, -36 + fy * 0.4], [37, -24], [37, -16], [0, -28 + fy * 0.4], [-37, -16]], 0.35), extra.band, { lw: 2 }); }
    };
  }
  function headCloth(cloth, band, o = {}) { // as PP.judean: cloth to the shoulders with a cord
    return (ctx, layer, E, fx, fy) => {
      if (layer !== 'front') return;
      const hc = blob([[-40, 30], [-46, -10], [-40, -44], [0, -58], [40, -44], [46, -10], [40, 30], [58, 76], [30, 60], [36, 4], [26, -26 + fy * 0.4], [0, -32 + fy * 0.5], [-26, -26 + fy * 0.4], [-36, 4], [-30, 60], [-58, 76]], 0.42);
      part(ctx, hc, cloth, { shade: mix(cloth, '#6B4A33', 0.4), sd: 8, rim: o.rim, rimA: o.rimA || 0 });
      if (o.grey) part(ctx, blob([[-25, -26], [0, -31], [25, -26], [22, -22], [0, -26], [-22, -22]], 0.4), o.grey, { lw: 1.4 });
      if (band) part(ctx, blob([[-38, -30], [0, -42], [38, -30], [38, -22], [0, -34], [-38, -22]], 0.35), band, { lw: 2 });
    };
  }
  function veil(col, o = {}) { // a woman's head covering falling over the shoulders
    const sh = mix(col, '#4A3020', 0.38);
    return (ctx, layer, E, fx, fy) => {
      if (layer === 'back0') { part(ctx, blob([[-46, -20], [-54, 40], [-70, 110], [-40, 120], [0, 112], [40, 120], [70, 110], [54, 40], [46, -20], [0, -58]], 0.45), col, { shade: sh, sd: 9 }); return; }
      if (layer !== 'front') return;
      if (o.hair) part(ctx, blob([[-27, -24], [-14, -34], [0, -32 + fy * 0.5], [14, -34], [27, -24], [22, -20], [0, -27 + fy * 0.5], [-22, -20]], 0.45), o.hair, { lw: 1.6 });
      const v = blob([[-38, 32], [-44, -6], [-38, -42], [0, -56], [38, -42], [44, -6], [38, 32], [52, 86], [26, 68], [33, 8], [25, -24 + fy * 0.4], [0, -31 + fy * 0.5], [-25, -24 + fy * 0.4], [-33, 8], [-26, 68], [-52, 86]], 0.42);
      part(ctx, v, col, { shade: sh, sd: 8, rim: o.rim, rimA: o.rimA || 0 });
      if (o.trim) { ctx.save(); ctx.clip(v); ctx.strokeStyle = o.trim; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-34, 60); ctx.quadraticCurveTo(-36, 0, -26, -26 + fy * 0.4); ctx.quadraticCurveTo(0, -36 + fy * 0.5, 26, -26 + fy * 0.4); ctx.quadraticCurveTo(36, 0, 34, 60); ctx.stroke(); ctx.restore(); part(ctx, v, 'rgba(0,0,0,0)', { lw: 2.6 }); }
    };
  }
  function royalCrown(base, gold) { // a king: his own hair, and a gold crown band with five points
    return (ctx, layer, E, fx, fy, P) => {
      base(ctx, layer, E, fx, fy, P);
      if (layer !== 'front') return;
      const c = P2(); c.moveTo(-34, -28); c.lineTo(-36, -50); c.lineTo(-24, -40); c.lineTo(-14, -60); c.lineTo(-4, -42); c.lineTo(0, -66); c.lineTo(4, -42); c.lineTo(14, -60); c.lineTo(24, -40); c.lineTo(36, -50); c.lineTo(34, -28); c.quadraticCurveTo(0, -22, -34, -28); c.closePath();
      part(ctx, c, gold || '#E0B040', { shade: '#A87A20', sd: 4, rim: '#FFE7A0', rimA: 0.8, lw: 2.4 });
      ctx.fillStyle = '#A8432C'; for (const x of [-18, 0, 18]) { ctx.beginPath(); ctx.arc(x, -33, 3, 0, TAU); ctx.fill(); }
    };
  }
  function featherCrown(trim, o = {}) { // as PP.soldier: a row of upright feathers in a band
    return (ctx, layer, E, fx, fy) => {
      if (layer !== 'front') return;
      const n = o.n ?? 5, tall = o.tall ?? 1;
      for (let i = -n; i <= n; i++) {
        const xx = i * 7.2, a = i * 0.06;
        const f = P2(); f.moveTo(xx - 4, -34); f.quadraticCurveTo(xx - 6 + a * 40, -34 - 30 * tall, xx + a * 70, -34 - 50 * tall); f.quadraticCurveTo(xx + 6 + a * 40, -34 - 30 * tall, xx + 4, -34); f.closePath();
        part(ctx, f, i % 2 ? '#F1E8D6' : '#E2D6BE', { lw: 1.8 });
      }
      part(ctx, blob([[-36, -26], [-35, -40], [0, -44], [35, -40], [36, -26], [0, -30]], 0.4), trim, { lw: 2.2 });
      ctx.fillStyle = o.dots || '#E8C27A'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 9, -35, 2.4, 0, TAU); ctx.fill(); }
    };
  }

  // ================= DELILAH =================
  const DL = { skin: '#C99068', hair: '#2A1A12', hairSh: '#130A06', hairHi: '#5A3A26', red: '#A8432C', redSh: '#7A2C1C', cream: '#EADCC0', creamSh: '#C9B48E', gold: '#E2B25A', goldSh: '#A87A2E' };
  function delilahHair(back) {
    return (ctx, layer, E, fx, fy, P) => {
      if (layer === 'back0') {
        part(ctx, blob([[-38, -34], [-46, 4], [-52, 56], [-58, 104], [-48, 126], [-30, 118], [-12, 128], [0, 120], [12, 128], [30, 118], [48, 126], [58, 104], [52, 56], [46, 4], [38, -34], [0, -56]], 0.5), DL.hair, { shade: DL.hairSh, sd: 7, rim: DL.hairHi, rimA: 0.8, rd: 2.5 });
        return;
      }
      if (layer !== 'front') return;
      // crown, centre parting, and the locks that frame the face
      const cap = blob([[-37, -2], [-38, -27], [-29, -46], [-11, -55], [0, -55], [11, -55], [29, -46], [38, -27], [37, -2], [33, 6], [30, -14 + fy * 0.3], [22, -29 + fy * 0.6], [7, -33 + fy * 0.8], [fx * 0.4, -29 + fy * 0.8], [-7, -33 + fy * 0.8], [-22, -29 + fy * 0.6], [-30, -14 + fy * 0.3], [-33, 6]], 0.5);
      part(ctx, cap, DL.hair, { shade: DL.hairSh, sd: 5, rim: DL.hairHi, rimA: 0.85, rd: 2.5 });
      ctx.strokeStyle = DL.hairHi; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.8;
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * (5 + k * 9) + fx * 0.4, -51 + k * 2); ctx.quadraticCurveTo(s * (13 + k * 9), -42, s * (22 + k * 5), -26 + k * 5); ctx.stroke(); }
      ctx.globalAlpha = 1;
      for (const s of [-1, 1]) {
        if (s * (E.turn || 0) < -0.55 || back) continue;
        const lock = blob([[s * 31, -16], [s * 39, 6], [s * 42, 40], [s * 40, 74], [s * 33, 92], [s * 27, 76], [s * 30, 44], [s * 29, 12]], 0.5);
        part(ctx, lock, DL.hair, { shade: DL.hairSh, sd: 4, rim: DL.hairHi, rimA: 0.8, rd: 2 });
        // earring: a gold drop
        const ex = s * 31 - (E.turn || 0) * 3;
        ctx.strokeStyle = LINE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex, 10); ctx.lineTo(ex, 18); ctx.stroke();
        part(ctx, ell(ex, 22, 4.2, 5.6), DL.gold, { shade: DL.goldSh, sd: 1.5, lw: 1.6 });
        part(ctx, ell(ex, 30, 2.6, 3.2), DL.gold, { lw: 1.3 });
      }
      // the band across the brow: red with small gold discs
      const bp = blob([[-38, -24], [-20, -36 + fy * 0.5], [0, -40 + fy * 0.6], [20, -36 + fy * 0.5], [38, -24], [38, -18], [20, -30 + fy * 0.5], [0, -34 + fy * 0.6], [-20, -30 + fy * 0.5], [-38, -18]], 0.4);
      part(ctx, bp, DL.red, { shade: DL.redSh, sd: 2, lw: 2 });
      for (let i = -2; i <= 2; i++) part(ctx, ell(i * 13 + fx * 0.3, -33 + Math.abs(i) * 2.2 + fy * 0.55, 3, 3), DL.gold, { lw: 1.2 });
      if (back) { // 'turn': seen from behind, the back of her head hides the far side of the face
        const k = clamp(back), edge = lerp(42, -21, k);
        const cov = blob([[-41, 14], [-43, -24], [-31, -49], [-8, -59], [edge * 0.4 + 10, -58], [edge + 10, -44], [edge + 2, -22], [edge - 1, 6], [edge - 4, 34], [edge - 10, 64], [-12, 84], [-36, 62]], 0.5);
        part(ctx, cov, DL.hair, { shade: DL.hairSh, sd: 6, rim: DL.hairHi, rimA: 0.85, rd: 2.5 });
        ctx.save(); ctx.clip(cov); ctx.strokeStyle = DL.hairHi; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.7;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-34 + i * 8, -44 + i * 2); ctx.quadraticCurveTo(-38 + i * 8, 0, -30 + i * 7, 50 + i * 4); ctx.stroke(); }
        ctx.restore();
        part(ctx, blob([[-42, -20], [edge * 0.5 - 6, -35], [edge + 10, -37], [edge + 10, -30], [edge * 0.5 - 6, -28], [-42, -13]], 0.4), DL.red, { shade: DL.redSh, sd: 2, lw: 2 });
        const ex = 27; ctx.strokeStyle = LINE; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(ex, 10); ctx.lineTo(ex, 18); ctx.stroke();
        part(ctx, ell(ex, 22, 4.2, 5.6), DL.gold, { shade: DL.goldSh, sd: 1.5, lw: 1.6 }); part(ctx, ell(ex, 30, 2.6, 3.2), DL.gold, { lw: 1.3 });
      }
    };
  }
  const delilahC = (back) => ({
    skin: DL.skin, skinSh: mix(DL.skin, '#5A3424', 0.32), skinRim: '#F6D2AE', rimA: 0.45,
    shX: 50, shY: -362, headY: -450, l1: 92, l2: 78, armR: [12, 9.5, 7.5], handK: 0.78, footX: 16, pivot: -250,
    sleeve: 'long', sleeveCol: DL.cream, sleeveSh: DL.creamSh, cuff: DL.red, bracelet: DL.gold, bell: 1,
    g: { long: 1, col: DL.red, sh: DL.redSh, rim: '#E07A5A', rimA: 0.5, nw: 17, neckY: -384, sw: 48, shY: -370, cw: 46, ww: 37, waistY: -262, hipw: 50, hipY: -205, hw: 66, hemY: -12,
      band: { col: DL.cream, h: 16, off: 14, pat: DL.red }, neckTrim: back ? null : DL.gold, yoke: back ? null : { col: DL.cream, w: 7 }, folds: [-30, -8, 14, 34],
      belt: { y: -262, h: 12, col: DL.gold, sh: DL.goldSh, tails: back ? 0 : 54, tx: 10, knot: DL.gold } },
    head: { fw: 30, shape: 'woman', skin: DL.skin, sh: mix(DL.skin, '#5A3424', 0.32), rim: '#F6D2AE', rimA: 0.5, erx: 7.6, ery: 5.0, sp: 12.5, ey: -3, iris: '#2A170C', lash: 1, kohl: 1, bth: 3.4, bcol: '#1E120B', arch: 1.5, noseK: 0.82, my: 29, mw: 7, lip: '#A9544A', blush: 'rgba(205,95,80,0.2)', ears: false, hair: delilahHair(back) },
    over: (ctx, C, P, f) => { // the necklace (front) or her long hair down her back ('turn'); the lap ('sit')
      if (back) {
        const hp = blob(fm(f, [[-30, -414], [-40, -380], [-45, -330], [-46, -290], [-40, -258], [-26, -248], [-12, -258], [2, -246], [16, -256], [30, -248], [42, -262], [46, -300], [44, -344], [38, -388], [28, -414]]), 0.5);
        part(ctx, hp, DL.hair, { shade: DL.hairSh, sd: 7, rim: DL.hairHi, rimA: 0.8, rd: 2.5 });
        ctx.save(); ctx.clip(hp); ctx.strokeStyle = DL.hairHi; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.6;
        for (let i = -3; i <= 3; i++) ctx.stroke(pathF(f, [['M', i * 10, -400], ['Q', i * 12 + 4, -330, i * 11, -262]]));
        ctx.restore();
      }
      if (!back) {
        ctx.save(); ctx.fillStyle = DL.gold; ctx.strokeStyle = LINE; ctx.lineWidth = 1.2;
        for (let i = -4; i <= 4; i++) { const p = f(i * 4.6, -382 + 12 * (1 - (i / 4) ** 2)); ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, TAU); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }
      if (P.seat) { // her knees, forward: the lap (world coordinates)
        const lap = blob([[-60, -116], [-58, -148], [-42, -168], [-18, -168], [0, -160], [18, -168], [42, -168], [58, -148], [60, -116], [30, -106], [0, -110], [-30, -106]], 0.5);
        part(ctx, lap, DL.red, { shade: DL.redSh, sd: 9, rim: '#E07A5A', rimA: 0.5 });
        ctx.strokeStyle = DL.redSh; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -156); ctx.quadraticCurveTo(-2, -132, 0, -112); ctx.stroke();
        for (const x of [-36, 34]) { ctx.beginPath(); ctx.moveTo(x, -104); ctx.quadraticCurveTo(x * 1.08, -60, x * 1.1, -22); ctx.stroke(); }
      }
    },
  });
  const COUCH = { wood: '#7A5236', woodSh: '#54371F', woodHi: '#B08458', cush: '#E6D5B5', cushSh: '#C2AE88', cloth: '#A8432C', clothSh: '#7A2C1C' };
  function couch(ctx, x0, x1, seatY) {
    // a low couch: carved frame, a cushion and a red throw
    for (const x of [x0 + 14, x1 - 14]) part(ctx, poly([[x - 9, -40], [x + 9, -40], [x + 6, 0], [x - 6, 0]]), COUCH.wood, { shade: COUCH.woodSh, sd: 3 });
    part(ctx, poly([[x0, seatY + 34], [x1, seatY + 34], [x1, -36], [x0, -36]]), COUCH.wood, { shade: COUCH.woodSh, sd: 6, rim: COUCH.woodHi, rimA: 0.6 });
    const cu = P2(); cu.roundRect(x0 - 6, seatY, x1 - x0 + 12, 38, 14);
    part(ctx, cu, COUCH.cush, { shade: COUCH.cushSh, sd: 7 });
    ctx.save(); ctx.clip(cu); ctx.fillStyle = COUCH.cloth; for (let x = x0 + 10; x < x1; x += 34) ctx.fillRect(x, seatY, 6, 40); ctx.restore();
    const ar = P2(); ar.roundRect(x1 - 26, seatY - 40, 34, 72, 14); part(ctx, ar, COUCH.wood, { shade: COUCH.woodSh, sd: 5, rim: COUCH.woodHi, rimA: 0.6 });
  }
  PP2.couch = (ctx, st = {}) => couch(ctx, st.x0 ?? -300, st.x1 ?? 120, st.seatY ?? -100);
  const LAP = [2, -166];               // Delilah 'sit': where Samson's head rests (relative to her origin)
  PP2.LAP = LAP;
  PP2.delilah = (ctx, st = {}) => {
    const pose = st.pose || 'stand', t = st.t || 0, br = Math.sin(t * 2) * 0.8;
    const P = { t, arms: {}, head: { look: st.look || [0, 0], mouth: 'neutral' }, feet: { '-1': [-16, 0], '1': [16, 0] } };
    const back = pose === 'turn';
    const C = delilahC(back ? 1 : 0);
    switch (pose) {
      case 'turn': { // seen from behind, looking back over her right shoulder at the camera
        P.bt = 0.15; P.arms = { '-1': { A: 6, B: -4, hand: 'open', hdir: 95 }, '1': { A: 8, B: -8, hand: 'open', hdir: 88 } };
        Object.assign(P.head, { turn: 0.75, turnK: 1.3, dx: 9, dy: 2, tilt: 0.1, look: st.look || [-0.75, 0], mouth: 'smile', lid: 0.2 });
        C.head.hair = delilahHair(Math.max(0.001, st.k ?? 1)); break;
      }
      case 'call': {
        P.lean = -0.06;
        P.arms = { '-1': { T: [-31, -398], pole: [-150, -320], hand: 'cup', hdir: -76, front: 1 }, '1': { A: 10, B: -22, hand: 'open', hdir: 84 } };
        Object.assign(P.head, { turn: -0.5, pitch: -0.05, look: [-1, 0], mouth: 'open', lift: 2 }); break;
      }
      case 'sit': {
        P.seat = 1; P.by = 80;
        P.feet = { '-1': [-20, 0], '1': [22, 0] };
        P.arms = { '-1': { T: [-84, -190], pole: [-170, -260], hand: 'open', hdir: 110 }, '1': { T: [40, -244], pole: [150, -280], hand: 'open', hdir: 165 } };
        Object.assign(P.head, { pitch: 0.32, turn: -0.18, tilt: -0.08, look: st.look || [-0.5, 0.7], mouth: 'neutral', lid: 0.3 });
        st.lapX = LAP[0]; st.lapY = LAP[1];
        if (st.couch !== false) couch(ctx, -112, 112, -102);
        break;
      }
      case 'beckon': {
        const w = Math.sin(t * 5) * 6;
        P.arms = { '1': { T: [128, -470 + w * 0.3], pole: [170, -300], hand: 'open', hdir: -76 + w }, '-1': { T: [-22, -262], pole: [-130, -300], hand: 'open', hdir: 20 } };
        Object.assign(P.head, { turn: 0.35, tilt: 0.05, look: [1, 0], mouth: 'smile', lift: 1.5 }); P.lean = 0.03; break;
      }
      default: { // 'stand': hands folded at the waist
        P.arms = { '-1': { T: [6, -258], pole: [-140, -300], hand: 'open', hdir: 10 }, '1': { T: [-4, -252], pole: [140, -300], hand: 'open', hdir: 170 } };
        Object.assign(P.head, { turn: 0.12, tilt: 0.04, mouth: 'smile', look: st.look || [0.2, 0] }); P.lean = -0.02;
      }
    }
    P.shUp = br * 0.5;
    drawFig(ctx, C, P);
  };

  // ================= THE BRIDE OF TIMNAH =================
  const BR = { skin: '#C48A60', hair: '#2C1C12', cream: '#E4D6BA', creamSh: '#BFAE8C', red: '#B24A32', redSh: '#7E3020', jar: '#B8653A', jarSh: '#874322', jarBand: '#5E2A16' };
  function brideHair(ctx, layer, E, fx, fy) {
    if (layer === 'back0') { part(ctx, blob([[-36, -34], [-42, 4], [-40, 40], [-20, 48], [0, 44], [20, 48], [40, 40], [42, 4], [36, -34], [0, -56]], 0.5), BR.hair, { shade: '#140B07', sd: 6 }); return; }
    if (layer !== 'front') return;
    const cap = blob([[-36, 0], [-37, -27], [-28, -46], [-10, -54], [0, -54], [10, -54], [28, -46], [37, -27], [36, 0], [31, 2], [28, -16 + fy * 0.3], [20, -30 + fy * 0.6], [6, -33 + fy * 0.8], [fx * 0.4, -29 + fy * 0.8], [-6, -33 + fy * 0.8], [-20, -30 + fy * 0.6], [-28, -16 + fy * 0.3], [-31, 2]], 0.5);
    part(ctx, cap, BR.hair, { shade: '#140B07', sd: 5, rim: '#5A3C26', rimA: 0.85, rd: 2.5 });
    part(ctx, blob([[-37, -22], [0, -36 + fy * 0.5], [37, -22], [37, -15], [0, -29 + fy * 0.5], [-37, -15]], 0.35), BR.red, { lw: 2 });
    // one braid over the front of her right shoulder (screen left)
    braid(ctx, [-30, 14], [-44, 50], [-38, 112], BR.hair, '#5A3C26', 7.5);
  }
  const brideC = () => ({
    skin: BR.skin, skinSh: mix(BR.skin, '#5A3424', 0.33), skinRim: '#F4CFA6', rimA: 0.45,
    shX: 49, shY: -360, headY: -447, l1: 92, l2: 78, armR: [12, 9.5, 7.5], handK: 0.78, footX: 16, pivot: -250,
    sleeve: 'short', sleeveCol: BR.cream, sleeveSh: BR.creamSh, sleeveTrim: BR.red,
    g: { long: 1, col: BR.cream, sh: BR.creamSh, rim: '#FFF4DC', rimA: 0.5, nw: 16, neckY: -382, sw: 47, shY: -368, cw: 45, ww: 37, waistY: -262, hipw: 48, hipY: -205, hw: 62, hemY: -12,
      band: { col: BR.red, h: 9, off: 12 }, neckTrim: BR.red, folds: [-28, -6, 16, 34], belt: { y: -262, h: 11, col: BR.red, sh: BR.redSh, tails: 40, tx: -12 } },
    head: { fw: 30, shape: 'woman', skin: BR.skin, sh: mix(BR.skin, '#5A3424', 0.33), rim: '#F4CFA6', rimA: 0.5, erx: 7.4, ery: 5.0, sp: 12.5, ey: -3, iris: '#2E1C10', lash: 1, bth: 3.4, arch: 1, noseK: 0.8, my: 29, mw: 6.5, lip: '#B0625A', blush: 'rgba(205,95,80,0.2)', ears: false, hair: brideHair },
  });
  function jar(ctx, c, ang) { // a water jar (two small handles), centre c, tilted
    ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(ang);
    const body = blob([[0, -58], [14, -54], [16, -44], [34, -30], [42, 0], [36, 30], [20, 48], [0, 54], [-20, 48], [-36, 30], [-42, 0], [-34, -30], [-16, -44], [-14, -54]], 0.45);
    for (const s of [-1, 1]) { const h = P2(); h.moveTo(s * 16, -44); h.quadraticCurveTo(s * 40, -50, s * 34, -26); ctx.strokeStyle = LINE; ctx.lineWidth = 8; ctx.stroke(h); ctx.strokeStyle = BR.jar; ctx.lineWidth = 4; ctx.stroke(h); }
    part(ctx, body, BR.jar, { shade: BR.jarSh, sd: 9, rim: '#E8A070', rimA: 0.6 });
    ctx.save(); ctx.clip(body); ctx.strokeStyle = BR.jarBand; for (const [y, w] of [[-24, 3], [-16, 2], [8, 3]]) { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-44, y); ctx.quadraticCurveTo(0, y + 6, 44, y); ctx.stroke(); } ctx.restore();
    part(ctx, ell(0, -58, 15, 5), '#9A5230', { lw: 2 }); part(ctx, ell(0, -58, 9, 2.6), '#4A2414', { line: false });
    ctx.restore();
  }
  PP2.bride = (ctx, st = {}) => {
    const pose = st.pose || 'stand', t = st.t || 0;
    const C = brideC();
    const P = { t, arms: {}, head: { look: st.look || [0, 0], mouth: 'smile' } };
    if (pose === 'jar') {
      // the jar rests on her left shoulder (screen right), steadied by her raised left hand
      P.arms = { '1': { T: [70, -446], pole: [170, -320], hand: 'open', hdir: -110 }, '-1': { A: 9, B: -8, hand: 'open' } };
      Object.assign(P.head, { turn: -0.18, tilt: -0.07, look: st.look || [-0.4, 0] }); P.lean = -0.03;
      C.under = (ctx2, C2, P2_, f, U) => withM(ctx2, U, () => jar(ctx2, [82, -440], 0.32));
    } else {
      P.arms = { '-1': { T: [4, -258], pole: [-140, -300], hand: 'open', hdir: 10 }, '1': { T: [-6, -252], pole: [140, -300], hand: 'open', hdir: 170 } };
      Object.assign(P.head, { turn: 0.1, tilt: 0.04 });
    }
    drawFig(ctx, C, P);
  };

  // ================= MANOAH and his wife =================
  const ELD = { skinM: '#B07650', skinW: '#BC8460' };
  const manoahC = () => ({
    skin: ELD.skinM, skinSh: mix(ELD.skinM, '#4A2A1A', 0.35), shX: 60, shY: -380, headY: -468, l1: 96, l2: 80, armR: [14, 12, 10], handK: 0.86, footX: 22, pivot: -260,
    sleeve: 'long', bell: 3,
    g: { long: 1, col: '#7A5A3E', sh: mix('#7A5A3E', '#2A1E16', 0.35), nw: 22, neckY: -404, sw: 66, shY: -392, cw: 68, ww: 64, waistY: -292, hipw: 72, hipY: -200, hw: 80, hemY: -14,
      stripes: [{ x: -34, w: 12, col: '#5A3F2A' }, { x: 34, w: 12, col: '#5A3F2A' }], folds: [-52, 52], belt: { y: -292, h: 15, col: '#4E3624', tails: 50, tx: -14 } },
    over: (ctx, C, P, f) => { // a mantle over the left shoulder
      part(ctx, blob(fm(f, [[20, -400], [62, -392], [70, -340], [60, -250], [44, -160], [30, -170], [36, -260], [30, -340]]), 0.4), '#9A7A56', { shade: '#6E5238', sd: 9 });
    },
    head: { fw: 33, shape: 'man', skin: ELD.skinM, sh: mix(ELD.skinM, '#4A2A1A', 0.35), erx: 6.8, ery: 4.4, iris: '#3A2414', bth: 4.6, bcol: '#B8B0A4', wrinkles: 1, lid: 0.2, my: 32, mw: 7,
      beard: { col: '#B4ADA2', sh: '#857E74', hi: '#E2DCD2', len: 1.3, line: '#8E877C' }, ears: false, hair: headCloth('#E0D3B6', '#5C3F2A', { grey: '#C8C2B8' }) },
  });
  const motherC = () => ({
    skin: ELD.skinW, skinSh: mix(ELD.skinW, '#4A2A1A', 0.34), shX: 50, shY: -356, headY: -436, l1: 90, l2: 76, armR: [12, 10, 8], handK: 0.8, footX: 17, pivot: -246,
    sleeve: 'long', bell: 2,
    g: { long: 1, col: '#9A6A44', sh: mix('#9A6A44', '#2A1E16', 0.35), nw: 18, neckY: -378, sw: 50, shY: -364, cw: 50, ww: 44, waistY: -258, hipw: 54, hipY: -196, hw: 68, hemY: -12,
      band: { col: '#6E4A30', h: 8, off: 14 }, folds: [-30, -6, 18, 36], belt: { y: -258, h: 11, col: '#5E4430', tails: 44, tx: 12 } },
    head: { fw: 30, shape: 'woman', skin: ELD.skinW, sh: mix(ELD.skinW, '#4A2A1A', 0.34), erx: 7, ery: 4.6, sp: 12.5, ey: -3, iris: '#33200F', lash: 1, bth: 3.6, bcol: '#4A3A30', wrinkles: 1, lid: 0.15, noseK: 0.85, my: 29, mw: 6.5, lip: '#A86A5C', ears: false, hair: veil('#C9B48E', { hair: '#9C958C', trim: '#8A6A44' }) },
  });
  function elderPose(st, who) {
    const pose = st.pose || 'stand', t = st.t || 0, sh = clamp(st.shake ?? Math.sin(t * 7), -1, 1);
    const P = { t, arms: {}, head: { look: st.look || [0, 0], mouth: 'neutral' } };
    switch (pose) {
      case 'object': { // both hands raised palms out, shaking the head (14:3)
        const r = who === 'w' ? 0.92 : 1;
        P.arms = { '-1': { T: [-104 * r, -406 * r], pole: [-150, -250], hand: 'open', hdir: -96 }, '1': { T: [104 * r, -406 * r], pole: [150, -250], hand: 'open', hdir: -84 } };
        Object.assign(P.head, { turn: sh * 0.32, tilt: sh * 0.06, mouth: 'open', furrow: 0.75, look: [sh * 0.4, 0] }); P.shUp = 4; break;
      }
      case 'awe': { // kneeling, hands to her face, looking up at the angel (13:3-6)
        P.kneel = 1; P.by = 150; P.lean = -0.04;
        P.arms = { '-1': { T: [-31, -398], pole: [-130, -300], hand: 'open', hdir: -82, front: 1 }, '1': { T: [31, -398], pole: [130, -300], hand: 'open', hdir: -98, front: 1 } };
        Object.assign(P.head, { pitch: -0.45, turn: -0.15, mouth: 'o', furrow: -0.5, lift: 3, look: [-0.3, -1] }); break;
      }
      case 'worried': {
        if (who === 'w') P.arms = { '-1': { T: [-4, -330], pole: [-150, -300], hand: 'open', hdir: -30 }, '1': { T: [6, -322], pole: [150, -300], hand: 'open', hdir: 210 } };
        else P.arms = { '1': { T: [18, -404], pole: [150, -320], hand: 'fist', hdir: -110 }, '-1': { T: [10, -286], pole: [-150, -300], hand: 'open', hdir: 10 } };
        Object.assign(P.head, { turn: who === 'w' ? -0.15 : 0.15, tilt: who === 'w' ? -0.08 : 0.06, mouth: 'frown', furrow: -0.6, lift: 2, look: st.look || [0.3, 0.1] }); break;
      }
      default: {
        P.arms = { '-1': { A: 8, B: -26, hand: 'open', hdir: 100 }, '1': { A: 8, B: -26, hand: 'open', hdir: 80 } };
        Object.assign(P.head, { turn: who === 'w' ? -0.1 : 0.1 });
      }
    }
    if (pose === 'awe' && who !== 'w') { P.kneel = 0; P.by = 0; }
    return P;
  }
  PP2.manoah = (ctx, st = {}) => drawFig(ctx, manoahC(), elderPose(st, 'm'));
  PP2.mother = (ctx, st = {}) => drawFig(ctx, motherC(), elderPose(st, 'w'));

  // ================= THE ANGEL OF THE LORD =================
  const ANG = { skin: '#D8A27A', robe: '#F6F0E2', robeSh: '#D8CCB2', gold: '#E3C27A', goldSh: '#B8954C', hair: '#8A5E3A' };
  function angelHair(ctx, layer, E, fx, fy) {
    if (layer === 'back0') { part(ctx, blob([[-38, -34], [-44, 4], [-46, 44], [-30, 58], [0, 52], [30, 58], [46, 44], [44, 4], [38, -34], [0, -58]], 0.5), ANG.hair, { shade: '#5E3E24', sd: 6, rim: '#D8A870', rimA: 0.9 }); return; }
    if (layer !== 'front') return;
    const cap = blob([[-37, 4], [-38, -27], [-29, -47], [-10, -56], [0, -56], [10, -56], [29, -47], [38, -27], [37, 4], [32, 8], [30, -14 + fy * 0.3], [22, -30 + fy * 0.6], [6, -34 + fy * 0.8], [fx * 0.4, -30 + fy * 0.8], [-6, -34 + fy * 0.8], [-22, -30 + fy * 0.6], [-30, -14 + fy * 0.3], [-32, 8]], 0.5);
    part(ctx, cap, ANG.hair, { shade: '#5E3E24', sd: 5, rim: '#E8BE84', rimA: 0.95, rd: 3 });
  }
  const angelC = (glow) => ({
    skin: ANG.skin, skinSh: mix(ANG.skin, '#8A5A3A', 0.3), skinRim: '#FFE6BE', rimA: 0.8, shX: 64, shY: -436, headY: -530, l1: 106, l2: 90, armR: [14, 12, 10], handK: 0.88, footX: 22, pivot: -280,
    sleeve: 'long', bell: 6, sleeveCol: ANG.robe, sleeveSh: ANG.robeSh, cuff: ANG.gold,
    g: { long: 1, col: ANG.robe, sh: ANG.robeSh, rim: '#FFF8E8', rimA: 0.9, nw: 22, neckY: -450, sw: 70, shY: -438, cw: 70, ww: 62, waistY: -322, hipw: 72, hipY: -214, hw: 92, hemY: -10,
      band: { col: ANG.gold, h: 10, off: 12 }, neckTrim: ANG.gold, folds: [-56, -24, 6, 34, 62], foldCol: 'rgba(190,170,130,0.7)', belt: { y: -322, h: 12, col: ANG.gold, sh: ANG.goldSh, tails: 80, tx: 0 } },
    head: { fw: 32, shape: 'youth', skin: ANG.skin, sh: mix(ANG.skin, '#8A5A3A', 0.3), rim: '#FFE6BE', rimA: 0.8, erx: 7, ery: 4.6, iris: '#4A3018', lid: 0.32, bth: 3.8, bcol: '#6A4628', my: 31, mw: 7, blush: 'rgba(220,120,90,0.14)', ears: false, hair: angelHair },
    aura: (ctx) => {
      const g = clamp(glow);
      if (g <= 0.01) return;
      const R = 320 + 130 * g;
      const gr = ctx.createRadialGradient(0, -310, 20, 0, -310, R);
      gr.addColorStop(0, `rgba(255,236,170,${0.46 * g})`); gr.addColorStop(0.45, `rgba(255,214,130,${0.26 * g})`); gr.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, -310, R * 0.74, R * 0.9, 0, 0, TAU); ctx.fill();
    },
    after: (ctx) => { // a soft bloom over the figure itself
      const g = clamp(glow); if (g <= 0.01) return;
      ctx.save(); ctx.globalCompositeOperation = 'source-atop';
      const gr = ctx.createRadialGradient(-40, -420, 10, -10, -320, 420); gr.addColorStop(0, `rgba(255,248,220,${0.38 * g})`); gr.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = gr; ctx.fillRect(-500, -800, 1000, 820); ctx.restore();
    },
  });
  PP2.angel = (ctx, st = {}) => {
    const pose = st.pose || 'stand', t = st.t || 0, glow = st.glow ?? 1;
    const C = angelC(glow);
    const P = { t, arms: {}, head: { look: st.look || [-0.2, 0.1], mouth: 'smile', lift: 0.5 } };
    if (pose === 'speak') {
      P.arms = { '1': { T: [124, -500], pole: [190, -350], hand: 'open', hdir: -82 }, '-1': { A: 10, B: -30, hand: 'open', hdir: 100 } };
      Object.assign(P.head, { mouth: 'part', turn: -0.08, tilt: -0.03 });
    } else P.arms = { '-1': { A: 9, B: -24, hand: 'open', hdir: 100 }, '1': { A: 9, B: -24, hand: 'open', hdir: 80 } };
    P.by = Math.sin(t * 1.2) * 2;
    drawFig(ctx, C, P);
  };

  // ================= PHILISTINE LORD =================
  const LD = { skin: '#C08458', robe: '#9E3B28', robeSh: '#6E2618', cream: '#E8D8B4', gold: '#E0AE4E', goldSh: '#9A7228' };
  const lordC = () => ({
    skin: LD.skin, skinSh: mix(LD.skin, '#5A3424', 0.35), shX: 62, shY: -386, headY: -472, l1: 96, l2: 80, armR: [14, 12, 10], handK: 0.88, footX: 22, pivot: -262,
    sleeve: 'long', bell: 5, cuff: LD.cream,
    g: { long: 1, col: LD.robe, sh: LD.robeSh, rim: '#E07A5A', rimA: 0.45, nw: 22, neckY: -406, sw: 68, shY: -394, cw: 70, ww: 64, waistY: -296, hipw: 74, hipY: -200, hw: 84, hemY: -14,
      band: { col: LD.cream, h: 22, off: 18, pat: LD.robe }, panel: { col: LD.cream, w: 22, y0: -296 }, folds: [-50, 50], belt: { y: -296, h: 15, col: LD.gold, sh: LD.goldSh, tails: 0 } },
    collar: (ctx, C, P, f) => { // the broad gold collar
      const pts = [];
      for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); pts.push([-Math.cos(a) * 66, -404 + Math.sin(a) * 40]); }
      for (let i = 12; i >= 0; i--) { const a = Math.PI * (i / 12); pts.push([-Math.cos(a) * 30, -406 + Math.sin(a) * 16]); }
      const col = blob(fm(f, pts), 0.3);
      part(ctx, col, LD.gold, { shade: LD.goldSh, sd: 4, rim: '#FFE7A8', rimA: 0.8 });
      ctx.save(); ctx.clip(col); ctx.strokeStyle = LD.goldSh; ctx.lineWidth = 1.6;
      for (let r = 0; r < 2; r++) { ctx.beginPath(); for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16), p = f(-Math.cos(a) * (42 + r * 12), -406 + Math.sin(a) * (24 + r * 8)); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); }
      ctx.fillStyle = '#B8452E'; for (let i = 1; i < 10; i++) { const a = Math.PI * (i / 10), p = f(-Math.cos(a) * 58, -406 + Math.sin(a) * 34); ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, TAU); ctx.fill(); }
      ctx.restore();
    },
    head: { fw: 34, shape: 'man', skin: LD.skin, sh: mix(LD.skin, '#5A3424', 0.35), erx: 7, ery: 4.6, iris: '#3A2414', bth: 4.6, my: 30, mw: 8, ears: true, hair: featherCrown('#A8432C', { n: 6, tall: 1.12 }) },
  });
  PP2.lord = (ctx, st = {}) => {
    const pose = st.pose || 'stand', t = st.t || 0, dir = st.dir ?? -1;
    const C = lordC();
    const P = { t, arms: {}, head: { look: st.look || [0, 0], mouth: 'half' } };
    switch (pose) {
      case 'laugh': { // head back, pointing at Samson (st.dir: -1 screen left, default)
        const bob = Math.sin(t * 14) * 3;
        P.arms[dir] = { T: [dir * 250, -446 + bob * 0.3], pole: [dir * 160, -300], hand: 'point', hdir: dir < 0 ? 186 : -6 };
        P.arms[-dir] = { T: [-dir * 10, -300], pole: [-dir * 150, -300], hand: 'open', hdir: dir < 0 ? 200 : -20 };
        Object.assign(P.head, { pitch: -0.4, tilt: -dir * 0.12, turn: dir * 0.25, mouth: 'laugh', closed: 'happy', lift: 3, dy: bob }); P.lean = -dir * 0.05; break;
      }
      case 'fall': { // arms thrown up, toppling back as the house falls (no gore)
        const k = clamp(st.k ?? 0.4), d = st.dir ?? 1;
        P.arms = { '-1': { T: [-150, -600], pole: [-260, -420], hand: 'open', hdir: -110 }, '1': { T: [160, -590], pole: [260, -420], hand: 'open', hdir: -70 } };
        Object.assign(P.head, { pitch: -0.3, mouth: 'o', lift: 4, furrow: -0.6, look: [0, -1] }); P.rot = d * k * 0.36; P.rotO = [d * 26, 0]; P.lean = d * 0.06;
        P.feet = { '-1': [-24, 0], '1': [30, -24 * k] }; break;
      }
      default: {
        P.arms = { '-1': { T: [4, -300], pole: [-150, -300], hand: 'open', hdir: 10 }, '1': { T: [-4, -294], pole: [150, -300], hand: 'open', hdir: 170 } };
        Object.assign(P.head, { pitch: -0.1, turn: 0.08, look: st.look || [0.2, 0], mouth: 'half' });
      }
    }
    drawFig(ctx, C, P);
  };

  // ================= THE BARBER (16:19) =================
  const barberC = () => ({
    skin: '#B47A50', skinSh: mix('#B47A50', '#5A3424', 0.35), shX: 58, shY: -380, headY: -462, l1: 92, l2: 78, armR: [14, 12, 10], handK: 0.86, footX: 22, pivot: -260, hipY: -200, bulge: 2,
    sleeve: 'short', sleeveCol: '#E4D3B0', sleeveSh: mix('#E4D3B0', '#6B4A33', 0.35), sleeveTrim: '#A8432C',
    g: { col: '#E4D3B0', sh: mix('#E4D3B0', '#6B4A33', 0.35), nw: 22, neckY: -402, sw: 62, shY: -388, cw: 60, ww: 56, waistY: -296, hipw: 62, hipY: -240, hw: 70, hemY: -196,
      band: { col: '#A8432C', h: 10, off: 10 }, neckTrim: '#A8432C', panel: { col: '#A8432C', w: 20, y0: -296 }, belt: { y: -296, h: 13, col: '#7A3A22', tails: 0 } },
    head: { fw: 33, shape: 'man', skin: '#B47A50', sh: mix('#B47A50', '#5A3424', 0.35), erx: 6.8, ery: 4.4, iris: '#3A2414', bth: 4.4, my: 30, mw: 7, hair: hairCap('#2A1A12', '#140B07', '#5A3C26', { band: '#A8432C' }) },
  });
  PP2.barber = (ctx, st = {}) => {
    const k = clamp(st.k ?? 0.5), t = st.t || 0;
    const C = barberC();
    // kneeling on his right knee, turned to screen left, the razor hand drawing a stroke (st.k 0..1)
    const P = {
      t, by: 92, bt: -0.4, lean: -0.14, pivot: -262,
      feet: { '-1': [-94, 0], '1': [72, -4] }, kneeAt: { '-1': [-90, -114], '1': [28, -14] }, hideFoot: { '1': 1 },
      arms: {
        '-1': { Tw: [lerp(-150, -196, k), lerp(-236, -206, k)], pole: [-60, -120], hand: 'fist', hdir: lerp(160, 130, k), item: 'razor' },
        '1': { Tw: [-112, -204], pole: [60, -100], hand: 'open', hdir: 175 },
      },
      head: { turn: -0.5, pitch: 0.3, tilt: -0.06, look: [-1, 0.8], mouth: 'flat', furrow: 0.35 },
    };
    drawFig(ctx, C, P);
  };

  // ================= THE BOY WHO LED HIM (16:26) =================
  const boyC = () => ({
    skin: '#C08458', skinSh: mix('#C08458', '#5A3424', 0.35), skinRim: '#F2C69A', rimA: 0.4, shX: 44, shY: -292, headY: -360, l1: 74, l2: 62, armR: [11, 9, 7.5], handK: 0.74, footX: 17, pivot: -210, hipY: -160,
    legW: [10, 10.5, 11, 10, 7.5, 5.5], sleeve: 'short', sleeveCol: '#D8C8A8', sleeveSh: mix('#D8C8A8', '#6B4A33', 0.35),
    g: { col: '#D8C8A8', sh: mix('#D8C8A8', '#6B4A33', 0.35), nw: 16, neckY: -312, sw: 46, shY: -298, cw: 44, ww: 42, waistY: -228, hipw: 46, hipY: -170, hw: 52, hemY: -126,
      neckTrim: '#8A6A4A', folds: [-22, 4, 26], belt: { y: -228, h: 10, col: '#6A4630', tails: 34, tx: -10 } },
    head: { fw: 31, shape: 'youth', fh: 0.96, skin: '#C08458', sh: mix('#C08458', '#5A3424', 0.35), erx: 7.4, ery: 5, sp: 12.5, iris: '#33200F', bth: 3.8, my: 29, mw: 6.5, hair: hairCap('#24160F', '#120A06', '#4A3020', { curls: 1 }) },
  });
  PP2.boy = (ctx, st = {}) => {
    const pose = st.pose || 'lead', t = st.t || 0, ph = st.phase ?? t * 5.5;
    const C = boyC();
    const P = { t, arms: {}, head: { look: st.look || [0, 0], mouth: 'neutral' } };
    if (pose === 'lead') { // walking to screen right, one arm reaching back to screen left (holding Samson's hand)
      const s1 = Math.sin(ph);
      P.feet = {}; P.knee = {};
      for (const s of [-1, 1]) { const lift = Math.max(0, -s * s1) * 20; P.feet[s] = [s * 17, -lift]; P.knee[s] = s * lift * 0.4; }
      P.by = -Math.abs(s1) * 2.5 + 1; P.bt = 0.3; P.lean = 0.05;
      P.arms = { '-1': { T: [-146, -226], pole: [-90, -130], hand: 'open', hdir: 176 }, '1': { A: 10 + s1 * 4, B: -10 - Math.max(0, s1) * 20, hand: 'fist' } };
      Object.assign(P.head, { turn: -0.35, look: [-1, 0.1], mouth: 'neutral', lift: 1 });
    } else {
      P.arms = { '-1': { A: 8, B: -8, hand: 'fist' }, '1': { A: 8, B: -8, hand: 'fist' } };
    }
    drawFig(ctx, C, P);
  };

  // ================= CROWD PEOPLE =================
  // st.v 0..11: 0-5 Israelite / generic folk in earth tones (men with head cloths, women with veils, a young man, an
  // old man); 6-11 Philistines in red and cream (men with feathered crowns or headbands, women in red/cream).
  const PV = [
    { sex: 'm', skin: '#B57B52', robe: '#8A6A4A', stripe: '#5E4430', cloth: '#DCCDAE', band: '#5C3F2A', beard: '#3A2A1E' },
    { sex: 'f', skin: '#C08458', robe: '#7B5E46', veil: '#C9B48E', hair: '#2A1A12' },
    { sex: 'm', skin: '#A87048', robe: '#6E5A44', stripe: '#9A7650', cloth: '#C9B48E', band: '#4A3424', beard: '#2C1E14' },
    { sex: 'm', skin: '#C99062', robe: '#9A7650', young: 1, hairCol: '#2C1B12', beard: '#2C1B12', short: 1 },
    { sex: 'f', skin: '#B47A50', robe: '#8E5E3E', veil: '#DCCDAE', hair: '#3A2418' },
    { sex: 'm', skin: '#9E6A45', robe: '#5E4A3A', stripe: '#A08060', cloth: '#BBA382', band: '#3A2A1E', beard: '#A8A296', old: 1 },
    { sex: 'm', phil: 1, skin: '#C08458', robe: '#E4D3B0', trim: '#A8432C', feathers: 1 },
    { sex: 'm', phil: 1, skin: '#B47A50', robe: '#B24A32', trim: '#E4D3B0', hairCol: '#2A1A12', hband: '#E4D3B0' },
    { sex: 'f', phil: 1, skin: '#C99062', robe: '#E4D3B0', trim: '#A8432C', veil: '#B24A32', hair: '#2A1A12' },
    { sex: 'm', phil: 1, skin: '#A87048', robe: '#D8C6A0', trim: '#B24A32', feathers: 1 },
    { sex: 'f', phil: 1, skin: '#C08458', robe: '#A8432C', trim: '#E4D3B0', veil: '#E4D3B0', hair: '#24160F' },
    { sex: 'm', phil: 1, skin: '#C68A5E', robe: '#E4D3B0', trim: '#8E3A26', hairCol: '#3A2418', hband: '#A8432C' },
  ];
  // cast kit: st.cast = { sex, skin, robe, stripe, cloth, band, beard, hairCol, short, old, young, veil, hair } overrides a variant
  const personC = (v, cast) => {
    const o = cast ? Object.assign({}, PV[((v % 12) + 12) % 12], cast) : PV[((v % 12) + 12) % 12], w = o.sex === 'f', sh = mix(o.skin, '#4A2A1A', 0.35);
    const rsh = mix(o.robe, '#2A1E16', 0.35);
    const g = w
      ? { long: 1, col: o.robe, sh: rsh, nw: 17, neckY: -380, sw: 49, shY: -366, cw: 48, ww: 42, waistY: -258, hipw: 52, hipY: -198, hw: 66, hemY: -12, folds: [-28, 0, 26], belt: { y: -258, h: 10, col: o.trim || mix(o.robe, '#24160F', 0.4), tails: 36, tx: 10 }, band: o.trim ? { col: o.trim, h: 9, off: 12 } : null }
      : { long: 1, col: o.robe, sh: rsh, nw: 22, neckY: -404, sw: 66, shY: -392, cw: 68, ww: 62, waistY: -292, hipw: 70, hipY: -200, hw: 78, hemY: -14, folds: [-50, 50],
        stripes: o.stripe ? [{ x: -34, w: 12, col: o.stripe }, { x: 34, w: 12, col: o.stripe }] : null, band: o.trim ? { col: o.trim, h: 14, off: 16 } : null, panel: o.phil && o.trim ? { col: o.trim, w: 16, y0: -292 } : null,
        belt: { y: -292, h: 14, col: o.trim || '#5C3F2A', tails: 44, tx: -12 } };
    let hair;
    if (w) hair = veil(o.veil, { hair: o.hair, trim: o.phil ? (o.trim === '#E4D3B0' ? '#A8432C' : '#E4D3B0') : null });
    else if (o.feathers) hair = featherCrown(o.trim);
    else if (o.crown) hair = royalCrown(hairCap(o.hairCol || '#2A1A12', mix(o.hairCol || '#2A1A12', '#000000', 0.5), mix(o.hairCol || '#2A1A12', '#B08060', 0.35)), o.crown);
    else if (o.cloth) hair = headCloth(o.cloth, o.band);
    else hair = hairCap(o.hairCol, mix(o.hairCol, '#000000', 0.5), mix(o.hairCol, '#B08060', 0.35), { band: o.hband, curls: o.young });
    return {
      skin: o.skin, skinSh: sh, shX: w ? 50 : 60, shY: w ? -358 : -380, headY: w ? -438 : -468, l1: w ? 90 : 96, l2: w ? 76 : 80, armR: w ? [12, 10, 8] : [14, 12, 10], handK: w ? 0.8 : 0.88, footX: w ? 17 : 22, pivot: w ? -246 : -260,
      sleeve: 'long', bell: 3, g,
      head: { fw: w ? 30 : 33, shape: w ? 'woman' : o.young ? 'youth' : 'man', skin: o.skin, sh, erx: w ? 7.2 : 6.8, ery: w ? 4.8 : 4.4, sp: w ? 12.5 : undefined, ey: w ? -3 : -4, lash: w ? 1 : 0, bth: w ? 3.6 : 4.4, bcol: o.old ? '#A8A296' : '#24150D', noseK: w ? 0.82 : 1, my: o.beard ? 32 : (w ? 29 : 30), mw: w ? 6.5 : 7.5, lip: w ? '#A86A5C' : null, wrinkles: o.old ? 1 : 0, lid: o.old ? 0.2 : 0,
        beard: o.beard ? { col: o.beard, len: o.old ? 1.2 : o.short ? 0.2 : 0.9 } : null, ears: !!(o.feathers || o.hairCol), hair },
    };
  };
  PP2.PERSON_VARIANTS = PV.length;
  PP2.person = (ctx, st = {}) => {
    const v = st.v || 0, pose = st.pose || 'stand', t = st.t || 0, C = personC(v, st.cast), w = C.shX < 55;
    const ph = t * 6 + v * 1.7, P = { t, arms: {}, head: { look: st.look || [0, 0], mouth: 'neutral', turn: ((v * 37) % 7 - 3) * 0.04, tilt: (hash(v * 3.1) - 0.5) * 0.08 } };
    const jit = (n) => hash(v * 13.7 + n) - 0.5;   // stable per-variant variation
    P.lean = jit(9) * 0.03;
    const hy = w ? 0.93 : 1;
    switch (pose) {
      case 'walk': { // ENGINE_ROADMAP step 2: anyone can walk (st.phase = distance-driven cycle; legs, bob, arm swing)
        const s1 = Math.sin(st.phase ?? t * 5.5), fx = C.footX || 22;
        P.feet = {}; P.knee = {};
        for (const s of [-1, 1]) { const lift = Math.max(0, -s * s1) * 24; P.feet[s] = [s * fx, -lift]; P.knee[s] = s * lift * 0.42; }
        P.by = -Math.abs(s1) * 3 + 2; P.lean += s1 * 0.012;
        P.arms = { '-1': { A: 7 - s1 * 12, B: -14 - Math.max(0, -s1) * 22, hand: 'open', hdir: 96 }, '1': { A: 7 + s1 * 12, B: -14 - Math.max(0, s1) * 22, hand: 'open', hdir: 84 } };
        if (st.item) P.arms['1'] = { T: [96, -420 * hy], pole: [220, -330], hand: 'fist', hdir: -90, item: st.item };
        break;
      }
      case 'raise': { // both hands raised, pleading (Matt 7:22)
        const b = Math.sin(ph) * 6;
        P.arms = { '-1': { T: [-118 + jit(1) * 30, -566 * hy + b + jit(2) * 40], pole: [-240, -420], hand: 'open', hdir: -100 }, '1': { T: [118 + jit(3) * 30, -566 * hy - b + jit(4) * 40], pole: [240, -420], hand: 'open', hdir: -80 } };
        Object.assign(P.head, { pitch: -0.35, mouth: 'open', furrow: -0.6, lift: 2, look: [0, -1] }); break;
      }
      case 'hold': { // holding up a scroll / broken chains / a staff
        const item = st.item || 'scroll';
        P.arms = { '1': { T: [96, item === 'staff' ? -500 * hy : -580 * hy], pole: [220, -420], hand: 'fist', hdir: -90, item }, '-1': { T: [-26, -330 * hy], pole: [-160, -250], hand: 'open', hdir: -40 } };
        if (st.look) Object.assign(P.head, { pitch: 0.05, mouth: 'neutral', furrow: st.furrow ?? 0.7, look: st.look, turn: st.look[0] * 0.3 });   // a hard stare (Ex 32:19)
        else Object.assign(P.head, { pitch: -0.3, mouth: 'open', furrow: -0.4, lift: 2, look: [0.3, -1] });
        break;
      }
      case 'kneel': {
        P.kneel = 1; P.by = 150;
        P.arms = { '-1': { T: [-7, -372 * hy], pole: [-150, -260], hand: 'open', hdir: -84 }, '1': { T: [7, -372 * hy], pole: [150, -260], hand: 'open', hdir: -96 } };
        Object.assign(P.head, { pitch: -0.3, mouth: 'part', furrow: -0.4, look: st.look || [0, -0.8] }); break;
      }
      case 'offer': { // kneeling, an offering held out in both hands toward the object (2 Kgs 18:4 "made offerings to it")
        P.kneel = 1; P.by = 150; const b = Math.sin(ph * 0.5) * 4;
        P.arms = { '1': { T: [110, -430 * hy + b], pole: [200, -300], hand: 'fist', hdir: -10, item: st.item || 'bowl' }, '-1': { T: [70, -420 * hy + b], pole: [-120, -300], hand: 'open', hdir: 10 } };
        Object.assign(P.head, { pitch: 0.1, mouth: st.look ? 'part' : 'neutral', furrow: st.look ? -0.7 : -0.2, look: st.look || [0.7, -0.3], turn: st.look ? st.look[0] * 0.25 : P.head.turn }); break;
      }
      case 'beseech': { // kneeling, face lifted toward something high (st.dir: -1 = up to screen left), one hand reaching to it, one on the chest
        const d = st.dir ?? -1;
        P.kneel = 1; P.by = 150; P.lean = d * 0.08;
        P.arms = { [d]: { T: [d * 150, -560 * hy], pole: [d * 230, -420], hand: 'open', hdir: -90 + d * 35 }, [-d]: { T: [d * 18, -360 * hy], pole: [-d * 150, -260], hand: 'open', hdir: -90 - d * 30, front: 1 } };
        Object.assign(P.head, { pitch: -0.75, tilt: d * 0.12, turn: d * 0.35, mouth: 'part', furrow: -0.5, look: [d * 0.7, -1], lift: 3 }); break;
      }
      case 'tablets': { // both hands lift the two stone tablets overhead (Ex 32:19: about to throw them down)
        P.lean = -0.04;
        P.arms = { '-1': { T: [-58, -640 * hy], pole: [-190, -470], hand: 'open', hdir: -70 }, '1': { T: [58, -640 * hy], pole: [190, -470], hand: 'open', hdir: -110, item: 'tablets' } };
        Object.assign(P.head, { pitch: -0.05, mouth: 'part', furrow: 0.9, look: st.look || [0.8, 0], turn: (st.look ? st.look[0] : 0.8) * 0.3 }); break;
      }
      case 'bow': { // kneeling, bent low, hands forward and down (Ex 32:8 "worshiped it"; never used for 2 Kgs 18:4)
        P.kneel = 1; P.by = 175; P.lean = (v % 2 ? 1 : -1) * 0.1; P.shUp = -10;
        P.arms = { '-1': { T: [-46, -250 * hy], pole: [-170, -330], hand: 'open', hdir: 100 }, '1': { T: [46, -250 * hy], pole: [170, -330], hand: 'open', hdir: 80 } };
        Object.assign(P.head, { pitch: 0.5, mouth: 'neutral', furrow: -0.3, look: [0, 1], lid: 0.5 }); break;
      }
      case 'shield': { // a flinch: one forearm thrown up across the face, leaning away (st.dir: -1 leans screen left)
        const d = st.dir ?? -1;
        P.lean = d * 0.12;
        P.arms = { [-d]: { T: [-d * 20, -520 * hy], pole: [-d * 190, -330], hand: 'open', hdir: -90 - d * 40, front: 1 }, [d]: { T: [d * 150, -300 * hy], pole: [d * 230, -340], hand: 'open', hdir: 90 - d * 60 } };
        Object.assign(P.head, { turn: d * 0.45, pitch: 0.12, mouth: 'o', furrow: -0.7, look: [-d * 1, -0.2], lift: 3 }); break;
      }
      case 'reach': { // kneeling, one hand stretched out and down toward something on the ground (st.dir: 1 = screen right)
        const d = st.dir ?? 1;
        P.kneel = 1; P.by = 150; P.lean = d * 0.14;
        P.arms = { [d]: { T: [d * 200, -250 * hy], pole: [d * 210, -400], hand: 'open', hdir: 90 - d * 55 }, [-d]: { T: [-d * 10, -350 * hy], pole: [-d * 150, -260], hand: 'open', hdir: -90 + d * 10 } };
        Object.assign(P.head, { turn: d * 0.2, pitch: 0.3, mouth: 'part', furrow: -0.8, look: [d * 0.7, 0.9] }); break;
      }
      case 'swing': { // both hands on a hammer: k 0 = raised behind the head, 1 = struck down in front (drive it with DIRECT.act)
        const k = clamp(st.k ?? 0), hx = lerp(30, 170, k), hyy = lerp(-700, -330, k) * hy, dir = lerp(-115, 35, k);
        P.arms = { '1': { T: [hx, hyy], pole: [200, -420], hand: 'fist', hdir: dir, item: st.item || 'hammer' }, '-1': { T: [hx - 30, hyy + 40], pole: [-150, -400], hand: 'fist', hdir: dir } };
        P.lean += lerp(-0.05, 0.1, k);
        Object.assign(P.head, { pitch: lerp(-0.15, 0.25, k), mouth: k > 0.6 ? 'part' : 'neutral', furrow: 0.5, look: [0.6, lerp(-0.4, 0.6, k)] }); break;
      }
      case 'cheer': { // the Philistine crowd (16:23-25), arms up, shouting
        const b = Math.sin(ph) * 10;
        P.arms = { '-1': { T: [-104 + jit(1) * 40, -590 * hy + b + jit(2) * 60], pole: [-240, -420], hand: 'fist', hdir: -100 }, '1': { T: [110 + jit(3) * 40, -584 * hy - b + jit(4) * 60], pole: [240, -420], hand: 'fist', hdir: -80 } };
        Object.assign(P.head, { pitch: -0.15, mouth: 'open', closed: v % 3 === 0 ? 'happy' : false, furrow: 0.2, lift: 2 }); break;
      }
      case 'fall': {
        const k = clamp(st.k ?? 0.5), d = st.dir ?? ((v % 2) ? 1 : -1);
        P.arms = { '-1': { T: [-150, -590 * hy], pole: [-260, -420], hand: 'open', hdir: -110 }, '1': { T: [150, -580 * hy], pole: [260, -420], hand: 'open', hdir: -70 } };
        Object.assign(P.head, { pitch: -0.3, mouth: 'o', furrow: -0.6, lift: 4, look: [0, -1] }); P.rot = d * k * 0.45; P.rotO = [d * 20, 0]; P.feet = { '-1': [-C.footX, d < 0 ? -22 * k : 0], '1': [C.footX, d > 0 ? -22 * k : 0] }; break;
      }
      default: P.arms = { '-1': { A: 7 + jit(5) * 6, B: -14 + jit(6) * 12, hand: 'open', hdir: 96 }, '1': { A: 7 + jit(7) * 6, B: -14 + jit(8) * 12, hand: 'open', hdir: 84 } };
    }
    drawFig(ctx, C, P);
  };

  // ================= THE LION (14:5-6) =================
  // profile facing screen left. Origin: the ground point under the body. 'crouch' stands on the ground; 'leap' and
  // 'thrown' are drawn mid-air (body centre about 0.8 m up): move the billboard for the arc.
  const LI = { base: '#C99A5A', sh: '#9A6E3C', rim: '#F2D29A', belly: '#E4C48E', mane: '#7A4E2A', maneSh: '#4E301A', maneHi: '#A87444', nose: '#5A2E20' };
  function lionLeg(ctx, pts, ws, col, sh, claws, s) {
    part(ctx, chain(pts, ws), col, { shade: sh, sd: 6, rim: LI.rim, rimA: col === LI.base ? 0.6 : 0 });
    const P0 = pts[pts.length - 1], P1 = pts[pts.length - 2], ang = Math.atan2(P0[1] - P1[1], P0[0] - P1[0]);
    ctx.save(); ctx.translate(P0[0], P0[1]); ctx.rotate(ang);
    part(ctx, ell(4, 0, 17, 12), col, { shade: sh, sd: 3 });
    ctx.strokeStyle = 'rgba(36,22,15,0.6)'; ctx.lineWidth = 1.4; for (const v of [-5, 1, 7]) { ctx.beginPath(); ctx.moveTo(15, v - 1); ctx.lineTo(20, v); ctx.stroke(); }
    if (claws) for (const v of [-7, -1, 5, 10]) { const c = P2(); c.moveTo(18, v - 2.5); c.quadraticCurveTo(30, v - 1, 31, v + 5); c.quadraticCurveTo(25, v + 1, 18, v + 2); c.closePath(); part(ctx, c, '#F4ECDC', { lw: 1.3 }); }
    ctx.restore();
  }
  function lionHead(ctx, o) { // head-local: facing left; mouth: 0 closed .. 1 roaring; closed eyes when limp
    const open = o.open || 0, jaw = open * 0.5;
    // mane (a young lion's: short and scruffy)
    const mp = []; for (let i = 0; i < 18; i++) { const a = -Math.PI * 0.62 + (i / 17) * Math.PI * 1.55, r = (i % 2 ? 62 : 74) * (o.mane ?? 1); mp.push([18 + Math.cos(a) * r * 0.95, 4 + Math.sin(a) * r]); }
    part(ctx, blob(mp, 0.55), LI.mane, { shade: LI.maneSh, sd: 8, rim: LI.maneHi, rimA: 0.8 });
    // ear
    part(ctx, ell(26, -44, 13, 11, o.earBack ? 0.8 : 0.2), LI.base, { shade: LI.sh, sd: 3 }); part(ctx, ell(26, -43, 6, 5, 0.2), '#7A5034', { line: false });
    // lower jaw (opens)
    ctx.save(); ctx.translate(-14, 16); ctx.rotate(-jaw * 0.9);
    const lj = blob([[-60, 2], [-56, 14], [-30, 20], [0, 16], [14, 4], [0, -2], [-30, 0]], 0.5);
    if (open > 0.05) { part(ctx, poly([[-58, 2], [-48, 9], [-40, 2]]), '#F4ECDC', { lw: 1.3 }); }
    part(ctx, lj, LI.belly, { shade: LI.sh, sd: 3 });
    if (open > 0.05) { part(ctx, poly([[-52, 2], [-46, -8], [-42, 2]]), '#F4ECDC', { lw: 1.3 }); }
    ctx.restore();
    // mouth interior
    if (open > 0.05) {
      const mi = P2(); mi.moveTo(-70, 8); mi.lineTo(-10, 12); mi.lineTo(-14 - 60 * Math.cos(jaw * 0.9), 16 + 60 * Math.sin(jaw * 0.9)); mi.closePath();
      ctx.fillStyle = '#3E1C16'; ctx.fill(mi); ctx.strokeStyle = LINE; ctx.lineWidth = 2; ctx.stroke(mi);
      ctx.fillStyle = '#C98476'; ctx.beginPath(); ctx.ellipse(-36, 18 + open * 10, 14, 5, -jaw * 0.7, 0, TAU); ctx.fill();
    }
    // skull + muzzle
    const sk = blob([[-30, -34], [0, -42], [30, -32], [40, -6], [32, 18], [6, 22], [-20, 14], [-56, 12], [-72, 2], [-74, -12], [-64, -22], [-44, -28]], 0.5);
    part(ctx, sk, LI.base, { shade: LI.sh, sd: 6, rim: LI.rim, rimA: 0.75 });
    part(ctx, blob([[-74, -8], [-66, -18], [-48, -16], [-40, -2], [-50, 12], [-70, 8]], 0.5), LI.belly, { line: false });
    // upper fangs
    if (open > 0.05) for (const x of [-64, -50]) part(ctx, poly([[x - 4, 8], [x + 4, 8], [x, 8 + 9]]), '#F4ECDC', { lw: 1.3 });
    // nose
    part(ctx, blob([[-78, -14], [-70, -18], [-64, -12], [-70, -6], [-78, -8]], 0.5), LI.nose, { lw: 1.6 });
    ctx.strokeStyle = LINE; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-70, -6); ctx.quadraticCurveTo(-68, 2, -74, 6); ctx.stroke();
    // whisker dots
    ctx.fillStyle = 'rgba(60,30,20,0.6)'; for (const [x, y] of [[-62, -2], [-56, 0], [-60, 4], [-54, 5]]) { ctx.beginPath(); ctx.arc(x, y, 1.2, 0, TAU); ctx.fill(); }
    // eye + brow
    if (o.closedEyes) { ctx.strokeStyle = LINE; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-36, -18); ctx.quadraticCurveTo(-28, -13, -20, -18); ctx.stroke(); }
    else {
      const e = ell(-28, -18, 7.5, 4.6, -0.15); ctx.fillStyle = '#F2E2B0'; ctx.fill(e);
      ctx.save(); ctx.clip(e); ctx.fillStyle = '#C88A2A'; ctx.beginPath(); ctx.arc(-31, -17.5, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#120A06'; ctx.beginPath(); ctx.arc(-31.5, -17.5, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-33, -19, 1.1, 0, TAU); ctx.fill(); ctx.restore();
      ctx.strokeStyle = LINE; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(-28, -18, 7.5, 4.6, -0.15, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      const br = P2(); br.moveTo(-40, -26 + (o.snarl || 0) * 3); br.quadraticCurveTo(-28, -33, -16, -26); br.quadraticCurveTo(-28, -29, -40, -23 + (o.snarl || 0) * 3); br.closePath(); ctx.fillStyle = LI.maneSh; ctx.fill(br);
    }
    if (o.snarl) { ctx.strokeStyle = 'rgba(36,22,15,0.55)'; ctx.lineWidth = 1.4; for (const x of [-60, -54]) { ctx.beginPath(); ctx.moveTo(x, -22); ctx.quadraticCurveTo(x + 3, -16, x + 1, -11); ctx.stroke(); } }
  }
  PP2.lion = (ctx, st = {}) => {
    const pose = st.pose || 'crouch', t = st.t || 0;
    // pose table (lion frame: body centre at 0,0, facing left): body rotation, legs (joint chains), head, tail
    let rot = 0, cy = -150, head = { x: -168, y: -62, r: 0, open: 0.2, snarl: 0 }, tail, legs;
    const L = (sx, sy, a1, l1, a2, l2, a3, l3) => { const p0 = [sx, sy], p1 = [p0[0] + Math.sin(a1) * l1, p0[1] + Math.cos(a1) * l1], p2 = [p1[0] + Math.sin(a2) * l2, p1[1] + Math.cos(a2) * l2], p3 = [p2[0] + Math.sin(a3) * l3, p2[1] + Math.cos(a3) * l3]; return [p0, p1, p2, p3]; };
    if (pose === 'leap') {
      rot = 0.32; cy = -250;
      legs = { ff: L(-118, 6, -1.55, 70, -1.85, 66, -2.0, 22), fn: L(-104, 14, -0.95, 72, -1.2, 66, -1.45, 22), hf: L(118, 6, 1.0, 76, 1.5, 62, 1.9, 34), hn: L(132, 12, 0.85, 78, 1.35, 64, 1.75, 34) };
      head = { x: -176, y: -46, r: -0.12, open: 1, snarl: 1 };
      tail = [[170, -12], [220, -24], [262, -10], [300, -34]];
    } else if (pose === 'thrown') {
      rot = Math.PI * 0.92 + Math.sin(t * 3) * 0.06; cy = -230;
      legs = { ff: L(-118, 6, 0.4, 70, 0.8, 64, 0.6, 22), fn: L(-104, 14, -0.2, 72, 0.3, 64, 0.2, 22), hf: L(118, 6, 0.3, 76, -0.2, 62, 0.4, 34), hn: L(132, 12, -0.3, 78, 0.2, 64, -0.1, 34) };
      head = { x: -170, y: -50, r: 0.5, open: 0, closedEyes: 1 };
      tail = [[170, -12], [214, 6], [250, 30], [270, 70]];
    } else { // crouch: low, weight back, ready to spring
      cy = -128; rot = -0.07;
      legs = { ff: L(-112, 10, 0.49, 68, -0.69, 62, -1.37, 20), fn: L(-98, 18, 0.42, 68, -0.75, 60, -1.4, 20), hf: L(116, 4, -0.46, 78, 1.17, 72, -0.46, 38), hn: L(130, 10, -0.5, 78, 1.2, 72, -0.42, 38) };
      head = { x: -168, y: -8, r: 0.14, open: 0.35, snarl: 1, earBack: 1 };
      tail = [[172, -10], [226, 16], [262, 52], [300, 44]];
    }
    ctx.save(); ctx.translate(0, cy); ctx.rotate(rot);
    const legPts = (q) => [q[0], lerp2(q[0], q[1], 0.5), q[1], q[2], q[3]];
    // far legs (darker), tail, body, near legs, head
    lionLeg(ctx, legPts(legs.ff), [24, 20, 13, 10, 9], LI.sh, mix(LI.sh, '#5A3A20', 0.4), pose === 'leap', -1);
    lionLeg(ctx, legPts(legs.hf), [30, 26, 14, 10, 9], LI.sh, mix(LI.sh, '#5A3A20', 0.4), pose === 'leap', 1);
    // tail with a dark tuft
    part(ctx, chain(tail, [8, 7, 6, 5]), LI.base, { shade: LI.sh, sd: 3 });
    const te = tail[tail.length - 1], tb = tail[tail.length - 2], ta = Math.atan2(te[1] - tb[1], te[0] - tb[0]);
    part(ctx, ell(te[0] + Math.cos(ta) * 10, te[1] + Math.sin(ta) * 10, 16, 10, ta), LI.mane, { shade: LI.maneSh, sd: 3 });
    // body
    const body = blob([[-150, -64], [-96, -78], [-20, -68], [60, -70], [126, -64], [170, -36], [176, 8], [156, 46], [108, 60], [40, 54], [-30, 62], [-100, 70], [-152, 52], [-176, 8]], 0.5);
    part(ctx, body, LI.base, { shade: LI.sh, sd: 12, rim: LI.rim, rimA: 0.7, rd: 4 });
    ctx.save(); ctx.clip(body); ctx.fillStyle = LI.belly; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.ellipse(-30, 68, 134, 22, 0, 0, TAU); ctx.fill(); ctx.restore();
    lionLeg(ctx, legPts(legs.hn), [32, 28, 15, 11, 10], LI.base, LI.sh, pose === 'leap', 1);
    lionLeg(ctx, legPts(legs.fn), [26, 21, 14, 11, 10], LI.base, LI.sh, pose === 'leap', -1);
    ctx.save(); ctx.translate(head.x, head.y); ctx.rotate(head.r); lionHead(ctx, head); ctx.restore();
    ctx.restore();
  };

  // ================= a Philistine soldier toppling (optional) =================
  PP2.soldierFall = (ctx, st = {}) => {
    const k = clamp(st.k ?? 0.5), d = st.dir ?? 1;
    ctx.save(); ctx.rotate(d * k * 1.2); PP.soldier(ctx, Object.assign({ shout: 1, raise: 0.4 }, st.o || {})); ctx.restore();
  };

  // ================= billboard sizes =================
  // draw = (ctx, st) => { ctx.translate(cw / 2, ch - footPx); ctx.scale(scale, scale); PP2[fn](ctx, st); }
  const sz = (cw, ch, footPx, scale, fn) => ({ cw, ch, footPx, scale, worldH: +(ch / scale * U_M).toFixed(4), fn });
  PP2.SIZES = {
    samson: sz(1600, 1720, 70, 2.5, 'samson'),             // every standing pose (arms up, pointing, praying)
    samsonSleep: sz(1700, 900, 140, 2.5, 'samson'),        // pose 'sleep' (horizontal; origin = middle of the underside)
    samsonCU: sz(1000, 1300, -1260, 4, 'samson'),          // head-and-shoulders close-ups (S27, S28): feet off-canvas
    delilah: sz(1100, 1500, 60, 2.5, 'delilah'),
    bride: sz(900, 1200, 50, 2, 'bride'),
    manoah: sz(900, 1260, 50, 2, 'manoah'),
    mother: sz(900, 1200, 50, 2, 'mother'),
    angel: sz(1300, 1560, 60, 2, 'angel'),                // includes the aura
    lion: sz(1700, 1100, 60, 2, 'lion'),
    barber: sz(1040, 1000, 40, 2, 'barber'),
    lord: sz(1100, 980, 60, 1.4, 'lord'),
    boy: sz(800, 1000, 40, 2, 'boy'),
    person: sz(500, 470, 34, 0.62, 'person'),
    soldierFall: sz(960, 520, 110, 0.62, 'soldierFall'),
  };
  // build a billboard for a cast member: bb.userData.update(key, st) draws PP2[fn](ctx, Object.assign({}, base, st))
  PP2.bill = (name, base = {}, over = {}) => {
    const S = Object.assign({}, PP2.SIZES[name], over), LW = globalThis.LW;
    S.worldH = S.ch / S.scale * U_M;
    return LW.billboard({ cw: S.cw, ch: S.ch, worldH: S.worldH, footPx: S.footPx, draw: (ctx, st) => { ctx.translate(S.cw / 2, S.ch - S.footPx); ctx.scale(S.scale, S.scale); PP2[S.fn](ctx, Object.assign({}, base, st)); } });
  };
  // useful anchors (design units, relative to each drawer's origin)
  PP2.ANCHOR = {
    lap: LAP,                                            // Delilah 'sit': where Samson's head rests
    sleepHead: null,                                     // Samson 'sleep': head centre (filled below)
    sleepOnLap: null,                                    // Samson 'sleep' origin relative to Delilah 'sit' origin
    prayHands: null,                                     // Samson 'pray': wrist points (pillar contact)
  };
  try {
    const s1 = PP2.samsonInfo({ pose: 'sleep' }); PP2.ANCHOR.sleepHead = s1.head;
    PP2.ANCHOR.sleepOnLap = [LAP[0] - s1.head[0], LAP[1] - (s1.head[1] + 46)];
    PP2.ANCHOR.prayHands = PP2.samsonInfo({ pose: 'pray' }).hands;
  } catch (e) { /* anchors are optional */ }
})();
