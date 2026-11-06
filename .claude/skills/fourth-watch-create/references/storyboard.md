# The storyboard

The storyboard is where a video is won or lost. Every decision is made here, cheaply, before any animation exists. Marcus sees it and tweaks it.

It starts from the creative plan in the story skill. Each row of that plan becomes one or more shots here.

## The file

`<episode>/storyboard.json` has this shape. `templates/storyboard_example.json` is a working example.

```json
{
  "title": "Episode title",
  "message": "The one-sentence message",
  "timing": "estimated",
  "last_word_end": 0,
  "shots": []
}
```

Set `timing` to `estimated` before the voice exists, and `real` after it. `last_word_end` is when the narration ends.

Optional fields: `name` is the page's short title, `sections` maps each section name to one line about its job, and each shot can carry a `section` and a `tone` (`night`, `dusk`, `day`, `cold`, `chalk` or `gold`). The page uses these for its groups and its strip of light across the film.

## One row per shot

| Field | Meaning |
|---|---|
| `id` | A short name, such as `S01` |
| `start`, `end` | Seconds from the start of the video |
| `words` | The exact narration over this shot |
| `picture` | What's on screen, in plain words |
| `feel` | What the viewer feels here |
| `understand` | What the viewer learns or realizes |
| `size` | `extreme-wide`, `wide`, `medium`, `close`, `extreme-close` or `insert` |
| `angle` | `eye`, `low`, `high`, `top` or `over-shoulder` |
| `move` | `locked`, `push`, `pull`, `pan`, `tilt`, `track` or `crane` |
| `move_percent` | How far the camera travels, as a percent |
| `move_job` | Needed at 15% or more: `hook-reveal`, `travel`, `follow`, `reveal` or `carry` |
| `why` | The story reason for this framing and move |
| `acting` | What each person does, and on which word |
| `beats` | Seconds when something visibly changes, such as `[1.2, 3.1]` |
| `text` | Text on screen, one element at a time. When the narrator names a passage, this is the exact ESV verse and its reference, timed to that line and held long enough to read (Round 58) |
| `fidelity` | `TEXT`, `INFERRED`, `INTERPRETATION`, `HISTORICAL` or `VISUAL_SYMBOL` |
| `route` | How the shot gets made: `code`, `still`, `ai-clip` or `reused` |
| `credits` | Estimated cost of new paid work, or `0` |
| `callback` | `true` if this shot rhymes with the opening |

## How to build it

1. **Split the narration into clauses.** Every spoken clause gets a picture of it happening, on its word.
2. **Find the governing image.** Pick one object or shape that carries the idea, and plan how it changes.
3. **Plan the opening and the ending together.** The final image is the answer as a picture, and it calls back the hook.
4. **Place the turn.** It gets the longest hold, with something changing inside it.
5. **Fill in reads.** Say where the eye lands in each shot, using `directing.md`.
6. **Vary the frame.** Don't cut between two shots of the same size and angle.
7. **Choose routes last.** Start with `code`, and use paid routes only where they make a real difference.

## Estimated timing

Before the voice exists, assume 2.7 words per second, and add a short pause at each sentence end. Once the take exists, replace every time with the real word timings and run the check again.

## Pictures

Marcus should see the film, not placeholder figures. Draw every shot with `scripts/sketch.py`, saved as `frames/<id>.svg`. It's free and needs no lock lifted. Keep the sketches rough, so they plan the shot without setting the look. `ep11-beginning/build_storyboard.py` is a working example.

If a shot has no frame, the page falls back to a rough sketch of its size and angle. Real frames can come from two places:

- `higgsedit frame`, which costs no credits but needs the lock lifted. Save each frame as `frames/<id>.png` beside `storyboard.json`.
- A generated still, which costs credits and needs approval.

Use a few real frames for key moments rather than paying for all of them.

## The check

`scripts/check_storyboard.py` confirms what can be measured:

- The words match the script exactly.
- Shots run in order with no gaps, and nothing is under 1 second.
- Something changes about every 2 seconds, with no dead stretch over 7.5 seconds.
- Big camera moves have a job, and neighboring shots differ in size or angle.
- The ending lands soon after the last word and calls back the opening.
- Every row is filled in.

Passing doesn't make it good. Read it as a viewer would, and ask whether you'd stay.
