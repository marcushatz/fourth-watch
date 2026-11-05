#!/usr/bin/env python3
"""Safe, lossless shotplan -> legacy-renderer handoff.

Writes a *blueprint*, never modifies score.js or scene modules. Legacy compiler requires
word timings and concrete set/rig variants not present in the candidate shotplan.
This adapter surfaces those needs instead of silently inventing mappings.
"""
import argparse,json,sys
from pathlib import Path
from fw_engine import load,inspect

def convert(plan):
    errors,_=inspect(plan)
    if errors:raise ValueError('invalid source plan: '+'; '.join(errors))
    fps=plan['fps'];out=[]
    for s in plan['shots']:
        st=s['start_frame'];en=s['end_frame'];cam=s['camera']
        out.append({
            'id':s['id'], 'source_frame_range':[st,en],
            'source_seconds':[round(st/fps,5),round(en/fps,5)],
            'narration_exact':s['narration'],
            'viewer_read':s['read'],
            'legacy_fields':{'size':s['size'].lower(),'angle':s['angle'],
                             'cam':{'move':'still' if cam['move']=='locked' else cam['move'],
                                    'start_scale':cam['start_scale'],'end_scale':cam['end_scale'],
                                    'why':cam.get('why','')},
                             'act':s['visual']['action'],'change':s['visual'].get('mood',''),
                             'beats':[{**b,'seconds':round(b['at_frame']/fps,5)} for b in s['beats']]},
            'production_dependencies':{
                'set_variant':'UNRESOLVED: map visual.setting to an existing scene or implement new',
                'rig_actions':'UNRESOLVED: translate visual.action into built character/prop states',
                'voice_word_cues':'UNRESOLVED: match narration to approved word-timed vo.js',
                'picture_render':'UNRESOLVED: connect composition and camera to scene code'},
            'claim_ids':s['claim_ids'],
            'not_compiled':True
        })
    return {'schema_version':'legacy-handoff-v1','status':'BLUEPRINT_ONLY',
        'source_episode':plan['episode_id'],'fps':fps,'shot_count':len(out),
        'no_legacy_files_modified':True,
        'shots':out,'integration_warning':'Do not pass to compile_spec.py directly; complete dependency mapping and word-timing adapters first.'}

def verify(source,converted):
    s=source['shots'];d=converted['shots'];errs=[]
    if len(s)!=len(d):errs.append('shot count changed')
    for a,b in zip(s,d):
        for k,v in [('id',a['id']),('source_frame_range',[a['start_frame'],a['end_frame']]),('narration_exact',a['narration']),('claim_ids',a['claim_ids'])]:
            if b.get(k)!=v:errs.append(f'{a["id"]} corrupt {k}')
        if len(a['beats'])!=len(b['legacy_fields']['beats']):errs.append(f'{a["id"]} beat count changed')
    return errs

def main():
    p=argparse.ArgumentParser();p.add_argument('shotplan');p.add_argument('--out',required=True);a=p.parse_args()
    try:
        s=load(a.shotplan);out=convert(s);errs=verify(s,out)
        if errs:raise ValueError('; '.join(errs))
        f=Path(a.out);f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
        print(json.dumps({'status':out['status'],'path':str(f),'shots':len(out['shots']),'preservation_errors':errs}))
    except Exception as e:print('ERROR:',e,file=sys.stderr);return 1
    return 0
if __name__=='__main__':sys.exit(main())
