# Environment: the pinned tools Fourth Watch is built and tested with

**Use this when** you set up a new workspace, when a render or checker result looks different from before, or before a release. Different versions of Chrome, three.js, ffmpeg or the speech model can change frames, loudness readings or what the checker hears. Pinning them makes results repeatable.

**Check this machine:** `python3 tools/check_env.py`. It prints `ok` or `DIFF` per item and exits 1 if anything differs.

| Item | Pinned version | How to get it |
|---|---|---|
| Python | 3.13 (built on 3.13.18) | System |
| Node | v22.23 (built on v22.23.4) | System |
| ffmpeg / ffprobe | 6.1.1 (Ubuntu 6.1.1-3ubuntu5) | `apt` |
| tesseract (OCR for the verse-card and caption checks) | 5.3.4 | `apt install tesseract-ocr` |
| Headless Chrome (renderer) | Chrome for Testing 153.0.8010.12, at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (`CHROME_PATH`) | Pre-installed with Playwright; don't reinstall Playwright |
| three.js | r158, vendored as `brand/logo/source/lib/three.min.js`, for the approved logo scene (sha256 starts `3b3a1c97de3ce65e`) | In the repo; never swap it |
| Python packages | `requirements.txt`: sherpa-onnx 2.0.1, onnxruntime 1.29.0, opencv-python-headless 5.0.0.93, numpy 2.5.3, pillow 12.3.0 | `pip install --break-system-packages -r requirements.txt` |
| Speech model (the checker's hearing check) | `sherpa-onnx-zipformer-small-en-2023-06-26`, in `~/.cache/fourth-watch/asr` | `fw_check.py` downloads it on the first video check; if the download is blocked, the hearing check runs limited |
| Checkers | `fw_check.py` sha256 `9db74d36…` | The toolkit page; the full fingerprints are in the showrunner skill |

**When a pin changes** (a new Chrome, a new package):
1. Run `python3 tests/checkers/run_tests.py`. It must report 0 problems.
2. Render the same 5 s clip before and after, and compare frames.
3. Update this table, `requirements.txt` and the `PINS`/`FILES` in `tools/check_env.py`.
4. Note the change in `system/11_lessons_log.md`.
