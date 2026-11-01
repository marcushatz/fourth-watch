# 04 · Voice: recording, pace, and timing everything to it

**Use this when** the script is approved and needs a narration, or when pick-up lines are needed.

## 1. The voice

- **Engine:** Marcus records in ElevenLabs (Eleven v4) with his chosen library or Voice Design voice.
- **Settings:** stability ~50%, similarity ~75%, speed 1.0.
- **Never** a clone of another creator's narrator.
- **No paid voice service** without Marcus's decision.
- **Keep the take's settings** with the episode (`ep*/voice_lab/take*/`) so pick-ups match.

## 2. The paste file (Claude writes it; Marcus pastes it)

- Spell **Lord**, not LORD: capitals make the voice shout. The on-screen card keeps the ESV capitals.
- Spell out numbers where the voice might misread them ("one thousand one hundred").
- Use `...` for a short pause: before the verse line, before the turn, before the answer.
- One line per VO line, in order, with nothing else in the file.
- For pick-ups, name where each line splices in (see `ep01-samson/v59_recording.txt`).

## 3. Pace (the "not too slow" rule)

- **Target 2.7–3.0 words/s** over the voice. The hits run 2.59–3.01 over the whole runtime on Lintel and 2.7–4.1 on the other channels; Ep 1 v57 read 2.53 overall.
- **Get pace from the script**, not by stretching words. Use shorter lines, fewer pauses, and no signposts or recaps (`02_story_and_script.md` §3). Marcus: stretching sounds slows the letters and sounds wrong.
- **If a finished take reads slow,** the first fix is the script (cuts). A 1.03–1.08× speed-up with the pitch kept (rubberband) can be offered only as an A/B listening sample. Marcus's Oct 29 rule says "never time-stretch words; get pace from pauses"; that was about slowing a voice down, but a speed-up is also a time-stretch, so only he can approve it:
  ```
  ffmpeg -t 37 -i voice_edit.wav -af "rubberband=tempo=1.07:formant=preserved:pitchq=quality" b.wav
  ```
  The template is in `ep01-samson/options/tempo/README.md`.
- **Pauses:** about 0.25 s between lines and 0.45 s between beats, plus about 0.5 s before the turn line. The rest of the pace comes from the writing.

## 4. Delivery notes to give with each take

- Questions rise at the end (the hook, the re-ask).
- Statements fall at the end (answers, verdicts).
- The turn line ("But he did not know that the LORD had left him") is slower and quieter, with a pause before it.
- Quotes are read as quotes: a slight change of tone, no acting.
- Names get stress the first time (SAMSON, DELILAH, HEBREWS eleven).

## 5. Pronunciation list (keep adding)

| Word | Say | Note |
|---|---|---|
| Philistines | FILL-is-teens | Recognizers often mishear it |
| Delilah | dih-LIE-luh | |
| Gaza | GAH-zuh | |
| Sorek | SOR-ek | |
| Dagon | DAY-gon | |
| Nazirite | NAZ-uh-rite | |
| Manoah | muh-NO-uh | |
| Lehi | LEE-high | |
| Ashkelon | ASH-kuh-lon | |
| LORD (in a quote) | Lord | Write "Lord" in the paste file |
| 1,100 | one thousand one hundred | |
| Nineveh | NIN-uh-vuh | Bank #1 (Jonah) |
| Tarshish | TAR-shish | |
| Joppa | JOP-uh | |
| 120,000 | one hundred and twenty thousand | Write it out in the paste file |
| Kadesh-barnea | KAY-desh BAR-nee-uh | Bank #2 |
| Uzzah | UZZ-uh | Bank #3 |
| Abinadab | uh-BIN-uh-dab | |
| Obed-edom | OH-bed EE-dum | |
| Ananias | an-uh-NYE-us | Bank #4 |
| Sapphira | suh-FIE-ruh | |
| Magi | MAY-jai | Bank #5 (say "wise men" in the VO; the ESV text does) |
| Meribah | MAIR-ih-bah | Bank #6 |
| Moriah | muh-RYE-uh | Bank #7 |

Check each new name in the take: ElevenLabs sometimes stresses Bible names oddly. If a name comes out wrong, respell it phonetically in the paste file only (the captions keep the real spelling).

## 6. From the take to word times (every cut is timed from these)

1. Save the take as `ep*/voice_lab/take*/voice_edit.wav`. Keep the raw file too.
2. Get the word timings (speech recognition on the take):
   ```
   python3 film27/tools/words_from_voice.py episode.md words.json out_flat.json
   ```
3. Build `vo.js` and the captions from the script plus those timings:
   ```
   python3 film27/tools/make_vo.py --words out_flat.json
   ```
   This writes `vo.js` and `out/captions.srt`.
4. **Everything re-times itself:** score.js, the cards, the captions and the music cues read only from `vo.js`.
5. Re-run `node tools/shotlist_check.js` (cuts on words, the beat clock, the tail).
6. **Pick-ups:** generate 3 takes, pick the closest in pitch and pace, and splice at a breath or a consonant. Check the join by ear and with a waveform. Then re-run steps 2–5.

## 7. Rights and labels (decide before the first post; details in `10_publish_and_growth.md` §7)

- **ElevenLabs plan:**
  - Free-plan audio has no commercial licence, and published content must credit ElevenLabs in the title.
  - Audio made during a paid subscription can be used commercially, indefinitely.
  - Takes made on the free plan stay non-commercial.
  - Marcus decides the plan; no paid service without his decision.
- **Instagram's AI label:** Instagram lists "a reel narrated with a realistic AI-generated voiceover" as content that must carry the AI label. Turn the label on for every reel; recommended for TikTok and YouTube too. Add one caption line: "Narration: synthetic voice. Animation drawn in code."

## 8. Checklist

1. Is the paste file written with Lord, spelled-out numbers and pause marks?
2. Are the take's settings saved with the episode?
3. Is the pace 2.7–3.0 words/s over the voice?
4. Do questions rise, answers fall, and the turn sit slower?
5. Is the pronunciation list followed?
6. Has `vo.js` been regenerated from the real word timings, and has the shot list been re-checked?
7. Is the take recorded on the ElevenLabs plan Marcus chose, and will the AI label be turned on when posting?
