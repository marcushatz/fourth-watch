#!/usr/bin/env python3
"""Check this machine against the pinned environment (ENVIRONMENT.md). Prints one line per item.
Exit 0 = everything matches; 1 = a pinned item differs or is missing (renders and checker results may differ).
    python3 tools/check_env.py            # human-readable
    python3 tools/check_env.py --json     # for the release manifest"""
import hashlib, importlib, json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILM = ROOT / "ep01-samson/film27"
PINS = {
    "python": "3.13", "node": "v22.23", "ffmpeg": "6.1.1", "tesseract": "5.3.4",
    "chrome": "153.0.8010.12",
    "pkg:sherpa_onnx": "2.0.1", "pkg:onnxruntime": "1.29.0", "pkg:cv2": "5.0.0", "pkg:numpy": "2.5.3", "pkg:PIL": "12.3.0",
}
FILES = {   # exact bytes the engine and checkers depend on: sha256 prefix (16 hex)
    "ep01-samson/film27/lib/three.min.js": "3b3a1c97de3ce65e",           # three.js r158
    "fw_check.py": "edaaabdd79cda102",
    "tools/shotlist_check.js": "67d3a26665317697",
    "tools/script_judge/make_packet.py": "c631ec92ed12cc11",
    "tools/script_judge/aggregate.py": "31d351b731a073e0",
    "tools/script_judge/judge_prompt.md": "e45419b9c36953e1",
    "tools/script_judge/calibration/refs.json": "504d39579d970c34",
}
ASR = Path.home() / ".cache/fourth-watch/asr/sherpa-onnx-zipformer-small-en-2023-06-26"
CHROME = os.environ.get("CHROME_PATH", "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome")

def run(cmd):
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=30); return p.stdout + p.stderr
    except Exception as e: return f"ERROR {e}"
def sha16(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()[:16]

found = {
    "python": sys.version.split()[0],
    "node": run(["node", "--version"]).strip(),
    "ffmpeg": (re.search(r"ffmpeg version (\S+)", run(["ffmpeg", "-version"])) or [None, "MISSING"])[1],
    "tesseract": (re.search(r"tesseract (\S+)", run(["tesseract", "--version"])) or [None, "MISSING"])[1],
    "chrome": (re.search(r"(\d+\.\d+\.\d+\.\d+)", run([CHROME, "--version"])) or [None, "MISSING"])[1],
}
for k in [k for k in PINS if k.startswith("pkg:")]:
    try: found[k] = importlib.import_module(k[4:]).__version__
    except Exception: found[k] = "MISSING"
rows, bad = [], 0
for k, want in PINS.items():
    got = str(found.get(k, "MISSING")); ok = got.startswith(want) or got.lstrip("v").startswith(want.lstrip("v"))
    bad += not ok; rows.append({"item": k, "pinned": want, "found": got, "ok": ok})
for rel, want in FILES.items():
    p = ROOT / rel; got = sha16(p) if p.exists() else "MISSING"; ok = got == want
    bad += not ok; rows.append({"item": rel, "pinned": want, "found": got, "ok": ok})
asr_ok = (ASR / "tokens.txt").exists()
rows.append({"item": "asr model (sherpa-onnx-zipformer-small-en-2023-06-26)", "pinned": "present", "found": "present" if asr_ok else "MISSING (the hearing check runs limited)", "ok": asr_ok})
if "--json" in sys.argv:
    print(json.dumps({"ok": bad == 0, "items": rows}, indent=1))
else:
    for r in rows: print(f"{'ok  ' if r['ok'] else 'DIFF'}  {r['item']:<55} pinned {r['pinned']:<18} found {r['found']}")
    print("environment matches the pins" if bad == 0 else f"{bad} item(s) differ from the pins: results may not match the tested setup")
sys.exit(0 if bad == 0 else 1)
