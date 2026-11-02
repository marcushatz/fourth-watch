// Camera-direction test (Nov 2): Numbers 21:7-9 in the approved style, one camp set crossed by four very different cameras.
(function () {
  const D = globalThis.DIORAMA, FW = globalThis.FW;
  if (globalThis.PP) { globalThis.PP.simp = 3; globalThis.PP.inkK = 0; }
  const P = (v, robe, extra) => ({ v, cast: Object.assign({ robe }, extra || {}) });
  const INK = { amt: 0.85, w: 1.6, thr: 0.03, col: [0.16, 0.1, 0.07] };
  const rng = FW.rng(2107), ROBES = ['#5E4E3C', '#6A5A48', '#7E4E3A', '#5A4E40', '#8A5A42', '#6E5040', '#5E5A48', '#6A4E3A', '#7A6A52'];
  // the camp's suffering (21:6 "many people of Israel died"): figures among the tents, each in one state
  const POSES = [['slump', -1], ['clutch', 1], ['kneel'], ['slump', 1], ['support', 1], ['bow'], ['clutch', -1], ['stand'], ['reach', 1], ['kneel']];
  const camp = [], tents = [];
  for (let i = 0; i < 46; i++) {
    const a = rng() * Math.PI * 2, r = 3.0 + rng() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (x > 0 && x < 5 && z > 0 && z < 6) continue;   // the near ground belongs to the close cameras (T2-T4 stage it by hand)
    const [pose, dir] = POSES[i % POSES.length];
    camp.push(Object.assign({ id: 'c' + i, at: [+x.toFixed(2), +z.toFixed(2)], pose, dir, look: pose === 'stand' ? [0, 0.8] : undefined }, P(i % 5, ROBES[i % ROBES.length])));
  }
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + rng() * 0.3, r = 8 + rng() * 5; tents.push({ kind: 'tent2', at: [+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2)], rot: a + Math.PI / 2, col: ['#4A3A30', '#4A3628', '#54402E'][i % 3] }); }
  const vipers = []; for (let i = 0; i < 14; i++) { const a = rng() * 6.28, r = 1.5 + rng() * 8; vipers.push({ kind: 'viper', at: [+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2)], len: 0.6 + rng() * 0.4, seed: i, rot: rng() * 6 }); }
  D.set('camp', {
    style: 'paint', ink: INK, seed: 21, actorAmb: 0.92,
    skyOver: { top: '#222A4C', mid: '#6E5A7C', hor: '#E6B482', fog: '#CFA486', key: '#FFCF96', keyI: 3.0, hemi: ['#9C9AC4', '#7A5A40', 0.8], sunDir: [-0.95, 0.06, -0.3], tint: [0.98, 0.92, 0.87] },
    fog: [16, 80], sunPos: [-11, 7, -1],
    ground: { radius: 30, cols: ['#C29C6A', '#B89262', '#CBA676', '#BC9666'], hills: 0.5, seed: 13 },
    props: [
      { id: 'serpent', kind: 'serpent2', at: [0, 0], h: 3.0, face: 0.45, s: 1.2, lying: true, lie: 1.42 },
      { kind: 'cairn', at: [0, 0], s: 1.2 },
      { kind: 'boulders', at: [3.4, -2.4], s: 0.7, n: 3, seed: 8 }, { kind: 'boulders', at: [-3.8, -3.2], s: 0.9, n: 2, seed: 12 }, { kind: 'boulders', at: [-5.5, 4.5], s: 0.8, n: 3, seed: 6 },
      { kind: 'scrub', at: [3.0, 2.6], seed: 2 }, { kind: 'scrub', at: [-2.2, 0.4], seed: 5, s: 0.18 }, { kind: 'scrub', at: [1.9, -3.6], seed: 9 }, { kind: 'scrub', at: [-0.9, 3.9], seed: 4, s: 0.2 },
      ...tents, ...vipers,
      { kind: 'viper', at: [1.66, 3.0], len: 0.9, seed: 2, rot: 0.4 },
      { kind: 'ridge', at: [0, -70], w: 260, h: 4.6, col: '#8E7A98', base: '#D8AE94', peak: 0.47, ph: 0.9, pw: 0.05, seed: 4 },
      { kind: 'ridge', at: [8, -44], w: 160, h: 1.8, col: '#B08C88', base: '#D9AE8E', seed: 9 },
    ],
    people: [
      { id: 'moses', at: [-0.52, -0.1], pose: 'raise', cast: { old: true, beard: '#D8D2C4', hairCol: '#C8C2B4', robe: '#7A5A3E', stripe: '#C9B48E' } },   // praying for the people (21:7)
      { id: 'h1', at: [-1.7, -0.4], pose: 'stand', ...P(3, '#6A5A48') }, { id: 'h2', at: [-2.6, -0.35], pose: 'stand', ...P(2, '#5E4E3C') },               // the men who raise the pole
      { id: 'looker', at: [1.12, 1.76], pose: 'clutch', dir: -1, hires: true, ...P(0, '#5E4E3C') },                                                     // bitten; he will look and live
      { id: 'sick', at: [0.05, 2.13], pose: 'slump', dir: -1, ...P(2, '#6A5A48') }, { id: 'helper', at: [-0.41, 1.94], pose: 'support', dir: 1, ...P(4, '#8A5A42') },
      { id: 'woman', at: [0.01, -2.29], pose: 'kneel', look: [0.1, 0.6], ...P(1, '#7E4E3A') }, { id: 'b2', at: [2.3, -1.1], pose: 'clutch', dir: 1, ...P(3, '#5A4E40') },
      ...camp,
      // T3: the bitten people in the serpent's line of sight (shown for T3 only), each in one state, faces turned up to it
      ...[['q1', [2.22, 2.29], 'beseech', -1], ['q2', [1.59, 3.03], 'kneel'], ['q3', [2.69, 3.33], 'slump', -1], ['q4', [2.07, 4.11], 'support', -1], ['q5', [3.02, 2.63], 'stand'],
        ['q6', [2.97, 4.16], 'kneel'], ['q7', [3.82, 4.1], 'clutch', 1], ['q8', [3.09, 5.02], 'relief'], ['q9', [4.03, 3.18], 'beseech', -1], ['q11', [0.83, 2.63], 'kneel']]
        .map(([id, at, pose, dir], i) => Object.assign({ id, at, pose, dir, hidden: true, look: ['kneel', 'stand', 'relief', 'support'].includes(pose) ? [-0.4, -1] : undefined }, P(i % 5, ROBES[(i + 3) % ROBES.length]))),
    ],
  });
})();
