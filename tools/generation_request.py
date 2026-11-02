#!/usr/bin/env python3
"""Show a generation request, or record an approval Marcus has already given.

    python3 tools/generation_request.py show production/approvals/requests/<id>.json [--balance 97.24]
    python3 tools/generation_request.py record production/approvals/requests/<id>.json --marcus-said "his exact words"

`record` is a note-taking step. It can't confirm that Marcus approved anything.
Never run it unless he approved this exact request in the current conversation.
"""
import argparse
import datetime as dt
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from generation_gate import APPROVAL, fingerprint, normalize  # noqa: E402

PROJECTS = {"fourth-watch", "christian-testimonies"}
VALID_HOURS = 1


def load(path):
    request = json.loads(Path(path).read_text())
    if request.get("project") not in PROJECTS:
        sys.exit(f"project must be one of {sorted(PROJECTS)}")
    for item in request["items"]:
        if item.get("kind") not in {"job", "cost_check"}:
            sys.exit("each item needs kind: job or cost_check")
        if item["kind"] == "job" and "quoted_credits" not in item:
            sys.exit("each job needs quoted_credits")
    return request


def total(request):
    return round(sum(float(i.get("quoted_credits", 0)) for i in request["items"] if i["kind"] == "job"), 2)


def show(request, balance):
    print(f"GENERATION REQUEST {request['request_id']}")
    print(f"Project: {request['project']}")
    print(f"Purpose: {request['purpose']}")
    for number, item in enumerate(request["items"], 1):
        job, _ = normalize(item["input"])
        params = job.get("params", job)
        print(f"\n{number}. {item['tool']} / {params.get('model', 'no model field')} [{item['kind']}]")
        print(f"   Output: {item.get('intended_output', '')}")
        print(f"   Credits: {item.get('quoted_credits', 0)} (quote: {item.get('quote_source', 'none')})")
        print(f"   Settings: " + ", ".join(f"{k}={v}" for k, v in sorted(params.items()) if k != "prompt"))
        print(f"   Fingerprint: {fingerprint(item['tool'], job)}")
        if "prompt" in params:
            print(f"   Prompt: {params['prompt']}")
    spend = total(request)
    print(f"\nTotal: {spend} credits")
    if balance is not None:
        print(f"Balance now: {balance}\nBalance after: {round(balance - spend, 2)}")


def record(request, words):
    if not words.strip():
        sys.exit("Marcus's exact words are required")
    if APPROVAL.exists():
        sys.exit(f"{APPROVAL} already exists. Finish or delete it first.")
    now = dt.datetime.now(dt.timezone.utc)
    approval = {
        "schema": 2,
        "request_id": request["request_id"],
        "project": request["project"],
        "approved_by": "Marcus",
        "approved_message": words.strip(),
        "approved_at": now.isoformat(),
        "expires_at": (now + dt.timedelta(hours=VALID_HOURS)).isoformat(),
        "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID"),
        "max_total_credits": total(request),
        "items": [dict(item, remaining=1) for item in request["items"]],
    }
    APPROVAL.write_text(json.dumps(approval, indent=2, ensure_ascii=False) + "\n")
    print(f"Recorded for {VALID_HOURS} hour. This is a record of his approval, not a replacement for it.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("action", choices=["show", "record"])
    parser.add_argument("request")
    parser.add_argument("--balance", type=float)
    parser.add_argument("--marcus-said", default="")
    args = parser.parse_args()
    request = load(args.request)
    if args.action == "show":
        show(request, args.balance)
    else:
        record(request, args.marcus_said)


if __name__ == "__main__":
    main()
