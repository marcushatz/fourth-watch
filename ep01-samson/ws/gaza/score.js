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
  const DURATION = +(voEnd + 3.2).toFixed(2);

  // ---------------- the shot list (see ../plan/shotlist_v27.md) ----------------
  // scene: which SCENES module draws it ('card' = 2D only); v: the shot inside that scene;
  // beats: absolute times of the words the action is cut to; card: 2D overlay; text: narration on/off.
  const S = [];
  const add = (id, scene, v, t0, o = {}) => S.push(Object.assign({ id, scene, v, t0, beats: {} }, o));
  add('S01', 'gaza', 'hook', 0, { title: true, text: false, beats: { strength: cue(0, 'strength'), sinning: cue(0, 'sinning') } });
  add('S02', 'gaza', 'door', st(1) - PRE, { beats: { prostitute: cue(1, 'prostitute'), gaza: cue(1, 'Gaza') } });
  add('S03', 'gaza', 'rip', cue(1, 'and') - PRE, { beats: { night: cue(1, 'night'), carried: cue(1, 'carried'), gates: cue(1, 'gates') } });
  add('S04', 'gaza', 'hill', st(2) - PRE, { beats: { fine: cue(2, 'fine') } });
  add('S05', 'card', 'bible', st(3) - PRE, { card: 'bible', beats: { bible: cue(3, 'Bible'), answer: cue(3, 'answer') } });
  add('S06', 'timnah', 'lion', st(4) - PRE, { beats: { again: cue(4, 'again', 1) } });
  add('S07', 'timnah', 'ashkelon', cue(4, '"the') - PRE, { beats: { rushed: cue(4, 'rushed') } });
  add('S08', 'lehi', 'ropes', cue(4, 'more') - PRE, { beats: { judge: cue(4, 'judge') } });
  add('S09', 'timnah', 'bride', st(5) - PRE, { card: 'label', label: '“SHE IS RIGHT IN MY EYES”', ref: 'JUDGES 14:3', labelBeat: 'eyes', beats: { demanded: cue(5, 'demanded'), wife: cue(5, 'wife'), objection: cue(5, 'objection'), eyes: cue(5, '"she') } });
  add('S10', 'sorek', 'delilah', st(6) - PRE, { beats: { delilah: cue(6, 'Delilah'), four: cue(7, 'Four') } });
  add('S11', 'sorek', 'call', cue(7, '"The') - PRE, { card: 'shout', beats: { shout: cue(7, '"The'), samson: cue(7, 'Samson') } });
  add('S12', 'sorek', 'traps', st(8) - PRE, { beats: { three: cue(8, 'Three'), broke: cue(8, 'broke'), free: cue(8, 'free') } });
  add('S13', 'sorek', 'shave', st(9) - PRE, { beats: { told: cue(9, 'told'), heart: cue(9, 'heart'), hair: cue(9, 'hair'), sign: cue(9, 'sign'), shaved: cue(9, 'shaved') } });
  add('S14', 'sorek', 'wake', st(10) - PRE, { beats: { woke: cue(10, 'woke'), said: cue(10, 'said'), free: cue(10, 'free') } });
  add('S15', 'sorek', 'left', st(11) - PRE, { card: 'verse', verse: 0, text: false, beats: { left: cue(11, 'left') } });
  add('S16', 'card', 'num', st(12) - PRE, { card: 'num', n: 1, head: 'WHAT WAS THE STRENGTH FOR?', text: false });
  add('S17', 'zorah', 'angel', st(13) - PRE, { card: 'label', label: '“BEGIN TO SAVE ISRAEL”', ref: 'JUDGES 13:5', labelBeat: 'save', beats: { born: cue(13, 'born'), angel: cue(13, 'angel'), save: cue(13, '"begin') } });
  add('S18', 'timnah', 'wide', st(14) - PRE, { card: 'verse', verse: 1, text: false, beats: { lord: cue(14, 'LORD'), seeking: cue(14, 'seeking') } });
  add('S19', 'card', 'map', st(15) - PRE, { card: 'map', beats: { plan: cue(15, 'plan'), reward: cue(15, 'reward') } });
  add('S20', 'gaza', 'question', st(16) - PRE, { card: 'question', q: 'CAN A GIFT KEEP WORKING WHILE GOD ISN\'T PLEASED?', text: false });
  add('S21', 'card', 'num', st(17) - PRE, { card: 'num', n: 2, head: 'LISTEN TO JESUS', text: false });
  add('S22', 'day', 'crowd', st(18) - PRE, { card: 'verse', verse: 2, text: false, beats: { lord: cue(18, '"Lord'), prophesy: cue(18, 'prophesy'), demons: cue(18, 'demons'), works: cue(18, 'mighty') } });
  add('S23', 'day', 'door', st(19) - PRE, { card: 'verse', verse: 3, text: false, beats: { never: cue(19, 'never') } });
  add('S24', 'gaza', 'principle', st(20) - PRE, { card: 'neq', beats: { works: cue(20, 'mighty'), knowing: cue(20, 'knowing') } });
  add('S25', 'prison', 'mill', st(21) - PRE, { beats: { give: cue(21, 'give') } });
  add('S26', 'card', 'num', st(22) - PRE, { card: 'num', n: 3, head: 'LOOK AT HOW HIS STORY ENDS', text: false, beats: { no: cue(22, 'No') } });
  add('S27', 'prison', 'hair', st(23) - PRE, { card: 'label', label: '“BEGAN TO GROW AGAIN”', ref: 'JUDGES 16:22', labelBeat: 'grow', beats: { grow: cue(23, 'grow') } });
  add('S28', 'prison', 'lookup', st(24) - PRE, { beats: { pray: cue(24, 'pray') } });
  add('S29', 'dagon', 'pillars', st(25) - PRE, { card: 'verse', verse: 4, beats: { blind: cue(25, 'Blind'), prayed: cue(25, 'prayed'), remember: cue(25, 'remember'), strengthen: cue(25, 'strengthen') } });
  add('S30', 'dagon', 'fall', st(26) - PRE, { beats: { called: cue(26, 'called'), answered: cue(26, 'answered'), house: cue(26, 'house'), fell: cue(26, 'fell') } });
  add('S31', 'card', 'heb11', st(27) - PRE, { card: 'heb11', text: false, beats: { names: cue(27, 'names'), faith: cue(27, '"through'), strong: cue(27, '"were') } });
  add('S32', 'gaza', 'dawn', st(28) - PRE, { beats: { purpose: cue(28, 'purpose'), verdict: cue(28, 'verdict') } });
  add('S33', 'gaza', 'dawn2', st(29) - PRE, { beats: { proof: cue(29, 'proof') } });
  add('S34', 'gaza', 'statement', st(30) - PRE, { card: 'statement', text: false, beats: { gift: cue(30, 'gift'), verdict: cue(30, 'verdict') } });
  add('S35', 'gaza', 'dawn3', st(31) - PRE, { beats: {} });
  add('S36', 'card', 'cta', st(32) - PRE, { card: 'cta', text: false, beats: { heb: cue(32, 'Hebrews'), answered: cue(32, 'answered'), comments: cue(32, 'comments') } });
  S.forEach((s, i) => { s.t1 = i < S.length - 1 ? S[i + 1].t0 : DURATION; s.dur = s.t1 - s.t0; s.i = i; });
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
    carried: { t: cue(1, 'carried'), sync: 'av' }, left: cue(11, 'left'), answered: { t: cue(26, 'answered'), sync: 'av' },
    fell: { t: cue(26, 'fell'), sync: 'av' }, endCard: voEnd + 0.4,
  });
  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, VO, cue, cueEnd, ln, st, SHOTS: S, shotAt, VERSES, markers, m };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
