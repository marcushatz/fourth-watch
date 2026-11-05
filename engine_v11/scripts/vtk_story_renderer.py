#!/usr/bin/env python3
"""Fourth Watch: deterministic, source-traceable 3D layout / acting renderer.

A practical no-credit experimental renderer for the review stages. NOT final animation.
The input is the native 30-fps shotplan. Every character change is derived from
its named beat, not a hardcoded unrelated frame, and any changed beat re-times
its corresponding action. Rendering uses actual perspective camera / geometry.

Usage:
 python scripts/vtk_story_renderer.py examples/pilot-storm/shotplan.yaml --out outputs/v8/storm_3d.mp4 --fps 12
 python scripts/vtk_story_renderer.py examples/pilot-storm/shotplan.yaml --stills 6,12,23,31,35,39 --out outputs/v8/contact.jpg
"""
from __future__ import annotations
import argparse, json, math, os, subprocess, sys, hashlib
from pathlib import Path
from dataclasses import dataclass
import numpy as np
import cv2
import yaml
import vtk
from vtk.util.numpy_support import vtk_to_numpy

PALETTE = {
    'night': (0.045, 0.077, 0.14), 'night2': (0.115, 0.17, 0.25),
    'sea': (0.06, 0.24, 0.32), 'wave': (0.31, 0.47, 0.54),
    'skin': (0.76, 0.62, 0.48), 'robe': (0.77, 0.73, 0.65),
    'peter': (0.55, 0.41, 0.31), 'olive': (0.29, 0.36, 0.27),
    'gold': (0.87, 0.67, 0.36), 'wood': (0.36, 0.21, 0.13),
    'wood2': (0.52, 0.33, 0.18), 'shore': (0.28, 0.30, 0.25),
}

def clamp(x, lo=0., hi=1.): return max(lo,min(hi,x))
def smooth(t):
    q=clamp(t); return q*q*(3-2*q)
def mix(a,b,t): return a+(b-a)*smooth(t)
def vec(a):return np.asarray(a,dtype=float)
def unit(a):
    n=np.linalg.norm(a);return a/max(n,1.e-10)

def surface(s,color,opacity=1., specular=.12):
    m=vtk.vtkPolyDataMapper()
    if hasattr(s,'GetOutputPort'):m.SetInputConnection(s.GetOutputPort())
    else:m.SetInputData(s)
    a=vtk.vtkActor();a.SetMapper(m);p=a.GetProperty();p.SetColor(*color);p.SetOpacity(opacity)
    p.SetInterpolationToPhong();p.SetAmbient(.26);p.SetDiffuse(.65);p.SetSpecular(specular)
    p.SetSpecularPower(14)
    return a

def sphere(radius,color,theta=12,phi=8):
    s=vtk.vtkSphereSource();s.SetRadius(radius);s.SetThetaResolution(theta);s.SetPhiResolution(phi)
    return surface(s,color)

def cone(radius,height,color,res=12):
    s=vtk.vtkConeSource();s.SetRadius(radius);s.SetHeight(height);s.SetResolution(res);s.SetDirection(0,1,0)
    return surface(s,color)

def cube(size,color):
    s=vtk.vtkCubeSource();s.SetXLength(size[0]);s.SetYLength(size[1]);s.SetZLength(size[2]);return surface(s,color)

def line_cylinder(radius,color):
    s=vtk.vtkCylinderSource();s.SetRadius(radius);s.SetHeight(1);s.SetResolution(8);s.SetCapping(True)
    return surface(s,color)

def position_cylinder(actor,a,b,radius=1.):
    a,b=vec(a),vec(b);d=b-a;length=np.linalg.norm(d)
    actor.SetPosition(*(a+b)/2)
    v=unit(d);up=np.array([0.,1.,0.]);cross=np.cross(up,v)
    dprod=clamp(float(np.dot(up,v)),-1,1)
    if np.linalg.norm(cross)<1.e-8:
        actor.SetOrientation(0,0,0) if dprod>0 else actor.SetOrientation(180,0,0)
    else:
        transform=vtk.vtkTransform();transform.RotateWXYZ(math.degrees(math.acos(dprod)),*unit(cross))
        actor.SetOrientation(*transform.GetOrientation())
    actor.SetScale(radius,length, radius)

def make_poly(points,faces):
    vpts=vtk.vtkPoints()
    for p in points:vpts.InsertNextPoint(*p)
    cells=vtk.vtkCellArray()
    for face in faces:
        poly=vtk.vtkPolygon();poly.GetPointIds().SetNumberOfIds(len(face))
        for j,k in enumerate(face):poly.GetPointIds().SetId(j,k)
        cells.InsertNextCell(poly)
    mesh=vtk.vtkPolyData();mesh.SetPoints(vpts);mesh.SetPolys(cells)
    normals=vtk.vtkPolyDataNormals();normals.SetInputData(mesh);normals.ConsistencyOn();normals.AutoOrientNormalsOn();normals.SplittingOff();normals.Update()
    return normals.GetOutput()

class Figure:
    """Simple variable-pose rig; continuous action defined by world-space joint targets."""
    def __init__(self,scene,kind='peter'):
        self.kind=kind
        coat=PALETTE['robe'] if kind=='jesus' else PALETTE['peter'] if kind=='peter' else PALETTE['olive']
        self.body=cone(.34,1.06,coat);self.head=sphere(.22,PALETTE['skin']);self.hair=sphere(.232,(.20,.17,.13))
        self.arm=[line_cylinder(.095,coat),line_cylinder(.09,coat)]
        self.forearm=[line_cylinder(.09,PALETTE['skin']),line_cylinder(.085,PALETTE['skin'])]
        self.hands=[sphere(.11,PALETTE['skin']),sphere(.11,PALETTE['skin'])]
        self.legs=[line_cylinder(.105,coat),line_cylinder(.105,coat)]
        self.shoes=[sphere(.15,coat),sphere(.15,coat)]
        for a in [self.body,self.head,self.hair,*self.arm,*self.forearm,*self.hands,*self.legs,*self.shoes]:scene.AddActor(a)
        self.last_joint={}
    def state(self,pos=(0,0,0),mode='stand',sink=0,lean=0,reach=0,grip=None,walk=0,step_out=0):
        x,y,z=map(float,pos);y-=sink
        sh=np.array([x,y+1.62,z],dtype=float)
        self.body.SetPosition(x+lean*.10,y+1.18,z)
        self.body.SetOrientation(0,0,-lean*12)
        self.head.SetPosition(x+lean*.12,y+1.88,z)
        self.hair.SetPosition(x+lean*.11,y+1.98,z-.025)
        hip=np.array([x,y+.82,z]);
        l_sh=sh+[-.24,-.06,0];r_sh=sh+[.24,-.06,0]
        if mode=='rowing':
            l_hand=sh+[-.72,-.52,math.sin(walk*4)*.28];r_hand=sh+[.72,-.52,-math.sin(walk*4)*.28]
        elif mode=='recoil':
            l_hand=sh+[-.65,.22,.12];r_hand=sh+[.63,.3,.10]
        elif mode in ('help','sink'):
            l_hand=sh+[-.30,.48,.05];r_hand=sh+[.47,.45,.08]
        elif mode=='reach':
            l_hand=sh+[-.55,-.24,.04];r_hand=sh+[.42+reach*.32,-.05,.09]
        elif mode=='grip':
            assert grip is not None
            r_hand=np.array(grip,dtype=float);l_hand=sh+[-.52,.03,.05]
        elif mode=='walk':
            l_hand=sh+[-.33,-.45,.20*math.sin(walk)];r_hand=sh+[.33,-.35,-.20*math.sin(walk)]
        elif mode=='step':
            # Balancing pose with an independent forward foot. Body translation alone
            # concealed the critical step inside the boat in the v8 contact sheet.
            l_hand=sh+[-.63,-.14,-.12];r_hand=sh+[.67,-.05,.18]
        else:
            l_hand=sh+[-.41,-.53,0];r_hand=sh+[.40,-.53,0]
        if grip is not None and mode!='grip':r_hand=np.array(grip,dtype=float)
        for idx,(shoulder,hand) in enumerate([(l_sh,l_hand),(r_sh,r_hand)]):
            elbow=(shoulder+hand)*.5+np.array([-.10 if idx==0 else .10,-.10,-.03])
            position_cylinder(self.arm[idx],shoulder,elbow)
            position_cylinder(self.forearm[idx],elbow,hand)
            self.hands[idx].SetPosition(*hand)
        for idx,dx in enumerate([-.18,.18]):
            hipj=hip+[dx,0,0]; foot=np.array([x+dx,y+.08,z+(.25*math.sin(walk+(idx*math.pi)) if mode=='walk' else 0)])
            if mode=='step' and idx==1:
                # Right foot first clears the gunwale, lifts, then reaches water.
                foot[2]+=.32*step_out
                foot[1]+=.30*math.sin(math.pi*clamp(step_out))
                foot[0]-=.20*step_out
            elif mode=='step' and idx==0:
                foot[2]-=.45*step_out   # left foot stays aboard until the transfer
            position_cylinder(self.legs[idx],hipj,foot)
            self.shoes[idx].SetPosition(*foot)
            self.shoes[idx].SetScale(1.25,.55,1.3)
            if idx==0: left_foot=foot.copy()
            else: right_foot=foot.copy()
        self.last_joint={'right_hand':r_hand.tolist(),'left_hand':l_hand.tolist(),
                         'right_shoulder':r_sh.tolist(),'left_shoulder':l_sh.tolist(),'head':[x,y+1.88,z],
                         'right_foot':right_foot.tolist(),'left_foot':left_foot.tolist()}
        for a in [self.body,self.head,self.hair,*self.arm,*self.forearm,*self.hands,*self.legs,*self.shoes]:a.SetVisibility(1)
    def hide(self):
        for a in [self.body,self.head,self.hair,*self.arm,*self.forearm,*self.hands,*self.legs,*self.shoes]:a.SetVisibility(0)

class Boat:
    def __init__(self,scene):
        # Sculpted stylized bowl; 8 stations, five stacked rings. Bow and stern taper.
        self.parts=vtk.vtkAssembly();scene.AddActor(self.parts)
        points=[];faces=[];n=12
        for ring,y,wid in [(0,-.37,.54),(1,-.13,.79),(2,.10,.94)]:
            for j in range(n):
                u=j/(n-1);x=5.4*(u-.5);taper=.35+.65*math.sin(math.pi*u)**.6
                z=((-1 if ring%2==0 else 1)*0) # unused; ring coordinate as edge pair rendered below
        # hull outer surface with four x coordinates * two sides * two levels
        X=np.linspace(-2.65,2.65,13)
        for y,w in [(-.35,.42),(-.12,.73),(.19,1.0)]:
            for side in [-1,1]:
                for x in X:
                    taper=.34+.66*math.sin(math.pi*(x+2.65)/5.3)**.8
                    points.append((float(x),y,float(side*w*taper)))
        nr=len(X)
        for level in range(2):
            for side in range(2):
                st=level*2*nr+side*nr
                top=(level+1)*2*nr+side*nr
                for j in range(nr-1):faces.append((st+j,st+j+1,top+j+1,top+j))
        # bow/stern cross faces
        for j in [0,nr-1]:
            faces.append((2*nr+j,3*nr+j,5*nr+j,4*nr+j))
        hull=surface(make_poly(points,faces),PALETTE['wood'],specular=.22);self.parts.AddPart(hull)
        self.trim=[]
        for side in [-1,1]:
            for j in range(12):
                u=j/12;x=-2.65+5.3*u;nx=-2.65+5.3*((j+1)/12)
                taper=lambda v:.34+.66*math.sin(math.pi*v)**.8
                a=(x,.2,side*taper(u));b=(nx,.2,side*taper((j+1)/12))
                c=line_cylinder(.046,PALETTE['wood2']);position_cylinder(c,a,b);self.parts.AddPart(c);self.trim.append(c)
        for x in [-1.4,.4,1.8]:
            s=cube((.16,.07,1.7),PALETTE['wood2']);s.SetPosition(x,-.01,0);self.parts.AddPart(s)
        self.oars=[line_cylinder(.058,PALETTE['wood2']),line_cylinder(.058,PALETTE['wood2'])]
        for a in self.oars:scene.AddActor(a)
    def state(self,x=4.4,y=.2,z=-1.8,t=0,rowing=False,visible=True,yaw=0,stroke=1):
        self.parts.SetVisibility(visible)
        if not visible:
            for o in self.oars:o.SetVisibility(0)
            return
        self.parts.SetPosition(x,y+.055*math.sin(t*2.4),z)
        self.parts.SetOrientation(0,yaw,1.8*math.sin(t*1.8))
        for i,side in enumerate([-1,1]):
            phase=(t*2.8)+(i*math.pi)
            start=(x+(-.6 if i==0 else .65),y+.05,z+side*.65)
            end=(start[0]-.35*stroke*math.sin(phase),y-.24+.17*stroke*math.cos(phase),z+side*(1.5+.75*stroke))
            position_cylinder(self.oars[i],start,end)
            self.oars[i].SetVisibility(1 if rowing else 0)

class Render:
    def __init__(self,plan,width=360,height=640):
        self.plan=plan;self.W=width;self.H=height;self.shots=plan['shots'];self.beats={s['id']:{b['label']:b['at_frame'] for b in s['beats']} for s in self.shots}
        self.window=vtk.vtkRenderWindow();self.window.SetOffScreenRendering(1);self.window.SetSize(width,height);self.window.SetMultiSamples(0)
        self.render=vtk.vtkRenderer();self.window.AddRenderer(self.render)
        self.render.GradientBackgroundOn();self.render.SetBackground(*PALETTE['night']);self.render.SetBackground2(*PALETTE['night2'])
        self.camera=vtk.vtkCamera();self.render.SetActiveCamera(self.camera);self.camera.SetViewAngle(46)
        hemi=vtk.vtkLight();hemi.SetLightTypeToSceneLight();hemi.SetPosition(-9,17,12);hemi.SetFocalPoint(0,0,0);hemi.SetIntensity(.85);hemi.SetColor(.71,.79,1);self.render.AddLight(hemi)
        amber=vtk.vtkLight();amber.SetLightTypeToSceneLight();amber.SetPosition(6,8,-3);amber.SetFocalPoint(1,0,-2);amber.SetIntensity(.38);amber.SetColor(1,.75,.50);self.render.AddLight(amber)
        self.sea=self._make_sea();self.render.AddActor(self.sea);self._sea_points=self.sea.GetMapper().GetInput().GetPoints();self._sea_base=vtk_to_numpy(self._sea_points.GetData()).copy()
        self._sea_input=self.sea.GetMapper().GetInput()
        self._sea_rgb=np.zeros((len(self._sea_base),3),dtype=np.uint8)
        self.shore=self._make_shore();self.render.AddActor(self.shore)
        self.moon=sphere(1.0,(.66,.68,.69),18,14);self.moon.SetPosition(-17,13,-35);self.moon.GetProperty().SetAmbient(1);self.render.AddActor(self.moon)
        self.boat=Boat(self.render)
        # World-space ripple: activated only by the foot-contact beat.
        circle=vtk.vtkRegularPolygonSource();circle.SetNumberOfSides(44)
        circle.SetRadius(1.0);circle.GeneratePolygonOff()
        self.ripple=surface(circle,(.57,.70,.69),opacity=.72,specular=.02)
        self.ripple.GetProperty().SetLineWidth(3)
        self.ripple.SetOrientation(90,0,0);self.render.AddActor(self.ripple)
        self.Jesus=Figure(self.render,'jesus');self.Peter=Figure(self.render,'peter')
        self.crew=[Figure(self.render,'crew') for _ in range(3)]
        self.loaves=[sphere(.28,(.67,.49,.26)) for _ in range(5)]
        for i,a in enumerate(self.loaves):self.render.AddActor(a)
        self._export=vtk.vtkWindowToImageFilter();self._export.SetInput(self.window);self._export.SetInputBufferTypeToRGB();self._export.ReadFrontBufferOff()
        self.recorder=[]
    def _make_sea(self):
        N=81; M=60;points=[];faces=[]
        for j in range(M):
            z=-130+260*j/(M-1)
            for i in range(N):
                x=-130+260*i/(N-1)
                points.append([x, -.02,z]);
                if i and j:
                    a=(j-1)*N+i-1;faces.extend([(a,a+1,a+1+N,a+N)])
        mesh=make_poly(points,faces)
        a=surface(mesh,PALETTE['sea'],specular=.75)
        a.GetProperty().SetSpecularPower(48);return a
    def _make_shore(self):
        """Low, continuous coastal terrain, tessellated into nondegenerate triangles.

        Earlier source made folded 4-point polygons on a wavy grid: VTK
        triangulated those inconsistently and the establishing image showed
        broad jagged slabs instead of a coast.  This normalized shoreline
        ends at a continuous sinuous water boundary with no rectangular edge
        in the visible composition.
        """
        columns, rows = 34, 121
        points, faces = [], []
        for j in range(rows):
            z = -72.0 + 144.0*j/(rows-1)
            coast = -14.8 + 2.2*math.sin(z*.11) + .8*math.sin(z*.41)
            for i in range(columns):
                u = i/(columns-1)
                x = -54.0 + (coast+54.0)*u
                # Land falls gently into water, with subdued low-frequency hills.
                h = .44 + .90*(1-u)**2 + .11*(1-u)*math.sin(z*.12+x*.19)
                points.append((float(x),float(h),float(z)))
                if i and j:
                    k = (j-1)*columns+i-1
                    faces.append((k,k+1,k+columns))
                    faces.append((k+1,k+columns+1,k+columns))
        actor=surface(make_poly(points,faces),PALETTE['shore'],specular=.01)
        actor.GetProperty().SetAmbient(.35)
        return actor
    def beat(self,shot,label,frame):
        return self.beats[shot][label]
    def event(self,shot,label,frame,attack=0,release=16):
        b=self.beat(shot,label,frame)
        if attack and frame<b:return 0
        return smooth((frame-b)/max(release,1))
    def sea_state(self,frame,calm_shift=0):
        # Wind calms only after S10 water-settles beat, not at rescue.
        calm_b=self.beat('S10','water settles',frame)+calm_shift
        amount=1-.83*smooth((frame-calm_b)/40)
        t=frame/30
        a=self._sea_base.copy();x=a[:,0];z=a[:,2]
        # two crossing wave families + deterministic spatial wind riffle
        a[:,1]=(-.02 + amount*(.19*np.sin(z*.72+t*1.4+x*.06)+.105*np.sin(x*.62-z*.21+t*1.95)+.045*np.sin(x*1.85+z*.8-t*2.7)))
        from vtk.util.numpy_support import numpy_to_vtk
        v=numpy_to_vtk(a,deep=True);v.SetNumberOfComponents(3);self._sea_points.SetData(v);self._sea_points.Modified()
        # Shade rising wave crests with procedural highlights tied to geometry.
        whiten=np.clip((a[:,1]-.06)/.27,0,1)**2
        distance=np.clip((a[:,2]+130)/260,0,1)
        self._sea_rgb[:,0]=np.clip(13+48*whiten,0,255).astype(np.uint8)
        self._sea_rgb[:,1]=np.clip(55+69*whiten,0,255).astype(np.uint8)
        self._sea_rgb[:,2]=np.clip(72+83*whiten,0,255).astype(np.uint8)
        cvtk=numpy_to_vtk(self._sea_rgb,deep=True,array_type=vtk.VTK_UNSIGNED_CHAR);cvtk.SetNumberOfComponents(3);cvtk.SetName('color')
        self._sea_input.GetPointData().SetScalars(cvtk)
        self.sea.GetMapper().SetScalarModeToUsePointData();self.sea.GetMapper().ScalarVisibilityOn()
        self._sea_input.Modified()
    def set_camera(self,sid,u):
        # Camera shot grammar: each is a deliberate position, not a generic zoom.
        setups={
            'S01':((11,4.2,8),(3,.7,-2)), 'S02':((-7,15,52),(-7,1,-4)),
            'S03':((4,9,11),(0,.3,-3)), 'S04':((-4.4,2.8,7),(-6.4,1,-6.2)),
            'S05':((7,3.7,6),(3,1,-1.5)), 'S06':((-4.3,2.4,3),(-3.7,1,-3.5)),
            'S07':((3.5,2.15,3.3),(2.3,.74,-1.1)), 'S08':((1.0,2.6,3.0),(-1,1,-2.8)),
            'S09':((-.15,2.8,6.4),(-2.05,1.10,-2.9)), 'S10':((5.0,5.1,17),(1.5,1,-2)),
            'S11':((5,3.2,5),(0,.5,-4)), 'S12':((6,5.8,11),(2,.75,-2)),
        }
        pos,look=setups[sid];p=np.array(pos,dtype=float);l=np.array(look,dtype=float)
        shot=next(z for z in self.shots if z['id']==sid);c=shot['camera']
        if sid=='S11':
            # Mark's loaves clause comes forward as a specific object of
            # attention, not a static row of props under an abstract label.
            f=shot['start_frame']+u*(shot['end_frame']-shot['start_frame'])
            moment=self.beat('S11','loaves phrase becomes central',f)
            k=smooth((f-moment)/56)
            p=np.array([4.4-3.5*k,3.5-1.0*k,6.5-3.0*k]);l=np.array([0,.75,-4])
        elif sid=='S12':
            # Return to the whole boat and sea, creating a visible spatial
            # relationship with the prior loaves image without asserting an
            # unsupported answer to what Mark 6:52 means.
            f=shot['start_frame']+u*(shot['end_frame']-shot['start_frame'])
            moment=self.beat('S12','boat image',f)
            k=smooth((f-moment)/145)
            p=np.array([6.0,4.0+2.7*k,9.0+11*k]);l=np.array([1.75,.75,-1.8])
        elif sid=='S10':
            # A deliberate editorial cut at the *boat entry* beat prevents a
            # misleading on-camera 5-metre teleport from water to inside boat.
            f=shot['start_frame']+u*(shot['end_frame']-shot['start_frame'])
            entry=self.beat('S10','boat entry',f)
            if f<entry:
                p=np.array([3.5,3.3,10.2]);l=np.array([1.6,.95,-1.6])
            else:
                k=smooth((f-entry)/90)
                p=np.array([5.2,3.9,10.4+5*k]);l=np.array([3.2,.90,-1.7])
        move=c['move'];s=mix(c['start_scale'],c['end_scale'],u)
        if move in ('push','pull') and sid not in ('S10','S11','S12'):
            p=l+(p-l)/max(s,.4)
        if move=='track':
            if sid=='S07':
                # Move with the actor toward the *near* gunwale, not away from him.
                p[0]-=1.05*smooth(u);l[0]-=.60*smooth(u)
                p[2]+=.20*smooth(u);l[2]+=.40*smooth(u)
            else:
                p[0]=p[0]-1.0+2*smooth(u);l[0]+=(-.8+1.6*smooth(u))
        self.camera.SetPosition(*p);self.camera.SetFocalPoint(*l);self.camera.SetViewUp(0,1,0)
        self.camera.SetViewAngle(60 if sid=='S02' else 42 if sid=='S04' else 50 if sid in ('S07','S09') else 55 if sid=='S10'
                                 else 46 if sid in ('S01','S10','S12') else 42)
        self.camera.SetClippingRange(.1,150)
    def frame(self,f,overrides=None,labels=True):
        ov=overrides or {}
        shot=next((x for x in self.shots if x['start_frame']<=f<x['end_frame']),self.shots[-1])
        sid=shot['id'];u=(f-shot['start_frame'])/max(shot['end_frame']-shot['start_frame'],1)
        self.set_camera(sid,u)
        for fig in [self.Jesus,self.Peter,*self.crew]:fig.hide()
        self.ripple.SetVisibility(0)
        for loaf in self.loaves:loaf.SetVisibility(0)
        visible_boat=sid in ('S01','S02','S04','S05','S06','S07','S10','S12')
        # Establishing images can keep a motif, but close-ups must not inherit
        # unrelated visible objects from the preceding shot.
        if sid=='S04':boat_x=-1.8
        elif sid=='S02':boat_x=3.9
        else:boat_x=3.2
        stroke=1.0 if sid!='S01' else .45+.55*self.event('S01','oars pull against water',f,release=17)
        yaw=0 if sid!='S04' else 12*self.event('S04','boat turns toward figure',f,release=22)
        self.boat.state(x=boat_x,t=f/30,rowing=sid in ('S01','S02'),visible=visible_boat,
                        yaw=yaw,stroke=stroke)
        self.shore.SetVisibility(1 if sid in ('S02','S03') else 0)
        self.moon.SetVisibility(1 if sid in ('S01','S02','S12') else 0)
        water_calmbump=ov.get('water settles',0)
        self.sea_state(f,water_calmbump)
        if sid in ('S01','S05','S10','S12','S02'):
            boat_entered=(sid=='S10' and f>=self.beat('S10','boat entry',f))
            for i,fig in enumerate(self.crew):
                x=[1.2,4.8,5.35][i] if boat_entered else (2.0+i*1.0)
                pos=(x,.25,-1.7+(.30 if i%2 else -.30))
                pose='rowing' if sid in ('S01','S02') else 'recoil' if sid=='S05' and f>=self.beat(sid,'group recoils',f)+ov.get('group recoils',0) else 'stand'
                fig.state(pos,pose,walk=f/30+i)
        if sid=='S02':
            self.Jesus.state((-18,.52,-1),mode='stand')
        elif sid=='S04':
            b=self.beat('S04','distant silhouette',f)+ov.get('distant silhouette',0)
            t=smooth((f-b)/82)
            self.Jesus.state((-9+t*3.8,.15,-7+t*1.7),mode='walk',walk=f/10)
        elif sid=='S06':
            b=self.beat('S06','figure in clear view',f)+ov.get('figure in clear view',0)
            t=smooth((f-b)/32)
            self.Jesus.state((-3.7,.12,-3.5),mode='reach',reach=.4*t)
        elif sid=='S07':
            b1=self.beat('S07','foot clears gunwale',f)+ov.get('foot clears gunwale',0)
            b2=self.beat('S07','foot contacts water',f)+ov.get('foot contacts water',0)
            foot_clear=smooth((f-b1)/18);foot_contact=smooth((f-b2)/18)
            # Boat occupies z=-1.8; near-side gunwale is z~-0.9.
            # Previous path sent Peter the wrong way, *into* the boat.
            self.Peter.state((2.45-.45*foot_clear,.39-.26*foot_contact,-1.5+.56*foot_clear),
                             mode='step',step_out=foot_clear)
            if f>=b2:
                pulse=smooth((f-b2)/25)
                foot=self.Peter.last_joint['right_foot']
                self.ripple.SetPosition(foot[0],.07,foot[2]);self.ripple.SetScale(.10+.74*pulse,.10+.74*pulse,1)
                self.ripple.GetProperty().SetOpacity(.74*(1-pulse))
                self.ripple.SetVisibility(1)
            self.Jesus.state((-3.7,.12,-3.5))
        elif sid=='S08':
            b1=self.beat('S08','Peter falters',f)+ov.get('Peter falters',0)
            b2=self.beat('S08','arms reach upward',f)+ov.get('arms reach upward',0)
            t=smooth((f-b1)/35)
            self.Peter.state((-1,.12,-2.8),mode='sink' if f>=b2 else 'stand',sink=.95*t,lean=.8*t)
            self.Jesus.state((-3.7,.12,-3.5))
        elif sid=='S09':
            b1=self.beat('S09','hand extends',f)+ov.get('hand extends',0)
            b2=self.beat('S09','hands meet',f)+ov.get('hands meet',0)
            reaching=smooth((f-b1)/max(b2-b1,1))
            lifted=smooth((f-b2)/35)
            # Contact: both right hands share the exact point from b2 onward.
            # Human-scale contact: the shared handhold rises with Peter's body.
            # The previous fixed grip point stretched the arm beyond a plausible
            # reach as the actor lifted, despite pixel-perfect contact.
            contact=np.array([-2.05,1.20+.20*lifted,-2.78])
            jc=np.array([-2.70,1.20,-2.85]);pc=np.array([-1.55,.88,-2.8])
            # Before b2 their respective hands approach; on and after b2 they
            # share one moving target with neither participant pinned in space.
            hand_j=mix(jc,contact,reaching); hand_p=mix(pc,contact,reaching)
            self.Jesus.state((-3.0,.12,-2.85),mode='grip',grip=hand_j)
            self.Peter.state((-1.65,.2,-2.80),mode='grip',grip=hand_p,
                             sink=.60*(1-lifted),lean=.55*(1-lifted))
        elif sid=='S10':
            b=self.beat('S10','boat entry',f)+ov.get('boat entry',0)
            if f<b:
                self.Jesus.state((.15,.12,-.7),mode='walk',walk=f/10)
                self.Peter.state((1.0,.12,-.7),mode='walk',walk=f/10)
            else:
                self.Jesus.state((2.55,.38,-1.2),mode='stand')
                self.Peter.state((3.55,.38,-1.7),mode='stand')
        elif sid=='S11':
            b=self.beat('S11','loaves phrase becomes central',f)+ov.get('loaves phrase becomes central',0)
            k=smooth((f-b)/28)
            for i,a in enumerate(self.loaves):
                a.SetPosition(-1.8+i*.9,.30+(.45*k if i==2 else 0),-4)
                a.SetScale(1.55+.35*k if i==2 else 1.55,.5,.8)
                a.SetVisibility(1)
        elif sid=='S12':
            b=self.beat('S12','bread motif',f)+ov.get('bread motif',0)
            k=smooth((f-b)/26)
            for i,a in enumerate(self.loaves):
                a.SetPosition(-1+i*.53,1.4,1.4)
                a.SetScale(1.08,.35,.6)
                a.SetVisibility(1 if k>.03 else 0)
        self.window.Render();self._export.Modified();self._export.Update()
        img=vtk_to_numpy(self._export.GetOutput().GetPointData().GetScalars())
        out=img.reshape((self.H,self.W,3));out=np.ascontiguousarray(np.flipud(out))
        # Text / diagrams strictly evidence overlays, not a voice substitute.
        if sid=='S03':
            top=np.zeros((self.H,self.W,3),dtype=np.uint8)
            cv2.putText(top,'FOURTH WATCH',(42,160),cv2.FONT_HERSHEY_SIMPLEX,0.8,(214,189,139),2,cv2.LINE_AA)
            cv2.putText(top,'3 AM - 6 AM',(34,220),cv2.FONT_HERSHEY_SIMPLEX,1,(240,232,209),2,cv2.LINE_AA)
            cv2.line(top,(50,260),(305,260),(180,172,116),2)
            v=smooth((f-self.beat('S03','fourth watch',f))/58)
            xx=50+int(v*255);cv2.circle(top,(xx,260),10,(231,186,111),-1)
            out=cv2.addWeighted(out,.67,top,.85,0)
        if sid=='S11' and f>=self.beat('S11','Mark 6:52',f):
            cv2.rectangle(out,(5,40),(self.W-5,105),(13,21,36),-1)
            cv2.putText(out,'MARK 6:52',(28,67),cv2.FONT_HERSHEY_SIMPLEX,.67,(221,189,126),2,cv2.LINE_AA)
            cv2.putText(out,'THE LOAVES',(26,94),cv2.FONT_HERSHEY_SIMPLEX,.62,(240,232,208),2,cv2.LINE_AA)
        if labels:
            cv2.putText(out,'FOURTH WATCH  /  LAYOUT TEST',(12,23),cv2.FONT_HERSHEY_SIMPLEX,.4,(235,217,180),1,cv2.LINE_AA)
            cv2.putText(out,f'{sid}  -  NOT APPROVED',(12,self.H-18),cv2.FONT_HERSHEY_SIMPLEX,.43,(235,217,180),1,cv2.LINE_AA)
        return out.copy(),{'sid':sid,'frame':f,'joints':{'Jesus':self.Jesus.last_joint,'Peter':self.Peter.last_joint}}

def make_contact(renderer,seconds,output,columns=3):
    images=[]
    for t in seconds:
        im,_=renderer.frame(round(t*renderer.plan['fps']))
        im=cv2.cvtColor(im,cv2.COLOR_RGB2BGR);cv2.putText(im,f'{t:g}s',(12,44),cv2.FONT_HERSHEY_SIMPLEX,.55,(255,255,255),1)
        images.append(im)
    rows=math.ceil(len(images)/columns)
    sheet=np.zeros((rows*renderer.H,columns*renderer.W,3),dtype=np.uint8)
    for i,im in enumerate(images):sheet[(i//columns)*renderer.H:(i//columns+1)*renderer.H,(i%columns)*renderer.W:(i%columns+1)*renderer.W]=im
    cv2.imwrite(str(output),sheet)
    return output

def video(renderer,out,fps=12,seconds=None):
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{renderer.W}x{renderer.H}','-r',str(fps),'-i','-','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p',str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    duration=renderer.shots[-1]['end_frame']/renderer.plan['fps'] if seconds is None else seconds
    try:
        for i in range(round(duration*fps)):
            f=round(i*renderer.plan['fps']/fps)
            im,_=renderer.frame(f)
            proc.stdin.write(im.tobytes())
        proc.stdin.close();err=proc.stderr.read().decode();rc=proc.wait()
        if rc:raise RuntimeError(err)
    except Exception:
        proc.kill();proc.wait();raise
    sha=lambda data: hashlib.sha256(data).hexdigest()
    record={'status':'UNAPPROVED_3D_LAYOUT',
            'video_sha256':sha(out.read_bytes()),
            'renderer_source_sha256':sha(Path(__file__).read_bytes()),
            'plan_data_sha256':sha(json.dumps(renderer.plan,sort_keys=True).encode()),
            'fps':fps,'size':[renderer.W,renderer.H],'duration_s':duration,
            'notice':'Only applies to this exact rendered video and these exact inputs; not a release approval'}
    out.with_suffix(out.suffix+'.build.json').write_text(json.dumps(record,indent=2)+'\n')
    return {'video':str(out),'fps':fps,'size':[renderer.W,renderer.H],'duration_s':duration,
            'provenance':str(out.with_suffix(out.suffix+'.build.json')),
            'status':'UNAPPROVED_3D_LAYOUT'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('plan');ap.add_argument('--out',required=True);ap.add_argument('--fps',type=int,default=12)
    ap.add_argument('--width',type=int,default=360);ap.add_argument('--height',type=int,default=640)
    ap.add_argument('--stills',help='comma-delimited seconds');ap.add_argument('--seconds',type=float)
    a=ap.parse_args();s=yaml.safe_load(Path(a.plan).read_text());assert s['fps']==30
    render=Render(s,a.width,a.height)
    out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
    if a.stills:
        res=make_contact(render,[float(x) for x in a.stills.split(',')],out)
        print(json.dumps({'contact':str(res),'source':'original 3d VTK frames','status':'UNAPPROVED'}))
    else: print(json.dumps(video(render,out,a.fps,a.seconds)))
if __name__=='__main__':main()
