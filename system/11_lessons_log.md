# 11 · Lessons log: what went wrong, what we changed

Newest first. One entry per lesson: what happened, the evidence, the change, and where the change now lives.

Marcus's own rules stay in `research/feedback_rules.md`. This log is the production team's memory.

## Hypotheses to test once posting starts

Each one comes from the reference channels, not from our own numbers. Test one at a time over at least 3 posts (`system/10_publish_and_growth.md` §9.3), record the result here, and promote it to a rule only when 3+ of our reels agree.

| # | Hypothesis | Where it comes from | How to test it | Result |
|---|---|---|---|---|
| H1 | A third-person hook that names a Bible person ("Why did Jonah run…?") gets a lower skip rate than a second-person hook ("If God is still using you…") | `research/script_rules_from_hits.md` (the hits ask about a named person) | Ep 1 uses a "you" hook; Ep 2–4 use named third-person hooks. Compare skip rate and 3 s retention | — |
| H2 | A hook that autocompletes on Google earns more non-follower reach than one that doesn't | Rule 14 in the same file; `research/episode_bank.md` | Log `question_text` and whether it autocompleted; compare non-follower reach % at 7 d | — |
| H3 | Turning by ~25 s keeps the middle of the retention curve flatter than turning late (Ep 1 turns ~56 s) | `system/02` §2; the v57 editor | Compare `ret_mid_pct` between Ep 1 and the next episodes | — |
| H4 | Re-asking the hook at 75–90% reduces the drop before the end | The hits re-ask at 82–89% | Compare `ret_end_pct` with and without a re-ask line | — |
| H5 | Under ~2 minutes holds average watch % better than over it | The v59 viewers both said "nearly two minutes is long" | Group by length band after 10 posts | — |
| H6 | A short, real closing question earns more comments per reach than a three-option choice question | Both v59 viewers called the three-option form "engagement bait"; Marcus approved the choice form | Alternate the forms, keeping everything else the same | — |
| H7 | A reel whose last image calls back the first gets more replays or loops | Hits returned to the hook image 5 of 6 times on two channels (`research/direction_rules.md`) | Hard to isolate; note it in the post-mortem when watch % passes 100% | — |

---

### Oct 31 (night): "is the script itself good enough?" (Round 18), and the blind judge panel
- **What happened:** Marcus said the checker only checks form and he wasn't convinced Samson was good enough. We built a judged layer (`tools/script_judge/`): blind AI judges score our script beside 9 Lintel reels whose views we know. Five runs, 15 judge replies, all saved in `ep01-samson/qa/judge_run1–5/`.
- **Evidence:**
  - **The judges can't predict views.**
    - The 7.6M hit scores mid-table in every run.
    - The rule written before run 1 ("beat the lowest hit") was therefore inconclusive, and we said so rather than lowering the bar quietly.
    - The bar became a craft bar: at least as well built as the best reference reel.
  - **They are consistent.** Test-retest Spearman is 0.89, and the three judges in a run rarely differ by more than one point.
  - **Run 1 had a design flaw.** v60 and v61 shared a packet. v60 scored 4.7 there and 6 alone, and the judges' "fixes" for v60 were v61's changes. One version per episode per packet set is now enforced.
  - **Marcus was right about v60.** All three judges in every run that included it put the hook at 2/5 (a sermon question to "you") and named "Let's look at Samson…" or the hook as the weakest line.
  - **The panel and the fact-checker pulled in opposite directions twice:**
    - The fact-checker's overclaim fixes added "the text never" three times. The new repetition check caught it, and so did all three run-3 judges.
    - Each fix went back through the fact-checker before the next panel.
  - **Two of Marcus's earlier wording rules conflict with what the judges reward:** the natural introduction ("Let's look at Samson…") and never opening cold on a sin. They're his rules, so v64b tests the cost instead of dropping them.
- **Changes:**
  - **New `fw_check.py script` checks** (tests written first, 9 new fixtures):
    - Value items must be spoken;
    - repeated phrases;
    - signposts;
    - lines that add nothing new;
    - answer timing across two lines;
    - `--judge` (NOT YET = FAIL; a script changed since judging = FAIL).
  - Also: `tools/script_judge/`, Round 18 and `system/03` step 5b.
- **Lessons:**
  - Write the bar down before the test, and report it when it fails.
  - AI judges read craft, not reach.
  - Never judge two versions side by side.
  - Every accuracy fix can cost craft, and every craft fix can cost accuracy, so each goes back through the other check.

### Oct 31 (late evening): Marcus's corrections (Round 17)
- **What happened:** Marcus corrected the evening report.
  - It called AI reviewers "first-time viewers" and reported "would watch to the end", which implies real audience testing.
  - It asked him to decide routine technical and Bible-accuracy fixes.
  - It stated rights terms loosely ("verbal credit… or text only" contradicted itself).
  - It asked him to approve descriptions instead of exact wording.
- **Evidence found while fixing:**
  - **Silent renders:** nothing wrote `out/music.wav`, which `render.js clip` and `mux` read. A 1 s test clip now has sound.
  - **Wrong soundtrack file:** `song.js` was a stale v46 copy.
  - **A linter blind spot:** the shot-list checker didn't count a speech bubble as a visible change. The new test fixture caught it before the fix.
  - **The ESV credit:** Crossway's page requires a spoken credit on video.
  - **The AI label:** Meta's announcement requires it for realistic-sounding AI audio.
  - **The Nineveh line:** a history line placed next to Jonah's reason implied a motive. Both AI reviewers flagged it, so it moved to the first mention of Nineveh, without the conquest clause.
- **Changes:**
  - Round 17 in `research/feedback_rules.md`.
  - "Simulated (AI) viewer" wording everywhere.
  - `DECISIONS.md` rewritten with exact wording.
  - `tools/make_manifest.py`, `tools/check_env.py`, `ENVIRONMENT.md`, `tests/checkers/`.
- **Lessons:**
  - Fix what's broken and report it; ask only about choices.
  - Quote the official terms before stating them.
  - Write every test before the fix it checks.

### Oct 31 (evening): the system's first run on a new topic (Ep 2 Jonah, worked example)
- **What happened:** the bank's #1 topic went through the script stage: three drafts, a fact-check per round, and a new simulated (AI) viewer per round (`ep02-jonah/qa/round1–3/`).
- **Evidence:**
  - Every simulated viewer rated the answer 4/5. (Simulated viewers flag confusion; they can't measure watch-through.)
  - Round 3's simulated viewer named no swipe point. Round 1's named the famous part, and round 2's the stretch after the answer.
  - **"You know the next part: the storm, the sailors, the great fish"** turned the swipe point into a line the round 2 viewer said "handled that well". Naming the famous part as known, in one line, works.
  - **All three viewers asked who Nineveh was** and why Jonah would mind it being spared. The text-only rule leaves that unsaid. It's a real tension between our accuracy rule and clarity, so it goes to Marcus rather than being decided here.
  - **The drop after the answer (~50 s)** was flagged twice. A promise of something new ("And the ending is stranger than the fish") kept the round 3 viewer watching ("is what kept me watching").
  - **A bank card's quotes aren't a script's quotes.** Round 1 found 7 overclaims in a draft built from a verified card: the card verifies phrases, not the narrator's paraphrases around them.
  - **Repetition is easy to miss when writing a payoff.** "Slow to anger" was heard three times.
- **Changes:**
  - `02` and `06c` §5 already hold the one-line famous part. This is the first evidence from our own tests that it works.
  - The open question about introducing Nineveh is in `ep02-jonah/README.md`.
- **Lesson:**
  - Paraphrases get fact-checked as hard as quotes.
  - When three fresh simulated viewers ask the same question, the script owes them an answer, or Marcus owes the script a ruling.
  - After the core answer, the next line must promise something new, not recap.

### Oct 31 (evening): the second audit and sourcing quotes
- **What happened:** a second audit agent re-checked the new system files against the evidence files.
- **Evidence:**
  - Several reviewer "quotes" in the guides weren't in any saved file (they came from agents' raw replies that were summarised before saving).
  - One count was overstated ("both viewers called it the weakest" when one did).
  - A camera note still described a lit doorway (door imagery is ruled out).
  - Two Bible-picture errors in the shot list: the loom (16:13–14, his hair was woven into it, nothing tied to his arms) and a cloth over his eyes (not in the text).
- **Changes:**
  - The quotes now match `qa/script_v59_tests.md` and `qa/script_v57_review/reviewers.md` word for word, or are paraphrased without quote marks.
  - The T2 and M4 rows were fixed or flagged in `DECISIONS.md`; the 06 doorway line was replaced.
  - Backups in `backups/2026-10-31_audit2/`.
- **Lesson:** save every reviewer's raw reply into the episode's `qa/` folder before summarising it. A quote in a guide must point at a saved file.

### Oct 31 (evening): v59 review round
- **What happened:** five fresh reviewers and two variant viewers read the Ep 1 v57 script and the v58 shot plan.
- **Evidence:**
  - The answer scored 3/5 with a simulated (AI) viewer, rising to 4/5 after the v59 cuts.
  - The answer landed around 70 s, followed by about 75 s of epilogue (the cold editor).
  - Six picture errors (the lion, the silver timing, the gold at the shave, inner-room soldiers, a boy, a temple).
  - 25 of 37 planned shots were plain MS/WS.
  - Beats that depended on facial acting the rig can't do.
- **Changes:**
  - `system/02` §3, the drag list;
  - `system/06`, the angle pass;
  - `tools/shotlist_check.js` now checks angles and jump cuts;
  - `prompts/A` checks pictures and pronouns after cuts;
  - `prompts/F`, the variant test.
- **Lesson:**
  - Test a decision with two fresh simulated viewers rather than arguing it, and remember they flag confusion, not retention.
  - Always fact-check pictures, not only words.
  - After any cut, re-check every pronoun.

### Oct 31 (afternoon): the rulebook audit
- **What happened:** an audit agent checked `direction_rules.md` v2 against its evidence.
- **Evidence:**
  - 13 overstated or wrong figures.
  - Example: "nothing over 12 s" is broken by a Lintel hit's 17.9 s diagram.
  - Example: the speech floor stated as 2.7 when a hit reads 2.59.
- **Changes:**
  - v2.1, with the [2 CH] / [THIN] tags and a (judged) marker;
  - the checkers' messages corrected;
  - `prompts/G`.
- **Lesson:** audit every rules file after a big change, and mark judged against measured.

### Oct 31 (morning): v57 "not good enough"
- **What happened:** the v57 render was technically clean but Marcus rejected it on pacing, length, motion and camera.
- **Evidence:**
  - 47% of the runtime had nothing new on screen (Lintel 19–21%).
  - Characters stood still while the voice told the action.
  - A big title hook; a 14 s tail; a 150 s runtime.
- **Changes:**
  - the direction rules from 24 Shorts;
  - the beat clock in `fw_check.py`;
  - the shot-list gate;
  - no build without an approved shot list and a motion draft.
- **Lesson:** "passes the checker" is not "good". Measure the reference before building, and show motion drafts, not stills.

### Oct 30–31: the overnight render
- **What happened:** background renders stopped at the 2 h cap, which lost a part mid-render; a `pkill -f` matched its own shell.
- **Change:** render one part per job, check parts before joining, and kill by PID (`system/09` §4).

### Oct 29–30: script rounds
- **What happened:** many script versions passed the checker but failed Marcus's ear: preachy lines, assuming the viewer strayed, overclaims ("God answered", "last").
- **Change:** the four-reviewer loop (`fw-script-review`), Marcus's wording rules (`research/feedback_rules.md` Rounds 11–14).
- **Lesson:** independent reviewers who never saw a draft catch what the writer can't.
