# Verb on its word (and effort that doesn't stop)

- **Job:** the viewer sees the action the voice names, exactly when it's named.
- **Picture:**
  - a size that shows the whole gesture (MCU for arms and hands, MS for the body);
  - the camera locked, so the energy is in the figure.
- **Timing:**
  - anticipation 0.25 s before the word (a dip the other way, 12-18%);
  - the drive over 0.2 s to 108-110%;
  - a settle over 0.25 s;
  - the meaning held 0.5 s.
- **Code:**
  ```
  const A = DIRECT.act(t, shot.beats.verb, { pre: .25, dip: .18, rise: .22, over: .1, settle: .25 });
  pose k = A.k; displacement = c * A.k
  ```
  Effort adds `DIRECT.tremor(t, beat, 0.014)` to `userData.tilt`.
- **Example:** pillars sdB ("Then he pushed"): the grip on "Then", the bow on "pushed", the weight forward 7 cm. `ep01-samson/creative/sd_pillars/`.
- **Trap:** a pose change the size can't show reads as nothing. In the pillars demo the 0.5 s head bow was too small at MS; it needed the body displacement and an MCU.
