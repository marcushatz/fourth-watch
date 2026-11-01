#!/usr/bin/env python3
"""PROTOTYPE (proposal step P4): validate a creative-director scene spec mechanically, so no model has to.
    python3 tools/creative/spec_check.py <spec.yaml> <pack.md> <episode.md> [--budget-new N]
Checks: window coverage, locked narration, the read-timing model, one text element at a time, brand canon (gold, doors,
faces), engine reuse against the manifest, transitions at every seam, verse refs, audio anchors. Prints a per-scene cache key
(sha of the scene's YAML): a scene whose key is unchanged since its last PASS is never re-reviewed or re-rendered."""
import hashlib, json, re, sys
from pathlib import Path
import yaml

spec_p, pack_p, ep_p = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
budget_new = int(sys.argv[sys.argv.index("--budget-new") + 1]) if "--budget-new" in sys.argv else 2
txt = spec_p.read_text()
m = re.search(r"```yaml\n(.*?)```", txt, re.S)
spec = yaml.safe_load(m.group(1) if m else txt)
pack = pack_p.read_text()

# what exists (prototype: from the engine manifest digest; the real tool generates this from _API.md / PP2_API.md)
SCENES = {"gaza": "hook door rip hill question principle dawn dawn2 dawn3 statement", "sorek": "delilah call traps shave wake left",
          "timnah": "lion bride ashkelon wide", "lehi": "", "zorah": "angel", "prison": "mill hair lookup", "dagon": "pillars fall", "day": "crowd door"}
SCENES = {k: set(v.split()) for k, v in SCENES.items()}
RIG = {"samson": "stand walk carry point lean sleep wake strain burst grind lookup pray push", "delilah": "stand turn call sit beckon",
       "person": "stand raise hold kneel cheer fall", "lord": "stand laugh fall", "barber": "shave", "angel": "stand speak"}
RIG = {k: set(v.split()) for k, v in RIG.items()}
DEVICES = set("verse label pill counter tally stamp bubble chapter tags captions rays bloom flash dark scrim dip flashIn dust shaft pool camera".split())
TRANS = {"cut", "cut_on_action", "match", "dip", "flashIn", "hold", "carry"}
MIN = {"place": .8, "entity": .3, "action": .5, "light": .8, "payoff": 1.2}
FACE = re.compile(r"\b(smil\w*|frown\w*|grimac\w*|wince\w*|express\w*|brow\w*|eyes widen\w*|mouth)\b", re.I)

# the locked narration window: words with times, from the pack
words = [(w.rsplit("@", 1)[0], float(w.rsplit("@", 1)[1])) for ln in re.findall(r"words: (.*)", pack) for w in ln.split()]
before_set = (re.findall(r"shot before the window: \S+ (\w+)/", pack) or [None])[0]
gold_rule = (re.findall(r"gold allowed: (.*)", pack) or [None])[0]
required_verses = re.findall(r'required verse card: "(.*?)"', pack)
verse_cards = re.findall(r'^VERSE: "(.*?)" — (.*?) \(ESV\)', ep_p.read_text(), re.M)

out, fails = [], 0
def add(level, scene, msg):
    global fails
    fails += level == "FAIL"; out.append(f"{level:4} {scene:3} {msg}")
def wtime(word, scene):
    hits = [t for w, t in words if w == word]
    if not hits: add("FAIL", scene, f"anchor word '{word}' is not a narrated word in the window"); return None
    return hits[0]

w0, w1 = spec["sequence"]["window"]
scenes = spec["scenes"]
prev_end, prev_set, new_count = w0, before_set, 0
for s in scenes:
    sid = s["id"]; a, b = s["t"]
    if abs(a - prev_end) > .05: add("FAIL", sid, f"starts at {a}, previous scene ends at {prev_end} (gap or overlap)")
    if b - a < 1.0: add("FAIL", sid, f"shot is {b - a:.2f} s; nothing under 1 s")
    if b - a > 12: add("FAIL", sid, f"shot is {b - a:.2f} s; over 12 s")
    prev_end = b
    # reuse
    st = s.get("set", {}); sc, v = st.get("scene"), str(st.get("v", ""))
    if sc not in SCENES: add("FAIL", sid, f"scene '{sc}' doesn't exist")
    elif v.startswith("new:"): add("INFO", sid, f"new shot in an existing set: {sc}/{v[4:]} (built from existing parts)")
    elif v not in SCENES[sc]: add("WARN", sid, f"{sc}/{v} isn't built (it would silently fall back to the module default)")
    for r in s.get("reuse", {}).get("rig", []):
        who, _, pose = r.partition(".")
        if who in RIG and pose and pose not in RIG[who]: add("WARN", sid, f"rig pose {r} doesn't exist")
    for d in s.get("reuse", {}).get("devices", []):
        if d not in DEVICES: add("WARN", sid, f"device '{d}' isn't in the manifest")
    new_count += len(s.get("new", []) or [])
    for act in s.get("action", []):
        if FACE.search(str(act.get("does", ""))): add("FAIL", sid, f"facial acting the rig can't do: '{act['does'][:60]}'")
        if act.get("at"): wtime(act["at"], sid)
        who, pose = act.get("who"), act.get("pose")
        if who in RIG and pose and pose not in RIG[who]: add("WARN", sid, f"{who}.{pose} isn't a rig pose")
    # camera
    cam = s.get("cam", {})
    if cam.get("start") and cam.get("move") not in (None, "none", "hold", "locked"): wtime(cam["start"], sid)
    # brand
    blob = json.dumps(s).lower()
    if re.search(r"\bdoors?\b|doorway", blob): add("FAIL", sid, "door imagery is ruled out (canon)")
    if re.search(r"\bscales?\b|\bbalanc(e|es|ed|ing)\b|\bweigh(s|ed|ing)?\b", blob): add("FAIL", sid, "balance/weighing imagery is ruled out (canon)")
    gold = float(s.get("light", {}).get("gold", 0) or 0)
    if gold > 0:   # gold = what God does: only where the pack's passage rule allows it (canon; 07 §6)
        if gold_rule is None: add("WARN", sid, f"gold {gold} but the pack has no 'gold allowed:' line for this passage; check the text says God acted here")
        elif gold_rule.lower().startswith("none"): add("FAIL", sid, f"gold {gold}, but this passage allows none: {gold_rule}")
    # text: one element at a time, exact wording
    tx = s.get("text", {}) or {}
    if tx.get("kind") not in (None, "none"):
        ws = str(tx.get("words", ""))
        if tx["kind"] == "pill" and len(ws.split()) > 5: add("WARN", sid, "pill over 5 words")
        if tx["kind"] == "verse" and not any(ws.strip('"') == vt for vt, _ in verse_cards):
            add("FAIL", sid, f"verse text isn't an approved ESV verse card: '{ws[:50]}'")
        if tx["kind"] == "bubble":
            spoken = re.sub(r"[^a-z ]", "", " ".join(w for w, _ in words).lower())
            if re.sub(r"[^a-z ]", "", ws.lower()) not in spoken: add("FAIL", sid, f"bubble words aren't narrated words: '{ws}'")
    # reads
    reads = sorted(s.get("reads", []), key=lambda r: r["t"][0]); last = a
    for r in reads:
        r0, r1 = r["t"]; k = r.get("kind")
        if r0 < a - .05 or r1 > b + .05: add("FAIL", sid, f"read '{r['what'][:40]}' runs outside the shot")
        if r0 < last - .05: add("WARN", sid, f"reads overlap at {r0}: '{r['what'][:40]}' (one important read at a time)")
        need = MIN.get(k, 0)
        if k == "place" and prev_set == sc: need = .5
        if k == "text" and tx.get("kind") not in ("verse", "bubble"): need = .35 + .25 * len(str(tx.get("words", "")).split())
        if r1 - r0 < need - .02: add("FAIL", sid, f"{k} read '{r['what'][:40]}' gets {r1 - r0:.2f} s; needs {need:.2f} s")
        if not r.get("eye"): add("WARN", sid, f"read '{r['what'][:40]}' doesn't say where the eye is")
        if r0 - last > 2.05: add("WARN", sid, f"{r0 - last:.1f} s with no read before '{r['what'][:30]}' (beat clock ~2 s)")
        last = max(last, r1)
    if b - last > 2.05: add("WARN", sid, f"{b - last:.1f} s with no read at the end of the shot")
    for au in s.get("audio", []) or []: wtime(au.get("at", ""), sid)
    if not s.get("verses"): add("FAIL", sid, "no verse reference for the pictures")
    tr = (s.get("trans_out") or {}).get("kind")
    if tr not in TRANS: add("FAIL", sid, f"transition out '{tr}' isn't one the engine has ({', '.join(sorted(TRANS))})")
    if tr == "match" and not (s.get("trans_out") or {}).get("note"): add("WARN", sid, "a match cut needs its matching shape named")
    prev_set = sc
    s["_key"] = hashlib.sha256(yaml.safe_dump(s, sort_keys=True).encode()).hexdigest()[:12]
if abs(prev_end - w1) > .05: add("FAIL", "-", f"scenes end at {prev_end}, window ends at {w1}")
# every narrated word belongs to a scene, in order
covered = []
for s in scenes:
    for r in s.get("vo", []):
        idx = [i for i, (w, _) in enumerate(words) if w == r["from"]], [i for i, (w, _) in enumerate(words) if w == r["to"]]
        if idx[0] and idx[1]: covered += list(range(idx[0][0], idx[1][0] + 1))
missing = [words[i][0] for i in range(len(words)) if i not in covered]
if missing: add("FAIL", "-", f"narrated words with no scene: {' '.join(missing)}")
if new_count > budget_new: add("FAIL", "-", f"{new_count} new primitives; the budget allows {budget_new}")
shown = [str((s.get("text") or {}).get("words", "")).strip('"') for s in scenes if (s.get("text") or {}).get("kind") == "verse"]
for rv in required_verses:
    if rv not in shown: add("FAIL", "-", f"approved verse card missing: \"{rv[:50]}\" (the script puts it in this window)")
reads_n = sum(len(s.get("reads", [])) for s in scenes)
print("\n".join(out) or "no findings")
print(f"\n{len(scenes)} scenes, {reads_n} timed reads, {new_count} new primitive(s), {fails} FAIL")
print("scene cache keys: " + ", ".join(f"{s['id']}={s['_key']}" for s in scenes))
sys.exit(1 if fails else 0)
