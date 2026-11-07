# Fourth Watch visual identity prototype

Marcus's brief of Nov 6, 2026 (19:18): show what an actual Fourth Watch episode could look like before anything is spent on animation. It uses the locked Genesis episode and God's question in Genesis 3:9, "Where are you?", across Relate → Reveal → Transform.

**Rules for this work:**
- static frames only, with no video or animation;
- no paid generation and no credits;
- the locked script is unchanged, and the only words used are its exact lines and the exact ESV;
- no collection of unrelated styles: this is one look, built to be repeatable.

**The reference image he attached didn't come through.** Only the brief's text arrived, so this follows his written description.

## The four frames

| Frame | What it shows | How it's made |
|---|---|---|
| `1_relate.jpg` | A young man alone in his bedroom at night, bent over on the edge of the bed, his face in his hands, his phone glowing on the floor | Blender render of the cast and room, then `look.py` |
| `2_reveal.jpg` | Adam and Eve with their backs to a vast trunk at dusk, heads turned toward a small warm light far off between the trees (Genesis 3:8). God isn't shown | Blender render, then `look.py` |
| `3_understand.jpg` | Genesis 3:9 set in type over the garden, with a labelled "Our reading" box kept apart from the verse | `frame3.py` over a garden plate |
| `4_transform.jpg` | The same room, camera and man at first light, sitting upright with the phone in his hands, deciding | Blender render, then `look.py` |
| `sheet.jpg` | The four side by side, frames 2 and 4 with their narration captions, plus a strip of close-ups | `sheet.py` |

The frames are ignored by git. They were sent to Marcus, and the code rebuilds them.

## What's here

| Path | What it is |
|---|---|
| `src/cast_vi.py` | The cast on the CC0 MakeHuman body: the young man in two poses, Adam and Eve, with clothes and fig leaves grown from the body |
| `src/stage_vi.py` | Object ids, materials, props and placing the cast in a scene |
| `src/scene_room.py` | The bedroom, at night and at first light |
| `src/scene_eden.py` | The garden at dusk, with and without the two of them |
| `src/look.py` | The one Fourth Watch look, used on every frame |
| `src/frame3.py` | The Scripture typography for frame 3 |
| `src/sheet.py` | The comparison sheet |
| `src/preview.py` | A quick pose check without Blender |
| `prompts.md` | How to rebuild it, the style block, the character sheets, and image and motion prompts for later paid tests |
| `assessment.md` | Consistency, character quality and animation feasibility |

It reuses the figure and painting tools in `visual_style_exploration/src`.
