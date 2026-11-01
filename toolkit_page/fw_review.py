#!/usr/bin/env python3
"""Fourth Watch review pack: the evidence a fresh critic looks at, built from the RENDERED MP4 (never the code).
Version 2026-10-31. Runs next to fw_check.py; it does not replace it.

  python3 fw_review.py --video out/ep.mp4 --round 1 [--subs out/ep.srt] [--moments 6.25,9.05] [--shots qa/video/shots.json] [--out qa/review]

Writes <out>/r<round>/:
  contact_<p>.jpg     2 fps, timestamped, at most 30 frames per page
  strip_fast.jpg      12 consecutive frames at the fastest moment; strip_fast2.jpg at the 2nd (a different moment)
  phone_<p>.jpg       1 fps at 360 px wide, 10 per page: what a phone feed shows. Every must-read word must read here
  safe_<p>.jpg        1 fps with Instagram's covered zones shaded (top 120, bottom 400, right 140 below 45 %, 60 px sides)
  swaps_<p>.jpg       (--subs) the caption band (--caption-band) at every back-to-back caption change: -3, -1, 0, +1, +3 frames
  moments.jpg         (--moments) 8 consecutive frames around each given time (card in/out, cuts, the turn)
  loop_seam.jpg       last 6 frames then the first 6, as the reel repeats
  shots_<p>.jpg       (--shots, from fw_check.py) every shot as three frames: after the cut, the middle, before the next cut,
                      labelled with its time, length and the words spoken over it: does each shot SHOW its clause happening?
  metrics.json        motion peaks, longest still run, max gap between visual changes, near-blank frames,
                      loop seam jump, caption swap overlap, loudness
Needs: python3, numpy, Pillow, ffmpeg/ffprobe.
"""
import argparse, json, os, re, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ZONES = {"top": 120, "bottom": 400, "right": 140, "side": 60, "right_from": 0.45}   # px at 1080x1920 (fw_check.py SAFE)


def font(size):
    for p in ("/System/Library/Fonts/Menlo.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf"):
        try: return ImageFont.truetype(p, size)
        except Exception: pass
    return ImageFont.load_default()
FONT = font(15)


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,r_frame_rate:format=duration", "-of", "json", p], capture_output=True, text=True, check=True)
    j = json.loads(r.stdout); s = j["streams"][0]; n, d = map(int, s["r_frame_rate"].split("/"))
    return s["width"], s["height"], n / d, float(j["format"]["duration"])

def frames(path, w, h, fps=None, gray=False):
    vf = (f"fps={fps}," if fps else "") + f"scale={w}:{h}:flags=area"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "gray" if gray else "rgb24", "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8)
    return a.reshape(-1, h, w) if gray else a.reshape(-1, h, w, 3)

def frames_at(path, idx, w, h):
    idx = sorted(set(int(i) for i in idx))
    sel = "+".join(f"eq(n\\,{i})" for i in idx)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"select='{sel}',scale={w}:{h}:flags=area", "-vsync", "0",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)
    return dict(zip(idx, a))

def tile(ims, cols, labels, out, pad=6, lab=22, bg=(20, 20, 20)):
    w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
    S = Image.new("RGB", (cols * (w + pad) + pad, rows * (h + lab + pad) + pad), bg); d = ImageDraw.Draw(S)
    for i, (im, l) in enumerate(zip(ims, labels)):
        x = pad + (i % cols) * (w + pad); y = pad + (i // cols) * (h + lab + pad)
        S.paste(im, (x, y + lab)); d.text((x + 2, y + 3), l, fill=(235, 235, 235), font=FONT)
    S.save(out, quality=88); return os.path.basename(out)

def paged(ims, labels, per, cols, out_dir, stem):
    names = []
    for p in range(0, len(ims), per):
        names.append(tile(ims[p:p + per], cols, labels[p:p + per], f"{out_dir}/{stem}_{p // per + 1}.jpg"))
    return names

def parse_srt(path):
    txt = open(path, encoding="utf-8").read().replace("\r", "")
    def ts(s):
        h, m, rest = s.split(":"); sec, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
    subs = []
    for block in re.split(r"\n\s*\n", txt.strip()):
        lines = block.strip().split("\n")
        m = next((re.match(r"(\S+)\s*-->\s*(\S+)", l) for l in lines if "-->" in l), None)
        if m: subs.append({"t": ts(m.group(1)), "end": ts(m.group(2)), "text": " ".join(l for l in lines if "-->" not in l and not l.strip().isdigit())})
    return subs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--round", default="1")
    ap.add_argument("--subs")
    ap.add_argument("--moments", default="", help="comma-separated seconds: card in/out, cuts, the turn")
    ap.add_argument("--shots", help="shots.json written by fw_check.py video")
    ap.add_argument("--caption-band", default="0.06,0.34", help="where the burned-in captions sit, as fractions of the height (narration at the top since Oct 31; 0.55,0.80 for lower captions)")
    ap.add_argument("--out", default="qa/review")
    a = ap.parse_args()
    OUT = f"{a.out}/r{a.round}"; os.makedirs(OUT, exist_ok=True)
    V = a.video
    W0, H0, FPS, DUR = probe(V)
    M = {"round": a.round, "video": V, "size": f"{W0}x{H0}", "fps": round(FPS, 3), "duration": round(DUR, 3), "files": []}
    sh = lambda w: int(w * H0 / W0) // 2 * 2

    # 1. contact sheets, 2 fps
    fr = frames(V, 270, sh(270), fps=2)
    M["files"] += paged([Image.fromarray(f) for f in fr], [f"{i / 2:.1f}s" for i in range(len(fr))], 30, 6, OUT, "contact")

    # 2. motion energy per frame: fastest-action strips, still runs, gaps between visual changes, blank frames
    g = frames(V, 135, sh(135), gray=True)          # small and uint8: a 150 s reel at full size would not fit in memory
    NF = len(g)
    energy = np.concatenate([np.abs(np.diff(g[i:i + 301].astype(np.int16), axis=0)).mean(axis=(1, 2)) for i in range(0, NF - 1, 300)]) if NF > 1 else np.zeros(0)
    win = np.convolve(energy, np.ones(12), "valid") if NF > 13 else energy
    peaks = []
    for i in np.argsort(win)[::-1]:
        if all(abs(int(i) - p) > int(0.6 * FPS) for p in peaks): peaks.append(int(i))
        if len(peaks) == 5: break
    for k, c in enumerate(peaks[:2]):
        s = max(0, min(NF - 12, c)); idx = list(range(s, s + 12))
        got = frames_at(V, idx, 320, sh(320))
        M["files"].append(tile([Image.fromarray(got[i]) for i in idx], 6, [f"f{i} {i / FPS:.2f}s" for i in idx],
                               f"{OUT}/strip_fast{'' if k == 0 else 2}.jpg"))
    M["motion_peaks_s"] = [round(p / FPS, 2) for p in peaks]
    # stillness measured the same way fw_check.py does (10 samples/s, mean grey change < 0.05), so the two agree
    st = max(1, int(round(FPS / 10))); g10 = g[::st]
    d10 = np.abs(np.diff(g10.astype(np.int16), axis=0)).mean(axis=(1, 2)) if len(g10) > 1 else np.zeros(0)
    run = best = bi = 0
    for i, s in enumerate(d10 < 0.05):
        run = run + 1 if s else 0
        if run > best: best, bi = run, i
    M["longest_still"] = {"seconds": round(best * st / FPS, 2), "from_s": round((bi - best + 1) * st / FPS, 2),
                          "rule": "nothing static except the held turn; fw_check warns over 1.5 s"}
    ev = np.where((energy > max(1.0, 2.5 * np.median(energy))) & (np.r_[0, energy[:-1]] <= energy) & (np.r_[energy[1:], 0] <= energy))[0]
    ev_t = np.r_[0.0, ev / FPS, DUR]; gaps = np.diff(ev_t); gi = int(np.argmax(gaps))
    M["max_gap_between_visual_changes"] = {"seconds": round(float(gaps[gi]), 2), "from_s": round(float(ev_t[gi]), 2),
                                           "rule": "a new scene every 4-6 s; story shots every 2-5 s"}
    lum = g.reshape(NF, -1)
    blank = np.where(lum.std(1) < 4)[0]; runs = []
    for i in blank:
        if runs and i == runs[-1][1] + 1: runs[-1][1] = int(i)
        else: runs.append([int(i), int(i)])
    M["near_blank_frames"] = [{"from_s": round(x / FPS, 3), "frames": y - x + 1, "mean_luma": int(lum[x].mean())} for x, y in runs]

    # 3. phone test (1 fps at 360 px) and the safe-zone overlay
    ph = sh(360)
    fr = frames(V, 360, ph, fps=1)
    M["files"] += paged([Image.fromarray(x) for x in fr], [f"{i}s" for i in range(len(fr))], 10, 5, OUT, "phone")
    sx, sy = 360 / 1080, ph / 1920
    ims = []
    for x in fr:
        im = Image.fromarray(x).convert("RGBA"); o = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(o)
        red = (255, 0, 80, 80)
        d.rectangle([0, 0, 360, ZONES["top"] * sy], fill=red)
        d.rectangle([0, ph - ZONES["bottom"] * sy, 360, ph], fill=red)
        d.rectangle([360 - ZONES["right"] * sx, ph * ZONES["right_from"], 360, ph - ZONES["bottom"] * sy], fill=red)
        d.rectangle([0, ZONES["top"] * sy, ZONES["side"] * sx, ph - ZONES["bottom"] * sy], fill=(255, 160, 0, 60))
        d.rectangle([360 - ZONES["side"] * sx, ZONES["top"] * sy, 360, ph * ZONES["right_from"]], fill=(255, 160, 0, 60))
        ims.append(Image.alpha_composite(im, o).convert("RGB").resize((216, int(216 * ph / 360))))
    M["files"] += paged(ims, [f"{i}s" for i in range(len(ims))], 30, 10, OUT, "safe")

    # 4. caption swaps: the caption band around every back-to-back change (a double exposure shows here)
    if a.subs and os.path.exists(a.subs):
        subs = parse_srt(a.subs)
        swaps = [(s, n) for s, n in zip(subs, subs[1:]) if n["t"] - s["end"] < 0.6]
        HW, HH = W0 // 2, H0 // 2                       # half size: a long reel's swaps at full size would not fit in memory
        cb = [float(x) for x in a.caption_band.split(",")]
        y0, y1 = int(HH * cb[0]), int(HH * cb[1])
        rows, labels, overlap = [], [], []
        offs = [-3, -1, 0, 1, 3]
        all_idx = [max(0, min(NF - 1, int(round(n["t"] * FPS)) + o)) for _, n in swaps for o in offs]
        got = frames_at(V, all_idx, HW, HH) if all_idx else {}
        def text_rows(i):   # rows of bright caption-like pixels in the band
            b = got[max(0, min(NF - 1, i))][y0:y1].astype(np.float32)
            return ((b.min(2) > 195).sum(1) > 3)
        skipped = 0
        for s, n in swaps:
            c = int(round(n["t"] * FPS))
            if not any(text_rows(c + o).any() for o in offs):   # captions hidden here (title or verse card): nothing to judge
                skipped += 1; continue
            for o in offs:
                i = max(0, min(NF - 1, c + o))
                rows.append(Image.fromarray(got[i][y0:y1]).resize((360, int(360 * (y1 - y0) / HW))))
                labels.append(f"{n['t'] + o / FPS:.2f}s {'>' + n['text'][:14] if o == 0 else ''}")
            # overlap estimate: rows of text pixels (bright, in the band) split into separate line clusters at the swap frame
            lit = text_rows(c)
            clusters = int(np.sum(lit[1:] & ~lit[:-1]) + (1 if lit[0] else 0))
            overlap.append({"t": round(n["t"], 2), "into": n["text"], "text_line_clusters_at_swap": clusters})
        if rows:
            M["files"] += paged(rows, labels, 40, 5, OUT, "swaps")
        M["caption_swaps"] = {"count": len(swaps), "skipped_hidden": skipped, "detail": overlap,
                              "note": "2 clusters at a swap = a push (outgoing above, incoming below), fine; text drawn ON TOP of other text = a double exposure, look at swaps_*.jpg"}

    # 5. named moments: 8 consecutive frames around each
    if a.moments:
        ims, labels = [], []
        for m in [float(x) for x in a.moments.split(",") if x.strip()]:
            c = int(round(m * FPS)); idx = [max(0, min(NF - 1, c + k)) for k in range(-4, 4)]
            got = frames_at(V, idx, 270, sh(270))
            ims += [Image.fromarray(got[i]) for i in idx]; labels += [f"{i / FPS:.2f}s" for i in idx]
        M["files"].append(tile(ims, 8, labels, f"{OUT}/moments.jpg"))

    # 6. loop seam: last 6 frames, then the first 6
    tail = frames_at(V, list(range(NF - 6, NF)), 320, sh(320)); head = frames_at(V, list(range(6)), 320, sh(320))
    seq = [tail[i] for i in range(NF - 6, NF)] + [head[i] for i in range(6)]
    M["files"].append(tile([Image.fromarray(x) for x in seq], 6, [f"end f{NF - 6 + i}" for i in range(6)] + [f"start f{i}" for i in range(6)], f"{OUT}/loop_seam.jpg"))
    M["loop_seam_jump"] = {"value": round(float(np.abs(head[0].astype(float) - tail[NF - 1].astype(float)).mean()), 1),
                           "note": "mean pixel jump last->first frame; a hard cut is 40-80, under 10 reads as continuous"}


    # 8. shot strips: every shot as after-the-cut / middle / before-the-next-cut, with the words spoken over it
    if a.shots and os.path.exists(a.shots):
        shots = [s_ for s_ in json.load(open(a.shots)) if s_["len"] >= 0.4]
        subs = parse_srt(a.subs) if a.subs and os.path.exists(a.subs) else []
        said = lambda t0, t1: " ".join(x["text"] for x in subs if x["t"] < t1 - 0.05 and x["end"] > t0 + 0.05)
        idx = []
        for s_ in shots:
            t0, t1 = s_["t0"], s_["t0"] + s_["len"]
            idx += [min(NF - 1, int(round((t0 + 0.1) * FPS))), min(NF - 1, int(round((t0 + t1) / 2 * FPS))), min(NF - 1, max(0, int(round((t1 - 0.12) * FPS))))]
        got = frames_at(V, idx, 200, sh(200))
        ims, labels = [], []
        for k, s_ in enumerate(shots):
            for j in range(3):
                ims.append(Image.fromarray(got[idx[3 * k + j]]))
                labels.append(f"#{k + 1} {s_['t0']:.1f}s {s_['len']:.1f}s" if j == 0 else (said(s_["t0"], s_["t0"] + s_["len"])[:26] if j == 1 else f"cam {s_.get('camera_pct', 0):.0f}% own {s_.get('own_motion_pct', 0):.0f}%"))
        M["files"] += paged(ims, labels, 18, 6, OUT, "shots")
        M["shots"] = {"count": len(shots), "note": "each row pair = one shot; the three frames should differ by more than the caption: a verb acted, an object changing, a pill landing, or the camera arriving"}

    # 7. loudness
    lo = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", V, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    summ = lo[lo.rfind("Summary"):]
    M["loudness"] = {l.split(":")[0].strip(): l.split(":")[1].strip() for l in summ.splitlines() if l.strip().startswith(("I:", "Peak:"))} or "no audio"

    json.dump(M, open(f"{OUT}/metrics.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in M.items() if k not in ("caption_swaps", "files")}, indent=1))
    if "caption_swaps" in M: print("caption swaps:", M["caption_swaps"]["count"])
    print(f"wrote {OUT}/: " + " ".join(sorted(os.listdir(OUT))))


if __name__ == "__main__":
    main()
