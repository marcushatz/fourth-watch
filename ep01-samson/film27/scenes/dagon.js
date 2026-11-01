// DAGON (Judges 16:23-30): the house of Dagon in Gaza, torchlit, the lords in the hall and about three thousand men and
// women on the roof. S29 'pillars': the young man leads blind Samson to the two middle pillars; he rests his hands on them
// and prays, face up (16:26-28). S30 'fall': "God still answered": gold light breaks in from the upper left, he bows with
// all his strength and the house falls in stone and dust (16:29-30). No gore: the roof comes down into dust; figures
// topple out of view into it.
// Deterministic: the collapse is analytic (every block's path is a closed-form function of t from its start time).
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const sr = (i, k) => hsh(i, k) * 2 - 1;
  const q = (v, n = 60) => Math.round(v * n) / n;
  const G = 9.8;
  const smooth = FW.smooth;

  // ---------------- the plan of the house (metres; Samson stands at the origin, the court is +z, the god at -z) ----------------
  const PX = 0.8, PZ = -0.3;                      // the two middle pillars at x = ±PX: PP2 'pray' wrists sit at ±0.585 m, so his palms rest on them
  const OX = 2.6, FXP = 4.6, WALL_X = 6.8;        // outer front pillars, side walls
  const H_BASE = 0.40, N_DRUM = 7, DRUM_H = 0.423, DRUM_R = 0.25, H_CAP0 = 3.36, H_CAP = 3.74, H_LIN = 4.04, H_SLAB = 4.22, H_ROOF = 4.44, H_PARA = 4.80;
  const ROOF_FRONT = 0.9, BACK_Z = -11.2;
  const STRIPS = [[-3.6, ROOF_FRONT], [-7.2, -3.6], [BACK_Z, -7.2]];
  const STATUE_Z = -9.9;
  const TIER = 0.3, ROWS = [[ROOF_FRONT - 0.33, 0], [ROOF_FRONT - 0.8, 0.21], [ROOF_FRONT - 1.27, 0.1]];   // the crowd's rows on the roof: [z, x offset]

  const STONE = ['#BCA889', '#AF9B7B', '#A39071', '#C2B193'];
  const PLASTER = '#9E8A70', PLASTER_D = '#6C645A';
  const WOOD = '#5A3F2C', WOOD_L = '#70503A';
  const RED = '#9C3A26', CREAM = '#E2D1AE', OCHRE = '#C28F3E', GOLDM = '#CFA24C', DARK = '#2A1E16';
  const BRONZE = '#8A7458', BRONZE_D = '#6A5843';

  let statue, scene, cam, sun, hemi, spot, pool, motes, embers, trickle, haze, puffs, rubble, drumsIM, capsIM;
  let sam, boy, lords = [], guards = [], roofCrowd = [], hallCrowd = [], contact = [], flames = [], fireLights = [], fireGlows = [], crowdMats = [];
  let pieces = [];                                 // moving roof pieces
  const drums = [];                                // { side, x0, k, y0, release, v, w, land, ... } for the pillars that break
  const puffList = [], rubList = [], streams = [];
  let T = null;                                    // the timeline (from the score)
  let usingPP2 = false;

  // ---------------- small builders ----------------
  const mtx = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  // merge many flat-shaded parts into one vertex-coloured mesh (one draw call). vary: per-face tone variation
  function Merger(seed = 1) {
    const pos = [], col = [], rng = FW.rng(seed), c = new THREE.Color();
    const api = {
      add(geo, color, m, vary = 0.05, per = 6) {
        const g = geo.index ? geo.toNonIndexed() : geo.clone();
        if (m) g.applyMatrix4(m);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i += per) {
          c.set(color); if (vary) c.offsetHSL((rng() - 0.5) * vary * 0.15, (rng() - 0.5) * vary * 0.4, (rng() - 0.5) * vary);
          for (let k = 0; k < per && i + k < p.count; k++) { pos.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k)); col.push(c.r, c.g, c.b); }
        }
        g.dispose(); geo.dispose(); return api;
      },
      box(w, h, d, color, x, y, z, ry = 0, vary) { return api.add(new THREE.BoxGeometry(w, h, d), color, mtx(x, y, z, 0, ry, 0), vary); },
      cyl(r0, r1, h, seg, color, x, y, z, vary, rz = 0, rx = 0) { return api.add(new THREE.CylinderGeometry(r0, r1, h, seg), color, mtx(x, y, z, rx, 0, rz), vary); },
      empty() { return pos.length === 0; },
      geometry(offset) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        if (offset) g.translate(-offset[0], -offset[1], -offset[2]);
        g.computeVertexNormals(); return g;
      },
      mesh(o = {}) { const m = new THREE.Mesh(api.geometry(o.offset), new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.93, metalness: 0 })); m.castShadow = o.cast ?? true; m.receiveShadow = true; return m; },
    };
    return api;
  }
  const flatMat = (o = {}) => new THREE.MeshStandardMaterial(Object.assign({ flatShading: true, roughness: 0.93, metalness: 0 }, o));

  // a canvas texture painted once
  function paint(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx; }
  const bannerTex = (seed) => paint(128, 512, (x, w, h) => {
    x.fillStyle = RED; x.fillRect(0, 0, w, h);
    x.fillStyle = CREAM; x.fillRect(0, 0, w, 26); x.fillRect(0, h - 40, w, 40); x.fillRect(10, 0, 8, h); x.fillRect(w - 18, 0, 8, h);
    x.fillStyle = '#6E2414'; for (let y = 34; y < h - 50; y += 22) { x.beginPath(); x.moveTo(24, y); x.lineTo(32, y + 11); x.lineTo(24, y + 22); x.fill(); x.beginPath(); x.moveTo(w - 24, y); x.lineTo(w - 32, y + 11); x.lineTo(w - 24, y + 22); x.fill(); }
    // a grain ear (Dagon was a grain god): stem + chevrons, gold
    x.strokeStyle = '#E2B65A'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(w / 2, 380); x.lineTo(w / 2, 120); x.stroke();
    for (let i = 0; i < 7; i++) { const y = 140 + i * 32; x.beginPath(); x.moveTo(w / 2, y + 22); x.quadraticCurveTo(w / 2 - 22, y + 8, w / 2 - 26, y - 8); x.stroke(); x.beginPath(); x.moveTo(w / 2, y + 22); x.quadraticCurveTo(w / 2 + 22, y + 8, w / 2 + 26, y - 8); x.stroke(); }
    x.fillStyle = '#E2B65A'; x.beginPath(); x.ellipse(w / 2, 108, 10, 18, 0, 0, 6.283); x.fill();
    x.fillStyle = OCHRE; x.fillRect(0, h - 70, w, 10);
  });
  function banner(tex, x, y, z, w = 0.62, h = 2.3, ry = 0) {
    const g = new THREE.PlaneGeometry(w, h, 2, 8); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + h / 2) / h; p.setZ(i, Math.sin(v * 3.1 + p.getX(i) * 2) * 0.035 + (1 - v) * 0.05); p.setX(i, p.getX(i) * (1 - (1 - v) * 0.06)); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, flatMat({ map: tex, side: THREE.DoubleSide }));
    m.position.set(x, y - h / 2, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; return m;
  }
  const glowTex = (() => { let t = null; return () => { if (t) return t; t = paint(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }); return t; }; })();
  // a flame: two emissive cones + an additive glow sprite
  function flame(x, y, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.11 * s, 0.34 * s, 6), new THREE.MeshBasicMaterial({ color: C('#FF8A34').multiplyScalar(2.0), toneMapped: false, fog: false }));
    outer.position.y = 0.15 * s; g.add(outer);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06 * s, 0.2 * s, 5), new THREE.MeshBasicMaterial({ color: C('#FFE2A0').multiplyScalar(2.2), toneMapped: false, fog: false }));
    inner.position.y = 0.1 * s; g.add(inner);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: C('#FF9A48'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55, fog: false }));
    halo.scale.set(1.1 * s, 1.1 * s, 1); halo.position.y = 0.16 * s; g.add(halo);
    g.userData = { outer, inner, halo, s, seed: x * 13 + z * 7 };
    flames.push(g); return g;
  }
  function brazier(M, x, z, h = 1.05, s = 1) {
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4; M.cyl(0.025 * s, 0.03 * s, h, 4, '#3E2E22', x + Math.cos(a) * 0.17 * s, h / 2, z + Math.sin(a) * 0.17 * s, 0.02, Math.cos(a) * 0.16, -Math.sin(a) * 0.16); }
    M.cyl(0.32 * s, 0.17 * s, 0.2 * s, 8, '#8A5A2E', x, h, z, 0.04);
    M.cyl(0.33 * s, 0.33 * s, 0.035 * s, 8, '#B07A3E', x, h + 0.1 * s, z, 0.02);
    return flame(x, h + 0.08 * s, z, 1.25 * s);
  }
  function torch(M, x, y, z, side = 1) {
    M.cyl(0.03, 0.04, 0.5, 5, WOOD, x, y, z, 0.03, side * 0.25);
    M.cyl(0.07, 0.045, 0.12, 6, '#7A5A36', x - side * 0.06, y + 0.27, z, 0.02);
    return flame(x - side * 0.07, y + 0.3, z, 0.95);
  }
  function jar(M, x, z, s = 1, col = '#A8673E') {
    const pts = [[0, 0], [0.12, 0.02], [0.18, 0.14], [0.2, 0.28], [0.14, 0.42], [0.07, 0.48], [0.08, 0.56], [0.0, 0.56]].map(([a, b]) => new THREE.Vector2(a * s, b * s));
    M.add(new THREE.LatheGeometry(pts, 7), col, mtx(x, 0, z), 0.06, 3);
    M.cyl(0.11 * s, 0.11 * s, 0.03 * s, 7, '#E2D1AE', x, 0.3 * s, z, 0);
  }
  function grainBowl(M, x, y, z, s = 1) {
    M.cyl(0.24 * s, 0.15 * s, 0.13 * s, 8, '#8E4E2C', x, y + 0.065 * s, z, 0.05);
    M.add(new THREE.ConeGeometry(0.22 * s, 0.16 * s, 8), '#D8AE55', mtx(x, y + 0.2 * s, z), 0.08, 3);
  }
  function sheaf(M, x, z, s = 1, lean = 0) {
    const rng = FW.rng(Math.round(x * 100 + z * 37 + 5));
    for (let i = 0; i < 11; i++) { const a = rng() * 6.283, r = rng() * 0.07; const tilt = 0.08 + rng() * 0.14; M.add(new THREE.CylinderGeometry(0.012 * s, 0.018 * s, 1.0 * s, 3), i % 2 ? '#C99A45' : '#B78A3C', mtx(x + Math.cos(a) * r, 0.5 * s, z + Math.sin(a) * r, Math.sin(a) * tilt, 0, -Math.cos(a) * tilt + lean), 0.05, 3); }
    for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 0.05 + (i % 3) * 0.04; M.add(new THREE.ConeGeometry(0.04 * s, 0.2 * s, 4), '#E0B65E', mtx(x + Math.cos(a) * r * s + lean * 0.9, 1.02 * s, z + Math.sin(a) * r * s, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4), 0.08, 3); }
    M.cyl(0.09 * s, 0.09 * s, 0.06 * s, 6, '#7A4E2A', x, 0.55 * s, z, 0);
  }
  function fruit(M, x, y, z, rng) { const cols = ['#9C3A2E', '#C8702E', '#5A2E4E', '#7A8A3A']; for (let i = 0; i < 7; i++) { const a = rng() * 6.283, r = rng() * 0.12; M.add(new THREE.IcosahedronGeometry(0.045 + rng() * 0.03, 0), cols[Math.floor(rng() * 4)], mtx(x + Math.cos(a) * r, y + 0.05 + rng() * 0.05, z + Math.sin(a) * r), 0.06, 3); } }

  // ---------------- people ----------------
  // PP2 (the Ep 1 cast) when it has loaded; otherwise PP stand-ins drawn the same way
  const PPn = () => globalThis.PP2;
  const sizeOf = (kind, f = 1) => { const s = PPn() && PPn().SIZES && PPn().SIZES[kind]; return s ? { cw: Math.round(s.cw * f), ch: Math.round(s.ch * f), worldH: s.worldH, footPx: s.footPx * f, scale: s.scale * f } : null; };
  function bill(kind, f, fallback) {
    const sz = PPn() && PPn()[kind] ? sizeOf(kind, f) : null;
    if (sz) return LW.billboard({ cw: sz.cw, ch: sz.ch, worldH: sz.worldH, footPx: sz.footPx, draw: (ctx, st) => { ctx.translate(sz.cw / 2, sz.ch - sz.footPx); ctx.scale(sz.scale, sz.scale); PPn()[kind](ctx, st); } });
    return fallback();
  }
  const SAM_H = 1.86;
  function makeSamson() {
    return bill('samson', 1, () => LW.billboard({ cw: 1500, ch: 1640, worldH: SAM_H * 1640 / 1400, footPx: 60, draw: (ctx, st) => {
      ctx.translate(750, 1580); ctx.scale(2.5, 2.5);
      const pose = st.pose; // stand-in mapping onto PP.samson
      const o = { t: st.t, rim: st.gold, look: st.look, strain: pose === 'push' ? 1 : pose === 'pray' ? 0.25 : 0, burst: pose === 'pray' ? 0.62 : pose === 'push' ? 0.5 : 0 };
      if (pose === 'walk') ctx.translate(0, -Math.abs(Math.sin(st.phase || 0)) * 6);
      PP.samson(ctx, o);
    } }));
  }
  function makeBoy() {
    return bill('boy', 1, () => LW.billboard({ cw: 420, ch: 560, worldH: 1.42 * 560 / 450, footPx: 16, draw: (ctx, st) => { ctx.translate(210, 544); ctx.scale(0.75, 0.75); PP.judean(ctx, { robe: '#B9A27E', cloth: '#E4D3B0', stripe: '#8A6646', beard: '#00000000', skin: '#C08458', hand: st.pose === 'lead' ? 0.4 : 0, look: [-0.6, 0] }); } }));
  }
  const LORD_COLS = [{ robe: '#7A2A22' }, { robe: '#3E4E6E' }, { robe: '#5A2E4E' }, { robe: '#8A6A2E' }, { robe: '#2E5A4E' }];
  function makeLord(i) {
    return bill('lord', 0.62, () => LW.billboard({ cw: 340, ch: 460, worldH: 1.85 * 460 / 330, footPx: 14, draw: (ctx, st) => { ctx.translate(170, 446); ctx.scale(0.5, 0.5); PP.soldier(ctx, { kilt: LORD_COLS[i % 5].robe, trim: '#E2B65A', raise: st.pose === 'laugh' ? 0.8 : st.pose === 'fall' ? 1 : 0, spearSide: -1, shout: st.pose === 'laugh' ? 1 : 0.4 }); } }));
  }
  function makeGuard(v) {
    const o = [{ spearSide: 1 }, { spearSide: -1, kilt: '#B24A32', trim: '#E4D3B0' }][v % 2];
    const bb = LW.billboard({ cw: 340, ch: 460, worldH: 1.8 * 460 / 330, footPx: 14, draw: (ctx) => { ctx.translate(170, 446); ctx.scale(0.5, 0.5); PP.soldier(ctx, Object.assign({ shout: 0.3 }, o)); } });
    bb.userData.update('x'); return bb;
  }
  // the crowd shares a few pre-painted textures: variant v (0..11) x pose
  const CROWD_POSES = ['cheer', 'stand', 'fall'];
  const crowdTex = {};
  let crowdGeo = null, crowdDims = null;
  const PCOL = [{ robe: '#9C3A26', cloth: '#E2D1AE' }, { robe: '#D8C6A0', cloth: '#9C3A26' }, { robe: '#6E4A8A', cloth: '#D9C9A6' }, { robe: '#B88A4A', cloth: '#E8DCC4' }, { robe: '#3E5A7A', cloth: '#D8C6A0' }, { robe: '#C2502E', cloth: '#F2E6CF' },
    { robe: '#7A5A3E', cloth: '#C9A273' }, { robe: '#A8432C', cloth: '#2A1E16' }, { robe: '#E4D3B0', cloth: '#B5452B' }, { robe: '#5E6E3A', cloth: '#E2D1AE' }, { robe: '#8E3A4E', cloth: '#E8C27A' }, { robe: '#C9963E', cloth: '#6B4A33' }];
  function makeCrowdTextures() {
    const sz = PPn() && PPn().person ? Object.assign(sizeOf('person', 0.8), { cw: Math.round(PPn().SIZES.person.cw * 0.8 * 0.72) }) : null;
    const dims = sz ? sz : { cw: 252, ch: 336, worldH: 1.72 * 560 / 450, footPx: 10, scale: 0.45 };
    crowdDims = dims;
    for (let v = 0; v < 12; v++) for (const pose of CROWD_POSES) {
      crowdTex[v + pose] = paint(dims.cw, dims.ch, (ctx) => {
        ctx.translate(dims.cw / 2, dims.ch - dims.footPx); ctx.scale(dims.scale, dims.scale);
        if (sz) { if (v >= 6) ctx.scale(-1, 1); PPn().person(ctx, { v: 6 + (v % 6), pose, t: v * 0.37, k: 0.45, dir: v % 2 ? 1 : -1 }); }
        else { PP.judean(ctx, Object.assign({ skin: FW.SKIN[v % 5], hand: pose === 'cheer' ? 1 : 0, look: [0, 0.4], beard: v % 3 === 0 ? '#2E2118' : '#00000000' }, PCOL[v])); }
      });
    }
    const pxPerU = dims.ch / dims.worldH, w = dims.cw / pxPerU;
    crowdGeo = new THREE.PlaneGeometry(w, dims.worldH); crowdGeo.translate(0, dims.worldH / 2 - dims.footPx / pxPerU, 0);
  }
  function crowdMesh(v, s = 1) {
    const mat = new THREE.MeshBasicMaterial({ map: crowdTex[v + 'cheer'], transparent: true, alphaTest: 0.05, depthWrite: true, side: THREE.DoubleSide });
    crowdMats.push(mat);
    const m = new THREE.Mesh(crowdGeo, mat); m.scale.setScalar(s);
    m.userData = { v, s, pose: 'cheer', face: (cam) => { m.rotation.y = Math.atan2(cam.position.x - m.position.x, cam.position.z - m.position.z); } };
    m.userData.setPose = (p) => { if (m.userData.pose !== p) { m.userData.pose = p; mat.map = crowdTex[v + p]; } };
    return m;
  }
  const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
  function contactShadow(obj, r = 0.45) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobTex), transparent: true, depthWrite: false, color: 0x1a1210, opacity: 0.85 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m); contact.push([m, obj]);
  }

  // ---------------- particles with normal (not additive) blending: dust, sand, haze ----------------
  function sprites(n, blending = THREE.NormalBlending) {
    const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3), a = new Float32Array(n), s = new Float32Array(n), c = new Float32Array(n * 3);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(a, 1)); g.setAttribute('psize', new THREE.BufferAttribute(s, 1)); g.setAttribute('tint', new THREE.BufferAttribute(c, 3));
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: LW.dotTex() }, scale: { value: 1000 } },
      vertexShader: 'attribute float alpha; attribute float psize; attribute vec3 tint; uniform float scale; varying float vA; varying vec3 vC; void main(){ vA = alpha; vC = tint; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = min(psize * scale / -mv.z, 460.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ float m = texture2D(map, gl_PointCoord).a; if (vA * m < 0.004) discard; gl_FragColor = vec4(vC, vA * m); }',
      transparent: true, depthWrite: false, blending, fog: false, toneMapped: false });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6;
    const v = new THREE.Vector3(), col = new THREE.Color();
    pts.userData.update = (fn) => { for (let i = 0; i < n; i++) { const r = fn(i, v, col); if (!r) { p[i * 3 + 1] = -99; a[i] = 0; continue; } p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z; a[i] = r.alpha; s[i] = r.size; c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
      g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.psize.needsUpdate = true; g.attributes.tint.needsUpdate = true; };
    return pts;
  }

  // ---------------- the timeline: every time comes from the two shots' beats ----------------
  function timeline() {
    const s29 = S.SHOTS.find((s) => s.scene === 'dagon' && s.v === 'pillars'), s30 = S.SHOTS.find((s) => s.scene === 'dagon' && s.beats && s.beats.house != null) || S.SHOTS.find((s) => s.scene === 'dagon' && s.v === 'fall');
    const sdEnd = S.SHOTS.filter((s) => s.scene === 'dagon' && /^sd/.test(s.v)).reduce((m, s) => Math.max(m, s.t1), 0);
    const b = s30.beats;
    const tH = b.house, tF = b.fell;
    return {
      s29, s30, t0: s29.t0, blind: s29.beats.blind, prayed: s29.beats.prayed, remember: s29.beats.remember, strengthen: s29.beats.strengthen,
      called: b.called, answered: b.answered, tH, tF, end: sdEnd || s30.t1, grip: b.grip ?? b.answered - 0.75, lean0: sdEnd ? b.answered : null,
      push: b.answered + 0.22,                     // he bows with all his strength
      creak: b.answered + 0.55,                    // the pillars begin to creak (dust trickles)
      give: tH - 0.02,                             // the middle pillars give on "house"
      land: tF - 0.07,                             // the middle roof comes down on "fell"
    };
  }

  // ---------------- the set ----------------
  function build() {
    T = timeline();
    usingPP2 = !!(PPn() && PPn().samson);
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(C('#232A40'), 17, 52);
    scene.add(LW.sky({ top: '#0B1120', mid: '#18223C', hor: '#3C4466', low: '#232A40', sunDir: [-0.55, 0.22, -0.8], sunCol: '#8FA4D8', sunAmt: 0.35 }));
    hemi = new THREE.HemisphereLight(C('#6274A4'), C('#2E2A2E'), 1.05); scene.add(hemi);
    // the key: cold dusk light from the upper left, in under the front of the roof
    sun = new THREE.DirectionalLight(C('#A8BCE4'), 2.1);
    sun.position.set(-7.5, 8.2, 10.5); sun.target.position.set(0.6, 0, -2.4);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -11; sc.right = 11; sc.top = 11; sc.bottom = -11; sc.near = 1; sc.far = 45;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    // God's light: gold, from the upper left, off until "answered" (a faint promise on "strengthen")
    spot = new THREE.SpotLight(C('#FFC766'), 0, 32, 0.13, 0.55, 1.1);
    spot.position.set(-5.2, 9.6, 6.8); spot.target.position.set(0, 1.0, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0006;
    scene.add(spot, spot.target);
    pool = LW.pool(1.25, '#FFC86E'); pool.position.set(0, 0.03, 0.05); scene.add(pool);

    // ---- floor: flagstones, the court in front and the hall behind ----
    {
      const cell = 0.9, nx = 30, nz = 34, im = new THREE.InstancedMesh(new THREE.BoxGeometry(cell - 0.05, 0.12, cell - 0.05), flatMat({ color: 0xffffff }), nx * nz);
      const rng = FW.rng(11), c = new THREE.Color(); let i = 0;
      for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
        const x = (a - nx / 2 + 0.5) * cell + ((b % 2) * cell * 0.5), z = 18 - (b + 0.5) * cell;
        im.setMatrixAt(i, mtx(x, -0.06 + (rng() - 0.5) * 0.014, z, (rng() - 0.5) * 0.012, (rng() - 0.5) * 0.04, (rng() - 0.5) * 0.012, 1 - rng() * 0.06, 1, 1 - rng() * 0.06));
        const hall = z < PZ + 0.5;
        c.set(STONE[Math.floor(rng() * 4)]); c.offsetHSL(0, -0.04, (rng() - 0.5) * 0.07 - (hall ? 0.06 : 0)); im.setColorAt(i, c); i++;
      }
      im.receiveShadow = true; im.castShadow = false; scene.add(im);
      const mortar = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), flatMat({ color: C('#4A3E32') })); mortar.rotation.x = -Math.PI / 2; mortar.position.set(0, -0.035, 0); mortar.receiveShadow = true; scene.add(mortar);
    }

    const M = Merger(5);         // static stone + plaster
    const tex = [bannerTex(1), bannerTex(2)];
    // ---- static pillars: the far front pair and the hall colonnade ----
    const pillar = (Mx, x, z, h = H_CAP) => {
      Mx.box(0.82, 0.14, 0.82, '#9C8A6E', x, 0.07, z); Mx.cyl(0.36, 0.38, 0.26, 8, STONE[0], x, 0.27, z);
      Mx.cyl(DRUM_R, DRUM_R + 0.01, H_CAP0 - H_BASE, 8, STONE[1], x, (H_CAP0 + H_BASE) / 2, z, 0.05);
      Mx.cyl(0.29, 0.26, 0.1, 8, STONE[2], x, H_CAP0 + 0.05, z); Mx.box(0.7, 0.28, 0.7, STONE[3], x, H_CAP0 + 0.24, z);
    };
    for (const s of [-1, 1]) { pillar(M, s * FXP, PZ); for (const z of [-3.6, -7.2]) { pillar(M, s * OX, z); pillar(M, s * FXP, z); } }
    // ---- the walls of the hall (darker inside), a painted dado and frieze ----
    M.box(14.2, 6.2, 0.6, PLASTER_D, 0, 3.1, BACK_Z - 0.3, 0, 0.04);
    for (const s of [-1, 1]) M.box(0.6, 6.2, 11.6, PLASTER_D, s * (WALL_X + 0.3), 3.1, (BACK_Z + PZ) / 2 - 0.2, 0, 0.04);
    M.box(14.0, 0.34, 0.08, RED, 0, 1.1, BACK_Z + 0.02, 0, 0.03); M.box(14.0, 0.1, 0.09, CREAM, 0, 1.32, BACK_Z + 0.02, 0, 0.02);
    for (const s of [-1, 1]) { M.box(0.08, 0.34, 11.2, RED, s * WALL_X, 1.1, (BACK_Z + PZ) / 2, 0, 0.03); M.box(0.09, 0.1, 11.2, CREAM, s * WALL_X, 1.32, (BACK_Z + PZ) / 2, 0, 0.02); }
    // niche + steps for the god
    M.box(3.0, 5.0, 0.3, '#5E4E3E', 0, 2.5, BACK_Z + 0.12, 0, 0.03);
    M.box(4.2, 0.22, 2.6, STONE[2], 0, 0.11, STATUE_Z + 0.2, 0, 0.04); M.box(3.4, 0.22, 2.0, STONE[0], 0, 0.33, STATUE_Z + 0.05, 0, 0.04);
    // ---- the god: Dagon, a grain god (a simple stylised statue holding a sheaf) ----
    {
      const sx = 0, sz = STATUE_Z, y0 = 0.44;
      M.box(1.5, 0.9, 1.1, '#6E5E4A', sx, y0 + 0.45, sz, 0, 0.03); M.box(1.7, 0.1, 1.25, '#857158', sx, y0 + 0.95, sz, 0, 0.02);
      const SM = Merger(91);
      SM.cyl(0.42, 0.62, 1.6, 8, BRONZE, sx, y0 + 1.8, sz, 0.05);
      SM.box(0.98, 0.95, 0.52, BRONZE, sx, y0 + 3.05, sz, 0, 0.05);
      SM.box(1.18, 0.22, 0.56, BRONZE_D, sx, y0 + 3.48, sz, 0, 0.04);
      SM.box(0.86, 0.2, 0.26, BRONZE_D, sx, y0 + 2.86, sz + 0.34, 0, 0.04);                       // forearms across the chest
      SM.add(new THREE.IcosahedronGeometry(0.3, 0), '#7A6448', mtx(sx, y0 + 3.86, sz + 0.04, 0, 0, 0, 1, 1.15, 0.95), 0.06, 3);
      SM.add(new THREE.ConeGeometry(0.24, 0.5, 6), BRONZE_D, mtx(sx, y0 + 3.58, sz + 0.16, Math.PI, 0, 0), 0.05, 3);  // beard
      SM.cyl(0.19, 0.29, 0.62, 8, GOLDM, sx, y0 + 4.4, sz, 0.06); SM.cyl(0.31, 0.31, 0.07, 8, '#E2B65A', sx, y0 + 4.12, sz, 0.02);
      SM.add(new THREE.ConeGeometry(0.1, 0.22, 6), '#E2B65A', mtx(sx, y0 + 4.82, sz), 0.03, 3);
      for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.13; SM.add(new THREE.ConeGeometry(0.03, 0.95, 4), '#D8AE55', mtx(sx + Math.sin(a) * 0.34, y0 + 3.18 + Math.cos(a) * 0.36, sz + 0.44, 0.12, 0, -a), 0.08, 3);
        SM.add(new THREE.ConeGeometry(0.06, 0.24, 4), '#E9C066', mtx(sx + Math.sin(a) * 0.72, y0 + 3.62 + Math.cos(a) * 0.36, sz + 0.46, 0.12, 0, -a), 0.08, 3); }
      // the figure is its own mesh, pivoting on the front edge of its base: it goes over with the house
      statue = SM.mesh({ offset: [sx, y0 + 1.0, sz + 0.5] }); statue.position.set(sx, y0 + 1.0, sz + 0.5); scene.add(statue);
    }
    // offerings before the god and in the hall
    {
      const rng = FW.rng(23);
      M.box(2.4, 0.08, 0.8, '#7A5A3E', 0, 0.86, STATUE_Z + 1.55, 0, 0.03); for (const s of [-1, 1]) M.box(0.12, 0.42, 0.6, '#5E4430', s * 1.0, 0.63, STATUE_Z + 1.55, 0, 0.03);
      for (const x of [-0.8, -0.25, 0.3, 0.85]) grainBowl(M, x, 0.9, STATUE_Z + 1.55, 0.8);
      fruit(M, -0.5, 0.9, STATUE_Z + 1.4, rng); fruit(M, 0.6, 0.9, STATUE_Z + 1.45, rng);
      for (const [x, z] of [[-1.9, STATUE_Z + 1.1], [-2.3, STATUE_Z + 0.6], [1.9, STATUE_Z + 1.0], [2.25, STATUE_Z + 0.5]]) sheaf(M, x, z, 1.1, x < 0 ? 0.08 : -0.08);
      for (const [x, z, s] of [[-1.5, STATUE_Z + 2.3, 1.2], [-1.2, STATUE_Z + 2.6, 0.9], [1.4, STATUE_Z + 2.4, 1.1], [1.7, STATUE_Z + 2.1, 1.3]]) jar(M, x, z, s);
      // the court: an offering table on the right, jars and grain left
      M.box(1.3, 0.07, 0.62, '#76563C', 1.95, 0.78, 2.9, -0.2, 0.03); for (const [dx, dz] of [[-0.55, -0.22], [0.55, -0.22], [-0.55, 0.22], [0.55, 0.22]]) M.box(0.07, 0.75, 0.07, '#5A3F2C', 1.95 + dx * 0.98 + dz * 0.2, 0.39, 2.9 + dz - dx * 0.2, -0.2, 0.02);
      grainBowl(M, 1.65, 0.82, 2.95, 0.85); grainBowl(M, 2.2, 0.82, 2.8, 0.7); fruit(M, 2.05, 0.82, 3.05, rng);
      for (const [x, z, s] of [[-2.25, 2.4, 1.25], [-2.6, 2.8, 1.0], [-1.95, 2.85, 0.85], [2.75, 1.7, 1.15]]) jar(M, x, z, s, s > 1.1 ? '#9A5A36' : '#B8794A');
      sheaf(M, -2.85, 1.9, 1.0, 0.1); sheaf(M, 3.1, 2.3, 1.0, -0.1);
    }
    // braziers (Philistine ember light sits screen right) and torches
    const fireM = Merger(9);
    scene.add(brazier(fireM, 1.95, -1.35, 1.05, 1.1));         // by the lords
    scene.add(brazier(fireM, -1.15, STATUE_Z + 2.0, 1.0, 1.0));
    scene.add(brazier(fireM, 1.15, STATUE_Z + 2.0, 1.0, 1.0));
    scene.add(brazier(fireM, 2.35, 4.2, 1.1, 1.2));             // in the court, foreground right
    scene.add(torch(fireM, -OX + 0.3, 2.35, PZ + 0.16, 1));
    scene.add(torch(fireM, OX - 0.3, 2.35, PZ + 0.16, -1));
    for (const z of [-3.6, -7.2]) { scene.add(torch(fireM, -OX + 0.3, 2.4, z + 0.12, 1)); scene.add(torch(fireM, OX - 0.3, 2.4, z + 0.12, -1)); }
    scene.add(fireM.mesh());
    // two real fire lights (the lords' brazier, the god's braziers); the others are faked with warm floor glows (cheap)
    for (const [x, y, z, i, d] of [[1.95, 1.6, -1.35, 5.5, 7], [0, 1.0, STATUE_Z + 2.2, 9, 7]]) {
      const L = new THREE.PointLight(C('#FF9A52'), i, d, 1.6); L.position.set(x, y, z); L.userData.base = i; scene.add(L); fireLights.push(L);
    }
    for (const [x, z, r, o] of [[2.35, 4.2, 2.0, 0.22], [-OX + 0.3, PZ + 0.6, 1.4, 0.14], [OX - 0.3, PZ + 0.6, 1.4, 0.14], [-OX + 0.3, -3.3, 1.3, 0.12], [OX - 0.3, -3.3, 1.3, 0.12]]) {
      const g = LW.pool(r, '#FF9A52'); g.position.set(x, 0.025, z); g.material.opacity = o; g.userData.base = o; scene.add(g); fireGlows.push(g);
    }
    // hanging banners on the outer pillars and before the god
    for (const s of [-1, 1]) {
      scene.add(banner(tex[0], s * OX, H_CAP0 + 0.06, PZ + 0.37, 0.62, 2.3));
      scene.add(banner(tex[1], s * FXP, H_CAP0 + 0.06, PZ + 0.37, 0.62, 2.3));
      scene.add(banner(tex[1], s * 1.85, 4.6, BACK_Z + 0.35, 0.8, 3.0));
      scene.add(banner(tex[0], s * OX, H_CAP0 + 0.06, -7.2 + 0.37, 0.55, 2.0));
    }
    // a pole banner in the court, foreground left (soft in the depth of field)
    { const b = LW.banner(FW.rng(4), 1.25, RED); b.position.set(-2.55, 0, 4.3); b.rotation.y = 0.4; scene.add(b); }
    const statics = M.mesh(); scene.add(statics);
    // the city of Gaza beyond the roof (blue silhouettes in the haze)
    { const B = Merger(31), rng = FW.rng(31); for (let i = 0; i < 22; i++) { const x = -24 + i * 2.3 + rng() * 1.2, h = 6 + rng() * 6, z = -26 - rng() * 10; B.box(1.6 + rng() * 2, h, 2 + rng() * 2, '#3E4660', x, h / 2, z, rng() * 0.3, 0.04); if (rng() < 0.4) B.box(0.9, 1.6, 0.9, '#3A425A', x, h + 0.8, z, 0, 0.03); } const m = B.mesh({ cast: false }); scene.add(m); }

    // ---- the roof: the lintel, beams, slab, parapet; the front two strips come down in pieces ----
    const XS = [-WALL_X, -OX, 0, OX, WALL_X];
    const roofPiece = (x0, x1, z0, z1, front, seed) => {
      const R = Merger(seed), cx = (x0 + x1) / 2, w = x1 - x0;
      if (front) { R.box(w, H_LIN - H_CAP, 0.58, WOOD, cx, (H_CAP + H_LIN) / 2, PZ, 0, 0.05); R.box(w, 0.06, 0.62, '#4A3424', cx, H_CAP + 0.03, PZ, 0, 0.02); }
      else R.box(w, H_LIN - H_CAP, 0.5, WOOD, cx, (H_CAP + H_LIN) / 2, z0, 0, 0.05);
      for (let x = x0 + 0.28; x < x1 - 0.1; x += 0.56) R.cyl(0.09, 0.09, z1 - z0 + (front ? 0.22 : 0), 6, x % 1.12 < 0.56 ? WOOD : WOOD_L, x, H_LIN + 0.09, (z0 + z1) / 2 + (front ? 0.11 : 0), 0.05, 0, Math.PI / 2);
      R.box(w, H_ROOF - H_SLAB, z1 - z0, '#8E7A62', cx, (H_SLAB + H_ROOF) / 2, (z0 + z1) / 2, 0, 0.04);
      R.box(w, H_SLAB - H_LIN - 0.0, z1 - z0, '#6E5A46', cx, (H_LIN + H_SLAB) / 2, (z0 + z1) / 2, 0, 0.03);
      if (front) {
        R.box(w, 0.2, 0.08, RED, cx, H_SLAB + 0.02, z1 + 0.02, 0, 0.03); R.box(w, 0.05, 0.09, CREAM, cx, H_SLAB + 0.15, z1 + 0.02, 0, 0.02);
        R.box(w, H_PARA - H_ROOF, 0.2, '#A28E72', cx, (H_ROOF + H_PARA) / 2, z1 - 0.1, 0, 0.05); R.box(w, 0.05, 0.26, CREAM, cx, H_PARA + 0.02, z1 - 0.1, 0, 0.02);
        for (let x = x0 + 0.15; x < x1; x += 0.45) R.box(0.16, 0.12, 0.22, '#B5A084', x, H_PARA + 0.1, z1 - 0.1, 0, 0.04);
        for (let r = 1; r < ROWS.length; r++) { const zf = ROWS[r][0] + 0.26, d = zf - z0; R.box(w, TIER, d, r % 2 ? '#857260' : '#7A6856', cx, H_ROOF + (r - 0.5) * TIER, zf - d / 2, 0, 0.04); R.box(w, 0.04, 0.05, CREAM, cx, H_ROOF + r * TIER - 0.03, zf + 0.02, 0, 0.02); }
      }
      return R;
    };
    for (let si = 0; si < STRIPS.length; si++) {
      const [z0, z1] = STRIPS[si];
      for (let i = 0; i < 4; i++) {
        const x0 = XS[i], x1 = XS[i + 1], mid = i === 1 || i === 2, s = (x0 + x1) / 2 < 0 ? -1 : 1;
        const pivot = mid ? [s * OX, H_CAP, (z0 + z1) / 2] : [s * WALL_X, H_CAP, (z0 + z1) / 2];
        const R = roofPiece(x0, x1, z0, z1, si === 0, 100 + si * 10 + i);
        const mesh = R.mesh({ offset: pivot }); mesh.position.set(...pivot); scene.add(mesh);
        // timing: the middle pieces sag as the pillars go, then drop and land on "fell"; the outer ones follow, hinged at the walls
        const delay = si * 0.11;
        const p = { mesh, pivot, s, mid, si, z0, z1, x0, x1, lenX: Math.abs(x1 - x0) };
        if (mid) { p.drop = H_CAP - 0.95; p.fallT = Math.sqrt(2 * p.drop / G); p.sagT = 0.16; p.tS = T.land + delay - p.fallT - p.sagT; }
        else { p.tS = T.give + 0.5 + delay; p.sagT = 0.5; p.drop = H_CAP - 0.8; p.fallT = Math.sqrt(2 * p.drop / G); }
        p.rock = sr(si * 4 + i, 3) * 0.08;
        pieces.push(p);
      }
    }

    // ---- the breaking pillars: the two middle ones (Samson's) and the outer front pair, drum by drum ----
    {
      const dg = LW.jitter(new THREE.CylinderGeometry(DRUM_R, DRUM_R + 0.008, DRUM_H - 0.012, 8), 0.025, FW.rng(3));
      drumsIM = new THREE.InstancedMesh(dg, flatMat({ color: 0xffffff }), 4 * N_DRUM); drumsIM.castShadow = true; drumsIM.receiveShadow = true; scene.add(drumsIM);
      const capG = (() => { const R = Merger(77); R.cyl(0.29, 0.26, 0.1, 8, '#FFFFFF', 0, 0.05, 0, 0); R.box(0.7, 0.28, 0.7, '#FFFFFF', 0, 0.24, 0, 0, 0); return R.geometry(); })();
      capsIM = new THREE.InstancedMesh(capG, flatMat({ vertexColors: true, color: 0xffffff }), 4); capsIM.castShadow = true; capsIM.receiveShadow = true; scene.add(capsIM);
      const baseM = Merger(78);
      const c = new THREE.Color();
      [[-1, PX, 0], [1, PX, 0], [-1, OX, 1], [1, OX, 1]].forEach(([s, ax, outer], pi) => {
        const x = s * ax; baseM.box(0.82, 0.14, 0.82, '#9C8A6E', x, 0.07, PZ); baseM.cyl(0.36, 0.38, 0.26, 8, STONE[0], x, 0.27, PZ);
        for (let k = 0; k <= N_DRUM; k++) {
          const id = pi * (N_DRUM + 1) + k, cap = k === N_DRUM;
          const y0 = cap ? H_CAP0 : H_BASE + (k + 0.5) * DRUM_H;
          // release: outer pillars go later and fall inward (dragged by the roof); the middle pair kick outward at mid-height
          const midK = 1 - Math.abs(k - 3) / 3.5;
          const rel = outer ? T.give + 0.42 + (N_DRUM - k) * 0.025 + hsh(id, 1) * 0.04 : T.give + (k <= 1 ? 0.12 + (1 - k) * 0.05 : k <= 4 ? 0.0 + hsh(id, 1) * 0.04 : 0.05 + (k - 4) * 0.025);
          const dirX = outer ? -s : s;
          const v = outer ? [dirX * (0.5 + 0.6 * hsh(id, 2)) * (k / N_DRUM), 0.1, 0.3 + hsh(id, 3) * 0.6] : [dirX * (k === 0 ? 0.25 : 0.6 + 2.2 * midK + hsh(id, 2) * 0.6), (k >= 2 && k <= 4) ? 0.5 + hsh(id, 4) * 0.5 : 0.1, 0.15 + sr(id, 3) * 0.7];
          const w = [sr(id, 5) * 3, sr(id, 6) * 2, -dirX * (2 + hsh(id, 7) * 4) * (k === 0 ? 0.4 : 1)];
          const rest = cap ? 0.2 : DRUM_R;
          const land = (v[1] + Math.sqrt(v[1] * v[1] + 2 * G * Math.max(0.01, y0 - rest))) / G;
          drums.push({ id, s, x, k, cap, y0, rel, v, w, land, rest, outer, pi });
          if (!cap) { c.set(STONE[(k + pi) % 4]); c.offsetHSL(0, -0.02, sr(id, 8) * 0.03); drumsIM.setColorAt(pi * N_DRUM + k, c); }
          else { c.set(STONE[3]); capsIM.setColorAt(pi, c); }
        }
      });
      drumsIM.instanceColor.needsUpdate = true; capsIM.instanceColor.needsUpdate = true;
      scene.add(baseM.mesh());
    }

    // ---- rubble (falling stones) ----
    {
      const rg = LW.jitter(new THREE.IcosahedronGeometry(0.5, 0), 0.3, FW.rng(8));
      rubble = new THREE.InstancedMesh(rg, flatMat({ color: 0xffffff }), 90); rubble.castShadow = true; rubble.receiveShadow = true; scene.add(rubble);
      const c = new THREE.Color();
      for (let i = 0; i < 90; i++) {
        let o, v, tb, sz;
        if (i < 34) { o = [sr(i, 1) * 0.5, H_LIN - 0.1, lerp(-3.2, 0.8, hsh(i, 2))]; v = [sr(i, 3) * 0.8, -0.2, sr(i, 4) * 0.5]; tb = T.give + 0.04 + hsh(i, 5) * 0.5; sz = 0.08 + hsh(i, 6) * 0.2; }           // through the opening seam
        else if (i < 66) { const x = sr(i, 1) * 2.4; o = [x, H_PARA - hsh(i, 2) * 0.5, ROOF_FRONT - 0.05]; v = [sr(i, 3) * 0.6 - Math.sign(x) * 0.5, 0.4 * hsh(i, 4), 0.6 + hsh(i, 5) * 1.6]; tb = T.give + 0.25 + hsh(i, 6) * 0.45; sz = 0.1 + hsh(i, 7) * 0.22; } // off the front edge, toward us
        else { const s = i % 2 ? 1 : -1; o = [s * (PX + 0.1), 1.0 + hsh(i, 2) * 2.4, PZ + 0.1]; v = [s * (0.8 + hsh(i, 3) * 2), 0.6 * hsh(i, 4), sr(i, 5) * 0.8 + 0.4]; tb = T.give + hsh(i, 6) * 0.15; sz = 0.05 + hsh(i, 7) * 0.12; } // chips off the pillars
        const land = (v[1] + Math.sqrt(v[1] * v[1] + 2 * G * Math.max(0.01, o[1] - sz * 0.4))) / G;
        rubList.push({ o, v, tb, sz, land, w: [sr(i, 8) * 6, sr(i, 9) * 6, sr(i, 10) * 6] });
        c.set(STONE[i % 4]); c.offsetHSL(0, 0, sr(i, 11) * 0.06); rubble.setColorAt(i, c);
      }
      rubble.instanceColor.needsUpdate = true;
    }

    // ---- dust: low-poly puffs (they occlude, so figures topple out of view into them) ----
    {
      const pg = LW.jitter(new THREE.IcosahedronGeometry(1, 1), 0.2, FW.rng(12));
      { const p = pg.attributes.position, n = pg.attributes.normal, v = new THREE.Vector3(), f = new THREE.Vector3(), cols = new Float32Array(p.count * 3);
        for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); f.set(n.getX(i), n.getY(i), n.getZ(i)); f.lerp(v, 0.7).normalize(); n.setXYZ(i, f.x, f.y, f.z); const k = 0.48 + 0.52 * smooth((v.y + 1) / 2); cols[i * 3] = k; cols[i * 3 + 1] = k * 0.98; cols[i * 3 + 2] = k * 0.96; }
        n.needsUpdate = true; pg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); }
      // soft-edged dust: lit by the cold key and God's gold, its rim fading out (alpha from the view angle), drawn after the figures
      const dustMat = new THREE.ShaderMaterial({
        uniforms: { keyDir: { value: new THREE.Vector3(0, 1, 0) }, keyCol: { value: new THREE.Color() }, goldDir: { value: new THREE.Vector3(0, 1, 0) }, goldCol: { value: new THREE.Color() }, amb: { value: new THREE.Color() }, tint: { value: new THREE.Color(1, 1, 1) } },
        vertexShader: `attribute vec3 color; varying vec3 vN; varying vec3 vV; varying vec3 vC; varying float vS;
          void main(){ vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vV = normalize(cameraPosition - wp.xyz);
            vC = instanceColor; vS = color.r; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: `uniform vec3 keyDir, keyCol, goldDir, goldCol, amb, tint; varying vec3 vN; varying vec3 vV; varying vec3 vC; varying float vS;
          void main(){ vec3 n = normalize(vN); float f = abs(dot(n, normalize(vV)));
            float a = smoothstep(0.04, 0.62, f);
            vec3 l = (amb + keyCol * (0.3 + 0.7 * max(dot(n, keyDir), 0.0)) + goldCol * max(dot(n, goldDir) * 0.85 + 0.15, 0.0)) * vS;
            gl_FragColor = vec4(vC * tint * l, a); }`,
        transparent: true, depthWrite: false, toneMapped: false, fog: false });
      puffs = new THREE.InstancedMesh(pg, dustMat, 620); puffs.castShadow = false; puffs.receiveShadow = false; puffs.renderOrder = 5; puffs.frustumCulled = false; scene.add(puffs);
      const add = (tb, o, v, s1, rise, drag = 3, grow = 3.2) => { if (puffList.length < 620) puffList.push({ tb, o, v, s1, rise, drag, grow, n: puffList.length }); };
      let n = 0;
      // the middle pillars burst at the joints
      for (const s of [-1, 1]) for (let k = 1; k <= 6; k++) for (let j = 0; j < 2; j++, n++) add(T.give + 0.03 + hsh(n, 1) * 0.12, [s * PX + s * 0.12, H_BASE + k * DRUM_H + sr(n, 9) * 0.15, PZ + 0.1 + sr(n, 2) * 0.15], [s * (1.4 + hsh(n, 3) * 1.8), 0.1 + hsh(n, 4) * 0.4, 0.3 + sr(n, 5) * 0.9], 0.14 + hsh(n, 6) * 0.2, 0.2, 3.5, 3.5);
      // dust shaken off the roof as it breaks: it hangs where the crowd stood while the roof drops out beneath it
      pieces.forEach((p) => { if (p.si !== 0) return; const cnt = p.mid ? 22 : 12; for (let j = 0; j < cnt; j++, n++) add(Math.min(p.tS, T.give + 0.1) + 0.06 + hsh(n, 1) * 0.3, [lerp(p.x0, p.x1, hsh(n, 2)), H_ROOF + 0.15 + hsh(n, 3) * 0.55, lerp(-0.6, ROOF_FRONT, hsh(n, 4))], [sr(n, 5) * 0.6, -0.4 - hsh(n, 6) * 0.6, 0.3 + hsh(n, 7) * 0.5], 0.24 + hsh(n, 8) * 0.3, -1.5, 3, 3.6); });
      // around him: dust pours down from the opening seam and swallows him before the roof comes down
      for (let j = 0; j < 34; j++, n++) add(T.give + 0.03 + Math.pow(hsh(n, 1), 1.5) * 0.36, [sr(n, 2) * 0.8, 0.2 + hsh(n, 3) * 1.85, PZ + 0.25 + sr(n, 4) * 0.35], [sr(n, 5) * 0.5, 0.1, 0.25 + hsh(n, 6) * 0.5], 0.42 + hsh(n, 7) * 0.36, 0.15, 3, 4.5);
      // low at his feet, so nothing of him shows under the cloud
      for (let j = 0; j < 10; j++, n++) add(T.give + 0.04 + hsh(n, 1) * 0.2, [sr(n, 2) * 0.55, 0.12 + hsh(n, 3) * 0.3, 0.05 + hsh(n, 4) * 0.5], [sr(n, 5) * 0.6, 0.15, 0.3 + hsh(n, 6) * 0.5], 0.42 + hsh(n, 7) * 0.22, 0.1, 3, 5);
      // drums landing
      drums.forEach((d, j) => { if (d.cap && d.outer) return; const tl = d.rel + d.land; if (tl > T.end + 0.2) return; for (let r = 0; r < 1; r++, n++) { const p = drumPos(d, tl); add(tl - 0.02, [p[0], 0.2, p[2]], [sr(n, 1) * 1.3, 0.3, sr(n, 2) * 1.3 + 0.3], 0.3 + hsh(n, 3) * 0.3, 0.45); } });
      // the roof comes down: a wave of dust out from under every landing piece (toward the camera and sideways)
      pieces.forEach((p, pi) => {
        const tl = p.tS + p.sagT + p.fallT; if (tl > T.end + 0.3) return;
        const cnt = p.mid ? (p.si === 0 ? 62 : p.si === 1 ? 28 : 16) : 14;
        for (let j = 0; j < cnt; j++, n++) {
          const u = hsh(n, 1), edge = hsh(n, 2);
          let x = lerp(p.x0, p.x1, u), z = lerp(p.z0, p.z1 + 0.4, edge < 0.55 ? 1 - edge * 0.5 : hsh(n, 3));
          const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
          const dx = x - cx, dz = z - cz + 1.5, dl = Math.hypot(dx, dz) || 1, sp = 2.2 + hsh(n, 4) * 3.4;
          add(tl - 0.12 + hsh(n, 5) * 0.16, [x, 0.25 + hsh(n, 6) * 0.5, z], [dx / dl * sp * 0.7, 0.4 + hsh(n, 7) * 1.4, dz / dl * sp], 0.4 + 1.1 * hsh(n, 8) * hsh(n, 8), 0.5 + hsh(n, 9) * 0.9, 2.6, 3.0);
        }
      });
      // a low surge of dust rolling out across the court toward the camera
      for (let j = 0; j < 28; j++, n++) add(T.land - 0.02 + hsh(n, 1) * 0.12, [sr(n, 2) * 2.6, 0.2 + hsh(n, 3) * 0.4, 0.7 + hsh(n, 4) * 0.6], [sr(n, 5) * 1.8, 0.3 + hsh(n, 6) * 0.4, 6 + hsh(n, 7) * 5], 0.45 + hsh(n, 8) * 0.55, 0.35, 3.2, 3.2);
      // the billow that rises after the impact
      for (let j = 0; j < 44; j++, n++) add(T.land + 0.02 + hsh(n, 1) * 0.3, [sr(n, 2) * 3.2, 0.6 + hsh(n, 3) * 1.6, PZ + sr(n, 4) * 1.6], [sr(n, 5) * 1.2, 1.2 + hsh(n, 6) * 1.6, 0.4 + hsh(n, 7) * 1.2], 0.9 + hsh(n, 8) * 0.9, 1.0, 2.2, 2.4);
      const c = new THREE.Color();
      puffList.forEach((p, i) => { c.set(i % 3 ? '#D6C9B2' : '#E2D6C0'); c.offsetHSL(0, 0, sr(i, 12) * 0.04); puffs.setColorAt(i, c); });
      puffs.instanceColor.needsUpdate = true; puffs.count = puffList.length;
    }
    // soft haze sprites over the puffs, falling sand, motes in the gold light, sparks from the braziers
    haze = sprites(150); scene.add(haze);
    trickle = sprites(1050); scene.add(trickle);
    motes = LW.particles(80, '#FFE3B0', 0.035); scene.add(motes);
    embers = LW.particles(60, '#FFB24C', 0.03); scene.add(embers);
    // sand streams: from the capitals as they creak, then from the opening seam
    for (const [x, y, z, t0, t1] of [[-PX, H_CAP + 0.02, PZ + 0.32, T.creak, T.give + 0.15], [PX, H_CAP + 0.02, PZ + 0.32, T.creak + 0.15, T.give + 0.15], [0.05, H_LIN - 0.05, 0.4, T.tH - 0.35, T.land - 0.25], [-0.35, H_LIN - 0.05, -0.6, T.tH - 0.25, T.land - 0.3], [-1.5, H_LIN, 0.5, T.tH - 0.1, T.land - 0.3], [1.7, H_LIN, 0.2, T.tH - 0.15, T.land - 0.3], [0.4, H_LIN, -1.8, T.tH - 0.2, T.land - 0.3]]) streams.push({ x, y, z, t0, t1 });

    // ---- people ----
    makeCrowdTextures();
    // about three thousand on the roof: two rows along the front parapet (stylised)
    {
      const rng = FW.rng(52); let i = 0;
      ROWS.forEach(([z, off], row) => { for (let x = -6.3 + off; x < 6.4; x += 0.4) {
        const xx = x + (rng() - 0.5) * 0.12, m = crowdMesh(Math.floor(rng() * 12), 0.92 + rng() * 0.1);
        const pi = pieces.findIndex((p) => p.si === 0 && xx >= p.x0 && xx < p.x1);
        m.userData.rest = [xx, H_ROOF + row * TIER, z + (rng() - 0.5) * 0.08]; m.userData.piece = pi; m.userData.i = i++; m.userData.row = row;
        m.position.set(...m.userData.rest); scene.add(m); roofCrowd.push(m);
      } });
    }
    // men and women in the hall, behind and around the pillars
    {
      const rng = FW.rng(61);
      for (let i = 0; i < 26; i++) {
        let x = (rng() - 0.5) * 9.4, z = -2.2 - rng() * 5.4;
        if (Math.abs(x) < 1.0) x += Math.sign(x || 1) * 1.1;
        if (x > 1.0 && x < 3.0 && z > -3.2) z -= 1.4;     // leave room for the lords
        const m = crowdMesh(Math.floor(rng() * 12), 0.95 + rng() * 0.1); m.userData.rest = [x, 0, z]; m.userData.i = i; m.position.set(x, 0, z); scene.add(m); hallCrowd.push(m);
      }
    }
    // the five lords of the Philistines, in the hall to the right (Philistines sit screen right)
    [[1.38, -1.15], [1.9, -1.9], [2.55, -1.2], [1.25, -2.55], [2.95, -2.3]].forEach(([x, z], i) => {
      const L = makeLord(i); L.position.set(x, 0, z); L.userData.rest = [x, 0, z]; L.userData.i = i; scene.add(L, L.userData.caster); lords.push(L); contactShadow(L, 0.38);
    });
    [[-2.05, -1.0, 0], [3.35, -0.6, 1]].forEach(([x, z, v]) => { const g = makeGuard(v); g.position.set(x, 0, z); g.userData.rest = [x, 0, z]; scene.add(g, g.userData.caster); guards.push(g); contactShadow(g, 0.36); });
    boy = makeBoy(); scene.add(boy, boy.userData.caster); contactShadow(boy, 0.34);
    sam = makeSamson(); scene.add(sam, sam.userData.caster); contactShadow(sam, 0.5);
    { const f = sam.userData.face; sam.userData.face = (c, lean) => { f(c, lean); if (sam.userData.square) sam.rotation.y *= 0.25; }; }
  }

  // ---------------- the collapse, in closed form ----------------
  const v3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), e3 = new THREE.Euler(), s3 = new THREE.Vector3(), m4 = new THREE.Matrix4();
  // a drum's centre at time t (before its release it stands in its pillar, leaning with the strain)
  function strainLean(d, t) {
    if (d.outer) return 0;
    const k = prog(t, T.lean0 ?? T.creak, T.give, ease.in), amp = T.lean0 != null ? 0.06 : 0.022;   // sd: his push visibly drives the lean
    return d.s * (amp * k + 0.006 * Math.sin(t * 31 + d.s) * k);
  }
  function drumPos(d, t) {
    const lean = strainLean(d, Math.min(t, d.rel));
    const shove = d.outer ? 0 : d.s * (T.lean0 != null ? 0.07 : 0.03) * prog(Math.min(t, d.rel), T.lean0 ?? T.creak, T.give, ease.in) * (1 - Math.abs(d.k - 3) / 4);
    const bx = d.x + Math.sin(lean) * (d.y0 - H_BASE) + shove, by = H_BASE + (d.y0 - H_BASE) * Math.cos(lean);
    const u = t - d.rel; if (u <= 0) return [bx, by, PZ];
    const ul = Math.min(u, d.land), slide = Math.max(0, u - d.land);
    const fr = 1 - Math.exp(-slide * 6);
    return [bx + d.v[0] * ul + d.v[0] * 0.18 * fr, Math.max(d.rest, by + d.v[1] * ul - 0.5 * G * ul * ul), PZ + d.v[2] * ul + d.v[2] * 0.18 * fr];
  }
  function drumRot(d, t) {
    const lean = strainLean(d, Math.min(t, d.rel));
    const u = Math.max(0, Math.min(t - d.rel, d.land + 0.08));
    return [d.w[0] * u, d.w[1] * u, lean + d.w[2] * u];
  }
  // a roof piece: hinged sag about its outer support, then the support goes and it drops, folding into a V
  function pieceState(p, t) {
    const u = t - p.tS;
    if (u <= 0) return { pos: p.pivot, rz: 0, rx: 0, moving: false, landed: false };
    if (p.mid) {
      const ua = Math.min(u, p.sagT), th0 = 0.22 * (ua / p.sagT) * (ua / p.sagT);
      const ub = Math.max(0, u - p.sagT), uf = Math.min(ub, p.fallT), k = uf / p.fallT;
      const th = th0 + 0.26 * smooth(k);
      const y = p.pivot[1] - 0.5 * G * uf * uf;
      const landed = ub >= p.fallT, settle = landed ? 1 - Math.exp(-(ub - p.fallT) * 14) : 0;
      return { pos: [p.pivot[0] - p.s * 0.25 * k, y - settle * 0.08, p.pivot[2] + 0.35 * k], rz: p.s * th, rx: p.rock * k + 0.05 * k, moving: true, landed, k };
    }
    const th = Math.min(1.15, 0.5 * 4.2 * u * u);
    const ub = Math.max(0, u - p.sagT), uf = Math.min(ub, p.fallT);
    return { pos: [p.pivot[0], p.pivot[1] - 0.5 * G * uf * uf, p.pivot[2]], rz: p.s * th, rx: p.rock * th, moving: true, landed: ub >= p.fallT, k: th / 1.15 };
  }

  // ---------------- the action, as a function of t ----------------
  function stage(t, shot) {
    const sd = /^sd/.test(shot.v);                // Story Director variants (creative/sd_pillars): no gold, no hush, the verb on its word
    const fall = shot.v === 'fall' || sd;
    // ---- Samson: led in, hands on the pillars, prays face up; then bows with all his strength ----
    const arrive = T.prayed - 0.3, walk0 = T.blind + 0.05;
    const kw = prog(t, walk0, arrive, ease.inOut);
    const sx = lerp(-1.95, 0, kw), sz = lerp(0.62, 0, kw);
    let pose = t < arrive ? 'walk' : 'pray';
    if (t >= (sd ? T.grip : T.push)) pose = 'push';
    const gold = sd ? 0 : fall ? prog(t, T.answered - 0.05, T.answered + 0.35, ease.out) : 0.0;
    const hint = !fall ? prog(t, T.strengthen - 0.1, T.strengthen + 0.6, ease.inOut) * 0.22 : 0;
    const surge = sd ? 0 : t >= T.answered ? Math.exp(-(t - T.answered) * 2.4) : 0;
    const phase = q(kw * 2.5 * Math.PI * 2, 8);
    const look = pose === 'walk' ? [0.3, -0.1] : pose === 'pray' ? [-0.35, -0.85] : [0, 0.4];
    let kp = pose === 'push' ? q(prog(t, T.push, T.push + 0.45, ease.out), 20) : 0;
    let pitch;   // sd: head bowed until "asked", then lifted toward the upper left (prayer), no answer shown
    if (sd && pose === 'pray') pitch = q(lerp(0.38, -0.72, prog(t, T.called - 0.05, T.called + 0.5, ease.inOut)), 30);
    if (sd && pose === 'push') { const lean = ease.out(clamp((t - T.grip) / 0.4)), A = DIRECT.act(t, T.answered, { pre: 0.25, dip: 0.18, rise: 0.22, over: 0.1, settle: 0.25 }); kp = q(clamp(0.32 * lean + 0.68 * A.k, 0.12, 1.1), 30); }
    const st = usingPP2 ? { pose, blind: true, shackles: true, hair: 0.25, gold: q(Math.max(gold, hint * 0.6), 30), phase, k: kp, pitch, t: q(t, 15) } : { pose, blind: true, shackles: true, hair: 0.25, gold: q(Math.max(gold, hint * 0.6), 30), look, phase, t: q(t, 15) };
    sam.userData.update(JSON.stringify(st), st);
    const pushLean = pose === 'push' ? (sd ? DIRECT.tremor(t, T.answered, 0.014) : 0.012 * Math.sin(t * 40) * prog(t, T.push, T.push + 0.3)) : 0;
    const drive = sd && pose === 'push' ? DIRECT.act(t, T.answered, { pre: 0.25, dip: 0.18, rise: 0.22, over: 0.1, settle: 0.25 }).k : 0;   // he drives his weight into the pillars
    sam.position.set(sx, -0.03 * Math.max(0, drive), sz - 0.07 * drive); sam.userData.tilt = pushLean; sam.userData.square = pose !== 'walk';
    // he is lost in the dust before the roof comes down: no one is shown under the stones
    const swallowed = prog(t, T.give + 0.25, T.land - 0.12);
    sam.visible = !(fall && t > T.give + 0.42);
    const coolSam = [0.78, 0.84, 0.98], warmSam = [1.12, 1.02, 0.86];
    const kS = Math.max(gold, hint * 0.5);
    sam.material.color.setRGB(lerp(coolSam[0], warmSam[0], kS) + surge * 0.1, lerp(coolSam[1], warmSam[1], kS) + surge * 0.06, lerp(coolSam[2], warmSam[2], kS));
    sam.material.opacity = fall ? 1 - prog(t, T.give + 0.26, T.give + 0.42, (x) => x) : 1;
    // ---- the young man who held him by the hand (16:26): leads him in, then steps back ----
    const away = prog(t, T.prayed - 0.05, T.prayed + 2.6, ease.inOut);
    const bx = sx + 0.6 + away * 2.6, bz = sz + 0.28 + away * 1.5;
    const bst = { pose: 'lead', phase: q(kw * 2.5 * Math.PI * 2 + 1.5 + away * 18, 8), look: [-0.5, 0], t: q(t, 10) };
    boy.userData.update(JSON.stringify(bst), bst);
    boy.position.set(bx, 0, bz); boy.visible = !fall;
    boy.material.color.setRGB(0.8, 0.82, 0.92);
    // ---- the lords laugh, fall silent when the light breaks in, and topple into the dust ----
    lords.forEach((L, i) => {
      const tf = T.give + 0.25 + hsh(i, 1) * 0.3, kf = prog(t, tf, tf + 0.55, ease.in);
      const p = sd ? (t < tf ? 'laugh' : 'fall') : !fall || t < T.answered + 0.25 ? 'laugh' : t < tf ? 'stand' : 'fall';   // sd: still laughing until the house goes (16:25-30 never says they stopped)
      const lst = { pose: p, t: q(t, 10), dir: p === 'fall' ? 1 : -1, k: p === 'fall' ? 0.35 : 0.4 };
      L.userData.update(JSON.stringify(lst), lst);
      const r = L.userData.rest; L.position.set(r[0] + kf * 0.3, -kf * 0.9, r[2]);
      L.userData.tilt = -kf * 1.35 + (p === 'laugh' ? Math.sin(t * 7 + i * 2) * 0.03 : 0);
      L.visible = kf < 0.98 && !(t > T.land + 0.15);
      L.material.color.setRGB(lerp(0.96, 1.08, gold * 0.5), lerp(0.82, 0.92, gold * 0.5), lerp(0.74, 0.7, gold * 0.5));
    });
    guards.forEach((g, i) => {
      const tf = T.give + 0.35 + i * 0.12, kf = prog(t, tf, tf + 0.5, ease.in);
      const r = g.userData.rest; g.position.set(r[0], -kf * 0.8, r[2]); g.userData.tilt = (i ? -1 : 1) * kf * 1.3; g.visible = kf < 0.98;
      g.material.color.setRGB(0.74, 0.76, 0.88);
    });
    // ---- the crowd: cheering on the roof and in the hall, silent on "called", toppling into the dust ----
    const hush = fall && !sd ? prog(t, T.called + 0.1, T.called + 0.35) : 0;
    roofCrowd.forEach((m) => {
      const i = m.userData.i, p = pieces[m.userData.piece];
      const cheerOn = ((t * (0.7 + hsh(i, 2) * 0.6) + hsh(i, 3)) % 1) < 0.62;
      const ps = pieceState(p, t);
      const td = Math.min(p.tS, T.give + 0.1) + hsh(i, 4) * 0.22, kf = prog(t, td, td + 0.32, ease.in);   // the whole roof crowd goes as the pillars give
      m.userData.setPose(kf > 0 ? 'fall' : hush > 0.5 ? 'stand' : cheerOn ? 'cheer' : 'stand');
      const r = m.userData.rest;
      if (ps.moving) {
        p.mesh.position.set(...ps.pos); p.mesh.rotation.set(ps.rx, 0, ps.rz); p.mesh.updateMatrix();
        // they fall over backwards, behind the parapet and the tier in front of them (foreshortened: a flat figure tipping away)
        v3.set(r[0] - p.pivot[0] + sr(i, 5) * kf * 0.15, r[1] - p.pivot[1] - 0.3 * kf, r[2] - p.pivot[2] - 0.45 * kf).applyMatrix4(p.mesh.matrix);
        m.position.set(v3.x, v3.y, v3.z);
      } else m.position.set(r[0], r[1] + (cheerOn && kf === 0 ? Math.abs(Math.sin(t * 6 + i)) * 0.04 : 0), r[2]);
      m.userData.tilt = (ps.moving ? ps.rz : 0) + (sr(i, 6) > 0 ? 1 : -1) * kf * 0.5 + Math.sin(t * 2.3 + i) * 0.02;
      m.scale.set(m.userData.s, m.userData.s * Math.max(0.02, Math.cos(kf * Math.PI / 2)), m.userData.s);
      m.visible = !(ps.landed && t > p.tS + p.sagT + p.fallT + 0.12) && kf < 0.97;
    });
    hallCrowd.forEach((m) => {
      const i = m.userData.i;
      const cheerOn = ((t * (0.6 + hsh(i, 12) * 0.5) + hsh(i, 13)) % 1) < 0.55;
      const td = T.give + 0.3 + hsh(i, 14) * 0.4, kf = prog(t, td, td + 0.55, ease.in);
      m.userData.setPose(kf > 0 ? 'fall' : hush > 0.5 ? 'stand' : cheerOn ? 'cheer' : 'stand');
      const r = m.userData.rest; m.position.set(r[0], -kf * 0.9, r[2]);
      m.userData.tilt = (sr(i, 15) > 0 ? 1 : -1) * kf * 1.3;
      m.visible = kf < 0.97;
    });
    // ---- the god goes over, face down, into the dust ----
    { const u = Math.max(0, t - (T.give + 0.5)); statue.rotation.x = Math.min(1.45, 0.5 * 3.2 * u * u); }
    // ---- the roof pieces ----
    pieces.forEach((p) => { const ps = pieceState(p, t); p.mesh.position.set(...ps.pos); p.mesh.rotation.set(ps.rx, 0, ps.rz); });
    // ---- the breaking pillars ----
    drums.forEach((d) => {
      const p = drumPos(d, t), r = drumRot(d, t);
      e3.set(r[0], r[1], r[2]); q4.setFromEuler(e3); v3.set(p[0], p[1], p[2]); s3.set(1, 1, 1);
      if (d.cap) { v3.y -= 0.0; m4.compose(v3, q4, s3); capsIM.setMatrixAt(d.pi, m4); }
      else { m4.compose(v3, q4, s3); drumsIM.setMatrixAt(d.pi * N_DRUM + d.k, m4); }
    });
    drumsIM.instanceMatrix.needsUpdate = true; capsIM.instanceMatrix.needsUpdate = true;
    // ---- rubble ----
    rubList.forEach((r, i) => {
      const u = t - r.tb;
      if (u < 0) { m4.makeScale(0, 0, 0); rubble.setMatrixAt(i, m4); return; }
      const ul = Math.min(u, r.land);
      v3.set(r.o[0] + r.v[0] * ul, Math.max(r.sz * 0.4, r.o[1] + r.v[1] * ul - 0.5 * G * ul * ul), r.o[2] + r.v[2] * ul);
      e3.set(r.w[0] * ul, r.w[1] * ul, r.w[2] * ul); q4.setFromEuler(e3); s3.setScalar(r.sz);
      m4.compose(v3, q4, s3); rubble.setMatrixAt(i, m4);
    });
    rubble.instanceMatrix.needsUpdate = true;
    const settle = sd ? prog(t, T.land + 2.3, T.land + 3.6, ease.inOut) : 0;   // sd: the dust settles so the empty place can be read
    // ---- dust puffs ----
    puffList.forEach((p, i) => {
      const a = t - p.tb;
      if (a < 0) { m4.makeScale(0, 0, 0); puffs.setMatrixAt(i, m4); return; }
      const dr = (1 - Math.exp(-p.drag * a)) / p.drag;
      v3.set(p.o[0] + p.v[0] * dr, Math.max(0.25, p.o[1] + p.v[1] * dr + p.rise * a), p.o[2] + p.v[2] * dr);
      const sc = p.s1 * (0.3 + 0.7 * (1 - Math.exp(-a * p.grow))) * (1 - settle);
      e3.set(p.n * 0.7, p.n * 1.3 + a * 0.4, 0); q4.setFromEuler(e3); s3.set(sc, sc * 0.86, sc);
      m4.compose(v3, q4, s3); puffs.setMatrixAt(i, m4);
    });
    puffs.instanceMatrix.needsUpdate = true;
    { const u = puffs.material.uniforms; u.keyDir.value.copy(sun.position).sub(sun.target.position).normalize(); u.keyCol.value.copy(sun.color).multiplyScalar(0.34 * sun.intensity / 2.1);
      u.goldDir.value.copy(spot.position).sub(spot.target.position).normalize(); u.goldCol.value.set('#FFC27A').multiplyScalar(0.46 * gold + 0.2 * surge); u.amb.value.copy(hemi.color).multiplyScalar(0.32); }
    // haze sprites ride on the puffs, softening their edges
    haze.userData.update((i, v, col) => {
      const p = puffList[(i * 3 + 1) % puffList.length]; const a = t - p.tb - 0.03; if (a < 0) return null;
      const dr = (1 - Math.exp(-p.drag * a)) / p.drag;
      v.set(p.o[0] + p.v[0] * dr * 1.1, Math.max(0.4, p.o[1] + p.v[1] * dr + p.rise * a + 0.2), p.o[2] + p.v[2] * dr * 1.1 + 0.2);
      col.setRGB(lerp(0.42, 0.74, gold), lerp(0.44, 0.64, gold), lerp(0.52, 0.5, gold));
      return { alpha: 0.3 * Math.min(1, a * 5) * (1 - 0.7 * settle), size: p.s1 * 3.4 * (0.45 + 0.55 * (1 - Math.exp(-a * 2.5))) };
    });
    // falling sand
    const per = 150;
    trickle.userData.update((i, v, col) => {
      const s = streams[Math.floor(i / per)]; if (!s) return null;
      const j = i % per, born = s.t0 + j * 0.011; if (born > t || born > s.t1) return null;
      const a = t - born, y = s.y - 0.5 * G * a * a; if (y < 0.02) return null;
      v.set(s.x + sr(j, s.x * 7 + 1) * 0.05 + sr(j, 3) * a * 0.15, y, s.z + sr(j, 4) * 0.05);
      col.setRGB(lerp(0.66, 1.0, gold), lerp(0.62, 0.86, gold), lerp(0.6, 0.62, gold));
      return { alpha: 0.55 * (1 - a * 0.6), size: 0.03 + hsh(j, 5) * 0.025 + G * a * 0.012 };
    });
    // motes in the gold light, sparks from the braziers
    motes.userData.update((i, v) => {
      const k = (hsh(i, 7) + t * 0.03 * (0.5 + hsh(i, 8))) % 1, along = 0.2 + hsh(i, 9) * 0.8;
      v.set(lerp(-5.2, 0, along) + Math.sin(t * 0.4 + i) * 0.4 * along, lerp(9.6, 0.4, along) + (k - 0.5) * 0.8, lerp(6.8, 0, along) + Math.cos(t * 0.3 + i * 2) * 0.4 * along);
      return { alpha: (Math.max(gold, hint * 0.5) * 0.95) * (0.4 + 0.6 * hsh(i, 10)) * Math.sin(Math.PI * k), size: 0.7 + hsh(i, 11) * 0.8 };
    });
    embers.userData.update((i, v) => {
      const src = i % 3 === 0 ? [1.95, 1.2, -1.35] : i % 3 === 1 ? [2.35, 1.3, 4.2] : [i % 2 ? 1.15 : -1.15, 1.15, STATUE_Z + 2.0];
      const life = 1.4 + hsh(i, 1), a = ((t + hsh(i, 2) * life) % life);
      v.set(src[0] + Math.sin(a * 3 + i) * 0.12 * a, src[1] + a * 0.9, src[2] + Math.cos(a * 2.3 + i) * 0.1 * a);
      return { alpha: (1 - a / life) * 0.9, size: 0.7 + hsh(i, 3) * 0.6 };
    });
    // ---- light ----
    flames.forEach((f, i) => { const u = f.userData, fl = 0.85 + 0.15 * Math.sin(t * 13 + u.seed) + 0.08 * Math.sin(t * 29 + u.seed * 2); u.outer.scale.set(1, fl, 1); u.inner.scale.set(1, 0.9 + 0.2 * Math.sin(t * 17 + u.seed), 1); u.halo.material.opacity = 0.42 + 0.12 * fl; });
    fireLights.forEach((L, i) => { L.intensity = L.userData.base * (0.86 + 0.1 * Math.sin(t * 11 + i * 2) + 0.06 * Math.sin(t * 23 + i)); });
    fireGlows.forEach((g, i) => { g.material.opacity = g.userData.base * (0.85 + 0.12 * Math.sin(t * 9 + i * 3)) * (1 - gold * 0.5); });
    spot.intensity = gold * 26 + surge * 18 + hint * 15;
    spot.shadow.autoUpdate = spot.intensity > 0.01; // no shadow pass while God's light is dark (it adds nothing then)
    pool.material.opacity = gold * 0.24 + hint * 0.08 + surge * 0.15;
    sun.color.set('#A8BCE4').lerp(C('#FFD9A8'), gold * 0.75); sun.intensity = 2.1 + gold * 0.5;
    hemi.color.set('#6274A4').lerp(C('#9C8A78'), gold * 0.5);
    // tints: the roof crowd stands against the evening sky, the hall crowd in the firelight
    // the roof crowd stays in the dusk (silhouettes under the narration) until the house goes; the gold is on Samson
    const kr = 0.22 * gold + 0.5 * prog(t, T.give - 0.1, T.give + 0.3);
    roofCrowd.forEach((m) => { const d = 1 - m.userData.row * 0.1; m.material.color.setRGB(lerp(0.2, 0.92, kr) * d, lerp(0.22, 0.84, kr) * d, lerp(0.33, 0.72, kr) * d); });
    hallCrowd.forEach((m) => { m.material.color.setRGB(lerp(0.66, 0.96, gold), lerp(0.62, 0.84, gold), lerp(0.66, 0.7, gold)); });
    const dusk = fall ? prog(t, T.land - 0.1, T.end, ease.out) : 0; // the dust thickens: a little less glare
    return { gold, hint, surge, swallowed, dusk };
  }

  // ---------------- camera ----------------
  const K = (p, l, f, sh = 0) => ({ p, l, f, sh });
  const lerpK = (A, B, k) => { const r = FW.camLerpK(A, B, k); r.sh = lerp(A.sh, B.sh, k); return r; };
  // ---- Story Director variants: the set publishes named camera marks; each sd shot is a path through them (fw/direct.js) ----
  const MARKS = {
    samHigh:  { p: [0.15, 3.1, 4.6],  l: [0.05, 1.25, -0.3], f: 36, sh: 0.06 },   // MS, high: small between the two middle pillars
    hands:    { p: [0.0, 1.05, 2.05], l: [0.0, 1.6, -0.3],   f: 64, sh: 0.0 },
    twoPosts: { p: [0.0, 0.75, 3.7],  l: [0.0, 1.75, -0.3],  f: 50, sh: 0.0 },     // low MS: his whole body and both pillars (muted test fix 1)
    underLow: { p: [-0.55, 0.42, 3.0], l: [0.05, 1.6, -0.3], f: 50, sh: 0.0 },     // low, him in frame ... 
    underUp:  { p: [-0.55, 0.42, 3.0], l: [0.25, 3.3, -0.3], f: 50, sh: 0.0 },     // ... craned to the capitals and the roof crowd (fix 3)
    hallWS:   { p: [-0.3, 2.0, 9.6],  l: [0.1, 2.4, -0.4],   f: 38, sh: 0.06 },    // WS: he stays a third of the frame as the house goes (fix 2)   // MCU, low: two hands, two posts (the hook's rhyme)
    pillarLo: { p: [0.3, 0.3, 1.15], l: [0.72, 1.5, -0.3],  f: 52, sh: 0 },      // low, in front of the right pillar at his hand
    pillarUp: { p: [0.3, 0.3, 1.15], l: [0.8, 3.95, -0.3],  f: 52, sh: 0 },      // ... craned up to the capital and the roof edge
    hallWide: { p: [-0.45, 2.0, 16.6], l: [0.2, 2.75, -0.5], f: 38, sh: 0.11 },   // XWS: the whole house, the roof crowd
    stumps:   { p: [-0.25, 1.25, 9.2], l: [0.0, 1.0, -0.5],  f: 38, sh: 0.04 },   // the end: D's place, emptied: the broken posts where he stood
  };
  function sdCam(t, shot) {
    const M = (n, m) => DIRECT.mark(MARKS, n, m);
    let keys, focusP = [0, 1.3, 0], ap = 4.6, shake = [0, 0];
    if (shot.v === 'sdA') keys = [{ t: shot.t0, ...M('samHigh') }, { t: T.called, ...M('samHigh', { push: 0.02 }), ease: 'linear' }, { t: shot.t1, ...M('samHigh', { push: 0.11 }), ease: 'inOut' }];   // story push on "asked"
    else if (shot.v === 'sdB') { keys = [{ t: shot.t0, ...M('twoPosts') }]; focusP = [0, 1.4, -0.3]; ap = 4.5; }
    else if (shot.v === 'sdC') { const c0 = shot.t0 + 0.12; keys = [{ t: c0, ...M('underLow') }, { t: c0 + 1.1, ...M('underUp'), ease: 'inOut' }]; focusP = [0.2, 2.2, -0.3]; ap = 3.6; }
    else if (shot.v === 'sdD') { keys = [{ t: T.give, ...M('hallWS') }, { t: T.land + 2.2, ...M('hallWS', { push: -0.12 }), ease: 'out' }]; shake = DIRECT.shake(t, T.land, 12, 0.45); focusP = [0, 1.4, 0]; ap = 4; }
    else { keys = [{ t: shot.t0, ...M('stumps') }, { t: shot.t1 + 1.5, ...M('stumps', { push: 0.03 }), ease: 'linear' }]; focusP = [0, 0.8, -0.3]; ap = 3.5; }
    DIRECT.applyCam(cam, DIRECT.path(t, keys), W, H, shake);
    const focus = new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z * -1;
    return { focus, ap };
  }
  function camAt(t, shot) {
    if (/^sd/.test(shot.v)) return sdCam(t, shot);
    let k, focusP = [0, 1.3, 0], ap = 4.6;
    const d = shot.dur;
    if (shot.v === 'pillars') { // wide on the hall -> medium on him at the pillars, one slow push from "Blind"
      const A = K([-1.1, 1.85, 13.4], [0.1, 2.75, 0], 38, 0.145), B = K([-0.55, 1.45, 5.4], [0.05, 2.05, 0], 36, 0.08);
      k = lerpK(A, B, ease.inOut(clamp((t - T.blind) / (shot.t1 - T.blind))));
      ap = lerp(4.2, 5.0, clamp((t - shot.t0) / d));
    } else { // medium on him from low on God's side; on "answered" the camera pulls back to the wide as the house falls
      const A = K([-1.75, 0.55, 3.75], [0.25, 1.95, -0.3], 36, 0.0), A2 = K([-1.68, 0.57, 3.6], [0.25, 1.96, -0.3], 36, 0.0);
      const B = K([-0.45, 2.0, 16.6], [0.2, 2.75, -0.5], 38, 0.11);
      const pre = clamp((t - shot.t0) / (T.answered - shot.t0));
      k = t < T.answered ? lerpK(A, A2, pre) : lerpK(A2, B, ease.out(clamp((t - T.answered) / (T.end - T.answered + 0.25))));
      focusP = [0, 1.4, 0]; ap = lerp(4.6, 4.0, clamp((t - T.answered) / 1.5));
    }
    FW.setCam(cam, k.p, k.l, k.f);
    // impact shake (≤ 12 px), only on the fall: a pixel offset of the view
    let dx = 0, dy = 0;
    if (shot.v === 'fall') { const u = t - T.land; if (u >= 0 && u < 0.45) { const a = 12 * Math.pow(1 - u / 0.45, 2); dx = Math.sin(u * 83) * a; dy = Math.cos(u * 67 + 1) * a * 0.8; } }
    cam.setViewOffset(W, H, dx, -k.sh * H + dy, W, H);
    cam.updateMatrixWorld();
    const focus = new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z * -1;
    return { focus, ap };
  }

  SCENES.dagon = {
    async build(env) { cam = env.cam; build(); },
    frame(t, shot, camera) {
      cam = camera;
      const act = stage(t, shot);
      const c = camAt(t, shot);
      contact.forEach(([m, o]) => { m.position.set(o.position.x, Math.max(0, o.position.y) + 0.015, o.position.z); m.visible = o.visible && o.position.y > -0.2; });
      haze.material.uniforms.scale.value = H / (2 * Math.tan((cam.fov * Math.PI) / 360));
      trickle.material.uniforms.scale.value = haze.material.uniforms.scale.value;
      const fall = shot.v === 'fall' || /^sd/.test(shot.v);
      const impact = fall ? (() => { const u = t - T.land; return u >= 0 && u < 0.2 ? Math.pow(1 - u / 0.2, 2) : 0; })() : 0;
      const g = act.gold;
      return {
        scene, sun, bill: [sam, boy, ...lords, ...guards, ...roofCrowd, ...hallCrowd],
        focus: c.focus, aperture: c.ap, maxR: 7, fgScale: 1.5,
        exposure: 1.06 + g * 0.06 + act.surge * 0.05 - act.dusk * 0.1, sat: lerp(0.86, 1.04, g), bloom: 0.12 + g * 0.08 + act.surge * 0.06 - act.dusk * 0.08,
        gain: [lerp(0.9, 1.05, g), lerp(0.96, 1.0, g), lerp(1.1, 0.9, g)], lift: [lerp(0.01, 0.03, g), lerp(0.016, 0.02, g), lerp(0.05, 0.012, g)],
        rays: { amt: g * 0.95 + act.surge * 0.35 + act.hint * 0.95, target: [0, 1.5, 0] },
        flash: impact * 0.4 + act.surge * 0.08,
        post(ctx) { const a = 1; const g = ctx.createLinearGradient(0, 160, 0, 640); g.addColorStop(0, `rgba(8,10,22,${0.42 * a})`); g.addColorStop(0.6, `rgba(8,10,22,${0.3 * a})`); g.addColorStop(1, 'rgba(8,10,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 160, W, 480); },
      };
    },
  };
})();
