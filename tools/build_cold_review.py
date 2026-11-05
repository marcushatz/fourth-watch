#!/usr/bin/env python3
"""Offline, unprimed reader tests, built as one local page.

Visual mode tests comprehension of silent or music-only previs. Question mode
collects first reactions to one-line story questions before any script exists.

A volunteer sees no script, biblical claims, chapter labels or shotlist before
responding. Their answers download locally and are not sent to a service.

Question mode reads a sheet of up to three questions, such as
examples/question-sheet/storm_questions.json. Each carries a hidden tag
(answerable, inference or open), and tags and sources never reach the page, the
export or the printed result. Nothing is dropped for being open. The mode adds
no score, ranking or judge: the export holds people's own words and each
question's exact wording, which is how to match answers back to the sheet.

    python scripts/build_cold_review.py examples/question-sheet/storm_questions.json \\
        --mode question --seed 1 --out reader_1.html

Build each person their own page with their own --seed, so that no one question
always comes first. Leaving out --seed picks one and prints it.
"""
from pathlib import Path
import argparse,base64,json,html,random,secrets

TAGS=('answerable','inference','open')
MAX_QUESTIONS=3
NO_REQUESTS="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
PROMPTS=(('want','Would you want to hear the answer? Why or why not?'),
         ('guess','What do you think the answer is? A guess is fine.'))


def read_sheet(path):
    """Returns only the wording. A sheet that breaks a limit stops the build, so nothing is dropped to fit."""
    sheet=json.loads(Path(path).read_text(encoding='utf-8'))
    items=sheet.get('questions') if isinstance(sheet,dict) else None
    if not isinstance(items,list) or not 1<=len(items)<=MAX_QUESTIONS:
        raise ValueError(f'A question sheet needs 1 to {MAX_QUESTIONS} questions.')
    lines=[]
    for item in items:
        line=item.get('question') if isinstance(item,dict) else None
        if not isinstance(line,str) or len(line.strip().splitlines())!=1:
            raise ValueError(f'Each question must be one line: {line!r}')
        if item.get('tag') not in TAGS:
            raise ValueError(f'{line!r} needs a tag: {", ".join(TAGS)}.')
        lines.append(line.strip())
    if len(set(lines))<len(lines):
        raise ValueError('A question sheet cannot repeat a question.')
    return lines


def make_question_page(sheet,out,seed=None):
    lines=sorted(read_sheet(sheet))  # Sorted first, so the seed alone decides the order, not how the sheet is listed.
    seed=secrets.randbelow(2**32) if seed is None else int(seed)
    random.Random(seed).shuffle(lines)
    blocks=''.join(f'<fieldset class="q"><legend class="line">{html.escape(line)}</legend>'
                   +''.join(f'<label>{html.escape(text)}<textarea name="{key}" rows="3"></textarea></label>' for key,text in PROMPTS)
                   +'</fieldset>' for line in lines)
    markup=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <meta http-equiv="Content-Security-Policy" content="{NO_REQUESTS}"><title>Anonymous question feedback</title>
    <style>:root{{color-scheme:dark;font-family:system-ui,sans-serif;background:#101319;color:#eee}}
    body{{max-width:760px;margin:auto;padding:20px;line-height:1.5}}h1{{font-size:1.4rem}}p{{color:#b9c4cb}}
    fieldset{{border:1px solid #33404d;border-radius:6px;margin:18px 0;padding:14px}}
    legend{{float:left;width:100%;padding:0;margin-bottom:12px;font-size:1.1rem;font-weight:600}}legend+label{{clear:both}}
    textarea{{width:100%;box-sizing:border-box;background:#252d36;color:#fff;border:1px solid #536171;border-radius:6px;padding:12px;font:inherit;margin-top:6px}}
    label{{display:block;margin:16px 0}}button{{font:inherit;padding:12px;background:#d8b47e;color:#17130b;border:0;border-radius:6px;cursor:pointer}}
    .small{{font-size:.84rem}}</style></head><body>
    <h1>Short question feedback</h1>
    <p>Read each question once, then answer in your own words. There are no right or wrong answers, and you do not need to know anything about the subject.</p>
    {blocks}
    <label>Did any of these stay with you? Which one, and why? Saying none is fine.<textarea id="closing" rows="3"></textarea></label>
    <button type="button" onclick="save()">Export feedback as JSON</button>
    <p class="small">No login, tracker or upload. This file never transmits responses; send the exported file to the creator yourself if you choose.</p>
    <script>function save(){{let d={{review_type:'unprimed_question',not_an_approval:true,seed:{seed},answers:[],closing:document.getElementById('closing').value}};
      document.querySelectorAll('.q').forEach((q,i)=>{{let r={{position:i+1,question:q.querySelector('.line').textContent}};
        q.querySelectorAll('textarea').forEach(t=>r[t.name]=t.value);d.answers.push(r);}});
      let b=new Blob([JSON.stringify(d,null,2)],{{type:'application/json'}});
      let u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='anonymous_question_feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}}</script>
    </body></html>'''
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(markup,encoding='utf-8')
    return {'path':str(out),'bytes':out.stat().st_size,'unprimed':True,'network_requests':0,'questions':len(lines),'seed':seed}


def make(source,out,mode='visual',seed=None):
    if mode=='question':return make_question_page(source,out,seed)
    v=Path(source);out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    base64video=base64.b64encode(v.read_bytes()).decode('ascii')
    note=('This preview has temporary sound but no narration. Evaluate only whether the pictures tell a clear story.'
          if mode=='visual' else 'Evaluate the complete story, including words and pictures.')
    markup=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Anonymous video feedback</title>
    <style>:root{{color-scheme:dark;font-family:system-ui,sans-serif;background:#101319;color:#eee}}
    body{{max-width:760px;margin:auto;padding:20px;line-height:1.5}}h1{{font-size:1.4rem}}p{{color:#b9c4cb}}
    video{{max-height:65vh;max-width:100%;aspect-ratio:9/16;display:block;margin:14px auto;background:#000;border:1px solid #33404d}}
    textarea,input{{width:100%;background:#252d36;color:#fff;border:1px solid #536171;border-radius:6px;padding:12px;font:inherit}}
    label{{display:block;font-weight:600;margin:16px 0}}button{{font:inherit;padding:12px;background:#d8b47e;color:#17130b;border:0;border-radius:6px;cursor:pointer}}
    .small{{font-size:.84rem}}</style></head><body>
    <h1>Short video feedback</h1><p>{html.escape(note)}</p>
    <video id="v" controls playsinline src="data:video/mp4;base64,{base64video}"></video>
    <p>Watch once without reading anything about the story, then answer in your own words. There are no right or wrong answers.</p>
    <label>What did you understand happened?<textarea id="meaning" rows="3"></textarea></label>
    <label>Which visual moment was hard to understand or looked wrong?<textarea id="confusion" rows="3"></textarea></label>
    <label>Approximately when did your attention drift? Why?<textarea id="drop" rows="3"></textarea></label>
    <label>What image or moment do you remember best?<textarea id="memory" rows="3"></textarea></label>
    <label>What one change would help the most?<textarea id="suggestion" rows="3"></textarea></label>
    <button type="button" onclick="save()">Export feedback as JSON</button>
    <p class="small">No login, tracker or upload. This file never transmits responses; send the exported file to the creator yourself if you choose.</p>
    <script>function save(){{let ids=['meaning','confusion','drop','memory','suggestion'];let d={{review_type:'unprimed_{mode}',not_an_approval:true,answers:{{}}}};
      ids.forEach(k=>d.answers[k]=document.getElementById(k).value);let b=new Blob([JSON.stringify(d,null,2)],{{type:'application/json'}});
      let u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='anonymous_visual_feedback.json';a.click();URL.revokeObjectURL(u);}}</script>
    </body></html>'''
    out.write_text(markup)
    return {'path':str(out),'bytes':out.stat().st_size,'unprimed':True,'network_requests':0}

if __name__=='__main__':
    a=argparse.ArgumentParser();a.add_argument('source',help='A video, or a question sheet with --mode question')
    a.add_argument('--out',required=True);a.add_argument('--mode',choices=('visual','question'),default='visual')
    a.add_argument('--seed',type=int,help='Question order. Question mode only');a=a.parse_args()
    print(json.dumps(make(a.source,a.out,a.mode,a.seed)))
