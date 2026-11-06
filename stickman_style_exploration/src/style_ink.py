"""03 Hand-drawn ink. A bristle-by-bristle brush engine on rice paper. No image filter touches the drawing."""
import cv2
import numpy as np

from kit import FR, H, P, W, npr, save, smoothstep

fbm, blur = npr.fbm, npr.blur
SS = 2


class Sheet:
    def __init__(s, seed=1):
        s.seed = seed
        s.ink = np.zeros((H * SS, W * SS), np.float32)
        s.wash = np.zeros((H, W), np.float32)
        s.red = np.zeros((H, W), np.float32)
        s.gold = np.zeros((H, W), np.float32)
        s.r = np.random.default_rng(seed)

    def stroke(s, path, width, load=1.0, dry=.45, grain=.5, taper=(.1, .75), rough=.8, target=None):
        """One brush mark. Each bristle carries its own ink and runs out on its own schedule."""
        r = s.r
        c = np.asarray(path, float)[:, :2]
        d = np.linalg.norm(np.diff(c, axis=0), axis=1)
        L = np.r_[0, np.cumsum(d)]
        m = max(int(L[-1] * SS * .9), 8)
        t = np.linspace(0, 1, m)
        x, y = np.interp(t * L[-1], L, c[:, 0]), np.interp(t * L[-1], L, c[:, 1])
        tx, ty = np.gradient(x), np.gradient(y)
        q = np.hypot(tx, ty) + 1e-6
        nx, ny = -ty / q, tx / q
        press = smoothstep(0, taper[0], t) * (1 - .86 * smoothstep(taper[1], 1, t))
        press = .12 + .88 * press
        b = max(int(width * SS * 3.2), 9)
        off = r.uniform(-1, 1, b)
        life = 1 - dry * r.random(b) ** 1.3 * (.3 + .95 * np.abs(off))
        amt = load * (.6 + .8 * r.random(b))
        phase = r.uniform(0, 6.28, (b, 3))
        freq = r.uniform(.03, .11, b)
        buf = target if target is not None else s.ink
        hh, ww = buf.shape
        for i in range(b):
            wob = rough * (np.sin(t * 5 + phase[i, 0]) + .5 * np.sin(t * 13 + phase[i, 1])) * .5
            px = (x + nx * (off[i] * width * press / 2 + wob)) * SS
            py = (y + ny * (off[i] * width * press / 2 + wob)) * SS
            alive = t < life[i]
            g = np.sin(t * L[-1] * freq[i] + phase[i, 2]) + .5 * np.sin(t * L[-1] * freq[i] * 2.7 + phase[i, 1])
            a = amt[i] * alive * (g < 1.6 - grain * 2.9 * (t ** 1.3) * (dry + .15)) * (1 - .3 * t * dry)
            ix, iy = px.astype(int), py.astype(int)
            k = (ix >= 0) & (ix < ww) & (iy >= 0) & (iy < hh)
            np.add.at(buf, (iy[k], ix[k]), a[k].astype(np.float32))
        return s

    def dab(s, x, y, rx, ry=None, ang=0, load=1.2, target=None):
        ry = ry or rx
        q = np.linspace(0, 1, 7)
        a = np.deg2rad(ang)
        p = np.stack([x - np.cos(a) * rx * (1 - q * 2), y - np.sin(a) * rx * (1 - q * 2)], 1)
        s.stroke(p, ry * 2, load, dry=.08, grain=.1, taper=(.25, .6), rough=.6, target=target)

    def blob(s, x, y, rx, ry=None, val=7.0, target=None, ang=0):
        """A round touch of the brush tip: a soft-edged, slightly irregular drop of ink."""
        ry = ry or rx
        buf = target if target is not None else s.ink
        th = np.linspace(0, 6.283, 40, endpoint=False)
        ph = s.r.uniform(0, 6.28, 3)
        k = 1 + .05 * np.sin(th * 2 + ph[0]) + .035 * np.sin(th * 3 + ph[1]) + .02 * np.sin(th * 5 + ph[2])
        a = np.deg2rad(ang)
        ex, ey = rx * k * np.cos(th), ry * k * np.sin(th)
        q = np.stack([x + ex * np.cos(a) - ey * np.sin(a), y + ex * np.sin(a) + ey * np.cos(a)], 1) * SS
        m = np.zeros(buf.shape, np.uint8)
        cv2.fillPoly(m, [np.round(q * 8).astype(np.int32)], 255, cv2.LINE_AA, 3)
        buf += m.astype(np.float32) / 255 * val

    def finish(s, wet=.5, wash_gran=.06):
        """Ink sits in the paper: fibres feather the edge and pigment pools at the rim."""
        a = cv2.resize(blur(s.ink, 1.5), (W, H), interpolation=cv2.INTER_AREA)
        paper = fbm((H, W), 3, s.seed + 2, 3)
        dx, dy = fbm((H, W), 7, s.seed + 3, 3) - .5, fbm((H, W), 7, s.seed + 4, 3) - .5
        gy, gx = np.mgrid[:H, :W].astype(np.float32)
        a = cv2.remap(a, gx + dx * 3.5, gy + dy * 3.5, cv2.INTER_LINEAR)
        d = 1 - np.exp(-a * .42)
        rim = np.clip(blur(d, 2.2) - blur(d, 7), 0, 1)
        d = np.clip(d + wet * np.clip(d - blur(d, 5), 0, 1), 0, 1.4)
        d = d * (.88 + .24 * paper)
        w = s.wash * (1 + wash_gran * 6 * (fbm((H, W), 2, s.seed + 9, 2) - .5))
        return d * 3.3 + w + rim * .25

    def render(s, wet=.5, cool=.0):
        D = s.finish(wet)
        fib = fbm((H, W), 2, s.seed + 11, 2)
        long = blur(fbm((H, W), 2, s.seed + 12, 1), 1)
        pap = np.dstack([np.full((H, W), v, np.float32) for v in (.965, .935, .872)])
        pap = pap * (.965 + .05 * fib[..., None] + .03 * (long[..., None] - .5))
        pap *= 1 - .1 * ((np.abs(np.mgrid[:H, :W][1] / W - .5) * 2) ** 3 + (np.abs(np.mgrid[:H, :W][0] / H - .5) * 2) ** 3)[..., None]
        ab = np.array([1.0, 1.03 - cool * .02, 1.1 + cool * .05], np.float32)
        out = pap * np.exp(-D[..., None] * ab)
        out *= np.exp(-s.red[..., None] * np.array([.14, 1.02, 1.42], np.float32))
        out *= np.exp(-s.gold[..., None] * np.array([.06, .42, 1.25], np.float32))
        return out


def fig(s, scene, w, load=1.8, dry=.3):
    """Figures are written with a well-loaded brush and a steady hand: crisp edges, a little dry break at the ends."""
    for f in P.figures(scene):
        L = f["limbs"]
        b = f["u"] * w
        for h in f["hair"]:
            s.stroke(P.smooth(h, 10), f["head_r"] * 1.3, load * .8, dry=.45, grain=.7, taper=(.05, .35), rough=.25)
        s.stroke(P.smooth(L["leg_b"], 10), b * .9, load * .75, dry=dry, taper=(.03, .6), rough=.12)
        s.stroke(P.smooth(L["arm_b"], 10), b * .72, load * .75, dry=dry, taper=(.03, .55), rough=.12)
        s.stroke(P.smooth(np.vstack([f["head"], L["spine"]]), 10), b * 1.2, load, dry=.08, taper=(.05, .85), rough=.12)
        s.stroke(P.smooth(L["leg_a"], 10), b, load, dry=dry, taper=(.03, .6), rough=.12)
        s.stroke(P.smooth(L["arm_a"], 10), b * .8, load, dry=dry, taper=(.03, .55), rough=.12)
        s.blob(f["head"][0], f["head"][1], f["head_r"] * .94, f["head_r"] * 1.02, 8.0)


def ridge(seed, y, amp, n=11):
    r = np.random.default_rng(seed)
    xs = np.linspace(-30, W + 30, n)
    ys = y + np.cumsum(r.normal(0, amp, n)) - np.mean(np.cumsum(r.normal(0, amp, n)))
    return np.stack([xs, ys], 1)


def scene_a():
    s = Sheet(21)
    r = s.r
    # The sky: one enormous wash, wet, laid on until the paper can take no more.
    Y, X = np.mgrid[:H, :W].astype(np.float32)
    v = 1 - smoothstep(620, 1400, Y + 240 * (fbm((H, W), 300, 2, 4) - .5))
    cloud = fbm((H, W), 420, 3, 5)
    band = np.exp(-(((Y - 760 + (X - 540) * -1.05) / 300) ** 2))
    d = v * (3.0 + 2.6 * (cloud - .5)) * (1 - .62 * band * (fbm((H, W), 120, 4, 5) * 1.5))
    # The stars are paper left bare: spatter of resist across the wet ink.
    res = np.zeros((H, W), np.float32)
    for i in range(1500):
        x, y, q = r.uniform(0, W), r.uniform(0, 1250), r.random() ** 5
        rad = .7 + 3.6 * q
        k = 1 + r.uniform(-.2, .6)
        cv2.ellipse(res, (int(x), int(y)), (max(int(rad), 1), max(int(rad / k), 1)), r.uniform(0, 180), 0, 360, float(.5 + .5 * q), -1, cv2.LINE_AA)
    res = blur(res, .6)
    s.wash = d * (1 - np.clip(res * 1.3, 0, 1))
    # Far range, wet-in-wet, already fading into the mist.
    far = ridge(4, 1275, 16, 11)
    yy = np.interp(np.arange(W), far[:, 0], far[:, 1]) + 34 * (fbm((1, W), 80, 5, 4)[0] - .5)
    mm = (Y > yy[None, :]) * (1 - smoothstep(yy[None, :], yy[None, :] + 210, Y))
    s.wash += blur(mm.astype(np.float32), 4) * .55
    # The ridge he stands on: a dark wash, its top edge pulled once with a wide, nearly dry brush.
    xs = np.linspace(-40, 1120, 60)
    prof = 1505 + 12 * np.sin(xs / 190) + 66 * (((xs - 540) / 580) ** 2)
    yy = np.interp(np.arange(W), xs, prof) + 7 * (fbm((1, W), 60, 15, 4)[0] - .5)
    g = blur((Y > yy[None, :]).astype(np.float32), 1.5)
    s.wash += g * (2.8 + 1.5 * (fbm((H, W), 200, 16, 5) - .5)) * (1 - .4 * smoothstep(1650, 1920, Y))
    edge = np.stack([xs, prof + 6], 1)
    s.stroke(edge, 30, 1.2, dry=.9, grain=1.1, taper=(.02, .95), rough=2)
    for i in range(7):
        a_, b_ = r.uniform(-20, 520), r.uniform(560, 1100)
        t_ = np.linspace(a_, b_, 24)
        p_ = 1505 + 12 * np.sin(t_ / 190) + 66 * (((t_ - 540) / 580) ** 2) + r.uniform(40, 330)
        s.stroke(np.stack([t_, p_], 1), r.uniform(24, 60), .5, dry=.95, grain=1.2, taper=(.3, .5), rough=2)
    fig(s, "a", .24, 2.6, .1)
    return s.render(.6)


def scene_b():
    s = Sheet(32)
    r = s.r
    Y, X = np.mgrid[:H, :W].astype(np.float32)
    # A breath of grey behind the figures, and hills so dilute they are almost not there.
    s.wash += (.13 * smoothstep(1500, 500, Y) + .1 * (fbm((H, W), 260, 7, 4) - .5)).clip(0, 1) * .8
    hill = ridge(8, 1120, 15, 9)
    yy = np.interp(np.arange(W), hill[:, 0], hill[:, 1])
    s.wash += blur(((Y > yy[None, :]) * (1 - smoothstep(yy[None, :], yy[None, :] + 240, Y))).astype(np.float32), 3) * .3
    # Trunk and limbs: wide brush, fast, running dry as it travels.
    tr = np.array([[1010, 1590], [1030, 1300], [984, 1050], [905, 830], [820, 640], [680, 500], [520, 440], [330, 400]], float)
    s.stroke(P.smooth(tr, 12), 130, 2.2, dry=.85, grain=1.2, taper=(.01, .62), rough=3.5)
    s.stroke(P.smooth(tr[:5] + [46, 0], 12), 70, 1.1, dry=.9, grain=1.3, taper=(.01, .7), rough=3)
    for b in ([[905, 830], [980, 640], [1060, 520], [1140, 470]], [[820, 640], [850, 450], [940, 300], [1120, 210]],
              [[680, 500], [660, 340], [560, 230], [430, 170]], [[520, 440], [400, 470], [290, 560], [230, 620]], [[905, 830], [760, 740], [640, 720]]):
        s.stroke(P.smooth(b, 12), r.uniform(26, 40), 1.4, dry=.75, grain=1.2, taper=(.01, .55), rough=2.5)
    Yc = [(980, 200, 170, 110), (760, 240, 190, 130), (520, 300, 170, 110), (850, 420, 170, 105), (1040, 470, 130, 100), (620, 470, 150, 90), (360, 360, 130, 90), (250, 560, 90, 70)]
    pale = np.zeros((H, W), np.float32)
    for cx, cy, rx, ry in Yc:
        cv2.ellipse(pale, (cx, cy), (rx, ry), r.uniform(-20, 20), 0, 360, 1, -1)
    pale = blur(pale, 26) * (.5 + 1.0 * fbm((H, W), 80, 25, 4))
    s.wash += np.clip(pale, 0, 1) * .55
    for cx, cy, rx, ry in Yc:
        for i in range(int(rx * .42)):
            a_, k = r.uniform(0, 6.28), r.random() ** .55
            x, y = cx + rx * k * np.cos(a_), cy + ry * k * np.sin(a_)
            shade = .5 + 1.3 * smoothstep(cy - ry, cy + ry, y)
            rr = r.uniform(13, 30)
            s.dab(x, y, rr * 1.1, rr * .46, r.choice([-35, -20, 15, 30, 55]) + r.uniform(-12, 12), r.uniform(.6, 2.0) * shade)
    # Fruit on the tree: a touch of cinnabar, the only colour besides the one in her hand.
    fr = np.zeros((H * SS, W * SS), np.float32)
    for x, y, q in ((566, 512, 15), (436, 474, 13), (318, 456, 12)):
        s.stroke(np.array([[x - 2, y - 52], [x, y - 30], [x + 1, y - 12]]), 4, 1.2, dry=.1, taper=(.1, .9), rough=.2)
        s.blob(x, y, q * .9, q, 2.2, fr)
    fx, fy = P.fruit_px()
    s.blob(fx, fy, 31, 33, 2.8, fr)
    s.red = blur(cv2.resize(fr, (W, H), interpolation=cv2.INTER_AREA), 1.2)
    s.red = np.clip(s.red, 0, 2.2) * (.8 + .5 * fbm((H, W), 14, 31, 3))
    # Ground: one wide, near-dry pull under their feet, leaving the rest to the paper.
    s.wash += smoothstep(1500, 1560, Y + 14 * np.sin(X / 170)) * (.5 + .5 * (fbm((H, W), 180, 27, 4) - .5)) * (1 - smoothstep(1660, 1920, Y) * .75)
    for i in range(6):
        y = 1522 + i * 30 + r.uniform(-6, 6)
        a_ = r.uniform(-30, 300)
        t_ = np.linspace(a_, a_ + r.uniform(520, 1000), 16)
        s.stroke(np.stack([t_, y + 10 * np.sin(t_ / 210)], 1), 46, .55, dry=.92, grain=1.15, taper=(.28, .5), rough=2)
    fig(s, "b", .17, 2.4, .25)
    return s.render(.55)


def trunk(s, x, w, load, dry, seed, top=-30, bot=1660, lean=0):
    q = np.random.default_rng(seed)
    y = np.linspace(top, bot, 9)
    p = np.stack([x + lean * (y - top) / (bot - top) + np.cumsum(q.normal(0, w * .1, 9)), y], 1)
    s.stroke(P.smooth(p, 10), w, load, dry=dry, grain=1.0, taper=(.005, .97), rough=w * .04)


def scene_c():
    s = Sheet(43)
    r = s.r
    lx, ly = P.LIGHT_C
    Y, X = np.mgrid[:H, :W].astype(np.float32)
    # Grey on grey on grey: the forest is built back to front with stronger and stronger ink.
    glow = np.exp(-(((X - lx) / 150) ** 2 + ((Y - ly) / 230) ** 2))
    pool = np.exp(-(((X - 700) / 300) ** 2 + ((Y - 1420) / 220) ** 2))
    s.wash = (2.3 + 1.3 * (fbm((H, W), 330, 5, 5) - .5)) * (1 - .9 * glow) * (1 - .8 * pool)
    dd = np.zeros_like(s.ink)
    for x, w, a in zip(np.linspace(30, 1060, 11) + r.uniform(-30, 30, 11), r.uniform(30, 64, 11), r.uniform(.15, .4, 11)):
        if abs(x - lx) < 90 or 600 < x < 860:
            continue
        trunk(s, x, w, a, .3, int(x), bot=1500, lean=r.uniform(-16, 16))
    s.gold = .95 * np.exp(-(((X - lx) / 34) ** 2 + ((Y - ly) / 110) ** 2)) + .2 * glow
    for x, w in ((60, 120), (930, 110), (1060, 90)):
        trunk(s, x, w, 1.4, .3, int(x) + 1, lean=-10)
    trunk(s, P.TRUNK_C - 20, 190, 2.4, .55, 9, lean=-6)
    for b in ([[470, 700], [320, 610], [210, 600]], [[520, 480], [660, 390], [830, 390], [950, 310]], [[520, 900], [640, 840], [760, 830]]):
        s.stroke(P.smooth(b, 10), 26, 1.5, dry=.6, grain=1.1, taper=(.01, .6), rough=2)
    for i in range(16):
        y = 1596 + i * 21 + r.uniform(-8, 8)
        a = r.uniform(-60, 420)
        t = np.linspace(a, a + r.uniform(400, 900), 14)
        s.stroke(np.stack([t, y + 8 * np.sin(t / 130)], 1), 54, .8, dry=.8, grain=1.1, taper=(.3, .5), rough=2.5)
    fig(s, "c", .18, 3.0, .15)
    return s.render(.55)


if __name__ == "__main__":
    import sys
    want = sys.argv[1:] or ["a", "b", "c"]
    for k in want:
        save("03_hand_drawn_ink", k, dict(a=scene_a, b=scene_b, c=scene_c)[k]())
        print(k, flush=True)
