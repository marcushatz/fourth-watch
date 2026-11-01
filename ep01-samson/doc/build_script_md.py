# Builds the Ep 1 doc's Script section body (everything under the "## Script" heading) from episode.md + timing.json.
import json, re, sys
sys.path.insert(0, "/home/claude/fourth-watch"); import fw_check as F
ep_path = "/home/claude/fourth-watch/ep01-samson/episode.md"
ep = F.parse_script(ep_path); rows = json.load(open("/home/claude/fourth-watch/ep01-samson/timing.json"))
text = open(ep_path).read()
mm = lambda t: f"{int(t//60)}:{int(round(t))%60:02d}" if round(t) < 60 else f"1:{int(round(t))-60:02d}"
beat = {"hook": "Hook", "stakes": "1", "story": "2", "turn": "3", "landing": "Close"}
lines = []
for v, r in zip(ep["vo"], rows):
    ref = re.search(r"\[([^\]]+)\]\s*$", v["text"]); ref = ref.group(1) if ref else "—"
    vo = F.strip_refs(v["text"]).replace("|", "\\|")
    lines.append(f"| {beat[v['section']]} | {mm(r['start'])}–{mm(r['end'])} | {vo} | {ref} |")
words = sum(r["words"] for r in rows); secs = round(rows[-1]["end"])
answer = ep["answer"]
value = re.findall(r"^- (.+)$", text.split("## Value")[1].split("## Caption")[0], re.M)
def tidy(v):  # "... [Judges 14:6, 14:19]" -> "... (Judges 14:6, 14:19)"
    return re.sub(r"\s*\[([^\]]+)\]\s*$", r" (\1)", v).strip()
verses = re.findall(r"^VERSE:\s*(.+)$", text, re.M)
cap = [l.strip() for l in text.split("## Caption")[1].split("## References")[0].strip().split("\n") if l.strip()]
# caption: line 0, "Two things most people miss:" + numbered 1./2., last line
cap_md = ["- **Caption** (posted under the reel):", f"    - {cap[0]}"]
rest = cap[1:-1]
if rest and rest[0].endswith(":"):
    items = [re.sub(r"^\d+\.\s*", "", x) for x in rest[1:]]
    cap_md.append(f"    - {rest[0]} " + " ".join(f"({i+1}) {x}" for i, x in enumerate(items)))
cap_md.append(f"    - {cap[-1]}")
sec = lambda t: f"{int(t//60)}:{t%60:04.1f}"
vcards, vo_i = [], -1
for ln in text.split("## Value")[0].splitlines():
    if ln.startswith("VO:"): vo_i += 1
    elif ln.startswith("VERSE:"):
        r = rows[vo_i]; vcards.append(f"{ln[6:].strip()}, on screen {sec(r['start'])}–{sec(r['end'])}")
md = []
md.append(f"**The takeaway: {answer[0].lower() + answer[1:]}** Revision 6, rebuilt on what the most-viewed informative shorts do: {words} words, about {secs} seconds of voice, series MOST PEOPLE MISS. Every line was checked against the ESV by an independent fact-checker, and the last round covered every change in this revision.")
md.append("")
md.append("| Beat | Time | Voiceover | Reference |\n| --- | --- | --- | --- |\n" + "\n".join(lines))
md.append("")
md.append("### What the viewer learns")
md.append("")
md.append("\n".join(f"{i+1}. {tidy(v)}." for i, v in enumerate(value)))
md.append("")
md.append("- **On screen from frame one:** the series tag MOST PEOPLE MISS above the title 3 THINGS ABOUT SAMSON MOST PEOPLE MISS; each item gets a number card (1. THE WEDDING BET, 2. HIS OWN PEOPLE, 3. \"FROM THE LORD\")")
md.append("- **Verse cards:** " + " · ".join(vcards))
md.append("\n".join(cap_md))
open("/home/claude/fourth-watch/ep01-samson/doc/script_section.md", "w").write("\n".join(md) + "\n")
print("\n".join(md))
