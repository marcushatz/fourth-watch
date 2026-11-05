#!/usr/bin/env python3
"""Tests for the spec checker, written BEFORE the fixes they cover (Round 17 rule). Each case edits the demo spec or pack
and states what the checker must say.  python3 tools/creative/test_spec_check.py"""
import copy, subprocess, sys, tempfile
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
DEMO = ROOT / "ep01-samson/creative/demo_16-20"
BASE = yaml.safe_load((DEMO / "spec.pass1.yaml" if (DEMO / "spec.pass1.yaml").exists() else DEMO / "spec.yaml").read_text())
PACK = (DEMO / "pack.md").read_text()
EP = ROOT / "ep01-samson/episode.md"

def run(spec, pack):
    with tempfile.TemporaryDirectory() as d:
        s, p = Path(d, "s.yaml"), Path(d, "p.md")
        s.write_text(yaml.safe_dump(spec, sort_keys=False)); p.write_text(pack)
        r = subprocess.run([sys.executable, str(ROOT / "tools/creative/spec_check.py"), str(s), str(p), str(EP)], capture_output=True, text=True)
        return r.stdout + r.stderr

def with_line(pack, line):  # set a line in the narration section of the pack (replacing one of the same kind)
    kind = line.split(":")[0]
    pack = "\n".join(l for l in pack.splitlines() if not l.startswith(kind + ":")) + "\n"
    return pack.replace("## Accuracy notes", line + "\n\n## Accuracy notes", 1)

def strip_verse(spec):
    for s in spec["scenes"]: s["text"] = {"kind": "none"} if s["id"] == "C" else s["text"]
    return spec

cases = []
def case(name, spec, pack, must=(), must_not=()):
    cases.append((name, spec, pack, must, must_not))

# 1. "weight forward" is body language, not balance imagery; "scales weighing" is.
s = copy.deepcopy(BASE); s["scenes"][0]["action"][0]["does"] = "rises off the couch, weight forward"
case("weight is not weighing", s, PACK, must_not=["balance/weighing"])
s = copy.deepcopy(BASE); s["scenes"][0]["action"][0]["does"] = "a pair of scales weighing his deeds hangs above him"
case("scales weighing fails", s, PACK, must=["balance/weighing"])

# 2. The first scene's place read: 0.5 s is enough when the shot before the window is on the same set.
s = copy.deepcopy(BASE); s["scenes"][0]["reads"][0]["t"] = [48.50, 49.10]
case("same set before window: 0.5 s rule", s, with_line(PACK, "- shot before the window: S09 sorek/wake"), must_not=["place read"])
case("other set before window: 0.8 s rule", s, with_line(PACK, "- shot before the window: S04 gaza/rip"), must=["place read"])

# 3. An approved VERSE card that belongs to a line in the window must appear, word for word.
req = '- required verse card: "But he did not know that the LORD had left him." — Judges 16:20 (ESV)'
case("missing approved verse card fails", strip_verse(copy.deepcopy(BASE)), with_line(PACK, req), must=["approved verse card missing"])
s = strip_verse(copy.deepcopy(BASE))
s["scenes"][2]["text"] = {"kind": "verse", "words": "But he did not know that the LORD had left him.", "t": [53.51, 56.5]}
case("present approved verse card passes", s, with_line(PACK, req), must_not=["approved verse card missing", "verse text isn't"])

# 4. Gold light follows the passage's rule from the pack ("gold allowed: none" for 16:19-20; allowed where the text says God acted)
s = copy.deepcopy(BASE); s["scenes"][1]["light"]["gold"] = 0.4
case("gold where the pack says none fails", s, with_line(PACK, "- gold allowed: none (16:19-20: the LORD had left him)"), must=["gold 0.4"])
case("gold where the pack allows it passes", s, with_line(PACK, "- gold allowed: yes (14:6: the Spirit of the LORD rushed upon him)"), must_not=["gold 0.4"])

# 5. The Round 43 engine vocabulary: the data-driven set and the three drawn transitions are real, and a typo is still a FAIL.
UNKNOWN_SCENE, UNKNOWN_TRANS = "doesn't exist", "isn't one the engine has"
def diorama(spec, **comp):
    spec["scenes"][0]["set"] = {"scene": "diorama", "v": "camp"}
    spec["scenes"][0]["comp"] = {"size": "WS", "angle": "high", "subject_y": 0.46, **comp}
    spec["scenes"][0]["cam"] = {"move": "push", "amt": 0.05, "on": "jacob", "start": "go"}
    return spec
case("diorama is a scene", diorama(copy.deepcopy(BASE)), PACK, must_not=[UNKNOWN_SCENE])
s = copy.deepcopy(BASE); s["scenes"][0]["set"] = {"scene": "dioramma", "v": "camp"}
case("a misspelt scene still fails", s, PACK, must=[UNKNOWN_SCENE])
for kind in ("fade", "whip", "push"):
    s = copy.deepcopy(BASE); s["scenes"][0]["trans_out"] = {"kind": kind}
    case(f"{kind} is a transition", s, PACK, must_not=[UNKNOWN_TRANS])
s = copy.deepcopy(BASE); s["scenes"][0]["trans_out"] = {"kind": "wipe"}
case("an unknown transition still fails", s, PACK, must=[UNKNOWN_TRANS])

# 6. On a diorama shot the map is the vocabulary, so a shot the compiler would refuse fails here first.
s = diorama(copy.deepcopy(BASE)); s["scenes"][0]["comp"]["size"] = "HUGE"
case("diorama: unknown size fails", s, PACK, must=["unknown size 'HUGE'"])
s = diorama(copy.deepcopy(BASE)); s["scenes"][0]["comp"]["angle"] = "sideways"
case("diorama: unknown angle fails", s, PACK, must=["unknown angle 'sideways'"])
s = diorama(copy.deepcopy(BASE)); s["scenes"][0]["cam"]["move"] = "swoop"
case("diorama: unknown move fails", s, PACK, must=["unknown move 'swoop'"])
s = diorama(copy.deepcopy(BASE)); s["scenes"][0]["cam"]["move"] = "whip"
case("diorama: a camera whip fails and names the transition", s, PACK, must=["trans_out"])
s = diorama(copy.deepcopy(BASE), subject_y=0.2)
case("diorama: subject outside the safe band fails", s, PACK, must=["subject_y 0.2"])
s = copy.deepcopy(BASE); s["scenes"][0]["comp"]["size"] = "HUGE"
case("a Samson-set spec isn't held to the diorama map", s, PACK, must_not=["unknown size"])

fails = 0
for name, spec, pack, must, must_not in cases:
    out = run(spec, pack)
    bad = [m for m in must if m not in out] + [f"NOT {m}" for m in must_not if m in out]
    print(("FAIL " if bad else "ok   ") + name + (f"  -> expected {bad}" if bad else ""))
    fails += bool(bad)
print(f"\n{len(cases) - fails}/{len(cases)} passed"); sys.exit(1 if fails else 0)
