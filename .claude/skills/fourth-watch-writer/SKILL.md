---
name: fourth-watch-writer
description: Research, argue and write an original Fourth Watch Bible investigation script (230-270 words) through quality gates, from a topic or a question to a script ready for review. Use before any new Fourth Watch script, angle or topic list.
---

# Fourth Watch writer: an editorial system for Bible investigations

**What it does.** It turns a topic ("Jacob", "the bronze serpent") or a question into a script that:
- *investigates* rather than retells;
- connects discoveries across Scripture;
- explains them plainly;
- earns one memorable principle;
- holds up to a fact-check.

**Where it sits.** This skill writes. `fw-script-review` and `fw_check.py script` then review. `fourth-watch-showrunner` takes an approved script on to the shot list, motion, voice and render.

**The bar** is the Bronze Serpent, read with Marcus's own critique (`reference/gold_bronze_serpent.md`). v1 got the structure right; v2 fixed its insight density. Read the file first, every time. The Lintel Network is studied for *structure only*: never reuse, paraphrase or adapt a Lintel script or one of its topics (`reference/lintel_lessons.md` lists them).

**Files in this folder.** They are in the Fourth Watch repo at `.claude/skills/fourth-watch-writer/`. If you are running from an account copy of this skill, read them there; clone `marcushatz/fourth-watch` first if needed.

| File | Read it when |
|---|---|
| `reference/gold_bronze_serpent.md` | Always, before Stage 1. The model, annotated line by line. |
| `reference/weak_vs_strong.md` | Always, before Stage 4. Why our earlier scripts failed, with their actual lines. |
| `reference/discoveries.md` | Stage 2. What counts as a discovery, and what is trivia or a forced link. |
| `reference/verification.md` | Stages 1, 2 and 6. The claim labels, sources and traps we have already fallen into. |
| `reference/angle_scorecard.md` | Stage 3. How competing angles are scored and killed. |
| `reference/lintel_lessons.md` | Stage 4. Measured structure from the Lintel reels; their topics, to avoid. |
| `templates.md` | Every stage. The dossier, angle card, argument map and script formats. |
| `ledger.md` | Before Stage 1 and after Marcus's verdict. Approved scripts, rejected approaches, lessons. |

Marcus's standing rules live in `research/feedback_rules.md` (the Rounds). They outrank this file wherever they are more specific.

---

## The ten principles (each is enforced by a gate below)

1. **Investigate, don't retell.** Spend at most 15% of the words on the familiar story, and only in the lines the investigation needs. The rest goes to discoveries, overlooked details, apparent contradictions, context and connections.
2. **A simple, genuinely intriguing question.** It is about a named person, object or event, asked in the third person, and something people actually wonder. It is investigated *across* Scripture, not by paraphrasing one passage.
3. **Connect the dots.** Each discovery deepens, challenges or transforms the one before. If two discoveries could swap places without loss, they aren't connected.
4. **Explain intricate ideas simply.** Use plain spoken English a 16-year-old follows on one listen. No theology words without a plain gloss. Quote only short ESV phrases; paraphrase the rest in modern English.
5. **Build toward a universal insight.** Generalize what the evidence showed into one memorable principle. It must follow from the discoveries, not be bolted on.
6. **Research and verify.** Label every claim: TEXT, HISTORY, INTERPRETATION or SPECULATION. Never manufacture a connection for entertainment.
7. **Self-criticize aggressively.** Reject:
   - ordinary retellings;
   - superficial trivia;
   - forced cross-references;
   - predictable conclusions;
   - lines that only *sound* profound.
8. **Competing angles.** Write at least 5 angles, score them, kill the weak ones, and develop only the strongest.
9. **Insight density and efficiency (Marcus, Nov 1 17:33).**
   - Something new every 10-15 seconds: a new discovery, a surprising comparison, or a change in how the viewer understands the text. Never just another event from the story.
   - Never re-explain what the hook already revealed.
   - Never spend 15 s on a distinction that takes 5.
   - No recap that repeats an earlier explanation.
   - Aim for **75-95 s (about 190-245 words)**; go longer only if the research turns up enough real material.
   - **The standard:** the viewer finishes having understood a biblical connection they would probably never have found by reading the passages separately.
10. **Learn from feedback.** After every verdict from Marcus, update `ledger.md`, and add his words to `research/feedback_rules.md`.

---

## The workflow: research → discovery → argument → writing → adversarial review → revision

Each stage ends at a **gate**. A script cannot move on until its gate passes. Record the gate results in the episode folder: `ep*/writer/` holds `dossier.md`, `angles.md`, `argument.md`, `drafts/`, `review.md`.

**Start here (Round 39).** Before Stage 1, fill in the idea card from `production/10_creative_decisions.md`. A story starts with a person and a feeling. Where the rules below ask for more discoveries, retelling limits or a new fact every few seconds, the card and Round 39 win: at most three discoveries, each of which has to change the feeling.

### Stage 0. Load (5 minutes, cheap)
- Read `ledger.md`, the gold standard, and the latest 3 Rounds of `research/feedback_rules.md`.
- If Marcus gave a topic, write it down in his words. If he gave a script ("approved"), this skill does not rewrite it. Only flag factual errors, with the evidence (gold rule from his Bronze Serpent brief).

### Stage 1. Research → `writer/dossier.md`
Read the passages yourself, in the ESV: whole chapters, not proof-texts. Then search outward:
- **Every other place Scripture mentions the person, object, place or phrase** (search the ESV for the key noun; check the NT's use of the OT passage; check later books that look back at it).
- **The question people ask about it.** Check that it, or a close variant, appears in search suggestions or on Q&A sites (gotquestions, ebible, crosswalk, Reddit). Record the common answer people give. It is usually the thing we will deepen or correct.
- **Context the text assumes** (customs, geography, a word's meaning). Only from a named source, and labeled HISTORY or INTERPRETATION.
- **What the text does NOT say.** These are the traps: words like "forgave", "blind", "judged", motives, causes.

**Gate 1 (Topic worth it?).** All must hold, or you stop and pick another topic:
- [ ] The question is about a named person, object or event, in the third person, and fits in ≤ 12 words.
- [ ] The common answer is incomplete, wrong, or missing the part that matters.
- [ ] At least 2 or 3 strong discoveries exist that a church-raised 25-year-old probably doesn't know.
- [ ] They sit on ONE thread (one object, one person, one phrase or one problem), not a scatter.
- [ ] It isn't a Lintel topic (`reference/lintel_lessons.md`) and isn't in `ledger.md` as rejected.

### Stage 2. Discovery → `writer/dossier.md` (discoveries table)
Write each discovery as one row:
- the claim;
- its label (TEXT / HISTORY / INTERPRETATION);
- the exact ESV words (fetched, not remembered);
- the source;
- "what a viewer believes before this";
- "what they believe after".

Use `reference/discoveries.md` for what qualifies.

**Gate 2 (Discoveries are real):**
- [ ] Each one changes a belief: its before and after differ.
- [ ] Each TEXT row has its ESV words fetched in this session (esv.org, or biblehub ESV when esv.org is blocked).
- [ ] No row relies on folk etymology, gematria, "hidden codes", a later legend presented as Scripture, or a scholar alone carrying the claim.
- [ ] Each cross-reference passes the **link test**: the later text *names or quotes* the earlier one (John 3:14 names Moses' serpent), or a mainstream commentary makes the link and the script says it is a reading. "These two things look alike" fails.

### Stage 3. Angles → `writer/angles.md`
Write **at least 5 competing angles** for the topic: different questions, different spines, different payoffs. Score each with `reference/angle_scorecard.md` on:
- originality;
- depth;
- curiosity;
- clarity;
- shareability.

Each is scored 1-5, with a one-line reason per score. Kill any angle with a 1 or 2 anywhere, or with fewer than 3 discoveries on its thread.

**Gate 3:** at most **3** angles survive, each with a 12-word question, a one-sentence answer, and its 3-5 discoveries in order. These are what Marcus sees when a choice is his (Round 27: only show options you have concluded are great). If he has already chosen, take the top-scoring one.

### Stage 4. Argument → `writer/argument.md`
Before writing a single line of narration, build the argument map (template in `templates.md`):
1. **The question** (the hook, word for word).
2. **The answer in one sentence.** It must be stateable by the 50% mark.
3. **The chain.** Each step pairs a discovery with the question it raises next: "Discovery 1 → so the viewer asks Q2 → Discovery 2 answers it and raises Q3 → …". The Bronze Serpent v2 chain: *the calf (not commanded) and the serpent (commanded) were both worshiped and destroyed* → *how can God's command become an idol?* → *2 Kings files Moses' serpent with the idols: offerings* → *opposite beginnings, same ending* → *yet Jesus brought it back* → *"lifted up" = his death (John 12:33)* → *John 3:16 begins "For": it explains the serpent* → *Hezekiah destroyed the object; Jesus kept the meaning*.
4. **The viewer's next questions** (Round 21). List every question the hook raises in a viewer's head, and the line that answers each. An unanswered one is a defect.
5. **The principle.** One sentence, derived from the chain, true for every viewer, not accusing (Rounds 12-14).
6. **The screenshot line** (the one people would repeat).

**Gate 4 (The argument holds):**
- [ ] Reading only the chain, a stranger can say what the video argues.
- [ ] Each step transforms the previous one (contradiction, reversal, deeper reason, new meaning), not just "and also…".
- [ ] The principle could not have been written before the research.

### Stage 5. Writing → `writer/drafts/vNN.md`
Write the narration in the series format (`templates.md`; `fw_check.py` reads it). Rules:
- **The hook** is the question, spoken by about 6 s. The second sentence sharpens it with a concrete fact (gold: "Centuries later, a faithful king smashed it to pieces. Then Jesus used it to explain eternal life.").
- **The familiar story** gets one or two plain lines, entered at the scene that holds the first discovery ("In Numbers 21, deadly snakes were biting the Israelites.").
- **Ask the viewer's questions out loud** at the hinges ("Now here's the problem." / "Why?"). This is what makes a chain feel like an investigation.
- **Each quote** is short, exact ESV, and followed by a plain line saying what it shows.
- **Timing:** the turn by about 25% of the runtime; the core answer by 35-50%; the second half adds evidence or a transformation, not more story; re-ask or echo the hook near the end; land the principle.
- **Words:** 190-245 (75-95 s). Count them, and say why if it runs over.
- **The insight timeline** (Gate 5): split the draft into 15-second windows (about 39 words each). Name the new discovery or understanding in each window. A window with none fails, and so does any line that restates what the hook already revealed.
- **Plain register:** modern spoken sentences of 8-20 words. No note fragments, no arrows, no "Look at Jacob." stage directions, no archaic quotes longer than about 15 words (Marcus: "weird way of talking").

**Gate 5 (Form):** `python3 fw_check.py script <file> --out <dir>` has 0 FAIL, and every WARN is fixed or justified in one line. Also measure:
- [ ] Familiar-retelling words are ≤ 15%. Count them and record the count.
- [ ] The insight timeline has something new in every 15-second window, with no restatements of the hook and no recaps.
- [ ] ≤ 3 you-lines, and none describes the viewer's conduct.
- [ ] Every book cited sits on the thread (no side trips; Ep 4 v6 hopped across 7 books).

### Stage 6. Adversarial review → `writer/review.md`
Attack your own draft first, then get independent reads.

**A. The six rejection tests.** You run these yourself. Answer each in writing; a "yes" means rewrite.
1. **Ordinary retelling?** Would someone who knows the story learn nothing in the first 20 seconds?
2. **Superficial trivia?** Is any discovery a fun fact that doesn't move the argument?
3. **Forced cross-reference?** Does any link fail the link test?
4. **Predictable conclusion?** Could a churchgoer have guessed the principle from the title?
5. **Merely sounds profound?** Paraphrase each aphorism plainly. Does it still say something?
6. **Unanswered next question?** Is there one the viewer will still have at the end?

**B. Independent reads.** Use fresh agents, launched together:
- the ESV fact-check;
- one first-time viewer with no tools.

Briefs are in `fw-script-review`. Round 20 limits: ONE fact-check on the candidate, then only the changed lines afterwards. Label every AI reader as AI, and never quote an AI score as audience evidence (Rounds 17, 26).

**Gate 6:** all of these must hold:
- every quote VERIFIED;
- every OVERCLAIM reworded;
- the viewer restates the answer and the principle correctly in their own words;
- the viewer lists at least 3 things they didn't know;
- the six tests are answered "no".

### Stage 7. Revision
- **Fix the spine, not the lines.** If the reviewers find a gap, go back to the argument map and change the chain. Then rewrite.
- **Never patch** by adding a verse per complaint. That is how Ep 4 v6 became a list of facts (Round 26).
- **At most 3 revision rounds.** Then show Marcus the best version with an honest verdict: what the message is, whether every line serves it, and what is still weak. Not an AI score.

### Stage 8. Hand-off and learning
- Hand Marcus the exact script lines, the one-sentence message, the word count, a runtime estimate (words ÷ 2.6 + ~3 s), and the open risks. Nothing else.
- After his verdict, update `ledger.md` the same day:
  - approved: the reason;
  - rejected: his words and the lesson.

  Also append the Round to `research/feedback_rules.md`.

---

## Cost discipline (Rounds 20, 26)
- Research in the main thread: WebSearch, then WebFetch the ESV pages you need. A fresh agent costs about 75k tokens before it reads anything, so only the two independent reads in Stage 6 use agents.
- One fact-check, then only the changed lines. Don't re-run reviewers to chase scores.
- Don't present option libraries. At most 3 angles, each one already judged great.

## Never
- Rewrite an approved script without naming a factual error and the evidence.
- Copy, paraphrase or adapt a Lintel script or one of its topics.
- State an interpretation as Scripture, or an implied event as a recorded one ("God answered", "he forgave").
- Use outside authorities to carry the argument (the Lintel lows did; `research/script_rules_from_hits.md` §2a.5).
- Assume or describe the viewer's spiritual state; use churchy stock phrases; end with a follow or community ask.
