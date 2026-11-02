# Visual techniques in the two reference reels (Nov 2)

**Sources (verified):**
- `research/lintel_ref/ref1.mov`: The Lintel Network, "Honest Questions · Long Lives" (Methuselah, 969 years). instagram.com/reel/De_5n9iMZnm. 99.6 s screen recording.
- `research/lintel_ref/ref2.mov`: The Lintel Network, "Honest Questions · Suffering" (Joseph). instagram.com/reel/DewgBuDsPK3. 117.9 s screen recording.

**Method:**
- The reel area (912×1499 px of the recording; its bottom ~7% is off screen) was cropped out.
- One frame per second; frames at 8 fps across four transitions; full-resolution crops of six frames.
- Cut detection: ref1 has 25 hard cuts, ref2 has 24. Soft transitions are counted from the strips.

Frames stay in the scratchpad, not the repository. Positions and sizes are given as a share of the frame width (W) or height (H), measured by eye from the crops (±1%). Reasons marked *inference* are not measured.

## The headline finding

Their quality does not come from detailed illustration.
- The environments are simple low-poly 3D: isometric, soft shadows, blurred foreground shapes.
- The characters are flat 2D figures with a dark outline.

What makes it look professional is a **typography layer that is on screen the whole time**, plus **one idea per image**, carried by a symbolic object, a diagram or a staged action. Our earlier tests lost on both counts: our type was small captions, and our pictures tried to carry the meaning with detail.

## 1. Illustration

| Technique | Where | Measured | Becomes |
|---|---|---|---|
| One warm colour family per scene (gold, sienna, sepia, grey-blue rain), plus one saturated accent: a red, yellow or blue robe, or gold light | Every scene | Backgrounds are low-saturation; the only saturated pixels are robes and light | `palette.scene(...)` presets: a base family plus one accent |
| Characters: flat fills, a dark brown outline (~0.3% W), no texture, simple faces (dot eyes, a brow line, a profile nose, a beard as one shape) | ref2 15.5, 35.5 | Figures are about 6 heads tall, limbs are straight tapered segments, and robe colours are the brightest values in the frame | Character standard: outline on, flat fills, profile and three-quarter views |
| A key light with long cast shadows; soft occlusion where shapes meet the ground | ref1 28.5, ref2 18, 64 | Shadows run at about 30–40° | Environment plates lit from one side, with contact shadows under every figure |
| Foreground framing by large, very blurred dark shapes in the corners | ref1 4.5, 41.5, ref2 2 | They cover 10–25% of a corner | `Scene` foreground layer: blurred silhouettes |
| Volumetric light: a beam from above, a pool on the floor, drifting dust specks | ref1 2–5, 41–47, 78–84 | Beam about 30% W wide; 40–80 specks | `GodRays` and `Dust` effects (the gold-from-above canon) |
| A dark "concept stage": a near-black warm field with a radial glow behind one symbolic object | ref1 16–23, 31–37, 48–58, 85–86, 91–98 | The background is close to #1E1410; the glow sits behind the object | The `ConceptStage` component |

## 2. Typography

| Technique | Where | Measured | Becomes |
|---|---|---|---|
| The narration is typed on screen, top left, in an italic old-style serif. Words appear in time with the voice: the next word fades in dim, then brightens. The line keeps building across cuts. | Every shot; ref1 9–15, 23.4–24.3 | Size ≈ 4.5% W; margin 6% W; top at 13–17% H; up to 3–4 lines | `KineticCaption`: word-synced, persists across shots |
| Keywords as bold upright caps, often larger, in an accent colour (red on light scenes, coral on dark) | "FLOOD", "VIOLENCE", "SAVED", "BROTHERS", "CHOSE" | Same size to about 1.35×; one to three per line | Emphasis styles inside `KineticCaption` (marked in `episode.json`) |
| A header strip: logo mark, series name on the left, topic on the right, in small spaced caps | Every frame | Size ≈ 1.6% W; top 5% H | The `SeriesHeader` component (our own design, not theirs) |
| Scripture card: a cream rounded panel with a red rule on the left, a centred italic quote with bold caps keywords, and the reference in small spaced caps underneath; the scene dims behind it | ref1 28–30, 41–46, 80–83; ref2 38–41, 53–56, 88–90 | Panel 90% W; text ≈ 4.3% W; held 3–5 s | `ScriptureCard` |
| Hero number: a high-contrast serif in gold with a spaced-caps label, counting up to its value | ref1 2–5 (154 → 969), 91–98 | Numerals ≈ 30% W tall; the count takes about 2 s | `HeroNumber` with a count-up |
| Chips: a dark pill at the bottom with a small-caps label (and a red numeral for numbered sections) | ref1 9–15, 38–40; ref2 9–12, 46–113 | Pill ≈ 35–45% W wide, about 2.5% H tall | `Chip`, `SectionChip` |
| Section opener: a big red numeral and a spaced-caps title on a translucent panel, which hands over to a chip | ref2 45–46, 64–65, 83–84 | Numeral ≈ 12% W; about 0.8 s, then it becomes the chip | `SectionOpener` → `SectionChip` |

## 3. Transitions

| Technique | Where | Measured | Becomes |
|---|---|---|---|
| A hard cut on a word, while the typed line continues over it | 49 cuts in total | Most shots run 1.5–6 s | Default cut; the caption layer sits above the shots |
| Light sweep: a vertical bar of light crosses the frame, then the cut | ref1 72.97–73.5 | 0.4–0.5 s, left to right | The `LightSweep` transition |
| Light flood: the scene fills with light to near white, then cuts to a dark scene | ref1 84.1–84.47 | About 0.35 s to white, a hard cut out | The `LightFlood` transition (for moments where God acts) |
| Cream wash: the scene fades to a cream veil while a section opener appears, then a new scene underneath | ref2 45.9–46.3 | About 0.4 s | The `WashCut` transition |
| A match on an object: the same object (pit, cell, path) returns in a later scene to carry the idea | ref2 2 → 116; ref2 23 → 100; ref2 64 → 75 | The opening image comes back as the last frame (a loop) | `MatchCut` on a shared shape, and a loop-back ending |

## 4. Composition (9:16)

- **Three bands:**
  - the top 20% is type (header plus narration);
  - the middle 55% is the image;
  - the bottom 25% holds a chip or number, or stays empty.

  Nothing important sits under the narration (every frame).
- **One subject.** Either one figure group or one object, centred or on a third. A wide establishing shot has the figures at about 15–25% H; a medium shot of a group, about 45% H (ref2 15.5, 35.5).
- **Elevated isometric three-quarter view** for places (ref1 25–30, ref2 9–12, 27–30, 64–70). A straight-on view for concept stages.
- **Repeated framings.** The same framing returns, with only what is in it changing (ref2 75 → 79 → 82: the forked path, with the brothers inserted at 78).

## 5. Visual metaphors (one object, one idea, on the concept stage or in a scene)

| Object | Idea | Where |
|---|---|---|
| Hourglass that empties | The longest life; a new limit | ref1 21–23, 61–67 |
| Countdown number beside an ark | 120 years until the flood | ref1 63–67 |
| Candle that burns shorter | Shortened days | ref1 85–86 |
| Heart with dark roots or cracks | Evil grows | ref1 71–73 |
| Open book with rays | "The answer starts in Genesis" | ref1 31–37 |
| A path of light walked toward | A life that never ends | ref1 68–70, 87–90 |
| A forked path seen from above | Free will | ref2 65–82 |
| Furrowed field, sprouts, then a harvest | Choices reap results | ref2 84–99 |
| Warning sign over a pit | A warning ignored | ref2 91–92 |
| A figure in a cell, then on a red carpet | From the prison to Pharaoh's court | ref2 23–30 |

## 6. Character motion

- **Few moving parts.** Most figures hold a pose for the whole shot. Meaning comes from the pose and from the camera or light moving, not from constant animation (ref1 41–47, ref2 31–37). *Inference:* holding still lets the type be read.
- **Actions are staged side-on.** Bowing, pushing, pointing, throwing and walking are drawn in profile or three-quarter view (ref2 15.5, 35.5, 49, 73), never facing the viewer. This is the specific thing our front-facing cards could not do (raise proof, Nov 2).
- **Walk cycles** are simple: legs scissor and the body barely bobs. Figures walk along a path toward or across the frame (ref1 68–70, 87–90).
- **One gesture per beat:** a point, a reach or a bow, each held long enough to read (about 1 s or more).

## What this means for the system (feeds Phase 2–3)

1. **Typography first.** Build these first: `KineticCaption`, emphasis styles, `ScriptureCard`, `HeroNumber`, `Chip`, `SectionOpener`. They are on screen 100% of the time.
2. **Characters.** Outlined flat figures with profile and three-quarter views, separate limbs and few moving parts. Front-only cards are out.
3. **Concept stage plus metaphor objects.** One component with a library of objects. In both reels, about every third image is a metaphor or a diagram.
4. **Diagram kit.** A bar timeline, bars with figures standing on them, a split comparison, a countdown.
5. **Environments.** Simple shapes, one-side light, contact shadows and blurred foreground framing. Whether these are painted 2D plates or kept as simple 3D is decided by the illustration test, not assumed.
6. **Our own identity, not theirs.** Our own header, card and chip designs, palette and fonts. No copied layouts, logo, wordmark or characters.
