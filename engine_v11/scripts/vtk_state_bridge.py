#!/usr/bin/env python3
"""v11 state-extraction adapter around the *unchanged* verified v10 renderer.

Copies no camera/action logic: it transforms the original Render.frame source
at one explicit hook, preserving its existing function locals and calculations.
This migration hook is provisional until the source exposes a stable evaluator API.
"""
from __future__ import annotations
import inspect, textwrap
import vtk_story_renderer as base

_BASE = textwrap.dedent(inspect.getsource(base.Render.frame))
_BEGIN = 'def frame(self,f,overrides=None,labels=True):'
_HOOK = '    self.window.Render();self._export.Modified();self._export.Update()'
if _BASE.count(_BEGIN)!=1 or _BASE.count(_HOOK)!=1:
    raise RuntimeError('VTK source changed; cannot safely export scene state')
_PATCH = r'''
# v11 native bridge exports the SAME evaluated pose/camera state without a
# second renderer implementation.  No hidden extra render for export.
if not draw:
    def position(a): return [round(float(z), 6) for z in a.GetPosition()]
    def orientation(a): return [round(float(z), 6) for z in a.GetOrientation()]
    figures = {}
    for name, fig in [('Jesus', self.Jesus), ('Peter', self.Peter),
                      *[(f'crew_{i}', g) for i,g in enumerate(self.crew)]]:
        figures[name] = {
            'visible': bool(fig.body.GetVisibility()),
            'body': position(fig.body),
            'body_orientation': orientation(fig.body),
            'head': position(fig.head),
            'hair': position(fig.hair),
            'joints': fig.last_joint if fig.body.GetVisibility() else None,
        }
    def prop(a):
        return {'visible': bool(a.GetVisibility()), 'position': position(a),
                'scale': [round(float(v), 6) for v in a.GetScale()]}
    snap = {
        'frame': int(f), 'shot': sid,
        'camera': {'position': position(self.camera),
                   'look': [round(float(v), 6) for v in self.camera.GetFocalPoint()],
                   'fov': round(float(self.camera.GetViewAngle()), 6)},
        'boat': {'visible': bool(self.boat.parts.GetVisibility()),
                 'position': position(self.boat.parts),
                 'orientation': orientation(self.boat.parts),
                 'oars': [prop(z) | {'orientation': orientation(z)} for z in self.boat.oars]},
        'figures': figures,
        'shore': bool(self.shore.GetVisibility()),
        'moon': bool(self.moon.GetVisibility()),
        'ripple': prop(self.ripple),
        'loaves': [prop(a) for a in self.loaves],
        'sea_calm': round(1-.83*smooth((f-self.beat('S10','water settles',f)-water_calmbump)/40),6),
    }
    return None, {'sid': sid, 'frame': int(f), 'snapshot': snap,
                  'joints': {'Jesus': self.Jesus.last_joint, 'Peter': self.Peter.last_joint}}
'''
# No rendering or overlay logic is altered in the original source module.
_DERIVED = _BASE.replace(_BEGIN,'def frame(self,f,overrides=None,labels=True,draw=True):').replace(
    _HOOK, textwrap.indent(_PATCH.rstrip('\n'), '    ') + '\n' + _HOOK)
_ns = dict(vars(base))
exec(compile(_DERIVED, '<v11-state-bridge-verified-v10-frame>', 'exec'),_ns)

class StateExportRender(base.Render):
    frame = _ns['frame']
