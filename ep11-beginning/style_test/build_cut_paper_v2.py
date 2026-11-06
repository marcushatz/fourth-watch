#!/usr/bin/env python3
"""Cut Paper, second pass: a lit paper stage and a jointed adult puppet. Stills only, no video, no credits.

    python3 ep11-beginning/style_test/build_cut_paper_v2.py --fonts DIR [--only hook,giving]

What changed from the first test, from Gemini, Grok and ChatGPT's advice checked against the project rules:
muted colour, big shapes, one key light, haze between depth bands, soft foreground, jointed figures about
7 heads tall, slit eyes (the rules ban dot eyes), acting through posture, and gold kept rare and thin.
"""
import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from build_style_test import H, LEAF, W, X, Y, ellipse, fbm, fill, hexc, spline, stroke, trunk, wander

HERE = Path(__file__).resolve().parent
OUT = HERE / "v2"
GOLD = hexc("#e9b654")


def shift(m, dx, dy):
    return cv2.warpAffine(m, np.float32([[1, 0, dx], [0, 1, dy]]), (W, H))


def texture(kind, seed):
    fine = fbm(seed + 1, 4, 2) - .5
    if kind == "smooth":
        return 1 + fine * .035
    if kind == "fiber":
        return 1 + (fbm(seed, 46, 4, stretch=(.22, 3)) - .5) * .3 + fine * .05
    if kind == "sky":
        return 1 + (fbm(seed, 230, 4) - .5) * .1 + fine * .03
    return 1 + (fbm(seed, 44, 4) - .5) * .13 + fine * .05


class Stage:
    """Paper sheets stacked under one key light."""

    def __init__(self, key, top, bottom, ambient=.74, diffuse=.42, fall=880, light="#fff2d6", seed=1):
        self.key, self.ambient, self.diffuse, self.fall = key, ambient, diffuse, fall
        self.light = hexc(light)
        t = np.clip(Y / H, 0, 1)[..., None]
        self.img = (hexc(top) * (1 - t) + hexc(bottom) * t) * texture("sky", seed + 900)[..., None]
        dx, dy = W / 2 - key[0], H / 2 - key[1]
        n = np.hypot(dx, dy) + 1e-3
        self.dir = dx / n, dy / n
        self.seed = seed
        self.count = 0
        self.gold_map = np.zeros((H, W), np.float32)
        self.bands = {}

    def _band(self, band, col, m):
        rgb, a = self.bands.get(band, (np.zeros((H, W, 3), np.float32), np.zeros((H, W), np.float32)))
        rgb = rgb * (1 - m[..., None]) + col * m[..., None]
        self.bands[band] = rgb, np.maximum(a, m)

    def add(self, mask, color, lift=8, tex="matte", blur=0, tear=3, band="subject", shadow=.42, tone=1.0, contact=False):
        self.count += 1
        s = self.seed * 100 + self.count
        c = hexc(color) if isinstance(color, str) else color
        m = wander(mask, s, tear, 16) if tear else mask
        m = np.clip((m - .5) * 5 + .5, 0, 1)
        if blur:
            m = cv2.GaussianBlur(m, (0, 0), blur)
        dx, dy = self.dir[0] * lift, self.dir[1] * lift
        if shadow:
            sh = cv2.GaussianBlur(shift(m, dx, dy), (0, 0), 1.5 + lift * .55) * (1 - m) * shadow
            self.img = self.img * (1 - sh[..., None])
        d = np.sqrt((X - self.key[0]) ** 2 + (Y - self.key[1]) ** 2)
        lit = self.ambient + self.diffuse * np.exp(-d / self.fall)
        col = c * tone * (lit * texture(tex, s))[..., None] * (self.light * .35 + .65)
        if not blur:
            near = m * (1 - shift(m, self.dir[0] * 1.8, self.dir[1] * 1.8))
            far = m * (1 - shift(m, -self.dir[0] * 1.8, -self.dir[1] * 1.8))
            col = col + near[..., None] * .13 - far[..., None] * .13
        col = np.clip(col, 0, 1)
        self.img = self.img * (1 - m[..., None]) + col * m[..., None]
        self._band(band, col, m)
        return self

    def haze(self, color, amount, y0=0, y1=H, seed=0):
        band = np.clip((Y - y0) / 180, 0, 1) * np.clip((y1 - Y) / 180, 0, 1)
        a = np.clip(band * amount * (.55 + .9 * fbm(700 + seed, 240, 4)), 0, 1)
        c = hexc(color)
        self.img = self.img * (1 - a[..., None]) + c * a[..., None]
        self.bands[f"haze{seed}"] = (np.broadcast_to(c, (H, W, 3)).copy(), a)
        return self

    def contact(self, x, y, rx, ry=None, strength=.55):
        m = cv2.GaussianBlur(fill(ellipse(x, y, rx, ry or rx * .14)), (0, 0), 7)
        self.img = self.img * (1 - m[..., None] * strength)
        return self

    def gold(self, mask, lift=3, tear=1):
        m = wander(mask, self.seed * 7 + self.count, tear, 12) if tear else mask
        self.img = self.img * (1 - cv2.GaussianBlur(shift(m, self.dir[0] * lift, self.dir[1] * lift), (0, 0), 3)[..., None] * .3)
        self.img = self.img * (1 - m[..., None]) + GOLD * (1 + (fbm(self.count + 800, 12, 3) - .5) * .16)[..., None] * m[..., None]
        self.gold_map = np.maximum(self.gold_map, m)
        self._band("gold", GOLD, m)
        return self

    def film(self, glow=.62, vignette=.26):
        out = self.img
        if self.gold_map.max() > 0:
            soft = cv2.GaussianBlur(self.gold_map, (0, 0), 9) * .5 + cv2.GaussianBlur(self.gold_map, (0, 0), 34) * glow
            out = out + soft[..., None] * GOLD * .72
        r = np.sqrt(((X - W / 2) / (W * .72)) ** 2 + ((Y - H / 2) / (H * .72)) ** 2)
        out = out * (1 - np.clip(r - .45, 0, 1)[..., None] * vignette * 2)
        grain = np.random.default_rng(self.seed).normal(0, .012, (H, W))
        return np.clip(out + grain[..., None], 0, 1)


def mass(seed, cx, cy, rx, ry, lobes=9):
    """A big grouped foliage shape with an uneven, natural edge."""
    r = np.random.default_rng(seed)
    ph = r.uniform(0, 6.28, 4)
    pts = []
    for i in range(30):
        a = i / 30 * 2 * np.pi
        k = 1 + .13 * np.sin(2 * a + ph[0]) + .1 * np.sin(3 * a + ph[1]) + .06 * np.sin(5 * a + ph[2]) + .035 * np.sin(8 * a + ph[3])
        pts.append((cx + rx * k * np.cos(a), cy + ry * k * np.sin(a)))
    return fill(spline(pts, n=4))


def big_leaves(seed, boxes, n, size):
    r = np.random.default_rng(seed)
    polys = []
    for x0, y0, x1, y1 in boxes:
        for _ in range(n):
            x, y, s, a = r.uniform(x0, x1), r.uniform(y0, y1), r.uniform(*size), r.uniform(0, 3.14)
            c, sn = np.cos(a), np.sin(a)
            p = np.array(LEAF, np.float32) * s
            polys.append(spline(np.stack([p[:, 0] * c - p[:, 1] * sn + x, p[:, 0] * sn + p[:, 1] * c + y], 1)))
    return fill(*polys)


# The jointed puppet ---------------------------------------------------------
# Units are head heights. x points the way the figure faces, and y points down. About 7 heads tall.

HEAD = np.array([(.24, .62), (.17, .46), (.17, .3), (.26, .14), (.42, .06), (.58, .08), (.69, .19), (.725, .31), (.71, .37), (.755, .45), (.79, .505), (.745, .54), (.735, .575), (.76, .605), (.73, .63), (.75, .655), (.715, .69), (.73, .75), (.67, .79), (.55, .78), (.4, .76), (.3, .7)], np.float32)
HEAD_PIVOT = np.array([.4, .74], np.float32)
S_HEAD = 1.34
HAIR_A = [(.3, .64), (.2, .56), (.14, .42), (.15, .26), (.25, .1), (.42, .03), (.59, .05), (.7, .15), (.62, .2), (.52, .21), (.47, .31), (.49, .42), (.42, .5), (.38, .6)]
BEARD = [(.47, .5), (.55, .59), (.65, .6), (.73, .62), (.75, .7), (.72, .8), (.6, .83), (.48, .76)]
HAIR_E = [(.62, .13), (.46, .02), (.27, .06), (.15, .24), (.14, .44), (.3, .5), (.44, .4), (.5, .24)]
HAIR_E_BACK = [(.46, .02), (.26, .05), (.1, .24), (.05, .55), (.0, 1.0), (-.02, 1.45), (.1, 1.75), (.26, 1.5), (.3, 1.0), (.34, .66), (.42, .4)]
CHEEK = [(.46, .5), (.61, .52), (.65, .65), (.52, .72), (.42, .62)]
TORSO = [(-.34, .12), (-.42, -.5), (-.44, -1.3), (-.36, -2.0), (-.14, -2.3), (.14, -2.28), (.36, -2.0), (.44, -1.35), (.34, -.6), (.32, .12), (0, .24)]
NECK = [(-.14, .12), (-.13, -.34), (.13, -.34), (.16, .12)]
UPPER = [(-.17, -.05), (.17, -.05), (.15, .6), (.12, 1.12), (-.11, 1.12), (-.16, .6)]
FORE = [(-.12, -.04), (.12, -.04), (.1, .5), (.075, 1.0), (-.075, 1.0), (-.11, .5)]
HAND = [(-.08, -.02), (.08, -.02), (.12, .16), (.1, .36), (.05, .5), (-.02, .52), (-.08, .4), (-.1, .18)]
THUMB = [(.06, .06), (.17, .16), (.18, .28), (.1, .24)]
THIGH = [(-.26, -.05), (.24, -.05), (.2, .8), (.15, 1.62), (-.14, 1.62), (-.22, .8)]
SHIN = [(-.14, -.04), (.14, -.04), (.16, .5), (.09, 1.5), (-.07, 1.5), (-.14, .5)]
FOOT = [(-.1, -.04), (.1, -.04), (.16, .1), (.62, .16), (.64, .24), (-.1, .24)]
DRAPE = [(-.42, -.42), (.4, -.46), (.44, .2), (.2, .62), (-.04, .46), (-.3, .66), (-.46, .2)]


def rot(deg):
    a = np.radians(deg)
    return np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]], np.float32)


def move(x, y):
    return np.array([[1, 0, x], [0, 1, y], [0, 0, 1]], np.float32)


def apply(mat, pts):
    p = np.array(pts, np.float32)
    q = (mat @ np.c_[p, np.ones(len(p))].T).T
    return q[:, :2]


POSES = {
    "open": dict(torso=2, neck=0, head=0, sh_f=8, el_f=10, sh_b=-6, el_b=8, hip_f=4, kn_f=2, hip_b=-4, kn_b=2),
    "offer": dict(torso=4, neck=2, head=4, sh_f=50, el_f=40, sh_b=-8, el_b=10, hip_f=2, kn_f=2, hip_b=-2, kn_b=2),
    "take": dict(torso=-2, neck=2, head=6, sh_f=46, el_f=46, sh_b=-6, el_b=6, hip_f=2, kn_f=2, hip_b=-2, kn_b=2),
    "shame": dict(torso=13, neck=14, head=20, sh_f=6, el_f=126, sh_b=2, el_b=112, hip_f=6, kn_f=6, hip_b=-4, kn_b=4, shrug=.1),
    "brace": dict(torso=36, neck=18, head=26, sh_f=16, el_f=84, sh_b=8, el_b=76, hip_f=140, kn_f=152, hip_b=128, kn_b=150, shrug=.16),
    "still": dict(torso=36, neck=18, head=25, sh_f=16, el_f=84, sh_b=8, el_b=76, hip_f=140, kn_f=152, hip_b=128, kn_b=150, shrug=.16),
    "release": dict(torso=30, neck=14, head=18, sh_f=14, el_f=78, sh_b=8, el_b=70, hip_f=140, kn_f=152, hip_b=128, kn_b=150, shrug=.07),
    "hear": dict(torso=20, neck=3, head=-6, sh_f=10, el_f=66, sh_b=6, el_b=60, hip_f=140, kn_f=152, hip_b=128, kn_b=150, shrug=0),
    "turned": dict(torso=26, neck=6, head=2, sh_f=12, el_f=78, sh_b=8, el_b=70, hip_f=140, kn_f=152, hip_b=128, kn_b=150, shrug=.1),
}


def puppet(st, x, y, u, pose, skin, hair, kind="adam", flip=False, eyes="shut", lift=3.5, drape=None, band="subject", tone=1.0, explode=0, cloak=None, arms=True):
    """Draws a figure from separate paper pieces. x and y place the hips."""
    p = POSES[pose] if isinstance(pose, str) else pose
    world = move(x, y) @ np.diag([-1.0 if flip else 1.0, 1, 1]).astype(np.float32) @ np.diag([u, u, 1]).astype(np.float32)
    width = .88 if kind == "eve" else 1.0
    torso = world @ rot(p["torso"])
    shrug = p.get("shrug", 0)
    shoulder = torso @ move(0, -2.02 - shrug)
    neck = torso @ move(.03, -2.24) @ rot(p["neck"])
    head = neck @ move(0, -.3) @ rot(p["head"])
    hd = lambda pts: apply(head @ np.diag([S_HEAD, S_HEAD, 1]).astype(np.float32) @ move(-HEAD_PIVOT[0], -HEAD_PIVOT[1]), spline(pts))

    def piece(pts, mat, smooth=True, scale=1.0):
        q = apply(mat @ np.diag([scale, 1, 1]).astype(np.float32), spline(pts) if smooth else pts)
        if explode:
            c = q.mean(0)
            q = q + (c - np.array([x, y - u * 3.2])) * explode
        return fill(q)

    def h(pts):
        q = hd(pts)
        if explode:
            c = hd(HEAD).mean(0)
            q = q + (c - np.array([x, y - u * 3.2])) * explode
        return fill(q)

    add = lambda m, c, tex="smooth", t=1.0, l=lift: st.add(m, c, l, tex, 0, 1.6, band, .36, tone * t)

    def arm(ang, bend, t, front):
        up = shoulder @ move(.02 if front else -.03, 0) @ rot(-ang)
        fo = up @ move(0, 1.08) @ rot(-bend)
        ha = fo @ move(0, .96) @ rot(-bend * .15)
        add(piece(UPPER, up), skin, t=t)
        add(piece(FORE, fo), skin, t=t)
        add(piece(HAND, ha), skin, t=t)
        add(piece(THUMB, ha), skin, t=t * .95, l=2)
        return ha

    def leg(ang, bend, t):
        th = world @ rot(-ang)
        sh = th @ move(0, 1.58) @ rot(bend)
        fo = sh @ move(0, 1.46) @ rot(-bend + ang)
        add(piece(THIGH, th), skin, t=t)
        add(piece(SHIN, sh), skin, t=t)
        add(piece(FOOT, fo), skin, t=t)

    if kind == "eve":
        add(h(HAIR_E_BACK), hair, "matte", 1.0)
    if arms:
        arm(p["sh_b"], p["el_b"], .86, False)
    leg(p["hip_b"], p["kn_b"], .86)
    add(piece(TORSO, torso, scale=width), skin, t=1.0, l=lift + 1)
    if cloak:
        add(piece([(-.5, -2.2), (.5, -2.2), (.55, -.7), (.5, .3), (-.5, .3), (-.56, -.7)], torso, scale=width), cloak, "matte", 1.0, lift + 1)
    if drape:
        add(piece(DRAPE, world @ rot(p["torso"] * .3)), drape, "matte")
    leg(p["hip_f"], p["kn_f"], 1.0)
    add(piece(NECK, neck), skin, t=.9)
    add(h(HEAD), skin, l=lift + 1)
    add(h(HAIR_E if kind == "eve" else HAIR_A), hair, "matte")
    if kind == "adam":
        add(h(BEARD), hair, "matte")
    ex, ey = hd([(.655, .365)])[0] if False else apply(head @ np.diag([S_HEAD, S_HEAD, 1]).astype(np.float32) @ move(-HEAD_PIVOT[0], -HEAD_PIVOT[1]), [(.655, .365)])[0]
    bw = apply(head @ np.diag([S_HEAD, S_HEAD, 1]).astype(np.float32) @ move(-HEAD_PIVOT[0], -HEAD_PIVOT[1]), [(.6, .325), (.715, .33)])
    a = apply(head @ np.diag([S_HEAD, S_HEAD, 1]).astype(np.float32) @ move(-HEAD_PIVOT[0], -HEAD_PIVOT[1]), [(.62, .372), (.665, .385 if eyes == "shut" else .362), (.7, .37)])
    if not explode:
        w = max(1.1, u * .018)
        st.add(np.maximum(stroke(a[0], a[1], w), stroke(a[1], a[2], w)), "#17120f", 0, "smooth", 0, 0, band, 0)
        st.add(stroke(bw[0], bw[1], max(1, u * .02)), hair, 0, "smooth", 0, 0, band, 0)
    if arms:
        arm(p["sh_f"], p["el_f"], 1.0, True)


# Scenes ---------------------------------------------------------------------

EDEN = dict(eve="#c79c79", adam="#b0805d", eve_hair="#3b2b22", adam_hair="#2b211b")
COLD = dict(eve="#a9a6a6", adam="#8f9096", eve_hair="#232634", adam_hair="#191c26", leaf="#39473f")


def hook():
    st = Stage((360, -260), "#121a2d", "#3c4a66", .8, .3, 900, "#dfe8ff", 2)
    r = np.random.default_rng(4)
    dots = np.zeros((H, W), np.float32)
    for _ in range(760):
        x, y = int(r.uniform(0, W)), int(r.uniform(0, 900))
        dots[y, x] = r.uniform(.5, 1)
    dots = cv2.GaussianBlur(cv2.dilate(dots, np.ones((2, 2))), (0, 0), .7) * 2.4
    st.img = np.clip(st.img + np.clip(dots, 0, 1)[..., None] * (hexc("#f2e6cf") - st.img), 0, 1)
    st.haze("#6a7c98", .34, 640, 1040, 1)
    st.add(fill(spline([(-60, 1000), (120, 890), (300, 930), (520, 860), (780, 950), (780, 1320), (-60, 1320)])), "#2c3852", 8, "fiber", band="far")
    st.haze("#55688a", .26, 760, 1040, 2)
    st.add(fill(spline([(-60, 1010), (170, 930), (420, 972), (780, 900), (780, 1320), (-60, 1320)])), "#1f2940", 10, "fiber", band="mid")
    st.add(fill(spline([(-60, 1320), (-60, 1080), (120, 1000), (360, 958), (600, 1005), (780, 1090), (780, 1320)])), "#0f131c", 12, "fiber", band="near")
    st.contact(360, 962, 42, 6)
    puppet(st, 360, 906, 17, "open", "#cfc5b3", "#d7cdbb", "adam", eyes="open", lift=1.2, drape=None, cloak="#cfc5b3")
    return st


def giving():
    st = Stage((120, -60), "#e4dbc2", "#cfd1b0", .84, .26, 1000, "#fff0cf", 3)
    st.add(mass(31, 420, 330, 520, 330), "#b8c2a3", 6, "matte", tear=5, band="far")
    st.haze("#e8dfc8", .4, 200, 900, 1)
    st.add(fill(np.array(trunk(0, 0, 0)) if False else spline([(610, 1000), (620, 620), (596, 300), (660, 300), (690, 640), (700, 1000)])), "#6d5a48", 8, "fiber", band="mid")
    st.add(mass(32, 620, 190, 330, 220), "#8fa27e", 9, "matte", tear=5, band="mid")
    st.add(mass(33, 40, 170, 290, 240), "#7f9471", 10, "matte", tear=5, band="mid")
    st.add(fill(spline([(-40, 1320), (-40, 900), (240, 860), (520, 880), (760, 860), (760, 1320)])), "#8d976c", 9, "fiber", band="mid")
    st.haze("#e6dcc0", .26, 520, 1010, 2)
    puppet(st, 618, 1012, 148, "take", EDEN["adam"], EDEN["adam_hair"], "adam", flip=True, eyes="open", lift=4)
    puppet(st, 108, 1022, 140, "offer", EDEN["eve"], EDEN["eve_hair"], "eve", eyes="open", lift=4)
    st.add(fill(ellipse(364, 806, 25, 33, 12)), "#7a3b35", 6, "smooth", tear=1)
    st.add(mass(34, 110, 1090, 320, 190), "#54694f", 14, "matte", tear=5, band="near")
    st.add(mass(35, 630, 1100, 320, 200), "#4b614a", 16, "matte", tear=5, band="near")
    st.add(big_leaves(36, [(-40, 1140, 760, 1340)], 12, (60, 118)), "#33473a", 22, "matte", blur=4, tear=0, band="front")
    st.add(big_leaves(37, [(420, -40, 780, 80)], 4, (54, 100)), "#3d5442", 22, "matte", blur=5, tear=0, band="front")
    return st


def forest(st, ground=1010):
    """A cold compressed forest, with the same bands in every shot."""
    for i, (x, w) in enumerate(((250, 40), (400, 46), (500, 34), (150, 36))):
        st.add(trunk(120 + i, x, w), "#3d5170", 5, "fiber", tear=2, band="far", blur=1.2)
    st.haze("#42597c", .4, 380, 1040, 1)
    st.add(fill(spline([(-40, 1320), (-40, ground - 10), (250, ground - 40), (520, ground - 34), (760, ground - 14), (760, 1320)])), "#1b2436", 8, "fiber", band="mid")
    for i, (x, w, lean) in enumerate(((326, 62, 6), (604, 58, -8))):
        st.add(trunk(130 + i, x, w, lean=lean), "#232d42", 8, "fiber", tear=3, band="mid")
    st.haze("#334766", .2, 600, 1090, 2)


def trees_near(st):
    for i, (x, w, lean) in enumerate(((10, 130, 22), (726, 150, -30))):
        st.add(trunk(140 + i, x, w, lean=lean), "#0d1119", 18, "fiber", tear=4, band="near")


def hiding():
    st = Stage((-120, 640), "#1a2438", "#27384f", .76, .42, 760, "#cfdcf2", 4)
    forest(st)
    st.contact(452, 1024, 210, 18, .6)
    puppet(st, 490, 1012, 74, "brace", COLD["eve"], COLD["eve_hair"], "eve", eyes="shut", drape=COLD["leaf"], lift=2.6)
    puppet(st, 420, 1018, 82, "turned", COLD["adam"], COLD["adam_hair"], "adam", flip=True, eyes="open", drape=COLD["leaf"], lift=2.6)
    r = np.random.default_rng(25)
    polys = []
    for rad in (180, 262):
        for k in range(15):
            a0 = -.5 + k * 1.0 / 14 + r.uniform(-.02, .02)
            x, y, sz = -90 + rad * np.cos(a0), 800 + rad * np.sin(a0), r.uniform(8, 13)
            c, sn = np.cos(a0 + 1.57), np.sin(a0 + 1.57)
            p = np.array(LEAF, np.float32) * sz
            polys.append(np.stack([p[:, 0] * c - p[:, 1] * sn + x, p[:, 0] * sn + p[:, 1] * c + y], 1))
    st.gold(fill(*polys), 3, 0)
    trees_near(st)
    st.add(mass(150, 360, 1250, 480, 130), "#0c1218", 22, "matte", tear=5, band="near")
    st.add(big_leaves(151, [(-40, 1190, 760, 1340)], 9, (60, 112)), "#0a0f14", 24, "matte", blur=4, tear=0, band="front")
    return st


def face():
    st = Stage((780, 40), "#141b2c", "#1c2739", .58, .9, 620, "#ffd98f", 5)
    forest(st, 1500)
    pose = dict(POSES["open"], torso=3, neck=2, head=-9)
    puppet(st, 300, 1650, 350, pose, "#b9926f", "#231c19", "adam", eyes="open", lift=6, cloak="#4a3a2e", arms=False)
    st.add(big_leaves(162, [(-40, 1140, 280, 1340), (560, 1100, 780, 1340)], 5, (80, 132)), "#0e141a", 24, "matte", blur=5, tear=0, band="front")
    return st


def moment():
    st = Stage((360, 1120), "#10182a", "#1b2740", .78, .32, 620, "#ffd98f", 6)
    forest(st, 1046)
    st.contact(366, 1090, 190, 18, .5)
    pool = np.exp(-(((X - 366) / 170) ** 2 + ((Y - 1100) / 30) ** 2))
    st.img = np.clip(st.img + pool[..., None] * GOLD * .5, 0, 1)
    puppet(st, 258, 1078, 36, "hear", COLD["adam"], COLD["adam_hair"], "adam", eyes="open", drape=COLD["leaf"], lift=1.6)
    puppet(st, 474, 1082, 33, "brace", COLD["eve"], COLD["eve_hair"], "eve", flip=True, eyes="shut", drape=COLD["leaf"], lift=1.6)
    st.gold(stroke((366, 640), (366, 1096), 2.4), 2, 0)
    trees_near(st)
    st.add(mass(170, 360, 1300, 480, 120), "#0a0e15", 22, "matte", tear=5, band="near")
    st.add(big_leaves(171, [(-40, 1230, 240, 1340), (500, 1230, 760, 1340)], 4, (64, 106)), "#080c11", 24, "matte", blur=4, tear=0, band="front")
    return st


def beat(pose, gold=0.0, eyes="shut"):
    """One framing, held across the 'Where are you?' beats. Only posture and light change."""
    key_light = "#cfdcf2" if not gold else "#ffdfa0"
    st = Stage((360, -80) if gold else (-120, 500), "#18223a", "#223049", .76, .34 + gold * .4, 820, key_light, 7)
    forest(st, 980)
    st.contact(360, 1020, 210, 20, .6)
    puppet(st, 262, 985, 118, pose, COLD["adam"], COLD["adam_hair"], "adam", eyes=eyes, drape=COLD["leaf"], lift=3)
    if gold:
        st.gold(stroke((460, 0), (460, 300 + 300 * gold), 2.4), 2, 0)
    trees_near(st)
    st.add(big_leaves(180, [(-40, 1120, 760, 1340)], 8, (64, 112)), "#0a0f14", 24, "matte", blur=4, tear=0, band="front")
    return st


def before():
    st = Stage((120, -60), "#e4dbc2", "#cfd1b0", .84, .26, 1000, "#fff0cf", 8)
    st.add(mass(31, 420, 330, 520, 330), "#b8c2a3", 6, "matte", tear=5)
    st.haze("#e8dfc8", .4, 200, 900, 1)
    st.add(fill(spline([(-40, 1320), (-40, 900), (240, 860), (520, 880), (760, 860), (760, 1320)])), "#8d976c", 9, "fiber")
    puppet(st, 360, 1100, 150, "open", EDEN["adam"], EDEN["adam_hair"], "adam", eyes="open", lift=4)
    st.add(mass(34, 140, 1190, 320, 170), "#54694f", 14, "matte", tear=5)
    st.add(mass(35, 600, 1200, 320, 180), "#4b614a", 16, "matte", tear=5)
    return st


def after():
    st = Stage((-120, 300), "#8a9390", "#6f7a78", .76, .3, 900, "#cfdcf2", 9)
    st.add(mass(31, 420, 330, 520, 330), "#5b6a68", 6, "matte", tear=5)
    st.haze("#7c8886", .3, 200, 900, 1)
    st.add(fill(spline([(-40, 1320), (-40, 900), (240, 860), (520, 880), (760, 860), (760, 1320)])), "#4c5650", 9, "fiber")
    puppet(st, 360, 1100, 150, "shame", "#8f8d90", "#20232c", "adam", eyes="shut", lift=4)
    st.add(mass(34, 140, 1190, 320, 170), "#2c3a36", 14, "matte", tear=5)
    st.add(mass(35, 600, 1200, 320, 180), "#27332f", 16, "matte", tear=5)
    return st


def parts():
    st = Stage((120, 60), "#e9e3d4", "#dcd6c6", .96, .1, 1200, "#fff4dc", 10)
    puppet(st, 340, 700, 112, "open", EDEN["adam"], EDEN["adam_hair"], "adam", eyes="open", lift=5, explode=.26, drape="#54694f")
    return st


SCENES = {"hook": hook, "giving": giving, "hiding": hiding, "face": face, "moment": moment, "beat1": lambda: beat("brace"), "beat2": lambda: beat("still", .55), "beat3": lambda: beat("release", .75), "beat4": lambda: beat("hear", 1.0, "open"), "before": before, "after": after, "parts": parts}


def stack(st):
    """An exploded side view of one shot, showing how the layers sit in depth."""
    order = [k for k in ("far", "haze1", "mid", "haze2", "subject", "gold", "near", "front") if k in st.bands]
    canvas = np.full((H, W, 3), .09, np.float32) + hexc("#10141c") * .5
    n = len(order)
    pw, ph = W * .62, H * .62
    for i, k in enumerate(order):
        rgb, a = st.bands[k]
        ox = 40 + i * (W - pw - 90) / max(1, n - 1) * .98
        oy = 60 + i * (H - ph - 170) / max(1, n - 1)
        src = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
        skew = ph * .12
        dst = np.float32([[ox, oy + skew], [ox + pw * .72, oy], [ox + pw * .72, oy + ph * .9], [ox, oy + ph * .9 + skew]])
        mat = cv2.getPerspectiveTransform(src, dst)
        r = cv2.warpPerspective(rgb, mat, (W, H))
        al = cv2.warpPerspective(a, mat, (W, H))
        if k.startswith("haze"):
            al = al * .55
        outline = cv2.warpPerspective(np.ones((H, W), np.float32), mat, (W, H))
        edge = outline - cv2.erode(outline, np.ones((3, 3)))
        canvas = canvas * (1 - al[..., None]) + r * al[..., None]
        canvas = canvas * (1 - edge[..., None] * .5) + edge[..., None] * .5 * .7
    return np.clip(canvas, 0, 1)


def add_text(pic, fonts):
    im = Image.fromarray((pic * 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    big = ImageFont.truetype(str(fonts / "cormorant-garamond-latin-600-italic.woff"), 88)
    small = ImageFont.truetype(str(fonts / "cormorant-garamond-latin-600-normal.woff"), 32)
    main, ref = "Where are you?", "Genesis 3:9"
    y = 420
    d.text(((W - d.textlength(main, font=big)) / 2, y), main, font=big, fill=(248, 238, 214, 255))
    d.text(((W - d.textlength(ref, font=small)) / 2, y + 112), ref, font=small, fill=(232, 222, 200, 220))
    return np.asarray(im).astype(np.float32) / 255


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--only", default="")
    a.add_argument("--fonts", required=True)
    o = a.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    names = o.only.split(",") if o.only else list(SCENES) + ["stack"]
    for n in names:
        if n == "stack":
            pic = stack(hiding())
        else:
            st = SCENES[n]()
            pic = st.film()
            if n == "moment":
                pic = add_text(pic, Path(o.fonts))
        Image.fromarray((pic * 255).astype(np.uint8)).save(OUT / f"{n}.jpg", quality=86, optimize=True)
        print(n)


if __name__ == "__main__":
    main()
