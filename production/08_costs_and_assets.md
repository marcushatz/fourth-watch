# 08 · Generation costs and reusable assets

## Ledgers

- `ledger/generation_log.csv`: every paid job, cost check and rejected job.
- `ledger/assets.csv`: every reusable or reference asset.

Higgsfield's `transactions` is the source of truth for charges.

## Current balance

Check with `balance`. On Nov 2, 2026 it was 97.24 credits after one 2.76-credit voiceover. On Nov 5 at 21:38 UTC a "Subscription Credits Reset" removed the remaining 76.47, leaving 0. It wasn't a generation job.

## Spending order

Spend where the viewer sees the most value and the risk of waste is lowest:

1. Stills that decide the look.
2. Reusable references for characters, sets and props.
3. Layers for approved stills.
4. A few hero video shots, only if tests earn it.

Don't spend on a shot until the storyboard needing it is approved.

## Rough episode budgets

Estimates for a script like Bronze Serpent v4 (about 100 s), using Nov 2 prices. They exclude retries, and every paid step needs its own approval.

| Approach | Rough cost | Notes |
|---|---|---|
| Stills, layers and Higgsedit motion | 70–90 credits | About 22 stills, 10 decomposed, one voice take |
| Same, plus 4 hero video shots | 100–120 credits | Kling 3.0 Standard at 5 s each |
| Video for every shot | 200+ credits | Less control over art and text |
| Faceless Video workflow, motion mode | 240+ credits | 12 blocks at 20 credits, plus assets |

The voice estimate is about 7 credits, scaled from the test take (2.76 credits for about 590 characters; script v4 has 1,513). It's not a quote.

## Reusing assets

Before requesting anything new:
1. Check `ledger/assets.csv`.
2. Check Higgsfield Elements and the media library.
3. Check `brand/`.
4. Ask whether an approved still can be reframed, relit in the edit, or reused from another angle.

Register each approved asset with its id, type, source, cost, approval and reuse notes.

Files in the Higgsfield sandbox can disappear. Store IDs in the ledger, and keep reusable source files in the repo. The repo's `.gitignore` leaves out images, audio and video, and the repo is public, so don't force large or sensitive media into it.
