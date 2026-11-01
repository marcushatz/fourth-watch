# Ep 1 Samson · shot plan v60 (Oct 31, 20:40): v59 with Marcus's picks and the accuracy fixes

**Status:** goes with `episode_v60_draft.md` and `v60_plan.md`.

**What changed from v59 (Oct 31, 20:40):**
- Marcus's picks (Round 17): K1 ("You can be gifted…") and N2–N3 ("Earlier… Now…") cut; outro A (Z1–Z2); the Matthew 7 rows were already out (v59 variant X).
- Accuracy fixes, made directly (Round 17): M4 no longer shows a cloth over his eyes; P1 now says and shows the ESV verbs, "leaned his weight… bowed with all his strength" (16:29–30; verified by the v60 fact-check, `qa/round_v60/A_factcheck.md`).
- Engine honesty: J1's crossfade is marked as not built yet (film.js has only `dip` and `flashIn`).
- Z1 uses closing-question option A; the options are in `v60_plan.md`.

The rows are in order, with approximate lengths. The exact times come from the new take: re-time `score_v60.js` from `vo.js`, then run `node tools/shotlist_check.js`.

**What changed from v58, and where each fix came from** (including the audit of Oct 31 evening: no watchers at the gate tear, no door symbols, the counter only at 16:5, the hill before Hebron, the 16:26 order, the lean then the bow, Hebrews 11's description on the whole list):
- **The fresh shot-plan review** (Oct 31):
  - an angle on every shot, with weak moments high and strong moments low;
  - the climax as a fast run;
  - the ending on the hook image;
  - no beats that need facial acting;
  - no 13 s dead stretch after the fall.
- **The ESV picture check** (six fixes):
  - the lion "came toward him roaring" and he tore it, with no leap and no catch (shown as a cut to dust, no gore);
  - the silver is *offered* at 16:5 and *brought* after he told her (16:18);
  - Delilah speaks *to Samson*;
  - the gold goes out at the shave ("his strength left him", 16:19);
  - no inner-room soldiers at 16:20, and no struggle shown;
  - a "young man" leads him into the "house".
- **The v59 viewer tests:**
  - lead the Delilah stretch with new facts (the swipe risk);
  - say why the gate matters ("the same night, still strong").
- **The director's read:** frame the pillars like the gate posts in the hook (a rhyme).

Sizes and angles follow `system/06_camera_and_angles.md`. The device names are in `ep01-samson/film27/scenes/_API.md`.

| # | ≈len | Words (v59) | What happens on screen | Size · angle · camera | Text on screen | Engine work |
|---|---|---|---|---|---|---|
| H1 | 5.0 | "If God is still using you… how you're living?" | Gaza, night. Close and low on two gate posts, Samson's hands gripping them; he dips (anticipation), then heaves on 0.3 s, and the doors creak up in dust. On "how" the camera pulls back to a wide: the empty night street, and the lamp-lit window of the house he came from glowing behind him. No watchers in view (16:2–3 never says anyone saw) | CU low → WS, pull-out −45% (hook reveal) | The question as the top caption | Pull-out; the posts framed exactly like the pillars in M3/P1 (rhyme) |
| S1 | 6.4 | "Let's look at Samson… His strength came from God." | Timnah vineyards. A young lion comes toward him roaring (on "Samson", 14:5); he braces (on "strongest"); on "God" gold rushes down from the upper left ("the Spirit of the LORD rushed upon him", 14:6) and he takes hold of the lion bare-handed. On the tear, cut to a burst of dust: no gore, and the lion is gone | WS → MS, push +8% (reveal) | SAMSON · JUDGES 13–16, then THE SPIRIT OF THE LORD · 14:6 | Lion 'crouch'; dust burst on the cut; gold rays |
| S3 | 3.2 | "Yet he slept with a prostitute in Gaza." | A Gaza street at night: he walks into a lamp-lit house; a moment later the lamp in its window dims. Nothing more is shown | WS, high, from across the street | GAZA · A PHILISTINE CITY · 16:1 | Lamp dim (no door symbol: canon §1) |
| S4 | 3.2 | "That same night, while men lay in wait to kill him," | Over the shoulders of the Gazites, through their spears, toward the shut city gate; they settle in to wait, keeping quiet | OTS, eye level, foreground spears soft | THEY WAIT FOR MORNING · 16:2 | Foreground spear billboards with depth of field |
| S5 | 3.6 | "he pulled up the city gate, posts and all." | A low insert: the posts tear out of the ground on "pulled", earth spraying; cut to Samson walking off with the doors and posts on his shoulders (`carry` walk), not a replay of H1 | INS low → WS, follow (pan 20%, follow) | THE SAME NIGHT · STILL STRONG | Posts tearing out; carry walk |
| D1 | 2.4 | "Later, he fell in love with Delilah," | Sorek. Samson sits down beside Delilah on her couch, turned toward her (posture, not faces) | WS from the door, high (position A) | DELILAH · JUDGES 16:4 | — |
| D2 | 2.9 | "and the Philistine lords, Israel's enemies," | The Philistine lords walk in at her door (a group, no number) and stand over her | Low, from behind Delilah (OTS) | THE PHILISTINE LORDS | Lords walking (position animation) |
| D3 | 3.3 | "offered her silver to find the secret of his strength." | The lord's offer: no coins change hands yet (16:5 is a promise; the money comes at 16:18). The counter ticks to 1,100 over the lords as they lean in to her | MS, slight low on the lords | Counter: 1,100 PIECES OF SILVER · FROM EACH LORD · 16:5 | Counter (exists) |
| T1 | 4.2 | "Three times she said, 'The Philistines are upon you, Samson!'" | Delilah calls *to Samson* (`call` pose turned to him); the call stamps 1–3 land on her words | MS, eye level (position B) | Stamps 1–3 | Stamps (exist) |
| T2 | 2.7 | "And three times he broke free." | One held shot, three beats: the bindings swap on each word and burst (bowstrings snap on "three", new ropes on "times"; on "broke" he lifts his head and tears away the pin, the loom and the web his locks were woven into, 16:13–14: nothing was tied to his arms the third time); the counter 1-2-3 | MS, slight low | 1 · 2 · 3 | Burst poses for the first two (exist); a loom-and-web prop that rips away with his head (to build); no sub-1 s cuts |
| E1 | 2.3 | "Then he told her his secret." | He leans in and whispers (`lean`); cut-away: outside her door, the lords come up with the money in their hands (16:18) | MCU two-shot → INS on the money | ALL HIS HEART · 16:17 | Lords holding silver |
| E2 | 3.9 | "While he slept, she had a man shave off his uncut hair," | Top-down: Samson asleep on her knees; a man shaves; the seven locks fall one by one; **the gold rim on Samson fades out as the locks fall** ("his strength left him", 16:19) | Top-down, high | SEVEN LOCKS · 16:19 | Top-down on the couch; the gold fades during the shave |
| E3 | 2.5 | "the sign he was set apart to God." | Insert: the seven locks on the floor in lamplight | INS | NO RAZOR · SET APART FROM BIRTH · JUDGES 13:5 | — |
| F1 | 2.7 | "She called a fourth time. He woke up" | Delilah calls a fourth time; the 4th stamp lands in ember; on "woke" he stirs | MS (position B) | Stamp 4 | — |
| F2 | 5.0 | "and said, 'I will go out as at other times and shake myself free.'" | He stands, shoulders rolling back (`wake`); a speech bubble pops: "I WILL GO OUT AS AT OTHER TIMES" (caption hidden while it shows) | MCU, slight low (he thinks he's strong) | Bubble | Bubble (exists) |
| G1 | 3.7 | "'But he did not know that the LORD had left him.'" | High angle, slow push +8%. No gold on him (it faded at the shave, 16:19). He stands, unaware; on "him" the Philistines step in and seize him on contact (16:21; no struggle is described) | MS high, push +8% | Verse card 16:20 | Verse card; seize on contact |
| J1 | 3.3 | "Notice what he said: 'as at other times.'" | Memory of Lehi: the ropes melt off his arms in gold light (15:14, the Spirit rushed upon him) | WS, a dip in (a crossfade is not built yet) | "as at other times" · 16:20 | Lehi set (exists) |
| J2 | 4.2 | "It had always worked before, so he assumed it would work again." | Tally: BOWSTRINGS ✓, ROPES ✓, LOOM ✓, then THIS TIME ?; a red X lands on "again" | Graphic over the dim Sorek set | HE ASSUMED | Tally (exists) |
| K4 | 4.6 | "But God still using you doesn't mean He approves of how you're living." | Callback to the hook: Samson walking with the gate on his shoulders (strength still working), the lit house behind; the stamp USED ≠ APPROVED slams in on "approves" | WS, low | Stamp | Stamp (exists); carry walk |
| (K) L1–L3 | 8.9 | Matthew 7 (variant K only) | A great crowd holds up scrolls and staffs toward a tall light ("many will say… did we not… do many mighty works in your name?"); on "I never knew you" the light turns from them and they are left in shadow. No door (Matthew 7 has none, and doors are Lintel's signature) | XWS → WS push → MS | ON THAT DAY · MATTHEW 7:22; card 7:23 | Crowd poses (exist); light turn |
| M1 | 3.8 | "Blinded and brought out to entertain his captors," | High, small: blind Samson in shackles grinding at the mill in the Gaza prison; his hair has begun to grow (16:22). On "brought out" a young man takes his hand and leads him out (16:25–26) | WS high, slow push | THE PRISON MILL · 16:21, then BROUGHT OUT TO ENTERTAIN · 16:25 | `boy` rig labelled "the young man"; one shot, two beats (no sub-2 s shot) |
| M3 | 5.9 | "Samson prayed, 'O Lord GOD, please remember me and please strengthen me only this once…'" | Dagon's crowded house; the lords laugh and point and the roof is packed (16:25, 16:27). On "Samson" the young man places his hands on the two pillars he asked to feel (16:26). Then high and small between the two huge pillars, framed like the gate posts in H1, face lifted toward the upper left; no beam. The verse card acts: "please remember me" turns gold on "remember", "please strengthen me" on "strengthen" | WS high (weak) | Verse card 16:28 with marks | Marks (exist) |
| M4 | 2.8 | "Even then, he asked for revenge." | The 16:28 card stays up and "that I may be avenged on the Philistines for my two eyes" turns ember on "revenge"; behind the card, Samson seen from behind and above, small between the pillars, so his eyes are never shown (16:21 is told, not pictured; no cloth, which the text doesn't mention) | High, from behind | — | Ember mark (exists, Oct 31) |
| P1 | 3.5 | "Then he leaned his weight against the two middle pillars and bowed with all his strength," | Fast run: CU on his hands taking hold of the two middle pillars (16:29) on "leaned"; he leans his weight on them, then on "bowed" he bows with all his strength (16:30); low tilt up the cracking pillar to the roof crowd; the counter "ABOUT 3,000 ON THE ROOF · 16:27" ticks up | CU → low tilt | Counter | Counter (exists); crack decals; 'push' pose = the bow |
| P2 | 4.0 | "and the building fell on the Philistine lords and everyone inside. Samson died with them." | Roof falls (WS, impact shake) → lords topple (MS) → dust. On "Samson died with them", crane up and out over the rubble in cool daylight. No gold, no beam (the text doesn't say God answered) | WS → MS → crane up | — | Fall (exists); crane |
| Q2 | 5.9 | "And centuries later, Hebrews 11 names him in a list of people who, through faith, 'were made strong out of weakness.'" | The Hebrews 11 scroll unrolls and the list of names lights up; SAMSON is found in the list (11:32). "were made strong out of weakness" turns gold over the whole list, not over Samson alone (it describes the group, 11:33–34) | Graphic | HEBREWS 11 · A LIST OF PEOPLE OF FAITH | Heb 11 card (exists) |
| R1 | 11.0 | "So does God still using you mean He's okay with how you're living? Samson's strength never proved that. But even at his lowest, he could still call on God." | **Callback.** Dawn already rising on the hill in front of Hebron, where Samson carried the Gaza gate (16:3); the gate lies on the hilltop. Beats about every 2 s: the cut in (0 s); the faint USED ≠ APPROVED stamp returns on "okay" (~2 s); the stamp fades on "never proved that" (~4.5 s); an inset of the prison mill (from M1) on "at his lowest" (~7 s); an inset of his prayer between the pillars (from M3) on "call on God" (~9 s). The light does not change on "call on God": no answer implied | WS → push +10% | THE HILL BEFORE HEBRON · 16:3 | Hill set at dawn; gate prop; two memory insets |
| Z1 | ≈5 | "What stands out more to you about Samson: his failures, or his prayer at the end?" | The two option pills pop over the same dawn hilltop on their words (HIS FAILURES · HIS PRAYER AT THE END); under them, Jesus fades in slowly (outro A, ~2 s ease-in-out) and is fully still by the last word | Same set, locked | CTA pills | CTA over the scene, not a card |
| Z2 | 2.0–2.5 | — | Outro A: Jesus holds perfectly still, the camera stays locked, and the wordmark (style 4) fades in with no rise; the name holds 2–2.5 s. If the spoken ESV credit is placed here (decision 11), it is read under this hold | — | Logo | Outro A |

## Planned beat clock (to check on the render)

- **Every row has at least one beat on a word.** The long rows have more:
  - S1: lion, brace, gold;
  - E2: locks falling one by one;
  - M3: two marks;
  - P1/P2: the fast run;
  - R1: the stamp, then the light.
- **The biggest v58 risk is fixed:** the 13 s of settling dust after the fall is gone (cut 4 removes the 16:30 card, and P2 cranes up and ends).
- **R1 is an 11 s shot,** so it carries five beats about 2 s apart (the cut, the stamp, the stamp fading, two memory insets). Check it on the motion draft.

## Engine work this list needs (small)

1. The H1 low angle and pull-out, with the posts placed to rhyme with the pillars.
2. Foreground spears (S4).
3. Posts tearing out (S5 insert).
4. Top-down on the couch, with the gold fading over the shave (E2).
5. Lords holding the money (E1 cut-away).
6. An ember verse mark (M4): built Oct 31 (`marks: [{ phrase, at, kind: 'ember' }]`).
8. Crack decals plus the roof counter (P1).
9. A crane up over the rubble (P2).
10. The hill in front of Hebron at dawn with the Gaza gate on the hilltop, plus two memory insets (R1, Z1).
10b. CTA pills over a scene instead of a card, with Jesus fading in under them (Z1, outro A).

Dropped from v58:
- the three side-by-side comic panels (too small on a phone);
- the K1 group animation;
- the dawn walkers.
