#!/usr/bin/env python3
"""Build the Cut Paper direction page. Images are embedded, so the page is one file."""
import base64
import html
import io
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
e = html.escape


def uri(path, width=540):
    im = Image.open(path)
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=82, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()


def fig(path, alt, cap="", width=540):
    c = f"<figcaption>{cap}</figcaption>" if cap else ""
    return f'<figure><img src="{uri(path, width)}" alt="{e(alt)}" loading="lazy">{c}</figure>'


NAMES = [("hook", "The tiny person"), ("giving", "Eve gives Adam the fruit"), ("hiding", "The hiding"), ("face", "Adam's face"), ("moment", "Where are you?")]
pairs = "".join(
    f'<div class="pair"><h3>{e(t)}</h3><div class="two">{fig(HERE / "frames" / f"paper_{n}.jpg", f"First test of {t}", "First test")}{fig(HERE / "v2" / f"{n}.jpg", f"New version of {t}", "New version")}</div></div>'
    for n, t in NAMES)
BEATS = [("beat1", "1. Bracing", "Head down, shoulders high, arms locked around his legs."), ("beat2", "2. The light arrives", "He doesn't move. Only a thin gold line changes."), ("beat3", "3. The shoulders release", "A very small drop. His head starts to lift."), ("beat4", "4. He lifts his head", "Eyes open. Nothing bigger than this.")]
beats = "".join(fig(HERE / "v2" / f"{n}.jpg", t, f"<strong>{e(t)}</strong> {e(d)}") for n, t, d in BEATS)
RULES = [
    ("One lit stage.", "Every shot has one key light. Gold is the only hard light in the film."),
    ("Big shapes.", "Three to five large shapes in a frame, and few small decorations."),
    ("Muted color.", "Eden is warm sage and linen. After the fall, the same paper turns cold."),
    ("Depth in bands.", "Background, middle, people and foreground, with haze between them and a soft foreground."),
    ("Adult people.", "About 7 heads tall and built from separate jointed pieces."),
    ("Restrained faces.", "Slit eyes and no animated mouths. Posture carries the feeling."),
    ("Order of movement.", "The body moves first and the hands arrive last, then everything settles."),
    ("Broken after sin.", "Adam and Eve stop moving together. Here they sit back to back."),
    ("Stillness at the climax.", "At \"Where are you?\" almost nothing moves. The change is tiny."),
    ("Spend effort carefully.", "Hard animation goes only on Eve offering the fruit, Adam bracing, \"Where are you?\" and the last shot."),
]
rules = "".join(f"<li><strong>{e(a)}</strong> {e(b)}</li>" for a, b in RULES)

PAGE = f"""<title>Cut Paper Direction</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Sans+3:wght@400;600&display=swap">
<style>
/* Layout: a director's review. Before and after first, then how the style is built. */
:root{{--bg:#e6e2d9;--sheet:#f6f3ec;--fg:#191613;--muted:#5f574e;--line:#c8c1b5;--accent:#8a5f12;--title:"Cinzel",Georgia,serif;--body:"Source Sans 3",system-ui,sans-serif}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#12141c;--sheet:#1b1f29;--fg:#eee9de;--muted:#a8a7a6;--line:#343947;--accent:#e9b654;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#12141c;--sheet:#1b1f29;--fg:#eee9de;--muted:#a8a7a6;--line:#343947;--accent:#e9b654;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{background:var(--bg);color:var(--fg);font:17px/1.5 var(--body)}}
main{{max-width:1060px;margin:0 auto;padding-block:30px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:42px}}
h1{{font:700 clamp(30px,5.4vw,44px)/1.12 var(--title);margin:0;text-wrap:balance}}
h2{{font:600 23px/1.2 var(--title);margin:0}}
h3{{font:600 17px/1.25 var(--title);margin:0 0 8px}}
p{{margin:0}}
.lead{{margin-top:12px;max-width:64ch}}
section{{display:grid;gap:14px}}
.intro{{color:var(--muted);max-width:66ch}}
.pairs{{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px 12px}}
.pair{{min-width:0}}
.two{{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}}
figure{{margin:0;min-width:0}}
figure img{{display:block;width:100%;height:auto;border-radius:3px}}
figcaption{{font-size:15px;line-height:1.35;color:var(--muted);margin-top:6px}}
figcaption strong{{color:var(--fg);font-weight:600;display:block}}
.split{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start}}
.split p{{align-self:center;max-width:44ch}}
.beats{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}}
.duo{{display:grid;grid-template-columns:repeat(2,minmax(0,300px));gap:10px}}
ol{{margin:0;padding-left:22px;display:grid;gap:7px;max-width:70ch}}
li strong{{font-weight:600}}
@media (max-width:820px){{.pairs{{grid-template-columns:minmax(0,1fr)}}.two{{grid-template-columns:repeat(2,minmax(0,1fr))}}.beats{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
@media (max-width:560px){{.split{{grid-template-columns:minmax(0,1fr)}}}}
</style>
<main>
<header>
  <h1>Cut Paper, second pass</h1>
  <p class="lead">The same five moments rebuilt with the advice from Gemini, Grok and ChatGPT. These are still frames made in code, with no credits and no video.</p>
</header>
<section aria-label="Before and after">
  <h2>Before and after</h2>
  <div class="pairs">{pairs}</div>
</section>
<section aria-label="Depth">
  <h2>Why it isn't flat</h2>
  <div class="split">
    {fig(HERE / "v2" / "stack.jpg", "One forest shot pulled apart into its paper layers", "", 720)}
    <p>This is one shot pulled apart. Each sheet sits at its own depth, with haze between them. When the camera pushes in, near sheets pass faster than far ones, so it feels like a real space even though every piece is 2D.</p>
  </div>
</section>
<section aria-label="Puppet">
  <h2>How a paper person bends</h2>
  <div class="split">
    {fig(HERE / "v2" / "parts.jpg", "A paper figure pulled apart into its separate pieces", "", 720)}
    <p>Each body part is its own piece of paper with a real shadow on the piece below. Torso, head, arms and legs can move separately, which is what stops a figure from reading as one stiff cut-out.</p>
  </div>
</section>
<section aria-label="Where are you">
  <h2>"Where are you?" in four small changes</h2>
  <p class="intro">Same framing throughout. Only his posture and one gold line change, and the emotion comes from how little moves.</p>
  <div class="beats">{beats}</div>
</section>
<section aria-label="The fall">
  <h2>The same world, before and after the fall</h2>
  <div class="duo">{fig(HERE / "v2" / "before.jpg", "Adam before the fall in warm Eden", "Before: open chest, level head, warm paper.")}{fig(HERE / "v2" / "after.jpg", "Adam after the fall in the cold garden", "After: shoulders forward, chin down, the same garden turned cold.")}</div>
</section>
<section aria-label="Rules">
  <h2>Ten rules for this style</h2>
  <ol>{rules}</ol>
</section>
</main>
"""
(HERE / "cut_paper_direction.html").write_text(PAGE)
print("page bytes", len(PAGE))
