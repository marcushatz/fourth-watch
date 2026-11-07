"""The Fourth Watch look: one treatment for every frame, biblical or modern, so both worlds read as the same film.

From the 3D passes it makes:
  - people in three or four soft light bands that keep the render's colour, with a thin warm-black ink line;
  - the world as painted strokes that loosen with distance, inside a depth haze;
  - light that means something: bloom on screens, windows and the gold (God's presence only), shafts where light falls;
  - a hand-made surface: paper grain, a light grain and a vignette.
    python look.py <pass.exr> <mood> <out.jpg>      moods: relate, transform, eden, plate
"""
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "visual_style_exploration" / "src"))
from npr import (Passes, blur, bloom, curve, edge_map, fog, grain, hexc, ink, linear, lum, painter, paper_tex, rays,  # noqa: E402
                 smooth_in, srgb, trace, vignette)

CHAR = (1, 2, 3, 4, 9, 11, 12, 13, 21)
NIGHT = hexc("#14100D")
MOODS = {
    "relate":    dict(gain=3.6, fog=(.012, .018, .04), dist=900, lift=(.008, .011, .022), shadow=(.7, .78, 1.0), high=(1.0, .98, .95), bands=4, sat=.9),
    "transform": dict(gain=2.4, fog=(.07, .055, .05), dist=900, lift=(.016, .012, .01), shadow=(.8, .74, .86), high=(1.12, 1.0, .8), bands=4, sat=1.12),
    "eden":      dict(gain=2.6, fog=(.03, .05, .075), dist=520, lift=(.01, .016, .024), shadow=(.7, .82, 1.0), high=(1.05, 1.0, .9), bands=4, sat=.95),
    "plate":     dict(gain=2.6, fog=(.03, .05, .075), dist=520, lift=(.01, .016, .024), shadow=(.7, .82, 1.0), high=(1.05, 1.0, .9), bands=4, sat=.95),
}


def bands(L, mask, n, soft=.06):
    """Soft-edged light bands at this region's own percentiles, so each person keeps their own light and dark."""
    v = L[mask > .5]
    if v.size < 50:
        return L
    qs = np.percentile(v, np.linspace(8, 96, n + 1))
    out = np.full(L.shape, qs[0], np.float32)
    for i in range(1, n + 1):
        lo, hi = qs[i - 1], qs[i]
        t = np.clip((L - (lo + hi) / 2) / max((hi - lo) * soft * 6, 1e-4) + .5, 0, 1)
        out = out + (hi - out) * t * (L > lo)
    return out


def finish(img, k, seed):
    h, w = img.shape[:2]
    img = img * paper_tex((h, w), seed, .035)[..., None]
    img = curve(np.clip(img, 0, 1), .28)
    img = vignette(img, .3)
    return grain(img, .011, seed)


def treat(path, mood):
    k = MOODS[mood]
    p = Passes(str(path))
    h, w = p.h, p.w
    s = w / 1080
    img, fz = fog(p.C * k["gain"], p.Zb, k["fog"], k["dist"] * 100 if mood in ("relate", "transform") else k["dist"] * 4)
    img = img + np.array(k["lift"], np.float32) * (1 - fz[..., None] * .0)
    char = np.zeros((h, w), np.float32)
    for i in CHAR:
        char = np.maximum(char, p.mask(i))
    glow_ids = {"relate": (17, 18), "transform": (17, 18), "eden": (8,), "plate": (8,)}[mood]
    glow = np.zeros((h, w), np.float32)
    for i in glow_ids:
        glow = np.maximum(glow, p.mask(i))
    # The world: painted strokes over flattened shapes. Lights stay crisp so they read as light.
    ref = np.clip(srgb(img), 0, 1)
    env = blur(painter(ref, tuple(int(r * s) for r in (40, 18, 8)), seed=3, length=(4, 11), thresh=.03), .8 * s)
    out = linear(env)
    keep = blur(glow, 1.2 * s)[..., None]
    out = out * (1 - keep) + img * keep
    # People: their own colour, in soft bands of light, smoothed so skin and cloth read as painted planes.
    Ls = lum(img) + 1e-5
    flat = img.copy()
    for ids, n in (((1,), k["bands"]), ((2, 3, 4), 3), ((11,), 3), ((12,), 3), ((13,), 2), ((21,), 3), ((9,), 2)):
        m = np.zeros((h, w), np.float32)
        for i in ids:
            m = np.maximum(m, p.mask(i))
        if m.max() == 0:
            continue
        Lm = smooth_in(Ls, m, (3.5 if 1 in ids else 5) * s)
        cm = blur(img / Ls[..., None] * m[..., None], 9 * s) / (blur(m, 9 * s) + 1e-4)[..., None]
        Lb = bands(Lm, m, n)
        reg = cm * Lb[..., None]
        mm = blur(m, .6 * s)[..., None]
        flat = flat * (1 - mm) + reg * mm
    cm = blur(char, .6 * s)[..., None]
    out = out * (1 - cm) + flat * cm
    # Colour: cool shadows, warm highlights, restrained saturation.
    L = lum(out)[..., None]
    t = np.clip(L / (np.percentile(L, 99) + 1e-5), 0, 1)
    out = out * (np.array(k["shadow"]) * (1 - t) + np.array(k["high"]) * t)
    g = lum(out)[..., None]
    out = g + (out - g) * k["sat"]
    # Light: bloom on what glows, shafts where it falls.
    hot = out * blur(glow, 2 * s)[..., None]
    wide = .18 if mood in ("eden", "plate") else .05             # a window shouldn't fog the whole room
    out = out + (blur(hot, 6 * s) * .55 + blur(hot, 30 * s) * (.45 if wide > .1 else .25) + blur(hot, 90 * s) * wide)
    if mood in ("eden", "plate"):
        gm = p.mask(8)
        ys, xs = np.nonzero(gm > .5)
        if len(xs):
            cx, cy = xs.mean(), ys.mean()
            src = np.clip(lum(img) - np.percentile(lum(img), 92), 0, None) * (p.Zb > 600) + gm * 2
            sh = rays(src, (cx, cy), steps=48, decay=.97, spread=.018)
            out = out + hexc("#E3B25C")[None, None] * sh[..., None] * .9
    if mood in ("relate", "transform"):
        win = p.mask(17)
        ys, xs = np.nonzero(win > .5)
        if len(xs):
            src = np.clip(lum(img) - .2, 0, None) * win
            sh = rays(src, (xs.mean(), ys.min() - 600 * s), steps=40, decay=.97, spread=-.012)
            col = np.array((.55, .66, 1.0) if mood == "relate" else (1, .84, .66), np.float32)
            out = out + col * sh[..., None] * (.16 if mood == "relate" else 0.0)
    out = srgb(np.clip(out, 0, None))
    # Ink: one warm-black line around people and the things they touch.
    keep_line = blur(np.clip(char + p.mask(19) + p.mask(14) * .0, 0, 1), 1.5 * s) > .05
    e = edge_map(p, hair_ids=(2, 3, 4), hair_blur=14 * s, tn=.5, tz=.012) * keep_line
    hair = np.maximum(p.mask(2), p.mask(3))
    inner = cv2.erode(hair, np.ones((int(7 * s) | 1, int(7 * s) | 1), np.uint8))
    e = e * (1 - inner * .85)                                   # hair keeps its outline, not a scribble of strands
    lines = ink(trace(e > .4, int(12 * s)), e.shape, 2.3 * s, 1, wobble=.2)
    ink_col = NIGHT ** (1 / 2.2)
    out = out * (1 - lines[..., None] * .82) + ink_col * lines[..., None] * .82
    return finish(np.clip(out, 0, 1), k, 7)


if __name__ == "__main__":
    src, mood, dst = sys.argv[1], sys.argv[2], sys.argv[3]
    out = treat(src, mood)
    cv2.imwrite(dst, (np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 94])
    print("wrote", dst)
