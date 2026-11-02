// Camera-direction test, revision 2 (Nov 2, Marcus 07:48): Numbers 21:7-9, VO lines 6-7, in the approved style.
// One camp. The bronze serpent's foot is at the origin; it lies toward -x until it is raised, and its head looks out
// along -x (in profile from R2 and R3; toward the man who looks, in R4). The near ground on +z is kept clear for the cameras of R1 and R2.
(function () {
  const D = globalThis.DIORAMA, FW = globalThis.FW;
  if (globalThis.PP) { globalThis.PP.simp = 3; globalThis.PP.inkK = 0; }
  const P = (v, robe, extra) => ({ v, cast: Object.assign({ robe }, extra || {}) });
  const INK = { amt: 0.85, w: 1.6, thr: 0.03, col: [0.16, 0.1, 0.07] };
  const rng = FW.rng(2107), ROBES = ['#5E4E3C', '#6A5A48', '#7E4E3A', '#5A4E40', '#8A5A42', '#6E5040', '#5E5A48', '#6A4E3A', '#7A6A52'];
  const SICK = 0.35;   // the bitten: drained toward grey-green (health 0 = dying, 1 = well)
  // the wider camp's suffering (21:6 "many people of Israel died"), each figure in one state, away from the staged ground
  const POSES = [['slump', -1], ['clutch', 1], ['kneel'], ['slump', 1], ['support', 1], ['bow'], ['clutch', -1], ['stand'], ['reach', 1], ['kneel']];
  const camp = [], tents = [];
  for (let i = 0; i < 54; i++) {
    const a = rng() * Math.PI * 2, r = 5.5 + rng() * 9, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > -1.5 && x > -6 && x < 3.5) continue;     // R1 and R2 look across this ground
    if (z < 0 && z > -8 && x > -4.5 && x < 4.5) continue;   // the waiting crowd is placed by hand
    const [pose, dir] = POSES[i % POSES.length];
    camp.push(Object.assign({ id: 'c' + i, at: [+x.toFixed(2), +z.toFixed(2)], pose, dir, health: pose === 'stand' || pose === 'support' ? undefined : SICK, look: pose === 'stand' ? [0, 0.8] : undefined }, P(i % 5, ROBES[i % ROBES.length])));
  }
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 + rng() * 0.3, r = 9 + rng() * 5; tents.push({ kind: 'tent2', at: [+(Math.cos(a) * r).toFixed(2), +(Math.sin(a) * r).toFixed(2)], rot: a + Math.PI / 2, col: ['#4A3A30', '#4A3628', '#54402E'][i % 3] }); }
  const vipers = []; for (let i = 0; i < 12; i++) { const a = rng() * 6.28, r = 2.5 + rng() * 8; const x = +(Math.cos(a) * r).toFixed(2), z = +(Math.sin(a) * r).toFixed(2); if (z > 0 && x > -5 && x < 2.5) continue; vipers.push({ kind: 'viper', at: [x, z], len: 0.6 + rng() * 0.4, seed: i, rot: rng() * 6 }); }
  // the people waiting on -z: they will lift their faces to the serpent (R3); each has one state
  const crowd = [
    ['w1', [0.55, -2.15], 'recover', 1], ['w2', [1.35, -3.0], 'clutch', -1], ['w3', [-0.1, -3.55], 'recover', 1], ['w4', [2.2, -2.5], 'support', -1],
    ['w5', [0.95, -4.3], 'recover', -1], ['w6', [-1.9, -4.2], 'kneel'], ['w7', [2.6, -4.6], 'slump', 1], ['w8', [-0.6, -5.2], 'recover', 1],
    ['w9', [1.6, -5.6], 'kneel'], ['w10', [-2.4, -2.9], 'clutch', 1], ['w11', [3.3, -3.4], 'recover', -1], ['w12', [0.3, -6.3], 'support', 1],
    ['w13', [-1.6, -6.2], 'slump', -1], ['w14', [2.7, -6.4], 'kneel'], ['w15', [-3.2, -5.3], 'recover', 1], ['w16', [-0.55, -1.4], 'recover', 1], ['w17', [-2.1, -1.75], 'clutch', 1],
  ].map(([id, at, pose, dir], i) => Object.assign({ id, at, pose, dir, k: 0, health: pose === 'support' ? undefined : SICK, look: pose === 'kneel' ? [0, 0.7] : undefined }, P(i % 5, ROBES[(i + 3) % ROBES.length])));
  D.set('camp', {
    style: 'paint', ink: INK, seed: 21, actorAmb: 0.92,
    skyOver: { top: '#222A4C', mid: '#6E5A7C', hor: '#E6B482', fog: '#CFA486', key: '#FFCF96', keyI: 3.0, hemi: ['#9C9AC4', '#7A5A40', 0.8], sunDir: [-0.95, 0.06, -0.3], tint: [0.98, 0.92, 0.87] },
    fog: [16, 80], sunPos: [-11, 7, -1],
    ground: { radius: 30, cols: ['#C29C6A', '#B89262', '#CBA676', '#BC9666'], hills: 0.5, seed: 13 },
    props: [
      { id: 'serpent', kind: 'serpent2', at: [0, 0], h: 3.0, face: -2.9, s: 1.2, headK: 1.7, longHead: true, lying: true, lie: 1.42 },
      { id: 'cairn', kind: 'cairn', at: [0, 0], s: 1.0 },
      { kind: 'boulders', at: [3.6, 1.2], s: 0.7, n: 3, seed: 8 }, { kind: 'boulders', at: [-4.6, -1.8], s: 0.8, n: 2, seed: 12 }, { kind: 'boulders', at: [-6.0, 4.2], s: 0.8, n: 3, seed: 6 },
      { kind: 'scrub', at: [2.6, 3.4], seed: 2 }, { kind: 'scrub', at: [-5.2, 1.4], seed: 5, s: 0.18 }, { kind: 'scrub', at: [3.9, -1.2], seed: 9 }, { kind: 'scrub', at: [-3.6, -3.4], seed: 4, s: 0.2 },
      ...tents, ...vipers,
      { id: 'fgsnake', kind: 'viper', at: [0.75, 2.6], len: 1.3, seed: 2, rot: 0.25 },     // R1: the danger, in the foreground
      { id: 'nsnake', kind: 'viper', at: [-0.4, -3.1], len: 0.8, seed: 5, rot: 0.9 },
      { kind: 'ridge', at: [0, -70], w: 260, h: 4.6, col: '#8E7A98', base: '#D8AE94', peak: 0.47, ph: 0.9, pw: 0.05, seed: 4 },
      { kind: 'ridge', at: [8, -44], w: 160, h: 1.8, col: '#B08C88', base: '#D9AE8E', seed: 9 },
      { kind: 'ridge', at: [-4, 60], w: 260, h: 3.2, col: '#93809A', base: '#D6AA90', seed: 11 },
    ],
    people: [
      { id: 'moses', at: [0.85, 1.25], pose: 'pray', k: 0, hires: true, cast: { old: true, beard: '#D8D2C4', hairCol: '#C8C2B4', robe: '#7A5A3E', stripe: '#C9B48E' } },   // praying for the people (21:7)
      { id: 'sick1', at: [2.05, 2.1], pose: 'slump', dir: -1, health: SICK, ...P(2, '#6A5A48') },        // R1: a bitten man near the lens
      { id: 'sick2', at: [-0.25, 0.05], pose: 'clutch', dir: -1, health: SICK, ...P(4, '#8A5A42') },      // R1: behind Moses
      { id: 'sick3', at: [2.4, -0.4], pose: 'support', dir: -1, ...P(1, '#7E4E3A') }, { id: 'sick4', at: [1.75, -0.55], pose: 'slump', dir: 1, health: SICK, ...P(3, '#5A4E40') },   // R1: a woman holding up her husband
      { id: 'h1', at: [-3.35, -0.32], pose: 'heave', dir: 1, k: 0.5, hidden: true, ...P(3, '#6A5A48') },    // lifts the pole with Moses (R2)
      { id: 'h2', at: [0.42, 0.3], pose: 'brace', dir: -1, hidden: true, ...P(0, '#5E4E3C') },               // foots the pole (R2)
      { id: 'looker', at: [-1.6, -2.75], pose: 'recover', dir: -1, k: 0, health: 0, healthWarm: 0.06, hires: true, ...P(0, '#5E4E3C') },   // bitten; he looks, and lives
      { id: 'tender', at: [-1.05, -2.6], pose: 'tend', dir: -1, k: 0, hires: true, ...P(1, '#7E4E3A') },                                // his wife, holding him
      ...crowd, ...camp,
    ],
  });
})();
