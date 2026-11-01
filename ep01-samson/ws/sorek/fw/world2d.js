// 2.5D world helpers for the cut-out look: silhouette shapes with rims, beams, ground rings.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  // a flat silhouette from outline points, with an optional rim copy nudged toward the light
  FW.silShape = (pts, { color = '#0B0810', rim = null, rimW = 0.03, light = [-0.6, 0.8], z = 0, gradTop = null } = {}) => {
    const g = new THREE.Group(); g.position.z = z;
    const geo = FW.shapeGeo(pts);
    let mat;
    if (gradTop) {
      const pos = geo.attributes.position; let y0 = 1e9, y1 = -1e9; for (let i = 0; i < pos.count; i++) { y0 = Math.min(y0, pos.getY(i)); y1 = Math.max(y1, pos.getY(i)); }
      const c0 = new THREE.Color(color), c1 = new THREE.Color(gradTop), cols = [];
      for (let i = 0; i < pos.count; i++) { const k = (pos.getY(i) - y0) / (y1 - y0 + 1e-6); const c = c0.clone().lerp(c1, Math.pow(k, 2.2)); cols.push(c.r, c.g, c.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false });
    } else mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false });
    g.add(new THREE.Mesh(geo, mat));
    if (rim) { const n = Math.hypot(light[0], light[1]), rw = rimW >= 0.02 ? rimW * 0.55 : rimW; const r = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(rim), fog: false })); r.position.set((light[0] / n) * rw, (light[1] / n) * rw, -0.002); g.add(r); g.rim = r; }
    g.mat = mat;
    return g;
  };
  // a light beam: a long plane with a soft centre, fading toward the ground; additive
  FW.beamTex = (() => { let t = null; return () => { if (t) return t; t = FW.canvasTex(256, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.3, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.7, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { const xx = w * (0.18 + 0.64 * ((i * 0.618) % 1)); const g2 = x.createLinearGradient(xx - 6, 0, xx + 6, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g2; x.fillRect(xx - 6, 0, 12, h); }
    x.globalCompositeOperation = 'destination-in'; const v = x.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0.25)'); v.addColorStop(0.15, 'rgba(0,0,0,1)'); v.addColorStop(0.85, 'rgba(0,0,0,0.9)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  }); return t; }; })();
  FW.beam = ({ from = [-3, 9, -0.6], to = [0, 0, -0.6], w0 = 0.5, w1 = 2.2, color = '#FFE2A8', opacity = 0.8 } = {}) => {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const geo = new THREE.BufferGeometry();
    const p = [-w0 / 2, 0, 0, w0 / 2, 0, 0, -w1 / 2, -len, 0, w1 / 2, -len, 0];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: FW.beamTex(), color: new THREE.Color(color), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    m.position.set(...from); m.rotation.z = Math.atan2(to[0] - from[0], -(to[1] - from[1]));
    m.setOpacity = (o) => { m.material.opacity = o; m.visible = o > 0.003; };
    return m;
  };
  // grass blades along a line (silhouette)
  FW.blades = ({ x0 = -2, x1 = 2, y = 0, z = 0, n = 60, h = 0.25, color = '#0B0810', seed = 3 } = {}) => {
    const R = FW.rng(seed), pos = [];
    for (let i = 0; i < n; i++) { const x = x0 + R() * (x1 - x0), hh = h * (0.4 + R()), lean = (R() - 0.5) * 0.15, w = 0.012 + R() * 0.012; pos.push(x - w, y, 0, x + w, y, 0, x + lean, y + hh, 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide, fog: false })); m.position.z = z; return m;
  };
  // a flattened glowing ring for ground shockwaves (sprite-like, faces camera in 2.5D)
  FW.ringTex = (() => { let t = null; return () => { if (t) return t; t = FW.canvasTex(256, 256, (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.75, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); return t; }; })();
})();
// ---- crowds & extras for the cut-out look ----
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  // bake the body rig of a posed cut figure into one flat geometry (positions in the figure's root space)
  FW.bake = (fig) => {
    fig.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(fig.matrixWorld).invert(), pos = [];
    fig.body.g.traverse((m) => {
      if (!m.isMesh || !m.visible) return;
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
      const mat = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld), v = new THREE.Vector3(), a = g.attributes.position;
      for (let i = 0; i < a.count; i++) { v.set(a.getX(i), a.getY(i), 0).applyMatrix4(mat); pos.push(v.x, v.y, 0); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return geo;
  };
  // instanced silhouette crowd: kinds = array of {o (cut options), pose}; spots = [[x,y,z,scale,dir,kindIndex]]
  FW.crowdSil = ({ kinds, spots, base = '#0B0810', rim = '#FFB48A', rimW = 0.012, light = [-0.6, 0.8] }) => {
    const g = new THREE.Group(), n = Math.hypot(light[0], light[1]);
    kinds.forEach((k, ki) => {
      const f = FW.cut(k.o); f.pose(k.pose || FW.CUT.stand, 0); const geo = FW.bake(f);
      const mine = spots.filter((s) => (s[5] || 0) === ki); if (!mine.length) return;
      const body = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(base), side: THREE.DoubleSide, fog: false }), mine.length);
      const rimM = new THREE.InstancedMesh(geo, FW.rimFadeMat(new THREE.MeshBasicMaterial({ color: new THREE.Color(rim), side: THREE.DoubleSide, fog: false })), mine.length);
      const tmp = new THREE.Object3D();
      mine.forEach((s, i) => {
        tmp.position.set(s[0], s[1], s[2]); tmp.scale.set((s[4] || 1) * (s[3] || 1), s[3] || 1, 1); tmp.updateMatrix(); body.setMatrixAt(i, tmp.matrix);
        tmp.position.set(s[0] + (light[0] / n) * rimW * (s[3] || 1), s[1] + (light[1] / n) * rimW * (s[3] || 1), s[2] - 0.003); tmp.updateMatrix(); rimM.setMatrixAt(i, tmp.matrix);
      });
      g.add(rimM, body); g.userData.mats = (g.userData.mats || []).concat([body.material, rimM.material]);
    });
    g.setColors = (b, r) => { g.children.forEach((m, i) => m.material.color.set(i % 2 ? b : r)); };
    return g;
  };
  // simple silhouette props (outline points, base at y=0)
  FW.SHAPES = {
    house: (w, h, seed = 1) => { const R = FW.rng(seed), p = [[-w / 2, 0], [-w / 2, h], [-w / 2 + 0.1, h], [-w / 2 + 0.1, h + 0.18], [w / 2 - 0.1, h + 0.18], [w / 2 - 0.1, h], [w / 2, h], [w / 2, 0]]; return p; },
    palm: (h = 4, seed = 1) => { const R = FW.rng(seed), pts = []; const lean = (R() - 0.5) * 0.6; pts.push([-0.1, 0], [lean * 0.5 - 0.06, h * 0.5], [lean - 0.05, h]); for (let i = 0; i < 9; i++) { const a = Math.PI * (0.05 + i / 8 * 0.9), L = 1.2 + R() * 0.5; pts.push([lean + Math.cos(a) * L * (i % 2 ? 1 : 0.3), h + Math.sin(a) * L * 0.45 - (i % 2 ? 0.35 : -0.05)]); } pts.push([lean + 0.05, h], [lean * 0.5 + 0.06, h * 0.5], [0.1, 0]); return pts; },
    pillar: (w, h) => [[-w * 0.65, 0], [-w * 0.65, 0.18], [-w / 2, 0.22], [-w / 2, h - 0.3], [-w * 0.7, h - 0.22], [-w * 0.7, h], [w * 0.7, h], [w * 0.7, h - 0.22], [w / 2, h - 0.3], [w / 2, 0.22], [w * 0.65, 0.18], [w * 0.65, 0]],
  };
  // a silhouette from straight-edged points (no smoothing) — for buildings
  FW.polySil = (pts, { color = '#0B0810', rim = null, rimW = 0.03, light = [-0.6, 0.8], z = 0, x = 0, y = 0, emit = null } = {}) => {
    const s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    const geo = new THREE.ShapeGeometry(s), g = new THREE.Group(); g.position.set(x, y, z);
    g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false })));
    if (rim) { const n = Math.hypot(light[0], light[1]), rw = rimW >= 0.02 ? rimW * 0.6 : rimW; const r = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(rim), fog: false })); r.position.set((light[0] / n) * rw, (light[1] / n) * rw, -0.003); g.add(r); }
    return g;
  };
  // a lit window/door: a small warm rectangle with a glow
  FW.window = (w, h, color = '#FFB25E', glow = 1) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false })));
    if (glow) { const s = FW.glowSprite(color, Math.max(w, h) * 4, 0.35 * glow); s.position.z = 0.01; g.add(s); }
    return g;
  };
})();

(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  // a date palm: curved trunk + drooping fronds, each a silhouette with a rim
  FW.palmSil = (h = 4, seed = 1, o = {}) => {
    const R = FW.rng(seed), g = new THREE.Group(), lean = (R() - 0.5) * 0.7;
    const trunk = []; for (let i = 0; i <= 8; i++) { const k = i / 8; trunk.push([lean * k * k - 0.09 * (1 - k * 0.5), h * k]); }
    for (let i = 8; i >= 0; i--) { const k = i / 8; trunk.push([lean * k * k + 0.09 * (1 - k * 0.5), h * k]); }
    g.add(FW.polySil(trunk, { color: o.color || '#0B0810', rim: o.rim, rimW: 0.03, light: o.light }));
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * 0.05 + (i / 8) * Math.PI * 1.1, L = 1.3 + R() * 0.5, droop = 0.45 + R() * 0.25;
      const ex = Math.cos(a) * L, ey = Math.sin(a) * L * 0.5 - droop * Math.abs(Math.cos(a));
      const pts = [[0, 0.05], [ex * 0.5, ey * 0.5 + 0.18], [ex, ey], [ex * 0.55, ey * 0.5 - 0.02], [0, -0.04]];
      const f = FW.silShape(pts, { color: o.color || '#0B0810', rim: o.rim, rimW: 0.025, light: o.light, z: 0.001 * i }); f.position.set(lean, h, 0); g.add(f);
    }
    return g;
  };
})();

(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  // an olive tree: twisted trunk + a lumpy, broken canopy (several overlapping lobes)
  FW.oliveSil = (seed = 1, o = {}) => {
    const R = FW.rng(seed), g = new THREE.Group(); g.position.z = o.z || 0;
    const lean = (R() - 0.5) * 0.25;
    g.add(FW.silShape([[-0.1, 0], [-0.07, 0.25], [-0.13 + lean, 0.5], [-0.05 + lean, 0.62], [0.05 + lean, 0.6], [0.1 + lean, 0.45], [0.06, 0.25], [0.1, 0]], { color: o.color, rim: o.rim, rimW: 0.018, light: o.light }));
    for (let i = 0; i < 6; i++) {
      const cx = lean + (R() - 0.5) * 0.8, cy = 0.7 + R() * 0.35, r = 0.22 + R() * 0.16, pts = [];
      for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr = r * (0.75 + R() * 0.35); pts.push([cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr * 0.8]); }
      g.add(FW.silShape(pts, { color: o.color, rim: o.rim, rimW: 0.018, light: o.light, z: 0.0005 * i }));
    }
    return g;
  };
})();

(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;
  // many overlapping round lobes merged into one silhouette (foliage, hedges, clouds of leaves)
  FW.lobes = (circles, { color = '#0B0810', rim = null, rimW = 0.02, light = [-0.6, 0.8], z = 0, seg = 12 } = {}) => {
    const shapes = circles.map(([cx, cy, r, sx = 1.2, sy = 0.85]) => { const sh = new THREE.Shape(); for (let k = 0; k <= seg; k++) { const a = (k / seg) * Math.PI * 2; const x = cx + Math.cos(a) * r * sx, y = cy + Math.sin(a) * r * sy; k ? sh.lineTo(x, y) : sh.moveTo(x, y); } return sh; });
    const geo = new THREE.ShapeGeometry(shapes, 1), g = new THREE.Group(); g.position.z = z;
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false }); g.add(new THREE.Mesh(geo, mat));
    if (rim) { const n = Math.hypot(light[0], light[1]); const r = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(rim), fog: false })); r.position.set((light[0] / n) * rimW, (light[1] / n) * rimW, -0.002); g.add(r); }
    g.mat = mat; return g;
  };
})();
