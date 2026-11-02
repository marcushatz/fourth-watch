  // ---- style frames (visual spec v1): three stills, each a 3 s hold so a still at t0 + 0.5 is settled ----
  const hold = (p, l, f = 36) => ({ f, path: [{ at: 0, p, l }, { at: 99, p, l }] });
  add('K2', 'diorama', 'wild', 0, { dio: { cam: Object.assign(hold([2.8, 3.3, 10.0], [0.3, 1.95, 0.0], 36), { ap: 1.0, focus: 10.3 }),
    key: { on: 'serpent', y: 2.4, i: 30, angle: 0.3, from: [-3, 8, 2.5] }, focus: { on: 'serpent', y: 2.3, r0: 0.3, r1: 0.9, dark: 0.3 },
    rays: { on: 'serpent', from: 0, dur: 0.01, amt: 0.22, y: 4.1 }, look: { sat: 1.0, exposure: 0.97 } } });
  if (globalThis.FW_NOCAP) S.forEach((s) => { s.text = false; s.title = false; s.scrim = 0; });
