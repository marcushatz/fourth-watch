# Test 01: Cinematic Gouache still

**Status: prepared, not approved, nothing generated.**

**Exact job:** `production/approvals/requests/2026-11-02-gouache-01.json`. Its prompt is the Cinematic Gouache prompt from `directions_v1.md`, with the shared scene block filled in.

**Quote:** 2.75 credits, from the Nov 2 cost check. It expires 24 hours after that check, at about 5:14 PM ET on Nov 3. After that, a fresh check needs Marcus's OK.

## The question

Can a generated illustration reach the art direction Marcus wants? One still won't settle the whole look, but it will show whether this direction is worth more credits.

**The frame:** "Anyone who had been bitten could look at it and live." (script v4)

Type, the fine gold line of sight and all other overlays are added in the edit, not generated.

## What must be true of the still

Marcus judges. These are the checks to report against.

| Area | Pass means |
|---|---|
| Not childish | Adult proportions, restrained faces, believable hands and posture |
| Composition | A strong diagonal from the man to the serpent, not a centred layout |
| Storytelling | At phone size, you can tell someone is looking up at the serpent for rescue |
| Silhouette | The man and serpent read clearly from their shapes, with real form and light inside them |
| Lighting | One controlled key light from the upper left, with a clear focal point |
| Depth | Foreground, subject, camp, far ridges and sky read as separate layers |
| Texture | Hand-painted gouache feel, with no generic AI gloss |
| The serpent | Weighty bronze, on a straight pole with no crossbar, not a medical symbol |
| Space for type | The top quarter stays calm |
| No text | No letters, signs or marks in the image |
| Layering | The subject separates cleanly enough to animate in layers later |

## Picture fidelity

| Element | Basis | Type |
|---|---|---|
| Bronze serpent on a pole | Num 21:9 | Stated |
| A bitten person looks at it | Num 21:9 | Stated |
| Serpents still present | Num 21:9, "if a serpent bit anyone" | Implied |
| Straight pole, no crossbar | Series fence | Staging |
| Tents, stone mound, time of day, helpers | Not in the text | Staging |
| Gold light from the upper left | Series light rule, for God's provision | Visual interpretation |
| Line of sight, added in the edit | "Look at it and live" made visible | Visual interpretation |

Nobody is shown dead, and there are no wounds or blood.

## After the run

1. Log the job in `production/ledger/generation_log.csv`.
2. Confirm that the balance fell by 2.75.
3. Show Marcus the still at full size and at phone size, with the checks above.
4. Stop. **No retry and no second image without a new approval.**

**If he likes it:** propose the next small test, a second frame in the same look using this still as a reference. That's where consistency gets tested.

**If it's close:** propose one specific prompt or model change, with a new quote.

**If he rejects it:** record why in `production/09_approved_and_rejected.md`, then choose whether to try Gold Leaf Fresco or Annotated Engraving.

## What this test can't prove

- That the style holds across many frames.
- That characters stay consistent.
- That it animates well.
- That GPT Image 2.5 is the best model for this look.
