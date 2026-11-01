# Ep 1 Samson · v60 (Oct 31, 20:45): your picks applied, the exact wording to approve

**Status:** the script is `episode_v60_draft.md` and the shot list `shotlist_v60.md`. The script checker reports 0 FAIL (`qa/script_v60/report.md`). An AI fact-checker verified every changed line against the ESV (`qa/round_v60/A_factcheck.md`). Nothing is recorded.

## 1. What changed from v59

| Change | Why |
|---|---|
| The Matthew 7 warning stays out (variant X) | Your pick |
| "You can be gifted, lead, and help people." cut | Your pick |
| "Earlier, he had assumed he would escape. Now, he asked God for strength." cut | Your pick |
| Outro A: Jesus fades in under the closing question, still by its last word | Your pick |
| No speed-up | Your pick |
| "pushed against the pillars" → "leaned his weight against the two middle pillars and bowed with all his strength" | Accuracy fix (ESV 16:29–30). Verified |
| No cloth over his eyes in shot M4; he is seen from behind and above instead | Accuracy fix (the text names no cloth) |
| Matthew 7:21–23 removed from the caption and references | It's no longer in the video |

## 2. The new and changed lines, word for word

**The answer before the closing question** (unchanged since v59, verified):
> So does God still using you mean He's okay with how you're living? Samson's strength never proved that. But even at his lowest, he could still call on God.

**The pillar line** (verified):
> Then he leaned his weight against the two middle pillars and bowed with all his strength, and the building fell on the Philistine lords and everyone inside. Samson died with them.

**The join that the cuts create** (verified as a principle; it relies on the Gaza line, 16:1, which is still in):
> Notice what he said: "as at other times." It had always worked before, so he assumed it would work again.
> But God still using you doesn't mean He approves of how you're living.

## 3. Decision 5: the closing question (pick one)

All three were verified against the ESV. Each fits under 17 words.

| Option | Exact words | Words | Note |
|---|---|---|---|
| **A** (in the draft) | What stands out more to you about Samson: his failures, or his prayer at the end? | 15 | Two choices, ending on the prayer the answer line points to |
| B | What stands out most about Samson: his strength, his failures, or his prayer at the end? | 15 | Your original three choices, shorter |
| C | Which line hit harder: "he did not know that the LORD had left him," or "remember me"? | 17 | Quotes the two strongest lines; the narrator says "LORD" as "Lord" |

The old version was 19 words: "What stands out more to you about Samson: his strength, his failures, or his prayer at the end? Why?" The two simulated (AI) viewers called it "engagement bait". That flags a possible problem; it is not audience data.

## 4. Decision 11: the spoken ESV credit (required)

Crossway's permissions page lists video among the media that need the full notice, and says: "Verbal credit must also be given to the 'ESV'." So text alone doesn't meet it (checked Oct 31, crossway.org/rights-and-permissions/esv). Pick the wording and placement:

| Option | Exact words | Length | Placement |
|---|---|---|---|
| **1** | Scripture quotations are from the ESV. | ~2.2 s | Read lower and quieter under the outro hold, after the closing question |
| 2 | Scripture from the ESV. | ~1.4 s | Same |

The full written notice stays at the end of every caption.

## 5. Runtime and recording

- **Estimate:** about 114–116 s with the credit. It's an estimate until the pick-ups are recorded: the v59 variant X runs about 123 s as recorded, the two cuts save 9.2 s, and the new lines add about 2–3 s.
- **To record:** `v60_recording.txt`, five short lines in the same voice and settings as the v57 take:
  - the "Samson prayed," splice;
  - the pillar line;
  - the re-ask;
  - the closing question;
  - the credit.
- **After recording:** follow `system/04_voice.md` §6. Re-time `score_v60.js`, then run `tools/shotlist_check.js`.

## 6. Still open

Decisions 5, 9 and 11 in `DECISIONS.md`.
