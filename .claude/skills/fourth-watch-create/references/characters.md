# Characters and movement

This is the weakest area so far. Marcus gave Bronze Serpent 5/10 for character animation: "illustrated cutouts placed into 3D environments rather than characters genuinely inhabiting those worlds."

**Reusable characters** means the same look and the same way of moving. Recurring people, such as Jesus and Peter, look identical in every video. New people get a new face and clothes on the same body and style.

## Design rules

- Adult proportions, about 6.5 to 7.5 heads tall.
- Silhouette first. Identity reads from shape, posture and gesture.
- Faces are restrained. No dot eyes, big eyes or cartoon features.
- Real hands and limbs, with no tube arms.
- Crowds vary in height, age, posture and grouping.
- Jesus follows the approved logo character. He's lit and coloured, never an all-black silhouette, and Marcus approves any generated version.

The full rules are in `production/04_characters_and_environments.md`.

## Three ways to make a person move

Pick per shot, in the storyboard's `route` field.

| Route | How | Good for | Cost | Status |
|---|---|---|---|---|
| `still` | Painted figures locked to the world, swapping poses | Crowds, held moments, distant people | Art only | Used on Bronze Serpent. Close-up acting read as cutouts |
| `code` | A jointed figure driven by numbers, with feet planted by distance walked | Walking, stopping, reaching | No credits | 7 s test in `ep02-bronze-serpent/source/puppet/`. Marcus hasn't judged it |
| `ai-clip` | A Higgsfield video model animates an approved still | A few big moments | About 5 credits or more per 5 s (Nov 2 prices) | Not yet tried on our art |

A 2-minute video made entirely of AI clips would cost at least 120 credits, so save them for moments that earn it. Bronze Serpent's stills and voice cost 19.85 credits in total.

## Movement rules

Write these into the storyboard's `acting` field. They apply on every route. For AI clips they become the prompt.

- **Nobody just stands.** Every shot has an action or a reveal.
- **Say the verb and the word.** "He steps out on 'steps'," not "he moves."
- **Weight moves first.** Hips lead, then the foot follows.
- **Feet stay planted.** A foot on the ground doesn't slide.
- **Contact is real.** Feet meet the ground, hands grip what they hold, and shadows connect.
- **Actions have a shape.** A small move the other way, the action, a settle, then a hold on the meaning.
- **Eyes lead.** A person looks before they turn or reach.
- **No snapping.** Never change pose in one frame.
- **People carry on breathing.** A slight breath or shift keeps a held person alive.
- **One readable action per decision.** Kneeling, lifting a lamp or walking away says more than a facial expression.
- **Large enough to read.** A small gesture needs a closer shot.

## Animation craft

From Disney's twelve principles, the ones that matter most here:

- **Anticipation:** signal an action before it happens.
- **Slow in and slow out:** spend more frames near the start and end of a move.
- **Arcs:** limbs move on curves, not straight lines.
- **Follow-through:** robes, hair and loose parts lag behind the body.
- **Secondary action:** small supporting moves that don't steal attention.
- **Timing:** the number of frames sets weight and mood.
- **No twins:** avoid mirrored poses. They look lifeless.

**Hand-made feel:** Spider-Verse animated mostly on twos, holding each pose for two frames, while hair and cloth stayed on ones so they didn't jump. It also replaced motion blur with a sharp repeated image, and avoided soft glows. Consider this when setting the style, because smooth computer motion is part of what can make animation feel cheap.

## AI clip prompts

- Lead with the style, then the scene, composition and light.
- Reuse the approved style text word for word.
- Ask for one simple camera or subject move.
- Add: no text, no letters, no logos.
- Use an approved still as the start frame.

Every clip is a paid job. Say what it is, the model, the cost and the reason, then wait for his approval. Don't regenerate a clip on your own.

## Saving a character

Once approved, add the character to `production/ledger/assets.csv`, and save the description word for word in `production/04_characters_and_environments.md`. Register it as a Higgsfield Element where the model supports it, which hasn't been tested yet.
