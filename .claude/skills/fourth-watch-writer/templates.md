# Templates

## 1. `writer/dossier.md` (Stages 1-2)
```
# <Topic>: research dossier (<date>)

## The question people ask
- Wording(s) found: <search or autocomplete evidence, Q&A pages>
- The common answer: <what people usually say, with a source>

## Passages read in full (ESV)
- <book chapter> (why it matters)

## Every other place Scripture touches this thread
- <reference>: <what it adds> (names/quotes the earlier text? y/n)

## Discoveries
| # | Claim | Label | ESV words (fetched) / source | Before (viewer thinks) | After | Surprise/Load/Visual (0-2 each) |
|---|---|---|---|---|---|---|

## Traps: what the text does NOT say
- <e.g. "Genesis 33 never says 'forgave'">

## Pages fetched
- <url>
```

## 2. `writer/argument.md` (Stage 4)
```
Question (hook, word for word):
Answer (one sentence, by 50%):
Thread:

Chain:
  D1 <discovery> → the viewer now asks: <Q>
  D2 <discovery> answers it → and raises: <Q>
  D3 …
  Re-read: <an earlier discovery seen in a new light>
Principle (one sentence):
Screenshot line:

Viewer's next questions → the line that answers each:
  - <Q> → <line>

Gate 4: a stranger can restate the argument from the chain alone? y/n · each step transforms the last? y/n · principle impossible before the research? y/n
```

## 3. The script (Stage 5): the series format `fw_check.py` reads
```
# <Question, exactly as spoken in line 1>
series: ASK THE TEXT
target_seconds: <words ÷ 2.6 + 3, rounded>
answer: <one sentence>

<!-- version, date, what changed and why; the question chain; care notes -->

## Hook
VO: <the question>
ON-SCREEN: <THE QUESTION IN CAPS>

## Stakes
VO: <the sharpening fact(s)> [Book ch:v]

## Story
VO: <the familiar story, entered at the discovery: 1-2 lines> [Book ch:v]

## Turn
VO: <the hinge + the core answer by 35-50%> [Book ch:v]
VERSE: "<exact ESV words>" — Book ch:v (ESV)

## Landing
VO: <the later evidence / re-reading / principle; echo the hook> [Book ch:v]

## Question            (optional: one closing question, same subject, ≤ 17 words, accuses no one)
VO: <question> [Book ch:v]

## Value
- <discovery 1> [ref]   (≥ 3, each actually spoken in the VO)

## Caption
<one line + "Read it yourself: …" + the ESV credit line>

## References
- <passages>

## Fact-check log
| Claim | Verse | Checked against | Status |
```

## 4. `writer/review.md` (Stage 6)
```
Six rejection tests (yes = rewrite):
  1 Ordinary retelling?        y/n: <evidence>
  2 Superficial trivia?        y/n
  3 Forced cross-reference?    y/n
  4 Predictable conclusion?    y/n
  5 Merely sounds profound?    y/n: <each aphorism paraphrased plainly>
  6 Unanswered next question?  y/n
Retelling words: __ / __ (__%)   Words: __   Runtime est.: __ s
Fact-check (AI agent): VERIFIED __ · CORRECTION __ · OVERCLAIM __ → fixes applied: …
First-time viewer (AI, no tools): answer restated? y/n · principle restated? y/n · new things: __ · confusions: …
Verdict: PASS / REVISE (what changes in the spine)
```
