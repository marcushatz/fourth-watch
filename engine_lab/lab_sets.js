// Engine lab: sets for testing the diorama kit (ENGINE_ROADMAP.md). Genesis 25:27-34 (Esau and Jacob) as a test bed only.
DIORAMA.set('camp', {
  sky: 'dusk', seed: 11,
  ground: { radius: 7.5, cols: ['#B49C62', '#A68F58', '#BFA86E', '#9C8752'], hills: 0.3, seed: 5 },
  props: [
    { id: 'tentJ', kind: 'tent', at: [-1.9, -1.6], s: 1.25, rot: 0.6, cols: ['#D8C4A0', '#7A4E2A'] },
    { id: 'tent2', kind: 'tent', at: [-4.2, 0.4], s: 1.0, rot: 2.1, cols: ['#CDB892', '#8A5A3A'] },
    { id: 'fire', kind: 'fire', at: [0.1, 0.2] },
    { id: 'pot', kind: 'pot', at: [0.1, 0.2], y: 0.12, s: 0.9 },
    { kind: 'olive', at: [4.6, -3.2], s: 1.3 }, { kind: 'olive', at: [-5.6, -3.4], s: 1.1 },
    { kind: 'rock', at: [2.6, 1.8], s: 0.8 }, { kind: 'rock', at: [-2.8, 2.6], s: 0.6 }, { kind: 'bush', at: [5.4, 1.2], s: 1.0 },
    { kind: 'grass', at: [3.2, 3.4] }, { kind: 'grass', at: [-1.2, 3.6] }, { kind: 'grass', at: [6.0, -0.4] },
    { kind: 'crate', at: [-1.2, -0.4], s: 1.1 },
  ],
  people: [
    { id: 'jacob', kind: 'person', v: 0, at: [0.75, 0.55], cast: { skin: '#C08A5E', robe: '#5E6E8A', stripe: '#C9B48E', cloth: '#E6DCC6', band: '#3E4E6A', beard: '#2C1E14', short: 1 } },   // the quiet man of the tents (25:27)
    { id: 'esau', kind: 'person', v: 2, at: [7.5, 2.4], hidden: true, cast: { skin: '#B0683E', robe: '#8A4A2A', stripe: '#C27A3A', cloth: '#A8432C', band: '#5A2E1A', beard: '#8A3A1E' } },   // red, the hunter, a man of the field (25:25-27)
  ],
});
