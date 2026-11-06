"""08 Painterly. Thousands of individual loaded strokes laid along a designed flow, wet over wet, on a built-up surface.
The underpainting exists only to tell the brush which pigment to pick up. Nothing here runs over an existing style."""
import cv2
import numpy as np

from kit import H, P, W, npr, save, smoothstep

fbm, blur = npr.fbm, npr.blur
Y, X = np.mgrid[:H, :W].astype(np.float32)


def c(s):
    s = s.lstrip("#")
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255


def mix_ramp(t, stops):
    t = np.clip(t, 0, 1)
    xs = [q[0] for q in stops]
    cs = np.array([c(q[1]) for q in stops], np.float32)
    return np.dstack([np.interp(t, xs, cs[:, i]) for i in range(3)]).astype(np.float32)


def flow(seed, cell):
    n = cv2.GaussianBlur(fbm((H, W), cell, seed, 3), (0, 0), cell / 7)
    gy, gx = np.gradient(n)
    q = np.hypot(gx, gy) + 1e-7
    return -gy / q, gx / q


def swirl(vx, vy, cx, cy, rad, spin=1.0, inward=.25):
    dx, dy = X - cx, Y - cy
    d = np.hypot(dx, dy) + 1e-4
    w = np.exp(-(d / rad) ** 2)[..., None]
    tx, ty = -dy / d * spin - dx / d * inward, dx / d * spin - dy / d * inward
    return vx * (1 - w[..., 0]) + tx * w[..., 0], vy * (1 - w[..., 0]) + ty * w[..., 0]


class Canvas:
    def __init__(s, under, vx, vy, seed, base=None):
        s.u, s.vx, s.vy = under, vx, vy
        s.r = np.random.default_rng(seed)
        s.img = (np.full((H, W, 3), .4, np.float32) if base is None else base.astype(np.float32)).copy()
        s.h = np.zeros((H, W), np.float32)

    def trace(s, x, y, n, step, curve=1):
        pts = [(x, y)]
        for _ in range(n):
            ix, iy = int(np.clip(x, 0, W - 1)), int(np.clip(y, 0, H - 1))
            x += s.vx[iy, ix] * step * curve
            y += s.vy[iy, ix] * step * curve
            pts.append((x, y))
        return np.array(pts)

    def put(s, pts, col, w, op=.9, load=1.0, taper=True):
        """One flat-brush stroke: tapered at both ends, semi-opaque, streaked by its own bristles."""
        r = s.r
        pts = np.asarray(pts, float)
        pad = int(w) + 3
        x0, y0 = int(max(pts[:, 0].min() - pad, 0)), int(max(pts[:, 1].min() - pad, 0))
        x1, y1 = int(min(pts[:, 0].max() + pad, W)), int(min(pts[:, 1].max() + pad, H))
        if x1 <= x0 + 1 or y1 <= y0 + 1:
            return
        m = np.zeros((y1 - y0, x1 - x0), np.uint8)
        q = pts - [x0, y0]
        n = len(q)
        k = max(n // 4, 1)
        ww = max(int(w), 1)
        cv2.polylines(m, [np.round(q * 8).astype(np.int32)], False, 255, ww, cv2.LINE_AA, 3)
        if n > 3 and taper:
            e = np.zeros_like(m)
            cv2.polylines(e, [np.round(q[:k + 1] * 8).astype(np.int32), np.round(q[-k - 1:] * 8).astype(np.int32)], False, 255, ww, cv2.LINE_AA, 3)
            cv2.polylines(e, [np.round(q[:k + 1] * 8).astype(np.int32), np.round(q[-k - 1:] * 8).astype(np.int32)], False, 0, max(int(w * .5), 1), cv2.LINE_AA, 3)
            m = np.clip(m.astype(np.int16) - (e.astype(np.int16) * .6).astype(np.int16), 0, 255).astype(np.uint8)
        a = m.astype(np.float32) / 255
        # Bristle tracks: stripes across the stroke, following it.
        d = np.gradient(q, axis=0)
        nrm = np.stack([-d[:, 1], d[:, 0]], 1)
        nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        nn = nrm[n // 2]
        cc = pts[n // 2]
        across = ((xx - cc[0]) * nn[0] + (yy - cc[1]) * nn[1]) / max(w, 1)
        ph = r.uniform(0, 6.28, 3)
        br = .8 + .2 * np.sin(across * 9.5 + ph[0]) * np.sin(across * 4.1 + ph[1]) if taper else np.ones_like(across)
        a = a * np.clip(br * load, 0, 1) * op
        col = np.asarray(col, np.float32)
        tint = col[None, None, :] * (1 + (br[..., None] - .78) * .35)
        reg = s.img[y0:y1, x0:x1]
        s.img[y0:y1, x0:x1] = reg * (1 - a[..., None]) + tint * a[..., None]
        s.h[y0:y1, x0:x1] = s.h[y0:y1, x0:x1] * (1 - a * .55) + a * (.55 + .45 * br) * load

    def layer(s, n, w, length, jitter=.05, step=None, mask=None, op=.96):
        r = s.r
        step = step or w * .55
        for _ in range(n):
            x, y = r.uniform(-20, W + 20), r.uniform(-20, H + 20)
            ix, iy = int(np.clip(x, 0, W - 1)), int(np.clip(y, 0, H - 1))
            if mask is not None and mask[iy, ix] < r.random():
                continue
            col = s.u[iy, ix].copy()
            col = col * (1 + r.normal(0, jitter * 1.5)) + r.normal(0, jitter * .8, 3)
            pts = s.trace(x, y, int(r.integers(max(length // 2, 2), length + 1)), step)
            s.put(pts, col, w * r.uniform(.75, 1.25), op)

    def relief(s, strength=.2, light=(-.6, -.7)):
        h = cv2.GaussianBlur(s.h, (0, 0), .8)
        gy, gx = np.gradient(h)
        sh = (gx * light[0] + gy * light[1])
        im = s.img * (1 + np.clip(sh * strength * 14, -.2, .24))[..., None]
        spec = np.clip(sh * 11 - .25, 0, 1) ** 2
        im = im + spec[..., None] * .08
        weave = fbm((H, W), 2.2, 7, 2) - .5
        return np.clip(im * (1 + weave[..., None] * .03), 0, 1)


def fig_stroke(C, f_list, dark, light, wt, edge=(-1, 0), edge_w=.3):
    """Each limb is two quick passes of a loaded brush, with a broken touch of light on one side only."""
    r = C.r
    for f in f_list:
        u = f["u"]
        b = u * wt
        for k, a, e in (("leg_b", 1.0, .55), ("arm_b", .8, .5), ("spine", 1.25, 1.05), ("leg_a", 1.05, .6), ("arm_a", .85, .5)):
            pts = P.smooth(f["limbs"][k], 10)
            C.put(pts, np.array(dark) * r.uniform(.9, 1.15), b * (a + e) / 2, 1.0, 1.3, False)
            m = len(pts)
            s0 = int(r.integers(1, m // 3 + 1))
            C.put(pts[s0:s0 + m // 2] + np.array(edge) * b * .34, np.array(light) * r.uniform(.85, 1.1), max(b * edge_w, 1.6), .55)
        n = f["limbs"]["spine"][0]
        C.put(np.array([n, f["head"]]), np.array(dark), b * .8, 1.0, 1.3, False)
        for h in f["hair"]:
            pp = P.smooth(h, 10)
            C.put(pp, np.array(dark) * 1.1, f["head_r"] * .9, 1.0, 1.3, False)
            C.put(pp + [-3, 2], np.array(dark) * 1.7, f["head_r"] * .3, .6)
        th = np.linspace(0, 5.9, 14)
        C.put(np.stack([f["head"][0] + f["head_r"] * .5 * np.cos(th), f["head"][1] + f["head_r"] * .5 * np.sin(th)], 1), np.array(dark), f["head_r"] * 1.05, 1.0, 1.3, False)
        th = np.linspace(2.6, 4.0, 5)
        C.put(np.stack([f["head"][0] + f["head_r"] * .8 * np.cos(th), f["head"][1] + f["head_r"] * .8 * np.sin(th)], 1), np.array(light), max(f["head_r"] * .2, 1.6), .5)


def scene_a():
    r = np.random.default_rng(3)
    vx, vy = flow(4, 340)
    vx, vy = vx * .9 + .55, vy * .9 - .22
    cen = ((720, 560, 300), (330, 860, 240), (860, 1020, 170), (210, 330, 170))
    for cx, cy, q in cen:
        vx, vy = swirl(vx, vy, cx, cy, q, 1.0 if cx > 400 else -1.0, .1)
    star = []
    for i in range(10):
        star.append((r.uniform(30, 1050), r.uniform(50, 1150), r.uniform(9, 22)))
    star += [(816, 290, 44)]
    for x, y, q in star:
        vx, vy = swirl(vx, vy, x, y, q * 2.6, 1, 0)
    q = np.hypot(vx, vy) + 1e-6
    vx, vy = vx / q, vy / q
    # Ground follows the land.
    g = smoothstep(1470, 1530, Y)
    vx = vx * (1 - g) + g * 1
    vy = vy * (1 - g) + g * .05
    # Underpainting: ultramarine and cobalt, a river of pale turquoise, a warm band low down.
    band = 0
    for cx, cy, q_ in cen:
        band = band + np.exp(-(np.hypot(X - cx, Y - cy) / q_) ** 2)
    n = fbm((H, W), 170, 5, 4)
    t = np.clip(.14 + .55 * band + .5 * (n - .5) + .25 * smoothstep(900, 1420, Y), 0, 1)
    sky = mix_ramp(t, [(0, "#0b1648"), (.28, "#14308a"), (.5, "#2559b4"), (.68, "#3f8dc0"), (.83, "#8fd0c2"), (1, "#e9e6b0")])
    low = np.exp(-((Y - 1400) / 130) ** 2)[..., None]
    sky = sky * (1 - low * .8) + c("#d78a4a") * low * .8
    prof = 1505 + 40 * ((X[0] - 540) / 540) ** 2 + 10 * np.sin(X[0] / 130)
    ground = (Y > prof[None, :]).astype(np.float32)[..., None]
    gc = mix_ramp(fbm((H, W), 120, 8, 4) * 1.1 + (Y - 1500)[..., None][..., 0] / 900, [(0, "#2d1f4a"), (.45, "#1b1436"), (.75, "#2a1a2a"), (1, "#110c1c")])
    gc = gc + (np.exp(-np.clip(Y - prof[None, :], 0, None) / 26))[..., None] * c("#a8632e") * .7
    u = sky * (1 - ground) + gc * ground
    C = Canvas(u, vx, vy, 11, base=blur(u, 18))
    C.layer(1100, 34, 8, .05)
    C.layer(3000, 16, 11, .05)
    C.layer(4800, 8, 12, .05)
    # Stars: a coil of Naples yellow round a knot of lead white, laid on top.
    for x, y, q_ in star:
        th0 = r.uniform(0, 6.28)
        for i in range(3):
            th = th0 + i * 2.1 + np.linspace(0, 3.6, 14)
            rr = q_ * (1.9 - np.linspace(0, .9, 14)) * r.uniform(.9, 1.1)
            C.put(np.stack([x + rr * np.cos(th), y + rr * np.sin(th)], 1), c(("#c9d68a", "#f2dc78", "#9fd0c0")[i]) * r.uniform(.92, 1.05), max(q_ * .5, 4), .8)
        for k_ in range(4):
            a_ = r.uniform(0, 3.14)
            e_ = np.array([np.cos(a_), np.sin(a_)]) * q_ * .3
            C.put(np.array([[x, y] - e_, [x, y] + e_]), c("#fff6d8") * r.uniform(.95, 1.05), q_ * .55, .95, 1.2)
    for _ in range(140):
        x, y = r.uniform(0, W), r.uniform(0, 1240)
        C.put(np.array([[x, y], [x + 3, y + 1]]), c("#f6eab0") * r.uniform(.8, 1.05), r.uniform(3, 6), .9)
    fig_stroke(C, P.figures("a"), c("#120a10"), c("#e0a860"), .2, (1, 0), .3)
    return C.relief(.22)


def scene_b():
    r = np.random.default_rng(5)
    fx, fy = P.fruit_px()
    vx, vy = flow(6, 240)
    vx, vy = vx + .5, vy - .45
    for cx, cy, q_, sp in ((700, 330, 300, 1), (980, 420, 190, -1), (420, 470, 170, -1), (120, 980, 200, 1)):
        vx, vy = swirl(vx, vy, cx, cy, q_, sp, .05)
    g = smoothstep(1190, 1280, Y)
    vx = vx * (1 - g) + g * .95
    vy = vy * (1 - g) + g * .16
    trunk = P.taper([[1030, 1600], [1020, 1300], [975, 1040], [905, 800], [840, 640]], 150, 60, 14)
    tm = np.zeros((H, W), np.uint8)
    cv2.fillPoly(tm, [np.round(trunk).astype(np.int32)], 255)
    for b_ in ([[905, 800], [770, 660], [640, 610]], [[930, 850], [1040, 700], [1090, 590]], [[850, 650], [730, 500], [570, 450]]):
        cv2.fillPoly(tm, [np.round(P.taper(b_, 40, 12, 8)).astype(np.int32)], 255)
    tm = tm.astype(np.float32) / 255
    k = (cv2.GaussianBlur(tm, (0, 0), 6) > .25)
    vx = np.where(k, -.25, vx)
    vy = np.where(k, -1.0, vy)
    q = np.hypot(vx, vy) + 1e-6
    vx, vy = vx / q, vy / q
    # Sky: rose and peach on the left, turquoise on the right, an orange fire low behind the hills.
    d = np.hypot(X - 330, Y - 980)
    sky = mix_ramp(d / 1250 + .25 * (fbm((H, W), 240, 7, 4) - .5), [(0, "#fff0b0"), (.2, "#ffc56b"), (.42, "#f28a5a"), (.62, "#d8708a"), (.8, "#7f8fc0"), (1, "#3f7fa0")])
    hills = (Y > (1150 + 50 * np.sin(X[0] / 180 + 1))[None, :]).astype(np.float32)[..., None]
    hc = mix_ramp(fbm((H, W), 90, 8, 4), [(0, "#6f4a8a"), (.5, "#8a5f9a"), (1, "#c88aa0")])
    meadow = (Y > (1250 + 26 * np.sin(X[0] / 260))[None, :]).astype(np.float32)[..., None]
    mc = mix_ramp(fbm((H, W), 110, 9, 4) + (Y - 1250)[..., None][..., 0] / 1100, [(0, "#f0d060"), (.3, "#b8c850"), (.55, "#6aa04c"), (.75, "#2f7a5a"), (1, "#163e4a")])
    u = sky * (1 - hills) + hc * hills
    u = u * (1 - meadow) + mc * meadow
    # Canopy: deep viridian masses, cadmium lights on the sun side, ultramarine in the shade.
    can = np.zeros((H, W), np.float32)
    g2 = np.random.default_rng(3)
    for cx, cy, rx, ry in ((780, 300, 340, 250), (1020, 500, 170, 120), (470, 470, 190, 110), (70, 940, 180, 240)):
        cv2.ellipse(can, (cx, cy), (rx, ry), 0, 0, 360, 1, -1)
    can = smoothstep(.42, .58, blur(can, 34) + .5 * (fbm((H, W), 70, 11, 4) - .5))
    li = np.clip(.62 - (Y - 120) / 900 + .9 * (fbm((H, W), 80, 12, 4) - .5) - (X - 500) / 1500, 0, 1)
    cc = mix_ramp(li, [(0, "#0c2a4a"), (.3, "#0f5a50"), (.55, "#2f9450"), (.8, "#c8c84a"), (1, "#ffdc6a")])
    u = u * (1 - can[..., None]) + cc * can[..., None]
    trc = mix_ramp(np.clip((1050 - X) / 200 + .5 * (fbm((H, W), 60, 13, 4) - .5), 0, 1), [(0, "#1a1436"), (.5, "#3a2238"), (.85, "#a8582e"), (1, "#f2a24a")])
    u = u * (1 - tm[..., None]) + trc * tm[..., None]
    C = Canvas(u, vx, vy, 12, base=blur(u, 14))
    C.layer(1100, 34, 7, .045)
    C.layer(3000, 16, 9, .05)
    C.layer(4600, 8, 9, .055)
    # Grass strokes laid upward, and blossoms.
    for _ in range(900):
        x, y = r.uniform(0, W), r.uniform(1290, 1920)
        co = u[int(y), int(np.clip(x, 0, W - 1))] * r.uniform(.85, 1.2)
        C.put(np.array([[x, y], [x + r.uniform(-6, 6), y - r.uniform(10, 22) * .5], [x + r.uniform(-10, 10), y - r.uniform(14, 40)]]), co, r.uniform(3, 6), .7)
    for x, y, q_ in ((560, 640, 15), (440, 600, 13), (720, 690, 15)):
        C.put(np.array([[x, y - 58], [x, y - q_]]), c("#2a1a22"), 4)
        for rr, cc, ww in ((.6, "#a82a1a", q_ * 1.0), (.2, "#e0502a", q_ * .7)):
            th = np.linspace(0, 5.6, 12)
            C.put(np.stack([x + q_ * rr * np.cos(th), y + q_ * rr * np.sin(th)], 1), c(cc), ww)
    fs = P.figures("b")
    fig_stroke(C, fs, c("#1c1230"), c("#ffcf7a"), .17, (-1, 0), .3)
    for rr, cc, ww in ((.72, "#9a1f14", 18), (.34, "#d8381a", 18), (.08, "#f2662a", 12)):
        th = np.linspace(0, 5.8, 18)
        C.put(np.stack([fx + 31 * rr * np.cos(th), fy + 31 * rr * np.sin(th)], 1), c(cc), ww)
    C.put(np.array([[fx - 12, fy - 13], [fx - 5, fy - 17]]), c("#ffd8a0"), 6)
    return C.relief(.2)


def scene_c():
    r = np.random.default_rng(9)
    lx, ly = P.LIGHT_C
    vx, vy = flow(14, 260)
    vx, vy = vx * .32 + .04, vy * .32 - 1
    g = smoothstep(1540, 1610, Y)
    vx = vx * (1 - g) + g * .95
    vy = vy * (1 - g) + g * .12
    vx, vy = swirl(vx, vy, lx, ly, 210, .12, -1)
    q = np.hypot(vx, vy) + 1e-6
    vx, vy = vx / q, vy / q
    d = np.hypot((X - lx) * 1.1, (Y - ly) * .75)
    t = fbm((H, W), 200, 15, 4)
    u = mix_ramp(t * .7 + .1, [(0, "#060a20"), (.4, "#0e2340"), (.7, "#123a4a"), (1, "#1a4a48")])
    u = u + (np.exp(-(((X - 700) / 360) ** 2 + ((Y - 1330) / 360) ** 2)))[..., None] * c("#2a5a60") * .55
    warm = np.exp(-(d / 175) ** 2)[..., None]
    u = u * (1 - warm) + mix_ramp(d / 200, [(0, "#fff0b0"), (.25, "#ffc25a"), (.55, "#e8742e"), (1, "#7a2a3a")]) * warm
    # Trunks, each with a lit edge on the side toward the far light.
    tmask = np.zeros((H, W), np.float32)
    g2 = np.random.default_rng(4)
    edge = np.zeros((H, W, 3), np.float32)
    for x, w_, col, ed in [(x_, g2.uniform(40, 80), "#0a0e26", "#2a3a5a") for x_ in (240, 330, 830, 930)] + [(46, 150, "#070818", "#8a4a30"), (P.TRUNK_C - 24, 230, "#05060f", "#c8682e"), (1040, 170, "#060716", "#2a2a4a")]:
        if abs(x - lx) < 60:
            continue
        p = P.taper([[x + 5, 1640], [x, 900], [x - 10, -30]], w_ * 1.25, w_ * .76, 8)
        m = np.zeros((H, W), np.uint8)
        cv2.fillPoly(m, [np.round(p).astype(np.int32)], 255)
        mm = m.astype(np.float32) / 255
        u = u * (1 - mm[..., None]) + c(col) * (.7 + .8 * cv2.resize(fbm((H // 4, W), 12, int(x), 4), (W, H))[..., None]) * mm[..., None]
        eg = np.clip(mm - np.roll(mm, 12, 1), 0, 1)
        u = u + eg[..., None] * c(ed) * .9
    grd = (Y > (1585 + 16 * np.sin(X[0] / 170))[None, :]).astype(np.float32)[..., None]
    gc = mix_ramp(fbm((H, W), 90, 18, 4) + (Y - 1585)[..., 0 + 0] * 0 if False else fbm((H, W), 90, 18, 4), [(0, "#07081c"), (.5, "#142038"), (1, "#3a2a3a")])
    gc = gc + (np.exp(-((X - 300) / 360) ** 2) * np.exp(-np.clip(Y - 1585, 0, None) / 90))[..., None] * c("#c8642e") * .55
    u = u * (1 - grd) + gc * grd
    C = Canvas(u, vx, vy, 13, base=blur(u, 12))
    C.layer(900, 34, 7, .035)
    C.layer(2600, 15, 9, .04)
    C.layer(4400, 7, 9, .045)
    for _ in range(700):
        x, y = r.uniform(0, 620), r.uniform(900, 1500)
        if np.hypot((x - lx) * 1.1, (y - ly) * .75) < r.uniform(120, 300):
            C.put(np.array([[x, y], [x + r.uniform(-4, 4), y - r.uniform(10, 26)]]), u[int(y), int(x)] * r.uniform(1, 1.3), r.uniform(3, 6))
    fig_stroke(C, P.figures("c"), c("#0a0816"), c("#e8843a"), .17, (-1, -.2), .3)
    return C.relief(.2)


if __name__ == "__main__":
    import sys
    want = sys.argv[1:] or ["a", "b", "c"]
    for k in want:
        save("08_painterly", k, dict(a=scene_a, b=scene_b, c=scene_c)[k]())
        print(k, flush=True)
