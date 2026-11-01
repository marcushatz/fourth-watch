#!/bin/bash
# Rebuild the demo film folder: a copy of film27 (the engine, with the Story Director pieces promoted on Nov 1) plus the
# demo score (S19 split into sdA-sdE). The copy is git-ignored; this script and score_sd.js are the source.
set -e
cd "$(dirname "$0")"
rm -rf film && mkdir -p film/out
tar -C ../../film27 --exclude=./out --exclude='./*_v4*' --exclude='./*backup*' --exclude='./endcard_*' -cf - . | tar -C film -xf -
cp score_sd.js film/score.js
echo "film/ ready: cd film && CHROME_PATH=... node engine/render.js clip 103.75 116.35 2"
