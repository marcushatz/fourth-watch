---
name: "fw-script-review"
description: "Automatically review a Fourth Watch script with four independent reviewers (ESV fact-check, first-time viewer, cold editor, director) plus the checker, then merge the fixes. Use on every script revision or when Marcus says \"check the script\"."
---

# Fourth Watch script review (automatic)

Run this on EVERY script revision before Marcus sees it, and whenever he says "check the script". It replaces pasting the script into ChatGPT by hand: the same unbiased read, plus an ESV fact-check, done in parallel.

The exact reviewer briefs are saved in the project's `prompts/` folder (A–D here, plus E for a shot plan, F for a two-variant test, G for auditing a rules file); `system/03_script_review.md` is the reference version of this loop. Marcus's priority (Round 16): the script and story must be good for the viewer and never feel slow.

## 0. Gather
- Read:
  - the episode's `episode.md` (the VO lines with their [references]);
  - the latest rounds of `research/feedback_rules.md` (Marcus's standing rules; they override any reviewer);
  - `research/script_rules_from_hits.md` §3 (14 script rules measured on 13 Lintel Shorts);
  - `research/direction_rules.md` (how a line becomes a picture, measured on 24 Shorts across three channels);
  - `system/02_story_and_script.md` §3, the drag list: signposts, recaps, explained contrasts, story after the answer, warnings aimed at the viewer, facts with no why.
- Back up the script first: `episode_vNN_backup.md`.

## 1. The checker
`python3 fw_check.py script episode.md --out qa/script_vNN`. Fix every FAIL. Note the WARNs, especially the hit-structure ones: budget, hook form, turn, story share, answer timing, echo, "you" lines and closing question.

## 2. Four independent reviewers, launched in ONE message so they run in parallel
Each is a fresh general-purpose agent that has never seen a draft. Give each only what is listed.

**A. ESV fact-checker (tools allowed).** Give: every numbered VO line with its references. Tell it: look up the ESV on esv.org / biblegateway (version=ESV) / biblehub esv, ONE page at a time (they rate-limit), check long verses in segments; report per line VERIFIED / CORRECTION (exact fix) / OVERCLAIM (accurate rewording that keeps the line's purpose); quotes word for word (ellipsis allowed); quoted verbs must match the ESV; counts must hold for every item; implied events must not be stated as fact ("God answered"); nothing called "last" unless the text makes it last; collective descriptions are not applied to one person; list the pages fetched. Under 600 words.

**B. First-time viewer (NO tools).** Give: the VO lines only, no references, no notes. Persona: an 18-30 year old who grew up loosely around church, scrolling Reels, hearing it once. Ask: the question and answer in their words (1-5 clearly answered); the swipe point and why; every confusing line or word; repetitive, slow, preachy, corny or judgmental lines; strongest and weakest line; everything they learned; whether the ending lands and what they'd comment; one concrete fix per problem. Under 500 words.

**C. Cold editor (NO tools).** Give: the VO lines only. Persona: a professional short-form video editor and script doctor with no stake in the project, reviewing without bias. Give it this brief too (copy it): "In the hit reels of this genre, the hook asks about a named Bible person or object in the third person; a 'But notice…' turn comes by ~25 s after at most ~14 s of story; the core answer is stated plainly by the midpoint, then the second half adds 2–4 new pieces of evidence (not more story or more lessons); every quote is followed by a line saying what it proves; the hook's own words come back at 75–90%; at most 3 lines speak to 'you'; no outside authorities." Ask: is the hook clear, and is it a puzzle people already type; does the structure stay focused on one sharp takeaway or sprawl; where does the turn land, and how much story comes before it; where tension builds or leaks; which lines are imprecise or overstate the Bible; runtime and pacing feel; the single strongest line to build around; the ending (does it land, should it end on a line or a question); up to 6 specific edits with exact rewording. Under 450 words.

**D. Director (NO tools).** Give: the VO lines only, plus this brief (copy it): "The hit reels of this genre show every spoken clause happening: a verb is acted by the character on that word; an idea becomes one object that something happens to, named by a 2–5 word label; something visibly changes about every 2 s or more often (an action, an entrance, a label, a light, the camera arriving), and at most one stretch sits still over 6 s; a list gets one beat per item; the first visible change comes by 1.3 s and the first big change lands on the question's key word; the question is finished by 5.5 s; the final image is the answer as a picture with a callback to the opening image; a typical shot is 3–5 s, about one new picture per sentence, nothing under 1 s; quoted claims can be speech bubbles; a verse held on screen is acted on (a phrase lights up on its word)." Persona: an animation director for faceless short-form reels who must storyboard this script in a simple 2D/3D diorama style. Ask: for every sentence, the picture you would show (who does what, or which object and what happens to it, plus the label); every sentence you could only show as a character standing or as text on a card, with a rewrite that makes it showable without changing the meaning or the Bible claim; the hook frame and its first motion; where a list or a contrast would make a strong shot sequence; the arrival image and the callback for the ending; the estimated number of shots and runtime. Under 500 words.

## 3. Merge (you decide; Marcus's rules win)
- **Save first:** write each reviewer's full reply word for word to the episode's `qa/<round>/` folder (`A_factcheck.md`, `B_viewer.md`, `C_editor.md`, `D_director.md`) before merging. Any quote used later in a guide, a plan or `DECISIONS.md` must be findable in one of these files.
- **Accuracy:** apply every CORRECTION and OVERCLAIM fix from A. If B or C suggests wording that A's rules would fail, re-check it against the ESV before using it.
- **Pictures:** take D's rewrites only when A's rules still pass (re-check them against the ESV) and they keep the line's meaning; put D's pictures into the shot list draft (they become `act`/`change`/`pill`).
- **Clarity:** apply fixes that two reviewers agree on, or one reviewer flags with a clear cause, unless they break a standing rule from feedback_rules.md (examples: never assume the viewer has strayed; no churchy stock phrases; no finger-pointing CTA; keep lines Marcus explicitly asked for and say so).
- **Structure / length:** never restructure on your own. If reviewers agree the structure sprawls or the runtime is long, or the hit-structure checks fail (a late turn, story over 25%, no echo), present it to Marcus as one clear decision with the estimated runtime of each option. Cuts that need no new recording come first.
- Re-run the checker after merging.
- **Re-test** with a fresh first-time viewer (brief B, a new agent). Done when it restates the answer at 4/5 or higher and names no swipe point in the first half. For a choice between two versions, run `prompts/F_variant_test.md` (two fresh viewers, one per version).

## 4. Report to Marcus
1. One line per reviewer: what it found (counts: errors, overclaims, confusions, lines that can't be pictured).
2. The full revised script, changed lines in bold.
3. A short "what changed and why" list (each tied to a reviewer).
4. "What I didn't take" with the reason (his rule, or it breaks accuracy).
5. The runtime estimate: words / 2.6 and / 3.0 words per second (over the whole runtime), plus ≤4.5 s after the last word. The ASK THE TEXT budget is about 230–300 words (90–120 s); the hard cap is 150 s. Say it is an estimate until the voice is recorded.
6. The hit-structure line: hook form, turn time, story share, answer position, the echo and the "you" count, against the hits (from the checker and reviewer C).
7. At most one decision for him (structure, a cut, or a trade-off). Add it to `DECISIONS.md` in the project root, with the evidence (quoted from the saved replies) and a recommendation.

Log any new correction Marcus gives afterward as a standing rule in `research/feedback_rules.md` (a new round), and update the episode's `runsheet.md` (stage 3).