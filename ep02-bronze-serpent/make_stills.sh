#!/bin/bash
# Build the style-frame lab (visual spec v1): the same engine as the film, the episode's props + the designed props
# (fw_props2.js), the style sets and three still shots. Output dir: stills/ (git-ignored). No title, captions or header.
set -e; cd "$(dirname "$0")"
D=stills
rm -rf $D && mkdir -p $D/out
tar -C ../ep01-samson/film27 --exclude=./out --exclude='./*_v4*' --exclude='./*backup*' --exclude='./endcard_*' --exclude='./*_pre_*' -cf - . | tar -C $D -xf -
cp film_src/bs_props.js film_src/fw_props2.js film_src/style_sets.js $D/
python3 - <<'PY'
from pathlib import Path
D = "stills"
idx = Path(f"{D}/index.html"); t = idx.read_text()
ep = '<script>globalThis.EPISODE = { series: "ASK THE TEXT", topic: "THE BRONZE SERPENT", title: [["HOW"]], titleY: 318, titleSize: 62 };</script>'
t = t.replace('<script src="film.js"></script>', '<script src="scenes/diorama.js"></script>\n<script src="bs_props.js"></script>\n<script src="fw_props2.js"></script>\n<script src="style_sets.js"></script>\n' + ep + '\n<script src="film.js"></script>')
i = t.index('<script'); t = t[:i] + '<script>globalThis.FW_NOCAP = true;</script>\n' + t[i:]
idx.write_text(t)
s = Path(f"{D}/score.js").read_text().splitlines()
a = next(k for k, l in enumerate(s) if "const add = (id, scene, v, t0" in l)
b = next(k for k, l in enumerate(s) if "const END_T" in l)
s[a + 1:b] = Path("film_src/style_shots.js").read_text().splitlines()
txt = "\n".join(s) + "\n"
import re
txt = re.sub(r"Object\.assign\(markers, \{[\s\S]*?\}\);", "Object.assign(markers, {});", txt)
Path(f"{D}/score.js").write_text(txt)
PY
(cd $D && python3 tools/make_vo.py --words ../build/voice/words.json >/dev/null)
echo "$D/ ready"
