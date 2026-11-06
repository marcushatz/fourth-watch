"""Finishing for the three 3D styles. The light comes from the renderer; this is the lab work on the negative."""
import sys

sys.path.insert(0, "/home/claude/fw-tools")
import cv2
import numpy as np

import exr
from kit import FR, npr, P, smoothstep

fbm, hexc, srgb = npr.fbm, npr.hexc, npr.srgb
OUT = "/home/claude/fw-tools/out"
NAME = dict(dark="01_dark_cinematic", film="09_monochrome_film", cg="10_stylized_3d")


def gb(a, s_):
    if s_ < 14:
        return cv2.GaussianBlur(a, (0, 0), s_)
    h, w = a.shape[:2]
    q = cv2.resize(a, (w // 6, h // 6), interpolation=cv2.INTER_AREA)
    return cv2.resize(cv2.GaussianBlur(q, (0, 0), s_ / 6), (w, h), interpolation=cv2.INTER_LINEAR)


class Shot:
    def __init__(s, style, scene):
        L = exr.layers(f"{OUT}/st_{style}_{scene}.exr")
        s.C = L["Combined"][..., :3].astype(np.float32)
        s.Z = np.minimum(L["Depth"][..., 0], 1e7).astype(np.float32)
        s.I = L["Object Index"][..., 0]
        s.h, s.w = s.Z.shape
        s.k = s.w / 1080
        s.Y, s.X = np.mgrid[:s.h, :s.w].astype(np.float32) / s.k
        s.sky = (s.Z > 1e6).astype(np.float32)
        s.shape = (s.h, s.w)


def stars(sh, seed, n, ymax=None, big=.02):
    r = np.random.default_rng(seed)
    a = np.zeros(sh.shape, np.float32)
    for _ in range(int(n)):
        x, y = int(r.uniform(0, sh.w)), int(r.uniform(0, (ymax or 1920) * sh.k))
        q = r.random() ** 3.2
        if r.random() < big:
            cv2.circle(a, (x, y), max(int(2 * sh.k), 1), float(.8 + .2 * q), -1, cv2.LINE_AA)
        else:
            a[min(y, sh.h - 1), x] = float(.2 + .8 * q)
    return a


def grain(img, sh, amount, size=.8, seed=2):
    n = cv2.GaussianBlur(np.random.default_rng(seed).normal(0, 1, sh.shape).astype(np.float32), (0, 0), size * sh.k + .01)
    n = n / n.std()
    return img + n[..., None] * amount * (.3 + 1.0 * np.sqrt(np.clip(img, 0, 1)))


def vign(sh, a):
    return (1 - a * (((sh.X - 540) / 720) ** 2 + ((sh.Y - 960) / 1180) ** 2))[..., None]


def streak(C, sh, th=.8):
    b = np.clip(C - th, 0, 3)
    return cv2.GaussianBlur(b, (0, 0), sigmaX=70 * sh.k, sigmaY=1.4 * sh.k + .01)


def tone(C, ex=1.0, c=1.0):
    x = np.clip(C * ex, 0, None)
    return (x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14)


def dark_a():
    s = Shot("dark", "a")
    C = s.C.copy()
    C, f = npr.fog(C, np.minimum(s.Z, 6e5), hexc("#22394b"), 1.1e5, 1.5)
    # Sky: nearly black, a slow breath of teal down at the range, and real stars.
    g = smoothstep(1500, 300, s.Y)
    sky = hexc("#16293a") * (1 - g[..., None]) + hexc("#02050a") * g[..., None]
    band = np.exp(-(((s.Y - 700) - (s.X - 540) * -.9) / 360) ** 2) * fbm(s.shape, 260 * s.k, 3, 6)
    sky = sky + band[..., None] * hexc("#2b4a60") * .6
    st = stars(s, 4, 3400, 1350)
    sky = sky + cv2.GaussianBlur(st, (0, 0), .55 * s.k + .01)[..., None] * np.array([.75, .88, 1], np.float32) * .9
    C = C * (1 - s.sky[..., None]) + sky * s.sky[..., None]
    C = C + gb(np.clip(C - .1, 0, None), 22 * s.k) * .3
    C = C * vign(s, .5)
    return srgb(np.clip(grain(tone(C, 2.2), s, .007), 0, 1))


def dark_b():
    s = Shot("dark", "b")
    C = s.C.copy()
    # The air is the picture: a low amber sun somewhere left of frame, going to teal-black on the right.
    wx = np.exp(-(((s.X + 60) / 620) ** 2 + ((s.Y - 1180) / 520) ** 2))
    air = hexc("#071116") * (1 - wx[..., None]) + hexc("#c98a48") * wx[..., None] * .95
    f = 1 - np.exp(-(np.clip(s.Z, 0, 9000) / 2100) ** 1.5)
    C = C * (1 - f[..., None]) + air * f[..., None]
    C = C * (1 - s.sky[..., None]) + air * s.sky[..., None] * 1.05
    src = np.clip(wx, 0, 1) * (s.Z > 2000)
    rays = gb(npr.rays(src, (-60 * s.k, 1180 * s.k), 30, .98, .02), 3 * s.k)
    C = C + rays[..., None] * hexc("#ffb266") * .1
    C = C + gb(np.clip(C - .4, 0, None), 16 * s.k) * .5
    C = C * vign(s, .62)
    return srgb(np.clip(grain(tone(C, 1.1), s, .008), 0, 1))


def dark_c():
    s = Shot("dark", "c")
    C = s.C.copy()
    lx, ly = P.LIGHT_C
    d = np.hypot((s.X - lx) * 1.1, (s.Y - ly) * .8)
    # Cold air everywhere, thickest round him so he stands out, and a warm breath far off.
    cold = np.exp(-(((s.X - 680) / 420) ** 2 + ((s.Y - 1330) / 420) ** 2))
    warm = np.exp(-(d / 240) ** 2)
    air = hexc("#0b1d22")[None, None] + cold[..., None] * hexc("#3f7f88") * 1.3 + warm[..., None] * hexc("#d6964f") * 1.25
    f = 1 - np.exp(-(np.clip(s.Z, 0, 9000) / 2000) ** 1.25)
    C = C * (1 - f[..., None]) + air * f[..., None]
    C = C * (1 - s.sky[..., None]) + air * s.sky[..., None]
    C = C + (np.exp(-(d / 34) ** 2))[..., None] * hexc("#ffdca6") * .7
    src = warm * (s.Z > 1900)
    rays = gb(npr.rays(src, (lx * s.k, ly * s.k), 30, .975, .022), 3 * s.k)
    C = C + rays[..., None] * hexc("#ffb36b") * .14
    C = C + gb(np.clip(C - .3, 0, None), 20 * s.k) * .35
    C = C * vign(s, .55)
    return srgb(np.clip(grain(tone(C, 1.25), s, .008), 0, 1))


def bw(C):
    return (C * np.array([.3, .59, .11], np.float32)).sum(2)


def film_finish(L, s, seed=3, gam=1.0, ex=1.0):
    L = L * ex
    hal = gb(np.clip(L - .55, 0, None), 9 * s.k) * .45 + gb(np.clip(L - .7, 0, None), 42 * s.k) * .28
    L = L + hal
    L = L / (1 + L * .25)
    L = npr.srgb(np.clip(L, 0, 1))
    L = np.clip(L, 0, 1)
    L = L ** gam
    L = L * L * (3 - 2 * L) * .78 + L * .22
    L = L * vign(s, .34)[..., 0]
    out = grain(L[..., None], s, .036, .9, seed)
    return np.clip(np.repeat(out, 3, 2) * np.array([1, .985, .96], np.float32) + np.array([.008, .008, .012], np.float32), 0, 1)


def film_a():
    s = Shot("film", "a")
    L = bw(s.C)
    mx, my = 610, 880
    d = np.hypot(s.X - mx, s.Y - my)
    rad = 250
    disc = smoothstep(rad + 1.5, rad - 1.5, d)
    m = .78 + .22 * smoothstep(.36, .64, fbm(s.shape, 170 * s.k, 8, 5))
    sky = .005 + .05 * np.exp(-np.clip(d - rad, 0, None) / 230) + .035 * smoothstep(800, 1340, s.Y)
    st = stars(s, 6, 2600, 1330)
    sky = sky + cv2.GaussianBlur(st, (0, 0), .6 * s.k + .01) * .8 * (1 - disc)
    sky = sky * (1 - disc) + disc * m * 1.25
    L = L * (1 - s.sky) + sky * s.sky
    return film_finish(L, s, 3, 1.05, 1.1)


def film_b():
    s = Shot("film", "b")
    return film_finish(bw(s.C), s, 4, 1.25, 2.1)


def film_c():
    s = Shot("film", "c")
    L = bw(s.C)
    f = 1 - np.exp(-(np.clip(s.Z, 0, 9000) / 3400) ** 1.4)
    air = .05 + .55 * np.exp(-((s.X - 260) / 420) ** 2) * (1 - .4 * smoothstep(300, 1400, s.Y))
    L = L * (1 - f) + air * f
    L = L * (1 - s.sky) + air * s.sky
    return film_finish(L, s, 5, 1.05, 1.0)


def cg(sc, ex=1.0, bloom=.3):
    s = Shot("cg", sc)
    C = s.C
    if sc == "b":
        C = C * (1 - s.sky[..., None]) + s.sky[..., None] * (hexc("#7fc0d0") * smoothstep(1500, 300, s.Y)[..., None] + hexc("#f9dcae") * (1 - smoothstep(1500, 300, s.Y))[..., None])
    if sc == "a":
        g = smoothstep(1800, 100, s.Y)[..., None]
        C = C + s.sky[..., None] * (hexc("#274a8c") * (1 - g) + hexc("#070e30") * g)
    if sc == "c":
        lx, ly = P.LIGHT_C
        d = np.hypot(s.X - lx, s.Y - ly)
        f = 1 - np.exp(-(np.clip(s.Z, 0, 9000) / 3000) ** 1.3)
        air = hexc("#0f3238") + np.exp(-(d / 260) ** 2)[..., None] * hexc("#d9984a") * .9
        C = C * (1 - f[..., None]) + air * f[..., None]
        C = C * (1 - s.sky[..., None]) + air * s.sky[..., None]
    if sc == "b":
        f = 1 - np.exp(-(np.clip(s.Z, 0, 9000) / 16000) ** 1.3)
        C = C * (1 - f[..., None]) + hexc("#d6dcc0") * f[..., None]
    C = C + gb(np.clip(C - .85, 0, None), 20 * s.k) * bloom
    C = tone(C, ex) * vign(s, .22)
    return srgb(np.clip(grain(C, s, .004, .6), 0, 1))


JOBS = {("dark", "a"): dark_a, ("dark", "b"): dark_b, ("dark", "c"): dark_c, ("film", "a"): film_a, ("film", "b"): film_b, ("film", "c"): film_c,
        ("cg", "a"): lambda: cg("a", 1.0), ("cg", "b"): lambda: cg("b", .82), ("cg", "c"): lambda: cg("c", 1.1)}

if __name__ == "__main__":
    for arg in sys.argv[1:]:
        st, sc = arg.split(":")
        im = JOBS[(st, sc)]()
        d = FR / NAME[st]
        d.mkdir(parents=True, exist_ok=True)
        npr.save(str(d / f"{sc}.jpg"), np.clip(im, 0, 1).astype(np.float32), 94)
        print(arg, flush=True)
