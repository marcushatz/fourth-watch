#!/usr/bin/env python3
"""Cut the rendered shots together with transitions, typography and the mix into the final 1080 x 1920 MP4.

    python3 film/assemble.py [--out film/out/genesis_first_cut.mp4] [--from 0 --to 132] [--preview]
"""
import argparse
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import edit  # noqa: E402
import text as T  # noqa: E402

OUT = HERE / "out"
FPS = 24
W, H = 1080, 1920
TIMING = json.load(open(HERE / "timing.json"))
SHOTS = TIMING["shots"]
IDS = [s["id"] for s in SHOTS]
START = {s["id"]: (0.0 if i == 0 else s["start"]) for i, s in enumerate(SHOTS)}
LOCAL0 = {s["id"]: s["start"] for s in SHOTS}          # the shot's own t = 0 (its first word)
END = {s["id"]: (SHOTS[i + 1]["start"] if i + 1 < len(SHOTS) else TIMING["duration"]) for i, s in enumerate(SHOTS)}


class Clip:
    def __init__(self, sid):
        meta = json.loads((OUT / "clips" / f"{sid}.json").read_text())
        self.first, self.frames = meta["first"], meta["frames"]
        self.cap = cv2.VideoCapture(str(OUT / "clips" / f"{sid}.mp4"))
        self.pos, self.last = -1, None

    def at(self, t_local):
        i = int(round(t_local * FPS)) - self.first
        i = int(np.clip(i, 0, self.frames - 1))
        if i < self.pos:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            self.pos = i - 1
        while self.pos < i:
            ok, f = self.cap.read()
            if not ok:
                break
            self.last, self.pos = f, self.pos + 1
        return self.last


def word_time(sid, word, n=0, end=False):
    s = next(x for x in SHOTS if x["id"] == sid)
    hits = [w for w in s["words"] if w["w"].lower().strip('.,?!"').startswith(word.lower())]
    h = hits[min(n, len(hits) - 1)]
    return h["end"] if end else h["start"]


def torn_mask(x_edge, seed=4):
    """A vertical torn-paper edge at x (pixels): 1 to the right of the edge."""
    r = np.random.default_rng(seed)
    ys = np.arange(H)
    wob = np.interp(ys, np.linspace(0, H, 40), r.normal(0, 9, 40)) + np.interp(ys, np.linspace(0, H, 300), r.normal(0, 2.5, 300))
    xs = np.arange(W)[None, :]
    m = np.clip((xs - (x_edge + wob[:, None])) / 1.5 + .5, 0, 1)
    return m.astype(np.float32)


def blend(sid_a, sid_b, kind, u, fa, fb):
    """u goes 0 -> 1 across the transition."""
    if kind == "dissolve":
        e = u * u * (3 - 2 * u)
        return (fa.astype(np.float32) * (1 - e) + fb.astype(np.float32) * e).astype(np.uint8)
    if kind == "dip":
        if u < .5:
            k = 1 - u * 2
            return (fa.astype(np.float32) * k ** 1.5).astype(np.uint8)
        k = (u - .5) * 2
        return (fb.astype(np.float32) * k ** 1.2).astype(np.uint8)
    if kind == "paper":
        # the next scene arrives as a new sheet sliding over from the right, its torn edge casting a shadow
        e = u * u * (3 - 2 * u)
        xe = W * (1 - e) - 30
        m = torn_mask(xe)
        sh = cv2.GaussianBlur(np.roll(m, -14, 1), (0, 0), 16) * (1 - m) * .5
        shift = int(W * (1 - e) * .25)
        fb2 = np.roll(fb, shift, 1) if shift else fb
        out = fa.astype(np.float32) * (1 - sh[..., None])
        lit = fb2.astype(np.float32) * (1 + .06 * (np.clip(1 - np.abs(np.arange(W) - xe) / 10, 0, 1))[None, :, None])
        out = out * (1 - m[..., None]) + lit * m[..., None]
        return np.clip(out, 0, 255).astype(np.uint8)
    return fb


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--out", default=str(OUT / "genesis_first_cut.mp4"))
    a.add_argument("--from", dest="t0", type=float, default=0.0)
    a.add_argument("--to", dest="t1", type=float, default=None)
    a.add_argument("--audio", default=str(OUT / "mix.wav"))
    a.add_argument("--frames", default="", help="write these frame numbers as JPEGs to out/check instead of a video")
    o = a.parse_args()
    total = TIMING["duration"]
    t1 = o.t1 if o.t1 is not None else total
    caps = T.Captions(TIMING, edit.GOLD_WORDS, hide=edit.NO_CAPTION)
    cards = {}
    for sid, (verse, ref, on, off) in edit.CARDS.items():
        cards[sid] = T.verse_card(verse, ref, seed=hash(ref) % 1000)
    tags = {sid: T.ref_tag(txt) for sid, txt in edit.TAGS.items()}
    big = T.big_words("Where are you?", "Genesis 3:9")
    logo = T.logo()
    clips = {}
    want = set(int(x) for x in o.frames.split(",") if x) if o.frames else None
    if want is None:
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
        if Path(o.audio).exists():
            cmd += ["-ss", str(o.t0), "-i", o.audio, "-shortest", "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "aac", "-b:a", "192k"]
        cmd += ["-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", o.out]
        ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n0, n1 = int(round(o.t0 * FPS)), int(round(t1 * FPS))
    for n in range(n0, n1):
        if want is not None and n not in want:
            continue
        t = n / FPS
        k = max(i for i, sid in enumerate(IDS) if START[sid] <= t + 1e-6)
        sid = IDS[k]

        def frame_of(s, t):
            if s not in clips:
                clips[s] = Clip(s)
            return clips[s].at(t - LOCAL0[s])
        img = frame_of(sid, t)
        # transitions straddle the boundary into a shot
        for j in (k, k + 1):
            if 0 < j < len(IDS) and IDS[j] in edit.TRANSITIONS:
                b = START[IDS[j]]
                kind, d = edit.TRANSITIONS[IDS[j]]
                if b - d / 2 <= t < b + d / 2:
                    fa, fb = frame_of(IDS[j - 1], t), frame_of(IDS[j], t)
                    img = blend(IDS[j - 1], IDS[j], kind, (t - (b - d / 2)) / d, fa, fb)
        # finished picture is BGR from OpenCV; typography goes on in RGB
        pic = Image.fromarray(img[..., ::-1].copy()).convert("RGBA")
        # verse cards
        for cs in (sid,):
            if cs in cards:
                verse, ref, on, off = edit.CARDS[cs]
                prev = IDS[IDS.index(cs) - 1]
                if on is None:
                    t_in = START[cs] - 1.0 if (prev in edit.CARDS and edit.CARDS[prev][1] == ref) else START[cs] + .15
                else:
                    t_in = word_time(cs, *on) - .05
                t_out = word_time(cs, *off) if off else END[cs] - .3
                nxt = IDS[IDS.index(cs) + 1] if IDS.index(cs) + 1 < len(IDS) else None
                if off is None and nxt in edit.CARDS and edit.CARDS[nxt][1] == ref and edit.CARDS[nxt][2] is None:
                    t_out = END[cs] + 5
                T.place_card(pic, cards[cs], W / 2, H * edit.CARD_Y.get(cs, .78), t, t_in, t_out)
        if sid in tags:
            T.place_card(pic, tags[sid], W / 2, H * .86, t, START[sid] + .35, END[sid] - .35, rise=20, rot0=0)
        if sid == "S27":
            ta = word_time("S27", "Where") - .1
            al = float(np.clip((t - ta) / .7, 0, 1)) * float(np.clip((END["S27"] + .1 - t) / .4, 0, 1))
            if al > 0:
                b2 = big.copy()
                b2.putalpha(b2.getchannel("A").point(lambda v: int(v * al)))
                pic.alpha_composite(b2, (0, int(H * .33 - 150)))
        if sid == "S34":
            ta = SHOTS[-1]["voice_end"] + .25
            al = float(np.clip((t - ta) / .9, 0, 1))
            if al > 0:
                l2 = logo.copy()
                l2.putalpha(l2.getchannel("A").point(lambda v: int(v * al)))
                pic.alpha_composite(l2, (0, int(H * .80 - 150)))
        caps.draw(pic, t, H * edit.CAPTION_Y[sid] if sid in edit.CAPTION_Y else None)
        out = np.asarray(pic.convert("RGB"))
        if want is not None:
            (OUT / "check").mkdir(exist_ok=True)
            Image.fromarray(out).save(OUT / "check" / f"f{n:05d}.jpg", quality=88)
            continue
        ff.stdin.write(out.tobytes())
    if want is None:
        ff.stdin.close()
        ff.wait()
        print("wrote", o.out)


if __name__ == "__main__":
    main()
