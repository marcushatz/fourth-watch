# Context pack · ep01-samson · 48.50-56.50 s · key 1d000dad0d398130

## Approved narration in the window (locked: never change a word)
- line 5 (45.73-52.64): She called a fourth time. He woke up and said, "I will go out as at other times and shake myself free."
  words: said,@48.57 "I@49.17 will@49.37 go@49.61 out@49.85 as@50.09 at@50.25 other@50.45 times@50.73 and@51.17 shake@51.41 myself@51.77 free."@52.29
- line 6 (53.51-56.06): "But he did not know that the LORD had left him."
  words: "But@53.51 he@53.79 did@53.99 not@54.15 know@54.47 that@54.79 the@54.95 LORD@55.11 had@55.47 left@55.67 him."@55.99
- shot before the window: S09 sorek/wake (45.65-53.43)
- required verse card: "But he did not know that the LORD had left him." — Judges 16:20 (ESV)
- before: Then he told her his secret. While he slept, she had a man shave off his uncut hair, the sign he was set apart to God.
- after: Notice what he said: "as at other times." It had always worked before, so he assumed it would work again.


## Accuracy notes for this window
Verified ESV facts (from ep01-samson/episode.md fact-check log and qa/ fact-check passes; do not go beyond them):
- 16:19 She made him sleep on her knees, called a man, and had him shave off the seven locks of his head. She began to torment him, and his strength left him. (So by 16:20 the gold is already gone.)
- 16:20 She said, "The Philistines are upon you, Samson!" (the 4th call; the shot before this window). He awoke from his sleep and said, "I will go out as at other times and shake myself free." But he did not know that the LORD had left him.
- 16:21 (next, outside this window) The Philistines seized him and gouged out his eyes. Do not show the gouging; no cloth over his eyes.
- Earlier "other times": 16:9 bowstrings snapped like tow touching fire; 16:12 new ropes snapped like thread; 16:14 he pulled away the pin, the loom and the web; 15:14 at Lehi the ropes became as flax caught fire and his bonds melted off his hands.

# Canon digest (brand + Marcus's picture rules), compiled from system/00, research/direction_rules.md, research/feedback_rules.md
Format: 9:16, 1080x1920, 30 fps. Key action between 22% and 60% down the frame; nothing in the top 120 px or bottom 400 px; nothing in the right 140 px below 45% height. Narration captions sit in the top band; only ONE text element at a time (caption OR pill OR verse card OR bubble).
Palette: Night #14100D, Umber #2A1E16, Clay #6B4A33, Lamp gold #E3B25C, Parchment #F2E6CF, Ember #C2502E (sparingly), Night sky #1C2433, Ash #8C8174.
Light grammar (binding): gold from the UPPER LEFT = what God does (the Spirit rushing upon him); it never brightens on his failures and is gone wherever the text says the LORD left. Ember = a person's own choices (Delilah's room). One key light per scene; dawn warmth only at a turn the text supports.
Never: door imagery; balance or weighing imagery; facial acting (the rig has fixed faces: act with pose, light, camera, props); invented events or dialogue; gore.
Every spoken clause is SHOWN happening on (or within 0.15 s of) its word. Something visibly changes about every 2 s; at most one still stretch over 6 s (a locked hold on the turn line is allowed). One main eased camera move per shot, starting on the word that motivates it; impact shake only on an impact; whip/smear only as a transition.
Shot median 3-5 s, nothing under 1 s; consecutive shots change size or angle (no jump cuts); the last image calls back the first.
Text on screen: verse cards are exact ESV with reference; pills 2-5 words; speech bubbles may carry quoted words from the text.
Tone: reverent, curious, never mocking. AI reviewers and judges are AI; never claim audience results.
Picture accuracy (applications of "never state implied events", from the 16:20 fact-check): words are not deeds (show no attempt
the text doesn't narrate); a past perfect is already true (no change staged on its word); the camera expresses the narrator's
view, never an unstated motive; posture continues from the last narrated position; the next verse's events wait for their beat.

# Engine manifest (film27), compiled from scenes/_API.md, lintel/PP2_API.md, film.js, lintel/cards.js (audit Nov 1)
Frame: score SHOTS -> SCENES[scene].frame(t, shot, cam) -> billboards (rig) -> LW.render (DOF, grade) -> rays -> bloom -> post -> overlays (card, pill, counter, tally, stamp, bubble) -> captions -> dip/flashIn cuts. Pure function of t; seeded randomness only; ~0.8-5 s per still, ~0.25 fps full render.
Shot fields: add(id, scene, v, t0, {beats, title, text, scrim, dip, flashIn, card, verse, verseAt, pill, pillBeat, counter, tally, stamp, bubble(s)}); plan fields size, act, change, cam{move, amt, job}, angle, callback, arrival. cue(line, word, nth) returns a word time.
Scenes (set: shot v names): gaza (gate at night, hill at dawn: hook, door, rip, hill, question, principle, dawn, statement); sorek (Delilah's lamp-lit room, couch, loom, ember inner doorway, mood(): delilah, call, traps, shave, wake, left); timnah (vineyards, Ashkelon gate: lion, bride, ashkelon, wide); lehi (ridge, ropes burn off); zorah (wheat field, angel); prison (mill room, barred-window shaft: mill, hair, lookup); dagon (hall, pillars, collapse: pillars, fall); day (steps crowd). Unknown v falls back to the module default.
Rig (people2.js): samson poses stand, walk, carry, point, lean, sleep, wake, strain, burst, grind, lookup, pray, push; state hair 0..1, blind, shackles, bonds (rope/bowstring/loom), brk (bonds breaking), gold rim, look, phase, k. delilah: stand, turn, call, sit, beckon. person: stand, raise, hold, kneel, cheer, fall. lord: stand, laugh, fall. barber: shave. Props: couch, loom web, shackles, razor. CANNOT: facial acting, walking (except samson, boy), motion blur, turns past ~35 deg, close-ups without the samsonCU crop.
Devices: verse card with marks (gold/ember phrase lights on its word), label, pill, counter, tally, stamp, bubble, chapter stamp, name tags, narration captions, God rays (FILM.rays), bloom, flash, dark, scrim, dip (0.22 s from black), flashIn (0.2 s cream), dust particles, light shaft, light pool, camera setCam/camLerpK. NOT BUILT: motion blur, crossfade, morph/match-dissolve, whoosh-in, panel strip, diagram card.
Audio: song.js reads shot beats and cue() word times for hits; buses pad, strings, keys, perc, sfx, ambience; voice ducked; -14 LUFS.

# The read-timing model (adapted from ClaudeAnimationBase ANIMATION_GUIDE rule 4 for narrated 9:16 reels)
A READ is one thing the viewer must find and understand. Every read gets a start and end time. Minimum durations (find + understand + register), at 30 fps:
- new place / establishing frame: 0.8 s (0.5 s if it is the same set as the shot before)
- a new character or prop coming into focus: 0.5 s (0.3 s if the eye is led there by a look, motion or light first)
- an action on its word: the move itself may be 0.2-0.6 s if anticipated; its MEANING needs a 0.5 s hold after it lands
- on-screen words not being spoken: 0.35 s + 0.25 s per word; words the narrator is speaking are read with the voice
- a light change that carries meaning (gold arrives or leaves): 0.8 s
- the turn / payoff image: >= 1.2 s, camera locked or barely drifting
Rules: one important read at a time (cause, then reaction); say where the eye is at the start of each read and how it got there (look, motion, light, camera); the picture for a named thing lands within 0.15 s of its word; fast actions, slow meanings; let the reads set the length, never squeeze.

# Ep 1 motif register (what already recurs in the approved shot lists; IDs are stable across episodes' creative files)
- {id: posts_pillars, what: "two upright posts gripped by his hands", first: "H1 hook, Gaza gate posts 16:3", payoff: "Dagon's two middle pillars 16:29", note: "framed identically: a deliberate rhyme"}
- {id: gold_upper_left, what: "gold light rushing from the upper left", first: "S1 lion 14:6", develops: "14:19, 15:14", payoff: "absent from 16:19 on; never on his failures"}
- {id: bonds_fall, what: "bonds slipping off his wrists", first: "Lehi 15:14 ropes melt like burnt flax", develops: "16:9 bowstrings snap, 16:12 new ropes snap, 16:14 the loom pin pulled"}
- {id: call_tally, what: "Delilah's call stamped, 1..4", first: "16:9", payoff: "the 4th call 16:20"}
- {id: seven_locks, what: "the seven locks (hair state 1 -> 0)", first: "16:13 woven into the loom", payoff: "16:19 shaved"}
- {id: lamp, what: "a lamp in a window/room", first: "S3 Gaza window dims 16:1", develops: "Delilah's lamp-lit room"}
