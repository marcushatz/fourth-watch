// Motion helpers with no drawing in them. Higgsedit has no per-frame callbacks, so anything
// that follows a path or a curve gets sampled into keyframes here, before the film is built.

export const kf = (property, rows) => ({
  property,
  keyframes: rows.map(([at, value, easing]) => (easing ? { at, value, easing } : { at, value })),
});

// Repeatable random numbers, so a rebuild gives the same film.
export const R = (i, s = 1) => {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// Sample any function of film time into one keyframe track for a node that starts at `at`.
export const sampled = (property, at, dur, fn, step = 1 / 15) => {
  const n = Math.max(1, Math.ceil(dur / step));
  const rows = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    rows.push([Math.min(dur - 0.001, u * dur), fn(at + u * dur * 0.9999), "linear"]);
  }
  return kf(property, rows);
};

// A verb landing on its word: a small move the other way, the drive past the target, a settle.
// Returns keyframes running 0 to 1, in time local to a node that starts at `start`.
export const act = (start, word, { pre = 0.25, dip = 0.15, rise = 0.2, over = 0.1, settle = 0.25 } = {}) => {
  const t = word - start;
  return [
    [Math.max(0, t - pre), 0, "ease-in-out"],
    [t, -dip, [0.16, 1, 0.3, 1]],
    [t + rise, 1 + over, "ease-in-out"],
    [t + rise + settle, 1],
  ];
};

// Camera shake on impacts. hits is [[time, strength], ...]. Returns offsetX, offsetY and scale tracks
// for the frame that holds the picture. Keep it under 12 px, and only on real impacts.
export const shakeTracks = (hits) => {
  const SX = [[0, 0]];
  const SY = [[0, 0]];
  const SS = [[0, 1]];
  const PX = [16, -13, 10, -7, 4, 0];
  const PY = [-12, 10, -7, 5, -3, 0];
  for (const [t, a] of hits) {
    SX.push([t - 0.01, 0, "linear"]);
    SY.push([t - 0.01, 0, "linear"]);
    SS.push([t - 0.01, 1, "linear"], [t, 1.04, "linear"], [t + 0.22, 1, "linear"]);
    PX.forEach((v, i) => {
      SX.push([t + i * 0.034, v * a, "linear"]);
      SY.push([t + i * 0.034, PY[i] * a, "linear"]);
    });
  }
  return [kf("offsetX", SX), kf("offsetY", SY), kf("scale", SS)];
};

// Two-bone reach, for an arm or a leg hanging along +y. Returns the first angle and the bend.
export const ik = (dx, dy, a, b, sign) => {
  const clamp = (x) => Math.max(-1, Math.min(1, x));
  const d = Math.min(Math.hypot(dx, dy), a + b - 0.001);
  const base = Math.atan2(-dx, dy);
  const al = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d)));
  const be = Math.acos(clamp((a * a + b * b - d * d) / (2 * a * b)));
  return [base + sign * al, -sign * (Math.PI - be)];
};

// Split a script into caption groups: at most maxWords, breaking at sentence ends and long pauses.
// script is a list of word strings. words is a list of { s, e }, one per script word.
export const groupCaptions = (script, words, { maxWords = 5, maxGap = 0.45 } = {}) => {
  if (script.length !== words.length) throw new Error(`script has ${script.length} words, timing has ${words.length}`);
  const groups = [];
  let from = 0;
  script.forEach((word, i) => {
    const count = i - from + 1;
    const last = i === script.length - 1;
    const sentence = /[.!?]["”]?$/.test(word);
    const pause = !last && words[i + 1].s - words[i].e > maxGap;
    if (last || sentence || pause || count >= maxWords) {
      groups.push({ from, count, t0: words[from].s, t1: last ? words[i].e + 0.4 : words[i + 1].s - 0.02 });
      from = i + 1;
    }
  });
  return groups;
};
