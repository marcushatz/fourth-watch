// A headless stage for scenes/diorama.js: logic only, no WebGL, no pixels.
// It runs the REAL diorama.js, fw/core.js, fw/direct.js and fw/trans.js on the REAL three.js camera in a fresh vm context.
// Only LW (the renderer's set dressing) and PP2 (the figure cards) are stubbed, because neither touches the camera.
//   const stage = boot({ diorama: pathToAnyDioramaJs });
//   stage.code(file);                      // run a sets file (DIORAMA.set(...)) inside the context
//   stage.addShots(file, { cue, PRE });    // run a shots file, which calls add(...)
//   await stage.build();
//   stage.snap(t, shot);                   // -> every camera number film.js would hand to the renderer
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '../..'), FILM = path.join(ROOT, 'ep01-samson/film27');
const W = 1080, H = 1920;
const FACE_Y = 1.5;   // metres: a figure's head centre (rig headY about -450 units x PP2.U_M)

const STUBS = `
globalThis.LW = new Proxy({
  paintTerrain: false,
  M: (c) => new THREE.MeshStandardMaterial({ color: c }),
  shadowy: (o) => o,
  project: (cam, p) => { const v = new THREE.Vector3(...p).project(cam); return [(v.x * 0.5 + 0.5) * ${W}, (-v.y * 0.5 + 0.5) * ${H}, v.z]; },
}, { get: (o, k) => (k in o ? o[k] : () => new THREE.Group()), set: (o, k, v) => { o[k] = v; return true; } });
globalThis.PP2 = {
  U_M: 1.86 / 560, SIZES: { person: { worldH: 2.0757 } },
  bill() { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 2), new THREE.MeshBasicMaterial()); m.userData.update = () => {}; m.userData.caster = new THREE.Object3D(); return m; },
};`;

function boot({ diorama = path.join(FILM, 'scenes/diorama.js') } = {}) {
  const quiet = { log() {}, warn() {}, error() {} };
  const ctx = vm.createContext({ console: quiet });
  const run = (file) => vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  run(path.join(FILM, 'lib/three.min.js'));
  run(path.join(FILM, 'fw/core.js'));
  run(path.join(FILM, 'fw/direct.js'));
  run(path.join(FILM, 'fw/trans.js'));
  vm.runInContext(STUBS + `\nglobalThis.SCORE = { W: ${W}, H: ${H}, SHOTS: [] };`, ctx);
  run(diorama);
  const G = vm.runInContext('globalThis', ctx), S = G.SCORE, THREE = G.THREE;
  const cam = new THREE.PerspectiveCamera(38, W / H, 0.2, 320);   // as film.js makes it
  const add = (id, scene, v, t0, o = {}) => { const s = Object.assign({ id, scene, v, t0, beats: {} }, o); S.SHOTS.push(s); return s; };
  const stage = {
    G, S, THREE, cam, add, W, H,
    code: run,
    // run a shots file: lab_shots.js style, a list of add(...) calls
    addShots(file, env = {}) {
      vm.runInContext(`(function (add, cue, PRE) {\n${fs.readFileSync(file, 'utf8')}\n})`, ctx, { filename: file })(add, env.cue, env.PRE ?? 0.08);
      stage.seal();
    },
    // what score.js does after the list: order, index, t1
    seal() {
      S.SHOTS.sort((a, b) => a.t0 - b.t0);
      S.SHOTS.forEach((s, i) => { s.i = i; s.t1 = S.SHOTS[i + 1] ? S.SHOTS[i + 1].t0 : s.t0 + (s.tail ?? 3); s.dur = s.t1 - s.t0; });
    },
    build: () => G.SCENES.diorama.build({ W, H, cam }),
    frame(t, shot) {   // as film.js does: it resets the shared camera, then asks the scene
      cam.fov = 38; cam.clearViewOffset(); cam.updateProjectionMatrix();
      const out = G.SCENES.diorama.frame(t, shot, cam);
      cam.updateMatrixWorld();
      return out;
    },
    snap(t, shot) {
      const o = stage.frame(t, shot), v = cam.view;
      return { t, p: cam.position.toArray(), q: cam.quaternion.toArray(), fov: cam.fov, off: v && v.enabled ? [v.offsetX, v.offsetY] : [0, 0],
        focus: o.focus, ap: o.aperture, rays: o.rays || null, focus2: o.focus2 || null };
    },
    // the fraction of the way down the frame that a world point lands (0 = top, 1 = bottom), as LW.project computes it
    down(p) { const v = new THREE.Vector3(...p).project(cam); return -v.y * 0.5 + 0.5; },
    across(p) { const v = new THREE.Vector3(...p).project(cam); return v.x * 0.5 + 0.5; },
    // a point on a figure's card: the card stands at the feet and leans back half the camera's pitch (film.js), so a head is not
    // straight above the feet in the world
    onCard(x, z, h) {
      const d = new THREE.Vector3(); cam.getWorldDirection(d);
      const lean = Math.asin(-d.y) * 0.5, yaw = Math.atan2(cam.position.x - x, cam.position.z - z);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(-lean, yaw, 0, 'YXZ')));
      return [x + up.x * h, up.y * h, z + up.z * h];
    },
    faceDown(x, z) { return stage.down(stage.onCard(x, z, FACE_Y)); },
    // degrees above the horizon that the camera sits, seen from the point it looks at, and its heading
    aim(look) {
      const dx = cam.position.x - look[0], dy = cam.position.y - look[1], dz = cam.position.z - look[2];
      return { el: (Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI, az: (Math.atan2(dx, dz) * 180) / Math.PI, dist: Math.hypot(dx, dy, dz) };
    },
    // the way the lens points: heading and pitch in degrees
    lens() {
      const d = new THREE.Vector3(); cam.getWorldDirection(d);
      return { yaw: (Math.atan2(d.x, d.z) * 180) / Math.PI, pitch: (Math.asin(d.y) * 180) / Math.PI };
    },
  };
  return stage;
}

// a fixture pack's narration -> the score's cue(line, word, nth) over those word times, so a compiled shot list runs with no vo.js
function cueFromPack(packFile) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, ''), lines = {};
  let li = null;
  for (const ln of fs.readFileSync(packFile, 'utf8').split('\n')) {
    const a = ln.match(/^- line (\d+) /); if (a) li = +a[1];
    const b = ln.match(/^\s*words: (.*)/);
    if (b) lines[li] = b[1].trim().split(/\s+/).map((w) => { const i = w.lastIndexOf('@'); return { w: norm(w.slice(0, i)), s: +w.slice(i + 1) }; });
  }
  return (li2, word, nth = 0) => {
    const hits = (lines[li2] || []).filter((x) => x.w === norm(word));
    if (!hits[nth]) throw new Error(`cue: word "${word}" (${nth}) not in line ${li2}`);
    return hits[nth].s;
  };
}

module.exports = { boot, cueFromPack, ROOT, FILM, W, H, FACE_Y };
