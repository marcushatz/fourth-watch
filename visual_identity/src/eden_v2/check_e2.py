"""Dev check for the Eden v2 cast: quick Cycles renders of the pose from the frame's camera, and close-ups of both faces.
    python check_e2.py frame|faces [width] [samples] [out.png]"""
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import layout as L  # noqa: E402
import stage_e2 as st  # noqa: E402
from stage_e2 import s3  # noqa: E402

SCRATCH = Path("/tmp/claude-0/-home-claude/29c8b03c-24f1-5be7-9f1d-94c500e7cd7a/scratchpad")


def lights():
    s3.world_color((.05, .07, .09), 1.0)
    d = L.LIGHT_DIR / np.linalg.norm(L.LIGHT_DIR)
    s3.sun(tuple(d), (1, .72, .4), 4.0, angle=3)
    s3.area((120, 260, 160), (0, 0, 80), (.6, .72, 1), 90000, 120)


def head_pos(name):
    d = np.load(L.ASSETS / f"vi_{name}_eyes.npz")
    return L.to_world(name, d["c"].mean(0))


def run(mode, width, spp, out):
    if mode == "frame":
        s3.reset((width, int(width * 16 / 9)), spp)
    elif False:
        pass
    else:
        s3.reset((width * 2, width), spp)
    mats = st.materials()
    st.cast(mats)
    g = np.array([[-900, -900, 0], [900, -900, 0], [900, 900, 0], [-900, 900, 0]], float)
    s3.mesh_from_arrays("ground", g, np.array([[0, 1, 2, 3]]), s3.principled("g", (.05, .06, .04), .9), index=7, smooth=False)
    lights()
    if mode == "frame":
        c = L.CAMERA
        s3.camera(c["loc"], c["target"], lens=c["lens"])
        import bpy
        sc = bpy.context.scene
        sc.render.image_settings.file_format = "PNG"
        sc.render.filepath = str(out)
        bpy.ops.render.render(write_still=True)
        return
    # Faces: one camera per head, rendered side by side by shifting the lens.
    import bpy
    sc = bpy.context.scene
    tiles = []
    for name in ("e2_adam", "e2_eve"):
        hp = head_pos(name)
        d = np.load(L.ASSETS / f"vi_{name}_eyes.npz")
        fwd = L.rz(L.PLACE[name]["rot"]) @ d["r"] @ np.array([0, 1.0, 0])
        cam = np.array(L.CAMERA["loc"], float)
        side = (cam - hp) / np.linalg.norm(cam - hp)
        view = fwd * .6 + side * .4 if mode == "faces" else side
        loc = hp + view / np.linalg.norm(view) * 62
        s3.camera(tuple(loc), tuple(hp), lens=60)
        sc.render.resolution_x = width
        sc.render.filepath = str(SCRATCH / f"_face_{name}.png")
        sc.render.image_settings.file_format = "PNG"
        bpy.ops.render.render(write_still=True)
        tiles.append(sc.render.filepath)
    import cv2
    cv2.imwrite(str(out), np.hstack([cv2.imread(t) for t in tiles]))


if __name__ == "__main__":
    a = sys.argv
    mode = a[1]
    run(mode, int(a[2]) if len(a) > 2 else 360, int(a[3]) if len(a) > 3 else 12,
        a[4] if len(a) > 4 else str(SCRATCH / f"check_{mode}.png"))
