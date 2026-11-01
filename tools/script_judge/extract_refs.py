#!/usr/bin/env python3
"""Build the judge's calibration set: the spoken narration of Lintel Network Shorts with known Instagram views,
read from the shot tables in research/lintel_ref/yt/*.md (the 'narration over it' column, from YouTube's timed captions).
Writes tools/script_judge/calibration/refs.json: [{id, title, views, words, text}]."""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
YT = ROOT / "research/lintel_ref/yt"
VIEWS = {  # Instagram views from research/lintel_ref/yt/_patterns.md (coordinator's counts)
    "scssXOJHaAA": 7_600_000, "8FIxc1iY9MI": 1_800_000, "FOsA2HFaH5E": 1_600_000, "cEGFXszM7gA": 338_000,
    "rZWyZt7DYZ4": 194_000, "yXXhJztfHE0": 75_000, "wfTSihRCS10": 48_000, "04KFpM2WbVo": 35_000,
    "QhDdZVAjEdM": 33_000, "3GMG1QydnIo": 31_000, "DXjgrIw_46E": 24_000}
out = []
for vid, views in VIEWS.items():
    md = (YT / f"{vid}.md").read_text()
    title = md.splitlines()[0].split("—", 1)[-1].strip()
    lines = []
    in_table = False
    for ln in md.splitlines():
        if ln.startswith("| # |") or ln.startswith("|#|"): in_table = True; continue
        if in_table and ln.startswith("|---"): continue
        if in_table and ln.startswith("|"):
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            if len(cells) >= 4:
                nar = cells[3].strip().strip('"').strip("“”")
                if nar and nar not in ("—", "-", "(none)", "none") and not nar.startswith("("): lines.append(nar)
        elif in_table and not ln.startswith("|"): in_table = False
    text = re.sub(r"\s+", " ", " ".join(lines)).strip()
    out.append({"id": vid, "title": title, "views": views, "words": len(text.split()), "text": text})
(Path(__file__).parent / "calibration/refs.json").write_text(json.dumps(out, indent=1))
for r in out: print(f"{r['views']:>9,}  {r['words']:>4} words  {r['title'][:60]}")
