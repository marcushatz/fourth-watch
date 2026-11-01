# Fourth Watch QA — video

**Verdict: FAIL** · 1 fail · 83 warn · 12 pass

| Fact | Value |
| --- | --- |
| file | fourth-watch-ep1-samson-v57.mp4 |
| size | 1080x1920 |
| fps | 30.00 |
| duration | 151.32s |
| codec | h264 |
| audio | aac |
| loudness | -14.0 LUFS |
| true peak | -1.4 dBTP |
| visual changes | 34 |
| first/last frame match | -0.04 |
| caption chunks | 118 |
| speech starts | 0.30s |
| words heard | 380 |
| voice matches script | 99% of words heard as written |
| caption timing | median +0.02s vs voice (118 chunks measured) |

| Level | Check | Time | Finding |
| --- | --- | --- | --- |
| FAIL | runtime |  | 151.3s (must be 45–150s) |
| WARN | loop |  | last frame vs first frame similarity -0.04 (want ≥ 0.75 so the replay loops) |
| WARN | safe area | 0.50s | text 'you' in the right margin |
| WARN | safe area | 1.50s | text 'you' in the right margin |
| WARN | safe area | 2.50s | text 'you' in the right margin |
| WARN | captions on screen | 2.52s | caption hard to read or missing on screen (0% read back): 'does that mean' |
| WARN | safe area | 3.50s | text 'you' in the right margin |
| WARN | captions on screen | 4.17s | caption hard to read or missing on screen (33% read back): 'with how you're living?' |
| WARN | safe area | 4.50s | text 'you' in the right margin |
| WARN | captions on screen | 5.82s | caption hard to read or missing on screen (0% read back): 'Let's look at Samson,' |
| WARN | safe area | 6.50s | text 'whe' in the right button column |
| WARN | captions on screen | 7.26s | caption hard to read or missing on screen (0% read back): 'known as the strongest' |
| WARN | captions on screen | 8.57s | caption hard to read or missing on screen (0% read back): 'man in the Bible.' |
| WARN | captions on screen | 9.84s | caption hard to read or missing on screen (0% read back): 'His strength came' |
| WARN | captions on screen | 10.98s | caption hard to read or missing on screen (0% read back): 'from God.' |
| WARN | captions on screen | 16.88s | caption hard to read or missing on screen (0% read back): 'in wait' |
| WARN | pacing | 21.50s | no hard visual change for 8.6s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 22.04s | caption hard to read or missing on screen (0% read back): 'Later, he fell' |
| WARN | captions on screen | 23.24s | caption hard to read or missing on screen (0% read back): 'in love with Delilah,' |
| WARN | captions on screen | 24.66s | caption hard to read or missing on screen (0% read back): 'and the Philistine lords,' |
| WARN | captions on screen | 26.12s | caption hard to read or missing on screen (0% read back): 'Israel's enemies,' |
| WARN | captions on screen | 27.32s | caption hard to read or missing on screen (0% read back): 'offered her silver' |
| WARN | captions on screen | 28.34s | caption hard to read or missing on screen (0% read back): 'to find the secret' |
| WARN | captions on screen | 29.43s | caption hard to read or missing on screen (0% read back): 'of his strength.' |
| WARN | captions on screen | 34.96s | caption hard to read or missing on screen (0% read back): 'And three times' |
| WARN | captions on screen | 36.24s | caption hard to read or missing on screen (0% read back): 'he broke free.' |
| WARN | captions on screen | 37.60s | caption hard to read or missing on screen (0% read back): 'Then he told' |
| WARN | captions on screen | 38.71s | caption hard to read or missing on screen (0% read back): 'her his secret.' |
| WARN | captions on screen | 39.92s | caption hard to read or missing on screen (0% read back): 'While he slept,' |
| WARN | captions on screen | 40.90s | caption hard to read or missing on screen (0% read back): 'she had a man' |
| WARN | captions on screen | 41.62s | caption hard to read or missing on screen (0% read back): 'shave off' |
| WARN | captions on screen | 42.58s | caption hard to read or missing on screen (0% read back): 'his uncut hair,' |
| WARN | captions on screen | 44.28s | caption hard to read or missing on screen (0% read back): 'he was set apart' |
| WARN | captions on screen | 45.18s | caption hard to read or missing on screen (0% read back): 'to God.' |
| WARN | captions on screen | 46.04s | caption hard to read or missing on screen (0% read back): 'She called' |
| WARN | captions on screen | 48.02s | caption hard to read or missing on screen (0% read back): 'He woke up' |
| WARN | captions on screen | 48.78s | caption hard to read or missing on screen (0% read back): 'and said,' |
| WARN | captions on screen | 49.62s | caption hard to read or missing on screen (0% read back): '"I will go out' |
| WARN | captions on screen | 52.08s | caption hard to read or missing on screen (0% read back): 'and shake myself free."' |
| WARN | captions on screen | 57.96s | caption hard to read or missing on screen (0% read back): 'Notice what he said:' |
| WARN | captions on screen | 59.60s | caption hard to read or missing on screen (0% read back): '"as at other times."' |
| WARN | captions on screen | 60.92s | caption hard to read or missing on screen (0% read back): 'It had always' |
| WARN | captions on screen | 62.74s | caption hard to read or missing on screen (0% read back): 'so he assumed' |
| WARN | captions on screen | 63.85s | caption hard to read or missing on screen (0% read back): 'it would work again.' |
| WARN | captions on screen | 65.40s | caption hard to read or missing on screen (0% read back): 'You can be gifted,' |
| WARN | captions on screen | 67.09s | caption hard to read or missing on screen (0% read back): 'lead, and help people.' |
| WARN | captions on screen | 69.98s | caption hard to read or missing on screen (0% read back): 'you doesn't mean' |
| WARN | captions on screen | 70.78s | caption hard to read or missing on screen (0% read back): 'He approves' |
| WARN | captions on screen | 71.78s | caption hard to read or missing on screen (0% read back): 'of how you're living.' |
| WARN | captions on screen | 73.16s | caption hard to read or missing on screen (0% read back): 'Jesus warned' |
| WARN | captions on screen | 85.04s | caption hard to read or missing on screen (33% read back): 'Blinded and brought out' |
| WARN | pacing | 85.20s | no hard visual change for 11.9s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | safe area | 89.50s | text 'remember this' in the right button column |
| WARN | safe area | 90.32s | caption 'please remember me' intrudes on the right button column by 8px |
| WARN | safe area | 90.50s | text 'remember this' in the right button column |
| WARN | safe area | 91.50s | text 'this' in the right button column |
| WARN | safe area | 92.50s | text 'remember this' in the right button column |
| WARN | safe area | 93.50s | text 'remember this' in the right button column |
| WARN | safe area | 94.50s | text 'remember this' in the right button column |
| WARN | safe area | 95.50s | text 'remember this' in the right button column |
| WARN | safe area | 96.50s | text 'remember this' in the right button column |
| WARN | captions on screen | 101.76s | caption hard to read or missing on screen (0% read back): 'Earlier, he had assumed' |
| WARN | captions on screen | 103.18s | caption hard to read or missing on screen (0% read back): 'he would escape.' |
| WARN | captions on screen | 108.40s | caption hard to read or missing on screen (0% read back): 'against the pillars' |
| WARN | captions on screen | 109.56s | caption hard to read or missing on screen (0% read back): 'with all his strength,' |
| WARN | pacing | 110.70s | no hard visual change for 13.2s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 110.86s | caption hard to read or missing on screen (0% read back): 'and the building fell' |
| WARN | captions on screen | 112.10s | caption hard to read or missing on screen (0% read back): 'on the Philistine lords' |
| WARN | captions on screen | 113.59s | caption hard to read or missing on screen (0% read back): 'and everyone inside.' |
| WARN | captions on screen | 115.44s | caption hard to read or missing on screen (0% read back): 'Samson died with them.' |
| WARN | captions on screen | 117.20s | caption hard to read or missing on screen (0% read back): 'And the Bible adds:' |
| WARN | captions on screen | 124.84s | caption hard to read or missing on screen (25% read back): 'Samson's last act began' |
| WARN | pacing | 126.80s | no hard visual change for 8.6s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 127.64s | caption hard to read or missing on screen (0% read back): 'And centuries later,' |
| WARN | captions on screen | 129.22s | caption hard to read or missing on screen (0% read back): 'Hebrews 11 names him' |
| WARN | captions on screen | 130.28s | caption hard to read or missing on screen (0% read back): 'in a list' |
| WARN | captions on screen | 131.08s | caption hard to read or missing on screen (0% read back): 'of people who,' |
| WARN | captions on screen | 132.18s | caption hard to read or missing on screen (0% read back): 'through faith,' |
| WARN | captions on screen | 133.02s | caption hard to read or missing on screen (0% read back): '"were made' |
| WARN | captions on screen | 134.30s | caption hard to read or missing on screen (33% read back): 'strong out of weakness."' |
| WARN | pacing | 135.40s | no hard visual change for 9.5s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 138.82s | caption hard to read or missing on screen (0% read back): 'his strength,' |
| WARN | captions on screen | 139.94s | caption hard to read or missing on screen (0% read back): 'his failures,' |
| WARN | captions on screen | 142.44s | caption hard to read or missing on screen (0% read back): 'at the end? Why?' |
| PASS | format |  | frame 1080x1920 (want 1080x1920) |
| PASS | format |  | 30.00 fps (want 30) |
| PASS | loudness |  | -14.0 LUFS integrated (target -16 to -12) |
| PASS | loudness |  | true peak -1.4 dBTP (max -1.0) |
| PASS | motion |  | something moves in every stretch longer than 1.5s |
| PASS | captions = script |  | all 379 caption words match the script |
| PASS | voice = script |  | 99% of script words heard as written |
| PASS | sync |  | captions within 0.25s of the voice |
| PASS | title |  | title readable in frame one (100% of its words read back) |
| PASS | verse card |  | verse found on screen (100% of words) at 54.0s |
| PASS | verse card |  | verse found on screen (100% of words) at 90.3s |
| PASS | verse card |  | verse found on screen (100% of words) at 119.1s |
