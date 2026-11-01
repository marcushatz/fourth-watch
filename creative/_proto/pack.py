#!/usr/bin/env python3
"""PROTOTYPE (proposal step P0): build a creative context pack for one sequence, content-hashed, so the creative director
reads ~2k tokens instead of the research library. Re-running with unchanged sources is a cache hit (prints HIT, writes nothing).
    python3 creative/_proto/pack.py <out_dir> <episode.md> <vo.js> <t0> <t1> <accuracy_notes.md>"""
import hashlib, json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
out, ep, vo, t0, t1, acc = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve(), Path(sys.argv[3]).resolve(), float(sys.argv[4]), float(sys.argv[5]), Path(sys.argv[6]).resolve()
score = vo.parent / "score.js"
srcs = [ep, vo, score, Path(__file__).resolve(), acc, ROOT / "creative/digests/canon.md", ROOT / "creative/digests/engine_manifest.md",
        ROOT / "creative/digests/reads_model.md", ROOT / "creative/motifs.yaml"]
h = hashlib.sha256(); [h.update(p.read_bytes()) for p in srcs]; h.update(f"{t0}-{t1}".encode()); key = h.hexdigest()[:16]
meta = out / "pack.meta.json"
if meta.exists() and json.loads(meta.read_text()).get("key") == key:
    print("HIT", key); sys.exit(0)
V = json.loads(re.search(r"const VO=(\{[\s\S]*?\});", vo.read_text()).group(1))
lines = [l for l in V["lines"] if l["end"] > t0 and l["start"] < t1]
win = "\n".join(f'- line {l["i"]} ({l["start"]:.2f}-{l["end"]:.2f}): {l["text"]}\n  words: ' +
                " ".join(f'{w["w"]}@{w["s"]:.2f}' for w in l["words"] if t0 - 0.01 <= w["s"] <= t1) for l in lines)
prev = [l for l in V["lines"] if l["end"] <= t0][-1:]; nxt = [l for l in V["lines"] if l["start"] >= t1][:1]
# the shot on screen just before the window (its set decides the place-read minimum), from the score itself
sh = json.loads(subprocess.run(["node", "-e", "const S=require(process.argv[1]);console.log(JSON.stringify(S.SHOTS.map(s=>[s.id,s.scene,s.v,s.t0,s.t1])))", str(score)],
                               capture_output=True, text=True, check=True).stdout)
before = [s for s in sh if s[3] < t0 - 0.01][-1]
# approved on-screen verse cards that belong to a VO line in the window (episode.md puts each VERSE right after its VO line)
md, req, last_vo = ep.read_text().splitlines(), [], None
for ln in md:
    if ln.startswith("VO:"): last_vo = re.sub(r"\s*\[.*?\]\s*$", "", ln[3:]).strip().strip('"')
    if ln.startswith("VERSE:") and last_vo and any(last_vo == l["text"].strip().strip('"') for l in lines): req.append(ln[6:].strip())
ctx = f"- shot before the window: {before[0]} {before[1]}/{before[2]} ({before[3]:.2f}-{before[4]:.2f})\n" + "".join(f"- required verse card: {v}\n" for v in req) + "".join(f"- before: {l['text']}\n" for l in prev) + "".join(f"- after: {l['text']}\n" for l in nxt)
parts = [f"# Context pack · {ep.parent.name} · {t0:.2f}-{t1:.2f} s · key {key}",
         "## Approved narration in the window (locked: never change a word)\n" + win + "\n" + ctx,
         "## Accuracy notes for this window\n" + acc.read_text().strip()] + [p.read_text().strip() for p in srcs[5:]]
text = "\n\n".join(parts) + "\n"
out.mkdir(parents=True, exist_ok=True); (out / "pack.md").write_text(text)
meta.write_text(json.dumps({"key": key, "sources": {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()[:16] for p in srcs},
                            "chars": len(text), "est_tokens": len(text) // 4}, indent=1))
print("BUILT", key, len(text) // 4, "tokens (est)")
