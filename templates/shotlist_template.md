# Ep [N] [Name] · shot plan v[NN]

**Status:** a proposal for Marcus. Nothing is rendered until he approves this plan and has watched a half-resolution motion draft of the first 30 s.

## Decisions for Marcus
1. [At most 3–4, each with the options and the runtime of each.]

## The shot list
Read `system/05_shot_list.md` and `system/06_camera_and_angles.md` first. One row per shot; every clause shows that clause happening on its word.

| # | ≈len | Words spoken | What happens on screen (verb on its word; no facial acting) | Size · angle · camera (+ reason) | Text on screen | Engine work |
|---|---|---|---|---|---|---|
| H1 | 5.0 | "[hook]" | [first change by 1.3 s; big change on the key word] | [e.g. CU low → WS, pull-out −45% (hook reveal)] | The question as the top caption | |
| … | | | | | | |

## Checks
- **The angle pass** (06 §8):
  - ≤ 60% MS+WS at eye level;
  - ≥ 3 CU and ≥ 3 inserts;
  - ≥ 2 low and ≥ 2 high angles;
  - weak moments high, strong moments low;
  - two rhymes planned;
  - no jump cuts;
  - ≥ 3 positions on any run of 4+ shots on one set.
- **The planned beat clock:** a change about every 2 s; at most one gap over 6 s.
- **The picture fact-check** (prompt A): every picture where and when the text puts it.
- **`node tools/shotlist_check.js <film dir> --score score_vNN.js`:** 0 FAIL, and every WARN explained.
- **The final image** calls back the hook; the reel ends ≤ 4.5 s after the last word.

## score.js row (copy per shot)
```js
L('ID', 'scene', 'v', cue(line, 'Word') - PRE, {
  size: 'ms', angle: 'eye',            // 'eye' | 'low' | 'high' | 'top' | 'ots' | 'pov'
  act: '', change: '', pill: '',
  cam: { move: 'drift', amt: 3 },      // ≥ 15% needs job: 'hook-reveal' | 'travel' | 'follow' | 'reveal'
  beats: { word: cue(line, 'word') },
});
```
