#!/usr/bin/env python3
"""Tests for tools/generation_gate.py. Run: python3 tests/generation_gate/test_gate.py"""
import copy
import datetime as dt
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

GATE = Path(__file__).resolve().parents[2] / "tools/generation_gate.py"
NOW = dt.datetime.now(dt.timezone.utc)
TOOL = "mcp__Higgsfield__generate_image"
SESSION = "session-a"
PARAMS = {"model": "gpt_image_2_5", "prompt": "A gouache desert", "aspect_ratio": "9:16",
          "resolution": "2k", "quality": "high", "count": 1}
VIDEO = {"model": "kling3_0", "prompt": "Slow push in", "aspect_ratio": "9:16", "duration": 5, "mode": "std", "count": 1}


def iso(hours):
    return (NOW + dt.timedelta(hours=hours)).isoformat()


def item(tool="generate_image", params=None, kind="job", credits=2.75, remaining=1, quoted=-1):
    entry = {"kind": kind, "tool": tool, "input": {"params": copy.deepcopy(params or PARAMS)}, "remaining": remaining}
    if kind == "job":
        entry.update(quoted_credits=credits, quoted_at=iso(quoted))
    return entry


def approval(items=None, **changes):
    data = {"schema": 2, "approved_by": "Marcus", "approved_message": "Approved, run the gouache still",
            "approved_at": iso(-0.5), "expires_at": iso(0.5), "session_id": SESSION,
            "max_total_credits": 2.75, "items": items if items is not None else [item()]}
    data.update(changes)
    return data


def run(root, tool=TOOL, params=None, tool_input=None, raw=None, session=SESSION):
    body = tool_input if tool_input is not None else {"params": params or PARAMS, "context": "analytics"}
    payload = raw if raw is not None else json.dumps({"tool_name": tool, "session_id": session, "tool_input": body})
    env = dict(os.environ, FW_GATE_ROOT=str(root))
    return subprocess.run([sys.executable, str(GATE)], input=payload, text=True, capture_output=True, env=env)


failures = 0


def check(name, result, want):
    global failures
    ok = result.returncode == want
    failures += not ok
    detail = "" if ok else f" stderr: {result.stderr.strip()[:160]}"
    print(f"{'ok  ' if ok else 'FAIL'} {name} (exit {result.returncode}, want {want}){detail}")


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    folder = root / "production/approvals"
    folder.mkdir(parents=True)
    path = folder / "current.json"

    def write(data):
        path.write_text(json.dumps(data))

    # No approval
    check("no approval file blocks", run(root), 2)
    check("bad hook input blocks", run(root, raw="not json"), 2)
    path.write_text("{broken")
    check("broken approval file blocks", run(root), 2)

    # Free and unknown tools
    path.unlink()
    check("balance is free", run(root, tool="mcp__Higgsfield__balance", tool_input={}), 0)
    check("reading the catalog is free", run(root, tool="mcp__Higgsfield__get_presets", tool_input={}), 0)
    check("an unknown tool blocks", run(root, tool="mcp__Higgsfield__relight_image", tool_input={}), 2)
    check("a differently named server still blocks", run(root, tool="mcp__claude_ai_Higgsfield__generate_image"), 2)
    check("listing Elements is free", run(root, tool="mcp__Higgsfield__manage_reference_elements", tool_input={"action": "list"}), 0)
    check("creating an Element blocks", run(root, tool="mcp__Higgsfield__manage_reference_elements", tool_input={"action": "create"}), 2)

    # Same model, different job
    for name, change in [("prompt", {"prompt": "A different scene"}), ("resolution", {"resolution": "4k"}),
                         ("quality", {"quality": "max"}), ("aspect ratio", {"aspect_ratio": "16:9"}),
                         ("count", {"count": 4})]:
        write(approval())
        check(f"same model, different {name} blocks", run(root, params={**PARAMS, **change}), 2)
    write(approval())
    check("an extra reference image blocks", run(root, params={**PARAMS, "medias": [{"role": "image_references", "value": "x"}]}), 2)
    write(approval([item("generate_video", VIDEO)]))
    check("a longer duration blocks", run(root, "mcp__Higgsfield__generate_video", {**VIDEO, "duration": 10}), 2)
    write(approval([item("generate_video", VIDEO)]))
    check("a higher-cost mode blocks", run(root, "mcp__Higgsfield__generate_video", {**VIDEO, "mode": "pro"}), 2)
    write(approval())
    check("a different model blocks", run(root, params={**PARAMS, "model": "seedance_2_5"}), 2)
    write(approval())
    check("a different tool blocks", run(root, tool="mcp__Higgsfield__generate_video"), 2)

    # The exact job
    write(approval())
    result = run(root)
    check("the exact job runs once", result, 0)
    check("a used approval removes its file", subprocess.CompletedProcess([], 0 if not path.exists() else 1), 0)
    check("the second run blocks", run(root), 2)
    write(approval())
    check("a job passed as a JSON string matches", run(root, tool_input={"params": json.dumps(PARAMS)}), 0)
    write(approval([item(), item("generate_video", VIDEO, credits=0)]))
    check("a two-job approval allows job one", run(root), 0)
    check("that job can't run twice", run(root), 2)
    check("job two still runs", run(root, "mcp__Higgsfield__generate_video", VIDEO), 0)

    # Cost checks
    write(approval())
    check("a job approval doesn't allow its cost check", run(root, params={**PARAMS, "get_cost": True}), 2)
    write(approval([item(kind="cost_check")], max_total_credits=0))
    check("an approved cost check runs", run(root, params={**PARAMS, "get_cost": True}), 0)
    write(approval([item(kind="cost_check")], max_total_credits=0))
    check("a cost-check approval doesn't allow the real job", run(root), 2)
    write(approval([item(kind="cost_check")], max_total_credits=0))
    check("a different cost check blocks", run(root, params={**PARAMS, "quality": "max", "get_cost": True}), 2)

    # The record itself
    write(approval(expires_at=iso(-0.1)))
    check("an expired approval blocks", run(root), 2)
    write(approval(approved_at=iso(-1), expires_at=iso(3)))
    check("an approval over 2 hours blocks", run(root), 2)
    write(approval(approved_message="   "))
    check("missing words from Marcus blocks", run(root), 2)
    write(approval(approved_by="Claude"))
    check("an approval not from Marcus blocks", run(root), 2)
    write(approval(session_id="session-b"))
    check("an approval from another session blocks", run(root), 2)
    write(approval(schema=1))
    check("the old model-only format blocks", run(root), 2)

    # Cost limits
    write(approval(max_total_credits=2))
    check("quotes above the approved total block", run(root), 2)
    write(approval([item(quoted=-25)]))
    check("a stale quote blocks", run(root), 2)
    write(approval([item(params={**PARAMS, "count": 4}, credits=11)], max_total_credits=11))
    check("an expensive multi-run job blocks", run(root, params={**PARAMS, "count": 4}), 2)
    write(approval([item("generate_image_batch", credits=8)], max_total_credits=8))
    check("an expensive batch blocks", run(root, "mcp__Higgsfield__generate_image_batch"), 2)

print("all gate tests passed" if not failures else f"{failures} gate test(s) failed")
sys.exit(1 if failures else 0)
