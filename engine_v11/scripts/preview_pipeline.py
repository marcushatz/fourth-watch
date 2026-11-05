#!/usr/bin/env python3
"""One local command: validate -> silent camera study -> synth bed -> mux -> QA -> review.

This builds a nonfinal, non-script-approved research preview. No network, external
voice APIs, spending, publishing, or writes into the historical production repo.
"""
import argparse, json, subprocess, sys, hashlib
from pathlib import Path
from fw_engine import load, inspect, stats

def run_command(cmd):
    p=subprocess.run(cmd,text=True,capture_output=True)
    if p.returncode:raise RuntimeError('Step failed: '+' '.join(map(str,cmd))+'\n'+p.stdout[-800:]+'\n'+p.stderr[-1500:])
    return p.stdout

def execute(plan_path, out_dir, claims_path=None, dry_run=False, video_fps=12):
    plan_path=Path(plan_path).resolve();out_dir=Path(out_dir).resolve();out_dir.mkdir(parents=True,exist_ok=True)
    plan=load(plan_path);errors,warnings=inspect(plan)
    if errors:raise ValueError('Invalid shotplan: '+'; '.join(errors))
    here=Path(__file__).parent
    video=out_dir/'visual_only.mp4';sound=out_dir/'sound_only.wav';mux=out_dir/'camera_sound_preview.mp4'
    cue=out_dir/'sound_cues.json';qa=out_dir/'qa.json';review=out_dir/'review.html';manifest=out_dir/'manifest.json'
    commands=[
        [sys.executable,str(here/'production_manifest.py'),str(plan_path),'--out',str(manifest)],
        [sys.executable,str(here/'cinematic_animatic.py'),str(plan_path),'--fps',str(video_fps),'--out',str(video)],
        [sys.executable,str(here/'soundscape_test.py'),str(plan_path),'--out',str(sound),'--cue-sheet',str(cue)],
        ['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-i',str(sound),'-c:v','copy','-c:a','aac','-shortest',str(mux)],
        [sys.executable,str(here/'qa_video.py'),str(mux),'--out',str(qa)],
        [sys.executable,str(here/'build_review.py'),str(plan_path),str(mux),'--out',str(review),'--qa',str(qa),'--embed'],
    ]
    if claims_path:
        commands[0].extend(['--claims',str(Path(claims_path).resolve())])
        commands[-1].extend(['--claims',str(Path(claims_path).resolve())])
    summary={'plan':str(plan_path),'out':str(out_dir),'dry_run':dry_run,'warnings':warnings,'diagnostics':stats(plan),'approval_required':True,'final_video':False,'commands':commands}
    if not dry_run:
        for cmd in commands:run_command(cmd)
        summary['qa']=json.loads(qa.read_text())
        summary['outputs']={k:str(v) for k,v in [('camera_video',video),('sound',sound),('preview',mux),('qa',qa),('review',review),('manifest',manifest)]}
        (out_dir/'preview_build.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False)+'\n')
    return summary

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('shotplan');p.add_argument('--out',required=True);p.add_argument('--claims');p.add_argument('--fps',type=int,default=12)
    p.add_argument('--dry-run',action='store_true')
    a=p.parse_args()
    if not a.dry_run:
        from render_lock import require_unlocked;require_unlocked()
    if not 6<=a.fps<=30: p.error('preview fps must be in 6..30')
    try:r=execute(a.shotplan,a.out,a.claims,a.dry_run,a.fps)
    except Exception as e:print('PREVIEW FAIL:',e,file=sys.stderr);return 2
    print(json.dumps({k:v for k,v in r.items() if k not in ('commands','diagnostics')},indent=2));return 0
if __name__=='__main__':sys.exit(main())
