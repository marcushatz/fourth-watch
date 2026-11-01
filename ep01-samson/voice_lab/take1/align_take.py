"""ASR the recorded take and map word timings onto the script (episode.md VO lines, in order) -> words.json.
Pads 0.6 s of silence in front (the ASR misses a short first word otherwise) and trims each word's end to the
start of the silence that follows it, so pauses are real pauses."""
import json, re, sys
from pathlib import Path
import numpy as np, soundfile as sf
sys.path.insert(0, "/home/claude/fourth-watch"); sys.path.insert(0, "/home/claude/fourth-watch/engine")
import fw_check as F, voice
ep, wav, out = sys.argv[1], sys.argv[2], sys.argv[3]
PAD = 0.6
lines = F.parse_script(ep)["vo"]
x, sr = sf.read(wav, dtype="float32")
words, owner = [], []
for i, v in enumerate(lines):
    ws = re.findall(r"[A-Za-z0-9'\-]+", voice.speakable(F.strip_refs(v["text"])))
    words += ws; owner += [i] * len(ws)
xp = np.concatenate([np.zeros(int(PAD * sr), dtype=np.float32), x])
wt, heard = voice.word_times(xp, sr, words)
wt = [(w, max(0.0, s - PAD), max(0.0, e - PAD)) for w, s, e in wt]
# energy envelope (10 ms) for trimming ends
fr = int(0.01 * sr); n = len(x) // fr
db = 20 * np.log10(np.sqrt(np.mean(x[: n * fr].reshape(n, fr) ** 2, axis=1)) + 1e-9)
voiced = db > db.max() - 40
res = []
for k, (w, s, e) in enumerate(wt):
    nxt = wt[k + 1][1] if k + 1 < len(wt) else len(x) / sr
    a, b = int(s / 0.01), min(int(nxt / 0.01), n)
    idx = np.where(voiced[a:b])[0]
    end = (a + idx[-1] + 1) * 0.01 if len(idx) else min(nxt, s + 0.2)
    res.append({"word": w, "start": round(s, 3), "end": round(max(s + 0.06, min(end, nxt)), 3), "line": owner[k]})
Path(out).write_text(json.dumps(res, indent=1))
Path(out).with_name("heard.txt").write_text(heard)
print(len(words), "script words;", len(heard.split()), "heard words; first:", heard.split()[:4])
