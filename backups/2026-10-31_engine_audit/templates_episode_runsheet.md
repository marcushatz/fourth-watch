# Ep [N] [Name] · run sheet

**Use this when** an episode starts. Copy it to `ep[NN]-[slug]/runsheet.md` and tick each line as it's done. It is the episode's own record of which gates it has passed. A future session (or Marcus, back from a break) reads this first to see where the episode stands.

Rules for using it:
- A gate is passed only when its "Pass when" line is true. Write the date and the evidence (a file path or a report line) next to the tick.
- **Marcus's gates are his.** A line marked **(Marcus)** is ticked only after he says yes in chat. Quote his words and the time.
- If a later change touches an earlier stage (a script edit after the shot list, a re-record), un-tick every stage after it and run them again.
- Guides: `README.md` (the pipeline table) and `system/00`–`11`. The commands below assume the project root `/home/claude/fourth-watch` unless they say `film*/`.

---

## Status

| Stage | State | Date | Evidence |
|---|---|---|---|
| 1 Question | ☐ | | |
| 2 Script | ☐ | | |
| 3 Review | ☐ | | |
| 4 Shot list | ☐ | | |
| 5 Motion draft | ☐ | | |
| 6 Voice | ☐ | | |
| 7 Sound | ☐ | | |
| 8 Render + QA | ☐ | | |
| 9 Publish | ☐ | | |
| 10 7-day review | ☐ | | |

**Open decisions for Marcus** (move each to `DECISIONS.md` while it's open):
-

---

## 1. The question (`system/01_topic_selection.md`)
- [ ] Picked from `research/episode_bank.md`, or a new card written there with all five scores.
- [ ] The hook autocompletes on Google today (rule 14 in `research/script_rules_from_hits.md`).
- [ ] Not a topic a reference channel made in the last year, or a clearly different angle on it.
- [ ] **(Marcus)** picked it from the top 3.

**Pass when:** Marcus has picked it, and the card's quotes are marked for re-checking at script lock.

## 2. The script (`system/02_story_and_script.md`, `templates/episode_template.md`)
- [ ] `answer:` written first, then three things most viewers don't know, each with a verse.
- [ ] The beat sheet: hook ≤ 5.5 s, a sharpen, the turn by ~25 s, the core answer at 35–50%, 2–4 new evidence beats, the re-ask at 75–90%, a closing question ≤ 17 words.
- [ ] 230–300 words; ≤ 3 "you" lines; every quote followed by what it proves.
- [ ] No implied events stated as fact; nothing called "last" unless the text makes it last; no collective description applied to one person; the viewer is never assumed to have strayed.
- [ ] `python3 fw_check.py script ep[NN]-[slug]/episode.md --out ep[NN]-[slug]/qa/script_v1`: 0 FAIL, every WARN read.

**Pass when:** 0 FAIL and every hit-structure WARN either fixed or explained in one line.

## 3. Review (`system/03_script_review.md`, `prompts/A–D`, `F` for a choice)
- [ ] A: ESV fact-check: every line VERIFIED, every CORRECTION and OVERCLAIM applied.
- [ ] B: a first-time viewer (fresh agent, no tools) restates the answer, ≥ 4/5, and lists ≥ 3 new things.
- [ ] C: cold editor: no stretch called slow; nothing "preachy" left unanswered.
- [ ] D: director: every line has a picture; rhyme between hook and ending named.
- [ ] Changes merged; Marcus's standing rules (`research/feedback_rules.md`) win over any reviewer.
- [ ] Checker re-run after the merge.
- [ ] **(Marcus)** approved the script. Quote his words here:

**Pass when:** all of the above, and the approved text is saved as `episode.md` (older drafts keep their version suffix).

## 4. The shot list (`system/05`, `06`, `06b`, `07`, `templates/shotlist_template.md`, `prompts/E`)
- [ ] Word times estimated: `python3 film*/tools/make_vo.py` (writes `vo.js` from `episode.md`).
- [ ] A row for every clause: the act on its word, a change about every 2 s, size + angle + reason.
- [ ] The angle pass (06 §8): ≤ 60% plain eye-level MS/WS; ≥ 3 CU; ≥ 3 inserts; ≥ 2 low; ≥ 2 high; no jump cuts; runs on one set use ≥ 3 positions.
- [ ] The colour script (06b §4) and the rhymes (hook ↔ ending, `callback: true`).
- [ ] Picture fact-check: every VISUAL claim checked against the text (prompt A with the VISUAL lines).
- [ ] E: a fresh shot-plan reviewer has read it; top fixes applied.
- [ ] `node tools/shotlist_check.js ep[NN]-[slug]/film[NN] --score score.js --out ep[NN]-[slug]/qa/shotlist.md`: 0 FAIL, every WARN explained.
- [ ] **(Marcus)** has seen the table and the open decisions, and approved it.

**Pass when:** 0 FAIL, the angle pass done, Marcus approved. **No overnight build before this line is ticked** (Round 15).

## 5. The motion draft (`system/07_motion_and_acting.md` §7)
- [ ] The first 30 s rendered at half resolution: `cd film[NN] && CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node engine/render.js clip 0 30 2 --draft`.
- [ ] Beat clock run on it: `python3 tools/reference_study/beatclock.py <clip.mp4>`. A beat about every 2 s; under 30% of the time in gaps over 4 s (Lintel's hits: about 20%); no gap over 6 s except one planned hold.
- [ ] Looked at 4–6 frames per shot (not only the contact sheet).
- [ ] **(Marcus)** watched it.

**Pass when:** Marcus has watched it and his notes are applied.

## 6. The voice (`system/04_voice.md`)
- [ ] **(Marcus)** recorded the take in ElevenLabs with the locked voice and settings, or approved a recording session. Plan noted (decision 9 in `DECISIONS.md`).
- [ ] Pace 2.7–3.0 words/s over the voice; no time-stretching (Oct 29 rule).
- [ ] Real word times: `python3 film[NN]/tools/words_from_voice.py ep[NN]-[slug]/episode.md <words.json> <flat_words.json>`, then `python3 film[NN]/tools/make_vo.py --words <flat_words.json>`.
- [ ] The score re-timed from `vo.js`; `tools/shotlist_check.js` re-run with 0 FAIL.

**Pass when:** `vo.js` comes from the real take and the shot list still passes.

## 7. Sound (`system/08_sound.md`)
- [ ] A soft, steady, even bed (LRA about 3 LU): a dip at the turn, never silence.
- [ ] A sound planned for every beat; impacts only where something hits.
- [ ] Loudness −14 LUFS integrated, true peak ≤ −1 dBTP: `node engine/tools/levels.js out/music.wav`.
- [ ] **(Marcus)** listened.

## 8. Render and QA (`system/09_render_and_qa.md`)
- [ ] Full render: `node engine/render.js video` (minutes; run in the background), then `mux`.
- [ ] `python3 fw_check.py video --video out/<ep>.mp4 --script episode.md --subs out/<ep>.srt --out qa/video`: 0 FAIL.
- [ ] Looked at `qa/video/sheet.png`, `issues.png`, `firstlast.png`.
- [ ] The critic (`toolkit_page/fw_critic.md`, `fw_review.py`): ≥ 8 on all 9 criteria, at least 3 rounds.
- [ ] Tail ≤ 4.5 s after the last word; hook change by 1.3 s; nothing on screen against the ESV.
- [ ] **(Marcus)** watched the full cut and said it's ready. "Passes the checker" is not "good" (Round 15).

## 9. Publish (`system/10_publish_and_growth.md` §8)
- [ ] Every line of the publishing checklist ticked (cover, caption, ESV notice, AI label, ≤ 5 hashtags, pinned comment).
- [ ] **(Marcus)** posted it (Claude never posts).
- [ ] A row added to `system/publish_log.csv` with the input fields.

## 10. The 7-day review
- [ ] 24 h, 72 h and 7 d numbers in the log.
- [ ] `templates/postmortem_template.md` filled in as `ep[NN]-[slug]/postmortem.md`.
- [ ] One line in `system/11_lessons_log.md`; any rule Marcus states goes into `research/feedback_rules.md`.
