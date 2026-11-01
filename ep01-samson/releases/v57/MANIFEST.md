# Release manifest · ep01-samson v57

Created 2026-10-31T20:41:06 by `tools/make_manifest.py ep01-samson/release_v57.json`. **RELEASABLE**

## Checks

| Level | Check | Result |
|---|---|---|
| PASS | script = vo.js | 16 VO lines, word for word |
| PASS | voice timings | vo.js times come from the recorded take (voEnd 143.02 s) |
| PASS | score | 23 shots, END_T 144.32 s, DURATION 144.32 s, OUTRO None |
| PASS | music.wav | out/music.wav is the declared soundtrack |
| PASS | song.js | song.js is the declared soundtrack script |
| PASS | script checker | 0 FAIL |
| PASS | environment | matches ENVIRONMENT.md pins |
| PASS | checker tests | 11 fixtures checked, 0 problem(s) |

## Files

| Role | Path | SHA-256 (first 16) | Bytes |
|---|---|---|---|
| script | `ep01-samson/episode.md` | 965cf1991d857b4d | 10878 |
| vo | `ep01-samson/film27/vo.js` | 762f70867e039942 | 33129 |
| score | `ep01-samson/film27/score.js` | 18f5d493d8bf5539 | 8324 |
| film | `ep01-samson/film27/film.js` | d9195e69ab841833 | 10663 |
| soundtrack_script | `ep01-samson/film27/song_v57.js` | 67e06fcb83bfba2f | 19467 |
| song_js | `ep01-samson/film27/song.js` | 67e06fcb83bfba2f | 19467 |
| soundtrack_wav | `ep01-samson/film27/out/soundtrack_v57.wav` | 37dd636cb90ef7f4 | 57569324 |
| music_wav | `ep01-samson/film27/out/music.wav` | 37dd636cb90ef7f4 | 57569324 |
| voice_take | `ep01-samson/voice_lab/take1/voice_edit.wav` | 0ffd30cf710acae9 | 12632138 |
| outro | `brand/logo/fw_final_outro_v3.mp4` | 09b2aceb1f34e753 | 14728504 |
| captions | `ep01-samson/film27/out/captions.srt` | 9f07bd4e4647e23e | 6035 |
| final_video | `ep01-samson/film27/out/fourth-watch-ep1-samson-v57-final.mp4` | 8f4daa23c62f0e93 | 96343793 |

## Tools

| Tool | SHA-256 (first 16) |
|---|---|
| `fw_check.py` | 9db74d360c3f1d2a |
| `tools/shotlist_check.js` | 67d3a26665317697 |
| `toolkit_page/fw_review.py` | 14393751650ba340 |
| `toolkit_page/fw_critic.md` | 1e6ca7fc860e499a |

Supporting files: 21 (hashes in MANIFEST.json). Environment: matches the pins.
