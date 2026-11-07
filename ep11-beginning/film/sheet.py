"""Contact sheet of rendered stills: python3 film/sheet.py out.jpg S01 S02 ... (or all)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
HERE = Path(__file__).resolve().parent
out, ids = sys.argv[1], sys.argv[2:]
src = HERE / "out" / "stills"
ids = ids or sorted(p.stem for p in src.glob("S*.jpg"))
w, h, cols = 270, 480, 6
rows = (len(ids) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 8) + 8, rows * (h + 30) + 8), (24, 22, 20))
d = ImageDraw.Draw(sheet)
for i, sid in enumerate(ids):
    im = Image.open(src / f"{sid}.jpg").resize((w, h), Image.LANCZOS)
    x, y = 8 + (i % cols) * (w + 8), 8 + (i // cols) * (h + 30)
    sheet.paste(im, (x, y))
    d.text((x + 4, y + h + 6), sid, fill=(230, 220, 200))
sheet.save(out, quality=88)
