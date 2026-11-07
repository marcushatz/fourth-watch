"""Fast pose check without Blender: splats the baked meshes from the front, the side and three-quarter. Dev tool.
    python preview.py man_relate [out.jpg]"""
import sys
from pathlib import Path

import cv2
import numpy as np

A = Path("/home/claude/fw-tools/assets")
COL = {"body": (150, 180, 220), "shirt": (90, 110, 150), "pants": (60, 60, 70), "socks": (40, 40, 40), "hair": (30, 40, 60), "scalp": (30, 40, 60),
       "brow": (20, 20, 20), "beard": (30, 40, 60), "leaves": (60, 140, 80), "wrap": (60, 140, 80)}


def load(name):
    out = []
    for p in sorted(A.glob(f"vi_{name}_*.npz")):
        part = p.stem.split("_")[-1]
        if part in COL:
            d = np.load(p)
            tri = d["f"][:, :3] if d["f"].shape[1] >= 3 else d["f"]
            cen = d["v"][d["f"]].mean(1)
            out.append((part, d["v"], d["f"], cen))
    return out


def view(parts, yaw, S=520):
    c, s = np.cos(np.radians(yaw)), np.sin(np.radians(yaw))
    R = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])
    img = np.full((S, S, 3), 245, np.uint8)
    zb = np.full((S, S), -1e9)
    allv = np.vstack([p[1] for p in parts])
    lo, hi = allv.min(0), allv.max(0)
    mid = (lo + hi) / 2
    sc = S * .9 / max(hi - lo)
    for part, v, f, cen in parts:
        q = (cen - mid) @ R.T
        x = (q[:, 0] * sc + S / 2).astype(int)
        y = (S / 2 - q[:, 2] * sc).astype(int)
        d = q[:, 1]
        a = v[f[:, 1]] - v[f[:, 0]]
        b = v[f[:, 2]] - v[f[:, 0]]
        n = np.cross(a, b) @ R.T
        n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-9
        sh = np.clip(.45 + .55 * np.abs(n[:, 1]), 0, 1)
        o = np.argsort(d)
        for i in o:
            if 0 <= x[i] < S and 0 <= y[i] < S and -d[i] >= zb[y[i], x[i]] - 1e9:
                cv2.circle(img, (x[i], y[i]), 2, tuple(int(cc * sh[i]) for cc in COL[part]), -1)
    return img


if __name__ == "__main__":
    name = sys.argv[1]
    parts = load(name)
    img = np.hstack([view(parts, a) for a in (0, 90, 35)])
    cv2.imwrite(sys.argv[2] if len(sys.argv) > 2 else f"/tmp/claude-0/-home-claude/29c8b03c-24f1-5be7-9f1d-94c500e7cd7a/scratchpad/pv_{name}.jpg", img)
