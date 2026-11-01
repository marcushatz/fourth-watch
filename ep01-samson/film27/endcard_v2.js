// FOURTH WATCH end card v2 (Matthew 14:25): about 4 s.
//   0.0-0.8  the boat on the night sea, almost dark; the lantern on the mast grows from an ember to a warm glow
//   0.5-2.5  one camera move: a slow pull-back from the boat (13%, cubic in-out) that brings Him into frame;
//            0.8-2.2 He is revealed walking toward the boat across the water, into gold light from the top left
//   2.2-3.0  FOURTH WATCH rises in (Cinzel caps, cream) with a thin gold rule
//   3.0-4.0  hold: only the water, the lantern flicker and the dust move
// Modes (?mode=): '' the 9:16 animation; 'lockup' a square master lockup (final state + wordmark);
// 'icon' a square crop on the figure in the beam (no text); 'icon2' the figure and the lit boat (no text).
// Built once; window.frameAt(t) renders one deterministic frame.
(async function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, LW = globalThis.LW;
  const q = new URLSearchParams(location.search);
  const MODE = q.get('mode') || '';
  const SQUARE = MODE !== '';
  const OW = +(q.get('w') || 1080), OH = +(q.get('h') || (SQUARE ? OW : 1920));
  const C = (c) => new THREE.Color(c);
  const { clamp, lerp } = FW;
  const sm = (a, b, x) => FW.smooth((x - a) / (b - a));
  const cubic = (x) => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const L3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  for (const [fam, file, w, st] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700', 'normal']]) {
    const f = new FontFace(fam, `url(${file})`, { weight: w, style: st }); document.fonts.add(f); await f.load();
  }

  LW.init(OW, OH);
  const cam = new THREE.PerspectiveCamera(42, OW / OH, 0.2, 500);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C('#1C2436'), 20, 112);

  // ---------------- layout (metres; the camera looks down -z) ----------------
  const JS = [-0.8, 0, 0.88], JF = [-0.6, 0, 0.5];   // about 5-6% of the frame width   // He walks from here toward the boat and stops here, in the light
  const J = JF.slice();                               // current position (updated each frame)
  const B = [2.0, 0, -8.6];                           // the boat
  const LIGHT_FROM = [JF[0] - 6.0, 15, JF[2] - 4.5];
  const MOON_DIR = [3.5, 3.2, -40];                   // low, behind the boat, hidden in cloud
  const walkK = (t) => SQUARE ? 1 : cubic((t - 1.0) / 1.2);   // walks 1.0-2.2 s (cubic in-out), settled before the wordmark

  // a lit silhouette: parts filled dark, then thin rims where each light catches the edge (shape minus a copy pushed away
  // from the light); body null makes a light-only layer; parts marked {norim} get no rim
  const silhouette = (w, h, ox0, oy0, parts, body, rims, after) => {
    const mk = () => { const c = canvas(w, h), x = c.getContext('2d'); x.translate(ox0, oy0); return [c, x]; };
    const paint = (x, col, dx = 0, dy = 0, rimOnly = false) => { x.save(); x.translate(dx, dy); x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
      for (const p of parts) { if (rimOnly && p.norim) continue; const path = p instanceof Path2D ? p : p.path; if (p.w) { x.lineWidth = p.w; x.stroke(path); } else x.fill(path); } x.restore(); };
    const [c, x] = mk(); if (body) paint(x, body);
    const blit = (src, a = 1) => { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = a; x.drawImage(src, 0, 0); x.restore(); };
    if (after) { const [tc, tx] = mk(); paint(tx, '#fff', 0, 0, true); tx.globalCompositeOperation = 'source-in'; after(tx); blit(tc); }
    for (const r of rims) {
      const [rc, rx] = mk(); paint(rx, r.color, 0, 0, true); rx.globalCompositeOperation = 'destination-out'; paint(rx, '#000', r.dx, r.dy);
      if (r.mask) { rx.globalCompositeOperation = 'destination-in'; rx.fillStyle = r.mask(rx); rx.fillRect(-ox0, -oy0, w, h); }
      blit(rc, r.alpha == null ? 1 : r.alpha);
    }
    if (body) { const nr = parts.filter((p) => p.norim); if (nr.length) { x.save(); x.fillStyle = x.strokeStyle = body; x.lineCap = 'round';
      for (const p of nr) { const path = p instanceof Path2D ? p : p.path; if (p.w) { x.lineWidth = p.w; x.stroke(path); } else x.fill(path); } x.restore(); } }
    return c;
  };

  // ---------------- sky: a storm deck, a break at the upper left (gold), the moon hidden low behind the boat (cool) ----------------
  scene.add(LW.sky({ top: '#04060C', mid: '#0B1120', hor: '#26324A', low: '#0B1018', sunDir: [-0.55, 0.42, -1], sunCol: '#8A7458', sunAmt: 0.0 }));
  let skyCard;
  const goldCard = (() => {
    const CW = 1500, CH = 700;                // the card spans x -75..75, y -6..64 at z -150
    const GU = 0.2, GV = 0.06;
    const MU = 0.5 + (MOON_DIR[0] / -MOON_DIR[2] * 160) / 150, MV = (64 - (1.4 + MOON_DIR[1] / -MOON_DIR[2] * 160)) / 70;
    const D = new Float32Array(CW * CH);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const u = i / CW, v = j / CH, X = u * 4.2, Y = v * 1.96;
      const wx = FW.fbm(X * 0.6 + 3.1, Y * 0.6 + 1.2, 5, 3) - 0.5, wy = FW.fbm(X * 0.6 + 8.3, Y * 0.6 + 6.6, 6, 3) - 0.5;
      let n = FW.fbm(X * 1.15 + wx * 0.7, (Y + wy * 0.35) * 2.6, 7, 5);
      n += 0.07 * sm(0.25, 0.9, v);
      n -= 0.34 * Math.exp(-(((u - GU) / 0.15) ** 2 + ((v - GV) / 0.3) ** 2));
      D[j * CW + i] = n;
    }
    const at = (i, j) => D[clamp(Math.round(j), 0, CH - 1) * CW + clamp(Math.round(i), 0, CW - 1)];
    const base = new ImageData(CW, CH), gold = new ImageData(CW, CH), bd = base.data, gd = gold.data, cover = new Float32Array(CW * CH);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const u = i / CW, v = j / CH, n = D[j * CW + i], k = (j * CW + i) * 4;
      const cv = sm(0.42, 0.64, n), thick = sm(0.5, 0.78, n); cover[j * CW + i] = cv;
      const hs = Math.pow(sm(0.25, 0.97, v), 1.4);
      let r = lerp(5, 36, hs), g = lerp(7, 46, hs), b = lerp(13, 68, hs);
      const mg = Math.exp(-(((u - MU) / 0.09) ** 2 + ((v - MV) / 0.15) ** 2)) * (1 - cv * 0.75);
      r += 60 * mg; g += 72 * mg; b += 96 * mg;
      r = lerp(r, lerp(22, 8, thick), cv); g = lerp(g, lerp(27, 11, thick), cv); b = lerp(b, lerp(40, 19, thick), cv);
      let dx = (MU - u) * CW, dy = (MV - v) * CH, dl = Math.hypot(dx, dy) || 1;
      const em = clamp((n - at(i + dx / dl * 13, j + dy / dl * 13)) * 9, 0, 1) * cv;
      const wm = 0.12 + 0.88 * Math.exp(-(((u - MU) / 0.16) ** 2 + ((v - MV) / 0.26) ** 2));
      r += 62 * em * wm; g += 74 * em * wm; b += 100 * em * wm;
      const et = clamp((n - at(i, j - 10)) * 8, 0, 1) * cv;
      r += 16 * et; g += 20 * et; b += 30 * et;
      bd[k] = r; bd[k + 1] = g; bd[k + 2] = b; bd[k + 3] = 255;
      dx = (GU - u) * CW; dy = (GV - v) * CH; dl = Math.hypot(dx, dy) || 1;
      const eg = clamp((n - at(i + dx / dl * 13, j + dy / dl * 13)) * 9, 0, 1) * cv;
      const wg = Math.exp(-(((u - GU) / 0.2) ** 2 + ((v - GV) / 0.36) ** 2));
      const gg = Math.exp(-(((u - GU) / 0.1) ** 2 + ((v - GV) / 0.2) ** 2)) * (1 - cv * 0.8);
      gd[k] = 235 * eg * wg + 240 * gg; gd[k + 1] = 168 * eg * wg + 192 * gg; gd[k + 2] = 98 * eg * wg + 128 * gg; gd[k + 3] = 255;
    }
    const mkCard = (img, additive, z, stars) => {
      const c = canvas(CW, CH), x = c.getContext('2d'); x.putImageData(img, 0, 0);
      if (stars) {
        const r = FW.rng(1425);
        for (let s = 0; s < 900; s++) { const i = r() * CW, j = r() * CH * 0.8, cv = cover[Math.floor(j) * CW + Math.floor(i)], a = (1 - cv / 0.25) * lerp(0.25, 0.85, r()), rad = lerp(0.7, 1.5, r());
          if (cv > 0.25 || a <= 0 || r() > 1.6 * Math.exp(-(((i / CW - GU) / 0.2) ** 2 + ((j / CH - GV) / 0.4) ** 2))) continue; x.fillStyle = `rgba(220,228,255,${a.toFixed(3)})`; x.beginPath(); x.arc(i, j, rad, 0, Math.PI * 2); x.fill(); }
      }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 70), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: additive ? 0 : 1, depthWrite: false, fog: false, toneMapped: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
      m.position.set(0, 29, z); m.renderOrder = additive ? -4 : -5; scene.add(m); return m;
    };
    skyCard = mkCard(base, false, -150, true);
    return mkCard(gold, true, -149.5, false);
  })();

  // ---------------- the sea: wind-driven swell (the wind is against them: waves run right to left) ----------------
  const waveH = (x, z, t) => {
    t += 12.4;   // wave phase chosen (searched) so no swell hides His feet while He walks, nor the boat's hull
    const far = clamp(1 - (-z - 8) / 60, 0.22, 1);
    let h = 0.38 * Math.sin(0.62 * x + 0.22 * z + 1.55 * t) + 0.2 * Math.sin(1.18 * x - 0.55 * z + 2.25 * t + 1.1)
      + 0.1 * Math.sin(2.6 * x + 1.4 * z + 3.4 * t + 2.3) + 0.32 * (FW.fbm(x * 0.33 + t * 0.21, z * 0.33 - t * 0.05, 5, 3) - 0.5);
    h *= far;
    const dj = Math.hypot(x - J[0], z - J[2]); h *= 0.55 + 0.45 * sm(0.15, 0.85, dj);   // He stands ON the water
    return h;
  };
  const chopTex = (() => {
    const N = 256, c = canvas(N, N), x = c.getContext('2d'), id = x.createImageData(N, N), r = FW.rng(5150), W = [];
    for (let k = 0; k < 30; k++) { const kx = Math.round(lerp(1, 13, r())) * (r() < 0.5 ? -1 : 1), ky = Math.round(lerp(-6, 6, r())); W.push([kx, ky, 1 / Math.hypot(kx, ky), r() * 6.283]); }
    const gx = new Float32Array(N * N), gy = new Float32Array(N * N); let mx = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let a = 0, b = 0; for (const [kx, ky, am, ph] of W) { const c0 = Math.cos(6.283 * (kx * i + ky * j) / N + ph) * am; a += c0 * kx; b += c0 * ky; } gx[j * N + i] = a; gy[j * N + i] = b; mx = Math.max(mx, Math.hypot(a, b)); }
    for (let p = 0; p < N * N; p++) { const a = -gx[p] / mx * 0.9, b = -gy[p] / mx * 0.9, l = Math.hypot(a, b, 1); id.data[p * 4] = (a / l * 0.5 + 0.5) * 255; id.data[p * 4 + 1] = (b / l * 0.5 + 0.5) * 255; id.data[p * 4 + 2] = (1 / l * 0.5 + 0.5) * 255; id.data[p * 4 + 3] = 255; }
    x.putImageData(id, 0, 0); const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 8; return tex;
  })();
  const SEA = (() => {
    const g = new THREE.PlaneGeometry(72, 1, 300, 240); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const v = 0.5 - pos.getZ(i); pos.setZ(i, 12 - 98 * v * v); }
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 2.4, pos.getZ(i) / 2.4);
    const base = new Float32Array(pos.array), cols = new Float32Array(pos.count * 3), tint = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) tint[i] = FW.noise2(base[i * 3] * 0.45, base[i * 3 + 2] * 0.45, 9);
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.52, metalness: 0.0, normalMap: chopTex, normalScale: new THREE.Vector2(0.32, 0.32) });
    scene.add(new THREE.Mesh(g, mat));
    const deep = C('#040A14'), mid = C('#0B172B'), foam = C('#6E819F'), tmp = new THREE.Color();
    const update = (t) => {
      for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 1] = waveH(base[i * 3], base[i * 3 + 2], t);
      pos.needsUpdate = true; g.computeVertexNormals();
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2], y = pos.array[i * 3 + 1], far = clamp(1 - (-z - 8) / 60, 0.22, 1);
        const crest = clamp((y / far - 0.3) * 2.6, 0, 1) * (0.45 + 0.55 * FW.noise2(x * 1.3 - t * 0.6, z * 1.3, 41));
        tmp.copy(deep).lerp(mid, tint[i]).lerp(foam, crest * 0.5 * far);
        cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
      }
      g.attributes.color.needsUpdate = true;
      chopTex.offset.set(t * 0.06, -t * 0.015);
    };
    return { update };
  })();

  // ---------------- light ----------------
  const hemi = new THREE.HemisphereLight(C('#26344F'), C('#05070C'), 0.42); scene.add(hemi);
  const moon = new THREE.DirectionalLight(C('#A9BEE3'), 0.3); moon.position.set(...MOON_DIR); scene.add(moon);
  const spot = new THREE.SpotLight(C('#FFC97E'), 0, 50, 0.17, 0.8, 1.2);
  spot.position.set(...LIGHT_FROM); spot.target.position.set(JF[0] + 0.4, 0, JF[2] + 0.6); scene.add(spot); scene.add(spot.target);
  const jLight = new THREE.PointLight(C('#FFC46E'), 0, 4.2, 1.5); scene.add(jLight);

  const radial = (stops) => { const c = canvas(256, 256), x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`)); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); };
  const glowTex = radial([[0, 1], [0.25, 0.55], [0.6, 0.14], [1, 0]]);
  const add = (color, opacity, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: C(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }, o));
  const PS = 900 * (OH / 1920);   // particle size scale

  const shaft = LW.shaft(LIGHT_FROM, [JF[0] + 0.1, 0.1, JF[2] + 0.2], 0.25, 1.35, '#FFD089'); scene.add(shaft);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#FFC36A'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  halo.scale.set(2.4, 3.2, 1); halo.renderOrder = 2; scene.add(halo);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#FFC46E', 0, { map: glowTex, depthTest: false }));
  pool.rotation.x = -Math.PI / 2; pool.scale.set(3.0, 1.6, 1); pool.renderOrder = 3; scene.add(pool);
  const G = []; { const rg = FW.rng(314); for (let i = 0; i < 200; i++) { const u = Math.pow(rg(), 1.25), spread = lerp(0.12, 0.8, u); G.push({ u, o: (rg() - 0.5) * 2 * spread, ph: rg() * 6.28, s: lerp(0.6, 1.3, rg()) }); } }
  const glints = LW.particles(G.length, '#FFC877', 0.04); glints.material.uniforms.scale.value = PS; scene.add(glints);
  const MG = []; { const r = FW.rng(4242); for (let i = 0; i < 900; i++) { const d = lerp(15, 96, Math.pow(r(), 0.8)); MG.push({ d, o: (r() - 0.5) * 2 * lerp(1.2, 7.5, (d - 15) / 81) * (0.3 + 0.7 * r()), ph: r() * 6.28, s: lerp(0.5, 1.2, r()), f: lerp(2.5, 7, r()) }); } }
  const moonGlints = LW.particles(MG.length, '#D2DCF2', 0.035); moonGlints.material.uniforms.scale.value = PS; scene.add(moonGlints);
  const moonPath = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#9FB2DA', 0.16, { map: glowTex })); moonPath.rotation.x = -Math.PI / 2; moonPath.renderOrder = 1; scene.add(moonPath);
  const ringTex = (() => { const c = canvas(256, 256), x = c.getContext('2d'); x.lineCap = 'round';
    for (let k = 0; k < 96; k++) { const a0 = k / 96 * Math.PI * 2, a = clamp((FW.noise2(k * 0.35, 0.5, 3) - 0.38) * 2.2, 0, 1); x.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 116, a0, a0 + Math.PI * 2 / 96 * 0.8); x.stroke(); }
    return new THREE.CanvasTexture(c); })();
  const ringTexBold = (() => { const c = canvas(256, 256), x = c.getContext('2d'); x.shadowColor = 'rgba(255,255,255,0.9)'; x.shadowBlur = 10; x.strokeStyle = '#fff'; x.lineWidth = 10;
    x.beginPath(); x.arc(128, 128, 112, 0, Math.PI * 2); x.stroke(); return new THREE.CanvasTexture(c); })();
  const rings = [0, 0.5].map((ph) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#FFDDAA', 0, { map: MODE === 'icon' ? ringTexBold : ringTex })); m.rotation.x = -Math.PI / 2; m.userData.ph = ph; m.renderOrder = 4; scene.add(m); return m; });
  // dust motes drifting in the beam
  const DU = []; { const r = FW.rng(919); for (let i = 0; i < 70; i++) DU.push({ x: lerp(-1.3, 1.1, r()), y: lerp(0.3, 3.2, r()), z: lerp(-0.9, 0.7, r()), ph: r() * 6.28, sp: lerp(0.05, 0.14, r()), s: lerp(0.6, 1.4, r()) }); }
  const dust = LW.particles(DU.length, '#FFDCA6', 0.022); dust.material.uniforms.scale.value = PS; scene.add(dust);
  const SP = []; { const r = FW.rng(808); for (let i = 0; i < 420; i++) SP.push({ x: lerp(-9, 9, r()), z: lerp(-14, 4, r()), ph: r() * 10, sp: lerp(0.8, 1.8, r()), s: lerp(0.5, 1.4, r()) }); }
  const spray = LW.particles(SP.length, '#A9B9D4', 0.035); spray.material.uniforms.scale.value = PS; scene.add(spray);
  const mistTex = (() => { const c = canvas(512, 128), x = c.getContext('2d'), id = x.createImageData(512, 128);
    for (let j = 0; j < 128; j++) for (let i = 0; i < 512; i++) { const n = FW.fbm(i / 90, j / 40, 61, 4), e = Math.sin(Math.PI * j / 128) * Math.sin(Math.PI * i / 512); const k = (j * 512 + i) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = 255 * clamp((n - 0.35) * 2.2, 0, 1) * e; }
    x.putImageData(id, 0, 0); return new THREE.CanvasTexture(c); })();
  const mists = [[-4, 0.5, -6, 14, 0.07], [3, 0.7, -9, 16, 0.07], [-1, 0.35, -2.5, 11, 0.045], [6, 0.9, -15, 20, 0.07]].map(([x0, y, z, w, a], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.22), new THREE.MeshBasicMaterial({ map: mistTex, color: C('#8C9DBA'), transparent: true, opacity: a, depthWrite: false, fog: false, toneMapped: false }));
    m.position.set(x0, y, z); m.userData = { x0, i, a }; scene.add(m); return m;
  });

  // ---------------- Jesus: a robed man about 7.5 heads tall, walking toward the boat; head in profile (brow, nose, beard),
  // arms lowered, the near hand a little forward. s = stride (-1..1): +1 the near leg forward under the robe ----------------
  const JW = 900, JH = 1240, JOX = 430, JOY = 1194;
  const jParts = (s) => {
    const parts = [], P = (f) => { const p = new Path2D(); f(p); parts.push(p); };
    const a = Math.abs(s), kneeX = 136 + 30 * a, shinX = 134 + 22 * a, footX = 168 + 46 * a, trail = a, sw = -s;   // the forward leg shows through the robe; the near arm swings against the near leg
    P((p) => {   // head and hair
      p.moveTo(-6, -1112); p.bezierCurveTo(22, -1114, 44, -1096, 50, -1070); p.bezierCurveTo(53, -1058, 54, -1050, 56, -1042);
      p.lineTo(68, -1020); p.bezierCurveTo(66, -1014, 60, -1012, 56, -1012); p.bezierCurveTo(60, -1004, 60, -998, 58, -992);
      p.bezierCurveTo(64, -976, 62, -954, 52, -940); p.bezierCurveTo(42, -930, 28, -928, 16, -932); p.bezierCurveTo(16, -924, 22, -916, 30, -910);
      p.lineTo(-50, -904); p.bezierCurveTo(-64, -910, -78, -914, -90, -924); p.bezierCurveTo(-80, -950, -76, -990, -70, -1030);
      p.bezierCurveTo(-64, -1080, -40, -1110, -6, -1112); p.closePath(); });
    P((p) => {   // robe: the near leg's stride shows through it at the knee and the foot; the hem trails back in the wind
      p.moveTo(30, -912); p.bezierCurveTo(62, -908, 98, -900, 116, -878); p.bezierCurveTo(128, -860, 128, -830, 122, -800);
      p.bezierCurveTo(114, -740, 100, -690, 92, -650); p.bezierCurveTo(88, -630, 90, -610, 96, -590);
      p.bezierCurveTo(108 + 4 * s, -500, 124 + 10 * s, -400, kneeX, -320); p.bezierCurveTo(kneeX + 6, -280, shinX + 8, -220, shinX, -150);
      p.bezierCurveTo(shinX - 4, -100, footX - 48, -40, footX - 34, -20); p.lineTo(footX, -10); p.lineTo(footX + 4, 0); p.lineTo(60, 2);
      p.bezierCurveTo(-10, 0, -90, -16 - 8 * trail, -170, -50 - 10 * trail); p.bezierCurveTo(-200, -62 - 12 * trail, -226 - 26 * trail, -82 - 14 * trail, -246 - 34 * trail, -108 - 16 * trail);
      p.bezierCurveTo(-226, -114, -206, -130, -192, -150); p.bezierCurveTo(-206, -280, -200, -420, -184, -540);   // the mantle down the back
      p.bezierCurveTo(-170, -650, -152, -780, -142, -840); p.bezierCurveTo(-134, -876, -106, -902, -70, -910);
      p.bezierCurveTo(-40, -916, 0, -918, 30, -912); p.closePath(); });
    P((p) => {   // far arm, lowered, the hand just showing behind the robe
      const d = 16 * s;
      p.moveTo(-90, -880); p.bezierCurveTo(-120, -840, -136 + d * 0.3, -760, -146 + d * 0.6, -690); p.bezierCurveTo(-152 + d * 0.8, -640, -158 + d, -600, -164 + d, -572);
      p.bezierCurveTo(-170 + d, -556, -172 + d, -540, -166 + d, -528); p.bezierCurveTo(-160 + d, -524, -152 + d, -530, -148 + d, -540);
      p.bezierCurveTo(-144 + d, -560, -136 + d * 0.8, -590, -126 + d * 0.6, -620); p.lineTo(-110, -700); p.lineTo(-100, -860); p.closePath(); });
    const P12 = (f) => { const p = new Path2D(); f(p); const q = new Path2D(); q.addPath(p, new DOMMatrix().translate(14, 0)); parts.push(q); };
    P12((p) => {   // near arm, lowered, the open hand a little forward toward the boat, the wide sleeve hanging from the forearm
      const e = 12 * sw, w = 26 * sw;
      p.moveTo(70, -892); p.bezierCurveTo(110, -884, 126, -850, 132, -800); p.bezierCurveTo(140, -740, 150 + e, -690, 168 + e, -650);
      p.bezierCurveTo(186 + e, -620, 206 + w, -596, 226 + w, -578); p.bezierCurveTo(236 + w, -570, 246 + w, -560, 252 + w, -548);
      p.bezierCurveTo(256 + w, -538, 256 + w, -528, 250 + w, -522); p.bezierCurveTo(244 + w, -526, 238 + w, -534, 232 + w, -540);
      p.bezierCurveTo(228 + w, -532, 222 + w, -528, 216 + w, -534); p.bezierCurveTo(212 + w, -544, 208 + w, -552, 202 + w, -560);
      p.bezierCurveTo(186 + e, -556, 170 + e, -560, 156 + e, -572); p.bezierCurveTo(146 + e, -580, 132, -600, 122, -620);
      p.bezierCurveTo(110, -650, 104, -700, 100, -760); p.lineTo(96, -800); p.closePath(); });
    return parts;
  };
  const rimFade = (x) => { const g = x.createLinearGradient(0, -1110, 0, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); return g; };
  const jesus = LW.billboard({ cw: JW, ch: JH, worldH: 2.1, footPx: 46, draw: (x, s) => {
    x.drawImage(silhouette(JW, JH, JOX, JOY, jParts(s), '#0E0B0E', []), 0, 0);
  } });
  const jesusCool = LW.billboard({ cw: JW, ch: JH, worldH: 2.1, footPx: 46, draw: (x, s) => {   // the moon's rim, its own layer: no light outline over a half-faded body
    x.drawImage(silhouette(JW, JH, JOX, JOY, jParts(s), null, [{ color: '#9DB0D6', dx: -6, dy: 3, alpha: 0.42 }]), 0, 0);
  } });
  jesusCool.material.alphaTest = 0; jesusCool.material.depthWrite = false; jesusCool.renderOrder = 5; scene.add(jesusCool);
  const jesusLit = LW.billboard({ cw: JW, ch: JH, worldH: 2.1, footPx: 46, draw: (x, s) => {
    x.drawImage(silhouette(JW, JH, JOX, JOY, jParts(s), null, [
      { color: '#FFC27A', dx: 16, dy: 12, alpha: 0.22, mask: (x) => rimFade(x) },
      { color: '#FFD597', dx: 6, dy: 5, alpha: 1, mask: (x) => rimFade(x) },
    ], (o) => {
      const warm = o.createLinearGradient(-340, -1100, 160, -200); warm.addColorStop(0, 'rgba(96,62,36,0.55)'); warm.addColorStop(0.5, 'rgba(30,22,22,0.18)'); warm.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = warm; o.fillRect(-430, -1194, 900, 1240);
      o.strokeStyle = 'rgba(255,200,130,0.07)'; o.lineWidth = 5; o.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[-60, -620, -150, -80], [20, -600, 60, -60], [-20, -880, -40, -680]]) { o.beginPath(); o.moveTo(x0, y0); o.quadraticCurveTo((x0 + x1) / 2 - 10, (y0 + y1) / 2, x1, y1); o.stroke(); }
    }), 0, 0);
  } });
  jesus.material.alphaTest = 0.02; scene.add(jesus);
  const reflFade = (() => { const c = canvas(4, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 256, 0, 0);   // canvas top = uv v 1
    g.addColorStop(0, '#000'); g.addColorStop(0.035, '#fff'); g.addColorStop(0.2, '#666'); g.addColorStop(0.45, '#000'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); })();
  const refl = new THREE.Mesh(jesus.geometry, new THREE.MeshBasicMaterial({ map: jesus.material.map, alphaMap: reflFade, color: C('#B8B4B0'), transparent: true, opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide, fog: false }));
  refl.renderOrder = 4.5; scene.add(refl);
  jesusLit.material.alphaTest = 0; jesusLit.material.depthWrite = false; jesusLit.renderOrder = 6; scene.add(jesusLit);

  // ---------------- the boat: side-on, bow to the right into the wind; a bare mast with the sail furled and the lantern hung
  // from it; four disciples, one half-risen crying out toward the figure on the water ----------------
  const BW = 1100, BH = 800, BOX = 550, BOY = 660, BPX = 250;   // the hull is about 3.8 m
  const LAMP = [22, -372];
  const bParts = [];
  { const F = (f, norim) => { const p = new Path2D(); f(p); bParts.push(norim ? { path: p, norim } : p); }, S = (w, f, norim) => { const p = new Path2D(); f(p); bParts.push({ path: p, w, norim }); };
    F((p) => {
      p.moveTo(-470, -200); p.lineTo(-452, -198); p.bezierCurveTo(-440, -152, -420, -122, -380, -112);
      p.bezierCurveTo(-200, -92, 200, -92, 380, -114); p.bezierCurveTo(420, -122, 446, -152, 462, -208); p.lineTo(478, -206);
      p.bezierCurveTo(470, -150, 450, -60, 400, -10); p.bezierCurveTo(300, 50, -300, 50, -400, -10); p.bezierCurveTo(-440, -50, -462, -120, -470, -200); p.closePath(); });
    S(10, (p) => { p.moveTo(70, -100); p.lineTo(48, -540); }, true);
    S(7, (p) => { p.moveTo(-70, -322); p.lineTo(226, -566); }, true);
    F((p) => { p.moveTo(-50, -336); p.bezierCurveTo(30, -372, 140, -466, 210, -552); p.bezierCurveTo(150, -468, 54, -378, -50, -336); p.closePath(); }, true);
    S(5, (p) => { p.moveTo(56, -420); p.lineTo(LAMP[0], -420); p.lineTo(LAMP[0], LAMP[1] - 22); }, true);   // the lantern's arm off the mast
    F((p) => { p.moveTo(-296, -100); p.bezierCurveTo(-284, -170, -290, -236, -306, -272); p.bezierCurveTo(-318, -296, -346, -306, -368, -296);
      p.bezierCurveTo(-388, -282, -396, -240, -392, -190); p.bezierCurveTo(-390, -150, -382, -120, -376, -100); p.closePath(); });   // half-risen at the stern
    F((p) => p.ellipse(-338, -322, 22, 26, -0.3, 0, Math.PI * 2));
    F((p) => { p.moveTo(-372, -284); p.bezierCurveTo(-410, -312, -446, -352, -474, -394); p.lineTo(-462, -406); p.bezierCurveTo(-436, -372, -398, -336, -350, -302); p.closePath(); });   // arm flung out toward Him
    F((p) => { p.moveTo(-104, -100); p.bezierCurveTo(-96, -150, -104, -196, -128, -222); p.bezierCurveTo(-146, -240, -176, -246, -198, -236);
      p.bezierCurveTo(-214, -228, -222, -212, -226, -198); p.lineTo(-254, -168); p.lineTo(-246, -156); p.bezierCurveTo(-230, -170, -216, -178, -204, -182);
      p.bezierCurveTo(-202, -150, -198, -124, -192, -100); p.closePath(); });                    // rower bent over his oar
    F((p) => p.ellipse(-218, -246, 19, 22, 0.5, 0, Math.PI * 2));
    F((p) => { p.moveTo(126, -100); p.bezierCurveTo(132, -150, 122, -200, 98, -226); p.bezierCurveTo(80, -242, 54, -246, 38, -234);
      p.bezierCurveTo(26, -224, 20, -208, 20, -192); p.lineTo(-8, -172); p.lineTo(-2, -160); p.bezierCurveTo(12, -170, 22, -174, 34, -176);
      p.bezierCurveTo(36, -146, 38, -122, 42, -100); p.closePath(); });                          // rower leaning into the stroke
    F((p) => p.ellipse(42, -258, 20, 23, 0.3, 0, Math.PI * 2));
    F((p) => { p.moveTo(302, -100); p.bezierCurveTo(308, -150, 298, -200, 272, -226); p.bezierCurveTo(258, -240, 246, -258, 236, -270);
      p.bezierCurveTo(220, -264, 204, -250, 196, -232); p.bezierCurveTo(184, -206, 186, -150, 196, -100); p.closePath(); });   // crouched in the bow, cloak over his head
    S(9, (p) => { p.moveTo(-250, -164); p.lineTo(-40, 50); });                                  // oars through the oarlocks into the water
    S(9, (p) => { p.moveTo(-4, -166); p.lineTo(206, 44); });
  }
  const boat = new THREE.Group();
  const boatCard = LW.billboard({ cw: BW, ch: BH, worldH: BH / BPX, footPx: BH - BOY, draw: (x) => {
    x.drawImage(silhouette(BW, BH, BOX, BOY, bParts, '#0A090B', [{ color: '#9FB3DA', dx: -3, dy: 5, alpha: 0.55 }]), 0, 0);
    x.save(); x.translate(BOX, BOY); x.strokeStyle = '#0A090B'; x.lineWidth = 5; x.strokeRect(LAMP[0] - 15, LAMP[1] - 21, 30, 42); x.restore();
  } });
  boatCard.material.alphaTest = 0.5; boatCard.userData.update('b'); boat.add(boatCard);
  const boatLit = LW.billboard({ cw: BW, ch: BH, worldH: BH / BPX, footPx: BH - BOY, draw: (x) => {
    x.drawImage(silhouette(BW, BH, BOX, BOY, bParts, null, [
      { color: '#FFA457', dx: -5, dy: 4, alpha: 0.75, mask: (x) => { const g = x.createRadialGradient(LAMP[0], LAMP[1], 30, LAMP[0], LAMP[1], 360); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; } },
    ], (o) => {
      const g = o.createRadialGradient(LAMP[0], LAMP[1], 10, LAMP[0], LAMP[1], 320); g.addColorStop(0, 'rgba(255,150,70,0.12)'); g.addColorStop(1, 'rgba(255,150,70,0)');
      o.fillStyle = g; o.fillRect(-550, -660, 1100, 800);
    }), 0, 0);
  } });
  boatLit.material.alphaTest = 0; boatLit.material.depthWrite = false; boatLit.renderOrder = 5; boatLit.position.z = 0.005; boatLit.userData.update('bl'); boat.add(boatLit);
  let lampMat, lampGlow, lampLight;
  {
    const lx = LAMP[0] / BPX, ly = -LAMP[1] / BPX;
    lampMat = new THREE.MeshBasicMaterial({ color: C('#FFB24C'), toneMapped: false });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.04), lampMat); lamp.position.set(lx, ly, 0.03); boat.add(lamp);
    lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#FFA94A'), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    lampGlow.scale.set(1.1, 1.1, 1); lampGlow.position.set(lx, ly, 0.08); boat.add(lampGlow);
    lampLight = new THREE.PointLight(C('#FF9E45'), 2.6, 6, 1.6); lampLight.position.set(lx, ly, 0.5); boat.add(lampLight);
  }
  boat.rotation.order = 'YXZ'; boat.position.set(...B); scene.add(boat);

  // ---------------- cameras ----------------
  const CAM_F = { p: [0.34, 1.38, 9.62], l: [0.2, 0.62, -6.0], fov: 46 };                 // final 9:16 frame
  const A = [B[0] + LAMP[0] / BPX, 1.5, B[2]];                                              // pull back from the lantern
  const CAM_S = { p: L3(CAM_F.p, A, 0.13), l: L3(CAM_F.l, A, 0.32), fov: 46 };             // 13% closer, aimed at the boat
  const CAM_SQ = {
    lockup: { p: [0.3, 1.5, 11.6], l: [0.23, 0.69, -6.0], fov: 34 },
    icon: { p: [JF[0] + 0.35, 1.45, JF[2] + 5.6], l: [JF[0] + 0.12, 0.85, JF[2]], fov: 33 },
    icon2: { p: [JF[0] + 1.3, 1.25, JF[2] + 7.0], l: [JF[0] + 0.72, 0.8, JF[2] - 3.0], fov: 36 },
  }[MODE];

  // ---------------- 2D finishing helpers ----------------
  const grainC = canvas(256, 256);
  { const gx = grainC.getContext('2d'), id = gx.createImageData(256, 256), rg = FW.rng(31); for (let i = 0; i < id.data.length; i += 4) { const v = rg() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); }
  const out = canvas(OW, OH), ox = out.getContext('2d');
  const b1 = canvas(Math.round(OW / 4), Math.round(OH / 4)), b2 = canvas(b1.width, b1.height);
  const S = OH / 1920;                                    // effects scale with the frame height
  const TS = MODE === 'lockup' ? OW / 1080 * 0.82 : S;   // type scale
  const spacedText = (x, txt, cx, y, track) => {
    const ws = [...txt].map((ch) => x.measureText(ch).width); const total = ws.reduce((a, b) => a + b, 0) + track * (txt.length - 1);
    let px = cx - total / 2; [...txt].forEach((ch, i) => { x.fillText(ch, px, y); px += ws[i] + track; }); return [cx - total / 2, cx + total / 2];
  };

  globalThis.frameAt = (t) => {
    if (SQUARE) t = 3.8;                                   // the finished, held state
    const K = sm(0.9, 2.0, t);                            // God's light breaking through, top left
    const IC = MODE === 'icon', NOISE = IC ? 0.35 : MODE === 'icon2' ? 0.6 : 1;
    const env = lerp(0.3, 1, sm(0.1, 1.6, t));            // the night comes up from almost dark
    const vis = sm(0.8, 1.25, t);                         // He emerges from the darkness
    const lampK = lerp(0.12, 1, sm(0.05, 0.8, t));        // the lantern: ember to warm glow
    // the walk: a small distance toward the boat, one step, settling in the stride
    const wk = walkK(t);
    J[0] = lerp(JS[0], JF[0], wk); J[2] = lerp(JS[2], JF[2], wk);
    const s = SQUARE ? 0.71 : Math.sin(-1.75 * Math.PI + wk * 2 * Math.PI);   // two steps, ending mid-stride
    // camera: one pull-back from the lantern, 0.5-2.5 s, cubic in-out; then locked
    let CP, CL, FOV;
    if (SQUARE) { CP = CAM_SQ.p; CL = CAM_SQ.l; FOV = CAM_SQ.fov; }
    else { const c = cubic((t - 0.5) / 2.0); CP = L3(CAM_S.p, CAM_F.p, c); CL = L3(CAM_S.l, CAM_F.l, c); FOV = 46; }
    FW.setCam(cam, CP, CL, FOV); cam.updateMatrixWorld();
    SEA.update(t);
    // light
    skyCard.material.color.setScalar(lerp(0.55, 1, env)); goldCard.material.opacity = K;
    hemi.intensity = 0.42 * env; moon.intensity = 0.3 * env;
    spot.intensity = 38 * K * (IC ? 1.6 : 1);
    shaft.material.uniforms.amt.value = 0.085 * K; shaft.material.uniforms.time.value = t;
    const walking = SQUARE ? 0 : sm(1.0, 1.25, t) * (1 - sm(2.0, 2.2, t));
    const jy = waveH(J[0], J[2], t) * 0.6 + 0.02 + 0.02 * (1 - Math.abs(s)) * walking;   // a slight rise at mid-stance
    jLight.position.set(J[0] - 0.25, 1.2, J[2] - 0.35); jLight.intensity = 3.0 * K;
    halo.position.set(J[0] - 0.15, IC ? 0.95 : 1.15, J[2] - 0.6); halo.material.opacity = 0.34 * K * (IC ? 1.7 : 1); halo.scale.set(IC ? 3.4 : 2.4, IC ? 4.6 : 3.2, 1);
    pool.position.set(J[0], jy + 0.1, J[2] + 0.15); pool.material.opacity = IC ? 0.85 : 0.22 * K * vis; pool.scale.set(IC ? 6.0 : 3.0, IC ? 2.6 : 1.6, 1);
    rings.forEach((m, k) => { const ph = IC ? [0.28, 0.62][k] : (t * 0.3 + m.userData.ph) % 1; const sc = lerp(0.6, 2.3, ph); m.scale.set(sc, sc, 1); m.position.set(J[0], jy + 0.07, J[2] + 0.05);
      m.material.opacity = IC ? [0.9, 0.55][k] : 0.26 * K * vis * Math.sin(Math.PI * ph); });
    const dx = CP[0] - J[0], dz = CP[2] - J[2], dl = Math.hypot(dx, dz);
    glints.userData.update((i, v) => { const g = G[i]; const u = g.u * 0.62; const px = J[0] + dx * u - dz / dl * g.o, pz = J[2] + dz * u + dx / dl * g.o;
      v.set(px, 0.14 + waveH(px, pz, t), pz); const tw = 0.5 + 0.5 * Math.sin(t * 4 + g.ph); return { alpha: Math.min(1, K * vis * 0.7 * (IC ? 1.5 : 1)) * (1 - g.u) * (0.25 + 0.75 * tw), size: g.s * (1 + u * 1.4) }; });
    dust.userData.update((i, v) => { const d = DU[i]; const x = JF[0] + ((d.x - t * d.sp + 50) % 2.4) - 1.3, y = d.y + 0.08 * Math.sin(t * 0.9 + d.ph), z = JF[2] + d.z;
      v.set(x, y, z); const inBeam = Math.exp(-((x - JF[0] + (y - 1.2) * 0.38) ** 2) / 0.7); return { alpha: 0.7 * K * inBeam * (0.5 + 0.5 * Math.sin(t * 2.3 + d.ph)), size: d.s }; });
    spray.userData.update((i, v) => { const sp = SP[i]; const ph = (t * sp.sp * 0.55 + sp.ph) % 1; const x = sp.x - ph * 2.4, z = sp.z;
      const h = waveH(x, z, t); if (h < 0.18) return { alpha: 0 }; v.set(x, h + 0.08 + ph * 0.5, z); return { alpha: 0.45 * env * NOISE * Math.sin(Math.PI * ph) * clamp((h - 0.18) * 3, 0, 1), size: sp.s }; });
    { const ax = MOON_DIR[0] / -MOON_DIR[2];
      moonGlints.userData.update((i, v) => { const g = MG[i], x = cam.position.x + ax * g.d + g.o, z = cam.position.z - g.d; v.set(x, waveH(x, z, t) + 0.05, z);
        const tw = Math.pow(0.5 + 0.5 * Math.sin(t * g.f + g.ph), 3); return { alpha: 0.85 * env * NOISE * tw * (1 - Math.abs(g.o) / (lerp(1.2, 7.5, (g.d - 15) / 81) + 0.01) * 0.6), size: g.s * g.d / 13 }; });
      moonPath.position.set(cam.position.x + ax * 52, 0.45, cam.position.z - 52); moonPath.scale.set(9, 80, 1); moonPath.material.opacity = 0.16 * env; }
    mists.forEach((m) => { m.position.x = m.userData.x0 - t * (0.35 + 0.1 * m.userData.i); m.material.opacity = m.userData.a * env; m.lookAt(cam.position.x, m.position.y, cam.position.z); });
    // the boat rides the swell
    const by = waveH(B[0], B[2], t), bdx = (waveH(B[0] + 1.0, B[2], t) - waveH(B[0] - 1.0, B[2], t)) / 2.0, bdz = (waveH(B[0], B[2] + 0.5, t) - waveH(B[0], B[2] - 0.5, t)) / 1.0;
    boat.position.y = by - 0.05; boat.visible = !IC;
    boat.rotation.set(-Math.atan(bdz) * 0.5, Math.atan2(cam.position.x - B[0], cam.position.z - B[2]), Math.atan(bdx) * 0.8 + 0.03 * Math.sin(t * 2.1));
    const fl = (0.86 + 0.08 * Math.sin(t * 13.1) + 0.06 * Math.sin(t * 7.3 + 1.2)) * lampK;
    lampMat.color.setRGB(2.4 * fl, 1.5 * fl * (0.75 + 0.25 * lampK), 0.62 * fl * lampK);   // an ember is redder
    lampGlow.material.opacity = 0.75 * fl; lampGlow.scale.setScalar(lerp(0.6, 1.1, lampK)); lampLight.intensity = 2.6 * fl; boatLit.material.opacity = clamp(fl, 0, 1);
    // Jesus
    const key = Math.round(s * 24);
    jesus.userData.update('j' + key, s); jesusLit.userData.update('l' + key, s); jesusCool.userData.update('c' + key, s);
    jesus.position.set(J[0], jy, J[2]); jesus.userData.face(cam); jesus.rotation.z = -0.03 - 0.018 * walking * Math.abs(s);   // leans a touch more into each stride
    jesus.material.opacity = vis; jesus.visible = vis > 0.003;
    refl.position.set(J[0], jy + 0.04, J[2]); refl.rotation.copy(jesus.rotation); refl.rotation.z = -jesus.rotation.z; refl.scale.set(1, -0.75, 1);
    refl.material.opacity = (IC ? 0.75 : 0.45) * vis * K; refl.visible = refl.material.opacity > 0.003;
    const cool = sm(1.15, 1.7, t); jesusCool.position.copy(jesus.position); jesusCool.rotation.copy(jesus.rotation); jesusCool.translateZ(0.005); jesusCool.material.opacity = cool; jesusCool.visible = cool > 0.003;
    jesusLit.position.copy(jesus.position); jesusLit.rotation.copy(jesus.rotation); jesusLit.translateZ(0.01); jesusLit.material.opacity = K * vis; jesusLit.visible = K * vis > 0.003;

    const gl = LW.render(scene, cam, { focus: dl, aperture: SQUARE ? 0.8 : 1.1, maxR: 3.5, fgScale: 0.8, exposure: 1.16, sat: 0.98, lift: [0.008, 0.012, 0.03] });

    // ---- 2D finishing: god rays from the top left, bloom, vignette, grain ----
    ox.globalAlpha = 1; ox.globalCompositeOperation = 'source-over'; ox.filter = 'none';
    ox.drawImage(gl, 0, 0);
    const P = (p) => LW.project(cam, p);
    {
      const tgt = P([JF[0], 1.1, JF[2]]), sx = OW * -0.18, sy = OH * -0.12, ang0 = Math.atan2(tgt[1] - sy, tgt[0] - sx), len = Math.hypot(tgt[0] - sx, tgt[1] - sy) * 1.08;
      ox.save(); ox.globalCompositeOperation = 'lighter';
      for (const [da, wd, a] of [[-0.08, 20, 0.5], [-0.045, 42, 0.8], [-0.015, 16, 0.55], [0.012, 60, 1], [0.04, 24, 0.55], [0.075, 34, 0.6]]) {
        const ang = ang0 + da, w = wd / 1000;
        const g = ox.createLinearGradient(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
        g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.35, `rgba(255,210,130,${0.022 * a * K})`); g.addColorStop(0.8, `rgba(255,200,110,${0.038 * a * K})`); g.addColorStop(1, 'rgba(255,200,110,0)');
        ox.fillStyle = g; ox.beginPath(); ox.moveTo(sx, sy); ox.lineTo(sx + Math.cos(ang - w) * len, sy + Math.sin(ang - w) * len); ox.lineTo(sx + Math.cos(ang + w) * len, sy + Math.sin(ang + w) * len); ox.closePath(); ox.fill();
      }
      ox.restore();
      const a1 = b1.getContext('2d'), a2 = b2.getContext('2d');
      a1.clearRect(0, 0, b1.width, b1.height); a2.clearRect(0, 0, b2.width, b2.height);
      a1.filter = 'brightness(0.7) contrast(3.4) saturate(1.15)'; a1.drawImage(out, 0, 0, b1.width, b1.height); a1.filter = 'none';
      a2.filter = `blur(${Math.round(10 * S)}px)`; a2.drawImage(b1, 0, 0); a2.filter = `blur(${Math.round(3 * S)}px)`; a2.globalAlpha = 0.6; a2.drawImage(b1, 0, 0); a2.globalAlpha = 1; a2.filter = 'none';
      ox.save(); ox.globalCompositeOperation = 'lighter'; ox.globalAlpha = 0.24; ox.drawImage(b2, 0, 0, OW, OH); ox.restore();
      { const fg = ox.createLinearGradient(0, OH * 0.68, 0, OH); fg.addColorStop(0, 'rgba(4,6,11,0)'); fg.addColorStop(1, 'rgba(4,6,11,0.7)'); ox.fillStyle = fg; ox.fillRect(0, OH * 0.68, OW, OH * 0.32); }
      const vg = ox.createRadialGradient(OW * 0.45, OH * 0.42, Math.min(OW, OH) * 0.3, OW * 0.5, OH * 0.5, Math.max(OW, OH) * 0.62);
      vg.addColorStop(0, 'rgba(3,4,8,0)'); vg.addColorStop(1, 'rgba(3,4,8,0.6)'); ox.fillStyle = vg; ox.fillRect(0, 0, OW, OH);
      ox.save(); ox.globalAlpha = 0.04; ox.globalCompositeOperation = 'overlay'; ox.translate(Math.floor(t * 30) * 37 % 256, Math.floor(t * 30) * 91 % 256);
      ox.fillStyle = ox.createPattern(grainC, 'repeat'); ox.fillRect(-256, -256, OW + 512, OH + 512); ox.restore();
    }
    // ---- the wordmark (the only text) ----
    let textBox = null;
    if (MODE === '' || MODE === 'lockup') {
      const kn = sm(2.2, 2.9, t), kr = sm(2.45, 3.0, t), WY = MODE === 'lockup' ? OH * 0.835 : OH * 0.70, wb = sm(2.0, 2.9, t);
      if (wb > 0) { const y0 = WY - 150 * TS, g = ox.createLinearGradient(0, y0, 0, WY + 120 * TS); g.addColorStop(0, 'rgba(6,7,12,0)'); g.addColorStop(0.5, `rgba(6,7,12,${0.55 * wb})`); g.addColorStop(1, `rgba(6,7,12,${0.7 * wb})`); ox.fillStyle = g; ox.fillRect(0, y0, OW, OH - y0); }
      if (kn > 0) {
        ox.save(); ox.textAlign = 'left'; ox.textBaseline = 'alphabetic'; ox.shadowColor = 'rgba(0,0,0,0.6)'; ox.shadowBlur = 22 * TS;
        ox.globalAlpha = kn; ox.fillStyle = '#F2E6CF'; ox.font = `700 ${Math.round(72 * TS)}px "Cinzel"`;
        const [x0, x1] = spacedText(ox, 'FOURTH WATCH', OW / 2, WY + (1 - kn) * 18 * TS, 11 * TS);
        textBox = { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(WY - 56 * TS), y1: Math.round(WY + 46 * TS) };
        ox.shadowBlur = 0; ox.globalAlpha = kr * 0.9; ox.strokeStyle = 'rgba(227,178,92,1)'; ox.lineWidth = 2 * TS;
        ox.beginPath(); ox.moveTo(OW / 2 - 70 * TS * kr, WY + 44 * TS); ox.lineTo(OW / 2 + 70 * TS * kr, WY + 44 * TS); ox.stroke();
        ox.restore();
      }
    }
    const nrm = (p) => P(p).map((v, i) => i < 2 ? +(v / (i ? OH : OW)).toFixed(3) : 0);
    globalThis.__proj = { jesus: nrm([J[0], 1.1, J[2]]), feet: nrm([J[0], 0, J[2]]), lamp: nrm([A[0], 1.5, A[2]]), boat: nrm([B[0], 0.6, B[2]]), text: textBox, s: +s.toFixed(2) };
    return out;
  };
  globalThis.__ready = true;
})().catch((e) => { console.error(e); globalThis.__err = String(e && e.stack || e); globalThis.__ready = true; });
