"""Assemble the review gallery from the rendered frames and the written catalog."""
import glob
import json
import os
import shutil
import sys
from pathlib import Path

import cv2

sys.path.insert(0, str(Path(__file__).parent))
import catalog as C

ROOT = Path(__file__).resolve().parents[1]
G = ROOT / "gallery"
PROV = {"new": "Locally rendered original artwork", "old": "Existing project artwork, not yet approved", "concept": "Conceptual approximation: locally rendered, but it doesn't reach the real style"}
CONCEPT = {"07", "08", "11"}


def add(style, src, shot, stage, prov):
    name = f"{style['id']}_{shot}_{stage}"
    full = G / "frames" / f"{name}.jpg"
    thumb = G / "thumbs" / f"{name}.jpg"
    im = cv2.imread(str(src))
    cv2.imwrite(str(full), im, [cv2.IMWRITE_JPEG_QUALITY, 86])
    cv2.imwrite(str(thumb), cv2.resize(im, (360, 640), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 78])
    style["frames"].append(dict(shot=shot, stage=stage, full=f"frames/{name}.jpg", thumb=f"thumbs/{name}.jpg", prov=PROV[prov]))


def main():
    for d in ("frames", "thumbs"):
        shutil.rmtree(G / d, ignore_errors=True)
        (G / d).mkdir(parents=True)
    styles = []
    for s in C.S:
        s = dict(s, frames=[])
        sid = s["id"]
        prov = "old" if sid == "20" else "concept" if sid in CONCEPT else "new"
        for stage, folder in (("C", "stage_c"), ("B", "stage_b"), ("A", "stage_a")):
            for f in sorted(glob.glob(str(ROOT / "frames" / folder / f"{sid}_*.jpg"))):
                shot = Path(f).stem.rsplit("_", 1)[1]
                add(s, f, shot, stage, prov)
        if sid in C.FINALIST_REASON:
            s["why"] = "Finalist: " + C.FINALIST_REASON[sid]
        elif sid in C.LEFT_OUT:
            s["why"] = "Not a finalist: " + C.LEFT_OUT[sid]
        s["refine"] = C.REFINE_NOTES.get(sid)
        styles.append(s)
    data = dict(styles=styles, finalists=C.FINALISTS, refined=C.REFINED, judgmentNote=C.JUDGMENT_NOTE, stress=dict(cols=C.STRESS_COLS, rows=C.STRESS), ranking=C.RANKING, nextTests=C.NEXT_TESTS, open=C.OPEN_QUESTIONS,
                findings=C.FINDINGS, researchNote=C.RESEARCH_NOTE, research=C.RESEARCH)
    t = (G / "template.html").read_text()
    (G / "index.html").write_text(t.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False)))
    print(len(styles), "styles", sum(len(s["frames"]) for s in styles), "frames", round(sum(os.path.getsize(p) for p in glob.glob(str(G / "*/*.jpg"))) / 1e6, 1), "MB")


if __name__ == "__main__":
    main()
