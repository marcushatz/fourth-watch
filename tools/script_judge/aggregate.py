#!/usr/bin/env python3
"""Un-blind and combine the judge panel.
    python3 tools/script_judge/aggregate.py <run dir> --key <key.json> [<run dir> --key <key.json> ...] --out <dir>
Each run dir holds judge_*.json (JSON arrays from judge_prompt.md) for one packet set; --key follows its dir. With one dir,
--out defaults to it. Reference reels are pooled across all dirs (every judge who scored them); our scripts are scored by the
judges of their own set. Writes <out>/panel.json and panel.md.

Verdicts (rubric.md, "The bar", v2 rules fixed before run 2):
  GOOD ENOUGH (craft): Overall median >= the highest-scoring reference reel's median, Hook, Payoff and New value medians >= 4,
                       and no criterion median below 3.
  NOT YET:             any of those fails.
The panel is reported as a performance predictor only when it separates the Lintel hits from the lows (Spearman >= 0.5 and
every hit above every low). Either way the verdict is a craft verdict, not a prediction of views."""
import json, math, statistics as st, sys
from pathlib import Path
a = sys.argv[1:]
out = Path(a[a.index("--out") + 1]) if "--out" in a else None
pairs, i = [], 0
while i < len(a):
    if a[i] == "--out": i += 2; continue
    if a[i] == "--key": i += 2; continue
    d = Path(a[i]); k = Path(a[i + 2]) if i + 2 < len(a) and a[i + 1] == "--key" else d / "key.json"
    pairs.append((d, json.loads(k.read_text()))); i += 3 if (i + 1 < len(a) and a[i + 1] == "--key") else 1
out = out or pairs[0][0]; out.mkdir(parents=True, exist_ok=True)
CRIT = ["hook", "payoff", "new_value", "proof", "momentum", "clarity", "takeaway", "ending"]
scores = {}   # name -> {"meta":..., "got":[judge objects], "judges":[labels]}
import hashlib, re
for d, key in pairs:
    pk = d / "packet_A.txt"   # the exact text each judge read: its sha lets fw_check --judge spot a script changed since judging
    judged = dict(re.findall(r"^### (S\d+)\n(.*)$", pk.read_text(), re.M)) if pk.exists() else {}
    for sid, m in key.items():
        if sid in judged: m["sha"] = hashlib.sha256(judged[sid].encode()).hexdigest()[:16]
    for f in sorted(d.glob("judge_*.json")):
        txt = f.read_text(); arr = json.loads(txt[txt.index("["): txt.rindex("]") + 1])
        for o in arr:
            if o["id"] not in key: continue
            m = key[o["id"]]; e = scores.setdefault(m["name"], {"meta": m, "got": [], "judges": []})
            e["got"].append(o); e["judges"].append(f"{d.name}/{f.stem}")
if not scores: sys.exit("no judge replies found")
rows = {}
for name, e in scores.items():
    got = e["got"]; r = {**e["meta"], "n": len(got), "judges": e["judges"]}
    for c in CRIT: r[c] = st.median(g[c] for g in got)
    qp = [g["question_pull"] for g in got if "question_pull" in g]; r["question_pull"] = st.median(qp) if qp else None
    r["overall"] = st.median(g["overall"] for g in got); r["overall_mean"] = round(st.mean(g["overall"] for g in got), 2)
    r["overall_each"] = [g["overall"] for g in got]; r["dead_lines"] = st.median(g["dead_lines"] for g in got)
    r["weakest"] = [g.get("weakest_line", "") for g in got]; r["fixes"] = [g.get("one_fix", "") for g in got]
    rows[name] = r
def rank(xs):
    o = sorted(range(len(xs)), key=lambda i: xs[i]); rk = [0] * len(xs); i = 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and xs[o[j + 1]] == xs[o[i]]: j += 1
        for k in range(i, j + 1): rk[o[k]] = (i + j) / 2 + 1
        i = j + 1
    return rk
def spearman(x, y):
    rx, ry = rank(x), rank(y); mx, my = st.mean(rx), st.mean(ry)
    num = sum((p - mx) * (q - my) for p, q in zip(rx, ry)); den = math.sqrt(sum((p - mx) ** 2 for p in rx) * sum((q - my) ** 2 for q in ry))
    return num / den if den else 0.0
refs = [r for r in rows.values() if r["kind"] == "ref"]
lv = [math.log10(r["views"]) for r in refs]
hits = [r for r in refs if r["views"] >= 1_000_000]; lows = [r for r in refs if r["views"] <= 75_000]
def sep(field):
    vals = [r[field] for r in refs]
    if any(v is None for v in vals): return None
    return {"spearman": round(spearman(vals, lv), 2), "lowest_hit": min(r[field] for r in hits), "best_low": max(r[field] for r in lows),
            "separates": spearman(vals, lv) >= 0.5 and min(r[field] for r in hits) > max(r[field] for r in lows)}
cal = {"reference_reels": len(refs), "judge_replies": len({j for r in rows.values() for j in r["judges"]}),
       "by_field": {f: sep(f) for f in CRIT + ["question_pull", "overall"]}}
cal["overall_predicts_views"] = cal["by_field"]["overall"]["separates"]
bar = max(r["overall"] for r in refs); cal["craft_bar_best_reference_overall"] = bar
for r in rows.values():
    if r["kind"] != "ours": continue
    checks = [(f"overall {r['overall']:g} is below the best reference reel ({bar:g})", r["overall"] >= bar),
              ("hook, payoff or new value is below 4", all(r[c] >= 4 for c in ("hook", "payoff", "new_value"))),
              ("a criterion is below 3", all(r[c] >= 3 for c in CRIT))]
    r["why"] = [m for m, ok in checks if not ok]; r["verdict"] = "GOOD ENOUGH" if not r["why"] else "NOT YET"
    q = cal["by_field"]["question_pull"]
    if q and r["question_pull"] is not None and r["question_pull"] < q["lowest_hit"]:
        r["note"] = f"question pull {r['question_pull']:g} is below every Lintel hit's ({q['lowest_hit']:g})"
order = sorted(rows.values(), key=lambda r: (-r["overall"], -r["overall_mean"]))
(out / "panel.json").write_text(json.dumps({"calibration": cal, "scripts": order}, indent=1))
f_ = cal["by_field"]
L = [f"# Script judge panel · {', '.join(d.name for d, _ in pairs)}", "",
     f"{cal['judge_replies']} blind AI judge replies. Reference reels: {len(refs)} Lintel Network reels with known Instagram views, scored by every judge.", "",
     "**Can the panel predict views?** " + (f"Yes, roughly: Overall separates the hits from the lows (Spearman {f_['overall']['spearman']})." if cal["overall_predicts_views"]
     else f"No. Overall vs views: Spearman {f_['overall']['spearman']}; the lowest-scoring hit got {f_['overall']['lowest_hit']:g}, the best low got {f_['overall']['best_low']:g}. The judges rate craft; they can't tell which reels got the views."), "",
     "Which judged qualities line up with views (Spearman vs log views over the reference reels; every hit above every low = separates):", "",
     "| Quality | Spearman | Lowest hit | Best low | Separates? |", "|---|---|---|---|---|"]
for k, v in f_.items():
    if v: L.append(f"| {k} | {v['spearman']:+.2f} | {v['lowest_hit']:g} | {v['best_low']:g} | {'yes' if v['separates'] else 'no'} |")
L += ["", f"**The craft bar:** Overall at or above the best reference reel ({bar:g}), Hook, Payoff and New value 4+, nothing under 3. "
      "It says a script is at least as well built as the best-built Lintel reel here. It does not predict views.", "",
      "| Script | Views | Overall median (each) | Hook | Payoff | New value | Proof | Momentum | Clarity | Takeaway | Ending | Question pull | Dead lines | Verdict |",
      "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"]
for r in order:
    nm = r["name"] if r["kind"] == "ref" else f"**{r['name']}**"; vw = f"{r['views']:,}" if r["views"] else "—"
    qp = f"{r['question_pull']:g}" if r["question_pull"] is not None else "—"
    L.append(f"| {nm} | {vw} | {r['overall']:g} ({', '.join(str(x) for x in r['overall_each'])}) | " + " | ".join(f"{r[c]:g}" for c in CRIT) + f" | {qp} | {r['dead_lines']:g} | {r.get('verdict', '')} |")
L += ["", "## Our scripts: what the judges said", ""]
for r in order:
    if r["kind"] != "ours": continue
    L += [f"### {r['name']}: {r['verdict']}" + (f" ({'; '.join(r['why'])})" if r["why"] else "") + (f". Note: {r['note']}" if r.get("note") else ""), "",
          "Weakest line, per judge:"] + [f"- \"{w}\"" for w in r["weakest"]] + ["", "The one fix, per judge:"] + [f"- {x}" for x in r["fixes"]] + [""]
L += ["AI judges score scripts, not audiences. They flag weak hooks, thin payoffs, little new value and dead lines; they can't measure retention or sharing (Round 17)."]
(out / "panel.md").write_text("\n".join(L) + "\n")
print("\n".join(L[: L.index("## Our scripts: what the judges said")]))
