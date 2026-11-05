#!/usr/bin/env python3
"""Data-driven 2D production prototype: keyframed actors, props and camera.

Input: declarative JSON scene graph. Output: deterministic animated raster frames.
Supports reusable rig symbols, layer order, camera travel and per-element keyframes.
This is NOT finished 3D production, physics or character performance.
"""
import argparse,json,math,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
W,H=360,640
PALETTE={'night':(11,21,38),'sea':(17,50,72),'gold':(232,183,103),'cream':(239,229,207),'ochre':(159,112,72),'sand':(142,102,65),'warm':(204,171,131),'peter':(198,164,119),'jesus':(229,218,199),'muted':(88,134,153)}

def ease(t,kind='smooth'):
    t=min(1,max(0,t))
    return t if kind=='linear' else t*t*(3-2*t)

def interp(keys,t,field,default=0):
    if not keys:return default
    keys=sorted(keys,key=lambda k:k['time'])
    if t<=keys[0]['time']:return keys[0].get(field,default)
    if t>=keys[-1]['time']:return keys[-1].get(field,default)
    for a,b in zip(keys,keys[1:]):
        if a['time']<=t<=b['time']:
            factor=ease((t-a['time'])/(b['time']-a['time']),b.get('ease','smooth'))
            return a.get(field,default)+(b.get(field,default)-a.get(field,default))*factor
    return default

def keyval(item,t,field,default):
    return interp(item.get('keys',[]),t,field,item.get(field,default))

def transform(x,y,cam):
    return (W/2+(x-cam['x'])*cam['zoom'],H/2+(y-cam['y'])*cam['zoom'])

def render_symbol(d,typ,x,y,s,col,phase=0,pose='stand'):
    if typ=='boat':
        d.polygon([(x-73*s,y-13*s),(x+73*s,y-13*s),(x+55*s,y+19*s),(x-60*s,y+19*s)],fill=PALETTE['ochre'],outline=PALETTE['gold'])
        d.line((x-54*s,y-10*s,x-80*s,y-42*s+12*math.sin(phase)),fill=PALETTE['warm'],width=max(2,int(3*s)))
        d.line((x+52*s,y-10*s,x+81*s,y-43*s-12*math.sin(phase)),fill=PALETTE['warm'],width=max(2,int(3*s)))
    elif typ in ('person','peter','jesus'):
        color=PALETTE['jesus'] if typ=='jesus' else (PALETTE['peter'] if typ=='peter' else col)
        d.ellipse((x-8*s,y-80*s,x+8*s,y-64*s),fill=PALETTE['warm'])
        d.polygon([(x-12*s,y-63*s),(x+12*s,y-63*s),(x+20*s,y),(x-20*s,y)],fill=color)
        if pose=='reach':
            d.line((x+11*s,y-48*s,x+46*s,y-60*s),fill=color,width=max(3,int(7*s)))
            d.ellipse((x+43*s,y-63*s,x+52*s,y-55*s),fill=PALETTE['warm'])
        elif pose=='help':
            d.line((x-11*s,y-49*s,x-34*s,y-90*s),fill=color,width=max(3,int(6*s)))
            d.line((x+11*s,y-49*s,x+34*s,y-90*s),fill=color,width=max(3,int(6*s)))
        elif pose=='step':
            d.line((x+8*s,y-11*s,x+39*s,y+7*s),fill=color,width=max(3,int(7*s)))
            d.line((x-8*s,y-11*s,x-27*s,y+3*s),fill=color,width=max(3,int(7*s)))
        else:
            d.line((x-11*s,y-45*s,x-25*s,y-20*s),fill=color,width=max(3,int(6*s)))
            d.line((x+11*s,y-45*s,x+22*s,y-16*s),fill=color,width=max(3,int(6*s)))
    elif typ=='bread':
        d.ellipse((x-22*s,y-15*s,x+22*s,y+14*s),fill=PALETTE['ochre'],outline=PALETTE['gold'],width=max(1,int(2*s)))
    elif typ=='lamp':
        d.ellipse((x-12*s,y-16*s,x+12*s,y+16*s),fill=PALETTE['gold'])
        d.arc((x-19*s,y-28*s,x+19*s,y+9*s),180,360,fill=PALETTE['cream'],width=max(2,int(3*s)))
    elif typ=='circle':
        d.ellipse((x-10*s,y-10*s,x+10*s,y+10*s),fill=col)
    else:raise ValueError('unsupported symbol '+typ)

def render_frame(scene,t,editorial=True):
    im=Image.new('RGB',(W,H),PALETTE['night']);d=ImageDraw.Draw(im)
    # Static atmospheric layers with deterministic animated water.
    for y in range(0,355,7):
        ratio=y/355;c=(int(11+18*ratio),int(21+19*ratio),int(38+25*ratio));d.rectangle((0,y,W,y+7),fill=c)
    d.ellipse((265,73,303,111),fill=(188,189,168))
    for y in range(340,H,8):
        ratio=(y-340)/300;d.rectangle((0,y,W,y+8),fill=(int(15+6*ratio),int(49-19*ratio),int(73-28*ratio)))
    for i in range(16):
        y=348+i*17;dx=7*math.sin(t*.7+i)
        d.arc((-40+dx,y,420+dx,y+34),195,345,fill=PALETTE['muted'],width=1)
    cm=scene.get('camera',{});cam={k:keyval(cm,t,k,default) for k,default in [('x',180),('y',320),('zoom',1)]}
    for item in sorted(scene.get('objects',[]),key=lambda z:z.get('z',0)):
        x=keyval(item,t,'x',180);y=keyval(item,t,'y',375)
        sc=keyval(item,t,'scale',1);alpha=keyval(item,t,'alpha',1)
        if alpha<=.01:continue
        xx,yy=transform(x,y,cam);sc*=cam['zoom']
        typ=item.get('symbol','person')
        # alpha is a visibility gate for solid primitive art, compositing planned for next renderer.
        render_symbol(d,typ,xx,yy,sc,PALETTE.get(item.get('color','cream'),PALETTE['cream']),t*2,item.get('pose','stand'))
    if editorial:
        d.rectangle((0,0,W,52),fill=(7,12,22))
        d.text((12,12),'FOURTH WATCH  /  DATA-DRIVEN CAMERA',fill=PALETTE['gold'])
        d.text((12,30),scene.get('name','UNNAMED')+'  ·  TEST ONLY',fill=PALETTE['cream'])
    return im

def validate(s):
    errs=[]
    if not isinstance(s.get('duration_s'),(int,float)) or s['duration_s']<=0:errs.append('positive duration_s required')
    if not isinstance(s.get('objects'),list):errs.append('objects must be a list')
    for item in s.get('objects',[]):
        if item.get('symbol') not in ('boat','person','jesus','peter','bread','lamp','circle'):errs.append('unknown symbol '+str(item.get('symbol')))
        prev=-1
        for key in item.get('keys',[]):
            if key.get('time',-1)<prev:errs.append('unsorted keyframe '+str(item.get('id')))
            prev=key.get('time',-1)
            if prev<0 or prev>s.get('duration_s',0):errs.append('out of bounds keyframe '+str(item.get('id')))
    return errs

def main():
    from render_lock import require_unlocked;require_unlocked()
    p=argparse.ArgumentParser();p.add_argument('scene');p.add_argument('--out',default='outputs/scene_player.mp4');p.add_argument('--fps',type=int,default=12)
    a=p.parse_args();s=json.loads(Path(a.scene).read_text());errors=validate(s)
    if errors:raise SystemExit('scene invalid: '+repr(errors))
    out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
    cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size','360x640','-framerate',str(a.fps),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','24',str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for j in range(int(s['duration_s']*a.fps)):
            proc.stdin.write(render_frame(s,j/a.fps).tobytes())
        proc.stdin.close();err=proc.stderr.read().decode();rc=proc.wait()
    except Exception:proc.kill();raise
    if rc:raise RuntimeError(err)
    print(json.dumps({'video':str(out),'duration_s':s['duration_s'],'objects':len(s['objects']),'status':'KEYFRAME_STAGE_TEST_ONLY'}))
if __name__=='__main__':main()
