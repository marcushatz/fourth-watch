# Fourth Watch: standing instructions

These rules bind every session in this repository. Marcus's own rules in `research/feedback_rules.md` win any conflict. The newest round wins.

## 1. The generation gate (never cross it)

**No Higgsfield or other paid generation without Marcus's explicit approval in the current conversation.**

- Follow `production/GENERATION_APPROVAL.md` every time.
- Before every paid call, report the model, the intended output, the credit cost and the remaining balance. Then stop and wait.
- A previous approval, a prompt that names a tool, or a word like "continue" is not approval.
- One approval covers only the jobs it lists. No automatic retries and no batches of expensive jobs.
- Free cost checks (`get_cost: true`) use the same tool names as real jobs, so they need Marcus's OK too. Say which ones you will run before running them.
- Log every paid job in `production/ledger/generation_log.csv`.
- If a job fails or looks wrong, stop and report it. Never regenerate on your own.

## 2. Approved scripts are locked

- Read the episode folder before writing anything. An approved script may already exist.
- Never rewrite, shorten or replace an approved script. If you find a factual error, name it and propose the fix.
- If a tool can't keep the script word for word, use a tool that can. Content Factory can't: it takes a prompt and writes its own script.

## 3. The order of work

Research → Script → Approval → Voiceover → Storyboard → Visual references → Short generation tests → Review → Final assembly → Quality control.

- Before a new look is used, Marcus picks from three art directions, each proven by one still frame.
- Nothing is animated until he has approved the storyboard.
- The stages, gates and tools are in `production/README.md`.

## 4. Never publish

Never post, publish, schedule or upload to a social platform. Marcus posts.

## 5. Start here

1. `production/README.md`: the production system.
2. `DECISIONS.md`: what's waiting for Marcus.
3. The episode folder's script and run sheet.
4. `production/09_approved_and_rejected.md`: what has already worked and failed.

Commit and push only when Marcus asks. The word "private" in older files is out of date: GitHub reports this repo as public. Keep keys, personal details and anything not meant to be public out of it.
