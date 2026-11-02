// FOURTH WATCH EP 1 (SAMSON), master renderer. Shots come from SCORE.SHOTS (score.js); each 3D shot is drawn by
// a scene module (scenes/<id>.js, contract in scenes/_API.md); 2D cards come from lintel/cards.js; the header and
// the narration (Lintel-style, words build at the top as spoken) are drawn here. Frames are a pure function of t.
(function () {
  const G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, FW = globalThis.FW, THREE = globalThis.THREE, LW = globalThis.LW, TX = globalThis.TX;
  const VO = S.VO, W = G.W, H = G.H;
  const { clamp, lerp, prog, ease } = FW;
  const SCENES = (globalThis.SCENES = globalThis.SCENES || {});
  const built = {}, failed = {};
  let cam;

  // ---------------- narration (words build at the top as spoken; key words in gold caps) ----------------
  const KEYS = {
    0: ['using', 'okay'], 1: ['strongest', 'prostitute', 'gate'], 2: ['delilah', 'silver'], 3: ['three', 'free'], 4: ['secret', 'hair'],
    5: ['fourth', 'other'], 6: ['left'], 7: ['other', 'assumed'], 8: ['gifted', 'approves'], 9: ['never'], 10: ['remember', 'strengthen', 'revenge'],
    11: ['eyes', 'freedom', 'strength'], 12: ['strength', 'fell'], 13: ['death', 'life'], 14: ['prayer', 'faith'], 15: ['strength', 'failures', 'prayer'],
  };
  const keyIdx = VO.lines.map((L, i) => new Set(L.words.map((w, k) => ((KEYS[i] || []).includes(w.w.toLowerCase().replace(/[^a-z]/g, '')) ? k : -1)).filter((k) => k >= 0)));
  const breaksCache = {};
  function breaksFor(ctx, li, size) {
    const key = li + ':' + size; if (breaksCache[key]) return breaksCache[key];
    const L = VO.lines[li], keys = keyIdx[li], maxW = W - 150, out = [];
    ctx.save(); let x = 0;
    L.words.forEach((w, i) => {
      ctx.font = keys.has(i) ? `700 ${Math.round(size * 0.8)}px "Cinzel"` : `600 italic ${size}px "Cormorant Garamond"`; ctx.letterSpacing = keys.has(i) ? '1.5px' : '0px';
      const ww = ctx.measureText(keys.has(i) ? w.w.toUpperCase() : w.w).width + size * 0.26;
      if (x > 0 && x + ww > maxW) { out.push(i); x = 0; }
      x += ww;
    });
    ctx.restore(); breaksCache[key] = out; return out;
  }
  function lineAt(t) { let li = -1; for (let i = 0; i < VO.lines.length; i++) if (t >= VO.lines[i].start - 0.12) li = i; return li; }
  function narration(ctx, t, shot) {
    const li = lineAt(t); if (li < 0) return;
    const L = VO.lines[li], next = VO.lines[li + 1];
    const out = next ? 1 - prog(t, next.start - 0.2, next.start - 0.08, (x) => x) : 1 - prog(t, S.DURATION - 1.2, S.DURATION - 0.6, (x) => x);
    if (shot.text === false) return;
    if (shot.card === 'verse' && t >= (shot.verseAt ?? shot.t0) - 0.1) return;
    const size = L.words.length > 22 ? 42 : 48, y = shot.title ? 500 : 318;
    TX.narration(ctx, W, L.words, t, { y, size, breaks: breaksFor(ctx, li, size), keys: keyIdx[li], a: out });
  }

  // ---------------- 2D finishing (from the approved hook style) ----------------
  let bl1, bl2;
  function bloom(ctx, amt) {
    if (amt <= 0) return;
    const c = ctx.canvas, w = Math.round(c.width / 4), h = Math.round(c.height / 4);
    if (!bl1) { bl1 = document.createElement('canvas'); bl2 = document.createElement('canvas'); }
    if (bl1.width !== w) { bl1.width = bl2.width = w; bl1.height = bl2.height = h; }
    const a = bl1.getContext('2d'), b = bl2.getContext('2d');
    a.filter = 'brightness(0.72) contrast(3.2) saturate(1.2)'; a.clearRect(0, 0, w, h); a.drawImage(c, 0, 0, w, h); a.filter = 'none';
    b.clearRect(0, 0, w, h); b.filter = 'blur(9px)'; b.drawImage(bl1, 0, 0); b.filter = 'blur(3px)'; b.globalAlpha = 0.6; b.drawImage(bl1, 0, 0); b.globalAlpha = 1; b.filter = 'none';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amt; ctx.drawImage(bl2, 0, 0, c.width, c.height); ctx.restore();
  }
  // God's light: rays from above the top-left corner converging on a screen point (additive, soft, slowly turning)
  function rays(ctx, t, amt, target) {
    if (!(amt > 0.01)) return;
    const ox = -260, oy = -520, ang0 = Math.atan2(target[1] - oy, target[0] - ox), len = Math.hypot(target[0] - ox, target[1] - oy) * 1.02;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const R = [[-0.115, 26, 0.55], [-0.07, 54, 0.8], [-0.03, 20, 0.5], [0.0, 80, 1.0], [0.035, 30, 0.6], [0.075, 46, 0.7], [0.12, 22, 0.45]];
    for (const [da, wDeg, a] of R) {
      const ang = ang0 + da + Math.sin(t * 0.35 + da * 40) * 0.008, w = (wDeg / 1000) * (1 + 0.15 * Math.sin(t * 0.8 + da * 90));
      const g = ctx.createLinearGradient(ox, oy, ox + Math.cos(ang) * len, oy + Math.sin(ang) * len);
      g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.3, `rgba(255,210,130,${0.15 * a * amt})`); g.addColorStop(0.68, `rgba(255,200,110,${0.2 * a * amt})`); g.addColorStop(0.9, `rgba(255,200,110,${0.05 * a * amt})`); g.addColorStop(1, 'rgba(255,200,110,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(ang - w) * len, oy + Math.sin(ang - w) * len); ctx.lineTo(ox + Math.cos(ang + w) * len, oy + Math.sin(ang + w) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  globalThis.FILM = { rays, bloom };

  function placeholder(ctx, shot, msg) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1B2236'); g.addColorStop(1, '#2A1E16'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.fillStyle = 'rgba(244,234,213,0.5)'; ctx.font = '600 34px "Inter"'; ctx.textAlign = 'center';
    ctx.fillText(`${shot.id} · ${shot.scene}/${shot.v}`, W / 2, H * 0.55); ctx.font = '500 26px "Inter"'; ctx.fillText(msg, W / 2, H * 0.55 + 48); ctx.restore();
  }

  // draw one 3D shot through its scene module
  function draw3D(ctx, t, shot) {
    const sc = SCENES[shot.scene];
    if (!sc) return placeholder(ctx, shot, 'scene not built yet'), null;
    if (failed[shot.scene]) return placeholder(ctx, shot, 'build error: ' + failed[shot.scene]), null;
    let r;
    try { r = sc.frame(t, shot, cam); } catch (e) { console.error(e); return placeholder(ctx, shot, 'frame error: ' + e.message), null; }
    if (!r || !r.scene) return placeholder(ctx, shot, 'no scene returned'), null;
    cam.updateMatrixWorld();
    const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
    const lean = Math.asin(-dir.y) * 0.5;
    (r.bill || []).forEach((m) => {
      m.rotation.order = 'YXZ'; m.userData.face(cam); m.rotation.x = r.noLean ? 0 : -lean; m.rotation.z = m.userData.tilt || 0;
      if (r.sun && m.userData.castFrom) m.userData.castFrom(r.sun);
    });
    if (r.beforeRender) r.beforeRender();
    const gl = LW.render(r.scene, cam, { focus: r.focus ?? 8, aperture: r.aperture ?? 5, maxR: r.maxR ?? 7, fgScale: r.fgScale ?? 1.5, exposure: r.exposure ?? 1.1, sat: r.sat ?? 1.1, lift: r.lift, gain: r.gain, ink: r.ink, focus2: r.focus2 });
    ctx.drawImage(gl, 0, 0, W, H);
    const P = (p) => LW.project(cam, p);
    if (r.rays) rays(ctx, t, r.rays.amt, r.rays.screen || P(r.rays.target));
    bloom(ctx, r.bloom ?? 0.15);
    if (r.post) r.post(ctx, t, P);
    (r.tags || []).forEach((tg) => { const p = P(tg.p); TX.tag(ctx, tg.text, p[0], p[1], tg.k, { dy: tg.dy ?? -110, dx: tg.dx ?? 0, sub: tg.sub, a: tg.a ?? 1 }); });
    if (shot.pops && globalThis.POPS) globalThis.POPS.draw(ctx, t, shot, r, P, W, H);   // the pop-up layer (fw/pops.js); inert without shot.pops
    return r;
  }

  // the picture body of one shot: the 3D frame (or card background), its light, the top scrim and its cards
  function body(ctx, t, shot) {
      cam.setViewOffset(W, H, 0, 0, W, H); cam.fov = 38; cam.updateProjectionMatrix();
      let r = null;
      if (shot.scene === 'card') globalThis.CARDS.background(ctx, t, shot);
      else r = draw3D(ctx, t, shot);
      if (r && r.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,214,150,${(0.3 * r.flash).toFixed(3)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      if (r && r.dark > 0) { ctx.fillStyle = `rgba(6,6,10,${Math.min(1, r.dark).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
      // a soft night scrim behind the top text block
      { const g = ctx.createLinearGradient(0, 0, 0, shot.title ? 760 : 560); const sa = shot.scrim ?? 0.5; g.addColorStop(0, `rgba(10,12,30,${sa})`); g.addColorStop(0.65, `rgba(10,12,30,${(sa * 0.4).toFixed(2)})`); g.addColorStop(1, 'rgba(10,12,30,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, shot.title ? 760 : 560); }
      if (shot.card) globalThis.CARDS.draw(ctx, t, shot, r);
      if (shot.pill) globalThis.CARDS.pill(ctx, t, shot);
      if (shot.chapter) globalThis.CARDS.chapter(ctx, t, shot);
      if (shot.intro) globalThis.CARDS.introStamp(ctx, t, shot);
      if (shot.counter) globalThis.CARDS.counter(ctx, t, shot);
      if (shot.tally) globalThis.CARDS.tally(ctx, t, shot);
      if (shot.stamp) globalThis.CARDS.stamp(ctx, t, shot);
      if (shot.bubble || shot.bubbles) globalThis.CARDS.bubble(ctx, t, shot);
      if (shot.explain && globalThis.EXPLAIN) globalThis.EXPLAIN.draw(ctx, t, shot, W, H);   // explainer cards (fw/explain.js); inert without shot.explain
  }

  Studio.film({
    post: { paper: 0, grain: 0.03, vignette: 0.24, bloom: 0 },
    fadeOut: 0,
    async init() {
      for (const [fam, file, w, st] of [['Cinzel', 'fonts/cinzel-latin-700-normal.woff2', '700'], ['Cinzel', 'fonts/cinzel-latin-900-normal.woff2', '900'],
        ['Cormorant Garamond', 'fonts/cormorant-garamond-latin-600-italic.woff2', '600', 'italic'], ['Inter', 'fonts/inter-latin-600-normal.woff2', '600']]) {
        const f = new FontFace(fam, `url(${file})`, { weight: w, style: st || 'normal' }); document.fonts.add(f); await f.load();
      }
      LW.init(W, H);
      cam = new THREE.PerspectiveCamera(38, W / H, 0.2, 320);
      const only = globalThis.FW_ONLY; // set by a test harness to build only some scenes
      for (const id of Object.keys(SCENES)) {
        if (only && !only.includes(id)) continue;
        try { await SCENES[id].build({ W, H, cam }); built[id] = true; } catch (e) { console.error('scene build failed', id, e); failed[id] = e.message; }
      }
    },
    draw(ctx, t) {
      if (t >= S.END_T) return globalThis.CARDS.endCard(ctx, t); // hard cut to the end card
      const shot = S.shotAt(t);
      // a transition (fw/trans.js) draws the outgoing and incoming picture bodies itself; otherwise the body draws straight in
      const tr = globalThis.TRANS && globalThis.TRANS.active(t, shot);
      if (tr) globalThis.TRANS.draw(ctx, t, shot, S.SHOTS[shot.i - 1], body, W, H, tr); else body(ctx, t, shot);
      const EP = globalThis.EPISODE || { series: 'ASK THE TEXT', topic: 'SAMSON', title: [['IF', 'GOD', 'STILL', 'USES', 'YOU,'], ['IS', 'HE', 'OKAY*', 'WITH'], ['HOW', 'YOU', 'LIVE?']], titleY: 318, titleSize: 64 };
      if (!globalThis.FW_NOCAP) TX.header(ctx, W, 1, { series: EP.series, topic: EP.topic });   // FW_NOCAP: a review build with no text at all
      if (shot.title) TX.title(ctx, W, EP.title, 1, EP.titleY ?? 318, EP.titleSize ?? 64);
      narration(ctx, t, shot);
      // cut-in transitions: a short dip from black at section changes, a gold flash where the scene asks for it
      const d = t - shot.t0;
      if (shot.i > 0 && shot.dip && d < 0.22) { ctx.fillStyle = `rgba(8,7,10,${(0.85 * (1 - d / 0.22)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
      // Lintel's scene-change flash: 0.2 s of cream that fades, landing on the first word of the new clause
      if (shot.i > 0 && shot.flashIn && d < 0.2) { ctx.fillStyle = `rgba(255,246,228,${(0.92 * Math.pow(1 - d / 0.2, 1.5)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    },
  });
})();
