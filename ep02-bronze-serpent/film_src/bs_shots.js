  // ---- The Bronze Serpent: the first 11 seconds, shot plan v3 (creative/shot_plan_v3.md) ----
  // Each shot answers one question: what does this image tell the viewer that the previous one didn't?
  // The voice starts 0.9 s in (make_film.sh OFF): a cold open on the serpent under the title. The words are not changed.
  // Every camera is an explicit path solved for 9:16 (depth stacked vertically; the series text owns the top quarter).
  const L0 = (w) => cue(0, w), L1 = (w) => cue(1, w);
  // S0 (cold open, no voice) The object of the question: a bronze snake on a pole. Low angle, tight; the camera tilts up the
  //    coil to the head. The title sits over the sky.
  add('S0', 'diorama', 'court', 0, { title: true, text: false,
    dio: { cam: { f: 38, path: [
        { at: 0, p: [1.24, 1.85, 2.19], l: [0.04, 1.72, 0.05] },
        { at: st(0) - 0.12, p: [1.22, 1.9, 2.15], l: [0.07, 2.22, 0.05], ease: 'out' } ] } } });
  // S1 "Moses destroyed a" A new person and place: Moses at the edge of the camp below the mountain, a medium close-up on
  //    the left third with room to his right, staring hard at something off screen right (Ex 32:19 "his anger burned hot").
  add('S1', 'diorama', 'sinai', st(0) - PRE, { title: true, text: false,
    dio: { cam: { f: 38, path: [
        { at: st(0) - PRE, p: [-1.11, 1.91, 3.58], l: [-2.6, 1.6, 1.0] },
        { at: L0('golden'), p: [-1.16, 1.9, 3.5], l: [-2.6, 1.6, 1.0] } ] } } });
  // S2 "golden calf" What he sees, and where he stands: an elevated wide from behind his shoulder side. Moses small on the
  //    left edge; the calf on its plinth by the altar fire; around it each person does something different.
  //    On "calf" he starts toward it (the cut to S3 is on his stride).
  add('S2', 'diorama', 'sinai', L0('golden') - PRE, {
    dio: { cam: { f: 38, path: [
        { at: L0('golden') - PRE, p: [-4.64, 5.81, 8.8], l: [-1.0, 1.8, 1.0] },
        { at: L0('because'), p: [-4.55, 5.7, 8.65], l: [-0.98, 1.78, 0.98] } ] },
      act: [{ who: 'moses', at: L0('calf') + 0.25, do: 'walk', from: [-2.5, 1.5], to: [-0.8, 0.45], dur: 1.0, then: 'stand' }] } });
  // S3 "because Israel worshiped it" Cause and effect: Moses strides in from the left and strikes the calf off its plinth into
  //    the fire on "worshiped". The camera pans with the calf into the fire, catching the people reacting one by one, then
  //    tilts up with the smoke (the move that carries into the next era).
  add('S3', 'diorama', 'sinai', L0('because') - PRE, { beats: { worshiped: L0('worshiped') },
    dio: { cam: { f: 38, path: [
        { at: L0('because') - PRE, p: [1.22, 2.67, 5.12], l: [-0.35, 1.5, 0.3] },
        { at: L0('worshiped') + 0.06, p: [1.24, 2.67, 5.1], l: [-0.33, 1.5, 0.3] },
        { at: L0('worshiped') + 0.55, p: [1.45, 2.7, 5.0], l: [0.55, 1.25, -0.3], ease: 'inOut' },
        { at: L0('it') + 0.1, p: [1.46, 2.7, 5.0], l: [0.57, 1.3, -0.3] },
        { at: st(1) + 0.5, p: [1.5, 2.9, 5.0], l: [0.7, 3.4, -0.3], ease: 'in' } ] },
      act: [
        { who: 'moses', at: L0('calf') + 1.26, pose: 'swing', item: 'rod', strike: 'worshiped' },
        { who: 'w3', at: L0('worshiped') + 0.12, pose: 'fall', k: 0.35, dir: 1 },
        { who: 'w2', at: L0('worshiped') + 0.16, pose: 'shield', dir: -1 },
        { who: 'w1', at: L0('worshiped') + 0.2, pose: 'shield', dir: -1 },
        { who: 'w4', at: L0('worshiped') + 0.26, pose: 'stand', look: [-1, 0] },
        { who: 'w5', at: L0('worshiped') + 0.3, pose: 'stand', look: [-0.6, 0.1] },
        { who: 'w6', at: L0('worshiped') + 0.1, look: [-1, 0.1] },
        { who: 'w7', at: L0('worshiped') + 0.18, do: 'walk', from: [-1.25, -0.4], to: [-3.4, -2.6], dur: 1.6, then: 'stand' } ],
      fx: [{ on: 'calf', at: L0('worshiped') + 0.03, do: 'topple', to: [0.85, -0.6, 0.1], dur: 0.42 }, { on: 'calf', at: L0('worshiped') + 0.42, do: 'burn', dur: 3.2 }] } });
  // S4 "Centuries later" The time jump and the twist: dissolve from the calf's smoke into incense smoke rising past the same
  //    serpent from S0. The camera cranes up and back: a stone court; people bring it offerings (bowls, incense, a bowl lifted
  //    high, hands raised). A crowned man walks in from the left.
  add('S4', 'diorama', 'court', st(1) - PRE, { xin: { kind: 'fade', dur: 0.45 },
    dio: { cam: { f: 38, path: [
        { at: st(1) - PRE, p: [-1.15, 3.09, 3.9], l: [0.2, 2.4, 0.2] },
        { at: L1('later') - 0.1, p: [-1.4, 3.25, 4.4], l: [0.12, 2.15, 0.1], ease: 'in' },
        { at: L1('King') - 0.2, p: [-2.44, 4.28, 6.81], l: [-0.4, 1.1, -0.8], ease: 'out' },
        { at: L1('Hezekiah'), p: [-2.4, 4.25, 6.75], l: [-0.42, 1.1, -0.8] } ] },
      act: [{ who: 'hezekiah', at: L1('King') - 0.45, do: 'enter', from: [-3.2, 0.8], to: [-1.05, 0.55], dur: 0.95, then: 'swing' }] } });
  // S5 "King Hezekiah" Intent: low hero angle, the king on the left third, the serpent on the right third. He stops and lifts
  //    the hammer; behind the serpent one kneeling man looks up at him, another half rises.
  add('S5', 'diorama', 'court', L1('Hezekiah') - PRE, { beats: { destroyed: L1('destroyed') },
    dio: { cam: { f: 38, path: [
        { at: L1('Hezekiah') - PRE, p: [-2.79, 0.67, 6.22], l: [-0.6, 1.8, 0.2] },
        { at: L1('destroyed'), p: [-2.72, 0.66, 6.05], l: [-0.6, 1.8, 0.2], ease: 'in' } ] },
      act: [
        { who: 'hezekiah', at: L1('King') + 0.52, pose: 'swing', item: 'hammer', strike: 'destroyed' },
        { who: 'o1', at: L1('Hezekiah') + 0.05, pose: 'offer', look: [-1, -0.5] },
        { who: 'o2', at: L1('Hezekiah') + 0.25, pose: 'stand', look: [-1, -0.1] } ] } });
  // S6 "destroyed" The impact: a cut on the blow to the opening image (S0's low angle on the serpent's head). The hammer
  //    comes in from the left on the word; the bronze bursts apart; a flash; one shake.
  add('S6', 'diorama', 'court', L1('destroyed') - 0.12, { beats: { destroyed: L1('destroyed') },
    dio: { cam: { f: 38, shakeAt: 'destroyed', shakeAmp: 12, path: [
        { at: L1('destroyed') - 0.12, p: [1.55, 1.45, 2.75], l: [-0.2, 1.62, 0.2] },
        { at: L1('another'), p: [1.65, 1.42, 2.9], l: [-0.2, 1.6, 0.2], ease: 'out' } ] },
      fx: [{ on: 'serpent', at: 'destroyed', do: 'shatter' }, { on: 'smoke', at: 'destroyed', do: 'scatter' }] } });
  // S7 "another object Israel had begun worshiping" The aftermath and the point: elevated on the broken pole, then up and back
  //    on "object": the king beside the empty pole, bronze on the floor; one man still holds his bowl out to nothing, one
  //    reaches for the pieces, one recoils, two look at the king. Two rows of them: many had worshiped it.
  add('S7', 'diorama', 'court', L1('another') - PRE, {
    dio: { cam: { f: 38, path: [
        { at: L1('another') - PRE, p: [1.08, 4.78, 5.01], l: [0.2, 1.6, 0.0] },
        { at: L1('object') - 0.05, p: [1.06, 4.86, 5.06], l: [0.18, 1.58, -0.02] },
        { at: L1('worshiping') + 0.2, p: [0.51, 8.16, 6.94], l: [-0.2, 0.8, -1.2], ease: 'inOut' } ] },
      act: [
        { who: 'o2', at: L1('another') - 0.02, pose: 'shield', dir: 1 },
        { who: 'o5', at: L1('another') + 0.1, pose: 'stand', look: [-0.8, 0.2] },
        { who: 'o1', at: L1('another') + 0.2, pose: 'stand', look: [-1, 0] },
        { who: 'o6', at: L1('another') + 0.35, pose: 'stand', look: [-1, 0.1] },
        { who: 'o4', at: L1('object') + 0.1, pose: 'reach', dir: 1 } ] } });
  // (beyond the first 11 s) "But this one had been made at God's command."
  add('C6', 'diorama', 'compare', st(2) - PRE, { xin: { kind: 'fade', dur: 0.35 }, beats: { god: cue(2, "God's") },
    dio: { cam: { on: [0, 0, 0], el: 9, az: 0, dist: 9.4, fov: 32, ty: 1.35, sh: 0.06 }, rays: { on: 'serpentL', from: 'god', dur: 0.7, amt: 1.0, y: 2.6 } } });
  // NOCAP review build (make_film.sh NOCAP=1): no title, captions or scrim, to check the picture tells the story by itself
  if (globalThis.FW_NOCAP) S.forEach((s) => { s.text = false; s.title = false; s.scrim = 0; });
