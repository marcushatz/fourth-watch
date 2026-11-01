#!/usr/bin/env node
// Fourth Watch shot-list linter: the gate between the script and any render.
// It reads an episode's score.js (SHOTS + VO word times) and checks the shot list against research/direction_rules.md
// (measured on 14 Lintel Network Shorts and cross-checked on Bible Animations and BibleProject, Oct 31 2026). Run it until there is no FAIL and every WARN is fixed or explained,
// then show Marcus the shot list. Nothing is rendered in full before that.
//
//   node tools/shotlist_check.js ep01-samson/film27 [--score score_v58.js] [--outro 3] [--out qa/shotlist.md]
//
// Shot fields it reads (add them in score.js `add(id, scene, v, t0, {...})`; old shot lists without them get WARNs):
//   size   'xws' | 'ws' | 'ms' | 'mcu' | 'cu' | 'insert'          shot size (the hook needs 'ms' or closer)
//   act    what a person DOES on screen, on the verb ("Samson rips the gate posts out of the ground")
//   change what else visibly changes when nobody acts ("coins count up to 5,500", "pill lands", "the lamp dies")
//   pill / label / name   on-screen label text (a concept pill, a stamp, or a name pill with its reference)
//   cam    { move: 'still'|'drift'|'push'|'pull'|'pan'|'track'|'crane'|'orbit'|'travel', amt: % of frame, job }
//          job is required for any move of 15% or more: 'hook-reveal' | 'travel' | 'follow' | 'reveal'
//   beats  { name: time }  absolute times of the words each visible change lands on; with the cuts, the shot starts and the
//          device beats (counter, tally, stamp, verseAt) they make the planned beat clock: a change every <= 2 s, no gap > 6 s
//   long   'verse' | 'travel' | 'diagram' | 'set'   the reasons a shot may run past 6 s (always with beats every ~2 s inside)
//   list   true: one item of a spoken list (allowed under 2 s)
//   cuts   [t, ...] absolute times of hard cuts the scene module makes INSIDE this shot (e.g. the three bindings);
//          the linter counts each piece as its own picture shot
//   callback true: the hook image returns     arrival true: the "arrival" image the answer line plays over
// Score fields: OUTRO (seconds of the logo end card appended after END_T) unless --outro is given.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const S = require(path.join(dir, opt('--score', 'score.js')));
const VO = S.VO;
const OUTRO = parseFloat(opt('--outro', S.OUTRO ?? 3));
const END = S.END_T, TOTAL = END + OUTRO;
// expand shots that cut internally (shot.cuts) into their picture pieces, so rhythm is measured on what the viewer sees
const PIECES = S.SHOTS.flatMap((s) => { const c = (s.cuts || []).filter((t) => t > s.t0 && t < s.t1).sort((a, b) => a - b); const b = [s.t0, ...c, s.t1]; return b.slice(0, -1).map((t0, k) => ({ ...s, id: c.length ? `${s.id}${'abcdefgh'[k]}` : s.id, t0, t1: b[k + 1], piece: k })); });
const SH = PIECES;
const R = [];
const add = (lvl, check, msg, t) => R.push({ lvl, check, msg, t });
const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const words = VO.lines.flatMap((l) => l.words.map((w) => ({ ...w, line: l.i })));
const said = (a, b) => words.filter((w) => w.s >= a - 0.05 && w.s < b - 0.05).map((w) => w.w).join(' ');
const len = (s) => s.t1 - s.t0;

// ---------- length and speech rate ----------
const nWords = words.length, voDur = VO.voEnd - (words[0]?.s ?? 0), wps = nWords / voDur;
if (TOTAL > 150) add('FAIL', 'length', `${f1(TOTAL)} s with the outro: over the 150 s cap for a reel`);
else if (TOTAL < 45 || TOTAL > 135) add('WARN', 'length', `${f1(TOTAL)} s with the outro (hits: Lintel 84-137 s, Bible Animations and BibleProject 47-60 s; house cap 135 s)`);
else add('PASS', 'length', `${f1(TOTAL)} s with a ${OUTRO} s outro`);
if (wps < 2.7 || wps > 4.2) add('WARN', 'speech rate', `${wps.toFixed(2)} words/s over the voice (the other channels' hits 2.7-4.1 over the voice; Lintel's hits 2.59-3.01 over the whole runtime; the slowest Lintel videos, 1.7-1.8, are lows)`);
else add('PASS', 'speech rate', `${wps.toFixed(2)} words/s`);

// ---------- rhythm ----------
const L = SH.map(len), sorted = [...L].sort((a, b) => a - b), med = sorted[sorted.length >> 1];
const in35 = L.filter((x) => x >= 3 && x <= 5).length / L.length;
const sentences = VO.lines.reduce((n, l) => n + (l.text.match(/[.?!]["”’]?(\s|$)/g) || []).length, 0);
const ratio = SH.length / sentences;
add(med >= 3 && med <= 5 ? 'PASS' : 'WARN', 'rhythm', `median shot ${f1(med)} s (Lintel 3.8 s; hits 3-5 s); ${Math.round(in35 * 100)}% of shots are 3-5 s (hits 50%)`);
add(ratio >= 0.8 && ratio <= 1.4 ? 'PASS' : 'WARN', 'shots per sentence', `${SH.length} shots for ${sentences} spoken sentences = ${ratio.toFixed(2)} (Lintel 1.02: one new picture per sentence)`);
for (const s of SH) {
  const d = len(s), isVerse = s.card === 'verse';
  if (s.card === 'cta') continue;   // the question card is judged by the tail check
  if (d > 12 && s.long !== 'diagram') add('FAIL', 'long shot', `${s.id} runs ${f1(d)} s (never over 12 s unless a diagram keeps building): split it on its clauses`, s.t0);
  else if (d > 6 && !(s.long || isVerse)) add('WARN', 'long shot', `${s.id} runs ${f1(d)} s without a reason (6-12 s only for a verse being acted on, one camera journey, a diagram building or a held set with subjects swapping: set long:)`, s.t0);
  if (d < 1 && !s.flash) add('WARN', 'short shot', `${s.id} runs ${f1(d)} s (nothing under 1 s except a 0.2 s flash)`, s.t0);
  else if (d < 2.0 && d >= 1 && !s.list) add('WARN', 'short shot', `${s.id} runs ${f1(d)} s: shots under 2 s are for list items or a fast climax run (set list: true) or merge it`, s.t0);
}

// ---------- the beat clock: something visibly changes about every 2 s (direction_rules.md §1; thresholds calibrated on Lintel) ----------
const bt = new Set();
for (const s of S.SHOTS) {
  bt.add(s.t0); (s.cuts || []).forEach((t) => bt.add(t));
  Object.values(s.beats || {}).forEach((t) => { if (typeof t === 'number' && t >= s.t0 - 0.3 && t <= s.t1 + 0.3) bt.add(t); });
  if (typeof s.verseAt === 'number') bt.add(s.verseAt);
  if (s.card === 'verse') (S.VERSES?.[s.verse]?.marks || []).forEach((m) => typeof m.at === 'number' && bt.add(m.at));
  for (const k of ['counter', 'tally', 'stamp']) { const o = s[k]; if (!o) continue; if (typeof o.beat === 'number') bt.add(o.beat); (o.items || []).forEach((it) => typeof it.beat === 'number' && bt.add(it.beat)); if (typeof o.xBeat === 'number') bt.add(o.xBeat); }
}
const BT = [...bt].filter((t) => t >= 0 && t <= END).sort((a, b) => a - b);
const gaps = BT.map((t, i) => [t, (BT[i + 1] ?? END) - t]);
const dead = gaps.filter(([, g]) => g > 4).reduce((n, [, g]) => n + g, 0) / END;
const every = END / Math.max(1, BT.length);
add(dead <= 0.25 && every <= 2.2 ? 'PASS' : 'WARN', 'beat clock', `${BT.length} planned beats = one every ${f1(every)} s; ${Math.round(dead * 100)}% of the runtime sits in gaps over 4 s (Lintel a change every 2.0-2.4 s with 19-21% in gaps over 4 s; the other hits ~1.2-1.6 s, judged; Ep 1 v57 47%)`);
for (const [t, g] of gaps) if (g > 6) add('WARN', 'beat clock', `${f1(g)} s with no planned beat from ${f1(t)} s: add an action, an entrance, a pill, a light change or a camera arrival on a word`, t);

// ---------- something happens in every shot ----------
let noAct = 0;
for (const s of SH) {
  if (!s.act && !s.change && s.card !== 'cta') { noAct++; add('WARN', 'picture', `${s.id} has no act/change: say what happens on screen during "${said(s.t0, s.t1).slice(0, 70)}"`, s.t0); }
  else if (s.act && /\bstand(s|ing)?\b/i.test(s.act) && !s.change) add('WARN', 'picture', `${s.id}: "${s.act}" — standing is not an action; show the verb being spoken or add a change`, s.t0);
}
const acting = SH.filter((s) => s.act).length / SH.length;
if (!noAct) add('PASS', 'picture', `every shot names what happens; a person acts in ${Math.round(acting * 100)}% (Lintel 39%, hits 46-57%)`);
if (acting < 0.35) add('WARN', 'picture', `a person acts in only ${Math.round(acting * 100)}% of shots (Lintel 39%, hits 46-57%)`);
const pills = SH.filter((s) => s.pill || s.label || s.name || s.card === 'label').length / SH.length;
add(pills >= 0.3 ? 'PASS' : 'WARN', 'pills', `${Math.round(pills * 100)}% of shots carry a label, concept or name pill (Lintel about half of scene shots)`);

// ---------- camera: big moves need a job ----------
for (const s of SH) {
  const c = s.cam; if (!c) continue;
  if ((c.amt ?? 0) >= 15 && !['hook-reveal', 'travel', 'follow', 'reveal'].includes(c.job)) add('WARN', 'camera', `${s.id}: a ${c.amt}% ${c.move} with no job (big moves only: hook-reveal, travel, follow, reveal)`, s.t0);
}
const scenic = SH.filter((s) => s.scene !== 'card' && s.card !== 'cta'), withCam = scenic.filter((s) => s.cam).length;
if (withCam < scenic.length) add('WARN', 'camera', `${scenic.length - withCam} of ${scenic.length} scene shots have no cam field (move, amount, job): ${scenic.filter((s) => !s.cam).map((s) => s.id).join(', ')}`);

// ---------- hook ----------
const h = SH[0], qEnd = VO.lines[0].words.at(-1).e;
add(qEnd <= 5.5 ? 'PASS' : 'WARN', 'hook: question', `the question is fully spoken at ${f1(qEnd)} s (Lintel hits 2.8-5.5 s; on every channel the premise is stated by ~6 s)`);
if (h.title) add('WARN', 'hook: title', `${h.id} uses a big centred title: no static title card (0 of 3 Lintel hits; BibleProject's titles become the picture within 2.5-4.3 s)`);
if (!h.act && !h.change) add('WARN', 'hook: motion', `${h.id}: nothing named that moves within ~1 s (all 9 hits change by 0-1.3 s)`);
const firstBeat = BT.find((t) => t > 0.05);
if (firstBeat == null || firstBeat > 1.3) add('WARN', 'hook: motion', `the first planned change after frame one is at ${firstBeat == null ? 'never' : f1(firstBeat) + ' s'} (hits 0-1.3 s)`);
if (!(h.cam && h.cam.job === 'hook-reveal') && !(h.beats && Object.keys(h.beats).length)) add('WARN', 'hook: reveal', `no first big change landing on the question's key word (a pull-out, a whoosh-in, a transform)`);
if (!SH.some((s) => s.callback && s.t0 > TOTAL * 0.4)) add('WARN', 'callback', 'no shot returns to the hook image in the second half (hits 5 of 6 on the other channels, lows 1 of 4: the most consistent ending rule)');
if (!SH.some((s) => s.arrival)) add('WARN', 'arrival', 'no "arrival" image for the answer line (people walking into a lit door, the messenger reaching the house)');

// ---------- verse cards ----------
for (const s of S.SHOTS.filter((x) => x.card === 'verse')) {
  const hold = s.t1 - (s.verseAt ?? s.t0), v = S.VERSES?.[s.verse];
  const acted = (v && v.marks && v.marks.length) || 0, limit = acted ? 3 * (acted + 1) + 2 : 5;
  const lvl = hold > Math.max(7, limit + 2) ? 'FAIL' : hold > limit || hold < 2 ? 'WARN' : 'PASS';
  add(lvl, 'verse card', `${s.id} ${v ? v.ref : ''} on screen ${f1(hold)} s${acted ? ` with ${acted} marks acted on it` : ''} (a still card holds 3.5-5 s; Lintel hits 4.1 s; a longer hold needs a mark every 2-3 s: a phrase turns gold, a hand points)`, s.t0);
}

// ---------- ending ----------
const cta = [...S.SHOTS].reverse().find((s) => s.card === 'cta') || S.SHOTS.at(-1);
const lastWord = words.at(-1)?.e ?? VO.voEnd, after = TOTAL - lastWord;
add(after <= 4.5 ? 'PASS' : after <= 7 ? 'WARN' : 'FAIL', 'tail', `the reel runs ${f1(after)} s after the last spoken word (Bible Animations / BibleProject hits 0-1.2 s, Lintel ~3-3.6 s with a typing card and a 2 s logo); CTA card ${f1(END - cta.t0)} s, outro ${OUTRO} s`);

// ---------- report ----------
const rows = SH.map((s) => `| ${s.id} | ${f1(s.t0)} | ${f1(len(s))} | ${said(s.t0, s.t1).slice(0, 60)} | ${s.size || ''} | ${(s.act || '').slice(0, 50)} | ${(s.change || '').slice(0, 40)} | ${s.pill || s.label || s.name || ''} | ${s.cam ? `${s.cam.move} ${s.cam.amt ?? ''}${s.cam.job ? ' ' + s.cam.job : ''}` : ''} |`);
const nF = R.filter((r) => r.lvl === 'FAIL').length, nW = R.filter((r) => r.lvl === 'WARN').length;
const md = [`# Shot-list check: ${path.relative(process.cwd(), dir)}`, '', `**Verdict: ${nF ? 'FAIL' : nW ? 'PASS WITH WARNINGS' : 'PASS'}** · ${nF} fail · ${nW} warn · rules: research/direction_rules.md`, '',
  '| level | check | time | finding |', '| --- | --- | --- | --- |', ...R.sort((a, b) => ['FAIL', 'WARN', 'PASS'].indexOf(a.lvl) - ['FAIL', 'WARN', 'PASS'].indexOf(b.lvl)).map((r) => `| ${r.lvl} | ${r.check} | ${r.t != null ? f1(r.t) + ' s' : ''} | ${r.msg} |`),
  '', '## Shots', '', '| shot | start | len | spoken | size | act | change | pill | camera |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |', ...rows, ''].join('\n');
const out = opt('--out', null);
if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, md); }
console.log(md.split('## Shots')[0].trim());
process.exit(nF ? 1 : 0);
