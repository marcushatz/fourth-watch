"""Style treatments. Each takes 3D passes and returns a finished frame. Every one works differently; none is a filter pass over another."""
import sys
from pathlib import Path

import cv2
import numpy as np
from skimage.segmentation import slic

sys.path.insert(0, str(Path(__file__).parent))
from npr import (Passes, blur, bloom, rays, curve, edge_map, fbm, fog, grain, hexc, impasto, ink, lic, linear, lum, noise, orientation, painter, paper_tex, posterize_light,
                 regions_blur, save, smooth_in, srgb, trace, vignette)

CHAR = (1, 2, 3, 4, 12)
GOLD = np.array([1, .68, .3], np.float32)


def scene_base(p, fog_col=(.05, .085, .16), dist=900, gain=1.5, soft_sky=False):
    cfg = getattr(p, "cfg", None)
    if cfg:
        fog_col, dist, gain = cfg["fog"], dist * cfg["dist"], gain * cfg["gain"]
    img, f = fog(p.C * gain, p.Zb, fog_col, dist, cfg["power"] if cfg else 1.2)
    if getattr(p, "sky", None) is not None:
        s = (p.I < .5).astype(np.float32)[..., None]
        img = img * (1 - s) + (p.sky_soft if soft_sky else p.sky) * s
    return img, f


def atmosphere(p, img, f):
    """Refined stage only: light shafts in the forest and garden, valley mist under the stars."""
    if not getattr(p, "refined", False):
        return img
    h, w = img.shape[:2]
    y = np.arange(h, dtype=np.float32)[:, None]
    if getattr(p, "day", False):
        src = np.clip(lum(img) - .5, 0, 1) * (p.Zb > 500)
        return img + hexc("#ffe2ad")[None, None] * rays(src, (w * .86, -280), steps=44, spread=.02)[..., None] * 1.5
    if getattr(p, "stars", None) is not None:
        mist = np.exp(-((y - 1460) / 110) ** 2) * (.3 + .7 * fbm((h, w), 260, 6, 4)) * (p.I > .5) * (p.I < 6.5)
        return img + hexc("#6d86ad")[None, None] * mist[..., None] * .5
    src = (f > .55).astype(np.float32) * np.clip(1.05 - y / (h * .7), 0, 1)
    return img + hexc("#7f9fd6")[None, None] * rays(src, (w * .14, -340), steps=40, spread=.02)[..., None] * .34


def stars_on(out, p, gain=1.0):
    """Stars are put back after any painting, so they stay crisp pinpoints."""
    if getattr(p, "stars", None) is None:
        return out
    s = (p.I < .5).astype(np.float32) * p.stars
    return out + s[..., None] * np.array([.9, .93, 1], np.float32) * gain


def ramp(L, mask, cols, steps=0, lo=4, hi=97):
    """Map light to a hand-picked colour ramp inside one region."""
    v = L[mask > .5]
    a, b = np.percentile(v, lo), np.percentile(v, hi)
    t = np.clip((L - a) / (b - a + 1e-5), 0, 1)
    if steps:
        k = t * steps
        t = (np.floor(k) + np.clip((k - np.floor(k) - .5) * 9 + .5, 0, 1)) / steps
    c = np.array([hexc(x) for x in cols], np.float32)
    x = np.linspace(0, 1, len(cols))
    return np.stack([np.interp(t, x, c[:, i]) for i in range(3)], -1).astype(np.float32)


def gold_mask(p):
    return blur(p.mask(8), .7)


def outlines(p, width=2.4, seed=1, tn=.5, tz=.01, min_len=14, hair_blur=6, wobble=0, keep=None):
    e = edge_map(p, tn=tn, tz=tz, hair_blur=hair_blur)
    if keep is not None:
        e = e * keep
    return ink(trace(e > .4, min_len), e.shape, width, seed, wobble=wobble)


def s_cinematic(p):
    img, f = scene_base(p)
    img = atmosphere(p, img, f)
    light = np.exp(-(((np.arange(p.w)[None, :] - p.w * .22) / 240) ** 2)) * np.clip(1 - np.arange(p.h)[:, None] / (p.h * 1.0), 0, 1)
    img = img + hexc("#5a78a8")[None, None] * (light * f)[..., None] * .22
    img = img + (blur(p.mask(8), 2.2) * 1.2 + blur(p.mask(8), 18) * 2.6)[..., None] * np.array([1, .62, .22]) * .55
    img = bloom(img, .55, .35)
    out = srgb(img * [1.02, 1, .98])
    return grain(vignette(curve(out, .5), .34), .009)


def s_illustrated(p):
    """Painted shapes in a limited colour ramp, a hand-inked line, and a loose background."""
    img, f = scene_base(p, gain=1.9, soft_sky=True)
    L0 = lum(srgb(img))
    bg = blur(painter(srgb(img), (58, 28, 14), seed=2, length=(5, 12), thresh=.028), 1.2)
    out = linear(bg)
    skin, hair, leaf, fruit = p.mask(1), p.mask(2, 3, 4), p.mask(5), p.mask(12)
    L = regions_blur(L0, p, (1, 5, 12), 5)
    Lh = smooth_in(L0, np.maximum(hair, 1e-3), 6)
    day = getattr(p, "day", False)
    pal = (((leaf, ("#1d3226", "#35553a", "#5c7f55", "#8fa873"), L, 4), (hair, ("#160e0b", "#2b1c15", "#4a3224", "#6e5038"), Lh, 4), (skin, ("#4a2f27", "#8a5a42", "#bb8460", "#dcae86", "#f2d3ae"), L, 5), (fruit, ("#3e1411", "#7c2a20", "#b5482f", "#d97a54"), L, 4))
           if day else ((leaf, ("#07121a", "#10262e", "#1f4344", "#3c6a5c"), L, 4), (hair, ("#0a0c14", "#161b2a", "#2c3650", "#4b5a78"), Lh, 4), (skin, ("#262539", "#54434f", "#94705f", "#cfa487", "#efd2b4"), L, 5)))
    for m, cols, LL, st in pal:
        if m.max() == 0:
            continue
        mm = blur(m, .7)[..., None]
        out = out * (1 - mm) + ramp(LL, m, cols, st) * mm
    ou = srgb(out)
    keep = blur(np.clip(skin + hair + leaf, 0, 1), 1) > .1
    lines = outlines(p, 2.4, tn=.5, tz=.012, keep=keep, wobble=.25, hair_blur=6)
    ou = ou * (1 - lines[..., None] * .9) + (hexc("#0a0e1c") ** (1 / 2.2)) * lines[..., None] * .9
    rim = np.clip(blur(skin, 1.6) - blur(cv2.erode(skin, np.ones((3, 3))), 10), 0, 1)
    ou = ou + hexc("#a9c4f0")[None, None] * rim[..., None] * .22
    g = p.mask(8)
    ou = ou + (blur(g, 1.4) * 1.2 + blur(g, 20) * 1.3)[..., None] * np.array([1, .66, .3]) * .5
    return grain(vignette(curve(stars_on(ou, p), .25), .26), .008)


def s_vector(p, svg=None):
    """Clean shapes traced from the light. Writes a real SVG too."""
    h, w = p.h, p.w
    img, f = scene_base(p, gain=1.7)
    groups = [("bg", np.clip(1 - p.mask(1, 2, 3, 4, 5, 8), 0, 1), ["#101b35", "#16254a", "#1d3160", "#284075", "#35508c"]),
              ("leaf", p.mask(5), ["#071018", "#0c1c26", "#123038", "#1b444a"]),
              ("skin", p.mask(1), ["#2a2533", "#4a3a42", "#6e5450", "#96725f", "#c09a7a"]),
              ("hair", p.mask(2, 3, 4), ["#090b12", "#141823", "#262b3a"])]
    out = np.zeros((h, w, 3), np.float32)
    paths = []
    L = lum(srgb(img))
    SS = 2
    for name, mask, cols in groups:
        mb = (blur(mask, 2.4) > .5).astype(np.float32)
        lv = smooth_in(L, np.maximum(mask, 1e-3), 7 if name != "hair" else 12)
        vals = lv[mask > .5]
        ths = [-1] + [float(np.percentile(vals, q)) for q in np.linspace(100 / len(cols), 100 - 100 / len(cols), len(cols) - 1)]
        for th, c in zip(ths, cols):
            tone = (blur((lv > th).astype(np.float32) * mb, 3.2) > .5).astype(np.uint8)
            cs, _ = cv2.findContours(tone, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_L1)
            big = [q for q in cs if cv2.contourArea(q) > 90]
            if not big:
                continue
            canvas = np.zeros((h * SS, w * SS), np.uint8)
            cv2.drawContours(canvas, [(q * SS).astype(np.int32) for q in big], -1, 255, -1, cv2.LINE_AA)
            cov = cv2.resize(canvas, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            col = hexc(c)
            out = out * (1 - cov[..., None]) + col * cov[..., None]
            for q in big:
                paths.append(f'<path fill="{c}" d="M' + " L".join(f"{a} {b}" for a, b in q[:, 0].tolist()) + 'Z"/>')
    g = p.mask(8)
    out = out + (blur(g, 1) * 1.4 + blur(g, 14) * .9)[..., None] * np.array([1, .62, .22]) * .8
    if svg:
        Path(svg).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">' + "".join(paths) + "</svg>")
    return srgb(out)


def flat_shadow(p, ids, s=4):
    L = lum(p.D)
    return regions_blur(L, p, ids, s)


def s_puppet(p):
    """Flat jointed parts, thick even outlines and solid shadow shapes."""
    h, w = p.h, p.w
    L = flat_shadow(p, (1, 5), 6)
    img, f = scene_base(p)
    F = (blur(f, 3) * 5).astype(np.int32)
    bgcols = [hexc(c) for c in ("#0a1020", "#101a31", "#172541", "#203154", "#2a3f68", "#34507c")]
    out = np.zeros((h, w, 3), np.float32)
    for i, c in enumerate(bgcols):
        out[F == i] = c
    out[F >= len(bgcols)] = bgcols[-1]
    sk = p.mask(1)
    thr = np.percentile(L[sk > .5], 45)
    skin = np.where(L > thr, 1, 0).astype(np.float32)
    skin = (blur(skin, 3) > .5).astype(np.float32)
    col = hexc("#a98068")[None, None] * skin[..., None] + hexc("#3d3244")[None, None] * (1 - skin[..., None])
    out = out * (1 - sk[..., None]) + col * sk[..., None]
    hr = p.mask(2, 3, 4)
    out = out * (1 - hr[..., None]) + hexc("#0e0e15") * hr[..., None]
    lf = p.mask(5)
    l2 = (blur((L > np.percentile(L[lf > .5], 55)).astype(np.float32), 3) > .5).astype(np.float32) if lf.max() else lf
    out = out * (1 - lf[..., None]) + (hexc("#10262a") * l2[..., None] + hexc("#0a1418") * (1 - l2[..., None])) * lf[..., None]
    m = np.clip(sk + hr + lf, 0, 1)
    lines = outlines(p, 5.0, tn=.8, tz=.03, min_len=26, hair_blur=12, keep=blur(m, 2) > .05)
    out = out * (1 - lines[..., None])
    out = out + (blur(p.mask(8), 1.1) * 1.3 + blur(p.mask(8), 12))[..., None] * np.array([1, .62, .22])
    return grain(srgb(out), .006)


def s_minimal(p):
    """One quiet shape, one line and a great deal of room."""
    h, w = p.h, p.w
    y = np.arange(h, dtype=np.float32)[:, None] / h
    bg = (hexc("#1b2638")[None, None] * (1 - y[..., None]) + hexc("#2f3d52")[None, None] * y[..., None])
    bg = np.broadcast_to(bg, (h, w, 3)).copy()
    char = p.mask(*CHAR)
    yy = np.arange(h, dtype=np.float32)[:, None]
    ground = (yy > 1330 + 150 * np.sin(np.arange(w, dtype=np.float32)[None, :] / 700 + 2)).astype(np.float32)
    shape = (blur(char, 9) > .5).astype(np.float32) * (1 - ground)
    shape = blur(shape, 1.1)
    hair = (blur(p.mask(2, 3, 4), 9) > .5).astype(np.float32)
    hair = blur(hair, 1.1)
    light = np.clip((lum(p.D) - .02) * 1.5, 0, 1)
    light = smooth_in(light, np.maximum(char, 1e-3), 30)
    fig = hexc("#a39184") * (.38 + light[..., None] * .5)
    out = bg * (1 - shape[..., None]) + fig * shape[..., None]
    out = out * (1 - hair[..., None]) + hexc("#10141e") * hair[..., None]
    gm = blur(ground, 1.2)
    out = out * (1 - gm[..., None]) + hexc("#0d121b") * gm[..., None]
    g = p.mask(8)
    out = out + (blur(g, .9) * 1.7 + blur(g, 26) * .55)[..., None] * np.array([1, .64, .25]) * .8
    return grain(srgb(out) * paper_tex(out.shape, 8, .025)[..., None], .012)


def s_cel(p):
    """Cel-shaded 3D: graphic light bands on real form, inked from the geometry."""
    h, w = p.h, p.w
    L = flat_shadow(p, (1, 5, 6), 3)
    img, f = scene_base(p, (.055, .1, .2))
    fl = np.floor(blur(f, 2) * 6) / 6
    bg = hexc("#0d1730")[None, None] * (1 - fl[..., None]) + hexc("#47618f")[None, None] * fl[..., None]
    out = bg.astype(np.float32)
    sk = p.mask(1)
    lv = np.percentile(L[sk > .5], [38, 80])
    t = posterize_light(L, [(0, 0), (lv[0], 1), (lv[1], 2)], .006)
    skin = np.stack([np.interp(t, [0, 1, 2], [hexc(c1)[i] for c1 in ("#39303f", "#8b6b5c", "#c6a18a")]) for i in range(3)], -1).astype(np.float32)
    out = out * (1 - sk[..., None]) + skin * sk[..., None]
    hr = p.mask(2, 3, 4)
    Lh = smooth_in(lum(p.D), np.maximum(hr, 1e-3), 5)
    v = np.percentile(Lh[hr > .5], 82)
    hc = np.where(Lh[..., None] > v, hexc("#2a3047"), hexc("#0f1119"))
    out = out * (1 - hr[..., None]) + hc * hr[..., None]
    lf = p.mask(5)
    t2 = (L > np.percentile(L[lf > .5], 60)).astype(np.float32)
    out = out * (1 - lf[..., None]) + (hexc("#1d3b40") * t2[..., None] + hexc("#0b171d") * (1 - t2[..., None])) * lf[..., None]
    m = np.clip(sk + hr + lf, 0, 1)
    lines = outlines(p, 2.8, tn=.5, tz=.012, keep=blur(m, 1.5) > .05, min_len=18, hair_blur=5)
    out = out * (1 - lines[..., None] * .95)
    out = out + (blur(p.mask(8), 1) * 1.5 + blur(p.mask(8), 16) * 1.1)[..., None] * np.array([1, .62, .22])
    return grain(srgb(out), .004)


def kmeans_palette(img, k, seed=1, n=60000):
    r = np.random.default_rng(seed)
    px = img.reshape(-1, 3)
    pick = px[r.choice(len(px), min(n, len(px)), replace=False)].astype(np.float32)
    _, _, c = cv2.kmeans(pick, k, None, (cv2.TERM_CRITERIA_MAX_ITER, 18, 1e-3), 2, cv2.KMEANS_PP_CENTERS)
    return c


def nearest(img, pal):
    d = ((img[..., None, :] - pal[None, None]) ** 2).sum(-1)
    return pal[d.argmin(-1)]


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) / 16 - .47


def s_pixel(p, k=15, scale=9, dither=.04):
    h, w = p.h // scale, p.w // scale
    img, f = scene_base(p, gain=1.9)
    img = srgb(img)
    small = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
    pal = kmeans_palette(curve(small, .5), k)
    t = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w, None]
    q = nearest(np.clip(curve(small, .5) + t * dither, 0, 1), pal)
    e = cv2.resize(outlines(p, 3, tn=.7, tz=.02, min_len=20, hair_blur=8, keep=blur(p.mask(1, 2, 3, 4), 2) > .05), (w, h), interpolation=cv2.INTER_AREA)
    q = q * (1 - (e > .5)[..., None] * .75)
    g = cv2.resize(p.mask(8), (w, h), interpolation=cv2.INTER_AREA)
    q = np.where(g[..., None] > .02, np.array([.96, .78, .4], np.float32), q)
    return cv2.resize(q, (w * scale, h * scale), interpolation=cv2.INTER_NEAREST)


def s_hd2d(p):
    """Pixel sprite in a lit 3D world: sharp sprite, soft world, heavy light."""
    env, f = scene_base(p, gain=1.7)
    m = (blur(p.mask(*CHAR), 1) > .5).astype(np.float32)
    # A soft world, focused only at his depth.
    near = blur(env, 8)
    far = blur(env, 3)
    world = bloom(env * .9, .3, .9)
    world = blur(world, 2) * .6 + near * .4
    world = world + hexc("#6f8fc4")[None, None] * (fbm(env.shape, 240, 3)[..., None] * f[..., None] * .16)
    sc = 8
    h, w = p.h // sc, p.w // sc
    base = srgb(scene_base(p, gain=2.0)[0])
    small = cv2.resize(base * m[..., None], (w, h), interpolation=cv2.INTER_AREA)
    a = cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA)
    px = small / np.maximum(a[..., None], 1e-3)
    pal = kmeans_palette(np.clip(px[a > .5], 0, 1).reshape(-1, 1, 3), 18, n=4000)
    q = nearest(curve(np.clip(px, 0, 1), .6), pal)
    q = cv2.resize(q, (w * sc, h * sc), interpolation=cv2.INTER_NEAREST)
    A = cv2.resize((a > .5).astype(np.float32), (w * sc, h * sc), interpolation=cv2.INTER_NEAREST)
    out = srgb(world)
    sh = blur(np.roll(A, 26, 1), 16) * .45
    out = out[:A.shape[0], :A.shape[1]] * (1 - sh[..., None])
    out = out * (1 - A[..., None]) + q * A[..., None]
    g = p.mask(8)[:A.shape[0], :A.shape[1]]
    out = out + (blur(g, 1.5) * 1.2 + blur(g, 22) * 1.3 + blur(g, 70) * .7)[..., None] * np.array([1, .64, .28]) * .6
    full = np.zeros((p.h, p.w, 3), np.float32)
    full[:A.shape[0], :A.shape[1]] = out
    return grain(vignette(full, .34), .006)


def s_anime(p):
    h, w = p.h, p.w
    env, f = scene_base(p, (.05, .12, .28), 800, 1.6)
    bg = painter(srgb(env), (40, 20, 10), seed=4, length=(6, 14), thresh=.022)
    bg = blur(bg, .8)
    x = np.arange(w, dtype=np.float32)[None, :]
    y = np.arange(h, dtype=np.float32)[:, None]
    ray = (np.sin((x + y * .35) * .022) * .5 + .5) ** 3 * np.clip(1 - y / h, 0, 1) * np.exp(-((x - w * .2) / 330) ** 2)
    bg = bg + hexc("#a9c8ff")[None, None] * ray[..., None] * .13
    sk = p.mask(1)
    L = flat_shadow(p, (1,), 2.4)
    th = np.percentile(L[sk > .5], 40)
    t = np.clip((L - th) / .0035, 0, 1)
    skin = hexc("#5c4f66")[None, None] * (1 - t[..., None]) + hexc("#d2ae97")[None, None] * t[..., None]
    out = linear(bg) * (1 - sk[..., None]) + skin * sk[..., None]
    hr = p.mask(2, 3, 4)
    Lh = smooth_in(lum(p.C), np.maximum(hr, 1e-3), 3)
    v = np.percentile(Lh[hr > .5], [55, 92])
    hc = posterize_light(Lh, [(-1, 0), (v[0], .5), (v[1], 1)], .004)[..., None]
    hair = hexc("#0a0d18") * (1 - hc) + hexc("#2f3a5c") * hc
    out = out * (1 - hr[..., None]) + hair * hr[..., None]
    lf = p.mask(5)
    lc = linear(painter(srgb(env), (16, 8), seed=5, length=(3, 8)))
    out = out * (1 - lf[..., None]) + lc * lf[..., None] * .75
    m = np.clip(sk + hr, 0, 1)
    lines = outlines(p, 1.7, tn=.42, tz=.009, keep=blur(m, 1.5) > .05, min_len=10, hair_blur=3)
    out = out * (1 - lines[..., None] * .9) + hexc("#10102a") * lines[..., None] * .9
    g = p.mask(8)
    out = out + (blur(g, 1.2) * 1.6 + blur(g, 18) * 1.5 + blur(g, 60) * .6)[..., None] * np.array([1, .62, .24]) * .6
    return grain(vignette(curve(srgb(bloom(out, .5, .3)), .28), .24), .006)


def s_gouache(p):
    h, w = p.h, p.w
    img, f = scene_base(p, (.06, .1, .17), 900, 1.8)
    ref = srgb(img)
    pal = kmeans_palette(ref, 22, 3)
    ref2 = blur(nearest(ref, pal), 2.2) * .75 + ref * .25
    ang = orientation(lum(ref), 9)
    paint = painter(ref2, (46, 24, 12, 6), angle=ang, seed=7, length=(3, 8), thresh=.05, jitter=.03, bg=np.full_like(ref, .86) * np.array([1, .96, .86], np.float32))
    paint = impasto(paint, ang, .09, seed=4)
    m = blur(np.clip(p.mask(*CHAR) + p.mask(5), 0, 1), 1) > .05
    lines = outlines(p, 3.0, tn=.65, tz=.016, keep=m, wobble=.35, min_len=18, hair_blur=7)
    dry = fbm((h, w), 4, 9, 3)
    lines = lines * np.clip((dry - .25) * 4, 0, 1)
    out = paint * (1 - lines[..., None] * .9) + np.array([.07, .06, .08]) * lines[..., None] * .9
    edge = fbm((h, w), 50, 11, 5)
    xx, yy = np.meshgrid(np.arange(w), np.arange(h))
    d = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
    border = np.clip((d - 26 - edge * 44) / 5, 0, 1)
    paper = np.array([.93, .9, .82], np.float32) * paper_tex((h, w, 3), 3, .05)[..., None]
    out = paper * (1 - border[..., None]) + out * border[..., None]
    return out


def s_painterly3d(p):
    """Real 3D form and light, with brushwork on the surfaces and crisp silhouettes."""
    img, f = scene_base(p, gain=1.75, soft_sky=True)
    img = atmosphere(p, img, f)
    img = img + (blur(p.mask(8), 2) * 1.2 + blur(p.mask(8), 20) * 2.2)[..., None] * np.array([1, .62, .22]) * .5
    ref = srgb(bloom(img, .55, .3))
    # Shadows pull toward violet, lights toward warm, as a painter would mix them.
    L = lum(ref)[..., None]
    ref = ref * (1 + (L - .35) * np.array([.35, .02, -.3]))
    N = p.N
    ang = np.arctan2(-N[..., 0], N[..., 2] + 1e-3)
    ang = blur(ang, 4)
    paint = painter(np.clip(ref, 0, 1), (18, 9, 5), angle=ang, seed=3, length=(3, 7), thresh=.02, bg=blur(ref, 3).astype(np.float32), jitter=.024)
    m = blur(p.mask(*CHAR), .8)
    edge = np.clip(blur(m, 1.6) - cv2.erode(m, np.ones((5, 5))), 0, 1)
    out = paint * (1 - edge[..., None] * .75) + ref * edge[..., None] * .75
    out = impasto(np.clip(out, 0, 1), ang, .028, seed=6)
    return grain(vignette(curve(stars_on(out, p), .3), .3), .006)


def s_whiteboard(p):
    h, w = p.h, p.w
    board = np.array([.955, .955, .94], np.float32) * (1 - (fbm((h, w), 240, 5) - .5)[..., None] * .05)
    board = board - (noise((h, w), 2, 3)[..., None] - .5) * .012
    m = np.clip(p.mask(*CHAR) + p.mask(5), 0, 1)
    lines = outlines(p, 3.6, tn=.55, tz=.012, keep=blur(m, 2) > .05, wobble=.5, min_len=16, hair_blur=5)
    L = lum(srgb(scene_base(p, gain=2.2)[0]))
    th, ca = 8, np.cos(np.radians(-52))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    wob = (fbm((h, w), 70, 7) - .5) * 26
    ph = ((xx * np.sin(np.radians(52)) + yy * np.cos(np.radians(52)) + wob) / 11) % 1
    dark = np.clip(.62 - L, 0, 1) * 1.6 * blur(m, 2)
    hatch = np.clip((dark * .55 - np.abs(ph - .5)) * 14, 0, 1)
    hair = blur(p.mask(2, 3, 4), 1)
    ph2 = ((xx * .94 + yy * .34 + wob) / 7) % 1
    hatch = np.maximum(hatch, hair * np.clip((.36 - np.abs(ph2 - .5)) * 12, 0, 1))
    ink_ = np.clip(lines + hatch, 0, 1)
    out = board * (1 - ink_[..., None] * .96) + np.array([.04, .05, .07]) * ink_[..., None] * .96
    g = cv2.dilate(p.mask(8), np.ones((5, 5)))
    return grain(out * (1 - g[..., None]) + np.array([.87, .6, .16], np.float32) * g[..., None], .004)


def s_editorial(p):
    h, w = p.h, p.w
    paper = np.array([.93, .9, .83], np.float32) * paper_tex((h, w, 3), 6, .035)[..., None]
    L = lum(srgb(scene_base(p, gain=2.0)[0]))
    m = np.clip(p.mask(*CHAR) + p.mask(5), 0, 1)
    tex = fbm((h, w), 3, 4, 3)
    streak = lic(orientation(L, 9), (h, w), seed=9)
    night_land = getattr(p, "stars", None) is not None
    a, b = (.16, .3) if night_land else (.45, .62)
    if not night_land and not getattr(p, "day", False):
        bgv = L[(p.I < .5) | (p.I > 5.5)]
        a, b = float(np.percentile(bgv, 30)), float(np.percentile(bgv, 68))
    wash = blur((L < b).astype(np.float32) * (1 - m), 2)
    wash2 = blur((L < a).astype(np.float32) * (1 - m), 2)
    day = getattr(p, "day", False)
    c1 = hexc("#9fae8f" if day else "#54708f") ** (1 / 2.2)
    c2 = hexc("#4f6650" if day else "#1d2c44") ** (1 / 2.2)
    if night_land:
        land = (p.I > .5).astype(np.float32)
        vals = L[(p.I > 5.5) & (p.I < 6.5)]
        wash = blur((L < np.percentile(vals, 62)).astype(np.float32) * land + (1 - land), 1.2)
        wash2 = blur((L < np.percentile(vals, 24)).astype(np.float32) * land + (1 - land), 1.2)
    ground = paper
    if not night_land and not day:                      # a forest at night has no bare paper in it
        ground = np.broadcast_to(hexc("#5f7a9b") ** (1 / 2.2), paper.shape) * paper_tex(paper.shape, 6, .03)[..., None]
        c1 = hexc("#32496b") ** (1 / 2.2)
        c2 = hexc("#172338") ** (1 / 2.2)
    cold = ground * (1 - wash[..., None]) + c1 * wash[..., None]
    cold = cold * (1 - wash2[..., None]) + c2 * wash2[..., None]
    th = np.percentile(L[p.mask(1) > .5], 38)
    black = np.clip((th + streak * .02 + (tex - .5) * .05 - blur(L, 1.5)) * 22, 0, 1)
    black = np.maximum.reduce([black * blur(m, 1), blur(p.mask(2, 3, 4), 1), p.mask(5) * .94, p.mask(7) * (0 if getattr(p, "day", False) else .96)])
    skin = p.mask(1)
    out = cold * (1 - skin[..., None]) + (c1 if night_land else paper) * skin[..., None]
    lines = outlines(p, 4.2, tn=.65, tz=.02, keep=blur(m, 2) > .05, wobble=.4, min_len=20, hair_blur=6)
    ink_ = np.clip(black + lines, 0, 1)
    out = out * (1 - ink_[..., None]) + np.array([.055, .05, .06]) * ink_[..., None]
    fr = blur(p.mask(12), .8)
    out = out * (1 - fr[..., None]) + np.array([.76, .31, .18], np.float32) * fr[..., None]
    if getattr(p, "stars", None) is not None:
        s = np.clip(p.stars * 2.4, 0, 1) * (p.I < .5)
        out = out * (1 - s[..., None]) + np.array([.93, .9, .83], np.float32) * s[..., None]
    g = cv2.dilate(p.mask(8), np.ones((3, 3)))
    return out * (1 - g[..., None]) + np.array([.86, .62, .22], np.float32) * g[..., None]


def s_storybook(p):
    img, f = scene_base(p, (.05, .085, .15), 900, 1.9, soft_sky=True)
    img = atmosphere(p, img, f)
    img = img + (blur(p.mask(8), 2.4) * 1.1 + blur(p.mask(8), 26) * 2.6 + blur(p.mask(8), 90) * 1.2)[..., None] * np.array([1, .6, .22]) * .5
    ref = srgb(img)
    L = lum(ref)[..., None]
    ref = np.clip(ref * (1 + (L - .3) * np.array([.45, .05, -.35])), 0, 1)
    ang = orientation(lum(ref), 18)
    paint = painter(ref, (70, 36, 18, 9, 4), angle=ang, seed=9, length=(5, 12), thresh=.018, jitter=.02)
    m = blur(p.mask(*CHAR), 2)
    fine = painter(ref, (5, 3), angle=orientation(lum(ref), 5), seed=4, length=(2, 5), thresh=.012, jitter=.012, bg=paint)
    paint = paint * (1 - m[..., None]) + fine * m[..., None]
    out = blur(paint, .9) * (1 - m[..., None]) + paint * m[..., None]
    fg = blur(p.mask(5), 2)
    out = out * (1 - fg[..., None]) + blur(paint, 2.2) * fg[..., None]
    out = impasto(out, ang, .024, seed=8)
    return grain(vignette(curve(stars_on(out, p), .35), .34), .007)


def hatch_field(p, ids, angle, spacing, warp):
    h, w = p.h, p.w
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    N = blur(p.N, 3)
    t = np.radians(angle)
    return (xx * np.cos(t) + yy * np.sin(t) + (N[..., 0] * np.cos(t + 1.57) + N[..., 2] * np.sin(t + 1.57)) * warp) / spacing


def s_engraving(p, paper_col=(.93, .9, .82), ink_col=(.05, .045, .05), spacing=7):
    """Lines that swell with the shadow and bend over the form, in the tradition of Bible engravings."""
    h, w = p.h, p.w
    L = lum(srgb(scene_base(p, (.33, .36, .4), 1000, 3.6)[0]))
    L = np.clip(curve(L, .9) * 1.06, 0, 1)
    if getattr(p, "stars", None) is not None:
        L = np.where(p.I > 6.5, L * .55, np.where(p.I > .5, np.clip(L * 2.1 + .06, 0, 1), L * .5))
    tot = np.zeros((h, w), np.float32)
    for ids, a1, a2, sp, warp in (((1,), 66, -24, spacing, 22), ((2, 3, 4), 80, 20, spacing * .8, 12), ((5,), 35, -55, spacing, 14), ((6, 7, 0), 86, 30, spacing, 8)):
        mask = p.mask(*ids) if ids != (6, 7, 0) else np.clip(1 - p.mask(1, 2, 3, 4, 5), 0, 1)
        ph = hatch_field(p, ids, a1, sp, warp)
        tone = np.clip(1 - blur(L, 1.2), 0, 1)
        s = np.abs(((ph % 1) - .5) * 2)
        line1 = np.clip((tone * 1.35 - s) * 6, 0, 1)
        ph2 = hatch_field(p, ids, a2, sp, warp)
        s2 = np.abs(((ph2 % 1) - .5) * 2)
        line2 = np.clip(((tone - .52) * 2.0 - s2) * 6, 0, 1)
        tot = np.maximum(tot, np.maximum(line1, line2) * mask)
    m = np.clip(p.mask(*CHAR) + p.mask(5), 0, 1)
    lines = outlines(p, 2.0, tn=.55, tz=.012, keep=blur(m, 2) > .05, min_len=14, hair_blur=4)
    ink_ = np.clip(tot + lines, 0, 1)
    if getattr(p, "stars", None) is not None:
        ink_ = ink_ * (1 - np.clip(p.stars * 3, 0, 1) * (p.I < .5))
    paper = np.array(paper_col, np.float32) * paper_tex((h, w, 3), 4, .03)[..., None]
    out = paper * (1 - ink_[..., None]) + np.array(ink_col, np.float32) * ink_[..., None]
    g = cv2.dilate(p.mask(8), np.ones((3, 3)))
    return out * (1 - g[..., None]) + np.array([.82, .6, .22], np.float32) * g[..., None]


def s_glass(p):
    h, w = p.h, p.w
    img, f = scene_base(p, gain=2.2)
    ref = srgb(img)
    s = 4
    small = cv2.resize(ref, (w // s, h // s), interpolation=cv2.INTER_AREA)
    ids = cv2.resize(p.I, (w // s, h // s), interpolation=cv2.INTER_NEAREST)
    feat = np.dstack([small, ids[..., None] * .22])
    lab = slic(feat, n_segments=620, compactness=.11, sigma=1, channel_axis=2, enforce_connectivity=True, convert2lab=False, start_label=0)
    n = lab.max() + 1
    cnt = np.bincount(lab.ravel(), minlength=n).astype(np.float32)
    col = np.stack([np.bincount(lab.ravel(), small[..., i].ravel(), minlength=n) / cnt for i in range(3)], -1)
    # Glass is saturated and clean: push each pane toward its hue.
    g = col.mean(1, keepdims=True)
    day = getattr(p, "day", False)
    col = np.clip(g + (col - g) * (1.75 if day else 2.2), 0, 1) * (.84 if day else 1.05)
    big = cv2.resize(lab.astype(np.int32).astype(np.float32), (w // s * s, h // s * s), interpolation=cv2.INTER_NEAREST).astype(np.int32)
    out = np.zeros((h, w, 3), np.float32)
    b = col[big]
    out[:b.shape[0], :b.shape[1]] = b
    tex = 1 + (fbm((h, w), 46, 3, 4) - .5) * .5 + (fbm((h, w), 7, 8, 3) - .5) * .16
    back = .55 + .75 * np.exp(-(((np.arange(w)[None, :] - w * (.5 if getattr(p, "day", False) else .2)) / 420) ** 2)) * np.exp(-((np.arange(h)[:, None] - h * .4) / 800) ** 2)
    out = linear(out) * tex[..., None] * back[..., None] * 1.7
    labs = np.zeros((h, w), np.int32)
    labs[:big.shape[0], :big.shape[1]] = big
    edge = ((np.abs(cv2.Sobel(labs.astype(np.float32), cv2.CV_32F, 1, 0, ksize=3)) + np.abs(cv2.Sobel(labs.astype(np.float32), cv2.CV_32F, 0, 1, ksize=3))) > .5).astype(np.uint8)
    lead = blur(cv2.dilate(edge, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))).astype(np.float32), .9)
    out = bloom(out, .55, .45)
    g2 = cv2.dilate(p.mask(8), np.ones((7, 7)))
    out = out * (1 - g2[..., None]) + np.array([2.4, 1.6, .6], np.float32) * g2[..., None]
    out = bloom(out, .9, .35)
    out = out * (1 - lead[..., None]) + np.array([.008, .008, .012]) * lead[..., None]
    if getattr(p, "stars", None) is not None:
        out = out + blur(p.stars * (p.I < .5), 1.1)[..., None] * np.array([1, 1, 1.1]) * 3
    sh = cv2.Sobel(blur(lead, 1.2), cv2.CV_32F, 1, 1, ksize=3)
    out = out + np.clip(-sh, 0, 1)[..., None] * .05
    return srgb(out)


STYLES = {"01_illustrated_25d": s_illustrated, "02_premium_vector": s_vector, "03_illustrated_puppet": s_puppet, "04_philosophical_minimal": s_minimal, "05_cinematic_3d": s_cinematic,
          "06_cel_shaded_3d": s_cel, "07_hd2d_pixel": s_hd2d, "08_retro_pixel": s_pixel, "11_mature_anime": s_anime, "12_gouache_ink": s_gouache, "13_painterly_3d": s_painterly3d,
          "15_whiteboard": s_whiteboard, "16_editorial_ink": s_editorial, "19_painted_storybook": s_storybook, "21_engraving": s_engraving, "22_stained_glass": s_glass}


def s_lowpoly(p):
    img, f = scene_base(p, (.06, .1, .19), 1000, 1.5)
    img = img + (blur(p.mask(8), 2) * 1.2 + blur(p.mask(8), 20) * 2)[..., None] * np.array([1, .62, .22]) * .5
    return grain(vignette(curve(srgb(bloom(img, .6, .25)), .35), .3), .006)


def s_mini(p):
    img, f = fog(p.C * 1.35, p.Zb, (.02, .03, .05), 2600)
    img = img + (blur(p.mask(8), 3) * .9 + blur(p.mask(8), 26) * 1.6)[..., None] * np.array([1, .6, .22]) * .5
    return grain(vignette(curve(srgb(bloom(img, .7, .3)), .32), .34), .007)


def s_brick(p):
    img, f = fog(p.C * 1.3, p.Zb, (.03, .05, .1), 1100)
    img = img + (blur(p.mask(8), 3) * .8 + blur(p.mask(8), 22) * 1.4)[..., None] * np.array([1, .6, .22]) * .5
    return grain(vignette(curve(srgb(bloom(img, .75, .3)), .3), .3), .006)
