"""The Fourth Watch paper engine, made for animation.

Every shape is still drawn in the storyboard's 720 x 1280 design space, but the pixels are rendered at any scale
(FW_SCALE=1.5 gives 1080 x 1920). A Stage no longer paints one flat picture: it keeps each depth band as its own
layer (premultiplied colour plus a "multiply what's below" map), so the camera can move the bands at different
speeds (parallax) and moving pieces can be slotted in between them every frame.

The look is the Cut Paper v2 stage (style_test/build_cut_paper_v2.py), unchanged in its maths: one key light,
a drop shadow under every sheet offset away from the key, a rim highlight on the near edge, a shade on the far
edge, fibre and matte paper texture, haze between bands, thin gold where God acts.
"""
import os
from functools import lru_cache

import cv2
import numpy as np

DW, DH = 720, 1280
S = float(os.environ.get("FW_SCALE", "1.5"))
RW, RH = int(round(DW * S)), int(round(DH * S))
SS = 2
DEPTH = dict(sky=.12, far=.4, haze=.55, mid=.72, subject=1.0, near=1.28, front=1.55)


def hexc(s):
    if not isinstance(s, str):
        return np.asarray(s, np.float32)
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


GOLD = hexc("#e9b654")
LEAF = [(0, -1), (.42, -.62), (.5, -.15), (.34, .4), (0, 1), (-.34, .4), (-.5, -.15), (-.42, -.62)]


# The canvas: where the pixels of the current drawing live ------------------------------------------------

class Canvas:
    def __init__(self, x0=0.0, y0=0.0, w=DW, h=DH):
        self.x0, self.y0 = float(x0), float(y0)
        self.pw, self.ph = max(2, int(round(w * S))), max(2, int(round(h * S)))
        self.w, self.h = self.pw / S, self.ph / S
        py, px = np.mgrid[0:self.ph, 0:self.pw].astype(np.float32)
        self.PX, self.PY = px, py
        self.X, self.Y = (px + .5) / S + self.x0, (py + .5) / S + self.y0
        self.nx0, self.ny0 = self.x0, self.y0

    @property
    def key(self):
        return (self.pw, self.ph)


FULL = Canvas()
MARGINED = {}
_cur = [FULL]


def cv_():
    return _cur[-1]


class on:
    """with on(canvas): draw into that canvas."""

    def __init__(self, canvas):
        self.c = canvas

    def __enter__(self):
        _cur.append(self.c)
        return self.c

    def __exit__(self, *a):
        _cur.pop()


def grids():
    c = cv_()
    return c.X, c.Y


# Noise --------------------------------------------------------------------------------------------------

@lru_cache(maxsize=160)
def _fbm(seed, scale, octaves, keep, stretch, pw, ph, x0, y0):
    r = np.random.default_rng(seed)
    out, amp, tot = np.zeros((ph, pw), np.float32), 1.0, 0.0
    for o in range(octaves):
        sx, sy = max(2, int(scale * stretch[0] / 2 ** o)), max(2, int(scale * stretch[1] / 2 ** o))
        g = r.random((DH // sy + 3, DW // sx + 3), dtype=np.float32)
        # the noise lives in design space, so a crop sees the same noise as the full frame
        gx = (np.arange(pw, dtype=np.float32) + .5) / S + x0
        gy = (np.arange(ph, dtype=np.float32) + .5) / S + y0
        # map design coordinates to the grid the original resize used: grid spans the frame with (n-1) cells
        mx = (gx / DW * (g.shape[1]) - .5).astype(np.float32)
        my = (gy / DH * (g.shape[0]) - .5).astype(np.float32)
        MX, MY = np.meshgrid(mx, my)
        out += cv2.remap(g, MX, MY, cv2.INTER_CUBIC, borderMode=cv2.BORDER_WRAP) * amp
        tot += amp
        amp *= keep
    out /= tot
    return out


def fbm(seed, scale=220, octaves=5, keep=.5, stretch=(1, 1)):
    c = cv_()
    out = _fbm(int(seed), float(scale), int(octaves), float(keep), tuple(stretch), c.pw, c.ph, round(c.nx0, 3), round(c.ny0, 3))
    lo, hi = _range(int(seed), float(scale), int(octaves), float(keep), tuple(stretch))
    return np.clip((out - lo) / (hi - lo + 1e-6), 0, 1)


@lru_cache(maxsize=400)
def _range(seed, scale, octaves, keep, stretch):
    """The normalising range of a noise field, taken from the full frame so crops agree with it."""
    a = _fbm_small(seed, scale, octaves, keep, stretch)
    return float(a.min()), float(a.max())


def _fbm_small(seed, scale, octaves, keep, stretch):
    r = np.random.default_rng(seed)
    w, h = 180, 320
    out, amp, tot = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(octaves):
        sx, sy = max(2, int(scale * stretch[0] / 2 ** o)), max(2, int(scale * stretch[1] / 2 ** o))
        g = r.random((DH // sy + 3, DW // sx + 3), dtype=np.float32)
        gx = (np.arange(w, dtype=np.float32) + .5) * DW / w
        gy = (np.arange(h, dtype=np.float32) + .5) * DH / h
        mx = np.clip(gx / DW * g.shape[1] - .5, 0, g.shape[1] - 1).astype(np.float32)
        my = np.clip(gy / DH * g.shape[0] - .5, 0, g.shape[0] - 1).astype(np.float32)
        MX, MY = np.meshgrid(mx, my)
        out += cv2.remap(g, MX, MY, cv2.INTER_CUBIC) * amp
        tot += amp
        amp *= keep
    return out / tot


def texture(kind, seed):
    fine = fbm(seed + 1, 4, 2) - .5
    if kind == "smooth":
        return 1 + fine * .035
    if kind == "fiber":
        return 1 + (fbm(seed, 46, 4, stretch=(.22, 3)) - .5) * .3 + fine * .05
    if kind == "sky":
        return 1 + (fbm(seed, 230, 4) - .5) * .1 + fine * .03
    if kind == "none":
        return np.ones((cv_().ph, cv_().pw), np.float32)
    return 1 + (fbm(seed, 44, 4) - .5) * .13 + fine * .05


# Shapes -------------------------------------------------------------------------------------------------

def spline(pts, closed=True, n=12):
    p, m, out = np.array(pts, np.float32), len(pts), []
    for i in range(m if closed else m - 1):
        a, b, c, d = p[(i - 1) % m], p[i], p[(i + 1) % m], p[(i + 2) % m]
        if not closed:
            a = p[max(i - 1, 0)]
            d = p[min(i + 2, m - 1)]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t ** 3))
    if not closed:
        out.append(p[-1])
    return np.array(out, np.float32)


def _px(p):
    c = cv_()
    q = (np.asarray(p, np.float32).reshape(-1, 2) - [c.x0, c.y0]) * (S * SS)
    return q


def _blank():
    c = cv_()
    return np.zeros((c.ph * SS, c.pw * SS), np.uint8)


def _done(m):
    c = cv_()
    return cv2.resize(m, (c.pw, c.ph), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def fill(*polys):
    """Rasterize polygons (design units) on the current canvas, anti-aliased, touching only their bounding box."""
    c = cv_()
    pts = [_px(p) for p in polys if p is not None and len(p) >= 3]
    out = np.zeros((c.ph, c.pw), np.float32)
    if not pts:
        return out
    allp = np.concatenate(pts)
    x0 = max(0, int(np.floor(allp[:, 0].min() / SS)) - 2)
    y0 = max(0, int(np.floor(allp[:, 1].min() / SS)) - 2)
    x1 = min(c.pw, int(np.ceil(allp[:, 0].max() / SS)) + 2)
    y1 = min(c.ph, int(np.ceil(allp[:, 1].max() / SS)) + 2)
    if x1 <= x0 or y1 <= y0:
        return out
    m = np.zeros(((y1 - y0) * SS, (x1 - x0) * SS), np.uint8)
    off = np.float32([x0 * SS, y0 * SS])
    for q in pts:
        cv2.fillPoly(m, [np.int32(np.round((q - off) * 4))], 255, cv2.LINE_AA, shift=2)
    out[y0:y1, x0:x1] = cv2.resize(m, (x1 - x0, y1 - y0), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
    return out


def polyline(pts, w, closed=False):
    m = _blank()
    cv2.polylines(m, [np.int32(np.round(_px(pts) * 4))], closed, 255, max(1, int(round(w * S * SS))), cv2.LINE_AA, shift=2)
    return _done(m)


def stroke(p0, p1, width):
    return polyline([p0, p1], width)


def ribbon(pts, widths, n=14):
    """A strip of paper along a curve, its width changing along the way (widths in design units)."""
    c = spline(pts, closed=False, n=n)
    out = _blank()
    w = np.interp(np.linspace(0, 1, len(c)), np.linspace(0, 1, len(widths)), widths)
    q = _px(c)
    for a, b, t in zip(q[:-1], q[1:], w):
        cv2.line(out, tuple(np.int32(np.round(a * 4))), tuple(np.int32(np.round(b * 4))), 255, max(1, int(round(t * S * SS))), cv2.LINE_AA, shift=2)
    return _done(out)


def ellipse(x, y, a, b, rot=0, n=48):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    p = np.stack([a * np.cos(t), b * np.sin(t)], 1)
    c, s = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    return np.stack([p[:, 0] * c - p[:, 1] * s + x, p[:, 0] * s + p[:, 1] * c + y], 1)


def circle(x, y, r):
    return fill(ellipse(x, y, r, r, n=max(24, int(r * 1.2))))


def arc(cx, cy, r, a0, a1, w):
    a = np.radians(np.linspace(a0, a1, 90))
    return polyline(np.stack([cx + r * np.cos(a), cy + r * np.sin(a)], 1), w)


def mass_pts(seed, cx, cy, rx, ry, lobes=9):
    r = np.random.default_rng(seed)
    ph = r.uniform(0, 6.28, 4)
    pts = []
    for i in range(30):
        a = i / 30 * 2 * np.pi
        k = 1 + .13 * np.sin(2 * a + ph[0]) + .1 * np.sin(3 * a + ph[1]) + .06 * np.sin(5 * a + ph[2]) + .035 * np.sin(8 * a + ph[3])
        pts.append((cx + rx * k * np.cos(a), cy + ry * k * np.sin(a)))
    return spline(pts, n=4)


def mass(seed, cx, cy, rx, ry, lobes=9):
    """A big grouped foliage shape with an uneven, natural edge."""
    return fill(mass_pts(seed, cx, cy, rx, ry, lobes))


def leaf_poly(x, y, s, a, shape=LEAF):
    c, sn = np.cos(a), np.sin(a)
    p = np.array(shape, np.float32) * s
    return spline(np.stack([p[:, 0] * c - p[:, 1] * sn + x, p[:, 0] * sn + p[:, 1] * c + y], 1))


def big_leaves(seed, boxes, n, size):
    r = np.random.default_rng(seed)
    polys = []
    for x0, y0, x1, y1 in boxes:
        for _ in range(n):
            x, y, s, a = r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(*size), r.uniform(0, 3.14)
            polys.append(leaf_poly(x, y, s, a))
    return fill(*polys)


def trunk_pts(seed, x, width, top=-20, bottom=DH + 20, lean=0):
    r = np.random.default_rng(seed)
    ys = np.linspace(top, bottom, 14)
    wobble = r.uniform(-.12, .12, 14) * width
    left = [(x + lean * (y - DH / 2) / DH - width * (.5 + .16 * (i / 13) ** 4) + wobble[i], y) for i, y in enumerate(ys)]
    right = [(x + lean * (y - DH / 2) / DH + width * (.5 + .22 * (i / 13) ** 4) + wobble[13 - i], y) for i, y in enumerate(ys)]
    return np.array(left + right[::-1], np.float32)


def trunk(seed, x, width, top=-20, bottom=DH + 20, lean=0):
    return fill(trunk_pts(seed, x, width, top, bottom, lean))


def soft(x, y, rx, ry):
    X, Y = grids()
    return np.exp(-(((X - x) / rx) ** 2 + ((Y - y) / ry) ** 2)).astype(np.float32)


def wander(mask, seed, amount=5, scale=26):
    """Edges wander slightly, so nothing looks machine cut."""
    c = cv_()
    n1, n2 = fbm(seed, scale, 3), fbm(seed + 1, scale, 3)
    mx, my = c.PX + (n1 - .5) * amount * 2 * S, c.PY + (n2 - .5) * amount * 2 * S
    return cv2.remap(mask, mx, my, cv2.INTER_LINEAR)


def shift(m, dx, dy):
    c = cv_()
    return cv2.warpAffine(m, np.float32([[1, 0, dx * S], [0, 1, dy * S]]), (c.pw, c.ph))


def gblur(m, sigma):
    if sigma <= 0:
        return m
    return cv2.GaussianBlur(m, (0, 0), sigma * S)


def warp_design(m, mat):
    """Apply a 2x3 affine given in design units to a mask on the current canvas."""
    c = cv_()
    A = np.float32(mat)
    T1 = np.float32([[S, 0, -c.x0 * S], [0, S, -c.y0 * S], [0, 0, 1]])
    T0 = np.linalg.inv(T1)
    M = (T1 @ np.vstack([A, [0, 0, 1]]) @ T0)[:2]
    return cv2.warpAffine(m, M.astype(np.float32), (c.pw, c.ph))


# The stage -------------------------------------------------------------------------------------------

class Layer:
    __slots__ = ("band", "PM", "G", "slot", "dyn", "tag", "open")

    def __init__(self, band, pw, ph, slot=None, tag=None):
        self.band, self.slot, self.G, self.dyn = band, slot, None, False
        self.tag, self.open = tag, tag is not None
        self.PM = None
        if slot is None:
            self.PM = np.zeros((ph, pw, 4), np.float32)
            self.PM[..., 3] = 1


class Stage:
    """Paper sheets stacked under one key light, kept as depth layers."""

    def __init__(self, key, top, bottom, ambient=.74, diffuse=.42, fall=880, light="#fff2d6", seed=1, canvas=None, base=True, margin=60):
        self.cv = canvas or (MARGINED.setdefault(margin, Canvas(-margin, -margin, DW + 2 * margin, DH + 2 * margin)) if margin else FULL)
        self.key, self.ambient, self.diffuse, self.fall = key, ambient, diffuse, fall
        self.light = hexc(light)
        dx, dy = DW / 2 - key[0], DH / 2 - key[1]
        n = np.hypot(dx, dy) + 1e-3
        self.dir = dx / n, dy / n
        self.seed, self.count = seed, 0
        self.layers, self.labels = [], []
        self.top, self.bottom = top, bottom
        if base:
            _cur[0] = self.cv       # a shot's stage becomes the canvas everything is drawn on by default
        with on(self.cv):
            X, Y = grids()
            d = np.sqrt((X - key[0]) ** 2 + (Y - key[1]) ** 2)
            self.lit = (ambient + diffuse * np.exp(-d / fall)).astype(np.float32)
            if base:
                t = np.clip(Y / DH, 0, 1)[..., None]
                sky = (hexc(top) * (1 - t) + hexc(bottom) * t) * texture("sky", seed + 900)[..., None]
                L = self._layer("sky")
                L.PM[..., :3] = sky
                L.PM[..., 3] = 0

    # bookkeeping
    def tag(self, name, band="subject"):
        """Start a sheet that moves as one piece; everything added goes on it until untag()."""
        self.layers.append(Layer(band, self.cv.pw, self.cv.ph, tag=name))
        return self

    def untag(self):
        if self.layers and self.layers[-1].tag is not None:
            self.layers[-1].open = False
        return self

    def _layer(self, band):
        if self.layers and self.layers[-1].slot is None and self.layers[-1].open:
            return self.layers[-1]
        if not self.layers or self.layers[-1].slot is not None or self.layers[-1].band != band or self.layers[-1].tag is not None:
            self.layers.append(Layer(band, self.cv.pw, self.cv.ph))
        return self.layers[-1]

    def _band(self):
        for L in reversed(self.layers):
            if L.slot is None:
                return L.band
        return "sky"

    def slot(self, name, band="subject"):
        """Where moving pieces go, between the sheets drawn before and after."""
        self.layers.append(Layer(band, 0, 0, slot=name))
        return self

    # painting
    def add(self, mask, color, lift=8, tex="matte", blur=0, tear=3, band="subject", shadow=.42, tone=1.0, contact=False, flat=False, tseed=None):
        with on(self.cv):
            self.count += 1
            s = self.seed * 100 + self.count
            c = hexc(color)
            m = wander(mask, s, tear, 16) if tear else mask
            m = np.clip((m - .5) * 5 + .5, 0, 1) if not flat else np.clip(m, 0, 1)
            if blur:
                m = gblur(m, blur)
            L = self._layer(band)
            # work only where the sheet (and its shadow) can land
            nz = cv2.findNonZero((m > 1e-3).astype(np.uint8))
            if nz is None:
                return self
            bx, by, bw, bh = cv2.boundingRect(nz)
            pad = int((abs(lift) * 1.2 + 4 + (1.5 + abs(lift) * .55) * 3.2) * S) + 3
            ph, pw = m.shape
            y0, y1, x0, x1 = max(0, by - pad), min(ph, by + bh + pad), max(0, bx - pad), min(pw, bx + bw + pad)
            mm = np.ascontiguousarray(m[y0:y1, x0:x1])
            PM = L.PM[y0:y1, x0:x1]
            sh_ = lambda a, dx, dy: cv2.warpAffine(a, np.float32([[1, 0, dx * S], [0, 1, dy * S]]), (a.shape[1], a.shape[0]))
            if shadow and lift:
                sh = gblur(sh_(mm, self.dir[0] * lift, self.dir[1] * lift), 1.5 + lift * .55) * (1 - mm) * shadow
                PM *= (1 - sh)[..., None]
            tx = texture(tex, s if tseed is None else tseed + (7 if tex == "matte" else 0))[y0:y1, x0:x1]
            col = c * tone * (self.lit[y0:y1, x0:x1] * tx)[..., None] * (self.light * .35 + .65)
            if not blur and not flat:
                k = 1.8
                near = mm * (1 - sh_(mm, self.dir[0] * k, self.dir[1] * k))
                far = mm * (1 - sh_(mm, -self.dir[0] * k, -self.dir[1] * k))
                col = col + near[..., None] * .13 - far[..., None] * .13
            col = np.clip(col, 0, 1)
            PM *= (1 - mm)[..., None]
            PM[..., :3] += col * mm[..., None]
        return self

    def paint(self, a, color, band=None):
        """Lay a colour over what is there, unlit (stars, haze)."""
        L = self._layer(band or self._band())
        a = np.clip(a, 0, 1)
        L.PM *= (1 - a)[..., None]
        L.PM[..., :3] += hexc(color) * a[..., None]
        return self

    def glow(self, light, band=None):
        """Add light (an RGB map or a mask times a colour)."""
        L = self._layer(band or self._band())
        L.PM[..., :3] += light
        return self

    def darken(self, d, band=None):
        L = self._layer(band or self._band())
        L.PM *= (1 - np.clip(d, 0, 1))[..., None]
        return self

    def haze(self, color, amount, y0=0, y1=DH, seed=0, band=None):
        with on(self.cv):
            X, Y = grids()
            b = np.clip((Y - y0) / 180, 0, 1) * np.clip((y1 - Y) / 180, 0, 1)
            a = np.clip(b * amount * (.55 + .9 * fbm(700 + seed, 240, 4)), 0, 1)
        return self.paint(a, color, band)

    def contact(self, x, y, rx, ry=None, strength=.55, band=None):
        with on(self.cv):
            m = gblur(fill(ellipse(x, y, rx, ry or rx * .14)), 7)
        return self.darken(m * strength, band)

    def gold(self, mask, lift=3, tear=1, band=None, amount=1.0):
        with on(self.cv):
            m = wander(mask, self.seed * 7 + self.count, tear, 12) if tear else mask
            m = np.clip(m, 0, 1) * amount
            L = self._layer(band or self._band())
            L.PM *= (1 - gblur(shift(m, self.dir[0] * lift, self.dir[1] * lift), 3) * .3)[..., None]
            g = GOLD * (1 + (fbm(self.count + 800, 12, 3) - .5) * .16)[..., None]
            L.PM *= (1 - m)[..., None]
            L.PM[..., :3] += g * m[..., None]
            L.G = m if L.G is None else np.maximum(L.G, m)
        return self

    def flat(self):
        """One composited RGB image with no camera (for patches and quick checks)."""
        out = np.zeros((self.cv.ph, self.cv.pw, 3), np.float32)
        for L in self.layers:
            if L.slot is None:
                out = out * L.PM[..., 3:] + L.PM[..., :3]
        return out


def merge(a, b):
    """Two PM layers that share one transform become one: below*Ma*Mb + Pa*Mb + Pb."""
    out = np.empty_like(a)
    out[..., :3] = a[..., :3] * b[..., 3:] + b[..., :3]
    out[..., 3] = a[..., 3] * b[..., 3]
    return out


def glow_of(G):
    return gblur(G, 9) * .5 + gblur(G, 34) * .62


# Patches: small stages for the moving pieces -------------------------------------------------------------

class Patch(Stage):
    """A transparent stage over a box of the frame, drawn every frame. Lit by the same key as its shot."""

    def __init__(self, shot_stage, x0, y0, w, h, noise=None):
        cv = Canvas(x0, y0, w, h)
        if noise is not None:
            cv.nx0, cv.ny0 = noise
        st = shot_stage
        super().__init__(st.key, st.top, st.bottom, st.ambient, st.diffuse, st.fall, "#ffffff", st.seed + 5000, canvas=cv, base=False, margin=0)
        self.light = st.light
        self.dir = st.dir

    def result(self):
        """(PM, G) flattened, ready to drop into the frame at this patch's box."""
        PM = None
        G = None
        for L in self.layers:
            if L.slot is not None:
                continue
            PM = L.PM if PM is None else merge(PM, L.PM)
            if L.G is not None:
                G = L.G if G is None else np.maximum(G, L.G)
        return PM, G


# Camera and compositing ------------------------------------------------------------------------------

def cam_matrix(cam, depth, box=None):
    """2x3 matrix taking a layer's pixels (or a patch's) to the output frame.

    cam = (cx, cy, zoom) in design units: the point at the centre of the frame, and how far we have pushed in."""
    cx, cy, z = cam
    d = depth
    zl = z ** d
    lx = DW / 2 + (cx - DW / 2) * d
    ly = DH / 2 + (cy - DH / 2) * d
    # never show past a layer's edge
    zl = max(zl, (DW / 2) / max(DW / 2 - abs(lx - DW / 2), 1), (DH / 2) / max(DH / 2 - abs(ly - DH / 2), 1))
    x0, y0 = (box[0], box[1]) if box else (0, 0)
    # design point p -> output pixel (p - l) * zl * S + centre
    a = zl
    tx = (x0 - lx) * zl * S + RW / 2
    ty = (y0 - ly) * zl * S + RH / 2
    return np.float32([[a, 0, tx], [0, a, ty]]), zl


def place(out, PM, M, gl=None, G=None):
    """Composite a PM sheet onto out with matrix M, touching only the box it lands in."""
    h, w = PM.shape[:2]
    corners = np.float32([[0, 0, 1], [w, 0, 1], [0, h, 1], [w, h, 1]]) @ M.T
    x0, y0 = np.floor(corners.min(0)).astype(int) - 1
    x1, y1 = np.ceil(corners.max(0)).astype(int) + 1
    X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(RW, x1), min(RH, y1)
    if X1 <= X0 or Y1 <= Y0:
        return
    M2 = M.copy()
    M2[0, 2] -= X0
    M2[1, 2] -= Y0
    full = (X0 == 0 and Y0 == 0 and X1 == RW and Y1 == RH)
    if np.allclose(M2, [[1, 0, 0], [0, 1, 0]]) and PM.shape[0] == Y1 - Y0 and PM.shape[1] == X1 - X0:
        P = PM
    else:
        P = cv2.warpAffine(PM, M2, (X1 - X0, Y1 - Y0), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 1))
    reg = out[Y0:Y1, X0:X1]
    reg *= P[..., 3:]
    reg += P[..., :3]
    if G is not None and gl is not None:
        gg = cv2.warpAffine(G, M2, (X1 - X0, Y1 - Y0)) if not full or not np.allclose(M2, [[1, 0, 0], [0, 1, 0]]) else G
        gl[Y0:Y1, X0:X1] = np.maximum(gl[Y0:Y1, X0:X1], gg)


_vig = {}


def finish(img, gl, seed, frame, vignette=.26, glow=.62, grade=None):
    if gl is not None and gl.max() > 0:
        # the glow is soft, so it is blurred at a quarter of the size and scaled back up
        q = cv2.resize(gl, (RW // 4, RH // 4), interpolation=cv2.INTER_AREA)
        g = cv2.GaussianBlur(q, (0, 0), 9 * S / 4) * .5 + cv2.GaussianBlur(q, (0, 0), 34 * S / 4) * glow
        g = cv2.resize(g, (RW, RH), interpolation=cv2.INTER_LINEAR)
        img = img + g[..., None] * GOLD * .72
    if "v" not in _vig:
        X, Y = FULL.X, FULL.Y
        r = np.sqrt(((X - DW / 2) / (DW * .72)) ** 2 + ((Y - DH / 2) / (DH * .72)) ** 2)
        _vig["v"] = np.clip(r - .45, 0, 1)
        rng = np.random.default_rng(77)
        _vig["g"] = [rng.normal(0, .011, (RH // 2, RW // 2)).astype(np.float32) for _ in range(6)]
    img = img * (1 - _vig["v"][..., None] * vignette * 2)
    if grade is not None:
        img = grade(img)
    g = cv2.resize(_vig["g"][(frame // 2) % 6], (RW, RH), interpolation=cv2.INTER_LINEAR)
    return np.clip(img + g[..., None], 0, 1)
