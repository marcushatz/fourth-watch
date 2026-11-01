// FOURTH WATCH · Ep 1 (v27) score: an ambient, reverent bed in D minor that opens to D major at "No." (point 3)
// and the dawn. Every hit is read from score.js (shot beats from the VO word times) and from the same formulas the
// scenes use, so the music moves with the voice and lands on the picture.
//   node song.js        STEMS=1 also writes out/stem-*.wav · LUFS=-16 masters the music bed to a loudness target
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, cue, ln, st, SHOTS, m, VO } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const pad = bus(), str = bus(), low = bus(), keys = bus(), perc = bus(), fx = bus();
const verb = bus(), dly = bus();
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const shot = (id) => SHOTS.find((s) => s.id === id);
const voEnd = VO.voEnd;

// ---------- key moments (same formulas the scenes use) ----------
const s03 = shot('S03'), s06 = shot('S06'), s07 = shot('S07'), s08 = shot('S08'), s11 = shot('S11'), s12 = shot('S12'), s13 = shot('S13');
const s15 = shot('S15'), s17 = shot('S17'), s23 = shot('S23'), s26 = shot('S26'), s29 = shot('S29'), s30 = shot('S30'), s31 = shot('S31'), s32 = shot('S32');
const tTear = s03.beats.carried;
const tLion = s06.beats.again + 0.02, tAsh = s07.beats.rushed, tLehi = s08.t0 + 0.6;
const stamps = (() => { const t0 = s11.beats.shout - 0.05, t1 = s11.t1 - 0.15, step = Math.max(0.45, (t1 - t0) / 4.4); return [0, 1, 2, 3].map((n) => t0 + n * step); })();
const snaps = (() => { const c2 = Math.min(s12.t1 - 0.5, (s12.beats.broke ?? s12.t0 + s12.dur * 0.67) - 0.08), c1 = (s12.t0 + c2) / 2, cuts = [s12.t0, c1, c2, s12.t1]; return [0, 1, 2].map((i) => cuts[i] + Math.min(0.3, (cuts[i + 1] - cuts[i]) * 0.45)); })();
const tShaved = s13.beats.shaved, tLeft = s15.beats.left, tAngel = s17.beats.angel, tNever = s23.beats.never;
const tNo = s26.beats.no, tAnswered = s30.beats.answered, tGive = s30.beats.house - 0.02, tLand = s30.beats.fell - 0.07;
const tSamsonLit = s31.beats.names, tDawn = s32.t0, endCard = voEnd + 0.4;

// ---------- harmony: [start, chord]: each chord lasts until the next ----------
const C = {
  Dm: [50, 53, 57, 62], Dm2: [50, 57, 62, 65], Bb: [46, 53, 58, 62], Gm: [43, 50, 55, 58], A: [45, 52, 57, 61], Asus: [45, 52, 57, 62],
  C: [48, 52, 55, 60], F: [41, 48, 53, 57], Fh: [53, 57, 60, 65], CE: [40, 48, 55, 60], D: [50, 54, 57, 62], Dh: [50, 57, 62, 66], G: [43, 50, 55, 59],
  Bm: [47, 54, 59, 62], Gm2: [43, 55, 58, 62], Em: [40, 47, 52, 55],
};
const prog = [
  [0, 'Dm'], [cue(0, 'kept'), 'Bb'], [st(1), 'Dm'], [cue(1, 'that'), 'Gm'], [tTear - 0.05, 'Bb'], [st(2), 'Asus'], [st(3), 'F'],
  [st(4), 'Dm'], [tAsh - 0.05, 'Bb'], [tLehi - 0.05, 'C'], [st(5), 'Dm2'], [cue(5, 'objection'), 'Bb'], [cue(5, '"she'), 'A'],
  [st(6), 'Dm'], [s11.t0, 'Gm2'], [st(8), 'Dm'], [st(9), 'Bb'], [cue(9, 'hair'), 'Gm'], [tShaved - 0.05, 'A'],
  [st(10), 'Dm'], [cue(10, 'shake'), 'Asus'], [st(11), 'Gm'], [tLeft - 0.05, 'Dm2'],
  [st(12), 'F'], [st(13), 'C'], [tAngel - 0.05, 'F'], [st(14), 'Bb'], [cue(14, 'LORD'), 'F'], [cue(14, 'seeking'), 'C'],
  [st(15), 'Bb'], [cue(15, 'reward'), 'Gm'], [st(16), 'Asus'], [st(17), 'Dm'], [st(18), 'Bb'], [cue(18, 'prophesy'), 'Gm'], [cue(18, 'mighty'), 'A'],
  [tNever - 0.05, 'Dm2'], [st(20), 'Bb'], [cue(20, 'principle'), 'Gm'], [cue(20, 'knowing'), 'A'], [st(21), 'Dm'],
  [tNo - 0.05, 'D'], [cue(22, 'Look'), 'G'], [st(23), 'D'], [cue(23, 'grow'), 'Bm'], [st(24), 'G'], [st(25), 'Dm'], [cue(25, 'remember'), 'Bb'], [cue(25, 'strengthen'), 'C'],
  [tAnswered - 0.05, 'D'], [tGive, 'Dm'], [st(27), 'Bb'], [tSamsonLit - 0.05, 'F'], [cue(27, '"were'), 'C'],
  [tDawn - 0.05, 'D'], [cue(28, 'purpose'), 'G'], [cue(28, 'verdict'), 'Bm'], [st(29), 'G'], [cue(29, 'proof'), 'A'], [st(30), 'D'], [cue(30, 'verdict'), 'Dh'],
  [st(31), 'G'], [cue(31, 'gifts'), 'A'], [st(32), 'Bm'], [cue(32, 'answered'), 'G'], [cue(32, 'comments'), 'D'], [endCard + 0.6, 'D'],
];
prog.sort((a, b) => a[0] - b[0]);
const quiet = (t) => (t > endCard + 1.6 ? 0.5 : 1);
const brightAt = (t) => (t >= tNo && !(t >= st(25) && t < tAnswered)) || (t >= st(12) && t < st(17));

for (let i = 0; i < prog.length; i++) {
  const [t0, name] = prog[i], t1 = i + 1 < prog.length ? prog[i + 1][0] : DURATION;
  const dur = Math.max(0.3, t1 - t0) + 0.6, notes = C[name], bright = brightAt(t0) ? 1 : 0;
  for (const n of notes) { const { L, R } = I.padNote(n, dur, { cutoff: bright ? 1900 : 1150, attack: 0.6, release: 1.6, seed: 10 + n }); pad.addStereo(L, R, t0, 0.07 * quiet(t0)); }
  for (const n of notes.slice(2)) { const s = I.strings(n + 12, dur, { attack: 0.5, release: 1.2, bright: 0.65 + 0.35 * bright, seed: n }); str.addStereo(s.L, s.R, t0, 0.045 * quiet(t0)); verb.addStereo(s.L, s.R, t0, 0.03); }
}
// a low D drone under the night sections
const drone = (t0, t1, midi = 38, g = 0.12) => { const { L, R } = I.padNote(midi, t1 - t0, { cutoff: 380, attack: 1.2, release: 2.0, seed: 3 }); low.addStereo(L, R, t0, g); };
drone(0, st(4) - 0.2); drone(st(6), st(12) - 0.3, 38, 0.13); drone(st(21) - 0.2, tNo - 0.1, 38, 0.13); drone(st(25), tAnswered + 0.3, 38, 0.13); drone(endCard + 0.4, DURATION, 38, 0.1);

const hit = (t, g = 0.6, o = {}) => { perc.addMono(I.timpani(m(o.n || 'D2'), { decay: o.decay || 1.4 }), t, g); perc.addMono(I.thud(70, 0.12), t, g * 0.8); perc.addMono(I.subBoom(o.boom || 1.6, 58, 30), t, g * 0.7); verb.addMono(I.timpani(m(o.n || 'D2')), t, 0.22); };
const riser = (t, len = 0.9, g = 0.16) => fx.addMono(I.noiseSweep(len, 400, 5000, { q: 0.9, shape: (x) => x * x, pink: true }), t - len, g);
const bell = (t, n = 'D6', g = 0.09) => { const b = I.bell(hz(m(n)), 0.5, 1.4, 2.0); keys.addMono(b, t, g); verb.addMono(b, t, 0.12); };

// ---------- hook + Gaza: a slow heartbeat, the tear ----------
for (let t = 0.6; t < tTear - 0.5; t += 1.4) { perc.addMono(I.timpani(m('D2'), { decay: 0.6 }), t, 0.14); perc.addMono(I.timpani(m('D2'), { decay: 0.5 }), t + 0.28, 0.08); }
riser(tTear, 1.1, 0.2); hit(tTear, 0.8, { boom: 2.2 }); perc.addMono(I.crash(18), tTear, 0.14);
fx.addMono(I.noiseSweep(1.8, 2600, 160, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tTear + 0.02, 0.18); // dust settling
bell(st(3) + 0.15, 'A5', 0.07); // the Bible opens

// ---------- the Spirit rushed: three hits, a pulse that builds between them ----------
for (let t = st(4) + 0.1, k = 0; t < tLehi + 0.6; t += 0.31, k++) {
  if ([tLion, tAsh, tLehi].some((h) => t > h - 0.16 && t < h + 0.42)) continue;
  const midi = k % 4 === 3 ? m('A2') : m('D2'), g = 0.14 + 0.14 * Math.min(1, (t - st(4)) / 5);
  low.addMono(I.pizz(midi, { seed: k }), t, g, -0.1); if (k % 2 === 0) low.addMono(I.pizz(midi + 12, { seed: k + 50 }), t, g * 0.5, 0.15);
}
for (const [t, g] of [[tLion, 0.55], [tAsh, 0.65], [tLehi, 0.75]]) { riser(t); hit(t, g); }
{ const s = I.strings(m('A4'), 2.6, { attack: 0.08, release: 1.4, bright: 1.1 }); str.addStereo(s.L, s.R, tLehi, 0.06); verb.addStereo(s.L, s.R, tLehi, 0.05); }
bell(cue(5, '"she') - 0.05, 'D6', 0.08); // the label lands

// ---------- Delilah: four stamps, three snaps, the shaving ----------
stamps.forEach((t, n) => { perc.addMono(I.thud(80, 0.14), t, n === 3 ? 0.75 : 0.5); perc.addMono(I.timpani(m(n === 3 ? 'A1' : 'D2'), { decay: 0.7 }), t, n === 3 ? 0.4 : 0.25); });
snaps.forEach((t) => { hit(t, 0.5, { decay: 0.9 }); fx.addMono(I.noiseSweep(0.25, 6000, 1500, { q: 1.1, pink: false }), t, 0.12); });
{ const s = I.strings(m('C#4'), 3.0, { attack: 1.2, release: 0.6, bright: 0.8 }); str.addStereo(s.L, s.R, cue(9, 'hair') - 0.4, 0.05); } // the razor: a tightening line
{ const s = I.strings(m('D3'), 2.4, { attack: 0.05, release: 1.6, bright: 0.5 }); str.addStereo(s.L, s.R, tShaved, 0.06); } // the gold goes out
// "the LORD had left him": everything thins to a single low note
{ const { L, R } = I.padNote(38, 4.2, { cutoff: 300, attack: 0.05, release: 2.2, seed: 9 }); low.addStereo(L, R, tLeft, 0.2); perc.addMono(I.subBoom(2.4, 45, 22), tLeft, 0.4); }

// ---------- point 1: the angel, the plan ----------
bell(st(12) + 0.05, 'D6', 0.1);
[m('A5'), m('D6'), m('F6'), m('A6'), m('D7')].forEach((n, i) => { const b = I.musicBox(n); keys.addMono(b, tAngel + i * 0.13, 0.1, -0.4 + i * 0.2); verb.addMono(b, tAngel + i * 0.13, 0.12); dly.addMono(b, tAngel + i * 0.13, 0.05); });
bell(cue(14, '"it') - 0.05, 'F5', 0.08);
bell(cue(15, 'plan'), 'A5', 0.08); perc.addMono(I.pizz(m('D2'), { seed: 7 }), cue(15, 'reward'), 0.2);

// ---------- point 2: the door ----------
bell(st(17) + 0.05, 'D6', 0.1);
{ const s = I.strings(m('A4'), shot('S22').dur + 0.5, { attack: 3.0, release: 1.0, bright: 0.9 }); str.addStereo(s.L, s.R, shot('S22').t0, 0.05); } // rising plea
{ perc.addMono(I.subBoom(3.0, 50, 24), tNever, 0.55); perc.addMono(I.timpani(m('A1'), { decay: 2.0 }), tNever, 0.45); verb.addMono(I.timpani(m('A1')), tNever, 0.3); }
for (let t = cue(20, 'principle'), k = 0; t < st(21) - 0.3; t += 0.42, k++) low.addMono(I.pizz([m('D3'), m('A2')][k % 2], { seed: 300 + k }), t, 0.12, k % 2 ? 0.2 : -0.2);

// ---------- point 3: "No." first light, the hair, the prayer, the fall ----------
{ const b1 = I.bell(hz(m('D6')), 0.9, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.8, 1.2, 2.0); keys.addMono(b1, tNo, 0.13, -0.1); keys.addMono(b2, tNo + 0.02, 0.08, 0.15); verb.addMono(b1, tNo, 0.22); dly.addMono(b1, tNo, 0.08);
  const s = I.strings(m('F#5'), 4.0, { attack: 1.2, release: 2, bright: 1 }); str.addStereo(s.L, s.R, tNo, 0.05); }
[m('D6'), m('F#6'), m('A6')].forEach((n, i) => { const b = I.musicBox(n); keys.addMono(b, cue(23, 'grow') + i * 0.2, 0.07); verb.addMono(b, cue(23, 'grow') + i * 0.2, 0.1); });
bell(cue(24, 'pray'), 'A5', 0.07);
{ const s = I.strings(m('D4'), shot('S29').t1 - cue(25, 'prayed') + 0.4, { attack: 2.4, release: 0.8, bright: 0.85 }); str.addStereo(s.L, s.R, cue(25, 'prayed'), 0.05); }
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0); keys.addMono(b1, tAnswered, 0.12); verb.addMono(b1, tAnswered, 0.25); dly.addMono(b1, tAnswered, 0.08); }
for (let i = 0; i < 16; i++) { const t = tAnswered + 0.25 + i * ((tGive - tAnswered - 0.3) / 16); perc.addMono(I.timpani(m('D2'), { decay: 0.35, seed: i }), t, 0.1 + 0.25 * (i / 15)); } // roll into the fall
fx.addMono(I.noiseSweep(1.3, 200, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), tGive - 1.3, 0.2);
perc.addMono(I.subBoom(2.0, 55, 26), tGive, 0.6); perc.addMono(I.thud(60, 0.2), tGive, 0.6);
perc.addMono(I.subBoom(3.2, 50, 22), tLand, 0.95); perc.addMono(I.timpani(m('D2'), { decay: 2.2 }), tLand, 0.8); perc.addMono(I.crash(21), tLand, 0.22); verb.addMono(I.timpani(m('D2'), { decay: 2 }), tLand, 0.35);
fx.addMono(I.noiseSweep(3.4, 2400, 120, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tLand, 0.32); // rumble settling
bell(tSamsonLit, 'A5', 0.09);

// ---------- the dawn and the landing: a warm motif ----------
for (let t = tDawn + 0.1, k = 0; t < st(32) - 0.3; t += 0.5, k++) { const n = [m('D4'), m('A4'), m('F#4'), m('A4')][k % 4]; const e = I.epiano(n, 0.6, { decay: 1.2 }); keys.addMono(e, t, 0.06, k % 2 ? 0.2 : -0.2); verb.addMono(e, t, 0.05); }
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.9, 1.2, 2.0); const t = cue(30, 'verdict'); keys.addMono(b1, t, 0.12, -0.1); keys.addMono(b2, t + 0.02, 0.07, 0.15); verb.addMono(b1, t, 0.22); dly.addMono(b1, t, 0.08); }
[[0, 'D5'], [0.55, 'F#5'], [1.1, 'A5'], [2.2, 'G5'], [2.75, 'F#5'], [3.3, 'E5']].forEach(([d, n]) => { const e = I.epiano(m(n), 0.9, { decay: 1.6 }); keys.addMono(e, st(32) + 0.2 + d, 0.07); verb.addMono(e, st(32) + 0.2 + d, 0.08); });
bell(endCard, 'D6', 0.1);

// ---------- mix ----------
const stems = { pad, str, low, keys, perc, fx, verb: reverb(verb, { room: 0.9, damp: 0.35 }), dly: pingpong(dly, 0.42, 0.35, 3200) };
const GAIN = { pad: 1.6, str: 3.2, low: 1.3, keys: 1.5, perc: 0.42, fx: 0.7, verb: 1.1, dly: 0.9 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 28);
MIX.fadeOut(mix, DURATION - 1.4, DURATION - 0.05);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.7'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -16 });
MIX.writeWav(path.join(out, process.env.OUTWAV || 'music.wav'), mix);
console.log(`wrote out/${process.env.OUTWAV || 'music.wav'} (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
