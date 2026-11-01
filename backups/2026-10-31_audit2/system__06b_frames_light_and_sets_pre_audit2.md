# 06b · Frames, light and sets: what makes a frame beautiful on a phone

**Use this when** you design a set, light a scene, or judge a still. It goes with `06_camera_and_angles.md` (where the camera is) and `07_motion_and_acting.md` (what moves).

Marcus: "I want it visually to be good." On every channel studied, art style did not separate hits from lows. What did was every clause shown happening and something new on screen about every 2 s (judged on the other channels, measured on Lintel against Ep 1). Raw movement did not separate on Lintel, so "motion" means new events, not movement for its own sake. So "good visuals" here means **frames that read instantly at phone size and carry the story's emotion**, not detail for its own sake.

---

## 1. The phone test (every frame)

The frame is seen at ~6 cm wide, for ~2 s, often with the sound off. Check:
1. **Silhouette:** can you tell who it is and what they're doing from the outline alone? Poses read in silhouette; faces don't.
2. **Value contrast:** the subject is the brightest or darkest thing in its area. Squint at the still: the subject should still pop.
3. **One focal point:** one thing to look at. Background detail is lower in contrast and softer (depth of field, haze).
4. **The safe frame:** the subject sits 38–60% down, clear of the caption band (the top ~36%) and the bottom 300–400 px.
5. **Text legibility:** captions and pills read at 360 px wide (`fw_review.py` makes a phone sheet).

## 2. Depth: four layers in every shot

| Layer | Parallax | What goes there | Treatment |
|---|---|---|---|
| Foreground | 1.4× | A doorframe edge, spears, a pillar, foliage | Soft (out of focus), dark; in at least every other shot |
| Subject | 1× | The character and the action | Sharp, the brightest or most saturated |
| Middle | 0.5× | The set: walls, a gate, a market | Medium contrast, slightly hazed |
| Far | 0.2× | The sky, hills, a city skyline | Low contrast, the haze colour |

Engine: `focus` / `aperture` for depth of field (3–6), `scene.fog` for haze, `fgScale` for the foreground blur (`scenes/_API.md`).

## 3. Light

- **One key light per scene, from the upper left** (the series rule), with a soft fill. Shadows fall to the lower right.
- **A rim light** separates the subject from a dark background. The gold rim on Samson is our storytelling rim: it is on only while the text says the Spirit is on him.
- **God's light (gold rays):** only where the text says God acted (14:6, 14:19, 15:14). Its absence is as loud as its presence (16:19–20).
- **Practicals:** lamps, fires and torches give warm pools in night scenes (Gaza, Delilah's house, Dagon's house). They make a night frame readable without flattening it.
- **Motivated changes only:** light changes on story beats (the gold fading at the shave; the dawn at the ending), and each change counts as a visual beat.

## 4. The colour script (plan the whole reel's colour before the shots)

Map the emotional arc to colour, so the viewer feels the story's turns even with the sound off.

**Ep 1 (v59):**

| Section | Shots | Palette | Feeling |
|---|---|---|---|
| Hook | H1 | Night sky blue + an ember-lit house window + a pale gate | Strength in the wrong place |
| Gift | S1 | Warm afternoon vineyard + a gold rush | God's gift |
| Gaza | S3–S5 | Deep night, ember lamps | His choices |
| Delilah | D1–F2 | Lamp-warm interior, red/cream (Philistine colours), lords in ember | Seduction, the trap |
| The light leaves | E2–G1 | The gold fades out; the interior cools | Loss he doesn't notice |
| Memory | J1–J2 | A warm Lehi flash, then a dim graphic | "As at other times" |
| Prison | M1 | Grey-green, desaturated, cold | The cost |
| Dagon | M2–P2 | A crowded ember interior, smoke | The enemies' triumph, then the fall |
| Hebrews 11 | Q2 | Parchment and gold | Remembered for faith |
| Ending | R1–Z1 | Dawn on the hill in front of Hebron, the Gaza gate lying on top (16:3) | Hope |

## 5. Sets: reuse, with variety

- **One set per story run** (direction_rules §4): change the framing, light, time of day or subject, not the location.
- **Make each set work from 3–5 camera positions** (06 §4: positions A–E). Build the set with a "fourth wall" you can shoot through for over-the-shoulder shots.
- **Dress for the size you shoot:** wide shots need silhouette landmarks (the gate, the pillars, the mill); close shots need one textured prop (the silver, the locks, the shackles).
- **Our engine's limits:**
  - 2 CPUs and software WebGL: keep shadow maps ≤ 2048 and the geometry modest;
  - a frame must render in under ~3 s;
  - instance repeated props.

## 6. Effects that add life cheaply

- Dust motes in light shafts (`LW.particles`, `LW.shaft`).
- Dust bursts on impacts (the gate posts, the roof).
- Haze on the far layer.
- Cloth or hem settling after a move.
- A floor glow under lamps (`LW.pool`).
- A slight film grain and vignette (25–35%).
- No lens flares, glitches or trendy filters: they date the look and fight the reverent tone.

## 7. The still check (a review routine for any frame)

1. Squint: does the subject pop?
2. Cover the text: does the picture still say what the line says?
3. Count the focal points: one?
4. Check the four layers: foreground, subject, middle, far?
5. Light: one key from the upper left, motivated, matching the colour script?
6. Safe frame and phone-size text?
7. Could this frame be a thumbnail? (The best one per reel becomes the cover; see `10_publish_and_growth.md`.)
