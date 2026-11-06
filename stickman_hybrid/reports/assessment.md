# Hybrid stickman study: assessment

Nine frames: three versions of the coloured hand-drawn stickman look, each in the Awe, Tension and Fear scenes. These are my judgments from the pictures, not audience evidence. The choice is Marcus's.

## Which version balances it best

**B, Editorial Elegant, is the best balance of beauty, maturity and production feasibility.**
- Its characters read most clearly: at phone size you can see the faces, the hands, and the gap between Adam's fingers and the fruit.
- It's the calmest and most adult of the three.
- Flat fills and a clean line stay stable from frame to frame, so it's the easiest to keep steady in motion.
- Its risk is sliding toward a generic explainer look. The canopy in scene 2 already leans that way, so it needs firm art direction.

**A, Painterly Cinematic, is the most emotional.**
- The tension and fear frames have the strongest mood.
- The dark hides the faces in places.
- Brush texture is the hardest thing to hold still in motion.

**C, Atmospheric Storybook, is the warmest and richest.**
- It has the most depth and visual poetry.
- It's also the one most likely to read as a children's book. The galaxy colours and the flowers need restraint.
- It's the most work per shot.

**A combination worth testing:** B's figures and line inside A's lighting and haze, for B's clarity with A's mood. It wasn't built for this page.

## Measured here

| Version | Seconds per frame | With layer export | Planes per frame |
|---|---|---|---|
| A, Painterly Cinematic | 2.3 / 4.8 / 3.3 | 4.1 / 7.2 / 4.6 | 8 / 13 / 9 |
| B, Editorial Elegant | 1.8 / 3.7 / 2.5 | 2.7 / 4.9 / 3.4 | 7 / 12 / 9 |
| C, Atmospheric Storybook | 2.6 / 5.8 / 3.6 | 6.0 / 9.4 / 6.6 | 9 / 15 / 9 |

Times are Awe / Tension / Fear on this machine, at 1080 by 1920.

## Animating it in code

- **A:** paint each world once per shot. Redraw only the figure each frame with fixed brush seeds, and move the camera across the planes.
- **B:** ease poses between keys and move the planes for depth. The flat fills don't shimmer.
- **C:** workable, but motes, flowers and mist would each need their own layers to stay steady.

## Honest limits

- The figures are still simple tube limbs. Hands and faces are much better than in the earlier exploration, but they aren't a master draughtsman's.
- Foliage is the weakest part of every version, especially the B canopy. The A canopy edges look like scales.
- The fig-leaf girdle in scene 3 reads more like a green garland than leaves sewn together.
- The C galaxy still looks a little like clouds.
- The haze and light between planes are baked into the finished frame, not saved as their own layers.
- Nothing has moved yet. Flicker, line crawl and how the cast holds up in motion are untested. A motion test needs his go-ahead, because the production lock covers rendering video.
