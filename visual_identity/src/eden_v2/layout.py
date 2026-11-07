"""Where everything sits in the Eden v2 frame, shared by the cast (so Adam's hand can find Eve's shoulder) and the set.

World space: cm, ground at z = 0, the camera looks down -y. Camera right is -x: the figure's left.
The presence light glows deep in the garden at frame right, low between the trees (after Marcus's reference, Nov 6). Its
light streams toward them through the trunks; they have turned toward it from their hiding place, so it lights their faces.
God is never shown: only the light.
"""
import numpy as np

ASSETS = __import__("pathlib").Path("/home/claude/fw-tools/assets")

# x, y and a turn about z (degrees) for each figure; the lowest point of each body sits on the ground.
PLACE = {
    "e2_eve": dict(x=14.0, y=8.0, rot=-14.0),
    "e2_adam": dict(x=11.0, y=-20.0, rot=14.0),
}

LIGHT_DIR = None                               # set below: from them toward the glow
GLOW_PIXEL, GLOW_DIST = (800.0, 420.0), 2300.0  # where the light sits in the 1080x1920 frame, and how far into the garden
CAMERA = dict(loc=(-6.0, 205.0, 80.0), target=(2.0, 0.0, 80.0), lens=46.0)


def rz(deg):
    t = np.radians(deg)
    return np.array([[np.cos(t), -np.sin(t), 0], [np.sin(t), np.cos(t), 0], [0, 0, 1.0]])


def floor_of(name):
    d = np.load(ASSETS / f"vi_{name}_body.npz")
    return float(d["v"][np.unique(d["f"])][:, 2].min())


def to_world(name, p, floor=None):
    """A point in the figure's own baked space, in world space."""
    c = PLACE[name]
    fz = floor_of(name) if floor is None else floor
    return rz(c["rot"]) @ np.asarray(p, float) + np.array([c["x"], c["y"], -fz])


def to_local(name, p, floor):
    c = PLACE[name]
    return rz(c["rot"]).T @ (np.asarray(p, float) - np.array([c["x"], c["y"], -floor]))


def matrix(name):
    c = PLACE[name]
    M = np.eye(4)
    M[:3, :3] = rz(c["rot"])
    M[:3, 3] = (c["x"], c["y"], -floor_of(name))
    return M


def project(p, W=1080, H=1920):
    """World point to pixel, for the frame's camera (sensor fit vertical, 36 mm)."""
    c = CAMERA
    eye, tgt = np.array(c["loc"], float), np.array(c["target"], float)
    f = tgt - eye
    f /= np.linalg.norm(f)
    r = np.cross(f, [0, 0, 1.0])
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    d = np.asarray(p, float) - eye
    x, y, z = d @ r, d @ u, d @ f
    k = c["lens"] / 18.0 * H / 2
    return np.array([W / 2 + k * x / z, H / 2 - k * y / z, z])


def unproject(px, py, dist, W=1080, H=1920):
    """Pixel and distance along the view axis to a world point."""
    c = CAMERA
    eye, tgt = np.array(c["loc"], float), np.array(c["target"], float)
    f = tgt - eye
    f /= np.linalg.norm(f)
    r = np.cross(f, [0, 0, 1.0])
    r /= np.linalg.norm(r)
    u = np.cross(r, f)
    k = c["lens"] / 18.0 * H / 2
    return eye + f * dist + r * (px - W / 2) / k * dist + u * (H / 2 - py) / k * dist


GLOW = unproject(*GLOW_PIXEL, GLOW_DIST)
LIGHT_DIR = GLOW - np.array([-4.0, 14.0, 92.0])
