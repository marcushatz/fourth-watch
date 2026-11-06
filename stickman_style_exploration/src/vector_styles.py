"""Styles built as true SVG. Premium vector and geometric editorial. Each has its own figure design."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import poses as P

W, H = P.W, P.H


def pts(a):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in np.asarray(a)[:, :2])


def svg(body, defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{defs}</defs>{body}</svg>'


def lin(i, stops, x1=0, y1=0, x2=0, y2=1):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a[0]}"' if a else "") + "/>" for o, c, *a in stops)
    return f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'


def rad(i, stops, cx=.5, cy=.5, r=.5):
    s = "".join(f'<stop offset="{o}" stop-color="{c}"' + (f' stop-opacity="{a[0]}"' if a else "") + "/>" for o, c, *a in stops)
    return f'<radialGradient id="{i}" cx="{cx}" cy="{cy}" r="{r}">{s}</radialGradient>'


def wave(y, amp, seed, base=H, n=7):
    r = np.random.default_rng(seed)
    xs = np.linspace(-60, W + 60, n)
    ys = y + r.uniform(-amp, amp, n)
    d = f"M{xs[0]:.0f},{ys[0]:.0f}"
    for i in range(n - 1):
        mx = (xs[i] + xs[i + 1]) / 2
        d += f" C{mx:.0f},{ys[i]:.0f} {mx:.0f},{ys[i + 1]:.0f} {xs[i + 1]:.0f},{ys[i + 1]:.0f}"
    return d + f" L{W + 60},{base} L-60,{base} Z"


def vector_figure(f, stroke, head, weight=.135, shade=None):
    """Tapered limbs, thicker at the body and fine at wrist and ankle. No outline and no stroke ends showing."""
    w = f["u"] * weight
    o = ""
    for k in ("leg_b", "arm_b", "spine", "leg_a", "arm_a"):
        col = shade if shade and k.endswith("_b") else stroke
        a, c = (w * 1.05, w * .52) if k.startswith("leg") else (w * .9, w * .46) if k.startswith("arm") else (w * 1.1, w * .9)
        o += f'<polygon points="{pts(P.taper(f["limbs"][k], a, c, 12))}" fill="{col}"/>'
    n = f["limbs"]["spine"][0]
    o += f'<polygon points="{pts(P.taper([n, f["head"]], w * .9, w * .62, 2))}" fill="{stroke}"/>'
    for h in f["hair"]:
        o += f'<polygon points="{pts(P.taper(h, f["head_r"] * 1.05, 2, 12))}" fill="{stroke}"/>'
    o += f'<circle cx="{f["head"][0]:.1f}" cy="{f["head"][1]:.1f}" r="{f["head_r"]:.1f}" fill="{head}"/>'
    return o


def vec_a():
    r = np.random.default_rng(3)
    d = lin("sky", [(0, "#050919"), (.45, "#0b1533"), (.8, "#1b2f5e"), (1, "#3a5688")]) + lin("h1", [(0, "#22365f"), (1, "#101b38")]) + lin("h2", [(0, "#16233f"), (1, "#0a1022")]) + lin("h3", [(0, "#0c1426"), (1, "#05080f")])
    d += rad("glow", [(0, "#8db0e6", .4), (1, "#8db0e6", 0)])
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>'
    cx, cy = 540, 520
    # Star trails: a long exposure of the turning sky, the whole frame wheeling over one person.
    for i in range(190):
        rr = 20 + (i ** 1.18) * 4.4 + r.uniform(-3, 3)
        c = 2 * np.pi * rr
        for _ in range(int(r.integers(2, 5))):
            arc = r.uniform(.06, .24) * c
            gap = c - arc
            off = r.uniform(0, c)
            col = "#e3b25c" if r.random() < .07 else "#dfe9ff"
            b += f'<circle cx="{cx}" cy="{cy}" r="{rr:.1f}" fill="none" stroke="{col}" stroke-opacity="{r.uniform(.14, .72):.2f}" stroke-width="{r.uniform(.8, 2.1):.2f}" stroke-linecap="round" stroke-dasharray="{arc:.1f} {gap:.1f}" stroke-dashoffset="{off:.1f}"/>'
    b += f'<circle cx="{cx}" cy="{cy}" r="4" fill="#fff4dc"/><circle cx="{cx}" cy="{cy}" r="60" fill="url(#glow)"/>'
    b += f'<path d="{wave(1260, 40, 5)}" fill="url(#h1)"/><path d="{wave(1370, 34, 8)}" fill="url(#h2)"/>'
    b += f'<path d="M-60,1540 C200,1530 380,1502 540,1503 C720,1504 880,1530 1140,1552 L1140,1920 L-60,1920 Z" fill="url(#h3)"/>'
    for f in P.figures("a"):
        b += vector_figure(f, "#f6ecd8", "#f6ecd8", .15)
    return svg(b, d)


def vec_b():
    r = np.random.default_rng(6)
    fx, fy = P.fruit_px()
    d = lin("sky", [(0, "#f6e8c6"), (.55, "#efd9a9"), (1, "#c9cf9d")]) + rad("sun", [(0, "#fff8e6"), (.55, "#fbeccb"), (1, "#f6e2b6", 0)])
    d += lin("g1", [(0, "#9db585"), (1, "#7d9c72")]) + lin("g2", [(0, "#6f9068"), (1, "#4e7359")]) + lin("g3", [(0, "#3f6250"), (1, "#274238")])
    d += rad("leaf1", [(0, "#4b7a58"), (1, "#274a3c")], .35, .3, .8) + rad("leaf2", [(0, "#6b9a6c"), (1, "#39624a")], .35, .3, .8) + rad("leaf3", [(0, "#8cb37f"), (1, "#54805a")], .35, .3, .8)
    d += rad("fr", [(0, "#e8825a"), (.55, "#c2502e"), (1, "#7f2a1b")], .36, .32, .75) + lin("tr", [(0, "#3a2c22"), (1, "#5a4331")], 0, 0, 1, 0)
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/><circle cx="{fx:.0f}" cy="{fy - 120:.0f}" r="520" fill="url(#sun)"/>'
    b += f'<path d="{wave(1180, 40, 2)}" fill="url(#g1)"/><path d="{wave(1330, 30, 4)}" fill="url(#g2)"/>'
    # The tree, a single arching form.
    b += '<path d="M1010,1560 C1000,1260 1010,1010 930,800 C900,720 840,650 760,590 L800,560 C880,620 920,660 960,720 C1000,650 1040,600 1110,560 L1120,600 C1060,650 1030,730 1030,800 C1070,1030 1090,1300 1100,1560 Z" fill="url(#tr)"/>'
    leaves = []
    for i in range(170):
        a, k = r.uniform(0, 6.283), r.random() ** .5
        x, y = 720 + 520 * k * np.cos(a), 380 + 300 * k * np.sin(a)
        rad_ = r.uniform(34, 86)
        leaves.append((y + r.uniform(-60, 60), x, y, rad_))
    for s, x, y, q in sorted(leaves):
        t = (s - 80) / 600
        g = "leaf1" if t < .42 else "leaf2" if t < .72 else "leaf3"
        b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{q:.0f}" fill="url(#{g})"/>'
    for x, y in ((470, 540), (610, 600), (860, 620)):
        b += f'<line x1="{x}" y1="{y - 46}" x2="{x}" y2="{y - 12}" stroke="#2d2118" stroke-width="3"/><circle cx="{x}" cy="{y}" r="15" fill="url(#fr)"/>'
    b += f'<path d="M-60,1530 C260,1490 700,1500 1140,1540 L1140,1920 L-60,1920 Z" fill="url(#g3)"/>'
    for f in P.figures("b"):
        x = f["limbs"]["leg_a"][-1]
        b += f'<ellipse cx="{f["head"][0] + 10:.0f}" cy="1524" rx="130" ry="11" fill="#14261f" opacity=".45"/>'
    for f in P.figures("b"):
        b += vector_figure(f, "#16233f", "#16233f", .135)
    b += f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="34" fill="url(#fr)"/><circle cx="{fx:.1f}" cy="{fy:.1f}" r="52" fill="none" stroke="#c2502e" stroke-width="1.6" opacity=".55"/>'
    b += f'<path d="M{fx + 2:.1f},{fy - 32:.1f} q10,-20 30,-20 q-6,18 -30,20" fill="#3f6250"/>'
    return svg(b, d)


def trunk(x, w, top=-20, bottom=1700, lean=0, fill="url(#t)"):
    return f'<path d="M{x - w * .36 + lean:.1f},{top} L{x + w * .36 + lean:.1f},{top} C{x + w * .4:.1f},{bottom * .6:.1f} {x + w * .46:.1f},{bottom * .85:.1f} {x + w * .9:.1f},{bottom} L{x - w * .9:.1f},{bottom} C{x - w * .46:.1f},{bottom * .85:.1f} {x - w * .4:.1f},{bottom * .6:.1f} {x - w * .36 + lean:.1f},{top} Z" fill="{fill}"/>'


def vec_c():
    r = np.random.default_rng(9)
    lx, ly = P.LIGHT_C
    d = lin("sky", [(0, "#061018"), (.55, "#0c2029"), (1, "#0b1a20")]) + rad("warm", [(0, "#ffe6ad"), (.12, "#e3b25c", .9), (.45, "#c2702e", .28), (1, "#c2702e", 0)])
    d += lin("t1", [(0, "#123039"), (1, "#0f2a31")], 0, 0, 1, 0) + lin("t2", [(0, "#0d232b"), (1, "#0a1b22")], 0, 0, 1, 0) + lin("t3", [(0, "#081519"), (1, "#050e12")], 0, 0, 1, 0)
    d += lin("big", [(0, "#a8732f"), (.03, "#3a2a1c"), (.12, "#0a1114"), (1, "#04080a")], 0, 0, 1, 0) + lin("flr", [(0, "#14272b"), (1, "#05090b")])
    d += rad("mist", [(0, "#2a5560", .55), (1, "#2a5560", 0)])
    b = f'<rect width="{W}" height="{H}" fill="url(#sky)"/><circle cx="{lx}" cy="{ly}" r="520" fill="url(#warm)"/>'
    for grad, n, wr, seed in (("t1", 15, (18, 34), 1), ("t2", 9, (40, 70), 2), ("t3", 5, (80, 130), 3)):
        q = np.random.default_rng(seed)
        for x in np.linspace(-20, W + 20, n) + q.uniform(-30, 30, n):
            if abs(x - lx) < 60:
                continue
            b += trunk(x, q.uniform(*wr), bottom=1500 + 40 * seed, fill=f"url(#{grad})")
    b += f'<ellipse cx="700" cy="1330" rx="380" ry="420" fill="url(#mist)"/>'
    b += f'<path d="M-60,1560 C300,1548 800,1574 1140,1590 L1140,1920 L-60,1920 Z" fill="url(#flr)"/>'
    b += f'<path d="M-60,1700 C300,1680 760,1710 1140,1740 L1140,1920 L-60,1920 Z" fill="#050c0e" opacity=".7"/>'
    b += trunk(P.TRUNK_C - 110, 200, bottom=1660, lean=-10, fill="url(#big)")
    g = ""
    for f in P.figures("c"):
        b += f'<ellipse cx="{f["head"][0] - 30:.0f}" cy="1592" rx="170" ry="9" fill="#000" opacity=".55"/>'
        b += vector_figure(f, "#b9c6c9", "#b9c6c9", .15)
    return svg(b + g, d)


def geo_figure(f, col, bar=.17):
    """Hard bars with square ends and a solid disc. A figure assembled from a ruler and a compass."""
    w = f["u"] * bar
    o = ""
    for k in ("leg_b", "arm_b", "leg_a", "arm_a"):
        l = f["limbs"][k]
        o += f'<polyline points="{pts(l)}" fill="none" stroke="{col}" stroke-width="{w:.1f}" stroke-linecap="butt" stroke-linejoin="miter"/>'
    s = f["limbs"]["spine"]
    n = s[0]
    o += f'<polygon points="{pts(P.taper(s, w * 1.9, w * .7, 3))}" fill="{col}"/>'
    o += f'<line x1="{n[0]:.1f}" y1="{n[1]:.1f}" x2="{f["head"][0]:.1f}" y2="{f["head"][1]:.1f}" stroke="{col}" stroke-width="{w * .7:.1f}"/>'
    for h in f["hair"]:
        o += f'<polygon points="{pts(P.taper(h, f["head_r"] * 1.05, 2, 2))}" fill="{col}"/>'
    o += f'<circle cx="{f["head"][0]:.1f}" cy="{f["head"][1]:.1f}" r="{f["head_r"]:.1f}" fill="{col}"/>'
    return o


GRAIN = '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .09 0"/></filter>'
GR = f'<rect width="{W}" height="{H}" filter="url(#grain)"/>'


def geo_a():
    """Immensity as a halftone: the sky is a field of circles that shrink toward the one person below it."""
    ink, bg, pale, gold = "#0d1226", "#1b2a6b", "#efe6d2", "#e3b25c"
    b = f'<rect width="{W}" height="{H}" fill="{bg}"/>'
    step = 72
    fx, fg = 540, 1500
    for j in range(23):
        for i in range(-1, 17):
            x, y = 36 + i * step + (step / 2 if j % 2 else 0), 30 + j * step * .87
            if y > 1330:
                continue
            d = np.hypot(x - fx, y - 1420)
            r = 30 * np.clip(d / 1400, .05, 1) ** 1.25
            b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="{pale}"/>'
    b += f'<rect y="{fg}" width="{W}" height="{H - fg}" fill="{ink}"/>'
    b += f'<line x1="{fx}" y1="140" x2="{fx}" y2="1300" stroke="{gold}" stroke-width="2"/><circle cx="{fx}" cy="110" r="34" fill="{gold}"/>'
    for f in P.figures("a"):
        b += geo_figure(f, pale, .2)
    return svg(b + GR, GRAIN)


def geo_b():
    """The fruit sits at the exact centre of a split world. Its consequence falls as one widening black wedge."""
    ink, a, c, red = "#14161c", "#e9dcc1", "#9fb096", "#c2502e"
    fx, fy = P.fruit_px()
    b = f'<rect width="{W}" height="{H}" fill="{a}"/><rect x="{fx:.0f}" width="{W - fx:.0f}" height="{H}" fill="{c}"/>'
    b += f'<path d="M{fx - 420:.0f},0 A420,420 0 0 0 {fx + 420:.0f},0 Z" fill="{ink}"/>'
    for i, x in enumerate(np.linspace(fx - 300, fx + 300, 7)):
        y = 34 + np.sqrt(max(420 ** 2 - (x - fx) ** 2, 0)) * .62
        b += f'<line x1="{x:.0f}" y1="0" x2="{x:.0f}" y2="{y:.0f}" stroke="{a}" stroke-width="2"/><circle cx="{x:.0f}" cy="{y:.0f}" r="13" fill="{red if i == 3 else a}"/>'
    b += f'<rect y="1516" width="{W}" height="{H - 1516}" fill="{ink}"/>'
    b += f'<polygon points="{fx:.1f},{fy:.1f} {fx + 3:.1f},{fy:.1f} {fx + 230:.1f},{H} {fx - 230:.1f},{H}" fill="{red}"/>'
    for f in P.figures("b"):
        b += geo_figure(f, ink, .16)
    e = P.figures("b")
    hand = e[1]["limbs"]["arm_a"][-1]
    b += f'<line x1="{hand[0]:.0f}" y1="{hand[1]:.0f}" x2="{fx + 40:.0f}" y2="{fy:.0f}" stroke="{ink}" stroke-width="2" stroke-dasharray="4 9"/>'
    b += f'<circle cx="{fx:.1f}" cy="{fy:.1f}" r="40" fill="{red}"/>'
    return svg(b + GR, GRAIN)


def geo_c():
    """A forest as a bar code. One gold slit, one long wedge of light that stops short of him."""
    ink, teal, pale, gold = "#07090f", "#17333a", "#d9d3c4", "#e3b25c"
    lx, ly = P.LIGHT_C
    r = np.random.default_rng(2)
    b = f'<rect width="{W}" height="{H}" fill="{teal}"/>'
    x = -10.0
    while x < W:
        w = float(r.choice([14, 22, 34, 58, 96]))
        if not (x < lx + 30 and x + w > lx - 30):
            b += f'<rect x="{x:.0f}" width="{w:.0f}" height="1590" fill="{ink}"/>'
        x += w + float(r.choice([12, 20, 30, 46]))
    b += f'<rect x="{lx - 9}" y="430" width="18" height="1160" fill="{gold}"/>'
    b += f'<rect y="1590" width="{W}" height="{H - 1590}" fill="{ink}"/>'
    b += f'<polygon points="{lx - 9},1590 {lx + 9},1590 460,{H} 40,{H}" fill="{gold}"/>'
    b += f'<rect x="{P.TRUNK_C - 86}" width="172" height="1590" fill="{ink}"/>'
    for f in P.figures("c"):
        b += geo_figure(f, pale, .19)
    return svg(b + GR, GRAIN)


ALL = {"02_premium_vector": dict(a=vec_a, b=vec_b, c=vec_c), "07_geometric_editorial": dict(a=geo_a, b=geo_b, c=geo_c)}

if __name__ == "__main__":
    out = Path(__file__).resolve().parents[1] / "frames"
    for name, sc in ALL.items():
        (out / name).mkdir(parents=True, exist_ok=True)
        for k, fn in sc.items():
            (out / name / f"{k}.svg").write_text(fn())
    print("svg written")
