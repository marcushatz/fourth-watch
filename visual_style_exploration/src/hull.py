"""Turn fine hair into one solid mass, for styles that need sculpted hair instead of strands."""
import sys
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter
from skimage import measure

A = Path("/home/claude/fw-tools/assets")


def hull(names, out, step=.5, sigma=1.1, level=.14):
    pts = np.vstack([np.load(A / n)["v"] for n in names])
    lo, hi = pts.min(0) - 3, pts.max(0) + 3
    n = np.ceil((hi - lo) / step).astype(int)
    g = np.zeros(n, np.float32)
    idx = np.clip(((pts - lo) / step).astype(int), 0, n - 1)
    np.add.at(g, (idx[:, 0], idx[:, 1], idx[:, 2]), 1)
    g = np.clip(g, 0, 3)
    g = gaussian_filter(g, sigma)
    v, f, _, _ = measure.marching_cubes(g, level, spacing=(step,) * 3)
    np.savez_compressed(A / out, v=(v + lo).astype(np.float32), f=f.astype(np.int32))
    print(out, len(v))


if __name__ == "__main__":
    hull(["adam26_hair.npz", "adam26_beard.npz"], "adam26_hull.npz")
    hull(["adam13_hair.npz", "adam13_beard.npz"], "adam13_hull.npz")
    hull(["eve13_hair.npz"], "eve13_hull.npz")
