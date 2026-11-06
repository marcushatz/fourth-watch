# Fourth Watch visual style exploration

Marcus's brief of Nov 6, 2026: find out what Fourth Watch should look like, using real visual evidence and free tools only. This folder is separate from the production project. It doesn't change the approved script or the storyboard.

**Rules for this work:** stills only, no video, no credits, no paid tools and no subagents. The production lock stays on. The final choice belongs to Marcus.

## What's here

| Path | What it is |
|---|---|
| `gallery/index.html` | The review gallery, also published as a private artifact |
| `frames/stage_a/` | Shot 26 in every viable style |
| `frames/stage_b/` | Shots 13 and 2 for the eight finalists |
| `frames/stage_c/` | Refined frames for four styles |
| `reports/research_visual_storytelling.md` | Creators, techniques and evidence |
| `reports/style_assessment.md` | Feasibility, ranking, next tests and open questions |
| `src/` | Everything needed to rebuild the frames |

The rendered frames are ignored by git. They live in the published gallery, and `src/` can rebuild them.

## How the frames are made

1. `src/cast.py` poses adult figures on the CC0 MakeHuman base mesh, with grown hair.
2. `src/scene_s02.py`, `scene_s13.py`, `scene_s26.py` and `scene_variants.py` build each shot and render stills in Blender Cycles, with extra passes for light, depth and surface direction.
3. `src/styles.py` and `src/styles2.py` turn those passes into each style.
4. `src/build_gallery.py` assembles the gallery from `src/catalog.py`.

Scripts expect a virtual environment with `bpy`, `numpy`, `scipy`, `scikit-image`, `opencv-python-headless`, `openexr` and `fonttools`, and a MakeHuman checkout at `/home/claude/fw-tools/mh`.

## Sources of assets

- MakeHuman base mesh, rig and shape targets: CC0, from `makehumancommunity/makehuman` on GitHub.
- Fonts from Fontsource: Cinzel and Cormorant Garamond (SIL Open Font License) and Special Elite (Apache 2.0).
- Every frame was rendered here. No other creator's frames are stored, and references in the gallery are links only.
