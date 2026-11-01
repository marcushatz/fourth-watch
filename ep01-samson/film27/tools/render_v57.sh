#!/bin/bash
# render the v57 cut in five parts (cut points on shot boundaries) -> out/parts57/P<n>.mp4, then assemble
cd "$(dirname "$0")/.."
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
while read name a b; do
  [ -f "out/parts57/$name.mp4" ] && continue
  echo "$(date +%T) start $name $a $b" >> out/render_v57.log
  node engine/render.js clip "$a" "$b" 2 --hq > "out/render57_$name.log" 2>&1 || { echo "$(date +%T) FAIL $name" >> out/render_v57.log; exit 1; }
  f=$(ls -t out/clip_*.mp4 | head -1); mv "$f" "out/parts57/$name.mp4"
  echo "$(date +%T) done $name" >> out/render_v57.log
done < out/parts57.txt
echo "$(date +%T) all parts done" >> out/render_v57.log
