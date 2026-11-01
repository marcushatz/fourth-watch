#!/usr/bin/env python3
"""Beat clock: how often the picture visibly changes, below the caption band.

The clearest measurable difference between hit and low reels on three channels (Oct 31, 2026; research/direction_rules.md §1):
- the hits change something on screen every ~1.2-2.3 s;
- the lows hold still pictures for 6-15 s.

Usage:
    python3 beatclock.py VIDEO [--crop w:h:x:y] [--band 0.30] [--from S] [--to S] [--json out.json]

Use --crop for screen recordings: the Lintel recordings in research/lintel_ref/ use 900:1340:346:140.

Method (the same as fw_check.py video, "visual beats"):
- Read 10 fps grey frames at 216x384.
- md = the mean absolute difference between frames, below the top `band` of the frame (the captions are excluded).
- A beat is a local peak of md above max(0.8, 1.8 x its rolling 3 s median), at least 0.5 s after the last beat.

Calibration:
| Reel | Beat every | Runtime in gaps over 4 s | Longest gap |
| --- | --- | --- | --- |
| Lintel Methuselah (325K) | 2.1 s | 19% | 5.7 s |
| Lintel Suffering (528K) | 2.4 s | 21% | 7.4 s |
| Fourth Watch Ep 1 v57 | 2.5 s | 47% | 8.5 s |

Continuous motion (a steady walk, a slow drift) raises the median rather than making peaks, so it is not counted. That
is deliberate: a beat is a *new* thing happening.
"""
import argparse, json, subprocess, sys
import numpy as np

FPS = 10


def frame_diffs(video, crop=None, band=0.30):
    vf = (f"crop={crop}," if crop else "") + f"fps={FPS},scale=216:384,format=gray"
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", vf, "-f", "rawvideo", "-"], capture_output=True)
    F = np.frombuffer(r.stdout, np.uint8)
    if not F.size:
        sys.exit(f"could not read frames from {video}: {r.stderr.decode()[:300]}")
    F = F.reshape(-1, 384, 216); y0 = int(384 * band)
    return np.array([0] + [np.abs(F[i, y0:].astype(np.int16) - F[i - 1, y0:]).mean() for i in range(1, len(F))])


def visual_beats(md, k=1.8, floor=0.8, gap=0.5):
    ev = []
    for i in range(1, len(md) - 1):
        loc = float(np.median(md[max(0, i - 15):i + 15])) + 0.05
        if md[i] >= md[i - 1] and md[i] >= md[i + 1] and md[i] > max(floor, k * loc) and (not ev or i - ev[-1] >= gap * FPS):
            ev.append(i)
    return [i / FPS for i in ev]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video"); ap.add_argument("--crop"); ap.add_argument("--band", type=float, default=0.30)
    ap.add_argument("--from", dest="t0", type=float, default=0.0); ap.add_argument("--to", dest="t1", type=float)
    ap.add_argument("--json")
    a = ap.parse_args()
    md = frame_diffs(a.video, a.crop, a.band)
    dur = len(md) / FPS
    t0, t1 = a.t0, min(a.t1 or dur, dur)
    ev = [t for t in visual_beats(md) if t0 <= t <= t1]
    gaps = np.diff(np.r_[t0, ev, t1]); starts = np.r_[t0, ev]
    span = max(1e-6, t1 - t0)
    dead = float(gaps[gaps > 4].sum()) / span
    print(f"{a.video}: {len(ev)} beats in {span:.1f} s = one every {span / max(1, len(ev)):.2f} s; median gap {np.median(gaps):.2f} s")
    print(f"runtime in gaps over 4 s: {dead:.0%} (hits ~16-21%; Ep 1 v57 47%); longest gap {gaps.max():.1f} s")
    for s, g in zip(starts, gaps):
        if g > 4: print(f"  {s:6.1f} s  {g:4.1f} s with no beat")
    if a.json:
        json.dump({"video": a.video, "beats": ev, "dead_share": dead, "longest": float(gaps.max())}, open(a.json, "w"), indent=1)


if __name__ == "__main__":
    main()
