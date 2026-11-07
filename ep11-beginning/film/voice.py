#!/usr/bin/env python3
"""TEMPORARY narration for the Genesis episode, made with the free offline Kokoro voice (am_michael).

This is a timing reference, not the episode's voice. The real take replaces it, and the film re-times to it.
The words are the locked script, shot by shot, exactly as storyboard.json splits them. Only the spoken form
of chapter and verse numbers is spelled out for the synthesizer ("Acts 17:25" is said "Acts seventeen twenty-five").

    /usr/bin/python3 ep11-beginning/film/voice.py        writes film/out/voice_temp.wav and film/timing.json
"""
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
EP = HERE.parent
OUT = HERE / "out"
MODEL = Path("/home/claude/fw-tools/tts")
VOICE, SPEED, SR = "am_michael", 0.96, 24000

SPOKEN = {"17:25": "seventeen twenty-five", "4:11": "four eleven", "3:8": "three eight", "4:13": "four thirteen",
          "3:21": "three twenty-one", "3:16": "three sixteen"}
# Extra silence after a shot, in seconds, where the film needs room to breathe.
HOLD = {"S02": .3, "S05": .25, "S09": .3, "S18": .35, "S24": .5, "S25": .35, "S27": 1.1, "S29": .3, "S30": .3, "S34": 2.6}
LEAD = .08   # the hook starts at once


def spoken(text):
    for k, v in SPOKEN.items():
        text = text.replace(k, v)
    return text.replace('"', "")


def syllables(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)


def word_times(words, audio, t0):
    """Spread the shot's words over its audio. Pauses inside the take anchor the clause breaks; syllables spread the rest."""
    env = np.sqrt(np.convolve(audio ** 2, np.ones(240) / 240, "same"))[::240]          # 10 ms frames
    voiced = env > max(env.max() * .045, 1e-4)
    idx = np.flatnonzero(voiced)
    a, b = (idx[0], idx[-1] + 1) if len(idx) else (0, len(env))
    gaps, run = [], 0
    for i in range(a, b):
        if not voiced[i]:
            run += 1
        else:
            if run >= 11:
                gaps.append((i - run, i))
            run = 0
    breaks = [i for i, w in enumerate(words[:-1]) if w[-1] in ",.?;:"]
    spans = []
    if gaps and len(gaps) == len(breaks):
        edges = [a] + [g for gap in gaps for g in gap] + [b]
        groups = [list(range(0, breaks[0] + 1))] + [list(range(breaks[k] + 1, breaks[k + 1] + 1)) for k in range(len(breaks) - 1)] + [list(range(breaks[-1] + 1, len(words)))]
        spans = list(zip(groups, edges[0::2], edges[1::2]))
    else:
        spans = [(list(range(len(words))), a, b)]
    out = []
    for group, s, e in spans:
        wts = np.array([syllables(words[i]) + .6 for i in group], np.float32)
        cum = np.concatenate([[0], np.cumsum(wts)]) / wts.sum()
        for j, i in enumerate(group):
            out.append(dict(w=words[i], start=round(t0 + (s + cum[j] * (e - s)) / 100, 3), end=round(t0 + (s + cum[j + 1] * (e - s)) / 100, 3)))
    return out


def main():
    from kokoro_onnx import Kokoro
    tts = Kokoro(str(MODEL / "kokoro-v1.0.onnx"), str(MODEL / "voices-v1.0.bin"))
    board = json.load(open(EP / "storyboard.json"))
    script = (EP / "script_approved.md").read_text()
    vo = " ".join(re.sub(r"\s*\[[^\]]+\]", "", l[3:].strip()) for l in script.splitlines() if l.startswith("VO:"))
    said = " ".join(s["words"] for s in board["shots"])
    assert said.split() == vo.split(), "storyboard words differ from the locked script"
    track, shots, t = [np.zeros(int(LEAD * SR), np.float32)], [], LEAD
    for s in board["shots"]:
        audio, sr = tts.create(spoken(s["words"]), voice=VOICE, speed=SPEED, lang="en-us")
        assert sr == SR
        audio = audio.astype(np.float32)
        words = s["words"].split()
        wt = word_times(words, audio, t)
        dur = len(audio) / SR
        gap = .06 if s["words"].rstrip()[-1] == "," else .2
        hold = HOLD.get(s["id"], 0)
        shots.append(dict(id=s["id"], start=round(t, 3), voice_end=round(t + dur, 3), end=round(t + dur + gap + hold, 3), words=wt))
        track += [audio, np.zeros(int((gap + hold) * SR), np.float32)]
        t += dur + gap + hold
    full = np.concatenate(track)
    full = full / (np.abs(full).max() + 1e-6) * .89
    OUT.mkdir(exist_ok=True)
    sf.write(OUT / "voice_temp.wav", full, SR)
    json.dump(dict(note="TEMPORARY narration: Kokoro am_michael, offline and free. A timing reference only; replace with the real take.",
                   voice=VOICE, speed=SPEED, duration=round(len(full) / SR, 3), shots=shots), open(HERE / "timing.json", "w"), indent=1)
    print("voice", round(len(full) / SR, 2), "s,", len(shots), "shots")


if __name__ == "__main__":
    main()
