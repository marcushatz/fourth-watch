# Bronze Serpent test: evaluation (Nov 2, 2026)

**Verdict:** reference material only. Not for release. Marcus judged the animation unacceptable: "The characters look childish, the compositions are simplistic, and the visual storytelling is too literal."

**What it is:** a 31.6 s `/content-factory` run. Every frame was drawn in code with Higgsedit. One Eleven v4 voice take cost 2.76 credits.

**Assets (Higgsfield IDs):**
- Video: media `2c1dae11-d173-4afa-a92f-b1a94cf44804`
- Voiceover: job `d7cbabfb-8600-4a08-84c1-6b03f5782525`

**Script problem:** the narration is an 86-word test script written during the run. It isn't the approved `script_approved_v4.md`. Content Factory takes a prompt, and the session didn't read this folder first. The test script is in `test_script.md` for the record. It must not replace v4.

## Scorecard

Measured items are marked (M). The rest are judgments.

| Area | Result | Evidence |
|---|---|---|
| Biblical fidelity | **FAIL** | See below |
| Information density | **FAIL** | Three ideas in 31 s (M), but it omits v4's calf reversal and John 3:16 link |
| Visual coherence | **FAIL** | Consistent, but generic. The same sun-disc layout fills about 23 of 32 sampled seconds (M) |
| Character consistency | **FAIL** | Designs repeat, but they are childish and have no acting |
| Pacing | **FAIL** | 15 shots, median 2.1 s (M), four under 1 s (M), As/So 4.2 s and the final shot 4.1 s (M) |
| Audio | **PASS** | −14.1 LUFS, LRA 2.2 LU, −1.4 dB peak (M). 86 of 86 words matched (M). The mix hasn't been judged by ear |
| Typography | **FAIL** | Off-brand fonts, captions mid-frame, verse cards over the action. Text is legible |

Format: 1080×1920, 30 fps, 31.6 s (M).

## Fidelity problems

| Time | Problem | Rule or text |
|---|---|---|
| 0–3.5 s | Hezekiah smashes the serpent in the wilderness | The text gives no such setting. The location isn't stated |
| 12.7–14.8 s | A kneeling crowd rocks forward, with no offerings shown | Round 28: "offerings", not prostration |
| 16.9–19 s | "It was only ever a sign" | Not stated in the text |
| 19.2–20.4 s | Jesus and Nicodemus on open dunes | Only "by night" is given (John 3:2). Staging is unsupported |
| 20.5–24.4 s | Spoken quote drops "in the wilderness" | Flagged before voicing |
| 27.5–31 s | "Don't worship the sign" | Points at the viewer |
| Whole video | No spoken ESV credit, no end card | Canon requirement |

The verse cards match the ESV text checked on Nov 2: Numbers 21:8 and 2 Kings 18:4.

## What to keep

See `production/09_approved_and_rejected.md`.

## Source kept here

- `fx.jsx`: Higgsedit helpers for shots, shake, flash, sparks, type and word-timed captions.
- `sfx.py`: the synthesized bed and sound hits.
- `words.json`: word timings for the test take.

They are working code for the test, not approved visual style. `fx.jsx` imports the test's `lib.jsx`, which held only drawing helpers and isn't kept.
