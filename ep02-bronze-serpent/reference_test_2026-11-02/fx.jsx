import { W, H, C, P, circleD, polyD, blur, rng, lin, rad } from "./lib.jsx";
export const kf = (property, ...pairs) => ({ property, keyframes: pairs.map(([at, value, easing]) => easing ? { at, value, easing } : { at, value }) });
export const Shot = ({ at, dur, cam = [], bg = C.ink, children }) => <frame at={at} duration={dur} width={W} height={H} layout="none" origin="center" background={bg} animate={cam}>{children}</frame>;
// Parallax / shake wrapper: a canvas-sized frame with its own transform.
export const Lay = ({ anim = [], children }) => <frame width={W} height={H} layout="none" origin="center" animate={anim}>{children}</frame>;
export const shake = (dur, hits) => { const xs = [[0, 0]], ys = [[0, 0]], D = [1, -0.8, 0.6, -0.42, 0.26, -0.12, 0];
  hits.forEach(([t, a]) => D.forEach((v, i) => { const at = t + i * 0.04; if (at < dur - 0.01) { xs.push([at, a * v]); ys.push([at + 0.005, a * 0.7 * v * (i % 2 ? 1 : -1)]); } }));
  xs.push([dur, 0]); ys.push([dur, 0]); return [kf("offsetX", ...xs), kf("offsetY", ...ys)]; };
export const Flash = ({ at, dur = 0.26, color = "#FFFFFF", a = 0.92 }) => <rect at={at} duration={dur} x={0} y={0} width={W} height={H} fill={color} blendMode="screen" animate={[kf("opacity", [0, a], [dur, 0])]} />;
export const Sparks = ({ x, y, n = 40, at, dur = 1, seed = 2, spread = 620, color = C.gold }) => { const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, l = 14 + r() * 46, w = 2 + r() * 4, ca = Math.cos(a), sa = Math.sin(a), d = spread * (0.35 + r() * 0.65);
    const pts = [[x + ca * l, y + sa * l], [x - sa * w, y + ca * w], [x + ca * -l * 0.5, y + sa * -l * 0.5], [x + sa * w, y - ca * w]], dd = dur * (0.6 + r() * 0.4);
    out.push(<P at={at} duration={dd} d={polyD(pts)} fill={r() > 0.4 ? color : C.cream} blendMode="screen" animate={[kf("offsetX", [0, 0, "ease-out"], [dd, ca * d]), kf("offsetY", [0, 0, "ease-out"], [dd, sa * d + 120]), kf("opacity", [0, 1], [dd * 0.6, 0.9], [dd, 0])]} />); }
  return out; };
export const Ring = ({ x, y, at, dur = 0.7, r0 = 30, r1 = 520, color = C.gold, w = 10 }) => <P at={at} duration={dur} d={circleD(x, y, r0)} stroke={{ width: w, color }} blendMode="screen" animate={[kf("opacity", [0, 0.9], [dur, 0])]} />;
export const Pop = ({ at, dur, x = 0, y = 0, w = W, h = 240, children, rise = 40, enter = 0.2, exit = 0.16 }) => <frame at={at} duration={dur} x={x} y={y} width={w} height={h} layout="none" origin="center" animate={[kf("opacity", [0, 0], [enter * 0.5, 1], [dur - exit, 1], [dur, 0]), kf("scale", [0, 0.82, [0.2, 1.5, 0.4, 1]], [enter, 1], [dur, 1.02]), kf("offsetY", [0, rise, "ease-out"], [enter, 0], [dur, -6])]}>{children}</frame>;
export const Chip = ({ at, dur, text, y = 214 }) => { const w = 34 + text.length * 25; return <Pop at={at} dur={dur} x={(W - w) / 2} y={y} w={w} h={74}>
  <rect x={0} y={0} width={w} height={74} radius={37} fill="#0A0C22D9" strokeColor={C.gold} strokeWidth={3} />
  <text x={0} y={13} width={w} align="center" fontFamily="Bebas Neue" fontSize={50} letterSpacing={3} color={C.gold}>{text}</text></Pop>; };
export const Verse = ({ at, dur, lines, ref, y = 200, size = 50, h = 268, rot = -1.4 }) => <Pop at={at} dur={dur} x={90} y={y} w={900} h={h}>
  <rect x={0} y={10} width={900} height={h} radius={22} fill="#00000066" effects={blur(16)} />
  <rect x={0} y={0} width={900} height={h} radius={22} fill={lin(120, [[0, "#FBEFD6"], [1, "#E6CDA0"]])} strokeColor={C.bronzeM} strokeWidth={4} />
  <text x={46} y={34} width={808} align="center" fontFamily="Playfair Display" fontWeight={700} italic={true} fontSize={size} lineHeight={1.2} color={C.ink}>{lines}</text>
  <text x={46} y={h - 66} width={808} align="center" fontFamily="Bebas Neue" fontSize={40} letterSpacing={3} color="#8A4B1A">{ref}</text></Pop>;
export const Slam = ({ at, dur, text, y, size, color = C.cream, font = "Anton", lh = 1.04, x = 50, w = 980, stroke = C.ink, sw = 0, delay = 0, track = 0, from = 1.45 }) => <frame at={at + delay} duration={dur - delay} x={x} y={y} width={w} height={size * 1.4 * (text.split("\n").length)} layout="none" origin="center" animate={[kf("opacity", [0, 0], [0.07, 1], [dur - delay - 0.1, 1], [dur - delay, 0]), kf("scale", [0, from, [0.16, 0.9, 0.3, 1]], [0.2, 1], [dur - delay, 1.04])]}>
  <text x={0} y={0} width={w} align="center" fontFamily={font} fontSize={size} lineHeight={lh} letterSpacing={track} color={color} strokeColor={stroke} strokeWidth={sw} shadow={{ x: 0, y: 8, blur: 26, color: "#000000B0" }}>{text}</text></frame>;
export const Captions = ({ phrases, words, script, y = 1352 }) => phrases.map(([a, b, t0, t1]) => { const dur = t1 - t0, out = [];
  for (let i = a; i <= b; i++) { const s = words[i].s - t0, e = (i < b ? words[i + 1].s : t1) - t0, A = Math.max(0.001, s), B = Math.min(dur - 0.01, Math.max(A + 0.04, e));
    out.push(<text fontFamily="Montserrat" fontWeight={800} fontSize={66} lineHeight={1.16} color={C.cream} strokeColor={C.ink} strokeWidth={9} shadow={{ x: 0, y: 6, blur: 16, color: "#000000C8" }} animate={[{ property: "color", keyframes: [{ at: 0, value: C.cream, easing: "hold" }, { at: A, value: C.gold, easing: "hold" }, { at: B, value: C.cream, easing: "hold" }, { at: dur, value: C.cream }] }]}>{script[i]}</text>); }
  return <frame at={t0} duration={dur} width={W} height={H} layout="none" animate={[kf("opacity", [0, 0], [0.05, 1], [dur, 1]), kf("offsetY", [0, 16, "ease-out"], [0.1, 0], [dur, 0])]}>
    <row x={64} y={y} width={952} gap={20} rowGap={2} wrap={true} justify="center">{out}</row></frame>; });
