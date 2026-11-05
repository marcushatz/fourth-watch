#!/usr/bin/env python3
"""Fourth Watch shot-plan validator and diagnostic analytics. Standard library + PyYAML.

Deliberate: no automatic 'creative scores'. Errors represent machine-detectable
contract failures; warnings require a human director to evaluate.
"""
import argparse, hashlib, json, sys
from pathlib import Path
from collections import Counter
try:
    import yaml
except ImportError:
    yaml = None

REQUIRED_SHOT = ('id','start_frame','end_frame','narration','read','medium','size','angle','camera','visual','claim_ids','beats')
MEDIUMS={'2d_character','2_5d_parallax','3d_object','motion_graphic','text_evidence'}
SIZES={'XWS','WS','MS','MCU','CU','ECU'}
ANGLES={'eye','high','low','top','ots','profile','dutch'}
MOVES={'locked','push','pull','track','pan','crane','orbit','rack','whip'}
STAGES={'PLACEHOLDER','DRAFT','FINAL'}

class PlanError(Exception): pass

def load(path):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    if p.suffix.lower()=='.json': return json.loads(s)
    if yaml is None: raise PlanError('PyYAML not installed; use JSON')
    return yaml.safe_load(s)

def inspect(plan):
    errors=[]; warnings=[]
    if not isinstance(plan,dict): return ['plan must be an object'],[]
    for field in ('schema_version','episode_id','fps','width','height','approved_script_sha256','approval','shots'):
        if field not in plan: errors.append(f'missing plan field {field}')
    if plan.get('schema_version') != '1.0': errors.append('schema_version must be 1.0')
    fps=plan.get('fps'); width=plan.get('width'); height=plan.get('height')
    if not isinstance(fps,int) or not (1<=fps<=120): errors.append('fps must be integer in 1..120')
    if not isinstance(width,int) or not isinstance(height,int) or width<=0 or height<=0: errors.append('invalid width/height')
    elif abs(width / height - 9 / 16)>.002: warnings.append('not a vertical 9:16 canvas')
    sid=plan.get('approved_script_sha256')
    if sid is not None and (not isinstance(sid,str) or len(sid)!=64 or any(c not in '0123456789abcdef' for c in sid)):
        errors.append('script hash must be null or lowercase SHA-256')
    approval=plan.get('approval')
    if not isinstance(approval,dict) or not all(isinstance(approval.get(k),bool) for k in ('script','treatment','animatic')):
        errors.append('approval.script/treatment/animatic must be booleans')
    shots=plan.get('shots')
    if not isinstance(shots,list) or not shots: return errors+['shots must be a nonempty list'],warnings
    prev_end=None; ids=set()
    for i,s in enumerate(shots):
        prefix=f'shot[{i}]'
        if not isinstance(s,dict): errors.append(prefix+' not an object'); continue
        for k in REQUIRED_SHOT:
            if k not in s: errors.append(f'{prefix} missing {k}')
        ident=s.get('id')
        if not isinstance(ident,str) or len(ident)<2: errors.append(prefix+' invalid id')
        elif ident in ids: errors.append(prefix+' duplicate id '+ident)
        ids.add(ident)
        start,end=s.get('start_frame'),s.get('end_frame')
        if not isinstance(start,int) or not isinstance(end,int): errors.append(prefix+' noninteger frames'); continue
        if end<=start: errors.append(prefix+' end must exceed start')
        if i==0 and start!=0: errors.append(prefix+' first shot must start at frame 0')
        if prev_end is not None and start!=prev_end: errors.append(f'{prefix} timeline gap/overlap: starts {start}, previous ends {prev_end}')
        prev_end=end
        if s.get('medium') not in MEDIUMS: errors.append(prefix+' invalid medium')
        if s.get('size') not in SIZES: errors.append(prefix+' invalid size')
        if s.get('angle') not in ANGLES: errors.append(prefix+' invalid angle')
        if not isinstance(s.get('read'),str) or len(s.get('read','').strip())<8: errors.append(prefix+' unclear viewer read')
        cam=s.get('camera')
        if not isinstance(cam,dict) or cam.get('move') not in MOVES: errors.append(prefix+' invalid camera')
        else:
            for k in ('start_scale','end_scale'):
                if not isinstance(cam.get(k),(int,float)) or cam.get(k,0)<=0: errors.append(prefix+' invalid camera '+k)
            if cam['move']!='locked' and not cam.get('why','').strip(): warnings.append(prefix+' camera move lacks reason')
            if cam['move']=='locked' and (cam.get('start_scale')!=cam.get('end_scale')): warnings.append(prefix+' locked camera changes scale')
        visual=s.get('visual')
        if not isinstance(visual,dict) or visual.get('stage') not in STAGES: errors.append(prefix+' invalid visual.stage')
        else:
            for k in ('setting','subject','action','key_light','mood'):
                if not isinstance(visual.get(k),str) or not visual.get(k).strip(): errors.append(prefix+' missing visual.'+k)
            if visual.get('stage')=='PLACEHOLDER': warnings.append(prefix+' placeholder, not release art')
        if not isinstance(s.get('claim_ids'),list): errors.append(prefix+' claim_ids must be list')
        beats=s.get('beats')
        if not isinstance(beats,list): errors.append(prefix+' beats must be list')
        else:
            times=[]
            for bi,b in enumerate(beats):
                if not isinstance(b,dict) or not isinstance(b.get('at_frame'),int): errors.append(prefix+f' invalid beat[{bi}]');continue
                t=b['at_frame'];times.append(t)
                if t<start or t>=end: errors.append(prefix+f' beat at {t} outside shot [{start},{end})')
                if b.get('kind') not in ('reveal','action','reaction','visual_text','light','sound','cutaway'):
                    errors.append(prefix+f' invalid beat kind [{bi}]')
            if times!=sorted(times): errors.append(prefix+' beats are not chronological')
            if not beats and fps and end-start>=6*fps: warnings.append(prefix+' long shot with no internal beats; review intentionally')
    if not (isinstance(approval,dict) and approval.get('script')): warnings.append('script not approved; production spending prohibited')
    if not (isinstance(approval,dict) and approval.get('treatment')): warnings.append('treatment not approved; assets not locked')
    if not (isinstance(approval,dict) and approval.get('animatic')): warnings.append('animatic not approved; final render prohibited')
    return errors,warnings

def stats(plan):
    shots=plan['shots']; fps=plan['fps']; n=shots[-1]['end_frame']
    sizes=Counter(s['size'] for s in shots); moves=Counter(s['camera']['move'] for s in shots)
    mediums=Counter(s['medium'] for s in shots)
    lengths=sorted((s['end_frame']-s['start_frame'])/fps for s in shots)
    b=sum(len(s['beats']) for s in shots)
    gaps=[]; time=0
    for s in shots:
        for beat in s['beats']:
            gaps.append((beat['at_frame']-time)/fps);time=beat['at_frame']
    gaps.append((n-time)/fps)
    return {'episode_id':plan['episode_id'],'seconds':round(n/fps,3),'frames':n,'fps':fps,'shots':len(shots),'median_shot_s':round((lengths[(len(lengths)-1)//2]+lengths[len(lengths)//2])/2,3),'beat_count':b,'longest_gap_between_logged_beats_s':round(max(gaps) if gaps else n/fps,2),'shot_sizes':dict(sizes),'moves':dict(moves),'mediums':dict(mediums),'approvals':plan['approval'],'note':'Diagnostics, not artistic quality scores. Beat gaps approximate only explicit events.'}

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    sub=ap.add_subparsers(dest='cmd',required=True)
    for name in ('validate','analyze'):
        p=sub.add_parser(name);p.add_argument('plan');p.add_argument('--json',action='store_true')
    args=ap.parse_args()
    try: plan=load(args.plan);errors,warnings=inspect(plan)
    except Exception as e:
        print('ERROR: '+str(e));return 2
    result={'pass':not errors,'errors':errors,'warnings':warnings}
    if not errors and args.cmd=='analyze':result['diagnostics']=stats(plan)
    if args.json: print(json.dumps(result,indent=2))
    else:
        print(('PASS' if not errors else 'FAIL')+f' | {len(errors)} error(s), {len(warnings)} warning(s)')
        for e in errors:print('ERROR',e)
        for w in warnings:print('WARN ',w)
        if 'diagnostics' in result:print(json.dumps(result['diagnostics'],indent=2))
    return int(bool(errors))

if __name__=='__main__':sys.exit(main())
