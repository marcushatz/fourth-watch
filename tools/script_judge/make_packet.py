#!/usr/bin/env python3
"""Build three blind judge packets: the given scripts plus the calibration reels, each packet in a different order.
    python3 tools/script_judge/make_packet.py ep01-samson/episode_v60_draft.md [...] --out <run dir> [--seed N]
Put only ONE version of an episode in a packet set: judges who read two versions side by side score them against each other
and suggest the other version's changes as fixes (run 1 did this; see rubric.md).
Writes <run dir>/packet_A.txt, packet_B.txt, packet_C.txt and key.json (who is who; never shown to judges)."""
import json, random, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT))
import fw_check
args = sys.argv[1:]; out = Path(args[args.index("--out") + 1]) if "--out" in args else ROOT / "qa_judge_run"
seed = int(args[args.index("--seed") + 1]) if "--seed" in args else 20261031
scripts = [a for i, a in enumerate(args) if not a.startswith("--") and (i == 0 or args[i - 1] not in ("--out", "--seed"))]
eps = [Path(s).parent.name for s in scripts]
if len(eps) != len(set(eps)): sys.exit("two versions of one episode in one packet set: judge them in separate runs (see rubric.md)")
out.mkdir(parents=True, exist_ok=True)
refs = [r for r in json.loads((HERE / "calibration/refs.json").read_text()) if r["id"] not in ("3GMG1QydnIo", "DXjgrIw_46E")]  # question reels only
items = [{"kind": "ref", "name": r["title"], "views": r["views"], "text": r["text"]} for r in refs]
for s in scripts:
    ep = fw_check.parse_script(str(ROOT / s) if not Path(s).is_absolute() else s)
    text = " ".join(fw_check.strip_refs(v["text"]).strip() for v in ep["vo"])
    items.append({"kind": "ours", "name": s, "views": None, "text": re.sub(r"\s+", " ", text)})
ids = [f"S{i + 1:02d}" for i in range(len(items))]
rng = random.Random(seed); rng.shuffle(ids)
key = {ids[i]: {k: v for k, v in it.items() if k != "text"} for i, it in enumerate(items)}
prompt = (HERE / "judge_prompt.md").read_text()
for n, k in (("A", 1), ("B", 2), ("C", 3)):
    order = sorted(range(len(items)), key=lambda i: random.Random(seed + k * 1000 + i).random())
    body = "\n\n".join(f"### {ids[i]}\n{items[i]['text']}" for i in order)
    (out / f"packet_{n}.txt").write_text(prompt + "\n" + body + "\n")
(out / "key.json").write_text(json.dumps(key, indent=1))
print(f"{len(items)} scripts ({len(scripts)} ours, {len(items) - len(scripts)} calibration reels) -> {out}/packet_A.txt, packet_B.txt, packet_C.txt, key.json")
