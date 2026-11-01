  // ---- engine lab shots (no per-shot code: all staging is the dio field; state carries across shots on one set) ----
  add('L1', 'diorama', 'camp', 0, { text: false, dio: {
    cam: { preset: 'iso', on: 'fire', move: 'push', amt: 0.12, from: 0.4, dur: 3.6 },
    act: [ { who: 'esau', at: 0.6, do: 'enter', from: [7.2, 2.6], to: [1.6, 1.05], dur: 3.0, then: 'kneel' } ] },
    pops: [ { at: 0.5, kind: 'label', text: 'JACOB', on: 'jacob' }, { at: 1.0, kind: 'icon', icon: 'tent', on: 'tentJ' },   // the second is too close: the governor drops it
            { at: 2.0, kind: 'icon', icon: 'bow', text: 'THE HUNTER', on: 'esau' }, { at: 3.6, kind: 'icon', icon: 'bowl', on: 'pot' } ] });
  add('L2', 'diorama', 'camp', 4.5, { text: false, xin: { kind: 'whip', dir: 'left' }, dio: {
    cam: { preset: 'isoClose', on: [1.15, 0, 0.8], move: 'orbit', deg: 16, from: 4.6, dur: 3.6 },
    act: [ { who: 'jacob', at: 5.6, pose: 'hold', item: 'scroll' } ] },
    pops: [ { at: 5.7, kind: 'label', text: 'THE BIRTHRIGHT', on: 'jacob' }, { at: 7.4, kind: 'ring', on: 'esau' } ] });
  add('L3', 'diorama', 'camp', 8.5, { text: false, xin: { kind: 'fade' }, dio: {
    cam: { preset: 'eye', on: 'esau', move: 'pull', amt: 0.9, from: 8.8, dur: 2.8 },
    act: [ { who: 'esau', at: 8.6, do: 'walk', to: [5.8, 2.9], dur: 3.2 } ] },
    pops: [ { at: 9.2, kind: 'arrow', on: 'esau', side: 'right' }, { at: 10.8, kind: 'icon', icon: 'x', on: 'jacob' } ] });
