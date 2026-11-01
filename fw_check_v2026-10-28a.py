#!/usr/bin/env python3
"""Fourth Watch QA checker.

  python3 fw_check.py script  episode.md                    -> lint a script before approval
  python3 fw_check.py video   --video out/ep.mp4 --script episode.md --subs out/ep.srt [--out qa/]
                              [--vo-audio out/voice.wav] [--no-asr] [--wpm 150]

Exit code 0 = no FAIL, 1 = at least one FAIL, 2 = could not run.
Writes report.json + report.md (and for video: sheet.png, issues.png, firstlast.png) to --out.

Needs: python3, numpy, Pillow, opencv-python, ffmpeg/ffprobe, tesseract (CLI).
Optional: sherpa-onnx (pip) + an English zipformer model for hearing the voiceover; downloaded from
GitHub into ~/.cache/fourth-watch/ on first use. Without it, sync falls back to speech-activity checks.
"""
import argparse, difflib, json, os, re, shutil, subprocess, sys, tempfile, wave
from pathlib import Path

# ----------------------------------------------------------------------------------------------- config
SERIES = ["HERO OR VILLAIN?", "ASK THE TEXT", "STRANGE BUT TRUE", "MISQUOTED"]
SECTIONS = ["hook", "stakes", "story", "turn", "landing"]
REF_REQUIRED = {"story", "turn"}                     # every VO line here must carry [Book c:v]
RUNTIME_HARD = (30, 60)                              # seconds: outside = FAIL
RUNTIME_TARGET = (35, 55)                            # seconds: outside = WARN
FRAME = (1080, 1920)
FPS_OK = (29.5, 30.5)
SAFE = {"bottom": 400, "right": 140, "top": 120, "side": 60}   # px kept clear of text at 1080x1920
RIGHT_ZONE_FROM = 0.45                               # Instagram's button column covers the right edge below 45% height
LUFS_RANGE = (-16.0, -12.0)
TRUE_PEAK_MAX = -1.0
MAX_STILL = 1.5                                      # s without visible motion
MAX_SCENE_GAP = 8.0                                  # s between visual changes (warn)
CAPTION_MAX_WORDS = 4
CAPTION_MIN_DUR = 0.35
CAPTION_MAX_CPS = 25
SYNC_WARN, SYNC_FAIL = 0.25, 0.6                     # s between caption start and the spoken word
MAX_SENTENCE_WORDS = 15
CTA = [r"\bfollow\b", r"\bsubscribe\b", r"\blike (and|&) share\b", r"\bcomment (below|down)\b", r"\blink in (my |the )?bio\b",
       r"\bpart (two|2)\b", r"\bsmash\b", r"\bturn on notifications\b"]
OVERCLAIM = ["always", "never", "every", "everyone", "all", "only", "proves", "proof", "proven", "definitely", "certainly",
             "scientists", "historians", "scholars", "secret", "hidden", "banned", "forbidden", "they don't want you"]
OUTSIDE = ["enoch", "jasher", "jubilees", "apocrypha", "talmud", "josephus", "legend", "tradition says", "midrash", "gnostic"]
TRANSLATIONS = ["niv", "kjv", "nlt", "nkjv", "nasb", "msg", "csb", "nrsv", "amp", "tpt"]
ASR_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-small-en-2023-06-26.tar.bz2"
ASR_DIR = Path(os.environ.get("FW_ASR_DIR", Path.home() / ".cache" / "fourth-watch" / "asr"))
STOP = set("a an the and or but of to in on at for with by is was were be been are it its as that this these those he she they "
           "him her them his their i you we our your from so not no".split())


# ----------------------------------------------------------------------------------------------- report
class Report:
    def __init__(self, kind):
        self.kind, self.items, self.facts = kind, [], {}

    def add(self, level, check, msg, t=None, **extra):
        self.items.append({"level": level, "check": check, "msg": msg, **({"t": round(t, 2)} if t is not None else {}), **extra})

    def fail(self, check, msg, t=None, **e): self.add("FAIL", check, msg, t, **e)
    def warn(self, check, msg, t=None, **e): self.add("WARN", check, msg, t, **e)
    def ok(self, check, msg, **e): self.add("PASS", check, msg, None, **e)

    @property
    def failed(self): return any(i["level"] == "FAIL" for i in self.items)

    def write(self, out):
        out = Path(out); out.mkdir(parents=True, exist_ok=True)
        counts = {k: sum(1 for i in self.items if i["level"] == k) for k in ("FAIL", "WARN", "PASS")}
        data = {"kind": self.kind, "verdict": "FAIL" if self.failed else ("PASS WITH WARNINGS" if counts["WARN"] else "PASS"),
                "counts": counts, "facts": self.facts, "items": self.items}
        (out / "report.json").write_text(json.dumps(data, indent=2, ensure_ascii=False))
        order = {"FAIL": 0, "WARN": 1, "PASS": 2}
        lines = [f"# Fourth Watch QA — {self.kind}", "", f"**Verdict: {data['verdict']}** · {counts['FAIL']} fail · "
                 f"{counts['WARN']} warn · {counts['PASS']} pass", ""]
        if self.facts:
            lines += ["| Fact | Value |", "| --- | --- |"] + [f"| {k} | {v} |" for k, v in self.facts.items()] + [""]
        lines += ["| Level | Check | Time | Finding |", "| --- | --- | --- | --- |"]
        for i in sorted(self.items, key=lambda i: (order[i["level"]], i.get("t", 0))):
            lines.append(f"| {i['level']} | {i['check']} | {('%.2fs' % i['t']) if 't' in i else ''} | {i['msg'].replace('|', '/')} |")
        (out / "report.md").write_text("\n".join(lines) + "\n")
        return data


# ----------------------------------------------------------------------------------------------- text helpers
NUM_WORDS = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def num_to_words(n):
    if n < 20: return NUM_WORDS[n]
    if n < 100: return TENS[n // 10] + ("" if n % 10 == 0 else " " + NUM_WORDS[n % 10])
    if n < 1000: return NUM_WORDS[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + num_to_words(n % 100))
    if n < 1_000_000: return num_to_words(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + num_to_words(n % 1000))
    return str(n)


def clean_text(s):
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    s = re.sub(r"[\u2013\u2014-]", " ", s)
    return s


def tokens(s, spell_numbers=False):
    s = clean_text(s).lower()
    s = re.sub(r"(?<=\d),(?=\d{3})", "", s)                                 # 42,000 -> 42000
    if spell_numbers:
        s = re.sub(r"\d+", lambda m: num_to_words(int(m.group())), s)
    return re.findall(r"[a-z0-9]+(?:'[a-z]+)?", s)


def strip_refs(s):
    return re.sub(r"\[[^\]]*\]", "", s).strip()


def sentences(s):
    return [x.strip() for x in re.split(r"(?<=[.!?])\s+", s) if x.strip()]


# ----------------------------------------------------------------------------------------------- script parsing
def parse_script(path):
    """Fourth Watch script format (see SKILL.md): '# Title', 'series:', 'answer:', '## Hook' ... sections with
    'VO:' / 'VERSE:' / 'ON-SCREEN:' / 'VISUAL:' lines, '## Value' list, '## Caption', '## References',
    '## Fact-check log' table."""
    text = Path(path).read_text()
    ep = {"title": None, "series": None, "target_seconds": None, "answer": None, "sections": {}, "vo": [], "verses": [],
          "onscreen": [], "visuals": [], "value": [], "caption": "", "references": [], "factcheck": [], "raw": text}
    cur = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line: continue
        if line.startswith("# ") and ep["title"] is None:
            ep["title"] = line[2:].strip(); continue
        m = re.match(r"^(series|target_seconds|answer)\s*:\s*(.+)$", line, re.I)
        if m and cur is None:
            ep[m.group(1).lower()] = m.group(2).strip(); continue
        if line.startswith("## "):
            cur = line[3:].strip().lower().replace("-", " ")
            cur = {"fact check log": "factcheck", "factcheck log": "factcheck"}.get(cur, cur)
            ep["sections"].setdefault(cur, []); continue
        if cur is None: continue
        ep["sections"][cur].append(line)
        m = re.match(r"^(VO|VERSE|ON-SCREEN|ONSCREEN|VISUAL)\s*:\s*(.*)$", line, re.I)
        if m and cur in SECTIONS:
            k, v = m.group(1).upper().replace("ONSCREEN", "ON-SCREEN"), m.group(2).strip()
            item = {"section": cur, "text": v}
            {"VO": ep["vo"], "VERSE": ep["verses"], "ON-SCREEN": ep["onscreen"], "VISUAL": ep["visuals"]}[k].append(item)
        elif cur == "caption":
            ep["caption"] += line + "\n"
        elif cur == "references":
            ep["references"].append(line.lstrip("-* ").strip())
        elif cur == "value" and re.match(r"^[-*\d]", line):
            ep["value"].append(re.sub(r"^(?:[-*]|\d+[.)])\s*", "", line).strip())
        elif cur == "factcheck" and line.startswith("|") and not re.match(r"^\|\s*-", line):
            cells = [c.strip() for c in line.strip("|").split("|")]
            if cells and cells[0].lower() not in ("claim", ""): ep["factcheck"].append(cells)
    return ep


def vo_text(ep):
    return " ".join(strip_refs(v["text"]) for v in ep["vo"])


# ----------------------------------------------------------------------------------------------- script lint
def lint_script(path, wpm=150):
    R = Report("script")
    try:
        ep = parse_script(path)
    except Exception as e:
        R.fail("parse", f"could not read the script: {e}"); return R, None
    # structure
    if not ep["title"]: R.fail("title", "no '# Title' line")
    series = (ep["series"] or "").upper()
    if series not in SERIES: R.fail("series", f"series is '{ep['series']}', must be one of: {', '.join(SERIES)}")
    else: R.ok("series", series)
    for s in SECTIONS:
        if not any(v["section"] == s for v in ep["vo"]): R.fail("structure", f"section '{s}' has no VO line")
    if ep["vo"] and ep["title"]:
        if tokens(strip_refs(ep["vo"][0]["text"])) != tokens(ep["title"]):
            R.fail("hook", f"first VO line must equal the title word for word: '{strip_refs(ep['vo'][0]['text'])}' vs '{ep['title']}'")
        else: R.ok("hook", "first VO line equals the title")
    # length
    words = tokens(vo_text(ep), spell_numbers=True)
    secs = len(words) / wpm * 60
    R.facts.update({"title": ep["title"], "series": series, "VO words": len(words), "estimated runtime": f"{secs:.1f}s at {wpm} wpm"})
    if not (RUNTIME_HARD[0] <= secs <= RUNTIME_HARD[1]): R.fail("runtime", f"estimated {secs:.0f}s; must be {RUNTIME_HARD[0]}–{RUNTIME_HARD[1]}s")
    elif not (RUNTIME_TARGET[0] <= secs <= RUNTIME_TARGET[1]): R.warn("runtime", f"estimated {secs:.0f}s; target {RUNTIME_TARGET[0]}–{RUNTIME_TARGET[1]}s")
    else: R.ok("runtime", f"estimated {secs:.0f}s")
    # line rules
    for v in ep["vo"]:
        t, sec = v["text"], v["section"]
        plain = strip_refs(t)
        if sec in REF_REQUIRED and not re.search(r"\[[^\]]*\d+:\d+[^\]]*\]", t):
            R.fail("reference", f"{sec} line has no [Book chapter:verse]: '{plain[:70]}'")
        for s in sentences(plain):
            n = len(tokens(s))
            if n > MAX_SENTENCE_WORDS: R.warn("sentence length", f"{n} words (max {MAX_SENTENCE_WORDS}): '{s[:80]}'")
        low = plain.lower()
        if any(re.search(pat, low) for pat in CTA):
            R.fail("call to action", f"calls to action belong in the caption, not the VO: '{plain[:70]}'")
        for w in OVERCLAIM:
            if re.search(r"\b" + re.escape(w) + r"\b", low):
                R.warn("overclaim", f"'{w}' — make sure the text really says this: '{plain[:80]}'")
        for w in OUTSIDE:
            if re.search(r"\b" + re.escape(w) + r"\b", low):
                R.warn("outside source", f"'{w}' — must be labeled as outside the Bible: '{plain[:80]}'")
        if '"' in clean_text(plain) and not re.search(r"\[[^\]]*\d+:\d+", t):
            R.warn("dialogue", f"quoted words with no reference (invented dialogue?): '{plain[:80]}'")
    # verses
    if not ep["verses"]: R.fail("verse", "no VERSE: line (one ESV quote with reference is required)")
    for v in ep["verses"]:
        t = v["text"]
        if "esv" not in t.lower(): R.fail("verse", f"VERSE must be marked (ESV): '{t[:80]}'")
        if not re.search(r"\d+:\d+", t): R.fail("verse", f"VERSE has no chapter:verse reference: '{t[:80]}'")
        for tr in TRANSLATIONS:
            if re.search(r"\b" + tr + r"\b", t.lower()):
                R.warn("translation", f"{tr.upper()} quoted on screen; ESV only unless the episode is about that wording")
    if len(ep["verses"]) > 2: R.warn("verse", f"{len(ep['verses'])} verse cards; the playbook allows one or two")
    # the episode answers its own question
    if not ep.get("answer"):
        R.fail("answer", "no 'answer:' line: write the one-sentence answer this episode gives to its title question")
    if ep["vo"]:
        last = (sentences(strip_refs(ep["vo"][-1]["text"])) or [""])[-1]
        if last.rstrip().endswith("?"):
            R.fail("answer", f"the episode ends on a question ('{last}'); the landing must state the answer")
    if ep.get("answer"):
        key = {w for w in tokens(ep["answer"]) if w not in STOP and len(w) > 2}
        late = {w for v in ep["vo"] if v["section"] in ("turn", "landing") for w in tokens(strip_refs(v["text"]))}
        hit = len(key & late) / max(1, len(key))
        if hit < 0.5:
            R.fail("answer", f"the Turn/Landing voiceover never states the answer line ({hit:.0%} of its key words): '{ep['answer']}'")
        else: R.ok("answer", f"answer stated in the Turn/Landing: '{ep['answer']}'")
    # the viewer learns something
    vals = ep.get("value", [])
    if len(vals) < 3:
        R.fail("value", f"## Value lists {len(vals)} thing(s) the viewer learns; at least 3 are required, each with a verse")
    for item in vals:
        if not re.search(r"\[[^\]]*\d+:\d+[^\]]*\]", item):
            R.fail("value", f"value item has no [Book chapter:verse]: '{item[:70]}'")
    if len(vals) >= 3 and all(re.search(r"\[[^\]]*\d+:\d+[^\]]*\]", i) for i in vals):
        R.ok("value", f"{len(vals)} things the viewer learns, each with a verse")
    # landing echoes the hook
    land = [strip_refs(v["text"]) for v in ep["vo"] if v["section"] == "landing"]
    if land and ep["title"]:
        a = {w for w in tokens(land[-1]) if w not in STOP}
        b = {w for w in tokens(ep["title"]) if w not in STOP}
        if not a & b: R.warn("loop", "the last VO line shares no key word with the hook; the loop line should echo it")
        else: R.ok("loop", "landing echoes the hook")
    # references + fact-check log
    cited = set(re.findall(r"\[([^\]]+)\]", " ".join(v["text"] for v in ep["vo"])))
    if not ep["references"]: R.fail("references", "## References is empty")
    if not ep["factcheck"]: R.fail("fact-check", "## Fact-check log is empty: every claim needs a row")
    for row in ep["factcheck"]:
        status = (row[-1] if row else "").lower()
        if not re.search(r"verified|checked|✓|pass", status):
            R.fail("fact-check", f"claim not verified: '{row[0][:70]}' (status: '{row[-1] if row else ''}')")
    logged = " ".join(" ".join(r) for r in ep["factcheck"]).lower()
    for c in cited:
        book_ref = re.sub(r"\s+", " ", c.strip().lower())
        if book_ref and book_ref not in logged:
            R.warn("fact-check", f"[{c}] is cited in the VO but not in the fact-check log")
    if ep["onscreen"] and ep["title"] and not any(tokens(o["text"]) == tokens(ep["title"]) for o in ep["onscreen"] if o["section"] == "hook"):
        R.warn("title", "the hook's ON-SCREEN line differs from the title")
    if not ep["caption"].strip(): R.warn("caption", "## Caption is empty")
    if not R.failed and not [i for i in R.items if i["level"] == "WARN"]: R.ok("script", "all checks passed")
    return R, ep


# ----------------------------------------------------------------------------------------------- media helpers
def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def probe(video):
    r = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", video])
    if r.returncode: raise RuntimeError(r.stderr.strip()[:300])
    return json.loads(r.stdout)


def extract_audio(src, dst, sr=16000):
    r = run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vn", "-ac", "1", "-ar", str(sr), "-f", "wav", dst])
    return r.returncode == 0


def read_wav(path):
    import numpy as np
    with wave.open(path) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return a, w.getframerate()


def speech_segments(a, sr, min_sil=0.25, min_speech=0.12):
    """Energy VAD -> [(start, end)] in seconds."""
    import numpy as np
    hop = int(sr * 0.01)
    n = len(a) // hop
    if n == 0: return []
    e = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(e)
    thr = max(np.percentile(db, 95) - 30, np.percentile(db, 10) + 6)
    on = db > thr
    segs, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]: j += 1
            segs.append([i * 0.01, j * 0.01]); i = j
        else: i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_sil: merged[-1][1] = s[1]
        else: merged.append(s)
    return [(round(s, 2), round(e, 2)) for s, e in merged if e - s >= min_speech]


def parse_srt(path):
    txt = Path(path).read_text(encoding="utf-8-sig")
    out = []
    for block in re.split(r"\n\s*\n", txt.strip()):
        lines = [l for l in block.splitlines() if l.strip()]
        ti = next((k for k, l in enumerate(lines) if "-->" in l), None)
        if ti is None: continue
        def ts(s):
            h, m, rest = s.strip().replace(".", ",").split(":"); sec, ms = rest.split(",")
            return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms[:3].ljust(3, "0")) / 1000
        a, b = lines[ti].split("-->")
        out.append({"t": ts(a), "end": ts(b.split()[0]), "text": " ".join(lines[ti + 1:]).strip()})
    return out


# ----------------------------------------------------------------------------------------------- speech recognition
def ensure_asr(log):
    try:
        import sherpa_onnx  # noqa
    except ImportError:
        log("sherpa-onnx not installed (pip install sherpa-onnx); hearing check skipped"); return None
    found = list(ASR_DIR.glob("sherpa-onnx-zipformer-*/tokens.txt"))
    if not found:
        ASR_DIR.mkdir(parents=True, exist_ok=True)
        log("downloading the speech model (~110 MB, once)…")
        tmp = ASR_DIR / "m.tar.bz2"
        r = run(["curl", "-sSL", "--max-time", "600", "-o", str(tmp), ASR_URL])
        if r.returncode or not tmp.exists():
            log("speech model download failed; hearing check skipped"); return None
        run(["tar", "xjf", str(tmp), "-C", str(ASR_DIR)]); tmp.unlink(missing_ok=True)
        found = list(ASR_DIR.glob("sherpa-onnx-zipformer-*/tokens.txt"))
        if not found: return None
    m = found[0].parent
    import sherpa_onnx
    enc = next(iter(sorted(m.glob("encoder*int8.onnx"))), None) or next(iter(m.glob("encoder*.onnx")))
    dec = next(iter(sorted(m.glob("decoder*.onnx"))))
    joi = next(iter(sorted(m.glob("joiner*int8.onnx"))), None) or next(iter(m.glob("joiner*.onnx")))
    return sherpa_onnx.OfflineRecognizer.from_transducer(encoder=str(enc), decoder=str(dec), joiner=str(joi),
                                                         tokens=str(m / "tokens.txt"), num_threads=2,
                                                         decoding_method="greedy_search")


def transcribe(rec, a, sr, segs):
    """Recognize speech in chunks (split at pauses, <= ~18 s) -> [{w, t, end}]."""
    chunks, cur = [], None
    for s, e in segs:
        if cur is None: cur = [max(0, s - 0.15), e + 0.15]
        elif e - cur[0] > 18: chunks.append(cur); cur = [max(0, s - 0.15), e + 0.15]
        else: cur[1] = e + 0.15
    if cur: chunks.append(cur)
    words = []
    for c0, c1 in chunks:
        piece = a[int(c0 * sr): int(c1 * sr)]
        st = rec.create_stream(); st.accept_waveform(sr, piece); rec.decode_stream(st)
        r = st.result
        cur_w = None
        for tok, t in zip(r.tokens, r.timestamps):
            if tok.startswith(" ") or cur_w is None:
                if cur_w: words.append(cur_w)
                cur_w = {"w": tok.strip().lower(), "t": c0 + t, "end": c0 + t + 0.2}
            else:
                cur_w["w"] += tok.strip().lower(); cur_w["end"] = c0 + t + 0.2
        if cur_w: words.append(cur_w)
    for i in range(len(words) - 1):
        words[i]["end"] = min(words[i]["end"], words[i + 1]["t"])
    return words


# ----------------------------------------------------------------------------------------------- OCR
def ocr_words(img_bgr):
    """Bright text on a dark stage -> [{w, x, y, w_, h, conf}] in frame pixels."""
    import cv2, numpy as np
    g = img_bgr.max(axis=2)                                             # gold/cream glyphs are bright in some channel
    g = cv2.GaussianBlur(g, (3, 3), 0)
    thr = max(140, int(np.percentile(g, 92)))
    _, bw = cv2.threshold(g, thr, 255, cv2.THRESH_BINARY_INV)          # black text on white
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f: path = f.name
    cv2.imwrite(path, bw)
    r = run(["tesseract", path, "stdout", "--psm", "11", "tsv"])
    os.unlink(path)
    out = []
    for line in r.stdout.splitlines()[1:]:
        p = line.split("\t")
        if len(p) < 12 or not p[11].strip(): continue
        try: conf = float(p[10])
        except ValueError: continue
        if conf < 30: continue
        for w in tokens(p[11]):
            out.append({"w": w, "x": int(p[6]), "y": int(p[7]), "bw": int(p[8]), "bh": int(p[9]), "conf": conf})
    return out


def grab(video, t, w=None):
    import cv2, numpy as np
    vf = ["-vf", f"scale={w}:-2"] if w else []
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, t):.3f}", "-i", video, "-frames:v", "1", *vf, "-f", "image2pipe",
                        "-vcodec", "png", "-"], capture_output=True)
    if r.returncode or not r.stdout: return None
    return cv2.imdecode(np.frombuffer(r.stdout, np.uint8), cv2.IMREAD_COLOR)


def match_ratio(expected, found_words):
    exp = [w for w in tokens(expected) if len(w) >= 3 and w not in STOP] or tokens(expected)
    if not exp: return 1.0, []
    pool = list(found_words)
    hit, boxes = 0, []
    for w in exp:
        best = None
        for k, f in enumerate(pool):
            if f["w"] == w or (len(w) >= 3 and difflib.SequenceMatcher(None, f["w"], w).ratio() >= 0.67):
                best = k; break
        if best is not None:
            hit += 1; boxes.append(pool.pop(best))
    return hit / len(exp), boxes


def outside_safe(b, W, H):
    """-> {zone: px of intrusion}: bottom (caption/UI), right buttons (lower part), top (status bar), side margins."""
    z = {}
    if b["y"] + b["bh"] > H - SAFE["bottom"]: z["bottom zone"] = b["y"] + b["bh"] - (H - SAFE["bottom"])
    if b["y"] + b["bh"] > H * RIGHT_ZONE_FROM and b["x"] + b["bw"] > W - SAFE["right"]: z["right button column"] = b["x"] + b["bw"] - (W - SAFE["right"])
    elif b["x"] + b["bw"] > W - SAFE["side"]: z["right margin"] = b["x"] + b["bw"] - (W - SAFE["side"])
    if b["x"] < SAFE["side"]: z["left margin"] = SAFE["side"] - b["x"]
    if b["y"] < SAFE["top"]: z["top bar"] = SAFE["top"] - b["y"]
    return z


def safe_verdict(R, what, boxes, W, H, t):
    """FAIL when text clearly intrudes (> 12 px), WARN when it grazes the line. Returns the offending boxes."""
    zones, bad = {}, []
    for b in boxes:
        z = outside_safe(b, W, H)
        if z: bad.append(b)
        for k, v in z.items(): zones[k] = max(zones.get(k, 0), v)
    if zones:
        worst = max(zones.values())
        msg = f"{what} intrudes on the " + ", ".join(f"{k} by {v:.0f}px" for k, v in zones.items())
        (R.fail if worst > 12 else R.warn)("safe area", msg, t)
    return bad


# ----------------------------------------------------------------------------------------------- video QA
def video_qa(args):
    import cv2, numpy as np
    R = Report("video")
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    log = (lambda m: print("  ·", m, file=sys.stderr))
    video = args.video
    # ---- format
    try:
        info = probe(video)
    except Exception as e:
        R.fail("file", f"cannot read video: {e}"); return R
    vs = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    au = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"].get("duration", 0))
    W, H = int(vs["width"]), int(vs["height"])
    num, den = (vs.get("avg_frame_rate") or vs.get("r_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den or 1)
    R.facts.update({"file": Path(video).name, "size": f"{W}x{H}", "fps": f"{fps:.2f}", "duration": f"{dur:.2f}s",
                    "codec": vs.get("codec_name"), "audio": au.get("codec_name") if au else "none"})
    (R.ok if (W, H) == FRAME else R.fail)("format", f"frame {W}x{H} (want {FRAME[0]}x{FRAME[1]})")
    (R.ok if FPS_OK[0] <= fps <= FPS_OK[1] else R.warn)("format", f"{fps:.2f} fps (want 30)")
    if vs.get("codec_name") != "h264" or vs.get("pix_fmt") not in ("yuv420p", "yuvj420p"):
        R.warn("format", f"codec {vs.get('codec_name')}/{vs.get('pix_fmt')}; Instagram is safest with h264/yuv420p")
    if not (RUNTIME_HARD[0] <= dur <= RUNTIME_HARD[1]): R.fail("runtime", f"{dur:.1f}s (must be {RUNTIME_HARD[0]}–{RUNTIME_HARD[1]}s)")
    elif not (RUNTIME_TARGET[0] <= dur <= RUNTIME_TARGET[1]): R.warn("runtime", f"{dur:.1f}s (target {RUNTIME_TARGET[0]}–{RUNTIME_TARGET[1]}s)")
    else: R.ok("runtime", f"{dur:.1f}s")
    if not au: R.fail("audio", "no audio track")
    sx, sy = W / FRAME[0], H / FRAME[1]
    global SAFE
    SAFE = {k: v * (sy if k in ("top", "bottom") else sx) for k, v in SAFE.items()}

    # ---- loudness
    if au:
        r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-map", "0:a:0", "-af", "ebur128=peak=true", "-f", "null", "-"])
        I = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr); P = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
        if I:
            lufs = float(I[-1]); R.facts["loudness"] = f"{lufs:.1f} LUFS"
            (R.ok if LUFS_RANGE[0] <= lufs <= LUFS_RANGE[1] else R.warn)("loudness", f"{lufs:.1f} LUFS integrated (target {LUFS_RANGE[0]:.0f} to {LUFS_RANGE[1]:.0f})")
        if P:
            pk = float(P[-1]); R.facts["true peak"] = f"{pk:.1f} dBTP"
            (R.ok if pk <= TRUE_PEAK_MAX else R.fail)("loudness", f"true peak {pk:.1f} dBTP (max {TRUE_PEAK_MAX})")

    # ---- motion: stillness, cuts, black, loop
    cap = cv2.VideoCapture(video)
    step = max(1, int(round(fps / 10)))
    prev, diffs, times, k = None, [], [], 0
    first = last = None
    while True:
        okf, frame = cap.read()
        if not okf: break
        if first is None: first = frame.copy()
        last = frame
        if k % step == 0:
            g = cv2.cvtColor(cv2.resize(frame, (270, 480), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
            if prev is not None:
                diffs.append(float(np.abs(g - prev).mean())); times.append(k / fps)
            prev = g
        k += 1
    cap.release()
    diffs = np.array(diffs); times = np.array(times); dt = step / fps
    def runs(mask):
        out, i = [], 0
        while i < len(mask):
            if mask[i]:
                j = i
                while j < len(mask) and mask[j]: j += 1
                out.append((float(times[i] - dt), float(times[j - 1] - times[i] + dt))); i = j
            else: i += 1
        return out
    if len(diffs):
        frozen = [(t0, s) for t0, s in runs(diffs < 0.01) if s >= 0.5]
        still = [(t0, s) for t0, s in runs(diffs < 0.05) if s > MAX_STILL]
        for t0, s in frozen: R.fail("motion", f"frame frozen for {s:.1f}s (render stalled or a duplicated frame range)", t0)
        for t0, s in still:
            if not any(f0 <= t0 + 0.2 and t0 + s <= f0 + fs + 0.2 for f0, fs in frozen):
                R.warn("motion", f"nearly still for {s:.1f}s (max {MAX_STILL}s; only the turn may hold)", t0)
        if not frozen and not still: R.ok("motion", f"something moves in every stretch longer than {MAX_STILL}s")
        med = float(np.median(diffs)) + 1e-6
        cuts = [float(times[i]) for i in range(len(diffs)) if diffs[i] > max(4.0, med * 10)]
        merged = []
        for c in cuts:
            if not merged or c - merged[-1] > 0.5: merged.append(c)
        R.facts["visual changes"] = len(merged)
        bounds = [0.0] + merged + [dur]
        for a_, b_ in zip(bounds, bounds[1:]):
            if b_ - a_ > MAX_SCENE_GAP:
                R.warn("pacing", f"no hard visual change for {b_ - a_:.1f}s (playbook: new scene every 4–6s; soft dissolves may not register)", a_)
    r = run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-vf", "blackdetect=d=0.6:pix_th=0.06", "-an", "-f", "null", "-"])
    for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", r.stderr):
        R.warn("black", f"{float(m.group(2)) - float(m.group(1)):.1f}s of black", float(m.group(1)))
    if first is not None and last is not None:
        a1 = cv2.cvtColor(cv2.resize(first, (270, 480)), cv2.COLOR_BGR2GRAY).astype(np.float32)
        a2 = cv2.cvtColor(cv2.resize(last, (270, 480)), cv2.COLOR_BGR2GRAY).astype(np.float32)
        corr = float(np.corrcoef(a1.ravel(), a2.ravel())[0, 1]) if a1.std() > 0 and a2.std() > 0 else 0.0
        R.facts["first/last frame match"] = f"{corr:.2f}"
        (R.ok if corr >= 0.75 else R.warn)("loop", f"last frame vs first frame similarity {corr:.2f} (want ≥ 0.75 so the replay loops)")
        side = np.hstack([cv2.resize(first, (360, 640)), np.full((640, 12, 3), 255, np.uint8), cv2.resize(last, (360, 640))])
        cv2.imwrite(str(out / "firstlast.png"), side)

    # ---- script + captions
    ep = parse_script(args.script) if args.script else None
    subs = parse_srt(args.subs) if args.subs else []
    script_tok = tokens(vo_text(ep)) if ep else []
    if not subs:
        R.fail("captions", "no captions (.srt) given — captions are required")
    else:
        R.facts["caption chunks"] = len(subs)
        for i, s in enumerate(subs):
            n = len(tokens(s["text"])); d = s["end"] - s["t"]
            if n > CAPTION_MAX_WORDS: R.warn("captions", f"{n} words in one chunk (max {CAPTION_MAX_WORDS}): '{s['text']}'", s["t"])
            if d < CAPTION_MIN_DUR: R.warn("captions", f"on screen only {d:.2f}s: '{s['text']}'", s["t"])
            if d > 0 and len(s["text"]) / d > CAPTION_MAX_CPS: R.warn("captions", f"{len(s['text']) / d:.0f} characters/s, too fast to read: '{s['text']}'", s["t"])
            if i and s["t"] < subs[i - 1]["end"] - 0.02: R.fail("captions", f"overlaps the previous chunk: '{s['text']}'", s["t"])
            if s["end"] > dur + 0.05: R.fail("captions", f"runs past the end of the video: '{s['text']}'", s["t"])
        cap_tok = [w for s in subs for w in tokens(s["text"])]
        if script_tok:
            sm = difflib.SequenceMatcher(None, script_tok, cap_tok, autojunk=False)
            bad = 0
            # map caption word index -> chunk
            owner = [ci for ci, s in enumerate(subs) for _ in tokens(s["text"])]
            for op, a0, a1, b0, b1 in sm.get_opcodes():
                if op == "equal": continue
                bad += 1
                t = subs[owner[min(b0, len(owner) - 1)]]["t"] if owner else None
                said, shown = " ".join(script_tok[a0:a1]) or "∅", " ".join(cap_tok[b0:b1]) or "∅"
                R.fail("captions = script", f"script says '{said}', captions show '{shown}'", t)
            if not bad: R.ok("captions = script", f"all {len(cap_tok)} caption words match the script")

    # ---- hearing the voiceover
    tmpd = Path(tempfile.mkdtemp())
    wav = str(tmpd / "vo.wav")
    if not extract_audio(args.vo_audio or video, wav):
        R.warn("voice", "could not extract audio for the hearing check")
    else:
        a, sr = read_wav(wav)
        segs = speech_segments(a, sr)
        R.facts["speech starts"] = f"{segs[0][0]:.2f}s" if segs else "no speech found"
        if not segs: R.fail("voice", "no speech detected in the audio")
        else:
            if segs[0][0] > 0.6: R.warn("voice", f"the first word starts at {segs[0][0]:.2f}s; the hook should start immediately", segs[0][0])
            tail = dur - segs[-1][1]
            if tail < 0.3: R.warn("voice", f"speech ends {tail:.2f}s before the video ends; leave a beat for the loop", segs[-1][1])
            if subs:
                for s in subs:
                    ov = sum(max(0, min(s["end"], e) - max(s["t"], b)) for b, e in segs)
                    if ov < 0.05 and s["end"] - s["t"] > 0.3:
                        R.fail("sync", f"caption shown while nobody is speaking: '{s['text']}'", s["t"])
        rec = None if args.no_asr else ensure_asr(log)
        if rec is None:
            R.warn("hearing", "speech recognition unavailable: words and caption timing checked only against speech activity")
        elif segs:
            heard = transcribe(rec, a, sr, segs)
            R.facts["words heard"] = len(heard)
            (out / "heard.json").write_text(json.dumps(heard, indent=1))
            sp_tok = tokens(vo_text(ep), spell_numbers=True) if ep else []
            h_tok = [w["w"] for w in heard]
            if sp_tok and h_tok:
                sm = difflib.SequenceMatcher(None, sp_tok, h_tok, autojunk=False)
                matched = sum(b.size for b in sm.get_matching_blocks())
                ratio = matched / len(sp_tok)
                R.facts["voice matches script"] = f"{ratio:.0%} of words heard as written"
                if ratio < 0.6: R.fail("voice = script", f"only {ratio:.0%} of the script was heard; wrong or out-of-date voiceover?")
                elif ratio < 0.85: R.warn("voice = script", f"{ratio:.0%} of script words heard as written; listen to the spots below")
                else: R.ok("voice = script", f"{ratio:.0%} of script words heard as written")
                for op, a0, a1, b0, b1 in sm.get_opcodes():
                    if op == "equal" or (a1 - a0) < 2 and op != "delete": continue
                    t = heard[min(b0, len(heard) - 1)]["t"]
                    R.warn("listen here", f"script '{' '.join(sp_tok[a0:a1]) or '∅'}' / heard '{' '.join(h_tok[b0:b1]) or '∅'}' "
                                          "(names and numbers often mishear; check pronunciation)", t)
                # caption sync: caption chunk -> script word -> heard time
                if subs:
                    sp_time = {}
                    for blk in sm.get_matching_blocks():
                        for k2 in range(blk.size): sp_time[blk.a + k2] = heard[blk.b + k2]["t"]
                    cap_tok_n = [tokens(s["text"], spell_numbers=True) for s in subs]
                    flat = [(ci, w) for ci, ws in enumerate(cap_tok_n) for w in ws]
                    sm2 = difflib.SequenceMatcher(None, [w for _, w in flat], sp_tok, autojunk=False)
                    cap_to_sp = {}
                    for blk in sm2.get_matching_blocks():
                        for k2 in range(blk.size): cap_to_sp[blk.a + k2] = blk.b + k2
                    offsets, idx = [], 0
                    for ci, ws in enumerate(cap_tok_n):
                        first_idx = idx; idx += len(ws)
                        cand = [j for j in range(first_idx, min(first_idx + 2, idx)) if j in cap_to_sp and cap_to_sp[j] in sp_time]
                        if not cand: continue
                        j = cand[0]
                        spoken = sp_time[cap_to_sp[j]] - (0.25 if j > first_idx else 0)
                        off = subs[ci]["t"] - spoken
                        offsets.append(off)
                        if abs(off) > SYNC_FAIL: R.fail("sync", f"caption '{subs[ci]['text']}' is {off:+.2f}s off the voice", subs[ci]["t"])
                        elif abs(off) > SYNC_WARN: R.warn("sync", f"caption '{subs[ci]['text']}' is {off:+.2f}s off the voice", subs[ci]["t"])
                    if offsets:
                        med = float(np.median(offsets))
                        R.facts["caption timing"] = f"median {med:+.2f}s vs voice ({len(offsets)} chunks measured)"
                        if abs(med) > 0.15: R.warn("sync", f"all captions run {med:+.2f}s off on average: shift the whole track")
                        if not any(i["check"] == "sync" and i["level"] != "PASS" for i in R.items):
                            R.ok("sync", f"captions within {SYNC_WARN}s of the voice")
    shutil.rmtree(tmpd, ignore_errors=True)

    # ---- on-screen text (OCR): title at frame one, captions drawn and in the safe area, verse cards, safe sweep
    shots = []
    have_ocr = shutil.which("tesseract") is not None
    if not have_ocr:
        R.warn("on-screen text", "tesseract not installed: title, caption-on-screen, verse-card and safe-area checks skipped (look at sheet.png)")
    def note_shot(t, img, boxes, label):
        if len(shots) < 12: shots.append((t, img, boxes, label))
    if have_ocr and ep and ep["title"]:
        title_on = [o["text"] for o in ep["onscreen"] if o["section"] == "hook"] or [ep["title"]]
        f0 = grab(video, 0.0)
        if f0 is not None:
            ratio, boxes = match_ratio(title_on[0], ocr_words(f0))
            if ratio >= 0.6: R.ok("title", f"title readable in frame one ({ratio:.0%} of its words read back)")
            else:
                R.fail("title", f"title not readable in frame one (only {ratio:.0%} of '{title_on[0]}' read back)", 0.0)
                note_shot(0.0, f0, [], "title not readable")
            unsafe = safe_verdict(R, "the title", boxes, W, H, 0.0)
            if unsafe: note_shot(0.0, f0, unsafe, "title outside safe area")
    seen_text = []
    for s in (subs if have_ocr else []):
        tm = (s["t"] + s["end"]) / 2
        img = grab(video, tm)
        if img is None: continue
        words = ocr_words(img); seen_text.append((tm, words))
        band = [w for w in words if w["y"] > H * 0.4]                     # captions live in the lower part of the frame
        ratio, boxes = match_ratio(s["text"], band)
        if ratio < 0.5:
            ratio, boxes = match_ratio(s["text"], words)
        if ratio < 0.5:
            R.warn("captions on screen", f"caption hard to read or missing on screen ({ratio:.0%} read back): '{s['text']}'", tm)
            note_shot(tm, img, boxes, "caption hard to read")
        unsafe = safe_verdict(R, f"caption '{s['text']}'", boxes, W, H, tm)
        if unsafe: note_shot(tm, img, unsafe, "caption outside safe area")
    for tm in (np.arange(0.5, dur, 1.0) if have_ocr else []):
        img = grab(video, float(tm))
        if img is None: continue
        words = ocr_words(img); seen_text.append((float(tm), words))
        unsafe = [b for b in words if outside_safe(b, W, H) and b["conf"] > 70 and len(b["w"]) > 2]
        if unsafe:
            z = sorted({k for b in unsafe for k in outside_safe(b, W, H)})
            R.warn("safe area", f"text '{' '.join(b['w'] for b in unsafe[:4])}' in the {', '.join(z)}", float(tm))
            note_shot(float(tm), img, unsafe, "text near the edge")
    if ep and have_ocr:
        for v in ep["verses"]:
            quote = re.findall(r'"([^"]+)"', clean_text(v["text"]))
            if not quote: continue
            best, best_t = 0.0, None
            for tm, words in seen_text:
                r_, _ = match_ratio(quote[0], words)
                if r_ > best: best, best_t = r_, tm
            if best >= 0.8: R.ok("verse card", f"verse found on screen ({best:.0%} of words) at {best_t:.1f}s")
            else: R.warn("verse card", f"verse text not found intact on screen (best {best:.0%}): check spelling against the ESV — \"{quote[0][:60]}\"", best_t)

    # ---- sheets for visual review
    cols, tw, th = 6, 180, 320
    ts = list(np.arange(0.0, dur, 1.0))
    rows_n = (len(ts) + cols - 1) // cols
    sheet = np.full((rows_n * (th + 24), cols * tw, 3), 20, np.uint8)
    for n, tm in enumerate(ts):
        img = grab(video, float(tm), w=tw)
        if img is None: continue
        img = cv2.resize(img, (tw, th))
        r0, c0 = (n // cols) * (th + 24), (n % cols) * tw
        sheet[r0 + 24: r0 + 24 + th, c0: c0 + tw] = img
        cv2.putText(sheet, f"{tm:.0f}s", (c0 + 6, r0 + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
    cv2.imwrite(str(out / "sheet.png"), sheet)
    if shots:
        tiles = []
        for tm, img, boxes, label in shots:
            im = img.copy()
            cv2.rectangle(im, (int(SAFE["side"]), int(SAFE["top"])), (int(W - SAFE["side"]), int(H - SAFE["bottom"])), (80, 200, 80), 4)
            for b in boxes: cv2.rectangle(im, (b["x"] - 6, b["y"] - 6), (b["x"] + b["bw"] + 6, b["y"] + b["bh"] + 6), (40, 40, 255), 6)
            im = cv2.resize(im, (360, 640))
            cv2.rectangle(im, (0, 0), (360, 34), (0, 0, 0), -1)
            cv2.putText(im, f"{tm:.1f}s {label}", (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            tiles.append(im)
        while len(tiles) % 4: tiles.append(np.full((640, 360, 3), 20, np.uint8))
        grid = np.vstack([np.hstack(tiles[i:i + 4]) for i in range(0, len(tiles), 4)])
        cv2.imwrite(str(out / "issues.png"), grid)
    return R


# ----------------------------------------------------------------------------------------------- CLI
def main():
    ap = argparse.ArgumentParser(description="Fourth Watch QA checker")
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("script"); s.add_argument("script"); s.add_argument("--out", default="qa/script"); s.add_argument("--wpm", type=float, default=150)
    v = sub.add_parser("video")
    v.add_argument("--video", required=True); v.add_argument("--script"); v.add_argument("--subs")
    v.add_argument("--vo-audio"); v.add_argument("--out", default="qa/video"); v.add_argument("--no-asr", action="store_true")
    v.add_argument("--wpm", type=float, default=150)
    a = ap.parse_args()
    try:
        if a.cmd == "script":
            R, _ = lint_script(a.script, a.wpm)
        else:
            R = video_qa(a)
    except Exception as e:
        print(f"checker error: {e}", file=sys.stderr); sys.exit(2)
    data = R.write(a.out)
    print((Path(a.out) / "report.md").read_text())
    sys.exit(1 if R.failed else 0)


if __name__ == "__main__":
    main()
