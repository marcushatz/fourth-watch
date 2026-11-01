// THE SCORE: the single source of truth for timing. Every time comes from vo.js (the words, generated from
// ../episode.md by tools/make_vo.py). When the real voice is recorded, vo.js is regenerated from its word
// timings and every shot, beat, card, caption and music cue moves with it. Never hard-code a time in a scene:
// use shot.t0 / shot.t1 / shot.beats.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const VO = node ? require('./vo.js') : globalThis.VO;
  const { m } = MU;
  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const STYLE = 'flat';

  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
  // cue(line, word, nth=0): start time of a word (by index or by its text) in a VO line
  const cue = (li, w = 0, nth = 0) => {
    const L = VO.lines[li];
    if (!L) throw new Error(`cue: no line ${li}`);
    if (typeof w === 'number') return L.words[Math.max(0, Math.min(L.words.length - 1, w))].s;
    let k = -1;
    for (let i = 0, n = 0; i < L.words.length; i++) if (norm(L.words[i].w).startsWith(norm(w))) { if (n === nth) { k = i; break; } n++; }
    if (k < 0) throw new Error(`cue: word "${w}" not in line ${li}: ${L.text}`);
    return L.words[k].s;
  };
  const cueEnd = (li, w, nth = 0) => { const L = VO.lines[li]; const s = cue(li, w, nth); return L.words.find((x) => x.s === s).e; };
  const ln = (i) => VO.lines[i];
  const st = (i) => VO.lines[i].start;
  const voEnd = VO.voEnd;
  const PRE = 0.08; // cuts land just before the word they cut on
  const DURATION = +(voEnd + 3.6).toFixed(2);

  // ---------------- the shot list (see ../plan/shotlist_v27.md) ----------------
  // scene: which SCENES module draws it ('card' = 2D only); v: the shot inside that scene;
  // beats: absolute times of the words the action is cut to; card: 2D overlay; text: narration on/off.
  const S = [];
  const add = (id, scene, v, t0, o = {}) => S.push(Object.assign({ id, scene, v, t0, beats: {} }, o));
  add('S01', 'gaza', 'hook', 0, { title: true, text: false, beats: { strength: cue(0, 'using'), sinning: cue(0, 'sin') } });
  add('S02', 'gaza', 'door', st(1) - PRE, { beats: { prostitute: cue(1, 'prostitute'), gaza: cue(1, 'Gaza') } });
  add('S03', 'gaza', 'rip', cue(1, 'and') - PRE, { pill: 'SAME NIGHT. STILL STRONG.', pillBeat: 'night', beats: { night: cue(1, 'night'), carried: cue(1, 'pulled'), gates: cue(1, 'gates') } });
  add('S04', 'gaza', 'hill', st(2) - PRE, { beats: { fine: cue(2, 'fine') } });
  add('S05', 'card', 'bible', st(3) - PRE, { card: 'bible', beats: { bible: cue(3, 'Bible'), answer: cue(3, 'answer') } });
  // the mirror: four times the Spirit moved on him (the chart's 4) ... four times Delilah called (the fourth stamp in ember)
  add('S06', 'timnah', 'lion', st(4) - PRE, { beats: { again: cue(4, 'Spirit') } });
  add('S07', 'lehi', 'ropes', cue(4, 'LORD') - PRE, { beats: { rushed: cue(4, 'moved') } });
  add('S08', 'card', 'chart', cue(4, 'more') - PRE, { card: 'chart', beats: { judge: cue(4, 'judge') } });
  add('S10', 'sorek', 'delilah', st(5) - PRE, { beats: { delilah: cue(5, 'Delilah'), four: cue(6, 'four') } });
  add('S11', 'sorek', 'call', cue(6, '"The') - PRE, { card: 'shout', beats: { shout: cue(6, '"The'), samson: cue(6, 'Samson') } });
  add('S12', 'sorek', 'traps', st(7) - PRE, { beats: { three: cue(7, 'Three'), broke: cue(7, 'broke'), free: cue(7, 'free') } });
  add('S13', 'sorek', 'shave', st(8) - PRE, { pill: 'HIS SEVEN LOCKS · JUDGES 16:19', pillBeat: 'hair', beats: { told: cue(8, 'told'), heart: cue(8, 'heart'), hair: cue(8, 'hair'), sign: cue(8, 'sign'), shaved: cue(8, 'shaved') } });
  add('S14', 'sorek', 'wake', st(9) - PRE, { pill: 'HE THOUGHT NOTHING CHANGED', pillBeat: 'said', beats: { woke: cue(9, 'woke'), said: cue(9, 'said'), free: cue(9, 'free') } });
  add('S15', 'sorek', 'left', st(10) - PRE, { card: 'verse', verse: 0, verseAt: st(10), beats: { left: cue(10, 'left') } });
  // the three points (Lintel grammar): the number is spoken with its point; a numbered stamp pops over the live scene
  // on the number, then settles into a chapter pill that stays at the bottom for the whole point. No blank cards.
  const CH1 = { n: 1, label: "GIFTS AREN'T EARNED", at: cue(12, 'One'), line: 12 };
  const CH2 = { n: 2, label: "WORKS AREN'T PROOF", at: cue(14, 'Two'), line: 14 };
  const CH3 = { n: 3, label: 'YOU CAN STILL CALL ON GOD', at: cue(18, 'Three'), line: 18 };
  // "So what should we take from his story? Three truths." over the hook's hilltop image, a big 3 TRUTHS stamp
  add('S16', 'gaza', 'hill', st(11) - PRE, { dip: true, intro: { n: 3, label: 'TRUTHS', at: cue(11, 'Three'), line: 11 }, beats: { fine: cue(11, 'take') } });
  add('S17', 'zorah', 'angel', st(12) - PRE, { chapter: CH1, stamp: true, card: 'label', label: '“BEGIN TO SAVE ISRAEL”', ref: 'JUDGES 13:5', labelBeat: 'save', beats: { one: cue(12, 'One'), born: cue(12, 'One') + 0.4, angel: cue(13, 'angel'), save: cue(13, '"begin') } });
  add('S19', 'day', 'crowd', st(14) - PRE, { scrim: 0.82, chapter: CH2, stamp: true, dip: true, card: 'verse', verse: 2, verseAt: cue(15, '"Lord'), beats: { two: cue(14, 'Two'), lord: cue(15, '"Lord'), prophesy: cue(15, 'prophesy'), demons: (cue(15, 'prophesy') + cue(15, 'mighty')) / 2, works: cue(15, 'mighty') } });
  add('S20', 'day', 'door', st(16) - PRE, { chapter: CH2, card: 'verse', verse: 3, verseAt: cue(16, '"I'), beats: { never: cue(16, 'never') } });
  add('S21', 'gaza', 'principle', st(17) - PRE, { chapter: CH2, card: 'neq', neq: ['MIGHTY WORKS', 'KNOWN BY GOD'], beats: { works: cue(17, 'Samson'), knowing: cue(17, 'warning') } });
  add('S22', 'prison', 'mill', st(18) - PRE, { chapter: CH3, stamp: true, dip: true, beats: { three: cue(18, 'Three'), lowest: cue(18, 'lowest'), call: cue(18, 'call') } });
  add('S23', 'prison', 'hair', st(19) - PRE, { chapter: CH3, card: 'label', label: '“BEGAN TO GROW AGAIN”', ref: 'JUDGES 16:22', labelBeat: 'grow', beats: { grow: cue(19, 'grow') } });
  add('S24', 'prison', 'lookup', st(20) - PRE, { chapter: CH3, beats: { pray: cue(20, 'pray') } });
  add('S25', 'dagon', 'pillars', st(21) - PRE, { chapter: CH3, chapterPill: false, card: 'verse', verse: 4, verseAt: cue(21, '"O'), beats: { blind: cue(21, 'Blind'), prayed: cue(21, 'prayed'), remember: cue(21, 'remember'), strengthen: cue(21, 'strengthen') } });
  add('S26', 'dagon', 'fall', st(22) - PRE, { chapter: CH3, chapterPill: false, beats: { called: cue(22, 'called'), answered: cue(22, 'answered'), house: cue(22, 'house'), fell: cue(22, 'fell') } });
  add('S27', 'card', 'heb11', st(23) - PRE, { chapter: CH3, chapterPill: false, card: 'heb11', text: false, beats: { names: cue(23, 'names'), faith: cue(23, '"through'), strong: cue(23, '"were') } });
  // the landing: a fast recap of the three points' images under the question, then the dawn callback with the answer
  { const t0 = st(24) - PRE, tA = cue(24, 'keep') - PRE, tB = cue(24, 'living') - PRE;
    add('S28a', 'zorah', 'angel', t0, { beats: { born: t0 - 9, angel: t0 - 4, save: t0 - 3 } });
    add('S28b', 'day', 'crowd', tA, { scrim: 0.82, beats: { lord: tA - 4, prophesy: tA - 3.5, demons: tA - 3, works: tA - 2.5 } });
    add('S28c', 'dagon', 'fall', tB, { beats: { called: tB - 4, answered: tB - 3, house: tB - 1.2, fell: tB - 0.6 } }); }
  add('S28', 'gaza', 'dawn', cue(24, 'Because') - PRE, { card: 'chips', beats: { purpose: cue(24, 'purpose'), verdict: cue(24, 'approves') } });
  add('S30', 'gaza', 'statement', st(25) - PRE, { card: 'statement', text: false, beats: { gift: cue(25, 'gift'), verdict: cue(25, 'verdict') } });
  add('S32', 'card', 'cta', st(26) - PRE, { card: 'cta', text: false, beats: { heb: cue(26, 'Hebrews'), god: cue(26, 'God'), answered: cue(26, 'answered'), tell: cue(26, 'Tell'), comments: cue(26, 'comments') } });
  S.forEach((s, i) => { s.t1 = i < S.length - 1 ? S[i + 1].t0 : DURATION; s.dur = s.t1 - s.t0; s.i = i; });
  for (const s of S) if (s.chapter) s.chapter.end = s.t1; // the last shot of a chapter sets its end
  const END_T = +(voEnd + 0.45).toFixed(3); // hard cut to the end card
  const shotAt = (t) => { for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return S[i]; return S[0]; };

  // verse cards: exact ESV text (fact-checked)
  const VERSES = [
    { text: 'But he did not know that the LORD had left him.', ref: 'JUDGES 16:20' },
    { text: 'It was from the LORD, for he was seeking an opportunity against the Philistines.', ref: 'JUDGES 14:4' },
    { text: 'Lord, Lord, did we not prophesy in your name, and cast out demons in your name, and do many mighty works in your name?', ref: 'MATTHEW 7:22' },
    { text: 'I never knew you.', ref: 'MATTHEW 7:23' },
    { text: 'O Lord GOD, please remember me and please strengthen me only this once.', ref: 'JUDGES 16:28' },
  ];

  const markers = {};
  S.forEach((s) => { markers[s.id] = s.t0; });
  Object.assign(markers, {
    carried: { t: cue(1, 'pulled'), sync: 'av' }, left: cue(10, 'left'), answered: { t: cue(22, 'answered'), sync: 'av' },
    fell: { t: cue(22, 'fell'), sync: 'av' }, endCard: { t: END_T, sync: 'av' },
    truths: { t: cue(11, 'Three'), sync: 'av' }, one: { t: cue(12, 'One'), sync: 'av' }, two: { t: cue(14, 'Two'), sync: 'av' }, three: { t: cue(18, 'Three'), sync: 'av' },
  });
  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, END_T, VO, cue, cueEnd, ln, st, SHOTS: S, shotAt, VERSES, markers, m };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
