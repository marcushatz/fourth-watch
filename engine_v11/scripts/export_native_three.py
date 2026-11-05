#!/usr/bin/env python3
"""Export exact v10 evaluated 30fps scene state for the native film27 Three.js scene API.

This is a frame-sampled migration bridge, not an independent cinematic rig and
not proof that the native renderer has run. Output is strictly NOT APPROVED.
"""
import argparse, hashlib, json, math, sys
from pathlib import Path
import yaml
from vtk_state_bridge import StateExportRender
from fw_engine import inspect


def canonical_bytes(data):
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False).encode()


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def export(plan_path, outdir):
    plan_path=Path(plan_path).resolve(); outdir=Path(outdir); outdir.mkdir(parents=True,exist_ok=True)
    plan=yaml.safe_load(plan_path.read_text())
    errors,_=inspect(plan)
    if errors: raise ValueError('Invalid plan: '+'; '.join(errors))
    if plan['fps']!=30: raise ValueError('Native film27 contract requires 30fps source frames')
    if plan.get('approved_script_sha256') or any(plan.get('approval',{}).values()):
        raise ValueError('This research bridge cannot export an approved production state')
    r=StateExportRender(plan,width=360,height=640)
    N=plan['shots'][-1]['end_frame']
    frames=[]
    for f in range(N):
        _, info=r.frame(f,draw=False)
        frames.append(info['snapshot'])
    timeline={
       'version':'v11-native-bridge-1', 'status':'NOT_APPROVED_LAYOUT',
       'fps':30,'duration_s':N/30,'width':plan['width'],'height':plan['height'],
       'source_plan_sha256':sha(plan_path),
       'source_vtk_renderer_sha256':sha(Path(__file__).with_name('vtk_story_renderer.py')),
       'source_state_bridge_sha256':sha(Path(__file__).with_name('vtk_state_bridge.py')),
       'shots':[{'id':s['id'],'start_frame':s['start_frame'],'end_frame':s['end_frame'],
                 'claim_ids':s['claim_ids'],'narration':s['narration'],
                 'beats':{b['label']:b['at_frame'] for b in s['beats']}} for s in plan['shots']],
       'frames':frames,
    }
    wire=canonical_bytes(timeline)
    track_path=outdir/'storm_track.js'
    track_path.write_text('/* v11 native Three.js bridge: UNAPPROVED 3D layout, source-bound. */\n'
                          'globalThis.FW_STORM_TRACK = '+wire.decode('utf-8')+';\n')
    score_path=outdir/'storm_score.js'
    score_path.write_text('''// Generated native film27 score from verified v10 shot intervals. NO APPROVED VOICE.
(function () {
  const T = globalThis.FW_STORM_TRACK;
  if (!T || T.status !== 'NOT_APPROVED_LAYOUT' || T.fps !== 30) throw Error('Invalid bridge source');
  const U = globalThis.U, FORMAT = U.pickFormat('9:16'), [W,H] = U.formatSize(FORMAT);
  const SHOTS = T.shots.map((s,i) => ({ id:s.id, i, scene:'storm_native', v:s.id,
    t0:s.start_frame/T.fps, t1:s.end_frame/T.fps,
    dur:(s.end_frame-s.start_frame)/T.fps, text:false, scrim:0, title:false,
    claim_ids:s.claim_ids, beats:s.beats }));
  const DURATION=T.duration_s;
  const VO={lines:[], voEnd:DURATION};
  const SCORE={FPS:T.fps, FORMAT, W, H, SAFE:U.safeArea(W,H), STYLE:'flat',
    DURATION, END_T:DURATION + 0.000001, VO, SHOTS, VERSES:[], markers:{},
    shotAt:t => SHOTS[Math.min(SHOTS.length-1,Math.max(0,
      SHOTS.findIndex(s => t < s.t1) < 0 ? SHOTS.length-1 : SHOTS.findIndex(s => t < s.t1)))] };
  globalThis.SCORE=SCORE;
})();
''')
    meta={'status':'UNAPPROVED_NATIVE_BRIDGE_EXPORT','frames':N,'shots':len(plan['shots']),
          'duration_s':N/30,'source_plan_sha256':sha(plan_path),
          'track_sha256':sha(track_path), 'score_sha256':sha(score_path),
          'vtk_renderer_sha256':sha(Path(__file__).with_name('vtk_story_renderer.py')),
          'state_bridge_sha256':sha(Path(__file__).with_name('vtk_state_bridge.py')),
          'native_render_verified':False,'release_approved':False}
    (outdir/'bridge_manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
    return meta


def main():
    p=argparse.ArgumentParser();p.add_argument('plan');p.add_argument('--out',required=True)
    a=p.parse_args()
    print(json.dumps(export(a.plan,a.out),indent=2))

if __name__=='__main__':main()
