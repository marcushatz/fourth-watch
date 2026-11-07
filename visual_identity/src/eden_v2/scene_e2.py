"""Eden v2: Adam and Eve hiding among the trees of the garden (Genesis 3:8). One 9:16 still, Blender and code only.

They heard the sound of the LORD God walking in the garden in the cool of the day, and hid. God is never shown: a warm light
falls through a gap in the canopy and finds them where they crouch. Gold is kept for that light alone.

    python scene_e2.py [width] [samples]
Writes three renders to /home/claude/fw-tools/out/: e2_main.exr (everything but the lens foliage, multi-pass),
e2_fg.exr (only the foliage at the lens, with alpha) and e2_shadow.exr (depth seen from the light, for the light shafts),
plus e2_meta.json and e2_gobo.npy (the canopy's openings) for the finishing pass.
"""
import json
import sys
from pathlib import Path

import bpy
import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import layout as L  # noqa: E402
import plants_e2 as pl  # noqa: E402
import stage_e2 as st  # noqa: E402
from stage_e2 import P, s3  # noqa: E402
from scene_s26 import trunk_mesh  # noqa: E402
from scene_s13 import blob  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")
GZ = 720.0                                       # the canopy's height, where the openings are
GOBO = dict(x0=-2600.0, x1=2200.0, y0=-1500.0, y1=1400.0, res=3.0)     # cm per texel
SUN = L.LIGHT_DIR / np.linalg.norm(L.LIGHT_DIR)          # the glow, low in the garden behind them: rims and rays
KEY = np.array([-.8, -.12, .58]) / np.linalg.norm([-.8, -.12, .58])   # the same light, cheated onto their faces through a gap
OPEN_CANOPY = False


# ------------------------------------------------------------------ materials

def ramp_material(name, stops, scale, bump=(.15, .25), rough=.85, moss_up=0.0, translucent=None):
    """Colour from a ramp driven by noise (and, for bark, by how much the surface faces up, where moss grows)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = .25
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    tex = nt.nodes.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = 6
    fac = tex.outputs["Fac"]
    if moss_up:
        geo = nt.nodes.new("ShaderNodeNewGeometry")
        sep = nt.nodes.new("ShaderNodeSeparateXYZ")
        nt.links.new(geo.outputs["Normal"], sep.inputs[0])
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        mul.inputs[1].default_value = moss_up
        nt.links.new(sep.outputs["Z"], mul.inputs[0])
        add = nt.nodes.new("ShaderNodeMath")
        add.operation = "ADD"
        nt.links.new(fac, add.inputs[0])
        nt.links.new(mul.outputs[0], add.inputs[1])
        fac = add.outputs[0]
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], (*stops[0][1], 1)
    els[1].position, els[1].color = stops[-1][0], (*stops[-1][1], 1)
    for pos, col in stops[1:-1]:
        e = els.new(pos)
        e.color = (*col, 1)
    nt.links.new(fac, ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Base Color"])
    if bump:
        bt = nt.nodes.new("ShaderNodeTexNoise")
        bt.inputs["Scale"].default_value = bump[0]
        bt.inputs["Detail"].default_value = 8
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = bump[1]
        nt.links.new(bt.outputs["Fac"], bp.inputs["Height"])
        nt.links.new(bp.outputs[0], b.inputs["Normal"])
    shader = b.outputs[0]
    if translucent:
        tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
        tr.inputs["Color"].default_value = (*translucent[0], 1)
        mix = nt.nodes.new("ShaderNodeMixShader")
        mix.inputs["Fac"].default_value = translucent[1]
        nt.links.new(shader, mix.inputs[1])
        nt.links.new(tr.outputs[0], mix.inputs[2])
        shader = mix.outputs[0]
    nt.links.new(shader, out.inputs[0])
    return m


def mats():
    return dict(
        bark=ramp_material("bark", [(.2, (.05, .036, .026)), (.45, (.11, .078, .052)), (.62, (.16, .12, .08)), (.8, (.055, .08, .03)), (1.05, (.07, .1, .035))],
                           .08, bump=(.45, .6), moss_up=.6),
        bark_far=ramp_material("bark_far", [(.3, (.04, .04, .042)), (.7, (.07, .066, .06))], .03, bump=(.2, .3)),
        ground=ramp_material("ground", [(.3, (.03, .022, .014)), (.5, (.05, .04, .025)), (.62, (.04, .065, .025)), (.8, (.06, .09, .03))], .045, bump=(.6, .4), rough=.95),
        leaf=ramp_material("leaf", [(.3, (.025, .06, .02)), (.7, (.05, .1, .03))], .3, bump=(4, .15), rough=.5, translucent=((.2, .32, .05), .3)),
        leaf_fig=ramp_material("leaf_fig", [(.3, (.04, .085, .025)), (.6, (.07, .13, .035)), (.8, (.1, .15, .04))], .12, bump=(3, .2), rough=.45,
                               translucent=((.35, .45, .07), .35)),
        leaf_dark=ramp_material("leaf_dark", [(.3, (.012, .03, .016)), (.7, (.025, .05, .022))], .2, bump=None, rough=.6, translucent=((.08, .14, .03), .25)),
        fern=ramp_material("fern", [(.3, (.03, .075, .025)), (.7, (.06, .12, .035))], .5, bump=None, rough=.55, translucent=((.25, .38, .06), .35)),
        stem=P("stem", (.05, .045, .025), .7, .2),
        crown=P("crown", (.01, .022, .014), .8, .1),
        fg=ramp_material("fg", [(.3, (.008, .02, .012)), (.7, (.02, .04, .02))], .1, bump=None, rough=.6, translucent=((.06, .1, .02), .3)),
    )


def obj(name, VF, mat, index, smooth=True, sub=0):
    V, F = VF
    if len(V) == 0:
        return None
    ob = s3.mesh_from_arrays(name, V, F, mat, index=index, smooth=smooth)
    if sub:
        m = ob.modifiers.new("sub", "SUBSURF")
        m.levels = m.render_levels = sub
    return ob


# ------------------------------------------------------------------ the canopy's openings

def gap_point(p):
    """Where the line from p toward the light crosses the canopy."""
    p = np.asarray(p, float)
    return p + KEY * (GZ - p[2]) / KEY[2]


def gobo(rng):
    """The canopy seen from above: 1 where light gets through. One big ragged opening over them, a few more over the deep
    garden, and a scatter of small leaf gaps."""
    g = GOBO
    nx, ny = int((g["x1"] - g["x0"]) / g["res"]), int((g["y1"] - g["y0"]) / g["res"])
    xs = g["x0"] + (np.arange(nx) + .5) * g["res"]
    ys = g["y0"] + (np.arange(ny) + .5) * g["res"]
    X, Y = np.meshgrid(xs, ys)
    import cv2

    def fbm(cell, seed, octs=4):
        o, a, t = 0, 1, 0
        for i in range(octs):
            c = max(cell / 2 ** i, 1)
            r = np.random.default_rng(seed + i).random((int(ny / c) + 3, int(nx / c) + 3)).astype(np.float32)
            o = o + cv2.resize(r, (nx, ny), interpolation=cv2.INTER_CUBIC) * a
            t += a
            a *= .5
        return o / t
    G = np.clip((fbm(14, 5) - .85) / .03, 0, 1) * .3                  # a few small leaf gaps
    # Openings as clusters of small gaps between leaves, not round holes, so each shaft is a bundle of rays.
    clusters = [((-10, 18, 104), 58, 1.0, 34), ((-30, 30, 70), 40, .8, 10),     # over them: the light that finds them
                ((-160, -430, 0), 42, .9, 10), ((25, 80, 0), 26, .7, 5)]
    edge = fbm(3, 11, 3)
    for p, R, amp, n in clusters:
        cx, cy, _ = gap_point(p)
        for k in range(n):
            ox, oy = rng.normal(0, R * .5, 2)
            r = rng.uniform(.1, .3) * R * (1.25 if k < 3 else 1)
            x, y = cx + ox * (.3 if k < 3 else 1), cy + oy * (.3 if k < 3 else 1)
            i0, i1 = int((y - r * 1.6 - g["y0"]) / g["res"]), int((y + r * 1.6 - g["y0"]) / g["res"]) + 1
            j0, j1 = int((x - r * 1.6 - g["x0"]) / g["res"]), int((x + r * 1.6 - g["x0"]) / g["res"]) + 1
            i0, j0 = max(i0, 0), max(j0, 0)
            if i1 <= i0 or j1 <= j0:
                continue
            d = np.sqrt((X[i0:i1, j0:j1] - x) ** 2 + (Y[i0:i1, j0:j1] - y) ** 2) / r
            v = np.clip((1.0 - d + (edge[i0:i1, j0:j1] - .5) * .7) / .2, 0, 1) * amp * rng.uniform(.55, 1)
            G[i0:i1, j0:j1] = np.maximum(G[i0:i1, j0:j1], v)
    if OPEN_CANOPY:                                       # the light now comes low through the trunks, not down through gaps
        G[:] = 1.0
    return G.astype(np.float32)


def gobo_plane(G):
    import cv2
    path = OUT / "e2_gobo.png"
    cv2.imwrite(str(path), (np.clip(G[::-1], 0, 1) * 255).astype(np.uint8))
    np.save(OUT / "e2_gobo.npy", G)
    g = GOBO
    m = bpy.data.materials.new("gobo")
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(str(path))
    t.image.colorspace_settings.name = "Non-Color"
    t.interpolation = "Linear"
    block = nt.nodes.new("ShaderNodeBsdfDiffuse")
    block.inputs["Color"].default_value = (0, 0, 0, 1)
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(t.outputs[0], mix.inputs["Fac"])
    nt.links.new(block.outputs[0], mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], o.inputs[0])
    corners = [(g["x0"], g["y0"], GZ), (g["x1"], g["y0"], GZ), (g["x1"], g["y1"], GZ), (g["x0"], g["y1"], GZ)]
    ob = st.s3.mesh_from_arrays("gobo", np.array(corners), np.array([[0, 1, 2, 3]]), m, index=0, smooth=False)
    lay = ob.data.uv_layers.new(name="uv")
    for li, uv in enumerate(((0, 0), (1, 0), (1, 1), (0, 1))):
        lay.data[li].uv = uv
    ob.visible_camera = ob.visible_diffuse = ob.visible_glossy = ob.visible_transmission = ob.visible_volume_scatter = False
    return ob


# ------------------------------------------------------------------ keeping the faces clear

def faces():
    out = []
    for name, r in (("e2_adam", 165), ("e2_eve", 160)):
        e = np.load(L.ASSETS / f"vi_{name}_eyes.npz")["c"].mean(0)
        out.append((L.project(L.to_world(name, e)), r))
    return out


FACES = None


def clear_of_light(V, r=28.0):
    """False if this piece would shade either face from the presence light."""
    for name in ("e2_adam", "e2_eve"):
        e = L.to_world(name, np.load(L.ASSETS / f"vi_{name}_eyes.npz")["c"].mean(0))
        d = V - e
        for ld in (SUN, KEY):
            t = d @ ld
            perp = np.linalg.norm(d - np.outer(t, ld), axis=1)
            if np.any((t > 5) & (perp < r + t * .03)):
                return False
    return True


def clear_of_faces(V, margin=1.0):
    """False if this piece would sit in front of either face, as the camera sees it."""
    global FACES
    if FACES is None:
        FACES = faces()
    q = np.array([L.project(p) for p in V[:: max(1, len(V) // 40)]])
    for (fx, fy, fz), r in FACES:
        d = np.hypot((q[:, 0] - fx), (q[:, 1] - fy) * .85)
        if np.any((d < r * margin) & (q[:, 2] < fz + 30)):
            return False
    return True


# ------------------------------------------------------------------ the set

def build_set(M, rng):
    objs = {"fg": [], "sky": []}
    # The ground: soft rises and hollows, moss and leaf litter.
    n = 120
    gx, gy = np.meshgrid(np.linspace(-1400, 1400, n), np.linspace(-4200, 900, n))
    gz = 7 * np.sin(gx * .011 + 1) * np.sin(gy * .008) + 4 * np.sin(gx * .03 + gy * .021)
    gz[(np.abs(gx) < 140) & (np.abs(gy) < 160)] *= .3
    V = np.c_[gx.ravel(), gy.ravel(), gz.ravel() - 2]
    F = [[i * n + j, i * n + j + 1, (i + 1) * n + j + 1, (i + 1) * n + j] for i in range(n - 1) for j in range(n - 1)]
    obj("ground", (V, np.array(F)), M["ground"], 7)
    rng = np.random.default_rng(101)                 # each part keeps its own dice, so changing one leaves the rest
    # The great tree they hide under, at camera left behind them, with buttress roots spreading into the ground.
    TX, TY, TR = 128.0, -160.0, 70.0
    V, F = trunk_mesh(TX, TY, TR, h=1500, seed=7, n=48, rows=70)
    V[:, 2] += 54
    obj("trunk", (V, F), M["bark"], 6)
    roots = [pl.buttress(np.array([TX + np.cos(a) * TR * .8, TY + np.sin(a) * TR * .8, 0]), a, rng.uniform(120, 220), rng.uniform(60, 120), rng, rng.uniform(10, 16))
             for a in (-.2, .7, 1.45, 2.3, 3.1, 4.0, 5.0)]
    obj("roots", pl.merge(roots), M["bark"], 6)
    rng = np.random.default_rng(102)
    # The deep garden: trunks receding into the dusk, thicker toward the back, clear in a lane toward the right.
    parts = []
    for i in range(120):
        y = -300 - rng.random() ** 1.15 * 3700
        x = rng.uniform(-1, 1) * (420 + abs(y) * .62)
        if np.hypot(x - TX, y - TY) < 200:
            continue
        px = L.project((x, y, 150))[0]
        if y > -900 and 230 < px < 1020:                       # a clear lane behind them, so the garden opens in depth
            continue
        if y > -1800 and 380 < px < 860:
            continue
        if y > L.GLOW[1] and abs(px - L.GLOW_PIXEL[0]) < 150 + 40 * 2000 / (205 - y):   # keep the glow itself in view
            continue
        V, F = trunk_mesh(x, y, rng.uniform(12, 34) * (1 + abs(y) / 2000), h=1050, seed=100 + i, n=14, rows=24)
        V[:, 2] += 54
        parts.append((V, F))
    # Trees standing in front of the glow, so its light breaks into rays that fan toward us.
    rng = np.random.default_rng(113)
    cam = np.array(L.CAMERA["loc"], float)
    for i in range(16):
        y = rng.uniform(-2650, -1750)
        lx = cam[0] + (L.GLOW[0] - cam[0]) * (cam[1] - y) / (cam[1] - L.GLOW[1])
        x = lx + rng.uniform(-1, 1) * 380
        if abs(x - lx) < 150:
            x = lx + np.sign(x - lx + 1e-3) * rng.uniform(150, 220)
        V, F = trunk_mesh(x, y, rng.uniform(14, 30), h=1050, seed=500 + i, n=14, rows=24)
        V[:, 2] += 54
        parts.append((V, F))
    obj("trunks", pl.merge(parts), M["bark_far"], 6)
    gl = []
    for i in range(18):
        y = rng.uniform(-2600, -1900)
        lx = cam[0] + (L.GLOW[0] - cam[0]) * (cam[1] - y) / (cam[1] - L.GLOW[1])
        c = np.array([lx + rng.uniform(-1, 1) * 380, y, rng.uniform(260, 700)])
        r = rng.uniform(70, 150)
        if np.hypot(c[0] - lx, (c[2] - (cam[2] + (L.GLOW[2] - cam[2]) * (cam[1] - y) / (cam[1] - L.GLOW[1]))) * 1.3) < r + 170:
            continue
        gl.append(pl.shrub(c, r, int(r * .9), rng.uniform(20, 32), rng, kind="fig" if i % 2 else "long"))
    obj("glow_leaves", pl.merge(gl), M["leaf_dark"], 5)
    rng = np.random.default_rng(103)
    crowns = [blob((rng.uniform(-1.3, 1.3) * (500 + abs(y) * .6), y, rng.uniform(720, 980) + abs(y) * .05), (r, r * .8, r * .4), 200 + i, 20)
              for i, (y, r) in enumerate(zip(-250 - rng.random(110) ** .8 * 3800, rng.uniform(260, 520, 110)))]
    crowns.append(blob((TX + 40, TY, 980), (520, 380, 200), 300, 26))
    gp = np.array(L.GLOW_PIXEL)
    crowns = [c for c in crowns if not (c[0][:, 1].max() > L.GLOW[1] - 300 and
                                        np.min(np.hypot(*(np.array([L.project(p)[:2] for p in c[0][::40]]) - gp).T)) < 260)]
    can = obj("canopy", pl.merge(crowns), M["crown"], 5)
    can.visible_shadow = False                             # the canopy's light is the gobo's job
    objs["sky"].append(can)
    # The canopy's underside over the deep garden: leaf masses in shadow, so the top of the frame is a ceiling of leaves
    # with light coming through it, not the bare upper trunks.
    rng = np.random.default_rng(112)
    cm_ = []
    while len(cm_) < 44:
        y = -800 - rng.random() ** .9 * 2400
        x = -6 + rng.uniform(-1.25, 1.25) * (205 - y) * .22           # across the frame's width at that depth
        r = rng.uniform(130, 280)
        c = np.array([x, y, rng.uniform(470, 640)])
        if not clear_of_light(np.array([c + [r, 0, 0], c - [r, 0, 0], c, c + [0, 0, -r * .5]]), 120):
            continue
        cm_.append(pl.shrub(c, r, int(r * .9), rng.uniform(26, 40), rng, kind="fig" if len(cm_) % 2 else "long"))
    obj("canopy_low", pl.merge(cm_), M["leaf_dark"], 5)
    rng = np.random.default_rng(104)
    # Undergrowth: ferns around them and through the middle ground, darker leaves far off.
    fr = []
    for i in range(70):
        c = np.array([rng.uniform(-170, 160), rng.uniform(-90, 130), 0])
        if np.hypot(c[0] - 0, c[1] - 10) < 34:
            continue
        for k in range(int(rng.integers(4, 8))):
            a = rng.uniform(0, 2 * np.pi)
            fr.append(pl.frond(c, (np.cos(a), np.sin(a), rng.uniform(.9, 1.6)), rng.uniform(40, 80), rng))
    obj("ferns", pl.merge(fr), M["fern"], 5)
    rng = np.random.default_rng(105)
    far = []
    for i in range(240):
        c = np.array([rng.uniform(-900, 900), rng.uniform(-1600, -160), 0])
        for k in range(3):
            a = rng.uniform(0, 2 * np.pi)
            far.append(pl.frond(c, (np.cos(a), np.sin(a), 1.3), rng.uniform(50, 110), rng, pinnae=10))
    obj("ferns_far", pl.merge(far), M["leaf_dark"], 5)
    rng = np.random.default_rng(106)
    # Leafy masses through the middle and far garden, so it reads as a garden and not a row of columns.
    sh = []
    for i in range(46):
        y = -260 - rng.random() ** 1.3 * 2600
        x = rng.uniform(-1, 1) * (300 + abs(y) * .55)
        r = rng.uniform(40, 110) * (1 + abs(y) / 2500)
        sh.append(pl.shrub((x, y, r * .45), r, int(60 + r * .6), rng.uniform(14, 22) * (1 + abs(y) / 3000), rng, kind="fig" if i % 3 else "long"))
    obj("shrubs", pl.merge(sh), M["leaf"], 5)
    rng = np.random.default_rng(107)
    # A fig tree at camera right in the middle ground: the leaves they sewed (Genesis 3:7), now the cover they hide behind.
    stems, leaves = [], []
    tries = 0
    while len(stems) < 14 and tries < 200:
        tries += 1
        base = np.array([-128 + rng.normal(0, 14), -30 + rng.normal(0, 24), rng.uniform(10, 70)])
        d = np.array([rng.uniform(.1, .9), rng.uniform(-.2, .6), rng.uniform(.3, 1.3)])
        s_, l_ = pl.fig_branch(base, d, rng.uniform(70, 140), int(rng.integers(5, 9)), rng.uniform(17, 26), rng)
        if not clear_of_faces(np.vstack([s_[0], l_[0]])) or not clear_of_light(np.vstack([s_[0], l_[0]])):
            continue
        stems.append(s_)
        leaves.append(l_)
    rng = np.random.default_rng(108)
    # Fig leaves just behind them, inside the shaft: the light catches them, so their heads stand against lit leaves.
    k = 0
    while k < 5:
        base = np.array([rng.uniform(-90, -40), rng.uniform(-95, -60), rng.uniform(40, 90)])
        d = np.array([rng.uniform(.4, 1.0), rng.uniform(-.2, .2), rng.uniform(.5, 1.1)])
        s_, l_ = pl.fig_branch(base, d, rng.uniform(80, 120), int(rng.integers(6, 9)), rng.uniform(18, 24), rng)
        Vb = np.vstack([s_[0], l_[0]])
        if clear_of_faces(Vb, .9) and clear_of_light(Vb, 30):
            stems.append(s_)
            leaves.append(l_)
            k += 1
    rng = np.random.default_rng(109)
    # Leafy branches hanging into the top of the frame from the canopy, catching the light.
    k = 0
    while k < 7:
        base = np.array([rng.uniform(-260, 120), rng.uniform(-420, -120), rng.uniform(330, 430)])
        d = np.array([rng.normal(0, .6), rng.normal(.3, .3), -.4])
        s_, l_ = pl.fig_branch(base, d, rng.uniform(90, 160), int(rng.integers(6, 10)), rng.uniform(16, 24), rng, gravity=.05)
        if clear_of_light(np.vstack([s_[0], l_[0]]), 40):
            stems.append(s_)
            leaves.append(l_)
            k += 1
    obj("fig_stems", pl.merge(stems), M["stem"], 5)
    obj("fig_leaves", pl.merge(leaves), M["leaf_fig"], 24)
    rng = np.random.default_rng(110)
    # Vines hanging from the canopy through the middle ground.
    vines = []
    while len(vines) < 9:
        v_ = pl.vine((rng.uniform(-260, 220), rng.uniform(-420, -60), 640), rng.uniform(380, 600), rng, leaves=22)
        if clear_of_faces(v_[0]) and clear_of_light(v_[0], 30):
            vines.append(v_)
    obj("vines", pl.merge(vines), M["leaf"], 5)
    rng = np.random.default_rng(111)
    # At the lens: broad dark leaves rising from the bottom corners and a fig branch reaching in from the top left.
    fg = []
    for (bx, by), lean, n_ in (((21, 122), -.18, 5), ((-37, 118), .24, 4), ((-8, 132), .05, 1)):
        k = 0
        while k < n_:
            d = np.array([lean + rng.normal(0, .12), rng.uniform(-.25, 0), 1])
            V, F = pl.long_leaf(rng.uniform(58, 72), rng.uniform(10, 15), rng, bend=.3)
            V = pl.orient(V, (bx + rng.normal(0, 5), by + rng.normal(0, 5), -4), d, roll=rng.uniform(-.7, .7))
            if clear_of_faces(V, 1.25):
                fg.append((V, F))
                k += 1
    objs["fg"].append(obj("fg_leaves", pl.merge(fg), M["fg"], 23))
    return objs


def camera_meta(cam_ob):
    c = cam_ob.data
    return dict(loc=list(cam_ob.matrix_world.translation), matrix=[list(r) for r in cam_ob.matrix_world], lens=c.lens, sensor=c.sensor_height)


def render(path, spp, film_transparent=False, passes=True):
    sc = bpy.context.scene
    sc.cycles.samples = spp
    sc.render.film_transparent = film_transparent
    if passes:
        s3.passes()
    sc.render.image_settings.media_type = "MULTI_LAYER_IMAGE"
    sc.render.image_settings.file_format = "OPEN_EXR_MULTILAYER"
    sc.render.image_settings.color_depth = "32"
    sc.render.image_settings.exr_codec = "ZIP"
    sc.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def build(width=1080, spp=40, which=("main", "fg", "shadow")):
    H = int(width * 16 / 9)
    sc = s3.reset((width, H), spp)
    sc.render.threads = 2
    rng = np.random.default_rng(23)
    CM = st.materials()
    M = mats()
    st.cast(CM)
    objs = build_set(M, rng)
    G = gobo(rng)
    gob = gobo_plane(G)
    # Light. The presence: warm, through the canopy, the only gold in the frame.
    s3.sun(tuple(KEY), (1.0, .76, .46), 10.0, angle=.7)
    s3.sun(tuple(SUN), (1.0, .74, .44), 5.0, angle=1.5)
    # The glow itself, deep in the garden: the one thing in frame that is pure gold.
    s3.mesh_from_arrays("glow", *blob(tuple(L.GLOW), (55, 40, 55), 400, 24, .25), s3.emission("gold", (1, .82, .56), 22), index=8)
    # The cool of the day: a blue-green dusk under the trees, a soft fill from camera left, a cool kicker from behind.
    s3.world_color((.055, .085, .115), 1.0)
    # Sky light under the canopy: a soft cool light from above and behind with no shadows, so the deep garden keeps its
    # shapes in the dusk instead of sinking to black under the haze.
    sky = s3.sun((.25, -.55, .8), (.5, .66, 1.0), .5, angle=40)
    sky.data.use_shadow = False
    s3.area((150, 250, 150), (0, 10, 80), (.55, .7, 1.0), 60000, 160)
    s3.area((52, -82, 165), (-6, 10, 95), (.5, .68, 1.0), 45000, 70)
    s3.area((-6, 196, 96), (0, 0, 90), (1, .9, .8), 900, 24)
    # Warm bounce from the glow off the leaves at camera right, so the near side of their faces isn't lost.
    s3.area((-150, 190, 120), (-6, 12, 88), (1, .78, .56), 14000, 90)
    c = L.CAMERA
    cam = s3.camera(c["loc"], c["target"], lens=c["lens"])
    bpy.context.view_layer.update()
    meta = dict(width=width, height=H, camera=camera_meta(cam), sun=list(SUN), gz=GZ, gobo=GOBO, gobo_shape=list(G.shape))
    if "main" in which:
        for o in objs["fg"]:
            o.visible_camera = False
        render(OUT / "e2_main.exr", spp)
        for o in objs["fg"]:
            o.visible_camera = True
    if "fg" in which:
        keep = {o.name for o in objs["fg"]}
        hidden = []
        for o in bpy.context.scene.objects:
            if o.type == "MESH" and o.name not in keep and o.visible_camera:
                o.visible_camera = False
                hidden.append(o)
        render(OUT / "e2_fg.exr", max(spp // 2, 12), film_transparent=True)
        for o in hidden:
            o.visible_camera = True
    if "shadow" in which:
        # Depth seen from the light: an orthographic camera looking down the light's direction over the visible region.
        centre = np.array([-60.0, -900.0, 60.0])
        size = 4800.0
        lc = centre + SUN * 3000
        cd = bpy.data.cameras.new("lightcam")
        cd.type = "ORTHO"
        cd.ortho_scale = size
        cd.clip_start, cd.clip_end = 1, 12000
        lob = bpy.data.objects.new("lightcam", cd)
        bpy.context.scene.collection.objects.link(lob)
        from mathutils import Vector
        lob.location = tuple(lc)
        lob.rotation_euler = (Vector(tuple(-SUN))).to_track_quat("-Z", "Y").to_euler()
        sc.camera = lob
        gob.hide_render = True
        for o in objs["sky"]:
            o.hide_render = True                           # the canopy masses cast no shadow in the render either
        for o in objs["fg"]:
            o.visible_camera = True
        sc.render.resolution_x = sc.render.resolution_y = 2048
        sc.cycles.use_denoising = False
        sc.cycles.max_bounces = 0
        sc.view_layers[0].use_pass_z = True
        render(OUT / "e2_shadow.exr", 1, passes=False)
        bpy.context.view_layer.update()
        meta["light_cam"] = dict(matrix=[list(r) for r in lob.matrix_world], ortho=size, res=2048)
    if "shadow" not in which and (OUT / "e2_meta.json").exists():          # keep the light camera from the last full run
        old = json.load(open(OUT / "e2_meta.json"))
        meta = {**old, **meta}
    json.dump(meta, open(OUT / "e2_meta.json", "w"), indent=1)
    print("done", flush=True)


if __name__ == "__main__":
    a = sys.argv
    build(int(a[1]) if len(a) > 1 else 1080, int(a[2]) if len(a) > 2 else 40, tuple(a[3].split(",")) if len(a) > 3 else ("main", "fg", "shadow"))
