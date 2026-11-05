#!/usr/bin/env python3
"""Small, data-driven 3D scene builder for Fourth Watch rehearsal shots.

The storm renderer models one historical episode. This stage takes a JSON
scene description and can stage unrelated episodes with the *same* geometric
rig, cameras and animation code. It is still previs, not final art.

 python scripts/generic_3d_scene.py examples/generic-3d/naaman.json --out outputs/naaman.mp4
 python scripts/generic_3d_scene.py examples/generic-3d/psalm23.json --contact 0.5,3.5,7.5 --out outputs/psalm23.jpg
"""
from __future__ import annotations
import argparse, json, math, subprocess, sys, hashlib
from pathlib import Path
import numpy as np
import cv2
import vtk
from vtk.util.numpy_support import vtk_to_numpy
from vtk_story_renderer import Figure, Boat, sphere, cube, surface, make_poly, line_cylinder, position_cylinder, smooth, clamp, PALETTE


def check_scene(cfg):
    errors=[]
    if cfg.get('status')!='UNAPPROVED_LAYOUT':errors.append('preview must be unapproved')
    if not (2<=cfg.get('duration_s',0)<=60):errors.append('duration must be 2-60s')
    if not cfg.get('biblical_reference'):errors.append('biblical_reference required')
    cam=cfg.get('camera',[])
    if not cam or cam[0].get('at')!=0:errors.append('camera must begin at zero')
    if any(cam[i]['at']>=cam[i+1]['at'] for i in range(len(cam)-1)):errors.append('camera cuts not strictly ascending')
    ids=set()
    for a in cfg.get('actors',[]):
        if a.get('id') in ids:errors.append('duplicate actor '+str(a.get('id')))
        ids.add(a.get('id'))
        keys=a.get('keys',[])
        if not keys or keys[0]['at']!=0:errors.append('actor '+str(a.get('id'))+' requires zero key')
        if any(keys[i]['at']>=keys[i+1]['at'] for i in range(len(keys)-1)):errors.append('unsorted actor keys for '+str(a.get('id')))
        for k in keys:
            if k['at']>cfg.get('duration_s',0):errors.append('actor key beyond film')
    if not cfg.get('actors'):errors.append('at least one actor required')
    return errors


def interpolate(keys,t,field,default):
    """Ease numeric scalar or vector keyframes, hold unkeyed values."""
    if t<=keys[0]['at']:return keys[0].get(field,default)
    for i in range(len(keys)-1):
        a,b=keys[i],keys[i+1]
        if t<=b['at']:
            av=a.get(field,default);bv=b.get(field,av)
            if isinstance(av,(int,float)) and isinstance(bv,(int,float)):
                return float(av)+(float(bv)-float(av))*smooth((t-a['at'])/(b['at']-a['at']))
            if isinstance(av,list) and isinstance(bv,list):
                k=smooth((t-a['at'])/(b['at']-a['at']))
                return [float(x)+(float(y)-float(x))*k for x,y in zip(av,bv)]
            return av
    return keys[-1].get(field,default)


class GenericSheep:
    """Stylized quadruped rig, suitable for symbolic shepherding scenes."""
    def __init__(self,renderer):
        self.body=sphere(.65,(.78,.75,.62));self.head=sphere(.24,(.61,.55,.44))
        self.legs=[line_cylinder(.095,(.50,.44,.35)) for _ in range(4)]
        for part in [self.body,self.head,*self.legs]:renderer.AddActor(part)
        self.last_joint={}
    def state(self,pos=(0,0,0),mode='stand',sink=0,lean=0,reach=0,grip=None,walk=0,step_out=0):
        x,y,z=map(float,pos);y-=sink
        self.body.SetPosition(x,y+.62,z);self.body.SetScale(1.1,.7,.75)
        self.head.SetPosition(x,y+.83,z+.56)
        for i,(dx,dz) in enumerate([(-.32,-.38),(.32,-.38),(-.32,.32),(.32,.32)]):
            lift=.12*max(0,math.sin(walk*2+(i%2)*math.pi)) if mode=='walk' else 0
            position_cylinder(self.legs[i],(x+dx,y+.45,z+dz),(x+dx,y+.12+lift,z+dz))
        self.last_joint={'head':[x,y+.83,z+.56]}


class GenericScene:
    def __init__(self,cfg,width=360,height=640):
        problems=check_scene(cfg)
        if problems:raise ValueError('; '.join(problems))
        self.cfg=cfg;self.W=width;self.H=height
        self.window=vtk.vtkRenderWindow();self.window.SetOffScreenRendering(True);self.window.SetMultiSamples(0)
        self.window.SetSize(width,height)
        self.scene=vtk.vtkRenderer();self.window.AddRenderer(self.scene)
        self.scene.GradientBackgroundOn()
        bg=cfg.get('background',{})
        self.scene.SetBackground(*(bg.get('low',[.08,.14,.19])))
        self.scene.SetBackground2(*(bg.get('high',[.31,.35,.34])))
        light=vtk.vtkLight();light.SetPosition(-5,12,10);light.SetIntensity(1.0)
        light.SetColor(.99,.84,.68);light.SetFocalPoint(0,0,0);self.scene.AddLight(light)
        fill=vtk.vtkLight();fill.SetPosition(7,7,-4);fill.SetIntensity(.4)
        fill.SetColor(.61,.76,1.);fill.SetFocalPoint(0,0,0);self.scene.AddLight(fill)
        self.camera=vtk.vtkCamera();self.scene.SetActiveCamera(self.camera)
        self.objects={}
        self.ground=self._make_ground(cfg.get('environment','river'))
        self.scene.AddActor(self.ground)
        self.water=self._make_water() if cfg.get('environment')=='river' else None
        if self.water:self.scene.AddActor(self.water)
        self.actors={}
        for entry in cfg['actors']:
            self.actors[entry['id']]=(GenericSheep(self.scene) if entry.get('rig')=='sheep'
                                       else Figure(self.scene,entry.get('rig','crew')))
        self.props=[]
        for prop in cfg.get('props',[]):
            self.props.extend(self._prop(prop))
        self.export=vtk.vtkWindowToImageFilter();self.export.SetInput(self.window)
        self.export.SetInputBufferTypeToRGB();self.export.ReadFrontBufferOff()
    def _make_ground(self,env):
        pts=[];fac=[];N=40
        for j in range(N):
            z=-25+50*j/(N-1)
            for i in range(N):
                x=-25+50*i/(N-1)
                h=-.13+.06*math.sin(x*.25+z*.33)
                if env=='river' and abs(x)<3.7:h=-.17
                pts.append((x,h,z))
                if i and j:
                    v=(j-1)*N+i-1;fac.append((v,v+1,v+1+N,v+N))
        col=(.28,.27,.19) if env=='river' else (.20,.32,.22)
        return surface(make_poly(pts,fac),col,.98,.01)
    def _make_water(self):
        pts=[];fac=[];N=19;M=58
        for j in range(M):
            z=-24+48*j/(M-1)
            for i in range(N):
                # Natural bank outline; unlike a constant-width rectangle,
                # every cross-section bends and subtly varies in width.
                centre=.34*math.sin(z*.15)+.26*math.sin(z*.37)
                half=3.3+.45*math.cos(z*.20)+.19*math.sin(z*.62)
                x=centre+half*(-1+2*i/(N-1));pts.append((x,.015,z))
                if i and j:
                    v=(j-1)*N+i-1;fac.append((v,v+1,v+1+N,v+N))
        return surface(make_poly(pts,fac),(.065,.26,.31),.94,.45)
    def _prop(self,p):
        x,y,z=p['at'];typ=p.get('type','rock');scale=p.get('scale',1)
        out=[]
        if typ=='rock':
            a=sphere(1.0,(.39,.37,.32));a.SetPosition(x,y+scale*.13,z);a.SetScale(scale,scale*.42,scale*.66);out.append(a)
        elif typ=='bush':
            a=sphere(1,(.31,.41,.25));a.SetPosition(x,y+.3*scale,z);a.SetScale(.6*scale,.5*scale,.65*scale);out.append(a)
        elif typ=='tree':
            a=line_cylinder(.11,(.34,.21,.12));position_cylinder(a,(x,y,z),(x,y+2.4*scale,z));out.append(a)
            for dx in [-.7,0,.65]:
                b=sphere(1,(.27,.40,.22));b.SetPosition(x+dx*scale,y+2.6*scale,z+.15);b.SetScale(.9*scale,.5*scale,.7*scale);out.append(b)
        else:raise ValueError('unsupported prop type: '+str(typ))
        for a in out:self.scene.AddActor(a)
        return out
    def camera_state(self,t):
        cams=self.cfg['camera'];c=cams[0]
        for item in cams:
            if item['at']<=t:c=item
        # Continuous camera moves *within* a shot; hard cut at next key.
        local=t-c['at'];move=c.get('move','hold')
        pos=np.asarray(c['pos'],float);look=np.asarray(c['look'],float)
        if move=='push':pos=pos+(look-pos)*(.15*smooth(local/max(c.get('move_duration',2),.1)))
        if move=='pull':pos=pos+(pos-look)*(.22*smooth(local/max(c.get('move_duration',2),.1)))
        if move=='track':
            pos[0]+=c.get('travel',1.4)*smooth(local/max(c.get('move_duration',2),.1))
            look[0]+=c.get('travel',1.4)*smooth(local/max(c.get('move_duration',2),.1))
        self.camera.SetPosition(*pos);self.camera.SetFocalPoint(*look);self.camera.SetViewUp(0,1,0)
        self.camera.SetViewAngle(c.get('fov',46));self.camera.SetClippingRange(.1,150)
        return c
    def frame(self,t):
        self.camera_state(t)
        for a in self.cfg['actors']:
            fig=self.actors[a['id']];keys=a['keys']
            p=interpolate(keys,t,'pos',[0,.2,0]);sink=interpolate(keys,t,'sink',0)
            lean=interpolate(keys,t,'lean',0)
            k=next((item for item in reversed(keys) if item['at']<=t),keys[0])
            fig.state(pos=p,mode=k.get('pose','stand'),sink=sink,lean=lean,walk=t*2)
        if self.water:self.water.SetPosition(0,.025*math.sin(t*2.5),0)
        self.window.Render();self.export.Modified();self.export.Update()
        pix=vtk_to_numpy(self.export.GetOutput().GetPointData().GetScalars()).reshape(self.H,self.W,3)
        img=np.flipud(pix).copy()
        # Shot labels are editorial tags; no verse words invented in the demo.
        cv2.putText(img,'FOURTH WATCH  /  GENERIC 3D',(12,23),cv2.FONT_HERSHEY_SIMPLEX,.38,(228,204,164),1,cv2.LINE_AA)
        cv2.putText(img,'LAYOUT - NOT APPROVED',(12,self.H-19),cv2.FONT_HERSHEY_SIMPLEX,.43,(228,204,164),1,cv2.LINE_AA)
        return img


def export(cfg,output,fps=12,width=360,height=640,contact=None):
    scene=GenericScene(cfg,width,height);out=Path(output);out.parent.mkdir(parents=True,exist_ok=True)
    if contact:
        times=[float(x) for x in contact.split(',')];frames=[]
        for t in times:
            im=scene.frame(t)
            cv2.putText(im,f'{t:g}s',(12,49),cv2.FONT_HERSHEY_SIMPLEX,.48,(245,229,202),1,cv2.LINE_AA)
            frames.append(cv2.cvtColor(im,cv2.COLOR_RGB2BGR))
        grid=np.zeros((height, width*len(frames),3),np.uint8)
        for i,im in enumerate(frames):grid[:,i*width:(i+1)*width]=im
        cv2.imwrite(str(out),grid)
    else:
        cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24',
             '-s',f'{width}x{height}','-r',str(fps),'-i','-','-c:v','libx264',
             '-preset','veryfast','-crf','22','-pix_fmt','yuv420p',str(out)]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
        for i in range(round(cfg['duration_s']*fps)):
            proc.stdin.write(scene.frame(i/fps).tobytes())
        proc.stdin.close();err=proc.stderr.read().decode();rc=proc.wait()
        if rc:raise RuntimeError(err)
    return {'path':str(out),'bytes':out.stat().st_size,'status':'UNAPPROVED_LAYOUT',
            'biblical_reference':cfg['biblical_reference'],'file_sha256':hashlib.sha256(out.read_bytes()).hexdigest()}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('source');p.add_argument('--out',required=True);p.add_argument('--contact');p.add_argument('--fps',type=int,default=12)
    a=p.parse_args();cfg=json.loads(Path(a.source).read_text());print(json.dumps(export(cfg,a.out,a.fps,contact=a.contact)))
if __name__=='__main__':main()
