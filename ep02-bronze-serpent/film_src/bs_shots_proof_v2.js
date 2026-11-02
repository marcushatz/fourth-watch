  // ---- The Bronze Serpent: the opening proof (direction_v2 shots 1-3 = VO lines 0-2). THE PLINTH mark: the same camera on [0,0] in every era ----
  const MARK = { on: 'plinth', el: 13, az: 18, dist: 7.2, fov: 30, ty: 1.45, sh: 0.07 };
  // 1 "Moses destroyed a golden calf because Israel worshiped it." the calf on the plinth; fire on "destroyed"; powder (Ex 32:20)
  add('B01', 'diorama', 'sinai', 0, { title: true, text: false, beats: { destroyed: cue(0, 'destroyed') },
    dio: { cam: Object.assign({}, MARK, { move: 'push', amt: 0.16, from: 0.1, dur: 3.8, ease: 'out' }), fx: [{ on: 'calf', at: 'destroyed', do: 'burn', dur: 2.6 }] } });
  // 2 "Centuries later, King Hezekiah destroyed another object Israel had begun worshiping." MATCH CUT on the plinth (2 Kgs 18:4)
  add('B02', 'diorama', 'court', st(1) - PRE, { xin: { kind: 'fade', dur: 0.4 }, beats: { destroyed: cue(1, 'destroyed'), hezekiah: cue(1, 'Hezekiah') },
    dio: { cam: Object.assign({}, MARK, { shakeAt: 'destroyed' }),
      act: [{ who: 'hezekiah', at: st(1) - PRE, pose: 'swing', strike: 'destroyed' }],
      fx: [{ on: 'serpent', at: 'destroyed', do: 'shatter' }, { on: 'smoke', at: 'destroyed', do: 'scatter' }] } });
  // 3 "But this one had been made at God's command." the two plinths: the serpent (left) under God's gold, the calf (right) in ember light (Num 21:8-9; Ex 32:4)
  add('B03', 'diorama', 'compare', st(2) - PRE, { xin: { kind: 'fade', dur: 0.35 }, beats: { command: cue(2, 'command'), god: cue(2, "God's") },
    dio: { cam: { on: [0, 0, 0], el: 9, az: 0, dist: 9.4, fov: 32, ty: 1.35, sh: 0.06, move: 'push', amt: 0.05, from: st(2), dur: 2.2 },
      rays: { on: 'serpentL', from: 'god', dur: 0.7, amt: 1.0, y: 2.6 },
      post: (ctx, t, P, shot, W, H) => {   // a soft divider between the two origins
        const a = Math.min(1, Math.max(0, (t - shot.t0) / 0.5)); const g = ctx.createLinearGradient(0, H * 0.25, 0, H * 0.7);
        g.addColorStop(0, 'rgba(10,8,12,0)'); g.addColorStop(0.5, `rgba(10,8,12,${0.55 * a})`); g.addColorStop(1, 'rgba(10,8,12,0)');
        ctx.fillStyle = g; ctx.fillRect(W / 2 - 3, H * 0.25, 6, H * 0.45);
      } } });
  // 4 "How could something God Himself commanded become an idol?" (beyond the proof: holds the compare frame)
  add('B04', 'diorama', 'compare', st(3) - PRE, { beats: {}, dio: { cam: { on: [-0.9, 0, 0], el: 9, az: 0, dist: 4.8, fov: 30, ty: 1.7, sh: 0.05, move: 'push', amt: 0.1, from: st(3), dur: 3 }, rays: { on: 'serpentL', from: st(3) - 0.2, dur: 0.01, amt: 0.7, y: 2.6 } } });
