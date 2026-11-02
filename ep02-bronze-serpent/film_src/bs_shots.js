  // ---- The Bronze Serpent: the CINEMATIC opening (camera-first storyboard, creative/camera_storyboard.md, shots C1-C5) ----
  // Every camera is an explicit path: position p, look-at l (set points), lens f; every cut lands on a word.
  const L0 = (w) => cue(0, w), L1 = (w) => cue(1, w);
  // C1 "Moses destroyed a golden calf": Moses in the foreground (left third), the calf mid-ground (right third), the crowd and the
  //    mountain behind. The camera trucks left past Moses: the parallax opens the crowd up behind the calf. Moses raises his staff on "destroyed".
  add('C1', 'diorama', 'sinai', 0, { title: true, text: false, beats: { destroyed: L0('destroyed') },
    dio: { cam: { f: 30, path: [
        { at: 0, p: [3.35, 1.45, 4.6], l: [-0.35, 1.05, 0.15] },
        { at: L0('because') - 0.1, p: [2.55, 1.7, 4.95], l: [-0.55, 1.0, -0.1], ease: 'out' } ] },
      act: [{ who: 'moses', at: L0('destroyed') - 0.12, pose: 'hold', item: 'staff' }],
      fx: [{ on: 'calf', at: L0('destroyed') + 0.15, do: 'burn', dur: 3.4 }] } });
  // C2 "because Israel worshiped it": an elevated three-quarter wide from the opposite (left) side: the burning calf left of
  //    centre, the ring of worshipers; they drop to their knees on "worshiped"; the camera cranes up and back (the scale, and the
  //    move that carries us into the next era).
  add('C2', 'diorama', 'sinai', L0('because') - PRE, { beats: { worshiped: L0('worshiped') },
    dio: { cam: { f: 30, path: [
        { at: L0('because') - PRE, p: [-4.6, 4.2, 6.2], l: [0.9, 0.9, -0.4] },
        { at: st(1), p: [-4.2, 8.8, 8.6], l: [0.9, 0.4, -1.6], ease: 'in' } ] },
      act: ['w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'w7'].map((w, i) => ({ who: w, at: L0('worshiped') + i * 0.05, pose: 'kneel' })) } });
  // C3 "Centuries later, King Hezekiah": the crane comes DOWN into a stone court (the motion continues across the dissolve),
  //    past a foreground pillar; people kneel holding out offerings to the serpent (right third); Hezekiah walks in from the left.
  add('C3', 'diorama', 'court', st(1) - PRE, { xin: { kind: 'fade', dur: 0.4 }, beats: { king: L1('King') },
    dio: { cam: { f: 30, path: [
        { at: st(1) - PRE, p: [1.6, 9.5, 9.6], l: [-0.6, 1.2, -1.2] },
        { at: L1('Hezekiah') + 0.1, p: [-1.4, 3.3, 7.4], l: [-1.2, 1.15, 0.2], ease: 'inOut' },
        { at: L1('destroyed') - 0.45, p: [-1.55, 3.1, 7.1], l: [-1.0, 1.15, 0.25], ease: 'out' } ] },
      act: [{ who: 'hezekiah', at: st(1) + 0.2, do: 'enter', from: [-4.6, 1.15], to: [-0.95, 0.62], dur: 2.25, then: 'swing' }] } });
  // C4 "destroyed": a low hero angle from beside the plinth, looking up: an offering bowl blurred in the foreground, Hezekiah
  //    raises the hammer and strikes on the word; the serpent breaks toward the lens; a short shake.
  add('C4', 'diorama', 'court', L1('destroyed') - 0.45, { beats: { destroyed: L1('destroyed') },
    dio: { cam: { f: 32, shakeAt: 'destroyed', shakeAmp: 11, path: [
        { at: L1('destroyed') - 0.45, p: [-1.95, 0.55, 2.55], l: [-0.35, 1.7, 0.1] },
        { at: L1('another'), p: [-2.05, 0.5, 2.75], l: [-0.35, 1.6, 0.1], ease: 'out' } ] },
      act: [{ who: 'hezekiah', at: L1('destroyed') - 0.45, pose: 'swing', strike: 'destroyed' }],
      fx: [{ on: 'serpent', at: 'destroyed', do: 'shatter' }, { on: 'smoke', at: 'destroyed', do: 'scatter' }] } });
  // C5 "another object Israel had begun worshiping": the reverse angle from behind the empty pole: the broken bronze blurred in
  //    the foreground, the people who brought offerings recoil from it, bowls still in their hands; the camera drifts to reveal them.
  add('C5', 'diorama', 'court', L1('another') - PRE, { beats: {},
    dio: { cam: { f: 30, path: [
        { at: L1('another') - PRE, p: [0.55, 1.75, -2.35], l: [0.65, 1.1, 1.6] },
        { at: st(2) - PRE, p: [-0.15, 1.85, -2.6], l: [0.75, 1.05, 1.6], ease: 'inOut' } ] },
      act: [{ who: 'o1', at: L1('another') - PRE, pose: 'fall', k: 0.32 }, { who: 'o2', at: L1('another') - PRE + 0.08, pose: 'fall', k: 0.28 }, { who: 'o3', at: L1('another') - PRE + 0.14, pose: 'fall', k: 0.3 }] } });
  // (beyond the demo) "But this one had been made at God's command."
  add('C6', 'diorama', 'compare', st(2) - PRE, { xin: { kind: 'fade', dur: 0.35 }, beats: { god: cue(2, "God's") },
    dio: { cam: { on: [0, 0, 0], el: 9, az: 0, dist: 9.4, fov: 32, ty: 1.35, sh: 0.06 }, rays: { on: 'serpentL', from: 'god', dur: 0.7, amt: 1.0, y: 2.6 } } });
