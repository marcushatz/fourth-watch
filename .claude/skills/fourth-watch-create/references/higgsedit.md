# Building in Higgsedit

Higgsedit is the video tool inside Higgsfield. You write the film as code, and it renders. Marcus doesn't code anything. The working example is `ep02-bronze-serpent/source/`, a 58.7-second film in about 900 lines.

**The lock blocks all of this.** `sandbox_exec` and `higgsedit` need Marcus's words to lift the lock. Ask before any render, even a free one.

For exact fields, load Higgsfield's `video-editing` workflow with `get_workflow_instructions`, and trust `higgsedit --help` and `types/fable.d.ts` over this page.

## Commands

```bash
higgsedit build film.jsx                               # build the project from the script
higgsedit frame comp 20 --out $PWD/check.png           # one frame at 20 s
higgsedit sheet comp --times 0.5,3,8                   # a contact sheet
higgsedit inspect comp --id NAME --at 1.2              # evaluated values at a time
higgsedit render comp --out $PWD/film.mp4 --workers 4 --bitrate 16M
higgsedit probe media/source.mp4                       # what a file really is
```

`--out` needs an absolute path, or the file lands inside the project folder.

## The script

```jsx
export default async ({ project }) => {
  const p = await project({ dir: "comp", size: "1080x1920", fps: 30, background: "#0B0A0C" });
  const plate = await p.add("plate.mp4");
  p.compose(<frame width={1080} height={1920} layout="none">...</frame>, { at: 0, dur: 58.7 });
};
```

Nodes: `frame`, `text`, `rect`, `path`, `media`, `group`, `sequence`, `adjustment`, and `icon()`.

## The three clocks

- `compose` `at`: seconds on the whole timeline.
- A frame child's `at`: seconds after its parent starts.
- A keyframe's `at`: seconds after its own node starts.

Lifetimes include the start and exclude the end, and a child must fit inside its parent.

## Animation

`animate` is always an array. There are no per-frame callbacks, so anything that follows a path gets sampled into keyframes ahead of time. `templates/fx.jsx` has the `kf` helper.

- Repeated offset tracks add, uniform scales multiply, and other duplicates are refused.
- `effectParam` animates a shader value. `effectIndex` picks the effect.
- Easing can be a name such as `ease-out`, `linear` or `hold`, or `[x1, y1, x2, y2]`.
- Choreography cannot share a channel with raw `animate`.

## The method that worked

1. **World plates.** Render the world and camera once, as a video, using GLSL shaders on a full-frame rect. This is the slow part: a 7 s composite took 87 s after a 9-minute plate.
2. **Composite on top.** People, labels, captions and particles go over the plate in a second project. Changing type or people then takes minutes.
3. **Keep one camera truth.** `templates/camera.js` holds each shot's camera path, and `proj()` turns a world point into a screen position. Plates and people share it, so people stay locked to the ground.
4. **Build from word timings.** Every event reads its time from `words.json`, so a new take retimes the whole film.

Compose camera is simpler for flat layers. It's 2.5D parallax only, with top-level `z` values and at least two keyframes.

## Limits we've hit

- Each background job stops at 15 minutes, which is about 12 s of film, or 6 s in a heavy scene. Split long plates into ranges.
- `sandbox_exec` is temporary. `ep02-bronze-serpent/source/restore.sh` restores the Bronze Serpent project and its media.
- Render plates at final resolution. Bronze Serpent's 720x1280 plates looked soft under sharper type.
- GLSL shaders run as RGBA8 and fail the render if they're invalid. Shaders define `vec4 pixel(vec2 uv)` and return premultiplied colour.
- A composed `media` node has no sound. Mix audio separately and add it after the render.
- No HTML scenes, LUTs or shader adjustment nodes.
- Text uses `color`. Rects use `strokeColor` and `strokeWidth`. Paths use a `stroke` object.
- Paths support `M L H V C Q Z`, with no arcs.

## Saving the result

Before a render, call `media_upload` to reserve the output. Put the render, the check and the `curl -f -X PUT` upload in the same `sandbox_exec` call, then call `media_confirm` after it returns 200. Save the code to the episode's `source/` folder. Heavy media stays in Higgsfield, listed by ID in `episode.json`.
