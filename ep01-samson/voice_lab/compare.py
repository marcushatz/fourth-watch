# Compare how two narrators speak: phrasing, pace, pauses, melody at phrase ends, creak, dynamics, rhotic r.
import sys, re, numpy as np, librosa, parselmouth
from parselmouth.praat import call
sys.path.insert(0, "/home/claude/fourth-watch/engine")
import voice


def words_with_times(y, sr, t0=0.0):
    rec = voice.asr()
    out = []
    win, hop, t = 20.0, 18.0, 0.0
    while t < len(y) / sr:
        seg = y[int(t * sr): int((t + win) * sr)]
        st = rec.create_stream(); st.accept_waveform(16000, voice.resample(seg, sr)); rec.decode_stream(st)
        cur = []
        for tok, ts in zip(st.result.tokens, st.result.timestamps):
            if tok.startswith((" ", "▁")) or not cur: cur.append([tok.strip("▁ ").lower(), t + ts])
            else: cur[-1][0] += tok.lower()
        out += [(w, s) for w, s in cur if not (t > 0 and s < t + 2.0)]
        t += hop
    return [(w, s + t0) for w, s in out]


def analyse(path, off=0.0, dur=None, label=""):
    y, sr = librosa.load(path, sr=16000, mono=True, offset=off, duration=dur)
    ws = words_with_times(y, sr)
    # phrases: a new phrase starts after a gap in word onsets > 0.55 s (a pause, not just a long word)
    phrases, cur = [], [ws[0]]
    for a, b in zip(ws, ws[1:]):
        if b[1] - a[1] > 0.55: phrases.append(cur); cur = []
        cur.append(b)
    phrases.append(cur)
    lens = [len(p) for p in phrases]
    art = [ (len(p) - 1) / (p[-1][1] - p[0][1]) * 60 for p in phrases if len(p) >= 3 and p[-1][1] > p[0][1]]
    total = (ws[-1][1] - ws[0][1]); overall = (len(ws) - 1) / total * 60
    # melody at phrase ends and creak (vocal fry): pitch in the last 0.3 s before each pause
    snd = parselmouth.Sound(y.astype(np.float64), sampling_frequency=sr)
    pitch = snd.to_pitch_ac(time_step=0.01, pitch_floor=50, pitch_ceiling=300, voicing_threshold=0.45)
    f = pitch.selected_array["frequency"]; tt = pitch.xs(); med = np.median(f[f > 0])
    ends, creak = [], []
    starts = [p[0][1] for p in phrases[1:]] + [len(y) / sr]
    for p, nxt in zip(phrases, starts):
        # the real end of voicing before the pause: last voiced frame after the last word's onset and before the next phrase
        m_all = (tt > p[-1][1]) & (tt < nxt - 0.05) & (f > 0)
        if m_all.sum() < 4: continue
        e = tt[m_all][-1]
        m = (tt > e - 0.15) & (tt <= e) & (f > 0)
        if m.sum() > 2:
            ends.append(12 * np.log2(np.median(f[m]) / med))
            creak.append(np.mean(f[m] < 0.72 * med))
    # loudness movement inside phrases (dB spread of 50 ms frames while speaking)
    rms = librosa.feature.rms(y=y, frame_length=800, hop_length=800)[0]; db = 20 * np.log10(rms + 1e-9)
    sp = db[db > np.percentile(db, 40)]
    print(f"\n{label}")
    print(f"  words heard {len(ws)}, overall pace {overall:.0f} wpm, speaking pace inside phrases {np.median(art):.0f} wpm")
    print(f"  words per phrase: median {np.median(lens):.0f}, mean {np.mean(lens):.1f}, phrases of 1-3 words {np.mean(np.array(lens) <= 3)*100:.0f}%")
    print(f"  pitch at phrase ends vs his median: {np.median(ends):+.1f} semitones (typical), lowest quarter {np.percentile(ends, 25):+.1f}")
    print(f"  creak (vocal fry) at phrase ends: {np.mean(creak)*100:.0f}% of end frames far below his median")
    print(f"  loudness movement while speaking: {np.percentile(sp, 90) - np.percentile(sp, 10):.1f} dB (10th-90th)")
    return ws


if __name__ == "__main__":
    analyse("/home/claude/fourth-watch/research/lintel_ref/ref2.wav", 4.5, 108, "LINTEL narrator (ref2, 4.5-112 s, music under)")
    for p in sys.argv[1:]:
        analyse(p, 0, None, p.split("/")[-1])
