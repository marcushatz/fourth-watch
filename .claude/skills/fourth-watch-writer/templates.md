# Templates: the file each step leaves behind

All of these go in the episode's `writer/` folder.

## 1. `ideas.md` (step 1)

Up to five idea cards from `templates/idea_card.md`, then:

```
Recommendation: <one card>, because <one sentence>
Dropped: <card>: <the concept flaw>
```

## 2. `claims.md` (step 2)

```
# <Episode>: claims (<date>)

## Passages read in full (ESV, fetched this session)
- <book chapter>: why it matters

## The common answer people give
- <what people usually say, with a source>

## What the text does NOT say
- <e.g. "Genesis 33 never says 'forgave'">

## Claim table
| # | Claim as the script says it | Label | ESV words or source | Checked |
|---|---|---|---|---|

## Pages fetched
- <url>
```

## 3. `story_map.md` (step 4)

```
Message (one sentence):
Relate:     <the struggle the viewer recognizes>
Reveal:     <what Scripture shows them that they hadn't noticed>
Transform:  <what they understand about God, and what they could consider or do>

| Beat | What happens (with its reference) | What the viewer recognizes or learns | What they feel |
|---|---|---|---|

Turning point: <the event, and why the feeling changes there>
Ending: <the insight, question or application, and what it pays off>
Questions the opening raises → the beat that answers each:
  - <Q> → <beat>
Gate: reveal earned by the story? y/n · every feeling caused by an event? y/n · application specific? y/n · story starts before any lecture? y/n
```

## 4. The script (step 5), in the format `fw_check.py` reads

```
# <Title>
series: FOURTH WATCH
message: <one sentence>
relate: <one line>
reveal: <one line>
transform: <one line>
claims: writer/claims.md
target_seconds: <words ÷ 2.6 + 3, rounded>

<!-- version, date, what changed and why -->

## <section name of your choice>
VO: <narration> [Book ch:v]
ON-SCREEN: <optional text>
VERSE: "<exact ESV words>" — Book ch:v (ESV)      (optional verse card)

## <next section>
VO: ...

## Caption
<one line, "Read it yourself: ..." and the ESV credit line>

## References
- <passages>
```

Section names are free. Every VO line that tells a biblical event or quotes Scripture carries its `[Book ch:v]`. The claim table lives in `claims.md`. A `## Fact-check log` table in the script also works.

The older series (ASK THE TEXT, MOST PEOPLE MISS, STRANGE BUT TRUE, MISQUOTED) still use their fixed `## Hook`, `## Stakes`, `## Story`, `## Turn` and `## Landing` sections, an `answer:` line and `## Value`.

## 5. `review.md` (step 6)

```
Checker: <FAILs fixed> · WARNs: <each fixed or justified in one line>

The approval questions (EDITORIAL.md), each answered with the line that proves it:
  Relatability:       <answer> — "<line>"
  Curiosity:          ...
  Narrative:          ...
  Discovery:          ...
  Clarity:            ...
  Emotional impact:   ...
  Application:        ...
  Biblical accuracy:  ...
  Originality:        ...

Integrity pass: every line matches its claim label? y/n · invented dialogue, motive or thought? none / <line> · order of events checked? y/n
Independent reads (only with Marcus's OK): fact-check VERIFIED __ · CORRECTION __ · OVERCLAIM __ → fixes · first-time viewer (AI) restated the message? y/n · confusions: ...
Verdict: HAND OFF / REVISE (what changes in the story map)
```
