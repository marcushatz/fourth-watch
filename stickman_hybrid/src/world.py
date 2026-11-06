"""World building for the hybrid direction: layered, parallax-ready planes, finished three ways.

A  Painterly Cinematic   soft brush-textured fills, dry edges, moody light
B  Editorial Elegant     clean shapes, stepped tones, fine line accents, print grain
C  Atmospheric Storybook painted depth, watercolour granulation, rich detail, warm light"""
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "visual_style_exploration" / "src"))
import npr  # noqa: E402

W, H = 1080, 1920
Y, X = np.mgrid[:H, :W].astype(np.float32)
hexc, srgb = npr.hexc, npr.srgb


def fbm(shape, cell, seed, oct=4):
    return npr.fbm(shape, cell, seed, oct).astype(np.float32)


def fbm1(cell, seed, oct=5):
    return fbm((1, W), cell, seed, oct)[0]


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def gb(a, s_):
    a = np.asarray(a, np.float32)
    if s_ <= 0:
        return a
    if s_ < 12:
        return cv2.GaussianBlur(a, (0, 0), s_)
    k = 6
    h, w = a.shape[:2]
    q = cv2.resize(a, (w // k, h // k), interpolation=cv2.INTER_AREA)
    return cv2.resize(cv2.GaussianBlur(q, (0, 0), s_ / k), (w, h), interpolation=cv2.INTER_LINEAR)


def ramp(t, stops):
    t = np.clip(t, 0, 1)
    xs = [q[0] for q in stops]
    cs = np.array([hexc(q[1]) for q in stops], np.float32)
    return np.dstack([np.interp(t, xs, cs[:, i]) for i in range(3)]).astype(np.float32)


def fill(col, shape=(H, W)):
    return np.broadcast_to(np.asarray(col, np.float32), (*shape, 3)).copy()


def streak(seed, angle=0.0, length=26, width=1.2, cell=1.0):
    """Brush-mark texture: noise pulled out along one direction. Mean 0, roughly unit spread."""
    r = np.random.default_rng(seed)
    n = r.normal(0, 1, (H // 2, W // 2)).astype(np.float32)
    h, w = n.shape
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1)
    n = cv2.warpAffine(n, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    n = cv2.GaussianBlur(n, (0, 0), sigmaX=length / 2, sigmaY=width / 2)
    M = cv2.getRotationMatrix2D((w / 2, h / 2), -angle, 1)
    n = cv2.warpAffine(n, M, (w, h), borderMode=cv2.BORDER_REFLECT)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_LINEAR)
    return n / (n.std() + 1e-6)


def aligned_fbm(cell, seed, angle, stretch=3.0, oct=5):
    """Noise stretched along one direction: long wisps rather than blobs."""
    D = int(np.hypot(H, W)) + 8
    n = fbm((D, int(D / stretch)), cell / stretch, seed, oct)
    n = cv2.resize(n, (D, D), interpolation=cv2.INTER_CUBIC)
    M = cv2.getRotationMatrix2D((D / 2, D / 2), -angle, 1)
    n = cv2.warpAffine(n, M, (D, D), borderMode=cv2.BORDER_REFLECT)
    y0, x0 = (D - H) // 2, (D - W) // 2
    return n[y0:y0 + H, x0:x0 + W]


def grainy(seed, sigma=.8):
    n = np.random.default_rng(seed).normal(0, 1, (H, W)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), sigma)
    return n / (n.std() + 1e-6)


def inner_dist(a):
    return cv2.distanceTransform((a > .5).astype(np.uint8), cv2.DIST_L2, 3)


def treat(rgb, a, v, seed, angle=0.0, k=1.0, edge=True, L=30, Wd=1.4):
    """Give a plane the surface of its variant."""
    if v == "A":
        st = streak(seed, angle, L, Wd)
        lo = fbm((H, W), 160, seed + 1, 3) - .5
        rgb = rgb * (1 + .075 * k * st[..., None] + .16 * k * lo[..., None])
        if edge:
            d = inner_dist(a)
            br = streak(seed + 2, angle, 18, 1.0)
            cut = (1 - smoothstep(0, 9, d)) * smoothstep(.3, 1.4, br)
            a = a * (1 - .85 * cut)
    elif v == "C":
        gr = grainy(seed, .7)
        bloom = fbm((H, W), 120, seed + 3, 4) - .5
        rgb = rgb * (1 + .045 * k * gr[..., None] + .14 * k * bloom[..., None])
        if edge:
            d = inner_dist(a)
            pool = (1 - smoothstep(0, 5, d)) * (a > .02)
            rgb = rgb * (1 - .16 * k * pool[..., None])
    else:
        lo = fbm((H, W), 260, seed + 1, 2) - .5
        rgb = rgb * (1 + .025 * k * lo[..., None])
    return rgb, a


class Stack:
    """Back-to-front planes. Each is kept so a camera move can slide them past each other later."""

    def __init__(s, sky, keep_dir=None):
        s.img = sky.astype(np.float32).copy()
        s.keep = keep_dir
        s.n = 0
        if keep_dir:
            Path(keep_dir).mkdir(parents=True, exist_ok=True)
        s._dump(s.img, np.ones((H, W), np.float32), "sky")

    def _dump(s, rgb, a, name):
        if s.keep:
            o = np.dstack([np.clip(srgb(np.clip(rgb, 0, 1)), 0, 1)[..., ::-1], np.clip(a, 0, 1)])
            cv2.imwrite(str(Path(s.keep) / f"{s.n:02d}_{name}.png"), (o * 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 6])
            s.n += 1

    def add(s, rgb, a, name="plane", blur=0.0, premult=False):
        if premult:
            rgb = rgb / np.maximum(a[..., None], 1e-4)
        if blur:
            pm = gb(rgb * a[..., None], blur)
            a = gb(a, blur)
            rgb = pm / np.maximum(a[..., None], 1e-4)
        s._dump(rgb, a, name)
        s.img = s.img * (1 - a[..., None]) + rgb * a[..., None]

    def air(s, col, m):
        """A sheet of haze or light between planes."""
        m = np.clip(m, 0, 1)[..., None]
        s.img = s.img * (1 - m) + np.asarray(col, np.float32) * m

    def glow(s, col, m):
        s.img = s.img + np.asarray(col, np.float32) * np.asarray(m, np.float32)[..., None]

    def shade(s, m):
        s.img = s.img * (1 - np.clip(m, 0, 1)[..., None])


def profile_mask(prof, soft=1.2):
    return smoothstep(-soft, soft, Y - prof[None, :]).astype(np.float32)


def ridge_profile(base, amp, cell, seed, sharp=1.0):
    a = fbm1(cell, seed, 6)
    r = 1 - np.abs(2 * a - 1)
    return base - amp * (r ** sharp * 1.4 - .4) - 14 * (fbm1(cell / 6, seed + 5, 3) - .5)


def faces(seed, cell, sun=(-.6, -.6), steps=None):
    """Lit and shaded faces for a ridge, from a ridged height field. Optionally stepped into flat tones."""
    a = fbm((H, W), cell, seed, 6)
    R = 1 - np.abs(2 * a - 1)
    R = cv2.GaussianBlur(R, (0, 0), 1.2)
    gy, gx = np.gradient(R)
    s_ = np.clip(.5 + 18 * (gx * sun[0] + gy * sun[1]), 0, 1)
    if steps:
        s_ = np.floor(s_ * steps + .5) / steps
        s_ = cv2.GaussianBlur(s_, (0, 0), .7)
    return s_


def stars(seed, n, ymax, sizes=(.5, 1.6), colours=None, big=.02):
    """A star field as a light map (and an optional colour map)."""
    r = np.random.default_rng(seed)
    L = np.zeros((H, W), np.float32)
    C = np.ones((H, W, 3), np.float32)
    for _ in range(n):
        x, y = r.uniform(0, W), r.uniform(0, ymax)
        q = r.random() ** 3.2
        if r.random() < big:
            rad = sizes[1] * (1 + q)
            cv2.circle(L, (int(x * 4), int(y * 4)), max(int(rad * 4), 1), float(.6 + .4 * q), -1, cv2.LINE_AA, 2)
        else:
            L[int(y), int(x)] = max(L[int(y), int(x)], float(.18 + .82 * q))
        if colours is not None:
            c = colours[int(r.integers(len(colours)))]
            cv2.circle(C, (int(x), int(y)), 3, tuple(float(v) for v in c), -1)
    return L, C


def blades(seed, n, xr, yr, hr, lean=.3, w=(1.6, 3.0), on=None, sz=4):
    """Grass blades: thin, curved and tapering to a point, drawn at 2x into an alpha mask."""
    r = np.random.default_rng(seed)
    m = np.zeros((H * 2, W * 2), np.uint8)
    for _ in range(n):
        x = r.uniform(*xr)
        y = r.uniform(*yr) if on is None else on[int(np.clip(x, 0, W - 1))] + r.uniform(*yr)
        h = r.uniform(*hr)
        bend = r.normal(0, lean) * h
        t = np.linspace(0, 1, 7)
        px = x + bend * t ** 2
        py = y - h * t
        ww = r.uniform(*w) * (1 - t * .9)
        poly = taper(np.stack([px, py], 1), ww[0], ww[-1], 2)
        cv2.fillPoly(m, [np.round(poly * 2 * 8).astype(np.int32)], 255, cv2.LINE_AA, 3)
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def taper(path, w0, w1, n=14):
    c = np.asarray(path, float)
    t = np.linspace(0, 1, len(c))
    tt = np.linspace(0, 1, max(n * (len(c) - 1), 2) + 1)
    c = np.stack([np.interp(tt, t, c[:, 0]), np.interp(tt, t, c[:, 1])], 1)
    d = np.gradient(c, axis=0)
    q = np.stack([-d[:, 1], d[:, 0]], 1) / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-6)
    w = np.linspace(w0, w1, len(c))
    return np.vstack([c + q * w[:, None] / 2, (c - q * w[:, None] / 2)[::-1]])


def polys_mask(polys, ss=4):
    m = np.zeros((H, W), np.uint8)
    for p in polys:
        cv2.fillPoly(m, [np.round(np.asarray(p) * ss).astype(np.int32)], 255, cv2.LINE_AA, int(np.log2(ss)))
    return m.astype(np.float32) / 255


def branch_tree(seed, root, ang, L, w, depth, spread=26, curl=.08, droop=0.0, out=None):
    """Recursive branches as tapered polygons. Returns polygons and twig tips."""
    r = np.random.default_rng(seed)
    polys, tips = [], []

    def go(x, y, a, L, w, d):
        n = 6
        pts = [(x, y)]
        cu = r.uniform(-curl, curl)
        for _ in range(n):
            a += cu + r.normal(0, .05) + droop * np.cos(a) * .1
            x += np.cos(a) * L / n
            y += np.sin(a) * L / n
            pts.append((x, y))
        polys.append(taper(pts, w, w * .62, 3))
        if d <= 0 or w < 1.2:
            tips.append((x, y))
            return
        for _ in range(int(r.integers(2, 4))):
            go(x, y, a + np.deg2rad(r.uniform(spread * .5, spread * 1.5)) * r.choice([-1, 1]), L * r.uniform(.62, .84), w * r.uniform(.58, .76), d - 1)

    go(root[0], root[1], ang, L, w, depth)
    return polys, np.array(tips)


def dabs(clusters, seed, light=(-.7, -.6), cols=("#0b1d14", "#2f5a34", "#c9d86e"), rim="#e8eaa0", size=(7, 17), dens=1.0,
         soft=0.0, elong=.42, ss=2, rim_k=.6, dark_bias=.2, tex=None):
    """Foliage as many small marks: dark in the mass, lit at the edge facing the light."""
    r = np.random.default_rng(seed)
    img = np.zeros((H * ss, W * ss, 3), np.float32)
    al = np.zeros((H * ss, W * ss), np.float32)
    cd, cm, cl, ce = (hexc(c) for c in (*cols, rim))
    items = []
    for cx, cy, rx, ry in clusters:
        n = int(rx * ry / 60 * dens)
        a = r.uniform(0, 6.283, n)
        k = r.random(n) ** .5
        x, y = cx + rx * k * np.cos(a), cy + ry * k * np.sin(a)
        facing = (np.cos(a) * light[0] + np.sin(a) * light[1]) * k
        depth = k + r.normal(0, .12, n)
        items += list(zip(-depth, x, y, facing, k))
    items.sort()
    for _, x, y, fc, k in items:
        sz = r.uniform(*size)
        t = np.clip(dark_bias + (1 - dark_bias) * np.clip(fc, -1, 1) * k ** 1.5 + r.normal(0, .1), 0, 1)
        col = cd * (1 - t) ** 2 + cm * 2 * t * (1 - t) + cl * t ** 2
        if k > .84 and fc > .2:
            col = col * (1 - rim_k) + ce * rim_k
        col = col * r.uniform(.85, 1.12)
        c = (int(x * ss), int(y * ss))
        ax = (max(int(sz * ss), 1), max(int(sz * ss * elong), 1))
        cv2.ellipse(img, c, ax, r.uniform(0, 180), 0, 360, tuple(float(v) for v in col), -1, cv2.LINE_AA)
        cv2.ellipse(al, c, ax, r.uniform(0, 180) * 0, 0, 360, 1.0, -1, cv2.LINE_AA)
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    al = cv2.resize(al, (W, H), interpolation=cv2.INTER_AREA)
    rgb = img / np.maximum(al[..., None], 1e-3)
    if tex is not None:
        rgb = rgb * (1 + tex[..., None])
    if soft:
        rgb, al = gb(rgb * al[..., None], soft) / np.maximum(gb(al, soft)[..., None], 1e-3), gb(al, soft)
    return rgb, np.clip(al, 0, 1)


def scallops(clusters, seed, tones, light=(-.7, -.6), rmin=26, rmax=60, dens=1.0):
    """Editorial canopy: overlapping discs in a few flat tones, lit side light, under side dark."""
    r = np.random.default_rng(seed)
    ss = 3
    img = np.zeros((H * ss, W * ss, 3), np.float32)
    al = np.zeros((H * ss, W * ss), np.float32)
    T = [hexc(t) for t in tones]
    items = []
    for cx, cy, rx, ry in clusters:
        n = int(rx * ry / 900 * dens) + 4
        for _ in range(n):
            a, k = r.uniform(0, 6.283), r.random() ** .6
            x, y = cx + rx * k * np.cos(a), cy + ry * k * np.sin(a)
            rad = r.uniform(rmin, rmax) * (1 - .35 * k)
            items.append((y + r.uniform(-20, 20), x, y, rad, np.cos(a) * light[0] + np.sin(a) * light[1], k))
    items.sort(key=lambda q: q[0])
    for _, x, y, rad, fc, k in items:
        for j, (dx, dy, sc) in enumerate(((0, 0, 1.0), (light[0] * rad * .18, light[1] * rad * .18, .78))):
            tone = T[0] if j == 0 else (T[2] if fc * k > .15 else T[1])
            if j == 0 and fc * k > .35:
                tone = T[1]
            cv2.circle(img, (int((x + dx) * ss), int((y + dy) * ss)), int(rad * sc * ss), tuple(float(v) for v in tone), -1, cv2.LINE_AA)
            cv2.circle(al, (int((x + dx) * ss), int((y + dy) * ss)), int(rad * sc * ss), 1.0, -1, cv2.LINE_AA)
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    al = cv2.resize(al, (W, H), interpolation=cv2.INTER_AREA)
    return img / np.maximum(al[..., None], 1e-3), np.clip(al, 0, 1)


def mass(clusters, seed, tones, light=(-.85, -.4), rmin=26, rmax=60, dens=1.0, bands=(46, 16), holes=0):
    """Editorial foliage: one solid scalloped silhouette, with a mid band and a light band on the side facing the light."""
    r = np.random.default_rng(seed)
    m = np.zeros((H, W), np.uint8)
    for cx, cy, rx, ry in clusters:
        n = int(rx * ry / 900 * dens) + 4
        for _ in range(n):
            a, k = r.uniform(0, 6.283), r.random() ** .6
            x, y = cx + rx * k * np.cos(a), cy + ry * k * np.sin(a)
            rad = r.uniform(rmin, rmax) * (1 - .35 * k)
            cv2.circle(m, (int(x * 4), int(y * 4)), int(rad * 4), 255, -1, cv2.LINE_AA, 2)
    for _ in range(holes):
        cx, cy, rx, ry = clusters[int(r.integers(len(clusters)))]
        x, y = cx + r.uniform(-.6, .6) * rx, cy + r.uniform(-.6, .6) * ry
        cv2.circle(m, (int(x * 4), int(y * 4)), int(r.uniform(6, 14) * 4), 0, -1, cv2.LINE_AA, 2)
    a = m.astype(np.float32) / 255
    T = [hexc(t) for t in tones]
    b1 = rim_of(a, -light[0] * bands[0], -light[1] * bands[0])
    b2 = rim_of(a, -light[0] * bands[1], -light[1] * bands[1])
    rgb = fill(T[0])
    rgb = rgb * (1 - b1[..., None]) + T[1] * b1[..., None]
    rgb = rgb * (1 - b2[..., None]) + T[2] * b2[..., None]
    return rgb, a


def rim_of(mask, dx, dy):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    return np.clip(mask - cv2.warpAffine(mask, M, (W, H), borderMode=cv2.BORDER_REPLICATE), 0, 1)


def rays(src, centre, steps=30, decay=.975, spread=.022):
    return npr.rays(src, centre, steps, decay, spread)


def finish(img, v, seed=3, vign=.3, bloom=.2, grain_k=.012, warm=None, bth=.55, protect=None):
    """The last pass: bloom on the brightest light, vignette, grain or paper, and tone."""
    img = np.clip(img, 0, None)
    bl = gb(np.clip(img - bth, 0, None), 26) * bloom
    if protect is not None:
        bl = bl * (1 - .8 * protect[..., None])
    img = img + bl
    vv = 1 - vign * (((X - 540) / 760) ** 2 + ((Y - 960) / 1250) ** 2)
    img = img * vv[..., None]
    img = img / (1 + img * .12)
    out = srgb(np.clip(img, 0, 1))
    if v == "A":
        n = grainy(seed, .9)
        out = out + n[..., None] * grain_k * (.4 + out)
    elif v == "B":
        n = grainy(seed, .6)
        out = out + n[..., None] * grain_k * .9
    else:
        paper = fbm((H, W), 3, seed + 5, 2) - .5
        fib = streak(seed + 6, 80, 40, 1.0)
        out = out * (1 + paper[..., None] * .045 + fib[..., None] * .0015)
        if warm is not None:
            out = out * (1 - .05) + np.asarray(warm) * .05
    return np.clip(out, 0, 1)
