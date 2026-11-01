# 07 · Motion and acting: making flat figures feel alive

**Use this when** you build or review any scene. Marcus's v57 note: "more so the motion… what was going on cinematically".

Two things were measured on v57:
- **47% of the runtime sat in stretches of over 4 s with no new visual beat** below the captions (Lintel 19–21%).
- **Characters stood still while the voice told what they did.**

This file is how to fix both inside our engine.

---

## 1. The rule: something happens on the word

- **The verb lands on its word.** The action's key frame (the snap, the lift, the fall) sits on the word's start time (`shot.beats`). Anticipation starts 0.2–0.4 s before.
- **A new thing every ~2 s.** Plan the beats in the shot list (05). On the render, `fw_check.py video` lists every still stretch over 6 s, and `tools/reference_study/beatclock.py` measures any reel.
- **Continuous motion is not a beat.** Walking, drifting dust and a slow push keep a shot alive, but the viewer's attention resets only on a new event: a contact, an entrance, a change of state, a light change, a cut.

## 2. Acting without faces

Our characters (`lintel/PP2_API.md`) have dot eyes and **no controllable facial expressions** (each pose draws a small fixed mouth and brow that you can't direct and that doesn't read at phone size). The v58 review flagged four beats that depended on faces ("half-smile", "eyes narrow", "face hardens"). They would have played as v57-style stills. Act with these instead:

| To show | Do this |
|---|---|
| Confidence | Chest up, shoulders back, a big gesture (the 'wake' pose: shoulders rolling back) |
| Fear / weakness | Smaller silhouette: hunched, arms in, head down; a high camera |
| Decision | Stillness after motion: the figure stops moving, then acts |
| Speaking | A speech bubble, or the 'call' / 'point' pose on the words |
| Listening / scheming | Turned away from the speaker, toward another subject (Delilah turned toward the door where the lords wait) |
| Prayer | 'pray' / 'lookup': head up toward the upper left (where God's light lives) |
| Effort | 'strain' → 'push': lean, braced arms, and a 2–4 px tremor on the figure |
| Triumph (enemies) | Crowd 'cheer', lord 'laugh' (head back, pointing) |
| Death (no gore) | Topple out of frame or into dust; never shown dead |
| Inner change | Light, not faces: the gold rim fades, the ember rises, the frame darkens |

**Two-shots tell more than singles.** Samson asleep and Delilah turned to the door says "betrayal" without a face.

## 3. Timing (animation principles that matter at reel size)

- **Anticipation** (0.2–0.4 s): a small move the other way before the big move. Samson dips before he heaves the gate.
- **Overshoot and settle:** a pose snaps 5–10% past its end, then settles over 0.15–0.25 s. Stamps, pills and counters land this way.
- **Ease everything:** cubic in-out for moves; ease-out on arrival after a cut. Nothing moves at constant speed except dust and walking.
- **Holds:** after a big action, hold 6–10 frames before the next thing. The eye needs to read the change.
- **Stagger crowds:** in a group, each figure starts 2–4 frames after the last, never all at once.
- **Motion blur on fast things:** whooshes, impacts and falls. The engine has no sub-frame blur yet; fake it with 2–3 trailing copies at falling opacity or a `post()` smear (`12_engine_guide.md` §7).
- **Secondary motion:** dust on impact, the cloth hem settling, hair or rope ends swinging, small debris after the roof falls, motes in light shafts.

## 4. The beat menu (pick one every ~2 s)

1. A person acts (the verb).
2. A figure enters or exits (walk in, whoosh in, step back).
3. An object changes state: the gate rips out, the ropes snap, the locks fall, a lamp goes out, the silver is brought.
4. A label, pill, stamp, bubble or counter lands.
5. The light changes: the gold rim goes out, ember rises, dawn comes up, the room darkens.
6. The camera arrives: a push settles, a reveal completes, a tilt reaches the roof.
7. A cut or match cut to a new picture.
8. A verse mark: a phrase turns gold on its spoken word.

## 5. Scene patterns that keep a held set alive

- **The subject swap** (Bible Animations): hold the set; bring a new figure in on its name and send the last one out.
- **The list run:** one beat per spoken item, 1.1–2.2 s each. The three escapes: bowstrings, ropes, loom pin.
- **The fast climax run:** 3–4 shots of 1.1–2.2 s on the key event (hands grip → pillar cracks → roof falls → dust).
- **The reveal by pull-out:** start on a detail; pull out to show the situation on the key word.
- **The rhyme:** end a sequence on a shape that the next sequence begins with (gate posts → pillars).

## 6. Light as acting (our strongest tool)

- **God's gold:** a rim on Samson's left edge (`st.gold`) and rays from the upper left. On only where the text says the Spirit or the LORD acted:
  - 14:6, 14:19, 15:14 "rushed upon him";
  - it goes out where his strength leaves (16:19, at the shave);
  - 16:20 then states "the LORD had left him".
  - Never on at the pillars (no "God answered").
- **Ember:** Philistine scenes and his own choices: Gaza at night, Delilah's lamps, Dagon's house.
- **Dawn:** the Hebrews 11 ending and the hook callback.
- **Light changes only on story beats.** A light change is a beat.

## 7. The motion draft (before any full render)

1. Render the changed range at half resolution: `node engine/render.js clip A B 2 --draft`.
2. Watch it as video (Marcus too). Stills cannot judge motion.
3. Check:
   - Does every verb land on its word?
   - Is no more than 30% of the runtime in stretches over 4 s, with at most one over 6 s and none over ~7.5 s?
   - Do the moves ease?
   - Does anything snap or pop?
   - Are faces and action clear of the caption band?
4. Run `python3 tools/reference_study/beatclock.py out/draft.mp4` and compare it with the Lintel numbers (a change every 2.0–2.4 s, 19–21% still).
