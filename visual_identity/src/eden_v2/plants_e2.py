"""Procedural plants for Eden v2, as plain numpy meshes: lobed fig leaves on curved branches, fern fronds, broad
foreground leaves, hanging vines and buttress roots. Units cm, z up. Every function takes a numpy Generator."""
import numpy as np


def frame(d, up=(0, 0, 1.0)):
    d = np.asarray(d, float)
    d = d / np.linalg.norm(d)
    s = np.cross(d, up)
    if np.linalg.norm(s) < 1e-6:
        s = np.cross(d, (1, 0, 0))
    s /= np.linalg.norm(s)
    n = np.cross(s, d)
    return d, s, n


def merge(parts):
    Vs, Fs, off = [], [], 0
    for V, F in parts:
        if len(V) == 0:
            continue
        Vs.append(np.asarray(V, np.float32))
        Fs.append(np.asarray(F, np.int32) + off)
        off += len(V)
    if not Vs:
        return np.zeros((0, 3), np.float32), np.zeros((0, 4), np.int32)
    w = max(f.shape[1] for f in Fs)
    Fs = [np.c_[f, f[:, -1:]] if f.shape[1] < w else f for f in Fs]
    return np.vstack(Vs), np.vstack(Fs)


def tube(pts, r0, r1, sides=7):
    pts = np.asarray(pts, float)
    n = len(pts)
    T = np.gradient(pts, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
    a = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    V = []
    ref = np.array([0, 0, 1.0])
    for i in range(n):
        _, s, m = frame(T[i], ref if abs(T[i][2]) < .95 else (1, 0, 0))
        r = r0 + (r1 - r0) * i / max(n - 1, 1)
        V.append(pts[i] + r * (np.cos(a)[:, None] * s + np.sin(a)[:, None] * m))
    V = np.vstack(V)
    F = [[i * sides + j, i * sides + (j + 1) % sides, (i + 1) * sides + (j + 1) % sides, (i + 1) * sides + j] for i in range(n - 1) for j in range(sides)]
    return V, np.array(F)


def fig_outline(n, rng):
    """A fig leaf, base at the origin pointing +x, length 1: five rounded lobes with deep sinuses, a little irregular."""
    th = np.linspace(-np.pi, np.pi, n, endpoint=False)
    k = 2.5 + rng.uniform(-.15, .15)
    lobe = .52 + .48 * np.abs(np.cos(k * th)) ** .7
    rr = lobe * (1 - .6 * np.clip((np.abs(th) - 2.35) / .8, 0, 1)) * (1 + .05 * np.sin(th * 7 + rng.uniform(0, 6)))
    return np.c_[np.cos(th) * rr * .5 + .5, np.sin(th) * rr * .5]


def fig_leaf(size, rng, rings=5, n=44, cup=.16, droop=.12):
    """A curved lobed leaf: rings from the petiole to the outline, cupped along its midrib and drooping at the tip."""
    o = fig_outline(n, rng)
    c = np.array([.42, 0.0])
    V = [np.c_[c[None], [[0]]]]
    for k in range(1, rings + 1):
        t = k / rings
        p = c + (o - c) * t
        V.append(np.c_[p, np.zeros(n)])
    V = np.vstack(V).astype(float)
    x, y = V[:, 0], V[:, 1]
    V[:, 2] = cup * np.abs(y) ** 1.3 * 2 - droop * x ** 2 + .015 * np.sin(x * 19 + y * 7)
    V *= size
    F = [[0, 1 + j, 1 + (j + 1) % n, 0] for j in range(n)]
    for k in range(rings - 1):
        a, b = 1 + k * n, 1 + (k + 1) * n
        F += [[a + j, b + j, b + (j + 1) % n, a + (j + 1) % n] for j in range(n)]
    return V, np.array(F)


def long_leaf(length, width, rng, bend=.25, nu=18, nv=7):
    """A long blade with a midrib fold: for the broad foreground leaves and the fern pinnae."""
    u = np.linspace(0, 1, nu)
    v = np.linspace(-1, 1, nv)
    U, W = np.meshgrid(u, v, indexing="ij")
    half = width * np.sin(np.pi * np.clip(U, 0, 1) ** .7) ** .8 * (1 + .06 * np.sin(U * 13 + rng.uniform(0, 6)))
    X = length * U
    Y = half * W
    Zz = -bend * length * U ** 2 + np.abs(W) * half * .35 + .01 * length * np.sin(U * 17 + W * 3)
    V = np.c_[X.ravel(), Y.ravel(), Zz.ravel()]
    F = [[i * nv + j, (i + 1) * nv + j, (i + 1) * nv + j + 1, i * nv + j + 1] for i in range(nu - 1) for j in range(nv - 1)]
    return V, np.array(F)


def orient(V, origin, d, roll=0.0, up=(0, 0, 1.0)):
    """Local +x along d, local +z toward up, rolled about d."""
    d, s, n = frame(d, up)
    c, si = np.cos(roll), np.sin(roll)
    s, n = s * c + n * si, n * c - s * si
    return np.asarray(origin, float) + V[:, :1] * d + V[:, 1:2] * (-s) + V[:, 2:3] * n


def curve(p0, d0, length, steps, gravity, rng, wander=.08):
    p, d = np.asarray(p0, float), np.asarray(d0, float) / np.linalg.norm(d0)
    pts = [p.copy()]
    h = length / steps
    for i in range(steps):
        d = d + np.array([0, 0, -gravity]) + rng.normal(0, wander, 3)
        d /= np.linalg.norm(d)
        p = p + d * h
        pts.append(p.copy())
    return np.array(pts)


def fig_branch(p0, d0, length, leaves, size, rng, gravity=.035):
    """A curved stem carrying fig leaves on short petioles, each leaf turned up and out toward the light."""
    pts = curve(p0, d0, length, 16, gravity, rng)
    stem = tube(pts, 1.4, .5, 6)
    parts = []
    for i in range(leaves):
        t = .25 + .75 * (i + rng.uniform(-.3, .3)) / max(leaves - 1, 1)
        j = int(np.clip(t * (len(pts) - 1), 1, len(pts) - 2))
        tang = pts[j + 1] - pts[j - 1]
        side = np.cross(tang, (0, 0, 1))
        side = side / (np.linalg.norm(side) + 1e-9) * (1 if i % 2 else -1)
        d = side * .8 + tang / np.linalg.norm(tang) * .5 + np.array([0, 0, rng.uniform(-.25, .2)])
        V, F = fig_leaf(size * rng.uniform(.7, 1.15), rng)
        parts.append((orient(V, pts[j], d, roll=rng.uniform(-.5, .5)), F))
    return stem, merge(parts)


def frond(p0, d0, length, rng, pinnae=16, w=.11):
    """A fern frond: an arching rachis with paired pinnae that shorten toward the tip."""
    pts = curve(p0, d0, length, 14, .06, rng, .03)
    parts = [tube(pts, .35, .12, 5)]
    for i in range(1, len(pts) - 1):
        t = i / (len(pts) - 1)
        tang = pts[i + 1] - pts[i - 1]
        tang /= np.linalg.norm(tang)
        side = np.cross(tang, (0, 0, 1))
        side /= np.linalg.norm(side) + 1e-9
        L = length * .26 * (1 - t) ** .7 * np.sin(np.pi * min(t * 1.4 + .15, 1)) + 2
        for sg in (-1, 1):
            d = side * sg + tang * .45 + np.array([0, 0, -.12])
            V, F = long_leaf(L, L * w * 2.2, rng, bend=.18, nu=7, nv=3)
            parts.append((orient(V, pts[i], d, roll=sg * .35), F))
    return merge(parts)


def vine(top, length, rng, leaves=14, size=6.0):
    """A hanging vine: a slack cord falling from the canopy with small heart-shaped leaves along it."""
    pts = curve(top, (rng.normal(0, .2), rng.normal(0, .2), -1), length, 24, 0, rng, .05)
    parts = [tube(pts, .45, .3, 5)]
    for i in range(leaves):
        j = int(rng.uniform(.1, 1) * (len(pts) - 1))
        V, F = fig_leaf(size * rng.uniform(.7, 1.2), rng, rings=3, n=28, cup=.1, droop=.25)
        d = np.array([rng.normal(0, 1), rng.normal(0, 1), -.6])
        parts.append((orient(V, pts[j], d, roll=rng.uniform(-1, 1)), F))
    return merge(parts)


def buttress(c, angle, length, height, rng, thick=9.0):
    """A buttress root: a tall thin fin running from the trunk down into the ground."""
    nu, nv = 18, 10
    d = np.array([np.cos(angle), np.sin(angle), 0])
    s = np.array([-d[1], d[0], 0])
    V = []
    for i in range(nu):
        u = i / (nu - 1)
        h = height * (1 - u) ** 1.6 + 4
        wob = 4 * np.sin(u * 5 + rng.uniform(0, 6))
        for j in range(nv):
            v = j / (nv - 1)
            z = h * v
            V.append(c + d * (u * length) + s * wob + np.array([0, 0, z - 6]))
    V = np.array(V)
    # Give it thickness: two sides of the fin.
    off = np.outer(np.ones(len(V)), s)
    tk = np.repeat(thick * (1 - .5 * np.linspace(0, 1, nu)), nv)[:, None] * (1 - .5 * np.tile(np.linspace(0, 1, nv), nu))[:, None]
    A, B = V + off * tk * .5, V - off * tk * .5
    VV = np.vstack([A, B])
    F = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a = i * nv + j
            F.append([a, a + nv, a + nv + 1, a + 1])
            b = a + nu * nv
            F.append([b, b + 1, b + nv + 1, b + nv])
    for i in range(nu - 1):                          # the top edge
        a, b = i * nv + nv - 1, (i + 1) * nv + nv - 1
        F.append([a, b, b + nu * nv, a + nu * nv])
    return VV, np.array(F)


def shrub(c, r, n, size, rng, kind="fig"):
    """A leafy mass: leaves on the surface of a squashed dome, each facing out and a little up."""
    parts = []
    for i in range(n):
        a = rng.uniform(0, 2 * np.pi)
        zc = rng.uniform(-.25, 1)
        rr = np.sqrt(1 - zc * zc)
        d = np.array([np.cos(a) * rr, np.sin(a) * rr, zc])
        p = np.asarray(c, float) + d * r * rng.uniform(.75, 1.0) * np.array([1, 1, .7])
        if kind == "fig":
            V, F = fig_leaf(size * rng.uniform(.7, 1.2), rng, rings=3, n=22)
        else:
            V, F = long_leaf(size * rng.uniform(1.5, 2.4), size * rng.uniform(.25, .4), rng, bend=.3, nu=9, nv=3)
        parts.append((orient(V, p, d + np.array([0, 0, .5]), roll=rng.uniform(-1, 1)), F))
    return merge(parts)
