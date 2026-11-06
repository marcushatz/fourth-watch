"""The three Genesis scenes, each built three ways. Run: python scenes.py [A|B|C] [awe|tension|fear] [--layers]"""
import sys
import time
from pathlib import Path

import cv2
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
import cast as K  # noqa: E402
from world import (H, W, X, Y, Stack, aligned_fbm, mass, blades, branch_tree, dabs, faces, fbm, fbm1, fill, finish, gb, grainy, hexc,  # noqa: E402
                   polys_mask, profile_mask, ramp, ridge_profile, rim_of, rays, scallops, smoothstep, stars, streak, taper, treat)

ROOT = Path(__file__).resolve().parents[1]
NAMES = dict(A="A_painterly_cinematic", B="B_editorial_elegant", C="C_atmospheric_storybook")
SCENES = dict(awe="1_awe", tension="2_tension", fear="3_fear")

PAL = {
    "A": dict(adam=dict(body="#9a6040", hair="#3a2418"), eve=dict(body="#9c5c63", hair="#3a1914")),
    "B": dict(adam=dict(body="#b0704a", hair="#3d2819"), eve=dict(body="#a86870", hair="#4a2219")),
    "C": dict(adam=dict(body="#b77a4e", hair="#4a3020"), eve=dict(body="#b8707a", hair="#5a2a20")),
}


def pal(v, who, **over):
    d = dict(PAL[v][who])
    d.update(fruit="#c2502e", stem="#3a2a1c", leaf="#4f6a2e")
    d.update(over)
    return {k: hexc(c) for k, c in d.items()}


def band_field(p0, p1, width):
    d = np.array(p1, float) - p0
    L = np.linalg.norm(d)
    d /= L
    along = ((X - p0[0]) * d[0] + (Y - p0[1]) * d[1]) / L
    across = (X - p0[0]) * -d[1] + (Y - p0[1]) * d[0]
    return along, across / width, np.degrees(np.arctan2(d[1], d[0]))


# ------------------------------------------------------------------ 1. Awe

def awe(v, keep=None):
    sd = dict(A=11, B=12, C=13)[v]
    t = np.clip(Y / 1340, 0, 1)
    if v == "A":
        sky = ramp(t, [(0, "#020409"), (.45, "#070f24"), (.82, "#14233f"), (1, "#283a55")])
    elif v == "B":
        sky = ramp(t, [(0, "#08182a"), (.6, "#10304a"), (1, "#2a5468")])
    else:
        sky = ramp(t, [(0, "#06061c"), (.38, "#121842"), (.72, "#2c3366"), (.9, "#6c5478"), (1, "#c28a70")])
    along, ac, ang = band_field((-160, 60), (1240, 1360), 1.0)
    band = np.exp(-(ac / 250) ** 2)
    core = np.exp(-(((X - 250) / 330) ** 2 + ((Y - 470) / 300) ** 2))
    cloud = fbm((H, W), 150, sd, 6)
    fil = aligned_fbm(140, sd + 1, ang, 3.2, 6)
    dust = smoothstep(.5, .66, fil) * np.exp(-((ac + 30) / 140) ** 2)
    sky_mask = smoothstep(1380, 1250, Y)
    if v == "A":
        neb = band * (.25 + 1.4 * cloud) * (1 - .85 * dust) * (.45 + .9 * core)
        sky = sky + neb[..., None] * (hexc("#5f7aa6") * (1 - core[..., None]) + hexc("#c8b08a") * core[..., None]) * .55
        sky, _ = treat(sky, np.ones((H, W), np.float32), "A", sd + 2, ang, 1.0, edge=False, L=120, Wd=14)
        L, _ = stars(sd + 3, 3400, 1300, big=.03)
        sky = sky + gb(L, .7)[..., None] * np.array([.85, .92, 1.1], np.float32) * (1.1 + 1.4 * band[..., None]) * sky_mask[..., None]
    elif v == "B":
        neb = band * (.4 + .6 * cloud) * (1 - .7 * dust)
        sky = sky + neb[..., None] * hexc("#2d6a7a") * .25
        # The galaxy as stipple: thousands of fine dots, densest where the band is brightest.
        r = np.random.default_rng(sd + 4)
        dots = np.zeros((H * 2, W * 2), np.float32)
        pts = np.stack([r.uniform(0, W, 60000), r.uniform(0, 1330, 60000)], 1)
        dens = (neb * (.6 + .8 * core))[pts[:, 1].astype(int), pts[:, 0].astype(int)]
        keep_ = r.random(len(pts)) < np.clip(dens * .55, 0, 1) ** 1.3
        for (x, y) in pts[keep_]:
            cv2.circle(dots, (int(x * 2), int(y * 2)), int(r.integers(1, 3)), float(r.uniform(.35, .9)), -1, cv2.LINE_AA)
        dots = cv2.resize(dots, (W, H), interpolation=cv2.INTER_AREA)
        sky = sky + dots[..., None] * hexc("#efe3c6") * .9
        L, _ = stars(sd + 3, 900, 1300, big=.0)
        sky = sky + L[..., None] * hexc("#f3ead4") * 1.2 * sky_mask[..., None]
        L2, _ = stars(sd + 8, 40, 1200, big=1.0, sizes=(.5, 1.5))
        sky = sky + (L2 + gb(L2, 4) * 1.5)[..., None] * hexc("#fbf3dc") * .8
    else:
        neb = band * (.2 + 1.5 * cloud) * (1 - .8 * dust) * (.5 + .9 * core)
        hue = fbm((H, W), 220, sd + 5, 3)
        col = ramp(hue, [(0, "#7a86b8"), (.45, "#a888a8"), (.7, "#dcc29a"), (1, "#8ab0b4")])
        sky = sky + neb[..., None] * col * .4
        sky, _ = treat(sky, np.ones((H, W), np.float32), "C", sd + 2, ang, .8, edge=False)
        L, _ = stars(sd + 3, 4200, 1300, big=.035)
        tint = ramp(fbm((H, W), 30, sd + 6, 2), [(0, "#a8c0ff"), (.5, "#ffffff"), (1, "#ffd8a8")])
        sky = sky + (gb(L, .8)[..., None] * 1.2 + gb(L, 3)[..., None] * 1.6) * tint * sky_mask[..., None]
    S = Stack(sky, keep)
    # Horizon light, then three ranges going back into haze.
    S.glow(hexc({"A": "#2f4a5e", "B": "#3f7a84", "C": "#c98a6e"}[v]), np.exp(-((Y - 1290) / 120) ** 2) * (.5 if v != "C" else .7))
    ranges = [(1248, 62, 330, "#3a4e66", "#24344c"), (1312, 48, 250, "#26364e", "#141f33"), (1392, 36, 190, "#152033", "#0a111e")]
    if v == "B":
        ranges = [(1250, 60, 330, "#2a5266", "#1f4458"), (1316, 46, 250, "#173a4f", "#12304a"), (1396, 34, 190, "#0e2639", "#0b1f30")]
    if v == "C":
        ranges = [(1246, 64, 330, "#7a6a88", "#5a5478"), (1312, 50, 250, "#4a4a74", "#383a62"), (1392, 36, 190, "#2a2c52", "#1e2142"), (1446, 26, 150, "#1a1c38", "#121530")]
    hz = {"A": "#20324a", "B": "#2a5266", "C": "#8a7088"}[v]
    for i, (base, amp, cell, lit, dark) in enumerate(ranges):
        prof = ridge_profile(base, amp, cell, sd + 20 + i, 1.1)
        a = profile_mask(prof)
        f = faces(sd + 30 + i, cell * .6, (-.55, -.65), steps=3 if v == "B" else None)
        rgb = hexc(dark) * (1 - f[..., None]) + hexc(lit) * f[..., None]
        rgb, a = treat(rgb, a, v, sd + 40 + i, 0, .8)
        S.add(rgb, a, f"range{i}")
        if v == "C":
            mist = np.exp(-((Y - prof[None, :] - 40) / 34) ** 2) * (.4 + .6 * fbm((H, W), 120, sd + 50 + i, 3))
            S.air(hexc(hz) * 1.2, mist * .5)
        S.air(hexc(hz), np.exp(-np.clip(Y - prof[None, :], 0, None) / 160) * (Y > prof[None, :] - 40) * (.22 if v != "B" else .0))
    # The ledge he stands on: flat at the top, then a cliff falling away on the right.
    x0 = X[0]
    edge = 712 + 26 * (fbm((H, W), 90, sd + 65, 4)[:, 0] - .5)
    prof = 1528 + 70 * smoothstep(430, -60, x0) ** 1.4 + 26 * smoothstep(640, 700, x0)
    prof = prof + 8 * (fbm1(50, sd + 60) - .5) * smoothstep(40, 120, np.abs(x0 - 560)) + 2.5 * (fbm1(12, sd + 61, 3) - .5)
    a = profile_mask(prof, 1.0)
    # The cliff face leans out and back as it falls, ragged at the edge.
    jag = 22 * (fbm((H, W), 26, sd + 67, 4)[:, :1] - .5) + 9 * (fbm((H, W), 7, sd + 68, 3)[:, :1] - .5)
    cliffx = edge[:, None] + jag + 70 * smoothstep(1600, 1640, Y) - 30 * smoothstep(1700, 1760, Y) + 50 * smoothstep(1800, 1900, Y)
    a = a * smoothstep(1.2, -1.2, X - cliffx)
    f = faces(sd + 62, 90, (-.4, -.8), steps=2 if v == "B" else None)
    lit = {"A": "#1a2333", "B": "#0f1f2e", "C": "#2a2c4e"}[v]
    dark = {"A": "#04060a", "B": "#060c14", "C": "#0c0e22"}[v]
    rock = hexc(dark) * (1 - f[..., None]) + hexc(lit) * f[..., None]
    cliff = smoothstep(-90, 0, X - cliffx) * smoothstep(1530, 1560, Y)
    rock = rock * (1 - .45 * cliff[..., None])
    cracks = smoothstep(.06, .0, np.abs(fbm((H, W), 60, sd + 66, 4) - .5)) * smoothstep(1560, 1640, Y)
    rock = rock * (1 - .35 * cracks[..., None])
    rim = gb(rim_of(a, 2, 4), .7) * smoothstep(.35, .7, fbm((H, W), 18, sd + 64, 3))
    rock = rock + rim[..., None] * hexc({"A": "#5f7598", "B": "#5f8c9a", "C": "#8f80b0"}[v]) * .5
    rock, a = treat(rock, a, v, sd + 63, 0, 1.0)
    S.add(rock, a, "ledge")
    # Adam.
    light = dict(dir=(-.42, -.86, .15), col=dict(A=(.5, .62, .95), B=(.55, .74, .82), C=(.66, .62, .9))[v], k=.32, amb=dict(A=(.025, .03, .06), B=(.03, .055, .08), C=(.05, .04, .08))[v],
                 rim=2.6, fill=dict(dir=(.7, .1, .7), col=dict(A=(.03, .025, .025), B=(.03, .03, .03), C=(.1, .05, .035))[v]))
    rgb, fa = K.draw([(K.ADAM_AWE, 560, 1529, 48, 1, pal(v, "adam"))], v, light, seed=sd)
    S.shade(np.exp(-(((X - 546) / 52) ** 2 + ((Y - 1530) / 5) ** 2)) * .7)
    S.add(rgb, fa, "adam", premult=True)
    FA = fa
    # Foreground grass at the lip of the ledge, close to the lens.
    if v != "B":
        g = blades(sd + 70, 420, (-20, 360), (2, 22), (14, 54), .35, (2, 3.4), prof)
        S.add(fill(hexc("#030407")), np.clip(g, 0, 1), "grass", blur=1.4 if v == "A" else .6)
        m = np.zeros((H, W), np.uint8)
        r = np.random.default_rng(sd + 72)
        for _ in range(16):
            x, y = r.choice([r.uniform(-60, 260), r.uniform(820, 1140)]), r.uniform(1800, 2000)
            cv2.ellipse(m, (int(x), int(y)), (int(r.uniform(80, 200)), int(r.uniform(40, 90))), r.uniform(-20, 20), 0, 360, 255, -1, cv2.LINE_AA)
        S.add(fill(hexc("#020305")), m.astype(np.float32) / 255, "foreground", blur=14)
    else:
        g = blades(sd + 70, 160, (-20, 330), (1, 10), (10, 32), .2, (1.6, 2.4), prof)
        S.add(fill(hexc("#060c14")), np.clip(g, 0, 1), "grass")
    return finish(S.img, v, sd, vign=dict(A=.5, B=.14, C=.32)[v], bloom=dict(A=.25, B=.05, C=.4)[v], grain_k=dict(A=.018, B=.014, C=0)[v], protect=gb(FA, 4))


# ------------------------------------------------------------------ 2. Tension

TRUNK = [(1012, 1592), (1002, 1380), (968, 1150), (906, 880), (850, 710)]
BOUGHS = [([(906, 880), (760, 750), (600, 680), (420, 662), (300, 674)], 46, 9),
          ([(872, 780), (770, 610), (620, 510), (450, 470), (330, 490)], 40, 8),
          ([(850, 710), (900, 530), (985, 390), (1060, 330)], 36, 8),
          ([(852, 720), (820, 510), (770, 330), (700, 210)], 34, 7)]
CANOPY = [(370, 590, 170, 100), (560, 550, 200, 120), (760, 470, 230, 150), (960, 380, 170, 140), (640, 310, 270, 170),
          (880, 200, 230, 170), (420, 420, 160, 100), (1040, 570, 110, 110), (520, 170, 220, 150), (300, 510, 120, 80)]
FRUITS = [(436, 692, 12), (598, 640, 13), (742, 680, 12)]


def tree_polys(v, sd):
    polys = [taper(TRUNK, 128, 50, 16)]
    for path, w0, w1 in BOUGHS:
        polys.append(taper(path, w0, w1, 12))
    twigs = []
    r = np.random.default_rng(sd)
    for path, w0, w1 in BOUGHS[:4]:
        for i in range(1, len(path)):
            x, y = path[i]
            if y > 690 or (640 < x < 900 and y > 550):
                continue
            for _ in range(2):
                a = np.deg2rad(r.uniform(-160, -20))
                L = r.uniform(50, 120)
                twigs.append(taper([(x, y), (x + np.cos(a) * L * .5, y + np.sin(a) * L * .5 + 6), (x + np.cos(a) * L, y + np.sin(a) * L)], w1 * .7, 1.2, 6))
    return polys, twigs


def tension(v, keep=None, shot=None):
    sd = dict(A=21, B=22, C=23)[v]
    sx, sy = 112, 1224
    d = np.hypot(X - sx, (Y - sy) * 1.15)
    if v == "A":
        sky = ramp(Y / 1260, [(0, "#1d1512"), (.4, "#4a2c1e"), (.75, "#9a5a2e"), (1, "#d48a42")])
        sky = sky + np.exp(-(d / 420) ** 2)[..., None] * hexc("#f0a24a") * 1.1 + np.exp(-(d / 90) ** 2)[..., None] * hexc("#ffe2a0") * 2
    elif v == "B":
        sky = ramp(Y / 1260, [(0, "#b9b0a0"), (.5, "#d9c6a6"), (1, "#efd6ae")])
        sky = sky + np.exp(-(d / 520) ** 2)[..., None] * hexc("#f6dcb0") * .6
        disc = smoothstep(62, 59, d)
        sky = sky * (1 - disc[..., None]) + hexc("#fff3da") * disc[..., None]
    else:
        sky = ramp(Y / 1260, [(0, "#4a5a82"), (.35, "#9a8aa0"), (.7, "#e8a870"), (1, "#ffd28e")])
        sky = sky + np.exp(-(d / 460) ** 2)[..., None] * hexc("#ffc070") * 1.0 + np.exp(-(d / 80) ** 2)[..., None] * hexc("#fff0c8") * 2.2
        sky, _ = treat(sky, np.ones((H, W), np.float32), "C", sd + 1, 0, .7, edge=False)
    S = Stack(sky, keep)
    hz = {"A": "#c07a44", "B": "#e9d3ad", "C": "#f0c488"}[v]
    hills = [(1236, 34, 300, "#8a5a3a", "#6a4430"), (1278, 24, 220, "#5a4128", "#46321f")]
    if v == "B":
        hills = [(1236, 32, 300, "#bdb495", "#b0a888"), (1280, 22, 220, "#a7a480", "#9a9876")]
    if v == "C":
        hills = [(1232, 36, 300, "#a08aa0", "#8a7a94"), (1270, 26, 240, "#7f8a8a", "#6c7a7c"), (1300, 18, 200, "#6a8070", "#5a7062")]
    for i, (base, amp, cell, lit, dark) in enumerate(hills):
        prof = ridge_profile(base, amp, cell, sd + 10 + i, .8)
        a = profile_mask(prof)
        f = faces(sd + 12 + i, cell, (-.7, -.4), steps=2 if v == "B" else None)
        rgb = hexc(dark) * (1 - f[..., None]) + hexc(lit) * f[..., None]
        rgb, a = treat(rgb, a, v, sd + 14 + i, 0, .7)
        S.add(rgb, a, f"hill{i}")
        S.air(hexc(hz), np.exp(-np.clip(Y - prof[None, :], 0, None) / 120) * (Y > prof[None, :] - 30) * (.25 if v != "B" else .0))
    # The far edge of the garden: a band of trees, softened by distance.
    r = np.random.default_rng(sd + 20)
    cl = [(x, 1250 + r.uniform(-14, 14), r.uniform(50, 90), r.uniform(34, 56)) for x in np.linspace(-40, 1120, 18)]
    if v == "B":
        rgb, a = mass(cl, sd + 21, ("#949b7c", "#a2a787", "#b6b694"), (-.8, -.4), 18, 34, 1.2, (12, 5))
    else:
        cols = {"A": ("#3a2a1c", "#5a4028", "#a8743e"), "C": ("#5a6a62", "#7a8a74", "#c8c08a")}[v]
        rgb, a = dabs(cl, sd + 21, (-.8, -.4), cols, cols[2], (5, 11), .8, soft=.8 if v == "A" else .4, dark_bias=.35)
        rgb, a = treat(rgb, a, v, sd + 22, 0, .6, edge=False)
    S.add(rgb, a, "far_trees")
    S.air(hexc(hz), (Y < 1320) * np.exp(-np.clip(1320 - Y, 0, None) / 200) * (.3 if v != "B" else .15) * smoothstep(1150, 1250, Y))
    # Meadow.
    gp = 1310 + 14 * np.sin(X[0] / 230) + 6 * (fbm1(120, sd + 30) - .5)
    a = profile_mask(gp)
    depth = np.clip((Y - 1300) / 620, 0, 1)
    if v == "A":
        mead = ramp(depth + .25 * (fbm((H, W), 140, sd + 31, 4) - .5), [(0, "#7a5a2a"), (.3, "#4a4220"), (.7, "#2a2a14"), (1, "#14140a")])
    elif v == "B":
        mead = ramp(depth, [(0, "#9a9a72"), (.25, "#7c835e"), (.6, "#646e4c"), (1, "#4c5638")])
        mead = mead * (1 - .06 * (np.floor(depth * 5) / 5)[..., None])
    else:
        mead = ramp(depth + .2 * (fbm((H, W), 140, sd + 31, 4) - .5), [(0, "#c8b870"), (.25, "#8aa058"), (.6, "#4f7a44"), (1, "#2a4a34")])
    sunlit = np.exp(-(((X - 250) / 560) ** 2)) * np.exp(-np.clip(Y - 1300, 0, None) / 260)
    mead = mead + sunlit[..., None] * hexc({"A": "#d08a3a", "B": "#efd6a8", "C": "#ffd08a"}[v]) * (.35 if v != "B" else .2)
    mead, a = treat(mead, a, v, sd + 32, 0, .9, edge=False)
    S.add(mead, a, "meadow")
    # Long shadows of the tree's canopy pooling on the right-hand ground.
    pool = smoothstep(560, 900, X) * smoothstep(1300, 1420, Y) * (.35 + .4 * fbm((H, W), 60, sd + 33, 4))
    if v != "B":
        S.shade(pool * .55)
    # Middle trees on the left behind Eve.
    cl = [(60, 980, 150, 210), (190, 1110, 110, 120), (-30, 800, 120, 180)]
    if v == "B":
        rgb, a = mass(cl, sd + 40, ("#56674e", "#6b7c5c", "#8a9a6e"), (-.9, -.3), 24, 46, 1.3, (30, 10), holes=6)
    else:
        cols = {"A": ("#16140c", "#2e2a16", "#b88a40"), "C": ("#2a4a36", "#4a7046", "#d8d880")}[v]
        rgb, a = dabs(cl, sd + 40, (-.95, -.2), cols, cols[2], (12, 24) if v == "A" else (7, 15), .6 if v == "A" else 1.0,
                      soft=.9 if v == "A" else 0, elong=.7 if v == "A" else .42, dark_bias=.05, tex=.08 * streak(sd + 42, 30, 20, 1.2) if v == "A" else None)
        rgb, a = treat(rgb, a, v, sd + 41, 0, .6, edge=False)
    S.add(rgb, a, "mid_trees")
    S.air(hexc(hz), a * .0)
    # The tree.
    polys, twigs = tree_polys(v, sd + 50)
    ta = polys_mask(polys)
    tw = polys_mask(twigs)
    bark = cv2.resize(fbm((H // 3, W), 14, sd + 51, 5), (W, H), interpolation=cv2.INTER_CUBIC)
    edge = gb(rim_of(ta, 6, 2), 1.5)
    if v == "B":
        tc = fill(hexc("#2a241e")) + rim_of(ta, 4, 0)[..., None] * hexc("#c8a070") * .9
        tc = tc * (1 - .25 * smoothstep(.5, .52, bark)[..., None])
    else:
        base = {"A": "#100b08", "C": "#2a1e16"}[v]
        tc = hexc(base) * (.7 + .7 * bark[..., None]) + edge[..., None] * hexc({"A": "#f0a050", "C": "#ffc888"}[v]) * (.9 if v == "A" else .7)
    alltree = np.clip(ta + tw, 0, 1)
    tc, alltree = treat(tc, alltree, v, sd + 52, 90, .6)
    S.add(tc, alltree, "trunk")
    if v == "B":
        rgb, ca = mass(CANOPY, sd + 53, ("#24382c", "#33503c", "#5d7a56"), (-.85, -.4), 28, 64, 1.0, (44, 14), holes=5)
    else:
        cols = {"A": ("#0a0f08", "#24301a", "#c89040"), "C": ("#15301f", "#2f5a34", "#d6dc7a")}[v]
        rim = {"A": "#ffc060", "C": "#f8f0a8"}[v]
        kw = dict(soft=.8 if v == "A" else 0, rim_k=.8 if v == "A" else .6, elong=.66 if v == "A" else .5, dark_bias=.02 if v == "A" else -.25,
                  tex=.1 * streak(sd + 55, 40, 22, 1.2) if v == "A" else None)
        cv_ = (shot or {}).get("canopy", {})
        kw.update({k_: x_ for k_, x_ in cv_.items() if k_ in kw})
        rgb, ca = dabs(CANOPY, sd + 53, (-.9, -.35), cols, cv_.get("rim", rim), cv_.get("size", (13, 28) if v == "A" else (8, 16)),
                       cv_.get("dens", .55 if v == "A" else 2.0), **kw)
        rgb, ca = treat(rgb, ca, v, sd + 54, 30, .5, edge=False)
    S.add(rgb, ca, "canopy")
    # Fruit on the tree.
    fm = np.zeros((H, W), np.float32)
    st_ = np.zeros((H, W), np.uint8)
    for x, y, q in FRUITS:
        cv2.line(st_, (x * 4, (y - 30) * 4), (x * 4, (y - q) * 4), 255, 5, cv2.LINE_AA, 2)
        fm = np.maximum(fm, smoothstep(q + .8, q - .8, np.hypot(X - x, Y - y)))
    S.add(fill(hexc("#1e140c")), st_.astype(np.float32) / 255, "stems")
    fc = hexc("#9a2e18") + (smoothstep(14, 0, np.hypot(X - np.array([f[0] for f in FRUITS]).mean(), Y)) * 0)[..., None]
    lit = np.zeros((H, W), np.float32)
    for x, y, q in FRUITS:
        lit = np.maximum(lit, smoothstep(q, 0, np.hypot(X - x + q * .45, Y - y + q * .35)))
    S.add(hexc("#8e2a16") + lit[..., None] * hexc("#e06a3a"), fm, "fruit_tree")
    # Light through the gaps, behind the two of them.
    if v != "B":
        src = np.exp(-(d / 260) ** 2) * (1 - ca) * (1 - ta)
        rr = gb(rays(src, (sx, sy), 30, .975, .02), 3)
        S.glow(hexc({"A": "#ffb060", "C": "#ffe0a0"}[v]), rr * (.55 if v == "A" else .6))
    # Cast shadows of the two figures, long and to the right.
    # A production shot can replace the cast, its drawing style, the light and the edge of the shade (`shot`).
    shot = shot or {}
    gy = shot.get("ground", 1580)
    figs = shot.get("figs") or [(K.EVE_TENSION, 292, 1580, 101, .94, pal(v, "eve")), (K.ADAM_TENSION, 752, 1580, 101, 1, pal(v, "adam"))]
    occ = np.ones((H, W), np.float32)
    dap = smoothstep(.42, .58, fbm((H, W), 34, sd + 60, 3))
    s0, s1 = shot.get("shade", (644, 676))
    occ = occ * (1 - smoothstep(s0, s1, X) * (1 - .45 * dap) * .85)
    if v == "B" and not shot:
        occ = 1 - smoothstep(652, 660, X) * .8
    light = shot.get("light") or dict(
        dir=(-.92, -.3, dict(A=-.32, B=.1, C=-.2)[v]), col=dict(A=(1.0, .7, .4), B=(1.0, .86, .66), C=(1.0, .8, .52))[v], k=dict(A=1.0, B=.9, C=1.0)[v],
        amb=dict(A=(.08, .06, .05), B=(.2, .18, .16), C=(.14, .12, .12))[v], rim=dict(A=2.4, B=1.4, C=2.0)[v],
        fill=dict(dir=(.1, -.25, 1), col=dict(A=(.13, .09, .065), B=(.06, .06, .07), C=(.17, .13, .11))[v]))
    rgb, fa = K.draw(figs, shot.get("cast", v), light, occ=occ, seed=sd)
    M = np.float32([[1, -1.55, 1.55 * gy], [0, -.14, 1.14 * gy]])
    sh = cv2.warpAffine(fa, M, (W, H))
    sh = gb(sh, 6 if v != "B" else 3)
    feet = shot.get("contacts", [(324, 100), (754, 110)])
    contact = sum(np.exp(-(((X - x) / w) ** 2 + ((Y - gy - 1) / 6) ** 2)) for x, w in feet)
    S.shade(np.clip(sh * (.55 if v != "B" else .4) * (Y > gy - 20) + contact * .55, 0, .8))
    S.add(rgb, fa, "figures", premult=True)
    # Foreground.
    if v == "B":
        g = blades(sd + 70, 220, (-20, 1100), (1890, 1925), (16, 46), .2, (2, 3))
        S.add(fill(hexc("#3c4630")), g, "grass")
    else:
        g = blades(sd + 70, 900, (-20, 1100), (1840, 1930), (30, 110), .35, (3, 5.5))
        S.add(fill(hexc({"A": "#0c0b06", "C": "#1c3222"}[v])), g, "grass", blur=3.5)
        lv = dabs([(80, 80, 160, 110), (-20, 260, 90, 120)], sd + 71, (-.9, -.3), {"A": ("#050604", "#141a0c", "#7a5a28"), "C": ("#0d2014", "#204a2a", "#a8b860")}[v],
                  "#d0b070", (14, 28), .9, soft=7, rim_k=.4)
        S.add(*lv, "leaves_fg")
    if v == "C":
        r = np.random.default_rng(sd + 80)
        fl = np.zeros((H, W), np.float32)
        fcol = np.zeros((H, W, 3), np.float32)
        for _ in range(150):
            x, y = r.uniform(0, W), 1330 + r.random() ** .7 * 580
            q = 1 + (y - 1300) / 220 * r.uniform(.6, 1.2)
            c = [hexc("#fff4d8"), hexc("#f2b8b0"), hexc("#ffe08a")][int(r.integers(3))]
            cv2.circle(fl, (int(x * 4), int(y * 4)), int(q * 4), 1.0, -1, cv2.LINE_AA, 2)
            cv2.circle(fcol, (int(x), int(y)), int(q) + 1, tuple(float(t_) for t_ in c), -1)
        S.add(fcol * (.45 + .3 * sunlit[..., None]), fl * .7, "flowers")
        mo = np.zeros((H, W), np.float32)
        for _ in range(130):
            x, y = r.uniform(0, 700), r.uniform(800, 1500)
            cv2.circle(mo, (int(x), int(y)), int(r.integers(1, 3)), float(r.uniform(.3, 1)), -1, cv2.LINE_AA)
        S.glow(hexc("#fff0c0"), gb(mo, .8) * np.exp(-(d / 700) ** 2) * 1.4)
    return finish(S.img, v, sd, vign=dict(A=.55, B=.12, C=.3)[v], bloom=dict(A=.3, B=.05, C=.4)[v], grain_k=shot.get("grain", dict(A=.018, B=.014, C=0)[v]),
                  warm=hexc("#f0d8b0") ** (1 / 2.2) if v == "C" else None, bth=.7, protect=gb(fa, 6))


# ------------------------------------------------------------------ 3. Fear

LX, LY = 176, 1118


def trunk_poly(x, w0, w1, bottom, seed, top=-40, lean=0.0, flare=1.0):
    r = np.random.default_rng(seed)
    ys = np.linspace(top, bottom, 12)
    xs = x + lean * (ys - top) / (bottom - top) + np.cumsum(r.normal(0, w0 * .03, 12))
    w = np.linspace(w1, w0, 12)
    w[-2:] *= np.array([1 + .2 * flare, 1 + .55 * flare])
    pts = np.stack([xs, ys], 1)
    d = np.gradient(pts, axis=0)
    q = np.stack([-d[:, 1], d[:, 0]], 1) / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-6)
    return np.vstack([pts + q * w[:, None] / 2, (pts - q * w[:, None] / 2)[::-1]])


def forest_layer(v, sd, n, wr, bottom, tone, avoid=(), xr=(-40, 1120)):
    r = np.random.default_rng(sd)
    polys, cx = [], []
    for x in np.linspace(*xr, n) + r.uniform(-30, 30, n):
        if any(abs(x - c) < q for c, q in avoid):
            continue
        w = r.uniform(*wr)
        polys.append(trunk_poly(x, w * 1.15, w * .8, bottom + r.uniform(-10, 10), int(r.integers(1 << 30)), lean=r.uniform(-10, 10), flare=.6))
        cx.append(x)
    a = polys_mask(polys)
    bark = streak(sd + 1, 90, 60, 2.2)
    rgb = fill(hexc(tone)) * (1 + .12 * bark[..., None] * (v != "B"))
    side = np.sign(LX - X)
    lit = np.clip(rim_of(a, 5, 0) * (side < 0) + rim_of(a, -5, 0) * (side > 0), 0, 1)
    fall = (np.exp(-np.abs(X - LX) / 380) * np.exp(-((Y - LY) / 640) ** 2)) ** 1.8
    return rgb, a, gb(lit, 1.2) * fall * (.5 if v == "B" else 1)


def fear(v, keep=None):
    sd = dict(A=31, B=32, C=33)[v]
    d = np.hypot((X - LX) * 1.1, (Y - LY) * .8)
    warm = np.exp(-(d / 230) ** 2)
    core = np.exp(-(d / 46) ** 2)
    mist = np.exp(-(((X - 700) / 330) ** 2 + ((Y - 1330) / 330) ** 2))
    if v == "A":
        sky = ramp(Y / H, [(0, "#03070a"), (.5, "#081419"), (.8, "#0c1d21"), (1, "#050a0b")])
        sky = sky + mist[..., None] * hexc("#1d3c44") * .8 + warm[..., None] * hexc("#d48a3e") * .95 + core[..., None] * hexc("#ffe6b0") * 1.3
        sky, _ = treat(sky, np.ones((H, W), np.float32), "A", sd, 90, .8, edge=False, L=90, Wd=10)
    elif v == "B":
        sky = ramp(Y / H, [(0, "#0b2228"), (.6, "#123236"), (1, "#0c2226")])
        sky = sky + mist[..., None] * hexc("#2a5458") * .45 + warm[..., None] * hexc("#c98c4a") * .55
        sky = sky + np.exp(-(d / 130) ** 2)[..., None] * hexc("#e0a050") * .9
        disc = smoothstep(17, 15, np.hypot(X - LX, (Y - LY) * .55))
        sky = sky * (1 - disc[..., None]) + hexc("#ffd690") * disc[..., None]
    else:
        sky = ramp(Y / H, [(0, "#0a1028"), (.45, "#13263c"), (.8, "#1c3c48"), (1, "#0e1e26")])
        sky = sky + mist[..., None] * hexc("#3c6a74") * .7 + warm[..., None] * hexc("#ffae5a") * 1.0 + core[..., None] * hexc("#fff0c8") * 1.4
        sky, _ = treat(sky, np.ones((H, W), np.float32), "C", sd, 90, .7, edge=False)
    S = Stack(sky, keep)
    layers = [(28, (12, 22), 1470, {"A": "#12262b", "B": "#1a3c41", "C": "#24404e"}, .42),
              (17, (24, 40), 1530, {"A": "#0a181b", "B": "#132f33", "C": "#16303a"}, .34),
              (10, (44, 74), 1580, {"A": "#060e10", "B": "#0c2326", "C": "#0e2028"}, .22)]
    hz = {"A": "#16323a", "B": "#1f4448", "C": "#2c5460"}[v]
    for i, (n, wr, bot, tone, air) in enumerate(layers):
        rgb, a, lit = forest_layer(v, sd + 10 + i, n, wr, bot, tone[v], avoid=((LX, 40 + wr[1]), (700, 120 + 40 * i)))
        rgb = rgb + lit[..., None] * hexc({"A": "#e09a4a", "B": "#d9a060", "C": "#ffb86a"}[v]) * (1.2 - .3 * i)
        rgb, a = treat(rgb, a, v, sd + 20 + i, 90, .8, edge=v != "B", L=70, Wd=2)
        S.add(rgb, a, f"trees{i}")
        S.air(hexc(hz), (air * (.5 + .6 * fbm((H, W), 300, sd + 30 + i, 3)) * smoothstep(300, 1500, Y)) * (1 if v != "B" else .7))
        S.glow(hexc({"A": "#c08040", "B": "#b88850", "C": "#ffa858"}[v]), warm * .08 * (3 - i) * (v != "B"))
    # Light through the trunks.
    if v != "B":
        rr = gb(rays(warm * (1 - S.img.mean(2) * 0) * smoothstep(.02, .3, warm), (LX, LY), 30, .972, .024), 3)
        S.glow(hexc({"A": "#ffb468", "C": "#ffd090"}[v]), rr * (.35 if v == "A" else .45))
    # Ground: dark, with a streak of the distant light running along it from the left.
    gp = 1585 + 12 * np.sin(X[0] / 210) + 5 * (fbm1(80, sd + 40) - .5)
    a = profile_mask(gp)
    depth = np.clip((Y - 1585) / 335, 0, 1)
    g = ramp(depth, {"A": [(0, "#0c1714"), (1, "#030605")], "B": [(0, "#0f2626"), (1, "#081718")], "C": [(0, "#1a2c2e"), (1, "#0a1416")]}[v])
    streak_ = np.exp(-((Y - gp[None, :] - 10) / 26) ** 2) * np.exp(-np.clip(X - LX, 0, None) / 300) * (X > LX - 260)
    if v == "B":
        streak_ = smoothstep(.3, .34, streak_)
    g = g + streak_[..., None] * hexc({"A": "#a8743a", "B": "#a07a48", "C": "#d0904a"}[v]) * .6
    if v != "B":
        litter = smoothstep(.55, .7, fbm((H, W), 9, sd + 41, 3)) * (Y > gp[None, :])
        g = g * (1 - .25 * litter[..., None]) + litter[..., None] * hexc({"A": "#1c2016", "C": "#3a3424"}[v]) * .3
    g, a = treat(g, a, v, sd + 42, 0, .8, edge=False)
    S.add(g, a, "ground")
    # The near trees, and the one he hides behind, with its roots.
    near = [trunk_poly(40, 200, 150, 1660, sd + 50, flare=1.2), trunk_poly(1010, 170, 120, 1650, sd + 51, lean=12, flare=1.0)]
    hide = [trunk_poly(432, 236, 168, 1650, sd + 52, lean=-8, flare=1.4)]
    roots = [taper([(330, 1600), (260, 1630), (190, 1650)], 46, 6, 6), taper([(540, 1606), (610, 1628), (690, 1638)], 40, 5, 6),
             taper([(400, 1630), (370, 1665), (330, 1690)], 34, 4, 6)]
    for i, polys in enumerate((near, hide + roots)):
        a = polys_mask(polys)
        bark = streak(sd + 60 + i, 90, 70, 2.4)
        tone = {"A": "#030607", "B": "#061416", "C": "#0a161a"}[v]
        rgb = fill(hexc(tone)) * (1 + (.25 if v != "B" else .0) * bark[..., None])
        side = np.sign(LX - X)
        lit = np.clip(rim_of(a, 7, 0) * (side < 0) + rim_of(a, -7, 0) * (side > 0), 0, 1)
        fall = np.exp(-np.abs(X - LX) / 420) * np.exp(-((Y - LY) / 700) ** 2)
        rgb = rgb + gb(lit, 1.5)[..., None] * (fall ** 1.6)[..., None] * hexc({"A": "#e8a050", "B": "#d8a060", "C": "#ffbc70"}[v]) * 1.1
        if v == "C":
            moss = smoothstep(.5, .7, fbm((H, W), 10, sd + 65, 4)) * smoothstep(1380, 1640, Y) * a * smoothstep(.3, .6, fbm((H, W), 60, sd + 67, 3))
            rgb = rgb * (1 - moss[..., None] * .35) + moss[..., None] * hexc("#22381e") * .35
        rgb, a = treat(rgb, a, v, sd + 66 + i, 90, .8, L=80, Wd=2)
        S.add(rgb, a, "near_trees" if i == 0 else "hiding_tree")
    # Adam, in the shadow of the trunk. Only cool dusk light from behind finds his outline.
    light = dict(dir=(.55, -.8, -.3), col=dict(A=(.42, .58, .66), B=(.46, .64, .66), C=(.5, .66, .8))[v], k=.2, amb=dict(A=(.03, .04, .045), B=(.05, .065, .07), C=(.055, .06, .08))[v],
                 rim=3.2, fill=dict(dir=(-.9, -.1, .4), col=dict(A=(.05, .025, .01), B=(.05, .03, .02), C=(.07, .035, .015))[v]))
    rgb, fa = K.draw([(K.ADAM_FEAR, 560, 1600, 112, 1, pal(v, "adam", leaf={"A": "#4a5a26", "B": "#55683a", "C": "#5a7a32"}[v]))], v, light, seed=sd)
    S.shade(np.exp(-(((X - 700) / 170) ** 2 + ((Y - 1600) / 9) ** 2)) * .7)
    S.add(rgb, fa, "adam", premult=True)
    FA = fa
    # Foreground ferns, close to the lens.
    r = np.random.default_rng(sd + 80)
    ferns = []
    for cx, cy, n in ((70, 1960, 7), (990, 1980, 6), (300, 2010, 4)):
        for k in range(n):
            a0 = np.deg2rad(r.uniform(-165, -15))
            L = r.uniform(180, 360)
            pts = np.array([[cx, cy], [cx + np.cos(a0) * L * .55, cy + np.sin(a0) * L * .55 - 20], [cx + np.cos(a0) * L, cy + np.sin(a0) * L + 30]])
            ferns.append(taper(pts, 10, 1, 8))
            for j in range(1, 14):
                t = j / 14
                p = pts[0] * (1 - t) ** 2 + 2 * pts[1] * t * (1 - t) + pts[2] * t * t
                tan = 2 * (1 - t) * (pts[1] - pts[0]) + 2 * t * (pts[2] - pts[1])
                tan /= np.linalg.norm(tan)
                nrm = np.array([-tan[1], tan[0]])
                ll = 56 * (1 - t) + 10
                for sgn in (-1, 1):
                    tip = p + nrm * sgn * ll + tan * ll * .4
                    ferns.append(taper([p, (p + tip) / 2 + tan * 4, tip], 9 * (1 - t) + 2, 1, 3))
    fm = polys_mask(ferns)
    fcol = {"A": "#020403", "B": "#05100f", "C": "#0a1810"}[v]
    S.add(fill(hexc(fcol)), fm, "ferns", blur=dict(A=7, B=0, C=5)[v])
    if v == "C":
        mo = np.zeros((H, W), np.float32)
        for _ in range(90):
            x, y = LX + r.normal(0, 150), LY + r.normal(0, 260)
            cv2.circle(mo, (int(x), int(y)), int(r.integers(1, 3)), float(r.uniform(.3, 1)), -1, cv2.LINE_AA)
        S.glow(hexc("#ffe0a8"), gb(mo, .8) * 1.2)
    return finish(S.img, v, sd, vign=dict(A=.55, B=.15, C=.35)[v], bloom=dict(A=.35, B=.08, C=.45)[v], grain_k=dict(A=.02, B=.014, C=0)[v], protect=gb(FA, 6))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    vs = args[0] if args else "ABC"
    scs = args[1].split(",") if len(args) > 1 else ["awe", "tension", "fear"]
    for v in vs:
        for sc in scs:
            t0 = time.time()
            keep = str(ROOT / "frames" / NAMES[v] / "layers" / SCENES[sc]) if "--layers" in sys.argv else None
            img = globals()[sc](v, keep)
            d = ROOT / "frames" / NAMES[v]
            d.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(d / f"{SCENES[sc]}.jpg"), (np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 94])
            print(v, sc, round(time.time() - t0, 1), flush=True)
