# Style assessment

Prepared Nov 6, 2026. The gallery holds the frames. This report records the reasoning. The final choice belongs to Marcus.

## The main finding

Our earlier art was weak mostly because the drawing was weak. Once frames were built on a real 3D human, with real light, many styles improved at once, cut paper among them. Most styles here share one base, so a better base lifts all of them.

We also learned that style can be chosen after staging. The same posed scene fed 16 treatments in seconds each, so the 34-shot plan isn't tied to one look.

## How to read this

Four questions stay separate, because they have different answers.

| Question | Meaning |
|---|---|
| Artistic ceiling | How beautiful could this style become with great artists? |
| Current execution | How good are our actual frames? |
| Production feasibility | Can our tools make it reliably? |
| Audience evidence | Have related looks worked in comparable formats? |

The words are judgments, not measurements. No percentages or success odds appear here, because nothing supports them.

The full style-by-style table is on the gallery's Judgments tab. Its source is `src/catalog.py`.

## Measured production facts

- One full-quality 1080 by 1920 still took about five minutes on this two-core machine: about four for the main render and about one for the passes.
- A treatment took about 1 to 11 seconds per frame, once those passes existed.
- A 132-second film at 12 frames a second is 1,584 frames, which would take over 100 hours here as full 3D renders.
- About 100 key poses, held and moved in layers, would take about eight hours.

**What that means:** full-frame character animation in 3D isn't practical on this machine. Held poses, depth layers, slow camera moves and short loops are practical, and they suit the restraint of the brand.

## What's built and what isn't

**Built:** adult male and female figures, a pose system with reaching arms and closing hands, grown hair and beards, forest, garden and mountain scenes, a star sky, and 22 treatments.

**Not built:** robes and clothing, crowds, buildings, animals, a serpent, children, and any lip or face animation. Robes matter most, because nearly every other Bible story needs them.

## Reasoned ranking

1. **Bible engraving.** The most distinctive serious look here, rooted in Christian print history. Its risk is whether fine lines hold up in motion and on phones.
2. **Digital painted storybook cinema.** The strongest emotion, and it reads as adult. It's safest as held paintings moved in layers.
3. **Stylized cinematic 3D.** The truest acting and camera, and the most familiar to audiences. Its costs are render time and staying clear of realism.
4. **Editorial ink illustration.** The strongest read at phone size and the cheapest of the four. It may feel more like a poster than a film over two minutes.
5. **Painterly stylized 3D.** Very close to the painted storybook, with more detail and more flicker risk.
6. **Cinematic illustrated 2.5D.** A safe, clear middle path with less identity.
7. **Stylized low-poly 3D.** Fast and striking, and it may feel cold.
8. **Stained glass light.** Unforgettable as a recurring device, and limited for a whole film.

Cut paper stays as the control. Its frames improved, but it now sits behind the styles that have real 3D form, because every new pose has to be redrawn by hand.

## Honest failures

- **Toy-brick miniature:** the first two attempts failed on framing and scale. The third reads clearly, but it looks like a toy, which is the risk we most wanted to avoid.
- **Mature anime:** this is an approximation. Real anime rests on drawing skill that this method doesn't have, so the frame is labelled as a concept.
- **HD-2D and retro pixel:** also labelled as concepts, because a close emotional shot is their weakest case.
- **Atlas:** it can't show a face or hands. It's a storytelling device, not a film style.

## Worth animation testing next

Each of these needs Marcus's approval first, because the production lock covers rendering video.

1. Bible engraving: five seconds of shot 26, to see whether the lines stay calm as he pulls in tighter.
2. Painted storybook: five seconds of shot 26 as one held painting split into depth layers, with a slow push and a small breath.
3. Cinematic 3D: five seconds of shot 13 in limited animation, to judge render time and whether the hands hold up.
4. Editorial ink: five seconds of shot 26, to see whether moving ink edges feel alive or nervous.

## Unresolved

- Do strangers read each finalist as adult or childish? AI opinion can't answer this, and neither can I.
- Do fine engraved lines survive Instagram's compression on a phone?
- Do line styles flicker or crawl in motion? No motion has been tested.
- How far can faces act? The base mesh has expression shapes, but none has been tested on camera.
- How will robes and clothing be built?
- Should one film use one style, or could maps, glass or collage appear as recurring devices inside it?
- Does Marcus's computer have a graphics card that could render faster?
- How should Adam and Eve be framed across the whole film? These frames rely on leaves and hair for modesty.
- Should the ChatGPT comparison still be finished? It remains a useful outside benchmark.
