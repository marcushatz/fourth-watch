#!/usr/bin/env python3
"""Claude Code PreToolUse hook: a second check on Higgsfield calls that could spend credits.

Reads the hook's JSON from stdin. Exit 0 allows the call. Exit 2 blocks it and shows stderr.
It blocks by default: any Higgsfield tool that isn't on the free list needs an approval entry,
and a missing, unreadable, expired or mismatched approval blocks the call.

An approval entry matches one exact job: the same tool and every input (model, prompt, resolution,
quality, duration, aspect ratio, count, references). Changing any of them blocks the call.

This file checks a record. It can't see Marcus's words, and it grants nothing.
Only his explicit approval in the conversation authorizes spending: production/GENERATION_APPROVAL.md.
"""
import datetime as dt
import hashlib
import json
import os
import sys
from pathlib import Path

ROOT = Path(os.environ.get("FW_GATE_ROOT") or Path(__file__).resolve().parent.parent)
APPROVAL = ROOT / "production/approvals/current.json"
MAX_APPROVAL_HOURS = 2
MAX_QUOTE_AGE_HOURS = 24
EXPENSIVE_CREDITS = 5

FREE_PREFIXES = ("get_", "list_")
FREE_TOOLS = {
    "animation_actions", "apps_describe", "apps_search", "balance", "job_display", "jobs_wait",
    "media_confirm", "media_import_url", "media_upload", "media_upload_widget", "models_explore",
    "sandbox_exec", "search_folders", "show_generation_by_ids", "show_generations", "show_medias",
    "show_plans_and_credits", "show_result", "transactions",
}
ELEMENT_TOOLS = {"manage_reference_elements", "show_reference_elements"}


def block(reason):
    print(f"BLOCKED by the generation gate: {reason}\n"
          "Send Marcus a request (production/GENERATION_APPROVAL.md) and wait for his explicit approval. "
          "Writing or editing the approval file does not replace his approval.", file=sys.stderr)
    sys.exit(2)


def normalize(tool_input):
    """Return (job, is_cost_check). The job is what must match the approval exactly."""
    job = json.loads(json.dumps(tool_input or {}))
    job.pop("context", None)  # analytics text, not part of the job
    if isinstance(job.get("params"), str):
        try:
            job["params"] = json.loads(job["params"])
        except ValueError:
            pass
    target = job["params"] if isinstance(job.get("params"), dict) else job
    is_cost_check = target.get("get_cost") is True
    target.pop("get_cost", None)
    return job, is_cost_check


def fingerprint(tool, job):
    text = json.dumps({"tool": tool, "input": job}, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def differences(approved, actual):
    a = approved.get("params", approved) if isinstance(approved.get("params", approved), dict) else approved
    b = actual.get("params", actual) if isinstance(actual.get("params", actual), dict) else actual
    return sorted(key for key in set(a) | set(b) if a.get(key) != b.get(key))


def parse_time(value):
    moment = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if moment.tzinfo is None:
        raise ValueError(f"{value} has no time zone")
    return moment


def is_free(short, tool_input):
    if short in FREE_TOOLS or short.startswith(FREE_PREFIXES):
        return True
    return short in ELEMENT_TOOLS and (tool_input or {}).get("action", "list") in ("list", "get")


def load_approval(now, session_id):
    if not APPROVAL.exists():
        block("no approval is on file")
    try:
        approval = json.loads(APPROVAL.read_text())
        approved_at = parse_time(approval["approved_at"])
        expires_at = parse_time(approval["expires_at"])
        limit = float(approval["max_total_credits"])
        items = approval["items"]
        planned = sum(float(i.get("quoted_credits", 0)) * int(i.get("remaining", 0))
                      for i in items if i.get("kind") == "job")
    except (ValueError, KeyError, TypeError, AttributeError) as err:
        block(f"the approval file is unreadable ({err})")
    if approval.get("schema") != 2:
        block("the approval file uses an old format")
    if approval.get("approved_by") != "Marcus" or not str(approval.get("approved_message", "")).strip():
        block("the approval file doesn't record Marcus's words")
    if session_id and approval.get("session_id") != session_id:
        block(f"the approval belongs to another session (this one is {session_id})")
    if expires_at <= approved_at or expires_at - approved_at > dt.timedelta(hours=MAX_APPROVAL_HOURS):
        block(f"an approval can last {MAX_APPROVAL_HOURS} hours at most")
    if now < approved_at or now >= expires_at:
        block("the approval isn't valid at this time")
    if planned > limit:
        block(f"the quotes total {planned} credits, above the approved {limit}")
    return approval, items


def check_job(short, job, item, now):
    try:
        credits = float(item["quoted_credits"])
        quoted_at = parse_time(item["quoted_at"])
    except (KeyError, TypeError, ValueError) as err:
        block(f"the approved job has no usable quote ({err})")
    if now - quoted_at > dt.timedelta(hours=MAX_QUOTE_AGE_HOURS):
        block(f"the quote is over {MAX_QUOTE_AGE_HOURS} hours old")
    params = job.get("params", job) if isinstance(job.get("params", job), dict) else job
    runs = max(int(params.get("count", 1) or 1), int(params.get("batch_size", 1) or 1))
    if credits > EXPENSIVE_CREDITS and (short.endswith("_batch") or runs > 1):
        block(f"expensive jobs can't run as a batch ({credits} credits)")


def main():
    try:
        event = json.load(sys.stdin)
        tool = event["tool_name"]
    except (ValueError, KeyError, TypeError):
        block("the hook could not read the tool call")
    short = tool.rsplit("__", 1)[-1]
    tool_input = event.get("tool_input") or {}
    if is_free(short, tool_input):
        sys.exit(0)

    job, is_cost_check = normalize(tool_input)
    kind = "cost_check" if is_cost_check else "job"
    now = dt.datetime.now(dt.timezone.utc)
    approval, items = load_approval(now, event.get("session_id"))

    same_tool = [i for i in items if i.get("tool") == short and i.get("kind") == kind]
    if not same_tool:
        block(f"no approved {kind} for {short}")
    for item in same_tool:
        approved_job, _ = normalize(item.get("input"))
        if approved_job != job:
            continue
        if int(item.get("remaining", 0)) < 1:
            block(f"this exact {kind} has already used its approval")
        if kind == "job":
            check_job(short, job, item, now)
        item["remaining"] = int(item["remaining"]) - 1
        if any(int(i.get("remaining", 0)) > 0 for i in items):
            APPROVAL.write_text(json.dumps(approval, indent=2, ensure_ascii=False) + "\n")
        else:
            APPROVAL.unlink()
        sys.exit(0)
    changed = differences(normalize(same_tool[0].get("input"))[0], job)
    block(f"this call differs from the approved {kind} in: {', '.join(changed) or 'its inputs'}")


if __name__ == "__main__":
    main()
