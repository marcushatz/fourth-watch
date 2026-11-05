# Skill design brief — not yet a skill

**Status:** RESEARCH COMPLETE FOR V1; SKILL UNBUILT AND UNVALIDATED. Resist the urge to install this text as `SKILL.md` tomorrow without a test. We intentionally separate the accumulated knowledge from the runtime instructions.

## The desired behavior

Given a passage or human question, the future skill should:

1. Identify the **real stakes** in the text or the audience's preexisting confusion. Do not assume every overlooked word matters.
2. Select a narrative mode: immersive event, textual investigation, or argument/visual explanation. The choice should be revisable and justified in a sentence.
3. Retrieve only **relevant case examples**, not all 22 at every invocation. If a candidate uses the Hagar hearing/seeing motif, load motif examples; if it's a hard objection, load L01/L03, not necessarily BP02.
4. Construct a source ledger of stated facts, defensible implications, attributed interpretations, and unsupported imagination.
5. Draft *one* human-readable script with a beginning that creates honest expectation, a meaningful middle turn, and a completion that rewards attention.
6. Test for the exact known failure modes from `05_original_failure_registry.md`.
7. Stop after a limited, user-approved revision process and hand a locked script to the production system. Do not create visuals, narration, or spend credits inside the storytelling skill.

## Proposed on-demand references (after validation)

```text
fourth-watch-story/
  SKILL.md                       (short executive behavior; <= 500 lines, ideally much less)
  references/
    narrative-modes.md           (M01–M08, C01–C06, with counterexamples)
    evidence-and-fidelity.md     (claim tiers and Scripture integrity)
    rejection-and-repair.md      (portable examples from the private feedback registry)
    comparable-cases.md         (a SELECTED set, not all 22 transcripts)
    story-dossiers.md           (only passages relevant to current episode)
  tests/
    storm.md
    hagar.md
    naaman.md
```

The research archive should remain available outside the skill rather than silently loading thousands of tokens per script. One compact table of eight mechanisms might suffice initially. The best reference is the one that *changes Claude's decision in this task*.

## Why this may become harder to replicate

- A private dataset of actual rejected narrative decisions and editorial rationales is less generic than public skill prompts.
- Real, first-party viewer feedback linked to named draft edits can identify individual writing moves the audience did or did not understand.
- The scriptural claim ledger can preserve a growing record of corrected theological overclaims.
- Over multiple releases, a channel-specific visual and audio language can coordinate emotional timing with narration.

However, the skill file itself is **not** a proprietary moat. Competitors can independently implement these patterns. Any claim that we have discovered the mechanism behind successful videos or that this library makes scripts automatically exceptional would be unsupported.

## The next Claude handoff — after usage refresh

Ask Claude to **inspect** this library without building a bigger framework. Have it (a) select no more than eight core principles; (b) draft a first minimal skill; (c) run the three frozen validation prompts against a no-skill baseline with the same sources; (d) show the scripts and exact differences; (e) record uncertain results without claiming success. Do not let it use AI votes as audience evidence or regenerate a new writer architecture before the pilot test.

**Immediate goal:** stronger verified scripting behavior, not a more impressive directory tree.
