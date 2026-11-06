"""The hybrid cast: adult stick figures with shoulders, hands, feet and simple profile faces.

Poses are in head units (x right, z up from the ground). A figure is built into parts (tubes for limbs,
an egg-shaped head, hands made of palm, fingers and thumb), then drawn in one of three treatments:
A painterly, B editorial, C storybook. Everything is drawn at 3x and reduced, in linear light."""
import numpy as np
import cv2
from scipy.spatial import cKDTree

SS = 3


def J(x, z):
    return np.array([x, z], float)


def hexc(s):
    s = s.lstrip("#")
    return (np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255) ** 2.2


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1)
    return t * t * (3 - 2 * t)


def spline(pts, n=14):
    pts = np.asarray(pts, float)
    if len(pts) == 2:
        t = np.linspace(0, 1, n + 1)[:, None]
        return pts[0] * (1 - t) + pts[1] * t
    P = np.vstack([2 * pts[0] - pts[1], pts, 2 * pts[-1] - pts[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    return np.array(out)


def resample(c, step):
    d = np.linalg.norm(np.diff(c, axis=0), axis=1)
    L = np.r_[0, np.cumsum(d)]
    m = max(int(L[-1] / step), 3)
    s = np.linspace(0, L[-1], m)
    return np.stack([np.interp(s, L, c[:, 0]), np.interp(s, L, c[:, 1])], 1), s


# ---------------------------------------------------------------- poses

ADAM_AWE = dict(
    facing=-1, tilt=54, eye="open", brow=.03,
    head=J(.10, 7.60), neck=J(.20, 6.88), chest=J(.10, 6.25), waist=J(.02, 5.25), pelvis=J(.05, 4.30),
    arm_n=[J(.12, 6.62), J(-.16, 5.22), J(-.56, 4.50)], hand_n=dict(t="open", ang=-150, flip=True),
    arm_f=[J(.26, 6.66), J(.40, 5.18), J(.38, 3.97)], hand_f=dict(t="relaxed", ang=-96, flip=True),
    leg_n=[J(.0, 4.30), J(-.28, 2.22), J(-.42, .22)], foot_n=J(-.94, .04),
    leg_f=[J(.12, 4.30), J(.18, 2.20), J(.24, .20)], foot_f=J(-.30, .03),
    order=["leg_f", "arm_f", "torso", "neck", "head", "leg_n", "arm_n"])

ADAM_TENSION = dict(
    facing=-1, tilt=-16, eye="down", brow=.05,
    head=J(.24, 7.58), neck=J(.36, 6.86), chest=J(.26, 6.22), waist=J(.10, 5.25), pelvis=J(.0, 4.30),
    arm_f=[J(.42, 6.66), J(-.34, 5.74), J(-1.0, 5.94)], hand_f=dict(t="hesitant", ang=172, flip=True),
    arm_n=[J(.30, 6.62), J(.76, 5.66), J(.24, 5.98)], hand_n=dict(t="fist", ang=150, flip=True),
    leg_f=[J(.0, 4.30), J(-.32, 2.24), J(-.55, .20)], foot_f=J(-1.05, .03),
    leg_n=[J(.08, 4.30), J(.42, 2.20), J(.62, .20)], foot_n=J(.12, .03),
    order=["leg_f", "arm_f", "torso", "neck", "head", "leg_n", "arm_n"])

EVE_TENSION = dict(
    facing=1, tilt=7, eye="open", brow=0.0, female=True,
    head=J(.50, 7.50), neck=J(.38, 6.76), chest=J(.26, 6.12), waist=J(.10, 5.12), pelvis=J(.0, 4.20),
    arm_n=[J(.32, 6.55), J(1.18, 5.95), J(1.98, 5.94)], hand_n=dict(t="offer", ang=-2, flip=False),
    arm_f=[J(.22, 6.58), J(.0, 5.36), J(.08, 4.25)], hand_f=dict(t="relaxed", ang=-84, flip=False),
    leg_n=[J(.06, 4.20), J(.62, 2.22), J(.78, .20)], foot_n=J(1.26, .03),
    leg_f=[J(-.02, 4.20), J(-.18, 2.16), J(-.62, .36)], foot_f=J(-.22, .0),
    hair=[[J(.34, 7.84), J(.08, 7.74), J(-.10, 7.24), J(-.16, 6.48), J(-.08, 5.78)],
          [J(.30, 7.80), J(.04, 7.58), J(-.02, 6.98), J(-.04, 6.34), J(.04, 5.92)],
          [J(.28, 7.74), J(.02, 7.40), J(.10, 6.92), J(.16, 6.56)]],
    order=["leg_f", "arm_f", "torso", "hair", "neck", "head", "leg_n", "arm_n"])

ADAM_FEAR = dict(
    facing=1, tilt=-64, eye="closed", brow=.04, leaves=True,
    head=J(1.04, 2.80), neck=J(.62, 3.10), chest=J(.24, 2.55), waist=J(-.02, 1.55), pelvis=J(.0, .50),
    leg_f=[J(.0, .52), J(1.12, 1.94), J(1.42, .24)], foot_f=J(1.86, .04),
    leg_n=[J(.08, .50), J(1.28, 2.04), J(1.62, .22)], foot_n=J(2.06, .04),
    arm_n=[J(.50, 2.86), J(1.06, 1.48), J(1.56, 1.22)], hand_n=dict(t="fist", ang=196, flip=True),
    arm_f=[J(.58, 3.00), J(1.12, 3.56), J(1.36, 3.14)], hand_f=dict(t="cover", ang=-62, flip=False),
    order=["leg_f", "torso", "neck", "leg_n", "leaves", "head", "arm_n", "arm_f"])


# ---------------------------------------------------------------- hands (local units: x along the hand, y its upper side)

def _finger(base, ang, L, curl, w0, w1):
    a1, a2 = np.deg2rad(ang), np.deg2rad(ang + curl)
    p1 = base + L * .55 * np.array([np.cos(a1), np.sin(a1)])
    p2 = p1 + L * .45 * np.array([np.cos(a2), np.sin(a2)])
    return [base, p1, p2], (w0, w1)


def hand_shape(t):
    """Palm, fingers and thumb as (path, (w0, w1)) in local hand units."""
    P = np.array
    if t == "relaxed":
        return [([P([0, 0]), P([.15, .0]), P([.27, .0])], (.15, .14)),
                ([P([.24, 0]), P([.37, .0]), P([.46, .03]), P([.51, .075])], (.125, .05)),
                ([P([.05, .05]), P([.14, .10]), P([.21, .12])], (.065, .04))]
    if t in ("hesitant", "cover", "open"):
        curl = {"hesitant": -16, "cover": -34, "open": -8}[t]
        spread = {"hesitant": 1.0, "cover": .8, "open": 1.25}[t]
        out = [([P([0, 0]), P([.14, 0]), P([.25, 0])], (.16, .16))]
        for i, (a, L) in enumerate(zip((-15, -5, 5, 15), (.22, .27, .28, .24))):
            out.append(_finger(P([.23, -.05 + i * .033]), a * spread, L, curl, .048, .03))
        out.append(_finger(P([.05, .07]), 54, .2, -22, .058, .036))
        return out
    if t == "offer":
        return [([P([0, 0]), P([.15, .0]), P([.27, .02])], (.16, .155)),
                ([P([.24, .01]), P([.35, .05]), P([.41, .14]), P([.40, .23])], (.10, .045)),
                ([P([.07, .06]), P([.13, .15]), P([.19, .22])], (.056, .034))]
    if t == "flat":
        return [([P([0, 0]), P([.15, 0]), P([.28, 0])], (.15, .145)),
                ([P([.26, 0]), P([.42, .005]), P([.54, -.01])], (.12, .055)),
                ([P([.06, .06]), P([.15, .10]), P([.21, .11])], (.06, .038))]
    if t == "fist":
        return [([P([0, 0]), P([.09, 0]), P([.17, 0])], (.18, .18)),
                ([P([.13, .065]), P([.25, .045]), P([.28, -.04]), P([.21, -.10])], (.12, .08)),
                ([P([.05, .08]), P([.13, .11]), P([.19, .09])], (.062, .045))]
    raise ValueError(t)


# ---------------------------------------------------------------- parts

class Placer:
    def __init__(s, ox, gy, u, scale=1.0):
        s.ox, s.gy, s.k = ox, gy, u * scale

    def p(s, q):
        q = np.asarray(q, float)
        return np.stack([s.ox + q[..., 0] * s.k, s.gy - q[..., 1] * s.k], -1)

    def v(s, q):
        q = np.asarray(q, float)
        return np.stack([q[..., 0] * s.k, -q[..., 1] * s.k], -1)


def interp_w(ctrl, widths, frac):
    ctrl = np.asarray(ctrl, float)
    if len(widths) != len(ctrl):
        return np.interp(frac, np.linspace(0, 1, len(widths)), widths)
    ch = np.r_[0, np.cumsum(np.linalg.norm(np.diff(ctrl, axis=0), axis=1))]
    ch = ch / max(ch[-1], 1e-6)
    return np.interp(frac, ch, widths)


def figure_parts(pose, ox, gy, u, scale=1.0):
    """Every part of a figure in screen pixels, in draw order."""
    pl = Placer(ox, gy, u, scale)
    k = pl.k
    fem = pose.get("female", False)
    s = pose["facing"]
    parts = {}

    def tube(ctrl_u, widths_u, role="body", far=False, smooth=True, tag=None):
        return dict(kind="tube", ctrl=pl.p(np.array(ctrl_u)), w=np.array(widths_u) * k, role=role, far=far, smooth=smooth, tag=tag)

    def limb(key, wid):
        pts = pose[key]
        return tube(pts, wid, far=key.endswith("_f"), tag=key)

    def hand(key):
        arm = pose["arm_" + key[-1]]
        h = pose["hand_" + key[-1]]
        a = np.deg2rad(h["ang"])
        fx = np.array([np.cos(a), np.sin(a)])
        fy = np.array([-fx[1], fx[0]]) * (-1 if h["flip"] else 1)
        sc = .94 if fem else 1.0
        wrist = arm[-1]
        out = []
        for path, (w0, w1) in hand_shape(h["t"]):
            q = [wrist + (p[0] * fx + p[1] * fy) * sc for p in path]
            out.append(tube(q, [w0 * sc, w1 * sc], far=key.endswith("_f"), smooth=len(q) > 2, tag="hand"))
        fruit = None
        if h["t"] == "offer" or h.get("fruit"):
            # `fruit_at` places it at a point of the pose; otherwise it sits in the cupped hand.
            c = np.asarray(h["fruit_at"], float) if "fruit_at" in h else wrist + (.22 * fx + .27 * fy) * sc
            fruit = dict(kind="fruit", c=pl.p(c), r=.25 * k * sc, bite=h.get("bite"))
        return out, fruit

    arm_w = [.13, .106, .084] if not fem else [.116, .096, .076]
    leg_w = [.172, .13, .092] if not fem else [.156, .12, .086]
    for side in ("n", "f"):
        parts["arm_" + side] = [limb("arm_" + side, arm_w)]
        hs, fruit = hand("hand_" + side)
        if fruit:
            parts["arm_" + side] += [hs[0], fruit] + hs[1:]
        else:
            parts["arm_" + side] += hs
        leg = pose["leg_" + side]
        ank, toe = leg[-1], pose["foot_" + side]
        mid = ank + (toe - ank) * .4 + J(0, -.05)
        foot = tube([ank + (ank - toe) * .06, mid, toe], [.11, .1, .05], far=side == "f", tag="foot")
        parts["leg_" + side] = [limb("leg_" + side, leg_w), foot]
    sp = [pose["neck"], pose["chest"], pose["waist"], pose["pelvis"]]
    tw = np.array([.13, .33, .36, .24, .25, .19]) * (.88 if fem else 1.0)
    c = spline(np.array(sp), 14)
    cs, ss = resample(c, .02)
    frac = ss / ss[-1]
    widths = np.interp(frac, [0, .12, .3, .62, .86, 1], tw)
    parts["torso"] = [dict(kind="tube", ctrl=pl.p(cs), w=widths * k, role="body", far=False, smooth=False, tag="torso", dense=True)]
    hd = pose["head"]
    t = np.deg2rad(pose["tilt"])
    ex = np.array([s * np.cos(t), np.sin(t)])
    ey = np.array([-s * np.sin(t), np.cos(t)])
    attach = hd + (-.06 * ex - .30 * ey)
    parts["neck"] = [tube([pose["neck"], attach], [.115, .1], tag="neck")]
    a, b = (.34, .43) if fem else (.36, .45)
    parts["head"] = [dict(kind="head", c=pl.p(hd), ex=pl.v(ex) / k, ey=pl.v(ey) / k, a=a * k, b=b * k, k=k,
                          eye=pose["eye"], brow=pose["brow"], hair="eve" if fem else "adam")]
    if "hair" in pose:
        hw = [[.34, .3, .24, .15, .05], [.3, .26, .2, .12, .05], [.24, .2, .14, .05]]
        parts["hair"] = [tube(h, hw[i][:len(h)], role="hair", tag="hair") for i, h in enumerate(pose["hair"])]
    if pose.get("leaves"):
        lv = []
        for i, (x, z, ang) in enumerate(((-.26, 1.06, -132), (-.04, .94, -104), (.2, .9, -78), (.42, 1.0, -52))):
            lv.append(dict(kind="leaf", c=pl.p(J(x, z)), ang=ang, size=.46 * k, seed=i))
        parts["leaves"] = lv
    out = []
    for key in pose["order"]:
        out += parts.get(key, [])
    return out


# ---------------------------------------------------------------- drawing

STYLE = {
    "A": dict(soft=.42, wob=.1, press=.16, cel=False, dry=.45, tex=.22, line=dict(w=3.8, k=.9, side=.85, broken=.7), sep=.75, bounce=.0),
    "B": dict(wob=.018, press=.03, cel=True, dry=0.0, tex=0.0, line=dict(w=3.0, k=1.0, side=.0, broken=0.0), sep=.9, bounce=.0),
    "C": dict(soft=.55, wob=.045, press=.06, cel=False, dry=.06, tex=.05, line=dict(w=2.8, k=.8, side=.4, broken=.25), sep=.6, bounce=.18),
}


def _noise1(s, seed, scale):
    r = np.random.default_rng(seed)
    o = np.zeros_like(s)
    for i, per in enumerate((scale * 5, scale * 2.2, scale * 1.0)):
        o += r.uniform(.6, 1) * np.sin(s / per * 6.283 + r.uniform(0, 6.283)) * .55 ** i
    return o


class Canvas:
    def __init__(s, x0, y0, w, h, style, light, seed=0, u=96):
        s.x0, s.y0 = x0, y0
        s.w, s.h = w * SS, h * SS
        s.rgb = np.zeros((s.h, s.w, 3), np.float32)
        s.a = np.zeros((s.h, s.w), np.float32)
        s.normal = np.zeros((s.h, s.w, 3), np.float32)
        s.st = STYLE[style]
        s.style = style
        s.L = light
        s.r = np.random.default_rng(seed)
        s.seed = seed
        s.lw_k = float(np.clip(u / 96, .45, 1.25))

    def c(s, p):
        return (np.asarray(p, float) - [s.x0, s.y0]) * SS

    # -- light
    def shade(s, alb, nx, ny, nz, occ=None):
        L = s.L
        l = np.array(L["dir"], np.float32)
        l = l / np.linalg.norm(l)
        raw = nx * l[0] + ny * l[1] + nz * l[2]
        soft = s.st.get("soft", .4)
        diff = smoothstep(-soft, soft * 1.2, raw)
        r = np.sqrt(nx * nx + ny * ny) + 1e-6
        lxy = l[:2] / (np.linalg.norm(l[:2]) + 1e-6)
        face = np.clip((nx * lxy[0] + ny * lxy[1]) / r, 0, 1)
        rim = smoothstep(.62, .97, r) * face ** 1.5
        if s.st["cel"]:
            diff = smoothstep(-.06, .04, raw) * .85 + .15
            rim = smoothstep(.84, .9, r) * smoothstep(.35, .5, face)
        if occ is not None:
            diff = diff * occ
            rim = rim * occ
        key = np.array(L["col"], np.float32) * L.get("k", 1.0)
        amb = np.array(L["amb"], np.float32)
        bounce = s.st["bounce"] * np.clip(ny, 0, 1)[..., None] * np.array(L.get("bounce", L["amb"]), np.float32) * 3
        col = alb * (amb + key * diff[..., None] + bounce) + key * rim[..., None] * L.get("rim", .8)
        if "fill" in L:
            f = np.array(L["fill"]["dir"], np.float32)
            f /= np.linalg.norm(f)
            fd = np.clip((nx * f[0] + ny * f[1] + nz * f[2] + .3) / 1.3, 0, 1)
            col = col + alb * np.array(L["fill"]["col"], np.float32) * fd[..., None]
        return col

    def put(s, alpha, col, nrm=None, box=None):
        y0, y1, x0, x1 = box
        A = s.a[y0:y1, x0:x1]
        if s.st["sep"] and A.max() > 0:
            k = max(int(s.st["line"]["w"] * SS * .9 * s.lw_k), 2)
            dil = cv2.dilate(alpha, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1)))
            band = np.clip(dil - alpha, 0, 1) * A * s.st["sep"]
            s.rgb[y0:y1, x0:x1] *= (1 - band[..., None] * .72)
        s.rgb[y0:y1, x0:x1] = s.rgb[y0:y1, x0:x1] * (1 - alpha[..., None]) + col * alpha[..., None]
        if nrm is not None:
            s.normal[y0:y1, x0:x1] = s.normal[y0:y1, x0:x1] * (1 - alpha[..., None]) + nrm * alpha[..., None]
        s.a[y0:y1, x0:x1] = A + alpha * (1 - A)

    def box_of(s, pts, pad):
        pts = np.asarray(pts)
        x0 = int(max(pts[:, 0].min() - pad, 0))
        x1 = int(min(pts[:, 0].max() + pad + 1, s.w))
        y0 = int(max(pts[:, 1].min() - pad, 0))
        y1 = int(min(pts[:, 1].max() + pad + 1, s.h))
        return y0, y1, x0, x1

    # -- primitives
    def tube(s, part, alb, occ_full=None, flat=False, alpha_k=1.0):
        ctrl = s.c(part["ctrl"])
        w = part["w"] * SS
        if part.get("dense"):
            c = ctrl
            frac = np.linspace(0, 1, len(c))
            ww = w
        else:
            c = spline(ctrl, 14) if part["smooth"] and len(ctrl) > 2 else spline(ctrl, 12)
            frac_c = None
            ww = None
        c, sarc = resample(c, 1.0)
        frac = sarc / max(sarc[-1], 1e-6)
        if part.get("dense"):
            ww = np.interp(frac, np.linspace(0, 1, len(w)), w)
        else:
            ww = interp_w(ctrl, w, frac)
        st = s.st
        seed = int(s.r.integers(1 << 30))
        ww = ww * (1 + st["press"] * _noise1(sarc, seed + 7, max(ww.mean() * 4, 6)))
        d = np.gradient(c, axis=0)
        d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
        nrm = np.stack([-d[:, 1], d[:, 0]], 1)
        sc = max(ww.mean() * 2.5, 5)
        hl = ww / 2 * (1 + st["wob"] * _noise1(sarc, seed, sc))
        hr = ww / 2 * (1 + st["wob"] * _noise1(sarc, seed + 1, sc))
        left = c + nrm * hl[:, None]
        right = c - nrm * hr[:, None]
        a0 = np.arctan2(nrm[-1, 1], nrm[-1, 0])
        th = a0 - np.linspace(0, np.pi, 9)
        cap_e = c[-1] + np.stack([np.cos(th), np.sin(th)], 1) * ww[-1] / 2
        a1 = np.arctan2(-nrm[0, 1], -nrm[0, 0])
        th = a1 - np.linspace(0, np.pi, 9)
        cap_s = c[0] + np.stack([np.cos(th), np.sin(th)], 1) * ww[0] / 2
        poly = np.vstack([left, cap_e, right[::-1], cap_s])
        box = s.box_of(poly, 3)
        y0, y1, x0, x1 = box
        if y1 <= y0 or x1 <= x0:
            return
        m = np.zeros((y1 - y0, x1 - x0), np.uint8)
        cv2.fillPoly(m, [np.round((poly - [x0, y0]) * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)
        alpha = m.astype(np.float32) / 255
        ys, xs = np.nonzero(m)
        P = np.stack([xs + x0 + .5, ys + y0 + .5], 1)
        dist, idx = cKDTree(c).query(P)
        q = (P - c[idx]) / (ww[idx, None] / 2)
        nx = np.zeros(m.shape, np.float32)
        ny = np.zeros(m.shape, np.float32)
        rr = np.clip(np.linalg.norm(q, axis=1), 0, 1)
        qn = q / (np.linalg.norm(q, axis=1, keepdims=True) + 1e-9) * rr[:, None]
        nx[ys, xs], ny[ys, xs] = qn[:, 0], qn[:, 1]
        nz = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1))
        # Along-stroke coordinate, for dry brush at the ends of a mark.
        along = np.zeros(m.shape, np.float32)
        along[ys, xs] = frac[idx]
        occ = None
        if occ_full is not None:
            occ = cv2.resize(occ_full, (s.w, s.h), interpolation=cv2.INTER_LINEAR)[y0:y1, x0:x1] if occ_full.shape != (s.h, s.w) else occ_full[y0:y1, x0:x1]
        if flat:
            col = np.broadcast_to(alb, (*m.shape, 3)).astype(np.float32).copy()
        else:
            col = s.shade(alb, nx, ny, nz, occ)
        if st["tex"]:
            streak = s.streak(m.shape, d[idx].mean(0), seed)
            col = col * (1 + st["tex"] * streak[..., None])
        if st["dry"] and not flat:
            g = s.grain(m.shape, seed + 3)
            ends = smoothstep(.72, 1.0, along) + smoothstep(.12, .0, along) * .3
            edge = smoothstep(.55, 1.0, np.sqrt(nx * nx + ny * ny))
            cut = st["dry"] * (ends * .9 + edge * .55)
            alpha = alpha * np.clip(1 - smoothstep(.35, .85, g + cut - .35) * cut * 2.2, 0, 1)
        s.put(alpha * alpha_k, col, np.dstack([nx, ny, nz]), box)

    def streak(s, shape, direction, seed):
        h, w = shape
        r = np.random.default_rng(seed)
        n = r.normal(0, 1, (h, w)).astype(np.float32)
        ang = np.degrees(np.arctan2(direction[1], direction[0]))
        M = cv2.getRotationMatrix2D((w / 2, h / 2), ang, 1)
        n = cv2.warpAffine(n, M, (w, h), borderMode=cv2.BORDER_REFLECT)
        n = cv2.GaussianBlur(n, (0, 0), sigmaX=9 * SS / 3 + 1, sigmaY=.8)
        M = cv2.getRotationMatrix2D((w / 2, h / 2), -ang, 1)
        n = cv2.warpAffine(n, M, (w, h), borderMode=cv2.BORDER_REFLECT)
        return n / (n.std() + 1e-6) * .5

    def grain(s, shape, seed):
        r = np.random.default_rng(seed)
        g = cv2.GaussianBlur(r.random(shape).astype(np.float32), (0, 0), 1.2)
        return (g - g.min()) / (g.max() - g.min() + 1e-6)

    def hairmass(s, strands, pal, occ_full=None):
        """Long hair as one flowing mass, shaded as a whole, with a few strand lines drawn into it."""
        polys, cents = [], []
        for part in strands:
            g = s.geom(part)
            polys.append(g[0])
            cents.append(g)
        allp = np.vstack(polys)
        box = s.box_of(allp, 4)
        y0, y1, x0, x1 = box
        m = np.zeros((y1 - y0, x1 - x0), np.uint8)
        for q in polys:
            cv2.fillPoly(m, [np.round((q - [x0, y0]) * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)
        al = m.astype(np.float32) / 255
        sig = max(np.mean([g[2].mean() for g in cents]) * .3, 2)
        bl = cv2.GaussianBlur(al, (0, 0), sig)
        gy, gx = np.gradient(bl)
        nx, ny = -gx * sig * 2.6, -gy * sig * 2.6
        mag = np.sqrt(nx * nx + ny * ny)
        sc = np.minimum(1, 1 / (mag + 1e-6))
        nx, ny = nx * sc, ny * sc
        nz = np.sqrt(np.clip(1 - nx * nx - ny * ny, 0, 1))
        occ = None
        if occ_full is not None:
            occ = occ_full[y0:y1, x0:x1]
        rim0 = s.L.get("rim", .8)
        s.L = dict(s.L, rim=rim0 * (.25 if s.st["cel"] else 1.0))
        col = s.shade(pal["hair"], nx, ny, nz, occ)
        s.L = dict(s.L, rim=rim0)
        s.put(al, col, None, box)
        for i, (poly, c, ww, nrm) in enumerate(cents):
            for k, off in enumerate((-.25, .18)):
                q = c + nrm * (ww * off)[:, None]
                q = q[: int(len(q) * (.92 - .1 * k))]
                tone = pal["hair"] * (1.9 if k == 0 else .55)
                s.tube(dict(ctrl=q / SS + [s.x0, s.y0], w=np.array([.9, .4]) * max(ww.mean() / SS * .09, .8), smooth=False), tone, flat=True, alpha_k=.55)

    def geom(s, part):
        ctrl = s.c(part["ctrl"])
        w = part["w"] * SS
        c = spline(ctrl, 14) if len(ctrl) > 2 else spline(ctrl, 12)
        c, sarc = resample(c, 1.0)
        frac = sarc / max(sarc[-1], 1e-6)
        ww = interp_w(ctrl, w, frac)
        d = np.gradient(c, axis=0)
        d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
        nrm = np.stack([-d[:, 1], d[:, 0]], 1)
        left, right = c + nrm * (ww / 2)[:, None], c - nrm * (ww / 2)[:, None]
        a0 = np.arctan2(nrm[-1, 1], nrm[-1, 0])
        th = a0 - np.linspace(0, np.pi, 9)
        cap_e = c[-1] + np.stack([np.cos(th), np.sin(th)], 1) * ww[-1] / 2
        a1 = np.arctan2(-nrm[0, 1], -nrm[0, 0])
        th = a1 - np.linspace(0, np.pi, 9)
        cap_s = c[0] + np.stack([np.cos(th), np.sin(th)], 1) * ww[0] / 2
        return np.vstack([left, cap_e, right[::-1], cap_s]), c, ww, nrm

    def head(s, part, pal, occ_full=None):
        c = s.c(part["c"])
        ex, ey = np.array(part["ex"]), np.array(part["ey"])
        a, b = part["a"] * SS, part["b"] * SS
        k = part["k"] * SS
        th = np.linspace(0, 2 * np.pi, 220, endpoint=False)

        def bump(t0, amp, wd):
            dd = np.angle(np.exp(1j * (th - t0)))
            return amp * np.exp(-(dd / wd) ** 2)

        rad = 1 + bump(-.14, .19, .11) + bump(2.5, .045, .7) + bump(-.95, .03, .22) + bump(-1.75, -.05, .45)
        lx, ly = a * np.cos(th) * rad, b * np.sin(th) * rad
        poly = c + lx[:, None] * ex + ly[:, None] * ey
        hair_scale = 1.09 if part["hair"] == "eve" else 1.06
        polyh = c + (lx[:, None] * ex + ly[:, None] * ey) * hair_scale
        box = s.box_of(polyh, 6)
        y0, y1, x0, x1 = box
        m = np.zeros((y1 - y0, x1 - x0), np.uint8)
        cv2.fillPoly(m, [np.round((poly - [x0, y0]) * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5
        qx, qy = xx - c[0], yy - c[1]
        xl = (qx * ex[0] + qy * ex[1]) / a
        yl = (qx * ey[0] + qy * ey[1]) / b
        r2 = np.clip(xl * xl + yl * yl, 0, 1)
        nzz = np.sqrt(1 - r2)
        nx = xl * ex[0] + yl * ey[0]
        ny = xl * ex[1] + yl * ey[1]
        nn = np.sqrt(nx * nx + ny * ny) + 1e-6
        sc = np.sqrt(r2) / nn
        nx, ny = nx * sc, ny * sc
        occ = None
        if occ_full is not None:
            occ = cv2.resize(occ_full, (s.w, s.h))[y0:y1, x0:x1]
        alpha = m.astype(np.float32) / 255
        rim0 = s.L.get("rim", .8)
        s.L = dict(s.L, rim=rim0 * .3)
        col = s.shade(pal["body"], nx, ny, nzz, occ)
        s.L = dict(s.L, rim=rim0)
        if s.st["tex"]:
            col = col * (1 + s.st["tex"] * .7 * s.streak(m.shape, ex, s.seed + 11)[..., None])
        s.put(alpha, col, np.dstack([nx, ny, nzz]), box)
        # Hair cap, and Adam's beard.
        mh = np.zeros_like(m)
        cv2.fillPoly(mh, [np.round((polyh - [x0, y0]) * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)
        inside = mh.astype(np.float32) / 255
        rr = np.sqrt(xl * xl + yl * yl)
        if part["hair"] == "eve":
            line = -.42 + 1.1 * smoothstep(-.55, .5, xl)
            cap = smoothstep(line - .04, line + .04, yl)
        else:
            line = -.12 + .8 * smoothstep(-.62, .42, xl)
            cap = smoothstep(line - .03, line + .03, yl) * smoothstep(-.4, -.28, yl)
            beard = smoothstep(-.18, -.3, yl) * smoothstep(.66, .74, rr) * smoothstep(.8, .7, xl) * smoothstep(-.6, -.48, xl)
            side = smoothstep(-.5, -.62, xl) * smoothstep(.2, .05, yl) * smoothstep(.7, .8, rr) * smoothstep(-.32, -.2, yl)
            cap = np.maximum(cap, np.maximum(beard, side) * .92)
        ha = inside * cap
        s.L = dict(s.L, rim=rim0 * (.07 if s.st["cel"] else .22))  # a cel rim is a solid band, so keep it faint on hair
        hcol = s.shade(pal["hair"], nx * .9, ny * .9, np.maximum(nzz, .25), occ)
        s.L = dict(s.L, rim=rim0)
        s.put(ha, hcol, None, box)
        # Eye and brow: one or two short strokes of the hair colour.
        def local(px, py):
            return c + (px * a) * ex + (py * b) * ey
        eye = part["eye"]
        if eye == "open":
            pts = [local(.26, .13), local(.39, .14), local(.52, .11)]
        elif eye == "down":
            pts = [local(.26, .12), local(.39, .1), local(.51, .06)]
        else:
            pts = [local(.26, .1), local(.39, .07), local(.5, .085)]
        bw = part["brow"]
        brow = [local(.2, .31), local(.38, .335 + bw), local(.55, .32 + bw * 2.2)]
        for pp, wd in ((pts, .036), (brow, .028)):
            q = (np.array(pp) / SS + [s.x0, s.y0])
            s.tube(dict(ctrl=q, w=np.array([wd, wd * .7]) * part["k"], smooth=True), pal["hair"] * .5, flat=True)

    def fruit(s, part, pal, occ_full=None):
        c = s.c(part["c"])
        r = part["r"] * SS
        th = np.linspace(0, 2 * np.pi, 120, endpoint=False)
        rad = r * (1 + .035 * np.sin(2 * th + .5) - .05 * np.exp(-((np.angle(np.exp(1j * (th + np.pi / 2)))) / .3) ** 2))
        poly = c + np.stack([np.cos(th), np.sin(th)], 1) * rad[:, None]
        box = s.box_of(poly, 4)
        y0, y1, x0, x1 = box
        m = np.zeros((y1 - y0, x1 - x0), np.uint8)
        cv2.fillPoly(m, [np.round((poly - [x0, y0]) * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5
        nx, ny = (xx - c[0]) / r, (yy - c[1]) / r
        rr = np.clip(nx * nx + ny * ny, 0, 1)
        nz = np.sqrt(1 - rr)
        occ = occ_full[y0:y1, x0:x1] if occ_full is not None else None
        col = s.shade(pal["fruit"], nx, ny, nz, occ)
        l = np.array(s.L["dir"], np.float32)
        l /= np.linalg.norm(l)
        h = (l + [0, 0, 1])
        h /= np.linalg.norm(h)
        spec = np.clip(nx * h[0] + ny * h[1] + nz * h[2], 0, 1) ** (60 if s.style == "B" else 30)
        if s.style == "B":
            spec = smoothstep(.45, .55, spec)
        col = col + spec[..., None] * np.array(s.L["col"], np.float32) * .55 * (1 if occ is None else occ[..., None])
        al = m.astype(np.float32) / 255
        if part.get("bite") is not None:
            # One bite taken out of the rim (Genesis 3:6: she ate, then gave some to him), with pale flesh inside the cut.
            b = np.deg2rad(part["bite"])
            bc = c + np.array([np.cos(b), -np.sin(b)]) * r * 1.02
            db = np.hypot(xx - bc[0], yy - bc[1])
            cut = smoothstep(r * .44, r * .40, db)
            flesh = smoothstep(r * .58, r * .52, db) * (1 - cut)
            fc = s.shade(np.array(pal.get("flesh", hexc("#d9c08a")), np.float32), nx, ny, nz, occ)
            col = col * (1 - flesh[..., None]) + fc * flesh[..., None]
            al = al * (1 - cut)
        s.put(al, col, None, box)
        top = part["c"] + np.array([0, -part["r"] * .95])
        s.tube(dict(ctrl=[top, top + [part["r"] * .12, -part["r"] * .42]], w=np.array([.12, .08]) * part["r"], smooth=False), pal["stem"], flat=True)
        lf = top + [part["r"] * .1, -part["r"] * .3]
        s.leaf(dict(c=lf + [part["r"] * .38, -part["r"] * .06], ang=-15, size=part["r"] * .75, seed=4, lobes=False), pal)

    def leaf(s, part, pal, occ_full=None):
        a = np.deg2rad(part["ang"])
        f = np.array([np.cos(a), -np.sin(a)])
        n = np.array([-f[1], f[0]])
        L = part["size"]
        t = np.linspace(0, 1, 40)
        if part.get("lobes", True):
            # A fig leaf: three rounded lobes.
            pts = []
            for th in np.linspace(-np.pi, np.pi, 200, endpoint=False):
                lobe = .62 + .38 * np.abs(np.cos(2.5 * th)) ** .6
                rr = lobe * (1 - .55 * smoothstep(2.4, 3.1, abs(th)))
                pts.append(part["c"] + (f * np.cos(th) + n * np.sin(th) * .9) * rr * L * .5 + f * L * .45)
            poly = np.array(pts)
        else:
            wv = np.sin(np.pi * t) ** .8 * .28
            pts = part["c"] + f * L * (t[:, None] - .5)
            poly = np.vstack([pts + n * (wv * L)[:, None], (pts - n * (wv * L)[:, None])[::-1]])
        polyc = s.c(poly)
        box = s.box_of(polyc, 3)
        y0, y1, x0, x1 = box
        m = np.zeros((y1 - y0, x1 - x0), np.uint8)
        cv2.fillPoly(m, [np.round((polyc - [x0, y0]) * 4).astype(np.int32)], 255, cv2.LINE_AA, 2)
        al = m.astype(np.float32) / 255
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32) + .5
        cc = s.c(part["c"] + f * L * .45)
        side = ((xx - cc[0]) * n[0] + (yy - cc[1]) * n[1]) / (L * SS)
        col = s.shade(pal["leaf"], (side * n[0]).astype(np.float32), (side * n[1]).astype(np.float32), np.full(m.shape, .8, np.float32))
        s.put(al, col, None, box)
        rib = [part["c"] + f * L * .05, part["c"] + f * L * .85]
        rib_col = (col * al[..., None]).reshape(-1, 3).sum(0) / max(al.sum(), 1) * .55
        s.tube(dict(ctrl=np.array(rib), w=np.array([.045, .015]) * L, smooth=False), rib_col, flat=True)

    # -- finish
    def contour(s):
        st = s.st["line"]
        a = s.a
        lw = st["w"] * SS * s.lw_k
        inside = (a > .5).astype(np.uint8)
        dist = cv2.distanceTransform(inside, cv2.DIST_L2, 3)
        band = (1 - smoothstep(lw * .55, lw * 1.05, dist)) * a
        gb = cv2.GaussianBlur(a, (0, 0), lw * 1.2)
        gy, gx = np.gradient(gb)
        g = np.sqrt(gx * gx + gy * gy) + 1e-6
        ox, oy = -gx / g, -gy / g
        l = np.array(s.L["dir"][:2], np.float32)
        l /= np.linalg.norm(l) + 1e-6
        shadow_side = np.clip(-(ox * l[0] + oy * l[1]), 0, 1)
        wgt = (1 - st["side"]) * .5 + (1 - (1 - st["side"]) * .5) * shadow_side ** .8
        if s.style == "B":
            wgt = np.ones_like(wgt)
        if st["broken"]:
            nz = cv2.GaussianBlur(s.r.random(a.shape).astype(np.float32), (0, 0), 4 * SS)
            nz = (nz - nz.mean()) / (nz.std() + 1e-6)
            wgt = wgt * np.clip(1 + st["broken"] * nz * 1.3, 0, 1.3)
        if s.style == "C":
            gr = s.grain(a.shape, s.seed + 21)
            wgt = wgt * (.6 + .6 * gr)
        line = np.clip(band * wgt * st["k"], 0, 1)
        ink = hexc({"A": "#1c0f09", "B": "#17110d", "C": "#2a160e"}[s.style])
        if s.style == "C":
            dark = s.rgb * .42 + ink * .3
        else:
            dark = np.minimum(s.rgb * .35, ink) * .6 + ink * .4
        s.rgb = s.rgb * (1 - line[..., None]) + dark * line[..., None]

    def result(s, H, W):
        """Reduce to frame resolution and place into a full-frame layer: premultiplied colour and alpha."""
        w, h = s.w // SS, s.h // SS
        pre = cv2.resize(s.rgb * s.a[..., None], (w, h), interpolation=cv2.INTER_AREA)
        al = cv2.resize(s.a, (w, h), interpolation=cv2.INTER_AREA)
        rgb = np.zeros((H, W, 3), np.float32)
        A = np.zeros((H, W), np.float32)
        x0, y0 = s.x0, s.y0
        xa, ya = max(x0, 0), max(y0, 0)
        xb, yb = min(x0 + w, W), min(y0 + h, H)
        rgb[ya:yb, xa:xb] = pre[ya - y0:yb - y0, xa - x0:xb - x0]
        A[ya:yb, xa:xb] = al[ya - y0:yb - y0, xa - x0:xb - x0]
        return rgb, A


def draw(figs, style, light, H=1920, W=1080, occ=None, seed=0):
    """figs: list of (pose, ox, gy, u, scale, palette). Returns premultiplied rgb and alpha, full frame, linear light."""
    out_rgb = np.zeros((H, W, 3), np.float32)
    out_a = np.zeros((H, W), np.float32)
    for i, (pose, ox, gy, u, scale, pal) in enumerate(figs):
        parts = figure_parts(pose, ox, gy, u, scale)
        pts = []
        for p in parts:
            if p["kind"] == "tube":
                pts.append(p["ctrl"])
            elif p["kind"] in ("head", "fruit", "leaf"):
                pts.append(np.array([p["c"]]))
        pts = np.vstack(pts)
        pad = u * 1.0
        x0, y0 = int(pts[:, 0].min() - pad), int(pts[:, 1].min() - pad)
        x1, y1 = int(pts[:, 0].max() + pad), int(pts[:, 1].max() + pad)
        cv = Canvas(x0, y0, x1 - x0, y1 - y0, style, light, seed + i * 17, u * scale)
        occ_c = None
        if occ is not None:
            M = 2000
            occ_c = np.pad(occ, M, mode="edge")[y0 + M:y1 + M, x0 + M:x1 + M]
            occ_c = cv2.resize(occ_c, (cv.w, cv.h), interpolation=cv2.INTER_LINEAR)
        hair = [p for p in parts if p.get("role") == "hair"]
        hair_done = False
        for p in parts:
            if p.get("role") == "hair":
                if not hair_done:
                    cv.hairmass(hair, pal, occ_c)
                    hair_done = True
                continue
            if p["kind"] == "tube":
                role = p.get("role", "body")
                alb = pal["hair"] if role == "hair" else pal["body"]
                if p.get("far"):
                    alb = alb * np.array([.62, .64, .72], np.float32)
                cv.tube(p, alb, occ_c)
            elif p["kind"] == "head":
                cv.head(p, pal, occ_c)
            elif p["kind"] == "fruit":
                cv.fruit(p, pal, occ_c)
            elif p["kind"] == "leaf":
                cv.leaf(p, pal, occ_c)
        cv.contour()
        rgb, a = cv.result(H, W)
        out_rgb = out_rgb * (1 - a[..., None]) + rgb
        out_a = out_a + a * (1 - out_a)
    return out_rgb, out_a
