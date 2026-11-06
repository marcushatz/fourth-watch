"""Painting, inking and shading tools that work from 3D passes. Every style reads real form from the render."""
import sys

import cv2
import numpy as np
from scipy.ndimage import gaussian_filter1d, map_coordinates
from skimage.morphology import skeletonize

sys.path.insert(0, "/home/claude/fw-tools")
import exr


def hexc(s):
    s = s.lstrip("#")
    return (np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255) ** 2.2


def srgb(x):
    return np.clip(x, 0, 1) ** (1 / 2.2)


def linear(x):
    return np.clip(x, 0, 1) ** 2.2


def lum(x):
    return x[..., 0] * .3 + x[..., 1] * .59 + x[..., 2] * .11


def blur(x, s):
    return cv2.GaussianBlur(np.asarray(x, np.float32), (0, 0), s)


def noise(shape, cell, seed):
    h, w = shape[:2]
    r = np.random.default_rng(seed)
    a = r.random((int(h / cell) + 3, int(w / cell) + 3), dtype=np.float32)
    return cv2.resize(a, (w, h), interpolation=cv2.INTER_CUBIC)


def fbm(shape, cell, seed, oct=4):
    o, a, t = 0, 1, 0
    for i in range(oct):
        o = o + noise(shape, max(cell / 2 ** i, 1.5), seed + i * 13) * a
        t += a
        a *= .5
    return o / t


def save(path, img, q=93):
    im = (np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)[..., ::-1]
    cv2.imwrite(str(path), im, [cv2.IMWRITE_JPEG_QUALITY, q])


class Passes:
    def __init__(self, beauty, gbuf=None):
        b = exr.layers(beauty)
        g = exr.layers(gbuf) if gbuf else b
        self.C = b["Combined"][..., :3]
        self.Zb = b["Depth"][..., 0]
        self.A = np.clip(g["Diffuse Color"][..., :3], 0, 1)
        self.D = g["Diffuse Direct"][..., :3]
        self.N = g["Normal"][..., :3]
        self.Z = np.minimum(g["Depth"][..., 0], 1e5)
        self.I = g["Object Index"][..., 0]
        self.AO = g["Ambient Occlusion"][..., 0] if "Ambient Occlusion" in g else np.ones(self.Z.shape, np.float32)
        self.h, self.w = self.Z.shape

    def mask(self, *ids):
        m = np.zeros(self.Z.shape, np.float32)
        for i in ids:
            m = np.maximum(m, (np.abs(self.I - i) < .5).astype(np.float32))
        return m


def fog(C, Z, color, dist, power=1.2, far=None):
    f = 1 - np.exp(-(Z / dist) ** power)
    return C * (1 - f[..., None]) + np.asarray(color, np.float32) * f[..., None], f


def edge_map(p, hair_ids=(2, 3, 4), hair_blur=6, tn=.55, tz=.012):
    N = p.N.copy()
    hair = p.mask(*hair_ids)
    if hair_blur:
        Nb = blur(N, hair_blur)
        N = N * (1 - hair[..., None]) + Nb * hair[..., None]
    en = sum(np.abs(cv2.Sobel(N[..., i], cv2.CV_32F, 1, 0, ksize=3)) + np.abs(cv2.Sobel(N[..., i], cv2.CV_32F, 0, 1, ksize=3)) for i in range(3)) / 8
    lz = np.log(np.maximum(p.Z, 1))
    ez = (np.abs(cv2.Sobel(lz, cv2.CV_32F, 1, 0, ksize=3)) + np.abs(cv2.Sobel(lz, cv2.CV_32F, 0, 1, ksize=3))) / 8
    ei = ((np.abs(cv2.Sobel(p.I, cv2.CV_32F, 1, 0, ksize=3)) + np.abs(cv2.Sobel(p.I, cv2.CV_32F, 0, 1, ksize=3))) > .1).astype(np.float32)
    return np.clip(np.maximum.reduce([(en - tn * .4) / tn, (ez - tz * .4) / tz, ei]), 0, 1)


def trace(mask, min_len=12):
    """Walk a thin mask into polylines."""
    sk = skeletonize(mask > .5)
    ys, xs = np.nonzero(sk)
    live = set(zip(ys.tolist(), xs.tolist()))
    nb = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]
    def nbs(p):
        return [(p[0] + a, p[1] + b) for a, b in nb if (p[0] + a, p[1] + b) in live]
    ends = [p for p in live if len(nbs(p)) == 1]
    paths = []
    for pool in (ends, list(live)):
        for s in pool:
            if s not in live:
                continue
            path, cur = [s], s
            live.discard(s)
            while True:
                n = nbs(cur)
                if not n:
                    break
                if len(path) > 1:
                    d = (cur[0] - path[-2][0], cur[1] - path[-2][1])
                    n.sort(key=lambda q: -(q[0] - cur[0]) * d[0] - (q[1] - cur[1]) * d[1])
                cur = n[0]
                live.discard(cur)
                path.append(cur)
            if len(path) >= min_len:
                paths.append(np.array(path, np.float64)[:, ::-1])
    return paths


def ink(paths, shape, width=3.0, seed=1, taper=.5, ss=2, wobble=0, wmap=None):
    """Brush lines with thick and thin. Returns coverage."""
    h, w = shape[:2]
    out = np.zeros((h * ss, w * ss), np.uint8)
    r = np.random.default_rng(seed)
    for p in paths:
        L = len(p)
        q = gaussian_filter1d(p, 2.2, axis=0, mode="nearest")
        if wobble:
            q = q + gaussian_filter1d(r.normal(0, wobble * 6, q.shape), 9, axis=0, mode="nearest")
        t = np.linspace(0, 1, L)
        prof = np.sin(np.pi * t) ** taper
        prof = prof * (1 + .5 * gaussian_filter1d(r.normal(0, 3, L), 14, mode="nearest"))
        base = width * r.uniform(.7, 1.25) * min(1, L / 60 + .35)
        for i in range(0, L - 1, 2):
            k = 1
            if wmap is not None:
                y, x = int(np.clip(q[i, 1], 0, h - 1)), int(np.clip(q[i, 0], 0, w - 1))
                k = wmap[y, x]
            th = int(max(1, base * prof[i] * k * ss))
            a = (q[i] * ss + .5).astype(np.int32)
            b = (q[min(i + 2, L - 1)] * ss + .5).astype(np.int32)
            cv2.line(out, tuple(a.tolist()), tuple(b.tolist()), 255, th, cv2.LINE_AA)
    return cv2.resize(out, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def orientation(img_lum, sigma=6):
    b = blur(img_lum, sigma)
    gx = cv2.Sobel(b, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(b, cv2.CV_32F, 0, 1, ksize=3)
    # Structure tensor, so strokes follow form rather than noise.
    jxx, jyy, jxy = blur(gx * gx, sigma), blur(gy * gy, sigma), blur(gx * gy, sigma)
    return .5 * np.arctan2(2 * jxy, jxx - jyy) + np.pi / 2


def painter(ref, brushes=(40, 20, 10, 5), angle=None, seed=1, thresh=.035, length=(4, 10), bg=None, jitter=.018, opacity=1.0):
    """Layered strokes, large to small, each following the form (after Hertzmann's painterly rendering)."""
    h, w = ref.shape[:2]
    r = np.random.default_rng(seed)
    canvas = (np.full_like(ref, ref.mean((0, 1))) if bg is None else bg).astype(np.float32).copy()
    if angle is None:
        angle = orientation(lum(ref), 7)
    ca, sa = np.cos(angle), np.sin(angle)
    for R in brushes:
        tgt = blur(ref, R * .42)
        diff = np.abs(canvas - tgt).sum(2)
        step = max(int(R * .9), 2)
        strokes = []
        for y in range(0, h, step):
            for x in range(0, w, step):
                y1, x1 = min(y + step, h), min(x + step, w)
                cell = diff[y:y1, x:x1]
                if cell.mean() < thresh:
                    continue
                j = int(cell.argmax())
                yy, xx = y + j // (x1 - x), x + j % (x1 - x)
                strokes.append((yy, xx))
        r.shuffle(strokes)
        for yy, xx in strokes:
            c = tgt[yy, xx] * (1 + r.normal(0, jitter, 3))
            pts = [(xx, yy)]
            px, py = float(xx), float(yy)
            dx, dy = 0.0, 0.0
            for i in range(int(r.integers(length[0], length[1]))):
                iy, ix = int(py), int(px)
                if not (0 <= iy < h and 0 <= ix < w):
                    break
                vx, vy = ca[iy, ix], sa[iy, ix]
                if vx * dx + vy * dy < 0:
                    vx, vy = -vx, -vy
                dx, dy = vx, vy
                px += vx * R * .8
                py += vy * R * .8
                pts.append((int(px), int(py)))
                if i > 2 and np.abs(tgt[iy, ix] - c).sum() > np.abs(tgt[iy, ix] - canvas[iy, ix]).sum():
                    break
            cv2.polylines(canvas, [np.int32(pts)], False, c.tolist(), max(int(R * r.uniform(.8, 1.15)), 1), cv2.LINE_AA)
    return canvas


def lic(angle, shape, cell=1.6, steps=14, seed=3, scale=1.2):
    """Bristle streaks: noise smeared along the stroke direction."""
    h, w = shape[:2]
    n = np.random.default_rng(seed).random((h, w), dtype=np.float32)
    n = blur(n, cell * .6)
    angle = angle.astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ca, sa = np.cos(angle).astype(np.float32), np.sin(angle).astype(np.float32)
    acc = n.copy()
    px, py = xx.copy(), yy.copy()
    for s in (1, -1):
        px, py = xx.copy(), yy.copy()
        for i in range(steps):
            a = cv2.remap(ca, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            b = cv2.remap(sa, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            px, py = px + a * s * scale, py + b * s * scale
            acc = acc + cv2.remap(n, px, py, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    acc = acc / (2 * steps + 1)
    return (acc - acc.mean()) / (acc.std() + 1e-6)


def impasto(img, angle, amount=.07, paper=None, seed=3):
    b = lic(angle, img.shape, seed=seed).astype(np.float32)
    img = img.astype(np.float32)
    h = (b + (lum(img) - blur(lum(img), 3)) * 8).astype(np.float32)
    gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) / 4
    gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) / 4
    sh = np.clip(-(gx * .7 + gy * .7) * amount + b * amount * .35, -.3, .3)
    return np.clip(img * (1 + sh[..., None]), 0, 1)


def paper_tex(shape, seed=5, amount=.05):
    a = fbm(shape, 3, seed, 3) - .5
    b = fbm(shape, 90, seed + 2, 3) - .5
    return 1 + a * amount * 2 + b * amount * .8


def posterize_light(L, levels, soft=.012):
    """levels: list of (threshold, value), low to high. Smooth steps."""
    out = np.full(L.shape, levels[0][1], np.float32)
    for th, v in levels[1:]:
        t = np.clip((L - th) / soft * .5 + .5, 0, 1)
        out = out * (1 - t) + v * t
    return out


def smooth_in(x, mask, s):
    """Blur x within a mask, so regions don't bleed into each other."""
    m = blur(mask, s) + 1e-4
    return blur(x * mask, s) / m


def regions_blur(x, p, ids, s):
    out = x.copy()
    for i in ids:
        m = p.mask(i)
        if m.max() == 0:
            continue
        out = np.where(m > .5, smooth_in(x, m, s), out)
    return out


def grain(img, amount=.012, seed=2):
    return np.clip(img + np.random.default_rng(seed).normal(0, amount, img.shape[:2])[..., None], 0, 1)


def bloom(x, th=.6, a=.5):
    hi = np.clip(x - th, 0, None)
    return x + (blur(hi, 6) * .7 + blur(hi, 26) * .6 + blur(hi, 70) * .4) * a


def vignette(x, amount=.3):
    h, w = x.shape[:2]
    y, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w * .72)) ** 2 + ((y - h / 2) / (h * .72)) ** 2)
    return x * (1 - np.clip(r - .5, 0, 1)[..., None] * amount * 2.2)


def curve(x, c=.42):
    return np.clip(x + (x - .5) * x * (1 - x) * c, 0, 1)


def rays(src, center, steps=36, decay=.965, spread=.016):
    """Light shafts: a bright mask smeared away from the light."""
    h, w = src.shape[:2]
    sm = cv2.resize(src.astype(np.float32), (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    cx, cy = center[0] / 2, center[1] / 2
    out = np.zeros_like(sm)
    a, tot = 1.0, 0.0
    for i in range(steps):
        s = 1 - i * spread
        M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
        out += cv2.warpAffine(sm, M, (w // 2, h // 2), borderMode=cv2.BORDER_REPLICATE) * a
        tot += a
        a *= decay
    return cv2.resize(out / tot, (w, h), interpolation=cv2.INTER_LINEAR)
