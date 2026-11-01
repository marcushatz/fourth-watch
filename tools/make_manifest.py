#!/usr/bin/env python3
"""Release manifest: every file that makes an episode release, with hashes, the tool versions and the checks it passed.
    python3 tools/make_manifest.py ep01-samson/release_v57.json          # writes ep01-samson/releases/<name>/MANIFEST.{json,md}
    python3 tools/make_manifest.py ep01-samson/release_v60.json --check  # consistency checks only, no files written
The spec (JSON) names the release and maps each role to a path relative to the project root:
  {"name": "v57", "episode": "ep01-samson", "film": "ep01-samson/film27",
   "files": {"script": "...", "shotlist": "...", "score": "...", "vo": "...", "soundtrack_script": "...", "soundtrack_wav": "...",
             "music_wav": "...", "film": "...", "outro": "...", "voice_take": "...", "final_video": "...", "captions": "..."},
   "also": ["globs of supporting files, e.g. ep01-samson/film27/scenes/*.js"]}
Exit 0 = every check passed; 1 = at least one FAIL (the manifest is still written, marked NOT RELEASABLE)."""
import datetime, glob, hashlib, json, os, subprocess, sys, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
spec_path = Path(sys.argv[1]); only_check = "--check" in sys.argv
spec = json.loads(spec_path.read_text())
F = spec["files"]

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def info(rel):
    p = ROOT / rel
    if not p.exists(): return {"path": rel, "missing": True}
    st = p.stat()
    return {"path": rel, "sha256": sha(p), "bytes": st.st_size, "modified": datetime.datetime.fromtimestamp(st.st_mtime).isoformat(timespec="seconds")}
def wav_secs(rel):
    try:
        with wave.open(str(ROOT / rel)) as w: return w.getnframes() / w.getframerate()
    except Exception: return None

checks = []
def chk(level, name, msg): checks.append({"level": level, "check": name, "msg": msg})

files = {role: info(rel) for role, rel in F.items()}
for role, i in files.items():
    if i.get("missing"): chk("FAIL", "files", f"{role}: {i['path']} is missing")
also = []
for g in spec.get("also", []):
    for p in sorted(glob.glob(str(ROOT / g))): also.append(info(os.path.relpath(p, ROOT)))

# 1. the voice timings were built from THIS script (same VO lines, same text)
if "script" in F and "vo" in F and not files["script"].get("missing") and not files["vo"].get("missing"):
    import fw_check
    vo_lines = [fw_check.strip_refs(v["text"]).strip() for v in fw_check.parse_script(str(ROOT / F["script"]))["vo"]]
    js = subprocess.run(["node", "-e", f"const V=require({json.dumps(str(ROOT / F['vo']))}); console.log(JSON.stringify({{lines: V.lines.map(l => l.text), estimated: V.estimated, voEnd: V.voEnd}}))"], capture_output=True, text=True)
    try:
        V = json.loads(js.stdout)
        if V["lines"] == vo_lines: chk("PASS", "script = vo.js", f"{len(vo_lines)} VO lines, word for word")
        else:
            diff = [i for i in range(max(len(V['lines']), len(vo_lines))) if (V['lines'][i:i+1] or [None]) != (vo_lines[i:i+1] or [None])]
            chk("FAIL", "script = vo.js", f"vo.js was built from a different script: {len(V['lines'])} vs {len(vo_lines)} VO lines; first difference at line {diff[0] if diff else '?'}. Re-run make_vo.py (and re-time the score) for this script")
        chk("WARN" if V["estimated"] else "PASS", "voice timings", "vo.js times are ESTIMATED (no recorded take yet)" if V["estimated"] else f"vo.js times come from the recorded take (voEnd {V['voEnd']} s)")
    except Exception as e: chk("FAIL", "script = vo.js", f"could not read vo.js: {e} {js.stderr[:200]}")

# 2. the score loads and covers the runtime
if "score" in F and not files["score"].get("missing"):
    js = subprocess.run(["node", "-e", f"globalThis.CUE_LOG=[]; const S=require({json.dumps(str(ROOT / F['score']))}); console.log(JSON.stringify({{n: S.SHOTS.length, end: S.END_T, dur: S.DURATION, outro: S.OUTRO ?? null, first: S.SHOTS[0].t0}}))"], capture_output=True, text=True, cwd=str(ROOT / spec.get("film", ".")))
    try:
        S = json.loads(js.stdout); chk("PASS" if S["first"] <= 0.01 else "FAIL", "score", f"{S['n']} shots, END_T {S['end']} s, DURATION {S['dur']} s, OUTRO {S['outro']}")
        spec["_score"] = S
    except Exception: chk("FAIL", "score", f"score.js does not load: {js.stderr.strip()[:300]}")

# 3. the soundtrack script, its WAV and what render.js reads (out/music.wav) are the same thing
if "soundtrack_wav" in F and "music_wav" in F and not files["soundtrack_wav"].get("missing") and not files["music_wav"].get("missing"):
    same = files["soundtrack_wav"]["sha256"] == files["music_wav"]["sha256"]
    chk("PASS" if same else "FAIL", "music.wav", "out/music.wav is the declared soundtrack" if same else "out/music.wav differs from the declared soundtrack: clips and mux would use the wrong sound")
    secs = wav_secs(F["soundtrack_wav"])
    if secs and spec.get("_score"): chk("PASS", "soundtrack length", f"{secs:.2f} s (END_T {spec['_score']['end']} s; the rest is the outro)")
if "song_js" in F and "soundtrack_script" in F and not files["song_js"].get("missing") and not files["soundtrack_script"].get("missing"):
    same = files["song_js"]["sha256"] == files["soundtrack_script"]["sha256"]
    chk("PASS" if same else "FAIL", "song.js", "song.js is the declared soundtrack script" if same else "song.js is NOT the declared soundtrack script: `node song.js` would build a different soundtrack")

# 4. the script passes the checker
if "script" in F and not files["script"].get("missing"):
    r = subprocess.run([sys.executable, str(ROOT / "fw_check.py"), "script", str(ROOT / F["script"]), "--out", "/tmp/fw_manifest_script"], capture_output=True, text=True)
    chk("PASS" if r.returncode == 0 else "FAIL", "script checker", "0 FAIL" if r.returncode == 0 else "the script checker reports FAILs (see fw_check.py script)")

# 5. the tools: environment pins and the checker test clips
env = subprocess.run([sys.executable, str(ROOT / "tools/check_env.py"), "--json"], capture_output=True, text=True)
try: ENV = json.loads(env.stdout)
except Exception: ENV = {"ok": False, "items": [], "error": env.stderr[:300]}
chk("PASS" if ENV.get("ok") else "WARN", "environment", "matches ENVIRONMENT.md pins" if ENV.get("ok") else "differs from the pins (python3 tools/check_env.py)")
tests = subprocess.run([sys.executable, str(ROOT / "tests/checkers/run_tests.py"), "--fast"], capture_output=True, text=True)
chk("PASS" if tests.returncode == 0 else "FAIL", "checker tests", tests.stdout.strip().splitlines()[0] if tests.stdout.strip() else tests.stderr[:200])
tools = {t: info(t) for t in ["fw_check.py", "tools/shotlist_check.js", "toolkit_page/fw_review.py", "toolkit_page/fw_critic.md"]}

fails = [c for c in checks if c["level"] == "FAIL"]
man = {"release": spec["name"], "episode": spec.get("episode"), "created": datetime.datetime.now().isoformat(timespec="seconds"),
       "releasable": not fails, "checks": checks, "files": files, "supporting_files": also, "tools": tools, "environment": ENV, "spec": str(spec_path)}
md = [f"# Release manifest · {spec.get('episode', '')} {spec['name']}", "",
      f"Created {man['created']} by `tools/make_manifest.py {spec_path}`. **{'RELEASABLE' if not fails else 'NOT RELEASABLE: ' + str(len(fails)) + ' FAIL'}**", "",
      "## Checks", "", "| Level | Check | Result |", "|---|---|---|"] + [f"| {c['level']} | {c['check']} | {c['msg']} |" for c in checks] + [
      "", "## Files", "", "| Role | Path | SHA-256 (first 16) | Bytes |", "|---|---|---|---|"] + [
      f"| {r} | `{i['path']}` | {'MISSING' if i.get('missing') else i['sha256'][:16]} | {i.get('bytes', '')} |" for r, i in files.items()] + [
      "", "## Tools", "", "| Tool | SHA-256 (first 16) |", "|---|---|"] + [f"| `{t}` | {i.get('sha256', 'MISSING')[:16]} |" for t, i in tools.items()] + [
      "", f"Supporting files: {len(also)} (hashes in MANIFEST.json). Environment: {'matches the pins' if ENV.get('ok') else 'differs from the pins'}."]
print("\n".join(md[:8 + len(checks)]))
if not only_check:
    out = ROOT / spec["episode"] / "releases" / spec["name"]; out.mkdir(parents=True, exist_ok=True)
    (out / "MANIFEST.json").write_text(json.dumps(man, indent=1)); (out / "MANIFEST.md").write_text("\n".join(md) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}/MANIFEST.json and MANIFEST.md")
sys.exit(1 if fails else 0)
