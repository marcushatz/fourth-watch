"""Sculpted Adam and Eve as distance fields. y is forward, z is up, x is the figure's left. Units are centimetres."""
import numpy as np

from sdf import Grid, bounds, cap, chain, ell, rot, smin, ssub


class S:
    """Sculpting verbs in the part's own space, posed by turn R about pivot then move t."""

    def __init__(self, g, R=None, pivot=(0, 0, 0), t=(0, 0, 0)):
        self.g = g
        self.R = np.eye(3, dtype=np.float32) if R is None else np.array(R, np.float32)
        self.pv = np.array(pivot, np.float32)
        self.t = np.array(t, np.float32)

    def P(self, p):
        return self.R @ (np.array(p, np.float32) - self.pv) + self.pv + self.t

    def _ell(self, c, r):
        c0, R, base = self.P(c), self.R, ell((0, 0, 0), r)
        def fn(X, Y, Z):
            x, y, z = X - c0[0], Y - c0[1], Z - c0[2]
            return base(R[0, 0] * x + R[1, 0] * y + R[2, 0] * z, R[0, 1] * x + R[1, 1] * y + R[2, 1] * z, R[0, 2] * x + R[1, 2] * y + R[2, 2] * z)
        return fn, c0, max(r) + .4

    def add(self, c, r, k):
        fn, c0, m = self._ell(c, r)
        self.g.add(fn, c0 - m, c0 + m, k)

    def cut(self, c, r, k):
        fn, c0, m = self._ell(c, r)
        self.g.add(fn, c0 - m, c0 + m, k, cut=True)

    def seg(self, a, b, r0, r1, k):
        a, b = self.P(a), self.P(b)
        self.g.add(cap(a, b, r0, r1), *bounds([a, b], max(r0, r1) + .3), k)

    def carve(self, a, b, r0, r1, k):
        a, b = self.P(a), self.P(b)
        self.g.add(cap(a, b, r0, r1), *bounds([a, b], max(r0, r1) + .3), k, cut=True)

    def path(self, pts, radii, k, carve=False):
        for i in range(len(pts) - 1):
            (self.carve if carve else self.seg)(pts[i], pts[i + 1], radii[i], radii[i + 1], k)


def head(g, female=False, eyes="shut", R=None, pivot=(0, 0, 0), t=(0, 0, 0), neck=True):
    s0 = S(g, R, pivot, t)
    add, cut, seg, carve = s0.add, s0.cut, s0.seg, s0.carve
    w = .93 if female else 1.0
    add((0, -1.4, 8.0), (7.3 * w, 9.3 * w, 8.4), 1)
    add((0, 2.6, .8), (5.7 * w, 6.7, 9.6), 2.2)
    for s in (-1, 1):
        if female:
            seg((s * 4.8, -1.0, -2.2), (s * 1.3, 6.3, -8.9), 1.4, 1.15, 1.8)
        else:
            seg((s * 5.5, -1.2, -2.6), (s * 1.9, 6.6, -9.2), 1.9, 1.7, 1.2)
        cut((s * 7.6, 4.6, 6.4), (1.5, 3.2, 2.6), 1.8)              # temple
        cut((s * 6.6, 5.6, -3.6), (1.5, 2.8, 2.2), 2.0)             # hollow under the cheekbone
    add((0, 6.9, -9.3), (2.0, 1.9, 1.6) if female else (2.8, 2.3, 2.0), 1.1)
    for s in (-1, 1):
        if female:
            seg((s * .5, 7.6, 5.2), (s * 5.0, 5.2, 5.6), .75, .6, 1.0)
        else:
            seg((s * .3, 8.3, 5.0), (s * 2.6, 8.1, 5.15), 1.2, 1.22, .7)
            seg((s * 2.6, 8.1, 5.15), (s * 5.6, 5.6, 5.5), 1.22, .85, .8)
        add((s * 4.8, 5.3, .9), (1.5, 2.5, 1.25) if female else (1.8, 2.8, 1.45), 1.4)
        seg((s * 6.1, 2.0, .7), (s * 4.0, 6.7, -.3), .85, .75, 1.4)
    # Nose: a straight bridge, a defined tip and wings.
    n = .86 if female else 1
    seg((0, 7.8, 4.3), (0, 7.9 + 2.8 * n, 4.3 - 4.7 * n), .72 * n, .78 * n, .7)
    add((0, 7.9 + 2.75 * n, -.5), (1.0 * n, 1.02 * n, .95 * n), .45)
    for s in (-1, 1):
        add((s * 1.35 * n, 9.1 + .1 * n, -.95), (.78 * n, .9 * n, .66 * n), .35)
        cut((s * .72 * n, 9.75, -1.72), (.4 * n, .62 * n, .27 * n), .2)
        carve((s * 2.0, 9.15, -.9), (s * 3.6, 8.1, -4.9), .14, .1, .55)    # nasolabial fold
    # Eye sockets and lids.
    for s in (-1, 1):
        cut((s * 3.15, 8.5, 2.55), (2.4, 2.0, 1.55), .75)
        if eyes == "shut":
            add((s * 3.1, 6.05, 2.72), (1.74, 1.5, 1.3), .25)
            carve((s * 1.55, 7.1, 2.12), (s * 3.2, 7.42, 1.58), .06, .08, .14)
            carve((s * 3.2, 7.42, 1.58), (s * 4.85, 6.2, 2.05), .08, .06, .14)
            seg((s * 1.65, 7.2, 3.7), (s * 4.5, 6.5, 3.55), .1, .08, .22)
        else:
            add((s * 3.1, 5.75, 2.55), (1.46, 1.55, 1.36), .1)
            add((s * 3.1, 6.45, 3.25), (1.78, 1.25, .78), .18)
            add((s * 3.1, 6.6, 1.68), (1.62, 1.02, .44), .18)
    # Mouth.
    add((0, 8.55, -4.05), (2.0, 1.0, .55) if not female else (2.0, 1.1, .66), .32)
    add((0, 8.25, -5.15), (1.65, .98, .66) if not female else (1.62, 1.1, .82), .32)
    carve((-2.2, 8.2, -4.58), (0, 9.2, -4.6), .05, .06, .12)
    carve((0, 9.2, -4.6), (2.2, 8.2, -4.58), .06, .05, .12)
    seg((0, 8.4, -2.4), (0, 8.8, -3.6), .25, .22, .4)
    for s in (-1, 1):
        seg((s * .5, 8.55, -2.3), (s * .68, 8.92, -3.6), .16, .16, .3)
        ex = s * 6.9 * w
        add((ex, -1.6, 1.8), (.7, 1.85, 3.0), .35)
        cut((ex + s * .7, -1.45, 2.0), (.62, 1.2, 2.05), .3)
        seg((ex + s * .3, -2.8, 4.3), (ex + s * .3, -3.2, .4), .3, .2, .2)
    if neck:
        seg((0, -2.2, -3), (0, -3.8, -15), 5.3 * w, 5.9 * w, 2.0)


def hair_path(alpha, b0, b1, steps, off, wave, seed, c=(0, -1.4, 8.0), r=(7.9, 9.9, 9.0), fall=None):
    """A lock following the skull from the hairline back, then falling."""
    rng = np.random.default_rng(seed)
    ph = rng.uniform(0, 6.28)
    pts = []
    for i in range(steps):
        t = i / (steps - 1)
        b = np.radians(b0 + (b1 - b0) * t)
        a = np.radians(alpha + wave * np.sin(ph + t * 5))
        k = 1 + off * (1 + .5 * np.sin(ph * 2 + t * 7))
        x = c[0] + r[0] * k * np.sin(b) * np.sin(a)
        y = c[1] + r[1] * k * np.cos(b)
        z = c[2] + r[2] * k * np.sin(b) * np.cos(a)
        pts.append((x, y, z))
    return pts


def flow(alpha, b0, b1, n, off, wave, seed):
    """Points along the skull from front to back at side angle alpha."""
    r = np.random.default_rng(seed)
    ph = r.uniform(0, 6.28)
    c, rad = (0, -1.4, 8.0), (8.25, 10.25, 9.2)
    pts = []
    for i in range(n):
        t = i / (n - 1)
        b = np.radians(b0 + (b1 - b0) * t)
        a = np.radians(alpha * (1 + .2 * t) + wave * np.sin(ph + t * 4.5))
        k = 1 + off
        pts.append((c[0] + rad[0] * k * np.sin(b) * np.sin(a), c[1] + rad[1] * k * np.cos(b), c[2] + rad[2] * k * np.sin(b) * np.cos(a)))
    return pts


def hair_m(g, R=None, pivot=(0, 0, 0), t=(0, 0, 0)):
    """Swept-back hair: one sculpted mass, cut grooves, a few raised locks. Stylised, not strand by strand."""
    s = S(g, R, pivot, t)
    s.add((0, -1.5, 8.2), (8.25, 10.25, 9.2), .4)
    s.add((0, -8.2, 1.2), (6.9, 4.4, 7.0), 2.0)                    # falls to the nape
    for x in (-1, 1):
        s.add((x * 5.4, -6.6, .4), (2.8, 3.6, 5.8), 1.6)
    s.cut((0, 11.2, 1.0), (10.5, 9.2, 13.0), .7)                    # hairline
    s.cut((0, 4.0, -3.4), (10.5, 7.0, 7.4), .9)                     # clears the cheeks
    r = np.random.default_rng(6)
    for i in range(46):                                             # raised locks give the silhouette its rhythm
        a = r.uniform(-118, 118)
        pts = flow(a, r.uniform(26, 52) + abs(a) * .1, r.uniform(120, 158), 6, r.uniform(.0, .025), r.uniform(1, 5), i)
        s.path(pts, list(np.interp(np.linspace(0, 1, 6), [0, .3, .8, 1], [.3, 1.0, .75, .1]) * r.uniform(.8, 1.15)), .3)
    for i in range(120):                                            # grooves along the flow
        a = r.uniform(-122, 122)
        pts = flow(a, r.uniform(28, 56), r.uniform(100, 168), 7, r.uniform(.03, .05), r.uniform(1, 5), 300 + i)
        s.path(pts, [.06, .17, .24, .24, .2, .13, .05], .13, carve=True)
    for x in (-1, 1):                                               # eyebrows
        s.path([(x * 1.4, 8.8, 5.72), (x * 3.0, 8.5, 6.1), (x * 5.2, 6.5, 5.72)], [.26, .4, .1], .2)


def beard(g, R=None, pivot=(0, 0, 0), t=(0, 0, 0)):
    s = S(g, R, pivot, t)
    for x in (-1, 1):
        s.path([(x * 7.0, -1.8, 1.4), (x * 6.6, -.4, -2.2), (x * 5.8, 2.0, -6.0), (x * 3.6, 5.6, -10.0), (x * .8, 7.6, -11.6)], [1.0, 1.7, 2.3, 2.7, 3.0], 1.3)
        s.path([(x * 3.4, 6.2, -7.4), (x * 2.2, 8.0, -9.8), (x * .6, 8.6, -12.8)], [2.3, 2.6, 2.3], 1.2)
        s.path([(0, 9.35, -3.05), (x * 1.6, 9.0, -3.5), (x * 3.3, 7.8, -5.5)], [.78, .88, .55], .5)     # moustache
    s.add((0, 7.2, -13.6), (4.0, 3.4, 4.0), 1.4)
    s.cut((0, 9.9, -5.1), (1.75, 1.45, .92), .35)                   # the lower lip shows
    r = np.random.default_rng(12)
    for i in range(70):                                             # the tapered lower edge
        x = r.uniform(-5.4, 5.4)
        y0 = 7.4 - abs(x) * .95 + r.normal(0, .3)
        z0 = -10.5 + abs(x) * .75 + r.normal(0, .6)
        l = r.uniform(3.5, 6.6)
        s.path([(x, y0, z0), (x * .92, y0 + .3, z0 - l * .55), (x * .8, y0 - .3, z0 - l)], [1.05, .85, .06], .4)
    for i in range(130):                                            # grooves
        x0, a = r.uniform(-6.6, 6.6), r.uniform(0, 1)
        side = np.sign(x0) or 1
        p0 = np.array([x0, 8.7 - abs(x0) * 1.15, -3.9 - a * 3.0 + abs(x0) * .35]) + r.normal(0, .15, 3)
        s.path([p0, p0 + [-side * .35, .45, -3.2], p0 + [-side * .7, .05, -7.4 - r.uniform(0, 3)]], [.05, .18, .05], .1, carve=True)


def torso_shoulders(g, braced=True):
    """Bust down to the ribs. Head's neck joins at (0, -3, -13)."""
    lift = 4.5 if braced else 0
    add = lambda c, r, k: g.add(ell(c, r), np.array(c) - max(r) - .5, np.array(c) + max(r) + .5, k)
    seg = lambda a, b, r0, r1, k: g.add(cap(a, b, r0, r1), *bounds([a, b], max(r0, r1) + .5), k)
    add((0, -1.2, -38), (15.5, 10.5, 20), 2)
    add((0, 1, -28), (15.5, 9.5, 8), 5)
    for s in (-1, 1):
        sh = (s * 19.5, -1.6, -21.5 + lift)
        seg((s * 1.5, 3.6, -21 + lift * .3), (s * 18, .4, -19.5 + lift), 1.45, 1.6, 2.2)      # collar bone
        seg((s * 2, -5, -11), (s * 17, -3, -19 + lift), 5.0, 4.6, 4.5)                        # trapezius
        add(sh, (6.0, 6.2, 6.9), 3.6)                                                          # deltoid
        add((s * 8.6, 5.5, -30 + lift * .4), (8.2, 4.4, 5.8), 3.2)                             # chest
        seg(sh, (s * 22.5, -3.2, -49 + lift), 5.4, 4.1, 3)                                     # upper arm


def eve_hair(g, T=lambda p: p, front=True):
    rng = np.random.default_rng(5)
    for i in range(240):
        alpha = rng.uniform(-125, 125)
        b0 = rng.uniform(10, 40) + abs(alpha) * .1
        pts = hair_path(alpha, b0, rng.uniform(118, 136), 6, rng.uniform(.0, .06), rng.uniform(1, 4), i + 500)
        end = np.array(pts[-1])
        l = rng.uniform(22, 44)
        side = np.sign(alpha) if alpha else 1
        mids = [end + [side * rng.uniform(0, 2), -rng.uniform(1, 4), -l * t] + rng.normal(0, .5, 3) for t in (.3, .65, 1.0)]
        all_pts = pts + [tuple(m) for m in mids]
        rr = np.interp(np.linspace(0, 1, len(all_pts)), [0, .2, .8, 1], [.7, 1.4, 1.1, .12]) * rng.uniform(.8, 1.2)
        chain(g, [T(p) for p in all_pts], rr, .55)
