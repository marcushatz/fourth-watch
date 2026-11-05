#!/usr/bin/env python3
"""Turn storyboard.json into one page Marcus can look at, on a phone or a computer.

    python3 storyboard_page.py <storyboard.json> --out storyboard.html

Shows frames/<id>.png beside the storyboard when it exists, and otherwise draws a rough sketch of the framing.
"""
import argparse
import base64
import html
import json
from pathlib import Path

HEIGHTS = {"extreme-wide": 0.05, "wide": 0.14, "medium": 0.42, "close": 0.8, "extreme-close": 1.3, "insert": 0.8}
HORIZON = {"eye": 0.62, "low": 0.82, "high": 0.34, "top": 0.1, "over-shoulder": 0.6}


def sketch(s):
    """A rough picture of the framing: horizon, a person at the right size, and a shoulder if it's over the shoulder."""
    W, H = 90, 160
    horizon = H * HORIZON.get(s.get("angle"), 0.62)
    h = H * HEIGHTS.get(s.get("size"), 0.42)
    x = W * (0.5 if s.get("angle") != "over-shoulder" else 0.62)
    feet = min(H * 1.25, horizon + h * 0.55) if s.get("size") in ("close", "extreme-close") else max(horizon + 6, H * 0.74)
    head = h * 0.14
    top = feet - h
    body = f'<path d="M{x - h * .13:.1f} {feet:.1f} L{x - h * .1:.1f} {top + h * .2:.1f} Q{x:.1f} {top + h * .12:.1f} {x + h * .1:.1f} {top + h * .2:.1f} L{x + h * .13:.1f} {feet:.1f} Z" fill="var(--figure)"/><circle cx="{x:.1f}" cy="{top + head:.1f}" r="{head:.1f}" fill="var(--figure)"/>'
    shoulder = f'<circle cx="8" cy="{H - 6}" r="30" fill="var(--figure)" opacity=".85"/>' if s.get("angle") == "over-shoulder" else ""
    return f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Rough sketch of the framing"><rect width="{W}" height="{H}" fill="var(--sky)"/><rect y="{horizon:.1f}" width="{W}" height="{H - horizon:.1f}" fill="var(--ground)"/>{body}{shoulder}</svg>'


def picture(s, folder):
    frame = folder / "frames" / f"{s.get('id')}.png"
    if frame.exists():
        data = base64.b64encode(frame.read_bytes()).decode()
        return f'<img src="data:image/png;base64,{data}" alt="Frame for shot {html.escape(str(s.get("id")))}">'
    return sketch(s)


def row(s, folder):
    e = lambda k: html.escape(str(s.get(k) or ""))
    move = e("move") + (f" {s.get('move_percent')}%" if s.get("move_percent") else "")
    extra = f"<dt>On screen</dt><dd>{e('text')}</dd>" if s.get("text") else ""
    return f"""<article>
  <div class="frame">{picture(s, folder)}</div>
  <div class="notes">
    <p class="meta"><strong>{e('id')}</strong> {s.get('start', 0):.1f} to {s.get('end', 0):.1f} s &middot; {e('size')}, {e('angle')}, {move}</p>
    <p class="words">{e('words')}</p>
    <dl>
      <dt>Picture</dt><dd>{e('picture')}</dd>
      <dt>Acting</dt><dd>{e('acting')}</dd>
      <dt>Feel</dt><dd>{e('feel')}</dd>
      <dt>Understand</dt><dd>{e('understand')}</dd>
      <dt>Why this shot</dt><dd>{e('why')}</dd>
      {extra}
      <dt>Made with</dt><dd>{e('route')}, {s.get('credits') or 0:g} credits &middot; {e('fidelity')}</dd>
    </dl>
  </div>
</article>"""


PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title>
<style>
:root{--bg:#f6f1e7;--card:#fffdf8;--text:#231c16;--muted:#6d6155;--line:#e2d8c8;--accent:#9a6a1f;--sky:#d9cdb9;--ground:#b39f83;--figure:#4a3a2c}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14100d;--card:#1f1915;--text:#f2e6cf;--muted:#b3a593;--line:#3a2f27;--accent:#e3b25c;--sky:#3a3029;--ground:#2a221c;--figure:#c9b79c}}
:root[data-theme="dark"]{--bg:#14100d;--card:#1f1915;--text:#f2e6cf;--muted:#b3a593;--line:#3a2f27;--accent:#e3b25c;--sky:#3a3029;--ground:#2a221c;--figure:#c9b79c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,sans-serif}
main{max-width:860px;margin:0 auto;padding:24px 16px 56px}h1{font-size:26px;line-height:1.2;margin:0 0 8px}.lead{color:var(--muted);margin:0 0 4px}
article{display:grid;grid-template-columns:150px 1fr;gap:18px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:14px}
.frame svg,.frame img{display:block;width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:6px}
.meta{color:var(--muted);font-size:14px;margin:0 0 6px}.meta strong{color:var(--accent)}.words{font-size:18px;font-weight:600;margin:0 0 10px}
dl{display:grid;grid-template-columns:110px 1fr;gap:3px 12px;margin:0;font-size:15px}dt{color:var(--muted)}dd{margin:0}
@media (max-width:560px){article{grid-template-columns:96px 1fr;gap:12px}dl{grid-template-columns:1fr}dd{margin-bottom:6px}}
</style></head><body><main>
<h1>__TITLE__</h1><p class="lead">__MESSAGE__</p><p class="lead">__SUMMARY__</p>
__ROWS__
</main></body></html>"""


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
    summary = f"{len(shots)} shots, {end:.0f} seconds, {timing}"
    out = (PAGE.replace("__TITLE__", html.escape(board.get("title", "Storyboard")))
           .replace("__MESSAGE__", html.escape(board.get("message", "")))
           .replace("__SUMMARY__", summary)
           .replace("__ROWS__", "\n".join(row(s, path.parent) for s in shots)))
    Path(o.out).write_text(out)
    print(f"wrote {o.out}: {summary}")


if __name__ == "__main__":
    main()
