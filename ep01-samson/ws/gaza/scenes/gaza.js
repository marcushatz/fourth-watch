// GAZA (Judges 16:1-3) and the hill in front of Hebron. One low-poly world: the walled city on its tell, the gateway
// (two great doors, two posts, a bar), torches, flat-roofed mud-brick houses and a narrow street, the road up the slope
// to the hilltop, stars. NIGHT for S01-S04, S20, S24; DAWN for S32-S35 (the gates left standing on the hilltop).
// Samson is a 2D billboard (PP2.samson when published, PP.samson as a stand-in); the gate is a 3D prop.
// Every frame is a pure function of t (seeded rng only); all timing comes from shot.t0 / t1 / beats.
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const q = (v, n = 60) => Math.round(v * n) / n;
  const smooth = FW.smooth;

  // ---------------- geography ----------------
  // The knoll (the hilltop) sits at the origin. The city lies down the slope; its gate faces the hill.
  const PHI = (-50 * Math.PI) / 180;
  const GD = [Math.sin(PHI), Math.cos(PHI)];        // unit (x, z): from the city out through the gate, up toward the hill
  const PR = [GD[1], -GD[0]];                       // screen right when looking from the hill down at the city
  const K = [0, 0], KH = 13.5;                       // hilltop
  const GATE_D = 36, RW = 18;                       // gate distance from the hilltop, wall radius
  const G = [K[0] - GD[0] * GATE_D, K[1] - GD[1] * GATE_D];
  const CC = [G[0] - GD[0] * RW, G[1] - GD[1] * RW]; // city centre
  const CITY_Y = 1.0;
  const cphi = Math.cos(PHI), sphi = Math.sin(PHI);
  // city-local (gate at the origin, outward = +z, inward = -z) -> world
  const LX = (lx, lz) => G[0] + lx * cphi + lz * sphi;
  const LZ = (lx, lz) => G[1] - lx * sphi + lz * cphi;
  const L = (lx, ly, lz) => [LX(lx, lz), ly, LZ(lx, lz)];
  const along = (x, z) => (x - K[0]) * GD[0] + (z - K[1]) * GD[1];
  const across = (x, z) => (x - K[0]) * PR[0] + (z - K[1]) * PR[1];
  const AK = (a, c = 0) => [K[0] + GD[0] * a + PR[0] * c, K[1] + GD[1] * a + PR[1] * c]; // hill coords -> world (x, z)

  // the road: out of the gate, down the tell, up the slope to the top
  const ROAD = [G, AK(-GATE_D + 1.5), AK(-27, 2.2), AK(-18, 3.4), AK(-11, 2.6), AK(-5.5, 1.0), AK(-2.0, 0.2), AK(0, 0)];
  const distSeg = (x, z, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], wx = x - a[0], wz = z - a[1]; const k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz)); return Math.hypot(wx - vx * k, wz - vz * k); };
  const distRoad = (x, z) => { let d = 1e9; for (let i = 0; i < ROAD.length - 1; i++) d = Math.min(d, distSeg(x, z, ROAD[i], ROAD[i + 1])); return d; };
  const roadLen = (() => { let s = 0; for (let i = 0; i < ROAD.length - 1; i++) s += Math.hypot(ROAD[i + 1][0] - ROAD[i][0], ROAD[i + 1][1] - ROAD[i][1]); return s; })();
  const roadAt = (d) => { // point + tangent at distance d from the gate
    for (let i = 0; i < ROAD.length - 1; i++) { const a = ROAD[i], b = ROAD[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l || i === ROAD.length - 2) { const k = clamp(d / l); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), (b[0] - a[0]) / l, (b[1] - a[1]) / l]; } d -= l; }
  };

  const hRaw = (x, z) => {
    const a = along(x, z), c = across(x, z);
    let h = (FW.fbm(x * 0.05, z * 0.05, 3, 3) - 0.5) * 1.4 + (FW.noise2(x * 0.4, z * 0.4, 5) - 0.5) * 0.18;
    const sa = a < 0 ? 15 : 11;
    h += KH * Math.exp(-Math.pow(a / sa, 2) - Math.pow(c / 9, 2));                                  // the hill, a ridge end
    h += 2.2 * Math.exp(-Math.pow((a - 9) / 10, 2) - Math.pow((c + 9) / 9, 2));                     // its shoulder
    h += smooth(clamp((a - 34) / 40)) * (6 + 12 * FW.fbm(x * 0.025 + 7, z * 0.025, 9, 3));            // the hills toward Hebron
    h += smooth(clamp((Math.abs(c) - 30) / 30)) * smooth(clamp((a + 10) / 30)) * 5 * FW.fbm(x * 0.04, z * 0.04, 13, 3);
    return h;
  };
  const hFn = (x, z) => {
    let h = hRaw(x, z);
    const dc = Math.hypot(x - CC[0], z - CC[1]);
    const kt = 1 - smooth(clamp((dc - (RW + 1.2)) / 8));                                            // the tell
    h = lerp(h, CITY_Y + (FW.noise2(x * 0.3, z * 0.3, 21) - 0.5) * 0.06, kt);
    const dr = distRoad(x, z); if (dr < 1.6) h -= 0.08 * (1 - dr / 1.6);
    const dk = Math.hypot(x - K[0], z - K[1]); h = lerp(hRaw(K[0], K[1]) - 0.35, h, smooth(clamp((dk - 2.5) / 4.0))); // the broad top
    return h;
  };
  const colFn = (x, z, y, ny, rnd) => {
    const steep = 1 - ny, n = FW.fbm(x * 0.08 + 11, z * 0.08, 21, 3);
    let c;
    if (steep > 0.36) c = C(rnd < 0.5 ? '#AE9A82' : '#9E8B74');
    else if (steep > 0.2) c = C(n > 0.5 ? '#C2A271' : '#AFA466');
    else c = C(n > 0.62 ? '#BDB36C' : n > 0.42 ? '#A7AB5E' : '#949F55');
    const dc = Math.hypot(x - CC[0], z - CC[1]);
    if (dc < RW + 6) c.lerp(C(dc < RW ? '#B8986F' : '#BCA27A'), dc < RW ? 0.9 : 0.6 * smooth((RW + 6 - dc) / 6));
    const dr = distRoad(x, z); if (dr < 1.25) c.lerp(C('#D2BB90'), smooth(clamp((1.25 - dr) / 0.5)));
    if (Math.hypot(x - K[0], z - K[1]) < 2.2) c.lerp(C('#C9B48C'), 0.45);
    c.offsetHSL((rnd - 0.5) * 0.012, (rnd - 0.5) * 0.04, (rnd - 0.5) * 0.06);
    return c;
  };

  // ---------------- merged low-poly geometry ----------------
  function Merger() {
    const pos = [], col = [], v = new THREE.Vector3(), cc = new THREE.Color();
    let tri = 0;
    const api = {
      add(geo, m4, color, jit = 0.05) {
        const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, base = color.isColor ? color : C(color);
        for (let i = 0; i < p.count; i++) {
          if (i % 3 === 0) { const r = hsh(tri++, 3); cc.copy(base).offsetHSL((r - 0.5) * 0.01, 0, (r - 0.5) * jit); }
          v.fromBufferAttribute(p, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z); col.push(cc.r, cc.g, cc.b);
        }
        return api;
      },
      box(w, h, d, x, y, z, color, ry = 0, jit = 0.05, rx = 0, rz = 0) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(w, h, d));
        return api.add(UNIT_BOX, m, color, jit);
      },
      obj(o, jit = 0.05) { // merge a prop group (LW.olive etc.) by its world matrices
        o.updateMatrixWorld(true);
        o.traverse((c) => { if (c.isMesh && c.material && c.material.color) api.add(c.geometry, c.matrixWorld, c.material.color, jit); });
        return api;
      },
      mesh(mat) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, mat || new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }));
        m.castShadow = true; m.receiveShadow = true; return m;
      },
    };
    return api;
  }
  const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
  const mudBox = (rng) => LW.jitter(new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), 0.06, rng);

  // ---------------- the gate: two doors, two posts, the bar (one prop, lifted as one) ----------------
  // origin: ground level, centre of the gateway; doors in the local XY plane; the OUTER face looks +z
  const DW = 1.38, DH = 3.0, DT = 0.16, PW = 0.32, PH = 3.3, PB = 0.5, BAR_Y = 1.5;
  const POST_X = DW + 0.03 + PW / 2;
  function makeGateProp() {
    const g = new THREE.Group();
    const M = Merger(), rng = FW.rng(1601);
    const wood = ['#6E4C34', '#62432D', '#76533A', '#5B3D29', '#6A4A31'];
    for (const s of [-1, 1]) {
      const n = 5, pw = DW / n;
      for (let i = 0; i < n; i++) { const x = s * (0.02 + pw * (i + 0.5)); M.box(pw - 0.018, DH - (i % 2) * 0.03, DT, x, DH / 2, 0, wood[(i + (s > 0 ? 2 : 0)) % wood.length], 0, 0.08); }
      // inner battens (z-)
      for (const y of [0.45, DH - 0.5]) M.box(DW - 0.08, 0.2, 0.08, s * (DW / 2 + 0.02), y, -DT / 2 - 0.04, '#553A27');
      M.box(0.12, DH * 0.9, 0.07, s * (DW / 2 + 0.02), DH / 2, -DT / 2 - 0.035, '#553A27', 0, 0.05, 0, s * 0.42); // diagonal brace
      // outer bronze bands + studs (z+)
      for (const y of [0.5, 1.75, DH - 0.5]) {
        M.box(DW - 0.06, 0.12, 0.03, s * (DW / 2 + 0.02), y, DT / 2 + 0.015, '#9A7040');
        for (let k = 0; k < 6; k++) M.box(0.075, 0.075, 0.05, s * (0.16 + k * (DW - 0.3) / 5 + 0.02), y, DT / 2 + 0.035, '#C99A5C', Math.PI / 4, 0.1);
      }
      // the post
      M.box(PW, PH + PB, PW, s * POST_X, (PH - PB) / 2, 0, '#5A3D2A', 0, 0.06);
      M.box(PW + 0.08, 0.14, PW + 0.08, s * POST_X, PH + 0.04, 0, '#4E3424');
      // hinge straps from post to door
      for (const y of [0.55, DH - 0.55]) M.box(0.42, 0.1, DT + 0.06, s * (POST_X - 0.26), y, 0, '#3F3A33');
      // bracket that holds the bar
      M.box(0.2, 0.36, 0.26, s * POST_X, BAR_Y, -PW / 2 - 0.1, '#3F3A33');
    }
    // the bar across the inner face
    M.box(2 * POST_X + 0.5, 0.24, 0.22, 0, BAR_Y, -DT / 2 - 0.2, '#4C3322', 0, 0.05);
    for (const s of [-1, 1]) M.box(0.1, 0.27, 0.25, s * (POST_X + 0.2), BAR_Y, -DT / 2 - 0.2, '#2E2A26');
    g.add(M.mesh());
    // clods of earth and stones on the post feet (underground until the posts are pulled up)
    const D = Merger();
    for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
      const gg = LW.jitter(new THREE.IcosahedronGeometry(0.13 + rng() * 0.1, 0), 0.08, rng);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(s * POST_X + (rng() - 0.5) * 0.35, -PB + (rng() - 0.2) * 0.35, (rng() - 0.5) * 0.35), new THREE.Quaternion(), new THREE.Vector3(1, 0.8, 1));
      D.add(gg, m, i % 3 ? '#6B5039' : '#8A7A66', 0.1);
    }
    g.add(D.mesh());
    g.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return g;
  }

  // ---------------- Samson (PP2 when published; PP.samson as a stand-in) ----------------
  const SAM_H = 1.86;
  const samDraw = (ctx, st) => {
    const P2 = globalThis.PP2;
    if (P2 && typeof P2.samson === 'function') { P2.samson(ctx, st); return; }
    const f = { t: st.t || 0, look: st.look || [0, 0], rim: st.gold || 0, strain: st.strain || 0, burst: 0 };
    if (st.pose === 'carry') { f.strain = Math.max(f.strain, 0.45); f.burst = 0.84; }
    else if (st.pose === 'strain') f.strain = Math.max(0.85, f.strain);
    PP.samson(ctx, f);
  };
  function samSize() {
    const s = globalThis.PP2 && globalThis.PP2.SIZES && globalThis.PP2.SIZES.samson;
    if (s && s.cw && s.ch && s.worldH) return { cw: s.cw, ch: s.ch, worldH: s.worldH, footPx: s.footPx ?? 60, scale: s.scale ?? 2.5 };
    return { cw: 1300, ch: 1640, worldH: (SAM_H * 1640) / 1400, footPx: 60, scale: 2.5 };
  }
  function makeSam() {
    const z = samSize();
    return LW.billboard({ cw: z.cw, ch: z.ch, worldH: z.worldH, footPx: z.footPx, draw: (ctx, st) => { ctx.translate(z.cw / 2, z.ch - z.footPx); ctx.scale(z.scale, z.scale); samDraw(ctx, st); } });
  }

  // ---------------- scene state ----------------
  let scene, sky, stars, moonDisc, hemi, moon, cam, sam, samShadow, gate, gateHoles, dust, debris = [], torches = [], doorGlow, doorPool, curtainMeshes = [], PL = [], plGroup;
  let litWin, cityGlows = [];
  const blobTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); return t; }; })();
  const glowMat = (col, op = 1) => new THREE.SpriteMaterial({ map: LW.dotTex(), color: C(col), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false });

  // a wall torch: bracket, cup, flame, glow; optional point light
  function makeTorch(p, ry, withLight) {
    const g = new THREE.Group(); g.position.set(...p); g.rotation.y = ry;
    const M = Merger();
    M.box(0.08, 0.5, 0.08, 0, -0.25, 0.12, '#3A2E26', 0, 0, 0.5);
    M.box(0.06, 0.06, 0.3, 0, -0.42, 0.06, '#3A2E26');
    const cup = new THREE.CylinderGeometry(0.15, 0.08, 0.2, 6); M.add(cup, new THREE.Matrix4().makeTranslation(0, 0, 0.26), '#4A3A2C');
    g.add(M.mesh());
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 6), new THREE.MeshBasicMaterial({ color: C('#FFB056').multiplyScalar(2.4), toneMapped: false, fog: false }));
    flame.position.set(0, 0.28, 0.26); g.add(flame);
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.24, 5), new THREE.MeshBasicMaterial({ color: C('#FFF0C0').multiplyScalar(2.6), toneMapped: false, fog: false }));
    core.position.set(0, 0.22, 0.26); g.add(core);
    const glow = new THREE.Sprite(glowMat('#FF9A40', 0.55)); glow.scale.set(1.6, 1.6, 1); glow.position.set(0, 0.3, 0.3); g.add(glow);
    const halo = new THREE.Sprite(glowMat('#FF8A30', 0.18)); halo.scale.set(4.5, 4.5, 1); halo.position.set(0, 0.3, 0.3); g.add(halo);
    const T = { g, flame, core, glow, halo, seed: torches.length * 1.37 + 0.5, key: !!withLight, wp: new THREE.Vector3() };
    torches.push(T);
    return g;
  }

  // ---------------- build ----------------
  function build() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(C('#1A2440'), 30, 150);
    sky = LW.sky({ top: '#05081A', mid: '#0F1A38', hor: '#2A3A62', low: '#0D1326', sunDir: [-0.5, 0.45, 0.6], sunCol: '#9DB6FF', sunAmt: 0.35 });
    scene.add(sky);
    // stars: a deterministic field on the upper sky, following the camera
    {
      const n = 900, rng = FW.rng(909), p = new Float32Array(n * 3), a = new Float32Array(n), s = new Float32Array(n), ph = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const u = rng(), y = 0.04 + Math.pow(u, 0.8) * 0.96, r = Math.sqrt(1 - y * y), th = rng() * 6.283;
        p[i * 3] = Math.cos(th) * r * 240; p[i * 3 + 1] = y * 240; p[i * 3 + 2] = Math.sin(th) * r * 240;
        const b = rng(); a[i] = 0.35 + 0.65 * Math.pow(b, 3); s[i] = 2.2 + 3.8 * Math.pow(rng(), 4); ph[i] = rng() * 6.283;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('amp', new THREE.BufferAttribute(a, 1)); g.setAttribute('psize', new THREE.BufferAttribute(s, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: { t: { value: 0 }, amt: { value: 1 }, sz: { value: 1 }, col: { value: C('#DCE6FF') } },
        vertexShader: 'attribute float amp; attribute float psize; attribute float ph; uniform float t; uniform float sz; varying float vA; void main(){ vA = amp * (0.75 + 0.25 * sin(t * 2.3 + ph * 7.0)) * smoothstep(0.0, 0.12, normalize(position).y); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * sz; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform vec3 col; uniform float amt; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d) * 2.0; float m = smoothstep(1.0, 0.0, r); m = m * m; gl_FragColor = vec4(col * vA * amt * m, 1.0); }',
        transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false, toneMapped: false,
      });
      stars = new THREE.Points(g, mat); stars.frustumCulled = false; stars.renderOrder = -9;
      scene.add(stars);
      moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: LW.dotTex(), color: C('#E8EEFF'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
      moonDisc.renderOrder = -8; scene.add(moonDisc);
    }
    hemi = new THREE.HemisphereLight(C('#6F82B4'), C('#2E2A26'), 0.9); scene.add(hemi);
    moon = new THREE.DirectionalLight(C('#A9BEEB'), 1.6);
    moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048);
    moon.shadow.bias = -0.0005; moon.shadow.normalBias = 0.03; moon.shadow.radius = 3;
    scene.add(moon, moon.target);
    // a fixed pool of two warm point lights, placed per shot (constant light count: no shader recompiles)
    plGroup = new THREE.Group(); scene.add(plGroup);
    for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(C('#FFA45A'), 0, 12, 2.0); plGroup.add(l); PL.push(l); }

    { const tr = LW.terrain({ size: 190, seg: 128, cx: 8, cz: -14, hFn, colFn, seed: 16 }); tr.name = 'terrain'; scene.add(tr); }

    // ---- the city: wall ring, gate towers, houses, street ----
    const city = new THREE.Group(); city.name = 'city'; city.position.set(G[0], 0, G[1]); city.rotation.y = PHI; scene.add(city);
    const WM = Merger(), HM = Merger(), DM = Merger(), WIN = Merger();
    const rng = FW.rng(1602);
    const wallH = 4.6, wallT = 1.7, mud = ['#A07C57', '#977350', '#A6835D', '#8F6E4C'];
    const lc = [0, -RW]; // ring centre in city-local
    const ringN = 40;
    for (let i = 0; i < ringN; i++) {
      const a0 = (i / ringN) * Math.PI * 2, a1 = ((i + 1) / ringN) * Math.PI * 2, am = (a0 + a1) / 2;
      const arcMid = ((am + Math.PI) % (Math.PI * 2)) - Math.PI; // angle from the gate
      if (Math.abs(arcMid) * RW < 4.2) continue;
      const x = lc[0] + Math.sin(am) * RW, z = lc[1] + Math.cos(am) * RW, len = 2 * RW * Math.sin(Math.PI / ringN) + 0.25;
      const gy = hFn(LX(x, z), LZ(x, z)) - 0.6;
      WM.box(len, wallH + 0.6, wallT, x, gy + (wallH + 0.6) / 2, z, mud[i % 4], am, 0.06);
      WM.box(len + 0.02, 0.9, wallT + 0.2, x, gy + 0.45, z, '#857158', am, 0.06); // stone footing
      // crenellations on the outer edge
      for (let k = -1; k <= 1; k += 2) { const ox = Math.cos(am) * k * len * 0.25, oz = -Math.sin(am) * k * len * 0.25; WM.box(0.62, 0.5, 0.36, x + ox + Math.sin(am) * (wallT / 2 - 0.18), gy + wallH + 0.6 + 0.25, z + oz + Math.cos(am) * (wallT / 2 - 0.18), mud[(i + 1) % 4], am); }
      if (i % 7 === 3) { // towers around the ring
        const tx = lc[0] + Math.sin(am) * (RW + 0.6), tz = lc[1] + Math.cos(am) * (RW + 0.6);
        WM.box(3.4, wallH + 2.2, 3.2, tx, gy + (wallH + 2.2) / 2, tz, mud[(i + 2) % 4], am, 0.06);
        for (let k = -1; k <= 1; k++) WM.box(0.6, 0.5, 0.4, tx + Math.cos(am) * k * 1.1 + Math.sin(am) * 1.4, gy + wallH + 2.45, tz - Math.sin(am) * k * 1.1 + Math.cos(am) * 1.4, mud[i % 4], am);
      }
    }
    // gate towers + lintel + the gateway passage (opening 3.6 wide, 4.1 tall)
    const OW = 2 * POST_X + PW + 0.1, OH = 4.15, TW = 3.6, TH = wallH + 2.6;
    for (const s of [-1, 1]) {
      const x = s * (OW / 2 + TW / 2);
      WM.box(TW, TH + 0.6, wallT + 2.0, x, CITY_Y - 0.6 + (TH + 0.6) / 2, 0.2, s < 0 ? '#9C7854' : '#A27E59', 0, 0.05);
      WM.box(TW + 0.04, 1.0, wallT + 2.04, x, CITY_Y - 0.1, 0.2, '#857158');
      for (let k = 0; k < 4; k++) WM.box(0.6, 0.55, 0.4, x - TW / 2 + 0.45 + k * 0.9, CITY_Y + TH + 0.27, 0.2 + (wallT + 2.0) / 2 - 0.2, '#9C7854');
      for (let k = 0; k < 4; k++) WM.box(0.6, 0.55, 0.4, x - TW / 2 + 0.45 + k * 0.9, CITY_Y + TH + 0.27, 0.2 - (wallT + 2.0) / 2 + 0.2, '#9C7854');
      // timber jamb lining
      WM.box(0.22, OH, wallT + 0.1, s * (OW / 2 + 0.11), CITY_Y + OH / 2, 0, '#5E4330');
    }
    WM.box(OW + 0.4, 0.42, wallT + 0.3, 0, CITY_Y + OH + 0.21, 0, '#5E4330'); // timber lintel
    WM.box(OW + 0.2, TH - OH - 0.4, wallT + 0.4, 0, CITY_Y + OH + 0.42 + (TH - OH - 0.4) / 2, 0.1, '#A07C57');
    for (let k = 0; k < 4; k++) WM.box(0.6, 0.55, 0.4, -OW / 2 + 0.45 + k * ((OW - 0.9) / 3), CITY_Y + TH + 0.27, 0.2 + (wallT + 2.0) / 2 - 0.2, '#A6835D');
    // threshold stone
    WM.box(OW + 0.3, 0.14, wallT + 0.6, 0, CITY_Y + 0.02, 0, '#8E8270');
    city.add(WM.mesh());

    // houses: a block of flat-roofed mud-brick houses with parapets and beam ends; streets kept clear
    const house = (x, z, w, d, h, ry, face, opts = {}) => { // centre (x, z), face: which local side has the door (+1 = +z)
      const col = opts.col || ['#B48F66', '#A9845E', '#BE9B72', '#A07B55', '#B89670'][Math.floor(hsh(x * 3 + z, 2) * 5)];
      const gy = CITY_Y;
      const mbox = (w2, h2, d2, x2, y2, z2, c) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(x2, y2, z2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(w2, h2, d2)); HM.add(mudBox(FW.rng(Math.round(x * 13 + z * 7 + y2 * 5))), m, c, 0.07); };
      const off = (dx, dz) => [x + dx * Math.cos(ry) + dz * Math.sin(ry), z - dx * Math.sin(ry) + dz * Math.cos(ry)];
      mbox(w, h, d, x, gy + h / 2, z, col);
      // parapet
      for (const [dx, dz, ww, dd] of [[0, d / 2 - 0.1, w, 0.2], [0, -d / 2 + 0.1, w, 0.2], [w / 2 - 0.1, 0, 0.2, d], [-w / 2 + 0.1, 0, 0.2, d]]) { const [px, pz] = off(dx, dz); HM.box(ww, 0.38, dd, px, gy + h + 0.19, pz, PP.mix(col, '#E0C9A0', 0.15), ry, 0.05); }
      // roof beam ends under the roof line on the facade
      const fz = face * (d / 2 + 0.06);
      for (let k = 0; k < Math.floor(w / 0.7); k++) { const [px, pz] = off(-w / 2 + 0.4 + k * 0.7, fz); HM.box(0.14, 0.14, 0.24, px, gy + h - 0.28, pz, '#5A3E2A', ry); }
      // door (dark recess) + windows
      const dxp = opts.doorX ?? (hsh(x + z, 5) - 0.5) * (w - 1.6);
      if (!opts.noDoor) { const [px, pz] = off(dxp, face * (d / 2 + 0.01)); DM.box(0.95, 1.85, 0.06, px, gy + 0.93, pz, '#1E1712', ry, 0.02); const [lx2, lz2] = off(dxp, face * (d / 2 + 0.05)); HM.box(1.25, 0.16, 0.14, lx2, gy + 1.94, lz2, '#5A3E2A', ry); }
      const nw = Math.floor(w / 1.8);
      for (let k = 0; k < nw; k++) {
        const wx = -w / 2 + 0.9 + k * 1.8; if (Math.abs(wx - dxp) < 0.9) continue;
        const [px, pz] = off(wx, face * (d / 2 + 0.01)); const lit = hsh(x * 7 + k, z) < (opts.litP ?? 0.22);
        (lit ? WIN : DM).box(0.42, 0.5, 0.06, px, gy + h - 0.95, pz, lit ? '#FFB565' : '#1E1712', ry, 0.02);
      }
      if (opts.upper) { const [px, pz] = off(-w / 4, -face * d / 6); mbox(w * 0.45, 1.7, d * 0.5, px, gy + h + 0.85, pz, col); const [wx2, wz2] = off(-w / 4, -face * d / 6 + face * (d * 0.25 + 0.01)); (hsh(x, z + 3) < 0.5 ? WIN : DM).box(0.36, 0.42, 0.06, wx2, gy + h + 1.0, wz2, hsh(x, z + 3) < 0.5 ? '#FFB565' : '#1E1712', ry, 0.02); }
    };
    // street (S02): runs from the gate square inward along local -z, x in [-1.85, 1.85]; facades at x = +-1.85
    const SX = 1.85, HD = 4.2;
    // right row (facades face -x): ry = -PI/2 puts the house's +z face toward -x and its width along the street
    const rowR = [[-9.4, 3.0, 3.0, { upper: true }], [-20.0, 4.2, 3.4, {}], [-24.2, 4.0, 2.9, { upper: true }], [-28.3, 4.0, 3.3, {}]];
    rowR.forEach(([zc, w, h, o]) => house(SX + HD / 2, zc, w, HD, h, -Math.PI / 2, 1, o));
    house(SX + HD / 2, -12.0, 2.2, HD, 3.6, -Math.PI / 2, 1, { noDoor: true, litP: 0.6 });
    house(SX + HD / 2, -15.5, 4.6, HD, 3.3, -Math.PI / 2, 1, { noDoor: true, litP: 0, col: '#B8946B', upper: true });   // the house with the lit doorway
    // left row (facades face +x)
    const rowL = [[-10.2, 4.4, 3.4, { upper: true }], [-14.6, 4.2, 2.8, {}], [-18.8, 4.0, 3.6, { upper: true }], [-23.0, 4.2, 3.0, {}], [-27.2, 4.0, 3.2, {}]];
    rowL.forEach(([zc, w, h, o]) => house(-SX - HD / 2, zc, w, HD, h, Math.PI / 2, 1, o));
    // the rest of the town (kept off the gate square and the street), clipped to the wall ring
    for (let gx = -14; gx <= 14; gx += 4.6) for (let gz = -32; gz <= -6; gz += 4.4) {
      const jx = gx + (hsh(gx, gz) - 0.5) * 1.2, jz = gz + (hsh(gz, gx) - 0.5) * 1.0;
      if (Math.abs(jx) < 6.2 && jz > -31) continue;            // street + its rows
      if (Math.abs(jx) < 9 && jz > -9.5) continue;             // the gate square
      if (Math.hypot(jx - lc[0], jz - lc[1]) > RW - 3.4) continue;
      const w = 3.2 + hsh(jx, 1) * 1.4, d = 3.0 + hsh(jz, 2) * 1.4, h = 2.6 + hsh(jx + jz, 3) * 1.6;
      house(jx, jz, w, d, h, (hsh(jx, jz + 1) - 0.5) * 0.2, hsh(jx, jz + 2) < 0.5 ? 1 : -1, { upper: hsh(jx, jz + 4) < 0.3, litP: 0.3 });
    }
    // a few jars + a bench by the gate square
    const jarM = Merger();
    for (const [x, z, s] of [[2.6, -3.4, 1], [2.95, -3.1, 0.8], [-3.0, -9.6, 1.1], [3.2, -12.4, 0.9]]) { const jg = new THREE.CylinderGeometry(0.16 * s, 0.11 * s, 0.55 * s, 7); jarM.add(jg, new THREE.Matrix4().makeTranslation(x, CITY_Y + 0.27 * s, z), '#9E6A44'); }
    city.add(jarM.mesh(), HM.mesh());
    const dm = DM.mesh(); dm.castShadow = false; city.add(dm);
    litWin = WIN.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); litWin.castShadow = false; litWin.receiveShadow = false; city.add(litWin);
    // the lit doorway (S02): warm curtain glow + a light spilling on the street (nothing inside is shown)
    {
      const dx = SX - 0.02, dz = -15.5;
      const fr = Merger();
      fr.box(0.14, 0.18, 1.35, dx + 0.04, CITY_Y + 2.06, dz, '#5A3E2A');
      for (const s of [-1, 1]) fr.box(0.12, 2.0, 0.12, dx + 0.02, CITY_Y + 1.0, dz + s * 0.6, '#5A3E2A');
      fr.box(0.5, 0.12, 1.4, dx - 0.2, CITY_Y + 0.06, dz, '#8E8270');
      city.add(fr.mesh());
      const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 1.9, 1, 1), new THREE.MeshBasicMaterial({ color: C('#FFB45E').multiplyScalar(1.5), toneMapped: false, fog: false }));
      curtain.position.set(dx + 0.06, CITY_Y + 0.96, dz); curtain.rotation.y = -Math.PI / 2; city.add(curtain); curtainMeshes.push(curtain);
      const folds = Merger(); for (let k = 0; k < 5; k++) folds.box(0.02, 1.86, 0.035, dx + 0.05, CITY_Y + 0.97, dz - 0.44 + k * 0.22, '#C8742F');
      const fm = folds.mesh(new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, fog: false })); city.add(fm); curtainMeshes.push(fm);
      doorGlow = new THREE.Sprite(glowMat('#FF9E4A', 0.4)); doorGlow.scale.set(2.6, 3.0, 1); doorGlow.position.set(...L(dx - 0.25, CITY_Y + 1.0, dz)); scene.add(doorGlow);
      doorPool = LW.pool(1.7, '#FF9E4A'); doorPool.position.set(...L(dx - 1.2, CITY_Y + 0.04, dz)); scene.add(doorPool);
    }

    // torches: outside the gate (2, lit), inside the gate (2, lit), along the wall + towers (glow only)
    const outY = CITY_Y + 2.7;
    city.add(makeTorch([-(OW / 2 + 0.55), outY, 2.07], 0, true), makeTorch([OW / 2 + 0.55, outY, 2.07], 0, true));
    city.add(makeTorch([-(OW / 2 + 0.38), outY - 0.15, -1.67], Math.PI, true), makeTorch([OW / 2 + 0.38, outY - 0.15, -1.67], Math.PI, true));
    for (const am of [-0.62, -0.34, 0.34, 0.62, 1.1, -1.1]) { const x = lc[0] + Math.sin(am) * (RW + wallT / 2 + 0.1), z = lc[1] + Math.cos(am) * (RW + wallT / 2 + 0.1); city.add(makeTorch([x, hFn(LX(x, z), LZ(x, z)) + 3.2, z], am, false)); }
    city.updateMatrixWorld(true); torches.forEach((T) => T.flame.getWorldPosition(T.wp));
    // the city's lights for the far shots: soft glows over the houses
    for (let i = 0; i < 26; i++) { const r = Math.sqrt(hsh(i, 41)) * (RW - 3), a = hsh(i, 42) * 6.283; const x = lc[0] + Math.sin(a) * r, z = lc[1] + Math.cos(a) * r; const sp = new THREE.Sprite(glowMat(hsh(i, 43) < 0.5 ? '#FFAE5A' : '#FF9440', 0.5)); sp.position.set(...L(x, CITY_Y + 2.4 + hsh(i, 44) * 1.6, z)); sp.scale.setScalar(1.0); scene.add(sp); cityGlows.push(sp); }

    // ---- the hill: scrub, rocks, grass, a few olive trees (merged) ----
    const D = Merger(), drng = FW.rng(1603);
    const offRoad = (x, z, r) => distRoad(x, z) > r && Math.hypot(x - CC[0], z - CC[1]) > RW + 2.5;
    for (let i = 0; i < 26; i++) { const a = -40 + drng() * 70, c = -30 + drng() * 60; const [x, z] = AK(a, c); if (!offRoad(x, z, 3) || Math.hypot(x - K[0], z - K[1]) < 5) continue; const tr = LW.olive(drng, 0.8 + drng() * 0.5); tr.position.set(x, hFn(x, z) - 0.05, z); D.obj(tr); }
    for (let i = 0; i < 160; i++) { const a = -30 + drng() * 50, c = -16 + drng() * 32; const [x, z] = AK(a, c); if (!offRoad(x, z, 1.4) || Math.hypot(x - K[0], z - K[1]) < 2.4) continue; const b = LW.bush(drng, 0.7 + drng() * 0.9); b.position.set(x, hFn(x, z), z); D.obj(b); }
    for (let i = 0; i < 130; i++) { const a = -26 + drng() * 44, c = -14 + drng() * 28; const [x, z] = AK(a, c); if (!offRoad(x, z, 1.0) || Math.hypot(x - K[0], z - K[1]) < 1.8) continue; const s = 0.3 + drng() * 0.9; const k = LW.rock(drng, s); k.position.x = x; k.position.z = z; k.position.y += hFn(x, z) - 0.06; D.obj(k); }
    for (let i = 0; i < 160; i++) { const a = -14 + drng() * 24, c = -9 + drng() * 18; const [x, z] = AK(a, c); if (distRoad(x, z) < 0.8 || Math.hypot(x - K[0], z - K[1]) < 1.2) continue; const g = LW.grassTuft(drng, 0.45 + drng() * 0.45); g.position.set(x, hFn(x, z), z); D.obj(g, 0.08); }
    // a ring of stones on the hilltop where the gates are set down
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + 0.3, r = 1.9 + hsh(i, 51) * 0.4; const x = K[0] + Math.cos(a) * r, z = K[1] + Math.sin(a) * r; const k = LW.rock(FW.rng(700 + i), 0.35 + hsh(i, 52) * 0.3); k.position.set(x, hFn(x, z) - 0.04, z); D.obj(k); }
    scene.add(D.mesh());

    // ---- the gate, Samson, dust ----
    gate = makeGateProp(); scene.add(gate);
    gateHoles = new THREE.Group();
    for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.CircleGeometry(0.42, 7), new THREE.MeshBasicMaterial({ color: C('#140E0A'), transparent: true, opacity: 0.9, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(s * POST_X, 0.03, 0); m.renderOrder = 2; gateHoles.add(m); }
    scene.add(gateHoles);
    sam = makeSam(); scene.add(sam, sam.userData.caster);
    samShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, color: 0x2a1a10, opacity: 0.85 }));
    samShadow.rotation.x = -Math.PI / 2; samShadow.renderOrder = 2; scene.add(samShadow);
    dust = puffs(140, '#C9A27A'); scene.add(dust);
    const rm = Merger(); rm.add(LW.jitter(new THREE.IcosahedronGeometry(0.09, 0), 0.05, FW.rng(5)), new THREE.Matrix4(), '#6B5039');
    for (let i = 0; i < 16; i++) { const m = rm.mesh(); m.castShadow = false; m.scale.setScalar(0.7 + hsh(i, 61) * 1.2); scene.add(m); debris.push(m); }
  }

  // soft dust puffs (normal blending, not additive), positioned per frame
  function puffs(n, color) {
    const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3), a = new Float32Array(n), s = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(a, 1)); g.setAttribute('psize', new THREE.BufferAttribute(s, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: LW.dotTex() }, col: { value: C(color) }, warm: { value: C('#FFB070') }, scale: { value: 900 } },
      vertexShader: 'attribute float alpha; attribute float psize; uniform float scale; varying float vA; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 col; varying float vA; void main(){ float m = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(col, vA * m); }',
      transparent: true, depthWrite: false, fog: false, toneMapped: false });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6;
    const v = new THREE.Vector3();
    pts.userData.update = (fn) => { for (let i = 0; i < n; i++) { const r = fn(i, v) || { alpha: 0 }; p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z; a[i] = r.alpha; s[i] = r.size || 0; } g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.psize.needsUpdate = true; };
    return pts;
  }

  // ---------------- per-frame helpers ----------------
  const tmpV = new THREE.Vector3();
  function setCam(p, l, f, shift = 0, shake = [0, 0]) {
    FW.setCam(cam, p, l, f);
    cam.setViewOffset(W, H, shake[0], -shift * H + shake[1], W, H);
    cam.updateMatrixWorld();
  }
  const camDist = (p) => -tmpV.set(p[0], p[1], p[2]).applyMatrix4(cam.matrixWorldInverse).z;
  const K3 = (p, l, f = 38) => ({ p, l, f });
  const lerpK = (A, B, k) => FW.camLerpK(A, B, k);
  // a light from the upper left of the current camera (keeps the painted 2D shading of the billboards true)
  function keyFromUpperLeft(light, target, dist = 30, side = 0.8, up = 1.0, back = 0.5) {
    const look = new THREE.Vector3(); cam.getWorldDirection(look);
    const right = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0, 1, 0)).normalize();
    const d = new THREE.Vector3().addScaledVector(right, -side).addScaledVector(new THREE.Vector3(0, 1, 0), up).addScaledVector(look, -back).normalize();
    light.target.position.set(...target); light.position.set(target[0] + d.x * dist, target[1] + d.y * dist, target[2] + d.z * dist);
    light.target.updateMatrixWorld();
    return d;
  }
  function shadowBox(light, r) { const sc = light.shadow.camera; if (sc.right !== r) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 1; sc.far = 90; sc.updateProjectionMatrix(); } }

  // night or dawn
  const SKY = {
    night: { top: '#03061A', mid: '#0B1738', hor: '#24386A', low: '#0B1224', sunCol: '#9DB6FF', sunAmt: 0.32, fog: '#18264A', fn: 34, ff: 170, hemiS: '#4C64A8', hemiG: '#1C1A1A', hemiI: 0.8, key: '#8EAAE8', keyI: 2.1 },
    dawn: { top: '#2A3A68', mid: '#7C80AA', hor: '#F4B48C', low: '#C9A4A2', sunCol: '#FFC27A', sunAmt: 1.15, fog: '#C9A7A4', fn: 40, ff: 190, hemiS: '#C7C6E2', hemiG: '#8A6C58', hemiI: 1.05, key: '#FFCB92', keyI: 3.1 },
  };
  function setTime(o, sunDirSky) {
    const u = sky.material.uniforms;
    u.top.value.set(o.top); u.mid.value.set(o.mid); u.hor.value.set(o.hor); u.low.value.set(o.low); u.sunCol.value.set(o.sunCol); u.sunAmt.value = o.sunAmt;
    if (sunDirSky) u.sunDir.value.set(...sunDirSky).normalize();
    scene.fog.color.set(o.fog); scene.fog.near = o.fn; scene.fog.far = o.ff;
    hemi.color.set(o.hemiS); hemi.groundColor.set(o.hemiG); hemi.intensity = o.hemiI;
    moon.color.set(o.key); moon.intensity = o.keyI;
  }
  const flick = (t, seed) => 0.82 + 0.1 * Math.sin(t * 11.3 + seed * 5) + 0.07 * Math.sin(t * 23.7 + seed * 9) + 0.05 * Math.sin(t * 5.1 + seed);
  function torchesAt(t, on) {
    torches.forEach((T, i) => {
      const f = flick(t, T.seed);
      T.g.visible = on;
      T.flame.scale.set(1, 0.85 + 1.2 * (f - 0.82) + 0.08 * Math.sin(t * 17 + i), 1);
      T.core.scale.set(1, 0.9 + 0.15 * Math.sin(t * 19 + i), 1);
      T.glow.material.opacity = 0.5 * f; T.halo.material.opacity = 0.13 * f;
    });
  }
  // put pool light i at a key torch (index among the 4 gate torches: 0,1 outside; 2,3 inside), pushed off the wall
  const keyTorches = () => torches.filter((T) => T.key);
  function plAtTorch(i, ti, t, I, push = 0.6, dist = 12) {
    const T = keyTorches()[ti], l = PL[i];
    const dir = new THREE.Vector3(); T.g.getWorldDirection(dir);
    l.position.copy(T.wp).addScaledVector(dir, push); l.intensity = I * flick(t, T.seed); l.distance = dist; l.color.set('#FFA45A');
  }
  function plOff() { PL.forEach((l) => (l.intensity = 0)); }
  // gate placement: standing in the gateway, carried, or left standing on the hilltop
  const GATE_HOME = { p: L(0, CITY_Y, -1.2), ry: PHI };
  function gateStanding(lift = 0, tilt = 0, jolt = 0) {
    gate.position.set(GATE_HOME.p[0], GATE_HOME.p[1] + lift, GATE_HOME.p[2]);
    gate.rotation.set(tilt, GATE_HOME.ry, jolt, 'YXZ');
  }
  // the gate's bottom rail rests in his hands at shoulder height: from PP2's 'carry' pose when published
  let SHOULDER = 1.36;
  const U_M = 1.86 / 560;
  function measureCarry() {
    const P2 = globalThis.PP2;
    if (P2 && P2.samsonInfo) { const i = P2.samsonInfo({ pose: 'carry', t: 0, phase: 0 }); if (i && i.hands) SHOULDER = -((i.hands[0][1] + i.hands[1][1]) / 2) * U_M + 0.04; }
  }
  // where his hands are in the world: film.js leans every billboard back by half the camera pitch (top away from the
  // camera), so a point h metres up the card sits h*sin(lean) behind his feet and h*cos(lean) high
  function handsWorld() {
    const d = new THREE.Vector3(); cam.getWorldDirection(d);
    const lean = Math.asin(-d.y) * 0.5, f = new THREE.Vector3(d.x, 0, d.z).normalize();
    return { lean, f, back: (SHOULDER - 0.04) * Math.sin(lean), up: (SHOULDER - 0.04) * Math.cos(lean) };
  }
  function gateOnSamson(walkDir, tilt = 0.7, sway = 0, toCam = 0.65) { // walkDir: unit (x, z) he walks along; inner face against his back
    let bx = -walkDir[0], bz = -walkDir[1];
    const hw = handsWorld();
    bx = lerp(bx, hw.f.x, toCam); bz = lerp(bz, hw.f.z, toCam); const bl = Math.hypot(bx, bz) || 1; bx /= bl; bz /= bl;
    // the bottom rail rests on his raised fists, just behind the (leaning) card so nothing crosses his face
    const bk = hw.back + 0.16, sp = sam.position;
    gate.position.set(sp.x + hw.f.x * bk + bx * 0.05, sp.y + hw.up + 0.05 + Math.abs(sway) * 0.03, sp.z + hw.f.z * bk + bz * 0.05);
    gate.rotation.set(tilt, Math.atan2(bx, bz), sway * 0.05, 'YXZ');
  }

  // Samson pose (drawn only when the pose key changes)
  function samPose(st) { const key = JSON.stringify(st); sam.userData.update(key, st); }
  function placeSam(x, z, yOff = 0) { sam.position.set(x, hFn(x, z) + yOff, z); samShadow.position.set(x, hFn(x, z) + 0.03, z); }

  // dust burst from the post holes at time tb (absolute), lit warm by the torches
  function dustAt(t, tb, origin, amt = 1) {
    dust.visible = true;
    dust.userData.update((i, v) => {
      const s = i % 2 ? 1 : -1, born = tb + hsh(i, 71) * 0.35 - 0.05, age = t - born;
      if (age < 0 || age > 2.6) { v.set(0, -99, 0); return { alpha: 0 }; }
      const a = hsh(i, 72) * 6.283, sp = 0.4 + hsh(i, 73) * 1.4, k = 1 - Math.exp(-age * 2.2);
      const lx = s * POST_X + Math.cos(a) * sp * k, lz = Math.sin(a) * sp * k * 0.8 - 0.4, ly = 0.15 + (0.3 + hsh(i, 74) * 1.3) * k;
      v.set(origin[0] + lx * Math.cos(PHI) + lz * Math.sin(PHI), origin[1] + ly, origin[2] - lx * Math.sin(PHI) + lz * Math.cos(PHI));
      return { alpha: amt * 0.32 * (1 - age / 2.6) * smooth(clamp(age * 6)), size: 0.16 + hsh(i, 75) * 0.3 + age * 0.22 };
    });
    debris.forEach((m, i) => {
      const s = i % 2 ? 1 : -1, age = t - tb - hsh(i, 81) * 0.08;
      if (age < 0 || age > 1.4) { m.visible = false; return; }
      m.visible = true;
      const a = hsh(i, 82) * 6.283, vx = Math.cos(a) * (0.6 + hsh(i, 83) * 1.2), vz = Math.sin(a) * 0.8 - 0.6, vy = 1.6 + hsh(i, 84) * 2.2;
      const lx = s * POST_X + vx * age, lz = vz * age, ly = Math.max(0.05, 0.1 + vy * age - 4.9 * age * age);
      m.position.set(origin[0] + lx * Math.cos(PHI) + lz * Math.sin(PHI), origin[1] + ly, origin[2] - lx * Math.sin(PHI) + lz * Math.cos(PHI));
      m.rotation.set(age * 7 + i, age * 5, 0);
    });
  }
  function noDust() { dust.visible = false; debris.forEach((m) => (m.visible = false)); }

  // ---------------- the shots ----------------
  const xyz = (xz, y) => [xz[0], y, xz[1]];
  const HP = (a, c, y) => xyz(AK(a, c), y);               // hill coords (along, across, height) -> world
  const CP = (lx, ly, lz) => L(lx, CITY_Y + ly, lz);       // city-local (gate at the origin, inside = -z) -> world
  const TOP = (dy = 0) => [K[0], KH + dy, K[1]];
  // S01 / S35 (and S32, a touch wider): high three-quarter wide from beyond the hilltop, down the road to the city
  const HOOK = { A: K3(HP(4.7, 4.0, KH + 5.7), HP(-23.5, -4.3, 7.0), 46) };
  HOOK.B = K3(HOOK.A.p.map((v, i) => lerp(v, HOOK.A.l[i], 0.035)), HOOK.A.l, 46);
  const HOOK_SHIFT = 0.075;
  const DROP = 3.3; // the gates are set down this far (road distance) from the very top: on the edge of the summit, just past where Samson walks in S01
  // the dawn sun: low over the hills toward Hebron (fixed in the world, so every dawn shot agrees)
  const SUN = (() => { const v = new THREE.Vector3(GD[0] - PR[0] * 0.5, 0.2, GD[1] - PR[1] * 0.5); return v.normalize(); })();

  function nightShot(t, o = {}) {
    setTime(SKY.night, o.skyDir || [-0.55, 0.42, 0.55]);
    stars.visible = true; stars.material.uniforms.t.value = t; stars.material.uniforms.amt.value = o.stars ?? 1; stars.material.uniforms.sz.value = o.starSz ?? 1;
    litWin.visible = true; cityGlows.forEach((g) => (g.visible = true)); curtainMeshes.forEach((m) => (m.visible = true));
    torchesAt(t, true); plGroup.visible = true; plOff();
    doorGlow.visible = false; doorPool.material.opacity = 0; moonDisc.material.opacity = 0;
  }
  function dawnShot(t, o = {}) {
    setTime(SKY.dawn, [SUN.x, SUN.y - 0.24, SUN.z]);
    if (o.sky) { const u = sky.material.uniforms; for (const k of Object.keys(o.sky)) u[k].value.set(o.sky[k]); }
    stars.visible = (o.stars ?? 0) > 0; stars.material.uniforms.t.value = t; stars.material.uniforms.amt.value = o.stars ?? 0; stars.material.uniforms.sz.value = 1;
    litWin.visible = false; cityGlows.forEach((g) => (g.visible = false)); curtainMeshes.forEach((m) => (m.visible = false));
    torchesAt(t, false); plGroup.visible = false; plOff();
    doorGlow.visible = false; doorPool.material.opacity = 0; moonDisc.material.opacity = 0;
    // the sun: fixed low in the east
    moon.target.position.set(K[0], KH, K[1]); moon.position.set(K[0] + SUN.x * 50, KH + SUN.y * 50, K[1] + SUN.z * 50); moon.target.updateMatrixWorld();
    sam.visible = false; samShadow.visible = false; gate.visible = true; gateOnHill(); gateHoles.visible = false; noDust();
  }
  const carrySt = (t, extra) => Object.assign({ pose: 'carry', t: q(t, 30), phase: 0, look: [-0.2, 0.15], gold: 0, hair: 1, strain: 0 }, extra);
  const tint = (r, g, b) => sam.material.color.setRGB(r, g, b);
  const samBase = () => { sam.visible = true; samShadow.visible = true; sam.userData.tilt = 0; };

  // walking up the road with the gates: dTop = road distance from the top at the shot start, lt = local time
  function walkUp(t, dTop, speed, lt, o = {}) {
    const d = roadLen - dTop + lt * speed;
    const [x, z, tx, tz] = roadAt(d);
    placeSam(x, z); samBase();
    const ph = (roadLen - dTop) * 2.2 + lt * speed * 7.0;
    sam.position.y += Math.abs(Math.sin(ph)) * 0.022;
    samPose(carrySt(t, Object.assign({ phase: q(ph, 12) }, o.st || {})));
    gateOnSamson([tx, tz], 0.7, Math.sin(ph), o.toCam ?? 0.65);
    gateHoles.visible = false;
  }
  function gateOnHill() { // set down standing on the top, posts in the earth, leaning a little; outer face toward the dawn
    const [x0, z0] = roadAt(roadLen - DROP), x = x0 + PR[0] * 1.3, z = z0 + PR[1] * 1.3; // a step off the road, toward the city side
    gate.position.set(x, hFn(x, z) - 0.34, z);
    gate.rotation.set(-0.05, Math.atan2(GD[0], GD[1]) - 0.17, 0.025, 'YXZ');
  }

  // ---- S01 hook: night, the slope outside Gaza, Samson carrying the gates up toward the top ----
  function S01(t, shot) {
    const k = prog(t, shot.t0, shot.t1, ease.inOut), lt = t - shot.t0;
    nightShot(t);
    plAtTorch(0, 0, t, 30, 0.9, 16); plAtTorch(1, 1, t, 30, 0.9, 16);
    const c = lerpK(HOOK.A, HOOK.B, k);
    setCam(c.p, c.l, c.f, HOOK_SHIFT);
    keyFromUpperLeft(moon, TOP(), 40, 0.85, 1.05, 0.4); shadowBox(moon, 30);
    walkUp(t, 6.6, 0.32, lt, { st: { gold: 0.3, look: [-0.25, 0.2] }, toCam: 0.2 });
    tint(0.9, 0.93, 1.02);
    noDust();
    return { focus: camDist([sam.position.x, sam.position.y + 1.3, sam.position.z]), aperture: 3.2, out: { exposure: 1.2, bloom: 0.2 } };
  }

  // ---- S02 door: inside the city, the narrow street, one warm doorway; Samson at the door ----
  function S02(t, shot) {
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    nightShot(t);
    const fl = 0.93 + 0.07 * Math.sin(t * 9.1) * Math.sin(t * 3.7);
    PL[0].position.set(...CP(0.55, 1.3, -15.5)); PL[0].intensity = 3.2 * fl; PL[0].distance = 7; PL[0].color.set('#FFA45A');
    PL[1].position.set(...CP(-1.2, 2.3, -24)); PL[1].intensity = 2.5; PL[1].distance = 7; PL[1].color.set('#FF9A50');
    doorGlow.visible = true; doorGlow.material.opacity = 0.3 * fl; doorPool.material.opacity = 0.28 * fl;
    const A = K3(CP(-1.35, 1.7, -5.8), CP(0.75, 1.15, -15.0), 40), B = K3(CP(-0.8, 1.7, -5.8), CP(0.95, 1.15, -15.1), 40);
    const c = lerpK(A, B, k);
    setCam(c.p, c.l, c.f, 0.12);
    keyFromUpperLeft(moon, CP(0, 0, -15), 30, 0.7, 1.5, 0.3); shadowBox(moon, 14);
    // Samson steps up to the door (no gates yet), his head turned toward it
    const step = prog(t, shot.t0, shot.beats.prostitute + 0.2, ease.inOut);
    const p = CP(lerp(-0.25, 0.25, step), 0, lerp(-13.6, -14.4, step));
    placeSam(p[0], p[2]); samBase();
    samPose({ pose: step < 0.98 ? 'walk' : 'stand', t: q(t, 30), phase: q(step * 6.5, 12), look: [0.85, 0.05], gold: 0, hair: 1, strain: 0 });
    tint(0.86, 0.86, 0.98);
    gateStanding(0, 0, 0); gateHoles.visible = false; noDust();
    const tagK = prog(t, shot.t0 + 0.3, shot.t0 + 0.9, (x) => x);
    return { focus: camDist([sam.position.x, sam.position.y + 1.2, sam.position.z]), aperture: 4.0,
      out: { exposure: 1.2, bloom: 0.2, tags: [{ text: 'GAZA', sub: 'JUDGES 16:1', p: [sam.position.x, sam.position.y + 2.0, sam.position.z], k: tagK, dy: -110, dx: -70 }] } };
  }

  // ---- the lift (S03 fast, S24 slow): his back to the doors, he grips, the posts tear out, he heaves them up ----
  function liftState(t, tTear, heave) {
    return {
      pre: prog(t, tTear - 1.2, tTear, ease.in),                       // strain building
      tear: prog(t, tTear - 0.04, tTear + 0.16, ease.out),              // the posts rip out of the ground
      up: prog(t, tTear + 0.12, tTear + 0.12 + heave, ease.inOut),      // heave up onto the shoulders
    };
  }
  function liftPose(t, s) {
    const trem = (1 - s.up) * (0.5 * s.pre + 0.6 * s.tear);
    // before the tear he strains against the doors at his back (trembling); the posts give and he heaves them up
    if (s.tear < 0.5) samPose({ pose: 'strain', bonds: 'none', strain: q(0.45 + 0.55 * s.pre, 30), t: q(t, 30), look: [0, 0.1], hair: 1 });
    else samPose(carrySt(t, { phase: q(s.walk || 0, 12), look: [0, q(-0.1 + 0.3 * s.up, 20)] }));
    const p0 = GATE_HOME.p, sp = sam.position;
    const shud = s.pre * (1 - s.tear) * 0.012 * Math.sin(t * 61);
    const jump = s.tear * 0.24 * (1 - s.up);
    const hw = handsWorld(), bk = Math.max(0.3, hw.back + 0.16);
    gate.position.set(lerp(p0[0], sp.x + hw.f.x * bk, s.up) + shud, p0[1] + lerp(jump, hw.up + 0.05, s.up), lerp(p0[2], sp.z + hw.f.z * bk, s.up));
    gate.rotation.set(lerp(0, 0.7, s.up) + s.tear * (1 - s.up) * 0.05, GATE_HOME.ry, Math.sin(t * 40) * 0.006 * trem, 'YXZ');
    gateHoles.visible = s.tear > 0.05;
    gateHoles.position.set(p0[0], p0[1] + 0.02, p0[2]); gateHoles.rotation.y = GATE_HOME.ry;
    gateHoles.children.forEach((m) => { m.material.opacity = 0.9 * s.tear; });
    sp.x += Math.sin(t * 57) * 0.006 * trem;
  }
  function S03(t, shot) {
    const tTear = shot.beats.carried;
    nightShot(t);
    plAtTorch(0, 2, t, 30, 0.8, 9); plAtTorch(1, 3, t, 11, 0.8, 8);
    const Ls = liftState(t, tTear, 0.75);
    // camera: low medium inside the gate square, small push from the cut; a short shake on the tear
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    const A = K3(CP(-0.85, 0.5, -7.6), CP(0.05, 2.15, -0.9), 50), B = K3(CP(-0.78, 0.52, -7.0), CP(0.05, 2.15, -0.9), 50);
    const c = lerpK(A, B, k);
    const d = t - tTear, sh = d >= 0 && d < 0.45 ? 11 * Math.pow(1 - d / 0.45, 2) : 0;
    setCam(c.p, c.l, c.f, 0.0, [Math.sin(d * 83) * sh, Math.cos(d * 61 + 1) * sh]);
    keyFromUpperLeft(moon, CP(0, 0, -1), 30, 0.55, 1.4, 0.9); shadowBox(moon, 14); moon.intensity = 1.5; hemi.intensity = 0.42;
    scene.fog.color.set('#0C1530'); scene.fog.near = 7; scene.fog.far = 28;
    const stepK = prog(t, shot.beats.gates - 0.25, shot.t1 + 0.6, (x) => x);
    const sp = CP(0, 0, -1.72 - stepK * 1.1); placeSam(sp[0], sp[2]); samBase();
    Ls.walk = stepK * 1.1 * 7.0; sam.position.y += Math.abs(Math.sin(Ls.walk)) * 0.02 * (stepK > 0 ? 1 : 0);
    liftPose(t, Ls);
    tint(0.98, 0.94, 0.94);
    if (t > tTear - 0.1) dustAt(t, tTear, GATE_HOME.p, 1.1); else noDust();
    const flash = d >= 0 && d < 0.14 ? 0.45 * Math.pow(1 - d / 0.14, 2) : 0;
    return { focus: camDist([sam.position.x, sam.position.y + 1.3, sam.position.z]), aperture: 4.4, out: { exposure: 1.16, bloom: 0.22, flash } };
  }
  function S24(t, shot) {
    const tTear = shot.beats.works - 0.05;
    nightShot(t);
    plAtTorch(0, 2, t, 30, 0.8, 9); plAtTorch(1, 3, t, 11, 0.8, 8);
    const Ls = liftState(t, tTear, 1.3);
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    const A = K3(CP(-0.95, 3.0, -16.4), CP(0.0, 1.75, -1.0), 42), B = K3(CP(-0.8, 2.9, -14.8), CP(0.0, 1.75, -1.0), 42);
    const c = lerpK(A, B, k);
    setCam(c.p, c.l, c.f, -0.06);
    keyFromUpperLeft(moon, CP(0, 0, -1), 30, 0.55, 1.4, 0.9); shadowBox(moon, 18); moon.intensity = 1.5; hemi.intensity = 0.42;
    scene.fog.color.set('#0E1830'); scene.fog.near = 18; scene.fog.far = 55;
    const sp = CP(0, 0, -1.72); placeSam(sp[0], sp[2]); samBase();
    liftPose(t, Ls);
    tint(0.98, 0.94, 0.94);
    if (t > tTear - 0.1) dustAt(t, tTear, GATE_HOME.p, 0.9); else noDust();
    return { focus: camDist([sam.position.x, sam.position.y + 1.3, sam.position.z]), aperture: 3.6, out: { exposure: 1.16, bloom: 0.2 } };
  }

  // ---- S04 / S20: the hilltop at night from the Hebron side; Samson tiny, the gates against the stars, Gaza below ----
  function hillNight(t, shot, A, B, k, o) {
    nightShot(t, { stars: o.stars ?? 2.2, starSz: 1.6 });
    plAtTorch(0, 0, t, 30, 0.9, 16); plAtTorch(1, 1, t, 30, 0.9, 16);
    const c = lerpK(A, B, k);
    setCam(c.p, c.l, c.f, o.shift ?? 0);
    keyFromUpperLeft(moon, TOP(), 40, 0.9, 0.75, -0.6); shadowBox(moon, 26);
    moon.intensity = o.moonI ?? 1.3;
    const look = new THREE.Vector3(); cam.getWorldDirection(look);
    const right = new THREE.Vector3().crossVectors(look, new THREE.Vector3(0, 1, 0)).normalize();
    const md = look.clone().addScaledVector(right, o.moonX ?? -0.16).add(new THREE.Vector3(0, o.moonUp ?? 0.2, 0)).normalize();
    moonDisc.position.copy(cam.position).addScaledVector(md, 200); moonDisc.scale.setScalar(o.moonS ?? 8); moonDisc.material.opacity = 0.95;
    sky.material.uniforms.sunDir.value.copy(md); sky.material.uniforms.sunAmt.value = o.glow ?? 0.45;
    walkUp(t, o.dTop ?? 4.2, 0.3, t - shot.t0, { st: { gold: 0, look: [0.1, -0.2] }, toCam: 0.3 });
    tint(o.dark ?? 0.6, o.dark ?? 0.64, (o.dark ?? 0.6) + 0.16);
    noDust();
    return { focus: camDist([sam.position.x, sam.position.y + 1.5, sam.position.z]), aperture: 1.4 };
  }
  function S04(t, shot) { // extreme wide; slow pull-out and crane up, starting on "fine"
    const k = prog(t, shot.beats.fine - 0.4, shot.t1 + 0.3, ease.inOut);
    const A = K3(HP(34, 7.5, KH - 1.2), HP(-3, 0.2, KH + 2.2), 38), B = K3(HP(39, 8.5, KH - 0.3), HP(-3, 0.2, KH + 2.2), 38);
    const r = hillNight(t, shot, A, B, k, { shift: 0.13, glow: 0.24, moonS: 6.5 });
    return Object.assign(r, { out: { exposure: 1.18, bloom: 0.24, maxR: 3 } });
  }
  function S20(t, shot) { // like S04, darker and closer, room at the top for the question
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    const A = K3(HP(21, -5, KH - 0.6), HP(-2, 0.8, KH + 2.0), 38), B = K3(HP(19.6, -4.7, KH - 0.55), HP(-2, 0.8, KH + 2.0), 38);
    const r = hillNight(t, shot, A, B, k, { shift: 0.2, dark: 0.48, moonUp: 0.46, moonX: -0.14, stars: 2.6, moonI: 1.0, moonS: 6, glow: 0.18 });
    return Object.assign(r, { out: { exposure: 1.08, bloom: 0.24, maxR: 3 } });
  }

  // ---- dawn: the gates left standing on the hilltop ----
  function S32(t, shot) { // S01's composition at first light, a touch wider
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    dawnShot(t);
    const A = K3(HOOK.A.p.map((v, i) => lerp(v, HOOK.A.l[i], -0.07)), HOOK.A.l, 46), B = K3(HOOK.A.p.map((v, i) => lerp(v, HOOK.A.l[i], -0.035)), HOOK.A.l, 46);
    const c = lerpK(A, B, k);
    setCam(c.p, c.l, c.f, HOOK_SHIFT); shadowBox(moon, 30);
    return { focus: camDist(gate.position.toArray().map((v, i) => v + (i === 1 ? 1.6 : 0))), aperture: 3.0, out: { exposure: 1.08, bloom: 0.17 } };
  }
  function S33(t, shot) { // closer on the abandoned gates, slow drift: from up-ridge, high enough to clear the crest
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    dawnShot(t);
    const gp = gate.position, n = [Math.sin(gate.rotation.y), Math.cos(gate.rotation.y)], lf = [-n[1], n[0]];
    const P = (dn, dl, dy) => [gp.x + n[0] * dn + lf[0] * dl, gp.y + dy, gp.z + n[1] * dn + lf[1] * dl];
    const A = K3(P(9.4, -2.8, 2.6), P(0, 0.1, 1.55), 36), B = K3(P(9.1, -1.8, 2.55), P(0, 0.1, 1.55), 36);
    const c = lerpK(A, B, k);
    c.p[1] = Math.max(c.p[1], hFn(c.p[0], c.p[2]) + 1.6);
    setCam(c.p, c.l, c.f, 0.0); shadowBox(moon, 14);
    return { focus: camDist([gp.x, gp.y + 1.6, gp.z]), aperture: 4.2, out: { exposure: 1.08, bloom: 0.18 } };
  }
  function S34(t, shot) { // locked: the dawn sky over the hills toward Hebron, the gates small against it; dark at the top for the statement
    dawnShot(t, { stars: 0.35, sky: { top: '#121A3E', mid: '#38467C', hor: '#F2A272', low: '#7A6070' } });
    sky.material.uniforms.sunAmt.value = 1.3;
    const gp = gate.position;
    // looking east over the gates toward the sunrise (the sun's glow left of centre, still below the hills)
    const fwd = new THREE.Vector3(SUN.x, 0, SUN.z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.41);
    const p = [gp.x - fwd.x * 24, gp.y + 0.2, gp.z - fwd.z * 24];
    setCam(p, [p[0] + fwd.x * 40, p[1] + 4.2, p[2] + fwd.z * 40], 42, 0.2); shadowBox(moon, 20);
    return { focus: camDist([gp.x, gp.y + 1.6, gp.z]), aperture: 2.0, out: { exposure: 1.04, bloom: 0.22 } };
  }
  function S35(t, shot) { // S01's exact framing at dawn: the loop
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    dawnShot(t);
    const c = lerpK(HOOK.A, HOOK.B, k);
    setCam(c.p, c.l, c.f, HOOK_SHIFT); shadowBox(moon, 30);
    return { focus: camDist(gate.position.toArray().map((v, i) => v + (i === 1 ? 1.6 : 0))), aperture: 3.2, out: { exposure: 1.08, bloom: 0.17 } };
  }

  const SHOTS = { hook: S01, door: S02, rip: S03, hill: S04, question: S20, principle: S24, dawn: S32, dawn2: S33, statement: S34, dawn3: S35 };
  SCENES.gaza = {
    async build(env) { cam = env.cam; measureCarry(); build(); },
    frame(t, shot, camera) {
      cam = camera;
      gate.visible = true;
      const fn = SHOTS[shot.v] || S01;
      const r = fn(t, shot);
      // the sky dome and the stars follow THIS frame's camera (LW.sky follows in onBeforeRender, one frame late:
      // after a cut that leaves the dome off-centre and clipped by the far plane, i.e. frame-order dependent)
      sky.position.copy(cam.position); stars.position.copy(cam.position);
      sam.userData.caster.visible = sam.visible;
      samShadow.position.set(sam.position.x, hFn(sam.position.x, sam.position.z) + 0.03, sam.position.z);
      return Object.assign({ scene, sun: moon, bill: sam.visible ? [sam] : [], focus: r.focus, aperture: r.aperture, maxR: 6, fgScale: 1.4, exposure: 1.12, sat: 1.08, bloom: 0.18 }, r.out || {});
    },
  };
})();
