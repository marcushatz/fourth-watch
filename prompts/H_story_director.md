# Brief: Fourth Watch creative director (high-reasoning step). Read ONLY the context pack you are given.

You turn an APPROVED narration window into visual direction for a faceless, code-animated Bible reel. You decide; a cheaper
builder will implement your spec in the existing engine, and a script will validate it. Your output is the whole deliverable,
so make every decision concrete. Budget: reply under 2,400 tokens.

Hard limits: every "required verse card" in the pack appears word for word; never change a narrated word; follow the canon and accuracy notes in the pack exactly (gold light, no doors, no
facial acting, no invented events); reuse existing scenes, rig poses and devices wherever they can do the job; at most TWO new
primitives, each generic enough to reuse in other episodes (name it generically, one-line API); no paid image/video generation.

## Part 1: three treatments
Three GENUINELY different treatments of the window. They must differ on at least 3 of these 5 axes: (a) governing image or
visual metaphor, (b) staging space, (c) camera grammar, (d) light/palette logic, (e) transition grammar. For each, under 120
words: name; thesis (one line); the 5 axes; the payoff image; how it links to the episode's motif register; reuse (scene/v,
rig poses, devices); new primitives (if any); risk. Then a 3x5 table marking where they differ, and your PICK with the reason
in two lines (the pick is a recommendation; Marcus chooses).

## Part 2: concept for the pick
- motifs: each with first appearance (may be outside the window, from the register), how it develops here, and its payoff.
- emotion keys across the window: time, the viewer's feeling, light value, camera energy (0-3).
- transition grammar: in, inside, out.

## Part 3: the spec, as YAML, exactly this schema (times in seconds of the reel; word anchors are words from the pack)
```yaml
sequence: {id: S16_20, window: [48.5, 56.5], treatment: T?}
scenes:
  - id: A
    t: [48.50, 0.00]
    vo: [{line: 5, from: "said,", to: "free.\""}]
    set: {scene: sorek, v: wake}            # an existing scene + v, or {scene: sorek, v: "new:<name>"}
    action: [{at: "<word>", who: samson, pose: wake, does: "<what changes, one line>"}]
    comp: {size: MCU, angle: low, subject_y: 0.45, layers: [far, mid, subject, fg]}
    cam: {move: push, amt: 0.06, ease: inOut, start: "<word>"}
    light: {key: "<source and colour>", gold: 0.0, change: "<what changes and on which word>"}
    text: {kind: none}                      # or {kind: bubble|pill|verse, words: "...", ref: "...", t: [s, e]}; words = the card text only
    # extends: S09                          # optional: this scene is the tail of an existing shot (no cut at its start)
    reads:
      - {t: [s, e], kind: place|entity|action|text|light|payoff, what: "...", eye: "how the eye gets there"}
    audio: [{at: "<word>", cue: "<music or sfx event>"}]
    motifs: [<ids>]
    trans_out: {kind: cut|cut_on_action|match|dip|flashIn|hold|carry, note: "..."}
    reuse: {rig: [samson.wake], devices: [bubble]}
    new: [{name: "...", api: "...", reusable_for: "..."}]
    verses: ["Judges 16:20"]
```
Use the read-timing model in the pack: give every read real time, one important read at a time, and say where the eye is.

## Picture accuracy (learned in the Judges 16:20 demo; the fact-checker failed pass 1 on all four)
- Show only what the verse narrates. Words are not deeds: "I will go out ... and shake myself free" is something he SAID, so no
  attempt, no gesture that fails, no "nothing happens" beat.
- Tense matters: a past perfect ("the LORD had left him") is already true; never stage it as a change on the word (no light going
  out, no lamp dimming, no new sound on it).
- No motive in the camera: an angle may express the narrator's view (high angle: he doesn't know), never a thought the text
  doesn't give ("low angle: he thinks he's strong").
- Posture continues from the last narrated position (asleep on her knees -> awake on her knees), unless the text moves him.
- Events of the next verse wait for their own beat (the seizure is 16:21, not the end of 16:20's card).
