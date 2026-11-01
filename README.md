# Fourth Watch: the production system

**What this is:** everything needed to make a Fourth Watch reel that holds viewers, tells the story well, looks and sounds right, and is accurate to the ESV. Start here. Every stage has one file. Every file says when to use it.

**The order of work:**
1. Topic
2. Script
3. Review
4. Shot list (on estimated word times)
5. Motion draft
6. Voice (Marcus's Oct 28 order puts the voice last; the shot list is then re-timed to the take. Check the order with him for each episode)
7. Sound
8. Render and QA
9. Publish
10. Learn

**Start here when you come back:** `DECISIONS.md` (everything waiting for Marcus), then the episode's `runsheet.md` (`templates/episode_runsheet.md`), then the file for the stage you're at. Unfamiliar term: `system/glossary.md`.

**The gates:**
- Nothing is animated before Marcus approves the script and the shot list.
- Nothing is rendered in full before he has watched a motion draft.
- Nothing is posted before QA passes.

## The pipeline

| # | Stage | Read | Tools | Gate |
|---|---|---|---|---|
| 0 | Know the channel | `system/00_series_canon.md` | — | — |
| 1 | Pick the question | `system/01_topic_selection.md`, `research/episode_bank.md` | Web search (demand check) | Marcus picks from the top 3 |
| 2 | Write the script | `system/02_story_and_script.md`, `templates/episode_template.md` | `python3 fw_check.py script episode.md` | 0 FAIL; hit-structure and value WARNs read (Value items spoken, repetition, signposts, lines with nothing new) |
| 3 | Review it | `system/03_script_review.md`, `prompts/A–D` (+F for a decision), `tools/script_judge/rubric.md` | The `fw-script-review` skill, then the blind judge panel and `fw_check.py script episode.md --judge <run>` | A simulated (AI) viewer restates the answer at ≥ 4/5; the judge panel says GOOD ENOUGH (craft, not a forecast of views); Marcus approves |
| 4 | Plan the shots | `system/05_shot_list.md`, `system/06_camera_and_angles.md`, `system/06b_frames_light_and_sets.md`, `system/06c_shot_recipes.md`, `system/07_motion_and_acting.md`, `templates/shotlist_template.md`, `prompts/E` | `node tools/shotlist_check.js` | 0 FAIL; the angle pass; picture fact-check; Marcus approves |
| 5 | The motion draft | `system/07_motion_and_acting.md` §7 | `node engine/render.js clip 0 30 2 --draft`; `tools/reference_study/beatclock.py` | Marcus watches it |
| 6 | Record the voice | `system/04_voice.md` | ElevenLabs (Marcus); `film27/tools/words_from_voice.py`, `make_vo.py` | Pace 2.7–3.0 words/s; `vo.js` from real word times; the shot list re-timed and re-checked |
| 7 | Sound | `system/08_sound.md` | `song.js`, `engine/tools/levels.js`, `tools/reference_study/audiostudy.py` | −14 LUFS; full low bed; a sound on every beat; Marcus listens |
| 8 | Render and QA | `system/09_render_and_qa.md` | `fw_check.py video`, `toolkit_page/fw_review.py`, `toolkit_page/fw_critic.md` | 0 FAIL; critic ≥ 8 on all 9 criteria; ≥ 3 rounds |
| 9 | Publish and learn | `system/10_publish_and_growth.md`, `system/11_lessons_log.md` | Instagram / YouTube / TikTok (Marcus posts) | The publishing checklist; the post log filled in |

## The rules (binding, in order of authority)

1. `research/feedback_rules.md`: Marcus's own rules, round by round. They win every conflict.
2. `research/direction_rules.md` (v2.1, audited): how a script becomes shots, measured on 24 Shorts across three channels. Tagged [ALL] / [2 CH] / [THIN] / [HOUSE].
3. `research/script_rules_from_hits.md`: 14 checkable script rules from 13 Lintel Shorts.

## The evidence

- `research/lintel_ref/yt/*.md`, `_patterns.md`: 12 Lintel Shorts, shot by shot.
- `research/lintel_ref/ref1.mov`, `ref2.mov`: two Lintel screen recordings (Methuselah, Suffering).
- `research/other_ref/_crosscheck.md` (+ per-video files): Bible Animations and BibleProject, hits against lows.
- `research/beat_clock_compare.png`: how often something changes on screen, Lintel vs Ep 1.
- `research/lintel_study_10.md`, `research/master_scriptwriting.md`, `research/transcripts.md`: earlier script studies.

## The tools

| Tool | Does |
|---|---|
| `fw_check.py` | The checker. Script mode: structure, accuracy flags, the hit structure. Video mode: format, loudness, captions, voice, safe areas, verse cards, shot rhythm, visual beat clock, hook, tail. Fingerprint on the toolkit page |
| `tools/shotlist_check.js` | The shot-list gate: rhythm, the planned beat clock, picture-per-clause fields, camera jobs, hook, verse holds, tail |
| `toolkit_page/fw_review.py` | The review pack: contact sheets, phone test, safe zones, caption swaps, shot strips |
| `toolkit_page/fw_critic.md` | The critic brief: 9 scores with caps, 23 failure modes |
| `tools/reference_study/` | Measure any reel: `fw_shot_probe.js` (in the browser), `shotstats.py`, `strips.py`, `beatclock.py`, `audiostudy.py` |
| `prompts/` | The reviewer briefs A–G |
| `templates/` | The episode script, shot list, run sheet (gates per episode) and 7-day post-mortem templates |
| `system/publish_log.csv` | The post log: one row per episode per platform (header only until the first post) |
| `system/glossary.md` | Every term the system uses, with where it's defined |
| `tools/make_manifest.py` | The release manifest: every file in a release with its hash, the tool fingerprints, the environment, and consistency checks (script = `vo.js`, score loads, `song.js`/`music.wav` are the declared ones). Specs: `ep*/release_vNN.json` |
| `tools/check_env.py`, `ENVIRONMENT.md`, `requirements.txt` | The pinned tool versions, and a check of this machine against them |
| `tests/checkers/` | Checker test clips with planted faults (`run_tests.py`); must pass before any checker change ships |
| `system/12_engine_guide.md` | How the animation engine works and how to start a new episode in it |
| `ep01-samson/film27/` | The animation engine (scenes, cards, rig, score, song). Contract: `scenes/_API.md`; rig: `lintel/PP2_API.md` |

## Episodes

- **Ep 1 Samson:**
  - `ep01-samson/episode.md`: v57, locked.
  - `episode_v59_draft.md`, `v59_plan.md`, `shotlist_v59.md`, `v59_recording.txt`: the Oct 31 proposal.
  - `episode_v60_draft.md`, `v60_plan.md`, `shotlist_v60.md`, `v60_recording.txt`: v59 with Marcus's picks and the accuracy fixes (the current version; waits for the pick-ups).
  - `releases/v57/MANIFEST.md`: the last rendered release, as a consistent set.
  - `qa/`: review rounds.
- **Ep 2 is Jonah** (Marcus, Oct 31): `ep02-jonah/episode_v5_draft.md` waits for his approval of the script. The rest of this entry is history: Ep 2 was not picked before then. `research/episode_bank.md` has 20 researched questions (top three: Jonah, the forty years, Uzzah). Earlier Judas drafts are in `ep02-judas/` (Judas is also a Lintel topic). Decision 12 in `DECISIONS.md`.
- **Ep 2 Jonah (worked example, not picked):** `ep02-jonah/` runs the bank's #1 through the script stage of the system (checker, ESV fact-check, simulated AI viewer, saved replies in `qa/round*/`). It shows the system working end to end on a new topic.

**Backups:** files replaced during an edit keep a version suffix beside them (`_v1`, `_pre_…`) or go to `backups/<date>_<reason>/`.

## Where copies live

- **The Fourth Watch Toolkit page** (claude.ai artifact): the checker and every system file at these same paths, with fingerprints. A fresh session restores from there.
- **The Fourth Watch playbook doc** (claude.ai doc): the human-readable summary.
- **The skills** `fourth-watch-showrunner` and `fw-script-review` run the loops.
- **The engine and episode media** live only in this workspace. A private GitHub repo would protect them; it needs Marcus's OK.
