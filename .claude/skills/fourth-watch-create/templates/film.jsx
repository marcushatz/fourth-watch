// Starter film. Copy templates/ into the episode's source folder and build it out shot by shot
// from storyboard.json. Run with: FW_PLATE=$PWD/plate.mp4 higgsedit build film.jsx
import { readFileSync } from "node:fs";
import { cam, v3, io } from "./camera.js";
import { shakeTracks } from "./motion.js";
import { makeType } from "./type.jsx";
import { motes } from "./fx.jsx";

// The approved script, one word per entry, and its word timings from the real take.
const SCRIPT = JSON.parse(readFileSync(new URL("./script_words.json", import.meta.url), "utf8"));
const WORDS = JSON.parse(readFileSync(new URL("./words.json", import.meta.url), "utf8"));
const END = WORDS[WORDS.length - 1].e + 1.5;

// Each shot's camera lives here, so plates and people agree. Replace this with the storyboard's shots.
export const SHOTS = [
  { id: "S01", a: 0, b: END, cam: (u) => cam(v3([-4, 0.7, 5], [-3, 0.7, 5.6], io(u)), [0, 1.5, 0], 1.28) },
];

export default async ({ project }) => {
  const p = await project({ dir: process.env.FW_DIR || "comp", size: "1080x1920", fps: 30, background: "#0B0A0C" });
  const plate = await p.add(process.env.FW_PLATE);
  const fonts = { caps: await p.add("fonts/Cinzel.ttf"), serif: await p.add("fonts/Cormorant.ttf") };
  const { autoCaps } = makeType({ fonts, script: SCRIPT, words: WORDS });

  const picture = [<media file={plate} x={0} y={0} width={1080} height={1920} fit="fill" muted={true} />];
  picture.push(...motes(0, END, 40, 3));
  // Add people from cast.jsx and effects from fx.jsx here, one storyboard shot at a time.

  const hits = []; // [[time, strength], ...] for real impacts only
  const shake = hits.length ? shakeTracks(hits) : [];
  p.compose(
    <frame width={1080} height={1920} layout="none">
      <frame x={0} y={0} width={1080} height={1920} layout="none" origin="center" animate={shake}>{picture}</frame>
      {autoCaps()}
    </frame>,
    { at: 0, dur: END }
  );
};
