#!/usr/bin/env python3
"""Create a reproducible, per-shot production manifest from a validated shot plan.

No external calls, spending or claim of production completion. All outputs are deterministic
from plan + selected inputs. Content hashes deliberately invalidate dependencies.
"""
import argparse, hashlib, json, sys
from pathlib import Path
from fw_engine import load, inspect

VERSION = 'manifest-v1'

def canon(value):
    return json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf-8')
def digest(data):
    return hashlib.sha256(data).hexdigest()
def filehash(path):
    return digest(Path(path).read_bytes())
def manifest(plan,plan_path=None,script_path=None,claims_path=None,asset_manifest=None):
    errors,warnings=inspect(plan)
    if errors: raise ValueError('Invalid shot plan: '+'; '.join(errors))
    script_sha=None
    if script_path:
        script_sha=filehash(script_path)
        approved=plan.get('approved_script_sha256')
        if approved and script_sha!=approved:
            raise ValueError('Locked narration file changed: approved_script_sha256 mismatch')
    elif plan.get('approved_script_sha256'):
        raise ValueError('Locked script hash recorded, but no script provided to verify it')
    asset_hash=filehash(asset_manifest) if asset_manifest else None
    claims_hash=filehash(claims_path) if claims_path else None
    global_inputs={
        'engine_version':VERSION, 'episode_id':plan['episode_id'],
        'script_sha256':script_sha, 'claims_sha256':claims_hash,
        'assets_sha256':asset_hash,'fps':plan['fps'],
        'resolution':[plan['width'],plan['height']],
    }
    shots=[]
    for s in plan['shots']:
        shot_blob={**global_inputs,'shot':s}
        key=digest(canon(shot_blob))
        shots.append({'id':s['id'],'frames':[s['start_frame'],s['end_frame']],
                      'medium':s['medium'],'content_key':key,
                      'visual_stage':s['visual']['stage'],
                      'claim_ids':s['claim_ids'],
                      'build_status':'NOT_BUILT','verified_output':None,
                      'next_action':'Build shot to approved scene and verify on moving video'})
    return {'schema_version':VERSION,'episode_id':plan['episode_id'],
            'global_inputs':global_inputs,'shotplan_hash':digest(canon(plan)),
            'approvals':plan['approval'], 'warnings':warnings,
            'shots':shots,'final_video_verified':False,
            'release_approved':False,
            'notice':'Manifest is a plan and cache-index, not evidence any shot or film has been rendered.'}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('shotplan');p.add_argument('--script');p.add_argument('--claims');p.add_argument('--assets');p.add_argument('--out',required=True)
    a=p.parse_args()
    try:
        m=manifest(load(a.shotplan),a.shotplan,a.script,a.claims,a.assets)
        out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
        out.write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n')
        print(json.dumps({'path':str(out),'shots':len(m['shots']),'manifest_sha256':filehash(out),'production_complete':False}))
    except Exception as e:
        print('ERROR:',e,file=sys.stderr);return 1
    return 0
if __name__=='__main__':sys.exit(main())
