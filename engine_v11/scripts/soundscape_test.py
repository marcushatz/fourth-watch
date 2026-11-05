#!/usr/bin/env python3
"""Generate a low-level ORIGINAL sound-design study from the storyboard.

Not a final score, not a replacement for approved narration. Synthesized without
external samples. Deterministic noise, event-tied emphasis, 48 kHz WAV.
"""
import argparse,math,wave,json
from pathlib import Path
import numpy as np
from fw_engine import load,inspect

def generate(plan, sample_rate=48000):
    errors,_=inspect(plan)
    if errors:raise ValueError('; '.join(errors))
    dur=plan['shots'][-1]['end_frame']/plan['fps'];n=int(dur*sample_rate)
    t=np.arange(n,dtype=np.float64)/sample_rate
    rng=np.random.default_rng(4252026)
    # Color noise: wind in a filtered, slowly changing range instead of harsh white hiss.
    white=rng.normal(0,1,n).astype(np.float32)
    k=np.ones(160,dtype=np.float32)/160
    coarse=np.convolve(white[::8],np.ones(25,dtype=np.float32)/25,mode='same')
    # Upsample interpolated source, controlled by slow swells.
    wind=np.interp(t,t[::8],coarse).astype(np.float32)
    swell=(.55+.35*np.sin(2*np.pi*t/.9)*np.sin(2*np.pi*t/8.5))
    sound=.12*wind*swell
    # Subtle sea waves, audible only as a low moving texture.
    sound+=.008*np.sin(2*np.pi*62*t+.4*np.sin(2*np.pi*.18*t))
    sound+=.004*np.sin(2*np.pi*93*t)*np.sin(np.pi*np.mod(t/6.0,1))
    all_hits=[]
    for shot in plan['shots']:
        for beat in shot['beats']:
            sec=beat['at_frame']/plan['fps'];kind=beat['kind'];all_hits.append((round(sec,3),kind,beat.get('label','')))
            start=int(sec*sample_rate)
            if start>=n:continue
            length=min(n-start,int(.5*sample_rate));u=np.arange(length)/sample_rate
            if kind in ('action','reaction','reveal'):
                # Short, low thump + spectral breath; avoids voice-critical frequencies.
                env=np.exp(-u*11.2)
                f=48 if kind=='action' else 66
                sound[start:start+length]+=(.035*env*np.sin(2*np.pi*f*u)).astype(np.float32)
            elif kind=='light':
                env=np.exp(-u*8)
                sound[start:start+length]+=(.012*env*np.sin(2*np.pi*560*u)).astype(np.float32)
    # A tiny harmonic movement as the story crosses from fear to rescue.
    for sec0,sec1,notes,amp in [(0,18,(110,164.81),.007),(18,32,(98,146.83),.007),(32,48,(110,164.81,220),.009)]:
        a=int(sec0*sample_rate);b=min(n,int(sec1*sample_rate));u=t[a:b]
        lead=min(len(u),sample_rate*2)
        gate=np.ones(len(u),dtype=np.float32)
        gate[:lead]=np.linspace(0,1,lead)
        if len(u)>lead:gate[-lead:]*=np.linspace(1,0,lead)
        for fr in notes:sound[a:b]+=amp*gate*np.sin(2*np.pi*fr*u)
    # Avoid clipping; this is mix-safe placeholder, not a loudness-targeted master.
    peak=float(np.max(np.abs(sound)))
    if peak>.55:sound*=.55/peak
    return np.asarray(sound*32767,dtype='<i2').tobytes(),all_hits,dur,float(np.max(np.abs(sound)))

def main():
    from render_lock import require_unlocked;require_unlocked()
    p=argparse.ArgumentParser();p.add_argument('shotplan');p.add_argument('--out',required=True);p.add_argument('--cue-sheet');a=p.parse_args()
    plan=load(a.shotplan);audio,cues,duration,peak=generate(plan)
    path=Path(a.out);path.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(path),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(48000);f.writeframes(audio)
    if a.cue_sheet:Path(a.cue_sheet).write_text(json.dumps({'status':'SOUND_DESIGN_PLACEHOLDER','event_cues':cues},indent=2)+'\n')
    print(json.dumps({'path':str(path),'duration_s':duration,'cues':len(cues),'original_synth':True,'peak_normalized':peak,'voiceover':False,'status':'SOUND_DESIGN_TEST_ONLY'}))
if __name__=='__main__':main()
