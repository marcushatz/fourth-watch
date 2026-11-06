"""Shot 13 in 3D: Eve holds out the fruit and Adam's hand closes on it. Run: python scene_s13.py [width] [samples] [beauty|gbuf]"""
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).parent))
import stage3d as s3
from scene_s26 import leaf_mesh, scatter_leaves, trunk_mesh

OUT = "/home/claude/fw-tools/out"


def blob(c, r, seed, n=28, amp=1.0):
    g = np.random.default_rng(seed)
    th, ph = np.meshgrid(np.linspace(0, np.pi, n), np.linspace(0, 2 * np.pi, n * 2, endpoint=False), indexing="ij")
    a = g.uniform(0, 6, 6)
    k = 1 + amp * (.16 * np.sin(th * 5 + a[0]) * np.sin(ph * 4 + a[1]) + .1 * np.sin(th * 9 + a[2]) * np.cos(ph * 7 + a[3]) + .06 * np.sin(ph * 13 + a[4] + th * 11))
    V = np.stack([c[0] + r[0] * k * np.sin(th) * np.cos(ph), c[1] + r[1] * k * np.sin(th) * np.sin(ph), c[2] + r[2] * k * np.cos(th)], -1).reshape(-1, 3)
    F = []
    m = n * 2
    for i in range(n - 1):
        for j in range(m):
            F.append([i * m + j, (i + 1) * m + j, (i + 1) * m + (j + 1) % m, i * m + (j + 1) % m])
    return V, np.array(F)


def merge(parts):
    Vs, Fs, off = [], [], 0
    for V, F in parts:
        Vs.append(V)
        Fs.append(F + off)
        off += len(V)
    return np.vstack(Vs), np.vstack(Fs)


def eye_balls(name, M, skinless, white, iris, look, index):
    d = np.load(s3.ASSETS / f"{name}_eyes.npz")
    R = d["r"]
    ld = R @ np.array(look, float)
    ld /= np.linalg.norm(ld)
    parts_w, parts_i = [], []
    for c in d["c"]:
        c = c + R @ np.array([0, -.25, 0])
        parts_w.append(blob(c, (1.3, 1.3, 1.3), 1, 18, 0))
        parts_i.append(blob(c + ld * 1.0, (.62, .62, .62), 2, 14, 0))
    s3.mesh_from_arrays(name + "_white", *merge(parts_w), white, M, index=index)
    s3.mesh_from_arrays(name + "_iris", *merge(parts_i), iris, M, index=index)


def lowpoly_pass():
    """Facet every surface and swap strands for one solid hair mass."""
    for ob in list(bpy.data.objects):
        if ob.type != "MESH":
            continue
        if ob.name.endswith(("hair", "beard", "brow", "scalp")):
            bpy.data.objects.remove(ob)
            continue
        for m in list(ob.modifiers):
            ob.modifiers.remove(m)
        ob.data.polygons.foreach_set("use_smooth", [False] * len(ob.data.polygons))
        ob.data.update()
        r = .035 if ob.pass_index in (1, 9) else .12 if ob.pass_index == 5 else .2
        if len(ob.data.polygons) > 40 and ob.pass_index != 12:
            ob.modifiers.new("d", "DECIMATE").ratio = r


def build(width=1080, spp=48, kind="beauty"):
    H = int(width * 16 / 9)
    s = s3.reset((width, H), spp)
    s3.world_color((.85, .78, .62), 1.15)
    s3.passes()
    P = s3.principled
    mats = dict(skin_a=P("skin_a", (.3, .165, .1), .46, .4, sss=.4, sss_scale=1.2), skin_e=P("skin_e", (.38, .22, .14), .46, .4, sss=.4, sss_scale=1.2),
                hair=P("hair", (.016, .01, .007), .6, .22), hair_e=P("hair_e", (.03, .016, .009), .58, .22), leaf=P("leaf", (.07, .16, .05), .5, .4), leaf2=P("leaf2", (.03, .085, .04), .5, .4),
                bark=P("bark", (.08, .055, .04), .85, bump=(.1, 1.1, 3)), far=P("far", (.22, .3, .13), .9, .1), far2=P("far2", (.12, .2, .09), .9, .1), ground=P("ground", (.16, .2, .07), .9, .1),
                fruit=P("fruit", (.32, .03, .02), .3, .5), white=P("white", (.62, .58, .54), .25, .5), iris=P("iris", (.012, .008, .006), .15, .6))
    ME = s3.matrix(loc=(-31, 0, 0), rot=(0, 0, -90))
    MA = s3.matrix(loc=(31, 0, -2), rot=(0, 0, 90))
    for name, M, skin, hair, idx in (("adam13", MA, mats["skin_a"], mats["hair"], 1), ("eve13", ME, mats["skin_e"], mats["hair_e"], 9)):
        ob = s3.mesh_from_npz(name, s3.ASSETS / f"{name}_body.npz", skin, M, index=idx)
        m = ob.modifiers.new("sub", "SUBSURF")
        m.levels = m.render_levels = 1
        for p in ("hair", "scalp", "beard", "brow"):
            f = s3.ASSETS / f"{name}_{p}.npz"
            if f.exists():
                s3.mesh_from_npz(name + p, f, hair, M, index=2 if name[0] == "a" else 10)
        eye_balls(name, M, None, mats["white"], mats["iris"], (0, .9, -.45), idx + 2 if name[0] == "e" else 11)
    if kind.startswith("refined"):
        mats["skin_a"].node_tree  # keep the base materials for the simple build
        for ob in bpy.data.objects:
            if ob.name == "adam13":
                ob.data.materials[0] = s3.skin_material("skin_ra", (.3, .165, .1), (.36, .15, .09))
            if ob.name == "eve13":
                ob.data.materials[0] = s3.skin_material("skin_re", (.38, .22, .14), (.42, .19, .13))
    # Fruit in Eve's palm.
    fr = np.load(s3.ASSETS / "fruit13.npz")["c"]
    s3.mesh_from_arrays("fruit", *blob(fr, (4.8, 4.8, 5.0), 7, 40, .06), mats["fruit"], index=12)
    # Eden in depth.
    r = np.random.default_rng(13)
    parts = []
    if kind.startswith("refined"):
        for i in range(34):                                       # real tree crowns, built from many small masses
            y = r.uniform(420, 2400)
            half = (y + 232) * .18
            x = r.uniform(-1.7, 1.7) * half
            top = r.uniform(240, 520) * (1 + y / 2600)
            rad = r.uniform(120, 230) * (1 + y / 2200)
            for j in range(11):
                a, b = r.uniform(0, 6.28), r.uniform(.15, 1)
                q = rad * r.uniform(.32, .55)
                parts.append(blob((x + np.cos(a) * rad * b, y + np.sin(a) * rad * b * .7, top + r.uniform(-.55, .4) * rad), (q, q, q * .85), i * 20 + j, 18))
    else:
        for i in range(46):
            y = r.uniform(420, 2200)
            half = (y + 215) * .18
            x = r.uniform(-1.6, 1.6) * half
            z = r.uniform(120, 420) * (1 + y / 2600)
            rr = r.uniform(110, 240) * (1 + y / 2000)
            parts.append(blob((x, y, z), (rr, rr * .9, rr * .8), i))
    s3.mesh_from_arrays("far_trees", *merge(parts), mats["far"], index=6)
    parts = [trunk_mesh(float(r.uniform(-500, 500)), float(r.uniform(420, 1600)), float(r.uniform(9, 22)), h=420, seed=i) for i in range(24)]
    s3.mesh_from_arrays("far_trunks", *merge(parts), mats["bark"], index=6)
    parts = [blob((-150 + 300 * (i % 2) + r.uniform(-30, 30), r.uniform(240, 330), r.uniform(10, 70)), (r.uniform(70, 110),) * 3, 100 + i) for i in range(6)]
    s3.mesh_from_arrays("mid_trees", *merge(parts), mats["far2"], index=6)
    gv = np.array([[-6000, -400, -105], [6000, -400, -105], [6000, 6000, -105], [-6000, 6000, -105]], float)
    s3.mesh_from_arrays("ground", gv, np.array([[0, 1, 2, 3]]), mats["ground"], index=7, smooth=False)
    # The forbidden tree's limb crosses the top, with one fruit hanging in the light.
    lb = np.array([[-110, 60, 128], [-40, 50, 124], [30, 42, 121], [110, 30, 116]], float)
    t = np.linspace(0, 1, 40)
    c = np.stack([np.interp(t, np.linspace(0, 1, 4), lb[:, i]) for i in range(3)], 1)
    ring = []
    for i, p in enumerate(c):
        a = np.linspace(0, 2 * np.pi, 14, endpoint=False)
        rad = 5.2 - 2.2 * t[i]
        ring.append(np.c_[p[0] + 0 * a, p[1] + rad * np.cos(a), p[2] + rad * np.sin(a)])
    V = np.vstack(ring)
    F = [[i * 14 + j, i * 14 + (j + 1) % 14, (i + 1) * 14 + (j + 1) % 14, (i + 1) * 14 + j] for i in range(39) for j in range(14)]
    s3.mesh_from_arrays("limb", V, np.array(F), mats["bark"], index=6)
    V, F = scatter_leaves(160, ((-90, 20, 112), (90, 70, 145)), (10, 18), 11)
    s3.mesh_from_arrays("canopy", V, F, mats["leaf"], index=5)
    V, F = scatter_leaves(70, ((-70, 0, 118), (70, 30, 140)), (10, 16), 12)
    s3.mesh_from_arrays("canopy2", V, F, mats["leaf2"], index=5)
    s3.mesh_from_arrays("tree_fruit", *blob((15, 30, 106), (3.4, 3.4, 3.7), 9, 30, .06), mats["fruit"], index=12)
    # Leaves in front close the frame below the chest.
    V, F = scatter_leaves(320, ((-60, -46, 6), (60, -12, 34)), (9, 18), 13)
    V2, F2 = scatter_leaves(90, ((-62, -40, 28), (-24, -14, 52)), (9, 17), 15)
    s3.mesh_from_arrays("eve_leaves", V2, F2, mats["leaf2"], index=5)
    s3.mesh_from_arrays("low_leaves", V, F, mats["leaf"], index=5)
    V, F = scatter_leaves(170, ((-60, -120, 4), (60, -62, 27)), (16, 26), 14)
    s3.mesh_from_arrays("near_leaves", V, F, mats["leaf2"], index=5)
    s3.camera((0, -232, 74), (0, 0, 72), lens=65, dof=(219, 4.5) if kind in ("beauty", "refined_beauty") else None)
    if kind == "gbuf":
        s.cycles.use_denoising = False
    s3.sun((-.5, .35, .8), (1, .9, .72), 3.2, angle=8)
    s3.area((-70, -130, 150), (0, 0, 72), (1, .93, .82), 26000, 90)
    s3.area((90, -60, 90), (0, 0, 72), (.8, .9, 1), 7000, 70)
    if kind == "low":
        lowpoly_pass()
        ha = P("hull", (.012, .01, .012), .8, .1)
        for n, M0 in (("adam13", MA), ("eve13", ME)):
            o = s3.mesh_from_npz(n + "_h", s3.ASSETS / f"{n}_hull.npz", ha, M0, smooth=False, index=2)
            o.modifiers.new("d", "DECIMATE").ratio = .09
        bpy.context.scene.camera.data.dof.use_dof = False
    if kind.startswith("refined"):
        s3.area((-200, 260, 190), (0, 0, 80), (1, .86, .62), 130000, 50)
        s.cycles.use_denoising = kind == "refined_beauty"
        if kind != "refined_beauty":
            bpy.context.scene.camera.data.dof.use_dof = False
    s3.save(f"{OUT}/s13_{kind}")


if __name__ == "__main__":
    a = sys.argv
    build(int(a[1]) if len(a) > 1 else 1080, int(a[2]) if len(a) > 2 else 48, a[3] if len(a) > 3 else "beauty")
