# Voice lab: render one test passage in several deliveries of the same voice, so they can be compared by measurement.
import sys, json, numpy as np
sys.path.insert(0, "/home/claude/fourth-watch/engine"); import voice
import parselmouth
from parselmouth.praat import call
OUT = "/home/claude/fourth-watch/ep01-samson/voice_lab/v2"
TXT = ("Why did God let Samson keep his strength while he kept sinning? He slept with a prostitute in Gaza, and that same night he carried off the city gates. "
       "Was God fine with how he lived? Let's let the Bible answer it. Three: even at your lowest, you can still call on God. "
       "Blind and a prisoner, he prayed, O Lord God, please remember me and please strengthen me only this once.")

def widen(x, sr, k):
    """Overlap-add (PSOLA) resynthesis with the pitch contour widened around its median by factor k (in log space)."""
    if k == 1.0: return x
    snd = parselmouth.Sound(x.astype(np.float64), sampling_frequency=sr)
    manip = call(snd, "To Manipulation", 0.01, 70, 300)
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=300)
    f = pitch.selected_array["frequency"]; m = float(np.median(f[f > 0]))
    pt = call(manip, "Extract pitch tier")
    call(pt, "Formula", f"{m} * (self / {m}) ^ {k}")
    call([pt, manip], "Replace pitch tier")
    out = call(manip, "Get resynthesis (overlap-add)")
    return out.values[0].astype(np.float32)

def render(name, voice_name, speed, mode, k, fxkey=None):
    sid = voice.speaker_map()[voice_name]
    x, sr = voice.synth_narrator(voice.speakable(TXT), sid, speed, mode=mode)
    x = widen(x, sr, k)
    voice.write_wav(f"{OUT}/{name}_raw.wav", x, sr)
    fx = json.load(open("/home/claude/fourth-watch/ep01-samson/voice_lab/fx.json")).get(fxkey or voice_name, {})
    voice.fx_file(f"{OUT}/{name}_raw.wav", f"{OUT}/{name}.wav", **fx)
    print(name, f"{len(x)/sr:.1f}s", flush=True)

if __name__ == "__main__":
    for spec in sys.argv[1:]:
        name, v, speed, mode, k = spec.split(":")
        render(name, v, float(speed), mode, float(k))


# ---------------- performance: widen the melody, lean on the key words, breathe ----------------
import re
def perform(x, sr, text, keys, k=1.4, slow=1.13, lift=1.6, seed=0):
    """PSOLA re-performance of a TTS take: pitch range widened by k around the median; each key word slowed
    by `slow` and lifted by `lift` semitones (ramped in and out), the way a narrator leans on a word."""
    words = re.findall(r"[A-Za-z0-9'\-]+", text)
    wt, _ = voice.word_times(x, sr, words)
    spans = [(s, e) for (w, s, e) in wt if re.sub(r"[^a-z']", "", w.lower()) in keys]
    snd = parselmouth.Sound(x.astype(np.float64), sampling_frequency=sr)
    manip = call(snd, "To Manipulation", 0.01, 70, 300)
    pitch = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=300)
    f = pitch.selected_array["frequency"]; m = float(np.median(f[f > 0]))
    pt = call(manip, "Extract pitch tier")
    n = call(pt, "Get number of points")
    pts = [(call(pt, "Get time from index", i), call(pt, "Get value at index", i)) for i in range(1, n + 1)]
    dur = snd.duration
    new = call("Create PitchTier", "p", 0, dur)
    def boost(t):
        b = 0.0
        for s, e in spans:
            ramp = 0.06
            if s - ramp < t < e + ramp:
                b = max(b, min(1, (t - (s - ramp)) / ramp, ((e + ramp) - t) / ramp))
        return b
    for t, v in pts:
        v2 = m * (v / m) ** k * 2 ** (lift * boost(t) / 12)
        call(new, "Add point", t, v2)
    call([new, manip], "Replace pitch tier")
    dt = call("Create DurationTier", "d", 0, dur)
    call(dt, "Add point", 0, 1.0)
    for s, e in spans:
        call(dt, "Add point", max(0, s - 0.02), 1.0); call(dt, "Add point", s + 0.01, slow)
        call(dt, "Add point", max(s + 0.02, e - 0.01), slow); call(dt, "Add point", e + 0.02, 1.0)
    call([dt, manip], "Replace duration tier")
    out = call(manip, "Get resynthesis (overlap-add)")
    return out.values[0].astype(np.float32), len(spans)

KEYS_SAMPLE = {"strength", "sinning", "prostitute", "gates", "fine", "bible", "lowest", "call", "prisoner", "remember", "strengthen", "once"}

def render_perf(name, voice_name, speed, k, slow, lift):
    sid = voice.speaker_map()[voice_name]; text = voice.speakable(TXT)
    chunks = []; sr = None
    for i, (p, g) in enumerate(voice.sentences(text)):
        x, sr = voice.synth(p, sid, speed)
        x, nk = perform(x, sr, p, KEYS_SAMPLE, k, slow, lift)
        chunks.append(x)
        if g: chunks.append(np.zeros(int(g * (1 + 0.15 * np.sin(i * 2.3)) * sr), dtype=np.float32))  # pauses vary a little, like breath
    x = np.concatenate(chunks)
    voice.write_wav(f"{OUT}/{name}_raw.wav", x, sr)
    fx = json.load(open("/home/claude/fourth-watch/ep01-samson/voice_lab/fx.json")).get(voice_name, {})
    voice.fx_file(f"{OUT}/{name}_raw.wav", f"{OUT}/{name}.wav", **fx)
    print(name, f"{len(x)/sr:.1f}s", flush=True)
