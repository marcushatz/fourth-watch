#!/bin/bash
# render each changed segment as its own clip into out/parts/seg_<name>.mp4
cd "$(dirname "$0")/.."
export CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome
while read name a b; do
  [ -f "out/parts/seg_$name.mp4" ] && continue
  node engine/render.js clip "$a" "$b" 2 --hq > "out/render_seg_$name.log" 2>&1 || exit 1
  f=$(ls -t out/clip_*.mp4 | head -1); mv "$f" "out/parts/seg_$name.mp4"
done < out/segments.txt
echo segments done
