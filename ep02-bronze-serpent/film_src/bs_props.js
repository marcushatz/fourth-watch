// The Bronze Serpent: the episode's props (DIORAMA.prop kinds). Every animation is a pure function of t,
// driven by fx events from the score (shot.dio.fx = [{ on, at, do, dur }]).
(function () {
  const THREE = globalThis.THREE, LW = globalThis.LW, FW = globalThis.FW, DIO = globalThis.DIORAMA;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const eio = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const M = LW.M;
  const GOLD = () => M('#E9BC4C', { metalness: 0.55, roughness: 0.32, emissive: new THREE.Color('#5A3A08'), emissiveIntensity: 0.35, flatShading: false });
  const BRONZE = () => M('#B9783A', { metalness: 0.5, roughness: 0.36, emissive: new THREE.Color('#3A1E08'), emissiveIntensity: 0.3, flatShading: false });
  const STONE = (c = '#A39278') => M(c, { roughness: 0.95 });
  const last = (evs, verb) => { let e = null; for (const x of evs) if (x.do === verb) e = x; return e; };
  const prog = (t, e, fb = 1) => (e ? clamp((t - e.t0) / (e.dur ?? fb)) : 0);

  // a soft round sprite texture (smoke, dust, flame glow)
  const softTex = (() => { let tex; return (col = '255,255,255') => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, `rgba(${col},1)`); r.addColorStop(0.5, `rgba(${col},0.45)`); r.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); tex = new THREE.CanvasTexture(c); return tex; }; })();

  // ---- the plinth: the film's spine (every era's object stands on it, in the same frame) ----
  DIO.prop('plinth', (p) => {
    const g = new THREE.Group(), s = p.s ?? 1, c = p.col || '#A39278';
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 1.3), STONE(LW.col ? '#8E7E66' : '#8E7E66')); base.position.y = 0.08; g.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.42, 1.08), STONE(c)); body.position.y = 0.37; g.add(body);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.1, 1.22), STONE('#B4A386')); top.position.y = 0.63; g.add(top);
    g.scale.setScalar(s); g.userData.anchorY = 0.7 * s; return LW.shadowy(g);
  });

  // ---- the golden calf (Exodus 32:4), which burns and is ground to powder (32:20): fx { do: 'burn', dur } ----
  DIO.prop('calf', (p) => {
    const g = new THREE.Group(), body = new THREE.Group(), mat = GOLD(), s = p.s ?? 1, lift = p.lift ?? 0.68;
    const add = (m, x, y, z, rz = 0) => { m.position.set(x, y, z); m.rotation.z = rz; body.add(m); return m; };
    const cap = (r, l) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 6, 12), mat);
    add(cap(0.17, 0.42), 0, 0.62, 0, Math.PI / 2);                      // the body, a long barrel (side profile reads as a calf)
    add(cap(0.075, 0.2), 0.33, 0.8, 0, -0.75);                          // the neck, angled up and forward
    const head = add(new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat), 0.45, 0.93, 0); head.scale.set(0.13, 0.095, 0.085);
    const muz = add(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), mat), 0.56, 0.89, 0); muz.scale.set(0.065, 0.06, 0.06);
    for (const z of [0.06, -0.06]) { const h = add(new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.13, 8), mat), 0.43, 1.04, z, 0.25); h.rotation.x = z > 0 ? -0.45 : 0.45; const e = add(new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), mat), 0.4, 0.97, z * 1.6); e.scale.set(0.03, 0.018, 0.045); }
    for (const [x, z] of [[0.22, 0.09], [0.22, -0.09], [-0.22, 0.09], [-0.22, -0.09]]) add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.46, 8), mat), x, 0.23, z);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.34, 6), mat), -0.4, 0.5, 0, 0.3);
    body.position.y = lift; body.rotation.y = p.face ?? 0; g.add(body);
    // the fire (cones of flame, additive) and the powder mound it leaves (32:20)
    const flames = new THREE.Group(); const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FF8A2C').multiplyScalar(2.4), toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), fm); const a = (i / 9) * 6.283; f.position.set(Math.cos(a) * 0.32, lift + 0.3, Math.sin(a) * 0.22); f.userData.a = a; flames.add(f); }
    flames.visible = false; g.add(flames);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('255,170,80'), color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); glow.position.y = lift + 0.6; glow.scale.set(2.4, 2.4, 1); g.add(glow);
    const mound = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.22, 18), M('#C9A24A', { roughness: 0.8, metalness: 0.2, emissive: new THREE.Color('#3A2606'), emissiveIntensity: 0.3 })); mound.position.y = lift + 0.11; mound.scale.setScalar(0.001); g.add(mound);
    g.userData.anchorY = lift + 1.0;
    g.userData.frame = (t, evs) => {
      const b = last(evs, 'burn'), k = prog(t, b, 1.6);
      const fl = b ? Math.sin(Math.min(1, k * 1.25) * Math.PI) : 0;           // flames rise and fall
      flames.visible = fl > 0.02; glow.material.opacity = fl * 0.8;
      flames.children.forEach((f, i) => { const w = 0.8 + 0.25 * Math.sin(t * 17 + i * 2.1); f.scale.set(fl * w, fl * (1 + 0.35 * Math.sin(t * 13 + i)), fl * w); f.position.y = lift + 0.3 * fl + 0.12; });
      const melt = eio(clamp((k - 0.25) / 0.65));                             // the calf goes; the powder mound grows
      body.scale.set(1 - melt * 0.6, Math.max(0.02, 1 - melt), 1 - melt * 0.6); body.visible = melt < 0.98;
      mound.scale.setScalar(0.001 + melt);
    };
    g.scale.setScalar(s); return LW.shadowy(g);
  });

  // ---- the bronze serpent on a pole (Numbers 21:9), which Hezekiah breaks in pieces (2 Kings 18:4): fx { do: 'shatter', dur } ----
  // a straight pole, no crossbar (series fence). The serpent is 9 segments of one coil + a head; on 'shatter' each piece flies
  // on its own ballistic path, spins and lands on the floor. The pole stays: the empty pole is the film's last image.
  DIO.prop('serpentPole', (p) => {
    const g = new THREE.Group(), mat = BRONZE(), s = p.s ?? 1, lift = p.lift ?? 0.68, H = p.h ?? 2.4, hv = p.hv ?? 1;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, H, 10), M('#6E4A2E', { roughness: 0.8 })); pole.position.y = lift + H / 2; g.add(pole);
    const pieces = [], N = 9, R = 0.13, top = lift + H - 0.1;
    // the coil: a helix down the top of the pole, cut into N tubes
    const helix = (u) => { const a = u * Math.PI * 2 * 2.3, y = top - u * 1.0; return new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R); };
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, pts = []; for (let j = 0; j <= 8; j++) pts.push(helix(lerp(u0, u1, j / 8)));
      const c = pts[4].clone(), curve = new THREE.CatmullRomCurve3(pts.map((v) => v.clone().sub(c)));
      const r0 = lerp(0.075, 0.03, u0);
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, r0, 9, false), mat); m.position.copy(c); g.add(m); pieces.push({ m, home: c.clone() });
    }
    // the head: rises above the pole top and looks out (toward the camera's left by default)
    const head = new THREE.Group(); const neckPts = [helix(0), new THREE.Vector3(0.06, top + 0.18, 0.05), new THREE.Vector3(0.12, top + 0.32, 0.12)];
    const hc = neckPts[1].clone(); const neck = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(neckPts.map((v) => v.clone().sub(hc))), 10, 0.075, 9, false), mat); head.add(neck);
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat); skull.scale.set(0.15, 0.085, 0.1); skull.position.set(0.12, 0.16, 0.1); skull.rotation.y = -0.5; head.add(skull);
    for (const z of [0.045, -0.045]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M('#1A120C')); e.position.set(0.16, 0.2, 0.1 + z); head.add(e); }
    head.position.copy(hc); g.add(head); pieces.push({ m: head, home: hc.clone() });
    // a deterministic spray for the shatter
    const rng = FW.rng(p.seed ?? 41);
    pieces.forEach((pc, i) => { const a = (i / pieces.length) * 6.283 + rng() * 0.8; pc.v = new THREE.Vector3(Math.cos(a) * (0.5 + rng() * 0.8) * hv, 0.6 + rng() * 1.2, Math.sin(a) * (0.4 + rng() * 0.6) * hv); pc.spin = new THREE.Vector3(rng() * 9 - 4.5, rng() * 9 - 4.5, rng() * 9 - 4.5); pc.floor = (p.floorY ?? 0.06) + rng() * 0.04; });
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('255,236,190'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); flash.position.y = top - 0.4; flash.scale.set(2.6, 2.6, 1); g.add(flash);
    g.userData.anchorY = top + 0.2;
    g.userData.frame = (t, evs) => {
      const e = last(evs, 'shatter'), dt = e ? Math.max(0, t - e.t0) : 0;
      flash.material.opacity = e ? Math.max(0, 1 - dt / 0.22) * 0.9 : 0;
      pieces.forEach((pc) => {
        if (!e) { pc.m.position.copy(pc.home); pc.m.rotation.set(0, 0, 0); return; }
        // flight until the piece reaches its floor height, then it rests (pure function of dt)
        const g9 = 9.8, y0 = pc.home.y, vy = pc.v.y, disc = vy * vy + 2 * g9 * (y0 - pc.floor), tl = (vy + Math.sqrt(Math.max(0, disc))) / g9, tt = Math.min(dt, tl);
        pc.m.position.set(pc.home.x + pc.v.x * tt * 0.7, y0 + vy * tt - 0.5 * g9 * tt * tt, pc.home.z + pc.v.z * tt * 0.7);
        const sp = Math.min(dt, tl + 0.25); pc.m.rotation.set(pc.spin.x * sp, pc.spin.y * sp, pc.spin.z * sp);
      });
    };
    g.scale.setScalar(s); return LW.shadowy(g);
  });

  // ---- incense: a small bronze stand and smoke that rises and curls; fx { do: 'scatter' } breaks it up ----
  DIO.prop('incense', (p) => {
    const g = new THREE.Group(), lift = p.lift ?? 0;
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.32, 10), BRONZE()); stand.position.y = lift + 0.16; g.add(stand);
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FF7A2A').multiplyScalar(2), toneMapped: false })); ember.position.y = lift + 0.34; g.add(ember);
    const puffs = [], N = p.n ?? 14, rng = FW.rng(p.seed ?? 5);
    for (let i = 0; i < N; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex('235,228,215'), transparent: true, depthWrite: false, opacity: 0 })); g.add(sp); puffs.push({ sp, ph: i / N, sw: rng() * 6.28, sx: (rng() - 0.5) * 0.6 }); }
    const H = p.h ?? 2.4;
    g.userData.frame = (t, evs) => {
      const sc = last(evs, 'scatter'), ks = prog(t, sc, 1.2);
      puffs.forEach((pf) => {
        const u = (t * 0.16 + pf.ph) % 1, y = lift + 0.4 + u * H;
        const x = Math.sin(t * 0.9 + pf.sw + u * 4) * 0.18 * u + pf.sx * u * (1 + ks * 4), z = Math.cos(t * 0.7 + pf.sw) * 0.12 * u;
        pf.sp.position.set(x, y, z); const sz = 0.18 + u * 0.55 + ks * 0.6; pf.sp.scale.set(sz, sz, 1);
        pf.sp.material.opacity = Math.sin(u * Math.PI) * (p.op ?? 0.2) * (1 - ks);
      });
      ember.visible = ks < 0.3;
    };
    return g;
  });

  // ---- an offering bowl (grain / oil), and a stone pillar and wall for the court ----
  DIO.prop('bowl', (p) => {
    const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, 6.29, Math.PI / 2, Math.PI / 2), M(p.col || '#9A6A3E')); b.rotation.x = Math.PI; b.position.y = 0.16; g.add(b);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 12), M(p.fill || '#E6D2A0')); fill.position.y = 0.15; g.add(fill);
    g.position.y = p.lift ?? 0; return LW.shadowy(g);
  });
  DIO.prop('pillar', (p) => {
    const g = new THREE.Group(), h = p.h ?? 3.2, c = p.col || '#B7A88C';
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, h, 14), STONE(c)); sh.position.y = h / 2; g.add(sh);
    for (const [y, w] of [[0.09, 0.62], [h + 0.08, 0.62]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, w), STONE('#A39278')); b.position.y = y; g.add(b); }
    return LW.shadowy(g);
  });
  DIO.prop('wall', (p) => {
    const g = new THREE.Group(), w = p.w ?? 4, h = p.h ?? 2.6;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), STONE(p.col || '#A8987C')); m.position.y = h / 2; g.add(m);
    for (let i = 1; i < 5; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.025, 0.42), STONE('#8E7E66')); l.position.y = (h / 5) * i; g.add(l); }
    return LW.shadowy(g);
  });
})();
// ---- a background mountain (Sinai), hazed by the set's fog ----
(function () {
  const THREE = globalThis.THREE, LW = globalThis.LW, DIO = globalThis.DIORAMA;
  DIO.prop('mountain', (p) => {
    const s = p.s ?? 1, geo = new THREE.ConeGeometry(6 * s, (p.h ?? 5) * s, 7, 3);
    const m = new THREE.Mesh(LW.jitter ? LW.jitter(geo, 0.6 * s, globalThis.FW.rng(p.seed ?? 3)) : geo, LW.M(p.col || '#8E6E58')); m.position.y = ((p.h ?? 5) * s) / 2 - 0.3;
    const g = new THREE.Group(); g.add(m); return g;
  });
})();
