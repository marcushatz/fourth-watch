// ZORAH (Judges 13:2-5, 13:9): S17 'angel'. "Before Samson was born, the angel said he would 'begin to save Israel.'"
// A wheat field near Zorah in soft gold morning light; Manoah's wife alone in the field (worried: she was barren); the
// angel of the LORD appears in light from the upper left (on "angel"); she kneels in awe; on "begin" he raises a hand
// as he speaks (13:5). Camera: a high wide that cranes down slowly from "born". The label sits below the figures.
// Characters: globalThis.PP2 (mother, angel) when published, else local stand-ins. Every frame is a pure function of t.
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const q = (v, n = 60) => Math.round(v * n) / n;
  const UNIT = 1.86 / 560;
  let cam; const SKIES = [];

  // ---------------- kit (same as scenes/timnah.js) ----------------
  function merger() {
    const P = [], Cc = [];
    const api = {
      add(geo, m, color) { const g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(m); const p = g.attributes.position, c = color.isColor ? color : C(color); for (let i = 0; i < p.count; i++) { P.push(p.getX(i), p.getY(i), p.getZ(i)); Cc.push(c.r, c.g, c.b); } g.dispose(); },
      obj(o) { o.updateMatrixWorld(true); o.traverse((c) => { if (c.isMesh && c.material && c.material.isMeshStandardMaterial) api.add(c.geometry, c.matrixWorld, c.material.color); }); },
      mesh() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.93, metalness: 0 })); m.castShadow = m.receiveShadow = true; return m; },
    };
    return api;
  }
  const M = (c) => LW.M(c);
  const mesh = (geo, col, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, M(col)); m.position.set(x, y, z); return m; };
  const pick = (rng, a) => a[Math.floor(rng() * a.length) % a.length];
  const P2 = () => globalThis.PP2 || null;
  function castBB(kind, fb, def, over) {
    const P = P2(), fn = P && typeof P[kind] === 'function' ? P[kind] : null;
    const z = Object.assign({}, def, (fn && P.SIZES && P.SIZES[kind]) || {}, (fn && over) || {}), sc = z.scale ?? 1;
    const bb = LW.billboard({ cw: z.cw, ch: z.ch, worldH: (z.ch * UNIT) / sc, footPx: z.footPx, draw: (ctx, st) => { ctx.translate(z.cw / 2, z.ch - z.footPx); ctx.scale(sc, sc); (fn || fb)(ctx, st); } });
    bb.userData.real = !!fn; return bb;
  }
  const blobTex = (() => { let tx; return () => { if (tx) return tx; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); tx = new THREE.CanvasTexture(c); return tx; }; })();
  function contactShadow(scene, obj, r = 0.45) { const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.2), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, color: 0x2a1a10, opacity: 0.75 })); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m); return m; }
  const K = (p, l, f = 34) => ({ p, l, f });
  function camSet(k, shift, focusP) {
    FW.setCam(cam, k.p, k.l, k.f); cam.setViewOffset(W, H, 0, -shift * H, W, H); cam.updateMatrixWorld();
    for (const sk of SKIES) { sk.position.copy(cam.position); sk.updateMatrixWorld(); }   // LW.sky follows the camera one render late otherwise
    return -new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z;
  }
  function fromCam(p, ahead, left, up) { const f = new THREE.Vector3(); cam.getWorldDirection(f); f.y = 0; f.normalize(); const r = new THREE.Vector3(-f.z, 0, f.x); return [p[0] + f.x * ahead - r.x * left, p[1] + up, p[2] + f.z * ahead - r.z * left]; }

  // ---------------- stand-ins (only until PP2 is published) ----------------
  function robedFB(o) {
    return (ctx, st) => {
      const { part, blob, ell, limb, eyes, brows, mix } = PP;
      const skin = o.skin || '#C08A5E', sh = mix(skin, '#5A3424', 0.35), robe = o.robe, rsh = mix(robe, '#2A1E16', 0.3);
      const pose = st.pose || 'stand', kneel = pose === 'awe', tall = o.tall || 1, hy = (kneel ? -318 : -468) * tall, top = hy + 50, shY = top + 30;
      if (o.aura && (st.glow ?? 1) > 0) { const g = st.glow ?? 1, gr = ctx.createRadialGradient(0, -300, 20, 0, -300, 420); gr.addColorStop(0, `rgba(255,236,170,${0.5 * g})`); gr.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = gr; ctx.fillRect(-420, -720, 840, 840); }
      if (!kneel) for (const s of [-1, 1]) part(ctx, ell(s * 16, -6, 16, 7), '#5A3C26', { lw: 2 });
      const body = kneel ? blob([[-34, top + 6], [-56, top + 34], [-62, top + 110], [-94, -36], [-100, -6], [0, -2], [100, -6], [94, -36], [62, top + 110], [56, top + 34], [34, top + 6], [0, top + 14]], 0.42)
        : blob([[-34, top + 6], [-56, top + 28], [-58, top + 110], [-64, -150], [-74, -12], [0, -6], [74, -12], [64, -150], [58, top + 110], [56, top + 28], [34, top + 6], [0, top + 14]], 0.42);
      part(ctx, body, robe, { shade: rsh, sd: 12 });
      ctx.save(); ctx.clip(body); ctx.fillStyle = o.band || '#E3C27A'; ctx.fillRect(-120, -44, 240, 12); ctx.restore();
      const arm = (J, E, Wr) => { part(ctx, limb(J, E, 14, 12, 2, 1), robe, { shade: rsh, sd: 6 }); part(ctx, limb(E, Wr, 11, 9, 1, 1), skin, { shade: sh, sd: 4 }); part(ctx, ell(Wr[0], Wr[1], 10, 11), skin, { shade: sh, sd: 4 }); };
      for (const s of [-1, 1]) {
        const J = [s * 44, shY];
        if (pose === 'awe') arm(J, [s * 40, shY + 50], [s * 16, hy + 26]);
        else if (pose === 'speak' && s === 1) arm(J, [82, shY - 20], [96, shY - 110]);
        else if (pose === 'worried') arm(J, [s * 40, shY + 80], [s * 6, shY + 60]);
        else arm(J, [s * 56, shY + 96], [s * 54, shY + 182]);
      }
      ctx.save(); ctx.translate(0, hy);
      part(ctx, ell(0, 0, 32, 36), skin, { shade: sh, sd: 6 });
      eyes(ctx, 0, -2, { sp: 12, rx: 6.6, ry: 4.6, look: st.look || [0, 0] }); brows(ctx, 0, -12, { lift: pose === 'awe' ? 4 : 1, th: 3.4 });
      if (o.veil) part(ctx, blob([[-36, 26], [-42, -6], [-36, -40], [0, -52], [36, -40], [42, -6], [36, 26], [52, 70], [26, 56], [30, 4], [24, -22], [0, -28], [-24, -22], [-30, 4], [-26, 56], [-52, 70]], 0.42), o.veil, { shade: mix(o.veil, '#4A3424', 0.3), sd: 7 });
      else part(ctx, blob([[-34, -4], [-30, -34], [0, -44], [30, -34], [34, -4], [22, -26], [0, -30], [-22, -26]], 0.4), '#8A5E3A', { lw: 2 });
      ctx.restore();
    };
  }

  // ---------------- the land near Zorah ----------------
  const WOM = [0.5, 0, 0.3], ANG = [-0.7, 0, -1.0], ZORAH = [3, -52];
  const hZ = (x, z) => {
    let h = (FW.fbm(x * 0.05, z * 0.05, 61, 3) - 0.5) * 1.2 + (FW.noise2(x * 0.5, z * 0.5, 6) - 0.5) * 0.12;
    h += FW.smooth(clamp((-z - 22) / 26)) * (3 + 10 * FW.fbm(x * 0.03 + 9, z * 0.03, 7, 3));      // hills beyond the valley
    h += FW.smooth(clamp((Math.abs(x) - 18) / 18)) * 5 * FW.fbm(x * 0.05, z * 0.05 + 3, 13, 3);  // valley sides
    h += 6 * Math.exp(-(Math.pow((x - ZORAH[0]) / 11, 2) + Math.pow((z - ZORAH[1]) / 8, 2)));       // Zorah's hill on the skyline
    h -= 0.06 * z;                                                                                  // a gentle fall toward the camera
    const kf = FW.smooth(clamp((Math.hypot(x - WOM[0], z - WOM[2]) - 3) / 6)); h = lerp(h * 0.3, h, kf);
    return h;
  };
  const FX0 = -15, FX1 = 14, FZ0 = -19.5, FZ1 = 9;
  const field = (x, z) => x > FX0 && x < FX1 && z > FZ0 && z < FZ1;
  // clearings where the two figures are (the woman's runs a little toward the camera so the wheat doesn't hide her)
  const clearK = (x, z) => Math.min(FW.smooth(clamp((Math.hypot(x - WOM[0], (z - WOM[2]) * (z > WOM[2] ? 0.55 : 1)) - 1.5) / 0.6)), FW.smooth(clamp((Math.hypot(x - ANG[0], z - ANG[2]) - 1.2) / 0.5)), FW.smooth(clamp((Math.abs(x - (WOM[0] - 0.4 + (z - WOM[2]) * 0.32)) - 0.35) / 0.3)) + (z > WOM[2] ? 1 : 0));
  const colZ = (x, z, y, ny, rnd) => {
    const steep = 1 - ny, n = FW.fbm(x * 0.09 + 5, z * 0.09, 33, 3);
    let c;
    if (steep > 0.34) c = C(rnd < 0.5 ? '#B6A48F' : '#A8957F');
    else if (steep > 0.2) c = C(n > 0.5 ? '#C8A673' : '#B3AC66');
    else c = C(n > 0.62 ? '#C2BC6E' : n > 0.42 ? '#A9B65C' : '#94AA54');
    if (field(x, z)) { const plot = hsh(Math.floor((x + 100) / 7) * 17 + Math.floor((z + 100) / 9), 4); c = C(plot < 0.5 ? (rnd < 0.5 ? '#D8B860' : '#CFAE55') : (rnd < 0.5 ? '#CCA956' : '#C4A04C')); }
    if (Math.hypot(x - WOM[0], z - WOM[2]) < 1.7 || Math.hypot(x - ANG[0], z - ANG[2]) < 1.3) c.lerp(C('#BFA272'), 0.55);   // trodden ground
    if (Math.abs(x - (WOM[0] - 0.4 + (z - WOM[2]) * 0.32)) < 0.45 && z < WOM[2] && z > -22) c.lerp(C('#C9B48C'), 0.7);  // a footpath to the town
    c.offsetHSL((rnd - 0.5) * 0.012, (rnd - 0.5) * 0.04, (rnd - 0.5) * 0.06);
    return c;
  };

  let scene, sun, hemi, spot, pool, motes, sky, mother, angel, momC, angC, aura;
  function build() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(C('#D9CBBE'), 26, 120);
    sky = LW.sky({ top: '#3B5A8A', mid: '#8FA6C8', hor: '#F6D3A0', low: '#D9CDBF', sunDir: [-0.7, 0.2, -0.68], sunCol: '#FFDCA0', sunAmt: 0.9 }); scene.add(sky); SKIES.push(sky);
    hemi = new THREE.HemisphereLight(C('#CAD6EE'), C('#B09068'), 1.35); scene.add(hemi);
    sun = new THREE.DirectionalLight(C('#FFE2B6'), 3.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    sun.position.set(-12, 9, -8); sun.target.position.set(0, 0, -2); scene.add(sun, sun.target);
    { const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 0.5; sc.far = 60; }
    spot = new THREE.SpotLight(C('#FFD27A'), 0, 40, 0.13, 0.6, 1.1); scene.add(spot, spot.target);
    scene.add(LW.terrain({ size: 170, seg: 112, cx: 0, cz: -30, hFn: hZ, colFn: colZ, seed: 13 }));
    const mg = merger(), rng = FW.rng(1303);
    // the wheat, ripe for harvest: a faceted golden carpet of ears (a checkerboard of peaks) over the field ...
    { const nx = 58, nz = 57, sx = FX1 - FX0, sz = FZ1 - FZ0;
      const g0 = new THREE.PlaneGeometry(sx, sz, nx, nz); g0.rotateX(-Math.PI / 2); g0.translate(FX0 + sx / 2, 0, FZ0 + sz / 2);
      const p = g0.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const ix = i % (nx + 1), iz = Math.floor(i / (nx + 1)), tip = (ix + iz) % 2 === 0;
        let x = p.getX(i), z = p.getZ(i); x += (FW.noise2(x * 2.3, z * 2.3, 3) - 0.5) * 0.2; z += (FW.noise2(x * 1.9, z * 2.1, 5) - 0.5) * 0.16;
        const edge = FW.smooth(clamp(Math.min(x - FX0, FX1 - x, z - FZ0, FZ1 - z) / 0.7)), ck = clearK(x, z);
        const ridge = iz % 2 === 0, hh = (ridge ? 0.3 + 0.12 * FW.noise2(x * 1.3, z * 1.1, 9) + (tip ? 0.04 : 0) : 0.06) * edge * ck;
        p.setXYZ(i, x, hZ(x, z) + hh - 0.03, z);
      }
      const g = g0.toNonIndexed(); g.computeVertexNormals(); const pp = g.attributes.position, cl = new Float32Array(pp.count * 3), cr = FW.rng(31), lo = C('#D0A852'), hi = C('#F0D07A'), cc = new THREE.Color();
      for (let i = 0; i < pp.count; i += 3) { let yy = 0; for (let k = 0; k < 3; k++) { const x = pp.getX(i + k), z = pp.getZ(i + k); yy += pp.getY(i + k) - hZ(x, z); } yy /= 3; cc.copy(lo).lerp(hi, clamp(yy / 0.24)); cc.offsetHSL((cr() - 0.5) * 0.02, (cr() - 0.5) * 0.06, (cr() - 0.5) * 0.06); for (let k = 0; k < 3; k++) { cl[(i + k) * 3] = cc.r; cl[(i + k) * 3 + 1] = cc.g; cl[(i + k) * 3 + 2] = cc.b; } }
      g.setAttribute('color', new THREE.BufferAttribute(cl, 3)); g0.dispose();
      const crop = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.9, emissive: C('#3A2808') })); crop.castShadow = crop.receiveShadow = true; scene.add(crop); }
    // ... and taller stalks with ears where the eye lands: round the clearings and along the field's edges
    const wcol = ['#E2C064', '#D8B458', '#EACB74'];
    for (let i = 0; i < 900; i++) {
      const x = FX0 + rng() * (FX1 - FX0), z = FZ0 + rng() * (FZ1 - FZ0), ck = clearK(x, z);
      if (ck < 0.6 || (ck > 0.99 && rng() < 0.82)) continue;
      const g = new THREE.Group(), col = pick(rng, wcol);
      for (let k = 0; k < 4; k++) { const hgt = 0.62 + rng() * 0.25, a = rng() * 6.28, r = rng() * 0.09, lx = Math.cos(a) * r, lz = Math.sin(a) * r, tx = (rng() - 0.5) * 0.3, tz = (rng() - 0.5) * 0.3;
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, hgt, 3), M('#C9A04A')); st.geometry.translate(0, hgt / 2, 0); st.position.set(lx, 0, lz); st.rotation.set(tz, 0, tx); g.add(st);
        const ear = new THREE.Mesh(new THREE.OctahedronGeometry(0.04, 0), M(col)); ear.scale.set(1, 2.6, 1); ear.position.set(lx + Math.sin(tx) * -hgt, Math.cos(tx) * hgt + 0.04, lz + Math.sin(tz) * hgt); ear.rotation.set(tz, 0, tx); g.add(ear); }
      g.position.set(x, hZ(x, z) - 0.02, z); mg.obj(g);
    }
    // her basket
    { const b = new THREE.Group(); b.add(mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.24, 8), '#A8844E', 0, 0.12, 0)); b.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8), '#D8B458', 0, 0.25, 0)); b.position.set(WOM[0] + 0.85, hZ(WOM[0] + 0.85, WOM[2] + 0.5), WOM[2] + 0.5); mg.obj(b); }
    // a low field wall of gathered stones along the field's edge
    for (let x = FX0; x < FX1; x += 0.7 + rng() * 0.2) { const z = FZ0 - 0.3 + (rng() - 0.5) * 0.3; const st = mesh(LW.jitter(new THREE.BoxGeometry(0.6, 0.36, 0.42), 0.07, rng), pick(rng, ['#A99A86', '#9E8E78', '#B6A48F']), x, hZ(x, z) + 0.12, z); st.rotation.y = (rng() - 0.5) * 0.4; mg.obj(st); }
    // a great terebinth at the field's edge; olives on the slopes; scrub, rocks
    { const t0 = LW.olive(FW.rng(77), 2.3); t0.position.set(7.5, hZ(7.5, -9) - 0.1, -9); mg.obj(t0); }
    for (let i = 0; i < 120; i++) { const x = -60 + rng() * 120, z = -75 + rng() * 95; if (field(x + 1, z + 1) || Math.hypot(x - ZORAH[0], z - ZORAH[1]) < 6) continue; const tr = LW.olive(rng, 0.9 + rng() * 0.6); tr.position.set(x, hZ(x, z) - 0.05, z); mg.obj(tr); }
    for (let i = 0; i < 90; i++) { const x = -40 + rng() * 80, z = -50 + rng() * 75; if (field(x, z)) continue; const b = LW.bush(rng, 0.8 + rng() * 0.8); b.position.set(x, hZ(x, z), z); mg.obj(b); }
    for (let i = 0; i < 50; i++) { const x = -40 + rng() * 80, z = -50 + rng() * 75; if (field(x, z)) continue; const k = LW.rock(rng, 0.3 + rng() * 0.9); k.position.x = x; k.position.z = z; k.position.y += hZ(x, z) - 0.05; mg.obj(k); }
    for (let i = 0; i < 120; i++) { const a = rng() * 6.283, r = 1.0 + rng() * 2.2; const x = WOM[0] - 0.4 + Math.cos(a) * r, z = WOM[2] - 0.5 + Math.sin(a) * r; const g = LW.grassTuft(rng, 0.3 + rng() * 0.3); g.position.set(x, hZ(x, z), z); mg.obj(g); }
    // Zorah on its hill: a cluster of flat-roofed houses inside a low wall
    const top = hZ(...ZORAH);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; const w = mesh(LW.jitter(new THREE.BoxGeometry(2.6, 1.7, 0.8), 0.05, rng), '#C29A6A', ZORAH[0] + Math.sin(a) * 6.2, top + 0.4, ZORAH[1] + Math.cos(a) * 6.2); w.rotation.y = a; mg.obj(w); }
    for (let i = 0; i < 18; i++) { const a = rng() * 6.283, r = Math.sqrt(rng()) * 5; const x = ZORAH[0] + Math.cos(a) * r, z = ZORAH[1] + Math.sin(a) * r, w = 1.6 + rng() * 1.2, d = 1.6 + rng() * 1.0, hh = 1.7 + rng() * 1.2;
      const g = new THREE.Group(); g.add(mesh(LW.jitter(new THREE.BoxGeometry(w, hh, d), 0.05, rng), pick(rng, ['#C9A273', '#BF9665', '#D2B386', '#CDB58C']), 0, hh / 2, 0)); g.add(mesh(new THREE.BoxGeometry(w + 0.1, 0.12, d + 0.1), '#D8C29A', 0, hh + 0.06, 0));
      g.position.set(x, hZ(x, z) - 0.3, z); g.rotation.y = rng() * 6.28; mg.obj(g); }
    scene.add(mg.mesh());

    // the cast
    const HUM = { cw: 640, ch: 840, footPx: 30, scale: 1.25 };
    mother = castBB('mother', robedFB({ robe: '#8E6444', veil: '#D8CBB0', band: '#6E4A30', skin: '#BC8460' }), HUM);
    // a larger canvas than PP2.SIZES.angel so his aura (radius up to ~480 units around y -300) is not clipped into a box
    angel = castBB('angel', robedFB({ robe: '#F6F0E2', band: '#E3C27A', skin: '#D8A27A', tall: 1.08, aura: true }), { cw: 900, ch: 1000, footPx: 40, scale: 1.25 }, { cw: 1760, ch: 2000, footPx: 420, scale: 2 });
    angel.material.transparent = true;
    // his aura: an additive glow sprite that writes no depth (a baked canvas aura would write depth and box the DOF)
    { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,240,190,1)'); g.addColorStop(0.35, 'rgba(255,220,140,0.55)'); g.addColorStop(1, 'rgba(255,200,110,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), color: C('#FFD890'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, opacity: 0 }));
      aura.scale.set(2.6, 3.4, 1); aura.renderOrder = 4; scene.add(aura); }
    mother.position.set(WOM[0], hZ(WOM[0], WOM[2]), WOM[2]); angel.position.set(ANG[0], hZ(ANG[0], ANG[2]), ANG[2]);
    scene.add(mother, mother.userData.caster, angel, angel.userData.caster);
    momC = contactShadow(scene, mother, 0.5); angC = contactShadow(scene, angel, 0.45);
    momC.position.set(mother.position.x, mother.position.y + 0.03, mother.position.z); angC.position.set(angel.position.x, angel.position.y + 0.03, angel.position.z);
    pool = LW.pool(1.5, '#FFD27A'); pool.position.set(ANG[0], hZ(ANG[0], ANG[2]) + 0.04, ANG[2]); scene.add(pool);
    motes = LW.particles(90, '#FFE6B4', 0.04); scene.add(motes);
  }

  function shotAngel(t, shot) {
    const T0 = shot.t0, b = shot.beats, tB = b.born ?? T0 + 1.2, tA = b.angel ?? T0 + 1.8, tS = b.save ?? T0 + 3.0;
    // camera: a high wide over the field that cranes down slowly from "born" to the two of them
    const A = K([-2.0, 10.5, 16], [-0.2, 0.4, -2], 36), A2 = K([-1.95, 10.35, 15.9], [-0.2, 0.42, -2], 36), B = K([-1.5, 2.7, 12.5], [-0.15, 1.0, -0.4], 34);
    const kc = ease.inOut(clamp((t - tB) / Math.max(0.5, shot.t1 - tB)));
    const k = t < tB ? FW.camLerpK(A, A2, clamp((t - T0) / Math.max(0.1, tB - T0))) : FW.camLerpK(A2, B, kc);
    const focus = camSet(k, lerp(0.02, -0.01, kc), [lerp(0, -0.1, kc), 1.0, lerp(-0.3, -0.35, kc)]);
    // light: soft gold morning from the upper left of the frame
    const sp = fromCam([0, 0, -1], 10, 13, 10); sun.position.set(...sp); sun.target.position.set(0, 0, -1); sun.target.updateMatrixWorld();
    // the angel appears in light on "angel": a soft flash, his aura and the gold from the upper left
    const app = prog(t, tA - 0.08, tA + 0.5, ease.out), gold = prog(t, tA - 0.3, tA + 0.4, ease.inOut), surge = t >= tA ? Math.exp(-(t - tA) * 2.2) : 0;
    const glow = q(lerp(0, 1, app), 20);
    const speak = t >= tS - 0.05;
    angel.visible = app > 0.01; angel.userData.caster.visible = app > 0.6; angC.visible = app > 0.2; angC.material.opacity = 0.6 * app;
    angel.material.opacity = app; angel.position.y = hZ(ANG[0], ANG[2]) + (1 - app) * 0.06; angel.scale.setScalar(lerp(0.97, 1, app));
    angel.userData.update(speak ? 's' : 'a', { pose: speak ? 'speak' : 'stand', glow: 0, look: [0.5, 0.25], t: 0 });
    { const fw = fromCam([0, 0, 0], 0.25, 0, 0); aura.position.set(ANG[0] + fw[0], hZ(ANG[0], ANG[2]) + 1.05, ANG[2] + fw[2]); aura.material.opacity = glow * (0.55 + 0.25 * surge) + 0.04 * Math.sin(t * 2.1) * glow; }
    const awe = t >= tA + 0.12;
    mother.userData.update(awe ? 'awe' : 'worried', { pose: awe ? 'awe' : 'worried', look: awe ? [-0.4, -1] : [0.2, 0.3], t: 0 });
    angel.material.color.setRGB(1.08 + surge * 0.15, 1.06 + surge * 0.1, 1.0);
    spot.position.set(...fromCam([ANG[0], 0, ANG[2]], 2.5, 5, 12)); spot.target.position.set(ANG[0], 0.9, ANG[2]); spot.target.updateMatrixWorld();
    spot.intensity = gold * 18 + surge * 14; sun.intensity = 3.4 * (1 - 0.15 * gold); hemi.intensity = 1.35 * (1 - 0.1 * gold);
    pool.material.opacity = gold * 0.3 + surge * 0.15;
    const SPp = spot.position;
    motes.userData.update((i, v) => { const kq = (hsh(i, 7) + t * 0.04 * (0.5 + hsh(i, 8))) % 1, al = 0.12 + hsh(i, 9) * 0.88; v.set(lerp(SPp.x, ANG[0], al) + Math.sin(t * 0.4 + i) * 0.5 * al, lerp(SPp.y, 0.3, al) + (kq - 0.5) * 0.7, lerp(SPp.z, ANG[2], al) + Math.cos(t * 0.3 + i * 2) * 0.5 * al); return { alpha: (gold * 0.9 + 0.08) * (0.4 + 0.6 * hsh(i, 10)) * Math.sin(Math.PI * kq), size: 0.7 + hsh(i, 11) * 0.9 }; });
    return { scene, sun, bill: [mother, angel], focus, aperture: lerp(5.5, 4.4, kc), maxR: 7, fgScale: 1.4, exposure: 1.1 + surge * 0.04, sat: 1.08, bloom: 0.16 + gold * 0.05,
      rays: { amt: gold * 0.75 + surge * 0.3, target: [ANG[0], 1.3, ANG[2]] }, flash: t >= tA && t < tA + 0.25 ? Math.pow(1 - (t - tA) / 0.25, 2) * 0.55 : 0 };
  }

  SCENES.zorah = {
    async build(env) { cam = env.cam; build(); },
    frame(t, shot, camera) { cam = camera; return shotAngel(t, shot); },
  };
})();
