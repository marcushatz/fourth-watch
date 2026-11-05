#!/usr/bin/env python3
"""Build the checker test fixtures (deterministic). Run from anywhere:
    python3 tests/checkers/make_fixtures.py          # everything
    python3 tests/checkers/make_fixtures.py --keep   # as above, but leaves clips that already exist (for when a render holds the CPUs)
Writes fixtures/script/*.md, fixtures/shotlist/*.js, fixtures/identity/*/ and fixtures/video/* next to this file.
Each fixture plants ONE known fault (or none); expected.json says what each checker must report."""
import json, re, shutil, subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
FX = HERE / "fixtures"
for d in ("script", "shotlist", "video"):
    (FX / d).mkdir(parents=True, exist_ok=True)

# ---------- scripts: one clean script (the Ep 2 Jonah v4 draft, 0 FAIL) and single-fault copies ----------
good = (ROOT / "ep02-jonah/episode_v4_draft.md").read_text()
(FX / "script/good.md").write_text(good)
def variant(name, old, new):
    assert good.count(old) == 1, (name, old)
    (FX / f"script/{name}.md").write_text(good.replace(old, new))
variant("bad_hook_mismatch", "VO: Why did Jonah run from God instead of going to Nineveh?\nON-SCREEN",
        "VO: Why did Jonah run away?\nON-SCREEN")
variant("bad_cta_in_vo", "VO: Who surprises you more in this story: Jonah, or the people of Nineveh? [Jonah 3:5, 4:1]",
        "VO: Who surprises you more in this story: Jonah, or the people of Nineveh? Follow for more. [Jonah 3:5, 4:1]")
variant("bad_pending_factcheck", "| Closing question | Jonah 3:5, 4:1 | rounds 1 and 2 reviewer A | verified |",
        "| Closing question | Jonah 3:5, 4:1 | not yet checked | pending |")
variant("bad_no_reference", "VO: And the people of Nineveh believed God. [Jonah 3:5]", "VO: And the people of Nineveh believed God.")
variant("bad_no_verse_card", 'VERSE: "That is why I made haste to flee to Tarshish; for I knew that you are a gracious God and merciful," — Jonah 4:2 (ESV)\n', "")

# ---------- value and judge checks (added Oct 31, before the checks existed: Round 17, tests first) ----------
# A Value item the viewer never hears doesn't count: its quote must be in the VO, or most of its key words must be in two neighbouring lines.
variant("value_one_unspoken", '- The book ends on God\'s unanswered question about 120,000 persons "and also much cattle" [Jonah 4:11]',
        '- The sailors "feared the LORD exceedingly" before Jonah ever reached Nineveh [Jonah 1:16]')
(FX / "script/value_extra_unspoken.md").write_text(good.replace(
    '- The book ends on God\'s unanswered question about 120,000 persons "and also much cattle" [Jonah 4:11]',
    '- The book ends on God\'s unanswered question about 120,000 persons "and also much cattle" [Jonah 4:11]\n'
    '- The sailors "feared the LORD exceedingly" before Jonah ever reached Nineveh [Jonah 1:16]'))
# The same phrase said three times (the round 2 Jonah draft said "slow to anger" three times).
variant("repetition", "VO: When God saw them turn around, He didn't bring the disaster. [Jonah 3:10]",
        "VO: When God saw them turn around, He didn't bring the disaster. He was slow to anger. He is always slow to anger. [Jonah 3:10, 4:2]")
# A signpost line (judges' weakest lines: "Let's look at Samson...", "People ask this in our comments all the time.").
variant("signpost", "VO: It's easy to guess he was afraid. But Jonah gives his reason himself. [Jonah 4:2]",
        "VO: Let's look at what the book actually says. It's easy to guess he was afraid. But Jonah gives his reason himself. [Jonah 4:2]")
# A line that only repeats what was already said.
variant("dead_line", "VO: And the people of Nineveh believed God. [Jonah 3:5]",
        "VO: And the people of Nineveh believed God. [Jonah 3:5]\nVO: Jonah found a ship going to Tarshish instead, and he paid the fare to Tarshish. [Jonah 1:3]")
# The answer split into clauses: Samson v62 states the first clause at ~33% ("So his strength was never a reward."), the whole line only at the re-ask.
(FX / "script/answer_clause.md").write_text((HERE / "sources/answer_clause_samson_v62.md").read_text())
# Judge panels for the --judge gate. The sha is of the exact VO text the judges read (make_packet.py's text).
import hashlib, sys as _sys
_sys.path.insert(0, str(ROOT)); import fw_check as _fw
_ep = _fw.parse_script(str(FX / "script/good.md"))
_txt = re.sub(r"\s+", " ", " ".join(_fw.strip_refs(v["text"]).strip() for v in _ep["vo"]))
SHA = hashlib.sha256(_txt.encode()).hexdigest()[:16]
CAL = {"craft_bar_best_reference_overall": 7, "overall_predicts_views": False}
for d, verdict, sha, why in (("pass", "GOOD ENOUGH", SHA, []), ("notyet", "NOT YET", SHA, ["hook, payoff or new value is below 4"]),
                             ("stale", "GOOD ENOUGH", "0000000000000000", [])):
    (FX / f"judge/{d}").mkdir(parents=True, exist_ok=True)
    (FX / f"judge/{d}/panel.json").write_text(json.dumps({"calibration": CAL, "scripts": [
        {"kind": "ours", "name": "tests/checkers/fixtures/script/good.md", "sha": sha, "verdict": verdict, "why": why, "overall": 7, "hook": 4, "payoff": 4, "new_value": 4}]}, indent=1))

# ---------- shot lists: a synthetic 100 s score (no engine needed) ----------
SCORE_JS = r"""// synthetic score for the shot-list checker tests (generated by make_fixtures.py)
const N_LINES = 30, WPL = 9, WPS = 2.9, GAP = 0.25;
let t = 0.3; const lines = [];
for (let i = 0; i < N_LINES; i++) {
  const words = [];
  for (let k = 0; k < WPL; k++) { const s = t, e = t + 1 / WPS * 0.85; words.push({ w: 'word' + k, s, e }); t += 1 / WPS; }
  lines.push({ i, text: words.map((w) => w.w).join(' ') + '.', words, s: words[0].s, e: words[WPL - 1].e }); t += GAP;
}
const voEnd = lines[N_LINES - 1].e;
const VO = { lines, voEnd };
const END_T = +(voEnd + 0.3).toFixed(3), OUTRO = 2.5;
const SHOTS = [];
const SHOT_LEN = __SHOT_LEN__;
for (let a = 0, i = 0; a < END_T - 0.01; a += SHOT_LEN, i++) {
  const t0 = a, t1 = Math.min(END_T, a + SHOT_LEN);
  const beats = {}; for (let b = t0 + 1.9, k = 0; b < t1 - 0.2; b += 1.9, k++) beats['b' + k] = +b.toFixed(2);
  SHOTS.push({ id: 'S' + String(i).padStart(2, '0'), scene: 'set1', v: 'x', t0, t1, cam: { move: 'drift', amt: 3 }, size: ['ms', 'cu', 'ws', 'insert', 'mcu'][i % 5],
    angle: ['eye', 'high', 'low', 'eye', 'top'][i % 5], act: 'acts on its word', change: 'something changes', beats });
}
__MUTATE__
const VERSES = [];
module.exports = { VO, END_T, OUTRO, SHOTS, VERSES };
"""
def score(name, shot_len=3.6, mutate=""):
    (FX / f"shotlist/{name}.js").write_text(SCORE_JS.replace("__SHOT_LEN__", str(shot_len)).replace("__MUTATE__", mutate))
score("good")
score("bad_long_shot", mutate="SHOTS[5].t1 = SHOTS[5].t0 + 14; for (let j = 6; j < SHOTS.length; j++) { SHOTS[j].t0 += 14 - SHOT_LEN; SHOTS[j].t1 = Math.min(END_T, SHOTS[j].t1 + 14 - SHOT_LEN); } while (SHOTS.length && SHOTS[SHOTS.length-1].t0 >= END_T) SHOTS.pop(); SHOTS[SHOTS.length-1].t1 = END_T;")
# a 5 s stretch whose only visible change is a speech bubble: the beat-clock count must include it
score("bubble_only_beat", mutate="SHOTS[10].beats = {}; SHOTS[10].bubble = { text: 'Hi', beat: SHOTS[10].t0 + 1.8 };")
score("no_bubble_beat", mutate="SHOTS[10].beats = {};")
score("bad_jump_cuts", mutate="SHOTS.forEach((s) => { s.size = 'ms'; s.angle = 'eye'; });")

# ---------- identity: source folders for `fw_check.py identity` (added Nov 5, before the check existed: Round 17, tests first) ----------
def source(name, files):
    d = FX / "identity" / name
    shutil.rmtree(d, ignore_errors=True); d.mkdir(parents=True)
    for fn, txt in files.items(): (d / fn).write_text(txt)
# None planted: every route the lint reads, written the approved way. The comment must not count as a font.
source("good", {
    "card.js": """// Inter appears only in this comment, and "FOURTH WATCH" too: ctx.fillText('FOURTH WATCH') here draws nothing
const SERIF = '"Cinzel"', ITAL = '"Cormorant Garamond"';
const PARCH = '#F2E6CF', GOLD = '#E3B25C';
function wordmark(ctx, fs) {
  const track = 0.14 * fs;
  ctx.font = `600 ${fs}px "Cinzel"`; ctx.fillStyle = PARCH;
  spacedText(ctx, 'FOURTH WATCH', 540, 1400, track);
}
function wordmarkPx(ctx) { ctx.font = '600 100px "Cinzel"'; ctx.letterSpacing = '14px'; ctx.fillStyle = '#F2E6CF'; ctx.fillText('FOURTH WATCH', 540, 500); }
function title(ctx) { ctx.font = `700 80px ${SERIF}`; ctx.fillStyle = GOLD; ctx.fillText('WHY', 540, 300); }
function verse(ctx) { ctx.font = `600 italic 50px ${ITAL}`; ctx.fillStyle = 'rgba(242,230,207,0.9)'; ctx.fillText('He came to them', 540, 700); }
""",
    "outro.html": """<style>@font-face{font-family:Cinz;font-weight:600;src:url(cinzel-latin-600-normal.woff2)}
#word{font:600 78px Cinz;letter-spacing:.14em;color:#F2E6CF}</style>
<div id="word">FOURTH WATCH</div>
""",
    "type.jsx": """const GOLD="#E3B25C";
export const Mark=()=><text fontFamily="Cinzel" fontWeight={600} fontSize={100} letterSpacing={14} color="#F2E6CF">FOURTH WATCH</text>;
export const Word=()=><text fontFamily="Cormorant Garamond" color={GOLD}>word</text>;
""",
})
# One off-list font per route the lint reads.
source("bad_font", {
    "canvas.js": """ctx.font = '600 40px "Playfair Display"'; ctx.fillStyle = '#F2E6CF'; ctx.fillText('label', 10, 10);\n""",
    "constant.js": """const SANS = '"Inter"';\nctx.font = `600 30px ${SANS}`; ctx.fillStyle = '#F2E6CF'; ctx.fillText('label', 10, 10);\n""",
    "loader.js": """const f = new FontFace('Lato', 'url(fonts/lato-700.woff2)');\n""",
    "page.css": """.tag{font-family:"Bebas Neue",serif;color:#F2E6CF}\n""",
    "clip.jsx": """export const T=()=><text fontFamily="Oswald" color="#F2E6CF">label</text>;\n""",
    "animatic.py": """font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 40)\ncv2.putText(img, 'label', (10, 10), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)\n""",
})
# The wordmark one clause wrong at a time: the first is the fault in ep01-samson/film27/logo.js's weight.
source("bad_wordmark", {"mark.js": """ctx.font = '700 78px "Cinzel"'; ctx.letterSpacing = '10.92px'; ctx.fillStyle = '#F2E6CF'; ctx.fillText('FOURTH WATCH', 540, 1318);\n"""})
source("bad_wordmark_tracking", {"mark.js": """ctx.font = '600 78px "Cinzel"'; ctx.letterSpacing = '12px'; ctx.fillStyle = '#F2E6CF'; ctx.fillText('FOURTH WATCH', 540, 1318);\n"""})
source("bad_wordmark_family", {"mark.js": """ctx.font = '600 78px "Cormorant Garamond"'; ctx.letterSpacing = '10.92px'; ctx.fillStyle = '#F2E6CF'; ctx.fillText('FOURTH WATCH', 540, 1318);\n"""})
source("bad_wordmark_css", {"mark.html": """<style>#word{font:600 74px Cinzel;letter-spacing:.16em;color:#F2E6CF}</style>\n<div id="word">FOURTH WATCH</div>\n"""})
source("bad_wordmark_unreadable", {"mark.js": """drawLabel(ctx, 'FOURTH WATCH', 540, 1318);\n"""})
# The endcard's dead branch, word for word, outside the one file its exception names: it must still FAIL.
source("bad_wordmark_exception_elsewhere", {"mark.js": """ox.fillStyle = '#F2E6CF'; ox.font = `700 ${Math.round(72 * TS)}px "Cinzel"`;
const [x0, x1] = spacedText(ox, 'FOURTH WATCH', OW / 2, WY + (1 - kn) * 18 * TS, 11 * TS);
"""})
source("off_token_color", {
    "card.js": """const GOLD = '#F0C062';\nctx.font = '700 40px "Cinzel"'; ctx.fillStyle = GOLD; ctx.fillText('WORD', 10, 10);\n""",
    "type.jsx": """export const T=()=><text fontFamily="Cinzel" color="#B8AC9A">word</text>;\n""",
})
# A token file that calls something approved with no Round behind it must not load.
(FX / "identity/bad_token.json").write_text(json.dumps({"colors": {"gold": {"value": "#E3B25C", "status": "approved", "source": "system/00 §4"}}}, indent=1))

# ---------- videos: 8 s, 1080x1920 unless the fault is the format ----------
FF = shutil.which("ffmpeg")
def ff(name, vf_src, af_src, extra=()):
    out = FX / f"video/{name}.mp4"
    if "--keep" in _sys.argv and out.exists(): return
    cmd = [FF, "-v", "error", "-y", "-f", "lavfi", "-i", vf_src, "-f", "lavfi", "-i", af_src, "-t", "8",
           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-c:a", "aac", "-b:a", "128k", *extra, str(out)]
    subprocess.run(cmd, check=True)
MOVING = "testsrc2=size=1080x1920:rate=30"
TONE = "sine=frequency=220:sample_rate=48000,volume=0.18"
ff("v_good", MOVING, TONE)
ff("v_wrong_size", "testsrc2=size=720x1280:rate=30", TONE)
ff("v_frozen", "color=c=0x2A1E16:size=1080x1920:rate=30", TONE)
ff("v_too_loud", MOVING, "sine=frequency=220:sample_rate=48000,volume=8")
# Captions for the placement check: the same three chunks, mid-frame (the planted fault) and inside the top third (the control).
CAPTIONS = [(0.2, 2.6, "Peter stepped out"), (2.7, 5.2, "onto the water"), (5.3, 7.8, "toward the boat")]
CAP_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf"
def captioned(name, y):
    text = ",".join(f"drawtext=fontfile={CAP_FONT}:text='{c}':fontsize=64:fontcolor=0xF2E6CF:x=(w-text_w)/2:y={y}:enable='between(t,{a},{b})'" for a, b, c in CAPTIONS)
    ff(name, f"color=c=0x14100D:size=1080x1920:rate=30,{text}", TONE)
captioned("v_caption_mid", 900)
captioned("v_caption_top", 420)
stamp = lambda t: f"00:00:{int(t):02d},{int(round(t % 1 * 1000)):03d}"
(FX / "video/captions.srt").write_text("".join(f"{i}\n{stamp(a)} --> {stamp(b)}\n{c}\n\n" for i, (a, b, c) in enumerate(CAPTIONS, 1)))
# A verse card sits mid-frame on purpose and captions hide under it (film.js narration()): the same clip, told by the script that this text is a card.
(FX / "video/card_script.md").write_text('# Card\n\n## Hook\nVERSE: "Peter stepped out onto the water toward the boat" — Matthew 14:29 (ESV)\n')
print("fixtures written to", FX)
