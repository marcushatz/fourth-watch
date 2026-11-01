# 01 · Topic selection: choosing a question that can win

**Use this when** you plan the next episode. The candidate list lives in `research/episode_bank.md` (researched and scored). This file is how to choose from it, and how to add to it.

**Why it matters:** the step from about 500K views to millions on the model channel was mostly **topic and hook**, not wording *(inferred, `research/script_rules_from_hits.md` §2c)*.
- All three of its hits answer a puzzle people already search for, about a named Bible person or object, with a definite answer the text gives.
- The weak question videos argued a stance, speculated, or consoled.

## 1. The five tests (score each 1–5)

| Test | 5 looks like | 1 looks like |
|---|---|---|
| **Demand** | The question autocompletes on Google or YouTube; "People also ask" shows it; many Q&A pages and threads | Nobody asks it |
| **Answerable from the text** | The ESV gives a definite answer you can show in 2–4 verses | Speculation, or the text is silent |
| **Surprise** | The answer reverses what most people assume, through a detail they've never noticed | Everyone already knows it |
| **Picturable** | A person doing something or an object something happens to, in every beat; a strong hook image; a natural callback image for the end | Abstract ideas only |
| **Fit** | No Lintel topic (we copy structure, not topics); no hot-button fight without a clear text answer; ESV only | A copy of a hit, or bait |

Keep topics scoring **18 or more of 25**. Prefer the highest Demand × Surprise.

## 2. The demand check (5 minutes)

1. Type the hook's core into Google and YouTube search, and note the autocompletes.
2. Look for "People also ask" and the number of Q&A pages (GotQuestions, BibleProject, Christianity Stack Exchange, Reddit threads with many replies).
3. Write the evidence links next to the candidate in the episode bank.

## 3. Write the candidate card (one per topic, in `research/episode_bank.md`)

- **Hook:** third person, at most 15 words, naming the person or object.
- **Sharpen:** a second sentence with a concrete Bible fact.
- **Answer:** one plain sentence, as the text gives it. Settled or contested? If contested, the main views in one line.
- **The turn:** the overlooked detail and its verse.
- **Three things most viewers don't know,** each with an ESV reference.
- **1–2 short ESV quotes** (verified word for word).
- **The hook image and its first motion; the final image that calls back the hook.**
- **Risk notes:** doctrinal sensitivity and accuracy traps.
- **The scores and the total.**

## 4. Avoid (the low patterns)

- Second-person or devotional hooks ("Are you…", "Why do we…").
- Abstract doctrine with no person or object ("If God is love, why is there a hell?").
- Pure retellings of a famous story (story-led reels were the two lowest on the model channel).
- "What if…" hypotheticals with no answer.
- Topics that only work by naming outside authorities.

## 5. Series fit

| Series | Use it for | Length |
|---|---|---|
| ASK THE TEXT | A searched puzzle with a definite answer | 90–120 s (cap 135) |
| MOST PEOPLE MISS | One overlooked detail that changes a famous story | 30–60 s |
| STRANGE BUT TRUE | One strange fact in the text, explained | 30–60 s |
| MISQUOTED | A famous "Bible" line that isn't there, or means something else | 30–60 s |

## 6. After choosing

Write the `answer:` line and `## Value` first, then follow `02_story_and_script.md`. Marcus picks the topic: give him the top 3 cards with their scores, never just one.

## 7. How the episode bank scores (and how it maps to §1)

`research/episode_bank.md` (Oct 31) scores four tests out of 20: **Demand, Clarity** (= answerable from the text), **Visual** (= picturable) and **Surprise**. **Fit** is a gate, not a score: any topic a reference channel already made is excluded or moved to the reserves (it dropped "Is money the root of all evil?" and set Cain's offering aside because Lintel made "Cain's wife"). A bank total of **16/20 or more** matches the 18/25 bar above.

Each card also carries:
- the autocomplete phrasings, quoted as Google returned them (these are the best hook wordings to test);
- the ESV quotes, verified one page per fetch (re-verify at script lock: the fetch tool summarised pages);
- risk notes, including accuracy traps already found (e.g. Ananias and Sapphira "breathed their last": the text doesn't narrate "God struck them").

**Adding a card:** follow §3, score with the same four tests, and say which phrasings autocompleted. Questions viewers ask in the comments (the `questions_asked` column of `system/publish_log.csv`) are the best new candidates, because the demand is proven on our own audience.

## 8. A first slate (proposal; Marcus decides)

**Cadence:** `10_publish_and_growth.md` §4.1 recommends two posts a week you can keep up, three episodes banked before launch, and never a skipped week. The short series (MOST PEOPLE MISS, STRANGE BUT TRUE, MISQUOTED; 30–60 s) fill the gaps between ASK THE TEXT episodes.

**Fixed dates in the season ahead** (2026–27):
- **Christmas:** the wise men (bank #5) needs to go out in early to mid December, when the search spikes.
- **Easter 2027 is Sunday March 28** (Good Friday March 26, Palm Sunday March 21). Holy Week fits the temple curtain (bank #11, Good Friday) and the tables in the temple (bank #12; Mark places it in Jesus' last week).

**A suggested order for the ASK THE TEXT episodes after Samson** (mixing Old and New Testament, the strongest scores first, and the two seasonal slots held):

| Slot | Episode | Bank score | Why here |
|---|---|---|---|
| Ep 2 | Jonah: why he ran | 20 | The top score; low risk; a named third-person hook to test against Ep 1's "you" hook (hypothesis H1 in `11_lessons_log.md`) |
| Ep 3 | Peter sinking (the "fourth watch", 3–6 a.m.) | 18 | Explains the channel's name early, as Lintel's Exodus 12 reel did for theirs; pin it to the profile |
| Ep 4 | The forty years in the wilderness | 20 | Top score; strong counter and tally devices ("eleven days", "a year for each day") |
| Ep 5 | The wise men | 19 | Early to mid December |
| Ep 6 | Ananias and Sapphira | 19 | New Testament; a strong "But notice" |
| Ep 7 | Uzzah and the ark | 19 | Sensitive; by now the format is proven |
| Ep 8 | Moses and the Promised Land | 19 | Pairs with Ep 4's world, reusing its desert sets |
| Holy Week | The temple curtain (Good Friday) | 18 | Easter 2027 |

**Reuse matters for speed:** episodes that share a world share sets, props and costumes in the engine. Ep 4 and Ep 8 share the wilderness (and Moses); Jonah and Peter share boats and the sea. `system/12_engine_guide.md` lists what is Samson-specific and what can be reused.

This is a proposal only: Marcus picks every topic (decision 12 in `DECISIONS.md`).
