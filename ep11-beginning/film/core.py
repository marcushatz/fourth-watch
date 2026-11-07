"""Shots, timing and the per-frame compositor for the Genesis film.

A shot builds its paper stage once (static sheets, tagged sheets that move as whole pieces, and slots for
pieces redrawn every frame), then answers frame(t) with the camera, the slot contents and any sheet motion.
"""
import json
import re
from pathlib import Path

import numpy as np

import paper as P
import rig as R
from paper import DEPTH, DH, DW, RH, RW, S

HERE = Path(__file__).resolve().parent
TIMING = json.load(open(HERE / "timing.json"))
FPS = 24


class Words:
    """Word cues for one shot, in seconds from the shot's start."""

    def __init__(self, sid):
        s = next(x for x in TIMING["shots"] if x["id"] == sid)
        self.t0, self.dur = s["start"], s["end"] - s["start"]
        self.voice_end = s["voice_end"] - s["start"]
        self.words = [(re.sub(r"[^a-z0-9']", "", w["w"].lower()), w["start"] - s["start"], w["end"] - s["start"]) for w in s["words"]]

    def __call__(self, word, n=0, end=False):
        word = word.lower()
        hits = [w for w in self.words if w[0] == word or w[0].startswith(word)]
        if not hits:
            raise KeyError(word)
        h = hits[min(n, len(hits) - 1)]
        return h[2] if end else h[1]


# Building ---------------------------------------------------------------------------------------------

class Sheet:
    __slots__ = ("kind", "band", "depth", "tag", "PM", "G", "ox", "oy", "name", "ext", "glow")

    def __init__(self, **k):
        self.G = None
        self.glow = None
        for a in self.__slots__:
            setattr(self, a, k.get(a, getattr(self, a, None)))


def _crop(PM, G, cv):
    a = (PM[..., 3] < .997) | (PM[..., :3].max(-1) > .003)
    if G is not None:
        a |= G > .003
    rows, cols = np.flatnonzero(a.any(1)), np.flatnonzero(a.any(0))
    if not len(rows):
        return None
    y0, y1, x0, x1 = rows[0], rows[-1] + 1, cols[0], cols[-1] + 1
    return PM[y0:y1, x0:x1].copy(), (G[y0:y1, x0:x1].copy() if G is not None else None), cv.x0 + x0 / S, cv.y0 + y0 / S


def finalize(st):
    """Merge neighbouring sheets that move together, crop each to what it covers."""
    out, run = [], None
    cv = st.cv
    for i, L in enumerate(st.layers):
        tagname = L.tag
        if L.slot is not None:
            if run is not None:
                out.append(run)
                run = None
            out.append(Sheet(kind="slot", band=L.band, depth=DEPTH[L.band], name=L.slot))
            continue
        if run is not None and run.tag is None and tagname is None and run.band == L.band:
            run.PM = P.merge(run.PM, L.PM)
            if L.G is not None:
                run.G = L.G if run.G is None else np.maximum(run.G, L.G)
            continue
        if run is not None:
            out.append(run)
        run = Sheet(kind="sheet", band=L.band, depth=DEPTH[L.band], tag=tagname, PM=L.PM, G=L.G, ox=cv.x0, oy=cv.y0, ext=(cv.x0, cv.y0, cv.x0 + cv.w, cv.y0 + cv.h))
    if run is not None:
        out.append(run)
    final = []
    for k, sh in enumerate(out):
        if sh.kind == "sheet" and k > 0:
            c = _crop(sh.PM, sh.G, cv)
            if c is None:
                continue
            sh.PM, sh.G, sh.ox, sh.oy = c
        if sh.kind == "sheet" and sh.G is not None:
            sh.glow = None
        final.append(sh)
    return final


# Camera ----------------------------------------------------------------------------------------------

def mat3(m):
    return np.vstack([m, [0, 0, 1]]).astype(np.float64)


def design_xf(dx=0, dy=0, rot=0, sc=1, pivot=(DW / 2, DH / 2), sx=None):
    a = np.radians(rot)
    c, s = np.cos(a) * sc, np.sin(a) * sc
    kx = (sx if sx is not None else 1)
    px, py = pivot
    A = np.array([[c * kx, -s, 0], [s * kx, c, 0], [0, 0, 1]], np.float64)
    T = np.array([[1, 0, px + dx], [0, 1, py + dy], [0, 0, 1]], np.float64) @ A @ np.array([[1, 0, -px], [0, 1, -py], [0, 0, 1]], np.float64)
    return T


def to_out(cam, depth, ox, oy, A=None, ext=None):
    """3x3 matrix: sheet pixel -> output pixel."""
    cx, cy, z = cam
    zl = z ** depth
    lx = DW / 2 + (cx - DW / 2) * depth
    ly = DH / 2 + (cy - DH / 2) * depth
    if ext is not None:
        ex0, ey0, ex1, ey1 = ext
        need_x = (DW / 2) / max(min(lx - ex0, ex1 - lx), 1)
        need_y = (DH / 2) / max(min(ly - ey0, ey1 - ly), 1)
        zl = max(zl, need_x, need_y)
    pix = np.array([[1 / S, 0, ox], [0, 1 / S, oy], [0, 0, 1]], np.float64)      # sheet pixel -> design
    camm = np.array([[zl * S, 0, RW / 2 - lx * zl * S], [0, zl * S, RH / 2 - ly * zl * S], [0, 0, 1]], np.float64)
    M = camm @ (A if A is not None else np.eye(3)) @ pix
    return M


def move_cam(kind, pct, u, focus=(DW / 2, DH / 2), drift=.03):
    """The storyboard's camera moves. u is 0..1 across the shot (already eased)."""
    fx, fy = focus
    p = pct / 100
    if kind == "push":
        return fx, fy, 1 + drift + p * u
    if kind == "pull":
        return fx, fy, 1 + drift + p * (1 - u)
    if kind in ("pan", "track"):
        d = DW * p
        return fx - d / 2 + d * u, fy, 1 + p * 1.1 + drift
    if kind == "crane":
        d = DH * p * .5
        return fx, fy - d / 2 + d * u, 1 + p * .6 + drift
    return fx, fy, 1 + drift * (.4 + .6 * u)


# Rendering ------------------------------------------------------------------------------------------

def render_item(stage, item, key):
    kind = item[0]
    if kind == "fig":
        _, f, x, y, u, pose, kw = item
        kw = {k: v for k, v in kw.items() if k != "alpha"}
        r = R.figure_patch(stage, f, x, y, u, pose, key=key, **kw)
        return None if r is None else r[:3]
    if kind == "draw":
        _, (x0, y0, x1, y1), fn = item
        x0, y0 = max(x0, -400), max(y0, -400)
        x1, y1 = min(x1, DW + 400), min(y1, DH + 400)
        if x1 - x0 < 2 or y1 - y0 < 2:
            return None
        pt = P.Patch(stage, x0, y0, x1 - x0, y1 - y0)
        pt.cv.nx0, pt.cv.ny0 = 300 + 77 * key, 300
        with P.on(pt.cv):
            fn(pt)
        PM, G = pt.result()
        if PM is None:
            return None
        return PM, G, (pt.cv.x0, pt.cv.y0)
    raise ValueError(kind)


def compose(shot, t, frame_no):
    R.NOW[0] = t
    fr = shot.frame(t)
    cx, cy, z = fr.get("cam", (DW / 2, DH / 2, 1.0))
    # keep the view inside the designed frame (sheets past its edges are only a small margin)
    lim = 1 - 1 / max(z, 1.0)
    cx = DW / 2 + float(np.clip(cx - DW / 2, -DW / 2 * lim * .92, DW / 2 * lim * .92))
    cy = DH / 2 + float(np.clip(cy - DH / 2, -DH / 2 * lim * .92, DH / 2 * lim * .92))
    cam = (cx, cy, z)
    xf = fr.get("xf", {})
    fade = fr.get("fade", {})
    slots = fr.get("slots", {})
    out = np.zeros((RH, RW, 3), np.float32)
    gl = np.zeros((RH, RW), np.float32)
    for k, sh in enumerate(shot.sheets):
        if sh.kind == "slot":
            for j, item in enumerate(slots.get(sh.name, [])):
                r = render_item(shot.stage, item, key=k * 10 + j)
                if r is None:
                    continue
                PM, G, (x0, y0) = r
                al = item[-1].get("alpha", 1.0) if item[0] == "fig" else 1.0
                if al < .998:
                    PM = PM.copy()
                    PM[..., :3] *= al
                    PM[..., 3] = 1 - (1 - PM[..., 3]) * al
                A = None
                if sh.name in xf:
                    A = design_xf(**xf[sh.name])
                M = to_out(cam, sh.depth, x0, y0, A)
                P.place(out, PM, M[:2].astype(np.float32), gl, G)
            continue
        PM = sh.PM
        a = fade.get(sh.tag, 1.0) if sh.tag else 1.0
        if a <= .002:
            continue
        if a < .998:
            PM = PM.copy()
            PM[..., :3] *= a
            PM[..., 3] = 1 - (1 - PM[..., 3]) * a
        A = design_xf(**xf[sh.tag]) if sh.tag in xf else None
        M = to_out(cam, sh.depth, sh.ox, sh.oy, A, sh.ext if k == 0 else None)
        G = sh.G * a if (sh.G is not None and a < .998) else sh.G
        P.place(out, PM, M[:2].astype(np.float32), gl, G)
    if "post" in fr:
        out = fr["post"](out)
    img = P.finish(out, gl if gl.max() > 0 else None, shot.seed, frame_no, vignette=fr.get("vignette", .26), glow=fr.get("glow", .62), grade=fr.get("grade"))
    return img


class Shot:
    def __init__(self, sid, stage, frame, pre=0.0, post=0.0):
        self.id, self.stage, self.frame = sid, stage, frame
        self.sheets = finalize(stage)
        self.seed = stage.seed
        self.W = Words(sid)
        self.dur = self.W.dur
        self.pre, self.post = pre, post


# Grades ------------------------------------------------------------------------------------------------

def drain(amount, cool="#8d97a3"):
    """Colour drains from the scene (Genesis 3:7): toward a cool grey, keeping the values."""
    c = P.hexc(cool)

    def g(img):
        if amount <= 0:
            return img
        lum = (img * [.3, .55, .15]).sum(-1, keepdims=True)
        grey = lum * (c / c.mean())
        return img * (1 - amount) + grey * amount
    return g


def dim(k, tint="#10141f", amt=.12):
    t = P.hexc(tint)
    return lambda img: np.clip(img * k + t * amt, 0, 1)


def chain(*gs):
    def g(img):
        for f in gs:
            if f is not None:
                img = f(img)
        return img
    return g
