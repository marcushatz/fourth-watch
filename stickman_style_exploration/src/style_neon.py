"""06 Neon noir. The picture is made of light: thin tubes in a black room, haze around them, a wet floor under them."""
import cv2
import numpy as np

from kit import H, P, W, npr, save, smoothstep

fbm, blur, hexc, srgb = npr.fbm, npr.blur, npr.hexc, npr.srgb
Y, X = np.mgrid[:H, :W].astype(np.float32)
FLOOR = {"a": 1505, "b": 1518, "c": 1592}


class Tube:
    def __init__(s):
        s.l = np.zeros((H * 2, W * 2, 3), np.float32)
        s.groups = {}

    def line(s, pts, col, w=2.2, power=1.0, closed=False):
        p = np.round(np.asarray(pts)[:, :2] * 2 * 16).astype(np.int32)
        k = (tuple(np.round(np.asarray(col, float), 3)), round(power * 12) / 12)
        one = s.groups.setdefault(k, np.zeros((H * 2, W * 2), np.uint8))
        cv2.polylines(one, [p], closed, 255, max(int(w * 2), 1), cv2.LINE_AA, 4)
        return s

    def circle(s, c, r, col, w=2.2, power=1.0, start=0, end=360):
        th = np.deg2rad(np.linspace(start, end, 200))
        return s.line(np.stack([c[0] + r * np.cos(th), c[1] + r * np.sin(th)], 1), col, w, power)

    def done(s):
        out = cv2.resize(s.l, (W, H), interpolation=cv2.INTER_AREA)
        for (col, power), m in s.groups.items():
            out += cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)[..., None] / 255 * (np.array(col, np.float32) * power)
        return out


def figure(t, f, col, w, power=1.0):
    for k in ("leg_b", "arm_b", "spine", "leg_a", "arm_a"):
        t.line(P.smooth(f["limbs"][k], 10), col, w, power)
    t.line([f["limbs"]["spine"][0], f["head"] + (f["limbs"]["spine"][0] - f["head"]) / np.linalg.norm(f["limbs"]["spine"][0] - f["head"]) * f["head_r"]], col, w, power)
    for h in f["hair"]:
        t.line(P.smooth(h, 10), col, w * .8, power * .9)
    t.circle(f["head"], f["head_r"], col, w, power)


def gb(L, s_):
    """A wide Gaussian done at low resolution: wide glows would otherwise take minutes."""
    if s_ < 12:
        return cv2.GaussianBlur(L, (0, 0), s_)
    k = 8 if s_ >= 30 else 4
    q = cv2.resize(L, (W // k, H // k), interpolation=cv2.INTER_AREA)
    return cv2.resize(cv2.GaussianBlur(q, (0, 0), s_ / k), (W, H), interpolation=cv2.INTER_LINEAR)


def glow(L, scale=1.0):
    out = L * 1.0
    for s_, a in ((1.6, .8), (4.5, .55), (13, .34), (38, .2), (100, .1)):
        out = out + gb(L, s_) * a * s_ ** .5 * scale
    return out


def compose(L, scene, haze=.5, hazecol="#0e1a2a", fg=None, rip=1.0):
    """Mirror the lights into the floor, break the mirror with ripples, then build the haze."""
    fy = FLOOR[scene]
    h = H - fy
    refl = np.zeros_like(L)
    m = min(h, fy)
    refl[fy:fy + m] = L[fy - m:fy][::-1]
    d = (fbm((H, W), 24, 3, 3) - .5)
    stretch = 1 + np.clip(Y - fy, 0, None) / 180
    dx = d * 34 * rip * np.clip((Y - fy) / 160, 0, 1.4)
    dy = (fbm((H, W), 40, 5, 2) - .5) * 22 * rip * np.clip((Y - fy) / 200, 0, 1)
    refl = cv2.remap(refl, X + dx, Y + dy, cv2.INTER_LINEAR)
    refl = cv2.GaussianBlur(refl, (0, 0), sigmaX=2.0, sigmaY=9)
    fres = (.42 * np.exp(-np.clip(Y - fy, 0, None) / 300) + .05)[..., None]
    above = (Y < fy)[..., None].astype(np.float32)
    streaks = 1 - .55 * smoothstep(.44, .6, cv2.resize(fbm((H, 200), 12, 9, 3), (W, H)))
    GL = glow(L)
    A = GL * above + GL * (1 - above) * .12
    Rf = glow(refl, .6) * fres * streaks[..., None] * (1 - above)
    base = hexc("#04060b") * (1 - .5 * above) + hexc("#05080d") * .2
    amb = gb(GL * .8 + Rf, 90) * (.3 + 1.2 * smoothstep(.35, .7, fbm((H, W), 340, 7, 5)))[..., None] * haze
    img = base + hexc(hazecol) * (.3 + 1.1 * fbm((H, W), 420, 8, 5))[..., None] * .12 + amb + A + Rf
    floorline = np.exp(-np.abs(Y - fy) / 2.4)[..., None] * gb(GL * .5, 26) * .35
    img = img + floorline
    img = 1 - np.exp(-img * 1.22)
    g = np.random.default_rng(4).normal(0, .014, (H, W, 1)).astype(np.float32)
    return srgb(np.clip(img + g * (img + .1), 0, 1))


COLD, ICE, WARM, EMBER, GOLD, DEEP = hexc("#2c7bd6"), hexc("#b8e4ff"), hexc("#ffd9b8"), hexc("#ff4a24"), hexc("#ffbb55"), hexc("#163a7a")


def ridge(seed, y, amp, cell):
    return y + amp * 2 * (fbm((1, W), cell, seed, 5)[0] - .5)


def scene_a():
    r = np.random.default_rng(6)
    t = Tube()
    # Stars as tiny lamps, a handful of them bright. No lines between them: the emptiness is the point.
    for _ in range(170):
        x, y = r.uniform(0, W), r.uniform(0, 1250) ** 1.0
        q = r.random() ** 3
        p = .15 + 1.0 * q
        cv2.circle(t.l, (int(x * 2), int(y * 2)), 1 + int(q * 2.5), tuple((ICE * p * 1.4).tolist()), -1)
    for i, rad in enumerate((520, 760, 1040, 1360)):
        t.circle((540, 1505), rad, COLD, 1.0, .12 + .09 * (3 - i), 203, 337)
    for seed, y, amp, cell, p in ((3, 1320, 72, 360, .34), (4, 1410, 40, 250, .55)):
        yy = ridge(seed, y, amp, cell)
        t.line(np.stack([np.arange(0, W, 4), yy[::4]], 1), COLD, 1.4, p)
    f = P.figures("a")[0]
    figure(t, f, ICE, 1.7, 1.5)
    return compose(t.done(), "a", .6, "#0d1a33")


def tree(t, r, x, y, ang, L, w, depth, col, p):
    pts = [(x, y)]
    n = 8
    a = ang
    cu = r.uniform(-.1, .1)
    for i in range(n):
        a += cu + r.normal(0, .05)
        x += np.cos(a) * L / n
        y += np.sin(a) * L / n
        pts.append((x, y))
    t.line(pts, col, w, p)
    if depth > 0:
        for s_ in (-1, 1):
            tree(t, r, x, y, a + s_ * np.deg2rad(r.uniform(16, 38)), L * r.uniform(.66, .84), max(w * .8, 1.0), depth - 1, col, p * .92)
    else:
        for i in range(2):
            lx, ly = x + r.uniform(-12, 12), y + r.uniform(-12, 12)
            th = r.uniform(0, 3.14)
            e = np.array([np.cos(th), np.sin(th)]) * r.uniform(8, 14)
            t.line([(lx - e[0], ly - e[1]), (lx + e[0], ly + e[1])], hexc("#31c7a0"), 1.0, p * 1.1)


def scene_b():
    r = np.random.default_rng(13)
    t = Tube()
    G = hexc("#167f76")
    tree(t, r, 985, 1518, -1.72, 470, 2.6, 1, G, .55)
    tree(t, r, 930, 1090, -1.95, 330, 2.0, 4, G, .5)
    tree(t, r, 930, 1090, -2.45, 330, 2.0, 5, G, .5)
    tree(t, r, 960, 1000, -1.25, 280, 1.8, 3, G, .45)
    for seed, y, amp, cell, p in ((9, 1452, 18, 240, .22),):
        yy = ridge(seed, y, amp, cell)
        t.line(np.stack([np.arange(0, W, 4), yy[::4]], 1), COLD, 1.2, p)
    for x, y, q in ((520, 520, 13), (660, 610, 12), (410, 610, 11)):
        t.line([(x, y - 54), (x, y - q)], G, 1.2, .8)
        t.circle((x, y), q, EMBER, 1.6, .75)
    fs = P.figures("b")
    figure(t, fs[0], WARM, 2.4, 1.2)
    figure(t, fs[1], ICE, 2.4, 1.2)
    fx, fy = P.fruit_px()
    t.circle((fx, fy), 30, EMBER, 3.2, 2.6)
    cv2.circle(t.l, (int(fx * 2), int(fy * 2)), 52, tuple((EMBER * .3).tolist()), -1)
    return compose(t.done(), "b", .75, "#10141f")


def scene_c():
    r = np.random.default_rng(23)
    t = Tube()
    lx, ly = P.LIGHT_C
    fy = FLOOR["c"]
    for x, p, w in zip(np.linspace(12, 1070, 26) + r.uniform(-16, 16, 26), r.uniform(.05, .26, 26), r.uniform(.8, 1.5, 26)):
        if abs(x - lx) < 34:
            continue
        s_ = r.uniform(-14, 14)
        t.line([(x, -10), (x + s_, fy)], COLD, w, p)
    t.line([(P.TRUNK_C - 80, -10), (P.TRUNK_C - 96, fy)], hexc("#1f8fa6"), 1.4, .38)
    t.line([(P.TRUNK_C + 70, -10), (P.TRUNK_C + 92, fy)], hexc("#1f8fa6"), 1.4, .38)
    t.line([(lx, ly - 120), (lx, ly + 120)], GOLD, 2.2, 1.5)
    for k in (-1, 1):
        t.line([(lx + k * 16, ly - 84), (lx + k * 16, ly + 84)], GOLD, .8, .2)
    figure(t, P.figures("c")[0], hexc("#8fd0e8"), 2.2, .85)
    L = t.done()
    return compose(L, "c", .62, "#0a1a22")


if __name__ == "__main__":
    for k, fn in dict(a=scene_a, b=scene_b, c=scene_c).items():
        save("06_neon_noir", k, fn())
    print("ok")
