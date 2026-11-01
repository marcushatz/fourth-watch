// Ep 1 sets in the 2.5D cut-out look, part 1: Zorah, Delilah's room, the vineyards (lion), Lehi (jawbone).
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, SETS = FW.SETS;
  const add = (scene, ...o) => { for (const x of o) scene.add(x); return o[0]; };
  const lerpC = (a, b, x) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), FW.clamp(x)).getHexString();

  FW.PALS = {
    magenta: { sky: { top: '#151A42', mid: '#4A3C76', bot: '#E39074', glow: '#D9895E', glowPow: 14 }, layers: null, rim: '#FFBE8C' },
    duskGold: { sky: { top: '#231C48', mid: '#8E4A6C', bot: '#F4AE6C', glow: '#FFBE6E', glowPow: 10, stars: 0.4, cloud: '#F7B07E' }, rim: '#FFC88A',
      layers: [[-230, 300, -40, 8, 0.0, 51, '#E09468', '#F0AE78', 0.012], [-170, 280, -40, 12, 0.4, 52, '#BE6C66', '#D4846E', 0.016], [-115, 230, -40, 14, 0.5, 53, '#864A5E', '#9C5C68', 0.021], [-70, 170, -40, 13, 0.6, 54, '#52304A', '#623A54', 0.028], [-36, 110, -40, 10, 0.7, 55, '#2C1A2E', '#382234', 0.042]] },
    night: { sky: { top: '#060918', mid: '#18204A', bot: '#36386A', glow: '#4E5C9A', glowPow: 6, stars: 1.0, cloud: '#3A4478' }, rim: '#9EB4FF',
      layers: [[-230, 300, -40, 8, 0.0, 61, '#2C3260', '#363C6E', 0.012], [-170, 280, -40, 12, 0.4, 62, '#222852', '#2A305E', 0.016], [-115, 230, -40, 14, 0.5, 63, '#191D40', '#20254C', 0.021], [-70, 170, -40, 13, 0.6, 64, '#11142E', '#171A38', 0.028], [-36, 110, -40, 10, 0.7, 65, '#0A0B1C', '#0F1126', 0.042]] },
    blueHour: { sky: { top: '#0F1840', mid: '#3C4888', bot: '#D08EA0', glow: '#EAA8A0', glowPow: 9, stars: 0.7, cloud: '#C890A8' }, rim: '#F4B4A8',
      layers: [[-230, 300, -40, 8, 0.0, 71, '#9C7CA2', '#B08EB0', 0.012], [-170, 280, -40, 12, 0.4, 72, '#6E5A90', '#806A9E', 0.016], [-115, 230, -40, 14, 0.5, 73, '#4A3E74', '#584A88', 0.021], [-70, 170, -40, 13, 0.6, 74, '#2E2854', '#382F62', 0.028], [-36, 110, -40, 10, 0.7, 75, '#1A1636', '#221C42', 0.042]] },
    crimson: { sky: { top: '#22123A', mid: '#76284E', bot: '#F07E5A', glow: '#FF985C', glowPow: 9, stars: 0.35, cloud: '#E87E66' }, rim: '#FFA27A',
      layers: [[-230, 300, -40, 8, 0.0, 81, '#D8705C', '#E8886A', 0.012], [-170, 280, -40, 12, 0.4, 82, '#A84C56', '#BC5E5E', 0.016], [-115, 230, -40, 14, 0.5, 83, '#702E48', '#843A52', 0.021], [-70, 170, -40, 13, 0.6, 84, '#441C36', '#522440', 0.028], [-36, 110, -40, 10, 0.7, 85, '#220E1E', '#2C1226', 0.042]] },
    dawn: { sky: { top: '#33406E', mid: '#C8807A', bot: '#FFBE74', glow: '#FFD48A', glowPow: 7, stars: 0.15, cloud: '#FFC09A' }, rim: '#FFD898',
      layers: [[-230, 300, -40, 8, 0.0, 91, '#F0B892', '#FFD0A0', 0.012], [-170, 280, -40, 12, 0.4, 92, '#D49090', '#E6A698', 0.016], [-115, 230, -40, 14, 0.5, 93, '#9A6A88', '#B07C92', 0.021], [-70, 170, -40, 13, 0.6, 94, '#5E4670', '#6E527C', 0.028], [-36, 110, -40, 10, 0.7, 95, '#2E2440', '#382C4C', 0.042]] },
  };
  FW.outdoor = (scene, pal, o = {}) => FW.dawnSky(scene, { sky: Object.assign({}, pal.sky, o.sky || {}), layers: pal.layers || undefined, yOff: o.yOff });

  // ---------------------------------------------------------------- props in the cut-out look
  FW.polyGeo = (pts) => { const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]); return new THREE.ShapeGeometry(sh); };
  FW.lionCut = () => {
    const root = new THREE.Group(), sg = FW.shapeGeo;
    const mats = [new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFBE8C'), side: THREE.DoubleSide }), new THREE.MeshBasicMaterial({ color: new THREE.Color('#0B0810'), side: THREE.DoubleSide })];
    const rigs = mats.map((mat, mi) => {
      const g = new THREE.Group(); g.position.z = mi ? 0 : -0.004; root.add(g);
      const mk = (geo) => new THREE.Mesh(geo, mat);
      const body = new THREE.Group(); body.position.y = 0.8; g.add(body);
      body.add(mk(sg([[-0.7, 0.12], [-0.45, 0.24], [-0.05, 0.22], [0.3, 0.3], [0.52, 0.2], [0.56, -0.02], [0.32, -0.2], [-0.1, -0.16], [-0.42, -0.17], [-0.66, -0.06]])));
      const head = new THREE.Group(); head.position.set(0.48, 0.22, 0.001); body.add(head);
      // a shaggy mane ruff (tufted outline) with a snarling muzzle in profile: unmistakably a lion
      { const R = FW.rng(42), mane = []; for (let i = 0; i < 40; i++) { const an = (i / 40) * Math.PI * 2, rr = (i % 2 ? 0.34 : 0.39) + R() * 0.03; mane.push([-0.04 + Math.cos(an) * rr * 0.95, 0.04 + Math.sin(an) * rr * 1.12]); } head.add(mk(FW.polyGeo(mane))); }
      head.add(mk(FW.polyGeo([[-0.25, -0.05], [-0.1, -0.3], [0.05, -0.5], [0.2, -0.44], [0.28, -0.3], [0.16, -0.2], [0.0, -0.05]]))); // chest mane
      head.add(mk(FW.polyGeo([[0.18, 0.22], [0.3, 0.24], [0.4, 0.2], [0.49, 0.14], [0.55, 0.08], [0.56, 0.02], [0.53, -0.01], [0.5, -0.05], [0.48, -0.1], [0.45, -0.04], [0.4, -0.03], [0.36, -0.06], [0.45, -0.12], [0.44, -0.18], [0.36, -0.2], [0.24, -0.18], [0.16, -0.05]])));
      { const ear = FW.polyGeo([[0.06, 0.38], [0.1, 0.5], [0.16, 0.39]]); head.add(mk(ear)); }
      const legs = [];
      for (const [x, front] of [[0.42, 1], [0.3, 1], [-0.55, 0], [-0.66, 0]]) {
        const hp = new THREE.Group(); hp.position.set(x, -0.05, x > 0.35 || x < -0.6 ? 0.001 : -0.001); body.add(hp);
        hp.add(mk(sg([[-0.11, 0.08], [0.11, 0.08], [0.08, -0.38], [-0.07, -0.38]])));
        const kn = new THREE.Group(); kn.position.y = -0.36; hp.add(kn); kn.add(mk(sg([[-0.065, 0.02], [0.065, 0.02], [0.055, -0.34], [0.14, -0.38], [0.15, -0.43], [-0.07, -0.43]])));
        legs.push({ hp, kn, front });
      }
      const tail = new THREE.Group(); tail.position.set(-0.72, 0.05, 0); body.add(tail);
      tail.add(mk(sg([[0, 0.02], [0, -0.02], [-0.45, -0.25], [-0.6, -0.2], [-0.68, -0.28], [-0.62, -0.12], [-0.46, -0.18]])));
      return { body, head, legs, tail };
    });
    root.leap = (k, t = 0) => {
      for (const r of rigs) {
        r.body.rotation.z = FW.lerp(0.0, 0.42, k); r.body.position.y = 0.8 + Math.sin(Math.min(1, k) * Math.PI * 0.5) * 0.9;
        r.legs.forEach((l) => { l.hp.rotation.z = l.front ? FW.lerp(0.1, 1.15, k) : FW.lerp(-0.1, -0.9, k); l.kn.rotation.z = l.front ? FW.lerp(-0.1, 0.6, k) : FW.lerp(0.1, -0.3, k); });
        r.head.rotation.z = FW.lerp(0, -0.25, k); r.tail.rotation.z = Math.sin(t * 3) * 0.15 + k * 0.4;
      }
    };
    root.run = (ph) => { for (const r of rigs) { r.body.position.y = 0.8 + Math.abs(Math.sin(ph * Math.PI * 2)) * 0.12; r.legs.forEach((l, i) => { l.hp.rotation.z = Math.sin(ph * Math.PI * 2 + i * 1.6) * 0.55; l.kn.rotation.z = -Math.max(0, Math.sin(ph * Math.PI * 2 + i * 1.6 + 1)) * 0.6; }); r.body.rotation.z = Math.sin(ph * Math.PI * 4) * 0.04; } };
    root.setRim = (c) => mats[0].color.set(c);
    root.rimOffset = (dx, dy) => { root.children[0].position.x = dx; root.children[0].position.y = dy; };
    root.leap(0);
    return root;
  };
  FW.propSil = (pts, color = '#0B0810') => new THREE.Mesh(FW.shapeGeo(pts), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide }));
  FW.jawSil = () => { const g = new THREE.Group(); const m = FW.propSil([[-0.02, 0.0], [0.1, -0.035], [0.25, -0.055], [0.4, -0.045], [0.5, -0.005], [0.53, 0.035], [0.5, 0.06], [0.47, 0.05], [0.45, 0.085], [0.42, 0.055], [0.39, 0.085], [0.36, 0.055], [0.33, 0.085], [0.3, 0.055], [0.27, 0.085], [0.24, 0.055], [0.2, 0.055], [0.12, 0.05], [0.085, 0.12], [0.065, 0.2], [0.025, 0.225], [0.0, 0.16], [-0.025, 0.06]], '#D2BC92'); m.position.z = 0.003; g.add(m); return g; };
  FW.shieldSil = () => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.CircleGeometry(0.26, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color('#0B0810'), side: THREE.DoubleSide })); c.position.z = 0.004; g.add(c); const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.235, 28), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5A3A2A'), side: THREE.DoubleSide })); r.position.z = 0.005; g.add(r); return g; };
  FW.spearSil = (len = 2.1) => FW.propSil([[-0.012, -0.6], [0.012, -0.6], [0.012, len - 0.65], [0.04, len - 0.62], [0.0, len - 0.4], [-0.04, len - 0.62], [-0.012, len - 0.65]]);

  // ---------------------------------------------------------------- ZORAH at dusk: Samson, his parents, the memory of the woman at Timnah
  SETS.zorah = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.magenta, LIGHT = [-0.55, 0.85];
    FW.outdoor(scene, pal, { sky: { mid: '#5A3E78', bot: '#EE9A72' } });
    // ground and the village (left), Timnah far right on its hill with lamps
    add(scene, FW.silShape([[-12, -5], [-12, -0.15], [-4, -0.05], [0, 0], [4, -0.08], [12, -0.25], [12, -5]], { color: '#0C0910', rim: pal.rim, rimW: 0.025, light: LIGHT, z: -0.2 }));
    const village = new THREE.Group(); village.position.set(-3.6, 0, -1.2); scene.add(village);
    for (const [x, w, h, sd] of [[-2.2, 2.4, 2.1, 1], [0.2, 2.0, 2.6, 2], [2.0, 1.6, 1.8, 3]]) {
      village.add(FW.polySil(FW.SHAPES.house(w, h, sd), { color: '#100C14', rim: pal.rim, rimW: 0.035, light: LIGHT, x }));
      const win = FW.window(0.32, 0.4, '#E8873E', 0.75); win.position.set(x + w * 0.2, h * 0.55, 0.01); village.add(win);
    }
    const door = FW.window(0.5, 1.0, '#E07A36', 0.8); door.position.set(-3.6 + 0.2 - 0.5, 0.5, -1.19); scene.add(door);
    const timnah = new THREE.Group(); timnah.position.set(9, 1.0, -18); scene.add(timnah);
    timnah.add(FW.silShape([[-6, -3], [-5, 0.2], [-2, 1.4], [1, 1.8], [4, 0.6], [6, -3]], { color: '#3A2846' }));
    for (let i = 0; i < 9; i++) { const w = FW.window(0.18, 0.2, '#FFB868', 0.8); w.position.set(-2.4 + i * 0.55, 1.4 + Math.sin(i * 2.1) * 0.25, 0.02); timnah.add(w); }
    // people (profiles): parents left facing right, Samson right of centre, facing right toward Timnah
    const father = FW.PEOPLE.father({ dir: 1, rim: pal.rim, light: LIGHT }); father.position.set(-1.45, 0, 0); scene.add(father);
    const mother = FW.PEOPLE.woman({ dir: 1, rim: pal.rim, light: LIGHT }); mother.position.set(-0.85, 0, -0.05); scene.add(mother);
    const sam = FW.PEOPLE.samson({ dir: 1, rim: pal.rim, light: LIGHT }); sam.position.set(0.45, 0, 0.05); scene.add(sam);
    // the memory: the woman he saw at Timnah (Judges 14:1-2), in an ember circle (his own choice)
    const mem = new THREE.Group(); mem.position.set(0.95, 2.75, 0.2); mem.userData.k = 0.82; scene.add(mem);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), new THREE.MeshBasicMaterial({ map: FW.radialTex(), color: new THREE.Color('#FF7A42'), transparent: true, opacity: 0.85, depthWrite: false })); mem.add(disc);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.725, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFB27A'), transparent: true })); mem.add(ring);
    const bride = FW.PEOPLE.woman({ dir: -1, rim: '#FFD0A0', light: [0.3, 1], scale: 0.42 }); bride.position.set(0.0, -0.42, 0.01); mem.add(bride);
    const dots = [].map(([x, y, r]) => { const d = new THREE.Mesh(new THREE.CircleGeometry(r, 18), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFB27A'), transparent: true })); d.position.set(x, y, 0); mem.add(d); return d; });
    const beam = FW.beam({ from: [-4.5, 11, -0.8], to: [0.4, -0.1, -0.8], w0: 0.8, w1: 3.6, color: '#FFE0A6', opacity: 0 }); scene.add(beam);
    const motes = FW.dust({ n: 70, box: [10, 6, 3], center: [0, 2.5, -0.5], color: '#FFD0A0', size: 3, seed: 12, opacity: 0.5 }); scene.add(motes);
    const set = { scene, LIGHT, anchors: { samson: new THREE.Vector3(0.5, 1.8, 0), parents: new THREE.Vector3(-1.15, 1.75, 0), memory: new THREE.Vector3(1.15, 3.8, 0.2) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      const m = FW.clamp(s.mem || 0); mem.visible = m > 0.01; mem.scale.setScalar((0.001 + FW.ease.outBack(m)) * 0.82);
      bride.pose(FW.CUT.stand, t);
      const shake = s.shake || 0;
      father.pose(FW.add(FW.CUT.stand, { headX: 0.12 + Math.sin(t * 6) * 0.08 * shake, armNear: { s: 0.5, e: 1.3 }, armFar: { s: 0.4, e: 1.4 }, phase: 1 }), t);
      mother.pose(FW.add(FW.CUT.stand, { headX: 0.18 + Math.sin(t * 6 + 1) * 0.07 * shake, armNear: { s: 0.9, e: 1.6 }, armFar: { s: 0.8, e: 1.6 }, phase: 2 }), t);
      sam.pose(FW.mix(FW.CUT.stand, FW.CUT.point, FW.clamp(s.point || 0)), t);
      beam.setOpacity(0.75 * FW.clamp(s.gold || 0));
      const g = FW.clamp(s.gold || 0); for (const f of [father, mother, sam]) f.setRim(lerpC(pal.rim, '#FFE29A', g));
    };
    return set;
  };

  // ---------------------------------------------------------------- DELILAH's room at night (Valley of Sorek): two profiles and a lamp
  SETS.delilah = () => {
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0A0710');
    const LIGHT = [0.0, 1.0];
    // the window arch: night sky with a moon, framed by a dark wall
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: FW.canvasTex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0C1638'); g.addColorStop(0.7, '#2A3A78'); g.addColorStop(1, '#4A4A86'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    sky.position.set(0, 2.6, -3); scene.add(sky);
    const stars = FW.stars(300, 4); stars.scale.setScalar(0.02); stars.position.set(0, 2, -2.9); scene.add(stars);
    const moon = FW.glowSprite('#C8D4FF', 1.2, 0.55); moon.position.set(0.45, 3.35, -2.9); scene.add(moon);
    const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(0.12, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F2F0E6') })); moonDisc.position.set(0.45, 3.35, -2.95); scene.add(moonDisc);
    const hills = FW.silShape([[-3, 0.6], [-2, 1.2], [-0.8, 0.9], [0.6, 1.4], [2, 1.0], [3, 1.2], [3, -1], [-3, -1]], { color: '#141838', z: -2.8 }); scene.add(hills);
    // wall with an arched opening (shape with a hole)
    const wall = new THREE.Shape(); wall.moveTo(-8, -2); wall.lineTo(8, -2); wall.lineTo(8, 8); wall.lineTo(-8, 8); wall.lineTo(-8, -2);
    const hole = new THREE.Path(); hole.moveTo(-1.05, 1.0); hole.lineTo(1.05, 1.0); hole.lineTo(1.05, 2.9); hole.absarc(0, 2.9, 1.05, 0, Math.PI, false); hole.lineTo(-1.05, 1.0); wall.holes.push(hole);
    const wm = new THREE.Mesh(new THREE.ShapeGeometry(wall, 24), new THREE.MeshBasicMaterial({ map: FW.canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * 0.62, 10, w / 2, h * 0.62, w * 0.7); g.addColorStop(0, '#4A2E24'); g.addColorStop(0.5, '#24161A'); g.addColorStop(1, '#0E0A10'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }));
    // map uv for the shape (ShapeGeometry uv = xy): scale texture
    wm.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = i % 2 === 0 ? (v + 8) / 16 : (v + 2) / 10; });
    wm.position.z = -1.5; scene.add(wm);
    const curtainL = FW.silShape([[-1.1, 1.0], [-0.82, 1.0], [-0.72, 2.2], [-0.9, 3.4], [-1.1, 3.9]], { color: '#4A1828', z: -1.45 }); scene.add(curtainL);
    // floor
    { const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#120C10') })); fl.position.set(0, -2.9, -1.4); scene.add(fl); }
    // couch silhouette (low bench with cushions)
    const couch = FW.silShape([[-2.4, -0.05], [-2.4, 0.42], [-2.1, 0.55], [-1.4, 0.5], [-0.6, 0.52], [0.6, 0.52], [1.4, 0.5], [2.1, 0.55], [2.4, 0.42], [2.4, -0.05]], { color: '#140C12', z: -0.3 }); couch.position.y = 0.0; scene.add(couch);
    // the lamp on a stand between them: the key light
    const lamp = new THREE.Group(); lamp.position.set(0, 0, 0.1); scene.add(lamp);
    lamp.add(FW.silShape([[-0.05, 0], [0.05, 0], [0.03, 1.0], [0.16, 1.02], [0.2, 1.1], [-0.2, 1.1], [-0.16, 1.02], [-0.03, 1.0]], { color: '#120A0C' }));
    const flame = FW.propSil([[0, 1.12], [0.04, 1.18], [0.0, 1.32], [-0.04, 1.18]], '#FFE6A8'); flame.position.z = 0.01; lamp.add(flame);
    const lglow = FW.glowSprite('#FFB25E', 3.6, 0.85); lglow.position.set(0, 1.2, 0.02); lamp.add(lglow);
    const lglow2 = FW.glowSprite('#FF8A3A', 5, 0.18); lglow2.position.set(0, 1.2, -0.5); scene.add(lglow2);
    // Delilah: veiled and slighter, so she never reads as Samson
    const del = FW.PEOPLE.veiled({ dir: 1, rim: '#FFB878', light: [1, 0.25], rimW: 0.016 }); del.position.set(-0.85, 0.05, 0); scene.add(del);
    const sam = FW.PEOPLE.samson({ dir: -1, rim: '#FFB878', light: [-1, 0.25], rimW: 0.016 }); sam.position.set(0.85, 0.05, 0); scene.add(sam);
    // a faint gold that stays on Samson while the Lord is with him (constant; it goes out only where the text says)
    const faint = FW.beam({ from: [-2.6, 6.5, -0.6], to: [0.9, 0.2, -0.6], w0: 0.4, w1: 1.6, color: '#FFD890', opacity: 0.16 }); scene.add(faint);
    const set = { scene, anchors: { delilah: new THREE.Vector3(-0.85, 1.5, 0), samson: new THREE.Vector3(0.85, 1.55, 0) } };
    set.update = (t, s = {}) => {
      const f = 0.85 + 0.1 * Math.sin(t * 11.3) + 0.05 * Math.sin(t * 7.1); lglow.material.opacity = 0.85 * f; flame.scale.y = 0.9 + 0.15 * f;
      const lean = FW.clamp(s.lean || 0);
      del.pose(FW.add(FW.CUT.sit, { headX: 0.05, armNear: { s: 0.9, e: 1.5 }, armFar: { s: 0.7, e: 1.6 }, phase: 3 }), t);
      sam.pose(FW.add(FW.CUT.sit, { lean: 0.15 + 0.2 * lean, headX: 0.1 * lean, armNear: { s: 0.9 + 0.25 * Math.sin(t * 2.4) * lean, e: 0.9 }, armFar: { s: 0.6, e: 1.0 }, phase: 0.5 }), t);
      faint.setOpacity(0.16 * (s.faint === undefined ? 1 : s.faint));
    };
    return set;
  };

  // ---------------------------------------------------------------- VINEYARDS OF TIMNAH at dusk: the lion (Judges 14:5-6)
  SETS.vineyard = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.duskGold, LIGHT = [-0.5, 0.85];
    FW.outdoor(scene, pal);
    add(scene, FW.silShape([[-14, -5], [-14, -0.3], [-6, -0.1], [0, 0], [6, -0.05], [14, -0.3], [14, -5]], { color: '#0C0810', rim: pal.rim, rimW: 0.025, light: LIGHT, z: -0.15 }));
    // vine rows on trellises: posts + a wire + a continuous leafy hedge with hanging grapes, receding in depth
    const vineRow = (z, y, col, h, seed, x0 = -16, x1 = 16) => {
      const R = FW.rng(seed), row = new THREE.Group(); row.position.set(0, y, z); scene.add(row);
      const circles = [];
      for (let x = x0; x <= x1; x += 1.25) {
        // a gnarled trunk, then a leafy crown spreading along the wire
        const tx = x + (R() - 0.5) * 0.2;
        row.add(FW.silShape([[tx - 0.05 * h, 0], [tx - 0.03 * h, 0.3 * h], [tx - 0.07 * h, 0.5 * h], [tx + 0.02 * h, 0.62 * h], [tx + 0.05 * h, 0.45 * h], [tx + 0.04 * h, 0.2 * h], [tx + 0.06 * h, 0]], { color: col }));
        for (let j = 0; j < 7; j++) circles.push([tx + (j - 3) * 0.17 + (R() - 0.5) * 0.08, h * (0.72 + R() * 0.22), h * (0.13 + R() * 0.08)]);
      }
      row.add(FW.lobes(circles, { color: col, rim: pal.rim, rimW: 0.018 * h, light: LIGHT }));
      return row;
    };
    vineRow(-12, 0.05, '#4A2A3C', 0.8, 5); vineRow(-7, 0.0, '#2E1A2C', 0.95, 6); vineRow(-3.2, -0.02, '#160E1C', 1.05, 7);
    vineRow(3.2, -0.75, '#05030A', 1.0, 8, -8, 8).children.forEach((c) => c.children && c.children.forEach((m) => { if (m.material && m !== c.children[0]) m.material.color.set('#3A2430'); }));
    const town = new THREE.Group(); town.position.set(-8, 0.4, -22); scene.add(town);
    town.add(FW.silShape([[-5, -2], [-4, 0.6], [-1, 1.3], [2, 1.1], [5, 0.3], [5, -2]], { color: '#5A2C3E' }));
    for (let i = 0; i < 7; i++) { const w = FW.window(0.16, 0.18, '#FFC070', 0.8); w.position.set(-2 + i * 0.6, 1.0 + Math.sin(i * 1.7) * 0.2, 0.02); town.add(w); }
    const sam = FW.PEOPLE.samson({ dir: 1, rim: pal.rim, light: LIGHT }); sam.position.set(-0.9, 0, 0); scene.add(sam);
    const lion = FW.lionCut(); lion.userData.k = 0.8; scene.add(lion);
    const beam = FW.beam({ from: [-4.6, 11.5, -0.7], to: [-0.8, -0.1, -0.7], w0: 0.6, w1: 2.6, color: '#FFE2A6', opacity: 0 }); scene.add(beam);
    const halo = FW.glowSprite('#FFE0A0', 3.5, 0); halo.position.set(-0.85, 1.3, -0.3); scene.add(halo);
    const burst = FW.dust({ n: 110, box: [3, 1.4, 1.2], center: [0.1, 0.9, 0.3], color: '#FFD6A0', size: 4.5, seed: 77, opacity: 0 }); scene.add(burst);
    const motes = FW.dust({ n: 60, box: [12, 6, 4], center: [0, 2.5, -1], color: '#FFD8A0', size: 3, seed: 13, opacity: 0.5 }); scene.add(motes);
    const set = { scene, LIGHT, anchors: { samson: new THREE.Vector3(-0.85, 1.85, 0), lion: new THREE.Vector3(0.7, 1.5, 0) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      const g = FW.clamp(s.gold || 0); beam.setOpacity(0.85 * g); halo.material.opacity = 0.55 * g + 0.4 * FW.clamp(s.flash || 0);
      sam.setRim(lerpC(pal.rim, '#FFE6A0', g), 0.014 + 0.008 * g);
      const walk = s.walk === undefined ? 0 : s.walk;
      const brace = FW.clamp(s.brace || 0);
      let pose = FW.add(FW.CUT.stand, FW.cutWalk(walk * 1.4, (1 - brace) * (s.walking ? 1 : 0)));
      pose = FW.mix(pose, FW.add(FW.CUT.push, { armNear: { s: 1.8, e: 0.35, fist: false }, armFar: { s: 1.6, e: 0.4 }, lean: 0.25, headX: -0.05 }), brace);
      sam.position.x = -0.9 + (s.samX || 0);
      sam.pose(pose, t);
      // lion: runs in from the right (run 0..1), leaps (leap 0..1), held (caught 0..1)
      const run = FW.clamp(s.run || 0), leap = FW.clamp(s.leap || 0), caught = FW.clamp(s.caught || 0);
      lion.visible = run > 0.001;
      const x = FW.lerp(3.9, 1.75, run) - leap * 1.05 - caught * 0.1;
      lion.position.set(x, 0, 0.02); lion.scale.set(-0.8, 0.8, 0.8);
      if (leap > 0) lion.leap(FW.lerp(leap, 0.75, caught), t); else lion.run(t * 2.6);
      lion.rimOffset(-0.012, 0.016);
      burst.material.opacity = 0.8 * FW.clamp(s.burst || 0); burst.visible = (s.burst || 0) > 0.01; burst.update((s.burstT || 0) * 6);
    };
    return set;
  };

  // ---------------------------------------------------------------- LEHI in the blue hour: the jawbone (Judges 15:14-17)
  SETS.lehi = () => {
    const scene = new THREE.Scene(), pal = FW.PALS.blueHour, LIGHT = [-0.55, 0.85];
    FW.outdoor(scene, pal);
    add(scene, FW.silShape([[-14, -5], [-14, -0.6], [-5, -0.25], [-1.5, 0.05], [1, 0.0], [5, -0.2], [14, -0.5], [14, -5]], { color: '#0B0812', rim: pal.rim, rimW: 0.025, light: LIGHT, z: -0.15 }));
    for (const [x, z, s] of [[-6, -4, 1.4], [6.5, -5, 1.8], [-9, -8, 2.4]]) add(scene, FW.silShape([[-1, 0], [-0.8, 0.6], [-0.2, 0.9], [0.5, 0.75], [1, 0]].map(([a, b]) => [a * s, b * s]), { color: '#141026', rim: pal.rim, rimW: 0.03, light: LIGHT, z })).position.set(x, -0.2, z);
    const sam = FW.PEOPLE.samson({ dir: 1, rim: pal.rim, light: LIGHT }); sam.position.set(-0.75, 0, 0); scene.add(sam);
    const jaw = FW.jawSil(); jaw.rotation.z = -Math.PI / 2; jaw.position.set(0.0, -0.02, 0.003); jaw.scale.setScalar(1.15); sam.body.arms.near.grip.add(jaw);
    // Philistine soldiers (feathered crowns, round shields, spears), on the right
    const soldiers = [];
    const spots = [[0.35, 0.0, 0.05], [0.95, -0.01, -0.08], [1.45, 0.0, 0.04], [2.0, -0.02, -0.12], [2.5, -0.03, 0.02], [3.1, -0.05, -0.1], [3.7, -0.07, 0.0]];
    spots.forEach(([x, y, z], i) => {
      const f = FW.PEOPLE.soldier({ dir: -1, rim: '#E89A8E', light: LIGHT, scale: 0.98 - i * 0.02 }); f.position.set(x, y, z); scene.add(f);
      const sh = FW.shieldSil(); sh.position.set(0.02, 0.0, 0.002); f.body.arms.far.grip.add(sh);
      const sp = FW.spearSil(); sp.rotation.z = 0.15; f.body.arms.near.grip.add(sp);
      f.base = [x, y, z]; soldiers.push(f);
    });
    // the rest of the Philistine force behind the front line, fading into the haze (a horde, not five men)
    { const R = FW.rng(57), k2 = [{ o: { kind: 'feather' }, pose: FW.add(FW.CUT.stand, { armNear: { s: 2.6, e: 0.3 }, armFar: { s: 0.9, e: 1.0 } }) }, { o: { kind: 'feather' }, pose: FW.add(FW.CUT.stand, { lean: 0.15, armNear: { s: 1.2, e: 0.4 }, armFar: { s: 1.4, e: 0.9 } }) }, { o: { kind: 'feather' }, pose: FW.add(FW.CUT.stand, { armNear: { s: 0.4, e: 0.2 } }) }];
      for (const [z, y, sc, n, col, rimc] of [[-2.2, -0.12, 0.86, 16, '#0E0A16', '#C88A8A'], [-4.6, -0.22, 0.78, 22, '#1E1830', '#8A6A86'], [-8, -0.35, 0.7, 30, '#2E2646', '#5E4E72']]) {
        const spots = []; for (let i = 0; i < n; i++) spots.push([0.7 + i * (7.5 / n) + R() * 0.25, y, z, sc * (0.92 + R() * 0.16), -1, i % 3]);
        scene.add(FW.crowdSil({ kinds: k2, spots, base: col, rim: rimc, light: LIGHT }));
      } }
    const beam = FW.beam({ from: [-4.3, 11.5, -0.7], to: [-0.7, -0.1, -0.7], w0: 0.6, w1: 2.6, color: '#FFE2A6', opacity: 0.8 }); scene.add(beam);
    const burst = FW.dust({ n: 120, box: [5, 1.3, 1.2], center: [1.8, 0.6, 0.3], color: '#E8D0B8', size: 4.5, seed: 91, opacity: 0 }); scene.add(burst);
    const motes = FW.dust({ n: 60, box: [12, 6, 4], center: [0, 2.5, -1], color: '#F0C8B8', size: 3, seed: 14, opacity: 0.5 }); scene.add(motes);
    const set = { scene, LIGHT, anchors: { samson: new THREE.Vector3(-0.75, 1.85, 0), soldiers: new THREE.Vector3(1.8, 1.9, 0) } };
    set.update = (t, s = {}) => {
      motes.update(t);
      beam.setOpacity(0.8 * (s.gold === undefined ? 1 : s.gold)); sam.setRim('#FFE2A0', 0.018);
      const sw = FW.clamp(s.swing || 0);
      sam.pose(FW.mix(FW.CUT.swing0, FW.CUT.swing1, FW.ease.inOut(sw)), t);
      const k = FW.clamp(s.fall || 0);
      soldiers.forEach((f, i) => {
        const d = FW.clamp(k * 1.35 - (i / soldiers.length) * 0.45), e = FW.ease.in(d);
        const [x, y, z] = f.base, maxA = i < 3 ? 1.45 : i < 5 ? 1.1 : 0.55;
        f.position.set(x + e * (0.45 + i * 0.05), y - e * 0.04, z);
        f.rotation.z = -e * maxA;
        f.pose(FW.mix(FW.add(FW.CUT.stand, { lean: 0.08 * (i % 3), armNear: { s: 0.5 + 0.35 * (i % 3), e: 0.5 + 0.2 * (i % 2) }, armFar: { s: 1.0 + 0.2 * (i % 2), e: 1.2 }, phase: i }), { armNear: { s: 2.6, e: 0.2 }, armFar: { s: 2.2, e: 0.3 }, lean: -0.15, headX: -0.35, legNear: { h: 0.18, k: 0.12 }, legFar: { h: -0.08, k: 0.05 } }, FW.clamp(d * 1.6)), t);
      });
      burst.material.opacity = 0.7 * FW.clamp(s.burst || 0); burst.visible = (s.burst || 0) > 0.01; burst.update((s.burstT || 0) * 5);
    };
    return set;
  };
})();
