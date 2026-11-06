"""Blender helpers. Run with the fw-tools virtual environment. Stills only."""
import math
from pathlib import Path

import bpy
import numpy as np
from mathutils import Euler, Matrix, Vector

ASSETS = Path("/home/claude/fw-tools/assets")


def reset(res=(1080, 1920), spp=32, film=1.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = "CYCLES"
    s.cycles.device = "CPU"
    s.cycles.samples = spp
    s.cycles.use_denoising = True
    s.cycles.denoiser = "OPENIMAGEDENOISE"
    s.cycles.use_adaptive_sampling = True
    s.cycles.adaptive_threshold = .03
    s.cycles.max_bounces = 5
    s.cycles.diffuse_bounces = 3
    s.cycles.glossy_bounces = 2
    s.cycles.transmission_bounces = 2
    s.cycles.volume_bounces = 0
    s.render.threads_mode = "FIXED"
    s.render.threads = 2
    s.render.resolution_x, s.render.resolution_y = res
    s.render.film_transparent = False
    s.view_settings.view_transform = "Standard"
    w = bpy.data.worlds.new("w")
    s.world = w
    w.use_nodes = True
    return s


def world_color(c, strength=1.0):
    n = bpy.context.scene.world.node_tree.nodes["Background"] if "Background" in bpy.context.scene.world.node_tree.nodes else None
    if n is None:
        nt = bpy.context.scene.world.node_tree
        n = nt.nodes.new("ShaderNodeBackground")
        o = nt.nodes.new("ShaderNodeOutputWorld")
        nt.links.new(n.outputs[0], o.inputs[0])
    n.inputs[0].default_value = (*c, 1)
    n.inputs[1].default_value = strength


def mesh_from_npz(name, path, mat=None, matrix=None, smooth=True, index=0):
    d = np.load(path)
    return mesh_from_arrays(name, d["v"], d["f"], mat, matrix, smooth, index)


def mesh_from_arrays(name, v, f, mat=None, matrix=None, smooth=True, index=0):
    me = bpy.data.meshes.new(name)
    v = np.asarray(v, np.float32)
    f = np.asarray(f, np.int32)
    me.vertices.add(len(v))
    me.vertices.foreach_set("co", v.reshape(-1))
    me.loops.add(f.size)
    me.loops.foreach_set("vertex_index", f.reshape(-1))
    n = len(f)
    me.polygons.add(n)
    me.polygons.foreach_set("loop_start", np.arange(0, f.size, f.shape[1], dtype=np.int32))
    me.update(calc_edges=True)
    me.polygons.foreach_set("use_smooth", np.full(n, smooth, bool))
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat:
        me.materials.append(mat)
    if matrix is not None:
        ob.matrix_world = matrix
    ob.pass_index = index
    return ob


def principled(name, color, rough=.6, spec=.3, sss=0.0, sss_r=(1, .3, .15), sss_scale=.5, bump=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    if b is None:
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        b = nt.nodes.new("ShaderNodeBsdfPrincipled")
        o = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(b.outputs[0], o.inputs[0])
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Specular IOR Level"].default_value = spec
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = sss_r
        b.inputs["Subsurface Scale"].default_value = sss_scale
    if bump:
        tex = nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = bump[0]
        tex.inputs["Detail"].default_value = 8
        bp = nt.nodes.new("ShaderNodeBump")
        bp.inputs["Strength"].default_value = bump[1]
        bp.inputs["Distance"].default_value = bump[2] if len(bump) > 2 else .1
        nt.links.new(tex.outputs[0], bp.inputs["Height"])
        nt.links.new(bp.outputs[0], b.inputs["Normal"])
    return m


def skin_material(name, base, flush, rough=.5, sss=.42):
    """Skin with slow colour change and fine surface grain, so faces stop reading as plastic."""
    m = principled(name, base, rough, .35, sss=sss, sss_r=(1, .35, .2), sss_scale=1.1)
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    n1 = nt.nodes.new("ShaderNodeTexNoise")
    n1.inputs["Scale"].default_value = .22
    n1.inputs["Detail"].default_value = 5
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = (*base, 1)
    mix.inputs["B"].default_value = (*flush, 1)
    nt.links.new(n1.outputs[0], mix.inputs["Factor"])
    nt.links.new(mix.outputs["Result"], b.inputs["Base Color"])
    n2 = nt.nodes.new("ShaderNodeTexNoise")
    n2.inputs["Scale"].default_value = 9
    n2.inputs["Detail"].default_value = 6
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = .22
    bp.inputs["Distance"].default_value = .05
    nt.links.new(n2.outputs[0], bp.inputs["Height"])
    nt.links.new(bp.outputs[0], b.inputs["Normal"])
    return m


def emission(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs[0].default_value = (*color, 1)
    e.inputs[1].default_value = strength
    o = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(e.outputs[0], o.inputs[0])
    return m


def camera(loc, target, lens=50, sensor=36, fit="VERTICAL", dof=None):
    c = bpy.data.cameras.new("cam")
    c.lens = lens
    c.sensor_width = sensor
    c.sensor_fit = fit
    c.sensor_height = sensor
    c.clip_start, c.clip_end = 1, 200000
    ob = bpy.data.objects.new("cam", c)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = ob
    if dof:
        c.dof.use_dof = True
        c.dof.focus_distance, c.dof.aperture_fstop = dof
    return ob


def sun(direction_from, color, energy, angle=2):
    l = bpy.data.lights.new("sun", "SUN")
    l.color, l.energy, l.angle = color, energy, math.radians(angle)
    ob = bpy.data.objects.new("sun", l)
    bpy.context.scene.collection.objects.link(ob)
    d = Vector(direction_from).normalized()
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    return ob


def area(loc, target, color, power, size):
    l = bpy.data.lights.new("area", "AREA")
    l.color, l.energy, l.size = color, power, size
    ob = bpy.data.objects.new("area", l)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(loc) - Vector(target)).to_track_quat("Z", "Y").to_euler()
    return ob


def passes():
    v = bpy.context.view_layer
    v.use_pass_z = True
    v.use_pass_normal = True
    v.use_pass_diffuse_color = True
    v.use_pass_diffuse_direct = True
    v.use_pass_object_index = True
    v.use_pass_ambient_occlusion = True


def save(path):
    s = bpy.context.scene
    s.render.image_settings.media_type = "MULTI_LAYER_IMAGE"
    s.render.image_settings.file_format = "OPEN_EXR_MULTILAYER"
    s.render.image_settings.color_depth = "16"
    s.render.image_settings.exr_codec = "ZIP"
    s.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def matrix(loc=(0, 0, 0), rot=(0, 0, 0), scale=1):
    return Matrix.Translation(loc) @ Euler(tuple(math.radians(a) for a in rot)).to_matrix().to_4x4() @ Matrix.Scale(scale, 4)
