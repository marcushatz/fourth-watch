# Ep 1 Samson · v59 plan (Oct 31): what changes from v57/v58, and why

> **Note (Round 17):** reviewer B and the variant testers are **simulated viewers**: AI agents role-playing a first-time viewer. Their notes can flag confusion and slow, preachy or unclear lines. Their "would watch to the end" and "would send it to…" are role-play, not audience data; only real posts measure retention and sharing.

**Status:** a proposal waiting for Marcus. Nothing is recorded or rendered.
- The locked script stays `episode.md` (v57).
- The proposal is `episode_v59_draft.md`. It passes `fw_check.py script` with 0 FAIL (the report is in `qa/script_v59/`).
- The shot plan changes are in `shotlist_v59.md`.

## 1. Evidence behind the changes

**The v57 review round** (`qa/script_v57_review/reviewers.md`):
- an ESV fact-check;
- a simulated (AI) first-time viewer (answer clarity 3/5; would swipe at the Matthew 7 warning or "doesn't end there");
- a cold editor (the answer lands around 70 s, then about 75 s of epilogue);
- a director;
- a fresh shot-plan review.

**The v59 tests:** two new simulated (AI) viewers, one per variant (their full answers: `qa/script_v59_tests.md`).

| | Variant K (keeps Matthew 7) | Variant X (cuts Matthew 7) |
|---|---|---|
| Answer clarity | 4/5 | 4/5 |
| Said, in role-play, it would watch to the end (not audience data) | Yes | Yes |
| Swipe risk | The Delilah retelling; "felt it around the Jesus line" | The Delilah retelling |
| Preachy or threatening | "Gifted… / I never knew you back to back stop the story to deliver a sermon… feels like a threat"; "wouldn't send it to a non-church friend" | "Gifted…" line "close" to a sermon |
| Weakest line | "His faith is what Hebrews names" (since replaced); also said "Earlier… Now…" "drags a little" | "Earlier… Now…" |
| Would send to | A worship-leader friend who says "God's still blessing it" | The same |

**The v59 ESV check:**
- The new answer line verified (option 2).
- "His faith is what Hebrews names" was an overclaim (Hebrews describes the group), so it is dropped.
- After the cuts, "he prayed" became ambiguous (the nearest "he" is Jesus or God), so it becomes "Samson prayed".

## 2. Script changes (v57 → v59 draft)

| # | Change | Saves / adds | Needs recording? | Why |
|---|---|---|---|---|
| 1 | Cut "But Samson's story doesn't end there." | −2.8 s | No | A signpost; a swipe point |
| 2 | "…his captors, **he** prayed" → "…his captors, **Samson** prayed" | 0 | **Yes**: one short phrase, spliced before the original quote | After cut 1 the pronoun reads as Jesus or God |
| 3 | Cut "His choices had cost him his eyes and his freedom." | −3.8 s | No | A recap ("Blinded" just said it); the weakest line in v57 |
| 4 | Cut "And the Bible adds: 'So the dead whom he killed…'" and its card | −7.5 s | No | The v57 viewer was confused by the 16:30 wording; it proves nothing for the question |
| 5 | Cut "Samson's last act began with a prayer." | −3.0 s | No | Overclaim: he asked to feel the pillars (16:26) before praying (16:28) |
| 6 | **New** re-ask + answer before the closing question: "So does God still using you mean He's okay with how you're living? Samson's strength never proved that. But even at his lowest, he could still call on God." | +11 s | **Yes** | v57 never answered "was God okay with him?" at the end; the hits re-ask the hook at 82–89%; the hope line points at the prayer the viewer saw |
| 7 | **Your decision:** cut the Matthew 7 warning (variant X) | −8.9 s | No | Both simulated (AI) viewers who heard it called it a threat or a swipe point (v57 viewer, v59 variant K); the editor says Matthew 7 says people claim the works, not that God did them; "the LORD had left him" carries the warning |

**Runtimes as recorded** (cuts plus the two pick-up lines):

| Variant | As recorded |
|---|---|
| X (cut Matthew 7) | **about 123 s** |
| K (keep it) | about 132 s |

The 7% speed-up sample (`options/tempo/`) would take about 8 s more off. But your Oct 29 rule says "never time-stretch words; get pace from pauses". That rule was about slowing a voice down, and a speed-up is still a time-stretch. So it's only an option if your ear says yes; the plan doesn't count on it.

**Further trims if you want it tighter** (pure cuts):
- "Earlier, he had assumed he would escape. Now, he asked God for strength." −5.8 s. Your line; one v59 viewer called it the weakest, and the other said it "drags a little".
- "You can be gifted, lead, and help people." −3.4 s. One v59 viewer called this line "close" to a sermon; it also drops a "you" line.

## 3. What to record (ElevenLabs, same voice and settings as the v57 take)

Paste file: `v59_recording.txt`. Two pieces:
1. `Blinded and brought out to entertain his captors, Samson prayed,`
   - Spliced onto the original take's "'O Lord GOD, please remember me…'".
   - Generate 3 takes and pick the one whose ending pitch rises into the quote.
2. `So does God still using you mean He's okay with how you're living? ... Samson's strength never proved that. ... But even at his lowest, he could still call on God.`
   - The ellipses are short pauses.
   - The question rises at its end; "never proved that" falls; "call on God" lands softly.

After recording:
1. Splice the pieces (`tools/` audio steps in `system/04_voice.md`).
2. Re-align the word times (`film27/tools/words_from_voice.py` → `make_vo.py`).
3. Re-time `score_v59.js` from them.
4. Run `node tools/shotlist_check.js` again.

## 4. Still open in the script (for Ep 2 on, or a re-record of Ep 1)

The checker still WARNs about:
- **The hook is about "you" and names no Bible person.** The hits ask about a named person in the third person.
- **The turn starts around 56 s.** The hits turn by 25 s.
- **5 "you" lines.** The re-ask adds one, because the hook itself is second person.
- **The core answer starts at about 53%** of the runtime (the hits: 33–50%), and story lines, counted across all sections, are still near half the runtime (your cap: ~40%). Both need a tighter re-recorded script; cuts alone can't move them further.
- **335 words** (budget 230–300).
- **A 19-word closing question.** Both v59 viewers called the three-option question "engagement bait".

- **"Then he pushed against the pillars"** (the locked v57 audio). The ESV verbs are "leaned his weight against them" and "bowed with all his strength" (16:29–30). The picture now follows the ESV (P1); on any re-record, say "leaned… bowed".
- **The M4 insert of a cloth over his eyes** is an addition (16:21 names no cloth). It avoids showing the gouging; Marcus to OK.

Fixing these means a re-recorded script. `system/02_story_and_script.md` has the pattern for Ep 2.
