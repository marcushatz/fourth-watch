// One camera truth, shared by the plates and the people, so people stay locked to the ground.
// A shot is { id, a, b, cam: (u) => cam(position, target, lens), par: (u) => world values }.
// u runs from 0 to 1 across the shot. Times are seconds on the whole film.
export const lerp = (a, b, t) => a + (b - a) * t;
export const v3 = (a, b, t) => a.map((x, i) => lerp(x, b[i], t));
export const io = (t) => t * t * (3 - 2 * t); // ease in and out
export const o3 = (t) => 1 - Math.pow(1 - t, 3); // ease out
export const i3 = (t) => t * t * t; // ease in
export const seg = (u, a, b) => Math.max(0, Math.min(1, (u - a) / (b - a)));
export const cam = (ro, ta, lens = 1.3) => ({ ro, ta, lens });

export const shotAt = (shots, t) => shots.find((s) => t >= s.a && t < s.b);
export const camAt = (s, t) => s.cam(Math.max(0, Math.min(1, (t - s.a) / (s.b - s.a))));

const norm = (v) => {
  const l = Math.hypot(...v);
  return v.map((x) => x / l);
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// A world point becomes a screen position and pixels per metre.
// x is sideways, y is up, z points toward the camera's usual side of the set.
export const proj = (c, P, W = 1080, H = 1920) => {
  const ww = norm(c.ta.map((v, i) => v - c.ro[i]));
  const uu = norm(cross(ww, [0, 1, 0]));
  const vv = cross(uu, ww);
  const d = P.map((v, i) => v - c.ro[i]);
  const z = dot(d, ww);
  return { x: W / 2 + (dot(d, uu) / z) * c.lens * H, y: H / 2 - (dot(d, vv) / z) * c.lens * H, s: (c.lens / z) * H, z };
};
