#!/usr/bin/env python3
"""State machine for in-progress Fourth Watch episodes. Never auto-approves gates.

This manages local project metadata, *not* remote user consent, payment authorization,
or publishing. Only creator-provided approvals should be recorded through human review.
"""
import argparse, datetime, json, sys
from pathlib import Path

STATES=['BRIEF','RESEARCHED','SCRIPT_PROPOSED','SCRIPT_APPROVED',
        'TREATMENT_PROPOSED','TREATMENT_APPROVED','ANIMATIC_READY',
        'ANIMATIC_APPROVED','ASSETS_READY','VOICE_APPROVED',
        'RENDER_READY','QA_PASSED','RELEASE_APPROVED']
GATED={'SCRIPT_APPROVED':'script','TREATMENT_APPROVED':'treatment',
       'ANIMATIC_APPROVED':'animatic','VOICE_APPROVED':'voice',
       'RELEASE_APPROVED':'release'}

def advance(current,target,creator_approval=False):
    if current not in STATES or target not in STATES:raise ValueError('unknown state')
    if STATES.index(target)!=STATES.index(current)+1:
        raise ValueError(f'Cannot jump {current} -> {target}; complete and verify intermediary stages')
    if target in GATED and not creator_approval:
        raise ValueError(f'{target} needs an explicit approval decision: {GATED[target]}')
    return target

def main():
    p=argparse.ArgumentParser();p.add_argument('statefile');p.add_argument('target',choices=STATES);p.add_argument('--creator-approved',action='store_true');p.add_argument('--evidence',default='');p.add_argument('--decision-id',default='')
    a=p.parse_args();f=Path(a.statefile)
    old=json.loads(f.read_text()) if f.exists() else {'state':'BRIEF','history':[]}
    try:
        if a.creator_approved and (not a.decision_id or not a.evidence):
            raise ValueError('Approval record requires external decision ID and evidence text')
        nextstate=advance(old['state'],a.target,a.creator_approved)
        old['history'].append({'from':old['state'],'to':nextstate,'timestamp':datetime.datetime.now(datetime.timezone.utc).isoformat(),
                               'approval_declared':a.creator_approved,'decision_id':a.decision_id or None,'evidence':a.evidence or None})
        old['state']=nextstate
        f.parent.mkdir(parents=True,exist_ok=True);f.write_text(json.dumps(old,indent=2)+'\n')
        print(f'{nextstate} recorded (local record; not an independent authentication of consent)')
    except (ValueError,KeyError) as e:
        print('BLOCKED:',e,file=sys.stderr);return 1
    return 0
if __name__=='__main__':sys.exit(main())
