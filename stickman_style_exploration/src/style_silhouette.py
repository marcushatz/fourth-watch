"""05 Minimalist silhouette. One flat black world cut hard against a rich, deep sky. No haze, no blur on the black."""
import cv2
import numpy as np

from kit import H, P, W, fig_mask, npr, save, smoothstep, stars

fbm, blur, hexc, srgb = npr.fbm, npr.blur, npr.hexc, npr.srgb
SS = 2
Y, X = np.mgrid[:H, :W].astype(np.float32)


def ramp(t, stops):
    t = np.clip(t, 0, 1)
    xs = [s[0] for s in stops]
    cs = np.array([hexc(s[1]) for s in stops], np.float32)
    return np.dstack([np.interp(t, xs, cs[:, i]) for i in range(3)]).astype(np.float32)


def bands(seed, th=.56):
    """Long, thin, hard-edged shelves of cloud, far wider than they are tall."""
    a = cv2.resize(fbm((int(H / 2), int(W / 26)), 42, seed, 5), (W, H), interpolation=cv2.INTER_CUBIC)
    a = a + .03 * (fbm((H, W), 26, seed + 3, 3) - .5)
    return smoothstep(th, th + .006, a)


class Ink:
    def __init__(s, seed):
        s.m = np.zeros((H * SS, W * SS), np.uint8)
        s.r = np.random.default_rng(seed)

    def seg(s, a, b, w):
        cv2.line(s.m, tuple(np.round(np.array(a) * SS * 16).astype(int)), tuple(np.round(np.array(b) * SS * 16).astype(int)), 255, max(int(round(w * SS)), 1), cv2.LINE_AA, 4)

    def clump(s, x, y, rad, n=26):
        r = s.r
        for _ in range(n):
            a, k = r.uniform(0, 6.28), r.random() ** .6
            px, py = x + rad * k * np.cos(a), y + rad * .7 * k * np.sin(a)
            q = r.uniform(rad * .1, rad * .3)
            ang = r.uniform(0, 180)
            cv2.ellipse(s.m, (int(px * SS), int(py * SS)), (int(q * SS * 1.3), max(int(q * SS * .5), 1)), ang, 0, 360, 255, -1, cv2.LINE_AA)

    def branch(s, x, y, ang, L, w, depth, leaf=0.0, spread=26):
        r = s.r
        steps = 6
        curl = r.uniform(-.09, .09)
        for i in range(steps):
            ang2 = ang + curl + r.normal(0, .06)
            nx, ny = x + np.cos(ang2) * L / steps, y + np.sin(ang2) * L / steps
            w2 = w * (1 - .55 / steps)
            s.seg((x, y), (nx, ny), w)
            x, y, ang, w = nx, ny, ang2, w2
        if depth <= 0 or w < 1.1:
            if leaf:
                s.clump(x, y, leaf)
            return
        for k in range(int(r.integers(2, 4))):
            d = np.deg2rad(r.uniform(spread * .5, spread * 1.5)) * r.choice([-1, 1])
            s.branch(x, y, ang + d, L * r.uniform(.62, .84), w * r.uniform(.6, .8), depth - 1, leaf, spread)

    def trunk(s, x, y0, y1, w0, w1, lean=0):
        pts = []
        for t in np.linspace(0, 1, 30):
            y = y0 + (y1 - y0) * t
            xx = x + lean * t + 6 * np.sin(t * 7 + x)
            w = w0 + (w1 - w0) * t
            pts.append((xx, y, w))
        l = np.array([[p[0] - p[2] / 2, p[1]] for p in pts])
        r_ = np.array([[p[0] + p[2] / 2, p[1]] for p in pts])
        cv2.fillPoly(s.m, [np.round(np.vstack([l, r_[::-1]]) * SS * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)

    def ground(s, prof):
        q = np.vstack([np.stack([np.arange(W + 1), prof[:W + 1]], 1), [W, H], [0, H]])
        cv2.fillPoly(s.m, [np.round(q * SS * 16).astype(np.int32)], 255, cv2.LINE_AA, 4)

    def grass(s, prof, n, hmin, hmax):
        r = s.r
        for _ in range(n):
            x = r.uniform(0, W - 1)
            y = prof[int(x)] + 3
            h = r.uniform(hmin, hmax)
            lean = r.normal(0, .35) * h
            mid = (x + lean * .4, y - h * .6)
            top = (x + lean, y - h)
            s.seg((x, y), mid, 1.8)
            s.seg(mid, top, 1.0)

    def mask(s):
        return cv2.resize(s.m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255


def disc(cx, cy, rad, edge=1.2):
    return smoothstep(rad + edge, rad - edge, np.hypot(X - cx, Y - cy))


def scene_a():
    cx, cy, rad = 540, 1090, 470
    d = np.hypot(X - cx, Y - cy)
    t = (d - 300) / 1200 + .1 * (fbm((H, W), 500, 2, 3) - .5)
    sky = ramp(t, [(0, "#2c4a78"), (.2, "#18305f"), (.5, "#0f1b45"), (.8, "#0a0f2e"), (1, "#05071a")])
    for seed, th, col in ((2, .6, "#1b3364"), (5, .62, "#27477c")):
        b = bands(seed, th) * smoothstep(1250, 1000, np.abs(Y - 700) + 620) * .9
        sky = sky * (1 - b[..., None] * .5) + hexc(col) * b[..., None] * .5
    st = stars(4, 2600, big=.03, ymax=1450)
    sky += st[..., None] * np.array([.9, .95, 1.1], np.float32) * (.25 + .75 * smoothstep(500, 700, d))[..., None]
    m = (.55 + .45 * smoothstep(.34, .66, fbm((H, W), 220, 8, 5)))
    moon = (hexc("#f4e7c8") * (.78 + .22 * m[..., None]))
    moon = moon * (1 - .3 * smoothstep(rad * .55, rad * 1.02, d))[..., None]
    k = disc(cx, cy, rad)[..., None]
    img = sky * (1 - k) + moon * k
    img += (np.exp(-np.clip(d - rad, 0, None) / 150) * (1 - k[..., 0]))[..., None] * hexc("#5d7fb0") * .5
    # Far range, flat.
    r = np.random.default_rng(3)
    far = 1462 + 70 * (fbm((1, W), 300, 7, 5)[0] - .5) * 2 + 10 * (fbm((1, W), 40, 8, 3)[0] - .5)
    f = (Y > far[None, :]).astype(np.float32)
    img = img * (1 - f[..., None]) + hexc("#0c1730") * f[..., None]
    k2 = Ink(6)
    prof = 1505 + 62 * ((X[0] - 540) / 540) ** 2 + 7 * (fbm((1, W), 110, 9, 4)[0] - .5)
    prof = prof.astype(np.float64)
    k2.ground(np.r_[prof, prof[-1]])
    k2.grass(np.r_[prof, prof[-1]], 1500, 5, 22)
    for tx, sc in ((60, 1), (970, 1.15), (1040, .8)):
        k2.branch(tx, prof[int(min(tx, W - 1))] + 8, -1.57, 170 * sc, 15 * sc, 5, leaf=20 * sc, spread=24)
    mask = np.clip(k2.mask() + fig_mask("a", .17), 0, 1)
    return srgb(np.clip(img * (1 - mask[..., None]) + hexc("#04050a") * mask[..., None], 0, 1))


def scene_b():
    fx, fy = P.fruit_px()
    cx, cy, rad = fx - 10, 960, 420
    d = np.hypot(X - cx, Y - cy)
    sky = ramp((d - 250) / 1300, [(0, "#f8b65a"), (.16, "#ea7a3f"), (.36, "#b8405a"), (.58, "#6a2a68"), (.8, "#2d1b52"), (1, "#110e30")])
    for seed, th, col, a in ((12, .59, "#6d2a62", .55), (15, .61, "#d8603f", .4)):
        b = bands(seed, th) * (1 - disc(cx, cy, rad + 2, 2))
        sky = sky * (1 - b[..., None] * a) + hexc(col) * b[..., None] * a
    sun = ramp((Y - (cy - rad)) / (rad * 2), [(0, "#fff0c0"), (.5, "#ffd88a"), (1, "#f79a4a")])
    k = disc(cx, cy, rad)[..., None]
    img = sky * (1 - k) + sun * k
    img += (np.exp(-np.clip(d - rad, 0, None) / 120) * (1 - k[..., 0]))[..., None] * hexc("#ffb060") * .35
    k2 = Ink(7)
    prof = 1520 + 26 * np.sin(X[0] / 300 + .6) + 6 * (fbm((1, W), 90, 19, 4)[0] - .5)
    prof = prof.astype(np.float64)
    prof = np.r_[prof, prof[-1]]
    k2.ground(prof)
    k2.grass(prof, 1800, 6, 28)
    # One great tree, entering from the right and reaching over them.
    k2.trunk(1060, 1560, 760, 170, 90, lean=-90)
    x, y = 970, 760
    for a, l, w, dep in ((-2.5, 300, 54, 6), (-1.9, 280, 48, 6), (-1.25, 240, 46, 6), (-2.95, 260, 34, 5)):
        k2.branch(x, y, a, l, w, dep, leaf=30, spread=30)
    for hx, hy, q in ((640, 640, 16), (505, 590, 14), (775, 700, 15), (390, 600, 12)):
        k2.seg((hx, hy - 60), (hx, hy), 2)
        cv2.circle(k2.m, (int(hx * SS), int(hy * SS)), int(q * SS), 255, -1, cv2.LINE_AA)
    mask = np.clip(k2.mask() + fig_mask("b", .135), 0, 1)
    img = img * (1 - mask[..., None]) + hexc("#0a0406") * mask[..., None]
    fr = disc(fx, fy, 33, 1.2)[..., None]
    img = img * (1 - fr) + (hexc("#b92c1a") * (1 + .9 * smoothstep(40, 0, np.hypot(X - fx + 10, Y - fy + 12)))[..., None] if False else hexc("#b92c1a")) * fr
    return srgb(np.clip(img, 0, 1))


def scene_c():
    lx, ly = P.LIGHT_C
    mist = np.exp(-(((X - 700) / 420) ** 2 + ((Y - 1400) / 300) ** 2))
    t = Y / H + .08 * (fbm((H, W), 500, 2, 3) - .5)
    img = ramp(t, [(0, "#050b16"), (.4, "#0a2030"), (.7, "#123a48"), (.85, "#0d2a35"), (1, "#050c12")])
    img = img + mist[..., None] * hexc("#3f7f87") * .9
    img = img + np.exp(-(((X - lx) / 100) ** 2 + ((Y - ly) / 220) ** 2))[..., None] * hexc("#f0a24a") * .55
    img = img + np.exp(-(((X - lx) / 18) ** 2 + ((Y - ly) / 120) ** 2))[..., None] * hexc("#ffe0a0") * .9
    # Middle plane: a flat, slightly lifted tone so the black plane has something to cut against.
    k1 = Ink(11)
    r = k1.r
    for x in r.uniform(0, W, 16):
        if abs(x - lx) < 70 or 560 < x < 880:
            continue
        k1.trunk(x, 1560, -20, r.uniform(34, 60), r.uniform(18, 30), lean=r.uniform(-20, 20))
        k1.branch(x, r.uniform(500, 1100), r.choice([-.5, -2.6]), 160, 12, 4, 0, 30)
    m1 = k1.mask()
    img = img * (1 - m1[..., None]) + hexc("#071a24") * m1[..., None]
    k2 = Ink(12)
    prof = 1590 + 20 * np.sin(X[0] / 240) + 5 * (fbm((1, W), 80, 29, 4)[0] - .5)
    prof = np.r_[prof.astype(np.float64), prof[-1]]
    k2.ground(prof)
    k2.grass(prof, 1700, 8, 34)
    for x, w0, w1, l in ((30, 200, 120, 0), (P.TRUNK_C - 30, 230, 130, -14), (1010, 180, 110, 30)):
        k2.trunk(x, 1640, -20, w0, w1, lean=l)
    for x, y, a, l, w in ((560, 880, -.45, 300, 26), (560, 620, -.7, 330, 30), (420, 720, -2.6, 240, 24), (930, 760, -2.5, 280, 26), (930, 420, -2.6, 300, 26), (60, 980, -.55, 200, 18), (110, 600, -.6, 240, 22)):
        k2.branch(x, y, a, l, w, 5, 0, 30)
    mask = np.clip(k2.mask() + fig_mask("c", .15), 0, 1)
    return srgb(np.clip(img * (1 - mask[..., None]) + hexc("#02040a") * mask[..., None], 0, 1))


if __name__ == "__main__":
    for k, fn in dict(a=scene_a, b=scene_b, c=scene_c).items():
        save("05_minimalist_silhouette", k, fn())
    print("ok")
