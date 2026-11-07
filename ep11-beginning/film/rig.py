"""The paper puppets, rebuilt for animation from the Cut Paper v2 jointed figure.

Same construction as style_test/build_cut_paper_v2.py: separate paper pieces on joints, profile heads, about seven
heads tall, lit by the shot's key light. What changed for the film:
- each figure is drawn every frame on its own small patch, so it can walk, turn, reach and crouch;
- truer torsos (Adam broad and V-shaped, Eve slighter with a waist), a fuller head of hair in two tones;
- an almond eye with a lid and a brow that can worry (never a dot), and blinks;
- garments: Eve's long hair falls in front before the fall; fig-leaf coverings after Genesis 3:7;
  garments of skins after Genesis 3:21;
- the same skin and hair colours in every scene, so the two of them stay recognisable; the light does the mood.

Units are head heights (u). x points the way the figure faces, y points down. (x, y) places the hips.
"""
import numpy as np

import paper as P
from paper import fill, hexc, spline

# Palette: one cast, every scene -----------------------------------------------------------------------
CAST = {
    "adam": dict(skin="#b07f5b", hair="#2a201a", hair_hi="#4a382b"),
    "eve": dict(skin="#c99d79", hair="#3a2a20", hair_hi="#5c4331"),
    "you": dict(skin="#b48f74", hair="#241e22", hair_hi="#3b3236"),
}
FIG_LEAF = "#4d6247"
SKINS = {"adam": "#6a4a31", "eve": "#7b5940"}
BELT = "#3f2c1c"
MODERN = dict(shirt="#59647a", pants="#363b47", shoes="#25211f")

# Shapes ----------------------------------------------------------------------------------------------
HEAD = np.array([(.24, .62), (.17, .46), (.17, .3), (.26, .14), (.42, .06), (.58, .08), (.69, .19), (.725, .31), (.71, .37), (.755, .45), (.79, .505), (.745, .54), (.735, .575), (.76, .605), (.73, .63), (.75, .655), (.715, .69), (.73, .75), (.67, .79), (.55, .78), (.4, .76), (.3, .7)], np.float32)
HEAD_E = np.array([(.25, .62), (.18, .46), (.18, .3), (.27, .14), (.42, .065), (.58, .085), (.68, .19), (.712, .31), (.70, .37), (.738, .445), (.765, .495), (.727, .53), (.722, .57), (.742, .598), (.716, .622), (.73, .646), (.70, .68), (.705, .728), (.655, .77), (.55, .765), (.41, .75), (.31, .69)], np.float32)
HEAD_PIVOT = np.array([.4, .74], np.float32)
S_HEAD = 1.42
HAIR_A = [(.3, .64), (.2, .56), (.13, .42), (.14, .25), (.24, .09), (.42, .015), (.6, .04), (.72, .16), (.64, .2), (.53, .2), (.47, .3), (.49, .42), (.42, .5), (.38, .6)]
HAIR_A_HI = [(.27, .5), (.2, .4), (.21, .25), (.3, .12), (.44, .06), (.58, .08), (.5, .13), (.38, .2), (.32, .32), (.31, .44)]
BEARD = [(.47, .5), (.55, .585), (.64, .6), (.725, .625), (.755, .7), (.73, .79), (.66, .84), (.56, .83), (.48, .76)]
HAIR_E = [(.64, .14), (.47, .015), (.26, .05), (.14, .22), (.12, .44), (.28, .52), (.42, .42), (.5, .25)]
HAIR_E_HI = [(.55, .1), (.43, .06), (.29, .1), (.2, .24), (.22, .34), (.33, .26), (.45, .17)]
HAIR_E_BACK = [(.46, .02), (.26, .05), (.1, .24), (.05, .55), (.0, 1.0), (-.03, 1.45), (.06, 1.85), (.22, 1.62), (.28, 1.1), (.33, .7), (.42, .4)]
# the lock that falls over her shoulder and down her front, in torso coordinates
HAIR_E_FRONT = [(-.02, -2.32), (.2, -2.3), (.36, -2.08), (.44, -1.7), (.46, -1.25), (.40, -.82), (.30, -.58), (.2, -.62), (.16, -.98), (.12, -1.45), (.04, -1.9)]
CHEEK = [(.5, .52), (.63, .53), (.66, .63), (.55, .69), (.47, .61)]
EAR = [(.40, .38), (.47, .36), (.5, .44), (.47, .53), (.41, .52)]

TORSO_A = [(.30, .16), (.16, .24), (-.06, .24), (-.3, .18), (-.42, -.12), (-.34, -.6), (-.36, -1.2), (-.42, -1.78), (-.34, -2.12), (-.12, -2.32), (.16, -2.3), (.38, -2.1), (.48, -1.74), (.46, -1.34), (.36, -1.0), (.3, -.6), (.33, -.16)]
TORSO_E = [(.24, .16), (.1, .24), (-.1, .24), (-.34, .16), (-.44, -.14), (-.3, -.62), (-.27, -1.15), (-.31, -1.72), (-.25, -2.08), (-.08, -2.26), (.13, -2.24), (.3, -2.06), (.37, -1.74), (.37, -1.4), (.25, -1.06), (.2, -.72), (.27, -.3), (.28, -.06)]
NECK = [(-.14, .12), (-.13, -.34), (.13, -.34), (.16, .12)]
NECK_E = [(-.12, .12), (-.11, -.33), (.11, -.33), (.14, .12)]
UPPER = [(-.17, -.05), (.17, -.05), (.15, .6), (.12, 1.12), (-.11, 1.12), (-.16, .6)]
FORE = [(-.12, -.04), (.12, -.04), (.1, .5), (.075, 1.0), (-.075, 1.0), (-.11, .5)]
HAND = [(-.08, -.02), (.08, -.02), (.12, .16), (.1, .36), (.05, .5), (-.02, .52), (-.08, .4), (-.1, .18)]
THUMB = [(.06, .06), (.17, .16), (.18, .28), (.1, .24)]
THIGH = [(-.26, -.05), (.24, -.05), (.2, .8), (.15, 1.62), (-.14, 1.62), (-.22, .8)]
SHIN = [(-.14, -.04), (.14, -.04), (.16, .5), (.09, 1.5), (-.07, 1.5), (-.14, .5)]
FOOT = [(-.1, -.04), (.1, -.04), (.16, .1), (.62, .16), (.64, .24), (-.1, .24)]
CLOAK = [(-.5, -2.2), (.5, -2.2), (.55, -.7), (.5, .3), (-.5, .3), (-.56, -.7)]
TUNIC_A = [(-.44, -2.2), (.42, -2.22), (.52, -1.7), (.48, -1.2), (.42, -.4), (.44, .2), (-.46, .2), (-.42, -.6), (-.44, -1.4), (-.48, -1.9)]
SKIRT_A = [(-.46, -.1), (.46, -.1), (.52, .7), (.58, 1.5), (-.6, 1.5), (-.52, .7)]
TUNIC_E = [(-.34, -2.14), (.33, -2.16), (.42, -1.72), (.4, -1.3), (.28, -.9), (.3, -.3), (.36, .2), (-.42, .2), (-.36, -.6), (-.32, -1.3), (-.36, -1.86)]
SKIRT_E = [(-.46, -.1), (.42, -.1), (.52, .9), (.66, 2.3), (-.7, 2.3), (-.54, .9)]
SLEEVE = [(-.2, -.12), (.2, -.12), (.2, .42), (-.19, .42)]


def rot(deg):
    a = np.radians(deg)
    return np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]], np.float32)


def move(x, y):
    return np.array([[1, 0, x], [0, 1, y], [0, 0, 1]], np.float32)


def scale(sx, sy=None):
    return np.diag([sx, sx if sy is None else sy, 1]).astype(np.float32)


def apply(mat, pts):
    p = np.array(pts, np.float32).reshape(-1, 2)
    return (mat @ np.c_[p, np.ones(len(p))].T).T[:, :2]


def fig_leaf_pts(s=1.0, a=0.0):
    """A fig leaf: five rounded lobes around a stem, as polygons in local units."""
    polys = []
    for ang, ln in ((-112, 26), (-58, 36), (0, 46), (58, 36), (112, 26)):
        r = np.radians(a + ang - 90)
        cx, cy = np.cos(r) * ln * s * .62, np.sin(r) * ln * s * .62
        polys.append(P.ellipse(cx, cy, ln * s * .62, ln * s * .3, a + ang, n=24))
    polys.append(P.ellipse(0, 0, 16 * s, 16 * s, n=20))
    return polys


# Poses -----------------------------------------------------------------------------------------------
BASE = dict(torso=2, neck=0, head=0, sh_f=8, el_f=10, wr_f=0, sh_b=-6, el_b=8, wr_b=0, hip_f=4, kn_f=2, hip_b=-4, kn_b=2, shrug=0,
            lock=0, brow=0, lid=0)
POSES = {
    "open": {},
    "stand": dict(torso=3, sh_f=4, el_f=12, sh_b=-6, el_b=8),
    "offer": dict(torso=5, neck=3, head=6, sh_f=56, el_f=34, wr_f=-10, sh_b=-8, el_b=10, hip_f=3, hip_b=-3),
    "take": dict(torso=-2, neck=3, head=7, sh_f=48, el_f=42, sh_b=-6, el_b=6, hip_f=2, hip_b=-2),
    "reach_up": dict(torso=-4, neck=-8, head=-14, sh_f=150, el_f=12, sh_b=-10, el_b=12),
    "look_up": dict(torso=-2, neck=-5, head=-12, sh_f=6, el_f=14, sh_b=-6, el_b=10),
    "eat": dict(torso=4, neck=4, head=2, sh_f=34, el_f=118, wr_f=-20, sh_b=-6, el_b=10),
    "shame": dict(torso=13, neck=14, head=20, sh_f=6, el_f=126, sh_b=2, el_b=112, hip_f=6, kn_f=6, hip_b=-4, kn_b=4, shrug=.1, brow=1, lid=.6),
    "brace": dict(torso=34, neck=16, head=24, sh_f=37, el_f=22, wr_f=10, sh_b=31, el_b=26, hip_f=132, kn_f=150, hip_b=122, kn_b=148, shrug=.16, brow=1),
    "release": dict(torso=28, neck=12, head=16, sh_f=31, el_f=22, wr_f=8, sh_b=25, el_b=26, hip_f=132, kn_f=150, hip_b=122, kn_b=148, shrug=.07, brow=.6),
    "hear": dict(torso=18, neck=2, head=-8, sh_f=22, el_f=24, wr_f=6, sh_b=16, el_b=26, hip_f=132, kn_f=150, hip_b=122, kn_b=148, brow=.3),
    "turned": dict(torso=24, neck=4, head=-2, sh_f=27, el_f=22, wr_f=8, sh_b=21, el_b=26, hip_f=132, kn_f=150, hip_b=122, kn_b=148, shrug=.1, brow=.8),
    "bow": dict(torso=12, neck=12, head=14, shrug=.12, sh_f=4, el_f=16, sh_b=-4, el_b=12, brow=1, lid=.8),
    "lift": dict(torso=4, neck=0, head=-4, sh_f=4, el_f=14, sh_b=-4, el_b=12, brow=.4),
    "hands_out": dict(torso=2, sh_f=32, el_f=10, wr_f=-12, sh_b=-26, el_b=12, head=-8),
    "kneel": dict(torso=8, neck=8, head=10, sh_f=10, el_f=40, sh_b=4, el_b=34, hip_f=86, kn_f=96, hip_b=2, kn_b=96, brow=.7),
}
for k, v in POSES.items():
    POSES[k] = dict(BASE, **v)


def pose(name, **over):
    return dict(POSES[name], **over)


def ease(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def ease_io(t):
    t = np.clip(t, 0, 1)
    return .5 - .5 * np.cos(np.pi * t)


def mix(a, b, t):
    out = dict(a)
    for k in set(a) | set(b):
        out[k] = a.get(k, 0) * (1 - t) + b.get(k, 0) * t
    return out


def keys(t, ks, curve=ease_io):
    """ks = [(time, pose_or_value), ...] sorted; blends between neighbours with an ease."""
    if t <= ks[0][0]:
        return ks[0][1]
    for (t0, a), (t1, b) in zip(ks[:-1], ks[1:]):
        if t <= t1:
            u = curve((t - t0) / max(t1 - t0, 1e-6))
            if isinstance(a, dict):
                return mix(a, b, u)
            return np.asarray(a, np.float32) * (1 - u) + np.asarray(b, np.float32) * u
    return ks[-1][1]


def breathe(p, t, amt=1.0, rate=.23, phase=0.0):
    """A slow breath: shoulders rise, the torso straightens a little."""
    b = np.sin(2 * np.pi * rate * t + phase)
    q = dict(p)
    q["shrug"] = q.get("shrug", 0) + .025 * amt * b
    q["torso"] = q.get("torso", 0) - .8 * amt * b
    q["head"] = q.get("head", 0) + .5 * amt * np.sin(2 * np.pi * rate * .5 * t + phase)
    return q


def walk(p, dist, u, amp=22, arms=18):
    """A walk cycle driven by distance travelled (so feet don't skate). Returns (pose, bob in head units)."""
    ph = 2 * np.pi * dist / (4.4 * u)
    s = np.sin(ph)
    q = dict(p)
    q.update(hip_f=amp * s, hip_b=-amp * s, kn_f=4 + 30 * max(0, np.sin(ph - 1.3)), kn_b=4 + 30 * max(0, np.sin(ph + np.pi - 1.3)),
             sh_f=-arms * s, el_f=14 + 8 * max(0, -s), sh_b=arms * s, el_b=14 + 8 * max(0, s), torso=p.get("torso", 0) + 3)
    return q, -.06 * abs(np.cos(ph))


def blink(t, every=3.7, seed=0, dur=.12):
    r = (t + seed * 1.37) % every
    return r < dur


# Drawing ---------------------------------------------------------------------------------------------

class Figure:
    def __init__(self, kind="adam", garment=None, cloak=None, tone=1.0, eyes="open", lift=None, seed=0, hair_front=None):
        self.kind, self.garment, self.cloak, self.tone, self.eyes, self.lift, self.seed = kind, garment, cloak, tone, eyes, lift, seed
        c = CAST["adam" if kind == "adam" else "eve" if kind == "eve" else "you"]
        self.skin, self.hair, self.hair_hi = c["skin"], c["hair"], c["hair_hi"]
        self.hair_front = (kind == "eve" and garment is None) if hair_front is None else hair_front


def box(x, y, u, margin=1.0):
    """The patch box for a figure placed at (x, y), in design units."""
    return x - 3.6 * u * margin, y - 7.9 * u * margin, 7.2 * u * margin, 12.0 * u * margin


NOW = [0.0]   # the shot's current time, set by the compositor, so open eyes blink on their own


def build(f, x, y, u, p, flip=False, sx=1.0, eyes=None, arms=True):
    """Pose the figure: returns a list of paper pieces (polygons in design units) in drawing order."""
    p = dict(BASE, **p)
    lift = f.lift if f.lift is not None else max(1.2, u * .03)
    eyes = eyes or f.eyes
    if eyes == "open" and blink(NOW[0], every=3.3 + .7 * (f.seed % 3), seed=f.seed * 1.9, dur=.11):
        eyes = "shut"
    fl = -1.0 if flip else 1.0
    world = move(x, y) @ scale(fl * sx, 1) @ scale(u)
    eve = f.kind == "eve"
    width = .94 if eve else 1.0
    torso = world @ rot(p["torso"])
    shoulder = torso @ move(0, -2.02 - p.get("shrug", 0))
    neck = torso @ move(.03, -2.17 if eve else -2.24) @ rot(p["neck"])
    head = neck @ move(0, -.3) @ rot(p["head"])
    hm = head @ scale(S_HEAD) @ move(-HEAD_PIVOT[0], -HEAD_PIVOT[1])
    tilt = p["torso"] + p["neck"] + p["head"]
    ops = []

    def op(polys, color, tex="smooth", tone=1.0, l=None, kind="sheet", w=0):
        ops.append(dict(polys=polys, color=color, tex=tex, tone=tone, lift=lift if l is None else l, kind=kind, w=w))

    def sp(pts, mat, sc=1.0, n=8):
        return apply(mat @ scale(sc, 1), spline(pts, n=n))

    skin, hair = f.skin, f.hair
    sk = SKINS["eve" if eve else "adam"]

    def arm(ang, bend, wr, t, front):
        up = shoulder @ move(.02 if front else -.03, 0) @ rot(-ang)
        fo = up @ move(0, 1.08) @ rot(-bend)
        ha = fo @ move(0, .96) @ rot(-bend * .15 - wr)
        if f.garment == "modern":
            op([sp(HAND, ha), sp(THUMB, ha)], skin, tone=t)
            op([sp(UPPER, up, 1.12), sp(FORE, fo, 1.08)], MODERN["shirt"], "fiber", t)
            return ha
        op([sp(UPPER, up), sp(FORE, fo), sp(HAND, ha), sp(THUMB, ha)], skin, tone=t)
        if f.garment == "skins":
            op([sp(SLEEVE, up)], sk, "fiber", t * .96, lift * .6)
        if f.cloak:
            op([sp(UPPER, up, 1.14), sp(FORE, fo, 1.1)], f.cloak, "matte", t)
        return ha

    def leg(ang, bend, t):
        th = world @ rot(-ang)
        sh = th @ move(0, 1.58) @ rot(bend)
        fo = sh @ move(0, 1.46) @ rot(-bend + ang)
        if f.garment == "modern":
            op([sp(THIGH, th, 1.08), sp(SHIN, sh, 1.08)], MODERN["pants"], "fiber", t)
            op([sp(FOOT, fo, 1.1)], MODERN["shoes"], "smooth", t)
            return
        op([sp(THIGH, th), sp(SHIN, sh), sp(FOOT, fo)], skin, tone=t)

    if eve:
        crown = apply(hm, [(.36, .12)])[0]
        sgn = fl * (1.0 if sx >= 0 else -1.0)
        hang = move(*crown) @ rot(-tilt * .8 * sgn + p.get("lock", 0) * 5) @ move(*-crown)
        op([apply(hang @ hm, spline(HAIR_E_BACK, n=8))], hair, "matte", .92)
    if arms:
        arm(p["sh_b"], p["el_b"], p.get("wr_b", 0), .84, False)
    leg(p["hip_b"], p["kn_b"], .84)
    op([sp(TORSO_E if eve else TORSO_A, torso, width)], skin, l=lift + .6)
    if f.cloak:
        op([sp(CLOAK, torso, width)], f.cloak, "matte", 1.0, lift + .6)
    if f.garment == "modern":
        op([sp(TORSO_A, torso, 1.07)], MODERN["shirt"], "fiber", 1.0, lift + .6)
    if f.garment == "skins":
        op([sp(TUNIC_E if eve else TUNIC_A, torso, width)], sk, "fiber", 1.0, lift + .6)
    leg(p["hip_f"], p["kn_f"], 1.0)
    if f.garment == "skins":
        sit = p["hip_f"] > 60
        skirt = world @ rot(-(p["hip_f"] + p["hip_b"]) * .45 if not sit else -55)
        sh_ = SKIRT_E if eve else SKIRT_A
        hem = [(px_, py_ + (.06 if i % 2 else 0)) for i, (px_, py_) in enumerate(sh_)]
        op([sp(hem, skirt, n=4)], sk, "fiber", .97, lift * .8)
        op([sp([(-.42, -.1), (.42, -.12), (.42, .02), (-.42, .04)], torso @ move(0, -.6), width, n=3)], BELT, "smooth", 1.0, lift * .4)
    if f.garment == "fig":
        leaves = []
        spots = ((-.24, -.08, -30), (.0, .0, 0), (.24, -.08, 30), (-.1, .24, -12), (.14, .26, 14)) if not eve else \
            ((-.14, -1.8, -20), (.14, -1.84, 18), (-.12, -1.36, -8), (.16, -1.4, 10), (-.1, -.8, -14), (.14, -.82, 12), (-.22, -.18, -26), (.04, -.08, 0), (.24, -.18, 26), (-.08, .22, -10), (.14, .24, 12))
        frame0 = torso if eve else world @ rot(p["torso"] * .5)
        for lx, ly, la in spots:
            for poly in fig_leaf_pts(.0085 if eve else .0095, la + 180):
                leaves.append(apply(frame0 @ move(lx, ly), poly))
        op(leaves, FIG_LEAF, "matte", 1.0, lift * .8)
    op([sp(NECK_E if eve else NECK, neck)], skin, tone=.9)
    if not eve:
        op([apply(hm, spline(EAR, n=6))], skin, tone=.95)
    op([apply(hm, spline(HEAD_E if eve else HEAD, n=8))], skin, l=lift + .6)
    op([apply(hm, spline(CHEEK, n=6))], "#c08a70" if eve else "#a4704f", tone=1.0, kind="soft")
    if eve:
        op([apply(hm, spline(HAIR_E, n=8))], hair, "matte")
    else:
        op([apply(hm, spline(HAIR_A, n=8))], hair, "matte")
        if f.kind == "adam":
            op([apply(hm, spline(BEARD, n=8))], hair, "matte")
    lid, brow = p.get("lid", 0), p.get("brow", 0)
    w = max(.9, u * .016)
    if eyes == "shut" or lid > .85:
        op([apply(hm, [(.61, .37), (.655, .385), (.70, .37)])], "#17120f", kind="line", w=w)
    else:
        top = .352 + lid * .022
        op([apply(hm, spline([(.612, .371), (.64, top + .004), (.676, top), (.703, .362), (.70, .375), (.66, .384)], n=5))], "#1a1410", kind="flat")
        op([apply(hm, [(.607, .369), (.64, top - .004), (.68, top - .007), (.707, .36)])], "#120d0a", kind="line", w=w * .9)
        if eve:
            op([apply(hm, [(.612, .369), (.596, .358)])], "#120d0a", kind="line", w=w * .7)
    op([apply(hm, [(.598, .331 + .006 * brow), (.66, .319 - .008 * brow), (.716, .331 - .02 * brow)])], hair, kind="line", w=max(.9, u * (.017 if eve else .024)))
    if f.hair_front:
        sh0 = apply(torso, [(.1, -2.25)])[0]
        sgn = fl * (1.0 if sx >= 0 else -1.0)
        lock = move(*sh0) @ rot(-p["torso"] * .7 * sgn + p.get("lock", 0) * 4) @ move(*-sh0) @ torso
        op([sp(HAIR_E_FRONT, lock, width)], hair, "matte", .97, lift * .8)
    hand = None
    if arms:
        hand = arm(p["sh_f"], p["el_f"], p.get("wr_f", 0), 1.0, True)
    else:
        # close-ups: the shoulder and upper arm still fill the silhouette; the hand is drawn by the shot
        up = shoulder @ move(.02, 0) @ rot(-p["sh_f"] * .3)
        cover = MODERN["shirt"] if f.garment == "modern" else (SKINS["eve" if eve else "adam"] if f.garment == "skins" else f.cloak)
        op([sp(UPPER, up, 1.05)], skin)
        if cover:
            op([sp(UPPER, up, 1.16 if f.garment == "modern" else 1.0) if f.garment == "modern" else sp(SLEEVE, up)], cover, "fiber", 1.0, lift * .6)
    info = dict(head=apply(hm, [(.5, .4)])[0], hand=apply(hand, [(0, .3)])[0] if hand is not None else None,
                eye=apply(hm, [(.66, .37)])[0])
    return ops, info


def bounds(ops, pad):
    pts = np.concatenate([np.concatenate(o["polys"]) for o in ops])
    return pts.min(0) - pad, pts.max(0) + pad


def render(st, ops, band="subject", tseed=0):
    for o in ops:
        k = o["kind"]
        if k == "line":
            st.add(P.polyline(o["polys"][0], o["w"]), o["color"], 0, "none", 0, 0, band, 0, flat=True)
        elif k == "flat":
            st.add(fill(*o["polys"]), o["color"], 0, "none", 0, 0, band, 0, flat=True)
        elif k == "soft":
            m = P.gblur(fill(*o["polys"]), 1.5) * .28
            st.paint(m, o["color"], band)
        else:
            st.add(fill(*o["polys"]), o["color"], o["lift"], o["tex"], 0, 0, band, .36, o["tone"], tseed=tseed)


def st_u(o):
    return 0


def draw(st, f, x, y, u, p, band="subject", contact=None, **kw):
    ops, info = build(f, x, y, u, p, **kw)
    if contact:
        st.contact(x, y + 3.05 * u if contact is True else contact, u * 1.1, u * .16, .5)
    render(st, ops, band, tseed=f.seed * 31 + 7)
    return info


def figure_patch(shot_st, f, x, y, u, p, key=0, clip=None, contact=None, **kw):
    """Draw one figure on its own tight patch. Returns (PM, G, (x0, y0), info) or None when it is off screen."""
    ops, info = build(f, x, y, u, p, **kw)
    lift = f.lift if f.lift is not None else max(1.2, u * .03)
    lo, hi = bounds(ops, lift * 2.2 + 4 + u * .05)
    if contact:
        cy = y + 3.05 * u if contact is True else contact
        lo = np.minimum(lo, [x - u * 1.6, cy - u * .4])
        hi = np.maximum(hi, [x + u * 1.6, cy + u * .4])
    x0, y0 = lo
    x1, y1 = hi
    clip = clip or (-140, -140, P.DW + 140, P.DH + 140)      # never draw what the camera can't see
    x0, y0, x1, y1 = max(x0, clip[0]), max(y0, clip[1]), min(x1, clip[2]), min(y1, clip[3])
    if x1 - x0 < 2 or y1 - y0 < 2:
        return None
    # snap the box so it only changes size in steps (keeps the texture cache warm)
    q = max(8.0, u * .5)
    x0, y0 = np.floor(x0 / q) * q, np.floor(y0 / q) * q
    x1, y1 = np.ceil(x1 / q) * q, np.ceil(y1 / q) * q
    pt = P.Patch(shot_st, x0, y0, x1 - x0, y1 - y0)
    # the paper texture rides with the hips, so a walking figure never swims through its own grain
    pt.cv.nx0, pt.cv.ny0 = 60 + 130 * key + (x0 - x), 600 + (y0 - y)
    with P.on(pt.cv):
        if contact:
            pt.contact(x, y + 3.05 * u if contact is True else contact, u * 1.1, u * .16, .5)
        render(pt, ops, tseed=f.seed * 31 + 7 + key)
    PM, G = pt.result()
    return PM, G, (pt.cv.x0, pt.cv.y0), info
