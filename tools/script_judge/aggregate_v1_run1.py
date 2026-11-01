#!/usr/bin/env python3
"""Un-blind and combine the judge panel.
    python3 tools/script_judge/aggregate.py <run dir> --key <key.json>
Reads <run dir>/judge_*.json (each a JSON array from judge_prompt.md). Writes <run dir>/panel.json and panel.md.
Verdicts (rubric.md): GOOD ENOUGH / NOT YET / INCONCLUSIVE (when the panel doesn't separate the Lintel hits from the lows)."""
import json, math, statistics as st, sys
from pathlib import Path
run = Path(sys.argv[1]); key = json.loads(Path(sys.argv[sys.argv.index("--key") + 1]).read_text())
CRIT = ["hook", "payoff", "new_value", "proof", "momentum", "clarity", "takeaway", "ending"]
judges = {}
for f in sorted(run.glob("judge_*.json")):
    txt = f.read_text(); txt = txt[txt.index("["): txt.rindex("]") + 1]
    judges[f.stem.split("_")[1]] = {o["id"]: o for o in json.loads(txt)}
if not judges: sys.exit("no judge_*.json in " + str(run))
rows = {}
for sid, k in key.items():
    got = [j[sid] for j in judges.values() if sid in j]
    if not got: continue
    r = {"id": sid, **k, "n": len(got)}
    for c in CRIT: r[c] = st.median(g[c] for g in got)
    r["overall"] = st.mean(g["overall"] for g in got); r["overall_each"] = [g["overall"] for g in got]
    r["dead_lines"] = st.median(g["dead_lines"] for g in got)
    r["weakest"] = [g.get("weakest_line", "") for g in got]; r["fixes"] = [g.get("one_fix", "") for g in got]
    rows[sid] = r
refs = [r for r in rows.values() if r["kind"] == "ref"]
def rank(xs):
    o = sorted(range(len(xs)), key=lambda i: xs[i]); rk = [0] * len(xs)
    i = 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and xs[o[j + 1]] == xs[o[i]]: j += 1
        for k in range(i, j + 1): rk[o[k]] = (i + j) / 2 + 1
        i = j + 1
    return rk
def spearman(a, b):
    ra, rb = rank(a), rank(b); ma, mb = st.mean(ra), st.mean(rb)
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb)); den = math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
    return num / den if den else 0.0
rho = spearman([r["overall"] for r in refs], [math.log10(r["views"]) for r in refs])
hits = [r for r in refs if r["views"] >= 1_000_000]; lows = [r for r in refs if r["views"] <= 75_000]
bar = min(r["overall"] for r in hits); low_best = max(r["overall"] for r in lows)
separates = bar > low_best and rho >= 0.5
for r in rows.values():
    if r["kind"] != "ours": continue
    core_ok = all(r[c] >= 4 for c in ("payoff", "new_value", "hook")); floor_ok = all(r[c] >= 3 for c in CRIT)
    if not separates: r["verdict"] = "INCONCLUSIVE"
    else: r["verdict"] = "GOOD ENOUGH" if (r["overall"] >= bar and core_ok and floor_ok) else "NOT YET"
    r["why"] = [m for m, ok in ((f"overall {r['overall']:.1f} below the bar {bar:.1f}", r["overall"] >= bar),
                                 ("payoff, new value or hook below 4", core_ok), ("a criterion below 3", floor_ok)) if not ok]
cal = {"judges": len(judges), "spearman_overall_vs_log_views": round(rho, 2), "bar_lowest_hit_overall": round(bar, 2),
       "best_low_overall": round(low_best, 2), "separates_hits_from_lows": separates}
(run / "panel.json").write_text(json.dumps({"calibration": cal, "scripts": sorted(rows.values(), key=lambda r: -r["overall"])}, indent=1))
L = [f"# Script judge panel · {run.name}", "", f"{len(judges)} blind AI judges. Calibration on {len(refs)} Lintel reels with known Instagram views: "
     f"Spearman ρ (overall vs log views) = **{rho:.2f}**; lowest hit scores {bar:.1f}, best low scores {low_best:.1f}: "
     + ("**the panel separates hits from lows**, so the bar is usable." if separates else "**the panel does NOT separate hits from lows**: verdicts are inconclusive."),
     "", "AI judges score scripts, not audiences: this flags weak hooks, thin payoffs, little new value and dead lines; it can't measure retention or sharing.", "",
     "| Script | Views | Overall (each judge) | Hook | Payoff | New value | Proof | Momentum | Clarity | Takeaway | Ending | Dead lines | Verdict |", "|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
for r in sorted(rows.values(), key=lambda r: -r["overall"]):
    name = r["name"] if r["kind"] == "ref" else f"**{r['name']}**"
    views = f"{r['views']:,}" if r["views"] else "—"
    L.append(f"| {name} | {views} | {r['overall']:.1f} ({', '.join(str(x) for x in r['overall_each'])}) | " + " | ".join(f"{r[c]:g}" for c in CRIT) + f" | {r['dead_lines']:g} | {r.get('verdict', '')} |")
L += ["", "## Our scripts: what the judges said", ""]
for r in rows.values():
    if r["kind"] != "ours": continue
    L += [f"### {r['name']}: {r['verdict']}" + (f" ({'; '.join(r['why'])})" if r["why"] else ""), "", "Weakest line, per judge:"] + [f"- \"{w}\"" for w in r["weakest"]] + ["", "The one fix, per judge:"] + [f"- {x}" for x in r["fixes"]] + [""]
(run / "panel.md").write_text("\n".join(L) + "\n")
print("\n".join(L[:6 + len(rows) + 2]))
