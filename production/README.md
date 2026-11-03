# Fourth Watch production system

**What this is:** the reusable system for making every Fourth Watch episode with art direction first and Higgsfield under tight control. It was set up on Nov 2, 2026 after the Bronze Serpent test.

**Scope:** Fourth Watch only. Other kinds of video use `presets/`.

**Single entry point:** start every Fourth Watch job here. Where an older guide disagrees with this folder, this folder wins. `research/feedback_rules.md` wins over everything.

**The goal (Marcus, Nov 3):** one idea becomes one exceptional video through one reusable skill. The benchmark is whether the film can compete with the channels we study, not whether the automation ran.

**Priorities, in order:** creative intelligence, visual excellence, production efficiency.

## The brand in one line

Fourth Watch is a faceless Christian educational channel that makes cinematic biblical explanations of surprising, textually supported connections within Scripture. Its strengths are intellectual depth, clarity, reverence and memorable visual storytelling.

## The pipeline

| # | Stage | Read | Output | Gate |
|---|---|---|---|---|
| 1 | Research | `02_biblical_accuracy.md`, `system/01` | Verified notes | Topic picked by Marcus |
| 2 | Script | `03_script_and_narration.md`, the writer skill | Script with its one-sentence message | Checks pass |
| 3 | Approval | `03` | `script_approved*.md` | **Marcus approves. The script locks.** |
| 4 | Voiceover | `03`, `GENERATION_APPROVAL.md` | One take, word timings | **Paid: approval first.** Take matches the script word for word |
| 5 | Storyboard | `05_motion_and_cinematography.md` | Timed storyboard tied to the take | **Marcus approves** |
| 6 | Visual references | `01`, `04`, `GENERATION_APPROVAL.md` | Character, set and prop references | **Paid: approval first.** Marcus approves each reference |
| 7 | Short generation tests | `06_higgsfield_workflows.md` | One sequence as a test | **Paid: approval first** |
| 8 | Review | `07_quality_control.md` | Notes and fixes | **Marcus watches it** |
| 9 | Final assembly | `06` | Full edit in Higgsedit | Rendering is free. Any new paid art needs approval |
| 10 | Quality control | `07` | Scorecard | All seven checks pass. Then Marcus decides. **Never publish automatically** |

## The three creative approvals

Inside these stages, work independently and don't interrupt Marcus for routine decisions.

| Approval | His question | Covers |
|---|---|---|
| **1. Script** | Is the story genuinely worth watching? | Stage 3 |
| **2. Visual direction** | Do the storyboard, characters, compositions and motion meet our standard? | Stages 5 to 7 |
| **3. Final video** | Is the finished film ready to publish? | Stage 10 |

Paid jobs still need separate approval under `GENERATION_APPROVAL.md`, however they're grouped.

## Identity and the look gate

Fourth Watch has one recognizable identity, not one required appearance or technique. Each scene uses the visual language that serves it best: `01_brand_and_references.md`.

Before a new look is used, this runs between stages 3 and 5:

1. Write the art directions to compare, using one key scene.
2. Marcus chooses which to test first, and how many.
3. Quote the cost of each still. Wait for approval.
4. Generate only the approved stills, one at a time.
5. Marcus approves one, asks for another test, or sends them back.
6. Write the approved look into `01_brand_and_references.md`.
7. Build the storyboard in that look. Animate only after he approves it.

Once a look is approved, later episodes reuse it and skip this gate.

**Current state (Nov 3):** the hybrid approach is approved, and the identity draft in `01` is waiting for Marcus to judge it from proof frames. Stills that cost credits run only with his approval.

**Assembly:** Higgsedit is the primary engine. Other tools are welcome when they produce a better result.

## Files

| File | Covers |
|---|---|
| `GENERATION_APPROVAL.md` | How anything paid gets approved, logged and audited |
| `01_brand_and_references.md` | Brand identity, visual identity, how to use references |
| `02_biblical_accuracy.md` | Research and accuracy requirements, in words and pictures |
| `03_script_and_narration.md` | Script structure, locked scripts, narration standards |
| `04_characters_and_environments.md` | Consistency of characters, sets and props |
| `05_motion_and_cinematography.md` | Storyboards, camera, motion graphics, typography |
| `06_higgsfield_workflows.md` | Routes, models, verified prices, tool findings |
| `07_quality_control.md` | The seven-part scorecard |
| `08_costs_and_assets.md` | Budgets, ledgers and reusable assets |
| `09_approved_and_rejected.md` | What has worked and what has failed |
| `ledger/` | The generation log and the asset register |
| `approvals/` | Exact job requests, and the temporary record the hook reads |

## Episode state and source

- **`<episode>/episode.json`:** where the episode stands, what's locked, the assets and the next step. Read it before resuming.
- **`<episode>/source/`:** the code for its films and tests. Heavy media stays in Higgsfield, listed by ID in `episode.json`.
- **Pilot:** `ep02-bronze-serpent/`. Resume steps are in `ep02-bronze-serpent/source/README.md`.

## Which older guides still apply

| Guides | Status |
|---|---|
| `system/00`, `01`, `10`; `research/`; `prompts/`; `templates/`; `tools/script_judge/`; `fw_check.py` | Live |
| `system/02`, `03` | Live, with the writer and script review skills |
| `system/04`, `08` | Live for craft and checks. Tool routes follow `06` |
| `system/05`, `06`, `06b`, `06c`, `07`, `13` | Live for craft. Their film27 commands are retired |
| `system/09` | Live for checks. Its render route is retired |
| `system/11` | Live as history |
| `system/12`, `ENGINE_ROADMAP.md`, `engine/`, `engine_lab/`, `ep01-samson/film27/` | Archive. Mine for parts, don't build on them |

## How this system stays current

After each episode or test:
1. Add what worked and failed to `09_approved_and_rejected.md`, with the evidence.
2. Update the ledgers and any prices that changed.
3. Record Marcus's new rules as a round in `research/feedback_rules.md`.
