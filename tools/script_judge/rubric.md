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

## The bar (v2, fixed on Oct 31 at 22:50, after run 1 and before run 2)

**What run 1 showed** (`ep01-samson/qa/judge_run1/`, 3 judges, 9 Lintel reels):
- The judges agree with each other closely: on 8 of 12 scripts all three gave the same Overall, and none differed by more than 1.
- **They can't predict views.** Overall vs log views: Spearman 0.64, but the 7.6M hit ("Why didn't God remove the tree?") scored 5, tied with a 75K reel, and the 1.6M hit ("never heard") scored 4, with the 35K and 48K lows. The v1 rule ("at or above the lowest hit") therefore made every verdict INCONCLUSIVE, as written.
- **Two flaws in run 1's design:**
  - It put two Samson versions (v60 and v61) in one packet, so the judges compared them and their fixes for v60 echo v61's changes. `make_packet.py` now refuses two versions of one episode in a packet set.
  - Some reference reels are transcripts made from captions, and the judges marked them down for transcription slips. The prompt now tells them not to.

**So the judge layer is a craft check, not a forecast.** A script is **GOOD ENOUGH (craft)** when all three hold on the same panel:
1. Its **Overall** median is at or above the **best-scoring reference reel's** Overall median. In plain words: at least as well built as the best-built Lintel reel in the set.
2. **Hook**, **Payoff** and **New value** each have a median of 4 or more.
3. **No criterion** has a median below 3.

Otherwise it's **NOT YET**. Passing says nothing about views; it says the script isn't losing on craft to a channel that gets millions.

**Question pull** (criterion 9, added in run 2) rates the question itself: how many people already ask it. It's reported next to the verdict, not part of it. If it separates the hits from the lows on the reference reels, a script whose question pull is below every hit's gets a note.

**Run 2's tests, written down before it runs:**
- J1: does Overall separate hits from lows now that transcription slips aren't penalised? (Expected: no.)
- J2: does question pull separate them (Spearman 0.5 or more, every hit above every low)?
- J3: do the reference reels' Overall medians agree between run 1 and run 2 (Spearman 0.8 or more)? If not, the panel is too noisy to gate on.
- J4: Samson v62 (the v61 restructure plus fixes) and v60, each judged in a packet with no other Samson version: which meets the bar?

## What runs 2–4 showed (Oct 31, written after the runs)

The reference reels were scored by 15 judge replies across runs 2–5 (pooled panel: `ep01-samson/qa/judge_pooled/panel.md`).

| Test (fixed before run 2) | Result |
|---|---|
| J1: does Overall separate hits from lows? | **No.** Spearman +0.51 in run 2, +0.56 pooled. All 15 judges gave the 7.6M hit ("tree") a 5; a 75K reel ("show Himself") gets 5–7. |
| J2: does question pull separate them? | **No**, though it comes closest (Spearman +0.58). All three hits score 4–5 on it, but so do two lows. |
| J3: do the reference scores repeat between runs? | **Yes.** Spearman 0.89 between run 1 and run 2 medians. Within a run, the three judges' Overall scores never differ by more than 2. |
| J4: v60 vs the restructure, each in its own packet set | v60: 6 (6, 7, 6), **NOT YET**, Hook 2. v62: 7 (8, 7, 7), **GOOD ENOUGH**. |

Then v63 scored 7 (7, 7, 7) and v64 scored 7 (7, 7, 8). v64 is the first version with every criterion at 4 or 5 (question pull 3).

v64b (run 5) tested the cost of two of Marcus's earlier opening rules: the natural introduction, and never opening cold on a sin. It scored 7 (7, 7, 7) with Hook 4 and Takeaway 3, still GOOD ENOUGH. All three judges named "Let's look at Samson…" as its weakest line.

**Reading it:**
- The panel is a reliable **craft** reader: it repeats itself and names the same weak lines.
- It is **not a views predictor.** The biggest Lintel hit is ordinary craft with a question millions ask.
- Topic demand isn't measured well by AI judges either (J2). Real posts are the only test of that (`system/11` H2).

## How to run it

1. `python3 tools/script_judge/make_packet.py <script.md> [<script.md> …] --out <run folder> --seed N` builds three blind packets (one version per episode per packet set; a new seed per run). Each holds the scripts plus the calibration reels, in a different order, with no titles, channels or views.
2. Give each packet to a **separate, fresh AI agent with no tools**, using `judge_prompt.md`. Save each reply as `judge_A.json`, `judge_B.json`, `judge_C.json` in the run folder.
3. `python3 tools/script_judge/aggregate.py <run folder> --key <key.json> [<run folder> --key <key.json> …] --out <folder>` un-blinds the scripts, pools the reference reels across every packet set, and computes the medians, the calibration (which qualities line up with views) and the verdicts. It writes `panel.json` and `panel.md`. Keep each key out of the judges' folder.
4. `python3 fw_check.py script <script.md> --judge <run folder>` adds the verdict to the script check. NOT YET is a FAIL.
