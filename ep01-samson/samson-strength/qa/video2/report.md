# Fourth Watch QA — video

**Verdict: FAIL** · 39 fail · 14 warn · 10 pass

| Fact | Value |
| --- | --- |
| file | samson-strength.mp4 |
| size | 1080x1920 |
| fps | 30.00 |
| duration | 103.13s |
| codec | h264 |
| audio | aac |
| loudness | -16.0 LUFS |
| true peak | -1.4 dBTP |
| visual changes | 25 |
| first/last frame match | 1.00 |
| caption chunks | 92 |
| speech starts | 4.36s |

| Level | Check | Time | Finding |
| --- | --- | --- | --- |
| FAIL | title | 0.00s | title not readable in frame one (only 25% of 'WHY GIVE SAMSON THAT STRENGTH?' read back) |
| FAIL | sync | 0.15s | caption shown while nobody is speaking: 'If God knew' |
| FAIL | sync | 1.06s | caption shown while nobody is speaking: 'Samson would throw' |
| FAIL | sync | 2.20s | caption shown while nobody is speaking: 'it all away,' |
| FAIL | sync | 7.09s | caption shown while nobody is speaking: 'would chase' |
| FAIL | sync | 7.61s | caption shown while nobody is speaking: 'a Philistine wife' |
| FAIL | sync | 8.80s | caption shown while nobody is speaking: 'his parents didn't want.' |
| FAIL | sync | 10.18s | caption shown while nobody is speaking: 'He knew Samson' |
| FAIL | sync | 11.17s | caption shown while nobody is speaking: 'would tell Delilah' |
| FAIL | sync | 12.36s | caption shown while nobody is speaking: 'how to take' |
| FAIL | sync | 15.45s | caption shown while nobody is speaking: 'him the strength' |
| FAIL | sync | 25.31s | caption shown while nobody is speaking: 'before he was born.' |
| FAIL | sync | 26.81s | caption shown while nobody is speaking: '"He shall begin' |
| FAIL | sync | 27.84s | caption shown while nobody is speaking: 'to save Israel' |
| FAIL | sync | 28.88s | caption shown while nobody is speaking: 'from the hand' |
| FAIL | sync | 32.30s | caption shown while nobody is speaking: 'it doesn't say' |
| FAIL | sync | 33.14s | caption shown while nobody is speaking: 'he'll save Israel.' |
| FAIL | sync | 34.32s | caption shown while nobody is speaking: 'It says' |
| FAIL | sync | 37.39s | caption shown while nobody is speaking: 'was to start' |
| FAIL | sync | 38.23s | caption shown while nobody is speaking: 'the fight.' |
| FAIL | sync | 38.91s | caption shown while nobody is speaking: 'Israel wasn't fighting back.' |
| FAIL | sync | 40.59s | caption shown while nobody is speaking: 'Even his own people' |
| FAIL | sync | 41.96s | caption shown while nobody is speaking: 'tied him up' |
| FAIL | sync | 43.89s | caption shown while nobody is speaking: 'to the Philistines.' |
| FAIL | sync | 45.33s | caption shown while nobody is speaking: 'And that wife?' |
| FAIL | sync | 46.39s | caption shown while nobody is speaking: 'It sounds wrong' |
| FAIL | sync | 48.08s | caption shown while nobody is speaking: 'but the marriage was' |
| FAIL | sync | 52.30s | caption shown while nobody is speaking: 'for he was seeking' |
| FAIL | sync | 54.69s | caption shown while nobody is speaking: 'against the Philistines."' |
| FAIL | sync | 56.41s | caption shown while nobody is speaking: 'Samson wanted a wife.' |
| FAIL | sync | 57.93s | caption shown while nobody is speaking: 'God wanted to free' |
| FAIL | sync | 61.74s | caption shown while nobody is speaking: 'because he deserved it.' |
| FAIL | sync | 63.39s | caption shown while nobody is speaking: 'He gave it' |
| FAIL | sync | 67.50s | caption shown while nobody is speaking: 'his eyes.' |
| FAIL | sync | 69.41s | caption shown while nobody is speaking: 'he prayed,' |
| FAIL | sync | 71.36s | caption shown while nobody is speaking: 'this once."' |
| FAIL | sync | 77.48s | caption shown while nobody is speaking: 'in his whole life.' |
| FAIL | sync | 81.12s | caption shown while nobody is speaking: '"defeated the Philistines' |
| FAIL | sync | 91.24s | caption shown while nobody is speaking: 'It was about' |
| WARN | hearing |  | speech recognition unavailable: words and caption timing checked only against speech activity |
| WARN | captions on screen | 0.59s | caption hard to read or missing on screen (0% read back): 'If God knew' |
| WARN | captions on screen | 1.62s | caption hard to read or missing on screen (0% read back): 'Samson would throw' |
| WARN | captions on screen | 2.82s | caption hard to read or missing on screen (0% read back): 'it all away,' |
| WARN | captions on screen | 4.05s | caption hard to read or missing on screen (0% read back): 'why did He give' |
| WARN | voice | 4.36s | the first word starts at 4.36s; the hook should start immediately |
| WARN | captions on screen | 5.37s | caption hard to read or missing on screen (0% read back): 'him so much strength?' |
| WARN | pacing | 22.70s | no hard visual change for 8.9s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 29.28s | caption hard to read or missing on screen (0% read back): 'from the hand' |
| WARN | pacing | 31.60s | no hard visual change for 8.9s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | pacing | 40.50s | no hard visual change for 10.3s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 51.32s | caption hard to read or missing on screen (33% read back): '"It was from' |
| WARN | captions on screen | 52.87s | caption hard to read or missing on screen (0% read back): 'for he was seeking' |
| WARN | pacing | 57.90s | no hard visual change for 8.1s (playbook: new scene every 4–6s; soft dissolves may not register) |
| PASS | format |  | frame 1080x1920 (want 1080x1920) |
| PASS | format |  | 30.00 fps (want 30) |
| PASS | runtime |  | 103.1s |
| PASS | loudness |  | -16.0 LUFS integrated (target -16 to -12) |
| PASS | loudness |  | true peak -1.4 dBTP (max -1.0) |
| PASS | motion |  | something moves in every stretch longer than 1.5s |
| PASS | loop |  | last frame vs first frame similarity 1.00 (want ≥ 0.75 so the replay loops) |
| PASS | captions = script |  | all 284 caption words match the script |
| PASS | verse card |  | verse found on screen (100% of words) at 30.5s |
| PASS | verse card |  | verse found on screen (100% of words) at 55.5s |
