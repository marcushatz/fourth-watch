"""Assemble the gallery: web copies of every frame plus the page with the catalog filled in."""
import json
import shutil
import sys
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).parent))
from catalog import STYLES

ROOT = Path(__file__).resolve().parents[1]
G = ROOT / "gallery"
ASSESS = (ROOT / "reports" / "assessment_short.html").read_text()


def build(out):
    out = Path(out)
    (out / "img").mkdir(parents=True, exist_ok=True)
    (out / "th").mkdir(parents=True, exist_ok=True)
    for s in STYLES:
        for k in "abc":
            im = cv2.imread(str(ROOT / "frames" / s["id"] / f"{k}.jpg"))
            assert im is not None and im.shape[:2] == (1920, 1080), (s["id"], k)
            cv2.imwrite(str(out / "img" / f"{s['id']}_{k}.jpg"), im, [cv2.IMWRITE_JPEG_QUALITY, 90])
            cv2.imwrite(str(out / "th" / f"{s['id']}_{k}.jpg"), cv2.resize(im, (540, 960), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 84])
    page = (G / "index.html").read_text().replace("__DATA__", json.dumps(STYLES, ensure_ascii=True)).replace("__ASSESS__", json.dumps(ASSESS, ensure_ascii=True))
    (out / "index.html").write_text(page)
    return out


if __name__ == "__main__":
    print(build(sys.argv[1]))
