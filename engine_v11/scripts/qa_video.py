#!/usr/bin/env python3
"""Technical video QA. Flags potential failures, does not judge film quality."""
import argparse, json, subprocess, sys, os, math
from pathlib import Path

def ffprobe(path):
    p=subprocess.run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,text=True)
    if p.returncode: raise RuntimeError(p.stderr.strip() or 'ffprobe failed')
    return json.loads(p.stdout)

def run_qa(path,sample_fps=2):
    import cv2,numpy as np
    p=Path(path)
    info=ffprobe(p)
    v=next((s for s in info['streams'] if s['codec_type']=='video'),None)
    a=next((s for s in info['streams'] if s['codec_type']=='audio'),None)
    if not v: raise RuntimeError('no video stream')
    w,h=int(v['width']),int(v['height']);duration=float(info['format'].get('duration',0))
    errors=[];warn=[]
    if duration<=0:errors.append('no valid duration')
    if abs(w/h-9/16)>.002:warn.append('not 9:16')
    if w<720 or h<1280:warn.append('master lower than 720x1280')
    if not a:warn.append('no audio stream (fine for a silent animatic; not a final reel)')
    cap=cv2.VideoCapture(str(p));fps=cap.get(cv2.CAP_PROP_FPS)
    if not cap.isOpened() or fps<=0:raise RuntimeError('OpenCV cannot decode video')
    total=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));stride=max(1,int(round(fps/sample_fps)))
    prev=None;similar=[];black=[];sample_count=0; decode_errors=0
    for k in range(0,total,stride):
        if not cap.set(cv2.CAP_PROP_POS_FRAMES,k):decode_errors+=1;continue
        ok,frame=cap.read()
        if not ok:decode_errors+=1;continue
        gray=cv2.cvtColor(cv2.resize(frame,(144,256)),cv2.COLOR_BGR2GRAY)
        sample_count+=1
        if gray.mean()<8: black.append(round(k/fps,2))
        if prev is not None:
            mad=float(np.mean(np.abs(gray.astype(np.float32)-prev.astype(np.float32))))
            if mad<0.65:similar.append(round(k/fps,2))
        prev=gray
    cap.release()
    if decode_errors:warn.append(f'{decode_errors} sampled frames failed to decode')
    if black:warn.append(f'{len(black)} near-black sampled frames; check against creative intent')
    if len(similar)>=5:warn.append(f'{len(similar)} nearly-identical frame samples; may include intentional holds')
    return {'input':str(p),'bytes':p.stat().st_size,'duration_s':duration,'resolution':[w,h],'video_fps_est':round(fps,3),'video_codec':v.get('codec_name'),'audio_codec':a.get('codec_name') if a else None,'frames_reported':total,'sampled_frames':sample_count,'near_black_samples_s':black[:24],'near_still_samples_s':similar[:24],'warnings':warn,'errors':errors,'technical_pass':not errors,'limitations':['Sampled-image motion is not narrative quality or freeze proof','Audio presence is not intelligibility or licensed music','Always complete a full viewing/listening review']}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('video');ap.add_argument('--out');ap.add_argument('--sample-fps',type=float,default=2);args=ap.parse_args()
    try:r=run_qa(args.video,args.sample_fps)
    except Exception as e:print('QA FAIL:',e,file=sys.stderr);return 2
    raw=json.dumps(r,indent=2); print(raw)
    if args.out:Path(args.out).parent.mkdir(parents=True,exist_ok=True);Path(args.out).write_text(raw+'\n')
    return int(bool(r['errors']))
if __name__=='__main__':sys.exit(main())
