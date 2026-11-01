# Decisions waiting for Marcus

**Use this when** Marcus is back. Every open choice in one place, with the evidence and a recommendation. Nothing below has been acted on: no voice recorded, no credits spent, no render started. When he decides, record the answer in `research/feedback_rules.md` (a new round) and in the file named under "Where it lands".

Last updated: Oct 31, 18:25.

---

## A. Ep 1 Samson (v59)

### 1. Keep or cut the Matthew 7 warning ("I never knew you")
- **Options:**
  - **X:** cut it. About 123 s as recorded.
  - **K:** keep it. About 132 s.
- **Evidence:**
  - Every first-time viewer who heard it reacted against it. The v57 viewer said they would swipe there. v59 viewer K said the "gifted…" line and the Matthew line back to back "stop the story to deliver a sermon", called the Matthew line "a threat aimed at me", and said they wouldn't send it to a non-church friend.
  - The cold editor: Matthew 7 says people claim the works, not that God did them, so it doesn't prove the point it's used for.
  - Both variants scored 4/5 on answer clarity. Cutting it loses no clarity.
  - "But he did not know that the LORD had left him" already carries the warning, and both viewers called it the best line.
- **Recommendation:** X.
- **Where it lands:** `ep01-samson/episode_v59_draft.md` (written as X), `v59_plan.md` §2 row 7.

### 2. The outro: A or B
- **A:** Jesus fades in slowly *under* the spoken closing question, is fully still by its last word, and the name holds 2–2.5 s.
- **B:** the reveal becomes a 2.5–3 s logo moment after the question (the v59 shot list assumes B, row Z2).
- **Both keep your rule:** he appears slowly and calmly and stays perfectly still.
- **Evidence:** the v57 ending ran 6.4–7 s after the last word, past every hit measured. Lintel's hits end about 3–3.6 s after it; the other two channels 0–1.2 s. `fw_check` warns past 4.5 s and fails past 7 s.
- **Recommendation:** A if you want the full reveal (it overlaps the question, so no time is added); B if you want the simplest build.
- **Where it lands:** `shotlist_v59.md` row Z2, `system/00_series_canon.md` §5.

### 3. Record the two pick-up lines
- **The lines** (`ep01-samson/v59_recording.txt`):
  1. "Blinded and brought out to entertain his captors, **Samson** prayed," (spliced onto the original quote).
  2. The new re-ask and answer: "So does God still using you mean He's okay with how you're living? Samson's strength never proved that. But even at his lowest, he could still call on God."
- **Needs:** the same ElevenLabs voice and settings as the v57 take. This spends your credits, so it's your call (see 6).
- **After recording:** splice, re-align the word times, re-time `score_v59.js`, run `tools/shotlist_check.js` (`system/04_voice.md`, `v59_plan.md` §3).

### 4. Optional trims (pure cuts, no recording)
- **"Earlier, he had assumed he would escape. Now, he asked God for strength."**
  - Saves 5.8 s. It's your line, so it stays unless you say so.
  - One v59 viewer called it the weakest line; the other said it "drags a little".
- **"You can be gifted, lead, and help people."**
  - Saves 3.4 s.
  - One v59 viewer called it "close" to a sermon. The other said it plus Matthew 7 "stop the story".
  - It also brings the "you" lines down from 5 toward the cap of 3.
- **Recommendation:** cut both if you want it under two minutes with room to spare (X then lands around 114 s).

### 5. The closing question's form
- **Now:** your approved same-type choice question with answer buttons (19 words, three options).
- **Evidence:** both v59 viewers called the three-option question "engagement bait". `fw_check` warns over 17 words.
- **Options:**
  - Keep it as it is (your approved form).
  - Shorten it to two options.
  - End on the re-ask's answer line and put the choice question only in the caption and pinned comment.
- **Recommendation:** keep the form you approved, but shorten it to under 17 words. Your rule allows the question; the viewers' complaint was about length and the three-way list.

### 6. The tempo speed-up (7%)
- **The sample:** `ep01-samson/options/tempo/voice_tempo_AB_1.00_then_1.07.m4a` plays normal speed, then 1.07×. 1.07× would take about 8 s more off.
- **The conflict:** your Oct 29 rule says "never time-stretch words; get pace from pauses". That rule was about slowing a voice down, but a speed-up is still a time-stretch.
- **Recommendation:** only if your ear says yes. The plan doesn't count on it.

### 7. The M4 insert: a cloth over his eyes
- **The issue:** 16:21 says the Philistines gouged out his eyes and names no cloth. The cloth avoids showing the gouging.
- **Options:**
  - OK the cloth as a stylised addition.
  - Show him from behind or from high so his eyes aren't seen.
- **Recommendation:** show him from behind or from high. It adds nothing the text doesn't say.

### 8. "Then he pushed against the pillars" (locked v57 audio)
- **The issue:** the ESV verbs are "leaned his weight" and "bowed with all his strength" (16:29–30). The picture now follows the ESV.
- **Options:**
  - Leave the audio as it is. It's narration, not a quote.
  - Add a third pick-up line: "Then he leaned his weight against them and bowed with all his strength…"
- **Recommendation:** add it to the same recording session as decision 3. It costs one more line.

## B. Rights and labels (apply to every episode)

### 9. The ElevenLabs plan
- **The terms:** the free plan "does not include a commercial license". Free-plan takes must credit elevenlabs.io in the title, and a take recorded on the free plan stays non-commercial forever.
- **Why it matters:** if the channel will ever earn money (creator rewards, YouTube Partner Program, sponsors), record on a paid plan from the start. Whether an unmonetized channel counts as "commercial" is unconfirmed.
- **Decision:** which plan to record Ep 1's pick-ups on. Source: `system/10_publish_and_growth.md` §7.

### 10. The AI label
- **The rule:** Instagram requires the "AI info" label for realistic AI voiceovers.
- **The plan:** the label is on, plus a caption line: "Narration: synthetic voice. Animation drawn in code."
- **Decision:** confirm. No official statement says the label costs reach (§7).

### 11. The spoken ESV credit
- **What Crossway asks:** a verbal credit to the "ESV" on video, plus the full notice in every caption.
- **The ready line:** "Scripture quotations are from the ESV." (about 2 s), in `voice_lab/ep01_esv_credit_optional.txt`.
- **Options:**
  - Speak it over the end card.
  - Put it as on-screen text only.
- **Decision:** your call. On-screen text alone may not meet "verbal" (unconfirmed; read Crossway's page).

## C. The system

### 12. Ep 2's topic
- **The options:** `research/episode_bank.md` has 20 researched, scored and ESV-checked questions. The top three:
  - Jonah: why he ran (20/20);
  - the forty years in the wilderness (20/20);
  - Uzzah and the ark (19/20).
- **Other picks:** a Peter-sinking reel (#13) would explain the channel name ("fourth watch", 3–6 a.m., Matt 14:25 footnote). The bank also includes a December slot for the wise men (#5).
- **The Judas drafts:** `ep02-judas/` holds earlier drafts, but Judas is also a Lintel topic.
- **A worked example to react to:** `ep02-jonah/` runs the top pick through the script stage. The latest draft is v4, after three rounds of fact-checks and first-time viewers; the full trail is in `ep02-jonah/README.md`.
  - All three viewers rated the answer 4/5 and would watch to the end; the round 3 viewer didn't swipe at all.
  - All three asked who Nineveh was. The book of Jonah never says. The options, including naming it from Nahum 3 on screen, are in the README. That rule call is yours. It's a draft for you to judge, not a pick.
- **Decision:** pick one, or keep Judas.

### 13. Keep a copy of the engine off this machine
- **The risk:** the system files are on the toolkit page, but the animation engine (`ep01-samson/film27/`) and the voice takes live only in this workspace.
- **The fix:** a private GitHub repository would make them durable. It needs your OK and a repo name; nothing is pushed without it.

### 14. Save the updated skills
- **What's ready:** the showrunner and script-review skills, rewritten to point at the new system files. They were offered as save cards in this conversation.
- **Decision:** save them, or say what to change.
