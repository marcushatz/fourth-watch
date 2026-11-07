# Reproducing the prototype look

There are two routes. The **free route** is the one that made these four frames: code and Blender, with no credits. The **paid route** gives the same look to an image model so episodes can be made faster. Nothing on the paid route has been run, and every job needs Marcus's approval of that exact job first (`production/GENERATION_APPROVAL.md`).

## 1. The free route (what made the frames)

From the fw-tools virtual environment (`bpy`, `numpy`, `scipy`, `scikit-image`, `opencv-python-headless`, `openexr`, `Pillow`), in `visual_identity/src/`:

```bash
python cast_vi.py man_relate man_transform adam eve    # the cast: posed meshes, hair, clothes, fig leaves
python scene_room.py relate 1080 40                     # frame 1 passes (about 6 minutes on 2 CPU cores)
python scene_eden.py 1080 40                            # frame 2 passes
python scene_room.py transform 1080 40                  # frame 4 passes
python scene_eden.py 1080 28 plate                      # the garden without them, for frame 3
python look.py /home/claude/fw-tools/out/vi_room_relate.exr relate ../frames/1_relate.jpg
python look.py /home/claude/fw-tools/out/vi_eden.exr eden ../frames/2_reveal.jpg
python look.py /home/claude/fw-tools/out/vi_eden_plate.exr plate ../frames/plate.jpg
python frame3.py ../frames/plate.jpg ../frames/3_understand.jpg
python look.py /home/claude/fw-tools/out/vi_room_transform.exr transform ../frames/4_transform.jpg
python sheet.py ../frames ../frames/sheet.jpg ../frames/crops.json
```

**Source assets.** All are free and openly licensed. None are stored in the repo.
- The MakeHuman base mesh, rig, body shapes and expressions are CC0, from `makehumancommunity/makehuman`, checked out at `/home/claude/fw-tools/mh`.
- The fonts are from Fontsource: Cinzel (titles), Cormorant Garamond (Scripture and captions) and Inter (our reading and labels). All three are under the SIL Open Font License.
- Everything else is built in code: hair, clothes, fig leaves, the bedroom, the garden, the skies and the light.

**What to keep the same in every episode:**
- the `look.py` settings;
- the three body presets in `cast_vi.py`;
- the caption treatment;
- the palette in `production/01_brand_and_references.md`.

## 2. The style block (paid route)

Reuse it word for word at the start of every image prompt:

> Cinematic illustrated 2D film still with atmospheric 2.5D depth. Adult characters with real human proportions, simplified and stylized, never cartoonish: calm faces drawn with few features, readable hands, strong silhouettes. Figures are painted in three or four soft bands of light that keep their own colour, with a thin warm-black ink line. Environments are painted with visible brushstrokes that loosen with distance, inside soft depth haze, with clear foreground, middle ground and background. One motivated light leads the eye. Restrained palette: deep night browns and blues, clay, parchment, and lamp gold only where God's presence is meant. A hand-made surface with paper grain. Vertical 9:16. No text, no letters, no logos, no photorealism, no gore, no doors.

## 3. Character sheets

Make one turnaround sheet per character before any scene: front, three-quarter, profile and back, neutral pose, plain background. Pass the matching close-ups from this prototype as references. After that, every scene image references its character's sheet.

- **The young man (modern scenes).** About 22. Slim to average build. Warm light-brown skin. Short, dark, slightly tousled hair with no beard, and a straight brow. A plain charcoal-blue crew-neck sweatshirt, dark trousers, barefoot at home. Quiet and inward, never theatrical.
- **Adam.** An adult man about 30. Lean and strong. Warm brown skin. Dark shoulder-length hair swept back and a full dark beard. A loincloth of overlapping fig leaves (Genesis 3:7). Nothing else.
- **Eve.** An adult woman about 28. Warm brown skin. Long dark hair falling past her shoulders. Fig leaves wrapped at the chest and as a loincloth (Genesis 3:7), always modest.

## 4. The four frames as image prompts

Each prompt starts with the style block. Pass this prototype's frame as a composition reference, and the character sheet as a character reference.

1. **RELATE.** Night in a small bedroom, lit by cool moonlight striped through window blinds behind him. The young man sits on the edge of an unmade bed, bent forward, elbows near his knees, his face in his hands. His phone lies face up on the floor between his feet, its glow the only warm-white light. The window is in the upper third, and the room falls into blue shadow. The empty dark ceiling leaves room for a caption.
2. **REVEAL.** Dusk in a deep garden, the cool of the day. Adam and Eve stand with their backs pressed against the trunk of a vast tree, among knee-high leaves. Both turn their heads toward a small warm light far off between the trees on the left. Adam's eyes are wide and one palm is flat on the bark behind him. Eve's arms are folded tight across her chest. Blue haze lies between the layers of trunks, and broad dark leaves are blurred in the foreground. God is never shown, only the distant light.
3. **UNDERSTAND.** This frame isn't generated. It's set in code (`frame3.py`) over the garden plate, so the exact ESV words are typeset rather than drawn by a model.
4. **TRANSFORM.** The same bedroom and camera as frame 1, at first light: pale warm dawn through the same blinds. The young man sits upright on the same bed edge, shoulders lowered, holding his phone in both hands at his lap and looking down at it, deciding. The screen lights his face softly. He is calm, not smiling. There's possibility, not triumph.

**Candidate model** (untested on this look; price it with Marcus's OK first): GPT Image 2.6 on Higgsfield (`gpt_image_2_6`), which takes reference images and supports 9:16. Its 2.5 version made our Nov 3 style sheets at 2.75 credits per 2k image.

## 5. Motion prompts, for later

Use these only after the storyboard is approved and each job is approved. They are written for start-and-end-frame models such as Kling 3.0 Omni Frames.

1. **RELATE.** Locked camera. He breathes slowly, his shoulders rise once, and his fingers press into his brow. The phone's glow pulses once. Nothing else moves.
2. **REVEAL.** Locked camera with the slightest push in. Adam turns his head a few degrees toward the light, and Eve tightens her folded arms. The leaves in front stir. The distant light grows a little.
3. **UNDERSTAND.** Animated in code. The words appear phrase by phrase on the narration, the gold thread draws upward, and "Our reading" fades in after the verse.
4. **TRANSFORM.** Locked camera. The dawn stripes brighten on the wall. He lifts his head slightly, then looks back at the phone, and his thumb moves to the screen.

## 6. Never

- Never show God. Gold is only for the light of his presence.
- Never put generated text in an image. Scripture is always typeset.
- No photorealism, gore or door imagery.
- Eve and Adam are always modestly covered by fig leaves, and staging and foliage keep it that way.
