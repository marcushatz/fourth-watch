# PP2: the Ep 1 cast (lintel/people2.js)

Flat 2D characters drawn on canvas in the exact style of `PP.samson`, `PP.soldier` and `PP.judean` in lintel/people.js (read it first): dark warm outline, flat fills, one shade tone on the side away from the light (the light comes from the upper left), mitten-like hands, simple dot/almond eyes with a highlight, the same proportions and line weight. Every drawer draws with the FEET at the canvas origin (0, 0), y up is negative, in the same design units as PP.samson (PP.samson is drawn after `ctx.translate(650, 1580); ctx.scale(2.5, 2.5)` on a 1300x1640 canvas for a 1.86 m-tall man; use the same unit scale for everyone so heights are consistent: a woman ~0.93 of Samson's height, the boy ~0.75).

All drawers are pure functions of their state object (no randomness; derive any variation from the state). Export on `globalThis.PP2`.

## Samson (one function, all poses): `PP2.samson(ctx, st)`
Must look like PP.samson (same face, beard, blue tunic with the patterned hem, brown belt, sandals, long dark braided hair) so he reads as the same man across the reel.
- `st.pose`: 'stand' | 'walk' | 'carry' | 'point' | 'lean' | 'sleep' | 'wake' | 'strain' | 'burst' | 'grind' | 'lookup' | 'pray' | 'push'
  - 'carry': both arms raised to shoulder height, hands gripping a load resting across his shoulders (the 3D gate doors sit on top; leave the load itself out), slight forward lean, walking legs (use st.phase).
  - 'point': right arm pointing to screen right, chin up, eager.
  - 'lean': leaning in to whisper (to screen right).
  - 'sleep': lying on his side, head to screen right resting on a lap (the lap is Delilah's, drawn separately), eyes closed. Drawn horizontally: feet at the left, origin at the middle of the body's underside.
  - 'wake': standing, shoulders rolling back, fists loose, confident half-smile.
  - 'strain' / 'burst': as in PP.samson (bonds tight / arms flung up, free). Accept st.bonds: 'rope' | 'bowstring' | 'loom' | 'none' (what is wrapped round him while he strains: ropes, or bowstrings, or his hair woven into a loom web behind his head) and st.brk 0..1 (how far the bonds have snapped away).
  - 'grind': blind prisoner pushing a millstone bar to screen right, bent forward.
  - 'lookup': blind, face lifted up toward the upper left.
  - 'pray': blind, standing between pillars, hands raised to shoulder height palms out (resting on the pillars), face up.
  - 'push': as 'pray' but leaning forward, arms braced, every muscle working, head bowed (16:30 "he bowed with all his strength").
- `st.hair`: 0..1. 1 = his full long braids (seven locks); 0 = shaved to the scalp (a slightly lighter scalp tone); 0.1–0.3 = short growth (16:22).
- `st.blind`: true = eyes closed, a strip of dark cloth across the eyes; NO wounds, NO blood.
- `st.shackles`: true = bronze shackles on the wrists with a short chain (16:21).
- `st.look`: [x, y] gaze direction (-1..1). `st.phase`: walk cycle phase (radians). `st.gold`: 0..1 warm rim light on his left edge.

## The others
- `PP2.delilah(ctx, st)`: Philistine woman of the Valley of Sorek: elegant, dark hair with a band, earrings, a rich red-and-cream dress (Philistine colours, see PP.soldier's kilts), bracelets. Poses: 'stand', 'turn' (looking over her shoulder at camera), 'call' (one hand cupped to her mouth, calling to screen left), 'sit' (seated on a low couch, knees forward: Samson's head rests on her lap; expose st.lapX/lapY in a comment: where his head goes relative to her origin), 'beckon' (one hand raised to someone off screen right). Never sexualised.
- `PP2.bride(ctx, st)`: the young Philistine woman of Timnah, simpler dress, carrying a water jar on her shoulder ('jar') or standing ('stand').
- `PP2.manoah(ctx, st)` and `PP2.mother(ctx, st)`: Samson's parents, older Israelites in earth-tone robes (manoah: grey beard, head cloth; mother: head covering). Poses: 'stand', 'object' (both hands raised, palms out, shaking head: st.shake -1..1), 'awe' (mother only: kneeling, hands to face, looking up at the angel), 'worried'.
- `PP2.angel(ctx, st)`: the angel of the LORD: a tall figure in white and pale gold robes, face calm and simple (no wings), drawn bright with a soft gold aura (st.glow 0..1 scales the aura and a light bloom). Pose 'stand' or 'speak' (one hand raised in blessing).
- `PP2.lion(ctx, st)`: a young lion, same flat style with outline, tawny with a darker mane. Poses: 'leap' (mid-air toward screen left, claws out, mouth open, roaring), 'thrown' (upside down, flung away, limp: not bloody), 'crouch'.
- `PP2.barber(ctx, st)`: a Philistine man kneeling with a razor ('shave'; st.k 0..1 for the arm stroke).
- `PP2.lord(ctx, st)`: a Philistine lord: feathered headdress like PP.soldier, fine robes, gold collar. Poses 'stand', 'laugh' (head back, pointing at Samson), 'fall' (arms thrown up, toppling back: no gore).
- `PP2.boy(ctx, st)`: the young man who led Samson by the hand (16:26), simple tunic, pose 'lead' (one arm reaching back to screen left).
- `PP2.person(ctx, st)`: generic people for crowds (the Matthew 7 crowd at the door; the Philistines in Dagon's house; Timnah townsfolk). `st.v` (0..11) picks robe colours, skin tone, head cloth / hair, beard; `st.pose`: 'stand' | 'raise' (both hands raised, pleading) | 'hold' (holding up an object in one hand: st.item 'scroll' | 'chains' | 'staff') | 'kneel' | 'cheer' (Philistine crowd, arms up) | 'fall'.
- `PP2.soldierFall(ctx, st)`: optional: a Philistine soldier toppling (or reuse PP.soldier with bb.userData.tilt).

Also export suggested billboard sizes (`PP2.SIZES = { samson: {cw, ch, worldH, footPx, scale}, ... }`) so scene authors can create each billboard the same way.
