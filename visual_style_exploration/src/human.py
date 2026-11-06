"""An adult human from the CC0 MakeHuman base mesh and rig, posed with plain linear blend skinning. Stills only.

Space: centimetres, x is the figure's right, y is forward, z is up.
"""
import json
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

DATA = Path("/home/claude/fw-tools/mh/makehuman/data")


def to_cm(v):
    v = np.asarray(v, np.float64)
    return np.stack([-v[..., 0], v[..., 2], v[..., 1]], -1) * 10


def read_target(path):
    idx, d = [], []
    for line in open(path):
        if line[:1] in "#\n":
            continue
        a = line.split()
        idx.append(int(a[0]))
        d.append([float(x) for x in a[1:4]])
    return np.array(idx, int), np.array(d, np.float64).reshape(-1, 3)


def load_base():
    vs, faces, group = [], [], None
    groups = {}
    for line in open(DATA / "3dobjs/base.obj"):
        if line.startswith("v "):
            vs.append([float(x) for x in line.split()[1:4]])
        elif line.startswith("g "):
            group = line.split()[1]
        elif line.startswith("f "):
            f = [int(x.split("/")[0]) - 1 for x in line.split()[1:]]
            groups.setdefault(group, []).append(f)
    return np.array(vs), groups


def rot_axis(axis, deg):
    a = np.asarray(axis, np.float64)
    a = a / (np.linalg.norm(a) + 1e-9)
    t = np.radians(deg)
    K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + np.sin(t) * K + (1 - np.cos(t)) * K @ K


def between(a, b):
    a, b = a / np.linalg.norm(a), b / np.linalg.norm(b)
    v = np.cross(a, b)
    s, c = np.linalg.norm(v), float(np.dot(a, b))
    if s < 1e-7:
        return np.eye(3)
    return rot_axis(v, np.degrees(np.arctan2(s, c)))


class Human:
    def __init__(self, female=False, race=(.5, .3, .2), muscle=.6, weight=.35, extra=None, expr=None, older=0):
        v, groups = load_base()
        g = "female" if female else "male"
        T = DATA / "targets"
        for name, w in (("caucasian", race[0]), ("african", race[1]), ("asian", race[2])):
            i, d = read_target(T / f"macrodetails/{name}-{g}-young.target")
            v[i] += d * w * (1 - older)
            if older:
                i, d = read_target(T / f"macrodetails/{name}-{g}-old.target")
                v[i] += d * w * older
        # Blend the muscle and weight corners.
        ms = [("minmuscle", max(0, 1 - muscle * 2)), ("averagemuscle", 1 - abs(muscle * 2 - 1)), ("maxmuscle", max(0, muscle * 2 - 1))]
        ws = [("minweight", max(0, 1 - weight * 2)), ("averageweight", 1 - abs(weight * 2 - 1)), ("maxweight", max(0, weight * 2 - 1))]
        for m, a in ms:
            for w_, b in ws:
                if a * b > 0:
                    i, d = read_target(T / f"macrodetails/universal-{g}-young-{m}-{w_}.target")
                    v[i] += d * a * b
        for path, w in (extra or {}).items():
            i, d = read_target(T / path)
            v[i] += d * w
        for name, w in (expr or {}).items():
            i, d = read_target(T / f"expression/units/caucasian/{name}.target")
            v[i] += d * w
        self.v = to_cm(v)
        self.body = np.array([f for f in groups["body"] if len(f) == 4], np.int32)
        sk = json.load(open(DATA / "rigs/default.mhskel"))
        self.bones = sk["bones"]
        self.joint = {k: self.v[idx].mean(0) for k, idx in sk["joints"].items()}
        wt = json.load(open(DATA / "rigs/default_weights.mhw"))["weights"]
        self.weights = {b: (np.array([p[0] for p in w], int), np.array([p[1] for p in w], np.float64)) for b, w in wt.items()}
        tot = np.zeros(len(self.v))
        for i, w in self.weights.values():
            np.add.at(tot, i, w)
        self.tot = np.maximum(tot, 1e-6)
        self.order = []
        seen = set()
        def visit(b):
            if b in seen:
                return
            p = self.bones[b]["parent"]
            if p:
                visit(p)
            seen.add(b)
            self.order.append(b)
        for b in self.bones:
            visit(b)
        self.M = {b: np.eye(4) for b in self.bones}

    def head_of(self, b):
        return self.joint[self.bones[b]["head"]]

    def tail_of(self, b):
        return self.joint[self.bones[b]["tail"]]

    def pose(self, ops):
        """ops: bone -> ('aim', direction) | ('rot', axis, degrees) | ('curl', axis in rest space, degrees)."""
        self.M = {}
        for b in self.order:
            p = self.bones[b]["parent"]
            Mp = self.M[p] if p else np.eye(4)
            M = Mp.copy()
            for op in (ops[b] if isinstance(ops.get(b), list) else [ops[b]] if b in ops else []):
                h = M[:3, :3] @ self.head_of(b) + M[:3, 3]
                if op[0] == "aim":
                    cur = M[:3, :3] @ (self.tail_of(b) - self.head_of(b))
                    R = between(cur, np.array(op[1], np.float64))
                elif op[0] == "rot":
                    R = rot_axis(op[1], op[2])
                else:
                    R = rot_axis(Mp[:3, :3] @ np.array(op[1], np.float64), op[2])
                A = np.eye(4)
                A[:3, :3] = R
                A[:3, 3] = h - R @ h
                M = A @ M
            self.M[b] = M
        out = np.zeros_like(self.v)
        hom = np.c_[self.v, np.ones(len(self.v))]
        for b, (i, w) in self.weights.items():
            if b in self.M:
                out[i] += (hom[i] @ self.M[b].T)[:, :3] * (w / self.tot[i])[:, None]
        return out

    def rig_axis(self, side):
        """Across-the-palm direction in rest space, for curling fingers."""
        return self.head_of(f"finger2-1.{side}") - self.head_of(f"finger5-1.{side}")

    def apply(self, b, pts):
        M = self.M[b]
        return (np.c_[pts, np.ones(len(pts))] @ M.T)[:, :3]


def thumb_axis(h, side):
    a = h.head_of(f"finger1-2.{side}") - h.head_of(f"finger1-1.{side}")
    b = h.head_of(f"finger2-1.{side}") - h.head_of(f"finger5-1.{side}")
    return np.cross(a, b)


def curl_hand(ops, h, side, amounts, thumb=None):
    """amounts: degrees per joint for fingers 2 to 5, each a triple."""
    ax = h.rig_axis(side)
    s = -1 if side == "L" else 1
    for f, a in zip((2, 3, 4, 5), amounts):
        for j, deg in zip((1, 2, 3), a):
            ops[f"finger{f}-{j}.{side}"] = ("curl", ax, s * deg)
    if thumb:
        for j, deg in zip((1, 2, 3), thumb):
            ops[f"finger1-{j}.{side}"] = ("curl", thumb_axis(h, side), s * deg)
    return ops


def scalp_samples(v, faces, keep, n, seed):
    """Random points on faces whose centres pass keep()."""
    tri = np.vstack([faces[:, [0, 1, 2]], faces[:, [0, 2, 3]]])
    a, b, c = v[tri[:, 0]], v[tri[:, 1]], v[tri[:, 2]]
    ctr = (a + b + c) / 3
    sel = keep(ctr)
    tri = tri[sel]
    a, b, c = a[sel], b[sel], c[sel]
    nrm = np.cross(b - a, c - a)
    area = np.linalg.norm(nrm, axis=1)
    nrm = nrm / (area[:, None] + 1e-9)
    r = np.random.default_rng(seed)
    pick = r.choice(len(tri), n, p=area / area.sum())
    u, w = r.random(n), r.random(n)
    flip = u + w > 1
    u[flip], w[flip] = 1 - u[flip], 1 - w[flip]
    pts = a[pick] + (b[pick] - a[pick]) * u[:, None] + (c[pick] - a[pick]) * w[:, None]
    return pts, nrm[pick]


def vertex_normals(v, faces):
    n = np.zeros_like(v)
    a = np.cross(v[faces[:, 2]] - v[faces[:, 0]], v[faces[:, 3]] - v[faces[:, 1]])
    for i in range(4):
        np.add.at(n, faces[:, i], a)
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
    used = np.unique(faces)
    if np.mean(np.sum(n[used] * (v[used] - v[used].mean(0)), 1)) < 0:
        n = -n
    return n


def grow(root, nrm, field, length, steps, tree, verts, clear, r, hug=0, vn=None):
    """Grow one strand along field(p), staying clear of the skin."""
    p = root + nrm * clear
    pts = [p.copy()]
    d = nrm * .6
    h = length / steps
    wob = r.normal(0, .1, 3)
    for i in range(steps):
        d = d * .55 + field(p, i / steps) * .75 + wob * .12
        d = d / (np.linalg.norm(d) + 1e-9)
        p = p + d * h
        dist, j = tree.query(p)
        limit = clear + 1.0 + hug * (i / steps) ** 2 * 3
        s = float(np.dot(p - verts[j], vn[j]))
        if s < clear:
            p = p + vn[j] * (clear - s)
        elif hug and i / steps < hug and dist > limit:
            p = verts[j] + (p - verts[j]) / (dist + 1e-6) * limit
        pts.append(p.copy())
    return np.array(pts)


def ribbons(strands, widths, centre):
    """Flat tapered ribbons lying against a centre point, ready for one mesh."""
    V, F = [], []
    off = 0
    for pts, w in zip(strands, widths):
        n = len(pts)
        d = np.gradient(pts, axis=0)
        side = np.cross(d, pts - np.asarray(centre))
        side /= np.linalg.norm(side, axis=1, keepdims=True) + 1e-9
        t = np.linspace(0, 1, n)
        wd = w * np.clip(np.minimum(t * 7 + .35, (1 - t) * 1.25), 0, 1)[:, None]
        V.append(np.vstack([pts + side * wd, pts - side * wd]))
        a = np.arange(n - 1) + off
        F.append(np.c_[a, a + 1, a + n + 1, a + n])
        off += 2 * n
    return np.vstack(V), np.vstack(F)


def clumps(v, faces, keep, field, guides, children, length, steps, seed, centre, clear=.25, width=.14, spread=2.2, tight=1.4, jitter=.12, hug=0, collide=None, all_faces=None):
    """Hair as clumps: guide strands with children that gather toward each tip."""
    r = np.random.default_rng(seed)
    cv = v if collide is None else collide
    tree = cKDTree(cv)
    vn = vertex_normals(cv, all_faces if all_faces is not None else faces)
    vr = vertex_normals(v, all_faces if all_faces is not None else faces)
    groots, gn = scalp_samples(v, faces, keep, guides, seed)
    roots, rn = scalp_samples(v, faces, keep, guides * children, seed + 1)
    _, near_v = cKDTree(v).query(groots)
    gn = vr[near_v]
    paths = []
    for p, n in zip(groots, gn):
        l = r.uniform(*length)
        paths.append(grow(p, n, field, l, steps, tree, cv, clear, r, hug, vn))
    gt = cKDTree(groots)
    _, near = gt.query(roots)
    strands, widths = [], []
    t = np.linspace(0, 1, steps + 1)[:, None]
    for rp, g in zip(roots, near):
        base = paths[g]
        off = rp + r.normal(0, .05, 3) - base[0]
        if np.linalg.norm(off) > spread:
            off = off / np.linalg.norm(off) * spread
        wave = np.cumsum(r.normal(0, jitter, (steps + 1, 3)), 0) * t ** .5
        s = base + off * (1 - t ** .8) ** tight + wave + off * .12
        strands.append(s)
        widths.append(width * r.uniform(.7, 1.3))
    return ribbons(strands, widths, centre)
