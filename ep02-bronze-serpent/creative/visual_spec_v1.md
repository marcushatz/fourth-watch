# Fourth Watch visual spec v1 (draft, Nov 1, 21:20)

## Audit: what caused the "stickers in a 3D world" look

| Problem | Cause | Art direction or engine? |
|---|---|---|
| **2D characters vs 3D world** | The figures are detailed cel cartoons: thick dark outlines, big heads (~5 heads tall), detailed eyes, lips, brows, beard strands, fold lines and rim highlights. The world was flat-faceted low-poly (per-triangle colour noise) with no lines at all. These are two visual languages. | **Both.** The engine had no line or stepped shading for the world. The detail level of the cast is a design choice. |
| **Stiff, repetitive people** | Few poses; crowds staged in rows; the same raised-arm pose repeated. | Mostly art direction. The pose set is small, but it's cheap to extend. |
| **Props without designed silhouettes** | The calf was capsules; the serpent was a helix of sausage tubes. | **Art direction.** three.js can build any silhouette. The engine only lacked a tapered-tube helper, which is now added. |
| **Arbitrary framing** | Cameras were placed by preset, not composed. The 9:16 horizontal field is narrow (about ±10°). | Art direction. Keyframed camera paths, plus a projection solver in the scratchpad, now exist. |
| **Simplistic backgrounds** | One island of terrain; tents as cones; no far layers. | Mostly art direction, plus two cheap engine pieces: painted ground and far-ridge silhouettes. |
| **Lighting without a focal point** | One sun and a global grade; nothing guides the eye. | **Engine.** There was no focal pool and no falloff. Both are now added. |
| **"Assembled" feel** | All of the above, plus every figure being equally bright, equally sharp and equally detailed. | Mostly art direction. |

## What I changed in the engine (small, opt-in per set: `style: 'paint'`; Samson is unaffected)
1. **Stepped "paint" shading** for the world: three tones (lit, half, shadow) instead of PBR facets, with smooth surfaces. Metal (the bronze serpent, the golden calf) keeps a specular sheen so it reads as metal.
2. **An ink pass in post:** a warm line on every depth break, of constant width. Props, terrain edges and the figures' silhouettes all get the same line.
3. **Painted ground:** smooth, with broad colour patches instead of triangle noise.
4. **A focal key light** (a spot pool on the subject) and a **focal falloff** in post around the subject.
5. **Figures take local light:** fire glow and the focal pool tint them, and a figure can be set to stand in shade.
6. **Character simplification levels** (`PP.simp` 1 to 3, with the line weight tied to them; previews A, B and C below).
7. **Designed props** in `film_src/fw_props2.js`:
   - the serpent on its pole: a tapered body winding up a straight pole, its neck rising in an S, with a wedge head;
   - the young-bull calf;
   - a small desert snake;
   - an altar with horns, a cairn, smooth boulders, scrub, low goat-hair tents;
   - far ridges.
8. **New poses:** `beseech` (kneeling, face and one hand lifted to something high), `bow`, `shield`, `reach`, `tablets`.

## Style rules (proposed; to be locked after you pick a character level)
- **Characters:**
  - **Proportions:** about 6 to 6.5 heads (a smaller head at the simpler levels).
  - **Identity:** carried by silhouette: robe shape and colour, head covering, beard, one prop.
  - **Faces:** dot eyes, no or minimal nose and mouth.
  - **Expression:** through posture, gesture and movement.
  - **Shading:** one shade tone on the side away from the key.
  - **Line:** no interior lines at the simplest level; the silhouette line comes from the same ink pass as the world.
- **Geometry:** simple, smooth, designed silhouettes. Every key object must read at thumbnail size, and nothing is decorative noise.
- **Materials:** flat matte tones in three steps; only metal has a sheen; gold appears only on what God commands or does.
- **Light:**
  - one motivated key from the left;
  - one focal pool on the subject, with the frame falling off around it;
  - God's gold rays from the upper left only where the text has God acting.
- **Depth:** five layers. A foreground silhouette element is darker; the subject is the brightest and sharpest; the mid-ground figures are smaller; the background tents and dunes carry haze; the far ridges are flat painted silhouettes lighter toward their base.
- **Composition:**
  - the top quarter is kept for text (sky or a quiet wall);
  - the subject sits on a third, as the clearest silhouette in the frame, and the largest or brightest element;
  - faces stay small unless the shot is a close-up.
- **Camera:** eye-level to gently elevated three-quarter; depth is stacked vertically; moves are motivated (Lintel's grammar).

## Next
1. You pick A, B or C (or a mix).
2. The same look gets applied to the other two style frames: Moses and the golden calf, and Hezekiah destroying the serpent.
3. Once you approve them, motion.
