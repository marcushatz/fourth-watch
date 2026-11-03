> **Archived Nov 3, 2026.** The current goal and plan are in `production/README.md`. This kit is a source of parts, not the path forward.

# Engine roadmap: ONE prompt → a post-ready reel (Marcus, Nov 1 10:57)

**The goal:** Marcus types one prompt ("make a video about why Esau is hated more than Jacob") and gets back a finished reel ready to post. The pieces below exist only to serve that.

## The pipeline the prompt runs (status Nov 1)

| # | Stage | What it does | Status |
|---|---|---|---|
| 1 | Research | Web + ESV: what people get wrong, what they don't know, the dots to connect; verified notes | Done by hand per episode (Ep 3 v6-v9); not yet one automatic step |
| 2 | Script | The answer first, the viewer's next questions answered, value, a line people repeat; the checker, the fact-check, a test viewer | Works (Ep 3 v9: value 4/5, clarity 4/5); not yet one automatic step |
| 3 | Direction | Story Director: treatments, storyboard, timed reads, pops | Spec + tools exist (`system/13`); used on one sequence |
| 4 | Build | The storyboard → score → sets/cast/props/cards/pops from DATA, not code | Diorama kit, cast kit, walking, pops: v0. Missing: explainer cards, transitions, metaphor props, a storyboard→score compiler for the diorama |
| 5 | Voice | The narration audio + word timings | **Blocked on a decision:** ElevenLabs (Marcus's account, paid) or a free offline voice |
| 6 | Music + sound | The bed and the hits on the beats | `song.js` is Samson-specific; needs a generic version |
| 7 | Render | The full reel | Works; ~1.5-2 h per 100 s on diorama sets, ~6 h on heavy sets (this machine) |
| 8 | QA | `fw_check video`, the muted test, top-3 fixes | Works |
| 9 | Deliver | The MP4, caption, captions file, cover | Partly (captions, mux); the cover/caption step isn't automatic yet |
| 10 | One command | A single skill that runs 1-9 from a topic | Not built |

**Next:** the first full run on "Why is Esau hated more than Jacob?", end to end, building each missing piece as the run needs it, then wrapping the run as the one command.

---

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
| 3 Transitions | v0 works (`fw/trans.js`, Nov 1): `shot.xin = { kind: 'fade' | 'whip' | 'push', dir, dur }`. The outgoing shot keeps moving under it; the whip is motion-blurred; the header, title and captions stay fixed on top. Lab: `engine_lab/trans_lab.jpg`, `trans_whip.jpg` |
| 4 Explainer cards | v0 works (`fw/explain.js`, Nov 1): `shot.explain = [{ kind: 'tree' | 'timeline' | 'versus' }]`, built on beats, with gold/dim marks, a backing band, kept inside the frame. Lab: `engine_lab/explain_lab.jpg`. Still to add: a map with a route, a numbered list |
| Known gap | The diorama's `top` preset lays the 2D people flat; use `top` only for sets without people in frame, or cards over it |
| 6-8 | not started |
