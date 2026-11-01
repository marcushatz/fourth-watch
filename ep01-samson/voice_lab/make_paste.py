"""Build the ElevenLabs paste text from episode.md (the single source of truth).

Usage: python3 voice_lab/make_paste.py episode.md voice_lab/ep01_elevenlabs_script.txt
Rules (Eleven v4): no SSML; ellipses make the held pause; spell numbers the way they are said;
LORD/GOD in small caps are read as "Lord"/"God".
"""
import re
import sys

src, out = sys.argv[1], sys.argv[2]
lines = []
for raw in open(src, encoding="utf-8"):
    if not raw.startswith("VO:"):
        continue
    t = re.sub(r"\[[^\]]*\]", "", raw[3:]).strip()
    t = t.replace("O Lord GOD", "O Lord God").replace("LORD", "Lord")
    t = t.replace("Hebrews 11", "Hebrews eleven")
    if t.startswith('"But he did not know'):
        t = "... " + t + " ..."
    lines.append(t)

open(out, "w", encoding="utf-8").write("\n\n".join(lines) + "\n")
print(f"{len(lines)} lines, {sum(len(l.split()) for l in lines)} words, {sum(len(l) for l in lines)} characters -> {out}")
