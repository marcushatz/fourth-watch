import sys, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(src + "/t_*.png"), key=lambda p: float(p.split("t_")[-1][:-4]))
ims = [Image.open(f).convert("RGB").resize((270, 480)) for f in fs]
cols = 6; rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * 270, rows * 502), "black"); d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * 270, (i // cols) * 502; sheet.paste(im, (x, y + 22)); d.text((x + 6, y + 5), f.split("t_")[-1][:-4] + " s", fill="white")
sheet.save(out, quality=85); print(out, sheet.size)
