#!/usr/bin/env python3
"""Convert a recorded voice's words.json (from engine/voice.py record, or from ASR on an ElevenLabs take) into the
flat [{s, e}] list tools/make_vo.py --words expects: one entry per script token (text.split() of each VO line,
references stripped), in order. Tokens that are not spoken words (dashes, ellipses) borrow their neighbour's time."""
import json, re, sys
from pathlib import Path
sys.path.insert(0, "/home/claude/fourth-watch")
sys.path.insert(0, "/home/claude/fourth-watch/engine")
import fw_check as F
import voice

ep, words_json, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines = F.parse_script(ep)["vo"]
W = json.loads(Path(words_json).read_text())
by_line = {}
for w in W: by_line.setdefault(w["line"], []).append(w)
flat = []
for i, v in enumerate(lines):
    text = F.strip_refs(v["text"]).strip()
    ws = by_line.get(i, [])
    k = 0
    for tok in text.split():
        n = len(re.findall(r"[A-Za-z0-9'\-]+", voice.speakable(tok)))
        if n == 0 or k >= len(ws):
            ref = ws[min(k, len(ws) - 1)] if ws else {"start": flat[-1]["e"] if flat else 0, "end": flat[-1]["e"] if flat else 0}
            flat.append({"s": ref["start"], "e": ref["end"]}); continue
        a, b = ws[k], ws[min(k + n - 1, len(ws) - 1)]
        flat.append({"s": a["start"], "e": b["end"]}); k += n
    if k != len(ws): print(f"line {i}: {len(ws)} spoken words, {k} mapped: {text[:60]}")
Path(out).write_text(json.dumps(flat))
print(f"{len(flat)} tokens -> {out}")
