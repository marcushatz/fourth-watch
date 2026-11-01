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
    for (let i = 0, n = 0; i < L.words.length; i++) if (norm(L.words[i].w) === norm(w)) { if (n === nth) { k = i; break; } n++; }
    if (k < 0) for (let i = 0, n = 0; i < L.words.length; i++) if (norm(L.words[i].w).startsWith(norm(w))) { if (n === nth) { k = i; break; } n++; }
    if (globalThis.CUE_LOG) globalThis.CUE_LOG.push([li, w, nth, k >= 0 ? L.words[k].w : null, k >= 0 ? +L.words[k].s.toFixed(2) : null]);
    if (k < 0) throw new Error(`cue: word "${w}" not in line ${li}: ${L.text}`);
    return L.words[k].s;
  };
  const cueEnd = (li, w, nth = 0) => { const L = VO.lines[li]; const s = cue(li, w, nth); return L.words.find((x) => x.s === s).e; };
  const ln = (i) => VO.lines[i];
  const st = (i) => VO.lines[i].start;
  const voEnd = VO.voEnd;
  const PRE = 0.08; // cuts land just before the word they cut on

  // ---------------- the shot list (script v57, timed to the recorded take) ----------------
  // scene: which SCENES module draws it ('card' = 2D only); v: the shot inside that scene;
  // beats: absolute times of the words the action is cut to; card: 2D overlay; text: narration on/off.
  const S = [];
  const add = (id, scene, v, t0, o = {}) => S.push(Object.assign({ id, scene, v, t0, beats: {} }, o));
  // ---------------- v58 shot list (shotlist_v58.md; option A timings: every recorded line kept) ----------------
  // Every clause shows that clause happening (research/direction_rules.md). Scene/v names marked NEW need building.
  const L = (id, scene, v, t0, o) => add(id, scene, v, t0, o);
  // HOOK: Samson heaves the Gaza gate (the strength), the pull-out reveals the house he left and the waiting men (the life)
  L('H1', 'gaza', 'hookGate', 0, { size: 'ms', act: 'Samson grips the gate posts and heaves; the doors creak up in a shower of dust', change: 'pull-out on "how" reveals the lit doorway behind him and the men waiting at the gate', cam: { move: 'pull', amt: 45, job: 'hook-reveal' }, beats: { heave: 0.3, reveal: cue(0, 'how') } });
  L('S1', 'timnah', 'lion', st(1) - PRE, { size: 'ws', act: 'a young lion leaps at Samson, roaring; on "God" gold light rushes down and he catches it', name: 'SAMSON · JUDGES 13-16', pill: 'THE SPIRIT OF THE LORD · 14:6', cam: { move: 'push', amt: 8, job: 'reveal' }, long: 'set', beats: { leap: cue(1, 'Samson'), strongest: cue(1, 'strongest'), god: cue(1, 'God') } });
  L('S3', 'gaza', 'enter', cue(1, 'Yet') - PRE, { size: 'ws', act: 'Samson walks into a lit doorway in the Gaza street; the door shuts', name: 'GAZA · JUDGES 16:1', flashIn: true, cam: { move: 'drift', amt: 3 } });
  L('S4', 'gaza', 'ambush', cue(1, 'That') - PRE, { size: 'ws', act: 'Philistine men surround the place and settle in to wait at the gate, keeping quiet', pill: 'WAITING ALL NIGHT · 16:2', cam: { move: 'drift', amt: 3 } });
  L('S5', 'gaza', 'rip', cue(1, 'he', 1) - PRE, { size: 'ms', act: 'Samson rips the doors and posts out on "pulled", hoists them onto his shoulders and walks off', cam: { move: 'pan', amt: 20, job: 'follow' }, beats: { pulled: cue(1, 'pulled') } });
  L('D1', 'sorek', 'together', st(2) - PRE, { size: 'ms', act: 'Samson turns to Delilah beside him; she smiles', name: 'DELILAH · JUDGES 16:4', flashIn: true });
  L('D2', 'sorek', 'lords', cue(2, 'and') - PRE, { size: 'ws', act: 'the Philistine lords walk in at her door', pill: 'THE PHILISTINE LORDS' });
  L('D3', 'sorek', 'silver', cue(2, 'offered') - PRE, { size: 'ms', act: 'a lord pours silver into her hands', change: 'counter ticks to 1,100', counter: { to: 1100, beat: cue(2, 'silver'), label: 'PIECES OF SILVER', sub: 'FROM EACH LORD · JUDGES 16:5', y: 0.7 } });
  L('T1', 'sorek', 'call', st(3) - PRE, { size: 'ms', act: 'Delilah calls toward the door', change: 'call stamps 1-3 land on her words', card: 'shout', shoutN: 3, beats: { shout: cue(3, '"The'), samson: cue(3, 'Samson') } });
  // Oct 31 cross-check: no piece under 1 s, so the three escapes are three comic panels on ONE held shot (BibleProject insets), each bursting on its word
  L('T2', 'sorek', 'traps3', cue(3, 'And') - PRE, { size: 'ms', act: 'three panels slide in side by side; in each Samson bursts a binding on its word: the bowstrings, the new ropes, the loom pin', change: 'panel 1 on "three", panel 2 on "times", panel 3 on "broke"; all three flash gold-white on "free"', list: true, beats: { three: cue(3, 'three', 1), times: cue(3, 'times', 1), broke: cue(3, 'broke'), free: cue(3, 'free') } });
  L('E1', 'sorek', 'whisper', st(4) - PRE, { size: 'mcu', act: 'Samson leans in and whispers to Delilah; her eyes narrow', pill: 'ALL HIS HEART · 16:17' });
  L('E2', 'sorek', 'shave', cue(4, 'While') - PRE, { size: 'ms', act: 'Samson asleep on her lap; the barber shaves', change: 'the seven locks fall one by one', pill: 'SEVEN LOCKS · 16:19', beats: { shave: cue(4, 'shave') } });
  L('E3', 'sorek', 'locks', cue(4, 'the') - PRE, { size: 'insert', change: 'lamplight on the seven locks on the floor; the faint gold rim on Samson still glows', pill: 'SET APART TO GOD · NUMBERS 6:5' });
  L('F1', 'sorek', 'call4', st(5) - PRE, { size: 'ms', act: 'Delilah calls a fourth time; on "woke" Samson stirs awake on her lap', change: 'the 4th stamp lands in ember', card: 'shout', shoutN: 4, beats: { shout: cue(5, 'fourth'), woke: cue(5, 'woke') } });
  L('F2', 'sorek', 'wake', cue(5, 'and') - PRE, { size: 'mcu', act: 'Samson, shaved, rolls his shoulders and half-smiles as he speaks; soldiers come out of the inner room behind him', beats: { said: cue(5, 'said'), as: cue(5, 'as'), shake: cue(5, 'shake') } });
  L('G1', 'sorek', 'seized', st(6) - PRE, { size: 'ms', act: 'Samson tries to shake free and nothing gives; the soldiers seize him', change: 'the gold rim on him goes out on "left"', card: 'verse', verse: 0, verseAt: st(6), beats: { left: cue(6, 'left') } });
  L('J1', 'lehi', 'ropes', st(7) - PRE, { size: 'ws', act: 'at Lehi the ropes fall from his arms in gold light (15:14)', card: 'label', label: '“as at other times”', ref: 'JUDGES 16:20', labelBeat: 'as', labelY: 0.665, flashIn: true, beats: { as: cue(7, '"as') } });
  L('J2', 'card', 'tally', cue(7, 'It') - PRE, { size: 'insert', change: 'tally: bowstrings, ropes, loom checked; THIS TIME ?; a red X lands on "again"', pill: 'HE ASSUMED', tally: { items: [{ label: 'BOWSTRINGS', beat: cue(7, 'always') }, { label: 'NEW ROPES', beat: cue(7, 'worked') }, { label: 'THE LOOM', beat: cue(7, 'before') }, { label: 'THIS TIME', mark: '?', beat: cue(7, 'assumed') }], xBeat: cue(7, 'again') } });
  // Oct 31 cross-check: one held set with things entering on their words (Bible Animations), not three sub-1 s cuts.
  // A plain, blank-faced modern figure gains each gift; he is never shown doing wrong (Marcus: never assume the viewer strayed).
  L('K1', 'modern', 'gifts1', st(8) - PRE, { size: 'ws', act: 'a blank-faced modern figure on a small stage: on "gifted" a guitar lands in his hands under a spotlight; on "lead" a small group steps in behind him and follows his hand; on "help" he lifts a fallen man to his feet', change: 'three things enter on three words', beats: { gifted: cue(8, 'gifted'), lead: cue(8, 'lead'), help: cue(8, 'help') } });
  L('K4', 'gaza', 'hookGate', cue(8, 'But') - PRE, { size: 'ms', act: 'callback: Samson under the gate on his shoulders, the lit house behind him', change: 'stamp lands on "approves"', callback: true, stamp: { text: 'USED ≠ APPROVED', beat: cue(8, 'approves'), y: 0.68 }, cam: { move: 'pull', amt: 8 } });
  L('L1', 'day', 'crowd', st(9) - PRE, { size: 'xws', act: 'a great crowd gathers before a tall door of light', pill: 'JUDGMENT DAY · MATTHEW 7:22', flashIn: true });
  L('L2', 'day', 'plead', cue(9, 'many') - PRE, { size: 'ws', act: 'people raise scrolls and staffs toward the door, pleading', cam: { move: 'push', amt: 10, job: 'reveal' } });
  L('L3', 'day', 'door', cue(9, 'and') - PRE, { size: 'ms', change: 'the light in the doorway narrows and the door closes on "never"', card: 'verse', verse: 1, verseAt: cue(9, 'declare'), beats: { never: cue(9, 'never') } });
  L('M1', 'prison', 'mill', st(10) - PRE, { size: 'ws', act: 'blind Samson in shackles grinds at the mill; his hair has begun to grow', pill: 'THE PRISON MILL · 16:21', dip: true });
  L('M2', 'dagon', 'led', cue(10, 'brought') - PRE, { size: 'ws', act: 'the boy leads Samson by the hand into Dagon\'s house; the lords laugh and point', pill: 'BROUGHT OUT TO ENTERTAIN · 16:25' });
  L('M3', 'dagon', 'pray', cue(10, 'he') - PRE, { size: 'ms', act: 'Samson between the pillars lifts his face and prays', card: 'verse', verse: 2, verseAt: cue(10, '"O'), beats: { remember: cue(10, 'remember') } });
  L('M4', 'dagon', 'revenge', cue(10, 'Even') - PRE, { size: 'mcu', act: 'his face hardens; his hands rest on the pillars, feeling them (16:26)', change: 'ember tint', pill: '"FOR MY TWO EYES" · 16:28' });
  L('N1', 'prison', 'cost', st(11) - PRE, { size: 'insert', change: 'the shackles and the cloth over his eyes', pill: 'HIS EYES · HIS FREEDOM' });
  L('N2', 'sorek', 'wake', cue(11, 'Earlier') - PRE, { size: 'ms', act: 'flashback: Samson wakes, sure he will shake free' });
  L('N3', 'dagon', 'pray', cue(11, 'Now') - PRE, { size: 'ms', act: 'back between the pillars, face lifted, asking for strength' });
  L('P1', 'dagon', 'push', st(12) - PRE, { size: 'ms', act: 'Samson grasps the two middle pillars and bows with all his strength', change: 'cracks run up both pillars', cam: { move: 'push', amt: 12, job: 'reveal' }, beats: { answered: cue(12, 'pushed') } });
  L('P2', 'dagon', 'fall', cue(12, 'and') - PRE, { size: 'ws', act: 'the roof comes down and the lords topple into dust', change: 'on "Samson died with them" the dust settles over the rubble in cool daylight', long: 'set', beats: { house: cue(12, 'building'), fell: cue(12, 'fell'), died: cue(12, 'died') } });
  L('R1', 'dagon', 'after', st(13) - PRE, { size: 'ws', change: 'the dust keeps settling under the verse', card: 'verse', verse: 3, verseAt: cue(13, '"So'), long: 'verse' });
  L('Q1', 'dagon', 'prayEcho', st(14) - PRE, { size: 'ms', act: 'callback: Samson\'s lifted face between the pillars in silhouette', change: 'dissolve to dawn over Gaza' });
  L('Q2', 'card', 'heb11', cue(14, 'And') - PRE, { change: 'the scroll unrolls; the names light up; SAMSON glows', card: 'heb11', text: false, beats: { names: cue(14, 'names'), faith: cue(14, 'faith'), strong: cue(14, '"were') } });
  L('Q3', 'dawn', 'walkUp', cue(14, '"were') - PRE, { size: 'ws', act: 'people walk up a hill into dawn light', arrival: true });
  L('Z1', 'card', 'cta', st(15) - PRE, { card: 'cta', text: false, beats: { strength: cue(15, 'strength'), failures: cue(15, 'failures'), prayer: cue(15, 'prayer'), why: cue(15, 'Why') } });
  S.forEach((s) => { if (!s.cam && s.scene !== 'card') s.cam = { move: 'drift', amt: 3 }; });
  const END_T = +(voEnd + 0.3).toFixed(3);
  const OUTRO = 2.5; // the question holds a beat, then the outro (rendered separately) is appended
  const DURATION = END_T;
  S.forEach((s, i) => { s.t1 = i < S.length - 1 ? S[i + 1].t0 : DURATION; s.dur = s.t1 - s.t0; s.i = i; });
  const shotAt = (t) => { for (let i = S.length - 1; i >= 0; i--) if (t >= S[i].t0) return S[i]; return S[0]; };

  // verse cards: exact ESV text (fact-checked)
  const VERSES = [
    { text: 'But he did not know that the LORD had left him.', ref: 'JUDGES 16:20' },
    { text: 'I never knew you.', ref: 'MATTHEW 7:23' },
    // marks: the card is acted on while it holds (a phrase turns gold on its spoken word), so a 5-6 s card keeps changing
    { text: 'Then Samson called to the LORD and said, ‘O Lord GOD, please remember me and please strengthen me only this once, O God, that I may be avenged on the Philistines for my two eyes.’', ref: 'JUDGES 16:28', maxW: 780,
      marks: [{ phrase: 'please remember me', at: cue(10, 'remember'), kind: 'gold' }, { phrase: 'please strengthen me', at: cue(10, 'strengthen'), kind: 'gold' }] },
    { text: 'So the dead whom he killed at his death were more than those whom he had killed during his life.', ref: 'JUDGES 16:30',
      marks: [{ phrase: 'more than those', at: cue(13, 'more'), kind: 'gold' }] },
  ];

  const markers = {};
  S.forEach((s) => { markers[s.id] = s.t0; });
  Object.assign(markers, {
    pulled: { t: cue(1, 'pulled'), sync: 'av' }, left: cue(6, 'left'), fell: { t: cue(12, 'fell'), sync: 'av' },
  });
  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, END_T, OUTRO, VO, cue, cueEnd, ln, st, SHOTS: S, shotAt, VERSES, markers, m };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
