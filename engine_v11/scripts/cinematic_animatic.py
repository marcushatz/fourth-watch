#!/usr/bin/env python3
"""Original 2D cinematography proof for the storm pilot.

Demonstrates distinct blocking, meaningful action, shot-size changes and a camera
move per plan. DOES NOT implement generic 3D scene building or finished acting.
All shapes/sounds here are original procedural placeholders. Silent by design.
"""
import argparse,math,subprocess,sys,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
from fw_engine import load,inspect

W,H=360,640
BG=(11,21,38);WATER=(16,53,78);INK=(7,14,26)
GOLD=(232,183,103);PAPER=(239,229,207);BLUE=(77,130,156);CLOAK=(199,191,164)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SERIF='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
def font(n,serif=False):
    try:return ImageFont.truetype(SERIF if serif else FONT,n)
    except:return ImageFont.load_default()
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
def lerp(a,b,x):return a+(b-a)*x

def sea(draw,time,horizon=350):
    for y in range(horizon,H,8):
        k=(y-horizon)/max(1,H-horizon)
        c=tuple(int(lerp(WATER[j],INK[j],k*.62)) for j in range(3))
        draw.rectangle((0,y,W,y+8),fill=c)
    for i in range(18):
        y=horizon+8+i*17
        dx=math.sin(time*.85+i*.7)*10
        x0=int(-60+dx+(i%3)*28)
        draw.arc((x0,y,x0+410,y+22),start=195,end=345,fill=(47,92,111),width=2)

def sky(draw,time,moon=True,horizon=350):
    for y in range(0,horizon,8):
        k=y/max(1,horizon)
        c=(int(lerp(12,23,k)),int(lerp(18,38,k)),int(lerp(32,59,k)))
        draw.rectangle((0,y,W,y+8),fill=c)
    for i in range(23):
        x=((i*97+43)%W);y=(i*61+19)%(horizon-80)
        twinkle=1+math.sin(time*1.2+i)*.12
        r=max(1,int(twinkle));draw.ellipse((x-r,y-r,x+r,y+r),fill=(96,118,124))
    if moon:
        draw.ellipse((266,87,300,121),fill=(193,184,156))
        draw.ellipse((278,82,311,116),fill=(21,28,43))

def boat(d,x,y,sc=1,tilt=0,people=2):
    ww=130*sc;hh=22*sc
    pts=[(x-ww/2,y-4*sc),(x+ww/2,y-4*sc),(x+ww*.38,y+hh),(x-ww*.38,y+hh)]
    d.polygon(pts,fill=(112,78,57),outline=GOLD)
    for off in [-.22,.13][:people]:
        cx=x+ww*off;d.ellipse((cx-5*sc,y-22*sc,cx+5*sc,y-12*sc),fill=(212,186,152))
        d.line((cx,y-12*sc,cx,y-3*sc),fill=(97,72,56),width=max(2,int(5*sc)))
    d.line((x-43*sc,y+3*sc,x-79*sc,y-20*sc),fill=(170,133,92),width=max(2,int(4*sc)))
    d.line((x+42*sc,y+3*sc,x+80*sc,y-20*sc),fill=(170,133,92),width=max(2,int(4*sc)))

def person(d,x,y,sc=1,kind='jesus',arms='down',height=72):
    tunic=PAPER if kind=='jesus' else ((206,169,119) if kind=='peter' else (149,140,129))
    heady=y-height*sc
    r=7*sc
    d.ellipse((x-r,heady-r,x+r,heady+r),fill=(211,178,144),outline=INK)
    if kind=='jesus':
        d.arc((x-r-3*sc,heady-r-4*sc,x+r+3*sc,heady+r+6*sc),0,195,fill=(64,48,39),width=max(2,int(3*sc)))
    d.polygon([(x-10*sc,heady+8*sc),(x+10*sc,heady+8*sc),(x+18*sc,y),(x-19*sc,y)],fill=tunic)
    ah=heady+21*sc
    if arms=='reach':
        d.line((x+8*sc,ah,x+42*sc,ah-10*sc),fill=tunic,width=max(2,int(6*sc)))
        d.ellipse((x+40*sc,ah-13*sc,x+47*sc,ah-6*sc),fill=(215,182,145))
    elif arms=='help':
        d.line((x-7*sc,ah,x-22*sc,ah-26*sc),fill=tunic,width=max(2,int(6*sc)))
        d.line((x+7*sc,ah,x+24*sc,ah-34*sc),fill=tunic,width=max(2,int(6*sc)))
    elif arms=='walk':
        d.line((x-8*sc,ah,x-28*sc,ah-11*sc),fill=tunic,width=max(2,int(6*sc)))
        d.line((x+8*sc,ah,x+27*sc,ah+5*sc),fill=tunic,width=max(2,int(6*sc)))
    else:
        d.line((x-8*sc,ah,x-18*sc,ah+29*sc),fill=tunic,width=max(2,int(6*sc)))
        d.line((x+8*sc,ah,x+18*sc,ah+29*sc),fill=tunic,width=max(2,int(6*sc)))

def centered(d,text,y,n=16,color=PAPER):
    ft=font(n,True);bb=d.textbbox((0,0),text,font=ft);d.text(((W-(bb[2]-bb[0]))/2,y),text,fill=color,font=ft)

def compose(shot,t,frame,fps):
    im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
    dur=shot['end_frame']-shot['start_frame'];phase=ease((frame-shot['start_frame'])/dur)
    start=shot['camera']['start_scale'];end=shot['camera']['end_scale']
    cam=lerp(start,end,phase)
    seconds=frame/fps
    sid=shot['id'];bob=math.sin(seconds*2.1)*3
    sky(d,seconds)
    sea(d,seconds)
    if sid=='S01':
        boat(d,160+phase*4,385+bob,sc=.88*cam)
        d.line((60,335,130,335),fill=(176,185,189),width=2)
        d.line((75,350,136,350),fill=(176,185,189),width=2)
    elif sid=='S02':
        d.polygon([(0,315),(0,480),(88,391),(120,367),(124,351),(85,349)],fill=(27,41,39))
        person(d,67,340,sc=.73,kind='jesus')
        boat(d,284,378+bob*.4,sc=.35)
        d.line((112,348,255,372),fill=(173,150,105),width=1)
    elif sid=='S03':
        d.rounded_rectangle((43,215,317,438),radius=22,fill=(17,30,47),outline=GOLD,width=2)
        d.arc((95,247,265,417),0,359,fill=(98,119,129),width=2)
        for i in range(12):
            a=i*math.pi/6
            x=180+74*math.sin(a);y=332-74*math.cos(a)
            d.ellipse((x-2,y-2,x+2,y+2),fill=PAPER)
        a=phase*math.pi/2
        d.line((180,332,180+67*math.sin(a),332-67*math.cos(a)),fill=GOLD,width=4)
        centered(d,'FOURTH WATCH',454,20,GOLD)
    elif sid=='S04':
        boat(d,69,394+bob,sc=.48)
        x=245-(phase*22)
        person(d,x,388+bob*.2,sc=.94,kind='jesus',arms='walk')
        d.arc((x-24,383,x+35,394),0,180,fill=GOLD,width=2)
    elif sid=='S05':
        boat(d,191,440+bob,sc=1.25)
        for x in (150,192,238):
            person(d,x,433+bob,sc=.73,kind='other',arms='help')
        d.polygon([(16,185),(87,232),(16,283)],fill=(33,47,61))
    elif sid=='S06':
        person(d,180,445,sc=1.45*cam,kind='jesus',arms='reach')
        centered(d,'DO NOT BE AFRAID',247,17,GOLD)
    elif sid=='S07':
        boat(d,95,419+bob,sc=.96)
        px=lerp(127,219,phase)
        person(d,px,411+bob*(1-phase),sc=.97,kind='peter',arms='walk')
        d.arc((px-20,416,px+28,426),0,175,fill=(143,163,170),width=2)
    elif sid=='S08':
        yy=lerp(405,481,phase)
        person(d,191,yy,sc=1.17,kind='peter',arms='help')
        d.arc((142,443,238,487),12,170,fill=(159,177,184),width=3)
        d.arc((153,453,230,482),15,168,fill=(74,137,160),width=3)
    elif sid=='S09':
        person(d,128,447,sc=1.5,kind='jesus',arms='reach')
        person(d,259,491-35*phase,sc=1.15,kind='peter',arms='help')
        d.line((193,377,225,383),fill=GOLD,width=7)
        d.ellipse((212,375,224,387),fill=(227,189,146))
    elif sid=='S10':
        boat(d,192,427+bob,sc=1.2)
        person(d,146,422,sc=.77,kind='jesus')
        person(d,216,422,sc=.76,kind='peter')
        for i in range(5):
            d.arc((-45+i*22,458+i*15,400+i*22,489+i*15),195,345,fill=(50,92,104),width=1)
    elif sid=='S11':
        d.rounded_rectangle((35,235,325,438),radius=15,fill=(22,33,44),outline=GOLD,width=2)
        centered(d,'MARK 6:52',272,18,GOLD)
        centered(d,'THE LOAVES',314,22,PAPER)
        for i in range(5):
            d.ellipse((59+i*50,374,97+i*50,404),fill=(174,120,61),outline=GOLD,width=2)
    elif sid=='S12':
        boat(d,180,397+bob,sc=.92)
        for i in range(5):
            d.ellipse((37+i*58,496,78+i*58,522),fill=(177,123,69),outline=GOLD,width=2)
        centered(d,'WHAT DID THEY MISS?',242,19,GOLD)
    else:
        centered(d,'SHOT '+sid,290,22)
    # Intentional editorial overlay: unambiguous review-only watermark and timeline.
    d.rectangle((0,0,360,52),fill=(8,13,23))
    d.text((15,12),'FOURTH WATCH  /  CINEMATOGRAPHY TEST',font=font(10),fill=GOLD)
    d.text((15,31),f'{sid}  ·  {shot["size"]}  ·  {shot["angle"]}  ·  {shot["camera"]["move"]}',font=font(10),fill=PAPER)
    d.rectangle((0,561,360,638),fill=(7,13,24))
    # Keep slate legible without trying to fake subtitle timing.
    words=shot['narration'].split();lines=[];current=''
    for word in words:
        trial=(current+' '+word).strip()
        if len(trial)>43 and current:lines.append(current);current=word
        else:current=trial
    if current:lines.append(current)
    for k,line in enumerate(lines[:3]):
        d.text((15,574+k*17),line,font=font(12),fill=PAPER)
    d.rectangle((0,636,360*frame/(max(1,1440)),640),fill=GOLD)
    return im

def main():
    p=argparse.ArgumentParser();p.add_argument('plan');p.add_argument('--out',default='outputs/storm_cinematic_test.mp4');p.add_argument('--fps',type=int,default=12);p.add_argument('--limit-s',type=float)
    a=p.parse_args();plan=load(a.plan);errors,_=inspect(plan)
    if errors:raise SystemExit('invalid plan '+repr(errors))
    fps=plan['fps'];outfps=a.fps;max_seconds=plan['shots'][-1]['end_frame']/fps
    if a.limit_s:max_seconds=min(max_seconds,a.limit_s)
    n=math.ceil(max_seconds*outfps);output=Path(a.out);output.parent.mkdir(parents=True,exist_ok=True)
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgb24','-video_size','360x640','-framerate',str(outfps),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','24','-movflags','+faststart',str(output)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    shots=plan['shots'];idx=0
    try:
        for i in range(n):
            f=min(plan['shots'][-1]['end_frame']-1,int(i*fps/outfps))
            while idx<len(shots)-1 and f>=shots[idx]['end_frame']:idx+=1
            proc.stdin.write(compose(shots[idx],i/outfps,f,fps).tobytes())
        proc.stdin.close();err=proc.stderr.read().decode();rc=proc.wait()
    except Exception:
        proc.kill();raise
    if rc:raise RuntimeError(err)
    print(json.dumps({'output':str(output),'seconds':n/outfps,'status':'PROCEDURAL_CAMERA_TEST_NOT_FINAL','audio':False,'frames':n}))
if __name__=='__main__':main()
