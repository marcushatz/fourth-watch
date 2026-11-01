const fs = require('fs');
// close-ups: oy shifts the ground line below the cell so the upper body is visible; scale 1.6
const cu = (fn, st, label, oy = -560, scale = 1.5, ox = 0) => ({ fn, st, label, scale, oy, ox });
const S = {};
S.zsam = { cols: 5, cw: 380, ch: 400, cells: [
  { fn: 'samson', orig: 1, st: {}, label: 'orig', scale: 1.5, oy: -470 },
  cu('samson', { pose: 'stand' }, 'stand', -470), cu('samson', { pose: 'point' }, 'point', -470, 1.5, -60), cu('samson', { pose: 'lean' }, 'lean', -470, 1.5, -40), cu('samson', { pose: 'wake' }, 'wake', -470),
  cu('samson', { pose: 'lookup' }, 'lookup', -470), cu('samson', { pose: 'pray' }, 'pray', -470), cu('samson', { pose: 'push' }, 'push', -440), cu('samson', { pose: 'grind' }, 'grind', -400, 1.5, -120), cu('samson', { pose: 'carry', phase: 1 }, 'carry', -480),
  cu('samson', { pose: 'stand', hair: 0, blind: true }, 'hair 0', -470), cu('samson', { pose: 'stand', hair: 0.1, blind: true }, 'hair .1', -470), cu('samson', { pose: 'stand', hair: 0.2, blind: true }, 'hair .2', -470), cu('samson', { pose: 'stand', hair: 0.3, blind: true }, 'hair .3', -470), cu('samson', { pose: 'sleep' }, 'sleep', -10, 1.2, -250),
]};
S.zcast = { cols: 6, cw: 330, ch: 330, cells: [
  cu('delilah', { pose: 'stand' }, 'del stand', -470), cu('delilah', { pose: 'turn' }, 'del turn', -470), cu('delilah', { pose: 'call' }, 'del call', -470), cu('delilah', { pose: 'sit' }, 'del sit', -380), cu('delilah', { pose: 'beckon' }, 'del beckon', -470, 1.5, -60),
  cu('bride', { pose: 'jar' }, 'bride jar', -470), cu('manoah', { pose: 'stand' }, 'manoah', -500), cu('manoah', { pose: 'object' }, 'manoah obj', -500), cu('mother', { pose: 'stand' }, 'mother', -470), cu('mother', { pose: 'awe' }, 'mother awe', -300),
  cu('angel', { pose: 'speak' }, 'angel', -540), cu('lord', { pose: 'stand' }, 'lord', -500), cu('lord', { pose: 'laugh' }, 'lord laugh', -500, 1.5, 60), cu('barber', { k: 0.5 }, 'barber', -400, 1.5, 60), cu('boy', { pose: 'lead' }, 'boy', -390),
  cu('person', { v: 0 }, 'p0', -500), cu('person', { v: 1 }, 'p1', -470), cu('person', { v: 6 }, 'p6', -500), cu('person', { v: 8, pose: 'cheer' }, 'p8', -470), cu('person', { v: 3, pose: 'hold', item: 'chains' }, 'p3 chains', -470),
  cu('lion', { pose: 'leap' }, 'lion leap', -150, 1.1, 120), cu('lion', { pose: 'crouch' }, 'lion crouch', -50, 1.1, 120),
]};
for (const k in S) fs.writeFileSync('out/specs/' + k + '.json', JSON.stringify(S[k]));
