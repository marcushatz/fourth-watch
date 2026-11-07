"""The storyboard cast: Adam, Eve and the young man today, all on the same CC0 MakeHuman body system as Eden v2, with the
same stylized faces (larger head and eyes, cleaner features). One pose per frame.

Each pose bakes to /home/claude/fw-tools/assets/vi_sb_<pose>_<part>.npz.   python sb_cast.py <pose> [<pose> ...] | all
Rig space: cm, x = the figure's right, y = forward, z = up. Rot about X negative bends forward; about Z positive turns to
the figure's left.
"""
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
E2 = HERE.parent / "src" / "eden_v2"
sys.path.insert(0, str(E2))
sys.path.insert(0, str(E2.parent))
sys.path.insert(0, str(HERE.parents[1] / "visual_style_exploration" / "src"))
from cast_e2 import ADAM_FACE, EVE_FACE, beard_short, head_turn, stylize  # noqa: E402
from cast import brows, hair_adam, hair_eve, joint_at, reach, scalp  # noqa: E402
from cast_vi import bake, bone_w, hair_short, leg, outfit_eden, outfit_modern, posed_shell, shell, sit_legs  # noqa: E402
from human import Human, curl_hand  # noqa: E402

X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
A = Path("/home/claude/fw-tools/assets")

FEAR = {"eyebrows-left-inner-up": 1.0, "eyebrows-right-inner-up": 1.0, "eyebrows-left-up": .3, "eyebrows-right-up": .3,
        "eye-left-opened-up": 1.0, "eye-right-opened-up": 1.0, "mouth-open": .16, "mouth-retraction": .2}
CALM = {"eye-left-opened-up": .35, "eye-right-opened-up": .35, "mouth-compression": .05}
WONDER = {"eyebrows-left-up": .45, "eyebrows-right-up": .45, "eye-left-opened-up": .7, "eye-right-opened-up": .7, "mouth-open": .08}
DOUBT = {"eyebrows-left-inner-up": .65, "eyebrows-right-inner-up": .65, "eye-left-opened-up": .2, "eye-right-opened-up": .2,
         "mouth-open": .05}
LURED = {"eyebrows-left-up": .25, "eyebrows-right-up": .25, "eye-left-slit": .15, "eye-right-slit": .15, "mouth-open": .06}
SHAME = {"eyebrows-left-inner-up": .9, "eyebrows-right-inner-up": .9, "eye-left-closure": .45, "eye-right-closure": .45,
         "mouth-compression": .4, "mouth-depression": .25}
MOVED = {"eyebrows-left-inner-up": .65, "eyebrows-right-inner-up": .65, "eye-left-opened-up": .55, "eye-right-opened-up": .55,
         "mouth-open": .05}
LOST = {"eyebrows-left-inner-up": .55, "eyebrows-right-inner-up": .55, "eye-left-slit": .3, "eye-right-slit": .3, "mouth-compression": .25}
OPEN = {"eyebrows-left-up": .2, "eyebrows-right-up": .2, "eye-left-opened-up": .45, "eye-right-opened-up": .45, "mouth-open": .03}


def adam_h(expr):
    h = Human(False, race=(.45, .3, .25), muscle=.78, weight=.26, older=.32, expr=dict(expr, **{"neck-platysma": .2}), extra=ADAM_FACE)
    return stylize(h, head=1.04, eyes=1.17, jaw=1.08)


def eve_h(expr):
    h = Human(True, race=(.45, .3, .25), muscle=.42, weight=.36, expr=expr, extra=EVE_FACE)
    return stylize(h, head=1.08, eyes=1.2, jaw=.96, neck=.94)


def man_h(expr):
    h = Human(False, race=(.42, .33, .25), muscle=.45, weight=.4, expr=expr,
              extra={"chin/chin-width-incr.target": .25, "cheek/l-cheek-bones-incr.target": .2, "cheek/r-cheek-bones-incr.target": .2})
    return stylize(h, head=1.05, eyes=1.16, jaw=1.03)


def drape(h, rest, faces, keep_v, t_min=2.4, iters=40):
    """Smooth a shell so it hangs like a loose garment instead of following the body, then keep it outside the body."""
    from human import vertex_normals
    n = vertex_normals(h.v, h.body)
    used = np.unique(faces)
    nb = [[] for _ in range(len(rest))]
    for f in faces:
        for i in range(4):
            nb[f[i]] += [f[(i + 1) % 4], f[(i + 3) % 4]]
    v = rest.copy()
    idx = [i for i in used if nb[i]]
    nbs = [np.array(nb[i]) for i in idx]
    for _ in range(iters):
        nv = v.copy()
        for i, b in zip(idx, nbs):
            nv[i] = v[i] * .4 + v[b].mean(0) * .6
        v = nv
        d = ((v - h.v) * n).sum(1)
        low = d < t_min
        v[low] += n[low] * (t_min - d[low])[:, None]
    return v


def bake_tunic(h, ops, name, female):
    """Garments of skin (Genesis 3:21) as a loose wrap: per height slice and angle, the body's furthest extent plus room,
    smoothed, so it hangs from under the arms to the knee as one garment and never follows the body's shape. A strap
    crosses one shoulder."""
    from scipy.ndimage import gaussian_filter, gaussian_filter1d
    v = h.posed
    arms = bone_w(h, ("upperarm", "lowerarm", "wrist", "finger", "metacarpal", "clavicle", "shoulder")) > .25
    head = bone_w(h, ("head", "neck", "jaw", "eye")) > .2
    body = v[~arms & ~head]
    top = joint_at(h, "upperarm01.L")[2] + (1.5 if female else -6)
    hem = joint_at(h, "lowerleg01.L")[2] + 6
    K, J = 34, 48
    zs = np.linspace(top, hem, K)
    slant = None
    th = np.linspace(-np.pi, np.pi, J, endpoint=False)
    cen = np.array([body[np.abs(body[:, 2] - z) < 4][:, :2].mean(0) if (np.abs(body[:, 2] - z) < 4).sum() > 10 else np.array([0, 0.]) for z in zs])
    cen = gaussian_filter1d(cen, 3, axis=0, mode="nearest")
    R = np.zeros((K, J))
    for k, z in enumerate(zs):
        sl = body[np.abs(body[:, 2] - z) < 3.5][:, :2] - cen[k]
        if len(sl) == 0:
            continue
        a = np.arctan2(sl[:, 1], sl[:, 0])
        rr = np.linalg.norm(sl, axis=1)
        for j in range(J):
            d = np.abs(np.angle(np.exp(1j * (a - th[j]))))
            m = d < .35
            R[k, j] = rr[m].max() if m.any() else 0
    R = np.maximum(R, gaussian_filter(R, (1.5, 2), mode=("nearest", "wrap")))
    R = gaussian_filter(R, (2.2, 2.5), mode=("nearest", "wrap")) + (3.2 if female else 2.6)
    waist = int(K * .45)
    for k in range(waist + 1, K):                      # below the waist the skirt only widens, so the legs stay inside
        R[k] = np.maximum(R[k], R[k - 1] + .25)
    rng = np.random.default_rng(5)
    hemw = 1.6 * np.abs(np.sin(th * 7)) + rng.normal(0, .5, J)
    V = []
    for k, z in enumerate(zs):
        zz = z - (hemw if k == K - 1 else 0)
        V.append(np.c_[cen[k, 0] + R[k] * np.cos(th), cen[k, 1] + R[k] * np.sin(th), np.full(J, 0) + zz])
    V = np.vstack(V)
    F = [[k * J + j, k * J + (j + 1) % J, (k + 1) * J + (j + 1) % J, (k + 1) * J + j] for k in range(K - 1) for j in range(J)]
    # One strap over the left shoulder, front to back.
    sh = joint_at(h, "upperarm01.L") + [4, 0, 0]
    k0 = 0
    jf, jb = int(np.argmin(np.abs(th - np.pi / 2))), int(np.argmin(np.abs(th + np.pi / 2)))
    pf = np.array([cen[k0, 0] - 6, cen[k0, 1] + R[k0, jf] * .9, zs[k0] - 1])
    pb = np.array([cen[k0, 0] - 6, cen[k0, 1] - R[k0, jb] * .9, zs[k0] - 1])
    sv = h.posed[np.argmin(np.linalg.norm(h.posed - sh, axis=1))]
    pts = np.array([pf + (sv + [0, 0, 3] - pf) * t for t in np.linspace(0, 1, 8)] + [sv + [0, 0, 3] + (pb - sv - [0, 0, 3]) * t for t in np.linspace(0, 1, 8)[1:]])
    import sys as _s
    _s.path.insert(0, str(HERE.parent / "src" / "eden_v2"))
    import plants_e2 as pl
    sv_, sf_ = pl.tube(pts, 2.2, 2.2, 6)
    sv_[:, 0] = pts[np.clip(np.arange(len(sv_)) // 6, 0, len(pts) - 1), 0] + (sv_[:, 0] - pts[np.clip(np.arange(len(sv_)) // 6, 0, len(pts) - 1), 0]) * .5
    V = np.vstack([V, sv_])
    F = np.vstack([np.array(F), sf_ + len(V) - len(sv_)])
    # A belt of twisted hide at the waist.
    kw = int(K * .4)
    ring = np.c_[cen[kw, 0] + (R[kw] + .8) * np.cos(th), cen[kw, 1] + (R[kw] + .8) * np.sin(th), np.full(J, zs[kw])]
    bv, bf = pl.tube(np.vstack([ring, ring[:1]]), 1.3, 1.3, 6)
    F = np.vstack([F, bf + len(V)])
    V = np.vstack([V, bv])
    np.savez_compressed(A / f"vi_{name}_tunic.npz", v=V.astype(np.float32), f=F.astype(np.int32))


def outfit_skins(h, female):
    """Garments of skin (Genesis 3:21): a sleeveless tunic from the shoulders to the knee, belted, with a wrap over one shoulder."""
    z = h.v[:, 2]
    knee = h.head_of("lowerleg01.L")[2]
    hands = bone_w(h, ("wrist", "finger", "metacarpal")) > .2
    head = bone_w(h, ("head", "neck02", "neck03", "jaw", "eye", "oculi", "lolid", "uplid", "levator", "oris", "risorius", "temporalis",
                      "special", "orbicularis", "cheek", "nose", "brow", "tongue")) > .3
    arms = bone_w(h, ("upperarm", "lowerarm")) > .55
    lowarm = bone_w(h, ("lowerarm",)) > .3
    ang = np.arctan2(h.v[:, 0], h.v[:, 1])
    hem = knee + 9 + 3 * np.sin(ang * 3) + 1.5 * np.sin(ang * 7)
    shin = bone_w(h, ("lowerleg", "foot", "toe")) > .3
    body = (~hands) & (~head) & (~lowarm) & (~shin) & (z > hem) & ~(arms & (z < h.head_of("upperarm01.L")[2] - 8))
    return {"tunic": (body, 3.2, 14)}                          # seed < 21: no fig leaves sewn onto it; draped in bake_tunic


# ------------------------------------------------------------------ the young man

def man_sit():
    """F1. Alone on a rock on a hill at night, forearms on his knees, hands loosely together, looking out. Small, still."""
    h = man_h(LOST)
    ops = sit_legs({})
    for b in ("spine01", "spine02", "spine03", "spine04", "spine05"):
        ops[b] = ("rot", X, -6)
    head_turn(ops, -8, pitch=4, roll=2)
    h.pose(ops)
    kL, kR = joint_at(h, "lowerleg01.L"), joint_at(h, "lowerleg01.R")
    reach(h, ops, "L", (kL + kR) / 2 + [-4.5, 9, -2], (-1, -.2, -.6))
    reach(h, ops, "R", (kL + kR) / 2 + [4.5, 9.5, -1], (1, -.2, -.6))
    ops["wrist.L"] = ("aim", (.5, .6, -.6))
    ops["wrist.R"] = ("aim", (-.5, .6, -.6))
    curl_hand(ops, h, "L", [(22, 34, 20)] * 4, thumb=(8, 10, 8))
    curl_hand(ops, h, "R", [(26, 38, 22)] * 4, thumb=(8, 10, 8))
    return bake(h, ops, "sb_man_sit", {"hair": hair_short, "scalp": scalp, "brow": brows}, outfit_modern(h)), h


def man_open():
    """F10. The same rock at dawn: upright, his hands resting open on his knees, palms up, face lifted to the light."""
    h = man_h(OPEN)
    ops = sit_legs({})
    for b in ("spine01", "spine02", "spine03", "spine04", "spine05"):
        ops[b] = ("rot", X, -1)
    head_turn(ops, -6, pitch=13, roll=0)
    h.pose(ops)
    kL, kR = joint_at(h, "lowerleg01.L"), joint_at(h, "lowerleg01.R")
    reach(h, ops, "L", kL + [-17, -8, 12], (-1, -.4, -.4))      # hands open and a little away from him, receiving
    reach(h, ops, "R", kR + [17, -8, 12], (1, -.4, -.4))
    ops["wrist.L"] = [("aim", (-.15, 1, .05))]
    ops["wrist.R"] = [("aim", (.15, 1, .05))]
    h.pose(ops)
    for side, deg in (("L", 80), ("R", -80)):                   # turn the forearms so the palms face up
        d = joint_at(h, f"wrist.{side}") - joint_at(h, f"lowerarm02.{side}")
        ops[f"lowerarm02.{side}"] = ("rot", d / np.linalg.norm(d), deg)
    curl_hand(ops, h, "L", [(8, 12, 6)] * 4, thumb=(2, 4, 2))
    curl_hand(ops, h, "R", [(8, 12, 6)] * 4, thumb=(2, 4, 2))
    return bake(h, ops, "sb_man_open", {"hair": hair_short, "scalp": scalp, "brow": brows}, outfit_modern(h)), h


# ------------------------------------------------------------------ Adam and Eve

def walk_legs(ops, front):
    """Mid-stride: one leg forward with the heel down, the other pushing off behind."""
    f, b = ("L", "R") if front == "L" else ("R", "L")
    s = -1 if f == "L" else 1
    leg(ops, f, (s * .05, .34, -.94), (s * .02, .06, -1), (s * .05, 1, .12))
    leg(ops, b, (-s * .03, -.3, -.95), (-s * .02, -.55, -.83), (-s * .03, .7, -.7))
    return ops


def adam_walk():
    """F2. Walking beside Eve through the new garden, away from us, his left hand in hers."""
    h = adam_h(CALM)
    ops = walk_legs({}, "R")
    ops["spine02"] = ("rot", Z, 4)
    ops["spine04"] = ("rot", Z, 6)
    head_turn(ops, 22, pitch=4)
    h.pose(ops)
    sh = joint_at(h, "upperarm01.L")
    reach(h, ops, "L", sh + [-12, 6, -56], (-.6, -.3, .2))
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [6, -14, -52], (.5, .4, .3))
    curl_hand(ops, h, "L", [(24, 30, 18)] * 4, thumb=(10, 14, 8))
    curl_hand(ops, h, "R", [(14, 20, 12)] * 4, thumb=(6, 8, 6))
    return bake(h, ops, "sb_adam_walk", {"hair": hair_adam, "scalp": scalp, "beard": beard_short, "brow": brows}, {}), h


def eve_walk():
    h = eve_h(CALM)
    ops = walk_legs({}, "L")
    ops["spine04"] = ("rot", Z, -6)
    head_turn(ops, -20, pitch=6, roll=3)
    h.pose(ops)
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [12, 6, -52], (.6, -.3, .2))
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-6, -12, -48], (-.5, .4, .3))
    curl_hand(ops, h, "R", [(24, 30, 18)] * 4, thumb=(10, 14, 8))
    curl_hand(ops, h, "L", [(14, 20, 12)] * 4, thumb=(6, 8, 6))
    return bake(h, ops, "sb_eve_walk", {"hair": hair_eve, "scalp": scalp, "brow": brows}, {}), h


def adam_up():
    """F3. Standing before the one tree, looking up at it."""
    h = adam_h(WONDER)
    ops = {}
    leg(ops, "L", (-.06, 0, -1), (-.04, -.04, -1), (-.08, 1, -.2))
    leg(ops, "R", (.08, .05, -1), (.05, 0, -1), (.1, 1, -.2))
    for b in ("spine04", "spine05"):
        ops[b] = ("rot", X, 4)
    head_turn(ops, 8, pitch=34)
    h.pose(ops)
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-8, 4, -54], (-.6, -.4, 0))
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [8, 3, -55], (.6, -.4, 0))
    curl_hand(ops, h, "L", [(14, 20, 12)] * 4, thumb=(6, 8, 6))
    curl_hand(ops, h, "R", [(14, 20, 12)] * 4, thumb=(6, 8, 6))
    return bake(h, ops, "sb_adam_up", {"hair": hair_adam, "scalp": scalp, "beard": beard_short, "brow": brows}, {}), h


def eve_up():
    h = eve_h(WONDER)
    ops = {}
    leg(ops, "L", (-.05, .04, -1), (-.03, 0, -1), (-.08, 1, -.2))
    leg(ops, "R", (.06, -.03, -1), (.04, -.06, -1), (.1, 1, -.2))
    for b in ("spine04", "spine05"):
        ops[b] = ("rot", X, 3)
    head_turn(ops, -10, pitch=30, roll=-4)
    h.pose(ops)
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-9, 8, -50], (-.6, -.4, 0))
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [-6, 14, -30], (.4, -.6, -.4))
    curl_hand(ops, h, "L", [(14, 20, 12)] * 4, thumb=(6, 8, 6))
    curl_hand(ops, h, "R", [(30, 40, 24)] * 4, thumb=(10, 12, 8))
    return bake(h, ops, "sb_eve_up", {"hair": hair_eve, "scalp": scalp, "brow": brows}, {}), h


def eve_reach():
    """F4. Eve before the fruit, her hand rising toward it, held by what she has just been told."""
    h = eve_h(LURED)
    ops = {}
    leg(ops, "L", (-.05, .04, -1), (-.03, 0, -1), (-.08, 1, -.2))
    leg(ops, "R", (.06, -.03, -1), (.04, -.06, -1), (.1, 1, -.2))
    ops["spine04"] = [("rot", X, 2), ("rot", Z, 6)]
    head_turn(ops, 14, pitch=12, roll=-5)
    h.pose(ops)
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [-8, 32, 14], (.6, -.3, -.6))
    ops["wrist.R"] = ("aim", (-.3, .8, .5))
    curl_hand(ops, h, "R", [(10, 16, 10), (14, 20, 12), (18, 24, 14), (22, 26, 16)], thumb=(4, 6, 4))
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-4, 6, -50], (-.6, -.4, 0))
    curl_hand(ops, h, "L", [(20, 28, 16)] * 4, thumb=(8, 10, 8))
    return bake(h, ops, "sb_eve_reach", {"hair": hair_eve, "scalp": scalp, "brow": brows}, {}), h


def eve_offer():
    """F5. Eve holds the fruit out to him (Genesis 3:6), her body turned toward him."""
    h = eve_h(LURED)
    ops = {}
    leg(ops, "L", (-.05, .04, -1), (-.03, 0, -1), (-.08, 1, -.2))
    leg(ops, "R", (.06, -.03, -1), (.04, -.06, -1), (.1, 1, -.2))
    ops["spine04"] = ("rot", X, -2)
    head_turn(ops, 4, pitch=-2, roll=4)
    h.pose(ops)
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [-12, 34, -14], (.7, -.4, -.4))
    ops["wrist.R"] = ("aim", (-.25, .9, .2))
    curl_hand(ops, h, "R", [(34, 40, 26), (36, 42, 28), (38, 44, 28), (40, 44, 28)], thumb=(16, 18, 12))
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-3, 6, -50], (-.6, -.4, 0))
    curl_hand(ops, h, "L", [(20, 28, 16)] * 4, thumb=(8, 10, 8))
    v = bake(h, ops, "sb_eve_offer", {"hair": hair_eve, "scalp": scalp, "brow": brows}, {})
    np.savez(A / "vi_sb_eve_offer_fruit.npz", c=joint_at(h, "wrist.R") + h.M["wrist.R"][:3, :3] @ np.array([0, 5.5, 3.0]))
    return v, h


def adam_take():
    """F5. Adam's hand comes up to take it. He looks at the fruit, not at her."""
    h = adam_h(DOUBT)
    ops = {}
    leg(ops, "L", (-.06, 0, -1), (-.04, -.04, -1), (-.08, 1, -.2))
    leg(ops, "R", (.08, .05, -1), (.05, 0, -1), (.1, 1, -.2))
    ops["spine04"] = ("rot", X, -3)
    head_turn(ops, -6, pitch=-14, roll=-3)
    h.pose(ops)
    reach(h, ops, "R", joint_at(h, "upperarm01.R") + [-14, 36, -18], (.7, -.3, -.5))
    ops["wrist.R"] = ("aim", (-.35, .85, .25))
    curl_hand(ops, h, "R", [(14, 20, 10), (16, 22, 12), (18, 24, 12), (20, 24, 12)], thumb=(4, 6, 4))
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-6, 4, -52], (-.6, -.4, 0))
    curl_hand(ops, h, "L", [(26, 34, 20)] * 4, thumb=(8, 10, 8))
    return bake(h, ops, "sb_adam_take", {"hair": hair_adam, "scalp": scalp, "beard": beard_short, "brow": brows}, {}), h


def adam_sew():
    """F6. Hands only: two fig leaves held together, a fibre drawn tight through them (Genesis 3:7)."""
    h = adam_h(SHAME)
    ops = {}
    leg(ops, "L", (-.06, 0, -1), (-.04, -.04, -1), (-.08, 1, -.2))
    leg(ops, "R", (.08, .05, -1), (.05, 0, -1), (.1, 1, -.2))
    for b in ("spine03", "spine04", "spine05"):
        ops[b] = ("rot", X, -7)
    head_turn(ops, 0, pitch=-24)
    h.pose(ops)
    c = joint_at(h, "neck01") + [0, 26, -30]                    # chest height, well clear of the waist
    reach(h, ops, "L", c + [-7, -4, -2], (-.8, -.5, -.3))
    ops["wrist.L"] = ("aim", (.5, .85, .1))
    curl_hand(ops, h, "L", [(26, 34, 20), (28, 36, 22), (32, 40, 22), (34, 40, 22)], thumb=(14, 16, 10))
    reach(h, ops, "R", c + [9, -2, 4], (.8, -.5, -.3))
    ops["wrist.R"] = ("aim", (.15, .9, .4))
    curl_hand(ops, h, "R", [(40, 50, 34), (50, 60, 40), (56, 64, 40), (58, 64, 40)], thumb=(18, 22, 14))
    v = bake(h, ops, "sb_adam_sew", {"hair": hair_adam, "scalp": scalp, "beard": beard_short, "brow": brows}, {})
    np.savez(A / "vi_sb_adam_sew_hands.npz", l=joint_at(h, "wrist.L"), r=joint_at(h, "wrist.R"), c=c,
             lm=h.M["wrist.L"][:3, :3], rm=h.M["wrist.R"][:3, :3])
    return v, h


def adam_clothed():
    """F9. Clothed by God (Genesis 3:21). He stands behind her, looking down at what he has been given."""
    h = adam_h(MOVED)
    ops = {}
    leg(ops, "L", (-.06, 0, -1), (-.04, -.04, -1), (-.08, 1, -.2))
    leg(ops, "R", (.08, .05, -1), (.05, 0, -1), (.1, 1, -.2))
    ops["spine04"] = ("rot", X, -3)
    head_turn(ops, -10, pitch=-18, roll=-3)
    h.pose(ops)
    reach(h, ops, "L", joint_at(h, "upperarm01.L") + [-6, 12, -46], (-.6, -.4, 0))
    reach(h, ops, "R", joint_at(h, "spine05") + [-6, 20, -4], (.8, -.3, -.4))
    ops["wrist.R"] = ("aim", (-.6, .2, .2))
    curl_hand(ops, h, "L", [(20, 28, 16)] * 4, thumb=(8, 10, 8))
    curl_hand(ops, h, "R", [(10, 16, 10)] * 4, thumb=(4, 6, 4))
    v = bake(h, ops, "sb_adam_clothed", {"hair": hair_adam, "scalp": scalp, "beard": beard_short, "brow": brows}, {})
    bake_tunic(h, ops, "sb_adam_clothed", False)
    return v, h


def eve_clothed():
    """F9. Her fingers on the garment at her shoulder; she looks up toward where it came from."""
    h = eve_h(MOVED)
    ops = {}
    leg(ops, "L", (-.05, .04, -1), (-.03, 0, -1), (-.08, 1, -.2))
    leg(ops, "R", (.06, -.03, -1), (.04, -.06, -1), (.1, 1, -.2))
    head_turn(ops, -14, pitch=22, roll=-4)
    h.pose(ops)
    sh = joint_at(h, "upperarm01.R")
    reach(h, ops, "L", sh + [-9, 9, -6], (-.6, -.2, -.9))
    ops["wrist.L"] = ("aim", (.55, .2, .4))
    curl_hand(ops, h, "L", [(10, 14, 8), (14, 18, 10), (18, 22, 12), (22, 24, 12)], thumb=(6, 8, 6))
    reach(h, ops, "R", sh + [3, 6, -50], (.6, -.4, 0))
    curl_hand(ops, h, "R", [(20, 28, 16)] * 4, thumb=(8, 10, 8))
    v = bake(h, ops, "sb_eve_clothed", {"hair": hair_eve, "scalp": scalp, "brow": brows}, {})
    bake_tunic(h, ops, "sb_eve_clothed", True)
    return v, h


POSES = {f.__name__: f for f in (man_sit, man_open, adam_walk, eve_walk, adam_up, eve_up, eve_reach, eve_offer, adam_take,
                                 adam_sew, adam_clothed, eve_clothed)}

if __name__ == "__main__":
    names = list(POSES) if sys.argv[1:] == ["all"] else sys.argv[1:]
    for n in names:
        POSES[n]()
        print("baked", n, flush=True)
