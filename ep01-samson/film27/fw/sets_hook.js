// HOOK set: a ridge at Lehi in the blue hour. Samson bound with two new ropes; on the word, the Spirit of the
// LORD rushes upon him and the ropes "became as flax that has caught fire" (Judges 15:13-14).
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, P = FW.PAL, SETS = FW.SETS;
  const M = (c, o) => FW.mat(c, o);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  // a luminous blue-hour environment shared by the outdoor sets
  FW.blueHour = (scene, o = {}) => {
    const sky = scene.userData.sky;
    sky.set({ top: o.top || '#1C2A50', mid: o.mid || '#4A5A8C', bot: o.bot || '#E39A74', hz: o.hz === undefined ? 0.0 : o.hz, glowCol: o.glow || '#FFB27A', glowDir: o.glowDir || [-0.55, 0.02, -0.85], glowPow: o.glowPow || 3.2 });
    scene.userData.stars.material.opacity = o.stars === undefined ? 0.55 : o.stars;
    scene.fog.color.set(o.fog || '#6A6A92'); scene.fog.density = o.density || 0.012;
    // layered ridges with mist between them
    const layers = o.layers || [[-60, 9, '#55588A', 3, -3], [-95, 16, '#45487A', 7, -5], [-140, 26, '#383C68', 11, -8], [-200, 40, '#2E325C', 15, -12]];
    for (const [z, h, c, sd, y] of layers) { const r = FW.ridge({ z, height: h, color: c, seed: sd, y, width: 520 }); r.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(c), fog: true }); scene.add(r); }
    for (const [z, y, w, op] of o.mist || [[-48, 1.5, 260, 0.25], [-80, 3, 320, 0.22], [-120, 6, 420, 0.18]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 26), new THREE.MeshBasicMaterial({ map: FW.mistTex(), color: new THREE.Color(o.mistColor || '#C9A8B0'), transparent: true, opacity: op, depthWrite: false, fog: false }));
      at(m, 0, y, z); scene.add(m);
    }
    const sunGlow = FW.glowSprite(o.sunColor || '#FFC08A', 140, 0.5); at(sunGlow, -90, -6, -230); scene.add(sunGlow);
    return { sunGlow };
  };
  FW.mistTex = (() => { let t = null; return () => { if (t) return t; t = FW.canvasTex(256, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(0.2, 'rgba(0,0,0,1)'); g2.addColorStop(0.8, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, w, h); }); return t; }; })();

  SETS.ridge = () => {
    const scene = FW.baseScene({ fog: '#6A6A92', density: 0.012 });
    const env = FW.blueHour(scene);
    const hill = (x, z) => { const d = Math.hypot(x * 0.8, z); return 1.4 * Math.exp(-(d * d) / 30) - Math.max(0, d - 7) * 0.45 + (FW.fbm(x * 0.09 + 5, z * 0.09 + 2, 7) - 0.5) * 2.0; };
    const ter = FW.terrain({ size: 220, seg: 110, fn: hill, height: 3, flat: [0, 0, 1.6, 2.5, hill(0, 0)], low: '#6A5444', high: '#8E7058', dark: '#3E3030', seed: 9 });
    scene.add(ter);
    const y0 = ter.heightAt(0, 0);
    const R = FW.rng(14);
    // rocks: a ring of boulders behind him, a few dark ones near the lens for depth
    for (let i = 0; i < 12; i++) { const a = Math.PI * (1.1 + R() * 0.8), r = 2.2 + R() * 4; const x = Math.cos(a) * r, z = Math.sin(a) * r; const rk = FW.rock(i + 120, 0.3 + R() * 0.7, '#6E5E52'); at(rk, x, ter.heightAt(x, z) + 0.1, z); scene.add(rk); }
    for (const [x, z, s] of [[-1.9, 3.2, 0.55], [2.3, 3.0, 0.7], [-2.8, 1.6, 0.4]]) { const rk = FW.rock(Math.round(x * 10 + 300), s, '#3A3036'); at(rk, x, ter.heightAt(x, z) + 0.05, z); scene.add(rk); }
    scene.add(FW.tufts({ n: 90, r0: 0.7, r1: 8, seed: 5, heightAt: ter.heightAt, color: '#7A7448', size: 0.6, skipFront: false }));
    // lights: warm horizon rim from behind-left, cool fill from the front-right
    const hemi = new THREE.HemisphereLight(new THREE.Color('#7A88B8'), new THREE.Color('#4A3A30'), 1.15); scene.add(hemi);
    const rim = new THREE.DirectionalLight(new THREE.Color('#FFB27A'), 2.6); rim.position.set(-9, 5, -14); rim.castShadow = true;
    rim.shadow.mapSize.set(2048, 2048); Object.assign(rim.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 60 }); rim.shadow.bias = -0.0006; rim.shadow.normalBias = 0.03; rim.shadow.radius = 3;
    scene.add(rim); rim.target.position.set(0, y0, 0); scene.add(rim.target);
    const fill = new THREE.DirectionalLight(new THREE.Color('#9DB2E6'), 1.0); fill.position.set(6, 6, 10); scene.add(fill);
    // Samson, bound
    const S = FW.samson(); at(S, 0, y0, 0); S.rotation.y = 0.32; scene.add(S);
    // two new ropes (Judges 15:13): coils around his chest and arms, on the spine so they follow him
    const ropeM = M('#C9A46C', { flatShading: false, roughness: 0.9 });
    const coils = new THREE.Group(); S.parts.spine.add(coils);
    for (const [y, r] of [[0.12, 0.27], [0.22, 0.3], [0.32, 0.315], [0.41, 0.3]]) { const c = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 8, 40), ropeM); c.rotation.x = Math.PI / 2 + (R() - 0.5) * 0.12; c.scale.set(1.0, 0.72, 1); c.position.y = y; c.castShadow = true; coils.add(c); }
    // burning rope fragments + sparks + shockwave (all deterministic in t)
    const frags = [];
    const fragG = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6);
    for (let i = 0; i < 48; i++) {
      const m = new THREE.Mesh(fragG, new THREE.MeshStandardMaterial({ color: new THREE.Color('#C9A46C'), emissive: new THREE.Color('#FF7A2A'), emissiveIntensity: 1, roughness: 0.9 }));
      const a = (i / 48) * Math.PI * 2 + R() * 0.2, h = 1.05 + (i % 4) * 0.1;
      const v = new THREE.Vector3(Math.cos(a) * (1.6 + R() * 2.2), 1.2 + R() * 2.6, Math.sin(a) * (1.6 + R() * 2.2));
      m.userData = { p0: new THREE.Vector3(Math.cos(a) * 0.3, h, Math.sin(a) * 0.22), v, w: new THREE.Vector3(R() * 9, R() * 9, R() * 9), life: 0.9 + R() * 0.9 };
      m.visible = false; scene.add(m); frags.push(m);
    }
    const NS = 260, sp = new Float32Array(NS * 3), sdata = [];
    for (let i = 0; i < NS; i++) { const a = R() * Math.PI * 2, e = (R() - 0.3) * 1.4; sdata.push([Math.cos(a) * Math.cos(e), Math.sin(e) + 0.3, Math.sin(a) * Math.cos(e), 2 + R() * 5, 0.5 + R() * 1.4]); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sparks = new THREE.Points(sg, new THREE.PointsMaterial({ size: 5, sizeAttenuation: false, color: new THREE.Color('#FFC46A'), map: FW.radialTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    scene.add(sparks);
    const wave = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFE2A8'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    wave.rotation.x = -Math.PI / 2; at(wave, 0, y0 + 0.04, 0); scene.add(wave);
    const kick = FW.dust({ n: 120, box: [7, 1.2, 7], center: [0, y0 + 0.5, 0], color: '#E8C8A0', size: 4.5, seed: 33, opacity: 0 }); scene.add(kick);
    const gl = FW.godLight(scene, [0, y0, 0], { from: [-3.0, 15, 2.6], intensity: 320, angle: 0.2, r1: 1.9 });
    const gather = FW.glowSprite('#FFE0A0', 6, 0); at(gather, -1.2, y0 + 6.5, 1.0); scene.add(gather);
    const set = { scene, samson: S, y0, ter, focus: [0, y0 + 1.3, 0] };
    set.anchors = { samson: new THREE.Vector3(0, y0 + 1.8, 0) };
    // s: { tb: burst time (absolute t), god override }
    set.update = (t, s = {}) => {
      const tb = s.tb === undefined ? 1e9 : s.tb, d = t - tb;
      // light: gathers above before the burst, slams down on it, settles
      const pre = FW.smooth(FW.clamp((d + 1.1) / 1.0));
      const god = s.god !== undefined ? s.god : d < 0 ? 0.12 * pre : 1.0 + 0.6 * Math.exp(-d * 5);
      gl.set(god, t);
      gather.material.opacity = d < 0 ? 0.55 * pre : 0.55 * Math.exp(-d * 3); gather.scale.setScalar(4 + 4 * pre);
      // pose: bound -> anticipation -> burst (overshoot) -> power stance
      const ant = FW.smooth(FW.clamp((d + 0.85) / 0.85));
      const up = d < 0 ? 0 : FW.ease.outBack(FW.clamp(d / 0.32), 2.2);
      let pose = FW.mix(FW.POSE.bound, FW.add(FW.POSE.bound, { headX: -0.15, hipY: -0.11, brow: 1, legL: { x: 0.25, k: 0.5 }, legR: { x: -0.1, k: 0.35 } }), ant);
      pose = FW.mix(pose, FW.POSE.burst, up);
      pose.wind = d < 0 ? 0.15 : 0.9 * Math.exp(-d * 0.9) + 0.25; pose.phase = 0.4;
      S.pose(pose, t);
      coils.visible = d < 0;
      // fragments: fly out, spin, burn out
      frags.forEach((f) => {
        const u = f.userData, k = d;
        f.visible = k >= 0 && k < u.life;
        if (!f.visible) return;
        const sx = Math.sin(S.rotation.y), cx = Math.cos(S.rotation.y);
        const px = u.p0.x * cx + u.p0.z * sx, pz = -u.p0.x * sx + u.p0.z * cx;
        f.position.set(px + u.v.x * k, y0 + u.p0.y + u.v.y * k - 4.9 * k * k, pz + u.v.z * k);
        f.rotation.set(u.w.x * k, u.w.y * k, u.w.z * k);
        f.material.emissiveIntensity = 2.2 * (1 - k / u.life);
        f.scale.setScalar(1 - 0.6 * (k / u.life));
      });
      // sparks
      if (d >= 0 && d < 2.6) {
        for (let i = 0; i < NS; i++) { const q = sdata[i], k = Math.min(d, q[4]); const dist = q[3] * (1 - Math.exp(-k * 2.2)) / 2.2;
          sp[i * 3] = q[0] * dist; sp[i * 3 + 1] = y0 + 1.25 + q[1] * dist - 0.8 * k * k + 0.3 * Math.sin(t * 3 + i); sp[i * 3 + 2] = q[2] * dist; }
        sg.attributes.position.needsUpdate = true;
        sparks.material.opacity = 0.95 * Math.exp(-d * 1.1); sparks.visible = true;
      } else sparks.visible = false;
      // shockwave ring + kicked-up dust
      if (d >= 0 && d < 1.2) { const k = FW.ease.out(d / 0.9); wave.scale.setScalar(0.3 + 6.5 * k); wave.material.opacity = 0.85 * (1 - FW.clamp(d / 0.9)); wave.visible = true; } else wave.visible = false;
      kick.material.opacity = d >= 0 ? 0.7 * Math.exp(-d * 0.9) : 0; kick.visible = d >= 0 && d < 4; kick.update(d >= 0 ? d * 2.5 : 0);
    };
    return set;
  };
  // ---------------------------------------------------------------- HOOK (2.5D cut-out): Samson bound on the crag at Lehi
  FW.dawnSky = (scene, o = {}) => {
    FW.paintSky(scene, Object.assign({ top: '#151A42', mid: '#4A3C76', bot: '#E39074', glow: '#D9895E', glowDir: [-0.25, 0.02, -0.97], glowPow: 14, hz: -0.05, stars: 0.85, cloud: '#E89A8C' }, o.sky || {}));
    const L = o.layers || [
      [-230, 300, -40, 8, 0.0, 41, '#E2A08C', '#F0B498', 0.012],
      [-170, 280, -40, 12, 0.4, 42, '#B47688', '#CF8E8E', 0.016],
      [-115, 230, -40, 14, 0.5, 43, '#7C5880', '#946888', 0.021],
      [-70, 170, -40, 13, 0.6, 44, '#4E3C68', '#5E4A76', 0.028],
      [-36, 110, -40, 10, 0.7, 45, '#2C2442', '#382C4E', 0.042],
    ];
    const yOff = o.yOff === undefined ? -6 : o.yOff;
    for (const [z, w, b, h, r, sd, c, top, fq] of L) { const m = FW.layer({ z, width: w, base: b, height: h, rough: r, seed: sd, color: c, top, freq: fq }); m.position.y = yOff * (-z / 230) - 2; scene.add(m); }
    for (const [z, y, w, op, col] of [[-200, -9, 560, 0.5, '#FFD2A6'], [-140, -7.5, 440, 0.4, '#E8A69A'], [-92, -6, 300, 0.32, '#B48098'], [-52, -4.5, 200, 0.25, '#7A5E86']]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 14), new THREE.MeshBasicMaterial({ map: FW.mistTex(), color: new THREE.Color(col), transparent: true, opacity: op, depthWrite: false, fog: false }));
      m.position.set(0, y, z); scene.add(m);
    }
    const sun = FW.glowSprite('#FFD9A8', 120, 0.3); sun.position.set(-45, -14, -215); scene.add(sun);
    return { sun };
  };

  SETS.hook = () => {
    const scene = new THREE.Scene();
    FW.dawnSky(scene);
    const LIGHT = [-0.55, 0.85];
    // the crag (silhouette with a warm rim)
    const crag = FW.silShape([[-9, -6], [-9, -2.4], [-5.5, -1.6], [-3.2, -0.9], [-1.6, -0.25], [-0.9, -0.04], [0.0, 0.0], [0.9, -0.03], [1.5, -0.2], [2.3, -0.7], [3.8, -1.5], [6.5, -2.2], [9, -2.6], [9, -6]], { color: '#0C0910', rim: '#FFB48A', rimW: 0.03, light: LIGHT, z: -0.1 });
    scene.add(crag);
    scene.add(FW.blades({ x0: -2.6, x1: 2.6, y: -0.02, z: -0.05, n: 160, h: 0.1, seed: 5 }));
    const far = FW.silShape([[-30, -12], [-30, -3.6], [-18, -3.1], [-11, -3.4], [-6, -3.0], [-2, -3.5], [4, -3.2], [12, -3.6], [30, -3.3], [30, -12]], { color: '#191224', gradTop: '#2A2038', z: -12 });
    scene.add(far);
    // foreground rock, very close to the lens, out of focus by darkness alone
    const fg = FW.silShape([[-4.5, -4], [-4.5, -0.9], [-3.6, -0.55], [-2.9, -0.7], [-2.4, -1.4], [-2.2, -4]], { color: '#060408', z: 2.6 });
    scene.add(fg);
    // God's beam from the top left; Samson stands in front of it as a silhouette
    const beam = FW.beam({ from: [-4.2, 11.5, -0.9], to: [0.15, -0.2, -0.9], w0: 0.6, w1: 2.6, color: '#FFE0A6', opacity: 0 }); scene.add(beam);
    const beam2 = FW.beam({ from: [-4.6, 11.5, -1.2], to: [-0.3, -0.2, -1.2], w0: 0.3, w1: 1.4, color: '#FFD08A', opacity: 0 }); scene.add(beam2);
    const halo = FW.glowSprite('#FFD9A0', 4, 0); halo.position.set(0.05, 1.3, -0.4); scene.add(halo);
    const gather = FW.glowSprite('#FFE6B4', 7, 0); gather.position.set(-2.2, 6.5, -0.8); scene.add(gather);
    // Samson
    const S = FW.cut({ kind: 'samson', cape: false, dir: 1, rim: '#FFBE8C', light: LIGHT, build: 1.15, scale: 1.0 }); S.position.set(0, 0, 0); scene.add(S);
    // two new ropes (Judges 15:13), coiled over the silhouette
    const ropeM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#9C7A4E'), side: THREE.DoubleSide });
    const coils = new THREE.Group(); coils.position.z = 0.004; S.body.spine.add(coils);
    for (const [y, a] of [[0.12, 0.12], [0.2, -0.08], [0.28, 0.1], [0.36, -0.06], [0.43, 0.08]]) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.018), ropeM); c.position.set(0.0, y, 0); c.rotation.z = a; coils.add(c);
    }
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.5), ropeM); tail.position.set(0.12, -0.05, 0); tail.rotation.z = 0.15; coils.add(tail);
    // burning flax, sparks, shockwave, dust
    const R = FW.rng(77), frags = [];
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.06 + R() * 0.05, 0.014), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFB050'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const a = R() * Math.PI * 2;
      m.userData = { p0: new THREE.Vector3((R() - 0.5) * 0.35, 1.1 + R() * 0.38, 0.01 + R() * 0.05), v: new THREE.Vector3(Math.cos(a) * (3.2 + R() * 3.4), Math.sin(a) * (2.6 + R() * 2.8) + 1.0, 0.3 + R() * 0.8), w: (R() - 0.5) * 18, life: 0.55 + R() * 0.6 };
      m.visible = false; scene.add(m); frags.push(m);
    }
    const NS = 300, sp = new Float32Array(NS * 3), sdata = [];
    for (let i = 0; i < NS; i++) { const a = R() * Math.PI * 2; sdata.push([Math.cos(a), Math.sin(a) * 0.9 + 0.25, (R() - 0.5) * 0.6, 1.8 + R() * 5, 0.6 + R() * 1.7]); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const sparks = new THREE.Points(sg, new THREE.PointsMaterial({ size: 6, sizeAttenuation: false, color: new THREE.Color('#FFC46A'), map: FW.radialTex(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    scene.add(sparks);
    const wave = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: FW.ringTex(), color: new THREE.Color('#FFE0AA'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    wave.position.set(0.05, 0.02, 0.2); scene.add(wave);
    const kick = FW.dust({ n: 120, box: [6, 0.9, 1.5], center: [0, 0.35, 0.2], color: '#FFD8A8', size: 4.5, seed: 33, opacity: 0 }); scene.add(kick);
    const motes = FW.dust({ n: 90, box: [9, 9, 4], center: [0, 3, -1], color: '#FFD4A0', size: 3, seed: 34, opacity: 0.6 }); scene.add(motes);
    const set = { scene, samson: S, focus: [0, 1.2, 0] };
    set.anchors = { samson: new THREE.Vector3(0.05, 1.75, 0) };
    set.update = (t, s = {}) => {
      const tb = s.tb === undefined ? 1e9 : s.tb, d = t - tb;
      const pre = FW.smooth(FW.clamp((d + 1.3) / 1.2));
      const god = d < 0 ? 0.22 * pre : 0.8 + 0.5 * Math.exp(-d * 4);
      beam.setOpacity(0.85 * god); beam2.setOpacity(0.45 * god);
      halo.material.opacity = d < 0 ? 0.12 * pre : 0.38 * Math.exp(-d * 3) + 0.18; halo.scale.setScalar(2.2 + 2.6 * Math.exp(-Math.max(0, d) * 3));
      gather.material.opacity = d < 0 ? 0.45 * pre : 0.4 * Math.exp(-d * 5);
      S.setRim(d < 0 ? '#FFBE8C' : '#FFD98E', d < 0 ? 0.014 : 0.014 + 0.02 * Math.exp(-d * 2.5));
      const ant = FW.smooth(FW.clamp((d + 0.9) / 0.9));
      const up = d < 0 ? 0 : FW.ease.outBack(FW.clamp(d / 0.28), 2.4);
      // from frame one he strains against the ropes in pulses, harder each time, until they burn off on "give"
      const tense = d < -0.9 ? FW.clamp(0.18 + 0.12 * Math.max(0, t) ) * Math.pow(Math.max(0, Math.sin(t * 2.9 - 0.6)), 2) : 0;
      let pose = FW.mix(FW.CUT.bound, FW.CUT.strain, Math.max(ant, Math.min(0.75, tense)));
      coils.position.x = 0.006 * Math.sin(t * 41) * tense; coils.scale.x = 1 + 0.04 * tense;
      pose = FW.mix(pose, FW.CUT.burst, up);
      pose.wind = d < 0 ? 0.3 + 0.1 * ant : 1.3 * Math.exp(-d * 0.7) + 0.35; pose.phase = 0.4;
      S.pose(pose, t);
      coils.visible = d < 0;
      frags.forEach((f) => {
        const u = f.userData; f.visible = d >= 0 && d < u.life; if (!f.visible) return;
        f.position.set(u.p0.x + u.v.x * d, u.p0.y + u.v.y * d - 4.9 * d * d, u.p0.z + u.v.z * d); f.rotation.z = u.w * d;
        const k = d / u.life; f.material.color.set(k < 0.35 ? '#FFD07A' : '#FF6A2A'); f.material.opacity = 1 - k * k;
      });
      if (d >= 0 && d < 3) {
        for (let i = 0; i < NS; i++) { const q = sdata[i], k = Math.min(d, q[4]); const dist = q[3] * (1 - Math.exp(-k * 2.4)) / 2.4;
          sp[i * 3] = q[0] * dist; sp[i * 3 + 1] = 1.2 + q[1] * dist - 0.6 * k * k + 0.1 * Math.sin(t * 3 + i); sp[i * 3 + 2] = q[2] * dist + 0.1; }
        sg.attributes.position.needsUpdate = true; sparks.material.opacity = Math.exp(-d * 1.0); sparks.visible = true;
      } else sparks.visible = false;
      wave.visible = false;
      kick.material.opacity = d >= 0 ? 0.7 * Math.exp(-d * 0.8) : 0; kick.visible = d >= 0 && d < 4; kick.update(d >= 0 ? d * 2.6 : 0);
      motes.update(t);
    };
    return set;
  };
})();
