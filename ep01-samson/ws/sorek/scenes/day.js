// DAY (Matthew 7:22-23): a symbol, not a retelling. Jesus is NOT shown: the light at the door stands for Him.
// Night. A long flight of steps rises to a great closed double door in a gatehouse; white-gold light blazes through
// its seams. At the foot of the steps a crowd, backs to us, raise their hands and hold up the signs of their works:
// a scroll (prophecy), broken chains (demons cast out), a staff (mighty works), each raised on its spoken word.
//   crowd  slow crane up over the crowd toward the door; one internal cut on beats.works to a low angle of the raised
//          hands and the signs against the light (a long verse card sits over the middle of the frame)
//   door   locked: on "never" the door's light narrows to a line and the crowd falls into shadow
// Every frame is a pure function of t (seeded rng only).
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const q = (v, n = 60) => Math.round(v * n) / n;
  const DU = 1400 / 1.86 / 2.5; // PP design units per metre

  // ---------------- the place ----------------
  const ST = { n: 34, rise: 0.25, run: 0.62 };
  const TOPY = ST.n * ST.rise, ZTOP = -ST.n * ST.run;        // 7.5 m up, 18 m back
  const WALLZ = ZTOP - 3.2;                                   // the gatehouse face
  const DOOR = { w: 3.2, h: 6.0, y0: TOPY };
  const DC = [0, TOPY + DOOR.h / 2, WALLZ];                   // the door's centre

  let scene, cam, hemi, spot, doorPt, halo, halo2, line, lightBack, lightSeam, leafL, leafR, stars, motes, pool, stepGlow, heroes;
  const crowd = [], shadows = [];

  const VC = () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 });
  function facets(geo, colFn, seed) {
    const rng = FW.rng(seed);
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.attributes.position, n = p.count, cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      const c = colFn(cx, cy, cz, rng());
      for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = c.r; cols[(i + k) * 3 + 1] = c.g; cols[(i + k) * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
    return g;
  }
  function merge(geos) {
    let n = 0; geos.forEach((g) => (n += g.attributes.position.count));
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    geos.forEach((g) => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); col.set(g.attributes.color.array, o * 3); o += g.attributes.position.count; });
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return m;
  }
  function block(a, b, jit, seed, seg = 1) {
    const w = b[0] - a[0], h = b[1] - a[1], d = b[2] - a[2];
    const g = new THREE.BoxGeometry(w, h, d, seg, 1, 1); g.translate(a[0] + w / 2, a[1] + h / 2, a[2] + d / 2);
    if (jit > 0) LW.jitter(g, jit, FW.rng(seed));
    return g;
  }
  const stone = (base) => (x, y, z, r) => { const c = C(base); const n = FW.noise2(x * 0.7 + z * 0.3, y * 0.7, 3); c.offsetHSL((r - 0.5) * 0.012, (r - 0.5) * 0.04, (r - 0.5) * 0.07 + (n - 0.5) * 0.06); return c; };
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  const glowTex = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.55)'); g.addColorStop(0.55, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  function glow(color, sx, sy, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C(color), transparent: true, opacity, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    s.scale.set(sx, sy, 1); s.renderOrder = 8; return s;
  }

  function buildPlace() {
    // the plaza at the foot of the steps: worn paving
    const hFn = (x, z) => (z < 0.2 ? 0 : (FW.noise2(x * 0.8, z * 0.8, 3) - 0.5) * 0.05);
    const colFn = (x, z, y, ny, r) => { const n = FW.fbm(x * 0.3, z * 0.3, 7, 3); const c = C(n > 0.55 ? '#6E6A66' : n > 0.42 ? '#64605C' : '#5A5652'); c.offsetHSL(0, (r - 0.5) * 0.03, (r - 0.5) * 0.06); return c; };
    scene.add(LW.terrain({ size: 90, seg: 60, cx: 0, cz: 20, hFn, colFn, seed: 9 }));
    // the steps: full-width, stone, faceted (each a full-height block so no gaps)
    const geos = [];
    for (let i = 0; i < ST.n; i++) {
      const z1 = -i * ST.run, z0 = -(i + 1) * ST.run, y1 = (i + 1) * ST.rise;
      for (let k = -4; k < 4; k++) geos.push(facets(block([k * 6 - 0.02, 0, z0], [k * 6 + 6.02, y1, z1 + 0.04], 0.03, i * 13 + k + 50, 3), stone(i % 2 ? '#8A857C' : '#857F76'), i * 7 + k));
    }
    // the terrace at the top
    geos.push(facets(block([-26, 0, WALLZ - 12], [26, TOPY, ZTOP + 0.02], 0.02, 3, 12), stone('#837D74'), 4));
    scene.add(Object.assign(new THREE.Mesh(merge(geos), VC()), { receiveShadow: true, castShadow: true }));

    // the gatehouse: ashlar courses around the door, a lintel, a cornice; lower walls running off into the dark
    const blocks = [];
    const course = 0.72;
    const jx = DOOR.w / 2 + 0.95;
    const addWall = (x0, x1, y0, y1, z, seed, hole) => {
      const rng = FW.rng(seed);
      for (let r = 0, y = y0; y < y1 - 0.01; r++, y += course) {
        let x = x0 - (r % 2 ? 0.7 : 0);
        while (x < x1) {
          const w = 1.1 + rng() * 0.8; let segs = [[Math.max(x0, x), Math.min(x1, x + w)]];
          if (hole && y < hole[2]) segs = segs.flatMap(([a, b]) => (b <= hole[0] || a >= hole[1] ? [[a, b]] : [[a, Math.min(b, hole[0])], [Math.max(a, hole[1]), b]].filter(([p, q]) => q - p > 0.12)));
          const zz = z + rng() * 0.05, rr = rng();
          segs.forEach(([xa, xb]) => blocks.push({ a: [xa + 0.015, y + 0.015, z - 1.2], b: [xb - 0.015, Math.min(y1, y + course) - 0.015, zz], r: rr }));
          x += w;
        }
      }
    };
    addWall(-11, 11, TOPY, TOPY + 10.2, WALLZ, 21, [-jx, jx, TOPY + DOOR.h + 1.4]);
    addWall(-34, -11, TOPY, TOPY + 5.8, WALLZ - 1.4, 22); addWall(11, 34, TOPY, TOPY + 5.8, WALLZ - 1.4, 23);
    const wallG = blocks.map((b, i) => facets(block(b.a, b.b, 0.05, 100 + i), stone(b.r < 0.3 ? '#77716A' : b.r < 0.7 ? '#6E6862' : '#7E776E'), 300 + i));
    // jambs, lintel, cornice
    wallG.push(facets(block([-jx, TOPY, WALLZ - 1.3], [-DOOR.w / 2, TOPY + DOOR.h, WALLZ + 0.25], 0.03, 5, 2), stone('#8A8379'), 6));
    wallG.push(facets(block([DOOR.w / 2, TOPY, WALLZ - 1.3], [jx, TOPY + DOOR.h, WALLZ + 0.25], 0.03, 7, 2), stone('#8A8379'), 8));
    wallG.push(facets(block([-jx - 0.5, TOPY + DOOR.h, WALLZ - 1.3], [jx + 0.5, TOPY + DOOR.h + 1.4, WALLZ + 0.35], 0.04, 9, 4), stone('#8F877C'), 10));
    wallG.push(facets(block([-11.3, TOPY + 10.2, WALLZ - 1.5], [11.3, TOPY + 10.6, WALLZ + 0.25], 0.03, 11, 6), stone('#8A8379'), 12));
    // a solid core behind the ashlar so no sky glow shows through the joints
    wallG.push(facets(block([-11, TOPY + DOOR.h + 0.5, WALLZ - 1.6], [11, TOPY + 10.2, WALLZ - 1.1], 0, 0, 1), () => C('#3A3632'), 15));
    wallG.push(facets(block([-11, TOPY, WALLZ - 1.6], [-jx + 0.2, TOPY + 10.2, WALLZ - 1.1], 0, 0, 1), () => C('#3A3632'), 16));
    wallG.push(facets(block([jx - 0.2, TOPY, WALLZ - 1.6], [11, TOPY + 10.2, WALLZ - 1.1], 0, 0, 1), () => C('#3A3632'), 17));
    wallG.push(facets(block([-jx, TOPY, WALLZ - 2.2], [jx, TOPY + DOOR.h + 0.6, WALLZ - 1.7], 0, 0, 1), () => C('#1A1714'), 18)); // behind the door: no sky through the gaps
    // a step up to the threshold
    wallG.push(facets(block([-jx - 0.3, TOPY, WALLZ + 0.1], [jx + 0.3, TOPY + 0.2, WALLZ + 1.0], 0.02, 13, 3), stone('#8E887E'), 14));
    const wall = new THREE.Mesh(merge(wallG), VC()); wall.receiveShadow = true; wall.castShadow = false; scene.add(wall);

    // the light behind the door (seen only through the seams), and the narrow seam strip that is left at the end
    lightBack = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.w + 0.2, DOOR.h + 0.2), new THREE.MeshBasicMaterial({ color: C('#FFF1D2').multiplyScalar(3.2), toneMapped: false, fog: false }));
    lightBack.position.set(0, TOPY + DOOR.h / 2, WALLZ - 0.75); scene.add(lightBack);
    lightSeam = new THREE.Mesh(new THREE.PlaneGeometry(0.2, DOOR.h), new THREE.MeshBasicMaterial({ color: C('#FFF6E0').multiplyScalar(4), toneMapped: false, fog: false }));
    lightSeam.position.set(0, TOPY + DOOR.h / 2, WALLZ - 0.62); scene.add(lightSeam);
    // the two leaves: planks, iron bands, bronze studs
    const leaf = (side) => {
      const g = new THREE.Group(); const lw = DOOR.w / 2 - 0.1;
      const pl = [];
      for (let i = 0; i < 6; i++) pl.push(facets(block([-lw / 2 + i * (lw / 6) + 0.0025, 0.07, -0.1], [-lw / 2 + (i + 1) * (lw / 6) - 0.0025, DOOR.h - 0.12, 0.1 + (i % 2) * 0.012], 0.0, 0, 1), (x, y, z, r) => C(r < 0.5 ? '#4A3426' : '#432F22'), 60 + i + side * 7));
      for (const y of [1.1, 2.95, 4.8]) pl.push(facets(block([-lw / 2, y, 0.1], [lw / 2, y + 0.18, 0.14], 0, 0, 1), () => C('#2E2A28'), 70));
      const m = new THREE.Mesh(merge(pl), VC()); g.add(m);
      const sg = new THREE.DodecahedronGeometry(0.045, 0); const n = 3 * 5;
      const studs = new THREE.InstancedMesh(sg, FW.mat('#A0784A', { roughness: 0.5, metalness: 0.4 }), n); const o = new THREE.Object3D(); let k = 0;
      for (const y of [1.19, 3.04, 4.89]) for (let i = 0; i < 5; i++) { o.position.set(-lw / 2 + 0.15 + i * ((lw - 0.3) / 4), y, 0.16); o.updateMatrix(); studs.setMatrixAt(k++, o.matrix); }
      g.add(studs);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 5, 10), FW.mat('#8A6A40', { roughness: 0.5, metalness: 0.4 })); ring.position.set(-side * (lw / 2 - 0.3), 2.7, 0.2); g.add(ring);
      g.position.set(side * (lw / 2 + 0.05), TOPY, WALLZ - 0.4);
      scene.add(g); return g;
    };
    leafL = leaf(-1); leafR = leaf(1);

    // glows: a great halo over the door, the vertical line of the seam, the spill at the threshold and down the steps
    halo = glow('#FFE2A8', 22, 22, 0.5); halo.position.set(0, TOPY + DOOR.h * 0.5, WALLZ + 0.6); scene.add(halo);
    halo2 = glow('#FFF0D0', 7, 9, 0.5); halo2.position.set(0, TOPY + DOOR.h * 0.5, WALLZ - 0.55); scene.add(halo2);
    line = glow('#FFF4DC', 1.4, DOOR.h * 1.5, 0.8); line.position.set(0, TOPY + DOOR.h / 2, WALLZ + 0.3); scene.add(line);
    pool = LW.pool(4.5, '#FFE0A8'); pool.scale.set(1.2, 0.8, 1); pool.position.set(0, TOPY + 0.03, WALLZ + 2.4); scene.add(pool);
    stepGlow = LW.pool(9, '#FFD99A'); stepGlow.scale.set(1.0, 2.2, 1); stepGlow.position.set(0, 0, ZTOP / 2); stepGlow.rotation.x = -Math.PI / 2 + Math.atan2(TOPY, -ZTOP); stepGlow.position.y = TOPY / 2 + 0.12; scene.add(stepGlow);

    // the night sky + stars
    scene.add(LW.sky({ top: '#05081A', mid: '#0B1230', hor: '#161C3C', low: '#0A0C18', sunDir: [0, 0.32, -1], sunCol: '#FFE2A8', sunAmt: 0.22 }));
    stars = LW.particles(260, '#DDE6FF', 0.9); scene.add(stars);
    const sv = [];
    for (let i = 0; i < 260; i++) { const a = -Math.PI / 2 + (hsh(i, 1) - 0.5) * 2.4, e = 0.15 + hsh(i, 2) * 1.1; sv.push([Math.cos(e) * Math.cos(a) * 240, Math.sin(e) * 240, Math.cos(e) * Math.sin(a) * 240]); }
    stars.userData.sv = sv;
    motes = LW.particles(110, '#FFE6B8', 0.05); scene.add(motes);
  }

  // ---------------- the crowd (back views, backlit: rim light from the door) ----------------
  const LINE = '#1A120E';
  const ROBES = ['#5A4636', '#4E4458', '#3E4C5A', '#5E3C30', '#4A5240', '#6A5440', '#3C3A4E', '#58483E', '#46383A', '#50584E', '#62503E', '#40465E'];
  const CLOTH = ['#A89878', '#8E8270', '#6A5E52', null, '#7E7060', null, '#7A6A5A', '#B4A486', null, '#8A7A66', '#5E5248', null];
  const HAIR = ['#24180F', '#2E2016', '#3A2A1E', '#1C140E'];
  const SKIN = ['#8A5C40', '#7A5038', '#94644A', '#6E4A34'];
  // fill a part with a dark back-lit tone, then an inner rim stroke that is bright at the top (toward the light)
  function rp(ctx, path, base, rim, top = -760, bot = -260, lw = 2.4) {
    ctx.fillStyle = base; ctx.fill(path);
    if (rim > 0.01) {
      ctx.save(); ctx.clip(path);
      const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, `rgba(255,232,180,${0.95 * rim})`); g.addColorStop(0.55, `rgba(255,214,150,${0.45 * rim})`); g.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 9; ctx.stroke(path); ctx.restore();
    }
    ctx.lineWidth = lw; ctx.strokeStyle = LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(path);
  }
  const E = (x, y, rx, ry, r = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, r, 0, 6.283); return p; };
  function armPath(J, El, Wr, r1, r2) { const p = new Path2D(); p.addPath(PP.limb(J, El, r1, r1 * 0.85, 1, 1)); p.addPath(PP.limb(El, Wr, r1 * 0.85, r2, 1, 1)); return p; }
  // o: { v, raise 0..1, item: null|'scroll'|'chains'|'staff', up 0..1 (item lifted), rim 0..1, hand: -1|1 (item hand), ph }
  function backPerson(ctx, o) {
    const v = o.v, robe = ROBES[v % 12], robeSh = PP.mix(robe, '#0A0810', 0.4), cloth = CLOTH[(v * 5 + 3) % 12], hair = HAIR[v % 4], skin = SKIN[(v * 3) % 4];
    const rim = o.rim, sway = o.sway || 0;
    const top = -760;
    // feet
    for (const s of [-1, 1]) rp(ctx, E(s * 20, -6, 17, 7), '#241A14', 0);
    // robe
    const wide = 1 + ((v * 7) % 5) * 0.03;
    const body = PP.blob([[-44 * wide, -404], [-68 * wide, -392], [-72 * wide, -300], [-78 * wide, -140], [-84 * wide, -18], [0, -12], [84 * wide, -18], [78 * wide, -140], [72 * wide, -300], [68 * wide, -392], [44 * wide, -404], [0, -410]], 0.42);
    rp(ctx, body, robe, rim * 0.8, top, -200);
    ctx.save(); ctx.clip(body);
    ctx.fillStyle = robeSh; ctx.globalAlpha = 0.55; ctx.fillRect(-100, -150, 200, 160); ctx.globalAlpha = 1;
    if (v % 3 === 0) { ctx.fillStyle = PP.mix(robe, '#C9B48E', 0.25); ctx.fillRect(-36, -404, 10, 400); ctx.fillRect(26, -404, 10, 400); }
    ctx.restore();
    rp(ctx, PP.blob([[-62, -298], [0, -292], [62, -298], [62, -284], [0, -278], [-62, -284]], 0.3), PP.mix(robe, '#1A120E', 0.5), 0);
    // arms: raise 0 = down at the sides, 1 = both up and open (pleading); the item hand goes higher
    const D = Math.PI / 180, R = o.raise;
    const arm = (s) => {
      const isItem = o.item && s === o.hand, up = isItem ? Math.max(R, o.up) : R;
      const a = (12 + up * (isItem ? 158 : 138)) * D + Math.sin(o.ph + s) * 0.03 * up + sway * s * 0.02, b = (isItem ? (-10 + up * 5) : (-25 + up * 18)) * D;
      const J = [s * 60, -388], d1 = [s * Math.sin(a), Math.cos(a)], d2 = [s * Math.sin(a + b), Math.cos(a + b)];
      const El = [J[0] + d1[0] * 98, J[1] + d1[1] * 98], Wr = [El[0] + d2[0] * 84, El[1] + d2[1] * 84];
      return { s, J, El, Wr, isItem, up };
    };
    const arms = [arm(-1), arm(1)];
    const drawArm = (A) => {
      const sleeve = PP.limb(A.J, A.El, 17, 14, 2, A.s), fore = PP.limb(A.El, A.Wr, 10.5, 8.5, 1, A.s);
      // a sleeve falls back from the raised forearm
      rp(ctx, fore, skin, rim, top, -300);
      rp(ctx, sleeve, robe, rim, top, -300);
      const cuff = PP.limb(A.El, [lerp(A.El[0], A.Wr[0], 0.22), lerp(A.El[1], A.Wr[1], 0.22)], 17, 14, 0, A.s); rp(ctx, cuff, PP.mix(robe, '#000', 0.15), rim * 0.7, top, -300);
      // the hand, seen from the back (open)
      const ang = Math.atan2(A.Wr[1] - A.El[1], A.Wr[0] - A.El[0]);
      const hp = new Path2D(); const m = new DOMMatrix().translate(A.Wr[0], A.Wr[1]).rotate(ang * 180 / Math.PI);
      const hand = new Path2D(); hand.roundRect(-4, -13, 30, 26, 11); hp.addPath(hand, m);
      const th = new Path2D(); th.ellipse(6, -A.s * 14, 9, 5, -A.s * 0.6, 0, 6.283); hp.addPath(th, m);
      rp(ctx, hp, skin, rim, top, -300, 2);
      ctx.strokeStyle = 'rgba(26,18,14,0.6)'; ctx.lineWidth = 1.4; for (const yy of [-5, 2, 8]) { const a = m.transformPoint(new DOMPoint(14, yy)), b = m.transformPoint(new DOMPoint(25, yy)); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    };
    // items behind the hand
    const IA = arms.find((A) => A.isItem);
    const item = (front) => {
      if (!IA) return;
      const [hx, hy] = IA.Wr, k = Math.max(o.up, 0);
      if (o.item === 'staff' && !front) {
        const tilt = (IA.s * 0.12) * (1 - k * 0.6), L0 = 300 * (0.6 + 0.4 * k);
        const x0 = hx - Math.sin(tilt) * 260, y0 = hy + Math.cos(tilt) * 260, x1 = hx + Math.sin(tilt) * L0, y1 = hy - Math.cos(tilt) * L0;
        const sp = new Path2D(); sp.moveTo(x0, y0); sp.lineTo(x1, y1);
        ctx.lineCap = 'round'; ctx.strokeStyle = LINE; ctx.lineWidth = 15; ctx.stroke(sp);
        ctx.strokeStyle = '#4A3424'; ctx.lineWidth = 10; ctx.stroke(sp);
        ctx.strokeStyle = `rgba(255,226,170,${0.8 * rim})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 3, y0); ctx.lineTo(x1 + 3, y1); ctx.stroke();
        // the crook
        const c = new Path2D(); c.arc(x1 + IA.s * 22, y1, 22, Math.PI, Math.PI * 2 + 0.5 * IA.s, IA.s < 0);
        ctx.strokeStyle = LINE; ctx.lineWidth = 15; ctx.stroke(c); ctx.strokeStyle = '#4A3424'; ctx.lineWidth = 10; ctx.stroke(c);
        ctx.strokeStyle = `rgba(255,226,170,${0.9 * rim})`; ctx.lineWidth = 3; ctx.stroke(c);
      }
      if (o.item === 'scroll' && front) {
        const x = hx, y = hy - 50;
        const parch = new Path2D(); parch.rect(x - 34, y - 52, 68, 104);
        rp(ctx, parch, '#B8A884', rim * 1.2, y - 60, y + 60, 2.2);
        ctx.strokeStyle = 'rgba(80,60,40,0.35)'; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - 22, y - 30 + i * 15); ctx.lineTo(x + 22, y - 30 + i * 15); ctx.stroke(); }
        for (const s of [-1, 1]) { const rod = new Path2D(); rod.roundRect(x + s * 38 - 8, y - 66, 16, 132, 7); rp(ctx, rod, '#6A4A32', rim, y - 70, y + 70, 2.2); rp(ctx, E(x + s * 38, y - 70, 9, 6), '#8A6A44', rim, y - 80, y - 60, 1.8); rp(ctx, E(x + s * 38, y + 70, 9, 6), '#8A6A44', 0, 0, 1, 1.8); }
      }
      if (o.item === 'chains' && front) {
        // a broken chain hanging from the fist, an open shackle at the end
        let x = hx, y = hy + 8;
        for (let i = 0; i < 7; i++) {
          const sw = Math.sin(o.ph * 2 + i * 0.6) * 2.5 * i;
          const lk = i % 2 ? E(x + sw, y, 6, 15) : E(x + sw, y, 12, 16);
          ctx.lineWidth = 9; ctx.strokeStyle = LINE; ctx.stroke(lk); ctx.lineWidth = 5.5; ctx.strokeStyle = '#5C6068'; ctx.stroke(lk);
          ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,230,180,${0.85 * rim})`; ctx.beginPath(); ctx.ellipse(x + sw, y, i % 2 ? 6 : 12, i % 2 ? 15 : 16, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
          y += 24;
        }
        // the broken link: an open C
        const sw = Math.sin(o.ph * 2 + 4.2) * 17;
        ctx.lineWidth = 10; ctx.strokeStyle = LINE; ctx.beginPath(); ctx.arc(x + sw, y + 4, 15, -1.1, 3.6); ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = '#5C6068'; ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,230,180,${0.85 * rim})`; ctx.beginPath(); ctx.arc(x + sw, y + 4, 15, 3.2, 4.8); ctx.stroke();
      }
    };
    item(false);
    // the far arm first, then the head, the near arm
    drawArm(arms[0]);
    drawArm(arms[1]);
    // head (back): hair or a head cloth with a cord
    ctx.save(); ctx.translate(0, -468);
    rp(ctx, PP.poly([[-15, 22], [15, 22], [17, 64], [-17, 64]]), skin, rim * 0.5, -60, 60);
    if (cloth) {
      rp(ctx, PP.blob([[-38, 30], [-44, -8], [-38, -44], [0, -56], [38, -44], [44, -8], [38, 30], [52, 78], [0, 70], [-52, 78]], 0.42), cloth, rim, -60, 60);
      rp(ctx, PP.blob([[-38, -24], [0, -32], [38, -24], [38, -16], [0, -24], [-38, -16]], 0.35), '#2A2018', rim * 0.5, -40, 0, 2);
    } else {
      for (const s of [-1, 1]) rp(ctx, E(s * 35, 0, 7, 11), skin, rim * 0.6, -20, 20, 2);
      rp(ctx, PP.blob([[-36, 10], [-38, -20], [-28, -44], [0, -52], [28, -44], [38, -20], [36, 10], [26, 34], [0, 40], [-26, 34]], 0.5), hair, rim, -60, 40);
    }
    ctx.restore();
    item(true);
  }

  // the three signs held up together (one card, high resolution, for the low-angle cut): scroll, chains, staff
  const HERO = [{ x: -205, v: 4, item: 'scroll', hand: 1, key: 'scroll' }, { x: 215, v: 9, item: 'staff', hand: -1, key: 'staff' }, { x: 0, v: 1, item: 'chains', hand: 1, key: 'chains' }];
  function drawHeroes(ctx, st) {
    HERO.forEach((h, i) => { ctx.save(); ctx.translate(h.x, i === 2 ? 6 : -4); backPerson(ctx, { v: h.v, raise: st.raise, item: h.item, up: st[h.key], hand: h.hand, rim: st.rim, ph: i * 1.7 }); ctx.restore(); });
  }
  const shadowTex = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.15, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(32, 128, 30, 128, 0, 0, 6.283); x.fill(); const t = new THREE.CanvasTexture(c); return t; })();
  function longShadow(obj, w = 0.6, len = 4.6) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: 0x05040a, opacity: 0.6 }));
    m.rotation.x = -Math.PI / 2; m.position.set(obj.position.x + 0.02 * obj.position.x, 0.02, obj.position.z + len * 0.42); m.renderOrder = 2; scene.add(m); shadows.push([m, obj]);
  }
  // positions: rows at the foot of the steps; the hero group stands in the back row, centre
  function buildCrowd() {
    const rng = FW.rng(77); const spots = [];
    for (let row = 0; row < 6; row++) {
      const z = 0.7 + row * 0.8, n = 7 + row, span = 2.4 + row * 0.35;
      for (let i = 0; i < n; i++) { const x = -span + (i + 0.5) * (2 * span / n) + (rng() - 0.5) * 0.35; spots.push([x, z + (rng() - 0.5) * 0.3]); }
    }
    const HZ = 5.0;
    const items = ['scroll', 'chains', 'staff'];
    const all = [];
    spots.forEach(([x, z], i) => { if (Math.abs(x) < 0.95 && Math.abs(z - HZ) < 0.6) return; const r = hsh(i, 5); all.push({ x, z, item: r < 0.13 ? 'scroll' : r < 0.25 ? 'chains' : r < 0.32 ? 'staff' : null, hand: hsh(i, 6) < 0.5 ? -1 : 1 }); });
    all.forEach((p, i) => {
      const s = 0.75, hScale = 0.94 + hsh(i, 8) * 0.1, cw = Math.round(420 * s), ch = Math.round((p.item === 'staff' ? 940 : 860) * s);
      const b = LW.billboard({ cw, ch, worldH: ch * hScale / (DU * s), footPx: 12, draw: (ctx, st) => { ctx.translate(cw / 2, ch - 12); ctx.scale(s, s); backPerson(ctx, st); } });
      b.position.set(p.x, 0, p.z); b.userData.p = p; b.userData.v = (i * 7 + 3) % 12; b.userData.ph = hsh(i, 9) * 6.28;
      scene.add(b); crowd.push(b); longShadow(b);
    });
    { const s = 1.7, cw = Math.round(980 * s), ch = Math.round(960 * s);
      heroes = LW.billboard({ cw, ch, worldH: ch / (DU * s), footPx: 14, draw: (ctx, st) => { ctx.translate(cw / 2, ch - 14); ctx.scale(s, s); drawHeroes(ctx, st); } });
      heroes.position.set(0.05, 0, HZ); scene.add(heroes); crowd.push(heroes); longShadow(heroes, 1.7, 5.0); }
    crowd.sort((a, b) => a.position.z - b.position.z);
  }

  function build() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(C('#0B1022'), 24, 90);
    hemi = new THREE.HemisphereLight(C('#3A4E92'), C('#191626'), 0.95); scene.add(hemi);
    // the light from the door: down the steps onto the crowd (long shadows toward us)
    spot = new THREE.SpotLight(C('#FFE6BC'), 0, 70, 0.62, 0.55, 0.35);
    spot.position.set(0, TOPY + 3.2, WALLZ + 0.2); spot.target.position.set(0, 0, 4);
    spot.castShadow = false;
    scene.add(spot, spot.target);
    doorPt = new THREE.PointLight(C('#FFE2B0'), 0, 12, 1.4); doorPt.position.set(0, TOPY + 1.6, WALLZ - 0.05); scene.add(doorPt);
    buildPlace();
    buildCrowd();
  }

  // ---------------- per frame ----------------
  // light: 1 = blazing; narrowing 0..1 = the light withdrawing to a line
  function setLight(t, L, nar) {
    const fl = 1 + 0.03 * Math.sin(t * 2.1) + 0.02 * Math.sin(t * 5.3);
    const open = 1 - nar;
    spot.intensity = 11 * L * fl * lerp(1, 0.04, ease.inOut(nar));
    doorPt.intensity = 9 * L * fl * Math.pow(1 - nar, 2);
    hemi.intensity = lerp(0.95, 0.55, nar);
    halo.material.opacity = 0.3 * L * fl * Math.pow(open, 1.5); halo.scale.set(22 * lerp(1, 0.3, nar), 22 * lerp(1, 0.8, nar), 1);
    halo2.material.opacity = 0.9 * L * fl * open; halo2.scale.set(7 * lerp(1, 0.2, nar), 9, 1);
    line.material.opacity = lerp(0.45, 0.95, nar) * L; line.scale.set(lerp(1.0, 0.22, ease.inOut(nar)), DOOR.h * lerp(1.3, 1.15, nar), 1);
    shadows.forEach(([m, o]) => { m.material.opacity = 0.78 * L * lerp(1, 0.1, nar); });
    lightBack.visible = open > 0.12; lightBack.material.color.set(C('#FFF1D2').multiplyScalar(3.2 * open * open + 0.01));
    const seam = lerp(0.14, 0.02, ease.inOut(nar)), lw = DOOR.w / 2 - 0.1;
    leafL.position.x = -(lw / 2 + seam / 2); leafR.position.x = lw / 2 + seam / 2;
    lightSeam.scale.x = Math.max(0.15, seam / 0.2 + 0.2);
    pool.material.opacity = 0.35 * L * lerp(1, 0.08, nar);
    stepGlow.material.opacity = 0.12 * L * lerp(1, 0.0, nar);
    stars.userData.update((i, v) => { const p = stars.userData.sv[i]; v.set(p[0], p[1], p[2]); return { alpha: 0.35 + 0.4 * hsh(i, 3) * (0.7 + 0.3 * Math.sin(t * (1 + hsh(i, 4) * 2) + i)), size: 0.5 + hsh(i, 5) * 0.8 }; });
    motes.userData.update((i, v) => {
      const k = (hsh(i, 7) + t * 0.02 * (0.5 + hsh(i, 8))) % 1, along = hsh(i, 9);
      v.set((hsh(i, 1) - 0.5) * (2 + along * 7) + Math.sin(t * 0.3 + i) * 0.3, lerp(TOPY + 4, 1.0, along) + (k - 0.5) * 2, lerp(WALLZ + 1, 4, along));
      return { alpha: 0.55 * L * open * Math.sin(Math.PI * k) * (0.4 + 0.6 * hsh(i, 10)), size: 0.6 + hsh(i, 11) };
    });
  }
  // the crowd's gestures, on the words: "Lord, Lord" hands up; scrolls on "prophesy", chains on "demons", staffs on "works"
  function poseCrowd(t, shot, rim, dimK) {
    const b = shot.beats || {};
    const tL = b.lord ?? shot.t0 + 2.6, tP = b.prophesy ?? shot.t0 + 4.4, tD = b.demons ?? shot.t0 + 7, tW = b.works ?? shot.t0 + 9.5;
    const itemAt = { scroll: tP, chains: tD, staff: tW };
    {
      const raise = shot.v === 'door' ? 1 : ease.inOut(clamp((t - tL + 0.2) / 0.7));
      const it = (k) => (shot.v === 'door' ? 1 : ease.out(clamp((t - itemAt[k] + 0.15) / 0.45)));
      const st = { raise: q(raise, 20), scroll: q(it('scroll'), 20), chains: q(it('chains'), 20), staff: q(it('staff'), 20), rim: q(rim, 8) };
      heroes.userData.update(JSON.stringify(st), st);
      const k = lerp(0.72, 0.22, dimK); heroes.material.color.setRGB(k, k * 0.98, k * 1.06);
    }
    crowd.forEach((c, i) => {
      if (c === heroes) return;
      const p = c.userData.p, lag = hsh(i, 12) * 0.5;
      const raise = shot.v === 'door' ? 1 : ease.inOut(clamp((t - tL + 0.25 - lag) / 0.7)) * (0.75 + 0.25 * hsh(i, 13));
      const up = p.item ? (shot.v === 'door' ? 1 : ease.out(clamp((t - itemAt[p.item] + 0.15 - lag * 0.4) / 0.45))) : 0;
      const st = { v: c.userData.v, raise: q(raise, 8), item: p.item, up: q(up, 6), hand: p.hand, rim: q(rim, 5), ph: q(c.userData.ph, 4) };
      c.userData.update(JSON.stringify(st), st);
      c.userData.tilt = Math.sin(t * 1.1 + c.userData.ph) * 0.012 * raise;
      const k = lerp(0.66, 0.2, dimK);
      c.material.color.setRGB(k, k * 0.98, k * 1.08);
    });
  }

  const K = (p, l, f = 38) => ({ p, l, f });
  function setCam(k, focusP, ap, sy = 0.5, sx = 0.5) {
    FW.setCam(cam, k.p, k.l, k.f);
    cam.setViewOffset(W, H, -(sx - 0.5) * W, -(sy - 0.5) * H, W, H);
    cam.updateMatrixWorld();
    const focus = -new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z;
    return { focus, aperture: ap };
  }
  // 2D rays fanning from the door down over the steps (God's light at the door); fade as it narrows
  function doorRays(ctx, t, project, amt, dir = Math.PI / 2) {
    if (amt < 0.01) return;
    const [ox, oy] = project([0, TOPY + DOOR.h * 0.42, WALLZ + 0.3]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const R = [[-0.55, 70, 0.45], [-0.22, 90, 0.6], [0.08, 110, 0.7], [0.36, 80, 0.55], [0.62, 60, 0.4]];
    const len = 1900;
    for (const [da, wDeg, a] of R) {
      const ang = dir + da + Math.sin(t * 0.3 + da * 7) * 0.02, w = (wDeg / 1000) * (1 + 0.12 * Math.sin(t * 0.7 + da * 20));
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      g.addColorStop(0, `rgba(255,236,190,${0.16 * a * amt})`); g.addColorStop(0.3, `rgba(255,224,170,${0.07 * a * amt})`); g.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(ang - w) * len, oy + Math.sin(ang - w) * len); ctx.lineTo(ox + Math.cos(ang + w) * len, oy + Math.sin(ang + w) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  const SH = {};
  // S22: "Lord, Lord, did we not..." A slow crane over the crowd toward the door; cut on "mighty" to a low angle of the hands
  SH.crowd = (t, shot) => {
    const tW = (shot.beats.works ?? shot.t0 + shot.dur * 0.83) - 0.08;
    setLight(t, 1, 0);
    poseCrowd(t, shot, 1, 0);
    if (t < tW) {
      const u = ease.inOut(clamp((t - shot.t0) / (tW - shot.t0)));
      const k = FW.camLerpK(K([0.35, 1.75, 13.2], DC, 38), K([0.1, 4.1, 11.2], DC, 38), u);
      const c = setCam(k, [0, 1.6, lerp(4, 0, u)], 3.2, 0.2, 0.46);
      return Object.assign(c, { post: (ctx, tt, P) => doorRays(ctx, tt, P, 1) });
    }
    // low angle among them: the raised hands and the signs against the light
    const u = ease.out(clamp((t - tW) / (shot.t1 - tW)));
    const k = FW.camLerpK(K([0.12, 0.42, 9.85], [0.05, 1.72, 0.3], 47), K([0.1, 0.4, 9.6], [0.05, 1.74, 0.3], 47), u);
    const c = setCam(k, [0.05, 2.3, 5.0], 4.0, 0.5, 0.5);
    return Object.assign(c, { post: (ctx, tt, P) => doorRays(ctx, tt, P, 0.7, -Math.PI / 2) });
  };
  // S23: "And He will declare, 'I never knew you.'" Locked. The light narrows to a line; the crowd falls into shadow
  SH.door = (t, shot) => {
    const tN = shot.beats.never ?? shot.t0 + 1.8;
    const nar = prog(t, tN - 0.15, tN + 0.85, ease.inOut);
    setLight(t, 1, nar);
    poseCrowd(t, shot, lerp(1, 0.12, nar), nar);
    const k = K([0.25, 2.6, 15.5], DC, 38);
    const c = setCam(k, [0, 1.2, 4], 3.0, 0.22, 0.48);
    return Object.assign(c, { dark: nar * 0.12, post: (ctx, tt, P) => doorRays(ctx, tt, P, 1 - nar) });
  };

  SCENES.day = {
    async build(env) { cam = env.cam; build(); },
    frame(t, shot, camera) {
      cam = camera;
      const r = (SH[shot.v] || SH.crowd)(t, shot);
      return Object.assign({ maxR: 7, fgScale: 1.6, exposure: 1.12, sat: 1.05, bloom: 0.24, lift: [0.01, 0.014, 0.04], gain: [1, 1, 1] }, r, { scene, sun: spot, bill: crowd }); // lift/gain always passed (LW.render keeps the last values)
    },
  };
})();
