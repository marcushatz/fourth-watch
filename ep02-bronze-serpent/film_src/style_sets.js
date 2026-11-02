// Fourth Watch visual spec v1: the three style frames (creative/visual_spec_v1.md).
// 'paint' sets: flat-stepped shading, smooth designed props, ink on silhouettes, one key light + a focal pool,
// a layered painted backdrop, a palette per scene. People are the same 2D cast, lit by where they stand.
(function () {
  const D = globalThis.DIORAMA;
  // character simplification (visual spec v1): FW_SIMP 1 refined, 2 simplified, 3 minimal; the line thins as detail goes,
  // and at 3 the only line on a figure is the world's ink pass on its silhouette (the same line as every prop)
  const SIMP = globalThis.FW_SIMP ?? 3;   // approved: C (shots with 1-2 key characters add B's dot eyes: shot.dio.faces = 'medium')
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
      { kind: 'boulders', at: [0.31, 4.23], s: 0.55, n: 3, seed: 3, cols: ['#7E6650', '#725C48', '#8A705A'] },
      { kind: 'boulders', at: [3.4, -2.4], s: 0.7, n: 3, seed: 8 }, { kind: 'boulders', at: [-3.8, -3.2], s: 0.9, n: 2, seed: 12 },
      { kind: 'scrub', at: [3.0, 2.6], seed: 2 }, { kind: 'scrub', at: [-2.2, 0.4], seed: 5, s: 0.18 }, { kind: 'scrub', at: [1.9, -3.6], seed: 9 }, { kind: 'scrub', at: [-0.9, 3.9], seed: 4, s: 0.2 },
      { kind: 'tent2', at: [-5.4, -9.6], rot: 1.60 }, { kind: 'tent2', at: [-3.6, -12.1], rot: 1.20, col: '#4A3628' }, { kind: 'tent2', at: [-0.1, -11.4], rot: 1.45 },
      { kind: 'tent2', at: [0.5, -18.3], rot: 1.00, col: '#4A3628' }, { kind: 'tent2', at: [-7.3, -17.4], rot: 1.70 }, { kind: 'tent2', at: [-3.4, -20.4], rot: 1.35, col: '#54402E' },
      { kind: 'viper', at: [1.66, 3.17], len: 0.9, seed: 2, rot: 0.4 }, { kind: 'viper', at: [0.36, 1.33], len: 0.7, seed: 5, rot: 1.2 }, { kind: 'viper', at: [-1.6, 2.2], len: 0.6, seed: 8, rot: -0.6 },
      { kind: 'ridge', at: [0, -60], w: 220, h: 4.0, col: '#8E7A98', base: '#D8AE94', peak: 0.47, ph: 0.9, pw: 0.05, seed: 4 },
      { kind: 'ridge', at: [8, -36], w: 140, h: 1.6, col: '#B08C88', base: '#D9AE8E', seed: 9 },
    ],
    // each figure has one job in the story: sickness, desperation, looking, healing, Moses' leadership (Num 21:6-9)
    people: [
      { id: 'moses', at: [-0.52, -0.1], pose: 'direct', dir: 1, look: [0.7, 0.35], cast: { old: true, beard: '#D8D2C4', hairCol: '#C8C2B4', robe: '#7A5A3E', stripe: '#C9B48E' } },   // points the people to it
      { id: 'looker', at: [1.12, 1.76], pose: 'beseech', dir: -1, ...P(0, '#5E4E3C') },                       // looking: face and hand lifted to the serpent
      { id: 'sick', at: [0.05, 2.13], pose: 'slump', dir: -1, ...P(2, '#6A5A48') },                            // sickness: too weak to kneel upright
      { id: 'helper', at: [-0.41, 1.94], pose: 'support', dir: 1, ...P(4, '#8A5A42') },                     // desperation: holding him up, turning him toward it
      { id: 'clutch', at: [1.9, 2.6], pose: 'clutch', dir: -1, shade: 0.86, ...P(3, '#5A4E40') },          // the bite: hunched over his leg, a snake beside him
      { id: 'woman', at: [0.01, -2.29], pose: 'kneel', look: [0.1, -1], ...P(1, '#7E4E3A') },               // looking
      { id: 'healed', at: [0.72, -3.09], pose: 'relief', look: [-0.5, -1], ...P(0, '#6A4E3A', { cloth: '#C8B898' }) },   // healing: standing again
      { id: 'far1', at: [-3.55, -6.45], pose: 'stand', look: [0.6, -0.3], ...P(4, '#6E5040') }, { id: 'far2', at: [1.14, -6.59], pose: 'walk', ...P(2, '#5A5040') },
    ],
  });

  // ---- Exodus 32:19: Moses comes down to the camp at dusk, sees the calf and the dancing, and lifts the tablets to throw
  //      them down. The calf glows by its altar fire; around it each person is doing something different. ----
  D.set('sinai2', {
    style: 'paint', ink: INK, seed: 32, actorAmb: 0.86, fireI: 3.0,
    skyOver: { top: '#1C2240', mid: '#4E4668', hor: '#C88A6A', fog: '#A87A6C', key: '#E8C0A0', keyI: 2.2, hemi: ['#7A80B0', '#5A4030', 0.8], sunDir: [-0.9, 0.04, -0.4], tint: [0.9, 0.86, 0.9] },
    fog: [12, 55], sunPos: [-9, 7, 2],
    ground: { radius: 40, cols: ['#A88A64', '#9C805C', '#B0926A', '#A2865E'], hills: 0.45, seed: 31 },
    props: [
      { id: 'plinth', kind: 'plinth', at: [0.6, -0.4], s: 1.15 },
      { id: 'calf', kind: 'calf2', at: [0.6, -0.4], face: -0.22, lift: 0.79, s: 1.05 },
      { kind: 'altar', at: [1.25, 0.55], w: 0.6 }, { id: 'altarlight', kind: 'fire', at: [1.25, 0.55], y: -0.6 }, { id: 'altarfire', kind: 'flames', at: [1.25, 0.55], y: 0.7, s: 1.1 },
      { kind: 'fire', at: [-1.6, -3.0] }, { kind: 'fire', at: [3.0, -2.6] },
      { kind: 'boulders', at: [-1.3, 3.6], s: 0.6, n: 3, seed: 4, cols: ['#5E4C3E', '#54443A', '#665244'] },
      { kind: 'scrub', at: [2.6, 1.2], seed: 3 }, { kind: 'scrub', at: [-2.4, 0.6], seed: 6, s: 0.2 },
      { kind: 'tent2', at: [-0.7, -5.6], rot: 1.4 }, { kind: 'tent2', at: [3.7, -5.7], rot: 1.1, col: '#4A3628' }, { kind: 'tent2', at: [-3.4, -7.4], rot: 1.7 },
      { kind: 'tent2', at: [1.6, -8.6], rot: 1.3, col: '#54402E' }, { kind: 'tent2', at: [5.6, -9.4], rot: 1.5 },
      { kind: 'peak', at: [-4, -54], w: 34, h: 13, col: '#383452', cloudCol: '#5E5878' },   // Sinai, with the cloud on it
    ],
    people: [
      { id: 'moses', at: [-0.77, 3.0], pose: 'tablets', look: [1, 0.15], cast: { old: true, beard: '#D8D2C4', hairCol: '#C8C2B4', robe: '#7A5A3E', stripe: '#C9B48E' } },
      { id: 'dancer', at: [2.12, -2.46], pose: 'cheer', ...P(1, '#9A5A3E') },                    // the dancing (32:19)
      { id: 'bower', at: [0.42, -2.07], pose: 'bow', ...P(0, '#6E5A44') },                     // bowing to it (32:8)
      { id: 'offerer', at: [1.95, 0.2], pose: 'offer', look: [-0.6, -0.3], ...P(4, '#7A4E3A') }, // bringing an offering (32:6)
      { id: 'eater', at: [1.93, -0.97], pose: 'hold', item: 'bowl', ...P(3, '#5E5A48') },        // "sat down to eat and drink" (32:6)
      { id: 'notice', at: [0.14, -2.73], pose: 'shield', dir: 1, ...P(2, '#6A4E3A') },            // the first to see Moses
      { id: 'dancer2', at: [1.78, -4.25], pose: 'walk', ...P(4, '#8A6A4A') },
    ],
  });

  // ---- 2 Kings 18:4: a stone court (not named). People had been making offerings to the bronze serpent; Hezekiah lifts
  //      the hammer. The offerers react, each differently: one still holds out his bowl, one flinches, one pleads. ----
  D.set('court2', {
    style: 'paint', ink: INK, seed: 18, actorAmb: 0.9,
    skyOver: { top: '#2A3058', mid: '#7A6080', hor: '#E8B080', fog: '#B8907C', key: '#FFD2A0', keyI: 2.8, hemi: ['#A0A0C8', '#6A5040', 0.85], sunDir: [-0.8, 0.25, -0.5], tint: [0.98, 0.92, 0.88] },
    fog: [14, 50], sunPos: [-8, 9, 3],
    ground: { radius: 12, cols: ['#A89478', '#9E8A6E', '#B09C80'], hills: 0.03, seed: 4 },
    props: [
      { id: 'base', kind: 'plinth', at: [0.4, 0], s: 0.9 },
      { id: 'serpent', kind: 'serpent2', at: [0.4, 0], h: 2.2, lift: 0.63, face: -0.6, s: 1.0 },
      { id: 'smoke', kind: 'incense', at: [0.95, 0.55], n: 14, op: 0.32, h: 2.4 },
      { kind: 'bowl', at: [0.0, 0.62] }, { kind: 'bowl', at: [-0.1, -0.5], fill: '#C9A060' }, { kind: 'bowl', at: [1.3, 0.9], fill: '#E8E0C8' },
      { kind: 'wall', at: [0.4, -3.4], w: 10, h: 3.2, col: '#9C8A70' }, { kind: 'doorway', at: [1.8, -3.4], w: 1.3, h: 2.3, col: '#E9C79A' }, { kind: 'wall', at: [-4.2, -0.4], w: 6.4, h: 3.2, col: '#8E7C64', rot: Math.PI / 2 },
      { kind: 'pillar', at: [-2.4, -2.6], h: 3.4 }, { kind: 'pillar', at: [2.9, -2.6], h: 3.4 }, { kind: 'pillar', at: [-3.3, 2.2], h: 3.4 },
      { kind: 'ridge', at: [0, -40], w: 120, h: 3, col: '#8E7A98', base: '#C8A090', seed: 2 },
    ],
    people: [
      { id: 'hezekiah', at: [-0.7, 0.55], pose: 'swing', item: 'hammer', k: 0, cast: { crown: '#E0B040', beard: '#3A2418', hairCol: '#2A1A12', robe: '#5A3A7A', stripe: '#C8A040' } },
      { id: 'frozen', at: [0.54, -0.33], pose: 'offer', ...P(0, '#6E5A44') },                  // still holding out his offering
      { id: 'flinch', at: [0.77, 0.41], pose: 'shield', dir: 1, ...P(3, '#5E5A48') },          // flinching from the blow
      { id: 'plead', at: [0.44, -1.23], pose: 'plead', dir: -1, ...P(1, '#7E4E3A') },                    // pleading with the king
      { id: 'back', at: [1.86, -0.88], pose: 'walk', ...P(2, '#6A4E3A') },                    // backing away
    ],
  });
})();
