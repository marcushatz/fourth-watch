---
name: fourth-watch-create
description: Turn one idea into a finished Fourth Watch video: script, visual storyboard, voice, animation in Higgsedit, captions, sound and quality check. Use whenever Marcus asks to make, plan, storyboard, animate, voice, caption or finish a Fourth Watch video, or says /fourth-watch-create, even if he only names a topic.
---

# Fourth Watch create

One idea becomes one finished video. You are the director: you write, plan, code and check. Marcus judges at three points: the script, the storyboard and the final video.

**Status:** draft. It hasn't made a video yet. The first video, `ep11-beginning/`, is its test.

**Quality comes first, and credits stay careful.** Work out what a shot needs, then pick the cheapest route that really delivers it.

## Before anything else

1. Read `production/README.md` and the episode folder. An approved script is locked.
2. Run `python3 tools/production_lock.py --status`. While it's locked, nothing renders, the Higgsfield sandbox is blocked and no credits are spent. Only Marcus's own words lift it.
3. Read `.claude/skills/fourth-watch-story/references/standing-rules.md`. Those are his rules for the script and the screen, and they bind every stage here.

## Never

- Publish, schedule or upload anything. Marcus posts.
- Spend credits without his approval of that exact job. Before each one, say what you'll generate, the model, the estimated cost and remaining balance, and why it's needed. Then wait. Silence isn't approval. `production/GENERATION_APPROVAL.md` has the full rule.
- Render video, even for free, without asking.
- Change an approved script.
- Retry a paid job on your own. If it fails or looks wrong, stop and report it.

## The stages

Finish each stage before starting the next. Move through the free work on your own, and stop where it says stop.

### 1. Story (free)

Use the `fourth-watch-story` skill to find the stakes and write the script and creative plan. Check every quote against the ESV.

**Stop:** Marcus approves the script. Save it as `script_approved.md` in the episode folder. It's now locked.

### 2. Storyboard (free)

Read `references/storyboard.md` and `references/directing.md`. Build `storyboard.json` from the creative plan, one row per shot, then run:

```bash
python3 .claude/skills/fourth-watch-create/scripts/check_storyboard.py <episode>/storyboard.json --script <episode>/script_approved.md
python3 .claude/skills/fourth-watch-create/scripts/storyboard_page.py <episode>/storyboard.json --out <episode>/storyboard.html
```

Publish the page as an artifact so he can look at it. Timing can be estimated from the word count at this stage.

**Stop:** Marcus tweaks and approves the storyboard. Nothing is animated before this.

### 3. Voice (paid, ask first)

Read `references/voice-captions-sound.md`. Get one approved take, check it word for word, get word timings, and retime the storyboard to the real take.

### 4. Style and cast (paid, ask first)

The first video sets the one universal style. Propose stills from a key scene, one job at a time. Once he approves one, write it into `production/01_brand_and_references.md`, and every later video reuses it. Read `references/characters.md`. After the first video, this stage only adds new people and sets.

### 5. Build in Higgsedit (needs the lock lifted)

Read `references/higgsedit.md`, then start from `templates/`. Build shot by shot from the storyboard. Check frames as you go, using `higgsedit frame` and `higgsedit sheet`. Use `references/characters.md` for anything that moves.

### 6. Sound (free unless a paid model is approved)

Build the score and effects, then mix under the voice. See `references/voice-captions-sound.md`.

### 7. Check and fix

Read `references/quality-check.md`. Look at the frames, watch the motion, and fix what you can without spending credits. Name the three worst problems honestly.

**Stop:** Marcus watches the final video. Ask before any render he hasn't approved.

### 8. Learn

Record what worked and failed in `production/09_approved_and_rejected.md`, and add his words as a new Round in `research/feedback_rules.md`. Save anything reusable into `templates/`, and keep this file short.

## What Marcus gets at each stop

- The exact work: script lines, the storyboard page, or the video.
- What's strongest, what's weakest, and what's untested.
- Any credits spent, and what the next paid job would cost.
