#!/usr/bin/env python3
"""A paper diorama drawn in code: real sheets at real heights under one light. Stills only, no video, no credits.

Each sheet has a height, so its shadow lengthens and softens with the gap beneath it. Sheets have fiber, a slight
curl at the cut edge, a visible paper thickness, and torn edges that show a lighter core. Colour is mixed in linear
light. Everything is 1080 by 1920.
"""
import cv2
import numpy as np

W, H = 1080, 1920
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
SS = 2


def hexc(s):
    s = s.lstrip("#")
    return (np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255) ** 2.2


def noise(seed, cell, stretch=(1, 1)):
    r = np.random.default_rng(seed)
    a = r.random((int(H / (cell * stretch[1])) + 3, int(W / (cell * stretch[0])) + 3), dtype=np.float32)
    return cv2.resize(a, (W, H), interpolation=cv2.INTER_CUBIC)


def fbm(seed, cell, octaves=4, stretch=(1, 1), gain=.5):
    out, amp, tot = 0, 1, 0
    for i in range(octaves):
        out = out + noise(seed + i * 17, max(cell / 2 ** i, 1.5), stretch) * amp
        tot += amp
        amp *= gain
    return out / tot


def fibers(seed, count=900):
    """Long hand-made paper fibers, as a height map."""
    r = np.random.default_rng(seed)
    a = np.zeros((H, W), np.float32)
    for _ in range(count):
        x, y, t = r.uniform(-40, W + 40), r.uniform(-40, H + 40), r.uniform(0, 6.28)
        pts = []
        for _ in range(int(r.integers(5, 12))):
            pts.append((x, y))
            t += r.normal(0, .32)
            x += np.cos(t) * 13
            y += np.sin(t) * 13
        cv2.polylines(a, [np.int32(pts)], False, float(r.uniform(.35, 1)), 1, cv2.LINE_AA)
    return cv2.GaussianBlur(a, (0, 0), .7)


_FIBER = {}


def fiber_map(seed):
    k = seed % 5
    if k not in _FIBER:
        _FIBER[k] = fibers(4000 + k)
    return np.roll(_FIBER[k], (seed * 37) % H, 0)


def raster(*polys):
    img = np.zeros((H * SS, W * SS), np.uint8)
    for p in polys:
        cv2.fillPoly(img, [np.round(np.asarray(p, np.float64)[:, :2] * SS * 16).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=4)
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def _cr(p, n):
    """Open Catmull-Rom through p."""
    p = np.asarray(p, np.float64)
    if len(p) < 3:
        return p
    q = np.vstack([2 * p[0] - p[1], p, 2 * p[-1] - p[-2]])
    out = []
    t = np.linspace(0, 1, n, endpoint=False)[:, None]
    for i in range(1, len(q) - 2):
        a, b, c, d = q[i - 1], q[i], q[i + 1], q[i + 2]
        out.append(.5 * ((2 * b) + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t ** 2 + (3 * b - a - 3 * c + d) * t ** 3))
    return np.vstack(out + [p[-1:]])


def curve(pts, closed=True, n=12):
    """A smooth outline. A point written (x, y, 1) is a sharp scissor corner."""
    xy = [tuple(p[:2]) for p in pts]
    corner = [len(p) > 2 and p[2] == 1 for p in pts]
    if not closed:
        return _cr(xy, n)
    if not any(corner):
        m = len(xy)
        wrap = xy[-2:] + xy + xy[:3]
        c = _cr(wrap, n)
        return c[2 * n:(m + 2) * n]
    s = corner.index(True)
    xy, corner = xy[s:] + xy[:s], corner[s:] + corner[:s]
    xy.append(xy[0])
    corner.append(True)
    out, run = [], [xy[0]]
    for p, c in zip(xy[1:], corner[1:]):
        run.append(p)
        if c:
            out.append(_cr(run, n)[:-1])
            run = [p]
    return np.vstack(out)


def ribbon(pts, widths, n=12, cap=True):
    """A tapered stroke along a curve: fingers, locks of hair, branches."""
    c = _cr(pts, n)
    w = np.interp(np.linspace(0, 1, len(c)), np.linspace(0, 1, len(widths)), widths)
    d = np.gradient(c, axis=0)
    d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-6
    nrm = np.stack([-d[:, 1], d[:, 0]], 1) * (w[:, None] / 2)
    poly = np.vstack([c + nrm, (c - nrm)[::-1]])
    if cap:
        a = np.linspace(-np.pi / 2, np.pi / 2, 9)[1:-1]
        t, u = d[-1], nrm[-1] / (np.linalg.norm(nrm[-1]) + 1e-6)
        tip = [c[-1] + u * np.sin(x) * w[-1] / 2 + t * np.cos(x) * w[-1] / 2 for x in a[::-1]]
        poly = np.vstack([(c + nrm), tip, (c - nrm)[::-1]])
    return poly


def place(pts, s=1, a=0, o=(0, 0), flip=False, pivot=(0, 0)):
    """Move local points into the frame: scale, flip, turn about pivot, then translate."""
    p = np.asarray(pts, np.float64)[:, :2] - np.asarray(pivot, np.float64)
    if flip:
        p = p * [-1, 1]
    c, n = np.cos(np.radians(a)), np.sin(np.radians(a))
    p = np.stack([p[:, 0] * c - p[:, 1] * n, p[:, 0] * n + p[:, 1] * c], 1) * s
    q = p + np.asarray(o, np.float64)
    src = np.asarray(pts)
    if src.shape[1] > 2:
        return np.hstack([q, src[:, 2:3]])
    return q


def shift(m, dx, dy):
    return cv2.warpAffine(m, np.float32([[1, 0, dx], [0, 1, dy]]), (W, H), flags=cv2.INTER_LINEAR)


def torn(m, amp, cell, seed):
    dx = (fbm(seed, cell, 4) - .5) * 2 * amp
    dy = (fbm(seed + 9, cell, 4) - .5) * 2 * amp
    return cv2.remap(m, XX + dx, YY + dy, cv2.INTER_LINEAR)


GAPS = np.array([1.5, 5, 12, 26, 55, 110], np.float32)


class Stage:
    def __init__(self, base, light=(-.45, -.62, .64), key=None, ambient=.34, key_gain=.95, key_color="#fff4e2",
                 shadow="#1b2030", shadow_power=.72, soft=.34, seed=1):
        self.img = base.astype(np.float32).copy()
        v = np.array(light, np.float32)
        self.L = v / np.linalg.norm(v)
        self.key = key if key is not None else np.ones((H, W), np.float32)
        self.ambient, self.key_gain = ambient, key_gain
        self.key_color = hexc(key_color)
        self.shadow = hexc(shadow)
        self.power, self.soft = shadow_power, soft
        self.seed = seed
        self.n = 0
        self.z = np.zeros((H, W), np.float32)

    def _cast(self, m, z, strength=1.0):
        off = np.array([-self.L[0], -self.L[1]]) / max(self.L[2], .2)
        layers = []
        for g in GAPS:
            layers.append(cv2.GaussianBlur(shift(m, off[0] * g * .85, off[1] * g * .85), (0, 0), .7 + g * self.soft))
        stack = np.stack(layers, 0)
        gap = np.clip(z - self.z, GAPS[0], GAPS[-1])
        idx = np.interp(gap, GAPS, np.arange(len(GAPS), dtype=np.float32)).astype(np.float32)
        lo = np.clip(idx.astype(np.int32), 0, len(GAPS) - 2)
        f = idx - lo
        rows, cols = np.indices(lo.shape)
        s = stack[lo, rows, cols] * (1 - f) + stack[lo + 1, rows, cols] * f
        ao = cv2.GaussianBlur(m, (0, 0), 2.6) * .55
        s = np.clip(np.maximum(s, ao) * (1 - m) * self.power * strength, 0, .96)[..., None]
        self.img = self.img * (1 - s) + self.img * self.shadow * 2.2 * s

    def _surface(self, m, seed, kind, curl):
        tooth = fbm(seed + 3, 5, 3) - .5
        broad = fbm(seed + 5, 340, 3) - .5
        h = tooth * 1.5 + broad * 26
        if kind != "smooth":
            h = h + fiber_map(seed) * (1.1 if kind == "washi" else .7)
        if kind == "bark":
            h = h + (fbm(seed + 8, 34, 4, stretch=(.2, 5)) - .5) * 17
        if curl:
            d = cv2.distanceTransform((m > .5).astype(np.uint8), cv2.DIST_L2, 5)
            h = h + np.exp(-d / 20) * curl
        gx = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) / 8
        gy = cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) / 8
        n = 1 / np.sqrt(gx * gx + gy * gy + 1)
        lam = (-gx * self.L[0] - gy * self.L[1] + self.L[2]) * n / self.L[2]
        return np.clip(lam, .3, 1.75)

    def sheet(self, m, color, z, kind="matte", tear=None, fringe=None, curl=2.2, shadow=1.0, tint=None, dof=0, edge=.16,
              rim=None, opacity=1.0, seed=None):
        """Lay one sheet. tear=(amp, cell). fringe is the lighter torn core. rim=(color, radius, amount, (dx, dy)) is light
        leaking through the paper near an edge, for backlit sheets."""
        self.n += 1
        s = seed if seed is not None else self.seed * 1000 + self.n * 7
        if tear:
            m = torn(m, tear[0], tear[1], s + 1)
        m = np.clip(m, 0, 1).astype(np.float32)
        if shadow:
            self._cast(m, z, shadow)
        if fringe is not None and tear:
            core = torn(cv2.dilate(m, np.ones((3, 3), np.uint8)), tear[0] * .34, tear[1] * .22, s + 2)
            fr = np.clip(core - m, 0, 1)[..., None]
            self.img = self.img * (1 - fr) + hexc(fringe) * self.key[..., None] * 1.1 * fr
        c = hexc(color) if isinstance(color, str) else color
        if c.ndim == 1:
            c = np.broadcast_to(c, (H, W, 3))
        lam = self._surface(m, s, kind, curl)
        light = self.ambient + self.key * self.key_gain * lam
        col = c * light[..., None] * (self.key_color * .6 + .4)
        if edge:
            t = 1.6
            lit = np.clip(m - shift(m, self.L[0] * t, self.L[1] * t), 0, 1)
            dark = np.clip(m - shift(m, -self.L[0] * t, -self.L[1] * t), 0, 1)
            col = col * (1 + lit[..., None] * edge * 3.2) * (1 - dark[..., None] * edge * 1.6)
        if rim:
            rc, r, amt, d = rim
            g = cv2.GaussianBlur(m, (0, 0), r)
            band = np.clip(m - shift(g, d[0] * r, d[1] * r), 0, 1)
            col = col + hexc(rc) * (band * amt)[..., None]
        if dof:
            k = cv2.GaussianBlur(m, (0, 0), dof)[..., None]
            pre = cv2.GaussianBlur(col * m[..., None], (0, 0), dof)
            a = k * opacity
            self.img = self.img * (1 - a) + pre * opacity
        else:
            a = (m * opacity)[..., None]
            self.img = self.img * (1 - a) + col * a
        self.z = np.where(m > .5, z, self.z)
        return m

    def haze(self, color, amount):
        a = np.clip(amount, 0, 1)[..., None]
        self.img = self.img * (1 - a) + hexc(color) * a

    def glow(self, color, amount):
        self.img = self.img + hexc(color) * amount[..., None]

    def finish(self, bloom=.5, thresh=.5, grain=.011, vignette=.3, lift=0.0, gamma=1.0, seed=3):
        x = self.img
        hi = np.clip(x - thresh, 0, None)
        if bloom:
            x = x + (cv2.GaussianBlur(hi, (0, 0), 6) * .7 + cv2.GaussianBlur(hi, (0, 0), 26) * .6 + cv2.GaussianBlur(hi, (0, 0), 70) * .4) * bloom
        r = np.sqrt(((XX - W / 2) / (W * .72)) ** 2 + ((YY - H / 2) / (H * .72)) ** 2)
        x = x * (1 - (np.clip(r - .5, 0, 1) * vignette * 2.2)[..., None])
        x = np.clip(x, 0, None)
        x = x * (1 + .1) / (1 + .1 * x)
        x = np.clip(x, 0, 1) ** (1 / 2.2)
        x = lift + x * (1 - lift)
        x = x ** gamma
        x = x + (x - .5) * x * (1 - x) * .42
        g = np.random.default_rng(seed).normal(0, grain, (H, W))
        return np.clip(x + g[..., None], 0, 1)
