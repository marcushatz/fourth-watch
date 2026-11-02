  // ---- The raise proof (Nov 2, 09:40): one action, one tripod, 4.8 s. Does the raise feel physically believable? ----
  // The pole is moved by DIRECT.raiseSim (spring toward the lifters' effort, damping, gravity, resting on a rock); the lifters'
  // hands are points ON that pole (mapped onto their cards through the camera); their feet are planted and step in turn.
  const LIE = 1.39, RS = { t0: 0, lie: LIE, K: 40, C: 7, G: 8, keys: [[0, LIE], [0.5, LIE], [1.3, 0.98], [1.75, 0.96], [3.15, 0], [6, 0]] };
  const DR = () => globalThis.DIRECT, sim = (t) => DR().raiseSim(t, RS), target = (t) => DR().keyedC1(t, RS.keys);
  const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }, lerp = (a, b, k) => a + (b - a) * k;
  const polePt = (u, phi) => [-u * Math.sin(phi), u * Math.cos(phi), 0];   // a point on the pole's axis, u metres from its foot
  const UP_T = 3.35;   // about when it stands (from the sim); then Moses slides his hands down and steadies it
  // each lifter's grip: below the bronze while lifting it off the rock, then hand-over-hand down the pole as they walk under it
  const plan = (t, who) => {
    const { phi } = sim(t), m = who === 'moses';
    const H = m ? lerp(1.3, 1.75, sm((0.75 - phi) / 0.35)) - 0.35 * sm((t - UP_T) / 0.6) : lerp(1.35, 1.7, sm((0.75 - phi) / 0.35));
    const u = Math.min(m ? 1.75 : 2.25, H / Math.max(0.05, Math.cos(phi))), hand = polePt(u, phi);
    const hand0 = polePt(Math.max(0.2, u - 0.22), phi);
    return { phi, hand, body: (hand[0] + hand0[0]) / 2 - lerp(0.32, 0.12, sm((hand[1] - 0.3) / 1.4)) };   // standing behind his two hands
  };
  const bodyX = (t, who) => {   // Moses stops short of the cairn; the other man stays a step behind Moses
    const bm = Math.min(plan(t, 'moses').body, -0.45);   // beside the upright pole, not behind it
    return who === 'moses' ? bm : Math.min(plan(t, 'h1').body, bm - 0.6);
  };
  // planted feet: each foot holds its spot until the body has passed it by a quarter step, then steps half a step ahead
  const stepper = (who, z, t, L = 0.5, tau = 0.24) => {
    const b0 = bodyX(0, who), n = [0, 0], prev = [0, 0], tc = [-9, -9];
    let B = b0;
    for (let s = 0; s <= t + 1e-9; s += 1 / 60) {
      B = Math.max(B, bodyX(s, who));
      for (let j = 0; j < 2; j++) { const k = Math.floor((B - b0 - j * L / 2) / L + 0.5); if (k > n[j]) { prev[j] = n[j]; n[j] = k; tc[j] = s; } }
    }
    const spot = (j, k) => b0 - L / 4 + j * L / 2 + k * L;
    return [0, 1].map((j) => { const a = Math.min(1, Math.max(0, (t - tc[j]) / tau)); return [lerp(spot(j, prev[j]), spot(j, n[j]), sm(a)), a < 1 ? 0.07 * Math.sin(Math.PI * a) : 0, z]; });
  };
  const lifter = (who, z) => (t) => {
    const { phi } = sim(t), b = bodyX(t, who);
    let hand, rel = 0;
    if (who === 'moses') hand = plan(t, 'moses').hand;
    else {   // when Moses' spacing holds him back, he reaches for the pole where it passes over him, and lets go once it is out of reach
      const p = plan(t, 'h1');
      if (p.body <= b + 1e-6) hand = p.hand; else hand = polePt(-(b + 0.24) / Math.max(0.03, Math.sin(phi)), phi);
      rel = sm((hand[1] - 1.72) / 0.25);   // out of his reach: he lets go
      if (hand[1] > 1.75) hand = [hand[0], 1.75, 0];   // from where he let go, not from the pole going on up
    }
    const u = Math.hypot(hand[0], hand[1]), hand0 = polePt(Math.max(0.2, u - 0.22), phi);   // the front hand a little lower down the pole
    const effort = Math.max(Math.min(1, Math.max(0, (phi - target(t)) / 0.2)), t < 1 ? 0.6 * sm((t - 0.15) / 0.3) : 0);   // strain = how far the push leads the pole
    const relB = who === 'moses' ? sm((t - UP_T) / 0.4) : 0;   // once it stands, Moses steadies it with one hand
    return { pos: [b, z], pose: 'heave', dir: 1, handsW: [hand0, hand], rel, relB, effort, feetW: stepper(who, z, t), phi, visible: true };
  };
  const CP = [-1.55, 0.75, 7.2];   // a tripod, low, square to the pole; it only pans and tilts to keep the bronze head in frame
  add('P1', 'diorama', 'raise', 0, { text: false, beats: {}, dio: { faces: 'medium',
    cam: { f: 40, ap: 1.2, path: [
      { at: 0, p: CP, l: [-2.6, 1.0, 0] }, { at: 0.95, p: CP, l: [-2.6, 1.0, 0] },
      { at: 2.3, p: CP, l: [-1.55, 1.6, 0], ease: 'crIn' }, { at: 3.55, p: CP, l: [-0.3, 2.2, 0], ease: 'crOut' }, { at: 9, p: CP, l: [-0.3, 2.2, 0] } ] },
    puppet: { moses: lifter('moses', -0.3), h1: lifter('h1', -0.3) },   // both just beyond the pole: it crosses in front of their hands, so they read as gripping it
    fx: [{ on: 'serpent', at: 0, do: 'raise', sim: RS }] } });
