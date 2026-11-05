# Templates

Reusable code taken from the Bronze Serpent film. Copy this folder into `<episode>/source/` and work from there.

**Status:** `camera.js` and `motion.js` are tested, and `mix.py` ran on test tones. The `.jsx` files passed a syntax check, but they haven't been built in Higgsedit since being cleaned up. Test them on the first video.

| File | What it does | Change per video? |
|---|---|---|
| `camera.js` | Camera paths, and world points to screen positions | No |
| `motion.js` | Keyframe sampling, verbs on words, shake, reach, caption groups | No |
| `type.jsx` | Word-timed captions and labels | Colours and fonts, once the style is set |
| `cast.jsx` | People locked to the world, with shadows | Lights per scene |
| `fx.jsx` | Dust, flashes, glows, smoke | No |
| `film.jsx` | The starting point for a film | Yes, this becomes the film |
| `mix.py` | Mixes the score and effects under the voice | Gains |
| `storyboard_example.json` | A working storyboard | Example only |

## What the film needs beside these files

- `script_words.json`: the approved script as a list of words.
- `words.json`: one `{"s": start, "e": end}` per word.
- `fonts/`: Cinzel and Cormorant Garamond.
- A plate video, passed as `FW_PLATE`.

## Larger pieces to start from

These are in `ep02-bronze-serpent/source/`. They're tied to that story, so copy and change them.

| File | Use it for |
|---|---|
| `edit/plates.jsx`, `edit/gl/` | Rendering a world and its camera into a plate. `edit/gl/paint.glsl` adds the hand-painted look |
| `edit/film.jsx` | How a whole film fits together, including the lamps, books, split screen and snakes |
| `edit/score.py` | Building a score and effects from word timings |
| `puppet/puppet.js`, `puppet/test.jsx` | A jointed figure that walks, stops and reaches with planted feet |
