#!/usr/bin/env python3
"""Build a local HTML review room: script/storyboard timeline + video + claim trace.

Uses only file paths already available. Doesn't claim a shot is art-complete.
"""
from pathlib import Path
import argparse,csv,html,json,base64,sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fw_engine import load,inspect,stats

STYLE='''
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f2e6cf;background:#14100d}*{box-sizing:border-box}body{margin:0;line-height:1.45}header{padding:25px 5vw;border-bottom:1px solid #4d4032;background:#1b1714}h1{font-family:Georgia,serif;font-size:28px;font-weight:500;margin:0 0 8px}h2{font-size:18px}p{color:#bdb0a2}a{color:#e3b25c}.wrap{max-width:1370px;margin:auto;padding:22px 4vw}.layout{display:grid;grid-template-columns:minmax(260px,390px) minmax(0,1fr);gap:25px}.player{position:sticky;top:18px;align-self:start}.player video{width:100%;aspect-ratio:9/16;max-height:68vh;background:#090c11;border-radius:12px;border:1px solid #55402a}.hint{font-size:12px;color:#a49b8f}.chips{display:flex;gap:6px;flex-wrap:wrap}.chip{font-size:11px;border:1px solid #6b5134;color:#e3b25c;border-radius:12px;padding:3px 8px}.shots{display:grid;gap:12px}.shot{background:#201c19;border:1px solid #42392d;border-radius:10px;padding:14px;cursor:pointer;transition:border .1s}.shot:hover,.shot.active{border-color:#e3b25c}.shothead{display:flex;justify-content:space-between;gap:12px}.id{font-family:monospace;color:#e3b25c}.timing{font-family:monospace;font-size:12px;color:#b6a388}.read{font-size:15px;font-weight:600;margin:7px 0;color:#fbf4e7}.meta{font-size:12px;color:#af9f8b;margin:5px 0}.narr{font-family:Georgia,serif;font-size:16px;margin:10px 0;color:#eee1d0}.warn{color:#edba72}.row{border-bottom:1px solid #3e332b;padding:8px 0}input[type=checkbox]{accent-color:#e3b25c}button{color:#f5e9d1;background:#59402b;border:1px solid #8f683b;border-radius:7px;padding:8px 11px;cursor:pointer}.tools{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0}.panel{border:1px solid #4d4032;background:#1b1714;border-radius:9px;padding:14px;margin-bottom:16px}code{color:#e4ba79}summary{cursor:pointer}.timestamp{background:none;border:none;color:#e3b25c;padding:0;text-decoration:underline}@media(max-width:840px){.layout{display:block}.player{position:static;max-width:350px;margin:auto}.shots{margin-top:20px}}'''

def make(plan_path,video_path,out,claims_path=None,qa_path=None,embed=False,kind='animatic'):
    plan=load(plan_path);errors,warnings=inspect(plan)
    if errors:raise ValueError('Invalid plan: '+'; '.join(errors))
    fps=plan['fps'];shotdata=[]
    for s in plan['shots']:
        sec=round(s['start_frame']/fps,3);end=round(s['end_frame']/fps,3)
        shotdata.append({**s,'start_sec':sec,'end_sec':end})
    out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
    if embed:
        encoded=base64.b64encode(Path(video_path).read_bytes()).decode('ascii')
        videosrc='data:video/mp4;base64,'+encoded
    else:
        videosrc=Path(video_path).resolve().as_uri()
    metadata=stats(plan)
    claimtable={}
    if claims_path:
        with open(claims_path,newline='') as f:
            for r in csv.DictReader(f):claimtable[r['id']]=r
    rows=[]
    for s in shotdata:
        text=html.escape(s['narration']);read=html.escape(s['read']);slug=html.escape(s['id']);t=s['start_sec'];end=s['end_sec']
        b=', '.join(f"{(v['at_frame']-s['start_frame'])/fps:.1f}s {html.escape(v['kind'])}: {html.escape(v['label'])}" for v in s['beats'])
        refs=', '.join(html.escape(x) for x in s['claim_ids'])
        claimnotes=[]
        for cid in s['claim_ids']:
            c=claimtable.get(cid)
            if c:claimnotes.append(html.escape(cid+': '+c['scripture']+' — '+c['support_summary']))
            else:claimnotes.append('MISSING CLAIM '+html.escape(cid))
        rows.append(f'''<section class="shot" id="shot-{slug}" onclick="seek({t},'{slug}')"><div class="shothead"><span class="id">{slug}</span><span class="timing">{t:.2f}–{end:.2f}s</span></div><div class="read">{read}</div><p class="narr">{text}</p><div class="chips"><span class="chip">{html.escape(s['size'])} / {html.escape(s['angle'])}</span><span class="chip">{html.escape(s['medium'])}</span><span class="chip">{html.escape(s['camera']['move'])}</span><span class="chip">{html.escape(s['visual']['stage'])}</span></div><p class="meta">Camera intention: {html.escape(s['camera']['why'])}</p><p class="meta">Picture action: {html.escape(s['visual']['action'])}</p><details><summary>Visual beats and source claims</summary><p class="meta">{b}</p><p class="meta">{refs}</p><p class="meta">{' | '.join(claimnotes)}</p></details></section>''')
    warnhtml=''.join(f'<div class="row">{html.escape(x)}</div>' for x in warnings)
    qall=''
    if qa_path and Path(qa_path).is_file():
        qa=json.loads(Path(qa_path).read_text())
        qall='<pre style="overflow:auto;font-size:11px;color:#c6b8a1">'+html.escape(json.dumps({k:qa.get(k) for k in ['duration_s','resolution','video_fps_est','audio_codec','warnings','technical_pass']},indent=2))+'</pre>'
    hint = ('Low-resolution real 3D layout, not final character art or approved narration.' if kind=='3d_layout'
            else 'A placeholder animatic; not final 3D, character acting or audio.')
    content=f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fourth Watch | Director Review</title><style>{STYLE}</style></head><body><header><h1>Fourth Watch · Director's Review</h1><div class="chips"><span class="chip">{html.escape(plan['episode_id'])}</span><span class="chip">{metadata['seconds']} s</span><span class="chip">{len(shotdata)} shots</span><span class="chip">{metadata['beat_count']} logged beats</span><span class="chip">UNAPPROVED PREVIS</span></div></header><div class="wrap"><div class="layout"><aside class="player"><video id="video" controls playsinline preload="metadata" src="{videosrc}"></video><p class="hint">{html.escape(hint)} Click a shot to seek.</p><div class="panel"><h2>Approval gates</h2><div class="row">Script: {'approved' if plan['approval']['script'] else 'NOT APPROVED'}</div><div class="row">Visual treatment: {'approved' if plan['approval']['treatment'] else 'NOT APPROVED'}</div><div class="row">Animatic: {'approved' if plan['approval']['animatic'] else 'NOT APPROVED'}</div><p class="warn">No external paid generation or publishing is authorized.</p></div><div class="panel"><h2>Technical diagnostics</h2>{qall or '<p>No technical QA report.</p>'}</div><div class="panel"><h2>Director’s manual checks</h2><label><input type="checkbox"> Understood without audio?</label><br><label><input type="checkbox"> No invented biblical claims?</label><br><label><input type="checkbox"> Each big move has a reason?</label><br><label><input type="checkbox"> Characters show cause and consequence?</label><br><label><input type="checkbox"> Text readable at phone size?</label><br><label><input type="checkbox"> Script payoff is substantial?</label><p class="hint">Checkboxes are local review aids only; they never grant approval.</p></div></aside><main><h2>Storyboard timeline</h2><p>Shots carry semantic intent and source claims. Timing, readability and story quality must be judged separately.</p><div class="shots">{''.join(rows)}</div><section class="panel" style="margin-top:18px"><h2>First-time viewer review (not an AI score)</h2><p>Watch the clip before opening the storyboard. Responses stay in your browser until you export them. Nothing is uploaded.</p><div class="row"><label>What do you think this video is about?<textarea id="fw-meaning" rows="3" style="display:block;width:100%;color:#eee;background:#302820;border:1px solid #755c43;border-radius:6px;padding:8px"></textarea></label></div><div class="row"><label>When did you first feel confused or tempted to leave? (seconds / reason)<textarea id="fw-drop" rows="3" style="display:block;width:100%;color:#eee;background:#302820;border:1px solid #755c43;border-radius:6px;padding:8px"></textarea></label></div><div class="row"><label>Which moment stayed with you?<textarea id="fw-memory" rows="3" style="display:block;width:100%;color:#eee;background:#302820;border:1px solid #755c43;border-radius:6px;padding:8px"></textarea></label></div><div class="row"><label>Did the ending deliver something meaningful? Why?<textarea id="fw-end" rows="3" style="display:block;width:100%;color:#eee;background:#302820;border:1px solid #755c43;border-radius:6px;padding:8px"></textarea></label></div><button onclick="exportFeedback()">Export anonymous feedback (JSON)</button><p class="hint">Human feedback is evidence of this individual's experience, not proof of future retention or popularity.</p></section><details class="panel" style="margin-top:17px"><summary>Plan warnings ({len(warnings)})</summary>{warnhtml}</details></main></div></div><script>function exportFeedback(){{const f={{episode:{json.dumps(plan['episode_id'])},meaning:document.getElementById('fw-meaning').value,first_drop:document.getElementById('fw-drop').value,remembered:document.getElementById('fw-memory').value,ending:document.getElementById('fw-end').value}};const b=new Blob([JSON.stringify(f,null,2)],{{type:'application/json'}});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='fourth-watch-anonymous-review.json';a.click();URL.revokeObjectURL(u);}};function seek(t,id){{let v=document.querySelector('#video');v.currentTime=t;v.play().catch(()=>{{}});document.querySelectorAll('.shot').forEach(x=>x.classList.toggle('active',x.id==='shot-'+id));}};</script></body></html>'''
    out.write_text(content,encoding='utf-8')
    print(json.dumps({'review_html':str(out),'size_bytes':out.stat().st_size,'embedded':embed,'shots':len(rows)}))

def main():
    p=argparse.ArgumentParser();p.add_argument('shotplan');p.add_argument('video');p.add_argument('--out',required=True);p.add_argument('--claims');p.add_argument('--qa');p.add_argument('--embed',action='store_true');p.add_argument('--kind',choices=['animatic','3d_layout'],default='animatic');a=p.parse_args();make(a.shotplan,a.video,a.out,a.claims,a.qa,a.embed,a.kind)
if __name__=='__main__':main()
