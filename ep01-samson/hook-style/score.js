// THE SCORE — single source of truth for timing. Every time comes from vo.js (the words, generated from
// ../episode.md); when the real voice is recorded, vo.js is regenerated from its word timings and the
// music, the cuts and the captions all move with it.
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

  // cue(line, word): start time of a word (by index or by text) in a VO line
  const cue = (li, w = 0) => {
    const L = VO.lines[li];
    if (typeof w === 'number') return L.words[Math.max(0, Math.min(L.words.length - 1, w))].s;
    const i = L.words.findIndex((x) => x.w.toLowerCase().replace(/[^a-z']/g, '').startsWith(w.toLowerCase()));
    if (i < 0) throw new Error(`cue: word "${w}" not in line ${li}: ${L.text}`);
    return L.words[i].s;
  };
  const ln = (i) => VO.lines[i];
  const voEnd = VO.voEnd;
  const ev = {
    lion: cue(3, 'apart'),            // the lion is caught (burst + shake + timpani)
    thousand: cue(3, 'thousand'),
    begin: cue(6, 'begin'),
    turn: ln(12).start,
    prayed: cue(13, 'prayed'),
    answered: cue(14, 'answered'),
    fall: cue(14, 'came'),            // the pillars go (shake + sub boom)
    david: cue(15, 'David'),
    faithful: cue(16, 'faithful'),
    dawn: ln(17).start,
    remember: cue(18, 'remember'),
    endCard: voEnd + 0.45,
    loopBack: voEnd + 2.45,
  };
  const DURATION = +(voEnd + 3.05).toFixed(2);
  const S = {
    hook: [0, ln(1).start], stakes: [ln(1).start, ln(4).start], story: [ln(4).start, ln(12).start],
    turn: [ln(12).start, ln(16).start], landing: [ln(16).start, voEnd], end: [voEnd, DURATION],
  };
  const markers = {
    lion: { t: ev.lion, sync: 'av' }, thousand: { t: ev.thousand, sync: 'av' }, turn: { t: ev.turn, sync: 'a' },
    fall: { t: ev.fall, sync: 'av' }, dawn: ev.dawn, endCard: ev.endCard,
  };
  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, VO, cue, ln, ev, S, markers, m };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
