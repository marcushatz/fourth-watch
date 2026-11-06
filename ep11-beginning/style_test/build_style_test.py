#!/usr/bin/env python3
"""Free style test for ep11: the same five moments drawn in code, finished in four design styles.

    python3 ep11-beginning/style_test/build_style_test.py [--only hook,giving] [--styles paper,paint] [--fonts DIR]

No credits, no Higgsfield and no video. These frames compare design choices. Generated art would hold more detail.
Every style shares the same shapes, so the comparison is about the design and not about different drawings.
"""
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 720, 1280
SS = 2
HERE = Path(__file__).resolve().parent
OUT = HERE / "frames"
Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
GOLD = np.array([0.92, 0.69, 0.27], np.float32)  # near Lamp gold, lifted for light


def hexc(s):
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


# Noise and masks ------------------------------------------------------------

def fbm(seed, scale=220, octaves=5, keep=.5, stretch=(1, 1)):
    r = np.random.default_rng(seed)
    out, amp, tot = np.zeros((H, W), np.float32), 1.0, 0.0
    for o in range(octaves):
        sx, sy = max(2, int(scale * stretch[0] / 2 ** o)), max(2, int(scale * stretch[1] / 2 ** o))
        g = r.random((H // sy + 3, W // sx + 3), dtype=np.float32)
        out += cv2.resize(g, (W, H), interpolation=cv2.INTER_CUBIC) * amp
        tot += amp
        amp *= keep
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def spline(pts, closed=True, n=12):
    p, m, out = np.array(pts, np.float32), len(pts), []
    for i in range(m if closed else m - 1):
        a, b, c, d = p[(i - 1) % m], p[i], p[(i + 1) % m], p[(i + 2) % m]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t ** 3))
    return np.array(out, np.float32)


def blank():
    return np.zeros((H * SS, W * SS), np.uint8)


def done(m):
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def fill(*polys):
    m = blank()
    for p in polys:
        cv2.fillPoly(m, [np.int32(np.array(p) * SS)], 255, cv2.LINE_AA)
    return done(m)


def place(pts, x, y, s, flip=False, rot=0):
    p = (np.array(pts, np.float32) - [.45, .45]) * s
    if flip:
        p[:, 0] *= -1
    c, n = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    return np.stack([p[:, 0] * c - p[:, 1] * n + x, p[:, 0] * n + p[:, 1] * c + y], 1)


def ellipse(x, y, a, b, rot=0):
    t = np.linspace(0, 2 * np.pi, 40, endpoint=False)
    p = np.stack([a * np.cos(t), b * np.sin(t)], 1)
    c, n = np.cos(np.radians(rot)), np.sin(np.radians(rot))
    return np.stack([p[:, 0] * c - p[:, 1] * n + x, p[:, 0] * n + p[:, 1] * c + y], 1)


def wander(mask, seed, amount=5, scale=26):
    """Edges wander slightly, so nothing looks machine cut."""
    n1, n2 = fbm(seed, scale, 3), fbm(seed + 1, scale, 3)
    mx, my = X + (n1 - .5) * amount * 2, Y + (n2 - .5) * amount * 2
    return cv2.remap(mask, mx, my, cv2.INTER_LINEAR)


def volume(mask, lx, ly, soft=26, lz=120):
    """Soft form shading: treats a flat shape as if it were rounded, lit from one point."""
    d = cv2.distanceTransform((mask > .5).astype(np.uint8), cv2.DIST_L2, 5)
    h = np.sqrt(np.clip(d, 0, soft) / soft) * soft
    h = cv2.GaussianBlur(h.astype(np.float32), (0, 0), 3)
    gx, gy = cv2.Sobel(h, cv2.CV_32F, 1, 0, ksize=3) / 8, cv2.Sobel(h, cv2.CV_32F, 0, 1, ksize=3) / 8
    nz = 1 / np.sqrt(gx * gx + gy * gy + 1)
    nx, ny = -gx * nz, -gy * nz
    dx, dy, dz = lx - X, ly - Y, np.full((H, W), lz, np.float32)
    n = np.sqrt(dx * dx + dy * dy + dz * dz) + 1e-3
    return np.clip((nx * dx + ny * dy + nz * dz) / n, 0, 1)


def tree(seed, x, base, h, spread=.55, depth=7, leaf=1.0):
    """Returns (wood, foliage) masks for a branching tree."""
    r = np.random.default_rng(seed)
    wood, tips = blank(), []

    def grow(px, py, ang, length, thick, d):
        ex, ey = px + np.cos(ang) * length, py + np.sin(ang) * length
        cv2.line(wood, (int(px * SS), int(py * SS)), (int(ex * SS), int(ey * SS)), 255, max(1, int(thick * SS)), cv2.LINE_AA)
        if d == 0 or length < 8:
            tips.append((ex, ey))
            return
        for _ in range(r.integers(2, 4)):
            grow(ex, ey, ang + r.uniform(-spread, spread), length * r.uniform(.68, .84), thick * .68, d - 1)
    grow(x, base, -np.pi / 2 + r.uniform(-.05, .05), h * .26, h * .05, depth)
    leaves = blank()
    for tx, ty in tips:
        for _ in range(3):
            a, d = r.uniform(0, 6.28), r.uniform(0, h * .05)
            cv2.circle(leaves, (int((tx + d * np.cos(a)) * SS), int((ty + d * np.sin(a)) * SS)), int(r.uniform(.02, .055) * h * leaf * SS), 255, -1, cv2.LINE_AA)
    return done(wood), done(leaves)


LEAF = [(0, -1), (.42, -.62), (.5, -.15), (.34, .4), (0, 1), (-.34, .4), (-.5, -.15), (-.42, -.62)]


def leaves(seed, boxes, n, size=(22, 60)):
    """Scatter big oval leaves inside boxes given as (x0, y0, x1, y1)."""
    r = np.random.default_rng(seed)
    m = blank()
    for x0, y0, x1, y1 in boxes:
        for _ in range(n):
            x, y, s, a = r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(*size), r.uniform(0, 3.14)
            c, sn = np.cos(a), np.sin(a)
            p = np.array(LEAF, np.float32) * s
            q = np.stack([p[:, 0] * c - p[:, 1] * sn + x, p[:, 0] * sn + p[:, 1] * c + y], 1)
            cv2.fillPoly(m, [np.int32(spline(q) * SS)], 255, cv2.LINE_AA)
    return done(m)


def trunk(seed, x, width, top=-20, bottom=H + 20, lean=0):
    r = np.random.default_rng(seed)
    ys = np.linspace(top, bottom, 14)
    wobble = r.uniform(-.12, .12, 14) * width
    left = [(x + lean * (y - H / 2) / H - width * (.5 + .16 * (i / 13) ** 4) + wobble[i], y) for i, y in enumerate(ys)]
    right = [(x + lean * (y - H / 2) / H + width * (.5 + .22 * (i / 13) ** 4) + wobble[13 - i], y) for i, y in enumerate(ys)]
    return fill(np.array(left + right[::-1], np.float32))


# People, in shapes every style shares ---------------------------------------

HEAD = [(.30, 1.0), (.30, .78), (.24, .62), (.16, .45), (.16, .28), (.26, .12), (.42, .05), (.58, .08), (.70, .20), (.735, .33), (.715, .385), (.77, .46), (.815, .515), (.755, .555), (.745, .585), (.775, .615), (.74, .64), (.765, .665), (.725, .70), (.74, .76), (.68, .80), (.56, .79), (.52, .84), (.50, 1.0)]
HAIR_A = [(.30, .66), (.20, .58), (.13, .42), (.14, .25), (.24, .09), (.42, .01), (.60, .04), (.72, .16), (.62, .20), (.50, .21), (.45, .31), (.47, .42), (.41, .50), (.37, .60)]
BEARD = [(.47, .50), (.56, .60), (.66, .60), (.74, .63), (.77, .72), (.73, .83), (.60, .86), (.50, .78)]
HAIR_E = [(.64, .13), (.47, .0), (.26, .05), (.11, .22), (.07, .5), (.0, .85), (-.03, 1.25), (.2, 1.42), (.33, 1.1), (.36, .8), (.42, .6), (.44, .4), (.53, .24)]
TORSO = [(.52, .84), (.72, .93), (.86, 1.12), (.92, 1.9), (.0, 1.9), (.04, 1.12), (.14, .95), (.3, .84)]
ARM = [(.5, 1.1), (.72, 1.08), (1.02, 1.1), (1.3, 1.02), (1.37, 1.1), (1.05, 1.22), (.74, 1.3), (.46, 1.32)]
HUDDLE = [(.02, 1.0), (-.05, .8), (-.02, .54), (.1, .36), (.26, .29), (.38, .3), (.46, .44), (.54, .52), (.68, .44), (.78, .45), (.85, .6), (.92, .9), (1.06, .96), (1.05, 1.0)]


def person(x, y, s, flip=False, rot=0, hair="a", arm=None):
    pt = lambda shape: place(spline(shape), x, y, s, flip, rot)
    out = {"skin": fill(pt(HEAD)), "torso": fill(pt(TORSO))}
    out["skin"] = np.maximum(out["skin"], 0)
    out["hair"] = fill(pt(HAIR_A if hair == "a" else HAIR_E))
    if hair == "a":
        out["hair"] = np.maximum(out["hair"], fill(pt(BEARD)))
    if arm is not None:
        out["arm"] = fill(pt(arm))
    pos = lambda u, v: place([(u, v)], x, y, s, flip, rot)[0]
    out["eye"] = pos(.655, .36)
    out["brow"] = (pos(.59, .31), pos(.725, .325))
    out["ear"] = pos(.40, .42)
    out["mouth"] = (pos(.66, .645), pos(.745, .64))
    out["s"] = s
    return out


def stroke(p0, p1, width):
    m = blank()
    cv2.line(m, tuple(np.int32(np.array(p0) * SS)), tuple(np.int32(np.array(p1) * SS)), 255, max(1, int(width * SS)), cv2.LINE_AA)
    return done(m)


def huddle(x, base, s, flip=False, hair=False):
    """A person sitting with knees drawn up, seen from the side."""
    pt = lambda shape: place(spline(shape), x, base - s * .55, s, flip)
    hx, hy = place([(.45, .13)], x, base - s * .55, s, flip)[0]
    out = {"body": fill(pt(HUDDLE)), "skin": np.maximum(fill(ellipse(hx, hy, s * .13, s * .15)), fill(pt([(.27, .3), (.4, .32), (.56, .46), (.74, .5), (.74, .58), (.54, .58), (.34, .46)])))}
    if hair:
        out["hair"] = fill(pt([(.5, .0), (.34, .0), (.26, .16), (.14, .4), (.02, .66), (.1, .7), (.26, .48), (.36, .3), (.4, .14)]))
    else:
        out["hair"] = fill(pt([(.52, .0), (.36, .0), (.3, .12), (.34, .2), (.42, .12), (.5, .08)]))
    return out


# Scenes ---------------------------------------------------------------------
# A scene is a list of (kind, mask, z). z is depth: 0 is far and 1 is near.

class Scene:
    def __init__(self, name, mood, light, text=None):
        self.name, self.mood, self.light, self.text = name, mood, light, text
        self.layers, self.gold, self.stars, self.band, self.faces = [], None, None, None, []

    def add(self, kind, mask, z=.5, form=True):
        self.layers.append((kind, mask, z, form))
        return self

    def add_person(self, p, a, z=.7):
        if "arm" in p:
            pass
        self.add(f"body{a}", p["torso"], z)
        self.add(f"skin{a}", p["skin"], z + .01)
        self.add(f"hair{a}", p["hair"], z + .02)
        if "arm" in p:
            self.add(f"skin{a}", p["arm"], z + .03)
        self.faces.append(p)


def hook():
    s = Scene("hook", "night", (360, 120))
    r = np.random.default_rng(4)
    stars = np.zeros((H, W), np.float32)
    band = np.exp(-((Y - (X * .55 + 130)) / 300) ** 2) * fbm(5, 240, 5)
    for _ in range(1500):
        x, y = int(r.uniform(0, W)), int(r.uniform(0, 960))
        if r.random() < .35 + band[y, x]:
            stars[y, x] = r.uniform(.45, 1)
    s.stars = np.clip(cv2.GaussianBlur(stars, (0, 0), .7) * 3.2, 0, 1)
    s.band = band
    rid = fbm(6, 300, 4)[0] * 90
    far = (Y > 880 + np.interp(X, np.arange(W), rid)).astype(np.float32)
    s.add("far", cv2.GaussianBlur(far, (0, 0), 1), .15, False)
    hill = fill(spline([(-60, 1320), (-60, 1060), (120, 985), (360, 945), (600, 990), (780, 1070), (780, 1320)]))
    s.add("ground", wander(hill, 7, 4), .7)
    you = spline([(349, 948), (345, 905), (341, 878), (346, 856), (353, 846), (352, 833), (360, 826), (368, 833), (367, 846), (375, 856), (379, 878), (375, 905), (371, 948), (363, 948), (360, 912), (357, 948)])
    s.add("you", fill(you), .8)
    return s


def giving():
    s = Scene("giving", "eden", (150, 80))
    b1 = fbm(11, 150, 4)
    s.add("far", (b1 > .36).astype(np.float32) * (Y < 760), .05, False)
    wa, fa = tree(12, 640, 1000, 980, .5)
    s.add("trunk", wa, .15).add("canopy", fa, .2)
    wb, fb = tree(13, 70, 1020, 900, .55)
    s.add("trunk", wb, .22).add("canopy", fb, .25)
    s.add("ground", fill(spline([(-40, 1320), (-40, 950), (250, 900), (520, 920), (760, 960), (760, 1320)])), .3)
    e = person(176, 560, 300, False, 0, "e", [(.5, 1.1), (.7, 1.06), (.9, 1.03), (1.03, 1.0), (1.06, 1.08), (.92, 1.15), (.72, 1.24), (.46, 1.3)])
    a = person(548, 500, 330, True, 0, "a", [(.5, 1.1), (.66, 1.1), (.8, 1.03), (.9, .98), (.93, 1.05), (.8, 1.15), (.66, 1.24), (.46, 1.3)])
    s.add_person(a, "2", .6)
    s.add_person(e, "1", .64)
    s.add("fruit", fill(ellipse(372, 690, 37, 43)), .75)
    s.add("near", fill(spline([(-40, 1320), (-40, 960), (200, 910), (360, 950), (520, 905), (760, 950), (760, 1320)])), .88)
    s.add("near", leaves(14, [(-30, 830, 300, 1000), (430, 820, 750, 1000), (-30, 980, 750, 1320)], 26, (44, 92)), .9)
    s.add("near", leaves(15, [(-30, -30, 760, 110)], 18, (34, 70)), .92)
    return s


def hiding():
    s = Scene("hiding", "forest", (40, 620))
    s.add("far", leaves(21, [(0, 0, W, 980)], 90, (24, 50)), .05, False)
    for i, (x, w) in enumerate(((300, 44), (448, 56), (216, 40))):
        s.add("trunkfar", wander(trunk(22 + i, x, w), 30 + i, 3), .25)
    s.add("ground", fill(spline([(-40, 1320), (-40, 960), (250, 930), (520, 950), (760, 930), (760, 1320)])), .4)
    for i, (x, w, lean) in enumerate(((36, 118, 20), (640, 140, -30), (150, 62, 8))):
        s.add("trunk", wander(trunk(40 + i, x, w, lean=lean), 50 + i, 4), .55)
    e = huddle(556, 1020, 206, True, True)
    a = huddle(430, 1030, 226, True)
    s.add("body2", e["body"], .7).add("skin2", e["skin"], .71).add("hair2", e["hair"], .72)
    s.add("body1", a["body"], .73).add("skin1", a["skin"], .74).add("hair1", a["hair"], .75)
    s.add("near", leaves(23, [(-30, 1060, 760, 1320)], 34, (38, 78)), .9)
    s.add("near", leaves(24, [(560, 0, 760, 420), (-30, 0, 120, 300)], 12, (34, 62)), .92)
    g = np.zeros((H, W), np.float32)
    r = np.random.default_rng(25)
    gm = blank()
    for rad in (150, 250, 350):
        for _ in range(int(rad / 6)):
            a0 = r.uniform(-.7, .62)
            x, y = -80 + rad * np.cos(a0), 720 + rad * np.sin(a0)
            sz = r.uniform(6, 15)
            c, sn = np.cos(a0 + 1.57), np.sin(a0 + 1.57)
            p = np.array(LEAF, np.float32) * sz
            q = np.stack([p[:, 0] * c - p[:, 1] * sn + x, p[:, 0] * sn + p[:, 1] * c + y], 1)
            cv2.fillPoly(gm, [np.int32(q * SS)], 255, cv2.LINE_AA)
    s.gold = done(gm)
    return s


def face():
    s = Scene("face", "gold", (690, 150))
    s.add("far", leaves(31, [(0, 0, W, H)], 110, (30, 70)), .1, False)
    a = person(292, 600, 800, False, -11, "a")
    a["torso"] = cv2.warpAffine(a["torso"], np.float32([[1, 0, -6], [0, 1, -150]]), (W, H))
    a["torso"] = np.maximum(a["torso"], (Y > 900).astype(np.float32) * (X < 640))
    s.add("body1", a["torso"], .6).add("skin1", a["skin"], .62).add("hair1", a["hair"], .64)
    s.faces.append(a)
    s.add("near", leaves(32, [(-30, 1100, 300, 1320), (560, 1000, 760, 1320)], 12, (44, 90)), .9)
    return s


def moment():
    s = Scene("moment", "dark", (360, 1040), text=("Where are you?", "Genesis 3:9"))
    for i, (x, w) in enumerate(((236, 34), (486, 38), (330, 22), (410, 24), (140, 40), (586, 44))):
        s.add("trunkfar", wander(trunk(60 + i, x, w), 70 + i, 2), .2)
    s.add("ground", fill(spline([(-40, 1320), (-40, 1060), (250, 1030), (520, 1035), (760, 1060), (760, 1320)])), .5)
    for i, (x, w, lean) in enumerate(((26, 120, 26), (700, 130, -34), (112, 60, 10), (626, 64, -12))):
        s.add("trunk", wander(trunk(80 + i, x, w, lean=lean), 90 + i, 4), .6)
    a = huddle(306, 1094, 104)
    e = huddle(420, 1098, 94, True, True)
    s.add("body2", e["body"], .7).add("skin2", e["skin"], .71).add("hair2", e["hair"], .72)
    s.add("body1", a["body"], .73).add("skin1", a["skin"], .74).add("hair1", a["hair"], .75)
    s.add("near", leaves(33, [(-30, 1180, 300, 1320), (440, 1180, 760, 1320)], 12, (34, 66)), .9)
    thread = stroke((360, 618), (360, 1000), 2.6)
    pool = np.exp(-(((X - 360) / 150) ** 2 + ((Y - 1104) / 34) ** 2))
    people = np.zeros((H, W), np.float32)
    for kind, mask, z, f in s.layers:
        if kind[:4] in ("body", "skin", "hair"):
            people = np.maximum(people, mask)
    s.gold = np.clip(np.maximum(thread, pool * .9) * (1 - people), 0, 1)
    return s


SCENES = {"hook": hook, "giving": giving, "hiding": hiding, "face": face, "moment": moment}


# Colour for each style ------------------------------------------------------

PALETTES = {
    "paint": {
        "night": dict(top="#101a33", bottom="#3a3a52", far="#232a42", ground="#1c2230", you="#c9b58f"),
        "eden": dict(top="#f6e3a6", bottom="#a8c98a", far="#8fb978", trunk="#5b4630", canopy="#4f8a4a", ground="#6d9a4c", near="#2f6a3c", skin1="#d9a074", hair1="#3a2418", body1="#d9a074", skin2="#c98d5e", hair2="#2c1c12", body2="#c98d5e", fruit="#a23a3a"),
        "forest": dict(top="#16233a", bottom="#0d1524", far="#1f3142", trunkfar="#1b2a38", trunk="#10151f", ground="#141d26", near="#0d1a1c", skin1="#7f8a97", hair1="#1a1f28", body1="#5f6a78", skin2="#8a93a0", hair2="#141820", body2="#67707f"),
        "gold": dict(top="#120f14", bottom="#241a16", far="#2a2a24", skin1="#d8a070", hair1="#2c1a12", body1="#6b4a33", near="#1a1a14"),
        "dark": dict(top="#121b2e", bottom="#16233a", trunkfar="#1a2a40", trunk="#0a0e16", ground="#0e141c", near="#0a1014", skin1="#8a8f98", hair1="#1a1f28", body1="#5f6a78", skin2="#8a8f98", hair2="#141820", body2="#67707f"),
    },
    "paper": {
        "night": dict(top="#1c2433", bottom="#2c3650", far="#3a4660", ground="#14100d", you="#f2e6cf"),
        "eden": dict(top="#f2e6cf", bottom="#f2e6cf", far="#c9d6a0", trunk="#6b4a33", canopy="#7fa35e", ground="#a7bf72", near="#3f6b45", skin1="#d7a57a", hair1="#2a1e16", body1="#d7a57a", skin2="#b9805a", hair2="#14100d", body2="#b9805a", fruit="#c2502e"),
        "forest": dict(top="#1c2433", bottom="#1c2433", far="#27324a", trunkfar="#2f3b52", trunk="#14100d", ground="#232c3e", near="#101826", skin1="#c9b69a", hair1="#14100d", body1="#8c8174", skin2="#d7c4a8", hair2="#2a1e16", body2="#a3978a"),
        "gold": dict(top="#14100d", bottom="#14100d", far="#2a1e16", skin1="#d7a57a", hair1="#2a1e16", body1="#6b4a33", near="#101826"),
        "dark": dict(top="#2c3a56", bottom="#3a4a66", trunkfar="#1c2433", trunk="#0d0b0a", ground="#14100d", near="#0d0b0a", skin1="#c9b69a", hair1="#14100d", body1="#8c8174", skin2="#d7c4a8", hair2="#2a1e16", body2="#a3978a"),
    },
}
PALETTES["ink"] = {
    "night": dict(top=.22, bottom=.42, far=.26, ground=.06, you=.96),
    "eden": dict(top=.97, bottom=.9, far=.74, trunk=.3, canopy=.58, ground=.72, near=.2, skin1=.9, hair1=.16, body1=.88, skin2=.8, hair2=.08, body2=.78, fruit=.32),
    "forest": dict(top=.34, bottom=.26, far=.42, trunkfar=.34, trunk=.1, ground=.2, near=.07, skin1=.88, hair1=.14, body1=.7, skin2=.92, hair2=.1, body2=.74),
    "gold": dict(top=.1, bottom=.16, far=.2, skin1=.72, hair1=.1, body1=.34, near=.06),
    "dark": dict(top=.3, bottom=.26, trunkfar=.22, trunk=.07, ground=.16, near=.05, skin1=.9, hair1=.14, body1=.74, skin2=.94, hair2=.1, body2=.78),
}
PALETTES["char"] = {
    "night": dict(top=.2, bottom=.36, far=.3, ground=.04, you=.95),
    "eden": dict(top=.62, bottom=.5, far=.36, trunk=.08, canopy=.24, ground=.34, near=.05, skin1=.82, hair1=.04, body1=.78, skin2=.7, hair2=.03, body2=.66, fruit=.14),
    "forest": dict(top=.42, bottom=.34, far=.5, trunkfar=.44, trunk=.1, ground=.24, near=.05, skin1=.86, hair1=.05, body1=.66, skin2=.9, hair2=.04, body2=.72),
    "gold": dict(top=.03, bottom=.06, far=.08, skin1=.6, hair1=.03, body1=.2, near=.02),
    "dark": dict(top=.2, bottom=.16, trunkfar=.1, trunk=.02, ground=.06, near=.02, skin1=.8, hair1=.05, body1=.56, skin2=.84, hair2=.04, body2=.6),
}


def lightness(c):
    return float(c @ np.array([.3, .59, .11], np.float32))


def compose(scene, style, painterly=True):
    """Build the picture from its layers. Returns colour, and a map of where gold falls."""
    pal = {k: hexc(v) if isinstance(v, str) else np.full(3, v, np.float32) for k, v in PALETTES[style][scene.mood].items()}
    lx, ly = scene.light
    t = np.clip(Y / H, 0, 1)[..., None]
    img = pal["top"] * (1 - t) + pal["bottom"] * t
    if scene.mood == "dark":
        glow = np.exp(-(((X - 360) / 260) ** 2 + ((Y - 860) / 520) ** 2))[..., None]
        img = img + glow * (hexc("#3f5a7c") if style == "paint" else .3)
    if scene.band is not None:
        img = img + scene.band[..., None] * hexc("#3a3f62") * .9
    if scene.stars is not None:
        img = img + scene.stars[..., None] * .9
    tex = fbm(99, 90, 5)
    for i, (kind, mask, z, form) in enumerate(scene.layers):
        base = kind if kind in pal else {"skin": "skin1"}.get(kind, "near")
        col = pal.get(base, pal["bottom"])
        if form:
            shade = volume(mask, lx, ly)
            k = .55 + .8 * shade
            if kind.startswith(("trunk", "canopy", "near", "ground")):
                k = k * (.72 + .56 * fbm(100 + i, 60, 4))
        else:
            k = .8 + .4 * fbm(100 + i, 110, 4)
        if style in ("ink", "char") and form:
            k = .78 + .44 * shade
        layer = col * k[..., None]
        if painterly and scene.mood == "eden" and z < .4:
            layer = layer * .6 + (pal["top"] * .5 + pal["bottom"] * .5) * .4
        img = img * (1 - mask[..., None]) + layer * mask[..., None]
    if painterly and scene.mood in ("eden",):
        d = np.sqrt((X - lx) ** 2 + (Y - ly) ** 2)
        img = img + np.exp(-d / 620)[..., None] * hexc("#ffe9b0") * .34
    return np.clip(img, 0, 1), np.zeros((H, W), np.float32) if scene.gold is None else scene.gold


def add_face_details(img, scene, tone=1.0):
    """Eye, brow and mouth on any shaped face. Kept simple so no style gets an unfair drawing."""
    out = (img * 255).astype(np.uint8)[..., ::-1].copy()
    for p in scene.faces:
        s = p["s"]
        ex, ey = p["eye"]
        cv2.ellipse(out, (int(ex), int(ey)), (int(s * .027), int(s * .013)), 0, 0, 360, (26, 34, 42), -1, cv2.LINE_AA)
        (bx0, by0), (bx1, by1) = p["brow"]
        pts = np.int32([[bx0, by0 + s * .012], [(bx0 + bx1) / 2, (by0 + by1) / 2 - s * .012], [bx1, by1 - s * .002]])
        cv2.polylines(out, [pts], False, (30, 42, 56), max(1, int(s * .01)), cv2.LINE_AA)
        (mx0, my0), (mx1, my1) = p["mouth"]
        cv2.line(out, (int(mx0 + (mx1 - mx0) * .3), int(my0)), (int(mx1), int(my1)), (56, 66, 110), max(1, int(s * .005)), cv2.LINE_AA)
    return out[..., ::-1].astype(np.float32) / 255


# The four finishes ----------------------------------------------------------

def finish_paint(scene):
    """Painted: strokes laid over the picture, large to small, like gouache."""
    img, gold = compose(scene, "paint")
    if scene.faces:
        img = add_face_details(img, scene)
    if gold.max() > 0:
        g = cv2.GaussianBlur(gold, (0, 0), 18)
        img = np.clip(img + (gold[..., None] * GOLD * .6 + g[..., None] * GOLD * .75), 0, 1)
    if scene.mood == "gold":
        d = np.sqrt((X - scene.light[0]) ** 2 + (Y - scene.light[1]) ** 2)
        img = np.clip(img + np.exp(-d / 430)[..., None] * GOLD * .62, 0, 1)
    if scene.mood in ("dark", "forest", "night"):
        fog = fbm(200, 260, 4)[..., None] * np.clip((Y - 500) / 800, 0, 1)[..., None]
        img = np.clip(img + fog * hexc("#32465e") * .24, 0, 1)
    r = np.random.default_rng(301)
    lum = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32)
    gx, gy = cv2.Sobel(cv2.GaussianBlur(lum, (0, 0), 5), cv2.CV_32F, 1, 0), cv2.Sobel(cv2.GaussianBlur(lum, (0, 0), 5), cv2.CV_32F, 0, 1)
    flow = fbm(302, 180, 3) * np.pi * 2
    canvas = (cv2.GaussianBlur(img, (0, 0), 14) * 255).astype(np.uint8).copy()
    for radius, step, length in ((15, 13, 42), (8, 8, 26), (4, 5, 15), (2, 3, 9)):
        src = cv2.GaussianBlur(img, (0, 0), radius * .55)
        pts = [(x, y) for y in range(0, H, step) for x in range(0, W, step)]
        r.shuffle(pts)
        for x, y in pts:
            x = min(W - 1, max(0, x + int(r.integers(-step // 2 - 1, step // 2 + 2))))
            y = min(H - 1, max(0, y + int(r.integers(-step // 2 - 1, step // 2 + 2))))
            if radius < 8 and np.abs(src[y, x] * 255 - canvas[y, x]).sum() < 16:
                continue
            g = gx[y, x], gy[y, x]
            ang = np.arctan2(g[1], g[0]) + np.pi / 2 if abs(g[0]) + abs(g[1]) > 12 else flow[y, x]
            dx, dy = np.cos(ang) * length / 2, np.sin(ang) * length / 2
            c = src[y, x] * 255 * (1 + r.uniform(-.07, .07))
            cv2.line(canvas, (int(x - dx), int(y - dy)), (int(x + dx), int(y + dy)), tuple(float(v) for v in np.clip(c, 0, 255)), radius * 2 - 1, cv2.LINE_AA)
    out = canvas.astype(np.float32) / 255
    relief = cv2.Sobel(cv2.GaussianBlur(out.mean(2), (0, 0), 1), cv2.CV_32F, 1, 1) * .55
    canvas_tooth = (fbm(303, 5, 2, stretch=(1, 1)) - .5) * .05
    out = np.clip(out + relief[..., None] + canvas_tooth[..., None], 0, 1)
    if scene.stars is not None:
        out = np.clip(out + scene.stars[..., None] * (1 - scene.layers[1][1])[..., None] * .95, 0, 1)
    if gold.max() > 0:
        crisp = (gold * (gold > .5))[..., None]
        out = out * (1 - crisp) + GOLD * crisp
    return out


def finish_paper(scene):
    """Cut paper: flat sheets stacked with real shadows. Simple faces."""
    pal = {k: hexc(v) for k, v in PALETTES["paper"][scene.mood].items()}
    t = np.clip(Y / H, 0, 1)[..., None]
    img = pal["top"] * (1 - t) + pal["bottom"] * t
    if scene.stars is not None:
        img = img + (cv2.dilate(scene.stars, np.ones((3, 3))) > .35)[..., None].astype(np.float32) * (hexc("#f2e6cf") - img)
    fiber = fbm(400, 7, 3)
    for i, (kind, mask, z, form) in enumerate(scene.layers):
        col = pal.get(kind, pal.get("near", pal["bottom"]))
        m = np.clip((wander(mask, 410 + i, 3, 18) - .5) * 6 + .5, 0, 1)
        lift = 3 + z * 11
        sh = cv2.warpAffine(m, np.float32([[1, 0, lift * .7], [0, 1, lift]]), (W, H))
        sh = cv2.GaussianBlur(sh, (0, 0), 3 + z * 7) * (1 - m) * .46
        img = img * (1 - sh[..., None])
        tone = 1 + (fbm(420 + i, 30, 3) - .5) * .05
        layer = col * tone[..., None]
        highlight = np.clip(m - cv2.warpAffine(m, np.float32([[1, 0, 1.4], [0, 1, 1.8]]), (W, H)), 0, 1) * .2
        img = img * (1 - m[..., None]) + np.clip(layer + highlight[..., None], 0, 1) * m[..., None]
    if scene.mood == "eden" and False:
        pass
    if scene.faces:
        out = (img * 255).astype(np.uint8)[..., ::-1].copy()
        for p in scene.faces:
            s = p["s"]
            cv2.circle(out, tuple(np.int32(p["eye"])), max(3, int(s * .02)), (22, 16, 20), -1, cv2.LINE_AA)
        img = out[..., ::-1].astype(np.float32) / 255
    if scene.gold is not None:
        gm = (cv2.GaussianBlur(scene.gold, (0, 0), 1) > .32).astype(np.float32)
        gm = cv2.GaussianBlur(gm, (0, 0), .8)
        sh = cv2.GaussianBlur(cv2.warpAffine(gm, np.float32([[1, 0, 3], [0, 1, 5]]), (W, H)), (0, 0), 4) * .4
        img = img * (1 - sh[..., None])
        img = img * (1 - gm[..., None]) + hexc("#e3b25c") * gm[..., None]
    if scene.mood == "gold":
        for r, c, a in ((560, "#6b4a33", .55), (430, "#a97b3c", .7), (300, "#e3b25c", .92)):
            m = cv2.GaussianBlur(((X - 690) ** 2 + (Y - 150) ** 2 < r * r).astype(np.float32), (0, 0), 1.5)
            back = np.ones((H, W), np.float32)
            for kind, mask, z, f in scene.layers:
                if kind in ("body1", "skin1", "hair1", "near"):
                    back = back * (1 - mask)
            img = img * (1 - (m * back * a)[..., None]) + hexc(c) * (m * back * a)[..., None]
    paper = 1 + (fiber - .5) * .12 + (fbm(401, 3, 2) - .5) * .05
    return np.clip(img * paper[..., None], 0, 1)


def figure_lines(scene):
    """Contour lines around people and fruit, for the styles drawn by hand."""
    lines = np.zeros((H, W), np.float32)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    for kind, mask, z, f in scene.layers:
        lines = lines * (1 - mask)
        if kind[:4] in ("skin", "hair", "body", "frui") or kind == "you":
            lines = np.maximum(lines, np.clip(mask - cv2.erode(mask, k, iterations=1), 0, 1) * 2)
    return np.clip(lines, 0, 1)


def finish_ink(scene):
    """Engraving: every tone is built from lines, like an old Bible print, with gold as one extra ink."""
    img, gold = compose(scene, "ink", False)
    if scene.faces:
        img = add_face_details(img, scene)
    if scene.mood == "gold":
        d = np.sqrt((X - scene.light[0]) ** 2 + (Y - scene.light[1]) ** 2)
        img = np.clip(img + np.exp(-d / 460)[..., None] * .78, 0, 1)
    tone = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    tone = cv2.GaussianBlur(tone, (0, 0), .8)
    S = 2
    big = cv2.resize(tone, (W * S, H * S), interpolation=cv2.INTER_CUBIC)
    yy, xx = np.mgrid[0:H * S, 0:W * S].astype(np.float32)
    warp = cv2.resize(fbm(500, 340, 2) * 34 + fbm(501, 60, 2) * 4, (W * S, H * S), interpolation=cv2.INTER_CUBIC) * S
    lines = (np.sin((yy + warp) * 2 * np.pi / (6.5 * S)) + 1) / 2
    cross = (np.sin((xx * .62 + yy * .78 + warp * .4) * 2 * np.pi / (7 * S)) + 1) / 2
    third = (np.sin((xx * .8 - yy * .6 - warp * .3) * 2 * np.pi / (7 * S)) + 1) / 2
    d = 1 - big
    ink = np.maximum.reduce([lines < d * 1.02, (cross < (d - .5) * 1.5), (third < (d - .74) * 2)]).astype(np.float32)
    ink = cv2.resize(cv2.GaussianBlur(ink, (0, 0), .6), (W, H), interpolation=cv2.INTER_AREA)
    ink = np.maximum(ink, figure_lines(scene))
    if scene.stars is not None:
        ink = ink * (1 - np.clip(cv2.dilate(scene.stars, np.ones((3, 3))) * 2, 0, 1))
    paper = hexc("#efe2c6") * (1 + ((fbm(502, 180, 4) - .5) * .12 + (fbm(503, 4, 2) - .5) * .05))[..., None]
    out = paper * (1 - ink[..., None]) + hexc("#17110d") * ink[..., None]
    if gold.max() > 0:
        g = cv2.GaussianBlur((gold > .2).astype(np.float32), (0, 0), 1)
        out = out * (1 - g[..., None]) + hexc("#d9a441") * g[..., None]
    if scene.mood == "gold":
        rays = (np.sin(np.arctan2(Y - scene.light[1], X - scene.light[0]) * 60) + 1) / 2
        d2 = np.sqrt((X - scene.light[0]) ** 2 + (Y - scene.light[1]) ** 2)
        back = np.ones((H, W), np.float32)
        for kind, mask, z, f in scene.layers:
            if kind[:4] in ("skin", "hair", "body"):
                back = back * (1 - mask)
        m = cv2.GaussianBlur(((rays > .55) * (d2 < 470)).astype(np.float32) * back, (0, 0), .9)
        out = out * (1 - m[..., None] * .92) + hexc("#d9a441") * m[..., None] * .92
    return np.clip(out, 0, 1)


def finish_char(scene):
    """Charcoal and white chalk on grey paper. Figures keep their tone, so they aren't black cut-outs."""
    img, gold = compose(scene, "char", False)
    if scene.faces:
        img = add_face_details(img, scene)
    tone = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    if scene.mood == "gold":
        d = np.sqrt((X - scene.light[0]) ** 2 + (Y - scene.light[1]) ** 2)
        tone = np.clip(tone + np.exp(-d / 330) * .34, 0, 1)
    if scene.stars is not None:
        tone = np.clip(tone + scene.stars * (1 - scene.layers[1][1]), 0, 1)
    tooth = fbm(600, 5, 2, .7)
    grit = (tooth - tooth.min()) / (tooth.max() - tooth.min())
    drag = fbm(601, 30, 3, stretch=(1, .2))
    t2 = cv2.GaussianBlur(tone, (0, 0), 1.2)
    dark = np.clip((.5 - t2) * 3.0, 0, 1)
    light = np.clip((t2 - .46) * 2.5, 0, 1)
    dark_cover = np.clip(dark * 1.5 - (grit * .9 + drag * .25) + .2, 0, 1)
    light_cover = np.clip(light * 1.5 - (grit * .95 + drag * .2) + .12, 0, 1)
    paper = hexc("#514d49") * (1 + (fbm(602, 150, 4) - .5) * .18)[..., None]
    out = paper * (1 - dark_cover[..., None]) + hexc("#0e0d0e") * dark_cover[..., None]
    out = out * (1 - light_cover[..., None]) + hexc("#f1e9da") * light_cover[..., None]
    edge = figure_lines(scene)
    edge = np.clip(cv2.GaussianBlur(edge, (0, 0), .9) * 2.2 * (.5 + grit), 0, 1)
    out = out * (1 - edge[..., None] * .9)
    if gold.max() > 0:
        g = cv2.GaussianBlur(gold, (0, 0), 1.6)
        glow = cv2.GaussianBlur(gold, (0, 0), 22)
        cover = np.clip(g * 1.5 - grit * .5, 0, 1)
        out = out * (1 - cover[..., None]) + hexc("#e8b54e") * cover[..., None] + glow[..., None] * hexc("#e3b25c") * .24
    if scene.mood == "gold":
        d = np.sqrt((X - scene.light[0]) ** 2 + (Y - scene.light[1]) ** 2)
        back = np.ones((H, W), np.float32)
        for kind, mask, z, f in scene.layers:
            if kind[:4] in ("skin", "hair", "body"):
                back = back * (1 - mask)
        gl = np.clip(np.exp(-d / 270) * 1.5 - grit * .4, 0, 1) * back
        out = out * (1 - gl[..., None]) + hexc("#e8b54e") * gl[..., None]
    return np.clip(out, 0, 1)


FINISH = {"char": finish_char, "paper": finish_paper, "paint": finish_paint, "ink": finish_ink}
TYPE_INK = {"char": "#f2e6cf", "paper": "#f2e6cf", "paint": "#fbf0da", "ink": "#17110d"}


def add_text(img, scene, style, fonts):
    if not scene.text:
        return img
    im = Image.fromarray((img * 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    main, ref = scene.text
    big = ImageFont.truetype(str(fonts / "cormorant-garamond-latin-600-italic.woff"), 84)
    small = ImageFont.truetype(str(fonts / "cormorant-garamond-latin-600-normal.woff"), 32)
    y = 410
    w = d.textlength(main, font=big)
    if style == "ink":
        d.rectangle((0, y - 30, W, y + 168), fill=(239, 226, 198, 245))
        d.line((70, y - 16, W - 70, y - 16), fill=(23, 17, 13, 255), width=2)
        d.line((70, y + 154, W - 70, y + 154), fill=(23, 17, 13, 255), width=2)
    d.text(((W - w) / 2, y), main, font=big, fill=hex_rgba(TYPE_INK[style]))
    w2 = d.textlength(ref, font=small)
    d.text(((W - w2) / 2, y + 108), ref, font=small, fill=hex_rgba(TYPE_INK[style], 215))
    return np.asarray(im).astype(np.float32) / 255


def hex_rgba(s, a=255):
    c = (hexc(s) * 255).astype(int)
    return (int(c[0]), int(c[1]), int(c[2]), a)


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--only", default="")
    a.add_argument("--styles", default="")
    a.add_argument("--fonts", required=True)
    o = a.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    fonts = Path(o.fonts)
    names = o.only.split(",") if o.only else list(SCENES)
    styles = o.styles.split(",") if o.styles else list(FINISH)
    for n in names:
        scene = SCENES[n]()
        for s in styles:
            pic = add_text(FINISH[s](scene), scene, s, fonts)
            Image.fromarray((pic * 255).astype(np.uint8)).save(OUT / f"{s}_{n}.jpg", quality=84, optimize=True)
            print(s, n)


if __name__ == "__main__":
    main()
