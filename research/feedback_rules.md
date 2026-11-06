# Marcus's script rules from feedback (for the playbook + skill packaging)

- Informative, never ending on an unanswered question (Oct 28, 22:22).
- Order of work: script approved → video → voice last (Oct 28, 23:23).
- Lintel-level quality, but our own look, not a copy (Oct 28, 23:24–23:26).
- Ending (Oct 28, 23:28): stay inside the story's own world. A jump to an unrelated New Testament link
  (e.g. "Samson began a rescue, Jesus finished one" / "It is finished") felt unrelated; the in-story arc
  (Samson → Samuel → David) made sense. Always include "what we learn from <person/story>": the reel exists
  so viewers read and learn something. Lessons must be drawn from the passage itself, each tied to a verse.

## Viewer-test lessons, Samson v8 (Oct 28, 23:30–23:50)
- A "So what do we learn" pivot + three numbered points reads as a sermon outline (preachy 3/5, general viewer
  would scroll there). Fix that worked (preachy 2/5, no scroll): one short pivot ("The lesson from Samson?")
  answered in the same line, max two lessons, no numbering.
- Never restate the answer line as a lesson ("pointed at me"): lessons must add something the answer didn't say.
- Name the iconic detail viewers remember (Samson's hair) in the voiceover, not only in the picture.
- Say how the climax happens in plain words before a long verse card ("God answered, and the temple came down").
- When the text gives both a human reason and God's reason (Judges 14:3–4), say both ("Samson chose ... for his own
  reasons. God had a reason of His own.") so it never sounds like God approved the sin or "set him up".
- Name NT sources both ways for mixed audiences: "In the New Testament, Hebrews 11 ...".

## Visual rules from the Ep 1 build (Oct 29, 00:48 feedback + review loop)
- Marcus: "looks lil lame jsut [Samson] standing also too dark" → act as master cinematographer, stylist and
  animator. Every shot needs an action or a reveal, not a figure standing; keep frames bright enough to read on a phone.
- The look that worked: "the hour before dawn" — profile cut-out silhouettes with a rim light offset toward the key
  light, painted landscape layers fading to a luminous horizon, God's light as one gold beam from the top left,
  dust motes, threshold bloom. 3D figurines read as toys; drop them.
- Keep faces and action in the 22–60% band. A low camera (eye ~0.6 m) puts figures against the bright horizon
  and above the caption band; a high camera drops them into the captions.
- Big dark lower thirds read as "too dark": fill them with perspective ground strips, foreground grass clumps,
  near rooftops or a warm floor pool.
- Captions need a soft feathered scrim + thin dark stroke; gold key words vanish over bright skies, lamps and beams.
- Recognisable silhouettes: olive trees = twisted trunk + lumpy lobed canopy (single blobs read as mushrooms);
  vineyards = rows of trunks under merged leaf lobes; jawbone = curved bone with teeth and a ramus; fallen soldiers
  rotate about their feet to lie flat (raised legs read as a can-can kick).
- Crossfading landscape layers at the same depth z-fight (moire): offset the incoming layer and skip its depth write.
- Reveals: a crane that lets a head poke in from the frame edge looks like a mistake; start fully clear, move fast
  (about 1.1 s) on the motivating word, and only show a callout tag once its anchor is in frame.
- Glowing figures (the angel) blow out to white: use a warm mid-tone base with a light rim, keep aura opacity low.
- End card: a near-opaque dark gradient (not a 78% grey wash) so the figure behind never fights the wordmark.

## Second review round (fresh independent critics, Oct 29 03:00 and 04:50)
- Silhouette gender cues: long straight hair + cinched waist + flared hem reads as a woman. Samson needs a beard,
  broad flat chest and back, thick neck, a straight belted knee-length tunic, and seven thick braided locks to mid-back.
  Women get veils (Delilah, the bride) and a slighter build, so no two figures in a two-shot share a silhouette.
- Rim light: a uniform offset copy reads as a sticker outline and doubles thin shapes in close-ups. Scale the rim
  offset with camera distance, and fade it out toward the ground so legs never become cream wireframes on black.
- Put a lens shift (~0.17 of frame height) on figure shots so heads sit ~30% and hands ~45–55%; captions at 66%
  then land on dark ground. Add a faint horizon-tinted haze over the bottom 30% instead of flat black.
- A "thousand men" needs ranks fading into haze, varied poses and heights; five identical soldiers look cheap.
- Strength beats must happen on screen on their word: the lion on screen for ~1.5 s+, the strike with a flash and
  shake landing on the hit frame (verify picture ±1 frame).
- The climax needs a braced pose (hands on the pillars, head bowed, knees bent), God's beam on "answered",
  cracks, dust, the roof crowd falling, then the exterior collapse with rubble that reads as broken columns.
- End on the brightest, warmest frame: a gold multiply grade on the dawn shots, the subject large and centred.
- Don't reuse one plate at the same angle; change angle and scale each time it returns.

## Round 3: Marcus rejected the silhouette style (Oct 29 08:48): "nothing like the lintel networks' proper motion design"
- Process rule: never build a whole episode before ONE style shot (the hook, ~6 s) is approved. Study the reference
  frame by frame first (grab frames with the canvas helper), then build only the style shot, then wait for his yes.
- The Lintel grammar: a low-poly flat-shaded 3D world (faceted ground, round-lobed trees, rocks, tents) under one
  warm sun with long soft shadows and atmospheric haze; flat 2D outlined cartoon people standing in it as cards;
  a high three-quarter camera (~30–45° down) with shallow depth of field (diorama look); a header row, narration
  at the top in italic serif with key words in coloured caps, name-tag pills on leader lines, rings on the ground.
- Code recipe that works (ep01-samson/hook-style): three.js scene -> half-float MSAA target with a depth texture ->
  half-res gather DOF -> composite with a soft shoulder tone curve. Billboards: canvas texture, yaw to camera, lean
  back by half the camera pitch, and a hidden sun-facing twin card that casts the shadow (a camera-facing card is
  edge-on to a side sun and casts only a sliver).
- Characters as flat cut-paper art: union outline first (double-width stroke under all parts), then fills, a cel
  shade crescent away from the light and a warm rim on the lit edge (shape minus shifted shape).
- God's light: a defined beam, not a wash. Soft 2D rays from above the top-left that fade out as they reach the
  figure (so the face stays clean), a small ground pool, a gold rim on the figure, and the world dims ~25%.

## Round 4 — Marcus, Oct 29 12:27: fixed script format (binding for every episode)
- "why are we not following a clear format for our video scripts": every script uses the same 5 parts, no improvising per round.
  1. HOOK (0–3 s): the question real people ask (e.g. "What's the lesson of Samson's story?").
  2. THE WHOLE STORY, FAST (~50–60 s): in order, one quick line per event, NOTHING skipped, condensed ("we cannot skip parts but must condense… include it but at a quicker pace not slow").
  3. THE DETAIL MOST PEOPLE MISS (~8 s): one line from the text that reframes the story, on a verse card.
  4. THE LESSON (~8 s): one plain sentence the viewer can live by, earned by the story ("what's the lesson learned!!").
  5. CLOSE: answer the hook in one line.
- Cross-Bible connections only when the text itself makes them; a Samson/Jesus "opposites" contrast read as "a random connection" and was cut.
- Don't spend the reel on one episode (e.g. 80 s of Delilah); don't drift into a list of parallels; storytelling first, message clear.

## Round 5 — Marcus, Oct 29 12:50
- "I don't like that you keep coming up with these yourself and choosing them": never pick the angle alone. Self-correct (research, fact-check, critique, revise) until there are MULTIPLE good topic options, then Marcus chooses.
- The story everyone knows gets very little time (a line or two, visuals carry it). Most of the runtime = value: interesting connections, ideas, takeaways, little-known text details, word meanings, history/archaeology, anything that is a piece of value. Think beyond the examples he gives.
- Value every few seconds; the visuals show the feats/story while the narration delivers the value.

## Round 6 — Marcus, Oct 29 15:16: the building-block script engine (binding)
- Keep the focus on the episode's subject (Samson) in context; cut cross-character tangents (David/Saul were "unnecessary additions").
- Never chain facts into causes the text doesn't state (e.g. "his eyes led him, so the LORD left"); state what the text says, in its order. 16:20 "the LORD had left him" is exact text.
- Bold claim at the beginning, bold claim at the end, flowing well; careful, correct wording of the lesson.
- ENGINE: not "3 options, pick one." Build piece by piece like a puzzle: (1) best story beats for the message, ranked; (2) multiple candidates for each slot: bold openings, setup, middle value pieces, turn, bold closings, transitions in between; (3) fact-check every block, independent critic ranks per slot; (4) assemble a recommended build with alternates; Marcus approves/swaps piece by piece.
- Engine delivery (Ep 1): an interactive Script Builder page (https://claude.ai/artifact/QnjuzyddVBzUNxFE6JvoGt). Every slot has fact-check badges, critic scores and a recommended pick; "in-between" lines are placed between pieces; a live script with runtime; per-slot approval saved to db doc builds/samson (read it back with ArtifactData). Block source of truth: ep01-samson/blocks/blocks_data.py -> blocks_v2.json/.md -> build_page.py.
- Run a fresh first-time-viewer test on the recommended build before presenting; fix what it reveals (round 1 found "God still used it" heard as approval, a missing "he told her all his heart", and a filler bridge).

## Round 7 — Marcus, Oct 29 15:48: the BLUEPRINT (binding; supersedes the option-heavy engine)
- "There is so much unnecessary info"; "we do not need that many things from me to choose from. Condense it." -> Deliver ONE tight script built to the blueprint. No option libraries, no builder pages, no long change logs. Do the research, fact-checks and critiques behind the scenes; show only the result.
- What the reel IS: a storytelling reel. Tell the story as the example, with important facts and info that make people think; while telling it, add cool facts most people didn't know; then take the lesson from it; then a CTA on how to apply it.
- BLUEPRINT (every script):
  1. HOOK: a bold claim about the story (first ~5 s).
  2. STORY: told fast as a story, in order; visuals show the famous moments; narration drops a little-known fact from the text every few seconds, each one building toward the lesson.
  3. TURN: the line in the text that proves the claim.
  4. LESSON: one bold, clear sentence (the bold claim at the end).
  5. APPLY: one line telling the viewer how to apply it (the CTA on how to live it, not "follow for more").
- Still binding: one character's story in context, ESV word for word, no causes the text doesn't give, about 60 s.

## Round 8 — Marcus, Oct 29 15:52
- "The lesson is short-lived, very basic, and the storytelling is taking too much presence rather than giving value to the viewer."
- Blueprint refinements: the STORY is evidence, not the point. Keep story narration to about 40% or less. After each story beat, add a one-line takeaway aimed at the viewer ("That's how drift starts...", "That's the trap..."), so the lesson runs the whole video. The LESSON needs depth: give the WHY from the text (e.g. the gift served God's purpose, 13:5), not just the verdict line. APPLY must be concrete: name real-life examples (the song that moved the room, the post that blew up) and end on a question the viewer can ask themselves.

## Round 9 — Marcus, Oct 29 16:14–16:41: Lintel structure adopted for Samson (v26)
- Model: the Lintel scripts Marcus pasted (see transcripts.md, master_scriptwriting.md §6–8): question hook -> story as evidence -> 3 numbered points with rehook questions -> CTA.
- A hard verse needs its resolution in the reel ("the LORD had left him" must be followed by God answering later, 16:22, 16:28–30), so viewers aren't led astray.
- CTA "which hit you harder: A or B?": A and B must be the SAME TYPE (both chill-giving moments of grace), stay on the episode's subject, and be clearly different from each other. Final: "Hebrews 11 names him among the faithful" / "God still answered him at the end".

## Round 10 — Marcus, Oct 29 22:46–22:54: Lintel reels as the bar (ref1 Methuselah, ref2 "Why does God allow suffering")
- Approved from ref1: the CTA as a real choice (answer buttons + a comment being typed), graphics inside long shots (bar chart, map, chips), idea pills. Declined: a Jesus/Romans 8:1 landing ("no need").
- Numbered points (binding): "the 1 2 3 isn't slow" in Lintel; ours stalled on a blank number card. Never show a number alone on a blank background, and never spend a whole transition announcing a point ("Look at how his story ends").
  Lintel grammar (ref2, measured): VO says the number AND the point in one breath ("One: we live in a BROKEN WORLD"; ~0.6 s held beat after the number); a stamp (big numeral + spaced-caps label on a smoked panel) pops over the live scene for ~1.5 s, then settles into a chapter pill at the bottom that stays for the whole point; each point ~16–19 s: statement -> verse card -> example -> one-line conclusion; no bridge questions between points; a roadmap early ("Let me answer with a STORY, then THREE honest reasons") and again before point 1.
- Ending: hard cut to near-black, the logo alone, then the wordmark and a one-line tagline fade in (~3 s), then the reel loops.
- Sound/voice (for the voice and music stages): narrator ~160 wpm overall, short phrases (2–6 words) with 0.5–0.9 s gaps, number words held alone; a soft steady bed ~9–10 dB under the voice (LRA ~3 LU, very even); small ticks/whooshes on text and card reveals.

## Round 11 — Marcus, Oct 29 23:15 – Oct 30 00:18
- Numbered points must be the SAME TYPE and give the viewer value for their own life ("what we should remember"), each proven by the story's text. Facts about the character ("his strength was for God's purpose") are not value. Approved Ep 1 set: "One: God gives gifts for His purpose, not because we earned them." / "Two: mighty works don't prove God knows you." / "Three: even at your lowest, you can still call on God." Introduce them with a re-ask after the story ("So what should we take from his story? Three truths.").
- "Not every video has to have 3 truths or points; that's just one type of format." Pick the format that fits the story (e.g. Ep 2 Judas: a repeating refrain that escalates, "He knew, and He still...", to one realization). Never force the 3-point template.
- Voice: Kokoro "Michael" sounds robotic; stretching sounds to slow the pace reads as "slowing down the letters" (never time-stretch words; get pace from pauses). Preferred: a Michael+Fenrir blend with narrator direction (sentence-level synthesis, stress timing, falling statement ends, rising yes/no questions, per-sentence variety). Must follow "all proper traits of good speaking: pitch, pitch varying, tonality".
- No paid voice services unless Marcus decides (Higgsfield balance 0; ElevenLabs Starter $6/mo is the human-grade option).

## Round 12 — Lintel study of 10 more videos (Oct 30, 2026). Full notes: research/lintel_study_10.md
- Length: their Reels run 85–115 s (220–300 words, ~145 wpm); none is over 2:17. Target ours at 90–120 s. Ep 1 v40 (414 words, ~2:39) is the outlier.
- Hook pattern: "If [what you believe], [troubling question]?" Second beat names who asks or claims it (critics, a scholar, "people ask this in our comments", "most Christians can't answer it"). Then a one-line pivot into the text ("It sounds convincing until you open the book of Exodus").
- Body format is chosen per question: ordinal answers ("First… Second… Third…"), an escalation ladder ("only the first thing to change… even more striking… even that is not the greatest loss"), evidence → verdict, a counterfactual walk-through, or puzzle → clue.
- Each point: claim → one quote → a plain one-line reframe. Plant quotable aphorisms (about one per 20–30 s).
- One modern-life bridge per script ("Life works the same way. A colleague lies about you…"), drawn in the same art style.
- Ending: restate the hook question, answer it in one line, then a reframe back to the viewer. CTA question tied to the central image; sometimes a community line ("welcome to the Valiant").
- Visual: cold open, then a big two-line title over the live scene at ~3 s; captions at the top in a small italic serif with key words colored; concept pills at the bottom-center; parchment quote cards over the dimmed live scene; book-intro cards; literal visual metaphors for every abstract phrase; modern scenes in the same style; callback shot of the opening near the end; ~3–5 s shots, mostly hard cuts with slow drifts.
- Marcus (Oct 30, 15:16): "we do not need an everyday example in each one." The modern-life bridge is OPTIONAL, used only when a point needs it, never required per script.
- Marcus (Oct 30, 15:28) rejected an echo-ending line ("that's not His approval. It's His kindness, calling you back to Him") as corny and not fitting every viewer: never write lines that assume the viewer has strayed or needs to "come back"; no churchy stock phrases. The Ep 1 ending stays on Samson's comfort line + the "remember me" CTA.

## Round 13 — Marcus, Oct 30 (script lock + full pass)
- Run the FULL script loop (checker + independent ESV fact-check + fresh first-time viewer + rubric) before showing a revision. Never present a "pass" that is only two or three trims.
- Never assume the viewer's state ("how far you've fallen", "calling you back to Him"); no churchy stock phrases; comfort must fit every viewer.
- Never mention something the story doesn't show (e.g. "used it for revenge" when no revenge scene is in the video).
- Say what a phrase means in plain words: "for other people" → "to be used to help other people".
- Quoted verbs must match the ESV exactly ("rushed upon him", not "came upon him"; 13:25 is "began to stir him"); a count only stands if every item uses the claimed wording.
- Don't state what the text only implies ("God answered") — show it (prayer → "bowed with all his strength" → Hebrews "made strong out of weakness"). Don't call something "last" unless the text makes it last.
- Use plain words for places/objects viewers might misread ("building", not "house"; "temple" is not ESV wording).
- If a pattern (e.g. the 4/4 mirror) doesn't land with a first-time viewer, cut it (Marcus's rule: "cool connection or cut it").
- The everyday/modern example is optional, not required per script.

## Round 14 (Oct 30): Ep 1 v51-v52
- Marcus's ending model: name both what the story warns and what it gives hope for, then close on a line that fits every viewer ("We need that warning when things are going well, and that hope when they aren't."). The comfort line uses "we", never assumes the viewer has failed.
- ChatGPT relays are input, not orders: apply them, but fix any wording the ESV check fails (e.g. "this escape" implied an escape that never happened) and say so in one line.
- Self-check questions for the viewer go in the caption, not the VO.
- The answer line keeps the hook's own words ("God still using you"), so the answer echoes the question.
- Logo (Oct 30): keep the cinematic scene (Jesus walking on the water toward the lit boat). Never draw Jesus as an all-black silhouette, because it looks lame: He must be lit and colored (cream robe, colored mantle, warm skin, hair and beard shapes). Flat vector icon marks (cross on the water, lantern cross, flat figure) were rejected as worse. Match the look of the videos, not a separate graphic style.
- Logo v4 (Oct 30): Jesus's pose must be ONE consistent 3/4 view (head, torso and both arms turned toward the boat); no profile head on a frontal body, no palm-out hanging hand. The face can't be a profile with a big triangular nose. The robe needs a natural silhouette, not a tube, and the mantle must be one continuous drape (no lump). The wordmark can't be plain default text: it needs a crafted gold-foil treatment with an ornament.
- Logo v5 (Oct 30): Jesus approved (v5 character). Wordmark = style 4 "Inscription, clean": Cinzel SemiBold caps in cream (#F2E6CF), letter-spacing 0.14em, soft gold glow, no foil and no ornament. Gold-foil, framed and ornament versions were rejected. Keep Jesus and the boat at a believable relative scale (disciples about a third of His height); a giant Jesus next to a tiny boat looks off.
- Logo layout (Oct 30): Option 1 approved. Jesus stands ON the rough sea (a swell under Him, foam at His feet, a crest in front of His hem); the boat is full-length and farther back near the horizon; the wind is visible (Matthew 14:24 / John 6:18), with no lightning or rain. Show wind in hair through ends and strands only, never as one big swept shape.
- Logo sea (Oct 30): the water must read instantly as ocean waves: defined crests, white foam and whitecaps, navy-teal water, spray. No smooth blurry humps (they read as dunes or blobs) and no brown tint. Wind in Jesus's hair as strands read as spikes, so keep the approved v5 hair and show wind in the mantle and hem only.
- Logo sea (Oct 30, final): no gold glints or specks of light on the water, and no blocky moon smears. Under Jesus it's just dark sea with texture and foam. Wave tops must be choppy and broken, never smooth rounded caps.
- Closing question (Oct 30): Marcus wants a spoken question to viewers at the very end, after the answer is stated. It goes in a '## Question' section (the checker allows it). It must not accuse or assume the viewer has strayed. Ending style he wants: chills, showing that Samson called on God and what followed (shown, not stated as 'God answered').
- Outro (Oct 30): Jesus must appear slowly and calmly (about 2 s fade-in, ease-in-out) and stay perfectly still, with no bobbing, rising or sliding. The camera stays locked. Reverence: He is the Son of God. The wordmark fades in with no rise, and the sky and sea fade up together.

## Round 15 — Marcus, Oct 31 07:43–08:50: Ep 1 v57 "not good enough" (binding: research/direction_rules.md)
- His verdict on the finished v57 cut: "disappointed… simply not good enough". The problem is "the pacing, length, the motion… more so the motion, the camera, and what was going on cinematically". It is NOT the looks. "These other accounts succeeded with coding the videos just like us… they even had worse quality render but proper visual storytelling, camera angles, pacing, audio".
- The bar is measured, not guessed. All 14 Lintel Shorts were studied shot by shot (`research/lintel_ref/yt/`, `_patterns.md`), with Instagram views (Tree 7.6M, Cain's wife 1.8M, Never heard 1.6M) to separate hits from lows. Every shot list now follows `research/direction_rules.md` and must pass `tools/shotlist_check.js`. Every cut must pass the direction checks in `fw_check.py`.
- Every spoken clause gets a picture of that clause happening. A character standing while the voice says what they did is a defect. The rig already has the actions (carry, strain/burst, sleep, wake, grind, pray, push, shave, lead, kneel, fall).
- No overnight build without a shot list Marcus has seen. Review motion as low-res video drafts before any full render; stills are not enough to judge motion.
- "Passes the checker" is not "good". The checker covers compliance, not storytelling. Hand over only what passes the direction rubric and a watch-through of the motion draft.
- Marcus wants an entire working system, a bunch of files: every lesson goes into the skills, the playbook, the checkers and the engine docs, not only into research notes.

## Round 16 — Marcus, Oct 31 17:15
- Priority right now: the script and story must be good enough for the viewer and must not feel slow. Visual quality still matters ("remember i want it visually to be good"), but story and pace come first when they compete.

## Round 17 — Marcus, Oct 31 20:27 (corrections to the evening report, plus his picks)
- **Label simulated reviewers as AI.** Never write "every first-time viewer" or "would watch to the end" about AI reviewers: it implies real audience testing. Call them "simulated (AI) viewers". Simulated feedback can flag confusion and slow or preachy lines; it cannot establish retention, swipe rates or shareability. Only real posts measure those.
- **Fix technical problems at once; they don't need Marcus's approval.** Examples: silent renders, the wrong soundtrack file, inconsistent file versions. Report them as fixed.
- **Correct unsupported Bible details at once,** as routine accuracy fixes (e.g. the cloth over Samson's eyes; "pushed" where the ESV says "leaned… bowed"). Report them as fixed. Don't present them as decisions.
- **Rights, terms and labels are verified against the official pages** (the company's own terms or help pages), quoted, with the date checked. Don't state them from secondary summaries, and don't offer options the terms rule out.
- **Approvals need exact wording.** Never ask Marcus to approve a description of unfinished wording: show the exact lines (e.g. the closing-question options and the new answer line), with word counts and the runtime effect.
- **Safeguards required:** a release manifest (every file in a release, with hashes and versions), pinned dependencies (exact tool and package versions, checked by a script), and checker test clips (planted faults with the expected verdicts) that run before any checker change ships.
- **His picks for Ep 1:** cut the Matthew 7 warning; outro A (Jesus fades in under the closing question and is still by its last word); cut both optional lines ("Earlier… Now…" and "You can be gifted, lead, and help people."); no speed-up.
- **Ep 2 is Jonah.** Explain Nineveh briefly with a separately sourced historical statement, presented as history (with its source), not as Scripture.

## Round 18 — Marcus, Oct 31 22:12
- His words: "script checker should do more than that, should do way more, should determine if the script itself and the value for the audience is good enough. I'm not convinced the Samson story is good enough."
- **The script check judges quality and value, not only form.** Every script now gets three layers before he sees it:
  1. `fw_check.py script`: form, plus deterministic value checks (Value items actually spoken, repeated phrases, signposts, lines that add nothing new, answer timing).
  2. The ESV fact-check (an AI agent).
  3. The blind AI judge panel (`tools/script_judge/`): 3 judges score it beside 9 Lintel reels with known views; it must be at least as well built as the best of them (`fw_check.py script --judge <run>`, NOT YET = FAIL).
- **Say plainly what the panel can't do.** The judges agree with each other and re-score consistently, but their scores don't predict views: on the Lintel reels, the 7.6M hit scores mid-table. It's a craft bar, not a forecast (Round 17's rule on AI reviewers applies).
- **Judge one version per episode per packet.** Side-by-side versions get scored against each other.

## Round 19 — Marcus, Oct 31 22:59
- **Ep 2 Jonah v5 approved as written** ("solid story lets keep it", said right after reading the full v5 text). That means the current re-ask and the current Nineveh line, with no history about Assyria. Next comes the shot list, which needs his OK before anything is animated (Round 15).
- **The GitHub repo: yes** ("definitely need that github repo"). A private repo for the engine and the system, so the work survives this workspace. This is his OK to create the repo and push to it.
- He asked whether the AI voiceover is worth replacing, now that Instagram requires an AI label on "a reel narrated with a realistic AI-generated voiceover". That's open; see `DECISIONS.md`.
- He asked about an episode that answers a question most people have about Christianity, not only a story question. That's open; see `DECISIONS.md`.

## Round 20 — Marcus, Nov 1 08:11
- His words: "i only want the tokens spent, making the script better for the viewer to stay thoruhg th eentirety of the video, for the story thevalue thats being rpesented to the viewer to actually be good enouhg for them to like, comment, share, follow ... dont spend lal tokens on fact checking, i rather you spend otekns ensuring that the script is amazing, that what we have chosen in teh first palce is even worth, and that the audience will be intrigued by the story."
- **The token budget goes to the viewer.** That means watch-through to the end, value worth acting on, and a reason to like, comment, share and follow. It also means checking whether each topic is worth making before polishing it, and whether the story intrigues.
- **Accuracy stays, at the cheap end.** It uses the verified-ESV notes already on file, the deterministic checks, and ONE independent fact-check on the final candidate, covering changed lines only. No repeated full fact-check agents every round. (This narrows Round 18's layer 2. It still runs, just once and scoped.)
- **No new helper agents for work I can do in the main thread.** Each new agent costs ~75k tokens before it reads anything.

## Round 21 — Marcus, Nov 1 08:35-08:41
- His words: "i stilll dont know if it provides enoug hvalue" and, after I listed what Ep 3 v7 was missing, "im just disappointed u missed all his".
- **Value means answering the viewer's next questions, not counting facts.** Before drafting, list the questions the hook raises in a viewer's head (for Ep 3: what is it, could I have done it, WHY can't it be forgiven, has anyone done something terrible and been forgiven). The script must answer every one of them. A script that passes the checker but leaves one of them open is not done.
- **Every script needs one line people would repeat or screenshot** (the answer said plainly) and one concrete proof from the text, not only statements.
- **Show Marcus the value verdict honestly before calling a script done.** Don't present "every row verified, 0 FAIL" as if it meant "good enough".

## Round 22 — Marcus, Nov 1 10:32
- His words: "fyi you removing the gold and teh idols was uncesary it was not the centerof attnetino almost nobody noticed them."
- **Don't spend work fixing background details the viewer isn't watching.** Accuracy effort goes to what the viewer's attention is on (the action, the words, the cards). A minor set detail in the background isn't worth a re-render.
- **Open question for Marcus:** the gold light at the pillars. His canon rule says gold only where the text says God acted, and v57 has gold on "pushed". Restore it or not? Asked, Nov 1.
- He asked again whether "the script engine itself is better": he wants a straight verdict on the engine, not the process around it.

## Round 23 — Marcus, Nov 1 10:36-10:40
- His words: "dont work on the samson video, keep owrkig on the engine, the end goal is for me to ask you, create a video for this topic ... and fo ryou to come up with a great script, great cinematography, great visuals everythign to be great ... lintel networks, visuals are not that improessive, ours are looking mroe visually improessive wiht the 3d renders, however every single time they have beaten us on, thei srcipting, their cmaera movements, and also what is shown on srcreen, with the story takinga birds eye view, and changin apce, setting" and "videos todya that perform contain much more visual like pop up stimulating hte audine ceiwht thing sgoing on often, keep that in mind we don twnt to overdo it fo coruse".
- **Samson is paused. The work is the engine:** topic → script → cinematography → visuals, all great. Plan: `ENGINE_ROADMAP.md`.
- **Pop-ups are part of the language:** frequent word-timed overlays (labels, icons, arrows, rings, numbers) that keep something happening. They are governed so they're never overdone: one at a time, about every 1.5-3 s at most, never over the subject's face, never two text elements at once.

## Round 24 — Marcus, Nov 1 10:57
- His words: "i dont beleiv eyou udnerstood wha ti said, in teh longrun i want thoruhg a prmopt to get the entire thing odne, for me, to post on soical media, 12seconds isnt it, thats a sample, the engine works well once i give you a topci you come up with the fulls ript for it, you do rsaecrh and find things people would not know about it and connect dots and are able to sorytell well and providng value for the audience".
- **"The engine" means the whole topic → post-ready reel pipeline, run from ONE prompt**:
  - research (what people don't know, connecting dots);
  - the full script (storytelling + value);
  - direction, visuals, voice, music, render and QA;
  - the finished video, caption and cover.
- Component demos are only means to that end. Report progress against the full pipeline, not samples.

## Round 25 — Marcus, Nov 1 (answers to two questions)
- **Voice:** "No preference". The pipeline uses a free offline voice, so no paid credits are spent without his decision. ElevenLabs stays an option for finals.
- **Checkpoint:** "Stop once, after the script". The one-prompt run stops for his OK on the script, then goes all the way to the finished video.

## Round 26 (Nov 1, 11:32) — Ep 4 v6 rejected
Marcus: "this script is an actual piece of dogshit, it makes no sense, i dont understand what the clear message is, there is so much that you left unanswered, you have convinced me the engine is still crap"
Rules:
- **Message first.** Write the ONE-sentence message before any line, and show it to Marcus with the script. Every line must serve it.
- **Build a question chain, not a fact list.** Each line answers the question the line before it raises, and the questions are asked out loud ("Chosen for what?", "But why Jacob?", "And Esau?").
- **Few books.** At most ~3 books plus one passing fact. v6 hopped across 7 (Genesis, Malachi, Deuteronomy, Obadiah, Romans, Genesis again), which read as a study guide.
- **Don't patch line by line from AI-viewer complaints.** Adding a verse to answer each complaint is what turned the script into a list. Fix the spine instead.
- **AI viewer scores are not the bar.** A 4/5 from an AI viewer didn't mean the script was clear. Don't present an AI score as the value verdict; say what the message is and whether every line serves it.

## Round 27 (Nov 1, 11:36) — options tree
Marcus: "i chose the story of jacob, i need you to give me multiple options to talk about, then further options, like a growing tree of options ill choose whats best, but only give me options once you yourself have concluded they are all great"
Rules:
- **Topic → angle → (hook, spine, ending) as a tree.** Marcus picks at each level, and the script is built only from his picks.
- **Vet every option before showing it.** An option is shown only if it has:
  - a question people actually wonder about;
  - a one-sentence message the text itself supports;
  - three or more things most viewers don't know;
  - a story spine (a bird's-eye journey, not a list of verses);
  - a line people would screenshot;
  - strong visuals for the engine.
- **Show only what passes.** Never show a weak option to pad the list.

## Round 28 (Nov 1, 17:33): the Bronze Serpent's insight density
His words: "the script doesn't deliver enough intellectual value for its nearly two-minute runtime. The problem is low insight density… Stop refining the storyboard until the narration is stronger… target 75–95 seconds… Every 10–15 seconds should ideally deliver a new discovery, a surprising comparison, or a meaningful change in the viewer's understanding… The standard for Fourth Watch should be this: viewers finish the video having understood a biblical connection they would probably never have discovered by simply reading the passages separately."

Rules:
- **Measure insight density.** Something new in every 15 s window (the writer skill's insight timeline at Gate 5). Never re-explain what the hook revealed; no recaps.
- **75-95 s by default.** Go longer only if the research earns it.
- **Script before storyboard.** No direction work on narration that isn't dense enough yet.
- **Textual fidelity in pictures too.** Num 21:8 says God commanded a "fiery serpent" and Moses made it of bronze. 2 Kgs 18:4 says "offerings", not prostration.
- **The connections to use here:**
  - the golden calf reversal (Ex 32:8 vs Num 21:8);
  - Hezekiah destroyed the object, Jesus kept its meaning;
  - John 3:14 → 3:16, two verses apart.

## Round 29 (Nov 1, 17:58): Bronze Serpent v4 approved; production instructions
**Approved:** "cut version plus the 3 16 line" (`ep02-bronze-serpent/script_approved_v4.md`). His own v4 was 351 words; the approved cut is 258 words, about 108 s with the offline narrator.

**Production rules (binding for this episode and as defaults):**
- **Intellectual value first.** Every major sequence must advance one of the three revelations:
  - God commanded the serpent, unlike the calf.
  - Israel preserved the object but corrupted its purpose.
  - Hezekiah destroyed it, yet Jesus revealed its significance in John 3.
- **Visuals explain, never decorate.** Use comparisons, match cuts, spatial relationships, purposeful camera moves and symbolic transitions, so viewers SEE how the calf, the serpent, Hezekiah's smash and the cross relate.
- **No** repetitive character movement, unnecessary establishing shots, long static scenes, or generic illustrations of the narration.
- **Density:** something new every 10-15 s. Never stretch the runtime.
- **Progression:** mystery → understanding → reversal → the strongest payoff near the end. The final sequence must show why Jesus' reference transforms the story.
- **Accuracy:** distinguish what the text states from visual interpretation; invent nothing.
- **Process:** reuse proven components, but don't let technical limits compromise the direction. Before rendering:
  - analyze the script beat by beat;
  - place each discovery;
  - design the strongest visual for each;
  - critique each sequence;
  - revise the storyboard;
  - name the hardest shots;
  - render a short opening proof.
- **The standard:** every visual deepens understanding, raises curiosity, clarifies a connection, or heightens the emotional impact of a revelation.

## Round 30 (Nov 2): a permanent production system, art direction first
His words: "Build a permanent Fourth Watch production system that works with our connected Higgsfield account. This must be a reusable system, not a one-time prompt."

His words on the test: "The current Fourth Watch animation quality is not acceptable yet. The characters look childish, the compositions are simplistic, and the visual storytelling is too literal."

Rules:
- **Brand:** a faceless Christian educational channel of cinematic biblical explanations that reveal surprising, textually supported connections. No generic devotional content, shallow retellings, invented biblical details or exaggerated theological claims.
- **Pipeline:** Research → Script → Approval → Voiceover → Storyboard → Visual references → Short generation tests → Review → Final assembly → Quality control. This replaces the "voice last" order.
- **An approved script is locked.** If Content Factory can't preserve it, use a more controllable Higgsfield workflow.
- **Reuse** approved assets and characters wherever possible.
- **Each scene advances the viewer's understanding,** rather than merely decorating narration.
- **Professional art direction comes before automatic video generation.** Sophisticated stylized 2D illustration, cinematic compositions, controlled lighting, subtle textures, expressive silhouettes, layered environments and intentional visual metaphors.
- **Study references for quality,** never copy their artwork.
- **Before animating another sequence:** three art directions, one excellent still for each, his approval, a consistent storyboard, then animation only after he approves the storyboard.
- **Cost control:** before every paid generation, report the model, intended output, credit cost and remaining balance. Wait for explicit approval. No expensive batches and no automatic regeneration.
- **Quality control** covers biblical fidelity, information density, visual coherence, character consistency, pacing, audio and typography.
- **Keep a record** of approved techniques and rejected patterns, and reuse what works.
- **Do not automatically publish.**
- Full system: `production/README.md`.

## Round 31 (Nov 2, 17:17): usage audit
His words: "I can see repeated generate_image and generate_video calls despite my instruction not to begin paid generation."

The audit found one charged generation (Eleven v4, 2.76 credits) and 22 free cost checks that ran after his stop. They created nothing but looked like generation.

Rules:
- **Stop all paid generations until he explicitly approves them.**
- **Cost checks are announced and approved first,** because they use the same tool names as real jobs.
- **Keep the finished Bronze Serpent video and voiceover as reference material.**
- **The production system lives in the GitHub repository,** with persistent instructions and a generation approval process.

## Round 32 (Nov 2, 17:34): a stricter gate, Gouache first, testimonies kept apart
His words: "make the generation gate more robust: Prevent approval for a model from authorizing different prompts, resolutions, durations, or higher-cost jobs. Clarify that the approval file cannot substitute for my explicit authorization."

His words: "I want to evaluate Cinematic Gouache first, rather than spend 12.75 credits comparing all three directions."

His words: "ensure we can maintain a separate cinematic production preset for personalized Christian testimonies without mixing those creative rules into Fourth Watch's educational videos."

Rules:
- **An approval covers one exact job, once.** A different prompt, model, resolution, quality, duration, count or reference needs a new approval, and so does a higher price.
- **The approval file can never substitute for his explicit authorization.**
- **The biblical accuracy and visual quality rules stay as they are.**
- **Test order:** Cinematic Gouache first. Gold Leaf Fresco and Annotated Engraving wait unless he asks for them. This narrows Round 30's three-still step for this test.
- **Testimonies are a separate preset** (`presets/christian-testimonies/`). Their creative rules never mix with Fourth Watch's.

## Round 33 (Nov 2, 17:41-17:42): compare 2.5D and 3D before choosing
His words: "I want to reconsider Fourth Watch's visual direction before we commit to anything." "Our goal is to choose a visual identity we'll be proud to use across hundreds of Fourth Watch videos. Don't rush this decision."

Rules:
- **Compare two directions on the exact same Bronze Serpent scene:** cinematic illustrated 2.5D and premium stylized 3D. One high-quality still each, only after he approves the prompts, models and costs.
- **Premium 3D must never resemble low-budget video games or children's cartoons.**
- **The look must be professional, reproducible with Higgsfield and financially sustainable.**
- **Bible reels and paid Christian testimonies don't have to share an animation style.** They can share a recognizable brand identity while using different cinematic techniques.
- **gouache-01 is on hold.** PR #1 stays available, and the system must support both styles.
- **The repo should be private.** Future clients' personal testimony materials stay in a separate private workspace.
- **Bronze Serpent v4 remains the approved, locked script.**
- **No subscription changes on his behalf.**
- **No complete episode and no new animation engine** for now. Focus on the visual decision.

## Round 34 (Nov 3): review of the Bronze Serpent film, script and characters reopened
His scores: "Visual quality 8/10", "Visual storytelling 8.5/10", "Character animation 5/10". His verdict: "a strong first full production", "a near-final cut rather than publish immediately".

His words: "Our characters currently feel like illustrated cutouts placed into 3D environments rather than characters genuinely inhabiting those worlds."

His words: "The experimental script is decent, but it isn't as intellectually compelling as our earlier concepts." "Don't mistake dramatic wording for a compelling story."

Rules:
- **Simpler, better-designed characters:** consistent proportions, attractive silhouettes, expressive poses, convincing movement and real interaction with the environment.
- **Prioritize motion and staging** over more illustration detail.
- **Scripts reveal connections.** "We want to reveal fascinating details and connections within Scripture," not just tell Bible stories attractively.
- **Review symbolic imagery** so viewers don't mistake artistic staging for recorded events.
- **Before publishing the film:** fix character movement, visual repetition, small type and the falling bronze pieces, and verify the narration and soundtrack by listening.
- **Higgsfield's value:** he called the character art and voice "the first convincing evidence that it added meaningful value".

## Round 35 (Nov 3, 09:24): the calf script, and prove motion before art
His words: "I don't want a disputed interpretation presented as a definitive discovery." "Before spending credits on a character sheet, prove the animation with a simple placeholder puppet." "Our goal is not more detailed illustrations. It's characters that feel alive inside their world."

Rules:
- **Keep the two brothers, the two metal animals and the contrast between their consequences.** Preserve "Moses' serpent had become Aaron's calf."
- **A disputed reading is never a discovery.** The no-poison reading and the Greek "so" argument are out.
- **Prove motion on a free placeholder before buying character art.** Walking, stopping, reaching, ground contact and a motivated camera.
- **Don't build another animation engine.**

## Round 36 (Nov 3, 09:42): the final revelation is about Jesus
His words: "I want the final revelation to be about Jesus, not simply a callback to Aaron and Moses." "Keep the script compelling and avoid unnecessary theological explanation."

Rules:
- **The last revelation lands on Jesus,** not on a recap of the earlier characters.
- **Say why people died.** An opening number needs its cause.
- **No speculative links and no interrupting questions.** The Paul connection and "Why a serpent?" are out.
- **Give the central verse room,** both intellectually and emotionally.

## Round 37 (Nov 3, 10:03 to 10:12): one idea, one exceptional video
His words: "ONE IDEA → ONE COMPLETE, PRODUCTION-READY VIDEO." "The goal is not simply to automate video rendering. It's to automate excellent creative decision-making and production." "Stop treating 2D characters inside 3D environments as our required visual style." "Think like a world-class director choosing the right visual language for each scene, rather than a programmer trying to force every scene into the same engine." "don't turn the medium-selection table into rigid rules. I want genuine creative judgment." "Our benchmark is not whether the automation works. It's whether the resulting videos can genuinely compete with the quality of the channels we're studying."

Rules:
- **Hybrid is approved.** 2D, stylized 3D, 2.5D, motion graphics, kinetic type and combinations are all available. Don't use 3D merely because it looks impressive, or 2D merely because it's easier.
- **Creative judgment comes first.** Medium guidance is a set of starting points, never a decision table.
- **Three priorities, in order:** creative intelligence, visual excellence, production efficiency.
- **A recognizable identity, not a single appearance.** Videos should feel deliberately art-directed, not automatically assembled.
- **Higgsedit is the primary assembly engine.** Other tools are allowed when they produce better results.
- **AI-generated art isn't forbidden** when it materially improves quality. Paid generation still needs approval.
- **Three creative approvals:** script, visual direction and final video. Work independently inside each stage.
- **Consolidate and reuse.** Recover the source, avoid unnecessary infrastructure, and don't spend days on a theoretical system.
- **Prove improvements on Bronze Serpent, step by step.** Narration, music and paid generation wait until the next meaningful milestone. The revised script stays unlocked.
- **Quality is judged against the channels we study,** not by whether the automation ran.
- **Interactive fiction is a separate future skill and channel.** Fourth Watch stays grounded in biblical accuracy.

## Round 38 (Nov 3, 10:41): stories must be worth staying for
His words: "Once viewers understand the connection between the serpent and Jesus, they've received the main value. What reason do they have to stay?" "Do not assume our existing script deserves to be preserved." "Before continuing the storyboard, propose a substantially stronger narrative architecture." "Don't confuse suspense with delaying an obvious answer. Deliver genuine new information throughout the video, with the strongest discovery reserved for the ending." "I want viewers to feel that every new section rewards their attention while giving them another reason to continue." "Prioritize exceptional storytelling before animation or production."

Rules:
- **Story comes before animation or production.** No storyboard work on a story that hasn't earned it.
- **The known connection is never the destination.** If a church-raised viewer can guess the link, it belongs at the midpoint.
- **Every section pays and then re-hooks.** New information, then a new reason to stay.
- **Suspense isn't delay.** Answer early, and hold back only what is really new.
- **The strongest discovery comes last.**
- **No script is preserved by default.** Earlier lines stay only if they serve the new chain.

## Round 39 (Nov 3, 11:09 to 11:17): emotion, value and the debut
His words: "We're spending enormous effort finding obscure biblical details, clever comparisons, Hebrew word connections, and intellectually interesting observations. But I want every Fourth Watch video to deliver extraordinary value to the viewer, not simply interesting information." "A viewer should leave every Fourth Watch video having learned something meaningful AND experienced something worth remembering." "Our mission is not to make viewers think, 'That was an interesting Bible fact.' Our mission is to make them think, 'I never realized that. That was incredible. I want to watch another.'" "A simple story told exceptionally well can be more powerful than seven obscure biblical connections." "sharing a Hebrew word doesn't prove an intentional connection between the passages." "AI reviewers are useful, but they aren't substitutes for real audiences." "Our goal is not to replicate the surface characteristics of successful Shorts. It is to understand the creative decisions that make those stories worth watching, remembering, sharing, and returning for."

Rules:
- **Start from a meaningful human question, conflict or struggle,** not from an obscure detail.
- **Intellectual depth serves the emotional and narrative experience.** It doesn't replace it.
- **Every episode has a deliberate emotional destination.**
- **Two or three discoveries that build,** not a collection of references.
- **A shared word never carries a climax.**
- **Don't assume longer or more complicated scripts add value.** He's comfortable with 2 minutes only if the story justifies it.
- **Plant a character early if their return is the payoff.**
- **Every idea passes the idea card before a script** (`production/10_creative_decisions.md`).
- **Test: would someone who already knows the familiar point still be surprised, taught and rewarded?**
- **Never manufacture emotion, invent details or exaggerate theological claims.**
- **Real viewer data improves these decisions once we publish.**
- **No extra approval checkpoints or engineering complexity.**
- **Bronze Serpent is paused** while the debut is decided. No credits.

## Round 40 (Nov 3, 12:09): a focused debut round
His words: "It must earn its place through exceptional storytelling." "Distinguish explicitly recorded facts from interpretive connections. Don't build a dramatic revelation around uncertain theology." "Don't confuse complexity with value." "I want a focused creative development round, not another enormous research report, scoring system, or production framework." "Make strong independent creative decisions. Don't repeatedly ask me to choose between minor options." "The goal isn't to create a video that explains our channel. The goal is to create an extraordinary Bible video that makes people understand why Fourth Watch is worth following."

Rules:
- **Deliver a decision, not options.** Recommendation, one script, a short rationale.
- **Don't recommend a topic because of the name.**
- **No dramatic revelation rests on uncertain theology.**
- **Once the script is exceptional, move decisively into production** with the existing hybrid workflow. No credits are authorized yet.

## Round 41 (Nov 3, 12:31): judge the story, not the draft
His words: "distinguish a bad concept from a good concept that hasn't yet been executed well." "Don't reject an exceptional story because your first few scripts failed to tell it exceptionally well." "Don't disguise subjective judgments as empirical findings." "Treat AI evaluations as criticism, not proof of audience response." "Every discovery must contribute meaningfully to the story. Don't add information just to meet a discovery quota." "The emotional climax can itself be the ending." "Never promise a revelation Scripture doesn't provide." "Our goal is not to manufacture a story that satisfies successful-video patterns. Our goal is to identify genuinely extraordinary stories and use those patterns to communicate them exceptionally well." "After that, we need to start making videos and learning from actual viewers."

Rules:
- **Separate the concept, the script, Scripture and production.** Judge each on its own.
- **Label evidence honestly:** real audiences, editorial judgment, Scripture, script limits, speculation.
- **No scoring rubrics or simulated ranking rounds.** AI readers are critics only.
- **A hook only promises what Scripture can deliver.**
- **Show what the person wants, fears and faces.** Don't label feelings.
- **Choose the structure the story needs.** Lintel's is not a formula.
- **A familiar viewer finds something worthwhile, and an unfamiliar viewer never needs a theology lesson.**
- **Don't favor a topic because it's familiar, easy, on brand or hard to criticize.**
- **Know when to stop analyzing and start producing.**

## Round 42 (Nov 3, 12:46): verdict on the storm script, and a test of our writing process
His words: "Claude is still thinking like a biblical researcher trying to find an overlooked detail, rather than a storyteller trying to create an extraordinary experience." "We don't want it to find a small detail, write a script around it, and call the detail a revelation." "We want it to begin with a powerful human or theological question, investigate the biblical narrative, and discover an answer that changes how the audience understands the entire event." "Biblical accuracy doesn't require avoiding interpretation. It requires distinguishing what Scripture says from what we're reasonably concluding."

Verdict: `ep10-fourth-watch/writer/script_v3.md` is rejected. The question was too small, it retold the events, it dropped Mark 6:52, and "They." confused subtlety with significance.

His direction for the storm: "It's a story about men witnessing extraordinary things and struggling to recognize who was standing before them."

He also asked for a test of Content Factory against our writer: "Do not build another framework or add more writing rules yet." So this Round adds no new rules. "Our objective is the best possible storytelling, not proving that the system we've spent time building was worth building."

## Round 43 (Nov 5, 09:30): the objective is the whole filmmaking engine
His words: "Our objective is NOT to keep improving the storm renderer indefinitely." "We are building the complete Fourth Watch AI filmmaking engine, using our existing code, Higgsfield integration, and reusable creative intelligence." "Higgsfield is already part of our workflow. Three.js is a tool within the engine, not the project itself." "Our goal isn't to perfect one storm video. It's to build a filmmaking system capable of producing hundreds of distinct, high-quality videos."

The five libraries: scriptwriting intelligence, visual direction, animation mechanics, visual identity, production orchestration.

Rules:
- **Finish the current renderer verification, then move on.** Don't polish the storm further.
- **Audit first, and preserve what works.** Identify the gaps, then "implement them incrementally rather than creating another standalone prototype."
- **"Every new technique must include working implementation or a clear execution route, examples, and validation tests."**
- **The acceptance test:** the engine can "transform a new biblical idea into an original, coherent, professionally directed cinematic video with minimal manual intervention."
- **"Do not spend Higgsfield credits without my explicit approval."**

## Round 44 (Nov 5, 09:55): ask before rendering
His words: "stop rendering video!!!! burning credits you need to confirm by asking me"

Rule:
- **Ask Marcus before starting any render or any multi-agent job, even a free one.** A broad instruction such as "finish the verification" is not that approval.

## Round 45 (Nov 5, 09:56): the production lock
His words: "No rendering or credit spending until I explicitly authorize it." "Silence is NOT approval. Previous approvals do not authorize new jobs, rerenders, retries, or additional spending." "Enforce this restriction across all agents, subagents, skills, and production workflows. Verify the safeguard is active before proceeding."

Rules:
- **Before EVERY paid operation:** explain exactly what you intend to generate, name the model or tool, state the estimated credit cost, explain why it's necessary, then ask him and wait for his explicit approval.
- **Until he lifts the lock, work only on the engine, its libraries, architecture, code and automated tests.** Writing a script he asks for costs no credits and is allowed.
- **Enforced by** the production lock file, its hook and refusals in the render programs. See `production/GENERATION_APPROVAL.md`.

## Round 46 (Nov 5, 10:20): one skill, built on emotion and extraordinary value
His words: "we must collect and gather only info of importnatce, anything unimportant must be discarded." "we should focus on extraordinary value on each video, not diving into small details." "if im being honest i do not think the serpent story appeals to emotion."

Rules:
- **Build one skill from selected knowledge.** The more relevant information it holds, the stronger it gets. Anything unimportant is discarded.
- **Every video aims for extraordinary value and a clear emotional response:** impressed, saddened, joyful, encouraged, motivated or genuinely educated.
- **Choose stories for their emotional pull, not for a small textual detail.**
- **Move forward with a clear sense of direction.**

## Round 47 (Nov 5, 10:33 to 10:35): the story skill, built from demonstrated decisions
His words: "Don't make the engine choose an emotion and then find a Bible story to fit it. It should discover compelling human stakes within Scripture and determine what emotional experience the story can genuinely deliver." "Research deeply, but collect only evidence that materially changes how the engine selects stories, builds emotional engagement, or writes scripts." "Do not equate popularity with storytelling quality or copy creators' scripts." "Do not replace the existing writer until the new skill demonstrates an improvement." "The most important missing ingredient is a library of demonstrated creative decisions." "The new skill should earn its place by consistently producing better scripts—not by containing more research or passing more automated checks." "The key is to make the engine a better storyteller, not merely a more disciplined scriptwriter."

Rules:
- **Discover the human stakes in Scripture first.** The feeling comes out of the story, never the other way round.
- **Study failures and average videos alongside successes.** Separate observations from hypotheses.
- **Keep several story forms.** Emotional value and intellectual value are different, and both count.
- **Plan an emotional progression, not a category.** Example: helplessness, unexpected intervention, relief, gratitude.
- **Writing and visuals share one creative plan.** Story decisions carry through to narration, camera framing, timing and acting.
- **Start from worked examples, not generic advice.** Three strong and three weak scripts, sentence by sentence.
- **`fourth-watch-story` is a draft under test.** `fourth-watch-writer` stays until the new skill wins the test in `.claude/skills/fourth-watch-story/evals/test_plan.md`.
- **No agents without his approval,** including for that test.

## Round 48 (Nov 5, 12:20 to 12:31): one route, one style, no old code
His words: "it sboaut creating this sucessfull skill file that is difficult for someone else to create, so that it is good enough that upon request we can use it to create a high quality animation coded video, to srcipt it, voice it, addd captions, the full package." "what else did we purchase the higgsfiled subscription for, yes we need one universal type of visaul style, once we create our first video we will use that style, dont do anythign before asking my question." "yea we need to delete anything thats poiting at our old code, old aniamtion style, before we introduced higgsfiled to the table." "i see no profitable reason for proving the movement, we dont need to prove it if we set the rule sin the script, andthen let higgsfiled work the magic."

Rules:
- **The goal is one skill that makes the full package on request:** script, voice, captions and animation.
- **Every video is built in Higgsfield with Higgsedit.** The old engines and their tools are deleted, and stay on the branch `archive/pre-cleanup-2026-11-05`.
- **One universal visual style.** The first video sets it, and every later video reuses it. This narrows Round 37.
- **No separate movement test.** Movement rules go in the plan, and Higgsfield carries them out. This replaces the placeholder step in Round 35.
- **When he asks a question, answer it and ask before starting work.**

## Round 49 (Nov 5, 12:49): the first story, and finish the skill first
His words: "i want the first story to be about the beginning of the world, i wan tot go with: 3. Why did God call everything good, then say something was not good?" "credit budget per video im not going to set just yet, i care more about quality, but we only will be able ot deliver this quality once we are compeltely set with the skill file." "be careful with the credit usage." "once the entire skill file is odne with, i want us to create that storybaord, not the video and well tweak form there." "look for some things you odnt want to be too paranoid with, we cna decide once we have our first video."

Rules:
- **The first video is the beginning of the world:** "Why did God call everything good, then say something was not good?"
- **Order:** finish the whole skill file, then make the storyboard for this story, then tweak it. No video yet.
- **Decide the look, the budget and the voice later.** They wait for the first video and don't hold up the skill.
- **Quality comes first, and credits stay careful.** Every paid job still needs his approval.
- **Don't over-worry.** Make reasonable calls and let the first video settle the rest.

## Round 50 (Nov 5, 13:38): notes on Genesis script v1
His words: "you are too lsow to move with teh story, you shoudl be fastwofarding the sotyr not saying eveyr deatil there but laos moving foward to maybe more details of the sotyr." "with the serpant and the apple, that part being left out is stupid."

From the critique he passed on: "an emotional insight should emerge from the events of the story, not interrupt them." "Make the audience experience Adam's solitude and the significance of Eve's arrival before explaining what it means."

Verdict on v1: the discovery is excellent, but the emotion was explained rather than experienced.

Rules:
- **Emotional insight comes out of the events. It never interrupts them.**
- **Let the viewer experience it before explaining what it means.**
- **Fast-forward the story.** Skip minor detail, keep moving, and go further into the story.
- **Don't stop short of the famous part.** If viewers expect it, it belongs.
- **Two or three examples set a pattern.** Six is too many.
- **The ending should carry human meaning, not only an explanation.**
- **Cut lines that raise a side issue the video won't answer.** "Nobody has died" raised animal death before the fall.
- **Don't imply that singleness is incomplete.** Genesis 2 is about Adam's counterpart.
- **Keep clear what a verse evaluates.** "Very good" covers everything God made.

## Round 51 (Nov 5, 13:44): AI critiques of Genesis script v2
Marcus passed on critiques from Grok and ChatGPT, which are AI readers, not an audience. Their points were checked against the text and used as criticism.

Rules:
- **Don't give God a motive the text doesn't state,** even at the emotional hinge. Let the action stand.
- **When a story runs past its opening question, make the link between the two halves unmistakable.**
- **Don't merge separate actions for rhythm.** Check that each compressed line still matches the text.

## Round 52 (Nov 5, 18:33): reverse engineer working videos
His words: "i want us to reverse engineer working videos, not copy script word for word but get around it, come up with our own topic idea and then be able ot work around an already existing script from a succesfull vdieo."

Rules:
- **Scripts can start from a successful video's structure.** Use its beat order, timing, opening and ending.
- **The topic, question and words are our own.** Don't reword a source's sentences one at a time.
- **Scripture beats the blueprint.** If a beat doesn't fit the text, change the beat.
- The method and the first three blueprints are in `.claude/skills/fourth-watch-story/references/blueprints.md`.

## Round 53 (Nov 5, 18:37): named sections from proven scripts
His words: "seperate the script by aprts naed sections and see hwy they were susccesufll in that order." "similar outcome based of what the sections of the proven working scripts accompplish."

Rules:
- **Break a proven script into named sections, and say why each works in that order.**
- **Each of our sections has to accomplish the same job.** The topic, argument, examples and words stay our own.

## Round 54 (Nov 5, 18:46): the story still fails
His words: "the story we have chosen still does not succedd!"

Rules:
- **Script v4 is rejected at the level of the story.** A proven section order doesn't rescue a weak question.
- **Check the question before writing.** See whether people already watch it, and whether the viewer loses something if it stays unanswered.

## Round 55 (Nov 5, 18:50): new question chosen
His words: "lets do it"

He accepted the proposed question: "If God doesn't need anything, why did he make you?" It replaces the "good, then not good" question as the first video, and the story stays at the beginning of the world.

## Round 56 (Nov 5, 19:10): fix the weak points and check the Scripture
His words: "fixe the weakest points so that there are none, then think if thisis actually scripturally accurate"

The check found that v5 reversed Genesis 3:8, claimed "one reason" when Scripture gives several purposes, left out death, implied one day, and cut Mark 10:45 before "ransom." All are fixed in v6.

Rules:
- **Check the order of events verse by verse.**
- **Before ruling out an answer, search the whole Bible for verses that give it.**
- **If a story shows mercy, it also states what the sin cost.**
- **A shortened quote must keep the verse's point.**
- **Figures of speech can claim a time the text doesn't give.**

## Round 57 (Nov 5, 20:33): plainer words, better-known verses
His words: "some of the wording here is weird, and good be repalced wiht soethign better." "you mentioneing stuff such as god waswalking in the garden is rcazy to the average viewer so might need osme scriptural backing." "phrases ushc as to give his life as ransom for many could be repalced with aphrase that gives the same meaning but is much more well known and allows hte viewer to connect better to."

Rules:
- **Read every line aloud, and rewrite anything that sounds like an essay or a clever note.**
- **When two verses say the same thing, use the one people already know.**
- **If the Bible says something that will sound strange, quote it word for word and name the book.**
- **Use the names people know.**

## Round 58 (Nov 5, 20:42): clarity comes first
His words: "this is so damn unclear." "claiming he doesnt need it, must be backed by scripture, so visually the scripture vers emust be showed and as aprt of the script hte narrator could say somethign like as passage so and so says in sirpture." "overlal there is alot of unclearness, and your choice or wording to convey hte message is not the best choice and will leave the viewr and audinece confused, you must avoid this way of scripwriting."

Rules:
- **Clear beats clever.** Every line must make sense on one listen to someone who has never opened a Bible.
- **Back every major claim about God with Scripture.** The narrator names the passage, and the exact verse is on screen.
- **Never speak a verse whose wording needs explaining.** Say it in plain words, and show the exact verse.
- **State what a first-time viewer doesn't know before relying on it.**

## Round 59 (Nov 5, 21:46): build the end on the best line
His words: "the ask doe snot tie to wha the message is about gods first words were where are you this is amazing, capitalize on this for the END!!!!"

Rules:
- **The ask must grow out of the message.**
- **Build the ending around the video's best line.** Hold it back if you can, so it lands there for the first time.

## Round 60 (Nov 5, 21:59): explain, apply, conclude, then encourage
His words: "exaplnd on what this actually means exaplin, then say how it applies in our lives, and then final conclusion, the quesiton at the end should never ponteitlaly cause ht eperoson to feel negative like they would form this quesiton instead they shoudl feel happy encouraged so ask a better question"

Rules:
- **After the key moment, explain what it means, say how it applies to our lives, then conclude.**
- **A closing question must leave the viewer happy and encouraged.** It can never make someone feel judged or exposed.

## Round 61 (Nov 5, 22:03): nothing new after the moment
His words: "after the moment u introduce new ideas!!!!!! chilll"

Rule:
- **Add no new verse, fact or idea after the key moment.** Keep what follows short, and plant anything it needs before the moment.

## Round 62 (Nov 5, 22:06): script approved, storyboard next
His words: "good now work on visual storyboard"

Script v11 is approved and locked as `ep11-beginning/script_approved.md`. The storyboard is free planning work, and nothing is animated until he approves it.

## Round 63 (Nov 5, 22:53): storyboard visuals rejected
His words: "i dont approave of this visual desing"

He rejected the look of the first storyboard and shared three AI critiques. AI critiques are opinions, not audience evidence. The approved script stays locked.

## Round 64 (Nov 5, 22:56): test the styles
His words: "not sure lets test it out, give me few different storybaord design types and lets compare nad contrast"

Four styles were drawn in code for free on the same five moments: Charcoal, Cut Paper, Painted and Engraving. AI 1's black silhouettes were left out because he rejected black rim-lit cut-out figures on Nov 3. He hasn't chosen a style yet.

## Round 65 (Nov 5, 23:08): Cut Paper leads
His words: "cut papaer clearly wins but htis owuld be 2d not 3d, is this what we are going for?"

Cut Paper is his leading style. It isn't approved as the universal style until it's proven in motion. He asked whether 2D is the right direction.

## Round 66 (Nov 5, 23:12 to 23:15): show it in stills, no video
His words: "dont reate a video show me visually how it could owrk." He then shared advice on Cut Paper from Gemini, Grok and ChatGPT.

Rules:
- **Don't make a video for this test.** Show the style in still frames.
- AI advice is opinion. It doesn't override his rules. Dot eyes stay banned, and "at last" isn't in the locked script.

## Round 67 (Nov 5, 23:30): full storyboard in Cut Paper
His words: "i opened its eyes that we first care baout hte visual priority." He shared Grok's and Gemini's advice to rebuild all 34 shots.

The storyboard is rebuilt in Cut Paper as still frames, with no credits and no video. The chalk shots became paper ideas hung on threads, because one film needs one visual world.

## Round 68 (Nov 5, 23:49 to 23:52): revise five shots, and don't lock the style yet
He shared GPT's and Grok's reviews of the 34 shots, then their replies and Gemini's on whether Cut Paper can really succeed. GPT asked for changes to shots 10, 14, 18, 23 and 29. It then said the look is a promising identity, not yet a competitive standard, and that Eden still resembles a children's picture book.

Done: shot 10 now has one dark tree alone in a clearing. Shot 14 shows two leaves and a taut thread. Shot 18 is near-stillness, not a hard freeze. Shot 23 is a larger curved Earth. Shot 29 is stunned mercy.

Rules:
- **Cut Paper stays the leading candidate. It isn't locked.** He hasn't approved the style or the storyboard.
- The AIs reviewed code-drawn art. Their notes judge this execution as much as the style. Test the style and the drawing route separately.
- These are AI opinions, not audience evidence. Nobody has shown audience numbers for this style in Reels or Shorts.
- Still no video. Motion tests wait for his words.

## Round 69 (Nov 6, 00:03): run the side-by-side test
He said yes to the test on shots 2, 13 and 26, with GPT's, Gemini's and Grok's notes. The test is one shared brief, made in code and in ChatGPT, then shown blind to about five strangers.

Rules:
- Both versions aim at the same style and composition, so the test is of the style, not the tool.
- Stills only: no animation, no Higgsfield.
- The brief, fairness rules and decision rule are in `ep11-beginning/style_test/side_by_side/BRIEF.md`.
