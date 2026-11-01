#!/usr/bin/env python3
"""Assemble Ep 1 (script v57): the five rendered parts (out/parts57/P1..P5.mp4, listed in out/parts57.txt),
then the outro (brand/logo/fw_final_outro_v3.mp4), with the v57 soundtrack, into out/fourth-watch-ep1-samson-v57.mp4.
Each part's frame count is checked against its time range so the cut stays frame-accurate with the voice."""
import math, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
f = lambda t: math.ceil(float(t) * FPS - 1e-6)
probe = lambda p: int(subprocess.check_output(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0",
                                               "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(p)]).decode().strip())
outro = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent.parent / "brand" / "logo" / "fw_final_outro_v3.mp4"
audio = ROOT / "out" / "soundtrack_v57.wav"
final = ROOT / "out" / "fourth-watch-ep1-samson-v57.mp4"

inputs, chains, total = [], [], 0
for line in (ROOT / "out" / "parts57.txt").read_text().split("\n"):
    if not line.strip():
        continue
    name, a, b = line.split()
    p = ROOT / "out" / "parts57" / f"{name}.mp4"
    n, want = probe(p), f(b) - f(a)
    if n != want:
        sys.exit(f"{name}: {n} frames, expected {want}")
    inputs += ["-i", str(p)]
    chains.append(f"[{len(chains)}:v]setpts=PTS-STARTPTS,fps={FPS},format=yuv420p,setsar=1[v{len(chains)}]")
    total += n
no = probe(outro)
inputs += ["-i", str(outro)]
k = len(chains)
chains.append(f"[{k}:v]setpts=PTS-STARTPTS,scale=1080:1920,fps={FPS},format=yuv420p,setsar=1[v{k}]")
inputs += ["-i", str(audio)]
fc = ";".join(chains) + ";" + "".join(f"[v{i}]" for i in range(k + 1)) + f"concat=n={k + 1}:v=1:a=0[v]"
cmd = ["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", fc, "-map", "[v]", "-map", f"{k + 1}:a",
       "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS),
       "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(final)]
subprocess.check_call(cmd)
print(f"{final} ({total} episode frames + {no} outro frames = {(total + no) / FPS:.2f}s)")
