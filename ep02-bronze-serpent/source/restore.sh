#!/bin/bash
# Restores the Bronze Serpent working folder in a Higgsfield sandbox. Costs no credits.
# usage: restore.sh [root]   default root: /home/user/what-if
set -e
ROOT=${1:-/home/user/what-if}
BASE=https://d2ol7oe51mr4n9.cloudfront.net/user_3E07PepHP7nOUDrURRZZ9yJojjW
mkdir -p "$ROOT"
curl -fsS -o /tmp/fw_media.zip "$BASE/33a08729-3fde-46e7-87f9-1e185596ecd0.zip"
unzip -qo /tmp/fw_media.zip -d "$ROOT"
curl -fsS -o /tmp/fw_src.zip "$BASE/290dffb3-707a-4875-ab6d-597f12715490.zip"
unzip -qo /tmp/fw_src.zip -d "$ROOT/fw-serpent"
mkdir -p "$ROOT/bronze-v4/fonts" "$ROOT/ink-serpent/fonts"
cp "$ROOT/fw-serpent/fonts/Cinzel.ttf" "$ROOT/fw-serpent/fonts/CormorantGaramond-Italic.ttf" "$ROOT/bronze-v4/fonts/"
cp "$ROOT/fw-serpent/fonts/Cormorant.ttf" "$ROOT/ink-serpent/fonts/"
if [ "$ROOT" != "/home/user/what-if" ]; then
  grep -rl "/home/user/what-if" "$ROOT/fw-serpent" --include=*.jsx --include=*.js --include=*.py --include=*.sh | xargs -r sed -i "s#/home/user/what-if#$ROOT#g"
fi
echo "restored to $ROOT/fw-serpent"
