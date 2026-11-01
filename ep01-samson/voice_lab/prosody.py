# Delivery measurements for a voice take, compared with the reference narrator:
# median pitch, pitch range (10th-90th percentile, semitones), how fast the pitch moves inside voiced stretches,
# rhythm variety (spread of voiced-stretch lengths) and harmonics-to-noise ratio (roughness / artifacts).
import sys, numpy as np, parselmouth
from parselmouth.praat import call

REF = "/home/claude/fourth-watch/research/lintel_ref/ref2.wav"


def stats(path, t0=0, dur=None):
    snd = parselmouth.Sound(path)
    if snd.n_channels > 1:
        snd = snd.convert_to_mono()
    if dur:
        snd = snd.extract_part(t0, t0 + dur)
    pitch = snd.to_pitch_ac(time_step=0.01, pitch_floor=75, pitch_ceiling=300, voicing_threshold=0.5)
    f = pitch.selected_array["frequency"]
    v = f > 0
    st = 12 * np.log2(f[v] / np.median(f[v]))
    rng = np.percentile(st, 90) - np.percentile(st, 10)
    d, run = [], []
    for x in f:
        if x > 0:
            run.append(12 * np.log2(x))
        else:
            if len(run) > 5:
                d += list(np.abs(np.diff(run)))
            run = []
    mov = np.mean(d) * 10 if d else 0
    hnr = call(snd.to_harmonicity_cc(0.01, 75, 0.1, 1.0), "Get mean", 0, 0)
    runs, c = [], 0
    for x in f:
        if x > 0:
            c += 1
        elif c:
            runs.append(c)
            c = 0
    cv = np.std(runs) / np.mean(runs) if runs else 0
    return np.median(f[v]), rng, mov, hnr, cv


if __name__ == "__main__":
    for p in sys.argv[1:]:
        if p == "REF":
            r = stats(REF, 5, 100)
            name = "LINTEL (music under)"
        else:
            r = stats(p)
            name = p.split("/")[-1]
        m, rng, mov, hnr, cv = r
        print(f"{name:22s} F0 {m:4.0f} Hz  range {rng:4.1f} st  movement {mov:4.2f} st/100ms  rhythm variety {cv:4.2f}  HNR {hnr:4.1f} dB")
