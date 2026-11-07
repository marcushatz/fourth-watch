#!/usr/bin/env python3
"""Score and sound design for the Genesis film, synthesized here (free, no samples), mixed under the narration.

    python3 film/sound.py      writes film/out/mix.wav (and score.wav, sfx.wav for remixing)

The score is a slow string-like pad in D minor that follows the story: wonder (space), thinning to a drone when
they hide, silence where the storyboard asks for it ("Here's what he said"), one held note under "Where are you?",
and a warm swell to F major at the end. Effects stay small: waves, threads snapping, the light opening, the garden,
the bite, the thread pulled tight, grass bending as God walks in the garden, running, night, dust, cloth, the end.
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
SR = 44100
TIMING = json.load(open(HERE / "timing.json"))
SHOT = {s["id"]: s for s in TIMING["shots"]}
DUR = TIMING["duration"] + .4
N = int(DUR * SR)
rng = np.random.default_rng(11)


def at(sid, word=None, n=0, end=False):
    s = SHOT[sid]
    if word is None:
        return s["start"]
    hits = [w for w in s["words"] if w["w"].lower().strip('.,?!"').startswith(word.lower())]
    h = hits[min(n, len(hits) - 1)]
    return h["end"] if end else h["start"]


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), x)


def env(n, a, r, sustain=True):
    e = np.ones(n, np.float32)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na) ** 1.6
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.4
    return e


def put(buf, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i] * gain
    if buf.ndim == 2:
        buf[i:i + len(x), 0] += x * np.sqrt(.5 * (1 - pan))
        buf[i:i + len(x), 1] += x * np.sqrt(.5 * (1 + pan))
    else:
        buf[i:i + len(x)] += x


def reverb(x, secs=2.8, mix=.32, seed=3):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    ir = r.normal(0, 1, n) * np.exp(-np.linspace(0, 7, n))
    ir = lp(ir, 6000)
    ir /= np.sqrt((ir ** 2).sum())
    wet = np.stack([fftconvolve(x[:, c], ir * (1 + .1 * c), mode="full")[: len(x)] for c in range(2)], 1)
    return x * (1 - mix) + wet * mix * 1.6


# The score --------------------------------------------------------------------------------------------
NOTE = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def hz(name, octave):
    return 440 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)


CHORDS = {"Dm": [("D", 2), ("A", 2), ("D", 3), ("F", 3), ("A", 3), ("E", 4)], "Bb": [("Bb", 1), ("F", 2), ("Bb", 2), ("D", 3), ("F", 3), ("C", 4)],
          "F": [("F", 1), ("C", 2), ("F", 2), ("A", 2), ("C", 3), ("G", 3)], "C": [("C", 2), ("G", 2), ("C", 3), ("E", 3), ("G", 3), ("D", 4)],
          "Am": [("A", 1), ("E", 2), ("A", 2), ("C", 3), ("E", 3), ("B", 3)], "Gm": [("G", 1), ("D", 2), ("G", 2), ("Bb", 2), ("D", 3), ("A", 3)],
          "drone": [("D", 2), ("A", 2), ("D", 3)], "Fmaj": [("F", 1), ("C", 2), ("F", 2), ("A", 2), ("C", 3), ("E", 3), ("A", 3), ("C", 4)]}


def pad_voice(f, n, bright=.5, seed=0):
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    out = np.zeros(n)
    for k, det in enumerate((-.06, 0, .07)):
        vib = 1 + .0016 * np.sin(2 * np.pi * (4.6 + k * .3) * t + r.uniform(0, 6))
        ph = 2 * np.pi * np.cumsum(f * (1 + det / 100) * vib) / SR + r.uniform(0, 6)
        out += np.sin(ph) + bright * .35 * np.sin(2 * ph) + bright * .14 * np.sin(3 * ph) + bright * .05 * np.sin(4 * ph)
    return out / 3


def chord(name, t0, t1, gain=1.0, bright=.5, att=1.6, rel=2.2, top=True):
    n = int((t1 - t0 + rel) * SR)
    x = np.zeros(n)
    notes = CHORDS[name] if top else CHORDS[name][:-1]
    for i, (nm, octv) in enumerate(notes):
        g = 1.0 if i < 2 else .7
        x += pad_voice(hz(nm, octv), n, bright, seed=i + int(t0 * 10)) * g
    x *= env(n, att, rel) / len(notes)
    x = lp(x, 2400 + 2600 * bright)
    return x * gain


def score():
    mus = np.zeros((N, 2))
    plan = [  # (chord, start, end, gain, brightness)
        ("Dm", 0.0, at("S03"), .8, .35), ("Bb", at("S03"), at("S03", "anything"), .8, .4), ("F", at("S03", "anything"), at("S04"), .8, .4),
        ("C", at("S04"), at("S05"), .8, .45), ("Dm", at("S05"), at("S06"), .75, .35),
        ("Am", at("S06"), at("S07"), .5, .3), ("Dm", at("S07"), at("S08"), .5, .3),
        ("F", at("S08"), at("S08", "Revelation"), .7, .45), ("C", at("S08", "Revelation"), at("S08", "created"), .8, .55), ("Dm", at("S08", "created"), at("S08", "chose"), .85, .6), ("Bb", at("S08", "chose"), at("S09"), .9, .6),
        ("F", at("S09"), at("S10"), .75, .5), ("C", at("S10"), at("S11"), .7, .45), ("Dm", at("S11"), at("S12"), .6, .35), ("Bb", at("S12"), at("S14"), .55, .3),
        ("drone", at("S14"), at("S16"), .45, .2), ("drone", at("S16"), at("S18"), .38, .15), ("drone", at("S18"), at("S18", "back"), .22, .1),
        ("Bb", at("S19"), at("S20"), .5, .3), ("F", at("S20"), at("S21"), .55, .35), ("Gm", at("S21"), at("S21", "Genesis"), .6, .35), ("C", at("S21", "Genesis"), at("S22"), .65, .45),
        ("F", at("S22"), at("S23"), .7, .5), ("C", at("S23"), at("S23", "John"), .75, .55), ("Dm", at("S23", "John"), at("S24"), .85, .6), ("Bb", at("S24"), at("S24", "Son"), .9, .65), ("F", at("S24", "Son"), at("S25") - .1, .9, .65),
        ("Dm", at("S28"), at("S29"), .45, .3), ("Bb", at("S29"), at("S29", "wanted"), .55, .35), ("F", at("S29", "wanted"), at("S30"), .6, .45), ("C", at("S30"), at("S31"), .6, .4),
        ("Bb", at("S31"), at("S32"), .75, .5), ("F", at("S32"), at("S33"), .85, .6), ("C", at("S33"), at("S34"), .85, .6), ("Dm", at("S34"), at("S34", "you"), .85, .55),
        ("Fmaj", at("S34", "you"), DUR - 1.0, .95, .62),
    ]
    for name, t0, t1, g, b in plan:
        rel = .12 if t1 >= at("S25") - .2 and t1 <= at("S25") + .1 else 2.4
        x = chord(name, t0, t1, g, b, att=1.2, rel=rel)
        put(mus, x, t0, .22, pan=-.15)
        put(mus, np.roll(x, 900), t0, .22, pan=.15)
    # felt-piano notes on a few turning points
    def pluck(f, t, g=.5):
        n = int(3.2 * SR)
        tt = np.arange(n) / SR
        x = (np.sin(2 * np.pi * f * tt) + .3 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 3)) * np.exp(-tt * 1.7) * (1 - np.exp(-tt * 300))
        put(mus, lp(x, 3000), t, g * .12)
    for t, nm, o in ((at("S02", "you"), "A", 4), (at("S08", "created"), "D", 5), (at("S08", "chose"), "F", 5), (at("S13", "eats"), "A", 4),
                     (at("S23", "loved"), "A", 4), (at("S24", "Son"), "C", 5), (at("S29", "wanted"), "A", 4), (at("S32", "wanted"), "C", 5), (at("S34", "you"), "F", 5)):
        pluck(hz(nm, o), t)
    # one held note under "Where are you?"
    t0 = at("S27", "Where") - .2
    n = int((SHOT["S27"]["end"] - t0 + 1.0) * SR)
    x = pad_voice(hz("A", 4), n, .25, 9) * env(n, 1.2, 1.4) * .5
    put(mus, x, t0, .16)
    return reverb(mus, 3.2, .38)


# Effects ----------------------------------------------------------------------------------------------

def noise(secs):
    return rng.normal(0, 1, int(secs * SR))


def sfx():
    fx = np.zeros((N, 2))
    # waves on 'God' (S03)
    t0, t1 = SHOT["S03"]["start"], SHOT["S03"]["end"]
    n = int((t1 - t0 + .8) * SR)
    tt = np.arange(n) / SR
    w = lp(noise(n / SR), 700) * (.45 + .55 * np.sin(2 * np.pi * tt / 3.1) ** 2) * env(n, .6, .8)
    put(fx, w, t0, .05, -.2)
    # wings as the birds cross (S03 'need')
    for k in range(5):
        x = bp(noise(.09), 700, 2400) * np.hanning(int(.09 * SR))
        put(fx, x, at("S03", "need") - .3 + k * .16, .05, .3)
    # threads snap (S06 'needed', S07 'need')
    for sid, word in (("S06", "needed"), ("S07", "need")):
        t = at(sid, word) + .05
        snap = bp(noise(.04), 2000, 7000) * np.exp(-np.linspace(0, 8, int(.04 * SR)))
        tw = np.sin(2 * np.pi * 820 * np.arange(int(.35 * SR)) / SR) * np.exp(-np.linspace(0, 9, int(.35 * SR)))
        put(fx, snap, t, .5)
        put(fx, tw, t, .06, .4)
        rustle = bp(noise(.5), 400, 3000) * np.exp(-np.linspace(0, 5, int(.5 * SR)))
        put(fx, rustle, t + .05, .05)
    # the light opens (S08)
    t = SHOT["S08"]["start"] + .1
    n = int(3.5 * SR)
    tt = np.arange(n) / SR
    sh = sum(np.sin(2 * np.pi * f * tt + k) * np.exp(-tt * (1.2 + .2 * k)) * (tt > .12 * k) for k, f in enumerate((1568, 2093, 2349, 2637, 3136)))
    put(fx, sh * (1 - np.exp(-tt * 20)), t, .035)
    # garden ambience: soft wind and a few birds (S09-S13)
    t0, t1 = SHOT["S09"]["start"], SHOT["S14"]["start"]
    n = int((t1 - t0) * SR)
    wind = lp(noise(n / SR), 500) * env(n, 1.2, 1.0)
    put(fx, wind, t0, .03)
    for k in range(9):
        tb = t0 + .5 + k * (t1 - t0 - 1) / 9 + rng.uniform(-.3, .3)
        for j in range(rng.integers(2, 4)):
            m = int(.07 * SR)
            ttt = np.arange(m) / SR
            f = rng.uniform(2800, 3600) + 1200 * ttt / .07
            ch = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.hanning(m)
            put(fx, ch, tb + j * .11, .012, rng.uniform(-.6, .6))
    # the bites (S12 'eats', S13 'eats')
    for sid in ("S12", "S13"):
        t = at(sid, "eats") + (.0 if sid == "S12" else .05)
        cr = bp(noise(.16), 900, 5000) * (np.abs(rng.normal(0, 1, int(.16 * SR))) ** 2 > .6) * np.exp(-np.linspace(0, 4, int(.16 * SR)))
        put(fx, cr, t, .14)
    # thread pulled tight (S14 'sew')
    t = at("S14", "sew") - .1
    x = bp(noise(.5), 1200, 3800) * np.linspace(0, 1, int(.5 * SR)) ** 2 * np.exp(-np.linspace(0, 2, int(.5 * SR)))
    put(fx, x, t, .05, .3)
    # grass bending as God walks in the garden (S15): a slow sweep from left to right
    t0, t1 = SHOT["S15"]["start"], at("S15", "hide")
    n = int((t1 - t0 + 1.2) * SR)
    sw = bp(noise(n / SR), 300, 2500) * env(n, 1.5, 1.0)
    for i, p in enumerate(np.linspace(-.8, .3, 6)):
        seg = sw[i * n // 6:(i + 1) * n // 6]
        put(fx, seg, t0 + i * (n / SR) / 6, .03, p)
    # running feet (S15 'hide')
    for k in range(10):
        th = lp(noise(.06), 260) * np.hanning(int(.06 * SR))
        put(fx, th, at("S15", "hide") + .05 + k * .16, .35, .2 + k * .06)
    # night: very soft crickets and low air (S16-S18, S25-S27)
    for a, b in (("S16", "S19"), ("S25", "S28")):
        t0, t1 = SHOT[a]["start"], SHOT[b]["start"]
        n = int((t1 - t0) * SR)
        tt = np.arange(n) / SR
        cr = np.sin(2 * np.pi * 4700 * tt) * (np.sin(2 * np.pi * 28 * tt) > .6) * (np.sin(2 * np.pi * .9 * tt) > .2)
        put(fx, cr * env(n, 1.0, 1.0), t0, .004, .5)
        put(fx, lp(noise(n / SR), 220) * env(n, 1.0, 1.0), t0, .05)
    # dust falls (S19 'die')
    t = at("S19", "die") - .1
    x = hp(noise(1.8), 3000) * np.exp(-np.linspace(0, 2.5, int(1.8 * SR))) * (rng.random(int(1.8 * SR)) > .7)
    put(fx, x, t, .03)
    # cloth settles (S21 'makes')
    t = at("S21", "makes")
    x = bp(noise(.9), 250, 1800) * np.hanning(int(.9 * SR))
    put(fx, x, t, .05)
    # sun and moon race (S23)
    t = at("S23", "never") - .2
    n = int(1.8 * SR)
    x = bp(noise(1.8), 400, 3000) * np.hanning(n)
    for i, p in enumerate(np.linspace(-.9, .9, 8)):
        put(fx, x[i * n // 8:(i + 1) * n // 8], t + i * 1.8 / 8, .03, p)
    # an intake of breath in the silence (S27)
    t = at("S27", "you", end=True) + .5
    x = bp(noise(.9), 500, 4000) * np.hanning(int(.9 * SR)) ** 2
    put(fx, x, t, .02)
    # the end: a low warm swell under the logo
    t = SHOT["S34"]["voice_end"] + .2
    n = int(3 * SR)
    tt = np.arange(n) / SR
    put(fx, np.sin(2 * np.pi * 43.65 * tt) * env(n, .6, 2.0), t, .1)
    return reverb(fx, 1.6, .2, 5)


def paper_swish(fx, t):
    n = int(.32 * SR)
    x = bp(noise(.32), 600, 5000) * np.hanning(n) ** .7
    put(fx, x, t - .16, .05, .2)


def main():
    import edit
    voice, vsr = sf.read(OUT / "voice_temp.wav")
    if vsr != SR:
        from scipy.signal import resample_poly
        voice = resample_poly(voice, SR, vsr)
    v = np.zeros((N, 2))
    v[: len(voice), 0] = voice[:N]
    v[: len(voice), 1] = voice[:N]
    mus = score()
    fx = sfx()
    for sid, (kind, d) in edit.TRANSITIONS.items():
        if kind == "paper":
            paper_swish(fx, SHOT[sid]["start"])
    # duck the score under the voice
    e = np.abs(v[:, 0])
    e = lp(e, 4)
    e = np.clip(e / (e.max() + 1e-6) * 4, 0, 1)
    duck = 1 - .32 * e
    mus *= duck[:, None]
    mix = v * .92 + mus + fx
    peak = np.abs(mix).max()
    mix = mix / peak * .93 if peak > .93 else mix
    OUT.mkdir(exist_ok=True)
    sf.write(OUT / "score.wav", mus.astype(np.float32), SR)
    sf.write(OUT / "sfx.wav", fx.astype(np.float32), SR)
    sf.write(OUT / "mix.wav", mix.astype(np.float32), SR)
    print("mix", round(len(mix) / SR, 2), "s, peak", round(float(np.abs(mix).max()), 3))


if __name__ == "__main__":
    main()
