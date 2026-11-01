# Option D: speed the recorded take up by 7%

`voice_tempo_AB_1.00_then_1.07.m4a`: the first 37 s of Marcus's take (`voice_lab/take1/voice_edit.wav`) as recorded, then 1.2 s of silence, then the same 37 s sped up 7%. The speed-up uses ffmpeg `rubberband`, which keeps the pitch and the formants.

**Why.** The take runs 2.65 words/s over the voice. No hit on any of the three channels studied is under 2.7; the hits run 2.6–4.1 words/s. At 1.07× the take reads at about 2.84 words/s, and the 143 s voice becomes about 133.7 s.

**How it would be applied, if Marcus approves it by ear:**
```
ffmpeg -i voice_lab/take1/voice_edit.wav -af "rubberband=tempo=1.07:formant=preserved:pitchq=quality" voice_lab/take1/voice_edit_x107.wav
```
Then regenerate the word times from the new file (divide every word time by 1.07), so every shot, beat, card and caption moves with it.

This is a proposal only. Nothing in the episode uses it.
