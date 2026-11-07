"""Shots 1-12: the question, the stakes, the easy answers, the turn, and the story up to the first bite."""
import numpy as np

import paper as P
import rig as R
import scenes as C
from core import Shot, Words, move_cam
from paper import DH, DW, GOLD, arc, circle, ellipse, fill, hexc, mass, ribbon, soft, spline, stroke
from rig import Figure, ease, ease_io, keys, pose

ADAM = Figure("adam", seed=1)
EVE = Figure("eve", seed=2)
YOU = Figure("you", garment="modern", seed=3)


def lin(t, a, b):
    return float(np.clip((t - a) / max(b - a, 1e-6), 0, 1))


def E(t, a, b):
    return float(ease_io(lin(t, a, b)))


# S01 -------------------------------------------------------------------------------------------------
def s01():
    W = Words("S01")
    st = P.Stage((360, -200), "#0f1526", "#1a2238", .84, .22, 1000, "#dfe8ff", 11, canvas=P.Canvas(-60, -420, DW + 120, DH + 520))
    with P.on(st.cv):
        C.stars(st, 900, DH + 100, 4)
        C.stars(st, 60, DH + 100, 5, scale_=1.8)
        st.tag("galaxy", "far")
        C.galaxy(st)
        st.untag()
        st.add(circle(566, 820, 26), "#d9c9a0", 6, "smooth", band="mid")
        st.glow(soft(566, 820, 70, 70)[..., None] * hexc("#d9c9a0") * .25, "mid")
        C.earth_at(st, 360, 1060, 62, band="subject")

    def frame(t):
        u = ease_io(lin(t, -.3, W.dur + .3))
        return dict(cam=(360, 470 + 520 * u, 1.0 + .85 * u ** 1.6), xf={"galaxy": dict(rot=-6 * t, pivot=(360, 430))})
    return Shot("S01", st, frame, pre=.6, post=.4)


# S02 -------------------------------------------------------------------------------------------------
def hill_stage(seed, gold=False, sid="S02"):
    st = P.Stage((360, -260), "#121a2d", "#3c4a66", .8, .3, 900, "#ffd98f" if gold else "#dfe8ff", seed)
    C.stars(st, 760, 900, 4)
    C.stars(st, 50, 700, 9, scale_=1.9)
    st.glow(soft(360, 1000, 520, 160)[..., None] * hexc("#3d4f74") * .4, "sky")
    C.hill(st, gold)
    return st


def s02():
    W = Words("S02")
    st = hill_stage(2)
    st.slot("you", "near")
    st.add(fill(spline([(-60, DH + 60), (-60, 1190), (200, 1150), (520, 1175), (780, 1140), (780, DH + 60)])), "#0a0d14", 14, "fiber", band="front")

    def frame(t):
        lift = E(t, W("you") - .2, W("you") + .6)
        p = pose("stand", head=16 - 26 * lift, neck=8 - 8 * lift, torso=4 - 2 * lift)
        p = R.breathe(p, t, .6)
        return dict(cam=(360, 760, 1.04 + .05 * ease(lin(t, 0, W.dur))), slots={"you": [("fig", YOU, 360, 906, 17, p, dict(contact=True))]})
    return Shot("S02", st, frame, pre=.4)


# S03 -------------------------------------------------------------------------------------------------
def bird(st, x, y, s, flap, color="#3a342c"):
    up = np.sin(flap) * 14 * s
    st.add(fill(spline([(x - 30 * s, y - up), (x - 14 * s, y - 10 * s - up * .4), (x, y), (x + 14 * s, y - 10 * s - up * .4), (x + 30 * s, y - up), (x + 14 * s, y - 4 * s), (x, y + 7 * s), (x - 14 * s, y - 4 * s)], n=4)), color, 3, "smooth", 0, 0, "subject", .3, tseed=12)


def s03():
    W = Words("S03")
    st = P.Stage((540, 150), "#e3dcc6", "#cfd4c0", .84, .3, 1100, "#fff0cf", 13)
    st.glow(soft(540, 220, 220, 200)[..., None] * hexc("#fff1c4") * .3, "sky")
    st.add(circle(540, 210, 74), "#efe0ae", 5, "smooth", band="far")
    st.add(fill([(-60, 700), (150, 400), (280, 560), (430, 340), (640, 640), (780, 560), (780, 760), (-60, 760)]), "#aab1a6", 7, "fiber", tear=6, band="far")
    st.add(fill([(140, 420), (150, 400), (170, 430), (190, 470), (160, 450)]), "#e9e4d6", 2, "smooth", tear=2, band="far")
    st.add(fill([(410, 370), (430, 340), (455, 375), (480, 420), (445, 400)]), "#e9e4d6", 2, "smooth", tear=2, band="far")
    st.haze("#e3dcc6", .3, 300, 720, 1)
    st.add(fill([(-60, 720), (120, 560), (300, 690), (520, 600), (780, 700), (780, 800), (-60, 800)]), "#8e9a8e", 8, "fiber", tear=6, band="mid")
    st.slot("birds", "mid")
    for i, (y, c) in enumerate(((730, "#7f98a0"), (790, "#6b8792"), (860, "#5a7683"), (930, "#4a6573"))):
        st.tag(f"wave{i}", "near")
        pts = [(x, y + 11 * np.sin(x / 70 + i * 2)) for x in range(-100, 850, 50)] + [(850, DH + 80), (-100, DH + 80)]
        st.add(fill(np.array(pts, np.float32)), c, 7 + i, "matte", tear=2, band="near")
        crest = [(x, y + 11 * np.sin(x / 70 + i * 2) + 3) for x in range(-100, 850, 25)]
        st.add(P.polyline(crest, 2.2), "#cfe0de", 1, "smooth", 0, 0, "near", .2, .9)
        st.untag()

    def frame(t):
        k = lin(t, W("God") - .3, W("God") + .6)
        xf = {f"wave{i}": dict(dx=np.sin(t * (1.1 + i * .23) + i) * (10 + 8 * i) * (.3 + .7 * k), dy=np.sin(t * 1.7 + i * 1.3) * (2 + i) * (.4 + .6 * k)) for i in range(4)}
        tb = t - W("need") + 1.0
        birds = []
        for j, (oy, sc, ph) in enumerate(((0, 1.0, 0), (-34, 1.2, 1.6), (22, .9, 3.1), (-60, .8, 4.0))):
            x = -80 + tb * 150 + j * 46
            y = 250 + oy - tb * 18 + np.sin(tb * 2 + j) * 4
            if -60 < x < DW + 60 and tb > -2:
                birds.append(("draw", (x - 50, y - 40, x + 50, y + 30), (lambda x=x, y=y, sc=sc, f=tb * 9 + ph: lambda pt: bird(pt, x, y, sc, f))()))
        return dict(cam=move_cam("pan", 10, ease_io(lin(t, -.2, W.dur + .2))), xf=xf, slots={"birds": birds})
    return Shot("S03", st, frame, pre=.4)


# S04 -------------------------------------------------------------------------------------------------
def s04():
    W = Words("S04")
    st = P.Stage((130, 60), "#d9cdb2", "#b9a688", .9, .3, 900, "#fff0cf", 14)
    st.add(mass(141, 560, 200, 340, 260), "#c7b89b", 7, "matte", tear=5, band="far")
    st.add(mass(142, 120, 1100, 300, 220), "#c9b896", 6, "matte", tear=5, band="far")
    st.glow(soft(200, 200, 300, 300)[..., None] * hexc("#fff3d0") * .2, "far")
    st.slot("adult", "subject")
    st.slot("child", "subject")

    def frame(t):
        n = W("needed")
        rise = E(t, -.3, n - .15)
        grip = E(t, n - .1, n + .45)
        y = 880 - 262 * rise
        adult_curl = .72 - .16 * grip
        return dict(cam=(360, 600, 1.06 + .04 * ease(lin(t, 0, W.dur))), slots={
            "adult": [("draw", (120, 0, 720, 700), lambda pt: C.hand(pt, 404, 330 + 8 * grip, 118, 186, "#a97f5e", "#4c5a6c", curl=adult_curl, spread=5, reach=4))],
            "child": [("draw", (180, 250, 560, DH), lambda pt: C.hand(pt, 366 + 10 * grip, y - 50 * grip, 74, 6 - 6 * grip, "#c79c79", "#b86f4a", curl=.84 - .12 * grip, spread=6 * (1 - .75 * grip), reach=11))]})
    return Shot("S04", st, frame)


# S05 -------------------------------------------------------------------------------------------------
def s05():
    W = Words("S05")
    st = P.Stage((200, -100), "#2a3448", "#1c2434", .8, .4, 1000, "#cfdcf2", 15)
    for i, (r, c) in enumerate(((560, "#253047"), (430, "#2c3852"), (300, "#35425f"), (170, "#3e4c6b"))):
        st.add(mass(150 + i, 360, 640, r * .84, r), c, 8, "fiber", tear=6, band=["far", "mid", "mid", "subject"][i])
    st.darken(P.gblur(fill(np.array([(352, 650), (372, 650), (640, 1120), (560, 1160)], np.float32)), 5) * .5, "subject")
    st.slot("you", "subject")

    def frame(t):
        o = E(t, W("matter") - .25, W("matter") + .7)
        p = R.mix(pose("stand", head=6, neck=4), pose("hands_out", head=-4), o)
        p = R.breathe(p, t, .7)
        return dict(cam=move_cam("pull", 12, ease_io(lin(t, -.2, W.dur + .3)), focus=(362, 600)),
                    slots={"you": [("fig", YOU, 362, 588, 18, p, dict(contact=(650)))]})
    return Shot("S05", st, frame)


# S06 / S07: an idea hung on threads ---------------------------------------------------------------------
def thread(st, x, y0, y1, band="subject"):
    st.add(stroke((x, y0), (x, y1), 1.6), "#d8cfbb", 2, "smooth", 0, 0, band, .2)


def hanging_stage(seed, word, draw_shape):
    st = P.Stage((360, -120), "#141a2a", "#1e2638", .84, .3, 1000, "#fff0cf", seed)
    C.stars(st, 220, DH, seed)
    st.glow(soft(360, 520, 300, 520)[..., None] * hexc("#fff0cf") * .1, "sky")
    st.add(fill(spline([(-60, DH + 60), (-60, 1150), (360, 1130), (780, 1150), (780, DH + 60)])), "#141822", 6, "fiber", band="mid")
    st.glow(soft(360, 1150, 260, 40)[..., None] * hexc("#fff0cf") * .1, "mid")
    yw = 180
    st.tag("thr_top", "subject")
    thread(st, DW * .74, -420, yw - 60)
    st.untag()
    st.tag("thr_left", "subject")
    thread(st, DW * .26, -420, yw + 8)
    st.untag()
    st.tag("idea", "subject")
    st.add(C.text_mask(word, DW / 2, yw + 46, 84, "caps"), "#efe6d2", 7, "smooth", 0, 0, "subject", .5)
    draw_shape(st)
    st.untag()
    st.tag("thr_bot", "subject")
    thread(st, DW * .74, yw - 62, yw + 8)
    st.untag()
    return st


def hanging_frame(W, lower_word, snap_word, cam_kind=None, pct=0):
    pivot = (DW * .26, 188 + 110)

    def frame(t):
        lo = E(t, W(lower_word) - .5, W(lower_word) + .5)
        dy = 110 - 70 * (1 - lo)          # hangs below the caption line, and lowers a little on its word
        ts = W(snap_word) + .05
        xf = {"idea": dict(dy=dy), "thr_top": dict(dy=dy), "thr_bot": dict(dy=dy), "thr_left": dict(dy=dy)}
        if t > ts:
            k = t - ts
            # tip and swing on the left thread like a pendulum, then settle crooked
            ang = 24 * (1 - np.exp(-k * 7)) + 7 * np.exp(-k * 2.0) * np.sin(k * 7.5)
            drop = 0.0
            xf["idea"] = dict(rot=ang, dy=dy + drop, pivot=pivot)
            xf["thr_bot"] = dict(rot=ang, dy=dy + drop, pivot=pivot)
            xf["thr_top"] = dict(dy=dy - 260 * (1 - np.exp(-k * 9)))
        cam = move_cam(cam_kind, pct, ease_io(lin(t, -.2, W.dur + .2)), focus=(360, 600)) if cam_kind else (360, 620, 1.03)
        return dict(cam=cam, xf=xf)
    return frame


def s06():
    W = Words("S06")

    def shape(st):
        pieces = [fill([(200, 640), (520, 640), (520, 666), (200, 666)]), fill([(226, 660), (252, 660), (244, 860), (232, 860)]), fill([(468, 660), (494, 660), (488, 860), (476, 860)]),
                  fill([(96, 560), (116, 560), (116, 740), (186, 740), (186, 860), (168, 860), (168, 762), (116, 762), (116, 860), (96, 860)]),
                  fill([(624, 560), (604, 560), (604, 740), (534, 740), (534, 860), (552, 860), (552, 762), (604, 762), (604, 860), (624, 860)])]
        thread(st, 260, 240, 640)
        thread(st, 460, 240, 640)
        st.add(np.maximum.reduce(pieces), "#c9bea7", 7, "matte", tear=1.5, band="subject")
        st.add(fill(ellipse(360, 610, 30, 30)), "#d9c9a0", 5, "smooth", tear=1)
        st.add(fill([(346, 600), (374, 600), (380, 640), (340, 640)]), "#b4a88f", 4, "smooth", tear=1)
        thread(st, 360, 240, 580)
    st = hanging_stage(16, "LONELY?", shape)
    return Shot("S06", st, hanging_frame(W, "lonely", "needed"))


def s07():
    W = Words("S07")

    def shape(st):
        rows = ((760, 8, 58, "#a9a08c"), (850, 7, 68, "#bcb29c"), (950, 6, 78, "#cfc5ae"))
        thread(st, 120, 240, 700)
        thread(st, 600, 240, 700)
        for y, n, h, c in rows:
            parts = []
            for i in range(n):
                x = 80 + (i + .5) * 560 / n
                parts.append(fill(spline([(x - h * .13, y), (x - h * .12, y - h * .5), (x - h * .28, y - h * .92), (x - h * .22, y - h * .96), (x - h * .08, y - h * .62), (x + h * .08, y - h * .62), (x + h * .22, y - h * .96), (x + h * .28, y - h * .92), (x + h * .12, y - h * .5), (x + h * .13, y)], n=4)))
                parts.append(circle(x, y - h * .72, h * .1))
            strip = fill([(40, y - 2), (680, y - 2), (680, y + 90), (40, y + 90)])
            st.add(np.maximum.reduce(parts + [strip]), c, 8, "matte", tear=2, band="subject")
    st = hanging_stage(17, "WORSHIP?", shape)
    return Shot("S07", st, hanging_frame(W, "worship", "need", "pull", 14))


# S08 -------------------------------------------------------------------------------------------------
def s08():
    W = Words("S08")
    st = P.Stage((360, 420), "#0f1526", "#18223a", .7, .55, 520, "#ffd98f", 18)
    C.stars(st, 240, DH, 8)
    st.tag("light", "far")
    st.glow(soft(360, 430, 330, 330)[..., None] * GOLD * .22)
    rr = np.random.default_rng(8)
    rays = []
    for i in range(28):
        a = i / 28 * 2 * np.pi
        c, s = np.cos(a), np.sin(a)
        ln = rr.uniform(130, 340)
        rays.append([(360 + 58 * c - 3 * s, 430 + 58 * s + 3 * c), (360 + 58 * c + 3 * s, 430 + 58 * s - 3 * c), (360 + ln * c, 430 + ln * s)])
    st.gold(fill(*rays), 3, 0)
    st.gold(circle(360, 430, 46), 4, 1)
    st.untag()
    st.tag("sea", "mid")
    st.add(fill(spline([(-60, 800), (130, 740), (330, 790), (560, 720), (780, 780), (780, DH + 60), (-60, DH + 60)])), "#2f4a66", 8, "matte", tear=5, band="mid")
    st.add(P.polyline([(x, 770 + 14 * np.sin(x / 60)) for x in range(-40, 780, 20)], 2), "#6d8aa6", 1, "smooth", 0, 0, "mid", .2)
    st.untag()
    st.tag("land", "near")
    st.add(fill(spline([(-60, 930), (200, 840), (420, 900), (780, 820), (780, DH + 60), (-60, DH + 60)])), "#3e5240", 10, "fiber", tear=5, band="near")
    st.untag()
    st.tag("tree", "near")
    C.olive(st, 181, 630, 850, 360, 200, "#3c3026", "#5e7a58", 5, band="near")
    st.untag()
    st.tag("birds", "near")
    for x, y, s in ((560, 180, 1.0), (620, 150, 1.2), (500, 230, .9)):
        st.add(fill(spline([(x - 30 * s, y), (x - 14 * s, y - 14 * s), (x, y), (x + 14 * s, y - 14 * s), (x + 30 * s, y), (x + 14 * s, y - 6 * s), (x, y + 8 * s), (x - 14 * s, y - 6 * s)], n=4)), "#ece5d6", 4, "smooth", tear=1, band="near")
    st.untag()

    def frame(t):
        op = E(t, .1, 1.6)
        c1, c2 = W("created"), W("everything")
        return dict(cam=move_cam("push", 10, ease_io(lin(t, -.2, W.dur + .2)), focus=(360, 560)),
                    fade={"light": op, "sea": E(t, c1 - .4, c1 + .2), "land": E(t, c1 - .1, c1 + .5), "tree": E(t, c2 - .4, c2 + .3), "birds": E(t, c2, c2 + .5)},
                    xf={"light": dict(sc=.35 + .65 * ease(lin(t, .1, 2.2)), rot=t * 2.5, pivot=(360, 430)),
                        "sea": dict(dy=260 * (1 - E(t, c1 - .4, c1 + .5))), "land": dict(dy=300 * (1 - E(t, c1 - .1, c1 + .8))),
                        "tree": dict(dy=420 * (1 - E(t, c2 - .4, c2 + .5)), sc=.9 + .1 * E(t, c2 - .4, c2 + .5), pivot=(630, 850)),
                        "birds": dict(dx=-160 * (1 - E(t, c2, c2 + 1.2)) + 18 * t, dy=60 * (1 - E(t, c2, c2 + 1.2)))})
    return Shot("S08", st, frame, post=.5)


# Eden ------------------------------------------------------------------------------------------------
def eden_stage(seed, key=(120, -60), top="#e7dfc4", bottom="#cfd3ad"):
    st = P.Stage(key, top, bottom, .84, .28, 1000, "#fff0cf", seed)
    st.glow(soft(key[0] + 40, 40, 420, 380)[..., None] * hexc("#fff3d6") * .22, "sky")
    return st


def s09():
    W = Words("S09")
    st = eden_stage(19)
    C.eden_far(st)
    C.olive(st, 91, 600, 760, 420, 330, "#6c5a48", "#91a27f", 6, band="far", lift=7, tone=1.02)
    st.haze("#e8dfc8", .25, 400, 900, 3)
    st.add(fill(spline([(90, 880), (100, 560), (76, 300), (140, 300), (170, 560), (182, 880)])), "#5d4b3c", 8, "fiber", band="mid")
    st.add(mass(33, 90, 220, 300, 230), "#6f8762", 10, "matte", tear=5, band="mid")
    st.add(mass(34, 170, 330, 160, 120), "#7d966e", 6, "matte", tear=4, band="mid")
    C.meadow(st, 860, "#8b9768")
    C.beam(st, 160, 300, -40, 300, 620, 1100, .16)
    st.slot("pair", "subject")
    C.hedge(st, -60, 780, 852, color="#5a7450", seed=9, band="near", lift=8, flowers="#e8dcc0")
    C.grass(st, 860, n=90, h=(26, 60), color="#5d7650", seed=9, band="near", lift=4)
    C.ferns(st, 35, [(-40, 1000, 760, 1340)], 20, (70, 130), "#4b6346", band="near", lift=13)
    st.tag("shadow", "near")
    st.darken(P.gblur(P.mass(196, 330, 800, 210, 260), 22) * .42)
    st.untag()
    st.tag("motes", "near")
    C.motes(st, 70, (60, 200, 700, 900), 19)
    st.untag()
    C.ferns(st, 36, [(-60, 1180, 780, 1360)], 9, (90, 150), "#33473a", band="front", lift=22, blur=4)

    def frame(t):
        d = 150 * (t + .5) / (W.dur + 1)
        pa, ba = R.walk(pose("stand", head=-2), d * 1.0, 44)
        pe, be = R.walk(pose("stand", head=-6, neck=-2), d * 1.0 + 30, 41)
        x = 190 + d
        sh = E(t, W("turned") - 1.6, W("turned") + .2)
        return dict(cam=move_cam("crane", 16, ease_io(lin(t, -.4, W.dur + .3)), focus=(380, 700)),
                    xf={"shadow": dict(dx=560 * (1 - sh)), "motes": dict(dx=6 * t, dy=-5 * t)},
                    slots={"pair": [("fig", EVE, x, 872 + be * 41, 41, pe, dict(contact=True)), ("fig", ADAM, x + 120, 880 + ba * 44, 44, pa, dict(contact=True))]})
    return Shot("S09", st, frame, pre=.5)


def s10():
    W = Words("S10")
    st = eden_stage(20, top="#e7dfc4", bottom="#d3d4b4")
    st.add(mass(201, 34, 500, 170, 150), "#c6ceb4", 6, "matte", tear=5, band="far")
    st.add(mass(202, 690, 480, 180, 160), "#c0caae", 6, "matte", tear=5, band="far")
    C.olive(st, 203, 80, 640, 300, 200, "#9e8f78", "#c2cbb0", 4, band="far", lift=5)
    C.olive(st, 204, 660, 640, 280, 180, "#9e8f78", "#bcc6a9", 4, band="far", lift=5)
    st.haze("#e8dfc8", .3, 300, 760, 1)
    C.meadow(st, 680, "#8d976c")
    st.add(fill(ellipse(360, 806, 262, 66)), "#a9a77d", 3, "fiber", tear=4, band="mid")
    st.contact(360, 806, 110, 13, .5)
    wood = [ribbon([(360, 810), (350, 690), (362, 570), (356, 470)], [50, 38, 30, 22]),
            ribbon([(356, 570), (270, 490), (160, 452)], [20, 13, 6]), ribbon([(360, 545), (452, 476), (566, 442)], [20, 13, 6]),
            ribbon([(358, 505), (306, 420), (244, 386)], [15, 10, 5]), ribbon([(358, 495), (424, 414), (496, 378)], [15, 10, 5])]
    st.add(np.maximum.reduce(wood), "#3c3026", 11, "fiber", tear=1.4, band="subject")
    st.add(mass(204, 360, 346, 286, 122), "#2f4032", 13, "matte", tear=5, band="subject")
    st.add(mass(207, 360, 316, 200, 70), "#3b5240", 5, "matte", tear=4, band="subject")
    for x, y in ((214, 402), (288, 438), (360, 416), (432, 440), (506, 404), (262, 352), (456, 350)):
        st.add(fill(ellipse(x, y, 12, 15, 8)), "#86392f", 3, "smooth", tear=.6, band="subject")
    st.tag("ripple", "subject")
    for r in (150, 214, 278):
        st.gold(arc(360, -40, r, 66, 114, 2.4), 2, 0)
    st.untag()
    st.slot("pair", "subject")
    C.hedge(st, 110, 330, 846, color="#62794f", seed=4, band="near", lift=6, flowers="#efe2c6", bottom=950)
    st.add(mass(205, 30, 1250, 300, 150), "#54694f", 14, "matte", tear=5, band="near")
    st.add(mass(206, 700, 1240, 260, 150), "#4b614a", 14, "matte", tear=5, band="near")

    def frame(t):
        r = E(t, W("told") - .2, W("told") + 1.1)
        look = E(t, W("one") - .3, W("one") + .4)
        pa = R.breathe(R.mix(pose("stand", head=4), pose("look_up", head=-16), look), t, .5)
        pe = R.breathe(R.mix(pose("stand", head=6), pose("look_up", head=-18), look), t, .5, phase=1)
        return dict(cam=move_cam("push", 8, ease_io(lin(t, -.2, W.dur + .2)), focus=(330, 640)),
                    fade={"ripple": float(np.sin(np.pi * r))}, xf={"ripple": dict(dy=-60 + 160 * r)},
                    slots={"pair": [("fig", ADAM, 186, 866, 33, pa, dict(contact=True)), ("fig", EVE, 250, 872, 31, pe, dict(contact=True))]})
    return Shot("S10", st, frame)


def serpent_path():
    return P.spline([(120, 230), (84, 340), (180, 420), (128, 520), (220, 590), (292, 560)], closed=False, n=20)


def serpent(st, k):
    path = serpent_path()
    n = len(path)
    m = max(3, int(n * k))
    pts = path[:m]
    widths = list(np.linspace(14, 26, m // 2)) + list(np.linspace(26, 16, m - m // 2))
    body = np.zeros((st.cv.ph, st.cv.pw), np.float32)
    q = P._px(pts)
    import cv2
    b = P._blank()
    for a_, b_, w_ in zip(q[:-1], q[1:], widths[1:]):
        cv2.line(b, tuple(np.int32(np.round(a_ * 4))), tuple(np.int32(np.round(b_ * 4))), 255, max(1, int(round(w_ * P.S * P.SS))), cv2.LINE_AA, shift=2)
    body = P._done(b)
    hx, hy = pts[-1]
    d = pts[-1] - pts[-3]
    ang = np.degrees(np.arctan2(d[1], d[0]))
    head = fill(ellipse(hx + np.cos(np.radians(ang)) * 10, hy + np.sin(np.radians(ang)) * 10, 30, 18, ang))
    st.add(np.maximum(body, head), "#27352c", 10, "fiber", 0, 0, "subject", .42, tseed=77)
    st.add(P.polyline(pts[::2], 3), "#3d5243", 0, "none", 0, 0, "subject", 0, flat=True)
    ex, ey = hx + np.cos(np.radians(ang)) * 22, hy + np.sin(np.radians(ang)) * 22 - 5
    st.add(fill(ellipse(ex, ey, 5, 1.6, ang)), "#d9cfae", 0, "none", 0, 0, "subject", 0, flat=True)


def s11():
    W = Words("S11")
    st = P.Stage((640, -40), "#d3cfb2", "#b8bd9a", .78, .34, 900, "#fff0cf", 21)
    st.add(mass(211, 300, 420, 460, 340), "#a9b393", 6, "matte", tear=5, band="far")
    C.olive(st, 216, 640, 900, 520, 300, "#7d6c58", "#9aab86", 5, band="far", lift=6)
    st.haze("#d8d2b6", .3, 260, 900, 1)
    st.add(ribbon([(-60, 240), (160, 210), (360, 250), (560, 200), (800, 230)], [64, 54, 46, 40, 34]), "#54442f", 9, "fiber", band="mid")
    st.add(mass(212, 120, 60, 300, 170), "#58704f", 11, "matte", tear=5, band="mid")
    st.add(mass(213, 640, 40, 260, 150), "#4f6648", 11, "matte", tear=5, band="mid")
    st.add(mass(217, 380, 120, 200, 110), "#647d58", 8, "matte", tear=5, band="mid")
    st.add(stroke((360, 244), (360, 300), 3), "#3e3225", 4, "smooth", 0, 1, band="mid")
    st.slot("fruit", "mid")
    st.slot("eve", "subject")
    st.slot("snake", "subject")
    st.add(mass(214, 200, 1100, 360, 230), "#4f654b", 14, "matte", tear=5, band="near")
    st.add(mass(215, 640, 1120, 260, 210), "#475d46", 16, "matte", tear=5, band="near")
    C.ferns(st, 218, [(-40, 1180, 760, 1340)], 10, (80, 140), "#34473a", band="front", lift=20, blur=4)

    def frame(t):
        k = .35 + .65 * E(t, -.4, W("tells") + .1)
        lk = E(t, W("like") - .3, W("like") + .4)
        p = pose("open", torso=-2, neck=-3, head=-6 - 14 * lk, sh_f=8, el_f=24, sh_b=-6, el_b=10, brow=.2 * lk)
        p = R.breathe(p, t, .8)
        sway = np.sin(t * 1.3) * 2
        return dict(cam=move_cam("track", 8, ease_io(lin(t, -.2, W.dur + .2)), focus=(380, 640)),
                    slots={"fruit": [("draw", (320, 280, 400, 380), lambda pt: C.fruit(pt, 360, 332 + sway * .3, 30, band="subject"))],
                           "eve": [("fig", EVE, 520, 1110, 152, p, dict(flip=True, eyes="shut" if R.blink(t, 3.1, 2) else "open"))],
                           "snake": [("draw", (40, 180, 360, 640), lambda pt: serpent(pt, k))]})
    return Shot("S11", st, frame)


def s12():
    W = Words("S12")
    st = P.Stage((120, -60), "#cfcdae", "#b4bb97", .84, .34, 900, "#fff0cf", 22)
    st.add(mass(221, 560, 300, 330, 330), "#93a381", 7, "matte", tear=5, band="far")
    st.add(mass(222, 80, 160, 260, 200), "#a3b28f", 6, "matte", tear=5, band="far")
    st.haze("#d8d2b6", .2, 0, 1280, 2)
    st.slot("eve", "subject")
    st.slot("fruit", "subject")
    st.slot("hand", "subject")

    def frame(t):
        e = W("eats")
        up = E(t, -.4, e - .1)
        bite = E(t, e - .05, e + .18)
        lean = E(t, e - .3, e + .05) * (1 - .6 * E(t, e + .3, e + .9))
        p = pose("open", torso=2 + 3 * lean, neck=2 + 4 * lean, head=3 + 6 * lean, lid=.3 + .5 * bite)
        ops, info = R.build(EVE, 170, 1640, 330, p)
        mx, my = info["head"]
        fx, fy = mx + 250 - 40 * up, my + 230 + 220 * (1 - up) - 30
        return dict(cam=(360, 640, 1.02 + .03 * lin(t, 0, W.dur)),
                    slots={"eve": [("fig", EVE, 170, 1640, 330, p, dict(arms=False, eyes="shut" if bite > .3 and t < e + .5 else "open"))],
                           "fruit": [("draw", (fx - 120, fy - 130, fx + 110, fy + 110), lambda pt: C.fruit(pt, fx, fy, 80, bite=bite, lift=8))],
                           "hand": [("draw", (fx - 160, fy - 90, fx + 220, DH + 200), lambda pt: C.hand(pt, fx + 22, fy + 196, 104, -10 - 6 * up, EVE.skin, EVE.skin, curl=.66, lift=6, spread=5, reach=5))]})
    return Shot("S12", st, frame)


SHOTS = dict(S01=s01, S02=s02, S03=s03, S04=s04, S05=s05, S06=s06, S07=s07, S08=s08, S09=s09, S10=s10, S11=s11, S12=s12)
