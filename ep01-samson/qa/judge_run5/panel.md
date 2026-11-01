# Script judge panel · judge_run5

3 blind AI judge replies. Reference reels: 9 Lintel Network reels with known Instagram views, scored by every judge.

**Can the panel predict views?** No. Overall vs views: Spearman 0.48; the lowest-scoring hit got 5, the best low got 6. The judges rate craft; they can't tell which reels got the views.

Which judged qualities line up with views (Spearman vs log views over the reference reels; every hit above every low = separates):

| Quality | Spearman | Lowest hit | Best low | Separates? |
|---|---|---|---|---|
| hook | +0.27 | 3 | 4 | no |
| payoff | +0.55 | 3 | 3 | no |
| new_value | +0.42 | 2 | 3 | no |
| proof | +0.44 | 2 | 3 | no |
| momentum | +0.32 | 2 | 3 | no |
| clarity | +0.26 | 3 | 4 | no |
| takeaway | +0.53 | 3 | 4 | no |
| ending | +0.29 | 2 | 3 | no |
| question_pull | +0.61 | 4 | 5 | no |
| overall | +0.48 | 5 | 6 | no |

**The craft bar:** Overall at or above the best reference reel (7), Hook, Payoff and New value 4+, nothing under 3. It says a script is at least as well built as the best-built Lintel reel here. It does not predict views.

| Script | Views | Overall median (each) | Hook | Payoff | New value | Proof | Momentum | Clarity | Takeaway | Ending | Question pull | Dead lines | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ep01-samson/episode_v64b_candidate.md** | — | 7 (7, 7, 7) | 4 | 4 | 4 | 5 | 4 | 4 | 3 | 4 | 3 | 2 | GOOD ENOUGH |
| Where did Cain's wife come from? | 1,800,000 | 7 (7, 7, 7) | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 3 | 5 | 2 |  |
| Was Judas a bad person? | 338,000 | 6 (6, 6, 6) | 4 | 4 | 4 | 4 | 3 | 4 | 3 | 4 | 4 | 4 |  |
| What if Adam and Eve never ate from the tree? | 35,000 | 6 (5, 6, 6) | 4 | 3 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 2 |  |
| Why doesn't God show Himself? | 75,000 | 5 (7, 5, 5) | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 5 | 2 |  |
| Why didn't God remove the tree? | 7,600,000 | 5 (5, 5, 5) | 4 | 3 | 2 | 2 | 3 | 4 | 3 | 3 | 4 | 3 |  |
| What happens to people who never heard of Jesus? | 1,600,000 | 5 (5, 5, 5) | 3 | 3 | 3 | 4 | 2 | 3 | 3 | 2 | 5 | 4 |  |
| Why do we hide from God after we sin? | 48,000 | 4 (4, 5, 4) | 2 | 3 | 2 | 3 | 3 | 4 | 2 | 3 | 2 | 3 |  |
| If God is love, why is there a hell? | 194,000 | 4 (4, 3, 4) | 3 | 2 | 2 | 3 | 2 | 3 | 3 | 3 | 5 | 3 |  |
| Why blood on a doorway? (Exodus 12) | 33,000 | 2 (2, 2, 2) | 4 | 1 | 1 | 1 | 2 | 3 | 1 | 1 | 2 | 5 |  |

## Our scripts: what the judges said

### ep01-samson/episode_v64b_candidate.md: GOOD ENOUGH. Note: question pull 3 is below every Lintel hit's (4)

Weakest line, per judge:
- "Let's look at Samson, known as the strongest man in the Bible."
- "Let's look at Samson, known as the strongest man in the Bible."
- "Let's look at Samson, known as the strongest man in the Bible."

The one fix, per judge:
- Close on one plainly stated idea, being used by God is not proof God approves of you, instead of the split two-part summary, and cut the 'Let's look at Samson' signpost so the Gaza scene comes straight after the hook.
- State the takeaway plainly (being used by God is not the same as being approved by God) and make the closing question about that, not a meta 'what surprised you more' poll.
- Cut the 'Let's look at Samson' line and open on the Gaza night itself (he slept with a prostitute, then that same night carried off the city gate), so the puzzle lands in the first seconds.

AI judges score scripts, not audiences. They flag weak hooks, thin payoffs, little new value and dead lines; they can't measure retention or sharing (Round 17).
