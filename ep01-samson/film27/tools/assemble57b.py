#!/usr/bin/env python3
"""Assemble Ep 1 (v57, final): parts P1-P5 with the two re-rendered stretches spliced in by frame number
(Q0 = the opening title at 64 px, inside the side margins; Q1 = the narrower 16:28 verse card, 88.2-97.07 s; Q2 = the shorter end-card tail, 142.5-END_T), then the outro
(fw_final_outro_v3.mp4 from 0.4 s to 6.0 s), with out/soundtrack_v57.wav -> out/fourth-watch-ep1-samson-v57-final.mp4"""
import math, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
f = lambda t: math.ceil(float(t) * FPS - 1e-6)
probe = lambda p: int(subprocess.check_output(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0",
                                               "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", str(p)]).decode().strip())
rng = {}
for line in (ROOT / "out" / "parts57.txt").read_text().split("\n"):
    if line.strip():
        n, a, b = line.split(); rng[n] = (f(a), f(b))
P = lambda n: ROOT / "out" / "parts57" / f"{n}.mp4"
for n, (a, b) in rng.items():
    got = probe(P(n))
    if got != b - a: sys.exit(f"{n}: {got} frames, expected {b - a}")

# (file, first local frame, end local frame) in film order; every piece is checked to butt against the next
pieces = []
def take(n, ga, gb):  # global frame range [ga, gb) from part n
    a0 = rng[n][0]; pieces.append((P(n), ga - a0, gb - a0, ga, gb))
take("Q0", *rng["Q0"]); take("P1", rng["Q0"][1], rng["P1"][1]); take("P2", *rng["P2"]); take("P3", *rng["P3"])
take("P4", rng["P4"][0], rng["Q1"][0]); take("Q1", *rng["Q1"]); take("P4", rng["Q1"][1], rng["P4"][1])
take("P5", rng["P5"][0], rng["Q2"][0]); take("Q2", *rng["Q2"])
for x, y in zip(pieces, pieces[1:]):
    assert x[4] == y[3], f"gap between {x[0].name} and {y[0].name}"
assert pieces[0][3] == 0
film_frames = pieces[-1][4]
outro = ROOT.parent.parent / "brand" / "logo" / "fw_final_outro_v3.mp4"
OUT_A, OUT_B = 12, 180                      # 0.4 s .. 6.0 s of the outro
audio = ROOT / "out" / "soundtrack_v57.wav"
final = ROOT / "out" / "fourth-watch-ep1-samson-v57-final.mp4"

inputs, chains = [], []
for i, (p, a, b, _, _) in enumerate(pieces):
    inputs += ["-i", str(p)]
    chains.append(f"[{i}:v]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS,format=yuv420p,setsar=1[v{i}]")
k = len(pieces)
inputs += ["-i", str(outro)]
chains.append(f"[{k}:v]trim=start_frame={OUT_A}:end_frame={OUT_B},setpts=PTS-STARTPTS,scale=1080:1920,format=yuv420p,setsar=1[v{k}]")
inputs += ["-i", str(audio)]
fc = ";".join(chains) + ";" + "".join(f"[v{i}]" for i in range(k + 1)) + f"concat=n={k + 1}:v=1:a=0[v]"
subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", fc, "-map", "[v]", "-map", f"{k + 1}:a",
                       "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS),
                       "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(final)])
n = film_frames + OUT_B - OUT_A
print(f"{final} ({film_frames} film frames + {OUT_B - OUT_A} outro frames = {n / FPS:.2f}s)")
