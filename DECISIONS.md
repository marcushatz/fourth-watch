# Decisions waiting for Marcus

**Use this when** Marcus is back. Every open choice is here with the exact wording to approve, the evidence and a recommendation. When he decides, record it as a new round in `research/feedback_rules.md` and update the file it names.

Last updated: Nov 5 (after Round 49).

**About the evidence:**
- **"Simulated viewers" are AI agents** role-playing a first-time viewer. They can flag confusion and slow, preachy or unclear lines. They can't tell us retention, swipes or sharing; only real posts can.
- **"Fact-checkers" are AI agents** that read the ESV pages online. Their saved replies are in each episode's `qa/` folder.
- **"Judges" are AI agents** too: three per run, blind, each scoring our script beside 9 Lintel reels with known views (`tools/script_judge/rubric.md`). They agree with each other and repeat themselves, but **their scores don't predict views**: the 7.6M Lintel hit got 5/10 from all 15 judges. Read their verdict as "as well built as the best Lintel reel", never as "will perform".

---

## Decided by Marcus (Nov 3, Round 37)

- Phase 0 of the one-idea system is approved at no credit cost.
- Higgsedit is the primary assembly engine, and other tools remain available.
- The hybrid visual philosophy is approved, as creative judgment rather than rigid rules.
- The revised Bronze Serpent script stays unlocked for now.
- Narration, music and paid generation wait for the next meaningful production milestone.

## Waiting on Marcus (Nov 5, 2026)

- **Story skill test:** `fourth-watch-story` is a draft in `.claude/skills/fourth-watch-story/`. Its test, in `evals/test_plan.md`, compares it with `fourth-watch-writer` on four passages. It needs about eight agent runs and no credits. He needs to approve the runs or change the passages.
- **First video:** the beginning of the world. He rejected the story at script v4 (Round 54) and chose a new question: "If God doesn't need anything, why did he make you?" (Round 55). Script v5 is waiting for his approval (`ep11-beginning/writer/script_v5.md`). The storyboard comes next, then tweaks. No video yet.
- **Credit budget:** he'll set it later and cares about quality first. The balance is 76.47, and every paid job still needs his approval.
- **Series voice:** not chosen.
- **Lifting the lock:** Higgsedit runs in the Higgsfield sandbox, which the lock blocks. Building the first video needs his words to lift it.
- **Storm script v4:** `ep10-fourth-watch/writer/script_v4.md` is an unlocked candidate of 327 words. It needs a verdict, and a decision on trimming.

## Waiting on Marcus (Nov 3, 2026)

0. **The debut.** Marcus rejected the storm script v3 (Round 42), so the debut is open again. The doc "Fourth Watch: Writer Comparison" recommends splitting the writing work and needs his decision on the split and on rewording the hook rule. Hagar `ep06-hagar/writer/script_v4.md` is still an unlocked candidate, and he hasn't ruled on it.
1. **Repo visibility:** GitHub still reported it as public on Nov 3. This session can't change repository settings, so Marcus has to switch it.
2. **Puppet test and identity draft:** judge the 7 s test and `production/01_brand_and_references.md` from the proof frames.
3. **Bronze Serpent story (paused):** the proposal is `ep02-bronze-serpent/writer/lifted_up_2026-11-03/candidate_v3.md`, with the reasoning in the doc "Bronze Serpent: Story Architecture". Unlocked. The calf candidate `candidate_r5.md` stays as it was. The storyboard waits for this decision.

## Decided by Marcus (Nov 2, Round 33)

- gouache-01 is on hold until 2.5D and 3D have been compared.
- PR #1 stays available for merging, and the system must support both styles.
- The repo should be private. Client testimony material stays in a separate private workspace.
- Bronze Serpent v4 remains the approved, locked script.
- No subscription changes on his behalf.

## Still open from Nov 2

3. **Series narrator:** Gideon on Eleven v4 was only a test. Decisions 9 and 16 below are still open. Check the terms for voices made through Higgsfield before release.
4. **Caption disclosure:** "Animation drawn in code" must change if AI art is used.
5. **Testimony preset:** the structure exists, but its creative rules are blank until Marcus sets them. Its safeguards are proposals (`presets/christian-testimonies/PRESET.md`).

---

## Decided on Oct 31 (Round 17): done or in progress

| # | Decision | What was done |
|---|---|---|
| 1 | Cut the Matthew 7 warning | Out of `ep01-samson/episode_v60_draft.md`, the caption and the references |
| 2 | Outro A | Jesus fades in under the closing question and is still by its last word (`shotlist_v60.md`, rows Z1–Z2) |
| 4 | Cut both optional lines | "Earlier… Now…" and "You can be gifted, lead, and help people." are out of v60 |
| 6 | No speed-up | Dropped |
| 12 | Ep 2 is Jonah, with Nineveh explained by a sourced historical line | `ep02-jonah/episode_v5_draft.md` (see B below) |

## Fixed without asking (Round 17: technical and accuracy fixes are routine)

- **Bible accuracy (Ep 1):**
  - The cloth over Samson's eyes is gone from shot M4; he's seen from behind and above.
  - "Pushed against the pillars" now uses the ESV verbs, "leaned his weight against the two middle pillars and bowed with all his strength", in the script, the shot list and the recording list. An AI fact-checker verified it.
- **Silent renders:**
  - The soundtrack script now also writes `out/music.wav`, which `render.js` reads for sound.
  - The current Ep 1 soundtrack is in place.
  - A 1-second test clip now comes out with an audio stream.
- **Wrong soundtrack file:** `song.js` was a stale v46 copy. It's now the current v57 script; the old text is kept as `song_v46.js`.
- **Inconsistent versions:**
  - The new release manifest checks that the script, `vo.js`, the score, `song.js` and `music.wav` belong together.
  - **v57** passes as a consistent set.
  - **v60** is correctly flagged as not releasable until it's recorded and re-timed.
- **The shot-list checker** didn't count a speech bubble as a visible change. A test clip caught it; it's fixed, and the new fingerprint is `67d3a266…`.
- **Engine docs** now say which features don't exist yet (crossfade, sub-frame motion blur), and the scene contract lists the fields film.js reads.

---

## A. Ep 1 Samson: which script (the straight answer to "is it good enough?")

**Verdict:** you were right. v60 isn't good enough, and the problem is the opening, not the story. Restructured, the same story reaches the top of the panel.

| Script | Judges' Overall (3 each) | Hook | Lowest score | Panel verdict | Words · runtime |
|---|---|---|---|---|---|
| v60 (the current draft) | 6, 7, 6 | **2** | Hook 2 | **NOT YET** | 317 · ~114–116 s |
| **v64 (recommended)** | 7, 7, 8 | **5** | 4 (every criterion 4–5) | GOOD ENOUGH | 302 · ~105–120 s |
| v64b (v64 with your two opening rules kept) | 7, 7, 7 | 4 | Takeaway 3 | GOOD ENOUGH | 314 · ~110–125 s |
| Best Lintel reel in the set ("Cain's wife", 1.8M) | 7 (15 judges) | 5 | Ending 2 | — | — |

**What's wrong with v60, in the judges' words and the new checks:**
- **The hook.** Every judge, in every run that included it, rated it 2/5: "a sermon question aimed at 'you'". All of them proposed the same fix: open on Samson's own puzzle, that his strength still worked the night in Gaza.
- **The weakest line,** named in every run: "Let's look at Samson, known as the strongest man in the Bible."
- **Repetition.** The new checks count "still using you" ×3 and "how you're living" ×3.
- **The answer comes late.** It lands at ~56% of the runtime; the hits land it at 33–50%.

**What v64 changes:**
- It asks about Samson, not you.
- It proves the answer with three things most viewers don't know:
  - "the Spirit of the LORD rushed upon him", three times;
  - 14:4, "it was from the LORD";
  - his job before birth (13:5).
- It sets up "as at other times" before the turn line.
- The prayer pays off on screen.

**The checks it passed:**
- Four AI fact-check passes, every line VERIFIED (`ep01-samson/qa/script_v62` to `script_v64b`).
- `fw_check.py` 0 FAIL, and the panel gate PASS.

**The full v64 narration** (`ep01-samson/episode_v64_candidate.md`):
> Why did Samson's strength keep working, even the night he slept with a prostitute?
> That same night in Gaza, men waited to kill him at dawn. At midnight, he pulled up the city gate, posts and all, and carried it to the top of a hill.
> It looks like God didn't care how he lived. But look at where the text says his strength came from.
> Three times, it says the same thing: "the Spirit of the LORD rushed upon him."
> Even when he demanded a Philistine wife, his parents "did not know that it was from the LORD, for he was seeking an opportunity against the Philistines."
> Judges never calls his strength a reward. Before he was born, he was given a job: he would "begin to save Israel from the hand of the Philistines."
> And his strength working never proved that God approved of how he lived.
> While he slept, Delilah had his seven locks shaved off, and his strength left him.
> He woke up expecting it to work like before: "I will go out as at other times and shake myself free."
> "But he did not know that the LORD had left him." *(verse card)*
> Blinded and brought out to entertain his captors, Samson prayed, "O Lord GOD, please remember me and please strengthen me only this once..."
> Then he leaned his weight against the two middle pillars and bowed with all his strength, and the house fell.
> And Hebrews 11 still names him in a list of people who, through faith, "were made strong out of weakness."
> So why did Samson's strength keep working? Because it came from God, for God's purpose. And even at his lowest, he could still call on God.
> What surprised you more: God still using Samson, or Samson not knowing the LORD had left him?

**v64b** (`ep01-samson/episode_v64b_candidate.md`) is the same except for three lines:
- **Hook:** "Why did God keep using Samson?"
- **Second line:** "Let's look at Samson, known as the strongest man in the Bible. One night in Gaza, he slept with a prostitute. That same night, men waited to kill him at dawn. At midnight, he pulled up the city gate, posts and all, and carried it to the top of a hill."
- **Re-ask:** "So why did God keep using Samson? Because his strength came from God, for God's purpose. And even at his lowest, he could still call on God."

**Why v64b exists:** two of your earlier wording rules are to introduce the story naturally ("Let's look at Samson, known as…") and never to open cold on a sin. v64's first line names the prostitute, and it drops the introduction. v64b keeps both rules. It still passes, but all three of its judges named "Let's look at Samson…" as its weakest line, and its hook scores 4 instead of 5.

**What choosing v64 or v64b costs:**
- **A new narration take.** Almost every line differs from the v57 recording, so it's a full take, not pick-ups.
- **A new shot list** for your OK before anything is animated (Round 15).
- The v60 shot list and `v60_recording.txt` would be retired.

**Not taken:** two run-4 judges wanted the re-ask to restate "power isn't approval" instead of "he could still call on God". That would undo run 3's fix (that point was being said three times) and cut a line you approved, so it's yours to ask for.

**Your choice:**
- **v64** (recommended);
- **v64b** (your opening rules kept);
- **or stay with v60.**

### 5. The closing question (pick one)

All four were verified against the ESV.

| | Exact words | Words |
|---|---|---|
| **D** (recommended with v64; in v64 and v64b) | What surprised you more: God still using Samson, or Samson not knowing the LORD had left him? | 17 |
| A (in v60) | What stands out more to you about Samson: his failures, or his prayer at the end? | 15 |
| B | What stands out most about Samson: his strength, his failures, or his prayer at the end? | 15 |
| C | Which line hit harder: "he did not know that the LORD had left him," or "remember me"? | 17 |

- **Why D:** with A, every v63 judge said the question "doesn't test the takeaway". With D, the Ending score rose from 3 to 4. One v64b judge still called D a "meta poll".

### The answer line before the question
- **With v60:** unchanged since v59 and verified:
  > So does God still using you mean He's okay with how you're living? Samson's strength never proved that. But even at his lowest, he could still call on God.
- **With v64 or v64b:** the re-ask shown above.

### 11. The spoken ESV credit (required; pick the wording)

- **The requirement:** Crossway lists video among the media that need the full notice, and says: "Verbal credit must also be given to the 'ESV'." (crossway.org/rights-and-permissions/esv, checked Oct 31). Text alone doesn't meet it.
- **Placement:** read lower and quieter under the outro hold.

| | Exact words | Length |
|---|---|---|
| **1** (recommended) | Scripture quotations are from the ESV. | ~2.2 s |
| 2 | Scripture from the ESV. | ~1.4 s |

### 3. Record the pick-ups (v60 only)

If you choose v64 or v64b, this becomes a full take instead; the paste file follows your pick. For v60, `ep01-samson/v60_recording.txt` has five lines, word for word, for the same ElevenLabs voice and settings as the v57 take:
- the "Samson prayed," splice;
- the pillar line;
- the re-ask;
- the closing question;
- the credit.

The full v60 runs about 114–116 s (an estimate until recorded). The details are in `ep01-samson/v60_plan.md`.

## B. Ep 2 Jonah v5: APPROVED as written (Round 19, Oct 31 22:59)

- **What's approved:** `ep02-jonah/episode_v5_draft.md`, word for word. That keeps the current re-ask and the one-line Nineveh history ("Historically, Nineveh was one of Assyria's great cities.").
- **The panel:** the blind AI judges scored it 8, 8, 8, GOOD ENOUGH.
- **Next:** the shot list. Nothing is animated until you've seen and OK'd it (Round 15).

## C. Rights and labels (checked on the official pages, Oct 31)

### 9. The ElevenLabs plan

The official help page says:
- "The free plan does **not** include a commercial license and cannot be used for any commercial purpose."
- Free-plan content must include "elevenlabs.io" or "11.ai" in the title.
- "Content created outside of a paid subscription (before or after) cannot be used commercially."
- "Content generated using Beta Services cannot be used for any commercial purpose or in any production environment."

**Two questions for you:**
- Was the v57 take recorded on a paid plan?
- Will the pick-ups be?

If a take was made on the free plan, it carries the title attribution and can't be used commercially later. Whether an unmonetized channel counts as "commercial" isn't defined on that page.

### 10. The Instagram AI label: required, so it's on by default

Instagram's own help page ("Label AI content on Instagram", help.instagram.com/761121959519495, iPhone version, checked Oct 31 at 22:55) says:
- "Meta requires you to label content you share that has photorealistic video or realistic-sounding audio that has been digitally generated or altered, including with AI."
- Among its examples that require a label: "A reel narrated with a realistic AI-generated voiceover".
- Among the examples that don't: "Video of an outdoor landscape, created in a style resembling a cartoon".
- "There may be penalties if you do not label content as required."

So the animation alone wouldn't need it; the AI narrator does. The label goes on every reel, plus the caption line "Narration: synthetic voice. Animation drawn in code." If you ever narrate in your own voice, the label stops being required. Nothing to decide unless you object.

## D. The system

### 13. The private GitHub repo: approved (Round 19); waiting on your GitHub

The voice takes exist only in this workspace, which is wiped after a stretch of inactivity.

**Ready:** the repo is built locally:
- the system, the scripts, the engine code and the Ep 1 voice take;
- no renders, no other creators' media, no keys.

**Blocked:** this session has no GitHub account linked, and the GitHub token it carries is invalid. I can't create the repo or push until you:
1. **Connect GitHub to Claude:** claude.ai → Settings → Connectors → GitHub.
2. **Create an empty private repo** on github.com, for example `fourth-watch`, with no README.
3. **Send me** `your-username/fourth-watch`. I'll attach it and push.

### 16. The narrator: keep the AI voice, or switch? (you asked, Oct 31)

**The facts** (Instagram's own help pages, checked Oct 31):
- With the AI narrator, every reel must carry the AI label: "A reel narrated with a realistic AI-generated voiceover" is one of Instagram's examples.
- Neither page says the per-post label lowers reach. The separate "AI-generated profile" label is for accounts that post "an AI-generated person", which Fourth Watch doesn't. For that one, Instagram says the label "will neither help nor hurt your account's reach".
- The ElevenLabs plan question (#9) only exists because of the AI voice.

| | What it means | Cost |
|---|---|---|
| **1. Keep the AI narrator + the label** | Nothing changes; the label shows on every reel | A paid ElevenLabs plan for commercial use; the label |
| **2. Your own voice** (recommended to test first) | No label, no ElevenLabs licence question; a real voice on a faith channel. The pipeline already re-times everything to any recorded take | About 15–20 min per episode with retakes, a quiet room, and the same voice every episode |
| 3. A hired voice actor | No label; a consistent pro read | Paid per episode, plus a written licence for commercial use |

**My recommendation:** a 30-second test, not a rethink.
- **The test:** on your phone, in a quiet room (a closet full of clothes is best), record the first four lines of whichever Samson script you pick.
- **What I do with it:** run it through the same pace, loudness and alignment checks, and put it next to the ElevenLabs take.
- **How to decide:** if you like how you sound, switch. If not, keep the AI voice; the label is a small cost.

### 17. Ep 3 "What is the unforgivable sin?": approve the script (you picked card C, Oct 31 23:34; v9 on Nov 1)

**Where it stands:** the script is `ep03-unforgivable-sin/episode.md` (= `episode_v9_draft.md`; v5 and v7 are kept).

**Why v9 (Rounds 20-21: value = answering the viewer's next questions):**

| The viewer's question | Where v9 answers it |
|---|---|
| Could I have done it by accident? | The relief line, about 10 s in |
| What is it? | The scene, then Mark 3:30: "They were calling the Holy Spirit's work the devil's" |
| Has anyone done something terrible and received mercy? | Paul, who dragged Christians off to prison, "received mercy" |
| Why is the Spirit different from Jesus? | "Acting in ignorance, versus knowingly calling God's clear work evil" (attributed) |
| Can someone do it today? | The two views in one line |
| Why can't it be forgiven? | The final answer: "It isn't a sin too big for God to forgive. It's forgiveness someone keeps refusing." |

- **Test viewers** (AI, simulated first-time viewers, `qa/round3/B_viewer_*`): v6 rated clarity 3/5; v8 rated value 3.5/5 and clarity 3/5; the v9 re-watch rated value 4/5 and clarity 4/5, and said it would like, share and follow. These are simulated reactions, not a forecast.
- **AI fact-checks** of every changed line: `qa/round3/A_factcheck_v6..v9.md`. They caught:
  - Mark's accusers aren't Matthew's;
  - "like those men" overclaimed;
  - "many pastors" was more than the sources support;
  - the "if" in Matthew 12:28;
  - Peter: John 21 never says "forgiven", so he was replaced by Paul, whose own words say "mercy";
  - "only those men" was narrowed to "people in Jesus' day".
  Every row is now verified.
- **Research:** `qa/v6_research.md`.
- **Checks:** `fw_check.py` 0 FAIL, 288 words, about 100 s. The judge panel wasn't re-run.

**The full narration:**
> What is the unforgivable sin?
> In Matthew 12, Jesus said "whoever speaks against the Holy Spirit will not be forgiven." Many people fear they've done it by accident.
> Most Christian explanations agree it isn't something done by accident. Some pastors and Bible teachers even say that if you're afraid you've done it, that fear is a sign you haven't.
> So what is it? Look at what had just happened. Jesus had healed a man who was blind and mute and troubled by a demon. The Pharisees said he cast out demons by "the prince of demons."
> Mark records the same charge and says why Jesus warned them: "for they were saying, 'He has an unclean spirit.'" They were calling the Holy Spirit's work the devil's.
> And his warning about the one sin that won't be forgiven starts with the ones that will: "every sin and blasphemy will be forgiven people." *(verse card: Matthew 12:31)*
> Even words against Jesus himself, he said, will be forgiven.
> Even Paul, who once dragged Christians off to prison, later called himself a "blasphemer." He wrote that he "received mercy" because he didn't know what he was doing.
> Many Christians draw the line like this: acting in ignorance, versus knowingly calling God's clear work evil.
> Can someone do it today? Some Christians say only people in Jesus' day could. Others say yes, but only as a deliberate, hardened refusal of God.
> So what is the unforgivable sin? In the text, it's tied to calling the Holy Spirit's work the devil's. And one common way Christians put it: it isn't a sin too big for God to forgive. It's forgiveness someone keeps refusing.
> What surprised you more: that the warning starts with forgiveness, or Jesus forgiving words against himself?

**One open choice: the closing question.** v9 answers the fear early, so a question aimed at that fear now fits. **Recommended: B.**

| | Exact words | Words | Status |
|---|---|---|---|
| **A** (in the script) | What surprised you more: that the warning starts with forgiveness, or Jesus forgiving words against himself? | 16 | Fact-checked |
| B | Did you ever worry you'd committed it, or is this the first you've heard of it? | 16 | No Bible claim to check |

**After you approve:** the shot list. The AI director's 20-shot storyboard ("a ledger of sins being stamped FORGIVEN") is the starting point (`qa/round1/D_director.md`).

### 15. The script check now judges value (Round 18): nothing to decide, but read the limit

- `fw_check.py script` now checks:
  - that every Value item is actually spoken;
  - repeated phrases, signposts, and lines that add nothing new;
  - answer timing across two lines.
- `--judge` adds the blind panel's verdict. NOT YET, or a script changed since judging, is a FAIL.
- 24 test clips pass.
- **The limit:** the panel says whether a script is as well built as the best Lintel reel; it can't say whether it will get views. Real posts are the only test of that.

### 14. Save the two skill updates

Both cards were shown on Oct 31 at night: the showrunner skill and the script-review skill.
- They add the judge panel step and the value checks.
- They carry the new checker fingerprint (`edaaabdd…`).
- **Until they're saved,** a fresh session's fingerprint check fails: the old skill expects `9db74d36…`, but the toolkit page now serves the new checker.

---

## Safeguards added (Round 17)

  - It lists every file with its SHA-256, plus the tool fingerprints and the environment.
  - Its checks include: the script equals `vo.js`, the score loads, `song.js` and `music.wav` are the declared ones, the script checker passes, and the checker tests pass.
  - Ep 1's v57 manifest is written; v60 is checked with `--check`.
- **Pinned environment:** `ENVIRONMENT.md`, `requirements.txt` and `tools/check_env.py`.
  - It covers Chrome for Testing 153.0.8010.12, three.js r158, Node 22.23, ffmpeg 6.1.1, tesseract 5.3.4 and the Python packages.
  - All match on this machine.
- **Checker test clips:** `tests/checkers/`, with 15 fixtures and planted faults:
  - 6 scripts;
  - 5 shot lists;
  - 4 videos (wrong size, frozen, too loud, a clean one).
  - `run_tests.py` reports 0 problems and must pass before any checker change ships.
