# Creative Director mode: proposal (v1, Nov 1)

Status: **proposal, revised after the demo** (see `ep01-samson/creative/demo_16-20/COMPARISON.md`). Nothing in the engine changes. The demo in `ep01-samson/creative/demo_16-20/` uses prototypes in `creative/_proto/`; they move to their final paths only after Marcus approves.

## What we're borrowing, and what we aren't

From `JohnHeibel/PDoomVideo` and `JohnHeibel/ClaudeAnimationBase`:
- **One written vision before any code** (STORYBOARD.md). Each film opens with three things:
  - the idea: the concept and its twist;
  - what ties it together: sets instead of cards, motivated transitions, a palette arc, emotion morphs, camera rules;
  - a shot table per chapter: time, line, shot, and the transition out.
- **The reads.** For every moment: what the viewer must find and understand, and how long that takes. Rule 4, "model the viewer", is the step generated animation gets wrong most often, and our shot lists don't have it.
- **A brief for parallel builders** (ANIMATION_GUIDE.md). Opus wrote one guide, and every builder agent owned one chapter file. Builders never edit shared files; they report bugs instead. Every frame is a pure function of t.
- **A review loop at three zoom levels:** sheet, strip and crop, before any full render.

Not borrowed:
- **Their medium** (p5.brush watercolour, landscape, karaoke, a mascot with 31 emotions). Our engine, rig, 9:16 format and canon stay.
- **"No text"**: our verse cards and pills are part of the format.
- **Unlimited reasoning on every shot:** that's what this proposal budgets.

## What our pipeline lacks today (audit, Nov 1)

- **No treatments step.** Alternatives are only hand-written variants (K and X in the shot list, `prompts/F`, `DECISIONS.md`).
- **No motif register.** Motifs live in prose (06 §2) and in two linter flags (`callback`, `arrival`).
- **No emotional progression field.** There's only the prose colour script (06b §4) and `sorek.js` `mood()`.
- **No read timing.** `shotlist_check.js` measures beats and length, not whether the viewer has time to understand.
- **No cache of decisions or renders.** Part renders skip a file if it exists, but nothing is content-hashed. Stills and frames aren't cached.
- **No budget for tokens, generation or revisions,** and no routing to cheaper models: `prompts/A–G` just say "fresh agent".

## The layer

```
approved script (locked hash)
   │
P0 context pack ──────────── script + word timings for the window, canon digest, engine manifest, motif register,
   │  (script, no model)     read-timing model, accuracy notes. ~2k tokens. Content-hashed: unchanged sources = cache hit.
P1 treatments ────────────── 3 treatments that differ on ≥3 of 5 axes, plus a recommendation      [high-reasoning, 1 call]
   │  GATE: Marcus picks a treatment
P2 concept ───────────────── motifs (first → develops → payoff), emotion keys, transition grammar  [same call or 1 more]
P3 scene spec ────────────── compact YAML per scene: reads, actions, composition, camera, light, text, audio sync,
   │                         motifs, transition out, reuse map, new primitives, verses            [high-reasoning]
P4 validation ────────────── spec_check.py (mechanical), then the AI fact-checker on the picture claims only
   │  (script + cheap model)
P5 compile ───────────────── spec → score.js SHOTS (existing fields) → shotlist_check.js           [script]
   │  GATE: Marcus approves the shot list (Round 15, unchanged)
P6 build ─────────────────── one builder agent per scene file, existing scenes and rig first       [mid-tier model]
P7 review ────────────────── sheet / strip / crop per scene against its reads                      [mid-tier; escalate once]
   │  GATE: motion draft, then the full render and fw_check video (unchanged)
cache ─────────────────────── every phase output is keyed by the hash of its inputs. Unchanged → reused, never regenerated.
```

### Model routing (Agent `model` + `effort`)

| Work | Model | Why |
|---|---|---|
| Treatments, concept, scene spec, creative escalations | `opus`, effort `high` (`fable` only if Marcus asks) | Creative decisions are the expensive, high-leverage part. One call, reading only the ~2k-token pack. |
| Building a scene from a validated spec, writing a primitive | `sonnet` | Routine engine coding against a fixed spec and brief |
| Reviewing sheets and strips against the reads | `sonnet` with vision | Checklist work; it escalates to `opus` once if a scene fails twice |
| Schema, timing, brand, reuse and budget checks; compiling; caching | scripts (no model) | Mechanical: never pay a model for it |
| Picture fact-check | the existing `prompts/A`, `sonnet`, changed claims only, on EVERY spec pass | In the demo it failed the director's pass 1 (4 corrections) and the current v57/v60 rows; it is the gate that mattered |
| Revisions (spec pass 2, re-checks) | resume the SAME agent (SendMessage), never a new one | Measured: a resume cost 7.8k and 10.8k tokens; a new agent ~88k |

### The cache (never regenerate unchanged work)

- **Keys:** `sha256(inputs)` per phase:
  - **pack:** its source files plus the window;
  - **treatments:** the pack key;
  - **concept:** the treatment key plus the pick;
  - **scene spec:** the concept key plus the scene's VO words;
  - **render:** the scene spec key plus the engine fingerprint plus the primitive versions.
- **Store:** `<ep>/creative/cache/index.json` maps a key to its artifact paths (spec YAML, compiled shot, stills, strip, draft clip) and the validation result.
- **Rules:**
  - A script edit that touches one line invalidates only the scenes whose VO words changed.
  - An engine change invalidates renders, not decisions.
  - A new digest version invalidates only the packs built from it.
- **The research library is never reread.** `research/` and `system/` are compiled once into three digests (`creative/digests/`, ~1.1k tokens together). `pack.py` hashes the digests' source files, so the digests are only recompiled when a source changes.

### The budget (configurable, enforced before every call)

`<ep>/creative/budget.yaml` (defaults in `creative/budget.default.yaml`):

```yaml
tokens:   {opus: 300000, sonnet: 1200000, haiku: 200000} # per episode, from the agents' reported usage (recalibrated, see below)
external_usd: 0                                        # paid image/video generation is off unless Marcus raises it
revisions: {treatment_rounds: 1, spec_passes_per_scene: 2, build_passes_per_scene: 3, opus_escalations: 2}
new_primitives_per_sequence: 2
```

- **Measured in the demo:** every NEW agent starts with ~74.5k tokens of fixed context (the harness's prompt and tool list), whatever its job. The creative work itself was ~8k in and ~8k out. The first default (opus 60k per episode) couldn't afford one call. The 8-second demo cost 197k in all: 2 new agents (149k of it start-up) and 2 resumes (18.5k). So: one director agent and one fact-check agent per episode, revisions by resume, mechanical work in scripts. A whole episode is estimated at 350 to 450k tokens; that's an estimate until one is run.
- **`budget.py check <phase>`** reads `ledger.jsonl` (one line per call: phase, model, tokens, usd, keys). It refuses a call that would exceed a cap and tells Marcus what's left and the options.
- **External generation** (image/video references, `refs/`) is optional and never required. With `external_usd: 0` it's simply off. A spec can still name a reference image Marcus supplies.

### Primitives (new techniques become reusable)

- **Where they go:** a new technique that a spec requests is built once as a primitive, in `film27/fw/primitives/<name>.js`. That folder is new; adding to it doesn't touch existing engine files. Each primitive gets:
  - a one-line API;
  - a `LOOPS`-style test still;
  - an entry in `creative/primitives/registry.yaml` (name, file, API, cost per frame, episodes used in).
- **Promotion:** a primitive is promoted to the engine manifest after its second use, or when Marcus calls it out. Until then it's scene-local (the PDoom rule: builders write private helpers and report gaps).
- **Cap:** the spec checker counts new primitives against the budget.

### Gates kept

- **Script:** the approved script is hashed. The spec checker fails any scene whose words aren't the window's narrated words, and fails bubble or verse text that isn't approved wording.
- **Accuracy:**
  - Gold light is checked against the text.
  - Doors, scales and facial acting fail the checker.
  - Every scene carries verse refs.
  - Picture claims go to the AI fact-checker.
- **Brand:** the canon digest is in every pack.
- **Production gates:** unchanged. Marcus still picks a treatment (new), approves the shot list, and watches the motion draft. Then come `fw_check video`, the critic, and the release manifest.

## Exact file changes (after approval)

**New:**

| File | What |
|---|---|
| `system/13_creative_director.md` | The guide: phases, gates, routing, cache, budget. Moved from this proposal |
| `creative/digests/canon.md`, `engine_manifest.md`, `reads_model.md` | The compiled digests. `engine_manifest.md` is regenerated by `tools/creative/manifest.py` |
| `creative/motifs.yaml` | The motif register across episodes |
| `creative/primitives/registry.yaml` | Reusable primitives and their APIs |
| `creative/budget.default.yaml` | The default caps |
| `prompts/H_creative_director.md` | The high-reasoning brief (from `_proto/`) |
| `prompts/I_scene_builder.md` | The builder brief: engine API, rules (pure function of t, own file only, report shared bugs), how to add a primitive |
| `prompts/J_scene_reviewer.md` | The sheet/strip/crop review against the spec's reads |
| `tools/creative/pack.py` | P0 (from `_proto/`). It also lists the shot before the window (from the score) and every approved VERSE card in the window (from `episode.md`); the demo showed the director drops a card it isn't told about |
| `tools/creative/spec_check.py` | P4 (from `_proto/`; the manifest lists come from `manifest.py`) |
| `tools/creative/compile_spec.py` | P5: spec → `score.js` `add()` calls with the existing fields, written to a COPY of the score so `shotlist_check.js` lints every seam. A scene with `extends: <shot>` merges into that shot instead of cutting. Camera, poses and light are code in each scene's `SH.<v>` today, so each compiled shot carries a BUILD note for the builder. Letting scenes read `shot.cam`/`shot.pose` would be an engine change, to be proposed separately |
| `tools/creative/cache.py` | Keys, index, hit/miss, invalidation |
| `tools/creative/budget.py` | Ledger and caps |
| `tools/creative/manifest.py` | Builds `engine_manifest.md` from `scenes/_API.md`, `PP2_API.md` and the `SH` tables |
| `.claude/agents/fw-creative-director.md`, `fw-picture-checker.md`, `fw-scene-builder.md`, `fw-scene-reviewer.md` | Project agent types with only the tools each role needs (director and checker: none or Read; builder: Read/Edit/Write/Bash; reviewer: Read). This should cut the ~74.5k start-up; it needs a new session to measure |
| `tests/checkers/fixtures/creative/*` + entries in `expected.json` | Specs with planted faults: a read too short, overlapping reads, gold after 16:19, a door, a changed narrated word, a missing seam, over budget. Written before the checker (Round 17) |
| `<ep>/creative/` | `pack.md`, `treatments.md`, `concept.md`, `spec.yaml`, `cache/`, `ledger.jsonl`, `budget.yaml`, `refs/` |

**Modified (docs and tools only):**
- **`README.md`:** a pipeline row 3b, "Creative direction".
- **`system/05_shot_list.md`:** the shot list is compiled from the spec; the manual path stays as a fallback.
- **`templates/episode_runsheet.md`:** the treatment gate and a budget line.
- **`tools/check_env.py`:** pins for the new tools.
- **The showrunner skill:** the step and the routing.

**Not changed:** `film27/engine/*`, `film.js`, `lintel/*`, the existing scenes, `song.js`, `fw_check.py` and `shotlist_check.js`.

## Demo result (Judges 16:20, 8 s; details in `ep01-samson/creative/demo_16-20/COMPARISON.md`)
- **Treatments.** Three treatments (AI director, Opus); T2 "The empty corner" recommended. The spec passed every gate after one revision: the fact-check verified it, the spec check found 0 findings, and the linter found 0 warnings in the window.
- **The picture fact-check** (AI, Sonnet) failed the director's first pass. It staged a failed attempt to break free and the LORD leaving "on the word". It also failed the current v57 cut and the v60 draft for the same seconds.
- **What changed in the system:**
  - three checker/pack gaps found and fixed, tests first (6/6);
  - the brief and the canon digest learned the picture-accuracy rules;
  - budget caps recalibrated from measured costs.
- **No engine change and no new primitive** were needed. No frames of the new version are rendered yet: that needs Marcus's treatment pick and shot-list approval, and then an edit to `scenes/sorek.js`.
