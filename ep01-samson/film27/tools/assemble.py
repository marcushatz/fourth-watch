#!/usr/bin/env python3
"""Assemble the full silent cut from the rendered parts (A 0-55 s, B 55-110 s, C 110-end) plus the re-rendered
segments (out/segments.txt -> out/parts/seg_<name>.mp4), frame-accurately, into out/video.mp4.
Each source range is cut by frame number with trim, then everything is concatenated and encoded once."""
import math, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
P = ROOT / "out" / "parts"
FPS = 30
f = lambda t: math.ceil(float(t) * FPS - 1e-6)
parts = [("A_0-55.mp4", 0, f(55)), ("B_55-110.mp4", f(55), f(110)), ("C_110-162.75.mp4", f(110), None)]
probe = lambda p: int(subprocess.check_output(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(p)]).decode().strip())
srcs = []  # (file, global_start, global_end)
for name, a, b in parts:
    n = probe(P / name); srcs.append((P / name, a, a + n))
total = srcs[-1][2]
segs = []
for line in (ROOT / "out" / "segments.txt").read_text().split("\n"):
    if not line.strip(): continue
    name, a, b = line.split()
    p = P / f"seg_{name}.mp4"
    if not p.exists(): sys.exit(f"missing {p}")
    fa, fb = f(a), f(b); n = probe(p)
    assert n == fb - fa, f"{name}: {n} frames, expected {fb - fa}"
    segs.append((p, fa, fb))
segs.sort(key=lambda s: s[1])
# timeline: walk frames, use a segment where one covers, else the part
pieces, cur = [], 0
for p, fa, fb in segs + [(None, total, total)]:
    while cur < fa:
        src = next(s for s in srcs if s[1] <= cur < s[2]); end = min(fa, src[2])
        pieces.append((src[0], cur - src[1], end - src[1])); cur = end
    if p is not None:
        pieces.append((p, 0, fb - fa)); cur = fb
inputs = sorted({str(p[0]) for p in pieces})
idx = {s: i for i, s in enumerate(inputs)}
fg, labels = [], []
for k, (src, a, b) in enumerate(pieces):
    fg.append(f"[{idx[str(src)]}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[v{k}]"); labels.append(f"[v{k}]")
fg.append("".join(labels) + f"concat=n={len(labels)}:v=1:a=0[out]")
cmd = ["ffmpeg", "-v", "error", "-y"] + sum([["-i", s] for s in inputs], []) + ["-filter_complex", ";".join(fg), "-map", "[out]",
       "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", "-r", str(FPS), "-movflags", "+faststart", str(ROOT / "out" / "video.mp4")]
print(f"{len(pieces)} pieces, {total} frames")
for p in pieces: print(f"  {Path(p[0]).name}: {p[1]}-{p[2]}")
subprocess.check_call(cmd)
n = probe(ROOT / "out" / "video.mp4"); print(f"out/video.mp4: {n} frames ({n / FPS:.2f} s)")
assert n == total, "frame count mismatch"
