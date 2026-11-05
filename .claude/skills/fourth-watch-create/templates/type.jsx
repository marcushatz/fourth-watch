// Words land on the voice. Display text comes from the approved script, and timing comes from the real take.
import { kf, groupCaptions } from "./motion.js";

// Change these once the universal style is set.
export const PARCH = "#F4E9D2", GOLD = "#F0C062", EMBER = "#E5825A", ASH = "#B8AC9A";

const OUT = [0.16, 1, 0.3, 1];

// fonts: { caps, serif } from p.add(). script: list of words. words: list of { s, e }.
export const makeType = ({ fonts, script, words }) => {
  const tW = (i) => words[i].s;
  const eW = (i) => words[i].e;
  const ser = (s, w = 700) => ({ typography: { fontAssetId: fonts.serif.id, axes: { wght: w } }, fontFamily: "Cormorant Garamond", fontSize: s, fontWeight: w, lineHeight: 1.05 });
  const cap = (s, w = 700) => ({ typography: { fontAssetId: fonts.caps.id, axes: { wght: w } }, fontFamily: "Cinzel", fontSize: s, fontWeight: w, lineHeight: 1.05 });
  const shade = { x: 0, y: 4, blur: 26, color: "#000000D8" };

  // One caption block. lines is a list of word counts per line, read from word index `from`.
  const Cap = ({ from, lines, y = 150, t1, t0, size = 100, lh, gold = [], font = "ser", fade = 0.14, color = PARCH, rx = 40, rw = 1000 }) => {
    const st = Math.max(0, t0 ?? tW(from) - 0.08), d = t1 - st, H = lh || size * 1.14;
    let idx = from;
    const rows = lines.map((n, li) => {
      const ws = [];
      for (let k = 0; k < n; k++, idx++) {
        const i = idx, at = Math.max(0.001, tW(i) - st - 0.02), g = gold.includes(i);
        const sty = font == "cap" ? cap(size * 0.82, 600) : ser(size);
        const a = [
          kf("opacity", [[0, 0, "hold"], [at - 0.0005, 0], [at + 0.07, 1]]),
          kf("offsetY", [[0, 20, "hold"], [at - 0.0005, 20, OUT], [at + 0.28, 0]]),
        ];
        if (g) a.push(kf("scale", [[0, 1.16, "hold"], [at - 0.0005, 1.16, OUT], [at + 0.3, 1]]));
        ws.push(<text {...sty} color={g ? GOLD : color} strokeColor="#120C08" strokeWidth={3} shadow={shade} animate={a}>{script[i]}</text>);
      }
      return <row x={rx} y={li * H} width={rw} gap={size * 0.26} justify="center" align="end">{ws}</row>;
    });
    return <frame at={st} duration={d} x={0} y={y} width={1080} height={H * lines.length + 40} layout="none" animate={[kf("opacity", [[0, 1], [Math.max(0.01, d - fade), 1], [d - 0.01, 0]])]}>{rows}</frame>;
  };

  // A small label, such as a Bible reference.
  const Tag = (t0, t1, x, y, w, txt, o = {}) => {
    const d = t1 - t0;
    return <text at={t0} duration={d} x={x} y={y} width={w} align={o.align || "center"} {...cap(o.size || 34, 600)} letterSpacing={6} color={o.color || ASH} strokeColor="#120C08" strokeWidth={2} shadow={shade} animate={[kf("opacity", [[0, 0], [0.25, 1], [d - 0.25, 1], [d - 0.01, 0]])]}>{txt}</text>;
  };

  // A first pass at every caption, to replace by hand wherever the storyboard wants something better.
  const autoCaps = (o = {}) => groupCaptions(script, words).map((g) => Cap({ from: g.from, lines: [g.count], t0: g.t0 - 0.08, t1: g.t1, ...o }));

  return { Cap, Tag, autoCaps, ser, cap, shade, tW, eW };
};
