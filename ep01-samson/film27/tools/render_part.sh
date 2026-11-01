#!/bin/bash
# render_part.sh NAME FROM TO  -> out/parts/NAME.mp4 (silent; music comes last)
set -e
cd "$(dirname "$0")/.."
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
node engine/render.js clip "$2" "$3" 2 --hq > "out/render_$1.log" 2>&1
f=$(ls -t out/clip_*.mp4 | head -1); mv "$f" "out/parts/$1.mp4"; echo "out/parts/$1.mp4 done" >> "out/render_$1.log"
