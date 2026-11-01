  // ---- engine lab shots (no per-shot code: all staging is the dio field; state carries across shots on one set) ----
  add('L1', 'diorama', 'camp', 0, { text: false, dio: {
    cam: { preset: 'iso', on: 'fire', move: 'push', amt: 0.12, from: 0.4, dur: 3.6 },
    act: [ { who: 'esau', at: 0.6, do: 'enter', from: [7.2, 2.6], to: [1.6, 1.05], dur: 3.0, then: 'kneel' } ] } });
  add('L2', 'diorama', 'camp', 4.5, { text: false, dio: {
    cam: { preset: 'isoClose', on: [1.15, 0, 0.8], move: 'orbit', deg: 16, from: 4.6, dur: 3.6 },
    act: [ { who: 'jacob', at: 5.6, pose: 'hold', item: 'scroll' } ] } });
  add('L3', 'diorama', 'camp', 8.5, { text: false, dio: {
    cam: { preset: 'eye', on: 'esau', move: 'pull', amt: 0.9, from: 8.8, dur: 2.8 },
    act: [ { who: 'esau', at: 8.6, do: 'walk', to: [5.8, 2.9], dur: 3.2 } ] } });
