#!/usr/bin/env python3
"""Tests for `compile_spec.py --target dio` and creative/direction_map.yaml, written BEFORE the code they cover (Round 17 rule).
Each case edits the Naaman fixture and states what the compiler must do. The camera numbers are measured in test_diorama_cam.js.
    python3 tools/creative/test_compile_dio.py"""
import copy, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / "tools/creative"
FIX = TOOLS / "fixtures/naaman"
BASE = yaml.safe_load((FIX / "spec.yaml").read_text())
SAMSON = re.compile(r"samson|delilah|gaza|sorek|timnah|lehi|zorah|dagon|philistin|judges|film27", re.I)

results = []
def check(name, ok, why=""):
    results.append(bool(ok)); print(("ok   " if ok else "FAIL ") + name + ("" if ok else f"  -> {why}"))

def compile_dio(spec, tool=TOOLS / "compile_spec.py", extra=()):
    with tempfile.TemporaryDirectory() as d:
        s, out = Path(d, "spec.yaml"), Path(d, "shots.js")
        s.write_text(yaml.safe_dump(spec, sort_keys=False))
        r = subprocess.run([sys.executable, str(tool), "--target", "dio", str(s), str(FIX / "pack.md"), str(out), *extra], capture_output=True, text=True)
        sets = out.with_name("shots_sets.js")
        return r, out.read_text() if out.exists() else "", sets.read_text() if sets.exists() else ""

# ---- the fixture passes the checker and compiles ----
sc = subprocess.run([sys.executable, str(TOOLS / "spec_check.py"), str(FIX / "spec.yaml"), str(FIX / "pack.md"), str(FIX / "episode.md")], capture_output=True, text=True)
check("fixture passes spec_check with 0 FAIL", sc.returncode == 0 and "0 FAIL" in sc.stdout, sc.stdout[-600:] + sc.stderr[-300:])
check("fixture has no WARN either", " WARN " not in sc.stdout and not re.search(r"^WARN", sc.stdout, re.M), sc.stdout[:600])

r, shots, sets = compile_dio(BASE)
check("fixture compiles", r.returncode == 0, r.stdout[-300:] + r.stderr[-600:])
adds = re.findall(r"^add\('(\w+)', 'diorama', '(\w+)'", shots, re.M)
check("seven scenes make seven diorama shots", [a[0] for a in adds] == [f"N{i}" for i in range(1, 8)], adds)
line = dict(re.findall(r"^add\('(\w+)'(.*)$", shots, re.M))

# ---- what each mapping must produce (the numbers themselves are measured in the Node test) ----
check("size + angle -> preset: WS high", "preset: 'iso'" in line.get("N1", ""), line.get("N1"))
check("size + angle -> preset: MS ots carries the foreground figure", "preset: 'ots'" in line.get("N2", "") and "over: 'messenger'" in line.get("N2", ""), line.get("N2"))
check("size + angle -> preset: WS low", "preset: 'low'" in line.get("N3", ""), line.get("N3"))
check("size + angle -> preset: CU low", "preset: 'cu'" in line.get("N6", ""), line.get("N6"))
check("size + angle -> preset: insert high", "preset: 'insert'" in line.get("N7", ""), line.get("N7"))
check("subject_y becomes the frame shift", "sh: -0.04" in line.get("N1", ""), line.get("N1"))
check("cam -> dio.cam: push", "move: 'push'" in line.get("N1", "") and "amt: 0.08" in line.get("N1", "") and "from: 'cam'" in line.get("N1", ""), line.get("N1"))
check("cam -> dio.cam: a move is timed on its word", "cam: cue(0, 'commanded')" in line.get("N1", ""), line.get("N1"))
check("cam -> dio.cam: rack keeps its second subject", "move: 'rack'" in line.get("N4", "") and "to: 'naaman'" in line.get("N4", ""), line.get("N4"))
check("cam -> dio.cam: a hold has no move", "move:" not in re.search(r"dio: \{ cam: \{.*?\}", line.get("N7", "") + line.get("N1", "")).group(0) or "tilt" in line.get("N7", ""), line.get("N7"))
check("trans_out fade -> xin on the NEXT shot", "xin: { kind: 'fade' }" in line.get("N2", "") and "xin:" not in line.get("N1", ""), (line.get("N1"), line.get("N2")))
check("trans_out whip -> xin with its direction", "xin: { kind: 'whip', dir: 'left' }" in line.get("N4", ""), line.get("N4"))
check("trans_out push -> xin with its direction", "xin: { kind: 'push', dir: 'up' }" in line.get("N5", ""), line.get("N5"))
check("trans_out dip -> dip on the next shot", "dip: true" in line.get("N6", ""), line.get("N6"))
check("trans_out flashIn -> flashIn on the next shot", "flashIn: true" in line.get("N7", ""), line.get("N7"))
check("trans_out cut -> nothing", not re.search(r"xin:|dip:|flashIn:", line.get("N3", "")), line.get("N3"))
check("light.gold -> dio.rays on its word", "rays: { on: 'naaman', from: 'gold', dur: 0.8, amt: 0.9, y: 1.6 }" in line.get("N6", "") and "gold: cue(5, 'restored')" in line.get("N6", ""), line.get("N6"))
check("no gold -> no rays", "rays:" not in line.get("N1", ""), line.get("N1"))
check("light.key -> dio.key from the map", "key: { on: 'naaman', i: 40" in line.get("N6", ""), line.get("N6"))
check("no key -> no dio.key", "key:" not in re.sub(r"keyFrom", "", line.get("N1", "")).split("dio:")[1], line.get("N1"))
check("action -> dio.act: a walk keeps its path", "do: 'walk'" in line.get("N3", "") and "to: [2.6, 1.3]" in line.get("N3", ""), line.get("N3"))
check("action -> dio.act: health", "health: 1" in line.get("N6", ""), line.get("N6"))
check("the plan fields stay for the shot-list linter", all(k in line.get("N1", "") for k in ("size: 'ws'", "angle: 'high'", "cam: { move: 'push', amt: 8 }")), line.get("N1"))
check("shot start lands on its word", ", cue(1, 'elisha') - PRE, " in line.get("N2", ""), line.get("N2"))
check("a repeated word finds the right line", ", cue(2, 'naaman') - PRE, " in line.get("N3", ""), line.get("N3"))
check("verse card indexes the spec's own verse list", "card: 'verse', verse: 0" in line.get("N7", "") and "little child" in shots, line.get("N7"))
check("bubble lands on its word", "bubble: { text: \"WASH IN THE JORDAN SEVEN TIMES\", beat: 'bubble' }" in line.get("N2", ""), line.get("N2"))
check("sets file has both recipes", "DIORAMA.set('syria'" in sets and "DIORAMA.set('jordan'" in sets, sets[:200])

# ---- no Samson data: not in the output, and not needed to make it ----
check("no Samson word in the output", not SAMSON.search(shots + sets + r.stdout), SAMSON.search(shots + sets + r.stdout))
with tempfile.TemporaryDirectory() as d:
    a = Path(d, "tools/creative"); a.mkdir(parents=True); Path(d, "creative").mkdir()
    for f in TOOLS.glob("*.py"): shutil.copy(f, a)
    shutil.copy(ROOT / "creative/direction_map.yaml", Path(d, "creative")) if (ROOT / "creative/direction_map.yaml").exists() else None
    r2, s2, _ = compile_dio(BASE, tool=a / "compile_spec.py")
    check("compiles in a tree with no episode at all, byte for byte the same", r2.returncode == 0 and s2 == shots and s2, r2.stderr[-300:])
r3, s3, _ = compile_dio(BASE)
check("compiling twice gives the same bytes", s3 == shots and s3)

# ---- bad vocabulary fails, and says which shot ----
def edit(fn):
    s = copy.deepcopy(BASE); fn(s); return s
scene = lambda s, i: s["scenes"][i]
bad = [
    ("unknown size", lambda s: scene(s, 0)["comp"].update(size="HUGE"), "N1: unknown size 'HUGE'"),
    ("unknown angle", lambda s: scene(s, 0)["comp"].update(angle="sideways"), "N1: unknown angle 'sideways'"),
    ("a size and angle with no framing", lambda s: scene(s, 5)["comp"].update(size="XWS", angle="low"), "N6: no framing for xws + low"),
    ("unknown move", lambda s: scene(s, 0)["cam"].update(move="swoop"), "N1: unknown move 'swoop'"),
    ("whip as a camera move names the transition", lambda s: scene(s, 0)["cam"].update(move="whip"), "N1: whip is a transition"),
    ("unknown ease", lambda s: scene(s, 0)["cam"].update(ease="bouncy"), "N1: unknown ease 'bouncy'"),
    ("amount that isn't a number", lambda s: scene(s, 0)["cam"].update(amt="big"), "N1: cam.amt 'big' isn't a number"),
    ("a rack with no second subject", lambda s: scene(s, 3)["cam"].pop("to"), "N4: a rack needs cam.to"),
    ("ots with no foreground figure", lambda s: scene(s, 1)["cam"].pop("over"), "N2: ots needs cam.over"),
    ("no subject", lambda s: scene(s, 0)["cam"].pop("on"), "N1: cam.on is required"),
    ("subject not in the set", lambda s: scene(s, 0)["cam"].update(on="elisha"), "N1: cam.on 'elisha' isn't in set 'syria'"),
    ("foreground figure not in the set", lambda s: scene(s, 1)["cam"].update(over="elisha"), "N2: cam.over 'elisha' isn't in set 'syria'"),
    ("rack target not in the set", lambda s: scene(s, 3)["cam"].update(to="elisha"), "N4: cam.to 'elisha' isn't in set 'jordan'"),
    ("actor not in the set", lambda s: scene(s, 0)["action"][0].update(who="elisha"), "N1: action who 'elisha' isn't in set 'syria'"),
    ("light subject not in the set", lambda s: scene(s, 5)["light"].update(on="elisha"), "N6: light.on 'elisha' isn't in set 'jordan'"),
    ("unknown transition", lambda s: scene(s, 0)["trans_out"].update(kind="wipe"), "N1: unknown transition 'wipe'"),
    ("unknown transition direction", lambda s: scene(s, 2)["trans_out"].update(dir="sideways"), "N3: unknown transition dir 'sideways'"),
    ("unknown light setup", lambda s: scene(s, 1)["light"].update(key="moonbeam"), "N2: unknown light key 'moonbeam'"),
    ("a key light on a set with no key light", lambda s: s["dio_sets"]["syria"].pop("style"), "N2: light.key needs style: paint on set 'syria'"),
    ("gold over 1", lambda s: scene(s, 5)["light"].update(gold=2), "N6: light.gold 2 is outside 0..1"),
    ("subject outside the safe band", lambda s: scene(s, 0)["comp"].update(subject_y=0.2), "N1: subject_y 0.2 is outside 0.38-0.6"),
    ("unknown scene", lambda s: scene(s, 0)["set"].update(scene="sorek"), "N1: --target dio only builds diorama shots, not 'sorek'"),
    ("set with no recipe", lambda s: scene(s, 0)["set"].update(v="river"), "N1: set 'river' has no recipe in dio_sets"),
    ("unknown sky", lambda s: s["dio_sets"]["syria"].update(sky="noon"), "set 'syria': unknown sky 'noon'"),
    ("cam word that isn't narrated", lambda s: scene(s, 0)["cam"].update(start="banana"), "N1: 'banana' is not a narrated word in the shot"),
    ("light word that isn't narrated", lambda s: scene(s, 5)["light"].update(at="banana"), "N6: 'banana' is not a narrated word in the shot"),
    ("unknown text kind", lambda s: scene(s, 1)["text"].update(kind="billboard"), "N2: unknown text kind 'billboard'"),
    ("a non-positive duration", lambda s: scene(s, 0)["cam"].update(dur=0), "N1: cam.dur 0 must be above 0"),
]
for name, fn, msg in bad:
    r4, s4, _ = compile_dio(edit(fn))
    out = r4.stdout + r4.stderr
    check(f"bad vocabulary: {name}", r4.returncode != 0 and msg in out and "Traceback" not in out and not s4, f"rc={r4.returncode} wanted {msg!r}, got {out[-260:]!r}")

r5, _, _ = compile_dio(edit(lambda s: [scene(s, 0)["comp"].update(size="HUGE"), scene(s, 1)["cam"].update(move="swoop")]))
check("every problem is listed in one run", "'HUGE'" in r5.stdout + r5.stderr and "'swoop'" in r5.stdout + r5.stderr, r5.stdout + r5.stderr)
with tempfile.TemporaryDirectory() as d:
    m = yaml.safe_load((ROOT / "creative/direction_map.yaml").read_text()) if (ROOT / "creative/direction_map.yaml").exists() else {"framing": {}}
    m["framing"]["ws"]["high"]["preset"] = "lowangle" if "ws" in m["framing"] else None
    Path(d, "m.yaml").write_text(yaml.safe_dump(m))
    r6, s6, _ = compile_dio(BASE, extra=("--map", str(Path(d, "m.yaml"))))
    check("a preset the engine doesn't have fails in the map itself", r6.returncode != 0 and "'lowangle'" in r6.stdout + r6.stderr and not s6, r6.stdout + r6.stderr)
r7 = subprocess.run([sys.executable, str(TOOLS / "compile_spec.py"), "--target", "pixar", "x", "y", "z"], capture_output=True, text=True)
check("an unknown target fails", r7.returncode != 0 and "unknown target 'pixar'" in r7.stdout + r7.stderr, r7.stdout + r7.stderr)
r8, s8, _ = compile_dio(edit(lambda s: scene(s, 6)["trans_out"].update(kind="fade")))
check("the last shot's transition isn't dropped silently", r8.returncode == 0 and "N7" in r8.stdout and "first shot after the window" in r8.stdout, r8.stdout[-300:])
r9, _, _ = compile_dio(edit(lambda s: [p.pop("hires", None) for p in s["dio_sets"]["jordan"]["people"]]))
check("a close shot on a low-res figure is called out", r9.returncode == 0 and "hires" in r9.stdout, r9.stdout[-300:])

# ---- the old mode is untouched: it still rebuilds the checked-in demo output, apart from the path in the header ----
DEMO = ROOT / "ep01-samson/creative/demo_16-20"
strip = lambda t: re.sub(r"^// GENERATED.*$", "", re.sub(r"require\('[^']*/(engine/[^']*|vo\.js)'\)", r"require('\1')", t), flags=re.M)
with tempfile.TemporaryDirectory() as d:
    o = Path(d, "score.js")
    r10 = subprocess.run([sys.executable, str(TOOLS / "compile_spec.py"), str(DEMO / "spec.yaml"), str(ROOT / "ep01-samson/film27"), str(o)], capture_output=True, text=True)
    check("the score target still rebuilds the demo", r10.returncode == 0 and strip(o.read_text()) == strip((DEMO / "score_cd_demo.js").read_text()), r10.stderr[-300:])

print(f"\n{sum(results)}/{len(results)} passed"); sys.exit(0 if all(results) else 1)
