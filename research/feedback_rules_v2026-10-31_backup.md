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
