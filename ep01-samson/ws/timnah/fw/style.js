// FOURTH WATCH LOOK: "the hour before dawn". People and near shapes are backlit silhouettes with a glowing
// rim; the land is painted in layered cut-outs that grow lighter and warmer toward a luminous horizon;
// God's light is a gold shaft from the top left. Graphic, painterly, never photoreal.
(function () {
  const THREE = globalThis.THREE, FW = globalThis.FW;

  // silhouette material: dark base + soft key (form) + fresnel rim from a light direction (all world space)
  FW.sil = (o = {}) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        base: { value: new THREE.Color(o.base || '#120E18') },
        rimCol: { value: new THREE.Color(o.rim || '#FFB27A') }, rimStr: { value: o.rimStr === undefined ? 1.6 : o.rimStr }, rimPow: { value: o.rimPow || 2.6 },
        rimDir: { value: new THREE.Vector3(...(o.rimDir || [-0.6, 0.3, -0.75])).normalize() },
        keyCol: { value: new THREE.Color(o.key || '#6A5A8A') }, keyStr: { value: o.keyStr === undefined ? 0.35 : o.keyStr },
        keyDir: { value: new THREE.Vector3(...(o.keyDir || [0.4, 0.6, 0.7])).normalize() },
        glowCol: { value: new THREE.Color(o.glow || '#FFD27A') }, glow: { value: 0 },
        opacity: { value: 1 },
      },
      transparent: !!o.transparent, side: o.side || THREE.FrontSide,
      vertexShader: `varying vec3 vN; varying vec3 vP;
        #include <common>
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          #ifdef USE_INSTANCING
            wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
            vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
          #else
            vN = normalize(mat3(modelMatrix) * normal);
          #endif
          vP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform vec3 base; uniform vec3 rimCol; uniform float rimStr; uniform float rimPow; uniform vec3 rimDir; uniform vec3 keyCol; uniform float keyStr; uniform vec3 keyDir; uniform vec3 glowCol; uniform float glow; uniform float opacity;
        varying vec3 vN; varying vec3 vP;
        void main(){
          vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vP);
          float fres = pow(1.0 - clamp(abs(dot(N, V)), 0.0, 1.0), rimPow);
          float side = clamp(dot(N, rimDir) * 1.1 + 0.15, 0.0, 1.0);
          vec3 c = base + keyCol * keyStr * max(dot(N, keyDir), 0.0) + rimCol * rimStr * fres * side;
          c += glowCol * glow * (0.35 + 1.2 * fres);
          gl_FragColor = vec4(c, opacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    mat.set = (k, v) => { const u = mat.uniforms[k]; if (u.value && u.value.isColor) u.value.set(v); else if (u.value && u.value.isVector3) u.value.set(...v).normalize(); else u.value = v; };
    return mat;
  };

  // convert a built figure (or any group) to one shared silhouette material
  FW.silhouette = (obj, mat) => {
    obj.traverse((m) => {
      if (!m.isMesh) return;
      if (m.material && m.material.isMeshBasicMaterial && m.material.blending === THREE.AdditiveBlending) return; // keep glows
      if (m.userData.keepMat) return;
      m.material = mat; m.castShadow = false; m.receiveShadow = false;
    });
    obj.silMat = mat;
    return obj;
  };

  // a painted cut-out landscape layer: a vertical shape with a noisy top edge, vertical colour gradient
  FW.layer = ({ z = -40, width = 300, base = -20, height = 10, rough = 0.5, seed = 1, color = '#4A3A5E', top = null, freq = 0.02, peaks = 0, x = 0, steps = 160, fogFade = 0 } = {}) => {
    const s = new THREE.Shape();
    s.moveTo(-width / 2, base);
    for (let i = 0; i <= steps; i++) {
      const xx = -width / 2 + (i / steps) * width;
      let h = FW.fbm(xx * freq + seed * 7.3, seed * 1.7, seed, 5) * height;
      h += Math.max(0, FW.noise2(xx * freq * 3 + seed, 3.3, seed + 9) - 0.6) * height * rough * 2;
      if (peaks) h += Math.pow(Math.max(0, Math.sin(xx * freq * 2.2 + seed)), 6) * peaks;
      s.lineTo(xx, h);
    }
    s.lineTo(width / 2, base); s.lineTo(-width / 2, base);
    const g = new THREE.ShapeGeometry(s, 1);
    const pos = g.attributes.position, cols = [], c0 = new THREE.Color(color), c1 = new THREE.Color(top || color);
    let ymax = -1e9; for (let i = 0; i < pos.count; i++) ymax = Math.max(ymax, pos.getY(i));
    for (let i = 0; i < pos.count; i++) { const k = FW.clamp((pos.getY(i) - base) / (ymax - base + 1e-6)); const c = c0.clone().lerp(c1, Math.pow(k, 1.6)); cols.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
    m.position.set(x, 0, z);
    return m;
  };

  // painted sky: big gradient dome + a sun/dawn glow + soft cloud streaks
  FW.paintSky = (scene, o = {}) => {
    const sky = FW.sky(); scene.add(sky);
    sky.set({ top: o.top || '#1B2250', mid: o.mid || '#5A4F86', bot: o.bot || '#F2A57A', hz: o.hz === undefined ? -0.02 : o.hz, glowCol: o.glow || '#FFC891', glowDir: o.glowDir || [-0.45, 0.03, -0.9], glowPow: o.glowPow || 5 });
    const stars = FW.stars(700, 21); stars.material.opacity = o.stars === undefined ? 0.6 : o.stars; scene.add(stars);
    const clouds = new THREE.Group(); scene.add(clouds);
    const R = FW.rng(o.seed || 5);
    for (let i = 0; i < (o.clouds === undefined ? 7 : o.clouds); i++) {
      const w = 60 + R() * 90, h = 4 + R() * 5;
      const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: FW.cloudTex(), color: new THREE.Color(o.cloud || '#F4B79A'), transparent: true, opacity: 0.25 + R() * 0.3, depthWrite: false, fog: false }));
      c.position.set(-120 + R() * 240, 10 + R() * 34, -180 - R() * 20); clouds.add(c);
    }
    scene.userData.sky = sky; scene.userData.stars = stars; scene.userData.clouds = clouds;
    return { sky, stars, clouds };
  };
  FW.cloudTex = (() => { let t = null; return () => { if (t) return t; t = FW.canvasTex(512, 64, (x, w, h) => {
    for (let i = 0; i < 26; i++) { const cx = 40 + (i / 26) * (w - 80) + Math.sin(i * 7.1) * 20, cy = h / 2 + Math.sin(i * 3.3) * 6, r = 14 + (Math.sin(i * 5.7) * 0.5 + 0.5) * 18;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
  }); return t; }; })();

  // a dark painted ground slab (near layer) with a rim of light along its top edge
  FW.groundSil = ({ z = 0, width = 40, depth = 30, color = '#14101C', y = 0 } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), fog: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, y, z); return m;
  };
})();
