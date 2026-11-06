"""Shot 2 in 3D: one small person on a hill under a huge sky. Stars are added afterwards. Run: python scene_s02.py [width] [samples] [beauty|gbuf]"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import stage3d as s3
from scene_s26 import scatter_leaves

OUT = "/home/claude/fw-tools/out"


def fbm2(x, y, seed, oct=6, ridged=False):
    g = np.random.default_rng(seed)
    out, a, f = 0, 1, 1
    for i in range(oct):
        ph = g.uniform(0, 100, 4)
        th = g.uniform(0, 6.28)
        u = (x * np.cos(th) - y * np.sin(th)) * f + ph[0]
        v = (x * np.sin(th) + y * np.cos(th)) * f + ph[1]
        n = np.sin(u) * np.cos(v * .8 + np.sin(u * .5 + ph[2]))
        out = out + (1 - np.abs(n) * 1.6 if ridged else n) * a
        a *= .5
        f *= 2.03
    return out


def field(x0, x1, y0, y1, nx, ny, hfn):
    x, y = np.meshgrid(np.linspace(x0, x1, nx), np.linspace(y0, y1, ny), indexing="ij")
    z = hfn(x, y)
    V = np.stack([x, y, z], -1).reshape(-1, 3)
    i, j = np.meshgrid(np.arange(nx - 1), np.arange(ny - 1), indexing="ij")
    a = (i * ny + j).ravel()
    return V, np.c_[a, a + ny, a + ny + 1, a + 1]


def person_mesh():
    from human import Human
    X = (1, 0, 0)
    h = Human(False, race=(.45, .3, .25), muscle=.55, weight=.3)
    v = h.pose({"neck02": ("rot", X, 10), "neck03": ("rot", X, 10), "head": ("rot", X, 12), "upperarm01.L": ("aim", (-.12, 0, -.99)), "upperarm01.R": ("aim", (.12, 0, -.99)),
                "lowerarm01.L": ("aim", (-.06, .04, -.99)), "lowerarm01.R": ("aim", (.06, .04, -.99))})
    return v, h.body


def build(width=1080, spp=40, kind="beauty"):
    H = int(width * 16 / 9)
    s = s3.reset((width, H), spp)
    s3.world_color((.012, .02, .04), 1)
    s3.passes()
    P = s3.principled
    rock = P("rock", (.2, .24, .32), .85, .1)
    rock2 = P("rock2", (.11, .14, .2), .85, .1)
    hill = P("hill", (.018, .024, .03), .9, .1)
    cloth = P("cloth", (.2, .15, .11), .85, .1)
    def ridge(seed, hgt, base, scale):
        return lambda x, y: base + hgt * np.clip(fbm2(x / scale, y / scale, seed, 7, True) * .55, -.3, 2) * np.clip((y - 2800) / 3000, .2, 1)
    s3.mesh_from_arrays("range1", *field(-24000, 24000, 16000, 30000, 700, 240, ridge(3, 5200, -300, 5200)), rock, index=6)
    s3.mesh_from_arrays("range2", *field(-16000, 16000, 8000, 16000, 600, 200, ridge(5, 2500, -420, 3100)), rock2, index=6)
    s3.mesh_from_arrays("range3", *field(-9000, 9000, 3800, 8000, 500, 160, ridge(8, 1150, -480, 1900)), rock2, index=6)
    def hfn(x, y):
        return 95 * np.exp(-(((x - 30) / 900) ** 2 + ((y - 200) / 420) ** 2)) - 130 + 28 * fbm2(x / 320, y / 320, 2, 4) * np.exp(-((y - 200) / 900) ** 2) - np.clip(y - 700, 0, None) * .08
    s3.mesh_from_arrays("hill", *field(-6000, 6000, -2700, 4200, 500, 340, hfn), hill, index=7)
    v, f = person_mesh()
    zf = float(hfn(np.array([30.0]), np.array([200.0]))[0])
    low = v[:13380 + 0, 2].min() if False else v[h_body(f), 2].min()
    k = .78 if kind.startswith("refined") else 1
    M = s3.matrix(loc=(30, 200, zf - low * k), scale=k)
    ob = s3.mesh_from_arrays("person", v, f, cloth, M, index=1)
    r = np.random.default_rng(6)
    parts_v, parts_f, off = [], [], 0
    for i in range(5000):
        x, y = r.uniform(-700, 760), r.uniform(120, 330)
        if abs(x - 30) < 40 and abs(y - 200) < 40:
            continue
        z = float(hfn(np.array([x]), np.array([y]))[0])
        l, a = r.uniform(10, 26), r.uniform(0, 6.28)
        b = np.array([[x - 1.2, y, z - 3], [x + 1.2, y, z - 3], [x + np.cos(a) * 7, y + np.sin(a) * 7, z + l]])
        parts_v.append(b)
        parts_f.append([off, off + 1, off + 2, off + 2])
        off += 3
    s3.mesh_from_arrays("tufts", np.vstack(parts_v), np.array(parts_f), hill, index=7, smooth=False)
    s3.camera((30, -2300, 30), (30, 0, 690), lens=35)
    if kind in ("gbuf", "refined_gbuf"):
        s.cycles.use_denoising = False
    s3.sun((.1, 1, .16), (.5, .66, 1), 1.6, angle=6)
    s3.sun((-.5, -.3, .6), (.5, .62, 1), .22, angle=20)
    if kind == "low":
        from scene_s13 import lowpoly_pass
        lowpoly_pass()
    s3.save(f"{OUT}/s02_{kind}")


def h_body(f):
    return np.unique(f.ravel())


if __name__ == "__main__":
    a = sys.argv
    build(int(a[1]) if len(a) > 1 else 1080, int(a[2]) if len(a) > 2 else 40, a[3] if len(a) > 3 else "beauty")
