// Cut-out silhouette rig (2.5D): hand-shaped profile parts on joints, like a shadow-puppet master's figures,
// living on a plane inside the 3D layered world. A second copy drawn behind, nudged toward the light, gives
// the glowing rim edge. Units: metres; the figure faces +x (mirror with dir = -1).
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;

  // smooth closed outline through points (Catmull-Rom), as a flat mesh
  function shapeGeo(pts, closed = true) {
    const s = new THREE.Shape();
    const v = pts.map(([x, y]) => new THREE.Vector2(x, y));
    s.moveTo(v[0].x, v[0].y);
    const curve = new THREE.SplineCurve(closed ? [...v, v[0]] : v);
    const sp = curve.getPoints(Math.max(24, pts.length * 8));
    for (let i = 1; i < sp.length; i++) s.lineTo(sp[i].x, sp[i].y);
    return new THREE.ShapeGeometry(s, 1);
  }
  FW.shapeGeo = shapeGeo;
  FW.RIM_FADE = { value: new THREE.Vector2(0.02, 0.6) };
  FW.rimFadeMat = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRimFade = FW.RIM_FADE;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWorldY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 rfw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nrfw = instanceMatrix * rfw;\n#endif\nvWorldY = (modelMatrix * rfw).y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vWorldY;\nuniform vec2 uRimFade;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= smoothstep(uRimFade.x, uRimFade.y, vWorldY);');
    };
    m.customProgramCacheKey = () => 'rimfade'; m.transparent = true; return m;
  };
  // a braid: a tapered strip with rope-like notches along both edges
  function braidGeo(len, w0, w1, bumps = 3) {
    const sh = new THREE.Shape(), N = bumps * 2, L = [], R = [];
    for (let i = 0; i <= N; i++) { const k = i / N, y = -k * len, w = FW.lerp(w0, w1, k) / 2 * (i % 2 ? 0.72 : 1.0); L.push([-w, y]); R.push([w, y]); }
    sh.moveTo(L[0][0], L[0][1]); for (const q of L.slice(1)) sh.lineTo(q[0], q[1]); for (const q of R.reverse()) sh.lineTo(q[0], q[1]);
    return new THREE.ShapeGeometry(sh);
  }
  // a tapered ribbon along a polyline (for hair locks, ropes, cloth tails)
  function ribbonGeo(len, w0, w1, seg = 10) {
    const pos = [], idx = [];
    for (let i = 0; i <= seg; i++) { const k = i / seg, y = -k * len, w = FW.lerp(w0, w1, k) / 2; pos.push(-w, y, 0, w, y, 0); if (i < seg) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }

  // ---- part outlines (profile, facing +x). Each part's pivot is its origin. ----
  const PARTS = {
    torso: (b) => [[0.1, -0.02], [0.13, 0.12], [0.15 + 0.02 * b, 0.3], [0.165 + 0.02 * b, 0.4], [0.12, 0.52], [0.06, 0.585], [-0.05, 0.6], [-0.13, 0.54], [-0.17 - 0.015 * b, 0.42], [-0.15, 0.24], [-0.12, 0.06], [-0.11, -0.04], [0.0, -0.07]],
    torsoM: (b) => [[0.11, -0.04], [0.13, 0.1], [0.145, 0.24], [0.158 + 0.012 * b, 0.36], [0.152 + 0.01 * b, 0.46], [0.115, 0.54], [0.07, 0.585], [-0.06, 0.6], [-0.15, 0.565], [-0.19 - 0.012 * b, 0.47], [-0.185 - 0.01 * b, 0.32], [-0.155, 0.15], [-0.13, -0.04], [0.0, -0.07]],
    tunicM: (len) => [[-0.14, 0.1], [0.14, 0.1], [0.148, 0.03], [0.142, 0.0], [0.15, -0.04], [0.158, -len * 0.5], [0.168, -len], [0.06, -len - 0.012], [-0.06, -len - 0.008], [-0.168, -len], [-0.158, -len * 0.5], [-0.15, -0.04], [-0.142, 0.0], [-0.148, 0.03]],
    headSamsonB: () => [[-0.065, -0.02], [0.06, -0.02], [0.075, 0.02], [0.105, -0.015], [0.14, 0.0], [0.165, 0.035], [0.168, 0.075], [0.15, 0.11], [0.158, 0.145], [0.15, 0.163], [0.176, 0.2], [0.152, 0.214], [0.153, 0.243], [0.136, 0.282], [0.1, 0.33], [0.03, 0.36], [-0.06, 0.356], [-0.13, 0.322], [-0.168, 0.25], [-0.172, 0.15], [-0.15, 0.06], [-0.1, 0.02]],
    torsoF: (b) => [[0.12, -0.02], [0.14, 0.14], [0.155, 0.32], [0.14, 0.44], [0.09, 0.54], [0.04, 0.6], [-0.06, 0.6], [-0.12, 0.52], [-0.155, 0.38], [-0.14, 0.18], [-0.12, 0.0], [0.0, -0.06]],
    // head + neck with beard and the hair mass (Samson); pivot = base of the neck
    headSamson: () => [[-0.05, -0.02], [0.05, -0.02], [0.07, 0.035], [0.125, 0.025], [0.152, 0.075], [0.142, 0.115], [0.156, 0.145], [0.148, 0.163], [0.176, 0.2], [0.152, 0.214], [0.153, 0.243], [0.136, 0.282], [0.1, 0.33], [0.03, 0.36], [-0.06, 0.356], [-0.13, 0.322], [-0.168, 0.25], [-0.172, 0.15], [-0.14, 0.06], [-0.09, 0.02]],
    headBald: () => [[-0.045, -0.02], [0.05, -0.02], [0.055, 0.06], [0.1, 0.06], [0.125, 0.1], [0.13, 0.15], [0.148, 0.185], [0.133, 0.205], [0.138, 0.235], [0.122, 0.27], [0.09, 0.305], [0.03, 0.325], [-0.04, 0.32], [-0.1, 0.29], [-0.125, 0.23], [-0.12, 0.15], [-0.09, 0.08], [-0.06, 0.03]],
    headWoman: () => [[-0.04, -0.02], [0.045, -0.02], [0.05, 0.06], [0.09, 0.075], [0.115, 0.11], [0.125, 0.16], [0.14, 0.19], [0.125, 0.21], [0.13, 0.24], [0.115, 0.27], [0.09, 0.3], [0.06, 0.33], [0.0, 0.355], [-0.08, 0.35], [-0.15, 0.3], [-0.2, 0.18], [-0.24, 0.02], [-0.26, -0.12], [-0.17, -0.1], [-0.1, -0.02]],
    headVeil: () => [[-0.04, -0.02], [0.045, -0.02], [0.05, 0.06], [0.09, 0.075], [0.115, 0.11], [0.125, 0.16], [0.14, 0.19], [0.125, 0.21], [0.13, 0.24], [0.115, 0.27], [0.105, 0.3], [0.13, 0.325], [0.1, 0.375], [0.03, 0.405], [-0.07, 0.395], [-0.16, 0.34], [-0.22, 0.22], [-0.26, 0.04], [-0.29, -0.16], [-0.32, -0.36], [-0.25, -0.34], [-0.2, -0.38], [-0.15, -0.22], [-0.1, -0.03]],
    headFeather: () => [[-0.045, -0.02], [0.05, -0.02], [0.055, 0.06], [0.1, 0.06], [0.125, 0.1], [0.13, 0.15], [0.148, 0.185], [0.133, 0.205], [0.138, 0.235], [0.13, 0.27], [0.135, 0.3], [0.15, 0.33], [0.17, 0.42], [0.16, 0.5], [0.13, 0.535], [0.11, 0.52], [0.09, 0.55], [0.06, 0.535], [0.03, 0.56], [0.0, 0.545], [-0.03, 0.56], [-0.06, 0.54], [-0.09, 0.55], [-0.115, 0.52], [-0.14, 0.5], [-0.15, 0.42], [-0.135, 0.33], [-0.125, 0.29], [-0.125, 0.18], [-0.09, 0.08], [-0.06, 0.03]],
    headElder: () => [[-0.045, -0.02], [0.05, -0.02], [0.06, 0.03], [0.1, -0.06], [0.13, 0.05], [0.13, 0.12], [0.147, 0.18], [0.133, 0.2], [0.138, 0.23], [0.125, 0.27], [0.15, 0.3], [0.12, 0.37], [0.03, 0.4], [-0.08, 0.39], [-0.15, 0.33], [-0.14, 0.24], [-0.12, 0.15], [-0.09, 0.08], [-0.06, 0.03]],
    upperArm: (b) => [[-0.055 - 0.01 * b, 0.02], [0.05 + 0.012 * b, 0.02], [0.062 + 0.012 * b, -0.08], [0.05, -0.2], [0.04, -0.29], [-0.035, -0.3], [-0.045, -0.18], [-0.055 - 0.01 * b, -0.06]],
    foreArm: (b) => [[-0.042, 0.015], [0.044 + 0.006 * b, 0.015], [0.05 + 0.008 * b, -0.07], [0.035, -0.22], [0.028, -0.27], [-0.03, -0.27], [-0.035, -0.18], [-0.046, -0.06]],
    hand: () => [[-0.03, 0.01], [0.03, 0.01], [0.05, -0.04], [0.07, -0.05], [0.065, -0.07], [0.04, -0.07], [0.04, -0.11], [0.02, -0.135], [-0.02, -0.13], [-0.035, -0.08]],
    fist: () => [[-0.032, 0.01], [0.034, 0.01], [0.05, -0.04], [0.045, -0.09], [0.0, -0.105], [-0.04, -0.085], [-0.045, -0.04]],
    thigh: (b) => [[-0.075 - 0.01 * b, 0.03], [0.08 + 0.01 * b, 0.03], [0.085 + 0.012 * b, -0.12], [0.062, -0.34], [0.055, -0.44], [-0.05, -0.44], [-0.065, -0.3], [-0.08, -0.12]],
    shin: (b) => [[-0.05, 0.02], [0.052, 0.02], [0.048, -0.12], [0.04, -0.33], [0.032, -0.42], [-0.03, -0.42], [-0.05, -0.3], [-0.068 - 0.01 * b, -0.12]],
    foot: () => [[-0.045, 0.02], [0.035, 0.02], [0.07, -0.04], [0.17, -0.055], [0.19, -0.075], [0.17, -0.085], [-0.06, -0.085], [-0.07, -0.05]],
    tunic: (len, fl) => [[-0.13, 0.08], [0.13, 0.08], [0.17, -0.1], [0.2 + fl, -len * 0.65], [0.23 + fl, -len], [0.12, -len + 0.03], [0.02, -len - 0.01], [-0.09, -len + 0.02], [-0.21 - fl, -len], [-0.19 - fl, -len * 0.6], [-0.16, -0.1]],
    robe: (len, fl) => [[-0.13, 0.08], [0.13, 0.08], [0.16, -0.2], [0.2 + fl, -len * 0.6], [0.26 + fl, -len], [0.0, -len - 0.01], [-0.26 - fl, -len], [-0.22 - fl, -len * 0.55], [-0.16, -0.2]],
    cape: (len) => [[0.06, 0.02], [-0.02, 0.045], [-0.085, -0.08], [-0.11, -len * 0.4], [-0.15, -len * 0.8], [-0.21, -len], [-0.06, -len * 0.97], [-0.03, -len * 0.62], [0.0, -len * 0.3], [0.04, -0.08]],
  };

  // build a cut-out figure. o: { kind: samson|woman|elder|feather|bald|youth, dir: 1|-1, base, rim, scale, cape, robe (long), locks }
  FW.cut = (o = {}) => {
    const b = o.build === undefined ? 1 : o.build;
    const root = new THREE.Group();
    const flip = new THREE.Group(); flip.scale.x = o.dir === -1 ? -1 : 1; root.add(flip);
    const baseM = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.base || '#0B0810'), transparent: true, side: THREE.DoubleSide });
    const rimM = FW.rimFadeMat(new THREE.MeshBasicMaterial({ color: new THREE.Color(o.rim || '#FFC08E'), transparent: true, side: THREE.DoubleSide }));
    const farM = baseM;
    // two copies of the same rig: rim (behind, nudged toward the light) and body
    function rig(mat, z) {
      const g = new THREE.Group(); g.position.z = z;
      const mk = (geo, m = mat) => new THREE.Mesh(geo, m);
      const hips = new THREE.Group(); hips.position.y = 0.95; g.add(hips);
      const spine = new THREE.Group(); hips.add(spine);
      const legs = {}, arms = {};
      for (const side of ['far', 'near']) {
        const dz = side === 'far' ? -0.0006 : 0.0009;
        const hp = new THREE.Group(); hp.position.set(side === 'far' ? -0.01 : 0.01, -0.03, dz); hips.add(hp);
        const th = mk(shapeGeo(PARTS.thigh(b))); th.scale.x = 1 + (b - 1) * 1.2; hp.add(th);
        const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn); kn.add(mk(shapeGeo(PARTS.shin(b))));
        const an = new THREE.Group(); an.position.y = -0.41; kn.add(an); an.add(mk(shapeGeo(PARTS.foot())));
        legs[side] = { hp, kn, an };
      }
      // clothing over the legs
      const longRobe = o.robe || o.kind === 'woman' || o.kind === 'elder';
      const female = o.kind === 'woman' || o.kind === 'veiled';
      const skirt = mk(shapeGeo(longRobe ? PARTS.robe(0.86, 0.04) : PARTS.tunicM(0.46))); skirt.position.z = 0.0015; hips.add(skirt);
      const torso = mk(shapeGeo(female ? PARTS.torso(b) : PARTS.torsoM(b))); torso.scale.x = 1 + (b - 1) * 0.9; torso.position.z = 0.0012; spine.add(torso);
      let cape = null;
      if (o.cape) { cape = new THREE.Group(); cape.position.set(-0.11, 0.52, -0.002); spine.add(cape); cape.add(mk(shapeGeo(PARTS.cape(0.92)))); }
      const neck = new THREE.Group(); neck.position.set(0.0, 0.565, 0.0013); spine.add(neck);
      const headKey = { samson: 'headSamsonB', woman: 'headWoman', veiled: 'headVeil', elder: 'headElder', feather: 'headFeather', bald: 'headBald', youth: 'headBald' }[o.kind || 'samson'];
      neck.add(mk(shapeGeo(PARTS[headKey]())));
      // locks: 7 braids (Samson), as chains of tapered segments that bend with wind
      const locks = [];
      if ((o.kind || 'samson') === 'samson' && o.locks !== false) {
        for (let i = 0; i < 7; i++) {
          const root2 = new THREE.Group(); root2.position.set(-0.08 - (i % 3) * 0.025, 0.27 - i * 0.022, (i % 2 ? -1 : 1) * 0.0004); neck.add(root2);
          const segs = []; let parent = root2;
          const L = 0.12 + (i % 3) * 0.012;
          for (let k = 0; k < 4; k++) { const sg = new THREE.Group(); if (k > 0) sg.position.y = -L; parent.add(sg); sg.add(mk(braidGeo(L + 0.008, 0.05 - k * 0.006, 0.044 - k * 0.006, 3))); segs.push(sg); parent = sg; }
          locks.push({ segs, i });
        }
      }
      for (const side of ['far', 'near']) {
        const dz = side === 'far' ? -0.0009 : 0.0016;
        const sh = new THREE.Group(); sh.position.set(-0.02, 0.48, dz); spine.add(sh);
        const ua = mk(shapeGeo(PARTS.upperArm(b))); ua.scale.x = 1 + (b - 1) * 1.8; sh.add(ua);
        const el = new THREE.Group(); el.position.y = -0.29; sh.add(el); const fa = mk(shapeGeo(PARTS.foreArm(b))); fa.scale.x = 1 + (b - 1) * 1.6; el.add(fa);
        const wr = new THREE.Group(); wr.position.y = -0.265; el.add(wr);
        const open = mk(shapeGeo(PARTS.hand())), fist = mk(shapeGeo(PARTS.fist())); wr.add(open, fist); fist.visible = false;
        const grip = new THREE.Group(); grip.position.set(0.01, -0.07, 0.001); wr.add(grip);
        arms[side] = { sh, el, wr, open, fist, grip };
      }
      return { g, hips, spine, legs, arms, neck, locks, cape, skirt };
    }
    const rim = rig(rimM, -0.004), body = rig(baseM, 0);
    flip.add(rim.g, body.g);
    root.rigs = [rim, body]; root.body = body; root.rimRig = rim; root.baseM = baseM; root.rimM = rimM;
    root.k = o.scale || 1; root.scale.setScalar(root.k);
    // light direction in screen space (x right, y up) for the rim offset
    root.light = o.light || [-0.6, 0.8];
    root.rimW = o.rimW === undefined ? 0.014 : o.rimW;
    root.setRim = (c, w) => { rimM.color.set(c); if (w !== undefined) root.rimW = w; };
    root.pose = (p = {}, t = 0) => { for (const r of root.rigs) FW.cutPose(r, p, t); const L = root.light, n = Math.hypot(L[0], L[1]) || 1, d = o.dir === -1 ? -1 : 1; const rw = root.rimW * (FW.RIM_K || 1); rim.g.position.x = (L[0] / n) * rw * d / root.k; rim.g.position.y = (L[1] / n) * rw / root.k; };
    root.setOpacity = (a) => { baseM.opacity = a; rimM.opacity = a; };
    root.pose({});
    return root;
  };

  // pose (angles in radians, positive = counter-clockwise in the figure's facing frame):
  // lean (spine forward +), headX (nod down +), hipY (crouch), armNear/armFar: {s shoulder (forward-up +), e elbow (bend +), w wrist, fist}
  // legNear/legFar: {h hip (forward +), k knee (bend +), a ankle}; wind (hair/cape); hold arms etc.
  FW.cutPose = (r, p, t) => {
    const br = p.still ? 0 : Math.sin(t * 1.8 + (p.phase || 0));
    r.hips.position.y = 0.95 + (p.hipY || 0) + br * 0.003;
    r.hips.rotation.z = -(p.hipLean || 0);
    r.spine.rotation.z = -(p.lean || 0) - br * 0.008;
    r.neck.rotation.z = -(p.headX || 0);
    for (const side of ['near', 'far']) {
      const a = p[side === 'near' ? 'armNear' : 'armFar'] || {};
      const A = r.arms[side];
      A.sh.rotation.z = (a.s || 0); A.el.rotation.z = (a.e || 0); A.wr.rotation.z = (a.w || 0);
      A.open.visible = !a.fist; A.fist.visible = !!a.fist;
      const l = p[side === 'near' ? 'legNear' : 'legFar'] || {};
      const L = r.legs[side];
      L.hp.rotation.z = (l.h || 0); L.kn.rotation.z = -(l.k || 0); L.an.rotation.z = (l.a || 0) - (l.h || 0) + (l.k || 0);
    }
    const wind = p.wind || 0;
    r.locks.forEach(({ segs, i }) => {
      segs.forEach((sg, k) => {
        const sway = Math.sin(t * 1.6 + i * 0.8 + k * 0.6) * 0.05 * (1 + wind * 2);
        const blow = -wind * (0.32 + 0.12 * Math.sin(t * 7 + i * 1.7 + k)) * (k === 0 ? 0.6 : 0.35);
        sg.rotation.z = (k === 0 ? -0.25 - (p.hairBack || 0) : 0.06) + sway + blow + (p.headX || 0) * (k === 0 ? 0.6 : 0);
      });
    });
    if (r.cape) r.cape.rotation.z = (p.lean || 0) * 0.6 - wind * (0.18 + 0.07 * Math.sin(t * 6.3)) + Math.sin(t * 1.4) * 0.02;
  };

  // walk cycle (profile)
  FW.cutWalk = (ph, amt = 1) => {
    const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
    return { legNear: { h: 0.45 * s * amt, k: Math.max(0, -c) * 0.9 * amt + 0.08 }, legFar: { h: -0.45 * s * amt, k: Math.max(0, c) * 0.9 * amt + 0.08 },
      armNear: { s: -0.35 * s * amt, e: 0.35 }, armFar: { s: 0.35 * s * amt, e: 0.35 }, hipY: -0.02 - Math.abs(Math.sin(ph * Math.PI * 2)) * 0.02 * amt };
  };

  FW.CUT = {
    stand: { armNear: { s: 0.08, e: 0.15 }, armFar: { s: -0.06, e: 0.12 }, legNear: { h: 0.06, k: 0.04 }, legFar: { h: -0.06, k: 0.02 } },
    bound: { armNear: { s: 0.02, e: 0.05 }, armFar: { s: -0.02, e: 0.05 }, legNear: { h: 0.2, k: 0.3 }, legFar: { h: -0.15, k: 0.12 }, lean: 0.2, headX: 0.45, hipY: -0.05, hairBack: -0.2 },
    strain: { armNear: { s: 0.1, e: 0.0, fist: true }, armFar: { s: -0.1, e: 0.0, fist: true }, legNear: { h: 0.35, k: 0.5 }, legFar: { h: -0.25, k: 0.25 }, lean: 0.32, headX: 0.15, hipY: -0.12 },
    burst: { armNear: { s: 1.95, e: 0.3, fist: true }, armFar: { s: 1.55, e: 0.5, fist: true }, legNear: { h: 0.38, k: 0.18 }, legFar: { h: -0.42, k: 0.08 }, lean: -0.3, headX: -0.55, hipY: -0.03, hairBack: 0.2 },
    point: { armNear: { s: 1.55, e: 0.05 }, armFar: { s: -0.05, e: 0.2 }, legNear: { h: 0.12, k: 0.05 }, legFar: { h: -0.1, k: 0.03 } },
    pray: { armNear: { s: 1.0, e: 1.5 }, armFar: { s: 0.95, e: 1.55 }, headX: 0.25 },
    raise: { armNear: { s: 2.9, e: 0.1 }, armFar: { s: 2.7, e: 0.15 }, headX: -0.4, lean: -0.1 },
    sit: { hipY: -0.48, legNear: { h: 1.5, k: 1.5 }, legFar: { h: 1.45, k: 1.5 }, armNear: { s: 0.7, e: 0.9 }, armFar: { s: 0.6, e: 0.9 } },
    kneel: { hipY: -0.42, legNear: { h: 1.45, k: 1.55 }, legFar: { h: -0.2, k: 1.8 }, lean: 0.05 },
    swing0: { armNear: { s: 2.9, e: 0.6, fist: true }, armFar: { s: 0.9, e: 0.6 }, legNear: { h: 0.45, k: 0.3 }, legFar: { h: -0.45, k: 0.1 }, lean: -0.15, headX: -0.15 },
    swing1: { armNear: { s: 0.6, e: 0.1, fist: true }, armFar: { s: -0.4, e: 0.5 }, legNear: { h: 0.55, k: 0.5 }, legFar: { h: -0.5, k: 0.05 }, lean: 0.35, headX: 0.1, hipY: -0.08 },
    push: { armNear: { s: 1.5, e: 0.15 }, armFar: { s: 1.45, e: 0.2 }, legNear: { h: 0.45, k: 0.4 }, legFar: { h: -0.6, k: 0.05 }, lean: 0.45, headX: 0.15, hipY: -0.08 },
    lean: { lean: 0.25, armNear: { s: 0.9, e: 0.8 }, armFar: { s: 0.5, e: 0.9 } },
  };
})();
// front-facing cut-out (for the pillars): symmetric body, arms reach out to both sides
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  const sg = FW.shapeGeo;
  FW.cutFront = (o = {}) => {
    const root = new THREE.Group();
    const baseM = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.base || '#0B0810'), side: THREE.DoubleSide });
    const rimM = FW.rimFadeMat(new THREE.MeshBasicMaterial({ color: new THREE.Color(o.rim || '#FFC08E'), transparent: true, side: THREE.DoubleSide }));
    function rig(mat, z) {
      const g = new THREE.Group(); g.position.z = z; const mk = (geo) => new THREE.Mesh(geo, mat);
      const hips = new THREE.Group(); hips.position.y = 0.95; g.add(hips);
      const legs = [];
      for (const sx of [-1, 1]) { const hp = new THREE.Group(); hp.position.x = sx * 0.1; hips.add(hp); hp.add(mk(sg([[-0.085, 0.03], [0.085, 0.03], [0.07, -0.44], [-0.065, -0.44]]))); const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn); kn.add(mk(sg([[-0.062, 0.02], [0.062, 0.02], [0.05, -0.2], [0.045, -0.42], [0.085 * sx, -0.47], [-0.045, -0.47], [-0.05, -0.3]]))); legs.push({ hp, kn }); }
      // a belted tunic that flares over the thighs
      hips.add(mk(sg([[-0.16, 0.1], [0.16, 0.1], [0.2, -0.05], [0.27, -0.36], [0.24, -0.4], [0.1, -0.37], [0.0, -0.41], [-0.1, -0.37], [-0.24, -0.4], [-0.27, -0.36], [-0.2, -0.05]])));
      const spine = new THREE.Group(); hips.add(spine);
      // a strong V-shaped torso: broad shoulders, narrow waist, a neck
      spine.add(mk(sg([[-0.15, 0.0], [0.15, 0.0], [0.17, 0.18], [0.23, 0.38], [0.26, 0.47], [0.21, 0.54], [0.07, 0.565], [0.055, 0.62], [-0.055, 0.62], [-0.07, 0.565], [-0.21, 0.54], [-0.26, 0.47], [-0.23, 0.38], [-0.17, 0.18]])));
      const head = new THREE.Group(); head.position.y = 0.6; head.scale.setScalar(0.8); spine.add(head);
      const hk = o.hair || 'short';
      head.add(mk(sg([[-0.06, 0.0], [0.06, 0.0], [0.09, 0.06], [0.115, 0.15], [0.12, 0.24], [0.1, 0.31], [0.05, 0.355], [0.0, 0.365], [-0.05, 0.355], [-0.1, 0.31], [-0.12, 0.24], [-0.115, 0.15], [-0.09, 0.06]])));
      // hair: a ragged mass growing back to the jaw (Judges 16:22), or long locks
      if (hk === 'short') head.add(mk(sg([[-0.125, 0.14], [-0.14, 0.2], [-0.135, 0.27], [-0.115, 0.33], [-0.075, 0.375], [-0.03, 0.39], [0.0, 0.395], [0.035, 0.39], [0.08, 0.37], [0.115, 0.33], [0.135, 0.27], [0.14, 0.2], [0.125, 0.14], [0.11, 0.22], [0.06, 0.28], [0.0, 0.29], [-0.06, 0.28], [-0.11, 0.22]])));
      else if (hk !== 'bald') for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const l = mk(sg([[-0.022, 0], [0.022, 0], [0.016, -0.5 + i * 0.04], [-0.016, -0.5 + i * 0.04]])); l.position.set(sx * (0.08 + i * 0.022), 0.3 - i * 0.03, -0.001); l.rotation.z = sx * (0.1 + i * 0.05); head.add(l); }
      const arms = [];
      for (const sx of [-1, 1]) {
        const sh = new THREE.Group(); sh.position.set(sx * 0.25, 0.49, 0.001); spine.add(sh);
        sh.add(mk(sg([[-0.07, 0.02], [-0.06, 0.06], [-0.03, 0.085], [0.0, 0.09], [0.03, 0.085], [0.06, 0.06], [0.075, 0.02], [0.085, -0.08], [0.06, -0.33], [-0.055, -0.33], [-0.075, -0.08]])));
        const el = new THREE.Group(); el.position.y = -0.32; sh.add(el); el.add(mk(sg([[-0.058, 0.02], [0.058, 0.02], [0.06, -0.12], [0.042, -0.3], [-0.042, -0.3], [-0.05, -0.12]])));
        const hand = mk(sg([[-0.045, 0], [0.045, 0], [0.06, -0.06], [0.05, -0.12], [0.0, -0.13], [-0.05, -0.11], [-0.055, -0.05]])); hand.position.y = -0.29; el.add(hand);
        arms.push({ sh, el, sx });
      }
      return { g, hips, spine, head, arms, legs };
    }
    const rim = rig(rimM, -0.004), body = rig(baseM, 0); root.add(rim.g, body.g);
    root.light = o.light || [0, 1]; root.rimW = o.rimW || 0.016;
    root.pose = (p = {}, t = 0) => {
      for (const r of [rim, body]) {
        r.hips.position.y = 0.95 + (p.hipY || 0); r.spine.rotation.z = p.tilt || 0; r.head.rotation.z = p.headTilt || 0; r.head.position.y = 0.6 - (p.headDrop || 0);
        r.arms.forEach((a) => { a.sh.rotation.z = a.sx * (p.spread === undefined ? 0.1 : p.spread); a.el.rotation.z = a.sx * (p.elbow || 0); }); // positive spread opens the arms outward
        r.legs.forEach((l, i) => { const sx = i ? 1 : -1; l.hp.rotation.z = sx * (p.legSpread || 0.05); l.kn.rotation.z = -sx * (p.knee || 0); });
      }
      const n = Math.hypot(root.light[0], root.light[1]) || 1, rw = root.rimW * (FW.RIM_K || 1); rim.g.position.x = (root.light[0] / n) * rw; rim.g.position.y = (root.light[1] / n) * rw;
    };
    root.setRim = (c, w) => { rimM.color.set(c); if (w !== undefined) root.rimW = w; };
    root.pose({});
    return root;
  };
  // the people of Ep 1 in the cut-out look
  FW.PEOPLE = {
    samson: (o = {}) => FW.cut(Object.assign({ kind: 'samson', build: 1.15 }, o)),
    samsonBald: (o = {}) => FW.cut(Object.assign({ kind: 'bald', build: 1.15, locks: false }, o)),
    father: (o = {}) => FW.cut(Object.assign({ kind: 'elder', robe: true }, o)),
    woman: (o = {}) => FW.cut(Object.assign({ kind: 'woman', build: 0.9 }, o)),
    veiled: (o = {}) => FW.cut(Object.assign({ kind: 'veiled', build: 0.88, robe: true }, o)),
    soldier: (o = {}) => FW.cut(Object.assign({ kind: 'feather', build: 1.0 }, o)),
    man: (o = {}) => FW.cut(Object.assign({ kind: 'youth', build: 1.0 }, o)),
    elder: (o = {}) => FW.cut(Object.assign({ kind: 'elder', robe: true, build: 1.0 }, o)),
  };
})();
