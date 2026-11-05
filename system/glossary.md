# Glossary: the words this system uses

**Use this when** a term in a guide, a checker report or a review isn't clear. Each entry says what the word means here and where it's defined in full.

## Story and script

| Term | Meaning | Defined in |
|---|---|---|
| **ASK THE TEXT** | The main series: a question people really search, answered from the Bible's own words | `00_series_canon.md` |
| **Hook** | The question, fully spoken in the first ~5.5 s. Third person, naming a Bible person or object, ≤ 15 words | `02` §6 |
| **Sharpen** | One concrete Bible fact in the next few seconds that makes the question harder | `02` §2 |
| **Turn** ("But notice…") | The overlooked detail that changes how the question looks. Lands by ~25 s | `02` §2 |
| **Core answer** | The answer, in plain words and the hook's own terms, at 35–50% of the runtime | `02` §2 |
| **Evidence beats** | 2–4 new facts in the second half that prove the answer. Not a recap or a retelling | `02` §2 |
| **Re-ask** | The hook's words again at 75–90%, followed by a one-line answer that carries hope | `02` §2, §7 |
| **Closing question** | A real, short question at the end (≤ 17 words) that viewers answer in the comments. Not homework | `02` §7 |
| **`answer:` line** | The one-sentence answer, written before any other line of the script | `templates/episode_template.md` |
| **Value list** | Three things most viewers don't know, each from the text | `02` §1 |
| **The drag list** | The patterns that make a reel feel slow (retelling the famous part, recaps, sermon voice, quotes that prove nothing) | `02` §3 |
| **"You" line** | A line that addresses the viewer. At most 3 per script, and never about the viewer's conduct | `02` §4 |
| **Implied event** | Something the text suggests but doesn't say happened ("God answered"). Never stated as fact | `research/feedback_rules.md` |
| **Overclaim** | A line that says more than its verse (e.g. "always", "last") | `prompts/A_esv_factcheck.md` |
| **Pick-up line** | A short new recording spliced into an existing take | `04_voice.md` |

## Picture and motion

| Term | Meaning | Defined in |
|---|---|---|
| **Beat** | A visible change on screen: a pose, an entrance, a light change, a card, a camera arrival | `05` §2, `07` §4 |
| **Beat clock** | The measured gaps between beats. Lintel's hits: one beat every 2.0–2.4 s; target dead time under 30%, no gap over 6 s except one planned hold | `research/direction_rules.md`, `tools/reference_study/beatclock.py` |
| **Dead time** | The share of the runtime sitting in gaps over 4 s with no visible change below the captions. WARN over 30% (Lintel's hits: about 19–21%; Ep 1 v57: 47%) | `fw_check.py` `direction_qa` |
| **Shot list** | The plan, one row per shot: words, what happens, size + angle + move, text on screen, new engine work | `05` §1 |
| **Act** | The verb a character performs, on its word, with a rig pose | `05` §2, `07` §2 |
| **Size** | XWS, WS, MS, MCU, CU, INS (insert = one object) | `06` §1 |
| **Angle** | Eye level, low, high, top-down, OTS (over the shoulder), POV | `06` §1 |
| **Angle pass** | The check that sizes and angles vary: ≤ 60% plain eye-level MS/WS; ≥ 3 CU; ≥ 3 inserts; ≥ 2 low; ≥ 2 high | `06` §8 |
| **Jump cut** | Two neighbouring shots with the same size and angle. Not allowed | `06` §4 |
| **Rhyme / callback** | An image that returns changed (the gate posts in the hook become the pillars at the end) | `06` §2 |
| **Match cut** | A cut that keeps a shape in the same place across two shots | `06` §5 |
| **Colour script** | The planned colour and light of every section before any shot is built | `06b` §4 |
| **Two lights** | Gold from the upper left only where the text says God acted; ember for people's own choices | `00_series_canon.md`, `07` §6 |
| **Verse card** | An ESV quote on screen with its reference. Holds 3.5–5 s, or longer only with marks | `05` §4 |
| **Marks** | Phrases in a held verse card that turn gold or ember on their spoken word | The storyboard |
| **Pill / tag** | A small name label with a one-line frame ("GAZA · A PHILISTINE CITY") | `05` §4 |
| **Counter, tally, stamp, bubble** | Card devices: a number that counts; ✓ ✓ ✓ ✗; a verdict stamp; a speech bubble on the speaker | `05` §4 |
| **Motion draft** | A half-resolution render of the first 30 s, shown to Marcus before any full render | `07` §7 |
| **Tail** | Time on screen after the last spoken word. Target ≤ 4.5 s, fail over 7 s | `09` §3 |
| **Safe frame** | The phone-screen zones that buttons and captions cover. Subjects sit 38–60% down | `06` §6 |
| **Billboard** | A flat character card that turns to face the camera. Keep the camera within ±35° of its front | `06` §7 |

## Engine and tools

| Term | Meaning | Where |
|---|---|---|
| **`PRE`** | The 0.08 s lead: a cut lands just before its word | `05` §3 |
| **`fw_check.py`** | The checker: `script` mode lints a script, `video` mode checks a render | `README.md` |
| **WARN / FAIL** | Checker results. A FAIL must be fixed; a WARN must be fixed or explained in one line | `09` §2 |
| **Draft / HQ** | Render quality flags: `--draft` is half resolution for quick looks; `--hq` is final | `09` §1 |

## Review and decisions

| Term | Meaning | Where |
|---|---|---|
| **Reviewers A–G** | ESV fact-check, simulated first-time viewer, cold editor, director, shot-plan reviewer, variant test, evidence audit | `prompts/` |
| **Variant test** | Two fresh simulated (AI) viewers, each hearing one version once, to compare confusion and slow lines between versions. Not audience data | `prompts/F_variant_test.md` |
| **Judge panel** | Three blind AI judges who score a script beside 9 Lintel reels with known views. Their verdict (GOOD ENOUGH / NOT YET) is a craft bar, not a forecast of views | `tools/script_judge/rubric.md`, `03_script_review.md` step 5b |
| **Craft bar** | The judge panel's pass line: Overall at least the best reference reel's, Hook, Payoff and New value 4+, nothing under 3 | `tools/script_judge/rubric.md` |
| **Fresh agent** | A reviewer that has never seen a draft and has no tools, so it can't read earlier versions | `03_script_review.md` |
| **Round** | A batch of Marcus's feedback, logged in `research/feedback_rules.md`. Rounds are binding | `research/feedback_rules.md` |
| **Tags [ALL], [2 CH], [THIN], [HOUSE]** | How strong a direction rule's evidence is: every channel, two channels, thin evidence, or our own choice | `research/direction_rules.md` |
| **Gate** | A point the work can't pass without a check, and for the marked ones Marcus's yes | `templates/episode_runsheet.md` |

## Publishing

| Term | Meaning | Where |
|---|---|---|
| **Skip rate** | The share of viewers who swipe away in the first 3 s (Instagram Insights) | `10` §2 |
| **Sends per reach** | Shares by DM ÷ accounts reached. Mosseri names sends as a top signal for reaching new people | `10` §1 |
| **Non-follower reach** | The share of reach from people who don't follow you. Near zero means an eligibility problem | `10` §2 |
| **Trial reel** | An Instagram reel shown first to non-followers only | `10` §4 |
| **AI label** | Instagram's "AI info" label, required for a realistic AI voiceover | `10` §7 |
| **ESV notice** | Crossway's required copyright notice in every caption, plus a verbal credit on video | `10` §3 |
| **Post log** | `system/publish_log.csv`: one row per episode per platform | `10` §9 |
