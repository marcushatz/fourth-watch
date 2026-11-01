# Engine roadmap: from "make a video about X" to a great reel (started Nov 1)

**Marcus's goal (Nov 1, 10:36):** he asks "create a video for this topic" (e.g. "why is Esau hated more than Jacob") and gets a great script, cinematography and visuals.

**His diagnosis:**
- Our 3D renders already look better than Lintel's.
- Lintel beats us on scripting, camera movement and what is shown on screen: a bird's-eye view of the story, and changes of pace and setting that keep the viewer engaged.

**Samson is paused.**

## What Lintel does that our engine can't do yet for a NEW topic

Measured in `research/direction_rules.md` and `research/lintel_study_10.md`:

| Lintel does | Our engine today | Gap |
|---|---|---|
| High-angle isometric wide on a small diorama: 60-70% of shots (§7.3) | 8 bespoke Samson sets, each 300-800 lines of hand code | **A new topic needs new sets, and building one costs days.** No data-driven set kit |
| Walking, entrances and exits: about half of all action shots (§4.6) | Only Samson and the boy can walk; crowds can't | **Generic people can't walk, enter or exit** |
| Change framing, light, time of day or subject on one set (§4.2); the subject swap | Possible, but hand-coded per shot | No shot-level staging from the score |
| Idea → a physical object something happens to (dice, puppets, a lamp passed on) (§5) | Props: rock, olive, bush, tent, banner, crate, fire | **No metaphor-prop library** |
| Logic as a diagram that builds: timeline, two groups, a list, a family tree (§5.2) | `tally`, `counter`, `stamp`, `pill`; Samson-only cards | **No timeline / family tree / two-groups / map-route card** |
| Transitions that carry motion: whoosh, graphic morph, crossfade, match-dissolve (§7.4) | `dip` and `flashIn` only | **No crossfade, whoosh or match-dissolve** |
| Camera moves with a job: hook pull-out, travel, follow a walker, push into a revelation (§7.2) | Hand-written per shot; `fw/direct.js` (Nov 1) in one set | No camera presets any set can use from the score |

## The plan, in order (each step ends with stills or a clip Marcus can judge)

1. **A data-driven diorama set** (`scenes/diorama.js`). It builds a set from a recipe (sky, ground, props, people) and stages each shot from the score's `dio` field, with no per-shot code:
   - camera presets (`iso`, `isoClose`, `eye`, `top`) with jobbed moves (push, pull, orbit, crane, follow);
   - actor actions on beats: walk to, enter, exit, pose, look.
2. **Generic people walk:** PP2 `person` gets a `walk` pose. Enter and exit come from step 1.
3. **Transitions in `film.js`:** a 0.2-0.3 s crossfade, a whoosh, a match-dissolve, all chosen by a shot field.
4. **Explainer cards:** timeline, family tree, two groups, a numbered list that builds, a map with a route. All are driven by beats.
5. **A pop-up layer** (Marcus, Nov 1): word-timed overlays that keep the screen alive: a label, an icon, an arrow, a highlight ring, a number, a small map pin, each popping on its word with overshoot. A governor enforces one at a time, a minimum spacing of ~1.5 s, never over a face or the caption band, and a density cap per 10 s, so it never feels overdone.
6. **A metaphor-prop library:** objects that ideas become (birthright = a scroll or a crown; a bowl of stew; a blessing as light on a head only where the text says it), each with simple state changes (pass, break, fade).
7. **Proof on a new topic, end to end:** Esau and Jacob. Story Director → shots in the diorama kit → stills → the muted test → one render. Judge against a Lintel reel.
8. **Speed:** a GPU render path (Marcus's computer) or lighter draft shading.

**Rules carried over:**
- Every frame is a pure function of t.
- Existing Ep 1 shots stay pixel-identical (check stills before and after).
- Additive files; backups before edits.
- Tests or stills for every step.

## Status

| Step | State |
|---|---|
| 1 Diorama kit | v0 works (`scenes/diorama.js`; lab: `engine_lab/`). A set from a recipe; shots staged from `dio` (camera presets + moves, walk/enter/exit/pose, continuity across shots) |
| 2 People walk | done (PP2 `person` `walk`) |
| 5 Pop-up layer | v0 works (`fw/pops.js`, hooked in `film.js`): label, number, ring, arrow, icons (bow, tent, bowl, scroll, crown, x, check, ?). The governor enforces one at a time, ≥ 1.4 s apart, ≤ 5 per 10 s, the y band 30-78%, and keeps each pop inside the frame |
| 3, 4, 6-8 | not started |
