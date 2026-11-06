"""Shot 26 rebuilt in other 3D materials: low-poly, a clay and felt miniature, and a toy brick set. No brand assets are used."""
import sys
from pathlib import Path

import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import stage3d as s3
from scene_s13 import blob, merge
from scene_s26 import scatter_leaves, trunk_mesh

OUT = "/home/claude/fw-tools/out"
camx, camy = -17.0, -135.0


def add_mod(ob, kind, **kw):
    m = ob.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def lowpoly(width=1080, spp=48, kind="beauty"):
    H = int(width * 16 / 9)
    s = s3.reset((width, H), spp)
    s3.world_color((.09, .14, .25), 1)
    s3.passes()
    P = s3.principled
    skin = P("skin", (.3, .19, .15), .8, .15)
    hair = P("hair", (.012, .012, .02), .8, .1)
    rot = s3.matrix(rot=(0, 0, 120))
    b = s3.mesh_from_npz("body", s3.ASSETS / "adam26_body.npz", skin, rot, smooth=False, index=1)
    add_mod(b, "DECIMATE", ratio=.035)
    h = s3.mesh_from_npz("hair", s3.ASSETS / "adam26_hull.npz", hair, rot, smooth=False, index=2)
    add_mod(h, "DECIMATE", ratio=.09)
    r = np.random.default_rng(4)
    bark = P("bark", (.05, .06, .08), .85, .1)
    parts = []
    for i in range(170):
        y = 300 + r.random() ** 1.3 * 2500
        half = (y - camy) * .156
        x = camx + r.uniform(-1.5, 1.5) * half
        if -.8 < (x - camx) / half < -.56:
            continue
        parts.append(trunk_mesh(x, y, r.uniform(9, 22), seed=i, n=6, rows=6))
    t = s3.mesh_from_arrays("trunks", *merge(parts), bark, smooth=False, index=6)
    gv = np.array([[-6000, -400, -62], [6000, -400, -62], [6000, 6000, -62], [-6000, 6000, -62]], float)
    s3.mesh_from_arrays("ground", gv, np.array([[0, 1, 2, 3]]), P("ground", (.02, .03, .03), .9, .1), index=7, smooth=False)
    leaf = P("leaf", (.02, .06, .05), .8, .1)
    for name, n, box, size, seed in (("l1", 110, ((-72, -30, 30), (40, 16, 56)), (14, 26), 1), ("l2", 90, ((8, -24, 40), (36, 30, 122)), (14, 26), 2), ("l3", 40, ((-72, -100, 24), (30, -50, 50)), (22, 32), 3)):
        V, F = scatter_leaves(n, box, size, seed, keep=(lambda v: (v[:, 0] > 8).all()) if name == "l2" else None)
        ob = s3.mesh_from_arrays(name, V, F, leaf, smooth=False, index=5)
        add_mod(ob, "DECIMATE", ratio=.1)
    gm = s3.emission("gold", (1, .62, .2), 7)
    gx = camx - .68 * (640 - camy) * .156
    s3.mesh_from_arrays("gold", np.array([[gx, 640, -40], [gx + 1, 640, -40], [gx + 1, 640, 500], [gx, 640, 500]], float), np.array([[0, 1, 2, 3]]), gm, index=8, smooth=False)
    s3.camera((camx, camy, 68), (camx, 0, 72), lens=65)
    s3.sun((-.75, -.5, .75), (.65, .78, 1), 3.2, angle=3)
    s3.area((-90, -40, 120), (-8, 0, 80), (.62, .76, 1), 16000, 80)
    s3.save(f"{OUT}/v18_{kind}")


def miniature(width=1080, spp=56, kind="beauty"):
    H = int(width * 16 / 9)
    s = s3.reset((width, H), spp)
    s3.world_color((.02, .03, .05), 1)
    s3.passes()
    P = s3.principled
    clay = P("clay", (.42, .27, .19), .62, .3, sss=.25, sss_scale=1, bump=(1.6, .35, .35))
    darkclay = P("darkclay", (.03, .024, .024), .55, .35, bump=(1.2, .6, .5))
    rot = s3.matrix(rot=(0, 0, 120))
    b = s3.mesh_from_npz("body", s3.ASSETS / "adam26_body.npz", clay, rot, index=1)
    add_mod(b, "SUBSURF", levels=1, render_levels=1)
    s3.mesh_from_npz("hair", s3.ASSETS / "adam26_hull.npz", darkclay, rot, index=2)
    wood = P("wood", (.05, .04, .04), .6, .3, bump=(.12, 1.6, 2.2))
    felt = P("felt", (.05, .13, .08), 1, .05, bump=(4, .8, .5))
    felt2 = P("felt2", (.1, .2, .1), 1, .05, bump=(4, .8, .5))
    r = np.random.default_rng(7)
    parts = []
    for i in range(46):
        y = 90 + r.random() * 560
        x = camx + r.uniform(-1.3, 1.3) * (y - camy) * .156
        if -.82 < (x - camx) / ((y - camy) * .156) < -.54:
            continue
        parts.append(trunk_mesh(x, y, r.uniform(4, 9), seed=i, h=520))
    s3.mesh_from_arrays("trunks", *merge(parts), wood, index=6)
    gv = np.array([[-900, -400, -62], [900, -400, -62], [900, 900, -62], [-900, 900, -62]], float)
    s3.mesh_from_arrays("ground", gv, np.array([[0, 1, 2, 3]]), P("moss", (.05, .08, .04), 1, .05, bump=(.8, 1.2, 3)), index=7, smooth=False)
    back = s3.principled("back", (.16, .26, .46), .95, .05)
    s3.mesh_from_arrays("backdrop", np.array([[-1200, 760, -80], [1200, 760, -80], [1200, 760, 800], [-1200, 760, 800]], float), np.array([[0, 1, 2, 3]]), back, index=6, smooth=False)
    for name, m, n, box, size, seed in (("l1", felt, 240, ((-72, -30, 30), (40, 16, 56)), (11, 19), 1), ("l2", felt2, 120, ((8, -24, 40), (36, 30, 122)), (11, 19), 2), ("l3", felt, 70, ((-72, -100, 24), (30, -50, 50)), (16, 24), 3)):
        V, F = scatter_leaves(n, box, size, seed, keep=(lambda v: (v[:, 0] > 8).all()) if name == "l2" else None)
        s3.mesh_from_arrays(name, V, F, m, index=5)
    gm = s3.emission("gold", (1, .6, .2), 9)
    gx = camx - .66 * (500 - camy) * .156
    s3.mesh_from_arrays("gold", np.array([[gx, 500, -40], [gx + 1.1, 500, -40], [gx + 1.1, 500, 420], [gx, 500, 420]], float), np.array([[0, 1, 2, 3]]), gm, index=8, smooth=False)
    s3.camera((camx, camy, 68), (camx, 0, 72), lens=65, dof=(126, 1.3) if kind == "beauty" else None)
    if kind != "beauty":
        s.cycles.use_denoising = False
    s3.area((-120, -120, 130), (-8, 0, 76), (1, .82, .6), 105000, 50)
    s3.area((120, 60, 150), (-8, 0, 80), (.45, .62, 1), 80000, 60)
    s3.area((0, 300, 260), (0, 700, 260), (.5, .68, 1), 90000, 300)
    s3.save(f"{OUT}/v10_{kind}")


def box(c, sz):
    x, y, z = c
    a, b, h = sz[0] / 2, sz[1] / 2, sz[2] / 2
    V = np.array([[x - a, y - b, z - h], [x + a, y - b, z - h], [x + a, y + b, z - h], [x - a, y + b, z - h], [x - a, y - b, z + h], [x + a, y - b, z + h], [x + a, y + b, z + h], [x - a, y + b, z + h]], float)
    F = np.array([[3, 2, 1, 0], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]])
    return V, F


def cyl(c, r, h, n=28, r2=None):
    a = np.linspace(0, 2 * np.pi, n, endpoint=False)
    r2 = r if r2 is None else r2
    V = np.vstack([np.c_[c[0] + r * np.cos(a), c[1] + r * np.sin(a), np.full(n, c[2])], np.c_[c[0] + r2 * np.cos(a), c[1] + r2 * np.sin(a), np.full(n, c[2] + h)], [[c[0], c[1], c[2]]], [[c[0], c[1], c[2] + h]]])
    F = [[j, (j + 1) % n, (j + 1) % n + n, j + n] for j in range(n)]
    Ft = [[(j + 1) % n, j, 2 * n, 2 * n] for j in range(n)] + [[j + n, (j + 1) % n + n, 2 * n + 1, 2 * n + 1] for j in range(n)]
    return V, np.array(F + Ft)


def plate(c, nx, ny, h=3.2, stud=8.0):
    parts = [box((c[0], c[1], c[2] + h / 2), (nx * stud - .2, ny * stud - .2, h))]
    for i in range(nx):
        for j in range(ny):
            parts.append(cyl((c[0] + (i - (nx - 1) / 2) * stud, c[1] + (j - (ny - 1) / 2) * stud, c[2] + h), 2.4, 1.7, 16))
    return merge(parts)


def rotmesh(part, deg, pivot, axis="z"):
    V, F = part
    t = np.radians(deg)
    c, s = np.cos(t), np.sin(t)
    R = {"z": [[c, -s, 0], [s, c, 0], [0, 0, 1]], "y": [[c, 0, s], [0, 1, 0], [-s, 0, c]], "x": [[1, 0, 0], [0, c, -s], [0, s, c]]}[axis]
    return (V - pivot) @ np.array(R).T + pivot, F


def brick(width=1080, spp=56, kind="beauty"):
    H = int(width * 16 / 9)
    s = s3.reset((width, H), spp)
    s3.world_color((.03, .05, .1), 1)
    s3.passes()
    def plastic(name, c, rough=.22):
        m = s3.principled(name, c, rough, .5)
        nt = m.node_tree
        b = nt.nodes.get("Principled BSDF")
        bv = nt.nodes.new("ShaderNodeBevel")
        bv.inputs[0].default_value = .22
        nt.links.new(bv.outputs[0], b.inputs["Normal"])
        return m
    skin, torso = plastic("skin", (.5, .33, .2)), plastic("torso", (.46, .3, .18))
    dark = plastic("dark", (.02, .018, .018), .3)
    bark = plastic("bark", (.16, .1, .055))
    bark2 = plastic("bark2", (.09, .09, .12))
    g1, g2 = plastic("g1", (.012, .07, .035)), plastic("g2", (.03, .16, .07))
    base = plastic("base", (.02, .05, .03))
    # The figure faces left. Everything is built around the head at the origin of the shot.
    fx, fy, fz = 0, 0, 0
    parts = []
    head = cyl((fx, fy, fz + 9.6), 4.9, 8.8, 40)
    neck = cyl((fx, fy, fz + 8.2), 2.4, 1.6)
    tv = np.array([[-7.6, -3.9, -5], [7.6, -3.9, -5], [7.6, 3.9, -5], [-7.6, 3.9, -5], [-5.4, -3.9, 8], [5.4, -3.9, 8], [5.4, 3.9, 8], [-5.4, 3.9, 8]], float)
    tf = box((0, 0, 0), (1, 1, 1))[1]
    for name, part, m, idx in (("head", rotmesh(head, 16, np.array([0, 0, 8.2]), "x"), skin, 1), ("neck", neck, skin, 1), ("torso", (tv, tf), torso, 1)):
        s3.mesh_from_arrays(name, *rotmesh(part, 118, np.array([0, 0, 0])), m, index=idx, smooth=False)
    arms = merge([rotmesh(cyl((sx * 8.4, 0, -6), 2.5, 13.5, 24, 2.4), 8 * sx, np.array([sx * 8.4, 0, 7]), "y") for sx in (-1, 1)] + [cyl((sx * 9.2, 3, -7.4), 2.3, 2.6, 18) for sx in (-1, 1)])
    s3.mesh_from_arrays("arms", *rotmesh(arms, 118, np.array([0, 0, 0])), skin, index=1, smooth=True)
    hairp = blob((0, -1.0, 17.4), (5.4, 5.8, 3.5), 3, 40, .1)
    bear = blob((0, 4.4, 10.4), (3.5, 1.8, 2.5), 5, 32, .16)
    hv, hf = rotmesh(merge([hairp, bear]), 16, np.array([0, 0, 8.2]), "x")
    s3.mesh_from_arrays("hairpiece", *rotmesh((hv, hf), 118, np.array([0, 0, 0])), dark, index=2)
    # Printed face: shut eyes and raised inner brows on the cylinder.
    print_parts = []
    def arc_print(a0, a1, z0, z1, wid):
        a = np.radians(np.linspace(a0, a1, 16))
        z = np.linspace(z0, z1, 16) - .34 * np.sin(np.linspace(0, np.pi, 16))
        r = 4.95
        p = np.c_[r * np.sin(a), r * np.cos(a), z]
        up = np.array([0, 0, wid])
        V = np.vstack([p + up, p - up])
        F = [[i, i + 1, i + 17, i + 16] for i in range(15)]
        return V, np.array(F)
    for sx in (-1, 1):
        print_parts.append(arc_print(sx * 14, sx * 42, 14.0, 14.0, .22))
        print_parts.append(arc_print(sx * 12, sx * 44, 15.5, 14.9, .3))
    pv, pf = rotmesh(merge(print_parts), 16, np.array([0, 0, 8.2]), "x")
    s3.mesh_from_arrays("print", *rotmesh((pv, pf), 118, np.array([0, 0, 0])), dark, index=3, smooth=False)
    r = np.random.default_rng(3)
    # Baseplate, trunks of stacked round bricks, plates for leaves.
    s3.mesh_from_arrays("base", *plate((0, 100, -20), 60, 56, 3.2), base, index=7, smooth=False)
    trunks, trunks2 = [], []
    for i in range(46):
        x, y = float(r.integers(-16, 18) * 8), float(r.integers(3, 42) * 8) + 8
        half = (y + 60) * .16
        if -.82 < x / half < -.5 or y < 26:
            continue
        rad = float(r.choice([3.9, 5.9, 7.9]))
        col = trunks if r.random() < .6 else trunks2
        for k in range(26):
            col.append(cyl((x, y, -17 + k * 9.6), rad, 9.4, 18, rad))
            col.append(cyl((x, y, -17 + k * 9.6 + 9.4), rad * .62, .22, 12))
    s3.mesh_from_arrays("trunks", *merge(trunks), bark, index=6)
    s3.mesh_from_arrays("trunks2", *merge(trunks2), bark2, index=6)
    for name, m, n, b, seed in (("l1", g1, 34, ((-30, -14, -9), (24, 6, -5)), 1), ("l2", g2, 24, ((-30, -14, -8), (24, 8, -3)), 2), ("l3", g1, 22, ((16, 6, 8), (34, 26, 46)), 3)):
        q = np.random.default_rng(seed)
        parts = [rotmesh(plate(q.uniform(b[0], b[1]), int(q.integers(1, 3)), int(q.integers(2, 4))), q.uniform(-22, 22), q.uniform(b[0], b[1]), "x") for _ in range(n)]
        parts = [rotmesh(p, q.uniform(-16, 16), np.array(p[0].mean(0)), "y") for p in parts]
        s3.mesh_from_arrays(name, *merge(parts), m, index=5, smooth=False)
    glow = s3.emission("gold", (1, .6, .2), 9)
    parts = [cyl((-58, 260, -17 + k * 9.6), .9, 9.2, 12) for k in range(40)]
    s3.mesh_from_arrays("gold", *merge(parts), glow, index=8, smooth=False)
    cx = 2.5
    s3.camera((cx, -62, 13), (cx, 0, 11.5), lens=65, dof=(60, 1.1) if kind == "beauty" else None)
    if kind != "beauty":
        s.cycles.use_denoising = False
    s3.area((-40, -46, 46), (0, 0, 12), (.72, .84, 1), 5200, 22)
    s3.area((38, 34, 36), (0, 0, 12), (.45, .6, 1), 3000, 26)
    s3.area((-10, 120, 90), (-10, 260, 40), (.5, .66, 1), 16000, 80)
    s3.save(f"{OUT}/v09_{kind}")


if __name__ == "__main__":
    a = sys.argv
    {"low": lowpoly, "mini": miniature, "brick": brick}[a[1]](int(a[2]) if len(a) > 2 else 1080, int(a[3]) if len(a) > 3 else 48, a[4] if len(a) > 4 else "beauty")
