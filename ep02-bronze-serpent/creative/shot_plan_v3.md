# Bronze Serpent: the first 11 seconds, shot plan v3 (Nov 1, 20:45)

**Rule for every shot:** what does this image tell the viewer that the previous one didn't?

**Test:** watched with no sound and no captions, a stranger should be able to tell the story:
1. A bronze snake on a pole.
2. Moses sees people worshiping a golden calf, and he destroys it.
3. Much later, people are bringing offerings to that same bronze snake.
4. A king smashes it, and they are left holding offerings to an empty pole.

## Narration constraint (flagged, not changed)
The approved narration opens on the calf for its first 3.9 s, so the picture can't lead with the serpent without contradicting the words. Two things follow from that:
- **The serpent goes first anyway, in a 0.9 s cold open** under the title, before the voice starts. The voice is shifted, not edited.
- **The title never sits over the calf.** Over the calf it would tell a first-time viewer that the calf was the thing "God Himself commanded".

If you want the serpent to lead for longer than 0.9 s, the narration itself has to change, and that's your call.

## Shots
Times assume the voice starts at 0.9 s.

| # | Time | Camera | The image | What the viewer learns that the previous image didn't |
|---|---|---|---|---|
| S0 | 0.0–0.9 (no voice) | Low angle, locked, tight on the serpent's head against a dusk sky; incense smoke drifts across | A bronze snake coiled at the top of a pole. Title on screen. | **The object of the question.** A bronze snake on a pole: odd, and worth an explanation. |
| S1 | 0.9–1.9 "Moses destroyed a" | Medium close-up, slightly low, from the front left. Moses on the left third, the mountain behind him, space to his right | An old man with a white beard and a staff, at the edge of a camp below a mountain, staring hard at something off screen right. Title still on. | **A new person and a new place: Moses at Sinai,** and he is looking at something that upsets him. |
| S2 | 1.9–3.1 "golden calf" | His view: elevated wide over the camp. Moses small at the left edge, so we see where he stands | A golden calf on a plinth. Around it, each person does something different: one kneels, one holds up an offering bowl, two dance, one lifts both hands, one stands watching. On "calf", Moses starts striding toward it (the cut to S3 is on his stride). | **What he's looking at:** a golden idol, and people worshiping it in different ways. Where Moses is in relation to it, and that he's going to act. |
| S3 | 3.1–5.2 "because Israel worshiped it" | Low medium, from a new angle, on the same side of the action | Moses strides in from the left, raises his staff and strikes the calf off its plinth into the fire on "worshiped". The people react one by one: the dancer freezes, one flinches with an arm over his face, one scrambles back, the offerer drops his bowl. Smoke rises; the camera tilts up with it. | **Cause and effect:** Moses destroys the idol because of the worship, and the worship stops. |
| S4 | 5.2–7.0 "Centuries later" | Dissolve through the smoke into incense smoke. Crane up and back from the serpent's head to an elevated wide of a stone court | **The same bronze snake from S0,** on a plinth now. People kneel behind it with bowls held out; one tends a smoking incense stand; one stands with hands lifted. A man in purple with a crown enters from the left. | **The time jump and the twist:** a different era and place, and the snake from the opening is now being given offerings, just like the calf. A king arrives. |
| S5 | 7.0–7.75 "King Hezekiah" | Medium, slightly low, from the front left. The king on the left third, the serpent on the right third | He stops and lifts a hammer over his head. Behind the serpent, one kneeling man looks up at him in alarm, and another half rises. | **Intent (the anticipation):** the king is going to smash it, and the worshipers see it coming. |
| S6 | 7.75–8.4 "destroyed" | Tight low angle on the serpent's head, a cut on the blow | The hammer lands on the word, the bronze bursts apart toward the lens, a flash and one shake. | **The impact:** it's gone. |
| S7 | 8.4–11.3 "another object Israel had begun worshiping" | Elevated, starting on the broken pole, then cranes up and back on "object" and settles on "worshiping" | Pieces of bronze on the plinth and floor. The king stands beside the empty pole, hammer lowered. The people react: one still holds his bowl out to nothing, one reaches toward the pieces, one recoils, two look at the king. The pull-back shows two rows of them. | **The aftermath and the point:** many people had been worshiping this thing, and now they are holding offerings to an empty pole. |

## The visual rhyme (why S3 and S5–S6 are staged alike)
Moses' strike on the calf and Hezekiah's strike on the serpent are staged the same way: a man enters from the left, strikes toward the right, and the object breaks. This lets the eye connect the two destructions before line 2 explains the difference ("But this one had been made at God's command").

## Accuracy notes
- **Ex 32:20, Moses and the calf.** The text says he "took the calf… and burned it with fire". Showing him strike it into a fire is a visual interpretation; the burning is the text.
- **Ex 32:6, 19, the calf worship.** Offerings and dancing are textual. Kneeling is an interpretation of "worshiped it" (32:8).
- **2 Kgs 18:4, the serpent.** The text says "made offerings to it", so the court shows offerings and incense only. No one bows down.
- **The court is unnamed**, as in the text. It is not labelled "temple".
- **The pole is straight**, with no crossbar.

## Engine work this needs (all small; no rendering-quality work)
1. **New poses:**
   - `shield`: flinch, an arm over the face;
   - `reach`: kneeling, a hand stretched toward the pieces;
   - `bow`: kneeling, bent forward.
2. **Gaze:** `offer` and `kneel` take a gaze direction, so people can look at the king.
3. **An angled staff item,** so Moses can strike with it.
4. **A calf `topple` effect:** it falls off the plinth into a fire pit, then burns.
5. **The voice offset and a no-captions review build:** `make_film.sh` with `OFF=0.9 NOCAP=1`.
