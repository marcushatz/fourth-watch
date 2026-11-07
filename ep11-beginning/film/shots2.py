"""Shots 13-24: the fall, the hiding, the consequences, the clothes, and the gift."""
import numpy as np

import paper as P
import rig as R
import scenes as C
from core import Shot, Words, drain, move_cam
from paper import DH, DW, GOLD, arc, circle, ellipse, fill, hexc, mass, ribbon, soft, spline, stroke
from rig import Figure, ease, ease_io, pose
from shots1 import ADAM, EVE, E, eden_stage, lin

ADAM_F = Figure("adam", garment="fig", seed=1)
EVE_F = Figure("eve", garment="fig", seed=2)
ADAM_S = Figure("adam", garment="skins", seed=1)
EVE_S = Figure("eve", garment="skins", seed=2)
COLD_SKIN = .82


def s13():
    W = Words("S13")
    st = eden_stage(3)
    C.eden_far(st)
    st.add(fill(spline([(610, 1000), (620, 620), (596, 300), (660, 300), (690, 640), (700, 1000)])), "#6d5a48", 8, "fiber", band="mid")
    st.add(mass(32, 620, 190, 330, 220), "#86997a", 9, "matte", tear=5, band="mid")
    st.add(mass(33, 40, 170, 290, 240), "#7a8e6c", 10, "matte", tear=5, band="mid")
    C.meadow(st, 900, "#8d976c")
    st.haze("#e6dcc0", .26, 520, 1010, 2)
    C.beam(st, 220, 340, -60, 330, 560, 1100, .14)
    st.slot("pair", "subject")
    st.slot("fruit", "subject")
    st.add(mass(34, 110, 1070, 330, 200), "#54694f", 14, "matte", tear=5, band="near")
    st.add(mass(35, 630, 1080, 330, 210), "#4b614a", 16, "matte", tear=5, band="near")
    C.hedge(st, -60, 780, 905, color="#55704c", seed=13, band="near", lift=12, flowers="#efe2c6")
    C.ferns(st, 36, [(-40, 1140, 760, 1340)], 12, (60, 118), "#33473a", band="front", lift=22, blur=4)

    def frame(t):
        g, a, e = W("gives"), W("Adam"), W("eats")
        off = E(t, g - .35, g + .35)
        give = E(t, a - .2, a + .25)
        eat = E(t, e - .45, e + .05)
        pe = R.breathe(R.mix(pose("stand", sh_f=30, el_f=80, head=4), pose("offer"), off * (1 - .35 * give)), t, .6)
        pa = R.mix(pose("stand", head=6), pose("take"), E(t, g, a + .1))
        pa = R.breathe(R.mix(pa, pose("eat", head=6), eat), t, .6, phase=1)
        _, ie = R.build(EVE, 108, 1022, 140, pe)
        _, ia = R.build(ADAM, 618, 1012, 148, pa, flip=True)
        hx, hy = ie["hand"] if give < .5 else ia["hand"]
        if eat > .1:
            hx, hy = ia["hand"]
        bite = 1.0
        return dict(cam=(360, 660, 1.03 + .025 * lin(t, 0, W.dur)),
                    slots={"pair": [("fig", EVE, 108, 1022, 140, pe, dict()), ("fig", ADAM, 618, 1012, 148, pa, dict(flip=True))],
                           "fruit": [("draw", (hx - 60, hy - 80, hx + 60, hy + 50), lambda pt: C.fruit(pt, hx, hy - 18, 25, bite=bite * .6, lift=5))]})
    return Shot("S13", st, frame, post=.5)


def s14():
    W = Words("S14")
    st = P.Stage((-120, 300), "#cfcdae", "#b4bb97", .8, .3, 900, "#fff0cf", 24)
    st.add(mass(241, 360, 220, 480, 290), "#9aa88a", 6, "matte", tear=5, band="far")
    st.add(mass(242, 600, 1000, 300, 260), "#8f9e80", 6, "matte", tear=5, band="far")
    st.slot("leaves", "subject")
    st.slot("hands", "subject")

    def frame(t):
        r, s_, tg = W("realize"), W("sew"), W("together")
        dr = E(t, r - .3, r + .9) * .8
        pull = E(t, s_ - .2, s_ + .4)
        close = E(t, tg - .2, tg + .35)
        a1, a2 = -66 + 18 * close, 66 - 18 * close
        x1, x2 = 392 - 26 * close, 330 + 22 * close

        def leaves(pt):
            pt.add(C.fig_leaf(x1, 660, 4.8, a1), "#4f6a4c", 9, "matte", 0, 0, "subject", .42, tseed=3)
            pt.add(C.fig_leaf_veins(x1, 660, 4.8, a1, 1.6), "#6f8a69", 0, "none", 0, 0, "subject", 0, flat=True)
            pt.add(C.fig_leaf(x2, 680, 4.8, a2), "#405a42", 11, "matte", 0, 0, "subject", .42, tseed=4)
            pt.add(C.fig_leaf_veins(x2, 680, 4.8, a2, 1.6), "#5f7a5c", 0, "none", 0, 0, "subject", 0, flat=True)
            cx = (x1 + x2) / 2 + 2
            zig = [(cx - 16 + 32 * (i % 2), 520 + i * 38) for i in range(6)]
            pt.add(P.polyline(zig, 3.4), "#e8e0cf", 2, "smooth", 0, 0, "subject", .3)
            end = zig[0]
            tip = (530 + 30 * pull, 344 - 40 * pull)
            sag = 40 * (1 - pull)
            pt.add(P.polyline(P.spline([end, ((end[0] + tip[0]) / 2, (end[1] + tip[1]) / 2 + sag), tip], closed=False, n=8), 2.6), "#e8e0cf", 2, "smooth", 0, 0, "subject", .3)

        def hands(pt):
            C.hand(pt, 170 + 18 * close, 900 - 10 * close, 108, 26, EVE.skin, EVE.skin, curl=.62 - .2 * close, spread=3, reach=7, grip=.3 + .5 * close)
            C.hand(pt, 606 + 30 * pull, 566 - 40 * pull, 100, -18, ADAM.skin, ADAM.skin, curl=.56, spread=3, reach=9, grip=.6)
        return dict(cam=(360, 640, 1.03 + .03 * lin(t, 0, W.dur)), grade=drain(dr),
                    slots={"leaves": [("draw", (40, 300, 700, 1000), leaves)], "hands": [("draw", (0, 200, DW, DH), hands)]})
    return Shot("S14", st, frame, pre=.5)


def cold_eden(seed, key=(-120, 560)):
    return P.Stage(key, "#8a9390", "#6f7a78", .76, .34, 800, "#cfdcf2", seed)


def grass_wave(pt, xw, y_base=DH + 20, cold=True):
    r = np.random.default_rng(7)
    blades, tips = [], []
    for x in range(-30, 780, 22):
        h = r.uniform(150, 280)
        bend = float(np.clip((xw - x) / 120, 0, 1))
        near = float(np.exp(-((x - xw) / 60) ** 2))
        lean = 22 + 70 * bend + 14 * near
        pts = [(x, y_base), (x + lean * .3, y_base - h * .6), (x + lean, y_base - h * (1 - .12 * bend))]
        blades.append(pts)
        if near > .25:
            tips.append([(x + lean * .62, y_base - h * .84), (x + lean, y_base - h * (1 - .12 * bend))])
    m = np.maximum.reduce([P.ribbon(b, [20, 12, 2], n=6) for b in blades])
    pt.add(m, "#2b3a34", 14, "matte", 0, 0, "near", .42, tseed=8)
    if tips:
        pt.gold(np.maximum.reduce([P.ribbon(tp, [3, 1.5], n=4) for tp in tips]), 2, 0)


def s15():
    W = Words("S15")
    st = cold_eden(25)
    st.add(mass(251, 180, 300, 420, 300), "#5b6a68", 6, "matte", tear=5, band="far")
    for i, (x, w, lean) in enumerate(((520, 90, -20), (640, 120, -10), (430, 50, -30))):
        st.add(P.trunk(260 + i, x, w, lean=lean), "#232d3e", 10, "fiber", tear=4, band="mid")
    st.add(mass(255, 640, 180, 260, 280), "#1c2536", 11, "matte", tear=5, band="mid")
    st.add(fill(spline([(-60, DH + 60), (-60, 880), (260, 850), (520, 870), (780, 840), (780, DH + 60)])), "#4c5650", 9, "fiber", band="mid")
    st.slot("pair", "subject")
    st.add(P.trunk(266, 700, 140, lean=-20), "#141a24", 16, "fiber", tear=4, band="near")
    st.slot("grass", "near")

    def frame(t):
        wk, hd = W("walking"), W("hide")
        turn = E(t, wk - .3, wk + .3)
        run = max(0.0, t - hd + .1)
        xw = -140 + 300 * ease(lin(t, 0, W.dur + .4))
        items = []
        for k, (f, x, y, u) in enumerate(((ADAM_F, 170, 880, 36), (EVE_F, 290, 884, 34))):
            if run > 0:
                d = 260 * run + 90 * run * run
                p, b = R.walk(pose("stand", torso=14, neck=-2, head=-2), d, u * .8, amp=38, arms=32)
                p.update(el_f=70, el_b=70)
                items.append(("fig", f, x + d, y + b * u, u, p, dict(contact=True)))
            else:
                p = R.breathe(pose("stand", head=0 + 30 * turn, neck=8 * turn, brow=turn), t, .5, phase=k)
                items.append(("fig", f, x, y, u, p, dict(contact=True, sx=1 - 2 * float(np.clip(turn * 1.2 - .1, 0, 1)) if k == 1 else 1.0)))
        return dict(cam=move_cam("track", 10, ease_io(lin(t, -.2, W.dur + .2)), focus=(380, 700)), grade=drain(.55),
                    slots={"pair": items, "grass": [("draw", (-60, 980, 800, DH + 60), lambda pt: grass_wave(pt, xw))]})
    return Shot("S15", st, frame)


def top_stage(seed=26, ring=False):
    st = P.Stage((360, -300), "#2c3a52", "#26334a", .86, .3, 1000, "#cfdcf2", seed)
    st.add(mass(275, 366, 590, 210, 230), "#3c4d6a", 6, "fiber", tear=5, band="mid")
    st.add(mass(276, 366, 600, 140, 150), "#43567a", 4, "fiber", tear=4, band="mid")
    st.contact(362, 640, 96, 9, .7)
    st.slot("pair", "subject")
    st.slot("ring", "subject")
    C.canopy(st)
    return st


def s16():
    W = Words("S16")
    st = top_stage(26)

    def frame(t):
        h = E(t, W("hidden") - .3, W("hidden") + .5)
        pe = R.breathe(R.mix(pose("brace"), pose("brace", torso=48, neck=26, head=34, shrug=.22), h), t, .5)
        pa = R.breathe(R.mix(pose("brace"), pose("brace", torso=48, neck=26, head=34, shrug=.22), h), t, .5, phase=1)
        return dict(cam=(364, 620, 1.04 + .03 * lin(t, 0, W.dur)), grade=drain(.35),
                    slots={"pair": [("fig", EVE_F, 396, 632, 34, pe, dict(eyes="shut")), ("fig", ADAM_F, 332, 636, 37, pa, dict(flip=True, eyes="shut"))]})
    return Shot("S16", st, frame)


def hide_stage(seed=4, gold=False):
    st = P.Stage((-120, 640), "#1a2438", "#27384f", .76, .42, 760, "#cfdcf2", seed)
    C.forest(st)
    st.contact(412, 1020, 170, 12, .75)
    if gold:
        st.tag("call", "mid")
        r = np.random.default_rng(25)
        polys = []
        for rad in (180, 262):
            for k in range(15):
                a0 = -.5 + k * 1.0 / 14 + r.uniform(-.02, .02)
                x, y, sz = -90 + rad * np.cos(a0), 800 + rad * np.sin(a0), r.uniform(8, 13)
                polys.append(P.leaf_poly(x, y, sz, a0 + 1.57))
        st.gold(fill(*polys), 3, 0)
        st.untag()
    st.slot("pair", "subject")
    C.trees_near(st)
    st.add(mass(150, 360, 1250, 480, 130), "#0c1218", 22, "matte", tear=5, band="near")
    st.add(P.big_leaves(151, [(-40, 1190, 760, 1340)], 9, (60, 112)), "#0a0f14", 24, "matte", blur=4, tear=0, band="front")
    return st


def hide_figs(t, adam_pose, eve_pose, adam_eyes="shut"):
    return [("fig", EVE_F, 448, 1012, 74, eve_pose, dict(eyes="shut")), ("fig", ADAM_F, 380, 1018, 82, adam_pose, dict(flip=True, eyes=adam_eyes))]


def s17():
    W = Words("S17")
    st = hide_stage(4)

    def frame(t):
        tight = E(t, W("leave") - .2, W("leave") + .5)
        pe = R.breathe(pose("brace", el_f=84 + 14 * tight, sh_f=16 + 8 * tight, shrug=.16 + .06 * tight), t, 1.0, rate=.2)
        pa = R.breathe(pose("brace"), t, .9, rate=.18, phase=1.4)
        return dict(cam=(370, 720, 1.08 + .02 * lin(t, 0, W.dur)), grade=drain(.3), slots={"pair": hide_figs(t, pa, pe)})
    return Shot("S17", st, frame, pre=.5)


def call_frame(W, start_word, stop_word, dark=False, resume_word=None):
    def frame(t):
        c = W(start_word)
        if resume_word:
            # the held moment from shot 18, picked up again: the gold starts moving on 'said'
            r = E(t, W(resume_word) - .1, W.dur + .4)
            dx = -40 + 40 * r
            turn = 1.0
        else:
            sp = E(t, -.2, W(stop_word) + .1)
            dx = -340 + 300 * sp
            turn = E(t, c - .2, c + .5)
        pa = R.mix(pose("brace"), pose("turned"), turn)
        pa = R.breathe(pa, t, .35 if not resume_word else .3, rate=.16)
        pe = R.breathe(pose("brace"), t, .3, rate=.17, phase=1.2)
        cam = move_cam("push", 6, ease_io(lin(t, -.2, W.dur + .2)), focus=(380, 760)) if not dark else (380, 760, 1.08)
        fr = dict(cam=cam, grade=drain(.3), xf={"call": dict(dx=dx)}, slots={"pair": hide_figs(t, pa, pe, "open" if turn > .5 else "shut")})
        if dark:
            from core import chain, dim
            fr["grade"] = chain(drain(.3), dim(.62))
        return fr
    return frame


def s18():
    W = Words("S18")
    st = hide_stage(4, gold=True)
    return Shot("S18", st, call_frame(W, "calls", "We'll"), post=.4)


def s19():
    W = Words("S19")
    st = cold_eden(29, key=(-120, 300))
    st.add(mass(291, 560, 300, 330, 300), "#5b6a68", 6, "matte", tear=5, band="far")
    st.add(mass(292, 160, 1000, 260, 240), "#56625f", 6, "matte", tear=5, band="far")
    st.add(C.fig_leaf(190, 300, 3.0, -28), "#6b6147", 8, "matte", tear=2, band="mid")
    st.add(C.fig_leaf_veins(190, 300, 3.0, -28, 1.2), "#857a5a", 0, "none", tear=0, band="mid", shadow=0, flat=True)
    st.slot("hand", "subject")
    st.slot("dust", "subject")

    def frame(t):
        d = W("die")
        op = E(t, d - .3, d + .3)
        r = np.random.default_rng(9)
        n = 900
        x0 = r.normal(372, 22, n)
        open_t = d - .15
        # a thin trickle before the hand opens, then it pours
        t0 = np.where(np.arange(n) < 120, r.uniform(-1.0, open_t, n), open_t + r.exponential(.55, n))
        vy = r.uniform(120, 220, n)
        vx = r.normal(0, 16, n)
        rad = r.choice((1.2, 1.6, 2.2, 2.8, 3.4), n)

        def dust(pt):
            import cv2
            c = pt.cv
            m = np.zeros((c.ph, c.pw), np.float32)
            for i in range(n):
                age = t - t0[i]
                if age < 0:
                    continue
                y = 640 + vy[i] * age + 60 * age * age
                x = x0[i] + vx[i] * age + (y - 640) * .05
                if y > DH + 10:
                    continue
                cv2.circle(m, (int((x - c.x0) * P.S), int((y - c.y0) * P.S)), max(1, int(rad[i] * P.S)), 1.0, -1, cv2.LINE_AA)
            pt.add(m, "#7c6b58", 1.5, "smooth", 0, 0, "subject", .25, tseed=5)
        return dict(cam=(360, 640, 1.03 + .02 * lin(t, 0, W.dur)), grade=drain(.45),
                    slots={"hand": [("draw", (150, -120, 620, 760), lambda pt: C.hand(pt, 380, 560, 112, 176, ADAM.skin, "#4c5560", curl=.84 - .4 * op, spread=4 + 8 * op, grip=.5 * (1 - op), reach=6))],
                           "dust": [("draw", (180, 600, 600, DH), dust)]})
    return Shot("S19", st, frame)


def dry_stage(seed, key=(560, 470), top="#d2bf97", bottom="#c4ab80"):
    st = P.Stage(key, top, bottom, .84, .3, 900, "#fff0cf", seed)
    C.dry_edge(st, key)
    return st


def s20():
    W = Words("S20")
    st = dry_stage(30)
    st.slot("pair", "subject")
    st.add(P.trunk(301, 120, 90), "#3f3428", 10, "fiber", tear=4, band="near")
    st.add(mass(302, 60, 330, 300, 380), "#3f4e3b", 12, "matte", tear=5, band="near")
    st.add(mass(303, 30, 820, 240, 200), "#4a5a44", 14, "matte", tear=5, band="near")
    C.grass(st, 1000, x0=-40, x1=260, n=40, h=(60, 140), color="#3c4a36", seed=30, band="near", lift=8)

    def frame(t):
        g = W("garden")
        stop = E(t, -.4, g + .2)
        d = 120 * stop
        pa, ba = R.walk(pose("stand"), d, 27)
        pe, be = R.walk(pose("stand", head=-4), d + 20, 25)
        if stop > .97:
            pa, pe = R.breathe(pose("stand"), t, .5), R.breathe(pose("stand", head=-4), t, .5, phase=1)
            ba = be = 0
        return dict(cam=move_cam("pull", 12, ease_io(lin(t, -.2, W.dur + .2)), focus=(420, 700)), grade=drain(.25),
                    slots={"pair": [("fig", ADAM_F, 302 + d, 838 + ba * 27, 27, pa, dict(contact=True)), ("fig", EVE_F, 352 + d, 842 + be * 25, 25, pe, dict(contact=True))]})
    return Shot("S20", st, frame)


def s21():
    W = Words("S21")
    st = P.Stage((360, -60), "#b7a27c", "#8f8263", .74, .5, 760, "#ffd98f", 31)
    C.dry_edge(st, (560, 470))
    st.add(mass(303, 30, 500, 240, 420), "#4a5a44", 10, "matte", tear=5, band="mid")
    st.tag("ripple", "subject")
    for r in (240, 300, 360):
        st.gold(arc(360, -60, r, 58, 122, 2.4), 2, 0)
    st.untag()
    st.slot("pair", "subject")
    st.slot("leaves", "subject")

    def frame(t):
        b, m = W("before"), W("makes")
        up = E(t, b - .2, b + .5) * (1 - .5 * E(t, m + .8, m + 1.6))
        cloth = E(t, m - .1, m + .8)
        rp = E(t, m - .8, m + 1.2)
        pa = R.breathe(pose("stand", head=-10 * up, neck=-4 * up), t, .5)
        pe = R.breathe(pose("stand", head=-4 - 10 * up, neck=-4 * up), t, .5, phase=1)
        items = []
        for f0, f1, x, y, u, p, fl in ((ADAM_F, ADAM_S, 216, 990, 128, pa, False), (EVE_F, EVE_S, 490, 1000, 118, pe, True)):
            if cloth < .999:
                items.append(("fig", f0, x, y, u, p, dict(flip=fl, alpha=1 - cloth)))
            if cloth > .001:
                items.append(("fig", f1, x, y - 14 * (1 - cloth), u, p, dict(flip=fl, alpha=cloth)))

        def leaves(pt):
            r = np.random.default_rng(4)
            for i in range(10):
                x0 = (216 if i < 5 else 490) + r.uniform(-60, 60)
                age = t - m - r.uniform(0, .5)
                if age <= 0:
                    continue
                y = 980 + 160 * age * age + 40 * age
                x = x0 + 30 * np.sin(age * 3 + i)
                pt.add(C.fig_leaf(x, y, .9, r.uniform(0, 360) + age * 90), R.FIG_LEAF, 3, "matte", 0, 0, "subject", .3, tseed=6)
        return dict(cam=(360, 680, 1.03 + .02 * lin(t, 0, W.dur)), fade={"ripple": float(np.sin(np.pi * rp)) * .9}, xf={"ripple": dict(dy=-80 + 180 * rp)},
                    slots={"pair": items, "leaves": [("draw", (60, 900, 660, DH + 40), leaves)]})
    return Shot("S21", st, frame)


def s22():
    W = Words("S22")
    st = P.Stage((640, -40), "#6f6250", "#4d4538", .66, .7, 620, "#ffd98f", 32)
    st.add(mass(321, 110, 420, 280, 520), "#3f3a30", 7, "matte", tear=5, band="far")
    st.glow(soft(640, 0, 400, 500)[..., None] * GOLD * .18, "far")
    st.slot("eve", "subject")
    st.slot("hand", "subject")

    def frame(t):
        tn, sl = W("turned"), W("still")
        touch = E(t, tn - .4, tn + .4)
        look = E(t, sl - .3, sl + .5)
        p = R.breathe(pose("open", torso=2, neck=0, head=6 - 14 * look, lid=.5 * (1 - look)), t, .7)
        return dict(cam=move_cam("push", 5, ease_io(lin(t, -.2, W.dur + .2)), focus=(400, 620)),
                    slots={"eve": [("fig", EVE_S, 420, 1640, 318, p, dict(flip=True, arms=False))],
                           "hand": [("draw", (40, 700, 520, DH + 100), lambda pt: C.hand(pt, 190 + 70 * touch, 1330 - 120 * touch, 104, 22 + 14 * touch, EVE.skin, R.SKINS["eve"], curl=.8, lift=6, spread=5))]})
    return Shot("S22", st, frame)


def s23():
    W = Words("S23")
    st = P.Stage((120, -240), "#0f1526", "#1a2238", .84, .34, 1100, "#dfe8ff", 33)
    C.stars(st, 420, 640, 13)
    st.tag("sun", "far")
    st.add(circle(360, 180, 34), "#efe0ae", 4, "smooth", band="far")
    st.glow(soft(360, 180, 120, 120)[..., None] * hexc("#efe0ae") * .3)
    st.untag()
    st.tag("moon", "far")
    st.add(circle(360, 180, 24), "#d8d6cc", 4, "smooth", band="far")
    st.darken(fill(ellipse(372, 174, 22, 22)) * .7)
    st.untag()
    ground, disc = C.big_earth(st, "#2f4a70", "#6b7c5c")
    C.clouds(st)
    X, Y = P.grids()
    st.darken(np.clip((X - 300) / 520, 0, 1) * disc * .62, "near")
    st.tag("point", "near")
    st.gold(circle(430, 690, 6), 2, 0)
    st.gold(arc(430, 690, 30, 0, 359, 1.6), 2, 0)
    st.untag()

    def frame(t):
        ns, lv = W("never"), W("loved")
        race = lin(t, ns - .3, ns + 1.6)
        sx = -120 + 960 * ease_io(race)
        mx = -120 + 960 * ease_io(lin(t, ns + .4, ns + 2.2))
        arc_y = lambda x: 320 - 200 * (1 - ((x - 360) / 480) ** 2)
        return dict(cam=move_cam("push", 18, ease_io(lin(t, -.2, W.dur + .2)), focus=(410, 720)),
                    fade={"sun": float(race > 0 and race < 1), "moon": float(0 < lin(t, ns + .4, ns + 2.2) < 1), "point": E(t, lv - .2, lv + .4)},
                    xf={"sun": dict(dx=sx - 360, dy=arc_y(sx) - 180), "moon": dict(dx=mx - 360, dy=arc_y(mx) - 180), "point": dict(sc=.6 + .4 * E(t, lv - .2, lv + .6), pivot=(430, 690))})
    return Shot("S23", st, frame)


def s24():
    W = Words("S24")
    st = P.Stage((360, 400), "#1b2238", "#2a2a38", .72, .5, 640, "#ffd98f", 34)
    C.stars(st, 200, 700, 24)
    st.tag("light", "far")
    st.glow(soft(360, 480, 300, 320)[..., None] * GOLD * .5)
    st.untag()
    st.add(fill(spline([(-60, 1000), (160, 900), (400, 940), (780, 880), (780, DH + 60), (-60, DH + 60)])), "#1a1824", 6, "fiber", tear=5, band="far")
    st.add(fill(spline([(-60, DH + 60), (-60, 830), (180, 760), (360, 700), (540, 760), (780, 830), (780, DH + 60)])), "#23202c", 10, "fiber", tear=5, band="near")
    bar = np.maximum(fill([(353, 712), (367, 712), (367, 470), (353, 470)]), fill([(312, 530), (408, 530), (408, 542), (312, 542)]))
    st.gold(bar, 3, 1, band="near")

    def frame(t):
        sn = W("Son")
        g = .55 + .45 * E(t, sn - .3, sn + .8)
        return dict(cam=(360, 620, 1.04 + .02 * lin(t, 0, W.dur)), fade={"light": g}, glow=.62 + .3 * E(t, sn - .3, sn + .8))
    return Shot("S24", st, frame, post=.5)


SHOTS = dict(S13=s13, S14=s14, S15=s15, S16=s16, S17=s17, S18=s18, S19=s19, S20=s20, S21=s21, S22=s22, S23=s23, S24=s24)
