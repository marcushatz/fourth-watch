"""The finishing pass for Eden v2, all code: real light shafts and haze marched through the scene, depth of field,
the lens foliage blurred over the top, a light stylization of the two figures, and the grade.

  Light shafts: for every pixel, march along its camera ray; at each step ask whether the presence light reaches that
  point (the canopy openings from scene_e2.gobo, then the scene's own shadow seen from the light). What reaches it
  scatters toward the camera. Haze pools low and thickens with distance, so the garden falls back in layers.

    python look_e2.py [out.jpg] [--debug]
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, "/home/claude/fw-tools")
import exr  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")
CHAR = (1, 2, 3, 4, 9, 21)
K = dict(
    exposure=2.8,
    sigma=1 / 3600,             # haze extinction per cm
    floor=.35, height=300.0,     # haze thins with height: floor + (1 - floor) * exp(-z / height)
    amb=np.array([.034, .078, .104]) * 1.1,      # the cool of the day, scattered in the haze
    sun=np.array([1.0, .74, .42]) * 1.5,        # the presence light, where it reaches
    g=.42, steps=64, maxd=5200.0,
    near=(110.0, 800.0, .05),   # the air between us and them stays clear; haze gathers behind them and deepens far off
    near_sun=(150.0, 520.0, .0),  # but the light itself shows wherever it passes
)


def blur(x, s):
    return cv2.GaussianBlur(np.asarray(x, np.float32), (0, 0), s)


def lum(x):
    return x[..., 0] * .2126 + x[..., 1] * .7152 + x[..., 2] * .0722


def load():
    m = json.load(open(OUT / "e2_meta.json"))
    b = exr.layers(OUT / "e2_main.exr")
    f = exr.layers(OUT / "e2_fg.exr")
    s = exr.layers(OUT / "e2_shadow.exr")
    return m, b, f, s, np.load(OUT / "e2_gobo.npy")


def camera_rays(m, H, W):
    M = np.array(m["camera"]["matrix"])
    R, c = M[:3, :3], M[:3, 3]
    k = (m["camera"]["sensor"] / 2) / m["camera"]["lens"]
    jj, ii = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    x = ((jj + .5) / W * 2 - 1) * k * W / H
    y = (1 - (ii + .5) / H * 2) * k
    d = np.stack([x, y, -np.ones_like(x)], -1) @ R.T.astype(np.float32)     # planar: P = c + d * depth
    return c.astype(np.float32), d.astype(np.float32)


class Visibility:
    """Does the presence light reach point p? Canopy openings first, then the scene's own shadow."""

    def __init__(self, m, shadow, G):
        lc = m["light_cam"]
        Ml = np.array(lc["matrix"])
        self.R, self.c = Ml[:3, :3].astype(np.float32), Ml[:3, 3].astype(np.float32)
        self.size, self.res = lc["ortho"], lc["res"]
        Z = shadow["Depth"][..., 0]
        self.Z = np.where(Z > 1e8, 1e9, Z).astype(np.float32)
        self.G = G
        self.g = m["gobo"]
        self.gz = m["gz"]
        self.sun = np.array(m["sun"], np.float32)

    def __call__(self, p):
        # The canopy: follow the line toward the light up to the canopy height.
        s = (self.gz - p[:, 2]) / self.sun[2]
        q = p + self.sun * s[:, None]
        g = self.g
        ci = ((q[:, 0] - g["x0"]) / g["res"]).astype(np.int32)
        ri = ((q[:, 1] - g["y0"]) / g["res"]).astype(np.int32)
        out = (ci < 0) | (ci >= self.G.shape[1]) | (ri < 0) | (ri >= self.G.shape[0])
        gv = self.G[np.clip(ri, 0, self.G.shape[0] - 1), np.clip(ci, 0, self.G.shape[1] - 1)]
        open_ = np.where(out, 1.0, gv) * (p[:, 2] < self.gz)    # above the canopy height is the canopy itself
        # The scene's shadow, from the depth seen by the light.
        loc = (p - self.c) @ self.R
        u = ((loc[:, 0] / self.size + .5) * self.res).astype(np.int32)
        v = ((.5 - loc[:, 1] / self.size) * self.res).astype(np.int32)
        inside = (u >= 0) & (u < self.res) & (v >= 0) & (v < self.res)
        zmap = self.Z[np.clip(v, 0, self.res - 1), np.clip(u, 0, self.res - 1)]
        lit = np.where(inside, (-loc[:, 2]) <= zmap + 4.0, True)
        return open_ * lit


def march(m, depth, vis, k=K, seed=1):
    """Single-scattering haze along every camera ray. Returns in-scattered light and transmittance."""
    H, W = depth.shape
    c, d = camera_rays(m, H, W)
    dn = np.linalg.norm(d, axis=-1)
    v = d / dn[..., None]
    sun = np.array(m["sun"], np.float32)
    cos = v @ sun
    g = k["g"]
    phase = (1 - g * g) / (1 + g * g - 2 * g * cos) ** 1.5
    dist = np.minimum(np.where(depth > 1e8, k["maxd"], depth * dn), k["maxd"]).astype(np.float32)   # along the ray
    N = k["steps"]
    rng = np.random.default_rng(seed)
    jit = rng.random((H, W), dtype=np.float32)
    L = np.zeros((H, W, 3), np.float32)
    Lsun = np.zeros((H, W), np.float32)
    T = np.ones((H, W), np.float32)
    lit_sum = np.zeros((H, W), np.float32)
    vf = v.reshape(-1, 3)
    distf = dist.reshape(-1)
    jf = jit.reshape(-1)
    prev = np.zeros_like(distf)
    for i in range(N):
        t = distf * ((i + jf) / N) ** 1.7
        dt = distf * (((i + 1) / N) ** 1.7 - (i / N) ** 1.7)
        p = c + vf * t[:, None]
        def ramp(key):
            n0, n1, nf = k[key]
            r = np.clip((t - n0) / (n1 - n0), 0, 1)
            return nf + (1 - nf) * r * r * (3 - 2 * r)
        hf = k["floor"] + (1 - k["floor"]) * np.exp(-np.clip(p[:, 2], 0, None) / k["height"])
        dens = k["sigma"] * ramp("near") * hf
        dsun = k["sigma"] * ramp("near_sun") * hf
        a = 1 - np.exp(-dens * dt)
        a_sun = 1 - np.exp(-dsun * dt)
        lit = vis(p).astype(np.float32)
        Tf = T.reshape(-1)
        contrib = Tf * a
        up = np.clip((p[:, 2] - 150) / 550, 0, 1)
        sky = 1.25 - .85 * up * up * (3 - 2 * up)            # darker up under the canopy, brighter low in the distance
        L += ((contrib * sky)[:, None] * k["amb"]).reshape(H, W, 3)
        Lsun += (Tf * a_sun * phase.reshape(-1) * lit).reshape(H, W)
        lit_sum += (contrib * lit).reshape(H, W)
        T = (Tf * (1 - a)).reshape(H, W)
        prev = t
    return L, Lsun, T, lit_sum


def depth_blur(img, depth, focus, keep, sc=1.0):
    """Gentle depth of field behind the figures, without their colour bleeding into the garden."""
    far = np.clip((np.log(np.maximum(depth, 1)) - np.log(focus * 2.6)) / np.log(6), 0, 1)
    far = far * (1 - keep)
    out = img.copy()
    m = (far > .02).astype(np.float32)
    for s, lo, hi in ((1.2, .0, .35), (2.6, .35, .7), (4.5, .7, 1.01)):
        s = s * sc
        b = blur(img * m[..., None], s) / (blur(m, s)[..., None] + 1e-4)
        w = np.clip((far - lo) / (hi - lo), 0, 1)[..., None] * (far > lo)[..., None]
        out = out * (1 - w) + b * w
    return out


def kuwahara(img, r, q=8.0, sectors=8):
    """Generalized Kuwahara (Papari et al. 2007): each pixel takes the mean of whichever of eight soft sectors around it is
    flattest. Colour becomes painted planes; edges stay. r in pixels."""
    n = int(2 * r + 1)
    yy, xx = np.mgrid[-r:r + 1, -r:r + 1].astype(np.float32)
    ang = np.arctan2(yy, xx)
    rad = np.exp(-(xx ** 2 + yy ** 2) / (2 * (r * .6) ** 2)) * ((xx ** 2 + yy ** 2) <= r * r + .5)
    num = np.zeros_like(img)
    den = np.zeros(img.shape[:2], np.float32)
    sq = img * img
    for i in range(sectors):
        c = (i + .5) * 2 * np.pi / sectors - np.pi
        d = np.angle(np.exp(1j * (ang - c)))
        k = (np.clip(1 - np.abs(d) / (np.pi / sectors * 1.25), 0, 1) * rad).astype(np.float32)
        k[r, r] = rad[r, r] / sectors
        k /= k.sum()
        m = cv2.filter2D(img, -1, k)
        v = np.clip(cv2.filter2D(sq, -1, k) - m * m, 0, None).sum(-1)
        w = 1.0 / (1 + (v * 255) ** (q / 2))
        num += m * w[..., None]
        den += w
    return num / (den[..., None] + 1e-12)


def tonemap(x):
    """ACES-style filmic curve (Narkowicz fit): a gentle toe and a shoulder that rolls the gold off instead of clipping."""
    x = np.clip(x, 0, None)
    return np.clip((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0, 1)


def grade(y):
    """In display space. Shadows lifted into a deep teal (never dead black), light pushed warm, contrast in the mids,
    and a little more colour."""
    L = lum(y)[..., None]
    y = y + (1 - np.clip(L / .35, 0, 1)) ** 2 * np.array([.012, .03, .045], np.float32)       # teal in the darks
    t = np.clip((L - .25) / .6, 0, 1)
    y = y * (np.array([.95, 1.0, 1.06]) * (1 - t) + np.array([1.06, 1.0, .9]) * t)          # cool low, warm high
    y = np.clip(y, 0, 1)
    c = .5 + (y - .5) * 1.12
    y = y + (c - y) * (1 - np.abs(y - .5) * 2) * .9                                          # mid contrast
    g = lum(y)[..., None]
    return np.clip(g + (y - g) * 1.14, 0, 1)


def treat(debug=False):
    m, b, f, s, G = load()
    C = b["Combined"][..., :3] * K["exposure"]
    Z = b["Depth"][..., 0]
    I = b["Object Index"][..., 0]
    H, W = Z.shape
    sc = W / 1080
    char = np.zeros((H, W), np.float32)
    for i in CHAR:
        char = np.maximum(char, (np.abs(I - i) < .5).astype(np.float32))
    vis = Visibility(m, s, G)
    Ls, Lsun, T, lit = march(m, Z, vis)
    # The shafts are held back where they pass in front of the two of them, so the light frames them instead of fogging them.
    hold = 1 - .8 * np.clip(blur(char, 3 * sc) * 1.4, 0, 1)
    ref = np.percentile(Lsun, 99.5) + 1e-6
    Lsun = ref * (Lsun / ref) ** 1.6                          # rays stand out from the general glow
    Ls = Ls + (Lsun * hold)[..., None] * K["sun"][None, None]
    # Quiet the marching noise without letting the haze behind them bleed across their outlines.
    cm = np.clip(blur(char, .8 * sc) * 1.5, 0, 1)
    def sm(x, m_, s_):
        return blur(x * m_[..., None], s_) / (blur(m_, s_)[..., None] + 1e-4)
    Ls = sm(Ls, 1 - cm, 2.2 * sc) * (1 - cm[..., None]) + sm(Ls, cm, 1.5 * sc) * cm[..., None]
    Ls = Ls * K["exposure"]
    # Depth of field on the garden behind them (the render itself is pin sharp).
    keep = blur(char, 2 * sc)
    surf = depth_blur(C, Z, 190.0, np.clip(keep * 3, 0, 1), sc)
    out = surf * T[..., None] + Ls
    # Bloom: the light where it is strongest blooms a little, warm.
    hot = np.clip(out - 1.2, 0, None)
    hot = lum(hot)[..., None] * .6 + hot * .4                  # bloom keeps the light's colour, not a red smear
    out = out + blur(hot, 4 * sc) * .3 + blur(hot, 18 * sc) * .18 + blur(hot, 60 * sc) * .1
    # Dust in the light: a few motes, only where the shafts are, brighter where the light is stronger.
    rng = np.random.default_rng(17)
    n = int(900 * sc * sc)
    ys, xs = rng.integers(0, H, n), rng.integers(0, W, n)
    sh = Lsun * hold
    keep_m = rng.random(n) < np.clip(sh[ys, xs] / (np.percentile(sh, 99) + 1e-6), 0, 1) ** 1.5
    motes = np.zeros((H, W), np.float32)
    for y, x, a in zip(ys[keep_m], xs[keep_m], rng.uniform(.4, 1, keep_m.sum())):
        cv2.circle(motes, (int(x), int(y)), max(1, int(rng.uniform(.6, 1.6) * sc + .5)), float(a), -1, cv2.LINE_AA)
    motes = blur(motes, .7 * sc) * (1 - np.clip(blur(char, 2 * sc) * 2, 0, 1))
    out = out + motes[..., None] * np.array([1.0, .8, .52], np.float32) * .55
    # The lens foliage, out of focus and nearly black against the light.
    F = f["Combined"]
    fa = F[..., 3]
    fc = F[..., :3] * K["exposure"]
    sfg = 11 * sc
    fa_b = blur(fa, sfg)
    fc_b = blur(fc, sfg)
    out = out * (1 - fa_b[..., None]) + fc_b * .8
    out = tonemap(out) ** (1 / 2.2)
    out = grade(out)
    # Paint: the garden in broad painted planes, the two of them with a finer brush, the faces almost untouched.
    if K.get("paint", True):
        coarse = kuwahara(out, max(2, int(round(5 * sc))))
        fine = kuwahara(out, max(1, int(round(2.5 * sc))))
        skin = np.clip(blur(((np.abs(I - 1) < .5) | (np.abs(I - 9) < .5)).astype(np.float32), 3 * sc), 0, 1)[..., None]
        chm = np.clip(blur(char, 2 * sc) * 1.5, 0, 1)[..., None]
        painted = coarse * (1 - chm) + fine * chm
        out = painted * (1 - skin * .6) + out * skin * .6
    # Their outline: a thin warm-black line on the outer silhouette (the series' ink line), lost where the light is on it.
    sil = np.clip(char, 0, 1)
    edge = cv2.morphologyEx((sil > .5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
    edge = cv2.dilate(edge, np.ones((max(1, int(round(1.6 * sc))),) * 2, np.uint8)) if sc > .7 else edge
    edge = blur(edge, .55 * sc) * np.clip(1.25 - lum(out) * 1.4, 0, 1)
    night = (np.array([20, 16, 13], np.float32) / 255)
    out = out * (1 - edge[..., None] * .5) + night * edge[..., None] * .5
    # Clarity on the faces and hands: a little local contrast so they hold up at phone size.
    soft = blur(out, 6 * sc)
    face = np.clip(blur(((np.abs(I - 1) < .5) | (np.abs(I - 9) < .5)).astype(np.float32), 4 * sc), 0, 1)[..., None]
    out = np.clip(out + (out - soft) * .35 * face, 0, 1)
    # Finish: vignette and a fine grain.
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W * .52) / (W * .75)) ** 2 + ((yy - H * .45) / (H * .7)) ** 2)
    out = out * (1 - np.clip(r - .55, 0, 1)[..., None] * .55)
    out = np.clip(out + np.random.default_rng(3).normal(0, .008, (H, W))[..., None], 0, 1)
    if debug:
        return out, dict(lit=Lsun, T=T, Ls=Ls)
    return out


if __name__ == "__main__":
    dst = sys.argv[1] if len(sys.argv) > 1 else str(OUT / "e2_look.jpg")
    out = treat("--debug" in sys.argv)
    if isinstance(out, tuple):
        out, dbg = out
        S = Path(dst).with_suffix("")
        cv2.imwrite(f"{S}_lit.jpg", (np.clip(dbg["lit"] / (np.percentile(dbg["lit"], 99.5) + 1e-6), 0, 1) * 255).astype(np.uint8))
    cv2.imwrite(dst, (np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 94])
    print("wrote", dst)
