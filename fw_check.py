#!/usr/bin/env python3
"""Fourth Watch QA checker.

  python3 fw_check.py script  episode.md [--judge <run>]    -> lint a script before approval (+ the judge panel's verdict)
  python3 fw_check.py video   --video out/ep.mp4 --script episode.md --subs out/ep.srt [--out qa/]
                              [--vo-audio out/voice.wav] [--no-asr] [--wpm 150]

Exit code 0 = no FAIL, 1 = at least one FAIL, 2 = could not run.
Writes report.json + report.md (and for video: sheet.png, issues.png, firstlast.png) to --out.

Needs: python3, numpy, Pillow, opencv-python, ffmpeg/ffprobe, tesseract (CLI).
Optional: sherpa-onnx (pip) + an English zipformer model for hearing the voiceover; downloaded from
GitHub into ~/.cache/fourth-watch/ on first use. Without it, sync falls back to speech-activity checks.
"""
import argparse, difflib, hashlib, json, os, re, shutil, subprocess, sys, tempfile, wave
from pathlib import Path

# ----------------------------------------------------------------------------------------------- config
SERIES = ["FOURTH WATCH", "MOST PEOPLE MISS", "ASK THE TEXT", "STRANGE BUT TRUE", "MISQUOTED"]  # HERO OR VILLAIN? retired 2026-10-28: a verdict is an opinion
# FOURTH WATCH (Round 74, EDITORIAL.md): a story that meets a real struggle. Free sections, no fixed hook form, no Value quota;
# the writer must state the message and Relate / Reveal / Transform. The other four keep their older fixed formats.
FLEX_SERIES = {"FOURTH WATCH"}
NON_VO_SECTIONS = {"caption", "references", "value", "factcheck"}
SECTIONS = ["hook", "stakes", "story", "turn", "landing"]
REF_REQUIRED = {"story", "turn"}                     # every VO line here must carry [Book c:v]
RUNTIME_HARD = (30, 60)                              # seconds: outside = FAIL (default, unknown series)
RUNTIME_TARGET = (35, 55)                            # seconds: outside = WARN (default)
# Per-series limits, from the Oct 28, 2026 reel study: hard-question explainers that answer from Scripture
# ran 84-137 s on The Lintel Network (174K-7.4M views); short list/fact formats ran 22-75 s.
SERIES_LIMITS = {
    "FOURTH WATCH":     {"hard": (40, 150), "target": (60, 125), "cards": 4},   # Round 74: length earned, about 2 min when justified
    "ASK THE TEXT":     {"hard": (45, 150), "target": (85, 135), "cards": 4},   # Oct 31 study: hits ran 84-137 s
    "MOST PEOPLE MISS": {"hard": (25, 75),  "target": (30, 60),  "cards": 3},
    "STRANGE BUT TRUE": {"hard": (20, 75),  "target": (25, 60),  "cards": 2},
    "MISQUOTED":        {"hard": (20, 75),  "target": (25, 60),  "cards": 2},
}
# Narration style per series, from the same study: Lintel's two top reels read ~180-190 wpm (266 words in 89 s,
# ~250 in 80 s) in flowing sentences of up to ~28 words ("He knew every WAR and every SICKNESS that would follow,
# and still He left the tree ... standing in the middle of EDEN").
# Oct 31 study (research/direction_rules.md): the three hits read 2.6-3.0 words/s (156-180 wpm); the two slowest
# videos (1.75-1.8 words/s) were both low performers. 170 wpm is the planning pace.
SERIES_STYLE = {"ASK THE TEXT": {"wpm": 170, "sentence": 25}, "FOURTH WATCH": {"wpm": 160, "sentence": 25}}
def style(series):
    d = SERIES_STYLE.get((series or "").strip().upper(), {})
    return d.get("wpm", 150), d.get("sentence", MAX_SENTENCE_WORDS)
def limits(series):
    d = SERIES_LIMITS.get((series or "").strip().upper())
    return (d["hard"], d["target"], d["cards"]) if d else (RUNTIME_HARD, RUNTIME_TARGET, 2)
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
# Round 74 (EDITORIAL.md, "How we write"): empty inspirational phrases, telling viewers what to feel, and stock church phrases.
EMPTY_PHRASES = [r"\bchanges everything\b", r"\bblow your mind\b", r"\bmind[- ]blowing\b", r"\byou won'?t believe\b", r"\bwill (?:shock|surprise) you\b",
                 r"\bmore than you (?:think|realize)\b", r"\bthe truth is\b", r"\blife[- ]changing\b", r"\bnever be the same\b", r"\bpowerful truth\b",
                 r"\bgame[- ]changer\b", r"\bplot twist\b", r"\bit gets (?:better|worse)\b"]
FEELING_TELLS = [r"\byou (?:should|will|must|might) feel\b", r"\bimagine how (?:he|she|they) (?:felt|must have felt)\b", r"\bisn'?t that (?:amazing|incredible|beautiful)\b",
                 r"\bhow (?:amazing|incredible|beautiful|powerful) is that\b", r"\blet that sink in\b"]
STOCK_CHURCH = [r"\bcalling you back\b", r"\bgod has a plan for your life\b", r"\blet go and let god\b", r"\bgod is calling you\b", r"\bget right with god\b"]
MAX_QUESTIONS = 3                                    # spoken questions outside quotes before it reads as repetitive
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
    """Fourth Watch script format (the writer skill's templates.md). FOURTH WATCH scripts: '# Title', 'series:', 'message:',
    'relate:', 'reveal:', 'transform:', optional 'claims:', then sections with any names. Older series: 'answer:', '## Hook' ... sections with
    'VO:' / 'VERSE:' / 'ON-SCREEN:' / 'VISUAL:' lines, '## Value' list, '## Caption', '## References',
    '## Fact-check log' table."""
    text = Path(path).read_text()
    ep = {"title": None, "series": None, "target_seconds": None, "answer": None, "message": None, "relate": None, "reveal": None,
          "transform": None, "claims": None, "sections": {}, "vo": [], "verses": [],
          "onscreen": [], "visuals": [], "value": [], "caption": "", "references": [], "factcheck": [], "raw": text}
    cur = None
    for raw in text.splitlines():
        line = raw.strip()
        if not line: continue
        if line.startswith("# ") and ep["title"] is None:
            ep["title"] = line[2:].strip(); continue
        m = re.match(r"^(series|target_seconds|answer|message|relate|reveal|transform|claims)\s*:\s*(.+)$", line, re.I)
        if m and cur is None:
            ep[m.group(1).lower()] = m.group(2).strip(); continue
        if line.startswith("## "):
            cur = line[3:].strip().lower().replace("-", " ")
            cur = {"fact check log": "factcheck", "factcheck log": "factcheck"}.get(cur, cur)
            ep["sections"].setdefault(cur, []); continue
        if cur is None: continue
        ep["sections"][cur].append(line)
        m = re.match(r"^(VO|VERSE|ON-SCREEN|ONSCREEN|VISUAL)\s*:\s*(.*)$", line, re.I)
        flex = (ep["series"] or "").strip().upper() in FLEX_SERIES
        if m and (cur in SECTIONS or cur == "question" or (flex and cur not in NON_VO_SECTIONS)):  # "## Question": an optional closing question
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
def lint_script(path, wpm=None):
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
    flex = series in FLEX_SERIES
    locked = Path(path).name.startswith("script_approved")
    if flex:
        story_contract(R, ep, path, locked)
    for s in ([] if flex else SECTIONS):
        if not any(v["section"] == s for v in ep["vo"]): R.fail("structure", f"section '{s}' has no VO line")
    if flex and not ep["vo"]: R.fail("structure", "no VO lines")
    if ep["vo"] and ep["title"] and not flex:
        if tokens(strip_refs(ep["vo"][0]["text"])) != tokens(ep["title"]):
            R.fail("hook", f"first VO line must equal the title word for word: '{strip_refs(ep['vo'][0]['text'])}' vs '{ep['title']}'")
        else: R.ok("hook", "first VO line equals the title")
    # length
    swpm, max_sent = style(series)
    wpm = wpm or swpm
    words = tokens(vo_text(ep), spell_numbers=True)
    secs = len(words) / wpm * 60
    R.facts.update({"title": ep["title"], "series": series, "VO words": len(words), "estimated runtime": f"{secs:.1f}s at {wpm} wpm"})
    HARD, TARGET, _cards = limits(series)
    if not (HARD[0] <= secs <= HARD[1]): R.fail("runtime", f"estimated {secs:.0f}s; must be {HARD[0]}–{HARD[1]}s for {series}")
    elif not (TARGET[0] <= secs <= TARGET[1]): R.warn("runtime", f"estimated {secs:.0f}s; target {TARGET[0]}–{TARGET[1]}s for {series}")
    else: R.ok("runtime", f"estimated {secs:.0f}s")
    # line rules
    for v in ep["vo"]:
        t, sec = v["text"], v["section"]
        plain = strip_refs(t)
        if not flex and sec in REF_REQUIRED and not re.search(r"\[[^\]]*\d+:\d+[^\]]*\]", t):
            R.fail("reference", f"{sec} line has no [Book chapter:verse]: '{plain[:70]}'")
        verse_toks = [" ".join(tokens(v["text"].split("—")[0])) for v in ep["verses"]]
        for s in sentences(plain):
            n = len(tokens(s))
            read_aloud = n > max_sent and any(" ".join(tokens(s)) in vt for vt in verse_toks)
            if n > max_sent and not read_aloud:
                R.warn("sentence length", f"{n} words (max {max_sent}): '{s[:80]}'")
        low = plain.lower()
        if any(re.search(pat, low) for pat in CTA):
            R.fail("call to action", f"calls to action belong in the caption, not the VO: '{plain[:70]}'")
        for w in OVERCLAIM:
            if any(w in vt.split() and re.search(r"\b" + w + r"\b", vt) for vt in verse_toks) and re.search(r'["\u201c][^"\u201d]*\b' + w + r'\b[^"\u201d]*["\u201d]', plain, re.I):
                continue
            if re.search(r"\b" + re.escape(w) + r"\b", low):
                R.warn("overclaim", f"'{w}' — make sure the text really says this: '{plain[:80]}'")
        for w in OUTSIDE:
            if re.search(r"\b" + re.escape(w) + r"\b", low):
                R.warn("outside source", f"'{w}' — must be labeled as outside the Bible: '{plain[:80]}'")
        if '"' in clean_text(plain) and not re.search(r"\[[^\]]*\d+:\d+", t):
            R.warn("dialogue", f"quoted words with no reference (invented dialogue?): '{plain[:80]}'")
    if flex and ep["vo"] and not any(re.search(r"\[[^\]]*\d+:\d+", v["text"]) for v in ep["vo"]):
        R.fail("reference", "no VO line carries a [Book chapter:verse]: every biblical event or quote needs its reference")
    # verses
    if not ep["verses"]:
        (R.warn if flex else R.fail)("verse", "no VERSE: line" + (" (verse cards can live in the plan; check they're exact ESV)" if flex else " (one ESV quote with reference is required)"))
    for v in ep["verses"]:
        t = v["text"]
        if "esv" not in t.lower(): R.fail("verse", f"VERSE must be marked (ESV): '{t[:80]}'")
        if not re.search(r"\d+:\d+", t): R.fail("verse", f"VERSE has no chapter:verse reference: '{t[:80]}'")
        for tr in TRANSLATIONS:
            if re.search(r"\b" + tr + r"\b", t.lower()):
                R.warn("translation", f"{tr.upper()} quoted on screen; ESV only unless the episode is about that wording")
    _h, _t, max_cards = limits(ep.get("series"))
    if len(ep["verses"]) > max_cards: R.warn("verse", f"{len(ep['verses'])} verse cards; the playbook allows up to {max_cards} for {ep.get('series')}")
    # the episode answers its own question
    if flex:
        pass  # story_contract() checked the message line
    elif not ep.get("answer"):
        R.fail("answer", "no 'answer:' line: write the one-sentence answer this episode gives to its title question")
    if ep["vo"]:
        body = [v for v in ep["vo"] if v["section"] != "question"] or ep["vo"]
        last = (sentences(strip_refs(body[-1]["text"])) or [""])[-1]
        if last.rstrip().endswith("?"):
            if flex:
                R.warn("ending", f"ends on a question ('{last[:70]}'): fine if the story has already answered what it raised and nobody feels accused (EDITORIAL.md)")
            else:
                R.fail("answer", f"the episode ends on a question ('{last}'); the landing must state the answer")
    if ep.get("answer") and not flex:
        key = {w for w in tokens(ep["answer"]) if w not in STOP and len(w) > 2}
        late = {w for v in ep["vo"] if v["section"] in ("turn", "landing") for w in tokens(strip_refs(v["text"]))}
        hit = len(key & late) / max(1, len(key))
        if hit < 0.5:
            R.fail("answer", f"the Turn/Landing voiceover never states the answer line ({hit:.0%} of its key words): '{ep['answer']}'")
        else: R.ok("answer", f"answer stated in the Turn/Landing: '{ep['answer']}'")
    # the viewer learns something
    vals = ep.get("value", [])
    if flex:
        pass  # no quota (Rounds 41 and 74); any Value items listed must still be spoken
    elif len(vals) < 3:
        R.fail("value", f"## Value lists {len(vals)} thing(s) the viewer learns; at least 3 are required, each with a verse")
    for item in vals:
        if not re.search(r"\[[^\]]*\d+:\d+[^\]]*\]", item):
            R.fail("value", f"value item has no [Book chapter:verse]: '{item[:70]}'")
    vo_lines = [strip_refs(v["text"]) for v in ep["vo"]]
    spoken = [i for i in vals if value_spoken(i, vo_lines)]
    for item in vals:
        if item not in spoken:
            R.warn("value", f"this Value item is never spoken in the VO, so the viewer never learns it: '{strip_refs(item)[:80]}'")
    if not flex and len(vals) >= 3 and len(spoken) < 3:
        R.fail("value", f"only {len(spoken)} of the {len(vals)} Value items are actually said in the VO; at least 3 must be")
    if len(spoken) >= 3 and all(re.search(r"\[[^\]]*\d+:\d+[^\]]*\]", i) for i in vals):
        R.ok("value", f"{len(spoken)} things the viewer learns, each with a verse and each said in the VO")
    # landing echoes the hook
    land = [strip_refs(v["text"]) for v in ep["vo"] if v["section"] == "landing"]
    if land and ep["title"] and not flex:
        a = {w for w in tokens(land[-1]) if w not in STOP}
        b = {w for w in tokens(ep["title"]) if w not in STOP}
        if not a & b: R.warn("loop", "the last VO line shares no key word with the hook; the loop line should echo it")
        else: R.ok("loop", "landing echoes the hook")
    # structure measured on 13 Lintel Shorts (research/script_rules_from_hits.md, Oct 31): estimates from word position
    if ep["vo"] and not flex:
        script_shape(R, ep, secs)
    elif ep["vo"]:
        lines = [(v["section"], strip_refs(v["text"])) for v in ep["vo"]]
        counts = [len(tokens(t_, spell_numbers=True)) for _, t_ in lines]
        total = max(1, sum(counts)); starts = [sum(counts[:i]) / total for i in range(len(lines))]
        kw = lambda t_: {w for w in tokens(t_) if w not in STOP and len(w) > 2}
        value_density(R, ep, lines, starts, kw(lines[0][1]), kw)
        msg = ep.get("message") or ep.get("answer")
        if msg:
            mk = kw(msg); late = {w for (_, t_), st in zip(lines, starts) if st >= 0.6 for w in kw(t_)}
            hit = len(mk & late) / max(1, len(mk))
            (R.ok if hit >= 0.5 else R.warn)("message", f"{hit:.0%} of the message's key words are said in the last 40% of the narration" +
                                             ("" if hit >= 0.5 else ": make sure the ending lands the message"))
    if ep["vo"]:
        writing_checks(R, ep)
    # references + fact-check log
    cited = set(re.findall(r"\[([^\]]+)\]", " ".join(v["text"] for v in ep["vo"])))
    if not ep["references"]:
        (R.warn if flex else R.fail)("references", "## References is empty" + (" (the VO references stand in for it)" if flex else ""))
    claims_file = None
    if ep.get("claims"):
        for base in (Path(path).parent, Path(path).parent.parent, Path(__file__).resolve().parent):
            if (base / ep["claims"]).exists(): claims_file = base / ep["claims"]; break
    if not ep["factcheck"] and claims_file:
        R.ok("fact-check", f"claims are in {ep['claims']}: check every row is verified")
    elif not ep["factcheck"] and flex and locked:
        R.warn("fact-check", "no ## Fact-check log or claims: file (a locked script: record the claims beside it, never edit the narration)")
    elif not ep["factcheck"]: R.fail("fact-check", "## Fact-check log is empty and no claims: file is named: every claim needs a row")
    for row in ep["factcheck"]:
        status = (row[-1] if row else "").lower()
        if not re.search(r"verified|checked|✓|pass", status):
            R.fail("fact-check", f"claim not verified: '{row[0][:70]}' (status: '{row[-1] if row else ''}')")
    logged = " ".join(" ".join(r) for r in ep["factcheck"]).lower()
    for c in (cited if ep["factcheck"] else []):
        book_ref = re.sub(r"\s+", " ", c.strip().lower())
        if book_ref and book_ref not in logged:
            R.warn("fact-check", f"[{c}] is cited in the VO but not in the fact-check log")
    if ep["onscreen"] and ep["title"] and not any(tokens(o["text"]) == tokens(ep["title"]) for o in ep["onscreen"] if o["section"] == "hook"):
        R.warn("title", "the hook's ON-SCREEN line differs from the title")
    if not ep["caption"].strip(): R.warn("caption", "## Caption is empty")
    if not R.failed and not [i for i in R.items if i["level"] == "WARN"]: R.ok("script", "all checks passed")
    return R, ep


def story_contract(R, ep, path, locked):
    """FOURTH WATCH (Round 74): the writer states the message and Relate / Reveal / Transform in one line each. The checker can
    only see that they exist. Whether they're true of the script is the approval questions' job (EDITORIAL.md)."""
    missing = [k for k in ("message", "relate", "reveal", "transform") if not ep.get(k)]
    if ep.get("answer") and "message" in missing: missing.remove("message")
    if missing:
        msg = f"missing header line(s): {', '.join(k + ':' for k in missing)} (EDITORIAL.md: say in one line each what the viewer recognizes, discovers and takes away)"
        if locked: R.warn("story", msg + ". This is a locked script: add them beside it, never edit its narration")
        else: R.fail("story", msg)
    else: R.ok("story", "message, relate, reveal and transform are stated")


def writing_checks(R, ep):
    """Round 74, "How we write": few rhetorical questions, no empty inspirational phrases, no telling the viewer what to feel."""
    def unq(t_): return re.sub(r'["\u201c][^"\u201d]*["\u201d]', " ", clean_text(t_))
    qs = [s for v in ep["vo"] for s in sentences(unq(strip_refs(v["text"]))) if s.rstrip().endswith("?")]
    (R.ok if len(qs) <= MAX_QUESTIONS else R.warn)("questions", f"{len(qs)} spoken questions outside quotes" +
        ("" if len(qs) <= MAX_QUESTIONS else f" (more than {MAX_QUESTIONS}): avoid repetitive rhetorical questions; keep the ones that open the story or turn it"))
    found = False
    for v in ep["vo"]:
        low = unq(strip_refs(v["text"])).lower()
        for pats, name, why in ((EMPTY_PHRASES, "empty phrase", "says it's profound instead of showing it"),
                                (FEELING_TELLS, "telling feelings", "let the events create the emotion"),
                                (STOCK_CHURCH, "stock phrase", "a churchy stock phrase, or it assumes the viewer's spiritual state")):
            for pat in pats:
                m = re.search(pat, low)
                if m:
                    found = True
                    R.warn(name, f"'{m.group(0)}': {why}: '{strip_refs(v['text'])[:80]}'")
    if not found: R.ok("phrasing", "no empty phrases, feeling-tells or stock phrases found")


GOD_WORDS = {"god", "he", "his", "him", "lord", "jesus", "christ", "bible", "if", "the", "i"}
# Function words ignored when asking "is this line saying anything new?" (STOP is kept small on purpose for the other checks).
FILLER = STOP | set("than then there here when what who why how did does do done has have had will would could should can said says say "
                    "one also even still only very about into out up down over after before because it's that's isn't didn't don't "
                    "doesn't really just now like way all any some more most much many same other another again where while "
                    "notice look see know knew yet too who's".split())
SIGNPOSTS = [r"\blet'?s (?:take a )?(?:look|dive|talk|unpack|explore|see|allow|find out|break)", r"\bin (?:this|today'?s) (?:video|reel|short|episode)\b",
             r"\b(?:people|you guys|many of you) (?:ask|asked|keep asking)\b", r"\bone of the most (?:asked|common|searched)\b",
             r"\bstick around\b", r"\bkeep watching\b", r"\bwatch (?:until|till|to) the end\b", r"\bthe answer (?:might|may|will) surprise you\b",
             r"\bhere'?s the thing\b", r"\bwelcome to\b", r"\byou'?ll know what to say\b", r"\bbefore we (?:start|begin|get into)\b",
             r"\bthat'?s what we'?(?:re|ll) (?:going to |gonna )?(?:find out|see|look at)\b"]


def stem(w):
    for suf in ("'s", "ing", "ed", "es", "s"):
        if w.endswith(suf) and len(w) - len(suf) >= 3: return w[: -len(suf)]
    return w


def unquoted(t):
    return re.sub(r'["\u201c][^"\u201d]*["\u201d]', " ", clean_text(t))


def value_spoken(item, vo_lines):
    """A ## Value item counts only if the viewer hears it: every quote in it is said in the VO, or (with no quote) at least
    40% of its key words are said in two neighbouring VO lines."""
    plain = clean_text(strip_refs(item))
    vo = " " + " ".join(" ".join(tokens(l)) for l in vo_lines) + " "
    quotes = [q for q in re.findall(r'"([^"]+)"', plain) if len(tokens(q)) >= 2]
    if quotes:
        return all(" " + " ".join(tokens(q.replace("\u2026", " ").replace("...", " "))) + " " in vo for q in quotes)
    keys = {stem(w) for w in tokens(plain) if w not in FILLER and len(w) > 2}
    if not keys: return True
    best = 0.0
    for i in range(len(vo_lines)):
        win = {stem(w) for l in vo_lines[i:i + 2] for w in tokens(l)}
        best = max(best, len(keys & win) / len(keys))
    return best >= 0.4


def script_shape(R, ep, secs):
    """Where the hook, turn, answer and echo fall, and how much is story or aimed at "you". Hits on The Lintel Network
    (Tree 7.6M, Cain's wife 1.8M, Never heard 1.6M) and their next three: turn 14-25 s, core answer at 33-50 %, the hook's
    own words again at 82-89 %, 1-3 "you" lines, story retold 0-20 %. Positions are estimated from word counts."""
    lines = [(v["section"], strip_refs(v["text"])) for v in ep["vo"]]
    counts = [len(tokens(t, spell_numbers=True)) for _, t in lines]
    total = max(1, sum(counts)); starts = [sum(counts[:i]) / total for i in range(len(lines))]
    kw = lambda t: {w for w in tokens(t) if w not in STOP and len(w) > 2}
    series = (ep.get("series") or "").upper()
    if series == "ASK THE TEXT" and total > 300:
        R.warn("budget", f"{total} spoken words; the six best Lintel Shorts use 218–414 (median 275). About 230–300 words keeps it 90–120 s")
    hook = lines[0][1]
    if re.search(r"\b(you|your|we|us|our)\b", hook, re.I):
        R.warn("hook form", "the hook is about the viewer ('you'/'we'); all three Lintel hits ask about a named Bible person or object in the third person "
                            "(\"Where did Cain's wife come from?\"), and every 'you'/'we' hook was a low")
    names = [w for w in re.findall(r"\b[A-Z][a-z]+", hook)[1:] if w.lower() not in GOD_WORDS]
    if not names:
        R.warn("hook form", "the hook names no Bible person, place or object; the hits name one in the question itself")
    turn_i = next((i for i, (sec, _) in enumerate(lines) if sec == "turn"), None)
    if turn_i is not None:
        t_turn = starts[turn_i] * secs
        (R.ok if t_turn <= 25 else R.warn)("turn", f"the Turn starts about {t_turn:.0f}s in (Lintel's top six turn at 14–25 s, after at most ~14 s of story)")
    story = sum(c for (sec, _), c in zip(lines, counts) if sec == "story") / total
    (R.ok if story <= 0.40 else R.warn)("story share", f"the Story section is {story:.0%} of the words (Marcus's cap ~40%; the hits retell 0–5%, the top six spend 0–21% on any story). "
                                                     "Count story lines in other sections by hand")
    if ep.get("answer"):
        ak = kw(ep["answer"])
        # the first pair of neighbouring lines that together carry half the answer's key words (an answer is often said
        # in two short sentences: "So his strength was never a reward." / "...that never meant God approved.")
        need = max(2, 0.5 * len(ak)); ans_i = None
        for i in range(1, len(lines)):
            if lines[i][0] == "question": break
            pair = kw(lines[i][1]) | (kw(lines[i + 1][1]) if i + 1 < len(lines) and lines[i + 1][0] != "question" else set())
            if len(ak & pair) >= need:
                ans_i = i if len(ak & kw(lines[i][1])) >= 2 or i + 1 >= len(lines) else i + 1; break
        if ans_i is None: R.warn("answer timing", "no VO line (or pair of neighbouring lines) carries the answer line's key words")
        else:
            pos = starts[ans_i]
            (R.ok if 0.25 <= pos <= 0.55 else R.warn)("answer timing", f"the core answer starts at about {pos:.0%} of the runtime (top six 33–50%; the question-video lows 59–82%)")
    hk = kw(hook)
    late = [t for (sec, t), st in zip(lines, starts) if st >= 0.70 and sec != "question"]
    best = max((len(hk & kw(t)) / max(1, len(hk)) for t in late), default=0)
    (R.ok if best >= 0.5 else R.warn)("echo", f"{'the hook comes back' if best >= 0.5 else 'the hook never comes back'} after 70% of the runtime "
                                              f"({best:.0%} of its key words in one line). All three hits re-ask it in its own words at 82–89%, then answer it in one line")
    def unquoted(t): return re.sub(r'["\u201c][^"\u201d]*["\u201d]', " ", t)
    you = [s2 for _, t in lines for s2 in sentences(unquoted(t)) if re.search(r"\b(you|your|yourself)\b", s2, re.I)]
    (R.ok if len(you) <= 3 else R.warn)("you lines", f"{len(you)} sentences speak to 'you' outside quotes (top six 1–3; the reels with 5–9 were all lows). Never describe the viewer's conduct")
    q = [t for sec, t in lines if sec == "question"]
    if q:
        n = len(tokens(q[-1]))
        (R.ok if n <= 17 else R.warn)("closing question", f"{n} words (the hits' closing questions run 16–17 words, about 5 s)")
    value_density(R, ep, lines, starts, hk, kw)


def value_density(R, ep, lines, starts, hk, kw):
    """Deterministic checks for lines that cost time and give nothing (Oct 31, from the blind judge panels' weakest lines):
    a phrase said 3+ times, signposts that announce instead of saying, and lines whose every key word was already said."""
    # repeated phrases: any 3-word run with 2+ content words, said 3 or more times in the VO
    toks = [w for _, t in lines for w in tokens(t)]
    grams = {}
    for i in range(len(toks) - 2):
        g = tuple(toks[i:i + 3])
        if sum(w not in STOP for w in g) >= 2: grams[g] = grams.get(g, 0) + 1
    reps = sorted(((n, " ".join(g)) for g, n in grams.items() if n >= 3), reverse=True)
    shown = []
    for n, g in reps:
        if not any(g in s2 or s2 in g for _, s2 in shown): shown.append((n, g))
    for n, g in shown[:3]:
        R.warn("repetition", f"repeated phrase: '{g}' is said {n} times; say it once (twice if the re-ask needs it)")
    if not shown: R.ok("repetition", "no 3-word phrase is said 3 or more times")
    # signposts
    sp = [(t, m.group(0)) for _, t in lines for pat in SIGNPOSTS for m in [re.search(pat, unquoted(t), re.I)] if m]
    for t, m in sp:
        R.warn("signpost", f"signpost '{m}': it announces instead of telling, and the blind judges keep naming such lines the weakest "
                           f"(though Lintel's 1.8M Cain's-wife reel has one). Keep it only if it earns its time: '{t[:70]}'")
    # nothing new: every key word (outside quotes) was already said, and the line quotes nothing new
    echo_i = max((i for i, st in enumerate(starts) if st >= 0.70 and lines[i][0] != "question"),
                 key=lambda i: len(hk & kw(lines[i][1])), default=None)
    said = set(); dead = []
    for i, (sec, t) in enumerate(lines):
        keys = {stem(w) for w in tokens(unquoted(t)) if w not in FILLER and len(w) > 2}
        has_quote = bool(re.search(r'"[^"]{8,}"', clean_text(t)))
        if i > 0 and sec != "question" and i != echo_i and not has_quote and len(keys) >= 4 and len(keys & said) / len(keys) >= 0.85:
            dead.append(t)
        said |= {stem(w) for w in tokens(t)}
    for t in dead:
        R.warn("nothing new", f"this line adds nothing new: every key word in it was already said: '{t[:80]}'")
    if not dead: R.ok("nothing new", "every line adds at least one new key word or quote")


def judge_sha(ep):
    """The exact VO text the judges read (tools/script_judge/make_packet.py), hashed: a changed script needs a new panel."""
    txt = re.sub(r"\s+", " ", " ".join(strip_refs(v["text"]).strip() for v in ep["vo"]))
    return hashlib.sha256(txt.encode()).hexdigest()[:16]


def judge_gate(R, ep, panel_path, script_path):
    """--judge <run folder or panel.json>: the blind AI judge panel's craft verdict (tools/script_judge/rubric.md). NOT YET is a FAIL."""
    p = Path(panel_path); p = p / "panel.json" if p.is_dir() else p
    try: panel = json.loads(p.read_text())
    except Exception as e:
        R.fail("judge", f"can't read the judge panel {p}: {e}"); return
    ours = [x for x in panel.get("scripts", []) if x.get("kind") == "ours"]
    row = next((x for x in ours if x.get("sha") == judge_sha(ep)), None)
    if row is None:
        if any(Path(x.get("name", "")).name == Path(script_path).name for x in ours):
            R.fail("judge", f"the script has changed since the panel in {p.parent} judged it: re-run the judge panel (tools/script_judge/rubric.md)")
        else:
            R.fail("judge", f"this script isn't in the judge panel {p}")
        return
    cal = panel.get("calibration", {})
    msg = (f"{row.get('verdict')} (craft, blind AI judges): overall {row.get('overall')} vs the best reference reel's "
           f"{cal.get('craft_bar_best_reference_overall')}; hook {row.get('hook')}, payoff {row.get('payoff')}, new value {row.get('new_value')}. "
           "Not a forecast of views")
    if row.get("verdict") == "GOOD ENOUGH": R.ok("judge", msg)
    else: R.fail("judge", msg + ("; " + "; ".join(row["why"]) if row.get("why") else ""))


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
def ocr_words(img_bgr, band=None, up=1):
    """Bright text on a dark stage -> [{w, x, y, w_, h, conf}] in frame pixels.
    band=(y0, y1) as fractions of the height reads only that strip; up>1 enlarges it first (small italic captions)."""
    import cv2, numpy as np
    y_off = 0
    if band:
        h_ = img_bgr.shape[0]; y_off = int(band[0] * h_); img_bgr = img_bgr[y_off:int(band[1] * h_)]
    if up != 1: img_bgr = cv2.resize(img_bgr, None, fx=up, fy=up, interpolation=cv2.INTER_CUBIC)
    g = img_bgr.max(axis=2)                                             # gold/cream glyphs are bright in some channel
    if band:                                                            # a text band: Otsu reads italic serif captions far better
        _, bw = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    else:
        g = cv2.GaussianBlur(g, (3, 3), 0)
        thr = max(140, int(np.percentile(g, 92)))
        _, bw = cv2.threshold(g, thr, 255, cv2.THRESH_BINARY_INV)      # black text on white
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f: path = f.name
    cv2.imwrite(path, bw)
    r = run(["tesseract", path, "stdout", "--psm", "6" if band else "11", "tsv"])
    os.unlink(path)
    out = []
    for line in r.stdout.splitlines()[1:]:
        p = line.split("\t")
        if len(p) < 12 or not p[11].strip(): continue
        try: conf = float(p[10])
        except ValueError: continue
        if conf < 30: continue
        for w in tokens(p[11]):
            out.append({"w": w, "x": int(int(p[6]) / up), "y": int(int(p[7]) / up) + y_off, "bw": int(int(p[8]) / up), "bh": int(int(p[9]) / up), "conf": conf})
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


# ----------------------------------------------------------------------------------------------- direction
# Shot rhythm, static shots, the hook and the closing tail, measured the way the Oct 31 study measured the
# Lintel Network's 14 Shorts (research/direction_rules.md, research/lintel_ref/yt/_patterns.md).
DIR_FPS = 10
SHOT_MEDIAN = (3.0, 5.0)        # Lintel median 3.8 s; hits 3-5 s; both extremes (1.8 s, 6.2 s) were low performers
SHOT_LONG = 12.0                # nothing longer; 10-12 s only with a beat every ~2 s inside (Bible Animations hits hold 10.5-11.5 s sets)
SHOTS_PER_SENTENCE = (0.8, 1.4) # Lintel 1.02
HOOK_QUESTION_BY = 5.5          # hits finish the question at 2.8-5.5 s
TAIL_WARN, TAIL_FAIL = 4.5, 7.0  # after the last spoken word: hits 0-1.2 s (Bible Animations, BibleProject) to ~3-3.6 s (Lintel CTA + logo)
CAPTION_BAND = 0.30             # the top band carries header + narration; motion is measured below it


def detect_shots(video):
    """10 fps luma frames -> (shots [(t0, t1, cam%, own%, net)], transitions [(t0, t1)]).
    cam% = camera travel (|zoom| + pan, % of frame height); own% = median share of tracked points moving on their own
    once the camera move is removed (characters, effects); net = mean change below the caption band, first vs last frame."""
    import cv2, numpy as np
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={DIR_FPS},scale=216:384,format=gray", "-f", "rawvideo", "-"],
                       capture_output=True)
    F = np.frombuffer(r.stdout, np.uint8)
    if not F.size: return [], [], np.zeros(0)
    F = F.reshape(-1, 384, 216); n = len(F); y0 = int(384 * CAPTION_BAND)
    hist = [cv2.calcHist([f], [0], None, [32], [0, 256]).ravel() / f.size for f in F]
    hd = np.array([0] + [0.5 * np.abs(hist[i] - hist[i - 1]).sum() for i in range(1, n)])
    md = np.array([0] + [np.abs(F[i, y0:].astype(np.int16) - F[i - 1, y0:]).mean() for i in range(1, n)])
    cut = [0]
    for i in range(1, n):
        loc = np.median(md[max(1, i - 8):i + 8]) + 1e-3
        if ((md[i] > 14 and md[i] > 4 * loc) or (hd[i] > 0.3 and md[i] > 8)) and i - cut[-1] >= 2: cut.append(i)
    cut.append(n)
    zoom = np.zeros(n); pan = np.zeros(n); own = np.zeros(n); ok = np.zeros(n, bool); cs = set(cut)
    for i in range(1, n):
        if i in cs: continue
        a, b = F[i - 1, y0:], F[i, y0:]
        p0 = cv2.goodFeaturesToTrack(a, maxCorners=200, qualityLevel=0.01, minDistance=5, blockSize=7)
        if p0 is None or len(p0) < 10: continue
        p1, st, _ = cv2.calcOpticalFlowPyrLK(a, b, p0, None, winSize=(15, 15), maxLevel=3)
        g = st.ravel() == 1
        if g.sum() < 10: continue
        A, _ = cv2.estimateAffinePartial2D(p0[g], p1[g], method=cv2.RANSAC, ransacReprojThreshold=1.0)
        if A is None: continue
        zoom[i] = np.hypot(A[0, 0], A[1, 0]) - 1; pan[i] = np.hypot(A[0, 2], A[1, 2]) / 384 * 100
        pred = p0[g].reshape(-1, 2) @ A[:, :2].T + A[:, 2]
        own[i] = np.mean(np.linalg.norm(p1[g].reshape(-1, 2) - pred, axis=1) > 1.2); ok[i] = True
    shots, trans = [], []
    for a, b in zip(cut, cut[1:]):
        t0, t1 = a / DIR_FPS, b / DIR_FPS
        if t1 - t0 < 0.4: trans.append((t0, t1)); continue
        sl = [i for i in range(a + 1, b) if ok[i]]
        cam = float(abs(np.sum(zoom[sl])) * 100 + np.sum(pan[sl])) if sl else 0.0
        own_m = float(np.median(own[sl]) * 100) if sl else 0.0
        net = float(np.abs(F[b - 1, y0:].astype(np.int16) - F[a, y0:]).mean())
        shots.append((t0, t1, cam, own_m, net))
    return shots, trans, md


def visual_beats(md, k=1.8, floor=0.8, gap=0.5):
    """Times (s) where the picture below the caption band visibly changes: local peaks of frame difference above
    k x the 3 s rolling median. Calibrated Oct 31: Lintel reels land one every 2.0-2.4 s with 19-21% of the runtime
    in gaps over 4 s (longest 5.5-7.4 s); Ep 1 v57 had 47%. Cross-channel hits change something every ~1.2-1.6 s (judged)."""
    import numpy as np
    ev = []
    for i in range(1, len(md) - 1):
        loc = float(np.median(md[max(0, i - 15):i + 15])) + 0.05
        if md[i] >= md[i - 1] and md[i] >= md[i + 1] and md[i] > max(floor, k * loc) and (not ev or i - ev[-1] >= gap * DIR_FPS): ev.append(i)
    return [i / DIR_FPS for i in ev]


def direction_qa(R, video, dur, ep, subs, out):
    import numpy as np
    shots, trans, md = detect_shots(video)
    if not shots:
        R.warn("direction", "could not read frames for the shot study"); return
    L = np.array([b - a for a, b, *_ in shots]); med = float(np.median(L))
    in35 = float(np.mean((L >= 3) & (L <= 5)))
    R.facts["shots"] = f"{len(shots)} shots + {len(trans)} short transitions; median {med:.1f}s; {in35:.0%} are 3–5 s; longest {L.max():.1f}s"
    (R.ok if SHOT_MEDIAN[0] <= med <= SHOT_MEDIAN[1] else R.warn)(
        "rhythm", f"median shot {med:.1f}s, {in35:.0%} of shots 3–5 s (Lintel median 3.8 s; hits keep half their shots at 3–5 s)")
    for (a, b, *_ ) in shots:
        if b - a > SHOT_LONG:
            R.warn("rhythm", f"one shot runs {b - a:.1f}s: over {SHOT_LONG:.0f} s even hits cut, unless a diagram keeps building; split it on its clauses", a)
    if ep:
        n_sent = sum(len(re.findall(r'[.?!]["”’]?(?:\s|$)', strip_refs(l["text"]) + " ")) for l in ep["vo"])
        if n_sent:
            ratio = len(shots) / n_sent
            (R.ok if SHOTS_PER_SENTENCE[0] <= ratio <= SHOTS_PER_SENTENCE[1] else R.warn)(
                "rhythm", f"{len(shots)} shots for {n_sent} spoken sentences = {ratio:.2f} (Lintel 1.02: one new picture per sentence)")
    # visual beats: the clearest separator between hits and lows across three channels (Oct 31 cross-check):
    # hits change something on screen every ~1.2-2.3 s; lows hold still pictures for 6-15 s
    ev = visual_beats(md); gaps = np.diff(np.r_[0.0, ev, dur]); starts = np.r_[0.0, ev]
    dead = float(gaps[gaps > 4.0].sum()) / max(1e-6, dur)
    R.facts["visual beats"] = f"{len(ev)} in {dur:.0f}s (one every {dur / max(1, len(ev)):.1f}s); {dead:.0%} of the runtime in gaps over 4 s; longest gap {gaps.max():.1f}s"
    (R.ok if dead <= 0.30 else R.warn)("visual beats", f"{dead:.0%} of the runtime sits in stretches over 4 s with no visible change below the captions "
                                       "(Lintel 19–21%; Ep 1 v57 47%): give each stretch a beat about every 2 s (an action, an object, a pill, a light, the camera arriving)")
    for st0, g in zip(starts, gaps):
        if g > 6.0: R.warn("visual beats", f"{g:.1f}s with no visible change below the captions (Lintel's longest 5.5–7.4 s, at most one per reel)", float(st0))
    (out / "shots.json").write_text(json.dumps([{"t0": round(a, 2), "len": round(b - a, 2), "camera_pct": round(c, 1), "own_motion_pct": round(o, 1), "net_change": round(nc, 1)}
                                                for a, b, c, o, nc in shots], indent=1))
    # hook: movement inside the first second, and the question fully spoken early
    first = shots[0]
    if first[1] >= 1.0 and first[3] < 1.0 and first[2] < 1.5:
        R.warn("hook", "nothing moves in the opening shot's first second (hits on three channels: the first visual change by 0–1.3 s)", 0.0)
    if subs:
        q_end = next((x["end"] for x in subs if x["text"].strip().endswith("?")), None)
        if q_end is not None:
            (R.ok if q_end <= HOOK_QUESTION_BY else R.warn)("hook", f"the opening question is fully spoken at {q_end:.1f}s (hits 2.8–5.5 s)")
    # tail: time after the last spoken word (other channels' hits end ~1 s after it; Lintel's ~5 s, a typing CTA card + a 2 s logo)
    if subs:
        last_word = subs[-1]["end"]; after = dur - last_word
        lvl = R.fail if after > TAIL_FAIL else R.warn if after > TAIL_WARN else R.ok
        lvl("tail", f"the reel runs {after:.1f}s after the last caption ends at {last_word:.1f}s (hits end 0–1.2 s on Bible Animations and BibleProject, ~3–3.6 s on Lintel; keep the logo short)")


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
    _series = None
    if getattr(args, "script", None):
        try: _series = parse_script(args.script).get("series")
        except Exception: _series = None
    HARD, TARGET, _cards = limits(_series)
    if not (HARD[0] <= dur <= HARD[1]): R.fail("runtime", f"{dur:.1f}s (must be {HARD[0]}–{HARD[1]}s)")
    elif not (TARGET[0] <= dur <= TARGET[1]): R.warn("runtime", f"{dur:.1f}s (target {TARGET[0]}–{TARGET[1]}s)")
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
        tm = max((s["t"] + s["end"]) / 2, s["end"] - 0.12)              # captions that build word by word are complete at the chunk's end
        img = grab(video, tm)
        if img is None: continue
        words = ocr_words(img); seen_text.append((tm, words))
        top = ocr_words(img, band=(0.06, 0.34), up=2)                      # narration captions at the top (Lintel layout)
        ratio, boxes = match_ratio(s["text"], top)
        if ratio < 0.5:
            band = [w for w in words if w["y"] > H * 0.4]                 # or captions in the lower part of the frame
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

    # ---- direction: shot rhythm, static shots, hook, tail
    try: direction_qa(R, video, dur, ep, subs, out)
    except Exception as e: R.warn("direction", f"shot study failed: {e}")

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
    s = sub.add_parser("script"); s.add_argument("script"); s.add_argument("--out", default="qa/script"); s.add_argument("--wpm", type=float, default=None)
    s.add_argument("--judge", default=None, help="a judge run folder (or its panel.json): adds the blind AI panel's craft verdict; NOT YET is a FAIL")
    v = sub.add_parser("video")
    v.add_argument("--video", required=True); v.add_argument("--script"); v.add_argument("--subs")
    v.add_argument("--vo-audio"); v.add_argument("--out", default="qa/video"); v.add_argument("--no-asr", action="store_true")
    v.add_argument("--wpm", type=float, default=None)
    a = ap.parse_args()
    try:
        if a.cmd == "script":
            R, ep = lint_script(a.script, a.wpm)
            if ep is not None:
                if a.judge: judge_gate(R, ep, a.judge, a.script)
                elif (ep.get("series") or "").strip().upper() not in FLEX_SERIES:
                    R.warn("judge", "not judged: the blind AI panel is optional and needs Marcus's OK (agents). AI judges are critics, never evidence (Round 41)")
        else:
            R = video_qa(a)
    except Exception as e:
        print(f"checker error: {e}", file=sys.stderr); sys.exit(2)
    data = R.write(a.out)
    print((Path(a.out) / "report.md").read_text())
    sys.exit(1 if R.failed else 0)


if __name__ == "__main__":
    main()
