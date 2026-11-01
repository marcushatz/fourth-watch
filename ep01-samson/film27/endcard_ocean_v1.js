// Fourth Watch end card, final: the night sea of Galilee, Matthew 14:24-25 ("the boat ... was beaten by the waves, for the wind
// was against them"). A lit 3D surface shaded per pixel: wind-driven Gerstner chop out to the horizon (waves run right to left
// and a little toward us), crisp white foam where each crest is compressed (the Jacobian of the chop) broken up by froth noise,
// thin foam streaks along the wind, the moon's specular path, warm glints only where His light falls near His feet, the
// lantern's glints by the boat, and slight haze only at the far horizon. Navy troughs, teal translucency under the crests.
// The surface eases to His foot height round His feet and to the waterline round the hull, ringed with white water.
(function () {
  const OCEAN = globalThis.OCEAN = {};

  // a tileable noise texture: R froth (value-noise fbm), G fine streak noise
  const noiseTex = (THREE) => {
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), id = x.createImageData(N, N);
    const hash = (i, j, s) => { let h = (i * 374761393 + j * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
    const vn = (x0, y0, P, s) => { const i = Math.floor(x0), j = Math.floor(y0), fx = x0 - i, fy = y0 - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const a = hash(((i % P) + P) % P, ((j % P) + P) % P, s), b = hash((((i + 1) % P) + P) % P, ((j % P) + P) % P, s), cc = hash(((i % P) + P) % P, (((j + 1) % P) + P) % P, s), d = hash((((i + 1) % P) + P) % P, (((j + 1) % P) + P) % P, s);
      return a + (b - a) * u + (cc - a) * v + (a - b - cc + d) * u * v; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let r = 0, w = 0.5, tw = 0; for (const P of [8, 16, 32, 64]) { r += w * vn(i / N * P, j / N * P, P, 7 + P); tw += w; w *= 0.55; }
      let g = 0; w = 0.5; tw = 0; let tg = 0; for (const P of [32, 64, 128]) { g += w * vn(i / N * P, j / N * P, P, 91 + P); tg += w; w *= 0.6; }
      const k = (j * N + i) * 4; id.data[k] = r / 0.5 / (1 + 0.55 + 0.3025 + 0.166) * 255 * 0.5 + 0; id.data[k + 1] = g / tg * 255; id.data[k + 2] = 0; id.data[k + 3] = 255;
    }
    // normalise R to the full range
    let mn = 255, mx = 0; for (let p = 0; p < N * N; p++) { mn = Math.min(mn, id.data[p * 4]); mx = Math.max(mx, id.data[p * 4]); }
    for (let p = 0; p < N * N; p++) id.data[p * 4] = (id.data[p * 4] - mn) / (mx - mn) * 255;
    x.putImageData(id, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 8; return t;
  };

  OCEAN.build = (o) => {
    const { THREE, scene, CREF, az, halfW, OH, tanV } = o;
    // travel: to the left and a little toward the camera (the wind is against the boat, which heads right)
    const fwd = [Math.sin(az), -Math.cos(az)], right = [Math.cos(az), Math.sin(az)];
    const md = [-0.74 * right[0] - 0.67 * fwd[0], -0.74 * right[1] - 0.67 * fwd[1]], ml = Math.hypot(md[0], md[1]), main = Math.atan2(md[1] / ml, md[0] / ml);
    const g = 9.81, rng = FW.rng(4040);
    const mk = (lam, A, da) => { const a = main + da, k = 2 * Math.PI / lam; return { dx: Math.cos(a), dz: Math.sin(a), k, A, om: Math.sqrt(g * k) * 0.82, ph: rng() * 6.283, lam }; };
    const W = [mk(9.6, 0.2, 0.0), mk(6.7, 0.16, 0.36), mk(4.7, 0.13, -0.3), mk(3.35, 0.1, 0.62), mk(2.45, 0.084, -0.52), mk(1.78, 0.064, 0.2), mk(1.28, 0.047, -0.78), mk(0.92, 0.034, 0.85)];
    const QS = 0.94;   // total crest sharpening (sum of Q k A)
    for (const w of W) w.Q = QS / (w.k * w.A * W.length);
    const D = [mk(0.64, 0.02, 0.12), mk(0.47, 0.015, -0.62), mk(0.34, 0.011, 0.95), mk(0.25, 0.008, -0.25), mk(0.18, 0.006, 0.55), mk(0.13, 0.0042, -0.95)];

    // ---- the mesh: a polar grid fanning out from this format's camera, fine near, coarse far, to beyond the horizon ----
    const NR = 760, NC = 440, r0 = 0.55, r1 = 2600;
    const pos = new Float32Array((NR + 1) * (NC + 1) * 3), idx = new Uint32Array(NR * NC * 6);
    for (let i = 0; i <= NR; i++) { const r = r0 * Math.pow(r1 / r0, i / NR);
      for (let j = 0; j <= NC; j++) { const th = az + (j / NC - 0.5) * 2 * halfW, p = (i * (NC + 1) + j) * 3; pos[p] = CREF[0] + r * Math.sin(th); pos[p + 1] = 0; pos[p + 2] = CREF[2] - r * Math.cos(th); } }
    let q = 0; for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + 1, c = a + NC + 1, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    const V4 = (a, b, c, d) => new THREE.Vector4(a, b, c, d), V3 = (a, b, c) => new THREE.Vector3(a, b, c);
    const U = {
      uT: { value: 0 }, uFp: { value: 2 * tanV / OH },
      uW: { value: W.map((w) => V4(w.dx, w.dz, w.k, w.A)) }, uW2: { value: W.map((w) => V4(w.Q, w.om, w.ph, 0)) },
      uD: { value: D.map((w) => V4(w.dx, w.dz, w.k, w.A)) }, uD2: { value: D.map((w) => V4(w.om, w.ph, 0, 0)) },
      uJ: { value: V4(0, 0, 0, 0.62) }, uB: { value: V4(0, 0, 0, 0) }, uBax: { value: V4(1, 0, 1.95, 0.62) },
      uMoon: { value: V3(0, 0.2, -1) }, uBeam: { value: V3(-0.3, 0.8, -0.3) }, uLamp: { value: V4(0, 1.5, 0, 0) },
      uK: { value: 0 }, uEnv: { value: 1 }, uWind: { value: new THREE.Vector2(md[0] / ml, md[1] / ml) },
      uNoise: { value: noiseTex(THREE) },
      uDeep: { value: V3(0.0036, 0.0105, 0.0225) }, uTeal: { value: V3(0.016, 0.092, 0.105) }, uSkyHor: { value: V3(0.034, 0.048, 0.078) }, uSkyTop: { value: V3(0.006, 0.01, 0.022) },
      uMoonCol: { value: V3(0.78, 0.86, 1.0) }, uGold: { value: V3(1.0, 0.7, 0.36) }, uFoam: { value: V3(0.6, 0.66, 0.72) }, uFoamWarm: { value: V3(1.0, 0.86, 0.62) }, uHaze: { value: V3(0.05, 0.065, 0.1) },
    };
    const COMMON = `
      uniform float uT, uFp; uniform vec4 uW[8]; uniform vec4 uW2[8]; uniform vec4 uJ; uniform vec4 uB; uniform vec4 uBax;
      float fadeLam(float lam, float dist){ float fp = dist * uFp; return smoothstep(2.5 * fp, 5.0 * fp, lam); }
      // calm patches: round His feet, and the hull's footprint (an ellipse along the card)
      float calmJ(vec2 p){ vec2 d = p - uJ.xy; return exp(-dot(d, d) / (uJ.w * uJ.w)); }
      float hullE(vec2 p){ vec2 d = p - uB.xy; vec2 e = vec2(dot(d, uBax.xy) / uBax.z, dot(d, vec2(-uBax.y, uBax.x)) / uBax.w); return length(e); }
      float calmB(vec2 p){ float e = hullE(p); return exp(-pow(e, 3.0) * 0.9); }`;
    const vs = `${COMMON}
      varying vec2 vP0; varying vec3 vWp;
      void main(){
        vec2 p = position.xz; float dist = length(p - cameraPosition.xz);
        vec3 d = vec3(0.0);
        for (int i = 0; i < 8; i++){ vec4 w = uW[i]; vec4 w2 = uW2[i]; float f = fadeLam(6.2832 / w.z, dist);
          float th = w.z * dot(w.xy, p) - w2.y * uT + w2.z; float c = cos(th), s = sin(th);
          d.x += w2.x * w.w * w.x * c * f; d.z += w2.x * w.w * w.y * c * f; d.y += w.w * s * f; }
        float cj = calmJ(p), cb = calmB(p), cm = max(cj, cb), ht = cj > cb ? uJ.z : uB.z;
        d.y = mix(d.y, ht, cm); d.xz *= 1.0 - cm;
        vec3 wp = vec3(p.x + d.x, d.y, p.y + d.z);
        vP0 = p; vWp = wp;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
      }`;
    const fs = `${COMMON}
      uniform vec4 uD[6]; uniform vec4 uD2[6]; uniform vec3 uMoon, uBeam, uMoonCol, uGold, uFoam, uFoamWarm, uHaze, uDeep, uTeal, uSkyHor, uSkyTop; uniform vec4 uLamp;
      uniform float uK, uEnv; uniform vec2 uWind; uniform sampler2D uNoise;
      varying vec2 vP0; varying vec3 vWp;
      void main(){
        vec2 p = vP0; float dist = length(vWp - cameraPosition);
        vec3 dX = vec3(1.0, 0.0, 0.0), dZ = vec3(0.0, 0.0, 1.0); float h = 0.0;
        for (int i = 0; i < 8; i++){ vec4 w = uW[i]; vec4 w2 = uW2[i]; float f = fadeLam(6.2832 / w.z, dist);
          float th = w.z * dot(w.xy, p) - w2.y * uT + w2.z; float c = cos(th), s = sin(th);
          float qa = w2.x * w.w * w.z * s * f, ka = w.z * w.w * c * f;
          dX += vec3(-qa * w.x * w.x, ka * w.x, -qa * w.x * w.y); dZ += vec3(-qa * w.x * w.y, ka * w.y, -qa * w.y * w.y); h += w.w * s * f; }
        for (int i = 0; i < 6; i++){ vec4 w = uD[i]; float f = fadeLam(6.2832 / w.z, dist); float th = w.z * dot(w.xy, p) - uD2[i].x * uT + uD2[i].y; float ka = w.z * w.w * cos(th) * f;
          dX.y += ka * w.x; dZ.y += ka * w.y; }
        float J = dX.x * dZ.z - dX.z * dZ.x;
        vec3 N = normalize(cross(dZ, dX));
        float cj = calmJ(p), cb = calmB(p), cm = max(cj, cb);
        N = normalize(mix(N, vec3(0.0, 1.0, 0.0), cm * 0.45)); J = mix(J, 1.0, cm); h = mix(h, cj > cb ? uJ.z : uB.z, cm);
        vec3 V = normalize(cameraPosition - vWp);
        float NV = max(dot(N, V), 0.0), F = 0.02 + 0.98 * pow(1.0 - NV, 5.0);
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        // the sky in the water: dark, a little lighter toward the horizon; the moon's path
        float mc = max(dot(R, uMoon), 0.0);
        vec3 refl = mix(uSkyHor, uSkyTop, smoothstep(0.0, 0.3, R.y)) * uEnv + uMoonCol * (pow(mc, 1800.0) * 8.0 * (0.35 + 0.65 * smoothstep(3.0, 12.0, dist)) + pow(mc, 260.0) * 0.22 * smoothstep(4.0, 14.0, dist) + pow(mc, 60.0) * 0.1 * smoothstep(12.0, 45.0, dist)) * uEnv;
        // the body: navy troughs, teal translucency where the water rises thin under a crest (backlit by the moon)
        float hn = clamp(h / 0.42, -1.0, 1.0);
        float sss = smoothstep(-0.05, 0.85, hn) * (0.45 + 0.55 * clamp(1.0 - N.y * 0.9, 0.0, 1.0));
        vec3 col = uDeep * (0.75 + 0.25 * N.y) + uTeal * sss * 0.85 * uEnv + uMoonCol * 0.012 * max(dot(N, uMoon), 0.0) * uEnv;
        col = mix(col, refl, F);
        // His light: warm glints and a warm wash on the water near His feet only
        float dj = length(vWp.xz - uJ.xy), gm = exp(-dj * dj / 1.15) * uK;
        vec3 Hg = normalize(uBeam + V); float gsp = pow(max(dot(N, Hg), 0.0), 200.0);
        float gsp2 = pow(max(dot(N, Hg), 0.0), 700.0);
        col += uGold * (gsp2 * 4.5 + gsp * 0.6 + 0.05 * (0.5 + 0.5 * max(dot(N, uBeam), 0.0))) * gm;
        // the lantern's glints round the boat
        vec3 Ll = normalize(uLamp.xyz - vWp); float dl = length(vWp.xz - uLamp.xz), lm = exp(-dl * dl / 7.0) * uLamp.w;
        col += vec3(1.0, 0.62, 0.28) * (pow(max(dot(N, normalize(Ll + V)), 0.0), 300.0) * 2.2 + 0.02) * lm;
        // foam: crisp white where each crest is squeezed, broken up by froth; thin streaks along the wind
        vec2 qf = p - uWind * uT * 0.35;
        float n1 = texture2D(uNoise, qf * 0.31).r, n2 = texture2D(uNoise, qf * 1.13 + 0.37).r, n3 = texture2D(uNoise, qf * 3.3 + 0.71).r;
        float nb = n1 * 0.45 + n2 * 0.35 + n3 * 0.2;
        float crest = clamp((0.82 - J) / 0.5, 0.0, 1.0) * (0.5 + 0.5 * smoothstep(-0.05, 0.28, h)) + smoothstep(0.2, 0.45, h) * 0.18;
        float fv = crest * 1.35 - (1.0 - nb) * 0.95;
        float aa = fwidth(fv) * 0.8 + 0.015;
        float cover = smoothstep(-aa, aa, fv), core = clamp(fv * 2.2, 0.0, 1.0);
        // froth: solid at the crest's core, breaking into lace and bubbles toward its edges
        float l1 = texture2D(uNoise, qf * 6.1 + 0.53).r, l2 = texture2D(uNoise, qf * 13.7 + 0.19).r, lace = l1 * 0.6 + l2 * 0.4;
        float la = fwidth(lace) + 0.02, th = 0.64 - core * 0.42;
        float holes = smoothstep(0.3, 0.42, texture2D(uNoise, qf * 2.3 + 0.81).r + core * 0.25);
        float foam = cover * smoothstep(th - la, th + la, lace) * holes;
        vec2 sq = vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x))) - vec2(uT * 0.35, 0.0);
        float stn = texture2D(uNoise, vec2(sq.x * 0.075, sq.y * 0.55) + 0.13).g * 0.65 + n2 * 0.35;
        float sa = fwidth(stn) + 0.01;
        float streak = smoothstep(0.72 - sa, 0.72 + sa, stn) * (1.0 - foam) * smoothstep(-0.3, 0.05, h) * smoothstep(60.0, 15.0, dist);
        // white water at His ankles and along the hull's waterline (bow to the right, into the waves)
        float ring = exp(-pow((dj - 0.33) / 0.11, 2.0)) + 0.6 * exp(-pow((dj - 0.55) / 0.08, 2.0)) * smoothstep(0.0, 0.3, dot(vWp.xz - uJ.xy, -uWind) / max(dj, 0.01));
        vec2 rq = vWp.xz - uJ.xy; float pn = texture2D(uNoise, vec2(atan(rq.y, rq.x) * 0.48 + 0.5, dj * 1.9 - uT * 0.3)).r;
        float fJ = smoothstep(0.0, 0.06, ring * (0.15 + 1.25 * pn) * (0.6 + 0.6 * lace) - 0.6) * uEnv;
        float e = hullE(p), along = dot(p - uB.xy, uBax.xy) / uBax.z;
        float fB = smoothstep(0.0, 0.05, (smoothstep(1.45, 1.0, e) * smoothstep(0.82, 0.98, e)) * (0.6 + 0.8 * nb) * (0.7 + 0.5 * smoothstep(0.2, 1.0, along)) - 0.42);
        foam = max(foam, max(fJ, fB));
        vec3 fc = uFoam * (0.5 + 0.38 * clamp(N.y, 0.0, 1.0) + 0.22 * lace) * (0.55 + 0.45 * uEnv) * (0.82 + 0.18 * core);
        fc = mix(fc, uFoamWarm * 1.15, clamp(gm * 0.9, 0.0, 1.0));
        fc += uMoonCol * 0.08 * pow(max(dot(N, uMoon), 0.0), 2.0);
        col = mix(col, fc, foam * smoothstep(1400.0, 300.0, dist)) + fc * streak * 0.24;
        // slight haze at the far horizon only
        col = mix(col, uHaze * uEnv, smoothstep(120.0, 1500.0, dist) * 0.9);
        gl_FragColor = vec4(col, 1.0);
        #ifdef DBG
        gl_FragColor = vec4(fract(dist * 0.5), fract(dist * 0.05), foam, 1.0);
        #endif
      }`;
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: vs, fragmentShader: fs, side: THREE.DoubleSide, defines: new URLSearchParams(location.search).get('dbg') ? { DBG: 1 } : {} });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; scene.add(mesh);

    // ---- the same surface on the CPU (heights, crest compression) for Him, the boat and the spray ----
    const calm = { J: [0, 0, 0, 0.62], B: [0, 0, 0], ax: [1, 0, 1.95, 0.62] };
    const disp = (x0, z0, t) => { let dx = 0, dz = 0, y = 0, jxx = 1, jzz = 1, jxz = 0;
      for (const w of W) { const th = w.k * (w.dx * x0 + w.dz * z0) - w.om * t + w.ph, c = Math.cos(th), s = Math.sin(th);
        dx += w.Q * w.A * w.dx * c; dz += w.Q * w.A * w.dz * c; y += w.A * s; const qa = w.Q * w.A * w.k * s; jxx -= qa * w.dx * w.dx; jzz -= qa * w.dz * w.dz; jxz -= qa * w.dx * w.dz; }
      return [dx, y, dz, jxx * jzz - jxz * jxz]; };
    const raw = (x, z, t) => { let x0 = x, z0 = z, d; for (let it = 0; it < 4; it++) { d = disp(x0, z0, t); x0 = x - d[0]; z0 = z - d[2]; } return disp(x0, z0, t); };
    const calmAt = (x, z) => { const dJx = x - calm.J[0], dJz = z - calm.J[1], cj = Math.exp(-(dJx * dJx + dJz * dJz) / (calm.J[3] ** 2));
      const bx = x - calm.B[0], bz = z - calm.B[1], ex = (bx * calm.ax[0] + bz * calm.ax[1]) / calm.ax[2], ez = (-bx * calm.ax[1] + bz * calm.ax[0]) / calm.ax[3], cb = Math.exp(-Math.pow(Math.hypot(ex, ez), 3) * 0.9);
      return cj > cb ? [cj, calm.J[2]] : [cb, calm.B[2]]; };
    const heightAt = (x, z, t, withCalm = true) => { const h = raw(x, z, t)[1]; if (!withCalm) return h; const [c, hc] = calmAt(x, z); return h + (hc - h) * c; };
    const crestAt = (x, z, t) => raw(x, z, t)[3];

    const update = (t, st) => {
      U.uT.value = t; U.uK.value = st.K; U.uEnv.value = st.env;
      calm.J = [st.J[0], st.J[2], st.jy, 0.46]; U.uJ.value.set(st.J[0], st.J[2], st.jy, 0.46);
      calm.B = [st.B[0], st.B[2], st.by]; U.uB.value.set(st.B[0], st.B[2], st.by, 0);
      calm.ax = [st.bax[0], st.bax[1], 1.95, 0.62]; U.uBax.value.set(st.bax[0], st.bax[1], 1.95, 0.62);
      U.uMoon.value.set(...st.moon).normalize(); U.uBeam.value.set(...st.beam).normalize(); U.uLamp.value.set(st.lamp[0], st.lamp[1], st.lamp[2], st.lampK);
    };
    return { mesh, update, heightAt, crestAt, W, wind: [md[0] / ml, md[1] / ml] };
  };
})();
