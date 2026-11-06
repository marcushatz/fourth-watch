"""A small sculpting kit: smooth distance fields, meshed with marching cubes. Units are centimetres."""
import numpy as np
from skimage import measure


class Grid:
    def __init__(self, lo, hi, step):
        self.lo, self.step = np.array(lo, np.float32), step
        n = np.ceil((np.array(hi) - np.array(lo)) / step).astype(int) + 1
        self.n = n
        self.D = np.full(n, 1e3, np.float32)

    def axes(self, box=None):
        lo = self.lo
        if box is None:
            return [lo[i] + np.arange(self.n[i], dtype=np.float32) * self.step for i in range(3)]
        return [lo[i] + np.arange(box[i].start, box[i].stop, dtype=np.float32) * self.step for i in range(3)]

    def box(self, lo, hi):
        a = np.maximum(np.floor((np.array(lo) - self.lo) / self.step).astype(int), 0)
        b = np.minimum(np.ceil((np.array(hi) - self.lo) / self.step).astype(int) + 1, self.n)
        if np.any(a >= b):
            return None
        return tuple(slice(int(x), int(y)) for x, y in zip(a, b))

    def pts(self, box=None):
        x, y, z = self.axes(box)
        return np.meshgrid(x, y, z, indexing="ij")

    def add(self, fn, lo, hi, k=1.0, cut=False):
        """Blend fn(X, Y, Z) into the field inside a box. With cut, carve it out."""
        pad = k + 1
        b = self.box(np.array(lo) - pad, np.array(hi) + pad)
        if b is None:
            return
        X, Y, Z = self.pts(b)
        self.D[b] = ssub(fn(X, Y, Z), self.D[b], k) if cut else smin(self.D[b], fn(X, Y, Z), k)

    def mesh(self, path=None):
        v, f, _, _ = measure.marching_cubes(self.D, 0, spacing=(self.step,) * 3, allow_degenerate=False)
        v = v + self.lo
        if path:
            np.savez_compressed(path, v=v.astype(np.float32), f=f.astype(np.int32))
        return v, f


def smin(a, b, k):
    h = np.clip(.5 + .5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def ssub(cutter, d, k):
    h = np.clip(.5 - .5 * (d + cutter) / k, 0, 1)
    return d * (1 - h) + (-cutter) * h + k * h * (1 - h)


def ell(c, r):
    c, r = np.array(c, np.float32), np.array(r, np.float32)
    def fn(X, Y, Z):
        x, y, z = (X - c[0]), (Y - c[1]), (Z - c[2])
        k0 = np.sqrt((x / r[0]) ** 2 + (y / r[1]) ** 2 + (z / r[2]) ** 2)
        k1 = np.sqrt((x / r[0] ** 2) ** 2 + (y / r[1] ** 2) ** 2 + (z / r[2] ** 2) ** 2)
        return k0 * (k0 - 1) / (k1 + 1e-6)
    return fn


def cap(a, b, r0, r1=None):
    a, b = np.array(a, np.float32), np.array(b, np.float32)
    r1 = r0 if r1 is None else r1
    ba = b - a
    bb = float(np.dot(ba, ba)) + 1e-6
    def fn(X, Y, Z):
        px, py, pz = X - a[0], Y - a[1], Z - a[2]
        t = np.clip((px * ba[0] + py * ba[1] + pz * ba[2]) / bb, 0, 1)
        dx, dy, dz = px - ba[0] * t, py - ba[1] * t, pz - ba[2] * t
        return np.sqrt(dx * dx + dy * dy + dz * dz) - (r0 + (r1 - r0) * t)
    return fn


def bounds(pts, pad):
    p = np.array(pts, np.float32)
    return p.min(0) - pad, p.max(0) + pad


def chain(g, pts, radii, k):
    """A lock of hair, a finger or a limb: linked tapered capsules."""
    pts = np.array(pts, np.float32)
    for i in range(len(pts) - 1):
        lo, hi = bounds(pts[i:i + 2], max(radii[i], radii[i + 1]) + .1)
        g.add(cap(pts[i], pts[i + 1], radii[i], radii[i + 1]), lo, hi, k)


def rot(ax, deg):
    t = np.radians(deg)
    c, s = np.cos(t), np.sin(t)
    if ax == "x":
        return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], np.float32)
    if ax == "y":
        return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], np.float32)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], np.float32)


def posed(fn, R, t, pivot=(0, 0, 0)):
    """Show part fn after turning it by R about pivot and moving it by t."""
    R, t, pivot = np.array(R, np.float32), np.array(t, np.float32), np.array(pivot, np.float32)
    def g(X, Y, Z):
        x, y, z = X - pivot[0] - t[0], Y - pivot[1] - t[1], Z - pivot[2] - t[2]
        return fn(R[0, 0] * x + R[1, 0] * y + R[2, 0] * z + pivot[0], R[0, 1] * x + R[1, 1] * y + R[2, 1] * z + pivot[1], R[0, 2] * x + R[1, 2] * y + R[2, 2] * z + pivot[2])
    return g
