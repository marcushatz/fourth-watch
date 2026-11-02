# The Bronze Serpent: camera test, revision 2 (Nov 2)

The approved art style is unchanged. This revises the same segment as test v1 (Numbers 21:7–9, narration lines 6–7), following Marcus's notes of 07:48. The full episode has not been started.

Files:
- `creative/camera_test_v2_silent.mp4`: the silent review cut (no sound, no captions).
- `creative/camera_test_v2.mp4`: the same picture with the recorded voice.
- Build: `NOCAP=1 bash make_camtest.sh`; shots in `film_src/camtest_shots.js`, set in `film_src/camtest_sets.js`.

## 1. What changed, note by note

1. **Prayer, not cheering.** Moses kneels with his head bowed and eyes closed, palms pressed together under his chin. On "answer" the gold light reaches him and he lifts his face. His hands stay together, so the gesture never changes meaning.
   - Accuracy note: the biblical gesture of prayer is spreading out the hands (1 Kgs 8:22, Ezra 9:5). I tried it first. At this size, open hands read as a shrug or "hands up", so the test uses the sign anyone reads at a glance. Your call if you want the biblical gesture instead.
2. **The serpent is physically raised.** Moses and a second man grip the pole below the bronze and heave it off the ground. They pause to step under it, then walk it up with their arms overhead while a third man kneels at its foot to hold it. It stands on "pole".
   - The camera follows the bronze head as it rises.
   - The pole's angle drives the lifters' positions and hand heights (`lifter()` in the shots file), so their hands stay on the pole.
   - Once it leaves their reach, their hands open and come down. A raised fist never appears.
3. **The overhead has time.** The same move keeps rising over the serpent's head and settles above and behind it at 33.25 s. It is held to "look" (34.73), which is 1.5 s still after a 0.7 s settle.
   - The head is seen in profile, a long bronze wedge. The earlier round head with brow bumps read as a teddy bear from above.
   - The bitten people lift their faces to it one after another during the hold.
4. **"Look and live" is rebuilt.** It is a reverse from among the people: a medium-wide, slightly low shot, with the serpent on its pole at upper left. In front is a man who has not looked yet, slumped, with his wife holding him.
   - On "look", he lifts his face to it.
   - On "live", the colour comes back into him (grey-green to warm) and the light reaches him.
   - He gets up on his knees, then onto his feet: one hand on his chest, the other open toward the serpent.
   - She sits back, hands to her chest.
   - He is a full figure the whole time; there is no face close-up.
5. **Timings match the voice.** In v1 the document and the code disagreed. The T1 crane was 1.7 s in the document and 2.7 s in the code; the T4 push was 2.8 s and 2.0 s. The tables below are generated from the built score by `film_src/timing_table.js`, and every key time is a word time from the recorded take.
6. **Rhythm, not variety.** The variety rules are replaced by the rhythm rule in section 2.

## 2. Camera rule v3: visual rhythm (replaces the variety rules in v2)

v2's rules "no two shots in a row share the same distance and angle" and the variety checklist are dropped. The rules now are:

- **Follow the action, don't decorate it.** A shot lasts as long as the action it follows. Cut when the subject changes, not to change the angle.
- **One big move per passage, with stillness around it.** A big move has to be earned by something that moves (a thing rising, someone walking) or by a reveal. The shots on either side of it hold, so the move reads.
- **Hold for acting.** When the meaning is in a body (praying, rising), the camera stays still and lets the posture carry it, with at most a 3–5% drift.
- **Reverse on a look.** Crossing to the other side is for showing who looks and what they see.
- **Repetition is allowed.** A framing may return as a callback. Two shots in a row may share a size when the subject changes.
- **Timing.** Moves start on the word that motivates them and settle before the next cut. Cuts land 0.08 s before their word.
- **The silent test.** Every passage has to read with the sound off.

Rhythm of this test: **still** (R1, 2.9 s; only the light changes) → **one continuous move** (R2 into R3, about 3 s of travel) → **held overhead** (1.5 s) → **reverse, held** (R4, 2.9 s; the acting carries it).

## 3. The shots

| Shot | Words | Frame | Camera | What the picture says with the sound off |
|---|---|---|---|---|
| **R1** | "But God's answer was unexpected." | Medium-wide at eye level, slightly high. Moses kneels at the centre, praying. A red snake is in the foreground; a bitten man is slumped at right; tents and others are behind. | Locked until "answer", then a 5% drift in as the light arrives. | **The problem:** snakes, and people collapsing. **The prayer:** Moses on his knees. **The answer:** light comes down on him and he looks up. |
| **R2** | "He commanded Moses to raise a serpent on a pole." | Low and medium-wide. The bronze serpent lies across the frame with Moses and a man at its far end; sky fills the top half for it to rise into. | Holds through the grip. On "Moses" it starts one continuous move that follows the bronze head up. | **The commanded action:** Moses raises a bronze serpent on a pole, and it takes effort. |
| **R3** (same shot) | "Anyone who had been bitten could" | The move continues over the head and settles high behind it. The head is in profile in the lower half; the bitten people are below. | A crane up and over (0.7 s, easing out), then held 1.5 s. | **What they are looking toward:** the serpent. Faces lift one after another. |
| **R4** | "look at it and live." | A reverse from among the people, slightly low: the man and his wife in front, the serpent on its pole at upper left. | Held, with a 4% drift. | **The consequence:** the one who looks gets up, healed. |

The clip runs 26.95–37.6 s (10.65 s; v1 was 10.4 s). The extra quarter second lets him finish standing.

## 4. Timing, generated from the build

TIMING_TABLE

## 5. The silent read

SILENT_READ

## 6. The episode storyboard

v2's 30-shot plan (section 4 of `camera_storyboard_v2.md`) was written under the variety rule. Before the full episode, each shot gets the rhythm pass: a move stays only where an action or a reveal needs it. That pass has not been done, because you asked me to stay on this segment.
