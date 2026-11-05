# Fourth Watch v11 — native Three.js migration bridge (UNAPPROVED)

This is an **implementation**, not a promise of a completed native workprint.
The attached v10 VTK renderer is kept and remains the authoritative source for
its existing 48-second layout experiment. The bridge evaluates that *same*
VTK code on **each of the 1,440 source frames**, exports camera/rig/boat/etc.
state, and supplies a genuine `SCENES.storm_native.build(env)` and
`SCENES.storm_native.frame(t, shot, camera)` module for the existing
`ep01-samson/film27/film.js` + `LW.render` Three.js engine.

## Files and provenance
- `../scripts/export_native_three.py`: source-bound, deterministic exporter.
- `storm_track.js`: 30fps evaluated state including positions and source SHA.
- `storm_score.js`: 12 half-open shot intervals from source plan, no voice.
- `storm_native.js`: actual Three.js geometry, camera and character transforms.
- `storm_bridge.html`: non-publishing native film27 test entry point.
- `bridge_manifest.json`: input/output hashes and explicit release block.

## Install into a local checkout of the original repository

The repository is `marcushatz/fourth-watch` (main). **Do not replace its
existing `index.html`, `score.js`, `scenes/diorama.js` or `film.js`.** Copy:

```
<original-repo>/ep01-samson/film27/storm_bridge.html
<original-repo>/ep01-samson/film27/storm_track.js
<original-repo>/ep01-samson/film27/storm_score.js
<original-repo>/ep01-samson/film27/scenes/storm_native.js
```

`storm_bridge.html` uses those paths and calls the **existing** film27 renderer.
It loads only `storm_native`, not the Samson scenes. Run a local HTTP server
from `film27` (`python -m http.server 8765`), open
`http://localhost:8765/storm_bridge.html`, then inspect the page's console
and `window.READY` / `window.renderAt(20.0)`.

The existing `engine/render.js` CLI always assumes `index.html`, so do **not**
claim an automated native MP4 until either a safe `--entry storm_bridge.html`
option or a local test fixture has been implemented and tested. Do not rename
the master `index.html` as a workaround.

## Explicit limits
- Tested locally: v10 Python / VTK frame evaluation, source-binding,
  seam integrity and JavaScript syntax/scene API. **Native WebGL pixels have
  not been rendered or compared**; running a JS-only shim is not proof.
- Boat, sea, figures and shoreline are schematic, redrawn with native meshes;
  lighting, color, shadows and VTK overlays are not pixel-equivalent.
- Figure movements are **frame-sampled** from the verified VTK logic, not
  a reusable actor motion-graph yet. The native implementation does not
  claim improved acting or final cinematic quality.
- There is no approved voice, script, sound mix, asset manifest, licensing
  review, or permission to publish.

## Rebuild and check
```
python scripts/export_native_three.py examples/pilot-storm/shotplan.yaml --out native_three
python -m unittest discover -s tests -q
node --check native_three/storm_native.js
node --check native_three/storm_score.js
```

## Next verification gate
Render the *same* S07 Peter step, S09 rescue, S10 boat entry at 12fps
through the real native `LW.render` path. Compare both outputs as moving
clips, geometry contact, framing and silhouette; record failures. No final
48-second native workprint or release approval until this gate passes.
