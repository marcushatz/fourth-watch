# Fourth Watch: direction rules (how a script becomes shots)

**Status:** binding for every shot list from Ep 1 v58 on. Version 2.1, Oct 31, 2026, after an independent audit against the evidence files (v1 is kept as `direction_rules_v1_2026-10-31.md`, the pre-audit v2 as `direction_rules_v2_pre_audit.md`).
- `fw_check.py video` enforces the measurable rules on the finished cut.
- Everything else goes through the shot-list rubric in the showrunner skill (§5).
- The words themselves (hook form, turn time, story share, echo) are in `research/script_rules_from_hits.md`; §14 below gives the summary.

**Evidence:**
- **The Lintel Network:** all 14 Shorts. 12 were measured shot by shot (`research/lintel_ref/yt/<id>.md`, summary in `_patterns.md`); Suffering and Methuselah were measured from screen recordings in `research/lintel_ref/` (ref1/ref2: shot stats, beat clock and audio, no shot tables).
- **Two more channels** (cross-check, `research/other_ref/_crosscheck.md`):
  - **Bible Animations** (810K subs): flat 2D cut-outs; three hits at 1.67–2.22M views and two lows.
  - **BibleProject** (5.5M subs): flat motion graphics; three hits at 0.99–3.01M views and two lows.
- **Views:** Lintel's are Instagram counts (Tree 7.6M, Cain's wife 1.8M, Never heard 1.6M, Suffering 528K, Judas 338K, Methuselah 325K, Hell 194K; the rest 20K–75K). The other channels' are YouTube counts, so compare hits and lows within a channel only.
- **Marcus's verdict on Ep 1 v57:** "pacing, length, the motion, the camera, what was going on cinematically… these other accounts succeeded with coding the videos just like us… worse quality render but proper visual storytelling, camera angles, pacing, audio".

**How to read this file.** Each rule is tagged:
- **[ALL]** held on all three channels: treat it as a law.
- **[2 CH]** seen on two channels and not contradicted on the third: follow it.
- **[THIN]** a single video or thin evidence: a good default, not a law.
- **[HOUSE]** is Lintel's choice, which we adopted as our house style. It did not separate hits from lows anywhere, so never trade an [ALL] rule for it.

Numbers are **measured** (probe, shot detector, beat clock, captions, view counts) unless marked *(judged)*, meaning read by eye from frame grids, or *(inference)*. With 24 videos on three channels, read them as strong patterns, not proof.

---

## 0. The one principle [ALL]

**Every spoken clause gets a picture of that clause happening, on its word.**
- If the narration says a verb, a character does it on screen, on that word.
- If it states an idea, an object shows the idea, and something happens to the object.
- The caption building at the top is never the only thing that changes in a shot.

**Evidence** *(judged)*.
- All 9 hits across three channels do it:
  - BibleProject "Elijah": pouring on "drenches", a fireball on "fire rains down", walking on "head down to the Jordan".
  - Bible Animations: a crown pops on "is God", a brain on "intelligent".
- The lows break it: BibleProject's two lows play "rescued from evil and death" and "brings the throne up" over still pictures.

**Ep 1 v57** broke it most often: Samson or Delilah standing and facing the camera while the voice says what they did. The failure was in the shot list.

## 1. The beat clock: something changes about every 2 s [ALL in direction; thresholds calibrated on Lintel]

Frequent visible change is the clearest difference between hits and lows on the other two channels *(judged)*, and the clearest measured difference between Lintel's reels and Ep 1 v57. The thresholds below come from Lintel's two measured mid performers, not from a hit, so treat them as a floor: the other channels' hits change more often still.

| | Visible change ("beat") every | Runtime spent in stretches of >4 s with no change |
| --- | --- | --- |
| Bible Animations / BibleProject hits | ~1.2–1.6 s *(judged; counts camera travel, which the beat clock ignores)* | — |
| Lintel Suffering (528K) | 2.4 s | 21% (longest 7.4 s) |
| Lintel Methuselah (325K) | 2.0–2.1 s | 19% (longest 5.5–5.7 s) |
| BibleProject low "What is biblical hope?" | — | 39% is a still picture |
| **Ep 1 v57** | **2.5 s** | **47%** (longest 8.5 s; 10 stretches over 5 s, beatclock Oct 31) |

The Bible Animations lows were not still (their problem was choppy rhythm and no resolution), so stillness is one way to fail, not the only one.

**What counts as a beat:**
- a person acts;
- a figure or object enters, leaves or transforms;
- a pill, stamp, counter tick or speech bubble lands;
- the light grows or dies;
- the camera arrives somewhere new;
- a cut.

The caption building does **not** count: the checker measures below the caption band.

**Rules:**
1. **Plan a beat about every 2 s or more often** in the shot list (Lintel 2.0–2.4 s measured; the other hits ~1.2–1.6 s judged). Write them in `beats` (or in `cuts` for pieces).
2. **No more than 30% of the runtime** may sit in stretches over 4 s with no beat (Lintel 19–21%).
3. **At most one stretch over 6 s, and none over ~7.5 s** (Lintel's longest 5.5–7.4 s, one per reel).
4. A held set can last 10–12 s **if the beats keep coming inside it**. Bible Animations' hits hold one painted set for 10.5 and 11.5 s and change the subject on it every ~2 s.

**How it is measured** (`fw_check.py video` → "visual beats"):
- Read frames at 10 fps below the caption band.
- A beat is a local peak in the frame difference above 1.8× the 3-second rolling median, at least 0.5 s apart.
- **Calibration:** Lintel 19–21% / longest 5.5–7.4 s; Ep 1 v57 47% / longest 8.5 s. Not yet run on a Lintel hit or a low: do that next time a recording is available.

## 2. Rhythm

| Rule | Evidence |
| --- | --- |
| **[ALL]** A typical shot holds one clause: median **3–5 s** | Hit medians: Lintel 3.7–4.85 s, Bible Animations 3.9–5.1 s, BibleProject 3.2–4.6 s. 35% of the other channels' hit shots are 3–5 s, against 7% of their low shots; Lintel hits 50%, lows 27% |
| **[ALL]** Avoid both extremes | The extremes are all lows (not every low is extreme: five of seven Lintel lows have medians of 3.4–4.5 s). Choppy: Lintel Exodus 1.8 s, Bible Animations "David" 1.65 s. Static: Lintel Hide 6.2 s, BibleProject "hope" 7.75 s |
| **[ALL]** No picture shot under 1 s, except a flash or whoosh transition | 0 in all 9 hits |
| **[ALL]** Shots under 2 s only for a list (one per item). **[THIN]** or a **fast climax run** (1.1–2.2 s shots on the key event, one video) | Lintel Tree "every war / every sickness"; Bible Animations KoHK 28–33 s cross → angel → John on "raises himself from the dead" |
| **[ALL]** One new picture per sentence, where a "new picture" can be a new subject entering a held set | Lintel 1.02 shots per sentence; Bible Animations 0.6–1.4 shots but 2–4 beats per sentence; BibleProject 1.1–1.6 |
| **[ALL]** Long shots (6–12 s) only with a beat every ~2 s inside: a verse being acted on, a camera journey linking scenes, a diagram building, a held set with figures swapping. Nothing over 12 s except a diagram that keeps building | Lintel Never heard holds a building diagram 17.9 s; Bible Animations holds sets 10.5–11.5 s with beats inside; the lows' long shots are still |
| **[ALL]** Speech at least **2.6 words/s over the whole runtime, ~2.7 over the voice** (from the first word to the last) | Lintel hits 2.59–3.01 over the whole runtime (Cain's wife is the slowest); the other channels' hits 2.7–4.1 over the voice. The slowest Lintel videos (1.7–1.8) are lows. Ep 1 v57: 2.53 whole, 2.65 over the voice, below every hit on both measures. A 3.0 ceiling is Lintel's style only |
| Length: **[ALL]** none separated hits from lows. **[HOUSE]** ASK THE TEXT 85–135 s | Lintel hits 84–137 s; the other channels' hits 47–60 s. A shorter cut is never a mistake if it still answers the question |

## 3. The hook (the first ~7 s)

1. **[ALL] Something visibly changes within 1.3 s.** All 9 hits change at 0–1.3 s *(judged)*. Necessary, not sufficient: the Lintel lows held still 4–9 s and BibleProject's 2–6 s, but the Bible Animations lows changed at 0.25 s.
2. **[ALL] The first big visual change lands on the hook's key word** *(judged)*. It is a reveal, a whoosh-in or a transform, not always a camera move:
   - Lintel Tree: a pull-out of −42% lands on "why didn't He remove the tree".
   - Bible Animations: Jesus whooshes in on "Jesus"; a whip-zoom on "shriveled old dudes".
   - BibleProject: the letters become the coastline on "a Jewish man".
3. **[ALL] The premise is fully stated by about 7 s.** The premise is the question, the objection, or "you've been told X". Lintel's hits finish the question at 2.8–5.5 s; the other channels' at 3.1–6.8 s, and two BibleProject hits never ask one aloud (the Short's title carries it). **[HOUSE]** We ask a spoken question and aim for ≤5.5 s.
4. **[ALL] No static title card.** A title must become the picture within ~4 s (BibleProject's name titles animate into the scene by 2.5–4.3 s). **[HOUSE]** Our hook question is the top caption, never a big centred title. 0 of 3 Lintel hits used one; 5 of 9 non-hits did.
5. **Frame one is [optional style], not a rule.** Lintel's hits open on a person plus the topic's object, but on the other channels the lows did that more often than the hits. Open on whatever lets the first change land on the key word.
6. **[ALL] Return to the hook image when the answer lands** *(judged)*. The hits do this 5 of 6 times on the other channels, and Tree and Never heard on Lintel; the other channels' lows did it 1 of 4 times. This is the most consistent hook-and-ending rule.
7. *(Inference)* **Pick puzzles people already type, and resolve them inside the reel.** Two of the four cross-check lows never resolved (a cliffhanger; "maybe it isn't realistic").

## 4. Story lines (the narration says what someone did)

1. **[ALL] One action per verb, on the verb.** A sentence with three verbs gets three beats on the same set, joined by soft cuts or time jumps.
   - Lintel "Never heard", 15.8–38.4 s:
     - "gave much to the poor": hands to a poor man;
     - "prayed continually": he kneels;
     - "an angel told him": a beam and the angel;
     - "send for Peter": messengers walk off;
     - "Peter walked into that house": Peter arrives and Cornelius bows.
   - BibleProject "Elijah": drenches → pouring; fire → fireball; Jordan → walking; "pulled into the sky" → lifted.
2. **[ALL] One set per story run.** Change the framing, light, time of day or the subject on the set, not the location. Examples: the Cornelius street (5 shots), Bible Animations' castle-river set (11.5 s with 6 subjects).
3. **[2 CH] Show counts, never just say them** (Lintel, Bible Animations): a coin counter ticking, three tallies for three denials, age shown as figure size.
4. **[2 CH] God's action is light from above** (Lintel and BibleProject: fire from the sky, the beam that lifts Elijah; Bible Animations uses a crown or an angel; the beam is in all 12 Lintel videos, lows included, so it is a convention, not a separator). Our accuracy rule limits where it goes:
   - Use it only where the text says God acted ("the Spirit of the LORD rushed upon him"; the light goes out where "the LORD had left him").
   - Never use it to imply an event the text doesn't state, such as "God answered" at the pillars (Judges 16:28–30). There, show the prayer and the push, not a beam.
5. **[ALL] Quoted speech is acted by the speaker.** Lintel puts a card over the speaker's scene while the scene keeps acting; Bible Animations uses a comic **speech bubble** on the speaker ("I'M NOT GOD"). Either works. The speaker must be doing something.
6. **[2 CH] Entrances and walking are the workhorse verbs** ("partly" in the cross-check).
   - Lintel: about half of all action shots are someone walking toward or away from a light, a door or a person.
   - Bible Animations: figures **whoosh in on their name** with motion blur and leave when the line moves on.
7. **[HOUSE]** Name pill on first appearance, with the reference folded in ("CORNELIUS · ROMAN OFFICER"). No other channel's hits use name pills, so keep them short.
8. **[HOUSE]** Contrast characters by direction of travel (Peter walks back toward Jesus, Judas walks away). Only Lintel tested it.

## 5. Idea lines (the narration states an idea)

**[ALL] Turn the idea into one physical object, then do something to it** *(judged)*. This is the best-supported rule on every channel.
- Lintel:
  - "sin waiting at the next command": a snake coiled at the next stepping stone;
  - "no choice left": people become puppets;
  - "accident of birth": dice;
  - "inheritance → choice": a lamp passed from an old woman to a young man.
- Bible Animations: a crown for "God"; a brain for "intelligent"; a hooded "?" silhouette for "wisdom", labelled JESUS 19 s later.
- BibleProject: a balance beam that tips as each of "two goals" is named, then rotates into a spectrum.
- **The low:** BibleProject's "hope" keeps the idea as a word on a square for 7.1 s.

**Other idea devices:**
1. **[THIN] Act a hypothetical out literally:** a beam removes the tree; great-grandparents at the dinner table (few hypotheticals in the cross-check; consistent, never contradicted).
2. **[ALL] Logic becomes a diagram or list that builds on the narration**, one item per spoken item: a timeline, two groups under one beam, a numbered list, a spectrum.
3. **[2 CH] A verdict is a big word that lands** (Lintel, Bible Animations): a stamp ("PAID", "STILL WRONG") or a shout ("WRONG!", "TEENAGERS").
4. **[ALL] A recurring symbol carries the whole reel:** doors (Lintel, 6 of 12), a gold crown (BibleProject), the blank-faced viewer figure (Bible Animations).
5. **Subtraction shows a consequence:** things vanish (stall goods, a village) or leaves fall off a man. Weaker evidence, never contradicted.
6. **[HOUSE]** A 2–5 word pill on every abstract shot ("NO CHOICE LEFT", "KNOWING IS NOT CAUSING"). BibleProject's story hits use no words at all, so the pill is our caption style, not a cause.

## 6. Something changes in every shot [ALL]

Change types, in rough order of use:
- a person acts;
- an object appears, vanishes or transforms;
- a pill, stamp or bubble lands;
- a counter ticks;
- the light grows or dies;
- the camera arrives somewhere new.

**Evidence** *(judged)*.
- Lintel's hits: fewer than 1 scene shot in 10 is fully static. A person acts in 39% of shots across all 12 measured Lintel videos (46–57% in Tree and Never heard).
- Cain's wife (21%) and BibleProject's translation Short (no people at all, 990K) show that objects, labels and diagrams can carry a reel.
- BibleProject's lows are mostly still pictures (one at 0–1% own-motion in 9 of 10 segments). Bible Animations' lows are not still; they fail on choppy rhythm and no resolution. On Lintel, probe own-motion did not separate hits from lows, which is why the beat clock (§1) counts *new* things, not motion in general.

## 7. Camera

1. **[ALL] Camera *amount* does not separate hits from lows.** Lintel is mostly locked (about 60% of shots), Bible Animations is mostly locked, and BibleProject's story hits never stop moving. All three hit. Don't add motion for its own sake.
2. **[ALL] Every big move (≥15%) has one of five jobs:**
   1. the hook reveal (pull-out from a character to the world, or a whip-zoom);
   2. travel that links scenes or time;
   3. following a walker;
   4. pushing into a revelation (Athens altar +22%; through the opening door +37%);
   5. carrying one picture into the next (BibleProject's 11–20 s continuous travels).
3. **[HOUSE]** The default framing is a high-angle isometric wide on a small diorama set (Lintel 60–70% of shots). Medium shots and two-shots are for the hook and intimate beats. The other channels shoot eye-level mediums and flat graphics; it is a style choice.
4. **Transitions:**
   - **[HOUSE]** Change scene on the first word of the new clause (Lintel; not tested on the other channels).
   - **[2 CH]** Prefer transitions that carry motion (Bible Animations, BibleProject hits; transitions as a whole did not separate on Lintel):
     - a whoosh (elements exit and enter with motion blur);
     - a **graphic morph** (a shape in this picture becomes the next scene: letters → coastline, book → balance beam);
     - a light-slit wipe;
     - a 0.2–0.3 s crossfade;
     - one match-dissolve for a symbolic link (tree → cross).
   - **[HOUSE]** The 0.2 s cream flash is Lintel's. On Bible Animations it shows up in the **lows**. Use it for real scene jumps only (a new place or time), never as the default cut.
   - A dip to dark before the end card.

## 8. Text on screen

- **[HOUSE] Narration caption:** the top third, italic serif, 2–3 lines building word by word, with 1–3 key words per sentence in gold. Bible Animations uses centred one-word captions and BibleProject none, so captions are a style. They never substitute for the picture changing.
- **[HOUSE] Persistent header:** the series and episode tag (FOURTH WATCH · ASK THE TEXT … SAMSON).
- **[HOUSE] Label pills** on about half of the scene shots. They land 0.3–1 s after the cut, stay until the next cut, and fold the reference in.
- **[ALL] A verse on screen is acted on, or held briefly.**
  - Bible Animations keeps one verse up for ~20 s and acts on it every 2–4 s: it builds, a hand points, a phrase turns gold, a word is inserted.
  - Lintel's cards are short: a median of 4.35 s; hits average 4.1 s, lows 5.7 s.
  - **Our rule:**
    - A card with nothing happening on it holds 3.5–5 s (up to 6.5 s only while the voice reads the whole verse).
    - A longer hold needs a beat every 2–3 s on the card: a phrase turns gold, a hand or arrow points, the key phrase lifts out.
  - Place the card in the top half over a scene that keeps acting, or full screen over the faded scene. Always put it next to a shot of what the verse proves.
- **[ALL] No static title cards** (§3.4).
- **Numbered points:** a numeral pop plus a counter pill held through the section, when the format has points.

## 9. The ending

1. **[ALL] The final image is the answer as a picture, and it calls back the hook image** *(judged)*. Lintel's "arrival" image (people walking into a lit doorway) is one version. Others: the blank-faced figure labelled "YOU"; the cross over the Earth; spines on a shelf.
2. **[ALL] End soon after the last spoken word.**
   - Bible Animations and BibleProject hits end **0–1.2 s** after it. BibleProject's two lows run on 3.8–4.8 s with music and a logo.
   - Lintel's hits end about 3–3.6 s after it (estimated from caption row times: Cain's last line ends 80.5 s of 84.1 s; Never heard's CTA ends 134.5 s of 137.5 s): a typing CTA card plus a 2 s logo.
   - **Our rule:** ≤4.5 s after the last word is the target; over 7 s fails the check.
3. **[HOUSE] The closing question** (allowed by Marcus's rules) is spoken. Its card can show 2–3 option pills that pop on their words. The *spoken* question is the last word, so the card's typing must finish within ~1–2 s after it.
4. **[HOUSE] Logo 2–3 s.** BibleProject's hits use 0–1.5 s; a logo is optional and short.
5. **No community card or "follow" ask.** On Lintel every "Welcome to the Valiant" or follow ending is a low.

**Pending decision for Marcus (Ep 1):** his calm Jesus outro (v3) runs 5.6 s. With the 1.3 s hold before it, v57 ran on 6.4–7 s after the last word: past every hit measured.
- **Option A:** keep the calm reveal, but start it under the last spoken line (Jesus fades in slowly while the question is asked and is fully still by the last word), then hold 2–2.5 s.
- **Option B:** cut it to 2.5–3 s as the logo moment.

Both keep "appears slowly and calmly, stays perfectly still". Ask him; don't decide.

## 10. Audio (provisional: one Lintel reel with sound, "Suffering", 528K)

Measured with `tools/reference_study/audiostudy.py`: 50 ms levels against the 90th percentile of the voice band (300–3400 Hz). The cross-check videos were muted.

| | Lintel Suffering | Our Ep 1 v57 |
| --- | --- | --- |
| Bass band (30–180 Hz), median | −7.6 dB | −19.5 dB |
| Bass band, loud moments (p90) | −1.4 dB | −8.0 dB |
| Whole-mix floor between words (p10) | −7.4 dB | −13.4 dB |
| Voice-band floor (p10) | −14.8 dB | −16.7 dB |
| Steady beat | none clear (pulse strength 0.07) | none clear (0.03) |
| Sharp onsets | 36/min | 36/min |

- **Reading:** their bed is a full, sustained, bass-heavy cinematic layer, about 12 dB stronger than ours in the low end. It fills the space under and between the words without competing with the voice band. Ours is thin by comparison.
- **What to change:** add a sustained low layer (a cello or bass drone, a low pad an octave down, soft low hits on scene changes) and keep the voice band clear.
- **Every visual beat gets a sound:** a whoosh on an entrance, a snap on a burst, coins on a counter tick, a thud on a stamp. The beat clock (§1) is also a sound clock.
- **Caveat:** one reel, from a screen recording. Confirm on more reels before treating the numbers as targets. Until then, keep the music 9–10 dB under the voice in the voice band. Marcus judges by ear.

## 11. Device library: what the hits use

| Device | Seen on |
| --- | --- |
| Character actions | all |
| Walking across a set | Lintel, BibleProject |
| **Whoosh-in on a name** (enter with motion blur, leave when the line moves on) | Bible Animations |
| **Blank-faced viewer figure ("YOU")**, who voices the doubt, reacts, and is labelled YOU at the end | Bible Animations (all 3 hits, neither low) |
| Speech bubble | Bible Animations |
| Name pill | Lintel |
| Label pill / stamp / shout | Lintel, Bible Animations |
| Verse card | Lintel |
| **Verse acted on** (a phrase turns gold, a hand points, a phrase lifts out) | Bible Animations |
| God's light | Lintel, BibleProject |
| Flash transition | Lintel |
| **Graphic morph** (a shape becomes the next scene) | BibleProject |
| Counter (coins, numbers) | Lintel |
| Tally with a red X | Lintel |
| "?" silhouette labelled later | Bible Animations |
| Subtraction (objects vanish) | Lintel |
| Diagram (timeline, two groups, a list building) | all |
| Comic-panel inset (a second action in the same shot) | BibleProject |
| Search bar / comment bubbles | Lintel |
| Hook pull-out camera | Lintel |
| Arrival image + hook callback | all |

## 12. What did not separate hits from lows (on any channel)

Don't spend effort optimising these:
- how much the camera moves;
- art style: 3D low-poly, white cut-outs, motion graphics with no people at all, two-tone 2D;
- the number of verse cards (0–6);
- length (47–137 s);
- name pills;
- top captions;
- the frame-one composition.

(The cream flash cut is *not* on this list: on Bible Animations it showed up only in the lows.)

## 13. Case study: Ep 1 v57 against these rules

| Rule | v57 |
| --- | --- |
| Beat clock (§1) | One beat every 2.5 s, 47% of the runtime in still stretches over 4 s, the longest 8.5 s (Lintel 19–21%) |
| Hook (§3) | Big centred title over a wide shot with Samson tiny under the gate; no reveal on the key clause (the low pattern) |
| Static story shots (§0) | Samson standing in the Gaza alley on "slept with a prostitute" (S03). Delilah standing on "offered her silver" (S05), though a coin counter and lords handing over silver were possible. Samson standing beside Delilah on "told her his secret" (S08). Samson in the gateway on the principle line (S12), where an idea object and pill were needed |
| Long shots (§2) | S16 11.9 s and S19 12.6 s in the temple; S23 CTA 8.6 s |
| Verse card (§8) | 16:28 held 8.7 s with nothing happening on it |
| Ending (§9) | 6.4 s after the last caption ends (fw_check; the 1.3 s hold, then the 5.6 s outro); CTA card 8.6 s |
| Length | 150 s, longer than every hit on all three channels |
| Got right | Story verbs at Lehi (burst) and the traps (bonds snapping with a 1-2-3 counter); the shave; the grind; pray/push; the fall with dust; name tags; the CTA with options and typing |

## 14. The script side (summary of `research/script_rules_from_hits.md`)

From the 13 compared Lintel Shorts. These are checked at script lock, before any shot list. Marcus's rules in `feedback_rules.md` win any conflict.

| # | Rule | Hits | Ep 1 v57 |
| --- | --- | --- | --- |
| 1 | 230–300 words, 90–120 s | top six 218–414 words, median 275 | 379 words |
| 2 | The hook asks about a named Bible person or object, in the third person | all 3 hits; the "you"/"we" hooks are lows *(inferred)* | second person, no Bible name |
| 3 | Sentence 2 sharpens the puzzle with a concrete Bible fact | hits | yes (Gaza) |
| 4 | The "But notice…" turn by 25 s, after ≤10–14 s of story | top six 14–25 s | 53.5 s after 48 s of story |
| 5 | Story ≤25% of the runtime (Marcus's hard cap 40%); retelling the famous parts ≤10% | hits retell 0–5% | 49% |
| 6 | Core answer, plainly, at 35–50% of the runtime; then 2–4 new evidence beats | top six 33–50%; question lows 59–82% | 45% ✓ |
| 7 | Every quote is followed by a line that says what it proves | 9 of 12 | 2 of 4 |
| 8 | Scripture only: no outside authorities | hits 0 | 0 ✓ |
| 9 | At most 3 "you" lines; viewer application ≤10% | top six 1–3 | 4 |
| 10 | No lessons before the evidence | hits' first aphorism at 33–45% | ✓ |
| 11 | Re-ask the hook in its own words at 75–90%, then a one-line answer that carries the hope | all 3 hits (82–89%) | no (echo at 45% only) |
| 12 | Closing question ≤17 words; no follow or community line | hits 16–17 words | 19 words |
| 13 | ≥2.6 words/s over the whole runtime (~2.7 over the voice); no runs of short, slow sentences | hits 2.59–3.01 (whole runtime) | 2.53 whole, 2.65 over the voice: below the slowest hit |
| 14 | Pick puzzles people already type (check that the hook autocompletes) | *(inferred)* | — |

**Did not separate (don't chase):** density of names, numbers and concrete nouns; sentence length; the number of quotes or aphorisms; "people ask this" lines; numbered points; CTA type.

## 15. The process that enforces this

1. **Script loop** (showrunner §4 + fw-script-review):
   - Write for pictures: every sentence names a showable action or object (§0).
   - Lists of parallel items are welcome.
   - Hit §14's rules; `fw_check.py script` checks the measurable ones.
2. **Storyboard** (`production/05_motion_and_cinematography.md`).
   - Get Marcus's approval. **No overnight build without a shot list he has seen** (Round 15).
3. **Motion draft:** with his OK, render a low-res draft of the sections that changed and watch it as video before the full render.
4. **Full render.** Then run `fw_check.py video`: rhythm, visual beats, hook, tail, length.
5. **Visual review** with the sheets, and a separate Director reviewer (fw-script-review D).
6. **"Passes the checker" is not "good"** (Round 15). The checkers catch the measurable failures; Marcus's eye is the judge.
