# Reference study: measure how another channel directs its reels

This folder holds the method behind `research/direction_rules.md`. Use it whenever a channel or reel is worth learning from, so new rules come from measured shots rather than impressions.

## What it measures, per shot

- Start time and length.
- Camera travel: zoom % and pan % of the frame height across the shot.
- Own motion: the share of tracked points that still move once the camera move is removed. This means characters and effects moving.
- The words spoken over the shot, taken from the platform's captions.
- A strip of frames (after the cut, the middle, before the next cut), so you can judge what happens, the shot size and angle, the camera move and the transition.
- **The beat clock:** how often something visibly changes below the captions, and how much of the runtime sits in stretches of over 4 s with no change. Frequent change was the clearest difference between hits and lows on the other two channels (judged) and between Lintel's reels and Ep 1 v57 (measured).

## Two ways in

### 1. A video file you have (a screen recording, or our own render)

```
python3 shotstats.py VIDEO NAME [crop w:h:x:y | -] [from_s to_s]   # -> NAME_shots.json + a printed table
python3 strips.py VIDEO NAME_shots.json [crop | -] OUT.png FROM_S TO_S # -> start/middle/end strip per shot
python3 beatclock.py VIDEO [--crop w:h:x:y] [--json out.json]          # -> beats, beat interval, still stretches over 4 s
python3 audiostudy.py ...                                               # -> bass, floor and onset levels against the voice band
```

- **Screen recordings of Instagram on a desktop:** crop to the video area first. For the 2510×1632 recordings in `research/lintel_ref/`, the crop is `900:1340:346:140`.
- **How it works:** it reads frames at 30 fps, 216×384. Cuts come from histogram and mean-difference spikes. Motion comes from Lucas-Kanade feature tracking plus a RANSAC similarity fit.

### 2. A public YouTube Short in the built-in browser (no download)

1. Open the Short in the browser pane: `preview_start` with the URL, then wait about 3 s.
2. Paste the whole of `fw_shot_probe.js` into `javascript_tool`. It defines `window.__fwProbe`. Re-inject it after every navigation.
3. Run `await __fwProbe.run(); __fwProbe.state.shots`. It seeks through the clip at 10 fps and needs no playback, so it works in a hidden pane. Each row is `{t, len, zoom, pan, own}`. Then `__fwProbe.beats()` gives the beat clock (approximate at the probe's 72×128 size).
4. Run `await __fwProbe.sheet(p)` for p = 0..pages-1 and screenshot each page. A page shows 6 shots with 3 frames each, labelled `#n start len z p m`. Call `__fwProbe.hide()` when done.
5. For the narration, read the caption in the frames, or use YouTube's own timed captions.

**Caveats:**
- The browser probe searches motion at 72×128. It catches big moves and cuts, but reads slow drifts under about 1% per 0.1 s as 0. Judge drifts from the strips.
- Shots of 0.2–0.3 s with high own-motion are flash or whip transitions, not shots.
- Soft crossfades can hide a cut. Check every shot of 5 s or longer against its strip.
- **Channels that change pictures without camera cuts.** Bible Animations slides figures in and out over a held set; BibleProject morphs one shape into the next scene and travels the camera for up to 20 s. The cut detector misses these, so also:
  - run a colour-histogram scene check (a 64-bin RGB histogram at 10 fps; a change is a peak ≥ 0.30 in the distance between frames 0.5 s apart);
  - judge from frame grids at 1–1.3 s for the whole video and 0.25 s for the hook.
  - Count a figure or object entering a held set as a **beat**, not a shot.
- Instagram needs a sign-in. The same reels are often on the channel's YouTube Shorts, which needs none. Use Instagram only for view counts, and only in a browser where Marcus is already signed in. Never sign in for him.

## Writing it up

Follow the format of `research/lintel_ref/yt/<videoId>.md`:

- **Header:** title, views, duration, shot count, median and mean shot length, share of shots ≤3 s, longest shot.
- **Shot table:** # | start | length | narration | what is shown (who moves, what changes) | size and angle | camera move | transition | text on screen.
- **Techniques:** 6–10 time-stamped bullets naming the devices.

Then add the cross-video rules to a `_patterns.md` that separates what was measured from what was inferred. Put any new binding rule into `research/direction_rules.md`, and into the checkers if it can be measured.

## Studying the words, not just the pictures

`research/script_rules_from_hits.md` shows the method for scripts:
- code every second of runtime as hook, framing, retelling, lesser-known story, evidence, answer, viewer application or close;
- time the question, the turn, the first answer piece and the core answer;
- count the "you" lines, the outside authorities and the hook echo.

Use YouTube's timed captions where they exist. Otherwise, read the burned-in captions from 1 fps frame sheets.

## Studies so far

- **The Lintel Network:** 14 Shorts (Oct 31, 2026).
  - The 12 YouTube Shorts are in `research/lintel_ref/yt/`.
  - Suffering and Methuselah are in `research/lintel_ref/` (ref1/ref2 screen recordings).
  - Their 11-minute long-form episode has been read as a transcript only.
  - Scripts for all 14 were coded in `research/script_rules_from_hits.md`.
- **Bible Animations and BibleProject:** 10 Shorts, 6 hits and 4 lows (Oct 31, 2026), in `research/other_ref/`, with the cross-check against Lintel in `_crosscheck.md`. Each rule in `direction_rules.md` is tagged [ALL] or [HOUSE] from this.
- **Beat-clock calibration:** Lintel Methuselah 2.1 s / 19%, Suffering 2.4 s / 21%; Ep 1 v57 2.5 s / 47%.
