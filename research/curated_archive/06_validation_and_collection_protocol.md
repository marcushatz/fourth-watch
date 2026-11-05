# Validation protocol: how evidence becomes skill instruction

**No Claude execution, no AI review claims, no paid jobs have been performed in this research batch.** These are test materials to use later, not a report of achieved improvements.

## Stage A: frozen baseline

Select three tasks with different narrative shapes. Save identical source packs, output lengths, model versions, reference access and voice-delivery expectations. A model writing without a skill is the baseline. A model writing with the candidate skill is the intervention. Keep original source text access identical. Avoid giving the intervention more favorable information unless the skill's curated knowledge is *precisely the treatment being tested*.

- **Test A — Familiar event**: Matthew 14, Mark 6 and John 6. Develop a standalone story about the fourth watch without guessing motives or depending on a disputed “pass by” interpretation. Success = meaningful human stakes and a robust insight beyond a one-word observation.
- **Test B — Difficult emotionally compelling story**: Genesis 16 and 21. Develop Hagar without omitting the return/submission command, glossing over her affliction or treating Ishmael as a toddler. Success = grief/hope and both hearing/seeing motifs without false reassurance.
- **Test C — Textually subtle, simpler episode**: 2 Kings 5. Develop Naaman as a human choice with pride/expectation tested by an ordinary directive. Success = narrative reversals based on recorded events rather than a manufactured lexical secret.

## Stage B: blind real-listener review

Recruit 3–5 voluntary adult listeners with varied Bible familiarity. Present A/B versions in counterbalanced order and remove any mention of which was skill-written. Have a person read *both* drafts at a similar natural pace with no music, or use the same synthetic narrator settings for both. Listeners should not see reference video views or scores.

Ask, then record verbatim:

1. “What question or human predicament did you think this was about?”
2. “What did you understand differently after hearing it?”
3. “At which sentence did your interest increase, weaken or become confused?”
4. “What line, image or action stayed with you?”
5. “Was there a claim you didn't believe?”
6. “Would you show this to someone? Who and for what reason?”

Don't infer certainty from a 3–5 person panel; these are editorial diagnostic interviews, not statistically representative sample estimates.

## Stage C: independent Scripture review

For each sentence: log passage, evidence tier (T1–T4), and claim exactness. Reject unfounded statements regardless of listener preference. A statement of an interpretation is allowed if explicitly framed and carefully sourced. Verify direct ESV quotations word for word and check translation copyright restrictions before publicly distributing extended passages.

The final review is separate from writing. The author's own declaration “I checked it myself” is not an independent check.

## Stage D: make the first episode, then measure

Do not claim a creative skill is effective solely from A/B script judging. After publishing, record **retention drop-off**, shares per reach, follow conversions, and actual comments. Keep platform-specific metrics separate. Interpret *why* a segment may have failed as a hypothesis to test in another episode; one upload cannot isolate cause.

Minimum ledger schema: `episode_id, topic, publication_date, platform, duration, first_line, mode, source_integrity_issues, retention_by_sec_available, 3s_hold, average_view_duration, shares, reach, follows, comment_themes, creative_change, result_interpretation, confounds`. Leave metrics blank when unavailable; don't invent proxies.

## Stage E: promote evidence into the skill

A candidate rule is promoted only if it:

- addresses a demonstrated recurring problem or consistently useful operation;
- has at least one positive and one negative/counterexample, or is a nonnegotiable accuracy/safety constraint;
- describes an actionable **decision**, not a generic aspiration;
- does not conflict with a better-supported mechanism;
- reduces uncertainty or improves independent feedback in multiple tasks.

Demote or delete a rule if a contrary successful case demonstrates it is format-specific, if the rule drives unnatural writing, or if it doesn't change outcomes. Never retain a rule because it took time to research.

## Experiment records (fill only after a real experiment)

```text
Experiment ID:
Model + settings:
Input passage/source pack:
Baseline prompt + link:
Skill version + link:
Balanced order used:
Listener count and familiarity:
Without-skill observed strengths/weaknesses:
With-skill observed strengths/weaknesses:
Accuracy violations (both):
Decision: retain / amend / drop mechanism
Confidence: low / medium / high, with reason
Next action:
```

## Research backlog, strictly prioritized

**P1 — evidence missing from our existing 22-video set:** actual hook and edit-point retention curves (we don't have them); independent user judgments; video descriptions and formal sources supporting unusual biblical claims; release dates/context for matched controls; independent transcription checks on auto-caption segments. These matter more than another twenty generic creator examples.

**P2 — diversification:** 5 videos where a character-centered Short succeeded *without* a question hook, 5 where a complex theological argument succeeded with rigorous source framing, and 5 clear failures whose source and audience are comparable to a hit. Code with the same template as `01_case_index.csv`.

**P3 — production integration:** only after the writing skill shows improvement, compare its scripts with identical storyboard/voice conditions. Audience reaction to camera/voice can otherwise be mistaken for writing quality.

**Reject for now:** collecting thousands of unannotated prompts, lifting other creators' transcripts into a training pack, copy-pasting “viral hook” lists, generating an additional self-scoring rubric, or building a bigger orchestration framework before the first controlled test.
