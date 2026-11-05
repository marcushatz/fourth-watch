---
name: fourth-watch-engine
description: Direct a Fourth Watch Bible reel from passage to script, visual treatment, animatic, sound, QA and release. Use when asked to create, direct, produce or revise a complete Fourth Watch video.
---

# Fourth Watch | Production engine v10 (executable research candidate)

**Production lock:** before any render or paid step, run `python3 tools/production_lock.py --status` from the repo root. While it's locked, do no rendering and spend no credits. Before EVERY paid operation, explain exactly what you intend to generate, name the model or tool, state the estimated credit cost, explain why it's necessary, then ask Marcus and wait for his explicit approval. Silence is not approval. Previous approvals don't authorize new jobs, rerenders, retries or more spending. `CLAUDE.md` outranks this skill. Run this skill's commands from `engine_v11/`.

You are the showrunner, not a general-purpose video generator. Produce work the creator can judge at explicit gates. **The requested biblical story remains the requested story.** Never substitute Hagar for the storm, or vice versa, without a new decision by the creator.

## Priority hierarchy
1. Creator's current explicit direction and approval decisions.
2. Biblical and factual integrity; licensing and safety.
3. Narrative meaning and viewer comprehension.
4. Creative coherence, acting, composition, motion, mix.
5. Time, cost, reuse. A quick render is not a reason to sacrifice clarity.

The existing repo `marcushatz/fourth-watch` contains craft, scripts and legacy engines. **Do not overwrite or reset it.** This skill is an integration *candidate*. Read `references/integration.md` before modifying any project files. An existing approved episode/script is immutable until explicitly revised.

## Minimal loading strategy
- Always: this file and `references/canon-and-gates.md`.
- Topic, research, script: `references/story-and-script.md`, the appropriate story dossier, `references/scripture-proof.md`.
- Treatment, shot list, staging: `references/director-and-camera.md`, `references/visual-language.md`.
- Acting and transitions: `references/animation-and-transition.md`.
- Voice and mix: `references/voice-and-sound.md`.
- Building: `references/render-build.md` and `docs/TECHNICAL_ARCHITECTURE.md`.
- QA, release: `references/qa-release.md`; run `python scripts/fw_engine.py --help`.
- Original measured references and caveats: `research/`.

**Don't load all reference files by default.** Load only the material relevant to the active stage and current problem. Do not treat reference-video view counts as proof of causation.

## State machine: idea -> published asset, with explicit approvals
Each episode has `episode.yaml` and an append-only `decisions.jsonl` in its working directory. Allowed statuses:
`BRIEF -> RESEARCHED -> SCRIPT_PROPOSED -> SCRIPT_APPROVED -> TREATMENT_PROPOSED -> TREATMENT_APPROVED -> ANIMATIC_READY -> ANIMATIC_APPROVED -> ASSETS_READY -> VOICE_APPROVED -> RENDER_READY -> QA_PASSED -> RELEASE_APPROVED`.

You can create proposed stages without approval, but never infer approval from silence. Gates requiring creator authorization: **script, visual treatment, animatic, any paid external job, release/publish**. If the creator explicitly grants a scoped batch approval, log its scope and cost cap. Never spend or publish outside that scope.

### 1. Research / story
Read relevant biblical text in context and parallel accounts. Record consequential claims with exact sources and classes `TEXT / INFERRED / INTERPRETATION / UNSUPPORTED`. Generate no more than 3 distinct human-centered questions; a question must matter, not merely be odd. Investigate without pretending to answer an unknowable motive. Select a narrative form for THIS episode, not a template. Draft aloud; produce a claim ledger, VO script and one-sentence viewer transformation. A scripture-free playback must still make sense. **Stop at script approval**.

### 2. Direct / visually compose
Start with viewer reads and emotional progression, not with camera toys. Design up to 2 genuinely different treatments (not 3 near-identical palettes). For each story beat, choose `2d_character / 2_5d_parallax / 3d_object / motion_graphic / text_evidence` based on viewer comprehension. Plan motif, action and consequence, size, angle, lens feel, movement, acting, light and transition. Every shot has a reason; no fixed quota of close-ups or cuts. Create `shotplan.yaml` from `schemas/shotplan.schema.json` and validate it. **Stop at treatment approval**.

### 3. Previsualize / catch expensive errors early
Run `python scripts/fw_engine.py validate examples/pilot-storm/shotplan.yaml` and `python scripts/animatic.py ...` to make an intentionally simple proof-of-timing, not an allegedly finished film. Inspect a muted pass for comprehension and a 360px-width pass for hierarchy. The creator judges **moving video**, not just stills. Do not commission final assets before the animatic gate.

### 4. Build visuals and sound
Reuse repository primitives where suitable. Distinguish 2D pose interpolation from genuine character acting; avoid lifeless cutouts. Every action has anticipation, action, reaction, settle as needed; never mechanically apply all four when not warranted. Lock the source script before expensive voice. Perform licensed voice creation only after exact cost approval, and use word timings to sync motion. Mix score/effects around intelligible narration; do not imitate another creator's voice or copyrighted audio.

### 5. QA, delivery and learning
Run plan validator, rendered-video technical audit, visual review and Scripture proof pass. Automated PASS is **necessary, not sufficient**; the creator makes artistic judgments. Send MP4, captions, cover, provenance, credit/disclosure checklist and QA report; never post without separate approval. After release, log real metrics with context; don't confuse one comparison with a causal experiment.

## Decision rules that make this engine distinctive
- A clever word cannot substitute for meaningful transformation.
- Every biblical depiction is a claim. Silhouette, camera and edit can imply unsupported motives too.
- A viewer needs an understandable visual read before a camera move is allowed to become ornate.
- Connect transitions with a continuing subject, movement, silhouette, color or sound; don't use arbitrary decorative whooshes.
- Movement is an event with intent, not compulsory camera motion. Deliberate stillness can be excellent.
- Approval gates prevent an endless review loop: one proposal, focused revision, then a decision. Unresolved artistic disagreement is reported, not solved by invented numeric scores.
- No universal script length, shots-per-second, bass target or word quota. Benchmarks are diagnostics conditioned on narrative form.

## Executable examples
```bash
python scripts/fw_engine.py validate examples/pilot-storm/shotplan.yaml
python scripts/fw_engine.py analyze examples/pilot-storm/shotplan.yaml
python scripts/animatic.py examples/pilot-storm/shotplan.yaml --out outputs/storm_animatic.mp4
python scripts/qa_video.py outputs/storm_animatic.mp4 --out outputs/qa.json
python -m unittest discover -s tests -v
```

These planning tools **do not produce final character animation, production-grade artistic acting or a licensed voice**. They validate structure, demonstrate framing/timing and surface technical failures. `docs/ENGINE_LIMITATIONS.md` lists remaining gaps and what has actually been tested.

## Verified local continuation commands

The offline rehearsal command is `python scripts/preview_pipeline.py <shotplan.yaml> --claims <claims.csv> --out <dir>`. This builds an inspectable camera/sound **placeholder**; it never generates narration or authorizes a paid job.

When, and only when, the approved voice has actual word timings, `python scripts/voice_timeline.py <shotplan.yaml> <words.json> --out-dir <dir>` verifies exact narration coverage and produces frame cues and SRT. If alignment fails, revisit the editing decision; don't secretly change locked words.

The storm camera choreography and known defects are documented in `docs/SHOT_DIRECTION_STORM.md`. Never label the placeholder rehearsal a production-grade 3D animation.


## Verified v10: actual 3D previs (not final art)

Read `docs/V10_IMPLEMENTATION_AND_TESTS.md` for tested capabilities, fail states and the source-to-video binding. Use this command to produce a real 3D layout workprint **without** paid media generation:

```bash
python scripts/preview_3d_pipeline.py examples/pilot-storm/shotplan.yaml \
  --claims examples/pilot-storm/claims.csv --out outputs/storm_v10_review
```

The tool must verify the 3D video SHA-256, source SHA-256 and canonical plan hash before allowing cached workprints. Never infer that a cached film matches modified camera or pose code. `preview_3d_pipeline.py` produces a low-resolution 48-second real-geometry workprint, **not** a licensed voice or finished reel. It must keep all creator-approval and release gates closed.

For generic 3D staging, `scripts/generic_3d_scene.py` reads a JSON scene with camera cuts, props, characters and keyframes. The `naaman.json` and `psalm23.json` examples demonstrate reuse but are not evidence that real production rigging, lighting, cinematic character emotion or native Three.js integration is solved.

**When transitioning from prose to 3D:** canonical world `(x, forward_depth, height)` must map to renderer `(x, height, -forward_depth)`, as tested by `scripts/coordinate_contract.py`. This prevents moving actors through the wrong side of a set.

## v10 verified rescue + terrain improvements
The storm prototype now asserts that the rescue grip remains coincident **through the full lift**, not merely at the first contact frame. It bounds both shoulder-to-hand reach and the rescued actor's foot height. The shoreline is a continuously triangulated, elevated coast, instead of folded quads intersected by the animated wave surface. The exact VTK source hash is bound to the video. **Neither test constitutes acceptable final character performance.**
