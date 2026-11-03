// painted people held in the 3D world: each one stands on a world point and follows the plate's camera
import { readFileSync } from "node:fs";
import { SHOTS,camAt,proj } from "./shots.js";
export const SP=JSON.parse(readFileSync("/home/user/what-if/fw-serpent/art/sprites.json","utf8"));
export const PPM={hez:736,p:470,mos:526,nic:526};
const ppmOf=(n)=>n.startsWith("hez")?PPM.hez:(n.startsWith("mos")?PPM.mos:(n.startsWith("nic")?PPM.nic:PPM.p));
export const TINTG=`vec4 pixel(vec2 uv){ vec4 s=texture(u_src,uv); if(s.a<0.01) return vec4(0.0);
  vec2 d=vec2(u_lx,u_ly)*u_rw/u_resolution; float a=(texture(u_src,uv+d).a+texture(u_src,uv+d*0.5).a+texture(u_src,uv+d*1.6).a)/3.0;
  float e=clamp(1.0-a,0.0,1.0); vec3 c=pow(s.rgb,vec3(u_gm))*vec3(u_r,u_g,u_b);
  c=mix(c,vec3(u_hr,u_hg,u_hb),u_hz); c+=vec3(u_er,u_eg,u_eb)*e*u_rm; return vec4(c*s.a,s.a); }`;
const INT=!!process.env.FW_INT;
export const PAINTS=`float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y); }
vec4 pixel(vec2 uv){ float bo=floor(u_time*8.0); vec2 s=uv*u_res/120.0+vec2(mod(bo,5.0)*3.1,mod(bo,3.0)*5.7); float a=n2(s*vec2(1.0,0.45))*6.283; vec2 d=vec2(cos(a),sin(a))*(0.5*n2(s*2.3)+0.5*n2(s*5.7)); vec2 w=d*3.5/u_res;
  vec4 c=(texture(u_src,uv+w)*2.0+texture(u_src,uv+w*0.45)+texture(u_src,uv-w*0.6))/4.0; if(c.a<0.004) return vec4(0.0);
  vec3 r=c.rgb/c.a; r=mix(r,floor(r*9.0+0.5)/9.0,0.55); float pig=n2(uv*u_res/2.2)*0.5+n2(uv*u_res/1.1)*0.5; r*=0.955+0.09*pig;
  float ao=mix(u_ao,1.0,smoothstep(0.0,0.20,1.0-uv.y)); r*=ao; return vec4(r*c.a,c.a); }`;
export const SHADG=`vec4 pixel(vec2 uv){ vec2 P=uv*vec2(1080.0,1920.0), dd=P-vec2(u_ox,u_oy); float det=u_ax*u_by-u_ay*u_bx; float s=(dd.x*u_by-dd.y*u_bx)/det, t=(u_ax*dd.y-u_ay*dd.x)/det; vec2 q=vec2(u_uf+s,u_vf-t); if(t<-0.02||q.x<-0.05||q.x>1.05||q.y<-0.05||q.y>1.05) return vec4(0.0);
  float b=0.004+0.02*clamp(t,0.0,1.0), a=0.0; for(int i=-2;i<=2;i++){ for(int j=-2;j<=2;j++){ a+=texture(u_src,q+vec2(float(i),float(j))*b).a; } } a/=25.0; float o=a*u_op*(1.0-0.7*clamp(t,0.0,1.0)); return vec4(u_r*o,u_g*o,u_b*o,o); }`;
export const LOOK={
 dusk:{r:1.02,g:0.93,b:0.84,gm:1.05,hr:.9,hg:.56,hb:.33,hz:0,er:1,eg:.62,eb:.3,rm:.5,lx:-1,ly:-.2,rw:7},
 duskB:{r:.86,g:.76,b:.72,gm:1.1,hr:.9,hg:.56,hb:.33,hz:.12,er:1,eg:.62,eb:.3,rm:.4,lx:-1,ly:-.2,rw:6},
 frozen:{r:.98,g:.87,b:.76,gm:1.1,hr:.9,hg:.56,hb:.33,hz:0,er:1,eg:.72,eb:.38,rm:.5,lx:1,ly:-.2,rw:6},
 amber:{r:.56,g:.40,b:.36,gm:1.25,hr:.3,hg:.17,hb:.12,hz:0,er:1,eg:.58,eb:.22,rm:.5,lx:1,ly:-.3,rw:6},
 amberL:{r:.56,g:.40,b:.36,gm:1.25,hr:.3,hg:.17,hb:.12,hz:0,er:1,eg:.58,eb:.22,rm:.5,lx:-1,ly:-.3,rw:6},
 night:{r:.46,g:.40,b:.50,gm:1.2,hr:.1,hg:.1,hb:.15,hz:0,er:1,eg:.66,eb:.3,rm:.65,lx:1,ly:.1,rw:6},
 brzD:{r:.34,g:.27,b:.34,gm:1.15,hr:.1,hg:.1,hb:.15,hz:0,er:1,eg:.6,eb:.3,rm:.22,lx:0,ly:-1,rw:4},
 brzL:{r:.92,g:.84,b:.72,gm:1.0,hr:.1,hg:.1,hb:.15,hz:0,er:1,eg:.86,eb:.5,rm:.7,lx:0,ly:-1,rw:5},
 ghostlit:{r:.62,g:.52,b:.46,gm:1.1,hr:.1,hg:.1,hb:.15,hz:0,er:1,eg:.76,eb:.36,rm:.7,lx:.4,ly:-1,rw:6},
};
export const makeCast=(A)=>{
  // one painted figure at a world point, locked to the camera of the shot it's in
  const Fig=(n,wp,o)=>{const m=SP[n],at=o.at,dur=o.dur,pp=ppmOf(n)*(o.size||1),st=o.st||0.066,N=Math.max(1,Math.ceil(dur/st));
    const X=[],Y=[],S=[];
    for(let i=0;i<=N;i++){const u=i/N,t=at+u*dur*0.9999,sh=o.shot,c=camAt(sh,t),off=o.move?o.move(t):[0,0,0],q=proj(c,[wp[0]+off[0],wp[1]+off[1],wp[2]+off[2]]);
      const k=Math.min(dur-0.001,u*dur);X.push({at:k,value:q.x,easing:"linear"});Y.push({at:k,value:q.y,easing:"linear"});S.push({at:k,value:q.s/pp,easing:"linear"});}
    const look={...LOOK[o.look||"dusk"]};
    const anim=[{property:"offsetX",keyframes:X},{property:"offsetY",keyframes:Y},{property:"scale",keyframes:S}];
    if(o.opacity)anim.push({property:"opacity",keyframes:o.opacity});
    const sw=m.w*(o.shw||1.0),sh2=70*(o.shh||1);
    return <frame at={at} duration={dur} x={0} y={0} width={2} height={2} layout="none" origin="center" animate={anim}>
      {o.noShadow||INT?null:<rect x={-sw/2+(o.shx||0)} y={-sh2/2} width={sw} height={sh2} radius={sh2/2} fill="#0B070A" effects={[{kind:"blur",params:{px:16}}]} animate={[{property:"opacity",keyframes:[{at:0,value:o.sho??.5},{at:dur-.001,value:o.sho??.5}]}]}/>}
      <media file={A["s_"+n]} x={-m.footX} y={-m.bot} width={m.w} height={m.h} fit="fill" muted={true} effects={INT?[{kind:"shader",params:{glsl:TINTG,...look}},{kind:"shader",params:{glsl:PAINTS,res:Math.max(m.w,m.h),ao:.74}}]:[{kind:"shader",params:{glsl:TINTG,...look}}]}/>
    </frame>;};
  // a real shadow: the figure's own outline laid on the ground along the light, locked to the camera
  const Shad=(n,wp,o)=>{const m=SP[n],at=o.at,dur=o.dur,hgt=m.h/ppmOf(n)/(o.size||1),N=Math.max(1,Math.ceil(dur/.1)),L=o.L||[.70,-.62],ln=(o.len||1)*hgt/.34*.62;
    const keys={ox:[],oy:[],ax:[],ay:[],bx:[],by:[]};
    for(let i=0;i<=N;i++){const u=i/N,t=at+u*dur*.9999,c=camAt(o.shot,t),off=o.move?o.move(t):[0,0,0],f=[wp[0]+off[0],0,wp[2]+off[2]],q0=proj(c,f),q1=proj(c,[f[0]+L[0]/.94*ln,0,f[2]+L[1]/.94*ln]),wpx=m.w/(ppmOf(n)*(o.size||1))*q0.s,k=Math.min(dur-.001,u*dur);
      const v={ox:q0.x,oy:q0.y,ax:wpx,ay:0,bx:q1.x-q0.x,by:q1.y-q0.y};for(const K of Object.keys(keys))keys[K].push({at:k,value:v[K],easing:"linear"});}
    const anim=Object.keys(keys).map(K=>({property:"effectParam",effectIndex:0,effectParam:K,keyframes:keys[K]}));
    if(o.opacity)anim.push({property:"opacity",keyframes:o.opacity});
    return <media at={at} duration={dur} file={A["s_"+n]} x={0} y={0} width={1080} height={1920} fit="fill" muted={true} effects={[{kind:"shader",params:{glsl:SHADG,ox:keys.ox[0].value,oy:keys.oy[0].value,ax:keys.ax[0].value,ay:0,bx:keys.bx[0].value,by:keys.by[0].value,uf:m.footX/m.w,vf:m.bot/m.h,op:.62,r:.07,g:.045,b:.075}}]} animate={anim}/>;};
  return {Fig,Shad};
};
