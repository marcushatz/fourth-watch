# 05 · The shot list: from approved script to a plan Marcus can see

**Use this when** the script is approved. Nothing is animated until the shot list passes `tools/shotlist_check.js` **and Marcus has seen it** (Round 15: no overnight build without a shot list he has seen).

Read first:
- `research/direction_rules.md`: the rules, tagged [ALL], [2 CH], [THIN] or [HOUSE];
- `system/06_camera_and_angles.md`: sizes, angles, rhymes, transitions;
- `system/06c_shot_recipes.md`: ready recipes for the recurring beats (hook, quote, verse card, turn, answer, crowd, prayer, death, re-ask, closing question);
- `system/07_motion_and_acting.md`: how characters act without faces.

---

## 1. The two forms of the shot list

1. **For Marcus:** a readable table, `ep*/shotlist_vNN.md`. Columns: shot · time · words spoken · what happens on screen · size + angle + move · text on screen · new engine work. The open decisions go at the top.
2. **For the engine:** `ep*/film*/score_vNN.js`, with one `add()` per shot carrying the direction fields. The linter and the renderer read this form, so the two must say the same thing.

## 2. The procedure

1. **Time the words.** Marcus's Oct 28 order of work was script → video → voice last. Since the Ep 1 take, shots are timed to the recorded voice. Before a take exists, `make_vo.py` estimates word times from the script, so the shot list can be planned and checked first and re-timed when the take arrives. After the voice is recorded, `tools/make_vo.py` writes `vo.js` (word start and end times). Every cut lands within 0.15 s before the word it cuts on (`cue(line, 'word') - PRE`). Never hard-code a time.
2. **One sentence → one picture** (a new subject entering a held set counts). Then split on clauses: three verbs = three beats.
3. **For each clause write:**
   - `act`: the verb, performed on its word, using a pose the rig has (`lintel/PP2_API.md`).
   - `change`: whatever else visibly changes (a counter, an entrance, a light, a pill, a bubble, the camera arriving).
   - `beats`: `{ name: cue(line, 'word') }` for every change.
4. **Idea lines** get one object that something happens to, plus a 2–5 word pill (direction_rules §5).
5. **Size + angle + reason** (06 §1). Then do the angle pass (06 §8).
6. **Plan the rhymes:** the hook image returns at the answer or the end (`callback: true`).
7. **Check the planned beat clock:** a change about every 2 s, at most one gap over 6 s.
8. **Accuracy pass:** send every picture claim to the fact-check agent (what the text shows, where and when). The Oct 31 check caught six picture errors in v58:
   - the lion "came toward him roaring" and he tore it, with no leap and no catch;
   - the silver was brought after he told her (16:18);
   - she spoke to Samson, not toward the door;
   - his strength left at the shave (16:19);
   - there was no inner-room ambush at 16:20;
   - a "young man" led him, not a boy.
9. **Lint:** `node tools/shotlist_check.js <film dir> --score score_vNN.js --out qa/shotlist.md`. Fix every FAIL; explain every WARN in one line.
10. **Show Marcus** the table, the open decisions and the beat-clock chart. Then make a **half-resolution motion draft** of the first 30 s before any full render.

## 3. The direction fields (score.js)

```js
L('G1', 'sorek', 'seized', st(6) - PRE, {
  size: 'ms', angle: 'high',                                  // 'eye' | 'low' | 'high' | 'top' | 'ots' | 'pov'
  act: 'Samson stands, unaware; the Philistines close in and seize him on contact (16:21; no struggle is described)',
  change: 'slow push +8%; the 16:20 card lands over the struggle',
  pill: 'THE LORD HAD LEFT HIM',
  cam: { move: 'push', amt: 8, job: 'reveal' },              // moves of 15% or more need a job
  beats: { left: cue(6, 'left'), seize: cue(6, 'him') },     // every visible change, on its word
  card: 'verse', verse: 0, verseAt: st(6),                    // card values: 'verse', 'label' (+ Ep 1 cards); counter, tally, stamp and bubble are their own shot fields
  long: 'set',                                                // only for shots past 6 s: 'verse' | 'travel' | 'diagram' | 'set'
  callback: false, arrival: false, list: false, flashIn: false,
});
```

All fields are documented in `ep01-samson/film27/scenes/_API.md`. `angle` is new (Oct 31): the linter doesn't read it yet, but the angle pass does.

**Which score has these fields:** `L()`, the direction fields and verse `marks` exist in **`score_v58.js`** (the v58 plan), not in the rendered v57 `score.js`, which uses plain `add()`. Plan fields (`size`, `angle`, `act`, `change`, `name`, `cam`, `cuts`, `long`, `list`, `callback`, `arrival`) are read only by the linter; the renderer ignores them. The `name:` field is **not drawn**: name pills come from the scene module's returned `tags`. A `bubble.beat` counts toward the beat clock only if it's also listed in `beats`. Full map: `system/12_engine_guide.md` §4.

## 4. The device menu (what can change on screen)

| Need | Device | Exists? |
|---|---|---|
| A person does the verb | Rig pose on the word (carry, strain/burst, sleep, wake, grind, pray, push, lean, point, walk; Delilah call/beckon/sit; lord laugh/fall; crowd raise/kneel/cheer/fall) | Yes |
| A number the voice says | `counter` | Yes |
| Past cases, then the one that fails | `tally` (✓ ✓ ✓ ✗) | Yes |
| A verdict | `stamp` | Yes |
| A quoted claim | `bubble` on the speaker | Yes (Oct 31) |
| A verse that keeps changing while it holds | `VERSES[i].marks` (a phrase turns gold on its word) | Yes (Oct 31) |
| A place or person named | Name pill (`tags`), with a one-word frame ("GAZA · A PHILISTINE CITY") | Yes |
| God acting (only where the text says so) | `rays` gold from the upper left | Yes |
| Several parallel actions | Panel strip (stack panels vertically on a phone) | To build |
| A figure arrives on its name | Whoosh-in / exit | To build |
| Logic or a comparison | `diagram` card (timeline, two groups, a list building) | To build |
| A consequence | Subtraction (props fade or scale out on a beat) | To build |

## 5. Shot-list checklist (yes to all before Marcus sees it)

1. Does every clause have a picture of that clause happening, on its word?
2. Is there no shot where someone stands while the voice says what they did?
3. Is there a beat about every 2 s, at most one gap over 6 s, none over ~7.5 s?
4. Is the median shot 3–5 s, nothing under 1 s (except a transition), nothing over 12 s (except a building diagram)?
5. Does the hook change by 1.3 s, with the first big change on the key word, and no static title?
6. Has every shot got a size, angle and reason, with the angle pass done (06 §8)?
7. Are there no jump cuts, and do runs on one set use at least 3 camera positions?
8. Do weak moments get high angles and strong moments low ones?
9. Does the final image call back the hook (`callback: true`) and answer the question as a picture?
10. Do verse cards hold 3.5–5 s still, or longer only with marks acted on them?
11. Has every picture been checked against the text (the fact-check agent)?
12. Does nothing depend on facial expressions (the rig has none: use poses, props, bubbles, light)?
13. Does every beat have a sound planned (`08_sound.md`)?
14. Do `node tools/shotlist_check.js` 0 FAIL and the WARNs have explanations?
15. Does the reel end ≤4.5 s after the last spoken word?
