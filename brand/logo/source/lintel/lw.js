// Lintel-grade world renderer for Fourth Watch: low-poly 3D, one warm sun with soft shadows, sky + haze,
// 2D characters as billboards that cast shadows, and a depth-of-field pass (miniature / diorama look).
// Deterministic: everything is a pure function of t (seeded rng only).
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  const LW = (globalThis.LW = {});
  const { clamp, lerp } = FW;
  LW.col = (c) => new THREE.Color(c);

  // ---------------- renderer + post ----------------
  const POST_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const DOF_FS = `
    precision highp float;
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 px; uniform float cnear, cfar, focus, aperture, maxR, fgScale;
    varying vec2 vUv;
    float linZ(float d){ return cnear * cfar / (cfar - d * (cfar - cnear)); }
    float cocAt(float z){ float c = aperture * abs(z - focus) / z; if (z < focus) c *= fgScale; return clamp(c, 0.0, maxR); }
    void main(){
      vec2 uv = vUv;
      float z0 = linZ(texture2D(tDepth, uv).x); float c0 = cocAt(z0);
      vec3 col = texture2D(tColor, uv).rgb; float tot = 1.0;
      float radius = 0.55; float ang = 0.0;
      for (int i = 0; i < 64; i++) {
        if (radius >= maxR) break;
        vec2 tc = uv + vec2(cos(ang), sin(ang)) * px * radius;
        vec3 sc = texture2D(tColor, tc).rgb; float sz = linZ(texture2D(tDepth, tc).x); float ss = cocAt(sz);
        if (sz > z0) ss = clamp(ss, 0.0, c0 * 2.0);
        float m = smoothstep(radius - 0.5, radius + 0.5, ss);
        col += mix(col / tot, sc, m); tot += 1.0;
        radius += 0.55 / radius; ang += 2.39996323;
      }
      gl_FragColor = vec4(col / tot, c0);
    }`;
  const COMP_FS = `
    precision highp float;
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tBlur; uniform float cnear, cfar, focus, aperture, maxR, fgScale, halfScale;
    uniform float exposure, sat; uniform vec3 lift, gain;
    uniform float inkAmt, inkW, inkThr; uniform vec3 inkCol; uniform vec2 pxFull;
    uniform vec2 fUV; uniform float fR0, fR1, fDark, fAspect;
    varying vec2 vUv;
    float linZ(float d){ return cnear * cfar / (cfar - d * (cfar - cnear)); }
    float cocAt(float z){ float c = aperture * abs(z - focus) / z; if (z < focus) c *= fgScale; return clamp(c, 0.0, maxR); }
    vec3 tone(vec3 x){ x = max(x, 0.0); vec3 s = 0.78 + 0.22 * (1.0 - exp(-(x - 0.78) / 0.22)); return mix(x, s, step(0.78, x)); }
    void main(){
      vec3 sharp = texture2D(tColor, vUv).rgb;
      float z0 = linZ(texture2D(tDepth, vUv).x);
      float c0 = cocAt(z0) * halfScale;
      vec4 b = texture2D(tBlur, vUv);
      float k = smoothstep(0.35, 1.6, max(c0, b.a * halfScale));
      // ink: a warm line on the near side of every depth break (silhouettes), the same line the 2D characters are drawn with
      if (inkAmt > 0.0) {
        float e = 0.0;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398;
          float zn = linZ(texture2D(tDepth, vUv + vec2(cos(a), sin(a)) * pxFull * inkW).x);
          e = max(e, (zn - z0) / z0);
        }
        float ink = smoothstep(inkThr, inkThr * 2.2, e) * inkAmt * (1.0 - k);
        sharp = mix(sharp, inkCol, ink);
      }
      vec3 col = mix(sharp, b.rgb, k) * exposure;
      // focal emphasis: everything outside the subject's pool of light falls off (Lintel's spotlight read)
      if (fDark > 0.0) { float dd = length((vUv - fUV) * vec2(fAspect, 1.0)); col *= 1.0 - fDark * smoothstep(fR0, fR1, dd); }
      col = tone(col);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, sat);
      col = col * gain + lift * (1.0 - col);
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`;

  LW.init = (W, H) => {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(1); r.setSize(W, H, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const dt = new THREE.DepthTexture(W, H); dt.type = THREE.UnsignedIntType;
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, depthTexture: dt });
    const hw = Math.round(W / 2), hh = Math.round(H / 2);
    const rtHalf = new THREE.WebGLRenderTarget(hw, hh, { type: THREE.HalfFloatType, depthBuffer: false });
    const U = { cnear: { value: 0.1 }, cfar: { value: 400 }, focus: { value: 10 }, aperture: { value: 6 }, maxR: { value: 7 }, fgScale: { value: 1.6 } };
    const dof = new THREE.ShaderMaterial({ uniforms: Object.assign({ tColor: { value: rt.texture }, tDepth: { value: dt }, px: { value: new THREE.Vector2(1 / hw, 1 / hh) } }, U), vertexShader: POST_VS, fragmentShader: DOF_FS, depthTest: false, depthWrite: false, toneMapped: false });
    const comp = new THREE.ShaderMaterial({ uniforms: Object.assign({ tColor: { value: rt.texture }, tDepth: { value: dt }, tBlur: { value: rtHalf.texture }, halfScale: { value: 2 },
      exposure: { value: 1 }, sat: { value: 1.06 }, lift: { value: new THREE.Vector3(0.012, 0.016, 0.04) }, gain: { value: new THREE.Vector3(1, 1, 1) },
      inkAmt: { value: 0 }, inkW: { value: 1.5 }, inkThr: { value: 0.035 }, inkCol: { value: new THREE.Vector3(0.16, 0.1, 0.07) }, pxFull: { value: new THREE.Vector2(1 / W, 1 / H) },
      fUV: { value: new THREE.Vector2(0.5, 0.5) }, fR0: { value: 0.3 }, fR1: { value: 0.8 }, fDark: { value: 0 }, fAspect: { value: W / H } }, U),
      vertexShader: POST_VS, fragmentShader: COMP_FS, depthTest: false, depthWrite: false, toneMapped: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dof); quad.frustumCulled = false;
    const pscene = new THREE.Scene(); pscene.add(quad);
    const pcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    LW.r = r; LW.canvas = canvas; LW.W = W; LW.H = H; LW.U = U; LW.comp = comp;
    // render scene -> rt (linear HDR) -> half-res DOF -> composite + tone + grade -> canvas
    LW.render = (scene, cam, o = {}) => {
      U.cnear.value = cam.near; U.cfar.value = cam.far;
      U.focus.value = o.focus ?? 10; U.aperture.value = o.aperture ?? 6; U.maxR.value = o.maxR ?? 7; U.fgScale.value = o.fgScale ?? 1.6;
      comp.uniforms.exposure.value = o.exposure ?? 1; comp.uniforms.sat.value = o.sat ?? 1.06;
      comp.uniforms.lift.value.set(...(o.lift || [0.012, 0.016, 0.04])); comp.uniforms.gain.value.set(...(o.gain || [1, 1, 1]));
      const cu = comp.uniforms, ink = o.ink || {}, fo = o.focus2 || {};   // ink lines + focal falloff (both off unless asked for)
      cu.inkAmt.value = ink.amt ?? 0; cu.inkW.value = ink.w ?? 1.5; cu.inkThr.value = ink.thr ?? 0.035; if (ink.col) cu.inkCol.value.set(...ink.col);
      cu.fDark.value = fo.dark ?? 0; if (fo.uv) cu.fUV.value.set(fo.uv[0], fo.uv[1]); cu.fR0.value = fo.r0 ?? 0.3; cu.fR1.value = fo.r1 ?? 0.8;
      r.setRenderTarget(rt); r.setClearColor(0x000000, 1); r.clear(); r.render(scene, cam);
      quad.material = dof; r.setRenderTarget(rtHalf); r.render(pscene, pcam);
      quad.material = comp; r.setRenderTarget(null); r.render(pscene, pcam);
      return canvas;
    };
    return r;
  };

  // ---------------- sky dome (follows the camera; never fogged; depth stays at far = max blur) ----------------
  LW.sky = (o) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: { top: { value: LW.col(o.top) }, mid: { value: LW.col(o.mid) }, hor: { value: LW.col(o.hor) }, low: { value: LW.col(o.low || o.hor) },
        sunDir: { value: new THREE.Vector3(...o.sunDir).normalize() }, sunCol: { value: LW.col(o.sunCol || '#FFD9A0') }, sunAmt: { value: o.sunAmt ?? 1 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top, mid, hor, low, sunCol, sunDir; uniform float sunAmt; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float y = d.y;
          vec3 c = mix(hor, mid, smoothstep(0.0, 0.16, y)); c = mix(c, top, smoothstep(0.12, 0.62, y)); c = mix(c, low, smoothstep(0.0, -0.2, y));
          float s = max(dot(d, sunDir), 0.0); c += sunCol * sunAmt * (pow(s, 6.0) * 0.28 + pow(s, 60.0) * 0.5 + pow(s, 900.0) * 2.0);
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, toneMapped: false,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), mat);
    m.renderOrder = -10; m.frustumCulled = false;
    m.onBeforeRender = (r, s, cam) => { m.position.copy(cam.position); m.updateMatrixWorld(true); };
    return m;
  };

  // ---------------- low-poly terrain: flat-shaded facets, colour per face ----------------
  // hFn(x, z) -> height; colFn(x, z, y, ny, rnd) -> THREE.Color for the face
  LW.terrain = ({ size = 160, seg = 120, cx = 0, cz = 0, hFn, colFn, seed = 7 }) => {
    const rng = FW.rng(seed);
    const g0 = new THREE.PlaneGeometry(size, size, seg, seg); g0.rotateX(-Math.PI / 2); g0.translate(cx, 0, cz);
    const pos0 = g0.attributes.position;
    // jitter grid points a little so facets are irregular (deterministic)
    for (let i = 0; i < pos0.count; i++) {
      const x = pos0.getX(i), z = pos0.getZ(i), cell = size / seg;
      const jx = (FW.noise2(x * 3.1, z * 3.1, 11) - 0.5) * cell * 0.5, jz = (FW.noise2(x * 2.7, z * 2.9, 23) - 0.5) * cell * 0.5;
      pos0.setX(i, x + jx); pos0.setZ(i, z + jz); pos0.setY(i, hFn(x + jx, z + jz));
    }
    if (LW.paintTerrain) {   // painted ground: smooth shading, colour varies in broad soft patches (no per-face noise)
      g0.computeVertexNormals(); const p = g0.attributes.position, cols = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { const col = colFn(p.getX(i), p.getZ(i), p.getY(i), g0.attributes.normal.getY(i), FW.noise2(p.getX(i) * 0.35, p.getZ(i) * 0.35, seed)); cols[i * 3] = col.r; cols[i * 3 + 1] = col.g; cols[i * 3 + 2] = col.b; }
      g0.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const m = new THREE.Mesh(g0, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 1, metalness: 0 }));
      m.receiveShadow = true; m.castShadow = true; return m;
    }
    const g = g0.toNonIndexed(); g.computeVertexNormals();
    const pos = g.attributes.position, colors = new Float32Array(pos.count * 3);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      n.subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize(); if (n.y < 0) n.negate();
      const mx = (a.x + b.x + c.x) / 3, my = (a.y + b.y + c.y) / 3, mz = (a.z + b.z + c.z) / 3;
      const col = colFn(mx, mz, my, n.y, rng());
      for (let k = 0; k < 3; k++) { colors[(i + k) * 3] = col.r; colors[(i + k) * 3 + 1] = col.g; colors[(i + k) * 3 + 2] = col.b; }
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }));
    m.receiveShadow = true; m.castShadow = true;
    return m;
  };

  // ---------------- props ----------------
  const jitter = (geo, amt, rng) => { const p = geo.attributes.position; const seen = new Map();
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!seen.has(k)) seen.set(k, [(rng() - 0.5) * amt, (rng() - 0.5) * amt, (rng() - 0.5) * amt]); const d = seen.get(k); p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]); }
    geo.computeVertexNormals(); return geo; };
  LW.jitter = jitter;
  const M = (color, o = {}) => FW.mat(color, Object.assign({ roughness: 0.92 }, o));
  LW.M = M;
  const shadowy = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };
  LW.shadowy = shadowy;

  LW.rock = (rng, s = 1, cols = ['#A08E78', '#8F7E6A', '#B09D84', '#857563']) => {
    const g = jitter(new THREE.IcosahedronGeometry(0.5, 0), 0.28, rng); g.scale(1.2 + rng() * 0.6, 0.55 + rng() * 0.45, 1 + rng() * 0.5);
    const m = new THREE.Mesh(g, M(cols[Math.floor(rng() * cols.length)])); m.scale.setScalar(s); m.rotation.y = rng() * 6.28; m.position.y = 0.12 * s;
    return shadowy(m);
  };
  LW.olive = (rng, s = 1) => {
    const g = new THREE.Group();
    const tg = jitter(new THREE.CylinderGeometry(0.07, 0.13, 1.0, 5, 3), 0.05, rng); tg.translate(0, 0.5, 0);
    const p = tg.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setX(i, p.getX(i) + Math.sin(y * 2.4) * 0.09); } tg.computeVertexNormals();
    const tr = new THREE.Mesh(tg, M('#6E5139')); tr.rotation.z = (rng() - 0.5) * 0.3; g.add(tr);
    const leaf = ['#73843F', '#62733A', '#7F9047', '#5A6935'];
    const n = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const r = 0.34 + rng() * 0.2; const bg = jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.35, rng); bg.scale(1.15, 0.78, 1.15);
      const b = new THREE.Mesh(bg, M(leaf[Math.floor(rng() * leaf.length)]));
      const a = (i / n) * 6.28 + rng(); b.position.set(Math.cos(a) * 0.38, 1.0 + rng() * 0.32, Math.sin(a) * 0.38); g.add(b);
    }
    const top = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(0.42, 0), 0.14, rng), M(leaf[0])); top.position.y = 1.3; top.scale.set(1.2, 0.8, 1.2); g.add(top);
    g.scale.setScalar(s); g.rotation.y = rng() * 6.28;
    return shadowy(g);
  };
  LW.bush = (rng, s = 1) => {
    const g = new THREE.Group(); const cols = ['#6A7A3C', '#5B6A35', '#7C8A45', '#8A8E4A'];
    const n = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) { const r = 0.18 + rng() * 0.16; const b = new THREE.Mesh(jitter(new THREE.IcosahedronGeometry(r, 0), r * 0.4, rng), M(cols[Math.floor(rng() * cols.length)])); b.position.set((rng() - 0.5) * 0.4, r * 0.7, (rng() - 0.5) * 0.4); b.scale.y = 0.8; g.add(b); }
    g.scale.setScalar(s); return shadowy(g);
  };
  LW.grassTuft = (rng, s = 1) => {
    const g = new THREE.Group(); const cols = ['#9AA052', '#A9A75A', '#8B9548'];
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.28 + rng() * 0.14, 3), M(cols[i % 3])); c.position.set((rng() - 0.5) * 0.16, 0.14, (rng() - 0.5) * 0.16); c.rotation.set((rng() - 0.5) * 0.5, 0, (rng() - 0.5) * 0.5); g.add(c); }
    g.scale.setScalar(s); return g;
  };
  // Philistine camp tent: a six-sided cone, banded
  LW.tent = (rng, s = 1, cA = '#D8C4A0', cB = '#A8432C') => {
    const g = new THREE.Group();
    const r = 0.9 + rng() * 0.35, h = 1.3 + rng() * 0.4;
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r, h * 0.45, 7), M(cA)); lower.position.y = h * 0.225; g.add(lower);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.53, r * 0.58, h * 0.08, 7), M(cB)); band.position.y = h * 0.47; g.add(band);
    const upper = new THREE.Mesh(new THREE.ConeGeometry(r * 0.53, h * 0.55, 7), M(rng() < 0.5 ? cB : cA)); upper.position.y = h * 0.47 + h * 0.275; g.add(upper);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.45, 4), M('#5C3F2A')); pole.position.y = h + 0.15; g.add(pole);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.5, h * 0.36), M('#3A2A20', { side: THREE.DoubleSide })); door.position.set(0, h * 0.18, r * 0.83); door.rotation.x = -0.35; g.add(door);
    g.scale.setScalar(s); g.rotation.y = rng() * 6.28;
    return shadowy(g);
  };
  LW.banner = (rng, s = 1, c = '#B5452B') => {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 2.6, 5), M('#5C3F2A')); pole.position.y = 1.3; g.add(pole);
    const fg = new THREE.PlaneGeometry(0.75, 0.5, 6, 1); fg.translate(0.375, 0, 0);
    const p = fg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 5 + rng() * 2) * 0.06);
    fg.computeVertexNormals();
    const flag = new THREE.Mesh(fg, M(c, { side: THREE.DoubleSide })); flag.position.y = 2.3; g.add(flag);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), M('#B8864B')); tip.position.y = 2.66; g.add(tip);
    g.scale.setScalar(s); return shadowy(g);
  };
  LW.crate = (rng, s = 1) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 0.4), M(rng() < 0.5 ? '#8A6646' : '#7A5A3E')); m.position.y = 0.16; m.rotation.y = rng() * 3; m.scale.setScalar(s); return shadowy(m); };
  LW.fire = (rng) => {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.09, 0), M('#6E6458')); const a = (i / 6) * 6.28; st.position.set(Math.cos(a) * 0.28, 0.05, Math.sin(a) * 0.28); g.add(st); }
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 5), new THREE.MeshBasicMaterial({ color: LW.col('#FF9A3C').multiplyScalar(2.2), toneMapped: false })); core.position.y = 0.2; g.add(core);
    g.userData.core = core;
    return g;
  };

  // ---------------- 2D characters standing in the 3D world ----------------
  // A billboard: a canvas texture on a plane that turns to face the camera (yaw only), casts a shadow
  // through its alpha (custom depth material), and is tinted by the scene light by hand.
  LW.billboard = ({ cw, ch, worldH, footPx, draw }) => {
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const ctx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
    const pxPerU = ch / worldH, w = cw / pxPerU;
    const geo = new THREE.PlaneGeometry(w, worldH); geo.translate(0, worldH / 2 - footPx / pxPerU, 0);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, depthWrite: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    // the visible card faces the camera; a hidden twin faces the sun and casts the shadow (a card seen edge-on by the
    // light would cast only a sliver)
    mesh.castShadow = false;
    const caster = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
    caster.castShadow = true; caster.renderOrder = -1;
    mesh.userData = { cv, ctx, tex, key: null, pxPerU, caster };
    // redraw only when the pose key changes
    mesh.userData.update = (key, ...args) => { if (key === mesh.userData.key) return; mesh.userData.key = key; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cw, ch); draw(ctx, ...args); tex.needsUpdate = true; };
    mesh.userData.face = (cam, lean = 0) => { mesh.rotation.y = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z) + lean; };
    // keep the shadow twin on the card, turned toward the light (light: a DirectionalLight)
    mesh.userData.castFrom = (light) => { caster.position.copy(mesh.position); caster.rotation.set(0, Math.atan2(light.position.x - light.target.position.x, light.position.z - light.target.position.z), mesh.rotation.z); };
    return mesh;
  };

  // a soft round sprite texture (embers, dust, glows)
  LW.dotTex = (() => { let tex = null; return () => { if (tex) return tex; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    tex = new THREE.CanvasTexture(c); return tex; }; })();
  // n deterministic particles; fn(i, out:Vector3) -> {alpha, size} positions them each frame
  LW.particles = (n, color, size = 0.08) => {
    const g = new THREE.BufferGeometry(); const p = new Float32Array(n * 3), a = new Float32Array(n), s = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('alpha', new THREE.BufferAttribute(a, 1)); g.setAttribute('psize', new THREE.BufferAttribute(s, 1));
    const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: LW.dotTex() }, col: { value: LW.col(color) }, scale: { value: 900 } },
      vertexShader: 'attribute float alpha; attribute float psize; uniform float scale; varying float vA; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; uniform vec3 col; varying float vA; void main(){ float m = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(col * vA * m, 1.0); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
    const v = new THREE.Vector3();
    pts.userData.update = (fn) => { for (let i = 0; i < n; i++) { const r = fn(i, v) || { alpha: 0, size: size }; p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z; a[i] = r.alpha; s[i] = (r.size ?? 1) * size; }
      g.attributes.position.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.psize.needsUpdate = true; };
    return pts;
  };

  // a volumetric light shaft: open cone from `from` to `to` (radii r0 at the top, r1 at the bottom), additive
  LW.shaft = (from, to, r0, r1, color) => {
    const len = new THREE.Vector3(...from).distanceTo(new THREE.Vector3(...to));
    const geo = new THREE.CylinderGeometry(r0, r1, len, 40, 12, true); geo.translate(0, -len / 2, 0);
    const mat = new THREE.ShaderMaterial({ uniforms: { col: { value: LW.col(color) }, amt: { value: 0 }, time: { value: 0 } },
      vertexShader: 'varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - wp.xyz); vY = uv.y; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: `uniform vec3 col; uniform float amt, time; varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv;
        void main(){ float f = abs(dot(normalize(vN), normalize(vV))); f = pow(f, 1.6);
          float fade = smoothstep(0.0, 0.22, vY) * smoothstep(1.0, 0.55, vY);
          float streak = 0.75 + 0.25 * sin(vUv.x * 62.83 + time * 0.7) * sin(vUv.x * 25.1 - time * 0.45);
          gl_FragColor = vec4(col * amt * f * fade * streak, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, toneMapped: false });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...from);
    const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize();
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    m.renderOrder = 5; m.frustumCulled = false;
    return m;
  };
  // a flat additive glow disc on the ground
  LW.pool = (radius, color) => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: LW.col(color), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 4;
    return m;
  };

  // project a world point to screen pixels
  LW.project = (cam, p) => { const v = new THREE.Vector3(...p).project(cam); return [(v.x * 0.5 + 0.5) * LW.W, (-v.y * 0.5 + 0.5) * LW.H, v.z]; };
})();
