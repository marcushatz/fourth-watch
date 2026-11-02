// The camera test's timing table, generated from the built score (so the document and the clip cannot disagree).
// Usage: node film_src/timing_table.js camtest [from] [to]  -> markdown on stdout. Every time is the voice's own word timing.
const path = require('path');
const dir = path.resolve(process.argv[2] || 'camtest'), T0 = +(process.argv[3] ?? 26.95), T1 = +(process.argv[4] ?? 37.6);
const S = require(path.join(dir, 'score.js')), VO = S.VO;
const words = VO.lines.flatMap((L) => L.words.map((w) => ({ w: w.w.replace(/[".,?]/g, ''), s: w.s, e: w.e, line: L.i })));
const f2 = (x) => x.toFixed(2);
// what is being said at time t: the word under it, or the pause before the next word
const wordAt = (t) => {
  const w = words.find((x) => t >= x.s - 1e-6 && t < x.e - 1e-6);
  if (w) { const into = t - w.s; return into < 0.06 ? `on "${w.w}"` : `during "${w.w}" (+${into.toFixed(2)})`; }
  const nx = words.find((x) => x.s > t); return nx ? `pause, ${(nx.s - t).toFixed(2)} s before "${nx.w}"` : 'after the last word';
};
const spoken = (a, b) => words.filter((x) => x.s < b && x.e > a).map((x) => x.w).join(' ') || '(silence)';
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], len = (v) => Math.hypot(...v);
const ang = (u, v) => { const c = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (len(u) * len(v)); return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI; };
const shots = S.SHOTS.filter((s) => s.t1 > T0 && s.t0 < T1);
let out = `| Shot | Time (s) | Length | Spoken over it |\n|---|---|---|---|\n`;
for (const s of shots) { const a = Math.max(T0, s.t0), b = Math.min(T1, s.t1); out += `| ${s.id} | ${f2(a)}–${f2(b)} | ${(b - a).toFixed(2)} s | ${spoken(a, b)} |\n`; }
out += `\n**Camera, key by key** (a move runs from one key to the next; "hold" = under 2 cm and 0.3°)\n\n| Shot | From → to (s) | Starts | Ends | Camera | Travel / turn |\n|---|---|---|---|---|---|\n`;
const seen = new Set();
for (const s of shots) {
  const P = s.dio && s.dio.cam && s.dio.cam.path; if (!P || seen.has(JSON.stringify(P))) continue; seen.add(JSON.stringify(P));
  const K = P.map((k) => ({ t: Math.max(s.t0, k.at), p: k.p, l: k.l, ease: k.ease || 'inOut' }));
  for (let i = 0; i < K.length - 1; i++) {
    const A = K[i], B = K[i + 1], a = Math.max(A.t, s.t0), b = Math.min(B.t, s.t1); if (b <= a + 1e-3 || b < T0 || a > T1) continue;
    const d = len(sub(B.p, A.p)), r = ang(sub(A.l, A.p), sub(B.l, B.p)), hold = d < 0.02 && r < 0.3;
    const kind = hold ? 'hold' : (B.ease.startsWith('cr') ? 'one continuous move (spline)' : (d / len(sub(A.l, A.p)) < 0.08 && r < 3 ? 'drift' : 'move')) + (hold ? '' : `, ease ${B.ease}`);
    out += `| ${s.id} | ${f2(a)} → ${f2(b)} | ${wordAt(a)} | ${wordAt(b)} | ${kind} | ${hold ? '–' : `${d.toFixed(2)} m, ${r.toFixed(1)}°`} |\n`;
  }
}
out += `\n**Action keys**\n\n| Time (s) | On the voice | What happens |\n|---|---|---|\n`;
const rows = [];
for (const s of shots) {
  const D = s.dio || {};
  if (D.keyFrom != null) rows.push([D.keyFrom, `${s.id}: the warm key light arrives (0.6 s)`]);
  if (D.rays) rows.push([D.rays.from, `${s.id}: gold rays from the upper left (${D.rays.dur ?? 0.8} s)`]);
  for (const x of D.fx || []) if (x.keys) x.keys.forEach(([t], i) => x.say && x.say[i] && rows.push([t, `${x.on}: ${x.say[i]}`]));
  for (const x of D.act || []) {
    if (x.kKeys && Array.isArray(x.say)) x.kKeys.forEach(([t], i) => x.say[i] && rows.push([t, x.say[i].startsWith(x.who) ? x.say[i] : `${x.who}: ${x.say[i]}`]));
    else if (typeof x.say === 'string') rows.push([x.at, x.say]);
    if (x.hKeys && x.hSay) x.hKeys.forEach(([t], i) => x.hSay[i] && rows.push([t, `${x.who}: ${x.hSay[i]}`]));
  }
}
const uniq = new Map(); for (const [t, w] of rows) if (t >= T0 - 0.01 && t <= T1) uniq.set(w + t.toFixed(3), [t, w]);
for (const [t, w] of [...uniq.values()].sort((a, b) => a[0] - b[0])) out += `| ${f2(t)} | ${wordAt(t)} | ${w} |\n`;
process.stdout.write(out);
