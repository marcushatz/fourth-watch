#!/usr/bin/env python3
"""Check a storyboard against what can be measured. Passing doesn't make it good.

    python3 check_storyboard.py <storyboard.json> [--script script_approved.md]

Exit 0 means no FAIL lines. Rules come from research/direction_rules.md and production/05.
"""
import argparse
import json
import re
import statistics
import sys
from pathlib import Path

SIZES = {"extreme-wide", "wide", "medium", "close", "extreme-close", "insert"}
ANGLES = {"eye", "low", "high", "top", "over-shoulder"}
MOVES = {"locked", "push", "pull", "pan", "tilt", "track", "crane"}
JOBS = {"hook-reveal", "travel", "follow", "reveal", "carry"}
FIDELITY = {"TEXT", "INFERRED", "INTERPRETATION", "HISTORICAL", "VISUAL_SYMBOL"}
ROUTES = {"code", "still", "ai-clip", "reused"}
REQUIRED = ("id", "start", "end", "words", "picture", "feel", "understand", "size", "angle", "move", "why", "acting", "fidelity", "route")


def tokens(text):
    text = re.sub(r"\[[^\]]*\]", " ", text)
    return re.findall(r"[a-z0-9']+", text.lower().replace("’", "'"))


def script_words(path):
    lines = Path(path).read_text().splitlines()
    spoken = [l.split(":", 1)[1] for l in lines if l.startswith("VO:")]
    if not spoken:
        spoken = [l for l in lines if l.strip() and not l.lstrip().startswith(("#", "<!--", "ON-SCREEN:", "series:", "target_seconds:", "answer:"))]
    return tokens(" ".join(spoken))


def check(board, script=None):
    fails, warns = [], []
    shots = board.get("shots", [])
    if not shots:
        return ["no shots"], []

    for s in shots:
        name = s.get("id", "?")
        for field in REQUIRED:
            if s.get(field) in (None, ""):
                fails.append(f"{name}: '{field}' is empty")
        for field, allowed in (("size", SIZES), ("angle", ANGLES), ("move", MOVES), ("fidelity", FIDELITY), ("route", ROUTES)):
            if s.get(field) and s[field] not in allowed:
                fails.append(f"{name}: unknown {field} '{s[field]}'")
        if s.get("move_percent", 0) >= 15 and s.get("move_job") not in JOBS:
            fails.append(f"{name}: a {s['move_percent']}% move needs a job")
        if s.get("route") == "ai-clip" and not s.get("credits"):
            warns.append(f"{name}: an AI clip has no credit estimate")

    timed = [s for s in shots if isinstance(s.get("start"), (int, float)) and isinstance(s.get("end"), (int, float))]
    if len(timed) != len(shots):
        return fails, warns

    if shots[0]["start"] != 0:
        fails.append("the first shot doesn't start at 0")
    for a, b in zip(shots, shots[1:]):
        if abs(a["end"] - b["start"]) > 0.02:
            fails.append(f"{a['id']} to {b['id']}: gap or overlap of {b['start'] - a['end']:.2f} s")
        if a.get("size") == b.get("size") and a.get("angle") == b.get("angle"):
            warns.append(f"{a['id']} to {b['id']}: same size and angle, a jump cut")
    for s in shots:
        length = s["end"] - s["start"]
        if length <= 0:
            fails.append(f"{s['id']}: ends before it starts")
        elif length < 1 and not s.get("transition"):
            fails.append(f"{s['id']}: {length:.2f} s is under 1 s")

    lengths = [s["end"] - s["start"] for s in shots]
    median = statistics.median(lengths)
    if not 3 <= median <= 5:
        warns.append(f"median shot is {median:.1f} s, target 3 to 5 s")

    # The beat clock: cuts and planned changes both count.
    end = shots[-1]["end"]
    times = sorted({0.0, end, *(s["start"] for s in shots), *(float(b) for s in shots for b in s.get("beats", []))})
    for s in shots:
        for b in s.get("beats", []):
            if not s["start"] <= b <= s["end"]:
                fails.append(f"{s['id']}: beat {b} is outside the shot")
    gaps = [(b - a, a) for a, b in zip(times, times[1:])]
    worst, at = max(gaps)
    if worst > 7.5:
        fails.append(f"{worst:.1f} s with no change, starting at {at:.1f} s")
    if len([g for g, _ in gaps if g > 6]) > 1:
        warns.append("more than one stretch over 6 s with no change")
    dead = sum(g for g, _ in gaps if g > 4) / end
    if dead > 0.30:
        warns.append(f"{dead:.0%} of the video sits in stretches over 4 s with no change, target 30% or less")
    average = end / max(1, len(times) - 1)
    if average > 2.5:
        warns.append(f"something changes every {average:.1f} s on average, target about 2 s")

    # The ending.
    last_word = board.get("last_word_end") or 0
    if last_word:
        tail = end - last_word
        if tail > 7:
            fails.append(f"the video runs {tail:.1f} s past the last word, limit 7 s")
        elif tail > 4.5:
            warns.append(f"the video runs {tail:.1f} s past the last word, target 4.5 s or less")
    if not shots[-1].get("callback"):
        warns.append("the final shot doesn't call back the opening")

    # One text element at a time is a build rule. Here we only check the words match the script.
    if script is not None:
        said = tokens(" ".join(s.get("words", "") for s in shots))
        if said != script:
            where = next((i for i, (a, b) in enumerate(zip(said, script)) if a != b), min(len(said), len(script)))
            near = " ".join(script[max(0, where - 3):where + 3])
            fails.append(f"the words differ from the script at word {where + 1}, near '{near}'")
    return fails, warns


def main():
    a = argparse.ArgumentParser()
    a.add_argument("storyboard")
    a.add_argument("--script")
    o = a.parse_args()
    board = json.loads(Path(o.storyboard).read_text())
    fails, warns = check(board, script_words(o.script) if o.script else None)
    for line in fails:
        print("FAIL", line)
    for line in warns:
        print("WARN", line)
    shots = board.get("shots", [])
    credits = sum(s.get("credits") or 0 for s in shots)
    end = shots[-1].get("end", 0) if shots else 0
    print(f"{len(shots)} shots, {end:.1f} s, {credits:g} credits of new paid work planned: {len(fails)} FAIL, {len(warns)} WARN")
    if not fails:
        print("Passing doesn't make it good. Read it as a viewer would.")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
