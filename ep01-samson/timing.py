# Estimate VO line timings at a narrator pace, with beat pauses -> shot timing for the shot list.
import re, sys, json
sys.path.insert(0, "/home/claude/fourth-watch"); import fw_check as F
ep = F.parse_script(sys.argv[1] if len(sys.argv) > 1 else "episode.md")
WPM = float(sys.argv[2]) if len(sys.argv) > 2 else 158; t = 0.15; rows = []
PS = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0          # pause scale: 0.5 for the Lintel pace
PAUSE = {k: v * PS for k, v in {"same": 0.25, "section": 0.45, "turn": 0.55}.items()}
prev = None
for v in ep["vo"]:
    if prev is not None:
        t += PAUSE["turn"] if (v["section"] == "turn" and prev != "turn") else PAUSE["section"] if v["section"] != prev else PAUSE["same"]
    n = len(F.tokens(F.strip_refs(v["text"]), spell_numbers=True))
    slow = 1.15 if F.strip_refs(v["text"]).startswith('"') else 1.0       # scripture read a touch slower
    d = n / WPM * 60 * slow + 0.12 * len(re.findall(r"[,.;:?!]", F.strip_refs(v["text"])[:-1]))
    rows.append({"section": v["section"], "start": round(t, 2), "end": round(t + d, 2), "words": n, "vo": F.strip_refs(v["text"])})
    t += d; prev = v["section"]
for r in rows: print(f'{r["start"]:5.2f}-{r["end"]:5.2f}  {r["section"]:8s} {r["words"]:2d}w  {r["vo"]}')
print("VO ends", round(t, 2), "· with 1.0s loop tail:", round(t + 1.0, 2), "s ·", sum(r["words"] for r in rows), "words")
json.dump(rows, open("timing.json", "w"), indent=1)
