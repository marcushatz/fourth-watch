const fs = require('fs');
const S = {};
const sam = (pose, st = {}, label) => ({ fn: 'samson', st: Object.assign({ pose }, st), label: label || pose, scale: 0.62 });
S.samson = { cols: 6, cw: 330, ch: 430, cells: [
  { fn: 'samson', orig: 1, st: {}, label: 'PP.samson orig', scale: 0.62 },
  sam('stand'), sam('walk', { phase: 0.9 }, 'walk ph.9'), sam('walk', { phase: 2.6 }, 'walk ph2.6'), sam('carry', { phase: 1 }), sam('point'),
  sam('lean'), Object.assign(sam('sleep'), { ox: 0, oy: 120 }), sam('wake', { k: 0.5 }), { fn: 'samson', orig: 1, st: { strain: 1, t: 0.3 }, label: 'PP strain', scale: 0.62 }, sam('strain', { t: 0.3 }, 'strain rope'), sam('strain', { bonds: 'bowstring' }, 'strain bow'),
  sam('strain', { bonds: 'loom' }, 'strain loom'), { fn: 'samson', orig: 1, st: { strain: 1, burst: 1, brk: 0.4 }, label: 'PP burst', scale: 0.62 }, sam('burst', { brk: 0.4 }, 'burst rope .4'), sam('burst', { bonds: 'bowstring', brk: 0.35 }, 'burst bow'), sam('burst', { bonds: 'loom', brk: 0.3 }, 'burst loom'), sam('burst', { bonds: 'none', gold: 1 }, 'burst gold'),
  sam('grind'), sam('lookup'), sam('pray'), sam('push'), sam('stand', { hair: 0.6 }, 'hair .6'), sam('stand', { hair: 0.15, blind: true, shackles: true }, 'hair.15 blind'),
]};
S.cast = { cols: 6, cw: 330, ch: 430, cells: [
  ...['stand', 'turn', 'call', 'sit', 'beckon'].map((p) => ({ fn: 'delilah', st: { pose: p }, label: 'delilah ' + p, scale: 0.62 })),
  ...['stand', 'jar'].map((p) => ({ fn: 'bride', st: { pose: p }, label: 'bride ' + p, scale: 0.62 })),
  ...['stand', 'object', 'worried'].map((p) => ({ fn: 'manoah', st: { pose: p, shake: 0.6 }, label: 'manoah ' + p, scale: 0.62 })),
  ...['stand', 'object', 'awe', 'worried'].map((p) => ({ fn: 'mother', st: { pose: p, shake: -0.6 }, label: 'mother ' + p, scale: 0.62 })),
  ...['stand', 'speak'].map((p) => ({ fn: 'angel', st: { pose: p }, label: 'angel ' + p, scale: 0.56 })),
  ...['stand', 'laugh', 'fall'].map((p) => ({ fn: 'lord', st: { pose: p }, label: 'lord ' + p, scale: 0.62 })),
  { fn: 'barber', st: { k: 0.5 }, label: 'barber shave', scale: 0.62 }, { fn: 'boy', st: { pose: 'lead', phase: 1 }, label: 'boy lead', scale: 0.62 },
  ...['crouch', 'leap', 'thrown'].map((p) => ({ fn: 'lion', st: { pose: p }, label: 'lion ' + p, scale: 0.42, oy: 60 })),
  { fn: 'soldierFall', st: { k: 0.4 }, label: 'soldierFall', scale: 0.62 },
]};
S.crowd = { cols: 12, cw: 200, ch: 300, cells: [] };
for (const pose of ['stand', 'raise', 'hold', 'kneel', 'cheer', 'fall']) for (let v = 0; v < 12; v++) S.crowd.cells.push({ fn: 'person', st: { v, pose, item: ['scroll', 'chains', 'staff'][v % 3] }, label: pose[0] + v, scale: 0.4, oy: 20 });
fs.mkdirSync('out/specs', { recursive: true });
for (const k in S) fs.writeFileSync('out/specs/' + k + '.json', JSON.stringify(S[k]));
console.log(Object.keys(S).join(' '));
