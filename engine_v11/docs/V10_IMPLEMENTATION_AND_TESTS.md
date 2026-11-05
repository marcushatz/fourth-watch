# Fourth Watch v10 — what actually works and what does not

**Date:** 2026-11-04 · **Release status:** NOT APPROVED. This package is an executable, local, non-commercial research / previs system. It is not a creator-approved finished episode. No tool spends money, posts content, or modifies the existing GitHub repository.

## Concrete source and evidence

- **Working native VTK 3D layout renderer:** `scripts/vtk_story_renderer.py`. It renders the **12-shot, 48-second storm** plan as 3D geometry with an animated ocean, boat, poseable figures, moving camera, rescue contact, and shot-specific image/text overlays. It is **storm-specific**; do not call it a universal film generator.
- **Independent data-driven 3D scene renderer:** `scripts/generic_3d_scene.py` reads JSON actors, camera cuts, keyframes, environments, props and story-source metadata. Both **Naaman / 2 Kings 5:10-14** and a **symbolic Psalm 23** example render from scene JSON **without changing engine code**. Their very basic visuals are development proofs, not production art.
- **Verified source binding:** Each storm video render writes `video.mp4.build.json` containing SHA-256 of the exact video, source renderer and canonical scene plan. `preview_3d_pipeline.py` refuses to reuse a stale or tampered render. A prior unchecked workprint was rejected by design.
- **Actual encoded-video evidence:** `10_shot_frame_evidence.json` contains the SHA-256 of a decoded frame from each of the 12 shot intervals. This verifies the filmed intervals exist. It does **not** validate what the frames mean or whether actions read without context.
- **One command for local review:** `scripts/preview_3d_pipeline.py` runs render + synthetic environment sound + mux + `ffprobe`/OpenCV QA + contact sheet + HTML review + per-shot evidence + hash checks + release preflight. The review page includes the video, the plan, source claims, and approval gates.
- **Reused earlier v4 components:** 22-case research index and curated findings; production skill; episode state machine; shotplan contract; word-alignment checker; synthetic audio experiment; frame QA; source-claim ledger; legacy handoff blueprint; rights/disclosure checklist.

## v10 additions — verified against actual rendered frames

- **Constraint-aware rescue:** the first frame of hand contact was previously correct while the held reach stretched during the lift. The grip now moves vertically by a restrained 20 cm as Peter recovers; both bodies remain in place, hands remain coincident, and Peter emerges from water instead of floating. The rig remains schematic and uses midpoint elbows, not full IK.
- **Full-action tests:** actual off-screen rendered VTK frames at six intervals verify two hand positions coincide with reach under .94 m; a second test verifies Peter's feet progress from immersion to realistic surface height without floating; a shifted beat verifies contact isn't hardcoded to one global frame.
- **Continuous shoreline:** fixed a mesh/water collision that generated visible jagged shoreline and isolated fragments. A strictly triangular, parametrically generated continuous coast is above the wave-height envelope. A geometry regression checks all triangles and the minimum terrain height.
- **Current clean test suite:** 73 tests discovered; **72 passed, 1 skipped**. The skipped test depends on an unavailable, prebuilt full-resolution final movie. Source-bound media QA on a fresh 48-second 360×640/12fps workprint passes; stillness warning remains at 8 samples. Release preflight remains intentionally blocked.
- **Evidence artifacts:** `outputs/v10/verified_3d_review/` includes the actual video and matched SHA256 source/build receipts, media QC report, shot contact, director page, and unprimed viewer page. The package itself is independently hash-checked.

The target film is **not ready to publish**: no approved final biblical script, narrator, cinematic character model, original film-grade acting, final mix, platform review, or native Three.js integration. No external credits were spent.

## Storm camera / staging defects fixed in v10

| Original defect | Current change | Verification | Still unverified |
|---|---|---|---|
| Shore overwhelmed boat/Jesus | High/wide shoreline geography and safe positioning | VTK projected head/boat tests | Whether the first-time viewer grasps the distance instantly |
| Water-walking subject tiny | Independent hero-perspective camera and a boat foreground anchor | Real frames + portrait-framing test | Acting, atmosphere, interaction with water |
| Peter's foot moved **into** boat | Correct near-gunwale direction; independent foot target and contact ripple | World-path and shifted-cue regression tests | Natural human gait, believable surface tension |
| Rescue people and hand off-frame | Wider two-person composition; one named absolute contact target | Rendered-frame and geometry-contact checks | Whether the rescue feels urgent rather than robotic |
| Boat-entry **teleported** without an edit | Declared entry-beat editorial cut to an inside-boat composition | Camera-change-on-cue regression | A fully choreographed boarding transition |
| Moon cropped into unrelated close-ups | Moon actor hidden outside establishing compositions | Visibility regression | Final art direction |
| Final section nearly still | Motivated close-up on loaves and a pull back to boat | Encoded-video QA: near-still **19 → 8 of 96** half-second samples | Whether the thematic payoff is substantial |

## Independent tests and metrics

From `python -m unittest discover -s tests -q`:

- **72 passing**, **1 skipped**. The skipped test requires a separate prebuilt local release-resolution movie and is not reported as passed.
- 3D tests render real VTK frames and examine normalized on-screen projections, foot motion, on-beat hand contact, scene reproducibility and intentional camera cuts. Generic renderer tests also exercise two independent JSON configurations.
- The final source-bound storm review is **48 seconds, 360×640, 12 fps**, with **12 timed shots** and **24 logged planning beats**. Not every logged beat is independently certified to have an effective artistic change.
- `qa_video.py`: *technical decode pass*, no near-black sampled frames, **8 near-static half-second samples**, release dimensions too low. Source of truth is the included `04_media_qa.json`.
- Release audit stays **BLOCKED**, because the script, treatment, and animatic are not approved, visual stages are placeholders, no locked script hash or final asset manifest exists, and no 1080×1920 final film was produced. The included audio is **synthetic sound design only**—no approved narration or licensed music.

## Reproduce locally (Python 3, VTK, numpy, OpenCV, Pillow, PyYAML, ffmpeg/ffprobe)

```bash
# All tests
python -m unittest discover -s tests -q

# Full 3D shotplan → preview → sound → media QA → review page
python scripts/preview_3d_pipeline.py examples/pilot-storm/shotplan.yaml \
  --claims examples/pilot-storm/claims.csv --out outputs/my_verified_review

# Two unrelated story studies using one generic 3D renderer
python scripts/generic_3d_scene.py examples/generic-3d/naaman.json \
  --out outputs/naaman_3d.mp4
python scripts/generic_3d_scene.py examples/generic-3d/psalm23.json \
  --out outputs/psalm23_3d.mp4

# Correct result is nonzero: release is blocked
python scripts/release_gate.py examples/pilot-storm/shotplan.yaml \
  --claims examples/pilot-storm/claims.csv \
  --video outputs/my_verified_review/03_3d_camera_sound_review.mp4
```

Existing workprints may only be reused with their matching `.mp4.build.json`. The pipeline checks these before accepting a cached render.

## Important architecture distinction

The existing Fourth Watch GitHub renderer is **Three.js + browser canvas** and expects `SCENES[name].frame(t, shot, cam)` and voice-word cues (`film27`). The new VTK renderer is a **separate local 3D previs renderer**. The legacy handoff remains a blueprint. The scripts have not been proven to create production-ready native scene files inside the original Three.js pipeline. To claim native production integration, a real shot must be ported and rendered by that engine and compared to the VTK plan without losing word timing or provenance.

Canonical story coordinates `(x, forward_depth, height)` must convert to current renderer coordinates `(x, height, -forward_depth)` with `scripts/coordinate_contract.py`. This avoids a class of silent blocking errors.

## Priority defects for the next development round

1. **Character acting:** simple cone/limb figures and minimal articulations still cannot express fatigue, danger, fear, or relief to an exceptional standard. Test stronger silhouettes, constraint-aware elbows/knees, and action/reaction timing on the actual motion clip.
2. **Script and theological payoff:** neither Mark 6:52 nor Jesus' timing is given a verified, creator-approved final interpretation. No voice is locked; do not produce a definitive theological explanation just to fill a story beat.
3. **True Three.js integration:** port one tested water/boat/character scene and render the actual `film27` contract. Do not announce completion from a mocked interface.
4. **Real word-aligned narrator and professional sound:** after the script is approved, obtain an authorized voice, verify word timing, then rebuild the audio and caption timeline from those exact timings.
5. **Human review / actual publishing:** use independent first-time viewers and visual phone-size tests. Never convert synthetic agent scores or 3D geometry tests into claims of creative success or expected views.

**Design rule:** the engine must make it harder to ship an error, not easier to declare an unfinished film perfect.

## User-review and source-integrity additions

- `06_director_review.html` embeds the source-bound workprint, timed shot descriptions, source claims, and a **local-only** feedback export.
- `11_unprimed_visual_review.html` embeds the same video **without** revealing the story, biblical passages or timeline in visible text, so a new viewer can describe what the images communicate without priming. Its feedback is downloaded as anonymous JSON, never uploaded. Since this workprint has no narration, the survey measures **visual comprehension only**.
- Both review pages were checked with `node --check` on their actual generated JavaScript. Their ability to predict audience retention is **not** established.
- The clean build package also includes two independently configured, rendered generic 3D studies with source/context notes. They are not part of the planned storm debut.
