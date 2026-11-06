"""Shot 13, "She gives some to Adam, and he eats." Start and end frames for image-to-video.

The production look (Marcus, Nov 6): Editorial Elegant figures (clean cel shading, a crisp ink line, the
lighter B colours) inside the Painterly Cinematic world and light (A). The world is identical in both
frames, so the clip only has to move the two people.

    python s13_frames.py            # writes ../frames/s13_start.png and s13_end.png
"""
import sys
from pathlib import Path

import cv2
import numpy as np

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
sys.path.insert(0, str(REPO / "stickman_hybrid" / "src"))
import cast as K  # noqa: E402
from cast import J  # noqa: E402
import scenes  # noqa: E402

OUT = HERE.parent / "frames"

# Framing: closer than the study, so hands and faces hold up at phone size and in a 720p-1080p clip.
U, GY = 118, 1880
EVE_X, ADAM_X = 262, 800
BITE = 150          # Eve has already eaten (Genesis 3:6), so the fruit she offers carries her bite.

EVE_START = dict(K.EVE_TENSION, hand_n=dict(t="offer", ang=-2, flip=False, bite=BITE))
ADAM_START = dict(K.ADAM_TENSION)

EVE_END = dict(
    K.EVE_TENSION, tilt=2, eye="open",
    arm_n=[J(.32, 6.55), J(.80, 5.60), J(1.10, 5.86)], hand_n=dict(t="relaxed", ang=-14, flip=False))
ADAM_END = dict(
    K.ADAM_TENSION, tilt=-26, eye="down",
    head=J(.16, 7.54), neck=J(.32, 6.84),
    arm_f=[J(.42, 6.66), J(-.10, 5.78), J(-.30, 6.74)],
    hand_f=dict(t="offer", ang=98, flip=False, fruit=True, fruit_at=J(-.40, 7.08), bite=BITE + 10))

LIGHT = dict(dir=(-.92, -.3, -.12), col=(1.0, .74, .46), k=.95, amb=(.15, .12, .10), rim=2.0,
             fill=dict(dir=(.1, -.25, 1), col=(.16, .12, .09)))


def frame(eve, adam):
    figs = [(eve, EVE_X, GY, U, .94, scenes.pal("B", "eve")), (adam, ADAM_X, GY, U, 1, scenes.pal("B", "adam"))]
    shot = dict(cast="B", figs=figs, light=LIGHT, ground=GY, shade=(700, 736),
                contacts=[(EVE_X + 32, 110), (ADAM_X + 2, 120)],
                # Quieter leaf edges than the study, and almost no grain: film grain is added once, in the edit,
                # so it doesn't boil differently in every generated clip.
                canopy=dict(rim="#c98a46", rim_k=.4, size=(11, 24), dark_bias=.06), grain=.004)
    return scenes.tension("A", None, shot)


def save(img, name):
    OUT.mkdir(parents=True, exist_ok=True)
    out = (np.clip(img, 0, 1) * 255 + .5).astype(np.uint8)[..., ::-1]
    cv2.imwrite(str(OUT / name), out)
    return OUT / name


if __name__ == "__main__":
    which = sys.argv[1:] or ["start", "end"]
    if "start" in which:
        print(save(frame(EVE_START, ADAM_START), "s13_start.png"))
    if "end" in which:
        print(save(frame(EVE_END, ADAM_END), "s13_end.png"))
