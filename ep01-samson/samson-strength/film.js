// THE FILM — draws frame t (pure function of t). Sets are 2.5D three.js scenes (fw/*), rendered into an
// offscreen WebGL canvas; this file stages the shots (camera, action, light), the transitions, and the screen layer.
(function () {
  const G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, FW = globalThis.FW, THREE = globalThis.THREE;
  const VO = S.VO, W = G.W, H = G.H, cue = S.cue, ln = S.ln, ev = S.ev;
  const { clamp, lerp, prog, ease } = FW;
  let sets = {}, cam;

  // ---------- camera helpers ----------
  const K = (p, l, f = 34) => ({ p, l, f });
  const move = (A, B, t, t0, t1, e = ease.inOut) => FW.camLerpK(A, B, e(clamp((t - t0) / Math.max(0.001, t1 - t0))));
  const shake = (t, t0, amp = 0.05, dur = 0.4) => { const d = t - t0; if (d < 0 || d > dur) return [0, 0, 0]; const k = amp * Math.pow(1 - d / dur, 2); return [Math.cos(d * 71) * k, Math.sin(d * 53 + 1) * k, 0]; }; // cos: the biggest jolt lands on the hit frame
  const addShake = (k, sk) => { k.p = k.p.map((v, i) => v + sk[i]); k.l = k.l.map((v, i) => v + sk[i] * 0.6); return k; };

  // ---------- the shot list (times come from the words in vo.js) ----------
  const tb = cue(0, 'give');
  const tLionLeap = cue(3, 'lion') - 0.1, tCatch = cue(3, 'apart');
  const tStrike = cue(3, 'thousand');
  const SH = [
    { id: 'SH01 hook: bound at Lehi, ropes burn off', set: 'hook', a: 0, tin: null, shift: 0.1, drift: 0,
      state: (t) => ({ tb }),
      cam: (t) => { const A = K([0.55, 0.15, 6.9], [0.15, 1.62, 0]), B = K([0.4, 0.3, 5.5], [0.12, 1.6, 0]), C = K([0.7, 0.35, 7.4], [0.12, 1.75, 0]), D = K([0.2, 0.45, 7.7], [0.05, 1.8, 0]);
        const d = t - tb; const k = d < 0 ? move(A, B, t, 0, tb) : d < 1.1 ? move(B, C, t, tb, tb + 1.1, ease.out) : move(C, D, t, tb + 1.1, tb + 3.5); return addShake(k, shake(t, tb, 0.06, 0.45)); } },
    { id: 'SH02 Zorah: the wife his parents did not want', set: 'zorah', a: ln(1).start - 0.12, tin: { type: 'fade', d: 0.35 },
      state: (t) => ({ mem: prog(t, cue(1, 'Philistine') - 0.25, cue(1, 'Philistine') + 0.35, ease.out), shake: prog(t, cue(1, 'parents') - 0.2, cue(1, 'parents') + 0.3), point: prog(t, cue(1, 'chase') - 0.2, cue(1, 'chase') + 0.4) }),
      cam: (t) => move(K([-0.9, 1.9, 12.4], [-0.55, 2.15, 0], 32), K([0.0, 1.9, 11.4], [0.05, 2.2, 0], 32), t, ln(1).start - 0.1, ln(2).start + 0.2),
      tags: () => [['HIS PARENTS', 'parents', ln(1).start + 0.3, 'left'], ['SAMSON', 'samson', ln(1).start + 0.6, 'right']] },
    { id: 'SH03 Delilah: he tells her how', set: 'delilah', a: ln(2).start - 0.1, tin: { type: 'fade', d: 0.3 }, drift: -0.5, shift: 0.1,
      state: (t) => ({ lean: prog(t, cue(2, 'tell') - 0.3, cue(2, 'tell') + 0.6) }),
      cam: (t) => move(K([0.0, 1.6, 8.2], [0.0, 1.85, 0], 30), K([0.05, 1.5, 6.6], [0.05, 1.7, 0], 30), t, cue(2, 'Delilah') - 0.1, ln(3).start + 0.3),
      tags: () => [['DELILAH · JUDGES 16:17', 'delilah', cue(2, 'Delilah') + 0.1, 'left']] },
    { id: 'SH04 vineyards: the Spirit rushes, the lion', set: 'vineyard', a: ln(3).start - 0.1, tin: { type: 'cut' },
      state: (t) => { const g = prog(t, cue(3, 'gave') - 0.1, cue(3, 'strength') + 0.1, ease.out); const leap = prog(t, tLionLeap, tCatch, ease.out); const caught = prog(t, tCatch, tCatch + 0.25);
        return { gold: g, flash: Math.exp(-Math.max(0, t - cue(3, 'strength')) * 4) * (t > cue(3, 'gave') ? 1 : 0), walking: true, walk: t, brace: prog(t, tLionLeap - 0.35, tLionLeap + 0.1),
          run: prog(t, cue(3, 'strength') + 0.1, tLionLeap, (x) => x), leap, caught, burst: t > tCatch ? Math.exp(-(t - tCatch) * 1.4) : 0, burstT: Math.max(0, t - tCatch), samX: clamp((t - ln(3).start) * 0.15, 0, 0.35) }; },
      cam: (t) => addShake(move(K([-0.3, 1.1, 10.5], [-0.2, 1.9, 0], 34), K([0.35, 1.0, 9.0], [0.3, 1.75, 0], 34), t, ln(3).start, cue(3, 'and') + 0.2), shake(t, tCatch, 0.07, 0.4)),
      tags: () => [['JUDGES 14:6', 'samson', cue(3, 'strength'), 'left']] },
    { id: 'SH05 Lehi: a thousand men with a jawbone', set: 'lehi', a: cue(3, 'strike') - 0.12, tin: { type: 'cut' },
      state: (t) => ({ swing: prog(t, tStrike - 0.35, tStrike + 0.05), fall: prog(t, tStrike - 0.1, tStrike + 1.4, ease.out), burst: t > tStrike ? Math.exp(-(t - tStrike) * 1.2) : 0, burstT: Math.max(0, t - tStrike) }),
      drift: -0.2,
      cam: (t) => addShake(move(K([0.2, 0.85, 10.6], [0.25, 1.95, 0], 36), K([0.35, 1.0, 11.8], [0.45, 2.05, 0], 36), t, cue(3, 'strike'), ln(4).start), shake(t, tStrike, 0.06, 0.35)),
      big: (t) => { const k = clamp((t - tStrike) / 1.3); return k > 0 ? { n: Math.round(1000 * ease.out(k)), a: prog(t, tStrike - 0.05, tStrike + 0.15) * (1 - prog(t, ln(4).start - 0.35, ln(4).start)) } : null; } },
    { id: 'SH06 the field: the angel of the LORD and his mother (13:3); the 13:5 card', set: 'field', a: ln(4).start - 0.15, tin: { type: 'sweep', d: 0.6 },
      state: (t) => ({ angel: prog(t, cue(4, 'angel') - 0.25, cue(4, 'angel') + 0.6, ease.out) }),
      cam: (t) => move(K([-0.6, 1.3, 8.6], [-0.2, 1.55, 0], 34), K([0.1, 1.45, 6.6], [0.05, 1.65, 0], 34), t, ln(4).start - 0.1, ln(6).start),
      tags: () => [['JUDGES 13:3', 'angel', cue(4, 'angel') + 0.5, 'right']] },
    { id: 'SH08 timeline: begin', set: 'valley', a: ln(6).start - 0.12, tin: { type: 'fade', d: 0.4 }, shift: 0.03,
      state: () => ({ night: 1, banners: 0 }),
      cam: (t) => move(K([0, 0.62, 9.5], [0, 0.8, -10], 36), K([0, 0.72, 8.6], [0, 0.86, -10], 36), t, ln(6).start, ln(7).start),
      timeline: (t) => ({ a: prog(t, ln(6).start, ln(6).start + 0.4), draw: prog(t, ln(6).start, ln(6).start + 0.8), marks: [
        { label: 'SAMSON', sub: 'BEGIN · JUDGES 13:5', x: 0.08, on: prog(t, cue(6, 'begin') - 0.1, cue(6, 'begin') + 0.25), gold: true }, { label: '', sub: 'ISRAEL SAVED?', x: 0.92, on: 0, empty: true }] }) },
    { id: 'SH09 Israel under Philistine rule', set: 'valley', a: ln(7).start - 0.1, tin: { type: 'cut' }, shift: 0.05,
      state: () => ({ night: 0.4, banners: 1, workers: 1 }),
      cam: (t) => move(K([-2.6, 0.55, 6.6], [-1.6, 0.72, -6.5], 34), K([1.0, 0.6, 5.9], [0.7, 0.74, -6.5], 34), t, ln(7).start, ln(8).start + 0.2),
      tags: () => [['THE PHILISTINES RULED OVER ISRAEL · JUDGES 14:4', 'banner', cue(7, 'Israel') - 0.1, 'center']] },
    { id: 'SH10 Etam: his own people tie him up', set: 'etam', a: ln(8).start - 0.1, tin: { type: 'cut' },
      state: (t) => ({ tie: prog(t, ln(8).start, cue(8, 'over') + 0.3, (x) => x) }),
      cam: (t) => move(K([0.15, 1.35, 7.4], [0.05, 1.45, 0], 34), K([1.8, 2.8, 13.5], [1.5, 2.0, 0], 34), t, cue(8, 'people') - 0.1, ln(9).start + 0.2),
      tags: () => [['3,000 OF HIS OWN PEOPLE · JUDGES 15:11', 'crowd', cue(8, 'people') + 0.4, 'right']] },
    { id: 'SH11 the feast at Timnah; the 14:4 card', set: 'feast', a: ln(9).start - 0.1, tin: { type: 'fade', d: 0.35 },
      state: (t) => ({ gold: prog(t, cue(9, 'plan') - 0.3, cue(9, 'plan') + 0.6, ease.out) }),
      cam: (t) => move(K([0.2, 1.4, 7.4], [0.2, 1.55, 0], 32), K([0.0, 2.6, 8.6], [0.1, 2.0, 0], 32), t, cue(9, 'marriage') - 0.2, ln(11).start) },
    { id: 'SH13a Samson wanted a wife', set: 'feast', a: ln(11).start - 0.1, tin: { type: 'fade', d: 0.3 },
      state: () => ({ gold: 0 }),
      cam: (t) => move(K([-0.35, 1.45, 4.9], [-0.1, 1.5, 0], 32), K([-0.15, 1.45, 4.3], [-0.05, 1.5, 0], 32), t, ln(11).start, cue(11, 'God')) },
    { id: 'SH13b God wanted to free His people', set: 'valley', a: cue(11, 'God') - 0.12, tin: { type: 'cut' }, shift: 0.04,
      state: (t) => ({ night: 0.25, dawnish: 0.75 * prog(t, cue(11, 'free') - 0.3, ln(12).start, ease.inOut), banners: 1, workers: 1 }),
      cam: (t) => move(K([1.6, 0.6, 7.2], [0.4, 0.95, -6.5], 34), K([1.2, 0.75, 6.4], [0.2, 1.05, -6.5], 34), t, cue(11, 'God'), ln(12).start) },
    { id: 'SH14a the turn: first light on Samson', set: 'ridgeEnd', a: ln(12).start - 0.1, tin: { type: 'fade', d: 0.5 },
      state: (t) => ({ dawn: 0.12 + 0.2 * prog(t, ln(12).start, cue(12, 'Israel')), reveal: 0 }),
      cam: (t) => move(K([1.9, 0.9, 10.2], [0.8, 1.55, 0], 34), K([1.2, 1.1, 7.4], [0.5, 1.6, 0], 34), t, ln(12).start, cue(12, 'Israel')) },
    { id: 'SH14b Israel needed saving', set: 'valley', a: cue(12, 'Israel') - 0.12, tin: { type: 'cut' }, shift: 0.05,
      state: (t) => ({ night: 0.3, dawnish: 0.35 + 0.25 * prog(t, cue(12, 'Israel'), ln(13).start), banners: 1, workers: 1 }),
      cam: (t) => move(K([-1.2, 0.6, 6.4], [-2.2, 0.95, -6.5], 34), K([-1.6, 0.66, 5.6], [-2.5, 1.0, -6.5], 34), t, cue(12, 'Israel'), ln(13).start) },
    { id: 'SH15 the prison mill at Gaza', set: 'prison', a: ln(13).start - 0.12, tin: { type: 'dip', d: 0.5 },
      state: (t) => ({ walk: t }),
      cam: (t) => move(K([0.6, 1.6, 7.2], [0.9, 1.75, 0], 34), K([1.5, 1.5, 6.4], [1.3, 1.65, 0], 34), t, ln(13).start, cue(13, 'But')),
      tags: () => [['GAZA · JUDGES 16:21', 'samson', cue(13, 'cost'), 'right']] },
    { id: 'SH16 the temple of Dagon: he prays', set: 'temple', a: cue(13, 'But') - 0.1, tin: { type: 'cut' }, shift: 0.06,
      state: (t) => ({ lead: prog(t, cue(13, 'But'), cue(13, 'prayed') - 0.2), pray: prog(t, cue(13, 'prayed') - 0.2, cue(13, 'prayed') + 0.4), gold: prog(t, cue(13, 'prayed') - 0.1, cue(13, 'strengthen') + 0.4, ease.out) }),
      cam: (t) => move(K([0.6, 1.6, 9.2], [0.4, 1.9, 0], 34), K([0.3, 1.55, 6.8], [0.3, 1.7, 0], 34), t, cue(13, 'prayed') - 0.1, ln(14).start) },
    { id: 'SH17 the pillars', set: 'pillars', a: ln(14).start - 0.1, tin: { type: 'cut' },
      state: (t) => ({ push: prog(t, ln(14).start - 0.1, cue(14, 'answered') + 0.2, ease.out), gold: prog(t, cue(14, 'answered') - 0.05, cue(14, 'answered') + 0.35, ease.out), crack: prog(t, cue(14, 'answered') + 0.25, cue(14, 'came'), (x) => x), fall: prog(t, cue(14, 'temple') + 0.05, cue(14, 'He') - 0.05, (x) => x * x * 0.6 + x * 0.4) }),
      shift: 0.08, drift: 0.4,
      cam: (t) => addShake(move(K([0, 1.5, 8.4], [0, 2.3, 0], 34), K([0, 1.4, 7.4], [0, 2.45, 0], 34), t, ln(14).start, cue(14, 'He')), shake(t, cue(14, 'came'), 0.08, 0.5)) },
    { id: 'SH18 the temple falls', set: 'templeExt', a: cue(14, 'He') - 0.12, tin: { type: 'cut' },
      state: (t) => ({ fall: clamp((t - (cue(14, 'He') - 0.6)) / 3.4) }),
      cam: (t) => addShake(move(K([0, 3.3, 27], [0, 2.7, 0], 36), K([0, 3.6, 31], [0, 2.6, 0], 36), t, cue(14, 'He'), ln(15).start), shake(t, cue(14, 'He') - 0.12, 0.35, 0.7)),
      refs: () => [['JUDGES 16:30', cue(14, 'killed')]] },
    { id: 'SH19 the rescue continues: Samuel, David', set: 'valley', a: ln(15).start - 0.15, tin: { type: 'sweep', d: 0.6 }, shift: 0.03,
      state: (t) => ({ night: 0.0, dawnish: 1, banners: 1 - prog(t, cue(15, 'subdued') - 0.1, cue(15, 'subdued') + 0.8), workers: 0 }),
      cam: (t) => move(K([0, 0.62, 9.5], [0, 0.8, -10], 36), K([0, 0.72, 8.5], [0, 0.86, -10], 36), t, ln(15).start, ln(16).start),
      timeline: (t) => ({ a: prog(t, ln(15).start, ln(15).start + 0.3), draw: 1, marks: [
        { label: 'SAMSON', sub: 'BEGIN · JUDGES 13:5', x: 0.08, on: 1, gold: false },
        { label: 'SAMUEL', sub: '1 SAMUEL 7:13', x: 0.5, on: prog(t, cue(15, 'Later') - 0.1, cue(15, 'Later') + 0.3) },
        { label: 'DAVID', sub: '2 SAMUEL 8:1', x: 0.92, on: prog(t, cue(15, 'David') - 0.1, cue(15, 'David') + 0.3), gold: true, empty: true }] }) },
    { id: 'SH20 Hebrews 11', set: 'desk', a: ln(16).start - 0.1, tin: { type: 'fade', d: 0.35 }, shift: 0, drift: 0,
      state: (t) => ({ lit: prog(t, cue(16, 'Samson') - 0.1, cue(16, 'Samson') + 0.4) }),
      cam: (t) => move(K([0.0, 1.25, 6.7], [0.0, 1.05, 0], 34), K([0.0, 1.2, 6.0], [0.0, 1.0, 0], 34), t, ln(16).start, ln(17).start) },
    { id: 'SH21a the ridge: why give Samson so much strength?', set: 'ridgeEnd', a: ln(17).start - 0.1, grade: { c: '#FFD9A8', a: 0.55 }, tin: { type: 'fade', d: 0.4 },
      state: (t) => ({ dawn: 0.35 + 0.15 * prog(t, ln(17).start, cue(17, 'Because')), reveal: 0 }),
      cam: (t) => move(K([0.45, 0.4, 6.4], [0.1, 1.7, 0], 34), K([1.0, 0.8, 7.6], [0.3, 1.55, 0], 34), t, ln(17).start, cue(17, 'Because')) },
    { id: 'SH21b the people God was saving', set: 'valley', a: cue(17, 'Because') - 0.12, grade: { c: '#FFDDB0', a: 0.5 }, tin: { type: 'cut' }, shift: 0.04,
      state: (t) => ({ night: 0, dawnish: 0.75 + 0.25 * prog(t, cue(17, 'Because'), ln(18).start), banners: 0, workers: 0, freed: 1 }),
      cam: (t) => move(K([0.9, 0.5, 5.6], [0.0, 0.95, -6.5], 34), K([-0.2, 0.62, 3.6], [-0.6, 1.05, -6.5], 34), t, cue(17, 'Because'), ln(18).start) },
    { id: 'SH22a Samson faces the sunrise', set: 'ridgeEnd', a: ln(18).start - 0.1, grade: { c: '#FFD49C', a: 0.7 }, tin: { type: 'fade', d: 0.35 }, shift: 0.02,
      state: (t) => ({ dawn: 0.66 + 0.12 * prog(t, ln(18).start, cue(18, 'too')), reveal: 0, ropes: 1, sunUp: 0.15 + 0.3 * prog(t, ln(18).start, cue(18, 'too')) }),
      cam: (t) => move(K([1.3, 1.35, 3.5], [0.05, 1.55, 0], 30), K([1.05, 1.4, 2.9], [0.05, 1.6, 0], 30), t, ln(18).start - 0.1, cue(18, 'too')) },
    { id: 'SH22b the broken ropes at his feet', set: 'ridgeEnd', a: cue(18, 'too') - 0.12, grade: { c: '#FFD49C', a: 0.75 }, tin: { type: 'cut' }, shift: 0.1,
      state: (t) => ({ dawn: 0.78 + 0.08 * prog(t, cue(18, 'too'), ev.remember), reveal: 0, ropes: 1, sunUp: 0.45 + 0.15 * prog(t, cue(18, 'too'), ev.remember) }),
      cam: (t) => move(K([1.6, 0.42, 3.0], [0.5, 0.3, 0], 32), K([1.4, 0.45, 2.6], [0.5, 0.3, 0], 32), t, cue(18, 'too') - 0.12, ev.remember) },
    { id: 'SH22c remember Samson: large, centred, in gold', set: 'ridgeEnd', a: ev.remember - 0.12, grade: { c: '#FFD49C', a: 0.75 }, tin: { type: 'fade', d: 0.3 }, shift: 0.06,
      state: (t) => ({ dawn: 0.9 + 0.1 * prog(t, ev.remember, ev.endCard), reveal: 0, ropes: 1, sunUp: 0.7 + 0.3 * prog(t, ev.remember, ev.endCard), glory: prog(t, ev.remember - 0.1, ev.remember + 0.8, ease.out) }),
      cam: (t) => move(K([0.1, 1.0, 5.4], [0.05, 1.45, 0], 34), K([0.05, 1.05, 4.6], [0.05, 1.5, 0], 34), t, ev.remember - 0.12, ev.endCard + 1.5) },
  ];
  for (let i = 0; i < SH.length; i++) SH[i].b = i + 1 < SH.length ? SH[i + 1].a : S.DURATION;
  globalThis.SHOTS = SH;
  const shotAt = (t) => { let i = 0; while (i + 1 < SH.length && t >= SH[i + 1].a) i++; return i; };

  // ---------- rendering ----------
  const project = (v) => { const p = v.clone().project(cam); return [((p.x + 1) / 2) * W, ((1 - p.y) / 2) * H]; };
  function renderShot(sh, t, ctx, alpha = 1) {
    const set = sets[sh.set] || sets.hook;
    const st = sh.state ? sh.state(t, t - sh.a) : {};
    st.cam = cam;
    const k = sh.cam(t, t - sh.a);
    // rim width follows the camera distance (thin in close-ups so edges never double); rim fades toward the feet
    { const dx = k.p[0] - k.l[0], dy = k.p[1] - k.l[1], dz = k.p[2] - k.l[2]; FW.RIM_K = clamp(Math.hypot(dx, dy, dz) / 9, 0.2, 1.0); }
    const rf = sh.rimFade || [0.02, 0.6]; FW.RIM_FADE.value.set(rf[0], rf[1]);
    set.update(t, st);
    // a slow constant drift keeps every frame alive (parallax between the layers); off where a shot must land exactly
    const dr = sh.drift === undefined ? 1 : sh.drift, dd = (t - sh.a) * dr;
    if (dr) { k.p = [k.p[0] + 0.05 * dd, k.p[1] + 0.008 * dd, k.p[2] - 0.035 * dd]; k.l = [k.l[0] + 0.04 * dd, k.l[1], k.l[2]]; }
    FW.setCam(cam, k.p, k.l, k.f || 34, k.r || 0);
    // lens shift: lift the action above the caption band (heads ~30%, hands ~45–55%) without changing perspective
    const sy = sh.shift === undefined ? 0.17 : sh.shift;
    if (sy) cam.setViewOffset(W, H, 0, sy * H, W, H); else cam.clearViewOffset();
    if (set.render) set.render(FW.renderer, cam, st, t); else FW.renderShot(set.scene, cam, 1);
    ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(FW.glCanvas, 0, 0, W, H); ctx.restore();
    // per-shot colour grade: a warm multiply for the dawn (first light turning to gold)
    if (sh.grade) { const gr = typeof sh.grade === 'function' ? sh.grade(t) : sh.grade; if (gr && gr.a > 0) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = alpha * gr.a; ctx.fillStyle = gr.c; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
    return set;
  }

  // selective bloom: only the bright parts glow
  let bl1, bl2;
  function bloom(ctx, amt = 0.3) {
    const w = W / 4, h = H / 4;
    if (!bl1) { bl1 = G.makeCanvas(w, h); bl2 = G.makeCanvas(w, h); }
    const a = bl1.getContext('2d'), b = bl2.getContext('2d');
    a.globalCompositeOperation = 'source-over'; a.filter = 'brightness(0.78) contrast(3.6) saturate(1.3)'; a.clearRect(0, 0, w, h); a.drawImage(ctx.canvas, 0, 0, w, h); a.filter = 'none';
    b.clearRect(0, 0, w, h); b.filter = 'blur(10px)'; b.drawImage(bl1, 0, 0); b.filter = 'blur(3px)'; b.globalAlpha = 0.6; b.drawImage(bl1, 0, 0); b.globalAlpha = 1; b.filter = 'none';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amt; ctx.drawImage(bl2, 0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }

  // soft highlight knee: values above 188 roll off toward ~232, so skies and beams never clip to flat white
  const LUT = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) LUT[v] = v <= 188 ? v : 188 + 64 * (1 - Math.exp(-(v - 188) / 64));
  function rolloff(ctx) {
    const c = ctx.canvas, img = ctx.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { d[i] = LUT[d[i]]; d[i + 1] = LUT[d[i + 1]]; d[i + 2] = LUT[d[i + 2]]; }
    ctx.putImageData(img, 0, 0);
  }
  function frame(ctx, t) {
    const i = shotAt(t), sh = SH[i];
    const tin = sh.tin, d = tin && tin.d ? tin.d : 0, inT = t - sh.a;
    if (tin && d && inT < d && i > 0) {
      const prev = SH[i - 1], k = clamp(inT / d);
      if (tin.type === 'dip') {
        if (k < 0.5) { renderShot(prev, t, ctx); ctx.fillStyle = `rgba(4,3,8,${ease.inOut(k * 2)})`; ctx.fillRect(0, 0, W, H); }
        else { renderShot(sh, t, ctx); ctx.fillStyle = `rgba(4,3,8,${1 - ease.inOut((k - 0.5) * 2)})`; ctx.fillRect(0, 0, W, H); }
      } else {
        renderShot(prev, t, ctx);
        renderShot(sh, t, ctx, ease.inOut(k));
        if (tin.type === 'sweep') { // a gold light sweep across the frame (a jump in time)
          const x = lerp(-W * 0.6, W * 1.6, ease.inOut(k));
          const g = ctx.createLinearGradient(x - 380, 0, x + 380, H * 0.35); g.addColorStop(0, 'rgba(255,214,150,0)'); g.addColorStop(0.5, `rgba(255,214,150,${0.32 * Math.sin(Math.PI * k)})`); g.addColorStop(1, 'rgba(255,214,150,0)');
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
        }
      }
    } else renderShot(sh, t, ctx);
    return { i, sh };
  }

  const card5 = VO.lines[5], card10 = VO.lines[10];
  const cardA = (L, t) => (L ? prog(t, L.start - 0.25, L.start + 0.1, ease.out) * (1 - prog(t, L.end + 0.15, L.end + 0.45)) : 0);

  Studio.film({
    post: { paper: 0, grain: 0.04, vignette: 0.28, bloom: 0 },
    fadeOut: 0,
    async init() {
      for (const [fam, file, w, st] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700'], ['Cinzel', 'fonts/cinzel-latin-900-normal.woff2', '900'],
        ['Cormorant Garamond', 'fonts/cormorant-garamond-latin-600-italic.woff2', '600', 'italic'], ['Inter', 'fonts/inter-latin-600-normal.woff2', '600']]) {
        const f = new FontFace(fam, `url(${file})`, { weight: w, style: st || 'normal' }); document.fonts.add(f); await f.load();
      }
      FW.init(W, H);
      cam = FW.camera(W / H);
      const want = [...new Set(SH.map((s) => s.set))];
      for (const name of ['hook', ...want]) if (!sets[name] && FW.SETS[name]) { try { sets[name] = FW.SETS[name](); } catch (e) { console.error('set failed', name, String(e), e.stack); } }
    },
    draw(ctx, t) {
      const tt = t >= ev.loopBack ? 0 : t; // the last frames return to frame one (loop)
      const { sh } = frame(ctx, tt);
      bloom(ctx, 0.22);
      { const c = ctx.canvas, sc = c.width / W; let r = 0, g = 0, b = 0, n = 0; try { const px = ctx.getImageData(0, Math.round(H * 0.42 * sc), c.width, 4).data; for (let i = 0; i < px.length; i += 32) { r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; } } catch (e) {}
        if (n) { r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n); const gr = ctx.createLinearGradient(0, H * 0.64, 0, H); gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(1, `rgba(${r},${g},${b},0.42)`); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = gr; ctx.fillRect(0, H * 0.64, W, H * 0.36); ctx.restore(); } }
      rolloff(ctx);
      // impact flash: one warm frame on each hit (the lion caught, the jawbone, the pillars), gone in 0.15 s
      for (const th of [tCatch, tStrike, cue(14, 'came'), cue(14, 'He') - 0.12]) { const d = tt - th; if (d >= 0 && d < 0.15) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,150,${(0.42 * Math.pow(1 - d / 0.15, 2)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); } }
      { const g = ctx.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, 'rgba(22,10,24,0.42)'); g.addColorStop(1, 'rgba(22,10,24,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 760); }
      const set = sets[sh.set] || sets.hook;
      const cardUp = Math.max(cardA(card5, tt), cardA(card10, tt));
      if (sh.tags && set.anchors) for (const [text, key, t0, side] of sh.tags(tt)) {
        const a = prog(tt, t0, t0 + 0.3, ease.out) * (1 - prog(tt, sh.b - 0.35, sh.b - 0.05)) * (1 - cardUp);
        if (a > 0 && set.anchors[key]) { const [x, y] = project(set.anchors[key]); FW.O.tag(ctx, text, x, y, a, { side: side || 'right', dy: -110 }); }
      }
      if (sh.refs) for (const [text, t0] of sh.refs(tt)) FW.O.ref(ctx, text, 64, 1110, prog(tt, t0, t0 + 0.3) * (1 - prog(tt, sh.b - 0.35, sh.b - 0.05)));
      if (sh.big) { const b = sh.big(tt); if (b) FW.O.bigNumber(ctx, b.n, b.a, 560); }
      if (sh.timeline) { const tl = sh.timeline(tt); FW.O.timeline(ctx, tl.marks, tl.a * (1 - prog(tt, sh.b - 0.3, sh.b)), 470, tl.draw); }
      if (set.overlay) set.overlay(ctx, tt, sh);
      const a5 = cardA(card5, tt), a10 = cardA(card10, tt);
      if (a5 > 0) FW.O.verseCard(ctx, card5.card, card5, tt, a5, /^(begin)$/i);
      if (a10 > 0) FW.O.verseCard(ctx, card10.card, card10, tt, a10, /^(from|LORD)$/);
      const titleA = 1 - prog(tt, ln(1).start - 0.35, ln(1).start - 0.05);
      FW.O.seriesTag(ctx, 1);
      if (titleA > 0) FW.O.title(ctx, VO.title, titleA, 440);
      FW.O.captions(ctx, VO, tt, (c) => c.line === 0 || c.line === 5 || c.line === 10 || tt >= ev.endCard);
      const e = prog(t, ev.endCard, ev.endCard + 0.5) * (1 - prog(t, ev.loopBack - 0.35, ev.loopBack));
      if (e > 0) FW.O.endCard(ctx, e);
      if (t >= ev.loopBack - 0.35 && t < ev.loopBack) { ctx.fillStyle = `rgba(6,7,11,${prog(t, ev.loopBack - 0.35, ev.loopBack)})`; ctx.fillRect(0, 0, W, H); }
    },
  });
})();
