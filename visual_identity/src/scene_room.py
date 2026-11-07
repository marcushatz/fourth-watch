"""Frames 1 and 4: his bedroom. Same room, same camera; night for RELATE, first light for TRANSFORM.
    python scene_room.py relate|transform [width] [samples]
Writes /home/claude/fw-tools/out/vi_room_<mood>.exr (multi-pass, for look.py)."""
import sys
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import stage_vi as sv  # noqa: E402
from stage_vi import P, box, quad, s3, sheet  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")


def sky_plate(mood, path, w=1600, h=1000):
    """The view through the window, painted: a night city, or the same street before sunrise."""
    r = np.random.default_rng(4)
    y = np.linspace(0, 1, h)[:, None, None]
    if mood == "relate":
        top, low = np.array([.012, .02, .05]), np.array([.05, .07, .13])
    else:
        top, low = np.array([.16, .2, .3]), np.array([.95, .72, .5])
    img = np.broadcast_to(top * (1 - y) + low * y, (h, w, 3)).copy()
    if mood == "relate":
        for _ in range(240):
            cv2.circle(img, (int(r.uniform(0, w)), int(r.uniform(0, h * .55))), 1, (.5, .55, .7), -1)
    skyline = np.zeros(w)
    x = 0
    while x < w:
        bw = int(r.uniform(50, 160))
        skyline[x:x + bw] = r.uniform(.45, .8) * h
        x += bw
    yy = np.arange(h)[:, None]
    mask = yy > skyline[None, :]
    bcol = np.array([.008, .01, .02]) if mood == "relate" else np.array([.12, .1, .12])
    img[mask] = bcol
    for _ in range(420 if mood == "relate" else 70):
        cx, cy = int(r.uniform(0, w)), int(r.uniform(h * .45, h))
        if mask[cy, cx]:
            col = (.9, .7, .35) if r.random() < .7 else (.6, .75, .95)
            cv2.rectangle(img, (cx, cy), (cx + 5, cy + 7), tuple(c * (1 if mood == "relate" else .5) for c in col), -1)
    cv2.imwrite(str(path), (np.clip(img, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8)[..., ::-1])


def build(mood="relate", width=1080, spp=40):
    H = int(width * 16 / 9)
    sc = s3.reset((width, H), spp)
    sc.render.threads = 2
    s3.passes()
    name = "man_relate" if mood == "relate" else "man_transform"
    z0 = sv.floor_z(name)
    M = sv.cast_materials()
    sv.person(name, None, M, "skin_m", "hair", look=(0, .7, -.7) if mood == "relate" else (.05, .55, -.83))
    seat = 1.5
    wood = P("wood", (.09, .055, .035), .55, .25, bump=(.4, .15, .4))
    wall = P("wall", (.33, .33, .35), .92, .1)
    floor = P("floorm", (.12, .085, .06), .6, .3, bump=(.25, .1, .3))
    sheet_m = P("sheetm", (.42, .43, .46), .9, .1)
    duvet = P("duvet", (.16, .19, .26), .95, .1, bump=(1.2, .25, .4))
    # Floor, walls with a window cut into the back wall, and a ceiling.
    box("floor", (0, 0, z0 - 2), (900, 900, 4), floor, 7, bevel=0)
    back_y, wx0, wx1, wz0, wz1 = -165, -10, 110, z0 + 95, z0 + 230
    top = z0 + 280
    for nm, c, s in (("wl", ((-300 + wx0) / 2, back_y, (z0 + top) / 2), (wx0 + 300, 10, top - z0)),
                     ("wr", ((wx1 + 300) / 2, back_y, (z0 + top) / 2), (300 - wx1, 10, top - z0)),
                     ("wb", ((wx0 + wx1) / 2, back_y, (z0 + wz0) / 2), (wx1 - wx0, 10, wz0 - z0)),
                     ("wt", ((wx0 + wx1) / 2, back_y, (wz1 + top) / 2), (wx1 - wx0, 10, top - wz1))):
        box(nm, c, s, wall, 16, bevel=0)
    box("side", (-210, 0, (z0 + top) / 2), (10, 700, top - z0), wall, 16, bevel=0)
    box("ceil", (0, 0, top + 4), (900, 900, 8), wall, 16, bevel=0)
    box("sill", ((wx0 + wx1) / 2, back_y + 8, wz0 - 1), (wx1 - wx0 + 16, 14, 3), wood, 15)
    # Blinds: thin tilted slats, so the outside light falls in stripes.
    slat = P("slat", (.6, .6, .62), .5, .2)
    for i, z in enumerate(np.arange(wz0 + 6, wz1 - 4, 6.5)):
        box(f"slat{i}", ((wx0 + wx1) / 2, back_y + 7, z), (wx1 - wx0 - 4, 4.2, .5), slat, 16, bevel=0, rot=(32 if mood == "relate" else 52, 0, 0))
    plate = OUT / f"vi_sky_{mood}.png"
    sky_plate(mood, plate)
    quad("view", [(-420, -650, z0 - 60), (520, -650, z0 - 60), (520, -650, z0 + 520), (-420, -650, z0 + 520)],
         sv.image_emission("viewm", plate, 1.6 if mood == "relate" else 3.2), 17)
    # The bed: frame, mattress, a rumpled duvet and two pillows.
    box("frame", (0, -78, (z0 + seat - 22) / 2), (212, 170, seat - 22 - z0), wood, 15, bevel=1.5)
    box("mattress", (0, -76, seat - 10), (206, 160, 20), sheet_m, 14, bevel=5, segments=4)
    sheet("duvet", (8, -66, seat + 1.5), (190, 150), duvet, 14, seed=3 if mood == "relate" else 5, bulge=5, folds=2.4, drape=18)
    for i, x in enumerate((-78, -40)):
        box(f"pillow{i}", (x - 6, -130, seat + 7), (46, 30, 12), sheet_m, 14, bevel=6, segments=5, rot=(0, 0, 8 - i * 14))
    # A nightstand with a lamp that is off, a few books and a mug.
    box("stand", (-160, -105, z0 + 30), (50, 44, 60), wood, 15, bevel=1)
    box("lamp_base", (-168, -112, z0 + 63), (12, 12, 6), P("lampb", (.04, .04, .045), .4, .4), 19)
    box("lamp_shade", (-168, -112, z0 + 86), (26, 26, 22), P("shade", (.5, .45, .38), .9, .1), 19, bevel=2)
    for i in range(3):
        box(f"book{i}", (-148, -98, z0 + 62 + i * 3.4), (24 - i * 2, 17, 3.2), P(f"book{i}", ((.25, .08, .05), (.06, .12, .2), (.4, .35, .25))[i], .8, .1), 19, bevel=.3, rot=(0, 0, i * 7 - 5))
    # A sweatshirt-grey hoodie thrown over the end of the bed, and shoes on the floor.
    sheet("hoodie", (86, -40, seat + 6), (40, 52), P("hood", (.2, .07, .06), .95, .1), 11, seed=8, bulge=4, folds=3, n=(18, 18))
    for i, (x, y) in enumerate(((66, 58), (82, 70))):
        box(f"shoe{i}", (x, y, z0 + 4.5), (11, 28, 9), P(f"shoe{i}", (.07, .07, .08), .7, .2), 19, bevel=3, rot=(0, 0, -28 - i * 12))
    # The phone.
    if mood == "relate":
        pc = np.array([6.0, 56.0, z0 + .5])
        box("phone", tuple(pc), (7.4, 15.4, .8), P("phb", (.01, .01, .012), .3, .5), 19, bevel=.6, rot=(0, 0, 24))
        a = np.radians(24)
        R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])
        cs = [pc[:2] + R @ np.array(p) for p in ((-3.3, -7.2), (3.3, -7.2), (3.3, 7.2), (-3.3, 7.2))]
        quad("screen", [(c[0], c[1], pc[2] + .45) for c in cs], s3.emission("scr", (.62, .78, 1), 18), 18, uv=False)
    else:
        pc = np.load(sv.ASSETS / "vi_man_transform_phone.npz")["c"]
        box("phone", tuple(pc), (7.4, 15.4, .8), P("phb", (.01, .01, .012), .3, .5), 19, bevel=.6, rot=(-38, 0, 0))
        n = np.array([0, -np.sin(np.radians(38)), np.cos(np.radians(38))])
        u = np.array([1.0, 0, 0])
        v = np.cross(n, u)
        c = pc + n * .45
        quad("screen", [c - u * 3.3 - v * 7.2, c + u * 3.3 - v * 7.2, c + u * 3.3 + v * 7.2, c - u * 3.3 + v * 7.2], s3.emission("scr", (.75, .82, 1), 5), 18, uv=False)
    # Light.
    if mood == "relate":
        s3.world_color((.006, .009, .02), 1.0)
        s3.sun((.28, -1, .62), (.5, .64, 1.0), 5.0, angle=1.2)
        s3.area((60, -150, z0 + 160), (0, 0, 10), (.45, .58, 1), 3000, 90)
    else:
        s3.world_color((.02, .02, .025), 1.0)
        s3.sun((.42, -1, .34), (1, .8, .6), 7.5, angle=1.0)
        s3.area((60, -150, z0 + 160), (0, 0, 10), (1, .84, .68), 22000, 110)
        s3.area((-80, 160, 120), (0, 0, 20), (.55, .62, .8), 1500, 120)
        s3.area((-130, 150, z0 + 170), (0, 0, z0 + 80), (1, .8, .62), 9000, 120)
    s3.camera((-52, 206, z0 + 46), (4, -30, z0 + 100), lens=31, dof=(215, 5.6))
    s3.save(OUT / f"vi_room_{mood}")


if __name__ == "__main__":
    a = sys.argv
    build(a[1] if len(a) > 1 else "relate", int(a[2]) if len(a) > 2 else 1080, int(a[3]) if len(a) > 3 else 40)
