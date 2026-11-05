// Fourth Watch 3D core: one offscreen WebGL renderer, palette, materials, easing, seeded noise.
// Everything here is deterministic: no Math.random, no Date.now. Frames are a pure function of t.
(function () {
  const THREE = globalThis.THREE;
  const FW = (globalThis.FW = globalThis.FW || {});

  // ---------- palette (series canon + the pre-dawn "fourth watch" range) ----------
  FW.PAL = {
    night: '#14100D', umber: '#2A1E16', clay: '#6B4A33', gold: '#E3B25C', parchment: '#F2E6CF',
    ember: '#C2502E', sky: '#1C2433', ash: '#8C8174',
    // extended, all inside the warm-night / blue-hour family
    deepBlue: '#0E1626', blueHour: '#2B3A57', dusk: '#4A5878', dawnRose: '#C98A6B', dawnGold: '#F0C27A',
    sand: '#B08A5E', sandLight: '#C9A273', stone: '#8E7C68', stoneDark: '#5E5044', mud: '#8A6646', mudLight: '#A77E58',
    olive: '#4F5A3A', oliveDark: '#36402A', palm: '#3E5B3A', wood: '#5C3F2A', bone: '#E8DCC4', rope: '#B89B6A',
  };
  FW.SKIN = ['#C68A5E', '#B07A50', '#9A6845', '#D29B6E', '#8A5A3A'];

  FW.color = (c) => new THREE.Color(c);

  // ---------- materials (cached) ----------
  const matCache = new Map();
  FW.mat = (color, o = {}) => {
    const key = color + JSON.stringify(o);
    if (matCache.has(key) && !o.unique) return matCache.get(key);
    const oo = Object.assign({}, o); delete oo.unique;
    const m = new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(color), roughness: 0.92, metalness: 0, flatShading: true }, oo));
    if (!o.unique) matCache.set(key, m);
    return m;
  };
  FW.glow = (color, opacity = 1, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }, o));

  // ---------- math ----------
  FW.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  FW.lerp = (a, b, k) => a + (b - a) * k;
  FW.smooth = (x) => { x = FW.clamp(x); return x * x * (3 - 2 * x); };
  FW.ease = {
    inOut: (x) => { x = FW.clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    out: (x) => { x = FW.clamp(x); return 1 - Math.pow(1 - x, 3); },
    in: (x) => { x = FW.clamp(x); return x * x * x; },
    outBack: (x, s = 1.6) => { x = FW.clamp(x); const c3 = s + 1; return 1 + c3 * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); },
  };
  // progress of t through [a, b], eased
  FW.prog = (t, a, b, e = FW.ease.inOut) => e(FW.clamp((t - a) / Math.max(1e-6, b - a)));
  FW.v3 = (x, y, z) => new THREE.Vector3(x, y, z);
  FW.lerpV = (a, b, k) => new THREE.Vector3(FW.lerp(a[0], b[0], k), FW.lerp(a[1], b[1], k), FW.lerp(a[2], b[2], k));

  // seeded PRNG + value noise
  FW.rng = (seed) => { let s = seed >>> 0 || 1; return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash2 = (x, y, s) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  FW.noise2 = (x, y, s = 1) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
    return FW.lerp(FW.lerp(a, b, u), FW.lerp(c, d, u), v);
  };
  FW.fbm = (x, y, s = 1, oct = 4) => { let a = 0, f = 1, amp = 0.5, n = 0; for (let i = 0; i < oct; i++) { a += amp * FW.noise2(x * f, y * f, s + i * 17); n += amp; f *= 2; amp *= 0.5; } return a / n; };

  // ---------- the renderer ----------
  FW.init = (W, H) => {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.autoClear = true;
    FW.renderer = r; FW.glCanvas = canvas; FW.W = W; FW.H = H;
    return r;
  };
  // render a shot (scene + camera) at a given pixel size; returns the GL canvas
  FW.renderShot = (scene, camera, exposure = 1) => {
    const r = FW.renderer;
    r.toneMappingExposure = exposure;
    r.render(scene, camera);
    return FW.glCanvas;
  };

  // a camera rig: position, look-at target, fov, roll (degrees)
  FW.camera = (aspect) => { const c = new THREE.PerspectiveCamera(32, aspect, 0.25, 400); return c; };
  FW.setCam = (cam, pos, look, fov = 32, roll = 0) => {
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.up.set(0, 1, 0);
    cam.lookAt(look[0], look[1], look[2]);
    if (roll) cam.rotateZ((roll * Math.PI) / 180);
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  };
  FW.camLerpK = (A, B, k) => ({ p: [0, 1, 2].map((i) => FW.lerp(A.p[i], B.p[i], k)), l: [0, 1, 2].map((i) => FW.lerp(A.l[i], B.l[i], k)), f: FW.lerp(A.f || 32, B.f || 32, k), r: FW.lerp(A.r || 0, B.r || 0, k) });
  // interpolate between two camera keys {p:[x,y,z], l:[x,y,z], f:fov, r:roll} with progress k
  FW.camLerp = (cam, A, B, k) => {
    const p = [0, 1, 2].map((i) => FW.lerp(A.p[i], B.p[i], k)), l = [0, 1, 2].map((i) => FW.lerp(A.l[i], B.l[i], k));
    FW.setCam(cam, p, l, FW.lerp(A.f || 32, B.f || 32, k), FW.lerp(A.r || 0, B.r || 0, k));
  };
})();
