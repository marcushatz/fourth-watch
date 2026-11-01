// Ep 1 sets, part 2: Zorah home, Delilah's room, the vineyards of Timnah, Lehi, the field (the angel).
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, P = FW.PAL, SETS = FW.SETS;
  const M = (c, o) => FW.mat(c, o);
  const lerpC = (a, b, x) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), FW.clamp(x)).getHexString();
  const box = (w, h, d, c, o) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, o)); m.castShadow = m.receiveShadow = true; return m; };
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };

  // the people of Ep 1 (one look each, reused in every scene)
  FW.CAST = {
    father: () => FW.figure({ skin: FW.SKIN[2], robe: '#4E5A6E', mantle: '#3A4352', belt: '#8C7A5A', hair: 'short', hairColor: '#8E8780', beard: true, beardColor: '#A39C94', head: 'turban', veilColor: '#CFC2A6' }),
    mother: () => FW.figure({ skin: FW.SKIN[3], robe: '#5C6B52', mantle: '#46523E', belt: '#9A7A4A', head: 'veil', veilColor: '#B9A88A' }),
    delilah: () => FW.figure({ skin: FW.SKIN[0], robe: '#2E3A6B', mantle: '#7A2E3E', belt: '#C9A04A', head: 'veil', veilColor: '#8A3A4A', band: '#D9B45A' }),
    timnite: () => FW.figure({ skin: FW.SKIN[0], robe: '#A8553E', mantle: '#7A3A2C', belt: '#D9B45A', head: 'veil', veilColor: '#C77A52' }),
    soldier: (i = 0) => { const f = FW.figure({ skin: FW.SKIN[(i + 1) % 5], robe: i % 2 ? '#8E3A28' : '#A2462E', mantle: '#5E2A1E', belt: '#B08A4A', head: 'feather', hair: null, flare: 0.9 }); return f; },
    judah: (i = 0) => FW.figure({ skin: FW.SKIN[i % 5], robe: ['#7A6A55', '#8C6C4A', '#5E5A48', '#9A8060', '#6E5A44'][i % 5], mantle: ['#5A4A3A', '#6A503A', '#4A4638'][i % 3], hair: 'short', beard: i % 2 === 0, hairColor: '#2E2018', head: i % 3 === 0 ? 'turban' : null }),
    youth: () => FW.figure({ skin: FW.SKIN[4], robe: '#B59A72', mantle: '#8A6E4C', hair: 'short', hairColor: '#2A1C14', scale: 0.88 }),
    angel: () => FW.figure({ glow: '#FFF1CE', scale: 1.22 }),
  };

  // ---------------------------------------------------------------- ZORAH: the family courtyard at night
  SETS.zorah = () => {
    const scene = FW.baseScene({ fog: '#1A2236', density: 0.02 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80, 30, 30), M('#5E4A38', { roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    const outside = FW.terrain({ size: 200, seg: 60, height: 5, seed: 12, scale: 0.03, low: '#4A3C2E', high: '#6A5440', dark: '#2E241C', offset: [0, -0.2, 0], flat: [0, 0, 12, 8, -0.05] }); scene.add(outside);
    const house = FW.house({ w: 4.4, d: 3.2, h: 2.7, color: '#8A6A4C', seed: 3, stair: true, lit: 1 }); at(house, -2.6, 0, -3.2); scene.add(house);
    const wc = '#7E6148';
    scene.add(at(box(9.5, 1.7, 0.35, wc), -0.5, 0.85, -5.2));            // back wall
    scene.add(at(box(0.35, 1.7, 3.2, wc), 4.25, 0.85, -3.6));             // right wall, back part
    scene.add(at(box(0.35, 1.7, 2.2, wc), 4.25, 0.85, 1.6));              // right wall, front part (the gate between)
    for (const z of [-1.95, 0.45]) { const post = box(0.42, 2.1, 0.42, '#6A503A'); at(post, 4.25, 1.05, z); scene.add(post); }
    const lintel = box(0.5, 0.22, 2.9, '#5C3F2A'); at(lintel, 4.25, 2.15, -0.75); scene.add(lintel);
    // courtyard props
    const jar = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.18, 0.02], [0.26, 0.25], [0.2, 0.55], [0.1, 0.65], [0.12, 0.72], [0, 0.72]].map(([r, y]) => new THREE.Vector2(r, y)), 10), M('#9A6A44'));
    jar.castShadow = true; at(jar, -3.9, 0, -1.2); scene.add(jar);
    const jar2 = jar.clone(); jar2.scale.setScalar(0.75); at(jar2, -3.4, 0, -1.6); scene.add(jar2);
    const bench = box(1.6, 0.42, 0.5, '#5C3F2A'); at(bench, -0.6, 0.21, -4.5); scene.add(bench);
    const tree = FW.olive(31, 1.2); at(tree, 2.6, 0, -4.4); scene.add(tree);
    // through the gate: Timnah on a far hill, lamps lit
    const timnah = FW.town({ n: 14, radius: 5, seed: 41, color: '#6E5340', lit: 1 }); timnah.position.set(26, 1.5, -26); scene.add(timnah);
    const lamp = FW.lamp(5); at(lamp, -1.4, 1.95, -1.55); scene.add(lamp);
    const bracket = box(0.3, 0.06, 0.3, '#3A2A1E'); at(bracket, -1.45, 1.93, -1.55); scene.add(bracket);
    const rig = FW.rig({ hemiSky: '#56668E', hemiGround: '#3A2C20', hemi: 0.75, key: '#A3B6DE', keyI: 1.3, keyPos: [-6, 10, 8], target: [0, 0, -1], shadow: 9 }); scene.add(rig);
    // people
    const father = FW.CAST.father(), mother = FW.CAST.mother(), sam = FW.samson();
    at(father, -1.75, 0, 0.1); at(mother, -0.95, 0, 0.55); at(sam, 1.35, 0, 0.35);
    scene.add(father, mother, sam);
    // the memory bubble: the woman Samson saw at Timnah (Judges 14:1-2), ember-lit (his own choice)
    const bubble = new THREE.Group(); at(bubble, 2.55, 2.45, 0.55); scene.add(bubble);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.78, 40), new THREE.MeshBasicMaterial({ map: FW.radialTex(), color: new THREE.Color('#E0784A'), transparent: true, opacity: 0.55, depthWrite: false }));
    bubble.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.018, 6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F0A070'), transparent: true, opacity: 0.85 })); bubble.add(ring);
    const woman = FW.CAST.timnite(); woman.scale.setScalar(0.62); at(woman, 0, -0.5, 0.05); bubble.add(woman);
    for (const [x, y, r] of [[-0.55, -0.95, 0.09], [-0.82, -1.18, 0.06]]) { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F0A070'), transparent: true, opacity: 0.8 })); at(d, x, y, 0); bubble.add(d); }
    const ember = new THREE.PointLight(new THREE.Color('#E0603A'), 0, 7, 1.5); at(ember, 3.2, 2.2, 1.2); scene.add(ember);
    const gl = FW.godLight(scene, [-0.2, 0, 0.3], { from: [-5, 13, 3], intensity: 160, angle: 0.36, r1: 2.6 });
    const set = { scene, father, mother, samson: sam, bubble, anchors: {} };
    set.anchors = { samson: new THREE.Vector3(1.35, 1.65, 0.35), parents: new THREE.Vector3(-1.35, 1.7, 0.3), bubble: new THREE.Vector3(2.55, 3.2, 0.55) };
    set.update = (t, s = {}) => {
      lamp.flicker(t);
      const b = FW.clamp(s.bubble || 0);
      bubble.visible = b > 0.01; bubble.scale.setScalar(0.001 + FW.ease.outBack(b)); ember.intensity = 6 * b;
      woman.pose(FW.POSE.stand, t);
      if (s.cam) bubble.quaternion.copy(s.cam.quaternion);
      const shake = s.shake || 0;
      father.rotation.y = 0.75; mother.rotation.y = 0.55; sam.rotation.y = s.samRot === undefined ? 1.25 : s.samRot;
      father.pose(Object.assign({}, FW.POSE.shake, { headY: Math.sin(t * 7) * 0.22 * shake, phase: 1 }), t);
      mother.pose(Object.assign({}, FW.POSE.pray, { headY: Math.sin(t * 7 + 1) * 0.18 * shake, headX: 0.1, phase: 2 }), t);
      sam.pose(FW.mix(FW.POSE.stand, FW.POSE.point, FW.clamp(s.point || 0)), t);
      gl.set(s.gold || 0, t);
    };
    return set;
  };

  // ---------------------------------------------------------------- DELILAH: her room by lamplight (Valley of Sorek)
  SETS.delilah = () => {
    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(new THREE.Color('#120E0C'), 0.03);
    scene.background = new THREE.Color('#0C0A09');
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), M('#4A3426', { roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const rugTex = FW.canvasTex(512, 320, (x, w, h) => {
      x.fillStyle = '#6E2A2E'; x.fillRect(0, 0, w, h); x.strokeStyle = '#C9A04A'; x.lineWidth = 10; x.strokeRect(18, 18, w - 36, h - 36);
      x.fillStyle = '#2E3A6B'; for (let i = 0; i < 6; i++) { x.save(); x.translate(70 + i * 75, h / 2); x.rotate(Math.PI / 4); x.fillRect(-22, -22, 44, 44); x.restore(); }
      x.strokeStyle = 'rgba(201,160,74,0.6)'; x.lineWidth = 4; x.strokeRect(44, 44, w - 88, h - 88);
    });
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.1), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.01, 0.4); rug.receiveShadow = true; scene.add(rug);
    const wallC = '#6E5444';
    scene.add(at(box(9, 4.2, 0.3, wallC, { roughness: 1 }), 0, 2.1, -2.2));
    scene.add(at(box(0.3, 4.2, 6, wallC, { roughness: 1 }), -3.6, 2.1, 0.6));
    // window with night outside
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color('#1E2C4A') })); at(win, 1.9, 2.4, -2.04); scene.add(win);
    const sill = box(1.35, 0.1, 0.25, '#5A4232'); at(sill, 1.9, 1.7, -1.98); scene.add(sill);
    const moonGlow = FW.glowSprite('#6E86B8', 1.6, 0.35); at(moonGlow, 2.1, 2.7, -2.0); scene.add(moonGlow);
    const curtain = box(0.5, 2.6, 0.06, '#7A2E3E'); at(curtain, 1.1, 2.6, -1.98); scene.add(curtain);
    // couch with cushions
    const couch = box(3.6, 0.45, 0.95, '#5A3A2A'); at(couch, 0, 0.225, -0.9); scene.add(couch);
    const back = box(3.6, 0.6, 0.18, '#4E3224'); at(back, 0, 0.55, -1.35); scene.add(back);
    for (const [x, c] of [[-1.2, '#8A3A4A'], [0, '#C9A04A'], [1.2, '#2E3A6B']]) { const cu = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), M(c, { flatShading: false })); cu.scale.set(1.4, 0.55, 0.8); at(cu, x, 0.55, -1.15); cu.castShadow = true; scene.add(cu); }
    // the lamp on a stand between them
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 1.0, 8), M('#3A2A1E')); at(stand, 0.05, 0.5, 0.15); scene.add(stand);
    const lamp = FW.lamp(9); at(lamp, 0.0, 1.02, 0.15); scene.add(lamp);
    const hemi = new THREE.HemisphereLight(new THREE.Color('#3A4466'), new THREE.Color('#2A1A12'), 0.45); scene.add(hemi);
    const moonL = new THREE.DirectionalLight(new THREE.Color('#7E96C8'), 0.6); moonL.position.set(3, 5, -6); scene.add(moonL);
    const del = FW.CAST.delilah(), sam = FW.samson();
    at(del, -0.95, 0.12, -0.55); at(sam, 0.95, 0.12, -0.55);
    scene.add(del, sam);
    // a faint gold that stays on Samson while the Lord is with him (constant, never brighter on his failures)
    const faint = new THREE.SpotLight(new THREE.Color(P.gold), 18, 12, 0.25, 0.7, 1.5); faint.position.set(-2.5, 6.5, 2.5); faint.target.position.set(0.95, 1.0, -0.55); scene.add(faint, faint.target);
    const set = { scene, delilah: del, samson: sam, lamp };
    set.anchors = { delilah: new THREE.Vector3(-0.95, 1.35, -0.55), samson: new THREE.Vector3(0.95, 1.4, -0.55) };
    set.update = (t, s = {}) => {
      lamp.flicker(t);
      del.rotation.y = 0.95; sam.rotation.y = -0.9;
      const lean = FW.clamp(s.lean || 0);
      del.pose(Object.assign({}, FW.POSE.sit, { headZ: 0.12, headX: 0.05, armL: { sx: 0.6, sz: 0.05, e: 1.3 }, armR: { sx: 0.8, sz: 0.1, e: 1.6 }, phase: 3 }), t);
      sam.pose(Object.assign({}, FW.POSE.sit, { lean: 0.12 + 0.18 * lean, headX: 0.08 * lean, armR: { sx: 0.9 + 0.3 * Math.sin(t * 2.2) * lean, sz: 0.2, e: 1.0 }, armL: { sx: 0.6, sz: 0.05, e: 1.0 }, phase: 0.5 }), t);
      faint.intensity = 18 * (s.faint === undefined ? 1 : s.faint);
    };
    return set;
  };

  // ---------------------------------------------------------------- VINEYARDS OF TIMNAH: the lion (Judges 14:5-6)
  SETS.vineyard = () => {
    const scene = FW.baseScene({ fog: '#3A3346', density: 0.022, sky: { top: '#141A2E', mid: '#3B3F5E', bot: '#9A6A5A' } });
    scene.userData.sky.set({ glowCol: '#7A3E28', glowDir: [0.4, 0.05, -1], glowPow: 4 });
    scene.userData.stars.material.opacity = 0.45;
    const ter = FW.terrain({ size: 160, seg: 80, height: 4, seed: 21, scale: 0.035, low: '#6A5038', high: '#8A6A4A', dark: '#3A2C20', flat: [0, 0, 6, 8, 0] }); scene.add(ter);
    for (let r = 0; r < 7; r++) for (const side of [-1, 1]) {
      const row = FW.vineRow(9, r * 7 + (side > 0 ? 3 : 0)); row.position.set(side > 0 ? 1.6 : -10.6, ter.heightAt(0, -3 - r * 2.2), -3 - r * 2.2); scene.add(row);
    }
    for (let i = 0; i < 3; i++) { const w = box(22, 0.5, 0.4, '#6E5A46'); at(w, 0, ter.heightAt(0, -1.8 - i * 4.4) + 0.2, -1.8 - i * 4.4 - 1.0); scene.add(w); }
    const town = FW.town({ n: 12, radius: 5, seed: 33, color: '#7A5E44', lit: 1 }); town.position.set(18, 3, -42); scene.add(town);
    for (const [z, h, c, sd] of [[-120, 18, '#3A3550', 4], [-170, 28, '#2E2C46', 9]]) scene.add(FW.ridge({ z, height: h, color: c, seed: sd, y: -10 }));
    const rig = FW.rig({ hemiSky: '#6A6E96', hemiGround: '#3A2A1E', hemi: 0.75, key: '#E09A6A', keyI: 0.9, keyPos: [10, 5, -14], target: [0, 0, 0], shadow: 10 }); scene.add(rig);
    const sam = FW.samson(); at(sam, -0.6, 0, 0.6); scene.add(sam);
    const lion = FW.lion(); scene.add(lion);
    const gl = FW.godLight(scene, [-0.6, 0, 0.6], { from: [-4.2, 14, 3.2], intensity: 260, angle: 0.22, r1: 2.0 });
    const burst = FW.dust({ n: 90, box: [2.2, 1.6, 2.2], center: [0.3, 0.8, 0.6], color: '#E8C890', size: 4, seed: 77, opacity: 0 }); scene.add(burst);
    const set = { scene, samson: sam, lion };
    set.anchors = { samson: new THREE.Vector3(-0.6, 1.7, 0.6), lion: new THREE.Vector3(0.8, 1.3, 0.6) };
    set.update = (t, s = {}) => {
      gl.set(FW.clamp(s.gold || 0), t);
      sam.rotation.y = 1.15;
      // the lion: runs in from the right, leaps (s.leap 0..1), caught (s.caught 0..1)
      const run = FW.clamp(s.run || 0), leap = FW.clamp(s.leap || 0), caught = FW.clamp(s.caught || 0);
      const x = FW.lerp(7.5, 1.9, run) - leap * 1.15 - caught * 0.15;
      lion.position.set(x, ter.heightAt(x, 0.6) + leap * (1 - caught) * 0.35, 0.6); lion.rotation.y = -Math.PI / 2;
      lion.leap(FW.lerp(leap, 0.65, caught), t);
      lion.visible = run > 0.001;
      const grip = FW.mix(FW.POSE.stand, { armL: { sx: 1.5, sz: 0.25, e: 0.35 }, armR: { sx: 1.6, sz: 0.25, e: 0.3 }, lean: 0.1, headX: -0.05 }, FW.clamp(s.brace || 0));
      sam.pose(grip, t);
      burst.material.opacity = 0.8 * FW.clamp(s.burst || 0); burst.visible = (s.burst || 0) > 0.01;
      burst.update((s.burstT || 0) * 6);
    };
    return set;
  };

  // ---------------------------------------------------------------- LEHI: the jawbone (Judges 15:14-17)
  SETS.lehi = () => {
    const scene = FW.baseScene({ fog: '#2A2C40', density: 0.02, sky: { top: '#0E1426', mid: '#2A3150', bot: '#5A5068' } });
    const ter = FW.terrain({ size: 160, seg: 80, height: 6, seed: 61, scale: 0.04, low: '#5A4836', high: '#7A6048', dark: '#2E241C', flat: [0, 0, 7, 6, 0] }); scene.add(ter);
    const R = FW.rng(9);
    for (let i = 0; i < 16; i++) { const rk = FW.rock(i + 80, 0.3 + R() * 0.9, '#6A5A4A'); const x = -12 + R() * 24, z = -6 - R() * 14; at(rk, x, ter.heightAt(x, z), z); scene.add(rk); }
    for (const [z, h, c, sd] of [[-110, 16, '#2E3048', 5], [-160, 26, '#262A40', 13]]) scene.add(FW.ridge({ z, height: h, color: c, seed: sd, y: -8 }));
    const rig = FW.rig({ hemiSky: '#56668E', hemiGround: '#3A2A1E', hemi: 0.7, key: '#9AAAD6', keyI: 1.4, keyPos: [9, 9, -10], target: [0, 0, 0], shadow: 10 }); scene.add(rig);
    const emberL = new THREE.PointLight(new THREE.Color('#C2502E'), 6, 12, 1.4); at(emberL, 4.5, 2.5, 1.5); scene.add(emberL);
    const sam = FW.samson(); at(sam, -1.2, 0, 0.8); scene.add(sam);
    const jaw = FW.jawbone(); jaw.scale.setScalar(0.9); sam.parts.arms.R.grip.add(jaw); jaw.rotation.set(0, 0, -Math.PI / 2);
    const soldiers = [];
    const spots = [[1.4, 0.6], [2.3, 1.4], [2.6, -0.4], [3.4, 0.7], [3.8, -1.4], [4.6, 0.2], [5.0, -2.2], [5.6, 1.1], [6.4, -0.9]];
    spots.forEach(([x, z], i) => {
      const f = FW.CAST.soldier(i); at(f, x, ter.heightAt(x, z), z); f.rotation.y = -1.35 + (i % 3) * 0.12;
      const sh = FW.shield(i % 2 ? '#7A4A26' : '#8A5A2E'); sh.position.set(0, 0, 0.06); f.parts.arms.L.grip.add(sh); sh.rotation.set(0, Math.PI / 2, 0);
      const sp = FW.spear(); f.parts.arms.R.grip.add(sp); sp.rotation.x = Math.PI / 2;
      f.base = [x, z]; scene.add(f); soldiers.push(f);
    });
    const gl = FW.godLight(scene, [-1.2, 0, 0.8], { from: [-4.6, 14, 3.4], intensity: 240, angle: 0.22, r1: 2.0 });
    const burst = FW.dust({ n: 110, box: [5, 1.4, 3], center: [2.6, 0.6, 0.3], color: '#D8C0A0', size: 4, seed: 91, opacity: 0 }); scene.add(burst);
    const set = { scene, samson: sam, soldiers, jaw };
    set.anchors = { samson: new THREE.Vector3(-1.2, 1.8, 0.8), soldiers: new THREE.Vector3(3.6, 1.6, 0) };
    set.update = (t, s = {}) => {
      gl.set(s.gold === undefined ? 1 : s.gold, t);
      sam.rotation.y = 1.25;
      const sw = FW.clamp(s.swing || 0);
      sam.pose(FW.mix({ armR: { sx: 2.6, sz: 0.25, e: 0.5 }, armL: { sx: 0.5, sz: 0.35, e: 0.6 }, lean: -0.08, headX: -0.1 }, { armR: { sx: 1.2, sz: -0.1, e: 0.1 }, armL: { sx: 0.3, sz: 0.3, e: 0.5 }, lean: 0.18, twist: -0.3 }, sw), t);
      const k = FW.clamp(s.fall || 0);
      soldiers.forEach((f, i) => {
        const d = FW.clamp(k * 1.6 - (i / soldiers.length) * 0.6);
        const [x, z] = f.base;
        f.position.set(x + d * (0.8 + (i % 3) * 0.3), ter.heightAt(x, z) - d * 0.1, z + d * ((i % 2) - 0.5) * 0.6);
        f.rotation.z = -d * (0.9 + (i % 4) * 0.15); f.rotation.x = d * ((i % 3) - 1) * 0.2;
        f.pose({ armL: { sx: 1.1 + d * 0.8, sz: 0.2, e: 0.6 }, armR: { sx: 0.4 + d * 1.2, sz: 0.3, e: 0.3 }, phase: i }, t);
      });
      burst.material.opacity = 0.75 * FW.clamp(s.burst || 0); burst.visible = (s.burst || 0) > 0.01; burst.update((s.burstT || 0) * 5);
    };
    return set;
  };

  // ---------------------------------------------------------------- FIELD: the angel of the LORD and Samson's mother (Judges 13:3-5)
  SETS.field = () => {
    const scene = FW.baseScene({ fog: '#18203A', density: 0.016 });
    const ter = FW.terrain({ size: 200, seg: 80, height: 3.5, seed: 71, scale: 0.03, low: '#4A4434', high: '#62583E', dark: '#2A281E', flat: [0, 0, 6, 8, 0] }); scene.add(ter);
    const tufts = FW.tufts({ n: 120, r0: 1.4, r1: 12, seed: 4, heightAt: ter.heightAt, color: '#6A6A44', size: 0.7 }); scene.add(tufts);
    for (let i = 0; i < 10; i++) { const ol = FW.olive(i + 60, 1.1); const x = -16 + i * 3.6 + (i % 2) * 1.5, z = -9 - (i % 3) * 3; at(ol, x, ter.heightAt(x, z), z); scene.add(ol); }
    const zorah = FW.town({ n: 10, radius: 4, seed: 51, color: '#6E5340', lit: 1 }); zorah.position.set(-22, ter.heightAt(-22, -34), -34); scene.add(zorah);
    for (const [z, h, c, sd] of [[-120, 18, '#262E48', 6], [-170, 30, '#20263C', 14]]) scene.add(FW.ridge({ z, height: h, color: c, seed: sd, y: -8 }));
    const moon = FW.moon(); moon.position.set(60, 80, -150); scene.add(moon);
    const rig = FW.rig({ hemiSky: '#4E5E88', hemiGround: '#2A2418', hemi: 0.65, key: '#9AAAD6', keyI: 0.8, keyPos: [8, 10, -10], target: [0, 0, 0], shadow: 9 }); scene.add(rig);
    const stone = FW.rock(7, 0.42, '#7A6A58'); at(stone, 0.9, 0.15, 0.4); scene.add(stone);
    const mother = FW.CAST.mother(); at(mother, 0.9, 0.18, 0.4); scene.add(mother);
    const angel = FW.CAST.angel(); at(angel, -0.9, 0.05, -0.2); scene.add(angel);
    const aLight = new THREE.PointLight(new THREE.Color('#FFE6B0'), 30, 14, 1.3); at(aLight, -0.9, 1.6, 0.2); scene.add(aLight);
    const gl = FW.godLight(scene, [-0.9, 0, -0.2], { from: [-3.4, 15, 1.6], intensity: 120, angle: 0.18, r1: 1.6 });
    const set = { scene, mother, angel };
    set.anchors = { angel: new THREE.Vector3(-0.9, 2.3, -0.2), mother: new THREE.Vector3(0.9, 1.3, 0.4) };
    set.update = (t, s = {}) => {
      const a = FW.clamp(s.angel === undefined ? 1 : s.angel);
      angel.visible = a > 0.01; angel.traverse((o) => { if (o.material && o.material.opacity !== undefined) { o.material.transparent = true; o.material.opacity = (o === angel.aura ? 0.6 : 1) * a; } });
      aLight.intensity = 30 * a; gl.set(a, t);
      angel.rotation.y = 0.55; angel.pose({ armL: { sx: 0.6, sz: 0.5, e: 0.4 }, armR: { sx: 0.6, sz: 0.5, e: 0.4 }, still: false, phase: 2 }, t);
      angel.position.y = 0.05 + Math.sin(t * 1.1) * 0.03;
      mother.rotation.y = -0.9; mother.pose(Object.assign({}, FW.POSE.sit, { headX: -0.25, headY: 0.1, armL: { sx: 0.9, sz: 0.1, e: 1.3 }, armR: { sx: 0.9, sz: 0.1, e: 1.3 } }), t);
    };
    return set;
  };
})();
