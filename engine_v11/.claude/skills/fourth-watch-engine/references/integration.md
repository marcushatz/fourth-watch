# Integration with existing repository (read before modifying)

Verified 2026-11-04 through connected GitHub `marcushatz/fourth-watch` (main tree ~2036 entries; file contents checked for selected entries). Existing assets include:
- `.claude/skills/fourth-watch-writer/SKILL.md`: previous writer, rigid angle scores/retell quotas. Do not delete; compare and deprecate after acceptance.
- `system/00_series_canon.md`: brand and series identity, subject to explicit newer decisions.
- `system/13_story_director.md`: visual analysis / alternative treatments / storyboard / reads / compiling; preserve and integrate.
- `system/06_camera_and_angles.md`, `06b_frames_light_and_sets.md`, `06c_shot_recipes.md`, `07_motion_and_acting.md`, `08_sound.md`, `09_render_and_qa.md`: existing craft/guidance.
- `creative/library/INDEX.md` and `recipes/*.md`: picture devices and illustrative examples; this engine must use them when relevant, not replace with generic labels.
- `tools/creative/spec_check.py`, `compile_spec.py`, `pack.py`: existing input formats likely differ from the new `shotplan.yaml`. Adapter needed, no implicit compatibility claim.
- `toolkit_page/fw_review.py`, `toolkit_page/published/fw_check.py`: established analysis; their full runtime and dependencies need testing in the actual repo.
- `research/lintel_ref/yt/*`, `research/other_ref/*`, `research/script_rules_from_hits.md`: primary internal research archive. Different views/dates/channels; don't treat all categorical rules as evidence.
- `ENGINE_ROADMAP.md`: historical one-idea-to-reel plan; essential deficits: reusable sets, actor actions, transitions, diagrams, render queue, creative judgment.

## Merge plan (does NOT happen automatically)
1. Add the new skill as `.claude/skills/fourth-watch-engine/` in a feature branch.
2. Point the skill to existing stage tools, but keep new plan schema distinct until an adapter passes fixture tests.
3. Build a bidirectional converter (new plan -> creative spec -> code score), with assertions that shot timing, passage claims and asset references survive unchanged.
4. Run an existing clip through old and new QA. Compare differences and ensure each new warning is substantiated.
5. Only after a successfully produced **real** episode and creator approval should legacy showrunner docs be marked obsolete; never delete original research.
