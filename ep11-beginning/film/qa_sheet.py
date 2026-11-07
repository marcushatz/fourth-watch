#!/usr/bin/env python3
"""QA contact sheets from the finished video: one frame every --every seconds, labelled with time and shot.

    python3 film/qa_sheet.py film/out/genesis_first_cut.mp4 --every 1.5 --out film/out/qa
"""
import argparse
import json
from pathlib import Path

import cv2
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
TIMING = json.load(open(HERE / "timing.json"))


def shot_at(t):
    sid = TIMING["shots"][0]["id"]
    for s in TIMING["shots"]:
        if s["start"] <= t:
            sid = s["id"]
    return sid


def main():
    a = argparse.ArgumentParser()
    a.add_argument("video")
    a.add_argument("--every", type=float, default=1.5)
    a.add_argument("--out", default=str(HERE / "out" / "qa"))
    a.add_argument("--cols", type=int, default=8)
    a.add_argument("--per", type=int, default=32)
    o = a.parse_args()
    out = Path(o.out)
    out.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(o.video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    times = [k * o.every for k in range(int(n / fps / o.every) + 1)]
    w, h = 216, 384
    for page in range(0, len(times), o.per):
        ts = times[page:page + o.per]
        rows = (len(ts) + o.cols - 1) // o.cols
        sheet = Image.new("RGB", (o.cols * (w + 6) + 6, rows * (h + 26) + 6), (22, 20, 18))
        d = ImageDraw.Draw(sheet)
        for i, t in enumerate(ts):
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(t * fps))
            ok, f = cap.read()
            if not ok:
                continue
            im = Image.fromarray(cv2.resize(f, (w, h), interpolation=cv2.INTER_AREA)[..., ::-1])
            x, y = 6 + (i % o.cols) * (w + 6), 6 + (i // o.cols) * (h + 26)
            sheet.paste(im, (x, y))
            d.text((x + 3, y + h + 5), f"{t:6.1f}s  {shot_at(t)}", fill=(230, 220, 200))
        sheet.save(out / f"sheet_{page // o.per + 1}.jpg", quality=86)
        print(out / f"sheet_{page // o.per + 1}.jpg")


if __name__ == "__main__":
    main()
