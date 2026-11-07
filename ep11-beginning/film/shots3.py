"""Shots 25-34: what he said, what it means, and the way back to you."""
import numpy as np

import paper as P
import rig as R
import scenes as C
from core import Shot, Words, chain, dim, drain, move_cam
from paper import DH, DW, GOLD, arc, circle, ellipse, fill, hexc, mass, soft, spline, stroke
from rig import Figure, ease, ease_io, pose
from shots1 import ADAM, EVE, YOU, E, hill_stage, lin
from shots2 import ADAM_F, ADAM_S, EVE_F, EVE_S, call_frame, hide_figs, hide_stage, top_stage


def s25():
    W = Words("S25")
    st = hide_stage(4, gold=True)
    return Shot("S25", st, call_frame(W, "said", "said", dark=True, resume_word="said"))


def s26():
    W = Words("S26")
    st = P.Stage((-160, 300), "#141b2c", "#1c2739", .7, .46, 780, "#cfdcf2", 36)
    C.forest(st, 1500, rich=False)
    st.slot("adam", "subject")
    st.add(P.big_leaves(362, [(-40, 1120, 240, 1340), (560, 1040, 780, 1340)], 6, (80, 130)), "#0e141a", 24, "matte", blur=5, tear=0, band="front")
    st.add(P.big_leaves(363, [(560, -40, 780, 180)], 3, (70, 120)), "#0e141a", 22, "matte", blur=5, tear=0, band="front")

    def frame(t):
        h = E(t, W("How") - .3, W("How") + .5)
        p = R.breathe(pose("bow", torso=12 + 5 * h, neck=12 + 6 * h, head=14 + 6 * h, shrug=.12 + .08 * h, brow=1, lid=1), t, .9, rate=.2)
        return dict(cam=move_cam("push", 5, ease_io(lin(t, -.2, W.dur + .2)), focus=(400, 560)), grade=drain(.35),
                    slots={"adam": [("fig", ADAM_F, 40, 1620, 330, p, dict(arms=False, eyes="shut"))]})
    return Shot("S26", st, frame)


def s27():
    W = Words("S27")
    st = P.Stage((360, 1120), "#10182a", "#1b2740", .78, .32, 620, "#ffd98f", 6)
    C.forest(st, 1046)
    st.contact(258, 1090, 70, 8, .7).contact(474, 1094, 64, 8, .7)
    st.glow(np.exp(-(((P.grids()[0] - 366) / 170) ** 2 + ((P.grids()[1] - 1100) / 30) ** 2))[..., None] * GOLD * .5, "mid")
    st.slot("line", "subject")
    st.slot("pair", "subject")
    C.trees_near(st)
    st.add(mass(170, 360, 1300, 480, 120), "#0a0e15", 22, "matte", tear=5, band="near")

    def frame(t):
        w = W("Where")
        draw = E(t, w - .1, w + 1.0)
        lift = E(t, w + .3, w + 1.6)
        pa = R.breathe(R.mix(pose("hear", head=8, neck=10, shrug=.12), pose("hear"), lift), t, .8, rate=.15)
        pe = R.breathe(pose("brace"), t, .5, rate=.16, phase=1)
        y1 = 640 + (1096 - 640) * draw
        return dict(cam=(362, 760, 1.02), grade=drain(.25),
                    slots={"line": [("draw", (350, 600, 382, 1110), lambda pt: pt.gold(stroke((366, 640), (366, y1), 2.4), 2, 0))] if draw > .01 else [],
                           "pair": [("fig", ADAM_F, 258, 1078, 36, pa, dict(eyes="open" if lift > .4 else "shut")), ("fig", EVE_F, 474, 1082, 33, pe, dict(flip=True, eyes="shut"))]})
    return Shot("S27", st, frame, pre=.5)


def s28():
    W = Words("S28")
    st = top_stage(26)

    def frame(t):
        k = E(t, -.2, W("knew") + .3)
        a1 = 270 + 359 * k
        pe = R.breathe(pose("brace", torso=48, neck=26, head=34, shrug=.22), t, .5)
        pa = R.breathe(pose("brace", torso=48, neck=26, head=34, shrug=.22), t, .5, phase=1)
        return dict(cam=(364, 620, 1.05), grade=drain(.3),
                    slots={"pair": [("fig", EVE_F, 396, 632, 34, pe, dict(eyes="shut")), ("fig", ADAM_F, 332, 636, 37, pa, dict(flip=True, eyes="shut"))],
                           "ring": [("draw", (190, 420, 540, 780), lambda pt: pt.gold(arc(364, 596, 150, 270, a1, 2.4), 2, 0))] if k > .01 else []})
    return Shot("S28", st, frame)


def s29():
    W = Words("S29")
    st = P.Stage((360, -160), "#1c2638", "#1a2333", .62, .46, 680, "#ffd98f", 39)
    C.forest(st, 1500, rich=False)
    st.tag("light", "mid")
    st.glow(soft(360, -60, 300, 420)[..., None] * GOLD * .26)
    st.gold(arc(360, -110, 300, 66, 114, 2.0), 2, 0)
    st.untag()
    st.slot("pair", "subject")

    def frame(t):
        a, wn = W("answer"), W("wanted")
        lift = E(t, a - .3, a + .5)
        light = .25 + .75 * E(t, wn - .3, wn + .7)
        pa = R.breathe(pose("bow", head=12 - 12 * lift, neck=10 - 8 * lift, torso=6, lid=.6 * (1 - lift), brow=.8), t, .6)
        pe = R.breathe(pose("bow", head=14 - 10 * lift, neck=10 - 6 * lift, torso=6, lid=.6 * (1 - lift), brow=.8), t, .6, phase=1)
        return dict(cam=(360, 640, 1.03 + .02 * lin(t, 0, W.dur)), grade=drain(.25 * (1 - light)), fade={"light": light},
                    slots={"pair": [("fig", ADAM_F, 110, 1420, 214, pa, dict(arms=False)), ("fig", EVE_F, 606, 1450, 200, pe, dict(flip=True, arms=False))]})
    return Shot("S29", st, frame, post=.6)


def s30():
    W = Words("S30")
    st = P.Stage((640, 280), "#343446", "#26263a", .64, .62, 560, "#dfe6f2", 40)
    st.add(fill([(452, 150), (668, 150), (668, 620), (452, 620)]), "#8a8ba0", 6, "smooth", tear=1.2, band="far")
    st.add(np.maximum(fill([(556, 150), (564, 150), (564, 620), (556, 620)]), fill([(452, 380), (668, 380), (668, 388), (452, 388)])), "#343446", 3, "smooth", tear=.6, band="far")
    st.add(fill([(440, 620), (680, 620), (690, 640), (430, 640)]), "#2c2c3c", 4, "smooth", tear=.6, band="far")
    st.tag("beam", "mid")
    st.glow(P.gblur(fill(np.array([(452, 620), (668, 620), (420, 1320), (40, 1320)], np.float32)), 14)[..., None] * hexc("#7c7e96") * .22)
    st.glow(P.gblur(fill(np.array([(452, 150), (668, 150), (668, 620), (452, 620)], np.float32)), 30)[..., None] * hexc("#dfe6f2") * .12)
    st.untag()
    st.slot("you", "subject")
    st.slot("hand", "subject")

    def frame(t):
        hd, hm = W("hide"), W("him")
        low = E(t, hd - .3, hd + .5)
        turn = E(t, hm - .3, hm + .6)
        p = R.breathe(pose("open", torso=8 - 4 * turn, neck=4 + 6 * (1 - low) - 6 * turn, head=12 * (1 - low) + 2 - 12 * turn, lid=.5 * (1 - turn), brow=.6 * (1 - turn)), t, .7)
        return dict(cam=(360, 640, 1.03 + .03 * lin(t, 0, W.dur)), fade={"beam": .6 + .4 * turn},
                    slots={"you": [("fig", YOU, 90, 1640, 330, p, dict(arms=False))],
                           "hand": [("draw", (-40, 600, 460, DH + 100), lambda pt: C.hand(pt, 150 + 40 * (1 - low) - 30 * low, 1180 - 360 * (1 - low) + 140 * low, 92, 24 - 40 * (1 - low), YOU.skin, R.MODERN["shirt"], curl=.8, spread=5))]})
    return Shot("S30", st, frame, pre=.6)


def space_stage(seed, earth=(360, 1100), r=34):
    st = P.Stage((360, -200), "#0f1526", "#1a2238", .84, .22, 1000, "#dfe8ff", seed)
    C.stars(st, 900, DH + 60, 4)
    C.stars(st, 60, DH + 60, 5, scale_=1.8)
    st.tag("galaxy", "far")
    C.galaxy(st)
    st.untag()
    st.add(circle(566, 820, 26), "#d9c9a0", 6, "smooth", band="mid")
    C.earth_at(st, earth[0], earth[1], r, band="subject")
    return st


def s31():
    W = Words("S31")
    st = space_stage(11)

    def frame(t):
        u = ease_io(lin(t, -.3, W.dur + .2))
        return dict(cam=(360, 1060 - 420 * u, 1.0 + 1.6 * (1 - u) ** 1.4), xf={"galaxy": dict(rot=-6 * (t + 30), pivot=(360, 430))})
    return Shot("S31", st, frame)


def s32():
    W = Words("S32")
    st = P.Stage((360, -240), "#0f1526", "#141c30", .78, .24, 1100, "#dfe8ff", 42)
    C.stars(st, 420, 640, 21)
    ground, disc = C.big_earth(st, "#1b2438", "#2c3440", 42)
    r = np.random.default_rng(5)
    ys, xs = np.nonzero(ground > .5)
    c = st.cv
    import cv2
    for g in range(4):
        st.tag(f"lights{g}", "mid")
        dots = np.zeros((c.ph, c.pw), np.float32)
        for i in r.choice(len(xs), 150):
            cv2.circle(dots, (int(xs[i]), int(ys[i])), int(r.choice((1, 2, 2, 3)) * P.S * .8), 1.0, -1, cv2.LINE_AA)
        st.gold(dots, 1, 0)
        st.untag()
    C.clouds(st, "#3a4458")

    def frame(t):
        wn = W("wanted")
        return dict(cam=move_cam("push", 20, ease_io(lin(t, -.2, W.dur + .2)), focus=(360, 700)),
                    fade={f"lights{g}": E(t, wn - .4 + g * .3, wn + g * .3 + .2) for g in range(4)})
    return Shot("S32", st, frame)


def s33():
    W = Words("S33")
    st = P.Stage((610, 700), "#3a3448", "#6f5a4c", .68, .6, 620, "#ffd98f", 43)
    st.glow(soft(610, 700, 360, 260)[..., None] * GOLD * .36, "sky")
    st.gold(circle(610, 700, 56), 2, 1, band="far")
    st.add(fill(spline([(-60, 900), (200, 850), (520, 880), (780, 840), (780, 1000), (-60, 1000)])), "#5e4f43", 6, "fiber", tear=5, band="far")
    st.haze("#b98d6a", .25, 780, 980, 4)
    st.add(fill(spline([(-60, DH + 60), (-60, 830), (240, 820), (520, 835), (780, 815), (780, DH + 60)])), "#6a5a4a", 9, "fiber", tear=5, band="mid")
    st.slot("pair", "subject")
    C.grass(st, 1240, n=60, h=(40, 110), color="#3c3129", seed=33, band="near", lift=8)

    def frame(t):
        sl = W("still")
        d = 48 * (t + .4)
        pa, ba = R.walk(pose("stand"), d, 62)
        look = E(t, sl - .3, sl + .5)
        pe, be = R.walk(pose("stand", neck=-2 - 4 * look, head=-8 - 18 * look), d + 40, 58)
        return dict(cam=move_cam("track", 8, ease_io(lin(t, -.2, W.dur + .2)), focus=(380, 760)),
                    slots={"pair": [("fig", ADAM_S, 150 + d, 940 + ba * 62, 62, pa, dict(contact=True)), ("fig", EVE_S, 270 + d, 946 + be * 58, 58, pe, dict(contact=True))]})
    return Shot("S33", st, frame, pre=.5, post=.6)


def s34():
    W = Words("S34")
    st = hill_stage(2, gold=True)
    st.slot("you", "near")
    st.slot("arcs", "near")
    st.add(fill(spline([(-60, DH + 60), (-60, 1190), (200, 1150), (520, 1175), (780, 1140), (780, DH + 60)])), "#0a0d14", 14, "fiber", band="front")

    def frame(t):
        y = W("you")
        o = E(t, y - .3, y + .6)
        p = R.breathe(R.mix(pose("stand", head=-4), pose("hands_out", sh_f=26, el_f=8, sh_b=-22, el_b=8, head=-8), o), t, .6)
        a = E(t, y - .1, y + 1.4)

        def arcs(pt):
            pt.gold(arc(360, 870, 74, 270 - 65 * a, 270 + 65 * a, 2.0), 2, 0)
            if a > .3:
                k = (a - .3) / .7
                pt.gold(arc(360, 870, 118, 270 - 55 * k, 270 + 55 * k, 1.8), 2, 0)
        logo = E(t, W.voice_end + .3, W.voice_end + 1.3)
        return dict(cam=(360, 760 + 20 * ease(lin(t, 0, W.dur)), 1.09 - .05 * ease(lin(t, 0, W.dur))),
                    slots={"you": [("fig", YOU, 360, 906, 17, p, dict(contact=True))], "arcs": [("draw", (220, 720, 500, 900), arcs)] if a > .01 else []},
                    grade=dim(1 - .35 * logo, amt=.06 * logo) if logo > 0 else None)
    return Shot("S34", st, frame, pre=.5)


SHOTS = dict(S25=s25, S26=s26, S27=s27, S28=s28, S29=s29, S30=s30, S31=s31, S32=s32, S33=s33, S34=s34)
