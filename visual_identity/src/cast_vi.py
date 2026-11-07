"""The Fourth Watch prototype cast, built on the CC0 MakeHuman base mesh and rig (see visual_style_exploration).

Three people share one body system, so their anatomy matches across the biblical and modern scenes:
  man   - a young adult today (sweatshirt, trousers, socks), two poses: relate and transform
  adam  - Adam, hiding among the trees, with a fig-leaf loincloth (Genesis 3:7)
  eve   - Eve, hiding beside him, with fig leaves (Genesis 3:7) and long hair

Writes meshes to /home/claude/fw-tools/assets/vi_<name>_<part>.npz. Space: cm, x = the figure's right, y = forward, z = up.
    python cast_vi.py man_relate man_transform adam eve
"""
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
VSE = HERE.parents[1] / "visual_style_exploration" / "src"
sys.path.insert(0, str(VSE))
from human import Human, clumps, curl_hand, vertex_normals  # noqa: E402
from cast import (beard_adam, brows, collider, down_of, hair_adam, hair_eve, head_faces, join, joint_at, landmarks, reach,  # noqa: E402
                  scalp, turn_palm)

A = Path("/home/claude/fw-tools/assets")
X, Y, Z = (1, 0, 0), (0, 1, 0), (0, 0, 1)


# ------------------------------------------------------------------ hair for the modern man

def hair_short(h, v):
    """Short, slightly tousled hair: mostly lying on the scalp, a little lift at the crown."""
    e = landmarks(h)
    crown = e + [0, -7.5, 10.5]
    hf = head_faces(h)
    down = down_of(h)

    def keep(c):
        d = c - e
        line = np.interp(d[:, 1], [-22, -15, -8, -4, 0, 3], [-12, -4, 3.2, 6.6, 7.6, 8.4])
        return d[:, 2] > line

    def field(p, t):
        f = (p - crown) * [1, 1, .25]
        f = f / (np.linalg.norm(f) + 1e-6)
        d = p - e
        fwd = np.clip((d[1] + 4) / 8, 0, 1)                    # the front sweeps forward and to one side
        f = f + np.array([.55, .6, -.1]) * fwd + down * .25 * t
        return f / np.linalg.norm(f)
    a = clumps(v, hf, keep, field, 460, 20, (2.6, 4.4), 7, 31, e - [0, 9, 0], clear=.28, width=.17, spread=1.1, hug=1.0, collide=collider(h), all_faces=h.body)
    return a


# ------------------------------------------------------------------ clothes grown from the body

def bone_w(h, prefixes):
    w = np.zeros(len(h.v))
    for b, (i, ww) in h.weights.items():
        if b.startswith(prefixes):
            np.add.at(w, i, ww)
    return w / h.tot


def wrinkle(v, seed, amp, cell=6.0):
    r = np.random.default_rng(seed)
    k = r.normal(0, 1, (6, 3)) / cell
    ph = r.uniform(0, 6.28, 6)
    return amp * sum(np.sin(v @ k[i] + ph[i]) for i in range(6)) / 6


def shell(h, keep_v, thick, seed, wr=.35):
    """Faces whose four corners are all kept, pushed out along the rest normals, then posed with the body's own weights."""
    f = h.body[keep_v[h.body].all(1)]
    n = vertex_normals(h.v, h.body)
    t = thick * (1 + wrinkle(h.v, seed, wr))
    return h.v + n * t[:, None], f


def posed_shell(h, ops, rest, faces):
    keep = h.v
    h.v = rest
    out = h.pose(ops)
    h.v = keep
    used = np.unique(faces)
    remap = -np.ones(len(rest), int)
    remap[used] = np.arange(len(used))
    return out[used].astype(np.float32), remap[faces].astype(np.int32)


def outfit_modern(h):
    """A crew-neck sweatshirt over trousers, and socks."""
    z = h.v[:, 2]
    hip = h.head_of("upperleg01.L")[2]
    hands = bone_w(h, ("wrist", "finger", "metacarpal")) > .25
    head = bone_w(h, ("head", "neck02", "neck03", "jaw", "eye", "oculi", "lolid", "uplid", "levator", "oris", "risorius", "temporalis",
                      "special", "orbicularis", "cheek", "nose", "brow", "tongue")) > .3
    feet = bone_w(h, ("foot", "toe")) > .3
    legs = bone_w(h, ("upperleg", "lowerleg")) > .5
    top = (~hands) & (~head) & (~legs) & (~feet) & (z > hip + 1.0)
    bottom = (~feet) & (z < hip + 9.0) & ~hands
    return {"shirt": (top, 1.7, 11), "pants": (bottom, .9, 12), "socks": (feet, .35, 13)}


def outfit_eden(h, female):
    """Fig-leaf coverings (Genesis 3:7): a loincloth with a leafy hem, and for Eve a leaf wrap at the chest."""
    z = h.v[:, 2]
    hip = h.head_of("upperleg01.L")[2]
    ang = np.arctan2(h.v[:, 0], h.v[:, 1])
    hem = hip - 15 + 3.2 * np.abs(np.sin(ang * 4.5)) + 1.2 * np.sin(ang * 11)
    hands = bone_w(h, ("wrist", "finger")) > .25
    arms = bone_w(h, ("upperarm", "lowerarm", "shoulder")) > .45
    loin = (z < hip + 6) & (z > hem) & ~hands & ~arms
    out = {"leaves": (loin, 1.3, 21)}
    if female:
        chest = h.head_of("breast.L")[2]
        lo = chest - 17 + 2.2 * np.abs(np.sin(ang * 5))
        wrap = (z > lo) & (z < chest + 8) & ~arms & ~hands & (bone_w(h, ("spine", "breast", "clavicle")) > .4)
        out["wrap"] = (wrap, 1.4, 22)
    return out


# ------------------------------------------------------------------ fig leaves sewn over the band (Genesis 3:7)

def fig_leaf_2d(n=40):
    """A fig leaf outline, base at the origin, pointing along +x, length 1: three to five rounded lobes."""
    th = np.linspace(-np.pi, np.pi, n, endpoint=False)
    lobe = .6 + .4 * np.abs(np.cos(2.5 * th)) ** .55
    rr = lobe * (1 - .55 * np.clip((np.abs(th) - 2.3) / .8, 0, 1))
    return np.c_[np.cos(th) * rr * .5 + .5, np.sin(th) * rr * .46]


def leafify(v, f, count, size, seed):
    """Overlapping fig leaves hung on a posed band: each tangent to the body, its tip falling with gravity."""
    r = np.random.default_rng(seed)
    a = v[f[:, 1]] - v[f[:, 0]]
    b = v[f[:, 2]] - v[f[:, 0]]
    n = np.cross(a, b)
    area = np.linalg.norm(n, axis=1)
    n = n / (area[:, None] + 1e-9)
    pick = r.choice(len(f), count, p=area / area.sum())
    out_v, out_f, off = [], [], 0
    outline = fig_leaf_2d()
    m = len(outline)
    for i in pick:
        c = v[f[i]].mean(0)
        nn = n[i]
        d = np.array([0, 0, -1.0]) - nn * nn[2]
        d = d / (np.linalg.norm(d) + 1e-9)
        ang = r.uniform(-.45, .45)
        side = np.cross(nn, d)
        d, side = d * np.cos(ang) + side * np.sin(ang), side * np.cos(ang) - d * np.sin(ang)
        L = size * r.uniform(.8, 1.2)
        pts = outline * L
        bend = -.12 * L * (outline[:, 0]) ** 2
        top = c - d * L * .25 + nn * r.uniform(.6, 1.4)
        P3 = top + pts[:, :1] * d + pts[:, 1:] * side + (bend[:, None] + .5) * nn
        cen = top + d * L * .45 + nn * .9
        out_v.append(np.vstack([cen[None], P3]))
        out_f.append(np.array([[off, off + 1 + j, off + 1 + (j + 1) % m] for j in range(m)]))
        off += m + 1
    return np.vstack(out_v).astype(np.float32), np.vstack(out_f).astype(np.int32)


# ------------------------------------------------------------------ bake

def bake(h, ops, name, pieces, outfit):
    v = h.pose(ops)
    h.posed = v
    A.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(A / f"vi_{name}_body.npz", v=v.astype(np.float32), f=h.body)
    rest = h.v
    for part, fn in pieces.items():
        hv, hf = fn(h, rest)
        hv = h.apply("head", hv)
        np.savez_compressed(A / f"vi_{name}_{part}.npz", v=hv.astype(np.float32), f=hf.astype(np.int32))
    for part, (keep_v, thick, seed) in outfit.items():
        rv, f = shell(h, keep_v, thick, seed)
        pv, pf = posed_shell(h, ops, rv, f)
        np.savez_compressed(A / f"vi_{name}_{part}.npz", v=pv, f=pf)
        if seed >= 21:                                           # the fig-leaf bands get real leaves sewn over them
            lv, lf = leafify(pv, pf, 34 if part == "leaves" else 52, 11.5 if part == "leaves" else 11.0, seed)
            np.savez_compressed(A / f"vi_{name}_{part}leaf.npz", v=lv, f=lf)
    e = np.array([[h.head_of("eye.L")], [h.head_of("eye.R")]]).reshape(2, 3)
    np.savez_compressed(A / f"vi_{name}_eyes.npz", c=h.apply("head", e), r=h.M["head"][:3, :3])
    marks = {b: joint_at(h, b) for b in ("head", "neck01", "wrist.L", "wrist.R", "lowerleg01.L", "lowerleg01.R", "upperleg01.L", "foot.L", "foot.R")}
    np.savez(A / f"vi_{name}_marks.npz", **{k.replace(".", "_"): v for k, v in marks.items()})
    return v


def eye_point(h):
    return h.apply("head", landmarks(h)[None])[0]


# ------------------------------------------------------------------ the modern man

def man(expr):
    return Human(False, race=(.42, .33, .25), muscle=.42, weight=.42, expr=expr)


def leg(ops, side, thigh, shin, foot):
    """Each limb has two bones in this rig; aiming both keeps hip-to-knee and knee-to-ankle on the line asked for."""
    for b in ("upperleg01", "upperleg02"):
        ops[f"{b}.{side}"] = ("aim", thigh)
    for b in ("lowerleg01", "lowerleg02"):
        ops[f"{b}.{side}"] = ("aim", shin)
    ops[f"foot.{side}"] = ("aim", foot)
    return ops


def sit_legs(ops):
    leg(ops, "L", (-.1, 1, -.06), (-.04, .1, -1), (-.06, 1, -.3))
    leg(ops, "R", (.08, 1, -.06), (.06, .18, -1), (.08, 1, -.3))
    return ops


def man_relate():
    """Sitting on the edge of the bed, bent forward, elbows near his knees, his forehead in his hands."""
    h = man({"eyebrows-left-inner-up": .75, "eyebrows-right-inner-up": .75, "eye-left-closure": .85, "eye-right-closure": .85,
             "mouth-compression": .4, "mouth-depression": .25})
    ops = sit_legs({})
    for b in ("spine01", "spine02", "spine03", "spine04", "spine05"):
        ops[b] = ("rot", X, -13)
    for b in ("neck01", "neck02", "neck03"):
        ops[b] = ("rot", X, -4)
    ops["head"] = ("rot", X, -6)
    ops["clavicle.L"] = ("rot", Y, 8)
    ops["clavicle.R"] = ("rot", Y, -8)
    h.pose(ops)
    e = eye_point(h)
    # The heels of his hands against his brow, fingers pushed up into his hair: distress, not prayer.
    reach(h, ops, "L", e + [-8.5, 2.5, -9.5], (-.3, .1, -1))
    reach(h, ops, "R", e + [8.5, 2.5, -10.0], (.3, .1, -1))
    ops["wrist.L"] = ("aim", (.38, -.3, .87))
    ops["wrist.R"] = ("aim", (-.38, -.3, .87))
    curl_hand(ops, h, "L", [(12, 18, 12), (10, 16, 10), (12, 18, 12), (16, 20, 14)], thumb=(4, 6, 4))
    curl_hand(ops, h, "R", [(12, 18, 12), (10, 16, 10), (12, 18, 12), (16, 20, 14)], thumb=(4, 6, 4))
    return bake(h, ops, "man_relate", {"hair": hair_short, "scalp": scalp, "brow": brows}, outfit_modern(h)), h


def man_transform():
    """Still on the bed, but upright now, shoulders down, the phone in both hands at his lap. He looks at it, deciding."""
    h = man({"eyebrows-left-inner-up": .35, "eyebrows-right-inner-up": .35, "eye-left-slit": .35, "eye-right-slit": .35, "mouth-compression": .1})
    ops = sit_legs({})
    for b in ("spine01", "spine02", "spine03", "spine04", "spine05"):
        ops[b] = ("rot", X, -3.5)
    ops["neck01"] = [("rot", Z, -3), ("rot", X, -6)]
    ops["neck02"] = [("rot", Z, -3), ("rot", X, -6)]
    ops["neck03"] = [("rot", Z, -3), ("rot", X, -5)]
    ops["head"] = [("rot", Z, -4), ("rot", X, -9), ("rot", Y, 5)]
    h.pose(ops)
    hip = joint_at(h, "upperleg01.L")
    lap = hip + [3.5, 22.0, 9.0]
    fl = reach(h, ops, "L", lap + [-6.0, 0, 0], (-.6, -.2, -1))
    fr = reach(h, ops, "R", lap + [6.0, 0, 0], (.6, -.2, -1))
    ops["wrist.L"] = ("aim", (.25, .85, .35))
    ops["wrist.R"] = ("aim", (-.25, .85, .35))
    curl_hand(ops, h, "L", [(26, 30, 18), (28, 32, 20), (30, 34, 20), (32, 36, 20)], thumb=(10, 14, 10))
    curl_hand(ops, h, "R", [(26, 30, 18), (28, 32, 20), (30, 34, 20), (32, 36, 20)], thumb=(10, 14, 10))
    v = bake(h, ops, "man_transform", {"hair": hair_short, "scalp": scalp, "brow": brows}, outfit_modern(h))
    np.savez(A / "vi_man_transform_phone.npz", c=lap + [0, 2.0, 1.5])
    return v, h


# ------------------------------------------------------------------ Adam and Eve, hiding

def adam():
    """His back pressed to the trunk, knees soft, his head turned hard to his right toward the sound (Genesis 3:8).
    One palm flat on the bark behind him, the other hand closed at his side."""
    h = Human(False, race=(.45, .3, .25), muscle=.7, weight=.25, older=.22,
              expr={"eyebrows-left-inner-up": .9, "eyebrows-right-inner-up": .9, "eye-left-opened-up": .45, "eye-right-opened-up": .45, "mouth-compression": .35})
    ops = {"spine01": ("rot", X, 2), "spine02": ("rot", X, 2), "spine04": ("rot", Z, -4),
           "neck01": ("rot", Z, -10), "neck02": ("rot", Z, -10), "neck03": [("rot", Z, -10), ("rot", X, -1)], "head": [("rot", Z, -10), ("rot", X, -3)],
           "clavicle.L": ("rot", Y, 6), "clavicle.R": ("rot", Y, -8)}
    leg(ops, "L", (-.06, .18, -.98), (-.04, -.12, -.99), (-.1, 1, -.25))
    leg(ops, "R", (.08, .16, -.98), (.05, -.12, -.99), (.12, 1, -.25))
    h.pose(ops)
    hipR = joint_at(h, "upperleg01.R")
    reach(h, ops, "R", hipR + [16.0, -11.0, 14.0], (.4, .9, -.3))
    ops["wrist.R"] = ("aim", (.15, -.35, -.92))
    curl_hand(ops, h, "R", [(4, 6, 3)] * 4, thumb=(4, 6, 4))
    hipL = joint_at(h, "upperleg01.L")
    reach(h, ops, "L", hipL + [-9.0, 2.0, -4.0], (-.8, -.3, -.3))
    curl_hand(ops, h, "L", [(40, 54, 36), (42, 56, 38), (44, 58, 38), (46, 58, 38)], thumb=(14, 18, 14))
    return bake(h, ops, "adam", {"hair": hair_adam, "scalp": scalp, "beard": beard_adam, "brow": brows}, outfit_eden(h, False)), h


def eve():
    """Beside him against the same trunk, arms folded tight across her chest, looking the same way he is."""
    h = Human(True, race=(.45, .3, .25), muscle=.45, weight=.4,
              expr={"eyebrows-left-inner-up": .9, "eyebrows-right-inner-up": .9, "eye-left-opened-up": .35, "eye-right-opened-up": .35, "mouth-compression": .25})
    ops = {"spine01": ("rot", X, 1), "spine02": ("rot", Y, 3), "spine03": ("rot", Z, -4), "spine04": ("rot", Z, -5),
           "neck01": ("rot", Z, -11), "neck02": ("rot", Z, -11), "neck03": ("rot", Z, -10), "head": [("rot", Z, -11), ("rot", X, -2)]}
    leg(ops, "L", (-.05, .16, -.98), (-.03, -.1, -.99), (-.1, 1, -.25))
    leg(ops, "R", (.07, .14, -.98), (.04, -.1, -.99), (.1, 1, -.25))
    h.pose(ops)
    # Arms wrapped around herself: each hand grips the opposite upper arm.
    sL, sR = joint_at(h, "upperarm01.L"), joint_at(h, "upperarm01.R")
    reach(h, ops, "L", sR + [-3.0, 9.0, -15.0], (-.4, .5, -1))
    reach(h, ops, "R", sL + [3.0, 11.0, -12.0], (.4, .5, -1))
    ops["wrist.L"] = ("aim", (1, .1, .25))
    ops["wrist.R"] = ("aim", (-1, .1, .35))
    curl_hand(ops, h, "L", [(42, 52, 38), (44, 54, 40), (46, 56, 40), (48, 56, 40)], thumb=(12, 16, 12))
    curl_hand(ops, h, "R", [(42, 52, 38), (44, 54, 40), (46, 56, 40), (48, 56, 40)], thumb=(12, 16, 12))
    return bake(h, ops, "eve", {"hair": hair_eve, "scalp": scalp, "brow": brows}, outfit_eden(h, True)), h


if __name__ == "__main__":
    for w in sys.argv[1:] or ["man_relate", "man_transform", "adam", "eve"]:
        {"man_relate": man_relate, "man_transform": man_transform, "adam": adam, "eve": eve}[w]()
        print("baked", w, flush=True)
