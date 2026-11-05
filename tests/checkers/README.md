# Checker test clips

**Use this before any change to `fw_check.py` ships** (Round 17). Run it again after a pinned tool changes (`ENVIRONMENT.md`).

```
python3 tests/checkers/make_fixtures.py      # (re)builds the fixtures; deterministic
python3 tests/checkers/run_tests.py          # all: about 1-2 minutes (the video part)
python3 tests/checkers/run_tests.py --fast   # script + shot list only, a few seconds
```
It exits 0 only when every expectation in `expected.json` holds.

## What's planted

| Fixture | Planted fault | The checker must |
|---|---|---|
| `script/good.md` | none (Ep 2 Jonah v4 draft) | exit 0, no FAIL on hook, call to action, fact-check, reference, verse, answer or value |
| `script/bad_hook_mismatch.md` | first VO line ≠ the title | FAIL `hook` |
| `script/bad_cta_in_vo.md` | "Follow for more." in the voice | FAIL `call to action` |
| `script/bad_pending_factcheck.md` | a fact-check row marked pending | FAIL `fact-check` |
| `script/bad_no_reference.md` | a Turn line with no [Book c:v] | FAIL `reference` |
| `script/bad_no_verse_card.md` | no VERSE card | FAIL `verse` |
| `video/v_good.mp4` | none (8 s, 1080×1920, moving, a quiet tone) | no FAIL on format, motion or loudness |
| `video/v_wrong_size.mp4` | 720×1280 | FAIL `format` |
| `video/v_frozen.mp4` | a still frame for 8 s | FAIL `motion` |
| `video/v_too_loud.mp4` | a clipped, very loud tone | FAIL `loudness` |

The videos have no voice or captions and run with `--no-asr`, so runtime, captions and voice always FAIL on them; only the planted fault is asserted.

## Adding a test

When a checker misses a real problem, plant that problem in a new fixture in `make_fixtures.py`, add its expectation, watch the test fail, fix the checker, and watch it pass. That's how the bubble-beat bug was fixed.
