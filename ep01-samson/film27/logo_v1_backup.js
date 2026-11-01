// FOURTH WATCH logo scene (Matthew 14:25): "And in the fourth watch of the night he came to them, walking on the sea."
// Built with the same engine as the episodes (three.js diorama, LW renderer with depth of field, 2D finishing).
// Gold appears ONLY in Jesus' light and the boat lantern. God's light comes from the upper left.
// Deterministic: a pure function of (t, k). t = seconds (waves, shimmer), k = 0..1 how far the light has come up.
(async function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, LW = globalThis.LW;
  const q = new URLSearchParams(location.search);
  const MODE = q.get('mode') || 'square';
  const T = +(q.get('t') || 0), K = q.get('k') === null ? 1 : +q.get('k');
  const S = MODE === 'endcard' ? 1080 : +(q.get('size') || 1024);   // the square 3D render size
  const C = (c) => new THREE.Color(c);
  const { clamp, lerp } = FW;

  // fonts (served over http by the render script)
  for (const [fam, file, w] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700'], ['Inter', 'fonts/inter-latin-600-normal.woff2', '600']]) {
    const f = new FontFace(fam, `url(${file})`, { weight: w }); document.fonts.add(f); await f.load();
  }

  LW.init(S, S);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.2, 400);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C('#1A2236'), 14, 70);

  // ---------------- layout (world metres; camera looks down -z) ----------------
  const J = [-0.75, 0, 1.2];            // where Jesus stands on the water
  const B = [0.85, 0, -2.2];            // the boat's centre
  const CAMP = [0.2, 0.95, 7.4], CAML = [0.12, 0.8, -0.5];

  // ---------------- sky: deep night, the first hint of dawn low on the left horizon ----------------
  scene.add(LW.sky({ top: '#05080F', mid: '#0E1629', hor: '#3A4865', low: '#0A0F1C', sunDir: [0.25, -0.08, -1], sunCol: '#8E7A80', sunAmt: 0.4 }));
  // a few faint stars (kept away from the dawn glow)
  const rs = FW.rng(1425);
  const starPos = [];
  for (let i = 0; i < 70; i++) {
    const az = lerp(-0.95, 0.95, rs()), el = lerp(0.12, 0.62, Math.pow(rs(), 0.8));
    const d = [Math.sin(az), Math.sin(el), -Math.cos(az)];
    if (az > 0.05 && el < 0.22) continue;
    starPos.push({ p: [d[0] * 150, d[1] * 150, d[2] * 150], a: lerp(0.18, 0.75, rs()), s: lerp(0.5, 1.15, rs()), ph: rs() * 6.28 });
  }
  const stars = LW.particles(starPos.length, '#DCE4FF', 1.4);
  stars.material.uniforms.scale.value = 900 * (S / 1080);
  stars.userData.update((i, v) => { const s = starPos[i]; v.set(...s.p); return { alpha: s.a * (0.85 + 0.15 * Math.sin(T * 1.3 + s.ph)), size: s.s }; });
  scene.add(stars);

  // ---------------- far hills: layered cut-outs, lighter toward the horizon ----------------
  function ridge(z, col, base, amp, seed, x0 = -120, x1 = 120) {
    const sh = new THREE.Shape(); sh.moveTo(x0, -2);
    for (let i = 0; i <= 60; i++) { const x = lerp(x0, x1, i / 60); sh.lineTo(x, base + amp * FW.fbm(x * 0.035, seed, seed, 3) * (x < -25 ? 0.55 : 1)); }
    sh.lineTo(x1, -2); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: C(col), fog: false }));
    m.position.z = z; return m;
  }
  scene.add(ridge(-95, '#26304A', 0.8, 9, 3));
  scene.add(ridge(-70, '#182034', 0.4, 6.5, 9));

  // ---------------- the sea: gentle low-poly swell, flat-shaded facets that catch the light ----------------
  const waveH = (x, z, t) => 0.17 * Math.sin(0.85 * x + 0.35 * z + t * 0.9) + 0.11 * Math.sin(-0.45 * x + 1.15 * z + 1.3 + t * 1.1)
    + 0.3 * (FW.fbm(x * 0.42 + t * 0.05, z * 0.42, 5, 3) - 0.5);
  {
    // rows packed densely near the camera (small facets up close, larger toward the horizon)
    const g0 = new THREE.PlaneGeometry(76, 1, 270, 170); g0.rotateX(-Math.PI / 2);
    const p0 = g0.attributes.position;
    for (let i = 0; i < p0.count; i++) { const v = 0.5 - p0.getZ(i); p0.setZ(i, 11 - 85 * Math.pow(v, 1.8)); }  // keeps the winding (faces up)
    for (let i = 0; i < p0.count; i++) {
      const x = p0.getX(i), z = p0.getZ(i), cell = 76 / 270 * (1 + Math.max(0, -z) / 18);
      const jx = (FW.noise2(x * 3.1, z * 3.1, 11) - 0.5) * cell * 0.55, jz = (FW.noise2(x * 2.7, z * 2.9, 23) - 0.5) * cell * 0.55;
      const fall = clamp(1 - (-z - 25) / 40, 0.25, 1);   // calmer toward the horizon
      p0.setX(i, x + jx); p0.setZ(i, z + jz); p0.setY(i, waveH(x + jx, z + jz, T) * fall);
    }
    const g = g0.toNonIndexed(); g.computeVertexNormals();
    const pos = g.attributes.position, cols = new Float32Array(pos.count * 3), rc = FW.rng(77);
    const c1 = C('#081120'), c2 = C('#122038'), tmp = new THREE.Color();
    for (let i = 0; i < pos.count; i += 3) { tmp.copy(c1).lerp(c2, rc()); for (let k = 0; k < 3; k++) { cols[(i + k) * 3] = tmp.r; cols[(i + k) * 3 + 1] = tmp.g; cols[(i + k) * 3 + 2] = tmp.b; } }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const sea = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5, metalness: 0.1 }));
    scene.add(sea);
  }

  // ---------------- light: cool night fill, Jesus' gold light, the lantern ----------------
  scene.add(new THREE.HemisphereLight(C('#2E3D5E'), C('#080B14'), 0.55));
  const moon = new THREE.DirectionalLight(C('#8EA2CC'), 0.45); moon.position.set(3, 8, -9); scene.add(moon);
  const jLight = new THREE.PointLight(C('#FFC46E'), 7 * K, 3.6, 1.6); jLight.position.set(J[0] + 0.1, 0.9, J[2] + 0.25); scene.add(jLight);
  const spot = new THREE.SpotLight(C('#FFCF86'), 34 * K, 40, 0.16, 0.85, 1.4);
  spot.position.set(J[0] - 7, 14, J[2] - 3); spot.target.position.set(J[0], 1.1, J[2]); scene.add(spot); scene.add(spot.target);

  // soft textures
  const radial = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`)); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); };
  const glowTex = radial([[0, 1], [0.25, 0.6], [0.6, 0.16], [1, 0]]);
  const add = (color, opacity, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: C(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }, o));

  // God's light: a shaft from the upper left onto Him
  const shaft = LW.shaft([J[0] - 5.2, 11.5, J[2] - 2.4], [J[0], 0.1, J[2]], 0.18, 1.45, '#FFD089');
  shaft.material.uniforms.amt.value = 0.12 * K; shaft.material.uniforms.time.value = T; scene.add(shaft);
  // the glow around Him (behind the figure)
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#FFC870'), transparent: true, opacity: 0.42 * K, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  halo.scale.set(2.7, 3.5, 1); halo.position.set(J[0], 1.05, J[2] - 0.25); halo.renderOrder = 2; scene.add(halo);
  // light pooled on the water under Him
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#FFC46E', 0.32 * K, { map: glowTex }));
  pool.rotation.x = -Math.PI / 2; pool.scale.set(2.6, 1.6, 1); pool.position.set(J[0], 0.16, J[2] + 0.2); pool.renderOrder = 3; scene.add(pool);
  // a path of light on the water toward the viewer, broken by the swell
  {
    const c = document.createElement('canvas'); c.width = 128; c.height = 1024; const x = c.getContext('2d'); const r = FW.rng(9);
    for (let y = 0; y < 1024; y += 9) {
      const along = y / 1024, w = lerp(16, 70, along), a = Math.min(1, along * 7) * Math.pow(1 - along, 1.6);
      if (r() < 0.35) continue;
      const len = w * lerp(0.25, 0.8, r()), cx = 64 + (r() - 0.5) * w * 0.8; x.fillStyle = `rgba(255,255,255,${(a * lerp(0.3, 0.9, r())).toFixed(3)})`; x.fillRect(cx - len / 2, y, len, lerp(2, 4, r()));
    }
    const tex = new THREE.CanvasTexture(c);
    const dx = CAMP[0] - J[0], dz = CAMP[2] - J[2], len = Math.hypot(dx, dz) * 0.5;
    const path = new THREE.Mesh(new THREE.PlaneGeometry(0.8, len), add('#FFC46E', 0.42 * K, { map: tex }));
    path.rotation.order = 'YXZ'; path.rotation.y = Math.atan2(dx, dz); path.rotation.x = -Math.PI / 2;
    path.position.set(J[0] + dx * 0.25, 0.15, J[2] + dz * 0.25); path.renderOrder = 3; scene.add(path);
  }
  {
    const rg = FW.rng(314), G = [];
    const dx = CAMP[0] - J[0], dz = CAMP[2] - J[2];
    for (let i = 0; i < 170; i++) { const u = Math.pow(rg(), 1.2) * 0.6, spread = lerp(0.1, 0.5, u / 0.6); G.push({ u, o: (rg() - 0.5) * 2 * spread, ph: rg() * 6.28, s: lerp(0.6, 1.3, rg()) }); }
    const gl = LW.particles(G.length, '#FFC46E', 0.035);
    gl.material.uniforms.scale.value = 900 * (S / 1080);
    gl.userData.update((i, v) => { const g = G[i]; const px = J[0] + dx * g.u - dz / Math.hypot(dx, dz) * g.o, pz = J[2] + dz * g.u + dx / Math.hypot(dx, dz) * g.o;
      v.set(px, 0.22 + waveH(px, pz, T) * 0.6, pz); const tw = 0.5 + 0.5 * Math.sin(T * 3 + g.ph); return { alpha: K * 0.8 * (1 - g.u / 0.6) * (0.3 + 0.7 * tw), size: g.s * (1 + g.u * 1.2) }; });
    scene.add(gl);
  }
  // a faint ripple where He stands (He walks ON the water)
  {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 5; x.beginPath(); x.ellipse(128, 128, 118, 118, 0, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 4; x.beginPath(); x.ellipse(128, 128, 80, 80, 0, 0, Math.PI * 2); x.stroke();
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#FFD9A0', 0.35 * K, { map: new THREE.CanvasTexture(c) }));
    ring.rotation.x = -Math.PI / 2; ring.scale.set(1.25, 1.25, 1); ring.position.set(J[0], 0.17, J[2] + 0.05); ring.renderOrder = 4; scene.add(ring);
  }

  // ---------------- Jesus: a robed figure, faceless, lit from within by the gold light ----------------
  const jesus = LW.billboard({ cw: 700, ch: 1120, worldH: 2.1, footPx: 60, draw: (x) => {
    x.translate(330, 1060);
    const poly = (pts) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); };
    const ROBE = '#E3D2AE', ROBE_SH = '#A98C64', MANTLE = '#C7A676', SKIN = '#B98559', HAIR = '#36231A';
    // far arm (low, open) behind the body
    x.fillStyle = '#CDB78F'; poly([[-56, -786], [-84, -766], [-128, -560], [-100, -546], [-70, -690]]); x.fill();
    x.fillStyle = SKIN; x.beginPath(); x.ellipse(-114, -532, 13, 17, 0.25, 0, Math.PI * 2); x.fill();
    // robe: sloped shoulders, a gentle waist, the hem trailing back as He comes toward the boat
    const rg = x.createLinearGradient(-120, -800, 110, -100); rg.addColorStop(0, '#F1E4C6'); rg.addColorStop(0.5, ROBE); rg.addColorStop(1, ROBE_SH);
    x.fillStyle = rg; x.beginPath();
    x.moveTo(-22, -812); x.bezierCurveTo(-52, -806, -70, -796, -74, -770);
    x.bezierCurveTo(-78, -660, -66, -590, -70, -540); x.bezierCurveTo(-80, -380, -100, -200, -140, -24);
    x.bezierCurveTo(-90, -4, -20, 6, 40, 0); x.bezierCurveTo(70, -2, 92, -6, 104, -14);
    x.bezierCurveTo(88, -200, 70, -380, 64, -540); x.bezierCurveTo(62, -600, 70, -680, 66, -770);
    x.bezierCurveTo(62, -796, 44, -806, 22, -812); x.closePath(); x.fill();
    // soft folds
    x.strokeStyle = 'rgba(120,92,60,0.32)'; x.lineWidth = 6; x.lineCap = 'round';
    for (const [x0, y0, x1, y1] of [[-30, -470, -66, -40], [14, -470, 22, -20], [50, -440, 74, -30]]) { x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); x.stroke(); }
    // mantle draped from the far shoulder across the chest to the near hip
    x.fillStyle = MANTLE; x.beginPath(); x.moveTo(-70, -778); x.bezierCurveTo(-30, -700, 20, -600, 66, -520); x.lineTo(66, -470); x.bezierCurveTo(10, -540, -40, -620, -72, -690); x.closePath(); x.fill();
    // near arm reaching toward the boat ("Take heart; it is I.")
    x.fillStyle = '#EADCBC'; x.beginPath(); x.moveTo(38, -790); x.bezierCurveTo(80, -770, 120, -700, 160, -660); x.lineTo(226, -628); x.lineTo(222, -598);
    x.bezierCurveTo(186, -600, 150, -610, 112, -640); x.bezierCurveTo(80, -670, 56, -700, 40, -730); x.closePath(); x.fill();
    x.fillStyle = SKIN; x.beginPath(); x.ellipse(238, -612, 18, 13, -0.35, 0, Math.PI * 2); x.fill();
    // head from behind: hair over the head and down to the shoulders; only the edge of the cheek and beard show
    x.fillStyle = SKIN; x.beginPath(); x.ellipse(12, -864, 34, 44, 0.1, 0, Math.PI * 2); x.fill();
    x.fillStyle = HAIR; x.beginPath(); x.moveTo(-34, -872); x.bezierCurveTo(-36, -926, 32, -934, 40, -880); x.bezierCurveTo(44, -858, 36, -846, 30, -836);
    x.bezierCurveTo(24, -818, 22, -800, 26, -784); x.bezierCurveTo(4, -770, -30, -768, -50, -780); x.bezierCurveTo(-40, -810, -36, -846, -34, -872); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(36, -836); x.bezierCurveTo(50, -828, 50, -808, 40, -796); x.bezierCurveTo(32, -790, 26, -800, 28, -812); x.closePath(); x.fill();
    // rim of light from the upper left over the whole figure
    x.globalCompositeOperation = 'source-atop';
    const rim = x.createLinearGradient(-150, -940, 60, -760); rim.addColorStop(0, 'rgba(255,238,200,0.6)'); rim.addColorStop(1, 'rgba(255,238,200,0)');
    x.fillStyle = rim; x.fillRect(-330, -1060, 700, 1080);
    const sh = x.createLinearGradient(40, 0, 130, 0); sh.addColorStop(0, 'rgba(40,30,30,0)'); sh.addColorStop(1, 'rgba(40,30,30,0.28)');
    x.fillStyle = sh; x.fillRect(-330, -1060, 700, 1080);
    x.globalCompositeOperation = 'source-over';
  } });
  jesus.position.set(J[0], 0.06, J[2]); jesus.userData.update('j');
  jesus.material.alphaTest = 0.5;   // crisp edge, no dark fringe from transparent texels
  scene.add(jesus);

  // ---------------- the boat: a small wooden fishing boat, sail furled, rowing against the wind ----------------
  const boat = new THREE.Group();
  {
    const wood = new THREE.MeshStandardMaterial({ color: C('#2C1F16'), flatShading: true, roughness: 0.9, side: THREE.DoubleSide });
    const woodD = new THREE.MeshStandardMaterial({ color: C('#1C140F'), flatShading: true, roughness: 0.95, side: THREE.DoubleSide });
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood);
    hull.scale.set(1.55, 0.72, 0.55); hull.position.y = 0.28; boat.add(hull);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.7), woodD); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.0; boat.add(floor);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 5, 40), woodD); rim.rotation.x = Math.PI / 2; rim.scale.set(1.55, 0.55, 1); rim.position.y = 0.29; boat.add(rim);
    for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.62, 0.1), woodD); post.position.set(s * 1.5, 0.48, 0); post.rotation.z = -s * 0.42; boat.add(post); }
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.04, 2.5, 6), woodD); mast.position.set(-0.15, 1.45, 0); boat.add(mast);
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.3, 5), woodD); yard.rotation.z = 0.95; yard.position.set(0.05, 1.95, 0.02); boat.add(yard);
    const sail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.7, 7), new THREE.MeshStandardMaterial({ color: C('#5E5040'), flatShading: true, roughness: 0.95 }));
    sail.rotation.z = 0.95; sail.position.set(0.09, 1.9, 0.05); boat.add(sail);
    for (const [x0, a] of [[-0.55, 0.62], [0.35, 0.58]]) { const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.9, 5), woodD); oar.position.set(x0, 0.08, 0.72); oar.rotation.x = a; oar.rotation.z = 0.15; boat.add(oar); }
    // the lantern, hung at the stern
    const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.75, 4), woodD); hook.position.set(1.33, 0.78, 0.05); hook.rotation.z = -0.3; boat.add(hook);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.18, 0.13), new THREE.MeshBasicMaterial({ color: C('#FFB24C').multiplyScalar(2.4), toneMapped: false })); lamp.position.set(1.47, 1.0, 0.05); boat.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.08, 4), woodD); cap.position.set(1.47, 1.13, 0.05); cap.rotation.y = Math.PI / 4; boat.add(cap);
    const lg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#FFA94A'), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    lg.scale.set(0.75, 0.75, 1); lg.position.set(1.47, 1.0, 0.1); boat.add(lg);
    const ll = new THREE.PointLight(C('#FF9E45'), 3.5, 5, 1.4); ll.position.set(1.47, 1.0, 0.25); boat.add(ll);
    boat.userData.lamp = [1.47, 1.0, 0.05];
  }
  boat.position.set(...B); boat.rotation.y = -0.55; boat.rotation.z = 0.03;
  scene.add(boat);
  // the disciples: seated, rowing, heads turned toward Him; dark shapes with the lantern's warm rim on their backs
  const disciple = (variant) => LW.billboard({ cw: 360, ch: 420, worldH: 1.15, footPx: 20, draw: (x) => {
    x.translate(180, 400);
    const tone = '#120E0C', rimC = 'rgba(255,150,70,0.7)';
    x.fillStyle = tone;
    const lean = [0.0, 0.14, -0.04, 0.22][variant];
    x.save(); x.rotate(-lean);
    // cloak: broad shoulders, back rounded over the oar; hood/head with a neck notch; arms forward to the oar
    x.beginPath(); x.moveTo(66, -10); x.bezierCurveTo(84, -100, 86, -180, 64, -226); x.bezierCurveTo(50, -250, 28, -256, 14, -252);
    x.lineTo(-30, -250); x.bezierCurveTo(-60, -246, -74, -226, -80, -204);
    x.bezierCurveTo(-112, -190, -138, -170, -152, -146); x.lineTo(-136, -128); x.bezierCurveTo(-112, -146, -92, -152, -72, -146);
    x.bezierCurveTo(-90, -100, -96, -54, -88, -10); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-26, -248); x.bezierCurveTo(-48, -266, -54, -300, -40, -324); x.bezierCurveTo(-26, -348, 10, -350, 26, -330);
    x.bezierCurveTo(40, -312, 38, -280, 26, -258); x.bezierCurveTo(14, -246, -8, -242, -26, -248); x.closePath(); x.fill();
    if (variant === 3) { x.lineWidth = 18; x.lineCap = 'round'; x.strokeStyle = tone; x.beginPath(); x.moveTo(-50, -236); x.quadraticCurveTo(-120, -270, -168, -318); x.stroke(); }
    x.restore();
    // lantern rim (the lamp is behind them, to the right)
    x.globalCompositeOperation = 'source-atop';
    const g = x.createLinearGradient(110, 0, 30, 0); g.addColorStop(0, rimC); g.addColorStop(1, 'rgba(255,150,70,0)');
    x.fillStyle = g; x.fillRect(-200, -420, 400, 420);
    const g2 = x.createLinearGradient(0, -360, 0, -270); g2.addColorStop(0, 'rgba(170,160,190,0.32)'); g2.addColorStop(1, 'rgba(190,170,200,0)');
    x.fillStyle = g2; x.fillRect(-200, -420, 400, 200);
    x.globalCompositeOperation = 'source-over';
  } });
  const crew = [[-0.95, 3], [-0.25, 0], [0.4, 1], [0.95, 2]].map(([lx, v]) => {
    const bb = disciple(v); bb.userData.update('d' + v); bb.material.alphaTest = 0.5;
    const p = new THREE.Vector3(lx, 0.02, 0.0).applyEuler(boat.rotation).add(new THREE.Vector3(...B));
    bb.position.copy(p); scene.add(bb); return bb;
  });

  // ---------------- camera + render ----------------
  FW.setCam(cam, CAMP, CAML, 36);
  cam.updateMatrixWorld();
  [jesus, ...crew].forEach((m) => m.userData.face(cam));
  const gl = LW.render(scene, cam, { focus: 7.6, aperture: 1.5, maxR: 4, fgScale: 0.9, exposure: 1.12, sat: 1.04, lift: [0.01, 0.014, 0.032] });

  // ---------------- 2D finishing: bloom, God's rays from the upper left, vignette, grain ----------------
  const sq = document.createElement('canvas'); sq.width = sq.height = S; const sx = sq.getContext('2d');
  sx.drawImage(gl, 0, 0);
  const P = (p) => LW.project(cam, p);
  {
    const sc = S / 1080, tgt = P([J[0], 1.0, J[2]]);
    const ox = -260 * sc, oy = -520 * sc, ang0 = Math.atan2(tgt[1] - oy, tgt[0] - ox), len = Math.hypot(tgt[0] - ox, tgt[1] - oy) * 1.04;
    sx.save(); sx.globalCompositeOperation = 'lighter';
    for (const [da, wd, a] of [[-0.1, 22, 0.5], [-0.055, 46, 0.75], [-0.02, 18, 0.5], [0.01, 66, 1], [0.045, 26, 0.55], [0.085, 38, 0.6]]) {
      const ang = ang0 + da, w = wd / 1000;
      const g = sx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.35, `rgba(255,210,130,${0.035 * a * K})`); g.addColorStop(0.75, `rgba(255,200,110,${0.06 * a * K})`); g.addColorStop(1, 'rgba(255,200,110,0)');
      sx.fillStyle = g; sx.beginPath(); sx.moveTo(ox, oy); sx.lineTo(ox + Math.cos(ang - w) * len, oy + Math.sin(ang - w) * len); sx.lineTo(ox + Math.cos(ang + w) * len, oy + Math.sin(ang + w) * len); sx.closePath(); sx.fill();
    }
    sx.restore();
    // bloom
    const w = Math.round(S / 4), h = w, b1 = document.createElement('canvas'), b2 = document.createElement('canvas'); b1.width = b2.width = w; b1.height = b2.height = h;
    const a1 = b1.getContext('2d'), a2 = b2.getContext('2d');
    a1.filter = 'brightness(0.7) contrast(3.4) saturate(1.2)'; a1.drawImage(sq, 0, 0, w, h); a1.filter = 'none';
    a2.filter = `blur(${Math.round(9 * sc)}px)`; a2.drawImage(b1, 0, 0); a2.filter = `blur(${Math.round(3 * sc)}px)`; a2.globalAlpha = 0.6; a2.drawImage(b1, 0, 0); a2.globalAlpha = 1; a2.filter = 'none';
    sx.save(); sx.globalCompositeOperation = 'lighter'; sx.globalAlpha = 0.26; sx.drawImage(b2, 0, 0, S, S); sx.restore();
    // vignette
    const vg = sx.createRadialGradient(S * 0.48, S * 0.46, S * 0.25, S * 0.5, S * 0.5, S * 0.78); vg.addColorStop(0, 'rgba(4,5,10,0)'); vg.addColorStop(1, 'rgba(4,5,10,0.55)');
    sx.fillStyle = vg; sx.fillRect(0, 0, S, S);
    // grain (seeded)
    const gr = document.createElement('canvas'); gr.width = gr.height = 256; const gx = gr.getContext('2d'), id = gx.createImageData(256, 256), rg = FW.rng(31);
    for (let i = 0; i < id.data.length; i += 4) { const v = rg() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0); sx.save(); sx.globalAlpha = 0.035; sx.globalCompositeOperation = 'overlay'; sx.fillStyle = sx.createPattern(gr, 'repeat'); sx.fillRect(0, 0, S, S); sx.restore();
  }
  globalThis.__proj = { jesus: P([J[0], 1.0, J[2]]).map((v) => v / S), boat: P([B[0], 0.6, B[2]]).map((v) => v / S), lamp: P(boat.localToWorld(new THREE.Vector3(...boat.userData.lamp)).toArray()).map((v) => v / S) };

  // ---------------- output ----------------
  let out = sq;
  if (MODE === 'endcard') {
    const W = 1080, H = 1920; out = document.createElement('canvas'); out.width = W; out.height = H; const x = out.getContext('2d');
    x.fillStyle = '#0E0B09'; x.fillRect(0, 0, W, H);
    const top = 150; x.drawImage(sq, 0, top);
    // melt the square's edges into the dark
    let g = x.createLinearGradient(0, top, 0, top + 190); g.addColorStop(0, 'rgba(14,11,9,1)'); g.addColorStop(1, 'rgba(14,11,9,0)'); x.fillStyle = g; x.fillRect(0, top, W, 190);
    g = x.createLinearGradient(0, top + 1080 - 300, 0, top + 1080); g.addColorStop(0, 'rgba(14,11,9,0)'); g.addColorStop(1, 'rgba(14,11,9,1)'); x.fillStyle = g; x.fillRect(0, top + 1080 - 300, W, 300);
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.font = '700 78px "Cinzel"'; x.letterSpacing = '12px'; x.fillStyle = '#F2E6CF'; x.fillText('FOURTH WATCH', W / 2 + 6, 1318);
    x.strokeStyle = 'rgba(227,178,92,0.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 60, 1362); x.lineTo(W / 2 + 60, 1362); x.stroke();
    x.font = '600 26px "Inter"'; x.letterSpacing = '9px'; x.fillStyle = '#8C8174'; x.fillText('MATTHEW 14:25', W / 2 + 4.5, 1420);
  }
  document.body.appendChild(out);
  globalThis.__out = out;
  globalThis.__done = true;
})().catch((e) => { console.error(e); globalThis.__err = String(e && e.stack || e); globalThis.__done = true; });
