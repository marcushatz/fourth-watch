# Visual identity prototype: assessment

These are my judgments from the frames, not audience evidence. The choice of look is Marcus's.

**Note:** the reference image in his brief never arrived. Only the text came through, so this follows his written description and may differ from what he had in mind.

## Visual consistency: strong

- **One body system.** The young man, Adam and Eve come from the same base mesh and rig, with different age, build and hair settings. Proportions, hands and faces are drawn the same way in Eden and in the bedroom, so the two worlds read as one film.
- **One finishing pass.** Every frame goes through `look.py`: people in soft light bands with a warm-black ink line, the world in painted strokes inside a depth haze, and the same grain, paper and vignette.
- **Frames 1 and 4 share the room, the camera and the man.** Only the light, his posture and his hands change. That's what makes the change readable without any text.
- **The type follows the brand.** Cinzel for the reference, Cormorant Garamond for Scripture and captions, and Inter for our reading. Gold is used only for the light of God's presence, and for caption key words, per the brand.
- **The weakness** is that consistency depends on lighting each shot by hand. Both moods here are dark, and a lighter, daytime episode hasn't been tested.

## Character quality: adult and believable, with clear limits

**What works:**
- They're mature people with real proportions, not stick figures.
- Posture carries the feeling: bent double with his head in his hands, backs pressed to the trunk, upright and deciding.
- The faces read at phone size when they're large, as in frame 4.

**What's weak:**
- **Faces** are simple and a little generic. They don't read when small, as in frame 2.
- **Hair** is the weakest part. The strands become a soft mass, and on the young man it reads as tighter curls than intended.
- **Clothes** are layers grown from the body, so they look plain. There are no real folds, hood or seams.
- **Fig leaves** needed careful work to read as leaves and keep Eve modest. Robes and tunics for other episodes are unproven.
- **Hands** pose correctly, but each pose took several tries.

An image model would give richer faces, hair and clothing, but with less control, and the cast would drift from shot to shot.

## Animation feasibility

| Route | What it can do | Cost and limits |
|---|---|---|
| **Code only** (this pipeline) | Exact continuity, because every pose is set in code on the same rig. Parallax camera moves on the passes, and light and type animation | A 1080×1920 frame took about 4 minutes (239–267 s) to render here, plus about 10 s for the look. Full character animation is far too slow on this workspace: a 2-minute film at 24 fps would take about 200 hours of rendering. Painted strokes would also flicker unless the world is rendered once as a plate and only the people move |
| **Higgsfield image-to-video from these frames** | Real movement: breathing, a head turning, hands. Kling 3.0 Omni Frames takes a drawn first and last frame | 6.25 credits per 5 s clip at Pro (priced Nov 6). Untested on this look: the model may repaint faces, hair and line in its own way. Every clip needs approval |
| **Image model for new characters and sets** | Faster new casts and places, using `prompts.md` and these frames as references | About 2.75 credits per 2k image (the Nov 3 price for GPT Image 2.5). Untested on this look, with a risk of drift |

## Recommendation

Use code for what has to stay identical, and Higgsfield only for what has to move.

- **Code:** the cast, the sets, the key frames, the Scripture typography, parallax and light.
- **Higgsfield:** short clips between code-drawn start and end frames, at moments where people need to move.

Before anything scales, run one approved test clip from frame 2 or frame 4. That will show whether Higgsfield keeps this look.

## What's untested

- Any motion, from either route.
- Reproducing the look with an image model.
- Daylight and outdoor scenes beyond Eden.
- Costumes other than fig leaves.
- How real viewers respond.
- The direction of the missing reference image.
