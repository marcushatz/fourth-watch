"""Blender pieces for Eden v2: the cast placed from layout.py, with larger, glossier eyes and backlight-friendly materials.

Object ids follow the prototype (stage_vi.py), plus:
  23 foreground foliage (rendered on its own pass and blurred in the finish)
  24 backlit leaves in the middle ground (fig leaves that glow when the light is behind them)
"""
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[2] / "visual_style_exploration" / "src"))
import layout as L  # noqa: E402
import stage3d as s3  # noqa: E402
from scene_s13 import blob, merge  # noqa: E402

P = s3.principled


def leaf_material(name, color, back, rough=.5, translucent=.55, bump=None):
    """A leaf that glows when lit from behind: diffuse front mixed with a warm-green translucency."""
    m = P(name, color, rough, .35, bump=bump)
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    out = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"][0]
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tr.inputs["Color"].default_value = (*back, 1)
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = translucent
    nt.links.new(b.outputs[0], mix.inputs[1])
    nt.links.new(tr.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    return m


def materials():
    return dict(
        skin_a=s3.skin_material("skin_a2", (.33, .19, .12), (.4, .17, .11), rough=.58, sss=.22),
        skin_e=s3.skin_material("skin_e2", (.4, .245, .165), (.46, .2, .15), rough=.56, sss=.24),
        hair=P("hair2", (.065, .038, .02), .4, .4), hair_e=P("hair_e2", (.06, .03, .014), .36, .42),
        figleaf=leaf_material("figleaf2", (.06, .13, .04), (.32, .42, .08), .5, .35, bump=(1.6, .3, .4)),
        figleaf_d=P("figleaf_d2", (.03, .06, .022), .7, .2),
        white=P("white2", (.74, .71, .68), .18, .55), iris_a=P("iris_a", (.13, .065, .025), .3, .5),
        iris_e=P("iris_e", (.15, .075, .028), .3, .5), pupil=P("pupil", (.004, .003, .003), .12, .7))


def eye_balls(name, M, mats, iris, look, scale):
    """Eyeballs sized to the stylized sockets: a white, a coloured iris and a pupil, all glossy so they catch light."""
    d = np.load(L.ASSETS / f"vi_{name}_eyes.npz")
    R = d["r"]
    ld = R @ np.array(look, float)
    ld /= np.linalg.norm(ld)
    s = scale
    pw, pi, pp = [], [], []
    for c in d["c"]:
        c = c + R @ np.array([0, -.25 * s, 0])
        pw.append(blob(c, (1.3 * s, 1.3 * s, 1.3 * s), 1, 22, 0))
        pi.append(blob(c + ld * 1.0 * s, (.8 * s,) * 3, 2, 18, 0))       # a large iris: the stylized, readable eye
        pp.append(blob(c + ld * 1.06 * s, (.4 * s,) * 3, 3, 14, 0))
    s3.mesh_from_arrays(name + "_white", *merge(pw), mats["white"], M, index=9)
    s3.mesh_from_arrays(name + "_iris", *merge(pi), mats[iris], M, index=9)
    s3.mesh_from_arrays(name + "_pupil", *merge(pp), mats["pupil"], M, index=9)


def person(name, mats, skin, hair, iris, look, eye_scale):
    M = Matrix(L.matrix(name).tolist())
    ob = s3.mesh_from_npz(name, L.ASSETS / f"vi_{name}_body.npz", mats[skin], M, index=1)
    m = ob.modifiers.new("sub", "SUBSURF")
    m.levels = m.render_levels = 2
    for part, mat, idx in (("hair", hair, 2), ("scalp", hair, 3), ("beard", hair, 4), ("brow", hair, 4),
                           ("leaves", "figleaf_d", 21), ("wrap", "figleaf_d", 21), ("leavesleaf", "figleaf", 21), ("wrapleaf", "figleaf", 21)):
        f = L.ASSETS / f"vi_{name}_{part}.npz"
        if f.exists():
            o = s3.mesh_from_npz(f"{name}_{part}", f, mats[mat], M, index=idx)
            if part in ("leaves", "wrap"):
                sm = o.modifiers.new("sub", "SUBSURF")
                sm.levels = sm.render_levels = 1
    eye_balls(name, M, mats, iris, look, eye_scale)
    return ob


def cast(mats):
    """Both of them, with their eyes on the light (Adam) and lifted toward it (Eve)."""
    eve = person("e2_eve", mats, "skin_e", "hair_e", "iris_e", look=(-.62, .74, .2), eye_scale=1.2)
    adam = person("e2_adam", mats, "skin_a", "hair", "iris_a", look=(-.66, .72, .2), eye_scale=1.17)
    return adam, eve
