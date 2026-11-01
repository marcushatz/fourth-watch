// HOOK STYLE SHOT (Lehi, Judges 15:13-14), in the low-poly diorama grammar:
// SH1 0 -> "why": high three-quarter wide. Samson bound with two new ropes on the ridge, the men of Judah
//   behind him, the Philistines coming up from their camp shouting. Slow push-in. Tags: SAMSON, PHILISTINES.
// SH2 "why" -> end: closer, lower. He strains; gold light from the upper left on "give"; the ropes burn
//   like flax and fall off; the camera eases back to show him free. Narration builds at the top.
(function () {
  const G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP, TX = globalThis.TX;
  const VO = S.VO, W = G.W, H = G.H;
  const { clamp, lerp, prog, ease } = FW;
  const L0 = VO.lines[0], WD = L0.words;
  const tWhy = WD[9].s, tDid = WD[10].s, tGive = WD[12].s, tStr = WD[16].s;
  const CUT = tWhy - 0.1;
  let scene, cam, sun, hemi, spot, sam, judah = [], march = [], campMen = [], shaft, pool, embers, motes, ring, fires = [], contact = [];

  // ---------------- the land ----------------
  const CAMP = [8.5, -12.5];
  const PATH = [[0.9, -0.9], [2.4, -2.6], [3.6, -4.6], [5.0, -6.8], [6.4, -9.0], [7.6, -11.0]];
  const distSeg = (x, z, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], wx = x - a[0], wz = z - a[1]; const k = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz)); return Math.hypot(wx - vx * k, wz - vz * k); };
  const distPath = (x, z) => { let d = 1e9; for (let i = 0; i < PATH.length - 1; i++) d = Math.min(d, distSeg(x, z, PATH[i], PATH[i + 1])); return d; };
  const hRaw = (x, z) => {
    const d = Math.hypot((x + 0.4) / 1.0, (z - 0.6) / 1.25);
    let h = 3.6 * Math.exp(-Math.pow(d / 8.2, 2)) - 3.6;
    h += 1.8 * Math.exp(-(Math.pow((x + 8) / 5, 2) + Math.pow((z + 3) / 7, 2)));            // the ridge's shoulder, back left
    h += FW.smooth(clamp((-z - 22) / 26)) * (3.2 + 8 * FW.fbm(x * 0.03 + 3, z * 0.03, 5, 3)); // far hills
    h += FW.smooth(clamp((-x - 12) / 12)) * 3.5 * FW.fbm(x * 0.05, z * 0.05, 9, 3);           // left hills
    h += FW.smooth(clamp((x - 16) / 12)) * 3.0 * FW.fbm(x * 0.05 + 7, z * 0.05, 13, 3);       // right hills
    h += (FW.fbm(x * 0.11, z * 0.11, 2, 4) - 0.5) * 1.5 + (FW.noise2(x * 0.55, z * 0.55, 4) - 0.5) * 0.2;
    return h;
  };
  const hFn = (x, z) => {
    let h = hRaw(x, z);
    const kc = FW.smooth(clamp((Math.hypot(x - CAMP[0], z - CAMP[1]) - 3) / 4)); h = lerp(-3.1 + (FW.noise2(x * 0.4, z * 0.4, 8) - 0.5) * 0.25, h, kc); // camp floor
    const kp = FW.smooth(clamp((Math.hypot(x, z) - 1.3) / 2.2)); h = lerp(0, h, kp);           // the flat top he stands on
    return h;
  };
  const C = (h) => new THREE.Color(h);
  const colFn = (x, z, y, ny, rnd) => {
    const steep = 1 - ny;
    const n = FW.fbm(x * 0.09 + 11, z * 0.09, 21, 3);
    let c;
    if (steep > 0.34) c = C(rnd < 0.5 ? '#B6A48F' : '#A8957F');
    else if (steep > 0.2) c = C(n > 0.5 ? '#C8A673' : '#B3AC66');
    else c = C(n > 0.62 ? '#C2BC6E' : n > 0.42 ? '#A9B65C' : '#94AA54');
    if (y < -2.4) c.lerp(C('#8FA052'), 0.35);                                                  // greener valley floor
    const dp = distPath(x, z); if (dp < 0.6) c.lerp(C('#D9C8A0'), FW.smooth(clamp((0.6 - dp) / 0.35)));
    const dc = Math.hypot(x - CAMP[0], z - CAMP[1]); if (dc < 5.5) c.lerp(C('#CDB88E'), 0.7 * FW.smooth(clamp((5.5 - dc) / 2)));
    if (Math.hypot(x, z) < 1.6) c.lerp(C('#CFBD92'), 0.6);
    c.offsetHSL((rnd - 0.5) * 0.012, (rnd - 0.5) * 0.04, (rnd - 0.5) * 0.06);
    return c;
  };

  // ---------------- people ----------------
  const SAM_H = 1.86;
  function makeSamson() {
    // canvas 1300x1600 at 2.5 px per design unit; feet 60 px above the bottom
    const bb = LW.billboard({ cw: 1300, ch: 1640, worldH: SAM_H * 1640 / 1400, footPx: 60, draw: (ctx, st) => { ctx.translate(650, 1580); ctx.scale(2.5, 2.5); PP.samson(ctx, st); } });
    return bb;
  }
  const soldierTex = [];
  function makeSoldier(v, x, z, s = 1) {
    const variants = [{}, { raise: 1, spearSide: -1, kilt: '#B24A32', trim: '#E4D3B0' }, { skin: '#A87048', raise: 1 }, { kilt: '#D8C6A0', spearSide: -1, skin: '#B47A50' }, { raise: 0.6, skin: '#C99062' }];
    const o = variants[v % variants.length];
    const bb = LW.billboard({ cw: 340, ch: 460, worldH: 1.8 * 460 / 330 * s, footPx: 14, draw: (ctx) => { ctx.translate(170, 446); ctx.scale(0.5, 0.5); PP.soldier(ctx, o); } });
    bb.userData.update('x');
    bb.position.set(x, hFn(x, z), z);
    scene.add(bb.userData.caster);
    return bb;
  }
  function makeJudean(o, x, z) {
    const bb = LW.billboard({ cw: 420, ch: 560, worldH: 1.78 * 560 / 450, footPx: 16, draw: (ctx, st) => { ctx.translate(210, 544); ctx.scale(0.75, 0.75); PP.judean(ctx, Object.assign({}, o, st)); } });
    bb.userData.update('0', { hand: 0 });
    bb.position.set(x, hFn(x, z), z);
    scene.add(bb.userData.caster);
    return bb;
  }
  const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
  function contactShadow(obj, r = 0.45) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobTex), transparent: true, depthWrite: false, color: 0x2a1a10, opacity: 0.8 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m); contact.push([m, obj]);
  }

  function build() {
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color('#B9B4CC'), 20, 80);
    scene.add(LW.sky({ top: '#1B2A4E', mid: '#4C5A86', hor: '#E3A98C', low: '#B9B4CC', sunDir: [-0.75, 0.06, -0.66], sunCol: '#FFC88A', sunAmt: 0.9 }));
    // light: a low warm sun from the upper left (God's side of the frame), cool sky fill
    hemi = new THREE.HemisphereLight(C('#C4D2EE'), C('#A88B66'), 1.3); scene.add(hemi);
    sun = new THREE.DirectionalLight(C('#FFDDB2'), 3.9);
    sun.position.set(-12, 7.2, -7); sun.target.position.set(1, 0, -2);
    sun.castShadow = true; sun.shadow.mapSize.set(3072, 3072);
    const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 60;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    // God's light: a gold spot from the same upper left, off until "give"
    spot = new THREE.SpotLight(C('#FFC766'), 0, 30, 0.085, 0.5, 1.2);
    spot.position.set(-4.6, 12.5, -2.8); spot.target.position.set(0, 0.6, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0005;
    scene.add(spot, spot.target);

    scene.add(LW.terrain({ size: 170, seg: 128, cx: 0, cz: -40, hFn, colFn, seed: 3 }));

    // dressing: olive trees, scrub, rocks, grass (seeded, kept off the paths, the top and the camp)
    const rng = FW.rng(41);
    const free = (x, z, r) => Math.hypot(x, z) > r && distPath(x, z) > 1.1 && Math.hypot(x - CAMP[0], z - CAMP[1]) > 5.2;
    for (let i = 0; i < 70; i++) { const x = -26 + rng() * 52, z = -40 + rng() * 48; if (!free(x, z, 3.2)) continue; const tr = LW.olive(rng, 0.85 + rng() * 0.6); tr.position.set(x, hFn(x, z) - 0.05, z); scene.add(tr); }
    for (let i = 0; i < 120; i++) { const x = -20 + rng() * 40, z = -30 + rng() * 40; if (!free(x, z, 2.2)) continue; const b = LW.bush(rng, 0.8 + rng() * 0.9); b.position.set(x, hFn(x, z), z); scene.add(b); }
    for (let i = 0; i < 90; i++) { const a = rng() * 6.283, r = 1.7 + rng() * 14; const x = Math.cos(a) * r, z = Math.sin(a) * r - 1; if (distPath(x, z) < 0.7) continue; const s = r < 4 ? 0.35 + rng() * 0.4 : 0.3 + rng() * 1.1; const k = LW.rock(rng, s); k.position.x = x; k.position.z = z; k.position.y += hFn(x, z) - 0.05; scene.add(k); }
    for (let i = 0; i < 160; i++) { const x = -9 + rng() * 18, z = -9 + rng() * 12; if (Math.hypot(x, z) < 1.0 || (x < 0.5 && z > 1.5)) continue; const g = LW.grassTuft(rng, 0.45 + rng() * 0.4); g.position.set(x, hFn(x, z), z); scene.add(g); }
    // foreground rocks close to the lens (soft in the DOF)
    for (const [x, z, s] of [[-2.6, 5.6, 1.6], [-1.6, 6.4, 1.0], [2.9, 5.2, 1.3], [-3.5, 3.6, 0.9]]) { const k = LW.rock(FW.rng(Math.round(x * 100 + z)), s); k.position.set(x, hFn(x, z) + 0.05, z); scene.add(k); }

    // the Philistine camp
    const crng = FW.rng(77);
    for (let i = 0; i < 11; i++) { const a = (i / 11) * 6.283 + crng() * 0.4, r = 2.6 + crng() * 2.0; const x = CAMP[0] + Math.cos(a) * r, z = CAMP[1] + Math.sin(a) * r; const tn = LW.tent(crng, 0.95 + crng() * 0.35); tn.position.set(x, hFn(x, z), z); scene.add(tn); }
    { const tn = LW.tent(crng, 1.7, '#DCCAA6', '#9E3B26'); tn.position.set(CAMP[0] + 0.6, hFn(CAMP[0] + 0.6, CAMP[1] - 0.8), CAMP[1] - 0.8); scene.add(tn); }
    for (const [dx, dz] of [[-1.6, 1.2], [2.2, 2.0], [-2.8, -1.6], [3.4, -2.2]]) { const b = LW.banner(crng, 1.1); b.position.set(CAMP[0] + dx, hFn(CAMP[0] + dx, CAMP[1] + dz), CAMP[1] + dz); scene.add(b); }
    for (const [dx, dz] of [[-0.6, 1.6], [1.4, -0.4]]) { const f = LW.fire(crng); f.position.set(CAMP[0] + dx, hFn(CAMP[0] + dx, CAMP[1] + dz), CAMP[1] + dz); scene.add(f); fires.push(f); }
    for (let i = 0; i < 8; i++) { const c = LW.crate(crng, 1 + crng() * 0.4); const x = CAMP[0] + (crng() - 0.5) * 6, z = CAMP[1] + (crng() - 0.5) * 6; c.position.x = x; c.position.z = z; c.position.y += hFn(x, z); scene.add(c); }
    // soldiers around the camp
    for (let i = 0; i < 20; i++) { const a = crng() * 6.283, r = 1 + crng() * 4.2; const x = CAMP[0] + Math.cos(a) * r, z = CAMP[1] + Math.sin(a) * r + 1.5; const s = makeSoldier(i, x, z, 0.95 + crng() * 0.1); scene.add(s); campMen.push(s); }
    // the column coming up the path, shouting (Judges 15:14)
    for (let i = 0; i < 12; i++) { const s = makeSoldier(i + 1, 0, 0, 1); s.userData.lane = (i % 3) - 1; s.userData.u0 = 0.47 + Math.floor(i / 3) * 0.075 + (i % 3) * 0.02; s.userData.ph = i * 1.7; scene.add(s); march.push(s); contactShadow(s, 0.38); }

    // the men of Judah who bound him and brought him up (15:12-13), a little behind him on the left
    judah.push(makeJudean({ robe: '#7E5E40', cloth: '#DCCDAE', stripe: '#5E4430', look: [0.6, 0] }, -0.95, -1.55));
    judah.push(makeJudean({ robe: '#6B4A33', cloth: '#C9B48E', stripe: '#8A6646', beard: '#2E2118', skin: '#A86F48', look: [0.8, 0.1] }, -1.6, -1.05));
    judah.forEach((j) => { scene.add(j); contactShadow(j, 0.42); });

    sam = makeSamson(); sam.position.set(0, 0, 0); scene.add(sam, sam.userData.caster); contactShadow(sam, 0.5);

    // ground ring that marks him (cream, Lintel-style highlight)
    ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 64, 1, 0, 0.01), new THREE.MeshBasicMaterial({ color: C('#F4EAD5'), transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false, fog: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.025; ring.renderOrder = 3; scene.add(ring);

    shaft = LW.shaft([-4.6, 13.5, -2.8], [0, -0.2, 0], 0.3, 0.85, '#FFC86E'); scene.add(shaft);
    pool = LW.pool(1.05, '#FFC86E'); pool.position.set(0, 0.03, 0); scene.add(pool);
    embers = LW.particles(120, '#FFB24C', 0.06); scene.add(embers);
    motes = LW.particles(70, '#FFE3B0', 0.035); scene.add(motes);
  }

  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const pathAt = (u) => { // u 0..1 along PATH (u=0 at the top, next to him)
    const segs = []; let tot = 0; for (let i = 0; i < PATH.length - 1; i++) { const l = Math.hypot(PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]); segs.push(l); tot += l; }
    let d = clamp(u) * tot; for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) { const k = d / segs[i]; return [lerp(PATH[i][0], PATH[i + 1][0], k), lerp(PATH[i][1], PATH[i + 1][1], k), PATH[i + 1][0] - PATH[i][0], PATH[i + 1][1] - PATH[i][1]]; } d -= segs[i]; }
    return [PATH[0][0], PATH[0][1], 1, 0];
  };

  // ---------------- the action, as a function of t ----------------
  function stage(t) {
    const burn = prog(t, tGive - 0.45, tGive, ease.in), brk = prog(t, tGive, tGive + 0.75, (x) => x), burst = prog(t, tGive + 0.02, tGive + 0.4, ease.out);
    const strain = Math.max(0.3 + 0.08 * Math.sin(t * 1.3), prog(t, tWhy - 0.1, tGive - 0.15, ease.inOut));
    const gold = prog(t, tDid - 0.15, tGive + 0.05, ease.inOut);
    const look = burst > 0.2 ? [lerp(0.1, 0, burst), lerp(-0.4, 0, burst)] : t < CUT ? [0.75, 0.15] : [lerp(0.75, 0.1, prog(t, CUT, tDid)), lerp(0.15, -0.4, prog(t, tDid, tGive))];
    const q = (v, n = 60) => Math.round(v * n) / n;
    const st = { t: q(t, 30), strain: q(strain), burst: q(burst), burn: q(burn), brk: q(brk), rim: q(gold), look: look.map((v) => q(v, 20)) };
    sam.userData.update(JSON.stringify(st), st);
    // the column climbs until he is free, then stops
    const halt = Math.min(t, tGive + 0.25 + 0.5 * (1 - Math.exp(-(t - tGive - 0.25)))) ;
    march.forEach((m) => {
      const u = m.userData.u0 - halt * 0.026 + prog(t, tGive + 0.25, tGive + 0.9, ease.out) * 0.022;
      const [x, z, dx, dz] = pathAt(u); const nl = Math.hypot(dx, dz) || 1; const lx = (-dz / nl) * m.userData.lane * 0.55, lz = (dx / nl) * m.userData.lane * 0.55;
      const walking = t < tGive + 0.4 ? 1 : Math.exp(-(t - tGive - 0.4) * 4);
      const ph = t * 7.5 + m.userData.ph;
      m.position.set(x + lx, hFn(x + lx, z + lz) + Math.abs(Math.sin(ph)) * 0.05 * walking, z + lz);
      m.userData.tilt = Math.sin(ph) * 0.04 * walking;
    });
    campMen.forEach((m, i) => { m.userData.tilt = Math.sin(t * 2 + i) * 0.015; });
    // God's light
    const surge = Math.exp(-Math.max(0, t - tGive) * 2.2) * (t >= tGive ? 1 : 0);
    shaft.material.uniforms.amt.value = 0; shaft.visible = false;
    shaft.material.uniforms.time.value = t;
    sun.intensity = 3.9 * (1 - 0.3 * gold); hemi.intensity = 1.3 * (1 - 0.22 * gold);
    pool.material.opacity = gold * 0.22 + surge * 0.2;
    spot.intensity = (gold * 14 + surge * 16);
    sam.material.color.setRGB(lerp(1.0, 1.1, gold) + surge * 0.12, lerp(0.95, 1.04, gold) + surge * 0.08, lerp(0.9, 0.86, gold));
    // embers from the burning ropes (deterministic), motes in the light
    embers.userData.update((i, v) => {
      const born = tGive - 0.1 + hsh(i) * 0.5, age = t - born;
      if (age < 0 || age > 1.8) { v.set(0, -50, 0); return { alpha: 0 }; }
      const a = hsh(i, 2) * 6.283, sp = 0.6 + hsh(i, 3) * 1.6, up = 0.6 + hsh(i, 4) * 1.4;
      const y0 = hsh(i, 5) < 0.6 ? 1.18 : 0.92;
      v.set(Math.cos(a) * (0.22 + sp * age), y0 + up * age - 0.35 * age * age, Math.sin(a) * 0.2 * (0.3 + sp * age) + 0.12);
      return { alpha: (1 - age / 1.8) * (0.8 + 0.2 * Math.sin(age * 30 + i)), size: 0.8 + hsh(i, 6) };
    });
    motes.userData.update((i, v) => {
      const k = (hsh(i, 7) + t * 0.025 * (0.5 + hsh(i, 8))) % 1;
      const along = 0.15 + hsh(i, 9) * 0.85;
      v.set(lerp(-4.6, 0, along) + Math.sin(t * 0.4 + i) * 0.35 * along, lerp(13.5, 0.2, along) + (k - 0.5) * 0.6, lerp(-2.8, 0, along) + Math.cos(t * 0.3 + i * 2) * 0.35 * along);
      return { alpha: (gold * 0.9 + 0.12) * (0.4 + 0.6 * hsh(i, 10)) * Math.sin(Math.PI * k), size: 0.7 + hsh(i, 11) * 0.8 };
    });
    // ring under him in the wide shot
    const rk = prog(t, 0.25, 0.85, ease.inOut), rfade = 1 - prog(t, CUT - 0.4, CUT - 0.05);
    ring.geometry.dispose(); ring.geometry = new THREE.RingGeometry(0.62, 0.69, 64, 1, Math.PI * 0.5, Math.max(0.01, rk * Math.PI * 2));
    ring.material.opacity = 0.95 * rfade * (t < CUT ? 1 : 0);
    // Judah men: step back when the ropes go
    const recoil = prog(t, tGive + 0.1, tGive + 0.7, ease.out);
    judah[0].userData.update(recoil > 0.5 ? '1' : '0', { hand: recoil > 0.5 ? 1 : 0, look: [0.6, -0.2] });
    judah[0].position.x = -0.95 - recoil * 0.25; judah[1].position.x = -1.6 - recoil * 0.2;
    fires.forEach((f, i) => { f.userData.core.scale.set(1, 0.85 + 0.25 * Math.sin(t * 13 + i * 2), 1); });
    return { burst, gold, surge };
  }

  // ---------------- camera ----------------
  const K = (p, l, f) => ({ p, l, f });
  function camAt(t) {
    let k, focusP = [0, 1.0, 0], ap = 5, shift = 0;
    if (t < CUT) { // high three-quarter wide, slow push-in
      const A = K([-3.6, 6.9, 8.4], [0.75, 0.2, -1.7], 34), B = K([-3.15, 6.1, 7.4], [0.7, 0.28, -1.6], 34);
      k = FW.camLerpK(A, B, ease.inOut(clamp(t / CUT)));
      shift = 0.1; ap = 5;
    } else { // closer three-quarter from higher left: he strains; on "give" the camera eases back and up to show him free
      const A = K([-2.3, 3.9, 4.6], [0.35, 0.55, -1.0], 32), Bk = K([-2.1, 3.6, 4.15], [0.35, 0.6, -1.0], 32);
      const C2 = K([-2.5, 4.35, 5.25], [0.4, 0.72, -1.15], 32);
      k = t < tGive ? FW.camLerpK(A, Bk, ease.inOut(clamp((t - CUT) / (tGive - CUT)))) : FW.camLerpK(Bk, C2, ease.out(clamp((t - tGive) / 1.4)));
      focusP = [0, 1.1, 0]; ap = 4.2; shift = 0.08;
      const d = t - tGive; if (d >= 0 && d < 0.4) { const a = 0.035 * Math.pow(1 - d / 0.4, 2); k.p = [k.p[0] + Math.cos(d * 70) * a, k.p[1] + Math.sin(d * 53 + 1) * a, k.p[2]]; }
    }
    FW.setCam(cam, k.p, k.l, k.f);
    cam.setViewOffset(W, H, 0, -shift * H, W, H);
    cam.updateMatrixWorld();
    const focus = new THREE.Vector3(...focusP).applyMatrix4(cam.matrixWorldInverse).z * -1;
    const dir = new THREE.Vector3(k.l[0] - k.p[0], k.l[1] - k.p[1], k.l[2] - k.p[2]).normalize();
    return { focus, ap, pitch: Math.asin(-dir.y) };
  }

  // ---------------- 2D finishing ----------------
  let bl1, bl2;
  function bloom(ctx, amt) {
    const c = ctx.canvas, w = Math.round(c.width / 4), h = Math.round(c.height / 4);
    if (!bl1) { bl1 = document.createElement('canvas'); bl2 = document.createElement('canvas'); }
    if (bl1.width !== w) { bl1.width = bl2.width = w; bl1.height = bl2.height = h; }
    const a = bl1.getContext('2d'), b = bl2.getContext('2d');
    a.filter = 'brightness(0.72) contrast(3.2) saturate(1.2)'; a.clearRect(0, 0, w, h); a.drawImage(c, 0, 0, w, h); a.filter = 'none';
    b.clearRect(0, 0, w, h); b.filter = 'blur(9px)'; b.drawImage(bl1, 0, 0); b.filter = 'blur(3px)'; b.globalAlpha = 0.6; b.drawImage(bl1, 0, 0); b.globalAlpha = 1; b.filter = 'none';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amt; ctx.drawImage(bl2, 0, 0, c.width, c.height); ctx.restore();
  }
  const project = (p) => LW.project(cam, p);
  // God's light as rays from above the top-left corner, converging on him (additive, soft, slowly turning)
  function rays(ctx, t, amt, target) {
    if (amt <= 0.01) return;
    const ox = -260, oy = -520, ang0 = Math.atan2(target[1] - oy, target[0] - ox), len = Math.hypot(target[0] - ox, target[1] - oy) * 1.02;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const R = [[-0.115, 26, 0.55], [-0.07, 54, 0.8], [-0.03, 20, 0.5], [0.0, 80, 1.0], [0.035, 30, 0.6], [0.075, 46, 0.7], [0.12, 22, 0.45]];
    for (const [da, wDeg, a] of R) {
      const ang = ang0 + da + Math.sin(t * 0.35 + da * 40) * 0.008, w = (wDeg / 1000) * (1 + 0.15 * Math.sin(t * 0.8 + da * 90));
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.3, `rgba(255,210,130,${0.15 * a * amt})`); g.addColorStop(0.68, `rgba(255,200,110,${0.2 * a * amt})`); g.addColorStop(0.9, `rgba(255,200,110,${0.05 * a * amt})`); g.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(ang - w) * len, oy + Math.sin(ang - w) * len); ctx.lineTo(ox + Math.cos(ang + w) * len, oy + Math.sin(ang + w) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  const keys = new Set([5, 6, 7, 8, 16]);

  Studio.film({
    post: { paper: 0, grain: 0.03, vignette: 0.24, bloom: 0 },
    fadeOut: 0,
    async init() {
      for (const [fam, file, w, st] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700'], ['Cinzel', 'fonts/cinzel-latin-900-normal.woff2', '900'],
        ['Cormorant Garamond', 'fonts/cormorant-garamond-latin-600-italic.woff2', '600', 'italic'], ['Inter', 'fonts/inter-latin-600-normal.woff2', '600']]) {
        const f = new FontFace(fam, `url(${file})`, { weight: w, style: st || 'normal' }); document.fonts.add(f); await f.load();
      }
      LW.init(W, H);
      cam = new THREE.PerspectiveCamera(38, W / H, 0.2, 320);
      build();
    },
    draw(ctx, t) {
      const act = stage(t);
      const { focus, ap, pitch } = camAt(t);
      const lean = pitch * 0.5;
      [sam, ...judah, ...march, ...campMen].forEach((m) => { m.rotation.order = 'YXZ'; m.userData.face(cam); m.rotation.x = -lean; m.rotation.z = m.userData.tilt || 0; m.userData.castFrom(sun); });
      contact.forEach(([m, o]) => { m.position.set(o.position.x, o.position.y + 0.02, o.position.z); });
      const exp = 1.1 + act.surge * 0.04;
      const gl = LW.render(scene, cam, { focus, aperture: ap, maxR: 7, fgScale: 1.5, exposure: exp, sat: 1.1 });
      ctx.drawImage(gl, 0, 0, W, H);
      rays(ctx, t, act.gold * 0.85 + act.surge * 0.35, project([0, 1.1, 0]));
      bloom(ctx, 0.15 + act.surge * 0.05 - act.gold * 0.04);
      // impact flash on "give"
      { const d = t - tGive; if (d >= 0 && d < 0.16) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,150,${(0.28 * Math.pow(1 - d / 0.16, 2)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
      // a soft night scrim behind the text block
      { const g = ctx.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, 'rgba(10,12,30,0.5)'); g.addColorStop(0.65, 'rgba(10,12,30,0.22)'); g.addColorStop(1, 'rgba(10,12,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 720); }
      // tags (wide shot only)
      if (t < CUT) {
        const out = 1 - prog(t, CUT - 0.3, CUT - 0.05);
        const hd = project([0, SAM_H + 0.12, 0]);
        TX.tag(ctx, 'SAMSON', hd[0], hd[1], prog(t, 0.35, 1.05, (x) => x), { dy: -96, sub: 'JUDGES 15:14', a: out });
        const lead = march[1].position; const ph = project([lead.x, lead.y + 1.25, lead.z]);
        TX.tag(ctx, 'THE PHILISTINES', ph[0], ph[1], prog(t, 1.5, 2.2, (x) => x), { dy: Math.max(-150, 700 - ph[1]), dx: -40, a: out });
      }
      TX.header(ctx, W, 1, { series: 'ASK THE TEXT', topic: 'SAMSON' });
      TX.title(ctx, W, [['WHY', 'GIVE', 'SAMSON'], ['THAT', 'STRENGTH?*']], 1, 318, 76);
      TX.narration(ctx, W, WD, t, { y: 488, size: 48, breaks: [9], keys });
    },
  });
})();
