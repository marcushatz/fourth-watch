"""Small helpers shared by the raster styles. Each style still builds its own figure and its own world."""
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "visual_style_exploration" / "src"))
sys.path.insert(0, str(Path(__file__).parent))
import npr  # noqa: E402
import poses as P  # noqa: E402

W, H = P.W, P.H
FR = ROOT / "frames"


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def poly(mask, pts, val=255, ss=1):
    cv2.fillPoly(mask, [np.round(np.asarray(pts)[:, :2] * ss * 16).astype(np.int32)], val, cv2.LINE_AA, 4)


def fig_mask(scene, weight=.13, ss=3, leg=(1.05, .52), arm=(.9, .46), spine=(1.1, .9), only=None):
    """Antialiased figure mask with tapered limbs. Returns float32 in 0..1."""
    m = np.zeros((H * ss, W * ss), np.uint8)
    for f in P.figures(scene):
        if only and f["name"] != only:
            continue
        w = f["u"] * weight
        for k in ("leg_b", "arm_b", "spine", "leg_a", "arm_a"):
            a, c = leg if k.startswith("leg") else arm if k.startswith("arm") else spine
            poly(m, P.taper(f["limbs"][k], w * a, w * c, 12), 255, ss)
        poly(m, P.taper([f["limbs"]["spine"][0], f["head"]], w * .9, w * .62, 2), 255, ss)
        for h in f["hair"]:
            poly(m, P.taper(h, f["head_r"] * 1.05, 2, 12), 255, ss)
        cv2.circle(m, tuple(np.round(f["head"] * ss).astype(int)), int(f["head_r"] * ss), 255, -1, cv2.LINE_AA)
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def save(style, scene, rgb_srgb, q=94):
    d = FR / style
    d.mkdir(parents=True, exist_ok=True)
    npr.save(str(d / f"{scene}.jpg"), np.clip(rgb_srgb, 0, 1).astype(np.float32), q)


def stars(seed, n, h=H, big=.02, ymax=None):
    r = np.random.default_rng(seed)
    a = np.zeros((H, W), np.float32)
    for _ in range(n):
        x, y = int(r.uniform(0, W)), int(r.uniform(0, ymax or h))
        m = r.random() ** 3
        if r.random() < big:
            cv2.circle(a, (x, y), 2, float(.7 + .3 * m), -1, cv2.LINE_AA)
        else:
            a[y, x] = float(.25 + .75 * m)
    return a
