#!/usr/bin/env python3
"""Claude Code PreToolUse hook: block Higgsfield calls that can spend credits unless approved.

Reads the hook's JSON from stdin. Exit 0 allows the call. Exit 2 blocks it and shows stderr.
Fails closed: a missing, unreadable or expired approval file blocks the call.

The approval file is production/approvals/current.json (see EXAMPLE.json there).
This is a second check, not the control itself: production/GENERATION_APPROVAL.md is the rule.
"""
import datetime as dt
import json
import os
import sys
from pathlib import Path

ROOT = Path(os.environ.get("FW_GATE_ROOT") or Path(__file__).resolve().parent.parent)
APPROVAL = ROOT / "production/approvals/current.json"


def block(reason):
    print(f"BLOCKED by the Fourth Watch generation gate: {reason}\n"
          "Send Marcus a request (production/GENERATION_APPROVAL.md) and wait for his explicit approval.",
          file=sys.stderr)
    sys.exit(2)


def params_of(tool_input):
    params = tool_input.get("params", tool_input)
    if isinstance(params, str):
        try:
            params = json.loads(params)
        except ValueError:
            params = {}
    return params if isinstance(params, dict) else {}


def main():
    try:
        event = json.load(sys.stdin)
    except ValueError:
        block("the hook could not read the tool call")
    tool = event.get("tool_name", "")
    short = tool.replace("mcp__Higgsfield__", "")
    params = params_of(event.get("tool_input") or {})
    model = params.get("model") or short
    is_cost_check = params.get("get_cost") is True

    if not APPROVAL.exists():
        block(f"no approval file exists for {short} ({model})")
    try:
        approval = json.loads(APPROVAL.read_text())
        expires = dt.datetime.fromisoformat(approval["expires_at"].replace("Z", "+00:00"))
        items = approval["items"]
    except (ValueError, KeyError, TypeError) as err:
        block(f"the approval file is unreadable ({err})")
    if expires.tzinfo is None:
        block("the approval's expires_at has no time zone")
    if dt.datetime.now(dt.timezone.utc) >= expires:
        block("the approval has expired")

    if is_cost_check:
        if approval.get("cost_checks_ok") is True:
            sys.exit(0)
        block(f"cost check for {model} is not approved")

    for item in items:
        if item.get("model") == model and int(item.get("remaining", 0)) > 0:
            item["remaining"] = int(item["remaining"]) - 1
            APPROVAL.write_text(json.dumps(approval, indent=2) + "\n")
            sys.exit(0)
    block(f"{model} is not on the approved list, or its approved uses are spent")


if __name__ == "__main__":
    main()
