// Fourth Watch visual spec v1: designed props (silhouette first). Each key object is modelled from a drawn profile, not
// assembled from primitives: a serpent you can read as a snake at thumbnail size, a calf you can read as a young bull.
// Smooth surfaces; the 'paint' set style shades them in flat steps and the post pass inks their silhouettes.
(function () {
  const THREE = globalThis.THREE, LW = globalThis.LW, FW = globalThis.FW, DIO = globalThis.DIORAMA;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(c), roughness: 0.9, metalness: 0, flatShading: false }, o));
  const BRONZE = () => M('#B87A3C', { metalness: 0.62, roughness: 0.34, emissive: new THREE.Color('#4A2A0C'), emissiveIntensity: 0.45 });
  const GOLD = () => M('#E8B840', { metalness: 0.6, roughness: 0.28, emissive: new THREE.Color('#7A5008'), emissiveIntensity: 0.55 });
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
    const body = new THREE.Mesh(taperTube(curve, rFn, 140, 14), mat); g.add(body);
    // the head: a wedge (wide jaw, flat crown, a snout), turned to look out along `face`, tipped down a little
    const head = new THREE.Group(); const hp = curve.getPointAt(1);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat); skull.scale.set(0.11, 0.05, 0.075); head.add(skull);
    const snout = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat); snout.scale.set(0.07, 0.035, 0.05); snout.position.set(0.085, -0.008, 0); head.add(snout);
    for (const z of [0.045, -0.045]) { const brow = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); brow.scale.set(0.03, 0.016, 0.022); brow.position.set(0.03, 0.03, z); head.add(brow);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), M('#1A0E08', { roughness: 0.3 })); eye.position.set(0.045, 0.024, z * 1.12); head.add(eye); }
    head.position.copy(hp).add(V(fx * 0.05, 0.0, fz * 0.05)); head.rotation.y = -face; head.rotation.z = -0.25; head.scale.setScalar(p.headK ?? 1.35); g.add(head);
    g.userData.anchorY = top + 0.4; g.scale.setScalar(s);
    return shadowy(g);
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
    ell(0.34, 0.2, 0.17, 0, 0.62, 0);            // barrel
    ell(0.2, 0.23, 0.18, 0.2, 0.66, 0, -0.2);      // chest and shoulders (deeper than the hips)
    ell(0.17, 0.18, 0.16, -0.24, 0.64, 0, 0.15);   // hindquarters
    ell(0.12, 0.08, 0.1, 0.16, 0.84, 0, -0.3);     // the hump over the shoulders
    const neck = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(0.24, 0.7, 0), V(0.36, 0.84, 0), V(0.44, 0.92, 0)]), (u) => 0.12 - 0.04 * u, 20, 12), mat); body.add(neck);
    const head = new THREE.Group(); head.position.set(0.5, 0.92, 0); head.rotation.z = -0.55; body.add(head);
    const hd = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat); m.scale.set(sx, sy, sz); m.position.set(x, y, z); head.add(m); };
    hd(0.1, 0.085, 0.08, 0, 0, 0); hd(0.075, 0.06, 0.07, 0.1, -0.02, 0);   // skull, muzzle
    for (const z of [0.07, -0.07]) {
      const horn = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.02, 0.06, z), V(-0.02, 0.12, z * 1.5), V(0.03, 0.17, z * 1.35)]), (u) => 0.022 * (1 - u * 0.85), 14, 8), mat); head.add(horn);
      const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); ear.scale.set(0.025, 0.018, 0.05); ear.position.set(-0.05, 0.04, z * 1.45); head.add(ear);
    }
    for (const [x, z] of [[0.2, 0.09], [0.2, -0.09], [-0.25, 0.09], [-0.25, -0.09]]) {
      const leg = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(x, 0.52, z), V(x + (x > 0 ? 0.01 : -0.02), 0.28, z), V(x, 0.04, z)]), (u) => 0.055 - 0.025 * u, 16, 10), mat); body.add(leg);
      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.05, 10), mat); hoof.position.set(x, 0.025, z); body.add(hoof);
    }
    const tail = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3([V(-0.38, 0.72, 0), V(-0.44, 0.55, 0), V(-0.43, 0.36, 0)]), () => 0.014, 16, 6), mat); body.add(tail);
    const tuft = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat); tuft.scale.set(0.025, 0.05, 0.025); tuft.position.set(-0.43, 0.33, 0); body.add(tuft);
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
})();
