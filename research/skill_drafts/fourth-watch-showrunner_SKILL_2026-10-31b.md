---
name: "fourth-watch-showrunner"
description: "Write, fact-check and auto-revise Fourth Watch Bible reel scripts, direct them shot by shot to the standard measured on three hit channels (every clause shown happening, a change every 1.5-2 s), and QA every rendered cut until it passes."
---

# Fourth Watch — showrunner

Use this before building ANY Fourth Watch episode, and again after EVERY render. Two gates, never skipped:

1. Nothing is animated until the script passes the script loop (section 4), the shot list passes the shot loop (section 5) and `tools/shotlist_check.js`, **and Marcus approves both**. No overnight build from a shot list he hasn't seen.
2. Nothing is handed over or posted until the cut passes the video loop (section 7).

The full playbook is the doc at https://claude.ai/artifact/JU1YddtGgJ8ofRUKvkcbfb (read it with the docs tools when a rule here is unclear). **Direction is governed by `research/direction_rules.md`** (v2): rules measured from all 14 Lintel Network Shorts and cross-checked on Bible Animations and BibleProject (24 Shorts, hits against lows). Rules tagged [ALL] held on every channel, [2 CH] on two, [THIN] rest on one video; [HOUSE] rules are our chosen style and never outrank an [ALL] rule. Version 2.1 was audited line by line against its evidence files. Read it before writing any shot list. **Script structure is in `research/script_rules_from_hits.md`** (14 checkable rules from 13 Lintel Shorts); read §3 before drafting. The QA checker lives on the Fourth Watch Toolkit page, https://claude.ai/artifact/JyTKFVjpgxF4aRMfrMzt9m (section 3). This skill is the working summary. Marcus's corrections are logged round by round in research/feedback_rules.md; read the latest rounds before drafting.

## 1. Series rules (canon)

- **Channel:** Fourth Watch (Matthew 14:25, ESV: "And in the fourth watch of the night he came to them, walking on the sea."). Faceless, code-animated, no photoreal images.
- **Format:** 9:16, 1080×1920, 30 fps, one question per reel. Length by series (the checker's table): ASK THE TEXT target 85–135 s including the closing card and logo (Lintel hits ran 84, 89 and 137 s), hard cap 150 s; MOST PEOPLE MISS / STRANGE BUT TRUE / MISQUOTED 30–60 s. Speech at least 2.6 words/s over the whole runtime, about 2.7 over the voice (the slowest Lintel hit reads 2.59 over the whole runtime; the other channels' hits 2.7–4.1 over the voice; the slowest Lintel reels, 1.7–1.8 words/s, were lows). Length did not separate hits from lows on any channel (Lintel hits 84–137 s, the other channels' hits 47–60 s): shorter is never a mistake if the reel still answers its question. Script budget for ASK THE TEXT: about 230–300 words. Anything that needs more than 150 s is a long-form episode (16:9, chapters), not a reel.
- **Series (exact labels):** MOST PEOPLE MISS · ASK THE TEXT · STRANGE BUT TRUE · MISQUOTED (HERO OR VILLAIN? retired Oct 28: a verdict on a person is an opinion).
- **Beats (ASK THE TEXT; shorter series compress them):**
  - Hook 0–5.5 s: the VO says the title word for word, fully spoken by 5.5 s. The question names a Bible person, object or event and asks about them in the third person: all three Lintel hits do this, and every "you"/"we" hook in the set was a low *(inferred; topic is a confound)*. The Round 12 form "If [what you believe], [troubling question]?" still works when it names them (Tree, 7.6M: "If God knew Eve would eat the fruit, why didn't He remove the tree?"; Cain's wife, 1.8M: "Where did Cain's wife come from?"); the abstract version ("If God is love, why is there a hell?", 194K) and second-person versions were lows. Prefer puzzles people already type (check that the hook autocompletes). The question is fully on screen from frame one **as the top narration caption, never a static title card** (0 of 3 Lintel hits used a big title; BibleProject's titles become the picture within 2.5–4.3 s). Something visibly changes by 1.3 s (all 9 hits on three channels: 0–1.3 s, judged). The first big visual change (a pull-out reveal, a whoosh-in, a transform) lands on the question's key word. The hook image returns when the answer lands (hits 5 of 6, lows 1 of 4). Frame one's composition is free (a person plus the key object is one option, not a rule).
  - Stakes 3–10 s: name who believes or asks it (critics, a scholar, a common saying, "people ask this all the time"), then a one-line pivot into the text ("It sounds convincing until you open Judges.").
  - Story: at most 25% of the runtime, and retelling the famous parts at most 10% (Marcus's hard cap is about 40%; the Lintel hits retell 0–5%; the two story-led Lintel reels, 69% and 82%, were lows). Open on the scene that holds the overlooked detail and cover what came before in one or two lines. The "But notice…" turn comes by about 25 s (the top six turn at 14–25 s, after at most ~14 s of story).
  - Points / turn: the format that fits the question (section 2b). Each point = claim → one quote → a plain one-line reframe that says what the quote proves. State the core answer plainly, in the narrator's words, at 35–50% of the runtime (the top six: 33–50%; the question-video lows: 59–82%), then spend the second half on 2–4 new evidence beats: another verse showing the same pattern, a little-known detail, a refuted wrong reading ("Some say… The text never says that."), or a fair note where Christians differ. The first-light warming lands on the answer line.
  - Landing: the answer is already stated plainly in the points; end on the story's comfort line (e.g. "Samson's failures weren't the last word on his life, and yours don't have to be either."). Marcus wants comfort, never a pointed finger, and has rejected hook-restating lines that sound like a verdict or a sermon ("that's not His approval, it's His kindness, calling you back to Him"). All three Lintel hits re-ask the hook in its own words at 82–89% of the runtime, then answer it in one line (Round 12 logged this ending). Marcus rejected one echo line as corny, so the one-line answer to the re-ask must be the hope or comfort line that fits every viewer, never a verdict or a "come back".
  - CTA (last line): one comment question of at most ~17 words, tied to the episode's central image or prayer, on a card (options pop on their words; any typing finishes within 1–2 s of the last word), then a short logo. **The reel ends at most ~4.5 s after the last spoken word** (the other channels' hits end 0–1.2 s after it, Lintel's about 3–3.6 s; fw_check FAILs over 7 s). No community/"welcome"/follow card (every Lintel reel with one was a low).
- **Answer and value (non-negotiable):** every reel answers its own question out loud before the CTA, and teaches at least three things most viewers don't know, each from the text. Numbered points must be the same type and give the viewer value for their own life ("what we should remember"), each proven by the story; facts about the character are not value. Not every video has points: pick the format that fits (2b). The famous version of the story gets under a third of the runtime. If a fact-check fix weakens the answer, find a different accurate answer; never retreat to an open question like "which do you see?".
- **Earn the verdict on screen:** the story itself must show why the answer holds (a deed, a prayer, a quote in its context). A later authority ("the New Testament says so") can confirm the verdict, never carry it alone. Give the viewer the context that changes the meaning (who the crowd was, what they were celebrating). Never dodge the famous line: if the text says what everyone remembers (Samson told Delilah a razor would take his strength), say it, then show what the text adds. Leaving it out reads as fudging.
- **Scripture:** ESV only, word for word, one or two quotes, each on screen with its reference. Scripture only: Enoch, legends or "scholars say" are never presented as Bible. Contested questions: say what the text says and name the main views in one line ("Christians still disagree on… Some believe… others… But every view agrees…"). Never invent dialogue, motives or events, and never chain facts into causes the text doesn't give. A thinker or study outside Scripture may appear only attributed by name and only to sharpen the question; Scripture settles the answer. Reverent, curious tone. The only call to action in the VO is the final comment question (no "follow/subscribe/like" lines; those go in the caption). Before the CTA, plant a line people would send to a friend. No outside authorities as support: the hits quote no one but Scripture, and the reels built on named thinkers were lows. At most 3 "you" lines in the whole script (the top six have 1–3; the reels with 5–9 were all lows), and none of them describes the viewer's conduct.
- **Wording rules from Marcus:** never assume the viewer's state ("how far you've fallen", "calling you back to Him") and no churchy stock phrases; comfort must fit every viewer. Never mention something the video doesn't show ("he used it for revenge" with no revenge scene). Say purposes plainly ("to be used to help other people", not "for other people"). Labels and point names must read naturally out loud; avoid the word "verdict"; introduce the story naturally ("Let's look at Samson, known as…"), never open cold on a sin; give context before a repeated event (why Delilah kept calling him); no ambiguous time words ("on that day" → "on the day of judgment"; "Later on" before a time jump); don't repeat a fact the viewer just heard; a CTA is a real question, open or personal, not either/or unless the episode is built on a choice.
- **Voice:** Marcus records the final narration in ElevenLabs (Eleven v4, his chosen library or Voice Design voice; stability ~50%, similarity ~75%, speed 1.0; never a clone of another creator's narrator). Give him a paste file: LORD → Lord (caps make it shout), numbers spelled out where needed, an ellipsis or [short pause] before the verse line and the point roadmap. Real pace ~155–170 wpm, short phrases, number words held alone. After the take arrives: speech recognition → word times → re-time every cut. Music ~9–10 dB under the voice; one signature tone on the turn. Mix to −14 LUFS (−16 to −12), true peak ≤ −1 dBTP.
- **Captions:** the same words as the VO (generated from the VO text, never retyped), timed to the spoken word. Burned-in narration builds word by word at the top third (italic serif, 2–3 lines, 1–3 key words per sentence in gold), as on Lintel; the .srt goes to the platform. One primary text element at a time (title, quote card or caption); a concept pill, chapter pill or series tag may sit with a caption; text never covers a face.
- **Safe areas (1080×1920):** nothing in the bottom 400 px; nothing in the right 140 px below 45% of the height (Instagram's buttons); 60 px side margins; nothing in the top 120 px.
- **Look:** palette Night #14100D, Umber #2A1E16, Clay #6B4A33, Lamp gold #E3B25C, Parchment #F2E6CF, Ember #C2502E (sparingly), Night sky #1C2433, Ash #8C8174. Titles Cinzel Bold caps, cream with gold key words, series tag above. Verse cards Cormorant Garamond Italic on a darkened band. One character template: about 6.5 heads tall, oval head, dot eyes with a highlight, mitten hands, no outlines, layered robes, five warm skin tones, one shade tone on the side away from the light, identity by costume and one prop. One key light per scene with god-rays, a floor glow, 40–80 dust specks, vignette 25–35%, grain 3–5%. The camera is locked or drifting a few % in most shots (camera amount did not separate hits from lows on any channel); big moves (≥15%) only for five jobs: the hook reveal, travel linking scenes, following a walker, pushing into a revelation, carrying one picture into the next. Three parallax layers. Scene changes land on the first word of the new clause, by a whoosh (elements exit and enter with motion blur), a graphic morph (a shape becomes the next scene), a short crossfade, a match-dissolve for a symbolic link, or a dip to dark before the end card. The 0.2 s cream flash only for a real jump in place or time; on Bible Animations it shows up in the lows. God acting as light from above is a convention on Lintel and BibleProject, not a separator. Devices (the Lintel-proven set, in our look): the question as the top caption over the opening action; concept pills (dark rounded label, bottom-center of the scene) naming the idea on screen; parchment quote cards over the dimmed live scene (key words in gold, reference below); book-intro cards (an open Bible with rays and the book's name) before a book is first quoted; numbered-point stamps that settle into a chapter pill; a literal visual metaphor for every abstract phrase (curtains for "playing a part", a door for "I never knew you", a dimming lamp for "the LORD had left him"); modern-life scenes drawn in the same style for an optional bridge; highlight rings; big number cards; a callback of the opening image near the end; an "arrival" image under the answer line (people walking into a lit door); a counter that ticks a number the VO says (coins, days, deaths); subtraction (objects vanish to show a consequence); stamps, strikes and red X's for verdicts; simple diagrams for logic; UI mock-ups (a search bar, comment bubbles) for "people ask"; a CTA card with the question and a comment being typed; a hard cut to the logo end card. From the other channels' hits: a blank-faced figure who voices the doubt or carries the example (never shown doing wrong); figures that whoosh in on their name and leave when the line moves on; comic speech bubbles for short quoted claims (`shot.bubble`); a verse acted on while it holds (a phrase turns gold on its word: `VERSES[i].marks`); a "?" silhouette filled in later; comic-panel insets for parallel actions; one object that keeps transforming to carry a list; scale as data (age as figure size); a fast climax run of 1.1–2.2 s shots on the key event. Also: two lights (gold from above for what God did, ember for the person's own choices; a faint gold may stay on someone while the text says the Lord is with them, constant and never brighter on their failures, and it goes out exactly where the text says the Lord left; never a balance or weighing, because Scripture's verdicts rest on the text and on faith, not a tally of deeds), big number, verse card, map card, crumbling line (MISQUOTED), first light (the turn).
- **Cinematography (full rules in the playbook's Cinematography section):**
  - Shot sizes: extreme wide (place, scale), wide (who and where, head ~40% down), medium (action), medium close-up (speech, decision), close-up (emotion, the turn), insert (a prop that carries meaning). In MCU and CU the eyes sit 38–42% down.
  - **The rule above all: every spoken clause gets a picture of that clause happening** (direction_rules.md §0). A verb is acted by the character on that word; an idea is one object that something happens to, pinned by a 2–5 word pill; something changes in every shot. A character standing while the voice tells what they did is a defect.
  - **The beat clock:** something visibly changes about every 2 s or more often (an action, an entrance, a pill, a counter tick, a light change, the camera arriving). It was the clearest difference between hits and lows on the other two channels (judged: ~1.2–1.6 s) and between Lintel's reels and Ep 1 v57 (measured). No more than 30% of the runtime in stretches over 4 s without a change; at most one stretch over 6 s and none over ~7.5 s (Lintel 2.0–2.4 s, 19–21%, longest 5.5–7.4 s; Ep 1 v57 2.5 s, 47%, longest 8.5 s).
  - Rhythm: one new picture per spoken sentence (a new subject entering a held set counts); typical shot 3–5 s (hit medians 3.2–5.1 s on three channels); under 2 s only for list items or a fast climax run; nothing under 1 s except a transition; 6–12 s only with a beat every ~2 s inside; nothing over 12 s except a diagram that keeps building (Lintel's Never heard holds one 17.9 s). Avoid both extremes: shot medians near 1.7 s or 6–8 s were all lows.
  - Moves: drift push-in 2–4% across a shot; story push-in 6–12% over 1.5–3 s; pull-out 8–15% over 2–3 s to reveal; crane (vertical) up to 40% of frame height over 2–3 s; truck at most 25% of frame width per second; rack focus 0.4–0.6 s; locked hold for the turn line; impact shake at most 12 px, gone in 0.4 s, only on a strike or collapse; whip pan 0.2–0.3 s only as a transition.
  - One main move per shot plus parallax; every move starts on the word that motivates it; cubic in-out easing (ease-out on arrival after a cut); hold 6–10 frames after a move settles before cutting.
  - No jump cuts: consecutive shots change size, angle or both. Fixed screen direction: God's light comes from the top left (gold); enemies and ember light sit screen right; the lead faces right toward the conflict.
  - Compose for 9:16: key action between 22% and 60% down, clear of the title zone and the caption band; stack vertically; prefer vertical moves. Four depth layers in every shot (far 0.2×, middle 0.5×, subject 1×, soft foreground 1.4×); a foreground element in at least every other shot.
  - Light is motivated and changes only on story beats (cooler on the villain side, dark when the light leaves, warm first light at the turn's answer). Cut on the word that names the new thing or on action; light sweep for a time jump, dip through darkness for a loss, dust burst for an impact.
  - Text is fixed to the screen and never moves with the camera; captions are hidden while the title or verse card shows the same words. Sideways motion under 40 px per frame; motion blur on whips and impacts. Shortly before the end card, a callback shot returns to the opening composition.

## 2. Script format (the checker reads these labels)

```markdown
# Was Samson a hero or a villain?
series: ASK THE TEXT
target_seconds: 58
answer: A flawed hero of faith. His failures were his own. His strength was God's.

## Hook
VO: Was Samson a hero or a villain?
ON-SCREEN: WAS SAMSON A HERO OR A VILLAIN?
VISUAL: Blind Samson between two huge pillars, a hand on each; a crack climbs one pillar.

## Stakes
VO: Most think his strength was in his hair. [Judges 16:17]

## Story
VO: But three times, the Spirit of the Lord rushed upon him. [Judges 14:6, 14:19, 15:14]
VISUAL: Three gold rushes of light: the lion, Ashkelon, the ropes falling away.
VO: He demanded a wife from Israel's enemies. "Get her for me, for she is right in my eyes." [Judges 13:1, 14:1–4]
VERSE: "Get her for me, for she is right in my eyes." — Judges 14:3 (ESV)
VO: Later, he told Delilah he was set apart to God. No razor, or his strength would leave. [Judges 13:5, 16:4, 16:17]
VO: She had his seven locks shaved. The Lord had left him. [Judges 16:19–20]
VO: The man who lived by his eyes lost his eyes. [Judges 16:21]

## Turn
VO: But blind, he looked to God for strength, to avenge his two eyes. [Judges 16:21, 16:28]
VO: And the house fell. [Judges 16:30]
VO: Hebrews 11 names him in a list. Through faith they "were made strong out of weakness." [Hebrews 11:32–34]
VERSE: "were made strong out of weakness" — Hebrews 11:34 (ESV)

## Landing
VO: Hero or villain? A flawed hero of faith. His failures were his own. His strength was God's. [Judges 16:1, 16:17, 16:20, 16:28; Hebrews 11:32, 11:33, 11:39]

## Value
- His strength came from God, not his hair [Judges 14:6, 14:19, 15:14]
- The man who lived by his eyes ("she is right in my eyes") lost his eyes [Judges 14:3, 16:21]
- Hebrews 11 names him among those who through faith "were made strong out of weakness" [Hebrews 11:32–34]

## Caption
Hero or villain? The answer is in Judges 13–16 and Hebrews 11:32–34. Read it yourself.

## References
- Judges 13–16

## Fact-check log
| Claim | Verse | Checked against | Status |
| --- | --- | --- | --- |
| Three times the Spirit of the LORD rushed upon him | Judges 14:6, 14:19, 15:14 | esv.org | verified |
```

The first VO line is the hook and must equal the title. `answer:` is the one-sentence answer; the Turn/Landing VO must state it before the CTA, and only the final CTA line may be a question. `## Value` lists at least three things the viewer learns, each with a [reference]. Every Story and Turn VO line carries a [Book chapter:verse]. Save scripts as `episode.md` (or `<slug>.md`) in the episode folder, and back up every version before editing (`episode_vNN_backup.md`).

## 2b. Script craft (Lintel-grade patterns, from the Oct 30 study of 10 of their videos; notes in research/lintel_study_10.md)

Pick the body format from the question, never by habit:
- **Objection → numbered answers** ("If God is love, why is there a hell?"): spoken ordinals with the point in one breath ("First, ask who hell was made for."), each point claim → quote → one-line reframe.
- **Escalation ladder** (a "what if" or a loss): no numbers, each beat bigger ("only the first thing to change… even more striking… even that is not the greatest loss").
- **Evidence → answer** (a character question): three or four text facts, then the one-line answer.
- **Counterfactual walk-through** ("Why didn't God remove the tree?"): follow the alternative to its absurd end ("a world with no choice left in it").
- **Puzzle → clue** ("Where did Cain's wife come from?"): "The clue is one chapter later."
- **Refrain** (Ep 2 Judas): a repeated line that escalates to one realization.

Every script also carries:
1. **A stakes beat** that names who asks or believes the question, and a one-line pivot into the text.
2. **One plain reframe line per point**, and at least two quotable aphorisms in the whole script (short, concrete, true to the text: "He knocks, but he never kicks the door in.").
3. **Optionally, one modern-life bridge** when a point needs it ("Life works the same way. A colleague lies about you…"), drawn in the same art style. It is an analogy, never presented as Scripture. Marcus: not every video needs one.
4. **Specifics in every story line:** names, numbers, places, objects.
5. **A clean ending:** the answer is clear before the last beat; end on the story's comfort line, then the CTA tied to the central image or prayer. A one-line hook echo is allowed only if it neither preaches nor assumes the viewer's state.
6. **A word budget:** count words before showing Marcus; over budget, cut repetition first, then the weakest example, never the answer or the context a first-time viewer needs.
7. **Write for pictures** (direction_rules.md): every sentence names something that can be shown happening: a person doing a verb, or an object something happens to. Lists of parallel items ("every war and every sickness") are welcome: each item becomes its own beat. If a sentence can only be shown as a character standing or as text on a card, rewrite it or give it an object. Prefer questions people already search for (all three Lintel hits are widely asked puzzles).
8. **The hit structure** (`research/script_rules_from_hits.md` §3; `fw_check.py script` checks most of it):
   - a third-person hook about a named Bible person or object;
   - sentence 2 sharpens it with a concrete Bible fact;
   - the turn by ~25 s;
   - story at most 25%;
   - the core answer at 35–50%, followed by 2–4 evidence beats;
   - a line after every quote that says what it proves;
   - no lessons before the first proof;
   - the hook re-asked at 75–90% and answered with the hope line;
   - at most 3 "you" lines;
   - a CTA of at most 17 words;
   - 230–300 words.
   
   **Did not separate hits from lows (don't chase):** density of names and numbers, sentence length, the number of quotes or aphorisms, "people ask this" lines, numbered points, CTA type.
   
   Marcus's Round 8 asks for a one-line takeaway after each story beat. Write those takeaways in the third person ("That's how drift starts.") so the "you" count stays at 3 or fewer.

## 3. Set up the checker (once per session)

1. Fetch the checker byte for byte; never retype it. Call the Artifact tool with `action: "read"`, `url: "https://claude.ai/artifact/JyTKFVjpgxF4aRMfrMzt9m"`, `path: "fw_check.py"` (and, when the working folder lacks them, `tools/shotlist_check.js`, `research/direction_rules.md` and `research/feedback_rules.md` from the same page). It saves the file locally; copy it to `fw_check.py` in the working folder. Then run `sha256sum fw_check.py`. It must match the fingerprint in section 9. If the fetch fails or the fingerprint differs, stop and ask Marcus to attach `fw_check.py` (he can copy it from the toolkit page) or to re-share the page. Never rebuild the checker from memory.
2. Install what is missing: `pip install --break-system-packages sherpa-onnx opencv-python-headless numpy pillow`. It also needs ffmpeg/ffprobe and the tesseract CLI. On the first video check the speech model (about 110 MB) downloads from GitHub into `~/.cache/fourth-watch/asr`. If the download is blocked, the check still runs and says the hearing check was limited.

## 4. Script loop (auto-revision) — before Marcus sees a script

Run up to 5 rounds of steps 1–5.

0. **Answer first.** Before drafting, write the `answer:` line: the one-sentence answer the text gives to the title question. Then list at least three things most viewers don't know that prove it (they become `## Value`). Only then write the VO, so every line serves the answer.
1. **Lint:** `python3 fw_check.py script episode.md --out qa/script`. Fix every FAIL; fix every WARN or justify it in one line.
2. **Rubric:** score each 1–5 with one line of evidence. Answer and Value must score 5; rewrite anything else under 4.

   | Criterion | A 5 looks like |
   | --- | --- |
   | Answer | The title question gets a clear answer from the text, stated in one plain sentence in the Turn/Landing, before the CTA |
   | Value | At least three things most viewers don't know, each from the text; the famous version takes under a third of the runtime |
   | Hook | The title alone would stop a scroller; it names a Bible person, object or event, in the third person; a puzzle people already type |
   | Structure | Turn by ~25 s after at most ~14 s of story; core answer at 35–50%; story at most 25% (cap 40%); the hook re-asked at 75–90% and answered with the hope line |
   | Open loop | Stakes name who believes or asks it (a real source or common saying) and promise something the viewer doesn't know; a one-line pivot into the text |
   | Format fit | The body format fits the question (2b); points, if any, are the same type and give the viewer value for their own life |
   | Reframes | Every point ends in a plain one-line reframe; at least two quotable lines in the script |
   | Bridge (optional) | If used, one modern-life analogy makes a point land; clearly an analogy |
   | Length | 230–300 words (ASK THE TEXT), about 90–120 s at 2.7–3.0 words/s plus ≤4.5 s after the last word; shorter is fine if the answer and three new things survive |
   | Concrete | Names, numbers, places or objects in every story line |
   | Clarity | A first-time viewer always knows who, where and what is happening |
   | Turn | One line reframes the question, and it is what the text says |
   | Landing | The answer is clear; ends on a comfort line that fits every viewer (never a pointed finger, never assumes they strayed), then a CTA question tied to the central image |
   | Sendable | There is one specific kind of person the viewer would DM it to |
   | Picturable | Every sentence names an action or object that can be shown happening (no line that leaves a character standing); the hook names a person and a key object |
   | Accuracy | Nothing claimed beyond the verses cited: quoted verbs match the ESV exactly, counts hold for every item, implied events are shown not stated ("God answered"), nothing is called "last" unless the text makes it last |
   | Tone | Reverent and curious; no mockery, slang or hype |

3. **Independent fact-check:** start a separate agent that has not seen your drafting. Give it every VO line with its reference, every VERSE line, and any "handle with care" note from the playbook's episode bank. Tell it to verify each line against ESV text found by searching esv.org, biblegateway or biblia (not from memory), to report per line VERIFIED / CORRECTION (with the exact fix) / OVERCLAIM (with a rewording), and to confirm quotes word for word. Send every VISUAL line as well, including light cues and gestures, and ask whether each happens where and when the text puts it. Example: Samson's strength left while he slept (16:19). During his prayer his hands only feel the pillars; the grip comes after (16:26–29). Tell it the episode must answer its question: every correction keeps a clear answer, and if the verdict itself is not defensible it proposes the strongest verdict the text does support, never an open question. Apply every correction. Fill the fact-check log only from its report: "verified" only where it said VERIFIED.
4. **First-time-viewer critique:** start another separate agent (a new one every round, so it has never seen an earlier draft) with only the VO and VISUAL lines (with timestamps). Write the VISUAL lines as what is on screen only. Strip production notes that tell the viewer what to conclude ("no gold yet", "not the Spirit's gold"). Tell it not to use tools, so it cannot read earlier drafts in the workspace. Ask: what was the question; what was the answer, in your own words, and was it clearly answered or dodged (1–5); list everything you learned that you didn't know before, and anything that felt like a retelling; where were you confused; which line was weakest; would you send it and to whom; did the ending feel earned or just asserted. Fix what it reveals. If it cannot restate the answer correctly, or lists fewer than three new things, the script fails this round.
   Run steps 1–4 on EVERY revision Marcus will see, not only the first draft; never present a "pass" that is two or three trims. If a device (a count, a mirror, a callback) doesn't land with the first-time viewer, cut it.
5. **Re-lint.** Done when the lint has 0 FAIL, Answer and Value score 5 and everything else 4 or more, every fact-check row is verified, and the first-time viewer restates the answer correctly and lists at least three new things. Otherwise run another round. After 5 rounds, stop and show Marcus the best version with the open issues listed.

Then give Marcus the script on its own, with the estimated runtime, the rubric scores and a 3–6 bullet change log. Do not start or revise the camera plan while the script is still changing. Start the camera loop (section 5) only after he approves the script, then give him the shot list. Build nothing until he approves both. If he edits either, re-run the affected checks (script: steps 1 and 3; shot list: section 5).

## 5. Shot loop — the shot list, after Marcus approves the script

Read `research/direction_rules.md` first. The shot list lives in the episode's `score.js` (one `add()` per shot) with the direction fields documented in `scenes/_API.md`.

1. **Time the voiceover.** Until Marcus's ElevenLabs take exists, estimate word times at 2.8 words/s with pauses (0.25 s between lines, 0.45 s between beats, 0.55 s before the turn). After the take: speech recognition → word times → `vo.js`, and every cut and beat moves with it. Put every cut within 0.15 s before the word it cuts on. If the take reads under 2.7 words/s, offer Marcus a 1.03–1.08× speed-up with the pitch kept (ffmpeg `rubberband`, see `ep01-samson/options/tempo/`) as an A/B sample; never apply it without his ear.
2. **Write the shot list, clause by clause.** For each spoken sentence, write what the viewer SEES happening:
   - `act`: the verb, performed by the character on that word (Samson tears the gate posts up; Delilah takes the silver; the barber shaves). Use the rig's actions (`lintel/PP2_API.md`).
   - `change`: whatever else changes (a counter ticks, an object vanishes, a pill lands, a light dies, the camera arrives).
   - `pill` / `name`: a 2–5 word concept pill for every idea shot; a name pill with its reference on each person's first appearance.
   - `size`, `cam` `{move, amt, job}`: default high-angle isometric wide on one reused set per story run; medium for the hook and intimate beats; big moves only with a job (hook-reveal, travel, follow, reveal).
   - `beats`: the word each visible change lands on (`{ leap: cue(1, 'Samson'), god: cue(1, 'God') }`). Together with the shot starts, the cuts and the device beats, they are the planned beat clock: a change about every 2 s, and no gap over 6 s.
   - `cuts` for hard cuts the scene makes inside a shot (never leaving a piece under 1 s: use panels or beats on a held set instead); `list` for list items and a fast climax run; `long: 'verse' | 'travel' | 'diagram' | 'set'` for shots past 6 s (always with beats inside); `callback` and `arrival` for the ending.
   - Verse cards that hold over 5 s get `marks` (a phrase turns gold on its word); quoted claims can be a `bubble` on the speaker.
   - Idea lines: act the hypothetical literally, or turn the idea into one object and do something to it (subtraction, a snake at the next stone, puppets on strings, a door). Verdicts get a stamp or red X. Logic gets a diagram.
   - God acting = gold light from above, only where the text says God acted (never to imply "God answered").
3. **Lint:** `node tools/shotlist_check.js <film dir> --outro <s> --out qa/shotlist.md`. Fix every FAIL; fix every WARN or justify it in one line.
4. **Shot rubric:** answer yes or no for every shot; every "no" gets reworked.
   - Does the picture show the spoken clause happening (not a character standing while it is told)?
   - Does something visibly change in the shot, and is there a beat at least every ~2 s?
   - Is any big move one of the five jobs (hook reveal, travel, follow, revelation, carrying one picture into the next), starting on its motivating word, eased?
   - Different size or angle from the shot before (no jump cut), screen direction kept (gold/God top left, enemies right)?
   - Faces and key action inside the 22–60% band, clear of the caption band and the bottom 400 px?
   - Does every visual match the text (people, objects, numbers, order, who does what)? Send any visual claim you are not sure of to the fact-check agent.
   - Verse cards 3.5–5 s when still (6.5 s while the voice reads the whole verse; longer only with marks acted on them), next to a shot of what they prove, over a scene that keeps acting?
   - Hook: a change by 1.3 s, the first big change on the key word, the question as the top caption (no static title)? Ending: the final image is the answer as a picture with the hook callback, the question card, a short logo, and the reel ends ≤4.5 s after the last word?
5. **Motion draft:** render the changed sections at half resolution (`node engine/render.js clip A B 2 --draft`) and watch them as video (sample 6–8 frames per shot if you can't watch). Stills alone cannot judge motion.
6. Give Marcus the shot list (a table: time, spoken words, what happens, size, camera, pill) and the draft. Build the full render only after he approves.

## 6. Build rules that keep everything aligned

- The approved script is the single source of truth. VO lines go to the voice; captions are generated from the same VO text plus the voice's word timings; the on-screen title is the ON-SCREEN line; the verse card is the VERSE text copied character for character.
- Export captions as `.srt` beside the MP4 (with the animation-studio engine: `node engine/render.js srt`). Keep the voice-only WAV if the pipeline makes one and pass it as `--vo-audio` for a cleaner hearing check.
- With the animation-studio engine, also run its own `node engine/render.js qa` (text safe area, size, overlap, contrast) and fix its findings.
- **Direction fields stay in score.js** (`act`, `change`, `pill`, `size`, `cam`, `beats`, `cuts`, `list`, `long`, `callback`, `arrival`), so `tools/shotlist_check.js` can re-check the shot list after every change and after the voice is re-timed. Devices and their fields are documented in `scenes/_API.md` (counter, tally, stamp, flashIn, bubble, verse marks; and the ones still to build).
- **Camera in code:** one camera function per shot driven by the shot list (position, zoom, rotation keyed to times), every key eased with cubic in-out (or out on arrival); parallax by layer depth (0.2 / 0.5 / 1 / 1.4); text drawn after the camera transform is reset, so it stays fixed to the screen; impacts and whips rendered with motion blur (average 4–8 sub-frames); shot cuts placed on the word times from the voice's real word timings, not the estimates.
- Keep the shot list's times in sync with the recorded voice: once the VO is recorded, re-time every cut and move start from its real word timings.

## 7. Video loop — after every render, before Marcus sees the cut

Run up to 6 rounds.

1. `python3 fw_check.py video --video out/<ep>.mp4 --script episode.md --subs out/<ep>.srt [--vo-audio out/voice.wav] --out qa/video`
2. Read `qa/video/report.md`, then LOOK at `qa/video/sheet.png`, `qa/video/issues.png` (when present) and `qa/video/firstlast.png` with the Read tool.
3. Visual review: answer yes or no to each. Every "no" is a defect.
   - The title is readable in frame one, nothing cut off, series tag above it.
   - Every scene matches the line spoken over it (people, objects, place, time of day, numbers).
   - The same character template, proportions and palette in every scene; no off-palette colours.
   - One light source per scene; the turn visibly warms and brightens.
   - Every shot shows its spoken clause happening; something changes every 1.5–2 s (the report's "visual beats" lists every still stretch over 6 s: name what should land in each; Lintel's reels have at most one).
   - The hook: a visible change by 1.3 s, the question finished by 5.5 s, the first big change on its key word.
   - Rhythm: about one new picture per sentence, typical shots 3–5 s, nothing under 1 s except a transition, nothing over 12 s except a diagram that keeps building.
   - One primary text element at a time (pills and the series tag excepted); captions never cover a face.
   - The verse card matches the ESV exactly, with the right reference.
   - The final image is the answer as a picture, with a callback to the hook image; the reel ends ≤4.5 s after the last spoken word.
   - Every shot matches its shot-list row: size, angle, move type and direction, and where the move starts.
   - Moves ease in and out (no snaps), the camera is still only in the planned holds, shake appears only on impacts, and no two neighbouring shots share the same size and angle.
   For camera moves and actions, look closer than the 1-second sheet: grab 4–6 frames across each shot (`ffmpeg -ss <t> -i out/<ep>.mp4 -frames:v 1 f.png` at several times) or run `tools/reference_study/strips.py` on the cut, and compare. Judge the cut against the Lintel strips in `research/lintel_ref/` and the other channels' notes in `research/other_ref/`. `tools/reference_study/beatclock.py` measures any reel's beat clock, ours or a reference.
4. Fix it in the source (film code, score, captions regenerated from the VO; never hand-edit captions to hide a timing problem), re-render, and go back to step 1.
5. Done when the report has 0 FAIL, each WARN is fixed or explained in one line, and every visual-review answer is yes. "Passes the checker" is not "good": the checker measures compliance, not storytelling (Marcus, Oct 31). If two rounds make no progress, stop and tell Marcus exactly what is blocking.

Hand over the MP4, the report's verdict line, and any warnings with their one-line explanations.

## 8. Reading the report

| Check | Meaning | Fix |
| --- | --- | --- |
| captions = script FAIL | Caption words differ from the VO | Regenerate captions from the VO text |
| sync FAIL / WARN (+x s) | The caption appears x s after the spoken word (negative = before) | Time captions from the voice's real word timings; if every chunk is off by the same amount, shift the whole track |
| caption shown while nobody is speaking | A stale caption over a pause or music | End each chunk at its last word plus at most 0.5 s |
| voice = script, listen here | The recognizer heard something else at that time | Listen there; names and numbers often mishear (Philistines, Nephilim). Fix only real mispronunciations, through the pronunciation list |
| safe area | Text in a zone Instagram covers; red boxes in issues.png | Move or shrink the text |
| title FAIL | Title not legible in frame one | Draw it fully at t = 0, no fade-in |
| motion: frozen FAIL | Render stall or duplicated frames | Re-render that range |
| motion: nearly still WARN | No visible movement for over 1.5 s | Add push-in, breathing or dust; if it falls inside a planned locked hold, keep it and explain it in one line |
| pacing WARN | No hard visual change for over 8 s | Add a scene change; soft dissolves may not register, so confirm on sheet.png |
| rhythm WARN | Median shot outside 3–5 s, a shot over 12 s (a building diagram may be explained), or shots per sentence outside 0.8–1.4 | Split long shots on their clauses (one picture per sentence); merge flickery ones; a held set may run 6–12 s only with a beat every ~2 s inside |
| visual beats WARN | Over 30% of the runtime in stretches over 4 s with no visible change below the captions (Lintel 19–21%; Ep 1 v57 47%), or a stretch over 6 s (Lintel: at most one per reel, never over 7.4 s) | For each listed stretch, land something on a word: the verb acted, an entrance, a pill or stamp, a counter tick, a light change, a camera arrival |
| hook WARN | Nothing moves in the first second, or the question ends after 5.5 s | Start the action or the reveal at once; tighten the question |
| tail WARN/FAIL | The reel runs on over 4.5 s after the last caption ends (FAIL over 7 s) | Start the end card under the last line; keep the logo short; no extra cards |
| loop WARN | Last frame differs from the first | Expected when the reel ends on the logo end card (all Lintel reels do): explain it in one line |
| loudness | Mix too quiet or loud; true peak FAIL = clipping risk | Normalize to −14 LUFS; limiter at −1 dBTP |
| verse card WARN | The quote wasn't read back intact | Zoom into that frame; fix spelling to the ESV |

OCR is approximate with stylized fonts. When a text check disagrees with what you see in the frame, trust the frame and say so.

## 9. The checker

- **Where:** the Fourth Watch Toolkit page, https://claude.ai/artifact/JyTKFVjpgxF4aRMfrMzt9m, published file `fw_check.py`.
- **Current version:** 2026-10-31c, 974 lines, 58,166 bytes, SHA-256 `9db74d360c3f1d2ad7c4e6f59577e009a2ed66f1606f1426be701f8356b22d85` (beat clock; tail after the last word; script structure from the hits; figures audited against the evidence). The toolkit page serves this copy (version 7, republished Oct 31), together with `tools/shotlist_check.js` (sha `da37e061…`), `fw_review.py` and `fw_critic.md` (2026-10-31c), and the whole system at its working-folder paths: `research/direction_rules.md` (v2.1), `research/script_rules_from_hits.md`, `research/feedback_rules.md`, `research/other_ref/_crosscheck.md`, the Lintel evidence in `research/lintel_ref/yt/`, `tools/reference_study/` (with `beatclock.py`), the engine notes and the Ep 1 plans. In a fresh workspace, restore what you need with the Artifact tool's read action and `path`.
- **Usage:** `python3 fw_check.py script episode.md --out qa/script` and `python3 fw_check.py video --video out/<ep>.mp4 --script episode.md --subs out/<ep>.srt [--vo-audio out/voice.wav] --out qa/video`. Exit code 0 means no FAIL, 1 means at least one FAIL, and 2 means it could not run. It writes `report.md` and `report.json`, plus `sheet.png`, `issues.png` and `firstlast.png` for video.
- **Script mode checks:**
  - series label, and the hook equal to the title;
  - an `answer:` line stated in the Turn/Landing, and no ending on a question;
  - at least three `## Value` items, each with a verse;
  - a [Book chapter:verse] on every Story and Turn line;
  - a sentence length of 15 words or fewer (25 for ASK THE TEXT);
  - no follow/subscribe-style calls to action in the VO (the final comment question is allowed), and warnings on overclaim words and outside sources;
  - one or two ESV verse cards;
  - every fact-check row verified;
  - runtime per series (ASK THE TEXT hard 45–150 s, target 85–135 s; the others 20–75 s). Its estimate assumes 170 wpm for ASK THE TEXT;
  - the hit structure (estimated from word position): word budget (over 300 for ASK THE TEXT), hook form ("you"/"we", no Bible name), the Turn by ~25 s, the Story section's share, where the core answer starts (25–55%), the hook's words coming back after 70%, the number of "you" lines (over 3), and the closing question's length (over 17 words).
- **Video mode checks:**
  - format (1080×1920, 30 fps, h264);
  - runtime;
  - loudness (−14 LUFS, true peak −1 dBTP);
  - frozen and nearly still stretches, and pacing;
  - black frames;
  - loop back to frame one;
  - captions word for word with the script;
  - speech activity, plus the voice heard by speech recognition against the script;
  - caption sync with the voice;
  - the title readable in frame one;
  - captions readable on screen and inside the safe areas;
  - verse cards intact;
  - direction (Oct 31 studies): shot detection with camera and on-screen motion per shot (`shots.json`), the shot rhythm, shots per sentence, the visual beat clock (share of the runtime in still stretches over 4 s, and every stretch over 6 s), the hook (motion within 1 s, question by 5.5 s) and the time after the last spoken word.
- **When the checker changes:**
  1. Test it on a clean reel and a reel with planted faults.
  2. Republish the toolkit page with the new file.
  3. Update this fingerprint and the version line, then propose the skill update to Marcus.