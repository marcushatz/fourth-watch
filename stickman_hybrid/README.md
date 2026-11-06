# Fourth Watch hybrid stickman study

Marcus's brief of Nov 6, 2026 (17:45): the direction is narrowed to coloured hand-drawn stickman characters inside atmospheric, cinematic 2.5D worlds. This folder refines that one direction three ways, in the same three scenes, so he can choose from real pictures. It is separate from the production project and doesn't touch the approved script or the storyboard.

**Rules for this work:** static images only, free tools only, no video, no Higgsfield, no paid calls and no subagents. The production lock stays on. The script is untouched, and this is not the 34-shot storyboard. The choice of version belongs to Marcus.

## The three versions

- **A, Painterly Cinematic:** soft textured fills, moody low light, a broken brush line. The most emotional.
- **B, Editorial Elegant:** cleaner linework, stepped tones, a crisp ink outline, restrained colour.
- **C, Atmospheric Storybook:** more painted planes, haze and warm light, a soft coloured-pencil line.

## The three scenes

1. **Awe:** Adam alone on a ledge under the night sky.
2. **Tension:** Eve offers the fruit and Adam hesitates. He stands in the tree's shade and only his reaching hand crosses into the light.
3. **Fear:** Adam hides behind a trunk in the dark forest, wearing fig leaves (Genesis 3:7). The only warm light is far off among the trees (Genesis 3:8).

All nine frames share one cast, one set of poses and the same framing, so the differences come from how each version is drawn and lit. Adam is clay-coloured (Genesis 2:7), Eve is dusty rose, and the fruit is the only ember red. Gold appears only in the distant light of scene 3.

## What's here

| Path | What it is |
|---|---|
| `frames/<version>/<scene>.jpg` | The nine frames, 1080 by 1920 (ignored by git, kept in the published page) |
| `frames/<version>/layers/<scene>/*.png` | Each plane of a frame as a transparent PNG, back to front (ignored by git) |
| `gallery/index.html` | The comparison page template; `src/build_gallery.py` fills it |
| `reports/assessment.md` | Which version balances beauty, maturity and feasibility, with measured times and limits |
| `src/cast.py` | The character system: poses, hands, faces, hair, shading and the three line treatments |
| `src/world.py` | The layer stack, haze, foliage, surface treatments and finish |
| `src/scenes.py` | The three scenes in each version |
| `src/test_cast.py` | A quick check of the cast on a plain ground |

## Rebuilding

From the fw-tools virtual environment (`numpy`, `scipy`, `opencv-python-headless`), inside `src/`:

```bash
python scenes.py ABC awe,tension,fear --layers   # the nine frames and their layers
python build_gallery.py <out_dir>                 # web copies of the frames and the page
```

`scenes.py` also reuses `visual_style_exploration/src/npr.py` for noise, blur and colour conversion.

## Sources

Every frame was drawn here in code with free tools. No other creator's frames are stored, and nothing was downloaded for these frames.
