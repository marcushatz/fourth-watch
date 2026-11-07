"""Shared Blender pieces for the prototype: object ids, materials, primitive props and the cast. Stills only.

Object ids (the pass the look reads to know what each pixel is):
  1 skin   2 hair   3 scalp   4 brows and beard   5 foliage   6 bark   7 floor and ground   8 the gold light (God's presence only)
  9 eyes  11 shirt  12 trousers  13 socks  14 bedding  15 wood  16 walls  17 the view outside  18 a lit screen  19 small props
 21 fig-leaf clothing
"""
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / "visual_style_exploration" / "src"))
import stage3d as s3  # noqa: E402
from scene_s13 import blob, merge  # noqa: E402

ASSETS = s3.ASSETS
P = s3.principled
CHAR_IDS = (1, 2, 3, 4, 9, 11, 12, 13, 21)


def box(name, c, size, mat, index, bevel=1.2, segments=3, rot=(0, 0, 0)):
    x, y, z = (np.asarray(size, float) / 2)
    v = np.array([[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]])
    f = np.array([[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]])
    ob = s3.mesh_from_arrays(name, v, f, mat, s3.matrix(loc=c, rot=rot), smooth=False, index=index)
    if bevel:
        m = ob.modifiers.new("bev", "BEVEL")
        m.width, m.segments = bevel, segments
        ob.modifiers.new("ws", "WEIGHTED_NORMAL")
    return ob


def sheet(name, c, size, mat, index, seed, bulge=4.0, folds=1.6, n=(48, 40), drape=0.0):
    """A soft rectangle of fabric: a duvet or a sheet, with a puffed middle, folds and optional drape over one edge."""
    r = np.random.default_rng(seed)
    nx, ny = n
    u, w = np.meshgrid(np.linspace(-.5, .5, nx), np.linspace(-.5, .5, ny), indexing="ij")
    X = u * size[0]
    Y = w * size[1]
    puff = bulge * (1 - (2 * u) ** 4) * (1 - (2 * w) ** 4)
    k = r.normal(0, 1, (5, 2)) * [.018, .03]
    ph = r.uniform(0, 6.3, 5)
    fold = folds * sum(np.sin(X * k[i, 0] * 3 + Y * k[i, 1] * 3 + ph[i]) for i in range(5)) / 2.5
    Zs = puff + fold
    if drape:
        edge = np.clip((w - .38) / .12, 0, 1)
        Zs = Zs - drape * edge ** 1.6
        Y = Y + edge * 2.0
    V = np.c_[X.ravel() + c[0], Y.ravel() + c[1], Zs.ravel() + c[2]]
    F = []
    for i in range(nx - 1):
        for j in range(ny - 1):
            a = i * ny + j
            F.append([a, a + ny, a + ny + 1, a + 1])
    ob = s3.mesh_from_arrays(name, V, np.array(F), mat, index=index)
    ob.modifiers.new("sol", "SOLIDIFY").thickness = 1.2
    return ob


def image_emission(name, path, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(str(path))
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[1].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(t.outputs[0], e.inputs[0])
    nt.links.new(e.outputs[0], o.inputs[0])
    return m


def quad(name, corners, mat, index, uv=True):
    v = np.asarray(corners, float)
    ob = s3.mesh_from_arrays(name, v, np.array([[0, 1, 2, 3]]), mat, index=index, smooth=False)
    if uv:
        me = ob.data
        lay = me.uv_layers.new(name="uv")
        for li, (a, b) in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
            lay.data[li].uv = (a, b)
    return ob


# ------------------------------------------------------------------ the cast

def cast_materials():
    return dict(
        skin_m=s3.skin_material("skin_m", (.29, .17, .11), (.33, .15, .1), sss=.12),
        skin_a=s3.skin_material("skin_a", (.3, .165, .1), (.36, .15, .09), sss=.12),
        skin_e=s3.skin_material("skin_e", (.38, .22, .14), (.42, .19, .13), sss=.12),
        hair=P("hair", (.016, .011, .008), .6, .22), hair_e=P("hair_e", (.03, .016, .009), .58, .22),
        shirt=P("shirt", (.12, .14, .17), .85, .15, bump=(2.5, .25, .3)), pants=P("pants", (.05, .055, .07), .8, .15, bump=(3, .2, .2)),
        socks=P("socks", (.11, .11, .12), .9, .1), figleaf=P("figleaf", (.07, .14, .045), .55, .35, bump=(1.6, .35, .4)),
        figleaf_d=P("figleaf_d", (.025, .05, .02), .7, .2),
        white=P("white", (.62, .58, .54), .25, .5), iris=P("iris", (.012, .008, .006), .15, .6))


def eye_balls(name, M, white, iris, look):
    d = np.load(ASSETS / f"vi_{name}_eyes.npz")
    R = d["r"]
    ld = R @ np.array(look, float)
    ld /= np.linalg.norm(ld)
    pw, pi = [], []
    for c in d["c"]:
        c = c + R @ np.array([0, -.25, 0])
        pw.append(blob(c, (1.3, 1.3, 1.3), 1, 18, 0))
        pi.append(blob(c + ld * 1.0, (.62, .62, .62), 2, 14, 0))
    s3.mesh_from_arrays(name + "_white", *merge(pw), white, M, index=9)
    s3.mesh_from_arrays(name + "_iris", *merge(pi), iris, M, index=9)


def person(name, M, mats, skin, hair, look=(0, .9, -.45)):
    ob = s3.mesh_from_npz(name, ASSETS / f"vi_{name}_body.npz", mats[skin], M, index=1)
    m = ob.modifiers.new("sub", "SUBSURF")
    m.levels = m.render_levels = 1
    for part, mat, idx in (("hair", hair, 2), ("scalp", hair, 3), ("beard", hair, 4), ("brow", hair, 4),
                           ("shirt", "shirt", 11), ("pants", "pants", 12), ("socks", "socks", 13), ("leaves", "figleaf_d", 21), ("wrap", "figleaf_d", 21), ("leavesleaf", "figleaf", 21), ("wrapleaf", "figleaf", 21)):
        f = ASSETS / f"vi_{name}_{part}.npz"
        if f.exists():
            o = s3.mesh_from_npz(f"{name}_{part}", f, mats[mat], M, index=idx)
            if idx in (11, 12, 13) or part in ("leaves", "wrap"):
                sm = o.modifiers.new("sub", "SUBSURF")
                sm.levels = sm.render_levels = 1
    eye_balls(name, M, mats["white"], mats["iris"], look)
    return ob


def floor_z(name):
    d = np.load(ASSETS / f"vi_{name}_body.npz")
    return float(d["v"][np.unique(d["f"])][:, 2].min())


def fig_leaf(c, size, ang, tilt, seed):
    """One lobed fig leaf as a small curved mesh, for the loincloths of Genesis 3:7."""
    r = np.random.default_rng(seed)
    th = np.linspace(-np.pi, np.pi, 60, endpoint=False)
    lobe = .62 + .38 * np.abs(np.cos(2.5 * th)) ** .6
    rr = lobe * (1 - .5 * np.clip((np.abs(th) - 2.4) / .7, 0, 1))
    pts = np.c_[np.cos(th) * rr, np.sin(th) * rr * .9] * size * .5 + [size * .45, 0]
    ring = np.r_[[[0, 0]], pts]
    V2 = ring
    n = len(pts)
    F = np.array([[0, 1 + i, 1 + (i + 1) % n, 0] for i in range(n)])[:, :3]
    z = -.18 * size * (V2[:, 0] / size) ** 2 + .05 * size * np.sin(V2[:, 1] / size * 6 + r.uniform(0, 6))
    V = np.c_[V2[:, 0], V2[:, 1], z]
    ca, sa = np.cos(ang), np.sin(ang)
    Rz = np.array([[ca, -sa, 0], [sa, ca, 0], [0, 0, 1]])
    ct, st = np.cos(tilt), np.sin(tilt)
    Rx = np.array([[1, 0, 0], [0, ct, -st], [0, st, ct]])
    return V @ (Rz @ Rx).T + c, np.c_[F, F[:, 2]]
