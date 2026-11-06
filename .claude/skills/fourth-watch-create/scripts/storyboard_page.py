#!/usr/bin/env python3
"""Turn storyboard.json into one page Marcus can look at, on a phone or a computer.

    python3 storyboard_page.py <storyboard.json> --out storyboard.html

Each frame uses, in order: frames/<id>.png, frames/<id>.svg (see sketch.py), or a rough sketch of the framing.
The page opens with the whole film at a glance, then goes shot by shot, grouped by each shot's `section`.
"""
import argparse
import base64
import html
import json
import re
from pathlib import Path

W, H = 270, 480
HEIGHTS = {"extreme-wide": 0.05, "wide": 0.14, "medium": 0.42, "close": 0.8, "extreme-close": 1.3, "insert": 0.8}
HORIZON = {"eye": 0.62, "low": 0.82, "high": 0.34, "top": 0.1, "over-shoulder": 0.6}
MOVES = {"locked": "Camera still", "push": "Camera pushes in", "pull": "Camera pulls back", "pan": "Camera pans", "tilt": "Camera tilts", "track": "Camera tracks", "crane": "Camera drops or rises"}
TONE_COLORS = {"night": "#20243a", "dusk": "#5a5670", "day": "#d8ccae", "cold": "#8f9a9e", "chalk": "#4c524e", "gold": "#f2b134"}


def rough(s):
    """A rough picture of the framing: horizon, a person at the right size, and a shoulder if it's over the shoulder."""
    w, h_ = 90, 160
    horizon = h_ * HORIZON.get(s.get("angle"), 0.62)
    h = h_ * HEIGHTS.get(s.get("size"), 0.42)
    x = w * (0.5 if s.get("angle") != "over-shoulder" else 0.62)
    feet = min(h_ * 1.25, horizon + h * 0.55) if s.get("size") in ("close", "extreme-close") else max(horizon + 6, h_ * 0.74)
    head = h * 0.14
    top = feet - h
    body = f'<path d="M{x - h * .13:.1f} {feet:.1f} L{x - h * .1:.1f} {top + h * .2:.1f} Q{x:.1f} {top + h * .12:.1f} {x + h * .1:.1f} {top + h * .2:.1f} L{x + h * .13:.1f} {feet:.1f} Z" fill="#4a3a2c"/><circle cx="{x:.1f}" cy="{top + head:.1f}" r="{head:.1f}" fill="#4a3a2c"/>'
    shoulder = f'<circle cx="8" cy="{h_ - 6}" r="30" fill="#4a3a2c" opacity=".85"/>' if s.get("angle") == "over-shoulder" else ""
    return f'<g transform="scale(3)"><rect width="{w}" height="{h_}" fill="#d9cdb9"/><rect y="{horizon:.1f}" width="{w}" height="{h_ - horizon:.1f}" fill="#b39f83"/>{body}{shoulder}</g>'


def frame_markup(s, folder):
    sid = str(s.get("id"))
    png, svg = folder / "frames" / f"{sid}.png", folder / "frames" / f"{sid}.svg"
    if png.exists():
        data = base64.b64encode(png.read_bytes()).decode()
        return f'<image href="data:image/png;base64,{data}" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice"/>'
    if svg.exists():
        inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", svg.read_text().strip())
        first = inner.find("/>") + 2
        return f'{inner[:first]}<g filter="url(#pencil)">{inner[first:]}</g>'
    return rough(s)


def clock(t):
    t = int(round(t))
    return f"{t // 60}:{t % 60:02d}"


def row(s, folder, marks):
    e = lambda k: html.escape(str(s.get(k) or ""))
    sid = e("id")
    label = f"Sketch of shot {sid}: {e('picture')}"
    extra = f'<div class="fact"><dt>On screen</dt><dd>{e("text")}</dd></div>' if s.get("text") else ""
    move = MOVES.get(s.get("move"), e("move"))
    size = e("size").replace("-", " ")
    return f"""<article>
  <span class="anchor" id="{sid}"></span>
  <div class="frame"><svg viewBox="0 0 {W} {H}" role="img" aria-label="{label}"><g id="f-{sid}">{marks[s.get('id')]}</g></svg></div>
  <div class="notes">
    <p class="meta"><strong>Shot {int(re.sub(r'[^0-9]', '', sid) or 0)}</strong><span>{clock(s.get('start', 0))}</span><span>{s.get('end', 0) - s.get('start', 0):.1f} s</span></p>
    <p class="words">{e('words')}</p>
    <dl>
      <div class="fact"><dt>We see</dt><dd>{e('picture')}</dd></div>
      {extra}
      <div class="fact"><dt>Feel</dt><dd>{e('feel')}</dd></div>
    </dl>
    <details><summary>Acting, camera and why</summary>
      <dl>
        <div class="fact"><dt>Acting</dt><dd>{e('acting')}</dd></div>
        <div class="fact"><dt>Camera</dt><dd>{size}, {e('angle')} angle. {move}{f" {s.get('move_percent')}%" if s.get("move_percent") else ""}</dd></div>
        <div class="fact"><dt>Why</dt><dd>{e('why')}</dd></div>
        <div class="fact"><dt>Viewer learns</dt><dd>{e('understand')}</dd></div>
        <div class="fact"><dt>Made with</dt><dd>{e('route')}, {s.get('credits') or 0:g} credits. Accuracy label: {e('fidelity')}</dd></div>
      </dl>
    </details>
  </div>
</article>"""


PAGE = """<title>__NAME__</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Source+Sans+3:wght@400;600&display=swap">
<style>
/* Layout: a lightbox. The whole film as a contact sheet first, then one shot at a time. */
:root{
  --bg:#d9dee2;--sheet:#f4f6f6;--fg:#16191e;--muted:#515b66;--line:#bfc7ce;--gold:#8f5e00;
  --display:"Barlow Condensed","Arial Narrow",sans-serif;--body:"Source Sans 3",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;
  --sketch-font:"Barlow Condensed","Arial Narrow",sans-serif}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14171c;--sheet:#1e2329;--fg:#e9edf0;--muted:#a3adb7;--line:#343b44;--gold:#f2b134;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#14171c;--sheet:#1e2329;--fg:#e9edf0;--muted:#a3adb7;--line:#343b44;--gold:#f2b134;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font:17px/1.5 var(--body)}
main{max-width:880px;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:grid;gap:30px}
h1{font:700 clamp(32px,6vw,46px)/1.05 var(--display);margin:0;text-wrap:balance}
h2{font:700 25px/1.15 var(--display);margin:0;letter-spacing:.01em}
.eyebrow{font:500 13px/1.3 var(--mono);color:var(--muted);margin:0 0 8px}
.lead{margin:10px 0 0;max-width:62ch}
.key{display:grid;gap:4px;margin:14px 0 0;padding:0;list-style:none;color:var(--muted);font-size:16px;max-width:62ch}
.key strong{color:var(--fg);font-weight:600}
.strip{display:flex;height:22px;border-radius:3px;overflow:hidden;margin:0 0 6px}
.strip a{display:block;min-width:1px}
.strip-note{font:400 13px/1.4 var(--mono);color:var(--muted);margin:0 0 16px}
.sheet{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:10px 8px}
.sheet a{color:inherit;text-decoration:none;display:grid;gap:3px;font:400 12px/1.2 var(--mono)}
.sheet a:focus-visible,summary:focus-visible,.strip a:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.sheet svg{display:block;width:100%;height:auto;border-radius:3px;outline:1px solid var(--line)}
.sheet span{display:flex;justify-content:space-between;color:var(--muted)}
.section{display:grid;gap:12px}
.section-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;border-top:2px solid var(--fg);padding-top:10px}
.section-head p{margin:0;color:var(--muted);font-size:16px;flex:1 1 280px;min-width:0}
.section-head span{font:400 13px/1.3 var(--mono);color:var(--muted)}
article{display:grid;grid-template-columns:minmax(0,190px) minmax(0,1fr);gap:18px;background:var(--sheet);border:1px solid var(--line);border-radius:4px;padding:14px}
.anchor{display:block;grid-column:1/-1;height:0;margin-top:-14px;scroll-margin-top:12px}
.frame svg{display:block;width:100%;height:auto;border-radius:3px;outline:1px solid var(--line)}
.notes{min-width:0}
.meta{display:flex;flex-wrap:wrap;gap:4px 12px;margin:0 0 6px;font:400 13px/1.3 var(--mono);color:var(--muted)}
.meta strong{color:var(--gold);font-weight:500}
.words{font:600 24px/1.2 var(--display);margin:0 0 12px}
dl{display:grid;gap:7px;margin:0}
.fact{display:grid;grid-template-columns:96px minmax(0,1fr);gap:0 10px}
dt{color:var(--muted);font-size:15px}
dd{margin:0;font-size:16px;line-height:1.42}
details{margin-top:10px;border-top:1px solid var(--line);padding-top:8px}
details dl{margin-top:8px}
summary{cursor:pointer;color:var(--muted);font-size:15px}
@media (max-width:560px){
  article{grid-template-columns:minmax(0,112px) minmax(0,1fr);gap:12px;padding:12px}
  .words{font-size:21px}
  .fact{grid-template-columns:minmax(0,1fr)}
  dt{font-size:13px}
}
</style>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="pencil" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2.6"/></filter></defs></svg>
<main>
<header>
  <p class="eyebrow">__EYEBROW__</p>
  <h1>__TITLE__</h1>
  <p class="lead">__MESSAGE__</p>
  <ul class="key">__KEY__</ul>
</header>
<section aria-label="The whole film">
  <h2>The whole film</h2>
  __STRIP__
  <div class="sheet">__SHEET__</div>
</section>
__ROWS__
</main>"""


def main():
    a = argparse.ArgumentParser()
    a.add_argument("storyboard")
    a.add_argument("--out", required=True)
    o = a.parse_args()
    path = Path(o.storyboard)
    board = json.loads(path.read_text())
    shots = board.get("shots", [])
    end = shots[-1].get("end", 0) if shots else 0
    timing = "real voice timing" if board.get("timing") == "real" else "estimated timing"
    summary = f"{len(shots)} shots, {clock(end)}, {timing}"
    marks = {s.get("id"): frame_markup(s, path.parent) for s in shots}

    sheet = "".join(
        f'<a href="#{html.escape(str(s.get("id")))}"><svg viewBox="0 0 {W} {H}" aria-hidden="true"><use href="#f-{html.escape(str(s.get("id")))}"/></svg><span><b>{int(re.sub(r"[^0-9]", "", str(s.get("id"))) or 0)}</b>{clock(s.get("start", 0))}</span></a>'
        for s in shots)
    strip = ""
    if any(s.get("tone") for s in shots):
        cells = "".join(
            f'<a href="#{html.escape(str(s.get("id")))}" aria-label="Shot {html.escape(str(s.get("id")))}" style="flex:{max(s.get("end", 0) - s.get("start", 0), .1):.2f} 1 0;background:{TONE_COLORS.get(s.get("tone"), "#888")}"></a>'
            for s in shots)
        strip = f'<div class="strip">{cells}</div><p class="strip-note">Light across the film. Each block is one shot, and gold is where God acts.</p>'

    notes = board.get("sections") or {}
    groups, rows = [], []
    for s in shots:
        name = s.get("section") or ""
        if not groups or groups[-1][0] != name:
            groups.append((name, []))
        groups[-1][1].append(s)
    for name, members in groups:
        body = "\n".join(row(s, path.parent, marks) for s in members)
        if name:
            length = members[-1].get("end", 0) - members[0].get("start", 0)
            rows.append(f'<section class="section"><div class="section-head"><h2>{html.escape(name)}</h2><p>{html.escape(notes.get(name, ""))}</p><span>{clock(members[0].get("start", 0))} &middot; {length:.0f} s</span></div>\n{body}\n</section>')
        else:
            rows.append(f'<section class="section">{body}</section>')

    key = [f"<li><strong>Rough sketches.</strong> They show the shots, framing and timing. They aren't the final look.</li>",
           "<li><strong>Gold</strong> appears only where God acts, or where we use it to stand for that.</li>",
           "<li><strong>Timing is estimated.</strong> It changes once the voice is recorded.</li>"] if board.get("timing") != "real" else []
    out = (PAGE.replace("__NAME__", html.escape(board.get("name", board.get("title", "Storyboard"))))
           .replace("__TITLE__", html.escape(board.get("title", "Storyboard")))
           .replace("__EYEBROW__", f"Storyboard &middot; {summary}")
           .replace("__MESSAGE__", html.escape(board.get("message", "")))
           .replace("__KEY__", "".join(key))
           .replace("__STRIP__", strip)
           .replace("__SHEET__", sheet)
           .replace("__ROWS__", "\n".join(rows)))
    Path(o.out).write_text(out)
    print(f"wrote {o.out}: {summary}")


if __name__ == "__main__":
    main()
