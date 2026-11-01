#!/usr/bin/env python3
"""PROTOTYPE (proposal step P5): compile a validated creative spec into score.js shots, mechanically (no model).
Writes a COPY of the episode's score with the window's shots swapped for the spec's, so the existing shot-list linter can
check every seam against its neighbours. The film's own score.js is never touched.
    python3 creative/_proto/compile_spec.py <spec.yaml> <film_dir> <out_score.js>
Data the score can carry today: cut times on words, beats, bubble, verse card, plan fields (size, angle, act, change, cam).
Camera, poses and light are CODE in each scene file (SH.<v>), so each compiled shot also gets a BUILD note: the builder's job."""
import json, os, re, sys
from pathlib import Path
import yaml

spec_p, film, out = Path(sys.argv[1]), Path(sys.argv[2]).resolve(), Path(sys.argv[3]).resolve()
spec = yaml.safe_load(spec_p.read_text())
w0, w1 = spec["sequence"]["window"]
src = (film / "score.js").read_text()
V = json.loads(re.search(r"const VO=(\{[\s\S]*?\});", (film / "vo.js").read_text()).group(1))
verses = re.findall(r"\{ text: '(.*?)', ref: '(.*?)'", src)
norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())

def cue(word, t_hint):  # the narrated word nearest the spec's window position -> cue(line, 'word') source text
    best = None
    for l in V["lines"]:
        for w in l["words"]:
            if norm(w["w"]) == norm(word) and w1 + .1 >= w["s"] >= w0 - .1 and (best is None or abs(w["s"] - t_hint) < abs(best[2] - t_hint)):
                best = (l["i"], norm(w["w"]), w["s"])
    if not best: raise SystemExit(f"compile: '{word}' is not a narrated word in the window")
    return f"cue({best[0]}, '{best[1]}')", best[2]

def cue_at(t):  # the narrated word starting nearest time t (for text that lands mid-line, e.g. a card on its 3rd word)
    l, w = min(((l, w) for l in V["lines"] for w in l["words"]), key=lambda lw: abs(lw[1]["s"] - t))
    return f"cue({l['i']}, '{norm(w['w'])}')"

lines, patches, slug = [], {}, lambda s: re.sub(r"[^a-z]+", "_", s.lower()).strip("_")[:14] or "beat"
for s in spec["scenes"]:
    a, b = s["t"]; first = s["vo"][0]["from"]
    t0src, t0 = cue(first, a)
    o, beats = {}, {}
    for i, act in enumerate(s.get("action", []) or []):
        src_, _ = cue(act["at"], a); beats[f"{act.get('pose', 'a')}{i}"] = src_
    for au in s.get("audio", []) or []:
        src_, _ = cue(au["at"], a); beats.setdefault(slug(au["cue"].split(",")[0]), src_)
    comp, cam = s.get("comp", {}), s.get("cam", {})
    o["size"] = repr(str(comp.get("size", "ms")).lower()); o["angle"] = repr(comp.get("angle", "eye"))
    mv = cam.get("move", "hold"); mv = "still" if mv in ("hold", "locked", "none") else mv
    o["cam"] = "{ move: %r, amt: %g }" % (mv, round(float(cam.get("amt", 0)) * 100, 1))
    acts = "; ".join(f"on '{x['at']}' {x['who']} {x['does']}" for x in s.get("action", []) or [])
    o["act"] = json.dumps(acts) if acts else "''"
    o["change"] = json.dumps(str(s.get("light", {}).get("change", "")))
    tx = s.get("text") or {}
    if tx.get("kind") == "bubble":
        beats["bubble"] = cue_at(tx["t"][0])
        o["bubble"] = "{ text: %s, beat: 'bubble' }" % json.dumps(str(tx["words"]).upper())
    if tx.get("kind") == "verse":
        idx = [i for i, (vt, _) in enumerate(verses) if vt == str(tx["words"]).strip('"')]
        if not idx: raise SystemExit(f"compile: verse '{tx['words']}' is not in the score's VERSES")
        vsrc = cue_at(tx["t"][0])
        o["card"], o["verse"], o["verseAt"] = "'verse'", str(idx[0]), vsrc
    o["beats"] = "{ " + ", ".join(f"{k}: {v}" for k, v in beats.items()) + " }"
    st = s.get("set", {})
    build = [f"set {st.get('scene')}/{st.get('v')}" + ("" if st.get("v") in ("wake", "left", "call", "shave", "traps", "delilah") else " (NEW variant: SH." + str(st.get("v")) + ")"),
             f"camera {comp.get('size')} {comp.get('angle')}, {cam.get('move')} {cam.get('amt', 0)} from '{cam.get('start', '-')}'",
             "poses " + ", ".join(f"{x['who']}.{x['pose']}@{x['at']}" for x in s.get("action", []) or []),
             f"light: {s.get('light', {}).get('key')}; gold {s.get('light', {}).get('gold')}"] + \
            [f"NEW primitive {n['name']}: {n['api']}" for n in s.get("new", []) or []]
    note = f"  // CD {s['id']} ({a:.2f}-{b:.2f}) BUILD: " + " | ".join(build)
    if s.get("extends"):  # the tail of an existing shot: no new cut; merge the plan, text and beats into that shot
        x = s["extends"]; bt = o.pop("beats")
        patches[x] = [note.replace("BUILD:", f"extends {x}, no cut; BUILD:"), f"  Object.assign(S.find((s) => s.id === '{x}'), {{ " + ", ".join(f"{k}: {v}" for k, v in o.items()) + " });",
                      f"  Object.assign(S.find((s) => s.id === '{x}').beats, {bt});"]
        continue
    lines.append(note)
    lines.append(f"  add('CD_{s['id']}', '{st.get('scene')}', '{st.get('v')}', {t0src} - PRE, {{ " + ", ".join(f"{k}: {v}" for k, v in o.items()) + " });")

# swap: drop the shots that START inside the window, insert the compiled ones after the last shot before it
sh = [(m.start(), m.end(), float(0)) for m in re.finditer(r"^  add\('S\d+'.*?;\s*$", src, re.M)]
import subprocess
times = json.loads(subprocess.run(["node", "-e", "const S=require(process.argv[1]);console.log(JSON.stringify(S.SHOTS.map(s=>[s.id,s.t0])))", str(film / "score.js")],
                                  capture_output=True, text=True, check=True).stdout)
inside = {i for i, t in times if w0 - .05 <= t < w1 - .05}
keep, insert_at = [], None
for ln in src.splitlines():
    m = re.match(r"\s*add\('(S\d+)'", ln)
    if m and m.group(1) in inside:
        insert_at = insert_at if insert_at is not None else len(keep); keep.append(f"  // (window {w0}-{w1}: {m.group(1)} replaced by the creative spec)"); continue
    keep.append(ln)
if insert_at is None:  # no shot starts inside the window: insert after the shot that covers w0
    last = max(i for i, t in times if t < w0)
    insert_at = next(k for k, ln in enumerate(keep) if f"add('{last}'" in ln) + 1
keep[insert_at:insert_at] = lines
for x, pl in patches.items():
    k = next(k for k, ln in enumerate(keep) if f"add('{x}'" in ln) + 1
    keep[k:k] = pl
rel = os.path.relpath(film, out.parent)
text = "\n".join(keep).replace("require('./engine/", f"require('{rel}/engine/").replace("require('./vo.js')", f"require('{rel}/vo.js')")
text = text.replace("(function () {", f"// GENERATED by creative/_proto/compile_spec.py from {spec_p.name}: a copy of {film.name}/score.js with {w0}-{w1} s swapped. Never edit by hand.\n(function () {{", 1)
out.write_text(text + "\n")
print(f"compiled {len(spec['scenes'])} shots -> {out} (replaced: {', '.join(sorted(inside)) or 'none'})")
print("\n".join(l for pl in patches.values() for l in pl) + "\n" + "\n".join(lines))
