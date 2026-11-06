#!/usr/bin/env python3
"""Side-by-side test, Version A: shots 2, 13 and 26 in code-drawn cut paper. Stills only, no video, no credits.

    python3 ep11-beginning/style_test/side_by_side/build_side_by_side.py [--only s02,s13,s26]
"""
import argparse
from pathlib import Path

import cv2
import numpy as np

from figures import beard, finger, hair_f_top, hair_m, head, lips
from paper_stage import H, W, XX, YY, Stage, curve, fbm, hexc, place, raster, ribbon, shift, torn

OUT = Path(__file__).resolve().parent / "A"


def ribbon_mask(pts, widths, cap=True):
    return raster(ribbon(pts, widths, cap=cap))


def mix(a, b, t):
    return a[..., :] * (1 - t[..., None]) + b * t[..., None]


def sky(top, bottom, y0=0, y1=H):
    t = np.clip((YY - y0) / (y1 - y0), 0, 1)
    return mix(np.broadcast_to(hexc(top), (H, W, 3)), hexc(bottom), t)


def ridge(seed, y, amp, cell, slope=0):
    """A land sheet whose top edge is a long, uneven ridge."""
    line = y + (fbm(seed, cell, 4)[H // 2:H // 2 + 1, :] - .5) * 2 * amp + slope * (np.arange(W) - W / 2) / W
    return np.clip((YY - line) / 1.2 + .5, 0, 1)


def person(x, y, h, turn=0):
    """A tiny adult seen from behind, about seven heads tall, head lifted."""
    u = h / 7.2
    def p(a, b):
        return (x + a * u, y - (7.2 - b) * u)
    body = curve([p(-.34, 1.2), p(-.98, 1.72), p(-1.06, 2.2), p(-1.08, 3.2), p(-1.0, 3.9), p(-.72, 3.98), p(-.66, 3.1), p(-.74, 3.9),
                  p(-.82, 5.0), p(-.7, 6.2), p(-.72, 7.2, ), p(-.26, 7.2), p(-.14, 5.4), p(0, 4.5), p(.14, 5.4), p(.26, 7.2), p(.72, 7.2),
                  p(.7, 6.2), p(.82, 5.0), p(.74, 3.9), p(.66, 3.1), p(.72, 3.98), p(1.0, 3.9), p(1.08, 3.2), p(1.06, 2.2), p(.98, 1.72), p(.34, 1.2)], n=6)
    neck = curve([p(-.25, .86), p(.25, .86), p(.32, 1.36), p(-.32, 1.36)], n=6)
    head = curve([p(.02, -.02), p(.42, .22), p(.46, .62), p(.3, .96), p(.02, 1.08), p(-.3, .96), p(-.46, .62), p(-.42, .22)], n=6)
    return raster(body), raster(neck), raster(head)


def jag(seed, y, height, step=150, centre=None):
    """A mountain line cut with scissors: long straight runs, sharp peaks, small nicks."""
    r = np.random.default_rng(seed)
    xs = np.arange(0, W + step * 2, step) - step / 2 + r.uniform(-step * .3, step * .3, len(np.arange(0, W + step * 2, step)))
    ys = -r.random(len(xs)) ** 1.5 * height
    if centre is not None:
        ys = ys * (.5 + .9 * np.exp(-((xs - centre) / 420) ** 2))
    line = np.interp(np.arange(W), xs, ys)
    xs2 = np.arange(0, W + 60, 44) + r.uniform(-16, 16, len(np.arange(0, W + 60, 44)))
    line = line + np.interp(np.arange(W), xs2, r.normal(0, height * .055, len(xs2)))
    xs3 = np.arange(0, W + 20, 13.0)
    line = line + np.interp(np.arange(W), xs3, r.normal(0, height * .012 + .6, len(xs3)))
    return y + line


def s02():
    light = np.exp(-(((XX - 540) / 760) ** 2 + ((YY - 1380) / 500) ** 2))
    key = .3 + light * .85
    st = Stage(sky("#070b16", "#17233a", 0, 1380), light=(.08, .72, .69), key=key, ambient=.3, key_gain=.7, key_color="#cfdcf2",
               shadow="#070a12", shadow_power=.66, soft=.3, seed=2)
    # The sky is stacked dark sheets with light behind them, so every star is a pinhole.
    r = np.random.default_rng(11)
    across = (XX - 120 - (1340 - YY) * .66) / 270
    band = np.exp(-across ** 2)
    n = fbm(21, 300, 5, stretch=(1, 2.6))
    M = cv2.getRotationMatrix2D((W / 2, H / 2), -33, 1.5)
    streak = cv2.warpAffine(n, M, (W, H), borderMode=cv2.BORDER_REFLECT)
    shape = band * .95 + (streak - .5) * 1.5
    for lv, col, z in ((.3, "#0e1629", 2), (.5, "#142038", 4), (.68, "#1c2b45", 6), (.84, "#273955", 8), (.98, "#344a69", 10)):
        st.sheet((shape > lv).astype(np.float32), col, z, tear=(4, 30), kind="washi", curl=1.2, shadow=.55, edge=.05)
    pin = np.zeros((H, W), np.float32)
    def holes(n, rad, gain, weight):
        for _ in range(n):
            x, y = r.uniform(0, W), r.uniform(0, 1300)
            if weight and r.random() > .16 + .84 * float(band[int(y), int(x)]) ** .8:
                continue
            cv2.circle(pin, (int(x * 8), int(y * 8)), int(r.uniform(*rad) * 8), float(r.uniform(*gain)), -1, cv2.LINE_AA, 3)
    holes(7000, (.55, .95), (.16, .6), True)
    holes(520, (1.0, 1.5), (.45, .9), True)
    holes(34, (1.9, 2.8), (.9, 1.2), False)
    pin = cv2.GaussianBlur(pin, (0, 0), .5)
    st.img = st.img * (1 - cv2.GaussianBlur(pin, (0, 0), 2.6)[..., None] * .3) + pin[..., None] * hexc("#eaf0ff") * 1.35
    st.glow("#7288ad", np.exp(-(((YY - 1250) / 170) ** 2)) * (.16 + .34 * np.exp(-((XX - 560) / 560) ** 2)))
    # Mountains stepping out of the cold haze. Each range is darkest at its ridge and sinks into mist.
    layers = [(61, 1250, 330, 170, "#46597b", 8, "#62789a", 620), (66, 1326, 196, 190, "#3a4c6b", 14, "#5a6f90", 300), (73, 1380, 118, 230, "#2c3a56", 22, "#4f6383", 860),
              (78, 1430, 66, 250, "#202b42", 32, "#435674", 200)]
    for i, (sd, y, hgt, step, col, z, fr, c) in enumerate(layers):
        line = jag(sd, y, hgt, step, c)
        st.sheet(np.clip((YY - line) / 1.2 + .5, 0, 1), col, z, tear=(1.6, 8), fringe=fr, kind="washi", curl=1.4, shadow=.9, edge=.1)
        st.haze("#7a92b6", np.clip((YY - (y - hgt * .42)) / (hgt * 1.5 + 90), 0, 1) ** 1.5 * .62)
    # The near hill. Its crest is clean and dark, so the small figure reads against the pale land behind.
    crest = 1560 - 118 * np.exp(-((np.arange(W) - 560) / 330) ** 2) + (fbm(35, 150, 4)[900:901, :] - .5) * 34
    hill = np.clip((YY - crest) / 1.2 + .5, 0, 1)
    st.sheet(hill, "#0d1320", 46, tear=(2.5, 10), fringe="#34435c", kind="washi", curl=2, shadow=1)
    x, y = 560, float(crest[0, 560]) + 6
    body, neck, head = person(x, y, 118)
    st.sheet(neck, "#3b3430", 58, kind="smooth", curl=0, shadow=.8, edge=.08)
    st.sheet(body, "#3f3833", 60, kind="smooth", curl=0, shadow=.8, edge=.08, rim=("#97abc9", 1.8, .12, (0, 1)))
    st.sheet(head, "#1f1a18", 62, kind="smooth", curl=0, shadow=.6, edge=.08, rim=("#97abc9", 1.8, .1, (0, 1)))
    g = np.random.default_rng(5)
    tufts, blades = [], []
    for _ in range(300):
        bx = g.uniform(-20, W + 20)
        if abs(bx - x) < 42:
            continue
        by, l = float(crest[0, int(np.clip(bx, 0, W - 1))]) + 8, g.uniform(7, 22)
        tufts.append(ribbon([(bx, by), (bx + g.uniform(-4, 4), by - l * .6), (bx + g.uniform(-13, 13), by - l)], [3, 2, .4], cap=False))
    st.sheet(raster(*tufts), "#0c111c", 50, curl=0, kind="smooth", shadow=.4, edge=.05)
    for _ in range(90):
        bx, by, l = g.uniform(-30, W + 30), g.uniform(1800, 1990), g.uniform(110, 260)
        lean = g.uniform(-80, 80)
        blades.append(ribbon([(bx, by), (bx + lean * .3, by - l * .55), (bx + lean, by - l)], [16, 10, 1.4], cap=False))
    st.sheet(raster(*blades), "#0e1420", 92, dof=4, curl=0, kind="smooth", shadow=.5, edge=0)
    return st.finish(bloom=.3, thresh=.55, vignette=.24, grain=.01, seed=2)


EVE = dict(light="#c9a084", mid="#ae866a", dark="#7c5b49", cheek="#bb9276", torso="#94705a", line="#2a1a14", white="#c4b49e", hair="#281b15", hair2="#3d2b20", lip="#84574a", lip2="#976556")
ADAM = dict(light="#b78b6c", mid="#99714f", dark="#694936", cheek="#a67d5c", torso="#7e5a41", line="#24160f", white="#bcab95", hair="#20160f", hair2="#332418", lip="#7a4c3e", lip2="#885a49")
COLD = dict(light="#8d8187", mid="#6a6067", dark="#3b3746", cheek="#7a6f76", line="#100f18", white="#7f7f8c", hair="#12121a", hair2="#23252f", lip="#574a54", lip2="#62555e")


def blob(seed, cx, cy, rx, ry, rough=1.3, cell=170):
    return (((XX - cx) / rx) ** 2 + ((YY - cy) / ry) ** 2 + (fbm(seed, cell, 5) - .5) * rough * 2 < 1).astype(np.float32)


def canopy(seed, cx, cy, rx, ry, n=30):
    """A tree crown from overlapping scallops, so it can't read as a map."""
    r = np.random.default_rng(seed)
    polys = [curve([(cx + rx * .8 * np.cos(a), cy + ry * .8 * np.sin(a)) for a in np.linspace(0, 6.1, 14)], n=4)]
    for _ in range(n):
        a, k = r.uniform(0, 6.283), r.uniform(.62, .92)
        x, y, q = cx + rx * k * np.cos(a), cy + ry * k * np.sin(a), r.uniform(.2, .36) * rx
        polys.append(curve([(x + q * np.cos(b), y + q * .86 * np.sin(b)) for b in np.linspace(0, 6.1, 12)], n=4))
    return raster(*polys)


def leaf(x, y, l, a, wide=.34):
    return place(curve([(0, 0, 1), (.28, -wide * .5), (.68, -wide * .4), (1, 0, 1), (.68, wide * .4), (.28, wide * .5)], n=6), s=l, a=a, o=(x, y))


def rib(x, y, l, a):
    return place(ribbon([(.03, 0), (.5, 0), (.94, 0)], [.014, .01, .002], cap=False), s=l, a=a, o=(x, y))


def foliage(st, seed, boxes, n, size, colors, z, groups=5, spin=(0, 360), rib_color=None, **kw):
    """Leaves in small sheets, so each group truly lies over the one before."""
    r = np.random.default_rng(seed)
    items = []
    for x0, y0, x1, y1 in boxes:
        for _ in range(n):
            items.append((r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(*size), r.uniform(*spin)))
    r.shuffle(items)
    for g in range(groups):
        chunk = items[g::groups]
        c = colors[g % len(colors)]
        m = st.sheet(raster(*[leaf(*i) for i in chunk]), c, z + g * 1.6, kind="washi", **kw)
        if rib_color:
            st.sheet(raster(*[rib(*i) for i in chunk]) * m, rib_color, z + g * 1.6 + .2, shadow=0, curl=0, edge=0, kind="smooth", opacity=.75)


def plane(st, pts, color, z, shadow=.6, edge=.08, kind="smooth", curl=0, n=8, mask=None):
    m = raster(curve(pts, n=n))
    return st.sheet(m if mask is None else m * mask, color, z, kind=kind, curl=curl, edge=edge, shadow=shadow)


def limb(st, pts, widths, pal, z, offset=(-8, -14)):
    """An arm: one sheet with a tapered, quiet lit plane along the side that faces the light."""
    m = st.sheet(raster(ribbon(pts, widths)), pal["mid"], z, kind="smooth", curl=3, edge=.1)
    hi = [(x + offset[0], y + offset[1]) for x, y in pts]
    w = max(widths)
    st.sheet(raster(ribbon(hi, [w * .06, w * .34, w * .05], cap=False)) * m, pal["cheek"], z + 1, kind="smooth", shadow=.2, edge=.03)
    return m


def fruit_piece(st, c, r, z, base="#713127", lit="#8d4733", dark="#4e231e", mask_only=False):
    pts = [(c[0] + r * (1 + .05 * np.cos(a * 2)) * np.cos(a), c[1] + r * (1.05 - .04 * np.sin(a)) * np.sin(a)) for a in np.linspace(0, 6.1, 18)]
    m = st.sheet(raster(curve(pts, n=6)), base, z, kind="smooth", curl=3)
    plane(st, [(c[0] + r * .2, c[1] + r * .96), (c[0] + r * .84, c[1] + r * .5), (c[0] + r * .98, c[1] - r * .1), (c[0] + r * .5, c[1] + r * .24), (c[0] - r * .1, c[1] + r * .6)], dark, z + .6, shadow=.2, edge=.03, mask=m)
    plane(st, [(c[0] - r * .68, c[1] - r * .1), (c[0] - r * .36, c[1] - r * .62), (c[0] + r * .16, c[1] - r * .78), (c[0] - r * .08, c[1] - r * .34), (c[0] - r * .34, c[1] + r * .16)], lit, z + 1, shadow=.25, edge=.05, mask=m)
    return m


def s13():
    pool = np.exp(-(((XX - 560) / 560) ** 2 + ((YY - 900) / 800) ** 2))
    key = .28 + pool * .8
    st = Stage(sky("#cfc3a6", "#bdba9b"), light=(-.22, -.72, .66), key=key, ambient=.4, key_gain=.76, key_color="#ffeed4", shadow="#2f2a22", shadow_power=.6, soft=.3, seed=13)
    st.glow("#ffefcf", np.exp(-(((XX - 540) / 300) ** 2 + ((YY - 860) / 360) ** 2)) * .12)
    for x, w, col in ((150, 40, "#a9a68c"), (930, 46, "#a3a287")):
        st.sheet(raster(ribbon([(x, 1700), (x + 12, 1100), (x - 8, 640)], [w * 1.3, w, w * .8], cap=False)), col, 5, kind="bark", tear=(1.5, 10), shadow=.5)
    for sd, cx, cy, rx, ry, col, z in ((6, 560, 420, 300, 210, "#bfc0a3", 6), (1, 60, 840, 400, 300, "#aab093", 7), (2, 1040, 640, 400, 340, "#a3ab8d", 9)):
        st.sheet(canopy(sd, cx, cy, rx, ry), col, z, tear=(3, 20), kind="washi", curl=1.6, shadow=.55)
    st.haze("#e7dabb", np.clip((YY - 240) / 620, 0, 1) * .34)
    for sd, cx, cy, rx, ry, col, z in ((3, 10, 1190, 330, 300, "#84926f", 20), (4, 1080, 1020, 300, 400, "#7b8c6a", 22), (5, 540, 1640, 760, 330, "#6f8160", 24)):
        st.sheet(canopy(sd, cx, cy, rx, ry), col, z, tear=(3, 18), kind="washi", curl=1.8, shadow=.7)
    st.haze("#e4d8ba", np.clip((YY - 880) / 640, 0, 1) * .16)
    # The forbidden tree's limb and leaves close the top of the frame. One fruit hangs in the light.
    foliage(st, 30, [(-60, -80, 1140, 140)], 40, (130, 220), ["#62785a", "#6d8263", "#587055"], 30, groups=5, curl=2, shadow=.8)
    st.sheet(raster(ribbon([(1140, 236), (820, 128), (470, 150), (160, 46), (-60, 36)], [116, 84, 60, 42, 30], cap=False)), "#43362b", 40, kind="bark", tear=(2, 12), shadow=1)
    foliage(st, 31, [(-60, -80, 1140, 190), (660, 120, 1140, 360), (-60, 60, 300, 270)], 26, (140, 240), ["#3b5240", "#45594a", "#34493a"], 44, groups=6, curl=2.4, shadow=1, rib_color="#27382c")
    st.sheet(raster(ribbon([(700, 170), (706, 232), (704, 268)], [9, 7, 6], cap=False)), "#3b2e24", 52, kind="smooth", curl=0, shadow=.7)
    fruit_piece(st, (704, 314), 46, 53)
    # Eve, left, facing right. Her hair falls over her shoulder.
    st.sheet(raster(curve([(170, 880), (60, 1000), (20, 1300), (-30, 1620), (-40, 2000), (340, 2000), (330, 1500), (250, 1250), (260, 1000)], n=8)), EVE["hair"], 58, kind="matte", curl=0, edge=.08, shadow=.9)
    plane(st, [(96, 1100), (48, 1210), (32, 1500), (28, 1960), (360, 1960), (360, 1560), (372, 1390), (336, 1250), (292, 1160), (262, 1110)], EVE["torso"], 62, curl=2, shadow=1)
    plane(st, [(138, 930), (128, 1050), (112, 1112), (262, 1132), (258, 1064), (262, 1000)], EVE["dark"], 64, shadow=.8)
    limb(st, [(150, 1200), (226, 1340), (270, 1436)], [132, 114, 96], EVE, 66, (-4, -14))
    r = np.random.default_rng(3)
    hair = []
    for i in range(10):
        x0 = 30 + i * 13 + r.uniform(-5, 5)
        hair.append(ribbon([(x0 + 40, 870), (x0 - 12 + i * 2.2, 1100), (x0 - 4 + i * 4, 1330), (x0 - 10 + i * 5, 1540 + r.uniform(-120, 30))], [34, 40, 30, 3], cap=False))
    m = st.sheet(raster(*hair), EVE["hair"], 68, kind="matte", curl=0, edge=.08, shadow=1)
    st.sheet(raster(*[ribbon([(56 + i * 22, 900), (46 + i * 24, 1120), (52 + i * 27, 1340), (48 + i * 29, 1470)], [6, 15, 11, 2], cap=False) for i in range(5)]) * m, EVE["hair2"], 69, kind="matte", curl=0, edge=.05, shadow=.4)
    t = head(st, 372, (205, 1000), angle=11, female=True, pal=EVE, eye="down", z=70)
    lips(st, t, EVE, 79)
    hair_f_top(st, t, EVE, 82)
    # Adam, right, facing left and a little taller.
    plane(st, [(1000, 980), (1090, 1050), (1120, 1300), (1130, 1960), (720, 1960), (716, 1560), (736, 1380), (780, 1200), (812, 1100), (838, 1050)], ADAM["torso"], 60, curl=2, shadow=1)
    plane(st, [(976, 860), (990, 960), (1010, 1040), (820, 1062), (838, 1000), (838, 930)], ADAM["dark"], 62, shadow=.8)
    t = head(st, 402, (894, 930), angle=-9, flip=True, pal=ADAM, eye="down", z=70)
    beard(st, t, ADAM, 78)
    hair_m(st, t, ADAM, 82)
    # The near arms carry the action. Eve holds the fruit up, and Adam's hand closes on it.
    F, R = (548, 1148), 94
    for pts, w in (([(556, 1312), (626, 1318), (676, 1292), (694, 1254)], 30), ([(556, 1296), (624, 1298), (672, 1266), (686, 1224)], 33)):
        finger(st, pts, w, EVE, 93, tone="dark", shadow=.6)
    fruit_piece(st, F, R, 95)
    limb(st, [(262, 1442), (346, 1372), (430, 1296)], [100, 88, 70], EVE, 97, (-6, -13))
    plane(st, [(408, 1262), (470, 1244), (536, 1258), (598, 1270), (612, 1294), (560, 1326), (470, 1336), (408, 1328)], EVE["mid"], 99, shadow=.8, edge=.1)
    plane(st, [(424, 1272), (488, 1262), (566, 1282), (486, 1296)], EVE["cheek"], 99.6, shadow=.2, edge=.04)
    finger(st, [(548, 1288), (604, 1282), (642, 1250), (650, 1208)], 34, EVE, 100, tone="mid")
    finger(st, [(444, 1276), (476, 1238), (492, 1200), (497, 1172)], 42, EVE, 101, tone="light")
    limb(st, [(992, 1130), (950, 1250), (926, 1356)], [140, 122, 104], ADAM, 92, (8, -14))
    limb(st, [(934, 1362), (872, 1236), (806, 1118)], [108, 94, 78], ADAM, 97, (10, -13))
    plane(st, [(812, 1058), (708, 1048), (690, 1112), (676, 1176), (716, 1204), (812, 1168)], ADAM["mid"], 99, shadow=.8, edge=.1)
    plane(st, [(790, 1074), (720, 1066), (704, 1116), (764, 1120)], ADAM["cheek"], 99.6, shadow=.2, edge=.04)
    for pts, w, tone, z in (([(692, 1168), (650, 1176), (618, 1190), (600, 1214)], 27, "dark", 100), ([(702, 1136), (646, 1140), (600, 1158), (572, 1190)], 31, "mid", 101),
                            ([(706, 1102), (640, 1100), (590, 1120), (556, 1154)], 34, "mid", 102), ([(704, 1066), (640, 1056), (590, 1076), (560, 1112)], 34, "light", 103)):
        finger(st, pts, w, ADAM, z, tone=tone)
    # Foreground leaves keep the frame modest and put us inside the garden.
    st.sheet(canopy(44, 540, 1860, 900, 260, n=44), "#2d4335", 112, kind="washi", curl=2, shadow=.9, tear=(3, 16))
    foliage(st, 40, [(-60, 1540, 1140, 1960)], 30, (240, 380), ["#3e5843", "#46604a", "#35503d"], 120, groups=6, spin=(200, 340), curl=3, shadow=1, rib_color="#2a3e30")
    foliage(st, 41, [(-140, 1780, 1220, 2040)], 12, (340, 480), ["#26382c"], 150, groups=1, spin=(220, 320), dof=6, curl=0, shadow=.8, edge=0)
    return st.finish(bloom=.18, thresh=.8, vignette=.46, grain=.009, seed=13)


def trunks(st, seed, n, width, col, z, fringe=None, gap=None, tear=(3, 16), kind="bark", shadow=.85, limbs=0):
    r = np.random.default_rng(seed)
    xs = np.linspace(-40, W + 40, n) + r.uniform(-W / n * .4, W / n * .4, n)
    masks = []
    for x in xs:
        if gap and gap[0] < x < gap[1]:
            continue
        w = r.uniform(*width)
        lean = r.uniform(-70, 70)
        masks.append(ribbon([(x + lean, -60), (x + lean * .4, 620), (x, 1320), (x - lean * .3, 2000)], [w * .7, w * .86, w, w * 1.3], cap=False))
        for _ in range(limbs):
            y, d = r.uniform(120, 1100), r.choice([-1, 1])
            l = r.uniform(180, 420)
            masks.append(ribbon([(x + lean * .4, y), (x + d * l * .5, y - l * .34), (x + d * l, y - l * .86)], [w * .3, w * .16, 4], cap=False))
    return st.sheet(raster(*masks), col, z, tear=tear, fringe=fringe, kind=kind, curl=2, shadow=shadow)


def s26():
    pool = np.exp(-(((XX - 400) / 480) ** 2 + ((YY - 860) / 640) ** 2))
    key = .2 + pool * .95
    st = Stage(sky("#1f2d49", "#25324e"), light=(-.5, -.6, .62), key=key, ambient=.3, key_gain=.8, key_color="#c9d6ee", shadow="#05070d", shadow_power=.72, soft=.3, seed=26)
    st.glow("#5c769f", pool * .24)
    trunks(st, 1, 11, (34, 72), "#2d3e60", 10, tear=(2, 10), gap=(130, 225), limbs=1)
    st.haze("#46608a", np.clip(pool * .3 + .1, 0, 1))
    # Gold, far away and thin. He can't see it.
    gold = np.exp(-((XX - 176 - (YY - 700) * .012) / 1.5) ** 2) * np.clip((1300 - YY) / 560, 0, 1) * np.clip((YY + 120) / 520, 0, 1)
    st.glow("#e3b25c", gold * 2.3)
    st.glow("#e3b25c", cv2.GaussianBlur(gold, (0, 0), 22) * 1.5)
    trunks(st, 2, 7, (60, 130), "#1c2841", 20, gap=(120, 260), limbs=1)
    st.haze("#3f5680", np.clip(pool * .2 + .05 + np.clip((YY - 1100) / 700, 0, 1) * .16, 0, 1))
    trunks(st, 3, 4, (130, 240), "#111929", 34, gap=(100, 700), limbs=1)
    st.haze("#2c3d5e", np.clip(pool * .08 + .02, 0, 1))
    foliage(st, 61, [(-80, 1200, 500, 1760), (740, -80, 1160, 420)], 12, (240, 400), ["#16222f", "#1b2a36", "#121c28"], 44, groups=4, curl=2, shadow=.95)
    # Adam. His shoulders have risen around his neck.
    P = COLD
    plane(st, [(1100, 980), (1120, 1960), (280, 1960), (330, 1640), (420, 1450), (560, 1320), (690, 1262), (800, 1120), (960, 1020)], P["dark"], 56, curl=2, shadow=1)
    t = head(st, 660, (770, 1120), angle=-27, flip=True, pal=P, eye="shut", z=62, worry=True)
    beard(st, t, P, 72)
    hair_m(st, t, P, 76)
    shoulder = [(1110, 1006), (1000, 1000), (860, 1090), (700, 1250), (520, 1370), (390, 1540), (330, 1760), (330, 1960), (1110, 1960)]
    m = plane(st, shoulder, P["mid"], 84, curl=3, shadow=1)
    plane(st, [(1110, 1040), (1000, 1036), (880, 1110), (740, 1270), (600, 1370), (760, 1330), (900, 1210), (1110, 1140)], P["light"], 86, shadow=.35, mask=m)
    plane(st, [(420, 1560), (560, 1420), (720, 1400), (640, 1540), (520, 1700), (430, 1820)], P["cheek"], 86, shadow=.3, mask=m)
    foliage(st, 62, [(-80, 1640, 1160, 1960), (900, 1280, 1180, 1960)], 14, (280, 420), ["#1a2835", "#14202b", "#1f2f3b"], 110, groups=5, spin=(200, 340), curl=3, shadow=1, rib_color="#0e161f")
    foliage(st, 63, [(-140, 1800, 1220, 2060), (960, -180, 1240, 40)], 6, (380, 520), ["#0c131c"], 150, groups=1, spin=(200, 340), dof=8, curl=0, shadow=.8, edge=0)
    return st.finish(bloom=.34, thresh=.5, vignette=.34, grain=.011, seed=26)


SCENES = {"s02": s02, "s13": s13, "s26": s26}


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--only", default="")
    arg = a.parse_args()
    OUT.mkdir(exist_ok=True)
    for name in [x for x in arg.only.split(",") if x] or SCENES:
        out = SCENES[name]()
        cv2.imwrite(str(OUT / f"{name}.jpg"), (out[..., ::-1] * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 95])
        print(name)


if __name__ == "__main__":
    main()
