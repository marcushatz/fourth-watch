#!/usr/bin/env python3
"""Tests for tools/production_lock.py. Run: python3 tests/generation_gate/test_lock.py"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HOOK = Path(__file__).resolve().parents[2] / "tools/production_lock.py"
GATE = Path(__file__).resolve().parents[2] / "tools/generation_gate.py"
HF = "mcp__Higgsfield__"


def run(event, root, script=HOOK):
    env = dict(os.environ, FW_GATE_ROOT=str(root))
    return subprocess.run([sys.executable, str(script)], input=json.dumps(event), text=True, capture_output=True, env=env).returncode


def set_lock(root, value):
    path = root / "production/PRODUCTION_LOCK.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    if value is None:
        path.unlink(missing_ok=True)
    elif value == "broken":
        path.write_text("{not json")
    else:
        path.write_text(json.dumps({"locked": value}))


def bash(command, **extra):
    return {"tool_name": "Bash", "tool_input": {"command": command}, **extra}


CASES = [
    # name, event, expected exit while locked
    ("a paid image blocks", {"tool_name": HF + "generate_image", "tool_input": {"params": {"model": "x"}}}, 2),
    ("a paid video blocks", {"tool_name": HF + "generate_video", "tool_input": {"params": {"model": "x"}}}, 2),
    ("a voice job blocks", {"tool_name": HF + "generate_audio", "tool_input": {"params": {"model": "x"}}}, 2),
    ("a batch blocks", {"tool_name": HF + "generate_image_batch", "tool_input": {}}, 2),
    ("a cost check blocks", {"tool_name": HF + "generate_image", "tool_input": {"params": {"get_cost": True}}}, 2),
    ("a preset run blocks", {"tool_name": HF + "execute_preset", "tool_input": {}}, 2),
    ("an app run blocks", {"tool_name": HF + "apps_invoke", "tool_input": {}}, 2),
    ("the Higgsedit sandbox blocks", {"tool_name": HF + "sandbox_exec", "tool_input": {"command": "higgsedit render"}}, 2),
    ("an unknown tool blocks", {"tool_name": HF + "brand_new_tool", "tool_input": {}}, 2),
    ("another server name blocks", {"tool_name": "mcp__remote-devices__Higgsfield__generate_video", "tool_input": {}}, 2),
    ("balance is allowed", {"tool_name": HF + "balance", "tool_input": {}}, 0),
    ("transactions are allowed", {"tool_name": HF + "transactions", "tool_input": {}}, 0),
    ("reading instructions is allowed", {"tool_name": HF + "get_workflow_instructions", "tool_input": {}}, 0),
    ("the storm render blocks", bash("node engine_v11/scripts/render_native_storm.js video out.mp4"), 2),
    ("a render with a path blocks", bash("cd x && /opt/node/bin/node ../render_native_storm.js stills out 1"), 2),
    ("film27 stills block", bash("node engine/render.js stills 3.2"), 2),
    ("VTK renders block", bash("venv/bin/python scripts/vtk_story_renderer.py plan.yaml --out a.mp4"), 2),
    ("an animatic blocks", bash("python3 scripts/animatic.py plan.yaml --out a.mp4"), 2),
    ("npm video blocks", bash("npm run video"), 2),
    ("an ffmpeg encode blocks", bash("ffmpeg -y -i a.mp4 -c:v libx264 b.mp4"), 2),
    ("an ffmpeg encode with redirect blocks", bash("ffmpeg -i a.mp4 b.webm 2>&1 | tail -2"), 2),
    ("ffmpeg making one still is allowed", bash("ffmpeg -i a.mp4 -frames:v 1 b.jpg"), 0),
    ("searching for a renderer is allowed", bash("grep -n render_native_storm README.md"), 0),
    ("listing files is allowed", bash("ls -la engine_v11/scripts"), 0),
    ("the tests are allowed", bash("python3 -m unittest discover -s tests"), 0),
    ("deleting the lock blocks", bash("rm production/PRODUCTION_LOCK.json"), 2),
    ("editing the lock in the shell blocks", bash("sed -i s/true/false/ production/PRODUCTION_LOCK.json"), 2),
    ("disabling the hook from the shell blocks", bash("echo '{}' > .claude/settings.json"), 2),
    ("reading the lock is allowed", bash("cat production/PRODUCTION_LOCK.json"), 0),
    ("the status command is allowed", bash("python3 tools/production_lock.py --status"), 0),
    ("a subagent can't edit the lock", {"tool_name": "Edit", "agent_id": "a1", "tool_input": {"file_path": "/r/production/PRODUCTION_LOCK.json"}}, 2),
    ("a subagent can't edit the gate", {"tool_name": "Write", "agent_id": "a1", "tool_input": {"file_path": "/r/tools/generation_gate.py"}}, 2),
    ("a subagent's normal edit is allowed", {"tool_name": "Edit", "agent_id": "a1", "tool_input": {"file_path": "/r/tools/creative/x.py"}}, 0),
    ("a subagent render blocks", bash("node engine/render.js video", agent_id="a1"), 2),
    ("a broken hook event blocks", {"tool_input": {}}, 2),
]


def main():
    failed = 0
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)

        def check(name, got, want):
            nonlocal failed
            ok = got == want
            failed += not ok
            print(f"{'ok  ' if ok else 'FAIL'} {name} (exit {got}, want {want})")

        set_lock(root, True)
        for name, event, want in CASES:
            check(name, run(event, root), want)

        paid = {"tool_name": HF + "generate_image", "tool_input": {"params": {"model": "x"}}, "session_id": "s"}
        render = bash("node engine/render.js video")
        for state in (None, "broken"):
            set_lock(root, state)
            check(f"a paid job blocks when the lock file is {state or 'missing'}", run(paid, root), 2)
            check(f"a render blocks when the lock file is {state or 'missing'}", run(render, root), 2)

        # Lifting the lock grants nothing: the generation gate still blocks a paid job with no approval.
        set_lock(root, False)
        check("a render runs after Marcus lifts the lock", run(render, root), 0)
        check("the lock passes a paid job along after lifting", run(paid, root), 0)
        check("the generation gate still blocks that paid job", run(paid, root, GATE), 2)
        check("the safeguard stays protected after lifting", run(bash("rm production/PRODUCTION_LOCK.json"), root), 2)

    print("all lock tests passed" if not failed else f"{failed} lock test(s) failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
