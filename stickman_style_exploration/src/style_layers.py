"""04 2.5D atmospheric. Every picture is a stack of separate painted planes with real air between them.
Each plane is written out as its own PNG, so a later camera move can slide them past each other."""
import sys

import cv2
import numpy as np

from kit import FR, H, P, W, fig_mask, npr, save, smoothstep, stars

fbm, blur, hexc, srgb = npr.fbm, npr.blur, npr.hexc, npr.srgb
Y, X = np.mgrid[:H, :W].astype(np.float32)
KEEP = "--layers" in sys.argv


def gb(a, s_):
    if s_ < 14:
        return cv2.GaussianBlur(a, (0, 0), s_)
    k = 6
    q = cv2.resize(a, (W // k, H // k), interpolation=cv2.INTER_AREA)
    return cv2.resize(cv2.GaussianBlur(q, (0, 0), s_ / k), (W, H), interpolation=cv2.INTER_LINEAR)


class Stack:
    def __init__(s, sky, name):
        s.img, s.name, s.n = sky.copy(), name, 0
        s.dump(sky, np.ones((H, W), np.float32))

    def dump(s, rgb, a):
        if KEEP:
            d = FR / "04_2_5d_atmospheric" / "layers" / s.name
            d.mkdir(parents=True, exist_ok=True)
            o = np.dstack([np.clip(srgb(np.clip(rgb, 0, 1))[..., ::-1], 0, 1), np.clip(a, 0, 1)])
            cv2.imwrite(str(d / f"{s.n:02d}.png"), (o * 255).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 6])
            s.n += 1

    def add(s, rgb, a, blur_=0.0):
        if blur_:
            pm = gb(rgb * a[..., None], blur_)
            a = gb(a, blur_)
            rgb = pm / np.maximum(a[..., None], 1e-3)
        s.dump(rgb, a)
        s.img = s.img * (1 - a[..., None]) + rgb * a[..., None]

    def air(s, col, amount, top=0, bottom=H, rise=True):
        """A sheet of haze between planes, thicker low down and broken by slow noise."""
        m = amount * (.55 + .9 * fbm((H, W), 460, int(amount * 1000) + 3, 4))
        if rise:
            m = m * (.35 + .65 * smoothstep(top, bottom, Y))
        s.img = s.img * (1 - m[..., None]) + hexc(col) * m[..., None] if isinstance(col, str) else s.img * (1 - m[..., None]) + col * m[..., None]


def ridged(shape, cell, seed, oct=6, stretch=1.0):
    h, w = shape
    a = cv2.resize(fbm((int(h / stretch), w), cell, seed, oct), (w, h), interpolation=cv2.INTER_CUBIC)
    return 1 - np.abs(2 * a - 1)


def mountain(seed, base, amp, cell, col_lit, col_dark, sun=(.7, -.5), rim=None):
    """A ridge with carved, lit faces, not a flat shape."""
    top = base + amp * 2 * (ridged((1, W), cell, seed, 7)[0] * -1 + .6)
    a = smoothstep(0, 1.6, Y - top[None, :]).astype(np.float32)
    R = ridged((H, W), cell * .55, seed + 3, 6, 1)
    gx, gy = np.gradient(cv2.GaussianBlur(R, (0, 0), 1.2))
    sh = np.clip(.5 + 15 * (gx * sun[0] + gy * sun[1]), 0, 1)[..., None]
    rgb = hexc(col_dark) * (1 - sh) + hexc(col_lit) * sh
    if rim:
        rgb = rgb + (np.exp(-np.clip(Y - top[None, :], 0, None) / 10) * (.5 + R))[..., None] * hexc(rim) * .7
    return rgb, a, top


def pine(m, x, y, h, r, w=.28):
    n = int(h / 5)
    for i in range(n):
        t = i / n
        yy = y - t * h
        q = w * h * (1 - t) ** 1.1 * r.uniform(.72, 1.12)
        droop = r.uniform(6, 14) * (1 - t) + 3
        tri = np.array([[x - q, yy + droop], [x + q, yy + droop], [x + r.uniform(-2, 2), yy - h / n * 2.2]])
        cv2.fillPoly(m, [np.round(tri * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)


def rim_of(mask, dx, dy, s_=1.0):
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    return np.clip(mask - cv2.warpAffine(mask, M, (W, H)), 0, 1)


def lumps(circles, seed, sun=(-.6, -.7)):
    """Canopy as a true height field of overlapping domes, lit by the sun. Returns height-mask and shade."""
    hgt = np.zeros((H, W), np.float32)
    for x, y, rad in circles:
        x0, x1 = max(int(x - rad), 0), min(int(x + rad) + 1, W)
        y0, y1 = max(int(y - rad), 0), min(int(y + rad) + 1, H)
        if x1 <= x0 or y1 <= y0:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        d = rad * rad - (xx - x) ** 2 - (yy - y) ** 2
        z = np.sqrt(np.clip(d, 0, None))
        hgt[y0:y1, x0:x1] = np.maximum(hgt[y0:y1, x0:x1], z + rad * .5 * (d > 0))
    tex = fbm((H, W), 9, seed, 4) - .5
    a = smoothstep(.0, 2.5, hgt - 22 * fbm((H, W), 11, seed + 2, 3))
    hh = cv2.GaussianBlur(hgt, (0, 0), 1.6) + tex * 16
    gy, gx = np.gradient(hh)
    n = np.dstack([-gx, -gy, np.ones_like(gx) * 1.1])
    n /= np.linalg.norm(n, axis=2, keepdims=True) + 1e-6
    L = np.array([sun[0], sun[1], .5], np.float32)
    L /= np.linalg.norm(L)
    sh = np.clip((n * L).sum(2), 0, 1)
    ao = np.clip((gb(hgt, 22) - hgt) / 26, 0, 1)
    return a, np.clip(sh * (1 - .8 * ao), 0, 1)


def backlit(a, sh, seed, warm="#c9d66a"):
    """Foliage against the sun: dark in the body, light coming through at the thin edges, sky through the gaps."""
    inner = gb(a, 9)
    e = np.clip(a * (1 - inner) * 2.2, 0, 1)
    holes = smoothstep(.6, .66, fbm((H, W), 7, seed, 3)) * (1 - smoothstep(.55, .9, gb(a, 16)))
    a2 = a * (1 - holes)
    k = np.clip(.18 * sh + 1.3 * e, 0, 1)[..., None]
    col = hexc("#0c2016") * (1 - k) + hexc(warm) * k
    return col, a2


def leaf_mass(clusters, seed, sun=(-.7, -.7), dark="#0b1d14", mid="#2f5a34", lit="#c9d86e", edge="#e8eaa0", n_per=1.0):
    """Foliage painted the way an illustrator does it: thousands of small leaf shapes, dark inside, lit and
    translucent at the edge that faces the sun. Returns colour and alpha."""
    r = np.random.default_rng(seed)
    S2 = 2
    img = np.zeros((H * S2, W * S2, 3), np.float32)
    al = np.zeros((H * S2, W * S2), np.float32)
    cd, cm, cl, ce = hexc(dark), hexc(mid), hexc(lit), hexc(edge)
    leaves = []
    for cx, cy, rx, ry in clusters:
        n = int(rx * ry / 60 * n_per)
        a = r.uniform(0, 6.283, n)
        k = r.random(n) ** .5
        x, y = cx + rx * k * np.cos(a), cy + ry * k * np.sin(a)
        facing = (np.cos(a) * sun[0] + np.sin(a) * sun[1]) * k
        depth = k + r.normal(0, .12, n)
        for i in range(n):
            leaves.append((depth[i], x[i], y[i], facing[i], k[i]))
    leaves.sort(key=lambda q: -q[0])
    for d_, x, y, fc, k in leaves:
        sz = r.uniform(7, 17)
        t_ = np.clip(.45 + .55 * fc + r.normal(0, .12), 0, 1)
        col = cd * (1 - t_) ** 2 + cm * 2 * t_ * (1 - t_) + cl * t_ ** 2
        if k > .8 and fc > .1:
            col = col * .4 + ce * .6
        col = col * r.uniform(.85, 1.12)
        ang = r.uniform(0, 180)
        c = (int(x * S2), int(y * S2))
        ax = (max(int(sz * S2), 1), max(int(sz * S2 * .42), 1))
        cv2.ellipse(img, c, ax, ang, 0, 360, tuple(float(v) for v in col), -1)
        cv2.ellipse(al, c, ax, ang, 0, 360, 1.0, -1)
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    al = cv2.resize(al, (W, H), interpolation=cv2.INTER_AREA)
    return img / np.maximum(al[..., None], 1e-3), al


def leaf_col(sh):
    s_ = sh[..., None]
    return hexc("#071a14") * (1 - s_) ** 2 + hexc("#2e5a38") * 2 * s_ * (1 - s_) + hexc("#e4e48e") * s_ ** 2


def canopy(cx, cy, rx, ry, n, r, rmin, rmax):
    out = []
    for _ in range(n):
        a, k = r.uniform(0, 6.28), r.random() ** .5
        out.append((cx + rx * k * np.cos(a), cy + ry * k * np.sin(a), r.uniform(rmin, rmax)))
    return out


def scene_a():
    t = np.clip(Y / 1500, 0, 1)
    sky = (1 - t[..., None]) ** 2.2 * hexc("#050a1c") + (1 - (1 - t[..., None]) ** 2.2) * hexc("#16314f")
    band_d = ((Y - 560) - (X - 540) * -1.3) / 330
    band = np.exp(-band_d ** 2)
    dust = smoothstep(.42, .68, fbm((H, W), 150, 3, 6))
    cloud = fbm((H, W), 240, 4, 6)
    sky += (band * (.25 + 1.4 * cloud) * (1 - .8 * dust))[..., None] * hexc("#7890b8") * .9
    sky += (np.exp(-(band_d / .4) ** 2) * cloud)[..., None] * hexc("#d8b890") * .35
    st = stars(5, 7000, big=.012, ymax=1450) * (.35 + 1.3 * band)
    sky += gb(st, .7)[..., None] * 1.3 * np.array([.92, .96, 1.08], np.float32)
    S = Stack(sky, "a")
    S.air("#2a4e72", .25, 800, 1500)
    rgb, a, _ = mountain(4, 1160, 150, 460, "#7fa0bd", "#25415c", rim=None)
    S.add(rgb, a)
    S.air("#2c5270", .45, 1100, 1500)
    rgb, a, _ = mountain(9, 1270, 110, 340, "#4d7490", "#16304a", rim=None)
    S.add(rgb, a)
    S.air("#27496a", .42, 1200, 1560)
    rgb, a, _ = mountain(12, 1380, 70, 260, "#2c4d66", "#0c1e30", rim=None)
    S.add(rgb, a)
    S.air("#234465", .35, 1300, 1600)
    r = np.random.default_rng(7)
    # Mid forest plane.
    m = np.zeros((H * 4 // 4, W), np.uint8)
    prof = 1500 + 30 * np.sin(X[0] / 170) + 60 * ((X[0] - 540) / 540) ** 2
    for x in np.r_[r.uniform(-20, 330, 26), r.uniform(760, 1100, 28)]:
        pine(m, x, 1500 + r.uniform(10, 60), r.uniform(90, 200), r)
    mf = m.astype(np.float32) / 255
    col = (hexc("#0f2436") + (np.clip(1 - (Y - 1320) / 300, 0, 1))[..., None] * hexc("#20405a"))
    S.add(col, mf)
    S.air("#1c3a58", .18, 1300, 1650)
    # The rock he stands on, lit from behind him.
    prof2 = 1505 + 8 * (fbm((1, W), 60, 21, 4)[0] - .5) + 150 * (np.abs(X[0] - 540) / 540) ** 2.4
    a2 = smoothstep(0, 1.6, Y - prof2[None, :])
    R = ridged((H, W), 130, 23, 6)
    gy, gx = np.gradient(cv2.GaussianBlur(R, (0, 0), 1))
    sh = np.clip(.45 + 16 * (gx * -.3 + gy * -.8), 0, 1)[..., None]
    rock = hexc("#050a12") * (1 - sh) + hexc("#2d4a62") * sh
    rock = rock + (np.exp(-np.clip(Y - prof2[None, :], 0, None) / 8))[..., None] * hexc("#8fb4d0") * .55
    S.add(rock, a2)
    fm = fig_mask("a", .2)
    fc = hexc("#070b12") + rim_of(fm, -2, 2)[..., None] * hexc("#b9d8ee") * 1.4
    S.add(fc * np.ones((H, W, 3), np.float32), fm)
    # Foreground: pine boughs and rock, soft, close to the lens.
    m = np.zeros((H, W), np.uint8)
    pine(m, 60, 2050, 1000, r, .34)
    pine(m, 1060, 2120, 880, r, .3)
    S.add(np.ones((H, W, 3), np.float32) * hexc("#02050a"), m.astype(np.float32) / 255, 11)
    return finish(S.img, .018)


def finish(img, g=.012, moat=None):
    img = img + gb(np.clip(img - .5, 0, None), 30) * .2
    v = 1 - .34 * (((X - 540) / 760) ** 2 + ((Y - 960) / 1250) ** 2)
    img = np.clip(img * v[..., None], 0, 1)
    img = img / (1 + img * .16)
    n = np.random.default_rng(3).normal(0, g, (H, W, 1)).astype(np.float32)
    return srgb(np.clip(img + n * (.3 + img), 0, 1))


def scene_b():
    r = np.random.default_rng(16)
    sun = (150, 300)
    d = np.hypot(X - sun[0], Y - sun[1])
    sky = hexc("#fff0c2") * (np.exp(-d / 620))[..., None] * 1.5 + hexc("#6f9a96") * (1 - np.exp(-d / 620))[..., None]
    S = Stack(sky, "b")
    for seed, base, amp, cell, l, k, h in ((3, 1000, 90, 460, "#a7bdae", "#7c9d97", .4), (6, 1100, 70, 360, "#8fae8d", "#587f75", .4)):
        rgb, a, _ = mountain(seed, base, amp, cell, l, k, sun=(-.6, -.6))
        S.add(rgb, a)
        S.air("#e8dcb4", h, 800, 1400)
    # Far trees.
    col, a = leaf_mass([(x, 1140 + r.uniform(-30, 30), 120, 80) for x in np.linspace(-40, 1120, 11)], 51, dark="#4f7564", mid="#6f9478", lit="#b9cc94", edge="#d6dcae", n_per=.6)
    S.add(col, a)
    S.air("#eadfb2", .42, 900, 1450)
    # Meadow.
    prof = 1250 + 26 * np.sin(X[0] / 260)
    a = smoothstep(0, 2, Y - prof[None, :])
    g = fbm((H, W), 60, 8, 5)
    gr = cv2.resize(fbm((H // 2, W * 2), 6, 9, 3), (W, H), interpolation=cv2.INTER_AREA)
    mead = hexc("#4d7a42") * (1.0 + 1.3 * (g[..., None] - .5)) * (.6 + .8 * gr[..., None])
    mead = mead * (.4 + .85 * (1 - smoothstep(1250, 1800, Y)))[..., None] + hexc("#e9d79a") * (np.exp(-(Y - 1250).clip(0) / 120) * a)[..., None] * .35
    S.add(mead, a)
    # Mid trees, left, deep in the middle distance.
    col, a = leaf_mass([(60, 880, 210, 240), (250, 1060, 120, 100), (150, 760, 140, 120)], 52, dark="#1d3a2c", mid="#3e6a46", lit="#b8cc78")
    S.add(col, a)
    S.air("#f0e2ae", .14, 700, 1400)
    # The tree, right: a trunk you could lean on, and a canopy overhead.
    q = np.zeros((H, W), np.uint8)
    tr = P.taper([[1040, 1590], [1030, 1260], [980, 1020], [900, 780], [830, 600]], 190, 74, 18, .5)
    cv2.fillPoly(q, [np.round(tr * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    for b_ in ([[900, 780], [760, 640], [600, 600]], [[930, 830], [1040, 690], [1100, 560]], [[840, 620], [730, 470], [560, 420]]):
        cv2.fillPoly(q, [np.round(P.taper(b_, 46, 12, 10) * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    tm = q.astype(np.float32) / 255
    bark = cv2.resize(fbm((H // 3, W), 14, 13, 5), (W, H), interpolation=cv2.INTER_CUBIC)
    lit = smoothstep(.9, .3, (X - 880 - (1500 - Y) * -.2) / 260)
    tc = (hexc("#120c08") + (hexc("#5a4630") - hexc("#120c08")) * (lit * (np.clip(bark, 0, 1) ** 1.6) * .7)[..., None])
    tc = tc + gb(rim_of(tm, 4, 2), 1.5)[..., None] * hexc("#ffd890") * .8
    S.add(tc, tm)
    col, a = leaf_mass([(800, 250, 330, 230), (1020, 480, 160, 130), (480, 430, 190, 110), (640, 160, 200, 140), (950, 120, 180, 130)], 53)
    S.add(col, a)
    stems = np.zeros((H, W), np.uint8)
    for x, y, q_ in ((430, 588, 13), (566, 578, 15), (702, 528, 14)):
        cv2.line(stems, (x * 4, (y - 52) * 4), (x * 4, (y - q_) * 4), 255, 3, cv2.LINE_AA, 2)
    S.add(np.ones((H, W, 3), np.float32) * hexc("#1a120c"), stems.astype(np.float32) / 255)
    for x, y, q_ in ((430, 588, 13), (566, 578, 15), (702, 528, 14)):
        k = smoothstep(q_ + 1, q_ - 1, np.hypot(X - x, Y - y))
        c = hexc("#a33a22") + (smoothstep(q_, 0, np.hypot(X - x + 5, Y - y + 5)) ** 2)[..., None] * hexc("#d8804a")
        S.add(c, k)
    # Light in the air: shafts from behind the left canopy, in front of the ground but behind the two of them.
    src = np.exp(-(d / 240) ** 2) * (1 - a * .7)
    rays = npr.rays(src, sun, 34, .972, .02)
    rays = gb(rays, 3)
    S.img = S.img + rays[..., None] * hexc("#ffe2a6") * .6
    fm = fig_mask("b", .165)
    fc = hexc("#1b130f") + rim_of(fm, 2, 1)[..., None] * hexc("#ffdf9e") * .8
    shadow = np.exp(-(((Y - 1524) / 9) ** 2)) * (np.exp(-((X - 340) / 150) ** 2) + np.exp(-((X - 810) / 150) ** 2)) * .55
    S.img = S.img * (1 - shadow[..., None])
    S.add(fc * np.ones((H, W, 3), np.float32), fm)
    fx, fy = P.fruit_px()
    k = smoothstep(31, 29, np.hypot(X - fx, Y - fy))
    c = hexc("#a83a1f") + (smoothstep(30, 0, np.hypot(X - fx + 10, Y - fy + 10)) ** 1.5)[..., None] * hexc("#ffa070") * .9
    S.add(c, k)
    # Foreground leaves, out of focus, and grass heads at the bottom.
    m = np.zeros((H, W), np.uint8)
    for _ in range(90):
        x, y = r.uniform(-40, 380), r.uniform(-40, 240)
        if r.random() < .45:
            x, y = r.uniform(-60, 1140), r.uniform(1810, 1960)
        l, w_ = r.uniform(30, 80), r.uniform(9, 22)
        cv2.ellipse(m, (int(x), int(y)), (int(l), int(w_)), r.uniform(0, 180), 0, 360, 255, -1, cv2.LINE_AA)
    S.add(np.ones((H, W, 3), np.float32) * hexc("#16301f"), m.astype(np.float32) / 255, 10)
    return finish(S.img, .012)


def trunks(n, seed, wr, col_l, col_d, xr=(-30, 1110), ground=1600, avoid=()):
    r = np.random.default_rng(seed)
    m = np.zeros((H, W), np.uint8)
    tex = np.zeros((H, W), np.float32)
    for x in np.linspace(*xr, n) + r.uniform(-30, 30, n):
        if any(abs(x - c) < q for c, q in avoid):
            continue
        w = r.uniform(*wr)
        p = P.taper([[x + r.uniform(-20, 20), ground + 40], [x + r.uniform(-12, 12), 900], [x + r.uniform(-24, 24), -30]], w * 1.3, w * .72, 10, .5)
        cv2.fillPoly(m, [np.round(p * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    a = m.astype(np.float32) / 255
    bark = cv2.resize(fbm((H // 4, W), 10, seed + 1, 5), (W, H), interpolation=cv2.INTER_CUBIC)
    return a, bark


def scene_c():
    r = np.random.default_rng(26)
    lx, ly = P.LIGHT_C
    d = np.hypot((X - lx) * 1.15, (Y - ly) * .8)
    warm = np.exp(-(d / 230) ** 2)
    sky = hexc("#0a1a22") * 1 + hexc("#16343c") * smoothstep(200, 1300, Y)[..., None]
    sky = sky + warm[..., None] * hexc("#e6a653") * .75 + np.exp(-(d / 46) ** 2)[..., None] * hexc("#ffe7b4") * 1.1
    sky = sky + np.exp(-(((X - 700) / 260) ** 2 + ((Y - 1420) / 240) ** 2))[..., None] * hexc("#3d6a6a") * .85
    S = Stack(sky, "c")
    for seed, n, wr, air, gr in ((31, 24, (14, 26), .45, 1400), (32, 16, (26, 44), .42, 1470), (33, 11, (44, 76), .32, 1530)):
        a, bark = trunks(n, seed, wr, None, None, ground=gr, avoid=((lx, 46), (720, 90 + wr[1])))
        side = np.clip((lx - X) * -1 / 700, -1, 1)
        c = hexc("#0b2026") * (.7 + .8 * bark[..., None])
        S.add(c, a)
        S.air("#1a3d42", air, 700, 1560)
        S.img = S.img + warm[..., None] * hexc("#c98b42") * .18
    # Shafts of warm light pushing through the gaps.
    a_near, bark = trunks(6, 34, (80, 130), None, None, ground=1600, xr=(-10, 1100), avoid=((lx, 140), (680, 300)))
    src = warm * (1 - a_near)
    rays = gb(npr.rays(src, (lx, ly), 30, .972, .022), 3)
    S.img = S.img + rays[..., None] * hexc("#ffcf8a") * .5
    # Ground.
    prof = 1570 + 22 * np.sin(X[0] / 240) + 10 * (fbm((1, W), 90, 37, 4)[0] - .5)
    a = smoothstep(0, 2, Y - prof[None, :])
    lit = np.exp(-(((X - lx) / 700) ** 2))
    ground = (hexc("#071114") + hexc("#1c3338") * cv2.resize(fbm((H // 4, W), 16, 38, 5), (W, H), interpolation=cv2.INTER_CUBIC)[..., None]) * (.4 + 1.1 * lit[..., None])
    ground = ground + (np.exp(-np.clip(Y - prof[None, :], 0, None) / 40) * lit * .8)[..., None] * hexc("#b98d52") * .5
    S.add(ground, a)
    # Near trunks, with one warm edge where the distant light catches them.
    edge = rim_of(a_near, 6, 0)
    c = hexc("#060d10") * (.6 + .9 * bark[..., None]) + gb(edge, 2)[..., None] * hexc("#c98f4e") * .45 * (np.exp(-((Y - ly) / 500) ** 2))[..., None]
    S.add(c, a_near)
    S.air("#143338", .1, 900, 1600)
    q = np.zeros((H, W), np.uint8)
    p = P.taper([[P.TRUNK_C - 34, 1660], [P.TRUNK_C - 26, 900], [P.TRUNK_C - 40, -30]], 250, 150, 10)
    cv2.fillPoly(q, [np.round(p * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    tm = q.astype(np.float32) / 255
    bark2 = cv2.resize(fbm((H // 3, W), 16, 41, 5), (W, H), interpolation=cv2.INTER_CUBIC)
    S.add(hexc("#04090b") * (.7 + bark2[..., None] * 1.1) + gb(rim_of(tm, 7, 0), 2)[..., None] * hexc("#d39a58") * .7 * (np.exp(-((Y - ly) / 520) ** 2))[..., None], tm)
    fm = fig_mask("c", .175)
    fc = hexc("#06090b") + rim_of(fm, 2, 1)[..., None] * hexc("#efb878") * .6
    S.img = S.img * (1 - (np.exp(-(((Y - 1594) / 10) ** 2)) * np.exp(-((X - 660) / 190) ** 2) * .6)[..., None])
    S.add(fc * np.ones((H, W, 3), np.float32), fm)
    m = np.zeros((H, W), np.uint8)
    for _ in range(46):
        x = r.uniform(-30, 1110) if r.random() < .6 else r.uniform(760, 1110)
        y0 = r.uniform(1800, 1950)
        for k in range(5):
            t = np.linspace(0, 1, 6)[:, None]
            a0 = r.uniform(-2.6, -.5)
            l = r.uniform(110, 260)
            e = np.array([x, y0]) + np.hstack([np.cos(a0) * l * t, np.sin(a0) * l * t + 90 * t ** 2])
            cv2.fillPoly(m, [np.round(P.taper(e, 18, 2, 3) * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)
    S.add(np.ones((H, W, 3), np.float32) * hexc("#02080a"), m.astype(np.float32) / 255, 9)
    # Dust in the warm air.
    md = np.zeros((H, W), np.float32)
    for _ in range(170):
        x, y = r.uniform(0, 620), r.uniform(700, 1560)
        cv2.circle(md, (int(x), int(y)), int(r.integers(1, 3)), float(r.uniform(.25, 1)), -1, cv2.LINE_AA)
    S.img = S.img + gb(md, .9)[..., None] * hexc("#ffd8a0") * warm[..., None].clip(.1, 1) * .8
    return finish(S.img, .014)


if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if not a.startswith("-")] or ["a", "b", "c"]
    for k in want:
        save("04_2_5d_atmospheric", k, dict(a=scene_a, b=scene_b, c=scene_c)[k]())
        print(k, flush=True)
