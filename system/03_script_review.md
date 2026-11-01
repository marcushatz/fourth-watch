# 03 · Script review: the loop every script goes through before Marcus sees it

**Use this when** any script revision is ready (and whenever Marcus says "check the script"). The `fw-script-review` skill runs this loop; this file is the reference version.

## 1. The loop

1. **Back up** the script: `episode_vNN_backup.md`.
2. **Run the checker:** `python3 fw_check.py script episode.md --out qa/script_vNN`. Fix every FAIL.
   - Read the hit-structure WARNs: budget, hook form, turn, story share, answer timing, echo, "you" lines, closing question.
   - Read the **value WARNs** (added Oct 31, Round 18). They catch, by rule, what the blind judges kept naming as the weakest lines:
     - **value:** a `## Value` item the VO never says doesn't count. Fewer than 3 spoken is a FAIL.
     - **repetition:** a 3-word phrase said 3+ times (v60: "still using you" ×3; v63: "the text never" ×3).
     - **signpost:** lines that announce instead of telling ("Let's look at Samson…", "People ask this in our comments…").
     - **nothing new:** a line whose every key word was already said.
   - The WARNs that matter most for "not slow":
     - **budget** (230–300 words);
     - **turn** (by ~25 s);
     - **answer timing** (35–50%);
     - **echo** (the hook again at 75–90%).
3. **Launch four fresh reviewers in ONE message** (`prompts/`):
   - **A**, ESV fact-check: lines, verse cards and pictures;
   - **B**, a simulated first-time viewer (an AI agent; it flags confusion, it can't measure retention);
   - **C**, cold editor;
   - **D**, director.
4. **Merge** (Marcus's rules win):
   - **Accuracy:** apply every CORRECTION and OVERCLAIM from A. Re-check any wording B, C or D suggests against the ESV before using it.
   - **Clarity:** apply fixes two reviewers agree on, or that one flags with a clear cause, unless they break a standing rule (`research/feedback_rules.md`).
   - **Pictures:** D's pictures go into the shot list (`act` / `change` / `pill`).
   - **Structure and length:** never restructure alone. Give Marcus one decision with the runtime of each option, pure cuts first.
5. **Re-run the checker.**
5b. **The blind judge panel** (`tools/script_judge/rubric.md`; Round 18). It decides whether the script gives the audience enough, as a craft bar:
   - Build the packets: `python3 tools/script_judge/make_packet.py <episode.md> --out <ep>/qa/judge_runN --seed N`.
     - Use **one version per episode per packet set**; the tool refuses two.
     - Move `key.json` out of the run folder (into the scratchpad) before any judge starts.
   - Launch **3 fresh AI agents in ONE message.** Each reads one packet and nothing else, and replies with JSON.
     - Save each reply word for word as `judge_A/B/C.json`.
   - Run `python3 tools/script_judge/aggregate.py <run> --key <key.json>`.
   - Then `python3 fw_check.py script episode.md --judge <run>`:
     - **NOT YET** is a FAIL.
     - A script changed since judging is a FAIL until it's judged again.
   - **Bar:** Overall at or above the best of the 9 Lintel reference reels on the same panel; Hook, Payoff and New value 4+; nothing under 3.
   - **What it isn't:** the judges agree with each other (test-retest Spearman 0.89 on the references), but their scores don't predict views (the 7.6M hit scores mid-table). Say "craft", never "will perform".
   - **Fixing after a panel:** apply the fixes that 2 or 3 judges name. Re-check any rewording with the fact-checker (A). Then judge the new version in a fresh packet set.
6. **Re-test with a fresh simulated viewer** (B again, a new AI agent). Done when the viewer restates the answer correctly (≥ 4/5), names no swipe point in the first half, and lists 3+ new things.
7. **For a decision between versions:** run the variant test (`prompts/F_variant_test.md`).
8. **Report to Marcus:**
   - one line per reviewer;
   - the revised script with the changed lines in bold;
   - what changed and why;
   - what wasn't taken and why;
   - the runtime estimate (words ÷ 2.6 and ÷ 3.0, plus ≤ 4.5 s);
   - the hit-structure line;
   - at most one decision.
9. **Log the round** in `ep*/qa/<round>/reviewers.md`, and save each reviewer's full reply word for word beside it (`A_factcheck.md`, `B_viewer.md`, …) before summarising. Any quote used later in a guide or a decision must be findable in one of these files (lesson of Oct 31). Log any new correction Marcus gives as a standing rule in `research/feedback_rules.md`.

## 2. What the reviewers caught on Ep 1 (Oct 31), as a calibration

| Reviewer | Caught | Kind |
|---|---|---|
| A | "last act began with a prayer" (16:26 comes first); "always" overclaim; 6 picture errors; "he prayed" pointing at Jesus after a cut | Accuracy |
| B | A swipe at the Matthew 7 warning; "doesn't end there"; confused by Gaza, the gate, the hair and Hebrews 11; the answer 3/5 | Viewer |
| C | The answer used up at 70 s, then 75 s of epilogue; the second-person hook; "Matthew 7 doesn't prove line 9" | Structure |
| D | A picture for every line; the gate posts ↔ pillars rhyme; lines 9 and 12 only work as cards | Pictures |
| E | The shot plan: 25 of 37 shots plain MS/WS, no CU; 11 similar shots on one set; a 13 s dead stretch; face-acting beats the rig can't do | Camera |
| F (×2) | v59: 4/5 in both variants; Matthew 7 read as a threat in one; the Delilah retelling is still the swipe risk | Decision |

## 2b. What the blind judge panel showed on Ep 1 (Oct 31, runs 1–4)

| Version | Overall (3 judges) | Weakest point the judges agreed on | Fixed by |
|---|---|---|---|
| v60 (Marcus's draft) | 6, 7, 6 (run 2) | Hook 2/5: a sermon question to "you"; "Let's look at Samson…" | The v61 restructure: a third-person hook on the Gaza puzzle |
| v62 | 8, 7, 7 | "every time" (16:3 never mentions the Spirit); the prayer placed in the prison | Accuracy fixes, before judging |
| v63 | 7, 7, 7 | The reward/approval point said 3 times; the closing question doesn't test the takeaway | v64 |

The deterministic value checks were added only after the panel named the same problems three runs in a row.

## 3. Common merge conflicts (and how they were resolved)

- **Reviewer wording that implies an event** ("he asked for revenge, and the strength still came"): rejected, because it implies God answered.
- **"On that day" vs "judgment day":** Marcus's plain-words rule wins for a paraphrase. Quotes stay exact.
- **"Cut 'Let's look at Samson'":** rejected, because Marcus asked for the natural introduction.
- **"Cut 'Earlier… Now…'":** offered, not applied; it's Marcus's line.
