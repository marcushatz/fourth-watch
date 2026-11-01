// TIMNAH (Judges 14) and ASHKELON (14:19), in the approved Lintel-grade diorama look.
//  S06 'lion'     (14:5-6) the vineyards of Timnah, day: a young lion leaps at Samson from the vines; the Spirit rushes on
//                  him (gold) and he catches it and throws it away. No gore. Medium, fast push.
//  S07 'ashkelon' (14:19)  the gate of Ashkelon by the sea: on "rushed" the gold comes down on Samson, thirty Philistine men
//                  topple away in a row into dust (nobody shown dying), and their garments drop. Wide, quick lateral move.
//  S09 'bride'    (14:1-3) Timnah's well, warm afternoon: Samson points at a young Philistine woman with a water jar; his
//                  parents object, hands raised. Two-shot; slow push to Samson's face on "eyes".
//  S18 'wide'     (14:4)   Timnah from above: the walled town in its valley, Samson walking down toward it; gold light
//                  settles over the whole town (God at work), not on Samson. High wide, slow drift.
// One Timnah world (valley, terraced vineyards, the town and its well) serves S06, S09 and S18; Ashkelon is its own set.
// Characters: globalThis.PP2 when published (PP2.SIZES), else PP / local stand-ins. Every frame is a pure function of t.
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const q = (v, n = 60) => Math.round(v * n) / n;
  const UNIT = 1.86 / 560; // metres per character design unit (PP.samson: 560 units = 1.86 m)
  let cam; const SKIES = [];

  // ======================================================================================================
  // shared kit
  // ======================================================================================================
  // merge many static meshes into one vertex-coloured, flat-shaded mesh (one draw call)
  function merger() {
    const P = [], Cc = [];
    const api = {
      add(geo, m, color) {
        const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m);
        const p = g.attributes.position, c = color.isColor ? color : C(color);
        for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); Cc.push(c.r, c.g, c.b); }
        g.dispose();
      },
      obj(o) { o.updateMatrixWorld(true); o.traverse((c) => { if (c.isMesh && c.material && c.material.isMeshStandardMaterial) api.add(c.geometry, c.matrixWorld, c.material.color); }); },
      mesh() {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.93, metalness: 0 }));
        m.castShadow = m.receiveShadow = true; return m;
      },
    };
    return api;
  }
  const M = (c) => LW.M(c);
  const mesh = (geo, col, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, M(col)); m.position.set(x, y, z); return m; };
  const pick = (rng, a) => a[Math.floor(rng() * a.length) % a.length];

  // a vine: short gnarled stock, two leafy masses, a dark grape cluster
  function vine(rng, s = 1) {
    const g = new THREE.Group();
    const tg = LW.jitter(new THREE.CylinderGeometry(0.035, 0.06, 0.5, 4, 1), 0.04, rng); tg.translate(0, 0.25, 0);
    g.add(mesh(tg, '#6B4A33'));
    const leaf = ['#6F8C3E', '#5F7E36', '#7E9944', '#88A24B', '#698A3A'];
    for (let i = 0; i < 2; i++) { const r = 0.27 + rng() * 0.12; const b = mesh(LW.jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.35, rng), pick(rng, leaf), (i - 0.5) * 0.38 + (rng() - 0.5) * 0.1, 0.55 + rng() * 0.12, (rng() - 0.5) * 0.12); b.scale.set(1.25, 0.78, 1.0); g.add(b); }
    if (rng() < 0.7) { const c = mesh(new THREE.ConeGeometry(0.065, 0.16, 4), rng() < 0.5 ? '#5A2C4A' : '#6B3557', (rng() - 0.5) * 0.4, 0.38, 0.2); c.rotation.x = Math.PI; g.add(c); }
    g.scale.setScalar(s); g.rotation.y = (rng() - 0.5) * 0.6; return g;
  }
  // a date palm: a leaning, segmented trunk and a crown of drooping fronds
  function palm(rng, s = 1) {
    const g = new THREE.Group(); const n = 6, lean = (rng() - 0.5) * 0.5; let x = 0, y = 0;
    for (let i = 0; i < n; i++) { const seg = mesh(LW.jitter(new THREE.CylinderGeometry(0.11 - i * 0.007, 0.13 - i * 0.007, 0.62, 5, 1), 0.03, rng), i % 2 ? '#7A5E40' : '#6B5238', x, y + 0.31, 0); seg.rotation.z = -lean * 0.4; g.add(seg); x += lean * 0.12 * i; y += 0.58; }
    const fr = ['#5E7E36', '#6E8C3E', '#58742F', '#7A9644'];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + rng() * 0.3; const f = new THREE.Mesh(LW.jitter(new THREE.ConeGeometry(0.16, 1.7, 3), 0.05, rng), M(pick(rng, fr))); f.geometry.translate(0, 0.85, 0); f.position.set(x, y, 0); f.rotation.set(0, a, 1.15 + rng() * 0.45, 'YXZ'); f.scale.set(1, 1, 0.35); g.add(f); }
    g.add(mesh(LW.jitter(new THREE.IcosahedronGeometry(0.2, 0), 0.06, rng), '#6B4A2E', x, y, 0));
    g.scale.setScalar(s); g.rotation.y = rng() * 6.28; return g;
  }
  // a clay jar
  function jarGeo(h = 0.55) { const pts = [[0, 0], [0.1, 0.01], [0.17, 0.12], [0.2, 0.28], [0.17, 0.44], [0.08, 0.5], [0.07, 0.56], [0.09, 0.6]].map(([r, y]) => new THREE.Vector2(r * h / 0.6, y * h / 0.6)); return new THREE.LatheGeometry(pts, 7); }
  // a flat-roofed mud-brick house: walls, roof slab with a low parapet, beam ends, door, window; sometimes an upper room
  const MUD = ['#C9A273', '#BF9665', '#D2B386', '#B88E62', '#CDB58C', '#C49C6C'];
  function house(rng, w, d, h) {
    const g = new THREE.Group(); const wc = pick(rng, MUD), cc = C(wc).offsetHSL(0, -0.05, 0.06).getHexString();
    g.add(mesh(LW.jitter(new THREE.BoxGeometry(w, h, d, 2, 1, 2), 0.05, rng), wc, 0, h / 2, 0));
    g.add(mesh(new THREE.BoxGeometry(w + 0.12, 0.14, d + 0.12), '#' + cc, 0, h + 0.07, 0));
    for (const [px, pz, pw, pd] of [[0, d / 2, w + 0.12, 0.12], [0, -d / 2, w + 0.12, 0.12], [w / 2, 0, 0.12, d], [-w / 2, 0, 0.12, d]]) g.add(mesh(new THREE.BoxGeometry(pw, 0.26, pd), '#' + cc, px, h + 0.27, pz));
    const nb = Math.max(3, Math.round(w / 0.8));
    for (let i = 0; i < nb; i++) { const b = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 5), '#5E4430', -w / 2 + (i + 0.5) * w / nb, h - 0.16, d / 2 + 0.08); b.rotation.x = Math.PI / 2; g.add(b); }
    const dx = (rng() - 0.5) * (w - 1.0);
    g.add(mesh(new THREE.BoxGeometry(0.66, 1.3, 0.08), '#3A2A20', dx, 0.65, d / 2 + 0.01));
    g.add(mesh(new THREE.BoxGeometry(0.8, 0.1, 0.14), '#6B4A33', dx, 1.33, d / 2 + 0.04));
    if (w > 2.4) g.add(mesh(new THREE.BoxGeometry(0.36, 0.3, 0.06), '#3A2A20', dx > 0 ? dx - 1.0 : dx + 1.0, h * 0.7, d / 2 + 0.01));
    if (rng() < 0.4) { const uw = w * 0.45, ud = d * 0.5, uh = 1.3; g.add(mesh(LW.jitter(new THREE.BoxGeometry(uw, uh, ud), 0.04, rng), wc, -w * 0.2, h + uh / 2, -d * 0.18)); g.add(mesh(new THREE.BoxGeometry(uw + 0.1, 0.12, ud + 0.1), '#' + cc, -w * 0.2, h + uh + 0.06, -d * 0.18)); }
    if (rng() < 0.5) for (let i = 0; i < 2; i++) { const j = mesh(jarGeo(0.42 + rng() * 0.2), rng() < 0.5 ? '#B8693F' : '#C47A4A', dx + 0.6 + i * 0.32, 0, d / 2 + 0.3); g.add(j); }
    return g;
  }
  // billboards for the cast: PP2 when published (with PP2.SIZES), else a stand-in drawer
  const P2 = () => globalThis.PP2 || null;
  // pivot: for a PP2 drawer whose origin is at the feet but which should turn about its body (the leaping lion), the
  // billboard plane is shifted so its origin sits that many design units above the feet
  function castBB(kind, fb, def, pivot = 0, over = null) {
    const P = P2(), fn = P && typeof P[kind] === 'function' ? P[kind] : null;
    const z = Object.assign({}, def, (fn && P.SIZES && P.SIZES[kind]) || {}, over || {});
    const sc = z.scale ?? 1;
    const bb = LW.billboard({ cw: z.cw, ch: z.ch, worldH: (z.ch * UNIT) / sc, footPx: z.footPx, draw: (ctx, st) => { ctx.translate(z.cw / 2, z.ch - z.footPx); ctx.scale(sc, sc); (fn || fb)(ctx, st); } });
    if (fn && pivot) bb.geometry.translate(0, -pivot * UNIT, 0);
    bb.userData.real = !!fn; bb.userData.kind = kind;
    return bb;
  }
  const blobTex = (() => { let tx; return () => { if (tx) return tx; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); tx = new THREE.CanvasTexture(c); return tx; }; })();
  function contactShadow(scene, list, obj, r = 0.45) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.2), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, color: 0x2a1a10, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m); list.push([m, obj]); obj.userData.contact = m; return m;
  }
  // normal-blended soft particles (dust); fn(i, v) -> {alpha, size}
  function dustPts(n, color, size) {
    const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3), a = new Float32Array(n), s = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(a, 1)); g.setAttribute('psize', new THREE.BufferAttribute(s, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: LW.dotTex() }, col: { value: C(color) }, scale: { value: 900 } },
      vertexShader: 'attribute float alpha; attribute float psize; uniform float scale; varying float vA; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 col; varying float vA; void main(){ float m = texture2D(map, gl_PointCoord).a * vA; if (m < 0.01) discard; gl_FragColor = vec4(col, m); }',
      transparent: true, depthWrite: false, fog: false, toneMapped: false });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6;
    const v = new THREE.Vector3();
    pts.userData.update = (fn) => { for (let i = 0; i < n; i++) { const r = fn(i, v) || { alpha: 0 }; p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z; a[i] = r.alpha; s[i] = (r.size ?? 1) * size; }
      g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.psize.needsUpdate = true; };
    return pts;
  }
  function aimSun(sun, tg, off, ext, far = 80) {
    sun.position.set(tg[0] + off[0], tg[1] + off[1], tg[2] + off[2]); sun.target.position.set(tg[0], tg[1], tg[2]); sun.target.updateMatrixWorld();
    const sc = sun.shadow.camera; if (sc.right !== ext || sc.far !== far) { sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 0.5; sc.far = far; sc.updateProjectionMatrix(); }
  }
  // horizontal camera basis: f = forward, r = screen right
  function camBasis() { const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize(); return { f, r: new THREE.Vector3(-f.z, 0, f.x) }; }
  // a point placed relative to the camera's view: ahead, left (screen left), up
  function fromCam(p, ahead, left, up) { const { f, r } = camBasis(); return [p[0] + f.x * ahead - r.x * left, p[1] + up, p[2] + f.z * ahead - r.z * left]; }
  function setSky(sky, o) { const u = sky.material.uniforms; u.top.value.set(o.top); u.mid.value.set(o.mid); u.hor.value.set(o.hor); u.low.value.set(o.low); u.sunDir.value.set(...o.sunDir).normalize(); u.sunCol.value.set(o.sunCol); u.sunAmt.value = o.sunAmt; }
  const K = (p, l, f = 34) => ({ p, l, f });
  function camSet(k, shift, focusP) {
    FW.setCam(cam, k.p, k.l, k.f);
    cam.setViewOffset(W, H, 0, -shift * H, W, H);
    cam.updateMatrixWorld();
    for (const sk of SKIES) { sk.position.copy(cam.position); sk.updateMatrixWorld(); }
    return -new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z;
  }
  // a pose change lands with a small squash-and-settle (billboard scale), so key poses read as animated
  const pop = (t, tk) => { const d = t - tk; return d >= 0 && d < 0.22 ? 1 + 0.045 * Math.sin((d / 0.22) * Math.PI) * (1 - d / 0.22) : 1; };

  // ---------------- stand-ins (used only until PP2 is published) ----------------
  const LINE = '#24160F';
  function samFB(ctx, st) {
    const o = { t: st.t || 0, look: st.look || [0, 0], rim: st.gold || 0, brk: 1, strain: 0, burst: 0 };
    if (st.pose === 'burst') o.burst = 1; if (st.pose === 'strain') o.strain = 0.75;
    PP.samson(ctx, o);
  }
  function judeanFB(o) { return (ctx, st) => { ctx.save(); ctx.scale(1.12, 1.12); PP.judean(ctx, Object.assign({}, o, { hand: st.pose === 'object' ? 1 : 0, look: st.look || o.look })); ctx.restore(); }; }
  function womanFB(o) {
    return (ctx, st) => {
      const { part, blob, ell, limb, eyes, brows, mix } = PP;
      const skin = o.skin || '#C08A5E', sh = mix(skin, '#5A3424', 0.35), robe = o.robe, rsh = mix(robe, '#2A1E16', 0.38), veil = o.veil, vsh = mix(veil, '#4A3424', 0.32);
      const pose = st.pose || 'stand', kneel = pose === 'awe', sk = { shade: sh, sd: 5 };
      const hy = kneel ? -318 : -468, top = hy + 50, shY = top + 30, shake = (st.shake || 0) * 6;
      if (!kneel) for (const s of [-1, 1]) part(ctx, ell(s * 16, -6, 16, 7), '#5A3C26', { lw: 2 });
      const body = kneel ? blob([[-34, top + 6], [-56, top + 34], [-62, top + 110], [-94, -36], [-100, -6], [0, -2], [100, -6], [94, -36], [62, top + 110], [56, top + 34], [34, top + 6], [0, top + 14]], 0.42)
        : blob([[-34, top + 6], [-54, top + 28], [-56, top + 110], [-62, -150], [-72, -12], [0, -6], [72, -12], [62, -150], [56, top + 110], [54, top + 28], [34, top + 6], [0, top + 14]], 0.42);
      part(ctx, body, robe, { shade: rsh, sd: 12 });
      ctx.save(); ctx.clip(body); ctx.fillStyle = o.band || '#8E3A26'; ctx.fillRect(-120, kneel ? -40 : -44, 240, 12); ctx.fillStyle = o.sash || '#E2C98E'; ctx.fillRect(-70, top + 120, 140, 14); ctx.restore();
      const arm = (J, E, Wr, open) => { part(ctx, limb(J, E, 14, 12, 2, 1), robe, { shade: rsh, sd: 6 }); part(ctx, limb(E, Wr, 11, 9, 1, 1), skin, sk); part(ctx, open ? ell(Wr[0], Wr[1] - 4, 11, 14) : ell(Wr[0], Wr[1], 10, 10), skin, sk); };
      let jar = null;
      for (const s of [-1, 1]) {
        const J = [s * 44, shY];
        if (pose === 'object') arm(J, [s * 78, shY - 6 + Math.sin(st.shake || 0) * 2], [s * 74, shY - 92], true);
        else if (pose === 'awe') arm(J, [s * 40, shY + 50], [s * 16, hy + 26], true);
        else if (pose === 'jar' && s === 1) { arm(J, [68, shY + 46], [58, shY - 26]); jar = [56, shY - 64]; }
        else arm(J, [s * 56, shY + 96], [s * 54, shY + 182]);
      }
      ctx.save(); ctx.translate(shake, hy);
      part(ctx, ell(0, 0, 32, 36), skin, { shade: sh, sd: 6 });
      eyes(ctx, 0, -2, { sp: 12, rx: 6.6, ry: 4.6, look: st.look || [0, 0] });
      brows(ctx, 0, -12, { furrow: pose === 'object' ? 0.8 : 0, lift: pose === 'awe' ? 4 : 1, th: 3.4, col: o.brow || '#2C1B12' });
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(2, 2); ctx.quadraticCurveTo(5, 10, 6, 13); ctx.quadraticCurveTo(2, 16, -3, 14); ctx.stroke();
      if (pose === 'awe' || pose === 'object') part(ctx, ell(0, 22, 5, 5), '#6A2E22', { lw: 1.5 }); else { ctx.beginPath(); ctx.moveTo(-6, 22); ctx.quadraticCurveTo(0, 25, 6, 22); ctx.stroke(); }
      const hc = blob([[-36, 26], [-42, -6], [-36, -40], [0, -52], [36, -40], [42, -6], [36, 26], [52, 70], [26, 56], [30, 4], [24, -22], [0, -28], [-24, -22], [-30, 4], [-26, 56], [-52, 70]], 0.42);
      if (o.hair) { part(ctx, blob([[-34, -4], [-30, -34], [0, -44], [30, -34], [34, -4], [22, -26], [0, -30], [-22, -26]], 0.4), o.hair, { shade: '#150C08', sd: 3 }); part(ctx, blob([[30, -10], [44, 20], [40, 70], [26, 74], [30, 20]], 0.4), o.hair, { lw: 2 }); }
      if (veil) part(ctx, hc, veil, { shade: vsh, sd: 7 });
      ctx.restore();
      if (jar) { ctx.save(); ctx.translate(jar[0], jar[1]); ctx.rotate(0.25); const j = blob([[-8, -46], [8, -46], [10, -36], [24, -18], [26, 14], [14, 34], [-14, 34], [-26, 14], [-24, -18], [-10, -36]], 0.45); part(ctx, j, '#B8693F', { shade: '#8A4A2A', sd: 6 }); ctx.restore(); }
    };
  }
  // a young lion, flat style; origin at the middle of the body; faces screen left. pose 'leap' | 'thrown' | 'crouch'
  function lionFB(ctx, st) {
    const { part, blob, ell, limb } = PP;
    const fur = '#D09A4E', sh = '#A06A30', mane = '#8E5428', msh = '#673A1A', pale = '#EBCB8E';
    const thrown = st.pose === 'thrown', S = { shade: sh, sd: 9 };
    ctx.save(); ctx.scale(0.74, 0.74); if (thrown) ctx.scale(1, -1);
    const L = thrown ? { fb: [[-95, 20], [-135, 75], [-150, 125]], fn: [[-118, 25], [-160, 80], [-185, 125]], hb: [[95, 25], [130, 85], [128, 135]], hn: [[120, 20], [170, 75], [190, 120]] }
      : { fb: [[-100, 12], [-178, 26], [-246, 10]], fn: [[-120, 24], [-196, 52], [-262, 52]], hb: [[100, 18], [160, 72], [232, 98]], hn: [[122, 24], [190, 60], [266, 66]] };
    const leg = (P, col, o) => { part(ctx, limb(P[0], P[1], 27, 18, 6, 1), col, o); part(ctx, limb(P[1], P[2], 18, 14, 2, 1), col, o); part(ctx, ell(P[2][0] - 4, P[2][1], 21, 14), col, o); };
    // tail
    const tw = Math.sin((st.t || 0) * 9) * 10;
    ctx.strokeStyle = LINE; ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(140, -20); ctx.quadraticCurveTo(220, -110 + tw, 300, -80 + tw); ctx.stroke();
    ctx.strokeStyle = fur; ctx.lineWidth = 11; ctx.stroke(); part(ctx, ell(302, -80 + tw, 18, 13, 0.4), mane, { shade: msh, sd: 3 });
    leg(L.fb, sh, { shade: msh, sd: 5 }); leg(L.hb, sh, { shade: msh, sd: 5 });
    const body = blob([[-150, -10], [-120, -62], [-40, -74], [60, -66], [140, -50], [168, -6], [150, 40], [80, 52], [0, 50], [-90, 56], [-150, 36]], 0.5);
    part(ctx, body, fur, { shade: sh, sd: 12, rim: '#FFE2A8', rimA: 0.6 });
    ctx.save(); ctx.clip(body); ctx.fillStyle = pale; ctx.beginPath(); ctx.ellipse(-20, 52, 120, 26, 0, 0, 6.283); ctx.fill(); ctx.restore();
    leg(L.fn, fur, S); leg(L.hn, fur, S);
    if (!thrown) { ctx.strokeStyle = '#F6EEE2'; ctx.lineWidth = 3; for (const [px, py] of [L.fn[2], L.fb[2]]) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(px - 18, py + k * 7); ctx.quadraticCurveTo(px - 30, py + k * 8, px - 32, py + k * 9 + 6); ctx.stroke(); } }
    // head + young mane
    ctx.save(); ctx.translate(-190, -52); ctx.rotate(thrown ? 0.3 : -0.12);
    part(ctx, blob([[-30, -70], [20, -78], [58, -50], [70, 0], [60, 52], [20, 76], [-24, 70], [-48, 40], [-56, -20]], 0.55), mane, { shade: msh, sd: 8 });
    for (const [ex, ey] of [[-8, -52], [30, -50]]) part(ctx, ell(ex, ey, 13, 11), fur, { shade: sh, sd: 3 });
    part(ctx, blob([[-44, -30], [-6, -46], [26, -34], [34, 4], [22, 36], [-16, 44], [-52, 22], [-60, -4]], 0.5), fur, { shade: sh, sd: 6 });
    part(ctx, ell(-44, 10, 24, 18), pale, { lw: 2 });
    part(ctx, PP.poly([[-66, -2], [-52, -6], [-58, 6]]), '#3A2418', { lw: 1.5 });
    if (thrown) { ctx.strokeStyle = LINE; ctx.lineWidth = 2.4; for (const ex of [-30, -6]) { ctx.beginPath(); ctx.moveTo(ex - 6, -14); ctx.quadraticCurveTo(ex, -10, ex + 6, -14); ctx.stroke(); } }
    else { const m = PP.blob([[-66, 16], [-36, 18], [-28, 30], [-46, 44], [-64, 36]], 0.4); part(ctx, m, '#5A1E14', { lw: 2 }); ctx.fillStyle = '#F6EEE2'; for (const fx of [-58, -40]) { ctx.beginPath(); ctx.moveTo(fx, 18); ctx.lineTo(fx + 4, 28); ctx.lineTo(fx + 8, 18); ctx.fill(); }
      PP.eyes(ctx, -18, -16, { sp: 11, rx: 6, ry: 4, look: [-0.9, 0], squint: 0.4 }); PP.brows(ctx, -18, -24, { furrow: 1, th: 3.4, sp: 11, col: '#5A3418' }); }
    ctx.restore();
    ctx.restore();
  }

  // ======================================================================================================
  // TIMNAH: valley floor, the walled town on its low tell, terraced vineyards on the southern slope
  // ======================================================================================================
  const TR = 11.5, TY = 1.0;                                   // town wall radius around the well at (0, 0); town floor height
  const PATH = [[-7, 56], [-3, 47], [-8.5, 39], [-3, 31.5], [-6.5, 24.5], [-1.5, 18.5], [0, 12.4]]; // the ridge down to the south gate
  const VZ0 = 16.5, VZ1 = 47;                                  // the vineyard band on the slope
  const distSeg = (x, z, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], wx = x - a[0], wz = z - a[1]; const k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz)); return Math.hypot(wx - vx * k, wz - vz * k); };
  const distPath = (x, z) => { let d = 1e9; for (let i = 0; i < PATH.length - 1; i++) d = Math.min(d, distSeg(x, z, PATH[i], PATH[i + 1])); return d; };
  const PLEN = (() => { const s = [0]; for (let i = 1; i < PATH.length; i++) s.push(s[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1])); return s; })();
  const pathAt = (d) => { d = clamp(d, 0, PLEN[PLEN.length - 1]); for (let i = 1; i < PATH.length; i++) if (d <= PLEN[i]) { const k = (d - PLEN[i - 1]) / (PLEN[i] - PLEN[i - 1]); return [lerp(PATH[i - 1][0], PATH[i][0], k), lerp(PATH[i - 1][1], PATH[i][1], k)]; } return PATH[PATH.length - 1]; };
  const slopeS = (z) => 15 * FW.smooth(clamp((z - 13) / 38));
  const hRaw = (x, z) => {
    let h = slopeS(z) * (0.88 + 0.24 * FW.fbm(x * 0.04, z * 0.02, 31, 2));
    h += FW.smooth(clamp((-z - 18) / 30)) * (4 + 12 * FW.fbm(x * 0.03 + 3, z * 0.03, 5, 3));   // hills beyond the valley
    h += FW.smooth(clamp((-x - 24) / 24)) * 8 * FW.fbm(x * 0.04, z * 0.04, 9, 3);              // west
    h += FW.smooth(clamp((x - 26) / 24)) * 7 * FW.fbm(x * 0.04 + 7, z * 0.04, 13, 3);          // east
    h += (FW.fbm(x * 0.08, z * 0.08, 2, 4) - 0.5) * 1.4 + (FW.noise2(x * 0.5, z * 0.5, 4) - 0.5) * 0.14;
    return h;
  };
  const hT = (x, z) => {
    let h = hRaw(x, z);
    const kt = FW.smooth(clamp((Math.hypot(x, z) - TR - 1.2) / 5.5));
    return lerp(TY + (FW.noise2(x * 0.6, z * 0.6, 8) - 0.5) * 0.05, h, kt);
  };
  const colT = (x, z, y, ny, rnd) => {
    const steep = 1 - ny, n = FW.fbm(x * 0.09 + 11, z * 0.09, 21, 3), r = Math.hypot(x, z);
    let c;
    if (steep > 0.34) c = C(rnd < 0.5 ? '#B6A48F' : '#A8957F');
    else if (steep > 0.2) c = C(n > 0.5 ? '#C8A673' : '#B3AC66');
    else c = C(n > 0.62 ? '#C2BC6E' : n > 0.42 ? '#A9B65C' : '#94AA54');
    if (z > VZ0 - 0.5 && z < VZ1 && Math.abs(x) < 33) c.lerp(C(rnd < 0.5 ? '#AE7B50' : '#A06E48'), 0.62 * FW.smooth(clamp((33 - Math.abs(x)) / 3)));   // red vineyard soil
    if (z < VZ0 - 1.5 && z > -24 && r > TR + 3.5) {                                    // valley plots: wheat, barley, green
      const fid = Math.floor((x + 300 + z * 0.35) / 8.5) * 31 + Math.floor((z + 300) / 6.5), k = hsh(fid, 3);
      if (k < 0.38) c = C(rnd < 0.5 ? '#D3B460' : '#CAA955'); else if (k < 0.62) c.lerp(C('#9DB35A'), 0.6); else if (k < 0.72) c.lerp(C('#B89A6A'), 0.5);
    }
    if (r < TR + 0.8) c = C(rnd < 0.5 ? '#CDB88E' : '#C4AE84');
    const dp = distPath(x, z); if (dp < 1.0) c.lerp(C('#D9C8A0'), FW.smooth(clamp((1.0 - dp) / 0.45)));
    if (Math.abs(x + 18 - z * 0.05) < 0.9 && z < 2 && z > -30) c.lerp(C('#D2C29A'), 0.6);  // the road west
    c.offsetHSL((rnd - 0.5) * 0.012, (rnd - 0.5) * 0.04, (rnd - 0.5) * 0.06);
    return c;
  };

  let tim, sunT, hemiT, spotT, skyT, poolT, poolS, motesT, goldT, ring;
  let sam, samFar, lion, bride, manoah, mother; const folk = [], contactT = [], castT = [];
  // where things happen
  const P6 = [-10.5, 0, VZ0 + 1.2 + 6.5 * 1.9];                                            // S06: in the aisle between two vine rows
  const WELL = [2.3, TY, -2.6];

  function buildTimnah() {
    tim = new THREE.Scene();
    tim.fog = new THREE.Fog(C('#C3BECB'), 25, 95);
    skyT = LW.sky({ top: '#2C4A7A', mid: '#6F8DBA', hor: '#EBC7A0', low: '#C6BFCB', sunDir: [-0.7, 0.2, -0.68], sunCol: '#FFD7A0', sunAmt: 0.8 }); tim.add(skyT); SKIES.push(skyT);
    hemiT = new THREE.HemisphereLight(C('#C4D2EE'), C('#A88B66'), 1.3); tim.add(hemiT);
    sunT = new THREE.DirectionalLight(C('#FFDDB2'), 3.8); sunT.castShadow = true; sunT.shadow.mapSize.set(2048, 2048);
    sunT.shadow.bias = -0.0004; sunT.shadow.normalBias = 0.03; sunT.shadow.radius = 3; tim.add(sunT, sunT.target);
    spotT = new THREE.SpotLight(C('#FFC766'), 0, 90, 0.1, 0.6, 1.0); spotT.castShadow = false; tim.add(spotT, spotT.target);
    P6[1] = hT(P6[0], P6[2]);

    tim.add(LW.terrain({ size: 190, seg: 128, cx: 0, cz: -18, hFn: hT, colFn: colT, seed: 5 }));
    const mg = merger(), rng = FW.rng(1405);

    // ---- the town wall: mud brick on a stone footing, square towers, the gate to the south ----
    const NSEG = 30, gateA = 0.2;
    for (let i = 0; i < NSEG; i++) {
      const a = ((i + 0.5) / NSEG) * Math.PI * 2; if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < gateA) continue;
      const len = (2 * Math.PI * TR) / NSEG * 1.04, x = Math.sin(a) * TR, z = Math.cos(a) * TR;
      const seg = new THREE.Group(); seg.position.set(x, TY, z); seg.rotation.y = a;
      seg.add(mesh(LW.jitter(new THREE.BoxGeometry(len, 0.7, 1.05), 0.05, rng), pick(rng, ['#A99A86', '#9E8E78']), 0, 0.35, 0));
      seg.add(mesh(LW.jitter(new THREE.BoxGeometry(len, 1.9, 0.85, 2, 1, 1), 0.04, rng), pick(rng, ['#C29A6A', '#B98F60', '#C7A272']), 0, 1.6, 0));
      if (i % 2 === 0) seg.add(mesh(new THREE.BoxGeometry(len * 0.4, 0.3, 0.85), '#C8A676', 0, 2.7, 0));
      mg.obj(seg);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8; const x = Math.sin(a) * TR, z = Math.cos(a) * TR;
      const tw = new THREE.Group(); tw.position.set(x, TY, z); tw.rotation.y = a;
      tw.add(mesh(LW.jitter(new THREE.BoxGeometry(2.0, 3.3, 2.0), 0.05, rng), '#BC9466', 0, 1.65, 0));
      for (const [px, pz] of [[-0.75, 0.75], [0.75, 0.75], [-0.75, -0.75], [0.75, -0.75]]) tw.add(mesh(new THREE.BoxGeometry(0.4, 0.36, 0.4), '#C7A272', px, 3.48, pz));
      mg.obj(tw);
    }
    for (const s of [-1, 1]) { // gate towers + the gate passage
      const a = s * (gateA + 0.03), x = Math.sin(a) * TR, z = Math.cos(a) * TR;
      const tw = new THREE.Group(); tw.position.set(x, TY, z); tw.rotation.y = a;
      tw.add(mesh(LW.jitter(new THREE.BoxGeometry(2.2, 3.8, 2.4), 0.05, rng), '#B88E60', 0, 1.9, 0));
      for (const [px, pz] of [[-0.8, 0.9], [0.8, 0.9], [-0.8, -0.9], [0.8, -0.9]]) tw.add(mesh(new THREE.BoxGeometry(0.42, 0.4, 0.42), '#C7A272', px, 4.0, pz));
      mg.obj(tw);
    }
    mg.obj(mesh(new THREE.BoxGeometry(5.0, 0.5, 1.3), '#7A5A3E', 0, TY + 3.0, TR));            // the gate lintel beam
    mg.obj(mesh(new THREE.BoxGeometry(1.6, 2.6, 0.1), '#4A3424', 1.5, TY + 1.3, TR + 0.35));     // an open gate leaf

    // ---- houses around the square and the lanes ----
    const houses = [];
    const lane = (x, z) => (Math.abs(x) < 3.0 && z > 3.2) || (x < -4 && Math.abs(z + 0.5) < 1.5) || (x > 3.5 && Math.abs(z + x * 0.5) < 1.4);
    for (const [r, n, ph] of [[7.2, 12, 0.13], [9.8, 17, 0.05]]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ph + (rng() - 0.5) * 0.08, rr = r + (rng() - 0.5) * 0.5, x = Math.sin(a) * rr, z = Math.cos(a) * rr;
        if (lane(x, z)) continue;
        const w = 2.4 + rng() * 1.5, d = 2.2 + rng() * 1.2, h = 2.1 + rng() * 0.9;
        const hs = house(rng, w, d, h); hs.position.set(x, TY, z); hs.rotation.y = Math.atan2(-x, -z) + (rng() - 0.5) * 0.25; mg.obj(hs); houses.push([x, z]);
      }
    }
    // the well in the square: stone ring, dark water, a beam frame with a rope; a trough and jars
    { const wl = new THREE.Group(); wl.position.set(...WELL);
      wl.add(mesh(LW.jitter(new THREE.CylinderGeometry(0.8, 0.88, 0.72, 10, 1), 0.05, rng), '#A99A86', 0, 0.36, 0));
      for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; const st = mesh(LW.jitter(new THREE.BoxGeometry(0.42, 0.14, 0.26), 0.04, rng), pick(rng, ['#B6A48F', '#9E8E78', '#C2B29A']), Math.cos(a) * 0.74, 0.76, Math.sin(a) * 0.74); st.rotation.y = -a + Math.PI / 2; wl.add(st); }
      wl.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.04, 10), '#2A2420', 0, 0.74, 0));
      for (const s of [-1, 1]) wl.add(mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), '#6B4A33', s * 0.95, 0.8, 0));
      const bm = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 5), '#7A5A3E', 0, 1.62, 0); bm.rotation.z = Math.PI / 2; wl.add(bm);
      wl.add(mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 3), '#CDB27E', 0.1, 1.15, 0));
      wl.add(mesh(new THREE.BoxGeometry(1.3, 0.34, 0.5), '#9E8E78', -1.45, 0.17, -0.55));
      for (const [jx, jz, s] of [[1.25, -0.55, 0.62], [1.55, -0.2, 0.5], [-1.2, 0.75, 0.55], [1.2, 0.95, 0.46]]) wl.add(mesh(jarGeo(s), jx > 0 ? '#B8693F' : '#C47A4A', jx, 0, jz));
      mg.obj(wl); }
    // a striped awning and baskets on the far side of the square; a bench by a door
    { const aw = new THREE.Group(); aw.position.set(-1.6, TY, -5.6);
      for (const [px, pz] of [[-1.3, 1.1], [1.3, 1.1]]) aw.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 5), '#6B4A33', px, 1.05, pz));
      for (let i = 0; i < 6; i++) { const st = mesh(new THREE.BoxGeometry(2.8 / 6, 0.04, 1.4), i % 2 ? '#E8D9B8' : '#B24A32', -1.4 + (i + 0.5) * 2.8 / 6, 2.12, 0.45); st.rotation.x = 0.22; aw.add(st); }
      for (const [bx, bz, r] of [[-0.8, 0.4, 0.26], [-0.2, 0.6, 0.22], [0.5, 0.3, 0.28]]) { aw.add(mesh(new THREE.CylinderGeometry(r, r * 0.8, 0.3, 8), '#B8925A', bx, 0.15, bz)); aw.add(mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.05, 8), pick(rng, ['#C9A040', '#7A9A3E', '#A8432C', '#E0C070']), bx, 0.31, bz)); }
      mg.obj(aw); }
    { const bn = mesh(LW.jitter(new THREE.BoxGeometry(1.4, 0.4, 0.45), 0.03, rng), '#9E8E78', 3.6, TY + 0.2, -4.6); bn.rotation.y = -0.5; mg.obj(bn); }
    // trees in town, a fig by the square
    for (const [x, z, s] of [[-3.6, -2.6, 1.25], [4.6, -0.6, 1.0]]) { const t0 = LW.olive(FW.rng(Math.round(x * 31 + z * 7 + 99)), s); t0.position.set(x, TY, z); mg.obj(t0); }
    for (const [x, z, s] of [[4.4, 1.8, 1.0], [-2.2, -7.6, 1.1], [7.6, -5.4, 0.95], [-5.0, 4.6, 0.9]]) { const p = palm(FW.rng(Math.round(x * 13 + z * 5 + 7)), s); p.position.set(x, TY, z); mg.obj(p); }
    for (let i = 0; i < 18; i++) { const a = rng() * 6.283, r = 3.6 + rng() * 1.6; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (lane(x, z) || (x > -2 && x < 3.4 && z > -3.6 && z < 4) || Math.hypot(x - WELL[0], z - WELL[2]) < 1.6) continue; mg.obj(mesh(jarGeo(0.35 + rng() * 0.3), pick(rng, ['#B8693F', '#C47A4A', '#A85E38']), x, TY, z)); }

    // ---- vineyards on the southern slope: rows of vines between low stone terrace walls; a watchtower booth ----
    const tower = [-21, 35.5];
    for (let row = 0; row < 16; row++) {
      const z0 = VZ0 + 1.2 + row * 1.9;
      if (row % 2 === 0) for (let x = -31; x < 31; x += 0.75 + rng() * 0.25) { const z = z0 - 0.95 + (rng() - 0.5) * 0.1; if (distPath(x, z) < 1.3 || Math.hypot(x - tower[0], z - tower[1]) < 2.4) continue; const st = mesh(LW.jitter(new THREE.BoxGeometry(0.7, 0.34, 0.42), 0.07, rng), pick(rng, ['#A99A86', '#9E8E78', '#B6A48F', '#8F7E6A']), x, hT(x, z) + 0.12, z); st.rotation.y = (rng() - 0.5) * 0.3; mg.obj(st); }
      for (let x = -30; x < 30; x += 0.82 + rng() * 0.2) { const z = z0 + (rng() - 0.5) * 0.18; if (distPath(x, z) < 1.25 || Math.hypot(x - tower[0], z - tower[1]) < 2.4 || (Math.abs(z - P6[2]) < 1.2 && Math.abs(x - P6[0]) < 0.9)) continue; const v = vine(rng, 0.95 + rng() * 0.25); v.position.set(x, hT(x, z) - 0.03, z); mg.obj(v); }
    }
    { const tw = new THREE.Group(); tw.position.set(tower[0], hT(...tower) - 0.1, tower[1]);
      tw.add(mesh(LW.jitter(new THREE.CylinderGeometry(1.15, 1.3, 2.4, 8, 2), 0.08, rng), '#A99A86', 0, 1.2, 0));
      for (let i = 0; i < 4; i++) tw.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 4), '#6B4A33', Math.cos(i * 1.57 + 0.78) * 0.8, 3.05, Math.sin(i * 1.57 + 0.78) * 0.8));
      tw.add(mesh(LW.jitter(new THREE.ConeGeometry(1.35, 0.9, 6), 0.06, rng), '#9A8452', 0, 4.1, 0));
      mg.obj(tw); }

    // ---- olives, scrub, rocks, grass over the rest of the land ----
    const freeT = (x, z) => Math.hypot(x, z) > TR + 2.6 && distPath(x, z) > 1.6 && !(z > VZ0 - 0.5 && z < VZ1 && Math.abs(x) < 32);
    for (let i = 0; i < 150; i++) { const x = -70 + rng() * 140, z = -75 + rng() * 140; if (!freeT(x, z)) continue; const tr = LW.olive(rng, 0.9 + rng() * 0.7); tr.position.set(x, hT(x, z) - 0.05, z); mg.obj(tr); }
    for (let i = 0; i < 26; i++) { const a = rng() * 6.283, r = TR + 3 + rng() * 9; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (!freeT(x, z) || z > VZ0 - 2) continue; const p = palm(rng, 0.9 + rng() * 0.3); p.position.set(x, hT(x, z), z); mg.obj(p); }
    for (let i = 0; i < 160; i++) { const x = -45 + rng() * 90, z = -50 + rng() * 110; if (!freeT(x, z)) continue; const b = LW.bush(rng, 0.8 + rng() * 0.9); b.position.set(x, hT(x, z), z); mg.obj(b); }
    for (let i = 0; i < 90; i++) { const x = -45 + rng() * 90, z = -50 + rng() * 110; if (!freeT(x, z)) continue; const k = LW.rock(rng, 0.3 + rng() * 1.0); k.position.x = x; k.position.z = z; k.position.y += hT(x, z) - 0.05; mg.obj(k); }
    // close dressing around the S06 spot and along the path (grass, small stones)
    for (let i = 0; i < 90; i++) { const x = P6[0] - 9 + rng() * 18, z = P6[2] - 0.6 + rng() * 1.2; if (distPath(x, z) < 0.55 || Math.abs(x - P6[0]) < 0.5) continue; const g = LW.grassTuft(rng, 0.5 + rng() * 0.45); g.position.set(x, hT(x, z), z); mg.obj(g); }
    for (let i = 0; i < 40; i++) { const d = rng() * PLEN[PLEN.length - 1], [px, pz] = pathAt(d), side = rng() < 0.5 ? -1 : 1; const x = px + side * (0.9 + rng() * 0.5), z = pz + (rng() - 0.5) * 0.5; const k = LW.rock(rng, 0.18 + rng() * 0.25); k.position.set(x, hT(x, z) + 0.02, z); mg.obj(k); }
    for (let i = 0; i < 60; i++) { const a = rng() * 6.283, r = 3.5 + rng() * 4.5; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (lane(x, z)) continue; const g = LW.grassTuft(rng, 0.35 + rng() * 0.3); g.position.set(x, TY, z); mg.obj(g); }
    tim.add(mg.mesh());

    // ---- God's light pieces ----
    poolT = LW.pool(16, '#FFC86E'); tim.add(poolT);           // the gold settling over the town (S18)
    poolS = LW.pool(1.2, '#FFC86E'); tim.add(poolS);          // on Samson (S06)
    motesT = LW.particles(90, '#FFE3B0', 0.05); tim.add(motesT);
    goldT = LW.particles(70, '#FFD27A', 0.07); tim.add(goldT);
    ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.86, 48), new THREE.MeshBasicMaterial({ color: C('#F4EAD5'), transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false, fog: false }));
    ring.rotation.x = -Math.PI / 2; ring.renderOrder = 3; ring.visible = false; tim.add(ring);

    // ---- the cast ----
    const HUM = { cw: 640, ch: 840, footPx: 30, scale: 1.25 };
    sam = castBB('samson', samFB, { cw: 1300, ch: 1640, footPx: 60, scale: 2.5 });
    samFar = castBB('samson', samFB, { cw: 1300, ch: 1640, footPx: 60, scale: 2.5 }, 0, { cw: 600, ch: 688, footPx: 28, scale: 1.0 });
    lion = castBB('lion', lionFB, { cw: 1150, ch: 860, footPx: 430, scale: 1.3 }, 240);
    bride = castBB('bride', womanFB({ robe: '#C9B48E', veil: '#B8432C', band: '#B24A32', sash: '#E8D5A8', skin: '#C99062', hair: '#2C1B12' }), HUM);
    manoah = castBB('manoah', judeanFB({ robe: '#7A6248', cloth: '#E2D6C0', stripe: '#5E4430', beard: '#B4ABA0', skin: '#B07A50' }), HUM);
    mother = castBB('mother', womanFB({ robe: '#6E5A44', veil: '#D8CBB0', band: '#5E4430', sash: '#9A7A52', skin: '#B57B52' }), HUM);
    [sam, samFar, lion, bride, manoah, mother].forEach((b) => { tim.add(b, b.userData.caster); castT.push(b); });
    [[sam, 0.5], [samFar, 0.5], [bride, 0.42], [manoah, 0.42], [mother, 0.42]].forEach(([b, r]) => contactShadow(tim, contactT, b, r));
    contactShadow(tim, contactT, lion, 0.55);
    // townsfolk at the edges of the square (PP2.person when published)
    if (P2() && typeof P2().person === 'function') {
      for (const [v, x, z, pose] of [[2, -1.9, -4.5, 'stand'], [7, 3.9, -5.3, 'stand'], [5, -4.4, -3.2, 'stand']]) { const p = castBB('person', null, HUM); p.position.set(x, TY, z); p.userData.st = { v, pose, look: [-0.4, 0] }; tim.add(p, p.userData.caster); folk.push(p); castT.push(p); contactShadow(tim, contactT, p, 0.38); }
    }
  }
  function showT(list) { castT.forEach((b) => { const on = list.includes(b); b.visible = on; b.userData.caster.visible = on; if (b.userData.contact) b.userData.contact.visible = on; }); }
  function samPose(st) { const s = Object.assign({ hair: 1, bonds: 'none', blind: false, gold: 0 }, st); sam.userData.update(JSON.stringify(s), s); }
  // per-shot light rig; the sun sits at the upper left of the frame (call after the camera is set): o.sunAt = [ahead, left, up]
  function lightTimnah(o) {
    setSky(skyT, o.sky); tim.fog.color.set(o.fog[0]); tim.fog.near = o.fog[1]; tim.fog.far = o.fog[2];
    sunT.color.set(o.sun[0]); sunT.intensity = o.sun[1]; hemiT.intensity = o.hemi;
    const sp = fromCam(o.tgt, ...o.sunAt); aimSun(sunT, o.tgt, [sp[0] - o.tgt[0], sp[1] - o.tgt[1], sp[2] - o.tgt[2]], o.ext, o.far || 80);
    const { f, r } = camBasis(); skyT.material.uniforms.sunDir.value.set(f.x * 0.6 - r.x * 0.7, o.sky.sunDir[1], f.z * 0.6 - r.z * 0.7).normalize();
  }

  // ---------------- S06: the lion in the vineyards ----------------
  const noGold = (i, v) => { v.set(0, -99, 0); return { alpha: 0 }; };
  function shotLion(t, shot) {
    const T0 = shot.t0, D = shot.dur, ta = shot.beats.again ?? T0 + D * 0.6;
    const tc = ta - 0.12, tThrow = ta + 0.02;                          // the catch lands just before "again"; gold + throw on it
    showT([sam, lion]); ring.visible = false;
    const [sx, , sz] = P6, sy = hT(sx, sz);
    // camera: medium three-quarter down the aisle between the vine rows (looking west); a fast push in from the cut
    const k0 = K([sx + 8.6, sy + 2.25, sz + 0.75], [sx - 0.2, sy + 1.32, sz - 0.5], 34), k1 = K([sx + 7.1, sy + 2.05, sz + 0.62], [sx - 0.2, sy + 1.34, sz - 0.45], 34);
    const k = FW.camLerpK(k0, k1, ease.out(clamp((t - T0) / (D * 0.95))));
    const focus = camSet(k, 0.07, [sx, sy + 1.3, sz]);
    lightTimnah({ sky: { top: '#2C4A7A', mid: '#6F8DBA', hor: '#EBC7A0', low: '#C6BFCB', sunDir: [0, 0.22, 0], sunCol: '#FFD7A0', sunAmt: 0.8 }, fog: ['#C3BECB', 22, 90],
      sun: ['#FFE0B8', 3.7], hemi: 1.32, tgt: [sx - 2, sy, sz], sunAt: [7, 12, 9.5], ext: 12 });
    sam.position.set(sx, sy, sz);
    // the lion: in the air from over the vines on the right (downhill), arcing onto him; caught overhead; flung away up-right
    const R = fromCam([0, 0, 0], 0, -1, 0), Fw = fromCam([0, 0, 0], 1, 0, 0);       // screen-right and forward unit steps (horizontal)
    const at = (rt, up, fw) => [sx + R[0] * rt + Fw[0] * fw, sy + up, sz + R[2] * rt + Fw[2] * fw];
    const A = at(2.7, 1.0, 0.3), Bc = at(0.04, 2.16, 0.3);
    let L, tilt, pose;
    if (t < tc) { const u = clamp((t - T0 + 0.18) / (tc - T0 + 0.18)), e = 1 - Math.pow(1 - u, 1.6); L = [0, 1, 2].map((i) => lerp(A[i], Bc[i], e)); L[1] += Math.sin(Math.PI * e) * 0.35; tilt = lerp(-0.2, 0.05, e); pose = 'leap'; }
    else if (t < tThrow) { const d = t - tc; L = Bc.slice(); L[1] -= 0.08 * Math.sin(Math.min(1, d / 0.12) * Math.PI); tilt = 0.05; pose = 'leap'; }
    else { const d = t - tThrow; L = at(0.02 + 7 * d + 3 * d * d, 2.25 + 4.4 * d - 3 * d * d, 0.06 + 1.2 * d); tilt = -d * 6.5; pose = 'thrown'; }
    lion.position.set(...L); lion.userData.tilt = tilt; lion.scale.setScalar(lion.userData.real ? 0.8 : 1);
    lion.userData.update(pose + q(t, 15), { pose, t: q(t, 15), roar: 1 });
    const caught = t >= tc;
    const gold = prog(t, ta - 0.3, ta, ease.in), surge = t >= ta ? Math.exp(-(t - ta) * 3) : 0;
    // he braces, then his arms come up to meet it as it lands on him
    const bk = q(prog(t, tc - 0.32, tc + 0.04, ease.inOut), 16);
    samPose(bk > 0 ? { pose: 'burst', k: bk, look: caught ? [0.15, -0.6] : [0.7, -0.5], t: q(t, 15), gold: q(Math.max(gold, caught ? 0.4 : 0), 20) } : { pose: 'strain', strain: 0.7, look: [0.9, -0.3], t: q(t, 15), gold: q(gold, 20) });
    sam.scale.setScalar(sam.userData.real ? 1 : pop(t, tc));
    sam.material.color.setRGB(1 + gold * 0.1 + surge * 0.1, 0.97 + gold * 0.05, 0.92);
    // God's light from the upper left onto him
    spotT.position.set(...fromCam([sx, sy, sz], 3.5, 5, 13)); spotT.target.position.set(sx, sy + 0.8, sz); spotT.target.updateMatrixWorld(); spotT.angle = 0.11; spotT.distance = 40; spotT.penumbra = 0.6;
    spotT.intensity = gold * 16 + surge * 20; sunT.intensity *= 1 - 0.2 * gold;
    poolS.position.set(sx, sy + 0.04, sz); poolS.material.opacity = gold * 0.25 + surge * 0.2; poolT.material.opacity = 0;
    const SP = spotT.position;
    motesT.userData.update((i, v) => { const kq = (hsh(i, 7) + t * 0.05 * (0.5 + hsh(i, 8))) % 1, al = 0.15 + hsh(i, 9) * 0.85; v.set(lerp(SP.x, sx, al) + Math.sin(t * 0.4 + i) * 0.4 * al, lerp(SP.y, sy + 0.3, al) + (kq - 0.5) * 0.6, lerp(SP.z, sz, al) + Math.cos(t * 0.3 + i * 2) * 0.4 * al); return { alpha: gold * (0.4 + 0.6 * hsh(i, 10)) * Math.sin(Math.PI * kq), size: 0.7 + hsh(i, 11) * 0.8 }; });
    goldT.userData.update(noGold);
    contactT.forEach(([m, o]) => m.position.set(o.position.x, hT(o.position.x, o.position.z) + 0.03, o.position.z));
    { const lc = lion.userData.contact; const hgt = L[1] - hT(L[0], L[2]); lc.material.opacity = 0.7 * clamp(1 - hgt / 3); lc.scale.setScalar(1 + hgt * 0.25); }
    return { scene: tim, sun: sunT, bill: [sam, lion], focus, aperture: 4.6, maxR: 7, fgScale: 1.5, exposure: 1.1 + surge * 0.05, sat: 1.1, bloom: 0.15 + surge * 0.06,
      rays: { amt: gold * 0.8 + surge * 0.45, target: [sx, sy + 1.4, sz] }, flash: surge > 0.01 ? Math.pow(Math.max(0, 1 - (t - ta) / 0.16), 2) * 0.9 : 0,
      tags: [{ text: 'TIMNAH', sub: 'JUDGES 14:6', p: [sx, sy + 0.9, sz], k: prog(t, T0 + 0.1, T0 + 0.5, (x) => x), dy: -40, dx: -200 }] };
  }

  // ---------------- S09: the well at Timnah ----------------
  const SAM9 = [-0.65, TY, 3.4], MAN9 = [0.05, TY, 1.5], MOM9 = [0.62, TY, 0.95], BRIDE9 = [1.6, TY, -1.75];
  function shotBride(t, shot) {
    const T0 = shot.t0, b = shot.beats, tDem = b.demanded ?? T0 + 0.5, tWife = b.wife ?? T0 + 2, tObj = b.objection ?? T0 + 3.3, tEyes = b.eyes ?? T0 + 4.4;
    showT([sam, bride, manoah, mother, ...folk]); ring.visible = false;
    // camera: a three-quarter two-shot from the south lane, held with a slight drift; on "eyes" a slow push to Samson's face
    const A = K([-0.8, TY + 3.2, 10.7], [0.25, TY + 1.1, 0], 38), A2 = K([-0.78, TY + 3.17, 10.55], [0.25, TY + 1.1, 0], 38);
    const Bk = K([-1.1, TY + 2.45, 8.6], [0.05, TY + 1.25, 1.4], 36);
    const kh = FW.camLerpK(A, A2, ease.inOut(clamp((t - T0) / Math.max(0.1, tEyes - T0))));
    const pk = prog(t, tEyes, shot.t1 - 0.05, ease.inOut);
    const k = t < tEyes ? kh : FW.camLerpK(A2, Bk, pk);
    const focus = camSet(k, lerp(0.01, 0.03, pk), [lerp(SAM9[0] + 0.6, SAM9[0], pk), TY + 1.5, lerp(SAM9[2] - 1.5, SAM9[2], pk)]);
    lightTimnah({ sky: { top: '#2F4C7E', mid: '#7B92BE', hor: '#F4C796', low: '#D4C2B6', sunDir: [0, 0.16, 0], sunCol: '#FFCB8A', sunAmt: 0.6 }, fog: ['#D6C6BA', 20, 85],
      sun: ['#FFD6A6', 3.9], hemi: 1.3, tgt: [0, TY, 0], sunAt: [-3, 12, 9.5], ext: 13 });
    spotT.intensity = 0; poolT.material.opacity = 0; poolS.material.opacity = 0;
    motesT.userData.update(noGold); goldT.userData.update(noGold);
    sam.position.set(...SAM9); manoah.position.set(...MAN9); mother.position.set(...MOM9); bride.position.set(...BRIDE9);
    sam.material.color.setRGB(1, 0.97, 0.93);
    const pointing = t >= tDem - 0.05;
    samPose({ pose: pointing ? 'point' : 'stand', look: [0.85, -0.15], t: q(t, 8), gold: 0 });
    sam.scale.setScalar(pop(t, tDem - 0.05));
    const obj = t >= tObj - 0.05, sh = obj ? q(Math.sin((t - tObj) * 9) * Math.exp(-(t - tObj) * 0.6), 6) : 0;
    manoah.userData.update(obj ? 'o' + sh : 's', { pose: obj ? 'object' : 'worried', shake: sh, look: [-0.8, 0], t: 0 });
    mother.userData.update(obj ? 'o' + -sh : 's', { pose: obj ? 'object' : 'worried', shake: -sh, look: [-0.8, -0.1], t: 0 });
    manoah.scale.setScalar(pop(t, tObj - 0.05)); mother.scale.setScalar(pop(t, tObj + 0.03));
    const turned = t >= tWife - 0.05;
    bride.userData.update(turned ? 'j1' : 'j0', { pose: 'jar', look: turned ? [-0.9, -0.1] : [0.3, 0.2], t: 0 });
    folk.forEach((p) => p.userData.update('f', p.userData.st));
    contactT.forEach(([m, o]) => m.position.set(o.position.x, TY + 0.03, o.position.z));
    return { scene: tim, sun: sunT, bill: [sam, bride, manoah, mother, ...folk], focus, aperture: lerp(4.2, 5.0, pk), maxR: 7, fgScale: 1.5, exposure: 1.1, sat: 1.1, bloom: 0.15 };
  }

  // ---------------- S18: Timnah from above; gold settles over the town ----------------
  function shotWide(t, shot) {
    const T0 = shot.t0, D = shot.dur, tL = shot.beats.lord ?? T0 + D * 0.48, tS = shot.beats.seeking ?? T0 + D * 0.6;
    showT([samFar]); const sam = samFar;
    const gold = prog(t, tL - 0.35, tL + 1.8, ease.inOut), more = prog(t, tS - 0.1, tS + 1.6, ease.inOut);
    // camera: high over the south-east slope looking across the valley at the town; a slow drift
    const A = K([18, 46, 88], [-3, 0, 5], 40), B = K([14.5, 45.5, 89.5], [-3.3, 0, 5.4], 40);
    const k = FW.camLerpK(A, B, ease.inOut(clamp((t - T0) / D)));
    const focus = camSet(k, 0.15, [0, TY, 4]);
    lightTimnah({ sky: { top: '#22355F', mid: '#5D6E9E', hor: '#F2B783', low: '#C9B3AE', sunDir: [0, 0.12, 0], sunCol: '#FFC98A', sunAmt: 0.9 }, fog: ['#CDB9AE', 70, 320],
      sun: ['#FFD7A8', 3.5 * (1 - 0.3 * gold)], hemi: 1.25 * (1 - 0.2 * gold), tgt: [0, 2, 6], sunAt: [20, 32, 22], ext: 36, far: 130 });
    // Samson walks down the last bend of the path toward the gate (outside the gold)
    const d = PLEN[4] - 1.2 + (t - T0) * 0.7, [x, z] = pathAt(d);
    const ph = (t - T0) * 7.2;
    sam.position.set(x, hT(x, z) + Math.abs(Math.sin(ph)) * 0.03, z);
    { const st = { pose: 'walk', phase: q(ph % 6.2832, 12), look: [0.2, 0.2], t: q(t, 6), gold: 0, hair: 1, bonds: 'none' }; samFar.userData.update(JSON.stringify(st), st); }
    sam.material.color.setRGB(1.05, 1.0, 0.95); sam.scale.setScalar(1.6);  // larger so he reads at this distance (a billboard cheat)
    // the cream Lintel ring marks him, drawn in as the shot opens; gone before the gold comes
    const rk = prog(t, T0 + 0.2, T0 + 0.9, ease.inOut), rf = 1 - prog(t, tL - 0.8, tL - 0.2);
    ring.visible = rf > 0.01; ring.position.set(x, hT(x, z) + 0.06, z); ring.scale.setScalar(1.6);
    ring.geometry.dispose(); ring.geometry = new THREE.RingGeometry(0.7, 0.86, 48, 1, Math.PI * 0.5, Math.max(0.01, rk * Math.PI * 2)); ring.material.opacity = 0.95 * rf;
    spotT.position.set(...fromCam([0, TY, 0], 8, 26, 46)); spotT.target.position.set(0, TY, 0); spotT.target.updateMatrixWorld(); spotT.angle = 0.27; spotT.distance = 140; spotT.penumbra = 0.8;
    spotT.intensity = gold * 130 + more * 50;
    poolT.position.set(0, TY + 3.8, 0); poolT.material.opacity = gold * 0.18 + more * 0.08; poolS.material.opacity = 0;
    goldT.userData.update((i, v) => { const kq = (hsh(i, 3) + t * 0.035 * (0.5 + hsh(i, 4))) % 1, a = hsh(i, 5) * 6.283, r = Math.sqrt(hsh(i, 6)) * TR * 1.05; v.set(Math.cos(a) * r, TY + 1 + (1 - kq) * 9, Math.sin(a) * r); return { alpha: gold * (0.5 + 0.5 * hsh(i, 7)) * Math.sin(Math.PI * kq), size: 3.2 + hsh(i, 8) * 3 }; });
    motesT.userData.update(noGold);
    contactT.forEach(([m, o]) => m.position.set(o.position.x, hT(o.position.x, o.position.z) + 0.03, o.position.z));
    return { scene: tim, sun: sunT, bill: [samFar], focus, aperture: 7, maxR: 6, fgScale: 1.3, exposure: 1.12 + gold * 0.05, sat: 1.12, bloom: 0.15 + gold * 0.06,
      rays: { amt: gold * 0.7 + more * 0.2, target: [0, TY + 1, 0] },
      // the gold settles over the whole town: a soft warm glow resting on it (not on him)
      post(ctx, tt, P) {
        const a = gold * 0.42 + more * 0.12; if (a <= 0.01) return;
        const c = P([0, TY + 1.5, 0]), e = P([TR + 2, TY, 0]), rx = Math.abs(e[0] - c[0]) * 1.25, ry = rx * 0.55;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(c[0], c[1]); ctx.scale(1, ry / rx);
        const g = ctx.createRadialGradient(0, 0, rx * 0.1, 0, 0, rx); g.addColorStop(0, `rgba(255,206,120,${(0.5 * a).toFixed(3)})`); g.addColorStop(0.55, `rgba(255,190,100,${(0.22 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(255,190,100,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore();
      } };
  }

  // ======================================================================================================
  // ASHKELON: the gate by the sea; a row of thirty men topples away; their garments drop
  // ======================================================================================================
  let ash, sunA, hemiA, spotA, poolA, motesA, dustA, samA; const men = [], cloths = [], contactA = [];
  const NMEN = 30;
  // the action is laid out in a design frame turned 37 degrees, so the camera looks along -z at the city and the sea
  const ROTA = (x, z) => [0.8 * x + 0.6 * z, -0.6 * x + 0.8 * z];
  const KA = (p, l, f) => { const a = ROTA(p[0], p[2]), b = ROTA(l[0], l[2]); return K([a[0], p[1], a[1]], [b[0], l[1], b[1]], f); };
  const ROW = (i) => { const k = i / (NMEN - 1); return ROTA(lerp(-0.2, 11.5, k) + Math.sin(k * 3.1) * 0.5, lerp(-0.3, -10.4, k)); };
  const SAMA = (() => { const r = ROTA(-2.6, 1.4); return [r[0], 0, r[1]]; })();
  const FLATA = ROTA(5.0, -4.5);
  const hA = (x, z) => {
    let h = (FW.fbm(x * 0.06, z * 0.06, 41, 3) - 0.5) * 0.9 + (FW.noise2(x * 0.5, z * 0.5, 4) - 0.5) * 0.12;
    h += FW.smooth(clamp((-z - 22) / 7)) * 1.4;                                // the city's low rise
    h -= FW.smooth(clamp((-z - 52) / 8)) * 4.2;                                // down to the beach
    h += FW.smooth(clamp((x + 26) / -20)) * 6 * FW.fbm(x * 0.05, z * 0.05, 7, 2); // dunes and hills to the left
    const kr = FW.smooth(clamp((Math.hypot(x - FLATA[0], z - FLATA[1]) - 11) / 6)); h = lerp(h * 0.25, h, kr);   // the open ground before the gate
    return h;
  };
  const colA = (x, z, y, ny, rnd) => {
    const n = FW.fbm(x * 0.1 + 5, z * 0.1, 17, 3), steep = 1 - ny;
    let c = C(n > 0.6 ? '#D9C79C' : n > 0.42 ? '#CFBA8C' : '#C4AE80');
    if (n < 0.38) c.lerp(C('#B3AE6A'), 0.5);
    if (steep > 0.3) c = C(rnd < 0.5 ? '#C2AA80' : '#B49C74');
    if (y < -1.2) c = C(rnd < 0.5 ? '#E6D7B0' : '#DDCBA2');
    if (Math.abs(x - 3.2) < 1.6 && z < -15 && z > -26) c.lerp(C('#E2D2AA'), 0.6);          // the road into the gate
    c.offsetHSL((rnd - 0.5) * 0.01, (rnd - 0.5) * 0.04, (rnd - 0.5) * 0.06);
    return c;
  };
  function clothTex(i) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160; const x = c.getContext('2d');
    const base = ['#EFE4CC', '#E8D9B8', '#F2E8D4'][i % 3], band = ['#B24A32', '#3F5E86', '#A8432C'][i % 3], band2 = ['#E0B860', '#E4D3B0', '#2F4060'][i % 3];
    x.fillStyle = base; x.fillRect(0, 0, 128, 160); x.fillStyle = band; x.fillRect(0, 18, 128, 16); x.fillRect(0, 126, 128, 16); x.fillStyle = band2; x.fillRect(0, 36, 128, 5); x.fillRect(0, 119, 128, 5);
    x.fillStyle = 'rgba(80,50,30,0.18)'; for (let k = 0; k < 6; k++) x.fillRect(10 + k * 21, 0, 3, 160);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
  }
  function buildAsh() {
    ash = new THREE.Scene();
    ash.fog = new THREE.Fog(C('#CBC6CF'), 26, 110);
    { const sk = LW.sky({ top: '#2E4C7C', mid: '#7493C0', hor: '#F0D2AE', low: '#C9C6D2', sunDir: [-0.7, 0.22, -0.66], sunCol: '#FFD9A0', sunAmt: 0.8 }); ash.add(sk); SKIES.push(sk); }
    hemiA = new THREE.HemisphereLight(C('#C8D6F0'), C('#AE9068'), 1.32); ash.add(hemiA);
    sunA = new THREE.DirectionalLight(C('#FFE0B8'), 3.7); sunA.castShadow = true; sunA.shadow.mapSize.set(2048, 2048); sunA.shadow.bias = -0.0004; sunA.shadow.normalBias = 0.03; sunA.shadow.radius = 3; ash.add(sunA, sunA.target);
    aimSun(sunA, [1, 0, -8], [-11, 10, 7], 20, 70);
    spotA = new THREE.SpotLight(C('#FFC766'), 0, 40, 0.1, 0.55, 1.1); spotA.position.set(SAMA[0] - 5, 13, SAMA[2] - 3.5); spotA.target.position.set(SAMA[0], 0.8, SAMA[2]); ash.add(spotA, spotA.target);
    ash.add(LW.terrain({ size: 150, seg: 96, cx: 4, cz: -30, hFn: hA, colFn: colA, seed: 9 }));
    // the sea: a faceted plane to the horizon
    { const g0 = new THREE.PlaneGeometry(420, 260, 60, 30); g0.rotateX(-Math.PI / 2); g0.translate(0, -1.6, -170); const p = g0.attributes.position; const r = FW.rng(5);
      for (let i = 0; i < p.count; i++) { p.setY(i, p.getY(i) + (r() - 0.5) * 0.35); p.setX(i, p.getX(i) + (r() - 0.5) * 2); }
      const g = g0.toNonIndexed(); g.computeVertexNormals(); const cl = new Float32Array(g.attributes.position.count * 3); const cs = ['#4F7FA6', '#5A8AB0', '#477698', '#6A98B8'];
      for (let i = 0; i < cl.length / 9; i++) { const c = C(cs[Math.floor(r() * 4)]); for (let k = 0; k < 3; k++) { cl[i * 9 + k * 3] = c.r; cl[i * 9 + k * 3 + 1] = c.g; cl[i * 9 + k * 3 + 2] = c.b; } }
      g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); const sea = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0.05 })); sea.receiveShadow = true; ash.add(sea); }
    const mg = merger(), rng = FW.rng(1914);
    // the city wall with towers and the gate, houses rising behind, palms, red Philistine banners
    const WZ = -24, GX = 3.2;
    for (let x = -34; x < 40; x += 2.6) {
      if (Math.abs(x - GX) < 2.4) continue;
      const tower = Math.abs(Math.round((x + 34) / 2.6) % 4) === 0;
      const y0 = hA(x, WZ) - 0.3;
      if (tower) { const tw = new THREE.Group(); tw.position.set(x, y0, WZ); tw.add(mesh(LW.jitter(new THREE.BoxGeometry(2.4, 4.6, 2.4), 0.06, rng), '#D6BE94', 0, 2.3, 0)); for (const [px, pz] of [[-0.9, 0.9], [0.9, 0.9], [-0.9, -0.9], [0.9, -0.9]]) tw.add(mesh(new THREE.BoxGeometry(0.46, 0.42, 0.46), '#E2CCA4', px, 4.8, pz)); mg.obj(tw); }
      else { const sg = new THREE.Group(); sg.position.set(x, y0, WZ); sg.add(mesh(LW.jitter(new THREE.BoxGeometry(2.7, 0.8, 1.3), 0.05, rng), '#A99A86', 0, 0.4, 0)); sg.add(mesh(LW.jitter(new THREE.BoxGeometry(2.7, 2.7, 1.05, 2, 1, 1), 0.05, rng), pick(rng, ['#DCC59C', '#D4BB90', '#E0CAA4']), 0, 2.1, 0)); for (const px of [-0.9, 0, 0.9]) sg.add(mesh(new THREE.BoxGeometry(0.42, 0.36, 1.05), '#D8C29A', px, 3.62, 0)); mg.obj(sg); }
    }
    for (const s of [-1, 1]) { const tw = new THREE.Group(), x = GX + s * 2.6; tw.position.set(x, hA(x, WZ) - 0.3, WZ + 0.3); tw.add(mesh(LW.jitter(new THREE.BoxGeometry(2.6, 5.4, 3.0), 0.06, rng), '#C4A87C', 0, 2.7, 0)); for (const [px, pz] of [[-1, 1.1], [1, 1.1], [-1, -1.1], [1, -1.1]]) tw.add(mesh(new THREE.BoxGeometry(0.5, 0.46, 0.5), '#D4BC92', px, 5.62, pz)); mg.obj(tw); }
    mg.obj(mesh(new THREE.BoxGeometry(3.0, 3.4, 0.2), '#3A2A20', GX, hA(GX, WZ) + 1.4, WZ + 0.2));
    mg.obj(mesh(new THREE.BoxGeometry(3.4, 0.6, 1.6), '#7A5A3E', GX, hA(GX, WZ) + 3.4, WZ + 0.4));
    for (let i = 0; i < 56; i++) { const x = -34 + rng() * 74, z = WZ - 3 - rng() * 24; const w = 2.6 + rng() * 2, d = 2.4 + rng() * 1.6, h = 2.4 + rng() * 2.6; const hs = house(rng, w, d, h); hs.position.set(x, hA(x, z) - 0.2, z); hs.rotation.y = (rng() - 0.5) * 0.4; mg.obj(hs); }
    for (let i = 0; i < 22; i++) { const x = -34 + rng() * 74, z = WZ - 2 - rng() * 24; const p = palm(rng, 1.1 + rng() * 0.5); p.position.set(x, hA(x, z), z); mg.obj(p); }
    for (let i = 0; i < 16; i++) { const x = -26 + rng() * 60, z = WZ + 4 + rng() * 34; if (Math.hypot(x - FLATA[0], z - FLATA[1]) < 13 || z > FLATA[1] - 4) continue; const p = palm(rng, 0.9 + rng() * 0.4); p.position.set(x, hA(x, z), z); mg.obj(p); }
    for (let i = 0; i < 70; i++) { const x = -30 + rng() * 70, z = -16 + rng() * 34; if (Math.hypot(x - FLATA[0], z - FLATA[1]) < 13 || Math.hypot(x - SAMA[0], z - SAMA[2]) < 3) continue; const b = LW.bush(rng, 0.7 + rng() * 0.8); b.position.set(x, hA(x, z), z); mg.obj(b); }
    for (let i = 0; i < 40; i++) { const x = -24 + rng() * 56, z = -16 + rng() * 30; if (Math.hypot(x - FLATA[0], z - FLATA[1]) < 12) continue; const k = LW.rock(rng, 0.3 + rng() * 0.8); k.position.x = x; k.position.z = z; k.position.y += hA(x, z) - 0.05; mg.obj(k); }
    for (let i = 0; i < 140; i++) { const x = FLATA[0] - 12 + rng() * 24, z = FLATA[1] - 9 + rng() * 20; if (z > SAMA[2] + 1) continue; const g = LW.grassTuft(rng, 0.4 + rng() * 0.4); g.position.set(x, hA(x, z), z); mg.obj(g); }
    for (const [x0, z0, s] of [[-5.6, 5.4, 1.4], [-4.4, 6.6, 0.9], [-7.6, 3.2, 1.0]]) { const [x, z] = ROTA(x0, z0); const k = LW.rock(FW.rng(Math.round(x * 100 + z)), s); k.position.set(x, hA(x, z) + 0.05, z); mg.obj(k); }
    ash.add(mg.mesh());
    for (const [x, s] of [[GX - 2.6, 1], [GX + 2.6, 1], [-8.8, 0.9], [19.6, 0.9]]) { const bn = LW.banner(rng, 1.1 * s); bn.position.set(x, hA(x, WZ) + (Math.abs(x - GX) < 3 ? 5.6 : 4.6), WZ + 0.3); ash.add(bn); }

    // Samson, the men, their garments
    samA = castBB('samson', samFB, { cw: 1300, ch: 1640, footPx: 60, scale: 2.5 }); samA.position.set(SAMA[0], hA(SAMA[0], SAMA[2]), SAMA[2]); ash.add(samA, samA.userData.caster); contactShadow(ash, contactA, samA, 0.5);
    const variants = [{ shout: 0 }, { shout: 0, kilt: '#B24A32', trim: '#E4D3B0', spearSide: -1 }, { shout: 0, skin: '#A87048' }, { kilt: '#D8C6A0', spearSide: -1, skin: '#B47A50', shout: 0.4 }, { shout: 0, skin: '#C99062' }, { kilt: '#C9A87A', trim: '#3F5E86', shout: 0 }];
    for (let i = 0; i < NMEN; i++) {
      const o = Object.assign({}, variants[i % variants.length]);
      const bb = LW.billboard({ cw: 340, ch: 460, worldH: (1.8 * 460) / 330, footPx: 14, draw: (ctx) => { ctx.translate(170, 446); ctx.scale(0.5, 0.5); PP.soldier(ctx, o); } });
      bb.userData.update('x'); bb.material.transparent = true;
      const [x, z] = ROW(i); bb.position.set(x, hA(x, z), z); bb.userData.home = [x, hA(x, z), z];
      ash.add(bb, bb.userData.caster); men.push(bb);
    }
    const ctex = [0, 1, 2].map(clothTex);
    for (let i = 0; i < NMEN; i++) {
      const g = new THREE.PlaneGeometry(0.48, 0.6, 2, 2); const p = g.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, Math.sin(p.getX(k) * 5 + i) * 0.04 + Math.cos(p.getY(k) * 4) * 0.03); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: ctex[i % 3], side: THREE.DoubleSide, roughness: 0.9 })); m.castShadow = true; m.receiveShadow = true; m.visible = false; ash.add(m); cloths.push(m);
    }
    dustA = dustPts(NMEN * 7, '#E6D3B2', 1); ash.add(dustA);
    poolA = LW.pool(1.2, '#FFC86E'); poolA.position.set(SAMA[0], hA(SAMA[0], SAMA[2]) + 0.04, SAMA[2]); ash.add(poolA);
    motesA = LW.particles(70, '#FFE3B0', 0.04); ash.add(motesA);
  }
  function shotAsh(t, shot) {
    const T0 = shot.t0, tR = shot.beats.rushed ?? T0 + shot.dur * 0.6;
    const gold = prog(t, tR - 0.35, tR, ease.in), surge = t >= tR ? Math.exp(-(t - tR) * 2.6) : 0;
    // Samson: stands facing the row; the Spirit rushes upon him on "rushed"
    const bk = q(prog(t, tR - 0.04, tR + 0.22, ease.out), 12), burst = bk > 0;
    const s = burst ? { pose: 'burst', k: bk, look: [0.3, -0.5], t: q(t, 30), gold: q(Math.max(gold, 0.5), 20), hair: 1, bonds: 'none' } : { pose: 'stand', look: [0.9, 0], t: q(t, 30), gold: q(gold, 20), hair: 1, bonds: 'none' };
    samA.userData.update(JSON.stringify(s), s); samA.scale.setScalar(samA.userData.real ? 1 : pop(t, tR - 0.02));
    samA.material.color.setRGB(1 + gold * 0.1 + surge * 0.1, 0.97 + gold * 0.05, 0.92);
    spotA.intensity = gold * 15 + surge * 18; sunA.intensity = 3.7 * (1 - 0.18 * gold); poolA.material.opacity = gold * 0.25 + surge * 0.2;
    // camera: wide three-quarter; held (a slight drift) until "rushed", then a quick lateral move along the row
    const A = KA([-10.4, 7.0, 13.2], [1.4, 0.6, -3.4], 34), A2 = KA([-10.25, 6.98, 13.15], [1.45, 0.6, -3.42], 34), B = KA([-8.8, 6.9, 13.5], [2.4, 0.6, -3.9], 34);
    const k = t < tR ? FW.camLerpK(A, A2, ease.inOut(clamp((t - T0) / (tR - T0)))) : FW.camLerpK(A2, B, ease.out(clamp((t - tR) / 0.95)));
    const fp = ROTA(0.6, -0.8), focus = camSet(k, 0.03, [fp[0], 0.9, fp[1]]);
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir); const lean = Math.asin(-dir.y) * 0.5;
    const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
    // the row topples away from him, one after another, into dust; each man's garment drops where he stood
    const tf = (i) => tR + 0.1 + i * 0.019 + hsh(i, 2) * 0.02;
    men.forEach((m, i) => {
      const f = prog(t, tf(i), tf(i) + 0.3, ease.in), h = m.userData.home;
      m.rotation.order = 'YXZ'; m.userData.face(cam); m.rotation.x = -lean - f * 0.55; m.rotation.z = -f * 1.3 + Math.sin(t * 2 + i) * 0.012 * (1 - f);
      m.position.set(h[0] + right.x * f * 0.25, h[1] - f * 0.25, h[2] + right.z * f * 0.25);
      const op = 1 - prog(t, tf(i) + 0.24, tf(i) + 0.42, (x) => x);
      m.material.opacity = op; m.visible = op > 0.01; m.userData.caster.visible = op > 0.5;
      m.userData.castFrom(sunA);
    });
    cloths.forEach((c, i) => {
      const t1 = tf(i) + 0.06, u = clamp((t - t1) / 0.46);
      if (t < t1) { c.visible = false; return; }
      c.visible = true; const h = men[i].userData.home, e = ease.in(u) * 0.55 + u * 0.45;
      c.position.set(h[0] + Math.sin(u * 5 + i) * 0.12 * (1 - u) + right.x * 0.15, h[1] + lerp(1.05, 0.04, e), h[2] + Math.cos(u * 4 + i) * 0.1 * (1 - u));
      c.rotation.set(lerp(-0.25, -Math.PI / 2, ease.inOut(u)), hsh(i, 5) * 6.28 * u + Math.atan2(cam.position.x - h[0], cam.position.z - h[2]) * (1 - u), Math.sin(u * 9 + i) * 0.5 * (1 - u), 'YXZ');
    });
    dustA.userData.update((j, v) => {
      const i = Math.floor(j / 7), kk = j % 7, h = men[i].userData.home, born = tf(i) + 0.2, age = t - born;
      if (age < 0 || age > 1.6) { v.set(0, -99, 0); return { alpha: 0 }; }
      const a = hsh(j, 2) * 6.283, sp = 0.4 + hsh(j, 3) * 0.7, g = 1 - Math.exp(-age * 3.2);
      v.set(h[0] + right.x * 1.0 + Math.cos(a) * sp * g, h[1] + 0.2 + hsh(j, 4) * 0.5 * g + 0.15 * kk / 7, h[2] + right.z * 1.0 + Math.sin(a) * sp * g * 0.6);
      return { alpha: 0.75 * Math.pow(1 - age / 1.6, 1.5) * (0.6 + 0.4 * hsh(j, 5)), size: 0.55 + hsh(j, 6) * 0.5 + g * 0.5 };
    });
    motesA.userData.update((i, v) => { const kq = (hsh(i, 7) + t * 0.05 * (0.5 + hsh(i, 8))) % 1, al = 0.15 + hsh(i, 9) * 0.85; v.set(lerp(SAMA[0] - 5, SAMA[0], al) + Math.sin(t * 0.4 + i) * 0.4 * al, lerp(13, 0.3, al) + (kq - 0.5) * 0.6, lerp(SAMA[2] - 3.5, SAMA[2], al) + Math.cos(t * 0.3 + i * 2) * 0.4 * al); return { alpha: gold * (0.4 + 0.6 * hsh(i, 10)) * Math.sin(Math.PI * kq), size: 0.7 + hsh(i, 11) * 0.8 }; });
    contactA.forEach(([m, o]) => m.position.set(o.position.x, hA(o.position.x, o.position.z) + 0.03, o.position.z));
    const head = [SAMA[0], SAMA[1] + 1.95, SAMA[2]];
    return { scene: ash, sun: sunA, bill: [samA], focus, aperture: 3.6, maxR: 7, fgScale: 1.5, exposure: 1.1 + surge * 0.05, sat: 1.1, bloom: 0.15 + surge * 0.05,
      rays: { amt: gold * 0.85 + surge * 0.4, target: [SAMA[0], 1.2, SAMA[2]] }, flash: t >= tR && t < tR + 0.16 ? Math.pow(1 - (t - tR) / 0.16, 2) * 0.9 : 0,
      tags: [{ text: 'ASHKELON', sub: 'JUDGES 14:19', p: head, k: prog(t, T0 + 0.3, T0 + 0.9, (x) => x), dy: -130, dx: -60, a: 1 - prog(t, tR - 0.25, tR + 0.05) }] };
  }

  SCENES.timnah = {
    async build(env) { cam = env.cam; buildTimnah(); buildAsh(); },
    frame(t, shot, camera) {
      cam = camera;
      switch (shot.v) {
        case 'lion': return shotLion(t, shot);
        case 'ashkelon': return shotAsh(t, shot);
        case 'bride': return shotBride(t, shot);
        default: return shotWide(t, shot);
      }
    },
  };
})();
