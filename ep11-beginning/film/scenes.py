"""Shared paper sets and props for the Genesis film: space, the hill, Eden, the night forest, the dry land,
big paper hands, the hanging ideas, stars and motes. Ported from build_storyboard_v2.py, enriched for depth."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import paper as P
import rig as R
from paper import DH, DW, GOLD, S, arc, circle, ellipse, fill, gblur, hexc, mass, mass_pts, ribbon, soft, spline, stroke, trunk
from rig import apply, move, rot, scale

FONTDIR = Path("/home/claude/fw-tools/fonts")
CORM = FONTDIR / "x_fontsource-cormorant-garamond-5.3.0/package/files"
CINZEL = FONTDIR / "x_fontsource-cinzel-5.3.0/package/files"


def font(kind, size):
    f = {"italic": CORM / "cormorant-garamond-latin-600-italic.woff", "roman": CORM / "cormorant-garamond-latin-600-normal.woff",
         "bold": CORM / "cormorant-garamond-latin-700-normal.woff", "caps": CINZEL / "cinzel-latin-600-normal.woff",
         "caps7": CINZEL / "cinzel-latin-700-normal.woff"}[kind]
    return ImageFont.truetype(str(f), int(size))


def text_mask(text, x, y, size, kind="caps", anchor="mm", spacing=0):
    """A word cut from paper: a mask of the text on the current canvas, placed in design units."""
    c = P.cv_()
    im = Image.new("L", (c.pw, c.ph), 0)
    d = ImageDraw.Draw(im)
    f = font(kind, size * S)
    px, py = (x - c.x0) * S, (y - c.y0) * S
    if spacing:
        widths = [d.textlength(ch, font=f) + spacing * S for ch in text]
        tot = sum(widths) - spacing * S
        cx = px - tot / 2
        for ch, w in zip(text, widths):
            d.text((cx, py), ch, font=f, fill=255, anchor="lm")
            cx += w
    else:
        d.text((px, py), text, font=f, fill=255, anchor=anchor)
    return np.asarray(im).astype(np.float32) / 255


def stars(st, n, ymax, seed=4, color="#f2e6cf", band="sky", ymin=0, scale_=1.0):
    r = np.random.default_rng(seed)
    c = st.cv
    dots = np.zeros((c.ph, c.pw), np.float32)
    for _ in range(n):
        x, y = r.uniform(c.x0, c.x0 + c.w), r.uniform(max(ymin, c.y0), min(ymax, c.y0 + c.h))
        rad = r.choice((.6, .8, 1.0, 1.0, 1.4, 1.9)) * scale_
        cv2.circle(dots, (int((x - c.x0) * S * 4), int((y - c.y0) * S * 4)), max(1, int(rad * S * 4)), r.uniform(.45, 1), -1, cv2.LINE_AA, shift=2)
    st.paint(np.clip(cv2.GaussianBlur(dots, (0, 0), .5 * S) * 1.8, 0, 1), color, band)


def motes(st, n, box, seed, color="#fff3d6", size=(1.2, 3.2), alpha=.35):
    """Dust in the light: soft specks on their own sheet (the shot drifts the sheet)."""
    r = np.random.default_rng(seed)
    c = st.cv
    m = np.zeros((c.ph, c.pw), np.float32)
    x0, y0, x1, y1 = box
    for _ in range(n):
        x, y = r.uniform(x0, x1), r.uniform(y0, y1)
        cv2.circle(m, (int((x - c.x0) * S), int((y - c.y0) * S)), max(1, int(r.uniform(*size) * S)), r.uniform(.4, 1), -1, cv2.LINE_AA)
    st.paint(gblur(m, 1.1) * alpha, color)


def beam(st, x0, x1, top, x2, x3, bottom, amount, color="#fff4dc"):
    """A soft shaft of light (not gold: daylight)."""
    m = gblur(fill([(x0, top), (x1, top), (x3, bottom), (x2, bottom)]), 26)
    X, Y = P.grids()
    fade = np.clip(1 - (Y - top) / (bottom - top), 0, 1) ** 1.3
    st.glow((m * fade * amount)[..., None] * hexc(color))


# Hands, leaves and fruit ---------------------------------------------------------------------------------

def hand_polys(x, y, s, angle, curl=1.0, spread=7, reach=2.8, sleeve=False, grip=0.0):
    base = move(x, y) @ rot(angle) @ scale(s)
    out = {"fingers": [], "palm": None, "thumb": None, "sleeve": None}
    if sleeve:
        out["sleeve"] = apply(base, [(-.56, -.05), (.56, -.05), (.72, reach), (-.72, reach)])
    for i, (bx, ln) in enumerate(((-.34, 1.0), (-.12, 1.14), (.1, 1.06), (.32, .84))):
        tip = base @ move(bx, -.94) @ rot((i - 1.5) * spread * (1 - grip))
        k = curl * (1 - .55 * grip)
        f = spline([(-.1, .08), (-.095, -ln * k * .6), (-.06, -ln * k), (.06, -ln * k), (.095, -ln * k * .6), (.1, .08)], n=5)
        if grip:
            # fingers fold over: shorten and bend toward the palm
            f = apply(rot(grip * 70 * (1 if angle < 90 else -1)), f)
        out["fingers"].append(apply(tip, f))
    out["palm"] = apply(base, spline([(-.46, .02), (.46, .02), (.52, -.62), (.46, -1.02), (-.46, -1.02), (-.52, -.62)], n=6))
    th = base @ move(.46, -.34) @ rot(40 - grip * 30)
    out["thumb"] = apply(th, spline([(-.12, .1), (-.1, -.42), (-.04, -.7), (.08, -.7), (.13, -.4), (.12, .1)], n=5))
    return out


def hand(st, x, y, s, angle, skin, sleeve=None, tone=1.0, curl=1.0, lift=5, band="subject", spread=7, reach=2.8, grip=0.0):
    """A large paper hand: palm, four fingers and a thumb, each its own piece."""
    hp = hand_polys(x, y, s, angle, curl, spread, reach, bool(sleeve), grip)
    add = lambda m, c, t=1.0, l=lift: st.add(m, c, l, "smooth", 0, 0, band, .4, tone * t, tseed=55)
    if sleeve:
        add(fill(hp["sleeve"]), sleeve, l=lift + 1)
    add(fill(*hp["fingers"]), skin, .97)
    add(fill(hp["palm"]), skin)
    add(fill(hp["thumb"]), skin, .95)


def fig_leaf(x, y, s, a):
    polys = []
    for ang, ln in ((-112, 26), (-58, 36), (0, 46), (58, 36), (112, 26)):
        r = np.radians(a + ang - 90)
        cx, cy = x + np.cos(r) * ln * s * .62, y + np.sin(r) * ln * s * .62
        polys.append(ellipse(cx, cy, ln * s * .62, ln * s * .3, a + ang))
    polys.append(ellipse(x, y, 16 * s, 16 * s))
    return fill(*polys)


def fig_leaf_veins(x, y, s, a, w=1.2):
    out = []
    for ang, ln in ((-112, 26), (-58, 36), (0, 46), (58, 36), (112, 26)):
        r = np.radians(a + ang - 90)
        out.append(stroke((x, y), (x + np.cos(r) * ln * s * 1.05, y + np.sin(r) * ln * s * 1.05), w))
    return np.maximum.reduce(out)


def fruit(st, x, y, r, bite=0.0, band="subject", lift=4, tone=1.0, color="#86392f"):
    """The fruit. Not an apple: Genesis doesn't name it. A plain rounded fruit with a short stem and one leaf."""
    body = fill(ellipse(x, y, r * .92, r, 8))
    m = body
    if bite:
        cut = fill(ellipse(x + r * .8, y - r * .22, r * .48 * bite, r * .42 * bite))
        rim = fill(ellipse(x + r * .8, y - r * .22, r * .48 * bite + r * .07, r * .42 * bite + r * .07))
        m = body * (1 - cut)
    st.add(m, color, lift, "smooth", 0, 0, band, .4, tone, tseed=91)
    st.add(fill(ellipse(x - r * .3, y - r * .34, r * .26, r * .16, -30)) * m, "#b4594a", 0, "none", 0, 0, band, 0, tone, flat=True)
    if bite:
        st.add(np.clip(rim - cut, 0, 1) * body, "#eadcbc", 0, "none", 0, 0, band, 0, tone, flat=True)
    st.add(stroke((x, y - r * .92), (x + r * .12, y - r * 1.3), max(1, r * .1)), "#3e3225", lift * .5, "smooth", 0, 0, band, .3, tone)
    st.add(fill(R.apply(move(x + r * .14, y - r * 1.2) @ rot(-50) @ scale(r * .45), P.LEAF)), "#4d6a44", lift * .5, "smooth", 0, 0, band, .3, tone)


# Sets -----------------------------------------------------------------------------------------------

def galaxy(st, cx=360, cy=430, k=1.0, band="far"):
    a = ribbon([(cx + (x - 360) * k, cy + (y - 430) * k) for x, y in [(360, 430), (450, 470), (520, 420), (500, 320), (390, 262), (250, 300), (172, 420), (216, 560), (350, 640), (520, 620), (640, 520)]], [42 * k, 34 * k, 30 * k, 24 * k, 20 * k, 14 * k, 10 * k, 6 * k])
    b = ribbon([(cx + (x - 360) * k, cy + (y - 430) * k) for x, y in [(360, 430), (270, 390), (200, 440), (220, 540), (330, 600), (470, 570), (556, 460), (530, 330), (420, 240), (280, 210), (130, 270)]], [42 * k, 34 * k, 30 * k, 24 * k, 20 * k, 14 * k, 10 * k, 6 * k])
    st.glow(soft(cx, cy, 260 * k, 220 * k)[..., None] * hexc("#3a4a78") * .35, band)
    st.add(np.maximum(a, b), "#34405f", 6, "matte", tear=5, band=band)
    st.add(np.maximum(ribbon([(cx + (x - 360) * k * .8, cy + (y - 430) * k * .8) for x, y in [(360, 430), (450, 470), (520, 420), (500, 320), (390, 262)]], [18 * k, 14 * k, 8 * k]),
                      ribbon([(cx + (x - 360) * k * .8, cy + (y - 430) * k * .8) for x, y in [(360, 430), (270, 390), (200, 440), (220, 540), (330, 600)]], [18 * k, 14 * k, 8 * k])), "#4b5a86", 4, "matte", tear=3, band=band)
    st.add(circle(cx, cy, 46 * k), "#55638a", 7, "matte", band=band)
    st.add(circle(cx, cy, 22 * k), "#8d96b8", 4, "smooth", band=band)


def earth_at(st, x, y, r, sea="#34507a", land="#6d7f5e", seed=3, lift=8, band="mid"):
    st.glow(np.exp(-((np.sqrt((P.grids()[0] - x) ** 2 + (P.grids()[1] - y) ** 2) - r * 1.04) / (r * .09)) ** 2)[..., None] * hexc("#6f8fc4") * .5, band)
    st.add(circle(x, y, r), sea, lift, "matte", band=band)
    disc = circle(x, y, r - 1)
    rng = np.random.default_rng(seed)
    out = np.zeros_like(disc)
    for i in range(4):
        a, d = rng.uniform(0, 6.28), rng.uniform(.1, .6) * r
        out = np.maximum(out, mass(seed + i, x + d * np.cos(a), y + d * np.sin(a), r * rng.uniform(.26, .44), r * rng.uniform(.2, .36), 6))
    st.add(out * disc, land, 3, "matte", 2, band=band)
    X, Y = P.grids()
    sh = np.clip((X - x + r * .2) / (r * 1.4), 0, 1) * disc
    st.darken(sh * .45, band)


def hill(st, gold=False, seed=0):
    """The opening hill: layered far ridges in haze, the near ridge where the person stands, grass at the lip."""
    st.haze("#6a7c98", .34, 640, 1040, 1 + seed)
    st.add(fill(spline([(-60, 1000), (120, 890), (300, 930), (520, 860), (780, 950), (780, 1320), (-60, 1320)])), "#2c3852", 8, "fiber", band="far")
    st.haze("#55688a", .26, 760, 1040, 2 + seed)
    st.add(fill(spline([(-60, 1010), (170, 930), (420, 972), (780, 900), (780, 1320), (-60, 1320)])), "#1f2940", 10, "fiber", band="mid")
    if gold:
        st.glow(soft(360, 900, 240, 300)[..., None] * GOLD * .42, "mid")
    st.add(fill(spline([(-60, 1320), (-60, 1080), (120, 1000), (360, 958), (600, 1005), (780, 1090), (780, 1320)])), "#0f131c", 12, "fiber", band="near")
    r = np.random.default_rng(31 + seed)
    blades = []
    for x in np.linspace(-40, 760, 70):
        yb = 958 + 0.00018 * (x - 360) ** 2 * 1.4 + 6
        h = r.uniform(10, 26)
        lean = r.uniform(-8, 8)
        blades.append(spline([(x - 2.2, yb + 6), (x + lean * .5, yb - h * .55), (x + lean, yb - h), (x + 2.2, yb + 6)], n=3))
    st.add(fill(*blades), "#0f131c", 3, "fiber", tear=0, band="near")


def eden_far(st, seed=31, light="#e8dfc8"):
    st.add(mass(seed, 420, 330, 520, 330), "#b8c2a3", 6, "matte", tear=5, band="far")
    st.add(mass(seed + 40, 80, 470, 260, 200), "#aab795", 6, "matte", tear=5, band="far")
    st.haze(light, .4, 200, 900, 1)


def olive(st, seed, x, base, h, w, color_t="#5c4a39", color_l="#6f8763", lobes=5, band="mid", lift=9, tone=1.0):
    """An olive-like tree: twisted trunk + lumpy lobed canopy (single blobs read as mushrooms)."""
    r = np.random.default_rng(seed)
    tr = ribbon([(x, base), (x + r.uniform(-.1, .1) * w, base - h * .3), (x + r.uniform(-.15, .15) * w, base - h * .55), (x + r.uniform(-.1, .1) * w, base - h * .7)], [w * .16, w * .12, w * .1, w * .08])
    br = [ribbon([(x, base - h * .6), (x + d * w * .35, base - h * .78), (x + d * w * .55, base - h * .86)], [w * .07, w * .045, w * .02]) for d in (-1, 1)]
    st.add(np.maximum.reduce([tr] + br), color_t, lift, "fiber", tear=1.5, band=band, tone=tone)
    polys = []
    for i in range(lobes):
        a = i / max(lobes - 1, 1)
        cx = x + (a - .5) * w * 1.1 + r.uniform(-.06, .06) * w
        cy = base - h * (.82 + .18 * np.sin(a * np.pi)) + r.uniform(-.04, .04) * h
        polys.append(mass_pts(seed * 7 + i, cx, cy, w * r.uniform(.26, .36), h * r.uniform(.15, .22)))
    st.add(fill(*polys), color_l, lift + 1, "matte", tear=4, band=band, tone=tone)
    hi = [mass_pts(seed * 11 + i, x + (i / max(lobes - 1, 1) - .5) * w * .9, base - h * (.9 + .14 * np.sin(i / max(lobes - 1, 1) * np.pi)), w * .17, h * .08) for i in range(lobes)]
    st.add(fill(*hi), hexc(color_l) * 1.14, 2, "matte", tear=3, band=band, tone=tone)


def meadow(st, y, color="#8d976c", band="mid", seed=0, lift=9):
    st.add(fill(spline([(-60, DH + 60), (-60, y), (240, y - 40), (520, y - 20), (780, y - 40), (780, DH + 60)])), color, lift, "fiber", band=band)


def grass(st, y0, x0=-40, x1=760, n=80, h=(30, 70), color="#4f6a46", seed=3, band="near", lift=6, lean=10, tone=1.0):
    r = np.random.default_rng(seed)
    polys = []
    for x in np.linspace(x0, x1, n):
        hh, ln = r.uniform(*h), r.uniform(-lean, lean)
        yb = y0 + r.uniform(-6, 6)
        wb = r.uniform(3, 6)
        polys.append(spline([(x - wb, yb + 20), (x + ln * .5 - wb * .4, yb - hh * .55), (x + ln, yb - hh), (x + ln * .5 + wb * .4, yb - hh * .5), (x + wb, yb + 20)], n=3))
    st.add(fill(*polys), color, lift, "fiber", tear=0, band=band, tone=tone)


def ferns(st, seed, boxes, n, size, color, band="near", lift=12, blur=0, tone=1.0):
    st.add(P.big_leaves(seed, boxes, n, size), color, lift, "matte", blur=blur, tear=0 if blur else 2, band=band, tone=tone)


def forest(st, ground=1010, rich=True):
    """The cold compressed forest, with the same bands in every night shot."""
    for i, (x, w) in enumerate(((250, 40), (400, 46), (500, 34), (150, 36), (620, 30), (60, 28))):
        st.add(trunk(120 + i, x, w), "#3d5170", 5, "fiber", tear=2, band="far", blur=1.2)
    st.haze("#42597c", .4, 380, 1040, 1)
    st.add(fill(spline([(-60, DH + 60), (-60, ground - 10), (250, ground - 40), (520, ground - 34), (780, ground - 14), (780, DH + 60)])), "#1b2436", 8, "fiber", band="mid")
    for i, (x, w, lean) in enumerate(((326, 62, 6), (604, 58, -8), (120, 52, 10))):
        st.add(trunk(130 + i, x, w, lean=lean), "#232d42", 8, "fiber", tear=3, band="mid")
    if rich:
        ferns(st, 160, [(-40, ground - 70, 300, ground + 10), (420, ground - 80, 760, ground)], 9, (24, 46), "#1d2a3a", band="mid", lift=6)
    st.haze("#334766", .2, 600, 1090, 2)


def trees_near(st, tone=1.0):
    for i, (x, w, lean) in enumerate(((10, 130, 22), (726, 150, -30))):
        st.add(trunk(140 + i, x, w, lean=lean), "#0d1119", 18, "fiber", tear=4, band="near", tone=tone)


def canopy(st):
    for i, (x, y, r) in enumerate(((60, 90, 170), (360, 30, 150), (650, 110, 170), (20, 460, 150), (700, 480, 150), (70, 860, 170), (660, 860, 170), (360, 1110, 190))):
        st.add(mass(270 + i, x, y, r, r * .92), "#202a3d" if i % 2 else "#273349", 14, "matte", tear=5, band="near")
        st.add(mass(290 + i, x + (360 - x) * .12, y + (640 - y) * .12, r * .55, r * .5), "#2e3c55" if i % 2 else "#34435f", 4, "matte", tear=4, band="near")


def dry_edge(st, sun=(560, 470)):
    st.add(circle(*sun, 54), "#e6d7ae", 5, "smooth", band="far")
    st.add(fill(spline([(-60, 900), (150, 820), (380, 860), (600, 800), (780, 840), (780, 1000), (-60, 1000)])), "#b59f78", 6, "fiber", tear=5, band="far")
    st.haze("#d8c39c", .3, 700, 950, 7)
    st.add(fill(spline([(-60, DH + 60), (-60, 800), (240, 770), (500, 790), (780, 760), (780, DH + 60)])), "#a58f68", 9, "fiber", tear=5, band="mid")


def big_earth(st, sea, land, seed=33, cx=360, cy=1120, r=700, band="mid"):
    X, Y = P.grids()
    d = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
    st.glow(np.exp(-((d - r * 1.023) / 40) ** 2)[..., None] * hexc("#6f8fc4") * .46, band)
    disc = circle(cx, cy, r)
    st.add(disc, sea, 12, "matte", tear=2, band=band)
    masks = [mass(seed + 1, cx - 190, cy - 420, 230, 96), mass(seed + 2, cx + 230, cy - 290, 220, 120), mass(seed + 3, cx - 60, cy - 140, 300, 110)]
    ground = np.maximum.reduce(masks) * disc
    st.add(ground, land, 4, "matte", tear=3, band=band)
    return ground, disc


def clouds(st, color="#cdd5df", cx=360, cy=1120, band="near"):
    for r, a0, a1, w in ((640, 236, 292, 16), (586, 262, 322, 13), (530, 214, 262, 12)):
        st.add(arc(cx, cy, r, a0, a1, w), color, 14, "matte", tear=4, band=band, tone=.92)


def hedge(st, x0, x1, ytop, depth=140, color="#4f6a46", seed=5, band="near", lift=10, tone=1.0, flowers=None, bottom=None):
    """A dense, solid row of leafy lobes whose top sits at ytop: it frames figures from the waist up.
    With bottom set, it is a single rounded bush rather than a bank running off the frame."""
    r = np.random.default_rng(seed)
    if bottom is None:
        polys = [np.array([(x0 - 30, ytop + 30), (x1 + 30, ytop + 30), (x1 + 30, ytop + depth + 400), (x0 - 30, ytop + depth + 400)], np.float32)]
    else:
        polys = [mass_pts(seed * 3, (x0 + x1) / 2, (ytop + 30 + bottom) / 2, (x1 - x0) / 2 + 20, (bottom - ytop - 30) / 2 + 12)]
    n = max(3, int((x1 - x0) / 46))
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n + r.uniform(-12, 12)
        polys.append(mass_pts(seed * 13 + i, x, ytop + r.uniform(18, 34), r.uniform(30, 46), r.uniform(26, 40)))
    st.add(fill(*polys), color, lift, "matte", tear=3, band=band, tone=tone)
    tops = [mass_pts(seed * 17 + i, x0 + (x1 - x0) * (i + .5) / n + r.uniform(-8, 8), ytop + r.uniform(10, 22), r.uniform(16, 26), r.uniform(12, 18)) for i in range(n)]
    st.add(fill(*tops), hexc(color) * 1.16, 3, "matte", tear=2, band=band, tone=tone)
    if flowers:
        dots = [ellipse(x0 + r.uniform(0, 1) * (x1 - x0), ytop + r.uniform(8, 60), 4.5, 4.5) for _ in range(int((x1 - x0) / 18))]
        st.add(fill(*dots), flowers, 1.5, "smooth", tear=0, band=band, tone=tone)
