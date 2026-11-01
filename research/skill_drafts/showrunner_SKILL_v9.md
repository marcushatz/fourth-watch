---
name: "fourth-watch-showrunner"
description: "Run a Fourth Watch Bible reel from question to post with the project's production system: script and story first, then shot list, motion draft, voice, sound, render, QA and the 7-day review, with Marcus's gates."
---

# Fourth Watch — showrunner

Use this before ANY Fourth Watch work: a new episode, a revision, a render, a review, or when Marcus comes back from a break. The detail lives in the project's production system (one guide per stage). This skill is the router: where to start, the gates, the rules that bind, and how to restore the system in a fresh workspace.

**Marcus's priority (Round 16, Oct 31):** the script and story must be good enough for the viewer and must never feel slow. The visuals still matter, but story and pace come first when they compete.

**Round 18 (Oct 31):** the script check judges value, not only form. Every script passes the value checks in `fw_check.py` and the blind AI judge panel before Marcus sees it. The panel is a craft bar: it can't predict views, so never present it as one.

## 0. Where to start

In the project folder (`/home/claude/fourth-watch` when it exists):
1. **`DECISIONS.md`**: everything waiting for Marcus, with the exact wording, the evidence and a recommendation. When he answers, log it as a new round in `research/feedback_rules.md` and update the file it names.
2. **`README.md`**: the pipeline table (stage → guide → tool → gate), the rules in order of authority, the evidence, the tools.
3. **The episode's `runsheet.md`** (copied from `templates/episode_runsheet.md`): which gates this episode has passed.
4. **The guide for the current stage**, in `system/`:
   - `00_series_canon`, `01_topic_selection`, `02_story_and_script`, `03_script_review`, `04_voice`;
   - `05_shot_list`, `06_camera_and_angles`, `06b_frames_light_and_sets`, `06c_shot_recipes`, `07_motion_and_acting`, `08_sound`;
   - `09_render_and_qa`, `10_publish_and_growth`, `11_lessons_log`, `12_engine_guide`, `glossary`.
5. **The reviewer briefs** in `prompts/` (A ESV fact-check, B simulated first-time viewer, C cold editor, D director, E shot-plan review, F variant test, G evidence audit) and the **templates** in `templates/`.

### Restoring the system in a fresh workspace

Everything except the animation engine and media is published on the **Fourth Watch Toolkit page**, https://claude.ai/artifact/JyTKFVjpgxF4aRMfrMzt9m, at the same paths as the project folder.
1. List the files: Artifact tool, `action: "list"`, `scope: "files"`, that `url`.
2. Read them with `action: "read"` and `paths` (up to 256 per call). At minimum:
   - `README.md`, `DECISIONS.md` if listed, every `system/*.md`, `prompts/*.md`, `templates/*.md`;
   - `research/feedback_rules.md`, `research/direction_rules.md`, `research/script_rules_from_hits.md`, `research/episode_bank.md`;
   - `fw_check.py`, `tools/shotlist_check.js`, `fw_review.py`, `fw_critic.md`;
   - everything under `tools/script_judge/` (the judge panel, with `calibration/refs.json`);
   - `ENVIRONMENT.md`, `requirements.txt`, `tools/check_env.py`, `tools/make_manifest.py`, and everything under `tests/checkers/`.
3. Copy them into a folder with the same layout. Check the fingerprints in §6 with `sha256sum`, then run `python3 tools/check_env.py` (pinned versions) and `python3 tests/checkers/run_tests.py` (the checker test clips). If a checker's fingerprint differs or the fetch fails, stop and ask Marcus to re-share the page or attach the file. **Never rebuild a checker from memory.**
4. The engine (`ep01-samson/film27/`) and the voice takes live only in the original workspace. The toolkit has the engine's contracts (`scenes/_API.md`, `lintel/PP2_API.md`) and `score_v58.js`, not the engine itself. If it's gone, say so plainly and ask Marcus before rebuilding anything.

## 1. The order of work and the gates

| # | Stage | Guide | Gate |
|---|---|---|---|
| 1 | Pick the question | `01`, `research/episode_bank.md` | **Marcus picks** from the top 3 cards |
| 2 | Script | `02`, `templates/episode_template.md` | `fw_check.py script`: 0 FAIL, every WARN read |
| 3 | Review | `03`, `prompts/A–D` (+F for a choice); the `fw-script-review` skill; the blind judge panel (`tools/script_judge/rubric.md`) | A simulated (AI) viewer restates the answer at ≥ 4/5; `fw_check.py script --judge <run>` PASS (GOOD ENOUGH: craft, not a forecast of views); **Marcus approves the exact wording** |
| 4 | Shot list (on estimated word times) | `05`, `06`, `06b`, `06c`, `07`, `prompts/E`, `templates/shotlist_template.md` | `tools/shotlist_check.js` 0 FAIL; the angle pass; picture fact-check; **Marcus has seen and approved it** |
| 5 | Motion draft (first 30 s, half resolution) | `07` §7 | **Marcus watches it** |
| 6 | Voice | `04` | **Marcus records** in ElevenLabs; the shot list re-timed to the real take and re-checked |
| 7 | Sound | `08` | −14 LUFS, true peak ≤ −1 dBTP; a soft, steady, even bed; **Marcus listens** |
| 8 | Render and QA | `09`, `fw_check.py video`, the critic | 0 FAIL; critic ≥ 8 on all 9 criteria; the release manifest (`tools/make_manifest.py`) reports RELEASABLE; **Marcus says it's ready** |
| 9 | Publish | `10` §8 checklist | **Marcus posts**; a row in `system/publish_log.csv` |
| 10 | Learn | `templates/postmortem_template.md`, `11` | One line in the lessons log |

Marcus's Oct 28 order puts the voice last, so shots are planned on estimated word times (`make_vo.py`) and re-timed to the take. Check the order with him for each episode.

**Never skipped (Round 15):**
- No overnight or full build from a shot list Marcus hasn't seen.
- A low-resolution motion draft before any full render.
- "Passes the checker" is not "good". Look at the frames and watch the motion.
- Every clause is shown happening on its word.
- Every lesson goes into the system files (the guide it belongs to, plus `11_lessons_log.md`).
- If a later change touches an earlier stage, re-run every gate after it.

## 2. The rules that bind (full list: `research/feedback_rules.md`, which wins every conflict)

**How to work with Marcus (Round 17):**
- **Fix technical problems and unsupported Bible details at once,** then report them as fixed. Examples: silent renders, the wrong file version, a detail the text doesn't support. Ask him only about real choices.
- **Show the exact wording for every approval:** the lines, with word counts and the runtime effect. Never ask him to approve a description.
- **Verify rights, terms and labels on the official page,** quote it and date the check. Never offer an option the terms rule out.
- **Call AI reviewers what they are:** "AI fact-checker", "simulated (AI) viewer" and "AI judges". Simulated viewers flag confusion and slow, preachy or unclear lines; judges rate craft. Neither can establish retention, swipes, sharing or views, so never write "every first-time viewer", "would watch to the end" or "will perform" about them.

**Accuracy (ESV only):**
- Quotes word for word, and a quoted verb must match the ESV verb.
- Never state an implied event as fact ("God answered").
- Nothing is called "last" unless the text makes it last.
- No collective description applied to one person.
- Pictures are fact-checked like words: who does what, where and when.
- After any cut, re-check every pronoun.
- History from outside the Bible is allowed only when Marcus asks, said as history ("Historically, …"), with its source on screen, and never placed so that it implies a motive the text doesn't give.

**Toward the viewer:**
- Never assume the viewer strayed; no finger-pointing.
- At most 3 "you" lines, none about the viewer's conduct; comfort lines use "we".
- No churchy stock phrases.
- No spoken intro, no "thanks for watching", no follow/subscribe lines in the voice.
- One closing comment question is allowed. Marcus approved a same-type choice question with answer buttons.

**Structure (from the hits; `02` §2):**
- A third-person hook naming a Bible person or object, fully spoken by 5.5 s.
- The turn by ~25 s; the core answer at 35–50%.
- 2–4 new evidence beats; the re-ask at 75–90%.
- 230–300 words, 90–120 s.
- Story under ~40% (Marcus's cap); the famous part told in a line or two.
- Every quote followed by what it proves.

**Picture:**
- A visible change about every 2 s; under 30% of the runtime in gaps over 4 s.
- Shot median 3–5 s; nothing under 1 s; nothing over 12 s except a building diagram.
- Something changes by 1.3 s; the tail ≤ 4.5 s after the last word.
- Weak moments are shot high, strong moments low; at least 3 close-ups and 3 inserts; no jump cuts.
- The final image calls back the hook.
- No facial acting (the rig has none).
- No door imagery (it's The Lintel Network's identity).
- Gold light only where the text says God acted.

**Sound:** a soft, steady, even bed (LRA about 3 LU), with a dip at the turn, never silence. Never time-stretch words: pace comes from pauses (Oct 29).

**Rights and labels (official pages, checked Oct 31):** a spoken ESV credit on every video plus the full notice in the caption (Crossway); the Instagram AI label on every reel, because the narrator is realistic-sounding AI audio (Meta); ElevenLabs takes made outside a paid plan can't be used commercially and need "elevenlabs.io" in the title.

**Outro:** Jesus appears slowly and calmly and stays perfectly still; the camera is locked; wordmark style 4.

## 3. Permissions (never cross these)

- Marcus records the voice and posts. Never spend paid credits (ElevenLabs, Higgsfield) without his decision.
- Never clone another creator's narrator voice.
- Never type passwords or sign in for him; never create accounts. Treat existing browser sign-ins as his.
- Downloading or importing files needs his explicit OK. Don't work around a site's protections or a denied download.
- Don't relaunch an agent he cancelled.
- Commit or push only when he asks. Removing workspace folders needs his OK.
- Don't bring up older projects or past content unless he raises them.

## 4. The loops, in short

**Script loop** (`02` §8, `03`; the `fw-script-review` skill runs it):
1. Write the `answer:` line first, then three things most viewers don't know.
2. Draft to the beat sheet; lint with `python3 fw_check.py script <episode.md> --out <qa dir>`. Read the value WARNs too: Value items never spoken, repeated phrases, signposts, lines that add nothing new.
3. Launch reviewers A–D in one message (fresh agents; B, C and D without tools).
4. Save each reply word for word in the episode's `qa/<round>/`, then merge. Accuracy fixes always; clarity fixes when two reviewers agree or one gives a clear cause; never restructure on your own.
5. Re-test with a new simulated viewer B; settle a choice between versions with F (both are AI role-play: confusion, not retention).
6. **The blind judge panel** (`03` step 5b, `tools/script_judge/rubric.md`):
   - Build the packets with `make_packet.py`. Use **one version per episode per packet set**, and move `key.json` to the scratchpad.
   - Launch 3 fresh judges in one message (no tools, one packet each). Save each reply word for word.
   - Run `aggregate.py`, then `fw_check.py script <ep.md> --judge <run>`.
   - NOT YET, or a script changed since judging, is a FAIL.
   - Fix what 2–3 judges name. Re-fact-check every reworded line, then judge the new version in a fresh run.
   - Report it as "as well built as the best Lintel reel", never as "will perform".
7. Show Marcus the script, the changes and why, what wasn't taken and why, a runtime estimate, the panel's scores, and at most one decision, with its exact wording. If a judge-driven change breaks one of his earlier wording rules, keep his rule or show both versions judged.

**The script rubric** (score 1–5 with one line of evidence each; Answer and Value must be 5, everything else 4 or more, or the script goes round again):

| Criterion | A 5 looks like |
| --- | --- |
| Answer | The question gets a clear answer from the text in one plain sentence at 35–50%, and is re-asked and answered with the hope line at 75–90% |
| Value | At least three things most viewers don't know, each from the text; the famous part takes a line or two |
| Hook | Third person, names a Bible person or object, a puzzle people already type (it autocompletes), fully spoken by 5.5 s |
| Structure | The turn by ~25 s; story well under ~40%; 2–4 new evidence beats after the answer; no signposts, recaps or explained contrasts (`02` §3) |
| Clarity | A first-time viewer always knows who, where and what; no dusty words outside quotes |
| Concrete | Names, numbers, places or objects in every line |
| Picturable | Every sentence names an action or an object that can be shown happening |
| Accuracy | Everything in §2's accuracy list holds; every picture matches the text |
| Landing | The hope line fits every viewer; the closing question is real and ≤ 17 words |
| Sendable | There is one specific kind of person this is for (a judgment; only real posts show sharing) |
| Tone | Reverent and curious; no sermon voice, mockery, slang or hype |

**Shot loop** (`05` §2):
1. Write one row per clause with `act`, `change`, `beats` on words, size + angle + reason.
2. Do the angle pass (`06` §8), the colour script (`06b` §4) and the rhymes.
3. Send the picture claims to reviewer A; have a fresh reviewer E read the plan.
4. Run `node tools/shotlist_check.js <film dir> --score <score.js> --out <qa/shotlist.md>`: fix every FAIL, explain every WARN.
5. Show Marcus the table, the open decisions and the beat-clock chart.

**Video loop** (`09` §2):
1. Run `python3 fw_check.py video --video out/<ep>.mp4 --script episode.md --subs out/<ep>.srt [--vo-audio voice.wav] --out qa/video`.
2. Look at `sheet.png`, `issues.png` and `firstlast.png`, and at 4–6 frames per shot.
3. Run the critic (`fw_critic.md`, `fw_review.py`) for at least 3 rounds.
4. Fix in the source (score, scene, cards), never by hand-editing outputs.
5. Before handing over: `python3 tools/make_manifest.py <ep>/release_vNN.json` must report RELEASABLE (the script, `vo.js`, the score and the soundtrack belong together).

**Engine:**
- `system/12_engine_guide.md`: the data flow, starting a new episode folder, the score API, scene modules, the rig, the devices, rendering.
- `node song.js` writes the soundtrack and copies it to `out/music.wav`, which `render.js clip` and `mux` read.
- Back up any engine file with a version suffix before changing it, and keep renders deterministic (no `Math.random`).
- Long renders run in the background, one part per job; kill by PID only.

## 5. Quality bars (the numbers)

| Measure | Target | Reference |
|---|---|---|
| Hook spoken | ≤ 5.5 s | Lintel hits ~4.4 s |
| First visible change | ≤ 1.3 s | All 9 hits on three channels |
| Turn | ≤ ~25 s | The top six: 14–25 s |
| Core answer | 35–50% of runtime | The top six: 33–50% |
| Re-ask | 75–90% | Lintel hits 82–89% |
| Words | 230–300 (ASK THE TEXT) | — |
| Speech rate | ≥ 2.6 words/s over the runtime, about 2.7 over the voice | Slowest Lintel hit 2.59 |
| Length | 90–120 s; target 85–135 s, cap 150 s | Lintel hits 84–137 s |
| Beat clock | One beat about every 2 s; < 30% in gaps over 4 s; no gap > 6 s except one hold | Lintel 2.0–2.4 s, 19–21%; Ep 1 v57 2.5 s, 47% |
| Shot median | 3–5 s | Hits 3.2–5.1 s on three channels |
| Tail after the last word | ≤ 4.5 s (FAIL > 7) | Lintel ~3–3.6 s |
| Loudness | −14 LUFS, true peak ≤ −1 dBTP | — |
| Simulated-viewer answer clarity | ≥ 4/5 | AI role-play; flags confusion only |
| Judge panel (craft) | Overall ≥ the best reference reel on the same panel; Hook, Payoff, New value ≥ 4; nothing < 3 | AI judges; consistent (test-retest 0.89) but no link to views shown |

## 6. The tools and their fingerprints

- **`fw_check.py`**, the checker (script and video modes): version 2026-10-31d (value checks and the `--judge` gate), 1,094 lines, 66,120 bytes. SHA-256 `edaaabdd79cda102a19abff249fb6ed86549333f04749d238e2bd2d59bc2b170`.
  - Script mode also WARNs on Value items never spoken (fewer than 3 spoken is a FAIL), phrases said 3+ times, signposts, and lines that add nothing new. `--judge <run>` adds the panel's verdict (NOT YET, or a script changed since judging, is a FAIL).
  - Exit codes: 0 means no FAIL, 1 at least one FAIL, 2 it could not run.
  - Needs: `pip install --break-system-packages -r requirements.txt`, ffmpeg/ffprobe, the tesseract CLI. The speech model (~110 MB) downloads on the first video check. If that is blocked, the check runs and says hearing was limited.
- **`tools/shotlist_check.js`**, the shot-list gate (rhythm, planned beat clock including speech bubbles, verse holds, tail, angle pass, jump cuts): 157 lines, Oct 31 with the bubble-beat fix. SHA-256 `67d3a266653176974dad29aa9694e8bfd3bd9730519c339935f18c3beb3b34d5`.
- **`fw_critic.md`**, the critic brief (2026-10-31c): SHA-256 `1e6ca7fc860e499aaf93c640fe4ca2cc1795e03737b74bbe8f1004af3320ec19`. **`fw_review.py`**: the review pack.
- **`tools/script_judge/`**, the blind judge panel: `rubric.md` (criteria, the bar, results so far), `judge_prompt.md`, `make_packet.py`, `aggregate.py`, `calibration/refs.json` (9 Lintel reels with known views). The pinned hashes are in `tools/check_env.py`.
- **Safeguards:**
  - `tests/checkers/run_tests.py`: 24 checker test clips with planted faults (scripts, shot lists, videos, judge panels); must report 0 problems before any checker change ships.
  - `tools/check_env.py` and `ENVIRONMENT.md`: the pinned versions (Chrome for Testing 153.0.8010.12, three.js r158, Node 22.23, ffmpeg 6.1.1, tesseract 5.3.4, `requirements.txt`) and the tool file hashes.
  - `tools/make_manifest.py <ep>/release_vNN.json`: the release manifest with hashes and consistency checks (script = `vo.js`, the score loads, `song.js` and `out/music.wav` are the declared ones).
- **`tools/reference_study/`**: measure any reel (`beatclock.py`, `shotstats.py`, `strips.py`, `audiostudy.py`, `fw_shot_probe.js`).

**When a checker or guide changes:**
1. Add a fixture that plants the fault in `tests/checkers/make_fixtures.py` and `expected.json`, watch it fail, fix the checker, then run `python3 tests/checkers/run_tests.py` (0 problems).
2. Back up the old file with a version suffix, and update the pins in `tools/check_env.py`.
3. Republish the toolkit page with the new files (read any published file first if the publish asks; `.py` files go up as `text/plain`).
4. Update the fingerprints here and propose the skill update to Marcus.

## 6b. Reading the video report

| Check | Meaning | Fix |
| --- | --- | --- |
| captions = script FAIL | Caption words differ from the VO | Regenerate captions from the VO text |
| sync FAIL / WARN (+x s) | The caption appears x s after the spoken word (negative = before) | Time captions from the real word timings; if every chunk is off by the same amount, shift the whole track |
| caption shown while nobody is speaking | A stale caption over a pause | End each chunk at its last word plus at most 0.5 s |
| voice = script, listen here | The recognizer heard something else | Listen there; names often mishear. Fix real mispronunciations through the pronunciation list (`04` §5) |
| safe area | Text in a zone Instagram covers (red boxes in issues.png) | Move or shrink the text |
| motion: frozen FAIL | A render stall or duplicated frames | Re-render that range |
| motion: nearly still WARN | No visible movement for over 1.5 s | Add a beat; inside a planned hold, explain it in one line |
| rhythm WARN | Median shot outside 3–5 s, a shot over 12 s, or shots per sentence outside 0.8–1.4 | Split long shots on their clauses; merge flickery ones |
| visual beats WARN | Over 30% of the runtime in stretches over 4 s with no change below the captions, or a stretch over 6 s | Land something on a word in each listed stretch: the verb acted, an entrance, a pill, a counter tick, a light change, a camera arrival |
| hook WARN | Nothing moves in the first second, or the question ends after 5.5 s | Start the action at once; tighten the question |
| tail WARN/FAIL | Over 4.5 s after the last caption (FAIL over 7 s) | Start the end card under the last line; keep the logo short |
| loop WARN | Last frame differs from the first | Expected when the reel ends on the logo: explain it in one line |
| loudness | Too quiet or loud; a true-peak FAIL means clipping risk | Normalize to −14 LUFS; limiter at −1 dBTP |
| verse card WARN | The quote wasn't read back intact | Zoom into that frame; fix the spelling to the ESV |

OCR is approximate with stylised fonts. When a text check disagrees with what you see in the frame, trust the frame and say so.

## 7. Handing back to Marcus

- Lead with what he can look at or decide, with the exact wording.
- Report fixes as fixed; ask only about choices.
- Keep every open choice in `DECISIONS.md`.
- Quote reviewers and judges only from saved files, and call them AI reviewers, simulated viewers or AI judges.
- Say plainly what was measured and what was judged.
- Never say something is "good" because it passed a checker, or "will perform" because it passed the judge panel.