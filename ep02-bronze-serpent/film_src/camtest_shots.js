  // ---- Camera-direction test: Numbers 21:7-9, VO lines 6-7 (creative/camera_storyboard_v2.md, shots T1-T4) ----
  const W6 = (w) => cue(6, w), W7 = (w) => cue(7, w);
  // T1 "But God's answer was unexpected." Moses praying for the people (21:7), eye level; on "But" the camera cranes up and
  //    back into the sky until the whole camp lies below: dozens of bitten people among the tents. God's light falls on Moses.
  add('T1', 'diorama', 'camp', 0, { beats: {}, dio: { faces: 'medium',
    cam: { f: 36, path: [
      { at: 0, p: [0.95, 1.45, 2.5], l: [-0.55, 1.75, -0.1] },
      { at: W6('But') - 0.05, p: [0.97, 1.46, 2.44], l: [-0.55, 1.75, -0.1] },
      { at: W6('unexpected') + 0.55, p: [8.5, 24.0, 17.0], l: [-0.6, 0.0, -1.2], ease: 'inOut' },
      { at: W7('He'), p: [8.7, 24.5, 17.3], l: [-0.6, 0.0, -1.2] } ] },
    rays: { on: 'moses', from: W6('answer'), dur: 0.7, amt: 0.9, y: 2.0 },
    key: { on: 'moses', y: 1.2, i: 30, angle: 0.3, from: [-3, 9, 2], r: 1.6, actor: 0.35 }, keyFrom: W6('answer'),
    fx: [{ on: 'serpent', at: 0, do: 'hide' }] } });
  // T2 "He commanded Moses to raise a serpent on a pole." Ground level, low: Moses directs, two men heave the pole up on
  //    "raise"; the camera tilts and cranes up with the bronze head until it stands against the sky (monumental, low angle).
  add('T2', 'diorama', 'camp', W7('He') - PRE, { beats: {}, dio: { faces: 'medium',
    cam: { f: 34, path: [
      { at: W7('He') - PRE, p: [3.5, 0.6, 3.4], l: [-1.2, 1.2, -0.4] },
      { at: W7('raise') - 0.1, p: [3.48, 0.62, 3.4], l: [-1.0, 1.5, -0.35] },
      { at: W7('pole') + 0.2, p: [3.3, 0.9, 3.5], l: [0.0, 3.3, 0.0], ease: 'inOut' },
      { at: W7('Anyone'), p: [3.28, 0.92, 3.52], l: [0.0, 3.35, 0.0] } ] },
    act: [{ who: 'moses', at: W7('He') - PRE, do: 'walk', from: [0.48, 0.45], to: [0.48, 0.45], dur: 0.01, then: 'direct' }, ...['sick', 'helper', 'b2', 'looker'].map((who) => ({ who, at: W7('He') - PRE, hide: true })), { who: 'moses', at: W7('He') - PRE + 0.02, pose: 'direct', dir: -1, look: [-0.8, -0.6] },
      { who: 'h1', at: W7('He') - PRE, pose: 'raise' }, { who: 'h2', at: W7('He') - PRE + 0.05, pose: 'raise' }],
    fx: [{ on: 'serpent', at: W7('He') - PRE, do: 'show' }, { on: 'serpent', at: W7('commanded') + 0.05, do: 'raise', dur: 2.3 }] } });
  // T3 "Anyone who had been bitten" Over the serpent's shoulder, high: its bronze head in the near corner, the bitten people
  //    below turning their faces up to it (the view they are looking at). A slow drift down past the head.
  add('T3', 'diorama', 'camp', W7('Anyone') - PRE, { beats: {}, dio: {
    cam: { f: 36, path: [
      { at: W7('Anyone') - PRE, p: [-1.56, 6.99, -2.06], l: [2.6, -0.2, 3.2] },
      { at: W7('could'), p: [-1.36, 6.7, -1.8], l: [2.6, -0.2, 3.2], ease: 'out' } ], ap: 0.8, focus: 5.4 },
    act: [...['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q11', 'sick', 'helper', 'b2', 'looker'].map((who) => ({ who, at: W7('Anyone') - PRE, show: true })), { who: 'looker', at: W7('Anyone') - 0.2, look: [-0.4, 0.9] }, { who: 'woman', at: W7('Anyone') - 0.3, pose: 'beseech', dir: 1 }, { who: 'b2', at: W7('Anyone') - 0.2, pose: 'beseech', dir: -1 },
      { who: 'helper', at: W7('who'), look: [-0.3, -1] }, { who: 'h1', at: W7('Anyone') - 0.4, pose: 'stand', look: [-0.6, -1] }, { who: 'h2', at: W7('Anyone') - 0.4, pose: 'kneel', look: [-0.6, -1] },
      { who: 'moses', at: W7('Anyone') - 0.4, pose: 'direct', dir: -1, look: [1, 0.3] }] } });
  // T4 "could look at it and live." One man, close: the camera pushes in from a low medium to a close-up as he lifts his face
  //    to the serpent on "look"; on "live" the light reaches him and he stands up, healed (21:9).
  add('T4', 'diorama', 'camp', W7('could') - PRE, { beats: {}, dio: { faces: 'medium',
    cam: { f: 34, ap: 3.0, path: [
      { at: W7('could') - PRE, p: [2.45, 0.9, 3.9], l: [1.12, 1.15, 1.76] },
      { at: W7('live') + 0.9, p: [1.98, 1.25, 3.35], l: [1.12, 1.6, 1.76], ease: 'inOut' } ] },
    key: { on: 'looker', y: 1.3, i: 30, angle: 0.3, from: [-1.5, 6, -1], r: 1.2, actor: 0.4 }, keyFrom: W7('live'),
    act: [...['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q11'].map((who) => ({ who, at: W7('could') - PRE, hide: true })), { who: 'looker', at: W7('look') + 0.02, pose: 'beseech', dir: -1 }, { who: 'looker', at: W7('live') + 0.05, pose: 'relief', look: [-0.6, -1] }] } });
  // T5 (end of the test): hold on the healed man for a beat, no caption (the next line is not part of the test)
  add('T5', 'diorama', 'camp', cue(8, 0) - 0.04, { text: false, beats: {}, dio: { faces: 'medium',
    cam: { f: 34, ap: 3.0, path: [{ at: 0, p: [1.98, 1.25, 3.35], l: [1.12, 1.6, 1.76] }, { at: 99, p: [1.98, 1.25, 3.35], l: [1.12, 1.6, 1.76] }] },
    key: { on: 'looker', y: 1.3, i: 30, angle: 0.3, from: [-1.5, 6, -1], r: 1.2, actor: 0.4 } } });
