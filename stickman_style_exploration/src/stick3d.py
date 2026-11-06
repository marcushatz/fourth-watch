"""Three styles built as real 3D scenes in Blender: dark cinematic, monochrome film, stylized 3D.
Run: python stick3d.py <dark|film|cg> <a|b|c> [spp] [width]. Writes a multilayer EXR. Stills only."""
import math
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1] / "visual_style_exploration" / "src"))
import poses as P
import stage3d as s3
from scene_s02 import fbm2, field

OUT = Path("/home/claude/fw-tools/out")
U = 23.0  # one head unit in centimetres
H_PX, W_PX = 1920, 1080


def merge(parts):
    V, F, n = [], [], 0
    for v, f in parts:
        V.append(v)
        F.append(f + n)
        n += len(v)
    return np.vstack(V), np.vstack(F)


def tube(path, r0, r1, ring=10, mid=0.0, seg=8):
    c = P.smooth(np.asarray(path, float), seg) if len(path) > 2 else np.linspace(path[0], path[1], seg + 1)
    n = len(c)
    t = np.linspace(0, 1, n)
    r = r0 + (r1 - r0) * t + mid * np.sin(np.pi * t)
    T = np.gradient(c, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True) + 1e-9
    N = np.zeros_like(c)
    up = np.array([.13, .97, .2])
    N[0] = np.cross(T[0], up)
    N[0] /= np.linalg.norm(N[0]) + 1e-9
    for i in range(1, n):
        q = N[i - 1] - np.dot(N[i - 1], T[i]) * T[i]
        N[i] = q / (np.linalg.norm(q) + 1e-9)
    B = np.cross(T, N)
    # Rounded ends: a few extra rings that close the tube.
    k = np.array([.04, .55, .87])
    d = np.array([1.0, .84, .5])
    C = np.vstack([c[0] - T[0] * r[0] * d[None, 0:1].T * 0 - np.outer(d, T[0]) * r[0], c, c[-1] + np.outer(d[::-1], T[-1]) * r[-1]])
    R = np.r_[r[0] * k, r, r[-1] * k[::-1]]
    TT = np.vstack([np.repeat(N[:1], 3, 0), N, np.repeat(N[-1:], 3, 0)])
    BB = np.vstack([np.repeat(B[:1], 3, 0), B, np.repeat(B[-1:], 3, 0)])
    a = np.linspace(0, 2 * np.pi, ring, endpoint=False)
    V = C[:, None, :] + R[:, None, None] * (np.cos(a)[None, :, None] * TT[:, None, :] + np.sin(a)[None, :, None] * BB[:, None, :])
    m = len(C)
    i, j = np.meshgrid(np.arange(m - 1), np.arange(ring), indexing="ij")
    aa = i * ring + j
    bb = i * ring + (j + 1) % ring
    F = np.stack([aa, aa + ring, bb + ring, bb], -1).reshape(-1, 4)
    return V.reshape(-1, 3), F


def sphere(c, r, nu=24, nv=16, squash=(1, 1, 1)):
    th = np.linspace(.0001, np.pi - .0001, nv)
    ph = np.linspace(0, 2 * np.pi, nu, endpoint=False)
    V = np.stack([np.sin(th)[:, None] * np.cos(ph)[None, :], np.sin(th)[:, None] * np.sin(ph)[None, :], np.cos(th)[:, None] * np.ones_like(ph)[None, :]], -1)
    V = V * np.array(squash) * r + np.array(c)
    i, j = np.meshgrid(np.arange(nv - 1), np.arange(nu), indexing="ij")
    a = i * nu + j
    b = i * nu + (j + 1) % nu
    return V.reshape(-1, 3), np.stack([a, a + nu, b + nu, b], -1).reshape(-1, 4)


def cylinder(x, y, z0, z1, r0, r1, seg=24, rows=20, wob=0.0, seed=0):
    g = np.random.default_rng(seed)
    p = np.stack([x + np.cumsum(g.normal(0, wob, rows)), y + np.cumsum(g.normal(0, wob * .4, rows)), np.linspace(z0, z1, rows)], 1)
    return tube(p, r0, r1, seg, seg=2)


def fig(pose, X, Y, Z, u=U, thick=.13, flip=False, head=.40, depth=1.0):
    def w(j):
        j = np.asarray(j, float)
        return np.array([X + (-1 if flip else 1) * j[0] * u, Y + j[2] * u * depth, Z + j[1] * u])

    th = thick * u
    parts = []
    for a, b in (("arm_a", "chest"), ("arm_b", "chest"), ("leg_a", "pelvis"), ("leg_b", "pelvis")):
        pts = [w(pose[b])] + [w(q) for q in pose[a]]
        parts.append(tube(pts, th * (.5 if "leg" in a else .42), th * (.3 if "leg" in a else .24)))
    parts.append(tube([w(pose["neck"]), w(pose["chest"]), w(pose["waist"]), w(pose["pelvis"])], th * .56, th * .46))
    parts.append(tube([w(pose["neck"]), w(pose["head"])], th * .38, th * .3, seg=4))
    parts.append(sphere(w(pose["head"]), head * u))
    for h in pose.get("hair", []):
        parts.append(tube([w(q) for q in h], head * u * .5, th * .08, 10))
    return merge(parts)


class Frame:
    """Places things so the 3D frames match the fixed px blocking of the three scenes."""
    def __init__(s, lens, u, yg, yh, zg=0.0):
        s.f = lens / 36 * H_PX
        s.lens = lens
        s.D = s.f * U / u
        s.yh = yh
        s.hc = zg + (yg - yh) * s.D / s.f
        s.zg = zg

    def x(s, px):
        return (px - 540) * s.D / s.f

    def wx(s, px, y):
        return (px - 540) * (s.D + y) / s.f

    def wz(s, py, y):
        return s.hc + (s.yh - py) * (s.D + y) / s.f

    def cam(s, dof=None):
        c = s3.camera((0, -s.D, s.hc), (0, 100000, s.hc), lens=s.lens, sensor=36, dof=dof)
        c.data.shift_y = (s.yh - 960) / H_PX
        c.data.clip_end = 2e7
        return c


def leafy(tips, n, spread, size, seed):
    g = np.random.default_rng(seed)
    tips = np.asarray(tips, float)
    i = g.integers(0, len(tips), n)
    o = tips[i] + g.normal(0, 1, (n, 3)) * spread * np.array([1, 1, .7])
    u, v = g.normal(0, 1, (n, 3)), g.normal(0, 1, (n, 3))
    u /= np.linalg.norm(u, axis=1, keepdims=True)
    v = v - (v * u).sum(1, keepdims=True) * u
    v /= np.linalg.norm(v, axis=1, keepdims=True)
    s = size * g.uniform(.7, 1.3, (n, 1))
    V = np.stack([o - u * s, o - v * s * .42, o + u * s, o + v * s * .42], 1).reshape(-1, 3)
    return V, np.arange(n * 4).reshape(-1, 4)


def tree_mesh(root, ang, L, r, depth, seed):
    g = np.random.default_rng(seed)
    parts, tips = [], []

    def go(p, d, L, r, depth):
        n = 5
        q = [np.array(p, float)]
        c = np.array(d, float)
        for _ in range(n):
            c = c + g.normal(0, .12, 3) * np.array([1, .3, 1])
            c /= np.linalg.norm(c)
            q.append(q[-1] + c * L / n)
        parts.append(tube(q, r, r * .66, 9, seg=3))
        if depth <= 2:
            tips.extend(q[1:])
        if depth <= 0:
            return
        for k in range(int(g.integers(2, 4))):
            e = c + g.normal(0, .55, 3)
            e[2] += .22
            e[1] *= .3
            e /= np.linalg.norm(e)
            go(q[-1], e, L * g.uniform(.62, .82), r * g.uniform(.56, .72), depth - 1)

    go(root, ang, L, r, depth)
    return merge(parts), np.array(tips)


def rough_mat(name, col, r=.8, bump=(.02, .5, 6)):
    return s3.principled(name, col, r, .25, bump=bump)


def h_hill(zg):
    def f(x, y):
        k = np.exp(-(x / 6500) ** 2)
        ridge = np.clip(1 - np.abs(y) / 2100, 0, 1) ** 1.6 * k
        return zg * ridge + 10 * fbm2(x / 500, y / 500, 3) * (1 - ridge) + 4 * fbm2(x / 70, y / 70, 5) + 1.2 * fbm2(x / 9, y / 9, 6) - 60 * np.clip(y / 9000, 0, 1)
    return f


def dark_a(spp):
    s3.reset(spp=spp)
    s3.world_color((.006, .012, .02), 1)
    F = Frame(50, 24, 1505, 1590, zg=240)
    F.cam()
    hf = h_hill(F.zg)
    v, f = field(-30000, 30000, -2700, 22000, 1100, 900, hf)
    z0 = float(hf(np.zeros(1), np.zeros(1))[0])
    s3.mesh_from_arrays("hill", v, f, rough_mat("rock", (.04, .05, .055), .9, (.1, .5, 12)), index=1)
    v, f = field(-340000, 340000, 40000, 420000, 900, 500, lambda x, y: -800 + 14500 * np.clip(.62 + .45 * fbm2(x / 42000, y / 42000, 7, 7, True), 0, 1.6) * np.clip((y - 40000) / 140000, 0, 1) ** .8)
    s3.mesh_from_arrays("range", v, f, rough_mat("rng", (.09, .12, .15), .9, (.0002, .6, 300)), index=2)
    v, f = fig(P.AWE, 0, 0, z0 - .5, thick=.18)
    s3.mesh_from_arrays("man", v, f, s3.principled("m", (.01, .01, .012), .35, .5), index=5)
    s3.sun((.42, 1, .13), (.62, .78, 1), 7, 1.2)
    s3.passes()
    s3.save(OUT / "st_dark_a.exr")


def dark_b(spp):
    s3.reset(spp=spp)
    s3.world_color((.006, .012, .016), 1)
    F = Frame(50, 88, 1516, 1400)
    F.cam((F.D + 0, 4.5))
    v, f = field(-4000, 4000, -1000, 7000, 600, 600, lambda x, y: 14 * fbm2(x / 260, y / 260, 2) * np.clip((y + 300) / 800, 0, 1) + 2 * fbm2(x / 32, y / 32, 4))
    s3.mesh_from_arrays("g", v, f, rough_mat("gr", (.03, .05, .03), .9, (.03, 1.2, 8)), index=1)
    e, a = P.SCENES["b"]
    v, f = fig(P.EVE, F.x(e["ox"]), 0, 0, u=U * .95, thick=.16)
    s3.mesh_from_arrays("eve", v, f, s3.principled("e", (.014, .012, .012), .45, .5), index=5)
    v, f = fig(P.ADAM, F.x(a["ox"]), 0, 0, thick=.16)
    s3.mesh_from_arrays("adam", v, f, s3.principled("a", (.012, .013, .016), .45, .5), index=6)
    fx, fy = P.fruit_px()
    v, f = sphere((F.x(fx), 0, F.wz(fy, 0)), 7.4, 32, 22)
    fr = s3.principled("fr", (.42, .03, .012), .3, .6)
    s3.mesh_from_arrays("fruit", v, f, fr, index=7)
    (tv, tf), tips = tree_mesh((F.wx(1075, 380), 380, 0), (-.2, 0, .98), 260, 30, 5, 4)
    s3.mesh_from_arrays("tree", tv, tf, rough_mat("bk", (.016, .012, .01), .9, (.1, 1, 3)), index=2)
    lv, lf = leafy(tips[tips[:, 2] > 330], 46000, 30, 7.5, 2)
    s3.mesh_from_arrays("lv", lv, lf, s3.principled("lf", (.012, .03, .016), .6, .3), smooth=False, index=3)
    # The far garden, which the air will all but dissolve.
    for i, x in enumerate(np.linspace(-3000, 3000, 13)):
        y = 1700 + (i * 977 % 2600)
        (tv, tf), tips = tree_mesh((x, y, 0), (.05, 0, 1), 400, 44, 3, 20 + i)
        s3.mesh_from_arrays(f"tr{i}", tv, tf, rough_mat("bk2", (.02, .02, .02), .9, (.1, 1, 3)), index=2)
        lv, lf = leafy(tips, 7000, 100, 18, 40 + i)
        s3.mesh_from_arrays(f"lf{i}", lv, lf, s3.principled("lf2", (.02, .035, .025), .6, .3), smooth=False, index=3)
    # One low sun behind the left of frame, giving an edge to everything and no fill at all.
    s3.sun((-.82, .55, .16), (1, .68, .36), 16, 1.5)
    s3.passes()
    s3.save(OUT / "st_dark_b.exr")


def forest(F, seed, wide, skip=None):
    g = np.random.default_rng(seed)
    out = []
    for i in range(wide):
        y = g.uniform(700, 9000)
        x = g.uniform(-1, 1) * (y + F.D) * .36
        px = 540 + x * F.f / (y + F.D)
        if skip and any(abs(px - c) < w for c, w in skip):
            continue
        r = g.uniform(9, 26)
        out.append(cylinder(x, y, -10, 1800, r, r * .62, 14, 8, 6, i))
    return merge(out)


def dark_c(spp):
    s3.reset(spp=spp)
    s3.world_color((.004, .009, .012), 1)
    F = Frame(50, 104, 1590, 1500)
    F.cam((F.D, 5.6))
    v, f = field(-4000, 4000, -1000, 11000, 700, 800, lambda x, y: 10 * fbm2(x / 200, y / 200, 7) * np.clip((y + 100) / 600, 0, 1) + 3 * fbm2(x / 30, y / 30, 8))
    s3.mesh_from_arrays("g", v, f, rough_mat("gr", (.025, .035, .028), .9, (.03, 1.4, 8)), index=1)
    v, f = forest(F, 11, 240, skip=((178, 20),))
    s3.mesh_from_arrays("wood", v, f, rough_mat("bk", (.012, .012, .012), .85, (.09, 1.2, 4)), index=2)
    v, f = cylinder(F.wx(372, 60), 60, -10, 1800, 42, 30, 28, 10, 3, 3)
    s3.mesh_from_arrays("big", v, f, rough_mat("bk3", (.03, .026, .022), .8, (.08, 1.6, 4)), index=3)
    e = P.SCENES["c"][0]
    v, f = fig(P.FEAR, F.x(e["ox"]), 0, 2, u=U, thick=.16)
    s3.mesh_from_arrays("man", v, f, s3.principled("m", (.02, .02, .022), .4, .5), index=5)
    Y = 7000
    lx, lz = F.wx(P.LIGHT_C[0], Y), F.wz(P.LIGHT_C[1], Y)
    v, f = sphere((lx, Y, lz), 90)
    s3.mesh_from_arrays("lamp", v, f, s3.emission("gl", (1, .62, .28), 60), index=8)
    l = s3.bpy.data.lights.new("pt", "POINT")
    l.energy, l.color, l.shadow_soft_size = 6e7, (1, .6, .28), 90
    ob = s3.bpy.data.objects.new("pt", l)
    s3.bpy.context.scene.collection.objects.link(ob)
    ob.location = (lx, Y - 200, lz)
    s3.sun((.5, -.3, .8), (.25, .4, .55), .06, 10)
    # A cold edge from behind and right, the only thing that finds his outline.
    s3.area((420, 900, 420), (F.x(650), 0, 60), (.55, .75, .9), 2.2e6, 260)
    s3.passes()
    s3.save(OUT / "st_dark_c.exr")


def film_a(spp):
    s3.reset(spp=spp)
    s3.world_color((.012, .012, .012), 1)
    F = Frame(18, 24, 1505, 1330)
    F.cam()
    v, f = field(-9000, 9000, -2000, 60000, 800, 800, lambda x, y: 26 * np.clip(y / 9000, 0, 1) * fbm2(x / 1400, y / 1400, 3) + 1.4 * fbm2(x / 60, y / 60, 4) + .5 * fbm2(x / 9, y / 9, 5))
    s3.mesh_from_arrays("flat", v, f, rough_mat("salt", (.5, .5, .5), .95, (.3, .5, 1.2)), index=1)
    v, f = fig(P.AWE, F.x(540), 0, 0, thick=.2)
    s3.mesh_from_arrays("man", v, f, s3.principled("m", (.012, .012, .012), .6, .2), index=5)
    s3.sun((.05, 1, .095), (1, 1, 1), 4.2, .35)
    s3.passes()
    s3.save(OUT / "st_film_a.exr")


def film_b(spp):
    s3.reset(spp=spp)
    s3.world_color((.006, .006, .006), 1)
    F = Frame(24, 88, 1516, 1460)
    F.cam()
    v, f = field(-1400, 1400, -700, 340, 300, 200, lambda x, y: 2 * fbm2(x / 30, y / 30, 2) + 4 * np.clip((y - 40) / 300, 0, 1) * fbm2(x / 80, y / 80, 3))
    s3.mesh_from_arrays("g", v, f, rough_mat("gr", (.08, .08, .08), .95, (.2, 1, 2)), index=1)
    # A rock face close behind them: this is the screen their shadows fall on.
    x, z = np.meshgrid(np.linspace(-1500, 1500, 700), np.linspace(-20, 1500, 700), indexing="ij")
    y = 245 + 8 * fbm2(x / 90, z / 90, 4) + 3 * fbm2(x / 24, z / 24, 5)
    V = np.stack([x, y, z], -1).reshape(-1, 3)
    i, j = np.meshgrid(np.arange(699), np.arange(699), indexing="ij")
    a = (i * 700 + j).ravel()
    s3.mesh_from_arrays("wall", V, np.c_[a, a + 700, a + 701, a + 1], rough_mat("wl", (.62, .62, .62), .9, (.06, .9, 5)), index=2)
    e, b = P.SCENES["b"]
    v, f = fig(P.EVE, F.x(e["ox"]), 0, 0, u=U * .95, thick=.15, depth=.2)
    s3.mesh_from_arrays("eve", v, f, s3.principled("e", (.02, .02, .02), .5, .3), index=5)
    v, f = fig(P.ADAM, F.x(b["ox"]), 0, 0, thick=.15, depth=.2)
    s3.mesh_from_arrays("adam", v, f, s3.principled("a", (.02, .02, .02), .5, .3), index=6)
    fx, fy = P.fruit_px()
    v, f = sphere((F.x(fx), 0, F.wz(fy, 0)), 7.4, 32, 22)
    s3.mesh_from_arrays("fruit", v, f, s3.principled("fr", (.5, .5, .5), .35, .5), index=7)
    # An unseen branch near the lamp throws the tree across the top of the wall.
    (tv, tf), tips = tree_mesh((120, -60, 210), (-.75, -.04, .55), 46, 3.4, 5, 8)
    s3.mesh_from_arrays("tree", tv, tf, rough_mat("bk", (.02, .02, .02), .9, (.1, 1, 3)), index=3)
    lv, lf = leafy(tips, 1300, 4.5, 1.7, 2)
    s3.mesh_from_arrays("lv", lv, lf, s3.principled("lf", (.02, .02, .02), .6, .3), smooth=False, index=3)
    l = s3.bpy.data.lights.new("key", "POINT")
    l.energy, l.color, l.shadow_soft_size = 1.6e6, (1, 1, 1), .3
    ob = s3.bpy.data.objects.new("key", l)
    s3.bpy.context.scene.collection.objects.link(ob)
    ob.location = (-130, -150, 16)
    s3.passes()
    s3.save(OUT / "st_film_b.exr")


def film_c(spp):
    s3.reset(spp=spp)
    s3.world_color((.01, .01, .01), 1)
    F = Frame(28, 104, 1590, 1500)
    F.cam()
    v, f = field(-3000, 3000, -800, 7000, 700, 700, lambda x, y: 7 * fbm2(x / 200, y / 200, 7) * np.clip((y + 80) / 500, 0, 1) + 1.6 * fbm2(x / 24, y / 24, 8) + .6 * fbm2(x / 7, y / 7, 9))
    s3.mesh_from_arrays("g", v, f, rough_mat("gr", (.3, .3, .3), .95, (.3, 1, 2)), index=1)
    g = np.random.default_rng(4)
    parts = []
    for i in range(120):
        y = g.uniform(500, 6400) if i > 14 else g.uniform(160, 900)
        x = g.uniform(-1.2, 1.0) * (y + F.D) * .32
        if (-80 < x < 200 and y < 700) or (i <= 14 and abs(x) < 120):
            continue
        r = g.uniform(7, 20)
        parts.append(cylinder(x, y, -10, 1500, r, r * .7, 14, 6, 3, i))
    v, f = merge(parts)
    s3.mesh_from_arrays("wood", v, f, rough_mat("bk", (.05, .05, .05), .85, (.12, 2.2, 4)), index=2)
    v, f = cylinder(F.wx(380, 60), 60, -10, 1500, 36, 26, 28, 8, 2, 3)
    s3.mesh_from_arrays("big", v, f, rough_mat("bk3", (.05, .05, .05), .8, (.12, 2.4, 4)), index=3)
    e = P.SCENES["c"][0]
    v, f = fig(P.FEAR, F.x(e["ox"]), 0, 2, thick=.16, depth=.6)
    s3.mesh_from_arrays("man", v, f, s3.principled("m", (.02, .02, .02), .5, .3), index=5)
    s3.sun((-.42, 1, .16), (1, 1, 1), 14, .35)
    s3.passes()
    s3.save(OUT / "st_film_c.exr")


def satin(name, col, r=.42, spec=.5):
    return s3.principled(name, col, r, spec)


def porcelain():
    return s3.principled("porc", (.86, .8, .7), .24, .6, sss=.3, sss_r=(1, .7, .5), sss_scale=4)


def cg_a(spp):
    s3.reset(spp=spp)
    s3.world_color((.012, .02, .05), 1)
    F = Frame(35, 24, 1505, 1360, zg=320)
    c = F.cam()
    # A sculpted hill whose contours are cut into soft terraces, like a model in a museum case.
    z0 = F.zg
    def hf(x, y):
        d = np.sqrt((x / 1.3) ** 2 + y ** 2) * (1 + .1 * fbm2(x / 900, y / 900, 4, 3))
        z = z0 * np.exp(-(d / 900) ** 1.6)
        step = 21.0
        q = z / step
        fq = q - np.floor(q)
        w_ = np.clip((fq - .6) / .4, 0, 1)
        zz = (np.floor(q) + w_ * w_ * (3 - 2 * w_)) * step
        return zz + .6 * fbm2(x / 40, y / 40, 6, 2)
    v, f = field(-6000, 6000, -1700, 9000, 1100, 1000, hf)
    z0 = float(hf(np.zeros(1), np.zeros(1))[0])
    s3.mesh_from_arrays("terr", v, f, s3.principled("t", (.035, .075, .06), .45, .45), index=1)
    v, f = fig(P.AWE, 0, 0, z0, thick=.24, head=.42)
    s3.mesh_from_arrays("man", v, f, porcelain(), index=5)
    # Lamps hung in space: hundreds of glass beads in deep layers, so the sky has real depth.
    g = np.random.default_rng(5)
    parts = []
    for i in range(520):
        y = g.uniform(3000, 90000)
        x = g.uniform(-1, 1) * (y + F.D) * .34
        z = F.wz(g.uniform(-100, 1500), y)
        parts.append(sphere((x, y, z), (y + F.D) * g.uniform(.0002, .0012) ** 1.0, 10, 8))
    v, f = merge(parts)
    s3.mesh_from_arrays("stars", v, f, s3.emission("st", (.82, .9, 1), 2.4), index=8)
    y = 60000
    v, f = sphere((F.wx(600, y), y, F.wz(470, y)), 3600, 48, 32)
    s3.mesh_from_arrays("moon", v, f, s3.emission("mn", (1, .9, .72), 1.3), index=8)
    s3.sun((.5, -.2, .6), (.75, .85, 1), 2.6, 6)
    s3.sun((-.6, -.7, .3), (.25, .35, .7), .5, 20)
    s3.passes()
    s3.save(OUT / "st_cg_a.exr")


def round_tree(x, y, z, h, r, seed, n=9):
    g = np.random.default_rng(seed)
    tr = tube(np.array([[x, y, z], [x + g.uniform(-.1, .1) * h, y, z + h * .55], [x + g.uniform(-.2, .2) * h, y, z + h]]), r * .13, r * .06, 12)
    c = [sphere((x + g.uniform(-1, 1) * r * .85, y + g.uniform(-1, 1) * r * .6, z + h + g.uniform(-.4, .7) * r), r * g.uniform(.42, .7), 28, 18) for _ in range(n)]
    return tr, merge(c)


def cg_b(spp):
    s3.reset(spp=spp)
    s3.world_color((.55, .74, .82), .9)
    F = Frame(50, 88, 1516, 1330)
    F.cam((F.D, 7))
    v, f = field(-5000, 5000, -1000, 14000, 700, 900, lambda x, y: 150 * np.clip((y - 300) / 3200, 0, 1) * (1.1 + .75 * fbm2(x / 1500, y / 1500, 2, 3)) + 1.4 * fbm2(x / 120, y / 120, 5, 2))
    s3.mesh_from_arrays("g", v, f, s3.principled("gr", (.14, .21, .1), .55, .4), index=1)
    e, a = P.SCENES["b"]
    v, f = fig(P.EVE, F.x(e["ox"]), 0, 0, u=U * .95, thick=.21, head=.41)
    s3.mesh_from_arrays("eve", v, f, porcelain(), index=5)
    v, f = fig(P.ADAM, F.x(a["ox"]), 0, 0, thick=.21, head=.41)
    s3.mesh_from_arrays("adam", v, f, porcelain(), index=6)
    fx, fy = P.fruit_px()
    v, f = sphere((F.x(fx), 0, F.wz(fy, 0)), 8, 40, 28)
    s3.mesh_from_arrays("fruit", v, f, s3.principled("fr", (.6, .03, .015), .12, .8), index=7)
    tr, cn = round_tree(F.wx(960, 300), 300, 0, 470, 210, 3, 14)
    s3.mesh_from_arrays("tr", *tr, s3.principled("b", (.14, .07, .04), .55, .4), index=2)
    s3.mesh_from_arrays("cn", *cn, s3.principled("l", (.075, .17, .1), .5, .4), index=3)
    g = np.random.default_rng(7)
    bx, bz = F.wx(960, 300), 330
    for i, (px, cz) in enumerate(((450, 610), (590, 690), (720, 640))):
        y = 240
        qx, qz = F.wx(px, y), F.wz(cz, y)
        v, f = sphere((qx, y, qz - 8), 7.4, 24, 16)
        s3.mesh_from_arrays(f"f{i}", v, f, s3.principled("fr2", (.6, .03, .015), .12, .8), index=7)
        v, f = tube([(bx, 300, bz + i * 26), ((bx + qx) / 2, 270, qz + 40 + i * 6), (qx, y, qz)], 6.5, 1.2, 8)
        s3.mesh_from_arrays(f"bg{i}", v, f, s3.principled("b3", (.14, .07, .04), .55, .4), index=2)
    for i in range(18):
        y = g.uniform(1600, 9000)
        x = g.uniform(-1, 1) * (y + F.D) * .3
        z = 150 * np.clip((y - 300) / 3200, 0, 1)
        tr, cn = round_tree(x, y, z - 20, g.uniform(240, 460), g.uniform(170, 340), 30 + i, 9)
        s3.mesh_from_arrays(f"t{i}", *tr, s3.principled("b2", (.12, .07, .05), .6, .4), index=2)
        s3.mesh_from_arrays(f"c{i}", *cn, s3.principled("l2", (.09 + g.uniform(0, .05), .17 + g.uniform(-.03, .05), .1), .55, .4), index=3)
    s3.sun((-.75, -.25, .55), (1, .83, .6), 4.4, 5)
    s3.passes()
    s3.save(OUT / "st_cg_b.exr")


def cg_c(spp):
    s3.reset(spp=spp)
    s3.world_color((.05, .13, .15), 1)
    F = Frame(50, 104, 1590, 1500)
    F.cam((F.D, 6))
    v, f = field(-4000, 4000, -1000, 11000, 500, 600, lambda x, y: 8 * np.clip((y + 100) / 800, 0, 1) * fbm2(x / 500, y / 500, 7, 3))
    s3.mesh_from_arrays("g", v, f, s3.principled("gr", (.03, .09, .08), .5, .4), index=1)
    g = np.random.default_rng(14)
    parts = []
    for i in range(220):
        y = g.uniform(700, 9000)
        x = g.uniform(-1, 1) * (y + F.D) * .36
        px = 540 + x * F.f / (y + F.D)
        if abs(px - 178) < 26:
            continue
        r = g.uniform(10, 28)
        parts.append(tube([(x, y, -10), (x, y, 1900)], r, r * .7, 24, seg=2))
    v, f = merge(parts)
    s3.mesh_from_arrays("wood", v, f, s3.principled("w", (.02, .1, .11), .36, .5), index=2)
    v, f = tube([(F.wx(372, 60), 60, -10), (F.wx(372, 60), 60, 1900)], 42, 32, 40, seg=2)
    s3.mesh_from_arrays("big", v, f, s3.principled("w2", (.016, .07, .08), .34, .5), index=3)
    e = P.SCENES["c"][0]
    v, f = fig(P.FEAR, F.x(e["ox"]), 0, 2, thick=.22, head=.41)
    s3.mesh_from_arrays("man", v, f, porcelain(), index=5)
    parts = []
    for i in range(600):
        x, y = g.uniform(-1400, 1400), g.uniform(-420, 2200)
        parts.append(sphere((x, y, 0), g.uniform(4, 15), 10, 6, (1, 1, .42)))
    v, f = merge(parts)
    s3.mesh_from_arrays("pb", v, f, s3.principled("p", (.05, .13, .1), .4, .5), index=1)
    Y = 7000
    lx, lz = F.wx(P.LIGHT_C[0], Y), F.wz(P.LIGHT_C[1], Y)
    v, f = sphere((lx, Y, lz), 90)
    s3.mesh_from_arrays("lamp", v, f, s3.emission("gl", (1, .66, .3), 26), index=8)
    l = s3.bpy.data.lights.new("pt", "POINT")
    l.energy, l.color, l.shadow_soft_size = 7e7, (1, .62, .3), 140
    ob = s3.bpy.data.objects.new("pt", l)
    s3.bpy.context.scene.collection.objects.link(ob)
    ob.location = (lx, Y - 250, lz)
    s3.sun((.6, -.5, .7), (.45, .7, .85), 1.1, 12)
    s3.passes()
    s3.save(OUT / "st_cg_c.exr")


if __name__ == "__main__":
    style, scene = sys.argv[1], sys.argv[2]
    spp = int(sys.argv[3]) if len(sys.argv) > 3 else 48
    width = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    fn = globals()[f"{style}_{scene}"]
    if width != 1080:
        old = s3.reset
        def reset(spp=spp, res=None):
            return old((width, int(width * 16 / 9)), spp)
        s3.reset = reset
    fn(spp)
