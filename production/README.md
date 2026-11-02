# Fourth Watch production system

**What this is:** the reusable system for making every Fourth Watch episode with art direction first and Higgsfield under tight control. It was set up on Nov 2, 2026 after the Bronze Serpent test.

**Scope:** Fourth Watch only. Other kinds of video use `presets/`.

**What it replaces:** the visual and animation stages of the older system. The `system/` guides still govern topic, script, review, publishing and growth. Where they disagree on visuals or order of work, this folder wins. `research/feedback_rules.md` wins over everything.

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

## The look gate

Before a new look is used, this runs between stages 3 and 5:

1. Write the art directions to compare, using one key scene.
2. Marcus chooses which to test first, and how many.
3. Quote the cost of each still. Wait for approval.
4. Generate only the approved stills, one at a time.
5. Marcus approves one, asks for another test, or sends them back.
6. Write the approved look into `01_brand_and_references.md`.
7. Build the storyboard in that look. Animate only after he approves it.

Once a look is approved, later episodes reuse it and skip this gate.

**Current state:** no look is approved. Marcus is comparing cinematic illustrated 2.5D with premium stylized 3D, using one Bronze Serpent frame: `ep02-bronze-serpent/art_direction/comparison_2026-11-02.md`. Stills run only with his approval. This system must work with either style.

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

## How this system stays current

After each episode or test:
1. Add what worked and failed to `09_approved_and_rejected.md`, with the evidence.
2. Update the ledgers and any prices that changed.
3. Record Marcus's new rules as a round in `research/feedback_rules.md`.
