#!/usr/bin/env python3
"""Inspect EBU R128 loudness and peak with ffmpeg; does not make mix decisions."""
from pathlib import Path
import argparse,json,re,subprocess,sys

def measure(p):
    cmd=['ffmpeg','-hide_banner','-nostats','-i',str(p),'-map','0:a:0','-af','loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json','-f','null','-']
    r=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    if r.returncode:raise RuntimeError('Audio could not be decoded: '+r.stderr[-1200:])
    blocks=re.findall(r'\{\s*"input_i"\s*:\s*".*?\}',r.stderr,re.S)
    if not blocks:raise RuntimeError('FFmpeg loudness block absent')
    m=json.loads(blocks[-1])
    values={k:float(v) for k,v in m.items() if k in ('input_i','input_tp','input_lra','input_thresh')}
    warn=[]
    if values['input_tp']>-1.0:warn.append('true peak above -1 dBTP reference; investigate clipping/encoding')
    if values['input_i']<-20:warn.append('integrated loudness lower than -20 LUFS; check voice audibility')
    if values['input_i']>-10:warn.append('integrated loudness higher than -10 LUFS; check listener comfort')
    return {'file':str(p),'measurements':values,'warnings':warn,'caveat':'Measurements reflect the clip as analyzed. A pass does not prove voice intelligibility, soundtrack quality or platform compliance.'}

def main():
    x=argparse.ArgumentParser();x.add_argument('audio_or_video');x.add_argument('--out');a=x.parse_args()
    try:r=measure(a.audio_or_video)
    except Exception as e:print(str(e),file=sys.stderr);return 2
    s=json.dumps(r,indent=2);print(s)
    if a.out:Path(a.out).write_text(s+'\n')
    return 0
if __name__=='__main__':sys.exit(main())
