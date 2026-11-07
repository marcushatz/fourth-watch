"""Typography for the film, drawn at full 1080 x 1920 resolution over the picture.

- Captions: the narration, word by word, in Cormorant Garamond italic near the top, with a thin dark stroke over a
  soft feathered scrim. Words light up as they are spoken. Gold marks only the words where God acts.
- Verse cards: the exact ESV words on their own sheet of paper, settling into place, with the reference in Cinzel.
- Reference tags, the big "Where are you?", and the end card.
"""
import re

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

import scenes as C

W, H = 1080, 1920
INK = (36, 28, 20)
CREAM = (246, 238, 220)
GOLDC = (238, 190, 98)


def F(kind, size):
    return C.font(kind, size)


# Captions --------------------------------------------------------------------------------------------

def chunks(words, max_chars=22):
    """Group (word, start, end) into caption lines that break at punctuation or length.
    A book and its chapter and verse ("Acts 17:25") always stay on one line."""
    joined = []
    for w in words:
        if joined and re.match(r"^\d+:\d+", w[0]):
            p = joined.pop()
            w = (p[0] + " " + w[0], p[1], w[2])
        joined.append(w)
    words = joined
    out, cur = [], []
    for w in words:
        cur.append(w)
        text = " ".join(x[0] for x in cur)
        if w[0][-1] in ".?!," and len(text) > 8 or len(text) >= max_chars:
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    # never leave a lone short word on its own line
    merged = []
    for c in out:
        if merged and len(" ".join(x[0] for x in c)) <= 6 and len(" ".join(x[0] for x in merged[-1] + c)) <= max_chars + 6:
            merged[-1] = merged[-1] + c
        else:
            merged.append(c)
    return merged


class Captions:
    def __init__(self, timing, gold_words, hide=(), y=330, size=76):
        self.f = F("italic", size)
        self.y = y
        self.lines = []
        self.gold = gold_words
        for s in timing["shots"]:
            if s["id"] in hide:
                continue
            ws = [(w["w"], w["start"], w["end"]) for w in s["words"]]
            for c in chunks(ws):
                self.lines.append(dict(shot=s["id"], words=c, t0=c[0][1] - .06, t1=c[-1][2]))
        for a, b in zip(self.lines[:-1], self.lines[1:]):
            a["t1"] = min(max(a["t1"] + .35, a["t1"]), b["t0"])
        if self.lines:
            self.lines[-1]["t1"] += .6
        self.ypos = {}

    def at(self, t):
        return [L for L in self.lines if L["t0"] <= t < L["t1"] + .18]

    def draw(self, im, t, y=None):
        """Draw the caption for time t onto a PIL RGBA image. Words appear as they are spoken."""
        lines = self.at(t)
        if not lines:
            return
        L = lines[-1]
        y = int(y or self.y)
        out_fade = float(np.clip((L["t1"] + .18 - t) / .18, 0, 1))
        words = L["words"]
        d = ImageDraw.Draw(im)
        sp = d.textlength(" ", font=self.f)
        widths = [d.textlength(w[0], font=self.f) for w in words]
        total = sum(widths) + sp * (len(words) - 1)
        x0 = (W - total) / 2
        band = Image.new("L", (W, 300), 0)
        bd = ImageDraw.Draw(band)
        x = x0
        alphas = []
        for (w, t0, t1), ww in zip(words, widths):
            a = float(np.clip((t - t0 + .06) / .14, 0, 1)) * out_fade
            alphas.append(a)
            if a > 0:
                bd.text((x, 190), w, font=self.f, fill=int(255 * a), anchor="ls", stroke_width=10)
            x += ww + sp
        # a feathered dark scrim that follows the words (never a box)
        sh = band.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(min(255, v * .78)))
        scrim = Image.new("RGBA", (W, 300), (6, 6, 10, 0))
        scrim.putalpha(sh)
        im.alpha_composite(scrim, (0, y - 190))
        x = x0
        for (w, t0, t1), ww, a in zip(words, widths, alphas):
            key = re.sub(r"[^a-z']", "", w.lower())
            col = GOLDC if (L["shot"], key) in self.gold else CREAM
            if a > 0:
                alpha = int(255 * a)
                d.text((x, y), w, font=self.f, fill=col + (alpha,), anchor="ls", stroke_width=2, stroke_fill=(14, 11, 9, int(alpha * .9)))
            x += ww + sp


# Paper cards -----------------------------------------------------------------------------------------

def paper_sheet(w, h, seed, color=(239, 230, 210)):
    """A sheet of paper with a deckled edge, fibre texture, a lit top edge and a soft drop shadow (RGBA)."""
    r = np.random.default_rng(seed)
    pad = 60
    m = np.zeros((h + 2 * pad, w + 2 * pad), np.float32)
    pts = []
    n = 60
    for i in range(n):
        u = i / n
        pts.append((pad + w * u, pad + r.normal(0, 1.3)))
    for i in range(n // 3):
        u = i / (n // 3)
        pts.append((pad + w + r.normal(0, 1.3), pad + h * u))
    for i in range(n):
        u = 1 - i / n
        pts.append((pad + w * u, pad + h + r.normal(0, 1.3)))
    for i in range(n // 3):
        u = 1 - i / (n // 3)
        pts.append((pad + r.normal(0, 1.3), pad + h * u))
    cv2.fillPoly(m, [np.int32(np.array(pts) * 4)], 1.0, cv2.LINE_AA, shift=2)
    m = cv2.GaussianBlur(m, (0, 0), .7)
    g = r.random((h // 40 + 3, w // 40 + 3)).astype(np.float32)
    tex = cv2.resize(g, (w + 2 * pad, h + 2 * pad), interpolation=cv2.INTER_CUBIC)
    fib = cv2.resize(r.random((h // 6 + 3, w // 60 + 3)).astype(np.float32), (w + 2 * pad, h + 2 * pad), interpolation=cv2.INTER_CUBIC)
    shade = 1 + (tex - .5) * .05 + (fib - .5) * .04
    yy = np.linspace(0, 1, h + 2 * pad)[:, None]
    shade = shade * (1.02 - .05 * yy)
    rgb = np.array(color, np.float32)[None, None] * shade[..., None]
    edge = m - cv2.erode(m, np.ones((3, 3), np.uint8))
    rgb = rgb * (1 - edge[..., None] * .12)
    sh = cv2.GaussianBlur(np.roll(np.roll(m, 14, 0), 6, 1), (0, 0), 14) * .5
    a = np.maximum(m, sh)
    col = rgb * m[..., None] + np.array([10, 8, 6], np.float32) * (1 - m[..., None])
    out = np.dstack([np.clip(col, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(out, "RGBA"), pad


def wrap(text, f, width, d):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=f) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def verse_card(verse, ref, seed=1, width=900):
    f, fr = F("italic", 62), F("caps", 30)
    d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    lines = wrap(verse, f, width - 120, d)
    lh = 76
    h = 70 + len(lines) * lh + 78
    sheet, pad = paper_sheet(width, h, seed)
    d = ImageDraw.Draw(sheet)
    y = pad + 58
    for i, line in enumerate(lines):
        d.text((pad + width / 2, y + i * lh), line, font=f, fill=INK + (255,), anchor="mt")
    ry = y + len(lines) * lh + 14
    rw = d.textlength(ref.upper(), font=fr) + 6 * len(ref)
    d.line((pad + width / 2 - rw / 2 - 40, ry + 15, pad + width / 2 - rw / 2 - 14, ry + 15), fill=(120, 98, 70, 200), width=2)
    d.line((pad + width / 2 + rw / 2 + 14, ry + 15, pad + width / 2 + rw / 2 + 40, ry + 15), fill=(120, 98, 70, 200), width=2)
    spaced(d, ref.upper(), pad + width / 2, ry, fr, (92, 74, 54, 255), 6)
    return sheet


def spaced(d, text, cx, y, f, fill, track):
    ws = [d.textlength(ch, font=f) + track for ch in text]
    x = cx - (sum(ws) - track) / 2
    for ch, w in zip(text, ws):
        d.text((x, y), ch, font=f, fill=fill)
        x += w


def ref_tag(text, seed=2):
    fr = F("caps", 32)
    d = ImageDraw.Draw(Image.new("RGB", (10, 10)))
    w = int(d.textlength(text.upper(), font=fr) + 7 * len(text) + 70)
    sheet, pad = paper_sheet(w, 66, seed)
    d = ImageDraw.Draw(sheet)
    spaced(d, text.upper(), pad + w / 2, pad + 15, fr, (60, 47, 34, 255), 7)
    return sheet


def big_words(text, ref):
    im = Image.new("RGBA", (W, 420), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f, fr = F("italic", 136), F("caps", 40)
    glow = Image.new("RGBA", (W, 420), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.text((W / 2, 150), text, font=f, fill=(255, 214, 140, 150), anchor="mm")
    glow = glow.filter(ImageFilter.GaussianBlur(18))
    im.alpha_composite(glow)
    d.text((W / 2, 150), text, font=f, fill=(250, 240, 218, 255), anchor="mm", stroke_width=2, stroke_fill=(20, 16, 12, 160))
    spaced(d, ref.upper(), W / 2, 262, fr, (236, 222, 196, 230), 8)
    return im


def logo():
    im = Image.new("RGBA", (W, 300), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = F("caps", 64)
    spaced(d, "FOURTH WATCH", W / 2, 110, f, (240, 230, 208, 255), 14)
    d.line((W / 2 - 70, 210, W / 2 + 70, 210), fill=(233, 182, 84, 230), width=3)
    return im


def place_card(frame_img, card, cx, cy, t, t_in, t_out, rise=46, rot0=-1.4):
    """Settle a card into place (rise, turn and fade in), hold, then lift and fade out."""
    if t < t_in - .02 or t > t_out + .45:
        return
    a_in = float(np.clip((t - t_in) / .5, 0, 1))
    e_in = a_in * a_in * (3 - 2 * a_in)
    a_out = float(np.clip((t - t_out) / .42, 0, 1))
    alpha = e_in * (1 - a_out)
    if alpha <= .01:
        return
    dy = (1 - e_in) * rise - a_out * 30
    ang = rot0 * (1 - e_in)
    c = card
    if abs(ang) > .01:
        c = card.rotate(ang, resample=Image.BICUBIC, expand=False)
    if alpha < .999:
        c = c.copy()
        c.putalpha(c.getchannel("A").point(lambda v: int(v * alpha)))
    frame_img.alpha_composite(c, (int(cx - c.width / 2), int(cy - c.height / 2 + dy)))
