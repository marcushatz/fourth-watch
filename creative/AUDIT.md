# Audit: visual storytelling in the Fourth Watch pipeline (Nov 1)

**Scope:**
- **The six system files Marcus named:** `system/02, 05, 06c, 07, 09, 12`.
- **The engine:** `ep01-samson/film27`, read from the code.
- **The Creative Director prototype:** `creative/`.

**References used:**
- the earlier study of `JohnHeibel/PDoomVideo` and `ClaudeAnimationBase` (not reread);
- `getkeyframes.com`: its public pages only. The pack itself is paid, so its internals weren't seen.

## What already exists (keep it)

| Area | Where | Strength |
|---|---|---|
| Script craft | `02` | The viewer's deal, the beat sheet, the drag list, line craft, the accuracy rules, hooks, endings, a pre-flight list |
| Shot-list procedure | `05` | Word-timed cuts (`cue()`), clause → beat, the direction fields, the device menu, a 15-item checklist |
| Beat recipes | `06c` | 18 recipes for recurring beats (hook, quote, verse card, turn, prayer, death, re-ask...), each with traps |
| Acting without faces | `07` | The pose table, timing (anticipation, overshoot, holds, stagger), the beat menu, light as acting, the motion draft |
| QA loop | `09` | `fw_check video`, the review pack, the critic (3 worst problems), fix-and-re-render, the beat clock |
| Engine | `12` + code | Frames are a pure function of t; 8 sets; the PP2 rig (13 Samson poses); devices (verse + marks, pill, counter, tally, stamp, bubble, rays); an analytic collapse in `dagon.js` |
| Creative prototype | `creative/` | A content-hashed context pack, the treatments → concept → YAML spec, `spec_check` (reads, canon, reuse, budget), compile to a score copy, the budget ledger; demoed on Judges 16:20 |

## What's missing

1. **No stage for directing the story.** 02 ends at an approved script, and 05 starts with "one sentence → one picture". That is the default Marcus has ruled out ("one illustration per sentence"). No stage asks:
   - where the mystery is;
   - what the viewer already knows;
   - what should surprise them;
   - what they should feel when;
   - what image pays the opening off.
2. **No visual concept or treatments** before shots. Motifs live in prose (06's rhymes) and in one prototype register (`creative/motifs.yaml`).
3. **No comprehension timing.** The beat clock (05, 07, 09) measures how *often* something changes, not whether the viewer had time to *find and understand* it. The reads model exists only in the prototype.
4. **No muted test.** Nothing checks that the pictures tell the story with the sound off.
5. **The plan can't drive the engine.**
   - `size`, `angle`, `cam`, `act` and `change` are read only by the linter; the renderer ignores them (05 §3).
   - Camera, poses and light are hand-written inside each scene's `SH.<v>` function, so every shot re-invents its camera code, and nothing verifies the render against the plan.
   - This is why plans drift back to "a figure standing while the voice talks".
6. **No reusable directing primitives.** Each case is coded by hand:
   - anticipation and overshoot (sorek's traps);
   - impact shake (inline in dagon);
   - camera moves (per-scene `setCam` copies).
   The transitions 06 §5 asks for (match cut, crossfade, morph, whoosh-in, panel strip, diagram) have been "to build" since Oct 31.
7. **Techniques aren't indexed by purpose.** 06c is indexed by beat type ("a prayer"), not by job ("show scale", "show that nothing happened", "pay off the opening"). Techniques are scattered across 06, 06b, 06c and 07, and no recipe says where its code lives.
8. **Picture accuracy against the canon isn't machine-checked.** Example found today:
   - `dagon.js` (v57, shot S19) turns God's gold light on at "pushed" ("God still answered").
   - 07 §6 says the gold is never on at the pillars, because Judges 16:28-30 never says God answered.
   - No check caught it.
9. **There is no record of what worked,** such as approved scene specs or proven recipes with their cost. Every episode starts from prose.

## What's duplicated

| Topic | Repeated in | Effect |
|---|---|---|
| Gold/ember light rules | `00` canon, `06b`, `06c` §2 and §12, `07` §6, `12` §5, the showrunner skill | Six copies; the code still drifted (point 8) |
| Shot checklists | `05` §5 (15 items), `07` §7, `09` §2, the showrunner camera rubric | Overlapping yes/no lists, none tied to a tool |
| The motion draft | `05` step 10, `07` §7, `09` §1 | The same steps in three places, slightly different |
| The beat clock | `05`, `07`, `09`, `fw_check`, `beatclock.py` | Fine as a tool; the prose copies drift |
| Creative director vs shot list | `creative/PROPOSAL.md` vs `05` | Two entry points to the same job |

## What changes (no rewrite)

- **`system/13_story_director.md`** becomes the one permanent spec for stages A-G, between an approved script and `05`. It points to the rules rather than restating them.
- **`05` becomes the compile-and-lint step:** the director's spec compiles into the score; the manual shot list stays as a fallback.
- **`creative/library/`** indexes techniques by purpose. Each card is a few lines plus a pointer to its code and an example, and it's loaded one card at a time.
- **`fw/direct.js`** holds reusable directing primitives that scenes call (shot-driven camera marks, acting envelopes, impact). It's additive: existing shots don't change.
- **`spec_check`** also fails gold light on any beat the canon rules out for a passage (a `no_gold` list per episode). That's the machine check missing in point 8.
- **`09`** gains the muted test and "three worst problems, revise only those scenes" as written steps. They already exist informally in the critic.
