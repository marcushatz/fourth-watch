# Fourth Watch engine: technical architecture and state ownership

## Components
```
TOPIC / PASSAGE
    |   topic brief and locked creator constraints
    v
BIBLE RESEARCH  -- claim ledger --> SOURCE AUDITOR
    |                                   |
    v                                   v
SCRIPT / SCRIPT HASH <--- textual corrections / interpretation notes
    |  ^ creator approves exact narration
    v
VISUAL TREATMENTS -- viewer reads + visual grammar
    |  ^ creator chooses treatment
    v
SHOTPLAN / INTEGER FRAME TIMELINE
    |   fw_engine.validate() + bible-claim trace
    v
ANIMATIC (12fps placeholder) -- muted/phone pass
    |  ^ creator approves motion / language
    +---------> ASSET WORKSHEET + COST GATE
                     | reuse, commission, rights and cost check
                     v
CHARACTER/SET/DIAGRAM BUILDER + CAMERA/TRANSITION ENGINE
                     |
                  STAGED SHOT RENDER CACHE
                     | hash keyed
                     v
VOICE LOCK + WORD TIMING + MUSIC/SFX STEMS
                     |
                  MIX + COMPOSITE + SRT/COVER
                     |
          TECHNICAL QA + VISUAL QA + SCRIPTURE QA
                     | ^ creator approves final
                     v
               RELEASE PACKAGE
                     |
                   AUDIENCE DATA (later iteration)
```

## Boundaries
- LLM chooses artistic intent: what matters, pacing, acting, scene composition, interpretive boundaries. A deterministic renderer executes physical transforms but cannot decide meaning.
- `shotplan.yaml` declares *what*. Adapter to an existing rendering backend must implement *how*. This candidate does not claim those integrations already exist.
- Every stage's output is versioned, content-addressed, human-readable. No opaque loss of decisions between stages.
- Skill files are not code generators by themselves. The packaged renderer here is an **animatic** for detecting timing and framing problems; final 3D movement requires production rig/asset backend.

## Episode manifest fields (target)
```
episode_id; user_brief; passage_refs; source_translation;
approved_script_hash; story_promise; narrative_form;
shotplan_hash; treatment_id; cast_ids; asset_versions;
frame_rate; resolution; voice_take_hash; word_times_hash;
audio_stem_hashes; render_engine_version; output_hash;
license_manifest; cost_approval_id; qa_hash; release_decision
```

## Camera and coordinate spaces
- World space: +X right, +Y deeper into the scene, +Z up in the **canonical storyboard**. The experimental VTK renderer and legacy Three.js scenes use +Y up and +Z toward camera. Map canonical `(x, depth, height)` to renderer `(x, height, -depth)` using `scripts/coordinate_contract.py`; the inverse must round-trip exactly. Do not feed canonical coordinates directly into either renderer. This mismatch caused an early Peter-step blocking error and is now covered by regression tests.
- Screen space: normalized 0..1 with origin at top-left, X right, Y down. Safe areas are viewport-specific overlays, not fixed world coordinates.
- Frame scale and camera move declared in the plan; avoid separately computing a second unsynchronized camera timeline.
- 30fps production timeline uses integer half-open shot intervals `[start,end)`. Animatic lower fps is sampled from this source, so duration remains stable.
- For match cuts, store a matched 2D anchor (`normalized_uv`), semantic target and exact crossover frame in both adjacent shots.

## Per-shot production state
`NEW -> BOARDED -> READ_TESTED -> ASSET_READY -> KEYED -> RENDERED -> QA_OK`, with stale artifact invalidation by hashes. Store per-shot status rather than treating a whole film as either finished or broken.

## Asset and render cache keys
`SHA256(script hash + shot canonical JSON + asset manifest hashes + renderer version + color profile + font IDs + voice word timing revision)`. Keep separate layers (world, character, graphic, captions) if the backend supports compositing; a changed subtitle should not force a world re-render. Verify every cache hit has a real file and matching hash.

## Renderer boundary contracts
### Illustration / 2.5D
Input: layer assets (licensed), alpha, parallax strength, object transform keyframes, depth order and camera. Output: RGBA sequence or coded compositing scene with consistent identity.
### Character rig
Input: cast ID, mesh/sprite rig, skeleton, action semantic + frame range, foot/hand contact points, gaze, root path, continuity state. Output: motion track whose physical contacts can be verified.
### Motion graphics
Input: data/relationships/word refs, style tokens, animation beats. Output: deterministic 2D scene. Each chart quantity must have a source claim ID.
### Audio
Input: approved transcript SHA, voice take, word times, music and SFX stems, mix automation. Output: bounced audio + source/provenance metadata.
### Composite
Input: ordered picture layers, captions and word timing, transitions with exact frame ranges, audio. Output: 1080x1920 H264/AAC master (or production-appropriate mezzanine), SRT, cover and manifest.

## How the candidate relates to repo
Never imply `scripts/animatic.py` replaces the established camera/diorama/Higgsedit renderer. Existing `tools/creative/compile_spec.py` expects its own spec. Adapter needs explicit mapping, integration test on an existing episode, and creator approval before a wholesale swap.

## Programmatic proof vs artistic proof
A script passes **contract integrity** when frames, claims and approvals are well formed. A rendered clip passes **technical validation** when it decodes, meets requested specs and warnings are reviewed. Neither proves moving character performances, compelling story, spiritual sensitivity, or audience engagement. Those require motion review, human listening and later platform evidence.
