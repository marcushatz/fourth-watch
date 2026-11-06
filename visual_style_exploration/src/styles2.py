"""The two map and paper styles. These are built as documents, not from the render alone."""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter1d

sys.path.insert(0, str(Path(__file__).parent))
from npr import blur, fbm, hexc, noise, paper_tex, srgb

F = "/home/claude/fw-tools/fonts/"
W, H = 1080, 1920


def text(img, s, xy, size, font, fill, anchor="la", rotate=0, spacing=0):
    """Draw type at high quality onto a float image."""
    f = ImageFont.truetype(F + font + ".ttf", size * 3)
    L = Image.new("L", (W * 3, H * 3), 0)
    d = ImageDraw.Draw(L)
    if spacing:
        x = xy[0] * 3
        total = sum(d.textlength(c, font=f) + spacing * 3 for c in s)
        if "m" in anchor[0]:
            x -= total / 2
        for c in s:
            d.text((x, xy[1] * 3), c, font=f, fill=255, anchor="l" + anchor[1])
            x += d.textlength(c, font=f) + spacing * 3
    else:
        d.text((xy[0] * 3, xy[1] * 3), s, font=f, fill=255, anchor=anchor)
    if rotate:
        L = L.rotate(rotate, center=(xy[0] * 3, xy[1] * 3), resample=Image.BICUBIC)
    a = np.asarray(L.resize((W, H), Image.LANCZOS), np.float32)[..., None] / 255
    return img * (1 - a) + np.array(fill, np.float32) * a


def river(pts, w0, w1, seed):
    r = np.random.default_rng(seed)
    p = np.array(pts, float)
    t = np.linspace(0, 1, len(p))
    u = np.linspace(0, 1, 140)
    c = np.stack([np.interp(u, t, p[:, 0]), np.interp(u, t, p[:, 1])], 1)
    c = gaussian_filter1d(c, 8, axis=0, mode="nearest")
    c = c + gaussian_filter1d(r.normal(0, 16, c.shape), 5, axis=0, mode="nearest")
    return c, np.linspace(w0, w1, 140)


def tree_glyph(a, x, y, s, seed, ink):
    """A small inked tree with a shaded side, as on an old map."""
    r = np.random.default_rng(seed)
    pts = []
    for t in np.linspace(0, 6.28, 28):
        k = s * (1 + .13 * np.sin(t * 6 + seed) + .05 * np.sin(t * 11 + seed * 2))
        pts.append((x + k * np.cos(t), y - s * .9 + k * .85 * np.sin(t)))
    return np.int32(pts)


def s_atlas():
    h, w = H, W
    base = np.array([.87, .8, .64], np.float32)
    terr = fbm((h, w), 420, 4, 6)
    terr = (terr + np.exp(-(((np.mgrid[0:h, 0:w][1] - 520) / 300) ** 2 + ((np.mgrid[0:h, 0:w][0] - 900) / 420) ** 2)) * -.18).astype(np.float32)
    gx = cv2.Sobel(terr, cv2.CV_32F, 1, 0, ksize=5)
    gy = cv2.Sobel(terr, cv2.CV_32F, 0, 1, ksize=5)
    shade = np.clip(.5 + (gx * .7 + gy * .7) * 9, 0, 1)
    img = base[None, None] * (.9 + shade[..., None] * .16) * paper_tex((h, w, 3), 3, .05)[..., None]
    img = img * (1 - (fbm((h, w), 150, 8, 5) - .5)[..., None] * .22)
    lines = np.zeros((h, w), np.float32)
    for lv in np.arange(.3, .8, .022):
        m = (terr > lv).astype(np.uint8)
        c, _ = cv2.findContours(m, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
        cv2.drawContours(lines, c, -1, .45, 1, cv2.LINE_AA)
    img = img * (1 - blur(lines, .5)[..., None] * np.array([.55, .6, .7]))
    # One river out of Eden divides into four (Genesis 2:10). The mapped courses are symbolic.
    spring = (530, 760)
    arms = [[spring, (420, 520), (260, 300), (120, -20)], [spring, (680, 540), (850, 330), (1000, -20)], [spring, (360, 1040), (200, 1400), (70, 1940)], [spring, (720, 1080), (880, 1420), (1010, 1940)]]
    rv = np.zeros((h, w), np.float32)
    for i, a in enumerate(arms):
        c, wd = river(a, 13, 22, i + 3)
        for j in range(len(c) - 1):
            cv2.line(rv, tuple(np.int32(c[j])), tuple(np.int32(c[j + 1])), 1.0, max(int(wd[j]), 1), cv2.LINE_AA)
    rb = blur(rv, 1)
    img = img * (1 - rb[..., None]) + np.array([.42, .53, .55], np.float32) * rb[..., None]
    img = img * (1 - np.clip(blur(rb, 5) - rb, 0, 1)[..., None] * .5)
    # Forest: inked trees, thick around the place they hide.
    r = np.random.default_rng(12)
    hide = (610, 1090)
    fbm_edge = fbm((h, w), 120, 31, 4)
    ink = np.zeros((h, w), np.float32)
    fill = np.zeros((h, w), np.float32)
    trees = []
    for i in range(3400):
        x, y = r.uniform(180, 900), r.uniform(420, 1560)
        d = np.hypot((x - 530) / 360, (y - 960) / 560)
        if d > 1 + (fbm_edge[int(y), int(x)] - .5) * .5 or rb[int(y), int(x)] > .3 or r.random() > 1.1 - d * .6:
            continue
        trees.append((y, x, r.uniform(11, 17)))
    for y, x, s in sorted(trees):
        if np.hypot(x - hide[0], (y - hide[1])) < 26:
            continue
        p = tree_glyph(None, x, y, s, int(x), None)
        cv2.fillPoly(fill, [p], 0, cv2.LINE_AA)
        tmp = np.zeros_like(fill)
        cv2.fillPoly(tmp, [p], 1, cv2.LINE_AA)
        fill = np.maximum(fill, tmp * (.55 + .45 * ((x + y) % 5) / 5))
        cv2.polylines(ink, [p], True, 1.0, 1, cv2.LINE_AA)
        cv2.line(ink, (int(x), int(y)), (int(x), int(y) + int(s * .55)), 1.0, 2, cv2.LINE_AA)
    cover = fill > 0
    col = np.array([.34, .4, .28], np.float32)
    img = np.where(cover[..., None], col * (.72 + fill[..., None] * .5), img)
    img = img * (1 - ink[..., None] * .86)
    # The two who hide, and the gold line of the one who walks toward them.
    cv2.circle(ink, hide, 0, 1)
    for dx in (-5, 6):
        a = np.zeros((h, w), np.float32)
        cv2.ellipse(a, (hide[0] + dx, hide[1] + 2), (3, 5), 0, 0, 360, 1, -1, cv2.LINE_AA)
        img = img * (1 - a[..., None]) + np.array([.08, .06, .05], np.float32) * a[..., None]
    path, wd = river([(180, 1830), (300, 1560), (260, 1320), (420, 1230), (560, 1120)], 3, 3, 40)
    g = np.zeros((h, w), np.float32)
    for j in range(0, len(path) - 8, 8):
        cv2.line(g, tuple(np.int32(path[j])), tuple(np.int32(path[j + 4])), 1.0, 5, cv2.LINE_AA)
    img = img * (1 - blur(g, .7)[..., None]) + np.array([.84, .58, .16], np.float32) * blur(g, .7)[..., None]
    t = np.array([.17, .12, .08])
    img = text(img, "GENESIS 3:8", (W / 2, 120), 40, "cinzel", t, "ma", spacing=6)
    img = text(img, "among the trees of the garden", (W / 2, 180), 40, "corm", t, "ma")
    for s, xy, ro in (("PISHON", (270, 262), 46), ("GIHON", (816, 262), -46), ("TIGRIS", (250, 1600), -66), ("EUPHRATES", (834, 1610), 66)):
        img = text(img, s, xy, 22, "cinzel", (.2, .28, .3), "mm", rotate=ro, spacing=4)
    e = np.minimum.reduce([np.mgrid[0:h, 0:w][1], w - 1 - np.mgrid[0:h, 0:w][1], np.mgrid[0:h, 0:w][0], h - 1 - np.mgrid[0:h, 0:w][0]]).astype(np.float32)
    img = img * np.clip(.62 + e / 160, 0, 1)[..., None]
    return np.clip(img, 0, 1)


def s_collage(p, engraved):
    """Layered documents: torn paper, a map, a halftone forest, a cut-out figure and a typed strip."""
    from npr import lum
    from styles import scene_base
    h, w = H, W
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    def tear(mask, seed, amp=14):
        d = (fbm((h, w), 44, seed, 5) - .5) * amp * 2
        e = (fbm((h, w), 44, seed + 3, 5) - .5) * amp * 2
        return cv2.remap(mask, xx + d, yy + e, cv2.INTER_LINEAR)
    def lay(img, mask, col, seed, sh=.45, off=(7, 9), core=(.95, .93, .87)):
        m = tear(mask, seed)
        s = blur(np.roll(np.roll(m, off[1], 0), off[0], 1), 7) * (1 - m) * sh
        img = img * (1 - s[..., None])
        c = tear(cv2.dilate(mask, np.ones((3, 3))), seed + 7, 15)
        fr = np.clip(c - m, 0, 1)[..., None]
        img = img * (1 - fr) + np.array(core, np.float32) * fr
        return img * (1 - m[..., None]) + col * m[..., None]
    base = np.array([.23, .2, .17], np.float32) * paper_tex((h, w, 3), 2, .08)[..., None]
    img = base.copy()
    # Halftone forest printed on old newsprint.
    L = lum(srgb(scene_base(p, (.13, .15, .2), 900, 2.2)[0]))
    t = np.radians(38)
    u = (xx * np.cos(t) + yy * np.sin(t)) / 9
    v = (-xx * np.sin(t) + yy * np.cos(t)) / 9
    dots = (np.sin(u * 2 * np.pi) * np.sin(v * 2 * np.pi) + 1) / 2
    bgmask = np.clip(1 - p.mask(1, 2, 3, 4), 0, 1)
    ht = np.clip((blur(L, 3) * 1.9 - dots) * 9, 0, 1)
    paper = np.array([.86, .82, .72], np.float32) * paper_tex((h, w, 3), 5, .05)[..., None]
    news = paper * ht[..., None] + np.array([.1, .11, .14], np.float32) * (1 - ht[..., None])
    r1 = ((xx > 40) & (xx < 1040) & (yy > 210) & (yy < 1500)).astype(np.float32)
    img = lay(img, r1, news, 3)
    # A strip of map.
    from styles2 import s_atlas as atlas
    mp = atlas()
    r2 = ((yy - (1320 + (xx - 540) * -.1) > 0) & (yy - (1320 + (xx - 540) * -.1) < 560) & (xx > -40)).astype(np.float32)
    img = lay(img, r2, cv2.warpAffine(mp, np.float32([[1.5, 0, -280], [0, 1.5, -420]]), (w, h), borderMode=cv2.BORDER_REFLECT), 9)
    # Gold foil strip: the one gold mark.
    g = (np.abs(xx - 176 - (yy - 700) * .012) < 4).astype(np.float32) * (yy < 1330)
    foil = np.array([.86, .62, .2], np.float32) * (1 + (fbm((h, w), 9, 3, 4) - .5)[..., None] * .4)
    img = img * (1 - g[..., None]) + foil * g[..., None]
    # The figure, cut out with a white margin as if with scissors.
    m = (blur(p.mask(1, 2, 3, 4), 2) > .5).astype(np.uint8)
    m[1560:] = 0
    margin = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (29, 29))).astype(np.float32)
    margin = (blur(margin, 3) > .5).astype(np.float32)
    s = blur(np.roll(np.roll(margin, 16, 0), 12, 1), 11) * (1 - margin) * .6
    img = img * (1 - s[..., None])
    a = blur(margin, .7)[..., None]
    img = img * (1 - a) + np.array([.94, .92, .86], np.float32) * a
    k = blur(m.astype(np.float32), .7)[..., None]
    img = img * (1 - k) + engraved * k
    # A typed slip. Words are from the ESV, Genesis 3:8.
    sl = ((xx > 96) & (xx < 830) & (yy > 96) & (yy < 190)).astype(np.float32)
    M = cv2.getRotationMatrix2D((460, 140), 1.6, 1)
    sl = cv2.warpAffine(sl, M, (w, h))
    s = blur(np.roll(sl, 7, 0), 6) * (1 - sl) * .5
    img = img * (1 - s[..., None])
    img = img * (1 - sl[..., None]) + np.array([.92, .88, .76], np.float32) * sl[..., None]
    img = text(img, "and they hid themselves", (126, 112), 44, "elite", (.09, .08, .08), rotate=-1.6)
    img = text(img, "GENESIS 3:8", (560, 112 + 62), 25, "elite", (.46, .14, .1), rotate=-1.6)
    return np.clip(img, 0, 1)
