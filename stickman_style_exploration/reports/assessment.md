# Stickman style assessment

Prepared Nov 6, 2026. The gallery holds the frames. This note records the reasoning. The choice of direction belongs to Marcus, and nothing here is audience evidence.

## Strongest candidates

1. **Hand-Drawn Ink.** The most distinctive and the most adult of the ten. It reads at phone size, its restraint suits Scripture, and a frame takes seconds. The risk is that a simulated brush could look mechanical once it moves.
2. **Dark Cinematic.** The closest to film: real light in real space, figures found by a single edge of light. The cost is render time.
3. **Monochrome Film.** Scene B holds the strongest single idea in the study: the offer happens twice, small in front and huge in shadow on the rock. Black and white would also give the brand's gold one job, as the only colour where the text says God acted. That pairing isn't tested.
4. **2.5D Atmospheric.** The best balance of beauty and practicality. The layers are built for slow camera moves, and only the figure changes from frame to frame.

## Animation with Claude Code

| Group | Styles | Why |
|---|---|---|
| Straightforward | Premium Vector, Geometric Editorial, Minimalist Silhouette, Neon Noir | Every shape is a number. A frame renders in about a second, and poses ease between key positions. |
| Realistic with care | Hand-Drawn Ink, 2.5D Atmospheric, Painterly | Paint the world once per shot, redraw only the figure with fixed brush seeds, and move the camera through layers. |
| Not practical on this machine | Dark Cinematic, Monochrome Film, Stylized 3D | They pose easily, but a frame takes 1 to 4 minutes here. A 132-second film at 24 frames a second is about 3,200 frames, several days of rendering. A graphics card, or held shots with camera moves, would change that. |

## Measured frame times on this two-core machine

| Style | Time per 1080 by 1920 frame |
|---|---|
| Premium Vector, Geometric Editorial | under 1 s |
| Minimalist Silhouette, Neon Noir | about 1 s |
| 2.5D Atmospheric | about 2 to 4 s |
| Hand-Drawn Ink | about 3 s |
| Painterly | about 7 s |
| Dark Cinematic, Monochrome Film, Stylized 3D | 1 to 4 min (Cycles, 48 samples, denoised) |

## Limits, stated plainly

- **Dark Cinematic:** haze is a depth effect added after rendering, not true light in fog. Noise shows in the darkest areas.
- **Premium Vector:** clean and correct, and the closest of the ten to an explainer video unless it is art-directed with care.
- **Hand-Drawn Ink:** the brush is procedural, so its marks are believable but not a master's. It carries strong sumi-e associations.
- **2.5D Atmospheric:** scene B's foliage was rebuilt leaf by leaf and is better, but foliage remains this style's weakest point.
- **Minimalist Silhouette:** black cut-out figures were turned down in an earlier round. They are included because this brief asks for them. The look is common on other channels.
- **Neon Noir:** the wet-floor reflection is a mirrored copy, not a true reflection. Neon carries modern city associations.
- **Geometric Editorial:** every shot needs its own visual idea, so a full film means a poster design per shot.
- **Painterly:** the swirling skies owe an obvious debt to Van Gogh and can read as pastiche. Repainting every frame would flicker.
- **Monochrome Film:** the low lamp in scene B is a stage device, not natural light. Grain and halation are simulated.
- **Stylized 3D:** simple shapes and materials. The friendliest look, so the most at risk of reading as children's animation.

## Ideas not built

- Ink with a single touch of gold.
- Monochrome film with gold.

Both follow the brand rule that gold marks where God acts.

## Next questions

- Which one or two directions does Marcus want to see in motion? Motion tests need his approval first, because the production lock covers rendering video.
- Do strangers read each finalist as adult or childish? AI opinion can't answer that.
- How do fine lines and dark frames survive Instagram compression on a phone?
