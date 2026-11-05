// Generated native film27 score from verified v10 shot intervals. NO APPROVED VOICE.
(function () {
  const T = globalThis.FW_STORM_TRACK;
  if (!T || T.status !== 'NOT_APPROVED_LAYOUT' || T.fps !== 30) throw Error('Invalid bridge source');
  const U = globalThis.U, FORMAT = U.pickFormat('9:16'), [W,H] = U.formatSize(FORMAT);
  const SHOTS = T.shots.map((s,i) => ({ id:s.id, i, scene:'storm_native', v:s.id,
    t0:s.start_frame/T.fps, t1:s.end_frame/T.fps,
    dur:(s.end_frame-s.start_frame)/T.fps, text:false, scrim:0, title:false,
    claim_ids:s.claim_ids, beats:s.beats }));
  const DURATION=T.duration_s;
  const VO={lines:[], voEnd:DURATION};
  const SCORE={FPS:T.fps, FORMAT, W, H, SAFE:U.safeArea(W,H), STYLE:'flat',
    DURATION, END_T:DURATION + 0.000001, VO, SHOTS, VERSES:[], markers:{},
    shotAt:t => SHOTS[Math.min(SHOTS.length-1,Math.max(0,
      SHOTS.findIndex(s => t < s.t1) < 0 ? SHOTS.length-1 : SHOTS.findIndex(s => t < s.t1)))] };
  globalThis.SCORE=SCORE;
})();
