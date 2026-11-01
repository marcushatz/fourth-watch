# 03 · Script review: the loop every script goes through before Marcus sees it

**Use this when** any script revision is ready (and whenever Marcus says "check the script"). The `fw-script-review` skill runs this loop; this file is the reference version.

## 1. The loop

1. **Back up** the script: `episode_vNN_backup.md`.
2. **Run the checker:** `python3 fw_check.py script episode.md --out qa/script_vNN`. Fix every FAIL.
   - Read the hit-structure WARNs: budget, hook form, turn, story share, answer timing, echo, "you" lines, closing question.
   - The WARNs that matter most for "not slow":
     - **budget** (230–300 words);
     - **turn** (by ~25 s);
     - **answer timing** (35–50%);
     - **echo** (the hook again at 75–90%).
3. **Launch four fresh reviewers in ONE message** (`prompts/`):
   - **A**, ESV fact-check: lines, verse cards and pictures;
   - **B**, first-time viewer;
   - **C**, cold editor;
   - **D**, director.
4. **Merge** (Marcus's rules win):
   - **Accuracy:** apply every CORRECTION and OVERCLAIM from A. Re-check any wording B, C or D suggests against the ESV before using it.
   - **Clarity:** apply fixes two reviewers agree on, or that one flags with a clear cause, unless they break a standing rule (`research/feedback_rules.md`).
   - **Pictures:** D's pictures go into the shot list (`act` / `change` / `pill`).
   - **Structure and length:** never restructure alone. Give Marcus one decision with the runtime of each option, pure cuts first.
5. **Re-run the checker.**
6. **Re-test with a fresh first-time viewer** (B again, a new agent). Done when the viewer restates the answer correctly (≥ 4/5), names no swipe point in the first half, and lists 3+ new things.
7. **For a decision between versions:** run the variant test (`prompts/F_variant_test.md`).
8. **Report to Marcus:**
   - one line per reviewer;
   - the revised script with the changed lines in bold;
   - what changed and why;
   - what wasn't taken and why;
   - the runtime estimate (words ÷ 2.6 and ÷ 3.0, plus ≤ 4.5 s);
   - the hit-structure line;
   - at most one decision.
9. **Log the round** in `ep*/qa/<round>/reviewers.md`. Log any new correction Marcus gives as a standing rule in `research/feedback_rules.md`.

## 2. What the reviewers caught on Ep 1 (Oct 31), as a calibration

| Reviewer | Caught | Kind |
|---|---|---|
| A | "last act began with a prayer" (16:26 comes first); "always" overclaim; 6 picture errors; "he prayed" pointing at Jesus after a cut | Accuracy |
| B | A swipe at the Matthew 7 warning; "doesn't end there"; confused by Gaza, the gate, the hair and Hebrews 11; the answer 3/5 | Viewer |
| C | The answer used up at 70 s, then 75 s of epilogue; the second-person hook; "Matthew 7 doesn't prove line 9" | Structure |
| D | A picture for every line; the gate posts ↔ pillars rhyme; lines 9 and 12 only work as cards | Pictures |
| E | The shot plan: 25 of 37 shots plain MS/WS, no CU; 11 similar shots on one set; a 13 s dead stretch; face-acting beats the rig can't do | Camera |
| F (×2) | v59: 4/5 in both variants; Matthew 7 read as a threat in one; the Delilah retelling is still the swipe risk | Decision |

## 3. Common merge conflicts (and how they were resolved)

- **Reviewer wording that implies an event** ("he asked for revenge, and the strength still came"): rejected, because it implies God answered.
- **"On that day" vs "judgment day":** Marcus's plain-words rule wins for a paraphrase. Quotes stay exact.
- **"Cut 'Let's look at Samson'":** rejected, because Marcus asked for the natural introduction.
- **"Cut 'Earlier… Now…'":** offered, not applied; it's Marcus's line.
