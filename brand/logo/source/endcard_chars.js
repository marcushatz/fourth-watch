// End-card characters (v3), in the series' character style (lintel/people.js helpers: flat fills, a cel shade away from
// the light, a warm rim on the lit edge, a thin dark warm outline), lit for the night scene:
//   FWC.jesus(ctx, st)  walking toward the boat (screen right), one hand reaching out to them; cream robe with the gold
//                       key light from the upper left and a cool blue shadow side; a deep red mantle over the far shoulder;
//                       shoulder-length hair and beard; a simple shaded face (brow and nose planes, no detailed features).
//   FWC.boat(ctx, st)   the fishing boat side-on (bow to screen right) with four disciples in muted robes, lit warm by the
//                       lantern on the mast; one half-risen at the stern pointing at Him.
// Design units: feet (or the waterline) at the origin, y up is negative. Jesus is about 6.5 heads tall (head top -560).
(function () {
  const PP = globalThis.PP;
  if (!PP) throw new Error('endcard_chars.js needs lintel/people.js');
  const { part, limb, ell, poly, blob } = PP;
  const FWC = (globalThis.FWC = {});
  const LINE = '#24160F';
  const P2 = () => new Path2D();
  let LWK = 1;   // outline weight multiplier (the boat is drawn with a heavier line: it is seen from much further away)
  const mt = (m) => new DOMMatrix(m);

  // a part lit from an arbitrary direction (unit vector toward the light): shade away from it, rim toward it
  function litPart(ctx, path, base, o = {}) {
    const L = o.L || [-0.8, -0.6];
    ctx.fillStyle = base; ctx.fill(path);
    if (o.shade) { const d = o.sd ?? 8; ctx.save(); ctx.clip(path); const p = P2(); p.rect(-3000, -3000, 6000, 6000); p.addPath(path, mt([1, 0, 0, 1, L[0] * d, L[1] * d])); ctx.fillStyle = o.shade; ctx.fill(p, 'evenodd'); ctx.restore(); }
    if (o.rim && (o.rimA ?? 1) > 0.01) { const d = o.rd ?? 3.5; ctx.save(); ctx.clip(path); ctx.globalAlpha = Math.min(1, o.rimA ?? 1); const p = P2(); p.rect(-3000, -3000, 6000, 6000); p.addPath(path, mt([1, 0, 0, 1, -L[0] * d, -L[1] * d])); ctx.fillStyle = o.rim; ctx.fill(p, 'evenodd'); ctx.restore(); }
    if (o.line !== false) { ctx.lineWidth = (o.lw ?? 2.6) * LWK; ctx.strokeStyle = o.lineCol || LINE; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(path); }
  }
  FWC.litPart = litPart;
  const fold = (ctx, pts, col, w = 2) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const xc = (pts[i][0] + pts[i + 1][0]) / 2, yc = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], xc, yc); } const E = pts[pts.length - 1]; ctx.lineTo(E[0], E[1]); ctx.stroke(); ctx.restore(); };

  // ---------------- Jesus ----------------
  const JC = {
    robe: '#D3C3A5', robeLit: '#E6D5B5', robeEnd: '#AE9F88', robeSh: '#7684AC', robeRim: '#FFD07C',
    foldWarm: 'rgba(150,104,66,0.42)', foldCool: 'rgba(92,100,138,0.5)',
    mantle: '#962B26', mantleSh: '#561D2C', mantleRim: '#F08A58', mantleFold: 'rgba(60,14,22,0.55)',
    skin: '#CF9670', skinSh: '#9A6656', skinRim: '#FFD1A0', palm: '#E2AE88',
    hair: '#4C3223', hairSh: '#2C1D16', hairRim: '#B98250', eye: '#24160F',
    sandal: '#6B4A33',
  };
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  // one mitten hand for both sides (same size): wrist at W, fingers along ang; palm: the palm faces up/toward us (open, welcoming)
  function hand(ctx, W, ang, o) {
    const C = JC, L = rot([-0.8, -0.6], -ang);
    ctx.save(); ctx.translate(W[0], W[1]); ctx.rotate(ang); if (o.flip) ctx.scale(1, -1);
    const Lf = o.flip ? [L[0], -L[1]] : L;
    const mitt = blob([[-3, -9], [12, -11], [27, -12], [39, -10], [45, -5], [43, 1], [32, 6], [16, 8], [0, 8], [-4, 2]], 0.45);
    litPart(ctx, mitt, C.skin, { L: Lf, shade: C.skinSh, sd: 4, rim: C.skinRim, rimA: o.rimA, rd: 2.5, lw: 2.4 });
    if (o.palm) { ctx.save(); ctx.clip(mitt); ctx.fillStyle = C.palm; ctx.beginPath(); ctx.ellipse(20, -8, 17, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = 'rgba(120,70,52,0.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';                                        // finger separations
    for (const y of [-5, 0]) { ctx.beginPath(); ctx.moveTo(30, y - 1); ctx.lineTo(42, y + 0.5); ctx.stroke(); } ctx.restore();
    litPart(ctx, blob([[6, -8], [11, -17], [18, -24], [24, -22], [21, -13], [15, -6]], 0.45), C.skin, { L: Lf, shade: C.skinSh, sd: 3, rim: C.skinRim, rimA: o.rimA, rd: 2, lw: 2.4 });   // thumb
    ctx.restore();
  }
  // st.s: stride -1..1 (the forward leg shows through the robe), st.warm 0..1 (how much of God's gold light is on Him)
  FWC.jesus = (ctx, st = {}) => {
    const s = st.s ?? 0.7, a = Math.abs(s), warm = st.warm ?? 1;
    const C = JC, rimA = 0.35 + 0.65 * warm;
    const knee = 60 + 12 * a, foot = 70 + 24 * a, trail = a;
    // mantle: the panel hanging down His back (blown back a little)
    litPart(ctx, blob([[-40, -462], [-60, -452], [-72, -420], [-86, -340], [-102, -252], [-118, -182], [-100, -172], [-80, -182], [-64, -200], [-58, -300], [-50, -400]], 0.45),
      C.mantle, { shade: C.mantleSh, sd: 14, rim: C.mantleRim, rimA, rd: 4 });
    // the back foot, heel lifted
    litPart(ctx, blob([[-58 - 6 * trail, -12], [-40, -14], [-28, -6], [-32, 0], [-60 - 6 * trail, -2]], 0.45), C.skin, { shade: C.skinSh, sd: 4, rim: C.skinRim, rimA: rimA * 0.7 });
    // robe
    const robe = blob([[-8, -468], [18, -467], [46, -460], [58, -444], [56, -400], [50, -340], [56, -296], [knee, -190], [knee + 8, -110], [foot - 2, -40], [foot + 4, -8],
      [40, -2], [0, -4], [-40, -8], [-72 - 10 * trail, -16], [-70, -120], [-64, -240], [-60, -330], [-62, -400], [-58, -446], [-40, -462]], 0.42);
    ctx.save(); ctx.clip(robe);
    const g = ctx.createLinearGradient(-90, -480, 90, -40); g.addColorStop(0, C.robeLit); g.addColorStop(0.5, C.robe); g.addColorStop(1, C.robeEnd); ctx.fillStyle = g; ctx.fillRect(-200, -600, 400, 620);
    ctx.restore();
    litPart(ctx, robe, 'rgba(0,0,0,0)', { shade: C.robeSh, sd: 30, rim: C.robeRim, rimA, rd: 5 });
    ctx.save(); ctx.clip(robe);   // folds: warm shadows in the lit cloth, cool ones on the shadow side
    fold(ctx, [[-8, -296], [-14, -200], [-20, -96], [-18, -12]], C.foldWarm, 2.4);
    fold(ctx, [[-34, -270], [-42, -170], [-48, -60]], C.foldWarm, 2);
    fold(ctx, [[22, -300], [32, -206], [42, -104], [50, -16]], C.foldCool, 2.4);
    fold(ctx, [[knee - 10, -200], [knee - 4, -110], [foot - 12, -30]], C.foldCool, 2);
    ctx.restore();
    // the near foot, stepping out (sandal strap)
    litPart(ctx, blob([[foot - 10, -10], [foot + 10, -12], [foot + 26, -6], [foot + 28, 0], [foot - 8, 0]], 0.45), C.skin, { shade: C.skinSh, sd: 4, rim: C.skinRim, rimA, lw: 2.4 });
    ctx.save(); ctx.strokeStyle = C.sandal; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(foot + 2, -11); ctx.lineTo(foot + 8, -1); ctx.stroke(); ctx.restore();
    // the far arm, relaxed at His side: the sleeve comes out from under the mantle, the hand hangs open
    litPart(ctx, blob([[-46, -398], [-70, -394], [-84, -346], [-92, -300], [-86, -282], [-66, -284], [-58, -330], [-44, -370]], 0.42), C.robe, { shade: C.robeSh, sd: 10, rim: C.robeRim, rimA: rimA * 0.8, rd: 4 });
    hand(ctx, [-78, -290], 1.72, { rimA: rimA * 0.7, flip: true });
    // mantle: the front drape over the far shoulder and across the chest to the near hip
    const drape = blob([[-58, -452], [-36, -468], [-12, -462], [12, -440], [40, -396], [56, -340], [54, -296], [32, -300], [6, -334], [-24, -372], [-48, -404], [-62, -432]], 0.42);
    litPart(ctx, drape, C.mantle, { shade: C.mantleSh, sd: 12, rim: C.mantleRim, rimA, rd: 4 });
    fold(ctx, [[-30, -430], [0, -400], [28, -360], [44, -318]], C.mantleFold, 2.4);
    fold(ctx, [[-42, -410], [-14, -378], [14, -344]], C.mantleFold, 1.8);
    // neck
    litPart(ctx, poly([[-6, -488], [16, -488], [18, -462], [-4, -460]]), C.skin, { shade: C.skinSh, sd: 5, line: false });
    // the near arm: a natural shoulder, the elbow a little bent, the forearm angled slightly down toward the boat; the wide sleeve
    // drapes from the forearm; the hand open, palm up and forward ("Take heart; it is I.")
    const sleeve = blob([[30, -466], [58, -458], [72, -438], [88, -404], [100, -368], [128, -354], [164, -343], [176, -341], [179, -330], [171, -312], [150, -292],
      [124, -292], [102, -306], [86, -326], [66, -350], [54, -384], [46, -408], [34, -430]], 0.45);
    litPart(ctx, sleeve, C.robe, { shade: C.robeSh, sd: 12, rim: C.robeRim, rimA, rd: 4.5 });
    ctx.save(); ctx.clip(sleeve); ctx.fillStyle = 'rgba(255,236,200,0.28)'; ctx.beginPath(); ctx.ellipse(70, -440, 26, 16, 0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // the beam on the shoulder
    fold(ctx, [[94, -350], [122, -322], [150, -300]], C.foldCool, 2.2);
    fold(ctx, [[60, -420], [74, -380], [86, -346]], C.foldWarm, 1.8);
    hand(ctx, [176, -334], -0.2, { rimA, palm: true });
    // head: face (three-quarter, turned toward the boat)
    const face = blob([[0, -558], [22, -548], [32, -530], [36, -516], [37, -500], [30, -486], [16, -479], [-4, -482], [-18, -494], [-26, -514], [-22, -538], [-12, -552]], 0.45);
    litPart(ctx, face, C.skin, { shade: C.skinSh, sd: 9, rim: C.skinRim, rimA, rd: 3 });
    ctx.save(); ctx.clip(face); ctx.fillStyle = 'rgba(120,68,50,0.26)'; ctx.beginPath(); ctx.ellipse(30, -492, 7, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // cheek plane
    // the channel's simple dot eyes with a small highlight, and gentle brows
    for (const [x, rx, ry] of [[21, 3.6, 4.6], [1.5, 2.8, 4.0]]) {
      ctx.fillStyle = C.eye; ctx.beginPath(); ctx.ellipse(x, -512, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - rx * 0.35, -513.6, rx * 0.36, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.strokeStyle = C.hair; ctx.lineCap = 'round';
    ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(14, -521); ctx.quadraticCurveTo(21, -524.5, 29, -521.5); ctx.stroke();
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-3, -520.5); ctx.quadraticCurveTo(1.5, -523, 6, -520.5); ctx.stroke(); ctx.restore();
    litPart(ctx, poly([[33, -522], [45, -504], [41, -500], [33, -500]]), C.skin, { shade: C.skinSh, sd: 3, lw: 2.2 });                   // nose
    // hair: over the crown, down behind the ear to the shoulders
    litPart(ctx, blob([[-4, -563], [18, -561], [30, -549], [24, -541], [8, -545], [-6, -538], [-14, -520], [-12, -498], [-6, -474], [2, -452], [-18, -446], [-42, -452], [-50, -480], [-44, -522], [-34, -550], [-20, -561]], 0.45),
      C.hair, { shade: C.hairSh, sd: 8, rim: C.hairRim, rimA, rd: 3.5 });
    fold(ctx, [[-30, -540], [-36, -500], [-34, -462]], 'rgba(30,18,12,0.6)', 1.6);
    fold(ctx, [[-16, -548], [-24, -510], [-22, -470]], 'rgba(160,110,70,0.45)', 1.4);
    // beard and moustache
    litPart(ctx, blob([[34, -497], [33, -486], [27, -474], [14, -465], [0, -467], [-10, -478], [-14, -494], [-8, -500], [2, -492], [14, -489], [26, -493]], 0.45), C.hair, { shade: C.hairSh, sd: 6, rim: C.hairRim, rimA: rimA * 0.8, rd: 3 });
    litPart(ctx, blob([[22, -499], [35, -499], [38, -494], [28, -491], [20, -493]], 0.45), C.hair, { shade: C.hairSh, sd: 3, lw: 2.2 });
  };
  const lerp = (a, b, k) => a + (b - a) * k;

  // ---------------- Jesus, v5: one consistent three-quarter view, the whole body turned toward the boat (screen right) ----------------
  // head, torso and hips in 3/4; the far arm (screen right) reaches toward the boat, open palm, elbow slightly bent, the wide
  // sleeve draping; the near arm (screen left) relaxed at His side, the hand mostly in the sleeve; walking: the far foot steps
  // forward and the hem swings with it. The red mantle is one piece: over the near shoulder, across the chest, down the back.
  const J5 = {
    robe: '#D9C9AB', robeLit: '#EADBBD', robeEnd: '#B2A38C', robeSh: '#8F95AE', robeRim: '#FFD27E',
    foldWarm: 'rgba(146,102,64,0.45)', foldCool: 'rgba(88,96,134,0.5)', cord: '#8A5A34', cordSh: '#5A3A22',
    mantle: '#9A2D27', mantleSh: '#5A1E2C', mantleRim: '#F08A58', mantleFold: 'rgba(58,14,22,0.55)',
    skin: '#CF9670', skinSh: '#A06A56', skinRim: '#FFD1A0', palm: '#E4B18C',
    hair: '#4C3223', hairSh: '#2C1D16', hairRim: '#B98250', eye: '#24160F', beard: '#5A3B28', beardSh: '#3A2519',
  };
  function hand5(ctx, W, ang, o) {   // the open hand, palm up and forward
    const C = J5, L = rot([-0.8, -0.6], -ang);
    ctx.save(); ctx.translate(W[0], W[1]); ctx.rotate(ang);
    const mitt = blob([[-4, -8], [10, -11], [25, -12], [37, -10], [43, -5], [41, 1], [30, 6], [15, 8], [0, 8], [-5, 2]], 0.45);
    litPart(ctx, mitt, C.skin, { L, shade: C.skinSh, sd: 4, rim: C.skinRim, rimA: o.rimA, rd: 2.5, lw: 2.4 });
    ctx.save(); ctx.clip(mitt); ctx.fillStyle = C.palm; ctx.beginPath(); ctx.ellipse(19, -7.5, 16, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(120,70,52,0.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; for (const y of [-5, 0]) { ctx.beginPath(); ctx.moveTo(28, y - 1); ctx.lineTo(40, y + 0.5); ctx.stroke(); } ctx.restore();
    litPart(ctx, blob([[4, -8], [9, -17], [16, -23], [22, -21], [19, -12], [13, -5]], 0.45), C.skin, { L, shade: C.skinSh, sd: 3, rim: C.skinRim, rimA: o.rimA, rd: 2, lw: 2.4 });
    ctx.restore();
  }
  function handRelaxed(ctx, W, ang, o) {
    const C = J5, L = rot([-0.8, -0.6], -ang);
    ctx.save(); ctx.translate(W[0], W[1]); ctx.rotate(ang);
    const mitt = blob([[-4, -8], [10, -10], [23, -11], [33, -9], [39, -4], [40, 2], [35, 8], [26, 10], [13, 9], [0, 8], [-5, 2]], 0.45);
    litPart(ctx, mitt, C.skin, { L, shade: C.skinSh, sd: 4, rim: C.skinRim, rimA: o.rimA, rd: 2.5, lw: 2.4 });
    ctx.save(); ctx.strokeStyle = 'rgba(120,70,52,0.7)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';   // the curl of the fingers
    ctx.beginPath(); ctx.moveTo(25, -9); ctx.quadraticCurveTo(33, -4, 33, 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(27, 2); ctx.lineTo(37, 3); ctx.stroke(); ctx.restore();
    litPart(ctx, blob([[6, -8], [14, -14], [22, -16], [26, -12], [20, -7], [12, -4]], 0.45), C.skin, { L, shade: C.skinSh, sd: 3, rim: C.skinRim, rimA: o.rimA, rd: 2, lw: 2.4 });   // thumb, toward the front
    ctx.restore();
  }
  FWC.jesus5 = (ctx, st = {}) => {
    const s = st.s ?? 0.7, a = Math.abs(s), warm = st.warm ?? 1, C = J5, rimA = 0.35 + 0.65 * warm;
    const kx = 62 + 10 * a, fx = 84 + 22 * a, tr = a;   // forward knee, forward foot, how far the back hem trails
    // st.wind 0..1: the strong wind against them (Matthew 14:24): mantle, cord ends and back hem blown back (screen left); the hair stays as approved in v5
    const W = st.wind ?? 0, blow = (pts, y0 = -452, span = 362, kx0 = 75, ky0 = 20) => pts.map(([x, y]) => { const k = Math.max(0, Math.min(1, (y - y0) / span)); return [x - W * kx0 * Math.pow(k, 1.3), y - W * ky0 * k * k]; });
    // hair, the back mass: behind the head, falling behind both shoulders
    litPart(ctx, blob([[-2, -572], [24, -568], [42, -554], [50, -530], [50, -500], [54, -470], [50, -448], [34, -446], [26, -462], [-20, -462], [-42, -446], [-58, -450], [-56, -478], [-48, -508], [-42, -538], [-26, -562]], 0.45),
      C.hair, { shade: C.hairSh, sd: 8, rim: C.hairRim, rimA, rd: 3.5 });
    // mantle, the back fall: from the near shoulder down His back to the calf (seen past His near side)
    const fall = blob(blow([[-60, -452], [-84, -440], [-100, -406], [-110, -346], [-118, -276], [-122, -214], [-118, -164], [-110, -132], [-114, -116], [-104, -104], [-98, -90], [-90, -104], [-86, -140], [-82, -200],
      [-78, -270], [-72, -340], [-66, -410]]), 0.42);
    litPart(ctx, fall, C.mantle, { shade: C.mantleSh, sd: 12, rim: C.mantleRim, rimA, rd: 4 });
    ctx.save(); ctx.clip(fall);   // soft folds: a shaded underside under each ridge, a lit ridge above it
    for (const [pts0, w, a] of [[[[-92, -400], [-100, -330], [-106, -250], [-104, -170], [-100, -120]], 9, 0.55], [[[-84, -360], [-88, -280], [-90, -200], [-92, -150]], 7, 0.4], [[[-112, -300], [-116, -230], [-114, -180]], 6, 0.35]]) {
      const pts = blow(pts0); fold(ctx, pts, `rgba(70,16,26,${a})`, w); fold(ctx, pts.map(([x, y]) => [x - 4, y]), 'rgba(240,130,96,0.22)', 2); }
    ctx.restore();
    // the far arm (screen right): the sleeve from behind the chest, reaching toward the boat, draping under the forearm.
    // st.armDrop (radians) lowers the whole reaching arm about the shoulder (the scene uses it to keep open water before the boat)
    ctx.save(); ctx.translate(40, -448); ctx.rotate(st.armDrop || 0); ctx.translate(-40, 448);
    const sleeveF = blob([[30, -452], [56, -446], [80, -422], [100, -398], [126, -384], [150, -378], [158, -374], [160, -362], [152, -346], [134, -328], [112, -324], [96, -338], [80, -356], [60, -380], [44, -402], [34, -424]], 0.45);
    litPart(ctx, sleeveF, C.robe, { shade: C.robeSh, sd: 12, rim: C.robeRim, rimA, rd: 4.5 });
    ctx.save(); ctx.clip(sleeveF);
    fold(ctx, [[92, -366], [116, -344], [140, -330]], C.foldCool, 2.4);
    fold(ctx, [[84, -380], [102, -356], [114, -330]], C.foldCool, 1.8);
    fold(ctx, [[110, -372], [128, -356], [150, -350]], C.foldCool, 1.6);
    fold(ctx, [[70, -416], [94, -392], [120, -378]], C.foldWarm, 1.6);
    fold(ctx, [[50, -440], [66, -414], [80, -398]], C.foldWarm, 1.4);
    ctx.restore();
    hand5(ctx, [156, -368], -0.18, { rimA });
    ctx.restore();
    // the back foot (heel lifted) and the forward foot, stepping toward the boat
    litPart(ctx, blob([[-64 - 6 * tr, -12], [-44, -14], [-32, -6], [-36, 0], [-66 - 6 * tr, -2]], 0.45), C.skin, { shade: C.skinSh, sd: 4, rim: C.skinRim, rimA: rimA * 0.7, lw: 2.4 });
    // robe: 3/4 torso, a soft waist, the forward leg showing through, the hem flaring with the stride
    const robe = blob([[-30, -458], [-4, -464], [22, -462], [40, -454], [52, -432], [52, -396], [46, -356], [42, -334], [48, -300], [56, -240], [kx, -170], [kx + 6, -100], [fx - 8, -40], [fx, -8],
      [fx - 22, -2], [52, -7], [32, -1], [12, -6], [-10, -1], [-32, -7], [-56, -4], [-74 - 12 * W, -12 - 4 * W], [-88 - 8 * tr - 30 * W, -16 - 10 * W], [-82 - 14 * W, -64], [-78 - 6 * W, -110], [-72, -144], [-64, -232], [-56, -300], [-50, -332], [-56, -372], [-62, -420], [-58, -446]], 0.42);
    ctx.save(); ctx.clip(robe);
    const g = ctx.createLinearGradient(-90, -480, 90, -40); g.addColorStop(0, C.robeLit); g.addColorStop(0.5, C.robe); g.addColorStop(1, C.robeEnd); ctx.fillStyle = g; ctx.fillRect(-200, -600, 400, 620);
    ctx.restore();
    litPart(ctx, robe, 'rgba(0,0,0,0)', { shade: C.robeSh, sd: 26, rim: C.robeRim, rimA, rd: 5 });
    ctx.save(); ctx.clip(robe);   // folds: gathered under the cord, then falling with the stride
    for (const [pts, col, w] of [
      [[[-30, -322], [-38, -240], [-46, -150], [-56, -60], [-62, -14]], C.foldWarm, 2.4],
      [[[-8, -322], [-12, -230], [-16, -130], [-18, -20]], C.foldWarm, 2.2],
      [[[14, -322], [22, -240], [34, -150], [48, -60], [60, -12]], C.foldCool, 2.4],
      [[[32, -320], [44, -250], [kx - 4, -170], [kx + 2, -96], [fx - 14, -30]], C.foldCool, 2.2],
      [[[-44, -100], [-62, -60], [-76, -24]], C.foldWarm, 1.8],
      [[[-20, -440], [-6, -400], [6, -360]], C.foldWarm, 1.6],
      [[[kx - 2, -110], [fx - 20, -52], [fx - 26, -26], [fx - 18, -8]], C.foldCool, 2],      // the hem breaking over the forward foot
      [[[kx - 14, -90], [fx - 34, -40], [fx - 30, -14]], C.foldCool, 1.6],
      [[[52, -30], [46, -16], [52, -6]], C.foldCool, 1.6],
      [[[12, -40], [8, -16], [14, -6]], C.foldWarm, 1.4], [[[-32, -44], [-36, -18], [-30, -7]], C.foldWarm, 1.4]]) fold(ctx, pts, col, w);
    ctx.restore();
    // the forward foot
    litPart(ctx, blob([[fx - 14, -10], [fx + 6, -12], [fx + 24, -6], [fx + 26, 0], [fx - 12, 0]], 0.45), C.skin, { shade: C.skinSh, sd: 4, rim: C.skinRim, rimA, lw: 2.4 });
    ctx.save(); ctx.strokeStyle = '#6B4A33'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(fx - 2, -11); ctx.lineTo(fx + 4, -1); ctx.stroke(); ctx.restore();
    // the near arm (screen left), relaxed at His side; the hand rests mostly inside the wide sleeve
    litPart(ctx, blob([[-50, -444], [-68, -432], [-80, -398], [-86, -350], [-90, -300], [-94, -264], [-80, -254], [-62, -256], [-56, -280], [-52, -330], [-46, -380], [-40, -420]], 0.45),
      C.robe, { shade: C.robeSh, sd: 12, rim: C.robeRim, rimA, rd: 4.5 });
    fold(ctx, [[-62, -400], [-70, -340], [-78, -280]], C.foldWarm, 1.8);
    fold(ctx, [[-56, -330], [-62, -296], [-64, -262]], C.foldCool, 1.4);
    handRelaxed(ctx, [-76, -262], 1.66, { rimA });
    // mantle, the front: over the near shoulder and diagonally across the chest to the far hip (one piece with the back fall)
    const drape = blob([[-92, -412], [-84, -442], [-64, -462], [-36, -470], [-10, -462], [14, -434], [34, -394], [46, -354], [48, -326], [30, -322], [16, -350], [-2, -388], [-22, -420], [-44, -436], [-64, -434], [-80, -414]], 0.42);
    litPart(ctx, drape, C.mantle, { shade: C.mantleSh, sd: 12, rim: C.mantleRim, rimA, rd: 4 });
    fold(ctx, [[-36, -450], [-8, -418], [16, -380], [32, -344]], C.mantleFold, 2.4);
    fold(ctx, [[-56, -440], [-28, -408], [-4, -372]], C.mantleFold, 1.8);
    fold(ctx, [[-78, -444], [-86, -424]], C.mantleFold, 1.6);
    // the cord at the waist, tied on the near side
    litPart(ctx, blob([[-52, -340], [-10, -334], [44, -340], [44, -330], [-10, -324], [-52, -330]], 0.4), C.cord, { shade: C.cordSh, sd: 3, rim: '#D89A60', rimA, rd: 2, lw: 2 });
    litPart(ctx, blob([[-34, -332], [-30 - 6 * W, -300], [-36 - 14 * W, -276], [-40 - 14 * W, -278], [-38 - 6 * W, -302], [-40, -330]], 0.4), C.cord, { shade: C.cordSh, sd: 2, lw: 1.8 });
    litPart(ctx, blob([[-26, -332], [-18 - 6 * W, -306], [-20 - 12 * W, -286], [-24 - 12 * W, -288], [-24 - 6 * W, -308], [-32, -330]], 0.4), C.cord, { shade: C.cordSh, sd: 2, lw: 1.8 });
    // neck
    litPart(ctx, blob([[4, -470], [24, -468], [23, -455], [14, -451], [5, -455]], 0.4), C.skinSh, { line: false });
    // face, three-quarter toward the boat
    const face = blob([[-8, -552], [14, -556], [30, -546], [38, -528], [40, -508], [36, -488], [26, -474], [12, -468], [-4, -472], [-16, -486], [-22, -506], [-22, -530], [-16, -546]], 0.45);
    litPart(ctx, face, C.skin, { shade: C.skinSh, sd: 8, rim: C.skinRim, rimA, rd: 3 });
    ctx.save(); ctx.clip(face); ctx.fillStyle = 'rgba(150,90,64,0.22)'; ctx.beginPath(); ctx.ellipse(36, -500, 7, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();   // far cheek turning away
    // eyes (both visible; the far one a touch smaller), gentle brows, a soft small nose, a calm mouth
    for (const [x, rx, ry] of [[4, 3.6, 4.6], [26, 3.2, 4.3]]) {
      ctx.fillStyle = C.eye; ctx.beginPath(); ctx.ellipse(x, -515, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x - rx * 0.35, -516.6, rx * 0.36, 0, Math.PI * 2); ctx.fill();
    }
    ctx.save(); ctx.strokeStyle = C.hair; ctx.lineCap = 'round';
    ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(-4, -522.5); ctx.quadraticCurveTo(4, -525.5, 12, -523); ctx.stroke();
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(20, -523); ctx.quadraticCurveTo(27, -525.5, 33, -522.5); ctx.stroke();
    ctx.strokeStyle = 'rgba(130,74,52,0.85)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(17, -511); ctx.quadraticCurveTo(21, -503, 19, -499); ctx.quadraticCurveTo(16, -497.5, 13.5, -499); ctx.stroke();   // nose
    ctx.restore();
    // beard along the jaw, moustache, a gentle mouth
    litPart(ctx, blob([[-19, -508], [-16, -486], [-6, -470], [8, -461], [20, -459], [32, -466], [38, -480], [40, -500], [35, -497], [31, -489], [24, -487], [16, -487], [8, -488], [0, -490], [-8, -496], [-13, -504]], 0.45),
      C.beard, { shade: C.beardSh, sd: 5, rim: C.hairRim, rimA: rimA * 0.7, rd: 2.5 });
    litPart(ctx, blob([[8, -492], [17, -495], [28, -492], [31, -487.5], [25, -488.5], [17, -489], [10, -488.5], [5, -487]], 0.45), C.beard, { shade: C.beardSh, sd: 1.5, lw: 1.8 });
    ctx.save(); ctx.strokeStyle = 'rgba(80,36,24,0.55)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(13, -486.5); ctx.quadraticCurveTo(18.5, -485.2, 24, -486.8); ctx.stroke(); ctx.restore();   // a slight, closed smile
    // hair, the front: a centre part, falling over the near temple and ear
    litPart(ctx, blob([[-26, -552], [-8, -564], [12, -564], [30, -556], [42, -540], [36, -538], [22, -546], [10, -548], [0, -540], [-10, -524], [-16, -502], [-18, -480], [-28, -466], [-34, -490], [-34, -522]], 0.45),
      C.hair, { shade: C.hairSh, sd: 6, rim: C.hairRim, rimA, rd: 3.5 });
    fold(ctx, [[-14, -550], [-24, -520], [-28, -488]], 'rgba(30,18,12,0.55)', 1.5);
    fold(ctx, [[6, -560], [-4, -548], [-14, -530]], 'rgba(160,110,70,0.5)', 1.4);
  };

  // ---------------- the boat and the disciples ----------------
  // design: waterline at y 0, the sheer (gunwale) about y -95, bow at +x; lamp: the lantern position (in these units)
  const ROBES = [['#56688A', '#36435E'], ['#7C7A4E', '#4E4C30'], ['#9A5A3A', '#5E3424'], ['#A8874E', '#6A5432']];
  const SKIN = ['#B98462', '#C28C68', '#A87452', '#B07C5A'];
  const HAIR = ['#3A2A20', '#2E2018', '#4A3424', '#3A2A20'];
  // a disciple seen from the waist up (origin: where he sits on the sheer line); dir: +1 faces right, -1 faces left
  function disciple(ctx, o) {
    const { x, dir, lean = 0.2, v = 0, pose = 'row', L, warmA = 0.9 } = o, [robe, robeSh] = ROBES[v % 4], skin = SKIN[v % 4], hair = HAIR[v % 4];
    ctx.save(); ctx.translate(x, -92); ctx.scale(dir, 1);   // local: facing +x
    const Ld = [L[0] * dir, L[1]];
    const rim = '#FFB46A', cool = '#9FB2D8';
    if (pose === 'point') {
      // half-risen, recoiling a little, the near arm flung out pointing at Him (screen left when dir = -1)
      litPart(ctx, blob([[-26, 4], [-32, -60], [-30, -130], [-16, -168], [10, -172], [28, -150], [30, -80], [26, 4]], 0.45), robe, { L: Ld, shade: robeSh, sd: 9, rim, rimA: warmA, rd: 4 });
      litPart(ctx, limb([14, -156], [46, -218], 11, 9), robe, { L: Ld, shade: robeSh, sd: 6, rim, rimA: warmA, rd: 3 });   // pointing up at Him
      ctx.save(); ctx.translate(47, -221); ctx.rotate(-1.08);
      litPart(ctx, blob([[0, -7], [14, -6], [30, -4], [32, 0], [16, 2], [12, 8], [0, 7]], 0.45), skin, { L: Ld, shade: '#7E5440', sd: 3, rim: '#FFC890', rimA: warmA, rd: 2, lw: 2 });
      ctx.restore();
      litPart(ctx, ell(8, -196, 19, 22, 0.1), skin, { L: Ld, shade: '#7E5440', sd: 6, rim: '#FFC890', rimA: warmA, rd: 3 });
      litPart(ctx, blob([[-12, -214], [6, -222], [24, -210], [20, -198], [6, -206], [-8, -196], [-14, -184], [-22, -196]], 0.45), hair, { L: Ld, shade: '#1E140F', sd: 4, rim: '#8A6040', rimA: warmA * 0.8 });
      litPart(ctx, blob([[26, -190], [22, -176], [10, -172], [0, -180], [8, -186], [20, -186]], 0.45), hair, { L: Ld, shade: '#1E140F', sd: 3, lw: 2 });
    } else if (pose === 'grip') {
      // crouched low, both hands on the gunwale, looking out at Him
      litPart(ctx, blob([[-34, 4], [-40, -40], [-30, -88], [-6, -110], [22, -108], [38, -84], [40, -40], [34, 4]], 0.45), robe, { L: Ld, shade: robeSh, sd: 9, rim, rimA: warmA, rd: 4 });
      litPart(ctx, limb([22, -94], [54, -16], 11, 9), robe, { L: Ld, shade: robeSh, sd: 6, rim, rimA: warmA, rd: 3 });
      litPart(ctx, ell(56, -10, 10, 8), skin, { L: Ld, shade: '#7E5440', sd: 3, lw: 2 });
      litPart(ctx, ell(18, -130, 19, 22, 0.15), skin, { L: Ld, shade: '#7E5440', sd: 6, rim: '#FFC890', rimA: warmA, rd: 3 });
      litPart(ctx, blob([[-6, -148], [12, -156], [32, -146], [34, -126], [24, -130], [10, -140], [-6, -130], [-14, -110], [-20, -130]], 0.45), robe, { L: Ld, shade: robeSh, sd: 5, rim, rimA: warmA * 0.8 });
      litPart(ctx, blob([[36, -126], [32, -112], [20, -108], [10, -116], [18, -122], [30, -122]], 0.45), hair, { L: Ld, shade: '#1E140F', sd: 3, lw: 2 });
    } else {
      // rowing: bent over the oar, arms forward
      ctx.rotate(-lean);
      litPart(ctx, blob([[-30, 4], [-36, -50], [-30, -100], [-10, -128], [18, -132], [36, -112], [40, -60], [34, 4]], 0.45), robe, { L: Ld, shade: robeSh, sd: 9, rim, rimA: warmA, rd: 4 });
      litPart(ctx, limb([16, -112], [54, -74], 11, 9), robe, { L: Ld, shade: robeSh, sd: 6, rim, rimA: warmA, rd: 3 });
      litPart(ctx, ell(58, -70, 9, 8), skin, { L: Ld, shade: '#7E5440', sd: 3, lw: 2 });
      litPart(ctx, ell(14, -152, 19, 22), skin, { L: Ld, shade: '#7E5440', sd: 6, rim: '#FFC890', rimA: warmA, rd: 3 });
      if (v % 2) litPart(ctx, blob([[-10, -170], [10, -178], [32, -166], [34, -146], [24, -150], [10, -160], [-6, -150], [-14, -130], [-20, -150]], 0.45), robe, { L: Ld, shade: robeSh, sd: 5, rim, rimA: warmA * 0.8 });   // head cloth
      else litPart(ctx, blob([[-6, -170], [12, -176], [30, -166], [26, -156], [10, -162], [-4, -152], [-10, -138], [-16, -152]], 0.45), hair, { L: Ld, shade: '#1E140F', sd: 4, rim: '#8A6040', rimA: warmA * 0.8 });
      litPart(ctx, blob([[32, -146], [28, -132], [16, -128], [6, -136], [14, -142], [26, -142]], 0.45), hair, { L: Ld, shade: '#1E140F', sd: 3, lw: 2 });
    }
    ctx.restore();
  }
  // st.fs: foreshortening (the boat seen from the stern quarter): the hull, planks and rigging compress along the boat's length,
  // the disciples keep their full size and sit closer together; st.lamp is the lantern position in the final (compressed) drawing
  FWC.boat = (ctx, st = {}) => {
    const lamp = st.lamp || [22, -372], warm = st.warm ?? 1, fs = st.fs ?? 1;
    const F = (path) => { if (fs === 1) return path; const q = new Path2D(); q.addPath(path, new DOMMatrix().scale(fs, 1)); return q; };
    LWK = st.lwScale ?? 1;
    const Lfrom = (x, y) => { const dx = lamp[0] - x, dy = lamp[1] - y, l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    // rigging behind the crew: mast, the raked yard with the furled sail, the lantern's arm
    const wood = '#5E4130', woodSh = '#2E211C', woodRim = '#E09A5C';
    const px = lamp[0] + 28;
    litPart(ctx, poly([[px - 4, -96], [px + 7, -96], [px + 3, -446], [px - 6, -446]]), wood, { L: Lfrom(px, -300), shade: woodSh, sd: 4, rim: woodRim, rimA: 0.8 * warm, rd: 3 });       // the lantern pole
    litPart(ctx, poly([[px, -440], [lamp[0], -440], [lamp[0], lamp[1] - 22], [lamp[0] + 5, lamp[1] - 22], [lamp[0] + 5, -434], [px, -434]]), wood, { L: [0, -1], shade: woodSh, sd: 2, lw: 2 });
    // the crew (behind the near side of the hull)
    const rowers = [{ x: -150 * fs, lean: 0.35, v: 0 }, { x: 70 * fs, lean: 0.25, v: 1 }];
    const oars = rowers.map((r) => { const c = Math.cos(r.lean), sn = Math.sin(r.lean), H = [r.x - (58 * c - 70 * sn), -92 - 58 * sn - 70 * c], O = [H[0] + 46, -97]; return { H, O, E: [O[0] + (O[0] - H[0]) * 1.6, O[1] + (O[1] - H[1]) * 1.6] }; });
    for (const o of oars) litPart(ctx, limb(o.H, o.O, 4.5, 4.5), wood, { L: Lfrom(o.H[0], o.H[1]), shade: woodSh, sd: 2, rim: woodRim, rimA: 0.6 * warm, rd: 2, lw: 2 });   // looms, inboard
    disciple(ctx, { x: -330 * fs, dir: -1, v: 2, pose: 'point', L: Lfrom(-330 * fs, -200), warmA: 0.55 * warm });
    for (const r of rowers) disciple(ctx, { x: r.x, dir: -1, v: r.v, lean: r.lean, L: Lfrom(r.x, -180), warmA: 0.9 * warm });
    disciple(ctx, { x: 250 * fs, dir: -1, v: 3, pose: 'grip', L: Lfrom(250 * fs, -160), warmA: 0.8 * warm });
    // hull: planked, high stern post (left), rising bow (right)
    const hull = F(blob([[-470, -200], [-452, -198], [-430, -130], [-380, -110], [-200, -94], [0, -92], [200, -94], [380, -114], [440, -150], [462, -208], [478, -206], [462, -110], [410, -16], [300, 40], [0, 50], [-300, 40], [-410, -16], [-462, -110]], 0.3));
    ctx.save(); ctx.clip(hull);
    const hg = ctx.createRadialGradient(lamp[0], lamp[1], 40, lamp[0], lamp[1], 620); hg.addColorStop(0, '#8E5E3C'); hg.addColorStop(0.5, '#5E3E2A'); hg.addColorStop(1, '#34261E');
    ctx.fillStyle = hg; ctx.fillRect(-600, -400, 1200, 500);
    ctx.strokeStyle = 'rgba(28,18,12,0.55)'; ctx.lineWidth = 2.4;   // plank seams
    for (const k of [0.25, 0.5, 0.75]) { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = -470 + i * 23.7, ys = -100 + 6 * Math.cos(x / 470 * 1.5) * 0 - (Math.abs(x) > 380 ? (Math.abs(x) - 380) * 0.9 : 0), yb = 40 - (Math.abs(x) > 300 ? (Math.abs(x) - 300) * 0.5 : 0), y = ys + (yb - ys) * k; i ? ctx.lineTo(x * fs, y) : ctx.moveTo(x * fs, y); } ctx.stroke(); }
    ctx.restore();
    litPart(ctx, hull, 'rgba(0,0,0,0)', { L: Lfrom(0, -60), shade: 'rgba(30,24,30,0.65)', sd: 18, rim: '#FFB66A', rimA: 0.75 * warm, rd: 4 });
    // the gunwale strake, catching the lantern light
    litPart(ctx, F(blob([[-452, -198], [-430, -132], [-380, -114], [-200, -98], [0, -96], [200, -98], [380, -118], [440, -154], [462, -210], [470, -206], [452, -144], [384, -104], [200, -86], [0, -84], [-200, -86], [-384, -100], [-440, -126], [-462, -196]], 0.3)),
      '#7A5238', { L: Lfrom(0, -100), shade: '#3A2A22', sd: 4, rim: '#FFC07A', rimA: 0.9 * warm, rd: 2.5, lw: 2 });
    // the oars outboard, crossing in front of the hull into the water
    for (const o of oars) litPart(ctx, limb(o.O, o.E, 4.5, 4), wood, { L: Lfrom(o.O[0], o.O[1]), shade: woodSh, sd: 2, rim: woodRim, rimA: 0.5 * warm, rd: 2, lw: 2 });
    // the lantern's frame
    ctx.save(); ctx.strokeStyle = LINE; ctx.lineWidth = 4 * LWK; ctx.strokeRect(lamp[0] - 15, lamp[1] - 21, 30, 42); ctx.restore();
    LWK = 1;
  };
})();
