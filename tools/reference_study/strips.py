#!/usr/bin/env python3
"""Contact strips: three frames (after the cut, middle, before the next cut) for every shot in a NAME_shots.json from shotstats.py.
usage: strips.py VIDEO NAME_shots.json CROP(w:h:x:y or -) OUT.png FROM_S TO_S"""
import json, subprocess, sys
from PIL import Image, ImageDraw
vid, js, crop, out, a, b = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]), float(sys.argv[6])
shots = [s for s in json.load(open(js))['shots'] if s['len'] >= 0.5 and a <= s['t'] < b]
W, H = 150, 224
rows = []
for s in shots:
    ts = [s['t'] + 0.1, s['t'] + s['len'] / 2, s['t'] + s['len'] - 0.15]
    ims = []
    for t in ts:
        vf = (f"crop={crop}," if crop != '-' else '') + f"scale={W}:{H}"
        r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", vid, "-frames:v", "1", "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
        ims.append(Image.frombytes('RGB', (W, H), r))
    rows.append((s, ims))
cols = 4
sheet = Image.new('RGB', (cols * (3 * W + 12), ((len(rows) + cols - 1) // cols) * (H + 18)), 'black'); d = ImageDraw.Draw(sheet)
for k, (s, ims) in enumerate(rows):
    x0, y0 = (k % cols) * (3 * W + 12), (k // cols) * (H + 18)
    for j, im in enumerate(ims): sheet.paste(im, (x0 + j * W, y0 + 16))
    d.text((x0 + 3, y0 + 2), f"{s['t']:.1f}s  {s['len']:.1f}s  z{s['zoom_pct']:+.0f} p{s['pan_pct']:.0f}", fill='yellow')
sheet.save(out)
print(len(rows), 'shots')
