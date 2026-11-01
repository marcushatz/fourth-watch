# Decisions waiting for Marcus

**Use this when** Marcus is back. Every open choice is here with the exact wording to approve, the evidence and a recommendation. When he decides, record it as a new round in `research/feedback_rules.md` and update the file it names.

Last updated: Oct 31, 21:00 (after Round 17).

**About the evidence:**
- **"Simulated viewers" are AI agents** role-playing a first-time viewer. They can flag confusion and slow, preachy or unclear lines. They can't tell us retention, swipes or sharing; only real posts can.
- **"Fact-checkers" are AI agents** that read the ESV pages online. Their saved replies are in each episode's `qa/` folder.

---

## Decided on Oct 31 (Round 17): done or in progress

| # | Decision | What was done |
|---|---|---|
| 1 | Cut the Matthew 7 warning | Out of `ep01-samson/episode_v60_draft.md`, the caption and the references |
| 2 | Outro A | Jesus fades in under the closing question and is still by its last word (`shotlist_v60.md`, rows Z1–Z2) |
| 4 | Cut both optional lines | "Earlier… Now…" and "You can be gifted, lead, and help people." are out of v60 |
| 6 | No speed-up | Dropped |
| 12 | Ep 2 is Jonah, with Nineveh explained by a sourced historical line | `ep02-jonah/episode_v5_draft.md` (see B below) |

## Fixed without asking (Round 17: technical and accuracy fixes are routine)

- **Bible accuracy (Ep 1):**
  - The cloth over Samson's eyes is gone from shot M4; he's seen from behind and above.
  - "Pushed against the pillars" now uses the ESV verbs, "leaned his weight against the two middle pillars and bowed with all his strength", in the script, the shot list and the recording list. An AI fact-checker verified it.
- **Silent renders:**
  - The soundtrack script now also writes `out/music.wav`, which `render.js` reads for sound.
  - The current Ep 1 soundtrack is in place.
  - A 1-second test clip now comes out with an audio stream.
- **Wrong soundtrack file:** `song.js` was a stale v46 copy. It's now the current v57 script; the old text is kept as `song_v46.js`.
- **Inconsistent versions:**
  - The new release manifest checks that the script, `vo.js`, the score, `song.js` and `music.wav` belong together.
  - **v57** passes as a consistent set.
  - **v60** is correctly flagged as not releasable until it's recorded and re-timed.
- **The shot-list checker** didn't count a speech bubble as a visible change. A test clip caught it; it's fixed, and the new fingerprint is `67d3a266…`.
- **Engine docs** now say which features don't exist yet (crossfade, sub-frame motion blur), and the scene contract lists the fields film.js reads.

---

## A. Ep 1 Samson v60: approve the wording

### 5. The closing question (pick one)

All three were verified against the ESV.

| | Exact words | Words |
|---|---|---|
| **A** (recommended; in the draft) | What stands out more to you about Samson: his failures, or his prayer at the end? | 15 |
| B | What stands out most about Samson: his strength, his failures, or his prayer at the end? | 15 |
| C | Which line hit harder: "he did not know that the LORD had left him," or "remember me"? | 17 |

### The answer line before the question (approve as is)

Unchanged since v59 and verified:
> So does God still using you mean He's okay with how you're living? Samson's strength never proved that. But even at his lowest, he could still call on God.

### 11. The spoken ESV credit (required; pick the wording)

- **The requirement:** Crossway lists video among the media that need the full notice, and says: "Verbal credit must also be given to the 'ESV'." (crossway.org/rights-and-permissions/esv, checked Oct 31). Text alone doesn't meet it.
- **Placement:** read lower and quieter under the outro hold.

| | Exact words | Length |
|---|---|---|
| **1** (recommended) | Scripture quotations are from the ESV. | ~2.2 s |
| 2 | Scripture from the ESV. | ~1.4 s |

### 3. Record the pick-ups

`ep01-samson/v60_recording.txt` has five lines, word for word, for the same ElevenLabs voice and settings as the v57 take:
- the "Samson prayed," splice;
- the pillar line;
- the re-ask;
- the closing question;
- the credit.

The full v60 runs about 114–116 s (an estimate until recorded). The details are in `ep01-samson/v60_plan.md`.

## B. Ep 2 Jonah v5: approve the script

- **The draft:** `ep02-jonah/episode_v5_draft.md`, 312 words, about 110 s.
  - The checker reports 0 FAIL.
  - It WARNs that the turn lands at about 27 s; the target is 25 s.
- **The Nineveh line,** at the first mention:
  > Historically, Nineveh was one of Assyria's great cities.

  A map card shows a source pill, "HISTORY · WORLD HISTORY ENCYCLOPEDIA", which goes out before the next sentence.
  - An AI fact-checker verified it: Nineveh became the capital only later, so the line says "one of Assyria's great cities", not "capital".
  - **A longer version was dropped:** "…and Assyria later conquered Israel's northern kingdom." Both AI reviewers said it implied a motive the book never gives, partly because the conquest came decades after Jonah. If you want it back, it needs this wording, which adds about 8 s:
    > …and decades after Jonah, Assyria conquered Israel's northern kingdom. The book of Jonah never gives that as his reason.
- **One open line: the re-ask near the end.** The latest simulated viewer rated clarity 3/5, because the payoff never says Jonah didn't want Nineveh spared.
  - **Current (verified):**
    > So why did Jonah run? Because he knew how patient God is: patient enough to spare Nineveh. And the ending shows He's patient enough to keep reasoning with Jonah too.
  - **Option (adds 4:1, "it displeased Jonah"; verified, `ep02-jonah/qa/round7/`; recommended, since it closes the gap the simulated viewer named):**
    > So why did Jonah run? Because he knew how patient God is: patient enough to spare Nineveh, and that is exactly what displeased him. And the ending shows He's patient enough to keep reasoning with Jonah too.
- **What simulated viewers keep flagging** (confusion only, not retention): the old ESV wording piles up ("made haste to flee", "relents", "displeased… exceedingly", "appointed a worm"), and the reason is announced several times before it's given.
  - Quotes stay ESV, so the fix is fewer quotes, not reworded ones.
  - If you want it tighter, I'll cut a quote or the "Only then do we hear why he ran" lead-in.
- **After you approve:** the shot list (Round 15: nothing animated before your OK).

## C. Rights and labels (checked on the official pages, Oct 31)

### 9. The ElevenLabs plan

The official help page says:
- "The free plan does **not** include a commercial license and cannot be used for any commercial purpose."
- Free-plan content must include "elevenlabs.io" or "11.ai" in the title.
- "Content created outside of a paid subscription (before or after) cannot be used commercially."
- "Content generated using Beta Services cannot be used for any commercial purpose or in any production environment."

**Two questions for you:**
- Was the v57 take recorded on a paid plan?
- Will the pick-ups be?

If a take was made on the free plan, it carries the title attribution and can't be used commercially later. Whether an unmonetized channel counts as "commercial" isn't defined on that page.

### 10. The Instagram AI label: required, so it's on by default

Meta's announcement says: "We'll require people to use this disclosure and label tool when they post organic content with a photorealistic video or realistic-sounding audio that was digitally created or altered, and we may apply penalties if they fail to do so." The narrator is realistic-sounding AI audio, so the label goes on every reel, plus the caption line "Narration: synthetic voice. Animation drawn in code." Nothing to decide unless you object.

## D. The system

### 13. A private GitHub copy of the engine

The engine (`ep01-samson/film27/`) and the voice takes exist only in this workspace. The toolkit page holds the system files, not the engine. It needs your OK and a repo name.

### 14. The script-review skill

The updated card is still waiting to be saved. The showrunner skill is saved. A further update with the new checker fingerprint and the "simulated viewer" wording is offered now.

---

## Safeguards added (Round 17)

- **Release manifest:** `tools/make_manifest.py <episode>/release_vNN.json` writes `<episode>/releases/<name>/MANIFEST.md` and `.json`.
  - It lists every file with its SHA-256, plus the tool fingerprints and the environment.
  - Its checks include: the script equals `vo.js`, the score loads, `song.js` and `music.wav` are the declared ones, the script checker passes, and the checker tests pass.
  - Ep 1's v57 manifest is written; v60 is checked with `--check`.
- **Pinned environment:** `ENVIRONMENT.md`, `requirements.txt` and `tools/check_env.py`.
  - It covers Chrome for Testing 153.0.8010.12, three.js r158, Node 22.23, ffmpeg 6.1.1, tesseract 5.3.4 and the Python packages.
  - All match on this machine.
- **Checker test clips:** `tests/checkers/`, with 15 fixtures and planted faults:
  - 6 scripts;
  - 5 shot lists;
  - 4 videos (wrong size, frozen, too loud, a clean one).
  - `run_tests.py` reports 0 problems and must pass before any checker change ships.
