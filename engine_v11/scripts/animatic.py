#!/usr/bin/env python3
"""Render a timed, storyboard-quality placeholder video from shotplan.yaml.

WARNING: This is an editor's animatic, not final character animation or a final
asset generator. Built with Pillow and ffmpeg for self-contained repeatable tests.
"""
import argparse, math, subprocess, sys, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fw_engine import inspect,load

W,H=360,640
NIGHT=(16,23,35);NAVY=(27,40,59);GOLD=(227,178,92);CREAM=(242,230,207);SKY=(55,80,103)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SERIF='/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'

def getfont(n,serif=False):
    try:return ImageFont.truetype(SERIF if serif else FONT,n)
    except: return ImageFont.load_default()

def wrap(draw,s,width,font):
    lines=[];cur=''
    for word in s.split():
        test=(cur+' '+word).strip()
        if draw.textbbox((0,0),test,font=font)[2]>width and cur:
            lines.append(cur);cur=word
        else:cur=test
    if cur:lines.append(cur)
    return lines

def eased(x):return x*x*(3-2*x)

def draw_boat(d,cx,cy,scale=1,color=(122,89,57)):
    ww=120*scale;hh=25*scale
    d.polygon([(cx-ww/2,cy),(cx+ww/2,cy),(cx+ww*.39,cy+hh),(cx-ww*.39,cy+hh)],fill=color,outline=(180,140,95))
    d.line([(cx,cy),(cx,cy-75*scale)],fill=(190,165,129),width=max(1,int(3*scale)))
    d.polygon([(cx+2*scale,cy-70*scale),(cx+2*scale,cy-8*scale),(cx+38*scale,cy-15*scale)],fill=(165,177,169))
    for x in (-25,15):
        d.ellipse((cx+x*scale-4*scale,cy-11*scale,cx+x*scale+4*scale,cy-3*scale),fill=(45,43,43))

def draw_person(d,cx,cy,scale=1,light=False,gesture=False):
    c=CREAM if light else (97,90,89)
    d.ellipse((cx-8*scale,cy-66*scale,cx+8*scale,cy-50*scale),fill=c)
    d.polygon([(cx-11*scale,cy-47*scale),(cx+11*scale,cy-47*scale),(cx+18*scale,cy),(cx-18*scale,cy)],fill=c)
    d.line([(cx-7*scale,cy-43*scale),(cx-24*scale,cy-21*scale)],fill=c,width=max(2,int(6*scale)))
    d.line([(cx+7*scale,cy-43*scale),(cx+(35 if gesture else 24)*scale,cy-(36 if gesture else 18)*scale)],fill=c,width=max(2,int(6*scale)))

def label(d,x,y,text,size=12,color=CREAM,maxwidth=316):
    f=getfont(size);lines=wrap(d,text,maxwidth,f)
    for l in lines:
        d.text((x,y),l,font=f,fill=color,stroke_width=0)
        y+=int(size*1.45)
    return y

def render(shot,frame,fps,episode):
    t=(frame-shot['start_frame'])/max(1,shot['end_frame']-shot['start_frame']);ease=eased(t)
    im=Image.new('RGB',(W,H),NIGHT);d=ImageDraw.Draw(im)
    move=shot['camera']['move'];scale=shot['camera']['start_scale']+(shot['camera']['end_scale']-shot['camera']['start_scale'])*ease
    cam_shift=int(shot['camera'].get('pan_x',0)*ease)
    # Atmosphere and water geometry; deliberately painterly placeholders.
    for j in range(0,420,8):
        a=j/420;c=tuple(int(NIGHT[k]*(1-a)+NAVY[k]*a) for k in range(3))
        d.rectangle((0,j,W,j+8),fill=c)
    d.ellipse((225+cam_shift,92,260+cam_shift,127),fill=(165,162,145))
    for i in range(16):
        y=350+i*18
        q=math.sin((frame/fps)*1.3+i*1.6)*8
        d.arc((-45+q,y,405+q,y+30),8,173,fill=(44+i//3,76+i//3,94+i//4),width=2)
    text=shot['visual']['action'].lower()+' '+shot['visual']['subject'].lower()
    cx=180+cam_shift
    if 'boat' in text or 'row' in text or 'sea' in text or 'water' in text:
        draw_boat(d,cx,360,min(1.65,max(.38,scale)))
    if 'jesus' in text or 'figure' in text or 'person' in text or 'peter' in text:
        posx=230+cam_shift if 'boat' in text else cx
        draw_person(d,posx,390,scale=min(1.8,max(.7,scale)),light=('jesus' in text or 'figure' in text),gesture=('reach' in text or 'hand' in text))
    if 'bread' in text or 'loaves' in text:
        for i in range(5):d.ellipse((50+i*50,330,91+i*50,361),fill=(173,112,53),outline=GOLD,width=2)
    if shot['medium']=='motion_graphic':
        d.rounded_rectangle((53,282,307,432),radius=12,outline=GOLD,width=2,fill=(32,40,50))
        label(d,70,305,shot['visual']['subject'].upper(),size=19,maxwidth=220)
        label(d,70,358,shot['visual']['action'],size=12,maxwidth=223)
    if shot['medium']=='text_evidence':
        d.rounded_rectangle((31,243,329,445),radius=7,fill=(35,42,50),outline=(107,99,83),width=2)
        label(d,49,275,shot['visual']['subject'].upper(),size=16,maxwidth=263)
        label(d,49,323,shot['visual']['action'],size=14,color=GOLD,maxwidth=263)
    # Overlay: deliberately marks source as a placeholder; never claim 'finished'.
    d.rectangle((10,11,349,58),fill=(8,12,20))
    label(d,20,18,'FOURTH WATCH · ANIMATIC · NOT FINAL',size=10,maxwidth=325)
    label(d,20,37,f"{shot['id']} · {shot['size']} / {shot['angle']} · {move}",size=9,maxwidth=320)
    # Big middle visual read; director can test it at phone size.
    d.rounded_rectangle((12,461,348,521),radius=8,fill=(6,11,19))
    label(d,22,471,shot['read'],size=11,maxwidth=312)
    # Narration preview, distinct from a real subtitle track.
    d.rounded_rectangle((12,530,348,626),radius=8,fill=(19,22,30))
    label(d,22,542,shot['narration'] if shot['narration'] else '(silent)',size=12,maxwidth=309)
    d.rectangle((0,636,int(W*(frame+1)/episode['shots'][-1]['end_frame']),640),fill=GOLD)
    return im

def main():
    p=argparse.ArgumentParser();p.add_argument('shotplan');p.add_argument('--out',default='outputs/animatic.mp4');p.add_argument('--fps',type=int,default=12);p.add_argument('--limit-s',type=float,default=None)
    args=p.parse_args();episode=load(args.shotplan);errors,warnings=inspect(episode)
    if errors:raise SystemExit('Invalid shotplan: '+'; '.join(errors))
    fps=episode['fps']; outfps=args.fps
    if outfps<1:raise SystemExit('fps must be positive')
    dest=Path(args.out);dest.parent.mkdir(parents=True,exist_ok=True)
    n=episode['shots'][-1]['end_frame']; seconds=n/fps
    if args.limit_s: seconds=min(seconds,args.limit_s)
    nout=math.ceil(seconds*outfps)
    cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(outfps),'-i','-','-c:v','libx264','-pix_fmt','yuv420p','-preset','ultrafast','-crf','25','-movflags','+faststart',str(dest)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    shots=episode['shots'];idx=0
    try:
        for j in range(nout):
            f=min(n-1,int(j/outfps*fps))
            while idx<len(shots)-1 and f>=shots[idx]['end_frame']: idx+=1
            img=render(shots[idx],f,fps,episode)
            proc.stdin.write(img.tobytes())
        proc.stdin.close();err=proc.stderr.read().decode();rc=proc.wait()
    except Exception:
        proc.kill();raise
    if rc:raise SystemExit('ffmpeg failed: '+err)
    print(json.dumps({'video':str(dest),'seconds':round(nout/outfps,2),'resolution':[W,H],'status':'MOVING_PLACEHOLDER_ONLY','approved_for_release':False},indent=2))
if __name__=='__main__':main()
