**Part 1: Three treatments**

**T1 "Muscle memory"**
- **Thesis:** he reaches for a habit that used to work, and the habit is all that is left.
- **(a) Image:** the same burst pose shown twice.
- **(b) Space:** sorek, then lehi, then sorek again.
- **(c) Camera:** matched, locked frames.
- **(d) Light:** gold in the remembered shot, ember now.
- **(e) Transitions:** match cuts.
- **Payoff image:** the identical frame and pose with no gold.
- **Motifs:** bonds_fall, gold_upper_left.
- **Reuse:** lehi default, sorek wake, samson.burst with gold rim and rope brk.
- **New primitives:** none.
- **Risk:** it uses up the next line's "as at other times" beat. A gold insert could be misread as gold on his failure. The 1.3 s new-place read is tight.

**T2 "The empty corner"**
- **Thesis:** the corner where gold always arrived stays dark.
- **(a) Image:** negative space in the upper left.
- **(b) Space:** sorek only, standing in the room.
- **(c) Camera:** one push, then locked.
- **(d) Light:** ember lamp is the only key. The upper left gets darker on "LORD".
- **(e) Transitions:** cut on action, then hold.
- **Payoff image:** the burst pose under the dark upper left, with nothing arriving.
- **Motifs:** gold_upper_left (paid off as an absence), bonds_fall (the gesture with no bonds), lamp.
- **Reuse:** sorek wake/left, samson.wake/stand/burst, bubble, dust.
- **New primitives:** `shade`.
- **Risk:** an absence can read as simply "dark". It needs the withheld musical swell to carry it.

**T3 "Locks on the floor"**
- **Thesis:** the sign is gone and he hasn't looked down.
- **(a) Image:** cut hair in the foreground.
- **(b) Space:** floor level across the couch.
- **(c) Camera:** low static shot with a rack focus.
- **(d) Light:** ember raking low across the floor.
- **(e) Transitions:** a single shot, focus pull, hold.
- **Payoff image:** the locks sharp in the foreground, him soft behind them.
- **Motifs:** seven_locks, lamp.
- **Reuse:** sorek, DOF.
- **New primitives:** `scatter`, `rackFocus`.
- **Risk:** it suggests the hair was the source of his strength. The text says the LORD left.

| | a image | b space | c camera | d light | e transitions |
|---|---|---|---|---|---|
| T1 vs T2 | x | x | x | x | x |
| T1 vs T3 | x | x | x | x | x |
| T2 vs T3 | x | x | x | x | x |

**PICK: T2.** It follows the binding light rule exactly: the payoff is gold not arriving on the turn line, with a locked hold. It doesn't take the next line's "other times" beat, and it needs only one generic primitive. (This is a recommendation; Marcus chooses.)

**Part 2: Concept for T2**

**Motifs**
- **gold_upper_left:** first appears at S1 lion (14:6) and develops through 15:14. Here, his burst pose frames the upper-left corner where the gold rim and rays always came, and they don't come. Payoff: on "LORD" the corner gets *darker*.
- **bonds_fall:** first appears at Lehi (15:14) and develops through 16:9, 16:12 and 16:14. Here, he makes the breaking-free gesture with no bonds on him and nothing breaks. Payoff: his arms come down on "know".
- **lamp:** first appears at S3 Gaza (16:1). Delilah's ember lamp is the only key light here (her room, her choices). Payoff: it is the only light left at the hold.
- **seven_locks:** hair state 0 throughout, never pointed at.

**Emotion keys** (time, feeling, light value, camera energy 0-3)

| Time | Viewer's feeling | Light value | Camera energy |
|---|---|---|---|
| 48.5 | groggy confidence | 0.45 | 1 |
| 51.4 | bravado | 0.45 | 2 |
| 52.6 | expectation, then the swell is cut off | 0.40 | 0 |
| 54.5 | doubt | 0.38 | 0 |
| 55.1 to 56.5 | dread | 0.30 | 0 |

**Transition grammar**
- **In:** a plain cut from the 4th-call shot.
- **Inside:** cut on action on "shake" (size and angle change).
- **Out:** a hard cut on "But", then a locked hold that carries into "Notice what he said".

**Part 3: Spec**

```yaml
sequence: {id: S16_20, window: [48.5, 56.5], treatment: T2}
scenes:
  - id: A
    t: [48.50, 51.41]
    vo: [{line: 5, from: "said,", to: "and"}]
    set: {scene: sorek, v: wake}
    action:
      - {at: "said,", who: samson, pose: wake, does: "rises off the couch, weight forward"}
      - {at: "go", who: samson, pose: stand, does: "comes fully upright, chest squared to camera-left"}
    comp: {size: MCU, angle: low, subject_y: 0.46, layers: [far, mid, subject, fg]}
    cam: {move: push, amt: 0.05, ease: inOut, start: "go"}
    light: {key: "Delilah's lamp, ember, from lower right", gold: 0.0, change: "none; upper-left kept unlit (shade 0.25)"}
    text: {kind: bubble, words: "I will go out as at other times", t: [48.57, 51.30]}
    reads:
      - {t: [48.50, 49.10], kind: place, what: "same lamp-lit room, he is awake", eye: "lamp glow lower right leads to his rising silhouette"}
      - {t: [49.10, 49.61], kind: action, what: "he rises", eye: "upward motion of the rig"}
      - {t: [49.61, 51.30], kind: text, what: "his boast", eye: "bubble pops above his head, read with the voice"}
    audio: [{at: "said,", cue: "ambience lamp hiss, low pad"}, {at: "as", cue: "strings begin the old gold-rush swell, quiet"}]
    motifs: [lamp, seven_locks]
    trans_out: {kind: cut_on_action, note: "cut as his arms start to fling out on shake"}
    reuse: {rig: [samson.wake, samson.stand], devices: [bubble, dust]}
    new: []
    verses: ["Judges 16:20"]
  - id: B
    t: [51.41, 53.51]
    vo: [{line: 5, from: "shake", to: "free.\""}]
    set: {scene: sorek, v: wake}
    action:
      - {at: "shake", who: samson, pose: burst, does: "arms fling wide and up toward upper-left; no bonds, no brk, gold rim 0"}
    comp: {size: MS, angle: eye, subject_y: 0.52, layers: [far, mid, subject, fg]}
    cam: {move: hold, amt: 0.0, ease: inOut, start: "shake"}
    light: {key: "same ember lamp, lower right", gold: 0.0, change: "nothing arrives; upper-left negative space framed empty, shade 0.25"}
    text: {kind: bubble, words: "and shake myself free.", t: [51.41, 52.64]}
    reads:
      - {t: [51.41, 51.95], kind: action, what: "the old breaking-free gesture", eye: "cut on action, arms carry eye up-left"}
      - {t: [51.95, 52.64], kind: text, what: "shake myself free", eye: "bubble beside his raised arm"}
      - {t: [52.64, 53.51], kind: light, what: "the upper-left stays empty: no rim, no rays", eye: "his hands point into the dark corner"}
    audio: [{at: "shake", cue: "perc hit, swell rises"}, {at: "free.\"", cue: "swell cuts dry to silence 0.15 s after the word; dust only"}]
    motifs: [bonds_fall, gold_upper_left]
    trans_out: {kind: cut, note: "hard cut on But: size and angle change"}
    reuse: {rig: [samson.burst], devices: [bubble, dust]}
    new: []
    verses: ["Judges 16:20"]
  - id: C
    t: [53.51, 56.50]
    vo: [{line: 6, from: "\"But", to: "him.\""}]
    set: {scene: sorek, v: left}
    action:
      - {at: "\"But", who: samson, pose: burst, does: "still holding the gesture, small in frame"}
      - {at: "know", who: samson, pose: stand, does: "arms come down slowly, head stays level"}
    comp: {size: WS, angle: high, subject_y: 0.56, layers: [far, mid, subject, fg]}
    cam: {move: hold, amt: 0.0, ease: inOut, start: "\"But"}
    light: {key: "ember lamp only, lower right", gold: 0.0, change: "on LORD shade upper-left 0.25 to 0.6 over 0.8 s; lamp unchanged"}
    text: {kind: none}
    reads:
      - {t: [53.51, 54.01], kind: place, what: "same room from above, he is small", eye: "cut; high angle puts him alone in centre"}
      - {t: [54.47, 55.11], kind: action, what: "arms drop: nothing happened", eye: "downward motion of the arms"}
      - {t: [55.11, 55.91], kind: light, what: "the corner where God's light came goes darker", eye: "his last gaze line and the frame's empty upper-left"}
      - {t: [55.30, 56.50], kind: payoff, what: "a man alone under an empty corner, lit only by her lamp", eye: "locked frame, nothing else moves but dust"}
    audio: [{at: "\"But", cue: "single low key note"}, {at: "LORD", cue: "pad drops out; ambience only"}]
    motifs: [gold_upper_left, lamp, bonds_fall]
    trans_out: {kind: hold, note: "locked frame carries into the next line"}
    reuse: {rig: [samson.burst, samson.stand], devices: [dust, captions]}
    new: [{name: shade, api: "FILM.shade(x, y, r, amt0, amt1, t0, dur)", reusable_for: "any absence or withdrawal of light: prison, Dagon, Saul 1 Sam 16:14"}]
    verses: ["Judges 16:20"]
```
