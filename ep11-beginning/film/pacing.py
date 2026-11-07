"""Automatic pacing, applied to every shot before anything renders.

The rules are the ones in .claude/skills/fourth-watch-create/references/directing.md ("Pace"), measured from the
Lintel hits, and checked afterwards by `fw_check.py video`:

1. One new picture per spoken sentence. When a shot carries more than one sentence, it cuts to a second framing
   (tighter, then back) as each new sentence starts.
2. A visible beat at least every 2 seconds. Where a stretch has none, the camera punches in on the stressed word
   (the last content word of the clause), then holds the new framing.
3. Nothing lands in the 0.4 s at either end of a shot, so cuts and transitions stay clean.

`plan(shot_id)` returns the beats for one shot; `camera(shot_id, t)` returns the zoom multiplier at time t;
`report()` prints the beat map for the whole film, so a storyboard can be checked before rendering.
"""
import json
import re
from functools import lru_cache
from pathlib import Path

HERE = Path(__file__).resolve().parent
TIMING = json.load(open(HERE / "timing.json"))
SHOTS = {s["id"]: s for s in TIMING["shots"]}

MAX_GAP = 2.0          # seconds without a visible beat
EDGE = .4              # keep beats away from cuts
TIGHT = 1.14           # the second framing
PUNCH = 1.06           # one punch-in step
PUNCH_TIME = .28       # seconds for a punch to arrive
STOP = set("""a an the and or but so if of to in on at by for from with as is are was were be been it its it's he she they them
their his her him we us our you your i me my this that there here what who whom which when then than not no do does did don't
doesn't didn't would could should will can just even still all some one ever after before because why how where says say said""".split())
# shots that are already busy with their own action keep only the sentence cut (their motion is the beat)
OWN_MOTION = {"S01", "S03", "S04", "S06", "S07", "S08", "S09", "S11", "S12", "S13", "S15", "S19", "S20", "S21", "S23", "S31", "S33"}


def _clean(w):
    return re.sub(r"[^a-z']", "", w.lower())


@lru_cache(maxsize=None)
def plan(sid):
    s = SHOTS[sid]
    t0, dur = s["start"], s["end"] - s["start"]
    words = [(w["w"], w["start"] - t0, w["end"] - t0) for w in s["words"]]
    beats = [(0.0, "cut", 1.0)]
    # 1. a new framing on each sentence that starts inside the shot
    tight = False
    for i, (w, a, b) in enumerate(words[1:], 1):
        if words[i - 1][0][-1] in ".?!" and EDGE + .6 < a < dur - EDGE - .6:
            tight = not tight
            beats.append((a - .02, "reframe", TIGHT if tight else 1.0))
    # 2. punch in wherever 2 s pass without a beat
    if sid not in OWN_MOTION:
        stressed = [(b, w) for w, a, b in words if _clean(w) not in STOP and len(_clean(w)) > 3]
        last = 0.0
        times = sorted(t for t, _, _ in beats)
        k = 0
        while True:
            nxt = next((t for t in times if t > last + 1e-3), dur)
            if nxt - last <= MAX_GAP:
                if nxt >= dur:
                    break
                last = nxt
                continue
            cands = [b - .12 for b, w in stressed if last + .8 < b - .12 < min(nxt, last + MAX_GAP + .3) and EDGE < b - .12 < dur - EDGE]
            at = min(cands, key=lambda x: abs(x - (last + 1.6))) if cands else last + 1.8
            if at > dur - EDGE:
                break
            beats.append((at, "punch", PUNCH))
            times = sorted(times + [at])
            last = at
            k += 1
            if k > 8:
                break
    return sorted(beats)


def camera(sid, t):
    """Zoom multiplier for shot sid at its local time t: framing steps from reframes (instant) and punches (eased)."""
    z = 1.0
    frame = 1.0
    for at, kind, v in plan(sid):
        if kind == "reframe" and t >= at:
            frame = v
        elif kind == "punch" and t >= at:
            u = min(1.0, (t - at) / PUNCH_TIME)
            u = u * u * (3 - 2 * u)
            z *= 1 + (v - 1) * u
    return frame * z


def report():
    tot, gaps = 0, []
    for sid, s in SHOTS.items():
        b = plan(sid)
        dur = s["end"] - s["start"]
        times = [t for t, _, _ in b] + [dur]
        g = max(y - x for x, y in zip(times[:-1], times[1:]))
        gaps.append(g)
        tot += len(b)
        print(f"{sid} {dur:4.1f}s  " + "  ".join(f"{k[0]}@{t:.1f}" for t, k, _ in b) + f"   longest gap {g:.1f}s")
    print(f"{tot} beats in {TIMING['duration']:.0f}s, one every {TIMING['duration'] / tot:.1f}s")


if __name__ == "__main__":
    report()
