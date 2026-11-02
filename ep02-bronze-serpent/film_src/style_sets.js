// Fourth Watch visual spec v1: the three style frames (creative/visual_spec_v1.md).
// 'paint' sets: flat-stepped shading, smooth designed props, ink on silhouettes, one key light + a focal pool,
// a layered painted backdrop, a palette per scene. People are the same 2D cast, lit by where they stand.
(function () {
  const D = globalThis.DIORAMA;
  // character simplification (visual spec v1): FW_SIMP 1 refined, 2 simplified, 3 minimal; the line thins as detail goes,
  // and at 3 the only line on a figure is the world's ink pass on its silhouette (the same line as every prop)
  const SIMP = globalThis.FW_SIMP ?? 2;
  if (globalThis.PP) { globalThis.PP.simp = SIMP; globalThis.PP.inkK = [1, 0.6, 0.32, 0][SIMP]; }
  const P = (v, robe, extra) => Object.assign({ v, cast: Object.assign({ robe }, extra || {}) });
  const INK = { amt: 0.85, w: 1.6, thr: 0.03, col: [0.16, 0.1, 0.07] };

  // ---- Numbers 21: the wilderness camp at the end of the day. The bronze serpent on its pole against the evening sky,
  //      bitten people around it; one man, kneeling, lifts his face to it ("he would look ... and live", 21:9). ----
  D.set('wild', {
    style: 'paint', ink: INK, seed: 21, actorAmb: 0.92,
    skyOver: { top: '#222A4C', mid: '#6E5A7C', hor: '#E6B482', fog: '#CFA486', key: '#FFCF96', keyI: 3.0, hemi: ['#9C9AC4', '#7A5A40', 0.8], sunDir: [-0.95, 0.06, -0.3], tint: [0.98, 0.92, 0.87] },
    fog: [14, 70], sunPos: [-11, 7, -1],
    ground: { radius: 22, cols: ['#C29C6A', '#B89262', '#CBA676', '#BC9666'], hills: 0.5, seed: 13 },
    props: [
      { id: 'serpent', kind: 'serpent2', at: [0, 0], h: 3.0, face: 0.45, s: 1.2 },
      { kind: 'cairn', at: [0, 0], s: 1.2 },
      { kind: 'boulders', at: [0.65, 4.8], s: 0.62, n: 3, seed: 3, cols: ['#7E6650', '#725C48', '#8A705A'] },
      { kind: 'boulders', at: [3.4, -2.4], s: 0.7, n: 3, seed: 8 }, { kind: 'boulders', at: [-3.8, -3.2], s: 0.9, n: 2, seed: 12 },
      { kind: 'scrub', at: [3.0, 2.6], seed: 2 }, { kind: 'scrub', at: [-2.2, 0.4], seed: 5, s: 0.18 }, { kind: 'scrub', at: [1.9, -3.6], seed: 9 }, { kind: 'scrub', at: [-0.9, 3.9], seed: 4, s: 0.2 },
      { kind: 'tent2', at: [-5.4, -9.6], rot: 1.60 }, { kind: 'tent2', at: [-3.6, -12.1], rot: 1.20, col: '#4A3628' }, { kind: 'tent2', at: [-0.1, -11.4], rot: 1.45 },
      { kind: 'tent2', at: [0.5, -18.3], rot: 1.00, col: '#4A3628' }, { kind: 'tent2', at: [-7.3, -17.4], rot: 1.70 }, { kind: 'tent2', at: [-3.4, -20.4], rot: 1.35, col: '#54402E' },
      { kind: 'viper', at: [1.56, 4.54], len: 1.0, seed: 2, rot: 0.5 }, { kind: 'viper', at: [0.25, 0.95], len: 0.7, seed: 5, rot: 1.2 }, { kind: 'viper', at: [0.73, 0.21], len: 0.6, seed: 8, rot: -0.6 },
      { kind: 'ridge', at: [0, -60], w: 220, h: 4.0, col: '#8E7A98', base: '#D8AE94', peak: 0.47, ph: 0.9, pw: 0.05, seed: 4 },
      { kind: 'ridge', at: [8, -36], w: 140, h: 1.6, col: '#B08C88', base: '#D9AE8E', seed: 9 },
    ],
    people: [
      { id: 'moses', at: [-0.52, -0.1], pose: 'hold', item: 'staff', look: [0.35, -0.9], cast: { old: true, beard: '#D8D2C4', hairCol: '#C8C2B4', robe: '#7A5A3E', stripe: '#C9B48E' } },
      { id: 'looker', at: [1.67, 2.86], pose: 'beseech', dir: -1, ...P(0, '#5E4E3C', { stripe: '#9A7E56' }) },   // bitten; he looks up at it (21:9)
      { id: 'b4', at: [-0.49, 1.75], pose: 'reach', dir: 1, ...P(4, '#8A5A42') },
      { id: 'b1', at: [-1.6, -1.89], pose: 'kneel', look: [0.5, -1], ...P(1, '#7E4E3A') },
      { id: 'b2', at: [0.45, -1.99], pose: 'bow', ...P(2, '#5E5A48') },
      { id: 'b3', at: [0.54, -4.9], pose: 'raise', ...P(0, '#6A4E3A', { cloth: '#C8B898' }) },
      { id: 'b6', at: [1.55, -0.9], pose: 'stand', look: [-0.5, -1], ...P(1, '#6A5A4A') },
    ],
  });
})();
