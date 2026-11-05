#!/usr/bin/env python3
"""Compares native film27 frames with the verified v10 VTK workprint.

Native frames are reduced to v10's 360x640 and matched by source frame. The two label
strips are excluded because their typeface differs by design. These numbers show layout
fidelity to a layout test. They say nothing about artistic quality or release readiness.
"""
import argparse, json, re, sys
from pathlib import Path
import cv2
import numpy as np

SHOTS = {'S01': (0, 108), 'S02': (108, 222), 'S03': (222, 330), 'S04': (330, 450), 'S05': (450, 555), 'S06': (555, 668),
         'S07': (668, 794), 'S08': (794, 910), 'S09': (910, 1020), 'S10': (1020, 1145), 'S11': (1145, 1280), 'S12': (1280, 1440)}
MASK = np.ones((640, 360), bool)
MASK[:32] = False
MASK[-34:] = False


def ssim(a, b):
    a, b = a.astype(np.float64), b.astype(np.float64)
    g = lambda x: cv2.GaussianBlur(x, (11, 11), 1.5)
    ma, mb = g(a), g(b)
    va, vb, cov = g(a * a) - ma * ma, g(b * b) - mb * mb, g(a * b) - ma * mb
    return ((2 * ma * mb + 6.5025) * (2 * cov + 58.5225)) / ((ma * ma + mb * mb + 6.5025) * (va + vb + 58.5225))


def v10_frame(capture, source_frame):
    """v10 samples round(i*2.5), so only multiples of 5 align exactly with a 12fps frame."""
    capture.set(cv2.CAP_PROP_POS_FRAMES, round(source_frame / 2.5))
    ok, frame = capture.read()
    if not ok:
        raise ValueError(f'v10 has no frame for source frame {source_frame}')
    return frame


def compare_pair(a, b):
    b = cv2.resize(b, (360, 640), interpolation=cv2.INTER_AREA)
    diff = np.abs(a.astype(float) - b.astype(float)).mean(axis=2)
    sim = ssim(cv2.cvtColor(a, cv2.COLOR_BGR2GRAY), cv2.cvtColor(b, cv2.COLOR_BGR2GRAY))
    return float(diff[MASK].mean()), float(sim[MASK].mean())


def compare_stills(v10_path, frames_dir):
    capture = cv2.VideoCapture(str(v10_path))
    rows = {}
    for path in sorted(Path(frames_dir).glob('f_*.png')):
        f = int(re.search(r'f_(\d+)', path.name).group(1))
        shot = next(k for k, (a, b) in SHOTS.items() if a <= f < b)
        rows.setdefault(shot, []).append(compare_pair(v10_frame(capture, f), cv2.imread(str(path))))
    return summarize(rows)


def summarize(rows):
    out = {k: {'mae': round(float(np.mean([r[0] for r in v])), 3), 'ssim': round(float(np.mean([r[1] for r in v])), 4),
               'worst_ssim': round(float(min(r[1] for r in v)), 4), 'frames': len(v)} for k, v in rows.items()}
    flat = [r for v in rows.values() for r in v]
    out['ALL'] = {'mae': round(float(np.mean([r[0] for r in flat])), 3), 'ssim': round(float(np.mean([r[1] for r in flat])), 4),
                  'worst_ssim': round(float(min(r[1] for r in flat)), 4), 'frames': len(flat)}
    return out


def compare_video(v10_path, native_path):
    """Compares every v10 frame with the native frame for the same source frame."""
    v10, native = cv2.VideoCapture(str(v10_path)), cv2.VideoCapture(str(native_path))
    total = int(v10.get(cv2.CAP_PROP_FRAME_COUNT))
    rows, last_native, next_native, frame = {}, None, 0, None
    for i in range(total):
        ok, a = v10.read()
        source = round(i * 2.5)
        while next_native <= source:
            ok2, frame = native.read()
            if not ok2:
                raise ValueError(f'native video ended before source frame {source}')
            next_native += 1
        shot = next(k for k, (x, y) in SHOTS.items() if x <= source < y)
        rows.setdefault(shot, []).append(compare_pair(a, frame))
    return summarize(rows)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--v10', default=str(Path(__file__).resolve().parents[1] / 'outputs/v10/verified_3d_review/01_3d_layout_silent.mp4'))
    p.add_argument('--stills')
    p.add_argument('--video')
    p.add_argument('--out')
    a = p.parse_args()
    result = compare_stills(a.v10, a.stills) if a.stills else compare_video(a.v10, a.video)
    text = json.dumps(result, indent=2)
    print(text)
    if a.out:
        Path(a.out).write_text(text + '\n')


if __name__ == '__main__':
    sys.exit(main())
