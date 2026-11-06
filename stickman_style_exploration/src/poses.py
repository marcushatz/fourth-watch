"""One shared cast for every style. Adult stick figures, about 7.5 heads tall, with long limbs and no faces.

Coordinates are head-widths: x across the frame, z up from the ground, d depth (toward the camera is negative).
Feeling comes from posture, spacing and the head's angle, never from a face.
"""
import numpy as np

W, H = 1080, 1920


def J(x, z, d=0.0):
    return np.array([x, z, d], float)


AWE = dict(  # seen from behind, head tipped back, arms loose and a little away from the body
    head=J(-.10, 7.02), neck=J(-.03, 6.42), chest=J(.02, 5.98), waist=J(.06, 4.9), pelvis=J(.06, 3.72),
    arm_a=[J(-.48, 4.82, -.2), J(-.70, 3.68, -.25)], arm_b=[J(.56, 4.82, .2), J(.80, 3.70, .25)],
    leg_a=[J(-.20, 1.86, -.2), J(-.42, 0, -.25)], leg_b=[J(.33, 1.86, .2), J(.50, 0, .25)])

EVE = dict(  # she leans in, weight forward, arm out with the fruit
    head=J(.56, 6.44), neck=J(.34, 5.92), chest=J(.22, 5.5), waist=J(.08, 4.5), pelvis=J(.02, 3.42),
    arm_a=[J(1.26, 5.04, -.3), J(2.28, 5.46, -.35)], arm_b=[J(-.46, 4.62, .3), J(-.56, 3.62, .35)],
    leg_a=[J(.56, 1.72, -.2), J(.82, 0, -.25)], leg_b=[J(-.20, 1.74, .2), J(-.62, 0, .25)],
    hair=[[J(.62, 6.80), J(.22, 6.72), J(-.08, 6.2), J(-.16, 5.5), J(-.06, 4.86)]])
ADAM = dict(  # weight on the back foot, chest drawn away, one hand half out, the other at his own chest
    head=J(.10, 6.98), neck=J(.32, 6.44), chest=J(.46, 6.02), waist=J(.44, 4.92), pelvis=J(.30, 3.72),
    arm_a=[J(-.42, 5.0, -.3), J(-1.08, 5.46, -.35)], arm_b=[J(1.16, 5.2, .3), J(.42, 5.62, .35)],
    leg_a=[J(-.10, 1.86, -.2), J(-.46, 0, -.25)], leg_b=[J(.86, 1.82, .2), J(1.28, 0, .25)])
FEAR = dict(  # seated on the ground at the foot of the tree, back curved, head bowed on his knees, arms locked round his shins
    head=J(.38, 2.56), neck=J(-.16, 2.68), chest=J(-.66, 2.26), waist=J(-1.08, 1.24), pelvis=J(-.92, .17),
    arm_a=[J(.06, 1.40, -.3), J(1.02, 1.0, -.35)], arm_b=[J(-.02, 1.6, .3), J(.86, 1.3, .3)],
    leg_a=[J(.58, 1.86, -.2), J(1.38, 0, -.25)], leg_b=[J(.28, 1.76, .2), J(1.02, 0, .25)])

FRUIT_EVE = J(2.40, 5.78)     # just above her open hand, in her own space


def to_px(p, ox, gy, u, flip=False):
    q = np.asarray(p, float)
    x = q[..., 0] * (-1 if flip else 1)
    return np.stack([ox + x * u, gy - q[..., 1] * u], -1)


def limbs(f):
    """Named polylines: spine, two arms, two legs, in depth order, far side first."""
    return dict(leg_b=[f["pelvis"], *f["leg_b"]], arm_b=[f["chest"], *f["arm_b"]], spine=[f["neck"], f["chest"], f["waist"], f["pelvis"]],
                leg_a=[f["pelvis"], *f["leg_a"]], arm_a=[f["chest"], *f["arm_a"]])


SCENES = {
    "a": [dict(pose=AWE, ox=540, gy=1505, u=24, flip=False, name="man")],
    "b": [dict(pose=EVE, ox=312, gy=1516, u=88, flip=False, name="eve", scale=.95), dict(pose=ADAM, ox=772, gy=1516, u=88, flip=False, name="adam")],
    "c": [dict(pose=FEAR, ox=650, gy=1590, u=104, flip=False, name="man")],
}
LIGHT_C = (178, 1130)      # the distant warm light in scene C
TRUNK_C = 500              # the tree he shelters behind in scene C


def figures(scene):
    """Each figure in pixels: head centre, head radius, and limb polylines."""
    out = []
    for s in SCENES[scene]:
        u = s["u"] * s.get("scale", 1)
        p = {}
        for k, v in s["pose"].items():
            if k == "hair":
                p[k] = [to_px(np.array(h), s["ox"], s["gy"], u, s["flip"]) for h in v]
            elif isinstance(v, list):
                p[k] = [to_px(j, s["ox"], s["gy"], u, s["flip"]) for j in v]
            else:
                p[k] = to_px(v, s["ox"], s["gy"], u, s["flip"])
        lim = {k: np.array([to_px(j, s["ox"], s["gy"], u, s["flip"]) for j in v]) for k, v in limbs(s["pose"]).items()}
        d = dict(name=s["name"], u=u, head=p["head"], head_r=u * .40, limbs=lim, hair=p.get("hair", []))
        out.append(d)
    return out


def fruit_px():
    e = SCENES["b"][0]
    return to_px(FRUIT_EVE, e["ox"], e["gy"], e["u"] * e.get("scale", 1))


def smooth(pts, n=10, tension=.5):
    """Catmull-Rom through the joints, for hand-drawn limbs."""
    p = np.asarray(pts, float)
    if len(p) < 3:
        return p
    q = np.vstack([2 * p[0] - p[1], p, 2 * p[-1] - p[-2]])
    t = np.linspace(0, 1, n, endpoint=False)[:, None]
    out = []
    for i in range(1, len(q) - 2):
        a, b, c, d = q[i - 1], q[i], q[i + 1], q[i + 2]
        out.append(.5 * ((2 * b) + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t ** 2 + (3 * b - a - 3 * c + d) * t ** 3))
    return np.vstack(out + [p[-1:]])


def taper(path, w0, w1, n=16, tension=.5, mid=None):
    """A closed polygon around a path, width w0 at the start and w1 at the end, with an optional swell."""
    c = smooth(path, n, tension)
    d = np.gradient(c, axis=0)
    q = np.stack([-d[:, 1], d[:, 0]], 1) / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-6)
    t = np.linspace(0, 1, len(c))
    w = w0 + (w1 - w0) * t
    if mid:
        w = w + mid * np.sin(np.pi * t)
    return np.vstack([c + q * w[:, None] / 2, (c - q * w[:, None] / 2)[::-1]])
