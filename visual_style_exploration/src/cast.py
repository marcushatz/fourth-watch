"""Adam and Eve built on the open human mesh, with clumped hair. Writes meshes for the 3D scenes."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from human import Human, clumps, curl_hand

A = Path("/home/claude/fw-tools/assets")
X = (1, 0, 0)
Y = (0, 1, 0)
Z = (0, 0, 1)


def landmarks(h):
    eye = (h.head_of("eye.L") + h.head_of("eye.R")) / 2
    return eye


def head_faces(h):
    """Faces on the head, found by position, since the face rig shares its weights."""
    e = landmarks(h)
    c = h.v[h.body].mean(1) - e
    return h.body[(np.linalg.norm(c, axis=1) < 19) & (c[:, 2] > -15.5) & (np.abs(c[:, 0]) < 11)]


def join(a, b):
    return np.vstack([a[0], b[0]]), np.vstack([a[1], b[1] + len(a[0])])


def down_of(h):
    """World down, as seen from the unposed head, so hair hangs with gravity."""
    return h.M["head"][:3, :3].T @ np.array([0, 0, -1.0])


def hair_adam(h, v):
    e = landmarks(h)
    crown = e + [0, -8.5, 11.5]
    hf = head_faces(h)
    down = down_of(h)
    def keep(c):
        d = c - e
        back = np.interp(d[:, 1], [-22, -15, -8, -4, 0, 3], [-16, -7, 1.5, 5.6, 6.5, 7.2])
        return d[:, 2] > back
    def field(p, t):
        f = (p - crown) * [1, 1, .15]
        f[1] = min(f[1], 0) - 2.5                                # nothing combs forward
        f = f / (np.linalg.norm(f) + 1e-6) * (1 - t) * .7
        hang = down * [1, 0, 1]                                  # swept back, never forward over the face
        f = f + np.array([0, -.42 * max(0, 1 - t * 2), 0]) + hang * (.55 + t * 1.8)
        guard = np.clip((p[1] - (e[1] - 9.5)) / 3.5, 0, 1) * np.clip((e[2] + 5.5 - p[2]) / 6, 0, 1)
        f = f + np.array([np.sign(p[0]) * .3, -2.2, 0]) * guard
        return f / np.linalg.norm(f)
    a = clumps(v, hf, keep, field, 300, 34, (14, 21), 14, 3, e - [0, 9, 0], clear=.3, width=.17, spread=2.6, hug=.8, collide=collider(h), all_faces=h.body)
    def band(c):
        d = c - e
        hl = np.interp(d[:, 1], [-22, -15, -8, -4, 0, 3], [-16, -7, 1.5, 5.6, 6.5, 7.2])
        return (d[:, 2] > hl) & (d[:, 2] < hl + 2.4)
    b = clumps(v, hf, band, field, 170, 14, (8, 13), 10, 4, e - [0, 9, 0], clear=.28, width=.13, spread=1.4, hug=.9, collide=collider(h), all_faces=h.body)
    return join(a, b)


def beard_adam(h, v):
    e = landmarks(h)
    hf = head_faces(h)
    mz = e[2] - 8.0
    down = down_of(h)
    def keep(c):
        d = c - e
        low = d[:, 2] < np.interp(d[:, 1], [-10, -6, -3, 1, 4], [-1, -3.4, -4.6, -5.8, -5.6])
        jaw = d[:, 2] > np.interp(d[:, 1], [-10, -7, -3, 0, 3], [-5, -9.2, -12.4, -13.2, -13.2])
        fr = d[:, 1] > -9.5
        lips = ((c[:, 0] / 2.7) ** 2 + ((c[:, 2] - mz) / 1.05) ** 2 < 1) & (d[:, 1] > -3)
        return low & jaw & fr & ~lips
    def field(p, t):
        d = p - e
        f = np.array([-np.sign(d[0]) * .1, .12 - t * .2, 0]) + down
        return f / np.linalg.norm(f)
    return clumps(v, hf, keep, field, 170, 24, (4.2, 8), 8, 8, e + [0, -5, -3], clear=.16, width=.09, spread=1.2, hug=.5, all_faces=h.body)


def brows(h, v):
    """Fine strokes laid along each brow on a smooth surface fit, so they never zigzag."""
    from human import ribbons
    from scipy.interpolate import LinearNDInterpolator
    e = landmarks(h)
    d = v - e
    front = v[(d[:, 1] > -7) & (np.abs(d[:, 2]) < 8) & (np.abs(d[:, 0]) < 9)]
    fit = LinearNDInterpolator(front[:, [0, 2]], front[:, 1])
    r = np.random.default_rng(15)
    S, W = [], []
    for side in (-1, 1):
        for i in range(300):
            t = r.random()
            x = side * (1.2 + 4.7 * t)
            z = e[2] + 2.55 + 1.15 * np.sin(np.pi * min(t * 1.2, 1)) - .8 * t ** 3 + r.normal(0, .15 * (1.15 - t))
            l = r.uniform(.45, .95)
            a = np.radians(58 - 62 * t)
            pts = []
            for q in np.linspace(0, 1, 4):
                px, pz = x + side * l * q * np.cos(a), z + l * q * np.sin(a)
                y = fit(px, pz)
                if not np.isfinite(y):
                    break
                pts.append((px, float(y) + .05, pz))
            if len(pts) == 4:
                S.append(np.array(pts))
                W.append(.04)
    return ribbons(S, W, e - [0, 9, 0])


def scalp(h, v):
    """A dark sheet under the hair, so no skin shows between the roots."""
    e = landmarks(h)
    hf = head_faces(h)
    c = v[hf].mean(1) - e
    back = np.interp(c[:, 1], [-22, -15, -8, -4, 0, 3], [-13, -5, 3.0, 7.6, 8.8, 9.8])
    f = hf[c[:, 2] > back]
    n = np.zeros_like(v)
    a = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    for i in range(4):
        np.add.at(n, f[:, i], a)
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
    return v + n * .08, f


def collider(h):
    """Posed body seen from the unposed head, so hair can rest on shoulders."""
    M = h.M["head"]
    return (h.posed - M[:3, 3]) @ M[:3, :3]


def bake(h, ops, name, pieces):
    v = h.pose(ops)
    h.posed = v
    np.savez_compressed(A / f"{name}_body.npz", v=v.astype(np.float32), f=h.body)
    rest = h.v
    for part, fn in pieces.items():
        hv, hf = fn(h, rest)
        hv = h.apply("head", hv)
        np.savez_compressed(A / f"{name}_{part}.npz", v=hv.astype(np.float32), f=hf.astype(np.int32))
    e = np.array([[h.head_of("eye.L")], [h.head_of("eye.R")]]).reshape(2, 3)
    np.savez_compressed(A / f"{name}_eyes.npz", c=h.apply("head", e), r=h.M["head"][:3, :3])


def adam_s26():
    h = Human(False, race=(.45, .3, .25), muscle=.7, weight=.25, older=.22, expr={"eye-left-closure": 1, "eye-right-closure": 1, "eyebrows-left-inner-up": .8, "eyebrows-right-inner-up": .8, "mouth-compression": .35})
    ops = {
        "spine03": ("rot", X, -3), "spine02": ("rot", X, -3), "spine01": ("rot", X, -3),
        "neck01": ("rot", X, -5), "neck02": ("rot", X, -5), "neck03": ("rot", X, -4), "head": ("rot", X, -5),
        "clavicle.L": [("rot", Y, 25), ("rot", Z, -16)], "clavicle.R": [("rot", Y, -25), ("rot", Z, 16)],
        "upperarm01.L": ("aim", (-.22, .3, -.93)), "upperarm01.R": ("aim", (.22, .3, -.93)),
        "lowerarm01.L": ("aim", (.82, .55, -.1)), "lowerarm01.R": ("aim", (-.82, .55, -.14)),
    }
    curl_hand(ops, h, "L", [(26, 40, 30)] * 4)
    curl_hand(ops, h, "R", [(26, 40, 30)] * 4)
    bake(h, ops, "adam26", {"hair": hair_adam, "scalp": scalp, "beard": beard_adam, "brow": brows})
    return h


def hair_eve(h, v):
    """Long dark hair that falls over the near shoulder and chest."""
    e = landmarks(h)
    crown = e + [0, -8.0, 11.0]
    hf = head_faces(h)
    down = down_of(h)
    def keep(c):
        d = c - e
        back = np.interp(d[:, 1], [-22, -15, -8, -4, 0, 3], [-16, -7, 2.0, 6.0, 7.2, 8.0])
        return d[:, 2] > back
    def field(p, t):
        d = p - e
        f = (p - crown) * [1, 1, .1]
        f[1] = min(f[1], 0) - 2.2
        f = f / (np.linalg.norm(f) + 1e-6) * max(0, 1 - t * 2.4) * .8
        f = f + down * [1, 0, 1] * (.45 + t * 1.5)
        if d[0] > 1.5 and d[2] < -15:                            # below the jaw, the near side falls forward over her chest
            f = f + np.array([.1, 1.0, 0])
        guard = np.clip((d[1] + 8.5) / 3, 0, 1) * np.clip((7 - d[2]) / 6, 0, 1) * (d[2] > -15)
        f = f + np.array([np.sign(d[0]) * .35, -3.2, 0]) * guard
        return f / np.linalg.norm(f)
    a = clumps(v, hf, keep, field, 240, 24, (46, 66), 20, 21, e - [0, 9, 0], clear=.6, width=.19, spread=3.0, hug=.34, collide=collider(h), all_faces=h.body)
    def band(c):
        d = c - e
        hl = np.interp(d[:, 1], [-22, -15, -8, -4, 0, 3], [-16, -7, 2.0, 6.0, 7.2, 8.0])
        return (d[:, 2] > hl) & (d[:, 2] < hl + 2.2)
    b = clumps(v, hf, band, field, 150, 12, (16, 26), 12, 22, e - [0, 9, 0], clear=.34, width=.13, spread=1.4, hug=.7, collide=collider(h), all_faces=h.body)
    return join(a, b)


def adam_s26r():
    """Refined pose: one hand clenched at his chest, pulled in tight."""
    h = Human(False, race=(.45, .3, .25), muscle=.7, weight=.25, older=.22, expr={"eye-left-closure": 1, "eye-right-closure": 1, "eyebrows-left-inner-up": .8, "eyebrows-right-inner-up": .8, "mouth-compression": .35})
    ops = {
        "spine03": ("rot", X, -3), "spine02": ("rot", X, -3), "spine01": ("rot", X, -3),
        "neck01": ("rot", X, -5), "neck02": ("rot", X, -5), "neck03": ("rot", X, -4), "head": ("rot", X, -5),
        "clavicle.L": [("rot", Y, 25), ("rot", Z, -16)], "clavicle.R": [("rot", Y, -25), ("rot", Z, 16)],
        "upperarm01.R": ("aim", (.22, .3, -.93)), "lowerarm01.R": ("aim", (-.82, .55, -.14)),
    }
    fore = reach(h, ops, "L", (3.0, 15.0, 45.0), (-.8, .1, -1))
    curl_hand(ops, h, "L", [(46, 62, 40), (50, 66, 42), (52, 66, 42), (54, 66, 42)], thumb=(16, 22, 18))
    curl_hand(ops, h, "R", [(26, 40, 30)] * 4)
    ops["wrist.L"] = ("aim", (.45, .3, .85))
    bake(h, ops, "adam26r", {"hair": hair_adam, "scalp": scalp, "beard": beard_adam, "brow": brows})
    return h


def two_bone(S, W, L1, L2, pole):
    d = W - S
    D = min(np.linalg.norm(d), (L1 + L2) * .985)
    u = d / np.linalg.norm(d)
    a = (L1 ** 2 - L2 ** 2 + D ** 2) / (2 * D)
    b = np.sqrt(max(L1 ** 2 - a ** 2, 0))
    n = pole - np.dot(pole, u) * u
    n = n / np.linalg.norm(n)
    E = S + u * a + n * b
    return (E - S) / L1, (S + u * D - E) / L2


def reach(h, ops, side, wrist, pole):
    S, El, Wr = (h.head_of(f"{b}.{side}") for b in ("upperarm01", "lowerarm01", "wrist"))
    a, b = two_bone(S, np.array(wrist, float), np.linalg.norm(El - S), np.linalg.norm(Wr - El), np.array(pole, float))
    ops[f"upperarm01.{side}"] = ("aim", a)
    ops[f"lowerarm01.{side}"] = ("aim", b)
    return b


def joint_at(h, bone):
    return h.apply(bone, h.head_of(bone)[None])[0]


def turn_palm(h, ops, side, axis, hand_dir, want):
    """Find the forearm twist that makes the palm face want."""
    best, score = 0, -9
    ops[f"wrist.{side}"] = ("aim", hand_dir)
    for a in range(-180, 180, 15):
        ops[f"lowerarm02.{side}"] = ("rot", axis, a)
        h.pose(ops)
        w = joint_at(h, f"wrist.{side}")
        n = np.cross(joint_at(h, f"finger2-1.{side}") - w, joint_at(h, f"finger5-1.{side}") - w)
        n = n / np.linalg.norm(n) * (1 if side == "L" else -1)
        s = float(np.dot(n, want))
        if s > score:
            best, score = a, s
    ops[f"lowerarm02.{side}"] = ("rot", axis, best)
    return best, score


T13 = np.array([0.0, -13.0, 53.0])      # where the fruit sits, in scene space


def eve_local(p):
    return np.array([-p[1], p[0] + 31, p[2]])


def adam_local(p):
    return np.array([p[1], 31 - p[0], p[2] + 2])


def adam_s13():
    h = Human(False, race=(.45, .3, .25), muscle=.7, weight=.25, older=.22, expr={"eye-left-slit": .6, "eye-right-slit": .6})
    ops = {"spine02": ("rot", X, -3), "neck01": ("rot", X, -6), "neck02": ("rot", X, -6), "neck03": ("rot", X, -5), "head": ("rot", X, -7),
           "upperarm01.R": ("aim", (.16, .05, -.98)), "lowerarm01.R": ("aim", (.08, .25, -.96))}
    W = adam_local(T13 + [14, -1, 8])
    fore = reach(h, ops, "L", W, (-.6, -.3, -1))
    curl_hand(ops, h, "L", [(26, 36, 26), (30, 40, 28), (32, 42, 30), (34, 44, 30)], thumb=(8, 12, 10))
    curl_hand(ops, h, "R", [(14, 20, 14)] * 4)
    print("adam palm", turn_palm(h, ops, "L", fore, adam_local(T13) - W, np.array([.0, .35, -.93])))
    bake(h, ops, "adam13", {"hair": hair_adam, "scalp": scalp, "beard": beard_adam, "brow": brows})
    return h


def eve_s13():
    h = Human(True, race=(.45, .3, .25), muscle=.45, weight=.4, expr={"eye-left-slit": .55, "eye-right-slit": .55})
    ops = {"neck01": ("rot", X, -5), "neck02": ("rot", X, -5), "neck03": ("rot", X, -4), "head": ("rot", X, -8),
           "upperarm01.L": ("aim", (-.16, .05, -.98)), "lowerarm01.L": ("aim", (-.08, .25, -.96))}
    W = eve_local(T13 + [-11, 0, -7])
    fore = reach(h, ops, "R", W, (.6, -.3, -1))
    curl_hand(ops, h, "R", [(12, 18, 14), (16, 22, 16), (18, 24, 16), (20, 26, 16)], thumb=(6, 8, 6))
    curl_hand(ops, h, "L", [(14, 20, 14)] * 4)
    print("eve palm", turn_palm(h, ops, "R", fore, eve_local(T13 + [2, 0, -5]) - W, np.array([0, 0, 1.0])))
    bake(h, ops, "eve13", {"hair": hair_eve, "scalp": scalp, "brow": brows})
    np.savez(A / "fruit13.npz", c=T13)
    return h


if __name__ == "__main__":
    which = sys.argv[1:] or ["adam26"]
    for w in which:
        {"adam26": adam_s26, "adam26r": adam_s26r, "adam13": adam_s13, "eve13": eve_s13}[w]()
