# Scene contract (Fourth Watch Ep 1, film27)

The film is one page (index.html) rendered frame by frame by headless Chrome: `window.renderAt(t)` calls film.js, which finds the active shot in `SCORE.SHOTS` (score.js) and asks that shot's scene module to set up the 3D frame. film.js then renders it (LW.render: depth of field, tone, colour), adds God's-light rays, bloom, the scene's 2D post-effects and name tags, the cards, the header and the narration. **Every frame must be a pure function of t**: no Math.random, no Date.now, no state carried between frames (parallel workers render frames in any order). Use FW.rng(seed) for seeded randomness and hash functions of t.

## A scene module

```js
(function () {
  const S = globalThis.SCORE, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, PP = globalThis.PP, PP2 = globalThis.PP2;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  let scene, sun /* ... */;
  SCENES.myscene = {
    async build(env) {           // once, at init. env = { W, H, cam }. Build THREE.Scene(s), lights, props, billboards.
    },
    frame(t, shot, cam) {        // every frame of every shot whose shot.scene === 'myscene'
      // shot = { id:'S02', scene, v:'door', t0, t1, dur, beats:{word: absTime}, ... } (see score.js)
      // switch on shot.v; local time = t - shot.t0. Pose characters, move props, set the camera:
      //   FW.setCam(cam, [px,py,pz], [lookX,lookY,lookZ], fovDeg); cam.setViewOffset(W, H, 0, -shift*H, W, H) for a vertical shift
      return {
        scene,                   // THREE.Scene to render (required)
        sun,                     // the DirectionalLight billboards cast their shadows from (optional)
        bill: [/* billboards to turn toward the camera */],
        focus, aperture,         // depth of field: focus distance (camera-space metres) and aperture (≈3–6)
        maxR: 7, fgScale: 1.5, exposure: 1.1, sat: 1.1, bloom: 0.15,   // optional grading
        rays: { amt: 0..1, target: [x,y,z] },  // optional: God's light, rays from the upper-left converging on a world point
        flash: 0..1,             // optional: additive warm flash (impacts)
        dark: 0..1,              // optional: darken the frame (fades)
        tags: [{ text:'GAZA', sub:'JUDGES 16:1', p:[x,y,z], k:0..1 (reveal progress), dy:-110, dx:0, a:1 }],
        post(ctx, t, project) {} // optional 2D drawing over the render (dust, speed lines); project([x,y,z]) -> [sx, sy]
      };
    },
  };
})();
```

The camera is shared (film.js resets fov to 38 and the view offset each frame). Characters are billboards from `LW.billboard({cw, ch, worldH, footPx, draw})`; call `bb.userData.update(key, state)` to redraw only when the pose changes (quantise continuous values so the key changes at most every frame), add `bb.userData.caster` to the scene for its shadow, and list the billboard in `bill`. `bb.userData.tilt` rotates it in the picture plane (falls, leans).

Read `scenes/lehi.js` (the approved Lehi set, ported to this contract) and `../hook-style/film.js` (the original) before writing a scene: the terrain (LW.terrain with hFn/colFn), dressing (LW.olive, bush, rock, grassTuft, tent, banner, crate, fire), sky (LW.sky), light (warm DirectionalLight with soft shadows + HemisphereLight fill, a gold SpotLight for God's light), particles (LW.particles), shafts (LW.shaft), ground glow (LW.pool), contact shadows, and the camera with depth of field. Match that look: low-poly flat-shaded geometry, warm/cool palette from fw/core.js FW.PAL, haze via scene.fog, miniature depth of field.

## Rules for every scene
- ESV-accurate: show only what the text says, where and when it says it (see the shot list's Picture column). No gore: no blood, no wounds, nobody shown dying; falls are figures toppling out of frame or into dust.
- God's light is gold and comes from the upper left of the frame; Philistines/ember light sit screen right.
- Keep faces and key action between ~38% and ~85% of the frame height (the top 700 px carries the header, title and narration). Nothing important in the bottom 300 px.
- One main camera move per shot, eased (FW.ease.inOut / out), starting on its beat word (shot.beats). Never hard-code absolute times: derive everything from shot.t0, shot.t1, shot.dur and shot.beats.
- Performance: the machine has 2 CPUs and software WebGL. Keep shadow maps ≤ 2048 (3072 only for the hero set), terrain seg ≤ 128, instance or merge repeated props, and keep each scene's geometry modest. Each frame must render in under ~3 s.
- Deterministic: seeded rng only.

## Testing your scene (in your own workspace)
Your workspace is a full copy of the project. Put `globalThis.FW_ONLY = ['yourscene', ...];` in `only.js` at the workspace root so only your scenes build. Then, from the workspace root:

```
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
node engine/render.js stills 5.3 7.1 9.6        # -> out/stills/t_*.png  (times inside your shots)
node engine/render.js clip 6.7 10.2 1           # -> a short mp4 of a range (1 worker), to check motion
```

Look at every still with the Read tool and fix what's wrong. When a version is good, copy your scene file(s) into the master: `cp scenes/<file>.js /home/claude/fourth-watch/ep01-samson/film27/scenes/`. Never edit files you don't own. To pick up the latest shared characters: `cp /home/claude/fourth-watch/ep01-samson/film27/lintel/people2.js lintel/`.

## Shot fields for direction (from v58; rules in research/direction_rules.md)

Every shot in score.js also carries what it SHOWS, so the shot list can be checked before anything renders
(`node ../../tools/shotlist_check.js . --outro 3`, from this folder):

```js
add('S07', 'sorek', 'traps', t0, {
  size: 'ms',                                   // 'xws' | 'ws' | 'ms' | 'mcu' | 'cu' | 'insert'
  act: 'Samson bursts the bowstrings, then the new ropes, then tears the pin from the loom',   // the verb, shown
  change: 'counter 1-2-3 ticks; each bond snaps on its beat',                                 // anything else that changes
  pill: 'THREE TIMES · JUDGES 16:9-14',         // concept / name / stamp text, if any
  cam: { move: 'push', amt: 6 },                // big moves (>=15%) need job: 'hook-reveal' | 'travel' | 'follow' | 'reveal'
  cuts: [cue(3, 'three', 1), cue(3, 'broke')],  // hard cuts the scene makes inside this shot
  list: true,                                   // list items may run 1.2-2.5 s
  beats: { ... },
});
```
Other flags: `long: 'verse' | 'travel' | 'diagram' | 'set'` (the reasons to pass 6 s, always with a beat every ~2 s inside;
nothing passes 12 s), `callback: true` (the hook image returns), `arrival: true` (the image the answer line plays over),
`flash: true` (a 0.2 s transition piece).

`beats` is the shot's beat clock: name every visible change after the word it lands on (`{ leap: cue(1, 'Samson'),
god: cue(1, 'God') }`). With the shot starts, the cuts and the device beats, the linter needs a change at least every
~2 s and no gap over 6 s; `fw_check.py video` then measures the real ones on the render.

Rules of thumb (all in research/direction_rules.md, v2):
- Every clause is shown happening on its word.
- Something changes about every 2 s or more often; at most one still stretch over 6 s.
- Median shot 3-5 s; nothing under 1 s except a transition.
- An idea becomes one object that something happens to.
- A still verse card holds 3.5-5 s; a longer hold needs marks acted on it.
- The reel ends at most ~4.5 s after the last spoken word.

Overlay devices drawn by film.js after the scene (any shot, with or without a `card`):
- `counter: { from: 0, to: 1100, beat, dur: 0.9, label: 'PIECES OF SILVER', sub: 'FROM EACH LORD · JUDGES 16:5', y: 0.7 }`: a number that ticks on its word
- `tally: { items: [{ label: 'BOWSTRINGS', mark: 'ok', beat }, ..., { label: 'THIS TIME', mark: '?', beat }], xBeat, y: 0.5 }`: past cases, then a red X
- `stamp: { text: 'USED ≠ APPROVED', beat, color: '#C2302A', rot: -0.07, y: 0.62 }`: a verdict stamp that slams in
- `flashIn: true`: a 0.2 s cream flash on the cut (Lintel's scene-change transition)
- `flashIn: true` is for real scene jumps only (a new place or time); on Bible Animations the flash cut shows up in the lows. Prefer a whoosh, a morph or a crossfade for the ordinary cut.

- **Verse marks (exists, Oct 31):** `VERSES[i].marks: [{ phrase: 'please remember me', at: cue(10, 'remember'), kind: 'gold' }]`. While the card holds, the phrase turns gold on its word with a glow and an underline that sweeps under it. Tested on the 16:28 card.
- **Speech bubble (exists, Oct 31):** `bubble: { text, beat, x, y, tx, ty }` or `bubbles: [...]`. A comic bubble pops on its beat. `x, y` is its centre and `tx, ty` the tip of its tail, as fractions of the frame. Rules:
  - Put it beside the head with the tail at the mouth, never over a face.
  - Keep it to a few quoted words (ESV wording when it is Scripture).
  - Hide the narration caption for that span (`text: false`) when the bubble repeats the same words: only one text element at a time.

Devices still to build (direction_rules.md §11, with the fields the shot list will use):
- **Whoosh-in / exit:** `enter: { who, beat, from: 'left' | 'right' | 'top', blur: true }`, `exit: { who, beat }`. A figure arrives on its name with motion blur and leaves when the line moves on (Bible Animations).
- **Panel strip:** `panels: [{ v, beat }, ...]`. Two or three panels slide in side by side, and each plays its own action on its beat (Ep 1 T2: the three escapes).
- **Blank-faced figure:** a plain modern person with no face. They voice the doubt or carry the example, and a pill can label them. Never show them doing wrong.
- **"?" silhouette:** a faceless shape with a "?" that resolves to a name pill on a beat.
- **Diagram:** cards `diagram` (a timeline, two groups, a list building item by item on the narration).
- **Graphic morph:** `morph: { from, to, dur }`. A shape in this picture becomes the next scene (later).

