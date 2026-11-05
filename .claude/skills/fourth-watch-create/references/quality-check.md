# Quality check

Passing a check doesn't make a video good. Say what you measured and what you judged. Call AI reviewers AI reviewers, because they can't predict views.

## While building

- After each shot, pull a frame with `higgsedit frame` and look at it.
- After each sequence, make a contact sheet with `higgsedit sheet`.
- **The muted test:** can you tell what happens from the pictures alone? If a read is missed, that shot fails.
- Check that each subject sits where the eye lands, 22 to 60% down the frame, and clear of captions.
- Look at frames at phone size.

## After a draft

Ask Marcus before rendering. Then:

```bash
python3 fw_check.py video --video <film.mp4> --script <episode.md> --subs <film.srt> --out <episode>/qa/video
python3 tools/reference_study/beatclock.py <film.mp4>
```

`fw_check.py video` covers format, loudness, captions, rhythm, visual beats and stillness. `toolkit_page/fw_review.py` builds a visual review pack.

## The scorecard

| Area | Pass means |
|---|---|
| Biblical fidelity | Every line and picture is supported. Quotes are exact ESV. Interpretation is marked |
| Information and feeling | The promised payoff lands, and the viewer feels what the plan said they would |
| Visual coherence | One style, palette and lighting logic. Scenes explain rather than decorate |
| Character consistency | Same design every time. Nothing childish or generic |
| Pacing | Something new about every 2 s. Median shot 3 to 5 s. No dead stretch |
| Audio | Voice clear and word-perfect, −14 LUFS, true peak at or under −1 dBTP |
| Typography | Readable at phone size, in sync, one element at a time, inside safe areas |

## Automatic failures

- The narration differs from the approved script.
- A picture contradicts the text or adds an unsupported claim.
- A quote isn't exact ESV.
- The look or a character drifts between shots.
- Text appears inside a generated image.
- A paid job appears that Marcus didn't approve.

## Fixing

Name the three most serious problems, concretely. "The push doesn't read because the arms barely move" is useful, and "it needs more energy" isn't. Fix only those, and don't re-render shots that passed. Free fixes can repeat. Any paid fix stops for a new approval.

## Handing over

Give Marcus the video, the captions, a cover, the claim table, the credits spent, and an honest list of what's still weak. Then stop. He decides whether it goes out, and he posts it.
