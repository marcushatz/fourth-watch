  // ---- Camera-direction test, revision 2: Numbers 21:7-9, VO lines 6-7 (creative/camera_storyboard_v3.md, shots R1-R4) ----
  // Rhythm: a still prayer (R1) -> one continuous move that follows the raising and rises over the serpent to the people
  // (R2, which becomes the overhead R3 without a cut) -> a held reverse on one man (R4). Every time comes from the voice.
  const W6 = (w) => cue(6, w), W7 = (w) => cue(7, w), DK = globalThis.DIRECT ? globalThis.DIRECT.keyed : null;
  const keyed = (t, keys) => {   // the same easing as DIRECT.keyed (score.js also runs in node, where DIRECT is absent)
    if (DK) return DK(t, keys);
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) { const [t0, a] = keys[i], [t1, b] = keys[i + 1]; if (t <= t1) { const x = Math.max(0, Math.min(1, (t - t0) / Math.max(1e-6, t1 - t0))); return a + (b - a) * x * x * (3 - 2 * x); } }
    return keys[keys.length - 1][1];
  };

  const WAIT = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7', 'w8', 'w9', 'w10', 'w11', 'w12', 'w13', 'w14', 'w15', 'w16', 'w17', 'looker', 'tender'];   // they gather once the serpent is made
  // R1 "But God's answer was unexpected." (to 29.89) Moses kneels in prayer among the bitten (21:7): a snake in the
  //    foreground, a dying man near the lens, the camp behind him. Locked until "answer": then the gold light comes down
  //    on him, he lifts his face, and the camera drifts in 5% (the only move is the light arriving).
  add('R1', 'diorama', 'camp', 0, { beats: {}, dio: { faces: 'medium',
    cam: { f: 36, ap: 1.8, path: [
      { at: 0, p: [2.2, 1.7, 7.4], l: [0.9, 0.9, 0.8] },
      { at: W6('answer'), p: [2.2, 1.7, 7.4], l: [0.9, 0.9, 0.8] },
      { at: W7('He') - PRE, p: [2.13, 1.66, 7.07], l: [0.9, 0.92, 0.8], ease: 'out' } ] },
    rays: { on: 'moses', from: W6('answer'), dur: 0.8, amt: 0.9, y: 1.4 },
    key: { on: 'moses', y: 1.0, i: 30, angle: 0.3, from: [-3, 9, 2], r: 1.5, actor: 0.35 }, keyFrom: W6('answer'),
    act: [{ who: 'moses', at: 0, kKeys: [[W6('answer') + 0.1, 0], [W6('answer') + 0.85, 1]], say: ['Moses: head bowed, eyes closed, starts to lift', 'Moses: face lifted to the light'] }, ...WAIT.map((who) => ({ who, at: 0, hide: true }))],
    fx: [{ on: 'serpent', at: 0, do: 'hide' }, { on: 'cairn', at: 0, do: 'hide' }] } });

  // R2 + R3 "He commanded Moses to raise a serpent on a pole. / Anyone who had been bitten could" (29.89-34.73), one shot.
  //    Moses and a second man crouch at the head end of the lying pole; a third foots it. On "Moses" they heave it off the
  //    ground (a hitch as they step under it), then walk it up; it stands on "pole". The camera follows the bronze head up,
  //    keeps rising over it and settles above and behind it: the people it faces, lifting their faces to it (held 1.5 s).
  const T2 = W7('He') - PRE, HV = W7('Moses') - 0.1, UP = W7('pole') + 0.1;
  const RAISE = [[HV, 0], [HV + 0.6, 0.22], [HV + 0.85, 0.25], [UP, 1.0], [UP + 0.14, 1.012], [UP + 0.32, 1.0]];
  const RAISE_SAY = ['heave starts (pole on the ground)', 'pole off the ground, at their chests', 'hitch: they step under it', 'upright', 'overshoots', 'settles'];
  const LIE = 1.42, REACH = 1.85;
  // a lifter: grips the pole at u0 m from its foot while heaving it off the ground, then walks under it pushing overhead
  const lifter = (u0, z, behind) => (t) => {
    const r = keyed(t, RAISE), th = Math.max(0.03, (1 - r) * LIE), tn = Math.tan(th);
    let h, d;
    if (r <= 0.25) { h = u0 * Math.cos(th); d = u0 * Math.sin(th); }
    else { const h25 = u0 * Math.cos(0.75 * LIE); h = h25 + (REACH + (behind ? 0.04 : 0) - h25) * Math.min(1, (r - 0.25) / 0.2); d = Math.max(h * tn, behind ? 0.66 : 0.32); }   // Moses walks right under it; the other stops behind him
    const hands = Math.min(d / tn, REACH + 0.1);   // the pole rises out of their hands near the end
    const dip = t < HV ? 0.035 * Math.sin(Math.PI * Math.max(0, Math.min(1, (t - (HV - 0.45)) / 0.45))) : 0;   // anticipation: settle into the grip
    const open = d / tn > REACH + 0.05;   // the pole has risen out of their hands: open palms still pushing, never fists in the air
    if (t > UP) {   // it stands: Moses steps in and steadies it at chest height; the other man lets go and looks up at it
      const a = Math.min(1, (t - UP) / 0.4), e = a * a * (3 - 2 * a);
      if (!behind) return { pos: [-(d + (0.3 - d) * e), z], pose: 'heave', k: hands + (1.3 - hands) * e, dir: 1, open: e < 0.7, look: e > 0.5 ? [0.3, -1] : undefined, visible: true };
      return { pos: [-d, z], pose: e < 0.5 ? 'heave' : 'stand', k: hands + (1.2 - hands) * e, dir: 1, open: true, look: [0.2, -1], visible: true };
    }
    if (open && behind) { const r0 = 0.84, a = Math.min(1, Math.max(0, (r - r0) / 0.12)); return { pos: [-d, z], pose: 'heave', k: REACH - (REACH - 1.25) * a, dir: 1, open: true, look: a > 0.5 ? [0.2, -1] : undefined, visible: true }; }   // let go: arms come down
    return { pos: [-d, z], pose: 'heave', k: hands - dip, dir: 1, open, phase: (u0 - d) * 9, visible: true };
  };
  const SEE = [   // the people lifting their faces as it stands (staggered over 1.3 s), each from their own state
    ['w1', 0.2], ['w16', 0.35], ['w3', 0.45], ['w11', 0.65], ['w5', 0.8], ['w2', 0.9], ['w8', 1.05], ['w17', 1.15], ['w15', 1.35], ['w10', 1.45],
  ].map(([who, dt]) => [who, UP + dt]);
  const lookUp = (who, at) => {
    const rec = ['w1', 'w3', 'w5', 'w8', 'w11', 'w15', 'w16'].includes(who);
    return rec ? { who, at, kKeys: [[at, 0], [at + 0.55, 0.3]], say: [who + ' starts to lift his face', who + ' face up to the serpent'] } : { who, at, pose: 'beseech', dir: who === 'w2' ? -1 : 1, say: who + ' looks up, a hand to it' };
  };
  add('R2', 'diorama', 'camp', T2, { beats: {}, dio: { faces: 'medium',
    cam: { f: 40, ap: 0.55, focus: 7.0, path: [
      { at: T2, p: [-2.8, 0.6, 7.8], l: [-2.95, 1.3, 0.0] },
      { at: HV + 0.15, p: [-2.8, 0.6, 7.8], l: [-2.95, 1.3, 0.0] },
      { at: HV + 0.85, p: [-2.45, 0.85, 7.1], l: [-2.45, 1.85, 0.0], ease: 'crIn' },
      { at: UP, p: [-0.75, 2.0, 7.7], l: [-0.3, 2.55, 0.0], ease: 'cr' },
      { at: UP + 0.7, p: [0.25, 7.4, 2.2], l: [-0.75, 0.2, -3.8], ease: 'crOut' },
      { at: W7('look') - PRE, p: [0.22, 7.35, 2.12], l: [-0.75, 0.2, -3.8] } ] },
    puppet: { moses: lifter(2.05, 0.34, false), h1: lifter(2.3, -0.34, true) },
    act: [{ who: 'h2', at: T2, show: true, kKeys: [[HV, 0], [UP, 1]] }, ...['sick1', 'sick2', 'sick3', 'sick4'].map((who) => ({ who, at: T2, hide: true })), ...WAIT.map((who) => ({ who, at: T2, show: true })),
      { who: 'tender', at: T2, dir: -1 }, ...SEE.map(([who, at]) => lookUp(who, at)),
      ...['w4', 'w12'].map((who) => ({ who, at: 33.3, look: [0.2, -1] }))],
    fx: [{ on: 'serpent', at: T2, do: 'show' }, { on: 'cairn', at: T2, do: 'show' }, { on: 'serpent', at: HV, do: 'raise', keys: RAISE, say: RAISE_SAY }] } });

  // R4 "look at it and live." (34.73-end) The reverse: from among the people, looking back at the serpent. One
  //    man who has not looked yet, slumped, his wife holding him. On "look" he lifts his face to it; on "live" the colour
  //    comes back into him and the light reaches him; he gets up on his knees, then to his feet, and opens his arms. She
  //    sits back, hands to her chest. A medium-wide, slightly low, nearly locked (a 4% drift): the acting carries it.
  const T4 = W7('look') - PRE, LV = W7('live');
  const R4dio = { faces: 'medium',
    cam: { f: 44, ap: 1.6, path: [
      { at: T4, p: [-2.25, 0.5, -7.5], l: [-1.2, 1.5, -2.0] },
      { at: LV + 1.9, p: [-2.17, 0.52, -7.28], l: [-1.2, 1.52, -2.0], ease: 'inOut' } ] },
    key: { on: 'looker', y: 1.1, i: 30, angle: 0.3, from: [1.5, 7, 2.0], r: 1.3, actor: 0.55 }, keyFrom: LV,
    rays: { on: 'looker', from: LV, dur: 0.7, amt: 0.55, y: 1.3 },
    fx: [{ on: 'nsnake', at: T4, do: 'hide' }],
    act: [...['w6', 'w13', 'w8', 'w12', 'w15', 'w9', 'w14'].map((who) => ({ who, at: T4, hide: true })),
      { who: 'moses', at: T4, do: 'walk', from: [0.6, 0.45], to: [0.6, 0.45], dur: 0.01, then: 'stand', look: [-0.3, -1] }, { who: 'h1', at: T4, do: 'walk', from: [-0.2, 0.75], to: [-0.2, 0.75], dur: 0.01, then: 'stand', look: [0.3, -1] },
      { who: 'tender', at: T4, dir: 1, kKeys: [[LV + 0.75, 0], [LV + 1.35, 1]], say: ['his wife holding him', 'she sits back, hands to her chest'] },
      ...['w1', 'w3', 'w16', 'w5', 'w2', 'w11', 'w17'].map((who) => ({ who, at: T4, dir: ['w17'].includes(who) ? -1 : 1 })),
      { who: 'looker', at: T4, kKeys: [[W7('look') + 0.12, 0], [W7('look') + 0.6, 0.3], [LV, 0.32], [LV + 0.45, 0.5], [LV + 0.55, 0.5], [LV + 1.3, 0.8], [LV + 1.75, 1.0]],
        hKeys: [[LV, 0], [LV + 0.6, 1]], hSay: ['grey-green (dying)', 'colour back (well)'],
        say: ['slumped, head hanging', 'face lifted to the serpent', 'holds the look', 'up on his knees, a hand toward it', '(beat)', 'on his feet', 'a hand on his chest, the other open toward it'] }] };
  add('R4', 'diorama', 'camp', T4, { beats: {}, dio: R4dio });
  // the tail (end of the test): the same shot with no caption (the next line is not part of the test)
  add('R4t', 'diorama', 'camp', cue(8, 0) - 0.04, { text: false, beats: {}, dio: Object.assign({}, R4dio, { act: [] }) });
