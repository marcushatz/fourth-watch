"""Eden v2 cast: Adam and Eve, stylized and posed hiding (Genesis 3:7-8). Same CC0 MakeHuman body system as the prototype,
pushed toward an animated-feature design: a slightly larger head, larger eyes, cleaner features, and posture that shows fear.

  e2_eve   sits low in the undergrowth hugging her knees, pressed against him, glancing up toward the light
  e2_adam  crouches over her, one arm around her shoulders, head turned hard over his left shoulder toward the light

Writes /home/claude/fw-tools/assets/vi_e2_<name>_<part>.npz.   python cast_e2.py eve adam   (Eve first: Adam's hand finds her)
"""
import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))
sys.path.insert(0, str(HERE.parents[2] / "visual_style_exploration" / "src"))
import layout as L  # noqa: E402
from cast import brows, down_of, hair_adam, hair_eve, head_faces, joint_at, landmarks, reach, scalp  # noqa: E402
from cast_vi import bake, bone_w, leg, outfit_eden  # noqa: E402
from human import DATA, Human, clumps, curl_hand  # noqa: E402

X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)
# Face design with MakeHuman's own shape targets: hers finer and heart-shaped, his broad-jawed with strong cheekbones.
EVE_FACE = {"nose/nose-scale-horiz-decr.target": .45, "nose/nose-scale-depth-decr.target": .3, "nose/nose-point-up.target": .35,
            "nose/nose-hump-decr.target": .4, "nose/nose-volume-decr.target": .3, "chin/chin-width-decr.target": .3,
            "chin/chin-triangle.target": .35, "l-cheek-bones-incr": .3, "r-cheek-bones-incr": .3}
ADAM_FACE = {"chin/chin-width-incr.target": .6, "chin/chin-prominent-incr.target": .45, "chin/chin-height-incr.target": .3, "l-cheek-bones-incr": .35,
             "r-cheek-bones-incr": .35, "nose/nose-scale-horiz-decr.target": .15, "nose/nose-hump-decr.target": .3}
for _d in (EVE_FACE, ADAM_FACE):
    for _k in [k for k in _d if not k.endswith(".target")]:
        _d[f"cheek/{_k}.target"] = _d.pop(_k)


def head_bones(h):
    kids = {}
    for b, v in h.bones.items():
        kids.setdefault(v["parent"], []).append(b)
    out, stack = [], ["head"]
    while stack:
        b = stack.pop()
        out.append(b)
        stack += kids.get(b, [])
    return tuple(out)


def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)


def stylize(h, head=1.07, eyes=1.16, nose=1.0, jaw=1.0, neck=1.0):
    """Animated-feature proportions on the rest mesh, then the joints are re-measured so the rig follows."""
    v = h.v.copy()
    wh = bone_w(h, head_bones(h))
    piv = h.head_of("head")
    v = piv + (v - piv) * (1 + (head - 1) * wh[:, None])
    # Eyes: open the socket region around each eye centre, so the eyes read at phone size.
    for side in ("L", "R"):
        c = piv + (h.head_of(f"eye.{side}") - piv) * head
        d = np.linalg.norm((v - c) * [1, .8, 1.15], axis=1)
        k = 1 + (eyes - 1) * (1 - smooth(d / 3.4))
        v = c + (v - c) * k[:, None]
    e = (piv + (h.head_of("eye.L") - piv) * head + piv + (h.head_of("eye.R") - piv) * head) / 2
    if nose != 1:
        m = (np.abs(v[:, 0]) < 4) & (v[:, 1] > e[1] + 1)
        tip = v[m & (np.abs(v[:, 2] - (e[2] - 4)) < 3)][:, 1].max()
        root = np.array([0, e[1] + 2.0, e[2] - 1.2])
        d = np.linalg.norm((v - (root + [0, (tip - root[1]) * .5, -2.0])) * [1, .7, .8], axis=1)
        w = (1 - smooth(d / 3.8)) * (v[:, 1] > e[1])
        v = v + ((root + (v - root) * nose) - v) * w[:, None]
    if jaw != 1:
        jz = e[2] - 9
        w = smooth((jz - v[:, 2]) / 6) * wh * (v[:, 2] > e[2] - 20)
        v[:, 0] = v[:, 0] * (1 + (jaw - 1) * w)
    if neck != 1:
        wn = bone_w(h, ("neck01", "neck02", "neck03"))
        v[:, 0] = v[:, 0] * (1 + (neck - 1) * wn)
        v[:, 1] = h.head_of("neck02")[1] + (v[:, 1] - h.head_of("neck02")[1]) * (1 + (neck - 1) * wn)
    h.v = v
    sk = json.load(open(DATA / "rigs/default.mhskel"))
    h.joint = {k: v[idx].mean(0) for k, idx in sk["joints"].items()}
    return h


def head_turn(ops, yaw, pitch=0.0, roll=0.0, split=(.16, .18, .2, .46)):
    """Spread a head turn over the three neck bones and the head. Yaw +: to the figure's left (-x). Pitch +: chin up."""
    for b, s in zip(("neck01", "neck02", "neck03", "head"), split):
        ops[b] = [("rot", Z, yaw * s), ("rot", X, pitch * s), ("rot", Y, roll * s)]
    return ops


def beard_short(h, v):
    """A close, shaped beard that keeps his jaw line and mouth readable (the prototype's long beard hid his expression)."""
    e = landmarks(h)
    hf = head_faces(h)
    mz = e[2] - 8.4
    down = down_of(h)

    def keep(c):
        d = c - e
        low = d[:, 2] < np.interp(d[:, 1], [-10, -6, -3, 1, 4], [-1.5, -3.8, -5.0, -6.2, -6.0])
        jaw = d[:, 2] > np.interp(d[:, 1], [-10, -7, -3, 0, 3], [-5, -9.0, -12.0, -12.6, -12.6])
        fr = d[:, 1] > -9.0
        lips = ((c[:, 0] / 2.9) ** 2 + ((c[:, 2] - mz) / 1.25) ** 2 < 1) & (d[:, 1] > -3)
        return low & jaw & fr & ~lips

    def field(p, t):
        d = p - e
        f = np.array([-np.sign(d[0]) * .05, .25 - t * .2, 0]) + down * .8
        return f / np.linalg.norm(f)
    return clumps(v, hf, keep, field, 300, 18, (1.3, 2.5), 5, 8, e + [0, -5, -3], clear=.1, width=.07, spread=.9, hug=.95, all_faces=h.body)


def floor_now(h, ops):
    v = h.pose(ops)
    return float(v[np.unique(h.body)][:, 2].min())


# ------------------------------------------------------------------ Eve

def eve():
    """Sitting low in the undergrowth, knees drawn up, arms locked around her shins. She leans into him and
    looks up toward the light without lifting her head."""
    h = Human(True, race=(.45, .3, .25), muscle=.42, weight=.36,
              expr={"eyebrows-left-inner-up": 1.0, "eyebrows-right-inner-up": 1.0, "eyebrows-left-up": .35, "eyebrows-right-up": .35,
                    "eye-left-opened-up": 1.0, "eye-right-opened-up": 1.0, "mouth-open": .14, "mouth-retraction": .2,
                    "neck-platysma": .25},
              extra=EVE_FACE)
    stylize(h, head=1.08, eyes=1.2, jaw=.96, neck=.94)
    ops = {}
    leg(ops, "L", (-.02, .6, .8), (-.07, .36, -.93), (-.05, 1, -.15))
    leg(ops, "R", (.0, .62, .78), (.05, .38, -.92), (.05, 1, -.15))
    for b, a in (("spine01", -6), ("spine02", -5), ("spine03", -3), ("spine04", -1), ("spine05", 1)):
        ops[b] = [("rot", X, a), ("rot", Y, -1.6)]
    ops["clavicle.L"] = [("rot", Y, 7), ("rot", Z, -6)]
    ops["clavicle.R"] = [("rot", Y, -7), ("rot", Z, 6)]
    head_turn(ops, 54, pitch=10, roll=-5)
    h.pose(ops)
    kL, kR = joint_at(h, "lowerleg01.L"), joint_at(h, "lowerleg01.R")
    # Forearms crossed in front of her shins, below the knees; each hand holds the other forearm.
    reach(h, ops, "L", kR + [2.0, 8.0, -10.0], (-1, .2, -.4))
    reach(h, ops, "R", kL + [-1.0, 9.5, -6.0], (1, .2, -.4))
    ops["wrist.L"] = ("aim", (1, .15, .3))
    ops["wrist.R"] = ("aim", (-1, .15, .45))
    curl_hand(ops, h, "L", [(38, 50, 34), (40, 52, 36), (42, 54, 36), (44, 54, 36)], thumb=(10, 14, 10))
    curl_hand(ops, h, "R", [(34, 46, 30), (36, 48, 32), (38, 50, 32), (40, 50, 32)], thumb=(10, 14, 10))
    bake(h, ops, "e2_eve", {"hair": hair_eve, "scalp": scalp, "brow": brows}, outfit_eden(h, True))
    np.savez(L.ASSETS / "vi_e2_eve_reach.npz", shoulder_r=joint_at(h, "upperarm01.R"), shoulder_l=joint_at(h, "upperarm01.L"))
    return h


# ------------------------------------------------------------------ Adam

def adam():
    """Crouched over her on the balls of his feet, his right arm around her shoulders, his left hand braced on the root.
    His head is turned hard over his left shoulder toward the light, brows up, eyes wide: he has heard it (Genesis 3:8)."""
    h = Human(False, race=(.45, .3, .25), muscle=.78, weight=.26, older=.32,
              expr={"eyebrows-left-inner-up": 1.0, "eyebrows-right-inner-up": 1.0, "eyebrows-left-up": .3, "eyebrows-right-up": .3,
                    "eye-left-opened-up": 1.0, "eye-right-opened-up": 1.0, "mouth-open": .2, "mouth-retraction": .25,
                    "neck-platysma": .45}, extra=ADAM_FACE)
    stylize(h, head=1.04, eyes=1.17, jaw=1.08)
    ops = {}
    leg(ops, "L", (-.26, .92, .2), (-.05, -.5, -.86), (-.05, .8, -.6))
    leg(ops, "R", (.2, .94, .16), (.04, -.48, -.87), (.05, .8, -.6))
    for b, a in (("spine01", -13), ("spine02", -11), ("spine03", -8), ("spine04", -4), ("spine05", 0)):
        ops[b] = [("rot", X, a), ("rot", Z, 3.0), ("rot", Y, -2)]
    ops["clavicle.L"] = [("rot", Y, 11), ("rot", Z, -8)]
    ops["clavicle.R"] = [("rot", Y, -6), ("rot", Z, 4)]
    head_turn(ops, 44, pitch=14, roll=4)
    fz = floor_now(h, ops)
    # His right hand on her near shoulder, his arm behind her back: Eve's shoulder, in his own space.
    sh = np.load(L.ASSETS / "vi_e2_eve_reach.npz")["shoulder_l"]
    target = L.to_local("e2_adam", L.to_world("e2_eve", sh + [1.0, -4.0, 6.0]), fz)
    reach(h, ops, "R", target + [0, -3, 2], (.6, -.3, .7))
    ops["wrist.R"] = ("aim", (.2, .5, -.85))
    curl_hand(ops, h, "R", [(14, 22, 12), (16, 24, 14), (18, 26, 14), (20, 26, 14)], thumb=(6, 8, 6))
    hipL = joint_at(h, "upperleg01.L")
    reach(h, ops, "L", hipL + [-17.0, 26.0, -26.0], (-.9, -.1, -.2))
    ops["wrist.L"] = ("aim", (-.1, .95, -.3))
    curl_hand(ops, h, "L", [(30, 40, 26), (32, 42, 28), (34, 44, 28), (36, 44, 28)], thumb=(8, 12, 8))
    bake(h, ops, "e2_adam", {"hair": hair_adam, "scalp": scalp, "beard": beard_short, "brow": brows}, outfit_eden(h, False))
    return h


if __name__ == "__main__":
    for w in sys.argv[1:] or ["eve", "adam"]:
        {"eve": eve, "adam": adam}[w]()
        print("baked", w, flush=True)
