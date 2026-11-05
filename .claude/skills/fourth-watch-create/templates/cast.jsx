// Painted people held in the 3D world. Each stands on a world point and follows the plate's camera.
// sprites comes from a JSON file: { name: { w, h, footX, bot } } in pixels, with footX and bot marking the feet.
import { camAt, proj } from "./camera.js";

// Tints a figure to match the scene, with a rim of light on the side the light comes from.
export const TINT = `vec4 pixel(vec2 uv){ vec4 s=texture(u_src,uv); if(s.a<0.01) return vec4(0.0);
  vec2 d=vec2(u_lx,u_ly)*u_rw/u_resolution; float a=(texture(u_src,uv+d).a+texture(u_src,uv+d*0.5).a+texture(u_src,uv+d*1.6).a)/3.0;
  float e=clamp(1.0-a,0.0,1.0); vec3 c=pow(s.rgb,vec3(u_gm))*vec3(u_r,u_g,u_b);
  c=mix(c,vec3(u_hr,u_hg,u_hb),u_hz); c+=vec3(u_er,u_eg,u_eb)*e*u_rm; return vec4(c*s.a,s.a); }`;

// Lays a figure's own outline on the ground along the light.
export const SHADOW = `vec4 pixel(vec2 uv){ vec2 P=uv*vec2(1080.0,1920.0), dd=P-vec2(u_ox,u_oy); float det=u_ax*u_by-u_ay*u_bx; float s=(dd.x*u_by-dd.y*u_bx)/det, t=(u_ax*dd.y-u_ay*dd.x)/det; vec2 q=vec2(u_uf+s,u_vf-t); if(t<-0.02||q.x<-0.05||q.x>1.05||q.y<-0.05||q.y>1.05) return vec4(0.0);
  float b=0.004+0.02*clamp(t,0.0,1.0), a=0.0; for(int i=-2;i<=2;i++){ for(int j=-2;j<=2;j++){ a+=texture(u_src,q+vec2(float(i),float(j))*b).a; } } a/=25.0; float o=a*u_op*(1.0-0.7*clamp(t,0.0,1.0)); return vec4(u_r*o,u_g*o,u_b*o,o); }`;

// One starting light. Add one per scene. Change these once the universal style is set.
export const LOOK = {
  dusk: { r: 1.02, g: 0.93, b: 0.84, gm: 1.05, hr: 0.9, hg: 0.56, hb: 0.33, hz: 0, er: 1, eg: 0.62, eb: 0.3, rm: 0.5, lx: -1, ly: -0.2, rw: 7 },
};

// assets: { name: handle from p.add() }. ppm: (name) => sprite pixels per metre.
export const makeCast = ({ assets, sprites, ppm, looks = LOOK }) => {
  // One figure at a world point, locked to the camera of the shot it's in.
  // o: { shot, at, dur, look, size, move(t) => [dx,dy,dz], opacity, noShadow }
  const Fig = (n, wp, o) => {
    const m = sprites[n], at = o.at, dur = o.dur, pp = ppm(n) * (o.size || 1), N = Math.max(1, Math.ceil(dur / 0.066));
    const X = [], Y = [], S = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, t = at + u * dur * 0.9999, off = o.move ? o.move(t) : [0, 0, 0];
      const q = proj(camAt(o.shot, t), [wp[0] + off[0], wp[1] + off[1], wp[2] + off[2]]);
      const k = Math.min(dur - 0.001, u * dur);
      X.push({ at: k, value: q.x, easing: "linear" });
      Y.push({ at: k, value: q.y, easing: "linear" });
      S.push({ at: k, value: q.s / pp, easing: "linear" });
    }
    const anim = [{ property: "offsetX", keyframes: X }, { property: "offsetY", keyframes: Y }, { property: "scale", keyframes: S }];
    if (o.opacity) anim.push({ property: "opacity", keyframes: o.opacity });
    const sw = m.w * (o.shw || 1), sh = 70 * (o.shh || 1);
    return (
      <frame at={at} duration={dur} x={0} y={0} width={2} height={2} layout="none" origin="center" animate={anim}>
        {o.noShadow ? null : <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} radius={sh / 2} fill="#0B070A" effects={[{ kind: "blur", params: { px: 16 } }]} animate={[{ property: "opacity", keyframes: [{ at: 0, value: o.sho ?? 0.5 }, { at: dur - 0.001, value: o.sho ?? 0.5 }] }]} />}
        <media file={assets[n]} x={-m.footX} y={-m.bot} width={m.w} height={m.h} fit="fill" muted={true} effects={[{ kind: "shader", params: { glsl: TINT, ...looks[o.look || "dusk"] } }]} />
      </frame>
    );
  };

  // A real shadow: the figure's outline on the ground. o.L is the light direction on the ground.
  const Shad = (n, wp, o) => {
    const m = sprites[n], at = o.at, dur = o.dur, hgt = m.h / ppm(n) / (o.size || 1), N = Math.max(1, Math.ceil(dur / 0.1));
    const L = o.L || [0.7, -0.62], ln = ((o.len || 1) * hgt) / 0.34 * 0.62;
    const keys = { ox: [], oy: [], ax: [], ay: [], bx: [], by: [] };
    for (let i = 0; i <= N; i++) {
      const u = i / N, t = at + u * dur * 0.9999, c = camAt(o.shot, t), off = o.move ? o.move(t) : [0, 0, 0];
      const f = [wp[0] + off[0], 0, wp[2] + off[2]], q0 = proj(c, f), q1 = proj(c, [f[0] + (L[0] / 0.94) * ln, 0, f[2] + (L[1] / 0.94) * ln]);
      const wpx = (m.w / (ppm(n) * (o.size || 1))) * q0.s, k = Math.min(dur - 0.001, u * dur);
      const v = { ox: q0.x, oy: q0.y, ax: wpx, ay: 0, bx: q1.x - q0.x, by: q1.y - q0.y };
      for (const K of Object.keys(keys)) keys[K].push({ at: k, value: v[K], easing: "linear" });
    }
    const anim = Object.keys(keys).map((K) => ({ property: "effectParam", effectIndex: 0, effectParam: K, keyframes: keys[K] }));
    if (o.opacity) anim.push({ property: "opacity", keyframes: o.opacity });
    return <media at={at} duration={dur} file={assets[n]} x={0} y={0} width={1080} height={1920} fit="fill" muted={true} effects={[{ kind: "shader", params: { glsl: SHADOW, ox: keys.ox[0].value, oy: keys.oy[0].value, ax: keys.ax[0].value, ay: 0, bx: keys.bx[0].value, by: keys.by[0].value, uf: m.footX / m.w, vf: m.bot / m.h, op: 0.62, r: 0.07, g: 0.045, b: 0.075 } }]} animate={anim} />;
  };

  return { Fig, Shad };
};
