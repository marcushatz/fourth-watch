# Voice, captions and sound

## Voice

Every take is a paid job, so ask first. Eleven v4 through Higgsfield has worked on two takes, and 590 characters cost 2.76 credits. The series voice isn't chosen yet.

- **Delivery:** clear, reverent, intelligent and curious. No sermon voice or hype.
- **Pace:** about 2.6 to 2.8 words per second. Pace comes from pauses, never time-stretching.
- **Never** clone or imitate another creator's narrator.
- **Names:** check how Bible names sound. Bronze Serpent's "Nehushtan" was transcribed as "Nahushdan" and nobody has checked it by ear.
- **Check the take:** transcribe it with word timings. No word may differ from the approved script.
- **Fixes:** a changed line is a new paid job.

The Instagram AI label stays on for realistic AI narration, and the video needs a spoken ESV credit (`system/00_series_canon.md`).

## Word timings

Save them as `words.json`, a list of `{"s": start, "e": end}` in script order, one per word. `ep01-samson/voice_lab/take1/align_take.py` is a working example of speech recognition on a take.

Everything reads its time from this file: captions, cuts, pop-ups and sound hits. Never type a time by hand.

## Captions

`templates/type.jsx` builds them.

- Top third of the frame, built word by word in time with the voice.
- Cormorant Garamond for narration, and Cinzel for names and key words.
- Gold on 1 to 3 key words per sentence.
- Dark outline and shadow so they read over anything.
- Read at phone size, and stay clear of platform buttons.
- Display text comes from the approved script, and timing comes from the take. Speech recognition never supplies the words.
- One text element at a time.

Verse cards use exact ESV and sit beside what they prove, without covering the key action. A card with nothing happening on it holds 3.5 to 5 seconds. All type is set in the edit, never inside a generated image.

## Sound

Higgsfield's music models weren't usable on Nov 3: `suno_music` wasn't in the catalog, and `sonilo_music` and `mirelo_text_to_audio` were game-pipeline only. Check again before planning around them. Bronze Serpent's score was synthesized in Python, and nobody has judged it by ear, so treat that as a starting point.

`ep02-bronze-serpent/source/edit/score.py` builds a score and effects from the word timings. `templates/mix.py` mixes them under the voice.

- Voice first, with a soft, even bed under it. The bed ducks when the voice speaks.
- A full, sustained low layer fills the space between words. One Lintel reel measured about 12 dB stronger in the low end than our Samson cut.
- Every visual beat gets a sound: a whoosh on an entrance, a thud on a stamp. The beat clock is also a sound clock.
- Impacts land on the picture.
- Target −14 LUFS and true peak at or under −1 dBTP.
- Marcus judges the mix by ear, and levels only confirm it.
