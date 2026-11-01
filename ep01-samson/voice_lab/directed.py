# A directed sample: real script lines, each with its own delivery from voice.direction() (speaking rules).
import sys, json, re, numpy as np
sys.path.insert(0, "/home/claude/fourth-watch/engine")
import voice
D = "/home/claude/fourth-watch/ep01-samson/voice_lab"
lines = voice.parse_vo("/home/claude/fourth-watch/ep01-samson/episode.md")
KEYS = json.load(open(f"{D}/keys.json"))
PICK = [0, 1, 2, 3, 20, 23]
def run(name, sid, fxv, profile=None):
    chunks, sr = [], None
    for n, i in enumerate(PICK):
        ln = lines[i]
        x, sr, d = voice.synth_directed(ln["text"], sid, ln["section"], set(KEYS.get(str(i), [])), i, profile)
        if n: chunks.append(np.zeros(int((d["after"] or 0.0) * sr + voice.NARR_PAUSE["line"] * sr), dtype=np.float32))
        chunks.append(x)
    x = np.concatenate(chunks)
    voice.write_wav(f"{D}/v2/{name}_raw.wav", x, sr)
    voice.fx_file(f"{D}/v2/{name}_raw.wav", f"{D}/v2/{name}.wav", **json.load(open(f"{D}/fx.json")).get(fxv, {}))
    print(name, f"{len(x)/sr:.1f}s", flush=True)
if __name__ == "__main__":
    if sys.argv[1] == "michael": run("N", voice.speaker_map()["am_michael"], "am_michael")
    else: run(sys.argv[2] if len(sys.argv) > 2 else "O", 53, "am_michael", "blend_mf")  # Michael + Fenrir blend (FW_KOKORO_DIR=kokoro-blend)
