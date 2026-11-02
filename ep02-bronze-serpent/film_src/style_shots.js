  // ---- style frames (visual spec v1): three stills, each a 3 s hold so a still at t0 + 0.5 is settled ----
  const hold = (p, l, f = 36) => ({ f, path: [{ at: 0, p, l }, { at: 99, p, l }] });
  add('K2', 'diorama', 'wild', 0, { dio: { cam: Object.assign(hold([2.8, 3.3, 10.0], [0.3, 1.95, 0.0], 36), { ap: 1.0, focus: 10.3 }),
    key: { on: [0.5, 0, 0.9], y: 1.4, i: 30, angle: 0.36, from: [-3, 8, 2.5], r: 2.6, actor: 0.3 }, focus: { on: 'serpent', y: 2.3, r0: 0.3, r1: 0.9, dark: 0.3 },
    rays: { on: 'serpent', from: 0, dur: 0.01, amt: 0.22, y: 4.1 }, look: { sat: 1.0, exposure: 0.97 } } });
  add('K1', 'diorama', 'sinai2', 3, { dio: { faces: 'medium', cam: Object.assign(hold([-1.2, 2.7, 7.6], [0.3, 1.35, -0.3], 36), { ap: 1.2, focus: 8.3 }),
    key: { on: 'calf', y: 1.1, i: 10, angle: 0.3, from: [1.5, 6, 2.5], col: '#FFC890', r: 2.0, actor: 0.15 }, focus: { on: 'calf', y: 1.3, r0: 0.28, r1: 0.85, dark: 0.38 },
    look: { sat: 1.0, exposure: 1.0 } } });
  add('K3', 'diorama', 'court2', 6, { dio: { faces: 'medium', cam: Object.assign(hold([-2.6, 1.4, 6.6], [0.05, 1.7, 0.0], 36), { ap: 1.3, focus: 7.0 }),
    key: { on: 'serpent', y: 2.3, i: 16, angle: 0.28, from: [-1, 7, 1.5], r: 2.0, actor: 0.2 }, focus: { on: 'serpent', y: 2.0, r0: 0.3, r1: 0.9, dark: 0.34 },
    look: { sat: 1.0, exposure: 1.0 } } });
  if (globalThis.FW_NOCAP) S.forEach((s) => { s.text = false; s.title = false; s.scrim = 0; });
