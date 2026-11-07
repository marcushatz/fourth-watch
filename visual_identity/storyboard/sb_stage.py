"""Blender pieces for the storyboard frames: people placed by a matrix, extra materials (skins, leather, fruit, serpent),
props, and the three renders every frame makes (main, lens foliage, light depth) under one name.

Object ids: as Eden v2 (1 skin, 2 hair, 3 scalp, 4 brows and beard, 5 foliage, 6 bark, 7 ground, 8 gold light, 9 eyes,
11 shirt, 12 trousers, 13 socks, 19 props, 21 fig leaves, 23 lens foliage, 24 backlit leaves) plus
  25 garments of skin   26 the fruit   27 the serpent   28 sky and far land
"""
import json
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Vector

HERE = Path(__file__).resolve().parent
E2 = HERE.parent / "src" / "eden_v2"
sys.path.insert(0, str(E2))
import layout as L  # noqa: E402
import plants_e2 as pl  # noqa: E402
import stage_e2 as st  # noqa: E402
from stage_e2 import P, s3  # noqa: E402
from scene_s13 import blob, merge  # noqa: E402

OUT = Path("/home/claude/fw-tools/out")
A = L.ASSETS


def rz(deg):
    return L.rz(deg)


def floor_of(name):
    d = np.load(A / f"vi_{name}_body.npz")
    return float(d["v"][np.unique(d["f"])][:, 2].min())


def place(name, x, y, rot, z=0.0, sit=None):
    """4x4 placing a baked figure: turned by rot about z, its lowest point on z (or its seat on sit)."""
    M = np.eye(4)
    M[:3, :3] = rz(rot)
    fz = floor_of(name) if sit is None else sit
    M[:3, 3] = (x, y, z - fz)
    return M


def to_world(M, p):
    return M[:3, :3] @ np.asarray(p, float) + M[:3, 3]


def materials():
    m = st.materials()
    m.update(
        skin_m=s3.skin_material("skin_m2", (.31, .19, .125), (.38, .17, .11), rough=.58, sss=.22),
        shirt=P("shirt2", (.13, .16, .2), .85, .15, bump=(2.5, .25, .3)), pants=P("pants2", (.06, .065, .08), .8, .15, bump=(3, .2, .2)),
        socks=P("socks2", (.05, .045, .04), .7, .2),
        tunic=hide_material(),
        hair_m=P("hair_m", (.03, .02, .013), .42, .4))
    return m


def hide_material():
    """Hide and fur, as Genesis 3:21 has it: warm brown with darker patches and a soft pile."""
    m = bpy.data.materials.new("hide")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Roughness"].default_value = .9
    b.inputs["Sheen Weight"].default_value = .15
    b.inputs["Sheen Roughness"].default_value = .5
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = .25
    n.inputs["Detail"].default_value = 4
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = .35, (.03, .017, .01, 1)
    els[1].position, els[1].color = .65, (.075, .042, .022, 1)
    nt.links.new(n.outputs["Fac"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Base Color"])
    f = nt.nodes.new("ShaderNodeTexNoise")
    f.inputs["Scale"].default_value = 9
    f.inputs["Detail"].default_value = 8
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = .7
    nt.links.new(f.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs[0], b.inputs["Normal"])
    return m


def eye_look(name, M, look):
    """Eye direction in the figure's head space that points at a world target."""
    d = np.load(A / f"vi_{name}_eyes.npz")
    c = to_world(M, d["c"].mean(0))
    w = np.asarray(look, float) - c
    w = M[:3, :3].T @ (w / np.linalg.norm(w))
    return d["r"].T @ w


def person(name, M, mats, skin, hair, iris, look=None, look_at=None, eye_scale=1.17):
    """Load a baked figure. look: eye direction in head space; look_at: a world point the eyes find instead."""
    MM = Matrix(M.tolist())
    ob = s3.mesh_from_npz(name, A / f"vi_{name}_body.npz", mats[skin], MM, index=1)
    m = ob.modifiers.new("sub", "SUBSURF")
    m.levels = m.render_levels = 2
    parts = (("hair", hair, 2), ("scalp", hair, 3), ("beard", hair, 4), ("brow", hair, 4),
             ("shirt", "shirt", 11), ("pants", "pants", 12), ("socks", "socks", 13), ("tunic", "tunic", 25),
             ("leaves", "figleaf_d", 21), ("wrap", "figleaf_d", 21), ("leavesleaf", "figleaf", 21), ("wrapleaf", "figleaf", 21))
    for part, mat, idx in parts:
        f = A / f"vi_{name}_{part}.npz"
        if f.exists():
            o = s3.mesh_from_npz(f"{name}_{part}", f, mats[mat], MM, index=idx)
            if idx in (11, 12, 13, 25) or part in ("leaves", "wrap"):
                sm = o.modifiers.new("sub", "SUBSURF")
                sm.levels = sm.render_levels = 1
    if look_at is not None:
        look = eye_look(name, M, look_at)
    st.eye_balls(name, MM, mats, iris, look if look is not None else (0, 1, 0), eye_scale)
    return ob


def fruit(c, r, rot=(0, 0, 0), bite=None):
    """The fruit: Genesis doesn't name it, so it isn't an apple. A soft, ribbed oval, deep red going to amber."""
    m = bpy.data.materials.new("fruit")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Roughness"].default_value = .32
    b.inputs["Subsurface Weight"].default_value = .25
    b.inputs["Subsurface Radius"].default_value = (1, .3, .1)
    geo = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Object"], sep.inputs[0])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (.2, .015, .025, 1)
    ramp.color_ramp.elements[1].color = (.42, .07, .045, 1)
    mp = nt.nodes.new("ShaderNodeMapRange")
    mp.inputs["From Min"].default_value, mp.inputs["From Max"].default_value = -r, r
    nt.links.new(sep.outputs["Z"], mp.inputs["Value"])
    nt.links.new(mp.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Base Color"])
    V, F = blob((0, 0, 0), (r, r, r * 1.15), 77, 26, .12)
    a = np.arctan2(V[:, 1], V[:, 0])
    V[:, :2] *= (1 + .035 * np.cos(a * 6))[:, None]
    V[:, 2] -= r * .12 * np.exp(-((V[:, 2] - r * 1.1) / (r * .25)) ** 2)
    if bite is not None:                                   # she has already eaten (Genesis 3:6): one bite out of its side
        bd = np.asarray(bite, float) / np.linalg.norm(bite)
        bc = bd * r * 1.12
        d = np.linalg.norm(V - bc, axis=1)
        k = np.clip(1 - d / (r * .62), 0, 1)
        V = V - bd * (k ** .6 * r * .38)[:, None]
        fl = blob(tuple(bd * r * .5), (r * .45, r * .45, r * .45), 3, 14, .05)
        flesh = P("flesh", (.55, .42, .26), .55, .2)
        s3.mesh_from_arrays("fruit_flesh", fl[0] * np.array([1, 1, 1]), fl[1], flesh, s3.matrix(loc=tuple(c), rot=rot), index=26)
    stem = np.array([[0, 0, r * 1.05], [.3, .1, r * 1.35], [.8, .2, r * 1.55]])
    ob = s3.mesh_from_arrays("fruit", V, F, m, s3.matrix(loc=tuple(c), rot=rot), index=26)
    s3.mesh_from_arrays("fruit_stem", *pl.tube(stem, .28, .18, 5), P("stemf", (.06, .04, .02), .7), s3.matrix(loc=tuple(c), rot=rot), index=26)
    return ob


def serpent(path, r0, r1, name="serpent"):
    """A serpent along a path: a tapering body, a wedge head, dark bronze-green scales that shift colour in the light."""
    m = bpy.data.materials.new("serpent")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    b.inputs["Roughness"].default_value = .38
    b.inputs["Specular IOR Level"].default_value = .6
    b.inputs["Coat Weight"].default_value = .35
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 1.6
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (.01, .02, .012, 1)
    ramp.color_ramp.elements[1].color = (.06, .08, .03, 1)
    nt.links.new(vor.outputs["Distance"], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Base Color"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = .5
    nt.links.new(vor.outputs["Distance"], bp.inputs["Height"])
    nt.links.new(bp.outputs[0], b.inputs["Normal"])
    pts = np.asarray(path, float)
    n = len(pts)
    t = np.linspace(0, 1, n)
    rad = r0 + (r1 - r0) * t ** .8
    rad[-6:] = rad[-6:] * np.array([1.0, 1.15, 1.35, 1.4, 1.1, .5])          # the head: a wedge at the end
    V, F = [], []
    sides = 16
    ang = np.linspace(0, 2 * np.pi, sides, endpoint=False)
    T = np.gradient(pts, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    for i in range(n):
        d, s_, nn = pl.frame(T[i])
        flat = np.c_[np.cos(ang), np.sin(ang) * .78]
        V.append(pts[i] + rad[i] * (flat[:, :1] * s_ + flat[:, 1:] * nn))
    V = np.vstack(V)
    for i in range(n - 1):
        for j in range(sides):
            F.append([i * sides + j, i * sides + (j + 1) % sides, (i + 1) * sides + (j + 1) % sides, (i + 1) * sides + j])
    ob = s3.mesh_from_arrays(name, V, np.array(F), m, index=27)
    sm = ob.modifiers.new("sub", "SUBSURF")
    sm.levels = sm.render_levels = 1
    # Eyes: two small dark glossy beads on the head.
    hd, hs, hn = pl.frame(T[-3])
    eyes = [blob(tuple(pts[-3] + hs * rad[-3] * .75 * sg + hn * rad[-3] * .45), (rad[-3] * .2,) * 3, 5, 10, 0) for sg in (-1, 1)]
    s3.mesh_from_arrays(name + "_eyes", *merge(eyes), P("seye", (.01, .008, .004), .05, .9), index=27)
    return ob


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


def shoot(name, cam, sun_dir, fg_objs, spp, width, meta_extra=None, shadow=True, shadow_centre=(-60, -900, 60), shadow_size=4800,
          gobo=None, skip=()):
    """The frame's three renders: main (everything but the lens foliage), the lens foliage alone, and depth from the light."""
    sc = bpy.context.scene
    bpy.context.view_layer.update()
    meta = dict(width=width, height=sc.render.resolution_y, sun=list(sun_dir),
                camera=dict(loc=list(cam.matrix_world.translation), matrix=[list(r) for r in cam.matrix_world], lens=cam.data.lens,
                            sensor=cam.data.sensor_height))
    meta.update(meta_extra or {})
    if "main" not in skip:
        for o in fg_objs:
            o.visible_camera = False
        render(OUT / f"{name}_main.exr", spp)
        for o in fg_objs:
            o.visible_camera = True
    if fg_objs and "fg" not in skip:
        keep = {o.name for o in fg_objs}
        hidden = [o for o in sc.objects if o.type == "MESH" and o.name not in keep and o.visible_camera]
        for o in hidden:
            o.visible_camera = False
        render(OUT / f"{name}_fg.exr", max(spp // 2, 12), film_transparent=True)
        for o in hidden:
            o.visible_camera = True
    if shadow and "shadow" not in skip:
        sun = np.asarray(sun_dir, float)
        cd = bpy.data.cameras.new("lightcam")
        cd.type = "ORTHO"
        cd.ortho_scale = shadow_size
        cd.clip_start, cd.clip_end = 1, 20000
        lob = bpy.data.objects.new("lightcam", cd)
        sc.collection.objects.link(lob)
        lob.location = tuple(np.asarray(shadow_centre, float) + sun * 4000)
        lob.rotation_euler = Vector(tuple(-sun)).to_track_quat("-Z", "Y").to_euler()
        sc.camera = lob
        for o in sc.objects:
            if o.get("no_shadow_map") or o.name == "gobo":
                o.hide_render = True
        sc.render.resolution_x = sc.render.resolution_y = 2048
        sc.cycles.use_denoising = False
        sc.cycles.max_bounces = 0
        render(OUT / f"{name}_shadow.exr", 1, passes=False)
        bpy.context.view_layer.update()
        meta["light_cam"] = dict(matrix=[list(r) for r in lob.matrix_world], ortho=shadow_size, res=2048)
    if gobo is not None:
        meta.update(gobo)
    old = {}
    if (OUT / f"{name}_meta.json").exists():
        old = json.load(open(OUT / f"{name}_meta.json"))
    json.dump({**old, **meta}, open(OUT / f"{name}_meta.json", "w"), indent=1)
