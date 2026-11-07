"""Modesty check for a rendered frame: counts visible skin pixels in each figure's pelvis region (front or back) and, for
Eve, the front of her chest. Any frame that fails is reframed or covered before anyone sees it.
    python modesty.py <frame> [<frame> ...]"""
import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, "/home/claude/fw-tools")
import exr  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")
A = Path("/home/claude/fw-tools/assets")


def check(name):
    m = json.load(open(OUT / f"{name}_meta.json"))
    b = exr.layers(OUT / f"{name}_main.exr")
    Z, I, N = b["Depth"][..., 0], b["Object Index"][..., 0], b["Normal"][..., :3]
    H, W = Z.shape
    Mc = np.array(m["camera"]["matrix"])
    R, c = Mc[:3, :3], Mc[:3, 3]
    k = (m["camera"]["sensor"] / 2) / m["camera"]["lens"]
    jj, ii = np.meshgrid(np.arange(W), np.arange(H))
    d = np.stack([((jj + .5) / W * 2 - 1) * k * W / H, (1 - (ii + .5) / H * 2) * k, -np.ones((H, W))], -1) @ R.T
    skin = (np.abs(I - 1) < .5) & (Z < 1e6)
    P = c + d[skin] * Z[skin][:, None]
    Nw = N[skin]
    report = {}
    for p in m.get("people", []):
        M = np.array(p["M"])
        loc = (P - M[:3, 3]) @ M[:3, :3]
        nl = Nw @ M[:3, :3]
        mk = np.load(A / f"vi_{p['pose']}_marks.npz")
        hip, neck = mk["upperleg01_L"][2], mk["neck01"]
        # The body near each figure only (other figures are checked on their own).
        near = np.linalg.norm(loc - np.array([0, 0, hip]), axis=1) < 120
        pelvis = near & (loc[:, 2] > hip - 18) & (loc[:, 2] < hip + 9) & (np.abs(loc[:, 0]) < 19)
        r = {"pelvis": int(pelvis.sum())}
        if "eve" in p["pose"]:
            chest = near & (loc[:, 2] > neck[2] - 34) & (loc[:, 2] < neck[2] - 9) & (np.abs(loc[:, 0]) < 17) & (nl[:, 1] > .25)
            r["chest"] = int(chest.sum())
        report[p["pose"]] = r
    ok = all(v == 0 or v < 15 * (W / 1080) ** 2 for r in report.values() for v in r.values())
    return ok, report


if __name__ == "__main__":
    for n in sys.argv[1:]:
        ok, rep = check(n)
        print(n, "OK" if ok else "FAIL", rep)
