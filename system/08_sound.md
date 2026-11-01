# 08 · Sound: the bed, the hits, the voice

**Use this when** you build or revise any soundtrack (`ep*/film*/song*.js`).

Marcus listed audio among what the successful channels do well ("proper visual storytelling, camera angles, pacing, audio").

**Evidence:**
- `research/direction_rules.md` §10, measured on one Lintel reel with sound ("Suffering", 528K). The other channels were studied muted.
- The numbers are provisional, so Marcus's ear decides.

---

## 1. What we measured (Lintel "Suffering" vs our Ep 1 v57)

Levels are relative to the voice band (300–3400 Hz, its 90th percentile):

| | Lintel | Ep 1 v57 | What it means |
|---|---|---|---|
| Bass band (30–180 Hz), median | −7.6 dB | −19.5 dB | Their bed is a full, low, cinematic layer; ours is thin |
| Bass, loud moments (p90) | −1.4 dB | −8.0 dB | Their hits land with weight |
| Whole-mix floor between words (p10) | −7.4 dB | −13.4 dB | Their bed fills the gaps, so nothing feels like dead air |
| Voice-band floor (p10) | −14.8 dB | −16.7 dB | Both keep the voice band clear |
| Steady beat | none | none | Neither uses a drum groove |
| Sharp onsets per minute | 36 | 36 | Similar number of hits |

**The conclusion:** we don't need more hits. We need **a fuller low bed under the whole reel** and **weight on the hits**, while keeping the voice band clear.

## 2. The three layers

1. **The bed** (always on, ducked under the voice; soft, steady and even, as Marcus asked in Round 10):
   - a sustained low drone or pad: cello or bass an octave below the pad, a sub at 40–80 Hz, warm strings;
   - minor in the story, opening to major at the turn's answer and at the dawn ending.
   - Volume: about 9–10 dB under the voice in the voice band, fuller in the lows.
   - Engine: `pad`, `str`, `low` buses in `song.js`. Raise `low` first.
2. **The hits** (one per visual beat): every beat in the shot list gets a sound on its frame (§3). "The beat clock is also a sound clock." Hits sit 6–8 dB under the voice and are ducked lightly (depth 0.25).
3. **The voice:** on top, clear, never fighting a hit on the same word. If a hit lands on a stressed word, move the hit 1–2 frames before the word or soften it.

## 3. The sound map (beat → sound)

| On screen | Sound | Engine helper |
|---|---|---|
| A cut to a new place | A low swell or a soft boom on the first frame | `I.thud(60–90 Hz)` + pad change |
| A whoosh-in or exit | A noise sweep up (in) or down (out), 0.3–0.45 s | `whoosh(t, len, g, up)` |
| A pill, label or stamp lands | A paper slap / wood tick; a stamp gets a heavy thud | `tick`, `pop`, `I.thud` |
| A counter ticks | A tick per step, accelerating, then a coin ring on the final number | `tick` loop + `I.bell` |
| Bonds snap / the gate tears | Rope crack, wood split, earth spray | Noise bursts + `I.thud` |
| God's light (gold) | A shimmer: a high noise sweep plus a soft bell | `shimmer(t)` |
| The light goes out (16:19–20) | The bed dips 6–10 dB for 0.5–1 s, then the low drone returns, colder (never to silence: Marcus wants a soft, steady, even bed) | Duck `pad`/`str` by 6–10 dB |
| A verse mark turns gold | A soft bell on the word | `I.bell` at −28 dB |
| The roof falls | A big low hit + rumble + debris, then the bed settles low under the dust | Layered `I.thud` + noise |
| Dawn / the ending | Major chord swell, strings up | Chord change in the pad |
| Logo | One clean tone; ends with the reel | — |

**A dip is a hit.** The hardest moment in Ep 1 ("he did not know that the LORD had left him") lands harder on a sudden dip of the bed than on any added sound. Keep the bed audible: Marcus asked for a soft, steady bed about 9–10 dB under the voice, very even (LRA ~3 LU, Round 10).

## 4. Mix targets

- **Loudness:** −14 LUFS (−16 to −12), true peak ≤ −1 dBTP. For Ep 1, `song.js` is now the current soundtrack script (the same as `song_v57.js`; fixed Oct 31; the old v46 text is kept in `song_v46.js`): `VOICE=../voice_lab/take1/voice_edit.wav node song.js` → `out/soundtrack_v57.wav`, −14 LUFS by default with a voice.
- **`out/music.wav`:** `render.js clip` and `mux` take sound only from `out/music.wav`. The soundtrack script now copies its output there itself (fixed Oct 31; a 1 s test clip came out with an audio stream).
- **Ducking:** the music ducks under the voice (`MIX.duck`, depth 0.55, attack 0.02 s, release 0.35 s); effects duck lightly (0.25).
- **Stems:** check with `STEMS=1 node song.js && node engine/tools/levels.js out/music.wav out/stem-*.wav`.
- **Compare against the reference:** `python3 tools/reference_study/audiostudy.py` on the render and a reference recording. Aim for bass median within ~5 dB of the reference and a floor between words of −8 to −10 dB.
- **Phone check:** listen on a phone speaker (no bass) and on earbuds. The voice must be clear on the phone; the bed should be felt on earbuds.

## 5. Rights and originality

- Everything is synthesized in code (`engine/audio`), so there are no samples and no licensing problems.
- No trending or licensed songs in the reel itself; publishing notes are in `10_publish_and_growth.md`.
- Never clone another creator's narrator voice.

## 6. Checklist

1. Is there a sustained low bed under every second of voice (no dead air between lines)?
2. Is there a sound on every planned visual beat, without masking a stressed word?
3. Do the turn and the ending change key (minor → major)?
4. Does the "LORD had left him" moment dip the bed (not mute it)?
5. Is the mix at −14 LUFS with true peak ≤ −1 dBTP, and the voice clear on a phone speaker?
6. Is the bass median within ~5 dB of the Lintel reference?
7. Has Marcus listened (ear first, numbers second)?
