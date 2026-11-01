# Result: the Story Director proof of concept (the pillars, Judges 16:28-30, 12.6 s)

**Files:**
- `sd_window.mp4` (the new version, with the v57 soundtrack for the same seconds) beside `v57_window.mp4`;
- `compare_v57_vs_sd.jpg` (12 matched frames);
- the plan: `STORYBOARD.md`; the demo score: `score_sd.js`.
- Rebuild the film folder with `make_film.sh`.

**Reviewers:**
- the muted test and the picture fact-check were one AI agent (Claude Sonnet), which never saw the plan or the code;
- the creative direction and the build were this session (Claude Opus).

## What changed on screen

| | v57 (current, shot S19) | Story Director version (sdA-sdE) |
|---|---|---|
| Shots | 1 shot, 12.6 s (the linter FAILs it: "split it on its clauses") | 5 shots: MS high → low MS → low crane → WS → the emptied place |
| "asked God for strength" | Frontal, hands up in front of him, static for ~3 s | High angle (weak), palms on the pillars, head lifting on "asked", a story push-in; the lords still laughing behind him |
| "pushed against the pillars" | Gold light floods in; his hands never meet the pillars | The grip on "Then"; anticipation, then the bow with all his weight on "pushed"; a tremor; **both pillars visibly lean under him in the same frame** |
| "with all his strength" | The same pull-back continues | A low crane from him up to the capitals and the roof crowd; the pillars shifting |
| "the building fell on the lords and everyone inside" | A pull-back to the wide; gold rays through the dust | A WS where he stays a third of the frame: the give on "building", the roof on "fell", a shake ≤ 12 px; the dust takes him as the roof lands (no body) |
| "Samson died with them." | ~4.5 s of near-identical gold dust | A cut to the emptied place: the roof lying where he stood, the dust settling, the idol upright |
| Accuracy | **Gold on "pushed"** (07 §6 says never at the pillars: the text doesn't say God answered); the crowd hushes on "asked" (not in the text); sand before the give; **the idol topples** (1 Samuel 5's story, not Judges 16) | No gold, no hush, no sand before the give, no idol falling. The picture fact-check verified the revised pictures; its notes are in `qa_picture_factcheck.md` |
| Linter (the whole reel, `shotlist_check.js`) | 2 FAIL (S19 12.6 s; S16's card); median shot 6.4 s (WARN); a change every 1.9 s | 1 FAIL (S16's card, outside this window); median 4.2 s (PASS); a change every 1.6 s, 17% in gaps over 4 s (PASS) |
| Look | Warmer and more spectacular, because of the gold | Darker and cooler (torchlight and moonlight only). It's accurate, but it's less beautiful as it stands. See "What's still weak" |

## How the verification changed it (13 §4 in practice)

1. **Pass 1 stills** showed three weak shots: the push didn't read; a lord blocked the pillar shot; the top-down ending was fog. Those three were fixed, and the other shots weren't touched.
2. **Full render 1 (34 min), then the muted test** (frames only, captions cropped). The viewer's story was "the roof falls; nothing tells me it was his doing". Its three worst problems:
   - (1) no visible cause;
   - (2) he's a speck in the wide and his fate is unclear;
   - (3) duplicate holds and cryptic close-ups.
   **Fixes:**
   - the cause and the first effect now share a frame: the pillars lean under him;
   - a closer wide where the dust takes him;
   - a readable crane with him in the shot;
   - a story push-in on "asked".
3. **The picture fact-check** of the revised plan:
   - P1, P2 and P4 VERIFIED;
   - **P3 OVERCLAIM:** sand before the give is an invented beat. Removed;
   - **P5 CORRECTION:** the toppling idol is invented. It now stays upright;
   - the blindfold band is "a fair stand-in" but reads as "blindfolded", not "blind". That's a decision for Marcus (below).
4. **The final render** with all of the above (`sd_window.mp4`).
5. **The engine safety check:**
   - The reusable pieces were promoted into `film27`: `fw/direct.js`, the PP2 `pitch` option, and the dagon `sd` branch with its robust timeline. They change nothing in v57.
   - Three master frames rendered before and after the change (104.5, 107.7, 112.0 s) are **pixel-identical**.

## What's still weak (the next three to fix)

1. **The look is cold.** Without the gold, the hall is lit by moonlight and torches, and it's duller than v57. The fix is in the text's own terms: warm the torch/ember key (the Philistines' house is torchlit) and keep it cool only after the dust. It's not done yet.
2. **The head-lift on "asked" is subtle.** With the blind band, a pitch change barely reads at MS. The push-in carries the beat. A rig option (raising his hands up the pillars) would read better.
3. **The rhyme with the hook is only in the action.** Two hands on two posts don't yet share a matched framing with the hook (16:3). That needs a composition matched across sets (`recipes/rhyme_payoff.md`).

Also: the v57 soundtrack's shimmer on "pushed" belonged to the gold. It should go when the song is rebuilt.

## Cost (measured unless marked)

| Item | Tokens | Time |
|---|---|---|
| Keyframes + audit + spec + library + storyboard + build + review | The main session (Opus). No agent start-up was paid. Not metered per step: **estimate 150-250k** | none |
| Muted test (vision) + picture fact-check | 81,421 for the new agent (~75k of it start-up) + 4,905 for the resume = **86,326** | ~50 s |
| Stills (5 passes, 46 stills on the dagon set) | none | 6-12 s each, about 8 min in all |
| Full render 1 (378 frames, 1080×1920) | none | **2,064 s = 34.4 min (0.18 fps)** |
| Final render | none | see `film/out/render_final.log` (same size: about 34 min) |
| Engine safety check (6 stills) | none | ~1.5 min |

**Per episode (estimate, 100-120 s, about 10 windows):**
- **Tokens:** A-G in the main session, about 40-70k per window, so about 400-700k for an episode done this way. The independent checks: one muted/fact agent per episode, about 85k first, then about 5-10k per window, so about 130-180k.
- **Render:**
  - two passes of stills per window, about 2-4 h;
  - one motion clip per window: about 34 min per 12 s on the heaviest set, and lighter sets are faster;
  - one full render, about 6 h (12 §9).

**The saving:** "passing shots keep their keys". Only the three failing shots were rebuilt after each check, and the reused library cards mean the next episode starts from INDEX lines instead of rediscovering techniques.

## Decisions for Marcus

1. Approve the Story Director stage (`system/13`) as the step between an approved script and the shot list.
2. **Blind, how?** Keep the cloth band (accurate enough, but it reads as "blindfolded"), or draw dark, shadowed eyes (a rig change that affects every blind shot in Ep 1).
3. Put the new pillars sequence into Ep 1? That means re-rendering S19-S20 (about 1.3 h) and rebuilding the song's hits. Separately: v57's S19 has four picture-accuracy problems (gold, hush, early sand, the idol), whether or not the new version goes in.
