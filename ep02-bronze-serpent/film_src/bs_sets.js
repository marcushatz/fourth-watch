// The Bronze Serpent: the sets (diorama recipes). THE PLINTH stands at [0, 0] in every era, so one camera mark frames
// the calf, the serpent and the empty pole in exactly the same place (the match cuts are real).
(function () {
  const D = globalThis.DIORAMA;
  const ISRAELITE = (i) => ({ v: [0, 2, 3, 0, 2, 3, 0, 3][i % 8], cast: [null, null, null, { robe: '#6A7A5A' }, { robe: '#8A5A4A' }, { robe: '#5A6A7A' }, { robe: '#7A6A4A' }, { robe: '#6A4A5A' }][i % 8] || undefined });
  D.set('sinai', {          // Exodus 32: the camp below the mountain; the calf on its plinth, a ring of people worshiping it (32:8)
    sky: 'dusk', seed: 32,
    ground: { radius: 9, cols: ['#B49866', '#A88C5C', '#BDA272'], hills: 0.3, seed: 9 },
    props: [
      { id: 'plinth', kind: 'plinth', at: [0, 0] },
      { id: 'calf', kind: 'calf', at: [0, 0], face: 0.15 },
      { id: 'altar', kind: 'fire', at: [0.85, 0.1] },             // the altar fire before the calf (32:5-6): the calf is knocked into it
      { kind: 'mountain', at: [-4, -16], s: 1.6, h: 7, col: '#7E5E50' }, { kind: 'mountain', at: [6, -19], s: 1.2, h: 5, col: '#86665A' },
      { kind: 'tent', at: [-4.6, -3.4], s: 1.2, rot: 0.5, cols: ['#D8C4A0', '#7A4E2A'] }, { kind: 'tent', at: [4.2, -4.0], s: 1.1, rot: -0.4, cols: ['#CDB894', '#6A4426'] },
      { kind: 'tent', at: [-5.4, -6.4], s: 1.0, rot: 0.1 }, { kind: 'tent', at: [5.6, 0.6], s: 1.0, rot: 0.9 }, { kind: 'tent', at: [-6.6, -0.6], s: 1.1, rot: -0.6 },
      { kind: 'fire', at: [-2.8, 2.6] }, { kind: 'fire', at: [3.3, -1.6] },
      { kind: 'rock', at: [3.8, 3.4], s: 1.3 }, { kind: 'rock', at: [-3.9, -0.4], s: 1.0 }, { kind: 'bush', at: [4.6, 2.0], s: 0.9 },
    ],
    people: [
      // the worshipers are on the FAR side of the calf from the cameras (a flat figure always faces the lens, so whoever
      // faces the camera faces the calf). Each does something different (Ex 32:6, 19: offerings, eating, dancing).
      { id: 'w1', at: [-0.75, -0.7], pose: 'bow', ...ISRAELITE(0) }, { id: 'w2', at: [0.7, -0.85], pose: 'raise', ...ISRAELITE(1) },
      { id: 'w3', at: [1.4, -0.5], pose: 'cheer', ...ISRAELITE(2) }, { id: 'w4', at: [-0.1, -1.3], pose: 'offer', ...ISRAELITE(3) },
      { id: 'w5', at: [0.6, -1.8], pose: 'kneel', ...ISRAELITE(4) }, { id: 'w6', at: [-1.35, -1.35], pose: 'stand', look: [0.8, 0.1], ...ISRAELITE(5) },
      { id: 'w7', at: [-1.25, -0.4], pose: 'hold', item: 'bowl', ...ISRAELITE(6) },
      // Moses at the edge of the camp, left (the lead faces right, toward the conflict), staring at the calf
      { id: 'moses', at: [-2.5, 1.5], pose: 'hold', item: 'staff', look: [1, 0.15], cast: { old: true, beard: '#D8D2C4', hairCol: '#C8C2B4', robe: '#7A5A3E', stripe: '#C9B48E' } },
    ],
  });
  D.set('court', {          // 2 Kings 18:4: a stone court (the place isn't named); people bring offerings to the serpent itself
    sky: 'dusk', seed: 18,
    ground: { radius: 9, cols: ['#A8946E', '#9E8A66', '#B29E78'], hills: 0.04, seed: 4 },
    props: [
      { id: 'plinth', kind: 'plinth', at: [0, 0] },
      { id: 'serpent', kind: 'serpentPole', at: [0, 0], h: 1.5, hv: 0.45, floorY: 0.74 },
      { id: 'smoke', kind: 'incense', at: [0.75, -0.45], n: 14, op: 0.3, h: 2.3 },
      { kind: 'bowl', at: [0.35, -0.62] }, { kind: 'bowl', at: [-0.38, -0.58], fill: '#C9A060' },
      { id: 'fgbowl', kind: 'bowl', at: [-1.75, 1.95], fill: '#E8E0C8' },
      { kind: 'pillar', at: [-2.6, -1.8] }, { kind: 'pillar', at: [2.6, -1.8] }, { kind: 'pillar', at: [-2.9, 1.7] }, { kind: 'pillar', at: [2.9, 1.6] },
      { id: 'fgpillar', kind: 'pillar', at: [-2.35, 3.5], h: 3.6 },
      { kind: 'wall', at: [0, -3.6], w: 8.5, col: '#8C7A60' }, { kind: 'wall', at: [-4.4, -0.6], w: 6, col: '#8C7A60', rot: Math.PI / 2 },
    ],
    people: [
      // the offerers are on the FAR side of the serpent (they face the lens, so they face the serpent); each makes an
      // offering in his own way (2 Kgs 18:4 "made offerings to it": bowls and incense; nobody bows down)
      { id: 'o1', at: [-0.45, -0.95], pose: 'offer', ...ISRAELITE(4) }, { id: 'o2', at: [0.45, -1.05], pose: 'offer', ...ISRAELITE(5) },
      { id: 'o3', at: [1.1, -0.55], pose: 'offer', ...ISRAELITE(7) }, { id: 'o4', at: [-0.75, -1.75], pose: 'kneel', ...ISRAELITE(1) },
      { id: 'o5', at: [0.15, -1.95], pose: 'raise', ...ISRAELITE(3) }, { id: 'o6', at: [0.95, -1.7], pose: 'hold', item: 'bowl', ...ISRAELITE(0) },
      { id: 'hezekiah', at: [-3.2, 0.8], hidden: true, pose: 'walk', item: 'hammer', cast: { crown: '#E0B040', beard: '#3A2418', hairCol: '#2A1A12', robe: '#5A3A7A', stripe: '#E0B040' } },
    ],
  });
  D.set('compare', {        // the two objects, side by side: the serpent screen LEFT under God's gold (made at His command, Num 21:8-9), the calf screen RIGHT in ember light (made by people, Ex 32:4): the series' screen direction
    sky: 'dusk', seed: 7,
    ground: { radius: 8, cols: ['#A8946A', '#9C8860', '#B19C70'], hills: 0.08, seed: 6 },
    props: [
      { id: 'plinthL', kind: 'plinth', at: [-0.9, 0], s: 0.85 }, { id: 'serpentL', kind: 'serpentPole', at: [-0.9, 0], s: 0.85, h: 2.0 },
      { id: 'plinthR', kind: 'plinth', at: [0.9, 0], s: 0.85 }, { id: 'calfR', kind: 'calf', at: [0.9, 0], face: Math.PI - 0.15, s: 0.85 }, { kind: 'fire', at: [1.75, 0.75] },
    ],
    people: [ { id: 'c1', at: [1.45, -0.7], pose: 'raise', ...ISRAELITE(6) } ],
  });
})();
