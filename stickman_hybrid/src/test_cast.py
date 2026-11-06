import sys, time
import numpy as np, cv2
sys.path.insert(0, '.')
import cast as C

PAL = {
 "A": dict(adam=dict(body=C.hexc("#9a6040"), hair=C.hexc("#3a2418")), eve=dict(body=C.hexc("#9c5c63"), hair=C.hexc("#3a1914"))),
 "B": dict(adam=dict(body=C.hexc("#b0704a"), hair=C.hexc("#3d2819")), eve=dict(body=C.hexc("#a86870"), hair=C.hexc("#4a2219"))),
 "C": dict(adam=dict(body=C.hexc("#b77a4e"), hair=C.hexc("#4a3020")), eve=dict(body=C.hexc("#b8707a"), hair=C.hexc("#5a2a20"))),
}
for v in PAL.values():
    for d in v.values():
        d.update(fruit=C.hexc("#c2502e"), stem=C.hexc("#3a2a1c"), leaf=C.hexc("#4f6a2e"))
LIGHT = dict(
 awe=dict(dir=(-.45, -.8, .4), col=(.6, .72, 1.0), k=.9, amb=(.05, .07, .13), rim=1.1),
 tension=dict(dir=(-.9, -.25, .35), col=(1.0, .72, .42), k=1.3, amb=(.13, .11, .10), rim=1.2, bounce=(.2, .18, .1)),
 fear=dict(dir=(-.95, -.1, .3), col=(1, .62, .3), k=.6, amb=(.04, .07, .08), rim=1.0),
)
BG = dict(awe=("#1a2840", "#0b1220"), tension=("#d9b77a", "#6c6a48"), fear=("#16302f", "#081414"))
SC = dict(awe=[(C.ADAM_AWE, 560, 1525, 42, 1, "adam")],
          tension=[(C.EVE_TENSION, 300, 1560, 96, .94, "eve"), (C.ADAM_TENSION, 740, 1560, 96, 1, "adam")],
          fear=[(C.ADAM_FEAR, 560, 1600, 112, 1, "adam")])
crops = dict(awe=(1120, 1560, 380, 740), tension=(740, 1590, 150, 1000), fear=(1100, 1640, 480, 840))
rows = []
for st in "ABC":
    row = []
    for sc in ("awe", "tension", "fear"):
        t0 = time.time()
        figs = [(p, ox, gy, u, s, PAL[st][who]) for p, ox, gy, u, s, who in SC[sc]]
        rgb, a = C.draw(figs, st, LIGHT[sc])
        Y = np.linspace(0, 1, 1920)[:, None, None]
        bg = C.hexc(BG[sc][0]) * (1 - Y) + C.hexc(BG[sc][1]) * Y
        bg = np.broadcast_to(bg, (1920, 1080, 3)).copy()
        img = bg * (1 - a[..., None]) + rgb
        img = np.clip(img, 0, 1) ** (1 / 2.2)
        y0, y1, x0, x1 = crops[sc]
        cr = (img[y0:y1, x0:x1] * 255).astype(np.uint8)[..., ::-1]
        cr = cv2.resize(cr, (int(cr.shape[1] * 600 / cr.shape[0]), 600), interpolation=cv2.INTER_AREA)
        row.append(cr)
        print(st, sc, round(time.time() - t0, 1), flush=True)
    rows.append(np.hstack(row))
w = max(r.shape[1] for r in rows)
cv2.imwrite('/home/claude/fw-tools/out/cast.jpg', np.vstack([np.pad(r, ((0, 0), (0, w - r.shape[1]), (0, 0))) for r in rows]), [cv2.IMWRITE_JPEG_QUALITY, 90])
