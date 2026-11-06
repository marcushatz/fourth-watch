#!/usr/bin/env python3
"""Build the side-by-side style test page from frames/. Images are embedded, so the page is one file."""
import base64
import html
import io
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
MOMENTS = [
    ("hook", "Shot 2", "why did he make you?", "Scale. Does one small person stop the scroll?"),
    ("giving", "Shot 13", "She gives some to Adam, and he eats.", "Two people, hands and color. Does Eden feel beautiful?"),
    ("hiding", "Shots 15 to 18", "they hear God walking in the garden, and they hide.", "Fear, and God shown without drawing a man."),
    ("face", "Shot 29", "He wanted them.", "How much face do you want to see?"),
    ("moment", "Shot 27", "They're \"Where are you?\"", "The most important frame in the film."),
]
STYLES = [
    ("char", "Charcoal", "Serious and raw. Black charcoal and white chalk on grey paper.",
     [("Faces", "Simple, drawn in lines"), ("Eden", "No color, so it can't feel beautiful then turn cold"), ("Movement", "Moderate. The drawn grain can move, which hides simple animation"), ("On a phone", "Strong in dark scenes, heavy in Eden"), ("Risk", "Grim over two minutes"), ("Closest to", "AI 1, without the black silhouettes you already rejected")]),
    ("paper", "Cut Paper", "Warm and clear. Stacked paper shapes with real shadows.",
     [("Faces", "Very simple, one dot for an eye"), ("Eden", "Bright first, then blue and dark"), ("Movement", "Easiest. Stop-motion paper puppets are allowed to move simply"), ("On a phone", "Clearest of the four"), ("Risk", "Could feel young if the writing weren't this serious"), ("Closest to", "AI 2")]),
    ("paint", "Painted", "Rich and cinematic. Soft light and visible brush strokes.",
     [("Faces", "Most human and most emotional"), ("Eden", "Lush first, then cold and dark"), ("Movement", "Hardest. Stiff animation shows most here, so it may need more AI clips"), ("On a phone", "Strong"), ("Risk", "The most common look, and the most credits"), ("Closest to", "AI 3")]),
    ("ink", "Engraving", "Sacred and unusual. Every tone is made of lines, like an old Bible print.",
     [("Faces", "Drawn in fine lines"), ("Eden", "No green, but gold really stands out"), ("Movement", "Moderate, but the lines must stay stable"), ("On a phone", "Fine lines can shimmer after compression, so this needs a test"), ("Risk", "Could feel old or distant"), ("Closest to", "None. This is my extra option, and the hardest to copy")]),
]


def src(style, moment):
    buffer = io.BytesIO()
    Image.open(HERE / "frames" / f"{style}_{moment}.jpg").resize((540, 960), Image.LANCZOS).save(buffer, "JPEG", quality=80, optimize=True)
    data = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/jpeg;base64,{data}"


URI = {(s[0], m[0]): src(s[0], m[0]) for s in STYLES for m in MOMENTS}
e = html.escape


def figure(style, moment, caption):
    return f'<figure><img src="{URI[(style[0], moment[0])]}" alt="{e(style[1])} version of {e(moment[1])}" loading="lazy"><figcaption>{e(caption)}</figcaption></figure>'


by_moment = "".join(
    f'<section class="block"><div class="head"><h3>{e(m[1])}</h3><p class="line">{e(m[2])}</p><p class="test">{e(m[3])}</p></div><div class="row four">{"".join(figure(s, m, s[1]) for s in STYLES)}</div></section>'
    for m in MOMENTS)
by_style = "".join(
    f'<section class="block"><div class="head"><h3>{e(s[1])}</h3><p class="test">{e(s[2])}</p></div><div class="row five">{"".join(figure(s, m, m[1]) for m in MOMENTS)}</div></section>'
    for s in STYLES)
cards = "".join(
    f'<section class="card"><h3>{e(s[1])}</h3><p class="test">{e(s[2])}</p><dl>{"".join(f"<dt>{e(k)}</dt><dd>{e(v)}</dd>" for k, v in s[3])}</dl></section>'
    for s in STYLES)

PAGE = f"""<title>Fourth Watch Style Test</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Source+Sans+3:wght@400;600&display=swap">
<style>
/* Layout: a review table. Same frames in the same order, so the eye compares across a row. */
:root{{--bg:#e4e1da;--sheet:#f5f3ee;--fg:#191613;--muted:#5f574e;--line:#c8c2b7;--accent:#8a5f12;
  --title:"Cinzel",Georgia,serif;--verse:"Cormorant Garamond",Georgia,serif;--body:"Source Sans 3",system-ui,sans-serif}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#14110f;--sheet:#1f1b18;--fg:#f0e9dc;--muted:#ad a296;--line:#39322c;--accent:#e3b25c;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#14110f;--sheet:#1f1b18;--fg:#f0e9dc;--muted:#ada296;--line:#39322c;--accent:#e3b25c;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{background:var(--bg);color:var(--fg);font:17px/1.5 var(--body)}}
main{{max-width:1120px;margin:0 auto;padding-block:30px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:34px}}
h1{{font:700 clamp(30px,5.4vw,44px)/1.12 var(--title);margin:0;text-wrap:balance}}
h2{{font:600 23px/1.2 var(--title);margin:0}}
h3{{font:600 19px/1.25 var(--title);margin:0}}
.lead{{margin:12px 0 0;max-width:64ch}}
.bar{{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px}}
.switch{{display:inline-flex;border:1px solid var(--line);border-radius:6px;overflow:hidden}}
.switch button{{font:600 15px/1 var(--body);color:var(--muted);background:transparent;border:0;padding:10px 14px;cursor:pointer}}
.switch button[aria-pressed="true"]{{background:var(--fg);color:var(--bg)}}
.switch button:focus-visible{{outline:2px solid var(--accent);outline-offset:-2px}}
.stack{{display:grid;gap:30px}}
.block{{display:grid;gap:12px}}
.head{{display:grid;gap:2px;border-top:2px solid var(--fg);padding-top:10px}}
.line{{font:italic 500 23px/1.2 var(--verse);margin:0}}
.test{{color:var(--muted);margin:0;font-size:16px}}
.row{{display:grid;gap:10px}}
.four{{grid-template-columns:repeat(4,minmax(0,1fr))}}
.five{{grid-template-columns:repeat(5,minmax(0,1fr))}}
figure{{margin:0;min-width:0}}
figure img{{display:block;width:100%;height:auto;aspect-ratio:9/16;object-fit:cover;border-radius:3px}}
figcaption{{font-size:14px;color:var(--muted);margin-top:5px}}
.cards{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}}
.card{{background:var(--sheet);border:1px solid var(--line);border-radius:4px;padding:14px;min-width:0;display:grid;gap:8px;align-content:start}}
dl{{margin:0;display:grid;gap:2px}}
dt{{font-size:13px;color:var(--muted);margin-top:7px}}
dd{{margin:0;font-size:16px;line-height:1.35}}
@media (max-width:860px){{.cards{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
@media (max-width:620px){{.four{{grid-template-columns:repeat(2,minmax(0,1fr))}}.five{{grid-template-columns:repeat(3,minmax(0,1fr))}}.cards{{grid-template-columns:minmax(0,1fr)}}}}
</style>
<main>
<header>
  <h1>Four styles, same five moments</h1>
  <p class="lead">Every frame uses the same shots, so you're comparing the design only. I built these in code for free. Final art would hold more detail, so judge the feeling and the clarity, not the polish.</p>
</header>
<section class="stack" aria-label="Frames">
  <div class="bar"><h2>Compare</h2>
    <div class="switch" role="group" aria-label="How to compare">
      <button type="button" id="by-moment" aria-pressed="true">By moment</button>
      <button type="button" id="by-style" aria-pressed="false">By style</button>
    </div>
  </div>
  <div class="stack" id="view-moment">{by_moment}</div>
  <div class="stack" id="view-style" hidden>{by_style}</div>
</section>
<section class="stack" aria-label="Differences">
  <h2>How they differ</h2>
  <div class="cards">{cards}</div>
</section>
</main>
<script>
(function(){{
  var a=document.getElementById('by-moment'),b=document.getElementById('by-style'),m=document.getElementById('view-moment'),s=document.getElementById('view-style');
  function show(style){{m.hidden=style;s.hidden=!style;a.setAttribute('aria-pressed',String(!style));b.setAttribute('aria-pressed',String(style));}}
  a.addEventListener('click',function(){{show(false);}});
  b.addEventListener('click',function(){{show(true);}});
}})();
</script>
"""
PAGE = PAGE.replace("--muted:#ad a296", "--muted:#ada296")
(HERE / "style_test.html").write_text(PAGE)
print("page bytes", len(PAGE))
