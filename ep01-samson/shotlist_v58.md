# Ep 1 Samson: shot list v58 (direction rebuild)

**Status:** a proposal for Marcus to approve. Nothing has been rendered from it. It applies `research/direction_rules.md` to the locked v57 script and Marcus's recorded take (`voice_lab/take1/voice_edit.wav`). The times are the real word times.

**Why it exists:** Marcus judged v57 "not good enough": the pacing, length, motion, camera and storytelling. The v57 shot list put a character standing on screen while the voice told what they did. In this list, every clause shows that clause happening.

## Decisions for Marcus (nothing below is final until he picks)

1. **Length and pace, with no re-recording.** The take runs 2.65 words/s over the voice (2.53 over the whole runtime). That is below every hit studied on both measures: the slowest Lintel hit reads 2.59 over the whole runtime, and the other channels' hits read 2.7–4.1 over the voice. With every line kept, the reel runs 145.8 s; the hits ran 47–137 s. These options can be combined. Exact savings come from the take's word times.

   **Cuts:**

   | Cut | Line | Saves | What it costs |
   | --- | --- | --- | --- |
   | **A** | "But Samson's story doesn't end there." | 2.8 s | Nothing. It is a signpost line, the "announcing a point" kind you ruled out on Oct 29. The cut to the prison mill carries the shift. |
   | **B** | "His choices had cost him his eyes and his freedom." | 3.8 s | It repeats "Blinded…". Your contrast stays: "Earlier, he had assumed he would escape. Now, he asked God for strength." |
   | C | "And the Bible adds: 'So the dead whom he killed…'" plus the 16:30 card | 7.5 s | One little-known detail. |
   | D | "You can be gifted, lead, and help people." | 3.4 s | The concrete real-life bridge you asked for in Round 8. Only take it if you want fewer "you" lines (the hits have 1–3; we have 4). |

   **Speed:** the whole take sped up 7% (rubberband, pitch kept), so it reads at about 2.84 words/s. Listen first: `ep01-samson/options/tempo/voice_tempo_AB_1.00_then_1.07.m4a` plays 37 s as recorded, then the same 37 s at 1.07×.

   **Resulting runtimes:**

   | Package | Runtime |
   | --- | --- |
   | Keep everything | 145.8 s |
   | Speed only | ~136.5 s |
   | A + B | 139.2 s |
   | **A + B + speed (recommended)** | **~130 s** |
   | A + B + D + speed | ~127 s |
   | A + B + C + D + speed | ~120 s |

   The recommended package keeps every piece of evidence and every line you asked for.
2. **The ending.** v58 now ends 2.8 s after the last spoken word: the question card with its pills, then a 2.5 s outro. That is close to Lintel's hits (about 3–3.6 s) and a little longer than the other two channels' (0–1.2 s). Your calm Jesus reveal has two ways to fit (both keep "appears slowly and calmly, stays perfectly still"):
   - **A:** Jesus fades in slowly *under* the spoken question, is fully still by its last word, and the name holds 2–2.5 s.
   - **B:** the reveal is cut down to a 2.5–3 s logo moment after the question.
3. **The answer image.** On "But God still using you doesn't mean He approves of how you're living", the hook image returns: Samson with the gate still on his shoulders, the house he came from behind him, and a stamp reading USED ≠ APPROVED. This is the most consistent ending rule in the study: on Bible Animations and BibleProject the hits return to the hook image at the answer 5 of 6 times and the lows 1 of 4, and Lintel's Tree and Never heard do it too.
4. **K1, "You can be gifted, lead, and help people."** This was three modern cuts of about 1 s each, and no hit cuts under 1 s. It is now one held stage with a plain, blank-faced modern figure. Things land on him on the three words: a guitar and a spotlight on "gifted", people falling in behind him on "lead", lifting a fallen man on "help". He is only ever shown doing good, never wrong (your no-finger-pointing rule). Bible Animations' hits use a figure like this, and their lows don't. The alternative is to keep the three modern sets but hold each one 1.1 s or longer, which needs the line to breathe.

## What no shot list can fix (script level, for the next episode)

The script study (`research/script_rules_from_hits.md`) found that Ep 1 already does the hardest part of the hit structure:
- the question is fully spoken by 4.4 s;
- a concrete sharpening (Gaza);
- the core answer at 45% of the runtime;
- Scripture-only evidence;
- one comment question.

It differs from the hits in three ways that need new words, not cuts:
1. **The turn comes at 53 s, after 48 s of story.** The three hits turn at 16.5–22.2 s (the top six at 14–25 s).
2. **The hook is about "you".** All three hits ask about a named Bible person or object.
3. **The hook's words never come back after 45%.** All three hits re-ask it at 82–89%.

`fw_check.py script` now flags all three. Ep 1 v57 is locked, so these are for Ep 2 onward unless you want to re-record.

## The shot list

**Column key:**
- **Size:** XWS extreme wide, WS wide, MS medium, MCU medium close-up, INS insert.
- **New:** marks what the engine needs before rendering. Unmarked shots use existing sets and rig poses (`lintel/PP2_API.md`).
- **Times** are from the take with every line kept. Cuts A–D (decision 1) remove the marked lines and shift everything after them; the speed option divides every time by 1.07.
- **God's gold light** appears only where the text says God acted: 14:6 "the Spirit of the LORD rushed upon him", and 16:20 when it goes out. There is none at the pillars (we don't show "God answered").

| # | time | spoken | what happens on screen | size · camera | text on screen | new |
|---|---|---|---|---|---|---|
| H1 | 0.0–5.1 | "If God is still using you, does that mean He's okay with how you're living?" | **Gaza, night.** Samson grips the city gate's posts and heaves (0.3 s), and the doors creak up in a shower of dust. On "how you're living" the camera pulls back and reveals the lit doorway of the house he has just left behind him, and the men waiting silently in the shadows by the gate (16:2–3: "they kept quiet all night"). | MS → XWS · **pull-out −45% (hook-reveal)**, starting on "how" | question as the top caption (no big title) | pull-out camera; the house and the waiting men in the gaza set |
| S1 | 5.1–11.5 | "Let's look at Samson, known as the strongest man in the Bible. His strength came from God." | **Timnah vineyards.** One held set with three beats: on "Samson" a young lion leaps at him, roaring; on "strongest" he braces; on "God" gold light rushes down and he catches it. | WS → MS · push +8% (reveal) | name pill SAMSON · JUDGES 13–16, then THE SPIRIT OF THE LORD · 14:6 | — |
| S3 | 11.5–14.7 | "Yet he slept with a prostitute in Gaza." | **Gaza street at night.** Samson walks into a lit doorway; the door shuts and the ember lamp glows. Nothing more is shown. | WS high | name pill GAZA · 16:1 | door closing |
| S4 | 14.7–17.6 | "That same night, while men lay in wait to kill him," | Philistine men surround the place and settle in to wait at the city gate with spears, keeping quiet (16:2). | WS | pill WAITING ALL NIGHT · 16:2 | waiting-men poses (crowd `kneel`/`hold`) |
| S5 | 17.6–21.4 | "he pulled up the city gate, posts and all." | Samson rips the doors and both posts out of the ground on "pulled", lifts them onto his shoulders (`carry`) and walks off toward the hill (16:3). No reaction from the men is shown, because the text gives none. | MS · follow (pan 20%, follow) | — | — |
| D1 | 21.4–23.9 | "Later, he fell in love with Delilah," | **Sorek.** Samson sits beside Delilah and turns to her; she smiles. | MS two-shot | name pill DELILAH · 16:4 | — |
| D2 | 23.9–26.2 | "and the Philistine lords, Israel's enemies," | The Philistine lords in feathered headdresses walk in at her door (Judges 16 gives no number, so a group, not a count). | WS | pill THE PHILISTINE LORDS | lords walk (position animation) |
| D3 | 26.2–30.0 | "offered her silver to find the secret of his strength." | A lord pours silver into her hands; a counter ticks 0 → 1,100 with "from each lord". | MS | counter 1,100 PIECES OF SILVER · FROM EACH LORD · 16:5 | **counter card** |
| T1 | 30.0–34.3 | "Three times she said, 'The Philistines are upon you, Samson!'" | Delilah calls toward the door; the three call stamps land on her words. | MS | stamps 1–3 + ref | (exists) |
| T2 | 34.3–36.9 | "And three times he broke free." | **Three comic panels on one shot** (no cut under 1 s): the panels slide in side by side, and in each Samson bursts a binding on its word. The bowstrings go on "three", the new ropes on "times", the loom pin on "broke", and all three flash on "free". | MS · list | counter 1-2-3 | **panel strip** (BibleProject's inset device) |
| E1 | 37.0–39.4 | "Then he told her his secret." | Samson leans in to whisper (`lean`); her eyes narrow. | MCU two-shot | pill ALL HIS HEART · 16:17 | — |
| E2 | 39.4–43.3 | "While he slept, she had a man shave off his uncut hair," | Samson asleep on her lap; the barber kneels and the seven locks fall one by one. | MS | pill SEVEN LOCKS · 16:19 | locks falling count |
| E3 | 43.3–45.6 | "the sign he was set apart to God." | Insert: the seven locks on the floor in lamplight. The gold rim on Samson still glows faintly (the Lord hasn't left yet in the text). | INS | pill SET APART TO GOD · NUMBERS 6:5 | insert framing |
| F1 | 45.6–48.3 | "She called a fourth time. He woke up" | Delilah calls; the 4th stamp lands in ember; on "woke" Samson stirs awake on her lap. | MS | stamp 4 | (exists, 4th stamp) |
| F2 | 48.3–53.4 | "and said, 'I will go out as at other times and shake myself free.'" | Closer: Samson, shaved, rolls his shoulders and half-smiles as he speaks (`wake`). Philistine soldiers come out of the inner room behind him (16:9, 16:12). | MCU | — | soldiers enter |
| G1 | 53.4–57.2 | "But he did not know that the LORD had left him." | The gold rim on him goes out on "left". He tries to shake himself free and nothing gives; the soldiers seize him (16:20–21). The strain is an inference from "shake myself free", so send it to the fact-check agent. Verse card in the top half over the struggle. | MS · still | verse 16:20 (3.6 s) | strain with no bonds; seize |
| J1 | 57.2–60.0 | "Notice what he said: 'as at other times.'" | Quick memory of Lehi: the ropes fall from his arms in gold light (15:14). | WS | label "as at other times" · 16:20 | (exists: lehi) |
| J2 | 60.0–64.6 | "It had always worked before, so he assumed it would work again." | A tally: bowstrings ✓, ropes ✓, loom ✓, then the shaved head with a "?". A red X lands on "again". | graphic over a dim Sorek | tally card; pill HE ASSUMED | **tally/diagram card**, red X |
| K1 | 64.6–68.0 | "You can be gifted, lead, and help people." | **One held modern stage** (decision 4): a plain, blank-faced figure. On "gifted" a guitar lands in his hands under a spotlight; on "lead" a small group steps in behind him and follows his hand; on "help" he lifts a fallen man to his feet. He is never shown doing wrong. | WS | — | **blank-faced modern figure** + 3 props |
| K4 | 68.0–72.6 | "But God still using you doesn't mean He approves of how you're living." | **Callback to the hook:** Samson under the gate on his shoulders (strength still working) with the lit house behind him. A stamp lands on "approves". | MS → WS · slight pull | pill USED ≠ APPROVED | callback set (same as H1) |
| L1 | 72.6–75.1 | "Jesus warned that on judgment day," | A great crowd stands before a tall door of light. | XWS | pill JUDGMENT DAY · MATTHEW 7:22 | (exists: day) |
| L2 | 75.1–78.2 | "many will point to the mighty works they did in His name," | People raise scrolls and staffs toward the door, pleading. | WS · push +10% (reveal) | — | (exists) |
| L3 | 78.2–81.5 | "and He will declare, 'I never knew you.'" | The light in the doorway narrows and the door closes on "never". | MS on the door | verse 7:23 | door closes |
| M1 | 81.5–84.9 | "But Samson's story doesn't end there. Blinded and" (cut A removes the first sentence) | **Prison.** Blind Samson in shackles grinds at the mill; his hair has begun to grow. | WS | pill THE PRISON MILL · 16:21 | — |
| M2 | 84.9–88.3 | "brought out to entertain his captors," | The boy leads Samson by the hand into Dagon's crowded house; the lords laugh and point. | WS | pill BROUGHT OUT TO ENTERTAIN · 16:25 | — |
| M3 | 88.3–93.6 | "he prayed, 'O Lord GOD, please remember me and please strengthen me only this once…'" | Samson between the pillars lifts his face and prays (`pray`). The card is acted on while it holds: "please remember me" turns gold on "remember", "please strengthen me" on "strengthen". | MS low angle · still | verse 16:28 (5.9 s, narrow layout, 2 marks) | **verse marks** |
| M4 | 93.6–96.8 | "Even then, he asked for revenge." | His face hardens under an ember tint. His hands only rest on the pillars, feeling them (16:26); the grip comes at P1 (16:29). | MCU | pill "FOR MY TWO EYES" · 16:28 | — |
| N1 | 97.1–100.9 | "His choices had cost him his eyes and his freedom." (cut B removes it) | Insert: the shackles and the cloth over his eyes. | INS | pill HIS EYES · HIS FREEDOM | — |
| N2–N3 | 100.9–106.7 | "Earlier, he had assumed he would escape. Now, he asked God for strength." | A flashback to the wake pose (sure he will shake free), then back between the pillars, his face lifted, asking for strength. | MS | — | — |
| P1 | 106.8–110.6 | "Then he pushed against the pillars with all his strength," | He grasps the two middle pillars (16:29), then `push`: he bows with all his strength (16:30) and cracks run up both pillars. | MS · push +12% (reveal) | — | — |
| P2 | 110.6–116.4 | "and the building fell on the Philistine lords and everyone inside. Samson died with them." | The roof comes down and the lords topple into dust; impact shake. On "Samson died with them", in the same continuous shot, the dust settles over the rubble in neutral cool daylight through the broken roof. It is not God's gold, which would imply an answer the text doesn't state. No gore. | WS | — | (exists: fall + aftermath) |
| R1 | 116.4–123.8 | line 13 (cut C removes it) | The 16:30 verse over the settling dust; "more than those" turns gold on "more". | WS | verse 16:30 (1 mark) | verse marks |
| Q1 | 123.9–126.8 | "Samson's last act began with a prayer." | **Callback** to M3: Samson's lifted face between the pillars, now in silhouette; dissolve to dawn over Gaza. | MS → XWS | — | — |
| Q2 | 126.8–131.6 | "And centuries later, Hebrews 11 names him in a list of people who, through faith," | The Hebrews 11 scroll unrolls; the names light up and SAMSON glows. | graphic | names list · HEBREWS 11:32 | (exists) |
| Q3 | 131.6–135.5 | "'were made strong out of weakness.'" | The quote card with "were made strong out of weakness" builds; under it, people walk up a hill into dawn light (arrival). | WS | quote · HEBREWS 11:34 | arrival walk |
| Z1 | 135.5–143.5 | "What stands out more to you about Samson: his strength, his failures, or his prayer at the end? Why?" | Question card: three option pills pop on their words, then a comment types. | graphic | CTA | (exists) |
| Z2 | 143.3–145.8 | — | Logo: the calm outro, 2.5 s (decision 2). | — | — | trimmed outro |

## Engine work this list needs

All of it is small next to the scenes that already exist.
1. A `counter` card (from, to, label, beat).
2. A `tally` card (icons with checks, a "?", a red X).
3. A 0.2 s cream flash helper on scene changes (film.js).
4. The hook pull-out camera in gaza.js, plus the house doorway and the men asleep at the gate.
5. A door that closes (gaza S3, day L3).
6. Lords walking in at Delilah's door; soldiers entering; the seize.
7. One modern stage for K1, with a blank-faced figure and three props landing on words (a guitar and spotlight, a group stepping in, a fallen man lifted).
10. **Verse marks** (cards.js): `verse.marks: [{ phrase, at, kind: 'gold' }]` turns a phrase gold on its word while the card holds. **Built and tested on the 16:28 card (Oct 31).** A speech bubble device (`shot.bubble`) also exists now, if you want Delilah's or Samson's quoted words as bubbles.
11. **Panel strip** for T2: three panels slide in side by side, and each plays its burst on a beat.
8. A dawn walk-up-the-hill for Q3.
9. Audio: a fuller sustained low bed (direction_rules §10) and one SFX per action: snap, burst, coins, stamp, door, shave, crash.

## Check before building
This list is already entered as `film27/score_v58.js` (every-line-kept timings, direction fields filled). `node tools/shotlist_check.js ep01-samson/film27 --score score_v58.js` (Oct 31, after the cross-channel update) gives **0 FAIL, 2 WARN**:
- the length, 145.8 s (decision 1);
- the speech rate, 2.65 words/s (decision 1, speed).

Everything else passes:
- **Beat clock:** 86 planned beats, one every 1.7 s, with 3% of the runtime in gaps over 4 s (v57 measured 47%).
- **Rhythm:** median shot 3.3 s, 1.19 shots per sentence.
- **Picture:** a person acts in 81% of shots.
- **Verse cards:** all within their holds, with the long ones acted on.
- **Tail:** 2.8 s after the last word.

A planned beat is a promise. `fw_check.py video` measures the real beats on the render.

When it is approved, `node ../../tools/shotlist_check.js .` (from film27; it reads OUTRO = 2.5 from the score, after this list is entered into score.js with the direction fields) must show no FAIL. Then render a draft of H1–D3 (0–30 s) at half resolution as the first motion test.
