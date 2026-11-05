#!/usr/bin/env python3
"""Block release when project approval/evidence/cost requirements are unmet."""
import argparse,csv,hashlib,json,sys,re
from pathlib import Path
try:import yaml
except ImportError:yaml=None
sys.path.insert(0,str(Path(__file__).parent))
from fw_engine import inspect,load

RELEASE_STATES={'TEXT','INFERRED','INTERPRETATION','HISTORICAL','VISUAL_SYMBOL'}
REQUIRED_ASSET={'name','origin','license','sha256'}

def audit(plan,claims_path=None,manifest_path=None,video_path=None):
    errors,warnings=inspect(plan)
    if not claims_path:
        errors.append('claim ledger missing')
    else:
        p=Path(claims_path)
        if not p.is_file():errors.append('claim ledger not found')
        else:
            with p.open(newline='') as f:claims=list(csv.DictReader(f))
            ledger={c.get('id'):c for c in claims}
            used={c for shot in plan.get('shots',[]) for c in shot.get('claim_ids',[])}
            for cid in sorted(used):
                if cid not in ledger:errors.append('unresolved claim id: '+cid)
                elif ledger[cid].get('kind') not in RELEASE_STATES:errors.append('unsupported claim: '+cid)
                elif not ledger[cid].get('scripture') and not ledger[cid].get('support_summary'):errors.append('no evidential basis: '+cid)
            for unused in set(ledger)-used:warnings.append('unused claim ledger entry '+unused)
    for i,shot in enumerate(plan.get('shots',[])):
        stage=shot.get('visual',{}).get('stage')
        if stage != 'FINAL':errors.append(f"shot {shot.get('id',i)} is {stage}, not final art")
        if not shot.get('claim_ids'):
            warnings.append(f"shot {shot.get('id',i)} has no provenance claim ID; verify depiction or mark as purely symbolic")
    for gate in ('script','treatment','animatic'):
        if not plan.get('approval',{}).get(gate):errors.append('unapproved gate: '+gate)
    if plan.get('approved_script_sha256') is None:errors.append('no locked script SHA-256')
    if not manifest_path:errors.append('asset manifest missing')
    elif not Path(manifest_path).is_file():errors.append('asset manifest not found')
    else:
        try:
            items=json.loads(Path(manifest_path).read_text())
            if not isinstance(items,list):errors.append('asset manifest must be list')
            else:
                for i,v in enumerate(items):
                    for key in REQUIRED_ASSET:
                        if not v.get(key):errors.append(f'asset {i} missing {key}')
                    if v.get('license') in ('unknown','unverified','none'):errors.append(f'asset {i} rights unresolved')
                    if v.get('paid') and not v.get('approval_id'):errors.append(f'asset {i} paid without approval ID')
                    ah=v.get('sha256','')
                    if ah and not re.fullmatch(r'[0-9a-f]{64}',str(ah)):
                        errors.append(f'asset {i} has malformed sha256')
                    if v.get('path'):
                        f=Path(v['path'])
                        if not f.is_file():errors.append(f'asset {i} missing local file')
                        elif ah and hashlib.sha256(f.read_bytes()).hexdigest()!=ah:
                            errors.append(f'asset {i} hash mismatch')
        except Exception as e:errors.append('invalid asset manifest: '+str(e))
    if not video_path:errors.append('final video missing')
    elif not Path(video_path).is_file():errors.append('final video not found')
    else:
        # Release requires a decodable full-resolution audiovisual master, not an animatic.
        try:
            from qa_video import ffprobe
            m=ffprobe(video_path)
            vs=next((x for x in m.get('streams',[]) if x.get('codec_type')=='video'),None)
            au=next((x for x in m.get('streams',[]) if x.get('codec_type')=='audio'),None)
            if not vs:errors.append('release video has no video stream')
            else:
                w,h=int(vs['width']),int(vs['height'])
                if w<1080 or h<1920 or abs(w/h-9/16)>.002:errors.append('master must be full-resolution vertical 1080x1920 or better')
            if not au:errors.append('release master has no audio')
            dur=float(m.get('format',{}).get('duration',0))
            expect=plan.get('shots',[])[-1]['end_frame']/plan['fps']
            if abs(dur-expect)>0.5:errors.append(f'video duration mismatch ({dur:.2f}s vs {expect:.2f}s plan)')
        except Exception as e:errors.append('release master could not be verified: '+str(e))
    # Artistic and publishing approval are always external and cannot be inferred by file creation.
    warnings.append('Creator must personally review finished audiovisual film and explicitly approve publishing; this tool cannot grant permission')
    return {'release_package_preflight_pass':not errors,'errors':errors,'warnings':warnings}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('shotplan');parser.add_argument('--claims');parser.add_argument('--manifest');parser.add_argument('--video');parser.add_argument('--out')
    args=parser.parse_args();p=load(args.shotplan);r=audit(p,args.claims,args.manifest,args.video)
    raw=json.dumps(r,indent=2);print(raw)
    if args.out:Path(args.out).write_text(raw+'\n')
    return 0 if r['release_package_preflight_pass'] else 1
if __name__=='__main__':sys.exit(main())
