#!/usr/bin/env python3
"""Reproducible *3D* production rehearsal, from plan to director's review.

Never publishes, purchases credits, clones voices or promotes an unapproved
script to a finished film.  Distinct from preview_pipeline.py (2D animatic).
"""
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess, sys
from pathlib import Path
import cv2
from fw_engine import load, inspect, stats


def checked(cmd):
    p = subprocess.run([str(x) for x in cmd], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(f"Command failed: {' '.join(map(str, cmd))}\n{p.stderr[-3000:]}\n{p.stdout[-1000:]}")
    return p.stdout


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_renderer_provenance(video, plan, source):
    """Reject a stale workprint being presented as if it used new code."""
    video=Path(video)
    meta_file=video.with_suffix(video.suffix+'.build.json')
    if not meta_file.exists():raise ValueError('3D workprint has no source-binding build record')
    data=json.loads(meta_file.read_text())
    expected={'video_sha256':sha256(video),
              'renderer_source_sha256':sha256(source),
              'plan_data_sha256':hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()}
    for k,v in expected.items():
        if data.get(k)!=v:raise ValueError('3D provenance mismatch: '+k)
    if data.get('status')!='UNAPPROVED_3D_LAYOUT':raise ValueError('Unrecognized build record status')
    return data


def video_contact(video, plan, out):
    """Extract the actual encoded frames, not an unrelated renderer still."""
    import numpy as np
    cap = cv2.VideoCapture(str(video))
    if not cap.isOpened(): raise RuntimeError('Could not open the encoded 3D video')
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []
    for sh in plan['shots']:
        midpoint = .5*(sh['start_frame']+sh['end_frame'])/plan['fps']
        if not cap.set(cv2.CAP_PROP_POS_MSEC, 1000*midpoint): raise RuntimeError('Video seek failed')
        okay, f = cap.read()
        if not okay: raise RuntimeError('Missing contact frame for '+sh['id'])
        f = cv2.resize(f, (270,480), interpolation=cv2.INTER_AREA)
        cv2.rectangle(f, (0,0), (269,42), (14,20,33), -1)
        cv2.putText(f, f"{sh['id']} | {midpoint:.1f}s", (10,27),cv2.FONT_HERSHEY_SIMPLEX,.55,(231,215,185),1,cv2.LINE_AA)
        frames.append(f)
    cap.release()
    sheet = np.zeros((480*4,270*3,3),dtype=np.uint8)
    for i,f in enumerate(frames): sheet[(i//3)*480:(i//3+1)*480,(i%3)*270:(i%3+1)*270]=f
    out.parent.mkdir(parents=True,exist_ok=True)
    if not cv2.imwrite(str(out),sheet): raise RuntimeError('Could not write contact sheet')
    return out


def shot_frame_evidence(video, plan, out):
    """Per-shot source/encoded-frame receipt. Does not certify depiction quality."""
    cap=cv2.VideoCapture(str(video));fps=float(cap.get(cv2.CAP_PROP_FPS))
    if not cap.isOpened() or fps<=0:raise RuntimeError('Encoded video unavailable for evidence')
    records=[]
    for sh in plan['shots']:
        t=(sh['start_frame']+sh['end_frame'])/(2*plan['fps'])
        if not cap.set(cv2.CAP_PROP_POS_MSEC,t*1000):raise RuntimeError('Frame seek failed: '+sh['id'])
        okay,frame=cap.read()
        if not okay:raise RuntimeError('No frame for shot '+sh['id'])
        ok,encoded=cv2.imencode('.png',frame)
        if not ok:raise RuntimeError('Could not hash shot frame '+sh['id'])
        records.append({'id':sh['id'],'midpoint_s':round(t,3),'claim_ids':sh['claim_ids'],
                        'camera_intent':sh['camera']['why'],'actual_encoded_frame_sha256':hashlib.sha256(encoded.tobytes()).hexdigest(),
                        'stage':'UNAPPROVED_3D_LAYOUT_FRAME', 'technical_frame_present':True})
    cap.release()
    payload={'video_sha256':sha256(video),'source_plan_digest':hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest(),
             'shots':records,'notice':'Shot existence and frame hashes are not a director, biblical or rights approval'}
    Path(out).write_text(json.dumps(payload,indent=2)+'\n')
    return payload


def build(plan_file, out_folder, claims_file=None, fps=12, existing_video=None):
    root=Path(__file__).parent
    plan_file=Path(plan_file).resolve();out_folder=Path(out_folder).resolve()
    out_folder.mkdir(parents=True,exist_ok=True)
    plan=load(plan_file)
    errors,warnings=inspect(plan)
    if errors:raise ValueError('Invalid source plan: '+'; '.join(errors))
    if fps not in (8,10,12,15,24,30):raise ValueError('unsupported preview fps')
    video=out_folder/'01_3d_layout_silent.mp4'
    audio=out_folder/'02_sound_design_placeholder.wav'
    cues=out_folder/'02_sound_cues.json'
    combined=out_folder/'03_3d_camera_sound_review.mp4'
    qa=out_folder/'04_media_qa.json'
    contact=out_folder/'05_contact_sheet.jpg'
    review=out_folder/'06_director_review.html'
    production_manifest=out_folder/'07_production_manifest.json'
    release=out_folder/'08_release_blockers.json'
    shot_receipts=out_folder/'10_shot_frame_evidence.json'
    cold_review=out_folder/'11_unprimed_visual_review.html'
    if existing_video:
        validate_renderer_provenance(existing_video,plan,root/'vtk_story_renderer.py')
        if Path(existing_video).resolve()!=video.resolve():
            shutil.copy2(existing_video,video)
            record=Path(existing_video).with_suffix(Path(existing_video).suffix+'.build.json')
            shutil.copy2(record,video.with_suffix(video.suffix+'.build.json'))
    else:
        checked([sys.executable,root/'vtk_story_renderer.py',plan_file,'--out',video,'--fps',fps])
    validate_renderer_provenance(video,plan,root/'vtk_story_renderer.py')
    checked([sys.executable,root/'soundscape_test.py',plan_file,'--out',audio,'--cue-sheet',cues])
    checked(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',video,'-i',audio,'-c:v','copy','-c:a','aac','-shortest',combined])
    checked([sys.executable,root/'qa_video.py',combined,'--out',qa])
    video_contact(combined,plan,contact)
    shot_frame_evidence(combined,plan,shot_receipts)
    cmd=[sys.executable,root/'build_review.py',plan_file,combined,'--out',review,'--qa',qa,'--embed','--kind','3d_layout']
    if claims_file:cmd.extend(['--claims',Path(claims_file).resolve()])
    checked(cmd)
    checked([sys.executable,root/'build_cold_review.py',combined,'--out',cold_review])
    cmd=[sys.executable,root/'production_manifest.py',plan_file,'--out',production_manifest]
    if claims_file:cmd.extend(['--claims',Path(claims_file).resolve()])
    checked(cmd)
    from release_gate import audit
    gates=audit(plan,claims_file,None,combined)
    release.write_text(json.dumps(gates,indent=2)+'\n')
    media_qa=json.loads(qa.read_text())
    result={
        'status':'NOT_APPROVED_3D_WORKPRINT',
        'type':'real_vtk_3d_geometry_and_camera_with_temporary_synthetic_audio',
        'plan':str(plan_file), 'shot_count':len(plan['shots']), 'beat_count':stats(plan)['beat_count'],
        'source_plan_sha256':sha256(plan_file),'vtk_renderer_sha256':sha256(root/'vtk_story_renderer.py'),
        'audio_is_synthetic_and_narration_is_absent':True,
        'credit_spend':0, 'published':False,
        'media_qa':{k:media_qa[k] for k in ('duration_s','resolution','video_fps_est','near_still_samples_s','warnings','errors','technical_pass')},
        'release_blocked':not gates['release_package_preflight_pass'],
        'files':{},
        'limitations':['No creator-approved storm script or narration','Simple geometric characters and environments',
                       'No final licensed music, rights approval or publication',
                       'Camera projection checks cannot detect occlusion or judge emotional acting']
    }
    for key,path in [('render_provenance',video.with_suffix(video.suffix+'.build.json')),('silent_3d_video',video),('sound',audio),('combined_review_video',combined),('qa',qa),('contact',contact),('review_html',review),('manifest',production_manifest),('release_blockers',release),('shot_frame_evidence',shot_receipts),('unprimed_visual_review',cold_review)]:
        result['files'][key]={'path':str(path),'bytes':path.stat().st_size,'sha256':sha256(path)}
    destination=out_folder/'09_reproduction_report.json'
    destination.write_text(json.dumps(result,indent=2)+'\n')
    return result


def main():
    from render_lock import require_unlocked;require_unlocked()
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('plan');p.add_argument('--out',required=True);p.add_argument('--claims')
    p.add_argument('--fps',type=int,default=12);p.add_argument('--existing-video')
    a=p.parse_args()
    try:result=build(a.plan,a.out,a.claims,a.fps,a.existing_video)
    except Exception as e:print('3D PREVIEW FAIL:',e,file=sys.stderr);return 2
    print(json.dumps({k:v for k,v in result.items() if k!='files'},indent=2));return 0

if __name__=='__main__':sys.exit(main())
