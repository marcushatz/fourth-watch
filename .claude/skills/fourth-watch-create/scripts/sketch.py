#!/usr/bin/env python3
"""A small drawing kit for storyboard sketches: 9:16 pencil-style frames as SVG.

These are planning sketches, not a look. They cost nothing and need no lock lifted.
Gold is reserved for moments where the text says God acted, or a marked symbol of that.

    f = Frame("night")
    f.stars(90); f.hill(392); f.person(135, 382, 34, "lookup")
    f.write("frames/S02.svg")
"""
import html
import math
import random
import textwrap
from pathlib import Path

W, H = 270, 480
GOLD = "#f2b134"
TONES = {
    "night": {"bg": "#12141d", "ink": "#dcd8cc", "mid": "#3a3f52", "low": "#22263a"},
    "dusk": {"bg": "#343446", "ink": "#ece5d6", "mid": "#5e5a6e", "low": "#26263a"},
    "day": {"bg": "#e7dfca", "ink": "#2b2722", "mid": "#a79e88", "low": "#83906a"},
    "cold": {"bg": "#98a2a6", "ink": "#20252a", "mid": "#6c787e", "low": "#465056"},
    "chalk": {"bg": "#191c1b", "ink": "#ece9de", "mid": "#6d716c", "low": "#2c302e"},
}
POSES = {
    "stand": {"head": (0, .92), "spine": [(0, .82), (0, .45)], "limbs": [[(0, .45), (-.08, 0)], [(0, .45), (.08, 0)], [(0, .78), (-.13, .48)], [(0, .78), (.13, .48)]]},
    "lookup": {"head": (.04, .93), "spine": [(0, .82), (0, .45)], "limbs": [[(0, .45), (-.08, 0)], [(0, .45), (.08, 0)], [(0, .78), (-.12, .5)], [(0, .78), (.12, .5)]]},
    "walk": {"head": (.03, .92), "spine": [(.01, .82), (0, .45)], "limbs": [[(0, .45), (-.17, 0)], [(0, .45), (.15, 0)], [(.01, .78), (-.14, .52)], [(.01, .78), (.16, .55)]]},
    "reach": {"head": (.02, .92), "spine": [(0, .82), (0, .45)], "limbs": [[(0, .45), (-.08, 0)], [(0, .45), (.08, 0)], [(0, .78), (-.12, .5)], [(0, .78), (.34, .68)]]},
    "armsup": {"head": (0, .9), "spine": [(0, .8), (0, .45)], "limbs": [[(0, .45), (-.08, 0)], [(0, .45), (.08, 0)], [(0, .78), (-.17, 1.02)], [(0, .78), (.17, 1.02)]]},
    "open": {"head": (0, .92), "spine": [(0, .82), (0, .45)], "limbs": [[(0, .45), (-.08, 0)], [(0, .45), (.08, 0)], [(0, .78), (-.24, .62)], [(0, .78), (.24, .62)]]},
    "crouch": {"head": (.12, .52), "spine": [(.06, .43), (-.06, .16)], "limbs": [[(-.06, .16), (.14, .13), (.06, 0)], [(.06, .38), (.2, .2)]]},
    "hunch": {"head": (.15, .47), "spine": [(.07, .42), (-.07, .13)], "limbs": [[(-.07, .13), (.16, .12), (.1, 0)], [(.07, .38), (.17, .41)]]},
}


class Frame:
    def __init__(self, tone="day", seed=1):
        self.t = TONES[tone]
        self.parts = [f'<rect width="{W}" height="{H}" fill="{self.t["bg"]}"/>']
        self.rng = random.Random(seed)

    def raw(self, svg):
        self.parts.append(svg)
        return self

    def _c(self, color, key="ink"):
        return color or self.t[key]

    def wash(self, y, color=None, opacity=1.0, height=None):
        h = H - y if height is None else height
        return self.raw(f'<rect y="{y}" width="{W}" height="{h}" fill="{self._c(color, "low")}" opacity="{opacity}"/>')

    def stars(self, n=80, y1=340, color=None):
        for _ in range(n):
            x, y, r = self.rng.uniform(0, W), self.rng.uniform(0, y1), self.rng.choice((.5, .6, .8, 1.1))
            self.raw(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{self._c(color)}" opacity="{self.rng.uniform(.4, 1):.2f}"/>')
        return self

    def galaxy(self, x, y, r=90, turns=2.4, color=None):
        for arm in (0, math.pi):
            for i in range(120):
                a = i / 120 * turns * 2 * math.pi
                d = r * (i / 120) ** 1.1
                j = self.rng.uniform(-4, 4)
                px, py = x + (d + j) * math.cos(a + arm), y + (d + j) * .55 * math.sin(a + arm)
                self.raw(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{self.rng.choice((.6, .8, 1.1))}" fill="{self._c(color)}" opacity="{1 - i / 170:.2f}"/>')
        return self

    def hill(self, y, color=None, peak=135, rise=26):
        c = self._c(color, "low")
        return self.raw(f'<path d="M0 {y + rise} Q{peak} {y - rise} {W} {y + rise} L{W} {H} L0 {H} Z" fill="{c}"/>')

    def blob(self, x, y, r, color=None, n=7, opacity=1):
        c = self._c(color, "mid")
        out = []
        for i in range(n):
            a = 2 * math.pi * i / n
            out.append(f'<circle cx="{x + r * .6 * math.cos(a):.1f}" cy="{y + r * .5 * math.sin(a):.1f}" r="{r * self.rng.uniform(.46, .62):.1f}" fill="{c}"/>')
        out.append(f'<circle cx="{x}" cy="{y}" r="{r * .7:.1f}" fill="{c}"/>')
        return self.raw(f'<g opacity="{opacity}">{"".join(out)}</g>')

    def tree(self, x, base, h, color=None, trunk=None):
        c = self._c(color, "mid")
        tc = trunk or c
        self.raw(f'<path d="M{x - h * .05:.1f} {base} Q{x} {base - h * .3:.1f} {x - h * .02:.1f} {base - h * .62:.1f} L{x + h * .03:.1f} {base - h * .62:.1f} Q{x + h * .02:.1f} {base - h * .3:.1f} {x + h * .06:.1f} {base} Z" fill="{tc}"/>')
        return self.blob(x, base - h * .74, h * .34, c)

    def trunks(self, xs, color=None, top=0, bottom=H, width=22):
        c = self._c(color, "low")
        for x in xs:
            w = width * self.rng.uniform(.7, 1.3)
            self.raw(f'<path d="M{x - w / 2:.1f} {bottom} Q{x + 6:.1f} {H * .5:.1f} {x - w * .3:.1f} {top} L{x + w * .3:.1f} {top} Q{x + 10:.1f} {H * .5:.1f} {x + w / 2:.1f} {bottom} Z" fill="{c}"/>')
        return self

    def person(self, x, base, h, pose="stand", color=None, facing=1, width=None):
        c = self._c(color)
        p = POSES[pose]
        pt = lambda u, v: (x + u * h * facing, base - v * h)
        sw = width or max(h * .085, 1.6)
        lines = [p["spine"], *p["limbs"]]
        for line in lines:
            pts = " ".join(f"{a:.1f},{b:.1f}" for a, b in (pt(*q) for q in line))
            w = sw * 1.5 if line is p["spine"] else sw
            self.raw(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
        hx, hy = pt(*p["head"])
        return self.raw(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{h * .085:.1f}" fill="{c}"/>')

    def bust(self, x, y, s, color=None, cloak=None, facing=1, eyes="open", skin=None, look=0):
        """Head and shoulders. y is the centre of the head and s the head radius."""
        c = self._c(color)
        sk = skin or self.t["mid"]
        self.raw(f'<path d="M{x - s * 2.2:.1f} {y + s * 4:.1f} Q{x - s * 2:.1f} {y + s * 1.5:.1f} {x:.1f} {y + s * 1.3:.1f} Q{x + s * 2:.1f} {y + s * 1.5:.1f} {x + s * 2.2:.1f} {y + s * 4:.1f} Z" fill="{cloak or c}"/>')
        self.raw(f'<ellipse cx="{x}" cy="{y}" rx="{s * .88:.1f}" ry="{s:.1f}" fill="{sk}" stroke="{c}" stroke-width="2"/>')
        ex = x + s * .32 * facing
        for dx in (-.34, .34):
            px = ex + dx * s
            ey = y - s * .08 + look
            if eyes == "shut":
                self.raw(f'<path d="M{px - s * .16:.1f} {ey:.1f} Q{px:.1f} {ey + s * .12:.1f} {px + s * .16:.1f} {ey:.1f}" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"/>')
            else:
                self.raw(f'<circle cx="{px:.1f}" cy="{ey:.1f}" r="{s * .08:.1f}" fill="{c}"/>')
        self.raw(f'<path d="M{ex - s * .02:.1f} {y + s * .1:.1f} l{s * .1 * facing:.1f} {s * .26:.1f} l{-s * .12 * facing:.1f} 0" fill="none" stroke="{c}" stroke-width="1.6" stroke-linecap="round"/>')
        return self.raw(f'<path d="M{ex - s * .22:.1f} {y + s * .62:.1f} q{s * .2:.1f} {s * .08:.1f} {s * .42:.1f} 0" fill="none" stroke="{c}" stroke-width="1.8" stroke-linecap="round"/>')

    def huddle(self, x, base, s, color=None, facing=1, lifted=False):
        """A person curled up on the ground, seen from the side. s is about their height when curled."""
        c = self._c(color)
        f = facing
        self.raw(f'<path d="M{x - s * .42 * f:.1f} {base} Q{x - s * .5 * f:.1f} {base - s * .62:.1f} {x + s * .02 * f:.1f} {base - s * .7:.1f} Q{x + s * .3 * f:.1f} {base - s * .5:.1f} {x + s * .42 * f:.1f} {base} Z" fill="{c}"/>')
        hy = base - s * (.98 if lifted else .78)
        hx = x + s * (.14 if lifted else .3) * f
        return self.raw(f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="{s * .2:.1f}" fill="{c}"/>')

    def hand(self, x, y, s, rot=0, color=None, sleeve=None):
        c = self._c(color)
        return self.raw(
            f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">'
            f'<rect x="-13" y="24" width="26" height="60" rx="5" fill="{sleeve or self.t["mid"]}"/>'
            f'<path d="M-14 26 Q-16 -4 -11 -22 Q-9 -29 -6 -22 L-4 -6 L-3 -30 Q0 -36 3 -30 L4 -8 L8 -27 Q11 -33 14 -26 L12 -4 L19 -15 Q24 -19 24 -12 L14 26 Z" fill="{c}"/></g>')

    def fruit(self, x, y, r, color=None, bite=False):
        c = self._c(color, "mid")
        self.raw(f'<ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 1.12:.1f}" fill="{c}"/>')
        self.raw(f'<path d="M{x} {y - r * 1.1:.1f} q{r * .2:.1f} {-r * .4:.1f} {r * .35:.1f} {-r * .5:.1f}" fill="none" stroke="{self.t["ink"]}" stroke-width="2"/>')
        if bite:
            bx, by = x + r * .68, y - r * .3
            self.raw(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="{r * .44:.1f}" fill="{self.t["bg"]}"/>')
        return self

    def leaf(self, x, y, s, rot=0, color=None):
        c = self._c(color, "low")
        return self.raw(f'<path transform="translate({x} {y}) rotate({rot}) scale({s})" d="M0 20 Q-5 10 -18 12 Q-11 3 -22 -7 Q-9 -6 -12 -19 Q-3 -13 0 -24 Q3 -13 12 -19 Q9 -6 22 -7 Q11 3 18 12 Q5 10 0 20 Z" fill="{c}"/>')

    def serpent(self, pts, width=7, color=None):
        c = self._c(color)
        d = f"M{pts[0][0]} {pts[0][1]}"
        for a, b in zip(pts[1:], pts[2:]):
            d += f" Q{a[0]} {a[1]} {(a[0] + b[0]) / 2} {(a[1] + b[1]) / 2}"
        d += f" L{pts[-1][0]} {pts[-1][1]}"
        self.raw(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{width}" stroke-linecap="round"/>')
        hx, hy = pts[-1]
        return self.raw(f'<ellipse cx="{hx}" cy="{hy}" rx="{width * 1.25}" ry="{width * .8}" fill="{c}"/><circle cx="{hx + width * .4}" cy="{hy - width * .15}" r="1.3" fill="{self.t["bg"]}"/>')

    def ripple(self, x, y, radii, a0=-40, a1=40, color=GOLD, width=2.2, dash=None):
        for r in radii:
            p0 = (x + r * math.cos(math.radians(a0)), y + r * math.sin(math.radians(a0)))
            p1 = (x + r * math.cos(math.radians(a1)), y + r * math.sin(math.radians(a1)))
            d = f' stroke-dasharray="{dash}"' if dash else ""
            big = 1 if abs(a1 - a0) > 180 else 0
            self.raw(f'<path d="M{p0[0]:.1f} {p0[1]:.1f} A{r} {r} 0 {big} 1 {p1[0]:.1f} {p1[1]:.1f}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"{d}/>')
        return self

    def glow(self, x, y, r, color=GOLD, strength=.14):
        for i in range(6):
            self.raw(f'<circle cx="{x}" cy="{y}" r="{r * (1 - i * .15):.1f}" fill="{color}" opacity="{strength}"/>')
        return self

    def rays(self, x, y, r0, r1, n=14, color=GOLD, width=2):
        for i in range(n):
            a = 2 * math.pi * i / n
            self.raw(f'<line x1="{x + r0 * math.cos(a):.1f}" y1="{y + r0 * math.sin(a):.1f}" x2="{x + r1 * math.cos(a):.1f}" y2="{y + r1 * math.sin(a):.1f}" stroke="{color}" stroke-width="{width}" stroke-linecap="round"/>')
        return self

    def earth(self, x, y, r, sea="#2c3a55", land="#56624c", lights=0, seed=3):
        self.raw(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{sea}"/>')
        rng = random.Random(seed)
        spots = []
        for _ in range(5):
            a, d = rng.uniform(0, 6.28), rng.uniform(0, r * .62)
            px, py, q = x + d * math.cos(a), y + d * math.sin(a), rng.uniform(r * .16, r * .32)
            spots.append((px, py, q))
            self.raw(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{q:.1f}" fill="{land}"/>')
        for _ in range(lights):
            px, py, q = rng.choice(spots)
            a, d = rng.uniform(0, 6.28), rng.uniform(0, q)
            self.raw(f'<circle cx="{px + d * math.cos(a):.1f}" cy="{py + d * math.sin(a):.1f}" r="{rng.choice((.8, 1.1, 1.5))}" fill="{GOLD}"/>')
        return self

    def cross(self, x, base, h, color=GOLD):
        return self.raw(f'<line x1="{x}" y1="{base}" x2="{x}" y2="{base - h}" stroke="{color}" stroke-width="{h * .07:.1f}" stroke-linecap="round"/><line x1="{x - h * .3:.1f}" y1="{base - h * .72:.1f}" x2="{x + h * .3:.1f}" y2="{base - h * .72:.1f}" stroke="{color}" stroke-width="{h * .06:.1f}" stroke-linecap="round"/>')

    def line(self, x1, y1, x2, y2, color=None, width=2, dash=None):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        return self.raw(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{self._c(color)}" stroke-width="{width}" stroke-linecap="round"{d}/>')

    def word(self, text, x, y, size=26, color=None, anchor="middle", weight=700):
        return self.raw(f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="var(--sketch-font, system-ui, sans-serif)" font-size="{size}" font-weight="{weight}" fill="{self._c(color)}">{html.escape(text)}</text>')

    def card(self, verse, ref, y=330, width=30):
        """A verse card. Text in the frame shows placement, so it stays short."""
        lines = textwrap.wrap(verse, width)
        h = 18 + len(lines) * 15 + 16
        self.raw(f'<rect x="16" y="{y}" width="{W - 32}" height="{h}" rx="6" fill="#0e0f14" opacity=".84"/>')
        for i, text in enumerate(lines):
            self.word(text, W / 2, y + 20 + i * 15, 12.5, "#f4efe2", weight=500)
        return self.word(ref.upper(), W / 2, y + h - 9, 9.5, "#cfc7b4", weight=600)

    def tag(self, text, y=452):
        """A small reference label on its own plate, so it reads over anything."""
        w = len(text) * 6.6 + 16
        self.raw(f'<rect x="{W / 2 - w / 2:.1f}" y="{y - 12}" width="{w:.1f}" height="17" rx="3" fill="#0e0f14" opacity=".84"/>')
        return self.word(text.upper(), W / 2, y, 10, "#f4efe2", weight=600)

    def camera(self, move):
        """A small note in the corner showing how the camera moves."""
        c, x, y = "#ffffff", W - 26, 26
        marks = {
            "push": f'<rect x="{x - 12}" y="{y - 12}" width="24" height="24" fill="none" stroke="{c}" stroke-width="1.5" stroke-dasharray="3 3"/><rect x="{x - 6}" y="{y - 6}" width="12" height="12" fill="none" stroke="{c}" stroke-width="1.5"/><path d="M{x - 12} {y - 12} l5 5 M{x + 12} {y - 12} l-5 5 M{x - 12} {y + 12} l5 -5 M{x + 12} {y + 12} l-5 -5" stroke="{c}" stroke-width="1.5"/>',
            "pull": f'<rect x="{x - 6}" y="{y - 6}" width="12" height="12" fill="none" stroke="{c}" stroke-width="1.5" stroke-dasharray="3 3"/><rect x="{x - 12}" y="{y - 12}" width="24" height="24" fill="none" stroke="{c}" stroke-width="1.5"/><path d="M{x - 7} {y - 7} l-5 -5 M{x + 7} {y - 7} l5 -5 M{x - 7} {y + 7} l-5 5 M{x + 7} {y + 7} l5 5" stroke="{c}" stroke-width="1.5"/>',
            "pan": f'<path d="M{x - 13} {y} h26 m-6 -5 l6 5 l-6 5" fill="none" stroke="{c}" stroke-width="1.8"/>',
            "track": f'<path d="M{x - 13} {y} h26 m-6 -5 l6 5 l-6 5" fill="none" stroke="{c}" stroke-width="1.8"/><line x1="{x - 13}" y1="{y + 9}" x2="{x + 13}" y2="{y + 9}" stroke="{c}" stroke-width="1.2"/>',
            "tilt": f'<path d="M{x} {y + 13} v-26 m-5 6 l5 -6 l5 6" fill="none" stroke="{c}" stroke-width="1.8"/>',
            "crane": f'<path d="M{x} {y - 13} v26 m-5 -6 l5 6 l5 -6" fill="none" stroke="{c}" stroke-width="1.8"/>',
        }
        if move in marks:
            self.raw(f'<g opacity=".82">{marks[move]}</g>')
        return self

    def inner(self):
        return "".join(self.parts)

    def write(self, path):
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{self.inner()}</svg>\n')
        return p
