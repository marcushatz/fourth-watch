// Small effects that recur. Each returns nodes to place in the film.
import { kf, R } from "./motion.js";

// Floating dust or sparks. o: { y0, h, vx, vy, size, color }
export const motes = (t0, t1, n, seed, o = {}) =>
  Array.from({ length: n }, (_, i) => {
    const d = t1 - t0, x = 60 + 960 * R(i, seed), y = (o.y0 ?? 500) + (o.h ?? 1100) * R(i, seed + 1), z = (o.size || 7) * (0.5 + 1.1 * R(i, seed + 2));
    const dy = (o.vy ?? -24) * d * (0.5 + R(i, seed + 3)), dx = (R(i, seed + 4) - 0.5) * (o.vx ?? 30) * d;
    return <rect at={t0} duration={d} x={x} y={y} width={z} height={z * (0.6 + 0.8 * R(i, seed + 5))} radius={z * 0.3} fill={i % 3 == 0 ? "#FFE9B0" : o.color || "#F0C062"} animate={[kf("offsetY", [[0, 0], [d - 0.01, dy]]), kf("offsetX", [[0, 0], [d - 0.01, dx]]), kf("opacity", [[0, 0], [0.25, 0.9], [d - 0.3, 0.8], [d - 0.01, 0]])]} />;
  });

// A quick flash of light. Keep flashes for real jumps and impacts.
export const flash = (t, color = "#FFF3CE", peak = 0.95, d = 0.2) => <rect at={t} duration={d} x={0} y={0} width={1080} height={1920} fill={color} animate={[kf("opacity", [[0, peak], [d - 0.01, 0]])]} />;

// A soft glow that follows a world point. pos(t) returns { x, y, s } on screen.
export const glow = (pos, at, dur, opacity, size = 1, stops) => {
  const n = Math.max(2, Math.ceil(dur * 5)), X = [], Y = [], S = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, w = pos(at + u * dur * 0.999), k = Math.min(dur - 0.001, u * dur);
    X.push([k, w.x - 45, "linear"]);
    Y.push([k, w.y - 45, "linear"]);
    S.push([k, Math.max(0.14, w.s / 120) * size, "linear"]);
  }
  const fill = { kind: "radial", stops: stops || [{ offset: 0, color: "#FFF2C4" }, { offset: 0.14, color: "#FFC765" }, { offset: 0.42, color: "#F08A2EA0" }, { offset: 0.7, color: "#F08A2E00" }] };
  return (
    <frame at={at} duration={dur} x={0} y={0} width={90} height={90} layout="none" origin="center" animate={[kf("offsetX", X), kf("offsetY", Y), kf("scale", S), kf("opacity", opacity)]}>
      <rect x={0} y={0} width={90} height={90} radius={45} fill={fill} />
    </frame>
  );
};

// Smoke or dust rising from a point.
export const puff = (x, y, t, d, size, seed) => <rect at={t} duration={d} x={x - size / 2} y={y - size / 2} width={size} height={size} radius={size / 2} fill={{ kind: "radial", stops: [{ offset: 0, color: "#D9C7B0" }, { offset: 0.7, color: "#D9C7B000" }] }} animate={[kf("offsetY", [[0, 0], [d - 0.01, -340 - 160 * R(seed, 2)]]), kf("offsetX", [[0, 0], [d * 0.5, 50 * (R(seed, 3) - 0.5)], [d - 0.01, 120 * (R(seed, 4) - 0.5)]]), kf("scale", [[0, 0.5], [d - 0.01, 2.1]]), kf("opacity", [[0, 0], [d * 0.2, 0.22], [d - 0.01, 0]])]} />;
