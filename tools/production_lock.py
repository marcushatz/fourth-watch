#!/usr/bin/env python3
"""Claude Code PreToolUse hook: Marcus's production lock (Round 45).

While production/PRODUCTION_LOCK.json is locked, this blocks rendering and every Higgsfield tool
that could generate, spend or render, for the main session and all subagents. An approval file
does not get past it. A missing or unreadable lock file counts as locked.

    python3 tools/production_lock.py --status

Exit 0 allows the call. Exit 2 blocks it and shows stderr. The generation gate still applies
after the lock is lifted: this file never grants anything.
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(os.environ.get("FW_GATE_ROOT") or Path(__file__).resolve().parent.parent)
LOCK = ROOT / "production/PRODUCTION_LOCK.json"

READ_ONLY_PREFIXES = ("get_", "list_")
READ_ONLY_TOOLS = {
    "balance", "transactions", "models_explore", "show_plans_and_credits", "show_generations",
    "show_generation_by_ids", "show_medias", "jobs_wait",
}

# A program started with these runs a render. Matching on the runner keeps `grep render.js` usable.
RUNNER = r"(?:^|[;&|(]\s*|\s)(?:\S*/)?(?:node|python3?|bash|sh)\s+[^;&|]*"
RENDERERS = (
    r"render_native_storm", r"engine/render\.js", r"vtk_story_renderer\.py", r"preview_3d_pipeline\.py",
    r"preview_pipeline\.py", r"cinematic_animatic\.py", r"animatic\.py", r"generic_3d_scene\.py",
    r"scene_player\.py", r"soundscape_test\.py", r"render_(?:logo|endcard)\.js", r"make_lab\.sh",
)
RENDER_COMMANDS = [re.compile(RUNNER + p) for p in RENDERERS] + [
    re.compile(r"\bnpm\s+run\s+(?:video|build|board|sheet|music|stems|mux)\b"),
    re.compile(r"(?:^|[;&|(]\s*)\S*higgsedit\b"),
    # ffmpeg whose final output is a video file. Reading a video to make a still stays allowed.
    re.compile(r"\bffmpeg\b[^;&|]*\s\S+\.(?:mp4|mov|webm|mkv|m4v|gif)(?:\s+\d?>\S*)*\s*(?:$|[;&|])"),
]
PROTECTED = re.compile(r"PRODUCTION_LOCK|production_lock\.py|generation_gate\.py|\.claude/settings[^/\s]*\.json")
READ_COMMANDS = re.compile(r"^\s*(?:cat|head|tail|grep|rg|ls|sha256sum|wc|git\s+(?:diff|status|log|show|add|commit|push))\b")


def locked():
    try:
        return json.loads(LOCK.read_text()).get("locked") is not False
    except (OSError, ValueError, AttributeError):
        return True


def block(reason):
    print(f"BLOCKED by the production lock: {reason}\n"
          "Marcus has stopped all rendering and credit spending. Explain what you want to run, the tool, "
          "the cost and why, then ask him and wait. Silence is not approval.", file=sys.stderr)
    sys.exit(2)


def check_higgsfield(short, tool_input):
    if (tool_input or {}).get("get_cost") is True or ((tool_input or {}).get("params") or {}) == "":
        block(f"{short}: cost checks use the same tools as real jobs")
    params = (tool_input or {}).get("params")
    if isinstance(params, dict) and params.get("get_cost") is True:
        block(f"{short}: cost checks use the same tools as real jobs")
    if short in READ_ONLY_TOOLS or short.startswith(READ_ONLY_PREFIXES):
        return
    block(f"{short} is not a read-only tool")


def check_bash(command):
    for pattern in RENDER_COMMANDS:
        if pattern.search(command):
            block("this command renders or encodes video")


def check_protected(event, tool, tool_input):
    """Subagents never touch the safeguard. A main session may only change it with Edit or Write, in plain view."""
    if tool == "Bash":
        command = str(tool_input.get("command", ""))
        if PROTECTED.search(command) and not READ_COMMANDS.match(command) and "--status" not in command:
            block("the safeguard files can't be changed from the shell")
    elif tool in ("Write", "Edit", "NotebookEdit", "MultiEdit"):
        path = str(tool_input.get("file_path", tool_input.get("notebook_path", "")))
        if PROTECTED.search(path) and event.get("agent_id"):
            block("subagents can't change the safeguard")


def main():
    if "--status" in sys.argv:
        state = "LOCKED: no rendering and no credit spending" if locked() else "lifted (the generation gate still applies)"
        print(f"Production lock: {state}")
        return
    try:
        event = json.load(sys.stdin)
        tool = event["tool_name"]
    except (ValueError, KeyError, TypeError):
        block("the hook could not read the tool call")
    tool_input = event.get("tool_input") or {}
    check_protected(event, tool, tool_input)
    if not locked():
        return
    if re.match(r"mcp__.*[Hh]iggsfield", tool):
        check_higgsfield(tool.rsplit("__", 1)[-1], tool_input)
    elif tool == "Bash":
        check_bash(str(tool_input.get("command", "")))


if __name__ == "__main__":
    main()
