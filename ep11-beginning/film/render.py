#!/usr/bin/env python3
"""Render the Genesis film's shots to clips (one MP4 per shot, with handles for transitions).

    python3 film/render.py [--only S01,S02] [--still 0.5] [--jobs 2]
--still t writes one JPEG per shot at that fraction of the shot instead of a clip (for checking).
"""
import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
OUT = HERE / "out"


def registry():
    import shots1
    reg = dict(shots1.SHOTS)
    for mod in ("shots2", "shots3"):
        try:
            reg.update(__import__(mod).SHOTS)
        except ImportError:
            pass
    return reg


def render_shot(sid, still=None, fps=24):
    import numpy as np
    import cv2
    from core import FPS, compose
    reg = registry()
    t0 = time.time()
    shot = reg[sid]()
    build = time.time() - t0
    (OUT / "stills").mkdir(parents=True, exist_ok=True)
    if still is not None:
        img = compose(shot, shot.dur * still, 0)
        cv2.imwrite(str(OUT / "stills" / f"{sid}.jpg"), (np.clip(img, 0, 1)[..., ::-1] * 255 + .5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
        return sid, build, time.time() - t0, 1
    (OUT / "clips").mkdir(parents=True, exist_ok=True)
    n0 = -int(round(shot.pre * FPS))
    n1 = int(round((shot.dur + shot.post) * FPS)) + 1
    from paper import RH, RW
    path = OUT / "clips" / f"{sid}.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{RW}x{RH}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "veryfast", "-crf", "11", "-pix_fmt", "yuv420p", str(path)], stdin=subprocess.PIPE)
    for n in range(n0, n1):
        img = compose(shot, n / FPS, n - n0)
        ff.stdin.write((np.clip(img, 0, 1) * 255 + .5).astype(np.uint8).tobytes())
    ff.stdin.close()
    ff.wait()
    (OUT / "clips" / f"{sid}.json").write_text(f'{{"first": {n0}, "frames": {n1 - n0}}}')
    return sid, build, time.time() - t0, n1 - n0


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--only", default="")
    a.add_argument("--still", type=float, default=None)
    a.add_argument("--jobs", type=int, default=2)
    o = a.parse_args()
    ids = o.only.split(",") if o.only else sorted(registry())
    from multiprocessing import Pool
    with Pool(o.jobs, maxtasksperchild=1) as pool:
        for sid, b, tt, n in pool.imap_unordered(lambda_ := _run, [(i, o.still) for i in ids]):
            print(f"{sid}: build {b:.1f}s, total {tt:.1f}s, {n} frames, {tt / max(n, 1):.2f}s/frame", flush=True)


def _run(args):
    try:
        return render_shot(*args)
    except Exception as e:  # report and carry on with the other shots
        import traceback
        traceback.print_exc()
        return args[0], 0, 0, 0


if __name__ == "__main__":
    main()
