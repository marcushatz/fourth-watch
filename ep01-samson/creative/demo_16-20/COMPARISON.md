# Demo: Creative Director mode vs our current workflow (Ep 1, Judges 16:20, 48.5 to 56.5 s)

**The window.** The same 8 seconds of the approved v57 narration:

> ...He woke up and said, "I will go out as at other times and shake myself free." / "But he did not know that the LORD had left him."

**What's compared:**
- **Current workflow:** v57, the rendered and locked cut (shots S09 and S10, `current_v57_sheet.jpg`), plus v60, the current draft shot list (rows F2 and G1).
- **Creative Director (CD) layer:** treatment T2 "The empty corner". This is spec pass 2 plus two mechanical edits (`spec.yaml`).

**No new frames were rendered.** Building needs Marcus's treatment pick and shot-list approval (the gates the layer keeps), and building it means editing `scenes/sorek.js`, which this task rules out. So this is plan against rendered cut, and plan against plan.

**AI labels.** Every reviewer below is an AI model:
- The creative director is Claude Opus (effort high).
- The picture fact-checker is Claude Sonnet.
- Everything else is a script.

## What the viewer sees

| Time (s) | v57 (rendered) | CD spec (T2, pass 2) |
|---|---|---|
| 45.65 to 48.5 (before the window) | S09: pill "THE FOURTH CALL · JUDGES 16:20". Samson wakes and stands. | S09: same pill. He wakes where he slept, his head lifting from Delilah's knees on "woke up". |
| 48.57 "said" | Philistine soldiers walk into the inner doorway behind him. The ember light brightens. He keeps rolling his shoulders in a loop. | He stays seated and Delilah stays still. Only her ember lamp lights the room; the upper-left wall is dark. |
| 49.17 "I" to 51.3 | His words in the captions. | A bubble: "I WILL GO OUT AS AT OTHER TIMES". A 5% push-in starts on "go". |
| 51.33 "shake" | (same shot continues) | **Cut** to a medium shot at eye level. Bubble: "AND SHAKE MYSELF FREE." No gesture. The empty dark upper left is the biggest shape in the frame. |
| 52.44 | (music continues) | The music swell cuts dry 0.15 s after "free". The light does not change. |
| 53.43 "But" | **Cut** to a high angle. He stands small in the doorway light, with soldiers in the doorway. | **Cut** to a wide shot from high. He is small and seated, at her knees, and doesn't move through the line. |
| 53.51 / 53.99 | Verse card 16:20 appears on "But". | Verse card 16:20 appears on "did", after a 0.5 s read of the room. |
| 55.67 "left" | One lamp goes out, the room cools, his tint cools. | Nothing changes. Locked frame, dust only, to the cut into S11 (Lehi, "as at other times"). |

## The same gates on both

| Gate | v57 (rendered) | v60 (draft) | CD spec |
|---|---|---|---|
| **Picture fact-check** (AI, same agent, same rules; `factcheck_pass2.md`) | **CORRECTION** ×2: <ul><li>Unnarrated standing and shoulder-rolling.</li><li>Soldiers arrive before 16:21, in a doorway (the no-door rule).</li><li>The room brightens, then a lamp dies on "left", staging the LORD's leaving as a moment although 16:20 says "had left".</li></ul> | **CORRECTION** ×2: <ul><li>Standing.</li><li>A low angle noted "he thinks he's strong" (an invented motive).</li><li>Gold dated to "faded at the shave".</li><li>The 16:21 seizure squeezed onto the end of the 16:20 card.</li></ul> | **VERIFIED** ×3 (pass 2). Pass 1 failed: see below. |
| **Mechanical spec check** (`spec_check.py`) | n/a: no spec | n/a | 0 FAIL, 0 WARN. 7 timed reads, all at or above the read minimums. |
| **Shot-list linter** (`shotlist_check.js`, unchanged, on the whole reel) | 3 WARNs in this window: <ul><li>S09 runs 7.8 s with no reason.</li><li>S09 has no act/change.</li><li>S10 has no act/change.</li></ul> | (not compiled) | 0 WARNs in this window. Its cuts and card pass. Reel totals: shots acting 0% → 13%; median shot 6.4 → 5.7 s; beats one every 1.9 s → 1.8 s. The same 2 FAILs elsewhere in v57 remain (S16 and S19, outside this window). |
| **Cuts in the window** | 1 | 1 (plus a push) | 2 (plus a push). The sizes go MCU low → MS eye → WS high, so there are no jump cuts. |
| **Text** | Caption, then the verse card | Bubble (the quote cut short, the fact-checker noted), then the verse card | Two bubbles carry the full quote, then the verse card. One text element at a time. |
| **Motifs** | None named | None named | gold_upper_left (paid off as an absence: the corner where gold always came stays dark), lamp (her ember lamp is the only light), seven_locks (hair 0 in every shot) |

## What the layer caught in its own work

The point of the layer is that its checks catch problems before Marcus sees them.

1. **The creative director's strongest idea was wrong about the text.**
   - **Pass 1 (`spec.pass1.yaml`):** he stood, flung his arms toward the upper left on "shake", nothing broke, and he lowered his arms on "know"; the corner darkened on "LORD".
   - **The fact-checker** (`factcheck_pass1.md`) rejected it: 4 corrections and 2 overclaims. Words are not deeds: "shake myself free" is what he *said*. "Had left" is past perfect, so no change on the word. He slept on her knees, not standing.
   - **Pass 2** kept the treatment's idea (the empty corner) and dropped everything the text doesn't narrate.
   - The same rule then failed v57 and v60, which shows the problem is older than the new layer. v58's G1 ("tries to shake free and nothing gives") made the same mistake.
2. **The checker and the pack had holes, now closed with tests written first** (`creative/_proto/test_spec_check.py`, 6/6):
   - "weight forward" tripped the balance-imagery ban (a false positive);
   - the first read was judged without knowing the shot before was the same set;
   - the pack never told the director about the approved 16:20 verse card, so pass 1 dropped it.
3. **What the director is now told up front:** the picture-accuracy rules from (1) are now in its brief and the canon digest, so the next window should get them right in pass 1.
4. **Primitive cap:** pass 1 asked for one new primitive (`shade`, a darkening on "LORD"). The accuracy fix removed the need, so this sequence adds **no new engine code**. The cap and registry went unused here: honest, not proved.

## Cost (from `ledger.jsonl`: tokens as each agent reported them; cache reads not counted)

| Step | Model | Tokens | How |
|---|---|---|---|
| Treatments + concept + spec, pass 1 | Opus | 90,785 | New agent. 74,557 of it is fixed start-up context every new agent carries; the creative work itself was ~8k in and ~8k out. |
| Picture fact-check, pass 1 | Sonnet | 88,034 | New agent. The same ~74.5k start-up cost. |
| Spec pass 2 | Opus | 7,779 | **Resumed** the same director (its context was cached). |
| Fact-check of pass 2 + v57/v60 | Sonnet | 10,761 | **Resumed** the same checker. |
| Pack, cache, spec check, compile, linter, budget | scripts | 0 | |
| **Total** | | **197,359** | ~149k (75%) is start-up for 2 agents. Paid generation: $0. |

What the measurements changed:
- **The proposal's first opus cap (60k per episode) couldn't afford one call.** The budget is recalibrated, and the gate demonstrably refuses:
  - a new 75k opus agent once 90k of a 150k cap is spent;
  - a third spec pass.
- **Revisions resume an agent instead of spawning one.** A resume cost 8 to 11k against ~88k for a new agent.
- **Project agent definitions with only the tools each role needs** (`.claude/agents/`) should shrink the 74.5k start-up. That needs a new session to measure, so it's proposed, not claimed.
- **The current workflow logs no tokens,** so there is no like-for-like cost for it. The current version of this window took several rounds over v57/v58/v60 and still has the errors above.

## What isn't shown, and the risks

- **No rendered frames of the new version.** Camera, poses and light are code inside each scene function (`SH.wake`, `SH.left`), not shot fields. So the compiler (`compile_spec.py` → `score_cd_demo.js`) can only set cut times, beats, bubbles, the card and the plan fields.
  - The build step would add a seated-on-her-knees wake and a no-soldier `left` to `sorek.js`. That edit is ruled out today.
  - The change also reaches back into S09's first 3 s (he must wake on her knees, and no soldiers come in).
- **It's quieter.** After the card lands at 53.99 there's a 3.2 s locked hold with only dust moving. The linter passes it, and the canon allows a still hold on a key line. Whether it plays as weight or as a stall needs the motion draft. If it stalls, the fix within budget is a slower start on the card, not new action.
- **Alternatives** (`treatments.md`):
  - **T1 "Muscle memory"** matches his pose to Lehi's; the director warned it uses up the next shot's "as at other times" beat.
  - **T3 "Locks on the floor"** risks saying the hair, not the LORD, was the strength.
- **Next for this window, in order:**
  1. Marcus picks a treatment.
  2. Marcus approves the shot list.
  3. A Sonnet builder adds the two `sorek` variants.
  4. A review of the stills (sheet, strip, crop) against the 7 reads.
  5. The motion draft.
