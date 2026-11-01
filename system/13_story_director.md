# 13 · The Story Director: from an approved script to a plan the engine can build

**Use this when** a script is approved (02/03 done, Marcus's OK) and before any shot list.

**Where it sits:** it replaces 05 §2's "one sentence → one picture" default. 05 becomes the step that compiles and lints the director's plan. It doesn't restate the rules; it points to them.

**Why it exists:**
- Marcus's brief of Nov 1: "think visually, not simply animate instructions".
- The audit (`creative/AUDIT.md`): no stage asked what the story needs before shots were drawn, and the plans couldn't drive the engine.

**Proof of concept:** `ep01-samson/creative/sd_pillars/`: the pillars, Judges 16:28-30, built and rendered.

---

## 0. What to load (and nothing else)

| Stage | Load | Don't load |
|---|---|---|
| All | This file; `creative/library/INDEX.md`; the episode's `pack.md` (built by `tools/creative/pack.py`: the narration and word times for the window, the canon digest, the engine manifest, the reads model, the motifs, accuracy notes) | `research/` (the digests already carry what matters), other episodes, the full system folder |
| B-D | The 1-3 recipe cards the INDEX points to for this window's jobs | All other cards |
| F | `system/12_engine_guide.md` §5; the scene file being changed; `fw/direct.js` header | Other scenes |
| QA | `09` §2; the storyboard's reads table | The scripts and research |

Cache rule: `pack.py` content-hashes its sources. An unchanged pack is a HIT and isn't rebuilt. A scene spec whose key (`spec_check` prints it) is unchanged since its last pass isn't re-reviewed, rebuilt or re-rendered.

## 1. The stages (A-G), their outputs and who does them

| Stage | Output (in `ep*/creative/<window>/`) | Who | Gate |
|---|---|---|---|
| **A. Narrative analysis** | The table in §2, at most 15 lines | High-reasoning (the main session, or one director agent per episode) | none |
| **B. Three treatments** | Three treatments differing on ≥ 3 of 5 axes (image, space, camera grammar, light, transitions) + a risk line each + a pick | Same | **Marcus picks** |
| **C. The concept** | Motifs (first → develops → payoff), emotion keys, the transition grammar | Same | none |
| **D. The storyboard** | One row per shot: words, picture (size, angle, move), the action on its word, the reads (§3) | Same | none |
| **E. Timing** | Reads with start-end times from the word times; the beat clock | Same, then checked by `tools/creative/spec_check.py` | 0 FAIL |
| **F. Implementation spec** | Per shot: set + variant, named camera marks + path, poses + acting envelopes, light, devices; the reuse/new table | Same | Picture fact-check (one agent, changed claims only) |
| **G. Asset and animation plan** | What's reused, what's new, what it can be reused for; new primitives ≤ 2 per sequence | Same | none |
| Compile | A score copy with the window's shots replaced (`tools/creative/compile_spec.py`), then `tools/shotlist_check.js` | Script | 0 FAIL; **Marcus sees the shot list** (Round 15) |
| Build | Scene variants + primitives | A builder (mid-tier model) or the main session | Stills pass §4 |
| Verify | §4 | A reviewer that hasn't seen the code (vision) + scripts | Top 3 problems fixed |

**Model routing:**
- Creative decisions (A-G) go to the highest-reasoning model available: in practice this session, so no new agent's ~75k start-up is paid.
- The fact-check and the muted viewer are separate agents, because independence matters.
- Mechanical work (packing, checks, compiling, linting, ledgers) is scripts.
- Revisions resume the same agent; they never spawn a new one.

## 2. Narrative analysis (A): answer these before any shot

1. What makes this window interesting?
2. What's the central mystery, tension or revelation?
3. What does the viewer already know?
4. What would surprise them? (It must come from the text.)
5. What must the viewer understand at each moment?
6. What should they feel, moment by moment?
7. What makes them want the next sentence?
8. Which 2-3 moments deserve emphasis? (Usually the verb, the impact, the stillness after.)
9. What image pays off the opening?
10. **Accuracy fences:** what the text shows (cite it), what it doesn't say (and therefore no picture may claim), the gold/ember rules for this passage, no gore.

Keep the four kinds of material apart in the plan:
- **recorded** events (the text);
- **historical context** (sourced, labelled);
- **interpretation** (attributed);
- **visual symbolism** (allowed, but it must not assert a fact the text doesn't give).

## 3. Visual invention and viewer reads (B-E)

**Don't default to:**
- a figure standing while the voice talks;
- a generic zoom;
- text over a background;
- the same layout twice;
- one illustration per sentence.

**Reach first for:**
- action and consequence;
- a change of scale;
- cause → effect shown;
- a metaphor that's an object;
- a transformation of the place;
- a decision, then a reaction;
- a spatial reveal;
- contrast (the same frame before and after);
- motifs and rhymes;
- match cuts;
- motion graphics, maps and diagrams;
- callbacks.

The INDEX lists these by purpose, each with its code.

**For every shot, the storyboard row answers:**
1. Where the eye lands first, and how it gets there (look, motion, light, camera).
2. What the viewer must recognise.
3. What happens next (anticipation → action → reaction → payoff).
4. What the event means.
5. How long that takes. The reads model sets the minimums:
   - place 0.8 s (0.5 s on the same set);
   - a new entity 0.5 s (0.3 s when the eye is led there);
   - an action's meaning 0.5 s after it lands;
   - unspoken text 0.35 s + 0.25 s per word;
   - a meaningful light change 0.8 s;
   - the payoff ≥ 1.2 s.
6. How the next shot follows from it (the cut's motivation).

**Rules:**
- One important read at a time.
- Fast actions, slow meanings.
- The verb's key frame sits on its word, with anticipation 0.2-0.4 s before (`DIRECT.act`).
- Never make the viewer pause to understand the main action.

## 4. Verification before any full render (Marcus: passing the checks is not the same as being captivating)

1. **Stills at every read's start** (`node engine/render.js stills ...`) → a contact sheet. Look for:
   - Does each read's subject sit where the eye lands?
   - Is it inside 22-60% of the height and clear of the caption band?
2. **The muted test:** a fresh agent with vision gets only the contact sheet (no words) and writes what happens. If its account misses a read, that shot fails.
3. **The motion clip** of the window (`clip A B`): watch it as video. Stills can't judge motion.
4. **The three most serious visual problems,** named concretely ("the push doesn't read: arms barely move").
5. **Revise only the failing shots.** Passing shots keep their cache keys and aren't re-rendered.
6. **Then** the full-render gates in 09 (`fw_check video`, the critic, ≥ 3 rounds).

## 5. Making plans drive the engine (F)

- **Named camera marks:** a set publishes them (`MARKS = { hands: { p, l, f, sh }, hallWide: ... }`). A shot's camera is a path through marks: `DIRECT.path(t, [{ t, ...DIRECT.mark(MARKS, 'pillarLo') }, { t: t + 1.2, ...DIRECT.mark(MARKS, 'pillarUp'), ease: 'inOut' }])`. The director writes the mark names and the move; the builder places the marks once per set.
- **Acting envelopes:** a verb lands on its word with `DIRECT.act(t, beat, { pre, dip, rise, over, settle })`, which drives a pose's `k` and any displacement. Effort uses `DIRECT.tremor`; impacts use `DIRECT.shake` (≤ 12 px, only on impacts).
- **Shot variants beside the old ones** (`sdA`-`sdE` beside `fall`): existing shots don't change, and the variant's name is the contract between the score and the scene.
- **Score fields:** each compiled shot carries `size`, `angle`, `cam`, `act` and `change` (for the linter), plus `beats` (for the scene and the song).

## 6. Cost (per episode, measured on Nov 1 in the 16:20 and pillars demos; estimates are marked)

| Item | Tokens | Render |
|---|---|---|
| Pack + checks + compile + lint | 0 (scripts) | none |
| A-G for a full episode, in the main session | Estimate: about 40-70k output + reading the pack (~2-6k) per window | none |
| Picture fact-check: one agent, then resumes | ~88k for the first run (≈ 75k of it start-up), then ~8-11k per resume | none |
| Muted viewer (vision): one agent, then resumes | ~80k first, then ~10k per resume | none |
| Builder per sequence (when not done in the main session) | Estimate: 100-200k (start-up + reading the scene file + code) | none |
| Stills | none | ~6-12 s each on the dagon set; 10-12 per sequence per pass |
| A motion clip of a 12 s window | none | Measured in the pillars demo (`sd_pillars/RESULT.md`) |
| **A whole episode (about 10 windows)** | **Estimate: 350-600k**, mostly the creative work and the two independent checks | Full render: ~6 h at full resolution (12 §9) |

The ledger (`tools/creative/budget.py`) records every model call. `budget.yaml` caps them, and the check refuses a call over its cap.

## 7. What this file does NOT change

- The accuracy rules (02 §5, the canon) and the fact-check.
- Marcus's gates: the script, the treatment pick, the shot list and the motion draft.
- The 09 QA loop.
