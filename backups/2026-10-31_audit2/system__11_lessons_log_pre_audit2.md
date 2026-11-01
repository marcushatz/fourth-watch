# 11 · Lessons log: what went wrong, what we changed

Newest first. One entry per lesson: what happened, the evidence, the change, and where the change now lives.

Marcus's own rules stay in `research/feedback_rules.md`. This log is the production team's memory.

---

### Oct 31 (evening): v59 review round
- **What happened:** five fresh reviewers and two variant viewers read the Ep 1 v57 script and the v58 shot plan.
- **Evidence:**
  - The answer scored 3/5 with a first-time viewer, rising to 4/5 after the v59 cuts.
  - The answer was "used up at 70 s, then 75 s of epilogue".
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
  - Test a decision with two fresh viewers rather than arguing it.
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
