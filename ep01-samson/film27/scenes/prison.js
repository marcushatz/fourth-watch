// THE PRISON IN GAZA (Judges 16:21-22). Blind Samson (closed eyes and a cloth band only: no wounds), in bronze
// shackles, grinds at the mill: a dark stone room, a millstone with a pushing bar, one shaft of cold light from a high
// barred window on the upper left. S25 wide (cold), S27 close-up as his hair begins to grow again (time-lapse, a thin
// warm light begins), S28 he lifts his face: a small gold glimmer from the upper left (God's light, this shot only).
// Every frame is a pure function of t; timing from shot.t0 / t1 / beats.
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const W = S.W, H = S.H;
  const { clamp, lerp, prog, ease } = FW;
  const C = (h) => new THREE.Color(h);
  const hsh = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
  const q = (v, n = 60) => Math.round(v * n) / n;

  // ---------------- merged low-poly geometry ----------------
  const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
  function Merger() {
    const pos = [], col = [], v = new THREE.Vector3(), cc = new THREE.Color();
    let tri = 0;
    const api = {
      add(geo, m4, color, jit = 0.05) {
        const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, base = color.isColor ? color : C(color);
        for (let i = 0; i < p.count; i++) {
          if (i % 3 === 0) { const r = hsh(tri++, 7); cc.copy(base).offsetHSL((r - 0.5) * 0.01, 0, (r - 0.5) * jit); }
          v.fromBufferAttribute(p, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z); col.push(cc.r, cc.g, cc.b);
        }
        return api;
      },
      box(w, h, d, x, y, z, color, ry = 0, jit = 0.05, rx = 0, rz = 0, geo = UNIT_BOX) {
        const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(w, h, d));
        return api.add(geo, m, color, jit);
      },
      mesh(mat) {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
        const m = new THREE.Mesh(g, mat || new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 }));
        m.castShadow = true; m.receiveShadow = true; return m;
      },
    };
    return api;
  }
  const stoneBox = (seed) => LW.jitter(new THREE.BoxGeometry(1, 1, 1, 1, 1, 1), 0.07, FW.rng(seed));

  // ---------------- Samson (PP2 when published; PP.samson as a stand-in) ----------------
  const SAM_H = 1.86;
  function samSize() {
    const s = globalThis.PP2 && globalThis.PP2.SIZES && globalThis.PP2.SIZES.samson;
    if (s && s.cw && s.ch && s.worldH) return { cw: s.cw, ch: s.ch, worldH: s.worldH, footPx: s.footPx ?? 60, scale: s.scale ?? 2.5 };
    return { cw: 1300, ch: 1640, worldH: (SAM_H * 1640) / 1400, footPx: 60, scale: 2.5 };
  }
  function samDraw(ctx, st) {
    const P2 = globalThis.PP2;
    if (P2 && typeof P2.samson === 'function') { P2.samson(ctx, st); return; }
    // stand-in: PP.samson (no shaved head / shackles); a cloth band over closed eyes for the blind poses
    const f = { t: st.t || 0, look: st.look || [0, 0], rim: st.gold || 0, strain: 0, burst: 0 };
    if (st.pose === 'grind') f.strain = 0.55;
    PP.samson(ctx, f);
    if (st.blind) { ctx.save(); ctx.fillStyle = '#2B2420'; ctx.strokeStyle = '#140D09'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.roundRect(-44, -506, 88, 22, 6); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  // a billboard; crop = null for the full figure, or {y0, y1, half, ppu}: a high-resolution crop (design units, y up negative)
  function makeSam(crop) {
    const z = samSize(), unit = z.worldH / (z.ch / z.scale); // metres per design unit
    if (!crop) return LW.billboard({ cw: z.cw, ch: z.ch, worldH: z.worldH, footPx: z.footPx, draw: (ctx, st) => { ctx.translate(z.cw / 2, z.ch - z.footPx); ctx.scale(z.scale, z.scale); samDraw(ctx, st); } });
    const { y0, y1, half, ppu } = crop, cx = crop.cx || 0, cw = Math.round(half * 2 * ppu), ch = Math.round((y1 - y0) * ppu);
    const worldH = (y1 - y0) * unit, footPx = ch - -y0 * ppu;
    const bb = LW.billboard({ cw, ch, worldH, footPx, draw: (ctx, st) => { ctx.translate(cw / 2 - cx * ppu, -y0 * ppu); ctx.scale(ppu, ppu); samDraw(ctx, st); } });
    bb.geometry.translate(cx * unit, 0, 0); // the crop is centred on the head; keep the feet on the billboard's origin
    return bb;
  }

  // ---------------- the room ----------------
  // floor at y = 0; the mill at the origin; walls: left x = -RX, right x = +RX, back z = -RZ; the camera side is open
  const RX = 5.2, RZ = 6.4, WALL_H = 4.6;
  const WIN = { x: -RX, y: 3.15, z: -1.4, w: 0.95, h: 0.8 }; // the barred window, high on the left wall
  const MILL_R = 2.05;                                        // the bar's contact point (his hands) on this radius
  let BAR_H = 1.05, HAND_X = 0.3;                              // hands: height and offset to screen right (from PP2 'grind')
  const U_M = 1.86 / 560;
  let CROP_G = { cx: 0, y0: -660, y1: -230, half: 230, ppu: 3.8 }, CROP_L = { cx: 0, y0: -670, y1: -200, half: 220, ppu: 3.6 };
  let HEAD_G = 1.58, HEAD_L = 1.61; // head-centre heights (m) in 'grind' / 'lookup'
  function measure() {
    const P2 = globalThis.PP2; if (!(P2 && P2.samsonInfo)) return;
    const g = P2.samsonInfo({ pose: 'grind', t: 0 }), l = P2.samsonInfo({ pose: 'lookup', t: 0 });
    HAND_X = ((g.hands[0][0] + g.hands[1][0]) / 2 + 12) * U_M; BAR_H = -((g.hands[0][1] + g.hands[1][1]) / 2) * U_M;
    CROP_G = { cx: g.head[0], y0: g.head[1] - 190, y1: g.head[1] + 250, half: 235, ppu: 4 };
    CROP_L = { cx: l.head[0], y0: l.head[1] - 185, y1: l.head[1] + 290, half: 225, ppu: 3.7 };
    HEAD_G = -g.head[1] * U_M; HEAD_L = -l.head[1] * U_M;
  }
  let bounce, scene, cam, hemi, winSpot, goldSpot, shaft, goldShaft, pool, motes, goldMotes, runner, sam, samCU, samCUL, samShadow, winGlow, warmBeam;

  function build() {
    scene = new THREE.Scene();
    scene.background = C('#07080B');
    scene.fog = new THREE.Fog(C('#0B0D14'), 11, 30);
    hemi = new THREE.HemisphereLight(C('#56648A'), C('#1A1612'), 0.32); scene.add(hemi);

    // floor: flagstones over dark grout
    const F = Merger(), frng = FW.rng(2501);
    F.box(2 * RX + 2, 0.1, RZ + 9, 0, -0.06, -RZ / 2 + 2.5, '#211D19', 0, 0.02);
    for (let ix = -6; ix <= 6; ix++) for (let iz = -7; iz <= 5; iz++) {
      const x = ix * 0.9 + (frng() - 0.5) * 0.08, z = iz * 0.9 + (frng() - 0.5) * 0.08;
      if (Math.abs(x) > RX - 0.2 || z < -RZ + 0.2) continue;
      const c = ['#5A534A', '#655D52', '#504A42', '#5F574C', '#6B6256'][Math.floor(frng() * 5)];
      F.box(0.84 + frng() * 0.04, 0.08, 0.84 + frng() * 0.04, x, -0.02 + frng() * 0.025, z, c, (frng() - 0.5) * 0.06, 0.06, (frng() - 0.5) * 0.03, (frng() - 0.5) * 0.03, stoneBox(ix * 31 + iz));
    }
    // the worn circle where he walks, and spilled flour around the base
    const ring = new THREE.Mesh(new THREE.RingGeometry(MILL_R - 0.42, MILL_R + 0.42, 48), new THREE.MeshStandardMaterial({ color: C('#7A6E5E'), roughness: 1, transparent: true, opacity: 0.35, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.035; ring.receiveShadow = true; scene.add(ring);
    const flour = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.45, 40), new THREE.MeshStandardMaterial({ color: C('#D9D0BE'), roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }));
    flour.rotation.x = -Math.PI / 2; flour.position.y = 0.04; flour.receiveShadow = true; scene.add(flour);
    scene.add(F.mesh());

    // walls: staggered courses of big stone blocks; the window opening on the left wall
    const Wm = Merger(), wrng = FW.rng(2502), stone = ['#5E564C', '#6A6155', '#544D45', '#645B50', '#4E4740'];
    const course = 0.46;
    const wall = (len, axis, fixed, inward) => { // axis 'x' (back wall along x at z = fixed) or 'z' (side wall along z at x = fixed)
      for (let r = 0; r * course < WALL_H; r++) {
        let u = -len / 2 - (r % 2) * 0.45;
        while (u < len / 2) {
          const bl = 0.7 + wrng() * 0.55, cu = u + bl / 2, y = r * course + course / 2;
          const inWin = axis === 'z' && fixed < 0 && Math.abs(cu - WIN.z) < WIN.w / 2 + bl / 2 - 0.05 && Math.abs(y - WIN.y) < WIN.h / 2 + course / 2 - 0.05;
          if (!inWin) {
            const c = stone[Math.floor(wrng() * stone.length)], d = 0.55 + wrng() * 0.08, sd = Math.round(wrng() * 1e5);
            if (axis === 'x') Wm.box(bl - 0.03, course - 0.03, d, cu, y, fixed + inward * (d / 2 - 0.3), c, 0, 0.07, 0, 0, stoneBox(sd));
            else Wm.box(d, course - 0.03, bl - 0.03, fixed + inward * (d / 2 - 0.3), y, cu, c, 0, 0.07, 0, 0, stoneBox(sd));
          }
          u += bl;
        }
      }
    };
    wall(2 * RX + 0.6, 'x', -RZ, 1);
    wall(RZ + 6, 'z', -RX, 1); wall(RZ + 6, 'z', RX, -1);
    // shift the side walls' centre toward the back
    // (built centred on z = 0; the room runs from z = -RZ to about +5)
    Wm.box(0.7, 0.2, WIN.w + 0.3, -RX + 0.05, WIN.y - WIN.h / 2 - 0.08, WIN.z, '#6E6457'); // sill
    // timber ceiling beams + a dark ceiling
    for (let i = 0; i < 6; i++) Wm.box(2 * RX + 0.4, 0.26, 0.3, 0, WALL_H - 0.1, -RZ + 0.8 + i * 1.9, '#3A2C22', 0, 0.06);
    Wm.box(2 * RX + 1, 0.12, RZ + 8, 0, WALL_H + 0.1, -1, '#141110');
    // a stone pillar and a heavy door on the back wall
    Wm.box(0.7, WALL_H, 0.7, 3.4, WALL_H / 2, -4.6, '#5A5248', 0, 0.06, 0, 0, stoneBox(77));
    for (let k = 0; k < 4; k++) Wm.box(0.36, 2.1, 0.12, -1.65 + k * 0.37, 1.05, -RZ + 0.36, ['#3E2E22', '#46352A', '#3A2B20', '#433227'][k], 0, 0.06);
    Wm.box(1.6, 0.2, 0.2, -1.1, 2.2, -RZ + 0.36, '#2F2620');
    for (const y of [0.5, 1.6]) Wm.box(1.5, 0.08, 0.05, -1.1, y, -RZ + 0.44, '#2C2A28');
    // window bars + the bright sky beyond
    for (let k = 0; k < 3; k++) Wm.box(0.06, WIN.h + 0.1, 0.06, -RX + 0.02, WIN.y, WIN.z - WIN.w / 2 + (k + 1) * (WIN.w / 4), '#1C1A18');
    // iron ring + chain on the right wall, straw along the walls, a water jar and a bowl, grain sacks by the mill
    const prng = FW.rng(2503);
    for (let i = 0; i < 70; i++) { const side = i % 3; const x = side === 0 ? -RX + 0.5 + prng() * 0.9 : side === 1 ? RX - 0.5 - prng() * 0.9 : -3 + prng() * 6; const z = side === 2 ? -RZ + 0.5 + prng() * 0.8 : -RZ + 1 + prng() * 8; Wm.box(0.02, 0.02, 0.3 + prng() * 0.25, x, 0.03, z, prng() < 0.5 ? '#A08A52' : '#8C7845', prng() * 3, 0.1); }
    Wm.add(new THREE.CylinderGeometry(0.2, 0.15, 0.55, 8), new THREE.Matrix4().makeTranslation(RX - 0.75, 0.27, -2.9), '#7E5236');
    Wm.add(new THREE.CylinderGeometry(0.18, 0.1, 0.1, 8), new THREE.Matrix4().makeTranslation(RX - 1.2, 0.05, -2.5), '#6B4A33');
    for (let k = 0; k < 3; k++) { const sg = LW.jitter(new THREE.IcosahedronGeometry(0.3, 1), 0.06, FW.rng(60 + k)); Wm.add(sg, new THREE.Matrix4().compose(new THREE.Vector3(1.9 + k * 0.5, 0.26, -2.6 - k * 0.25), new THREE.Quaternion(), new THREE.Vector3(1, 0.85, 0.9)), '#A8946E'); }
    for (let k = 0; k < 7; k++) { const tor = new THREE.TorusGeometry(0.06, 0.016, 4, 8); Wm.add(tor, new THREE.Matrix4().compose(new THREE.Vector3(RX - 0.32, 2.2 - k * 0.11, -0.8), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k % 2 ? Math.PI / 2 : 0, 0)), new THREE.Vector3(1, 1, 1)), '#4A4038', 0.02); }
    scene.add(Wm.mesh());
    winGlow = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), new THREE.MeshBasicMaterial({ color: C('#B9C9E8'), toneMapped: false, fog: false }));
    winGlow.position.set(-RX - 0.25, WIN.y, WIN.z - 0.4); winGlow.rotation.y = Math.PI / 2; scene.add(winGlow);

    // the mill: a round bed stone, the upper runner stone with its post and the pushing bar
    const Mb = Merger();
    Mb.add(LW.jitter(new THREE.CylinderGeometry(1.05, 1.12, 0.55, 12, 1), 0.04, FW.rng(91)), new THREE.Matrix4().makeTranslation(0, 0.27, 0), '#7A7064');
    Mb.add(new THREE.CylinderGeometry(1.08, 1.08, 0.06, 12), new THREE.Matrix4().makeTranslation(0, 0.56, 0), '#857B6E');
    scene.add(Mb.mesh());
    runner = new THREE.Group();
    const Mr = Merger();
    Mr.add(LW.jitter(new THREE.CylinderGeometry(0.86, 0.9, 0.42, 12, 1), 0.035, FW.rng(92)), new THREE.Matrix4().makeTranslation(0, 0.8, 0), '#8A8072');
    Mr.add(new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6), new THREE.Matrix4().makeTranslation(0, 1.25, 0), '#4E3A2A');
    Mr.add(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 6), new THREE.Matrix4().makeTranslation(0, 1.02, 0), '#3A3430');
    // the bar: from the post out along +z (the runner's local frame), through the hands at MILL_R
    Mr.box(0.14, 0.13, MILL_R + 0.45, 0, BAR_H, (MILL_R + 0.45) / 2 - 0.05, '#5C4330', 0, 0.06);
    Mr.box(0.2, 0.2, 0.2, 0, BAR_H, 0, '#3A3430');
    runner.add(Mr.mesh()); scene.add(runner);

    // light: one cold shaft through the window; a gold spot (S28 only) from the same upper left
    winSpot = new THREE.SpotLight(C('#A9BEE6'), 0, 16, 0.3, 0.45, 1.3);
    winSpot.castShadow = true; winSpot.shadow.mapSize.set(1024, 1024); winSpot.shadow.bias = -0.0006; winSpot.shadow.radius = 3;
    scene.add(winSpot, winSpot.target);
    bounce = new THREE.PointLight(C('#8FA4CC'), 0, 7, 1.6); scene.add(bounce); // light bounced off the lit floor
    goldSpot = new THREE.SpotLight(C('#FFC766'), 0, 12, 0.12, 0.6, 1.2);
    scene.add(goldSpot, goldSpot.target);
    shaft = LW.shaft([-RX - 0.3, WIN.y + 0.15, WIN.z], [-0.4, 0, 1.6], 0.42, 1.0, '#9DB4E0'); scene.add(shaft);
    warmBeam = LW.shaft([-RX - 0.3, WIN.y + 0.1, WIN.z], [0, 1.4, 2.0], 0.12, 0.3, '#FFB46A'); scene.add(warmBeam);
    goldShaft = LW.shaft([-RX - 0.3, WIN.y + 0.2, WIN.z], [0, 1.6, 2.0], 0.1, 0.42, '#FFC86E'); scene.add(goldShaft);
    pool = LW.pool(1.3, '#9DB4E0'); scene.add(pool);
    motes = LW.particles(70, '#C8D6F0', 0.03); scene.add(motes);
    goldMotes = LW.particles(40, '#FFE3B0', 0.03); scene.add(goldMotes);

    sam = makeSam(null); scene.add(sam, sam.userData.caster);
    samCU = makeSam(CROP_G); scene.add(samCU, samCU.userData.caster);
    samCUL = makeSam(CROP_L); scene.add(samCUL, samCUL.userData.caster);
    samShadow = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false, color: 0x120c08, opacity: 0.85 }));
    samShadow.rotation.x = -Math.PI / 2; samShadow.renderOrder = 2; scene.add(samShadow);
  }

  // ---------------- per frame ----------------
  const tmpV = new THREE.Vector3();
  function setCam(p, l, f, shift = 0) { FW.setCam(cam, p, l, f); cam.setViewOffset(W, H, 0, -shift * H, W, H); cam.updateMatrixWorld(); }
  const camDist = (p) => -tmpV.set(p[0], p[1], p[2]).applyMatrix4(cam.matrixWorldInverse).z;
  const K3 = (p, l, f = 38) => ({ p, l, f });

  // the mill turns with him: angle th (0 = the bar points at the camera side, +z); he walks to screen right
  function placeAtMill(th, bb) {
    runner.rotation.y = th;
    // the bar's contact point (his hands) at MILL_R; he stands HAND_X to the camera's left of it (he faces screen right)
    const right = new THREE.Vector3(); cam.getWorldDirection(right); right.cross(new THREE.Vector3(0, 1, 0)).setY(0).normalize();
    const x = Math.sin(th) * MILL_R - right.x * HAND_X, z = Math.cos(th) * MILL_R - right.z * HAND_X;
    bb.position.set(x, 0, z); samShadow.position.set(x, 0.045, z);
  }
  const millAngle = (t) => 0.12 + t * 0.085; // slow, heavy

  function samState(o) { return Object.assign({ pose: 'grind', t: 0, phase: 0, look: [0.3, 0.5], gold: 0, hair: 0, blind: true, shackles: true, strain: 0.5 }, o); }
  function show(bb, st) { for (const b of [sam, samCU, samCUL]) { b.visible = b === bb; b.userData.caster.visible = b.visible; b.userData.tilt = 0; } bb.userData.update(JSON.stringify(st), st); }

  function lightRoom(t, o) {
    // cold window light (or warm), shaft, pool on the floor where it lands
    const tgt = o.target || [-0.4, 0, 1.6];
    winSpot.position.set(-RX - 0.6, WIN.y + 0.35, WIN.z - 0.1); winSpot.target.position.set(...tgt); winSpot.target.updateMatrixWorld();
    winSpot.color.set(o.col || '#A9BEE6'); winSpot.intensity = o.I ?? 60; winSpot.angle = o.angle ?? 0.3;
    shaft.material.uniforms.amt.value = o.shaft ?? 0.5; shaft.material.uniforms.time.value = t; shaft.material.uniforms.col.value.set(o.col || '#9DB4E0');
    warmBeam.material.uniforms.amt.value = o.warm ?? 0; warmBeam.material.uniforms.time.value = t;
    goldShaft.material.uniforms.amt.value = o.goldShaft ?? 0; goldShaft.material.uniforms.time.value = t;
    pool.position.set(tgt[0], 0.05, tgt[2]); pool.material.color.set(o.col || '#9DB4E0'); pool.material.opacity = o.pool ?? 0.18;
    bounce.position.set(tgt[0], 0.25, tgt[2] + 0.4); bounce.color.set(o.col || '#8FA4CC'); bounce.intensity = o.bounce ?? 0;
    winGlow.material.color.set(o.winCol || '#B9C9E8');
    hemi.intensity = o.hemi ?? 0.32;
    goldSpot.intensity = o.gold ?? 0;
    motes.userData.update((i, v) => {
      const k = (hsh(i, 7) + t * 0.02 * (0.5 + hsh(i, 8))) % 1, along = 0.12 + hsh(i, 9) * 0.85;
      v.set(lerp(-RX, tgt[0], along) + Math.sin(t * 0.4 + i) * 0.25 * along, lerp(WIN.y, 0.2, along) + (k - 0.5) * 0.5, lerp(WIN.z, tgt[2], along) + Math.cos(t * 0.3 + i * 2) * 0.25 * along);
      return { alpha: (o.motes ?? 0.5) * (0.4 + 0.6 * hsh(i, 10)) * Math.sin(Math.PI * k), size: 0.7 + hsh(i, 11) * 0.8 };
    });
    goldMotes.userData.update((i, v) => {
      const k = (hsh(i, 17) + t * 0.03) % 1, along = 0.2 + hsh(i, 19) * 0.8, g = o.goldTgt || [0, 1.6, 2];
      v.set(lerp(-RX, g[0], along) + Math.sin(t * 0.5 + i) * 0.12, lerp(WIN.y + 0.2, g[1], along) + (k - 0.5) * 0.25, lerp(WIN.z, g[2], along) + Math.cos(t * 0.4 + i) * 0.12);
      return { alpha: (o.goldMotes ?? 0) * (0.4 + 0.6 * hsh(i, 20)) * Math.sin(Math.PI * k), size: 0.7 + hsh(i, 21) };
    });
  }

  // ---- S25 mill: wide, slow push; dark, one shaft of cold light ----
  function S25(t, shot) {
    const k = prog(t, shot.t0, shot.t1, ease.inOut);
    const A = K3([2.3, 4.4, 9.4], [-0.15, 0.75, 0.3], 40), B = K3([2.15, 4.15, 8.7], [-0.15, 0.75, 0.3], 40);
    const c = FW.camLerpK(A, B, k); setCam(c.p, c.l, c.f, 0.05);
    const th = millAngle(t - shot.t0);
    placeAtMill(th, sam);
    const ph = (t - shot.t0) * 2.4;
    sam.position.y = Math.abs(Math.sin(ph)) * 0.015;
    show(sam, samState({ t: q(t, 30), phase: q(ph, 12), hair: 0 }));
    sam.material.color.setRGB(0.78, 0.8, 0.9);
    lightRoom(t, { target: [sam.position.x + 0.35, 0, sam.position.z - 0.6], I: 90, angle: 0.34, shaft: 0.55, pool: 0.22, motes: 0.55, hemi: 0.62, bounce: 2.2 });
    return { focus: camDist([sam.position.x, 1.2, sam.position.z]), aperture: 4.5, exposure: 1.18, bloom: 0.2 };
  }

  // close-up framing helper: a fixed view direction, so the billboard's screen-right is known before placing him
  const UP = new THREE.Vector3(0, 1, 0);
  function cuRig(th, crop, fwdXZ) {
    const fwd = new THREE.Vector3(fwdXZ[0], 0, fwdXZ[1]).normalize(), right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
    const cx = Math.sin(th) * MILL_R - right.x * HAND_X, cz = Math.cos(th) * MILL_R - right.z * HAND_X;
    const hx = (crop.cx || 0) * U_M, hy = -((crop.y0 + 190) * 0 + (crop.headY ?? 0)) * U_M;
    return { fwd, right, feet: [cx, cz], head: (dy) => [cx + right.x * hx, dy, cz + right.z * hx] };
  }

  // ---- S27 hair: close-up at the mill; time-lapse: days pass in the window light, the hair begins to grow; a thin warm light ----
  function S27(t, shot) {
    const lt = t - shot.t0, k = prog(t, shot.t0, shot.t1, ease.inOut);
    const kk = prog(t, shot.t0, shot.beats.grow + 0.2, (x) => x);
    const days = 1 - Math.pow(1 - kk, 2.2);                  // the cycles slow down and settle
    const dayl = 0.5 + 0.5 * Math.cos(days * Math.PI * 2 * 3);
    const warm = prog(t, shot.t0 + 0.6, shot.beats.grow + 0.3, ease.inOut);
    const th = millAngle(2.5) + days * 0.9;                  // he keeps grinding, fast in the time-lapse
    const rig = cuRig(th, CROP_G, [-0.42, -1]);
    const hp = rig.head(HEAD_G);
    const d0 = 2.55, d1 = 2.32, dd = lerp(d0, d1, k);
    setCam([hp[0] - rig.fwd.x * dd, hp[1] + 0.1, hp[2] - rig.fwd.z * dd], [hp[0], hp[1] - 0.05, hp[2]], 34, -0.07);
    placeAtMill(th, samCU);
    const hair = 0.02 + 0.24 * ease.inOut(clamp(kk * 1.05));
    show(samCU, samState({ t: q(t, 30), hair: q(hair, 40) }));
    const col = new THREE.Color('#A9BEE6').lerp(C('#FFB878'), warm);
    const lum = lerp(0.72, 1, dayl * (1 - warm) + warm);
    samCU.material.color.setRGB(lerp(0.76, 0.95, warm) * lum, lerp(0.79, 0.88, warm) * lum, lerp(0.92, 0.8, warm) * lum);
    lightRoom(t, { target: [hp[0] - 0.1, 0.9, hp[2]], col: '#' + col.getHexString(), I: lerp(30 + 50 * dayl, 30, warm), angle: lerp(0.3, 0.13, warm), shaft: lerp(0.15 + 0.35 * dayl, 0.05, warm), warm: 0.6 * warm, pool: 0.08 * (1 - warm), motes: 0.35, winCol: '#' + new THREE.Color('#B9C9E8').lerp(C('#FFC890'), warm).getHexString() });
    void lt;
    return { focus: camDist(hp), aperture: 5.5, maxR: 8, exposure: 1.16, bloom: 0.2 };
  }

  // ---- S28 lookup: MCU, locked with a tiny drift; he lifts his face; a small gold glimmer from the upper left ----
  function S28(t, shot) {
    const lift = prog(t, shot.t0 + 0.05, shot.t0 + 0.8, ease.inOut);
    const g = prog(t, shot.beats.pray - 0.35, shot.beats.pray + 0.5, ease.inOut);
    const th = millAngle(2.5) + 0.9;
    const rig = cuRig(th, CROP_L, [-0.32, -1]);
    const hp = rig.head(HEAD_L);
    const drift = prog(t, shot.t0, shot.t1, (x) => x) * 0.06;
    setCam([hp[0] - rig.fwd.x * 2.9 - rig.right.x * (0.25 - drift), hp[1] - 0.12, hp[2] - rig.fwd.z * 2.9 - rig.right.z * (0.25 - drift)], [hp[0], hp[1] - 0.12, hp[2]], 32, -0.03);
    placeAtMill(th, samCUL);
    // he straightens from the bent grind and lifts his face (the whole figure rises out of the lean)
    samCUL.position.y = -0.06 * (1 - lift);
    show(samCUL, samState({ pose: 'lookup', t: q(t, 30), hair: 0.28, gold: q(g * 0.85, 30) }));
    samCUL.userData.tilt = -0.2 * (1 - lift);
    samCUL.material.color.setRGB(0.84 + 0.16 * g, 0.83 + 0.1 * g, 0.88 - 0.04 * g);
    const face = [hp[0], hp[1] + 0.05, hp[2]];
    goldSpot.position.set(-RX + 0.2, WIN.y + 0.6, WIN.z + 0.6); goldSpot.target.position.set(...face); goldSpot.target.updateMatrixWorld();
    lightRoom(t, { target: [hp[0] - 0.2, 0.6, hp[2]], col: '#E8B88A', I: 22, angle: 0.14, shaft: 0.04, warm: 0.4, pool: 0, motes: 0.2, gold: 30 * g, goldShaft: 0.4 * g, goldMotes: 0.8 * g, goldTgt: face, winCol: '#FFD9A0', hemi: 0.28 });
    return { focus: camDist(hp), aperture: 5.0, maxR: 8, exposure: 1.14, bloom: 0.2 + 0.06 * g, rays: { amt: 0.3 * g, target: face } };
  }

  const SHOTS = { mill: S25, hair: S27, lookup: S28 };
  SCENES.prison = {
    async build(env) { cam = env.cam; measure(); build(); },
    frame(t, shot, camera) {
      cam = camera;
      const r = (SHOTS[shot.v] || S25)(t, shot);
      const bb = [sam, samCU, samCUL].find((b) => b.visible);
      return Object.assign({ scene, sun: winSpot, bill: [bb], focus: r.focus, aperture: r.aperture, maxR: 7, fgScale: 1.4, exposure: 1.15, sat: 1.06, bloom: 0.18 }, r);
    },
  };
})();
