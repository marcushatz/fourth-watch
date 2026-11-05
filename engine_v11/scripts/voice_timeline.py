#!/usr/bin/env python3
"""Verify locked narration vs exact word timings and compile captions / cues.

Input words JSON: {"fps":30,"words":[{"word":"...","start":0.0,"end":0.2},...]}
Words must preserve the shotplan's concatenated narration exactly after punctuation folding.
No timestamps are estimated. No synthetic output can be treated as an approved voice.
"""
import argparse, json, re, sys, unicodedata
from pathlib import Path
from fw_engine import load, inspect

class AlignmentError(ValueError): pass

def tokens(s):
    s=unicodedata.normalize('NFKC',s).casefold().replace('’',"'")
    return re.findall(r"[\w]+(?:'[\w]+)?",s,flags=re.UNICODE)

def clock(t):
    ms=int(round(t*1000));h,r=divmod(ms,3600000);m,r=divmod(r,60000);s,ms=divmod(r,1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'

def align(plan,timeline,word_tolerance_frames=2):
    errors,_=inspect(plan)
    if errors:raise AlignmentError('shotplan invalid: '+'; '.join(errors))
    words=timeline.get('words')
    if not isinstance(words,list) or not words:raise AlignmentError('word timeline must contain nonempty words')
    fps=plan['fps']
    if timeline.get('fps')!=fps:raise AlignmentError('fps mismatch with plan')
    expected=[tok for s in plan['shots'] for tok in tokens(s['narration'])]
    actual=[]; spans=[];prior=0
    for i,w in enumerate(words):
        if not isinstance(w,dict):raise AlignmentError(f'word[{i}] invalid')
        ts=tokens(str(w.get('word','')))
        if len(ts)!=1:raise AlignmentError(f'word[{i}] must contain one spoken token')
        a=w.get('start');b=w.get('end')
        if not isinstance(a,(float,int)) or not isinstance(b,(float,int)) or a<0 or b<=a:
            raise AlignmentError(f'word[{i}] invalid timestamps')
        if a<prior-1e-5:raise AlignmentError(f'word[{i}] overlaps or is out of order')
        prior=b;actual.extend(ts);spans.append((a,b))
    if expected!=actual:
        first=next((i for i,(a,b) in enumerate(zip(expected,actual)) if a!=b),min(len(expected),len(actual)))
        raise AlignmentError(f'narration mismatch at token {first}: expected {expected[first:first+6]} vs voice {actual[first:first+6]} (totals {len(expected)}/{len(actual)})')
    shot_to_words=[];idx=0;total_end=plan['shots'][-1]['end_frame']
    for s in plan['shots']:
        n=len(tokens(s['narration']));chosen=words[idx:idx+n];idx+=n
        if not chosen:raise AlignmentError(f'{s["id"]} has no timed words')
        start=round(chosen[0]['start']*fps);end=round(chosen[-1]['end']*fps)
        if start<s['start_frame']-word_tolerance_frames or end>s['end_frame']+word_tolerance_frames:
            raise AlignmentError(f'{s["id"]} narration time [{start},{end}] frames exceeds shot [{s["start_frame"]},{s["end_frame"]}]; edit shotplan or voice, never silently stretch')
        shot_to_words.append({'id':s['id'],'start_frame':start,'end_frame':end,'first_word':idx-n,'last_word':idx-1})
    if words[-1]['end']*fps>total_end+word_tolerance_frames:
        raise AlignmentError('voice ends beyond the film')
    return {'status':'ALIGNED_UNAPPROVED_UNLESS_SEPARATELY_APPROVED','fps':fps,'words':len(words),'shots':shot_to_words,'max_end_seconds':words[-1]['end'],'script_hash':plan.get('approved_script_sha256')}

def captions(timeline,max_words=6,max_duration=2.8,max_pause=0.3):
    words=timeline['words'];out=[];group=[]
    def flush():
        nonlocal group
        if group:
            out.append({'start':group[0]['start'],'end':group[-1]['end'],'text':' '.join(w['word'] for w in group)})
            group=[]
    for w in words:
        if group and (len(group)>=max_words or w['end']-group[0]['start']>max_duration or w['start']-group[-1]['end']>max_pause):flush()
        group.append(w)
        if re.search(r'[.!?]$',str(w['word'])):flush()
    flush();return out

def to_srt(cues):
    return '\n'.join(f"{i}\n{clock(x['start'])} --> {clock(x['end'])}\n{x['text']}\n" for i,x in enumerate(cues,1))

def compile_cues(plan,timeline):
    result=align(plan,timeline);fps=plan['fps'];cues=[];shots=plan['shots']
    for s in shots:
        for b in s['beats']:
            cues.append({'frame':b['at_frame'],'seconds':round(b['at_frame']/fps,4),'shot':s['id'],'kind':b['kind'],'label':b.get('label','')})
    return {'alignment':result,'cues':sorted(cues,key=lambda x:x['frame']),'subtitles':captions(timeline)}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('shotplan');p.add_argument('words_json');p.add_argument('--out-dir',required=True)
    a=p.parse_args();out=Path(a.out_dir)
    try:
        plan=load(a.shotplan);timeline=json.loads(Path(a.words_json).read_text());r=compile_cues(plan,timeline)
        out.mkdir(parents=True,exist_ok=True)
        (out/'alignment.json').write_text(json.dumps(r['alignment'],indent=2)+'\n')
        (out/'visual_sound_cues.json').write_text(json.dumps(r['cues'],indent=2)+'\n')
        (out/'captions.srt').write_text(to_srt(r['subtitles']))
        print(json.dumps({'aligned':True,'words':r['alignment']['words'],'shots':len(r['alignment']['shots']),'captions':len(r['subtitles']),'out_dir':str(out)}))
    except Exception as e:
        print('ALIGNMENT FAILED:',e,file=sys.stderr);return 2
    return 0
if __name__=='__main__':sys.exit(main())
