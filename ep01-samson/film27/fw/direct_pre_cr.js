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
        const k = (E[B.ease || 'inOut'] || E.inOut)(clamp((t - A.t) / Math.max(1e-6, B.t - A.t)));
        return { p: lerp3(A.p, B.p, k), l: lerp3(A.l, B.l, k), f: lerp(A.f ?? 38, B.f ?? 38, k), sh: lerp(A.sh ?? 0, B.sh ?? 0, k) };
      }
    }
    return Object.assign({ sh: 0 }, keys[keys.length - 1]);
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
