# The Lintel Network: cross-video patterns (12 Shorts)

## Data and method

- **Videos.** All 12 played; none failed. Per-video detail is in `<videoId>.md` in this folder.
- **Measured** (the probe at 10 fps, YouTube's own timed captions, and frame checks):
  - shot starts and lengths
  - camera zoom and pan per shot, plus "own motion" (how much of the frame moves after removing the camera)
  - the exact narration words over each shot
  - card hold times
  - hook and ending timings
- **Soft cuts.** The probe misses soft cuts (crossfades and time-jumps). I checked every shot of 5 s or longer against the frame-difference series and contact frames, and split 12 missed cuts by hand. Segments under 0.4 s are counted as transitions. In the stats below, "picture shots" means all real shots except the final logo, so end cards and verse cards are included.
- **Judged from contact sheets** (approximate, marked *judged*): shot size and angle, what happens on screen, and whether a person performs an action.
- **Inferred** (marked *inference*): any reason why something works.
- **Coverage depth.** The three hits got 4 frames per shot at large size plus extra frame grids. The others got the standard 3-frame sheets.
- **Views** are Instagram counts given by the coordinator. The analysis is of the identical YouTube uploads. Suffering (528K) and Methuselah (325K) were analysed elsewhere and are not in these numbers.

| rank | video | IG views | dur s | picture shots | median s | mean s | ≤3 s | words/s | camera moves ≥5% | caption hook / big-title hook | tail (closing segment start → end) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Tree (scssXOJHaAA) | 7.6M | 89.4 | 21 | 3.7 | 4.1 | 33% | 3.0 | 11/21 | caption | 7.3 s |
| 2 | Cain's wife (8FIxc1iY9MI) | 1.8M | 84.1 | 19 | 4.0 | 4.1 | 21% | 2.6 | 11/19 | caption | 8.7 s (no CTA) |
| 3 | Never heard (FOsA2HFaH5E) | 1.6M | 137.5 | 24 | 4.85 | 5.5 | 17% | 3.0 | 15/24 | caption | 8.2 s |
| 4 | Judas (cEGFXszM7gA) | 338K | 115.1 | 32 | 3.1 | 3.5 | 50% | 2.9 | 14/32 | caption | 9.1 s |
| 7 | Hell (rZWyZt7DYZ4) | 194K | 97.2 | 26 | 3.4 | 3.5 | 38% | 2.6 | 7/26 | **big title** | 9.0 s |
| 8 | Show Himself (yXXhJztfHE0) | 75K | 103.1 | 23 | 4.5 | 4.1 | 30% | 2.6 | 6/23 | **big title** | 15.1 s |
| 9 | Hide from God (wfTSihRCS10) | 48K | 163.9 | 25 | 6.2 | 6.4 | 20% | 1.8 | 2/25 | caption | 9.3 s (no CTA) |
| 10 | A&E never ate (04KFpM2WbVo) | 35K | 98.5 | 22 | 3.9 | 4.25 | 36% | 2.8 | 7/22 | **big title** | 12.5 s |
| 11 | Exodus 12 (QhDdZVAjEdM) | 33K | 59.7 | 25 | 1.8 | 2.1 | 80% | 2.6 | 20/25 | caption | 4.8 s (follow) |
| 12 | Job prayer (3GMG1QydnIo) | 31K | 66.3 | 15 | 3.8 | 3.9 | 40% | 2.5 | 5/15 | caption | 12.3 s |
| 13 | 7 days (DXjgrIw_46E) | 24K | 52.4 | 12 | 3.65 | 3.5 | 50% | 1.75 | 8/12 | **big title** | 9.2 s (follow) |
| — | Born elsewhere (x6G0LKdUONI) | 20K (1 day old) | 96.4 | 21 | 3.7 | 4.4 | 43% | 2.7 | 7/21 | big title at 6.3 s | 11.3 s |

(Ranks 5–6 are Suffering and Methuselah, analysed elsewhere.)

---

## 1. Shot length (measured)

All 265 picture shots: **median 3.8 s, mean 4.1 s, interquartile range 2.5–5.1 s; 38% are 3 s or shorter.**

| length | ≤1 | 1–2 | 2–3 | 3–4 | 4–5 | 5–6 | 6–8 | 8–10 | >10 |
|---|---|---|---|---|---|---|---|---|---|
| all 12 (265) | 3% | 13% | 22% | 17% | 18% | 12% | 8% | 5% | 2% |
| 3 hits (64) | 0% | 6% | 17% | 23% | 27% | 12% | 5% | 8% | 2% |
| 2 mid (58) | 2% | 12% | 31% | 26% | 14% | 9% | 7% | 0% | 0% |
| 6 low (122) | 6% | 18% | 19% | 10% | 17% | 12% | 10% | 5% | 3% |

- Rule: a typical shot holds **one clause, about 3–5 s**. Shots per spoken sentence (sentences from the auto-caption punctuation) average **1.02 across all 12** (hits 0.95, 0.95, 1.04). Each sentence gets roughly one new picture.
- Rule: shots get short (1.2–2.5 s) only for **lists and parallel items**:
  - Tree 8.5 s / 10.2 s (every war / every sickness: 1.7, 1.5 s)
  - Job 29.3–33.4 s (application / interview / door: 1.5, 1.3, 1.3 s)
  - Born 0–6.3 s (another country / culture / religion: 2.6, 1.7, 1.8 s)
  - Exodus 31.6–35.4 s (four cuts of the door being painted, 0.5–1.3 s)
- Rule: shots get long (6–10 s) for **verse cards, an unbroken camera travel, or a held diagram**:
  - Cain 66.2 s (9.2 s travel)
  - Never heard 97.9 s (17.9 s diagram)
  - A&E 71.7 s (9.2 s Lewis card)
  - Tree 0 s and 40.5 s (8.5 s hook with a pull-out; 8.5 s puppets with a mid-shot change)
- The two extremes are both low performers: Exodus (median 1.8 s, 80% ≤3 s) and Hide (median 6.2 s, 8 shots ≥8.4 s).
- Speech rate: hits 2.6–3.0 words/s. The slowest videos (Hide 1.8, 7 days 1.75) are both low.

## 2. Camera (measured + judged)

- **Defaults** (judged): high-angle isometric wide on a small diorama set, 60–70% of picture shots. Medium and two-shots are used for the hook and for intimate beats. The two flat side-on videos (Hide, Job) are the exception.
- **How often it moves** (probe, 253 unsplit segments): a measurable move (|zoom| or pan ≥5%) in **41%**, a big move (≥15%) in only **14%**. Most motion is a slow drift or push of a few %; the camera is effectively locked about 60% of the time.
- **Big moves are reserved for four jobs:**
  1. **Hook reveal**, pull-out from a character to the world:
     - Tree 0–3.3 s (−42%, most of it in 1.2 s)
     - Never heard 0–3.4 s (−64%)
  2. **Travel that links scenes or time**:
     - Cain 66.2–72.2 s (zoom −62%, pan 132%; people → garden → cross)
     - Cain 13.9–15.2 s (follows Cain to Nod)
     - Exodus 4.9, 22.0, 28.0, 41.2 s (pans 48–69%)
  3. **Follow a walker**:
     - Tree 58.2 s (pan 22%)
     - Never heard 115.8 s
  4. **Push into a revelation**:
     - Never heard 66.0 s, Athens altar (+22%)
     - Job 33.4 s, through the opening door (+37%)
     - Show Himself 66.8 s, candle (+12%)
- **Transitions** (measured): 117 sub-0.4 s segments in 12 videos. Mostly 0.2 s white/cream/colour flashes on scene changes, typically landing on the first word of a new clause (e.g. Tree 49.0 s "He | wanted children"). Cain's wife uses 0.2–0.3 s crossfades instead (18 of them). The flat side-on videos (Hide, Job) use almost none. One whip-travel (Exodus 4.9 s), one match-dissolve (Tree 69.8 s, tree → cross), dips to dark before end cards (Tree 82.1 s).

## 3. Characters: act vs stand

- **Probe** (measured): own motion ≥3% of the frame in **33%** of shots. Characters are small in the frame, so this underestimates action.
- **Judged tally:** a person performs a visible action (walks, reaches, hands over, kneels, points, dances) in about **39% of picture shots overall**.
  - Hits: Tree 12/21 (57%), Never heard 11/24 (46%), Cain 4/19 (21%)
  - Mid: Judas ~18/32 (56%), Hell ~12/26 (46%)
  - Low: Exodus ~13/25, Show ~8/23, Hide ~8/25, A&E ~7/22, Job ~5/15, Born ~6/21, 7 days 0/12
- **The rule is "something changes in every shot", not "people always act".** In the shots where nobody acts, something else visibly changes: an object appears or vanishes, text carves in, a label pops, a counter ticks, light grows. *Judged:* setting verse cards aside (their only change is text building), fewer than 1 in 10 scene shots in the hits is a fully static frame (Tree: 2 of 20, the kneeling-sick shot and one callback wide).
- **Walking is the workhorse verb.** It appears in roughly half of all action shots (judged), usually toward or away from a light, door or person, so the direction of the walk carries the meaning. Examples:
  - Judas 86.0–90.3 s: Peter walks back toward Jesus, Judas walks away
  - Tree 76.2 s: people walk into a lit door
  - Never heard 122.5 s: the messenger walks to the house

## 4. Text on screen

- **Narration captions** sit at the top third: italic serif, 2–3 lines, building word by word. Key nouns are recoloured red/orange (often caps): about 1–3 per sentence (e.g. Tree "EVE / FRUIT / TREE"; Cain "CAIN'S WIFE").
- **Persistent header** in every frame: lintel glyph + series name top-left ("HONEST QUESTIONS" on the Q&A videos; "EXODUS", "GENESIS 1", "A PRAYER" on others), episode tag top-right ("THE TREE", "CAIN'S WIFE", "NEVER HEARD").
- **Black label pills** (small caps, often with a thin leader line) name the idea or the person in about half of all scene shots (judged). They appear 0.3–1 s after the shot starts and stay to the cut. Examples: "NO CHOICE LEFT" (Tree 44.5 s), "CORNELIUS · ROMAN OFFICER" (Never heard 18 s), "KNOWING IS NOT CAUSING" (Judas 58 s). A scripture reference is often folded into the pill: "IN THE MIDST OF THE GARDEN · GENESIS 2:9", "A THIEF · JOHN 12:6", "SARAH · GEN 20:12".
- **Verse/quote cards** (measured, 34 cards in 10 videos; Exodus and 7 days have none): **median hold 4.35 s, mean 4.9 s, range 2.0–9.2 s**.
  - Hits: mean 4.1 s. Lows: mean 5.7 s.
  - Two formats:
    - (a) a cream card in the top half over a live scene that keeps acting (Tree 52.4 s; Hell 31.4, 50.4 s; Judas 22.9 s);
    - (b) a full-screen cream card over the faded scene (Cain ×4, Never heard ×6, Hide ×5).
  - Card text builds line by line with the reading, the key word is in red, and the reference sits under it in small caps ("DEUTERONOMY 30:19 · KJV").
  - Every card is adjacent to a picture shot of what it proves or describes.
- **Big centred titles** (large serif caps, two-tone) appear in hooks and at section turns, but **only in the non-hits**: Hell, Show, A&E, 7 days, Born (5 of 9). All three hits avoid them.
- **Numbering:**
  - Never heard: red numeral pop + a bottom counter pill held through each section ("1 GOD SEES THE SEEKER").
  - Hell and A&E: dark full-screen numeral cards.
  - 7 days: "DAY N" + a 7-dot progress row.

## 5. Hook (first 3 s) (measured)

| video | first frame | question fully spoken | first visual change | first cut |
|---|---|---|---|---|
| Tree (hit) | Eve, medium-wide, beside the tree with snake and fruit | ~5.5 s | 1.0 s (she reaches); 2.1 s pull-out | 8.5 s |
| Cain (hit) | Cain + faceless woman, medium two-shot | 2.8 s | ~1.0 s ("?" rises) | 2.9 s |
| Never heard (hit) | man, medium, before his house at night; full question already on screen | ~3.0 s | 0 s (pull-out starts) | 3.4 s |
| Judas | Judas walking at night | 5.9 s (two halves) | 0.3 s push | 2.8 s |
| Hell | family in light + big title | 4.2 s | title swap | 2.5 s |
| Show Himself | tiny figure under night sky + big title | ~6.0 s | title swap only | 6.0 s |
| Hide | man slumped on floor, wide | ~8.9 s (asked twice) | none | 8.9 s |
| A&E | couple by tree, wide + big title | ~6.5 s | none | 4.1 s |
| Exodus | blood-marked door, no person | ~4.8 s | slow push | 4.9 s |
| Job | man at desk, medium-wide | ~2 s (+ "don't scroll" to 5.4 s) | ~2 s (turns, prays) | 5.4 s |
| 7 days | dark slab + title | no question | blocks rise | 4.8 s |
| Born | globe | ~8.6 s (3 setup shots) | ~1 s (pin drops) | 2.6 s |

Rules visible in the hits:

- The **subject is a person at medium size in frame 1, together with the topic's key object** (Eve + snake + fruit; Cain + the faceless wife; the lone man + his house).
- Something **moves within about 1 s**.
- The question is **spoken within 2.8–5.5 s**.
- The **first big reframe lands on the question's key clause**:
  - Tree: the pull-out lands on "why didn't He remove the tree"
  - Cain: cut to the family lineup on "If Adam and Eve…"
  - Never heard: the pull-out makes "never heard" a lone light in the dark
- Two hits **return to the hook image within 8 s or at the answer**:
  - Cain 7.4 s ("who did Cain marry?" over the faceless-woman framing)
  - Tree 63.3 s and 73.6 s
  - Never heard 44.9 s and 122.5 s

## 6. Ending (measured)

- **Structure in most Q&A videos:**
  1. the answer line over an "arrival" image (people walking into a lit doorway, Tree 76.2 s; crowd at the cross, Judas 102.0 s; messenger reaches the house, Never heard 122.5 s);
  2. a 0.2–0.3 s flash or dip;
  3. a dark end card where the closing question gets icons or two option buttons that pop on their words, and a mock comment field types an example answer ("A gift, because…", "My grandmother", "Yes, because…", "I think it's…");
  4. the logo build.
- **Logo:** 1.9–2.0 s plain build (6 videos); 2.7–3.3 s with tagline "Covered, every day." (Cain, Never heard, Hide); 4.7–9.1 s when it carries a follow line (Exodus, Job, 7 days).
- **Tail** = time from the start of the closing segment (CTA question or closing line, including its flash) to the end of the video.
- **Hits:** tail **7.3 s (Tree), 8.7 s (Cain, no CTA at all), 8.2 s (Never heard)**. The CTA card itself is 5.0–5.1 s.
- **Mid performers:** Judas 9.1 s, Hell 9.0 s.
- **Lows:** 9.2–15.1 s, except Exodus at 4.8 s. The longest are the three with a "Welcome to the Valiant" community crest card (Show 15.1 s, A&E 12.5 s, Born 11.3 s), then the follow and amen cards (7 days 9.2 s, Job 12.3 s). The Valiant card appears in 3 of the lowest and in **none of the hits or mid performers**.
- **CTA types:**
  - either/or opinion question: Tree, Judas, Hell, Show, Born
  - personal-memory ask: Never heard ("type their name")
  - no CTA, just an empowering close: Cain ("you'll know what to say"), Hide
  - "type amen": Job
  - "follow": Exodus, 7 days

---

## How they stage story events (narration describes what a person did)

1. **One action per clause, on the verb.** The cut or the gesture lands on the verb, so a sentence with three verbs gets three beats on the same set, joined by soft cuts or time jumps.
   - Never heard 15.8–38.4 s: "gave much to the poor" → hands to a poor man (22.2 s); "prayed continually" → kneels (27.0 s); "an angel told him" → beam + angel (~32 s); "send for… Peter" → messengers walk off (~34 s); "Peter walked into that house" → Peter arrives, Cornelius bows (35.5 s).
   - Exodus 31.6–35.4 s: "marked / their doors / with the blood / of a spotless lamb" → 4 cuts of the painting, 0.5–1.3 s each.
2. **Name the person with a pill on first appearance**, often with the scripture reference in the same pill:
   - Cain 3.1 s (ADAM / CAIN / ABEL / EVE)
   - Never heard 18 s (CORNELIUS · ROMAN OFFICER)
   - Born 62.3 s (RUTH · A MOABITE)
3. **Keep the set, change the moment.** A story run stays on one isometric set and changes the framing, light or time of day rather than location:
   - the Cornelius street (5 shots)
   - the Eden garden (Tree 0, 11.7, 16.5, 63.3, 67.0, 73.6 s)
   - one continuous Egypt set crossed by camera travel (Exodus 16.7, 22.0, 28.0, 41.2 s)
4. **Quoted speech becomes a card over the speaker's scene, and the scene keeps acting.**
   - Hell 31.4 s: the John 10:10 card is up while the thief creeps and then Jesus appears on "I am come".
   - A&E 43.5 s: Adam points at Eve under "the woman… she gave me".
   - Judas 50.4 s: Judas bargains under "What will ye give me".
5. **Contrast two characters by direction of travel.** Peter walks back to Jesus on the shore (Judas 88.6 s), Judas walks away along the wall (90.3 s). The what-if then reuses Peter's shore with Judas in Peter's place (106.0 s).
6. **Counting is shown, not said.** The coin counter ticks 21 → 30 (Judas 55.0 s), three red tallies for three denials (Judas 82.1 s), ten glowing dots over Sodom (Never heard 92.3 s).
7. **God's action = a beam of light from above.** It appears in all 12 videos. Examples: God's knowledge (Tree 7 s), removing the tree (Tree 17 s), the angel (Never heard 32 s), the gospel reaching the door (Never heard 50 s), God walking in the garden (A&E 57.1 s), the creation of man (7 days 33.8 s).

## How they stage abstract points (narration states an idea)

1. **Act out the hypothetical literally.**
   - "If God had taken the tree away": a beam removes the tree (Tree 16.5 s).
   - "Your great-grandparents would still sit at your table": a multi-generation dinner (A&E 14.3 s).
   - "If Judas had come back": Judas on Peter's shore with Jesus reaching out (Judas 106.0 s).
2. **Turn the idea into one physical object, then do something to it.**
   - "sin waiting at the next command": a snake coiled at the next stone (Tree 20.1 s)
   - "no choice left": people become marionettes on strings (Tree 45.3 s)
   - "playing a part": a theatre stage (Judas 29.4 s)
   - "accident of birth": dice (Born 8.8 s)
   - "judge fairly": a balance scale (Never heard 74.8 s)
   - "blame… fingerprints": red rings from a pointing hand (A&E 47.2 s)
   - "inheritance → choice": a lamp handed from an old woman to a young man who walks off (Born 27.3 s)
3. **Show a consequence by subtraction.** Things vanish to show what a rule would require: stall goods (Tree 26.0 s), the neighbour's animals (Tree 32.1 s), a whole village (Tree 35.5 s). Leaves fall off a man for "can't fix it with fig leaves" (Hide 96.0 s).
4. **Recurring symbols:**
   - **Doors**: Hell 50.4 / 57.1 / 83.4 / 88.2 s; Job 33.4 s; Judas 74.4 s; Tree 76.2 s; Exodus throughout
   - **Forked or lit paths**: Tree 52.4–58.2 s; Judas 99.3 s; Show 76.6 s
   - **Light vs dark**: Never heard throughout
5. **Stamps, strikes and X's for verdicts:** "PAID" (Hell 68.2 s), "STILL WRONG" (Judas 79.6 s), red X on "OTHER PEOPLE?" (Cain 56.5 s) and on the genetic-fallacy arrow (Born 33.3 s), GRIEF struck out (A&E 14.3 s).
6. **Diagrams when the point is logical structure:**
   - timeline ADAM → ABRAHAM → MOSES (Cain 46.1 s)
   - "WHERE IT CAME FROM → IS IT TRUE?" with an X (Born 33.3 s)
   - two labelled groups either side of the cross under one beam (Never heard 97.9 s)
   - "A BAD PERSON?" / "INSTRUMENT?" either side of Judas (Judas 95.2 s)
7. **UI mock-ups for social proof:** a search bar autocompleting the question (Cain 8.8 s), comment bubbles of viewers' objections (Never heard 10.9 s).
8. **Modern-life analogies get modern sets.** An office with a lying colleague, a new door and a "STILL WRONG" stamp (Judas 69.8–82.1 s); a living room at night (Hide); a jobseeker's desk (Job).
9. **Every abstract shot carries a label pill** that restates the idea in 2–5 words ("SEEING IS NOT LOVING", "NO ONE HAS ZERO LIGHT", "HE NEVER FORCES THE DOOR"). The picture is metaphorical and the pill pins the meaning.

---

## What the hits do differently from the low performers

**Measured differences:**

1. **Hook framing.** All 3 hits open on a person at medium size with the key object in frame, move within ~1 s, and finish the question by 2.8–5.5 s. Among the 9 non-hits:
   - 5 use big centred title text instead;
   - 3 hold a static picture for 4–9 s at the open (Show 6.0 s, Hide 8.9 s, A&E 4.1 s);
   - 3 finish the question only at 6.0–8.9 s.
2. **Shot rhythm sits in the middle.** 50% of hit shots are 3–5 s long, vs 40% (mid) and 27% (low). Only 23% are ≤3 s, vs 43–45%, and none are under 1 s. The lows sit at both extremes: Exodus median 1.8 s, Hide median 6.2 s.
3. **Shorter tail.** Hit tails run 7.3–8.7 s, with no community card. The mid performers run 9.0–9.1 s. Lows run 9.2–15.1 s (except Exodus, 4.8 s), and the three with the "Valiant" crest card are all low.
4. **Format.** All 3 hits are "Honest Questions" answers to a widely asked puzzle. Each answers with a Bible story or evidence chain plus a callback to the hook image. The lowest four include a KJV passage reading with no person on screen (7 days), a fast story retelling (Exodus), a prayer (Job) and a slow devotional (Hide).

**Did NOT separate hits from lows** (measured):

- share of shots with camera movement (hits 52–63%, lows 8–80%)
- probe own-motion
- number of verse cards (hits: 1, 4 and 6)
- video length (hits: 84–137 s)
- art style: low-poly 3D (Tree) and flat 2D figures on low-poly sets (Cain, Never heard) both hit; only the two flat side-on vector videos (Hide, Job) are both low.

**Inference:**

- Topic and the hook's concrete mystery (a puzzle people already search for, shown as a person and an object) seem to matter more than editing tempo. Cain's wife has the least character action of any hit (about 21% of shots) and still reached 1.8M.
- Within the visuals, the hits most consistently do two things:
  - make every abstract claim into an object or literal action with a pill;
  - return to the hook image when the answer lands.
- Sample size is 12, views come from a different platform, and topic, posting date and age (Born elsewhere was 1 day old) are confounded. Treat these as patterns, not causes.
