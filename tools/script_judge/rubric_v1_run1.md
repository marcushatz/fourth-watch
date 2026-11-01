# The script judge: does this script give the audience enough?

**What this is:** the second layer of the script check.
- `fw_check.py script` checks form: the structure, the references, the length, the words. It can't tell whether a script is worth watching.
- **This layer judges that**, with a blind panel of AI judges scoring against the rubric below. Their scores are checked against Lintel Network reels whose Instagram views we know.

**What it is not:** audience data. AI judges can flag a weak hook, a thin payoff, little new value, or dead lines. They can't measure retention or sharing; only real posts can (Round 17). The calibration (`calibration/`) shows how far the judges' scores line up with real views. Read the verdict with that in mind.

## The criteria (1–5 each)

| # | Criterion | 5 looks like | 1 looks like |
|---|---|---|---|
| 1 | **Hook pull** | The first line alone would stop a scroller: a specific, surprising puzzle about a named person or object that people already wonder about | Vague, abstract, devotional, or a sermon aimed at "you" |
| 2 | **Payoff** | A clear answer that genuinely resolves the hook, with an "oh!" moment: it reverses or sharpens what the viewer assumed | No real answer, a dodge, or an answer the viewer already knew |
| 3 | **New value** | Three or more specific, surprising things from the text that a church-raised viewer didn't know | A retelling of the familiar story |
| 4 | **Proof** | The answer is earned by specific evidence quoted or shown, not just asserted | Asserted, or resting on authority |
| 5 | **Momentum** | Every line pulls forward, raising or answering a question; nothing could be cut | Several dead lines: recaps, signposts, repeated points |
| 6 | **Clarity** | Easy to follow on one listen; no confusing words or jumps | Confusing on one listen |
| 7 | **Takeaway** | Leaves one meaningful idea a broad audience can carry, without preaching or assuming anything about the viewer | Preachy, judgmental, or nothing to carry |
| 8 | **Ending** | Lands cleanly and invites a real response | Fizzles, repeats itself, or ends on a pitch |

Plus **Overall (1–10):** how strong is this as a short-form faith explainer, compared with the best you know? 10 = the best you've seen.

Plus **Dead lines:** how many lines you would cut without losing anything, and which one is the weakest.

## The bar (from the calibration)

A script is **good enough to produce** when all three hold:
1. Its **Overall** median is at or above the **lowest-scoring of the three Lintel hits** (7.6M, 1.8M, 1.6M views) on the same panel.
2. **Payoff**, **New value** and **Hook pull** each have a median of 4 or more.
3. **No criterion** has a median below 3.

If the panel's scores don't separate the Lintel hits from the lows, the calibration has failed and the verdict is **inconclusive**. Say so; don't use it.

## How to run it

1. `python3 tools/script_judge/make_packet.py <script.md> [<script.md> …]` builds three blind packets. Each holds the scripts plus the calibration reels, in a different order, with no titles, channels or views.
2. Give each packet to a **separate, fresh AI agent with no tools**, using `judge_prompt.md`. Save each reply as `judge_A.json`, `judge_B.json`, `judge_C.json` in the run folder.
3. `python3 tools/script_judge/aggregate.py <run folder>` un-blinds the scripts and computes the medians and the calibration (do hits outscore lows?). It writes `panel.json` and `panel.md`, with a verdict per script: GOOD ENOUGH, NOT YET, or INCONCLUSIVE.
4. `python3 fw_check.py script <script.md> --judge <run folder>` adds the verdict to the script check. NOT YET is a FAIL.
