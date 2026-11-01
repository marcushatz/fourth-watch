// Fourth Watch hero rig v2: a jointed figure with legs, so people can act (walk, lunge, swing, push, kneel).
// Heroic proportions (~5.5 heads), smooth-shaded, dot eyes with a highlight, brows for expression,
// tunic + belt + mantle (men), long robe (women), bare forearms and shins, sandals. Replaces FW.figure.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, P = FW.PAL;
  const SM = (c, o = {}) => FW.mat(c, Object.assign({ flatShading: false }, o));
  const shade = (c, l) => '#' + new THREE.Color(c).offsetHSL(0, 0, l).getHexString();
  const cyl = (r0, r1, h, m, seg = 14) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.translate(0, -h / 2, 0); const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; return x; };
  const ball = (r, m, seg = 16) => { const x = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), m); x.castShadow = true; return x; };

  function lathe(pts, m, seg = 22, open = false) {
    const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
    const x = new THREE.Mesh(g, m); x.castShadow = true; x.receiveShadow = true; if (open) m.side = THREE.DoubleSide; return x;
  }
  function lockGeo(len, r0, r1, seed) {
    const R = FW.rng(seed);
    const pts = [0, 0.25, 0.5, 0.75, 1].map((k) => new THREE.Vector3((R() - 0.5) * 0.025, -k * len, -0.03 * k * k));
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 12, 1, 7, false);
    const pos = g.attributes.position, n = 13, ring = 8;
    for (let i = 0; i < n; i++) {
      const c = curve.getPointAt(i / (n - 1)), r = FW.lerp(r0, r1, Math.pow(i / (n - 1), 0.8)) * (1 + 0.12 * Math.sin(i * 1.7));
      for (let j = 0; j < ring; j++) { const idx = i * ring + j; const v = new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)).sub(c).multiplyScalar(r).add(c); pos.setXYZ(idx, v.x, v.y, v.z); }
    }
    g.computeVertexNormals(); return g;
  }

  // o: { skin, robe (tunic/robe colour), mantle, belt, trim, hair: samson|short|bald|long, hairColor, beard, beardColor,
  //      head: veil|feather|turban, veilColor, band, female, scale, glow, eyes: open|closed, build (1 = heroic), brows }
  FW.figure = (o = {}) => {
    const skin = o.skin || FW.SKIN[0], robe = o.robe || P.clay, mantle = o.mantle === undefined ? shade(robe, -0.1) : o.mantle;
    const female = !!o.female || o.head === 'veil';
    const build = o.build === undefined ? (female ? 0.85 : 1) : o.build;
    const glowM = o.glow ? new THREE.MeshBasicMaterial({ color: new THREE.Color(o.glow), transparent: true }) : null;
    const mSkin = glowM || SM(skin, { roughness: 0.62 });
    const mCloth = glowM || SM(robe, { roughness: 0.92 });
    const mMant = glowM || SM(mantle, { roughness: 0.92, side: THREE.DoubleSide });
    const mDark = SM('#1B120D', { roughness: 0.35 });
    const mSandal = SM('#4A2E1C', { roughness: 0.8 });
    const root = new THREE.Group();
    const hips = new THREE.Group(); hips.position.y = 0.93; root.add(hips);
    const spine = new THREE.Group(); hips.add(spine);
    // torso (tunic top): flattened lathe, wide chest
    const torso = lathe([[0.0, -0.02], [0.155, 0.0], [0.15, 0.1], [0.18, 0.25], [0.205, 0.36], [0.19, 0.44], [0.12, 0.5], [0.055, 0.54], [0.0, 0.545]], mCloth);
    torso.scale.set(1.18 * build + (female ? 0 : 0.05), 1, 0.8); spine.add(torso);
    const pelvis = ball(0.165, mCloth); pelvis.scale.set(1.12, 0.7, 0.85); pelvis.position.y = -0.02; hips.add(pelvis);
    // skirt: knee tunic (men) or ankle robe (women), hangs from the hips
    const skirtLen = female || o.long ? 0.86 : 0.48;
    const skirt = lathe([[0.17, 0.02], [0.2, -0.1], [0.25, -skirtLen * 0.6], [0.29 + (female ? 0.04 : 0), -skirtLen], [0.0, -skirtLen + 0.001]].map(([r, y]) => [r, y]), mCloth, 22);
    skirt.material = mCloth; hips.add(skirt);
    const skirtCap = new THREE.Mesh(new THREE.RingGeometry(0.0, 0.29, 22), new THREE.MeshBasicMaterial({ visible: false })); hips.add(skirtCap);
    // belt + trim
    if (!o.glow) {
      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.026, 8, 28), SM(o.belt || P.umber, { roughness: 0.55 })); belt.rotation.x = Math.PI / 2; belt.scale.set(1.1, 0.86, 1); belt.position.y = 0.04; hips.add(belt);
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.29 + (female ? 0.04 : 0), 0.014, 6, 30), SM(o.trim || shade(robe, -0.14))); hem.rotation.x = Math.PI / 2; hem.position.y = -skirtLen + 0.015; hips.add(hem);
    }
    // mantle: a sash over the left shoulder and a short cape at the back (sways)
    let cape = null;
    if (mantle && !o.glow && !female) {
      const sash = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.034, 8, 30), mMant); sash.scale.set(1.15, 1.75, 0.9); sash.rotation.set(Math.PI / 2, 0.62, 0); sash.position.set(0, 0.26, 0.0); spine.add(sash);
      cape = new THREE.Group(); cape.position.set(0, 0.47, -0.1); spine.add(cape);
      const cg = new THREE.CylinderGeometry(0.2, 0.3, 0.62, 18, 4, true, Math.PI * 0.62, Math.PI * 0.76); cg.translate(0, -0.31, 0);
      const cm = new THREE.Mesh(cg, mMant); cm.castShadow = true; cape.add(cm);
    }
    if (female && !o.glow) {
      const shawl = lathe([[0.215, 0.34], [0.215, 0.44], [0.13, 0.52], [0.07, 0.55]], mMant, 22); shawl.scale.set(1.12, 1, 0.86); spine.add(shawl);
    }
    // neck + head
    const neck = cyl(0.05, 0.06, 0.1, mSkin, 12); neck.position.y = 0.6; spine.add(neck);
    const head = new THREE.Group(); head.position.y = 0.68; spine.add(head);
    const hm = ball(0.15, mSkin, 30); hm.scale.set(0.93, 1.07, 0.97); head.add(hm);
    const jaw = ball(0.105, mSkin, 20); jaw.scale.set(1.05, 0.8, 1.0); jaw.position.set(0, -0.07, 0.03); head.add(jaw);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 6), mSkin); nose.rotation.x = Math.PI / 2 + 0.25; nose.position.set(0, -0.02, 0.148); head.add(nose);
    const eyes = new THREE.Group(); head.add(eyes);
    const hi = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF6E6') });
    const eyeOpen = new THREE.Group(), eyeShut = new THREE.Group(), brows = new THREE.Group();
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 8), mDark); e.scale.set(1, 1.18, 0.55); e.position.set(sx * 0.05, 0.016, 0.137); eyeOpen.add(e);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.0056, 8, 6), hi); h.position.set(sx * 0.05 + 0.006, 0.024, 0.147); eyeOpen.add(h);
      const shut = new THREE.Mesh(new THREE.CapsuleGeometry(0.0042, 0.03, 3, 6), mDark); shut.rotation.z = Math.PI / 2 + sx * 0.14; shut.position.set(sx * 0.05, 0.008, 0.141); eyeShut.add(shut);
      const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0065, 0.036, 3, 6), SM(o.hairColor || '#2B1C12')); brow.rotation.z = Math.PI / 2; brow.position.set(sx * 0.052, 0.058, 0.13); brow.userData.sx = sx; brows.add(brow);
    }
    if (!o.glow) { eyes.add(eyeOpen, eyeShut); if (o.brows !== false) head.add(brows); }
    eyeShut.visible = o.eyes === 'closed'; eyeOpen.visible = o.eyes !== 'closed';
    if (!o.glow) for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.02, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color('#D9876A'), transparent: true, opacity: 0.32 })); c.position.set(sx * 0.078, -0.022, 0.134); c.rotation.y = sx * 0.55; head.add(c); }
    // hair
    const hairC = o.hairColor || '#2B1C12', mh = SM(hairC, { roughness: 0.6 });
    const locks = [], hairG = new THREE.Group(); head.add(hairG);
    if (['samson', 'short', 'long', 'stubble'].includes(o.hair)) {
      const r = 0.158, gap = Math.PI * 0.7;
      const top = new THREE.Mesh(new THREE.SphereGeometry(r, 30, 12, 0, Math.PI * 2, 0, Math.PI * 0.3), o.hair === 'stubble' ? SM(shade(skin, -0.18)) : mh); top.position.set(0, 0.012, -0.006); hairG.add(top);
      if (o.hair !== 'stubble') { const back = new THREE.Mesh(new THREE.SphereGeometry(r, 30, 16, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, Math.PI * 0.15, o.hair === 'short' ? Math.PI * 0.42 : Math.PI * 0.6), mh); back.position.set(0, 0.012, -0.006); hairG.add(back); }
      top.castShadow = true;
    }
    if (o.hair === 'samson') {
      // seven locks (Judges 16:13, 16:19): long braids hanging down the back and over the shoulders
      const spots = [[-0.142, -0.03, -0.02], [-0.115, -0.015, -0.1], [-0.05, -0.0, -0.15], [0.05, -0.0, -0.15], [0.115, -0.015, -0.1], [0.142, -0.03, -0.02], [0.0, 0.03, -0.165]];
      spots.forEach((sp, i) => {
        const L = new THREE.Group(); L.position.set(sp[0], sp[1], sp[2]);
        const len = i === 6 ? 0.6 : 0.66;
        const m = new THREE.Mesh(lockGeo(len, 0.034, 0.016, i + 3), mh); m.castShadow = true; L.add(m);
        const tie = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.007, 6, 12), SM(o.tieColor || '#C9963E', { roughness: 0.4, metalness: 0.3 })); tie.rotation.x = Math.PI / 2; tie.position.y = -len * 0.84; L.add(tie);
        L.rotation.z = sp[0] * 1.15; L.rotation.x = -0.1 - (sp[2] < -0.08 ? 0.16 : 0);
        L.base = [L.rotation.x, L.rotation.z]; head.add(L); locks.push(L);
      });
    }
    if (o.beard) {
      const mb = SM(o.beardColor || hairC, { roughness: 0.65, side: THREE.DoubleSide });
      const bd = new THREE.Mesh(new THREE.SphereGeometry(0.115, 26, 14, Math.PI / 2 + 1.05, Math.PI * 2 - 2.1, Math.PI * 0.5, Math.PI * 0.32), mb); bd.position.set(0, -0.055, 0.035); bd.scale.set(1.08, 1.0, 1.06); head.add(bd);
      const chin = ball(0.05, mb, 14); chin.scale.set(1.25, 1.05, 0.8); chin.position.set(0, -0.155, 0.075); head.add(chin);
    }
    if (o.head === 'veil') {
      const vm = SM(o.veilColor || shade(robe, 0.1), { side: THREE.DoubleSide, roughness: 0.9 });
      const gap = Math.PI * 0.6;
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.172, 30, 16, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, 0, Math.PI * 0.64), vm); hood.position.set(0, 0.012, -0.008); hood.castShadow = true; head.add(hood);
      const vt = new THREE.Mesh(new THREE.SphereGeometry(0.173, 30, 10, 0, Math.PI * 2, 0, Math.PI * 0.27), vm); vt.position.set(0, 0.012, -0.008); head.add(vt);
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.46, 24, 1, true, Math.PI * 0.3, Math.PI * 1.4), vm); drape.position.set(0, -0.2, -0.03); drape.castShadow = true; head.add(drape);
      if (o.band) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.011, 6, 30), SM(o.band, { roughness: 0.4, metalness: 0.4 })); b.rotation.x = Math.PI / 2 - 0.25; b.position.set(0, 0.07, 0); head.add(b); }
    } else if (o.head === 'feather') {
      // Philistine feathered headdress (as in Egyptian reliefs of the Sea Peoples)
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24, 1, true), SM('#B08A4A', { side: THREE.DoubleSide, metalness: 0.35, roughness: 0.45 })); band.position.y = 0.065; head.add(band);
      const fm = SM('#EFE5CC');
      for (let i = 0; i < 13; i++) { const a = -Math.PI * 0.62 + (i / 12) * Math.PI * 1.24; const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.19, 3, 6), fm); f.position.set(Math.sin(a) * 0.145, 0.19, Math.cos(a) * 0.145 - 0.01); f.rotation.set(Math.cos(a) * 0.22, 0, -Math.sin(a) * 0.22); head.add(f); }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.157, 26, 10, 0, Math.PI * 2, 0, Math.PI * 0.36), SM(shade(o.robe || P.ember, -0.18))); cap.position.y = 0.016; head.add(cap);
    } else if (o.head === 'turban') {
      const tm = SM(o.veilColor || '#D8C8A8');
      const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.05, 10, 22), tm); t1.rotation.x = Math.PI / 2 - 0.15; t1.position.set(0, 0.085, -0.01); head.add(t1);
      const t2 = ball(0.135, tm, 20); t2.scale.set(1, 0.62, 1); t2.position.set(0, 0.12, -0.02); head.add(t2);
    }
    // arms: shoulder ball -> short sleeve over a bare arm -> elbow -> forearm -> mitten hand
    const arms = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const sh = new THREE.Group(); sh.position.set(sx * (0.235 * build + 0.01), 0.44, 0); spine.add(sh);
      const sball = ball(0.07 * build + 0.005, mCloth, 16); sh.add(sball);
      const sleeve = cyl(0.068 * build + 0.004, 0.062 * build + 0.004, female ? 0.27 : 0.14, mCloth); sh.add(sleeve);
      const upper = cyl(0.052 * build + 0.006, 0.046 * build + 0.004, 0.28, female ? mCloth : mSkin); sh.add(upper);
      const el = new THREE.Group(); el.position.y = -0.28; sh.add(el);
      el.add(ball(0.047 * build + 0.004, female ? mCloth : mSkin, 12));
      const fore = cyl(0.046 * build + 0.004, 0.036, 0.25, female ? mCloth : mSkin); el.add(fore);
      if (female) { const cuff = cyl(0.05, 0.068, 0.12, mCloth); cuff.position.y = -0.14; el.add(cuff); }
      const hand = ball(0.047, mSkin, 14); hand.scale.set(0.9, 1.12, 0.75); hand.position.y = -0.285; el.add(hand);
      const thumb = ball(0.019, mSkin, 8); thumb.position.set(sx * 0.03, -0.26, 0.025); el.add(thumb);
      const grip = new THREE.Group(); grip.position.y = -0.3; el.add(grip);
      if (!female && !o.glow && o.bracers !== false) { const br = cyl(0.044, 0.044, 0.07, SM('#5A3A22', { roughness: 0.6 }), 10); br.position.y = -0.17; el.add(br); }
      arms[side] = { sh, el, hand, grip };
    }
    // legs: hip -> thigh -> knee -> shin -> foot (sandals)
    const legs = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const hp = new THREE.Group(); hp.position.set(sx * 0.095, -0.06, 0); hips.add(hp);
      const thigh = cyl(0.075 * build + 0.005, 0.058, 0.43, female ? mCloth : mSkin); hp.add(thigh);
      const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn);
      kn.add(ball(0.058, female ? mCloth : mSkin, 12));
      const shin = cyl(0.056, 0.04, 0.42, female ? mCloth : mSkin); kn.add(shin);
      const ank = new THREE.Group(); ank.position.y = -0.42; kn.add(ank);
      const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.11, 4, 8), female ? mSandal : mSkin); foot.rotation.x = Math.PI / 2; foot.position.set(0, -0.035, 0.06); foot.castShadow = true; ank.add(foot);
      const sole = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.02, 0.22), mSandal); sole.position.set(0, -0.075, 0.06); ank.add(sole);
      if (!female) for (const yy of [-0.03, -0.1]) { const strap = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 4, 12), mSandal); strap.rotation.x = Math.PI / 2; strap.position.y = yy; ank.add(strap); }
      legs[side] = { hp, kn, ank };
    }
    if (o.glow) { const aura = FW.glowSprite(o.glow, 3.8, 0.6); aura.position.y = 1.0; root.add(aura); root.aura = aura; }
    root.parts = { hips, spine, body: spine, head, eyes, eyeOpen, eyeShut, brows, arms, legs, locks, cape, hair: hairG, skirt, torso };
    root.k = o.scale || 1; root.scale.setScalar(root.k);
    root.pose = (p = {}, t = 0) => FW.pose(root, p, t);
    root.setEyes = (closed) => { eyeShut.visible = !!closed; eyeOpen.visible = !closed; };
    root.pose({});
    return root;
  };

  // pose. arms: {sx forward raise, sz outward, sy twist, e elbow}; legs: {x forward swing, z outward, k knee};
  // spine: lean (forward), twist, tilt; hips: hipY (crouch offset), hipX; head: headX (nod down +), headY, headZ; brow: -1..1 (frown..raise)
  FW.pose = (f, p, t) => {
    const { hips, spine, head, arms, legs, locks, cape, brows } = f.parts;
    const breathe = p.still ? 0 : Math.sin(t * 1.8 + (p.phase || 0));
    hips.position.y = 0.93 + (p.hipY || 0) + breathe * 0.004;
    hips.rotation.set(p.hipX || 0, p.hipTwist || 0, p.hipTilt || 0);
    spine.rotation.set((p.lean || 0) + breathe * 0.012, p.twist || 0, p.tilt || 0);
    head.rotation.set(p.headX || 0, p.headY || 0, p.headZ || 0);
    for (const side of ['L', 'R']) {
      const s = side === 'L' ? 1 : -1;
      const a = p['arm' + side] || {}, A = arms[side];
      A.sh.rotation.set(-(a.sx || 0), (a.sy || 0) * s, s * (0.1 + (a.sz || 0)));
      A.el.rotation.set(-(a.e === undefined ? 0.15 : a.e), 0, 0);
      const l = p['leg' + side] || {}, Lg = legs[side];
      Lg.hp.rotation.set(-(l.x || 0), (l.y || 0) * s, s * (0.02 + (l.z || 0)));
      Lg.kn.rotation.set(l.k || 0, 0, 0);
      Lg.ank.rotation.set((l.a || 0) - ((l.x || 0) - (l.k || 0)) * 0.0, 0, 0);
    }
    if (brows && brows.children.length) brows.children.forEach((b) => { const sx = b.userData.sx; b.rotation.z = Math.PI / 2 - sx * 0.25 * (p.brow || 0); b.position.y = 0.058 + 0.008 * (p.brow || 0) * 0; });
    const sway = p.still ? 0 : Math.sin(t * 1.4 + (p.phase || 0));
    const wind = p.wind || 0;
    locks.forEach((L, i) => {
      L.rotation.x = L.base[0] + (p.hairX || 0) - wind * (0.35 + 0.12 * Math.sin(t * 6 + i * 1.3)) + sway * 0.03 * Math.sin(i + 1);
      L.rotation.z = L.base[1] * (1 + (p.hairSpread || 0)) + sway * 0.02 + wind * 0.08 * Math.sin(t * 5 + i);
    });
    if (cape) cape.rotation.x = 0.06 + (p.capeX || 0) - wind * (0.45 + 0.15 * Math.sin(t * 5.5)) + sway * 0.03;
  };

  // walk cycle: phase in cycles; returns leg/arm angles to merge into a pose
  FW.walk = (ph, amt = 1) => {
    const a = Math.sin(ph * Math.PI * 2), b = Math.sin(ph * Math.PI * 2 + Math.PI);
    const kneeA = Math.max(0, -Math.cos(ph * Math.PI * 2)) * 0.9, kneeB = Math.max(0, Math.cos(ph * Math.PI * 2)) * 0.9;
    return { legL: { x: 0.45 * a * amt, k: (0.15 + kneeA) * amt }, legR: { x: 0.45 * b * amt, k: (0.15 + kneeB) * amt }, armL: { sx: -0.35 * a * amt, sz: 0.06, e: 0.3 }, armR: { sx: -0.35 * b * amt, sz: 0.06, e: 0.3 }, hipY: -0.03 * amt + Math.abs(Math.cos(ph * Math.PI * 4)) * 0.025 * amt };
  };

  FW.POSE = {
    stand: { armL: { sx: 0.05, sz: 0.05, e: 0.2 }, armR: { sx: 0.05, sz: 0.05, e: 0.2 } },
    hero: { legL: { x: 0.08, z: 0.12 }, legR: { x: -0.08, z: 0.12 }, armL: { sx: 0.1, sz: 0.25, e: 0.35 }, armR: { sx: 0.1, sz: 0.25, e: 0.35 }, headX: -0.08, brow: 0.5 },
    openHands: { armL: { sx: 0.45, sz: 0.4, e: 0.7 }, armR: { sx: 0.45, sz: 0.4, e: 0.7 }, headX: -0.06 },
    point: { armR: { sx: 1.5, sz: 0.1, e: 0.05 }, armL: { sx: 0.05, sz: 0.05, e: 0.2 }, headY: -0.15 },
    shake: { armL: { sx: 0.45, sz: 0.05, e: 1.3 }, armR: { sx: 0.45, sz: 0.05, e: 1.3 } },
    pray: { armL: { sx: 0.95, sz: -0.3, e: 1.5 }, armR: { sx: 0.95, sz: -0.3, e: 1.5 }, headX: -0.22 },
    raise: { armL: { sx: 2.7, sz: 0.35, e: 0.1 }, armR: { sx: 2.7, sz: 0.35, e: 0.1 }, headX: -0.35 },
    burst: { armL: { sx: 1.9, sz: 0.95, e: 0.55 }, armR: { sx: 1.75, sz: 1.05, e: 0.7 }, lean: -0.28, twist: 0.1, headX: -0.45, legL: { x: 0.35, z: 0.18, k: 0.25 }, legR: { x: -0.4, z: 0.14, k: 0.12 }, brow: 1, wind: 0.8, hairSpread: 0.6 },
    bound: { armL: { sx: 0.05, sz: -0.06, e: 0.1 }, armR: { sx: 0.05, sz: -0.06, e: 0.1 }, headX: 0.35, lean: 0.15, hipY: -0.06, legL: { x: 0.2, k: 0.35 }, legR: { x: -0.05, k: 0.2 } },
    push: { armL: { sx: 1.45, sz: 0.85, e: 0.2 }, armR: { sx: 1.45, sz: 0.85, e: 0.2 }, lean: 0.18, legL: { x: 0.35, k: 0.3 }, legR: { x: -0.45, k: 0.15 }, brow: 1 },
    sit: { hipY: -0.48, legL: { x: 1.5, k: 1.5 }, legR: { x: 1.45, k: 1.45 }, armL: { sx: 0.7, sz: 0.05, e: 1.0 }, armR: { sx: 0.7, sz: 0.05, e: 1.0 } },
    kneel: { hipY: -0.45, legL: { x: 1.4, k: 1.6 }, legR: { x: -0.15, k: 1.75 }, lean: 0.05 },
    grind: { armL: { sx: 1.35, sz: 0.3, e: 0.45 }, armR: { sx: 1.35, sz: 0.3, e: 0.45 }, lean: 0.35, headX: 0.2 },
    strike: { armR: { sx: 2.7, sz: 0.25, e: 0.35 }, armL: { sx: 0.7, sz: 0.5, e: 0.7 }, lean: -0.08, legL: { x: 0.45, k: 0.4 }, legR: { x: -0.45, k: 0.1 }, brow: 1 },
    brace: { armL: { sx: 1.5, sz: 0.3, e: 0.4 }, armR: { sx: 1.6, sz: 0.3, e: 0.35 }, lean: 0.12, legL: { x: 0.5, k: 0.45 }, legR: { x: -0.5, k: 0.1 }, hipY: -0.06, brow: 1 },
  };
  FW.mix = (A, B, k) => {
    const out = {};
    for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const a = A[key], b = B[key];
      if ((a && typeof a === 'object') || (b && typeof b === 'object')) { out[key] = {}; for (const kk of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) out[key][kk] = FW.lerp((a || {})[kk] || 0, (b || {})[kk] || 0, k); }
      else out[key] = FW.lerp(a || 0, b || 0, k);
    }
    return out;
  };
  FW.add = (A, B) => { // merge B on top of A (B wins)
    const out = JSON.parse(JSON.stringify(A));
    for (const k of Object.keys(B)) { if (B[k] && typeof B[k] === 'object') out[k] = Object.assign({}, out[k] || {}, B[k]); else out[k] = B[k]; }
    return out;
  };
})();
