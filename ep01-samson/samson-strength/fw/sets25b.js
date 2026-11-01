// Ep 1 sets in the 2.5D cut-out look, part 2: the field (angel), the valley, Etam, the feast at Timnah,
// the split frame, the ridge at dawn, the prison mill, the temple (inside, the pillars, the fall), Hebrews 11.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, SETS = FW.SETS;
  const add = (scene, ...o) => { for (const x of o) scene.add(x); return o[0]; };
  const lerpC = (a, b, x) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), FW.clamp(x)).getHexString();
  const glowDisc = (r, color, op = 0.8) => new THREE.Mesh(new THREE.CircleGeometry(r, 48), new THREE.MeshBasicMaterial({ map: FW.radialTex(), color: new THREE.Color(color), transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));

  // ---------------------------------------------------------------- FIELD at night: the angel of the LORD appears to the woman (Judges 13:3)
  SETS.field = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.night, LIGHT = [0.85, 0.5];
    FW.outdoor(scene, pal);
    const moon = FW.glowSprite('#B8C8FF', 14, 0.5); moon.position.set(-14, 26, -120); scene.add(moon);
    add(scene, FW.silShape([[-14, -5], [-14, -0.2], [-5, -0.05], [0, 0], [5, -0.1], [14, -0.3], [14, -5]], { color: '#06070F', rim: '#8EA4F0', rimW: 0.02, light: [0, 1], z: -0.15 }));
    add(scene, FW.silShape([[-14, -6], [-14, 0.0], [14, 0.0], [14, -6]], { color: '#06070F', z: 0.3 })); // near ground: hides anything below the ground line
    add(scene, FW.blades({ x0: -5, x1: 5, y: -0.02, z: 0.32, n: 220, h: 0.16, seed: 9, color: '#06070F' }));
    for (const [x, z, sc, sd] of [[-4.2, -4.5, 1.5, 3], [4.4, -6.5, 1.7, 5], [-7.5, -9, 2.0, 7], [8, -11, 2.2, 9]]) { const o = FW.oliveSil(sd, { color: '#080A16', rim: '#6E84D0', light: [0, 1], z }); o.position.x = x; o.scale.setScalar(sc); scene.add(o); }
    const zorah = new THREE.Group(); zorah.position.set(9, 0.2, -24); scene.add(zorah);
    for (let i = 0; i < 6; i++) zorah.add(FW.polySil(FW.SHAPES.house(1.6 + (i % 2) * 0.6, 1.4 + (i % 3) * 0.4, i), { color: '#0C0E22', x: -4 + i * 1.6 }));
    const woman = FW.PEOPLE.woman({ dir: 1, rim: '#FFE6B0', light: [1, 0.35], rimW: 0.018 }); woman.position.set(-0.85, 0.035, 0); scene.add(woman);
    // the angel of the LORD: a figure of light (no wings in the text; shown only as light)
    const angel = new THREE.Group(); angel.position.set(0.8, 0, -0.05); scene.add(angel);
    const af = FW.cut({ kind: 'youth', robe: true, dir: -1, base: '#D9B678', rim: '#FFF6E0', scale: 1.15, light: [0, 1], rimW: 0.02 }); angel.add(af);
    const core = FW.glowSprite('#FFF2D0', 1.9, 0); core.position.set(0, 1.35, 0.05); angel.add(core); // a bright core: a figure made of light
    const burst = FW.glowSprite('#FFE2A0', 9, 0); burst.position.set(0, 1.4, -0.4); angel.add(burst);
    const aura = glowDisc(1.25, '#FFD890', 0.3); aura.position.set(0, 1.25, -0.08); angel.add(aura);
    const aura2 = FW.glowSprite('#FFD890', 5, 0.22); aura2.position.set(0, 1.3, -0.3); angel.add(aura2);
    const beam = FW.beam({ from: [-4.6, 12, -0.6], to: [0.8, -0.1, -0.6], w0: 0.5, w1: 2.2, color: '#FF9E3A', opacity: 0.6 }); scene.add(beam);
    const motes = FW.dust({ n: 90, box: [6, 5, 3], center: [0.6, 2, 0], color: '#FFE6B0', size: 3.2, seed: 15, opacity: 0.7 }); scene.add(motes);
    const set = { scene, anchors: { angel: new THREE.Vector3(0.8, 2.3, 0), mother: new THREE.Vector3(-0.75, 1.5, 0) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      const a = FW.clamp(s.angel === undefined ? 1 : s.angel);
      af.setOpacity(a); aura.material.opacity = 0.3 * a; aura2.material.opacity = 0.16 * a; beam.setOpacity(0.55 * a); angel.visible = a > 0.01;
      core.material.opacity = 0.42 * a; burst.material.opacity = 0.75 * Math.sin(Math.PI * FW.clamp(a * 1.4)) * (a < 0.72 ? 1 : 0.0) + 0.0; burst.scale.setScalar(4 + 8 * a);
      angel.position.y = Math.sin(t * 1.2) * 0.03;
      af.pose(FW.add(FW.CUT.stand, { armNear: { s: 0.55, e: 0.6 }, armFar: { s: 0.4, e: 0.5 }, headX: 0.1 }), t);
      woman.pose(FW.add(FW.CUT.kneel, { headX: -0.25, armNear: { s: 1.0, e: 1.4 }, armFar: { s: 0.9, e: 1.5 }, lean: -0.05 }), t);
      woman.setRim(lerpC('#8EA4F0', '#FFE6B0', a));
    };
    return set;
  };

  FW.bannerTex = (() => { let t = null; return () => { if (t) return t; t = FW.canvasTex(128, 192, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#7A2A1C'); g.addColorStop(0.5, '#B8462A'); g.addColorStop(1, '#6A2418'); x.fillStyle = g; x.fillRect(0, 0, w, h - 26);
    for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(i * w / 5, h - 26); x.lineTo(i * w / 5 + w / 10, h - 4); x.lineTo((i + 1) * w / 5, h - 26); x.fill(); }
    x.strokeStyle = '#E8B47A'; x.fillStyle = '#E8B47A'; x.lineWidth = 5; x.beginPath(); x.arc(w / 2, h * 0.5, 22, Math.PI, 0); x.stroke();
    for (let i = -3; i <= 3; i++) { x.save(); x.translate(w / 2 + i * 7, h * 0.44); x.rotate(i * 0.12); x.fillRect(-2, -28, 4, 28); x.restore(); }
    const v = x.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0.25)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  }); return t; }; })();

  // ---------------------------------------------------------------- VALLEY: Israel's towns under Philistine banners (Judges 13:1, 14:4)
  SETS.valley = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.blueHour, LIGHT = [-0.5, 0.85];
    const env = FW.outdoor(scene, pal);
    const sky = scene.userData.sky;
    const ground = add(scene, FW.silShape([[-30, -8], [-30, -0.6], [-12, -0.3], [0, 0], [12, -0.3], [30, -0.7], [30, -8]], { color: '#140F22', gradTop: '#2A2140', z: -10 }));
    // towns on the valley floor and hills
    const towns = new THREE.Group(); scene.add(towns);
    for (const [x, z, n, sd] of [[-6, -14, 5, 1], [2.5, -18, 6, 2], [9, -24, 5, 3], [-12, -26, 4, 4]]) {
      const tw = new THREE.Group(); tw.position.set(x, -0.05, z); towns.add(tw);
      for (let i = 0; i < n; i++) { const w = 1.2 + (i % 3) * 0.4, h = 1.0 + ((i * 7) % 4) * 0.25; tw.add(FW.polySil(FW.SHAPES.house(w, h, i), { color: '#120E1E', rim: pal.rim, rimW: 0.03, light: LIGHT, x: -n * 0.7 + i * 1.4 })); const win = FW.window(0.16, 0.2, '#FFB868', 0.7); win.position.set(-n * 0.7 + i * 1.4 + 0.2, h * 0.6, 0.02); tw.add(win); }
    }
    // fields: strips of crops in perspective, with olive groves
    const fields = new THREE.Group(); scene.add(fields);
    // fields: long strips across the valley floor (alternating crop tones + a thin lighter furrow edge)
    { let z = 6; for (let r = 0; r < 18; r++) {
      const d = 1.0 + r * 0.32, k = FW.clamp((6 - z) / 34), col = lerpC(lerpC(['#201A35', '#221B37', '#1F1934', '#231C38'][r % 4], '#5C4878', k * 0.9), '#141020', Math.max(0, (z - 1) / 8));
      const f = new THREE.Mesh(new THREE.PlaneGeometry(80, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(col) })); f.rotation.x = -Math.PI / 2; f.position.set(0, -0.04, z - d / 2); fields.add(f);
      const e = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.04 + r * 0.004), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5A4874'), transparent: true, opacity: 0.08 + 0.1 * k })); e.rotation.x = -Math.PI / 2; e.position.set(0, -0.035, z - d); fields.add(e);
      z -= d; } }
    // olive groves: small, set back, in clumps away from the people
    for (let i = 0; i < 22; i++) { const g = i % 3, x = [-10, 6.5, -1][g] + ((i * 2.9) % 5) - 2.5, z = [-10, -12, -19][g] - ((i * 1.7) % 3); const o = FW.oliveSil(i * 13 + 5, { color: '#0E0B18', rim: pal.rim, light: LIGHT, z }); o.position.x = x; o.scale.setScalar(0.5 + (i % 3) * 0.08); scene.add(o); }
    // Philistine banners (ember) planted among the towns
    const banners = [];
    for (const [x, z, s] of [[-3.2, -12, 1], [4.6, -16, 1.1], [-8.5, -20, 1.2], [11, -22, 1.2], [0.5, -9, 0.9]]) {
      const b = new THREE.Group(); b.position.set(x, -0.05, z); b.scale.setScalar(s); scene.add(b);
      b.add(FW.polySil([[-0.03, 0], [-0.03, 3.2], [0.03, 3.2], [0.03, 0]], { color: '#120E1E' }));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.95, 6, 6), new THREE.MeshBasicMaterial({ map: FW.bannerTex(), color: new THREE.Color('#B8A0A0'), side: THREE.DoubleSide, transparent: true })); flag.position.set(0.34, 2.68, 0.01); b.add(flag);
      const fb = flag.geometry.attributes.position.array.slice();
      b.flag = flag; b.fb = fb; banners.push(b);
    }
    // people: Israelites bowed at work (left), a Philistine patrol (right)
    const workers = FW.crowdSil({ kinds: [{ o: { kind: 'youth' }, pose: { lean: 0.6, headX: 0.3, armNear: { s: 1.2, e: 0.4 }, armFar: { s: 0.9, e: 0.5 }, legNear: { h: 0.3, k: 0.3 }, legFar: { h: -0.2, k: 0.1 } } }, { o: { kind: 'woman' }, pose: { lean: 0.4, headX: 0.3, armNear: { s: 0.9, e: 0.8 } } }],
      spots: [[-3.4, -0.05, -6.2, 0.72, 1, 0], [-2.0, -0.05, -6.8, 0.7, 1, 1], [-0.7, -0.05, -6.4, 0.72, 1, 0], [-4.8, -0.05, -7.4, 0.68, 1, 1], [-6.2, -0.05, -6.6, 0.7, -1, 0], [-1.3, -0.05, -8.4, 0.66, 1, 1]], rim: pal.rim, light: LIGHT });
    scene.add(workers);
    const patrol = FW.crowdSil({ kinds: [{ o: { kind: 'feather' }, pose: FW.add(FW.CUT.stand, { armNear: { s: 0.35, e: 0.3 } }) }], spots: [[2.0, -0.05, -6.4, 0.74, -1, 0], [2.7, -0.05, -6.7, 0.74, -1, 0], [3.4, -0.05, -6.5, 0.74, -1, 0]], rim: '#F2A098', light: LIGHT });
    scene.add(patrol);
    const freed = FW.crowdSil({ kinds: [{ o: { kind: 'youth' }, pose: FW.add(FW.CUT.stand, { headX: -0.15 }) }, { o: { kind: 'woman' }, pose: FW.add(FW.CUT.stand, { headX: -0.2 }) }, { o: { kind: 'elder', robe: true }, pose: FW.add(FW.CUT.stand, { headX: -0.1 }) }, { o: { kind: 'youth' }, pose: FW.add(FW.CUT.stand, { headX: -0.3, armNear: { s: 2.4, e: 0.3 }, armFar: { s: 2.2, e: 0.4 } }) }],
      spots: [[-3.4, -0.05, -5.6, 0.82, -1, 0], [-2.7, -0.05, -5.9, 0.8, -1, 1], [-2.2, -0.05, -5.5, 0.52, -1, 0], [-1.6, -0.05, -6.0, 0.8, -1, 2], [-0.9, -0.05, -5.7, 0.8, -1, 3], [-0.35, -0.05, -6.1, 0.55, -1, 1], [0.3, -0.05, -5.8, 0.8, -1, 1], [0.9, -0.05, -6.2, 0.78, -1, 0], [1.5, -0.05, -5.9, 0.5, -1, 0], [2.1, -0.05, -6.3, 0.78, -1, 2], [-4.3, -0.05, -6.5, 0.76, -1, 1], [2.8, -0.05, -6.6, 0.76, -1, 3], [-5.2, -0.05, -7.2, 0.74, -1, 0], [3.6, -0.05, -7.0, 0.74, -1, 1]],
      rim: '#FFD8A0', light: [-0.8, 0.6] });
    freed.visible = false; scene.add(freed);
    // the near ridge we look from
    add(scene, FW.silShape([[-14, -6], [-14, -0.6], [-6, -0.42], [-3, -0.3], [-1.5, -0.36], [0, -0.33], [2, -0.38], [7, -0.5], [14, -0.7], [14, -6]], { color: '#07050C', gradTop: '#120E1C', z: 6.2 }));
    // foreground: clumps of grass at the frame edges (soft foreground layer)
    for (const [x0, x1, z, h, sd] of [[-2.2, -1.0, 3.2, 0.2, 31], [0.9, 1.9, 3.6, 0.18, 32], [-4.5, -3.2, 1.5, 0.24, 33], [2.6, 3.8, 2.0, 0.22, 34]]) scene.add(FW.blades({ x0, x1, y: -0.05, z, n: 70, h, color: '#09070F', seed: sd }));
    const motes = FW.dust({ n: 60, box: [20, 8, 10], center: [0, 3, -8], color: '#F0C8C0', size: 3, seed: 16, opacity: 0.4 }); scene.add(motes);
    const sunrise = FW.glowSprite('#FFD8A0', 90, 0); sunrise.position.set(-20, -4, -210); scene.add(sunrise);
    const set = { scene, anchors: { banner: new THREE.Vector3(0.5, 3.2, -9) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      const night = s.night === undefined ? 0 : s.night, dawnish = s.dawnish || 0;
      sky.set({ top: lerpC(lerpC(pal.sky.top, '#060918', night), '#2A3A6E', dawnish), mid: lerpC(lerpC(pal.sky.mid, '#18204A', night), '#B47E96', dawnish), bot: lerpC(lerpC(pal.sky.bot, '#36386A', night), '#FFCC88', dawnish) });
      scene.userData.stars.material.opacity = 0.7 * (1 - dawnish) + 0.3 * night;
      sunrise.material.opacity = 0.55 * dawnish;
      const bk = FW.clamp(s.banners === undefined ? 1 : s.banners);
      banners.forEach((b, i) => {
        b.visible = bk > 0.01; b.rotation.z = (1 - bk) * (i % 2 ? 1.4 : -1.4); b.position.y = -0.05 - (1 - bk) * 0.5;
        const a = b.flag.geometry.attributes.position; for (let j = 0; j < a.count; j++) { const x0 = b.fb[j * 3], y0 = b.fb[j * 3 + 1]; a.setZ(j, Math.sin(t * 2.4 + x0 * 3 + y0 + i) * 0.08 * (x0 + 0.45)); } a.needsUpdate = true;
      });
      workers.visible = (s.workers === undefined ? 1 : s.workers) > 0.5 && !s.freed; patrol.visible = workers.visible; freed.visible = !!s.freed;
    };
    return set;
  };

  // ---------------------------------------------------------------- ETAM: 3,000 men of Judah bind Samson with two new ropes (Judges 15:11-13)
  SETS.etam = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.crimson, LIGHT = [-0.55, 0.85];
    FW.outdoor(scene, pal);
    // the rock of Etam: a cliff with a cleft behind Samson
    // the rock of Etam: faceted cliff walls with a cleft (straight-edged, so it reads as rock)
    add(scene, FW.polySil([[-9, -3], [-9, 4.5], [-7.2, 5.4], [-6, 4.9], [-4.6, 5.6], [-3.8, 4.4], [-3.1, 4.9], [-2.6, 5.6], [-2.0, 4.6], [-1.4, 4.0], [-1.2, 3.1], [-0.95, 2.4], [-1.0, 1.4], [-0.75, 0.6], [-0.7, 0.0], [0.6, 0.0], [0.75, 0.7], [0.7, 1.5], [0.95, 2.6], [1.25, 3.4], [1.6, 4.6], [2.2, 4.1], [3.0, 3.8], [3.6, 4.5], [4.2, 5.0], [4.7, 4.2], [5.0, 3.2], [5.6, -3]], { color: '#190C14', rim: pal.rim, rimW: 0.04, light: LIGHT, z: -2.2 }));
    const cleft = glowDisc(1.6, '#FF9A6A', 0.55); cleft.position.set(0, 1.5, -2.1); scene.add(cleft); // light through the cleft behind him separates the three figures
    add(scene, FW.silShape([[-14, -6], [-14, -0.2], [-4, 0.0], [0, 0.05], [5, -0.2], [14, -0.8], [14, -6]], { color: '#0A0508', rim: pal.rim, rimW: 0.025, light: LIGHT, z: -0.15 }));
    const sam = FW.PEOPLE.samson({ dir: 1, rim: pal.rim, light: LIGHT }); sam.position.set(0.0, 0.05, 0); scene.add(sam);
    const m1 = FW.PEOPLE.man({ dir: -1, rim: pal.rim, light: LIGHT }); m1.position.set(0.82, 0.03, 0.05); scene.add(m1);
    const m2 = FW.PEOPLE.elder({ dir: 1, rim: pal.rim, light: LIGHT }); m2.position.set(-0.86, 0.04, 0.04); scene.add(m2);
    // two new ropes wound around him over time
    const ropeM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#B89060'), side: THREE.DoubleSide });
    const coils = []; const cg = new THREE.Group(); cg.position.z = 0.004; sam.body.spine.add(cg);
    for (const [y, a] of [[0.1, 0.12], [0.18, -0.08], [0.26, 0.1], [0.34, -0.06], [0.42, 0.08], [0.48, -0.05]]) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.018), ropeM); c.position.set(0, y, 0); c.rotation.z = a; cg.add(c); coils.push(c); }
    const lead = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.016), ropeM); lead.position.set(0.3, 1.2, 0.01); scene.add(lead);
    // the men of Judah, a crowd down the slope (instanced)
    const R = FW.rng(23), spots = [];
    for (let i = 0; i < 70; i++) { const row = Math.floor(i / 14), x = 1.6 + (i % 14) * 0.62 + R() * 0.3 + row * 0.25, z = -0.6 - row * 1.6, y = -0.05 - row * 0.12; spots.push([x, y, z, 0.92 - row * 0.05, -1, i % 3]); }
    for (let i = 0; i < 40; i++) { const row = Math.floor(i / 10), x = -2.2 - (i % 10) * 0.65 - R() * 0.3 - row * 0.2, z = -0.9 - row * 1.6, y = -0.05 - row * 0.12; spots.push([x, y, z, 0.9 - row * 0.05, 1, i % 3]); }
    const crowd = FW.crowdSil({ kinds: [{ o: { kind: 'youth' }, pose: FW.CUT.stand }, { o: { kind: 'elder', robe: true }, pose: FW.CUT.stand }, { o: { kind: 'youth' }, pose: FW.add(FW.CUT.stand, { armNear: { s: 0.8, e: 1.2 } }) }], spots, rim: pal.rim, light: LIGHT });
    scene.add(crowd);
    const motes = FW.dust({ n: 60, box: [12, 6, 4], center: [0, 2.5, -1], color: '#FFC0A0', size: 3, seed: 17, opacity: 0.45 }); scene.add(motes);
    const set = { scene, anchors: { samson: new THREE.Vector3(0, 1.8, 0), crowd: new THREE.Vector3(3.2, 1.7, -0.6) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      const tie = FW.clamp(s.tie || 0);
      coils.forEach((c, i) => { c.visible = tie > (i + 0.5) / coils.length; });
      lead.visible = tie > 0.2; lead.rotation.z = 0.2 + Math.sin(t * 2) * 0.05;
      sam.pose(FW.add(FW.CUT.stand, { armNear: { s: 0.03, e: 0.05 }, armFar: { s: -0.03, e: 0.05 }, headX: 0.12 }), t);
      const wrap = Math.sin(t * 5);
      m1.pose(FW.add(FW.CUT.stand, { armNear: { s: 1.2 + wrap * 0.35, e: 0.6 }, armFar: { s: 1.0 - wrap * 0.3, e: 0.8 }, lean: 0.15 }), t);
      m2.pose(FW.add(FW.CUT.stand, { armNear: { s: 1.1 - wrap * 0.3, e: 0.7 }, armFar: { s: 0.9 + wrap * 0.3, e: 0.8 }, lean: 0.12 }), t);
    };
    return set;
  };

  // ---------------------------------------------------------------- FEAST at Timnah at night: Samson and his bride (Judges 14:10)
  SETS.feast = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.night;
    FW.outdoor(scene, pal, { sky: { mid: '#22285A', bot: '#4A3A6E' } });
    add(scene, FW.silShape([[-14, -6], [-14, -0.1], [14, -0.1], [14, -6]], { color: '#0A0810', z: -0.2 }));
    // a courtyard: house fronts with an uneven roofline, warm plaster lit by lamps, torches on poles
    const roofline = [[-9, 0]]; { let x = -9, k = 0; while (x < 9) { const w = 1.3 + ((k * 7) % 5) * 0.3, h = 1.95 + ((k * 3) % 4) * 0.22; roofline.push([x, h], [x + 0.12, h], [x + 0.12, h + 0.12], [x + 0.3, h + 0.12], [x + 0.3, h], [x + w, h]); x += w; k++; } } roofline.push([9, 0]);
    add(scene, FW.polySil(roofline, { color: '#24171A', rim: '#B87A50', rimW: 0.02, light: [0, 1], z: -3 }));
    add(scene, FW.polySil([[-9, 0], [-9, 0.9], [9, 0.9], [9, 0]], { color: '#1A1014', z: -2.95 })); // a darker plinth so the figures' feet read
    for (const x of [-6.2, -3.4, 3.4, 6.2]) { const w = FW.window(0.32, 0.46, '#D8883E', 0.55); w.position.set(x, 1.3, -2.98); scene.add(w); }
    const lamps = [];
    for (const x of [-3.2, -1.0, 1.0, 3.2]) {
      // a torch on a short staff: a wrapped head and a live flame (no street-lamp shapes)
      add(scene, FW.polySil([[-0.03, 0], [-0.03, 1.45], [0.03, 1.45], [0.03, 0]], { color: '#0C0810', x, z: -1.6 }));
      add(scene, FW.polySil([[-0.06, 1.42], [-0.07, 1.58], [0.07, 1.58], [0.06, 1.42]], { color: '#0C0810', x, z: -1.59 }));
      const fl = FW.propSil([[-0.07, 0], [0.07, 0], [0.05, 0.1], [0.02, 0.22], [0.0, 0.32], [-0.03, 0.2], [-0.06, 0.1]], '#FFC46A'); fl.position.set(x, 1.58, -1.585); scene.add(fl); lamps.push({ material: { set opacity(v) { fl.scale.y = 0.85 + (v - 0.75) * 1.2; } } });
      const f = FW.glowSprite('#FFB868', 1.0, 0.8); f.position.set(x, 1.7, -1.58); scene.add(f); lamps.push(f);
      const wash = FW.glowSprite('#C8703A', 5.0, 0.3); wash.material.blending = THREE.AdditiveBlending; wash.position.set(x, 1.6, -2.9); scene.add(wash);
    }
    const table = add(scene, FW.polySil([[-3.5, 0], [-3.5, 0.55], [3.5, 0.55], [3.5, 0]], { color: '#0C0810', rim: '#FFC890', rimW: 0.015, light: [0, 1], z: -1.0 }));
    for (const x of [-2.6, -1.4, 1.4, 2.6]) { const f = FW.glowSprite('#FFB868', 0.5, 0.75); f.position.set(x, 0.66, -0.98); scene.add(f); const d = FW.polySil([[-0.08, 0], [-0.05, 0.06], [0.07, 0.06], [0.1, 0]], { color: '#0C0810', x, z: -0.97 }); d.position.y = 0.55; scene.add(d); }
    const floor = FW.pool('#FFB070', 3.2, 0.22); floor.position.set(0, 0.0, 0.3); scene.add(floor);
    const pal2 = '#FFC890', LIGHT = [0, 1];
    const sam = FW.PEOPLE.samson({ dir: 1, rim: pal2, light: LIGHT }); sam.position.set(-0.45, 0, 0); scene.add(sam);
    const bride = FW.PEOPLE.veiled({ dir: -1, rim: pal2, light: LIGHT }); bride.position.set(0.45, 0, 0); scene.add(bride);
    const R = FW.rng(31), spots = [];
    for (let i = 0; i < 16; i++) { const x = -6 + i * 0.8 + R() * 0.2; if (Math.abs(x) < 1.3) continue; spots.push([x, -0.02, -1.6, 0.9, x < 0 ? 1 : -1, i % 2]); }
    const guests = FW.crowdSil({ kinds: [{ o: { kind: 'youth' }, pose: FW.add(FW.CUT.sit, { armNear: { s: 1.2, e: 1.0 } }) }, { o: { kind: 'elder', robe: true }, pose: FW.add(FW.CUT.sit, {}) }], spots, rim: pal2, light: LIGHT });
    guests.position.y = 0.0; scene.add(guests);
    const beam = FW.beam({ from: [-4.2, 12, -0.8], to: [0.0, -0.1, -0.8], w0: 0.8, w1: 3.4, color: '#FFE2A6', opacity: 0 }); scene.add(beam);
    const halo = FW.glowSprite('#FFE0A0', 5, 0); halo.position.set(0, 1.5, -0.4); scene.add(halo);
    const set = { scene, anchors: { samson: new THREE.Vector3(-0.45, 1.8, 0), bride: new THREE.Vector3(0.45, 1.7, 0) } };
    set.update = (t, s = {}) => {
      lamps.forEach((l, i) => { l.material.opacity = 0.75 + 0.15 * Math.sin(t * 7 + i * 1.7) + 0.08 * Math.sin(t * 13 + i); });
      const g = FW.clamp(s.gold || 0); beam.setOpacity(0.8 * g); halo.material.opacity = 0.5 * g;
      for (const f of [sam, bride]) f.setRim(lerpC(pal2, '#FFE6A0', g));
      sam.pose(FW.add(FW.CUT.stand, { armNear: { s: 0.6, e: 0.5 }, headX: 0.05 }), t);
      bride.pose(FW.add(FW.CUT.stand, { armNear: { s: 0.5, e: 1.2 }, armFar: { s: 0.4, e: 1.3 }, headX: 0.12 }), t);
    };
    return set;
  };

  // ---------------------------------------------------------------- SPLIT: Samson wanted a wife (top) / God wanted to free His people (bottom)
  SETS.split = () => {
    const top = SETS.feast(), bot = SETS.valley();
    const camT = FW.camera(1080 / 960), camB = FW.camera(1080 / 960);
    const set = { scene: top.scene, anchors: {} };
    set.update = (t, s = {}) => {
      top.update(t, { gold: 0 });
      bot.update(t, { night: 0.2, dawnish: 0.3 * FW.clamp(s.gold || 0), banners: 1, workers: 1 });
      set.s = s;
    };
    set.render = (r, cam, s, t) => {
      const W = FW.W, H = FW.H, k = t - (s.t0 || 0);
      r.setScissorTest(true);
      FW.setCam(camT, [-0.1 + k * 0.05, 1.6, 5.6], [-0.05, 1.45, 0], 30); r.setViewport(0, H / 2 + 4, W, H / 2 - 4); r.setScissor(0, H / 2 + 4, W, H / 2 - 4); r.render(top.scene, camT);
      FW.setCam(camB, [0.5 - k * 0.1, 3.0, 12.5], [0.2, 1.6, -10], 36); r.setViewport(0, 0, W, H / 2 - 4); r.setScissor(0, 0, W, H / 2 - 4);
      r.toneMappingExposure = 0.55 + 0.45 * FW.clamp(s.botOn === undefined ? 1 : s.botOn); r.render(bot.scene, camB); r.toneMappingExposure = 1;
      r.setScissorTest(false); r.setViewport(0, 0, W, H);
    };
    set.overlay = (ctx, t) => { ctx.fillStyle = 'rgba(227,178,92,0.9)'; ctx.fillRect(0, 958, 1080, 4); };
    return set;
  };

  // ---------------------------------------------------------------- RIDGE at dawn: the turn and the ending (Samson standing, the land below)
  SETS.ridgeEnd = () => {
    const scene = new THREE.Scene();
    const A = FW.PALS.blueHour, B = FW.PALS.dawn;
    FW.paintSky(scene, Object.assign({}, A.sky, { hz: -0.04 }));
    const sky = scene.userData.sky;
    const mk = (pal, op) => { const g = new THREE.Group(); for (const [z, w, b, h, r, sd, c, top, fq] of pal.layers) { const m = FW.layer({ z, width: w, base: b, height: h, rough: r, seed: sd, color: c, top, freq: fq }); m.position.y = -6 * (-z / 230) - 2; if (!op) m.position.z += 0.8; m.material.transparent = true; m.material.opacity = op; m.material.depthWrite = !!op; g.add(m); } scene.add(g); return g; };
    const LA = mk(A, 1), LB = mk(B, 0);
    const sun = FW.glowSprite('#FFE6B0', 120, 0); sun.position.set(-40, -12, -215); scene.add(sun);
    const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFF1CE'), transparent: true, opacity: 0, fog: false })); sunDisc.position.set(-40, -12, -214); scene.add(sunDisc);
    const LIGHT = [-0.55, 0.85];
    const crag = FW.silShape([[-9, -6], [-9, -2.4], [-5.5, -1.6], [-3.2, -0.9], [-1.6, -0.25], [-0.9, -0.04], [0.0, 0.0], [0.9, -0.03], [1.5, -0.2], [2.3, -0.7], [3.8, -1.5], [6.5, -2.2], [9, -2.6], [9, -6]], { color: '#0C0910', rim: '#FFC08E', rimW: 0.03, light: LIGHT, z: -0.1 });
    scene.add(crag); scene.add(FW.blades({ x0: -2.6, x1: 2.6, y: -0.02, z: -0.05, n: 160, h: 0.1, seed: 5 }));
    // the land below: towns waking, lamps going out as day comes
    const below = new THREE.Group(); below.position.set(0, -3.6, -8); scene.add(below);
    const towns = [];
    for (const [x, z, n] of [[-5, 0, 6], [3.5, -3, 7], [10, -7, 5], [-11, -6, 5]]) {
      const tw = new THREE.Group(); tw.position.set(x, 0, z); below.add(tw);
      for (let i = 0; i < n; i++) { const w = 1.1 + (i % 3) * 0.4, h = 1.0 + ((i * 5) % 4) * 0.25; tw.add(FW.polySil(FW.SHAPES.house(w, h, i), { color: '#100C18', rim: '#FFC890', rimW: 0.03, light: LIGHT, x: -n * 0.65 + i * 1.3 })); const win = FW.window(0.15, 0.18, '#FFB868', 0.7); win.position.set(-n * 0.65 + i * 1.3 + 0.2, h * 0.6, 0.02); tw.add(win); towns.push(win); }
    }
    const people = FW.crowdSil({ kinds: [{ o: { kind: 'youth' }, pose: FW.CUT.stand }, { o: { kind: 'woman' }, pose: FW.CUT.stand }, { o: { kind: 'elder', robe: true }, pose: FW.CUT.stand }],
      spots: Array.from({ length: 26 }, (_, i) => [-8 + i * 0.65 + Math.sin(i * 3.1) * 0.2, 0, 1.5 + Math.sin(i * 1.3) * 0.6, 0.7, i % 2 ? 1 : -1, i % 3]), rim: '#FFC890', light: LIGHT });
    below.add(people);
    below.add(FW.silShape([[-30, -6], [-30, 0], [30, 0], [30, -6]], { color: '#120E1A', z: -0.5 }));
    const S = FW.PEOPLE.samson({ dir: 1, rim: '#FFC08E', light: LIGHT }); S.position.set(0, 0, 0); scene.add(S);
    const ropes = new THREE.Group(); ropes.position.set(0.55, 0.0, 0.12); scene.add(ropes);
    { const rm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#2A1A12'), side: THREE.DoubleSide }), em = new THREE.MeshBasicMaterial({ color: new THREE.Color('#FF9A4A'), side: THREE.DoubleSide });
      const R = FW.rng(5);
      // burnt, broken lengths of the two new ropes, lying in loose curves; each broken end still glows
      for (let i = 0; i < 6; i++) {
        let x = -0.45 + i * 0.17 + R() * 0.05, y = 0.015 + R() * 0.03, a = (R() - 0.5) * 0.8; const n = 7 + Math.floor(R() * 5), w = (R() - 0.5) * 1.4;
        for (let k = 0; k < n; k++) { const seg = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.026), rm); seg.position.set(x, y, 0.001 * i); seg.rotation.z = a; ropes.add(seg); x += Math.cos(a) * 0.045; y = Math.max(0.012, y + Math.sin(a) * 0.045); a += w * 0.35 * Math.sin(k * 0.9 + i); }
        const tip = new THREE.Mesh(new THREE.CircleGeometry(0.018, 10), em); tip.position.set(x, y, 0.01); ropes.add(tip);
        const tg = FW.glowSprite('#FF9A4A', 0.18, 0.7); tg.position.set(x, y, 0.012); ropes.add(tg);
      }
      const glow = FW.glowSprite('#FFD08A', 1.2, 0.35); glow.position.set(0, 0.08, -0.01); ropes.add(glow); }
    const beam = FW.beam({ from: [-4.2, 11.5, -0.9], to: [0.15, -0.2, -0.9], w0: 0.6, w1: 2.6, color: '#FFE0A6', opacity: 0.55 }); scene.add(beam);
    const motes = FW.dust({ n: 90, box: [12, 9, 6], center: [0, 2, -2], color: '#FFD4A0', size: 3, seed: 34, opacity: 0.55 }); scene.add(motes);
    const glory = FW.glowSprite('#FFD890', 4.2, 0); glory.position.set(0.05, 1.4, -0.4); scene.add(glory);
    const set = { scene, anchors: { samson: new THREE.Vector3(0.05, 1.75, 0) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      const d = FW.clamp(s.dawn || 0);
      sky.set({ top: lerpC(A.sky.top, B.sky.top, d), mid: lerpC(A.sky.mid, B.sky.mid, d), bot: lerpC(A.sky.bot, B.sky.bot, d), glowCol: lerpC(A.sky.glow, B.sky.glow, d), glowPow: FW.lerp(9, 6, d) });
      scene.userData.stars.material.opacity = 0.7 * (1 - d);
      LB.children.forEach((m) => { m.material.opacity = d; }); LA.children.forEach((m) => { m.material.opacity = 1; });
      const up = FW.clamp(s.sunUp || 0);
      sun.material.opacity = 0.18 + 0.3 * d; sun.position.y = -12 + 9 * up; sunDisc.position.y = -12 + 9 * up; sunDisc.material.opacity = FW.clamp((d - 0.55) * 2.2);
      towns.forEach((w) => { w.children[0].material.color.set(lerpC('#FFB868', '#3A2A30', FW.clamp((d - 0.5) * 2))); });
      below.visible = (s.reveal || 0) > 0.01; people.visible = (s.reveal || 0) > 0.3;
      ropes.visible = !!s.ropes;
      glory.material.opacity = 0.5 * (s.glory || 0); S.setRim(lerpC('#FFC08E', '#FFE6A0', Math.max(d, s.glory || 0)), (0.014 + 0.006 * d) + 0.01 * (s.glory || 0));
      S.pose(FW.add(FW.CUT.stand, { headX: -0.08, wind: 0.35, armNear: { s: 0.12, e: 0.2, fist: true }, armFar: { s: -0.08, e: 0.15 }, legNear: { h: 0.14, k: 0.05 }, legFar: { h: -0.14, k: 0.03 } }), t);
      beam.setOpacity(0.5 + 0.12 * d);
    };
    return set;
  };

  // ---------------------------------------------------------------- PRISON at Gaza: blind, shaved, bound in bronze, grinding at the mill (Judges 16:21)
  SETS.prison = () => {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#05070C');
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), new THREE.MeshBasicMaterial({ map: FW.canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w * 0.42, h * 0.3, 4, w * 0.45, h * 0.45, w * 0.75); g.addColorStop(0, '#6A84B0'); g.addColorStop(0.35, '#33445E'); g.addColorStop(1, '#0C1018'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    back.position.set(0, 4, -4); scene.add(back);
    // stone arches and a barred high window with a cold shaft (no gold here)
    for (const x of [-4.5, 4.5]) add(scene, FW.polySil(FW.SHAPES.pillar(0.9, 6), { color: '#06080E', x, z: -2 }));
    const win = new THREE.Group(); win.position.set(-0.4, 4.8, -3.9); scene.add(win);
    win.add(new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.7), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9AB4E0') })));
    for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.75), new THREE.MeshBasicMaterial({ color: new THREE.Color('#06080E') })); b.position.set(-0.36 + i * 0.24, 0, 0.01); win.add(b); }
    const shaft = FW.beam({ from: [-0.4, 4.6, -3.0], to: [1.4, -0.1, -0.5], w0: 0.9, w1: 2.8, color: '#AFC6EE', opacity: 0.5 }); scene.add(shaft);
    add(scene, FW.silShape([[-14, -6], [-14, -0.02], [14, -0.02], [14, -6]], { color: '#05060A', z: -0.3 }));
    // the mill: lower stone, upper stone, and the beam he pushes
    add(scene, FW.polySil([[-0.7, 0], [-0.7, 0.45], [0.7, 0.45], [0.7, 0]], { color: '#0A0C14', rim: '#7A90C0', rimW: 0.02, light: [-0.4, 1], z: -0.6 }));
    const upper = add(scene, FW.polySil([[-0.6, 0.45], [-0.6, 0.8], [0.6, 0.8], [0.6, 0.45]], { color: '#0C0E18', rim: '#7A90C0', rimW: 0.02, light: [-0.4, 1], z: -0.55 }));
    const bar = add(scene, FW.polySil([[0, 0.66], [0, 0.74], [1.9, 0.78], [1.9, 0.7]], { color: '#0A0C14', rim: '#7A90C0', rimW: 0.015, light: [-0.4, 1], z: -0.2 }));
    const S = FW.PEOPLE.samsonBald({ dir: -1, rim: '#8EA6D8', light: [-0.4, 1], rimW: 0.012 }); scene.add(S);
    // bronze shackles: a chain from his ankle to a ring in the floor
    const chain = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.025), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5A4A3A') })); scene.add(chain);
    const motes = FW.dust({ n: 50, box: [5, 4, 3], center: [0, 1.8, -1], color: '#B8CCF0', size: 2.6, seed: 18, opacity: 0.45 }); scene.add(motes);
    const set = { scene, anchors: { samson: new THREE.Vector3(1.6, 1.7, 0) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      // he pushes the beam: walks slowly in place (the mill turns), leaning hard
      const ph = t * 0.55;
      S.position.set(1.75 + Math.sin(ph * 0.5) * 0.05, 0, 0.05);
      S.pose(FW.add(FW.cutWalk(ph, 0.6), { lean: 0.5, headX: 0.25, armNear: { s: 1.45, e: 0.25 }, armFar: { s: 1.4, e: 0.3 } }), t);
      bar.rotation.z = Math.sin(t * 0.3) * 0.01; upper.position.x = Math.sin(t * 2) * 0.01;
      chain.position.set(1.4, 0.06, 0.06); chain.rotation.z = 0.05; chain.scale.x = 1.0;
    };
    return set;
  };

  // ---------------------------------------------------------------- TEMPLE of Dagon (inside): led by the young man, he prays (Judges 16:25-28)
  SETS.temple = () => {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0C0608');
    const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ map: FW.canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.55, 8, w / 2, h * 0.5, w * 0.75); g.addColorStop(0, '#7A3020'); g.addColorStop(0.45, '#3A1612'); g.addColorStop(1, '#0C0608'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    back.position.set(0, 5, -8); scene.add(back);
    // a colonnade, torches, the crowd on the galleries (silhouettes against firelight)
    for (let i = -4; i <= 4; i++) add(scene, FW.polySil(FW.SHAPES.pillar(0.7, 7), { color: '#0A0406', x: i * 2.4, z: -6 }));
    for (const x of [-6, -2, 2, 6]) { const fl = FW.glowSprite('#FF9A4A', 2.2, 0.8); fl.position.set(x, 3.4, -5.8); scene.add(fl); }
    add(scene, FW.polySil([[-20, 4.6], [-20, 5.0], [20, 5.0], [20, 4.6]], { color: '#0A0406', z: -5.5 }));
    const R = FW.rng(41), spots = [];
    for (let i = 0; i < 30; i++) spots.push([-12 + i * 0.8 + R() * 0.3, 5.0, -5.4, 0.7, i % 2 ? 1 : -1, i % 2]);
    for (let i = 0; i < 18; i++) spots.push([2.4 + i * 0.55 + R() * 0.2, -0.02, -1.6 - (i % 2) * 0.6, 0.85, -1, (i % 3 === 0) ? 1 : 0]);
    const crowd = FW.crowdSil({ kinds: [{ o: { kind: 'feather' }, pose: FW.add(FW.CUT.stand, { armNear: { s: 1.6, e: 0.6 } }) }, { o: { kind: 'woman' }, pose: FW.CUT.stand }], spots, base: '#0A0406', rim: '#FF8A50', light: [0, 1] });
    scene.add(crowd);
    add(scene, FW.silShape([[-14, -6], [-14, -0.02], [14, -0.02], [14, -6]], { color: '#070304', z: -0.3 }));
    // the two middle pillars and the men
    for (const x of [-1.2, 1.2]) add(scene, FW.polySil(FW.SHAPES.pillar(0.8, 7.5), { color: '#0B0507', rim: '#FF9A5A', rimW: 0.03, light: [0, 1], x, z: -0.6 }));
    const S = FW.cut({ kind: 'samson', build: 1.15, dir: 1, rim: '#FF9A5A', light: [0, 1], rimW: 0.014 }); scene.add(S);
    S.body.locks.forEach((l) => l.segs.forEach((sg, k) => { sg.scale.y = k ? 0.35 : 0.5; })); S.rimRig.locks.forEach((l) => l.segs.forEach((sg, k) => { sg.scale.y = k ? 0.35 : 0.5; })); // hair growing back (16:22)
    const boy = FW.PEOPLE.man({ dir: 1, rim: '#FF9A5A', light: [0, 1], scale: 0.86 }); scene.add(boy);
    const beam = FW.beam({ from: [-3.6, 12, -0.4], to: [-0.1, -0.1, -0.4], w0: 0.6, w1: 2.4, color: '#FFE2A6', opacity: 0 }); scene.add(beam);
    const halo = FW.glowSprite('#FFE0A0', 3.2, 0); halo.position.set(-0.1, 1.5, -0.2); scene.add(halo);
    const embers = FW.dust({ n: 60, box: [10, 6, 4], center: [0, 3, -3], color: '#FF9A5A', size: 3, seed: 19, opacity: 0.5 }); scene.add(embers);
    const set = { scene, anchors: { samson: new THREE.Vector3(0, 1.8, 0) } };
    set.update = (t, s = {}) => {
      embers.update(t);
      const lead = FW.clamp(s.lead || 0), pray = FW.clamp(s.pray || 0), g = FW.clamp(s.gold || 0);
      S.position.set(FW.lerp(-1.6, -0.1, lead), 0, 0.1); boy.position.set(FW.lerp(-0.9, 0.6, lead), 0, 0.15);
      const walk = lead < 1 ? FW.cutWalk(t * 0.9, 0.7 * (1 - pray)) : {};
      S.pose(FW.mix(FW.add(FW.CUT.stand, Object.assign({}, walk, { headX: 0.2, armNear: { s: 0.6, e: 0.3 } })), FW.add(FW.CUT.stand, { headX: -0.5, armNear: { s: 2.3, e: 0.5 }, armFar: { s: 2.1, e: 0.6 }, lean: -0.1 }), pray), t);
      boy.pose(FW.add(FW.CUT.stand, Object.assign({}, lead < 1 ? FW.cutWalk(t * 0.9 + 0.3, 0.7) : {}, { armFar: { s: -0.6, e: 0.3 } })), t);
      beam.setOpacity(0.85 * g); halo.material.opacity = 0.6 * g; S.setRim(lerpC('#FF9A5A', '#FFE2A0', g), 0.014 + 0.008 * g);
    };
    return set;
  };

  // ---------------------------------------------------------------- PILLARS (front view): "strengthen me only this once" answered (Judges 16:29-30)
  SETS.pillars = () => {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0C0608');
    const back = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshBasicMaterial({ map: FW.canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.5, 8, w / 2, h * 0.5, w * 0.7); g.addColorStop(0, '#A85C32'); g.addColorStop(0.3, '#62261A'); g.addColorStop(0.65, '#240C0B'); g.addColorStop(1, '#0C0608'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    back.position.set(0, 3.5, -6); scene.add(back);
    // the hall behind: more columns and torches, a crowd on the far galleries
    for (let i = -3; i <= 3; i++) if (i) add(scene, FW.polySil(FW.SHAPES.pillar(0.6, 6.5), { color: '#170A0A', x: i * 2.3, z: -4.5 }));
    for (const x of [-4.6, 4.6]) { const fl = FW.glowSprite('#FF9A4A', 1.8, 0.7); fl.position.set(x, 3.2, -4.3); scene.add(fl); }
    add(scene, FW.silShape([[-14, -6], [-14, -0.02], [14, -0.02], [14, -6]], { color: '#070304', gradTop: '#1A0A08', z: -0.3 }));
    const roof = new THREE.Group(); roof.position.set(0, 6.0, -0.4); scene.add(roof);
    roof.add(FW.polySil([[-8, 0], [-8, 0.9], [8, 0.9], [8, 0]], { color: '#0A0406', rim: '#FFB070', rimW: 0.04, light: [0, -1] }));
    // about 3,000 on the roof (Judges 16:27): a row of watchers that falls with it
    const R0 = FW.rng(83), rs = []; for (let i = 0; i < 26; i++) rs.push([-7.5 + i * 0.6 + R0() * 0.2, 0.9, 0.02, 0.55, i % 2 ? 1 : -1, i % 2]);
    roof.add(FW.crowdSil({ kinds: [{ o: { kind: 'feather' }, pose: FW.add(FW.CUT.stand, { armNear: { s: 1.4, e: 0.6 } }) }, { o: { kind: 'woman' }, pose: FW.CUT.stand }], spots: rs, base: '#0A0406', rim: '#FF8A50', light: [0, 1] }));
    const pillars = [], cracks = [];
    for (const sx of [-1, 1]) {
      const p = new THREE.Group(); p.position.set(sx * 1.05, 0, -0.3); scene.add(p);
      const drums = [];
      for (let i = 0; i < 6; i++) { const d = FW.polySil([[-0.42, 0], [-0.42, 0.98], [0.42, 0.98], [0.42, 0]], { color: '#0B0507', rim: '#FFB070', rimW: 0.035, light: [-sx, 0.3] }); d.position.y = i; p.add(d); drums.push(d); }
      // a glowing crack that runs up the drum joints
      for (let i = 1; i < 6; i++) { const c = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.035), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFC27A'), transparent: true, opacity: 0, depthWrite: false })); c.position.set(0, i - 0.01, 0.01); p.add(c); cracks.push({ c, i }); }
      p.drums = drums; pillars.push(p);
    }
    const S = FW.cutFront({ hair: 'short', rim: '#FFD08A', light: [0, 1] }); S.scale.setScalar(1.12); scene.add(S);
    const beam = FW.beam({ from: [-3.2, 12, -0.8], to: [0, -0.1, -0.8], w0: 0.7, w1: 2.6, color: '#FFE2A6', opacity: 0 }); scene.add(beam);
    const halo = FW.glowSprite('#FFE0A0', 3.6, 0); halo.position.set(0, 1.7, -0.2); scene.add(halo);
    const dust = FW.dust({ n: 200, box: [6, 6, 2], center: [0, 3, 0.2], color: '#E8C8A0', size: 5, seed: 92, opacity: 0 }); scene.add(dust);
    const puffs = []; for (let i = 0; i < 10; i++) { const d = FW.glowSprite('#8A5A44', 2.4, 0); d.material.blending = THREE.NormalBlending; d.userData = { x: (i % 2 ? 1 : -1) * (1.25 + (i % 3) * 0.2), y: 1 + (i % 5) * 1.1 }; scene.add(d); puffs.push(d); }
    const rocks = [];
    const R = FW.rng(77);
    for (let i = 0; i < 34; i++) { const r = FW.propSil([[-0.2, -0.15], [0.15, -0.2], [0.22, 0.1], [-0.05, 0.22], [-0.25, 0.05]].map(([a, b]) => [a * (0.6 + R()), b * (0.6 + R())]), '#0A0406'); r.userData = { x: (R() - 0.5) * 6, y: 6 + R() * 1.5, v: (R() - 0.5) * 1.5, w: (R() - 0.5) * 6, d: R() * 0.35 }; r.visible = false; scene.add(r); rocks.push(r); }
    const set = { scene, anchors: { samson: new THREE.Vector3(0, 1.9, 0) } };
    set.update = (t, s = {}) => {
      const push = FW.clamp(s.push || 0), crack = FW.clamp(s.crack || 0), fall = FW.clamp(s.fall || 0), g = FW.clamp(s.gold || 0);
      S.position.set(0, 0, 0.1);
      const strain = Math.sin(t * 23) * 0.012 * push * (1 - fall);
      S.pose({ spread: FW.lerp(0.25, 1.3, push) + strain, elbow: FW.lerp(-0.2, 0.42, push), legSpread: FW.lerp(0.06, 0.26, push), knee: 0.22 * push, headTilt: 0.04 * Math.sin(t * 3) * push, headDrop: 0.07 * push, hipY: -0.1 * push }, t);
      S.setRim(lerpC('#FFB070', '#FFE6A8', g), 0.016 + 0.008 * g);
      beam.setOpacity(0.75 * g); halo.material.opacity = 0.45 * g + 0.15 * Math.sin(t * 9) * crack * g;
      pillars.forEach((p, i) => { const sx = i ? 1 : -1; p.rotation.z = -sx * (0.04 * crack + 0.55 * fall * fall); p.position.x = sx * (1.05 + 0.35 * fall); p.drums.forEach((d, j) => { d.position.x = Math.sin(j * 2.1 + i) * 0.07 * crack; d.rotation.z = Math.sin(j * 1.7 + i) * 0.06 * crack; }); });
      cracks.forEach(({ c, i }) => { c.material.opacity = FW.clamp(crack * 1.6 - (i - 1) * 0.15) * (1 - fall); });
      roof.position.y = 6.0 - 7.5 * fall * fall; roof.rotation.z = 0.18 * fall;
      dust.material.opacity = 0.75 * crack; dust.visible = crack > 0.01; dust.update(t * 1.5 + fall * 3);
      puffs.forEach((d, i) => { const k = FW.clamp(crack * 1.4 - 0.3 + fall); d.material.opacity = 0.55 * FW.smooth(k) * (1 - 0.4 * fall); d.position.set(d.userData.x * (1 + fall * 0.6), d.userData.y + fall * 1.5 * (i % 3), 0.2); d.scale.setScalar(1.6 + 3 * k); });
      rocks.forEach((r) => { const u = r.userData, k = Math.max(0, fall - u.d) * 1.6; r.visible = k > 0; r.position.set(u.x + u.v * k, u.y - 9 * k * k, 0.3); r.rotation.z = u.w * k; });
    };
    return set;
  };

  // ---------------------------------------------------------------- the temple from outside: it comes down (Judges 16:30)
  SETS.templeExt = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.crimson;
    FW.outdoor(scene, pal);
    add(scene, FW.silShape([[-30, -16], [-30, -0.2], [30, -0.2], [30, -16]], { color: '#080406', gradTop: '#3A1A1E', z: -0.5 }));
    // the city of Gaza in front of the temple: rooftops with lamps, a warm haze between
    const near = new THREE.Group(); near.position.set(0, -1.4, 7); scene.add(near);
    for (let i = 0; i < 16; i++) { const x = -11 + i * 1.5 + Math.sin(i * 2.7) * 0.3, w = 1.3 + (i % 3) * 0.35, h = 1.4 + ((i * 5) % 4) * 0.35; near.add(FW.polySil(FW.SHAPES.house(w, h, i), { color: '#0B0508', rim: pal.rim, rimW: 0.035, light: [0, 1], x })); if (i % 2) { const win = FW.window(0.16, 0.2, '#FFB060', 0.75); win.position.set(x + 0.15, h * 0.55, 0.02); near.add(win); } }
    near.add(FW.silShape([[-30, -12], [-30, 0.05], [30, 0.05], [30, -12]], { color: '#070305', gradTop: '#140810' }));
    const haze = FW.glowSprite('#C0705A', 26, 0.35); haze.material.blending = THREE.NormalBlending; haze.position.set(0, -0.6, 2); haze.scale.set(40, 5, 1); scene.add(haze);
    const city = new THREE.Group(); city.position.set(0, -0.2, -6); scene.add(city);
    for (let i = 0; i < 12; i++) { const x = -14 + i * 2.5; if (Math.abs(x) < 6) continue; city.add(FW.polySil(FW.SHAPES.house(2 + (i % 3) * 0.5, 1.5 + (i % 4) * 0.6, i), { color: '#12080E', x })); }
    // the temple: platform, columns, roof (pieces we can drop)
    const temple = new THREE.Group(); temple.position.set(0, -0.2, -2); scene.add(temple);
    const base = FW.polySil([[-6, 0], [-6, 0.8], [6, 0.8], [6, 0]], { color: '#0E060A', rim: pal.rim, rimW: 0.05 }); temple.add(base);
    const cols = [], roofs = [];
    for (let i = 0; i < 8; i++) { const c = FW.polySil(FW.SHAPES.pillar(0.6, 5), { color: '#0E060A', rim: pal.rim, rimW: 0.04, x: -5 + i * (10 / 7) }); c.position.y = 0.8; temple.add(c); cols.push(c); }
    for (let i = 0; i < 6; i++) { const r = FW.polySil([[-1.05, 0], [-1.05, 1.0], [1.05, 1.0], [1.05, 0]], { color: '#0E060A', rim: pal.rim, rimW: 0.05 }); r.position.set(-5.2 + i * 2.08, 5.8, 0.01); temple.add(r); roofs.push(r); }
    const ped = FW.polySil([[-6.4, 0], [0, 1.6], [6.4, 0]], { color: '#0E060A', rim: pal.rim, rimW: 0.05 }); ped.position.y = 6.8; temple.add(ped);
    const clouds = [];
    for (let i = 0; i < 44; i++) { const c = FW.glowSprite(i % 3 ? '#9A5A48' : '#C88A6A', 3.6, 0); c.material.blending = THREE.NormalBlending; c.userData = { x: -7 + (i / 43) * 14, a: i * 2.3, h: (i % 5) * 0.7 }; scene.add(c); clouds.push(c); }
    // rubble: a jagged heap of broken blocks, with broken column stumps still standing
    const RR = FW.rng(61), rp = [[-7.2, -0.2]];
    for (let x = -6.8; x <= 6.8; x += 0.32 + RR() * 0.25) { const hump = 1.9 * Math.exp(-(x * x) / 14); rp.push([x, 0.5 + hump + (RR() - 0.5) * 0.5]); rp.push([x + 0.12 + RR() * 0.1, 0.5 + hump + (RR() - 0.3) * 0.6]); }
    rp.push([7.2, -0.2]);
    const rubble = new THREE.Group(); rubble.position.set(0, 0, -0.9); scene.add(rubble);
    rubble.add(FW.silShape(rp, { color: '#0E060A', rim: pal.rim, rimW: 0.05 }));
    for (const [x, h, sl] of [[-5.0, 2.6, 0.5], [-3.55, 1.5, -0.4], [3.6, 2.1, 0.45], [5.0, 3.0, -0.35]]) rubble.add(FW.silShape([[x - 0.42, 0.3], [x - 0.42, h + sl * 0.3], [x - 0.15, h + 0.3], [x + 0.02, h - 0.1], [x + 0.18, h + 0.14], [x + 0.42, h - sl * 0.3], [x + 0.42, 0.3]], { color: '#0E060A', rim: pal.rim, rimW: 0.04 }));
    const plume = FW.glowSprite('#B07A64', 10, 0); plume.material.blending = THREE.NormalBlending; plume.position.set(0, 4, -1.4); scene.add(plume);
    const RD = FW.rng(19), debris = [];
    for (let i = 0; i < 40; i++) { const r = FW.propSil([[-0.2, -0.15], [0.15, -0.2], [0.22, 0.1], [-0.05, 0.22], [-0.25, 0.05]].map(([a, b]) => [a * (0.5 + RD()), b * (0.5 + RD())]), '#120709'); r.userData = { x: (RD() - 0.5) * 9, y: 2 + RD() * 5, vx: (RD() - 0.5) * 7, vy: 2 + RD() * 5, w: (RD() - 0.5) * 9, d: RD() * 0.3 }; r.visible = false; scene.add(r); debris.push(r); }
    const endBeam = FW.beam({ from: [-9, 16, -1.5], to: [0.5, 0.5, -1.5], w0: 1.2, w1: 5.5, color: '#FFD08A', opacity: 0 }); scene.add(endBeam);
    const set = { scene, anchors: {} };
    set.update = (t, s = {}) => {
      const f = FW.clamp(s.fall || 0);
      cols.forEach((c, i) => { const k = FW.clamp(f * 1.6 - Math.abs(i - 3.5) * 0.06); c.rotation.z = (i < 4 ? 1 : -1) * 0.9 * k * k; c.position.y = 0.8 - 2.5 * k * k; });
      roofs.forEach((r, i) => { const k = FW.clamp(f * 1.5 - 0.1 - Math.abs(i - 2.5) * 0.05); r.position.y = 5.8 - 7 * k * k; r.rotation.z = Math.sin(i * 2.2) * 0.8 * k; });
      ped.position.y = 6.8 - 7.5 * FW.clamp(f * 1.4 - 0.15) ** 2; ped.rotation.z = 0.2 * f;
      clouds.forEach((c, i) => { const k = FW.clamp(f * 1.3 - 0.15); c.material.opacity = 0.7 * FW.smooth(k * 1.6) * (0.6 + 0.4 * ((i % 4) / 3)); c.scale.setScalar(1.6 + 3.2 * k + c.userData.h * 0.6); c.position.set(c.userData.x * (1 + k * 0.5), 0.4 + 1.6 * k + c.userData.h * k + Math.sin(c.userData.a) * 0.6 * k, -1.2 + (i % 3) * 0.12); });
      rubble.scale.y = FW.clamp(f * 1.6 - 0.4); rubble.visible = f > 0.3;
      const pk = FW.clamp(f * 1.4 - 0.25); plume.material.opacity = 0.75 * FW.smooth(pk) * (1 - 0.25 * FW.clamp(f * 2 - 1)); plume.scale.setScalar(8 + 16 * pk); plume.position.y = 2.5 + 4.5 * pk;
      debris.forEach((r) => { const u = r.userData, k = Math.max(0, f - 0.12 - u.d) * 2.2; r.visible = k > 0 && k < 2.2; r.position.set(u.x + u.vx * k, u.y + u.vy * k - 4.9 * k * k, 0.6); r.rotation.z = u.w * k; });
      endBeam.setOpacity(0.55 * FW.smooth(FW.clamp((f - 0.6) / 0.4)));
    };
    return set;
  };

  // ---------------------------------------------------------------- DESK: Hebrews 11 on a scroll by lamplight (the list names Samson)
  SETS.desk = () => {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0A0709');
    const back = new THREE.Mesh(new THREE.PlaneGeometry(14, 10), new THREE.MeshBasicMaterial({ map: FW.canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w * 0.62, h * 0.4, 6, w * 0.6, h * 0.45, w * 0.7); g.addColorStop(0, '#6A3E22'); g.addColorStop(0.4, '#2A1810'); g.addColorStop(1, '#0A0709'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    back.position.set(0, 1.2, -3); scene.add(back);
    const NAMES = ['GIDEON', 'BARAK', 'SAMSON', 'JEPHTHAH', 'DAVID', 'SAMUEL', 'THE PROPHETS'];
    const face = (lit) => (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#E9D8B4'); g.addColorStop(1, '#D8C29A'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(120,80,40,0.25)'; for (let i = 0; i < 40; i++) { x.globalAlpha = 0.05; x.beginPath(); x.arc((i * 97) % w, (i * 53) % h, 30 + (i % 5) * 10, 0, 6.3); x.fill(); } x.globalAlpha = 1;
      x.fillStyle = '#5A3A22'; x.textAlign = 'center'; x.font = '700 44px Cinzel'; x.fillText('HEBREWS 11:32', w / 2, 120);
      x.fillStyle = 'rgba(90,58,34,0.6)'; x.fillRect(w / 2 - 120, 145, 240, 3);
      x.font = 'italic 600 44px "Cormorant Garamond"'; x.fillStyle = '#4A3020'; x.fillText('"…time would fail me to tell of', w / 2, 230);
      NAMES.forEach((n, i) => { const y = 330 + i * 92; const isS = n === 'SAMSON'; x.font = `${isS ? 900 : 700} ${isS ? 70 : 54}px Cinzel`; if (isS && lit) { x.fillStyle = '#2A170C'; x.fillRect(w / 2 - 240, y - 66, 480, 90); x.strokeStyle = '#E3B25C'; x.lineWidth = 4; x.strokeRect(w / 2 - 232, y - 58, 464, 74); x.fillStyle = '#F2C66A'; } else x.fillStyle = '#3A2414'; x.fillText(n, w / 2, y); x.shadowBlur = 0; });
      x.font = 'italic 600 40px "Cormorant Garamond"'; x.fillStyle = '#4A3020'; x.fillText('…commended through their faith." 11:39', w / 2, h - 70);
    };
    const s0 = FW.scroll(face(false), 2.0, 2.65), s1 = FW.scroll(face(true), 2.0, 2.65);
    for (const sc of [s0, s1]) { sc.position.set(0, 1.0, 0); sc.rotation.x = -0.18; scene.add(sc); sc.traverse((m) => { if (m.material) { m.material = m.material.clone(); m.material.transparent = true; } }); }
    const lamp = new THREE.Group(); lamp.position.set(1.55, 0.0, 0.4); scene.add(lamp);
    const glow = FW.glowSprite('#FFB25E', 3.5, 0.75); glow.position.set(0, 0.5, 0); lamp.add(glow);
    const fl = FW.propSil([[0, 0.38], [0.05, 0.45], [0, 0.6], [-0.05, 0.45]], '#FFE6A8'); lamp.add(fl);
    lamp.add(FW.propSil([[-0.25, 0.2], [0.25, 0.2], [0.18, 0.36], [-0.18, 0.36]], '#140A08'));
    const amb = new THREE.AmbientLight(new THREE.Color('#FFD8A8'), 1.6); scene.add(amb);
    const halo = FW.glowSprite('#FFD27A', 1.6, 0); halo.position.set(0, 1.0 + 0.3, 0.1); scene.add(halo);
    const set = { scene, anchors: {} };
    set.update = (t, s = {}) => {
      const lit = FW.clamp(s.lit || 0);
      s1.traverse((m) => { if (m.material) m.material.opacity = lit; });
      halo.material.opacity = 0.5 * lit;
      glow.material.opacity = 0.7 + 0.1 * Math.sin(t * 9);
    };
    return set;
  };
})();
