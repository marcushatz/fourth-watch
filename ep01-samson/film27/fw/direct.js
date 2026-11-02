// DIRECT: reusable directing primitives (Story Director stage, Nov 1). Loaded after fw/core.js. Additive: nothing calls it
// unless a scene does, so existing shots render exactly as before. Every function is a pure function of t.
//   DIRECT.path(t, keys)            camera path through timed keys, eased per segment -> { p, l, f, sh }
//   DIRECT.mark(marks, name, mods)  a named camera mark a set publishes ("hands", "hallWide"), optionally pushed/craned
//   DIRECT.act(t, at, o)            acting envelope for one verb on its word: anticipation dip -> drive -> overshoot -> settle
//   DIRECT.shake(t, at, amp, dur)   impact shake in px [dx, dy] (<= 12 px, gone in 0.45 s; only on impacts)
//   DIRECT.tremor(t, t0, amp, f)    sustained effort tremor (0 before t0)
//   DIRECT.beat(shot, name, fb)     a beat time by name, with a fallback (never NaN)
(function () {
  const FW = globalThis.FW;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const E = {
    linear: (x) => x,
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    hold: () => 0,
  };
  const D = {};
  D.ease = E;
  D.beat = (shot, name, fb) => { const v = shot && shot.beats ? shot.beats[name] : undefined; return Number.isFinite(v) ? v : fb; };

  // keys: [{ t, p:[x,y,z], l:[x,y,z], f, sh, ease }]; segment i -> i+1 uses keys[i+1].ease (default inOut).
  // Before the first key: the first key; after the last: the last (a locked hold).
  D.path = (t, keys) => {
    if (!keys.length) throw new Error('DIRECT.path: no keys');
    if (t <= keys[0].t) return Object.assign({ sh: 0 }, keys[0]);
    for (let i = 0; i < keys.length - 1; i++) {
      const A = keys[i], B = keys[i + 1];
      if (t <= B.t) {
        const x = clamp((t - A.t) / Math.max(1e-6, B.t - A.t));
        // 'cr' segments: one continuous curve through the keys (Catmull-Rom, no stop at the key): 'cr' constant speed,
        // 'crIn' starts from rest, 'crOut' settles into the next key, 'crInOut' both (a single eased move through many keys)
        if (B.ease && B.ease.startsWith('cr')) {
          const k = B.ease === 'crIn' ? x * x * (2 - x) : B.ease === 'crOut' ? x + x * x - x * x * x : B.ease === 'crInOut' ? x * x * (3 - 2 * x) : x; // in/out end at unit speed, so neighbouring 'cr' segments join without a jolt
          const P0 = keys[Math.max(0, i - 1)], P3 = keys[Math.min(keys.length - 1, i + 2)];
          const cr = (a, b, c, d) => [0, 1, 2].map((j) => 0.5 * ((2 * b[j]) + (-a[j] + c[j]) * k + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * k * k + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * k * k * k));
          return { p: cr(P0.p, A.p, B.p, P3.p), l: cr(P0.l, A.l, B.l, P3.l), f: lerp(A.f ?? 38, B.f ?? 38, k), sh: lerp(A.sh ?? 0, B.sh ?? 0, k) };
        }
        const k = (E[B.ease || 'inOut'] || E.inOut)(x);
        return { p: lerp3(A.p, B.p, k), l: lerp3(A.l, B.l, k), f: lerp(A.f ?? 38, B.f ?? 38, k), sh: lerp(A.sh ?? 0, B.sh ?? 0, k) };
      }
    }
    return Object.assign({ sh: 0 }, keys[keys.length - 1]);
  };
  // a value keyed in time: keys = [[t, v], ...] (t ascending), eased between keys (smoothstep); held before the first and after the last
  D.keyed = (t, keys) => {
    if (!keys || !keys.length) return undefined;
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) { const x = clamp((t - t0) / Math.max(1e-6, t1 - t0)); return a + (b - a) * x * x * (3 - 2 * x); } }
    return keys[keys.length - 1][1];
  };
  // keyed with no dead stops: a monotone cubic through [[t, v], ...] (Fritsch-Carlson). Velocity is continuous through every key;
  // it is zero only where the keys themselves level off (a plateau) and at the ends.
  D.keyedC1 = (t, keys) => {
    const n = keys.length; if (!n) return undefined;
    if (t <= keys[0][0]) return keys[0][1]; if (t >= keys[n - 1][0]) return keys[n - 1][1];
    if (!keys._m) {
      const h = [], dl = [];
      for (let i = 0; i < n - 1; i++) { h[i] = keys[i + 1][0] - keys[i][0]; dl[i] = (keys[i + 1][1] - keys[i][1]) / h[i]; }
      const m = [0];
      for (let i = 1; i < n - 1; i++) m[i] = dl[i - 1] * dl[i] <= 0 ? 0 : (3 * (h[i - 1] + h[i])) / ((2 * h[i] + h[i - 1]) / dl[i - 1] + (h[i] + 2 * h[i - 1]) / dl[i]);
      m[n - 1] = 0; keys._m = m;
    }
    let i = 0; while (t > keys[i + 1][0]) i++;
    const [t0, a] = keys[i], [t1, b] = keys[i + 1], hh = t1 - t0, x = (t - t0) / hh, m = keys._m;
    const h00 = 2 * x ** 3 - 3 * x * x + 1, h10 = x ** 3 - 2 * x * x + x, h01 = -2 * x ** 3 + 3 * x * x, h11 = x ** 3 - x * x;
    return h00 * a + h10 * hh * m[i] + h01 * b + h11 * hh * m[i + 1];
  };
  // a pole raised by people (weight, not a keyed curve): its lean from vertical (phi, rad) is pulled toward the lifters' effort
  // target by a spring (K), damped (C), and pulled down by gravity (G sin phi): heavy when low, light near upright, so it breaks
  // free late, lags the push, sags when they re-grip, and overshoots then settles at upright. It rests on its support (phi <= lie).
  // sp = { t0, lie, K, C, G, keys: [[t, phiTarget], ...] }. Integrated once at 240 Hz from t0 (deterministic) and cached on sp.
  D.raiseSim = (t, sp) => {
    if (!sp._c) {
      const dt = 1 / 240, tEnd = sp.keys[sp.keys.length - 1][0] + 4, arr = [];
      let phi = sp.lie, w = 0;
      for (let tt = sp.t0; tt <= tEnd + dt; tt += dt) {
        arr.push([phi, w]);
        const a = -sp.K * (phi - D.keyedC1(tt, sp.keys)) - sp.C * w + sp.G * Math.sin(phi);
        w += a * dt; phi += w * dt;
        if (phi > sp.lie) { phi = sp.lie; if (w > 0) w = 0; }
      }
      sp._c = { arr, dt };
    }
    const c = sp._c, x = (t - sp.t0) / c.dt;
    if (x <= 0) return { phi: sp.lie, w: 0 };
    const i = Math.min(c.arr.length - 2, Math.floor(x)), f = Math.min(1, x - i), A = c.arr[i], B = c.arr[i + 1];
    return { phi: A[0] + (B[0] - A[0]) * f, w: A[1] + (B[1] - A[1]) * f };
  };
  // a named mark, moved: push (0.08 = 8% closer along the view line), crane (metres up, look follows half), truck (metres sideways)
  D.mark = (marks, name, m = {}) => {
    const K = marks[name]; if (!K) throw new Error('DIRECT.mark: no mark ' + name);
    const p = K.p.slice(), l = K.l.slice();
    if (m.push) for (let i = 0; i < 3; i++) p[i] = lerp(p[i], l[i], m.push);
    if (m.crane) { p[1] += m.crane; l[1] += m.crane * (m.lookFollow ?? 0.5); }
    if (m.truck) { p[0] += m.truck; l[0] += m.truck; }
    return { p, l, f: m.f ?? K.f ?? 38, sh: m.sh ?? K.sh ?? 0 };
  };

  // the acting envelope for a verb landing at `at`:
  //   pre  s of anticipation (a dip the other way, depth `dip`), then the drive over `rise` s to 1 + `over`, settling to 1 over `settle` s.
  // returns { k: 0..~1.08 (the pose amount), dip: 0..1 (how far into the anticipation), phase: 'before'|'anticip'|'drive'|'settle'|'held' }
  D.act = (t, at, o = {}) => {
    const pre = o.pre ?? 0.25, rise = o.rise ?? 0.2, over = o.over ?? 0.08, settle = o.settle ?? 0.2, dip = o.dip ?? 0.12;
    if (t < at - pre) return { k: 0, dip: 0, phase: 'before' };
    if (t < at) { const u = E.inOut(clamp((t - (at - pre)) / pre)); return { k: -dip * u, dip: u, phase: 'anticip' }; }
    if (t < at + rise) { const u = E.out(clamp((t - at) / rise)); return { k: lerp(-dip, 1 + over, u), dip: 1 - u, phase: 'drive' }; }
    if (t < at + rise + settle) { const u = E.inOut(clamp((t - at - rise) / settle)); return { k: lerp(1 + over, 1, u), dip: 0, phase: 'settle' }; }
    return { k: 1, dip: 0, phase: 'held' };
  };
  D.shake = (t, at, amp = 12, dur = 0.45) => {
    const u = t - at; if (u < 0 || u >= dur) return [0, 0];
    const a = Math.min(12, amp) * Math.pow(1 - u / dur, 2);
    return [Math.sin(u * 83) * a, Math.cos(u * 67 + 1) * a * 0.8];
  };
  D.tremor = (t, t0, amp = 0.012, f = 40) => (t < t0 ? 0 : amp * Math.sin(t * f) * clamp((t - t0) / 0.3));
  // apply a path key to a three.js camera: FW.setCam + a vertical frame shift (sh, fraction of H) + a pixel shake
  D.applyCam = (cam, k, W, H, shake = [0, 0]) => {
    FW.setCam(cam, k.p, k.l, k.f);
    cam.setViewOffset(W, H, shake[0], -(k.sh || 0) * H + shake[1], W, H);
    cam.updateMatrixWorld();
  };
  globalThis.DIRECT = D;
})();
