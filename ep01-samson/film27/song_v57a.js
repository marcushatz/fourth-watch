// FOURTH WATCH · Ep 1 (script v57) soundtrack: music, sound effects, scene ambience, the recorded voice, and the outro's
// music (the outro video is appended at END_T), mixed to -14 LUFS.
// An ambient, reverent bed in D minor. It opens to D major when Hebrews 11 names him ("were made strong out of weakness"),
// stays there through the question, and resolves on the outro as Jesus appears on the sea.
// Every hit is read from score.js (shot beats come from the recorded voice's word times) and from the same formulas the
// cards and scenes use, so the sound lands on the picture.
//   VOICE=../voice_lab/take1/voice_edit.wav node song_v57.js   (OUTWAV=soundtrack_v57.wav by default)
//   STEMS=1 also writes out/stem-*.wav · NOVOICE=1 leaves the voice out
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { cue, st, SHOTS, m, VO, END_T } = sc;

const OUTRO = 6.5;                       // brand/logo/fw_final_outro_v3.mp4
const DURATION = END_T + OUTRO;
const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const pad = bus(), str = bus(), low = bus(), keys = bus(), perc = bus(), fx = bus(), sfx = bus(), amb = bus();
const verb = bus(), dly = bus();
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const S = (id) => SHOTS.find((s) => s.id === id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rnd = (() => { let s = 12345; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

// ---------- key moments (the same formulas the scenes and cards use) ----------
const tLion = S('S02').beats.again + 0.02;                 // "His strength came from God."
const tHarlot = S('S03').beats.prostitute;
const tTear = S('S04').beats.carried, tGates = S('S04').beats.gates;
const s06 = S('S06'), s07 = S('S07');
const stamps = (() => { const t0 = s06.beats.shout - 0.05, t1 = s06.t1 - 0.15, step = Math.max(0.45, (t1 - t0) / 4.4); return [0, 1, 2].map((n) => t0 + n * step); })();
const snaps = (() => { const c2 = Math.min(s07.t1 - 0.5, (s07.beats.broke ?? s07.t0 + (s07.t1 - s07.t0) * 0.67) - 0.08), c1 = (s07.t0 + c2) / 2, cuts = [s07.t0, c1, c2, s07.t1]; return [0, 1, 2].map((i) => cuts[i] + Math.min(0.3, (cuts[i + 1] - cuts[i]) * 0.45)); })();
const tShaved = S('S08').beats.shaved, tLeft = S('S10').beats.left;
const tUsing = S('S12').beats.works, tApproving = S('S12').beats.knowing, tNever = S('S14').beats.never;
const tPrayed = S('S16').beats.prayed, tRemember = S('S16').beats.remember;
const f19 = S('S19').beats, tAsked = f19.called, tAnswered = f19.answered + 0.22, tGive = f19.house - 0.02, tLand = f19.fell - 0.07;
const tDawn = S('S21').t0, h22 = S('S22'), tNames = h22.beats.names, tStrong = h22.beats.strong;
const cta = S('S23');
const verses = SHOTS.filter((s) => s.card === 'verse').map((s) => s.verseAt);
const labels = SHOTS.filter((s) => s.card === 'label').map((s) => (s.labelBeat && s.beats[s.labelBeat] ? s.beats[s.labelBeat] - 0.1 : s.t0 + 0.3));
const pills = SHOTS.filter((s) => s.pill).map((s) => (s.pillBeat && s.beats[s.pillBeat] ? s.beats[s.pillBeat] - 0.05 : s.t0 + 0.35));
const O = (x) => END_T + x;              // outro time
const oJesus = O(2.3), oJesusFull = O(4.5), oName = O(4.7);

// ---------- harmony: [start, chord]: each chord lasts until the next ----------
const C = {
  Dm: [50, 53, 57, 62], Dm2: [50, 57, 62, 65], Bb: [46, 53, 58, 62], Gm: [43, 50, 55, 58], A: [45, 52, 57, 61], Asus: [45, 52, 57, 62],
  C: [48, 52, 55, 60], F: [41, 48, 53, 57], D: [50, 54, 57, 62], Dh: [50, 57, 62, 66], G: [43, 50, 55, 59], Bm: [47, 54, 59, 62], Gm2: [43, 55, 58, 62],
  Em: [40, 52, 55, 59],
};
const prog = [
  [0, 'Dm'], [cue(0, 'using'), 'Bb'], [cue(0, 'living') - 0.05, 'Asus'],
  [st(1), 'Dm'], [tLion - 0.05, 'F'], [cue(1, 'Yet'), 'Gm'], [cue(1, 'That'), 'Bb'], [tTear - 0.05, 'Dm'], [tGates, 'A'],
  [st(2), 'Dm'], [cue(2, 'silver'), 'Gm2'],
  [st(3), 'Bb'], [cue(3, 'And'), 'Gm'],
  [st(4), 'Dm'], [cue(4, 'hair'), 'Gm'], [tShaved - 0.05, 'A'],
  [st(5), 'Dm'], [cue(5, 'said'), 'Asus'], [st(6), 'Gm'], [tLeft - 0.05, 'Dm2'],
  [st(7), 'Bb'], [cue(7, 'worked'), 'F'], [cue(7, 'assumed'), 'C'],
  [st(8), 'Dm'], [tUsing - 0.05, 'Bb'], [tApproving - 0.05, 'A'],
  [st(9), 'Dm'], [cue(9, 'many'), 'Gm'], [cue(9, 'mighty'), 'A'], [tNever - 0.05, 'Dm2'],
  [st(10), 'Bb'], [cue(10, 'Blinded'), 'Gm'], [tPrayed - 0.05, 'F'], [tRemember - 0.05, 'Bb'], [cue(10, 'strengthen') - 0.05, 'C'], [cue(10, 'Even'), 'Dm'],
  [st(11), 'Bb'], [cue(11, 'Earlier'), 'Gm'], [cue(11, 'Now'), 'F'], [tAsked - 0.05, 'C'],
  [st(12), 'Dm'], [tAnswered - 0.05, 'Asus'], [tGive, 'Dm'], [tLand + 1.2, 'Dm2'],
  [st(13), 'Bb'], [cue(13, '"So') - 0.05, 'Gm'], [cue(13, 'during'), 'A'],
  [st(14) - 0.05, 'F'], [cue(14, 'And'), 'C'], [tNames - 0.05, 'D'], [cue(14, 'faith') - 0.05, 'G'], [tStrong - 0.05, 'D'],
  [st(15), 'Bm'], [cue(15, 'strength'), 'G'], [cue(15, 'prayer') - 0.05, 'D'], [cue(15, 'Why') - 0.05, 'Asus'],
  [END_T, 'D'], [oJesus, 'G'], [O(3.6), 'D'], [oName - 0.05, 'Dh'],
];
prog.sort((a, b) => a[0] - b[0]);
const brightAt = (t) => t >= tNames - 0.1;
for (let i = 0; i < prog.length; i++) {
  const [t0, name] = prog[i], t1 = i + 1 < prog.length ? prog[i + 1][0] : DURATION;
  const dur = Math.max(0.3, t1 - t0) + 0.6, notes = C[name], bright = brightAt(t0) ? 1 : 0, g = t0 >= END_T ? (t0 >= END_T + 0.4 ? 1.35 : 0.7) : 1;
  for (const n of notes) { const { L, R } = I.padNote(n, dur, { cutoff: bright ? 1900 : 1150, attack: 0.6, release: 1.6, seed: 10 + n }); pad.addStereo(L, R, t0, 0.07 * g); }
  for (const n of notes.slice(2)) { const s = I.strings(n + 12, dur, { attack: 0.5, release: 1.2, bright: 0.65 + 0.35 * bright, seed: n }); str.addStereo(s.L, s.R, t0, 0.045 * g); verb.addStereo(s.L, s.R, t0, 0.03); }
}
const drone = (t0, t1, midi = 38, g = 0.12) => { if (t1 <= t0) return; const { L, R } = I.padNote(midi, t1 - t0, { cutoff: 380, attack: 1.2, release: 2.0, seed: 3 }); low.addStereo(L, R, t0, g); };
drone(0, st(2) - 0.2); drone(st(4), st(7) - 0.3, 38, 0.13); drone(st(9), st(10) - 0.2, 38, 0.12); drone(st(12), tLand + 0.3, 38, 0.13); drone(O(0.5), DURATION, 38, 0.09);

const hit = (t, g = 0.6, o = {}) => { perc.addMono(I.timpani(m(o.n || 'D2'), { decay: o.decay || 1.4 }), t, g); perc.addMono(I.thud(70, 0.12), t, g * 0.8); perc.addMono(I.subBoom(o.boom || 1.6, 58, 30), t, g * 0.7); verb.addMono(I.timpani(m(o.n || 'D2')), t, 0.22); };
const riser = (t, len = 0.9, g = 0.16) => fx.addMono(I.noiseSweep(len, 400, 5000, { q: 0.9, shape: (x) => x * x, pink: true }), t - len, g);
const bell = (t, n = 'D6', g = 0.09) => { const b = I.bell(hz(m(n)), 0.5, 1.4, 2.0); keys.addMono(b, t, g); verb.addMono(b, t, 0.12); };

// ---------- music cues ----------
// hook: a slow heartbeat under the question
for (let t = 0.6; t < st(1) - 0.3; t += 1.4) { perc.addMono(I.timpani(m('D2'), { decay: 0.6 }), t, 0.14); perc.addMono(I.timpani(m('D2'), { decay: 0.5 }), t + 0.28, 0.08); }
// "His strength came from God": a gold lift; "a prostitute": a dark low note (ember); the gate torn up: the big hit
riser(tLion, 0.9, 0.14); hit(tLion, 0.5); bell(tLion + 0.05, 'A5', 0.07);
{ const { L, R } = I.padNote(38, 2.4, { cutoff: 260, attack: 0.05, release: 1.6, seed: 5 }); low.addStereo(L, R, tHarlot, 0.12); }
riser(tTear, 1.1, 0.2); hit(tTear, 0.8, { boom: 2.2 }); perc.addMono(I.crash(18), tTear, 0.14);
fx.addMono(I.noiseSweep(1.8, 2600, 160, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tTear + 0.02, 0.18);
// Delilah and the lords' silver, the three calls: a plucked ostinato that tightens until the secret
for (let t = st(2) + 0.1, k = 0; t < st(4) - 0.3; t += 0.31, k++) {
  if ([...stamps, ...snaps].some((h) => t > h - 0.16 && t < h + 0.42)) continue;
  const midi = k % 4 === 3 ? m('A2') : m('D2'), g = 0.12 + 0.14 * Math.min(1, (t - st(2)) / 10);
  low.addMono(I.pizz(midi, { seed: k }), t, g, -0.1); if (k % 2 === 0) low.addMono(I.pizz(midi + 12, { seed: k + 50 }), t, g * 0.5, 0.15);
}
stamps.forEach((t, n) => { perc.addMono(I.thud(80, 0.14), t, 0.45 + 0.08 * n); perc.addMono(I.timpani(m('D2'), { decay: 0.7 }), t, 0.22 + 0.04 * n); });
snaps.forEach((t) => { hit(t, 0.5, { decay: 0.9 }); fx.addMono(I.noiseSweep(0.25, 6000, 1500, { q: 1.1 }), t, 0.12); });
// the secret: a held high note; the locks shaved: a low string stab
{ const s = I.strings(m('C#4'), 3.0, { attack: 1.2, release: 0.6, bright: 0.8 }); str.addStereo(s.L, s.R, cue(4, 'hair') - 0.4, 0.05); }
{ const s = I.strings(m('D3'), 2.4, { attack: 0.05, release: 1.6, bright: 0.5 }); str.addStereo(s.L, s.R, tShaved, 0.06); }
// "the LORD had left him": the floor drops out
{ const { L, R } = I.padNote(38, 4.2, { cutoff: 300, attack: 0.05, release: 2.2, seed: 9 }); low.addStereo(L, R, tLeft, 0.2); perc.addMono(I.subBoom(2.4, 45, 22), tLeft, 0.4); }
// "GOD USING YOU ≠ GOD APPROVING"
perc.addMono(I.thud(90, 0.1), tUsing, 0.3); { perc.addMono(I.subBoom(1.6, 52, 28), tApproving, 0.4); perc.addMono(I.timpani(m('A1'), { decay: 1.2 }), tApproving, 0.3); }
// "I never knew you."
{ perc.addMono(I.subBoom(3.0, 50, 24), tNever, 0.55); perc.addMono(I.timpani(m('A1'), { decay: 2.0 }), tNever, 0.45); verb.addMono(I.timpani(m('A1')), tNever, 0.3); }
// the prayer: strings rise under it, a bell on "remember"
{ const s = I.strings(m('D4'), S('S16').t1 - tPrayed + 0.4, { attack: 2.4, release: 0.8, bright: 0.85 }); str.addStereo(s.L, s.R, tPrayed, 0.05); }
bell(tRemember, 'A5', 0.07);
// "Now, he asked God for strength" -> he pushes -> the house gives -> it falls
bell(tAsked, 'D6', 0.08);
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0); keys.addMono(b1, tAnswered, 0.1); verb.addMono(b1, tAnswered, 0.25); dly.addMono(b1, tAnswered, 0.08); }
for (let i = 0; i < 16; i++) { const t = tAnswered + 0.25 + i * ((tGive - tAnswered - 0.3) / 16); perc.addMono(I.timpani(m('D2'), { decay: 0.35, seed: i }), t, 0.1 + 0.25 * (i / 15)); }
fx.addMono(I.noiseSweep(1.3, 200, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), tGive - 1.3, 0.2);
perc.addMono(I.subBoom(2.0, 55, 26), tGive, 0.6); perc.addMono(I.thud(60, 0.2), tGive, 0.6);
perc.addMono(I.subBoom(3.2, 50, 22), tLand, 0.95); perc.addMono(I.timpani(m('D2'), { decay: 2.2 }), tLand, 0.8); perc.addMono(I.crash(21), tLand, 0.22); verb.addMono(I.timpani(m('D2'), { decay: 2 }), tLand, 0.35);
fx.addMono(I.noiseSweep(3.4, 2400, 120, { q: 0.7, shape: (x) => Math.pow(1 - x, 1.5) * Math.min(1, x * 8), pink: true }), tLand, 0.32);
// first light: soft keys from the dawn through Hebrews 11; a bell as his name lights up; the major chord on "made strong"
for (let t = tDawn + 0.1, k = 0; t < st(15) - 0.3; t += 0.5, k++) { const maj = t >= tNames - 0.1; const n = (maj ? [m('D4'), m('A4'), m('F#4'), m('A4')] : [m('F4'), m('C5'), m('A4'), m('C5')])[k % 4]; const e = I.epiano(n, 0.6, { decay: 1.2 }); keys.addMono(e, t, 0.055, k % 2 ? 0.2 : -0.2); verb.addMono(e, t, 0.05); }
bell(tNames, 'A5', 0.09);
{ const b1 = I.bell(hz(m('D6')), 1.0, 1.3, 2.0), b2 = I.bell(hz(m('A5')), 0.9, 1.2, 2.0); keys.addMono(b1, tStrong, 0.11, -0.1); keys.addMono(b2, tStrong + 0.02, 0.07, 0.15); verb.addMono(b1, tStrong, 0.22); dly.addMono(b1, tStrong, 0.08);
  const s = I.strings(m('F#5'), 4.0, { attack: 1.2, release: 2, bright: 1 }); str.addStereo(s.L, s.R, tStrong, 0.045); }
// the question: a gentle e-piano line under it
[[0, 'D5'], [0.55, 'F#5'], [1.1, 'A5'], [2.2, 'G5'], [2.75, 'F#5'], [3.3, 'E5']].forEach(([d, n]) => { const e = I.epiano(m(n), 0.9, { decay: 1.6 }); keys.addMono(e, st(15) + 0.2 + d, 0.06); verb.addMono(e, st(15) + 0.2 + d, 0.08); });

// ---------- sound effects (the Lintel layer) ----------
const whoosh = (t, len = 0.42, g = 0.22, up = true) => sfx.addMono(I.noiseSweep(len, up ? 350 : 5200, up ? 5200 : 350, { q: 0.8, shape: (x) => (up ? x * x : (1 - x) * (1 - x)) * Math.min(1, (up ? 1 - x : x) * 14 + 0.2), pink: true, seed: Math.floor(t * 100) }), up ? t - len : t, g);
const shimmer = (t, g = 0.12) => { sfx.addMono(I.noiseSweep(0.9, 1800, 9500, { q: 1.4, shape: (x) => Math.sin(Math.PI * x) * (1 - x * 0.4), pink: false, seed: 77 }), t - 0.25, g); const b = I.bell(hz(m('A6')), 0.7, 1.2, 2.0); keys.addMono(b, t, 0.035); verb.addMono(b, t, 0.08); };
const tick = (t, p = 1, g = 0.12) => sfx.addMono(I.woodTick(p), t, g, (rnd() - 0.5) * 0.3);
const pop = (t, p = 1800, g = 0.25) => { sfx.addMono(I.pop(p, Math.floor(t * 37)), t, g); sfx.addMono(I.thud(140, 0.05), t, g * 0.6); };
verses.forEach((t) => shimmer(t));
labels.forEach((t) => { tick(t + 0.05, 1.15, 0.1); whoosh(t + 0.02, 0.25, 0.08); });
pills.forEach((t) => tick(t + 0.02, 1.3, 0.08));
stamps.forEach((t) => whoosh(t, 0.3, 0.2));
whoosh(tUsing, 0.3, 0.12); whoosh(tApproving, 0.3, 0.14);
// Hebrews 11: the scroll unrolls
sfx.addMono(I.paperFwip(0.8, 5), h22.t0 + 0.02, 0.35); sfx.addMono(I.paperFwip(0.7, 6), h22.t0 + 0.12, 0.25);
// the dawn arrives with a soft swell
shimmer(tDawn + 0.1, 0.1);
// the question: three answers pop on their words, the comment types out
pop(cta.beats.strength - 0.1, 1700, 0.26); pop(cta.beats.failures - 0.1, 1450, 0.26); pop(cta.beats.prayer - 0.1, 1250, 0.26);
{ const msg = 'His prayer at the end, because…', t0 = cta.beats.why + 0.3;
  for (let i = 0; i < msg.length; i++) { const t = t0 + i / 22 + (rnd() - 0.5) * 0.015; if (t > END_T - 0.05) break; if (msg[i] !== ' ') tick(t, 1.6 + rnd() * 0.5, 0.05 + rnd() * 0.03); } }
// the outro (fw_final_outro_v3): the night comes up, the lantern, the beam opens, He appears, the name
sfx.addMono(I.noiseSweep(1.6, 300, 2400, { q: 0.8, shape: (x) => Math.sin(Math.PI * x * 0.5), pink: true, seed: 5 }), O(0.4), 0.08);
tick(O(1.25), 0.8, 0.05);
shimmer(O(2.0), 0.08);
{ const s = I.strings(m('A5'), 3.6, { attack: 1.8, release: 1.6, bright: 1 }); str.addStereo(s.L, s.R, oJesus, 0.04); }
[['D6', 0], ['A5', 0.04], ['F#6', 0.08]].forEach(([n, d]) => { const b = I.bell(hz(m(n)), 1.2, 1.3, 2.0); keys.addMono(b, oName + d, 0.07); verb.addMono(b, oName + d, 0.2); dly.addMono(b, oName + d, 0.05); });

// ---------- scene ambience ----------
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
const sea = (t0, t1, g = 0.06) => { if (t1 <= t0) return; const len = t1 - t0, n = I.noiseSweep(len, 520, 520, { q: 0.3, shape: () => 1, pink: true, seed: 61 });
  for (let i = 0; i < n.length; i++) { const x = i / SR; n[i] *= (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(x * 1.25 - 1.2), 2)) * clamp(x / 1.0) * clamp((len - x) / 0.8); } amb.addMono(n, t0, g); };
const sh = (id) => [S(id).t0, S(id).t1];
// Gaza at night (hook, the door, the gate), the hill at Timnah
windBed(0, S('S04').t1, 0.07); crackle(S('S03').t0 + 0.2, S('S04').t1, 0.045);
// Delilah's house: a quiet room with the lamp (Sorek), then the Lehi field and Gaza's gate for the turn
windBed(S('S05').t0, S('S10').t1, 0.025, 120, 400);
windBed(...sh('S11'), 0.05); windBed(...sh('S12'), 0.05); crackle(...sh('S12'), 0.035);
// the judgment-day crowd, the prison mill, the hall of Dagon
murmur(...sh('S13'), 0.04);
rumble(...sh('S15'), 0.09, 0.42); murmur(S('S16').t0, S('S16').t1, 0.055); rumble(...sh('S17'), 0.09, 0.42);
windBed(...sh('S18'), 0.02, 120, 400); murmur(S('S19').t0, tAnswered, 0.06);
// the dust settling (16:30), then first light: soft air and a few birds
windBed(S('S20').t0, S('S20').t1, 0.035, 150, 700);
windBed(tDawn, S('S21').t1 + 0.8, 0.04, 400, 2200); birds(tDawn, S('S21').t1, 0.025);
// the sea at night under the outro
sea(O(0.4), DURATION, 0.07); windBed(O(0.4), DURATION, 0.03, 200, 900);

// ---------- the voice, and the music ducking under it ----------
const VOICE = process.env.NOVOICE ? null : (process.env.VOICE || path.join(__dirname, '..', 'voice_lab', 'take1', 'voice_edit.wav'));
let vo = null;
if (VOICE && fs.existsSync(VOICE)) {
  vo = MIX.loadAudio(VOICE, { at: 0, gain: 1, length: DURATION });
  MIX.duck([pad, str, low, keys, amb, verb, dly], vo, { depth: 0.55, attack: 0.02, release: 0.35, threshold: 0.02 });
  MIX.duck([perc, fx, sfx], vo, { depth: 0.25, attack: 0.01, release: 0.2, threshold: 0.03 });
}

// ---------- mix ----------
const stems = { pad, str, low, keys, perc, fx, sfx, amb, verb: reverb(verb, { room: 0.9, damp: 0.35 }), dly: pingpong(dly, 0.42, 0.35, 3200) };
const db = (x) => Math.pow(10, x / 20), MUS = db(parseFloat(process.env.MUSIC_DB || '-10.5'));
const GAIN = { pad: 1.6 * MUS, str: 3.2 * MUS, low: 1.3 * MUS, keys: 1.5 * MUS, perc: 0.42 * db(-7), fx: 0.7 * db(-6), sfx: 0.9 * db(-4), amb: 1.0 * db(5), verb: 0.8 * MUS, dly: 0.9 * MUS };
if (vo) { stems.vo = vo; GAIN.vo = parseFloat(process.env.VOGAIN || '1.0'); }
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 28);
MIX.fadeOut(mix, DURATION - 1.0, DURATION - 0.03);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.7'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : (vo ? -14 : -16) });
const OUT = process.env.OUTWAV || 'soundtrack_v57.wav';
MIX.writeWav(path.join(out, OUT), mix);
console.log(`wrote out/${OUT} (${DURATION.toFixed(2)}s, voice ${vo ? 'in' : 'out'}${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
