"""The storyboard finish: Eden v2's pass (marched haze and shafts, depth of field, lens foliage, filmic grade) made general,
plus the simplification that makes it a painted 2.5D look rather than a render: the world in broad painted planes, the
people with a finer brush, hair as sculpted masses, a thin warm-black outline on the figures.

    python sb_finish.py <frame> [out.jpg]       reads /home/claude/fw-tools/out/<frame>_{main,fg,shadow}.exr and _meta.json
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "src" / "eden_v2"))
sys.path.insert(0, "/home/claude/fw-tools")
import exr  # noqa: E402
import look_e2 as lk  # noqa: E402
from look_e2 import blur, kuwahara, lum  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")
CHAR = (1, 2, 3, 4, 9, 11, 12, 13, 21, 25)
HAIR = (2, 3, 4)


class NoLight:
    def __call__(self, p):
        return np.zeros(len(p), np.float32)


def load(name):
    m = json.load(open(OUT / f"{name}_meta.json"))
    b = exr.layers(OUT / f"{name}_main.exr")
    f = exr.layers(OUT / f"{name}_fg.exr") if (OUT / f"{name}_fg.exr").exists() else None
    s = exr.layers(OUT / f"{name}_shadow.exr") if "light_cam" in m and (OUT / f"{name}_shadow.exr").exists() else None
    return m, b, f, s


def mask(I, ids):
    out = np.zeros(I.shape, np.float32)
    for i in ids:
        out = np.maximum(out, (np.abs(I - i) < .5).astype(np.float32))
    return out


def treat(name, k):
    m, b, f, s = load(name)
    K = dict(lk.K)
    K.update(k)
    C = b["Combined"][..., :3] * K["exposure"]
    Z = b["Depth"][..., 0]
    I = b["Object Index"][..., 0]
    H, W = Z.shape
    sc = W / 1080
    char = mask(I, CHAR)
    if s is not None and K.get("shafts", True):
        G = np.ones((8, 8), np.float32)
        m.setdefault("gobo", dict(x0=-1e6, x1=1e6, y0=-1e6, y1=1e6, res=2e5))
        m.setdefault("gz", 1e6)
        vis = lk.Visibility(m, s, G)
    else:
        vis = NoLight()
    Ls, Lsun, T, lit = lk.march(m, Z, vis, K)
    hold = 1 - .8 * np.clip(blur(char, 3 * sc) * 1.4, 0, 1)
    ref = np.percentile(Lsun, 99.5) + 1e-6
    Lsun = ref * (Lsun / ref) ** K.get("ray_gamma", 1.6)
    Ls = Ls + (Lsun * hold)[..., None] * K["sun"][None, None]
    cm = np.clip(blur(char, .8 * sc) * 1.5, 0, 1)

    def sm(x, m_, s_):
        return blur(x * m_[..., None], s_) / (blur(m_, s_)[..., None] + 1e-4)
    Ls = sm(Ls, 1 - cm, 2.2 * sc) * (1 - cm[..., None]) + sm(Ls, cm, 1.5 * sc) * cm[..., None]
    Ls = Ls * K["exposure"]
    keep = blur(char, 2 * sc)
    surf = lk.depth_blur(C, Z, K.get("focus", 190.0), np.clip(keep * 3, 0, 1), sc) if K.get("dof", True) else C
    out = surf * T[..., None] + Ls
    hot = np.clip(out - 1.2, 0, None)
    hot = lum(hot)[..., None] * .6 + hot * .4
    out = out + blur(hot, 4 * sc) * .3 + blur(hot, 18 * sc) * .18 + blur(hot, 60 * sc) * K.get("wide_bloom", .1)
    if f is not None:
        F = f["Combined"]
        fa, fc = F[..., 3], F[..., :3] * K["exposure"]
        sfg = K.get("fg_blur", 11) * sc
        out = out * (1 - blur(fa, sfg)[..., None]) + blur(fc, sfg) * K.get("fg_gain", .8)
    out = lk.tonemap(out) ** (1 / 2.2)
    out = lk.grade(out)
    # Simplify into paint: hair as sculpted masses, skin and cloth as smooth planes, the world in broad strokes.
    hair = np.clip(blur(mask(I, HAIR), 1.2 * sc), 0, 1)[..., None]
    skin = np.clip(blur(mask(I, (1, 9)), 2 * sc), 0, 1)[..., None]
    chm = np.clip(blur(char, 2 * sc) * 1.5, 0, 1)[..., None]
    coarse = kuwahara(out, max(2, int(round(K.get("paint", 5) * sc))))
    fine = kuwahara(out, max(1, int(round(K.get("paint_fig", 3) * sc))))
    hairp = kuwahara(out, max(2, int(round(K.get("paint_hair", 6) * sc))))
    painted = coarse * (1 - chm) + fine * chm
    skyk = np.clip(blur(mask(I, (28,)), 1.0 * sc), 0, 1)[..., None]
    painted = painted * (1 - skyk) + out * skyk                       # the sky keeps its stars
    painted = painted * (1 - hair) + hairp * hair
    out = painted * (1 - skin * K.get("skin_keep", .45)) + out * skin * K.get("skin_keep", .45)
    sil = (char > .5).astype(np.uint8)
    edge = cv2.morphologyEx(sil, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
    if sc > .7:
        edge = cv2.dilate(edge, np.ones((max(1, int(round(1.4 * sc))),) * 2, np.uint8))
    edge = blur(edge, .55 * sc) * np.clip(1.25 - lum(out) * 1.4, 0, 1) * K.get("line", 1.0)
    night = np.array([20, 16, 13], np.float32) / 255
    out = out * (1 - edge[..., None] * .5) + night * edge[..., None] * .5
    soft = blur(out, 6 * sc)
    face = np.clip(blur(mask(I, (1, 9)), 4 * sc), 0, 1)[..., None]
    out = np.clip(out + (out - soft) * .3 * face, 0, 1)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    vc = K.get("vignette_c", (.52, .45))
    r = np.sqrt(((xx - W * vc[0]) / (W * .75)) ** 2 + ((yy - H * vc[1]) / (H * .7)) ** 2)
    out = out * (1 - np.clip(r - .55, 0, 1)[..., None] * K.get("vignette", .55))
    return np.clip(out + np.random.default_rng(3).normal(0, .007, (H, W))[..., None], 0, 1)


def save(img, path):
    cv2.imwrite(str(path), (np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 94])


if __name__ == "__main__":
    import sb_frames
    name = sys.argv[1]
    out = treat(name, sb_frames.FINISH.get(name, {}))
    save(out, sys.argv[2] if len(sys.argv) > 2 else OUT / f"{name}.jpg")
    print("wrote", name)
