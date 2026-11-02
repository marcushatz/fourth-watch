// DIORAMA: a data-driven set (ENGINE_ROADMAP.md step 1). No per-shot code: a set is a RECIPE, a shot is STAGED from the
// score's `dio` field. Lintel's default framing (a high-angle isometric wide on a small diorama, 60-70% of their shots)
// is the default here.
//
//   DIORAMA.set('camp', {                          // register before film.js builds (an episode's sets.js)
//     sky: 'dusk',                                 // 'day' | 'dusk' | 'night' | 'dawn'
//     ground: { radius: 7, cols: ['#B9A36A', '#A8935E'], hills: 0.25, seed: 3 },   // a round island that falls away at its edge
//     props:  [{ id: 'tent', kind: 'tent', at: [-1.6, -1.2], s: 1.1, rot: 0.4, cols: ['#D8C4A0', '#7A4E2A'] }, { kind: 'fire', at: [0, 0] }],
//     people: [{ id: 'jacob', kind: 'person', v: 2, at: [0.6, 0.5], pose: 'stand' }],
//   });
//   add('S05', 'diorama', 'camp', t0, { dio: {
//     cam: { preset: 'iso', on: 'jacob', move: 'push', amt: 0.15, from: 'came', dur: 1.5 },     // presets: iso isoClose eye top
//     act: [ { who: 'esau', at: 'came', do: 'walk', to: [1.4, 0.6], dur: 2.2 },               // do: walk | enter | exit; or pose
//            { who: 'esau', at: 'tired', pose: 'kneel' } ],
//   } });
// Times in `at`/`from` are beat names (shot.beats) or seconds. Everything is a pure function of t.
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP2 = globalThis.PP2, D = globalThis.DIRECT;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const RECIPES = {}, KINDS = {};
  // DIORAMA.prop(kind, (p, rng) => Object3D): an episode adds its own prop kinds (a calf, a serpent on a pole...).
  // A prop may define o.userData.frame(t, evs, shot): it gets the fx events aimed at it (see shot.dio.fx below).
  globalThis.DIORAMA = { set: (name, r) => { RECIPES[name] = r; }, prop: (kind, fn) => { KINDS[kind] = fn; }, RECIPES, KINDS };
  const W = S.W, H = S.H, { clamp, lerp, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const q = (v, n = 60) => Math.round(v * n) / n;
  const SKY = {
    day:   { top: '#3E6FB0', mid: '#7FA6D6', hor: '#E6D8B8', sunDir: [-0.6, 0.55, -0.4], key: '#FFF1D6', keyI: 3.2, hemi: ['#CFE0F6', '#B49A72', 1.3], fog: '#D8D2C2', tint: [1, 0.98, 0.94] },
    dusk:  { top: '#2A2F5E', mid: '#7A5A86', hor: '#F0A070', sunDir: [-0.8, 0.12, -0.5], key: '#FFB27A', keyI: 3.0, hemi: ['#8A86B8', '#7A5A44', 1.1], fog: '#B48A8A', tint: [1.04, 0.9, 0.86] },
    night: { top: '#0E1630', mid: '#1C2A50', hor: '#3A4A70', sunDir: [-0.5, 0.4, -0.6], key: '#A8BCE4', keyI: 1.8, hemi: ['#5262A0', '#3A3040', 0.9], fog: '#2A3450', tint: [0.8, 0.84, 1.0] },
    dawn:  { top: '#3A5A96', mid: '#C2A0B8', hor: '#FFD2A0', sunDir: [0.7, 0.15, -0.5], key: '#FFD9B0', keyI: 2.8, hemi: ['#B8C4E6', '#A88A70', 1.2], fog: '#E0C8BA', tint: [1.02, 0.95, 0.9] },
  };
  // camera presets: elevation (deg), distance (m), fov, vertical frame shift. 'iso' = Lintel's high-angle diorama wide.
  const PRESET = {
    iso:      { el: 46, dist: 24, fov: 24, az: 34, ty: 0.2, sh: 0.04 },   // the whole small set, high and tilted (Lintel's default)
    isoClose: { el: 30, dist: 6.5, fov: 28, az: 28, ty: 0.9, sh: 0.05 },
    eye:      { el: 5, dist: 3.6, fov: 34, az: 12, ty: 1.15, sh: 0.02 },
    top:      { el: 84, dist: 16, fov: 30, az: 0, ty: 0, sh: 0.0 },
  };
  const built = {};
  let cam;

  function islandH(r, hills, seed) {
    return (x, z) => {
      const d = Math.hypot(x, z), edge = d > r ? -Math.pow(d - r, 1.5) * 0.9 : 0;
      return (FW.fbm(x * 0.18 + seed, z * 0.18, 3, 3) - 0.5) * hills + edge;
    };
  }
  function makeProp(p, rng) {
    let o;
    switch (p.kind) {
      case 'tent': o = LW.tent(rng, p.s ?? 1, ...(p.cols || [])); break;
      case 'fire': o = LW.fire(rng); break;
      case 'olive': o = LW.olive(rng, p.s ?? 1); break;
      case 'bush': o = LW.bush(rng, p.s ?? 1); break;
      case 'rock': o = LW.rock(rng, p.s ?? 1); break;
      case 'grass': o = LW.grassTuft(rng, p.s ?? 1); break;
      case 'banner': o = LW.banner(rng, p.s ?? 1, p.col); break;
      case 'crate': o = LW.crate(rng, p.s ?? 1); break;
      case 'pot': { o = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 9, 6, 0, 6.29, 0.5, 2.2), LW.M(p.col || '#6A4A36')); b.position.y = 0.24; o.add(b);
        const st = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 9), LW.M('#8A3A1E')); st.position.y = 0.36; o.add(st); o.scale.setScalar(p.s ?? 1); LW.shadowy(o); break; }   // a cooking pot (stew showing)
      default: if (KINDS[p.kind]) { o = KINDS[p.kind](p, rng); break; } throw new Error('diorama: unknown prop kind ' + p.kind);
    }
    if (p.rot != null) o.rotation.y = p.rot;
    return o;
  }
  const RAMP = (() => { const d = new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
  function paintify(scene) {
    const cache = new Map();
    scene.traverse((o) => {
      if (!o.isMesh || !o.material || !o.material.isMeshStandardMaterial) return;
      const m = o.material;
      if (m.metalness > 0.3 || m.userData.keep) { m.flatShading = false; m.needsUpdate = true; return; }   // gold and bronze keep a specular sheen
      if (!cache.has(m)) cache.set(m, new THREE.MeshToonMaterial({ color: m.color, map: m.map, vertexColors: m.vertexColors, emissive: m.emissive, emissiveIntensity: m.emissiveIntensity, gradientMap: RAMP, transparent: m.transparent, opacity: m.opacity, side: m.side }));
      o.material = cache.get(m);
    });
  }
  function buildSet(name) {
    const R = RECIPES[name]; if (!R) throw new Error('diorama: no recipe ' + name);
    const sk = Object.assign({}, SKY[R.sky || 'day'], R.skyOver || {}), rng = FW.rng(R.seed ?? 7);   // skyOver: a set's own sky, key and fog colours
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(C(sk.fog), ...(R.fog || [30, 90]));
    LW.paintTerrain = R.style === 'paint';
    scene.add(LW.sky({ top: sk.top, mid: sk.mid, hor: sk.hor, low: sk.fog, sunDir: sk.sunDir }));
    const hemi = new THREE.HemisphereLight(C(sk.hemi[0]), C(sk.hemi[1]), sk.hemi[2]); scene.add(hemi);
    const sun = new THREE.DirectionalLight(C(sk.key), sk.keyI); sun.position.set(...(R.sunPos || [-9, 11, 6])); sun.castShadow = true;   // key from the upper left
    sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = sc.bottom = -12; sc.right = sc.top = 12; sc.near = 1; sc.far = 40; scene.add(sun, sun.target);
    const g = R.ground || {}, r = g.radius ?? 7, cols = (g.cols || ['#B9A36A', '#A8935E', '#C2AE78']).map(C);
    scene.add(LW.terrain({ size: r * 3.2, seg: 96, hFn: islandH(r, g.hills ?? 0.25, g.seed ?? 3), seed: g.seed ?? 3,
      colFn: (x, z, y, ny, rnd) => { const c = cols[Math.floor(rnd * cols.length)].clone(); if (y < -0.4) c.lerp(C('#6A5A48'), clamp(-y / 3)); return c.multiplyScalar(0.92 + ny * 0.1); } }));
    const props = {}, fires = [];
    (R.props || []).forEach((p, i) => { const o = makeProp(p, rng); o.position.set(p.at[0], p.y ?? 0, p.at[1]); o.userData.rest = p; scene.add(o); props[p.id || 'p' + i] = o; if (p.kind === 'fire') fires.push(o); });
    // a fixed pool of warm lights for the fires (changing the light count recompiles shaders)
    const fireLights = fires.slice(0, 3).map((f) => { const L = new THREE.PointLight(C('#FF9A52'), 6, 7, 1.6); L.position.set(f.position.x, 0.6, f.position.z); scene.add(L); return L; });
    const actors = {};
    (R.people || []).forEach((p) => {
      const kind = p.kind || 'person', base = Object.assign({ v: p.v ?? 0 }, p.cast ? { cast: p.cast } : {}, p.base || {});
      const tall = RECIPES[name].style === 'paint';   // paint sets: a taller card, so raised tools and hands are never cut off (same pixels per metre)
      const hk = p.hires ? 2 : 1;   // hires: a figure the camera goes close to (twice the card resolution, same size in the world)
      const over = kind === 'person' ? (tall ? { cw: 1100 * hk, ch: 2000 * hk, footPx: 60 * hk, scale: 2.4 * hk, worldH: +(PP2.SIZES.person.worldH * 2000 / 1500).toFixed(4) } : { cw: 1000, ch: 1500, footPx: 60, scale: 2.4 }) : {};
      const bb = PP2.bill(kind, base, over); bb.position.set(p.at[0], 0, p.at[1]);
      scene.add(bb, bb.userData.caster); actors[p.id] = { bb, rest: p, kind };
    });
    // the 'paint' style (Fourth Watch visual spec v1): the world is shaded like the characters are drawn: flat tones in
    // three steps (lit / half / shadow), smooth surfaces, metal keeps its sheen, ink lines come from the post pass
    let key = null;
    if (R.style === 'paint') {
      paintify(scene);
      key = new THREE.SpotLight(C('#FFE2B0'), 0, 30, 0.5, 0.75, 1.2); key.castShadow = false; scene.add(key, key.target);   // the focal pool (shot.dio.key)
    }
    LW.paintTerrain = false;
    built[name] = { R, sk, scene, sun, hemi, props, fires, fireLights, actors, key };
  }

  // ---- staging: every actor's state at time t, from the shot's act list (pure function of t) ----
  const tOf = (shot, v, fb) => (typeof v === 'number' ? v : v == null ? fb : D.beat(shot, v, fb));
  function actorState(B, id, shot, t) {
    const a = B.actors[id], rest = a.rest;
    let pos = [rest.at[0], rest.at[1]], pose = rest.pose || 'stand', visible = rest.hidden ? false : true, item = rest.item, dist = 0, look = rest.look, strike = null, kk = rest.k, dir = rest.dir;
    // continuity: every earlier shot on the same set still counts (one set per story run), in time order
    const acts = [];
    for (const sh of S.SHOTS) if (sh.scene === 'diorama' && sh.v === shot.v && sh.t0 <= shot.t0 && sh.dio && sh.dio.act)
      for (const x of sh.dio.act) if (x.who === id) acts.push(Object.assign({ t0: tOf(sh, x.at, sh.t0), sh }, x));
    acts.sort((x, y) => x.t0 - y.t0);
    for (const x of acts) {
      if (t < x.t0) break;
      if (x.do === 'walk' || x.do === 'enter' || x.do === 'exit') {
        const from = x.from || (x.do === 'enter' ? [pos[0] + 6, pos[1]] : pos.slice()), to = x.to || (x.do === 'exit' ? [pos[0] + 6, pos[1]] : pos);
        const len = Math.hypot(to[0] - from[0], to[1] - from[1]), dur = x.dur ?? Math.max(0.6, len / 1.3);   // ~1.3 m/s
        const k = clamp((t - x.t0) / dur), e = ease.inOut(k);
        pos = [lerp(from[0], to[0], e), lerp(from[1], to[1], e)]; dist = len * e;
        if (x.do === 'enter') visible = true;
        pose = k < 1 ? 'walk' : (x.then || 'stand');
        if (x.do === 'exit' && k >= 1) visible = false;
      }
      if (x.pose) pose = x.pose;
      if (x.item !== undefined) item = x.item;
      if (x.look) look = x.look;
      if (x.hide) visible = false;
      if (x.show) visible = true;
      if (x.strike != null) strike = tOf(x.sh, x.strike, x.t0 + 0.4);   // a verb's key frame (e.g. the hammer lands) for poses with k
      if (x.k != null) kk = x.k;
      if (x.dir != null) dir = x.dir;   // a pose's side (fall / shield / reach)
    }
    return { pos, pose, visible, item, phase: dist * 4.2, look, strike, k: kk, dir };
  }
  // prop effects: shot.dio.fx = [{ on: propId, at, do: 'hide' | 'show' | any verb the prop understands, dur, ... }]
  // Like actors, every earlier shot on the same set still counts (continuity), so a burnt calf stays burnt.
  function propEvents(B, id, shot, t) {
    const evs = [];
    for (const sh of S.SHOTS) if (sh.scene === 'diorama' && sh.v === shot.v && sh.t0 <= shot.t0 && sh.dio && sh.dio.fx)
      for (const x of sh.dio.fx) if (x.on === id) evs.push(Object.assign({ t0: tOf(sh, x.at, sh.t0) }, x));
    return evs.sort((a, b) => a.t0 - b.t0).filter((e) => e.t0 <= t);
  }
  function subjectPoint(B, shot, on, t) {
    if (Array.isArray(on)) return on;
    if (on && B.actors[on]) { const s = actorState(B, on, shot, t); return [s.pos[0], 0, s.pos[1]]; }
    if (on && B.props[on]) { const p = B.props[on].position; return [p.x, 0, p.z]; }
    return [0, 0, 0];
  }
  // a point in the set: [x, y, z], or { of: actorId | propId, off: [dx, dy, dz] } (relative to where that actor is at time t)
  function setPoint(B, shot, v, t) {
    if (Array.isArray(v)) return v;
    const b = subjectPoint(B, shot, v.of, t), o = v.off || [0, 0, 0];
    return [b[0] + o[0], b[1] + o[1], b[2] + o[2]];
  }
  // a camera path: shot.dio.cam.path = [{ at, p, l, f, sh, ease }] (DIRECT.path keys; p and l are set points; at = beat or seconds)
  function camPath(B, shot, t, c) {
    const keys = c.path.map((k) => ({ t: tOf(shot, k.at, shot.t0), p: setPoint(B, shot, k.p, t), l: setPoint(B, shot, k.l, t), f: k.f ?? c.f ?? 32, sh: k.sh ?? c.sh ?? 0.04, ease: k.ease }));
    const K = D.path(t, keys);
    D.applyCam(cam, K, W, H, c.shakeAt != null ? D.shake(t, tOf(shot, c.shakeAt, 0), c.shakeAmp ?? 10) : [0, 0]);
    const d = Math.hypot(K.p[0] - K.l[0], K.p[1] - K.l[1], K.p[2] - K.l[2]);
    return { focus: c.focus ?? d, ap: c.ap ?? (d < 5 ? 3.4 : d < 9 ? 2.2 : 1.4) };
  }
  function camFor(B, shot, t) {
    const c = (shot.dio && shot.dio.cam) || {};
    if (c.path) return camPath(B, shot, t, c);
    const P = Object.assign({}, PRESET[c.preset || 'iso'], c);
    const t0 = tOf(shot, c.from, shot.t0), k = clamp((t - t0) / (c.dur ?? 1.6)), e = (D.ease[c.ease || 'inOut'] || D.ease.inOut)(k);
    let el = P.el, dist = P.dist, az = P.az;
    const amt = c.amt ?? 0.12;
    if (c.move === 'push') dist *= 1 - amt * e;
    if (c.move === 'pull') dist *= 1 + amt * e;
    if (c.move === 'orbit') az += (c.deg ?? 20) * e;
    if (c.move === 'crane') el += (c.deg ?? 18) * e;
    const on = c.move === 'follow' ? subjectPoint(B, shot, c.on, t) : subjectPoint(B, shot, c.on, c.move === 'follow' ? t : t0);
    const tgt = [on[0], (P.ty ?? 0.6), on[2]];
    const a = (az * Math.PI) / 180, b = (el * Math.PI) / 180;
    const p = [tgt[0] + Math.sin(a) * Math.cos(b) * dist, tgt[1] + Math.sin(b) * dist, tgt[2] + Math.cos(a) * Math.cos(b) * dist];
    D.applyCam(cam, { p, l: tgt, f: P.fov, sh: P.sh }, W, H, c.shakeAt != null ? D.shake(t, tOf(shot, c.shakeAt, 0)) : [0, 0]);
    return { focus: dist, ap: c.preset === 'eye' || c.preset === 'isoClose' ? 3.2 : 1.5 };
  }

  SCENES.diorama = {
    async build(env) {
      cam = env.cam;
      const used = new Set(S.SHOTS.filter((s) => s.scene === 'diorama').map((s) => s.v));
      for (const name of used) buildSet(name);
    },
    frame(t, shot, camera) {
      cam = camera;
      const B = built[shot.v]; if (!B) throw new Error('diorama: set not built ' + shot.v);
      const bill = [], anchors = {};
      if (globalThis.PP) globalThis.PP.simpEyes = shot.dio && shot.dio.faces === 'medium' ? 2 : null;   // the face rule by shot size (visual spec v1)
      const KY = shot.dio && shot.dio.key;   // the focal pool; shot.dio.keyFrom: the light arrives on a beat
      if (B.key) {
        if (KY) { const sp = subjectPoint(B, shot, KY.on, t), y = KY.y ?? 1.2, fr = KY.from || [-2.5, 7, 3]; B.key.position.set(sp[0] + fr[0], fr[1], sp[2] + fr[2]); B.key.target.position.set(sp[0], y, sp[2]); B.key.target.updateMatrixWorld();
          B.key.intensity = (KY.i ?? 40) * (shot.dio.keyFrom != null ? ease.inOut(clamp((t - shot.dio.keyFrom) / 0.6)) : 1); B.key.angle = KY.angle ?? 0.32; B.key.color.set(KY.col || '#FFE2B0'); }
        else B.key.intensity = 0;
      }
      for (const id of Object.keys(B.actors)) {
        const a = B.actors[id], st = actorState(B, id, shot, t);
        a.bb.visible = st.visible; if (!st.visible) continue;
        a.bb.position.set(st.pos[0], 0, st.pos[1]);
        const kNow = st.strike != null ? q(Math.max(0, Math.min(1.08, D.act(t, st.strike, { pre: 0.45, dip: 0.18, rise: 0.12, over: 0.06, settle: 0.2 }).k)), 30) : st.k;
        const draw = { pose: st.pose, phase: q(st.phase, 8), t: q(t, 12), item: st.item, look: st.look, k: kNow, dir: st.dir, fm: shot.dio && shot.dio.faces };
        a.bb.userData.update(JSON.stringify(draw), draw);
        a.bb.material.color.setRGB(...B.sk.tint);
        if (B.key) {   // paint style: a flat figure takes the light of where it stands (fires nearby, the focal pool, the set's ambient)
          const amb = (B.R.actorAmb ?? 1) * (a.rest.shade ?? 1), col = a.bb.material.color; col.multiplyScalar(amb);   // rest.shade: a figure standing in shadow
          for (const L of B.fireLights) { const d2 = (L.position.x - st.pos[0]) ** 2 + (L.position.z - st.pos[1]) ** 2, w = (L.intensity / 6) * 0.55 / (1 + d2 * 0.9); col.r += w; col.g += w * 0.55; col.b += w * 0.22; }
          if (KY && B.key.intensity > 0) { const tp = B.key.target.position, d = Math.hypot(tp.x - st.pos[0], tp.z - st.pos[1]), w = (KY.actor ?? 0.35) * (1 - Math.min(1, d / (KY.r ?? 2.2))); col.r += w; col.g += w * 0.88; col.b += w * 0.65; }
        }
        bill.push(a.bb); anchors[id] = [st.pos[0], st.pose === 'kneel' ? 1.3 : st.pose === 'sit' ? 1.15 : 2.0, st.pos[1]];   // the head, by pose
      }
      B.fires.forEach((f, i) => { const core = f.userData.core; if (core) core.scale.set(1, 0.85 + 0.15 * Math.sin(t * 13 + i), 1); });
      B.fireLights.forEach((L, i) => { L.intensity = (B.R.fireI ?? 6) * (0.86 + 0.1 * Math.sin(t * 11 + i * 2) + 0.06 * Math.sin(t * 23 + i)); });
      for (const [pid, o] of Object.entries(B.props)) {
        const rest = o.userData.rest || {}, show = (shot.dio && shot.dio.show) || null, hide = (shot.dio && shot.dio.hide) || [];
        if (!rest.hidden && !show && !hide.length && !o.userData.frame && !(shot.dio && shot.dio.fx)) continue;   // the common case: nothing to do
        const evs = propEvents(B, pid, shot, t);
        let vis = !rest.hidden; for (const e of evs) { if (e.do === 'hide') vis = false; if (e.do === 'show') vis = true; }
        if (show && show.includes(pid)) vis = true; if (hide.includes(pid)) vis = false;
        o.visible = vis;
        if (vis && o.userData.frame) o.userData.frame(t, evs, shot);
      }
      const c = camFor(B, shot, t);
      for (const [pid, o] of Object.entries(B.props)) anchors[pid] = anchors[pid] || [o.position.x, o.userData.anchorY ?? 0.6, o.position.z];
      const out = { scene: B.scene, sun: B.sun, bill, anchors, focus: c.focus, aperture: c.ap, maxR: 6, fgScale: 1.3, exposure: 1.06, sat: 1.04, bloom: 0.12 };
      // God's light (series canon: gold from the upper left, only where the text says God acts): shot.dio.rays = { on, from, dur, amt, y }
      const RY = shot.dio && shot.dio.rays;
      if (RY) { const k = clamp((t - tOf(shot, RY.from, shot.t0)) / (RY.dur ?? 0.8)); const p = subjectPoint(B, shot, RY.on, t); out.rays = { amt: (RY.amt ?? 1) * ease.inOut(k), target: [p[0], RY.y ?? 1.6, p[2]] }; }
      if (B.R.ink) out.ink = B.R.ink;   // { amt, w, thr, col }: ink lines on depth breaks (post pass)
      const FO = shot.dio && shot.dio.focus;   // { on, y, r0, r1, dark }: the frame falls off around the focal subject
      if (FO) { cam.updateMatrixWorld(); const sp = subjectPoint(B, shot, FO.on, t), pp = LW.project(cam, [sp[0], FO.y ?? 1.2, sp[2]]); out.focus2 = { uv: [pp[0] / W, 1 - pp[1] / H], r0: FO.r0 ?? 0.25, r1: FO.r1 ?? 0.75, dark: FO.dark ?? 0.45 }; }
      if (shot.dio && shot.dio.look) Object.assign(out, shot.dio.look);   // per-shot grade overrides (exposure, sat, bloom)
      if (shot.dio && typeof shot.dio.post === 'function') out.post = (ctx, t2, P) => shot.dio.post(ctx, t2, P, shot, W, H);   // a 2D overlay drawn over this shot's frame
      return out;
    },
  };
})();
