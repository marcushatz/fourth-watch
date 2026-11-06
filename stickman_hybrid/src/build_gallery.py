"""Web copies, character close-ups and layer strips for the comparison page."""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
V = [("A", "A_painterly_cinematic"), ("B", "B_editorial_elegant"), ("C", "C_atmospheric_storybook")]
S = [("awe", "1_awe"), ("tension", "2_tension"), ("fear", "3_fear")]
CROP = dict(awe=(1080, 1570, 360, 760), tension=(760, 1610, 170, 1010), fear=(1120, 1660, 440, 900))


def build(out):
    out = Path(out)
    for d in ("img", "th", "char", "layers"):
        (out / d).mkdir(parents=True, exist_ok=True)
    for v, vd in V:
        for s, sf in S:
            im = cv2.imread(str(ROOT / "frames" / vd / f"{sf}.jpg"))
            assert im is not None and im.shape[:2] == (1920, 1080), (vd, sf)
            key = f"{v}_{s}"
            cv2.imwrite(str(out / "img" / f"{key}.jpg"), im, [cv2.IMWRITE_JPEG_QUALITY, 90])
            cv2.imwrite(str(out / "th" / f"{key}.jpg"), cv2.resize(im, (540, 960), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 84])
            y0, y1, x0, x1 = CROP[s]
            cv2.imwrite(str(out / "char" / f"{key}.jpg"), im[y0:y1, x0:x1], [cv2.IMWRITE_JPEG_QUALITY, 92])
            ld = ROOT / "frames" / vd / "layers" / sf
            tiles = []
            for f in sorted(ld.glob("*.png")):
                L = cv2.imread(str(f), cv2.IMREAD_UNCHANGED)
                t = cv2.resize(L, (162, 288), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
                yy, xx = np.mgrid[:288, :162]
                chk = np.where(((yy // 12 + xx // 12) % 2) == 0, .16, .11)[..., None] * np.ones(3)
                a = t[..., 3:4]
                tiles.append(((t[..., :3] * a + chk * (1 - a)) * 255).astype(np.uint8))
            gap = np.full((288, 8, 3), 20, np.uint8)
            strip = np.hstack(sum([[t, gap] for t in tiles], [])[:-1])
            cv2.imwrite(str(out / "layers" / f"{key}.jpg"), strip, [cv2.IMWRITE_JPEG_QUALITY, 85])
    page = (ROOT / "gallery" / "index.html").read_text()
    (out / "index.html").write_text(page)
    return out


if __name__ == "__main__":
    print(build(sys.argv[1]))
