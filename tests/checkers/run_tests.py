#!/usr/bin/env python3
"""Run the checker test clips. Exit 0 only if every expectation in expected.json holds.
    python3 tests/checkers/run_tests.py            # all (the video part takes ~1-2 min)
    python3 tests/checkers/run_tests.py --fast     # script + shot list only
Run this BEFORE shipping any change to fw_check.py (Round 17), and put the result in the release manifest."""
import json, re, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
FX = HERE / "fixtures"
EXP = json.loads((HERE / "expected.json").read_text())
fast = "--fast" in sys.argv
if not (FX / "script/good.md").exists() or not (FX / "judge/pass/panel.json").exists():
    subprocess.run([sys.executable, str(HERE / "make_fixtures.py")], check=True)

def fails(report):
    return set(m.strip() for m in re.findall(r"^\| FAIL \| ([^|]+)\|", report, re.M))

problems, n = [], 0
def judge(kind, name, exp, code, report):
    global n; n += 1
    f = fails(report)
    if "exit" in exp and code != exp["exit"]: problems.append(f"{kind}/{name}: exit {code}, expected {exp['exit']}")
    for c in exp.get("must_fail", []):
        if c not in f: problems.append(f"{kind}/{name}: expected a FAIL on '{c}', got FAILs {sorted(f)}")
    for c in exp.get("must_not_fail", []):
        if c in f: problems.append(f"{kind}/{name}: unexpected FAIL on '{c}'")
    for s in exp.get("contains", []):
        if s not in report: problems.append(f"{kind}/{name}: report lacks '{s}'")
    for s in exp.get("not_contains", []):
        if s in report: problems.append(f"{kind}/{name}: report should not contain '{s}'")

with tempfile.TemporaryDirectory() as tmp:
    for name, exp in EXP["script"].items():
        out = Path(tmp) / f"s_{name}"
        extra = [a.replace("{FX}", str(FX)) for a in exp.get("args", [])]
        p = subprocess.run([sys.executable, str(ROOT / "fw_check.py"), "script", str(FX / f"script/{exp.get('fixture', name)}.md"), "--out", str(out)] + extra, capture_output=True, text=True)
        judge("script", name, exp, p.returncode, (out / "report.md").read_text() if (out / "report.md").exists() else p.stdout + p.stderr)
    if not fast:
        for name, exp in EXP["video"].items():
            if name.startswith("_"): continue
            out = Path(tmp) / f"v_{name}"
            p = subprocess.run([sys.executable, str(ROOT / "fw_check.py"), "video", "--video", str(FX / f"video/{name}.mp4"), "--no-asr", "--out", str(out)], capture_output=True, text=True)
            judge("video", name, exp, p.returncode, (out / "report.md").read_text() if (out / "report.md").exists() else p.stdout + p.stderr)

print(f"{n} fixtures checked, {len(problems)} problem(s)")
for x in problems: print("  -", x)
sys.exit(1 if problems else 0)
