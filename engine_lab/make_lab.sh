#!/bin/bash
# Build the engine lab: a copy of film27's code (git-ignored) + the lab sets + a lab score with diorama shots.
set -e; cd "$(dirname "$0")"
rm -rf film && mkdir -p film/out
tar -C ../ep01-samson/film27 --exclude=./out --exclude='./*_v4*' --exclude='./*backup*' --exclude='./endcard_*' --exclude='./*_pre_*' -cf - . | tar -C film -xf -
cp lab_sets.js film/
python3 - <<'PY'
from pathlib import Path
p = Path("film/index.html"); t = p.read_text()
if 'scenes/diorama.js' not in t: t = t.replace('<script src="film.js"></script>', '<script src="scenes/diorama.js"></script>\n<script src="lab_sets.js"></script>\n<script src="film.js"></script>')
p.write_text(t)
s = Path("film/score.js").read_text().splitlines()
keep = [l for l in s if not l.lstrip().startswith("add(") and "add('S" not in l and not l.lstrip().startswith("const SDB")]
i = next(k for k, l in enumerate(keep) if "const add = (id, scene, v, t0" in l)
keep[i + 1:i + 1] = Path("lab_shots.js").read_text().splitlines()
Path("film/score.js").write_text("\n".join(keep) + "\n")
PY
echo "lab ready"
