// Fourth Watch prop library: sky, stars, terrain, buildings, trees, rocks, light shafts, dust, glows.
// Low-poly and flat-shaded on purpose: a carved-diorama look, never photoreal.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW, P = FW.PAL;
  const M = (c, o) => FW.mat(c, o);

  // ---------- canvas textures ----------
  FW.radialTex = (() => {
    let tex = null;
    return () => {
      if (tex) return tex;
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
    };
  })();
  FW.canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };

  // ---------- sky dome with a 3-stop gradient + sun/moon glow ----------
  FW.sky = () => {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(P.deepBlue) }, mid: { value: new THREE.Color(P.blueHour) }, bot: { value: new THREE.Color(P.dusk) }, hz: { value: 0.0 },
        glowDir: { value: new THREE.Vector3(-0.6, 0.15, -0.8).normalize() }, glowCol: { value: new THREE.Color('#000000') }, glowPow: { value: 6.0 } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform float hz; uniform vec3 glowDir; uniform vec3 glowCol; uniform float glowPow; varying vec3 vP;
        void main(){ float y = vP.y - hz; vec3 c = y > 0.0 ? mix(mid, top, smoothstep(0.0, 0.55, y)) : mix(mid, bot, smoothstep(0.0, 0.25, -y));
          float g = pow(max(dot(normalize(vP), glowDir), 0.0), glowPow); c += glowCol * g; gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(220, 32, 20), mat);
    m.renderOrder = -10;
    m.set = (o) => { for (const k of Object.keys(o)) { const u = mat.uniforms[k]; if (!u) continue; if (u.value && u.value.isColor) u.value.set(o[k]); else if (u.value && u.value.isVector3) u.value.set(...o[k]).normalize(); else u.value = o[k]; } };
    return m;
  };

  FW.stars = (n = 900, seed = 7) => {
    const R = FW.rng(seed), pos = [], col = [];
    for (let i = 0; i < n; i++) {
      const u = R(), v = R() * 0.95 + 0.05, th = u * Math.PI * 2, ph = Math.acos(v);
      const r = 200; pos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th));
      const w = 0.55 + 0.45 * R(), warm = R() < 0.25; col.push(w, w * (warm ? 0.92 : 0.97), w * (warm ? 0.8 : 1.0));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
    const p = new THREE.Points(g, mat); p.renderOrder = -9;
    return p;
  };

  FW.glowSprite = (color, size, opacity = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: FW.radialTex(), color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    s.scale.set(size, size, 1);
    return s;
  };

  FW.moon = () => {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#F4E9D0'), fog: false }));
    g.add(disc); const halo = FW.glowSprite('#9FB2D6', 40, 0.35); g.add(halo);
    return g;
  };

  // ---------- terrain ----------
  // fn(x, z) -> height (optional); flat: radius around (cx,cz) kept level for staging
  FW.terrain = ({ size = 120, seg = 70, height = 6, seed = 3, scale = 0.035, flat = null, low = P.sand, high = P.sandLight, dark = P.clay, fn = null, offset = [0, 0, 0] } = {}) => {
    const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, cl = new THREE.Color(low), ch = new THREE.Color(high), cd = new THREE.Color(dark);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + offset[0], z = pos.getZ(i) + offset[2];
      let h = fn ? fn(x, z) : (FW.fbm(x * scale + 10, z * scale + 10, seed) - 0.45) * height * 2;
      if (flat) { const d = Math.hypot(x - flat[0], z - flat[1]); const k = FW.smooth((d - flat[2]) / (flat[3] || 6)); h = FW.lerp(flat[4] || 0, h, k); }
      pos.setY(i, h);
    }
    const ng = g.toNonIndexed(); ng.computeVertexNormals();
    const p2 = ng.attributes.position, cols = [];
    for (let i = 0; i < p2.count; i += 3) {
      const y = (p2.getY(i) + p2.getY(i + 1) + p2.getY(i + 2)) / 3, x = p2.getX(i), z = p2.getZ(i);
      const n = FW.noise2(x * 0.3, z * 0.3, seed + 5);
      const k = FW.clamp((y / (height + 0.01)) * 0.5 + 0.5 + (n - 0.5) * 0.35);
      const c = cl.clone().lerp(ch, k).lerp(cd, FW.clamp(0.25 - k) * 1.2);
      for (let j = 0; j < 3; j++) cols.push(c.r, c.g, c.b);
    }
    ng.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.Mesh(ng, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
    m.receiveShadow = true;
    m.position.set(offset[0] ? 0 : 0, offset[1], 0);
    m.heightAt = (x, z) => {
      let h = fn ? fn(x, z) : (FW.fbm(x * scale + 10, z * scale + 10, seed) - 0.45) * height * 2;
      if (flat) { const d = Math.hypot(x - flat[0], z - flat[1]); const k = FW.smooth((d - flat[2]) / (flat[3] || 6)); h = FW.lerp(flat[4] || 0, h, k); }
      return h + offset[1];
    };
    return m;
  };

  // ---------- buildings ----------
  FW.house = ({ w = 3, d = 3, h = 2.4, color = P.mud, seed = 1, door = true, stair = false, lit = 0 } = {}) => {
    const R = FW.rng(seed), g = new THREE.Group();
    const c = new THREE.Color(color).offsetHSL(0, (R() - 0.5) * 0.06, (R() - 0.5) * 0.08);
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M('#' + c.getHexString()));
    body.position.y = h / 2; body.castShadow = body.receiveShadow = true; g.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, 0.18, d + 0.16), M('#' + c.clone().offsetHSL(0, 0, -0.06).getHexString()));
    roof.position.y = h + 0.09; roof.castShadow = true; g.add(roof);
    // parapet
    const pm = M('#' + c.clone().offsetHSL(0, 0, 0.03).getHexString());
    for (const [px, pz, sx, sz] of [[0, d / 2 + 0.03, w + 0.16, 0.1], [0, -d / 2 - 0.03, w + 0.16, 0.1], [w / 2 + 0.03, 0, 0.1, d + 0.16], [-w / 2 - 0.03, 0, 0.1, d + 0.16]]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.28, sz), pm); p.position.set(px, h + 0.3, pz); g.add(p);
    }
    // roof beams poking out
    const wm = M(P.wood);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.3), wm); b.position.set(-w / 3 + (i * w) / 3, h - 0.18, d / 2 + 0.12); g.add(b); }
    const dark = M('#1A120C', { roughness: 1 });
    if (door) { const dr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.2, 0.06), lit ? FW.glow('#E89A4A', 0.85 * lit, { blending: THREE.NormalBlending }) : dark); dr.position.set(w * (R() * 0.4 - 0.2), 0.6, d / 2 + 0.01); g.add(dr); }
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.06), lit ? FW.glow('#F0B060', 0.9 * lit, { blending: THREE.NormalBlending }) : dark);
    win.position.set(w * 0.28, h * 0.68, d / 2 + 0.01); g.add(win);
    if (stair) {
      const sm = M('#' + c.clone().offsetHSL(0, 0, -0.03).getHexString());
      for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, (h / 6) * (i + 1), 0.42), sm); s.position.set(w / 2 + 0.25, ((h / 6) * (i + 1)) / 2, d / 2 - 0.3 - i * 0.42); s.castShadow = true; g.add(s); }
    }
    return g;
  };

  FW.town = ({ n = 12, radius = 7, seed = 4, color = P.mud, lit = 0, heightAt = null, wall = false } = {}) => {
    const R = FW.rng(seed), g = new THREE.Group(), placed = [];
    for (let i = 0; i < n * 4 && placed.length < n; i++) {
      const a = R() * Math.PI * 2, r = Math.sqrt(R()) * radius, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const w = 1.6 + R() * 1.6, d = 1.6 + R() * 1.4;
      if (placed.some((p) => Math.abs(p[0] - x) < (p[2] + w) / 2 + 0.25 && Math.abs(p[1] - z) < (p[3] + d) / 2 + 0.25)) continue;
      placed.push([x, z, w, d]);
      const hs = FW.house({ w, d, h: 1.6 + R() * 1.4, color, seed: seed * 100 + i, stair: R() < 0.3, lit: lit && R() < 0.6 ? lit : 0 });
      hs.position.set(x, heightAt ? heightAt(x, z) : 0, z); hs.rotation.y = Math.round(R() * 3) * (Math.PI / 2) + (R() - 0.5) * 0.15;
      g.add(hs);
    }
    if (wall) {
      const wm = M(P.stone), segs = 28;
      for (let i = 0; i < segs; i++) {
        const a = (i / segs) * Math.PI * 2, x = Math.cos(a) * (radius + 2), z = Math.sin(a) * (radius + 2);
        const s = new THREE.Mesh(new THREE.BoxGeometry(((radius + 2) * 2 * Math.PI) / segs + 0.05, 1.6, 0.5), wm);
        s.position.set(x, (heightAt ? heightAt(x, z) : 0) + 0.8, z); s.rotation.y = -a + Math.PI / 2; s.castShadow = true; g.add(s);
      }
    }
    return g;
  };

  // ---------- vegetation and rocks ----------
  FW.palm = (seed = 1, h = 4.5) => {
    const R = FW.rng(seed), g = new THREE.Group(), tm = M('#6B5038'), lm = M(P.palm);
    const segs = 6, bend = (R() - 0.5) * 0.5;
    let y = 0, x = 0;
    for (let i = 0; i < segs; i++) {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.13 - i * 0.012, 0.16 - i * 0.012, h / segs, 6), tm);
      x += bend * 0.12 * i; s.position.set(x, y + h / segs / 2, 0); s.rotation.z = -bend * 0.2; s.castShadow = true; g.add(s); y += h / segs;
    }
    for (let i = 0; i < 8; i++) {
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.3, 4, 1), lm);
      f.geometry.translate(0, 1.15, 0); f.scale.set(1, 1, 0.25);
      f.position.set(x, y, 0); f.rotation.set(0, (i / 8) * Math.PI * 2 + R() * 0.3, 0); f.rotateZ(Math.PI / 2 - 0.35 - R() * 0.35); f.castShadow = true; g.add(f);
    }
    return g;
  };
  FW.olive = (seed = 1, s = 1) => {
    const R = FW.rng(seed), g = new THREE.Group();
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 1.3 * s, 6), M('#5A4430')); tr.position.y = 0.65 * s; tr.rotation.z = (R() - 0.5) * 0.3; tr.castShadow = true; g.add(tr);
    for (let i = 0; i < 3; i++) {
      const c = new THREE.Mesh(new THREE.IcosahedronGeometry((0.7 + R() * 0.35) * s, 0), M(i % 2 ? P.olive : P.oliveDark));
      c.position.set((R() - 0.5) * 0.9 * s, (1.5 + R() * 0.5) * s, (R() - 0.5) * 0.9 * s); c.scale.y = 0.75; c.castShadow = true; g.add(c);
    }
    return g;
  };
  FW.rock = (seed = 1, s = 1, color = P.stone) => {
    const R = FW.rng(seed);
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), M(color));
    m.scale.set(1 + R() * 0.6, 0.55 + R() * 0.5, 1 + R() * 0.5); m.rotation.set(R() * 3, R() * 3, R() * 3); m.castShadow = m.receiveShadow = true;
    return m;
  };
  FW.vineRow = (len = 8, seed = 1) => {
    const g = new THREE.Group(), R = FW.rng(seed), sm = M(P.wood), lm = M('#4D5A33'), lm2 = M('#5E6B3A');
    for (let i = 0; i <= len; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.0, 0.07), sm); st.position.set(i, 0.5, 0); g.add(st);
      if (i < len) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), R() < 0.5 ? lm : lm2); b.position.set(i + 0.5, 0.75, 0); b.scale.set(1.4, 0.8, 0.8); b.castShadow = true; g.add(b); }
    }
    return g;
  };

  // ---------- architecture ----------
  FW.pillar = ({ h = 5, r = 0.42, color = P.stone, drums = 1 } = {}) => {
    const g = new THREE.Group(), m = M(color), mc = M('#' + new THREE.Color(color).offsetHSL(0, 0, -0.06).getHexString());
    const base = new THREE.Mesh(new THREE.BoxGeometry(r * 2.6, 0.3, r * 2.6), mc); base.position.y = 0.15; base.castShadow = base.receiveShadow = true; g.add(base);
    const dh = (h - 0.7) / drums; g.drums = [];
    for (let i = 0; i < drums; i++) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(r * (1 - i * 0.02), r * (1.02 - i * 0.02), dh - 0.02, 10), m);
      d.position.y = 0.3 + dh * i + dh / 2; d.castShadow = d.receiveShadow = true; g.add(d); g.drums.push(d);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(r * 2.8, 0.4, r * 2.8), mc); cap.position.y = h - 0.2; cap.castShadow = true; g.add(cap); g.cap = cap;
    return g;
  };

  FW.banner = ({ w = 1.1, h = 1.8, color = P.ember, seed = 1, pole = 3.4 } = {}) => {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, pole, 5), M(P.wood)); p.position.y = pole / 2; p.castShadow = true; g.add(p);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), M('#B08A4A', { metalness: 0.3, roughness: 0.6 })); top.position.y = pole + 0.1; g.add(top);
    const tex = FW.canvasTex(128, 192, (x, W, H) => {
      x.fillStyle = color; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, 0, W, 14); x.fillRect(0, H - 22, W, 22);
      // a stylized feather-crown emblem (Philistine headdress motif), not a real flag
      x.strokeStyle = '#E8C690'; x.lineWidth = 6; x.fillStyle = '#E8C690';
      x.beginPath(); x.arc(W / 2, H * 0.58, 26, Math.PI, 0); x.stroke();
      for (let i = -3; i <= 3; i++) { x.save(); x.translate(W / 2 + i * 8, H * 0.5); x.rotate(i * 0.12); x.fillRect(-2.5, -34, 5, 34); x.restore(); }
      for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(i * W / 5, H); x.lineTo(i * W / 5 + W / 10, H - 16); x.lineTo((i + 1) * W / 5, H); x.fill(); }
    });
    const geo = new THREE.PlaneGeometry(w, h, 6, 8);
    const cloth = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.95, flatShading: true }));
    cloth.position.set(w / 2 + 0.05, pole - h / 2 - 0.15, 0); cloth.castShadow = true; g.add(cloth);
    const base = geo.attributes.position.array.slice();
    g.wave = (t) => {
      const a = geo.attributes.position;
      for (let i = 0; i < a.count; i++) { const x0 = base[i * 3], y0 = base[i * 3 + 1]; const k = (x0 + w / 2) / w; a.setZ(i, Math.sin(t * 2.2 + x0 * 3.2 + y0 * 0.8 + seed) * 0.12 * k); }
      a.needsUpdate = true; geo.computeVertexNormals();
    };
    g.wave(0);
    return g;
  };

  // ---------- light: shafts, dust, glows ----------
  // a soft volumetric shaft from `from` toward `to`, radius r0 at the top, r1 at the bottom
  FW.shaft = ({ from = [-4, 12, -2], to = [0, 0, 0], r0 = 0.4, r1 = 2.4, color = '#FFE2A8', opacity = 0.25, rays = 9 } = {}) => {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
    const geo = new THREE.CylinderGeometry(r0, r1, len, 48, 1, true); geo.translate(0, -len / 2, 0);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: { col: { value: new THREE.Color(color) }, op: { value: opacity }, time: { value: 0 }, rays: { value: rays } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform vec3 col; uniform float op; uniform float time; uniform float rays; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ float e = pow(abs(dot(vN, vV)), 3.2);
          float along = smoothstep(0.0, 0.12, vUv.y) * (0.45 + 0.55 * vUv.y);
          float s = 0.62 + 0.38 * sin(vUv.x * 6.2831 * rays + time * 0.35) * sin(vUv.x * 6.2831 * (rays * 0.37) - time * 0.2);
          gl_FragColor = vec4(col * e * along * s * op, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...from);
    const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    m.setOpacity = (o, t = 0) => { mat.uniforms.op.value = o; mat.uniforms.time.value = t; m.visible = o > 0.002; };
    m.setColor = (c) => mat.uniforms.col.value.set(c);
    return m;
  };

  // dust specks drifting in a box; update(t) moves them deterministically
  FW.dust = ({ n = 70, box = [6, 6, 6], center = [0, 2, 0], color = '#F5D9A0', size = 3, seed = 9, opacity = 0.7 } = {}) => {
    const R = FW.rng(seed), base = [], vel = [], pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { base.push([R() * box[0], R() * box[1], R() * box[2]]); vel.push([(R() - 0.5) * 0.12, 0.02 + R() * 0.08, (R() - 0.5) * 0.1, R() * 6.28]); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size, sizeAttenuation: false, color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, map: FW.radialTex() });
    const p = new THREE.Points(g, mat);
    p.update = (t) => {
      for (let i = 0; i < n; i++) {
        const b = base[i], v = vel[i];
        const wrap = (a, L) => ((a % L) + L) % L;
        pos[i * 3] = center[0] - box[0] / 2 + wrap(b[0] + v[0] * t + 0.15 * Math.sin(t * 0.7 + v[3]), box[0]);
        pos[i * 3 + 1] = center[1] - box[1] / 2 + wrap(b[1] + v[1] * t, box[1]);
        pos[i * 3 + 2] = center[2] - box[2] / 2 + wrap(b[2] + v[2] * t + 0.15 * Math.cos(t * 0.6 + v[3]), box[2]);
      }
      g.attributes.position.needsUpdate = true;
    };
    p.update(0);
    return p;
  };

  // clay oil lamp with a flame and a warm point light
  FW.lamp = (intensity = 6) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 5, 0, Math.PI * 2, Math.PI / 2.4, Math.PI / 2), M('#8A5A38')); body.scale.set(1.3, 0.8, 1); g.add(body);
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), M('#8A5A38')); spout.rotation.z = Math.PI / 2.2; spout.position.set(0.2, 0.04, 0); g.add(spout);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#FFD27A') })); flame.position.set(0.27, 0.15, 0); g.add(flame);
    const halo = FW.glowSprite('#FFB25A', 1.4, 0.8); halo.position.copy(flame.position); g.add(halo);
    const L = new THREE.PointLight(new THREE.Color('#FFB065'), intensity, 9, 1.6); L.position.set(0.27, 0.4, 0); L.castShadow = false; g.add(L);
    g.light = L; g.flame = flame; g.halo = halo;
    g.flicker = (t) => { const f = 0.88 + 0.08 * Math.sin(t * 13.1) + 0.05 * Math.sin(t * 7.3 + 1.2); L.intensity = intensity * f; flame.scale.y = 0.9 + 0.2 * f; halo.material.opacity = 0.7 * f; };
    return g;
  };

  // a jawbone of a donkey: an extruded curved bone shape with teeth
  FW.jawbone = () => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(0.35, -0.12, 0.75, -0.05); s.lineTo(0.95, 0.12); s.quadraticCurveTo(1.0, 0.32, 0.86, 0.36); s.lineTo(0.8, 0.2);
    s.quadraticCurveTo(0.45, 0.12, 0.08, 0.14); s.lineTo(0, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 1, curveSegments: 6 });
    geo.translate(-0.45, -0.1, -0.03);
    const g = new THREE.Group(), m = new THREE.Mesh(geo, M(P.bone, { roughness: 0.7 })); m.castShadow = true; g.add(m);
    for (let i = 0; i < 6; i++) { const tth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.05), M('#D8CBB0')); tth.position.set(-0.36 + i * 0.07, 0.07, 0); g.add(tth); }
    return g;
  };

  // a parchment scroll with a canvas-drawn text face
  FW.scroll = (drawFace, w = 2.4, h = 3.4) => {
    const g = new THREE.Group();
    const tex = FW.canvasTex(1024, Math.round((1024 * h) / w), drawFace);
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
    sheet.receiveShadow = true; g.add(sheet);
    const rm = M('#7A5634');
    for (const y of [h / 2 + 0.05, -h / 2 - 0.05]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, w + 0.25, 10), M('#D9C49A')); r.rotation.z = Math.PI / 2; r.position.set(0, y, 0.06); r.castShadow = true; g.add(r);
      for (const x of [-(w / 2 + 0.2), w / 2 + 0.2]) { const k = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), rm); k.rotation.z = Math.PI / 2; k.position.set(x, y, 0.06); g.add(k); }
    }
    g.tex = tex;
    return g;
  };

  // a far mountain ridge: a long low-poly silhouette strip (fog gives it atmospheric depth)
  FW.ridge = ({ width = 400, height = 18, depth = 30, seed = 2, color = '#2A3046', z = -160, y = -8, seg = 60 } = {}) => {
    const g = new THREE.PlaneGeometry(width, depth, seg, 4); g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), zz = pos.getZ(i);
      const k = FW.clamp(1 - Math.abs(zz) / (depth / 2));
      pos.setY(i, (FW.fbm(x * 0.012 + seed, seed * 3.1, seed) * 1.4 - 0.25) * height * k);
    }
    const m = new THREE.Mesh(g.toNonIndexed(), M(color, { roughness: 1 }));
    m.geometry.computeVertexNormals(); m.position.set(0, y, z);
    return m;
  };
  // grass tufts scattered on a ring (instanced thin cones)
  FW.tufts = ({ n = 50, r0 = 1, r1 = 6, seed = 3, heightAt = () => 0, color = '#5A5A38', center = [0, 0], size = 1, skipFront = false } = {}) => {
    const R = FW.rng(seed), g = new THREE.Group();
    const geo = new THREE.ConeGeometry(0.035, 0.32, 3); geo.translate(0, 0.16, 0);
    const im = new THREE.InstancedMesh(geo, M(color, { roughness: 1 }), n * 5), tmp = new THREE.Object3D(), col = new THREE.Color();
    let k = 0;
    for (let i = 0; i < n; i++) {
      let a = R() * Math.PI * 2; if (skipFront && Math.sin(a) > 0.35) a = -a; const r = r0 + Math.sqrt(R()) * (r1 - r0), x = center[0] + Math.cos(a) * r, z = center[1] + Math.sin(a) * r, y = heightAt(x, z);
      for (let j = 0; j < 5; j++) { tmp.position.set(x + (R() - 0.5) * 0.15, y, z + (R() - 0.5) * 0.15); tmp.rotation.set((R() - 0.5) * 0.6, R() * 3, (R() - 0.5) * 0.6); tmp.scale.setScalar((0.6 + R() * 0.8) * size); tmp.updateMatrix(); im.setMatrixAt(k, tmp.matrix); im.setColorAt(k, col.set(color).offsetHSL(0, 0, (R() - 0.5) * 0.12)); k++; }
    }
    im.castShadow = true; g.add(im); return g;
  };
  // a soft light pool on the ground (radial texture, additive)
  FW.pool = (color, r, opacity = 0.25) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: FW.radialTex(), color: new THREE.Color(color), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    m.rotation.x = -Math.PI / 2; return m;
  };

  // standard night lighting rig: hemisphere fill + a key light with soft shadows
  FW.rig = ({ hemiSky = '#5A6A92', hemiGround = '#3A2A1E', hemi = 0.55, key = '#9DB0D8', keyI = 1.2, keyPos = [-8, 14, 6], target = [0, 0, 0], shadow = 14, mapSize = 2048 } = {}) => {
    const g = new THREE.Group();
    const h = new THREE.HemisphereLight(new THREE.Color(hemiSky), new THREE.Color(hemiGround), hemi); g.add(h);
    const k = new THREE.DirectionalLight(new THREE.Color(key), keyI); k.position.set(...keyPos); k.target.position.set(...target);
    k.castShadow = shadow > 0;
    if (shadow) { k.shadow.mapSize.set(mapSize, mapSize); const c = k.shadow.camera; c.left = -shadow; c.right = shadow; c.top = shadow; c.bottom = -shadow; c.near = 1; c.far = 80; k.shadow.bias = -0.0006; k.shadow.normalBias = 0.03; k.shadow.radius = 3; }
    g.add(k); g.add(k.target);
    g.hemi = h; g.key = k;
    return g;
  };
})();
