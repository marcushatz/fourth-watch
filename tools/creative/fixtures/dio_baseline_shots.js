  // Camera features the engine lab shots don't reach, frozen in the same baseline (tools/creative/dio_baseline.js).
  // Moved well past the lab's 21 s so continuity on the 'camp' set stays exactly as the lab has it.
  add('X1', 'diorama', 'camp', 30, { text: false, dio: { cam: { preset: 'iso', on: 'fire', move: 'crane', deg: 22, from: 30.4, dur: 2 } } });
  add('X2', 'diorama', 'camp', 33, { text: false, dio: {
    cam: { preset: 'isoClose', on: 'esau', move: 'follow' },
    act: [ { who: 'esau', at: 33.2, do: 'walk', from: [5.8, 2.9], to: [1.2, -1.4], dur: 2.4 } ] } });
  add('X3', 'diorama', 'camp', 36, { text: false, dio: { cam: { on: [0, 0, 0], el: 9, az: 0, dist: 9.4, fov: 32, ty: 1.35, sh: 0.06 } } });   // Bronze Serpent's hand-set shot
  add('X4', 'diorama', 'camp', 38, { text: false, dio: { cam: { f: 36, ap: 1.8, shakeAt: 38.6, shakeAmp: 10, path: [
    { at: 38.1, p: [2.8, 3.3, 10], l: [0.3, 1.95, 0] }, { at: 39.5, p: [1.2, 2.2, 7], l: [0.1, 1.4, 0], ease: 'crOut' } ] } } });
  add('X5', 'diorama', 'camp', 40, { text: false, dio: { cam: { preset: 'eye', on: 'jacob', move: 'still' } } });   // 'still' was a silent hold; it must stay one
  add('X6', 'diorama', 'camp', 41, { text: false, dio: {} });   // no cam at all: the iso default
  add('X7', 'diorama', 'camp', 42, { text: false, dio: { cam: { preset: 'top', on: 'fire' }, rays: { on: 'jacob', from: 42.2, dur: 0.8, amt: 0.9, y: 1.6 }, focus: { on: 'jacob', y: 1.2 } } });
