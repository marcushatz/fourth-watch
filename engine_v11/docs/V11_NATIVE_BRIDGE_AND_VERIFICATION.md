# Fourth Watch Production Engine v11 — Native Three.js bridge

**Status: implemented and locally checked, native picture proof pending.**
The original v10 VTK renderer and its 48-second 3D layout video are included
and **unchanged**. The bridge does not pretend to have run the original
`film27` browser renderer yet.

## Concrete implementation

- `scripts/vtk_state_bridge.py` derives a scene-state evaluator from the verified
  v10 renderer's single `frame()` method at an exact source hook. The base VTK
  file is **not edited**; action and camera calculations stay shared rather than
  being independently reimplemented.
- `scripts/export_native_three.py` evaluates every frame of the v10 plan at
  30fps, outputs **1,440 synchronized frame states** for the 12 shot intervals,
  and hashes the plan, the original renderer, the state bridge, and output.
- `native_three/storm_native.js` executes those states through the genuine
  native Three.js `SCENES.storm_native.build(env)/frame(t,shot,cam)` contract.
  Its primitives draw bodies, limbs, eyes-off silhouette, stepped boat, shore,
  waves, bread, lighting and camera in Y-up world coordinates, handing the
  result back to native `LW.render`.
- `native_three/storm_score.js` derives original half-open 30fps shot intervals
  and declares an **empty narration**, because no narration is approved.
- `native_three/storm_bridge.html` is a separate test *entry point*, not an
  alternative renderer. It reuses the existing film27 engine from its usual
  native paths. The original `index.html` and Samson score are not replaced.

## Verified by tests in this delivered package

- 84 tests discovered, **83 pass, one skipped** (legacy missing final-resolution
  movie). Includes 11 new native bridge tests.
- Exported frame count 1,440, 48.0 seconds, 12 consecutive intervals.
- Every exported frame's ID matches the source shot.
- Evaluated rig and camera positions are finite; exact overlapping right-hand
  rescue contact holds during the lift; Peter's foot advances toward the
  correct gunwale; the editorial boat-entry camera discontinuity is retained.
- Original v10 source provenance for the original 3D workprint still passes.
- Both native JavaScript sources parse through Node; a syntax check and a
  string-level interface check do **not** certify browser runtime behavior.
- Existing v10 storm workprint included: 48 seconds, 360x640, 12fps,
  8 near-still half-second samples in its recorded QA.

## Not verified / explicit blockers

1. **No native browser screenshot or actual native video is certified.** The
   original historical `film27` runtime exists in the connected repository but
   its complete files and Chromium workload were not available locally for a
   reliable, native end-to-end render from this ZIP alone.
2. Three.js geometry is schematic, not pixel- or light-matched with VTK.
   Rendering both and reviewing the three action shots remains required.
3. Native track playback remains frame-sampled. A generic shot-directed 3D
   animation system, expressive 3D actors and reusable motion rigs remain to be
   engineered after the native proof.
4. No approved script, voice, licensed final sound, character art or publishing
   decision. Release must remain blocked.

## Exact next gate

Install the four listed bridge files into the **real** `ep01-samson/film27`
checkout, then render native stills and short clips from S07, S09, S10. Compare
against v10 VTK footage and repair technical differences before making any claim
of complete native renderer integration. Do not change legacy `film27` files
except by explicit reviewed patch.

See `native_three/README.md` for installation and exact source paths.
