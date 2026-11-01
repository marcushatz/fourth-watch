#!/usr/bin/env python3
"""PROTOTYPE (proposal: tools/creative/budget.py): the ledger and the caps. Every model call or paid generation is logged;
`check` runs BEFORE a call and refuses it (exit 1) if it would pass a cap.
    budget.py log    <ledger.jsonl> <phase> <model> <tokens> [usd] [note]   # tokens = what the agent run reports (subagent_tokens)
    budget.py check  <ledger.jsonl> <budget.yaml> <phase> <model> <est_tokens> [scene]
    budget.py report <ledger.jsonl> <budget.yaml>
Phases that count as revisions: treatment_round, spec_pass (per scene, or 'all'), build_pass (per scene), opus_escalation."""
import json, sys, time
from collections import Counter
from pathlib import Path
import yaml

def load(ledger):
    p = Path(ledger)
    return [json.loads(l) for l in p.read_text().splitlines() if l.strip()] if p.exists() else []

def totals(rows):
    tok, usd, rev = Counter(), 0.0, Counter()
    for r in rows:
        tok[r["model"]] += r["tokens"]; usd += r.get("usd", 0)
        rev[(r["phase"], r.get("scene", "all"))] += 1
    return tok, usd, rev

cmd = sys.argv[1]
if cmd == "log":
    ledger, phase, model, tokens = sys.argv[2], sys.argv[3], sys.argv[4], int(sys.argv[5])
    usd = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
    note = sys.argv[7] if len(sys.argv) > 7 else ""
    row = {"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "phase": phase, "model": model, "tokens": tokens, "usd": usd, "note": note}
    with open(ledger, "a") as f: f.write(json.dumps(row) + "\n")
    print("logged", row)
elif cmd in ("check", "report"):
    rows, cap = load(sys.argv[2]), yaml.safe_load(Path(sys.argv[3]).read_text())
    tok, usd, rev = totals(rows)
    if cmd == "report":
        for m, c in cap["tokens"].items(): print(f"{m:7} {tok[m]:>9,} / {c:,} tokens")
        print(f"external {usd:.2f} / {cap['external_usd']:.2f} USD")
        for (ph, sc), n in sorted(rev.items()): print(f"{ph}[{sc}]: {n}")
        sys.exit(0)
    phase, model, est = sys.argv[4], sys.argv[5], int(sys.argv[6])
    scene = sys.argv[7] if len(sys.argv) > 7 else "all"
    limits = {"treatment_round": cap["revisions"]["treatment_rounds"], "spec_pass": cap["revisions"]["spec_passes_per_scene"],
              "build_pass": cap["revisions"]["build_passes_per_scene"], "opus_escalation": cap["revisions"]["opus_escalations"]}
    problems = []
    if tok[model] + est > cap["tokens"].get(model, 0):
        problems.append(f"{model}: {tok[model]:,} used + {est:,} estimated > cap {cap['tokens'].get(model, 0):,}")
    if phase in limits:
        used = rev[(phase, scene)] + (sum(n for (ph, _), n in rev.items() if ph == phase) if phase == "opus_escalation" else 0)
        if used + 1 > limits[phase]: problems.append(f"{phase}[{scene}]: {used} done, limit {limits[phase]}")
    if problems:
        print("REFUSED: " + "; ".join(problems) + "\nOptions: raise the cap in budget.yaml, resume the existing agent instead of a new one, or stop here.")
        sys.exit(1)
    print(f"OK {phase} {model} ~{est:,} tokens ({cap['tokens'][model] - tok[model] - est:,} left after)")
