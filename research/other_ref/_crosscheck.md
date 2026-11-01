# Cross-check: do the Lintel directing rules hold on other channels?

Tests `research/direction_rules.md` (built from The Lintel Network) against two other successful faceless, animated Bible Shorts channels. Measured Oct 31, 2026.

**Labels used below:** *measured* = probe, colour-histogram scene check, YouTube captions or YouTube view counts. *Judged* = read from frame grids. *Inferred* = a reason why. With 10 videos on two channels, read everything as patterns, not causes.

## Channels and videos

How the channels were chosen: YouTube searches (Cain's wife, the tree in the garden, Bible story animation, Bible questions animated, and ~40 related queries), the #bibleanimation / #biblestory hashtag feeds, a channel search, and channel Shorts pages sorted by Popular. About 30 candidates with ≥300K-view Shorts were rejected as talking heads, live action, still paintings or photoreal AI imagery (e.g. Kingdom Mindset Revealed, Awakening Media, Evan Raugust, Iron Inquisitor, Crucifixion Questions, Walk by Faith). Minno Kids (2.2M, 2D cut-out) was skipped because its Shorts are 11 s kids' clips. Saddleback Kids was skipped because its best Short is 752K.

| channel | subs | look | why chosen |
|---|---|---|---|
| **Bible Animations** (@bible.animations) | 810K | flat 2D white cut-out figures with thick outlines on painted backgrounds; centred one-word captions | closest to simple code animation; 4 Shorts over 1.3M; Q&A / "did you know" format like ASK THE TEXT |
| **BibleProject** (@bibleproject) | 5.5M | flat 2D vector / motion graphics; textured silhouettes; one Short has no people at all | Shorts at 3.0M and 1.0M (+990K); pure motion-graphics hit; biggest faith-animation channel |

Lows were taken from the same weeks as the hits (Bible Animations: Jan 29 – Feb 20, 2025, 7 Shorts; BibleProject: Aug 2023, the month of the 2023 hit; its two 2020 Shorts are both hits, so there is no 2020 low).

| # | video | channel | YT views | dur s | shots | median s | mean s | ≤3 s | words/s | first visual change | hook line done | after last word | callback at answer |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H | KoHK9aup0mo Why didn't Jesus claim to be God? | BA | 2.22M | 47.4 | 11 | 3.9 | 4.3 | 45% | 3.5 | 1.3 s | 5.2 s | 0.6 s | yes |
| H | ACsVGI4TBX8 Jesus hidden in Genesis 1:1 | BA | 2.01M | 47.7 | 9 | 4.6 | 5.3 | 22% | 3.2 | 0.75 s | 3.7 s | 0.5 s | yes |
| H | GvA9-V2mj0g Disciples were KIDS | BA | 1.67M | 51.5 | 9 | 5.1 | 5.7 | 22% | 4.1 | 0.25 s | 6.8 s | 0.8 s | yes |
| L | Qvat4rC7Pww Secret at Jesus' birth | BA | 214K | 54.9 | 13 | 2.7 | 4.2 | 54% | 3.5 | 0.25 s | 6.6 s | 0.5 s | yes |
| L | iKs5-A4VKpc David replaced Goliath | BA | 52K | 29.4 | 12 | 1.65 | 2.4 | 67% | 3.5 | 0.25 s | 4.7 s | 1.1 s | no (cliffhanger) |
| H | p7XRPGzL6kk Who is Jesus? | BP | 3.01M | 60.0 | 16 | 3.45 | 3.75 | 38% | 3.3 | 0.5 s | (no question) | ~0 s | motif (crown) |
| H | rlFAnG_VR20 Lesson Elijah teaches | BP | 1.01M | 60.0 | 18 | 3.2 | 3.3 | 39% | 2.7 | 0.25 s | (no question) | 0.5 s | thesis payoff |
| H | bmO0Fwa74QM Choosing a translation | BP | 990K | 58.0 | 11 | 4.6 | 5.3 | 27% | 3.1 | 1.2 s | 3.1 s (answered 5.0) | 1.2 s | yes |
| L | 9Nj3rIU9rvE Garden city realistic? | BP | 52K | 37.1 | 11 | 2.1 (pictures 5.2) | 3.4 | 55% | 2.8 | none until 6.2 s cut | 5.2 s | 4.8 s | no (unresolved) |
| L | N6XdRzE7a-Y What is biblical hope? | BP | 44K | 39.6 | 6 (+0.5 s open) | 4.55 (pictures 7.75) | 6.5 | 50%* | 3.1 | 2.0 s | 2.0 s | 3.8 s | no |

\*N6X: only the door, page-turn and logo are ≤3 s; its 4 picture shots are 2.0, 8.4, 7.1, 18.8 s. All rows *measured* except "first visual change" and "callback" (*judged* from 0.25 s grids).

## Method (same as the Lintel study, plus one check)

- Each Short was opened in the built-in browser and muted; `fw_shot_probe.js` was injected and run (`__fwProbe.run()`), and contact sheets were drawn with `__fwProbe.sheet(p)` and screenshotted.
- **Added check:** both channels mostly change pictures without camera cuts: Bible Animations slides figures in and out over a held background; BibleProject morphs one shape into the next scene and travels the camera for up to 20 s. The probe's cut detector misses these. So I also ran an in-page **colour-histogram scene check** (64-bin RGB histogram at 10 fps; a change is a peak ≥0.30 in the distance between frames 0.5 s apart), and drew **frame grids** at 1.0–1.3 s for the whole video and 0.25 s for the hook and every ambiguous change. A "shot" = a new picture (hard cut, dissolve, morph into a new scene, or a slide-through to a new background). A figure or object entering a held set is a **beat**, not a shot.
- **Narration:** YouTube's own captions, read from the player's caption request (word-timed auto-captions; line-timed manual captions for p7X). Words/s = words ÷ (last word − first word).
- **Views:** YouTube view counts on Oct 31, 2026. The Lintel numbers are Instagram counts, so the two studies' view numbers are not comparable; compare hits and lows within a channel.
- Per-video files: `bible-animations/<id>.md`, `bibleproject/<id>.md`.

---

## 0. The one principle: every spoken clause gets a picture of it

**Confirmed** (*judged*). In all six hits the thing named appears on its word:
- KoHK: the crown pops on "is God" (17.0 s); the brain on "intelligent" (32.0 s).
- GvA9: smaller figures on "below the age of 20" (16–17.5 s); a stack of books on "oral law" (21 s).
- rlF: pouring on "drenches his bull" (37.7 s); a fireball on "fire rains down" (40.3 s).
- bmO: "Faithfulness" and "Readability" land on the beam as each is named (16.8, 20.4 s).

The two BibleProject lows break it most: "rescued from evil and death" and "a crucified man rising from the dead" play over a static "HOPE" word card and a still poster (N6X 11–31 s); "brings the throne up" and "takes them out" play over still paintings (9Nj).

## 1. Rhythm

| Lintel rule | Other channels | Verdict |
|---|---|---|
| One new picture per sentence (Lintel 1.02) | BP hits 1.1–1.5 shots per sentence. BA hits 0.6–1.4 shots per sentence, but **2–4 beats per sentence** (a new figure, object or bubble on the held set). *Measured shots, judged sentences and beats.* | **Holds** if a "new picture" can be a new subject entering a held set |
| Typical shot 3–5 s | Hit medians **3.2–5.1 s** (BA 3.9 / 4.6 / 5.1; BP 3.45 / 3.2 / 4.6). Lintel hits 3.7–4.85. *Measured.* | **Holds** |
| 50% of hit shots are 3–5 s | Pooled hits: **26 of 74 = 35%** in 3–5 s; pooled lows: **3 of 42 = 7%**. *Measured.* | Direction **holds** (hits sit in the middle far more than lows); the 50% figure is Lintel's |
| Short shots only for lists | Hits use short runs for list/collage items (GvA9: four paintings in 0.25–1.75 s) and **for a climax** (KoHK 28.0–32.8 s: cross 1.3 s, angel 1.1 s, John 2.2 s on "he raises himself from the dead"). The choppy low (iKs) uses 0.7–1.7 s shots for ordinary map steps. *Judged.* | **Holds**, plus a new use: a fast run for the climax |
| Long shots 6–10 s only for verse / travel / diagram, with change inside | BA hits hold one set for **10.5 s and 11.5 s** (GvA9 7.2 s, KoHK 9.6 s), but with a new beat every ~2 s inside (push-in, crown, pull-out, bubble). The long shots in the lows are still: N6X 8.4 s at **0% probe own-motion** and a 7.1 s word card; 9Nj 6.2 s still painting. *Measured own-motion, judged beats.* | **Holds** on the "something keeps changing" part. **"Nothing over 10 s" is Lintel-specific**: 10–12 s is fine if the beats keep coming |
| Nothing under 1 s except a flash | Hit picture shots under 1 s: **0** (only a 0.9 s logo card). The choppy low iKs has two (0.7, 0.8 s). *Measured.* | **Holds** |
| Avoid both extremes | The lows sit at the extremes: iKs median 1.65 s (67% ≤3 s), the same pattern as Lintel's Exodus; N6X picture median 7.75 s (Lintel's Hide); 9Nj alternates 5–6 s stills with 1 s inserts. *Measured.* | **Holds** (strongest rhythm finding) |
| Speech rate 2.6–3.0 words/s | Hits **2.7–4.1** (BA 3.5 / 3.2 / 4.1; BP 3.3 / 2.7 / 3.1); lows 2.8–3.5. No hit is under 2.7. *Measured.* | Floor (≥2.6) **holds**; **the 3.0 ceiling is Lintel-specific**: BA's hits read at 3.2–4.1 |
| Length 85–135 s | Hits are **47–60 s**; lows 29–55 s. *Measured.* | **Lintel-specific.** Length didn't separate there either; these channels hit at under a minute |

## 2. Hook

| Lintel rule | Other channels | Verdict |
|---|---|---|
| Frame 1 = person at medium size + key object | Hits: KoHK yes (faceless man, medium); ACsV **no** (empty starfield 0.75 s, then the cross); GvA9 **no** (paintings); p7X **no** (title card); rlF face fading up from black; bmO **no people at all** (spine labels). Lows: iKs **yes** (David + Goliath), Qvat **yes** by 2 s (magi + gifts), 9Nj **yes** (two people + the city). *Judged.* | **Does not generalise**: the lows have it more often than the hits |
| Something moves within ~1 s | Hits: first change at **0.25–1.3 s** (6 of 6). Lows: 0.25 s (BA lows), 2.0 s (N6X), **none for 6.2 s** (9Nj, only a slow push). *Judged from 0.25 s grids.* | **Holds** as necessary, not sufficient |
| Question fully spoken by 2.8–5.5 s | Hits: "did you know" question by 3.7 s (ACsV); practical question by 3.1 s (bmO); statement of the objection by 5.2 s (KoHK); myth-busting claim by 6.8 s (GvA9); **no question at all** in two BP hits (they open on the subject's name; the Short's title carries the question). Lows: 2.0–6.6 s. *Measured.* | **Refine:** the premise (question, objection or "you've been told X") is stated within ~7 s; a spoken question is optional |
| Question as the top caption, no big centred title | BA has no top caption (centred one-word captions). **Two BP hits open on a big centred title** ("JESUS of NAZARETH", "ELIJAH"), but each title animates into the first picture within 2.5–4.3 s (letters become the coastline; a light slit opens onto the title panel). *Judged.* | **Lintel-specific as written.** General version: no static title card; a title must become the picture fast |
| First big move = a reveal landing on the key clause | The first big change lands on the key word in all 6 hits, but it is not always a camera move: Jesus whooshes in on "Jesus" (KoHK 2.3 s); the cross slides in on "Jesus" (ACsV 0.75 s); whip-zoom on "shriveled old dudes" (GvA9 2.75 s); "?" on "which one" (bmO 2.4 s); letters → land on "a Jewish man" (p7X 4.25 s). *Judged, timed to caption words.* | **Holds** in the broader form "the first big visual change lands on the key word" |
| Return to the hook image at the answer | Hits **5 of 6** (KoHK 44.5 s faceless figure → "YOU"; ACsV 43.9 s cross; GvA9 49.2 s figure + teenager painting; bmO 55.0 s spines on a shelf; p7X the crown motif returns at 56.8 s). rlF pays off its thesis instead. Lows **1 of 4** (Qvat 46.9 s). *Judged.* | **Holds** (the most consistent hook-and-ending rule) |
| Pick puzzles people already ask | Hits answer a common objection, a "did you know", a myth, a practical question or "who is Jesus". Two of four lows **do not resolve** (iKs cliffhanger, 9Nj "maybe it isn't realistic"); one opens on a definition (N6X). *Inferred.* | **Holds**, extended: the Short must **resolve** inside itself |

## 3. Story lines

- **One action per verb, on the verb: holds** (*judged*). rlF: "drenches" → pouring (37.7 s), "fire rains down" → fireball (40.3 s), "head down to the Jordan" → walking (49.4 s), "pulled into the sky" → lifted (54.6 s). The BP low 9Nj acts out none of its verbs.
- **One set per story run: holds** (*judged*). BA keeps one painted set per argument step and changes the subject on it: the castle-river set (KoHK 9.6–21.1 s) and the temple courtyard (GvA9 7.2–17.7 s). rlF keeps the Carmel sunset set from 27 to 48 s.
- **Name pill on first appearance: Lintel-specific / optional** (*judged*). No hit uses name pills. BA uses small source tags inside the scene ("1 Kings 10", "Exodus 30:7-10", "Mishna, Pirkei Avot 5:21") and a hand-written label with an arrow ('JESUS', ACsV 31 s).
- **Quoted speech over a scene that keeps acting: holds, in a different form** (*judged*). BA puts quotes in comic speech bubbles on the speaker ("I'M NOT GOD" 4.5 s, "JESUS IS GOD" 20.0 s). rlF speaks the prophets' line over them praying (31 s).
- **Contrast by direction of travel:** not seen in these 10. No evidence either way.
- **Show counts, don't say them: holds** (*judged*). The seven signs list builds one line per sign (KoHK 21–28 s); three black silhouettes for "three individuals", filled in one by one (Qvat 8.4 s → 22.4, 32.2, 45.75 s); **age shown as size** (GvA9 16 s, 46.8 s).
- **Walking is the workhorse verb: partly** (*judged*). In BA the workhorse is the **entrance/exit**: figures whoosh in on their name and out when the line moves on. BP uses walking (women to the tomb, Elijah and Elisha).
- **God's action = light from above: holds for BP** (*judged*): fire from the sky (rlF 40 s), the beam that lifts Elijah (54.6 s), light falling on Jesus from the scroll (p7X 23.4 s). BA uses a crown or an angel instead.

## 4. Idea lines

- **Idea → one object, then act on it: holds strongly; this is the best-supported rule in both channels** (*judged*).
  - KoHK: a crown for "God" (17 s); a brain for "intelligent" (32 s).
  - ACsV: a hooded "?" silhouette for "wisdom", later labelled JESUS (12 → 31 s).
  - bmO: a balance beam for "two goals" that tips as each is named, then rotates into a spectrum (15.6–28 s); square vs cloud bubbles for word-for-word vs thought-for-thought (31.7 s).
  - p7X: the gold crown for "kingdom" (5 appearances).
  - In the low N6X the idea stays a word ("HOPE" on a yellow square for 7.1 s).
- **Hypotheticals acted literally:** few hypotheticals in this sample; GvA9 shows "below the age of 20" literally (16 s). Consistent, thin evidence.
- **Subtraction:** weak (a crowd vanishes on "I mean", GvA9 28.8 s; the lakeside empties on "makes sense", KoHK 41 s). Not contradicted.
- **Recurring symbols: holds and generalises.** Doors are Lintel's symbol. BP p7X runs a gold crown through the video and marks Jesus with a red sash. BA's blank-faced figure appears in **all 3 BA hits and neither BA low** (*judged*).
- **Verdicts get a stamp: holds, in the form "verdict = a big word"**: "WRONG!" with arms up (GvA9 6.8 s), "PREDICTED THE FUTURE!" (Qvat 14.4 s), "FIRST VERSE OF THE BIBLE!" (ACsV 43.9 s), "TEENAGERS" (GvA9 50.6 s). No red X's.
- **Logic gets a diagram: holds** (bmO beam, spectrum and bubble rows; KoHK numbered list; ACsV a verse with a pointing hand). The BA low iKs also uses a diagram (the battle formation with red annotations), so it is not sufficient on its own.
- **UI mock-ups, modern sets:** not seen. No evidence.
- **2–5 word pill on every abstract shot: partly.** Diagrams carry labels (bmO "Faithfulness / Readability", "Word-for-word"). BA's centred caption effectively labels every picture; BP's story hits use no words at all.

## 5. Something changes in every shot

**Holds, and it is the clearest separator between hits and lows across channels.**
- Hits (*judged*): a visual beat every **~1.35 s (KoHK), ~1.6 s (ACsV, GvA9), ~1.2 s (bmO)**. The BP story hits' camera never stops (probe: continuous travels of 20.2 s at z−64% and 18.9 s at z−57% in p7X; 11.3–11.9 s at z−68% to −77% in rlF).
- Lows (*measured*): 9Nj has probe own-motion **0–1% in 9 of 10 segments**; Elijah, from the same month, has 7–35% typical. N6X has **0%** own-motion for 8.4 s, then a 7.1 s static word card, so **15.5 of 39.6 s (39%) is a still picture**.
- The BA lows are not static, so the low-vs-hit difference there is rhythm and resolution, not stillness (*judged*).

## 6. Camera

| Lintel rule | Other channels | Verdict |
|---|---|---|
| Default framing = high-angle isometric wide on a diorama (60–70%) | BA: eye-level medium / medium-wide, one centred figure on a painted backdrop. BP: everything from extreme close-ups to top-down maps and flat diagrams. *Judged.* | **Lintel-specific** (a style choice) |
| Mostly still (~60% locked) | BA: mostly locked; motion comes from elements sliding. BP story hits: camera moving in nearly every shot. Both hit. *Measured (probe) + judged.* | **Confirms "camera amount doesn't separate"**; "mostly still" is one valid choice, not a rule |
| Big moves have four jobs | Seen: hook reveal (GvA9 whip-zoom 2.75 s), push into a revelation (KoHK push to John 13.7 s), travel linking scenes (p7X, rlF), follow walkers (rlF 48 s). BP adds **continuous travel as the connective tissue between scenes**. *Judged.* | **Holds**, with a fifth job: carry one picture into the next |
| Transitions: 0.2 s cream flash or 0.2–0.3 s crossfade | BA hits: motion-blur whooshes (elements exit/enter), hard cuts, a few dissolves; **the 0.2 s white flash cuts appear in the BA lows** (Qvat 22.2 / 31.0 s, own-motion 87–88%; iKs 8.1 / 12.7 / 15.0 s). BP: **graphic morphs** (letters → coastline, page → scrolls, book → beam), light-slit wipes, comic-panel insets, page turns, iris-out. *Measured + judged.* | **Lintel-specific**; the flash is not a hit marker elsewhere |

## 7. Text on screen

| Lintel rule | Other channels | Verdict |
|---|---|---|
| Narration caption, top third, italic serif, key words coloured | BA: **centred**, 1–2 words at a time, bold sans caps, yellow. BP: **no narration captions in any of the 5 videos** (3.0M and 1.0M hits included). *Judged.* | **Lintel-specific.** Captions are a style choice; they never substitute for the picture changing |
| Persistent header | BA: channel logo watermark top-left. BP: none. | **Lintel-specific / optional** |
| Label pills on ~half of scene shots | BA ~15–20% of shots (KING, WISDOM, JESUS, YOU, TEENAGERS, source tags); BP only on diagrams. *Judged.* | **Optional**; labels matter on diagrams and for the reveal |
| Verse cards 3.5–5 s, next to what they prove | No full-screen verse card in any of the 10. ACsV keeps Proverbs 8:22 on screen **~20 s (16–37 s)** but acts on it every 2–4 s: it builds, a hand points, a phrase turns gold, "(RESHIT)" is inserted. p7X shows scripture as a scroll with one readable line. *Measured hold, judged changes.* | **Refine:** a verse on screen must be **acted on** (pointed at, highlighted, edited) or held briefly. The ≤5 s cap is Lintel's way of doing it |
| No big centred titles | Two BP hits open on big centred name titles that animate into the picture (see §2). | **Refine** (no static title cards) |
| Numbered sections | KoHK builds a numbered list on the narration (21–28 s). | Consistent |

## 8. Ending

| Lintel rule | Other channels | Verdict |
|---|---|---|
| Answer line over an "arrival" image + callback to the hook | Callback: hits 5/6 (see §2). The final image is the answer as a picture: the faceless figure labelled "YOU" (KoHK); the cross over the Earth with "FIRST VERSE OF THE BIBLE!" (ACsV); a painting of teenagers labelled TEENAGERS (GvA9); spines on a shelf (bmO); the crown iris (p7X). The Lintel "arrival" (people walking into a lit door) is one version of this. *Judged.* | **Holds** as "final image = answer + hook callback" |
| ~5 s CTA card (options + typed comment) | **No comment CTA in any of the 6 hits.** BA uses a 0.9–2.3 s "watch / check out the new video" card (the BA lows use the same card, 2.6–3.5 s). BP: none. *Measured.* | **Lintel-specific / optional** |
| Logo 2–3 s | BA: logo only inside GvA9's 0.9 s end card. BP: rlF 1.5 s; p7X and bmO none. **Both BP lows** end with 3.8–4.8 s of music and a logo. *Measured.* | **Lintel-specific**; a logo is optional and short |
| Tail 7–9 s | Hit tails (closing segment start → end) **0.9–5.5 s**. **Time after the last spoken word: hits 0–1.2 s**; BP lows **3.8 s and 4.8 s**; BA lows 0.5–1.1 s. *Measured.* | Direction **holds** (short is better), but **7–9 s is Lintel's number**. Across channels: end ≤~1–2 s after the last word |
| No community card | None seen. | N/A |

## 9. What did not separate hits from lows (re-tested)

- **Camera amount:** **confirmed** across channels. BA is mostly locked, BP is always moving, and both hit.
- **Art style:** **confirmed.** White cut-outs, textured silhouettes, pure motion graphics with **no people at all** (bmO, 990K) and dramatic two-tone 2D all hit. What the lows share is not style but **small framing** (N6X's letterboxed square picture) and **stillness** (*judged*).
- **Verse-card count:** **confirmed** (hits use 0–1 verse objects).
- **Length:** confirmed as not decisive between channels. This study's hits are 47–60 s and Lintel's 84–137 s.

## 10. Audio

Not tested: all videos were muted, as instructed. §10 stays provisional on Lintel's one reel.

---

## Summary

### Rules that hold across channels
1. **Every clause gets a picture of itself** on its word (both channels' hits; the BP lows break it). *Judged.*
2. **Something changes every ~1–2 s**: hit beat interval 1.2–1.6 s; lows have 6–15 s still stretches (9Nj own-motion ≤1% in 9 of 10 segments; N6X 0%). *Measured + judged.*
3. **Shot median 3–5 s, avoid both extremes**: hit medians 3.2–5.1 s; lows 1.65 s (choppy) or 7.75 s (static); 35% of hit shots vs 7% of low shots are 3–5 s. *Measured.*
4. **No picture shot under 1 s.** *Measured.*
5. **First visual change ≤1.3 s, and the first big change lands on the hook's key word.** *Judged.*
6. **Resolve the question and call back the hook image at the answer** (hits 5/6, lows 1/4; two lows end unresolved). *Judged / inferred.*
7. **Ideas become objects that act** (crown, brain, beam, bubbles, "?" silhouette), and **logic becomes a diagram or list that builds on the narration**. *Judged.*
8. **Story verbs are acted on the verb**; **God's action as light from above** (BP). *Judged.*
9. **End within ~1 s of the last word** (hits 0–1.2 s; BP lows 3.8–4.8 s). *Measured.*
10. Speech rate **≥2.7 words/s** (no hit slower). *Measured.*

### Rules that look Lintel-specific
- Length 85–135 s (other hits: 47–60 s).
- Speech-rate ceiling 3.0 words/s (BA hits 3.2–4.1).
- Frame 1 = a person at medium size + the key object (the lows have it more than the hits).
- A spoken question finished by 5.5 s (two BP hits never ask one; GvA9 lands its claim at 6.8 s).
- Top-third italic caption, persistent header, name pills, label pills on half the shots (BP hits have no on-screen words).
- "No big centred titles" as an absolute (BP hits open on animated name titles).
- High-angle isometric diorama as the default framing.
- 0.2 s cream flash as the scene transition (the BA lows use flashes; the hits use whooshes and morphs).
- "Nothing over 10 s" (BA hits hold sets 10.5–11.5 s with beats inside).
- Verse cards capped at 5 s (ACsV keeps a verse up ~20 s by acting on it).
- The 5 s comment-CTA card, the 2–3 s logo and the 7–9 s tail.

### New techniques the other channels' hits use that Lintel doesn't
1. **A blank-faced "viewer" figure** who voices the doubt, reacts ("WRONG!"), and is labelled **"YOU"** at the end (KoHK 0 / 44.5 / 45.1 s). In all 3 BA hits, neither BA low. *Judged.* Code-easy: one reusable rig.
2. **Graphic morph transitions:** a shape in this picture becomes the next scene (letters → coastline p7X 4.25 s; page → scrolls 9.5 s; book → balance beam → spectrum bmO 12.9–22.6 s; crown → sunburst → iris p7X 56.8 s). It changes scene without a cut and suits code animation.
3. **Subject swaps on a held set:** figures whoosh in on their name with motion blur and out when the line moves on (KoHK 1.8 / 2.3 s; ACsV 0.75 s), giving a new picture every 1.3–1.6 s without new sets.
4. **One object that keeps transforming to carry a list** (the book changing cover every 1.2 s, bmO 4.6–12.9 s) instead of one cut per item.
5. **Scripture as an object you operate on:** a hand points, a phrase turns gold, a word splits (BE|RESHIT), a word is inserted (ACsV 16–38 s).
6. **Speech bubbles for claims and objections** ("I'M NOT GOD", "JESUS IS GOD").
7. **A mystery silhouette with "?" that is labelled later** (ACsV 12 → 31 s; Qvat 8.4 s → filled in per item): the list or reveal is visible before it is filled.
8. **Comic-panel insets** sliding in to show a second, parallel action in the same shot (rlF 8.1, 31.0, 36.5, 53.3 s).
9. **Answer-first structure:** question by 3.1 s, answer by 5.0 s, reasons after (bmO).
10. **Scale as data:** age shown as figure size, a figure shrinking with time (GvA9 16 s, 46.8 s).
11. **A fast climax run** of 1.1–2.2 s shots on the key event (KoHK 28.0–32.8 s).
12. **One accent colour marks the protagonist** in a near-monochrome palette (Jesus' red sash in every shot of p7X).
