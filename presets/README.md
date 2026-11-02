# Production presets

A preset is a separate set of creative rules for a different kind of video. Fourth Watch's rules stay in `production/`. Other presets live here, so neither set changes the other.

## Separate for each preset

- Brand and purpose.
- Look, typography and colour.
- Narrator and music.
- Story structure and length.
- Prompts, references, characters and assets.
- Generation log and asset list.

## Shared across the repository

- The generation gate: `production/GENERATION_APPROVAL.md`, `tools/generation_gate.py`.
- Locked approved scripts.
- Never publishing automatically.

## Keeping them apart

1. Name the project before any creative work. If the request doesn't say, ask.
2. Read only that project's creative rules.
3. Every generation request names its project.
4. Log each job in that project's own ledger.
5. Use a separate Higgsfield project or folder for each. Higgsfield Elements are shared across the workspace, so prefix their names: `fw-` for Fourth Watch, `testimony-` for testimonies.
6. Never reuse a look, narrator, prompt, reference or asset across projects without Marcus's OK.
7. A rule learned on one project stays there. Copying it to the other is Marcus's decision.

## Adding a preset

Copy the folder layout from `christian-testimonies/`, add its generation log and asset list, and add it to `PROJECTS` in `tools/generation_request.py`.
