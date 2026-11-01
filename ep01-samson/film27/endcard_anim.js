// FOURTH WATCH end-card animation (Matthew 14:25, ESV): "And in the fourth watch of the night he came to them, walking on the sea."
// A cinematic night storm: a rough sea, the disciples' boat beaten by the waves with one lantern, and Jesus as a robed
// silhouette walking on the water, rim-lit by gold light breaking from the upper left. Then the verse, then the wordmark.
// Built once; window.frameAt(t) renders one deterministic frame (a pure function of t).
(async function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, LW = globalThis.LW;
  const q = new URLSearchParams(location.search);
  const SQUARE = q.get('mode') === 'square';
  const OW = +(q.get('w') || 1080), OH = +(q.get('h') || (SQUARE ? 1080 : 1920));
  const C = (c) => new THREE.Color(c);
  const { clamp, lerp } = FW;
  const sm = (a, b, x) => FW.smooth((x - a) / (b - a));
  const DUR = 6.0;
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  for (const [fam, file, w, st] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700', 'normal'], ['Inter', 'fonts/inter-latin-600-normal.woff2', '600', 'normal'],
    ['Corm', 'fonts/cormorant-garamond-latin-500-italic.woff2', '500', 'italic']]) {
    const f = new FontFace(fam, `url(${file})`, { weight: w, style: st }); document.fonts.add(f); await f.load();
  }

  LW.init(OW, OH);
  const cam = new THREE.PerspectiveCamera(42, OW / OH, 0.2, 500);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C('#1C2436'), 20, 112);

  // ---------------- layout (metres; the camera looks down -z) ----------------
  const J = [-0.5, 0, 0.6];          // where He walks on the water
  const B = [2.7, 0, -9.6];           // the boat
  const LIGHT_FROM = [J[0] - 6.0, 15, J[2] - 4.5];
  const MOON_DIR = [3.5, 3.2, -40];   // low, behind the boat, hidden in cloud: lays a cool glitter path behind the boat

  // A lit silhouette: parts (Path2D fills, or {path, w} strokes) filled dark, then thin rims where each light catches the edge.
  // A rim is the shape minus a copy of itself pushed away from the light, so it follows the outline exactly.
  // body null: rims and wash only (a light layer that can fade in on its own). Parts marked {norim} get no rim.
  const silhouette = (w, h, ox0, oy0, parts, body, rims, after) => {
    const mk = () => { const c = canvas(w, h), x = c.getContext('2d'); x.translate(ox0, oy0); return [c, x]; };
    const paint = (x, col, dx = 0, dy = 0, rimOnly = false) => { x.save(); x.translate(dx, dy); x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
      for (const p of parts) { if (rimOnly && p.norim) continue; const path = p instanceof Path2D ? p : p.path; if (p.w) { x.lineWidth = p.w; x.stroke(path); } else x.fill(path); } x.restore(); };
    const [c, x] = mk(); if (body) paint(x, body);
    const blit = (src, a = 1) => { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = a; x.drawImage(src, 0, 0); x.restore(); };
    if (after) { const [tc, tx] = mk(); paint(tx, '#fff'); tx.globalCompositeOperation = 'source-in'; after(tx); blit(tc); }
    for (const r of rims) {
      const [rc, rx] = mk(); paint(rx, r.color, 0, 0, true); rx.globalCompositeOperation = 'destination-out'; paint(rx, '#000', r.dx, r.dy);
      if (r.mask) { rx.globalCompositeOperation = 'destination-in'; rx.fillStyle = r.mask(rx); rx.fillRect(-ox0, -oy0, w, h); }
      blit(rc, r.alpha == null ? 1 : r.alpha);
    }
    if (body) { const nr = parts.filter((p) => p.norim); if (nr.length) { x.save(); x.fillStyle = x.strokeStyle = body; x.lineCap = 'round';
      for (const p of nr) { const path = p instanceof Path2D ? p : p.path; if (p.w) { x.lineWidth = p.w; x.stroke(path); } else x.fill(path); } x.restore(); } }
    return c;
  };

  // ---------------- sky: a storm deck with a break at the upper left (gold) and the moon hidden low behind the boat (cool) ----------------
  scene.add(LW.sky({ top: '#04060C', mid: '#0B1120', hor: '#26324A', low: '#0B1018', sunDir: [-0.55, 0.42, -1], sunCol: '#8A7458', sunAmt: 0.0 }));
  const goldCard = (() => {
    const CW = 1500, CH = 700;                // the card spans x -75..75, y -6..64 at z -150: it frames the whole visible sky
    const GU = 0.2, GV = 0.06;                // the break (just past the top-left corner of the frame)
    const MU = 0.5 + (MOON_DIR[0] / -MOON_DIR[2] * 160) / 150, MV = (64 - (1.4 + MOON_DIR[1] / -MOON_DIR[2] * 160)) / 70;
    const D = new Float32Array(CW * CH);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const u = i / CW, v = j / CH, X = u * 4.2, Y = v * 1.96;
      const wx = FW.fbm(X * 0.6 + 3.1, Y * 0.6 + 1.2, 5, 3) - 0.5, wy = FW.fbm(X * 0.6 + 8.3, Y * 0.6 + 6.6, 6, 3) - 0.5;
      let n = FW.fbm(X * 1.15 + wx * 0.7, (Y + wy * 0.35) * 2.6, 7, 5);
      n += 0.07 * sm(0.25, 0.9, v);                                                           // the bank thickens toward the horizon
      n -= 0.34 * Math.exp(-(((u - GU) / 0.15) ** 2 + ((v - GV) / 0.3) ** 2));                 // the break
      D[j * CW + i] = n;
    }
    const at = (i, j) => D[clamp(Math.round(j), 0, CH - 1) * CW + clamp(Math.round(i), 0, CW - 1)];
    const base = new ImageData(CW, CH), gold = new ImageData(CW, CH), bd = base.data, gd = gold.data, cover = new Float32Array(CW * CH);
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const u = i / CW, v = j / CH, n = D[j * CW + i], k = (j * CW + i) * 4;
      const cv = sm(0.42, 0.64, n), thick = sm(0.5, 0.78, n); cover[j * CW + i] = cv;
      const hs = Math.pow(sm(0.25, 0.97, v), 1.4);
      let r = lerp(5, 36, hs), g = lerp(7, 46, hs), b = lerp(13, 68, hs);
      const mg = Math.exp(-(((u - MU) / 0.09) ** 2 + ((v - MV) / 0.15) ** 2)) * (1 - cv * 0.75);   // the moon's glow through thin cloud
      r += 60 * mg; g += 72 * mg; b += 96 * mg;
      r = lerp(r, lerp(22, 8, thick), cv); g = lerp(g, lerp(27, 11, thick), cv); b = lerp(b, lerp(40, 19, thick), cv);
      let dx = (MU - u) * CW, dy = (MV - v) * CH, dl = Math.hypot(dx, dy) || 1;
      const em = clamp((n - at(i + dx / dl * 13, j + dy / dl * 13)) * 9, 0, 1) * cv;            // edges facing the moon
      const wm = 0.12 + 0.88 * Math.exp(-(((u - MU) / 0.16) ** 2 + ((v - MV) / 0.26) ** 2));
      r += 62 * em * wm; g += 74 * em * wm; b += 100 * em * wm;
      const et = clamp((n - at(i, j - 10)) * 8, 0, 1) * cv;                                      // a faint cool top light on every billow
      r += 16 * et; g += 20 * et; b += 30 * et;
      bd[k] = r; bd[k + 1] = g; bd[k + 2] = b; bd[k + 3] = 255;
      dx = (GU - u) * CW; dy = (GV - v) * CH; dl = Math.hypot(dx, dy) || 1;
      const eg = clamp((n - at(i + dx / dl * 13, j + dy / dl * 13)) * 9, 0, 1) * cv;            // edges facing the break, lit gold
      const wg = Math.exp(-(((u - GU) / 0.2) ** 2 + ((v - GV) / 0.36) ** 2));
      const gg = Math.exp(-(((u - GU) / 0.1) ** 2 + ((v - GV) / 0.2) ** 2)) * (1 - cv * 0.8);
      gd[k] = 235 * eg * wg + 240 * gg; gd[k + 1] = 168 * eg * wg + 192 * gg; gd[k + 2] = 98 * eg * wg + 128 * gg; gd[k + 3] = 255;
    }
    const mkCard = (img, additive, z, stars) => {
      const c = canvas(CW, CH), x = c.getContext('2d'); x.putImageData(img, 0, 0);
      if (stars) {   // faint stars only where the deck is thin
        const r = FW.rng(1425);
        for (let s = 0; s < 900; s++) { const i = r() * CW, j = r() * CH * 0.8, cv = cover[Math.floor(j) * CW + Math.floor(i)], a = (1 - cv / 0.25) * lerp(0.25, 0.85, r()), rad = lerp(0.7, 1.5, r());
          if (cv > 0.25 || a <= 0 || r() > 1.6 * Math.exp(-(((i / CW - GU) / 0.2) ** 2 + ((j / CH - GV) / 0.4) ** 2))) continue; x.fillStyle = `rgba(220,228,255,${a.toFixed(3)})`; x.beginPath(); x.arc(i, j, rad, 0, Math.PI * 2); x.fill(); }
      }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 70), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: additive ? 0 : 1, depthWrite: false, fog: false, toneMapped: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
      m.position.set(0, 29, z); m.renderOrder = additive ? -4 : -5; scene.add(m); return m;
    };
    mkCard(base, false, -150, true);
    return mkCard(gold, true, -149.5, false);
  })();

  // ---------------- the sea: wind-driven swell (the wind is against them: waves run right to left) ----------------
  const waveH = (x, z, t) => {
    const far = clamp(1 - (-z - 8) / 60, 0.22, 1);
    let h = 0.38 * Math.sin(0.62 * x + 0.22 * z + 1.55 * t) + 0.2 * Math.sin(1.18 * x - 0.55 * z + 2.25 * t + 1.1)
      + 0.1 * Math.sin(2.6 * x + 1.4 * z + 3.4 * t + 2.3) + 0.32 * (FW.fbm(x * 0.33 + t * 0.21, z * 0.33 - t * 0.05, 5, 3) - 0.5);
    h *= far;
    // calm only right under His feet so He stands ON the water, not in it
    const dj = Math.hypot(x - J[0], z - J[2]); h *= 0.55 + 0.45 * sm(0.15, 0.85, dj);
    return h;
  };
  // fine wind chop as a tiling normal map (integer wave vectors so it tiles), mostly running along x
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
    const mesh = new THREE.Mesh(g, mat); scene.add(mesh);
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
  scene.add(new THREE.HemisphereLight(C('#26344F'), C('#05070C'), 0.42));
  const moon = new THREE.DirectionalLight(C('#A9BEE3'), 0.3); moon.position.set(...MOON_DIR); scene.add(moon);
  const spot = new THREE.SpotLight(C('#FFC97E'), 0, 50, 0.17, 0.8, 1.2);
  spot.position.set(...LIGHT_FROM); spot.target.position.set(J[0] + 0.4, 0, J[2] + 0.6); scene.add(spot); scene.add(spot.target);
  const jLight = new THREE.PointLight(C('#FFC46E'), 0, 4.2, 1.5); jLight.position.set(J[0] - 0.25, 1.2, J[2] - 0.35); scene.add(jLight);

  const radial = (stops) => { const c = canvas(256, 256), x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([o, a]) => g.addColorStop(o, `rgba(255,255,255,${a})`)); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c); };
  const glowTex = radial([[0, 1], [0.25, 0.55], [0.6, 0.14], [1, 0]]);
  const add = (color, opacity, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: C(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }, o));

  const shaft = LW.shaft(LIGHT_FROM, [J[0] + 0.1, 0.1, J[2] + 0.2], 0.25, 1.35, '#FFD089'); scene.add(shaft);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#FFC36A'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  halo.scale.set(2.4, 3.2, 1); halo.position.set(J[0] - 0.15, 1.15, J[2] - 0.6); halo.renderOrder = 2; scene.add(halo);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#FFC46E', 0, { map: glowTex, depthTest: false }));
  pool.rotation.x = -Math.PI / 2; pool.scale.set(3.0, 1.6, 1); pool.position.set(J[0], 0.12, J[2] + 0.15); pool.renderOrder = 3; scene.add(pool);
  // glints: a broken path of light on the water from His feet toward the viewer
  const G = []; { const rg = FW.rng(314); for (let i = 0; i < 200; i++) { const u = Math.pow(rg(), 1.25), spread = lerp(0.12, 0.8, u); G.push({ u, o: (rg() - 0.5) * 2 * spread, ph: rg() * 6.28, s: lerp(0.6, 1.3, rg()) }); } }
  const glints = LW.particles(G.length, '#FFC877', 0.04); glints.material.uniforms.scale.value = 900 * (OH / 1920); scene.add(glints);
  // the moon's glitter path behind the boat, narrowing to the horizon
  const MG = []; { const r = FW.rng(4242); for (let i = 0; i < 900; i++) { const d = lerp(15, 96, Math.pow(r(), 0.8)); MG.push({ d, o: (r() - 0.5) * 2 * lerp(1.2, 7.5, (d - 15) / 81) * (0.3 + 0.7 * r()), ph: r() * 6.28, s: lerp(0.5, 1.2, r()), f: lerp(2.5, 7, r()) }); } }
  const moonGlints = LW.particles(MG.length, '#D2DCF2', 0.035); moonGlints.material.uniforms.scale.value = 900 * (OH / 1920); scene.add(moonGlints);
  const moonPath = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#9FB2DA', 0.16, { map: glowTex })); moonPath.rotation.x = -Math.PI / 2; moonPath.renderOrder = 1; scene.add(moonPath);
  // broken ripples spreading from His steps
  const ringTex = (() => { const c = canvas(256, 256), x = c.getContext('2d'); x.lineCap = 'round';
    for (let k = 0; k < 96; k++) { const a0 = k / 96 * Math.PI * 2, a = clamp((FW.noise2(k * 0.35, 0.5, 3) - 0.38) * 2.2, 0, 1); x.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`; x.lineWidth = 3; x.beginPath(); x.arc(128, 128, 116, a0, a0 + Math.PI * 2 / 96 * 0.8); x.stroke(); }
    return new THREE.CanvasTexture(c); })();
  const rings = [0, 0.5].map((ph) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), add('#FFDDAA', 0, { map: ringTex })); m.rotation.x = -Math.PI / 2; m.userData.ph = ph; m.renderOrder = 4; scene.add(m); return m; });
  // wind-blown spray and drifting mist
  const SP = []; { const r = FW.rng(808); for (let i = 0; i < 420; i++) SP.push({ x: lerp(-9, 9, r()), z: lerp(-14, 4, r()), ph: r() * 10, sp: lerp(0.8, 1.8, r()), s: lerp(0.5, 1.4, r()) }); }
  const spray = LW.particles(SP.length, '#A9B9D4', 0.035); spray.material.uniforms.scale.value = 900 * (OH / 1920); scene.add(spray);
  const mistTex = (() => { const c = canvas(512, 128), x = c.getContext('2d'), id = x.createImageData(512, 128);
    for (let j = 0; j < 128; j++) for (let i = 0; i < 512; i++) { const n = FW.fbm(i / 90, j / 40, 61, 4), e = Math.sin(Math.PI * j / 128) * Math.sin(Math.PI * i / 512); const k = (j * 512 + i) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = 255; id.data[k + 3] = 255 * clamp((n - 0.35) * 2.2, 0, 1) * e; }
    x.putImageData(id, 0, 0); return new THREE.CanvasTexture(c); })();
  const mists = [[-4, 0.5, -6, 14, 0.07], [3, 0.7, -9, 16, 0.07], [-1, 0.35, -2.5, 11, 0.045], [6, 0.9, -15, 20, 0.07]].map(([x0, y, z, w, a], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.22), new THREE.MeshBasicMaterial({ map: mistTex, color: C('#8C9DBA'), transparent: true, opacity: a, depthWrite: false, fog: false, toneMapped: false }));
    m.position.set(x0, y, z); m.userData = { x0, i }; scene.add(m); return m;
  });

  // ---------------- Jesus: a robed man about 7.5 heads tall, head in profile toward the boat, the near hand reaching out to them,
  // the mantle and hem blown back by the wind; gold rim from the upper left, a faint cool rim from the moon on the right ----------------
  const JW = 900, JH = 1240, JOX = 430, JOY = 1194;
  const jParts = []; const J2 = (f) => { const p = new Path2D(); f(p); jParts.push(p); };
  J2((p) => {   // head in profile (brow, nose, beard), hair to the shoulders, lifted a little by the wind
    p.moveTo(-6, -1112); p.bezierCurveTo(22, -1114, 44, -1096, 50, -1070); p.bezierCurveTo(53, -1058, 54, -1050, 56, -1042);
    p.lineTo(68, -1020); p.bezierCurveTo(66, -1014, 60, -1012, 56, -1012); p.bezierCurveTo(60, -1004, 60, -998, 58, -992);
    p.bezierCurveTo(60, -978, 56, -962, 46, -950); p.bezierCurveTo(38, -942, 28, -940, 20, -940); p.bezierCurveTo(18, -930, 22, -918, 30, -910);
    p.lineTo(-50, -904); p.bezierCurveTo(-64, -910, -78, -914, -90, -924); p.bezierCurveTo(-80, -950, -76, -990, -70, -1030);
    p.bezierCurveTo(-64, -1080, -40, -1110, -6, -1112); p.closePath(); });
  J2((p) => {   // robe: shoulders in three-quarter, belted, the near leg striding forward under it, the hem trailing back in the wind
    p.moveTo(30, -912); p.bezierCurveTo(56, -906, 82, -896, 96, -876); p.bezierCurveTo(108, -858, 110, -830, 106, -800);
    p.bezierCurveTo(100, -740, 92, -690, 88, -650); p.bezierCurveTo(86, -630, 90, -610, 96, -590);
    p.bezierCurveTo(112, -500, 132, -400, 146, -320); p.bezierCurveTo(152, -280, 150, -220, 142, -150);
    p.bezierCurveTo(138, -100, 146, -40, 160, -20); p.lineTo(194, -10); p.lineTo(198, 0); p.lineTo(60, 2);
    p.bezierCurveTo(-10, 0, -90, -16, -170, -50); p.bezierCurveTo(-204, -64, -238, -84, -266, -112);
    p.bezierCurveTo(-236, -118, -210, -132, -194, -150); p.bezierCurveTo(-170, -300, -142, -470, -124, -600);
    p.bezierCurveTo(-116, -660, -118, -740, -118, -800); p.bezierCurveTo(-118, -850, -100, -890, -70, -904);
    p.bezierCurveTo(-40, -914, 0, -916, 30, -912); p.closePath(); });
  J2((p) => {   // the far arm open to the side, its sleeve blown back, the hand open ("Take heart; it is I.")
    p.moveTo(-60, -904); p.bezierCurveTo(-118, -896, -166, -866, -208, -830); p.bezierCurveTo(-244, -798, -280, -780, -318, -770);
    p.bezierCurveTo(-332, -767, -346, -768, -358, -772); p.bezierCurveTo(-372, -776, -386, -774, -396, -766);
    p.bezierCurveTo(-390, -759, -378, -758, -368, -758); p.bezierCurveTo(-358, -756, -350, -752, -344, -745);
    p.bezierCurveTo(-346, -736, -338, -732, -330, -737); p.bezierCurveTo(-324, -746, -316, -751, -308, -754);
    p.bezierCurveTo(-296, -740, -282, -722, -268, -706); p.bezierCurveTo(-258, -702, -246, -704, -236, -712);
    p.bezierCurveTo(-218, -742, -186, -772, -156, -788); p.bezierCurveTo(-142, -796, -126, -796, -100, -790); p.lineTo(-96, -870); p.closePath(); });   // runs into the body: no notch at the armpit
  J2((p) => {   // the near arm reaching out to them, the wide sleeve hanging from the forearm, the hand open
    p.moveTo(70, -892); p.bezierCurveTo(130, -878, 180, -840, 222, -800); p.bezierCurveTo(262, -770, 300, -756, 344, -750);
    p.bezierCurveTo(360, -749, 376, -752, 390, -754); p.bezierCurveTo(404, -756, 420, -752, 430, -745);
    p.bezierCurveTo(424, -739, 412, -738, 402, -738); p.bezierCurveTo(392, -736, 384, -733, 378, -726);
    p.bezierCurveTo(380, -717, 372, -712, 364, -717); p.bezierCurveTo(358, -726, 350, -732, 340, -735);
    p.bezierCurveTo(328, -722, 314, -704, 300, -688); p.bezierCurveTo(290, -684, 278, -686, 268, -694);
    p.bezierCurveTo(248, -726, 214, -756, 180, -774); p.bezierCurveTo(150, -790, 118, -800, 96, -800); p.closePath(); });
  const rimFade = (x) => { const g = x.createLinearGradient(0, -1110, 0, 0); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0.3)'); return g; };
  // the dark figure (only a cool moon rim: at first they think it is a ghost), then His light as a separate layer that fades in
  const jesus = LW.billboard({ cw: JW, ch: JH, worldH: 2.1, footPx: 46, draw: (x) => {
    x.drawImage(silhouette(JW, JH, JOX, JOY, jParts, '#0E0B0E', [{ color: '#9DB0D6', dx: -6, dy: 3, alpha: 0.42 }]), 0, 0);
  } });
  const jesusLit = LW.billboard({ cw: JW, ch: JH, worldH: 2.1, footPx: 46, draw: (x) => {
    x.drawImage(silhouette(JW, JH, JOX, JOY, jParts, null, [
      { color: '#FFC27A', dx: 16, dy: 12, alpha: 0.22, mask: (x) => rimFade(x) },   // soft spill inside the gold edge
      { color: '#FFD597', dx: 6, dy: 5, alpha: 1, mask: (x) => rimFade(x) },        // the gold rim, upper left, strongest on head and shoulders
    ], (o) => {
      const warm = o.createLinearGradient(-340, -1100, 160, -200); warm.addColorStop(0, 'rgba(96,62,36,0.55)'); warm.addColorStop(0.5, 'rgba(30,22,22,0.18)'); warm.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = warm; o.fillRect(-430, -1194, 900, 1240);
      o.strokeStyle = 'rgba(255,200,130,0.07)'; o.lineWidth = 5; o.lineCap = 'round';   // a few long folds
      for (const [x0, y0, x1, y1] of [[-60, -620, -150, -80], [20, -600, 60, -60], [-20, -880, -40, -680]]) { o.beginPath(); o.moveTo(x0, y0); o.quadraticCurveTo((x0 + x1) / 2 - 10, (y0 + y1) / 2, x1, y1); o.stroke(); }
    }), 0, 0);
  } });
  jesusLit.userData.update('jl'); jesusLit.material.alphaTest = 0; jesusLit.material.depthWrite = false; jesusLit.renderOrder = 6; scene.add(jesusLit);
  jesus.position.set(J[0], 0.02, J[2]); jesus.userData.update('j'); jesus.material.alphaTest = 0.5; scene.add(jesus);

  // ---------------- the boat: a fishing boat seen side-on, bow to the right into the wind, a bare mast with the sail furled,
  // four disciples straining at the oars and one half-risen crying out toward the figure on the water; one lantern ----------------
  const BW = 1100, BH = 800, BOX = 550, BOY = 660, BPX = 262;   // canvas px per metre: the hull is about 3.6 m
  const LAMP = [470, -330];
  const bParts = [];
  { const F = (f, norim) => { const p = new Path2D(); f(p); bParts.push(norim ? { path: p, norim } : p); }, S = (w, f, norim) => { const p = new Path2D(); f(p); bParts.push({ path: p, w, norim }); };
    F((p) => {   // hull: high stern post at the left, rising bow at the right, low sheer midships
      p.moveTo(-470, -200); p.lineTo(-452, -198); p.bezierCurveTo(-440, -152, -420, -122, -380, -112);
      p.bezierCurveTo(-200, -92, 200, -92, 380, -114); p.bezierCurveTo(420, -122, 446, -152, 462, -208); p.lineTo(478, -206);
      p.bezierCurveTo(470, -150, 450, -60, 400, -10); p.bezierCurveTo(300, 50, -300, 50, -400, -10); p.bezierCurveTo(-440, -50, -462, -120, -470, -200); p.closePath(); });
    S(10, (p) => { p.moveTo(70, -100); p.lineTo(48, -540); }, true);                             // mast, raked by the wind
    S(7, (p) => { p.moveTo(-70, -322); p.lineTo(226, -566); }, true);                            // the raked yard
    F((p) => { p.moveTo(-50, -336); p.bezierCurveTo(30, -372, 140, -466, 210, -552); p.bezierCurveTo(150, -468, 54, -378, -50, -336); p.closePath(); }, true);   // the sail furled on it
    S(7, (p) => { p.moveTo(430, -130); p.lineTo(448, -350); p.lineTo(LAMP[0], -356); }, true);   // lantern pole and arm
    // the four disciples
    F((p) => { p.moveTo(-300, -100); p.bezierCurveTo(-290, -170, -296, -240, -316, -280); p.bezierCurveTo(-330, -300, -360, -306, -376, -290);
      p.bezierCurveTo(-392, -250, -392, -170, -372, -100); p.closePath(); });                     // half-risen at the stern
    F((p) => p.ellipse(-344, -322, 24, 28, -0.3, 0, Math.PI * 2));
    F((p) => { p.moveTo(-372, -284); p.bezierCurveTo(-410, -312, -446, -352, -474, -394); p.lineTo(-462, -406); p.bezierCurveTo(-436, -372, -398, -336, -350, -302); p.closePath(); });   // arm flung out toward Him
    F((p) => { p.moveTo(-110, -100); p.bezierCurveTo(-104, -150, -116, -200, -140, -224); p.bezierCurveTo(-160, -244, -190, -246, -206, -226);
      p.bezierCurveTo(-216, -200, -214, -150, -200, -100); p.closePath(); });                     // rower, hunched
    F((p) => p.ellipse(-206, -246, 21, 24, 0.4, 0, Math.PI * 2));
    F((p) => { p.moveTo(70, -100); p.bezierCurveTo(80, -160, 66, -214, 36, -238); p.bezierCurveTo(10, -256, -24, -248, -36, -224);
      p.bezierCurveTo(-48, -190, -44, -140, -30, -100); p.closePath(); });                        // rower, cloak over his head
    F((p) => p.ellipse(14, -256, 23, 26, 0.2, 0, Math.PI * 2));
    F((p) => { p.moveTo(290, -100); p.bezierCurveTo(296, -150, 286, -196, 260, -214); p.bezierCurveTo(236, -228, 206, -222, 196, -200);
      p.bezierCurveTo(186, -170, 190, -130, 200, -100); p.closePath(); });                        // crouched in the bow, turned toward Him
    F((p) => p.ellipse(228, -238, 21, 24, -0.2, 0, Math.PI * 2));
    S(9, (p) => { p.moveTo(-196, -200); p.lineTo(-170, -98); p.lineTo(-262, 50); });             // oars, blades in the water
    S(9, (p) => { p.moveTo(-20, -190); p.lineTo(16, -98); p.lineTo(-70, 50); });
    S(9, (p) => { p.moveTo(206, -190); p.lineTo(230, -100); p.lineTo(160, 50); });
  }
  const boat = new THREE.Group();
  const boatCard = LW.billboard({ cw: BW, ch: BH, worldH: BH / BPX, footPx: BH - BOY, draw: (x) => {
    x.drawImage(silhouette(BW, BH, BOX, BOY, bParts, '#0A090B', [
      { color: '#9FB3DA', dx: -3, dy: 5, alpha: 0.55 },                                           // moon behind the boat
      { color: '#FFA457', dx: -7, dy: 2, alpha: 0.8, mask: (x) => { const g = x.createLinearGradient(120, 0, LAMP[0], 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); return g; } },
    ], (o) => {   // lantern light falling on the hull near the bow
      const g = o.createRadialGradient(LAMP[0], LAMP[1], 10, LAMP[0], LAMP[1], 520); g.addColorStop(0, 'rgba(255,150,70,0.28)'); g.addColorStop(1, 'rgba(255,150,70,0)');
      o.fillStyle = g; o.fillRect(-550, -660, 1100, 800);
    }), 0, 0);
    // the lantern's frame (the flame itself is a 3D emissive box)
    x.save(); x.translate(BOX, BOY); x.strokeStyle = '#0A090B'; x.lineWidth = 5; x.strokeRect(LAMP[0] - 16, LAMP[1] - 22, 32, 44); x.restore();
  } });
  boatCard.material.alphaTest = 0.5; boatCard.userData.update('b'); boat.add(boatCard);
  let lampMat, lampGlow, lampLight;
  {
    const lx = LAMP[0] / BPX, ly = -LAMP[1] / BPX;
    lampMat = new THREE.MeshBasicMaterial({ color: C('#FFB24C').multiplyScalar(2.2), toneMapped: false });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.17, 0.04), lampMat); lamp.position.set(lx, ly, 0.03); boat.add(lamp);
    lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: C('#FFA94A'), transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    lampGlow.scale.set(1.0, 1.0, 1); lampGlow.position.set(lx, ly, 0.08); boat.add(lampGlow);
    lampLight = new THREE.PointLight(C('#FF9E45'), 2.6, 6, 1.6); lampLight.position.set(lx, ly, 0.5); boat.add(lampLight);
  }
  boat.rotation.order = 'YXZ'; boat.position.set(...B); scene.add(boat);

  // ---------------- 2D finishing helpers ----------------
  const grainC = canvas(256, 256);
  { const gx = grainC.getContext('2d'), id = gx.createImageData(256, 256), rg = FW.rng(31); for (let i = 0; i < id.data.length; i += 4) { const v = rg() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gx.putImageData(id, 0, 0); }
  const out = canvas(OW, OH), ox = out.getContext('2d');
  const b1 = canvas(Math.round(OW / 4), Math.round(OH / 4)), b2 = canvas(b1.width, b1.height);
  const S = OH / 1920;   // type and effects scale with the frame height

  const spacedText = (x, txt, cx, y, track) => {   // centered text with letter spacing, drawn glyph by glyph (deterministic across Chrome builds)
    const ws = [...txt].map((ch) => x.measureText(ch).width); const total = ws.reduce((a, b) => a + b, 0) + track * (txt.length - 1);
    let px = cx - total / 2; [...txt].forEach((ch, i) => { x.fillText(ch, px, y); px += ws[i] + track; });
  };

  globalThis.frameAt = (t, o = {}) => {
    const K = SQUARE ? 1 : sm(0.9, 2.1, t);                  // how far God's light has broken through
    const push = SQUARE ? 1 : sm(0, 1, t / DUR);
    // camera: low over the water (He stands above the horizon), a slow 3-4% push-in toward Him
    const CAMP = SQUARE ? [J[0] + 0.6, 1.15, J[2] + 5.4] : [lerp(0.42, 0.34, push), lerp(1.4, 1.38, push), lerp(10.0, 9.62, push)];
    const CAML = SQUARE ? [J[0] + 0.46, 1.07, J[2] - 3.6] : [0.5, 0.62, -6.0];
    FW.setCam(cam, CAMP, CAML, SQUARE ? 40 : 46);
    cam.updateMatrixWorld();
    SEA.update(t);
    // light
    goldCard.material.opacity = K;
    spot.intensity = 38 * K; jLight.intensity = 3.0 * K;
    shaft.material.uniforms.amt.value = 0.085 * K; shaft.material.uniforms.time.value = t;
    halo.material.opacity = 0.34 * K; pool.material.opacity = 0.22 * K;
    jesus.position.y = waveH(J[0], J[2], t) * 0.6 + 0.02;
    pool.position.y = jesus.position.y + 0.1;
    rings.forEach((m) => { const ph = (t * 0.3 + m.userData.ph) % 1; const s = lerp(0.6, 2.3, ph); m.scale.set(s, s, 1); m.position.set(J[0], jesus.position.y + 0.07, J[2] + 0.05); m.material.opacity = 0.26 * K * Math.sin(Math.PI * ph); });
    const dx = CAMP[0] - J[0], dz = CAMP[2] - J[2], dl = Math.hypot(dx, dz);
    glints.userData.update((i, v) => { const g = G[i]; const u = g.u * 0.62; const px = J[0] + dx * u - dz / dl * g.o, pz = J[2] + dz * u + dx / dl * g.o;
      v.set(px, 0.14 + waveH(px, pz, t), pz); const tw = 0.5 + 0.5 * Math.sin(t * 4 + g.ph); return { alpha: K * 0.7 * (1 - g.u) * (0.25 + 0.75 * tw), size: g.s * (1 + u * 1.4) }; });
    // spray: lifted off the crests and blown right-to-left
    spray.userData.update((i, v) => { const s = SP[i]; const ph = (t * s.sp * 0.55 + s.ph) % 1; const x = s.x - ph * 2.4, z = s.z;
      const h = waveH(x, z, t); if (h < 0.18) return { alpha: 0 }; v.set(x, h + 0.08 + ph * 0.5, z); return { alpha: 0.45 * Math.sin(Math.PI * ph) * clamp((h - 0.18) * 3, 0, 1), size: s.s }; });
    { const ax = MOON_DIR[0] / -MOON_DIR[2];
      moonGlints.userData.update((i, v) => { const g = MG[i], x = cam.position.x + ax * g.d + g.o, z = cam.position.z - g.d; v.set(x, waveH(x, z, t) + 0.05, z);
        const tw = Math.pow(0.5 + 0.5 * Math.sin(t * g.f + g.ph), 3); return { alpha: 0.85 * tw * (1 - Math.abs(g.o) / (lerp(1.2, 7.5, (g.d - 15) / 81) + 0.01) * 0.6), size: g.s * g.d / 13 }; });
      moonPath.position.set(cam.position.x + ax * 52, 0.45, cam.position.z - 52); moonPath.scale.set(9, 80, 1); }
    mists.forEach((m) => { m.position.x = m.userData.x0 - t * (0.35 + 0.1 * m.userData.i); m.lookAt(cam.position.x, m.position.y, cam.position.z); });
    // the boat rides the swell, beaten by the waves
    const by = waveH(B[0], B[2], t), bdx = (waveH(B[0] + 1.0, B[2], t) - waveH(B[0] - 1.0, B[2], t)) / 2.0, bdz = (waveH(B[0], B[2] + 0.5, t) - waveH(B[0], B[2] - 0.5, t)) / 1.0;
    boat.position.y = by - 0.05;
    boat.rotation.set(-Math.atan(bdz) * 0.5, Math.atan2(cam.position.x - B[0], cam.position.z - B[2]), Math.atan(bdx) * 0.8 + 0.03 * Math.sin(t * 2.1));
    const fl = 0.86 + 0.08 * Math.sin(t * 13.1) + 0.06 * Math.sin(t * 7.3 + 1.2);
    lampMat.color.setRGB(1.0 * 2.2 * fl, 0.7 * 2.2 * fl, 0.3 * 2.2 * fl); lampGlow.material.opacity = 0.7 * fl; lampLight.intensity = 2.6 * fl;
    jesus.userData.face(cam); jesus.rotation.z = -0.03;   // leaning into the wind
    jesusLit.position.copy(jesus.position); jesusLit.rotation.copy(jesus.rotation); jesusLit.translateZ(0.01); jesusLit.material.opacity = K;

    const gl = LW.render(scene, cam, { focus: dl, aperture: 1.1, maxR: 3.5, fgScale: 0.8, exposure: 1.16, sat: 0.98, lift: [0.008, 0.012, 0.03] });

    // ---- 2D finishing: god rays from the upper left, bloom, vignette, grain ----
    ox.globalAlpha = 1; ox.globalCompositeOperation = 'source-over'; ox.filter = 'none';
    ox.drawImage(gl, 0, 0);
    const P = (p) => LW.project(cam, p);
    {
      const tgt = P([J[0], 1.1, J[2]]), sx = OW * -0.18, sy = OH * -0.12, ang0 = Math.atan2(tgt[1] - sy, tgt[0] - sx), len = Math.hypot(tgt[0] - sx, tgt[1] - sy) * 1.08;
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
    // ---- type ----
    if (!SQUARE) {
      ox.textAlign = 'left'; ox.textBaseline = 'alphabetic';
      // a soft dark band behind the wordmark area so the type always reads
      const wk = sm(3.7, 4.7, t);
      if (wk > 0) { const g = ox.createLinearGradient(0, OH * 0.62, 0, OH * 0.8); g.addColorStop(0, 'rgba(6,7,12,0)'); g.addColorStop(0.45, `rgba(6,7,12,${0.6 * wk})`); g.addColorStop(1, `rgba(6,7,12,${0.75 * wk})`); ox.fillStyle = g; ox.fillRect(0, OH * 0.62, OW, OH * 0.38); }
      // the verse, upper sky
      const va = sm(2.35, 3.05, t) * (1 - sm(3.75, 4.25, t));
      if (va > 0) {
        ox.save(); ox.globalAlpha = va; ox.fillStyle = '#F2E6CF'; ox.shadowColor = 'rgba(0,0,0,0.6)'; ox.shadowBlur = 20 * S;
        ox.font = `500 italic ${Math.round(56 * S)}px "Corm"`; ox.letterSpacing = '0px';
        const lines = ['“And in the fourth watch of the night', 'he came to them,', 'walking on the sea.”'];
        lines.forEach((l, i) => { const lw = ox.measureText(l).width; ox.fillText(l, OW / 2 - lw / 2, OH * 0.155 + i * 70 * S + (1 - sm(2.35, 3.05, t)) * 10 * S); });
        ox.restore();
      }
      // the wordmark, the rule, the reference
      if (wk > 0) {
        const kn = sm(4.0, 4.8, t), kr = sm(4.3, 4.95, t), kt = sm(4.55, 5.2, t), WY = OH * 0.712;
        ox.save(); ox.shadowColor = 'rgba(0,0,0,0.6)'; ox.shadowBlur = 22 * S;
        ox.globalAlpha = kn; ox.fillStyle = '#F2E6CF'; ox.font = `700 ${Math.round(80 * S)}px "Cinzel"`;
        spacedText(ox, 'FOURTH WATCH', OW / 2, WY + (1 - kn) * 16 * S, 13 * S);
        ox.shadowBlur = 0; ox.globalAlpha = kr * 0.85; ox.strokeStyle = 'rgba(227,178,92,1)'; ox.lineWidth = 2 * S;
        ox.beginPath(); ox.moveTo(OW / 2 - 64 * S * kr, WY + 46 * S); ox.lineTo(OW / 2 + 64 * S * kr, WY + 46 * S); ox.stroke();
        ox.globalAlpha = kt; ox.fillStyle = '#9A8E80'; ox.font = `600 ${Math.round(26 * S)}px "Inter"`;
        spacedText(ox, 'MATTHEW 14:25', OW / 2, WY + 104 * S, 9 * S);
        ox.restore();
      }
    }
    globalThis.__proj = { jesus: P([J[0], 1.1, J[2]]).map((v, i) => i < 2 ? +(v / (i ? OH : OW)).toFixed(3) : 0), feet: P([J[0], 0, J[2]]).map((v, i) => i < 2 ? +(v / (i ? OH : OW)).toFixed(3) : 0), boat: P([B[0], 0.6, B[2]]).map((v, i) => i < 2 ? +(v / (i ? OH : OW)).toFixed(3) : 0) };
    return out;
  };
  globalThis.__ready = true;
})().catch((e) => { console.error(e); globalThis.__err = String(e && e.stack || e); globalThis.__ready = true; });
