# 09 · Render and QA: from a passed shot list to a reel worth posting

**Use this when** the shot list and voice are approved (Marcus's Oct 28 order put the voice last; since Ep 1, shots are timed to the take, so check the order with him for each episode). The gates (Round 15):
- no full render before Marcus has seen the shot list and a motion draft;
- "passes the checker" is not "good".

## 1. Order of work

1. **The motion draft** (half resolution, the first 30 s, then any changed section):
   ```
   export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
   cd ep*/film*
   node engine/render.js clip 0 30 2 --draft
   ```
   Watch it, measure it (`python3 ../../tools/reference_study/beatclock.py out/<clip>.mp4`), and send it to Marcus. He judges motion from video, never from stills.
2. **Stills for fixes:** `node engine/render.js stills 12.3 15.8`. Use them only to check one frame (composition, text, safe areas).
3. **The full render, in parts** (one part per command, because background jobs are capped at 2 h):
   ```
   node engine/render.js clip A B 2 --hq      # → out/parts/
   ```
   Then join the parts. About 0.17–0.33 frames/s on this machine, so a 120 s reel takes several hours: plan it, and render overnight only after approval.
4. **The soundtrack:** `LUFS=-14 node song.js` with the approved voice, then mux it.
5. **Captions:** `out/<ep>.srt` comes from the VO text plus word times. Never retype it.

## 2. The QA loop (after every render)

1. **The checker:**
   ```
   python3 fw_check.py video --video out/<ep>.mp4 --script episode.md --subs out/<ep>.srt --out qa/video
   ```
   It checks:
   - format, runtime and loudness;
   - captions word for word and in sync with the voice;
   - the voice heard against the script;
   - the title in frame one and the safe areas;
   - verse cards;
   - frozen frames;
   - direction: shot rhythm, the **visual beat clock** (a WARN when over 30% of the runtime is still, plus one WARN for each still stretch over 6 s), the hook, and the time after the last word.
2. **The review pack:**
   ```
   python3 toolkit_page/fw_review.py --video out/<ep>.mp4 --round N --subs out/<ep>.srt --shots qa/video/shots.json --out qa/review
   ```
   It produces contact sheets, the fastest-moment strips, a phone-size test, the safe zones, caption swaps and three frames per shot.
3. **The critic:** hand `toolkit_page/fw_critic.md`, the episode folder and N to a fresh agent that has not seen the code. It scores 9 criteria out of 10 with automatic caps, checks 23 known failure modes and names the 3 worst problems.
4. **Fix the 3 worst problems** plus every checker FAIL in the source (never patch the video), re-render the changed parts, and repeat.
5. **Done when:**
   - the checker shows 0 FAIL;
   - every critic score is ≥ 8;
   - at least 3 rounds have run;
   - Marcus has watched the motion draft;
   - the beat clock is within the Lintel range (a change every ~2 s, ≤ 30% still, at most one stretch over 6 s).

## 3. What the numbers should look like

| Measure | Target | Ep 1 v57 |
|---|---|---|
| Runtime | ≤ 135 s (ASK THE TEXT), ideally 90–120 s | 149.9 s |
| Speech | ≥ 2.6 words/s whole, ~2.7 over the voice | 2.53 / 2.65 |
| Median shot | 3–5 s | 3.8 s |
| Visual beats | one every ~2 s; ≤ 30% still; ≤ 1 stretch over 6 s | 2.5 s; 47%; 4 stretches over 6 s |
| First change | ≤ 1.3 s | ok |
| Question spoken by | ≤ 5.5 s | 4.8 s |
| After the last word | ≤ 4.5 s | 6.4 s |
| Loudness | −14 LUFS, true peak ≤ −1 dBTP | ok |

## 4. Known engine pitfalls (from Ep 1)

- **Background jobs stop at 2 h.** Render one part per job and check that the part file is complete before joining.
- **Never `pkill -f` a pattern that matches your own shell;** kill by PID.
- **`cue()` matches the exact word first,** then a prefix ('"O' once matched "out"). Check `CUE_LOG` when a beat is off.
- **Text in the side margins or the right button column:** narrow cards (`maxW`).
- **Every frame must be a pure function of t:** seeded random only, no state carried between frames.

## 5. Handing over

Send Marcus:
- the MP4, the .srt, and the checker's verdict line;
- the critic's scores;
- the beat-clock chart (rendered vs the Lintel reference);
- a one-line explanation for every WARN left.

Never call it "final" before he has watched it.
