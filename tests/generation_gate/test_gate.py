#!/usr/bin/env python3
"""Tests for tools/generation_gate.py. Run: python3 tests/generation_gate/test_gate.py"""
import datetime as dt
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

GATE = Path(__file__).resolve().parents[2] / "tools/generation_gate.py"
FUTURE = (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)).isoformat()
PAST = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=1)).isoformat()


def run(root, tool="mcp__Higgsfield__generate_image", params=None, raw=None):
    payload = raw if raw is not None else json.dumps({"tool_name": tool, "tool_input": {"params": params or {"model": "nano_banana_pro"}}})
    env = dict(os.environ, FW_GATE_ROOT=str(root))
    return subprocess.run([sys.executable, str(GATE)], input=payload, text=True, capture_output=True, env=env).returncode


def write(root, **fields):
    path = root / "production/approvals"
    path.mkdir(parents=True, exist_ok=True)
    (path / "current.json").write_text(json.dumps(fields))


failures = 0


def check(name, got, want):
    global failures
    ok = got == want
    failures += not ok
    print(f"{'ok  ' if ok else 'FAIL'} {name} (exit {got}, want {want})")


with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    check("no approval file blocks", run(root), 2)
    check("bad hook input blocks", run(root, raw="not json"), 2)

    (root / "production/approvals").mkdir(parents=True)
    (root / "production/approvals/current.json").write_text("{broken")
    check("broken approval file blocks", run(root), 2)

    write(root, expires_at=PAST, items=[{"model": "nano_banana_pro", "remaining": 1}])
    check("expired approval blocks", run(root), 2)

    write(root, expires_at=FUTURE, items=[{"model": "nano_banana_pro", "remaining": 1}])
    check("cost check blocks without cost_checks_ok", run(root, params={"model": "nano_banana_pro", "get_cost": True}), 2)
    check("a different model blocks", run(root, params={"model": "seedance_2_5"}), 2)
    check("approved model runs once", run(root), 0)
    check("the second use blocks", run(root), 2)

    write(root, expires_at=FUTURE, cost_checks_ok=True, items=[])
    check("approved cost check runs", run(root, params={"model": "kling3_0", "get_cost": True}), 0)
    check("cost-check approval does not allow a real job", run(root, params={"model": "kling3_0"}), 2)

    write(root, expires_at=FUTURE, items=[{"model": "upscale_image", "remaining": 1}])
    check("a tool without a model uses its tool name", run(root, tool="mcp__Higgsfield__upscale_image", params={"x": 1}), 0)

print("all gate tests passed" if not failures else f"{failures} gate test(s) failed")
sys.exit(1 if failures else 0)
