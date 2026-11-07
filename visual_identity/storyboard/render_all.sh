#!/bin/bash
# Full-size renders of the storyboard frames, then the finish and the modesty check. Times each frame.
cd /home/claude/fw-tools && . venv/bin/activate && cd /home/claude/fourth-watch/visual_identity/storyboard
for f in "$@"; do
  s=$(date +%s)
  python sb_frames.py $f 1080 32 > /home/claude/fw-tools/out/$f.render.log 2>&1
  r=$(date +%s)
  python sb_finish.py $f /home/claude/fw-tools/out/$f.jpg >> /home/claude/fw-tools/out/$f.render.log 2>&1
  e=$(date +%s)
  echo "$f render $((r-s))s finish $((e-r))s" >> /home/claude/fw-tools/out/sb_times.txt
  python modesty.py $f >> /home/claude/fw-tools/out/sb_times.txt 2>&1
done
echo ALLDONE >> /home/claude/fw-tools/out/sb_times.txt
