#!/usr/bin/env python3
"""Adult paper heads and hands, built from stacked planes the way a paper sculptor cuts them.

Head units: crown to chin is 1. The figure faces +x. Light and shadow come from raised sheets, not from outlines.
"""
import numpy as np

from paper_stage import curve, place, raster, ribbon

M_OUT = [(.46, 0), (.66, .03), (.79, .11), (.865, .22), (.888, .31), (.899, .372), (.877, .425), (.886, .47), (.925, .54), (.972, .612), (.984, .64),
         (.965, .668), (.912, .678), (.888, .697), (.897, .724), (.906, .748), (.876, .768), (.896, .795), (.877, .826), (.856, .846), (.877, .886),
         (.878, .926), (.842, .976), (.77, .996), (.62, .952), (.5, .892), (.42, .82), (.3, .84), (.2, .78), (.07, .6), (0, .42), (.04, .25), (.13, .11), (.28, .03)]
F_OUT = [(.46, 0), (.65, .03), (.775, .11), (.84, .22), (.862, .31), (.868, .382), (.85, .43), (.862, .49), (.9, .562), (.934, .612), (.93, .64),
         (.89, .655), (.866, .672), (.874, .705), (.89, .732), (.866, .758), (.884, .79), (.862, .826), (.836, .846), (.85, .886), (.842, .934),
         (.79, .972), (.7, .97), (.58, .915), (.47, .84), (.33, .84), (.2, .78), (.07, .6), (0, .42), (.04, .25), (.13, .11), (.28, .03)]

MID = [(.62, -.02, 1), (1.1, -.02, 1), (1.1, 1.1, 1), (.74, 1.1, 1), (.7, .94), (.62, .84), (.6, .72), (.63, .6), (.66, .52), (.63, .42), (.6, .3), (.6, .15)]
SOCK = [(.7, .4), (.8, .392), (.884, .42), (.878, .49), (.81, .52), (.72, .525), (.665, .47)]
FORE = [(.66, .09, 1), (.8, .13), (.92, .3), (.92, .366, 1), (.79, .376), (.7, .372), (.655, .3)]
NOSE = [(.872, .43, 1), (.9, .47), (.94, .54), (1.02, .62), (1.02, .66, 1), (.93, .652), (.885, .59), (.852, .5)]
CHEEK = [(.67, .57, 1), (.78, .535, 1), (.862, .585, 1), (.8, .64, 1), (.72, .66, 1)]
ALA = [(.858, .612), (.9, .596), (.932, .632), (.918, .664), (.872, .668), (.85, .64)]
EAR = [(.44, .46), (.47, .42), (.53, .43), (.555, .5), (.535, .58), (.505, .64), (.47, .655), (.45, .6), (.44, .52)]
EAR_IN = [(.47, .47), (.505, .455), (.525, .5), (.505, .56), (.48, .6), (.47, .54)]

HAIR_M = [(.73, .12), (.64, .17), (.6, .27), (.55, .37), (.47, .4), (.41, .5), (.39, .66), (.31, .84), (.2, .87), (.1, .73), (-.03, .53), (-.05, .3), (.03, .13), (.16, .02),
          (.32, -.05), (.5, -.06), (.67, -.01), (.77, .07)]
BEARD = [(.5, .5), (.56, .6), (.62, .655), (.72, .68), (.82, .668), (.89, .692), (.915, .735), (.884, .76), (.905, .79), (.895, .83), (.9, .88), (.915, .94), (.895, 1.0, 1), (.86, .975),
         (.845, 1.07, 1), (.795, 1.01), (.755, 1.1, 1), (.7, 1.02), (.625, 1.07, 1), (.59, .985), (.5, .985, 1), (.47, .86), (.44, .72), (.45, .6)]


def _to(t, pts, closed=True, n=10):
    return place(curve(pts, closed=closed, n=n), **t)


def _sheet(st, m, color, z, kind="smooth", curl=0, edge=.12, shadow=1.0):
    return st.sheet(m, color, z, kind=kind, curl=curl, edge=edge, shadow=shadow)


def head(st, s, o, angle=0, flip=False, female=False, pal=None, eye="open", z=60, worry=False):
    """Draw a head. o is where the base of the skull sits in the frame. Returns the transform."""
    t = dict(s=s, a=angle, o=o, flip=flip, pivot=(.45, .85))
    out = F_OUT if female else M_OUT
    outline = raster(_to(t, out))
    _sheet(st, outline, pal["dark"], z, edge=.1)
    if not female:
        _sheet(st, raster(_to(t, EAR)), pal["mid"], z + 1, shadow=.8)
        _sheet(st, raster(_to(t, EAR_IN)), pal["dark"], z + 1.4, shadow=0, edge=.04)
    sock = raster(_to(t, SOCK)) * (0 if eye == "shut" else 1)
    mid = raster(_to(t, MID)) * outline * (1 - sock)
    _sheet(st, mid, pal["mid"], z + 3)
    _sheet(st, raster(_to(t, FORE)) * outline * (1 - sock), pal["light"], z + 6)
    _sheet(st, raster(_to(t, NOSE)) * outline, pal["light"], z + 6)
    _sheet(st, raster(_to(t, CHEEK)), pal.get("cheek", pal["light"]), z + 5, shadow=.4, edge=.06)
    nx = -.04 if female else 0
    _sheet(st, raster(_to(t, [(x + nx, y) for x, y in ALA])) * outline, pal["cheek"], z + 7, shadow=.4, edge=.05)
    st.sheet(raster(place(ribbon([(.884 + nx, .657), (.903 + nx, .65), (.92 + nx, .66)], [.003, .009, .003], cap=False), **t)) * outline, pal["dark"], z + 7.4, shadow=0, curl=0, edge=0, kind="smooth")
    # The eye is a lid over a slit, never a dot.
    if eye == "shut":
        plane = [(.69, .402), (.8, .392), (.88, .41), (.872, .44), (.8, .43), (.71, .45)]
        _sheet(st, raster(_to(t, plane)) * outline, pal["dark"], z + 4, shadow=.2, edge=.02)
        lid = [(.71, .452), (.78, .436), (.86, .44), (.87, .47), (.83, .495), (.77, .503), (.71, .487)]
        _sheet(st, raster(_to(t, lid)) * outline, pal["cheek"], z + 5, shadow=.45, edge=.05)
        st.sheet(raster(place(ribbon([(.725, .492), (.77, .508), (.82, .505), (.862, .484)], [.004, .017, .016, .004], cap=False), **t)), pal["line"], z + 6, shadow=0, curl=0, edge=0, kind="smooth")
    else:
        low = .012 if eye == "down" else 0
        wedge = [(.732, .474 + low, 1), (.785, .458 + low), (.838, .456 + low, 1), (.848, .476 + low), (.83, .5, 1), (.78, .5)]
        st.sheet(raster(_to(t, wedge)), pal["line"], z + 3.6, shadow=0, curl=0, edge=0, kind="smooth")
        st.sheet(raster(_to(t, [(.75, .478 + low, 1), (.785, .47 + low), (.8, .474 + low), (.8, .49), (.77, .49)])), pal["white"], z + 3.7, shadow=0, curl=0, edge=0, kind="smooth")
        lid = [(.71, .46, 1), (.77, .425), (.85, .424), (.874, .445), (.846, .46 + low), (.79, .464 + low), (.74, .476 + low)]
        _sheet(st, raster(_to(t, lid)) * outline, pal["mid"], z + 5, shadow=.8)
        st.sheet(raster(_to(t, [(.74, .5, 1), (.79, .512), (.836, .498, 1), (.79, .524)])), pal["mid"], z + 5, shadow=.3, curl=0, edge=.06, kind="smooth")
    brow = [(.72, .41), (.78, .39), (.84, .362), (.888, .352)] if worry else [(.715, .396), (.78, .366), (.84, .364), (.862, .376)] if female else [(.715, .396), (.78, .366), (.86, .364), (.892, .386)]
    w = [.006, .02, .017, .005] if female else [.01, .036, .03, .008]
    st.sheet(raster(place(ribbon(brow, w, cap=False), **t)), pal["hair"], z + 8, shadow=.5, curl=0, edge=.04, kind="smooth")
    return t


def lips(st, t, pal, z):
    _sheet(st, raster(_to(t, [(.79, .76, 1), (.83, .737), (.862, .733), (.888, .735), (.866, .757), (.82, .762)])), pal["lip"], z, shadow=.4)
    _sheet(st, raster(_to(t, [(.8, .762, 1), (.866, .761), (.884, .79), (.862, .814), (.822, .8)])), pal["lip2"], z + .6, shadow=.5)


def beard(st, t, pal, z):
    _sheet(st, raster(_to(t, BEARD)), pal["hair"], z, kind="matte", shadow=.9)
    r = np.random.default_rng(4)
    locks = []
    for _ in range(26):
        x, y = r.uniform(.5, .86), r.uniform(.66, .9)
        d = r.uniform(.1, .2)
        locks.append(place(ribbon([(x, y), (x + r.uniform(-.015, .02), y + d * .55), (x + r.uniform(-.03, .03), y + d)], [.016, .02, .002], cap=False), **t))
    _sheet(st, raster(*locks), pal["hair2"], z + 1.4, shadow=.4, edge=.05)


def hair_m(st, t, pal, z):
    base = _sheet(st, raster(_to(t, HAIR_M)), pal["hair"], z, kind="matte")
    r = np.random.default_rng(9)
    locks = []
    for i in range(24):
        a = r.uniform(.02, .95)
        x0 = .68 - a * .55 + r.uniform(-.03, .03)
        y0 = .03 + .1 * abs(a - .4) + r.uniform(-.03, .05)
        x1, y1 = x0 - r.uniform(.12, .26), y0 + r.uniform(.2, .42)
        locks.append(place(ribbon([(x0, y0), ((x0 + x1) / 2 + .03, (y0 + y1) / 2 - .05), (x1, y1)], [.012, .03, .002], cap=False), **t))
    _sheet(st, raster(*locks) * base, pal["hair2"], z + 1.6, shadow=.45, edge=.06)


def hair_f_top(st, t, pal, z):
    cap = [(.74, .13), (.64, .19), (.56, .3), (.5, .44), (.45, .62), (.42, .84), (.3, .92), (.1, .82), (-.04, .55), (-.05, .3), (.03, .13), (.16, .02), (.32, -.05), (.5, -.06), (.67, -.01), (.77, .07)]
    base = _sheet(st, raster(_to(t, cap)), pal["hair"], z, kind="matte", shadow=.4)
    r = np.random.default_rng(14)
    locks = []
    for i in range(22):
        a = r.uniform(0, 1)
        x0, y0 = .7 - a * .55, .05 + a * .03 + r.uniform(-.02, .04)
        x1, y1 = x0 - .18 - a * .1 + r.uniform(-.05, .05), y0 + r.uniform(.42, .8)
        locks.append(place(ribbon([(x0, y0), ((x0 + x1) / 2 + .06, (y0 + y1) / 2 - .08), (x1, y1)], [.012, .032, .003], cap=False), **t))
    _sheet(st, raster(*locks) * base, pal["hair2"], z + 1.6, shadow=.45, edge=.06)


def finger(st, pts, w, pal, z, tone="mid", shadow=.75, tip=.7, s=1, a=0, o=(0, 0), flip=False):
    """One finger. pts run from the knuckle to the tip. w is the width at the knuckle."""
    t = dict(s=s, a=a, o=o, flip=flip)
    m = raster(place(ribbon(pts, [w, w * .94, w * .84, w * tip], n=8), **t))
    st.sheet(m, pal[tone], z, kind="smooth", curl=0, edge=.12, shadow=shadow)
    p = np.array(pts, np.float64)
    for i in (1, 2):
        d = p[i + 1] - p[i - 1]
        d = d / (np.linalg.norm(d) + 1e-6)
        n = np.array([-d[1], d[0]])
        crease = [p[i] + n * w * .3, p[i], p[i] - n * w * .3]
        st.sheet(raster(place(ribbon(crease, [w * .02, w * .07, w * .02], cap=False), **t)), pal["dark"], z + .3, shadow=0, curl=0, edge=0, kind="smooth", opacity=.7)
    return m
