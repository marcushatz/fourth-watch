#!/usr/bin/env python3
"""Fourth Watch voice step: record the voice-over for an episode and time every word.

    python3 voice.py samples --text "..." --voices am_onyx,am_michael,bm_george --out samples/
    python3 voice.py record episode.md --voice am_onyx --speed 1.0 --out build/voice

record writes:
    voice.wav    the full voice-over, mono 24 kHz, with the planned pauses between lines
    words.json   every spoken word with its start and end time in seconds
    lines.json   every VO line with its start/end and its words

Pauses follow the playbook: 0.25 s between lines, 0.45 s between beats, 0.55 s before the turn.
Word times come from speech recognition run on each recorded line (sherpa-onnx zipformer with token
timestamps), so pictures can be cut on the exact word.
"""
import argparse, json, os, re, sys, tarfile, urllib.request, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
MODELS = HERE / "models"
KOKORO = MODELS / "kokoro-multi-lang-v1_0"
KOKORO_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_0.tar.bz2"
ASR_DIR = MODELS / "sherpa-onnx-zipformer-small-en-2023-06-26"
ASR_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-small-en-2023-06-26.tar.bz2"
PAUSE_LINE, PAUSE_BEAT, PAUSE_TURN = 0.25, 0.45, 0.55


def fetch(url, dest_dir):
    MODELS.mkdir(parents=True, exist_ok=True)
    if dest_dir.exists():
        return
    tmp = MODELS / (dest_dir.name + ".tar.bz2")
    print(f"downloading {url}", file=sys.stderr)
    urllib.request.urlretrieve(url, tmp)
    with tarfile.open(tmp) as t:
        t.extractall(MODELS)
    tmp.unlink()


def speaker_map():
    import onnxruntime as ort
    meta = ort.InferenceSession(str(KOKORO / "model.onnx"), providers=["CPUExecutionProvider"]).get_modelmeta().custom_metadata_map
    names = meta.get("speaker_names", "")
    return {n.strip(): i for i, n in enumerate(names.split(",")) if n.strip()}


_TTS = None
def tts():
    global _TTS
    if _TTS is None:
        import sherpa_onnx
        fetch(KOKORO_URL, KOKORO)
        d = Path(os.environ["FW_KOKORO_DIR"]) if os.environ.get("FW_KOKORO_DIR") else KOKORO  # e.g. models/kokoro-blend
        cfg = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(
                kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                    model=str(d / "model.onnx"), voices=str(d / "voices.bin"), tokens=str(d / "tokens.txt"),
                    data_dir=str(d / "espeak-ng-data"),
                    lexicon=f"{HERE / 'fw-lexicon.txt'},{d / 'lexicon-us-en.txt'},{d / 'lexicon-zh.txt'}"),
                num_threads=4, provider="cpu"),
            max_num_sentences=1)
        _TTS = sherpa_onnx.OfflineTts(cfg)
    return _TTS


SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
         "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"]
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
def say_number(n):
    if n < 20: return SMALL[n]
    if n < 100: return TENS[n // 10] + ("-" + SMALL[n % 10] if n % 10 else "")
    if n < 1000: return SMALL[n // 100] + " hundred" + (" " + say_number(n % 100) if n % 100 else "")
    if n < 1_000_000: return say_number(n // 1000) + " thousand" + (" " + say_number(n % 1000) if n % 1000 else "")
    return str(n)


def speakable(vo):
    """Script line -> what the narrator says: no references, numbers spelled, LORD read as a word."""
    s = re.sub(r"\s*\[[^\]]+\]\s*$", "", vo).strip()
    s = s.replace("“", '"').replace("”", '"').replace("’", "'").replace("…", "...")
    s = re.sub(r"\b(\d{1,3}(?:,\d{3})+|\d+)\b", lambda m: say_number(int(m.group(1).replace(",", ""))), s)
    s = re.sub(r"\bLORD\b", "Lord", s)
    s = s.replace('"', "").replace("\u2018", "").replace("'", "'")
    s = re.sub(r"\bGOD\b", "God", s)
    return s


_LEX = None
def oov(text):
    """Words the voice model would silently skip. Add them to fw-lexicon.txt before recording."""
    global _LEX
    if _LEX is None:
        _LEX = set()
        for f in (HERE / "fw-lexicon.txt", KOKORO / "lexicon-us-en.txt"):
            for line in open(f, encoding="utf-8"):
                _LEX.add(line.split(" ", 1)[0].lower())
    words = re.findall(r"[A-Za-z][A-Za-z']*", text)
    return sorted({w for w in words if w.lower() not in _LEX and w.lower().strip("'") not in _LEX})


def synth(text, sid, speed):
    a = tts().generate(text, sid=sid, speed=speed)
    x = np.asarray(a.samples, dtype=np.float32)
    # trim leading/trailing silence, keep 40 ms of air
    thr = 0.01 * (np.abs(x).max() or 1)
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx):
        pad = int(0.04 * a.sample_rate)
        x = x[max(0, idx[0] - pad): min(len(x), idx[-1] + pad)]
    return x, a.sample_rate



# ---------------- "narrator" delivery: phrase by phrase, Lintel-like pacing and tone ----------------
# Measured on the reference reel: ~155-160 wpm overall, 2-6 word phrases with ~0.3-0.6 s breaths between them,
# a number said alone and held (~0.6 s) before its point; warm low-mids, clear presence, tight compression.
NUMWORD = re.compile(r"^(One|Two|Three|Four|Five)[:.,]$")
GAP = {",": 0.26, ";": 0.34, ":": 0.38, ".": 0.48, "!": 0.48, "?": 0.52, "…": 0.5}
NARR_PAUSE = {"line": 0.42, "beat": 0.6, "turn": 0.75}
FX = ("highpass=f=70,lowshelf=f=130:g={low},equalizer=f=220:t=q:w=0.9:g={warm},equalizer=f=430:t=q:w=1.0:g={body},"
      "equalizer=f=1700:t=q:w=1.0:g={upper},equalizer=f=3400:t=q:w=1.0:g={pres},highshelf=f=6500:g={air},deesser=i=0.25,"
      "acompressor=threshold=-21dB:ratio=3:attack=5:release=90:makeup=2,alimiter=limit=0.89")
FX_DEFAULT = {"low": 0.0, "warm": 4.0, "body": 2.0, "upper": 0.0, "pres": 4.0, "air": 3.0}


def phrases(text):
    """Split a line into spoken phrases at punctuation; returns [(phrase, gap_after)]."""
    parts = re.findall(r"[^,;:.?!…]+[,;:.?!…]*", text)
    out = []
    for p in (x.strip() for x in parts):
        if not p: continue
        gap = GAP.get(p[-1], 0.0)
        if NUMWORD.match(p): gap = 0.6
        # never leave a one-word fragment on its own (except a point number): merge it into the next phrase
        if out and len(out[-1][0].split()) < 2 and not NUMWORD.match(out[-1][0]):
            prev, _ = out.pop(); p = prev + " " + p
        out.append([p, gap])
    if out: out[-1][1] = 0.0
    # long phrases (9+ words) get one breath before a conjunction near the middle, as a narrator would
    JOIN = {"while", "and", "but", "because", "when", "before", "after", "so", "or", "then", "that", "among", "by"}
    res = []
    for p, g in out:
        w = p.split()
        if len(w) >= 9:
            cands = [i for i in range(3, len(w) - 2) if w[i].lower() in JOIN]
            if cands:
                k = min(cands, key=lambda i: abs(i - len(w) / 2))
                res.append((" ".join(w[:k]), 0.16)); res.append((" ".join(w[k:]), g)); continue
        res.append((p, g))
    return res


def sentences(text):
    """Split a line only where a narrator truly stops: sentence ends and a point number ("One:");
    commas stay inside the sentence so the model keeps its natural sentence melody."""
    parts = re.findall(r"[^.?!…]+[.?!…]*", text)
    out = []
    for p in (x.strip() for x in parts):
        if not p: continue
        m = re.match(r"^(One|Two|Three|Four|Five):\s+(.*)$", p)
        if m: out.append([m.group(1) + ".", 0.55]); p = m.group(2)
        out.append([p, GAP.get(p[-1], 0.0) + 0.06])
    if out: out[-1][1] = 0.0
    return [(p, g) for p, g in out]


def synth_narrator(text, sid, speed, mode="phrase"):
    chunks, sr = [], None
    for p, g in (sentences(text) if mode == "sentence" else phrases(text)):
        x, sr = synth(p, sid, speed)
        chunks.append(x)
        if g: chunks.append(np.zeros(int(g * sr), dtype=np.float32))
    return np.concatenate(chunks), sr


def fx_params(a, v):
    """Per-voice tone settings (fitted to the reference by measurement) from --fx JSON {voice: {band: dB}}."""
    if not getattr(a, "fx", None): return {}
    return json.loads(Path(a.fx).read_text()).get(v, {})


def fx_file(src, dst, **kw):
    import subprocess
    p = dict(FX_DEFAULT, **{k: v for k, v in kw.items() if v is not None})
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", str(src), "-af", FX.format(**p), "-ar", "48000", str(dst)])


# ---------------- "performed" delivery: the narrator layer on top of the TTS take ----------------
# Sentence-level synthesis keeps the model's natural sentence melody; then a PSOLA re-performance (Praat overlap-add)
# widens the pitch range toward the reference narrator (~12 semitones vs the model's ~8), and leans on each line's
# key words (the same words shown in gold on screen): a little slower and a little higher, ramped in and out.
PERF = {"k": 1.45, "slow": 1.15, "lift": 1.8}


def perform(x, sr, text, keys, k=None, slow=None, lift=None, comma=0.26, fall=9.0, inner_fall=3.0, shift=0.0, end=None, key_gain=0.0, quote_gain=0.0, quote_at=None, stress=0.0, light_dur=0.88):
    """Narrator layer for one sentence of TTS (PSOLA via Praat):
    - longer breaths at commas/colons (silence inserted in the gap the model already leaves), so the sentence splits
      into short phrases the way the reference narrator speaks (~40% of his phrases are 1-3 words);
    - pitch range widened by k around the median;
    - key words get a pitch accent that peaks early in the word and comes back down inside it (a lift that never
      leaves the phrase hanging), and are spoken a little slower;
    - the sentence ends with a real fall (statements and wh-questions ~4 semitones over the last 0.3 s;
      yes/no questions only a little), instead of TTS's level or rising endings."""
    import parselmouth
    from parselmouth.praat import call
    k = k or PERF["k"]; slow = slow or PERF["slow"]; lift = lift if lift is not None else PERF["lift"]
    toks = text.split()
    words = re.findall(r"[A-Za-z0-9'\-]+", text)
    wt, _ = word_times(x, sr, words)
    # 1) breaths at commas / colons: find each such word's boundary and insert silence at the quietest point there
    if comma and len(wt) == len(words):
        marks = []
        wi = 0
        for tk in toks:
            n_in = len(re.findall(r"[A-Za-z0-9'\-]+", tk))
            wi += n_in
            if n_in and re.search(r"[,:;]$", tk) and wi < len(wt):
                marks.append((wt[wi - 1][2], wt[wi][1]))
        # long stretches with no comma get one short breath before a joining word, as the reference narrator does
        JOIN = {"while", "and", "but", "because", "when", "before", "after", "so", "or", "then", "that", "among", "by", "who"}
        cut_idx = [0] + [j for j in range(1, len(words)) if any(abs(wt[j][1] - m1) < 1e-6 for _, m1 in marks)] + [len(words)]
        for a0, b0 in zip(cut_idx, cut_idx[1:]):
            if b0 - a0 >= 8:
                cands = [j for j in range(a0 + 3, b0 - 2) if words[j].lower() in JOIN]
                if cands:
                    j = min(cands, key=lambda q: abs(q - (a0 + b0) / 2))
                    marks.append((wt[j - 1][2], wt[j][1]))
        pieces, last = [], 0
        cuts = []
        for e, s_next in marks:
            lo, hi = int(min(e, s_next) * sr), int(max(e, s_next) * sr) + 1
            lo = max(0, lo - int(0.08 * sr)); hi = min(len(x), hi + int(0.04 * sr))
            env = np.convolve(np.abs(x[lo:hi]), np.ones(int(0.01 * sr)) / int(0.01 * sr), "same") if hi - lo > int(0.02 * sr) else None
            c = lo + int(np.argmin(env)) if env is not None else int(e * sr)
            cuts.append(c)
        for c in sorted(cuts):
            pieces.append(x[last:c]); pieces.append(np.zeros(int(comma * sr), dtype=np.float32)); last = c
        pieces.append(x[last:]); x = np.concatenate(pieces)
        def shifted(t):
            return t + comma * sum(1 for c in cuts if c / sr <= t)
        wt = [(w, shifted(s0), shifted(e0)) for (w, s0, e0) in wt]
    spans = [(s0, e0) for (w, s0, e0) in wt if re.sub(r"[^a-z']", "", w.lower()) in keys] if keys else []
    # stress timing (how English sounds alive): every content word gets a small pitch accent and a little more
    # weight; small function words ("the", "of", "and") are said a little quicker and lighter
    norm = lambda w: re.sub(r"[^a-z']", "", w.lower())
    content = [(s0, e0) for (w, s0, e0) in wt if norm(w) not in FUNCTION and norm(w) not in (keys or ()) and len(norm(w)) > 2] if stress else []
    light = [(s0, e0) for (w, s0, e0) in wt if norm(w) in FUNCTION] if stress else []
    snd = parselmouth.Sound(x.astype(np.float64), sampling_frequency=sr)
    manip = call(snd, "To Manipulation", 0.01, 70, 300)
    f = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=300).selected_array["frequency"]
    if not (f > 0).any(): return x
    m = float(np.median(f[f > 0]))
    pt = call(manip, "Extract pitch tier"); n = call(pt, "Get number of points"); dur = snd.duration
    yesno = text.rstrip().endswith("?") and re.match(r"^(Was|Is|Did|Can|Do|Does|Are|Will|Would|Could|Should)\b", text.strip())
    end = end or ("rise" if yesno else "fall")
    fall_st = -4.0 if end == "rise" else fall   # a yes/no question lifts at the end instead of falling
    pv = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=300)
    fv = pv.selected_array["frequency"]; tv = pv.xs()
    end_t = float(tv[fv > 0][-1]) + 0.02 if (fv > 0).any() else dur   # where the voice actually stops, not the clip's tail
    def accent(t, spans=spans):
        b = 0.0
        for s0, e0 in spans:
            pk = s0 + 0.35 * (e0 - s0)
            if s0 - 0.05 < t < e0:
                b = max(b, (t - (s0 - 0.05)) / (pk - (s0 - 0.05)) if t < pk else max(0.0, 1 - (t - pk) / max(0.05, e0 - pk)))
        return b
    W_END = 0.48
    def final(t):
        return 0.0 if t < end_t - W_END else min(1.0, (t - (end_t - W_END)) / W_END) ** 1.3
    # a smaller fall at the end of each inner phrase (before a comma breath), as a narrator does
    inner = [wt[j][2] for j in range(len(wt) - 1) if (wt[j + 1][1] - wt[j][2]) > 0.15]
    def phrase_fall(t):
        b = 0.0
        for e0 in inner:
            if e0 - 0.28 < t <= e0 + 0.05: b = max(b, min(1.0, (t - (e0 - 0.28)) / 0.28))
        return b
    # each phrase starts a little higher and drifts down (declination), and resets after every breath
    bounds = [0.0] + [e0 + 0.05 for e0 in inner] + [end_t]
    def declination(t):
        for a0, b0 in zip(bounds, bounds[1:]):
            if a0 <= t <= b0: return 1.0 - 1.6 * (t - a0) / max(0.3, b0 - a0)
        return 0.0
    new = call("Create PitchTier", "p", 0, dur)
    for i in range(1, n + 1):
        t = call(pt, "Get time from index", i); v = call(pt, "Get value at index", i)
        semis = (shift + lift * accent(t) + stress * 1.6 * accent(t, content) + stress * declination(t)
                 - fall_st * final(t) - inner_fall * phrase_fall(t))
        call(new, "Add point", t, m * (v / m) ** k * 2 ** (semis / 12))
    call([new, manip], "Replace pitch tier")
    stretch = ([(s0, e0, slow) for s0, e0 in spans] if slow and slow != 1.0 else []) + [(s0, e0, 1 - (1 - light_dur) * stress) for s0, e0 in light if e0 - s0 > 0.06]
    if stretch:
        dt = call("Create DurationTier", "d", 0, dur); call(dt, "Add point", 0, 1.0)
        for s0, e0, fct in sorted(stretch):
            call(dt, "Add point", max(0, s0 - 0.01), 1.0); call(dt, "Add point", s0 + 0.01, fct)
            call(dt, "Add point", max(s0 + 0.02, e0 - 0.01), fct); call(dt, "Add point", e0 + 0.01, 1.0)
        call([dt, manip], "Replace duration tier")
    y = call(manip, "Get resynthesis (overlap-add)").values[0].astype(np.float32)
    if stretch:  # map original times to the new timeline (function words were shortened)
        def remap(t0):
            out = t0
            for s0, e0, fct in stretch:
                if t0 > s0: out -= (min(t0, e0) - s0) * (1 - fct)
            return out
        spans = [(remap(a0), remap(b0)) for a0, b0 in spans]; content = [(remap(a0), remap(b0)) for a0, b0 in content]
        light = [(remap(a0), remap(b0)) for a0, b0 in light]
        wt = [(w, remap(a0), remap(b0)) for (w, a0, b0) in wt]
    if stress:
        tt = np.arange(len(y)) / sr; g = np.zeros(len(y), dtype=np.float32)
        for a0, b0 in content: g += 1.0 * stress * np.clip(np.minimum((tt - (a0 - 0.03)) / 0.03, ((b0 + 0.03) - tt) / 0.05), 0, 1)
        for a0, b0 in light: g -= 1.5 * stress * np.clip(np.minimum((tt - (a0 - 0.02)) / 0.02, ((b0 + 0.02) - tt) / 0.03), 0, 1)
        y = y * (10 ** (g / 20))
    # loudness: lean on key words (ramped), and speak a quoted passage a touch softer (reverent)
    if (key_gain and spans) or quote_gain:
        tt = np.arange(len(y)) / sr; g = np.zeros(len(y), dtype=np.float32)
        if key_gain:
            for s0, e0 in spans:
                g = np.maximum(g, key_gain * np.clip(np.minimum((tt - (s0 - 0.04)) / 0.04, ((e0 + 0.04) - tt) / 0.06), 0, 1))
        if quote_gain and quote_at is not None and quote_at < len(wt):
            g += quote_gain * np.clip((tt - wt[quote_at][1] + 0.1) / 0.1, 0, 1)
        y = y * (10 ** (g / 20))
    return y


def synth_performed(text, sid, speed, keys):
    chunks, sr = [], None
    for i, (p, g) in enumerate(sentences(text)):
        x, sr = synth(p, sid, speed)
        x = perform(x, sr, p, keys)
        chunks.append(x)
        if g: chunks.append(np.zeros(int(g * (1 + 0.15 * np.sin(i * 2.3)) * sr), dtype=np.float32))  # breaths vary a little
    return np.concatenate(chunks), sr


# ---------------- the director: rules of good speaking, applied per line ----------------
# register (pitch level) by role, melody range by role, rate by role (never below 0.94, so sounds are not stretched),
# falls on statements and wh-questions, a lift on yes/no questions, emphasis by pitch AND loudness, pauses for weight.
FUNCTION = set("""a an the and or but so of to in on at by for with from as is are was were be been am do does did done has have had
he him his she her it its they them their we us our you your i me my this that these those there then than not no if when while
who whom which what why how let let's it's he's she's that's what's don't didn't isn't wasn't can't won't would could should
will shall may might must up out off over into onto upon just""".split())


def direction(text, section, idx=0, keys=()):
    t = text.strip(); d = {"shift": 0.0, "k": 1.32, "speed": 0.98, "lift": 1.6, "key_gain": 2.5, "quote_gain": 0.0,
                           "fall": 6.5, "inner": 2.5, "after": None}
    quote = '"' in t or "“" in t
    if section == "hook": d.update(shift=1.0, k=1.4, speed=0.97)
    if section == "landing": d.update(shift=-0.3, speed=0.96, fall=7.5)
    if re.match(r"^(One|Two|Three|Four|Five):", t): d.update(shift=0.8, k=1.35, speed=0.95, fall=7.5, after=0.5)
    if quote: d.update(k=1.22, speed=0.95, quote_gain=-1.5)
    if t.endswith("?"): d.update(after=0.55)
    if re.search(r"\b(Tell us|comments)\b", t): d.update(shift=0.8, speed=1.0)
    return d


# per-voice calibration against the reference narrator (pace inside phrases ~200 wpm, median pitch ~120 Hz,
# phrase ends ~3-4 semitones under the median): the Michael+Fenrir blend talks fast, sits high and already falls deep
VOICE_PROFILE = {"blend_mf": {"speed": 0.9, "fall": 0.4, "shift": -1.6, "light": 0.86, "inner": 0.4, "comma": 0.36}}


def synth_directed(vo, sid, section, keys, idx=0, profile=None):
    """vo = the script line as written (quotes kept, so the quoted words can be spoken a touch softer)."""
    d = direction(vo, section, idx, keys)
    P = VOICE_PROFILE.get(profile, {}) if isinstance(profile, str) else (profile or {})
    d["speed"] *= P.get("speed", 1.0); d["fall"] *= P.get("fall", 1.0); d["shift"] += P.get("shift", 0.0)
    d["inner"] *= P.get("inner", 1.0); d["comma"] = P.get("comma", 0.26)
    text = speakable(vo)
    m = re.search(r'["\u201c]', vo)
    q_word = len(re.findall(r"[A-Za-z0-9'\-]+", speakable(vo[:m.start()]))) if m else None
    chunks, sr, done = [], None, 0
    for i, (p, g) in enumerate(sentences(text)):
        nw = len(re.findall(r"[A-Za-z0-9'\-]+", p))
        qa = None if q_word is None else (max(0, q_word - done) if q_word < done + nw else None)
        x, sr = synth(p, sid, d["speed"])
        j = idx * 3 + i  # vary each sentence a little: register, melody range and depth of the final fall
        x = perform(x, sr, p, keys, k=d["k"] * (1 + 0.08 * np.sin(j * 1.7)), slow=1.0, lift=d["lift"],
                    fall=d["fall"] * (1 + 0.18 * np.sin(j * 2.9)), inner_fall=d["inner"],
                    shift=d["shift"] + 0.5 * np.sin(j * 1.3), key_gain=d["key_gain"], quote_gain=d["quote_gain"],
                    quote_at=qa, stress=d.get("stress", 1.0), light_dur=P.get("light", 0.88), comma=d["comma"])
        chunks.append(x); done += nw
        if g: chunks.append(np.zeros(int(g * (1 + 0.15 * np.sin((idx + i) * 2.3)) * sr), dtype=np.float32))
    return np.concatenate(chunks), sr, d


def write_wav(path, x, sr):
    x = np.clip(x, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


_ASR = None
def asr():
    global _ASR
    if _ASR is None:
        import sherpa_onnx
        fetch(ASR_URL, ASR_DIR)
        d = ASR_DIR
        _ASR = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=str(d / "encoder-epoch-99-avg-1.onnx"), decoder=str(d / "decoder-epoch-99-avg-1.onnx"),
            joiner=str(d / "joiner-epoch-99-avg-1.onnx"), tokens=str(d / "tokens.txt"), num_threads=4)
    return _ASR


def resample(x, sr, to=16000):
    if sr == to: return x
    n = int(len(x) * to / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def word_times(x, sr, script_words):
    """ASR the clip, get word start times from token timestamps, and map them onto the script's words
    in order (the script spelling wins; ASR only supplies timing)."""
    rec = asr(); st = rec.create_stream()
    st.accept_waveform(16000, resample(x, sr))
    rec.decode_stream(st)
    r = st.result
    toks, ts = list(r.tokens), list(r.timestamps)
    heard = []  # (word, start)
    for t, s in zip(toks, ts):
        if t.startswith(("▁", " ")) or not heard:  # this model marks a word start with a space, others with ▁
            heard.append([t.lstrip("▁ ").lower(), s])
        else:
            heard[-1][0] += t.lower()
    dur = len(x) / sr
    n = len(script_words)
    if not heard:
        step = dur / max(n, 1)
        return [(w, i * step, (i + 1) * step) for i, w in enumerate(script_words)], ""
    # align by order: spread script words over heard words with a simple DP on normalized spelling
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
    sw = [norm(w) for w in script_words]; hw = [norm(h[0]) for h in heard]
    INF = 10 ** 9
    D = [[INF] * (len(hw) + 1) for _ in range(n + 1)]; B = [[None] * (len(hw) + 1) for _ in range(n + 1)]
    D[0][0] = 0
    for i in range(n + 1):
        for j in range(len(hw) + 1):
            if D[i][j] >= INF: continue
            if i < n and j < len(hw):
                c = 0 if sw[i] == hw[j] else 1
                if D[i][j] + c < D[i + 1][j + 1]: D[i + 1][j + 1] = D[i][j] + c; B[i + 1][j + 1] = (i, j)
            if i < n and D[i][j] + 1 < D[i + 1][j]: D[i + 1][j] = D[i][j] + 1; B[i + 1][j] = (i, j)
            if j < len(hw) and D[i][j] + 1 < D[i][j + 1]: D[i][j + 1] = D[i][j] + 1; B[i][j + 1] = (i, j)
    starts = [None] * n
    i, j = n, len(hw)
    while (i, j) != (0, 0):
        pi, pj = B[i][j]
        if pi == i - 1 and pj == j - 1: starts[i - 1] = heard[j - 1][1]
        i, j = pi, pj
    # fill gaps by interpolation between known starts
    known = [(k, s) for k, s in enumerate(starts) if s is not None]
    if not known: known = [(0, 0.0)]
    for k in range(n):
        if starts[k] is None:
            prev = max([kk for kk, _ in known if kk < k], default=None); nxt = min([kk for kk, _ in known if kk > k], default=None)
            a = starts[prev] if prev is not None else 0.0; b = starts[nxt] if nxt is not None else dur
            ka = prev if prev is not None else -1; kb = nxt if nxt is not None else n
            starts[k] = a + (b - a) * (k - ka) / max(kb - ka, 1)
    ends = [starts[k + 1] for k in range(n - 1)] + [dur]
    heard_text = " ".join(h[0] for h in heard)
    return [(script_words[k], max(0.0, starts[k]), max(starts[k] + 0.05, ends[k])) for k in range(n)], heard_text


def parse_vo(episode):
    sec, out = None, []
    for line in Path(episode).read_text().splitlines():
        m = re.match(r"^##\s+(\w+)", line)
        if m: sec = m.group(1).lower(); continue
        if line.startswith("## Value"): break
        if line.startswith("VO:"): out.append({"section": sec, "text": line[3:].strip()})
    return out


def cmd_samples(a):
    smap = speaker_map(); out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for v in a.voices.split(","):
        v = v.strip(); sid = smap[v]
        text = speakable(a.text)
        x, sr = synth_narrator(text, sid, a.speed) if a.style == "narrator" else synth(text, sid, a.speed)
        write_wav(out / f"{v}.wav", x, sr)
        if a.style == "narrator": fx_file(out / f"{v}.wav", out / f"{v}_fx.wav", **fx_params(a, v))
        print(f"{v}: sid {sid}, {len(x)/sr:.1f}s, {len(text.split()) / (len(x) / sr) * 60:.0f} wpm -> {out / (v + '.wav')}")


def cmd_record(a):
    smap = speaker_map(); sid = int(a.voice) if a.voice.isdigit() else smap[a.voice]
    lines = parse_vo(a.episode)
    missing = sorted({w for ln in lines for w in oov(speakable(ln["text"]))})
    if missing:
        sys.exit("words the voice would skip (add them to fw-lexicon.txt): " + ", ".join(missing))
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    chunks, words, lines_out, t, sr0 = [], [], [], 0.0, None
    prev_sec = None
    after = 0.0
    for i, ln in enumerate(lines):
        if i > 0:
            if after: chunks.append(np.zeros(int(after * sr0), dtype=np.float32)); t += after; after = 0.0
            P = NARR_PAUSE if a.style in ("narrator", "performed", "directed") else {"line": PAUSE_LINE, "beat": PAUSE_BEAT, "turn": PAUSE_TURN}
            gap = P["turn"] if ln["section"] == "turn" and prev_sec != "turn" else (P["beat"] if ln["section"] != prev_sec else P["line"])
            chunks.append(np.zeros(int(gap * sr0), dtype=np.float32)); t += gap
        text = speakable(ln["text"])
        if a.style == "directed":  # the narrator director (speaking rules per line) on the raw script line
            keys = set(json.loads(Path(a.keys).read_text()).get(str(i), [])) if a.keys else set()
            x, sr, d = synth_directed(ln["text"], sid, ln["section"], keys, i, a.profile)
            if d.get("after") and i + 1 < len(lines):  # a held beat after questions and point numbers
                after = d["after"]
            else:
                after = 0.0
        elif a.style == "performed":
            keys = set(json.loads(Path(a.keys).read_text()).get(str(i), [])) if a.keys else set()
            x, sr = synth_performed(text, sid, a.speed, keys)
        else:
            x, sr = synth_narrator(text, sid, a.speed) if a.style == "narrator" else synth(text, sid, a.speed)
        sr0 = sr0 or sr
        script_words = re.findall(r"[A-Za-z0-9'\-]+", text)
        wt, heard = word_times(x, sr, script_words)
        lw = [{"word": w, "start": round(t + s, 3), "end": round(t + e, 3), "line": i} for w, s, e in wt]
        words += lw
        lines_out.append({"line": i, "section": ln["section"], "vo": ln["text"], "spoken": text, "start": round(t, 3),
                          "end": round(t + len(x) / sr, 3), "heard": heard, "words": lw})
        chunks.append(x); t += len(x) / sr; prev_sec = ln["section"]
        print(f"{i+1:>2}. {lines_out[-1]['start']:6.2f}-{lines_out[-1]['end']:6.2f}  {text[:70]}")
    write_wav(out / ("voice_raw.wav" if a.style != "plain" else "voice.wav"), np.concatenate(chunks), sr0)
    if a.style != "plain": fx_file(out / "voice_raw.wav", out / "voice.wav", **fx_params(a, a.voice))  # same length; word times unchanged
    (out / "words.json").write_text(json.dumps(words, indent=1))
    (out / "lines.json").write_text(json.dumps(lines_out, indent=1))
    print(f"voice: {t:.2f}s, {len(words)} words, voice {a.voice} (sid {sid}), speed {a.speed} -> {out}")


def main():
    p = argparse.ArgumentParser(); sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("samples"); s.add_argument("--text", required=True); s.add_argument("--voices", required=True)
    s.add_argument("--speed", type=float, default=1.0); s.add_argument("--out", default="samples"); s.add_argument("--style", default="plain"); s.add_argument("--fx")
    r = sub.add_parser("record"); r.add_argument("episode"); r.add_argument("--voice", required=True)
    r.add_argument("--speed", type=float, default=1.0); r.add_argument("--out", default="build/voice"); r.add_argument("--style", default="plain"); r.add_argument("--fx"); r.add_argument("--keys"); r.add_argument("--profile")
    sub.add_parser("voices")
    a = p.parse_args()
    if a.cmd == "samples": cmd_samples(a)
    elif a.cmd == "record": cmd_record(a)
    else: print("\n".join(f"{i:>2} {n}" for n, i in sorted(speaker_map().items(), key=lambda kv: kv[1])))

if __name__ == "__main__":
    main()
