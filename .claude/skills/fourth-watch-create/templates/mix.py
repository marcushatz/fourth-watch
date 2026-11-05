#!/usr/bin/env python3
"""Mix the score and effects under the voice. The bed ducks when the voice speaks, and the voice is never limited.

    python3 mix.py --voice voice.mp3 --end 58.7 --voice-gain 1.34 --music-gain 1.25 --fx-gain 1.0

Reads st_mus.npy and st_fx.npy, stereo arrays at 48 kHz, and writes mix.wav.
Measure the result, then let Marcus judge it by ear.
"""
import argparse
import subprocess
import wave

import numpy as np
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 48000
a = argparse.ArgumentParser()
a.add_argument("--voice", required=True)
a.add_argument("--end", type=float, required=True)
a.add_argument("--voice-gain", type=float, default=1.55)
a.add_argument("--music-gain", type=float, default=1.0)
a.add_argument("--fx-gain", type=float, default=1.0)
a.add_argument("--out", default="mix.wav")
o = a.parse_args()

m = np.load("st_mus.npy")
f = np.load("st_fx.npy")
N = m.shape[1]
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", o.voice, "-ar", str(SR), "-ac", "1", "-f", "f32le", "voice.raw"], check=True)
v = np.fromfile("voice.raw", "float32")
v = np.pad(v, (0, max(0, N - len(v))))[:N]

# Duck the bed under speech.
e = np.sqrt(np.convolve(v**2, np.ones(2400) / 2400, "same"))
e /= e.max() + 1e-9
s = np.clip(e * 5, 0, 1)
s = np.convolve(s, np.ones(int(0.28 * SR)) / int(0.28 * SR), "same")
duck = 1 - 0.5 * s
bed = np.stack([m[0] * duck * o.music_gain + f[0] * o.fx_gain, m[1] * duck * o.music_gain + f[1] * o.fx_gain])

# The bed gets whatever headroom the voice leaves.
h = np.clip(0.84 - maximum_filter1d(np.abs(v * o.voice_gain), 961), 0.1, 0.62)
h = uniform_filter1d(h, 241)
bed = h * np.tanh(bed / h)

mix = bed + v * o.voice_gain
n = int(o.end * SR)
mix = mix[:, :n]
mix = mix * np.minimum(1, (o.end - np.arange(n) / SR) / 1.2)
print("peak", np.abs(mix).max())

x = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
with wave.open(o.out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(x.tobytes())
