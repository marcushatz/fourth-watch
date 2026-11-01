#!/bin/bash
# Build the Bronze Serpent film: a copy of the engine (film27, git-ignored) + this episode's props, sets, shots and voice timings.
set -e; cd "$(dirname "$0")"
rm -rf film && mkdir -p film/out
tar -C ../ep01-samson/film27 --exclude=./out --exclude='./*_v4*' --exclude='./*backup*' --exclude='./endcard_*' --exclude='./*_pre_*' -cf - . | tar -C film -xf -
cp film_src/bs_props.js film_src/bs_sets.js film/
python3 - <<'PY'
from pathlib import Path
idx = Path("film/index.html"); t = idx.read_text()
ep = '<script>globalThis.EPISODE = { series: "ASK THE TEXT", topic: "THE BRONZE SERPENT", title: [["HOW", "COULD", "SOMETHING"], ["GOD*", "HIMSELF", "COMMANDED"], ["BECOME", "AN", "IDOL?"]], titleY: 318, titleSize: 62 };</script>'
if 'scenes/diorama.js' not in t:
    t = t.replace('<script src="film.js"></script>', '<script src="scenes/diorama.js"></script>\n<script src="bs_props.js"></script>\n<script src="bs_sets.js"></script>\n' + ep + '\n<script src="film.js"></script>')
idx.write_text(t)
s = Path("film/score.js").read_text().splitlines()
a = next(k for k, l in enumerate(s) if "const add = (id, scene, v, t0" in l)
b = next(k for k, l in enumerate(s) if "const END_T" in l)
s[a + 1:b] = Path("film_src/bs_shots.js").read_text().splitlines()
txt = "\n".join(s) + "\n"
import re
txt = re.sub(r"const VERSES = \[[\s\S]*?\n  \];", "const VERSES = [\n    { text: 'And as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up', ref: 'JOHN 3:14' },\n  ];", txt)
txt = re.sub(r"Object\.assign\(markers, \{[\s\S]*?\}\);", "Object.assign(markers, { calfBurn: { t: cue(0, 'destroyed'), sync: 'av' }, smash: { t: cue(1, 'destroyed'), sync: 'av' } });", txt)
Path("film/score.js").write_text(txt)
mv = Path("film/tools/make_vo.py"); m = mv.read_text()
m = re.sub(r'KEY = \[[\s\S]*?\]\n', 'KEY = ["calf", "serpent", "command", "commanded", "idol", "hezekiah", "offerings", "look", "live", "lifted", "cross", "eternal", "loved", "christ", "god"]\n', m, count=1)
mv.write_text(m)
PY
(cd film && python3 tools/make_vo.py --words ../build/voice/words.json >/dev/null && echo "vo.js from the recorded voice")
cp build/voice/voice.wav film/out/voice.wav
echo "film/ ready"
