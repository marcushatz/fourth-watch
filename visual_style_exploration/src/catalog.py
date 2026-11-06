"""The written record for every candidate: how it was made, what it could become, and what remains unknown.

Four judgments stay separate on purpose: artistic ceiling, current execution, production feasibility, audience evidence.
"""

PIPE = "A posed CC0 MakeHuman figure with grown hair, rendered as a still in Blender Cycles, then treated in Python from the render's light, depth and surface passes."
REUSE_3D = "The cast rig, hair grower, leaf and tree generators, and every Blender scene. New people come from the same base mesh."
MOVE_3D = "Pose the rig, then render key poses. At this machine's speed a full-quality frame takes minutes, so plan held poses, slow moves and short loops rather than full-frame character animation."
CAM_3D = "Real 3D camera moves are possible. Parallax can also come cheaply by splitting a still at its depth pass."
ACT_3D = "Turns, walks and reaches come from the rig. Face acting is limited to the base mesh's expression shapes, so posture and light must carry feeling."
ROBES = "Robes and period clothing aren't built yet."

S = []


def style(id, name, short, desc, refs, build, reuse, animate, camera, acting, generated, risks, ceiling, current, feasibility, audience):
    S.append(dict(id=id, name=name, short=short, desc=desc, refs=refs, build=build, reuse=reuse, animate=animate, camera=camera, acting=acting, generated=generated, risks=risks,
                  ceiling=ceiling, current=current, feasibility=feasibility, audience=audience))


R = {
    "bp": dict(name="BibleProject", url="https://alabasterco.com/blogs/articles/jon-collins"),
    "kz": dict(name="Kurzgesagt", url="https://rosetta.to/u/kurzgesagt/how-to-make-a-kurzgesagt-video-in-1200-hours"),
    "pw": dict(name="Pursuit of Wonder", url="https://creatordb.app/creatorstats/pursuitofwonder/"),
    "fern": dict(name="fern", url="https://vidanalyze.com/channel/fern-tv/about"),
    "zack": dict(name="Zack D. Films", url="https://vidiq.com/youtube-stats/channel/@zackdfilms/"),
    "cs": dict(name="Cartoon Saloon", url="https://blog.frame.io/2021/05/03/made-in-frame-wolfwalkers/"),
    "arc": dict(name="Arcane", url="https://80.lv/articles/arcane-artists-show-how-they-combine-traditional-art-3d-for-backgrounds"),
    "hd": dict(name="Octopath Traveler", url="https://en.wikipedia.org/wiki/HD-2D"),
    "gc": dict(name="Go Chatter Studios", url="https://www.e-n.org.uk/features/how-the-gospel-is-going-viral-with-lego/"),
    "kok": dict(name="The King of Kings", url="https://en.wikipedia.org/wiki/The_King_of_Kings_(2025_film)"),
    "as": dict(name="After Skool", url="https://creatordb.app/creatorstats/afterskool/"),
    "dore": dict(name="Gustave Doré", url="https://www.openculture.com/2024/07/behold-gustave-dores-dramatic-illustrations-of-the-bible-1866.html"),
    "ms": dict(name="MagnatesMedia", url="https://creatordb.app/creatorstats/magnatesmedia/"),
    "hm": dict(name="History Matters", url="https://vidiq.com/youtube-stats/channel/UC22BdTgxefuvUivrjesETjg"),
    "pn": dict(name="The Paper Nativity", url="https://worshiphousemedia.com/mini-movies/62757/the-paper-nativity-directors-cut"),
}

style("01", "Cinematic illustrated 2.5D", "Painted shapes, a hand-inked line and a loose painted forest.",
      "Each region is painted from a short colour ramp chosen by hand, then inked. The background is brushed. It reads as a graphic novel lit like a film.",
      [R["bp"], R["arc"]], PIPE + " Skin, hair and leaves are mapped to hand-picked ramps, inked from the geometry and laid over a brush-painted forest.",
      REUSE_3D + " The colour ramps travel between episodes.", MOVE_3D + " Inked lines must be checked for flicker between frames.", CAM_3D, ACT_3D,
      "Painted backgrounds could be replaced with generated plates if you wanted more detail.", "Lines can shimmer in motion. Ramps need retuning for every new lighting setup. " + ROBES,
      "Very high", "Good", "Medium. Stills are fast, and moving lines need testing.", "Related: illustrated 2D is common among large educational channels, but style alone isn't proven as the cause.")
style("02", "Premium vector animation", "Clean traced shapes with exact edges. A real SVG file.",
      "Light is reduced to clean tone shapes and written out as vector paths, so it stays sharp at any size.",
      [R["kz"]], PIPE + " Tone regions are traced into SVG paths.", "The tone palettes and the tracing step.", "Key poses trace well, but shapes pop between frames unless they're drawn as a true rig.", "Parallax works well. Vector layers are cheap to move.",
      "Turns and reaches need redrawing or retracing. Faces stay simple.", "None needed.", "Our rules reject flat vector gradients as a main style, because they feel generic and carry little light on figures.",
      "High", "Fair", "High. Vector layers animate cheaply once built.", "Strong in education: Kurzgesagt holds about 25.6M subscribers. That doesn't show it fits serious biblical drama.")
style("03", "Illustrated puppet animation", "Flat parts, thick even lines and solid shadow shapes.",
      "Graphic, puppet-like figures with strong black lines and one hard shadow. It's bold and reads instantly on a phone.",
      [dict(name="OverSimplified", url="https://creatordb.app/creatorstats/oversimplified/")], PIPE + " Reduced to two tones per part and a thick outline.", "The rig, plus a part library if it's redrawn as true cut-out pieces.",
      "A true 2D puppet rig would move best: jointed parts driven in code or Higgsedit.", "Layer parallax only.", "Reaching and turning are easy. Walks need a cycle. Faces are simple, so posture carries feeling.", "None needed.",
      "It can look like a comic adaptation rather than a film. Rejected earlier look of round heads and tube arms must stay out.", "High", "Fair", "High. This is the cheapest path to real character motion.", "Related: OverSimplified and The Infographics Show prove simple figures can hold huge audiences, in comic or light tones.")
style("04", "Philosophical minimalist illustration", "One quiet shape, one line of gold and a lot of room.",
      "Everything nonessential is gone. It leans entirely on the narration and on stillness.",
      [R["pw"]], "Figure simplified from the render's silhouette into two flat shapes, with a soft gradient field, paper grain and one gold line.", "A very small kit of shapes, gradients and grain.",
      "Slow shape morphs and small moves. Motion is sparse by design.", "Slow drifts suit it.", "Reaching and hands would need to be designed as symbols. Faces barely exist.", "None needed.",
      "It could feel empty over two minutes. Human interaction is the hard case. It also risks the look of the rejected flat icons.", "High", "Good", "High. Very little to build per shot.", "Related: Pursuit of Wonder holds about 3.5M subscribers with a calm, minimal register.")
style("05", "Stylized cinematic 3D", "Real light on real form, with fog and depth.",
      "A rendered 3D world with soft skin, grown hair, depth fog and film grading. It's the closest thing here to a feature-film frame.",
      [R["fern"], R["zack"], R["kok"]], "Posed CC0 MakeHuman figure with grown hair strands, procedural forest and leaves, path-traced in Blender Cycles, then fogged and graded in Python.",
      REUSE_3D, MOVE_3D, CAM_3D, ACT_3D, "Skin and bark textures could raise detail. Free CC0 texture sets may be enough.",
      "Faces sit close to the uncanny line if pushed toward realism, and our rule bans photorealism. Render time is the largest cost. " + ROBES,
      "Very high", "Strong", "Medium. Still quality is strong. Full animation needs a faster machine or careful limited motion.", "Related: 3D leads the biggest short-form result found here, Zack D. Films at 82B views, and fern's documentaries. Both are different subjects.")
style("06", "Cel-shaded 3D", "Graphic light bands and ink, built on 3D form.",
      "3D people and sets rendered as flat bands of light with inked edges, like a stylized game cinematic.",
      [dict(name="Stylized game cinematics")], PIPE + " Light is cut into three bands per region and inked from geometry.", REUSE_3D, "Very workable: bands and lines come from the geometry each frame, so they stay locked to form.", CAM_3D, ACT_3D, "None needed.",
      "Needs careful shadow design on faces. " + ROBES, "High", "Good", "Medium. Faster than path tracing, since passes need few samples.", "Related: common in games. No Bible short-form evidence found.")
style("07", "HD-2D pixel animation", "Pixel figures inside a soft, lit 3D world.",
      "A pixel sprite stands in a fully lit, foggy world with bloom and shallow focus.",
      [R["hd"]], PIPE + " The figure is reduced to a limited-palette sprite over a soft, bloomed 3D forest.", "The 3D sets and a sprite pipeline.", "Sprite poses can be rendered from the rig, then pixelated, which is an unusual advantage.", CAM_3D, "Turning and walking suit sprites. At this close framing the face loses detail, so wide shots are its natural home.", "None needed.",
      "Close emotional shots are its weakest case, and shot 26 is a close shot. It can read as a video game instead of Scripture.", "High", "Fair", "Medium.", "Related: Dragon Quest III HD-2D Remake was Japan's second best-selling game of 2024. That's a game audience.")
style("08", "Retro pixel storytelling", "Low resolution, a small palette and hard shapes.",
      "A nostalgic, limited-palette frame with heavy simplification.", [dict(name="Classic 16-bit games")], PIPE + " Downsampled to 120 by 213 pixels with a 15-colour palette.", "The palette and downsampling step.", "Frame-by-frame pixel poses from the rig.", "Scrolling layers suit it well.", "Faces become a few pixels, so feeling comes from posture and silhouette.", "None needed.",
      "Nostalgia may fight reverence. Adults may read it as a game joke.", "Medium", "Fair", "High. Very light to produce.", "Related: niche. No Bible evidence found.")
style("09", "Toy-brick miniature cinema", "A bowed brick figure in a macro-lens forest.",
      "A generic toy-brick set shot like a real macro film. No brand assets are used.",
      [R["gc"]], "Figure, bricks, studs and plates modelled in code, with a printed shut-eye face, then path-traced with very shallow focus.", "The brick generators can build any set.", "Stepped limb poses, like stop motion. It forgives simple animation.", CAM_3D, "Reaches and walks are easy. Faces are printed, so acting is minimal.", "None needed.",
      "It can read as children's content, which is Marcus's main fear. Trademark care is needed: never use the LEGO name or logo.", "Medium", "Fair", "High. Geometry is simple and stop-motion timing is forgiving.", "Reported: Go Chatter Studios is described as viral with LEGO Bible stories, with no figures found.")
style("10", "Stylized miniature 3D", "A clay and felt diorama under a warm lamp.",
      "It looks like a real handmade set: sculpted clay, felt leaves and shallow focus.", [dict(name="Independent stop-motion films")], "The same posed figure with solid sculpted hair, clay and felt materials, a dowel forest, a painted backdrop, a fiber-optic line of gold and a very wide aperture.",
      REUSE_3D, "Stepped poses read as stop motion, which suits limited animation.", CAM_3D + " Shallow focus sells the scale.", ACT_3D, "None needed.", "Render time is high because of skin and shallow focus. Clay can feel soft or cute. " + ROBES,
      "Very high", "Good", "Medium.", "Related: no Bible short-form evidence found.")
style("11", "Mature anime-inspired animation", "Clean line, two-tone skin and a brushed forest of light.",
      "Fine line and flat skin over a painted background with light rays. It aims for serious anime film rather than TV comedy.",
      [dict(name="Mature anime films")], PIPE + " Two-tone skin, fine ink, banded hair and a brushed background.", REUSE_3D, "Limited animation is native to this style: holds, slow pans and a few key poses.", CAM_3D, "Key poses work well. Faces are its strength in real anime, and ours are only shaded 3D, so the expressiveness isn't really there yet.", "Character art by a real artist or a generator would raise it most.",
      "Real anime lives on drawing skill. Code can't yet match it. Big-eye conventions are banned by our rules.", "Very high", "Fair", "Medium. The look is reachable, the drawing quality isn't yet.", "Related: anime has a huge audience. No evidence for Bible shorts.")
style("12", "Gouache and ink", "Brushed paint on real paper, with a torn painted edge.",
      "Opaque brush strokes, an ink line and bare paper at the margins. It feels handmade.", [R["cs"]], PIPE + " Layered brush strokes follow the form, with bristle texture, dry-brush ink and a painted paper edge.", "The brush engine and paper textures.",
      "Strokes must be held between frames or they boil. Boiling can be a deliberate look at a low frame rate.", "Depth layers can be separated before painting.", ACT_3D, "None needed.", "Boiling strokes. " + ROBES, "Very high", "Fair", "Medium.", "Related: Cartoon Saloon shows the handmade line can carry adult emotion, in features.")
style("13", "Painterly stylized 3D", "3D light and form with brushwork on every surface.",
      "It keeps 3D's solid form and adds visible strokes and colour in the shadows, in the spirit of Arcane's painted 3D.",
      [R["arc"]], PIPE + " Brush strokes follow the surface direction, shadows shift cool, lights shift warm, and silhouettes stay crisp.", REUSE_3D, MOVE_3D + " Strokes must be pinned to surfaces in motion.", CAM_3D, ACT_3D, "Painted textures could raise it further.", "Stroke flicker. Heavy render time. " + ROBES,
      "Very high", "Good", "Medium.", "Related: Arcane shows the technique at the top end. It took a large studio.")
style("14", "Documentary motion collage", "Torn paper, a map, a halftone forest and a typed line.",
      "A layered documentary page: engraved figure, map strip, newsprint forest and typed Scripture.", [R["ms"]], "Engraved figure, cut out with a paper margin, over torn layers of halftone print and map, with typed ESV words and a gold foil strip.", "The tear, halftone and type kit.",
      "Pieces slide and settle rather than act.", "Excellent parallax, since everything is already a layer.", "Characters barely act, so it suits explanation more than story.", "Original art only. Never use others' footage.",
      "It distances the viewer from the emotion. It suits history and explanation more than drama.", "High", "Good", "High.", "Related: documentary editing holds strong audiences, such as MagnatesMedia at about 1.86M subscribers.")
style("15", "Whiteboard and illustrated revelation", "A marker drawing on a white board.",
      "Ink lines and hatching on white, with one gold marker stroke. Drawings can be revealed as the narrator speaks.", [R["as"]], PIPE + " Lines come from the geometry, hatching from the shadows.", "The line and hatch tools, for any pose.", "Reveal the drawing stroke by stroke, a very natural fit for code.", "Pans and zooms across a large board.", "Characters hold poses. Acting comes in drawn beats.", "None needed.", "White frames can't deliver night, darkness or awe, and the brand is dark.",
      "High", "Good", "High. Stroke reveals are cheap and very readable.", "Related: After Skool holds about 3.79M subscribers for ideas, not drama.")
style("16", "Editorial ink illustration", "Solid black brush ink, cold wash and bare paper.",
      "A printed-page look: heavy ink, one cold wash and one gold line, with very strong contrast.", [dict(name="Editorial illustration")], PIPE + " Light is cut to solid ink with dry-brush edges and a single wash.", "The ink treatment and palette.", "Works well in held frames. Moving ink edges need care.", "Depth layers can be split.", "Posture and strong shadow carry feeling very well. Fine faces are simple.", "None needed.", "Hands and faces can go too dark. Can feel like a poster rather than a film over two minutes.",
      "Very high", "Strong", "Medium to high.", "Related: no direct video evidence found.")
style("17", "Animated historical atlas", "The garden as a living map, with gold footsteps.",
      "The story seen from above as an illuminated map: four rivers, a forest and a gold path walking toward the two who hide.", [dict(name="History on Maps", url="https://vidiq.com/youtube-stats/channel/UC7JrMLRDJLUh5BPBYykMcrQ")], "Built directly in Python: terrain, contours, rivers, inked trees and set type. The river courses are symbolic, not geography.", "The whole map kit carries to any Bible geography.",
      "Moving dots, paths and camera drifts. Very cheap.", "Slow map moves are its native language.", "Characters are tiny marks, so it can't do faces or hands.", "None needed.", "It can't carry close human emotion. It's better as a recurring device than a whole film. Its placement of Eden must stay labelled symbolic.",
      "High", "Good", "High.", "Related: map channels do well in history, but I couldn't verify figures for them.")
style("18", "Stylized low-poly 3D", "Faceted stone-like people in a columned forest.",
      "Everything is cut into flat planes. It's severe and sculptural, closer to a carved relief than a toy.", [dict(name="Low-poly indie games")], "The same pose reduced to flat facets, with solid hair, six-sided trunks and faceted leaves, rendered in Cycles.", REUSE_3D + " Decimation runs on any scene.", "Works with the rig, and renders much faster than full detail.", CAM_3D, "Reaches and turns are fine. Faces lose detail but keep a mask-like gravity.", "None needed.", "May feel cold. Simple forms can feel like a game.",
      "High", "Good", "High for 3D. Flat shading needs few samples.", "Related: no Bible evidence found.")
style("19", "Digital painted storybook cinema", "Rich soft paint, warm against cold, with no line.",
      "A full digital painting: soft edges, deep colour and layers of paint, built to feel like a mature illustrated film rather than a children's book.", [dict(name="Painted animated features")], PIPE + " Five brush sizes from broad to fine, warm and cool colour separation, and a soft depth blur.", "The painter and colour separation.", "Best with held paintings split into depth layers, plus small puppeted moves.", "Layered parallax is the natural camera for this style.", ACT_3D, "Generated paintings would raise this most, if you ever want to spend credits.", "Boiling strokes if every frame is repainted. So hold paintings instead.",
      "Very high", "Strong", "Medium to high, if paintings are held and moved in layers.", "Related: painted features can carry adult emotion. No short-form proof.")
style("20", "Refined cut paper 2.5D", "Our earlier look, kept as the control.",
      "Stacked textured paper with real shadows, torn edges and sculpted faces. These are the code-drawn stills from the side-by-side test, not new work.", [R["pn"]], "Drawn in Python as a paper stage: sheets at real heights, torn edges and sculpted paper planes.", "The paper engine, head and hand kits.", "Jointed layers animate well in Higgsedit.", "Parallax is native.", "Limited: profile faces and jointed arms. A new pose means new drawing.", "None needed.",
      "New angles need new art, since it isn't 3D. Marcus and the AIs worried it can look childish in daylight.", "High", "Good", "High for motion, medium for new poses.", "Related: The Paper Nativity shows paper can feel reverent. That was real paper, filmed live, and it isn't Reels evidence.")
style("21", "Bible engraving", "Added in research: lines that swell with shadow, in the Doré tradition.",
      "Black lines on warm paper that bend over the form. Christian readers have seen Scripture illustrated this way for centuries.", [R["dore"]], PIPE + " Parallel lines swell in shadow, follow the surface and cross in the darkest areas.", "The hatch engine works on any render.", "Lines can be anchored to surfaces, or held and moved as layers. Screen-locked lines would look like a shower door, so this must be tested.", CAM_3D, ACT_3D, "None needed.", "Fine lines can flicker or moiré on phones. Dark scenes can lose form. " + ROBES,
      "Very high", "Strong", "Medium. Line stability is the open question.", "Related: Doré's 241 Bible engravings are a historic reference. No short-form evidence found.")
style("22", "Stained glass light", "Added in research: the scene as a lit church window.",
      "The frame is cut into glass panes with lead lines and light behind it. It's unmistakably Christian and rare on feeds.", [dict(name="Church window tradition")], PIPE + " Regions become saturated panes with glass texture, backlight and lead lines.", "The glass treatment works on any render.", "Panes must stay fixed while light moves behind them. Best as slow light changes and held scenes, with reveals pane by pane.", "Light moves behind a still window. Real camera moves break the illusion.", "Faces are coarse. Feeling comes from colour and light.", "None needed.", "Faces and hands are coarse at close range. Over two minutes it could feel static. Colour runs richer than the muted palette.",
      "Very high", "Good", "Medium.", "No direct evidence found. This is the most distinctive frame here for a Christian feed, which is a judgment, not a measurement.")

FINDINGS = [
    "No style owns this format. Stick figures, vector art, 3D and ink all hold very large audiences.",
    "Audiences accept simple art when the idea is strong, so polish alone won't decide this.",
    "Serious biblical emotion has worked in animation at scale. The King of Kings earned an A+ CinemaScore and $83.5M worldwide, but it's a feature film.",
    "BibleProject changes style between videos. Jon Collins says a shared script tone holds them together, and emotional topics want more characters and acting.",
    "Distinctive looks tend to come from one strict rule, like Obra Dinn's two tones or Arcane's paint over 3D.",
    "I found no retention data by visual style. Nothing here proves any look will perform.",
]
RESEARCH_NOTE = "Figures are channel totals from trackers or articles, with their dates in the full report. They measure a channel, not a style. I couldn't confirm current figures for Simple History, Casually Explained or The Paint Explainer."
RESEARCH = [
    dict(name="BibleProject", url="https://www.wikiwand.com/en/articles/BibleProject", style="Varied 2D by topic", result="Over 620M views, start of 2024", status="Verified", repro="In part", gravity="Yes"),
    dict(name="Kurzgesagt", url="https://rosetta.to/u/kurzgesagt/how-to-make-a-kurzgesagt-video-in-1200-hours", style="Premium vector", result="25.6M subscribers, about 1,200 hours a video", status="Verified", repro="Shapes yes, hours no", gravity="Weak fit"),
    dict(name="OverSimplified", url="https://creatordb.app/creatorstats/oversimplified/", style="Simple cut-out 2D", result="9.65M subscribers", status="Verified", repro="Yes", gravity="Weak fit"),
    dict(name="Pursuit of Wonder", url="https://creatordb.app/creatorstats/pursuitofwonder/", style="Muted minimal", result="About 3.5M subscribers", status="Verified", repro="Yes", gravity="Yes, quietly"),
    dict(name="History Matters", url="https://vidiq.com/youtube-stats/channel/UC22BdTgxefuvUivrjesETjg", style="Stick figures", result="1.92M subscribers, 810M views", status="Verified", repro="Yes", gravity="Weak fit"),
    dict(name="The Infographics Show", url="https://vidiq.com/youtube-stats/channel/UCfdNM3NAhaBOXCafH7krzrA", style="Simple vector", result="15.1M subscribers, 6.46B views, 2025", status="Verified", repro="Yes", gravity="Weak fit"),
    dict(name="fern", url="https://vidanalyze.com/channel/fern-tv/about", style="3D documentary", result="5.5M subscribers, 666.9M views", status="Verified", repro="Partly", gravity="Yes"),
    dict(name="MagnatesMedia", url="https://creatordb.app/creatorstats/magnatesmedia/", style="Documentary edit", result="About 1.86M subscribers", status="Verified", repro="With original material", gravity="Partly"),
    dict(name="Zack D. Films", url="https://vidiq.com/youtube-stats/channel/@zackdfilms/", style="3D short-form", result="29.6M subscribers, 82.35B views", status="Verified", repro="Partly", gravity="Weak fit"),
    dict(name="Alan Becker", url="https://vidiq.com/youtube-stats/channel/UCbKWv2x9t6u8yZoB3KcPtnw", style="Stick-figure animation", result="31M subscribers, 8.43B views, 2025", status="Verified", repro="The look, not the skill", gravity="Unlikely"),
    dict(name="After Skool", url="https://creatordb.app/creatorstats/afterskool/", style="Whiteboard ink", result="About 3.79M subscribers", status="Verified", repro="Yes", gravity="For ideas"),
    dict(name="3Blue1Brown", url="https://creatordb.app/creatorstats/3blue1brown/", style="Code-driven animation", result="About 8.67M subscribers", status="Verified", repro="Yes", gravity="Not its purpose"),
    dict(name="Go Chatter Studios", url="https://www.e-n.org.uk/features/how-the-gospel-is-going-viral-with-lego/", style="Toy-brick Bible stories", result="Called viral, no numbers given", status="Reported", repro="Yes, in 3D", gravity="Mixed"),
    dict(name="Bible in a Nutshell", url="https://invidious.cleberg.net/@BibleNutshells", style="AI-assisted Bible stories", result="105K to 1.5M views on five videos", status="Verified", repro="With paid generation", gravity="Family tone"),
    dict(name="AI Bible channels", url="https://www.404media.co/why-do-christians-love-ai-slop/", style="AI-generated realism", result="The AI Bible: 270K subscribers", status="Reported", repro="Paid, below our bar", gravity="Unclear"),
    dict(name="The King of Kings", url="https://en.wikipedia.org/wiki/The_King_of_Kings_(2025_film)", style="Feature animation", result="$83.5M, A+ CinemaScore", status="Verified", repro="No, at that level", gravity="Yes"),
    dict(name="Wolfwalkers", url="https://blog.frame.io/2021/05/03/made-in-frame-wolfwalkers/", style="Hand-drawn, woodcut influence", result="Oscar-nominated", status="Verified", repro="The idea", gravity="Yes"),
    dict(name="HD-2D games", url="https://en.wikipedia.org/wiki/HD-2D", style="Pixel sprites in 3D", result="Dragon Quest III HD-2D was Japan's no. 2 game of 2024", status="Verified", repro="Yes", gravity="Limited"),
    dict(name="Arcane", url="https://80.lv/articles/arcane-artists-show-how-they-combine-traditional-art-3d-for-backgrounds", style="Painted 3D", result="Technique source only", status="Verified", repro="In simple form", gravity="Yes"),
    dict(name="Doré Bible, 1866", url="https://www.openculture.com/2024/07/behold-gustave-dores-dramatic-illustrations-of-the-bible-1866.html", style="Wood engraving", result="241 engravings, sold in France and the UK", status="Verified", repro="Yes", gravity="Yes"),
]


FINALISTS = ["01", "05", "13", "16", "18", "19", "21", "22"]
REFINED = ["05", "16", "19", "21"]
FINALIST_REASON = {
    "01": "Keeps real form and adds a designed colour world.",
    "05": "The truest light, acting and camera of anything here.",
    "13": "3D form with the warmth of paint.",
    "16": "The hardest-hitting frame at phone size, and cheap to make.",
    "18": "Severe, sculptural, fast to render and unusual for this subject.",
    "19": "The most emotional frames, and they feel mature.",
    "21": "Rooted in how Scripture has been illustrated for centuries, and rare on feeds.",
    "22": "The most distinctive Christian image on a feed.",
}
LEFT_OUT = {
    "02": "Our rules already reject flat vector gradients as a main style.",
    "03": "Clear, but it reads as a comic adaptation.",
    "04": "Beautiful as a device, weak at human interaction.",
    "06": "Strong, but the illustrated and ink styles cover the same ground with more character.",
    "07": "Its strength is wide shots, and close emotion is its weakest case.",
    "08": "Nostalgia works against reverence.",
    "09": "Risks reading as children's content.",
    "10": "A lovely clay look, but soft and slow to render.",
    "11": "Without a real artist's drawing, it stays an approximation.",
    "12": "Close to the painted storybook, which went further.",
    "14": "Strong for explanation, and it keeps the viewer at a distance.",
    "15": "White frames can't carry night or awe.",
    "17": "An excellent recurring device, not a whole film.",
}
JUDGMENT_NOTE = "These stay separate on purpose. A rough prototype doesn't rule out a style, and a good still doesn't prove it can be produced. Words here are judgments, not measurements."
STRESS_COLS = ["Illustrated 2.5D", "Cinematic 3D", "Painterly 3D", "Editorial ink", "Low-poly", "Painted storybook", "Engraving", "Stained glass", "Cut paper"]
STRESS = [
    ["David and Goliath feels epic", "Good", "Strong", "Strong", "Good", "Good", "Strong", "Strong", "Good", "Fair"],
    ["Peter's denial feels intimate and painful", "Good", "Good", "Strong", "Strong", "Fair", "Strong", "Strong", "Fair", "Fair"],
    ["Samson's downfall feels serious", "Good", "Strong", "Strong", "Strong", "Good", "Strong", "Strong", "Good", "Fair"],
    ["Genesis feels mysterious", "Good", "Good", "Strong", "Good", "Good", "Strong", "Strong", "Strong", "Good"],
    ["An explanation stays visual inside the style", "Good", "Fair", "Fair", "Strong", "Fair", "Fair", "Good", "Fair", "Good"],
    ["Recurring characters stay recognizable", "Strong", "Strong", "Good", "Good", "Good", "Good", "Good", "Fair", "Fair"],
    ["Camera movement stays engaging", "Good", "Strong", "Good", "Fair", "Strong", "Good", "Fair", "Weak", "Good"],
    ["Enough footage without rebuilding art", "Good", "Fair", "Fair", "Good", "Good", "Good", "Good", "Good", "Fair"],
]
RANKING = [
    ("Bible engraving", "the most distinctive serious look here, and it comes from Christian print history. Its risk is whether fine lines hold up in motion and on phones"),
    ("Digital painted storybook cinema", "the strongest emotion, and it reads as adult. It's safest as held paintings moved in layers"),
    ("Stylized cinematic 3D", "the truest acting and camera, and the most familiar to audiences. Its costs are render time and staying clear of realism"),
    ("Editorial ink illustration", "the strongest read at phone size, and the cheapest of the four. It may feel more like a poster than a film over two minutes"),
    ("Painterly stylized 3D", "very close to the painted storybook, with more detail and more flicker risk"),
    ("Cinematic illustrated 2.5D", "a safe, clear middle path with less identity"),
    ("Stylized low-poly 3D", "fast and striking, and it may feel cold"),
    ("Stained glass light", "unforgettable as a recurring device, and limited for a whole film"),
]
NEXT_TESTS = [
    "Bible engraving: five seconds of shot 26, to see whether the lines stay calm as he pulls in tighter.",
    "Painted storybook: five seconds of shot 26 as one held painting split into depth layers, with a slow push and a small breath.",
    "Cinematic 3D: five seconds of shot 13 in limited animation, to judge render time and whether the hands hold up.",
    "Editorial ink: five seconds of shot 26, to see whether moving ink edges feel alive or nervous.",
    "Each test needs your approval first, because the production lock covers rendering video.",
]
OPEN_QUESTIONS = [
    "Do strangers read each finalist as adult or childish? AI opinion can't answer this, and neither can I.",
    "Do fine engraved lines survive Instagram's compression on a phone?",
    "Do line styles flicker or crawl in motion? No motion has been tested.",
    "How far can faces act? The base mesh has expression shapes, but none has been tested on camera.",
    "Robes and clothing aren't built, and almost every other Bible story needs them. Cloth is the largest unbuilt piece of the 3D route.",
    "Should one film use one style, or could maps, glass or collage appear as recurring devices inside it?",
    "Will rendering stay practical? Each full-quality frame took about five minutes on this two-core machine. Does your computer have a graphics card that could render them faster?",
    "How should Adam and Eve be framed across the whole film? These frames rely on leaves and hair for modesty.",
    "Would you rather finish the ChatGPT comparison as well? It's still a useful outside benchmark for these frames.",
]


REFINE_ALL = "Refined for every shot: skin with colour variation and fine grain, and hair, brows and beard regrown. In shot 26, Adam's hand is clenched at his chest, with a denser forest and a cold rim light. In shot 13, the garden has real tree crowns and warm back light. In shot 2, the figure is smaller and mist sits in the valley."
REFINE_NOTES = {
    "05": REFINE_ALL + " This style also gains light shafts.",
    "16": REFINE_ALL + " The ink washes are stepped so the forest and mountains separate, and the fruit is the one ember spot.",
    "19": REFINE_ALL + " This style also gains light shafts and a fine brush pass on faces and hands.",
    "21": REFINE_ALL + " The engraved lines are finer, so faces and hands hold more form.",
}
