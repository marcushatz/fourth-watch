// FOURTH WATCH · Ep 1 (v28) soundtrack: music, sound effects, scene ambience and the voice, mixed to -14 LUFS.
// An ambient, reverent bed in D minor that opens to D major on point three ("you can still call on God") and at the
// dawn. Every hit and every effect is read from score.js (shot beats come from the voice's word times) and from the
// same formulas the cards and scenes use, so the sound moves with the voice and lands on the picture.
//   node song.js                 VOICE=path/to/voice.wav (default ../build/voice_scratch/voice.wav if present)
//   STEMS=1 also writes out/stem-*.wav · LUFS=-14 masters to a loudness target · NOVOICE=1 leaves the voice out
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, cue, st, SHOTS, m, VO, END_T } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const pad = bus(), str = bus(), low = bus(), keys = bus(), perc = bus(), fx = bus(), sfx = bus(), amb = bus();
const verb = bus(), dly = bus();
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const S = (id) => SHOTS.find((s) => s.id === id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rnd = (() => { let s = 12345; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

// ---------- key moments (the same formulas the scenes and cards use) ----------
const tTear = S('S03').beats.carried;
const tLion = S('S06').beats.again + 0.02, tSpirit = S('S07').beats.rushed, tChart = S('S08').t0 + 0.6;
const s11 = S('S11'), s12 = S('S12');
const stamps = (() => { const t0 = s11.beats.shout - 0.05, t1 = s11.t1 - 0.15, step = Math.max(0.45, (t1 - t0) / 4.4); return [0, 1, 2, 3].map((n) => t0 + n * step); })();
const snaps = (() => { const c2 = Math.min(s12.t1 - 0.5, (s12.beats.broke ?? s12.t0 + s12.dur * 0.67) - 0.08), c1 = (s12.t0 + c2) / 2, cuts = [s12.t0, c1, c2, s12.t1]; return [0, 1, 2].map((i) => cuts[i] + Math.min(0.3, (cuts[i + 1] - cuts[i]) * 0.45)); })();
const tShaved = S('S13').beats.shaved, tLeft = S('S15').beats.left;
const tIntro = S('S16').intro.at, tOne = S('S17').chapter.at, tTwo = S('S19').chapter.at, tThree = S('S22').chapter.at;
const tAngel = S('S17').beats.angel, tNever = S('S20').beats.never, tCall = S('S22').beats.call;
const tAnswered = S('S26').beats.answered, tGive = S('S26').beats.house - 0.02, tLand = S('S26').beats.fell - 0.07;
const tSamsonLit = S('S27').beats.names, tDawn = S('S28').t0;
const verses = SHOTS.filter((s) => s.card === 'verse').map((s) => s.verseAt);
const labels = SHOTS.filter((s) => s.card === 'label').map((s) => (s.labelBeat && s.beats[s.labelBeat] ? s.beats[s.labelBeat] - 0.1 : s.t0 + 0.3));
const pills = SHOTS.filter((s) => s.pill).map((s) => (s.pillBeat && s.beats[s.pillBeat] ? s.beats[s.pillBeat] - 0.05 : s.t0 + 0.35));
const pointStamps = [tOne, tTwo, tThree];
const settle = (ch) => Math.min(ch.at - 0.06 + 1.75, VO.lines[ch.line].end + 0.15) + 0.45; // stamp -> pill (cards.js)
const cta = S('S32');

// ---------- harmony: [start, chord]: each chord lasts until the next ----------
const C = {
  Dm: [50, 53, 57, 62], Dm2: [50, 57, 62, 65], Bb: [46, 53, 58, 62], Gm: [43, 50, 55, 58], A: [45, 52, 57, 61], Asus: [45, 52, 57, 62],
  C: [48, 52, 55, 60], F: [41, 48, 53, 57], D: [50, 54, 57, 62], Dh: [50, 57, 62, 66], G: [43, 50, 55, 59], Bm: [47, 54, 59, 62], Gm2: [43, 55, 58, 62],
};
const prog = [
  [0, 'Dm'], [cue(0, 'using'), 'Bb'], [st(1), 'Dm'], [cue(1, 'that'), 'Gm'], [tTear - 0.05, 'Bb'], [st(2), 'Asus'], [st(3), 'F'],
  [st(4), 'Dm'], [tSpirit - 0.05, 'Bb'], [tChart - 0.05, 'C'],
  [st(5), 'Dm'], [s11.t0, 'Gm2'], [st(7), 'Dm'], [st(8), 'Bb'], [cue(8, 'hair'), 'Gm'], [tShaved - 0.05, 'A'],
  [st(9), 'Dm'], [cue(9, 'shake'), 'Asus'], [st(10), 'Gm'], [tLeft - 0.05, 'Dm2'],
  [st(11), 'F'], [tIntro - 0.05, 'C'],
  [st(12), 'F'], [st(13), 'C'], [tAngel - 0.05, 'F'],
  [st(14), 'Asus'], [st(15), 'Dm'], [cue(15, 'prophesy'), 'Gm'], [cue(15, 'mighty'), 'A'], [tNever - 0.05, 'Dm2'], [st(17), 'Bb'], [cue(17, 'warning'), 'Gm'],
  [st(18), 'Dm'], [tCall - 0.05, 'D'], [st(19), 'G'], [cue(19, 'grow'), 'Bm'], [st(20), 'G'],
  [st(21), 'Dm'], [cue(21, 'remember'), 'Bb'], [cue(21, 'strengthen'), 'C'], [tAnswered - 0.05, 'D'], [tGive, 'Dm'],
  [st(23), 'Bb'], [tSamsonLit - 0.05, 'F'], [cue(23, '"were'), 'C'],
  [st(24) - 0.05, 'Bb'], [tDawn - 0.05, 'D'], [cue(24, 'purpose'), 'G'], [cue(24, 'approves'), 'Bm'], [st(25), 'D'], [cue(25, 'verdict'), 'Dh'],
  [st(26), 'Bm'], [cue(26, 'answered'), 'G'], [cue(26, 'comments'), 'D'], [END_T, 'D'],
];
prog.sort((a, b) => a[0] - b[0]);
const brightAt = (t) => (t >= tCall && !(t >= st(21) && t < tAnswered)) || (t >= st(11) && t < st(14));
for (let i = 0; i < prog.length; i++) {
  const [t0, name] = prog[i], t1 = i + 1 < prog.length ? prog[i + 1][0] : DURATION;
  const dur = Math.max(0.3, t1 - t0) + 0.6, notes = C[name], bright = brightAt(t0) ? 1 : 0, g = t0 >= END_T ? 1.3 : 1;
  for (const n of notes) { const { L, R } = I.padNote(n, dur, { cutoff: bright ? 1900 : 1150, attack: 0.6, release: 1.6, seed: 10 + n }); pad.addStereo(L, R, t0, 0.07 * g); }
  for (const n of notes.slice(2)) { const s = I.strings(n + 12, dur, { attack: 0.5, release: 1.2, bright: 0.65 + 0.35 * bright, seed: n }); str.addStereo(s.L, s.R, t0, 0.045 * g); verb.addStereo(s.L, s.R, t0, 0.03); }
}
const drone = (t0, t1, midi = 38, g = 0.12) => { if (t1 <= t0) return; const { L, R } = I.padNote(midi, t1 - t0, { cutoff: 380, attack: 1.2, release: 2.0, seed: 3 }); low.addStereo(L, R, t0, g); };
drone(0, st(4) - 0.2); drone(st(5), st(11) - 0.3, 38, 0.13); drone(st(18) - 0.2, tCall - 0.1, 38, 0.13); drone(st(21), tAnswered + 0.3, 38, 0.13); drone(END_T + 0.3, DURATION, 38, 0.1);

const hit = (t, g = 0.6, o = {}) => { perc.addMono(I.timpani(m(o.n || 'D2'), { decay: o.decay || 1.4 }), t, g); perc.addMono(I.thud(70, 0.12), t, g * 0.8); perc.addMono(I.subBoom(o.boom || 1.6, 58, 30), t, g * 0.7); verb.addMono(I.timpani(m(o.n || 'D2')), t, 0.22); };
const riser = (t, len = 0.9, g = 0.16) => fx.addMono(I.noiseSweep(len, 400, 5000, { q: 0.9, shape: (x) => x * x, pink: true }), t - len, g);
const bell = (t, n = 'D6', g = 0.09) => { const b = I.bell(hz(m(n)), 0.5, 1.4, 2.0); keys.addMono(b, t, g); verb.addMono(b, t, 0.12); };

// ---------- music cues (as v27, re-cued to the v28 script) ----------
for (let t = 0.6; t < tTear - 0.5; t += 1.4) { perc.addMono(I.timpani(m('D2'), { decay: 0.6 }), t, 0.14); perc.addMono(I.timpani(m('D2'), { decay: 0.5 }), t + 0.28, 0.08); } // heartbeat
riser(tTear, 1.1, 0.2); hit(tTear, 0.8, { boom: 2.2 }); perc.addMono(I.crash(18), tTear, 0.14);
fx.addMono(I.noiseSweep(1.8, 2600, 160, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tTear + 0.02, 0.18);
for (let t = st(4) + 0.1, k = 0; t < tChart + 0.6; t += 0.31, k++) {
  if ([tLion, tSpirit, tChart].some((h) => t > h - 0.16 && t < h + 0.42)) continue;
  const midi = k % 4 === 3 ? m('A2') : m('D2'), g = 0.14 + 0.14 * Math.min(1, (t - st(4)) / 5);
  low.addMono(I.pizz(midi, { seed: k }), t, g, -0.1); if (k % 2 === 0) low.addMono(I.pizz(midi + 12, { seed: k + 50 }), t, g * 0.5, 0.15);
}
for (const [t, g] of [[tLion, 0.55], [tSpirit, 0.7], [tChart, 0.5]]) { riser(t); hit(t, g); }
stamps.forEach((t, n) => { perc.addMono(I.thud(80, 0.14), t, n === 3 ? 0.75 : 0.5); perc.addMono(I.timpani(m(n === 3 ? 'A1' : 'D2'), { decay: 0.7 }), t, n === 3 ? 0.4 : 0.25); });
snaps.forEach((t) => { hit(t, 0.5, { decay: 0.9 }); fx.addMono(I.noiseSweep(0.25, 6000, 1500, { q: 1.1 }), t, 0.12); });
{ const s = I.strings(m('C#4'), 3.0, { attack: 1.2, release: 0.6, bright: 0.8 }); str.addStereo(s.L, s.R, cue(8, 'hair') - 0.4, 0.05); }
{ const s = I.strings(m('D3'), 2.4, { attack: 0.05, release: 1.6, bright: 0.5 }); str.addStereo(s.L, s.R, tShaved, 0.06); }
{ const { L, R } = I.padNote(38, 4.2, { cutoff: 300, attack: 0.05, release: 2.2, seed: 9 }); low.addStereo(L, R, tLeft, 0.2); perc.addMono(I.subBoom(2.4, 45, 22), tLeft, 0.4); }
[m('A5'), m('D6'), m('F6'), m('A6'), m('D7')].forEach((n, i) => { const b = I.musicBox(n); keys.addMono(b, tAngel + i * 0.13, 0.1, -0.4 + i * 0.2); verb.addMono(b, tAngel + i * 0.13, 0.12); dly.addMono(b, tAngel + i * 0.13, 0.05); });
{ const s = I.strings(m('A4'), S('S19').dur + 0.5, { attack: 3.0, release: 1.0, bright: 0.9 }); str.addStereo(s.L, s.R, S('S19').t0, 0.05); }
{ perc.addMono(I.subBoom(3.0, 50, 24), tNever, 0.55); perc.addMono(I.timpani(m('A1'), { decay: 2.0 }), tNever, 0.45); verb.addMono(I.timpani(m('A1')), tNever, 0.3); }
for (let t = cue(17, 'warning'), k = 0; t < st(18) - 0.3; t += 0.42, k++) low.addMono(I.pizz([m('D3'), m('A2')][k % 2], { seed: 300 + k }), t, 0.12, k % 2 ? 0.2 : -0.2);
{ const b1 = I.bell(hz(m('D6')), 0.9, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.8, 1.2, 2.0); keys.addMono(b1, tCall, 0.13, -0.1); keys.addMono(b2, tCall + 0.02, 0.08, 0.15); verb.addMono(b1, tCall, 0.22); dly.addMono(b1, tCall, 0.08);
  const s = I.strings(m('F#5'), 4.0, { attack: 1.2, release: 2, bright: 1 }); str.addStereo(s.L, s.R, tCall, 0.05); }
[m('D6'), m('F#6'), m('A6')].forEach((n, i) => { const b = I.musicBox(n); keys.addMono(b, cue(19, 'grow') + i * 0.2, 0.07); verb.addMono(b, cue(19, 'grow') + i * 0.2, 0.1); });
bell(cue(20, 'pray'), 'A5', 0.07);
{ const s = I.strings(m('D4'), S('S25').t1 - cue(21, 'prayed') + 0.4, { attack: 2.4, release: 0.8, bright: 0.85 }); str.addStereo(s.L, s.R, cue(21, 'prayed'), 0.05); }
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0); keys.addMono(b1, tAnswered, 0.12); verb.addMono(b1, tAnswered, 0.25); dly.addMono(b1, tAnswered, 0.08); }
for (let i = 0; i < 16; i++) { const t = tAnswered + 0.25 + i * ((tGive - tAnswered - 0.3) / 16); perc.addMono(I.timpani(m('D2'), { decay: 0.35, seed: i }), t, 0.1 + 0.25 * (i / 15)); }
fx.addMono(I.noiseSweep(1.3, 200, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), tGive - 1.3, 0.2);
perc.addMono(I.subBoom(2.0, 55, 26), tGive, 0.6); perc.addMono(I.thud(60, 0.2), tGive, 0.6);
perc.addMono(I.subBoom(3.2, 50, 22), tLand, 0.95); perc.addMono(I.timpani(m('D2'), { decay: 2.2 }), tLand, 0.8); perc.addMono(I.crash(21), tLand, 0.22); verb.addMono(I.timpani(m('D2'), { decay: 2 }), tLand, 0.35);
fx.addMono(I.noiseSweep(3.4, 2400, 120, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tLand, 0.32);
bell(tSamsonLit, 'A5', 0.09);
for (let t = tDawn + 0.1, k = 0; t < st(26) - 0.3; t += 0.5, k++) { const n = [m('D4'), m('A4'), m('F#4'), m('A4')][k % 4]; const e = I.epiano(n, 0.6, { decay: 1.2 }); keys.addMono(e, t, 0.06, k % 2 ? 0.2 : -0.2); verb.addMono(e, t, 0.05); }
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.9, 1.2, 2.0); const t = cue(25, 'verdict'); keys.addMono(b1, t, 0.12, -0.1); keys.addMono(b2, t + 0.02, 0.07, 0.15); verb.addMono(b1, t, 0.22); dly.addMono(b1, t, 0.08); }
[[0, 'D5'], [0.55, 'F#5'], [1.1, 'A5'], [2.2, 'G5'], [2.75, 'F#5'], [3.3, 'E5']].forEach(([d, n]) => { const e = I.epiano(m(n), 0.9, { decay: 1.6 }); keys.addMono(e, st(26) + 0.2 + d, 0.07); verb.addMono(e, st(26) + 0.2 + d, 0.08); });

// ---------- sound effects (the Lintel layer): reveals, stamps, pages, buttons, typing, the end card ----------
const whoosh = (t, len = 0.42, g = 0.22, up = true) => sfx.addMono(I.noiseSweep(len, up ? 350 : 5200, up ? 5200 : 350, { q: 0.8, shape: (x) => (up ? x * x : (1 - x) * (1 - x)) * Math.min(1, (up ? 1 - x : x) * 14 + 0.2), pink: true, seed: Math.floor(t * 100) }), up ? t - len : t, g);
const shimmer = (t, g = 0.12) => { sfx.addMono(I.noiseSweep(0.9, 1800, 9500, { q: 1.4, shape: (x) => Math.sin(Math.PI * x) * (1 - x * 0.4), pink: false, seed: 77 }), t - 0.25, g); const b = I.bell(hz(m('A6')), 0.7, 1.2, 2.0); keys.addMono(b, t, 0.035); verb.addMono(b, t, 0.08); };
const tick = (t, p = 1, g = 0.12) => sfx.addMono(I.woodTick(p), t, g, (rnd() - 0.5) * 0.3);
const pop = (t, p = 1800, g = 0.25) => { sfx.addMono(I.pop(p, Math.floor(t * 37)), t, g); sfx.addMono(I.thud(140, 0.05), t, g * 0.6); };
const stampFx = (t, big = false) => { whoosh(t, 0.36, big ? 0.3 : 0.24); perc.addMono(I.thud(big ? 70 : 95, 0.1), t, big ? 0.55 : 0.4); perc.addMono(I.subBoom(1.0, 60, 34), t, big ? 0.35 : 0.22); const b = I.bell(hz(m('D6')), 0.6, 1.4, 2.0); keys.addMono(b, t + 0.02, 0.06); verb.addMono(b, t, 0.1); };

// the roadmap: two page turns on the Bible, three tabs popping up 1-2-3
const s05 = S('S05');
for (const fb of [s05.beats.bible, s05.beats.story]) if (fb) sfx.addMono(I.paperFwip(1, Math.floor(fb * 10)), fb - 0.12, 0.35);
if (s05.beats.three) [0, 1, 2].forEach((i) => pop(s05.beats.three - 0.05 + i * 0.16 + 0.05, 1500 + i * 260, 0.2));
// verse cards swell in; labels and idea pills land with a soft tick
verses.forEach((t) => shimmer(t));
labels.forEach((t) => { tick(t + 0.05, 1.15, 0.1); whoosh(t + 0.02, 0.25, 0.08); });
pills.forEach((t) => tick(t + 0.02, 1.3, 0.08));
// the "3 TRUTHS" stamp and the three point stamps; each point stamp settles into its pill with a small tick
stampFx(tIntro, true);
pointStamps.forEach((t) => stampFx(t));
[S('S17').chapter, S('S19').chapter, S('S22').chapter].forEach((ch) => tick(settle(ch), 0.9, 0.1));
// the chart bars rise; the Hebrews 11 scroll unrolls; the map-less point 1 verse
sfx.addMono(I.noiseSweep(0.6, 500, 2600, { q: 1, shape: (x) => Math.sin(Math.PI * x), pink: true }), S('S08').t0 + 0.1, 0.1);
sfx.addMono(I.paperFwip(0.8, 5), S('S27').t0 + 0.02, 0.35); sfx.addMono(I.paperFwip(0.7, 6), S('S27').t0 + 0.12, 0.25);
// CTA: buttons pop on their words, the comment types out, then the hard cut to the end card
pop(cta.beats.heb - 0.1, 1700, 0.28); pop(cta.beats.answered - 0.1, 1350, 0.28);
{ const msg = 'Honestly, that God still answered him…', t0 = cta.beats.tell + 0.3;
  for (let i = 0; i < msg.length; i++) { const t = t0 + i / 16 + (rnd() - 0.5) * 0.02; if (t > END_T - 0.05) break; if (msg[i] !== ' ') tick(t, 1.6 + rnd() * 0.5, 0.05 + rnd() * 0.03); } }
// the landing recap: three fast images, each cut lands with a whoosh; the dawn arrives with a soft swell
['S28a', 'S28b', 'S28c'].forEach((id, i) => { whoosh(S(id).t0 + 0.02, 0.3, 0.2 + 0.03 * i); perc.addMono(I.thud(100 - i * 10, 0.08), S(id).t0, 0.22); });
shimmer(S('S28').t0 + 0.1, 0.1);
// end card: a soft low hit on the cut, the sun rises with a shimmer, a bell chord as the name appears
perc.addMono(I.subBoom(2.6, 52, 26), END_T, 0.5); perc.addMono(I.thud(64, 0.16), END_T, 0.45);
sfx.addMono(I.noiseSweep(0.9, 600, 7000, { q: 1.2, shape: (x) => x * Math.min(1, (1 - x) * 6), pink: true }), END_T + 0.1, 0.12);
[['D6', 0], ['A5', 0.03], ['F#6', 0.06]].forEach(([n, d]) => { const b = I.bell(hz(m(n)), 1.2, 1.3, 2.0); keys.addMono(b, END_T + 0.85 + d, 0.08); verb.addMono(b, END_T + 0.85 + d, 0.2); dly.addMono(b, END_T + 0.85 + d, 0.06); });

// ---------- scene ambience: night wind and torches at Gaza, the mill, the crowds, first light ----------
const windBed = (t0, t1, g = 0.07, lo = 180, hi = 900) => {
  if (t1 <= t0) return; const len = t1 - t0, n = I.noiseSweep(len, Math.sqrt(lo * hi), Math.sqrt(lo * hi), { q: 0.35, shape: () => 1, pink: true, seed: Math.floor(t0 * 10) });
  for (let i = 0; i < n.length; i++) { const x = i / SR; n[i] *= (0.55 + 0.45 * Math.sin(x * 0.7 + t0) * Math.sin(x * 0.23 + 1.3)) * clamp(x / 0.6) * clamp((len - x) / 0.6); }
  amb.addMono(n, t0, g, (t0 % 2) - 1 > 0 ? 0.2 : -0.2);
};
const crackle = (t0, t1, g = 0.05) => { for (let t = t0; t < t1; t += 0.05 + rnd() * 0.22) amb.addMono(I.pop(1200 + rnd() * 2600, Math.floor(t * 113)), t, g * (0.4 + rnd()), (rnd() - 0.5) * 0.8); };
const rumble = (t0, t1, g = 0.08, rate = 0.5) => { if (t1 <= t0) return; const len = t1 - t0, n = I.noiseSweep(len, 90, 90, { q: 0.5, shape: () => 1, pink: true, seed: 9 });
  for (let i = 0; i < n.length; i++) { const x = i / SR; n[i] *= (0.5 + 0.5 * Math.pow(Math.max(0, Math.sin(x * Math.PI * 2 * rate)), 2)) * clamp(x / 0.4) * clamp((len - x) / 0.4); } amb.addMono(n, t0, g); };
const murmur = (t0, t1, g = 0.05) => { if (t1 <= t0) return; const len = t1 - t0, n = I.noiseSweep(len, 650, 650, { q: 0.9, shape: () => 1, pink: true, seed: 31 });
  for (let i = 0; i < n.length; i++) { const x = i / SR; n[i] *= (0.5 + 0.5 * Math.abs(Math.sin(x * 3.1) * Math.sin(x * 1.7 + 0.5))) * clamp(x / 0.5) * clamp((len - x) / 0.5); } amb.addMono(n, t0, g); };
const birds = (t0, t1, g = 0.03) => { for (let t = t0 + 0.4; t < t1 - 0.3; t += 0.9 + rnd() * 1.6) for (let k = 0; k < 2 + Math.floor(rnd() * 2); k++) { const f0 = 3200 + rnd() * 1800; amb.addMono(I.noiseSweep(0.07, f0, f0 * 0.75, { q: 9, shape: (x) => Math.sin(Math.PI * x) }), t + k * 0.11, g, (rnd() - 0.5) * 1.2); } };
const sh = (id) => [S(id).t0, S(id).t1];
// Gaza at night (hook, door, gate, hill, the 3 TRUTHS hilltop, the principle at the gate)
windBed(0, S('S04').t1, 0.07); crackle(S('S01').t0 + 0.2, S('S03').t1, 0.045);
windBed(...sh('S16'), 0.07); windBed(...sh('S21'), 0.05); crackle(...sh('S21'), 0.04);
// Delilah's house: a quiet room with the lamp; the Philistines' crowd in the hall of Dagon; the Matthew 7 crowd
windBed(S('S10').t0, S('S15').t1, 0.025, 120, 400);
murmur(S('S19').t0, S('S20').t0 + 0.3, 0.045); murmur(S('S25').t0, tAnswered, 0.06);
// the prison mill grinding (point three)
rumble(S('S22').t0, S('S24').t1, 0.09, 0.42);
// first light: soft air and a few birds over the dawn shots
windBed(tDawn, S('S31').t1, 0.04, 400, 2200); birds(tDawn, S('S31').t1, 0.025);

// ---------- the voice, and the music ducking under it ----------
const VOICE = process.env.NOVOICE ? null : (process.env.VOICE || path.join(__dirname, '..', 'build', 'voice_scratch', 'voice.wav'));
let vo = null;
if (VOICE && fs.existsSync(VOICE)) {
  vo = MIX.loadAudio(VOICE, { at: 0, gain: 1, length: DURATION });
  MIX.duck([pad, str, low, keys, amb, verb, dly], vo, { depth: 0.55, attack: 0.02, release: 0.35, threshold: 0.02 });
  MIX.duck([perc, fx, sfx], vo, { depth: 0.25, attack: 0.01, release: 0.2, threshold: 0.03 });
}

// ---------- mix ----------
const stems = { pad, str, low, keys, perc, fx, sfx, amb, verb: reverb(verb, { room: 0.9, damp: 0.35 }), dly: pingpong(dly, 0.42, 0.35, 3200) };
// balance against the voice (reference: the bed sits ~9-10 dB under the narrator): music -9 dB, hits -7 dB, effects -4 dB
const db = (x) => Math.pow(10, x / 20), MUS = db(parseFloat(process.env.MUSIC_DB || '-10.5'));
const GAIN = { pad: 1.6 * MUS, str: 3.2 * MUS, low: 1.3 * MUS, keys: 1.5 * MUS, perc: 0.42 * db(-7), fx: 0.7 * db(-6), sfx: 0.9 * db(-4), amb: 1.0 * db(5), verb: 0.8 * MUS, dly: 0.9 * MUS };
if (vo) { stems.vo = vo; GAIN.vo = parseFloat(process.env.VOGAIN || '1.0'); }
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 28);
MIX.fadeOut(mix, DURATION - 1.4, DURATION - 0.05);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.7'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : (vo ? -14 : -16) });
MIX.writeWav(path.join(out, process.env.OUTWAV || 'soundtrack.wav'), mix);
console.log(`wrote out/${process.env.OUTWAV || 'soundtrack.wav'} (${DURATION.toFixed(2)}s, voice ${vo ? 'in' : 'out'}${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
