#!/usr/bin/env node
// Freezes what diorama.js gives the renderer for the engine lab shots, so "additive" is a measurement, not a promise.
//   node tools/creative/dio_baseline.js <diorama.js> <out.json>      write a baseline from any version of the file
// The checked-in baseline was written from the file as it stood BEFORE the low, ots, cu and insert presets were added.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { boot, ROOT } = require('./dio_harness.js');
const STEP = 1 / 6;   // samples per shot: six a second, every eased move is well covered

async function record(diorama) {
  const st = boot({ diorama });
  st.code(path.join(ROOT, 'engine_lab/lab_sets.js'));
  st.addShots(path.join(ROOT, 'engine_lab/lab_shots.js'));
  st.addShots(path.join(__dirname, 'fixtures/dio_baseline_shots.js'));
  await st.build();
  const rows = [];
  for (const shot of st.S.SHOTS) for (let n = 0; shot.t0 + n * STEP < shot.t1; n++) rows.push(Object.assign({ id: shot.id }, JSON.parse(JSON.stringify(st.snap(shot.t0 + n * STEP, shot)))));
  return rows;
}
module.exports = { record };

if (require.main === module) (async () => {
  const [src, out] = process.argv.slice(2);
  if (!src || !out) { console.error('usage: dio_baseline.js <diorama.js> <out.json>'); process.exit(2); }
  const rows = await record(path.resolve(src));
  fs.writeFileSync(out, JSON.stringify({ source_sha256: crypto.createHash('sha256').update(fs.readFileSync(src)).digest('hex'), rows }, null, 0) + '\n');
  console.log(`${rows.length} camera samples from ${src}`);
})().catch((e) => { console.error(e); process.exit(1); });
