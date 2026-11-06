"""Shot 26 in 3D: Adam hiding in a dark forest. Writes a multi-pass still. Run: python scene_s26.py LOOK [width] [samples]"""
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import stage3d as s3


def trunk_mesh(x, y, r0, h=900, seed=0, n=18, rows=40):
    g = np.random.default_rng(seed)
    a = np.linspace(0, 2 * np.pi, n, endpoint=False)
    z = np.linspace(-60, h, rows)
    lean = g.normal(0, .03, 2)
    ph = g.uniform(0, 6, 6)
    V = []
    for i, zz in enumerate(z):
        taper = 1 + .9 * np.exp(-(zz + 60) / 40) * .7 - .3 * zz / h
        rad = r0 * taper * (1 + .05 * np.sin(a * 3 + ph[0] + zz * .01) + .04 * np.sin(a * 7 + ph[1] + zz * .017))
        V.append(np.c_[x + zz * lean[0] + rad * np.cos(a), y + zz * lean[1] + rad * np.sin(a), np.full(n, zz)])
    V = np.vstack(V)
    F = []
    for i in range(rows - 1):
        for j in range(n):
            F.append([i * n + j, i * n + (j + 1) % n, (i + 1) * n + (j + 1) % n, (i + 1) * n + j])
    return V, np.array(F)


def leaf_mesh(l, w, bend, rng, nu=17, nv=7):
    u = np.linspace(0, 1, nu)
    v = np.linspace(-1, 1, nv)
    U, W = np.meshgrid(u, v, indexing="ij")
    half = w * np.sin(np.pi * U ** .8) ** .75 * (1 + .1 * np.sin(U * 11 + rng.uniform(0, 6)))
    x = l * U
    y = half * W
    z = -bend * l * U ** 2 + np.abs(W) * half * .28 + .012 * l * np.sin(U * 15 + W * 2 + rng.uniform(0, 6))
    V = np.c_[x.ravel(), y.ravel(), z.ravel()]
    F = []
    for i in range(nu - 1):
        for j in range(nv - 1):
            a = i * nv + j
            F.append([a, a + nv, a + nv + 1, a + 1])
    return V, np.array(F)


def scatter_leaves(n, box, size, seed, keep=None):
    r = np.random.default_rng(seed)
    Vs, Fs = [], []
    off = 0
    for i in range(n):
        l = r.uniform(*size)
        V, F = leaf_mesh(l, l * r.uniform(.2, .3), r.uniform(.05, .35), r)
        yaw, pitch, roll = r.uniform(0, 6.28), r.uniform(-.55, .55), r.uniform(-.45, .45)
        c, s = np.cos(yaw), np.sin(yaw)
        Rz = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
        c, s = np.cos(pitch), np.sin(pitch)
        Ry = np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
        c, s = np.cos(roll), np.sin(roll)
        Rx = np.array([[1, 0, 0], [0, c, -s], [0, s, c]])
        V = V @ (Rz @ Ry @ Rx).T + r.uniform(box[0], box[1])
        if keep is not None and not keep(V).all():
            continue
        Vs.append(V)
        Fs.append(F + off)
        off += len(V)
    return np.vstack(Vs), np.vstack(Fs)


LOOKS = {
    "cinematic": dict(skin=dict(color=(.25, .15, .1), rough=.46, spec=.4, sss=.45, sss_r=(1, .35, .2), sss_scale=1.2), hair=dict(color=(.012, .009, .008), rough=.62, spec=.2),
                      bark=dict(color=(.05, .05, .055), rough=.8, bump=(.09, 1.2, 3)), leaf=dict(color=(.018, .05, .03), rough=.45, spec=.4), ground=dict(color=(.015, .02, .02), rough=.9)),
}


def build(look="cinematic", width=1080, spp=48, out=None, dof=True, refined=False):
    H = int(width * 16 / 9)
    s = s3.reset((width, H), spp)
    L = LOOKS[look]
    s3.world_color((.075, .115, .2), 1.0)
    s3.passes()
    M = {k: s3.principled(k, **v) for k, v in L.items()}
    rot = s3.matrix(rot=(0, 0, 120))
    tag = "adam26r" if refined else "adam26"
    if refined:
        M["skin"] = s3.skin_material("skin_r", (.25, .15, .1), (.3, .13, .09))
    body = s3.mesh_from_npz("body", s3.ASSETS / f"{tag}_body.npz", M["skin"], rot, index=1)
    m = body.modifiers.new("sub", "SUBSURF")
    m.levels = m.render_levels = 1
    for i, p in enumerate(("hair", "beard", "brow")):
        s3.mesh_from_npz(p, s3.ASSETS / f"{tag}_{p}.npz", M["hair"], rot, index=2 + i)
    s3.mesh_from_npz("scalp", s3.ASSETS / f"{tag}_scalp.npz", s3.principled("scalp", (.01, .008, .007), .95, .05), rot, index=2)
    # Forest in depth. A gap is left along the line of sight to the gold.
    r = np.random.default_rng(4)
    Vs, Fs, off = [], [], 0
    camx, camy = -17.0, -135.0
    for i in range(260):
        y = 420 + r.random() ** 1.4 * 3200
        half = (y - camy) * .156
        x = camx + r.uniform(-1.5, 1.5) * half
        sx = (x - camx) / half
        if -.8 < sx < -.56:
            continue
        V, F = trunk_mesh(x, y, r.uniform(5, 15) * (1 + y / 1800), seed=i)
        Vs.append(V)
        Fs.append(F + off)
        off += len(V)
    s3.mesh_from_arrays("trunks", np.vstack(Vs), np.vstack(Fs), M["bark"], index=6)
    gv = np.array([[-6000, -400, -62], [6000, -400, -62], [6000, 6000, -62], [-6000, 6000, -62]], float)
    s3.mesh_from_arrays("ground", gv, np.array([[0, 1, 2, 3]]), M["ground"], index=7, smooth=False)
    # Leaves around him: sharp ones at his depth, soft ones at the lens. His face stays clear.
    V, F = scatter_leaves(150, ((-72, -30, 30), (40, 16, 53)), (13, 22), 1)
    s3.mesh_from_arrays("leaves_low", V, F, M["leaf"], index=5)
    V, F = scatter_leaves(170, ((6, -24, 40), (34, 30, 122)), (9, 18), 2, keep=lambda v: (v[:, 0] > 8).all())
    s3.mesh_from_arrays("leaves_right", V, F, M["leaf"], index=5)
    V, F = scatter_leaves(46, ((-72, -100, 24), (30, -50, 46)), (18, 28), 3)
    s3.mesh_from_arrays("leaves_near", V, F, M["leaf"], index=5)
    if refined:
        from scene_s13 import blob, merge
        q = np.random.default_rng(9)
        parts = []
        for i in range(44):
            y = q.uniform(500, 2800)
            half = (y - camy) * .156
            x = camx + q.uniform(-1.6, 1.6) * half
            if -.82 < (x - camx) / half < -.54:
                continue
            rr = q.uniform(170, 360)
            parts.append(blob((x, y, q.uniform(430, 900)), (rr, rr * .8, rr * .55), i, 24))
        for i in range(40):
            y = q.uniform(230, 1500)
            half = (y - camy) * .156
            x = camx + q.uniform(-1.5, 1.5) * half
            if -.82 < (x - camx) / half < -.54:
                continue
            rr = q.uniform(40, 120)
            parts.append(blob((x, y, -62 + rr * .4), (rr * 1.3, rr, rr * .8), 100 + i, 20))
        s3.mesh_from_arrays("canopy", *merge(parts), s3.principled("under", (.012, .025, .025), .85, .1), index=6)
    # A very thin line of gold, far away.
    gm = s3.emission("gold", (1, .62, .2), 7)
    gx = camx - .68 * (640 - camy) * .156
    gv = np.array([[gx, 640, -40], [gx + .7, 640, -40], [gx + .7, 640, 500], [gx, 640, 500]], float)
    s3.mesh_from_arrays("gold", gv, np.array([[0, 1, 2, 3]]), gm, index=8, smooth=False)
    s3.camera((camx, camy, 68), (camx, 0, 72), lens=65, dof=(128, 26) if dof else None)
    if not dof:
        s.cycles.use_denoising = False
    s3.sun((-.75, -.5, .75), (.6, .74, 1), 2.6, angle=6)
    s3.area((-90, -40, 120), (-8, 0, 80), (.62, .76, 1), 26000, 80)
    s3.area((60, 120, 120), (-8, 0, 80), (.5, .65, 1), 9000, 60)
    s3.area((-95, -90, 66), (-20, 0, 78), (.8, .86, 1), 15000, 50)
    if refined:
        s3.area((-210, 240, 170), (-17, 0, 90), (.66, .8, 1), 120000, 40)
    s3.save(out or f"/home/claude/fw-tools/out/s26_{look}")


if __name__ == "__main__":
    a = sys.argv
    look = a[1] if len(a) > 1 else "cinematic"
    refined = look == "refined"
    look = "cinematic" if refined else look
    kind = a[4] if len(a) > 4 else "beauty"
    build(look, int(a[2]) if len(a) > 2 else 1080, int(a[3]) if len(a) > 3 else 48, out=f"/home/claude/fw-tools/out/s26_{'refined' if refined else look}_{kind}", dof=kind == "beauty", refined=refined)
