# 06 · Camera and angles: what the camera says

**Use this when** you plan any shot (with `05_shot_list.md`), and when you review a render.

**Why it exists:** on v57 Marcus said, "these other accounts succeeded… proper visual storytelling, camera angles, pacing". The fresh review of the v58 plan (Oct 31) found it still weak here:
- 25 of 37 shots were plain medium or wide;
- there were 3 medium close-ups and no close-ups;
- only two shots named an angle;
- 11 shots in a row sat on one set (Delilah's house).

Rules: `research/direction_rules.md` §6–7 (camera amount did not separate hits from lows; every big move needs a job). This file is the craft that makes a still camera expressive.

---

## 1. Every shot has a size, an angle and a reason

Write all three in the shot list. **The reason is the line being spoken.**

### Sizes

| Size | Frame | Use it for | Our share target |
|---|---|---|---|
| XWS (extreme wide) | The whole place; people tiny | A new place, scale, crowds, "the whole city", aftermath | ≤ 10% |
| WS (wide) | Full bodies plus the set | Who is where; walking; action involving several people | ~30% |
| MS (medium) | Waist up | Acting with the hands: lifting, pouring, pushing | ~30% |
| MCU (medium close-up) | Chest up | Speech, a decision, a reaction shown by posture | ~15% |
| CU (close-up) | Head or hands fill the frame | The turn, the thesis line, a grip, the moment that matters most | 3–5 per reel |
| INS (insert) | One object | A prop that carries the meaning: the silver, the locks, the shackles, the cloth over his eyes | 3–5 per reel |

Close-ups and inserts are cheap in our engine: one prop or two hands, no set dressing. They break up runs of wides, and they are how a still camera says "look at this".

### Angles, and what they mean

| Angle | Says | Use in Ep 1 |
|---|---|---|
| **Eye level** | Neutral; "here is what happened" | The default for story beats |
| **Low** (camera below, looking up) | Power, threat, scale, triumph | Samson tearing out the gate posts (S5); the push on the pillars (P1); the Philistine lords standing over Delilah |
| **High** (camera above, looking down) | Weakness, smallness, being watched, fate | Samson asleep on her knees as the locks fall (top-down, E2); seized (G1); blind at the mill (M1); praying between the pillars (M3) |
| **Top-down (bird's-eye)** | A plan, a pattern, God's view, the end of something | The shave; the rubble after the fall |
| **Over the shoulder (OTS)** | We are with this person; we see what they see | The Gaza ambush through the waiting men's spears (S4); Delilah's lords looking at her |
| **Dutch tilt (5–10°)** | Something is wrong | Use once at most, on "he did not know that the LORD had left him" if at all |
| **POV / blind** | What he can't see | Blind Samson: frame dark at the edges, sound up front |

**The pairing that tells the story without words:** shoot him from high when he is weak and from low when he is strong. In Ep 1, M3 (the prayer) is high and P1 (the push) is low. The camera itself says "made strong out of weakness". The v58 plan had M3 low, which is backwards.

## 2. Rhymes and callbacks (composition that remembers)

The most consistent ending rule across three channels is that **the final image calls back the hook image**. Hits did it 5 of 6 times on the other channels; lows 1 of 4.

Build visual rhymes on purpose:
- **Gate posts ↔ pillars (Ep 1).** Frame Samson between the two gate posts in the hook exactly as he will stand between the two pillars at the end: same size, same height in frame, same symmetry. The viewer feels the echo before they understand it.
- **The object that opens ↔ the object that closes:** if something opens in the hook, it can close at the warning. Doors are The Lintel Network's signature, so we don't use door imagery as a symbol (canon §1).
- **The same object returns changed:** the gate on the hill at dawn; a scroll that unrolls; a lamp that dims, then is relit.

Write `callback: true` on the shot that returns, and name what it rhymes with.

## 3. Moves: when the camera travels

The camera is locked or drifting 2–4% in most shots. A big move (≥15%) must have one of five jobs (direction_rules §7):
1. **The hook reveal:** pull out from the subject to the world, landing on the key word (Lintel's Tree: −42%).
2. **Travel that links scenes or time.**
3. **Following a walker** (Samson carrying the gate up the hill).
4. **Pushing into a revelation** (+12–37%): the thesis line, a verse, a key prop.
5. **Carrying one picture into the next** (BibleProject's continuous travels).

**Craft:**
- One main move per shot; it starts on its word and eases in and out (ease-out when arriving after a cut).
- Hold 6–10 frames after it settles before cutting.
- A **tilt up** reveals height and threat: the cracking pillar to the crowded roof.
- A **crane up and out** ends a scene and lets it breathe: over the rubble.
- A **push in on a still subject** makes a line weigh more. Use it on the thesis line ("But he did not know that the LORD had left him"): a slow push of +6–10% over 3.6 s, high angle, as the gold rim has already gone.
- **Shake:** only on an impact (the roof falling): at most 12 px, gone in 0.4 s.

## 4. Cutting: keeping one set alive

Long runs on one set are fine when the camera changes position. The v58 plan's Delilah's house (11 shots, 8 of them medium or MCU at eye level) needs:
- **Change size AND angle** between neighbouring shots, never just one notch of size on the same axis (jump cut).
- **Cycle positions:**
  - A: wide, high, from the door, the "lords' view";
  - B: MS, eye level, Delilah's side;
  - C: CU, hands or objects (the silver, the loom pin, a lock of hair);
  - D: top-down on the couch;
  - E: OTS from behind Delilah toward Samson.
- **Use the 180° line:** keep Samson screen-left and Delilah screen-right across the whole run (the light comes from the upper left, so Samson stays in it until it leaves).
- **Insert a cut-away** when the words leave the room: the lords waiting outside with the silver, the Philistines hiding in the inner room (16:9, 16:12 only).
- **A speech bubble or verse mark** can be the change in a held shot instead of a cut.

## 5. Transitions

| Transition | Use | Engine |
|---|---|---|
| Hard cut on the first word of the new clause | Default | Shot t0 = the word time minus 0.08 s (`PRE`) |
| Whoosh (the subject exits fast with motion blur and the next enters) | Entrances, lists, energy | Figure position over 0.25 s, with motion blur |
| Graphic match / morph (a shape becomes the next scene) | Symbolic links: gate posts → pillars; locks of hair on the floor → chains | Match the shape's screen position across the cut |
| Crossfade 0.2–0.3 s | Soft time jump | A short dissolve |
| Light sweep | Time jump (day → night) | Animate the key light across the cut |
| Dip to dark 0.3–0.5 s | A loss; before the end card | `dark: 0..1` on the frame |
| Cream flash 0.2 s (`flashIn`) | Only a real jump in place or time | On Bible Animations, flash cuts showed up in the lows |

A **match cut** is the cheapest way to look cinematic: end shot A on a shape, start shot B on the same shape. Ep 1 ideas:
- The fallen locks (E3) → the shackles (M1).
- The gate posts (H1) → the pillars (M3).
- Delilah's hand closing on the silver → the shackles closing.

## 6. Composing for 9:16

- **The safe frame:** the top ~36% (700 px) carries the header and narration; nothing important goes in the bottom 300–400 px or the right 140 px below 45% height (Instagram's buttons).
- **Key action and faces sit 38–60% down.** (An older note in `research/feedback_rules.md`, from the Oct 29 silhouette build, says 22–60%. That was before the narration moved to the top third in Round 3; with the caption band at the top ~36%, a face at 22% sits under the words. Ask Marcus if this ever conflicts.)
- **Stack vertically:** tall subjects, verticals, people above people (crowd on the roof above the pillars).
- Prefer vertical moves (tilt, crane) over pans. A pan crosses only 1080 px; a tilt has 1920.
- **Depth:** a soft foreground element (a doorframe edge, spears, a pillar) in at least every other shot makes a diorama feel filmed.
- **Light:** one key light from the upper left (God's gold when the text says God acted); ember for Philistine scenes on screen right. Light changes only on story beats.

## 7. Our engine: how to get these shots

Every scene module sets the camera in `frame(t, shot, cam)`:
```js
FW.setCam(cam, [px, py, pz], [lookX, lookY, lookZ], fovDeg);   // position, look-at, field of view
cam.setViewOffset(W, H, 0, -shift * H, W, H);                    // vertical frame shift (keep the subject below the caption band)
```
- **High angle:** raise `py` above the subject and look down (the look-at y is below the camera).
- **Top-down:** `py` high, the look-at directly below, a small `fov` (25–30°) to flatten.
- **Low angle:** `py` near the ground and look up (the look-at y is above the camera); widen the `fov` (45°) for power.
- **Close-up:** move closer rather than narrowing the fov below ~30°, which flattens our low-poly figures; use `focus`/`aperture` for a soft background.
- **OTS:** put a foreground billboard (spears, a lord's shoulder) between the camera and the subject; it blurs with depth of field (`fgScale`).
- **Moves:** interpolate the position and look-at with `FW.ease.inOut(k)` where `k = (t − beat) / dur`; start at `shot.beats.word`.

## 8. The angle pass (do this on every shot list)

Before the shot list goes to Marcus:
1. Write size + angle + reason for every shot.
2. Count the shares: no more than 60% MS+WS at eye level; at least 3 CUs and 3 inserts; at least 2 low and 2 high angles in a 90 s reel.
3. Mark the weak/strong moments and match them to high/low.
4. Find two rhymes (hook ↔ end, warning ↔ consequence) and plan the match cuts.
5. Check every neighbouring pair for a jump cut (same size, same angle).
6. On any run of 4+ shots on one set, check that at least 3 different camera positions are used.
7. Check rhythm, beats, verse holds and the tail against the storyboard.

## 9. Ep 1 angle plan (applied to v59; see `ep01-samson/shotlist_v59.md`)

| Shot | Was | Now |
|---|---|---|
| H1 hook | MS → XWS pull-out | MS low on the gate posts → pull-out ending at a WS: the empty night street, the lamp-lit window of the house he came from behind him; posts framed like the pillars to come |
| S4 ambush | WS | OTS through the waiting men's spears toward the gate, keeping quiet |
| S5 gate | MS follow | Low insert of the posts tearing out of the ground on "pulled", then a follow of the carry (not a replay of H1) |
| D1–F2 Delilah's house | 8× MS/MCU eye level | Cycle A–E (section 4): door-high wide for the lords; insert of the silver; OTS from Delilah; top-down shave |
| G1 thesis line | MS still | High angle, slow push +8%; the gold already gone (it faded at the shave, 16:19); he stands unaware; the seize comes on contact |
| M3 prayer | MS low | High, small in the frame between huge pillars |
| P1 push | MS push | Low; CU of his hands taking hold of the two middle pillars (16:29); he leans his weight, then bows with all his strength (16:30); tilt up the cracking pillar to the crowded roof |
| P2 fall | WS | Fast run: roof falls (WS) → lords topple (MS) → dust; crane up over the rubble |
| Q3 + Z1 ending | Walkers + card | The hill in front of Hebron at dawn with the Gaza gate lying on top (16:3), slow push-in; the question pills over the set; short outro |
