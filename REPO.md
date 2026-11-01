# Fourth Watch: the repository

The private backup of the whole project: the production system, the scripts, the checkers and the animation engine.

**What's in it:**
- `README.md`, `DECISIONS.md`, `system/`, `prompts/`, `templates/`, `research/` (study notes only);
- `fw_check.py`, `tools/` (the shot-list gate, the script judge, the environment and manifest tools), `tests/checkers/`;
- the episodes, with the Ep 1 engine in `ep01-samson/film27/` and the recorded Ep 1 voice take (`ep01-samson/voice_lab/take1/voice_edit.wav`);
- the final logo and outro images in `brand/`.

**What's left out** (`.gitignore`):
- renders, videos and audio drafts, image iterations and QA contact sheets: the renderers and checkers rebuild them;
- other creators' videos and frames;
- downloaded models;
- anything holding a key.

**After cloning:**
1. `pip install --break-system-packages -r requirements.txt`, then `python3 tools/check_env.py`.
2. `python3 tests/checkers/run_tests.py` must report 0 problems.
3. `README.md` has the order of work.
