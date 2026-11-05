#!/usr/bin/env python3
"""Check that a script reuses a video's structure, not its words.

    python3 check_overlap.py <script> <source transcript> [--run 6]

Prints every run of words shared with the source. Exit 1 if any run is at least --run words long.
Quoted Scripture can match by chance, so read each hit before changing the line.
"""
import argparse
import re
import sys
from pathlib import Path


def words(text):
    return re.findall(r"[a-z0-9']+", text.lower().replace("’", "'"))


def spoken(text):
    lines = [l[3:] for l in text.splitlines() if l.startswith("VO:")]
    body = " ".join(lines) if lines else text
    return re.sub(r"\[[^\]]*\]", " ", body)


def shared_runs(script, source, length):
    index = {tuple(source[i:i + length]) for i in range(len(source) - length + 1)}
    runs, i = [], 0
    while i <= len(script) - length:
        if tuple(script[i:i + length]) in index:
            j = i + length
            while j < len(script) and tuple(script[j - length + 1:j + 1]) in index:
                j += 1
            runs.append(" ".join(script[i:j]))
            i = j
        else:
            i += 1
    return runs


def main():
    a = argparse.ArgumentParser()
    a.add_argument("script")
    a.add_argument("source")
    a.add_argument("--run", type=int, default=6)
    o = a.parse_args()
    runs = shared_runs(words(spoken(Path(o.script).read_text())), words(Path(o.source).read_text()), o.run)
    for run in runs:
        print("SHARED", run)
    print(f"{len(runs)} shared runs of {o.run} or more words")
    sys.exit(1 if runs else 0)


if __name__ == "__main__":
    main()
