// SOREK (Judges 16:4-20): Delilah's house in the Valley of Sorek, an evening interior lit by oil lamps.
// A plastered mud-brick room cut away like a diorama: a dusk window (blue light), lamps on ledges, a low couch,
// an upright loom with its web (16:13-14), rugs and jars, and the doorway to the inner chamber where the
// Philistines wait in ember light (16:9, 16:12; screen right). Shots S10-S15 (see ../plan/shotlist_v27.md):
//   delilah  she turns toward camera (tag DELILAH · JUDGES 16:4), MCU, slow push
//   call     she calls toward Samson (screen left), the men waiting in the inner chamber behind her; slight whip
//   traps    three fast setups, one per bond: bowstrings (16:9), new ropes (16:12), the pin, loom and web (16:14);
//            a gold flare on him each time (his strength is from the LORD); counter 1-2-3
//   shave    he leans in to tell her all his heart (16:17); cut on "hair" to him asleep on her knees while a man
//            shaves the seven locks (16:19); the gold on him fades out on "shaved"
//   wake     he wakes and stands easy, rolling his shoulders; Philistine soldiers fill the doorway (16:20). No gold.
//   left     locked hold under the verse card: Samson unaware in the doorway's ember light, the room cold.
// Every frame is a pure function of t (no state carried between frames; seeded rng only).
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const q = (v, n = 60) => Math.round(v * n) / n;
  const P2 = () => globalThis.PP2 || null;
  const DU = 1400 / 1.86 / 2.5; // PP design units per metre (PP.samson is 1.86 m tall)

  // ---------------- the room (metres; floor y = 0; the open side faces +z) ----------------
  const R = { x0: -4.2, x1: 4.2, zb: -3.2, th: 0.32, h: 3.5 };
  const DOOR = { x0: 1.55, x1: 2.75, h: 2.2 };          // to the inner chamber (16:9)
  const WIN = { x0: -3.25, x1: -2.3, y0: 1.32, y1: 2.28 }; // dusk window in the back wall
  const COUCH = { x: -1.0, z: -2.25, w: 2.4, d: 0.86, h: 0.36 };
  const LOOM = { x: 0.88, z: -2.86 };
  const INNER = { x0: 0.95, x1: 3.45, z0: -6.1 };

  let emberGlow, scene, cam, hemi, key, winSpot, emberSpot, emberPt, goldSpot, lamps = [], loom, loomPin, curtain, brazier;
  let sam, del, group, soldiers = [], contact = [], sparks, motes, dust, lockDecal, lockCtx, lockTex, lockN = -1, winPool;
  const bbAll = [];

  // ---------------- geometry helpers ----------------
  const VC = () => new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 });
  // per-triangle colours from a function of the face centre (world coords: translate the geometry first)
  function facets(geo, colFn, seed) {
    const rng = FW.rng(seed);
    const g = geo.index ? geo.toNonIndexed() : geo;
    const p = g.attributes.position, n = p.count, cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      const c = colFn(cx, cy, cz, rng());
      for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = c.r; cols[(i + k) * 3 + 1] = c.g; cols[(i + k) * 3 + 2] = c.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    g.computeVertexNormals();
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
  // a box from corner a to corner b, its surface bumped along one axis (plaster), keyed by position so shared vertices move together
  function slab(a, b, bumpAxis, amt, seed, segLen = 0.42) {
    const w = b[0] - a[0], h = b[1] - a[1], d = b[2] - a[2];
    const g = new THREE.BoxGeometry(w, h, d, Math.max(1, Math.round(w / segLen)), Math.max(1, Math.round(h / segLen)), Math.max(1, Math.round(d / segLen)));
    g.translate(a[0] + w / 2, a[1] + h / 2, a[2] + d / 2);
    const p = g.attributes.position, rng = FW.rng(seed), seen = new Map();
    for (let i = 0; i < p.count; i++) {
      const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
      if (!seen.has(k)) seen.set(k, (rng() - 0.5) * amt);
      const v = seen.get(k);
      if (bumpAxis === 'x') p.setX(i, p.getX(i) + v); else if (bumpAxis === 'y') p.setY(i, p.getY(i) + v); else p.setZ(i, p.getZ(i) + v);
    }
    return g;
  }
  const plasterCol = (x, y, z, r) => {
    const n = FW.fbm(x * 0.9 + z * 0.7, y * 0.9, 31, 3), n2 = FW.noise2(x * 2.3 + z * 1.9, y * 2.3, 5);
    const c = C(n > 0.58 ? '#BCAD9A' : n > 0.42 ? '#B2A28F' : '#A79784');
    if (y < 0.5) c.lerp(C('#7E6A58'), 0.6 * (1 - y / 0.5));                     // the dirty skirt of the wall
    if (y > 2.9) c.lerp(C('#5E4C40'), 0.4 * clamp((y - 2.9) / 0.6));            // smoke under the roof
    if (n2 > 0.72) c.lerp(C('#CFBDA4'), 0.35);                                  // fresher plaster patches
    c.offsetHSL((r - 0.5) * 0.01, (r - 0.5) * 0.04, (r - 0.5) * 0.045);
    return c;
  };
  const woodCol = (x, y, z, r) => { const c = C(r < 0.33 ? '#5C3F2A' : r < 0.66 ? '#664632' : '#523826'); return c; };
  const solid = (hex, vary = 0.04) => (x, y, z, r) => { const c = C(hex); c.offsetHSL((r - 0.5) * 0.01, (r - 0.5) * vary, (r - 0.5) * vary); return c; };
  function addMesh(geo, mat, cast = true, recv = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; scene.add(m); return m; }
  const lathe = (pts, seg = 7) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
  const glowTex = (() => { let t = null; return () => t || (t = canvasTex(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.45)'); g.addColorStop(0.6, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); })); })();
  function glowSprite(color, size, opacity = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: C(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    s.scale.set(size, size, 1); s.renderOrder = 6; return s;
  }

  // ---------------- building the house ----------------
  function buildRoom() {
    const wallGeos = [];
    const zb0 = R.zb - R.th, zb1 = R.zb;
    // back wall, in pieces around the window and the inner door
    const back = [
      [[R.x0 - R.th, 0, zb0], [WIN.x0, R.h, zb1]],
      [[WIN.x0, 0, zb0], [WIN.x1, WIN.y0, zb1]], [[WIN.x0, WIN.y1, zb0], [WIN.x1, R.h, zb1]],
      [[WIN.x1, 0, zb0], [DOOR.x0, R.h, zb1]],
      [[DOOR.x0, DOOR.h, zb0], [DOOR.x1, R.h, zb1]],
      [[DOOR.x1, 0, zb0], [R.x1 + R.th, R.h, zb1]],
    ];
    back.forEach(([a, b], i) => wallGeos.push(facets(slab(a, b, 'z', 0.035, 11 + i), plasterCol, 101 + i)));
    // side walls (to z = 1.6, the cut-away front edge), a little lower toward the front like a diorama
    wallGeos.push(facets(slab([R.x0 - R.th, 0, zb1], [R.x0, R.h, 1.6], 'x', 0.035, 21), plasterCol, 121));
    wallGeos.push(facets(slab([R.x1, 0, zb1], [R.x1 + R.th, R.h, 1.6], 'x', 0.035, 22), plasterCol, 122));
    // inner chamber (behind the door): its own walls, darker
    const darkPl = (x, y, z, r) => plasterCol(x, y, z, r).multiplyScalar(0.8);
    wallGeos.push(facets(slab([INNER.x0 - 0.3, 0, INNER.z0 - 0.3], [INNER.x1 + 0.3, R.h, INNER.z0], 'z', 0.03, 23), darkPl, 123));
    wallGeos.push(facets(slab([INNER.x0 - 0.3, 0, INNER.z0], [INNER.x0, R.h, zb0], 'x', 0.03, 24), darkPl, 124));
    wallGeos.push(facets(slab([INNER.x1, 0, INNER.z0], [INNER.x1 + 0.3, R.h, zb0], 'x', 0.03, 25), darkPl, 125));
    // low ledges and a bench plinth along the back wall
    const ledges = [[-1.95, 1.48, 0.62], [3.15, 1.5, 0.7], [-0.15, 1.92, 0.5]];
    ledges.forEach(([x, y, w], i) => wallGeos.push(facets(slab([x - w / 2, y, zb1], [x + w / 2, y + 0.08, zb1 + 0.24], 'y', 0.015, 31 + i, 0.2), plasterCol, 131 + i)));
    // a niche ledge on the left wall
    wallGeos.push(facets(slab([R.x0, 1.38, -0.9], [R.x0 + 0.22, 1.46, -0.25], 'y', 0.012, 35, 0.2), plasterCol, 135));
    const walls = addMesh(merge(wallGeos), VC());
    walls.name = 'walls';

    // wooden lintels, window frame and bars, door posts
    const wood = [];
    wood.push(facets(slab([WIN.x0 - 0.18, WIN.y1, zb1 - 0.02], [WIN.x1 + 0.18, WIN.y1 + 0.15, zb1 + 0.05], 'z', 0.02, 41, 0.3), woodCol, 141));
    wood.push(facets(slab([WIN.x0 - 0.1, WIN.y0 - 0.07, zb1 - 0.32], [WIN.x1 + 0.1, WIN.y0, zb1 + 0.08], 'y', 0.01, 42, 0.3), woodCol, 142));
    for (let i = 1; i <= 3; i++) { const x = lerp(WIN.x0, WIN.x1, i / 4); wood.push(facets(slab([x - 0.025, WIN.y0, zb1 - 0.2], [x + 0.025, WIN.y1, zb1 - 0.14], 'x', 0.006, 43 + i, 0.5), woodCol, 143 + i)); }
    wood.push(facets(slab([DOOR.x0 - 0.2, DOOR.h, zb1 - 0.04], [DOOR.x1 + 0.2, DOOR.h + 0.18, zb1 + 0.06], 'z', 0.02, 47, 0.3), woodCol, 147));
    wood.push(facets(slab([DOOR.x0 - 0.1, 0, zb1 - 0.33], [DOOR.x0, DOOR.h, zb1 + 0.03], 'x', 0.01, 48, 0.4), woodCol, 148));
    wood.push(facets(slab([DOOR.x1, 0, zb1 - 0.33], [DOOR.x1 + 0.1, DOOR.h, zb1 + 0.03], 'x', 0.01, 49, 0.4), woodCol, 149));
    // roof beams resting on the walls (seen only from the high angles)
    addMesh(merge(wood), VC());
    // the ceiling: beams and reed matting under the flat roof (no shadows: the key light stands in for the lamps)
    const ceil = [];
    for (let i = 0; i < 8; i++) { const x = -3.9 + i * 1.12; const g = new THREE.CylinderGeometry(0.09, 0.1, 5.6, 6); g.rotateX(Math.PI / 2); g.translate(x, R.h - 0.1, -0.6); ceil.push(facets(g, woodCol, 150 + i)); }
    { const g = new THREE.PlaneGeometry(R.x1 - R.x0 + 0.6, 5.6, 12, 8); g.rotateX(Math.PI / 2); g.translate(0, R.h + 0.02, -0.6); ceil.push(facets(g, (x, y, z, r) => C(r < 0.5 ? '#4A3A2C' : '#54412F'), 158)); }
    addMesh(merge(ceil), VC(), false, true);

    // exposed mud bricks where the plaster has flaked (instanced, running bond)
    const bricks = [];
    const patch = (cx, cy, rx, ry, face, seed) => {
      const rng = FW.rng(seed);
      for (let row = -6; row <= 6; row++) for (let col = -6; col <= 6; col++) {
        const u = col * 0.36 + (row % 2 ? 0.18 : 0), v = row * 0.125;
        const d = Math.pow(u / rx, 2) + Math.pow(v / ry, 2) + (rng() - 0.5) * 0.5;
        if (d > 1) continue;
        bricks.push({ face, x: cx + u, y: cy + v, r: rng() });
      }
    };
    patch(-0.9, 2.6, 0.9, 0.38, 'back', 3); patch(3.4, 0.75, 0.6, 0.3, 'back', 4); patch(-2.0, 0.55, 0.55, 0.22, 'back', 5);
    patch(-1.5, 2.2, 0.7, 0.3, 'left', 6); patch(0.2, 1.1, 0.5, 0.26, 'right', 7); patch(0.4, 2.85, 0.5, 0.25, 'back', 8);
    const bg = new THREE.BoxGeometry(0.33, 0.105, 0.1);
    const bm = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.95 }), bricks.length);
    const o3 = new THREE.Object3D(), bc = new THREE.Color();
    bricks.forEach((b, i) => {
      if (b.face === 'back') o3.position.set(b.x, b.y, R.zb + 0.012); else if (b.face === 'left') o3.position.set(R.x0 + 0.012, b.y, b.x); else o3.position.set(R.x1 - 0.012, b.y, b.x);
      o3.rotation.set((b.r - 0.5) * 0.04, b.face === 'back' ? (b.r - 0.5) * 0.05 : Math.PI / 2, (b.r - 0.5) * 0.05);
      o3.scale.set(0.92 + b.r * 0.1, 1, 1); o3.updateMatrix(); bm.setMatrixAt(i, o3.matrix);
      bc.set(b.r < 0.3 ? '#86664E' : b.r < 0.65 ? '#937259' : '#7A5C46'); bm.setColorAt(i, bc);
    });
    bm.castShadow = false; bm.receiveShadow = true; scene.add(bm);

    // floor: packed earth, faceted
    const floorH = (x, z) => (FW.noise2(x * 1.3, z * 1.3, 3) - 0.5) * 0.035;
    const floorCol = (x, z, y, ny, r) => {
      const n = FW.fbm(x * 0.5, z * 0.5, 9, 3);
      const c = C(n > 0.6 ? '#77624F' : n > 0.45 ? '#6D5A48' : '#635040');
      const edge = Math.min(x - R.x0, R.x1 - x, z - R.zb); if (edge < 0.7) c.lerp(C('#45372C'), 0.4 * (1 - edge / 0.7));
      if (z < R.zb) c.multiplyScalar(0.75);
      c.offsetHSL((r - 0.5) * 0.01, (r - 0.5) * 0.05, (r - 0.5) * 0.05);
      return c;
    };
    scene.add(LW.terrain({ size: 18, seg: 48, cx: 0, cz: -1.5, hFn: floorH, colFn: floorCol, seed: 5 }));

    // the dusk outside the window: sky gradient, the hills of the valley, the evening star
    const view = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), new THREE.MeshBasicMaterial({ map: canvasTex(512, 360, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16224A'); g.addColorStop(0.45, '#33467E'); g.addColorStop(0.72, '#7A6E9A'); g.addColorStop(0.86, '#C78C86'); g.addColorStop(1, '#D9A07E');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2A2C4C'; x.beginPath(); x.moveTo(0, h * 0.78); for (let i = 0; i <= 16; i++) x.lineTo((i / 16) * w, h * (0.74 + 0.07 * Math.sin(i * 1.3) + 0.04 * Math.sin(i * 3.1))); x.lineTo(w, h); x.lineTo(0, h); x.fill();
      x.fillStyle = '#1C1D36'; x.beginPath(); x.moveTo(0, h * 0.88); for (let i = 0; i <= 12; i++) x.lineTo((i / 12) * w, h * (0.84 + 0.05 * Math.sin(i * 2.1 + 1))); x.lineTo(w, h); x.lineTo(0, h); x.fill();
      const sg = x.createRadialGradient(w * 0.62, h * 0.3, 0, w * 0.62, h * 0.3, 14); sg.addColorStop(0, 'rgba(255,250,235,1)'); sg.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = sg; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * hsh(i, 2)})`; x.fillRect(hsh(i, 3) * w, hsh(i, 4) * h * 0.45, 1.6, 1.6); }
    }), fog: false, toneMapped: false }));
    view.position.set((WIN.x0 + WIN.x1) / 2, 1.85, R.zb - 2.2); scene.add(view);
    view.name = 'view';
  }

  function buildProps() {
    const geos = [];
    // the couch (divan): wooden frame, a striped mattress, bolsters against the wall
    const cx = COUCH.x, cz = COUCH.z, hw = COUCH.w / 2, hd = COUCH.d / 2;
    geos.push(facets(slab([cx - hw, 0, cz - hd], [cx + hw, 0.2, cz + hd], 'y', 0.01, 51, 0.3), woodCol, 151));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) geos.push(facets(slab([cx + sx * hw - 0.06, 0, cz + sz * hd - 0.06], [cx + sx * hw + 0.06, 0.24, cz + sz * hd + 0.06], 'y', 0.005, 52, 0.4), woodCol, 152));
    addMesh(merge(geos), VC());
    const stripe = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#3F4A72'; x.fillRect(0, 0, w, h); const cols = ['#D9C7A2', '#8E3A2A', '#D9C7A2', '#B08A52']; for (let i = 0; i < 18; i++) { x.fillStyle = cols[i % 4]; x.fillRect(i * 30 + 6, 0, i % 2 ? 6 : 12, h); } x.fillStyle = 'rgba(40,20,10,0.12)'; for (let i = 0; i < 40; i++) x.fillRect(0, i * 3.2, w, 1); });
    const mat = new THREE.MeshStandardMaterial({ map: stripe, roughness: 1, flatShading: true });
    const mg = new THREE.BoxGeometry(COUCH.w - 0.06, 0.18, COUCH.d - 0.04, 6, 1, 2); LW.jitter(mg, 0.03, FW.rng(53));
    const mattress = new THREE.Mesh(mg, mat); mattress.position.set(cx, 0.28, cz); mattress.castShadow = mattress.receiveShadow = true; scene.add(mattress);
    const bol = (x, z, len, rot, col) => { const g = new THREE.CylinderGeometry(0.17, 0.17, len, 7, 1); LW.jitter(g, 0.03, FW.rng(Math.round(x * 100))); const m = new THREE.Mesh(g, LW.M(col)); m.rotation.z = Math.PI / 2; m.rotation.y = rot; m.position.set(x, 0.5, z); m.castShadow = m.receiveShadow = true; scene.add(m); };
    bol(cx, cz - hd + 0.17, COUCH.w - 0.3, 0, '#D8C39A');
    bol(cx - hw + 0.2, cz + 0.05, 0.6, Math.PI / 2, '#8E3324');
    // cushions on the couch and the floor
    const cushion = (x, y, z, s, col, rot) => { const g = new THREE.BoxGeometry(0.5 * s, 0.16 * s, 0.42 * s, 2, 1, 2); LW.jitter(g, 0.05 * s, FW.rng(Math.round(x * 77 + z * 13))); const m = new THREE.Mesh(g, LW.M(col)); m.position.set(x, y, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); };
    cushion(cx + hw - 0.35, 0.43, cz - 0.15, 1, '#4B5A86', 0.3);
    cushion(-2.95, 0.08, -0.6, 1.2, '#8E3324', 0.5); cushion(-3.2, 0.08, -1.2, 1.1, '#C9A06A', -0.2);

    // rugs
    const rugTex = (base, a, b, seed) => canvasTex(512, 340, (x, w, h) => {
      x.fillStyle = base; x.fillRect(0, 0, w, h);
      x.strokeStyle = a; x.lineWidth = 14; x.strokeRect(18, 18, w - 36, h - 36);
      x.strokeStyle = b; x.lineWidth = 5; x.strokeRect(40, 40, w - 80, h - 80);
      for (let i = 0; i < 5; i++) { const cxp = w * (0.2 + i * 0.15), cyp = h / 2, s = 46; x.fillStyle = i % 2 ? a : b; x.beginPath(); x.moveTo(cxp, cyp - s); x.lineTo(cxp + s * 0.7, cyp); x.lineTo(cxp, cyp + s); x.lineTo(cxp - s * 0.7, cyp); x.closePath(); x.fill(); x.fillStyle = base; x.beginPath(); x.moveTo(cxp, cyp - s * 0.45); x.lineTo(cxp + s * 0.3, cyp); x.lineTo(cxp, cyp + s * 0.45); x.lineTo(cxp - s * 0.3, cyp); x.closePath(); x.fill(); }
      x.fillStyle = b; for (let i = 0; i < 30; i++) { x.fillRect(60 + i * 13.5, 58, 6, 10); x.fillRect(60 + i * 13.5, h - 68, 6, 10); }
      x.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 120; i++) x.fillRect(0, i * 3, w, 1);
    });
    const rug = (w, d, x, z, rot, tex) => { const g = new THREE.PlaneGeometry(w, d, 6, 4); g.rotateX(-Math.PI / 2); const p = g.attributes.position, rng = FW.rng(Math.round(x * 31 + z * 7)); for (let i = 0; i < p.count; i++) p.setY(i, 0.012 + rng() * 0.012); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, flatShading: true })); m.position.set(x, 0, z); m.rotation.y = rot; m.receiveShadow = true; scene.add(m); };
    rug(3.0, 2.0, -0.9, -0.75, 0.04, rugTex('#7E3427', '#D9C7A2', '#2F3A5E', 1));
    rug(1.3, 0.85, 2.3, -1.9, -0.12, rugTex('#3B4A70', '#C9A06A', '#8E3324', 2));
    rug(1.1, 1.7, -3.3, -0.8, 0.1, rugTex('#8C6440', '#3B2A1E', '#D9C7A2', 3));

    // jars (terracotta, low-poly lathe)
    const jarP = [[0, 0], [0.08, 0], [0.15, 0.07], [0.2, 0.22], [0.18, 0.37], [0.11, 0.47], [0.07, 0.51], [0.09, 0.56], [0, 0.56]];
    const pitP = [[0, 0], [0.06, 0], [0.11, 0.06], [0.12, 0.15], [0.07, 0.24], [0.06, 0.3], [0.08, 0.33], [0, 0.33]];
    const jar = (x, y, z, s, col, prof = jarP, band = true) => {
      const g = lathe(prof, 7); const m = new THREE.Mesh(g, LW.M(col)); m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.y = hsh(x * 10 + z) * 6; m.castShadow = m.receiveShadow = true; scene.add(m);
      if (band) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.205 * (prof === jarP ? 1 : 0.6), 0.205 * (prof === jarP ? 1 : 0.6), 0.04, 7), LW.M('#E2CFA6')); b.position.set(x, y + 0.27 * s * (prof === jarP ? 1 : 0.55), z); b.scale.setScalar(s); b.rotation.y = m.rotation.y; scene.add(b); }
    };
    jar(3.55, 0, -2.75, 1.25, '#A0583A'); jar(3.95, 0, -2.45, 1.0, '#B8714A', jarP, false); jar(3.7, 0, -2.2, 0.75, '#8E4E34', pitP); jar(3.25, 0, -2.85, 0.7, '#B8714A', pitP, false);
    jar(-3.75, 0, 0.6, 1.15, '#A0583A'); jar(-3.45, 0, 0.95, 0.8, '#8E4E34', pitP); jar(-3.95, 0, 1.05, 0.95, '#B8714A', jarP, false);
    jar(3.0, 1.58, R.zb + 0.12, 0.5, '#B8714A', pitP, false); jar(-2.15, 1.56, R.zb + 0.12, 0.45, '#8E4E34', pitP);
    jar(-0.35, 2.0, R.zb + 0.12, 0.42, '#A0583A', pitP, false); jar(0.0, 2.0, R.zb + 0.12, 0.36, '#B8714A', pitP);
    // a basket and a low table with bread and a bowl
    { const g = lathe([[0, 0], [0.2, 0], [0.24, 0.18], [0.25, 0.26], [0, 0.26]], 8); const m = new THREE.Mesh(g, LW.M('#B08A52')); m.position.set(-3.55, 0, -2.6); m.castShadow = m.receiveShadow = true; scene.add(m); }
    { const tg = facets(slab([-3.05, 0, 0.0], [-2.35, 0.3, 0.5], 'y', 0.01, 61, 0.3), woodCol, 161); addMesh(tg, VC()); const bw = new THREE.Mesh(lathe([[0, 0], [0.1, 0], [0.16, 0.07], [0, 0.07]], 7), LW.M('#C08A5A')); bw.position.set(-2.6, 0.3, 0.25); scene.add(bw); const br = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), LW.M('#C99A5E')); br.scale.set(1.3, 0.55, 1); br.position.set(-2.85, 0.33, 0.2); scene.add(br); }

    // the curtain of the inner door, drawn to the left
    const cg = new THREE.PlaneGeometry(0.4, DOOR.h - 0.05, 8, 8); const cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setZ(i, Math.sin(x * 34) * 0.04 + Math.sin(y * 3) * 0.01); cp.setX(i, x * (1 - (y + DOOR.h / 2) / DOOR.h * 0.25) - (y < -0.2 ? (y + 0.2) * 0.06 : 0)); }
    cg.computeVertexNormals();
    curtain = new THREE.Mesh(cg, FW.mat('#6E2A22', { side: THREE.DoubleSide, roughness: 1 })); curtain.position.set(DOOR.x0 + 0.2, DOOR.h / 2, R.zb + 0.05); curtain.castShadow = curtain.receiveShadow = true; scene.add(curtain);
    { const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, DOOR.x1 - DOOR.x0 + 0.2, 5), LW.M('#3E2A1C')); rod.rotation.z = Math.PI / 2; rod.position.set((DOOR.x0 + DOOR.x1) / 2, DOOR.h - 0.04, R.zb + 0.07); scene.add(rod); }

    // the loom (16:13-14): two uprights, the top beam with its pin, the woven web, the warp hanging to loom weights
    loom = new THREE.Group();
    const lw2 = 1.05, lh = 1.95;
    for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(0.09, lh, 0.09); LW.jitter(g, 0.012, FW.rng(70 + s)); const m = new THREE.Mesh(g, LW.M('#6A4A32')); m.position.set(s * lw2 / 2, lh / 2, 0); m.rotation.z = -s * 0.04; loom.add(m); }
    { const g = new THREE.CylinderGeometry(0.06, 0.06, lw2 + 0.3, 7); g.rotateZ(Math.PI / 2); const m = new THREE.Mesh(g, LW.M('#5C3F2A')); m.position.set(0, lh - 0.08, 0.03); loom.add(m); }
    { const g = new THREE.CylinderGeometry(0.03, 0.03, lw2 + 0.1, 6); g.rotateZ(Math.PI / 2); const m = new THREE.Mesh(g, LW.M('#6A4A32')); m.position.set(0, 0.95, 0.07); loom.add(m); }
    const web = canvasTex(256, 512, (x, w, h) => {
      x.clearRect(0, 0, w, h);
      const top = h * 0.5;
      const bands = ['#D9C7A2', '#8E3324', '#D9C7A2', '#2F3A5E', '#C9A06A', '#D9C7A2', '#8E3324'];
      for (let i = 0; i < 14; i++) { x.fillStyle = bands[i % bands.length]; x.fillRect(4, i * top / 14, w - 8, top / 14 + 1); }
      x.fillStyle = 'rgba(40,20,10,0.15)'; for (let i = 0; i < 64; i++) x.fillRect(4 + i * 3.9, 0, 1, top);
      x.strokeStyle = '#D9C7A2'; x.lineWidth = 2; for (let i = 0; i < 28; i++) { const xx = 8 + i * ((w - 16) / 27); x.beginPath(); x.moveTo(xx, top); x.lineTo(xx + Math.sin(i) * 3, h - 6); x.stroke(); }
    });
    const webM = new THREE.Mesh(new THREE.PlaneGeometry(lw2 - 0.12, 1.75, 4, 6), new THREE.MeshStandardMaterial({ map: web, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }));
    webM.position.set(0, lh - 0.1 - 0.875, 0.04); webM.castShadow = true; webM.receiveShadow = true; loom.add(webM);
    for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.09, 6), LW.M('#8E6446')); m.position.set(-lw2 / 2 + 0.12 + i * ((lw2 - 0.24) / 8), 0.14 + (i % 2) * 0.05, 0.05); loom.add(m); }
    loomPin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.016, 0.34, 5), LW.M('#C9A06A'));
    loomPin.position.set(0.42, lh - 0.08, 0.11); loomPin.rotation.x = Math.PI / 2; loom.add(loomPin);
    loom.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    loom.position.set(LOOM.x, 0, LOOM.z); loom.rotation.y = 0.05; scene.add(loom);

    // the brazier in the inner chamber (the ember light the Philistines wait in)
    brazier = new THREE.Group();
    { const g = lathe([[0, 0], [0.2, 0], [0.28, 0.18], [0.3, 0.3], [0, 0.3]], 7); const m = new THREE.Mesh(g, LW.M('#4A3A2E')); brazier.add(m); }
    const coal = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.04, 7), new THREE.MeshBasicMaterial({ color: C('#FF6A2A').multiplyScalar(2.2), toneMapped: false }));
    coal.position.y = 0.3; brazier.add(coal); brazier.userData.coal = coal;
    const bglow = glowSprite('#FF7A30', 1.6, 0.55); bglow.position.y = 0.5; brazier.add(bglow); brazier.userData.glow = bglow;
    brazier.position.set(2.95, 0, -5.3); scene.add(brazier);
  }

  // oil lamps: a clay dish with a spout, a flame, a halo, a point light
  function makeLamp(x, y, z, I = 5) {
    const g = new THREE.Group();
    const dish = new THREE.Mesh(lathe([[0, 0], [0.05, 0], [0.085, 0.03], [0.08, 0.05], [0.03, 0.05], [0, 0.04]], 7), LW.M('#A0583A'));
    dish.scale.set(1, 1, 1.35); g.add(dish);
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 5), LW.M('#A0583A')); spout.rotation.z = Math.PI / 2; spout.position.set(0.09, 0.035, 0); g.add(spout);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.09, 6), new THREE.MeshBasicMaterial({ color: C('#FFC060').multiplyScalar(2.6), toneMapped: false, fog: false }));
    flame.position.set(0.12, 0.1, 0); g.add(flame);
    const halo = glowSprite('#FFB050', 0.4, 0.55); halo.position.set(0.12, 0.1, 0); g.add(halo);
    const light = new THREE.PointLight(C('#FFBE78'), I, 5.5, 1.8); light.position.set(0.12, 0.2, 0.15); if (I >= 1.5) g.add(light);
    g.position.set(x, y, z); g.userData = { flame, halo, light, I };
    scene.add(g); lamps.push(g);
    return g;
  }

  // ---------------- people ----------------
  function bb(cw, ch, ox, oy, s, draw) {
    const b = LW.billboard({ cw, ch, worldH: ch / (DU * s), footPx: ch - oy, draw: (ctx, st) => { ctx.translate(ox, oy); ctx.scale(s, s); draw(ctx, st); } });
    scene.add(b, b.userData.caster); bbAll.push(b);
    return b;
  }
  const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
  function contactShadow(obj, rx = 0.45, rz = 0.3, ox = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rx * 2, rz * 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobTex), transparent: true, depthWrite: false, color: 0x1a100a, opacity: 0.85 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m); contact.push([m, obj, ox]);
    return m;
  }

  // stand-ins until people2.js lands (PP2 is preferred whenever it exists)
  const fb = {
    samson(ctx, st) {
      const pose = st.pose;
      const strain = pose === 'strain' ? 0.9 : pose === 'burst' ? 0.6 : 0.15, burst = pose === 'burst' ? 1 : 0;
      const s0 = { t: st.t, strain, burst, burn: 0, brk: pose === 'burst' ? Math.max(0.01, st.brk || 0) : 0, rim: st.gold || 0, look: st.look || [0, 0] };
      if (pose === 'sleep') { ctx.translate(-250, -40); ctx.rotate(Math.PI / 2); ctx.scale(0.95, 0.95); }
      else if (pose === 'lean') { ctx.rotate(0.12); }
      PP.samson(ctx, s0);
    },
    delilah(ctx, st) {
      const pose = st.pose || 'stand', sit = pose === 'sit';
      const skin = '#C98E62', sh = PP.mix(skin, '#5A3424', 0.35), dress = '#A8432C', dsh = '#7A2C1E', cream = '#E8D8B6', hair = '#22140D';
      const up = sit ? 150 : 0, t = st.t || 0;
      const E = PP.ell, B = PP.blob;
      ctx.save();
      // hair mass behind
      PP.part(ctx, B([[-40, -500 + up], [-52, -440 + up], [-50, -360 + up], [0, -350 + up], [50, -360 + up], [52, -440 + up], [40, -500 + up], [0, -520 + up]]), hair, { shade: '#120A06', sd: 5 });
      if (sit) {
        for (const s of [-1, 1]) PP.part(ctx, E(s * 22, -8, 18, 8), '#6B3A26', { lw: 2 });
        PP.part(ctx, B([[-64, -170], [64, -170], [66, -100], [58, -18], [-58, -18], [-66, -100]], 0.4), dress, { shade: dsh, sd: 10 });
        PP.part(ctx, B([[-80, -205], [0, -212], [80, -205], [84, -150], [0, -140], [-84, -150]], 0.4), dress, { shade: dsh, sd: 8 });
      } else {
        for (const s of [-1, 1]) PP.part(ctx, E(s * 20, -8, 17, 8), '#6B3A26', { lw: 2 });
        PP.part(ctx, B([[-52, -300], [-60, -200], [-74, -90], [-80, -14], [0, -10], [80, -14], [74, -90], [60, -200], [52, -300]], 0.42), dress, { shade: dsh, sd: 12 });
        ctx.fillStyle = cream; ctx.fillRect(-12, -290, 24, 278);
        ctx.fillStyle = '#E2B45A'; ctx.fillRect(-78, -40, 156, 9);
      }
      // bodice + mantle
      PP.part(ctx, B([[-36, -388 + up], [-62, -372 + up], [-60, -320 + up], [-52, -268 + up], [52, -268 + up], [60, -320 + up], [62, -372 + up], [36, -388 + up], [0, -372 + up]], 0.45), dress, { shade: dsh, sd: 10 });
      PP.part(ctx, B([[-40, -388 + up], [-66, -372 + up], [-66, -330 + up], [-40, -350 + up], [0, -340 + up], [40, -350 + up], [66, -330 + up], [66, -372 + up], [40, -388 + up]], 0.45), cream, { shade: '#B8A27E', sd: 6 });
      PP.part(ctx, B([[-54, -282 + up], [54, -282 + up], [54, -262 + up], [-54, -262 + up]], 0.3), '#E2B45A', { lw: 2 });
      // arms
      const arm = (s, a, b) => {
        const J = [s * 58, -372 + up], d1 = [s * Math.sin(a), Math.cos(a)], d2 = [s * Math.sin(a + b), Math.cos(a + b)];
        const El = [J[0] + d1[0] * 88, J[1] + d1[1] * 88], Wr = [El[0] + d2[0] * 74, El[1] + d2[1] * 74];
        PP.group(ctx, [[PP.limb(J, El, 15, 12, 2, s), dress, { shade: dsh, sd: 6 }], [PP.limb(El, Wr, 12, 9, 1, s), skin, { shade: sh, sd: 4 }], [E(Wr[0], Wr[1], 10, 10), skin, { shade: sh, sd: 3 }]]);
        ctx.fillStyle = '#E2B45A'; ctx.beginPath(); ctx.arc(lerp(El[0], Wr[0], 0.75), lerp(El[1], Wr[1], 0.75), 6, 0, 6.283); ctx.fill();
      };
      const D = Math.PI / 180;
      if (pose === 'call') { arm(1, 14 * D, -20 * D); arm(-1, 150 * D, 140 * D); }
      else if (pose === 'beckon') { arm(-1, 14 * D, -20 * D); arm(1, 120 * D, 30 * D); }
      else if (sit) { arm(-1, 20 * D, -70 * D); arm(1, 20 * D, -70 * D); }
      else { arm(-1, 14 * D, -50 * D); arm(1, 14 * D, -50 * D); }
      // head
      ctx.translate(pose === 'turn' ? 4 : 0, -452 + up);
      PP.part(ctx, PP.poly([[-13, 26], [13, 26], [15, 62], [-15, 62]]), skin, { shade: sh, sd: 7 });
      const face = B([[-31, -14], [-30, 12], [-22, 34], [0, 44], [22, 34], [30, 12], [31, -14], [22, -38], [0, -44], [-22, -38]], 0.5);
      PP.part(ctx, face, skin, { shade: sh, sd: 6, rim: '#F7D7AE', rimA: 0.6 });
      const look = st.look || (pose === 'call' ? [-0.8, 0] : pose === 'turn' ? [0.2, 0] : [0, 0]);
      PP.eyes(ctx, 0, -4, { sp: 13, rx: 7.6, ry: 5.2, look });
      ctx.strokeStyle = '#24160F'; ctx.lineWidth = 3; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 13 + s * 7, -8); ctx.lineTo(s * 13 + s * 11, -12); ctx.stroke(); }
      PP.brows(ctx, 0, -15, { lift: 2, th: 3, col: '#1A0E08' });
      ctx.strokeStyle = '#24160F'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(2, 2); ctx.quadraticCurveTo(4, 10, 5, 13); ctx.stroke();
      if (pose === 'call') PP.part(ctx, E(-2, 26, 7, 6), '#5A1E14', { lw: 1.6 }); else PP.part(ctx, (() => { const m = new Path2D(); m.moveTo(-8, 24); m.quadraticCurveTo(0, 30, 8, 24); m.quadraticCurveTo(0, 22, -8, 24); return m; })(), '#A8443A', { lw: 1.4 });
      PP.part(ctx, B([[-35, -2], [-36, -26], [-26, -44], [0, -52], [26, -44], [36, -26], [35, -2], [28, -20], [12, -32], [0, -30], [-12, -32], [-28, -20]], 0.5), hair, { shade: '#120A06', sd: 4, rim: '#5A3C26', rimA: 0.8 });
      PP.part(ctx, B([[-33, -26], [0, -40], [33, -26], [33, -20], [0, -34], [-33, -20]], 0.35), '#E2B45A', { lw: 1.6 });
      for (const s of [-1, 1]) { ctx.strokeStyle = '#E2B45A'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(s * 32, 12, 6, 0, 6.283); ctx.stroke(); }
      ctx.restore();
    },
    barber(ctx, st) {
      ctx.save(); ctx.beginPath(); ctx.rect(-400, -900, 800, 900); ctx.clip(); ctx.translate(0, 150);
      PP.judean(ctx, { robe: '#6E5A44', cloth: '#C9B48E', hand: 0.6 + 0.4 * Math.sin((st.k || 0) * Math.PI), look: [-0.8, 0.4] });
      ctx.restore();
    },
  };
  const drawSam = (ctx, st) => { const p = P2(); (p && p.samson ? p.samson : fb.samson)(ctx, Object.assign({}, st)); };
  const drawDel = (ctx, st) => { const p = P2(); (p && p.delilah ? p.delilah : fb.delilah)(ctx, Object.assign({ couch: false }, st)); };
  const drawBarber = (ctx, st) => { const p = P2(); (p && p.barber ? p.barber : fb.barber)(ctx, Object.assign({}, st)); };
  // Samson's 'sleep' origin relative to Delilah's 'sit' origin (PP2.ANCHOR), so his head rests on her knees (16:19)
  const sleepOff = () => { const p = P2(); const A = p && p.ANCHOR && p.ANCHOR.sleepOnLap; return A || [-290, -60]; };
  const BARBER_X = 196;

  // the sleep group (16:19): Delilah seated, Samson asleep on her knees, the man at his head: one card, so it always lines up
  function drawGroup(ctx, st) {
    const [sx, sy] = sleepOff();
    ctx.save(); drawDel(ctx, { pose: 'sit', t: st.t, look: [-0.5, 0.8] }); ctx.restore();
    ctx.save(); ctx.translate(sx, sy); drawSam(ctx, { pose: 'sleep', t: st.t, hair: st.hair, gold: st.gold }); ctx.restore();
    if (st.barber) { ctx.save(); ctx.translate(BARBER_X, 0); drawBarber(ctx, { pose: 'shave', k: st.k, t: st.t }); ctx.restore(); }
  }
  // a billboard sized from PP2.SIZES when the cast is loaded (else the stand-in size)
  function castBB(name, fbSize, draw) {
    const p = P2(); const Z = p && p.SIZES && p.SIZES[name];
    if (Z) return bb(Z.cw, Z.ch, Z.cw / 2, Z.ch - Z.footPx, Z.scale, draw);
    return bb(...fbSize, draw);
  }

  function makeSoldier(i) {
    const variants = [{ shout: 0 }, { spearSide: -1, kilt: '#B24A32', trim: '#E4D3B0', shout: 0 }, { skin: '#A87048', shout: 0 }, { kilt: '#D8C6A0', spearSide: -1, skin: '#B47A50', shout: 0 }, { skin: '#C99062', shout: 0 }, { spearSide: -1, shout: 0 }];
    const o = variants[i % variants.length];
    const b = bb(340, 470, 170, 456, 0.5 * 1.0, (ctx) => PP.soldier(ctx, o));
    b.userData.update('x');
    return b;
  }

  function build() {
    scene = new THREE.Scene();
    scene.background = C('#0C0A10');
    scene.fog = new THREE.Fog(C('#2A2233'), 5, 24);
    hemi = new THREE.HemisphereLight(C('#5A6A9E'), C('#4A3020'), 0.9); scene.add(hemi);
    // the warm key: lamplight from the upper left (God's side), soft shadows
    key = new THREE.DirectionalLight(C('#FFC890'), 2.4);
    key.position.set(-5.5, 6.8, 3.2); key.target.position.set(0.4, 0, -1.8);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    const sc = key.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 0.5; sc.far = 25;
    key.shadow.bias = -0.0005; key.shadow.normalBias = 0.02;
    scene.add(key, key.target);
    // dusk through the window
    winSpot = new THREE.SpotLight(C('#7F98E6'), 40, 16, 0.38, 0.65, 1.4);
    winSpot.position.set(-3.6, 3.2, -6.4); winSpot.target.position.set(-1.6, 0, -0.2);
    winSpot.castShadow = false;
    scene.add(winSpot, winSpot.target);
    // ember light out of the inner chamber (screen right)
    emberSpot = new THREE.SpotLight(C('#FF6A30'), 0, 12, 0.42, 0.6, 1.4);
    emberSpot.position.set(2.45, 1.5, -5.4); emberSpot.target.position.set(0.9, 0, 0.6);
    emberSpot.castShadow = false;
    scene.add(emberSpot, emberSpot.target);
    emberPt = new THREE.PointLight(C('#FF6A2A'), 4, 4.2, 1.5); emberPt.position.set(2.3, 1.3, -4.7); scene.add(emberPt);
    emberGlow = glowSprite('#FF7A3A', 3.2, 0); emberGlow.position.set(2.15, 1.25, -4.1); scene.add(emberGlow);
    // God's light: gold, from the upper left, off until a flare
    goldSpot = new THREE.SpotLight(C('#FFD98A'), 0, 20, 0.16, 0.6, 1.2);
    goldSpot.position.set(-3.8, 7.5, 1.0); goldSpot.target.position.set(0, 0.8, -1); scene.add(goldSpot, goldSpot.target);

    buildRoom();
    buildProps();
    makeLamp(-1.95, 1.56, R.zb + 0.13, 2.4);   // back wall ledge by the window
    makeLamp(3.12, 1.58, R.zb + 0.13, 2.0);    // ledge right of the inner door
    makeLamp(R.x0 + 0.12, 1.46, -0.55, 1.1).userData.halo.scale.setScalar(0.3);   // left wall niche
    { // a tall lampstand by the couch
      const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 1.25, 5), LW.M('#4A3424')); pole.position.y = 0.62; g.add(pole);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.16, 0.06, 6), LW.M('#4A3424')); foot.position.y = 0.03; g.add(foot);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.04, 7), LW.M('#4A3424')); plate.position.y = 1.26; g.add(plate);
      g.traverse((c) => { if (c.isMesh) c.castShadow = c.receiveShadow = true; });
      g.position.set(-3.55, 0, -2.15); scene.add(g);
      makeLamp(-3.55, 1.28, -2.15, 2.4);
    }
    // window light pool on the floor + a soft shaft
    winPool = LW.pool(1.0, '#6F86D6'); winPool.scale.set(1.0, 1.6, 1); winPool.position.set(-2.1, 0.03, -1.1); winPool.rotation.z = 0.5; scene.add(winPool);

    // characters
    sam = castBB('samson', [1300, 1700, 650, 1630, 2.5], drawSam); contactShadow(sam, 0.5, 0.3);
    del = castBB('delilah', [1000, 1560, 500, 1510, 2.5], drawDel); contactShadow(del, 0.42, 0.28);
    group = bb(2600, 1200, 1560, 1150, 2.4, drawGroup);
    // seated / lying figures are composited over the 3D couch (their legs hang in front of it, his body lies along it)
    group.material.depthTest = false; group.renderOrder = 20;
    for (let i = 0; i < 6; i++) { const s = makeSoldier(i); soldiers.push(s); contactShadow(s, 0.38, 0.25); }
    // the seven locks on the floor (a flat decal redrawn as they fall)
    { const c = document.createElement('canvas'); c.width = 512; c.height = 256; lockCtx = c.getContext('2d'); lockTex = new THREE.CanvasTexture(c); lockTex.colorSpace = THREE.SRGBColorSpace;
      lockDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshStandardMaterial({ map: lockTex, transparent: true, alphaTest: 0.2, roughness: 1, depthWrite: false }));
      lockDecal.rotation.x = -Math.PI / 2; lockDecal.position.set(0.15, 0.03, -1.35); lockDecal.renderOrder = 3; lockDecal.receiveShadow = true; scene.add(lockDecal); }
    sparks = LW.particles(90, '#FFD27A', 0.05); scene.add(sparks);
    motes = LW.particles(60, '#FFE3B0', 0.03); scene.add(motes);
    dust = LW.particles(70, '#FFD9A8', 0.018); scene.add(dust);
  }

  // ---------------- per-frame state ----------------
  const HIDE = (b) => { b.visible = false; b.userData.caster.visible = false; };
  const SHOW = (b, x, z, y = 0) => { b.visible = true; b.userData.caster.visible = true; b.position.set(x, y, z); };
  function resetFrame(t) {
    [sam, del, group, ...soldiers].forEach(HIDE);
    del.material.depthTest = true; del.renderOrder = 0;
    contact.forEach(([m]) => (m.visible = false));
    lockDecal.visible = false;
    loom.visible = true; loom.position.set(LOOM.x, 0, LOOM.z); loom.rotation.set(0, 0.05, 0); loomPin.position.set(0.42, 1.87, 0.11); loomPin.rotation.set(Math.PI / 2, 0, 0); loomPin.visible = true;
    sparks.userData.update((i, v) => { v.set(0, -50, 0); return { alpha: 0 }; });
    motes.userData.update((i, v) => { v.set(0, -50, 0); return { alpha: 0 }; });
    goldSpot.intensity = 0; goldSpot.visible = false;
  }
  // light mood: cold 0..1 (lamps low, window night), ember 0..1 (the inner chamber's light)
  function mood(t, cold, ember, lampK = 1) {
    hemi.color.set(C('#5A6596').lerp(C('#3A4884'), cold)); hemi.groundColor.set(C('#3A2C2A').lerp(C('#1C1A24'), cold)); hemi.intensity = lerp(0.85, 0.75, cold);
    key.color.set(C('#FFD0A0').lerp(C('#8E9CCB'), cold)); key.intensity = lerp(1.75, 0.4, cold);
    winSpot.intensity = lerp(34, 24, cold); winSpot.color.set(C('#86A0F0').lerp(C('#5C74C8'), cold));
    winPool.material.opacity = lerp(0.2, 0.14, cold);
    const fl = (i) => 1 + 0.07 * Math.sin(t * 13.1 + i * 2.1) + 0.05 * Math.sin(t * 23.7 + i * 5.3) + 0.03 * Math.sin(t * 41 + i);
    lamps.forEach((L, i) => {
      const k = lampK * (L.userData.out != null ? L.userData.out : 1);
      L.userData.light.intensity = L.userData.I * fl(i) * k * lerp(1, 0.55, cold);
      L.userData.flame.scale.set(1, (0.85 + 0.25 * Math.sin(t * 11 + i * 3)) * Math.max(0.05, k), 1); L.userData.flame.visible = k > 0.03;
      L.userData.halo.material.opacity = 0.6 * k * fl(i) * (L.userData.I < 1.5 ? 0.6 : 1); L.userData.halo.scale.setScalar(0.42 * (0.9 + 0.1 * fl(i)));
    });
    const ef = 1 + 0.12 * Math.sin(t * 7.3) + 0.08 * Math.sin(t * 17.9 + 1) + 0.05 * Math.sin(t * 31);
    emberSpot.intensity = ember * 24 * ef; emberPt.intensity = (1.5 + ember * 9) * ef; emberGlow.material.opacity = 0.12 + 0.3 * ember * ef;
    brazier.userData.glow.material.opacity = 0.35 + 0.3 * ember;
    // dust in the lamp air
    dust.userData.update((i, v) => {
      const k = (hsh(i, 7) + t * 0.018 * (0.5 + hsh(i, 8))) % 1;
      v.set(-3.5 + hsh(i, 1) * 7 + Math.sin(t * 0.3 + i) * 0.2, 0.3 + k * 2.6, -2.9 + hsh(i, 2) * 3.6 + Math.cos(t * 0.25 + i * 2) * 0.2);
      return { alpha: 0.35 * Math.sin(Math.PI * k) * (0.4 + 0.6 * hsh(i, 3)) * (1 - 0.6 * cold), size: 0.7 + hsh(i, 4) };
    });
  }
  const tint = (b, r, g, bl) => b.material.color.setRGB(r, g, bl);

  // camera: keys {p, l, f}; focus on a world point; vertical shift of the frame
  const K = (p, l, f = 38) => ({ p, l, f });
  // look from k.p at k.l; the look point lands at screen (sx, sy) (0..1) by shifting the lens, so verticals stay straight
  function setCam(k, focusP, ap, sy = 0.5, roll = 0, sx = 0.5) {
    FW.setCam(cam, k.p, k.l, k.f, roll);
    cam.setViewOffset(W, H, -(sx - 0.5) * W, -(sy - 0.5) * H, W, H);
    cam.updateMatrixWorld();
    const focus = -new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z;
    return { focus, aperture: ap };
  }
  const shake = (k, d, amp, dur = 0.35) => { if (d < 0 || d > dur) return k; const a = amp * Math.pow(1 - d / dur, 2); return { p: [k.p[0] + Math.cos(d * 70) * a, k.p[1] + Math.sin(d * 53 + 1) * a, k.p[2]], l: k.l, f: k.f }; };

  // gold sparks bursting from him (a flare of God's strength), deterministic
  function burstSparks(t, t0, c, seed, n0 = 0, n1 = 90) {
    sparks.userData.update((i, v) => {
      if (i < n0 || i >= n1) { v.set(0, -50, 0); return { alpha: 0 }; }
      const age = t - t0 - hsh(i, seed) * 0.08; if (age < 0 || age > 1.1) { v.set(0, -50, 0); return { alpha: 0 }; }
      const a = hsh(i, seed + 1) * 6.283, sp = 0.8 + hsh(i, seed + 2) * 2.2, up = 0.4 + hsh(i, seed + 3) * 1.6;
      v.set(c[0] + Math.cos(a) * sp * age * 0.8, c[1] + (hsh(i, seed + 4) - 0.5) * 0.9 + up * age - 1.4 * age * age, c[2] + Math.sin(a) * sp * age * 0.5);
      return { alpha: Math.pow(1 - age / 1.1, 1.5) * (0.7 + 0.3 * Math.sin(age * 40 + i)), size: 0.6 + hsh(i, seed + 5) * 1.2 };
    });
  }
  function goldMotes(t, c, amt, r = 0.7) {
    motes.userData.update((i, v) => {
      const k = (hsh(i, 7) + t * 0.08 * (0.5 + hsh(i, 8))) % 1, a = hsh(i, 9) * 6.283 + t * 0.3;
      v.set(c[0] + Math.cos(a) * r * (0.4 + hsh(i, 10)), c[1] - 0.6 + k * 1.9, c[2] + Math.sin(a) * r * 0.5);
      return { alpha: amt * Math.sin(Math.PI * k) * (0.5 + 0.5 * hsh(i, 11)), size: 0.6 + hsh(i, 12) * 0.9 };
    });
  }

  // ---------------- the shots ----------------
  const SH = {};
  const ST = (o) => Object.assign({ t: 0, pose: 'stand', hair: 1, gold: 0, look: [0, 0] }, o);
  function poseSam(st) { const s = Object.assign({}, st, { t: q(st.t, 30), gold: q(st.gold || 0, 40), brk: q(st.brk || 0, 60), hair: q(st.hair ?? 1, 28) }); sam.userData.update(JSON.stringify(s), s); }
  function poseDel(st) { const s = Object.assign({}, st, { t: q(st.t, 30) }); del.userData.update(JSON.stringify(s), s); }

  // S10: "Then came Delilah." She stands at the dusk window and turns to us; MCU, slow push
  SH.delilah = (t, shot) => {
    mood(t, 0.0, 0.15);
    const tD = shot.beats.delilah ?? shot.t0 + 0.5;
    const turn = prog(t, tD - 0.35, tD + 0.15, ease.inOut);
    SHOW(del, -2.72, -2.42); tint(del, 1.0, 0.93, 0.86);
    poseDel({ pose: 'turn', t, k: q(Math.max(0.001, turn), 24) });
    const u = ease.inOut(clamp((t - shot.t0) / shot.dur));
    const k = FW.camLerpK(K([-2.12, 1.64, 0.8], [-2.72, 1.56, -2.42], 38), K([-2.22, 1.62, 0.38], [-2.72, 1.56, -2.42], 38), u);
    const c = setCam(k, [-2.72, 1.5, -2.42], 4.2, 0.45, 0, 0.5);
    contact.forEach(([m, o]) => { if (o === del) m.visible = true; });
    return Object.assign(c, { bill: [del], tags: [{ text: 'DELILAH', sub: 'JUDGES 16:4', p: [-2.72, 1.8, -2.42], k: prog(t, tD + 0.1, tD + 0.75, (x) => x), dy: -50, dx: 215 }] });
  };

  // S11: "The Philistines are upon you, Samson!" She calls to screen left; the men wait in the inner chamber
  const stampStep = (shot) => { const t0 = shot.beats.shout - 0.05, t1 = shot.t1 - 0.15; return [t0, Math.max(0.45, (t1 - t0) / 4.4)]; };
  SH.call = (t, shot) => {
    mood(t, 0.05, 0.55);
    const [s0, step] = stampStep(shot);
    const n = Math.floor((t - s0) / step), ph = (t - s0) / step - n;
    const pulse = t >= s0 ? Math.exp(-ph * 5) : 0;
    SHOW(del, 0.95, -1.62); tint(del, 1.0, 0.92, 0.84);
    poseDel({ pose: 'call', t, k: q(pulse, 10) });
    // men in ambush in the inner chamber (16:9), in ember shadow
    const inside = [[1.75, -4.35], [2.45, -4.75], [3.0, -4.25]];
    inside.forEach(([x, z], i) => { SHOW(soldiers[i], x, z); tint(soldiers[i], 0.42, 0.27, 0.24); soldiers[i].userData.tilt = Math.sin(t * 1.3 + i) * 0.01; });
    const sh = shot.beats.shout ?? shot.t0 + 0.1;
    const whip = 1 - ease.out(clamp((t - sh + 0.02) / 0.3));
    const u = ease.inOut(clamp((t - shot.t0) / shot.dur));
    let k = FW.camLerpK(K([-0.62, 1.55, 1.62], [0.95, 1.56, -1.62], 38), K([-0.5, 1.55, 1.38], [0.95, 1.56, -1.62], 38), u);
    k = { p: k.p, l: [k.l[0] - whip * 0.7, k.l[1], k.l[2] - whip * 0.3], f: k.f };
    const c = setCam(k, [0.95, 1.5, -1.62], 4.0, 0.4, whip * 1.5, 0.47);
    contact.forEach(([m, o]) => { if (o === del) m.visible = true; });
    return Object.assign(c, { bill: [del, soldiers[0], soldiers[1], soldiers[2]] });
  };

  // S12: "Three times, he broke free." Three setups, one per bond, each snapping in a flare of gold
  function trapBeats(shot) {
    const c2 = Math.min(shot.t1 - 0.5, (shot.beats.broke ?? shot.t0 + shot.dur * 0.67) - 0.08);
    const c1 = (shot.t0 + c2) / 2;
    return [shot.t0, c1, c2, shot.t1];
  }
  const BONDS = [
    { bonds: 'bowstring', name: 'FRESH BOWSTRINGS', ref: '16:9' },
    { bonds: 'rope', name: 'NEW ROPES', ref: '16:12' },
    { bonds: 'loom', name: 'THE LOOM', ref: '16:14' },
  ];
  SH.traps = (t, shot) => {
    mood(t, 0.0, 0.35);
    const cuts = trapBeats(shot);
    const i = t < cuts[1] ? 0 : t < cuts[2] ? 1 : 2;
    const a = cuts[i], b = cuts[i + 1], snap = a + Math.min(0.3, (b - a) * 0.45);
    const d = t - snap;
    const brk = clamp(d / 0.45), burst = d >= 0 ? 1 : 0;
    const flare = d >= 0 ? Math.exp(-d * 3.2) : clamp(1 - Math.abs(d) / 0.12) * 0.3;
    const gold = clamp(Math.max(0.25, flare));
    const pos = [[-0.85, -1.15], [-0.25, -0.95], [LOOM.x + 0.02, LOOM.z + 0.55]][i];
    SHOW(sam, pos[0], pos[1]); tint(sam, 1.0 + flare * 0.1, 0.95 + flare * 0.06, 0.88);
    const strainT = clamp((t - a) / Math.max(0.01, snap - a));
    poseSam(ST({ t, pose: burst ? 'burst' : 'strain', bonds: BONDS[i].bonds, brk, gold, strain: q(0.6 + 0.4 * strainT, 20), k: q(ease.out(clamp(d / 0.22)), 30), look: burst ? [0, -0.3] : [0.3, 0.1] }));
    // the loom comes away with him (16:14): the pin flies, the frame topples
    loom.visible = i !== 2; // the loom his hair is woven into is drawn with him (PP2 'loom' bonds)
    if (i === 2 && !P2()) {
      const pull = ease.out(clamp(d / 0.5));
      loom.rotation.set(-pull * 0.32, 0.05, -pull * 0.22); loom.position.set(LOOM.x + pull * 0.12, 0, LOOM.z + pull * 0.25);
      if (d > 0) { const pd = Math.min(d, 0.6); loomPin.position.set(0.42 + pd * 1.6, 1.87 + pd * 2.0 - pd * pd * 5, 0.11 + pd * 1.0); loomPin.rotation.set(Math.PI / 2 + pd * 14, pd * 6, 0); }
    }
    const c3 = [pos[0], 1.15, pos[1]];
    goldSpot.target.position.set(pos[0], 0.8, pos[1]); goldSpot.position.set(pos[0] - 3.6, 7.6, pos[1] + 2.2); goldSpot.intensity = flare * 60 + 6 * gold; goldSpot.visible = true;
    burstSparks(t, snap, c3, 3 + i * 11);
    // three setups: front-left medium, low right close, the loom from the left
    const face = [pos[0], 1.62, pos[1]];
    const ks = [
      [K([-2.2, 1.5, 2.45], face, 38), K([-2.07, 1.5, 2.17], face, 38), 0.49],
      [K([0.9, 0.95, 1.95], face, 38), K([0.8, 0.98, 1.72], face, 38), 0.48],
      [K([-0.7, 2.4, 1.6], face, 38), K([-0.6, 2.35, 1.38], face, 38), 0.5],
    ][i];
    let k = FW.camLerpK(ks[0], ks[1], ease.out(clamp((t - a) / (b - a))));
    k = shake(k, d, 0.03, 0.3);
    const c = setCam(k, c3, 4.4, ks[2], 0, 0.5);
    const bill = [sam];
    contact.forEach(([m, o]) => { if (o === sam) m.visible = true; });
    return Object.assign(c, {
      bill, rays: { amt: 0.25 + flare * 0.9, target: [pos[0], 1.15, pos[1]] },
      flash: d >= 0 && d < 0.14 ? Math.pow(1 - d / 0.14, 2) * 0.8 : 0, bloom: 0.15 + flare * 0.12,
      post(ctx, tt, project) { counter(ctx, tt, cuts, i, d); },
    });
  };
  // the 1-2-3 counter under the narration
  function counter(ctx, t, cuts, i, d) {
    const y = 452;
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let n = 0; n < 3; n++) {
      const x = W / 2 + (n - 1) * 120, on = n < i ? 0.55 : n === i ? 1 : 0.18, fl = n === i && d >= 0 ? Math.exp(-d * 4) : 0;
      ctx.globalAlpha = on;
      if (n === i) { const g = ctx.createRadialGradient(x, y, 0, x, y, 70 + fl * 40); g.addColorStop(0, `rgba(255,205,120,${0.35 + 0.4 * fl})`); g.addColorStop(1, 'rgba(255,205,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 120, y - 120, 240, 240); }
      ctx.fillStyle = 'rgba(20,16,13,0.82)'; ctx.beginPath(); ctx.arc(x, y, 40, 0, 6.283); ctx.fill();
      ctx.strokeStyle = n <= i ? '#F0C46A' : 'rgba(244,234,213,0.5)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = '900 44px "Cinzel"'; ctx.fillStyle = n <= i ? '#F0C46A' : '#F4EAD5'; ctx.fillText(String(n + 1), x, y + 3);
    }
    const kk = clamp((t - cuts[i]) / 0.12);
    ctx.globalAlpha = kk; ctx.font = '700 34px "Cinzel"'; ctx.letterSpacing = '3px';
    ctx.shadowColor = 'rgba(6,6,18,0.7)'; ctx.shadowBlur = 14; ctx.fillStyle = '#F4EAD5';
    ctx.fillText(BONDS[i].name, W / 2, y + 78); ctx.fillStyle = '#F0C46A'; ctx.font = '700 26px "Cinzel"'; ctx.fillText('JUDGES ' + BONDS[i].ref, W / 2, y + 116);
    ctx.restore();
  }

  // S13: he tells her all his heart (16:17); on "hair", asleep on her knees, the seven locks shaved (16:19)
  SH.shave = (t, shot) => {
    const tHair = (shot.beats.hair ?? shot.t0 + shot.dur * 0.42) - 0.08, tSh = shot.beats.shaved ?? shot.t1 - 0.6;
    const goldOut = 1 - prog(t, tSh - 0.1, tSh + 0.55, ease.inOut);
    mood(t, 0.12 * (1 - goldOut) + 0.04, 0.2);
    if (t < tHair) {
      // two-shot: she sits on the couch, he leans in to tell her
      SHOW(del, -0.2, COUCH.z + 0.05, 0.03); tint(del, 1.0, 0.92, 0.84); del.material.depthTest = false; del.renderOrder = 20;
      poseDel({ pose: 'sit', t, look: [-0.85, -0.55] });
      SHOW(sam, -0.95, -1.35); tint(sam, 1.0, 0.94, 0.86);
      const lean = prog(t, (shot.beats.told ?? shot.t0 + 0.6) - 0.3, (shot.beats.told ?? shot.t0 + 0.6) + 0.3);
      poseSam(ST({ t, pose: 'lean', hair: 1, gold: 0.55, k: q(lean, 20), look: [0.8, 0.3] }));
      goldMotes(t, [-0.95, 1.5, -1.35], 0.45);
      const u = ease.inOut(clamp((t - shot.t0) / (tHair - shot.t0)));
      const k = FW.camLerpK(K([-0.3, 1.45, 2.45], [-0.58, 1.25, -1.5], 38), K([-0.36, 1.44, 2.1], [-0.58, 1.26, -1.5], 38), u);
      const c = setCam(k, [-0.6, 1.2, -1.5], 4.2, 0.57, 0, 0.5);
      contact.forEach(([m, o]) => { if (o === sam || o === del) m.visible = true; });
      return Object.assign(c, { bill: [del, sam], rays: { amt: 0.3, target: [-0.95, 1.45, -1.35] } });
    }
    // high angle over the sleeping Samson; the man shaves the seven locks one by one
    const cut0 = tHair + 0.55, cut1 = tSh - 0.15;
    const nCut = Math.max(0, Math.min(7, Math.floor(((t - cut0) / (cut1 - cut0)) * 7) + (t >= cut0 ? 1 : 0)));
    const stroke = t >= cut0 ? (((t - cut0) / ((cut1 - cut0) / 7)) % 1) : 0;
    const hair = nCut >= 7 ? lerp(0.3, 0, prog(t, tSh - 0.25, tSh + 0.15)) : 1 - (nCut / 7) * 0.7;
    const gp = [-0.1, 0, COUCH.z + 0.05];
    SHOW(group, gp[0], gp[2], 0.03); tint(group, 1.0, 0.93, 0.86);
    const st = { t: q(t, 30), hair: q(hair, 28), gold: q(0.6 * goldOut, 30), barber: true, k: q(nCut >= 7 ? 0 : stroke, 12) };
    group.userData.update(JSON.stringify(st), st);
    // the cut locks on the floor
    lockDecal.visible = true;
    if (lockN !== nCut) { lockN = nCut; drawLocks(nCut); }
    goldMotes(t, [gp[0] - 0.4, 0.9, gp[2]], 0.5 * goldOut, 0.6);
    lockDecal.position.set(gp[0] + 0.6, 0.03, gp[2] + 0.75);
    const u = ease.inOut(clamp((t - tHair) / (shot.t1 - tHair)));
    const head = [gp[0] + 0.22, 0.58, gp[2]];
    const k = FW.camLerpK(K([1.15, 3.45, 1.55], head, 38), K([1.02, 3.25, 1.2], head, 38), u);
    const c = setCam(k, head, 4.0, 0.63, 0, 0.47);
    return Object.assign(c, { bill: [group], rays: { amt: 0.32 * goldOut, target: [gp[0], 0.6, gp[2]] }, sat: lerp(1.0, 1.1, goldOut), post: (ctx, tt, project) => fallingLocks(ctx, tt, project, cut0, cut1, gp) });
  };
  function drawLocks(n) {
    const x = lockCtx; x.clearRect(0, 0, 512, 256);
    for (let i = 0; i < n; i++) {
      const cx = 90 + i * 52 + Math.sin(i * 3.1) * 14, cy = 128 + Math.cos(i * 2.3) * 40, a = Math.sin(i * 1.7) * 0.9;
      x.save(); x.translate(cx, cy); x.rotate(a);
      for (let k = 0; k < 9; k++) { x.fillStyle = k % 2 ? '#3A2618' : '#2C1B12'; x.beginPath(); x.ellipse(k * 11 - 44, (k % 2 ? 2 : -2), 8, 6, 0.5, 0, 6.283); x.fill(); x.strokeStyle = '#140B07'; x.lineWidth = 1.5; x.stroke(); }
      x.restore();
    }
    lockTex.needsUpdate = true;
  }
  function fallingLocks(ctx, t, project, cut0, cut1, gp) {
    const step = (cut1 - cut0) / 7;
    for (let i = 0; i < 7; i++) {
      const tc = cut0 + i * step + step * 0.5, age = t - tc; if (age < 0 || age > 0.4) continue;
      const a = project([gp[0] + 0.05, 0.6, gp[2]]), b = project([gp[0] + 0.45 + (i - 3) * 0.06, 0.03, gp[2] + 0.75]);
      const k = age / 0.4, x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k * k);
      ctx.save(); ctx.translate(x, y); ctx.rotate(k * 3 + i); ctx.globalAlpha = 1 - Math.max(0, k - 0.85) * 6;
      for (let j = 0; j < 7; j++) { ctx.fillStyle = j % 2 ? '#3A2618' : '#2C1B12'; ctx.beginPath(); ctx.ellipse(j * 9 - 27, (j % 2 ? 2 : -2), 7, 5, 0.5, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#140B07'; ctx.lineWidth = 1.5; ctx.stroke(); }
      ctx.restore();
    }
  }

  // S14: he wakes, stands easy, rolls his shoulders; the Philistines fill the doorway behind (ember, screen right)
  const doorFill = [[2.04, -3.28], [2.52, -3.3], [2.78, -3.92], [2.3, -3.98], [1.78, -2.8], [3.05, -4.4]];
  SH.wake = (t, shot) => {
    const tW = shot.beats.woke ?? shot.t0 + 0.3, tS = shot.beats.said ?? shot.t0 + 1.2;
    mood(t, 0.55, lerp(0.55, 1.0, prog(t, tS - 0.3, tS + 1.5)));
    SHOW(sam, -0.7, -0.65); tint(sam, 0.92, 0.88, 0.9);
    const roll = Math.sin((t - tW) * 2.2) * 0.5 + 0.5;
    poseSam(ST({ t, pose: 'wake', hair: 0, gold: 0, k: q(roll, 20), look: [-0.2, 0] }));
    soldiers.forEach((s, i) => {
      const at = tS - 0.2 + i * 0.45, k = ease.out(clamp((t - at) / 0.8));
      const [x, z] = doorFill[i];
      SHOW(s, x + 0.15 * (1 - k), lerp(z - 1.3, z, k));
      tint(s, i < 2 ? 0.78 : 0.62, i < 2 ? 0.52 : 0.4, i < 2 ? 0.42 : 0.34); s.userData.tilt = Math.sin(t * 7 + i) * 0.03 * (1 - k);
    });
    const u = ease.inOut(clamp((t - shot.t0) / shot.dur));
    const k = FW.camLerpK(K([-2.75, 1.55, 2.35], [-0.7, 1.64, -0.65], 38), K([-2.52, 1.55, 2.05], [-0.7, 1.64, -0.65], 38), u);
    const c = setCam(k, [-0.7, 1.4, -0.65], 4.2, 0.43, 0, 0.3);
    contact.forEach(([m, o]) => { if (o === sam || soldiers.includes(o)) m.visible = true; });
    return Object.assign(c, { bill: [sam, ...soldiers], sat: 1.02 });
  };

  // S15: "But he did not know that the LORD had left him." Locked: Samson small and unaware in the doorway light
  SH.left = (t, shot) => {
    const tL = shot.beats.left ?? shot.t1 - 1;
    const gone = prog(t, tL - 0.1, tL + 0.7);
    lamps.forEach((L, i) => { L.userData.out = i === 1 ? lerp(1, 0.04, gone) : lerp(0.6, 0.3, gone); });
    mood(t, lerp(0.8, 1.0, gone), 1.0, 0.8);
    SHOW(sam, 0.65, -0.5); const cool = prog(t, tL - 0.2, tL + 0.8); tint(sam, lerp(0.95, 0.66, cool), lerp(0.84, 0.66, cool), lerp(0.78, 0.82, cool));
    poseSam(ST({ t, pose: 'wake', hair: 0, gold: 0, k: 0.3, look: [-0.3, 0] }));
    soldiers.forEach((s, i) => { const [x, z] = doorFill[i]; SHOW(s, x, z); tint(s, 0.7, 0.45, 0.38); s.userData.tilt = 0; });
    const k = K([-0.6, 1.3, 2.55], [0.65, 1.64, -0.5], 38);
    const c = setCam(k, [0.65, 1.6, -0.5], 3.8, 0.64, 0, 0.4);
    contact.forEach(([m, o]) => { if (o === sam || soldiers.includes(o)) m.visible = true; });
    const dim = prog(t, shot.t0, shot.t0 + 0.8) * 0.18;
    return Object.assign(c, { bill: [sam, ...soldiers], dark: dim, sat: 0.92, exposure: 1.05 });
  };

  SCENES.sorek = {
    async build(env) { cam = env.cam; build(); },
    frame(t, shot, camera) {
      cam = camera;
      lamps.forEach((L) => (L.userData.out = null));
      resetFrame(t);
      const fn = SH[shot.v] || SH.delilah;
      const r = fn(t, shot);
      contact.forEach(([m, o, ox]) => { if (!o.visible) m.visible = false; m.position.set(o.position.x + (ox || 0), 0.02, o.position.z + 0.05); });
      // lift and gain are always passed: LW.render keeps the last values it was given, so a scene that omits them inherits another scene's grade
      return Object.assign({ scene, sun: key, maxR: 7, fgScale: 1.5, exposure: 1.12, sat: 1.08, bloom: 0.16, lift: [0.012, 0.016, 0.04], gain: [1, 1, 1] }, r, { scene, sun: key });
    },
  };
})();
