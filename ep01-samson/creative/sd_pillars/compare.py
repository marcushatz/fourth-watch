"""Side-by-side frames (v57 master vs the Story Director clip) at the same times, plus a muted sheet (captions cropped)."""
import subprocess, sys
from PIL import Image, ImageDraw
V57 = "../../film27/out/fourth-watch-ep1-samson-v57-final.mp4"
SD = sys.argv[1]; T0 = 103.766667
times = [104.2, 105.8, 107.0, 107.9, 109.1, 110.0, 110.5, 111.3, 112.6, 113.8, 114.9, 116.1]
def grab(src, t, off=0.0):
    out = f"/tmp/claude-0/-home-claude/704396e5-86ac-5e4b-9e33-55e23daaa2f5/scratchpad/g_{abs(hash((src,t)))}.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t - off:.3f}", "-i", src, "-frames:v", "1", out], check=True)
    return Image.open(out).convert("RGB")
W, H = 216, 384
cmp = Image.new("RGB", (len(times) * W, 2 * H + 44), "black"); d = ImageDraw.Draw(cmp)
muted = Image.new("RGB", (6 * 270, 2 * (480 - 118) + 44), "black"); dm = ImageDraw.Draw(muted)
for i, t in enumerate(times):
    a = grab(V57, t); b = grab(SD, t, T0)
    cmp.paste(a.resize((W, H)), (i * W, 22)); cmp.paste(b.resize((W, H)), (i * W, H + 44))
    d.text((i * W + 4, 4), f"{t:.1f}s", fill="white")
    m = b.resize((270, 480)).crop((0, 118, 270, 480))      # the top band (header + burned-in captions) cut away
    x, y = (i % 6) * 270, (i // 6) * (480 - 118 + 22); muted.paste(m, (x, y + 22)); dm.text((x + 4, y + 4), f"frame {i + 1}", fill="white")
d.text((4, H + 26), "Story Director version", fill="#E3B25C"); d.text((60, 4), "            v57 (current)", fill="#E3B25C")
cmp.save("compare_v57_vs_sd.jpg", quality=85); muted.save("muted_sheet.jpg", quality=85); print("ok")
