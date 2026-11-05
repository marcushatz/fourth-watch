# Production implementation, cache, resources

The verified repo has a legacy `system/` craft directory and executable `tools/creative/`, `toolkit_page/`, `engine/` pieces. Historical drafts mention more than one renderer (Three.js/Remotion/Higgsedit) and remote sandbox artifacts. **Do not assume assets referenced in a report are in this environment.** Confirm an exact file, API, service and executable before using it.

## Stage artifacts and naming
`episode.yaml` (brief/source/cost approvals), `claims.csv` (facts), `script.md` (approved VO), `shotplan.yaml` (medium/framing/timing), `animatic.mp4` (moving placeholder), `asset_manifest.json` (hashes/licenses/roles), `takes/` and `word_times.json` (voice), `stems/` (audio), `renders/` (segments), `final.mp4` (candidate), `qa/report.json`, `release/` (cover/caption/SRT/credits).

## One authoritative timeline
Use integer frames, e.g. 30 fps. Seconds may be entered only at ingestion; quantize once and store the rounding method. Frame intervals are `[start, end)`; no overlapped shot intervals unless a specifically represented transition compositor layer exists. Voice word timings are linked by ID, not duplicated text.

## Deterministic builds
Every shot hash depends on source script version, shot data, assets, renderer code version, font/image references and timing. Changing only a final caption should not re-render unrelated world plates. Use local snapshots/cached parts but verify hash and job result before joining. Never blindly resume a failed part from a truncated output.

## Cost manifest
Jobs: `kind`, `provider`, `params`, `estimated_credits`, `worst_case_credits`, `user_approved_at`, `approval_scope`, `status`, `output_path`, `sha256`. Reuse existing assets if licensed and adequate. Never claim budget numbers are current without querying the service.

## Render pipeline options
- Native Higgsedit: use existing documented connection capabilities only after checking access; don't invent commands.
- Remotion: excellent for deterministic 2D, text, timelines and diagrams; use `Composition`, `Sequence`, `interpolate`, `spring` according to current docs; does not magically supply high-end character acting.
- 3D/low-poly: useful for sea, boat, shadows, scale and camera travel but demands rig and spatial QA.
- Hybrid compositor: safe default only when media changes are conceptually motivated.

## Use the included tools
`fw_engine.py` validates the *planning contract*, `animatic.py` produces a simple visual timing reference, `qa_video.py` samples the delivered video for technical issues. None replaces existing full production renderer or a human director.

## Reusable scene prototype (new candidate)

`scripts/scene_player.py` reads `examples/pilot-storm/reusable_scene.json`. It interpolates camera x/y/zoom and actor positions; the resulting clip demonstrates why actors and camera state should be **data**, not one-off code per scene. New stories require a scene graph and rigs rather than 300–800 lines of bespoke scene code. This prototype intentionally supports only simple illustrated symbols and poses; it is **not** a mature reusable 3D/human animation library. Test with `python scripts/scene_player.py examples/pilot-storm/reusable_scene.json --out outputs/reusable_scene_test.mp4`. Do not claim this rendering backend integrates with the old Three.js or Higgsedit rig yet.

## Actual local workflow demonstrated in v4

`python scripts/preview_pipeline.py EPISODE/shotplan.yaml --claims EPISODE/claims.csv --out EPISODE/preview`

This generates a camera-only *rehearsal* animation, a provisional synthesized ambient audio layer, a combined MP4, QA JSON, shot hash manifest, and an interactive review HTML. It cannot finish the film or claim an approved script. The experiment is useful because the director can critique motion and framing **before** paying for voice or final assets.

For an approved external voice take, export word-level timing as `{fps, words:[{word,start,end},...]}` and run `voice_timeline.py` only when word timestamps are genuinely measured. The tool rejects edited/reordered words and shot-time drift; never fit or silently alter the approved narration just to make a cut work. Its generated SRT and frame cues then become the canonical timing inputs.

See `docs/SHOT_DIRECTION_STORM.md` for the director's detailed blocking and camera intentions. These are hypotheses to test visually, not proof of their execution by the placeholder renderer.
