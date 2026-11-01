// fw_motion.js — Fourth Watch spring motion for on-screen text (title, verse card, captions).
// Version 2026-10-29. Loads as a classic <script> after engine/video/boot.js (global `FWM`) or via require().
//
// Every function is a pure function of time t (seconds): closed-form springs, no integration, no state,
// so any frame renders identically in any order on any worker.
//
// House rules this file enforces (from the Fourth Watch playbook + the motion-reel critique):
//   - Text never fades in or out. Words rise through a mask and lift out through it.
//   - A hit reads ON its word: the spring is released `lead()` seconds early, so the word is
//     readable at the moment it is spoken, not 3-6 frames later.
//   - Swaps never overlap: back-to-back captions swap by a push (the incoming line rises on the same spring and
//     pushes the outgoing one up out of the mask); after a pause a caption lifts out by its last word + hold.
//   - No slivers: a word is not drawn while less than 30% of its ink is inside the mask.
//   - Text is drawn in screen space (call these after the camera transform is reset).
//   - The title can be fully on screen at frame one (in: null): it only animates its exit.
//   - Camera moves stay cubic in-out per the playbook; springs here are for text and cards only.
(function (root, factory) {
  const M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M;
  else root.FWM = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FPS = 30;

  // response = seconds for one undamped period; damping = ratio (1 = no overshoot).
  const PRESETS = {
    heavy:   { response: 0.5,  damping: 1.0 },  // display type (title, verse lines): weight, no overshoot
    default: { response: 0.4,  damping: 0.9 },  // cards and bands
    snappy:  { response: 0.22, damping: 0.85 }, // captions and exits: quick, a hair of overshoot
  };
  const P = (p) => (typeof p === 'string' ? PRESETS[p] : p) || PRESETS.default;

  /** Unit step response of a spring released tau seconds ago: 0 for tau <= 0, settles to 1. */
  function step(tau, preset) {
    if (!(tau > 0)) return 0;
    const { response, damping: z } = P(preset);
    const w = (2 * Math.PI) / response;
    if (z < 1) {
      const wd = w * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
    }
    if (z === 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
    const wd = w * Math.sqrt(z * z - 1);
    return 1 - Math.exp(-z * w * tau) * (Math.cosh(wd * tau) + ((z * w) / wd) * Math.sinh(wd * tau));
  }

  const cache = new Map();
  /** Seconds a spring needs before it first reaches fraction f of its travel. */
  function reach(preset, f) {
    const p = P(preset), key = `r${p.response}/${p.damping}/${f}`;
    if (!cache.has(key)) { let tau = 0; while (step(tau, p) < f && tau < 10) tau += 0.0005; cache.set(key, tau); }
    return cache.get(key);
  }
  /** Seconds until the spring stays within eps of its target for good. */
  function settle(preset, eps = 0.01) {
    const p = P(preset), key = `s${p.response}/${p.damping}/${eps}`;
    if (!cache.has(key)) {
      let last = 0;
      for (let tau = 0; tau < 20 * p.response; tau += 0.001) if (Math.abs(1 - step(tau, p)) >= eps) last = tau;
      cache.set(key, last);
    }
    return cache.get(key);
  }
  /** How early to release a spring so its target reads ON the hit: half its travel, at least 3 frames. */
  const lead = (preset = 'heavy', fps = FPS) => Math.max(3 / fps, reach(preset, 0.5));

  /** One spring from `from` to `to`, released at t0. */
  const spring = (t, t0, from, to, preset) => from + (to - from) * step(t - t0, preset);
  /** A spring that reads ON tHit (released lead() earlier). Returns 0..1. */
  const hit = (t, tHit, preset = 'heavy') => step(t - (tHit - lead(preset)), preset);

  /**
   * A value with several targets: one spring per change, each released at its own time, summed.
   * keys: [[t, value, preset?], ...] sorted by t; the first key's time is ignored (initial value).
   * Never restarts a spring, so a retarget mid-flight keeps its momentum.
   */
  function track(t, keys, preset) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [ti, vi, pi] = keys[i];
      if (t <= ti) break;
      v += (vi - keys[i - 1][1]) * step(t - ti, pi || preset);
    }
    return v;
  }

  // ------------------------------------------------------------------ text layout
  const font = (o, size) => `${o.style || 'normal'} ${o.weight || 600} ${size}px ${o.family || 'Inter, sans-serif'}`;
  function tracked(ctx, s, spacing) { return ctx.measureText(s).width + Math.max(0, s.length - 1) * spacing; }
  function drawTracked(ctx, s, x, y, spacing) {
    if (!spacing) { ctx.fillText(s, x, y); return; }
    for (const ch of s) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; }
  }
  const norm = (w) => w.toUpperCase().replace(/[^A-Z0-9']/g, '');

  /**
   * Lay out words into lines (explicit '\n' breaks, else wrap at maxW). Returns
   * [{ y, words: [{ w, x, width, key }] }] with x positions for the chosen alignment.
   */
  function layout(ctx, o) {
    const size = o.size, spacing = (o.tracking || 0) * size;
    ctx.font = font(o, size);
    const keys = new Set((o.key || []).map(norm));
    const sp = tracked(ctx, ' ', 0) + spacing;
    const src = String(o.text).split('\n');
    const rows = [];
    for (const para of src) {
      let row = [];
      let rw = 0;
      for (const w of para.split(/\s+/).filter(Boolean)) {
        const width = tracked(ctx, w, spacing);
        if (o.maxW && row.length && rw + sp + width > o.maxW) { rows.push(row); row = []; rw = 0; }
        rw += (row.length ? sp : 0) + width;
        const m = ctx.measureText(w);   // the word's real ink extent above and below the baseline
        const asc = m.actualBoundingBoxAscent || size * 0.72, desc = m.actualBoundingBoxDescent || 0;
        row.push({ w, width, key: keys.has(norm(w)), asc, desc });
      }
      if (row.length) rows.push(row);
    }
    const lh = (o.lineHeight || 1.12) * size;
    return rows.map((row, i) => {
      const total = row.reduce((a, b) => a + b.width, 0) + sp * (row.length - 1);
      let x = o.align === 'center' ? o.x - total / 2 : o.align === 'right' ? o.x - total : o.x;
      const words = row.map((r) => { const out = { ...r, x }; x += r.width + sp; return out; });
      return { y: o.y + i * lh, words, width: total };
    });
  }

  /**
   * Words rise in through a mask and lift out through it.
   *   o.text, o.x, o.y (baseline of line 1), o.size, o.family, o.weight, o.style, o.align, o.maxW, o.lineHeight, o.tracking (em)
   *   o.color, o.key (words drawn in o.keyColor), o.shadow (css color, soft drop shadow for legibility)
   *   o.in:   time the FIRST word reads (spring released lead() earlier). null = already on screen (frame one).
   *   o.out:  time the line must be COMPLETELY gone (exit starts early enough to finish by then). null = stays.
   *   o.exitAt: instead of o.out, the time the exit spring is RELEASED (used for push swaps, where the
   *           next line rises on the same spring and pushes this one out of the mask).
   *   o.stagger: seconds between words entering (default 0.06; captions use ~0.025)
   *   o.preset (enter, default 'heavy'), o.exitPreset (default 'snappy')
   * Returns true if anything was drawn.
   */
  function rise(ctx, t, o) {
    const preset = o.preset || 'heavy', exitP = o.exitPreset || 'snappy';
    const stagger = o.stagger == null ? 0.06 : o.stagger;
    const rows = layout(ctx, o);
    const n = rows.reduce((a, r) => a + r.words.length, 0);
    const size = o.size, travel = size * 1.45;
    // exit: each word must have travelled 97% of `travel` by o.out (or starts at o.exitAt)
    const exitDur = reach(exitP, 0.97) + (n - 1) * stagger * 0.5;
    const exitT0 = o.exitAt != null ? o.exitAt : o.out != null ? o.out - exitDur : null;
    if (o.out != null && t >= o.out) return false;
    if (o.exitAt != null && t >= o.exitAt + exitDur + reach(exitP, 0.999)) return false;
    if (o.in != null && t < o.in - lead(preset) - 1e-9) return false;
    ctx.save();
    ctx.font = font(o, size);
    ctx.textBaseline = 'alphabetic';
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = size * 0.35; ctx.shadowOffsetY = size * 0.04; }
    let k = 0, drew = false;
    const spacing = (o.tracking || 0) * size;
    for (const row of rows) {
      // the mask: one band per line, from cap height (+padding) to below the descenders
      const top = row.y - size * 1.0, bot = row.y + size * 0.34;
      ctx.save();
      ctx.beginPath();
      ctx.rect(-1e4, top, 2e4, bot - top);
      ctx.clip();
      for (const w of row.words) {
        let dy = 0;
        if (o.in != null) dy += travel * (1 - hit(t, o.in + k * stagger, preset));
        if (exitT0 != null) dy -= travel * step(t - (exitT0 + k * stagger * 0.5), exitP);
        k++;
        if (dy >= travel * 0.999 || dy <= -travel * 0.999) continue;
        // no slivers: skip a word while less than 30% of its ink is inside the mask
        // (a lone strip of serif feet or cap tops on the first/last frame of a rise reads as a glitch)
        const gTop = row.y + dy - w.asc, gBot = row.y + dy + w.desc;
        if ((Math.min(gBot, bot) - Math.max(gTop, top)) / Math.max(1, gBot - gTop) < 0.3) continue;
        ctx.fillStyle = w.key ? (o.keyColor || '#E3B25C') : (o.color || '#F2E6CF');
        drawTracked(ctx, w.w, w.x, row.y + dy, spacing);
        drew = true;
      }
      ctx.restore();
    }
    ctx.restore();
    return drew;
  }

  /**
   * A band that opens from its centre line and closes back into it (verse cards, lower bands).
   *   o.x, o.y (top), o.w, o.h, o.color, o.in (fully open around here), o.out (fully closed by here), o.preset
   * Returns the open fraction 0..1 (draws nothing at 0).
   */
  function band(ctx, t, o) {
    const preset = o.preset || 'default', closeP = o.closePreset || 'snappy';
    // the close rides a quick, slightly underdamped spring so it lands on zero crisply: no hairline hanging for frames
    const close = reach(closeP, 0.985);
    let k = step(t - (o.in - reach(preset, 0.85)), preset);
    if (o.out != null) k -= step(t - (o.out - close), closeP);
    k = Math.max(0, Math.min(1.02, k));
    if (o.out != null && t >= o.out) k = 0;
    if (o.h * k < 6) return 0;   // under 6 px it can only read as a stray line
    const h = o.h * k, cy = o.y + o.h / 2;
    ctx.save();
    ctx.fillStyle = o.color || 'rgba(20,16,13,0.78)';
    ctx.fillRect(o.x, cy - h / 2, o.w, h);
    if (o.rule && h > 12) { // thin gold rules on the band edges, narrowing with the band
      ctx.fillStyle = o.rule; const rw = o.w * Math.min(1, k * 1.1);
      ctx.fillRect(o.x + (o.w - rw) / 2, cy - h / 2, rw, 2); ctx.fillRect(o.x + (o.w - rw) / 2, cy + h / 2 - 2, rw, 2);
    }
    ctx.restore();
    return k;
  }

  /**
   * Verse card: a darkened band opens, the quote rises in line by line, the reference rises last;
   * on exit the text lifts out first, then the band closes. Text never shows while the band is moving.
   *   o.quote, o.ref, o.in (quote reads at this time), o.out (all gone by this time).
   *   Set o.out to the end of the last spoken word the card covers + about 0.3 s: the words start lifting
   *   about 0.35 s before o.out, so an earlier o.out takes the card away while the quote is still being said.
   *   o.x, o.y (band top), o.w, o.h, o.pad, o.size, o.refSize, o.quoteFont {family, weight, style}, o.refFont,
   *   o.color, o.refColor, o.bandColor, o.rule, o.align ('center' default)
   */
  function verseCard(ctx, t, o) {
    const bandIn = o.in - 0.18, bandOut = o.out;
    const textOut = o.out - reach('snappy', 0.985) - 0.02; // text gone before the band starts closing
    const k = band(ctx, t, { x: o.x, y: o.y, w: o.w, h: o.h, color: o.bandColor, rule: o.rule, in: bandIn, out: bandOut });
    if (k <= 0) return false;
    const align = o.align || 'center';
    const cx = align === 'center' ? o.x + o.w / 2 : o.x + (o.pad || 70);
    const q = { ...(o.quoteFont || { family: '"Cormorant Garamond", Georgia, serif', weight: 600, style: 'italic' }) };
    const qo = { ...q, text: o.quote, size: o.size || 66, x: cx, y: o.y + (o.pad || 70) + (o.size || 66) * 0.95, align, maxW: o.w - 2 * (o.pad || 70),
      lineHeight: 1.18, color: o.color || '#F2E6CF', key: o.key, keyColor: o.keyColor, in: o.in, out: textOut, stagger: 0.035, preset: 'heavy' };
    const rows = layout(ctx, qo);
    rise(ctx, t, qo);
    const refSize = o.refSize || 38;
    const ry = qo.y + rows.length * qo.size * qo.lineHeight + refSize * 0.4;
    rise(ctx, t, { ...(o.refFont || { family: 'Inter, sans-serif', weight: 600 }), text: o.ref, size: refSize, x: cx, y: ry, align,
      tracking: 0.04, color: o.refColor || '#E3B25C', in: o.in + 0.25, out: textOut, stagger: 0.03, preset: 'snappy' });
    return true;
  }

  /**
   * Captions: chunks of 2-4 words. Each chunk rises in so its first word reads ON the spoken word.
   * Back-to-back chunks swap by a PUSH: the next chunk rises on the same spring and pushes the current one
   * up out of the mask, so the two never overlap and the current chunk stays readable until the next word.
   * After a pause (next chunk starts later than end + hold) the chunk lifts out by end + hold.
   *   chunks: [{ t, end, text, key?: [words] }]  (t = first word spoken, end = last word ends)
   *   o: { x, y, size, family, weight, color, keyColor, key (global key words), align, maxW, shadow, hold (s after end, max 0.5),
   *        hide: [[t0, t1], ...] windows where captions are hidden (title or verse card on screen) }
   */
  function captions(ctx, t, chunks, o) {
    const preset = 'snappy', stagger = 0.025;
    const enterLead = lead(preset);
    const hold = Math.min(0.5, o.hold == null ? 0.35 : o.hold);
    const hidden = (x) => o.hide && o.hide.some(([a, b]) => x >= a && x < b);
    let drew = false;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i], next = chunks[i + 1];
      if (hidden(c.t)) continue;
      const nextStart = next && !hidden(next.t) ? next.t - enterLead : Infinity;
      const push = nextStart <= c.end + hold;
      const spec = { ...o, text: c.text, key: [...(o.key || []), ...(c.key || [])], in: c.t, stagger, preset, exitPreset: preset, align: o.align || 'center' };
      if (push) spec.exitAt = nextStart; else spec.out = c.end + hold;
      if (t < c.t - enterLead || t >= (push ? nextStart + 0.6 : spec.out)) continue;
      if (hidden(t)) continue;
      drew = rise(ctx, t, spec) || drew;
    }
    return drew;
  }

  /**
   * Group voice word timings [{w, t, end}] into caption chunks of 2..maxWords words.
   * Phrases end at punctuation or a pause > 0.35 s; inside a phrase the split is chosen so chunks are even
   * (about 3 words) and never end on a weak word ("a", "the", "of", "would"...), e.g.
   * "He told Delilah / a razor / would take it." rather than "He told Delilah a / razor would take it."
   */
  const WEAK = new Set('a an the of to in on at for with by and or but his her their its my your our was is were would could should will can'.split(' '));
  function chunk(words, { maxWords = 4, target = 3 } = {}) {
    const phrases = [];
    let cur = [];
    words.forEach((w, i) => {
      cur.push(w);
      const gap = words[i + 1] ? words[i + 1].t - w.end : 0;
      if (/[,.;:!?]$/.test(w.w) || gap > 0.35 || i === words.length - 1) { phrases.push(cur); cur = []; }
    });
    const weak = (w) => WEAK.has(w.w.toLowerCase().replace(/[^a-z']/g, ''));
    const out = [];
    for (const ph of phrases) {
      const n = ph.length;
      // dynamic programming over split points: cost = (size - target)^2 + 1 per chunk + 3 for a weak last word
      const best = [{ c: 0, prev: -1 }];
      for (let j = 1; j <= n; j++) {
        best[j] = { c: Infinity, prev: -1 };
        for (let s = Math.max(1, Math.min(2, n)); s <= Math.min(maxWords, j); s++) {
          const i = j - s;
          if (!best[i] || best[i].c === Infinity) continue;
          const c = best[i].c + (s - target) ** 2 + 1 + (j < n && weak(ph[j - 1]) ? 3 : 0) + (s === 1 && n > 1 ? 4 : 0);
          if (c < best[j].c) best[j] = { c, prev: i };
        }
      }
      const cuts = [];
      for (let j = n; j > 0; j = best[j].prev) cuts.unshift([best[j].prev, j]);
      for (const [a, b] of cuts) {
        const ws = ph.slice(a, b);
        out.push({ t: ws[0].t, end: ws[ws.length - 1].end, text: ws.map((w) => w.w).join(' ') });
      }
    }
    return out;
  }

  /** SRT text for caption chunks: each cue ends at its last word + hold (max 0.5 s), never after the next cue starts. */
  function toSRT(chunks, hold = 0.3) {
    const ts = (s) => { const ms = Math.max(0, Math.round(s * 1000)); const p = (v, n = 2) => String(v).padStart(n, '0');
      return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
    return chunks.map((c, i) => {
      const nx = chunks[i + 1];
      const end = Math.min(c.end + Math.min(0.5, hold), nx ? nx.t - 0.001 : Infinity);
      return `${i + 1}\n${ts(c.t)} --> ${ts(end)}\n${c.text}\n`;
    }).join('\n');
  }

  /** Time inside a loop of length dur; t = dur pins to 0 so the last frame is the first. */
  function loopT(t, dur, fps = FPS) { let u = t % dur; if (u < 0) u += dur; if (dur - u <= 0.5 / fps) u = 0; return u; }

  return { VERSION: '2026-10-29', PRESETS, step, reach, settle, lead, spring, hit, track, layout, rise, band, verseCard, captions, chunk, toSRT, loopT };
});
