(a)
```yaml
sequence: {id: S16_20, window: [48.5, 56.5], treatment: T2}
scenes:
  - id: A    # tail of S09 sorek/wake: carries in, no cut at 48.50; this push is S09's one camera move
    t: [48.50, 51.41]
    vo: [{line: 5, from: "said,", to: "and"}]
    set: {scene: sorek, v: wake}
    action:
      - {at: "said,", who: samson, pose: wake, does: "seated, head already lifted from Delilah's knees (lifted on 'woke up' in S09); hair 0; no further change"}
      - {at: "said,", who: delilah, pose: sit, does: "seated, holding still"}
    comp: {size: MCU, angle: low, subject_y: 0.46, layers: [far, mid, subject, fg]}
    cam: {move: push, amt: 0.05, ease: inOut, start: "go"}
    light: {key: "Delilah's lamp, ember, from lower right", gold: 0.0, change: "none"}
    text: {kind: bubble, words: "I will go out as at other times", t: [49.10, 51.30]}
    reads:
      - {t: [48.50, 49.10], kind: entity, what: "he is awake, seated at her knees, shaved", eye: "carried from S09; lamp rim on his shaved head"}
      - {t: [49.10, 51.30], kind: text, what: "his words", eye: "bubble pops above his head on 'I', read with the voice; push starts on 'go'"}
    audio: [{at: "said,", cue: "lamp-hiss ambience, low pad"}, {at: "as", cue: "strings begin the old gold-rush swell, quiet"}]
    motifs: [lamp, seven_locks]
    trans_out: {kind: cut, note: "plain cut on 'shake'; size and angle change, posture unchanged"}
    reuse: {rig: [samson.wake, delilah.sit], devices: [bubble, dust]}
    new: []
    verses: ["Judges 16:20"]
  - id: B
    t: [51.41, 53.51]
    vo: [{line: 5, from: "shake", to: "free.\""}]
    set: {scene: sorek, v: wake}
    action:
      - {at: "shake", who: samson, pose: wake, does: "no gesture: same seated posture as he speaks; no bonds; hair 0"}
    comp: {size: MS, angle: eye, subject_y: 0.55, layers: [far, mid, subject, fg]}   # subject lower centre-right, clear of right 140 px; upper-left framed as empty dark wall
    cam: {move: hold, amt: 0.0, ease: inOut, start: "shake"}
    light: {key: "same ember lamp, lower right", gold: 0.0, change: "none; the upper-left, where gold always entered, stays dark and unchanged"}
    text: {kind: bubble, words: "and shake myself free.", t: [51.41, 52.64]}
    reads:
      - {t: [51.41, 52.64], kind: text, what: "shake myself free", eye: "cut lands on him, bubble beside his head"}
      - {t: [52.64, 53.51], kind: light, what: "the upper-left corner is empty: no rim, no rays", eye: "bubble clears, leaving the large dark negative space as the biggest shape in frame"}
    audio: [{at: "shake", cue: "swell keeps rising"}, {at: "free.\"", cue: "swell cuts dry 0.15 s after the word; ambience and dust only"}]
    motifs: [gold_upper_left, lamp, seven_locks]
    trans_out: {kind: cut, note: "hard cut on But to a wide high angle"}
    reuse: {rig: [samson.wake], devices: [bubble, dust]}
    new: []
    verses: ["Judges 16:20"]
  - id: C
    t: [53.51, 56.50]
    vo: [{line: 6, from: "\"But", to: "him.\""}]
    set: {scene: sorek, v: left}
    action:
      - {at: "\"But", who: samson, pose: wake, does: "same seated posture as when he spoke, small in frame; no movement through the line (stillness carries 'did not know')"}
      - {at: "\"But", who: delilah, pose: sit, does: "unchanged"}
    comp: {size: WS, angle: high, subject_y: 0.56, layers: [far, mid, subject, fg]}   # verse card in the top band; dark upper-left wall stays visible below it
    cam: {move: hold, amt: 0.0, ease: inOut, start: "\"But"}
    light: {key: "ember lamp only, lower right", gold: 0.0, change: "none; corner and lamp unchanged, locked hold"}
    text: {kind: verse, words: "But he did not know that the LORD had left him. Judges 16:20", t: [54.01, 56.50]}   # captions off while the card shows
    reads:
      - {t: [53.51, 54.01], kind: place, what: "same room from above; he is small and alone in the dark", eye: "cut; high angle centres him under the dark wall"}
      - {t: [54.01, 55.11], kind: text, what: "verse card", eye: "card fades up in the top band, read with the voice"}
      - {t: [55.11, 56.50], kind: payoff, what: "the LORD had left him: unmoving man, ember lamp, empty upper-left", eye: "locked frame; nothing moves but dust, so the eye settles from the card to him and the dark corner"}
    audio: [{at: "\"But", cue: "single low key note left to ring; no new cue on LORD"}]
    motifs: [gold_upper_left, lamp, seven_locks]
    trans_out: {kind: hold, note: "locked frame carries to the cut into S11 Lehi ('as at other times')"}
    reuse: {rig: [samson.wake, delilah.sit], devices: [verse, dust]}
    new: []
    verses: ["Judges 16:20"]
```

(b)
- **Verse card:** I added the required ESV verse card to C, on line 6. It starts on "did" (54.01), after the 0.5 s place read, and the reads now run place, then text, then payoff with no overlap. This clears both the missing-card FAIL and the C overlap WARN. Captions are off while the card shows.
- **Posture (A1, A2, B1, C1, C2):** he no longer stands, flings his arms or drops them. He stays in the seated wake pose at Delilah's knees from S09's "woke up" through to the end. The bubbles carry his words, and his stillness carries "did not know." Hair is 0 in every scene.
- **Light (C3):** I cut the darkening on "LORD" and dropped `shade`, so there are no new primitives. The T2 thesis still holds: B frames the upper-left as an empty, unchanged dark wall. Per B2, the silence after "free." is audio only, and the light stays the same. I also removed the audio cue on "LORD" so the sound doesn't stage a departure either.
- **Visible change about every 2 s and grammar:** the changes come from the bubble on "I", the push on "go", a cut on "shake", the bubble clearing, the music cutting dry, a cut on "But", the card arriving, then a 1.39 s locked payoff hold. Consecutive shots change size and angle: MCU low, then MS eye level, then WS high.
- **Scope:** I treated A as the tail of S09, so the push is S09's only camera move; S09 should not have another. I removed bonds_fall and any memory insert, because S11 Lehi ("as at other times") follows directly.