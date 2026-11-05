#!/usr/bin/env python3
"""Audits local engine package before distribution.
Checks that promised files, skill frontmatter, sample outputs and commands exist.
"""
import argparse,json,re,subprocess,sys,hashlib
from pathlib import Path
import yaml

ROOT=Path(__file__).resolve().parents[1]
MANDATORY=[
    '.claude/skills/fourth-watch-engine/SKILL.md',
    '.claude/skills/fourth-watch-engine/references/story-and-script.md',
    '.claude/skills/fourth-watch-engine/references/director-and-camera.md',
    '.claude/skills/fourth-watch-engine/references/voice-and-sound.md',
    'docs/TECHNICAL_ARCHITECTURE.md', 'docs/ENGINE_LIMITATIONS.md',
    'examples/pilot-storm/shotplan.yaml','examples/pilot-storm/claims.csv',
    'outputs/v10/verified_3d_review/01_3d_layout_silent.mp4',
    'outputs/v10/verified_3d_review/06_director_review.html',
    'outputs/v10/verified_3d_review/07_production_manifest.json',
    'native_three/storm_native.js','native_three/storm_track.js',
    'native_three/storm_score.js','native_three/bridge_manifest.json',
]

def audit():
    errors=[];warnings=[];found={}
    for name in MANDATORY:
        p=ROOT/name
        if not p.is_file():errors.append('Missing '+name)
        else:found[name]={'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    skill=ROOT/'.claude/skills/fourth-watch-engine/SKILL.md'
    if skill.exists():
        text=skill.read_text()
        m=re.match(r'^---\s*\n(.*?)\n---\s*\n',text,re.S)
        if not m:errors.append('Skill lacks valid YAML frontmatter')
        else:
            front=yaml.safe_load(m.group(1))
            if front.get('name')!='fourth-watch-engine':errors.append('Incorrect name frontmatter')
            if not front.get('description'):errors.append('No description frontmatter')
            if len(front.get('description',''))>1024:warnings.append('Description exceeds recommended length')
        refs=set(re.findall(r'references/[\w-]+\.md',text))
        for ref in refs:
            if not (skill.parent/ref).exists():errors.append('Broken skill reference: '+ref)
    video=ROOT/'outputs/v10/verified_3d_review/01_3d_layout_silent.mp4'
    if video.exists():
        proc=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(video)],capture_output=True,text=True)
        if proc.returncode:errors.append('Video unprobeable')
        elif abs(float(proc.stdout.strip())-48)>0.05:errors.append('Video duration not 48.0s')
    mfile=ROOT/'outputs/v10/verified_3d_review/07_production_manifest.json'
    if mfile.exists():
        m=json.loads(mfile.read_text())
        if m.get('final_video_verified') is not False:errors.append('Production falsely marked verified')
    # v10 original movie must still be bound to the *unchanged* source and plan.
    if video.exists():
        try:
            from preview_3d_pipeline import validate_renderer_provenance
            from fw_engine import load
            validate_renderer_provenance(video, load(ROOT/'examples/pilot-storm/shotplan.yaml'), ROOT/'scripts/vtk_story_renderer.py')
        except Exception as e:errors.append('v10 movie provenance failed: '+str(e))
    bridge=ROOT/'native_three/bridge_manifest.json'
    if bridge.exists():
        m=json.loads(bridge.read_text())
        if m.get('native_render_verified') is not False or m.get('release_approved') is not False:
            errors.append('Native scene or release falsely marked approved')
        for key,path in [('track_sha256',ROOT/'native_three/storm_track.js'),
                         ('score_sha256',ROOT/'native_three/storm_score.js'),
                         ('vtk_renderer_sha256',ROOT/'scripts/vtk_story_renderer.py'),
                         ('state_bridge_sha256',ROOT/'scripts/vtk_state_bridge.py')]:
            if m.get(key)!=hashlib.sha256(path.read_bytes()).hexdigest():
                errors.append('Bridge source hash mismatch: '+key)
    hashes=ROOT/'PACKAGE_SHA256SUMS.txt'
    if hashes.exists():
        for line in hashes.read_text().splitlines():
            expected, sep, name=line.partition('  ')
            f=ROOT/name
            if not sep or not f.is_file():errors.append('Manifest item missing: '+name);continue
            if hashlib.sha256(f.read_bytes()).hexdigest()!=expected:errors.append('Tampered package item: '+name)
    return {'pass':not errors,'errors':errors,'warnings':warnings,'checked_files':found,
            'limits':'This is a reproducibility/packaging audit, not artistic or theological verification.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--out');a=p.parse_args()
    r=audit();s=json.dumps(r,indent=2)
    print(s)
    if a.out:Path(a.out).write_text(s+'\n')
    return int(not r['pass'])
if __name__=='__main__':sys.exit(main())
