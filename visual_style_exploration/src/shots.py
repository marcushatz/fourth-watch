"""Load each shot's passes with its fog, light and sky settings, so every style can serve all three."""
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from npr import Passes, blur, fbm, hexc

OUT = "/home/claude/fw-tools/out"


def night_sky(w=1080, h=1920, seed=11):
    """A deep sky with a diagonal band of stars."""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    t = np.clip(yy / 1250, 0, 1)
    sky = hexc("#060a14")[None, None] * (1 - t[..., None]) + hexc("#1b2a46")[None, None] * t[..., None]
    across = (xx - 110 - (1260 - yy) * .62) / 250
    band = np.exp(-across ** 2) * (.25 + .75 * fbm((h, w), 170, 21, 5))
    sky = sky + hexc("#3d5680")[None, None] * band[..., None] * .55
    dust = np.exp(-(across / .42) ** 2) * np.clip((fbm((h, w), 120, 5, 5) - .52) * 5, 0, 1)
    sky = sky * (1 - dust[..., None] * .7)
    r = np.random.default_rng(seed)
    st = np.zeros((h, w), np.float32)
    for n, rad, gain, weighted in ((9000, (.5, .9), (.12, .55), True), (900, (.9, 1.5), (.4, .9), True), (46, (1.7, 2.6), (.9, 1.3), False)):
        for _ in range(n):
            x, y = r.uniform(0, w), r.uniform(0, 1500)
            if weighted and r.random() > .15 + .85 * float(band[int(y), int(x)]) ** .7:
                continue
            cv2.circle(st, (int(x * 8), int(y * 8)), int(r.uniform(*rad) * 8), float(r.uniform(*gain)), -1, cv2.LINE_AA, 3)
    st = blur(st, .5)
    base = sky.copy()
    sky = sky + st[..., None] * hexc("#eaf0ff") * 1.5 + blur(st, 3)[..., None] * hexc("#9db4e0") * .5
    return sky, st, base


def load(shot, refined=False):
    r = "refined_" if refined else ""
    if shot == "s26":
        return Passes(f"{OUT}/s26_{'refined' if refined else 'cinematic'}_beauty.exr", f"{OUT}/s26_{'refined' if refined else 'cinematic'}_gbuf.exr")
    if shot == "s13":
        p = Passes(f"{OUT}/s13_{r}beauty.exr", f"{OUT}/s13_{r}gbuf.exr")
        I = p.I.copy()
        I[np.abs(I - 9) < .5] = 1
        I[np.abs(I - 10) < .5] = 2
        I[np.abs(I - 11) < .5] = 1
        p.I = I
        p.cfg = dict(fog=(.62, .55, .4), dist=1.75, gain=.74, power=1.3)
        p.day = True
        return p
    p = Passes(f"{OUT}/s02_{r}beauty.exr", f"{OUT}/s02_{r}gbuf.exr")
    p.Z = np.minimum(p.Z, 2e5)
    p.Zb = np.minimum(p.Zb, 2e5)
    p.cfg = dict(fog=(.14, .2, .32), dist=17, gain=2.2, power=1.15)
    p.sky, p.stars, p.sky_soft = night_sky()
    return p
