#!/usr/bin/env python3
"""Exact mapping between canonical Fourth Watch direction and Y-up renderers.

Canonical world coordinates: x=screen-right, y=deeper into scene,
z=height above ground.  Current VTK / Three scene: x=screen-right,
y=height, z=depth toward camera.  This convention keeps vertical
storyboarding independent from the selected rendering backend.
"""
from typing import Iterable

def canonical_to_yup(p: Iterable[float]):
    x,depth,height=map(float,p)
    return (x,height,-depth)

def yup_to_canonical(p: Iterable[float]):
    x,height,near=map(float,p)
    return (x,-near,height)

def canonical_up():return (0.,0.,1.)
def render_up():return (0.,1.,0.)
