"""The comparison sheet: the four frames side by side, two of them with their narration caption as it would play, and a strip of
close-ups that checks the cast holds together.
    python sheet.py <frames dir> <out.jpg>"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from frame3 import ASH, GOLD, PARCH, font  # noqa: E402

NIGHT = (20, 16, 13)
FRAMES = [("1_relate.jpg", "1 · RELATE", "A young man alone after a mistake"),
          ("2_reveal.jpg", "2 · REVEAL", "Adam and Eve hide among the trees (Genesis 3:8)"),
          ("3_understand.jpg", "3 · UNDERSTAND", "Genesis 3:9, and our reading, kept apart"),
          ("4_transform.jpg", "4 · TRANSFORM", "The same room, the same man, at first light")]
# Narration from the locked script v11, word for word, set the way the brand sets captions: top third, italic serif, key words in gold.
CAPTIONS = {"2_reveal.jpg": [("Genesis 3:8 says they hear God", ""), ("walking in the garden, and ", ""), ("they hide.", "gold")],
            "4_transform.jpg": [("So when we fail, we don't", ""), ("have to ", ""), ("hide", "gold"), (" from him.", "")]}


def caption(img, runs):
    """Set a caption on a full-resolution frame (1080 wide)."""
    im = Image.fromarray(img).convert("RGBA")
    lay = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = font("cormorant-garamond-latin-500-italic.woff", 66)
    lines, cur = [], []
    for text, kind in runs:
        cur.append((text, kind))
        if text.endswith((" God", "and ", "don't")) or text.endswith("."):
            lines.append(cur)
            cur = []
    if cur:
        lines.append(cur)
    y = 330
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    for ln in lines:
        wsum = sum(d.textlength(t, font=f) for t, _ in ln)
        x = im.size[0] / 2 - wsum / 2
        for t, kind in ln:
            ds.text((x, y), t, font=f, fill=(0, 0, 0, 200))
            d.text((x, y), t, font=f, fill=(GOLD if kind == "gold" else PARCH) + (255,))
            x += d.textlength(t, font=f)
        y += 78
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))
    return np.asarray(Image.alpha_composite(Image.alpha_composite(im, shadow), lay).convert("RGB"))


def build(src, out, crops=None):
    W, Hf, gap, top = 540, 960, 40, 230
    rows_h = Hf + 150
    strip = 300
    total_w = 4 * W + 5 * gap
    total_h = top + rows_h + strip + 120
    sheet = Image.new("RGB", (total_w, total_h), NIGHT)
    d = ImageDraw.Draw(sheet)
    d.text((gap, 70), "FOURTH WATCH · VISUAL IDENTITY PROTOTYPE", font=font("cinzel.ttf", 46), fill=PARCH)
    d.text((gap, 138), "Genesis 3:9, “Where are you?”  Four frames from one episode: three made in Blender from one cast, one typographic.",
           font=font("Inter-400.ttf", 26), fill=ASH)
    fulls = {}
    for i, (name, label, desc) in enumerate(FRAMES):
        img = cv2.imread(str(Path(src) / name))[..., ::-1]
        fulls[name] = img
        if name in CAPTIONS:
            img = caption(img, CAPTIONS[name])
        x = gap + i * (W + gap)
        d.text((x, top - 10), label, font=font("cinzel.ttf", 30), fill=GOLD)
        sheet.paste(Image.fromarray(img).resize((W, Hf), Image.LANCZOS), (x, top + 36))
        d.text((x, top + 36 + Hf + 18), desc, font=font("Inter-400.ttf", 22), fill=ASH)
        if name in CAPTIONS:
            d.text((x, top + 36 + Hf + 50), "Shown with its narration caption from script v11", font=font("Inter-400.ttf", 20), fill=(130, 122, 110))
    y0 = top + rows_h + 40
    d.text((gap, y0 - 6), "ONE CAST, ONE BODY SYSTEM: CLOSE-UPS AT FULL RESOLUTION", font=font("Inter-700.ttf", 22), fill=ASH)
    for j, (name, box, note) in enumerate(crops or []):
        img = fulls[name]
        x0, y_0, x1, y1 = box
        c = Image.fromarray(img[y_0:y1, x0:x1]).resize((strip - 40, strip - 40), Image.LANCZOS)
        x = gap + j * (strip - 40 + 24)
        sheet.paste(c, (x, y0 + 30))
        d.text((x, y0 + 30 + strip - 30), note, font=font("Inter-400.ttf", 18), fill=(150, 142, 130))
    sheet.save(out, quality=92)


if __name__ == "__main__":
    import json
    crops = json.loads(Path(sys.argv[3]).read_text()) if len(sys.argv) > 3 else None
    build(sys.argv[1], sys.argv[2], crops)
    print("wrote", sys.argv[2])
