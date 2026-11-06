# Fourth Watch stickman style exploration

Marcus's brief of Nov 6, 2026: ten mature stickman looks, each drawn for the same three Genesis scenes, so he can choose a direction from real pictures. This folder is separate from the production project. It doesn't touch the approved script or the storyboard.

**Rules for this work:** static frames only, free tools only, no video, no credits, no paid calls and no subagents. The production lock stays on. The choice of direction belongs to Marcus.

## The three scenes

- **A, Awe:** one figure under an enormous night sky.
- **B, Tension:** Eve offers the fruit and Adam hesitates.
- **C, Fear:** Adam hides in a dark forest, bowed, with a hint of warm light far off.

All ten styles share one set of poses and the same framing (`src/poses.py`), so the differences come from how each picture is made.

## What's here

| Path | What it is |
|---|---|
| `gallery/index.html` | Gallery template; `src/build_gallery.py` fills it and makes web copies of the frames |
| `frames/<style>/a.jpg, b.jpg, c.jpg` | The 30 frames, 1080 by 1920 (ignored by git, kept in the published gallery) |
| `reports/assessment.md` | Strongest candidates, animation feasibility and limits |
| `src/` | Everything needed to rebuild the frames |

## How each style is made

| Style | Source | Method |
|---|---|---|
| 01 Dark Cinematic | `stick3d.py`, `style_render_post.py` | Blender Cycles scene, depth haze and grade |
| 02 Premium Vector | `vector_styles.py`, `svg2jpg.js` | Hand-coded SVG rendered in Chromium |
| 03 Hand-Drawn Ink | `style_ink.py` | Bristle-by-bristle brush engine on simulated rice paper |
| 04 2.5D Atmospheric | `style_layers.py` | Separate painted planes with haze between; `--layers` writes each plane as a PNG |
| 05 Minimalist Silhouette | `style_silhouette.py` | Flat black shapes, fractal trees, gradient skies |
| 06 Neon Noir | `style_neon.py` | Light buffers, layered glow, mirrored wet floor |
| 07 Geometric Editorial | `vector_styles.py` | SVG posters from bars, discs and wedges |
| 08 Painterly | `style_paint.py` | Flat-brush stroke painter with paint relief |
| 09 Monochrome Film | `stick3d.py`, `style_render_post.py` | Blender Cycles hard light, black-and-white film finish |
| 10 Stylized 3D | `stick3d.py`, `style_render_post.py` | Blender Cycles miniature world with porcelain figures |

Run the Python scripts from the fw-tools virtual environment (`bpy`, `numpy`, `scipy`, `opencv-python-headless`, `openexr`). The 3D styles render with `python stick3d.py <dark|film|cg> <a|b|c> [samples] [width]` and finish with `python style_render_post.py dark:a`. The SVG styles need Node with Playwright.

## Sources

Every frame was drawn or rendered here with free tools. No other creator's frames are stored, and no assets were downloaded for these frames. The 3D styles reuse helper code from `visual_style_exploration/src`.
