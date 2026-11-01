// FOURTH WATCH · Ep 1 score — an ambient, reverent bed (D minor, opening to D major at the turn: "first light").
// Every hit is read from score.js (which reads the VO word times), so the music moves with the voice.
//   node song.js            STEMS=1 also writes out/stem-*.wav · LUFS=-16 masters to a loudness target
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, ev, cue, ln, m } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const pad = bus(), str = bus(), low = bus(), keys = bus(), perc = bus(), fx = bus();
const verb = bus(), dly = bus();
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

// ---------- key moments (same cues the film uses) ----------
const tb = cue(0, 'give');                 // ropes burn off in the hook
const tCatch = cue(3, 'apart');            // the lion is caught
const tStrike = cue(3, 'thousand');        // the jawbone strike
const tAngel = cue(4, 'angel');
const tPlan = cue(9, 'plan');
const tTurn = ev.turn;                     // "So God didn't give Samson strength because he deserved it…"
const tPrayed = ev.prayed, tAnswered = ev.answered;
const tCame = cue(14, 'came');             // the pillars go (shake in SH17)
const tExt = cue(14, 'He') - 0.12;         // cut to the temple from outside
const tSubdued = cue(15, 'subdued');
const tLit = cue(16, 'Samson');            // Hebrews 11: SAMSON lights up
const tRemember = ev.remember;

// ---------- harmony: [start, chord] — each chord lasts until the next ----------
const C = {
  Dm: [50, 53, 57, 62], Dm2: [50, 57, 62, 65], Bb: [46, 53, 58, 62], Gm: [43, 50, 55, 58], A: [45, 52, 57, 61], Asus: [45, 52, 57, 62],
  C: [48, 52, 55, 60], F: [41, 48, 53, 57], Fh: [53, 57, 60, 65], CE: [40, 48, 55, 60], D: [50, 54, 57, 62], Dh: [50, 57, 62, 66], G: [43, 50, 55, 59],
  Bm: [47, 54, 59, 62], DF: [42, 50, 57, 62], Gm2: [43, 55, 58, 62],
};
const prog = [
  [0, 'Dm'], [ln(1).start, 'Dm'], [cue(1, 'Philistine'), 'Bb'], [ln(2).start, 'Gm'], [cue(2, 'how'), 'Asus'], [cue(2, 'strength'), 'A'],
  [ln(3).start, 'Dm'], [tStrike - 0.05, 'Bb'], [cue(3, 'jawbone'), 'A'],
  [ln(4).start, 'F'], [cue(4, 'mother'), 'CE'], [ln(5).start, 'Dm2'], [cue(5, 'hand'), 'Bb'],
  [ln(6).start, 'Dm'], [cue(6, 'begin'), 'C'], [ln(7).start, 'Bb'], [cue(7, 'Israel'), 'A'],
  [ln(8).start, 'Gm'], [cue(8, 'hand'), 'A'],
  [ln(9).start, 'Dm'], [cue(9, 'wrong'), 'Bb'], [tPlan - 0.1, 'F'], [ln(10).start, 'Fh'], [cue(10, 'seeking'), 'C'],
  [ln(11).start, 'Bb'], [cue(11, 'God'), 'C'], [cue(11, 'free'), 'Asus'],
  [tTurn - 0.05, 'Dh'], [cue(12, 'gave'), 'G'], [cue(12, 'needed'), 'D'],
  [ln(13).start, 'Dm'], [cue(13, 'eyes'), 'Gm2'], [tPrayed - 0.1, 'Bb'], [cue(13, 'strengthen'), 'C'],
  [tAnswered - 0.05, 'D'], [tCame - 0.02, 'Dm'],
  [ln(15).start, 'Bb'], [cue(15, 'Later'), 'F'], [ev.david - 0.05, 'C'], [tSubdued, 'Dm'],
  [ln(16).start, 'F'], [cue(16, 'lists'), 'C'], [ev.faithful, 'Bb'],
  [ev.dawn - 0.05, 'D'], [cue(17, 'Because'), 'G'], [cue(17, 'about'), 'Bm'], [cue(17, 'people'), 'A'], [cue(17, 'saving'), 'D'],
  [ln(18).start, 'G'], [cue(18, 'messed'), 'D'], [cue(18, 'God'), 'Bm'], [cue(18, 'use'), 'A'], [tRemember - 0.05, 'Dh'],
  [ev.endCard + 0.6, 'D'],
];
prog.sort((a, b) => a[0] - b[0]);
const quiet = (t) => (t > ev.endCard + 1.6 ? 0.5 : 1);

// pads + strings for every chord (soft attack; brighter after the turn)
for (let i = 0; i < prog.length; i++) {
  const [t0, name] = prog[i], t1 = i + 1 < prog.length ? prog[i + 1][0] : DURATION;
  const dur = Math.max(0.3, t1 - t0) + 0.6, notes = C[name], bright = t0 >= tTurn && !(t0 >= ln(13).start && t0 < tAnswered) ? 1 : 0;
  for (const n of notes) {
    const { L, R } = I.padNote(n, dur, { cutoff: bright ? 1900 : 1150, attack: 0.6, release: 1.6, seed: 10 + n });
    pad.addStereo(L, R, t0, 0.07 * quiet(t0));
  }
  // strings carry the top two voices an octave up (lighter under the voice)
  for (const n of notes.slice(2)) { const s = I.strings(n + 12, dur, { attack: 0.5, release: 1.2, bright: 0.65 + 0.35 * bright, seed: n }); str.addStereo(s.L, s.R, t0, 0.05 * quiet(t0)); verb.addStereo(s.L, s.R, t0, 0.03); }
}

// a low D drone under the minor sections (the night), lifted at the turn and the dawn
const drone = (t0, t1, midi = 38, g = 0.12) => { const { L, R } = I.padNote(midi, t1 - t0, { cutoff: 380, attack: 1.2, release: 2.0, seed: 3 }); low.addStereo(L, R, t0, g); };
drone(0, tTurn - 0.3); drone(ln(13).start - 0.2, tAnswered + 0.4, 38, 0.13); drone(tCame, ln(15).start + 1.0, 38, 0.1); drone(ev.endCard + 0.4, DURATION, 38, 0.1);

// ---------- the hook: ropes burn off ----------
fx.addMono(I.noiseSweep(1.2, 300, 6000, { q: 0.8, shape: (x) => x * x * x, pink: true }), tb - 1.2, 0.22);
perc.addMono(I.timpani(m('D2')), tb, 0.55); perc.addMono(I.subBoom(2.0, 60, 30), tb, 0.45); verb.addMono(I.timpani(m('D2')), tb, 0.25);
{ const s = I.strings(m('A4'), 2.6, { attack: 0.08, release: 1.4, bright: 1.1 }); str.addStereo(s.L, s.R, tb, 0.07); verb.addStereo(s.L, s.R, tb, 0.05); }

// ---------- the lion and the jawbone: a low pulse that builds, two hits ----------
for (let t = ln(3).start + 0.2, k = 0; t < ln(4).start - 0.4; t += 0.31, k++) {
  if ([tCatch, tStrike].some((h) => t > h - 0.16 && t < h + 0.42)) continue; // an 8th of breath before each hit, and room after it
  const midi = k % 4 === 3 ? m('A2') : m('D2'), g = 0.16 + 0.16 * Math.min(1, (t - ln(3).start) / 4);
  const p = I.pizz(midi, { seed: k }); low.addMono(p, t, g, -0.1); if (k % 2 === 0) low.addMono(I.pizz(midi + 12, { seed: k + 50 }), t, g * 0.5, 0.15);
}
for (const [t, g] of [[tCatch, 0.6], [tStrike, 0.75]]) {
  fx.addMono(I.noiseSweep(0.9, 400, 5000, { q: 0.9, shape: (x) => x * x, pink: true }), t - 0.9, 0.16);
  perc.addMono(I.timpani(m('D2'), { decay: 1.4 }), t, g); perc.addMono(I.thud(70, 0.12), t, 0.6); perc.addMono(I.subBoom(1.6, 58, 30), t, g * 0.7);
  verb.addMono(I.timpani(m('D2')), t, 0.25);
}
perc.addMono(I.crash(18), tStrike, 0.12);

// ---------- the angel: a shimmer of light ----------
[m('A5'), m('D6'), m('F6'), m('A6'), m('D7')].forEach((n, i) => { const b = I.musicBox(n); keys.addMono(b, tAngel + i * 0.13, 0.1, -0.4 + i * 0.2); verb.addMono(b, tAngel + i * 0.13, 0.12); dly.addMono(b, tAngel + i * 0.13, 0.05); });
// verse cards: one soft bell when each card lands
for (const t of [ln(5).start, ln(10).start]) { const b = I.bell(hz(m('D6')), 0.5, 1.4, 2.0); keys.addMono(b, t + 0.05, 0.08); verb.addMono(b, t + 0.05, 0.12); }
// "part of God's plan": the gold arrives
{ const b = I.bell(hz(m('F5')), 0.5, 1.6, 2.0); keys.addMono(b, tPlan, 0.08); verb.addMono(b, tPlan, 0.12); }

// a slow heartbeat under the valley / Etam (the long night of Israel)
for (let t = ln(6).start + 0.4; t < ln(9).start - 0.3; t += 1.45) { perc.addMono(I.timpani(m('D2'), { decay: 0.6 }), t, 0.16); perc.addMono(I.timpani(m('D2'), { decay: 0.5 }), t + 0.28, 0.09); }
// "tied him up": a tightening string swell
{ const s = I.strings(m('C#4'), 2.4, { attack: 1.2, release: 0.6, bright: 0.8 }); str.addStereo(s.L, s.R, cue(8, 'tied') - 0.6, 0.05); }

// ---------- the turn: the signature tone (first light) ----------
{ const b1 = I.bell(hz(m('D6')), 0.9, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.8, 1.2, 2.0);
  keys.addMono(b1, tTurn, 0.13, -0.1); keys.addMono(b2, tTurn + 0.02, 0.08, 0.15); verb.addMono(b1, tTurn, 0.22); dly.addMono(b1, tTurn, 0.08);
  const s = I.strings(m('F#5'), 5.4, { attack: 1.4, release: 2, bright: 1 }); str.addStereo(s.L, s.R, tTurn, 0.05); }

// ---------- the prayer, the answer, the fall ----------
for (let i = 0; i < 18; i++) { const t = tAnswered + 0.1 + i * ((tCame - tAnswered - 0.15) / 18); perc.addMono(I.timpani(m('D2'), { decay: 0.35, seed: i }), t, 0.1 + 0.25 * (i / 17)); } // roll into the fall
fx.addMono(I.noiseSweep(1.4, 200, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), tCame - 1.4, 0.2);
perc.addMono(I.subBoom(3.0, 55, 24), tCame, 0.9); perc.addMono(I.timpani(m('D2'), { decay: 2.0 }), tCame, 0.8); perc.addMono(I.thud(60, 0.2), tCame, 0.8); perc.addMono(I.crash(21), tCame, 0.2);
verb.addMono(I.timpani(m('D2'), { decay: 2 }), tCame, 0.35);
perc.addMono(I.timpani(m('A1'), { decay: 1.8 }), tExt, 0.55); perc.addMono(I.crash(23), tExt, 0.14); perc.addMono(I.subBoom(2.4, 50, 26), tExt, 0.5);
fx.addMono(I.noiseSweep(3.2, 2400, 120, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tExt, 0.3); // rumble settling

// ---------- the rescue continues: a gentle forward pulse ----------
for (let t = ln(15).start + 0.2, k = 0; t < ln(16).start - 0.2; t += 0.42, k++) { const n = [m('D3'), m('A3'), m('F3'), m('A3')][k % 4]; const p = I.pizz(n, { seed: 200 + k }); low.addMono(p, t, 0.14, k % 2 ? 0.25 : -0.25); }
fx.addMono(I.noiseSweep(1.6, 1500, 6000, { q: 0.6, pink: true }), tSubdued - 0.4, 0.06); // banners fall: a soft cymbal-like swell
{ const b = I.bell(hz(m('A5')), 0.6, 1.3, 2.0); keys.addMono(b, tLit, 0.09); verb.addMono(b, tLit, 0.14); }

// ---------- the landing: warm, then a simple motif; the signature tone on "remember" ----------
for (let t = ev.dawn + 0.1, k = 0; t < ln(18).start - 0.3; t += 0.5, k++) { const n = [m('D4'), m('A4'), m('F#4'), m('A4')][k % 4]; const e = I.epiano(n, 0.6, { decay: 1.2 }); keys.addMono(e, t, 0.07, k % 2 ? 0.2 : -0.2); verb.addMono(e, t, 0.05); }
[[0, 'D5'], [0.55, 'F#5'], [1.1, 'A5'], [2.2, 'G5'], [2.75, 'F#5'], [3.3, 'E5']].forEach(([d, n]) => { const e = I.epiano(m(n), 0.9, { decay: 1.6 }); keys.addMono(e, ln(18).start + 0.2 + d, 0.08); verb.addMono(e, ln(18).start + 0.2 + d, 0.08); });
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.9, 1.2, 2.0);
  keys.addMono(b1, tRemember, 0.12, -0.1); keys.addMono(b2, tRemember + 0.02, 0.07, 0.15); verb.addMono(b1, tRemember, 0.22); dly.addMono(b1, tRemember, 0.08); }

// ---------- mix ----------
const stems = { pad, str, low, keys, perc, fx, verb: reverb(verb, { room: 0.9, damp: 0.35 }), dly: pingpong(dly, 0.42, 0.35, 3200) };
const GAIN = { pad: 1.6, str: 3.2, low: 1.3, keys: 1.5, perc: 0.42, fx: 0.7, verb: 1.1, dly: 0.9 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 28);
MIX.fadeOut(mix, ev.loopBack - 1.2, DURATION - 0.05);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.7'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -16 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
