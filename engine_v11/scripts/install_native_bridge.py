#!/usr/bin/env python3
"""Copies the four native bridge files into film27 and confirms the copies match.

It adds files only. It never touches film27's index.html, score.js, film.js or existing scenes.
"""
import hashlib, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILM = ROOT.parent / 'ep01-samson' / 'film27'
FILES = {'storm_bridge.html': 'storm_bridge.html', 'storm_track.js': 'storm_track.js', 'storm_score.js': 'storm_score.js',
         'storm_native.js': 'scenes/storm_native.js'}
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()


def main():
    if not (FILM / 'film.js').is_file():
        sys.exit(f'film27 not found at {FILM}')
    for source, target in FILES.items():
        shutil.copyfile(ROOT / 'native_three' / source, FILM / target)
        if sha(ROOT / 'native_three' / source) != sha(FILM / target):
            sys.exit(f'copy failed: {target}')
        print('installed', target)


if __name__ == '__main__':
    main()
