#!/usr/bin/env python3
"""Build ep11-beginning/storyboard.json and frames/*.svg from the shot list below.

    python3 ep11-beginning/build_storyboard.py

Timing is estimated: 2.7 words per second, a short pause at each sentence end, and the planned holds.
Retime to the real take once the voice exists. The words must match script_approved.md.
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / ".claude/skills/fourth-watch-create/scripts"))
from sketch import Frame, GOLD, W, H  # noqa: E402

RATE = 2.7
SENTENCE_PAUSE = 0.1

SECTIONS = {
    "1. The question": "One question in the viewer's own words.",
    "2. The stakes": "If he needs nothing, do we matter?",
    "3. The easy answers fail": "Two common answers break against the verse.",
    "4. The turn": "He chose to make us. Would he still want us?",
    "5. The story": "The fruit, the hiding, and God calling out. His words are held back.",
    "6. The comeback": "The cost is real, and he still takes care of them.",
    "7. The moment": "The held-back words. This is the longest hold in the film.",
    "8. What it means": "Only what the moment already showed.",
    "9. How it applies to us": "One line, and the face from the garden becomes ours.",
    "10. The conclusion": "The answer, then the opening picture again, now in gold.",
}


# Sketches ------------------------------------------------------------------

def space(f, earth_y=372, r=20):
    f.stars(110, 480).galaxy(150, 150, 95)
    f.raw('<circle cx="222" cy="292" r="9" fill="#d9c9a0"/>')
    f.earth(135, earth_y, r)


def you_on_hill(f, gold=False):
    f.stars(110, 370)
    if gold:
        f.glow(135, 372, 150, strength=.1)
    f.hill(392)
    if gold:
        f.ripple(135, 382, (26, 40, 56), 200, 340, width=1.8)
    f.person(135, 384, 36, "open" if gold else "lookup", color=GOLD if gold else None)


def garden_ground(f, y=300):
    f.wash(y, f.t["low"])


def hiding(f, dim=False, lifted=True):
    f.trunks([18, 66, 214, 258], width=30)
    f.wash(380, "#191b28")
    f.blob(30, 395, 46, "#262a3e", opacity=.95)
    f.blob(245, 402, 44, "#262a3e", opacity=.95)
    f.huddle(102, 396, 72, f.t["ink"], facing=1, lifted=lifted)
    f.huddle(170, 398, 66, "#a8a496", facing=-1, lifted=lifted)
    f.leaf(62, 412, 1.4, -20, "#2f3448")
    f.leaf(212, 418, 1.5, 25, "#2f3448")


def s01(f):
    space(f); f.camera("crane")


def s02(f):
    you_on_hill(f)


def s03(f):
    f.glow(205, 92, 62, "#c9a65f", .16)
    f.raw(f'<circle cx="205" cy="92" r="26" fill="#d9c9a0"/>')
    f.raw('<path d="M0 262 L72 168 L118 226 L170 150 L270 262 Z" fill="#a79e88"/>')
    f.wash(260, "#7d8d97")
    for y in (278, 300, 326):
        f.line(30, y, 120, y + 3, "#e7dfca", 2).line(150, y + 8, 245, y + 5, "#e7dfca", 2)
    for x, y in ((60, 112), (82, 98), (104, 118)):
        f.raw(f'<path d="M{x - 9} {y} q5 -6 9 0 q5 -6 9 0" fill="none" stroke="#2b2722" stroke-width="2"/>')
    f.card("nor is he served by human hands, as though he needed anything", "Acts 17:25", 352)
    f.camera("pan")


def s04(f):
    f.hand(158, 196, 1.8, 172, "#6e6252", "#556070")
    f.hand(132, 318, 1.0, 8, "#8a7a66", "#c58e5b")


def s05(f):
    f.wash(0, f.t["low"])
    for r in (70, 118, 170):
        f.ripple(135, 250, (r,), 0, 359, color=f.t["mid"], width=1)
    f.raw('<path d="M136 262 L188 340 L174 348 Z" fill="#14141f" opacity=".6"/>')
    f.person(135, 262, 56, "open")


def chalk_strike(f, y1, y2):
    f.line(34, y1, 236, y2, "#ece9de", 4)


def s06(f):
    f.word("LONELY?", 135, 110, 34)
    f.raw('<path d="M84 318 H186 M96 318 V392 M174 318 V392" fill="none" stroke="#ece9de" stroke-width="3"/>')
    f.raw('<path d="M30 276 V392 M30 340 H64 V392" fill="none" stroke="#ece9de" stroke-width="3"/>')
    f.raw('<path d="M240 276 V392 M240 340 H206 V392" fill="none" stroke="#ece9de" stroke-width="3" stroke-dasharray="5 7"/>')
    f.raw('<path d="M135 160 V232 M112 262 Q135 214 158 262 Z" fill="none" stroke="#ece9de" stroke-width="2.4"/>')
    chalk_strike(f, 150, 96)


def s07(f):
    f.stars(50, 180, "#ece9de")
    f.word("WORSHIP?", 135, 120, 34)
    for row, (y, n, h) in enumerate(((300, 9, 28), (344, 8, 36), (396, 6, 48))):
        for i in range(n):
            f.person(24 + (i + .5) * 222 / n, y, h, "armsup", color="#ece9de", width=2)
    chalk_strike(f, 158, 104)
    f.camera("pull")


def s08(f):
    f.stars(50, 480)
    f.glow(135, 170, 150, strength=.13)
    f.rays(135, 170, 48, 108, 16)
    f.raw(f'<circle cx="135" cy="170" r="30" fill="{GOLD}"/>')
    f.earth(62, 92, 16)
    f.tree(214, 300, 72, "#6f8a5e")
    f.ripple(62, 300, (14, 24), 200, 340, color="#8fb0cf", width=2)
    f.raw('<path d="M198 72 q7 -8 12 0 q6 -8 12 0" fill="none" stroke="#ece5d6" stroke-width="2"/>')
    f.card("by your will they existed and were created", "Revelation 4:11", 346)


def s09(f):
    f.wash(150, "#8fa070")
    f.tree(46, 196, 130, "#58684a")
    f.tree(222, 188, 112, "#67785a")
    f.person(116, 340, 58, "walk")
    f.person(152, 344, 56, "walk", "#57504a")
    f.raw('<path d="M300 150 L190 150 L60 480 L300 480 Z" fill="#1c1f2a" opacity=".52"/>')
    f.camera("crane")


def s10(f):
    f.wash(0, "#8fa070")
    for x, y, r in ((36, 90, 34), (108, 62, 30), (190, 72, 36), (246, 150, 34), (24, 206, 32), (240, 310, 36), (30, 362, 36), (112, 420, 34), (204, 424, 32)):
        f.blob(x, y, r, "#5d6d4e")
    f.blob(135, 226, 44, "#3e4a38")
    f.raw('<rect x="131" y="226" width="8" height="30" fill="#2b2722"/>')
    f.ripple(135, 226, (64,), 0, 359, color="#2b2722", width=2, dash="4 6")
    f.person(92, 328, 30, "lookup")
    f.person(112, 332, 30, "lookup", "#57504a")
    f.ripple(135, -30, (70, 96, 122), 40, 140, width=2.2)
    f.tag("Genesis 2:17")


def s11(f):
    f.raw('<path d="M-10 92 Q120 60 280 120 L280 142 Q120 86 -10 118 Z" fill="#3a3028"/>')
    f.blob(64, 40, 74, "#55654a")
    f.blob(224, 58, 66, "#4b5a42")
    f.fruit(182, 150, 15, "#6d5a78")
    f.person(190, 470, 300, "lookup", "#57504a")
    f.serpent([(40, 96), (62, 150), (24, 196), (72, 246), (118, 222), (138, 238)], 12, "#1f2a24")
    f.tag("Genesis 3:5")


def s12(f):
    f.raw('<path d="M0 0 H270 V150 Q150 190 118 150 Q96 118 0 112 Z" fill="#8f806c"/>')
    f.raw('<path d="M104 120 q24 10 44 -2" fill="none" stroke="#2b2722" stroke-width="3" stroke-linecap="round"/>')
    f.hand(150, 300, 2.2, -14, "#6e6252", "#8a7a66")
    f.fruit(136, 196, 42, "#6d5a78", bite=True)


def s13(f):
    f.tree(46, 230, 200, "#6f7f5e")
    f.person(70, 520, 400, "reach", "#57504a")
    f.person(226, 520, 400, "stand", "#2b2722", facing=-1)
    f.fruit(150, 234, 15, "#6d5a78", bite=True)
    f.raw('<path d="M226 290 L168 244" stroke="#2b2722" stroke-width="30" stroke-linecap="round"/>')


def s14(f):
    f.leaf(92, 160, 3.4, -24, "#4a5a48")
    f.leaf(186, 232, 3.6, 18, "#3e4d3f")
    f.leaf(92, 312, 3.0, 12, "#4a5a48")
    f.raw('<path d="M104 212 Q130 236 158 214 M120 200 l-6 26 M138 206 l-2 26" fill="none" stroke="#ece9de" stroke-width="2"/>')
    f.hand(52, 360, 1.15, 34, "#2b2722", "#20252a")
    f.hand(222, 356, 1.15, -30, "#2b2722", "#20252a")


def s15(f):
    f.wash(330, "#59684c")
    f.trunks([186, 228, 262], color="#23273a", width=34)
    f.blob(226, 70, 84, "#23273a")
    f.person(96, 330, 96, "walk", facing=1)
    f.person(138, 330, 90, "walk", "#57504a", facing=1)
    f.ripple(-40, 330, (46, 86, 126), -66, 60, width=2.6)
    for x in range(8, 262, 15):
        h = 40 + (x * 7 % 30)
        lean = 18 if x < 120 else 4
        f.raw(f'<path d="M{x} 480 Q{x + 2} {480 - h / 2:.0f} {x + lean} {480 - h}" fill="none" stroke="#3b4a36" stroke-width="5" stroke-linecap="round"/>')
    f.card("And they heard the sound of the LORD God walking in the garden", "Genesis 3:8", 22)


def canopy(f):
    for x, y, r in ((40, 60, 56), (132, 34, 52), (224, 66, 58), (26, 180, 52), (250, 190, 50), (54, 300, 56), (226, 306, 54), (130, 392, 60), (34, 430, 44), (240, 430, 46)):
        f.blob(x, y, r, "#262a3c")
    f.raw('<ellipse cx="135" cy="214" rx="52" ry="62" fill="#4c5060"/>')
    f.raw('<circle cx="124" cy="214" r="8" fill="#dcd8cc"/><circle cx="146" cy="220" r="8" fill="#a8a496"/>')


def s16(f):
    canopy(f)
    f.card("And no creature is hidden from his sight", "Hebrews 4:13", 352)


def s17(f):
    hiding(f)


def s18(f):
    hiding(f)
    f.ripple(-30, 330, (70, 120, 170, 220), -44, 34, width=2.6)
    f.camera("push")


def s19(f):
    f.leaf(70, 110, 2.0, -30, "#5b5340")
    f.tag("Genesis 3:19", 462)
    f.hand(136, 300, 2.2, 176, "#2b2722", "#20252a")
    for i in range(34):
        x, y = 86 + (i * 37 % 96), 330 + (i * 53 % 136)
        f.raw(f'<circle cx="{x}" cy="{y}" r="{1 + i % 2}" fill="#3b3a36"/>')


def edge(f):
    f.wash(0, "#c9b58d", height=300)
    f.wash(296, "#a58f68")
    f.raw(f'<circle cx="214" cy="178" r="24" fill="#e6d7ae"/>')
    f.tree(16, 340, 230, "#3f4e3b")
    f.tree(70, 330, 170, "#4a5a44")
    f.blob(4, 332, 62, "#3f4e3b")


def s20(f):
    edge(f)
    f.person(150, 356, 40, "walk")
    f.person(176, 358, 38, "walk", "#57504a")
    f.tag("Genesis 3:23", 450)
    f.camera("pull")


def s21(f):
    f.glow(135, 200, 170, strength=.1)
    f.bust(86, 150, 30, "#3a3028", cloak="#7b5a3c", facing=1, skin="#b8a88e")
    f.bust(186, 158, 28, "#3a3028", cloak="#8a6846", facing=-1, skin="#c4b49c")
    for x, y, r in ((44, 276, -30), (226, 292, 40), (134, 312, 12)):
        f.leaf(x, y, 1.2, r, "#7b8560")
    f.ripple(135, 40, (80, 104), 50, 130, width=2.2)
    f.card("And the LORD God made for Adam and for his wife garments of skins and clothed them", "Genesis 3:21", 340)


def s22(f):
    f.glow(150, 190, 150, strength=.09)
    f.bust(150, 170, 62, "#3a3028", cloak="#7b5a3c", facing=-1, skin="#c4b49c", look=-6)
    f.hand(72, 420, 1.4, 22, "#a08d76", "#8a6846")


def s23(f):
    f.stars(110, 480)
    f.earth(135, 232, 96)
    f.glow(150, 218, 46, strength=.2)
    f.raw(f'<circle cx="150" cy="218" r="4.5" fill="{GOLD}"/>')
    f.card("For God so loved the world,", "John 3:16", 372)
    f.camera("push")


def s24(f):
    f.glow(135, 208, 170, strength=.11)
    f.hill(318, "#2a2a38", 135, 30)
    f.cross(135, 300, 74)
    f.raw('<path d="M135 252 V284 M114 247 Q135 254 156 247" fill="none" stroke="#efe4c8" stroke-width="4" stroke-linecap="round"/><circle cx="135" cy="244" r="4.5" fill="#efe4c8"/>')
    f.card("that he gave his only Son", "John 3:16", 372)


def s25(f):
    hiding(f)
    f.ripple(-30, 330, (70, 120, 170, 220), -44, 34, width=2.6)
    f.wash(0, "#0a0b12", .34)


def s26(f):
    f.leaf(52, 96, 2.6, -18, "#23273a")
    f.bust(138, 214, 74, "#c7c2b4", cloak="#3a3f52", facing=-1, eyes="shut", skin="#4e5266")
    f.leaf(222, 342, 3.0, 26, "#23273a")
    f.hand(44, 430, 1.1, 30, "#a8a496", "#2b2f40")


def s27(f):
    f.trunks([14, 52, 88, 186, 226, 262], width=20)
    f.wash(410, "#191b28")
    f.ripple(135, 40, (150, 210, 270, 330), 66, 114, width=2.4)
    f.raw(f'<line x1="135" y1="96" x2="135" y2="404" stroke="{GOLD}" stroke-width="2.2" stroke-dasharray="2 7" stroke-linecap="round"/>')
    f.huddle(124, 424, 20, f.t["ink"], lifted=True)
    f.huddle(146, 425, 18, "#a8a496", facing=-1, lifted=True)
    f.word("Where are you?", 135, 214, 30, "#fbf3df")
    f.word("GENESIS 3:9", 135, 236, 11, "#cfc7b4", weight=600)


def s28(f):
    canopy(f)
    f.ripple(135, 216, (72, 88), 0, 359, width=2.6)


def s29(f):
    f.glow(135, 60, 300, strength=.1)
    f.bust(92, 250, 56, "#c7c2b4", cloak="#3a3f52", facing=1, skin="#8f8772", look=-6)
    f.bust(190, 262, 52, "#a8a496", cloak="#343848", facing=-1, skin="#9c927c", look=-6)
    f.ripple(135, 30, (96, 124), 50, 130, width=2.4)


def s30(f):
    f.raw('<rect x="166" y="70" width="84" height="170" fill="#77758a"/><line x1="208" y1="70" x2="208" y2="240" stroke="#343446" stroke-width="4"/><line x1="166" y1="150" x2="250" y2="150" stroke="#343446" stroke-width="4"/>')
    f.raw('<path d="M166 240 L250 240 L176 480 L40 480 Z" fill="#77758a" opacity=".26"/>')
    f.bust(92, 250, 56, "#26263a", cloak="#556070", facing=1, skin="#9c927c", look=-4)
    f.hand(58, 424, 1.15, 18, "#9c927c", "#556070")


def s31(f):
    space(f, 372, 12); f.camera("pull")


def s32(f):
    f.stars(90, 480)
    f.earth(135, 262, 128, sea="#1b2438", land="#2c3440", lights=120)
    f.camera("push")


def s33(f):
    f.glow(214, 300, 150, strength=.11)
    f.raw(f'<circle cx="214" cy="300" r="24" fill="{GOLD}"/>')
    f.wash(304, "#6e5f50")
    f.person(98, 374, 96, "walk", "#231f26")
    f.person(136, 378, 90, "walk", "#3b3540")
    f.raw(f'<path d="M104 298 Q116 306 110 330 M142 306 Q152 312 148 334" fill="none" stroke="{GOLD}" stroke-width="2.4" stroke-linecap="round"/>')
    f.camera("track")


def s34(f):
    you_on_hill(f, gold=True)
    f.word("FOURTH WATCH", 135, 456, 12, "#dcd8cc", weight=600)


# Shots ---------------------------------------------------------------------

def shot(i, section, words, draw, tone, **k):
    return {"id": f"S{i:02d}", "section": section, "words": words, "draw": draw, "tone": tone, **k}


A = list(SECTIONS)
SHOTS = [
    shot(1, A[0], "If God doesn't need anything,", s01, "night", sketch="night", picture="The whole universe turning by itself: a galaxy, a sun, planets. The camera falls fast toward one small Earth.", feel="Awe", understand="All of this runs without us", size="extreme-wide", angle="high", move="crane", move_percent=70, move_job="hook-reveal", why="Start at the biggest scale so the next shot feels tiny", acting="No people yet", beat_on=["need"], text="", fidelity="VISUAL_SYMBOL", route="still", credits=2.75),
    shot(2, A[0], "why did he make you?", s02, "night", picture="One tiny person on a dark hill under a huge sky.", feel="Small, and a little exposed", understand="This is about you", size="extreme-wide", angle="low", move="locked", move_percent=0, why="This is the frame the whole film comes back to. Keep the size and position exact", acting="The person lifts their head on 'you'", beat_on=["you"], text="", fidelity="VISUAL_SYMBOL", route="still", credits=2.75),
    shot(3, A[1], "The Bible says in Acts 17:25 that God doesn't need anything from us.", s03, "day", picture="Sun, sea, mountains and birds, all moving without a single person. The verse card sits low in the frame.", feel="Curious", understand="This claim comes from the Bible", size="wide", angle="low", move="pan", move_percent=10, why="The world running without us shows the verse before we explain it", acting="Waves roll on 'God'. Birds cross on 'need'", beat_on=["Acts", "God", "need", "from"], text="Acts 17:25: \"nor is he served by human hands, as though he needed anything\"", fidelity="TEXT", route="still", credits=2.75),
    shot(4, A[1], "But we all want to feel needed.", s04, "day", picture="A small child's hand reaches up and takes an adult's hand.", feel="Warm and familiar", understand="Being needed feels good", size="insert", angle="eye", move="locked", move_percent=0, why="One plain human picture of being needed", acting="The small hand closes on 'needed'", beat_on=["want", "needed."], text="", fidelity="VISUAL_SYMBOL", route="code", credits=0),
    shot(5, A[1], "So do we even matter to him?", s05, "dusk", picture="Looking straight down at the same person, now alone, with their hands open.", feel="Exposed", understand="The real worry", size="wide", angle="high", move="pull", move_percent=12, why="The high angle makes them small. The empty hands answer the child's hand before it", acting="They open their hands on 'matter'", beat_on=["matter"], text="", fidelity="VISUAL_SYMBOL", route="code", credits=0),

    shot(6, A[2], "Maybe he was lonely. But that would mean he needed us.", s06, "chalk", picture="A chalk drawing of a table with one lamp and empty chairs, and the word LONELY? One chalk line strikes it out.", feel="Quick and clear", understand="That idea fails", size="medium", angle="eye", move="locked", move_percent=0, why="Chalk marks this as an idea, so nobody mistakes it for something that happened", acting="The word writes on 'lonely'. The line strikes on 'needed'", beat_on=["lonely.", "But", "needed"], text="LONELY? (crossed out)", fidelity="VISUAL_SYMBOL", route="code", credits=0),
    shot(7, A[2], "Maybe he wanted our worship. He deserves it, but he doesn't need it.", s07, "chalk", picture="A chalk crowd with raised hands under chalk stars, and the word WORSHIP? The line strikes it out.", feel="Respectful, then surprised", understand="He's worthy of it, and he still doesn't need it", size="wide", angle="eye", move="pull", move_percent=14, why="Pulling back shows how small the crowd is, without mocking it", acting="Hands rise on 'worship'. Line strikes on 'need'", beat_on=["worship.", "deserves", "need"], text="WORSHIP? (crossed out)", fidelity="VISUAL_SYMBOL", route="code", credits=0),

    shot(8, A[3], "So what's the real reason? Revelation 4:11 says he created everything because he chose to.", s08, "gold", picture="The chalk blows away. Gold light breaks out of the dark, and sea, land, trees and birds appear from it.", feel="Wonder", understand="He made everything because he chose to", size="extreme-wide", angle="low", move="push", move_percent=10, why="First gold in the film, because this is the first time God acts", acting="Each thing appears on 'created' and 'everything'", beat_on=["real", "Revelation", "created", "everything", "chose"], text="Revelation 4:11: \"by your will they existed and were created\"", fidelity="TEXT", route="code", credits=0),
    shot(9, A[3], "But would he still want us if we turned against him?", s09, "day", picture="The light settles into a garden. Two people walk together, and the shadow of a tree slides across them.", feel="Unease", understand="The real test is coming", size="wide", angle="high", move="crane", move_percent=16, move_job="carry", why="The shadow says what's coming before the story starts", acting="They walk easily. The shadow reaches them on 'turned'", beat_on=["still", "turned"], text="", fidelity="VISUAL_SYMBOL", route="still", credits=2.75),

    shot(10, A[4], "In Genesis, God told Adam and Eve not to eat from one tree.", s10, "day", picture="From above, a full garden with one tree standing alone. Adam and Eve look at it.", feel="Clear and simple", understand="There was one rule", size="extreme-wide", angle="high", move="push", move_percent=8, why="The viewer needs this fact, or the fruit means nothing", acting="A gold ripple comes down on 'told'. They turn toward the tree on 'one'", beat_on=["told", "Adam", "one"], text="GENESIS 2:17", fidelity="TEXT", route="reused", credits=0),
    shot(11, A[4], "But the serpent tells Eve she'll \"be like God\" if she does.", s11, "day", picture="Over the serpent's coils as it slides down a branch toward Eve. The fruit hangs between them.", feel="Danger", understand="The lie", size="medium", angle="over-shoulder", move="track", move_percent=8, why="Seeing it from behind the serpent puts us too close", acting="Its head stops by Eve on 'tells'. She looks up at the fruit on 'like'", beat_on=["serpent", "Eve", "like", "if"], text="GENESIS 3:5", fidelity="TEXT", route="still", credits=2.75),
    shot(12, A[4], "She eats the fruit.", s12, "day", picture="Her hand brings the fruit up, and she bites. It isn't drawn as an apple, because Genesis doesn't name the fruit.", feel="A sharp stop", understand="It's done", size="extreme-close", angle="eye", move="locked", move_percent=0, why="The verb lands on its word, with nothing else in frame", acting="Bite on 'eats'. Nothing moves after it", beat_on=["fruit."], text="", fidelity="TEXT", route="code", credits=0),
    shot(13, A[4], "She gives some to Adam, and he eats.", s13, "day", picture="She holds it out. He takes it and eats.", feel="Sinking", understand="Both of them did it", size="medium", angle="eye", move="locked", move_percent=0, why="Keep both people in one frame so giving and eating stay linked", acting="She reaches on 'gives'. He bites on 'eats'", beat_on=["Adam,", "eats."], text="", fidelity="TEXT", route="still", credits=2.75),
    shot(14, A[4], "They realize they're naked, and they sew fig leaves together.", s14, "cold", picture="All the color drains out of the garden. Their hands stitch big fig leaves together.", feel="Shame", understand="Something has broken", size="insert", angle="eye", move="locked", move_percent=0, why="Stay on hands, so the shame reads without showing bodies", acting="Color drains on 'realize'. Hands pull the thread on 'sew'", beat_on=["naked,", "sew"], text="", fidelity="TEXT", route="code", credits=0),
    shot(15, A[4], "Genesis 3:8 says they hear God walking in the garden, and they hide.", s15, "cold", picture="We never see God. Grass and leaves bend in a line moving toward them, with a gold edge. They run for the dark trees.", feel="Fear", understand="God is near, and the Bible says so", size="wide", angle="low", move="track", move_percent=10, why="The sound moves through the garden. This keeps Genesis 3:8 true without drawing God as a man", acting="Their heads turn on 'walking'. They run on 'hide'", beat_on=["Genesis", "hear", "walking", "garden,", "hide."], text="Genesis 3:8: \"And they heard the sound of the LORD God walking in the garden\"", fidelity="TEXT", route="code", credits=0),
    shot(16, A[4], "Hebrews 4:13 says no one is hidden from God.", s16, "night", picture="From high above the trees. Through one gap, the two of them are plainly visible.", feel="Caught", understand="Their hiding doesn't work", size="extreme-wide", angle="top", move="locked", move_percent=0, why="The view from above answers the hiding. We'll use this frame again", acting="They press themselves down on 'hidden'", beat_on=["Hebrews", "no", "hidden"], text="Hebrews 4:13: \"And no creature is hidden from his sight\"", fidelity="TEXT", route="code", credits=0),
    shot(17, A[4], "God doesn't need them. He could just leave them there.", s17, "night", picture="In the dark trees. The two of them crouch without moving. The moving leaves have stopped.", feel="Dread, and silence", understand="God owes them nothing", size="wide", angle="eye", move="locked", move_percent=0, hold=.7, why="The one planned stillness before the call", acting="Nothing moves. Her hand tightens on his arm on 'leave'", beat_on=["leave"], hold_beats=[.5], text="", fidelity="INFERRED", route="still", credits=2.75),
    shot(18, A[4], "But he calls out to them. We'll come back to what he said.", s18, "night", picture="A gold ripple moves through the trees and reaches them. Their heads lift. Then the whole frame freezes.", feel="Breath held", understand="He called. What did he say?", size="medium", angle="eye", move="push", move_percent=6, why="We hold back his words so they land at the end. The freeze keeps the question open", acting="Heads lift on 'calls'. Everything freezes on 'We'll'", beat_on=["calls", "We'll", "said."], text="", fidelity="TEXT", route="reused", credits=0),

    shot(19, A[5], "There are consequences. They will die,", s19, "cold", picture="A dried fig leaf. Dust falls through an open hand.", feel="Grief", understand="The cost is real", size="close", angle="eye", move="locked", move_percent=0, why="Dust comes from Genesis 3:19. It shows death with no violence", acting="The hand opens on 'die'", beat_on=["They", "die,"], text="GENESIS 3:19", fidelity="TEXT", route="code", credits=0),
    shot(20, A[5], "and God sends them out of the garden.", s20, "day", picture="The edge of the green garden and dry land beyond it. Two small people walk toward the dry land. No gate.", feel="Loss", understand="They lose the garden", size="extreme-wide", angle="eye", move="pull", move_percent=12, why="Show how much is behind them", acting="They stop just short of the dry land on 'garden'", beat_on=["sends", "garden."], text="GENESIS 3:23", fidelity="TEXT", route="still", credits=2.75),
    shot(21, A[5], "But before they leave, Genesis 3:21 says God makes them clothes.", s21, "gold", picture="Gold ripples settle over them. The fig leaves fall away, and clothes of skin rest on their shoulders.", feel="Surprise, and tenderness", understand="He is still caring for them", size="medium", angle="eye", move="locked", move_percent=0, why="Gold returns because the text says God did this", acting="They look up on 'before'. The leaves fall on 'makes'", beat_on=["before", "Genesis", "makes", "clothes."], text="Genesis 3:21: \"And the LORD God made for Adam and for his wife garments of skins and clothed them.\"", fidelity="TEXT", route="reused", credits=0),
    shot(22, A[5], "They turned against him, and he's still taking care of them.", s22, "gold", picture="Eve's fingers touch the clothing. She looks up. The verse card stays until she does.", feel="Moved", understand="The test is answered", size="close", angle="eye", move="push", move_percent=5, why="Let the viewer feel it on a face", acting="Her fingers touch the cloth on 'turned'. She looks up on 'still'", beat_on=["against", "still", "care"], text="(Genesis 3:21 card holds to 'against')", fidelity="INFERRED", route="code", credits=0),
    shot(23, A[5], "And he never stopped. John 3:16 says, \"For God so loved the world,", s23, "gold", picture="We rise above the land and time passes across the Earth. One gold point appears on the planet.", feel="The scale opens up", understand="It didn't end in the garden", size="extreme-wide", angle="high", move="push", move_percent=18, move_job="travel", why="This links the garden to Jesus", acting="Sun and moon race on 'never stopped'. The point lights on 'loved'", beat_on=["never", "John", "loved", "world,"], text="John 3:16: \"For God so loved the world,\"", fidelity="TEXT", route="code", credits=0),
    shot(24, A[5], "that he gave his only Son.\"", s24, "gold", picture="A far-off hill. One cross in gold light, with Jesus lit and in color. No blood, and no closeness.", feel="Awe", understand="How far he went", size="wide", angle="low", move="locked", move_percent=0, why="Stay far away and hold. The verse does the work", acting="Stillness. The light grows on 'Son'", beat_on=["gave", "Son."], text="\"that he gave his only Son\"", fidelity="TEXT", route="still", credits=2.75),

    shot(25, A[6], "Here's what he said.", s25, "night", picture="Back to the frozen frame in the dark trees. The music cuts out, and the gold ripple starts moving again.", feel="Everything stops", understand="This is what we were waiting for", size="medium", angle="eye", move="locked", move_percent=0, why="The freeze from shot 18 pays off", acting="The freeze lets go on 'said'", beat_on=["said."], text="", fidelity="TEXT", route="reused", credits=0, hold=.3),
    shot(26, A[6], "God's first words to them aren't \"How could you?\"", s26, "night", picture="Adam's face in the leaves. His eyes are shut tight. He's braced for it.", feel="Dread", understand="We all expect anger here", size="close", angle="eye", move="push", move_percent=5, why="We feel what he expects to hear", acting="He flinches on 'How'", beat_on=["first", "How"], text="", fidelity="INFERRED", route="ai-clip", credits=5),
    shot(27, A[6], "They're \"Where are you?\"", s27, "gold", picture="The whole dark garden, huge. Two tiny people. One thin gold line reaches them. The words fill the sky.", feel="Stunned, then held", understand="He called for them", size="extreme-wide", angle="eye", move="locked", move_percent=0, hold=3.0, why="The longest hold in the film. Silence after the words, with one small change inside it", acting="His eyes open on 'Where'. The gold line reaches them during the silence", beat_on=["Where"], hold_beats=[1.0, 2.2], text="Where are you? / GENESIS 3:9", fidelity="TEXT", route="reused", credits=0),

    shot(28, A[7], "He already knew where they were.", s28, "gold", picture="The same view from above as shot 16, now with a gold ring around them.", feel="Understanding", understand="It wasn't a real question", size="extreme-wide", angle="top", move="locked", move_percent=0, why="Same frame, new meaning. Nothing new is introduced", acting="The ring closes on 'knew'", beat_on=["knew"], text="", fidelity="INFERRED", route="reused", credits=0),
    shot(29, A[7], "He didn't need an answer. He wanted them.", s29, "gold", picture="Both faces lift into warm gold light.", feel="Relief", understand="Need and want. This is the whole film", size="close", angle="low", move="locked", move_percent=0, hold=.6, why="The film's one idea lands on their faces", acting="Eyes open on 'answer'. The light reaches them on 'wanted'", beat_on=["need", "wanted"], text="", fidelity="INFERRED", route="ai-clip", credits=5),

    shot(30, A[8], "So when we fail, we don't have to hide from him.", s30, "dusk", picture="Match cut: Adam's face becomes the face of the person from the opening, in the same spot in the frame, alone in a dim room. They lower their hands and look toward the window.", feel="Seen, and comforted", understand="This is about us", size="close", angle="eye", move="locked", move_percent=0, why="The face stays in the same spot through the cut, which ties the garden to our lives with no new idea", acting="Hands lower on 'hide'. They turn to the light on 'him'", beat_on=["fail,", "hide"], text="", fidelity="VISUAL_SYMBOL", route="still", credits=2.75),

    shot(31, A[9], "He didn't make us because he needed us.", s31, "night", picture="The camera pulls back out to the universe from shot 1, turning on its own.", feel="Calm", understand="The opening question again", size="extreme-wide", angle="high", move="pull", move_percent=40, move_job="carry", why="Shot 1 in reverse", acting="No people", beat_on=["make", "needed"], text="", fidelity="VISUAL_SYMBOL", route="reused", credits=0),
    shot(32, A[9], "He made us because he wanted us.", s32, "gold", picture="We come back down to the Earth at night, covered in warm lights.", feel="Warmth", understand="Every person", size="extreme-wide", angle="top", move="push", move_percent=20, move_job="carry", why="The same scale as the last shot, but now it's full of people", acting="Lights come on across the Earth from 'wanted'", beat_on=["made", "wanted"], text="", fidelity="VISUAL_SYMBOL", route="code", credits=0),
    shot(33, A[9], "If he still wanted Adam and Eve after all that,", s33, "gold", picture="Sunrise on the dry land. Adam and Eve walk on in their clothes, with gold light on their shoulders.", feel="Hope", understand="They weren't abandoned", size="wide", angle="low", move="track", move_percent=8, why="Their last picture is a warm one", acting="She turns her head to the sun on 'still'", beat_on=["still", "Eve"], text="", fidelity="VISUAL_SYMBOL", route="reused", credits=0),
    shot(34, A[9], "why would he ever stop wanting you?", s34, "gold", picture="The opening picture: the same person on the same hill under the same stars. Now they're in gold light, hands open.", feel="Happy and encouraged", understand="He hasn't stopped", size="extreme-wide", angle="low", move="locked", move_percent=0, hold=3.0, why="The final image is the answer, in the exact frame of shot 2", acting="They open their hands on 'you'", beat_on=["ever", "you?"], hold_beats=[1.2], text="FOURTH WATCH logo after the last word", fidelity="VISUAL_SYMBOL", route="reused", credits=0, callback=True),
]


def spoken_length(token):
    extra = 3 if re.search(r"\d+:\d+", token) else 0
    return (1 + extra) / RATE


def build():
    t, shots, last_word = 0.0, [], 0.0
    for s in SHOTS:
        start = round(t, 2)
        at, beats, pending, cursor = {}, [], list(s["beat_on"]), t
        for token in s["words"].split():
            clean = token.strip('"').rstrip(".,?!").lower()
            if pending and clean == pending[0].rstrip(".,?!").lower():
                beats.append(round(cursor, 2))
                pending.pop(0)
            cursor += spoken_length(token)
            if token.rstrip('"')[-1] in ".?!":
                cursor += SENTENCE_PAUSE
        if pending:
            raise SystemExit(f"{s['id']}: no word to match {pending}")
        last_word = cursor
        for b in s.get("hold_beats", []):
            beats.append(round(cursor + b, 2))
        cursor += s.get("hold", 0)
        t = cursor
        row = {k: v for k, v in s.items() if k not in ("draw", "beat_on", "hold", "hold_beats", "sketch")}
        beats = [b for b in beats if start < b < round(t, 2)]
        row.update(start=start, end=round(t, 2), beats=beats, callback=s.get("callback", False), move_job=s.get("move_job", ""))
        shots.append(row)
        frame = Frame("cold" if s["tone"] == "cold" else {"gold": "night", "chalk": "chalk", "night": "night", "dusk": "dusk", "day": "day"}[s["tone"]], seed=len(shots))
        s["draw"](frame)
        frame.write(HERE / "frames" / f"{s['id']}.svg")
    board = {
        "name": "Where Are You Storyboard",
        "title": "If God doesn't need anything, why did he make you?",
        "message": "God doesn't need us. He made us because he wanted us, and he still wanted us when we hid from him.",
        "timing": "estimated",
        "last_word_end": round(last_word, 2),
        "sections": SECTIONS,
        "shots": shots,
    }
    (HERE / "storyboard.json").write_text(json.dumps(board, indent=2, ensure_ascii=False) + "\n")
    print(len(shots), "shots", round(t, 1), "s, last word", round(last_word, 1))


if __name__ == "__main__":
    build()
