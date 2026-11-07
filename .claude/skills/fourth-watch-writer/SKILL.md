---
name: fourth-watch-writer
description: Find, research and write Fourth Watch episodes under the editorial philosophy in EDITORIAL.md. Each episode is a Bible story that meets a real human struggle (Relate), shows something true in Scripture that viewers overlooked (Reveal), and leaves a clearer understanding of God and something to apply (Transform). Use before any new Fourth Watch script, episode idea, angle or topic list, and to review a draft against the approval questions.
---

# Fourth Watch writer

This is the only live writing process for Fourth Watch. It turns a struggle, a story or a question into a script that helps people recognize their own struggle, discover something true in Scripture and understand God more deeply.

**Read `EDITORIAL.md` at the repo root first, every time.** It is the philosophy, and this skill is the process. Marcus's Rounds in `research/feedback_rules.md` outrank both, and the newest one wins. This skill only writes: it never renders, generates, voices, publishes or spends credits (`CLAUDE.md`).

**Approved scripts are locked.** Read the episode folder before writing anything. If you find a problem in an approved script, name it with the evidence and propose a fix. Marcus decides.

The files in this folder are in the Fourth Watch repo at `.claude/skills/fourth-watch-writer/`. Running from an account copy? Clone `marcushatz/fourth-watch` and read them there.

| File | Read it when |
|---|---|
| `EDITORIAL.md` (repo root) | Always, first |
| `templates/idea_card.md` (repo root) | Step 1: one card per candidate |
| `reference/discoveries.md` | Steps 1 and 2: what counts as a reveal, and what is trivia or a forced link |
| `reference/verification.md` | Steps 2 and 6: claim labels, sources, and the traps we've fallen into |
| `reference/retired_rules.md` | When an older guide disagrees with this skill |
| `templates.md` | Every step: the file each step leaves behind |
| `ledger.md` | Step 0 and after each verdict: what Marcus approved and rejected |
| `reference/gold_bronze_serpent.md`, `reference/weak_vs_strong.md` | Step 5: line-by-line examples of reveals that work and lines that fail. The serpent is a model of Reveal only, since Marcus said it doesn't appeal to emotion |
| `reference/lintel_lessons.md` | Only for the ASK THE TEXT investigation format. Their topics are off-limits |

## The process

Each step leaves a file in the episode's `writer/` folder (formats in `templates.md`). A step is done only when its file answers every line. Then the next step can start.

### 0. Check what exists

Read the episode folder, `ledger.md` and the latest three Rounds. If Marcus gave a topic, write it down in his words. An approved script is never rewritten.

### 1. Ideas → `writer/ideas.md`

Start from a struggle or a story, never from a clever detail looking for a use. Investigate several angles before you settle on a hook, and write up to five candidates, one idea card each.

**Gate:** every card answers all nine fields. Drop any idea that fails the card's "Drop the idea if" list, however good its title sounds.

### 2. Research → `writer/claims.md`

- Read the whole narrative and its context in the ESV, fetched in this session.
- Read the supporting passages the story needs, and the common answer people give, with its source.
- List what the text does **not** say. Those are the traps: motives, feelings, causes and "forgave".
- Put every claim the script might make in the claim table, with its label (`reference/verification.md`).

**Gate:** every claim is labeled and sourced, every quotation is fetched, and the reveal survives the link test in `reference/discoveries.md`.

### 3. Choose

If the choice is Marcus's, show him at most three ideas, each one you would defend, and lead with your recommendation. If he has chosen, go on. Reject a concept for a flaw in the concept, never because an early draft was weak.

### 4. Story map → `writer/story_map.md`

Before any narration, write:
- the message, in one sentence;
- Relate, Reveal and Transform, one line each;
- five to eight beats, each with what happens, what the viewer recognizes or learns, and what they feel;
- the turning point, and the event that causes it;
- the ending, and what it pays off;
- every question the opening raises, and the beat that answers it.

**Gate:**
- the reveal is earned by the narrative, not announced before it;
- every feeling comes from an event;
- the application is specific enough to act on;
- the story starts inside the biblical events, not after a lecture.

### 5. Write → `writer/drafts/vNN.md`

Use the script format in `templates.md`, with `series: FOURTH WATCH` unless Marcus names another format.

- Open on the concrete struggle, contradiction, question or event, and enter the story quickly.
- Tell what happened, who was involved and what was at stake. Keep the famous parts moving, and condense rather than skip.
- Quote short, exact ESV words, and follow each quote with a plain line saying what it shows.
- Say an interpretation as an interpretation, in the line itself.
- Connect to everyday life without pretending today is the same as the biblical event.
- Ask few questions, and never the same kind twice in a row.
- Don't tell viewers what they feel or describe their spiritual state.
- Read every line aloud. It must make sense on one listen to someone who has never opened a Bible.
- Length is earned. Most stories land in 60 to 120 seconds, and about two minutes is fine when the story needs it.

### 6. Review → `writer/review.md`

1. Run `python3 fw_check.py script <draft> --out <dir>`. Fix every FAIL, and fix or justify every WARN in one line.
2. Answer the nine approval questions from `EDITORIAL.md` in words, quoting the line that proves each one. A question you can't answer means a rewrite.
3. Do an integrity pass with `reference/verification.md`. Every line matches its claim label, nothing invents dialogue, a motive or a thought, and the order of events matches the text.
4. Independent reads, an ESV fact-check and one first-time viewer, are agents, so ask Marcus first (`CLAUDE.md`). AI readers are critics, never audience evidence. Do one fact-check on the candidate, then check only the changed lines.

### 7. Revise

Fix the spine, not the lines. If a review question fails, go back to the story map. Never patch by adding a verse per complaint. Make one substantive revision and one polish, and no more than three rounds. Then hand over the best version with an honest verdict.

### 8. Hand-off and learning

Give Marcus:
- the title and the one-sentence message;
- Relate, Reveal and Transform, one line each;
- the exact script, with its word count and estimated runtime (words ÷ 2.6, plus about 3 s);
- the claim table;
- what's strongest, what's weakest and what's untested.

Then stop. After his verdict, update `ledger.md` that day, and add his words as a new Round in `research/feedback_rules.md`.

## A script never ships if

- the hook promises more than the substance delivers;
- the reveal rests on speculation, a shared word or a look-alike link;
- it lectures before it tells the story, or retells without revealing anything;
- it tells viewers how to feel, or its emotion comes from adjectives;
- the application is generic, or the ending is bolted on;
- any claim is stated at a higher level than its label allows.

## Cost discipline

- Research in the main thread: WebSearch, then WebFetch the ESV pages you need.
- Agents only with Marcus's OK. A fresh agent costs about 75k tokens before it reads anything.
- Don't present option libraries: at most three ideas, each already judged strong.

## Never

- Rewrite, trim or unlock an approved script.
- Copy, paraphrase or adapt another creator's script or topic. Lintel is studied for structure only.
- State an interpretation as Scripture, or an implied event as a recorded one ("God answered", "he forgave").
- Give God or a character a motive, thought or feeling the text doesn't give.
- Let an outside authority carry the argument, or present history as Scripture.
- Use churchy stock phrases, assume the viewer's spiritual state, or end with a follow or community ask.
