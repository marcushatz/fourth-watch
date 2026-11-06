#!/usr/bin/env python3
"""The full storyboard in the Cut Paper style. Stills only: no credits, no Higgsfield and no video.

    python3 ep11-beginning/build_storyboard_v2.py --fonts DIR [--only S01,S02]

Every frame uses the lit paper stage and the jointed figure from style_test/build_cut_paper_v2.py.
Timing and words stay in storyboard.json. This script updates the shot notes and draws frames/<id>.jpg.
"""
import argparse
import json
import sys
import textwrap
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "style_test"))
from build_style_test import H, W, X, Y, ellipse, fbm, fill, hexc, spline, stroke, trunk  # noqa: E402
from build_cut_paper_v2 import (COLD, EDEN, GOLD, HAND, LEAF, POSES, Stage, apply, big_leaves, forest, mass, move, puppet, rot, shift, trees_near)  # noqa: E402

FONTS = None
FIG = [(0, 40), (-10, 22), (-36, 26), (-22, 8), (-44, -12), (-18, -12), (-24, -38), (-6, -24), (0, -48), (6, -24), (24, -38), (18, -12), (44, -12), (22, 8), (36, 26), (10, 22)]
WALK = dict(POSES["open"], torso=5, hip_f=20, kn_f=8, hip_b=-20, kn_b=24, sh_f=-16, el_f=14, sh_b=18, el_b=18)
RUN = dict(POSES["open"], torso=16, neck=-4, head=-4, hip_f=44, kn_f=48, hip_b=-30, kn_b=64, sh_f=-28, el_f=60, sh_b=40, el_b=70)
STAND = dict(POSES["open"], torso=3, sh_f=4, el_f=12, sh_b=-6, el_b=8)


def font(name, size):
    return ImageFont.truetype(str(FONTS / name), size)


def verse_font(size):
    return font("cormorant-garamond-latin-600-italic.woff", size)


def plain_font(size):
    return font("cormorant-garamond-latin-600-normal.woff", size)


def plate(x0, y0, x1, y1):
    return fill(spline([(x0 + 6, y0), (x1 - 6, y0), (x1, y0 + 6), (x1, y1 - 6), (x1 - 6, y1), (x0 + 6, y1), (x0, y1 - 6), (x0, y0 + 6)], n=4))


def card(st, verse, ref, y, width=44):
    """A verse on its own sheet of paper, sitting high above the scene."""
    lines = textwrap.wrap(verse, 30 if len(verse) > 44 else width)
    h = 42 + len(lines) * 50 + 44
    st.add(plate(44, y, W - 44, y + h), "#efe6d2", 16, "smooth", 0, 1.6, "front", .5)
    st.labels = getattr(st, "labels", []) + [("card", lines, ref, y)]
    return st


def tag(st, text, y=1196):
    w = len(text) * 13 + 40
    st.add(plate(W / 2 - w / 2, y, W / 2 + w / 2, y + 42), "#efe6d2", 10, "smooth", 0, 1.4, "front", .46)
    st.labels = getattr(st, "labels", []) + [("tag", text, y)]
    return st


def label_all(pic, st):
    labels = getattr(st, "labels", [])
    if not labels:
        return pic
    im = Image.fromarray((pic * 255).astype(np.uint8))
    d = ImageDraw.Draw(im, "RGBA")
    for lab in labels:
        if lab[0] == "card":
            _, lines, ref, y = lab
            f, s = verse_font(40), plain_font(24)
            for i, line in enumerate(lines):
                d.text(((W - d.textlength(line, font=f)) / 2, y + 22 + i * 50), line, font=f, fill=(32, 25, 19, 255))
            r = ref.upper()
            d.text(((W - d.textlength(r, font=s)) / 2, y + 30 + len(lines) * 50), r, font=s, fill=(80, 66, 52, 255))
        elif lab[0] == "tag":
            _, text, y = lab
            s = plain_font(25)
            r = text.upper()
            d.text(((W - d.textlength(r, font=s)) / 2, y + 6), r, font=s, fill=(44, 35, 27, 255))
        elif lab[0] == "big":
            _, text, ref, y = lab
            f, s = verse_font(88), plain_font(32)
            d.text(((W - d.textlength(text, font=f)) / 2, y), text, font=f, fill=(248, 238, 214, 255))
            d.text(((W - d.textlength(ref, font=s)) / 2, y + 112), ref, font=s, fill=(232, 222, 200, 225))
        elif lab[0] == "logo":
            f = plain_font(34)
            d.text(((W - d.textlength(lab[1], font=f)) / 2, lab[2]), lab[1], font=f, fill=(236, 226, 204, 240))
    return np.asarray(im).astype(np.float32) / 255


def stars(st, n, ymax, seed=4, color="#f2e6cf"):
    r = np.random.default_rng(seed)
    dots = np.zeros((H, W), np.float32)
    for _ in range(n):
        dots[int(r.uniform(0, ymax)), int(r.uniform(0, W))] = r.uniform(.5, 1)
    dots = np.clip(cv2.GaussianBlur(cv2.dilate(dots, np.ones((2, 2))), (0, 0), .7) * 2.4, 0, 1)
    st.img = np.clip(st.img + dots[..., None] * (hexc(color) - st.img), 0, 1)


def circle(x, y, r):
    return fill(ellipse(x, y, r, r))


def arc(cx, cy, r, a0, a1, w):
    a = np.radians(np.linspace(a0, a1, 60))
    pts = np.stack([cx + r * np.cos(a), cy + r * np.sin(a)], 1)
    m = np.zeros((H * 2, W * 2), np.uint8)
    cv2.polylines(m, [np.int32(pts * 2)], False, 255, max(1, int(w * 2)), cv2.LINE_AA)
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def ribbon(pts, widths):
    """A strip of paper along a curve, with its width changing along the way."""
    c = spline(pts, closed=False, n=14)
    out = np.zeros((H * 2, W * 2), np.uint8)
    w = np.interp(np.linspace(0, 1, len(c)), np.linspace(0, 1, len(widths)), widths)
    for a, b, t in zip(c[:-1], c[1:], w):
        cv2.line(out, tuple(np.int32(a * 2)), tuple(np.int32(b * 2)), 255, max(1, int(t * 2)), cv2.LINE_AA)
    return cv2.resize(out, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def hand(st, x, y, s, angle, skin, sleeve=None, tone=1.0, curl=1.0, lift=5, band="subject", spread=7, reach=2.8):
    """A large paper hand: palm, four fingers and a thumb, each its own piece."""
    base = move(x, y) @ rot(angle) @ np.diag([s, s, 1]).astype(np.float32)
    add = lambda m, c, t=1.0, l=lift: st.add(m, c, l, "smooth", 0, 1.2, band, .4, tone * t)
    if sleeve:
        add(fill(apply(base, [(-.56, -.05), (.56, -.05), (.72, reach), (-.72, reach)])), sleeve, l=lift + 1)
    for i, (bx, ln) in enumerate(((-.34, 1.0), (-.12, 1.14), (.1, 1.06), (.32, .84))):
        tip = base @ move(bx, -.94) @ rot((i - 1.5) * spread)
        add(fill(apply(tip, spline([(-.1, .08), (-.095, -ln * curl * .6), (-.06, -ln * curl), (.06, -ln * curl), (.095, -ln * curl * .6), (.1, .08)], n=5))), skin, .97)
    add(fill(apply(base, spline([(-.46, .02), (.46, .02), (.52, -.62), (.46, -1.02), (-.46, -1.02), (-.52, -.62)], n=6))), skin)
    th = base @ move(.46, -.34) @ rot(40)
    add(fill(apply(th, spline([(-.12, .1), (-.1, -.42), (-.04, -.7), (.08, -.7), (.13, -.4), (.12, .1)], n=5))), skin, .95)


def hanging(st, word, y_word, draw_shape, fall=0.0, seed=1):
    """An idea hung on threads above the stage. The thread snaps when the idea fails."""
    r = np.random.default_rng(seed)
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    f = plain_font(92)
    w = d.textlength(word, font=f)
    d.text(((W - w) / 2, y_word), word, font=f, fill=255)
    mask = np.asarray(im).astype(np.float32) / 255
    if fall:
        mat = cv2.getRotationMatrix2D((W * .26, y_word + 40), -fall * 16, 1)
        mat[1, 2] += fall * 60
        mask = cv2.warpAffine(mask, mat, (W, H))
    st.add(stroke((W * .26, 0), (W * .26, y_word + 8), 1.5), "#d8cfbb", 2, "smooth", 0, 0, "subject", .2)
    if fall:
        st.add(stroke((W * .74, 0), (W * .74, y_word - 120), 1.5), "#d8cfbb", 2, "smooth", 0, 0, "subject", .2)
        st.add(stroke((W * .74 + 12, y_word - 50 + fall * 120), (W * .74 + 34, y_word + 40 + fall * 120), 1.5), "#d8cfbb", 2, "smooth", 0, 0, "subject", .2)
    else:
        st.add(stroke((W * .74, 0), (W * .74, y_word + 8), 1.5), "#d8cfbb", 2, "smooth", 0, 0, "subject", .2)
    st.add(mask, "#efe6d2", 7, "smooth", 0, 0, "subject", .5)
    draw_shape(fall)


def space(st, earth=(360, 1060), r=62):
    stars(st, 520, H)
    a = ribbon([(360, 430), (450, 470), (520, 420), (500, 320), (390, 262), (250, 300), (172, 420), (216, 560), (350, 640), (520, 620), (640, 520)], [42, 34, 30, 24, 20, 14, 10, 6])
    b = ribbon([(360, 430), (270, 390), (200, 440), (220, 540), (330, 600), (470, 570), (556, 460), (530, 330), (420, 240), (280, 210), (130, 270)], [42, 34, 30, 24, 20, 14, 10, 6])
    st.add(np.maximum(a, b), "#34405f", 6, "matte", tear=5, band="far")
    st.add(circle(360, 430, 46), "#55638a", 7, "matte", band="far")
    st.add(circle(566, 820, 26), "#d9c9a0", 6, "smooth", band="mid")
    earth_at(st, earth[0], earth[1], r)


def earth_at(st, x, y, r, sea="#34507a", land="#6d7f5e", seed=3, lift=8):
    st.add(circle(x, y, r), sea, lift, "matte", band="mid")
    disc = circle(x, y, r - 1)
    rng = np.random.default_rng(seed)
    out = np.zeros((H, W), np.float32)
    for i in range(4):
        a, d = rng.uniform(0, 6.28), rng.uniform(.1, .6) * r
        out = np.maximum(out, mass(seed + i, x + d * np.cos(a), y + d * np.sin(a), r * rng.uniform(.26, .44), r * rng.uniform(.2, .36), 6))
    st.add(out * disc, land, 3, "matte", 2, band="mid")
    return out * disc


def hill_person(st, gold=False):
    st.haze("#6a7c98", .34, 640, 1040, 1)
    st.add(fill(spline([(-60, 1000), (120, 890), (300, 930), (520, 860), (780, 950), (780, 1320), (-60, 1320)])), "#2c3852", 8, "fiber", band="far")
    st.haze("#55688a", .26, 760, 1040, 2)
    st.add(fill(spline([(-60, 1010), (170, 930), (420, 972), (780, 900), (780, 1320), (-60, 1320)])), "#1f2940", 10, "fiber", band="mid")
    if gold:
        st.img = np.clip(st.img + np.exp(-(((X - 360) / 240) ** 2 + ((Y - 900) / 300) ** 2))[..., None] * GOLD * .42, 0, 1)
    st.add(fill(spline([(-60, 1320), (-60, 1080), (120, 1000), (360, 958), (600, 1005), (780, 1090), (780, 1320)])), "#0f131c", 12, "fiber", band="near")
    st.contact(360, 960, 34, 4, .8)
    pose = dict(POSES["open"], sh_f=26, el_f=8, sh_b=-22, el_b=8, head=-8) if gold else POSES["open"]
    puppet(st, 360, 906, 17, pose, "#cfc5b3", "#d7cdbb", "you", eyes="open", lift=1.2, cloak="#cfc5b3")
    if gold:
        st.gold(arc(360, 870, 74, 205, 335, 2.0), 2, 0)
        st.gold(arc(360, 870, 118, 215, 325, 1.8), 2, 0)


# The 34 frames --------------------------------------------------------------

def s01():
    st = Stage((360, -200), "#0f1526", "#1a2238", .84, .22, 1000, "#dfe8ff", 11)
    space(st)
    return st


def s02():
    st = Stage((360, -260), "#121a2d", "#3c4a66", .8, .3, 900, "#dfe8ff", 2)
    stars(st, 760, 900)
    hill_person(st)
    return st


def s03():
    st = Stage((540, 150), "#e3dcc6", "#cfd4c0", .84, .3, 1100, "#fff0cf", 13)
    st.add(circle(540, 210, 74), "#efe0ae", 5, "smooth", band="far")
    st.add(fill([(-20, 700), (150, 400), (280, 560), (430, 340), (640, 640), (760, 560), (760, 760), (-20, 760)]), "#aab1a6", 7, "fiber", tear=6, band="far")
    st.haze("#e3dcc6", .3, 300, 720, 1)
    st.add(fill([(-20, 720), (120, 560), (300, 690), (520, 600), (760, 700), (760, 800), (-20, 800)]), "#8e9a8e", 8, "fiber", tear=6, band="mid")
    for i, (y, c) in enumerate(((730, "#7f98a0"), (790, "#6b8792"), (860, "#5a7683"), (930, "#4a6573"))):
        pts = [(-40, y + 8 * np.sin(k * 1.3 + i)) for k in range(1)] + [(x, y + 11 * np.sin(x / 70 + i * 2)) for x in range(-40, 790, 60)] + [(790, 1320), (-40, 1320)]
        st.add(fill(np.array(pts, np.float32)), c, 7 + i, "matte", tear=2, band="near")
    for x, y, s in ((170, 250, 1.1), (232, 214, 1.3), (292, 262, 1.0)):
        st.add(fill(spline([(x - 30 * s, y), (x - 14 * s, y - 14 * s), (x, y), (x + 14 * s, y - 14 * s), (x + 30 * s, y), (x + 14 * s, y - 6 * s), (x, y + 8 * s), (x - 14 * s, y - 6 * s)], n=4)), "#3a342c", 4, "smooth", tear=1)
    card(st, "nor is he served by human hands, as though he needed anything", "Acts 17:25", 960)
    return st


def s04():
    st = Stage((130, 60), "#d9cdb2", "#b9a688", .9, .3, 900, "#fff0cf", 14)
    st.add(mass(141, 560, 200, 340, 260), "#c7b89b", 7, "matte", tear=5, band="far")
    hand(st, 404, 330, 118, 186, "#a97f5e", "#4c5a6c", curl=.72, spread=5, reach=4)
    hand(st, 366, 682, 74, 6, "#c79c79", "#b86f4a", curl=.84, spread=6, reach=11)
    return st


def s05():
    st = Stage((200, -100), "#2a3448", "#1c2434", .8, .4, 1000, "#cfdcf2", 15)
    for i, (r, c) in enumerate(((560, "#253047"), (430, "#2c3852"), (300, "#35425f"), (170, "#3e4c6b"))):
        st.add(mass(150 + i, 360, 640, r * .84, r), c, 8, "fiber", tear=6, band="mid")
    st.raw = None
    m = fill(np.array([(352, 650), (372, 650), (640, 1120), (560, 1160)], np.float32))
    st.img = st.img * (1 - cv2.GaussianBlur(m, (0, 0), 5)[..., None] * .5)
    st.contact(362, 650, 22, 7, .6)
    puppet(st, 362, 588, 18, dict(POSES["open"], sh_f=30, el_f=12, sh_b=-26, el_b=12), "#cfc5b3", "#d7cdbb", "you", eyes="open", lift=1.2, cloak="#cfc5b3")
    return st


def s06():
    st = Stage((360, -120), "#141a2a", "#1e2638", .84, .3, 1000, "#fff0cf", 16)
    stars(st, 220, H, 6)

    def shape(fall):
        dy = fall * 70
        pieces = [fill([(200, 640 + dy), (520, 640 + dy), (520, 666 + dy), (200, 666 + dy)]), fill([(226, 660 + dy), (252, 660 + dy), (244, 860 + dy), (232, 860 + dy)]), fill([(468, 660 + dy), (494, 660 + dy), (488, 860 + dy), (476, 860 + dy)]), fill([(96, 560 + dy), (116, 560 + dy), (116, 740 + dy), (186, 740 + dy), (186, 860 + dy), (168, 860 + dy), (168, 762 + dy), (116, 762 + dy), (116, 860 + dy), (96, 860 + dy)])]
        st.add(np.maximum.reduce(pieces), "#c9bea7", 7, "matte", tear=1.5, band="subject")
        tilt = cv2.getRotationMatrix2D((590, 720), -24, 1)
        tilt[1, 2] += 60
        chair = fill([(610, 560), (630, 560), (630, 740), (534, 740), (534, 860), (552, 860), (552, 762), (610, 762), (610, 860), (630, 860), (630, 760)])
        st.add(cv2.warpAffine(chair, tilt, (W, H)), "#c9bea7", 7, "matte", tear=1.5, band="subject")
        st.add(circle(360, 420, 34), "#d9c9a0", 5, "smooth", tear=1)
        st.add(stroke((360, 0), (360, 390), 1.5), "#d8cfbb", 2, "smooth", 0, 0, "subject", .2)
    hanging(st, "LONELY?", 180, shape, 1.0, 16)
    return st


def s07():
    st = Stage((360, -120), "#141a2a", "#1e2638", .84, .3, 1000, "#fff0cf", 17)
    stars(st, 240, H, 7)

    def shape(fall):
        rows = ((760, 8, 58, "#a9a08c"), (850, 7, 68, "#bcb29c"), (950, 6, 78, "#cfc5ae"))
        for y, n, h, c in rows:
            parts = []
            for i in range(n):
                x = 80 + (i + .5) * 560 / n
                parts.append(fill(spline([(x - h * .13, y), (x - h * .12, y - h * .5), (x - h * .28, y - h * .92), (x - h * .22, y - h * .96), (x - h * .08, y - h * .62), (x + h * .08, y - h * .62), (x + h * .22, y - h * .96), (x + h * .28, y - h * .92), (x + h * .12, y - h * .5), (x + h * .13, y)], n=4)))
                parts.append(circle(x, y - h * .72, h * .1))
            strip = fill([(40, y - 2), (680, y - 2), (680, y + 90), (40, y + 90)])
            st.add(np.maximum.reduce(parts + [strip]), c, 8, "matte", tear=2, band="subject")
    hanging(st, "WORSHIP?", 180, shape, 1.0, 17)
    return st


def s08():
    st = Stage((360, 420), "#0f1526", "#18223a", .7, .55, 520, "#ffd98f", 18)
    stars(st, 240, H, 8)
    st.add(fill(spline([(-40, 800), (130, 740), (330, 790), (560, 720), (760, 780), (760, 1320), (-40, 1320)])), "#2f4a66", 8, "matte", tear=5, band="mid")
    st.add(fill(spline([(-40, 930), (200, 840), (420, 900), (760, 820), (760, 1320), (-40, 1320)])), "#3e5240", 10, "fiber", tear=5, band="near")
    st.add(fill(spline([(600, 840), (612, 640), (592, 520), (650, 520), (660, 640), (672, 840)])), "#3c3026", 8, "fiber", band="near")
    st.add(mass(181, 626, 470, 104, 92), "#5e7a58", 10, "matte", tear=4, band="near")
    for x, y, s in ((560, 180, 1.0), (620, 150, 1.2), (500, 230, .9)):
        st.add(fill(spline([(x - 30 * s, y), (x - 14 * s, y - 14 * s), (x, y), (x + 14 * s, y - 14 * s), (x + 30 * s, y), (x + 14 * s, y - 6 * s), (x, y + 8 * s), (x - 14 * s, y - 6 * s)], n=4)), "#ece5d6", 4, "smooth", tear=1)
    rr = np.random.default_rng(8)
    rays = []
    for i in range(28):
        a = i / 28 * 2 * np.pi
        c, s = np.cos(a), np.sin(a)
        ln = rr.uniform(130, 340)
        rays.append(fill([(360 + 58 * c - 3 * s, 430 + 58 * s + 3 * c), (360 + 58 * c + 3 * s, 430 + 58 * s - 3 * c), (360 + ln * c, 430 + ln * s)]))
    st.gold(np.maximum.reduce(rays), 3, 0)
    st.gold(circle(360, 430, 46), 4, 1)
    card(st, "by your will they existed and were created", "Revelation 4:11", 980)
    return st


def eden_back(st):
    st.add(mass(31, 420, 330, 520, 330), "#b8c2a3", 6, "matte", tear=5, band="far")
    st.haze("#e8dfc8", .4, 200, 900, 1)


def s09():
    st = Stage((120, -60), "#e4dbc2", "#cfd1b0", .84, .26, 1000, "#fff0cf", 19)
    eden_back(st)
    st.add(fill(spline([(90, 860), (100, 560), (76, 300), (140, 300), (170, 560), (182, 860)])), "#6d5a48", 8, "fiber", band="mid")
    st.add(mass(33, 90, 220, 300, 230), "#7f9471", 10, "matte", tear=5, band="mid")
    st.add(mass(32, 660, 240, 240, 220), "#8fa27e", 9, "matte", tear=5, band="mid")
    st.add(fill(spline([(-40, 1320), (-40, 840), (240, 790), (520, 810), (760, 790), (760, 1320)])), "#8d976c", 9, "fiber", band="mid")
    st.contact(330, 952, 38, 5, .5).contact(420, 958, 38, 5, .5)
    puppet(st, 420, 862, 32, WALK, EDEN["adam"], EDEN["adam_hair"], "adam", eyes="open", lift=1.6)
    puppet(st, 330, 856, 30, WALK, EDEN["eve"], EDEN["eve_hair"], "eve", eyes="open", lift=1.6)
    st.add(mass(35, 360, 1160, 520, 220), "#54694f", 14, "matte", tear=5, band="near")
    m = cv2.GaussianBlur(mass(196, 640, 1040, 420, 400), (0, 0), 14)
    st.img = st.img * (1 - m[..., None] * .5)
    return st


def s10():
    st = Stage((120, -60), "#8d976c", "#7f8d62", .9, .22, 1000, "#fff0cf", 20)
    for i, (x, y, r) in enumerate(((60, 90, 150), (360, 40, 130), (650, 110, 150), (690, 440, 130), (40, 460, 120), (60, 1020, 150), (690, 980, 150), (370, 1220, 150))):
        st.add(mass(200 + i, x, y, r, r * .92), "#5d6e50" if i % 2 else "#6b7c5c", 12, "matte", tear=5, band="near")
    st.add(mass(209, 360, 640, 120, 112), "#3a4a36", 14, "matte", tear=5, band="subject")
    st.contact(250, 882, 18, 5, .4).contact(290, 888, 18, 5, .4)
    puppet(st, 250, 836, 20, STAND, EDEN["adam"], EDEN["adam_hair"], "adam", eyes="open", lift=1.2)
    puppet(st, 292, 842, 19, STAND, EDEN["eve"], EDEN["eve_hair"], "eve", eyes="open", lift=1.2)
    for r in (210, 280, 350):
        st.gold(arc(360, -100, r, 60, 120, 2.4), 2, 0)
    tag(st, "Genesis 2:17")
    return st


def s11():
    st = Stage((640, -40), "#d3cfb2", "#b8bd9a", .78, .34, 900, "#fff0cf", 21)
    st.add(mass(211, 300, 420, 460, 340), "#a9b393", 6, "matte", tear=5, band="far")
    st.haze("#d8d2b6", .3, 260, 900, 1)
    st.add(ribbon([(-40, 240), (160, 210), (360, 250), (560, 200), (780, 230)], [64, 54, 46, 40, 34]), "#54442f", 9, "fiber", band="mid")
    st.add(mass(212, 120, 60, 300, 170), "#58704f", 11, "matte", tear=5, band="mid")
    st.add(mass(213, 640, 40, 260, 150), "#4f6648", 11, "matte", tear=5, band="mid")
    st.add(stroke((360, 244), (360, 300), 3), "#3e3225", 4, "smooth", 0, 1)
    st.add(fill(ellipse(360, 332, 25, 33, 8)), "#7a3b35", 6, "smooth", tear=1)
    puppet(st, 520, 1110, 152, dict(POSES["open"], torso=-2, neck=-3, head=-8, sh_f=8, el_f=24, sh_b=-6, el_b=10), EDEN["eve"], EDEN["eve_hair"], "eve", flip=True, eyes="open", lift=4)
    st.add(ribbon([(120, 230), (84, 340), (180, 420), (128, 520), (220, 590), (292, 560)], [28, 24, 22, 20, 16, 12]), "#27352c", 10, "fiber", tear=1.5)
    st.add(fill(ellipse(304, 556, 34, 20, -8)), "#27352c", 10, "smooth", tear=1)
    st.add(circle(316, 548, 3.4), "#e6dcc0", 0, "smooth", tear=0, shadow=0)
    st.add(mass(214, 200, 1130, 360, 190), "#4f654b", 14, "matte", tear=5, band="near")
    st.add(mass(215, 640, 1160, 260, 170), "#475d46", 16, "matte", tear=5, band="near")
    tag(st, "Genesis 3:5")
    return st


def s12():
    st = Stage((120, -60), "#cfcdae", "#b4bb97", .84, .34, 900, "#fff0cf", 22)
    st.add(mass(221, 560, 300, 330, 330), "#93a381", 7, "matte", tear=5, band="far")
    pose = dict(POSES["open"], torso=2, neck=2, head=3)
    puppet(st, 170, 1640, 330, pose, EDEN["eve"], EDEN["eve_hair"], "eve", eyes="shut", lift=6, arms=False)
    st.add(fill(ellipse(506, 742, 74, 92, 14)), "#7a3b35", 8, "smooth", tear=1.5)
    st.add(circle(452, 712, 34), "#c9b29a", 2, "smooth", tear=1, shadow=.2)
    hand(st, 566, 980, 104, -12, EDEN["eve"], EDEN["eve"], curl=.62, lift=6, spread=4, reach=5)
    return st


def s13():
    st = Stage((120, -60), "#e4dbc2", "#cfd1b0", .84, .26, 1000, "#fff0cf", 3)
    eden_back(st)
    st.add(fill(spline([(610, 1000), (620, 620), (596, 300), (660, 300), (690, 640), (700, 1000)])), "#6d5a48", 8, "fiber", band="mid")
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
    return st


def fig_leaf(x, y, s, a):
    """A fig leaf: five rounded lobes around a stem."""
    out = np.zeros((H, W), np.float32)
    for ang, ln in ((-112, 26), (-58, 36), (0, 46), (58, 36), (112, 26)):
        r = np.radians(a + ang - 90)
        cx, cy = x + np.cos(r) * ln * s * .62, y + np.sin(r) * ln * s * .62
        out = np.maximum(out, fill(ellipse(cx, cy, ln * s * .62, ln * s * .3, a + ang)))
    return np.maximum(out, circle(x, y, 16 * s))


def s14():
    st = Stage((-120, 300), "#8a9390", "#6f7a78", .8, .3, 900, "#cfdcf2", 24)
    st.add(mass(241, 360, 300, 480, 330), "#5b6a68", 6, "matte", tear=5, band="far")
    st.add(fig_leaf(236, 520, 4.6, -22), "#3f5044", 9, "matte", tear=1.5)
    st.add(fig_leaf(476, 600, 5.0, 18), "#37483d", 10, "matte", tear=1.5)
    st.add(ribbon([(300, 560), (340, 590), (380, 566), (416, 600)], [3, 3, 3, 3]), "#e8e0cf", 2, "smooth", 0, 0)
    hand(st, 190, 890, 108, 26, "#8f8d90", "#8f8d90", curl=.62, spread=3, reach=7)
    hand(st, 530, 910, 108, -28, "#8a898c", "#8a898c", curl=.62, spread=3, reach=7)
    return st


def s15():
    st = Stage((-120, 560), "#8a9390", "#6f7a78", .76, .34, 800, "#cfdcf2", 25)
    st.add(mass(251, 180, 300, 420, 300), "#5b6a68", 6, "matte", tear=5, band="far")
    for i, (x, w, lean) in enumerate(((520, 90, -20), (640, 120, -10), (430, 50, -30))):
        st.add(trunk(260 + i, x, w, lean=lean), "#232d3e", 10, "fiber", tear=4, band="mid")
    st.add(mass(255, 640, 180, 260, 280), "#1c2536", 11, "matte", tear=5, band="mid")
    st.add(fill(spline([(-40, 1320), (-40, 880), (260, 850), (520, 870), (760, 840), (760, 1320)])), "#4c5650", 9, "fiber", band="mid")
    st.contact(170, 968, 34, 5, .5).contact(290, 972, 34, 5, .5)
    puppet(st, 170, 880, 36, RUN, "#8f8d90", COLD["adam_hair"], "adam", eyes="open", drape=COLD["leaf"], lift=1.8)
    puppet(st, 290, 884, 34, RUN, "#a4a2a2", COLD["eve_hair"], "eve", eyes="open", drape=COLD["leaf"], lift=1.8)
    r = np.random.default_rng(7)
    blades, tips = [], []
    for x in range(-10, 760, 26):
        h = r.uniform(150, 280)
        lean = 90 if x < 330 else 22
        blades.append(ribbon([(x, 1320), (x + lean * .3, 1320 - h * .6), (x + lean, 1320 - h)], [20, 12, 2]))
        if x < 330:
            tips.append(ribbon([(x + lean * .62, 1320 - h * .84), (x + lean, 1320 - h)], [3, 1.5]))
    st.add(np.maximum.reduce(blades), "#2b3a34", 14, "matte", tear=1, band="near")
    st.gold(np.maximum.reduce(tips), 2, 0)
    card(st, "And they heard the sound of the LORD God walking in the garden", "Genesis 3:8", 64)
    return st


def canopy(st):
    for i, (x, y, r) in enumerate(((60, 90, 170), (360, 30, 150), (650, 110, 170), (20, 460, 150), (700, 480, 150), (70, 860, 170), (660, 860, 170), (360, 1110, 190))):
        st.add(mass(270 + i, x, y, r, r * .92), "#202a3d" if i % 2 else "#273349", 14, "matte", tear=5, band="near")


def top_people(st):
    st.add(mass(275, 366, 590, 210, 230), "#3c4d6a", 6, "fiber", tear=5, band="mid")
    st.contact(362, 640, 96, 9, .7)
    puppet(st, 396, 632, 34, "brace", COLD["eve"], COLD["eve_hair"], "eve", eyes="shut", drape=COLD["leaf"], lift=1.6)
    puppet(st, 332, 636, 37, "brace", COLD["adam"], COLD["adam_hair"], "adam", flip=True, eyes="shut", drape=COLD["leaf"], lift=1.6)


def s16():
    st = Stage((360, -300), "#2c3a52", "#26334a", .86, .3, 1000, "#cfdcf2", 26)
    top_people(st)
    canopy(st)
    card(st, "And no creature is hidden from his sight", "Hebrews 4:13", 1000)
    return st


def hide(gold=False, dim=False):
    st = Stage((-120, 640), "#1a2438", "#27384f", .76, .42, 760, "#cfdcf2", 4)
    forest(st)
    st.contact(452, 1020, 170, 12, .75)
    puppet(st, 490, 1012, 74, "brace", COLD["eve"], COLD["eve_hair"], "eve", eyes="shut", drape=COLD["leaf"], lift=2.6)
    puppet(st, 420, 1018, 82, "turned" if gold else "brace", COLD["adam"], COLD["adam_hair"], "adam", flip=True, eyes="open" if gold else "shut", drape=COLD["leaf"], lift=2.6)
    if gold:
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


def s19():
    st = Stage((-120, 300), "#8a9390", "#6f7a78", .8, .3, 900, "#cfdcf2", 29)
    st.add(mass(291, 560, 300, 330, 300), "#5b6a68", 6, "matte", tear=5, band="far")
    st.add(fig_leaf(190, 300, 3.0, -28), "#6b6147", 8, "matte", tear=2)
    hand(st, 380, 560, 112, 176, "#8f8d90", "#4c5560", curl=.84, spread=9)
    r = np.random.default_rng(9)
    d = np.zeros((H, W), np.float32)
    for _ in range(460):
        x, y = r.normal(372, 34 + 0), r.uniform(700, 1180)
        x = x + (y - 700) * .05 + r.normal(0, (y - 700) * .06)
        cv2.circle(d, (int(x), int(y)), int(r.choice((1, 1, 2, 3))), 1.0, -1, cv2.LINE_AA)
    st.add(d, "#3b3a36", 1.5, "smooth", 0, 0, "subject", .2)
    tag(st, "Genesis 3:19")
    return st


def edge(st):
    st.add(circle(560, 470, 54), "#e6d7ae", 5, "smooth", band="far")
    st.add(fill(spline([(-40, 1320), (-40, 800), (240, 770), (500, 790), (760, 760), (760, 1320)])), "#a58f68", 9, "fiber", tear=5, band="mid")


def s20():
    st = Stage((560, 470), "#d2bf97", "#c4ab80", .84, .3, 900, "#fff0cf", 30)
    edge(st)
    st.add(trunk(301, 120, 90), "#3f3428", 10, "fiber", tear=4, band="near")
    st.add(mass(302, 60, 330, 300, 380), "#3f4e3b", 12, "matte", tear=5, band="near")
    st.add(mass(303, 30, 820, 240, 200), "#4a5a44", 14, "matte", tear=5, band="near")
    st.contact(422, 906, 22, 4, .55).contact(472, 910, 22, 4, .55)
    puppet(st, 422, 838, 27, WALK, "#9a7c62", COLD["adam_hair"], "adam", eyes="open", drape=COLD["leaf"], lift=1.4)
    puppet(st, 472, 842, 25, WALK, "#ab8e74", COLD["eve_hair"], "eve", eyes="open", drape=COLD["leaf"], lift=1.4)
    tag(st, "Genesis 3:23")
    return st


def s21():
    st = Stage((360, -60), "#b7a27c", "#8f8263", .74, .5, 760, "#ffd98f", 31)
    edge(st)
    st.add(mass(303, 30, 500, 240, 420), "#4a5a44", 10, "matte", tear=5, band="mid")
    puppet(st, 216, 990, 128, STAND, "#a07f64", COLD["adam_hair"], "adam", eyes="open", lift=3.4, cloak="#7b5a3c", arms=False)
    puppet(st, 490, 1000, 118, dict(STAND, head=-4), "#b39478", COLD["eve_hair"], "eve", flip=True, eyes="open", lift=3.4, cloak="#8a6846", arms=False)
    for x, y, a in ((96, 840, -30), (352, 880, 40), (620, 830, 12)):
        st.add(fig_leaf(x, y, 1.1, a), "#6a7458", 5, "matte", tear=1)
    for r in (240, 300):
        st.gold(arc(360, -60, r, 58, 122, 2.4), 2, 0)
    card(st, "And the LORD God made for Adam and for his wife garments of skins and clothed them", "Genesis 3:21", 950)
    return st


def s22():
    st = Stage((640, -40), "#6f6250", "#4d4538", .66, .7, 620, "#ffd98f", 32)
    st.add(mass(321, 110, 420, 280, 520), "#3f3a30", 7, "matte", tear=5, band="far")
    puppet(st, 420, 1640, 318, dict(POSES["open"], torso=2, neck=0, head=-7), "#b89a80", COLD["eve_hair"], "eve", flip=True, eyes="open", lift=6, cloak="#8a6846", arms=False)
    hand(st, 200, 1140, 104, 20, "#b89a80", "#8a6846", curl=.8, lift=6, spread=5)
    return st


def s23():
    st = Stage((360, -240), "#0f1526", "#1a2238", .84, .34, 1100, "#dfe8ff", 33)
    stars(st, 540, H, 13)
    earth_at(st, 360, 520, 250, lift=12)
    st.gold(circle(420, 500, 8), 2, 0)
    st.gold(arc(420, 500, 34, 0, 359, 1.8), 2, 0)
    card(st, "For God so loved the world,", "John 3:16", 900)
    return st


def s24():
    st = Stage((360, 400), "#1b2238", "#2a2a38", .72, .5, 640, "#ffd98f", 34)
    st.img = np.clip(st.img + np.exp(-(((X - 360) / 300) ** 2 + ((Y - 480) / 320) ** 2))[..., None] * GOLD * .5, 0, 1)
    st.add(fill(spline([(-40, 1320), (-40, 830), (180, 760), (360, 700), (540, 760), (760, 830), (760, 1320)])), "#23202c", 10, "fiber", tear=5, band="near")
    bar = np.maximum(fill([(353, 712), (367, 712), (367, 500), (353, 500)]), fill([(306, 548), (414, 548), (414, 560), (306, 560)]))
    st.gold(bar, 3, 1)
    st.add(np.maximum.reduce([ribbon([(308, 554), (360, 562), (412, 554)], [6, 8, 6]), ribbon([(360, 556), (360, 590), (358, 636)], [18, 16, 8])]), "#c98a5e", 3, "smooth", tear=.8)
    st.add(ribbon([(350, 584), (360, 612), (368, 586)], [20, 18, 18]), "#e6dcc8", 2, "smooth", tear=.6)
    st.add(circle(360, 540, 8), "#c98a5e", 2, "smooth", tear=.4)
    card(st, "that he gave his only Son", "John 3:16", 960)
    return st


def s26():
    st = Stage((-160, 300), "#141b2c", "#1c2739", .7, .46, 780, "#cfdcf2", 36)
    forest(st, 1500)
    pose = dict(POSES["open"], torso=12, neck=12, head=14, shrug=.12)
    puppet(st, 200, 1600, 330, pose, "#8f9096", "#191c26", "adam", eyes="shut", lift=6, arms=False, cloak="#39473f")
    st.add(big_leaves(362, [(-40, 1120, 240, 1340), (560, 1040, 780, 1340)], 6, (80, 130)), "#0e141a", 24, "matte", blur=5, tear=0, band="front")
    st.add(big_leaves(363, [(560, -40, 780, 180)], 3, (70, 120)), "#0e141a", 22, "matte", blur=5, tear=0, band="front")
    return st


def s27():
    st = Stage((360, 1120), "#10182a", "#1b2740", .78, .32, 620, "#ffd98f", 6)
    forest(st, 1046)
    st.contact(258, 1090, 70, 8, .7).contact(474, 1094, 64, 8, .7)
    pool = np.exp(-(((X - 366) / 170) ** 2 + ((Y - 1100) / 30) ** 2))
    st.img = np.clip(st.img + pool[..., None] * GOLD * .5, 0, 1)
    puppet(st, 258, 1078, 36, "hear", COLD["adam"], COLD["adam_hair"], "adam", eyes="open", drape=COLD["leaf"], lift=1.6)
    puppet(st, 474, 1082, 33, "brace", COLD["eve"], COLD["eve_hair"], "eve", flip=True, eyes="shut", drape=COLD["leaf"], lift=1.6)
    st.gold(stroke((366, 640), (366, 1096), 2.4), 2, 0)
    trees_near(st)
    st.add(mass(170, 360, 1300, 480, 120), "#0a0e15", 22, "matte", tear=5, band="near")
    st.labels = [("big", "Where are you?", "Genesis 3:9", 420)]
    return st


def s28():
    st = Stage((360, -300), "#2c3a52", "#26334a", .86, .3, 1000, "#cfdcf2", 26)
    top_people(st)
    canopy(st)
    st.gold(arc(364, 596, 150, 0, 359, 2.4), 2, 0)
    return st


def s29():
    st = Stage((360, -80), "#1c2638", "#1a2333", .6, .9, 680, "#ffd98f", 39)
    forest(st, 1500)
    st.img = np.clip(st.img + np.exp(-(((X - 360) / 300) ** 2 + ((Y + 40) / 440) ** 2))[..., None] * GOLD * .42, 0, 1)
    p = dict(POSES["open"], torso=0, neck=-2, head=-12)
    puppet(st, 104, 1560, 214, p, "#a18a76", "#1a1c24", "adam", eyes="open", lift=5, arms=False, cloak="#39473f")
    puppet(st, 612, 1590, 200, p, "#b09a86", "#1f2230", "eve", flip=True, eyes="open", lift=5, arms=False, cloak="#39473f")
    for r in (250, 330):
        st.gold(arc(360, -110, r, 62, 118, 2.2), 2, 0)
    return st


def s30():
    st = Stage((640, 280), "#343446", "#26263a", .64, .62, 560, "#dfe6f2", 40)
    st.add(fill([(452, 150), (668, 150), (668, 620), (452, 620)]), "#8a8ba0", 6, "smooth", tear=1.2, band="far")
    st.add(np.maximum(fill([(556, 150), (564, 150), (564, 620), (556, 620)]), fill([(452, 380), (668, 380), (668, 388), (452, 388)])), "#343446", 3, "smooth", tear=.6, band="far")
    m = cv2.GaussianBlur(fill(np.array([(452, 620), (668, 620), (420, 1320), (40, 1320)], np.float32)), (0, 0), 14)
    st.img = np.clip(st.img + m[..., None] * hexc("#7c7e96") * .2, 0, 1)
    puppet(st, 90, 1640, 330, dict(POSES["open"], torso=8, neck=4, head=2), "#a9927e", "#231f26", "you", eyes="open", lift=6, cloak="#556070", arms=False)
    hand(st, 120, 1200, 92, 24, "#a9927e", "#556070", curl=.8, spread=5)
    return st


def s31():
    st = Stage((360, -200), "#0f1526", "#1a2238", .84, .22, 1000, "#dfe8ff", 11)
    space(st, (360, 1100), 34)
    return st


def s32():
    st = Stage((360, -240), "#0f1526", "#141c30", .78, .24, 1100, "#dfe8ff", 42)
    stars(st, 500, H, 21)
    land = earth_at(st, 360, 640, 300, sea="#1b2438", land="#2c3440", seed=8, lift=12)
    r = np.random.default_rng(5)
    dots = np.zeros((H, W), np.float32)
    ys, xs = np.nonzero(land > .5)
    for i in r.choice(len(xs), 420):
        cv2.circle(dots, (int(xs[i]), int(ys[i])), int(r.choice((1, 2, 2, 3))), 1.0, -1, cv2.LINE_AA)
    st.gold(dots, 1, 0)
    return st


def s33():
    st = Stage((520, 760), "#3a3448", "#6f5a4c", .68, .6, 620, "#ffd98f", 43)
    st.gold(circle(520, 800, 60), 2, 1)
    st.img = np.clip(st.img + np.exp(-(((X - 520) / 360) ** 2 + ((Y - 800) / 260) ** 2))[..., None] * GOLD * .36, 0, 1)
    st.add(fill(spline([(-40, 1320), (-40, 830), (240, 820), (520, 835), (760, 815), (760, 1320)])), "#6a5a4a", 9, "fiber", tear=5, band="mid")
    st.contact(190, 1090, 58, 7, .65).contact(310, 1096, 54, 7, .65)
    puppet(st, 190, 940, 62, WALK, "#7a6555", "#1c1a22", "adam", eyes="open", lift=2.6, cloak="#5e4733")
    puppet(st, 310, 946, 58, dict(WALK, neck=-2, head=-8), "#8a7462", "#1e1b24", "eve", eyes="open", lift=2.6, cloak="#6c523a")
    return st


def s34():
    st = Stage((360, -260), "#121a2d", "#3c4a66", .8, .3, 900, "#ffd98f", 2)
    stars(st, 760, 900)
    hill_person(st, True)
    st.labels = [("logo", "FOURTH WATCH", 1190)]
    return st


FRAMES = {f"S{i:02d}": f for i, f in enumerate([s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16, lambda: hide(False), lambda: hide(True), s19, s20, s21, s22, s23, s24, lambda: hide(True), s26, s27, s28, s29, s30, s31, s32, s33, s34], 1)}


PATCH = {
    "S01": dict(picture="A paper galaxy, a sun and one small Earth, all turning without us. The camera falls toward Earth."),
    "S03": dict(picture="Paper sun, mountains, sea and birds, all moving with no person in sight. The verse sits on its own sheet."),
    "S05": dict(picture="Looking down at the same person on layered ground, hands open, with one long shadow."),
    "S06": dict(picture="A paper table, chairs and the word LONELY? hang on threads above a dark stage. A thread snaps, and they tip.", why="The idea hangs like stage scenery, so nobody mistakes it for something that happened", acting="The word lowers on 'lonely'. The thread snaps on 'needed'", text="LONELY? (paper letters)", tone="night"),
    "S07": dict(picture="A paper crowd with raised hands and the word WORSHIP? hang on threads. Another thread snaps.", why="The same device, so the two failed ideas read as a pair. Pulling back shows how small the crowd is, without mocking it", acting="The crowd lowers on 'worship'. The thread snaps on 'need'", text="WORSHIP? (paper letters)", tone="night"),
    "S08": dict(picture="Thin gold light opens in the dark, and sea, land, a tree and birds rise into place.", acting="Each thing rises on 'created' and 'everything'"),
    "S09": dict(picture="The light settles into a muted green garden. Adam and Eve walk together, and a tree's shadow slides across them."),
    "S16": dict(picture="From high above the trees. Through one gap, the two of them are plainly visible.", angle="high"),
    "S17": dict(picture="Back to back on the ground in the dark trees. They don't move, and the moving leaves have stopped.", acting="Only a slow breath moves. Her arms tighten on 'leave'"),
    "S18": dict(picture="A line of gold leaves moves through the trees toward them. Adam's head turns. Then the whole frame freezes.", acting="His head turns on 'calls'. Everything freezes on 'We'll'"),
    "S25": dict(picture="Back to the frozen frame, darker. The music cuts out, and the gold leaves start moving again."),
    "S26": dict(picture="Adam's bowed head in the dark leaves. His eyes are shut, and his shoulders are high.", acting="He pulls in tighter on 'How'. Nothing else moves"),
    "S27": dict(picture="The whole dark forest, huge. Adam and Eve are small on either side of one thin gold line that runs down from the words to a small pool of light.", acting="Almost nothing moves. His shoulders drop slightly, his head lifts, and his slit eyes open. One slow breath in the silence", why="The longest hold in the film. The question itself reaches them"),
    "S28": dict(picture="The same high view as shot 16, now with one thin gold ring around them.", angle="high"),
    "S29": dict(picture="Both faces lift toward warm light. Their slit eyes are open.", acting="Heads lift on 'answer'. The light reaches them on 'wanted'"),
    "S30": dict(picture="Match cut: Adam's face becomes the face of the person from the opening, in the same spot, in a dim room. They lower their hand and look toward the window."),
    "S33": dict(picture="Sunrise on the dry land. Adam and Eve walk on in their clothes of skin, with gold light on their shoulders."),
}


def update_board():
    path = HERE / "storyboard.json"
    board = json.loads(path.read_text())
    board.pop("sketch_style", None)
    for s in board["shots"]:
        s.update(PATCH.get(s["id"], {}))
        s["route"], s["credits"] = "code", 0
        if s.get("tone") == "chalk":
            s["tone"] = "night"
    path.write_text(json.dumps(board, indent=2, ensure_ascii=False) + "\n")


def main():
    global FONTS
    a = argparse.ArgumentParser()
    a.add_argument("--fonts", required=True)
    a.add_argument("--only", default="")
    o = a.parse_args()
    FONTS = Path(o.fonts)
    update_board()
    out = HERE / "frames"
    out.mkdir(exist_ok=True)
    names = o.only.split(",") if o.only else list(FRAMES)
    for n in names:
        st = FRAMES[n]()
        pic = st.film()
        if n == "S25":
            pic = np.clip(pic * .62 + hexc("#10141f") * .12, 0, 1)
        pic = label_all(pic, st)
        Image.fromarray((pic * 255).astype(np.uint8)).save(out / f"{n}.jpg", quality=84, optimize=True)
        print(n, flush=True)


if __name__ == "__main__":
    main()
