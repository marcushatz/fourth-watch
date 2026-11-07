"""Frame 2: Adam and Eve hiding among the trees (Genesis 3:8). They have sewn fig leaves (3:7); they have heard the sound of the
LORD God walking in the garden in the cool of the day, and they hide. God is never shown: only a warm light far off among the trees.
    python scene_eden.py [width] [samples] [plate]
'plate' renders the same garden without the two of them, for frame 3. Writes /home/claude/fw-tools/out/vi_eden[_plate].exr"""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import stage_vi as sv  # noqa: E402
from stage_vi import P, s3  # noqa: E402
from scene_s26 import scatter_leaves, trunk_mesh  # noqa: E402
from scene_s13 import blob, merge  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")


def build(width=1080, spp=40, plate=False):
    H = int(width * 16 / 9)
    sc = s3.reset((width, H), spp)
    sc.render.threads = 2
    s3.passes()
    z0 = sv.floor_z("adam")
    M = sv.cast_materials()
    bark = P("bark", (.06, .045, .035), .85, bump=(.08, 1.2, 3))
    bark_far = P("bark_far", (.05, .05, .055), .9, bump=(.05, .8, 3))
    leaf = P("leaf", (.03, .075, .035), .5, .35)
    leaf_dark = P("leaf_d", (.012, .03, .018), .6, .2)
    ground = P("ground", (.03, .035, .02), .95, .05)
    # The great trunk they hide against, its roots spreading into the ground.
    TX, TY, TR = -8.0, -84.0, 64.0
    V, F = trunk_mesh(TX, TY, TR, h=1400, seed=7, n=36, rows=60)
    V[:, 2] += z0 + 60
    s3.mesh_from_arrays("trunk", V, F, bark, index=6)
    roots = [blob((TX + TR * np.cos(a) * .95, TY + TR * np.sin(a) * .95, z0 + 6), (34, 14, 12), 50 + i, 18, .4)
             for i, a in enumerate(np.linspace(0, 2 * np.pi, 7, endpoint=False) + .3)]
    s3.mesh_from_arrays("roots", *merge(roots), bark, index=6)
    if not plate:
        ya = float(np.load(sv.ASSETS / "vi_adam_body.npz")["v"][:, 1][np.unique(np.load(sv.ASSETS / "vi_adam_body.npz")["f"])].min())
        ye = float(np.load(sv.ASSETS / "vi_eve_body.npz")["v"][:, 1][np.unique(np.load(sv.ASSETS / "vi_eve_body.npz")["f"])].min())
        front = TY + TR
        sv.person("adam", s3.matrix(loc=(34, front - ya + 1.5 - 6, 0), rot=(0, 0, 6)), M, "skin_a", "hair", look=(.75, .62, .05))
        sv.person("eve", s3.matrix(loc=(-30, front - ye + 4 - 9, -z0 * 0 + 1.5 + (sv.floor_z("adam") - sv.floor_z("eve"))), rot=(0, 0, 14)), M, "skin_e", "hair_e",
                  look=(.8, .58, .05))
    # The garden in depth, with a clear line of sight to the light.
    r = np.random.default_rng(11)
    Vs, Fs, off = [], [], 0
    LX, LY = 470.0, -1500.0
    for i in range(170):
        y = -360 - r.random() ** 1.3 * 3400
        x = r.uniform(-1, 1) * (500 + abs(y) * .7)
        t = (y - 0) / LY
        if abs(x - LX * t) < 70 + 40 * t and 0 < t < 1.1:
            continue
        V, F = trunk_mesh(x, y, r.uniform(10, 30) * (1 + abs(y) / 2200), h=1600, seed=100 + i)
        V[:, 2] += z0 + 60
        Vs.append(V)
        Fs.append(F + off)
        off += len(V)
    s3.mesh_from_arrays("trunks", np.vstack(Vs), np.vstack(Fs), bark_far, index=6)
    crowns = []
    for i in range(46):
        y = r.uniform(-3200, -300)
        x = r.uniform(-1.2, 1.2) * (500 + abs(y) * .7)
        rr = r.uniform(220, 420) * (1 + abs(y) / 2600)
        crowns.append(blob((x, y, z0 + r.uniform(820, 1400)), (rr, rr * .8, rr * .5), 200 + i, 22))
    crowns.append(blob((TX - 60, TY, z0 + 900), (420, 300, 160), 300, 26))
    s3.mesh_from_arrays("canopy", *merge(crowns), leaf_dark, index=5)
    g = np.array([[-9000, -9000, z0 - .5], [9000, -9000, z0 - .5], [9000, 3000, z0 - .5], [-9000, 3000, z0 - .5]], float)
    s3.mesh_from_arrays("ground", g, np.array([[0, 1, 2, 3]]), ground, index=7, smooth=False)
    # Undergrowth up to their knees, broad leaves at the lens, and ferns around the roots.
    V, F = scatter_leaves(900, ((-260, -40, z0 - 4), (260, 170, z0 + 52)), (14, 30), 5)
    s3.mesh_from_arrays("under", V, F, leaf, index=5)
    V, F = scatter_leaves(260, ((-600, -900, z0 - 4), (700, -150, z0 + 70)), (24, 48), 6)
    s3.mesh_from_arrays("under_far", V, F, leaf_dark, index=5)
    V, F = scatter_leaves(70, ((-120, 210, z0 + 10), (110, 250, z0 + 70)), (36, 60), 9, keep=lambda v: (np.abs(v[:, 0]) > 34).all())
    s3.mesh_from_arrays("near", V, F, leaf_dark, index=5)
    V, F = scatter_leaves(60, ((-140, 120, z0 + 240), (140, 200, z0 + 330)), (30, 54), 10, keep=lambda v: (np.abs(v[:, 0]) > 60).all())
    s3.mesh_from_arrays("near_top", V, F, leaf_dark, index=5)
    # The light: warm and far off, low among the trees. Gold is kept for this alone.
    s3.mesh_from_arrays("glow", *blob((LX, LY, z0 + 95), (26, 26, 60), 400, 24, .2), s3.emission("gold", (1, .66, .3), 10), index=8)
    s3.area((LX * .45, LY * .2, z0 + 150), (20, 0, z0 + 130), (1, .64, .3), 1100000, 90)
    # The cool of the day: a blue dusk from above, and a soft fill from our side.
    s3.world_color((.03, .05, .09), 1.0)
    s3.sun((-.35, .55, .75), (.55, .68, 1), .9, angle=8)
    s3.area((-180, 320, z0 + 260), (0, -60, z0 + 120), (.55, .68, 1), 50000, 160)
    s3.camera((-2, 262, z0 + 96), (0, -40, z0 + 126), lens=34, dof=(270, 4.0))
    s3.save(OUT / ("vi_eden_plate" if plate else "vi_eden"))


if __name__ == "__main__":
    a = sys.argv
    build(int(a[1]) if len(a) > 1 else 1080, int(a[2]) if len(a) > 2 else 40, plate=len(a) > 3 and a[3] == "plate")
