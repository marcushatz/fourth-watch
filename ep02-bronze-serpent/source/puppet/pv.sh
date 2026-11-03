#!/bin/bash
# usage: pv.sh name cols geom t1 t2 ...
n=$1; c=$2; g=$3; shift 3; P=/home/user/what-if/fw-serpent/puppet/prev; mkdir -p $P; files=""
for t in "$@"; do higgsedit frame pt $t --out $P/$n-$t.png 2>&1 | grep -iE "error|refus|compile" | cut -c1-260 | head -2; files="$files $P/$n-$t.png"; done
montage $files -tile ${c}x -geometry $g+2+2 -quality 72 $P/$n.jpg; ls -la $P/$n.jpg | cut -c20-
