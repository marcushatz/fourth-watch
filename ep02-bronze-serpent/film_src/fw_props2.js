// Fourth Watch visual spec v1: designed props (silhouette first). Each key object is modelled from a drawn profile, not
// assembled from primitives: a serpent you can read as a snake at thumbnail size, a calf you can read as a young bull.
// Smooth surfaces; the 'paint' set style shades them in flat steps and the post pass inks their silhouettes.
(function () {
  const THREE = globalThis.THREE, LW = globalThis.LW, FW = globalThis.FW, DIO = globalThis.DIORAMA;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.9, metalness: 0, flatShading: false }, o));
  const BRONZE = () => M('#B87A3C', { metalness: 0.62, roughness: 0.46, emissive: new THREE.Color('#4A2A0C'), emissiveIntensity: 0.45 });   // a broad sheen, not a hot spot (it read as a glowing eye)
  const GOLD = () => M('#E8B840', { metalness: 0.4, roughness: 0.6, emissive: new THREE.Color('#7A5008'), emissiveIntensity: 0.62 });
  const softTex = (col) => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const r = x.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${col},1)`); r.addColorStop(0.45, `rgba(${col},0.5)`); r.addColorStop(1, `rgba(${col},0)`); x.fillStyle = r; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
  const shadowy = (o) => { o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); return o; };

  // a tube whose radius follows r(u) along a curve (TubeGeometry is constant-radius): bodies, tails, necks
  function taperTube(curve, rFn, segs = 96, rad = 14, flat = 1) {
    const fr = curve.computeFrenetFrames(segs, false), pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, P = curve.getPointAt(u), r = rFn(u), N = fr.normals[i], B = fr.binormals[i];
      for (let j = 0; j <= rad; j++) { const a = (j / rad) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r * flat; pos.push(P.x + N.x * c + B.x * s, P.y + N.y * c + B.y * s, P.z + N.z * c + B.z * s); }
    }
    for (let i = 0; i < segs; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  DIO.taperTube = taperTube;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- the bronze serpent on its pole (Num 21:8-9): a straight pole (no crossbar); the snake winds up it 1.5 turns, its
  //      neck rises clear of the pole top in an S and the head looks out. Heavy body, thin tail, a wedge head with a brow. ----
  DIO.prop('serpent2', (p) => {
    const g = new THREE.Group(), H = p.h ?? 3.0, lift = p.lift ?? 0, s = p.s ?? 1, mat = BRONZE(), face = p.face ?? 0.6;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.065, H, 12), M('#6A4A30', { roughness: 1 })); pole.position.y = lift + H / 2; g.add(pole);
    // the body: tail low on the pole, coils up, then the free neck
    const top = lift + H, R0 = 0.11, pts = [];
    const turns = 1.6, y0 = top - 1.05, y1 = top - 0.12;
    for (let i = 0; i <= 24; i++) { const u = i / 24, a = face + Math.PI + u * turns * Math.PI * 2; pts.push(V(Math.cos(a) * R0, lerp(y0, y1, u), Math.sin(a) * R0)); }
    const a1 = face + Math.PI + turns * Math.PI * 2, ex = Math.cos(a1), ez = Math.sin(a1), fx = Math.cos(face), fz = Math.sin(face);
    pts.push(V(ex * 0.08 + fx * 0.04, top + 0.06, ez * 0.08 + fz * 0.04), V(fx * 0.02, top + 0.22, fz * 0.02), V(-fx * 0.04, top + 0.36, -fz * 0.04), V(fx * 0.06, top + 0.47, fz * 0.06));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
    const rFn = (u) => 0.012 + 0.05 * sm(0, 0.35, u) - 0.012 * sm(0.75, 1, u);
    const N = p.pieces ?? 1, pieces = [];
    if (N <= 1) g.add(new THREE.Mesh(taperTube(curve, rFn, 140, 14), mat));
    else for (let i = 0; i < N; i++) {   // the body in N pieces that sit flush until it is struck
      const u0 = i / N, u1 = (i + 1) / N, sp = []; for (let k = 0; k <= 16; k++) sp.push(curve.getPointAt(lerp(u0, u1, k / 16)));
      const c = sp.reduce((a, b) => a.add(b), V(0, 0, 0)).multiplyScalar(1 / sp.length);
      const m = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3(sp.map((q) => q.clone().sub(c))), (v) => rFn(lerp(u0, u1, v)), 28, 14), mat);
      m.position.copy(c); g.add(m); pieces.push({ m, home: c.clone() });
    }
    // the head: a wedge (wide jaw, flat crown, a snout), turned to look out along `face`, tipped down a little
    const head = new THREE.Group(); const hp = curve.getPointAt(1);
    // p.longHead: a longer wedge with no brow ridges (from above or behind, brow bumps read as ears: "a teddy bear")
    const LH = p.longHead ? 1 : 0;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat); skull.scale.set(LH ? 0.13 : 0.11, LH ? 0.045 : 0.05, LH ? 0.068 : 0.075); head.add(skull);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat); snout.scale.set(LH ? 0.095 : 0.07, LH ? 0.03 : 0.035, LH ? 0.042 : 0.05); snout.position.set(LH ? 0.115 : 0.085, -0.008, 0); head.add(snout);
    for (const z of [0.045, -0.045]) { if (!LH) { const brow = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); brow.scale.set(0.034, 0.009, 0.02); brow.position.set(0.035, 0.034, z); head.add(brow); }
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), M('#1A0E08', { roughness: 0.3 })); eye.position.set(LH ? 0.06 : 0.045, LH ? 0.02 : 0.024, z * (LH ? 0.98 : 1.12)); head.add(eye); }
    head.position.copy(hp).add(V(fx * 0.05, 0.0, fz * 0.05)); head.rotation.y = -face; head.rotation.z = -0.25; head.scale.setScalar(p.headK ?? 1.35); g.add(head);
    g.userData.anchorY = top + 0.4; g.scale.setScalar(s);
    const lie = p.lie ?? 1.42, raiseOf = (t, evs) => { let e = null; for (const x of evs) if (x.do === 'raise') e = x; if (!e) return p.lying ? 0 : 1;
      if (e.sim) return 1 - globalThis.DIRECT.raiseSim(t, e.sim).phi / lie;   // raised by people: the weighted simulation the lifters also follow
      if (e.keys) return globalThis.DIRECT.keyed(t, e.keys);   // a performed raise: [[t, r], ...] (heave, hitch, push), shared with the lifters' puppets
      const k = clamp((t - e.t0) / (e.dur ?? 1.2)); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
    g.userData.frame = (t, evs) => { g.rotation.z = (1 - raiseOf(t, evs)) * lie; };
    if (N > 1) {
      pieces.push({ m: head, home: head.position.clone(), rot0: head.rotation.clone() });
      const rng = FW.rng(p.seed ?? 18), hit = V(...(p.hitDir || [1, 0.25, 0.2])).normalize(), hp0 = V(0, lerp(y0, y1, p.hitAt ?? 0.55), 0);
      pieces.forEach((pc) => { const d = pc.home.clone().sub(hp0); d.y *= 0.6; const v = hit.clone().multiplyScalar(2.2 + rng() * 2.4).add(d.normalize().multiplyScalar(1.4 + rng() * 1.6)); v.y += 0.8 + rng() * 1.8; pc.v = v; pc.spin = V(rng() * 14 - 7, rng() * 14 - 7, rng() * 14 - 7); });
      const glow = (c) => new THREE.SpriteMaterial({ map: softTex(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, toneMapped: false });
      const flash = new THREE.Sprite(glow('255,236,190')); flash.position.copy(hp0); flash.scale.set(1.6, 1.6, 1); g.add(flash);
      const sparks = []; for (let i = 0; i < 16; i++) { const sp = new THREE.Sprite(glow('255,190,90')); sp.scale.set(0.07, 0.07, 1); const a = rng() * 6.283, e = (rng() - 0.3) * 1.6; sp.userData.v = V(Math.cos(a) * Math.cos(e) + hit.x, Math.sin(e) + 0.4, Math.sin(a) * Math.cos(e)).multiplyScalar(2.5 + rng() * 3); g.add(sp); sparks.push(sp); }
      g.userData.frame = (t, evs) => {
        g.rotation.z = (1 - raiseOf(t, evs)) * lie;
        let e = null; for (const x of evs) if (x.do === 'shatter') e = x;
        const dt = e ? Math.max(0, t - e.t0) : 0, G = 9.8;
        pieces.forEach((pc) => { pc.m.position.set(pc.home.x + pc.v.x * dt, pc.home.y + pc.v.y * dt - 0.5 * G * dt * dt, pc.home.z + pc.v.z * dt);
          const r0 = pc.rot0 || { x: 0, y: 0, z: 0 }; pc.m.rotation.set(r0.x + pc.spin.x * dt, r0.y + pc.spin.y * dt, r0.z + pc.spin.z * dt); });
        flash.material.opacity = e ? Math.max(0, 1 - dt / 0.3) : 0;
        sparks.forEach((sp) => { const v = sp.userData.v; sp.position.set(hp0.x + v.x * dt, hp0.y + v.y * dt - 0.5 * G * dt * dt, hp0.z + v.z * dt); sp.material.opacity = e ? Math.max(0, 1 - dt / 0.45) : 0; });
      };
    }
    return shadowy(g);
  });

  // ---- a single low rock (a support: the lying pole rests on it). p.h = height of its top, p.w = width ----
  DIO.prop('rock', (p) => {
    const h = p.h ?? 0.3, w = p.w ?? 0.5, m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), M(p.col || '#8E7C66', { roughness: 0.95 }));
    m.scale.set(w / 2, h, w * 0.42); m.position.y = 0; m.rotation.y = p.rot ?? 0.3; return shadowy(m);
  });

  // ---- a small "fiery serpent" (Num 21:6) on the ground: a desert snake in an S, raised head ----
  DIO.prop('viper', (p) => {
    const g = new THREE.Group(), L = p.len ?? 0.9, rng = FW.rng(p.seed ?? 3), pts = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(V(lerp(-L / 2, L / 2, u), 0.035 + (u > 0.85 ? (u - 0.85) * 0.9 : 0), Math.sin(u * Math.PI * 2.2 + rng()) * 0.12)); }
    const c = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.Mesh(taperTube(c, (u) => 0.008 + 0.028 * sm(0, 0.4, u) - 0.008 * sm(0.85, 1, u), 60, 10, 0.75), M(p.col || '#B8502A', { roughness: 0.6 })); g.add(m);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M(p.col || '#B8502A', { roughness: 0.6 })); hd.scale.set(0.05, 0.022, 0.035); hd.position.copy(c.getPointAt(1)).add(V(0.03, 0.005, 0)); g.add(hd);
    return shadowy(g);
  });

  // ---- the golden calf (Ex 32:4): a young bull: deep chest, shoulder hump, short horns, square muzzle, straight legs;
  //      it stands on a low pedestal. fx 'burn' / 'topple' are handled like the old calf (flames + powder mound). ----
  DIO.prop('calf2', (p) => {
    const g = new THREE.Group(), body = new THREE.Group(), mat = GOLD(), s = p.s ?? 1, lift = p.lift ?? 0;
    const ell = (sx, sy, sz, x, y, z, rz = 0) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.rotation.z = rz; body.add(m); return m; };
    // one smooth body along the spine (rump -> belly -> deep chest), not a pile of spheres
    const spine = new THREE.CatmullRomCurve3([V(-0.42, 0.6, 0), V(-0.2, 0.57, 0), V(0.05, 0.56, 0), V(0.24, 0.6, 0), V(0.34, 0.64, 0)]);
    const bodyR = (u) => 0.1 + 0.095 * Math.sin(Math.PI * Math.min(1, u * 1.08)) + 0.03 * sm(0.55, 0.8, u) - 0.06 * sm(0.9, 1, u);
    body.add(new THREE.Mesh(taperTube(spine, bodyR, 60, 20, 0.92), mat));
    ell(0.1, 0.105, 0.095, -0.38, 0.6, 0); ell(0.105, 0.11, 0.1, 0.29, 0.63, 0);   // rounded rump and chest ends
    ell(0.12, 0.06, 0.1, 0.18, 0.78, 0, -0.2);      // a low hump over the shoulders
    const neck = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(0.22, 0.62, 0), V(0.36, 0.7, 0), V(0.47, 0.72, 0)]), (u) => 0.14 - 0.04 * u, 20, 12), mat); body.add(neck);
    const head = new THREE.Group(); head.position.set(0.53, 0.71, 0); head.rotation.z = -0.85; body.add(head);   // head carried low and forward
    const hd = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); head.add(m); };
    hd(0.105, 0.09, 0.085, 0, 0, 0); hd(0.08, 0.07, 0.075, 0.11, -0.01, 0);   // skull, broad muzzle
    for (const z of [0.075, -0.075]) {
      const horn = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.03, 0.06, z), V(-0.04, 0.1, z * 1.9), V(0.02, 0.14, z * 2.0)]), (u) => 0.024 * (1 - u * 0.8), 14, 8), mat); head.add(horn);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); ear.scale.set(0.025, 0.02, 0.055); ear.position.set(-0.06, 0.03, z * 1.5); head.add(ear);
    }
    for (const [x, z] of [[0.21, 0.095], [0.21, -0.095], [-0.27, 0.095], [-0.27, -0.095]]) {
      const leg = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(x, 0.46, z), V(x + (x > 0 ? 0.01 : -0.025), 0.24, z), V(x, 0.04, z)]), (u) => 0.062 - 0.024 * u, 16, 10), mat); body.add(leg);
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.04, 0.05, 10), mat); hoof.position.set(x, 0.025, z); body.add(hoof);
    }
    const tail = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.42, 0.66, 0), V(-0.47, 0.5, 0), V(-0.46, 0.32, 0)]), () => 0.015, 16, 6), mat); body.add(tail);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); tuft.scale.set(0.028, 0.055, 0.028); tuft.position.set(-0.46, 0.29, 0); body.add(tuft);
    body.rotation.y = p.face ?? 0; body.position.y = lift;
    const holder = new THREE.Group(); holder.add(body); g.add(holder);
    g.userData.anchorY = lift + 1.0; g.scale.setScalar(s);
    return shadowy(g);
  });

  // ---- smooth boulders (a cluster), low scrub, a stone altar, a cairn for the pole, a black goat-hair tent ----
  DIO.prop('boulders', (p) => {
    const g = new THREE.Group(), rng = FW.rng(p.seed ?? 5), n = p.n ?? 3, cols = p.cols || ['#A8907A', '#9A8470', '#B39C84'];
    for (let i = 0; i < n; i++) {
      const geo = new THREE.IcosahedronGeometry(1, 3), q = geo.attributes.position;
      for (let k = 0; k < q.count; k++) { const x = q.getX(k), y = q.getY(k), z = q.getZ(k), d = 1 + (FW.noise2(x * 1.7 + i * 3, z * 1.7 + y, 7) - 0.5) * 0.35; q.setXYZ(k, x * d, y * d, z * d); }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, M(cols[i % cols.length])); const sc = (p.s ?? 0.5) * (1 - i * 0.22);
      m.scale.set(sc * (1 + rng() * 0.4), sc * (0.6 + rng() * 0.3), sc); m.position.set((rng() - 0.5) * (p.spread ?? 0.9), sc * 0.35, (rng() - 0.5) * (p.spread ?? 0.9) * 0.6); m.rotation.y = rng() * 6; g.add(m);
    }
    return shadowy(g);
  });
  DIO.prop('scrub', (p) => {
    const g = new THREE.Group(), rng = FW.rng(p.seed ?? 9), c = p.col || '#7A7A48';
    for (let i = 0; i < (p.n ?? 5); i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), M(i % 2 ? c : '#6A6A3E')); const r = (p.s ?? 0.22) * (0.6 + rng() * 0.6); m.scale.set(r, r * 0.7, r); m.position.set((rng() - 0.5) * 0.5, r * 0.5, (rng() - 0.5) * 0.4); g.add(m); }
    return shadowy(g);
  });
  DIO.prop('altar', (p) => {
    const g = new THREE.Group(), w = p.w ?? 0.9;
    const geo = new THREE.BoxGeometry(w, 0.62, w * 0.7, 1, 1, 1); const m = new THREE.Mesh(geo, M('#9C8A70')); m.position.y = 0.31; g.add(m);
    const capg = new THREE.BoxGeometry(w + 0.08, 0.08, w * 0.7 + 0.08); const cap = new THREE.Mesh(capg, M('#8A7860')); cap.position.y = 0.66; g.add(cap);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), M('#8A7860')); hn.position.set(x * (w / 2), 0.76, z * (w * 0.35)); g.add(hn); }   // the altar's horns
    return shadowy(g);
  });
  DIO.prop('cairn', (p) => {
    const g = new THREE.Group(), rng = FW.rng(p.seed ?? 4), cols = ['#9C8870', '#8C7862', '#A8947A'];
    for (let i = 0; i < 14; i++) { const r = 0.12 + rng() * 0.1, m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), M(cols[i % 3])); const a = rng() * 6.28, d = (i < 9 ? 0.32 : 0.16) * (0.6 + rng() * 0.5); m.position.set(Math.cos(a) * d, i < 9 ? r * 0.7 : 0.26 + r * 0.6, Math.sin(a) * d); m.scale.y = 0.7; g.add(m); }
    return shadowy(g);
  });
  DIO.prop('tent2', (p) => {   // a low goat-hair tent: dark cloth over poles, sloped front, side walls
    const g = new THREE.Group(), w = (p.w ?? 2.6), d = (p.d ?? 1.6), h = p.h ?? 0.95, col = p.col || '#4A3A30', st = p.stripe || '#6A5440';
    const shape = new THREE.Shape(); shape.moveTo(-d / 2, 0); shape.lineTo(-d * 0.42, h * 0.38); shape.quadraticCurveTo(-d * 0.2, h * 0.92, 0, h); shape.quadraticCurveTo(d * 0.22, h * 0.9, d * 0.44, h * 0.42); shape.lineTo(d / 2, 0);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false }); geo.translate(0, 0, -w / 2); geo.rotateY(Math.PI / 2);
    const m = new THREE.Mesh(geo, M(col)); g.add(m);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.42, h * 0.55), M('#1A120E')); door.position.set(0, h * 0.28, d / 2 + 0.005); g.add(door);
    return shadowy(g);
  });

  // ---- a far ridge: a flat painted silhouette (no lighting), coloured by distance; makes the layered backdrop ----
  DIO.prop('ridge', (p) => {
    // a far range as one painted silhouette: fractal skyline, an optional main peak, lighter toward its base (haze)
    const w = p.w ?? 60, h = p.h ?? 6, n = p.n ?? 160, seed = p.seed ?? 11, pos = [], col = [], top = new THREE.Color(p.col || '#8A7088'), base = new THREE.Color(p.base || p.fogCol || '#D8B8A8');
    const ys = []; for (let i = 0; i <= n; i++) { const u = i / n; let y = 0, a = 1, f = 3;
      for (let o = 0; o < 5; o++) { y += (FW.noise2(u * f, seed + o * 7.3, seed) - 0.5) * a; a *= 0.5; f *= 2.1; }
      const peak = p.peak != null ? Math.exp(-Math.pow((u - p.peak) / (p.pw ?? 0.12), 2)) * (p.ph ?? 1.6) : 0;
      ys.push(h * (0.55 + y * 0.9 + peak)); }
    for (let i = 0; i < n; i++) { const x0 = lerp(-w / 2, w / 2, i / n), x1 = lerp(-w / 2, w / 2, (i + 1) / n), y0 = ys[i], y1 = ys[i + 1];
      pos.push(x0, -1, 0, x1, -1, 0, x1, y1, 0, x0, -1, 0, x1, y1, 0, x0, y0, 0);
      for (const yy of [-1, -1, y1, -1, y1, y0]) { const k = clamp((yy + 1) / (h * 1.1)); const c = base.clone().lerp(top, Math.pow(k, 0.7)); col.push(c.r, c.g, c.b); } }
    const g0 = new THREE.BufferGeometry(); g0.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g0.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(g0, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
    if (p.face != null) m.rotation.y = p.face;
    const g = new THREE.Group(); g.add(m); return g;
  });
  DIO.prop('peak', (p) => {   // a single jagged mountain (Sinai): steep flanks, a broken summit, a cloud band on it (Ex 24:15)
    const w = p.w ?? 30, h = p.h ?? 14, rng = FW.rng(p.seed ?? 5), pts = [];
    const prof = [[-1.2, -0.02], [-0.85, 0.05], [-0.62, 0.09], [-0.5, 0.06], [-0.36, 0.18], [-0.27, 0.34], [-0.2, 0.42], [-0.13, 0.62], [-0.08, 0.7], [-0.04, 0.88], [0.0, 1.0], [0.03, 0.93], [0.07, 0.96], [0.12, 0.74], [0.18, 0.62], [0.26, 0.44], [0.34, 0.3], [0.42, 0.14], [0.5, 0.07], [0.7, 0.1], [0.95, 0.04], [1.25, -0.02]];
    const shape = new THREE.Shape(); shape.moveTo(-w / 2, -2);
    for (let i = 0; i < prof.length - 1; i++) {   // each segment broken into crags
      const [u0, v0] = prof[i], [u1, v1] = prof[i + 1];
      for (let k = 0; k < 3; k++) { const q = k / 3 + (k ? (rng() - 0.5) * 0.12 : 0), u = u0 + (u1 - u0) * q, v = v0 + (v1 - v0) * q + (k ? (rng() - 0.5) * 0.03 : 0); shape.lineTo(u * w, v * h); }
    }
    shape.lineTo(prof[prof.length - 1][0] * w, 0);
    shape.lineTo(w / 2, -2); shape.closePath();
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: new THREE.Color(p.col || '#3A3450'), fog: false })); g.add(m);
    if (p.cloud !== false) { const c = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(p.cloudCol || '#8A82A0'), transparent: true, opacity: 0.85, fog: false }));
      c.scale.set(w * 0.22, h * 0.09, 1); c.position.set(w * 0.02, h * 0.86, 0.05); g.add(c);
      const c2 = c.clone(); c2.scale.set(w * 0.14, h * 0.06, 1); c2.position.set(-w * 0.07, h * 0.8, 0.06); g.add(c2); }
    return g;
  });
  const flameTex = (() => { let tex = null; return () => { if (tex) return tex;
    const c = document.createElement('canvas'); c.width = 128; c.height = 192; const x = c.getContext('2d');
    const tongue = (cx, w, h, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(cx - w, 190); x.bezierCurveTo(cx - w * 1.1, 120, cx - w * 0.2, 90, cx, 190 - h); x.bezierCurveTo(cx + w * 0.3, 100, cx + w * 1.1, 130, cx + w, 190); x.closePath(); x.fill(); };
    tongue(64, 52, 180, '#E2601E'); tongue(50, 30, 120, '#F59A2A'); tongue(80, 26, 140, '#F59A2A'); tongue(64, 22, 90, '#FFD866');
    tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex; }; })();
  DIO.prop('flames', (p) => {   // an altar fire: drawn flame tongues on camera-facing cards (the same 2D language as the people)
    const g = new THREE.Group(), s = p.s ?? 1, fl = [];
    for (const [x, z, k] of [[0, 0, 1], [-0.12, 0.05, 0.72], [0.13, -0.03, 0.8]]) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex(), transparent: true, depthWrite: false, toneMapped: false, color: new THREE.Color(1.25, 1.2, 1.15) }));
      sp.center.set(0.5, 0); sp.position.set(x, 0, z); sp.userData.k = k; sp.userData.ph = x * 17 + 3; fl.push(sp); g.add(sp);
    }
    g.scale.setScalar(s);
    g.userData.frame = (t) => { fl.forEach((f) => { const k = f.userData.k * (0.88 + 0.16 * Math.abs(Math.sin(t * 7 + f.userData.ph))); f.scale.set(0.42 * f.userData.k, 0.62 * k, 1); }); };
    g.userData.frame(0);
    return g;
  });
  DIO.prop('doorway', (p) => {   // a dark opening with a stone lintel, set into a wall (faces +z)
    const g = new THREE.Group(), w = p.w ?? 1.2, h = p.h ?? 2.2;
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(w, h), p.col ? new THREE.MeshBasicMaterial({ color: new THREE.Color(p.col) }) : M('#2A2018')); hole.position.set(0, h / 2, 0.21); g.add(hole);
    const lin = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.26, 0.5), M('#8A7860')); lin.position.set(0, h + 0.13, 0.12); g.add(lin);
    for (const x of [-1, 1]) { const j = new THREE.Mesh(new THREE.BoxGeometry(0.2, h, 0.46), M('#94826A')); j.position.set(x * (w / 2 + 0.1), h / 2, 0.12); g.add(j); }
    return shadowy(g);
  });
  // ---- the golden calf as a crafted idol (Ex 32:4 "he fashioned it with a graving tool and made a golden calf"):
  //      a cast silhouette (a drawn side profile, extruded and bevelled) on its own gold base; reads in one glance ----
  DIO.prop('calf3', (p) => {
    const g = new THREE.Group(), mat = GOLD(), s = p.s ?? 1, lift = p.lift ?? 0;
    const prof = [[-0.47, 0.66], [-0.3, 0.68], [-0.08, 0.68], [0.12, 0.72], [0.24, 0.76], [0.33, 0.74], [0.42, 0.76], [0.49, 0.8], [0.55, 0.79], [0.6, 0.72],
      [0.67, 0.6], [0.68, 0.55], [0.62, 0.53], [0.54, 0.56], [0.45, 0.55], [0.38, 0.47], [0.36, 0.0], [0.29, 0.0], [0.29, 0.22], [0.26, 0.22], [0.25, 0.0], [0.18, 0.0],
      [0.19, 0.36], [-0.21, 0.36], [-0.24, 0.0], [-0.31, 0.0], [-0.32, 0.2], [-0.35, 0.2], [-0.36, 0.0], [-0.43, 0.0], [-0.42, 0.3], [-0.47, 0.46]];
    const sh = new THREE.Shape(); prof.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 3, curveSegments: 4 }); geo.translate(0, 0, -0.1);
    const body = new THREE.Group(); body.add(new THREE.Mesh(geo, mat));
    for (const z of [0.1, -0.1]) {   // horns: two crescents rising from the poll
      const h = new THREE.Shape(); h.moveTo(0.47, 0.8); h.quadraticCurveTo(0.4, 0.92, 0.47, 1.0); h.quadraticCurveTo(0.45, 0.9, 0.53, 0.82); h.closePath();
      const hg = new THREE.ExtrudeGeometry(h, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }); hg.translate(0, 0, z - 0.015); body.add(new THREE.Mesh(hg, mat));
    }
    const tail = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.48, 0.62, 0), V(-0.53, 0.46, 0), V(-0.51, 0.3, 0)]), () => 0.016, 16, 6), mat); body.add(tail);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); tuft.scale.set(0.03, 0.06, 0.03); tuft.position.set(-0.51, 0.27, 0); body.add(tuft);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), M('#4A2E08', { roughness: 0.4 })); eye.position.set(0.56, 0.72, 0.14); body.add(eye);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.07, 0.42), mat); base.position.set(-0.04, -0.035, 0); body.add(base);   // its own cast base
    body.position.y = lift + 0.07; body.rotation.y = p.face ?? 0;
    const holder = new THREE.Group(); holder.add(body); g.add(holder); g.userData.anchorY = lift + 1.0; g.scale.setScalar(s);
    return shadowy(g);
  });

  // ---- a designed court wall: base course, block courses, engaged pilasters, a cornice; optional lamp niches ----
  DIO.prop('wall2', (p) => {
    const g = new THREE.Group(), w = p.w ?? 10, h = p.h ?? 3.4, c = p.col || '#9C8A70', dark = p.dark || '#7E6E58', light = p.light || '#AE9C80';
    const add = (geo, col, x, y, z) => { const m = new THREE.Mesh(geo, M(col)); m.position.set(x, y, z); g.add(m); return m; };
    add(new THREE.BoxGeometry(w, h, 0.4), c, 0, h / 2, 0);
    add(new THREE.BoxGeometry(w + 0.1, 0.32, 0.56), dark, 0, 0.16, 0.04);                    // base course
    add(new THREE.BoxGeometry(w + 0.3, 0.2, 0.62), light, 0, h - 0.1, 0.06);                 // cornice
    add(new THREE.BoxGeometry(w + 0.2, 0.08, 0.5), dark, 0, h - 0.26, 0.02);
    for (let y = 0.75; y < h - 0.4; y += 0.48) add(new THREE.BoxGeometry(w, 0.025, 0.42), dark, 0, y, 0.002);   // block courses
    const n = p.pilasters ?? 4;
    for (let i = 0; i < n; i++) { const x = lerp(-w / 2 + 0.6, w / 2 - 0.6, n > 1 ? i / (n - 1) : 0.5); if (p.skip && p.skip.includes(i)) continue;
      add(new THREE.BoxGeometry(0.36, h - 0.3, 0.16), light, x, (h - 0.3) / 2, 0.26); add(new THREE.BoxGeometry(0.5, 0.14, 0.24), light, x, h - 0.37, 0.28); add(new THREE.BoxGeometry(0.5, 0.18, 0.24), dark, x, 0.4, 0.28); }
    for (const x of p.niches || []) {   // a lamp niche: a dark recess with a small drawn flame
      add(new THREE.BoxGeometry(0.4, 0.55, 0.05), '#3A2C22', x, 1.7, 0.21); add(new THREE.BoxGeometry(0.5, 0.06, 0.16), light, x, 1.42, 0.26);
      const f = DIO.KINDS.flames({ s: 0.32 }); f.position.set(x, 1.46, 0.26); g.add(f);
      const pr = g.userData.frame; g.userData.frame = (t) => { pr && pr(t); f.userData.frame(t); };
    }
    return shadowy(g);
  });
})();
