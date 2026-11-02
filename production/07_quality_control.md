# 07 · Quality control

Before presenting a finished episode, score all seven areas. Technical checks live in `system/09_render_and_qa.md`, `fw_check.py` and `fw_critic.md`.

"Passes the checker" is not "good". Say what was measured and what was judged. Call AI reviewers AI reviewers. They can't predict views.

## The scorecard

| Area | Pass means | How to check |
|---|---|---|
| **Biblical fidelity** | Every line and picture is supported. Quotes are exact. Interpretation is marked | `02_biblical_accuracy.md`, one independent fact-check |
| **Information density** | Something new every 10–15 s. The promised connection lands. No filler | Timeline of discoveries |
| **Visual coherence** | One look, palette and lighting logic. Scenes explain, not decorate | Contact sheet at 1 frame per second, by eye |
| **Character consistency** | Same design every time. Nothing childish or generic | Frames side by side |
| **Pacing** | Something new about every 2 s. Median shot 3–5 s. Nothing under 1 s except a transition. No dead stretch | `fw_check.py video`, shot list |
| **Audio** | Voice clear, matches the script, −14 LUFS, true peak ≤ −1 dBTP | Transcript, `ebur128`, listening |
| **Typography** | Readable at phone size, on brand, in sync, one element at a time, inside safe areas | Phone-size frames |

## Automatic failures

- The narration differs from the approved script.
- A picture contradicts the text or adds an unsupported claim.
- A quote isn't exact ESV.
- The look or a character drifts between shots.
- Text is generated inside an image.
- Unapproved paid generation appears in the log.

## Before Marcus sees it

1. Run the scorecard.
2. Look at the frames and watch the motion.
3. Fix what can be fixed without paid generation.
4. List anything left, honestly.
5. Check the spoken ESV credit, end card, captions and disclosure.

## After he reviews it

- Record his notes.
- Update `09_approved_and_rejected.md`.
- **Never publish.** He decides whether and when it goes out, and he posts it.
