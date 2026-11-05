#!/usr/bin/env python3
"""Offline, unprimed *visual* comprehension test for silent or music-only previs.

A volunteer sees no script, biblical claims, chapter labels or shotlist before
responding. Their answers download locally and are not sent to a service.
"""
from pathlib import Path
import argparse,base64,json,html


def make(video,out,mode='visual'):
    v=Path(video);out=Path(out);out.parent.mkdir(parents=True,exist_ok=True)
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
    a=argparse.ArgumentParser();a.add_argument('video');a.add_argument('--out',required=True);a=a.parse_args()
    print(json.dumps(make(a.video,a.out)))
