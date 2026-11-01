// Fourth Watch sets for Ep 1 (Samson). Each set returns { scene, update(t, s) } where s is a state object
// the shot passes in (light levels, poses, progress). Sets are built once per worker at init.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, P = FW.PAL;
  const M = (c, o) => FW.mat(c, o);
  const SETS = (FW.SETS = {});

  // shared helpers -----------------------------------------------------------
  function baseScene({ fog = '#1C2433', density = 0.018, sky = {} } = {}) {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(new THREE.Color(fog), density);
    const sk = FW.sky(); sk.set(Object.assign({ top: '#0A1020', mid: '#1A2745', bot: '#33405F', hz: 0.02 }, sky)); scene.add(sk);
    const st = FW.stars(900, 11); scene.add(st);
    scene.userData = { sky: sk, stars: st };
    return scene;
  }
  // a spot of God's light from the top left (screen direction rule) with a visible shaft
  function godLight(scene, target, { from = [-7, 13, 4], color = P.gold, intensity = 40, angle = 0.28, r1 = 1.6 } = {}) {
    const L = new THREE.SpotLight(new THREE.Color(color), intensity, 40, angle, 0.55, 1.4);
    L.position.set(...from); L.target.position.set(...target); L.castShadow = true;
    L.shadow.mapSize.set(1024, 1024); L.shadow.bias = -0.0008; L.shadow.normalBias = 0.03; L.shadow.radius = 4;
    scene.add(L); scene.add(L.target);
    const shaft = FW.shaft({ from, to: target, r0: 0.2, r1: r1 * 0.75, color: '#FFE3AE', opacity: 0.6 }); scene.add(shaft);
    const dust = FW.dust({ n: 70, box: [3.2, 4.5, 3.2], center: [target[0], target[1] + 2.2, target[2]], color: '#F7DDA4', size: 3.2, seed: 21, opacity: 0.75 }); scene.add(dust);
    const pool = FW.pool(color, r1 * 1.6, 0.3); pool.position.set(target[0], target[1] + 0.03, target[2]); scene.add(pool);
    const o = { L, shaft, dust, pool, I: intensity };
    o.set = (k, t) => { L.intensity = intensity * k; L.visible = k > 0.001; shaft.setOpacity(0.6 * k, t); dust.material.opacity = 0.8 * k; dust.visible = k > 0.01; dust.update(t); pool.material.opacity = 0.3 * k; pool.visible = k > 0.01; };
    return o;
  }
  FW.godLight = godLight;
  FW.baseScene = baseScene;

  function samson(o = {}) {
    return FW.figure(Object.assign({ skin: FW.SKIN[1], robe: '#8A5A3A', mantle: '#3E4A6A', belt: '#C08A3E', trim: '#5A3A24', hair: 'samson', beard: true, hairColor: '#24170F', build: 1.18 }, o));
  }
  FW.samson = samson;

  // STAGE: a hilltop at the last watch of the night, Israel's towns below ---------------------------
  SETS.stage = () => {
    const scene = baseScene({ fog: '#18223A', density: 0.012 });
    const hill = (x, z) => { const d = Math.hypot(x, z); const mound = 2.6 * Math.exp(-(d * d) / 60); const fall = -Math.max(0, d - 6) * 0.55; return mound + fall + (FW.fbm(x * 0.08 + 3, z * 0.08 + 7, 4) - 0.5) * 2.2; };
    const ter = FW.terrain({ size: 260, seg: 110, fn: hill, height: 3, flat: [0, 0, 7.5, 5, hill(0, 0)], low: '#4A3A2C', high: '#7A6048', dark: '#2E241C', seed: 4 });
    scene.add(ter);
    const y0 = ter.heightAt(0, 0);
    // rocks at the hilltop edge
    const R = FW.rng(5);
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.15 + R() * 0.7), r = 4.5 + R() * 3.5; const rk = FW.rock(i + 50, 0.2 + R() * 0.35, '#4A4038'); rk.position.set(Math.cos(a) * r, ter.heightAt(Math.cos(a) * r, Math.sin(a) * r) + 0.1, Math.sin(a) * r); scene.add(rk); }
    // towns below (lamps in windows), far away in the fog
    const towns = [];
    for (const [x, z, n, s] of [[-26, -48, 14, 11], [30, -62, 18, 9], [-58, -90, 22, 13], [12, -110, 16, 7]]) {
      const tw = FW.town({ n, radius: 6, seed: s, color: '#6E5340', lit: 1, heightAt: (xx, zz) => ter.heightAt(x + xx, z + zz) - ter.heightAt(x, z) });
      tw.position.set(x, ter.heightAt(x, z), z); scene.add(tw); towns.push(tw);
    }
    const olives = []; for (let i = 0; i < 26; i++) { const x = -40 + R() * 80, z = -14 - R() * 40; const ol = FW.olive(i + 3, 0.9 + R() * 0.5); ol.position.set(x, ter.heightAt(x, z), z); scene.add(ol); olives.push(ol); }
    const rig = FW.rig({ hemiSky: '#5B6C96', hemiGround: '#3A2C20', hemi: 0.75, key: '#A9BEE8', keyI: 2.2, keyPos: [7, 7, -12], target: [0, y0, 0], shadow: 8 });
    scene.add(rig);
    const fill = new THREE.DirectionalLight(new THREE.Color('#B89A80'), 0.3); fill.position.set(2, y0 + 3, 12); scene.add(fill);
    // grass tufts and pebbles on the hilltop, and dark foreground tufts for depth
    const tufts = FW.tufts({ n: 70, r0: 0.9, r1: 7, seed: 8, heightAt: ter.heightAt, color: '#6A6440', size: 0.55, skipFront: true }); scene.add(tufts);
    for (const [z, h, c, sd] of [[-150, 22, '#273049', 3], [-210, 34, '#222A40', 7], [-120, 12, '#2E3550', 11]]) scene.add(FW.ridge({ z, height: h, color: c, seed: sd, y: y0 - 26 }));
    const moon = FW.moon(); moon.position.set(70, 70, -150); scene.add(moon);
    const S = samson(); S.position.set(0, y0, 0); S.rotation.y = 0.12; scene.add(S);
    const gl = godLight(scene, [0, y0, 0], { from: [-3.2, 15, 2.2], intensity: 220, angle: 0.2, r1: 1.8 });
    // dawn: a sun glow below the horizon (east = screen left-back)
    const dawnL = new THREE.DirectionalLight(new THREE.Color('#FFC27A'), 0); dawnL.position.set(-30, 6, -60); scene.add(dawnL);
    const set = { scene, ter, y0, samson: S, gl, rig, moon, towns, dawnL, focus: [0, y0 + 1.0, 0] };
    set.update = (t, s = {}) => {
      const dawn = s.dawn || 0, k = s.god === undefined ? 1 : s.god;
      gl.set(k, t);
      const sky = scene.userData.sky;
      const lerpC = (a, b, x) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), x).getHexString();
      sky.set({ top: lerpC('#0A1020', '#23324F', dawn), mid: lerpC('#1A2745', '#7A6A7E', dawn), bot: lerpC('#33405F', '#E7A86A', dawn), glowCol: lerpC('#000000', '#FFB870', dawn * 0.9), glowDir: [-0.5, 0.05, -0.85], glowPow: 5 });
      scene.userData.stars.material.opacity = 0.9 * (1 - dawn * 0.85);
      scene.fog.color.set(lerpC('#18223A', '#6F6274', dawn));
      rig.hemi.intensity = 0.6 + dawn * 0.7; rig.hemi.color.set(lerpC('#46557A', '#C9A68E', dawn));
      rig.key.intensity = 0.55 * (1 - dawn) ; dawnL.intensity = dawn * 2.2;
      for (const tw of towns) tw.visible = s.towns !== false;
      S.pose(s.pose || FW.POSE.openHands, t);
      if (s.samsonRot !== undefined) S.rotation.y = s.samsonRot;
    };
    return set;
  };
})();
