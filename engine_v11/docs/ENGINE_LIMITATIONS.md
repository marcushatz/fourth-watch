# Engine candidate — factual completion boundaries

Verified locally on 2026-11-04. No script, treatment, frame, expense or publication has been approved by the creator for the storm pilot.

## Built and executable
- **Research archive** indexed from the existing Fourth Watch project's recorded analyses of 22 third-party Shorts (12 Lintel transcript records plus 10 high/low visual comparisons across BibleProject and Bible Animations). Observed view counts were logged in the previous studies; not reverified as current today and not proof of causation.
- **Creator skill** with selectively loaded instructions for Scripture, writing, shot design, camera, animation, graphics, sound, rights, review and release.
- **Shotplan contract** with integer production frame timeline, explicit source claim IDs, camera intentions and internal picture beats.
- **Deterministic planning tools:** validation, diagnostics, per-shot content-addressed manifest, claim trace, legacy-renderer *blueprint* handoff and approval state machine.
- **Review tools:** an HTML timeline that seeks into the animatic and displays each shot's narration, picture goal and source claim.
- **Data-driven scene player:** a small reusable 2D renderer from JSON keyframes, including actor positions, props, simple poses and a moving camera; 8-second Peter scene demonstrates interpolation, not expressive acting.
- **Two silent animatics:** first generic and a second original procedural **12-composition** camera study; 360 × 640 @12fps, 48 s. These are intentionally low-resolution render previews.
- **Original synthesized sound experiment** for the camera study: timed event cues, atmospheric wind/sea textures and simple harmonics; **no narration**.
- **Technical sample QA:** MP4 decode, dimensions, frame samples, audio stream and near-static frame warnings.
- **Release-preflight blockers:** placeholder image stages, script hash, missing claims, unresolved assets, missing audio, incorrect release dimensions or duration, incomplete human approvals.
- **72 passing and 1 skipped automated regression tests** in v10, run with Python's unittest.

## Not built or unverified — do NOT describe as done
- A compelling, fact-checked and **creator-approved** debut narration script. The storm narration here is a test sketch only.
- Independent primary-source review of every recorded claim in the pilot or theological sign-off.
- **Full character rigging**, advanced facial/body acting, physics-based water/cloth, elaborate 3D environments or a generalized Higgsedit/Three.js renderer. Earlier repository code does contain 3D work, but this package does not yet integrate or test it.
- A functioning automatic shotplan-to-legacy `score.js` compiler. The adapter deliberately emits **BLUEPRINT_ONLY** with unresolved set, rig and voice alignment requirements.
- Word-level synchronized licensed voiceover, final music production, subtitling/caption delivery, and multi-platform publishing automations.
- Paid generation, app integration or any post to social media.
- Public performance, real audience feedback, independent writers' skill comparison, or any basis for predicting virality.

## Artistic issues in the actual moving camera test
1. Body poses are readable but crude; the reaching hand and walking motion do not yet achieve expressive performance.
2. Composition is more varied than the first animatic, but many shots still have sparse backgrounds and minimal foreground depth.
3. The temporary subtitle band is an editorial slate, not word-timed, platform-safe final captions.
4. The moon and water motifs repeat monotonously across locations; lighting transitions need a story-driven color script.
5. The S11/S12 sequence has a question about the loaves but no earned interpretation yet; **do not confuse it with a polished ending**.
6. The music bed is demonstrative only; a real narrator needs separate ducking and measured intelligibility.

## Next objective production milestones
1. Freeze the storm **meaning**, approve a script grounded in Mark 6, Matthew 14 and John 6. Solve the hook and ending before drawing expensive shots.
2. Translate three selected pilot shots (boat against wind; Peter's step; Jesus' reach) into real reusable production assets with the legacy engine. Render and assess these at phone size.
3. Prove the legacy handoff is genuinely compilable with exact narration timing, continuity and claim preservation; add integration fixture tests.
4. Build voice and soundtrack after approving the script and paid-job cap; run full audiovisual QA.
5. Approve final visuals and release only after a complete human review.

Passing a validator or receiving a demo video is **not** proof of cinematic or spiritual quality. This report deliberately distinguishes what is concrete from what remains aspirational.

## Continued build findings (v4)
- A one-command local preview can successfully run without credits or modifying GitHub. It is a rehearsal-only pipeline; its soundtrack is synthesized atmosphere, *not dialogue or licensed scoring*.
- Narration/word-time alignment now has an executable validator and SRT generator, with rejection tests. No actual approved word-timed voice track was available, so real voice integration remains unverified.
- The 48-second local camera-and-sound preview technically decodes correctly but has a significant **near-static sample ratio (50/96 sampled frames)**. This is a genuine quality defect in the rehearsal's animated action and must be fixed before treating it as evidence of directing proficiency.
- The historical repository contains three.js render infrastructure, but this candidate still lacks a tested adapter to build the storyboard's set/rig/camera behavior in that existing renderer. `legacy_handoff.py` remains an explicit BLUEPRINT_ONLY bridge.
- We have not run independent real-viewer tests or a qualified Scripture review of the storm's intended final message; no debut narration is locked.

## Verified v9–v10 changes

See `docs/V9_IMPLEMENTATION_AND_TESTS.md`. A local VTK 3D scene renderer and a JSON-driven generic 3D stage were added. This changes the earlier claim that this package has no real 3D output: **it now generates real geometric 3D layout workprints**, but production-grade character animation and verified native Three.js rendering remain unbuilt. The source-bound storm video is 48 s at 360×640/12fps, with 8 sampled near-still intervals, and is not a final artistic product.

## Verified v10 additions
- The rescuer's and rescued man's shared contact is constrained at six tested frames after grip onset, with shoulder-to-hand limits tested and Peter's foot elevation bounded during the lift. These tests do not guarantee believable acting.
- Replaced unstable shoreline quads with continuous triangular coast geometry above the maximum test wave height. This fixes the broken coast mesh visible in earlier contact sheets.
- 73 discovered tests: 72 passing, one intentionally skipped. Package provenance and release-blocker conditions are retained.
