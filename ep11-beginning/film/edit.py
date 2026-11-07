"""The edit: transitions between shots, verse cards and tags, caption rules. Shared by assemble.py and sound.py."""

# Boundary into a shot: (kind, seconds). Anything not listed is a straight cut.
TRANSITIONS = {
    "S02": ("dissolve", .7),     # the fall through space settles on the hill
    "S03": ("paper", .55),       # the stakes
    "S05": ("dissolve", .5),
    "S06": ("paper", .55),       # the easy answers
    "S08": ("dissolve", .7),     # the turn: light opens in the dark
    "S09": ("dissolve", .9),     # the light settles into the garden
    "S10": ("paper", .55),       # the story
    "S14": ("dissolve", .6),     # colour drains
    "S19": ("paper", .55),       # the comeback
    "S21": ("dissolve", .6),
    "S23": ("dissolve", .8),
    "S24": ("dissolve", .7),
    "S25": ("dip", .8),          # the moment: back to the held scene, darker
    "S27": ("dissolve", .6),
    "S29": ("dissolve", .5),
    "S30": ("dissolve", .8),     # match: Adam's face becomes the face from the opening
    "S31": ("paper", .55),       # the conclusion
    "S32": ("dissolve", .6),
    "S33": ("dissolve", .7),
    "S34": ("dissolve", .8),
}

# Verse cards: shot -> (verse, reference, appear on word, disappear on word or None for the end of the shot)
CARDS = {
    "S03": ("nor is he served by human hands, as though he needed anything", "Acts 17:25", ("Acts", 0), None),
    "S08": ("by your will they existed and were created", "Revelation 4:11", ("Revelation", 0), None),
    "S15": ("And they heard the sound of the LORD God walking in the garden", "Genesis 3:8", ("Genesis", 0), None),
    "S16": ("And no creature is hidden from his sight", "Hebrews 4:13", ("Hebrews", 0), None),
    "S21": ("And the LORD God made for Adam and for his wife garments of skins and clothed them.", "Genesis 3:21", ("Genesis", 0), None),
    "S22": ("And the LORD God made for Adam and for his wife garments of skins and clothed them.", "Genesis 3:21", None, ("against", 0)),
    "S23": ("For God so loved the world,", "John 3:16", ("John", 0), None),
    "S24": ("that he gave his only Son", "John 3:16", None, None),
}
TAGS = {"S10": "Genesis 2:17", "S11": "Genesis 3:5", "S19": "Genesis 3:19", "S20": "Genesis 3:23"}
CARD_Y = {"S15": .31, "S21": .80, "S22": .80}

# Captions: hidden where the words are already on screen as the picture itself.
NO_CAPTION = {"S27", "S01", "S02"}      # S01-S02: the opening question is on screen as the title from frame one
# Gold in the captions only where God acts.
GOLD_WORDS = {("S08", "chose"), ("S18", "calls"), ("S21", "makes"), ("S21", "clothes"), ("S22", "taking"), ("S22", "care"),
              ("S23", "loved"), ("S24", "gave"), ("S29", "wanted"), ("S32", "wanted"), ("S33", "wanted"), ("S34", "wanting")}

# Where the caption sits (fraction of the frame height), when a shot needs it moved off the picture.
CAPTION_Y = {}
