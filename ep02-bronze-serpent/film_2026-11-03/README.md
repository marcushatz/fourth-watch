# Bronze Serpent film: overnight production notes (2026-11-03)

**Status:** finished review copy, waiting for Marcus. Not approved for release. Marcus reviews it and Marcus posts.

**Script:** `../content_factory_script_test_2026-11-02/script_approved_experimental.md`, word for word. It does not replace `../script_approved_v4.md`.

## How it's built

- **World:** one GLSL raymarched set in Higgsedit: court, camp, night yard, dawn hill. It's repainted by a second shader, so every edge wanders and the paint boils eight times a second.
- **People:** GPT Image 2.5 painted sprites on transparent backgrounds. Each stands on a world point and follows the plate's camera. They act by pose swaps.
- **Type and graphics:** native Higgsedit. Every word lands on the real word timings from the take.
- **Score and sound:** synthesized in numpy. No music model was usable: `suno_music` isn't in the catalog, and `sonilo_music` and `mirelo_text_to_audio` are game-pipeline only.

## The film's idea

It opens on the hammer blow, frozen with the pieces in the air. "Rewind" runs it back to the camp, and history plays forward to the same frozen moment. "End of story" is a false ending. Then the night yard: Nicodemus's face lights up and the serpent stands over him as a ghost, which is the film's strongest moment. On "eternal life" the sun rises behind a distant cross, and its shadow reaches the broken pieces on the ground.

## Picture choices that are staging, not Scripture

- The fiery serpents are painted vipers with glowing markings. A man is struck and a woman kneels over someone fallen, with no blood or wound shown. The camp lamps stand for lives: they go out here, relight on "live", and spread across the land on "eternal life".
- Jesus is never shown. The night yard implies him with one warm, out-of-focus shoulder.
- The crossbar appears only on the empty rising line at "death", never on the pole.
- The cross's shadow falling on the broken bronze at dawn is a visual comparison. It's interpretation, not a claim about any place or event.
- The court is never labelled "temple".

## Deliverables

- **Film:** Higgsfield media `dbc24194-0c54-4f00-9d9c-7bca92effd07`. 1080x1920, 30 fps, 58.7 s, 116 MB, -13.9 LUFS, -1.0 dB peak.
- **Source:** Higgsfield file `33a08729-3fde-46e7-87f9-1e185596ecd0` (144 MB zip): edit scripts, shaders, sprites, final plate, voice, mix and fonts.

## Spend and time

| Job | Model | Credits |
|---|---|---|
| Narration | Eleven v4 | 4.60 |
| Hezekiah pose sheet | GPT Image 2.5 high 4K | 4.25 |
| People sheet | GPT Image 2.5 high 2K | 2.75 |
| Moses and Nicodemus sheet | GPT Image 2.5 high 2K | 2.75 |
| Close-up sheet | GPT Image 2.5 high 2K | 2.75 |
| Serpent and fallen figures sheet | GPT Image 2.5 high 2K | 2.75 |
| **Total of the 25-credit budget** | | **19.85** |

Confirmed against `transactions`. Balance after: 76.47. About 3 h 20 min from brief to delivery.

## Known problems

- Nobody has heard the mix. Levels are measured, not judged by ear, and the score is synthesized.
- "Nehushtan" has not been checked by ear. The transcription heard "Nahushdan".
- Figures act in held poses, so the swing is three poses and most people don't move inside a shot.
- The painted figures are more detailed than the simple 3D world behind them. The overhead camp shots show this most.
- Plates were rendered at 720x1280 and scaled up, so backgrounds are softer than the sprites and type.
- When the pieces fall at 29.5 s, most of them drop through the floor instead of landing.

## To change it later

1. Everything is in the zip, and in `/home/user/what-if/fw-serpent/edit/` while the sandbox lasts.
2. Picture or type only: edit `film.jsx`, then `FW_PLATE=$PWD/plate30.mp4 higgsedit build film.jsx`. A full render with `higgsedit render comp --workers 4 --bitrate 16M` takes about 2 minutes on an XL sandbox.
3. World or camera: edit `shots.js` or `gl/`, then `higgsedit build plates.jsx` and render only the affected range. Keep each background job under 15 minutes. That's about 12 s of film, or 6 s in the court shots.
4. Sound: `python3 score.py && python3 mix.py 1.34 1.25 1.0`, then mux `mix.wav` onto the picture.
