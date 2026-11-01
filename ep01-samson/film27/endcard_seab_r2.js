// Fourth Watch end card: the illustrated sea (treatment B), Matthew 14:24-25.
// The sea is drawn in the characters' own language: side-on wave bands at several depths (far rows small, flat and hazy at the
// horizon; mid rows choppier; one big curling wave breaking just in front of His feet). Each band is painted like the figures:
// flat colour with a soft cel gradient (navy troughs, deep teal faces, lighter translucent teal near the crests), a thin dark
// outline, crisp foam with scalloped edges and small curls, moonlit rims, spray blown right to left (the wind is against the
// boat). Each band is a card standing at its real depth, parallel to the final camera's image plane, so Jesus and the boat
// sort between the bands and the camera move keeps true parallax. Bands are drawn in final-frame screen pixels.
(function () {
  const SEAB = globalThis.SEAB = {};
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const rgba = (c, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
  const PAL = {
    ink: hex('#06111E'),
    lip: hex('#4FA9AE'),     // translucent teal at a thin crest (moonlight through the water)
    crest: hex('#246C7C'),   // lighter teal near the crests
    face: hex('#11344F'),    // the wave face
    deep: hex('#0A1B2E'),    // the trough
    haze: hex('#2D3F5C'),    // night haze toward the horizon
    foam: hex('#F2F3EE'), foamSh: hex('#9FB9CC'), foamWarm: hex('#FFF1D6'), foamWarmSh: hex('#D9B98C'),
    moon: hex('#B6D3EA'), gold: hex('#FFD58C'), goldDeep: hex('#F0A24A'),
  };
  // Catmull-Rom through points -> dense polyline
  const spline = (pts, n = 8, closed = false) => {
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t, a = P[i - 1], b = P[i], c = P[i + 1], d = P[i + 2];
      out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (-a[k] + c[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3)));
    }
    if (!closed) out.push(pts[pts.length - 1].slice());
    return out;
  };
  const poly = (pts, closed) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); if (closed) p.closePath(); return p; };

  SEAB.build = (o) => {
    const { THREE, scene, cam: CAM, OW, OH, JF, B, LAMPW, MOON_DIR, MODE, hasWordmark, WY, JY0 = 0 } = o;
    const { clamp, lerp } = FW;
    const sm = (a, b, x) => FW.smooth((x - a) / (b - a));
    const S = OH / 1920;
    const tV = Math.tan(CAM.fov / 2 * Math.PI / 180);
    const proj = (p) => LW.project(CAM, p);
    const depth = (p) => -new THREE.Vector3(...p).applyMatrix4(CAM.matrixWorldInverse).z;
    const pxM = (d) => OH / (2 * d * tV);
    const dJ = depth([JF[0], 0.9, JF[2]]), dB = depth([B[0], 0.5, B[2]]);
    const F = pxM(dJ);                                       // px per metre at His depth (the figure's scale)
    const LJ = 0.00867 * F;                                  // His outline on screen (2.6 units on the 1240 px, 2.1 m card)
    const [Xs, Ys] = proj([JF[0], JY0, JF[2]]);              // His soles
    const [Xh, Yh] = proj([B[0], 0, B[2]]);                  // the boat's waterline (hull centre)
    const hullHalf = 1.95 * pxM(dB);                         // half the hull length on screen
    const lampS = proj(LAMPW);
    const cp = CAM.position, moonS = proj([cp.x + MOON_DIR[0] * 3, cp.y + MOON_DIR[1] * 3, cp.z + MOON_DIR[2] * 3]);
    const levelY = (d) => { const v = new THREE.Vector3(0, 0, -d).applyMatrix4(CAM.matrixWorld); return proj([v.x, 0, v.z])[1]; };
    const WIDEF = OW / OH > 1.2, SQ = Math.abs(OW - OH) < 2;
    const SS = WIDEF ? 1.0 : 1.3;                             // canvas supersampling
    const MX = MODE === '' ? 0.42 : 0.12;                     // horizontal margin (the 9:16 animation pulls back)

    // ---- the bands (depth in metres along the view; amp crest-to-trough, lam wavelength; screen-pixel pins and caps) ----
    const bumpCap = (X0, X1, Y, e) => ({ X0, X1, Y, e });
    const boatCaps = (dy) => [bumpCap(Xh - hullHalf * 1.25, Xh + hullHalf * 1.3, Yh + dy * S, 60 * S)];
    const bands = [
      { id: 'hz', d: 160, amp: 0.45, lam: 9, Q: 0.8, lean: 0.2, haze: 0.8, lw: 0.34, foam: 0.62, seed: 3, speed: 1.4 },
      { id: 'f1', d: 82, amp: 0.66, lam: 7.6, Q: 0.85, lean: 0.3, haze: 0.64, lw: 0.44, foam: 0.56, seed: 7, speed: 1.4 },
      { id: 'f2', d: 46, amp: 0.8, lam: 6.8, Q: 0.88, lean: 0.4, haze: 0.5, lw: 0.54, foam: 0.52, seed: 11, speed: 1.4 },
      { id: 'b1', d: dB + 4, amp: 0.88, lam: 6.2, Q: 0.9, lean: 0.45, haze: 0.37, lw: 0.64, foam: 0.5, seed: 13, speed: 1.5 },
      { id: 'b0', d: dB - 1.7, amp: 0.86, lam: 5.8, Q: 0.9, lean: 0.5, haze: 0.28, lw: 0.7, foam: 0.5, seed: 17, speed: 1.5, boat: true,
        pins: [{ X0: Xh - hullHalf * 1.02, X1: Xh + hullHalf * 1.0, Y: Yh - 5 * S, e: 45 * S, rip: 0.04, hump: 7 * S }] },
      { id: 'm1', d: lerp(dJ, dB, 0.56), amp: 0.9, lam: 5.4, Q: 0.92, lean: 0.55, haze: 0.18, lw: 0.78, foam: 0.48, seed: 19, speed: 1.6, caps: boatCaps(10) },
      { id: 'm2', d: lerp(dJ, dB, 0.26), amp: 0.9, lam: 5.0, Q: 0.92, lean: 0.6, haze: 0.09, lw: 0.88, foam: 0.46, seed: 23, speed: 1.6, caps: boatCaps(26) },
      { id: 'jb', d: dJ + 0.7, amp: 0.72, lam: 4.6, Q: 0.92, lean: 0.6, haze: 0.03, lw: 0.95, foam: 0.5, seed: 29, speed: 1.7, feet: true,
        pins: [{ X0: Xs - 0.48 * F, X1: Xs + 0.5 * F, Y: Ys - 0.03 * F, e: 0.3 * F, rip: 0.06 }], caps: boatCaps(40) },
      { id: 'fg', d: dJ - 1.5, amp: 0.8, lam: 6.0, Q: 0.92, lean: 0.65, haze: 0, lw: 1.1, foam: 0.45, seed: 31, speed: 1.8, hero: true,
        caps: [bumpCap(Xs + 2.0 * F, OW * 2, Yh + 0.22 * F, 0.3 * F)] },
    ];
    if (hasWordmark && MODE === '') bands.push({ id: 'nr', d: Math.max(dJ - 4.3, 1.8), amp: 0.62, lam: 3.9, Q: 0.92, lean: 0.6, haze: 0, lw: 1.15, foam: 0.42, seed: 37, speed: 1.9, dark: 0.35,
      caps: [bumpCap(-OW, OW * 2, WY + 90 * S, 10)] });

    // ---- the hero wave: a big crest just right of Him, its lip curling left and breaking into foam at His feet ----
    // (metres at His depth, x right, y up, from His soles)
    const H = (dx, dy) => [Xs + dx * F, Ys - dy * F];
    const HERO = {
      top: [[-1.12, -0.33], [-0.88, -0.17], [-0.64, -0.07], [-0.4, -0.04], [-0.1, -0.045], [0.2, -0.04], [0.36, -0.032], [0.46, -0.01],
        [0.49, 0.05], [0.455, 0.14], [0.5, 0.245], [0.62, 0.33], [0.78, 0.383], [0.95, 0.4], [1.13, 0.37], [1.36, 0.25], [1.62, 0.07], [1.95, -0.12], [2.3, -0.25]],
      hollow: [[0.5, 0.135], [0.58, 0.2], [0.7, 0.235], [0.81, 0.22], [0.87, 0.14], [0.82, 0.06], [0.7, 0.02], [0.58, 0.012], [0.52, 0.04]],
    };
    const heroX0 = H(-1.12, 0)[0], heroX1 = H(2.3, 0)[0];
    for (const b of bands) if (b.hero) b.pins = [{ X0: heroX0 - 0.45 * F, X1: heroX0 + 2, Y: H(-1.12, -0.33)[1], e: 0.3 * F, rip: 0.1 }, { X0: heroX1 - 2, X1: heroX1 + 0.45 * F, Y: H(2.3, -0.26)[1], e: 0.3 * F, rip: 0.1 }];

    // ---- profile: a Gerstner row (sharp crests, broad troughs), leaning left, amplitude varying along the row ----
    const profile = (b, t) => {
      const k = 2 * Math.PI / b.lam, om = k * b.speed, s = b.s, P = [];
      const u0a = (b.Xa - OW / 2) / s - b.lam, u0b = (b.Xb - OW / 2) / s + b.lam, N = Math.ceil((u0b - u0a) / (b.lam / 60));
      for (let i = 0; i <= N; i++) {
        const u0 = u0a + (u0b - u0a) * i / N, X0 = OW / 2 + u0 * s;
        const warp = b.lam * 0.3 * (FW.noise2(u0 / b.lam * 0.8, 0.37 * b.seed, b.seed) - 0.5) * 2;
        const env = lerp(0.32, 1, FW.smooth(clamp((FW.noise2(u0 / b.lam * 0.45 + t * 0.025 * b.speed, 1.7 * b.seed, b.seed + 5) - 0.22) / 0.56, 0, 1)));
        const ph = k * (u0 + warp) + om * t + b.seed;
        let r = b.amp * env / 2, lvl = 0;
        for (const p of b.caps || []) { const w = sm(p.X0 - p.e, p.X0, X0) * (1 - sm(p.X1, p.X1 + p.e, X0)); if (w <= 0) continue;
          const yc = (b.Ylev - p.Y) / s, rc = Math.max(0.03, yc / 1.12); if (r > rc) r = lerp(r, rc, w); if (yc < 0.06) lvl = Math.min(lvl, lerp(0, yc - 0.06, w)); }
        const c = Math.cos(ph), sn = Math.sin(ph);
        let u = u0 - b.Q * (2 * r / b.amp) / k * sn - b.lean * r * Math.pow(Math.max(0, c), 5);
        let y = lvl + r * c + 0.07 * r * Math.cos(2 * ph + 1.3);
        let w = 0, yp = 0;
        for (const p of b.pins || []) { const ww = sm(p.X0 - p.e, p.X0, X0) * (1 - sm(p.X1, p.X1 + p.e, X0)); if (ww > w) { w = ww; const q2 = clamp((X0 - (p.X0 + p.X1) / 2) / ((p.X1 - p.X0) / 2), -1, 1); yp = (b.Ylev - p.Yt + (p.hump || 0) * (1 - q2 * q2)) / s + (p.rip ?? 0.12) * r * c; } }
        if (w > 0) { u = lerp(u, u0, w); y = lerp(y, yp, w); }
        P.push([OW / 2 + u * s, b.Ylev - y * s, 2 * r * s, w]);
      }
      if (b.hero) {   // splice in the hero shape
        const ht = H, wob = Math.sin(t * 1.25) * 0.008, top = spline(HERO.top.map(([x, y], i) => ht(x, y + (i > 7 && i < 17 ? wob : 0))), 10);
        const i0 = P.findIndex((p) => p[0] >= heroX0), i1 = P.findIndex((p) => p[0] > heroX1);
        P.splice(i0, i1 - i0, ...top.map(([X, Y]) => [X, Y, 0, 1]));
      }
      // crests: local minima of screen Y away from the pins
      const cr = [];
      for (let i = 2; i < P.length - 2; i++) if (P[i][1] <= P[i - 1][1] && P[i][1] < P[i + 1][1] && P[i][3] < 0.5) cr.push(i);
      return { P, cr };
    };

    // ---- build each band's card ----
    const root = new THREE.Group(); root.position.copy(CAM.position); root.quaternion.copy(CAM.quaternion); scene.add(root);
    for (const b of bands) {
      b.s = pxM(b.d); b.Ylev = levelY(b.d);
      b.Xa = -OW * MX; b.Xb = OW * (1 + MX);
      b.lwPx = Math.max(0.85 * S, LJ * b.lw);
      for (const p of b.pins || []) p.Yt = p.Y;
      let mn = 1e9, mx = -1e9;
      for (const tt of [0, 1.3, 2.6, 3.8, 5.2]) for (const p of profile(b, tt).P) { mn = Math.min(mn, p[1]); mx = Math.max(mx, p[1]); }
      b.Ytop = mn - Math.max(0.6 * b.amp * b.s, 30 * S) - 40 * S; b.Ylo = Math.min(mx + 0.9 * b.amp * b.s + 30 * S, b.Ytop + 3000);
      b.cw = Math.min(8192, Math.round((b.Xb - b.Xa) * SS)); b.ch = Math.min(4096, Math.round((b.Ylo - b.Ytop) * SS));
      b.k = b.cw / (b.Xb - b.Xa);
      b.cv = document.createElement('canvas'); b.cv.width = b.cw; b.cv.height = b.ch; b.ctx = b.cv.getContext('2d');
      const Yext = Math.max(b.Ylo + 4, OH * 1.45);
      const g = new THREE.PlaneGeometry((b.Xb - b.Xa) / b.s, (Yext - b.Ytop) / b.s), uv = g.attributes.uv, vb = 1 - (Yext - b.Ytop) / (b.Ylo - b.Ytop);
      for (let i = 0; i < uv.count; i++) if (uv.getY(i) < 0.5) uv.setY(i, vb);
      const tex = new THREE.CanvasTexture(b.cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.wrapT = THREE.ClampToEdgeWrapping;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04, depthWrite: true, fog: false, side: THREE.DoubleSide, color: new THREE.Color(1 / o.exposure, 1 / o.exposure, 1 / o.exposure) });
      const m = new THREE.Mesh(g, mat);
      m.position.set(((b.Xa + b.Xb) / 2 - OW / 2) / b.s, (OH / 2 - (b.Ytop + Yext) / 2) / b.s, -b.d);
      root.add(m); b.mesh = m; b.tex = tex;
    }
    root.updateMatrixWorld(true);

    // ---- painting ----
    const R = (seed) => FW.rng(seed);
    const along = (P, i0, i1) => { const a = []; for (let i = i0; i <= i1; i++) a.push([P[i][0], P[i][1]]); return a; };
    // foam on a crest: the crest line on top (a little puffy), a scalloped underside hanging down, a small curl at the front
    const foamCap = (x, top, o2) => {
      const n = top.length; if (n < 4) return;
      const { T, sc, lw, warm = 0, curl = 0, ph = 0, hazeK = 0 } = o2;
      const bot = top.map(([X, Y], i) => { const s = i / (n - 1), th = T * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.08)), 0.55) * (1.3 - 0.6 * s); return [X + th * 0.1, Y + th]; });
      const path = new Path2D();
      // top edge, left to right: small upward puffs
      path.moveTo(top[0][0], top[0][1]);
      const nTop = Math.max(2, Math.round(Math.abs(top[n - 1][0] - top[0][0]) / (sc * 1.4)));
      for (let j = 1; j <= nTop; j++) { const a = top[Math.round((j - 1) / nTop * (n - 1))], c = top[Math.round(j / nTop * (n - 1))];
        const mx = (a[0] + c[0]) / 2, my = (a[1] + c[1]) / 2, l = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1; path.quadraticCurveTo(mx + (c[1] - a[1]) / l * sc * 0.28, my - (c[0] - a[0]) / l * sc * 0.28, c[0], c[1]); }
      // underside, right to left: scallops hanging down
      const nB = Math.max(2, Math.round(Math.abs(bot[n - 1][0] - bot[0][0]) / sc));
      for (let j = nB; j >= 1; j--) { const a = bot[Math.round(j / nB * (n - 1))], c = bot[Math.round((j - 1) / nB * (n - 1))];
        const wob = 0.75 + 0.35 * Math.sin(j * 2.3 + ph);
        path.quadraticCurveTo((a[0] + c[0]) / 2, (a[1] + c[1]) / 2 + sc * 0.42 * wob, c[0], c[1]); }
      path.closePath();
      const yT = Math.min(...top.map((p) => p[1])), yB = Math.max(...bot.map((p) => p[1])) + sc * 0.4;
      const g = x.createLinearGradient(0, yT, 0, yB);
      const fc = mix(mix(PAL.foam, PAL.foamWarm, warm), PAL.haze, hazeK * 0.55), fs = mix(mix(PAL.foamSh, PAL.foamWarmSh, warm), PAL.haze, hazeK * 0.5);
      g.addColorStop(0, rgba(fc)); g.addColorStop(0.55, rgba(mix(fc, fs, 0.35))); g.addColorStop(1, rgba(fs));
      x.fillStyle = g; x.fill(path);
      x.lineWidth = lw * 0.8; x.strokeStyle = rgba(PAL.ink, 0.9 - hazeK * 0.5); x.lineJoin = 'round'; x.stroke(path);
      // a soft shadow line inside the foam along the underside (depth)
      if (T > 6 * S) { x.save(); x.clip(path); x.strokeStyle = rgba(fs, 0.55); x.lineWidth = T * 0.35; x.beginPath(); bot.forEach(([X, Y], i) => (i ? x.lineTo(X, Y - T * 0.05) : x.moveTo(X, Y - T * 0.05))); x.stroke(); x.restore(); }
      // the curl at the front (left): the foam lip hooks down and back under itself
      if (curl > 0) hook(x, top[0][0] + T * 0.1, top[0][1] + T * 0.3, T * 0.75 * curl, T * 0.7, lw, fc, fs, hazeK);
    };
    const hook = (x, X0, Y0, r0, w0, lw, fc, fs, hazeK = 0, turn = 1.55) => {
      const N = 30, L = [], Rr = [], cx = X0 + r0 * 0.35, cy = Y0 + r0 * 0.95;
      const c = (j) => { const th = Math.PI * 1.15 - j / N * Math.PI * turn, rr = r0 * (1 - 0.58 * j / N); return [cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]; };
      for (let j = 0; j <= N; j++) { const a = c(Math.max(0, j - 0.5)), b2 = c(Math.min(N, j + 0.5)), p = c(j), dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy) || 1, w = w0 * Math.pow(1 - j / N, 0.85) / 2 + lw * 0.25;
        L.push([p[0] - dy / l * w, p[1] + dx / l * w]); Rr.push([p[0] + dy / l * w, p[1] - dx / l * w]); }
      const path = poly([...L, ...Rr.reverse()], true), g = x.createLinearGradient(0, cy - r0, 0, cy + r0);
      g.addColorStop(0, rgba(fc)); g.addColorStop(1, rgba(mix(fc, fs, 0.7)));
      x.fillStyle = g; x.fill(path); x.lineWidth = lw * 0.8; x.strokeStyle = rgba(PAL.ink, 0.9 - hazeK * 0.5); x.lineJoin = 'round'; x.stroke(path);
    };
    const suds = (x, cx, cy, w, h, seed, lw, fc, fs) => {   // a bubbly mass of white water, outlined as one shape
      const r = R(seed), C2 = [];
      for (let j = 0; j < 22; j++) { const u = r(), v = r(); C2.push([cx + (u - 0.5) * w, cy + (v - 0.5) * h * (1 - Math.abs(u - 0.5)), lerp(0.18, 0.42, r()) * h]); }
      x.save(); x.fillStyle = rgba(PAL.ink, 0.9); for (const [X, Y, rr] of C2) { x.beginPath(); x.arc(X, Y, rr + lw * 0.8, 0, Math.PI * 2); x.fill(); }
      for (const [X, Y, rr] of C2) { const g = x.createLinearGradient(0, Y - rr, 0, Y + rr); g.addColorStop(0, rgba(fc)); g.addColorStop(1, rgba(mix(fc, fs, 0.75))); x.fillStyle = g; x.beginPath(); x.arc(X, Y, rr, 0, Math.PI * 2); x.fill(); }
      x.restore();
    };
    const droplets = (x, X, Y, A, n, seed, t, o2) => {   // spray torn off a crest and blown right to left
      const r = R(seed), { warm = 0, hazeK = 0, sz = 1 } = o2;
      for (let j = 0; j < n; j++) {
        const sp = lerp(0.5, 1.1, r()), ph = (t * sp * 0.7 + r()) % 1, L = A * lerp(0.6, 1.5, r()), lift = A * lerp(0.15, 0.55, r()), rad = lerp(0.9, 2.6, Math.pow(r(), 2)) * S * sz * (1 - 0.4 * ph);
        const px = X - ph * L, py = Y - Math.sin(ph * Math.PI * 0.8) * lift + ph * ph * A * 0.2, a = Math.sin(Math.PI * Math.min(1, ph * 1.4)) * (1 - hazeK * 0.6);
        x.fillStyle = rgba(mix(mix(PAL.foam, PAL.foamWarm, warm), PAL.haze, hazeK * 0.5), 0.88 * a);
        x.beginPath(); x.ellipse(px, py, rad * 1.25, rad, -0.25, 0, Math.PI * 2); x.fill();
      }
    };

    const paint = (b, t, st) => {
      const x = b.ctx; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, b.cw, b.ch);
      x.setTransform(b.k, 0, 0, b.k, -b.Xa * b.k, -b.Ytop * b.k);
      const { P, cr } = profile(b, t), A0 = b.amp * b.s, lw = b.lwPx, hz = b.haze;
      const body = new Path2D(); body.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) body.lineTo(P[i][0], P[i][1]);
      body.lineTo(P[P.length - 1][0], b.Ylo + 10); body.lineTo(P[0][0], b.Ylo + 10); body.closePath();
      const line = poly(P.map((p) => [p[0], p[1]]));
      // 1. the body: light teal at the crests, deep teal faces, navy troughs (atmospheric haze toward the horizon)
      const hzc = (c, k = 1) => mix(c, PAL.haze, hz * k);
      const yC = b.Ylev - A0 * 0.62, g = x.createLinearGradient(0, yC, 0, b.Ylev + A0 * 1.05);
      g.addColorStop(0, rgba(hzc(PAL.crest))); g.addColorStop(0.3, rgba(hzc(mix(PAL.crest, PAL.face, 0.55)))); g.addColorStop(0.62, rgba(hzc(PAL.face, 0.92))); g.addColorStop(1, rgba(hzc(PAL.deep, 0.85)));
      x.fillStyle = g; x.fill(body);
      x.save(); x.clip(body);
      // 2. translucency: a soft glow of lighter teal just under each tall crest, on its front (left) face
      for (const i of cr) { const [X, Y, A] = P[i], rat = A / A0; if (rat < 0.55) continue;
        const rg = x.createRadialGradient(X - A * 0.1, Y + A * 0.2, 0, X - A * 0.1, Y + A * 0.2, A * 0.55);
        rg.addColorStop(0, rgba(hzc(PAL.lip), 0.55 * (rat - 0.45))); rg.addColorStop(1, rgba(hzc(PAL.lip), 0)); x.fillStyle = rg; x.fillRect(X - A, Y - A * 0.4, A * 2, A * 1.4); }
      // 3. flow lines: echoes of the crest line down the faces (the drawn look of moving water)
      if (hz < 0.7) for (const [off, a, wv] of [[0.22, 0.2, 0.7], [0.42, 0.14, 0.6], [0.66, 0.1, 0.5]]) {
        x.strokeStyle = rgba(hzc(mix(PAL.lip, PAL.moon, 0.3)), a * (1 - hz)); x.lineWidth = lw * wv; x.lineCap = 'round';
        x.setLineDash([A0 * lerp(0.6, 1.4, off), A0 * 0.35]); x.lineDashOffset = -t * 30 * S - off * 50;
        x.beginPath(); P.forEach(([X, Y], i) => (i ? x.lineTo(X + off * A0 * 0.25, Y + A0 * off) : x.moveTo(X, Y + A0 * off))); x.stroke(); }
      x.setLineDash([]);
      // 4. rims: moonlight along the back slopes (facing the moon behind the boat), warm gold on the fronts near Him
      x.lineCap = 'round';
      for (let i = 1; i < P.length; i++) {
        const [X0, Y0] = P[i - 1], [X1, Y1] = P[i], dX = X1 - X0, dY = Y1 - Y0, l = Math.hypot(dX, dY) || 1, sl = dY / l;   // sl > 0: a right-facing back slope
        const nx = -dY / l, ny = dX / l, off = lw * 1.25;
        const moonK = sl > 0 ? Math.min(1, sl * 1.6) * (0.55 + 0.45 * Math.exp(-(((X0 - moonS[0]) / (OW * 0.35)) ** 2))) : 0;
        const goldK = (b.feet || b.hero || b.id === 'm2') && sl < 0 ? Math.min(1, -sl * 1.4) * Math.exp(-(((X0 - Xs) / (0.9 * F)) ** 2)) * st.K : 0;
        if (moonK > 0.02) { x.strokeStyle = rgba(hzc(PAL.moon, 0.6), 0.55 * moonK); x.lineWidth = lw * 0.85; x.beginPath(); x.moveTo(X0 + nx * off, Y0 + ny * off); x.lineTo(X1 + nx * off, Y1 + ny * off); x.stroke(); }
        if (goldK > 0.02) { x.strokeStyle = rgba(PAL.gold, 0.7 * goldK); x.lineWidth = lw * 1.0; x.beginPath(); x.moveTo(X0 + nx * off, Y0 + ny * off); x.lineTo(X1 + nx * off, Y1 + ny * off); x.stroke(); }
      }
      // 5. glints: the moon's path behind the boat (far rows); the lantern under the boat; His light at His feet
      { const r = R(b.seed * 97), nM = b.haze > 0.3 ? 46 : b.haze > 0.15 ? 18 : 8;
        for (let j = 0; j < nM; j++) { const X = moonS[0] + (r() - 0.5) * 2 * OW * lerp(0.08, 0.2, r()) * (1 + b.haze), yy = r(), fl = 0.5 + 0.5 * Math.sin(t * lerp(3, 7, r()) + r() * 6.3);
          const i = Math.min(P.length - 1, Math.max(0, Math.round((X - P[0][0]) / (P[P.length - 1][0] - P[0][0]) * (P.length - 1)))), Y = P[i][1] + lerp(0.12, 0.9, yy) * A0 * 0.8;
          const len = lerp(3, 12, r()) * S * (1.2 - b.haze * 0.4), a = (0.25 + 0.6 * fl * fl) * (1 - yy * 0.5) * Math.exp(-(((X - moonS[0]) / (OW * 0.16)) ** 2)) * st.env;
          x.strokeStyle = rgba(mix(PAL.moon, [235, 242, 255], 0.5), a); x.lineWidth = Math.max(0.9 * S, lw * 0.7); x.beginPath(); x.moveTo(X - len / 2, Y); x.lineTo(X + len / 2, Y); x.stroke(); } }
      if (b.id === 'b0' || b.id === 'm1') { const r = R(b.seed * 31), n = b.id === 'b0' ? 9 : 6;
        for (let j = 0; j < n; j++) { const X = lampS[0] + (r() - 0.5) * 2 * hullHalf * 0.5, i = Math.round((X - P[0][0]) / (P[P.length - 1][0] - P[0][0]) * (P.length - 1)), Y = P[Math.max(0, Math.min(P.length - 1, i))][1] + lerp(0.15, 0.7, r()) * A0;
          const fl = 0.5 + 0.5 * Math.sin(t * lerp(4, 9, r()) + r() * 6.3), len = lerp(3, 9, r()) * S;
          x.strokeStyle = rgba(PAL.gold, (0.3 + 0.55 * fl) * st.lampK * 0.8); x.lineWidth = lw * 0.75; x.beginPath(); x.moveTo(X - len / 2, Y); x.lineTo(X + len / 2, Y); x.stroke(); } }
      if (b.feet || b.hero) { const r = R(b.seed * 53), n = b.hero ? 8 : 5;
        for (let j = 0; j < n; j++) { const X = Xs + (r() - 0.35) * 1.3 * F, i = Math.round((X - P[0][0]) / (P[P.length - 1][0] - P[0][0]) * (P.length - 1)), Y = P[Math.max(0, Math.min(P.length - 1, i))][1] + lerp(0.08, 0.5, r()) * A0;
          const fl = 0.5 + 0.5 * Math.sin(t * lerp(3, 6, r()) + r() * 6.3), len = lerp(4, 11, r()) * S;
          x.strokeStyle = rgba(PAL.gold, (0.35 + 0.5 * fl) * st.K * Math.exp(-(((X - Xs) / (0.8 * F)) ** 2))); x.lineWidth = lw * 0.8; x.beginPath(); x.moveTo(X - len / 2, Y); x.lineTo(X + len / 2, Y); x.stroke(); } }
      if (b.hero) heroInside(x, b, t, st);
      x.restore();
      // 6. the outline
      x.strokeStyle = rgba(PAL.ink, 0.95 - hz * 0.55); x.lineWidth = lw; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(line);
      // 7. foam caps on the taller crests, with spray blown off to the left
      for (const i of cr) {
        const [X, Y, A] = P[i], rat = A / A0; if (rat < b.foam) continue;
        const fk = clamp((rat - b.foam) / (1 - b.foam + 0.05), 0, 1), dF = A * lerp(0.2, 0.36, fk), dBk = A * lerp(0.1, 0.2, fk);
        let iL = i, iR = i; while (iL > 1 && P[iL - 1][1] < Y + dF && X - P[iL - 1][0] < A * 0.75) iL--; while (iR < P.length - 2 && P[iR + 1][1] < Y + dBk && P[iR + 1][0] - X < A * 0.5) iR++;
        const warm = (b.feet || b.hero) ? 0.7 * st.K * Math.exp(-(((X - Xs) / (0.9 * F)) ** 2)) : 0;
        foamCap(x, along(P, iL, iR), { T: Math.max(2.5 * S, A * lerp(0.07, 0.15, fk)), sc: Math.max(4 * S, A * lerp(0.09, 0.13, fk)), lw, warm, curl: b.haze < 0.3 && fk > 0.35 ? fk : 0, ph: i + t * 2, hazeK: hz });
        if (fk > 0.3 && b.haze < 0.45) droplets(x, P[iL][0], P[iL][1], A, Math.round(lerp(3, 10, fk) * (1 - b.haze)), b.seed * 1000 + i, t, { warm, hazeK: hz, sz: b.haze > 0.2 ? 0.7 : 1 });
      }
      if (b.hero) heroFoam(x, b, t, st);
      if (b.boat) boatFoam(x, b, t, st, P);
      if (b.feet) feetFoam(x, b, t, st, P);
      // 8. haze and the warm wash of His light near His feet
      x.save(); x.globalCompositeOperation = 'source-atop';
      if (hz > 0) { x.fillStyle = rgba(PAL.haze, hz * 0.42); x.fillRect(b.Xa, b.Ytop, b.Xb - b.Xa, b.Ylo - b.Ytop); }
      if (b.dark) { const gd = x.createLinearGradient(0, b.Ylev - A0, 0, b.Ylev + A0 * 1.5); gd.addColorStop(0, rgba(PAL.deep, 0)); gd.addColorStop(1, rgba(PAL.deep, b.dark)); x.fillStyle = gd; x.fillRect(b.Xa, b.Ytop, b.Xb - b.Xa, b.Ylo - b.Ytop); }
      if (b.feet || b.hero || b.id === 'm2') { const rr = (b.hero ? 1.25 : 0.95) * F, rg = x.createRadialGradient(Xs - 0.1 * F, Ys - 0.05 * F, 0, Xs - 0.1 * F, Ys - 0.05 * F, rr);
        rg.addColorStop(0, `rgba(255,188,100,${0.2 * st.K})`); rg.addColorStop(0.5, `rgba(255,170,80,${0.08 * st.K})`); rg.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = rg; x.fillRect(Xs - rr, Ys - rr, rr * 2, rr * 2); }
      x.restore();
      b.tex.needsUpdate = true;
    };

    // the hero wave's inside: the hollow under the lip, the lip's translucent teal, foam lacing and flow lines down its face
    const heroInside = (x, b, t, st) => {
      const wob = Math.sin(t * 1.25) * 0.008, lw = b.lwPx, HW = (dx, dy) => H(dx, dy + wob);
      const hol = spline(HERO.hollow.map(([dx, dy]) => HW(dx, dy)), 10, true), holP = poly(hol, true);
      // the lip: lighter, translucent teal (the moon behind shines through it), brightest at its thin top
      const lg = x.createLinearGradient(...H(0.5, 0.42), ...H(0.92, 0.08));
      lg.addColorStop(0, rgba(PAL.lip, 0.95)); lg.addColorStop(0.4, rgba(mix(PAL.lip, PAL.crest, 0.5), 0.85)); lg.addColorStop(1, rgba(PAL.crest, 0));
      x.fillStyle = lg;
      x.fill(poly(spline([[0.455, 0.14], [0.5, 0.245], [0.62, 0.335], [0.78, 0.388], [0.95, 0.405], [1.18, 0.36], [1.0, 0.2], [0.84, 0.24], [0.68, 0.252], [0.55, 0.19]].map(([dx, dy]) => HW(dx, dy)), 8, true), true));
      // the back of the wave catches the moon: a soft lighter band below the crown
      const bg = x.createLinearGradient(...H(1.2, 0.36), ...H(1.45, 0.05));
      bg.addColorStop(0, rgba(mix(PAL.crest, PAL.moon, 0.25), 0.55)); bg.addColorStop(1, rgba(PAL.crest, 0));
      x.fillStyle = bg; x.fill(poly(spline([[0.98, 0.4], [1.2, 0.36], [1.42, 0.22], [1.66, 0.04], [1.5, -0.04], [1.25, 0.1], [1.05, 0.22]].map(([dx, dy]) => HW(dx, dy)), 8, true), true));
      // the hollow: dark, with a faint lighter water face at its back
      const hg = x.createLinearGradient(...H(0.56, 0.22), ...H(0.76, 0.02));
      hg.addColorStop(0, rgba(PAL.deep)); hg.addColorStop(0.65, rgba(mix(PAL.deep, PAL.face, 0.6))); hg.addColorStop(1, rgba(mix(PAL.face, PAL.crest, 0.45)));
      x.fillStyle = hg; x.fill(holP);
      x.save(); x.clip(holP); x.strokeStyle = rgba(PAL.lip, 0.4); x.lineWidth = lw * 1.3; x.lineCap = 'round'; x.beginPath();
      spline([[0.6, 0.035], [0.73, 0.065], [0.81, 0.13], [0.77, 0.19]].map(([dx, dy]) => HW(dx, dy)), 8).forEach(([X, Y], i) => (i ? x.lineTo(X, Y) : x.moveTo(X, Y))); x.stroke(); x.restore();
      x.strokeStyle = rgba(PAL.ink, 0.9); x.lineWidth = lw * 0.85; x.lineJoin = 'round'; x.stroke(holP);
      // foam lacing on the face: an open net of thin foam lines below the crown, thinning out down the face
      { const r = R(8080); x.lineCap = 'round'; x.lineJoin = 'round';
        for (let j = 0; j < 26; j++) {
          const cx = lerp(0.6, 1.75, r()), top = 0.34 - Math.max(0, cx - 0.98) * 0.62, cy = top - lerp(0.06, 0.42, Math.pow(r(), 0.8)), rad = lerp(0.03, 0.075, r()), n = 5 + Math.floor(r() * 3), pts = [];
          if (cx < 0.9 && cy > 0.0) continue;   // not inside the hollow
          for (let q = 0; q < n; q++) { const th = q / n * Math.PI * 2 + r() * 0.6; pts.push(HW(cx + Math.cos(th) * rad * lerp(0.7, 1.3, r()), cy + Math.sin(th) * rad * 0.55 * lerp(0.7, 1.3, r()))); }
          const fade = clamp(1 - (top - cy) / 0.5, 0, 1);
          x.strokeStyle = rgba(mix(PAL.foam, PAL.lip, 0.3), 0.38 * fade); x.lineWidth = lw * lerp(0.55, 0.9, fade); x.stroke(poly(spline(pts, 5, true), true));
        } }
      // flow lines sweeping down the big face toward the viewer
      x.lineCap = 'round';
      for (const [pts, al, w] of [[[[0.88, 0.04], [1.06, -0.13], [1.3, -0.32], [1.55, -0.58]], 0.3, 1.0], [[[1.16, 0.22], [1.34, 0.03], [1.58, -0.2], [1.88, -0.46]], 0.24, 0.9],
        [[[0.6, -0.1], [0.84, -0.25], [1.04, -0.48], [1.2, -0.74]], 0.2, 0.8], [[[1.5, 0.1], [1.74, -0.1], [2.04, -0.3], [2.34, -0.52]], 0.18, 0.8], [[[-0.6, -0.16], [-0.3, -0.24], [0.05, -0.36], [0.3, -0.6]], 0.16, 0.8]]) {
        x.strokeStyle = rgba(mix(PAL.lip, PAL.moon, 0.35), al); x.lineWidth = lw * w; x.beginPath(); spline(pts.map(([dx, dy]) => H(dx, dy)), 8).forEach(([X, Y], i) => (i ? x.lineTo(X, Y) : x.moveTo(X, Y))); x.stroke(); }
    };
    // the hero wave's foam: a crown over the crest and lip, rolling over at the tip; white water where the lip lands, at His feet
    const heroFoam = (x, b, t, st) => {
      const wob = Math.sin(t * 1.25) * 0.008, lw = b.lwPx, wk = 0.85 * st.K, HW = (dx, dy) => H(dx, dy + wob);
      const fcW = (k) => mix(PAL.foam, PAL.foamWarm, k), fsW = (k) => mix(PAL.foamSh, PAL.foamWarmSh, k);
      const crown = spline([[1.5, 0.17], [1.25, 0.33], [0.97, 0.402], [0.78, 0.386], [0.62, 0.333], [0.51, 0.25], [0.457, 0.15]].map(([dx, dy]) => HW(dx, dy)), 8).reverse();
      foamCap(x, crown, { T: 0.085 * F, sc: 0.07 * F, lw, warm: wk * 0.5, curl: 0, ph: t * 2 });
      // the lip's tip: foam rolling over and down into the hollow (a tapered curl)
      hook(x, ...HW(0.47, 0.17), 0.075 * F, 0.06 * F, lw, fcW(wk * 0.5), fsW(wk * 0.5), 0, 1.7);
      // white water where the lip lands, just right of His forward foot
      suds(x, ...H(0.53, 0.0), 0.3 * F, 0.12 * F, 4711, lw, fcW(wk * 0.8), fsW(wk * 0.6));
      // a ripple ring round His feet: its front half on this wave, broken foam lace with gaps (He stands on the water)
      { const r = R(5150);
        for (const [a0, a1] of [[0.08, 0.28], [0.36, 0.62], [0.7, 0.92]]) {
          const pts = []; for (let j = 0; j <= 14; j++) { const th = Math.PI * lerp(a0, a1, j / 14), dx = -Math.cos(th) * 0.5 + 0.02, dy = -0.045 - Math.sin(th) * 0.05; pts.push(H(dx, dy)); }
          const warm = wk; x.lineCap = 'round';
          x.strokeStyle = rgba(PAL.ink, 0.85); x.lineWidth = 0.022 * F + lw * 1.4; x.stroke(poly(pts));
          x.strokeStyle = rgba(fcW(warm)); x.lineWidth = 0.022 * F; x.stroke(poly(pts));
        }
        for (let j = 0; j < 12; j++) { const th = Math.PI * r(), dx = -Math.cos(th) * lerp(0.42, 0.62, r()), dy = -0.05 - Math.sin(th) * lerp(0.03, 0.08, r()), rad = lerp(1.0, 2.6, r()) * F / 310;
          const [X, Y] = H(dx, dy); x.fillStyle = rgba(fcW(wk), 0.8); x.beginPath(); x.arc(X, Y, rad * S / S, 0, Math.PI * 2); x.fill(); } }
      // spray torn off the crest and the lip, blown left
      droplets(x, ...HW(0.5, 0.26), 0.4 * F, 14, 991, t, { warm: wk * 0.6, sz: 1.2 * F / 310 });
      droplets(x, ...HW(0.95, 0.41), 0.55 * F, 12, 992, t, { warm: wk * 0.3, sz: 1.1 * F / 310 });
    };
    // foam along the boat's waterline, a splash at the bow (right, heading into the waves)
    const boatFoam = (x, b, t, st, P) => {
      const y0 = Yh - 5 * S, lw = b.lwPx, hzK = b.haze;
      const pts = spline([[Xh - hullHalf * 1.02, y0 + 2 * S], [Xh - hullHalf * 0.5, y0], [Xh, y0 - 1 * S], [Xh + hullHalf * 0.6, y0 - 1 * S], [Xh + hullHalf * 1.02, y0 - 3 * S]], 6);
      foamCap(x, pts, { T: 5 * S, sc: 7 * S, lw, hazeK: hzK * 0.6, ph: t * 3 });
      const bow = spline([[Xh + hullHalf * 0.86, y0 + 1 * S], [Xh + hullHalf * 0.98, y0 - 9 * S], [Xh + hullHalf * 1.1, y0 - 13 * S], [Xh + hullHalf * 1.22, y0 - 6 * S], [Xh + hullHalf * 1.3, y0 + 2 * S]], 6);
      foamCap(x, bow, { T: 7 * S, sc: 6 * S, lw, hazeK: hzK * 0.6, ph: t * 4 });
      droplets(x, Xh + hullHalf * 1.12, y0 - 12 * S, 34 * S, 10, 777, t, { hazeK: hzK * 0.6, sz: 0.9 });
    };
    // a little foam around His feet on the water behind Him
    const feetFoam = (x, b, t, st, P) => {
      const lw = b.lwPx, wk = 0.85 * st.K;
      for (const [a0, a1] of [[0.06, 0.4], [0.55, 0.94]]) {
        const pts = []; for (let j = 0; j <= 14; j++) { const th = Math.PI * lerp(a0, a1, j / 14), dx = -Math.cos(th) * 0.5 + 0.02, dy = -0.02 + Math.sin(th) * 0.045; pts.push(H(dx, dy)); }
        x.lineCap = 'round'; x.strokeStyle = rgba(PAL.ink, 0.8); x.lineWidth = 0.018 * F + lw * 1.3; x.stroke(poly(pts));
        x.strokeStyle = rgba(mix(PAL.foam, PAL.foamWarm, wk), 0.95); x.lineWidth = 0.018 * F; x.stroke(poly(pts));
      }
    };


    const update = (t, st) => { for (const b of bands) paint(b, t, st); };
    return { update, bands, info: { dJ, dB, F, LJ, Xs, Ys, Xh, Yh, hullHalf, lamp: lampS, moon: moonS, lev: bands.map((b) => [b.id, Math.round(b.Ylev), Math.round(b.s), b.cw, b.ch]) } };
  };
})();
