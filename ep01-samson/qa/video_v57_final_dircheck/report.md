# Fourth Watch QA — video

**Verdict: FAIL** · 1 fail · 40 warn · 16 pass

| Fact | Value |
| --- | --- |
| file | fourth-watch-ep1-samson-v57-final.mp4 |
| size | 1080x1920 |
| fps | 30.00 |
| duration | 149.92s |
| codec | h264 |
| audio | aac |
| loudness | -14.0 LUFS |
| true peak | -1.3 dBTP |
| visual changes | 34 |
| first/last frame match | -0.05 |
| caption chunks | 118 |
| speech starts | 0.30s |
| words heard | 380 |
| voice matches script | 99% of words heard as written |
| caption timing | median +0.02s vs voice (118 chunks measured) |
| shots | 28 shots + 6 short transitions; median 3.8s; 32% are 3–5 s; longest 20.0s |
| quiet shots | 31% of the runtime (11 shots): 11.5s+3.2, 30.1s+1.6, 31.9s+2.4, 37.0s+5.6, 42.6s+3.1, 53.4s+3.8, 81.7s+3.5, 97.1s+3.8, 123.8s+3.0, 127.3s+8.0, 135.5s+8.8 |

| Level | Check | Time | Finding |
| --- | --- | --- | --- |
| FAIL | tail |  | closing segment 14.3s from the last line at 135.6s to the end (hits 7.3–8.7 s: a ~5 s question card, then a 2–3 s logo) |
| WARN | runtime |  | 149.9s (target 85–135s) |
| WARN | loop |  | last frame vs first frame similarity -0.05 (want ≥ 0.75 so the replay loops) |
| WARN | captions on screen | 2.52s | caption hard to read or missing on screen (0% read back): 'does that mean' |
| WARN | captions on screen | 4.17s | caption hard to read or missing on screen (33% read back): 'with how you're living?' |
| WARN | captions on screen | 5.82s | caption hard to read or missing on screen (0% read back): 'Let's look at Samson,' |
| WARN | safe area | 6.50s | text 'whe' in the right button column |
| WARN | captions on screen | 7.26s | caption hard to read or missing on screen (0% read back): 'known as the strongest' |
| WARN | captions on screen | 8.57s | caption hard to read or missing on screen (0% read back): 'man in the Bible.' |
| WARN | captions on screen | 9.84s | caption hard to read or missing on screen (0% read back): 'His strength came' |
| WARN | captions on screen | 10.98s | caption hard to read or missing on screen (0% read back): 'from God.' |
| WARN | pacing | 21.50s | no hard visual change for 8.6s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 42.58s | caption hard to read or missing on screen (0% read back): 'his uncut hair,' |
| WARN | captions on screen | 57.96s | caption hard to read or missing on screen (0% read back): 'Notice what he said:' |
| WARN | captions on screen | 59.60s | caption hard to read or missing on screen (0% read back): '"as at other times."' |
| WARN | captions on screen | 62.74s | caption hard to read or missing on screen (0% read back): 'so he assumed' |
| WARN | captions on screen | 65.40s | caption hard to read or missing on screen (0% read back): 'You can be gifted,' |
| WARN | captions on screen | 67.09s | caption hard to read or missing on screen (0% read back): 'lead, and help people.' |
| WARN | captions on screen | 69.98s | caption hard to read or missing on screen (0% read back): 'you doesn't mean' |
| WARN | captions on screen | 70.78s | caption hard to read or missing on screen (0% read back): 'He approves' |
| WARN | captions on screen | 71.78s | caption hard to read or missing on screen (0% read back): 'of how you're living.' |
| WARN | captions on screen | 85.04s | caption hard to read or missing on screen (33% read back): 'Blinded and brought out' |
| WARN | pacing | 85.20s | no hard visual change for 11.9s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | rhythm | 85.20s | one shot runs 11.9s: only a verse card, one unbroken camera journey or a diagram may pass 10 s; otherwise cut it on its clauses |
| WARN | rhythm | 103.80s | one shot runs 20.0s: only a verse card, one unbroken camera journey or a diagram may pass 10 s; otherwise cut it on its clauses |
| WARN | pacing | 110.70s | no hard visual change for 13.2s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 113.59s | caption hard to read or missing on screen (0% read back): 'and everyone inside.' |
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
| WARN | pacing | 135.40s | no hard visual change for 9.0s (playbook: new scene every 4–6s; soft dissolves may not register) |
| WARN | captions on screen | 138.82s | caption hard to read or missing on screen (0% read back): 'his strength,' |
| WARN | captions on screen | 139.94s | caption hard to read or missing on screen (0% read back): 'his failures,' |
| WARN | captions on screen | 142.44s | caption hard to read or missing on screen (0% read back): 'at the end? Why?' |
| PASS | format |  | frame 1080x1920 (want 1080x1920) |
| PASS | format |  | 30.00 fps (want 30) |
| PASS | loudness |  | -14.0 LUFS integrated (target -16 to -12) |
| PASS | loudness |  | true peak -1.3 dBTP (max -1.0) |
| PASS | motion |  | something moves in every stretch longer than 1.5s |
| PASS | captions = script |  | all 379 caption words match the script |
| PASS | voice = script |  | 99% of script words heard as written |
| PASS | sync |  | captions within 0.25s of the voice |
| PASS | title |  | title readable in frame one (100% of its words read back) |
| PASS | verse card |  | verse found on screen (100% of words) at 54.0s |
| PASS | verse card |  | verse found on screen (100% of words) at 90.3s |
| PASS | verse card |  | verse found on screen (100% of words) at 119.1s |
| PASS | rhythm |  | median shot 3.8s, 32% of shots 3–5 s (Lintel median 3.8 s; hits keep half their shots at 3–5 s) |
| PASS | rhythm |  | 28 shots for 31 spoken sentences = 0.90 (Lintel 1.02: one new picture per sentence) |
| PASS | quiet shots |  | 31% of the runtime sits in shots where nothing moves on its own and the camera arrives nowhere new (Lintel Suffering 26%); in the visual review, confirm each listed shot still shows its line (a card, a label landing, a light change) |
| PASS | hook |  | the opening question is fully spoken at 4.8s (hits 2.8–5.5 s) |
