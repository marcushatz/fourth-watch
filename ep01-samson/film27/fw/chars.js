// Fourth Watch character template: a carved-figurine look. ~4.5 heads tall, oval head, dot eyes with a
// highlight, mitten hands, layered robes, no outlines. Identity by costume, hair and one prop.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, P = FW.PAL;
  const M = (c, o) => FW.mat(c, o);
  const shade = (c, l) => '#' + new THREE.Color(c).offsetHSL(0, 0, l).getHexString();

  // smooth-shaded characters on faceted sets: the people read first
  const SM = (c, o = {}) => FW.mat(c, Object.assign({ flatShading: false }, o));
  function robeGeo(scale = 1, flare = 1) {
    const pts = [[0.255 * flare, 0], [0.25 * flare, 0.04], [0.215, 0.36], [0.182, 0.66], [0.186, 0.82], [0.2, 0.95], [0.186, 1.05], [0.14, 1.14], [0.06, 1.195], [0.0, 1.205]].map(([r, y]) => new THREE.Vector2(r * scale, y));
    return new THREE.LatheGeometry(pts, 18);
  }
  FW.robeGeo = robeGeo;
  function collarGeo() { const g = new THREE.CylinderGeometry(0.115, 0.214, 0.2, 18, 1, true); g.translate(0, 1.085, 0); return g; }
  function tubeLock(len, r0, r1, bend, seed) {
    const R = FW.rng(seed);
    const pts = [0, 0.33, 0.66, 1].map((k) => new THREE.Vector3(bend * Math.sin(k * 2.2 + R()) * 0.03, -k * len, -0.02 * k + (R() - 0.5) * 0.01));
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 10, 1, 6, false);
    // taper: scale ring radius from r0 to r1 along the tube
    const pos = g.attributes.position, n = 11, ring = 7;
    for (let i = 0; i < n; i++) {
      const c = curve.getPointAt(i / (n - 1)), r = FW.lerp(r0, r1, i / (n - 1));
      for (let j = 0; j < ring; j++) { const idx = i * ring + j; const v = new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)).sub(c).multiplyScalar(r).add(c); pos.setXYZ(idx, v.x, v.y, v.z); }
    }
    g.computeVertexNormals();
    return g;
  }
  // build a figure. o: { skin, robe, mantle, belt, hair, beard, head, eyes, scale, glow }
  FW.figure = (o = {}) => {
    const skin = o.skin || FW.SKIN[0], robe = o.robe || P.clay, mantle = o.mantle === undefined ? shade(robe, -0.08) : o.mantle;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const glowM = o.glow ? new THREE.MeshBasicMaterial({ color: new THREE.Color(o.glow) }) : null;
    const mSkin = glowM || SM(skin, { roughness: 0.7 });
    const mRobe = glowM || SM(robe, { roughness: 0.95 });
    const robeM = new THREE.Mesh(robeGeo(1, o.flare || 1), mRobe); robeM.castShadow = true; robeM.receiveShadow = true; body.add(robeM);
    // hem band
    if (mantle && !o.glow) {
      const mm = new THREE.Mesh(collarGeo(), SM(mantle, { side: THREE.DoubleSide })); mm.castShadow = true; body.add(mm);
      const sash = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 24), SM(mantle)); sash.scale.set(1, 1.6, 1); sash.rotation.set(Math.PI / 2, 0.55, 0); sash.position.y = 0.87; sash.castShadow = true; body.add(sash);
    }
    if (o.belt !== null && !o.glow) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.186, 0.024, 6, 24), SM(o.belt || P.umber, { roughness: 0.6 })); b.rotation.x = Math.PI / 2; b.position.y = 0.71; body.add(b); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.12, 10), mSkin); neck.position.y = 1.24; body.add(neck);

    // head
    const head = new THREE.Group(); head.position.y = 1.405; body.add(head);
    const hm = new THREE.Mesh(new THREE.SphereGeometry(0.168, 28, 20), mSkin); hm.scale.set(0.94, 1.06, 0.97); hm.castShadow = true; head.add(hm);
    const eyes = new THREE.Group(); head.add(eyes);
    const dark = SM('#1B120D', { roughness: 0.35 }), hi = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF6E6') });
    const eyeOpen = new THREE.Group(), eyeShut = new THREE.Group();
    for (const sx of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.0205, 12, 8), dark); e.scale.set(1, 1.15, 0.6); e.position.set(sx * 0.056, 0.012, 0.152); eyeOpen.add(e);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 8, 6), hi); h.position.set(sx * 0.056 + 0.0065, 0.02, 0.163); eyeOpen.add(h);
      const sh = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, 0.034, 3, 6), dark); sh.rotation.z = Math.PI / 2 + sx * 0.12; sh.position.set(sx * 0.056, 0.004, 0.156); eyeShut.add(sh);
    }
    if (!o.glow) { eyes.add(eyeOpen); eyes.add(eyeShut); }
    eyeShut.visible = o.eyes === 'closed'; eyeOpen.visible = o.eyes !== 'closed';
    if (o.blush !== false && !o.glow) { for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#D9876A'), transparent: true, opacity: 0.35 })); c.position.set(sx * 0.085, -0.03, 0.148); c.rotation.y = sx * 0.55; head.add(c); } }
    // hair: a top cap + a back/sides piece with a clean opening for the face
    const hairC = o.hairColor || '#2B1C12', mh = SM(hairC, { roughness: 0.7 });
    const locks = [];
    const hairPieces = new THREE.Group(); head.add(hairPieces);
    if (o.hair === 'samson' || o.hair === 'short' || o.hair === 'long') {
      const r = 0.176;
      const top = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.3), mh); top.position.set(0, 0.012, -0.008); top.castShadow = true; hairPieces.add(top);
      const gap = Math.PI * 0.72;
      const back = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 16, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, Math.PI * 0.18, o.hair === 'short' ? Math.PI * 0.42 : Math.PI * 0.58), mh);
      back.position.set(0, 0.012, -0.008); back.castShadow = true; hairPieces.add(back);
    }
    if (o.hair === 'samson') {
      // seven locks (Judges 16:13, 16:19): long braids hanging behind and beside the head
      const spots = [[-0.158, -0.035, -0.02], [-0.125, -0.02, -0.11], [-0.055, -0.01, -0.165], [0.055, -0.01, -0.165], [0.125, -0.02, -0.11], [0.158, -0.035, -0.02], [0.0, 0.03, -0.18]];
      spots.forEach((sp, i) => {
        const L = new THREE.Group(); L.position.set(sp[0], sp[1], sp[2]);
        const len = i === 6 ? 0.5 : 0.58;
        const m = new THREE.Mesh(tubeLock(len, 0.036, 0.02, sp[0] >= 0 ? 1 : -1, i + 3), mh); m.castShadow = true; L.add(m);
        const tie = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.008, 6, 10), SM(o.tieColor || '#B88A4A', { roughness: 0.5 })); tie.rotation.x = Math.PI / 2; tie.position.y = -len * 0.86; L.add(tie);
        L.rotation.z = sp[0] * 1.1; L.rotation.x = -0.08 - (sp[2] < -0.1 ? 0.12 : 0);
        L.base = [L.rotation.x, L.rotation.z]; head.add(L); locks.push(L);
      });
    }
    if (o.beard) {
      const bd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 12, Math.PI / 2 + 1.25, Math.PI * 2 - 2.5, Math.PI * 0.62, Math.PI * 0.26), SM(o.beardColor || hairC, { side: THREE.DoubleSide }));
      bd.rotation.y = Math.PI; bd.scale.set(1.04, 1.1, 1.08); bd.position.set(0, -0.005, 0.012); head.add(bd);
      const chin = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), SM(o.beardColor || hairC)); chin.scale.set(1.25, 1.0, 0.75); chin.position.set(0, -0.145, 0.1); head.add(chin);
    }
    // headwear
    if (o.head === 'veil') {
      const vm = SM(o.veilColor || shade(robe, 0.1), { side: THREE.DoubleSide });
      const gap = Math.PI * 0.62;
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.192, 28, 16, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, 0, Math.PI * 0.62), vm); hood.position.set(0, 0.014, -0.01); hood.castShadow = true; head.add(hood);
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.193, 28, 10, 0, Math.PI * 2, 0, Math.PI * 0.26), vm); top.position.set(0, 0.014, -0.01); head.add(top);
      const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.4, 20, 1, true, Math.PI * 0.32, Math.PI * 1.36), vm); drape.position.set(0, -0.19, -0.03); drape.castShadow = true; head.add(drape);
      if (o.band) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.188, 0.012, 6, 28), SM(o.band, { roughness: 0.5, metalness: 0.3 })); b.rotation.x = Math.PI / 2 - 0.25; b.position.set(0, 0.075, 0.0); head.add(b); }
    } else if (o.head === 'feather') {
      // Philistine feathered headdress (as in Egyptian reliefs of the Sea Peoples)
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.055, 20, 1, true), SM('#B08A4A', { side: THREE.DoubleSide, metalness: 0.3, roughness: 0.5 })); band.position.y = 0.07; head.add(band);
      const fm = SM('#EDE2C8');
      for (let i = 0; i < 11; i++) { const a = -Math.PI * 0.62 + (i / 10) * Math.PI * 1.24; const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.2, 3, 6), fm); f.position.set(Math.sin(a) * 0.16, 0.2, Math.cos(a) * 0.16 - 0.01); f.rotation.set(Math.cos(a) * 0.22, 0, -Math.sin(a) * 0.22); head.add(f); }
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.175, 24, 10, 0, Math.PI * 2, 0, Math.PI * 0.35), SM(shade(o.robe || P.ember, -0.15))); cap.position.y = 0.02; head.add(cap);
    } else if (o.head === 'turban') {
      const tm = SM(o.veilColor || '#D8C8A8');
      const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.055, 10, 20), tm); t1.rotation.x = Math.PI / 2 - 0.15; t1.position.set(0, 0.09, -0.01); head.add(t1);
      const t2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 12), tm); t2.scale.set(1, 0.6, 1); t2.position.set(0, 0.13, -0.02); head.add(t2);
    }

    // arms: shoulder -> upper sleeve -> elbow -> forearm sleeve -> mitten hand
    const arms = {};
    for (const side of ['L', 'R']) {
      const sx = side === 'L' ? 1 : -1;
      const sh = new THREE.Group(); sh.position.set(sx * 0.192, 1.095, 0); body.add(sh);
      const sball = new THREE.Mesh(new THREE.SphereGeometry(0.054, 14, 10), mRobe); sh.add(sball);
      const ug = new THREE.CylinderGeometry(0.052, 0.062, 0.29, 14); ug.translate(0, -0.145, 0);
      const up = new THREE.Mesh(ug, mRobe); up.castShadow = true; sh.add(up);
      const el = new THREE.Group(); el.position.y = -0.285; sh.add(el);
      const eball = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 8), mRobe); el.add(eball);
      const fg = new THREE.CylinderGeometry(0.047, 0.072, 0.24, 14); fg.translate(0, -0.12, 0);
      const fo = new THREE.Mesh(fg, o.bareArms ? mSkin : mRobe); fo.castShadow = true; el.add(fo);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), mSkin); hand.scale.set(0.88, 1.12, 0.78); hand.position.y = -0.28; hand.castShadow = true; el.add(hand);
      const grip = new THREE.Group(); grip.position.y = -0.3; el.add(grip);
      arms[side] = { sh, el, hand, grip };
    }
    const fm = SM('#3A2618');
    for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.1, 4, 8), fm); f.rotation.x = Math.PI / 2; f.position.set(sx * 0.085, 0.035, 0.18); root.add(f); }

    if (o.glow) { const aura = FW.glowSprite(o.glow, 3.6, 0.6); aura.position.y = 0.95; root.add(aura); root.aura = aura; }

    root.parts = { body, head, eyes, eyeOpen, eyeShut, arms, locks, robe: robeM, hair: hairPieces };
    root.k = o.scale || 1; root.scale.setScalar(root.k);
    root.pose = (p = {}, t = 0) => FW.pose(root, p, t);
    root.pose({});
    return root;
  };

  // pose: angles in radians. arm sx>0 raises the arm forward, sz>0 lifts it outward, e>0 bends the elbow forward.
  FW.pose = (f, p, t) => {
    const { body, head, arms, locks } = f.parts;
    const breathe = p.still ? 0 : Math.sin(t * 1.7 + (p.phase || 0)) * 0.012;
    body.position.y = (p.drop || 0) + breathe * 0.5;
    body.rotation.x = p.lean || 0; body.rotation.z = p.tilt || 0; body.rotation.y = p.twist || 0;
    head.rotation.set(p.headX || 0, p.headY || 0, p.headZ || 0);
    body.scale.y = 1 + breathe;
    for (const side of ['L', 'R']) {
      const a = p['arm' + side] || {}, s = side === 'L' ? 1 : -1, A = arms[side];
      A.sh.rotation.set(-(a.sx || 0), a.sy || 0, s * (0.08 + (a.sz || 0)));
      A.el.rotation.set(-(a.e || 0), 0, 0);
    }
    const sway = p.still ? 0 : Math.sin(t * 1.3 + (p.phase || 0));
    locks.forEach((L, i) => { L.rotation.x = L.base[0] + (p.hairX || 0) + sway * 0.03 * Math.sin(i); L.rotation.z = L.base[1] + sway * 0.02 + (p.hairZ || 0) * (L.base[1] >= 0 ? 1 : -1); });
  };

  // common poses
  FW.POSE = {
    stand: {},
    openHands: { armL: { sx: 0.35, sz: 0.28, e: 0.75 }, armR: { sx: 0.35, sz: 0.28, e: 0.75 }, headX: -0.06 },
    point: { armR: { sx: 1.45, sz: 0.1, e: 0.05 }, headY: -0.2 },
    shake: { armL: { sx: 0.35, sz: 0.1, e: 1.1 }, armR: { sx: 0.35, sz: 0.1, e: 1.1 } },
    pray: { armL: { sx: 0.9, sz: -0.25, e: 1.4 }, armR: { sx: 0.9, sz: -0.25, e: 1.4 }, headX: -0.25 },
    raise: { armL: { sx: 2.6, sz: 0.35, e: 0.1 }, armR: { sx: 2.6, sz: 0.35, e: 0.1 }, headX: -0.3 },
    push: { armL: { sx: 1.55, sz: 0.65, e: 0.15 }, armR: { sx: 1.55, sz: 0.65, e: 0.15 }, lean: 0.12 },
    sit: { drop: -0.38, armL: { sx: 0.7, sz: 0.05, e: 0.9 }, armR: { sx: 0.7, sz: 0.05, e: 0.9 } },
    lean: { lean: 0.22, armL: { sx: 0.6, e: 0.6 }, armR: { sx: 0.4, e: 0.8 } },
    bound: { armL: { sx: 0.05, sz: -0.04, e: 0.0 }, armR: { sx: 0.05, sz: -0.04, e: 0.0 }, headX: 0.12 },
    grind: { armL: { sx: 1.35, sz: 0.25, e: 0.35 }, armR: { sx: 1.35, sz: 0.25, e: 0.35 }, lean: 0.28, headX: 0.2 },
    strike: { armR: { sx: 2.7, sz: 0.2, e: 0.3 }, armL: { sx: 0.6, sz: 0.4, e: 0.7 }, lean: -0.05 },
    hold: { armR: { sx: 0.9, sz: 0.1, e: 0.7 }, armL: { sx: 0.3, sz: 0.1, e: 0.3 } },
  };
  FW.mix = (A, B, k) => {
    const out = {};
    for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
      const a = A[key], b = B[key];
      if (typeof a === 'object' || typeof b === 'object') { out[key] = {}; for (const kk of new Set([...Object.keys(a || {}), ...Object.keys(b || {})])) out[key][kk] = FW.lerp((a || {})[kk] || 0, (b || {})[kk] || 0, k); }
      else out[key] = FW.lerp(a || 0, b || 0, k);
    }
    return out;
  };

  // a cheap crowd for big numbers of people: instanced robes and heads, plus feathers for Philistines
  FW.crowd = ({ n = 120, area = [10, 6], seed = 5, colors = [P.clay, '#7A6A55', '#8C6C4A', '#5E5A48', '#9A8060'], center = [0, 0, 0], heightAt = null, scale = 1 } = {}) => {
    const R = FW.rng(seed), g = new THREE.Group();
    const robe = new THREE.InstancedMesh(robeGeo(1), new THREE.MeshStandardMaterial({ roughness: 0.95 }), n);
    const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.168, 12, 8), new THREE.MeshStandardMaterial({ roughness: 0.8 }), n);
    const tmp = new THREE.Object3D(), col = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const x = center[0] + (R() - 0.5) * area[0], z = center[2] + (R() - 0.5) * area[1], y = (heightAt ? heightAt(x, z) : 0) + center[1];
      const s = scale * (0.9 + R() * 0.2), ry = (R() - 0.5) * 0.8;
      tmp.position.set(x, y, z); tmp.rotation.set(0, ry, 0); tmp.scale.setScalar(s); tmp.updateMatrix(); robe.setMatrixAt(i, tmp.matrix);
      robe.setColorAt(i, col.set(colors[Math.floor(R() * colors.length)]));
      tmp.position.set(x, y + 1.405 * s, z); tmp.updateMatrix(); head.setMatrixAt(i, tmp.matrix);
      head.setColorAt(i, col.set(FW.SKIN[Math.floor(R() * FW.SKIN.length)]));
    }
    robe.castShadow = head.castShadow = true; robe.receiveShadow = true;
    g.add(robe); g.add(head);
    return g;
  };

  // a low-poly lion. pose(k) with k in 0..1 = crouch -> full leap
  FW.lion = () => {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const fur = M('#B9864A'), mane = M('#7A4E26'), darkF = M('#8E6236');
    const torso = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), fur); torso.scale.set(0.8, 0.75, 1.55); torso.position.y = 0.85; torso.castShadow = true; body.add(torso);
    const headG = new THREE.Group(); headG.position.set(0, 1.12, 0.75); body.add(headG);
    const mn = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mane); mn.scale.set(1.05, 1.05, 0.8); mn.castShadow = true; headG.add(mn);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.42), fur); hd.position.set(0, -0.02, 0.22); hd.castShadow = true; headG.add(hd);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.18), M('#D2A46A')); snout.position.set(0, -0.09, 0.45); headG.add(snout);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.04), M('#3A2416')); nose.position.set(0, -0.02, 0.55); headG.add(nose);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), M('#1B120D')); e.position.set(sx * 0.09, 0.06, 0.43); headG.add(e); const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 4), darkF); ear.position.set(sx * 0.17, 0.22, 0.1); headG.add(ear); }
    const legs = [];
    for (const [x, z] of [[-0.24, 0.5], [0.24, 0.5], [-0.24, -0.5], [0.24, -0.5]]) {
      const L = new THREE.Group(); L.position.set(x, 0.75, z); body.add(L);
      const lg = new THREE.CylinderGeometry(0.09, 0.11, 0.75, 6); lg.translate(0, -0.375, 0);
      const m = new THREE.Mesh(lg, fur); m.castShadow = true; L.add(m);
      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.2), darkF); paw.position.set(0, -0.74, 0.04); L.add(paw);
      legs.push(L);
    }
    const tail = new THREE.Group(); tail.position.set(0, 0.95, -0.75); body.add(tail);
    const tg = new THREE.CylinderGeometry(0.03, 0.04, 0.8, 4); tg.translate(0, -0.4, 0); const tm = new THREE.Mesh(tg, fur); tail.add(tm);
    const tuft = new THREE.Mesh(new THREE.IcosahedronGeometry(0.08, 0), mane); tuft.position.y = -0.82; tail.add(tuft);
    tail.rotation.x = -2.2;
    g.leap = (k, t = 0) => {
      body.rotation.x = FW.lerp(0.05, -0.55, k);
      body.position.y = FW.lerp(-0.12, 0.9, Math.sin(Math.min(1, k) * Math.PI * 0.5));
      legs[0].rotation.x = legs[1].rotation.x = FW.lerp(0.2, -1.25, k);
      legs[2].rotation.x = legs[3].rotation.x = FW.lerp(-0.3, 0.85, k);
      headG.rotation.x = FW.lerp(0.15, -0.2, k);
      tail.rotation.x = -2.2 + Math.sin(t * 3) * 0.15 + k * 0.4;
    };
    g.leap(0);
    return g;
  };

  // a round shield and a spear for Philistine soldiers
  FW.shield = (color = '#8A5A2E') => {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), M(color)); s.rotation.x = Math.PI / 2; s.castShadow = true; g.add(s);
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 5), M('#B08A4A', { metalness: 0.4, roughness: 0.5 })); boss.position.z = 0.04; g.add(boss);
    return g;
  };
  FW.spear = () => {
    const g = new THREE.Group();
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 5), M(P.wood)); g.add(sh);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 5), M('#9A9488', { metalness: 0.5, roughness: 0.5 })); tip.position.y = 1.2; g.add(tip);
    return g;
  };
})();
