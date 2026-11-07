"""Frame 3, UNDERSTAND: Genesis 3:9 set as the image. The verse is Scripture, exact ESV. Our reading sits below it,
labelled, in a different typeface and colour, so nobody mistakes one for the other.
    python frame3.py <plate.jpg> <out.jpg>
The plate is the garden from frame 2 without the two of them (scene_eden.py ... plate, then look.py ... plate)."""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT_DIRS = [Path("/home/claude/fw-tools/fonts"), Path("/home/claude/fw-tools/fonts/x_fontsource-cormorant-garamond-5.3.0/package/files"),
             Path("/home/claude/marcushatz/fourth-watch/ep01-samson/film27/engine/fonts")]


def font(name, size):
    for d in FONT_DIRS:
        if (d / name).exists():
            return ImageFont.truetype(str(d / name), size)
    raise FileNotFoundError(name)


PARCH = (242, 230, 207)          # Parchment #F2E6CF
GOLD = (227, 178, 92)            # Lamp gold #E3B25C
ASH = (176, 166, 150)            # a lighter Ash, for small type on dark

# The verse, exact ESV (Genesis 3:9). LORD is set in small capitals, as the ESV prints it.
VERSE_1 = [("But the ", "i"), ("Lord", "sc"), (" God called", "i")]
VERSE_2 = [("to the man and said to him,", "i")]
QUESTION = "“Where are you?”"
REF = "GENESIS 3:9  ·  ESV"
READING_LABEL = "OUR READING"
READING = ["God didn't need the answer. No creature", "is hidden from his sight (Hebrews 4:13).",
           "So the question wasn't to inform him.", "It gave Adam the chance to answer."]


def draw_runs(d, x, y, runs, size, fill, ss):
    """Italic text with true small capitals for LORD."""
    it = font("cormorant-garamond-latin-500-italic.woff", size * ss)
    sc_big = font("cormorant-garamond-latin-500-normal.woff", size * ss)
    sc_small = font("cormorant-garamond-latin-500-normal.woff", int(size * .74) * ss)
    pieces = []
    for text, kind in runs:
        if kind == "sc":
            pieces.append((text[0], sc_big))
            pieces.append((text[1:].upper(), sc_small))
        else:
            pieces.append((text, it))
    width = sum(d.textlength(t, font=f) for t, f in pieces)
    cx = x * ss - width / 2
    base = y * ss
    for t, f in pieces:
        asc = f.getmetrics()[0]
        d.text((cx, base - asc), t, font=f, fill=fill)
        cx += d.textlength(t, font=f)
    return width / ss


def compose(plate_path, out_path):
    img = cv2.imread(str(plate_path))[..., ::-1].astype(np.float32) / 255
    h, w = img.shape[:2]
    # Push the garden back: darker, softer at the top where the words sit, the light kept low and warm.
    yy = np.linspace(0, 1, h)[:, None, None]
    soft = cv2.GaussianBlur(img, (0, 0), 7)
    img = img * (yy > .62) + soft * (yy <= .62) * 1.0
    img = img * (.42 + .58 * np.clip((yy - .25) / .6, 0, 1) ** 1.2)
    ss = 2
    canvas = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((w * ss, h * ss), Image.LANCZOS)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = w / 2
    # A thin gold thread from the light below up to the words: the call coming through the garden (a picture, not a claim).
    ys, xs = np.nonzero((img[..., 0] > .55) & (img[..., 1] > .4) & (yy[..., 0] > .55))
    lx, ly = (float(np.median(xs)), float(np.median(ys))) if len(xs) > 30 else (w * .3, h * .72)
    pts = []
    for t in np.linspace(0, 1, 90):
        x = lx + (cx - lx) * t ** 1.6 + 26 * np.sin(t * 7.5) * (1 - t)
        y = ly + (842 - ly) * t
        pts.append((x * ss, y * ss))
    for i in range(len(pts) - 1):
        a = int(235 * (1 - .75 * i / len(pts)))
        d.line([pts[i], pts[i + 1]], fill=GOLD + (a,), width=int(3 * ss))
    # Scripture.
    d.text((cx * ss, 360 * ss), REF, font=font("cinzel.ttf", 30 * ss), fill=GOLD + (235,), anchor="mm")
    d.line([((cx - 46) * ss, 400 * ss), ((cx + 46) * ss, 400 * ss)], fill=GOLD + (200,), width=2 * ss)
    draw_runs(d, cx, 500, VERSE_1, 64, PARCH + (250,), ss)
    draw_runs(d, cx, 580, VERSE_2, 64, PARCH + (250,), ss)
    d.text((cx * ss, 760 * ss), QUESTION, font=font("cormorant-garamond-latin-500-italic.woff", 138 * ss), fill=PARCH + (255,), anchor="mm")
    # Our reading: a different voice, boxed and labelled, never in the verse's typeface.
    bx0, by0, bx1 = 130, 1150, 950
    lh = 54
    by1 = by0 + 92 + lh * len(READING) + 26
    d.rounded_rectangle([bx0 * ss, by0 * ss, bx1 * ss, by1 * ss], radius=18 * ss, fill=(20, 16, 13, 168), outline=ASH + (150,), width=int(1.5 * ss))
    d.text(((bx0 + 40) * ss, (by0 + 46) * ss), READING_LABEL, font=font("Inter-700.ttf", 24 * ss), fill=ASH + (255,), anchor="lm")
    for i, line in enumerate(READING):
        d.text(((bx0 + 40) * ss, (by0 + 104 + i * lh) * ss), line, font=font("Inter-400.ttf", 36 * ss), fill=(226, 218, 204, 255), anchor="lm")
    canvas = Image.alpha_composite(canvas.convert("RGBA"), layer).convert("RGB").resize((w, h), Image.LANCZOS)
    out = np.asarray(canvas).astype(np.float32) / 255
    rng = np.random.default_rng(9)
    out = np.clip(out + rng.normal(0, .009, out.shape[:2])[..., None], 0, 1)
    cv2.imwrite(str(out_path), (out * 255 + .5).astype(np.uint8)[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 94])


if __name__ == "__main__":
    compose(sys.argv[1], sys.argv[2])
    print("wrote", sys.argv[2])
