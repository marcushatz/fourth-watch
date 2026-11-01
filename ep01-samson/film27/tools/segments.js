// print the re-render segments: [name, t0, t1] for shot groups changed after parts A/B were rendered
const S = require('../score.js');
const g = (a, b) => { const A = S.SHOTS.find((s) => s.id === a), B = S.SHOTS.find((s) => s.id === b); return [a + (a === b ? '' : '-' + b), A.t0, B.t1]; };
const segs = [g('S03', 'S03'), g('S07', 'S09'), g('S13', 'S14'), g('S18', 'S18'), g('S22', 'S22'), g('S25', 'S25'), g('S28', 'S28')];
for (const [n, a, b] of segs) console.log(n, a.toFixed(4), b.toFixed(4));
