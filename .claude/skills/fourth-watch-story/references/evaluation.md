# Evaluation and improvement

Passing checks doesn't make a script good. These tests exist to find problems. Real viewers and Marcus decide what works.

## Before hand-off

Answer these in words, with no scores.

1. **Message:** can you state what changes for the viewer in one sentence?
2. **Flat read:** with no music and no pictures, is the feeling still there?
3. **First 15 seconds:** is there a real stake or question, not just names and setup?
4. **Middle:** could any beats be swapped without loss?
5. **Ending:** what does it mean in plain words? Is that big enough for the journey?
6. **Stop point:** does anything after the peak weaken it?
7. **Retell:** could someone who heard it once tell a friend in two sentences?
8. **Two viewers:** does a Bible reader get something new, and can a newcomer follow it without a theology lesson?
9. **Send:** who would send this, to whom, and why?
10. **Honesty:** does the feeling come from the text, or from our adjectives?

Judge these separately: the concept, this script, what Scripture supports, and production feasibility.

## Revision

Make one substantive revision and one polish. If it's still weak, go back to the story or the spine. Don't patch line by line. For a serious change, note the old line, what's wrong with it, the new line and what's still uncertain.

## Label your evidence

Say which kind each claim is: real audience data, Marcus's judgment, Scripture, script limits, your own editorial judgment or speculation. AI critics can flag confusion, overclaims and insensitive lines. They can't tell us how moving a story is, and their preferences never count as audience evidence.

## Proving this skill

The skill earns its place by producing better scripts. See `../evals/test_plan.md`.

1. Run the same passage with this skill and with `fourth-watch-writer`.
2. Marcus reads each pair blind and picks, with his reasons.
3. Three to five real people hear the stronger drafts, and say what changed, where they got bored, and who they'd send it to.
4. Compare the results. Change the skill only for a repeated problem.

Don't rewrite the system after each disagreement. A single complaint may be about one line. Update a principle only when it would have changed a real decision.

## Learn from real viewers

After a video is posted, record these in `system/publish_log.csv` and compare what we expected with what happened.

| Signal | What it tells us |
|---|---|
| Skip rate | Whether the opening works |
| Retention chart | Which beat loses people |
| Sends | Whether anyone wanted to share it |
| Follows | Whether people want another |
| Top 50 comments | What they actually felt |

Judge trends, not single videos. Hits are rare.

## Add to the library

After each verdict from Marcus, add one row to `editorial-decisions.md`. Add a new annotated script only if it teaches a move the file doesn't already show. Remove anything that hasn't changed a decision.
