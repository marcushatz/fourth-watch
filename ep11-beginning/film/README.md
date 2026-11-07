# Genesis episode film (ep11): the paper-cut animation build

The whole episode is drawn and animated in code, free, from the recovered Cut Paper system
(`style_test/build_cut_paper_v2.py` and the 34-shot `build_storyboard_v2.py`). No paid generation.

## Run it

```bash
cd ep11-beginning
/usr/bin/python3 film/voice.py                                   # TEMP narration (Kokoro am_michael) + timing.json
/home/claude/fw-tools/venv/bin/python3 film/render.py --jobs 2   # 34 shot clips -> film/out/clips/
/usr/bin/python3 film/sound.py                                   # score + effects + mix -> film/out/mix.wav
/home/claude/fw-tools/venv/bin/python3 film/assemble.py          # -> film/out/genesis_first_cut.mp4
```

Useful while working:
- `render.py --only S13 --still .5` writes one frame of a shot to `film/out/stills/`.
- `sheet.py out.jpg S01 S02 ...` makes a contact sheet of stills.
- `assemble.py --frames 240,600` writes finished frames (with type) to `film/out/check/`.

## Files

| File | What it is |
|---|---|
| `paper.py` | The paper engine: design space 720 x 1280 rendered at any scale; one key light, drop shadows, rim and shade, paper textures, haze, gold. Stages keep depth layers so the camera can move them with parallax. |
| `rig.py` | The puppets: Adam, Eve and "you", jointed paper figures with poses, blends, breathing, a walk cycle, blinks, and garments (Eve's long hair before the fall, fig leaves after Genesis 3:7, garments of skins after Genesis 3:21, modern clothes for "you"). |
| `scenes.py` | Shared sets and props: space, the hill, Eden, olive-like trees, hedges, the night forest, the dry land, the Earth, big paper hands, the fruit, fig leaves, stars, motes. |
| `shots1.py`, `shots2.py`, `shots3.py` | The 34 shots. Each builds its stage once, then answers `frame(t)` with the camera, the moving sheets and the figures for that moment, cued to the words. |
| `core.py` | Word cues, camera moves, and the per-frame compositor. |
| `text.py`, `edit.py` | Captions, verse cards, tags, "Where are you?", the end card; the transitions and card timings. |
| `voice.py`, `sound.py` | The temporary narration and the synthesized score and effects. |
| `assemble.py` | Cuts the clips together with transitions, type and the mix. |

## Swapping in the real narration

Replace `film/out/voice_temp.wav` with the approved take and rewrite `timing.json` from its word timings
(same format: per shot `start`, `end`, `voice_end`, and each word's `start` and `end`). Every animation cue is
tied to words, so re-rendering re-times the whole film to the new take.
