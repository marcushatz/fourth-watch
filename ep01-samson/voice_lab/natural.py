# Natural-rate takes: no stretching of sounds. The voice speaks at its own rate (speed 1.0); the slower narrator
# pace comes only from breaths between phrases and sentences. Melody shaping is kept gentle: a wider range,
# a lift on key words, and falling sentence ends.
import sys, os, json, numpy as np
sys.path.insert(0, "/home/claude/fourth-watch/engine")
import voice, lab

D = "/home/claude/fourth-watch/ep01-samson/voice_lab"


def take(name, sid, fxv, speed=1.0, k=1.3, lift=1.5, fall=7.0, inner=2.5):
    text = voice.speakable(lab.TXT)
    chunks, sr = [], None
    for i, (p, g) in enumerate(voice.sentences(text)):
        x, sr = voice.synth(p, sid, speed)
        x = voice.perform(x, sr, p, lab.KEYS_SAMPLE, k=k, slow=1.0, lift=lift, fall=fall, inner_fall=inner)
        chunks.append(x)
        if g:
            chunks.append(np.zeros(int(g * (1 + 0.15 * np.sin(i * 2.3)) * sr), dtype=np.float32))
    x = np.concatenate(chunks)
    voice.write_wav(f"{D}/v2/{name}_raw.wav", x, sr)
    voice.fx_file(f"{D}/v2/{name}_raw.wav", f"{D}/v2/{name}.wav", **json.load(open(f"{D}/fx.json")).get(fxv, {}))
    print(name, f"{len(x) / sr:.1f}s", flush=True)


if __name__ == "__main__":
    which = sys.argv[1]
    if which == "michael":
        take("K", voice.speaker_map()["am_michael"], "am_michael")
    else:  # run with FW_KOKORO_DIR=.../kokoro-blend
        take("L", 53, "am_michael")   # Michael + Fenrir
        take("M", 52, "am_michael")   # Michael + Puck
