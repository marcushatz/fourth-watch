#!/usr/bin/env python3
"""Build vo.js (+ out/captions.srt) from the approved episode.md: the single source of truth for the words.

Until the voice is recorded, word times are ESTIMATED at the Lintel pace (182 wpm, half-length pauses).
After the voice step, run with --words out/words.json (real word timings) and every cut, caption and
music cue re-times itself, because film.js and score.js only ever read times from vo.js.
"""
import json, re, sys
from pathlib import Path

sys.path.insert(0, "/home/claude/fourth-watch")
import fw_check as F  # same parser the checker uses

HERE = Path(__file__).resolve().parent.parent
EP = HERE.parent / "episode.md"
WPM, PS, LEAD = 182.0, 0.5, 0.15
PAUSE = {"same": 0.25 * PS, "section": 0.45 * PS, "turn": 0.55 * PS}

# words that get the gold accent in captions, in priority order
KEY = ["throw", "strength", "chase", "delilah", "lion", "thousand", "clue", "begin", "save", "start", "fight", "tied",
       "wife", "plan", "free", "deserved", "saving", "eyes", "prayed", "temple", "death", "rescue", "david", "faithful",
       "samson", "god"]


def syll(w):
    w = re.sub(r"[^a-z]", "", w.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


def main():
    real = None
    if "--words" in sys.argv:
        real = json.loads(Path(sys.argv[sys.argv.index("--words") + 1]).read_text())
    ep = F.parse_script(str(EP))
    verses = ep["verses"]
    lines, t, prev = [], LEAD, None
    for i, v in enumerate(ep["vo"]):
        sec = v["section"]
        if prev is not None:
            t += PAUSE["turn"] if (sec == "turn" and prev != "turn") else PAUSE["section"] if sec != prev else PAUSE["same"]
        text = F.strip_refs(v["text"]).strip()
        words = text.split()
        quote = text.startswith('"') or text.startswith("“")
        slow = 1.1 if quote else 1.0
        n = len(F.tokens(text, spell_numbers=True))
        npunct = len(re.findall(r"[,.;:?!…]", text[:-1]))
        dur = n / WPM * 60 * slow + 0.12 * npunct
        wts = [syll(w) + 0.3 for w in words]
        speak = dur - 0.12 * npunct
        ws, cur = [], t
        for w, k in zip(words, wts):
            d = speak * k / sum(wts)
            ws.append({"w": w, "s": round(cur, 3), "e": round(cur + d, 3)})
            cur += d + (0.12 if re.search(r"[,.;:?!…]$", w) and w is not words[-1] else 0)
        ref = re.findall(r"\[([^\]]+)\]", v["text"])
        card = None
        if quote:
            for vv in verses:
                body = vv["text"].split("—")[0].strip().strip('"“”… .')
                if F.tokens(body) and " ".join(F.tokens(body)) in " ".join(F.tokens(text)):
                    m = re.search(r"—\s*(.+?)\s*\(ESV\)", vv["text"])
                    card = {"text": vv["text"].split("—")[0].strip(), "ref": (m.group(1) if m else "").upper()}
        lines.append({"i": i, "section": sec, "text": text, "ref": ref[0] if ref else "", "start": round(t, 3), "end": round(t + dur, 3), "words": ws, "card": card})
        t += dur
        prev = sec
    if real:  # replace estimates with recorded timings (same word order)
        flat = [w for L in lines for w in L["words"]]
        assert len(flat) == len(real), f"word count mismatch: script {len(flat)} vs voice {len(real)}"
        for w, r in zip(flat, real):
            w["s"], w["e"] = r["s"], r["e"]
        for L in lines:
            L["start"], L["end"] = L["words"][0]["s"], L["words"][-1]["e"]
    # caption chunks: 2-4 words, phrase-aware DP over each line: break at punctuation, never end a chunk on a
    # function word, never start one on a particle that binds to the word before it
    BAD_END = set("a an the his her their my your our its to of in on at for with from by and but or so would did could "
                  "is was were be been what how that he'd he she they it's too much very who which why if as own next whole "
                  "it before because than you've he'll part still against".split())
    BOND = {("philistine", "wife"), ("new", "testament"), ("king", "david"), ("messed", "up"), ("you", "think")}
    BAD_START = set("up over down out away back apart him them it".split())
    P_RE = re.compile(r"[,.;:?!\u2026]\W*$")
    def chunk_line(ws):
        n = len(ws); INF = 1e9
        best = [INF] * (n + 1); back = [0] * (n + 1); best[0] = 0
        for j in range(1, n + 1):
            for size in (1, 2, 3, 4):
                i = j - size
                if i < 0: continue
                c = {1: 7, 2: 1.0, 3: 0, 4: 0.6}[size]
                last = re.sub(r"[^a-z']", "", ws[j - 1]["w"].lower())
                if j < n and not P_RE.search(ws[j - 1]["w"]):
                    c += 0.8
                    if last in BAD_END: c += 5
                    nxt = re.sub(r"[^a-z']", "", ws[j]["w"].lower())
                    if nxt in BAD_START: c += 4
                    if (last, nxt) in BOND: c += 6
                c += 2.5 * sum(1 for w in ws[i:j - 1] if P_RE.search(w["w"]))
                if best[i] + c < best[j]: best[j] = best[i] + c; back[j] = i
        out, j = [], n
        while j > 0: out.append(ws[back[j]:j]); j = back[j]
        return out[::-1]
    chunks = []
    for L in lines:
        chunks.extend(chunk_line(L["words"]))
    caps = []
    for c in chunks:
        line = next(L for L in lines if c[0] in L["words"])
        clean = [re.sub(r"[^a-z]", "", w["w"].lower()) for w in c]
        key = -1
        for k in KEY:
            if k in clean:
                key = clean.index(k); break
        caps.append({"line": line["i"], "text": " ".join(w["w"] for w in c), "words": [w["w"] for w in c], "key": key, "s": c[0]["s"], "e": c[-1]["e"]})
    for a, b in zip(caps, caps[1:]):
        a["e"] = round(min(b["s"] - 0.02, a["e"] + 0.35), 3)
    caps[-1]["e"] = round(caps[-1]["e"] + 0.5, 3)
    title = (ep["onscreen"][0]["text"] if ep["onscreen"] else ep["title"]).strip()
    data = {"title": title, "episode": "SAMSON", "series": (ep["series"] or "").upper(), "wpm": WPM, "estimated": real is None,
            "lines": lines, "captions": caps, "voEnd": lines[-1]["end"]}
    js = "// GENERATED by tools/make_vo.py from ../episode.md: do not edit by hand.\n(function(){const VO=" + json.dumps(data, ensure_ascii=False) + \
         ";if(typeof module!=='undefined')module.exports=VO;else globalThis.VO=VO;})();\n"
    (HERE / "vo.js").write_text(js)
    # srt: the same chunks
    def ts(x):
        h, r = divmod(x, 3600); m, s = divmod(r, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    out = HERE / "out"; out.mkdir(exist_ok=True)
    srt = "\n".join(f"{k + 1}\n{ts(c['s'])} --> {ts(c['e'])}\n{c['text']}\n" for k, c in enumerate(caps))
    (out / "captions.srt").write_text(srt)
    print(f"{len(lines)} lines, {len(caps)} caption chunks, VO ends {data['voEnd']:.2f}s ({'estimated' if real is None else 'recorded'})")


if __name__ == "__main__":
    main()
