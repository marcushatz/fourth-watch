#!/bin/bash
# render one v57 part: render_one57.sh P3  (reads its range from out/parts57.txt) -> out/parts57/P3.mp4
cd "$(dirname "$0")/.."
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
read name a b < <(grep "^$1 " out/parts57.txt)
echo "$(date +%T) start $name $a $b" >> out/render_v57.log
node engine/render.js clip "$a" "$b" 2 --hq > "out/render57_$name.log" 2>&1 || { echo "$(date +%T) FAIL $name" >> out/render_v57.log; exit 1; }
f=$(ls -t out/clip_*.mp4 | head -1); mv "$f" "out/parts57/$name.mp4"
echo "$(date +%T) done $name" >> out/render_v57.log
