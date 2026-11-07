"""The Genesis storyboard: ten key frames of the locked script v11 (ep11-beginning/script_approved.md), as Blender scenes.

    python sb_frames.py <frame> [width] [samples]        frames: f01 ... f10 (f07 is Eden v2, rendered by eden_v2/scene_e2.py)
then sb_finish.py <frame>. Every frame is 9:16. God is never shown: gold light marks only where God acts.
"""
import math
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import sb_stage as sb  # noqa: E402
from sb_stage import L, P, pl, s3, st, blob, merge  # noqa: E402
import scene_e2 as e2  # noqa: E402
from scene_s26 import trunk_mesh  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")


# ------------------------------------------------------------------ helpers

def cam_basis(c):
    eye, tgt = np.array(c["loc"], float), np.array(c["target"], float)
    f = tgt - eye
    f /= np.linalg.norm(f)
    r = np.cross(f, [0, 0, 1.0])
    r /= np.linalg.norm(r)
    return eye, f, r, np.cross(r, f)


def project(c, p, W=1080, H=1920):
    eye, f, r, u = cam_basis(c)
    d = np.asarray(p, float) - eye
    k = c["lens"] / 18.0 * H / 2
    z = d @ f
    return np.array([W / 2 + k * (d @ r) / z, H / 2 - k * (d @ u) / z, z])


def unproject(c, px, py, dist, W=1080, H=1920):
    eye, f, r, u = cam_basis(c)
    k = c["lens"] / 18.0 * H / 2
    return eye + f * dist + r * (px - W / 2) / k * dist + u * (H / 2 - py) / k * dist


def obj(name, VF, mat, index, smooth=True, shadow=True):
    o = e2.obj(name, VF, mat, index, smooth)
    if o is not None and not shadow:
        o.visible_shadow = False
    return o


def ground(M, size=(3000, 6000), centre=(0, -1500), amp=(6, 3), flat=None, mat="ground", z=0.0, n=140):
    gx, gy = np.meshgrid(np.linspace(-size[0] / 2, size[0] / 2, n) + centre[0], np.linspace(-size[1] / 2, size[1] / 2, n) + centre[1])
    gz = amp[0] * np.sin(gx * .011 + 1) * np.sin(gy * .008) + amp[1] * np.sin(gx * .03 + gy * .021)
    if flat is not None:
        (fx, fy), fr = flat
        gz *= np.clip(np.hypot(gx - fx, gy - fy) / fr, .15, 1)
    V = np.c_[gx.ravel(), gy.ravel(), gz.ravel() + z - 1]
    F = [[i * n + j, i * n + j + 1, (i + 1) * n + j + 1, (i + 1) * n + j] for i in range(n - 1) for j in range(n - 1)]
    return obj("ground", (V, np.array(F)), M[mat], 7)


def garden_layers(M, rng, cam, keep_clear=(), n_trunks=110, n_shrubs=40, depth=(-300, -4000), lane=None, ferns=60, fern_zone=None, trunk_h=1050,
                  canopy_z=(480, 680)):
    """Trunks, leafy masses, ferns and a canopy receding into haze. keep_clear: (pixel x, pixel y, radius px) to leave open."""
    parts = []
    for i in range(n_trunks):
        y = depth[0] - rng.random() ** 1.15 * (depth[0] - depth[1])
        x = cam["loc"][0] + rng.uniform(-1, 1) * (250 + (cam["loc"][1] - y) * .5)
        px = project(cam, (x, y, 200))
        if any(abs(px[0] - kx) < kr and px[2] > 0 for kx, ky, kr in keep_clear):
            continue
        if lane and lane[0] < px[0] < lane[1] and y > lane[2]:
            continue
        V, F = trunk_mesh(x, y, rng.uniform(12, 32) * (1 + abs(y) / 2200), h=trunk_h, seed=900 + i, n=14, rows=22)
        V[:, 2] += 54
        parts.append((V, F))
    obj("trunks", pl.merge(parts), M["bark_far"], 6)
    sh = []
    for i in range(n_shrubs):
        y = depth[0] - rng.random() ** 1.3 * (depth[0] - depth[1]) * .75
        x = cam["loc"][0] + rng.uniform(-1, 1) * (200 + (cam["loc"][1] - y) * .45)
        r = rng.uniform(40, 110) * (1 + abs(y) / 2500)
        sh.append(pl.shrub((x, y, r * .45), r, int(50 + r * .5), rng.uniform(14, 22) * (1 + abs(y) / 3000), rng, kind="fig" if i % 3 else "long"))
    obj("shrubs", pl.merge(sh), M["leaf"], 5)
    can = []
    for i in range(46):
        y = -700 - rng.random() ** .9 * 2600
        x = cam["loc"][0] + rng.uniform(-1.25, 1.25) * (cam["loc"][1] - y) * .25
        r = rng.uniform(140, 300)
        c = np.array([x, y, rng.uniform(*canopy_z)])
        px = project(cam, c)
        if any(np.hypot(px[0] - kx, px[1] - ky) < kr + 200 for kx, ky, kr in keep_clear):
            continue
        can.append(pl.shrub(c, r, int(r * .8), rng.uniform(28, 42), rng, kind="fig" if i % 2 else "long"))
    obj("canopy_low", pl.merge(can), M["leaf_dark"], 5)
    fr = []
    zx, zy = fern_zone or ((-200, 200), (-150, 150))
    for i in range(ferns):
        c = np.array([rng.uniform(*zx), rng.uniform(*zy), 0])
        for k in range(int(rng.integers(4, 7))):
            a = rng.uniform(0, 2 * np.pi)
            fr.append(pl.frond(c, (np.cos(a), np.sin(a), rng.uniform(.9, 1.6)), rng.uniform(40, 80), rng))
    if fr:
        obj("ferns", pl.merge(fr), M["fern"], 5)


def glow_light(pos, r, strength=22, col=(1, .82, .56)):
    o = s3.mesh_from_arrays("glow", *blob(tuple(pos), (r, r * .75, r), 400, 24, .25), s3.emission("gold", col, strength), index=8)
    o["no_shadow_map"] = True
    return o


def sky_plate(path, kind, w=2400, h=1600, seed=3):
    """A painted sky: night with stars and the Milky Way, or dawn with a gold horizon."""
    import cv2
    r = np.random.default_rng(seed)
    y = np.linspace(0, 1, h)[:, None, None]
    x = np.linspace(0, 1, w)[None, :, None]
    if kind == "night":
        img = np.array([.004, .008, .022]) * (1 - y) + np.array([.02, .035, .07]) * y
        img = np.broadcast_to(img, (h, w, 3)).copy()
        band = np.exp(-((y[..., 0] - (.25 + .35 * x[..., 0])) / .09) ** 2)
        noise = cv2.GaussianBlur(r.random((h, w)).astype(np.float32), (0, 0), 9)
        band = np.exp(-((y[..., 0] - (.15 + .45 * x[..., 0])) / .07) ** 2)
        dust = cv2.GaussianBlur(r.random((h, w)).astype(np.float32), (0, 0), 14) * 3 - 1.2
        img += (band * np.clip(.4 + dust, 0, 2) * .1)[..., None] * np.array([.75, .82, 1.0])
        img += np.exp(-((y - .78) / .12) ** 2) * np.array([.02, .04, .07])           # the glow along the horizon
        for i in range(5200):
            cx, cy = int(r.uniform(0, w)), int(r.uniform(0, h * .8))
            b = (r.random() ** 7 * 1.6 + .06) * (1 + band[cy, cx] * 1.5)
            img[cy, cx] += np.array([b * .85, b * .9, b])
        img = cv2.GaussianBlur(img.astype(np.float32), (0, 0), .7)
        cv2.circle(img, (int(w * .4), int(h * .32)), 9, (1.6, 1.65, 1.7), -1, cv2.LINE_AA)       # the moon
        img += cv2.GaussianBlur((np.hypot(np.arange(w)[None] - w * .4, np.arange(h)[:, None] - h * .32) < 40).astype(np.float32), (0, 0), 40)[..., None] * np.array([.05, .06, .08])
    elif kind == "day":
        t = y[..., 0]
        img = np.array([.35, .45, .55]) * (1 - t[..., None]) + np.array([.85, .88, .85]) * t[..., None]
        img = np.broadcast_to(img, (h, w, 3)).copy()
        cl = cv2.GaussianBlur(r.random((h // 8, w // 8)).astype(np.float32), (0, 0), 3)
        cl = cv2.resize(cl, (w, h))
        img += ((cl - .5) * .25)[..., None]
    else:
        t = y[..., 0]
        stops = [(0, (.03, .05, .12)), (.38, (.12, .12, .22)), (.55, (.55, .3, .22)), (.66, (1.5, .82, .38)), (.72, (2.2, 1.3, .55)), (1.0, (1.0, .55, .25))]
        img = np.zeros((h, w, 3))
        for (a0, c0), (a1, c1) in zip(stops[:-1], stops[1:]):
            m_ = (t >= a0) & (t <= a1)
            u_ = ((t - a0) / (a1 - a0))[..., None]
            img = np.where(m_[..., None], np.array(c0) * (1 - u_) + np.array(c1) * u_, img)
        img = np.broadcast_to(img, (h, w, 3)).copy()
        d = np.hypot((x[..., 0] - .55) * 1.5, y[..., 0] - .7)
        img += (np.exp(-(d / .012) ** 2) * 6 + np.exp(-(d / .06) ** 2) * 1.5 + np.exp(-(d / .2) ** 2) * .5)[..., None] * np.array([1.0, .78, .45])
        for i in range(90):
            cx, cy = int(r.uniform(0, w)), int(r.uniform(0, h * .3))
            img[cy, cx] += .35
    cv2.imwrite(str(path), (np.clip(img, 0, 8) / 8 * 65535).astype(np.uint16)[..., ::-1])
    return path


def sky_backdrop(cam, path, dist=60000, strength=8.0):
    """The sky as a huge emissive card behind everything, filling the frame."""
    eye, f, r, u = cam_basis(cam)
    k = cam["lens"] / 18.0
    hh = dist / k * 1.25
    ww = hh * 1.3
    c = eye + f * dist + u * hh * .25
    corners = [c - r * ww - u * hh, c + r * ww - u * hh, c + r * ww + u * hh, c - r * ww + u * hh]
    m = bpy.data.materials.new("skym")
    m.use_nodes = True
    nt = m.node_tree
    for nd in list(nt.nodes):
        nt.nodes.remove(nd)
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(str(path))
    t.image.colorspace_settings.name = "Non-Color"
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[1].default_value = strength * 8
    o_ = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(t.outputs[0], e.inputs[0])
    nt.links.new(e.outputs[0], o_.inputs[0])
    ob = st.s3.mesh_from_arrays("sky", np.array(corners), np.array([[0, 1, 2, 3]]), m, index=28, smooth=False)
    lay = ob.data.uv_layers.new(name="uv")
    for li, uv in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
        lay.data[li].uv = uv
    ob.visible_diffuse = ob.visible_glossy = ob.visible_shadow = False
    ob["no_shadow_map"] = True
    return ob


def ridges(M, cam, rng, n=5, d0=7000, d1=40000, base=-700):
    """Far mountain ridges in layers, each a long jagged wall that the haze lightens with distance."""
    eye, f, r, u = cam_basis(cam)
    parts = []
    for i in range(n):
        d = d0 * (d1 / d0) ** (i / max(n - 1, 1))
        xs = np.linspace(-1.6, 1.6, 160) * d * .7
        hgt = d * (.03 + .02 * rng.random()) * (1 + .6 * np.sin(xs / d * 5 + rng.uniform(0, 6)) + .3 * np.sin(xs / d * 17 + rng.uniform(0, 6)))
        cx = eye + f * d
        top = np.array([cx + r * x + np.array([0, 0, base + hh]) for x, hh in zip(xs, hgt)])
        bot = top.copy()
        bot[:, 2] = base - 2000
        V = np.vstack([top, bot])
        m = len(xs)
        F = [[j, j + 1, m + j + 1, m + j] for j in range(m - 1)]
        parts.append((V, np.array(F)))
    o = obj("ridges", pl.merge(parts), M["ridge"], 28, smooth=False, shadow=False)
    o["no_shadow_map"] = True
    return o


def rock(c, r, seed=5):
    V, F = blob(tuple(c), r, seed, 26, .55)
    return V, F


def grass(rng, region, n, h=(10, 28), z=0.0):
    """Tufts of grass blades: thin bent strips."""
    parts = []
    for i in range(n):
        c = np.array([rng.uniform(*region[0]), rng.uniform(*region[1]), z])
        for k in range(6):
            a = rng.uniform(0, 2 * np.pi)
            L_ = rng.uniform(*h)
            pts = pl.curve(c + [rng.normal(0, 2), rng.normal(0, 2), 0], (np.cos(a) * .3, np.sin(a) * .3, 1), L_, 5, .05, rng, .05)
            V, F = pl.long_leaf(L_, rng.uniform(.5, .9), rng, bend=.2, nu=6, nv=3)
            parts.append((pl.orient(V, c, (np.cos(a) * .25, np.sin(a) * .25, 1), roll=rng.uniform(-1, 1)), F))
    return pl.merge(parts)


def base_scene(width, spp, cam):
    H = int(width * 16 / 9)
    sc = s3.reset((width, H), spp)
    sc.render.threads = 2
    M = e2.mats()
    M["ridge"] = P("ridge", (.03, .035, .04), .9)
    M["rock"] = e2.ramp_material("rock", [(.3, (.04, .038, .035)), (.6, (.08, .075, .065)), (.85, (.05, .07, .03))], .06, bump=(.5, .6), moss_up=.4)
    M["grass"] = e2.ramp_material("grass", [(.3, (.016, .026, .012)), (.7, (.035, .05, .02))], .2, bump=None, rough=.7, translucent=((.12, .16, .04), .3))
    M["hillground"] = P("hillground", (.012, .018, .012), 1.0, .0)
    M["tot_leaf"] = e2.ramp_material("tot_leaf", [(.3, (.008, .018, .012)), (.7, (.018, .032, .02))], .15, bump=None, rough=.6, translucent=((.05, .08, .03), .2))
    M["fruit_far"] = P("fruit_far", (.25, .02, .025), .4, .3)
    M["tree_dark"] = e2.ramp_material("tree_dark", [(.3, (.025, .018, .014)), (.7, (.05, .035, .025))], .05, bump=(.4, .5))
    CM = sb.materials()
    o = s3.camera(cam["loc"], cam["target"], lens=cam["lens"])
    return sc, M, CM, o


# ------------------------------------------------------------------ the frames

CAMS = {
    "f01": dict(loc=(40.0, 760.0, 44.0), target=(0.0, -600.0, 200.0), lens=28.0),
    "f10": dict(loc=(40.0, 760.0, 44.0), target=(0.0, -600.0, 200.0), lens=28.0),
}


def hill_z(gx, gy):
    """The hill: a broad rounded crest where he sits, falling away to the valley beyond him."""
    gz = 40 - (np.clip(-gy - 150, 0, None) / 18) ** 1.35 - (gx / 900) ** 2 * 30 + 5 * np.sin(gx * .01) * np.sin(gy * .013)
    return np.maximum(gz, -2200) - 40


def hill(M, rng, cam, night=True):
    # A rock to sit on at the crest, grass, and far ridges under a huge sky.
    n = 150
    gx, gy = np.meshgrid(np.linspace(-3000, 3000, n), np.linspace(-6000, 2500, n))
    gz = hill_z(gx, gy)
    V = np.c_[gx.ravel(), gy.ravel(), gz.ravel()]
    F = [[i * n + j, i * n + j + 1, (i + 1) * n + j + 1, (i + 1) * n + j] for i in range(n - 1) for j in range(n - 1)]
    obj("hill", (V, np.array(F)), M["hillground"], 7)
    obj("rock", rock((0, -8, 18), (46, 34, 28), 5), M["rock"], 19)
    obj("rock2", rock((70, -40, 6), (26, 20, 14), 6), M["rock"], 19)
    gv, gf = pl.merge([grass(rng, ((-500, 500), (-200, 700)), 900, h=(14, 36), z=0), grass(rng, ((-700, 700), (-230, -120)), 700, h=(16, 40), z=0)])
    gv[:, 2] += hill_z(gv[:, 0], gv[:, 1]) - 1
    obj("grass", (gv, gf), M["grass"], 5)
    ridges(M, cam, rng)


def f01(width=1080, spp=32, skip=()):
    """F1. "If God doesn't need anything, why did he make you?" One small person on a dark hill under a huge night sky."""
    cam = CAMS["f01"]
    sc, M, CM, co = base_scene(width, spp, cam)
    rng = np.random.default_rng(1)
    hill(M, rng, cam)
    Mm = sb.place("sb_man_sit", 4, 2, 200)
    seat = np.load(L.ASSETS / "vi_sb_man_sit_marks.npz")["upperleg01_L"][2]
    Mm[2, 3] = 44 - seat + 2
    sb.person("sb_man_sit", Mm, CM, "skin_m", "hair_m", "iris_a", look=(0, 1, .1), eye_scale=1.16)
    sky_backdrop(cam, sky_plate(OUT / "sb_sky_night.png", "night"), strength=1.0)
    s3.world_color((.004, .007, .016), 1.0)
    s3.sun((-.3, -.9, .3), (.62, .74, 1.0), .9, angle=.8)                    # the moon behind him: a cool rim
    sb.shoot("f01", co, (.28, -.9, .34), [], spp, width, shadow=False, skip=skip, meta_extra=dict(people=[dict(pose="sb_man_sit", M=Mm.tolist())]))


def f10(width=1080, spp=32, skip=()):
    """F10. "...why would he ever stop wanting you?" The same rock at dawn: upright, palms open, face lifted to the light."""
    cam = CAMS["f10"]
    sc, M, CM, co = base_scene(width, spp, cam)
    rng = np.random.default_rng(1)
    hill(M, rng, cam, night=False)
    seat = np.load(L.ASSETS / "vi_sb_man_open_marks.npz")["upperleg01_L"][2]
    Mm = sb.place("sb_man_open", 4, 2, 200)
    Mm[2, 3] = 44 - seat + 2
    sky_backdrop(cam, sky_plate(OUT / "sb_sky_dawn.png", "dawn"), strength=.55)
    s3.world_color((.05, .045, .06), 1.0)
    sd = unproject(cam, 1080 * .55, 1920 * .64, 50000) - np.array([0, 0, 100.0])   # toward the sun on the horizon
    sd /= np.linalg.norm(sd)
    sb.person("sb_man_open", Mm, CM, "skin_m", "hair_m", "iris_a", look_at=tuple(np.array([0, 0, 100]) + sd * 1000), eye_scale=1.16)
    s3.sun(tuple(sd), (1.0, .74, .44), 5.0, angle=1.0)
    s3.area((300, 700, 200), (0, 0, 80), (.5, .45, .55), 16000, 400)
    sb.shoot("f10", co, tuple(sd), [], spp, width, shadow=True, shadow_centre=(0, 0, 60), shadow_size=1200, skip=skip,
             meta_extra=dict(people=[dict(pose="sb_man_open", M=Mm.tolist())]))


FINISH = {
    "f01": dict(exposure=2.4, sigma=1 / 30000, maxd=200000.0, floor=1.0, height=1e9, near=(400.0, 20000.0, .0), amb=np.array([.02, .035, .07]) * 1.2,
                shafts=False, focus=900.0, paint=3, vignette=.7, vignette_c=(.5, .6), dof=False),
    "f10": dict(exposure=1.25, sigma=1 / 90000, maxd=200000.0, floor=1.0, height=1e9, near=(400.0, 20000.0, .0), amb=np.array([.07, .07, .11]) * .8,
                near_sun=(200.0, 3000.0, .0), sun=np.array([1.0, .72, .4]) * .18, g=.7, focus=900.0, paint=3, dof=False, vignette=.6,
                vignette_c=(.5, .6)),
}



# ------------------------------------------------------------------ the garden frames

def lens_leaves(M, rng, cam, specs):
    """Broad dark leaves right at the lens. specs: (pixel x, pixel y, length as a fraction of frame height, angle deg, distance cm)."""
    eye, f, r, u = cam_basis(cam)
    parts = []
    for px, py, frac, ang, dist in specs:
        ln = frac * 2 * dist * 18.0 / cam["lens"]
        base = unproject(cam, px, py, dist)
        a = np.radians(ang)
        d = r * np.cos(a) + u * np.sin(a) - f * .15
        V, F = pl.long_leaf(ln, ln * rng.uniform(.16, .22), rng, bend=.25)
        parts.append((pl.orient(V, base, d, up=tuple(-f), roll=rng.uniform(-.5, .5)), F))
    return obj("fg_leaves", pl.merge(parts), M["fg"], 23)


def garden_scene(name, width, spp, cam, people, sun, sun_col, sun_k, world, fill, extras=None, skip=(), layers=None, glow=None,
                 fg=None, seed=7, shadow_centre=(0, -800, 60), shadow_size=4200):
    sc, M, CM, co = base_scene(width, spp, cam)
    rng = np.random.default_rng(seed)
    ground(M, flat=((0, 0), 300))
    garden_layers(M, rng, cam, **(layers or {}))
    for p in people:
        Mx = sb.place(p["pose"], p["x"], p["y"], p["rot"])
        sb.person(p["pose"], Mx, CM, p["skin"], p["hair"], p["iris"], look=p.get("look"), look_at=p.get("look_at"), eye_scale=p.get("eyes", 1.17))
        p["M"] = Mx
    if glow:
        glow_light(*glow)
    fgo = [lens_leaves(M, rng, cam, fg)] if fg else []
    if extras:
        extras(M, CM, rng, people)
    sun = np.asarray(sun, float) / np.linalg.norm(sun)
    s3.sun(tuple(sun), sun_col, sun_k, angle=1.2)
    s3.world_color(world, 1.0)
    for loc, tgt, col, pw, size in fill:
        s3.area(loc, tgt, col, pw, size)
    sb.shoot(name, co, tuple(sun), fgo, spp, width, shadow=True, shadow_centre=shadow_centre, shadow_size=shadow_size, skip=skip,
             meta_extra=dict(people=[dict(pose=p["pose"], M=p["M"].tolist()) for p in people]))


def eve_fruit_world(Me):
    return sb.to_world(Me, np.load(L.ASSETS / "vi_sb_eve_offer_fruit.npz")["c"])


CAMS["f05"] = dict(loc=(-46.0, 86.0, 128.0), target=(-46.5, 3.0, 120.5), lens=68.0)


def f05(width=1080, spp=32, skip=()):
    """F5. "She gives some to Adam, and he eats" (Genesis 3:6). Close on the hands: her hand holds out the bitten fruit,
    his comes to take it. Faces stay out of frame, so the exchange is the whole picture and both stay modestly framed."""
    cam = CAMS["f05"]
    turn = 90.0                                            # the pair stands across the frame, so the garden is behind the hands
    Ma = sb.place("sb_adam_take", 0, 0, turn)
    hand = sb.to_world(Ma, np.load(L.ASSETS / "vi_sb_adam_take_marks.npz")["wrist_R"]) + sb.rz(turn) @ np.array([-2.0, 7.0, 3.0])
    Me0 = sb.place("sb_eve_offer", 0, 0, 180 + turn)
    off = hand - eve_fruit_world(Me0)
    adam = dict(pose="sb_adam_take", x=0.0, y=0.0, rot=turn, skin="skin_a", hair="hair", iris="iris_a", eyes=1.17)
    eve = dict(pose="sb_eve_offer", x=float(off[0]), y=float(off[1]), rot=180.0 + turn, skin="skin_e", hair="hair_e", iris="iris_e", eyes=1.2)
    fruit_at = eve_fruit_world(sb.place("sb_eve_offer", off[0], off[1], 180 + turn))
    adam["look_at"] = tuple(fruit_at)
    eve["look_at"] = tuple(fruit_at)

    def extras(M, CM, rng, people):
        sb.fruit(fruit_at + np.array([0, 0, 1.0]), 4.0, rot=(10, -15, 0), bite=(.2, .75, .45))
    garden_scene("f05", width, spp, cam, [adam, eve], sun=(-.6, -.55, .55), sun_col=(1.0, .88, .74), sun_k=4.0, world=(.05, .07, .07),
                 fill=[((60, 200, 170), (-46, 0, 120), (.55, .68, .9), 9000, 120)],
                 extras=extras, skip=skip, layers=dict(n_trunks=110, n_shrubs=50, ferns=40, fern_zone=((-250, 200), (-300, -80))),
                 fg=[(1080, 1960, .3, 118, 40)], shadow_centre=(0, -600, 60), shadow_size=3600)


FINISH["f05"] = dict(exposure=2.6, near=(140.0, 900.0, .02), near_sun=(140.0, 600.0, .0), sun=np.array([1.0, .86, .7]) * .5, g=.3,
                     amb=np.array([.035, .07, .075]) * 1.0, focus=60.0, paint=5, paint_fig=2)


def cover(M, rng, cam, pts, frac=(.3, .55), n=5, region=32.0, name="cover", mat="leaf_fig", kind="fig"):
    """Leaves on stalks placed on the line from the camera to each point, so that point is always behind foliage. Used to
    keep Adam and Eve modestly framed (checked afterwards by modesty.py)."""
    eye = np.array(cam["loc"], float)
    leaves, stalks = [], []
    for p in pts:
        p = np.asarray(p, float)
        v = eye - p
        dist = np.linalg.norm(v)
        v /= dist
        side = np.cross(v, (0, 0, 1.0))
        side /= np.linalg.norm(side) + 1e-9
        up = np.cross(side, v)
        for k in range(n):
            t = rng.uniform(*frac)
            sz = region * (1 - t) * rng.uniform(.75, 1.05)
            q = p + v * dist * t + side * rng.normal(0, sz * .3) + up * rng.normal(0, sz * .25)
            if kind == "fig":
                V, F = pl.fig_leaf(sz * 1.15, rng)
                V = V - np.array([sz * .5, 0, 0])
            else:
                V, F = pl.long_leaf(sz * 1.8, sz * .4, rng, bend=.2)
                V = V - np.array([sz * .9, 0, 0])
            d = up * .9 + side * rng.normal(0, .35)
            leaves.append((pl.orient(V, q, d, up=tuple(v), roll=rng.uniform(-.3, .3)), F))
            if q[2] > 4:
                stalks.append(pl.tube(np.array([[q[0] + rng.normal(0, 3), q[1] + rng.normal(0, 3), 0], q - up * sz * .4]), .5, .35, 5))
    obj(name, pl.merge(leaves), M[mat], 5)
    if stalks:
        obj(name + "_stalks", pl.merge(stalks), M["stem"], 5)


def body_points(p, which=("pelvis",)):
    """World points on a placed figure for cover(): its pelvis and, for Eve, her chest."""
    mk = np.load(L.ASSETS / f"vi_{p['pose']}_marks.npz")
    M = p["M"]
    out = []
    hip = mk["upperleg01_L"] * [0, 1, 1]
    if "pelvis" in which:
        out += [sb.to_world(M, hip + [dx, 0, dz]) for dx in (-9, 9) for dz in (-8, 2)]
    if "chest" in which:
        nk = mk["neck01"] * [0, 1, 1]
        out += [sb.to_world(M, nk + [dx, 6, dz]) for dx in (-8, 8) for dz in (-26, -16)]
    return out


def hedge(M, rng, y0, y1, x0, x1, n, top=(70, 115), name="hedge"):
    """A band of tall ferns and leafy stems across the foreground, high enough to keep them framed from the waist up."""
    parts = []
    for i in range(n):
        c = np.array([rng.uniform(x0, x1), rng.uniform(y0, y1), 0])
        for k in range(int(rng.integers(5, 8))):
            a = rng.uniform(0, 2 * np.pi)
            parts.append(pl.frond(c, (np.cos(a) * .35, np.sin(a) * .35, 1), rng.uniform(*top), rng))
    return obj(name, pl.merge(parts), M["fern"], 5)


def tree_of_knowledge(M, rng, x, y, r=95, crown=(520, 420, 260), fruits=26):
    """The one tree: a broad dark trunk and a wide low crown with fruit hanging under it."""
    V, F = trunk_mesh(x, y, r, h=700, seed=41, n=40, rows=50)
    V[:, 2] += 54
    obj("tot_trunk", (V, F), M["tree_dark"], 6)
    roots = [pl.buttress(np.array([x + np.cos(a) * r * .8, y + np.sin(a) * r * .8, 0]), a, rng.uniform(140, 240), rng.uniform(70, 130), rng, 16)
             for a in np.linspace(0, 2 * np.pi, 7, endpoint=False) + .4]
    obj("tot_roots", pl.merge(roots), M["tree_dark"], 6)
    cr = []
    for i in range(16):
        a = rng.uniform(0, 2 * np.pi)
        d = rng.uniform(0, 1) ** .6
        c = (x + np.cos(a) * d * crown[0], y + np.sin(a) * d * crown[1] * .7, 560 + rng.uniform(-60, 80) + (1 - d) * 120)
        rr = rng.uniform(150, 260)
        cr.append(pl.shrub(c, rr, int(rr * .9), rng.uniform(26, 38), rng, kind="fig"))
    obj("tot_crown", pl.merge(cr), M["tot_leaf"], 5)
    fr = []
    for i in range(fruits):
        a = rng.uniform(0, 2 * np.pi)
        d = rng.uniform(.3, 1)
        c = (x + np.cos(a) * d * crown[0] * .8, y + np.sin(a) * d * crown[1] * .55, rng.uniform(380, 470))
        fr.append(blob(c, (6, 6, 7), 60 + i, 10, .1))
    obj("tot_fruit", merge(fr), M["fruit_far"], 26)


CAMS["f02"] = dict(loc=(8.0, 430.0, 70.0), target=(0.0, -600.0, 118.0), lens=34.0)


def f02(width=1080, spp=32, skip=()):
    """F2. "Revelation 4:11 says he created everything because he chose to." The new garden in its first light: the two of
    them walking away from us together, hand in hand, into the light. We stay behind them, among the ferns."""
    cam = CAMS["f02"]
    adam = dict(pose="sb_adam_walk", x=-19.0, y=0.0, rot=180.0, skin="skin_a", hair="hair", iris="iris_a")
    eve = dict(pose="sb_eve_walk", x=19.0, y=-4.0, rot=180.0, skin="skin_e", hair="hair_e", iris="iris_e", eyes=1.2)
    glow = (np.array([-60.0, -2600.0, 260.0]), 70, 18)

    def extras(M, CM, rng, people):
        hedge(M, rng, 90, 260, -260, 260, 90, top=(80, 130))
        cover(M, rng, cam, [q for p in people for q in body_points(p)], frac=(.04, .16), n=4, region=30, kind="long", mat="fern")
    garden_scene("f02", width, spp, cam, [adam, eve], sun=glow[0] - np.array([0, 0, 100.0]), sun_col=(1.0, .8, .52), sun_k=6.0,
                 world=(.06, .075, .07), fill=[((150, 500, 200), (0, 0, 100), (.6, .7, .85), 30000, 300)], extras=extras, skip=skip,
                 layers=dict(n_trunks=120, n_shrubs=50, ferns=40, fern_zone=((-300, 300), (-900, -60)), keep_clear=((540, 860, 230),)),
                 glow=glow, fg=[(0, 1960, .5, 70, 120), (1080, 1960, .45, 110, 120)], shadow_centre=(0, -1200, 60), shadow_size=5200)


CAMS["f03"] = dict(loc=(40.0, 620.0, 60.0), target=(0.0, -500.0, 300.0), lens=26.0)


def f03(width=1080, spp=32, skip=()):
    """F3. "God told Adam and Eve not to eat from one tree." One wide dark tree alone in a clearing, every other tree pale
    and far off. The two of them small before it, looking up."""
    cam = CAMS["f03"]
    adam = dict(pose="sb_adam_up", x=-26.0, y=0.0, rot=180.0, skin="skin_a", hair="hair", iris="iris_a")
    eve = dict(pose="sb_eve_up", x=20.0, y=10.0, rot=172.0, skin="skin_e", hair="hair_e", iris="iris_e", eyes=1.2)

    def extras(M, CM, rng, people):
        tree_of_knowledge(M, rng, -30, -520)
        hedge(M, rng, 60, 300, -300, 300, 90, top=(70, 110))
        cover(M, rng, cam, [q for p in people for q in body_points(p)], frac=(.08, .3), n=4, region=34, kind="long", mat="fern")
        sky_backdrop(cam, sky_plate(OUT / "sb_sky_day.png", "day"), strength=.55)
    garden_scene("f03", width, spp, cam, [adam, eve], sun=(.3, -.4, .86), sun_col=(1.0, .95, .88), sun_k=3.0, world=(.16, .19, .2),
                 fill=[((200, 700, 300), (0, 0, 100), (.7, .78, .9), 40000, 400)], extras=extras, skip=skip,
                 layers=dict(n_trunks=60, n_shrubs=20, ferns=20, depth=(-1500, -4500), fern_zone=((-400, 400), (-300, 0))),
                 fg=[(0, 1960, .4, 75, 110), (1080, 1960, .38, 108, 110)], shadow_centre=(0, -800, 60), shadow_size=5000)


CAMS["f04"] = dict(loc=(-66.0, 92.0, 170.0), target=(-14.0, -46.0, 150.0), lens=44.0)


def f04(width=1080, spp=32, skip=()):
    """F4. "The serpent tells Eve she'll be like God if she does" (Genesis 3:5). Over Eve's shoulder: the serpent wound on the
    branch faces her, the fruit hangs between them, and her hand has begun to rise toward it."""
    cam = CAMS["f04"]
    eve = dict(pose="sb_eve_reach", x=0.0, y=0.0, rot=180.0, skin="skin_e", hair="hair_e", iris="iris_e", eyes=1.2)
    fruit_at = np.array([2.0, -44.0, 152.0])
    eve["look_at"] = tuple(fruit_at)

    def extras(M, CM, rng, people):
        br = pl.curve((-110, -78, 128), (1, .06, .1), 220, 24, .003, rng, .02)
        obj("branch", pl.tube(br, 5.0, 2.8, 10), M["tree_dark"], 6)
        t = np.linspace(0, 1, 140)
        base = br[2] + (br[-6] - br[2]) * t[:, None] * .7
        coil = np.c_[np.zeros_like(t), np.cos(t * 30) * 7.0, np.sin(t * 30) * 7.0] * (1 - t[:, None] * .5)
        path = base + coil + np.array([0, 0, 6.0])
        tip = path[-1]
        face = fruit_at + np.array([-12.0, -8.0, 10.0])
        head = np.array([tip + (face - tip) * k + np.array([0, 0, 10 * np.sin(k * np.pi)]) for k in np.linspace(.04, 1, 28)])
        sb.serpent(np.vstack([path, head]), 4.0, 1.6)
        sb.fruit(fruit_at, 4.0, rot=(5, 10, 0))
        obj("fruit_stalk", pl.tube(np.array([fruit_at + [0, 0, 4], fruit_at + [3, -2, 14], fruit_at + [6, -6, 30]]), .35, .3, 5), M["stem"], 6)
        lv = [pl.fig_branch(np.array([x, y, z]), np.array(d), 70, 6, 24, rng) for x, y, z, d in
              ((-40, -90, 230, (.4, .2, -.4)), (50, -100, 220, (-.4, .2, -.4)), (70, -70, 140, (-.5, -.2, .3)))]
        obj("fig_stems", pl.merge([a for a, b in lv]), M["stem"], 5)
        obj("fig_leaves", pl.merge([b for a, b in lv]), M["leaf_fig"], 24)
    garden_scene("f04", width, spp, cam, [eve], sun=(-.3, -.6, .75), sun_col=(.85, .95, .9), sun_k=2.6, world=(.04, .065, .06),
                 fill=[((120, 160, 170), (0, -50, 150), (.55, .7, .85), 16000, 120), ((40, -200, 220), (0, -50, 150), (.5, .7, .8), 26000, 120)],
                 extras=extras, skip=skip, layers=dict(n_trunks=110, n_shrubs=40, ferns=20, fern_zone=((-250, 250), (-300, -120))),
                 shadow_centre=(0, -400, 100), shadow_size=3000)


CAMS["f06"] = dict(loc=(-52.0, 60.0, 128.0), target=(0.0, 30.0, 112.0), lens=62.0)


def f06(width=1080, spp=32, skip=()):
    """F6. "They realize they're naked, and they sew fig leaves together" (Genesis 3:7). Hands only: two fig leaves held
    together, a fibre pulled tight through them. Seen from his side, against the garden, at chest height."""
    hm = np.load(L.ASSETS / "vi_sb_adam_sew_hands.npz")
    Mx0 = sb.place("sb_adam_sew", 0, 0, 0)
    c = (sb.to_world(Mx0, hm["l"]) + sb.to_world(Mx0, hm["r"])) / 2 + np.array([0, 6.0, 2.0])
    cam = dict(loc=tuple(c + np.array([-58.0, 46.0, 20.0])), target=tuple(c), lens=58.0)
    CAMS["f06"] = cam
    adam = dict(pose="sb_adam_sew", x=0.0, y=0.0, rot=0.0, skin="skin_a", hair="hair", iris="iris_a")

    def extras(M, CM, rng, people):
        Mx = people[0]["M"]
        wl, wr = sb.to_world(Mx, hm["l"]), sb.to_world(Mx, hm["r"])
        lv = []
        for k, (base, d, roll) in enumerate(((wl + [3, 6, 2], (.6, .4, -.7), .4), (wl + [5, 4, 4], (.3, .7, -.6), -.3))):
            V, F = pl.fig_leaf(23, rng)
            lv.append((pl.orient(V, base, d, roll=roll), F))
        obj("sew_leaves", pl.merge(lv), M["leaf_fig"], 21)
        pinch = wr + np.array([1.5, 9.0, 1.5])
        stitch = wl + np.array([8.0, 9.0, 1.0])
        th = np.array([stitch + (pinch - stitch) * t + np.array([0, 0, 1.2 * np.sin(np.pi * t)]) for t in np.linspace(0, 1, 16)])
        obj("thread", pl.tube(th, .12, .1, 5), P("fibre", (.25, .2, .12), .8), 19)
        cover(M, rng, cam, body_points(people[0]), frac=(.2, .5), n=4, region=34)
        v = np.array(cam["target"]) - np.array(cam["loc"])
        v /= np.linalg.norm(v)
        bg = [pl.shrub(np.array(cam["target"]) + v * rng.uniform(250, 700) + np.array([rng.normal(0, 80), rng.normal(0, 80), -60]),
                       rng.uniform(70, 140), 80, rng.uniform(18, 26), rng) for _ in range(10)]
        obj("bg_shrubs", pl.merge(bg), M["leaf"], 5)
    garden_scene("f06", width, spp, cam, [adam], sun=(-.4, .5, .75), sun_col=(.85, .9, .95), sun_k=2.2, world=(.025, .04, .045),
                 fill=[(tuple(c + [-60, 60, 50]), tuple(c), (.6, .72, .9), 3000, 60), (tuple(c + [60, -80, 50]), tuple(c), (.5, .65, .8), 5000, 60)],
                 extras=extras, skip=skip, layers=dict(n_trunks=90, n_shrubs=30, ferns=20, fern_zone=((-300, 300), (-300, -100))),
                 shadow_centre=(0, -400, 100), shadow_size=3000)


CAMS["f09"] = dict(loc=(-40.0, 210.0, 150.0), target=(4.0, 0.0, 142.0), lens=44.0)


def f09(width=1080, spp=32, skip=()):
    """F9. "Before they leave, Genesis 3:21 says God makes them clothes." Clothed in skins, Eve touches the garment at her
    shoulder and looks up to where it came from; Adam, behind her, looks down at his. The gold falls on them: God acts."""
    cam = CAMS["f09"]
    eve = dict(pose="sb_eve_clothed", x=8.0, y=24.0, rot=-8.0, skin="skin_e", hair="hair_e", iris="iris_e", eyes=1.2)
    adam = dict(pose="sb_adam_clothed", x=-30.0, y=-28.0, rot=10.0, skin="skin_a", hair="hair", iris="iris_a")
    garden_scene("f09", width, spp, cam, [eve, adam], sun=(-.45, .25, .86), sun_col=(1.0, .78, .48), sun_k=6.0, world=(.04, .05, .06),
                 fill=[((150, 220, 150), (0, 0, 130), (.55, .68, .9), 22000, 150)], extras=None, skip=skip,
                 layers=dict(n_trunks=110, n_shrubs=40, ferns=30, fern_zone=((-250, 250), (-300, -80))),
                 fg=[(1080, 1960, .4, 110, 80)], shadow_centre=(0, -600, 60), shadow_size=3600)


FINISH.update({
    "f02": dict(exposure=2.6, g=.55, sun=np.array([1.0, .76, .44]) * 1.6, near=(150.0, 900.0, .03), near_sun=(200.0, 800.0, .0),
                amb=np.array([.05, .08, .08]), focus=430.0, paint=5),
    "f03": dict(exposure=2.2, g=.3, sun=np.array([1.0, .96, .9]) * .4, near=(300.0, 1500.0, .03), near_sun=(300.0, 1500.0, .0),
                amb=np.array([.12, .14, .15]) * 1.2, sigma=1 / 2600, focus=650.0, paint=5),
    "f04": dict(exposure=2.6, g=.3, sun=np.array([.85, .95, .9]) * .4, near=(150.0, 700.0, .03), near_sun=(150.0, 600.0, .0),
                amb=np.array([.03, .065, .06]), focus=125.0, paint=5),
    "f06": dict(exposure=2.6, g=.3, sun=np.array([.85, .9, .95]) * .3, near=(120.0, 600.0, .03), near_sun=(120.0, 600.0, .0),
                amb=np.array([.02, .04, .045]), focus=60.0, paint=5, paint_fig=2),
    "f09": dict(exposure=2.2, g=.35, sun=np.array([1.0, .78, .48]) * .8, sigma=1 / 5000, near=(150.0, 700.0, .03), near_sun=(60.0, 300.0, .0),
                amb=np.array([.04, .065, .07]), focus=200.0, paint=5),
})


CAMS["f08"] = dict(loc=(70.0, 1250.0, 430.0), target=(10.0, -200.0, 330.0), lens=30.0)


def f08(width=1080, spp=32, skip=()):
    """F8. "They're 'Where are you?'" (Genesis 3:9). The whole dark garden, huge; the two of them small at the foot of one
    tree. The verse is set above in the finish, with one thin gold line running down from the words to a small pool of light
    beside them. God is not shown: only the light, and his words."""
    cam = CAMS["f08"]
    eve = dict(pose="e2_eve", x=14.0, y=8.0, rot=-14.0, skin="skin_e", hair="hair_e", iris="iris_e", eyes=1.2, look=(-.4, .85, .3))
    adam = dict(pose="e2_adam", x=11.0, y=-20.0, rot=14.0, skin="skin_a", hair="hair", iris="iris_a", eyes=1.17, look=(-.4, .85, .3))

    def extras(M, CM, rng, people):
        V, F = trunk_mesh(118, -150, 78, h=1500, seed=7, n=40, rows=60)
        V[:, 2] += 54
        obj("trunk", (V, F), M["bark"], 6)
        roots = [pl.buttress(np.array([118 + np.cos(a) * 62, -150 + np.sin(a) * 62, 0]), a, rng.uniform(150, 260), rng.uniform(70, 130), rng, 15)
                 for a in (-.2, .7, 1.45, 2.3, 3.1, 4.0, 5.0)]
        obj("roots", pl.merge(roots), M["bark"], 6)
        big = []
        for x, y, r in ((-420, -380, 70), (520, -700, 90), (-760, -1300, 110), (300, -1700, 80), (-200, -2400, 120), (900, -2600, 140), (-1100, -500, 90)):
            V, F = trunk_mesh(x, y, r, h=3200, seed=int(abs(x) + abs(y)), n=24, rows=50)
            V[:, 2] += 54
            big.append((V, F))
        obj("big_trunks", pl.merge(big), M["bark_far"], 6)
    garden_scene("f08", width, spp, cam, [eve, adam], sun=(.2, -.5, .85), sun_col=(.55, .68, 1.0), sun_k=1.2, world=(.015, .024, .045),
                 fill=[((-50, 70, 160), (-40, 60, 0), (1.0, .76, .45), 30000, 50)], extras=extras, skip=skip,
                 layers=dict(n_trunks=160, n_shrubs=60, ferns=90, fern_zone=((-500, 500), (-400, 400)), depth=(-250, -4200), trunk_h=3200,
                             canopy_z=(1500, 2100)),
                 shadow_centre=(0, -900, 60), shadow_size=5200)


FINISH["f08"] = dict(exposure=2.8, g=.2, sun=np.array([.55, .68, 1.0]) * .1, near=(400.0, 2500.0, .03), near_sun=(400.0, 2000.0, .0),
                     amb=np.array([.012, .025, .05]) * 3.2, focus=1350.0, paint=4, sigma=1 / 3000)


if __name__ == "__main__":
    a = sys.argv
    fn = globals()[a[1]]
    fn(int(a[2]) if len(a) > 2 else 1080, int(a[3]) if len(a) > 3 else 32, tuple(a[4].split(",")) if len(a) > 4 else ())
